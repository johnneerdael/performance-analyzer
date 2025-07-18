// Integration tests for error handling and recovery mechanisms
import { NetworkPerformanceAnalyzer, createNetworkPerformanceAnalyzer } from '../../src/services/NetworkPerformanceAnalyzer';
import { DefaultErrorHandler, ErrorSeverity } from '../../src/utils/ErrorHandler';
import { DefaultDatasetDiscoveryService } from '../../src/services/DatasetDiscoveryService';
import { DefaultDataParser } from '../../src/services/DataParser';
import { DefaultAnalysisEngine } from '../../src/services/AnalysisEngine';
import { DefaultReportGenerator } from '../../src/services/ReportGenerator';
import { Dataset, FileSystemError, ParsingError, AnalysisError } from '../../src/models';
import * as fs from 'fs-extra';
import * as path from 'path';

// Mock fs-extra
jest.mock('fs-extra', () => ({
  pathExists: jest.fn().mockResolvedValue(true),
  readdir: jest.fn().mockResolvedValue([]),
  readFile: jest.fn().mockResolvedValue('{}'),
  ensureDir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  existsSync: jest.fn().mockReturnValue(true)
}));

describe('Error Handling Integration Tests', () => {
  let analyzer: NetworkPerformanceAnalyzer;
  let errorHandler: DefaultErrorHandler;
  let discoveryService: DefaultDatasetDiscoveryService;
  let dataParser: DefaultDataParser;
  let analysisEngine: DefaultAnalysisEngine;
  let reportGenerator: DefaultReportGenerator;
  
  // Spy on console.error to prevent test output pollution
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a real error handler for testing
    errorHandler = new DefaultErrorHandler();
    
    // Create mock services
    discoveryService = new DefaultDatasetDiscoveryService(errorHandler);
    dataParser = new DefaultDataParser(errorHandler);
    analysisEngine = new DefaultAnalysisEngine();
    reportGenerator = new DefaultReportGenerator();
    
    // Create analyzer with mock services
    analyzer = new NetworkPerformanceAnalyzer(
      discoveryService,
      dataParser,
      analysisEngine,
      reportGenerator,
      errorHandler,
      { logProgress: false }
    );
    
    // Spy on console methods
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });
  
  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });
  
  describe('Dataset Discovery Error Handling', () => {
    it('should handle root path not existing', async () => {
      // Arrange
      (fs.pathExists as jest.Mock).mockResolvedValue(false);
      jest.spyOn(discoveryService, 'discoverDatasets').mockImplementation(async () => {
        const error = new Error('Root path does not exist') as FileSystemError;
        error.code = 'ENOENT';
        error.path = '/nonexistent/path';
        errorHandler.handleFileSystemError(error);
        return [];
      });
      
      // Act
      const result = await analyzer.analyze('/nonexistent/path');
      
      // Assert
      expect(result).toContain('# Network Performance Analysis Report');
      expect(result).toContain('## Error: No Valid Datasets');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Root path does not exist')
      );
    });
    
    it('should handle permission errors during directory reading', async () => {
      // Arrange
      (fs.pathExists as jest.Mock).mockResolvedValue(true);
      jest.spyOn(discoveryService, 'discoverDatasets').mockImplementation(async () => {
        const error = new Error('Permission denied') as FileSystemError;
        error.code = 'EACCES';
        error.path = '/protected/path';
        errorHandler.handleFileSystemError(error);
        return [];
      });
      
      // Act
      const result = await analyzer.analyze('/protected/path');
      
      // Assert
      expect(result).toContain('# Network Performance Analysis Report');
      expect(result).toContain('## Error: No Valid Datasets');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Permission denied')
      );
    });
  });
  
  describe('Data Parsing Error Handling', () => {
    it('should handle malformed JSON in results file', async () => {
      // Arrange
      const mockDatasets: Dataset[] = [{
        name: 'test-dataset',
        parametersFile: '/path/to/parameters.json',
        resultsFile: '/path/to/results.json',
        configuration: {
          mtu: 1500,
          awsLogging: false,
          backendServer: 'test-server',
          testDate: '2025-07-17'
        }
      }];
      
      (fs.pathExists as jest.Mock).mockResolvedValue(true);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      
      jest.spyOn(discoveryService, 'discoverDatasets').mockResolvedValue(mockDatasets);
      jest.spyOn(dataParser, 'parseResults').mockImplementation(async () => {
        const error = new Error('Unexpected token in JSON') as ParsingError;
        error.filePath = '/path/to/results.json';
        error.lineNumber = 42;
        error.columnNumber = 10;
        errorHandler.handleParsingError(error);
        throw error;
      });
      
      // Act
      const result = await analyzer.analyze('/test/path');
      
      // Assert
      expect(result).toContain('# Network Performance Analysis Report');
      // Since we're throwing an error during parsing but have no valid datasets,
      // we get the "No Valid Datasets" report instead of "Error During Analysis"
      expect(result).toContain('## Error: No Valid Datasets');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Parsing error in file /path/to/results.json')
      );
    });
    
    it('should continue analysis when some datasets fail to parse', async () => {
      // Arrange
      const mockDatasets: Dataset[] = [
        {
          name: 'valid-dataset',
          parametersFile: '/path/to/valid-parameters.json',
          resultsFile: '/path/to/valid-results.json',
          configuration: {
            mtu: 1500,
            awsLogging: false,
            backendServer: 'test-server',
            testDate: '2025-07-17'
          }
        },
        {
          name: 'invalid-dataset',
          parametersFile: '/path/to/invalid-parameters.json',
          resultsFile: '/path/to/invalid-results.json',
          configuration: {
            mtu: 1500,
            awsLogging: false,
            backendServer: 'test-server',
            testDate: '2025-07-17'
          }
        }
      ];
      
      (fs.pathExists as jest.Mock).mockResolvedValue(true);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      
      jest.spyOn(discoveryService, 'discoverDatasets').mockResolvedValue(mockDatasets);
      
      // Mock successful parsing for first dataset
      jest.spyOn(dataParser, 'parseResults')
        .mockImplementationOnce(async () => ({
          iperfTests: [{ server: 'test', scenario: 'tcp', success: true }],
          dnsResults: [{ domain: 'example.com', dnsServer: '8.8.8.8', success: true }]
        }))
        // Mock failed parsing for second dataset
        .mockImplementationOnce(async () => {
          const error = new Error('Invalid JSON') as ParsingError;
          error.filePath = '/path/to/invalid-results.json';
          errorHandler.handleParsingError(error);
          throw error;
        });
      
      // Mock analysis engine to return valid results
      jest.spyOn(analysisEngine, 'analyzeIperfPerformance').mockResolvedValue({} as any);
      jest.spyOn(analysisEngine, 'analyzeDnsPerformance').mockResolvedValue({} as any);
      jest.spyOn(analysisEngine, 'compareConfigurations').mockResolvedValue({ overallRanking: [] } as any);
      jest.spyOn(analysisEngine, 'detectAnomalies').mockResolvedValue([]);
      
      // Mock report generator
      jest.spyOn(reportGenerator, 'generateReport').mockResolvedValue('Test Report');
      
      // Act
      await analyzer.analyze('/test/path');
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error parsing dataset: invalid-dataset')
      );
      expect(analysisEngine.analyzeIperfPerformance).toHaveBeenCalled();
      expect(reportGenerator.generateReport).toHaveBeenCalled();
    });
  });
  
  describe('Analysis Error Handling', () => {
    it('should handle errors during analysis', async () => {
      // Arrange
      const mockDatasets: Dataset[] = [{
        name: 'test-dataset',
        parametersFile: '/path/to/parameters.json',
        resultsFile: '/path/to/results.json',
        configuration: {
          mtu: 1500,
          awsLogging: false,
          backendServer: 'test-server',
          testDate: '2025-07-17'
        },
        results: {
          iperfTests: [{ server: 'test', scenario: 'tcp', success: true }],
          dnsResults: [{ domain: 'example.com', dnsServer: '8.8.8.8', success: true }]
        }
      } as any];
      
      jest.spyOn(discoveryService, 'discoverDatasets').mockResolvedValue(mockDatasets);
      jest.spyOn(dataParser, 'parseResults').mockResolvedValue({
        iperfTests: [{ server: 'test', scenario: 'tcp', success: true }],
        dnsResults: [{ domain: 'example.com', dnsServer: '8.8.8.8', success: true }]
      });
      
      // Mock analysis error
      jest.spyOn(analysisEngine, 'analyzeIperfPerformance').mockImplementation(async () => {
        const error = new Error('Analysis calculation error') as AnalysisError;
        error.analysisType = 'IperfAnalysis';
        error.datasetName = 'test-dataset';
        errorHandler.handleAnalysisError(error);
        throw error;
      });
      
      // Act
      const result = await analyzer.analyze('/test/path');
      
      // Assert
      expect(result).toContain('# Network Performance Analysis Report');
      expect(result).toContain('## Error During Analysis');
      expect(result).toContain('Analysis calculation error');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Analysis error in IperfAnalysis for dataset test-dataset')
      );
    });
  });
  
  describe('Report Generation Error Handling', () => {
    it('should handle errors during report saving', async () => {
      // Arrange
      const mockDatasets: Dataset[] = [{
        name: 'test-dataset',
        parametersFile: '/path/to/parameters.json',
        resultsFile: '/path/to/results.json',
        configuration: {
          mtu: 1500,
          awsLogging: false,
          backendServer: 'test-server',
          testDate: '2025-07-17'
        },
        results: {
          iperfTests: [{ server: 'test', scenario: 'tcp', success: true }],
          dnsResults: [{ domain: 'example.com', dnsServer: '8.8.8.8', success: true }]
        }
      } as any];
      
      jest.spyOn(discoveryService, 'discoverDatasets').mockResolvedValue(mockDatasets);
      jest.spyOn(analysisEngine, 'analyzeIperfPerformance').mockResolvedValue({} as any);
      jest.spyOn(analysisEngine, 'analyzeDnsPerformance').mockResolvedValue({} as any);
      jest.spyOn(analysisEngine, 'compareConfigurations').mockResolvedValue({ overallRanking: [] } as any);
      jest.spyOn(analysisEngine, 'detectAnomalies').mockResolvedValue([]);
      jest.spyOn(reportGenerator, 'generateReport').mockResolvedValue('Test Report');
      
      // Mock file system error during report saving
      (fs.ensureDir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as unknown as jest.Mock).mockImplementation(() => {
        throw new Error('Disk full');
      });
      
      // Create analyzer with report output path
      analyzer = new NetworkPerformanceAnalyzer(
        discoveryService,
        dataParser,
        analysisEngine,
        reportGenerator,
        errorHandler,
        { 
          logProgress: false,
          reportOutputPath: '/output/report.md',
          continueOnError: true
        }
      );
      
      // Act
      const result = await analyzer.analyze('/test/path');
      
      // Assert
      // With continueOnError=true, we get an error report when saving fails
      expect(result).toContain('# Network Performance Analysis Report');
      expect(result).toContain('## Error During Analysis');
      expect(result).toContain('Disk full');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error saving report to /output/report.md')
      );
    });
  });
  
  describe('Factory Function', () => {
    it('should create a NetworkPerformanceAnalyzer with proper error handling configuration', () => {
      // Act
      const analyzer = createNetworkPerformanceAnalyzer();
      
      // Assert - we can't directly test the private fields, but we can test that it doesn't throw
      expect(analyzer).toBeInstanceOf(NetworkPerformanceAnalyzer);
    });
  });
});