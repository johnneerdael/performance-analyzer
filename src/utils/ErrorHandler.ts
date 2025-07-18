// Error Handler Utility
import { ErrorHandler, FileSystemError, ParsingError, AnalysisError } from '../models';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Severity levels for errors
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
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
export class DefaultErrorHandler implements ErrorHandler {
  private errorLog: ErrorLogEntry[] = [];
  private logFilePath: string | null = null;
  private maxLogEntries: number = 1000;
  
  /**
   * Creates a new DefaultErrorHandler instance
   * @param options Configuration options for the error handler
   */
  constructor(options?: {
    logToFile?: boolean;
    logDirectory?: string;
    maxLogEntries?: number;
  }) {
    if (options?.logToFile) {
      const logDir = options.logDirectory || './logs';
      
      // Ensure log directory exists
      if (!fs.existsSync(logDir)) {
        try {
          fs.mkdirSync(logDir, { recursive: true });
        } catch (err) {
          console.error(`Failed to create log directory: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
      
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      this.logFilePath = path.join(logDir, `error-log-${timestamp}.json`);
    }
    
    if (options?.maxLogEntries) {
      this.maxLogEntries = options.maxLogEntries;
    }
  }

  /**
   * Handle file system related errors
   * @param error The file system error that occurred
   * @returns True if the error was handled and is recoverable, false otherwise
   */
  handleFileSystemError(error: FileSystemError): boolean {
    const context = `File system error at path: ${error.path}`;
    const severity = this.determineFileSystemErrorSeverity(error);
    const recoverable = this.isFileSystemErrorRecoverable(error);
    
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      severity,
      context,
      message: error.message,
      stack: error.stack,
      code: error.code,
      path: error.path,
      recoverable,
      additionalInfo: {
        errorType: 'FileSystemError'
      }
    };
    
    this.logError(error, context);
    this.storeErrorLog(logEntry);
    
    return recoverable;
  }

  /**
   * Handle data parsing errors
   * @param error The parsing error that occurred
   * @returns True if the error was handled and is recoverable, false otherwise
   */
  handleParsingError(error: ParsingError): boolean {
    const location = error.lineNumber 
      ? `line ${error.lineNumber}${error.columnNumber ? `, column ${error.columnNumber}` : ''}` 
      : 'unknown location';
    
    const context = `Parsing error in file ${error.filePath} at ${location}`;
    const severity = ErrorSeverity.MEDIUM;
    const recoverable = true; // Most parsing errors are recoverable by skipping the problematic file
    
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      severity,
      context,
      message: error.message,
      stack: error.stack,
      path: error.filePath,
      recoverable,
      additionalInfo: {
        errorType: 'ParsingError',
        lineNumber: error.lineNumber,
        columnNumber: error.columnNumber
      }
    };
    
    this.logError(error, context);
    this.storeErrorLog(logEntry);
    
    return recoverable;
  }

  /**
   * Handle analysis related errors
   * @param error The analysis error that occurred
   * @returns True if the error was handled and is recoverable, false otherwise
   */
  handleAnalysisError(error: AnalysisError): boolean {
    const context = `Analysis error in ${error.analysisType}${
      error.datasetName ? ` for dataset ${error.datasetName}` : ''
    }`;
    
    const severity = ErrorSeverity.MEDIUM;
    const recoverable = true; // Most analysis errors are recoverable by continuing with other datasets
    
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      severity,
      context,
      message: error.message,
      stack: error.stack,
      recoverable,
      additionalInfo: {
        errorType: 'AnalysisError',
        analysisType: error.analysisType,
        datasetName: error.datasetName
      }
    };
    
    this.logError(error, context);
    this.storeErrorLog(logEntry);
    
    return recoverable;
  }

  /**
   * Handle validation errors
   * @param error The validation error that occurred
   * @param entityType The type of entity being validated
   * @param entityId Identifier for the entity being validated
   * @returns True if the error was handled and is recoverable, false otherwise
   */
  handleValidationError(error: Error, entityType: string, entityId: string): boolean {
    const context = `Validation error for ${entityType}: ${entityId}`;
    const severity = ErrorSeverity.MEDIUM;
    const recoverable = true; // Most validation errors are recoverable
    
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      severity,
      context,
      message: error.message,
      stack: error.stack,
      recoverable,
      additionalInfo: {
        errorType: 'ValidationError',
        entityType,
        entityId
      }
    };
    
    this.logError(error, context);
    this.storeErrorLog(logEntry);
    
    return recoverable;
  }

  /**
   * Log an error with context information
   * @param error The error to log
   * @param context Additional context information
   */
  logError(error: Error, context: string): void {
    console.error(`[ERROR] ${context}: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
  }

  /**
   * Get all logged errors
   * @returns Array of error log entries
   */
  getErrorLog(): ErrorLogEntry[] {
    return [...this.errorLog];
  }

  /**
   * Check if there are any errors of the specified severity or higher
   * @param minSeverity Minimum severity level to check for
   * @returns True if there are errors at or above the specified severity
   */
  hasErrorsOfSeverity(minSeverity: ErrorSeverity): boolean {
    const severityLevels = [
      ErrorSeverity.LOW,
      ErrorSeverity.MEDIUM,
      ErrorSeverity.HIGH,
      ErrorSeverity.CRITICAL
    ];
    
    const minSeverityIndex = severityLevels.indexOf(minSeverity);
    if (minSeverityIndex === -1) return false;
    
    return this.errorLog.some(entry => {
      const entrySeverityIndex = severityLevels.indexOf(entry.severity);
      return entrySeverityIndex >= minSeverityIndex;
    });
  }

  /**
   * Clear the error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Store an error log entry
   * @param entry The error log entry to store
   */
  private storeErrorLog(entry: ErrorLogEntry): void {
    // Add to in-memory log, maintaining max size
    this.errorLog.push(entry);
    if (this.errorLog.length > this.maxLogEntries) {
      this.errorLog.shift();
    }
    
    // Write to log file if configured
    if (this.logFilePath) {
      try {
        fs.writeFileSync(
          this.logFilePath,
          JSON.stringify(this.errorLog, null, 2),
          { flag: 'w' }
        );
      } catch (err) {
        console.error(`Failed to write to error log file: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  /**
   * Determine the severity of a file system error
   * @param error The file system error
   * @returns The error severity
   */
  private determineFileSystemErrorSeverity(error: FileSystemError): ErrorSeverity {
    switch (error.code) {
      case 'ENOENT': // File not found
        return ErrorSeverity.MEDIUM;
      case 'EACCES': // Permission denied
        return ErrorSeverity.HIGH;
      case 'EISDIR': // Is a directory
      case 'ENOTDIR': // Not a directory
        return ErrorSeverity.MEDIUM;
      case 'ENOSPC': // No space left on device
        return ErrorSeverity.CRITICAL;
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * Determine if a file system error is recoverable
   * @param error The file system error
   * @returns True if the error is recoverable
   */
  private isFileSystemErrorRecoverable(error: FileSystemError): boolean {
    switch (error.code) {
      case 'ENOENT': // File not found - can continue with other files
      case 'EISDIR': // Is a directory - can skip
      case 'ENOTDIR': // Not a directory - can skip
        return true;
      case 'EACCES': // Permission denied - might be recoverable depending on the file
        return true;
      case 'ENOSPC': // No space left on device - not recoverable
        return false;
      default:
        return true; // Assume recoverable by default
    }
  }
}

export { ErrorHandler };