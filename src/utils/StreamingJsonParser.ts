// Streaming JSON Parser Utility
import fs from 'fs';
import { createReadStream } from 'fs';
import { FileSystemError, ParsingError } from '../models';
import { DefaultErrorHandler } from './ErrorHandler';
import { pipeline } from 'stream/promises';
import { Transform } from 'stream';
import * as JSONStream from 'JSONStream';

/**
 * Options for the streaming JSON parser
 */
export interface StreamingParserOptions {
  /**
   * Path to the JSON file to parse
   */
  filePath: string;
  
  /**
   * JSONPath expression for selecting objects from the JSON stream
   * @example '*.iperf_tests.*' to select all iperf test objects
   * @example 'dns_tests.*' to select all DNS test objects
   */
  selector: string;
  
  /**
   * Maximum number of objects to buffer before emitting a batch
   * @default 100
   */
  batchSize?: number;
  
  /**
   * Error handler for handling parsing errors
   */
  errorHandler?: DefaultErrorHandler;
}

/**
 * Streaming JSON parser for efficiently processing large JSON files
 * Uses JSONStream to parse JSON files without loading the entire file into memory
 */
export class StreamingJsonParser {
  private errorHandler: DefaultErrorHandler;
  
  /**
   * Creates a new StreamingJsonParser instance
   * @param errorHandler Optional custom error handler
   */
  constructor(errorHandler?: DefaultErrorHandler) {
    this.errorHandler = errorHandler || new DefaultErrorHandler();
  }
  
  /**
   * Parse a JSON file using streaming and process objects in batches
   * @param options Parser options
   * @param processBatch Function to process each batch of objects
   * @returns Promise that resolves when parsing is complete
   */
  async parseJsonStream<T>(
    options: StreamingParserOptions,
    processBatch: (batch: T[]) => Promise<void>
  ): Promise<void> {
    const { filePath, selector, batchSize = 100 } = options;
    
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        const error = new Error(`File does not exist: ${filePath}`) as FileSystemError;
        error.code = 'ENOENT';
        error.path = filePath;
        this.errorHandler.handleFileSystemError(error);
        throw error;
      }
      
      // Create a buffer to collect objects
      let buffer: T[] = [];
      
      // Create a transform stream to batch objects
      const batchTransform = new Transform({
        objectMode: true,
        transform: async (data, encoding, callback) => {
          try {
            // Add object to buffer
            buffer.push(data as T);
            
            // If buffer reaches batch size, process the batch
            if (buffer.length >= batchSize) {
              await processBatch([...buffer]);
              buffer = [];
            }
            
            callback();
          } catch (error) {
            callback(error as Error);
          }
        },
        flush: async (callback) => {
          try {
            // Process any remaining objects in the buffer
            if (buffer.length > 0) {
              await processBatch([...buffer]);
              buffer = [];
            }
            
            callback();
          } catch (error) {
            callback(error as Error);
          }
        }
      });
      
      // Create the pipeline
      await pipeline(
        createReadStream(filePath),
        JSONStream.parse(selector),
        batchTransform
      );
    } catch (error) {
      // If it's already a FileSystemError or ParsingError, just rethrow it
      if ((error as FileSystemError).path || (error as ParsingError).filePath) {
        throw error;
      }
      
      // Create a ParsingError with file information
      const parsingError = new Error(error instanceof Error ? error.message : String(error)) as ParsingError;
      parsingError.filePath = filePath;
      
      // Handle the error
      this.errorHandler.handleParsingError(parsingError);
      
      throw parsingError;
    }
  }
  
  /**
   * Count the number of objects matching a selector in a JSON file
   * @param options Parser options
   * @returns Promise that resolves to the count of matching objects
   */
  async countObjects(options: StreamingParserOptions): Promise<number> {
    let count = 0;
    
    await this.parseJsonStream<any>(
      options,
      async (batch) => {
        count += batch.length;
      }
    );
    
    return count;
  }
  
  /**
   * Check if a JSON file is larger than a specified size
   * @param filePath Path to the JSON file
   * @param sizeThresholdMB Size threshold in megabytes
   * @returns True if the file is larger than the threshold
   */
  isLargeFile(filePath: string, sizeThresholdMB: number = 10): boolean {
    try {
      const stats = fs.statSync(filePath);
      const fileSizeMB = stats.size / (1024 * 1024);
      return fileSizeMB > sizeThresholdMB;
    } catch (error) {
      const fsError = new Error(error instanceof Error ? error.message : String(error)) as FileSystemError;
      fsError.code = (error as any).code || 'UNKNOWN';
      fsError.path = filePath;
      this.errorHandler.handleFileSystemError(fsError);
      return false;
    }
  }
}