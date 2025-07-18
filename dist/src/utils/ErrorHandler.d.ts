import { ErrorHandler, FileSystemError, ParsingError, AnalysisError } from '../models';
/**
 * Severity levels for errors
 */
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
/**
 * Error log entry structure
 */
export interface ErrorLogEntry {
    timestamp: string;
    severity: ErrorSeverity;
    context: string;
    message: string;
    stack?: string | undefined;
    code?: string | undefined;
    path?: string | undefined;
    recoverable: boolean;
    additionalInfo?: Record<string, any> | undefined;
}
/**
 * Default implementation of the ErrorHandler interface
 * Provides centralized error handling for the Network Performance Analyzer
 */
export declare class DefaultErrorHandler implements ErrorHandler {
    private errorLog;
    private logFilePath;
    private maxLogEntries;
    /**
     * Creates a new DefaultErrorHandler instance
     * @param options Configuration options for the error handler
     */
    constructor(options?: {
        logToFile?: boolean;
        logDirectory?: string;
        maxLogEntries?: number;
    });
    /**
     * Handle file system related errors
     * @param error The file system error that occurred
     * @returns True if the error was handled and is recoverable, false otherwise
     */
    handleFileSystemError(error: FileSystemError): boolean;
    /**
     * Handle data parsing errors
     * @param error The parsing error that occurred
     * @returns True if the error was handled and is recoverable, false otherwise
     */
    handleParsingError(error: ParsingError): boolean;
    /**
     * Handle analysis related errors
     * @param error The analysis error that occurred
     * @returns True if the error was handled and is recoverable, false otherwise
     */
    handleAnalysisError(error: AnalysisError): boolean;
    /**
     * Handle validation errors
     * @param error The validation error that occurred
     * @param entityType The type of entity being validated
     * @param entityId Identifier for the entity being validated
     * @returns True if the error was handled and is recoverable, false otherwise
     */
    handleValidationError(error: Error, entityType: string, entityId: string): boolean;
    /**
     * Log an error with context information
     * @param error The error to log
     * @param context Additional context information
     */
    logError(error: Error, context: string): void;
    /**
     * Get all logged errors
     * @returns Array of error log entries
     */
    getErrorLog(): ErrorLogEntry[];
    /**
     * Check if there are any errors of the specified severity or higher
     * @param minSeverity Minimum severity level to check for
     * @returns True if there are errors at or above the specified severity
     */
    hasErrorsOfSeverity(minSeverity: ErrorSeverity): boolean;
    /**
     * Clear the error log
     */
    clearErrorLog(): void;
    /**
     * Store an error log entry
     * @param entry The error log entry to store
     */
    private storeErrorLog;
    /**
     * Determine the severity of a file system error
     * @param error The file system error
     * @returns The error severity
     */
    private determineFileSystemErrorSeverity;
    /**
     * Determine if a file system error is recoverable
     * @param error The file system error
     * @returns True if the error is recoverable
     */
    private isFileSystemErrorRecoverable;
}
export { ErrorHandler };
//# sourceMappingURL=ErrorHandler.d.ts.map