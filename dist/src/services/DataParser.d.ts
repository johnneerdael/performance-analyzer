import { DataParser, TestParameters, TestResults } from '../models';
import { DefaultErrorHandler } from '../utils/ErrorHandler';
/**
 * Default implementation of the DataParser interface
 * Parses test parameters and results from JSON files
 */
export declare class DefaultDataParser implements DataParser {
    private errorHandler;
    private validator;
    private streamingParser;
    private parserCache;
    private fileSizeThresholdMB;
    /**
     * Creates a new DefaultDataParser instance
     * @param errorHandler Optional custom error handler
     */
    constructor(errorHandler?: DefaultErrorHandler);
    /**
     * Parse test parameters from a JSON file
     * @param filePath Path to the parameters JSON file
     * @returns A promise that resolves to the parsed test parameters
     * @throws ParsingError if the file cannot be read or parsed
     */
    parseParameters(filePath: string): Promise<TestParameters>;
    /**
     * Parse test results from a JSON file
     * @param filePath Path to the results JSON file
     * @returns A promise that resolves to the parsed test results
     * @throws ParsingError if the file cannot be read or parsed
     */
    parseResults(filePath: string): Promise<TestResults>;
    /**
     * Read a file with error handling
     * @param filePath Path to the file to read
     * @returns The file content as a string
     * @throws FileSystemError if the file cannot be read
     */
    private readFile;
    /**
     * Parse JSON with error handling
     * @param content JSON content to parse
     * @param filePath Path to the file (for error reporting)
     * @returns The parsed JSON object
     * @throws ParsingError if the JSON cannot be parsed
     */
    private parseJson;
    /**
     * Parse iperf test results from raw data
     * @param rawTests Array of raw iperf test data
     * @returns Array of parsed IperfTestResult objects
     */
    private parseIperfTests;
    /**
     * Parse DNS test results from raw data
     * @param rawTests Array of raw DNS test data
     * @returns Array of parsed DnsTestResult objects
     */
    private parseDnsTests;
    /**
     * Validate that a value is a string
     * @param value The value to validate
     * @param fieldName The name of the field being validated
     * @returns The validated string
     * @throws Error if the value is not a string
     */
    private validateString;
    /**
     * Validate that a value is a number
     * @param value The value to validate
     * @param fieldName The name of the field being validated
     * @returns The validated number
     * @throws Error if the value is not a number or is NaN
     */
    private validateNumber;
    /**
     * Validate that a value is a boolean
     * @param value The value to validate
     * @param fieldName The name of the field being validated
     * @returns The validated boolean
     * @throws Error if the value is not a boolean
     */
    private validateBoolean;
    /**
     * Validate and convert logging status to the expected format
     * @param value The logging status value to validate
     * @returns The validated logging status
     * @throws Error if the value is not 'enabled' or 'disabled'
     */
    private validateLoggingStatus;
    /**
     * Generate a cache key for a file path
     * @param filePath Path to the file
     * @returns Cache key string
     */
    private getCacheKey;
    /**
     * Clear the parser cache
     */
    clearCache(): void;
    /**
     * Get the current cache size
     * @returns Number of items in the cache
     */
    getCacheSize(): number;
    /**
     * Set the file size threshold for streaming parsing
     * @param thresholdMB Threshold in megabytes
     */
    setFileSizeThreshold(thresholdMB: number): void;
}
export { DataParser };
//# sourceMappingURL=DataParser.d.ts.map