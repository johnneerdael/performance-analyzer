// Tests for ErrorHandler utility
import { DefaultErrorHandler, ErrorSeverity, ErrorLogEntry } from '../../src/utils/ErrorHandler';
import { FileSystemError, ParsingError, AnalysisError } from '../../src/models';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn()
}));

describe('ErrorHandler', () => {
  let errorHandler: DefaultErrorHandler;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorHandler = new DefaultErrorHandler();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should create log directory if it does not exist', () => {
      // Arrange
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      
      // Act
      new DefaultErrorHandler({ logToFile: true, logDirectory: './custom-logs' });
      
      // Assert
      expect(fs.existsSync).toHaveBeenCalledWith('./custom-logs');
      expect(fs.mkdirSync).toHaveBeenCalledWith('./custom-logs', { recursive: true });
    });
    
    it('should not create log directory if it already exists', () => {
      // Arrange
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      
      // Act
      new DefaultErrorHandler({ logToFile: true });
      
      // Assert
      expect(fs.existsSync).toHaveBeenCalledWith('./logs');
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });
    
    it('should handle error when creating log directory fails', () => {
      // Arrange
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      // Act & Assert
      expect(() => {
        new DefaultErrorHandler({ logToFile: true });
      }).not.toThrow();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create log directory')
      );
    });
  });

  describe('handleFileSystemError', () => {
    it('should log file system errors with path information', () => {
      // Arrange
      const error = new Error('File not found') as FileSystemError;
      error.code = 'ENOENT';
      error.path = '/path/to/file';

      // Act
      const result = errorHandler.handleFileSystemError(error);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('File system error at path: /path/to/file')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(String));
      expect(result).toBe(true); // ENOENT errors are recoverable
    });
    
    it('should correctly determine severity for different file system errors', () => {
      // Arrange
      const errorHandler = new DefaultErrorHandler();
      const errors = [
        { code: 'ENOENT', path: '/path/to/file', message: 'File not found', expected: ErrorSeverity.MEDIUM },
        { code: 'EACCES', path: '/path/to/file', message: 'Permission denied', expected: ErrorSeverity.HIGH },
        { code: 'EISDIR', path: '/path/to/file', message: 'Is a directory', expected: ErrorSeverity.MEDIUM },
        { code: 'ENOSPC', path: '/path/to/file', message: 'No space left', expected: ErrorSeverity.CRITICAL }
      ];
      
      // Act & Assert
      errors.forEach(errorData => {
        const error = new Error(errorData.message) as FileSystemError;
        error.code = errorData.code;
        error.path = errorData.path;
        
        errorHandler.handleFileSystemError(error);
        
        const log = errorHandler.getErrorLog();
        expect(log.length).toBeGreaterThan(0);
        
        // Safe access with explicit check
        const lastEntry = log.length > 0 ? log[log.length - 1] : null;
        if (lastEntry) {
          expect(lastEntry.severity).toBe(errorData.expected);
        }
      });
    });
    
    it('should correctly determine recoverability for different file system errors', () => {
      // Arrange
      const errorHandler = new DefaultErrorHandler();
      const errors = [
        { code: 'ENOENT', path: '/path/to/file', message: 'File not found', expected: true },
        { code: 'EACCES', path: '/path/to/file', message: 'Permission denied', expected: true },
        { code: 'ENOSPC', path: '/path/to/file', message: 'No space left', expected: false }
      ];
      
      // Act & Assert
      errors.forEach(errorData => {
        const error = new Error(errorData.message) as FileSystemError;
        error.code = errorData.code;
        error.path = errorData.path;
        
        const result = errorHandler.handleFileSystemError(error);
        expect(result).toBe(errorData.expected);
      });
    });
  });

  describe('handleParsingError', () => {
    it('should log parsing errors with file and location information', () => {
      // Arrange
      const error = new Error('Invalid JSON') as ParsingError;
      error.filePath = '/path/to/data.json';
      error.lineNumber = 42;
      error.columnNumber = 10;

      // Act
      const result = errorHandler.handleParsingError(error);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Parsing error in file /path/to/data.json at line 42, column 10')
      );
      expect(result).toBe(true); // Parsing errors are recoverable
      
      const log = errorHandler.getErrorLog();
      expect(log.length).toBeGreaterThan(0);
      if (log.length > 0 && log[0]) {
        expect(log[0].additionalInfo).toEqual({
          errorType: 'ParsingError',
          lineNumber: 42,
          columnNumber: 10
        });
      }
    });

    it('should handle parsing errors without column information', () => {
      // Arrange
      const error = new Error('Invalid JSON') as ParsingError;
      error.filePath = '/path/to/data.json';
      error.lineNumber = 42;

      // Act
      errorHandler.handleParsingError(error);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Parsing error in file /path/to/data.json at line 42')
      );
    });

    it('should handle parsing errors without line or column information', () => {
      // Arrange
      const error = new Error('Invalid JSON') as ParsingError;
      error.filePath = '/path/to/data.json';

      // Act
      errorHandler.handleParsingError(error);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Parsing error in file /path/to/data.json at unknown location')
      );
    });
  });

  describe('handleAnalysisError', () => {
    it('should log analysis errors with type and dataset information', () => {
      // Arrange
      const error = new Error('Analysis failed') as AnalysisError;
      error.analysisType = 'IperfAnalysis';
      error.datasetName = 'coredns-mtu1500-aws-logs_disabled';

      // Act
      const result = errorHandler.handleAnalysisError(error);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Analysis error in IperfAnalysis for dataset coredns-mtu1500-aws-logs_disabled')
      );
      expect(result).toBe(true); // Analysis errors are recoverable
      
      const log = errorHandler.getErrorLog();
      expect(log.length).toBeGreaterThan(0);
      if (log.length > 0 && log[0]) {
        expect(log[0].additionalInfo).toEqual({
          errorType: 'AnalysisError',
          analysisType: 'IperfAnalysis',
          datasetName: 'coredns-mtu1500-aws-logs_disabled'
        });
      }
    });

    it('should handle analysis errors without dataset information', () => {
      // Arrange
      const error = new Error('Analysis failed') as AnalysisError;
      error.analysisType = 'IperfAnalysis';

      // Act
      errorHandler.handleAnalysisError(error);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Analysis error in IperfAnalysis')
      );
    });
  });
  
  describe('handleValidationError', () => {
    it('should log validation errors with entity information', () => {
      // Arrange
      const error = new Error('Invalid data format');
      const entityType = 'TestResults';
      const entityId = 'coredns-mtu1500-aws-logs_disabled/results_20250717_122222.json';
      
      // Act
      const result = errorHandler.handleValidationError(error, entityType, entityId);
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Validation error for ${entityType}: ${entityId}`)
      );
      expect(result).toBe(true); // Validation errors are recoverable
      
      const log = errorHandler.getErrorLog();
      expect(log.length).toBeGreaterThan(0);
      if (log.length > 0 && log[0]) {
        expect(log[0].additionalInfo).toEqual({
          errorType: 'ValidationError',
          entityType,
          entityId
        });
      }
    });
  });

  describe('logError', () => {
    it('should log errors with context and stack trace', () => {
      // Arrange
      const error = new Error('Something went wrong');
      const context = 'Test context';

      // Act
      errorHandler.logError(error, context);

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Test context: Something went wrong')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(error.stack);
    });
    
    it('should handle errors without stack traces', () => {
      // Arrange
      const error = { message: 'Custom error without stack' } as Error;
      const context = 'Test context';
      
      // Act
      errorHandler.logError(error, context);
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Test context: Custom error without stack')
      );
      // Should not throw when stack is undefined
      expect(() => errorHandler.logError(error, context)).not.toThrow();
    });
  });
  
  describe('error log management', () => {
    it('should store errors in the error log', () => {
      // Arrange
      const fileError = new Error('File not found') as FileSystemError;
      fileError.code = 'ENOENT';
      fileError.path = '/path/to/file';
      
      const parseError = new Error('Invalid JSON') as ParsingError;
      parseError.filePath = '/path/to/data.json';
      
      // Act
      errorHandler.handleFileSystemError(fileError);
      errorHandler.handleParsingError(parseError);
      
      // Assert
      const log = errorHandler.getErrorLog();
      expect(log.length).toBe(2);
      if (log.length >= 2 && log[0] && log[1]) {
        expect(log[0].additionalInfo?.errorType).toBe('FileSystemError');
        expect(log[1].additionalInfo?.errorType).toBe('ParsingError');
      }
    });
    
    it('should limit the error log to maxLogEntries', () => {
      // Arrange
      const errorHandler = new DefaultErrorHandler({ maxLogEntries: 2 });
      
      // Act
      for (let i = 0; i < 5; i++) {
        const error = new Error(`Error ${i}`) as FileSystemError;
        error.code = 'ENOENT';
        error.path = `/path/to/file${i}`;
        errorHandler.handleFileSystemError(error);
      }
      
      // Assert
      const log = errorHandler.getErrorLog();
      expect(log.length).toBe(2);
      if (log.length >= 2 && log[0] && log[1]) {
        expect(log[0].message).toBe('Error 3');
        expect(log[1].message).toBe('Error 4');
      }
    });
    
    it('should clear the error log', () => {
      // Arrange
      const error = new Error('Test error') as FileSystemError;
      error.code = 'ENOENT';
      error.path = '/path/to/file';
      errorHandler.handleFileSystemError(error);
      
      // Act
      errorHandler.clearErrorLog();
      
      // Assert
      expect(errorHandler.getErrorLog().length).toBe(0);
    });
    
    it('should detect errors of specified severity', () => {
      // Arrange
      const errorHandler = new DefaultErrorHandler();
      
      const lowError = new Error('Low severity') as FileSystemError;
      lowError.code = 'ENOENT';
      lowError.path = '/path/to/file1';
      
      const highError = new Error('High severity') as FileSystemError;
      highError.code = 'EACCES';
      highError.path = '/path/to/file2';
      
      // Act
      errorHandler.handleFileSystemError(lowError);
      errorHandler.handleFileSystemError(highError);
      
      // Assert
      expect(errorHandler.hasErrorsOfSeverity(ErrorSeverity.LOW)).toBe(true);
      expect(errorHandler.hasErrorsOfSeverity(ErrorSeverity.MEDIUM)).toBe(true);
      expect(errorHandler.hasErrorsOfSeverity(ErrorSeverity.HIGH)).toBe(true);
      expect(errorHandler.hasErrorsOfSeverity(ErrorSeverity.CRITICAL)).toBe(false);
    });
    
    it('should write error log to file when configured', () => {
      // Arrange
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-07-17T12:00:00.000Z');
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      
      const errorHandler = new DefaultErrorHandler({ 
        logToFile: true,
        logDirectory: './test-logs'
      });
      
      const error = new Error('Test error') as FileSystemError;
      error.code = 'ENOENT';
      error.path = '/path/to/file';
      
      // Act
      errorHandler.handleFileSystemError(error);
      
      // Assert
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('test-logs/error-log-2025-07-17T12-00-00.000Z.json'),
        expect.any(String),
        { flag: 'w' }
      );
    });
    
    it('should handle errors when writing to log file', () => {
      // Arrange
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('Write failed');
      });
      
      const errorHandler = new DefaultErrorHandler({ logToFile: true });
      const error = new Error('Test error') as FileSystemError;
      error.code = 'ENOENT';
      error.path = '/path/to/file';
      
      // Act & Assert
      expect(() => {
        errorHandler.handleFileSystemError(error);
      }).not.toThrow();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to write to error log file')
      );
    });
  });
});