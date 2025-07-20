// Anomaly Detector Service Implementation
import { 
  Dataset, 
  PerformanceAnomaly,
  IperfTestResult,
  DnsTestResult,
  BandwidthMetrics,
  LatencyMetrics,
  ReliabilityMetrics,
  DnsPerformanceMetrics,
  TestResults
} from '../models';

/**
 * Interface for anomaly detection configuration
 */
export interface AnomalyDetectionConfig {
  // Bandwidth thresholds
  bandwidthDeviationThreshold: number;
  bandwidthMinimumThreshold: number;
  
  // Latency thresholds
  latencyDeviationThreshold: number;
  latencyMaximumThreshold: number;
  
  // Packet loss thresholds
  packetLossThreshold: number;
  retransmitRateThreshold: number;
  
  // DNS thresholds
  dnsResponseTimeThreshold: number;
  dnsSuccessRateThreshold: number;
  
  // General settings
  severityLevels: {
    low: number;
    medium: number;
    high: number;
  };
}

/**
 * Default anomaly detection configuration
 */
const DEFAULT_CONFIG: AnomalyDetectionConfig = {
  bandwidthDeviationThreshold: 0.25, // 25% deviation from mean
  bandwidthMinimumThreshold: 100, // 100 Mbps minimum expected
  
  latencyDeviationThreshold: 0.3, // 30% deviation from mean
  latencyMaximumThreshold: 50, // 50ms maximum acceptable latency
  
  packetLossThreshold: 0.01, // 1% packet loss threshold
  retransmitRateThreshold: 0.05, // 5% retransmit rate threshold
  
  dnsResponseTimeThreshold: 100, // 100ms DNS response time threshold
  dnsSuccessRateThreshold: 0.95, // 95% DNS success rate threshold
  
  severityLevels: {
    low: 1.5, // 1.5x threshold for low severity
    medium: 2.0, // 2x threshold for medium severity
    high: 3.0 // 3x threshold for high severity
  }
};

/**
 * AnomalyDetector class for detecting performance anomalies in network test data
 */
export class AnomalyDetector {
  private config: AnomalyDetectionConfig;
  
  /**
   * Creates a new instance of AnomalyDetector
   * @param config Optional custom configuration for anomaly detection thresholds
   */
  constructor(config?: Partial<AnomalyDetectionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Detect anomalies across multiple datasets
   * @param datasets The datasets to analyze for anomalies
   * @returns Array of detected performance anomalies
   */
  detectAnomalies(datasets: (Dataset & { results?: TestResults })[]): PerformanceAnomaly[] {
    const anomalies: PerformanceAnomaly[] = [];
    
    // Detect bandwidth anomalies
    const bandwidthAnomalies = this.detectBandwidthAnomalies(datasets);
    anomalies.push(...bandwidthAnomalies);
    
    // Detect latency anomalies
    const latencyAnomalies = this.detectLatencyAnomalies(datasets);
    anomalies.push(...latencyAnomalies);
    
    // Detect packet loss anomalies
    const packetLossAnomalies = this.detectPacketLossAnomalies(datasets);
    anomalies.push(...packetLossAnomalies);
    
    // Detect DNS response time anomalies
    const dnsAnomalies = this.detectDnsAnomalies(datasets);
    anomalies.push(...dnsAnomalies);
    
    return anomalies;
  }
  
  /**
   * Detect bandwidth-related anomalies
   * @param datasets The datasets to analyze
   * @returns Array of bandwidth-related anomalies
   */
  private detectBandwidthAnomalies(datasets: (Dataset & { results?: TestResults })[]): PerformanceAnomaly[] {
    const anomalies: PerformanceAnomaly[] = [];
    
    // Extract all bandwidth metrics from iperf tests
    const allBandwidthValues: number[] = [];
    const bandwidthByConfig: { [config: string]: number[] } = {};
    
    // Process each dataset
    datasets.forEach(dataset => {
      if (!dataset.results?.iperfTests) return;
      
      const configName = this.getDescriptiveConfigName(dataset.name);
      if (!bandwidthByConfig[configName]) {
        bandwidthByConfig[configName] = [];
      }
      
      dataset.results.iperfTests.forEach(test => {
        if (test.bandwidthMbps && test.success) {
          allBandwidthValues.push(test.bandwidthMbps);
          if (bandwidthByConfig[configName]) {
            bandwidthByConfig[configName].push(test.bandwidthMbps);
          }
        }
      });
    });
    
    // Calculate statistics
    if (allBandwidthValues.length === 0) return anomalies;
    
    const avgBandwidth = this.calculateMean(allBandwidthValues);
    const stdDevBandwidth = this.calculateStandardDeviation(allBandwidthValues, avgBandwidth);
    
    // Check each configuration for anomalies
    Object.entries(bandwidthByConfig).forEach(([config, values]) => {
      if (values.length === 0) return;
      
      const configAvg = this.calculateMean(values);
      
      // Check for low bandwidth
      if (configAvg < this.config.bandwidthMinimumThreshold) {
        const severity = this.determineSeverity(
          this.config.bandwidthMinimumThreshold / configAvg
        );
        
        anomalies.push({
          type: 'bandwidth',
          configuration: config,
          description: `Low bandwidth detected (${configAvg.toFixed(2)} Mbps) - below minimum threshold of ${this.config.bandwidthMinimumThreshold} Mbps`,
          severity,
          affectedMetrics: ['bandwidthMbps'],
          recommendations: [
            'Check for network congestion',
            'Verify MTU settings are optimal',
            'Investigate potential bottlenecks in the network path'
          ]
        });
      }
      
      // Check for deviation from overall average
      const deviation = Math.abs(configAvg - avgBandwidth) / avgBandwidth;
      if (deviation > this.config.bandwidthDeviationThreshold) {
        const severity = this.determineSeverity(
          deviation / this.config.bandwidthDeviationThreshold
        );
        
        const direction = configAvg < avgBandwidth ? 'lower' : 'higher';
        
        anomalies.push({
          type: 'bandwidth',
          configuration: config,
          description: `Bandwidth deviation detected: ${direction} than average by ${(deviation * 100).toFixed(2)}% (${configAvg.toFixed(2)} Mbps vs. average ${avgBandwidth.toFixed(2)} Mbps)`,
          severity,
          affectedMetrics: ['bandwidthMbps'],
          recommendations: [
            'Compare configuration differences with other test scenarios',
            'Investigate network conditions specific to this configuration',
            'Check for consistent patterns across multiple test runs'
          ]
        });
      }
    });
    
    return anomalies;
  }
  
  /**
   * Detect latency-related anomalies
   * @param datasets The datasets to analyze
   * @returns Array of latency-related anomalies
   */
  private detectLatencyAnomalies(datasets: (Dataset & { results?: TestResults })[]): PerformanceAnomaly[] {
    const anomalies: PerformanceAnomaly[] = [];
    
    // Extract UDP jitter values as latency indicators
    const allJitterValues: number[] = [];
    const jitterByConfig: { [config: string]: number[] } = {};
    
    // Process each dataset
    datasets.forEach(dataset => {
      if (!dataset.results?.iperfTests) return;
      
      const configName = this.getDescriptiveConfigName(dataset.name);
      if (!jitterByConfig[configName]) {
        jitterByConfig[configName] = [];
      }
      
      dataset.results.iperfTests.forEach(test => {
        if (test.jitterMs && test.success) {
          allJitterValues.push(test.jitterMs);
          if (jitterByConfig[configName]) {
            jitterByConfig[configName].push(test.jitterMs);
          }
        }
      });
    });
    
    // Calculate statistics
    if (allJitterValues.length === 0) return anomalies;
    
    const avgJitter = this.calculateMean(allJitterValues);
    const stdDevJitter = this.calculateStandardDeviation(allJitterValues, avgJitter);
    
    // Check each configuration for anomalies
    Object.entries(jitterByConfig).forEach(([config, values]) => {
      if (values.length === 0) return;
      
      const configAvg = this.calculateMean(values);
      
      // Check for high latency/jitter
      if (configAvg > this.config.latencyMaximumThreshold) {
        const severity = this.determineSeverity(
          configAvg / this.config.latencyMaximumThreshold
        );
        
        anomalies.push({
          type: 'latency',
          configuration: config,
          description: `High jitter detected (${configAvg.toFixed(2)} ms) - above maximum threshold of ${this.config.latencyMaximumThreshold} ms`,
          severity,
          affectedMetrics: ['jitterMs'],
          recommendations: [
            'Check for network congestion or interference',
            'Investigate potential route flapping',
            'Consider QoS settings to prioritize traffic'
          ]
        });
      }
      
      // Check for deviation from overall average
      const deviation = Math.abs(configAvg - avgJitter) / avgJitter;
      if (deviation > this.config.latencyDeviationThreshold) {
        const severity = this.determineSeverity(
          deviation / this.config.latencyDeviationThreshold
        );
        
        const direction = configAvg > avgJitter ? 'higher' : 'lower';
        
        anomalies.push({
          type: 'latency',
          configuration: config,
          description: `Jitter deviation detected: ${direction} than average by ${(deviation * 100).toFixed(2)}% (${configAvg.toFixed(2)} ms vs. average ${avgJitter.toFixed(2)} ms)`,
          severity,
          affectedMetrics: ['jitterMs'],
          recommendations: [
            'Compare network paths between different configurations',
            'Check for consistent patterns across multiple test runs',
            'Investigate potential interference specific to this configuration'
          ]
        });
      }
    });
    
    return anomalies;
  }
  
  /**
   * Detect packet loss and retransmission anomalies
   * @param datasets The datasets to analyze
   * @returns Array of packet loss-related anomalies
   */
  private detectPacketLossAnomalies(datasets: (Dataset & { results?: TestResults })[]): PerformanceAnomaly[] {
    const anomalies: PerformanceAnomaly[] = [];
    
    // Process UDP packet loss
    const packetLossByConfig: { [config: string]: number[] } = {};
    
    // Process TCP retransmits
    const retransmitsByConfig: { [config: string]: number[] } = {};
    
    // Process each dataset
    datasets.forEach(dataset => {
      if (!dataset.results?.iperfTests) return;
      
      const configName = this.getDescriptiveConfigName(dataset.name);
      if (!packetLossByConfig[configName]) {
        packetLossByConfig[configName] = [];
      }
      if (!retransmitsByConfig[configName]) {
        retransmitsByConfig[configName] = [];
      }
      
      dataset.results.iperfTests.forEach(test => {
        // Process UDP packet loss
        if (test.packetLoss !== undefined && test.success) {
          if (packetLossByConfig[configName]) {
            packetLossByConfig[configName].push(test.packetLoss);
          }
        }
        
        // Process TCP retransmits
        if (test.retransmits !== undefined && test.success) {
          // Calculate retransmit rate if we have bytes information
          if (test.bytes && test.bytes > 0 && test.tcpMssDefault) {
            const approximatePackets = test.bytes / (test.tcpMssDefault || 1460);
            const retransmitRate = test.retransmits / approximatePackets;
            if (retransmitsByConfig[configName]) {
              retransmitsByConfig[configName].push(retransmitRate);
            }
          }
        }
      });
    });
    
    // Check for packet loss anomalies
    Object.entries(packetLossByConfig).forEach(([config, values]) => {
      if (values.length === 0) return;
      
      const avgLoss = this.calculateMean(values);
      
      if (avgLoss > this.config.packetLossThreshold) {
        const severity = this.determineSeverity(
          avgLoss / this.config.packetLossThreshold
        );
        
        anomalies.push({
          type: 'packet_loss',
          configuration: config,
          description: `High packet loss detected (${(avgLoss * 100).toFixed(2)}%) - above threshold of ${(this.config.packetLossThreshold * 100).toFixed(2)}%`,
          severity,
          affectedMetrics: ['packetLoss', 'lostPackets'],
          recommendations: [
            'Check for network congestion or interference',
            'Investigate potential hardware issues',
            'Consider adjusting MTU settings to reduce fragmentation'
          ]
        });
      }
    });
    
    // Check for retransmit anomalies
    Object.entries(retransmitsByConfig).forEach(([config, values]) => {
      if (values.length === 0) return;
      
      const avgRetransmitRate = this.calculateMean(values);
      
      if (avgRetransmitRate > this.config.retransmitRateThreshold) {
        const severity = this.determineSeverity(
          avgRetransmitRate / this.config.retransmitRateThreshold
        );
        
        anomalies.push({
          type: 'packet_loss',
          configuration: config,
          description: `High TCP retransmit rate detected (${(avgRetransmitRate * 100).toFixed(2)}%) - above threshold of ${(this.config.retransmitRateThreshold * 100).toFixed(2)}%`,
          severity,
          affectedMetrics: ['retransmits', 'tcpMssDefault'],
          recommendations: [
            'Check for network congestion or packet drops',
            'Investigate potential buffer overflows',
            'Consider adjusting TCP window sizes or congestion control algorithms',
            'Verify MTU settings are appropriate for the network path'
          ]
        });
      }
    });
    
    return anomalies;
  }
  
  /**
   * Detect DNS-related anomalies
   * @param datasets The datasets to analyze
   * @returns Array of DNS-related anomalies
   */
  private detectDnsAnomalies(datasets: (Dataset & { results?: TestResults })[]): PerformanceAnomaly[] {
    const anomalies: PerformanceAnomaly[] = [];
    
    // Extract DNS response times by domain and configuration
    const responseTimesByDomain: { [domain: string]: number[] } = {};
    const responseTimesByConfig: { [config: string]: number[] } = {};
    const successRateByConfig: { [config: string]: { success: number, total: number } } = {};
    
    // Process each dataset
    datasets.forEach(dataset => {
      if (!dataset.results?.dnsResults) return;
      
      const configName = this.getDescriptiveConfigName(dataset.name);
      if (!responseTimesByConfig[configName]) {
        responseTimesByConfig[configName] = [];
      }
      if (!successRateByConfig[configName]) {
        successRateByConfig[configName] = { success: 0, total: 0 };
      }
      
      dataset.results.dnsResults.forEach(test => {
        // Track response times
        if (test.responseTimeMs && test.success) {
          // By domain
          if (!responseTimesByDomain[test.domain]) {
            responseTimesByDomain[test.domain] = [];
          }
          const domainTimes = responseTimesByDomain[test.domain];
          if (domainTimes) {
            domainTimes.push(test.responseTimeMs);
          }
          
          // By configuration
          if (responseTimesByConfig[configName]) {
            responseTimesByConfig[configName].push(test.responseTimeMs);
          }
        }
        
        // Track success rates
        if (successRateByConfig[configName]) {
          successRateByConfig[configName].total++;
          if (test.success) {
            successRateByConfig[configName].success++;
          }
        }
      });
    });
    
    // Check for slow DNS response times by configuration
    Object.entries(responseTimesByConfig).forEach(([config, times]) => {
      if (times.length === 0) return;
      
      const avgResponseTime = this.calculateMean(times);
      
      if (avgResponseTime > this.config.dnsResponseTimeThreshold) {
        const severity = this.determineSeverity(
          avgResponseTime / this.config.dnsResponseTimeThreshold
        );
        
        anomalies.push({
          type: 'dns_failure',
          configuration: config,
          description: `Slow DNS response times detected (${avgResponseTime.toFixed(2)} ms) - above threshold of ${this.config.dnsResponseTimeThreshold} ms`,
          severity,
          affectedMetrics: ['responseTimeMs', 'queryTimeMs'],
          recommendations: [
            'Check DNS server performance and load',
            'Investigate network latency to DNS servers',
            'Consider DNS caching or using alternative DNS servers'
          ]
        });
      }
    });
    
    // Check for low DNS success rates
    Object.entries(successRateByConfig).forEach(([config, { success, total }]) => {
      if (total === 0) return;
      
      const successRate = success / total;
      
      if (successRate < this.config.dnsSuccessRateThreshold) {
        const severity = this.determineSeverity(
          (1 - successRate) / (1 - this.config.dnsSuccessRateThreshold)
        );
        
        anomalies.push({
          type: 'dns_failure',
          configuration: config,
          description: `Low DNS success rate detected (${(successRate * 100).toFixed(2)}%) - below threshold of ${(this.config.dnsSuccessRateThreshold * 100).toFixed(2)}%`,
          severity,
          affectedMetrics: ['success', 'error'],
          recommendations: [
            'Check DNS server availability and configuration',
            'Investigate network connectivity to DNS servers',
            'Analyze specific domain failures for patterns',
            'Consider DNS redundancy or fallback mechanisms'
          ]
        });
      }
    });
    
    // Check for domains with consistently slow response times
    Object.entries(responseTimesByDomain).forEach(([domain, times]) => {
      if (times.length < 2) return; // Need at least a couple of samples for test cases
      
      const avgResponseTime = this.calculateMean(times);
      
      if (avgResponseTime > this.config.dnsResponseTimeThreshold * 1.5) {
        const severity = this.determineSeverity(
          avgResponseTime / (this.config.dnsResponseTimeThreshold * 1.5)
        );
        
        // Find which configurations this domain was tested in
        const affectedConfigs: string[] = [];
        datasets.forEach(dataset => {
          if (!dataset.results?.dnsResults) return;
          
          const configName = this.getDescriptiveConfigName(dataset.name);
          const hasDomain = dataset.results.dnsResults.some(
            test => test.domain === domain
          );
          
          if (hasDomain) {
            affectedConfigs.push(configName);
          }
        });
        
        // If there are too many affected configurations, use a more descriptive name
        let configurationName: string;
        if (affectedConfigs.length > 3) {
          configurationName = "All Configurations";
        } else {
          configurationName = affectedConfigs.join(', ');
        }
        
        anomalies.push({
          type: 'dns_failure',
          configuration: configurationName,
          description: `Consistently slow DNS resolution for domain "${domain}" (${avgResponseTime.toFixed(2)} ms)`,
          severity,
          affectedMetrics: ['responseTimeMs', 'domain'],
          recommendations: [
            'Investigate DNS resolution path for this specific domain',
            'Check if the domain uses DNSSEC which may increase resolution time',
            'Verify if the domain has multiple DNS lookups in its resolution chain'
          ]
        });
      }
    });
    
    return anomalies;
  }
  
  /**
   * Generate a descriptive name for a configuration
   * @param configName The configuration name
   * @returns A descriptive name
   */
  private getDescriptiveConfigName(configName: string): string {
    // For dataset names like "dataset-20250717_113356", we should return the original name
    // as the NetworkPerformanceAnalyzer will handle the display name mapping
    if (configName.startsWith('dataset-')) {
      return configName;
    }
    
    // If the configuration name already has a descriptive format, return it
    if (configName.includes('-mtu') && (configName.includes('-aws-logs_') || configName.includes('-logging_'))) {
      return configName.replace('-aws-logs_', '-logging_');
    }
    
    // Otherwise, try to extract components from the name
    const parts = configName.split('-');
    const serverType = parts[0] || 'unknown';
    
    // Look for MTU in the name
    let mtu = '1500'; // Default
    for (const part of parts) {
      if (part.startsWith('mtu')) {
        mtu = part.replace('mtu', '');
        break;
      }
    }
    
    // Look for logging status
    let loggingStatus = 'disabled'; // Default
    for (const part of parts) {
      if (part.includes('enabled') || part.includes('disabled')) {
        loggingStatus = part.includes('enabled') ? 'enabled' : 'disabled';
        break;
      }
    }
    
    return `${serverType}-mtu${mtu}-logging_${loggingStatus}`;
  }
  
  /**
   * Determine the severity level based on the ratio to threshold
   * @param ratio The ratio of the value to the threshold
   * @returns The severity level as 'low', 'medium', or 'high'
   */
  private determineSeverity(ratio: number): 'low' | 'medium' | 'high' {
    // Ensure ratio is positive for comparison
    const absRatio = Math.abs(ratio);
    
    if (absRatio >= this.config.severityLevels.high) {
      return 'high';
    } else if (absRatio >= this.config.severityLevels.medium) {
      return 'medium';
    } else {
      return 'low';
    }
  }
  
  /**
   * Calculate the mean (average) of an array of numbers
   * @param values Array of numbers
   * @returns The mean value
   */
  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }
  
  /**
   * Calculate the standard deviation of an array of numbers
   * @param values Array of numbers
   * @param mean The mean value (optional, will be calculated if not provided)
   * @returns The standard deviation
   */
  private calculateStandardDeviation(values: number[], mean?: number): number {
    if (values.length === 0) return 0;
    
    const avg = mean !== undefined ? mean : this.calculateMean(values);
    const squareDiffs = values.map(value => {
      const diff = value - avg;
      return diff * diff;
    });
    
    const avgSquareDiff = this.calculateMean(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }
}
