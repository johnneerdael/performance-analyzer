// Data Parser Service Implementation
import { DataParser, TestParameters, TestResults, IperfTestResult, DnsTestResult, ParsingError, FileSystemError } from '../models';
import fs from 'fs-extra';
import { DefaultErrorHandler } from '../utils/ErrorHandler';
import { DataValidator } from '../utils/DataValidator';
import { StreamingJsonParser } from '../utils/StreamingJsonParser';
import path from 'path';

/**
 * Default implementation of the DataParser interface
 * Parses test parameters and results from JSON files
 */
export class DefaultDataParser implements DataParser {
  private errorHandler: DefaultErrorHandler;
  private validator: DataValidator;
  private streamingParser: StreamingJsonParser;
  private parserCache: Map<string, any> = new Map();
  private fileSizeThresholdMB: number = 10; // Files larger than this will use streaming parser

  /**
   * Creates a new DefaultDataParser instance
   * @param errorHandler Optional custom error handler
   */
  constructor(errorHandler?: DefaultErrorHandler) {
    this.errorHandler = errorHandler || new DefaultErrorHandler();
    this.validator = new DataValidator(this.errorHandler);
    this.streamingParser = new StreamingJsonParser(this.errorHandler);
  }

  /**
   * Parse test parameters from a JSON file
   * @param filePath Path to the parameters JSON file
   * @returns A promise that resolves to the parsed test parameters
   * @throws ParsingError if the file cannot be read or parsed
   */
  async parseParameters(filePath: string): Promise<TestParameters> {
    try {
      // Read the file
      const fileContent = await this.readFile(filePath);
      
      // Parse JSON
      const rawData = this.parseJson(fileContent, filePath);
      
      // Validate and transform the data
      const parameters: TestParameters = {
        backendServer: this.validateString(rawData['backend-server'], 'backend-server'),
        mtu: this.validateNumber(parseInt(rawData['mtu'], 10), 'mtu'),
        queryLogging: this.validateLoggingStatus(rawData['query-logging']),
        timestamp: rawData['timestamp'] || undefined
      };
      
      // Validate the parameters
      const validationResult = this.validator.validateTestParameters(parameters);
      
      if (!validationResult.isValid) {
        const errorMessage = `Invalid test parameters: ${validationResult.errors
          .filter(e => e.severity === 'error')
          .map(e => `${e.field} - ${e.message}`)
          .join(', ')}`;
        
        throw new Error(errorMessage);
      }
      
      return parameters;
    } catch (error) {
      // If it's already a ParsingError, just rethrow it
      if ((error as ParsingError).filePath) {
        throw error;
      }
      
      // Create a ParsingError with file information
      const parsingError = new Error(error instanceof Error ? error.message : String(error)) as ParsingError;
      parsingError.filePath = filePath;
      
      // Add line and column information if available
      if (error instanceof SyntaxError && 'lineNumber' in error) {
        parsingError.lineNumber = (error as any).lineNumber;
        parsingError.columnNumber = (error as any).columnNumber;
      }
      
      // Handle the error
      const isRecoverable = this.errorHandler.handleParsingError(parsingError);
      
      // If the error is not recoverable, throw it
      if (!isRecoverable) {
        throw parsingError;
      }
      
      // Return a minimal valid object for recoverable errors
      return {
        backendServer: 'unknown',
        mtu: 1500, // Default MTU
        queryLogging: 'disabled'
      };
    }
  }

  /**
   * Parse test results from a JSON file
   * @param filePath Path to the results JSON file
   * @returns A promise that resolves to the parsed test results
   * @throws ParsingError if the file cannot be read or parsed
   */
  async parseResults(filePath: string): Promise<TestResults> {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(filePath);
      if (this.parserCache.has(cacheKey)) {
        console.log(`[DataParser] Using cached results for ${path.basename(filePath)}`);
        return this.parserCache.get(cacheKey);
      }
      
      // Initialize the results object
      const results: TestResults = {
        iperfTests: [],
        dnsResults: []
      };
      
      // Check if this is a large file that should use streaming
      const isLarge = this.streamingParser.isLargeFile(filePath, this.fileSizeThresholdMB);
      
      if (isLarge) {
        console.log(`[DataParser] Using streaming parser for large file: ${path.basename(filePath)}`);
        
        // Parse iperf tests using streaming
        await this.streamingParser.parseJsonStream<any>(
          {
            filePath,
            selector: 'iperf_tests.*',
            batchSize: 50,
            errorHandler: this.errorHandler
          },
          async (batch) => {
            // Process each batch of iperf tests
            const parsedTests = this.parseIperfTests(batch);
            results.iperfTests.push(...parsedTests);
          }
        );
        
        // Parse DNS results using streaming
        await this.streamingParser.parseJsonStream<any>(
          {
            filePath,
            selector: 'dns_tests.*',
            batchSize: 100,
            errorHandler: this.errorHandler
          },
          async (batch) => {
            // Process each batch of DNS tests
            const parsedTests = this.parseDnsTests(batch);
            results.dnsResults.push(...parsedTests);
          }
        );
      } else {
        // For smaller files, use the standard approach
        // Read the file
        const fileContent = await this.readFile(filePath);
        
        // Parse JSON
        const rawData = this.parseJson(fileContent, filePath);
        
        // Parse iperf tests if available
        if (rawData.iperf_tests && Array.isArray(rawData.iperf_tests)) {
          results.iperfTests = this.parseIperfTests(rawData.iperf_tests);
        }
        
        // Parse DNS results if available
        if (rawData.dns_tests && Array.isArray(rawData.dns_tests)) {
          results.dnsResults = this.parseDnsTests(rawData.dns_tests);
        }
      }
      
      // Validate the results
      const validationResult = this.validator.validateTestResults(results);
      
      // If validation passed, cache and return the sanitized data
      if (validationResult.isValid && validationResult.data) {
        this.parserCache.set(cacheKey, validationResult.data);
        return validationResult.data;
      }
      
      // If there are only warnings, cache and return the sanitized data
      if (validationResult.data && validationResult.errors.every(e => e.severity === 'warning')) {
        this.parserCache.set(cacheKey, validationResult.data);
        return validationResult.data;
      }
      
      // If there are errors, throw an exception
      const errorMessage = `Invalid test results: ${validationResult.errors
        .filter(e => e.severity === 'error')
        .map(e => `${e.field} - ${e.message}`)
        .join(', ')}`;
      
      throw new Error(errorMessage);
    } catch (error) {
      // If it's already a ParsingError, just rethrow it
      if ((error as ParsingError).filePath) {
        throw error;
      }
      
      // Create a ParsingError with file information
      const parsingError = new Error(error instanceof Error ? error.message : String(error)) as ParsingError;
      parsingError.filePath = filePath;
      
      // Add line and column information if available
      if (error instanceof SyntaxError && 'lineNumber' in error) {
        parsingError.lineNumber = (error as any).lineNumber;
        parsingError.columnNumber = (error as any).columnNumber;
      }
      
      // Handle the error
      const isRecoverable = this.errorHandler.handleParsingError(parsingError);
      
      // If the error is not recoverable, throw it
      if (!isRecoverable) {
        throw parsingError;
      }
      
      // Return a minimal valid object for recoverable errors
      return {
        iperfTests: [],
        dnsResults: []
      };
    }
  }
  
  /**
   * Read a file with error handling
   * @param filePath Path to the file to read
   * @returns The file content as a string
   * @throws FileSystemError if the file cannot be read
   */
  private async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      // Create a FileSystemError with file information
      const fsError = new Error(error instanceof Error ? error.message : String(error)) as FileSystemError;
      fsError.code = (error as any).code || 'UNKNOWN';
      fsError.path = filePath;
      
      // Handle the error
      const isRecoverable = this.errorHandler.handleFileSystemError(fsError);
      
      // If the error is not recoverable, throw it
      if (!isRecoverable) {
        throw fsError;
      }
      
      // Return empty string for recoverable errors
      return '{}';
    }
  }
  
  /**
   * Parse JSON with error handling
   * @param content JSON content to parse
   * @param filePath Path to the file (for error reporting)
   * @returns The parsed JSON object
   * @throws ParsingError if the JSON cannot be parsed
   */
  private parseJson(content: string, filePath: string): any {
    try {
      return JSON.parse(content);
    } catch (error) {
      // Create a ParsingError with file information
      const parsingError = new Error(error instanceof Error ? error.message : String(error)) as ParsingError;
      parsingError.filePath = filePath;
      
      // Add line and column information if available
      if (error instanceof SyntaxError && 'lineNumber' in error) {
        parsingError.lineNumber = (error as any).lineNumber;
        parsingError.columnNumber = (error as any).columnNumber;
      }
      
      // Handle the error
      const isRecoverable = this.errorHandler.handleParsingError(parsingError);
      
      // If the error is not recoverable, throw it
      if (!isRecoverable) {
        throw parsingError;
      }
      
      // Return empty object for recoverable errors
      return {};
    }
  }

  /**
   * Parse iperf test results from raw data
   * @param rawTests Array of raw iperf test data
   * @returns Array of parsed IperfTestResult objects
   */
  private parseIperfTests(rawTests: any[]): IperfTestResult[] {
    return rawTests.map(test => {
      const result: IperfTestResult = {
        server: this.validateString(test.server, 'server'),
        scenario: this.validateString(test.scenario, 'scenario'),
        success: this.validateBoolean(test.success, 'success')
      };
      
      // Add optional fields if they exist
      if (test.start_time !== undefined) result.startTime = this.validateNumber(test.start_time, 'start_time');
      if (test.end_time !== undefined) result.endTime = this.validateNumber(test.end_time, 'end_time');
      if (test.duration !== undefined) result.duration = this.validateNumber(test.duration, 'duration');
      if (test.num_streams !== undefined) result.numStreams = this.validateNumber(test.num_streams, 'num_streams');
      if (test.cpu_utilization_host !== undefined) result.cpuUtilizationHost = this.validateNumber(test.cpu_utilization_host, 'cpu_utilization_host');
      if (test.cpu_utilization_remote !== undefined) result.cpuUtilizationRemote = this.validateNumber(test.cpu_utilization_remote, 'cpu_utilization_remote');
      
      // TCP specific fields
      if (test.tcp_mss_default !== undefined) result.tcpMssDefault = this.validateNumber(test.tcp_mss_default, 'tcp_mss_default');
      if (test.retransmits !== undefined) result.retransmits = this.validateNumber(test.retransmits, 'retransmits');
      if (test.snd_cwnd !== undefined) result.sndCwnd = this.validateNumber(test.snd_cwnd, 'snd_cwnd');
      
      // UDP specific fields
      if (test.jitter_ms !== undefined) result.jitterMs = this.validateNumber(test.jitter_ms, 'jitter_ms');
      if (test.packets !== undefined) result.packets = this.validateNumber(test.packets, 'packets');
      if (test.lost_packets !== undefined) result.lostPackets = this.validateNumber(test.lost_packets, 'lost_packets');
      if (test.packet_loss !== undefined) result.packetLoss = this.validateNumber(test.packet_loss, 'packet_loss');
      
      // Common metrics
      if (test.blksize !== undefined) result.blksize = this.validateNumber(test.blksize, 'blksize');
      if (test.bytes !== undefined) result.bytes = this.validateNumber(test.bytes, 'bytes');
      if (test.bits_per_second !== undefined) result.bitsPerSecond = this.validateNumber(test.bits_per_second, 'bits_per_second');
      if (test.bandwidth_mbps !== undefined) result.bandwidthMbps = this.validateNumber(test.bandwidth_mbps, 'bandwidth_mbps');
      if (test.error !== undefined) result.error = this.validateString(test.error, 'error');
      
      // Store raw data for detailed analysis
      result.allRawData = test.all_raw_data;
      
      return result;
    });
  }

  /**
   * Parse DNS test results from raw data
   * @param rawTests Array of raw DNS test data
   * @returns Array of parsed DnsTestResult objects
   */
  private parseDnsTests(rawTests: any[]): DnsTestResult[] {
    return rawTests.map(test => {
      const result: DnsTestResult = {
        domain: this.validateString(test.domain, 'domain'),
        dnsServer: this.validateString(test.dns_server, 'dns_server'),
        success: this.validateBoolean(test.success, 'success')
      };
      
      // Add optional fields if they exist
      if (test.response_time_ms !== undefined) result.responseTimeMs = this.validateNumber(test.response_time_ms, 'response_time_ms');
      if (test.query_time_ms !== undefined) result.queryTimeMs = this.validateNumber(test.query_time_ms, 'query_time_ms');
      if (test.status !== undefined) result.status = this.validateString(test.status, 'status');
      if (test.resolved_ips !== undefined && Array.isArray(test.resolved_ips)) {
        result.resolvedIps = test.resolved_ips.map((ip: any) => this.validateString(ip, 'resolved_ip'));
      }
      if (test.error !== undefined) result.error = this.validateString(test.error, 'error');
      
      return result;
    });
  }

  /**
   * Validate that a value is a string
   * @param value The value to validate
   * @param fieldName The name of the field being validated
   * @returns The validated string
   * @throws Error if the value is not a string
   */
  private validateString(value: any, fieldName: string): string {
    if (typeof value !== 'string') {
      throw new Error(`Field '${fieldName}' must be a string, got ${typeof value}`);
    }
    return value;
  }

  /**
   * Validate that a value is a number
   * @param value The value to validate
   * @param fieldName The name of the field being validated
   * @returns The validated number
   * @throws Error if the value is not a number or is NaN
   */
  private validateNumber(value: any, fieldName: string): number {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error(`Field '${fieldName}' must be a number, got ${typeof value}`);
    }
    return value;
  }

  /**
   * Validate that a value is a boolean
   * @param value The value to validate
   * @param fieldName The name of the field being validated
   * @returns The validated boolean
   * @throws Error if the value is not a boolean
   */
  private validateBoolean(value: any, fieldName: string): boolean {
    if (typeof value !== 'boolean') {
      throw new Error(`Field '${fieldName}' must be a boolean, got ${typeof value}`);
    }
    return value;
  }

  /**
   * Validate and convert logging status to the expected format
   * @param value The logging status value to validate
   * @returns The validated logging status
   * @throws Error if the value is not 'enabled' or 'disabled'
   */
  private validateLoggingStatus(value: any): 'enabled' | 'disabled' {
    if (value !== 'enabled' && value !== 'disabled') {
      throw new Error(`Logging status must be 'enabled' or 'disabled', got '${value}'`);
    }
    return value;
  }
  
  /**
   * Generate a cache key for a file path
   * @param filePath Path to the file
   * @returns Cache key string
   */
  private getCacheKey(filePath: string): string {
    // Use the file path and last modified time as the cache key
    try {
      const stats = fs.statSync(filePath);
      return `${filePath}:${stats.mtimeMs}`;
    } catch (error) {
      // If we can't get file stats, just use the path
      return filePath;
    }
  }
  
  /**
   * Clear the parser cache
   */
  public clearCache(): void {
    this.parserCache.clear();
    console.log('[DataParser] Cache cleared');
  }
  
  /**
   * Get the current cache size
   * @returns Number of items in the cache
   */
  public getCacheSize(): number {
    return this.parserCache.size;
  }
  
  /**
   * Set the file size threshold for streaming parsing
   * @param thresholdMB Threshold in megabytes
   */
  public setFileSizeThreshold(thresholdMB: number): void {
    if (thresholdMB > 0) {
      this.fileSizeThresholdMB = thresholdMB;
      console.log(`[DataParser] File size threshold set to ${thresholdMB}MB`);
    }
  }
}

export { DataParser };