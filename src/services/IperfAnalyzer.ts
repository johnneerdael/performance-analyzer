// IperfAnalyzer Service Implementation
import {
  Dataset,
  IperfTestResult,
  BandwidthMetrics,
  LatencyMetrics,
  ReliabilityMetrics,
  CpuMetrics,
  AnalysisError
} from '../models';
import { DefaultErrorHandler } from '../utils/ErrorHandler';

/**
 * IperfAnalyzer class for processing iperf3 performance metrics
 * Analyzes bandwidth, latency, reliability, and CPU utilization across datasets
 */
export class IperfAnalyzer {
  private errorHandler: DefaultErrorHandler;

  /**
   * Creates a new instance of IperfAnalyzer
   */
  constructor() {
    this.errorHandler = new DefaultErrorHandler();
  }

  /**
   * Analyze bandwidth metrics across datasets
   * @param datasets The datasets containing iperf test results
   * @returns Array of bandwidth metrics for each configuration
   */
  analyzeBandwidth(datasets: Dataset[]): BandwidthMetrics[] {
    try {
      return datasets.map(dataset => {
        const iperfTests = this.getSuccessfulIperfTests(dataset, 'TCP Bandwidth');
        
        // Extract bandwidth values
        const bandwidthValues = iperfTests.map(test => test.bandwidthMbps || 0);
        
        // Calculate metrics
        return {
          configuration: dataset.name,
          avgBandwidthMbps: this.calculateMean(bandwidthValues),
          medianBandwidthMbps: this.calculateMedian(bandwidthValues),
          maxBandwidthMbps: this.calculateMax(bandwidthValues),
          minBandwidthMbps: this.calculateMin(bandwidthValues),
          standardDeviation: this.calculateStandardDeviation(bandwidthValues),
          percentile95: this.calculatePercentile(bandwidthValues, 95),
          percentile99: this.calculatePercentile(bandwidthValues, 99)
        };
      });
    } catch (error) {
      const analysisError = new Error(error instanceof Error ? error.message : String(error)) as AnalysisError;
      analysisError.analysisType = 'bandwidth';
      this.errorHandler.handleAnalysisError(analysisError);
      return [];
    }
  }

  /**
   * Analyze latency metrics across datasets
   * @param datasets The datasets containing iperf test results
   * @returns Array of latency metrics for each configuration
   */
  analyzeLatency(datasets: Dataset[]): LatencyMetrics[] {
    try {
      return datasets.map(dataset => {
        // For TCP tests, we don't have direct latency measurements, but we can use RTT if available
        // For UDP tests, we can use jitter as a latency-related metric
        const udpTests = this.getSuccessfulIperfTests(dataset, 'UDP');
        
        // Extract jitter values from UDP tests
        const jitterValues = udpTests.map(test => test.jitterMs || 0);
        
        // For this implementation, we'll use jitter as our latency metric
        // In a real implementation, we might want to extract actual latency data if available
        return {
          configuration: dataset.name,
          avgLatencyMs: this.calculateMean(jitterValues),
          medianLatencyMs: this.calculateMedian(jitterValues),
          maxLatencyMs: this.calculateMax(jitterValues),
          minLatencyMs: this.calculateMin(jitterValues),
          jitterMs: this.calculateMean(jitterValues)
        };
      });
    } catch (error) {
      const analysisError = new Error(error instanceof Error ? error.message : String(error)) as AnalysisError;
      analysisError.analysisType = 'latency';
      this.errorHandler.handleAnalysisError(analysisError);
      return [];
    }
  }

  /**
   * Analyze reliability metrics across datasets
   * @param datasets The datasets containing iperf test results
   * @returns Array of reliability metrics for each configuration
   */
  analyzeReliability(datasets: Dataset[]): ReliabilityMetrics[] {
    try {
      return datasets.map(dataset => {
        const allTests = this.getAllIperfTests(dataset);
        const tcpTests = this.getSuccessfulIperfTests(dataset, 'TCP');
        const udpTests = this.getSuccessfulIperfTests(dataset, 'UDP');
        
        // Calculate success rate
        const successRate = allTests.length > 0 
          ? allTests.filter(test => test.success).length / allTests.length 
          : 0;
        
        // Calculate retransmit rate for TCP tests
        const retransmits = tcpTests.map(test => test.retransmits || 0);
        const totalRetransmits = retransmits.reduce((sum, val) => sum + val, 0);
        const retransmitRate = tcpTests.length > 0 
          ? totalRetransmits / tcpTests.length 
          : 0;
        
        // Calculate packet loss rate for UDP tests
        const packetLossValues = udpTests.map(test => test.packetLoss || 0);
        const packetLossRate = this.calculateMean(packetLossValues);
        
        // Count errors
        const errorCount = allTests.filter(test => !test.success || test.error).length;
        
        return {
          configuration: dataset.name,
          successRate,
          retransmitRate,
          packetLossRate,
          errorCount
        };
      });
    } catch (error) {
      const analysisError = new Error(error instanceof Error ? error.message : String(error)) as AnalysisError;
      analysisError.analysisType = 'reliability';
      this.errorHandler.handleAnalysisError(analysisError);
      return [];
    }
  }

  /**
   * Analyze CPU utilization metrics across datasets
   * @param datasets The datasets containing iperf test results
   * @returns Array of CPU utilization metrics for each configuration
   */
  analyzeCpuUtilization(datasets: Dataset[]): CpuMetrics[] {
    try {
      return datasets.map(dataset => {
        const successfulTests = this.getSuccessfulIperfTests(dataset);
        
        // Extract CPU utilization values
        const hostCpuValues = successfulTests
          .map(test => test.cpuUtilizationHost || 0)
          .filter(val => val > 0); // Filter out zero values which might indicate missing data
        
        const remoteCpuValues = successfulTests
          .map(test => test.cpuUtilizationRemote || 0)
          .filter(val => val > 0);
        
        return {
          configuration: dataset.name,
          avgHostCpuUsage: this.calculateMean(hostCpuValues),
          avgRemoteCpuUsage: this.calculateMean(remoteCpuValues),
          maxHostCpuUsage: this.calculateMax(hostCpuValues),
          maxRemoteCpuUsage: this.calculateMax(remoteCpuValues)
        };
      });
    } catch (error) {
      const analysisError = new Error(error instanceof Error ? error.message : String(error)) as AnalysisError;
      analysisError.analysisType = 'cpu_utilization';
      this.errorHandler.handleAnalysisError(analysisError);
      return [];
    }
  }

  /**
   * Get all iperf tests from a dataset
   * @param dataset The dataset to extract tests from
   * @returns Array of iperf test results
   */
  private getAllIperfTests(dataset: Dataset): IperfTestResult[] {
    try {
      // This is a placeholder - in a real implementation, we would need to load the results file
      // For now, we'll assume the dataset already has the parsed results
      return (dataset as any).results?.iperfTests || [];
    } catch (error) {
      const analysisError = new Error(error instanceof Error ? error.message : String(error)) as AnalysisError;
      analysisError.analysisType = 'data_extraction';
      analysisError.datasetName = dataset.name;
      this.errorHandler.handleAnalysisError(analysisError);
      return [];
    }
  }

  /**
   * Get successful iperf tests from a dataset, optionally filtered by scenario type
   * @param dataset The dataset to extract tests from
   * @param scenarioFilter Optional scenario type filter (e.g., 'TCP', 'UDP')
   * @returns Array of successful iperf test results
   */
  private getSuccessfulIperfTests(dataset: Dataset, scenarioFilter?: string): IperfTestResult[] {
    const allTests = this.getAllIperfTests(dataset);
    
    return allTests.filter(test => {
      const isSuccess = test.success;
      const matchesScenario = !scenarioFilter || 
        (test.scenario && test.scenario.includes(scenarioFilter));
      
      return isSuccess && matchesScenario;
    });
  }

  /**
   * Calculate the mean of an array of numbers
   * @param values Array of numbers
   * @returns The mean value, or 0 if the array is empty
   */
  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }

  /**
   * Calculate the median of an array of numbers
   * @param values Array of numbers
   * @returns The median value, or 0 if the array is empty
   */
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    
    const sortedValues = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sortedValues.length / 2);
    
    if (sortedValues.length % 2 === 0) {
      // For even-length arrays, average the two middle values
      const midValue1 = sortedValues[mid - 1] || 0;
      const midValue2 = sortedValues[mid] || 0;
      return (midValue1 + midValue2) / 2;
    } else {
      // For odd-length arrays, return the middle value
      return sortedValues[mid] || 0;
    }
  }

  /**
   * Calculate the maximum value in an array of numbers
   * @param values Array of numbers
   * @returns The maximum value, or 0 if the array is empty
   */
  private calculateMax(values: number[]): number {
    if (values.length === 0) return 0;
    return Math.max(...values);
  }

  /**
   * Calculate the minimum value in an array of numbers
   * @param values Array of numbers
   * @returns The minimum value, or 0 if the array is empty
   */
  private calculateMin(values: number[]): number {
    if (values.length === 0) return 0;
    return Math.min(...values);
  }

  /**
   * Calculate the standard deviation of an array of numbers
   * @param values Array of numbers
   * @returns The standard deviation, or 0 if the array is empty
   */
  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = this.calculateMean(values);
    const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
    const variance = this.calculateMean(squaredDifferences);
    
    return Math.sqrt(variance);
  }

  /**
   * Calculate a percentile value from an array of numbers
   * @param values Array of numbers
   * @param percentile The percentile to calculate (0-100)
   * @returns The percentile value, or 0 if the array is empty
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    if (percentile < 0 || percentile > 100) {
      throw new Error(`Percentile must be between 0 and 100, got ${percentile}`);
    }
    
    const sortedValues = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    const safeIndex = Math.max(0, Math.min(index, sortedValues.length - 1));
    return sortedValues[safeIndex] || 0;
  }
}