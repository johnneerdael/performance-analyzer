// NetworkPerformanceAnalyzer Integration Tests
import { NetworkPerformanceAnalyzer, AnalyzerConfig } from '../../src/services/NetworkPerformanceAnalyzer';
import { DefaultDatasetDiscoveryService } from '../../src/services/DatasetDiscoveryService';
import { DefaultDataParser } from '../../src/services/DataParser';
import { DefaultAnalysisEngine } from '../../src/services/AnalysisEngine';
import { DefaultReportGenerator } from '../../src/services/ReportGenerator';
import { DefaultErrorHandler } from '../../src/utils/ErrorHandler';
import fs from 'fs-extra';
import path from 'path';

// Mock the dependencies
jest.mock('../../src/services/DatasetDiscoveryService');
jest.mock('../../src/services/DataParser');
jest.mock('../../src/services/AnalysisEngine');
jest.mock('../../src/services/ReportGenerator');
jest.mock('../../src/utils/ErrorHandler');

// Mock fs-extra
jest.mock('fs-extra', () => ({
  pathExists: jest.fn().mockResolvedValue(true),
  ensureDir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue('{}')
}));

describe('NetworkPerformanceAnalyzer', () => {
  // Mock instances
  let mockDiscoveryService: jest.Mocked<DefaultDatasetDiscoveryService>;
  let mockDataParser: jest.Mocked<DefaultDataParser>;
  let mockAnalysisEngine: jest.Mocked<DefaultAnalysisEngine>;
  let mockReportGenerator: jest.Mocked<DefaultReportGenerator>;
  let mockErrorHandler: jest.Mocked<DefaultErrorHandler>;
  
  // Test instance
  let analyzer: NetworkPerformanceAnalyzer;
  
  // Test data
  const testRootPath = '/test/path';
  const testDatasets = [
    {
      name: 'coredns-mtu1500-aws-logs_disabled',
      parametersFile: '/test/path/coredns-mtu1500-aws-logs_disabled/parameters-results_20250717_122222.json',
      resultsFile: '/test/path/coredns-mtu1500-aws-logs_disabled/results_20250717_122222.json',
      configuration: {
        mtu: 1500,
        awsLogging: false,
        backendServer: 'coredns',
        testDate: '2025-07-17 12:22:22'
      }
    },
    {
      name: 'coredns-mtu1500-aws-logs_enabled',
      parametersFile: '/test/path/coredns-mtu1500-aws-logs_enabled/parameters-results_20250717_113356.json',
      resultsFile: '/test/path/coredns-mtu1500-aws-logs_enabled/results_20250717_113356.json',
      configuration: {
        mtu: 1500,
        awsLogging: true,
        backendServer: 'coredns',
        testDate: '2025-07-17 11:33:56'
      }
    }
  ];
  
  const testParameters = {
    backendServer: 'coredns',
    mtu: 1500,
    queryLogging: 'disabled' as const,
    timestamp: '20250717_122222'
  };
  
  const testResults = {
    iperfTests: [
      {
        server: 'test-server',
        scenario: 'tcp',
        success: true,
        bandwidthMbps: 950.5
      }
    ],
    dnsResults: [
      {
        domain: 'example.com',
        dnsServer: '8.8.8.8',
        success: true,
        responseTimeMs: 15.5
      }
    ]
  };
  
  const testIperfAnalysis = {
    bandwidthComparison: [
      {
        configuration: 'coredns-mtu1500-aws-logs_disabled',
        avgBandwidthMbps: 950.5,
        medianBandwidthMbps: 955.2,
        maxBandwidthMbps: 980.1,
        minBandwidthMbps: 920.3,
        standardDeviation: 15.2,
        percentile95: 975.8,
        percentile99: 979.5
      }
    ],
    latencyAnalysis: [
      {
        configuration: 'coredns-mtu1500-aws-logs_disabled',
        avgLatencyMs: 2.5,
        medianLatencyMs: 2.3,
        maxLatencyMs: 5.1,
        minLatencyMs: 1.8,
        jitterMs: 0.5
      }
    ],
    reliabilityMetrics: [
      {
        configuration: 'coredns-mtu1500-aws-logs_disabled',
        successRate: 0.998,
        retransmitRate: 0.002,
        packetLossRate: 0.001,
        errorCount: 1
      }
    ],
    cpuUtilizationAnalysis: [
      {
        configuration: 'coredns-mtu1500-aws-logs_disabled',
        avgHostCpuUsage: 0.25,
        avgRemoteCpuUsage: 0.35,
        maxHostCpuUsage: 0.45,
        maxRemoteCpuUsage: 0.55
      }
    ]
  };
  
  const testDnsAnalysis = {
    performanceMetrics: [
      {
        configuration: 'coredns-mtu1500-aws-logs_disabled',
        avgResponseTimeMs: 15.5,
        medianResponseTimeMs: 14.2,
        successRate: 0.995,
        slowestDomains: [],
        fastestDomains: []
      }
    ],
    domainRankings: [],
    serverComparison: []
  };
  
  const testConfigComparison = {
    mtuImpact: {
      optimalMtu: 1500,
      performanceByMtu: {
        1500: {
          avgBandwidth: 950.5,
          avgLatency: 2.5,
          successRate: 0.998,
          cpuUsage: 0.3
        }
      },
      recommendations: ['Use MTU 1500 for optimal performance']
    },
    loggingImpact: {
      performanceImpact: -0.05,
      bandwidthDifference: -25.5,
      latencyDifference: 0.5,
      recommendations: ['Disable AWS logging for optimal performance']
    },
    overallRanking: [
      {
        configuration: 'coredns-mtu1500-aws-logs_disabled',
        overallScore: 95.5,
        bandwidthScore: 98.2,
        latencyScore: 97.5,
        reliabilityScore: 99.8,
        rank: 1
      }
    ]
  };
  
  const testAnomalies = [
    {
      type: 'bandwidth',
      configuration: 'coredns-mtu1500-aws-logs_enabled',
      description: 'Bandwidth drops significantly with AWS logging enabled',
      severity: 'medium' as const,
      affectedMetrics: ['bandwidth_mbps', 'retransmits'],
      recommendations: ['Consider disabling AWS logging during high-traffic periods']
    }
  ];
  
  const testReport = '# Network Performance Analysis Report\n\nThis is a test report';
  
  beforeEach(() => {
    // Create fresh mocks for each test
    mockDiscoveryService = new DefaultDatasetDiscoveryService() as jest.Mocked<DefaultDatasetDiscoveryService>;
    mockDataParser = new DefaultDataParser() as jest.Mocked<DefaultDataParser>;
    mockAnalysisEngine = new DefaultAnalysisEngine() as jest.Mocked<DefaultAnalysisEngine>;
    mockReportGenerator = new DefaultReportGenerator() as jest.Mocked<DefaultReportGenerator>;
    mockErrorHandler = new DefaultErrorHandler() as jest.Mocked<DefaultErrorHandler>;
    
    // Setup mock implementations
    mockDiscoveryService.discoverDatasets = jest.fn().mockResolvedValue(testDatasets);
    mockDiscoveryService.validateDatasetCompleteness = jest.fn().mockReturnValue(true);
    
    mockDataParser.parseParameters = jest.fn().mockResolvedValue(testParameters);
    mockDataParser.parseResults = jest.fn().mockResolvedValue(testResults);
    
    mockAnalysisEngine.analyzeIperfPerformance = jest.fn().mockResolvedValue(testIperfAnalysis);
    mockAnalysisEngine.analyzeDnsPerformance = jest.fn().mockResolvedValue(testDnsAnalysis);
    mockAnalysisEngine.compareConfigurations = jest.fn().mockResolvedValue(testConfigComparison);
    mockAnalysisEngine.detectAnomalies = jest.fn().mockResolvedValue(testAnomalies);
    
    mockReportGenerator.generateReport = jest.fn().mockResolvedValue(testReport);
    mockReportGenerator.createExecutiveSummary = jest.fn().mockReturnValue('Executive Summary');
    mockReportGenerator.generateDetailedTables = jest.fn().mockReturnValue('Detailed Tables');
    mockReportGenerator.createVisualizationDescriptions = jest.fn().mockReturnValue('Visualization Descriptions');
    
    mockErrorHandler.logError = jest.fn();
    mockErrorHandler.handleFileSystemError = jest.fn();
    mockErrorHandler.handleParsingError = jest.fn();
    mockErrorHandler.handleAnalysisError = jest.fn();
    
    // We'll use the mocked fs-extra module directly in our tests
    
    // Create analyzer instance with mocked dependencies
    analyzer = new NetworkPerformanceAnalyzer(
      mockDiscoveryService,
      mockDataParser,
      mockAnalysisEngine,
      mockReportGenerator,
      mockErrorHandler,
      { logProgress: false } // Disable logging for tests
    );
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('analyze', () => {
    it('should execute the complete analysis workflow successfully', async () => {
      // Setup fs-extra mock to make pathExists return true
      (fs.pathExists as jest.Mock).mockResolvedValue(true);
      
      // Execute the analyze method
      const report = await analyzer.analyze(testRootPath);
      
      // Verify the workflow steps were executed in the correct order
      expect(mockDiscoveryService.discoverDatasets).toHaveBeenCalledWith(testRootPath);
      expect(mockDataParser.parseResults).toHaveBeenCalled();
      expect(mockAnalysisEngine.analyzeIperfPerformance).toHaveBeenCalled();
      expect(mockAnalysisEngine.analyzeDnsPerformance).toHaveBeenCalled();
      expect(mockAnalysisEngine.compareConfigurations).toHaveBeenCalled();
      expect(mockAnalysisEngine.detectAnomalies).toHaveBeenCalled();
      expect(mockReportGenerator.generateReport).toHaveBeenCalled();
      
      // Verify the final report is returned
      expect(report).toBe(testReport);
    });
    
    it('should save the report when reportOutputPath is provided', async () => {
      // Create analyzer with reportOutputPath
      const outputPath = '/test/output/report.md';
      const analyzerWithOutput = new NetworkPerformanceAnalyzer(
        mockDiscoveryService,
        mockDataParser,
        mockAnalysisEngine,
        mockReportGenerator,
        mockErrorHandler,
        { 
          logProgress: false,
          reportOutputPath: outputPath
        }
      );
      
      // Execute the analyze method
      await analyzerWithOutput.analyze(testRootPath);
      
      // Verify the report was saved
      expect(fs.ensureDir).toHaveBeenCalledWith(path.dirname(outputPath));
      expect(fs.writeFile).toHaveBeenCalledWith(outputPath, testReport, 'utf8');
    });
    
    it('should handle errors during dataset discovery', async () => {
      // Setup discovery service to throw an error
      const testError = new Error('Discovery error');
      mockDiscoveryService.discoverDatasets.mockRejectedValue(testError);
      
      // Execute the analyze method and expect it to throw
      await expect(analyzer.analyze(testRootPath)).rejects.toThrow();
      
      // Verify error was logged
      expect(mockErrorHandler.logError).toHaveBeenCalledWith(expect.any(Error), expect.any(String));
    });
    
    it('should continue analysis when a dataset fails to parse and continueOnError is true', async () => {
      // Setup data parser to throw an error for the first dataset
      mockDataParser.parseResults.mockImplementation((filePath) => {
        if (filePath.includes('disabled')) {
          throw new Error('Parsing error');
        }
        return Promise.resolve(testResults);
      });
      
      // Create analyzer with continueOnError = true
      const analyzerWithContinue = new NetworkPerformanceAnalyzer(
        mockDiscoveryService,
        mockDataParser,
        mockAnalysisEngine,
        mockReportGenerator,
        mockErrorHandler,
        { 
          logProgress: false,
          continueOnError: true
        }
      );
      
      // Execute the analyze method
      await analyzerWithContinue.analyze(testRootPath);
      
      // Verify error was logged but analysis continued
      expect(mockErrorHandler.logError).toHaveBeenCalled();
      expect(mockAnalysisEngine.analyzeIperfPerformance).toHaveBeenCalled();
      expect(mockReportGenerator.generateReport).toHaveBeenCalled();
    });
    
    it('should throw an error when no datasets are found', async () => {
      // Setup discovery service to return empty array
      mockDiscoveryService.discoverDatasets.mockResolvedValue([]);
      
      // Execute the analyze method and expect it to throw
      await expect(analyzer.analyze(testRootPath)).rejects.toThrow('No valid datasets found');
    });
    
    it('should throw an error when no datasets can be parsed', async () => {
      // Setup data parser to throw errors for all datasets
      mockDataParser.parseResults.mockRejectedValue(new Error('Parsing error'));
      
      // Execute the analyze method and expect it to throw
      await expect(analyzer.analyze(testRootPath)).rejects.toThrow('No datasets could be successfully parsed');
    });
  });
});