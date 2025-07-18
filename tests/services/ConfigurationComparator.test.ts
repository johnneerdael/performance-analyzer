// Tests for ConfigurationComparator service
import { ConfigurationComparator } from '../../src/services/ConfigurationComparator';
import { Dataset, TestResults } from '../../src/models';

// Type for mock datasets
interface MockDataset extends Dataset {
  name: string;
}

// Mock dependencies
jest.mock('../../src/services/IperfAnalyzer', () => ({
  IperfAnalyzer: jest.fn().mockImplementation(() => ({
    analyzeBandwidth: jest.fn().mockImplementation((datasets: MockDataset[]) => {
      return datasets.map((dataset: MockDataset) => ({
        configuration: dataset.name,
        avgBandwidthMbps: dataset.name.includes('mtu1500') ? 950 : 
                          dataset.name.includes('mtu8920') ? 1200 : 800,
        medianBandwidthMbps: dataset.name.includes('mtu1500') ? 960 : 
                             dataset.name.includes('mtu8920') ? 1210 : 810,
        maxBandwidthMbps: dataset.name.includes('mtu1500') ? 1000 : 
                          dataset.name.includes('mtu8920') ? 1300 : 850,
        minBandwidthMbps: dataset.name.includes('mtu1500') ? 900 : 
                          dataset.name.includes('mtu8920') ? 1100 : 750,
        standardDeviation: 50,
        percentile95: dataset.name.includes('mtu1500') ? 990 : 
                      dataset.name.includes('mtu8920') ? 1280 : 840,
        percentile99: dataset.name.includes('mtu1500') ? 995 : 
                      dataset.name.includes('mtu8920') ? 1290 : 845
      }));
    }),
    analyzeLatency: jest.fn().mockImplementation((datasets: MockDataset[]) => {
      return datasets.map((dataset: MockDataset) => ({
        configuration: dataset.name,
        avgLatencyMs: dataset.name.includes('mtu1500') ? 15 : 
                      dataset.name.includes('mtu8920') ? 18 : 12,
        medianLatencyMs: dataset.name.includes('mtu1500') ? 14 : 
                         dataset.name.includes('mtu8920') ? 17 : 11,
        maxLatencyMs: dataset.name.includes('mtu1500') ? 25 : 
                      dataset.name.includes('mtu8920') ? 30 : 20,
        minLatencyMs: dataset.name.includes('mtu1500') ? 10 : 
                      dataset.name.includes('mtu8920') ? 12 : 8,
        jitterMs: dataset.name.includes('mtu1500') ? 2 : 
                  dataset.name.includes('mtu8920') ? 3 : 1.5
      }));
    }),
    analyzeReliability: jest.fn().mockImplementation((datasets: MockDataset[]) => {
      return datasets.map((dataset: MockDataset) => ({
        configuration: dataset.name,
        successRate: dataset.name.includes('aws-logs_enabled') ? 0.95 : 0.98,
        retransmitRate: dataset.name.includes('aws-logs_enabled') ? 0.05 : 0.02,
        packetLossRate: dataset.name.includes('aws-logs_enabled') ? 0.03 : 0.01,
        errorCount: dataset.name.includes('aws-logs_enabled') ? 2 : 1
      }));
    }),
    analyzeCpuUtilization: jest.fn().mockImplementation((datasets: MockDataset[]) => {
      return datasets.map((dataset: MockDataset) => ({
        configuration: dataset.name,
        avgHostCpuUsage: dataset.name.includes('aws-logs_enabled') ? 65 : 50,
        avgRemoteCpuUsage: dataset.name.includes('aws-logs_enabled') ? 70 : 55,
        maxHostCpuUsage: dataset.name.includes('aws-logs_enabled') ? 80 : 65,
        maxRemoteCpuUsage: dataset.name.includes('aws-logs_enabled') ? 85 : 70
      }));
    })
  }))
}));

jest.mock('../../src/services/DnsAnalyzer', () => ({
  DnsAnalyzer: jest.fn().mockImplementation(() => ({
    analyzeDnsPerformance: jest.fn().mockImplementation((datasets: MockDataset[]) => {
      return {
        performanceMetrics: datasets.map((dataset: MockDataset) => ({
          configuration: dataset.name,
          avgResponseTimeMs: dataset.name.includes('aws-logs_enabled') ? 25 : 20,
          medianResponseTimeMs: dataset.name.includes('aws-logs_enabled') ? 23 : 18,
          successRate: dataset.name.includes('aws-logs_enabled') ? 0.96 : 0.99,
          slowestDomains: [],
          fastestDomains: []
        })),
        domainRankings: [],
        serverComparison: []
      };
    })
  }))
}));

jest.mock('../../src/utils/ErrorHandler', () => ({
  DefaultErrorHandler: jest.fn().mockImplementation(() => ({
    handleAnalysisError: jest.fn(),
    logError: jest.fn()
  }))
}));

describe('ConfigurationComparator', () => {
  let configComparator: ConfigurationComparator;
  let mockDatasets: Dataset[];
  
  beforeEach(() => {
    configComparator = new ConfigurationComparator();
    
    // Create mock datasets with different configurations
    mockDatasets = [
      {
        name: 'coredns-mtu1500-aws-logs_disabled',
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
        name: 'coredns-mtu1500-aws-logs_enabled',
        parametersFile: '/path/to/parameters-2.json',
        resultsFile: '/path/to/results-2.json',
        configuration: {
          mtu: 1500,
          awsLogging: true,
          backendServer: 'coredns',
          testDate: '2025-07-17 13:00:00'
        }
      },
      {
        name: 'coredns-mtu1420-aws-logs_disabled',
        parametersFile: '/path/to/parameters-3.json',
        resultsFile: '/path/to/results-3.json',
        configuration: {
          mtu: 1420,
          awsLogging: false,
          backendServer: 'coredns',
          testDate: '2025-07-17 14:00:00'
        }
      },
      {
        name: 'coredns-mtu8920-aws-logs_disabled',
        parametersFile: '/path/to/parameters-4.json',
        resultsFile: '/path/to/results-4.json',
        configuration: {
          mtu: 8920,
          awsLogging: false,
          backendServer: 'coredns',
          testDate: '2025-07-17 15:00:00'
        }
      }
    ];
    
    jest.clearAllMocks();
  });
  
  describe('compareConfigurations', () => {
    it('should return a complete configuration comparison', () => {
      // Act
      const result = configComparator.compareConfigurations(mockDatasets);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.mtuImpact).toBeDefined();
      expect(result.loggingImpact).toBeDefined();
      expect(result.overallRanking).toBeDefined();
      
      // Check that rankings are sorted correctly
      expect(result.overallRanking.length).toBe(mockDatasets.length);
      expect(result.overallRanking[0]?.rank).toBe(1);
      
      // Verify that the optimal MTU is identified correctly
      expect(result.mtuImpact.optimalMtu).toBe(8920);
    });
    
    it('should handle errors gracefully', () => {
      // Arrange
      jest.spyOn(configComparator as any, 'analyzeMtuImpact').mockImplementation(() => {
        throw new Error('Test error');
      });
      
      // Act
      const result = configComparator.compareConfigurations(mockDatasets);
      
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
  
  describe('analyzeMtuImpact', () => {
    it('should analyze the impact of different MTU settings', () => {
      // Act
      const result = configComparator.analyzeMtuImpact(mockDatasets);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.optimalMtu).toBe(8920);
      expect(Object.keys(result.performanceByMtu).length).toBe(3); // 1500, 1420, 8920
      expect(result.recommendations.length).toBeGreaterThan(0);
      
      // Check that performance metrics are calculated correctly
      expect(result.performanceByMtu[1500]).toBeDefined();
      expect(result.performanceByMtu[1420]).toBeDefined();
      expect(result.performanceByMtu[8920]).toBeDefined();
      
      // Verify that jumbo frames have higher bandwidth
      const jumboFrameBandwidth = result.performanceByMtu[8920]?.avgBandwidth || 0;
      const standardFrameBandwidth = result.performanceByMtu[1500]?.avgBandwidth || 0;
      expect(jumboFrameBandwidth).toBeGreaterThan(standardFrameBandwidth);
    });
    
    it('should handle empty datasets', () => {
      // Act
      const result = configComparator.analyzeMtuImpact([]);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.optimalMtu).toBe(0);
      expect(Object.keys(result.performanceByMtu).length).toBe(0);
      expect(result.recommendations).toEqual(["Insufficient data to make MTU recommendations."]);
    });
  });
  
  describe('analyzeLoggingImpact', () => {
    it('should analyze the impact of AWS logging', () => {
      // Act
      const result = configComparator.analyzeLoggingImpact(mockDatasets);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.performanceImpact).toBeDefined();
      expect(result.bandwidthDifference).toBeDefined();
      expect(result.latencyDifference).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
      
      // Verify that logging has a negative impact on performance
      expect(result.performanceImpact).toBeGreaterThan(0);
      expect(result.bandwidthDifference).toBeGreaterThan(0);
    });
    
    it('should handle datasets with only one logging state', () => {
      // Arrange
      const singleLoggingDatasets = mockDatasets.filter(d => !d.configuration.awsLogging);
      
      // Act
      const result = configComparator.analyzeLoggingImpact(singleLoggingDatasets);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.performanceImpact).toBe(0);
      expect(result.bandwidthDifference).toBe(0);
      expect(result.latencyDifference).toBe(0);
      expect(result.recommendations.length).toBe(1);
      expect(result.recommendations[0]).toContain('Insufficient data');
    });
  });
  
  describe('rankConfigurations', () => {
    it('should rank configurations based on performance metrics', () => {
      // Act
      const result = configComparator.rankConfigurations(mockDatasets);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(mockDatasets.length);
      
      // Check that rankings are assigned correctly
      expect(result[0]?.rank).toBe(1);
      expect(result[1]?.rank).toBe(2);
      expect(result[2]?.rank).toBe(3);
      expect(result[3]?.rank).toBe(4);
      
      // Verify that configurations are sorted by overall score
      for (let i = 1; i < result.length; i++) {
        const prevScore = result[i-1]?.overallScore || 0;
        const currScore = result[i]?.overallScore || 0;
        expect(prevScore).toBeGreaterThanOrEqual(currScore);
      }
      
      // Check that the jumbo frame configuration is ranked highest
      expect(result[0]?.configuration).toBe('coredns-mtu8920-aws-logs_disabled');
    });
    
    it('should handle empty datasets', () => {
      // Act
      const result = configComparator.rankConfigurations([]);
      
      // Assert
      expect(result).toBeDefined();
      expect(result).toEqual([]);
    });
  });
  
  describe('analyzePerformanceTrends', () => {
    it('should analyze performance trends across configurations', () => {
      // Act
      const result = configComparator.analyzePerformanceTrends(mockDatasets);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.mtuTrends).toBeDefined();
      expect(result.serverTrends).toBeDefined();
      expect(result.loggingTrends).toBeDefined();
      
      // Check that MTU trends include all MTU values
      expect(Object.keys(result.mtuTrends).length).toBe(3); // 1500, 1420, 8920
      
      // Check that logging trends include both states
      expect(Object.keys(result.loggingTrends).length).toBe(2); // enabled, disabled
      
      // Verify that server trends include the backend server
      expect(Object.keys(result.serverTrends)).toContain('coredns');
    });
  });
});