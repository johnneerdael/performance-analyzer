import { AnomalyDetector, AnomalyDetectionConfig } from '../../src/services/AnomalyDetector';
import { Dataset, TestResults, IperfTestResult, DnsTestResult } from '../../types/models';

describe('AnomalyDetector', () => {
  // Helper function to create a mock dataset
  const createMockDataset = (
    name: string,
    mtu: number,
    awsLogging: boolean,
    iperfTests: IperfTestResult[] = [],
    dnsResults: DnsTestResult[] = []
  ): Dataset & { results?: TestResults } => {
    // Ensure we have a valid backendServer name
    const backendServer = name.split('-')[0] || 'default';
    
    // Create the dataset with an additional results property
    // This mimics how the AnalysisEngine adds results to datasets after loading
    return {
      name,
      parametersFile: `${name}/parameters.json`,
      resultsFile: `${name}/results.json`,
      configuration: {
        mtu,
        awsLogging,
        backendServer,
        testDate: '2025-07-17'
      },
      results: {
        iperfTests,
        dnsResults
      }
    };
  };

  // Helper function to create a mock iperf test result
  const createIperfTestResult = (
    bandwidthMbps: number,
    jitterMs?: number,
    packetLoss?: number,
    retransmits?: number
  ): IperfTestResult => {
    const result: IperfTestResult = {
      server: 'test-server',
      scenario: 'tcp-test',
      success: true,
      bandwidthMbps
    };
    
    // Only add optional properties if they are defined
    if (jitterMs !== undefined) result.jitterMs = jitterMs;
    if (packetLoss !== undefined) result.packetLoss = packetLoss;
    if (retransmits !== undefined) result.retransmits = retransmits;
    
    // Add additional properties needed for calculations
    result.bytes = 1000000;
    result.tcpMssDefault = 1460;
    
    return result;
  };

  // Helper function to create a mock DNS test result
  const createDnsTestResult = (
    domain: string,
    responseTimeMs: number,
    success: boolean = true
  ): DnsTestResult => {
    return {
      domain,
      dnsServer: '8.8.8.8',
      success,
      responseTimeMs,
      queryTimeMs: responseTimeMs * 0.8,
      resolvedIps: success ? ['192.168.1.1'] : []
    };
  };

  describe('detectBandwidthAnomalies', () => {
    it('should detect low bandwidth anomalies', () => {
      // Create custom configuration with lower thresholds for testing
      const config: Partial<AnomalyDetectionConfig> = {
        bandwidthMinimumThreshold: 500, // 500 Mbps minimum
        bandwidthDeviationThreshold: 0.2 // 20% deviation threshold
      };
      
      const anomalyDetector = new AnomalyDetector(config);
      
      // Create datasets with varying bandwidth values
      const datasets = [
        // Normal bandwidth
        createMockDataset('coredns-mtu1500-aws-logs_disabled', 1500, false, [
          createIperfTestResult(800),
          createIperfTestResult(850),
          createIperfTestResult(820)
        ]),
        // Low bandwidth (anomaly)
        createMockDataset('coredns-mtu1420-aws-logs_disabled', 1420, false, [
          createIperfTestResult(400),
          createIperfTestResult(380),
          createIperfTestResult(420)
        ]),
        // Very high bandwidth (deviation anomaly)
        createMockDataset('coredns-mtu8920-aws-logs_disabled', 8920, false, [
          createIperfTestResult(1200),
          createIperfTestResult(1250),
          createIperfTestResult(1180)
        ])
      ];
      
      // Detect anomalies
      const anomalies = anomalyDetector.detectAnomalies(datasets);
      
      // Expect at least two anomalies: one for low bandwidth, one for deviation
      expect(anomalies.length).toBeGreaterThanOrEqual(2);
      
      // Check for low bandwidth anomaly
      const lowBandwidthAnomaly = anomalies.find(
        a => a.type === 'bandwidth' && a.configuration.includes('mtu1420') && a.description.includes('Low bandwidth')
      );
      expect(lowBandwidthAnomaly).toBeDefined();
      expect(lowBandwidthAnomaly?.severity).toBeDefined();
      
      // Check for bandwidth deviation anomaly
      const deviationAnomaly = anomalies.find(
        a => a.type === 'bandwidth' && a.description.includes('deviation')
      );
      expect(deviationAnomaly).toBeDefined();
    });
  });

  describe('detectLatencyAnomalies', () => {
    it('should detect high jitter anomalies', () => {
      // Create custom configuration with lower thresholds for testing
      const config: Partial<AnomalyDetectionConfig> = {
        latencyMaximumThreshold: 10, // 10ms maximum acceptable jitter
        latencyDeviationThreshold: 0.2 // 20% deviation threshold
      };
      
      const anomalyDetector = new AnomalyDetector(config);
      
      // Create datasets with varying jitter values
      const datasets = [
        // Normal jitter
        createMockDataset('coredns-mtu1500-aws-logs_disabled', 1500, false, [
          createIperfTestResult(800, 5),
          createIperfTestResult(850, 6),
          createIperfTestResult(820, 4)
        ]),
        // High jitter (anomaly)
        createMockDataset('coredns-mtu1420-aws-logs_disabled', 1420, false, [
          createIperfTestResult(800, 15),
          createIperfTestResult(850, 18),
          createIperfTestResult(820, 16)
        ])
      ];
      
      // Detect anomalies
      const anomalies = anomalyDetector.detectAnomalies(datasets);
      
      // Expect at least one anomaly for high jitter
      expect(anomalies.length).toBeGreaterThanOrEqual(1);
      
      // Check for high jitter anomaly
      const highJitterAnomaly = anomalies.find(
        a => a.type === 'latency' && a.configuration.includes('mtu1420') && a.description.includes('High jitter')
      );
      expect(highJitterAnomaly).toBeDefined();
      expect(highJitterAnomaly?.severity).toBeDefined();
      expect(highJitterAnomaly?.affectedMetrics).toContain('jitterMs');
    });
  });

  describe('detectPacketLossAnomalies', () => {
    it('should detect high packet loss and retransmit anomalies', () => {
      // Create custom configuration with lower thresholds for testing
      const config: Partial<AnomalyDetectionConfig> = {
        packetLossThreshold: 0.01, // 1% packet loss threshold
        retransmitRateThreshold: 0.02 // 2% retransmit rate threshold
      };
      
      const anomalyDetector = new AnomalyDetector(config);
      
      // Create datasets with varying packet loss and retransmit values
      const datasets = [
        // Normal packet loss and retransmits
        createMockDataset('coredns-mtu1500-aws-logs_disabled', 1500, false, [
          createIperfTestResult(800, 5, 0.005, 10), // 0.5% packet loss, ~1.5% retransmits
          createIperfTestResult(850, 6, 0.006, 12)
        ]),
        // High packet loss (anomaly)
        createMockDataset('coredns-mtu1420-aws-logs_disabled', 1420, false, [
          createIperfTestResult(800, 15, 0.03, 15), // 3% packet loss
          createIperfTestResult(850, 18, 0.025, 18)
        ]),
        // High retransmits (anomaly)
        createMockDataset('coredns-mtu8920-aws-logs_disabled', 8920, false, [
          createIperfTestResult(900, 7, 0.008, 60), // ~8.7% retransmits
          createIperfTestResult(920, 8, 0.009, 65)
        ])
      ];
      
      // Detect anomalies
      const anomalies = anomalyDetector.detectAnomalies(datasets);
      
      // Expect at least two anomalies: one for packet loss, one for retransmits
      expect(anomalies.length).toBeGreaterThanOrEqual(2);
      
      // Check for high packet loss anomaly
      const packetLossAnomaly = anomalies.find(
        a => a.type === 'packet_loss' && a.description.includes('packet loss')
      );
      expect(packetLossAnomaly).toBeDefined();
      expect(packetLossAnomaly?.severity).toBeDefined();
      expect(packetLossAnomaly?.affectedMetrics).toContain('packetLoss');
      
      // Check for high retransmit rate anomaly
      const retransmitAnomaly = anomalies.find(
        a => a.type === 'packet_loss' && a.description.includes('retransmit rate')
      );
      expect(retransmitAnomaly).toBeDefined();
      expect(retransmitAnomaly?.affectedMetrics).toContain('retransmits');
    });
  });

  describe('detectDnsAnomalies', () => {
    it('should detect slow DNS response times and low success rates', () => {
      // Create custom configuration with lower thresholds for testing
      const config: Partial<AnomalyDetectionConfig> = {
        dnsResponseTimeThreshold: 50, // 50ms threshold
        dnsSuccessRateThreshold: 0.95 // 95% success rate threshold
      };
      
      const anomalyDetector = new AnomalyDetector(config);
      
      // Create datasets with varying DNS response times and success rates
      const datasets = [
        // Normal DNS performance
        createMockDataset('coredns-mtu1500-aws-logs_disabled', 1500, false, [], [
          createDnsTestResult('example.com', 20),
          createDnsTestResult('google.com', 25),
          createDnsTestResult('github.com', 30)
        ]),
        // Slow DNS responses (anomaly)
        createMockDataset('coredns-mtu1420-aws-logs_disabled', 1420, false, [], [
          createDnsTestResult('example.com', 80),
          createDnsTestResult('google.com', 90),
          createDnsTestResult('github.com', 85)
        ]),
        // Low DNS success rate (anomaly)
        createMockDataset('coredns-mtu8920-aws-logs_disabled', 8920, false, [], [
          createDnsTestResult('example.com', 30),
          createDnsTestResult('google.com', 35, false), // Failed
          createDnsTestResult('github.com', 40, false), // Failed
          createDnsTestResult('microsoft.com', 25)
        ])
      ];
      
      // Detect anomalies
      const anomalies = anomalyDetector.detectAnomalies(datasets);
      
      // Expect at least two anomalies: one for slow response, one for low success rate
      expect(anomalies.length).toBeGreaterThanOrEqual(2);
      
      // Check for slow DNS response anomaly
      const slowDnsAnomaly = anomalies.find(
        a => a.type === 'dns_failure' && a.description.includes('Slow DNS response')
      );
      expect(slowDnsAnomaly).toBeDefined();
      expect(slowDnsAnomaly?.severity).toBeDefined();
      expect(slowDnsAnomaly?.affectedMetrics).toContain('responseTimeMs');
      
      // Check for low DNS success rate anomaly
      const lowSuccessRateAnomaly = anomalies.find(
        a => a.type === 'dns_failure' && a.description.includes('Low DNS success rate')
      );
      expect(lowSuccessRateAnomaly).toBeDefined();
      expect(lowSuccessRateAnomaly?.affectedMetrics).toContain('success');
    });
    
    it('should detect consistently slow domains across configurations', () => {
      // Create custom configuration with lower thresholds for testing
      const config: Partial<AnomalyDetectionConfig> = {
        dnsResponseTimeThreshold: 50 // 50ms threshold
      };
      
      const anomalyDetector = new AnomalyDetector(config);
      
      // Create datasets with a consistently slow domain
      const datasets = [
        createMockDataset('coredns-mtu1500-aws-logs_disabled', 1500, false, [], [
          createDnsTestResult('example.com', 20),
          createDnsTestResult('slow-domain.com', 90), // Consistently slow
          createDnsTestResult('github.com', 30)
        ]),
        createMockDataset('coredns-mtu1420-aws-logs_disabled', 1420, false, [], [
          createDnsTestResult('example.com', 25),
          createDnsTestResult('slow-domain.com', 95), // Consistently slow
          createDnsTestResult('github.com', 35)
        ])
      ];
      
      // Detect anomalies
      const anomalies = anomalyDetector.detectAnomalies(datasets);
      
      // Check for consistently slow domain anomaly
      const slowDomainAnomaly = anomalies.find(
        a => a.type === 'dns_failure' && a.description.includes('slow-domain.com')
      );
      expect(slowDomainAnomaly).toBeDefined();
      expect(slowDomainAnomaly?.severity).toBeDefined();
      expect(slowDomainAnomaly?.affectedMetrics).toContain('domain');
    });
  });

  describe('configurable thresholds', () => {
    it('should respect custom threshold configuration', () => {
      // Create two detectors with different thresholds
      const strictDetector = new AnomalyDetector({
        bandwidthMinimumThreshold: 1000, // Very high minimum
        packetLossThreshold: 0.001 // Very low threshold (0.1%)
      });
      
      const lenientDetector = new AnomalyDetector({
        bandwidthMinimumThreshold: 100, // Very low minimum
        packetLossThreshold: 0.1 // Very high threshold (10%)
      });
      
      // Create test dataset with borderline values
      const datasets = [
        createMockDataset('test-config', 1500, false, [
          createIperfTestResult(500, 5, 0.05), // 500 Mbps, 5% packet loss
          createIperfTestResult(550, 6, 0.045)
        ])
      ];
      
      // Detect anomalies with both detectors
      const strictAnomalies = strictDetector.detectAnomalies(datasets);
      const lenientAnomalies = lenientDetector.detectAnomalies(datasets);
      
      // Strict detector should find more anomalies
      expect(strictAnomalies.length).toBeGreaterThan(lenientAnomalies.length);
      
      // Strict detector should find bandwidth anomaly
      const strictBandwidthAnomaly = strictAnomalies.find(
        a => a.type === 'bandwidth' && a.description.includes('Low bandwidth')
      );
      expect(strictBandwidthAnomaly).toBeDefined();
      
      // Strict detector should find packet loss anomaly
      const strictPacketLossAnomaly = strictAnomalies.find(
        a => a.type === 'packet_loss' && a.description.includes('packet loss')
      );
      expect(strictPacketLossAnomaly).toBeDefined();
      
      // Lenient detector should not find bandwidth anomaly
      const lenientBandwidthAnomaly = lenientAnomalies.find(
        a => a.type === 'bandwidth' && a.description.includes('Low bandwidth')
      );
      expect(lenientBandwidthAnomaly).toBeUndefined();
    });
  });

  describe('severity levels', () => {
    it('should correctly assign severity levels based on threshold ratios', () => {
      // Create a simpler test that directly tests the determineSeverity method
      const detector = new AnomalyDetector({
        severityLevels: {
          low: 1.1,    // Just 10% over threshold for low
          medium: 1.5, // 50% over threshold for medium
          high: 2.0    // 100% over threshold for high
        }
      });
      
      // Create a test dataset with packet loss anomalies of different severities
      const datasets = [
        createMockDataset('test-config', 1500, false, [
          // Create test with low severity packet loss (just above threshold)
          createIperfTestResult(800, 5, 0.011), // 1.1% packet loss (threshold is 1%)
          
          // Create test with medium severity packet loss
          createIperfTestResult(800, 5, 0.02), // 2% packet loss
          
          // Create test with high severity packet loss
          createIperfTestResult(800, 5, 0.05) // 5% packet loss
        ])
      ];
      
      // Detect anomalies
      const anomalies = detector.detectAnomalies(datasets);
      
      // We should have at least one packet loss anomaly
      expect(anomalies.length).toBeGreaterThan(0);
      
      // Check if we have anomalies before accessing their properties
      if (anomalies.length > 0 && anomalies[0]) {
        const firstAnomaly = anomalies[0];
        expect(firstAnomaly.type).toBe('packet_loss');
        
        // The severity should be 'high' since we're using the maximum packet loss value
        expect(firstAnomaly.severity).toBe('high');
      }
      
      // Now let's directly test the determineSeverity method by accessing it
      // We need to use any type to access the private method
      const anyDetector = detector as any;
      
      // Test different severity levels
      expect(anyDetector.determineSeverity(1.05)).toBe('low');
      expect(anyDetector.determineSeverity(1.6)).toBe('medium');
      expect(anyDetector.determineSeverity(2.5)).toBe('high');
    });
  });
});