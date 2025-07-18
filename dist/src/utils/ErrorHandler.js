"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultErrorHandler = exports.ErrorSeverity = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Severity levels for errors
 */
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
/**
 * Default implementation of the ErrorHandler interface
 * Provides centralized error handling for the Network Performance Analyzer
 */
class DefaultErrorHandler {
    /**
     * Creates a new DefaultErrorHandler instance
     * @param options Configuration options for the error handler
     */
    constructor(options) {
        this.errorLog = [];
        this.logFilePath = null;
        this.maxLogEntries = 1000;
        if (options?.logToFile) {
            const logDir = options.logDirectory || './logs';
            // Ensure log directory exists
            if (!fs.existsSync(logDir)) {
                try {
                    fs.mkdirSync(logDir, { recursive: true });
                }
                catch (err) {
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
    handleFileSystemError(error) {
        const context = `File system error at path: ${error.path}`;
        const severity = this.determineFileSystemErrorSeverity(error);
        const recoverable = this.isFileSystemErrorRecoverable(error);
        const logEntry = {
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
    handleParsingError(error) {
        const location = error.lineNumber
            ? `line ${error.lineNumber}${error.columnNumber ? `, column ${error.columnNumber}` : ''}`
            : 'unknown location';
        const context = `Parsing error in file ${error.filePath} at ${location}`;
        const severity = ErrorSeverity.MEDIUM;
        const recoverable = true; // Most parsing errors are recoverable by skipping the problematic file
        const logEntry = {
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
    handleAnalysisError(error) {
        const context = `Analysis error in ${error.analysisType}${error.datasetName ? ` for dataset ${error.datasetName}` : ''}`;
        const severity = ErrorSeverity.MEDIUM;
        const recoverable = true; // Most analysis errors are recoverable by continuing with other datasets
        const logEntry = {
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
    handleValidationError(error, entityType, entityId) {
        const context = `Validation error for ${entityType}: ${entityId}`;
        const severity = ErrorSeverity.MEDIUM;
        const recoverable = true; // Most validation errors are recoverable
        const logEntry = {
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
    logError(error, context) {
        console.error(`[ERROR] ${context}: ${error.message}`);
        if (error.stack) {
            console.error(error.stack);
        }
    }
    /**
     * Get all logged errors
     * @returns Array of error log entries
     */
    getErrorLog() {
        return [...this.errorLog];
    }
    /**
     * Check if there are any errors of the specified severity or higher
     * @param minSeverity Minimum severity level to check for
     * @returns True if there are errors at or above the specified severity
     */
    hasErrorsOfSeverity(minSeverity) {
        const severityLevels = [
            ErrorSeverity.LOW,
            ErrorSeverity.MEDIUM,
            ErrorSeverity.HIGH,
            ErrorSeverity.CRITICAL
        ];
        const minSeverityIndex = severityLevels.indexOf(minSeverity);
        if (minSeverityIndex === -1)
            return false;
        return this.errorLog.some(entry => {
            const entrySeverityIndex = severityLevels.indexOf(entry.severity);
            return entrySeverityIndex >= minSeverityIndex;
        });
    }
    /**
     * Clear the error log
     */
    clearErrorLog() {
        this.errorLog = [];
    }
    /**
     * Store an error log entry
     * @param entry The error log entry to store
     */
    storeErrorLog(entry) {
        // Add to in-memory log, maintaining max size
        this.errorLog.push(entry);
        if (this.errorLog.length > this.maxLogEntries) {
            this.errorLog.shift();
        }
        // Write to log file if configured
        if (this.logFilePath) {
            try {
                fs.writeFileSync(this.logFilePath, JSON.stringify(this.errorLog, null, 2), { flag: 'w' });
            }
            catch (err) {
                console.error(`Failed to write to error log file: ${err instanceof Error ? err.message : String(err)}`);
            }
        }
    }
    /**
     * Determine the severity of a file system error
     * @param error The file system error
     * @returns The error severity
     */
    determineFileSystemErrorSeverity(error) {
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
    isFileSystemErrorRecoverable(error) {
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
exports.DefaultErrorHandler = DefaultErrorHandler;
//# sourceMappingURL=ErrorHandler.js.map