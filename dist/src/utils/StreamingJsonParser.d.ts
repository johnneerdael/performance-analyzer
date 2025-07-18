import { DefaultErrorHandler } from './ErrorHandler';
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
export declare class StreamingJsonParser {
    private errorHandler;
    /**
     * Creates a new StreamingJsonParser instance
     * @param errorHandler Optional custom error handler
     */
    constructor(errorHandler?: DefaultErrorHandler);
    /**
     * Parse a JSON file using streaming and process objects in batches
     * @param options Parser options
     * @param processBatch Function to process each batch of objects
     * @returns Promise that resolves when parsing is complete
     */
    parseJsonStream<T>(options: StreamingParserOptions, processBatch: (batch: T[]) => Promise<void>): Promise<void>;
    /**
     * Count the number of objects matching a selector in a JSON file
     * @param options Parser options
     * @returns Promise that resolves to the count of matching objects
     */
    countObjects(options: StreamingParserOptions): Promise<number>;
    /**
     * Check if a JSON file is larger than a specified size
     * @param filePath Path to the JSON file
     * @param sizeThresholdMB Size threshold in megabytes
     * @returns True if the file is larger than the threshold
     */
    isLargeFile(filePath: string, sizeThresholdMB?: number): boolean;
}
//# sourceMappingURL=StreamingJsonParser.d.ts.map