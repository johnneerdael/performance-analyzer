// ConfigurationComparator Service Implementation
import {
  Dataset,
  ConfigurationComparison,
  MtuAnalysis,
  LoggingAnalysis,
  ConfigurationRanking,
  PerformanceSummary,
  BandwidthMetrics,
  LatencyMetrics,
  ReliabilityMetrics,
  CpuMetrics,
  DnsPerformanceMetrics,
  AnalysisError
} from '../models';
import { DefaultErrorHandler } from '../utils/ErrorHandler';
import { IperfAnalyzer } from './IperfAnalyzer';
import { DnsAnalyzer } from './DnsAnalyzer';

/**
 * ConfigurationComparator class for analyzing performance differences between configurations
 * Compares MTU settings, DNS query logging impact, and ranks configurations by performance
 */
export class ConfigurationComparator {
  private errorHandler: DefaultErrorHandler;
  private iperfAnalyzer: IperfAnalyzer;
  private dnsAnalyzer: DnsAnalyzer;

  /**
   * Creates a new instance of ConfigurationComparator
   */
  constructor() {
    this.errorHandler = new DefaultErrorHandler();
    this.iperfAnalyzer = new IperfAnalyzer();
    this.dnsAnalyzer = new DnsAnalyzer();
  }

  /**
   * Compare different network configurations based on performance metrics
   * @param datasets The datasets representing different network configurations
   * @returns Configuration comparison analysis
   */
  compareConfigurations(datasets: Dataset[]): ConfigurationComparison {
    try {
      // Analyze MTU impact
      const mtuImpact = this.analyzeMtuImpact(datasets);
      
      // Analyze DNS query logging impact
      const loggingImpact = this.analyzeLoggingImpact(datasets);
      
      // Create overall configuration ranking
      const overallRanking = this.rankConfigurations(datasets);
      
      return {
        mtuImpact,
        loggingImpact,
        overallRanking
      };
    } catch (error) {
      const analysisError = new Error(error instanceof Error ? error.message : String(error)) as AnalysisError;
      analysisError.analysisType = 'configuration_comparison';
      this.errorHandler.handleAnalysisError(analysisError);
      
      // Return empty analysis in case of error
      return {
        mtuImpact: {
          optimalMtu: 0,
          performanceByMtu: {},
          recommendations: []
        },
        loggingImpact: {
          performanceImpact: 0,
          bandwidthDifference: 0,
          latencyDifference: 0,
          recommendations: []
        },
        overallRanking: []
      };
    }
  }

  /**
   * Analyze the impact of different MTU settings on performance
   * @param datasets The datasets with different MTU configurations
   * @returns MTU impact analysis
   */
  analyzeMtuImpact(datasets: Dataset[]): MtuAnalysis {
    try {
      // Group datasets by MTU
      const datasetsByMtu = this.groupDatasetsByMtu(datasets);
      
      // Calculate performance metrics for each MTU
      const performanceByMtu: { [mtu: number]: PerformanceSummary } = {};
      let optimalMtu = 0;
      let bestBandwidth = 0;
      
      // Process each MTU group
      for (const [mtuStr, mtuDatasets] of Object.entries(datasetsByMtu)) {
        const mtu = parseInt(mtuStr, 10);
        
        // Calculate bandwidth metrics
        const bandwidthMetrics = this.iperfAnalyzer.analyzeBandwidth(mtuDatasets);
        const avgBandwidth = this.calculateAverageMetric(bandwidthMetrics, 'avgBandwidthMbps');
        
        // Calculate latency metrics
        const latencyMetrics = this.iperfAnalyzer.analyzeLatency(mtuDatasets);
        const avgLatency = this.calculateAverageMetric(latencyMetrics, 'avgLatencyMs');
        
        // Calculate reliability metrics
        const reliabilityMetrics = this.iperfAnalyzer.analyzeReliability(mtuDatasets);
        const successRate = this.calculateAverageMetric(reliabilityMetrics, 'successRate');
        
        // Calculate CPU usage metrics
        const cpuMetrics = this.iperfAnalyzer.analyzeCpuUtilization(mtuDatasets);
        const cpuUsage = this.calculateAverageMetric(cpuMetrics, 'avgHostCpuUsage');
        
        // Store performance summary for this MTU
        performanceByMtu[mtu] = {
          avgBandwidth,
          avgLatency,
          successRate,
          cpuUsage
        };
        
        // Track optimal MTU based on bandwidth
        if (avgBandwidth > bestBandwidth) {
          bestBandwidth = avgBandwidth;
          optimalMtu = mtu;
        }
      }
      
      // Generate recommendations based on MTU analysis
      const recommendations = this.generateMtuRecommendations(performanceByMtu, optimalMtu);
      
      return {
        optimalMtu,
        performanceByMtu,
        recommendations
      };
    } catch (error) {
      const analysisError = new Error(error instanceof Error ? error.message : String(error)) as AnalysisError;
      analysisError.analysisType = 'mtu_impact';
      this.errorHandler.handleAnalysisError(analysisError);
      
      // Return empty analysis in case of error
      return {
        optimalMtu: 0,
        performanceByMtu: {},
        recommendations: []
      };
    }
  }

  /**
   * Analyze the impact of DNS query logging on performance
   * @param datasets The datasets with different DNS query logging configurations
   * @returns DNS query logging impact analysis
   */
  analyzeLoggingImpact(datasets: Dataset[]): LoggingAnalysis {
    try {
      // Group datasets by DNS query logging status
      const loggingEnabled = datasets.filter(dataset => dataset.configuration.awsLogging);
      const loggingDisabled = datasets.filter(dataset => !dataset.configuration.awsLogging);
      
      // If we don't have both enabled and disabled datasets, return empty analysis
      if (loggingEnabled.length === 0 || loggingDisabled.length === 0) {
        return {
          performanceImpact: 0,
          bandwidthDifference: 0,
          latencyDifference: 0,
          recommendations: [
            "Insufficient data to analyze DNS query logging impact. Need datasets with both enabled and disabled logging."
          ]
        };
      }
      
      // Calculate bandwidth metrics for both groups
      const enabledBandwidth = this.iperfAnalyzer.analyzeBandwidth(loggingEnabled);
      const disabledBandwidth = this.iperfAnalyzer.analyzeBandwidth(loggingDisabled);
      
      const avgEnabledBandwidth = this.calculateAverageMetric(enabledBandwidth, 'avgBandwidthMbps');
      const avgDisabledBandwidth = this.calculateAverageMetric(disabledBandwidth, 'avgBandwidthMbps');
      
      // Calculate bandwidth difference (positive means disabled is better)
      const bandwidthDifference = avgDisabledBandwidth - avgEnabledBandwidth;
      
      // Calculate latency metrics for both groups
      const enabledLatency = this.iperfAnalyzer.analyzeLatency(loggingEnabled);
      const disabledLatency = this.iperfAnalyzer.analyzeLatency(loggingDisabled);
      
      const avgEnabledLatency = this.calculateAverageMetric(enabledLatency, 'avgLatencyMs');
      const avgDisabledLatency = this.calculateAverageMetric(disabledLatency, 'avgLatencyMs');
      
      // Calculate latency difference (positive means enabled is worse)
      const latencyDifference = avgEnabledLatency - avgDisabledLatency;
      
      // Calculate overall performance impact as a percentage
      // We'll use bandwidth as the primary metric for overall impact
      const performanceImpact = avgDisabledBandwidth > 0 
        ? (bandwidthDifference / avgDisabledBandwidth) * 100 
        : 0;
      
      // Generate recommendations based on logging impact
      const recommendations = this.generateLoggingRecommendations(
        performanceImpact, 
        bandwidthDifference, 
        latencyDifference
      );
      
      return {
        performanceImpact,
        bandwidthDifference,
        latencyDifference,
        recommendations
      };
    } catch (error) {
      const analysisError = new Error(error instanceof Error ? error.message : String(error)) as AnalysisError;
      analysisError.analysisType = 'logging_impact';
      this.errorHandler.handleAnalysisError(analysisError);
      
      // Return empty analysis in case of error
      return {
        performanceImpact: 0,
        bandwidthDifference: 0,
        latencyDifference: 0,
        recommendations: []
      };
    }
  }

  /**
   * Rank configurations based on overall performance
   * @param datasets The datasets representing different configurations
   * @returns Array of configuration rankings
   */
  rankConfigurations(datasets: Dataset[]): ConfigurationRanking[] {
    try {
      const rankings: ConfigurationRanking[] = [];
      
      // Calculate scores for each dataset
      for (const dataset of datasets) {
        // Get bandwidth metrics
        const bandwidthMetrics = this.iperfAnalyzer.analyzeBandwidth([dataset]);
        const bandwidthScore = bandwidthMetrics.length > 0 ? bandwidthMetrics[0]?.avgBandwidthMbps || 0 : 0;
        
        // Get latency metrics (lower is better, so we'll invert for scoring)
        const latencyMetrics = this.iperfAnalyzer.analyzeLatency([dataset]);
        const latencyValue = latencyMetrics.length > 0 ? latencyMetrics[0]?.avgLatencyMs || 0 : 0;
        // Convert latency to a score where higher is better
        const latencyScore = latencyValue > 0 ? 100 / latencyValue : 0;
        
        // Get reliability metrics
        const reliabilityMetrics = this.iperfAnalyzer.analyzeReliability([dataset]);
        const reliabilityScore = reliabilityMetrics.length > 0 ? (reliabilityMetrics[0]?.successRate || 0) * 100 : 0;
        
        // Calculate overall score (weighted average)
        const overallScore = (
          (bandwidthScore * 0.5) +  // 50% weight to bandwidth
          (latencyScore * 0.3) +    // 30% weight to latency
          (reliabilityScore * 0.2)  // 20% weight to reliability
        );
        
        rankings.push({
          configuration: dataset.name,
          overallScore,
          bandwidthScore,
          latencyScore,
          reliabilityScore,
          rank: 0 // Will be set after sorting
        });
      }
      
      // Sort rankings by overall score (descending)
      rankings.sort((a, b) => b.overallScore - a.overallScore);
      
      // Assign ranks
      rankings.forEach((ranking, index) => {
        ranking.rank = index + 1;
      });
      
      return rankings;
    } catch (error) {
      const analysisError = new Error(error instanceof Error ? error.message : String(error)) as AnalysisError;
      analysisError.analysisType = 'configuration_ranking';
      this.errorHandler.handleAnalysisError(analysisError);
      
      // Return empty rankings in case of error
      return [];
    }
  }

  /**
   * Analyze performance trends across configurations
   * @param datasets The datasets to analyze for trends
   * @returns Object containing trend analysis
   */
  analyzePerformanceTrends(datasets: Dataset[]): Record<string, any> {
    try {
      // Group datasets by MTU
      const datasetsByMtu = this.groupDatasetsByMtu(datasets);
      
      // Group datasets by backend server
      const datasetsByServer = this.groupDatasetsByServer(datasets);
      
      // Group datasets by AWS logging status
      const datasetsByLogging = this.groupDatasetsByLogging(datasets);
      
      // Analyze trends for each grouping
      const mtuTrends = this.analyzeTrendsByGroup(datasetsByMtu, 'MTU');
      const serverTrends = this.analyzeTrendsByGroup(datasetsByServer, 'Server');
      const loggingTrends = this.analyzeTrendsByGroup(datasetsByLogging, 'Logging');
      
      return {
        mtuTrends,
        serverTrends,
        loggingTrends
      };
    } catch (error) {
      const analysisError = new Error(error instanceof Error ? error.message : String(error)) as AnalysisError;
      analysisError.analysisType = 'performance_trends';
      this.errorHandler.handleAnalysisError(analysisError);
      
      // Return empty analysis in case of error
      return {};
    }
  }

  /**
   * Group datasets by MTU setting
   * @param datasets The datasets to group
   * @returns Object with MTU values as keys and arrays of datasets as values
   */
  private groupDatasetsByMtu(datasets: Dataset[]): Record<number, Dataset[]> {
    const groups: Record<number, Dataset[]> = {};
    
    for (const dataset of datasets) {
      const mtu = dataset.configuration.mtu;
      
      if (!groups[mtu]) {
        groups[mtu] = [];
      }
      
      groups[mtu].push(dataset);
    }
    
    return groups;
  }

  /**
   * Group datasets by backend server
   * @param datasets The datasets to group
   * @returns Object with server names as keys and arrays of datasets as values
   */
  private groupDatasetsByServer(datasets: Dataset[]): Record<string, Dataset[]> {
    const groups: Record<string, Dataset[]> = {};
    
    for (const dataset of datasets) {
      const server = dataset.configuration.backendServer;
      
      if (!groups[server]) {
        groups[server] = [];
      }
      
      groups[server].push(dataset);
    }
    
    return groups;
  }

  /**
   * Group datasets by DNS query logging status
   * @param datasets The datasets to group
   * @returns Object with logging status as keys and arrays of datasets as values
   */
  private groupDatasetsByLogging(datasets: Dataset[]): Record<string, Dataset[]> {
    const groups: Record<string, Dataset[]> = {};
    
    for (const dataset of datasets) {
      const loggingStatus = dataset.configuration.awsLogging ? 'enabled' : 'disabled';
      
      if (!groups[loggingStatus]) {
        groups[loggingStatus] = [];
      }
      
      groups[loggingStatus].push(dataset);
    }
    
    return groups;
  }

  /**
   * Analyze performance trends for a group of datasets
   * @param groupedDatasets The grouped datasets to analyze
   * @param groupType The type of grouping (e.g., 'MTU', 'Server', 'Logging')
   * @returns Object containing trend analysis for the group
   */
  private analyzeTrendsByGroup(groupedDatasets: Record<string, Dataset[]>, groupType: string): Record<string, any> {
    const trends: Record<string, any> = {};
    
    for (const [groupKey, datasets] of Object.entries(groupedDatasets)) {
      // Calculate bandwidth metrics
      const bandwidthMetrics = this.iperfAnalyzer.analyzeBandwidth(datasets);
      const avgBandwidth = this.calculateAverageMetric(bandwidthMetrics, 'avgBandwidthMbps');
      
      // Calculate latency metrics
      const latencyMetrics = this.iperfAnalyzer.analyzeLatency(datasets);
      const avgLatency = this.calculateAverageMetric(latencyMetrics, 'avgLatencyMs');
      
      // Calculate reliability metrics
      const reliabilityMetrics = this.iperfAnalyzer.analyzeReliability(datasets);
      const successRate = this.calculateAverageMetric(reliabilityMetrics, 'successRate');
      
      // Calculate DNS performance metrics
      const dnsAnalysis = this.dnsAnalyzer.analyzeDnsPerformance(datasets);
      const avgDnsResponseTime = this.calculateAverageMetric(
        dnsAnalysis.performanceMetrics, 
        'avgResponseTimeMs'
      );
      
      trends[groupKey] = {
        avgBandwidth,
        avgLatency,
        successRate,
        avgDnsResponseTime,
        datasetCount: datasets.length
      };
    }
    
    return trends;
  }

  /**
   * Calculate the average of a specific metric across an array of objects
   * @param metrics Array of objects containing the metric
   * @param metricKey The key of the metric to average
   * @returns The average value of the metric
   */
  private calculateAverageMetric<T>(metrics: T[], metricKey: keyof T): number {
    if (metrics.length === 0) return 0;
    
    let sum = 0;
    let count = 0;
    
    for (const metric of metrics) {
      const value = metric[metricKey];
      if (typeof value === 'number' && !isNaN(value)) {
        sum += value;
        count++;
      }
    }
    
    return count > 0 ? sum / count : 0;
  }

  /**
   * Generate recommendations based on MTU analysis
   * @param performanceByMtu Performance metrics for each MTU
   * @param optimalMtu The optimal MTU value
   * @returns Array of recommendation strings
   */
  private generateMtuRecommendations(
    performanceByMtu: { [mtu: number]: PerformanceSummary },
    optimalMtu: number
  ): string[] {
    const recommendations: string[] = [];
    
    // If we have no data, return a generic recommendation
    if (Object.keys(performanceByMtu).length === 0) {
      return ["Insufficient data to make MTU recommendations."];
    }
    
    // Add recommendation for optimal MTU
    recommendations.push(`The optimal MTU setting appears to be ${optimalMtu} based on bandwidth performance.`);
    
    // Compare optimal MTU with standard MTU (1500)
    if (performanceByMtu[1500] && optimalMtu !== 1500) {
      const optimalPerf = performanceByMtu[optimalMtu];
      const standardPerf = performanceByMtu[1500];
      
      if (optimalPerf && standardPerf) {
        const bandwidthDiff = optimalPerf.avgBandwidth - standardPerf.avgBandwidth;
        const bandwidthPercent = standardPerf.avgBandwidth > 0 
          ? (bandwidthDiff / standardPerf.avgBandwidth) * 100 
          : 0;
      
        if (bandwidthPercent >= 5) {
          recommendations.push(
            `Using MTU ${optimalMtu} provides a ${bandwidthPercent.toFixed(1)}% bandwidth improvement over standard MTU 1500.`
          );
        }
      }
    }
    
    // Check for jumbo frames benefit
    const jumboMtus = Object.keys(performanceByMtu)
      .map(mtu => parseInt(mtu, 10))
      .filter(mtu => mtu > 1500);
    
    if (jumboMtus.length > 0) {
      const bestJumboMtu = Math.max(...jumboMtus);
      const jumboPerf = performanceByMtu[bestJumboMtu];
      
      if (performanceByMtu[1500] && jumboPerf) {
        const standardPerf = performanceByMtu[1500];
        const bandwidthDiff = jumboPerf.avgBandwidth - standardPerf.avgBandwidth;
        const bandwidthPercent = standardPerf.avgBandwidth > 0 
          ? (bandwidthDiff / standardPerf.avgBandwidth) * 100 
          : 0;
        
        if (bandwidthPercent >= 10) {
          recommendations.push(
            `Jumbo frames (MTU ${bestJumboMtu}) provide significant bandwidth benefits (${bandwidthPercent.toFixed(1)}% improvement).`
          );
        } else if (bandwidthPercent <= -5) {
          recommendations.push(
            `Jumbo frames (MTU ${bestJumboMtu}) show worse performance than standard MTU 1500. Check network path for MTU black holes.`
          );
        }
      }
    }
    
    // Check for small MTU performance
    const smallMtus = Object.keys(performanceByMtu)
      .map(mtu => parseInt(mtu, 10))
      .filter(mtu => mtu < 1500);
    
    if (smallMtus.length > 0) {
      const smallestMtu = Math.min(...smallMtus);
      const smallPerf = performanceByMtu[smallestMtu];
      
      if (performanceByMtu[1500] && smallPerf) {
        const standardPerf = performanceByMtu[1500];
        const latencyDiff = standardPerf.avgLatency - smallPerf.avgLatency;
        const latencyPercent = standardPerf.avgLatency > 0 
          ? (latencyDiff / standardPerf.avgLatency) * 100 
          : 0;
        
        if (latencyPercent >= 10) {
          recommendations.push(
            `Smaller MTU (${smallestMtu}) shows lower latency (${latencyPercent.toFixed(1)}% improvement) which may benefit real-time applications.`
          );
        }
      }
    }
    
    return recommendations;
  }

  /**
   * Generate recommendations based on DNS query logging impact analysis
   * @param performanceImpact Overall performance impact percentage
   * @param bandwidthDifference Bandwidth difference between logging disabled and enabled
   * @param latencyDifference Latency difference between logging enabled and disabled
   * @returns Array of recommendation strings
   */
  private generateLoggingRecommendations(
    performanceImpact: number,
    bandwidthDifference: number,
    latencyDifference: number
  ): string[] {
    const recommendations: string[] = [];
    
    // Determine if logging has a significant impact
    if (Math.abs(performanceImpact) < 1) {
      recommendations.push(
        "DNS query logging has minimal impact on network performance (less than 1% difference)."
      );
    } else if (performanceImpact >= 1) {
      // Positive impact means disabled logging performs better
      recommendations.push(
        `Disabling DNS query logging improves network performance by approximately ${performanceImpact.toFixed(1)}%.`
      );
      
      if (performanceImpact >= 5) {
        recommendations.push(
          "Consider disabling DNS query logging in performance-critical environments."
        );
      }
    } else {
      // Negative impact means enabled logging performs better (unusual)
      recommendations.push(
        `Enabling DNS query logging appears to improve network performance by approximately ${Math.abs(performanceImpact).toFixed(1)}%.`
      );
      recommendations.push(
        "This is unexpected and may indicate other factors affecting the test results."
      );
    }
    
    // Add specific bandwidth recommendations
    if (bandwidthDifference >= 50) {
      recommendations.push(
        `Disabling DNS query logging provides ${bandwidthDifference.toFixed(1)} Mbps higher bandwidth.`
      );
    }
    
    // Add specific latency recommendations
    if (latencyDifference >= 5) {
      recommendations.push(
        `Enabling DNS query logging increases latency by ${latencyDifference.toFixed(1)} ms.`
      );
    }
    
    return recommendations;
  }
}
