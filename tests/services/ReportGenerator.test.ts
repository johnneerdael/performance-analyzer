import { DefaultReportGenerator } from '../../src/services/ReportGenerator';
import { 
  AnalysisResults, 
  BandwidthMetrics, 
  LatencyMetrics, 
  ReliabilityMetrics, 
  CpuMetrics,
  DnsPerformanceMetrics,
  DomainPerformance,
  ConfigurationRanking,
  PerformanceAnomaly,
  IperfAnalysis,
  DnsAnalysis,
  ConfigurationComparison,
  ExecutiveSummary,
  MtuAnalysis,
  LoggingAnalysis,
  DnsServerComparison,
  PerformanceSummary
} from '../../src/models';

describe('ReportGenerator', () => {
  let reportGenerator: DefaultReportGenerator;
  let mockAnalysisResults: AnalysisResults;

  beforeEach(() => {
    reportGenerator = new DefaultReportGenerator();
    
    // Create mock analysis results for testing
    mockAnalysisResults = createMockAnalysisResults();
  });

  describe('generateReport', () => {
    it('should generate a complete markdown report', async () => {
      const report = await reportGenerator.generateReport(mockAnalysisResults);
      
      // Verify report structure
      expect(report).toContain('# Network Performance Analysis Report');
      expect(report).toContain('## Executive Summary');
      expect(report).toContain('## Configuration Overview');
      expect(report).toContain('## Detailed Performance Analysis');
      expect(report).toContain('## Performance Visualization Analysis');
      expect(report).toContain('## Performance Anomalies');
      expect(report).toContain('## Recommendations');
    });

    it('should handle errors gracefully', async () => {
      // Create a broken analysis results object to trigger an error
      const brokenAnalysis = {} as AnalysisResults;
      
      await expect(reportGenerator.generateReport(brokenAnalysis)).rejects.toThrow();
    });
  });

  describe('createExecutiveSummary', () => {
    it('should generate an executive summary with key findings', () => {
      const summary = reportGenerator.createExecutiveSummary(mockAnalysisResults);
      
      expect(summary).toContain('## Executive Summary');
      expect(summary).toContain('### Key Findings');
      
      // Verify key findings are included
      mockAnalysisResults.summary.keyFindings.forEach(finding => {
        expect(summary).toContain(finding);
      });
    });

    it('should include optimal configuration', () => {
      const summary = reportGenerator.createExecutiveSummary(mockAnalysisResults);
      
      expect(summary).toContain('### Optimal Configuration');
      expect(summary).toContain(mockAnalysisResults.summary.optimalConfiguration);
    });

    it('should include performance highlights', () => {
      const summary = reportGenerator.createExecutiveSummary(mockAnalysisResults);
      
      expect(summary).toContain('### Performance Highlights');
      
      // Verify performance highlights are included
      mockAnalysisResults.summary.performanceHighlights.forEach(highlight => {
        expect(summary).toContain(highlight);
      });
    });
  });

  describe('generateDetailedTables', () => {
    it('should generate bandwidth performance table', () => {
      const tables = reportGenerator.generateDetailedTables(mockAnalysisResults);
      
      expect(tables).toContain('### Bandwidth Performance');
      expect(tables).toContain('| Configuration | Avg (Mbps) | Median (Mbps) | Max (Mbps) | Min (Mbps) | Std Dev | 95th % | 99th % |');
      
      // Verify each configuration is included in the table
      mockAnalysisResults.iperfAnalysis.bandwidthComparison.forEach(metric => {
        expect(tables).toContain(metric.configuration);
        expect(tables).toContain(metric.avgBandwidthMbps.toFixed(2));
      });
    });

    it('should generate latency performance table', () => {
      const tables = reportGenerator.generateDetailedTables(mockAnalysisResults);
      
      expect(tables).toContain('### Latency Performance');
      expect(tables).toContain('| Configuration | Avg (ms) | Median (ms) | Max (ms) | Min (ms) | Jitter (ms) |');
      
      // Verify each configuration is included in the table
      mockAnalysisResults.iperfAnalysis.latencyAnalysis.forEach(metric => {
        expect(tables).toContain(metric.configuration);
        expect(tables).toContain(metric.avgLatencyMs.toFixed(2));
      });
    });

    it('should generate reliability metrics table', () => {
      const tables = reportGenerator.generateDetailedTables(mockAnalysisResults);
      
      expect(tables).toContain('### Reliability Metrics');
      expect(tables).toContain('| Configuration | Success Rate (%) | Retransmit Rate (%) | Packet Loss (%) | Error Count |');
      
      // Verify each configuration is included in the table
      mockAnalysisResults.iperfAnalysis.reliabilityMetrics.forEach(metric => {
        expect(tables).toContain(metric.configuration);
        expect(tables).toContain((metric.successRate * 100).toFixed(2));
      });
    });

    it('should generate DNS performance table', () => {
      const tables = reportGenerator.generateDetailedTables(mockAnalysisResults);
      
      expect(tables).toContain('### DNS Performance');
      expect(tables).toContain('| Configuration | Avg Response Time (ms) | Median Response Time (ms) | Success Rate (%) |');
      
      // Verify each configuration is included in the table
      mockAnalysisResults.dnsAnalysis.performanceMetrics.forEach(metric => {
        expect(tables).toContain(metric.configuration);
        expect(tables).toContain(metric.avgResponseTimeMs.toFixed(2));
      });
    });

    it('should generate domain ranking table', () => {
      const tables = reportGenerator.generateDetailedTables(mockAnalysisResults);
      
      expect(tables).toContain('### Slowest DNS Domains');
      expect(tables).toContain('| Domain | Avg Response Time (ms) | Success Rate (%) | Query Count |');
      
      // Verify slowest domains are included in the table
      const slowestDomains = [...mockAnalysisResults.dnsAnalysis.domainRankings]
        .sort((a, b) => b.avgResponseTimeMs - a.avgResponseTimeMs)
        .slice(0, 10);
      
      slowestDomains.forEach(domain => {
        expect(tables).toContain(domain.domain);
        expect(tables).toContain(domain.avgResponseTimeMs.toFixed(2));
      });
    });
  });

  describe('createVisualizationDescriptions', () => {
    it('should generate bandwidth visualization description', () => {
      const descriptions = reportGenerator.createVisualizationDescriptions(mockAnalysisResults);
      
      expect(descriptions).toContain('### Bandwidth Comparison');
      
      // Verify best configuration is mentioned
      const bestConfig = [...mockAnalysisResults.iperfAnalysis.bandwidthComparison]
        .sort((a, b) => b.avgBandwidthMbps - a.avgBandwidthMbps)[0];
      
      if (bestConfig) {
        expect(descriptions).toContain(bestConfig.configuration);
        expect(descriptions).toContain(bestConfig.avgBandwidthMbps.toFixed(2));
      }
    });

    it('should generate MTU impact analysis description', () => {
      const descriptions = reportGenerator.createVisualizationDescriptions(mockAnalysisResults);
      
      expect(descriptions).toContain('### MTU Impact Analysis');
      expect(descriptions).toContain(mockAnalysisResults.configurationComparison.mtuImpact.optimalMtu.toString());
      
      // Verify recommendations are included
      mockAnalysisResults.configurationComparison.mtuImpact.recommendations.forEach(rec => {
        expect(descriptions).toContain(rec);
      });
    });

    it('should generate DNS performance description', () => {
      const descriptions = reportGenerator.createVisualizationDescriptions(mockAnalysisResults);
      
      expect(descriptions).toContain('### DNS Performance Patterns');
      
      // Verify best configuration is mentioned
      const bestConfig = [...mockAnalysisResults.dnsAnalysis.performanceMetrics]
        .sort((a, b) => a.avgResponseTimeMs - b.avgResponseTimeMs)[0];
      
      if (bestConfig) {
        expect(descriptions).toContain(bestConfig.configuration);
        expect(descriptions).toContain(bestConfig.avgResponseTimeMs.toFixed(2));
      }
    });
  });
});

/**
 * Create mock analysis results for testing
 * @returns Mock analysis results
 */
function createMockAnalysisResults(): AnalysisResults {
  // Create bandwidth metrics
  const bandwidthComparison: BandwidthMetrics[] = [
    {
      configuration: 'coredns-mtu1500-aws-logs_disabled',
      avgBandwidthMbps: 950.25,
      medianBandwidthMbps: 955.10,
      maxBandwidthMbps: 980.50,
      minBandwidthMbps: 920.75,
      standardDeviation: 15.25,
      percentile95: 975.30,
      percentile99: 978.90
    },
    {
      configuration: 'coredns-mtu8920-aws-logs_disabled',
      avgBandwidthMbps: 980.75,
      medianBandwidthMbps: 985.20,
      maxBandwidthMbps: 995.50,
      minBandwidthMbps: 960.25,
      standardDeviation: 10.75,
      percentile95: 990.80,
      percentile99: 994.20
    },
    {
      configuration: 'stock-mtu1500-aws-logs_disabled',
      avgBandwidthMbps: 930.50,
      medianBandwidthMbps: 935.80,
      maxBandwidthMbps: 960.25,
      minBandwidthMbps: 900.10,
      standardDeviation: 18.50,
      percentile95: 955.40,
      percentile99: 958.90
    }
  ];

  // Create latency metrics
  const latencyAnalysis: LatencyMetrics[] = [
    {
      configuration: 'coredns-mtu1500-aws-logs_disabled',
      avgLatencyMs: 2.25,
      medianLatencyMs: 2.10,
      maxLatencyMs: 5.50,
      minLatencyMs: 1.75,
      jitterMs: 0.35
    },
    {
      configuration: 'coredns-mtu8920-aws-logs_disabled',
      avgLatencyMs: 1.95,
      medianLatencyMs: 1.85,
      maxLatencyMs: 4.20,
      minLatencyMs: 1.50,
      jitterMs: 0.30
    },
    {
      configuration: 'stock-mtu1500-aws-logs_disabled',
      avgLatencyMs: 2.50,
      medianLatencyMs: 2.35,
      maxLatencyMs: 6.10,
      minLatencyMs: 1.90,
      jitterMs: 0.45
    }
  ];

  // Create reliability metrics
  const reliabilityMetrics: ReliabilityMetrics[] = [
    {
      configuration: 'coredns-mtu1500-aws-logs_disabled',
      successRate: 0.995,
      retransmitRate: 0.002,
      packetLossRate: 0.001,
      errorCount: 5
    },
    {
      configuration: 'coredns-mtu8920-aws-logs_disabled',
      successRate: 0.998,
      retransmitRate: 0.001,
      packetLossRate: 0.0005,
      errorCount: 2
    },
    {
      configuration: 'stock-mtu1500-aws-logs_disabled',
      successRate: 0.990,
      retransmitRate: 0.005,
      packetLossRate: 0.002,
      errorCount: 10
    }
  ];

  // Create CPU utilization metrics
  const cpuUtilizationAnalysis: CpuMetrics[] = [
    {
      configuration: 'coredns-mtu1500-aws-logs_disabled',
      avgHostCpuUsage: 0.25,
      avgRemoteCpuUsage: 0.30,
      maxHostCpuUsage: 0.45,
      maxRemoteCpuUsage: 0.50
    },
    {
      configuration: 'coredns-mtu8920-aws-logs_disabled',
      avgHostCpuUsage: 0.20,
      avgRemoteCpuUsage: 0.25,
      maxHostCpuUsage: 0.40,
      maxRemoteCpuUsage: 0.45
    },
    {
      configuration: 'stock-mtu1500-aws-logs_disabled',
      avgHostCpuUsage: 0.30,
      avgRemoteCpuUsage: 0.35,
      maxHostCpuUsage: 0.55,
      maxRemoteCpuUsage: 0.60
    }
  ];

  // Create DNS performance metrics
  const dnsPerformanceMetrics: DnsPerformanceMetrics[] = [
    {
      configuration: 'coredns-mtu1500-aws-logs_disabled',
      avgResponseTimeMs: 5.25,
      medianResponseTimeMs: 4.80,
      successRate: 0.995,
      slowestDomains: [],
      fastestDomains: []
    },
    {
      configuration: 'coredns-mtu8920-aws-logs_disabled',
      avgResponseTimeMs: 4.50,
      medianResponseTimeMs: 4.20,
      successRate: 0.998,
      slowestDomains: [],
      fastestDomains: []
    },
    {
      configuration: 'stock-mtu1500-aws-logs_disabled',
      avgResponseTimeMs: 6.10,
      medianResponseTimeMs: 5.75,
      successRate: 0.990,
      slowestDomains: [],
      fastestDomains: []
    }
  ];

  // Create domain performance metrics
  const domainRankings: DomainPerformance[] = [
    {
      domain: 'example.com',
      avgResponseTimeMs: 3.50,
      successRate: 0.998,
      queryCount: 100
    },
    {
      domain: 'slow-domain.com',
      avgResponseTimeMs: 12.75,
      successRate: 0.950,
      queryCount: 100
    },
    {
      domain: 'very-slow-domain.com',
      avgResponseTimeMs: 15.20,
      successRate: 0.920,
      queryCount: 100
    },
    {
      domain: 'medium-domain.com',
      avgResponseTimeMs: 8.50,
      successRate: 0.980,
      queryCount: 100
    },
    {
      domain: 'fast-domain.com',
      avgResponseTimeMs: 2.80,
      successRate: 0.999,
      queryCount: 100
    }
  ];

  // Create DNS server comparison
  const serverComparison: DnsServerComparison[] = [
    {
      server: '8.8.8.8',
      avgResponseTimeMs: 5.25,
      successRate: 0.995,
      configurations: ['coredns-mtu1500-aws-logs_disabled', 'coredns-mtu8920-aws-logs_disabled']
    },
    {
      server: '1.1.1.1',
      avgResponseTimeMs: 4.80,
      successRate: 0.998,
      configurations: ['coredns-mtu1500-aws-logs_disabled', 'coredns-mtu8920-aws-logs_disabled']
    }
  ];

  // Create MTU analysis
  const mtuImpact: MtuAnalysis = {
    optimalMtu: 8920,
    performanceByMtu: {
      1500: {
        avgBandwidth: 950.25,
        avgLatency: 2.25,
        successRate: 0.995,
        cpuUsage: 0.25
      },
      8920: {
        avgBandwidth: 980.75,
        avgLatency: 1.95,
        successRate: 0.998,
        cpuUsage: 0.20
      }
    },
    recommendations: [
      'Use MTU 8920 for optimal bandwidth performance',
      'Consider MTU 1500 for compatibility with legacy systems'
    ]
  };

  // Create logging impact analysis
  const loggingImpact: LoggingAnalysis = {
    performanceImpact: -5.25,
    bandwidthDifference: -25.50,
    latencyDifference: 0.30,
    recommendations: [
      'Disable AWS logging for optimal performance',
      'If logging is required, consider batch processing logs'
    ]
  };

  // Create configuration ranking
  const overallRanking: ConfigurationRanking[] = [
    {
      configuration: 'coredns-mtu8920-aws-logs_disabled',
      overallScore: 95.5,
      bandwidthScore: 98.0,
      latencyScore: 97.5,
      reliabilityScore: 99.8,
      rank: 1
    },
    {
      configuration: 'coredns-mtu1500-aws-logs_disabled',
      overallScore: 92.5,
      bandwidthScore: 95.0,
      latencyScore: 94.5,
      reliabilityScore: 99.5,
      rank: 2
    },
    {
      configuration: 'stock-mtu1500-aws-logs_disabled',
      overallScore: 88.0,
      bandwidthScore: 93.0,
      latencyScore: 92.0,
      reliabilityScore: 99.0,
      rank: 3
    }
  ];

  // Create anomalies
  const anomalies: PerformanceAnomaly[] = [
    {
      type: 'bandwidth',
      configuration: 'stock-mtu1500-aws-logs_disabled',
      description: 'Significant bandwidth drop observed during peak hours',
      severity: 'medium',
      affectedMetrics: ['avgBandwidthMbps', 'minBandwidthMbps'],
      recommendations: [
        'Investigate network congestion during peak hours',
        'Consider traffic shaping to prioritize critical services'
      ]
    },
    {
      type: 'dns_failure',
      configuration: 'coredns-mtu1500-aws-logs_disabled',
      description: 'Intermittent DNS resolution failures for specific domains',
      severity: 'low',
      affectedMetrics: ['successRate', 'avgResponseTimeMs'],
      recommendations: [
        'Implement DNS caching for frequently accessed domains',
        'Consider alternative DNS servers for affected domains'
      ]
    }
  ];

  // Create executive summary
  const summary: ExecutiveSummary = {
    totalDatasets: 3,
    keyFindings: [
      'MTU 8920 provides optimal bandwidth performance with 3.2% improvement over MTU 1500',
      'CoreDNS outperforms stock DNS resolver by 25% in response time',
      'AWS logging impacts bandwidth by approximately 2.5% when enabled'
    ],
    recommendations: [
      'Deploy CoreDNS with MTU 8920 for optimal network performance',
      'Disable AWS logging in performance-critical environments',
      'Implement DNS caching for frequently accessed domains'
    ],
    optimalConfiguration: 'coredns-mtu8920-aws-logs_disabled',
    performanceHighlights: [
      'Bandwidth improved by 30.25 Mbps with optimal configuration',
      'DNS response time reduced by 1.6ms with CoreDNS vs stock resolver',
      'Packet loss reduced by 75% with optimal configuration'
    ]
  };

  // Create iperf analysis
  const iperfAnalysis: IperfAnalysis = {
    bandwidthComparison,
    latencyAnalysis,
    reliabilityMetrics,
    cpuUtilizationAnalysis
  };

  // Create DNS analysis
  const dnsAnalysis: DnsAnalysis = {
    performanceMetrics: dnsPerformanceMetrics,
    domainRankings,
    serverComparison
  };

  // Create configuration comparison
  const configurationComparison: ConfigurationComparison = {
    mtuImpact,
    loggingImpact,
    overallRanking
  };

  // Create and return the complete analysis results
  return {
    iperfAnalysis,
    dnsAnalysis,
    configurationComparison,
    anomalies,
    summary
  };
}