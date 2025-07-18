// Tests for AnalysisEngine service
import { DefaultAnalysisEngine } from '../../src/services/AnalysisEngine';
import { Dataset, TestResults } from '../../src/models';

// Mock dependencies
jest.mock('../../src/services/IperfAnalyzer', () => ({
  IperfAnalyzer: jest.fn().mockImplementation(() => ({
    analyzeBandwidth: jest.fn().mockReturnValue([{ configuration: 'test', avgBandwidthMbps: 100 }]),
    analyzeLatency: jest.fn().mockReturnValue([{ configuration: 'test', avgLatencyMs: 10 }]),
    analyzeReliability: jest.fn().mockReturnValue([{ configuration: 'test', successRate: 0.95 }]),
    analyzeCpuUtilization: jest.fn().mockReturnValue([{ configuration: 'test', avgHostCpuUsage: 50 }])
  }))
}));

jest.mock('../../src/services/ConfigurationComparator', () => ({
  ConfigurationComparator: jest.fn().mockImplementation(() => ({
    compareConfigurations: jest.fn().mockReturnValue({
      mtuImpact: {
        optimalMtu: 1500,
        performanceByMtu: {
          1500: { avgBandwidth: 950, avgLatency: 15, successRate: 0.98, cpuUsage: 50 }
        },
        recommendations: ['The optimal MTU setting appears to be 1500 based on bandwidth performance.']
      },
      loggingImpact: {
        performanceImpact: 5.2,
        bandwidthDifference: 50,
        latencyDifference: 5,
        recommendations: ['Disabling AWS logging improves network performance by approximately 5.2%.']
      },
      overallRanking: [
        { configuration: 'test', overallScore: 85, bandwidthScore: 100, latencyScore: 80, reliabilityScore: 95, rank: 1 }
      ]
    })
  }))
}));

jest.mock('../../src/services/DnsAnalyzer', () => ({
  DnsAnalyzer: jest.fn().mockImplementation(() => ({
    analyzeDnsPerformance: jest.fn().mockReturnValue({
      performanceMetrics: [{ configuration: 'test', avgResponseTimeMs: 15, successRate: 0.98 }],
      domainRankings: [{ domain: 'example.com', avgResponseTimeMs: 20, successRate: 0.95, queryCount: 10 }],
      serverComparison: [{ server: '8.8.8.8', avgResponseTimeMs: 15, successRate: 0.98, configurations: ['test'] }]
    })
  }))
}));

jest.mock('../../src/services/DataParser', () => ({
  DefaultDataParser: jest.fn().mockImplementation(() => ({
    parseResults: jest.fn().mockImplementation((filePath) => {
      return Promise.resolve({
        iperfTests: [
          {
            server: 'test-server',
            scenario: 'TCP Bandwidth',
            success: true,
            bandwidthMbps: 100
          }
        ],
        dnsResults: []
      });
    })
  }))
}));

jest.mock('../../src/utils/ErrorHandler', () => ({
  DefaultErrorHandler: jest.fn().mockImplementation(() => ({
    handleAnalysisError: jest.fn(),
    logError: jest.fn()
  }))
}));

jest.mock('fs-extra', () => ({
  pathExists: jest.fn().mockResolvedValue(true),
  readFile: jest.fn()
}));

describe('AnalysisEngine', () => {
  let analysisEngine: DefaultAnalysisEngine;
  let mockDatasets: Dataset[];
  
  beforeEach(() => {
    analysisEngine = new DefaultAnalysisEngine();
    
    // Create mock datasets
    mockDatasets = [
      {
        name: 'test-dataset-1',
        parametersFile: '/path/to/parameters-1.json',
        resultsFile: '/path/to/results-1.json',
        configuration: {
          mtu: 1500,
          awsLogging: false,
          backendServer: 'coredns',
          testDate: '2025-07-17 12:00:00'
        }
      },
      {
        name: 'test-dataset-2',
        parametersFile: '/path/to/parameters-2.json',
        resultsFile: '/path/to/results-2.json',
        configuration: {
          mtu: 1420,
          awsLogging: true,
          backendServer: 'stock',
          testDate: '2025-07-17 13:00:00'
        }
      }
    ];
    
    jest.clearAllMocks();
  });
  
  describe('analyzeIperfPerformance', () => {
    it('should load test results and analyze iperf performance', async () => {
      // Act
      const result = await analysisEngine.analyzeIperfPerformance(mockDatasets);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.bandwidthComparison).toHaveLength(1);
      expect(result.latencyAnalysis).toHaveLength(1);
      expect(result.reliabilityMetrics).toHaveLength(1);
      expect(result.cpuUtilizationAnalysis).toHaveLength(1);
      
      // Check that the first dataset has the expected values
      expect(result.bandwidthComparison[0]?.configuration).toBe('test');
      expect(result.bandwidthComparison[0]?.avgBandwidthMbps).toBe(100);
      
      expect(result.latencyAnalysis[0]?.configuration).toBe('test');
      expect(result.latencyAnalysis[0]?.avgLatencyMs).toBe(10);
      
      expect(result.reliabilityMetrics[0]?.configuration).toBe('test');
      expect(result.reliabilityMetrics[0]?.successRate).toBe(0.95);
      
      expect(result.cpuUtilizationAnalysis[0]?.configuration).toBe('test');
      expect(result.cpuUtilizationAnalysis[0]?.avgHostCpuUsage).toBe(50);
    });
    
    it('should handle errors and return empty analysis', async () => {
      // Arrange
      const mockError = new Error('Test error');
      jest.spyOn(analysisEngine as any, 'loadTestResults').mockRejectedValue(mockError);
      
      // Act
      const result = await analysisEngine.analyzeIperfPerformance(mockDatasets);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.bandwidthComparison).toEqual([]);
      expect(result.latencyAnalysis).toEqual([]);
      expect(result.reliabilityMetrics).toEqual([]);
      expect(result.cpuUtilizationAnalysis).toEqual([]);
    });
  });
  
  describe('analyzeDnsPerformance', () => {
    it('should load test results and analyze DNS performance', async () => {
      // Act
      const result = await analysisEngine.analyzeDnsPerformance(mockDatasets);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.performanceMetrics).toHaveLength(1);
      expect(result.domainRankings).toHaveLength(1);
      expect(result.serverComparison).toHaveLength(1);
      
      // Check that the metrics have the expected values
      expect(result.performanceMetrics[0]?.configuration).toBe('test');
      expect(result.performanceMetrics[0]?.avgResponseTimeMs).toBe(15);
      expect(result.performanceMetrics[0]?.successRate).toBe(0.98);
      
      // Check domain rankings
      expect(result.domainRankings[0]?.domain).toBe('example.com');
      expect(result.domainRankings[0]?.avgResponseTimeMs).toBe(20);
      expect(result.domainRankings[0]?.successRate).toBe(0.95);
      expect(result.domainRankings[0]?.queryCount).toBe(10);
      
      // Check server comparison
      expect(result.serverComparison[0]?.server).toBe('8.8.8.8');
      expect(result.serverComparison[0]?.avgResponseTimeMs).toBe(15);
      expect(result.serverComparison[0]?.successRate).toBe(0.98);
      expect(result.serverComparison[0]?.configurations).toContain('test');
    });
    
    it('should handle errors and return empty analysis', async () => {
      // Arrange
      const mockError = new Error('Test error');
      jest.spyOn(analysisEngine as any, 'loadTestResults').mockRejectedValue(mockError);
      
      // Act
      const result = await analysisEngine.analyzeDnsPerformance(mockDatasets);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.performanceMetrics).toEqual([]);
      expect(result.domainRankings).toEqual([]);
      expect(result.serverComparison).toEqual([]);
    });
  });
  
  describe('compareConfigurations', () => {
    it('should load test results and compare configurations', async () => {
      // Act
      const result = await analysisEngine.compareConfigurations(mockDatasets);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.mtuImpact).toBeDefined();
      expect(result.loggingImpact).toBeDefined();
      expect(result.overallRanking).toBeDefined();
      
      // Check MTU impact
      expect(result.mtuImpact.optimalMtu).toBe(1500);
      expect(result.mtuImpact.performanceByMtu[1500]).toBeDefined();
      expect(result.mtuImpact.recommendations.length).toBeGreaterThan(0);
      
      // Check logging impact
      expect(result.loggingImpact.performanceImpact).toBe(5.2);
      expect(result.loggingImpact.bandwidthDifference).toBe(50);
      expect(result.loggingImpact.latencyDifference).toBe(5);
      expect(result.loggingImpact.recommendations.length).toBeGreaterThan(0);
      
      // Check overall ranking
      expect(result.overallRanking.length).toBe(1);
      expect(result.overallRanking[0]?.configuration).toBe('test');
      expect(result.overallRanking[0]?.overallScore).toBe(85);
      expect(result.overallRanking[0]?.rank).toBe(1);
    });
    
    it('should handle errors and return empty analysis', async () => {
      // Arrange
      const mockError = new Error('Test error');
      jest.spyOn(analysisEngine as any, 'loadTestResults').mockRejectedValue(mockError);
      
      // Act
      const result = await analysisEngine.compareConfigurations(mockDatasets);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.mtuImpact).toEqual({
        optimalMtu: 0,
        performanceByMtu: {},
        recommendations: []
      });
      expect(result.loggingImpact).toEqual({
        performanceImpact: 0,
        bandwidthDifference: 0,
        latencyDifference: 0,
        recommendations: []
      });
      expect(result.overallRanking).toEqual([]);
    });
  });
});