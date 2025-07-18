// Report Generator Service Implementation
import { 
  ReportGenerator, 
  AnalysisResults, 
  BandwidthMetrics, 
  LatencyMetrics, 
  ReliabilityMetrics, 
  CpuMetrics,
  DnsPerformanceMetrics,
  DomainPerformance,
  ConfigurationRanking,
  PerformanceAnomaly
} from '../models';

/**
 * Default implementation of the ReportGenerator interface
 * Generates comprehensive markdown reports from analysis results
 */
export class DefaultReportGenerator implements ReportGenerator {
  /**
   * Generate a complete markdown report from analysis results
   * @param analysis The analysis results to include in the report
   * @returns A promise that resolves to the generated markdown report
   */
  async generateReport(analysis: AnalysisResults): Promise<string> {
    try {
      const reportParts = [
        this.generateReportHeader(analysis),
        this.createExecutiveSummary(analysis),
        this.generateConfigurationOverview(analysis),
        this.generateDetailedTables(analysis),
        this.createVisualizationDescriptions(analysis),
        this.generateAnomaliesSection(analysis),
        this.generateRecommendationsSection(analysis)
      ];

      return reportParts.join('\n\n');
    } catch (error: any) {
      console.error('Error generating report:', error);
      const errorMessage = error.message || 'Unknown error';
      throw new Error(`Failed to generate report: ${errorMessage}`);
    }
  }

  /**
   * Generate the report header with title and date
   * @param analysis The analysis results
   * @returns The header as a markdown string
   */
  private generateReportHeader(analysis: AnalysisResults): string {
    const date = new Date().toISOString().split('T')[0];
    return [
      '# Network Performance Analysis Report',
      '',
      `**Date:** ${date}`,
      `**Datasets Analyzed:** ${analysis.summary.totalDatasets}`,
      ''
    ].join('\n');
  }

  /**
   * Create an executive summary section for the report
   * @param analysis The analysis results to summarize
   * @returns The executive summary as a markdown string
   */
  createExecutiveSummary(analysis: AnalysisResults): string {
    const { summary } = analysis;
    
    const executiveSummary = [
      '## Executive Summary',
      '',
      'This report presents a comprehensive analysis of network performance across different configurations, focusing on bandwidth, latency, reliability, and DNS resolution performance.',
      '',
      '### Key Findings',
      ''
    ];

    // Add key findings as bullet points
    summary.keyFindings.forEach(finding => {
      executiveSummary.push(`- ${finding}`);
    });
    
    executiveSummary.push('');
    executiveSummary.push('### Optimal Configuration');
    executiveSummary.push('');
    executiveSummary.push(`Based on the analysis, the **${summary.optimalConfiguration}** configuration provides the best overall performance.`);
    executiveSummary.push('');
    
    // Add performance highlights
    executiveSummary.push('### Performance Highlights');
    executiveSummary.push('');
    summary.performanceHighlights.forEach(highlight => {
      executiveSummary.push(`- ${highlight}`);
    });

    return executiveSummary.join('\n');
  }

  /**
   * Generate an overview of the configurations analyzed
   * @param analysis The analysis results
   * @returns The configuration overview as a markdown string
   */
  private generateConfigurationOverview(analysis: AnalysisResults): string {
    const { configurationComparison } = analysis;
    const { overallRanking } = configurationComparison;
    
    const overview = [
      '## Configuration Overview',
      '',
      'The following configurations were analyzed and ranked based on overall performance:',
      '',
      '| Rank | Configuration | Overall Score | Bandwidth Score | Latency Score | Reliability Score |',
      '|------|--------------|--------------|----------------|--------------|------------------|'
    ];

    // Sort configurations by rank
    const sortedConfigs = [...overallRanking].sort((a, b) => a.rank - b.rank);
    
    sortedConfigs.forEach(config => {
      overview.push(
        `| ${config.rank} | ${config.configuration} | ${config.overallScore.toFixed(2)} | ${config.bandwidthScore.toFixed(2)} | ${config.latencyScore.toFixed(2)} | ${config.reliabilityScore.toFixed(2)} |`
      );
    });

    return overview.join('\n');
  }

  /**
   * Generate detailed performance tables for the report
   * @param analysis The analysis results to tabulate
   * @returns The detailed tables as a markdown string
   */
  generateDetailedTables(analysis: AnalysisResults): string {
    const sections = [
      '## Detailed Performance Analysis',
      '',
      this.generateBandwidthTable(analysis.iperfAnalysis.bandwidthComparison),
      '',
      this.generateLatencyTable(analysis.iperfAnalysis.latencyAnalysis),
      '',
      this.generateReliabilityTable(analysis.iperfAnalysis.reliabilityMetrics),
      '',
      this.generateCpuUtilizationTable(analysis.iperfAnalysis.cpuUtilizationAnalysis),
      '',
      this.generateDnsPerformanceTable(analysis.dnsAnalysis.performanceMetrics),
      '',
      this.generateDomainRankingTable(analysis.dnsAnalysis.domainRankings)
    ];

    return sections.join('\n');
  }

  /**
   * Generate a table for bandwidth metrics
   * @param metrics The bandwidth metrics to tabulate
   * @returns The bandwidth table as a markdown string
   */
  private generateBandwidthTable(metrics: BandwidthMetrics[]): string {
    const table = [
      '### Bandwidth Performance',
      '',
      'The following table shows bandwidth performance metrics across different configurations:',
      '',
      '| Configuration | Avg (Mbps) | Median (Mbps) | Max (Mbps) | Min (Mbps) | Std Dev | 95th % | 99th % |',
      '|--------------|------------|---------------|------------|------------|---------|--------|--------|'
    ];

    metrics.forEach(metric => {
      table.push(
        `| ${metric.configuration} | ${metric.avgBandwidthMbps.toFixed(2)} | ${metric.medianBandwidthMbps.toFixed(2)} | ${metric.maxBandwidthMbps.toFixed(2)} | ${metric.minBandwidthMbps.toFixed(2)} | ${metric.standardDeviation.toFixed(2)} | ${metric.percentile95.toFixed(2)} | ${metric.percentile99.toFixed(2)} |`
      );
    });

    return table.join('\n');
  }

  /**
   * Generate a table for latency metrics
   * @param metrics The latency metrics to tabulate
   * @returns The latency table as a markdown string
   */
  private generateLatencyTable(metrics: LatencyMetrics[]): string {
    const table = [
      '### Latency Performance',
      '',
      'The following table shows latency performance metrics across different configurations:',
      '',
      '| Configuration | Avg (ms) | Median (ms) | Max (ms) | Min (ms) | Jitter (ms) |',
      '|--------------|----------|-------------|----------|----------|-------------|'
    ];

    metrics.forEach(metric => {
      table.push(
        `| ${metric.configuration} | ${metric.avgLatencyMs.toFixed(2)} | ${metric.medianLatencyMs.toFixed(2)} | ${metric.maxLatencyMs.toFixed(2)} | ${metric.minLatencyMs.toFixed(2)} | ${metric.jitterMs.toFixed(2)} |`
      );
    });

    return table.join('\n');
  }

  /**
   * Generate a table for reliability metrics
   * @param metrics The reliability metrics to tabulate
   * @returns The reliability table as a markdown string
   */
  private generateReliabilityTable(metrics: ReliabilityMetrics[]): string {
    const table = [
      '### Reliability Metrics',
      '',
      'The following table shows reliability metrics across different configurations:',
      '',
      '| Configuration | Success Rate (%) | Retransmit Rate (%) | Packet Loss (%) | Error Count |',
      '|--------------|------------------|---------------------|-----------------|-------------|'
    ];

    metrics.forEach(metric => {
      table.push(
        `| ${metric.configuration} | ${(metric.successRate * 100).toFixed(2)} | ${(metric.retransmitRate * 100).toFixed(2)} | ${(metric.packetLossRate * 100).toFixed(2)} | ${metric.errorCount} |`
      );
    });

    return table.join('\n');
  }

  /**
   * Generate a table for CPU utilization metrics
   * @param metrics The CPU metrics to tabulate
   * @returns The CPU utilization table as a markdown string
   */
  private generateCpuUtilizationTable(metrics: CpuMetrics[]): string {
    const table = [
      '### CPU Utilization',
      '',
      'The following table shows CPU utilization metrics across different configurations:',
      '',
      '| Configuration | Avg Host CPU (%) | Avg Remote CPU (%) | Max Host CPU (%) | Max Remote CPU (%) |',
      '|--------------|------------------|-------------------|------------------|-------------------|'
    ];

    metrics.forEach(metric => {
      table.push(
        `| ${metric.configuration} | ${(metric.avgHostCpuUsage * 100).toFixed(2)} | ${(metric.avgRemoteCpuUsage * 100).toFixed(2)} | ${(metric.maxHostCpuUsage * 100).toFixed(2)} | ${(metric.maxRemoteCpuUsage * 100).toFixed(2)} |`
      );
    });

    return table.join('\n');
  }

  /**
   * Generate a table for DNS performance metrics
   * @param metrics The DNS performance metrics to tabulate
   * @returns The DNS performance table as a markdown string
   */
  private generateDnsPerformanceTable(metrics: DnsPerformanceMetrics[]): string {
    const table = [
      '### DNS Performance',
      '',
      'The following table shows DNS performance metrics across different configurations:',
      '',
      '| Configuration | Avg Response Time (ms) | Median Response Time (ms) | Success Rate (%) |',
      '|--------------|------------------------|---------------------------|------------------|'
    ];

    metrics.forEach(metric => {
      table.push(
        `| ${metric.configuration} | ${metric.avgResponseTimeMs.toFixed(2)} | ${metric.medianResponseTimeMs.toFixed(2)} | ${(metric.successRate * 100).toFixed(2)} |`
      );
    });

    return table.join('\n');
  }

  /**
   * Generate a table for domain ranking by performance
   * @param domains The domain performance metrics to tabulate
   * @returns The domain ranking table as a markdown string
   */
  private generateDomainRankingTable(domains: DomainPerformance[]): string {
    // Take top 10 slowest domains
    const slowestDomains = [...domains]
      .sort((a, b) => b.avgResponseTimeMs - a.avgResponseTimeMs)
      .slice(0, 10);
    
    const table = [
      '### Slowest DNS Domains',
      '',
      'The following table shows the 10 slowest domains by average response time:',
      '',
      '| Domain | Avg Response Time (ms) | Success Rate (%) | Query Count |',
      '|--------|------------------------|------------------|-------------|'
    ];

    slowestDomains.forEach(domain => {
      table.push(
        `| ${domain.domain} | ${domain.avgResponseTimeMs.toFixed(2)} | ${(domain.successRate * 100).toFixed(2)} | ${domain.queryCount} |`
      );
    });

    return table.join('\n');
  }

  /**
   * Create textual descriptions of visualizations for the report
   * @param analysis The analysis results to describe
   * @returns The visualization descriptions as a markdown string
   */
  createVisualizationDescriptions(analysis: AnalysisResults): string {
    const { iperfAnalysis, dnsAnalysis, configurationComparison } = analysis;
    
    const descriptions = [
      '## Performance Visualization Analysis',
      '',
      '### Bandwidth Comparison',
      '',
      this.describeBandwidthVisualization(iperfAnalysis.bandwidthComparison),
      '',
      '### MTU Impact Analysis',
      '',
      this.describeMtuImpact(configurationComparison.mtuImpact),
      '',
      '### DNS Performance Patterns',
      '',
      this.describeDnsPerformance(dnsAnalysis.performanceMetrics)
    ];

    return descriptions.join('\n');
  }

  /**
   * Describe bandwidth visualization insights
   * @param metrics The bandwidth metrics to describe
   * @returns The bandwidth visualization description
   */
  private describeBandwidthVisualization(metrics: BandwidthMetrics[]): string {
    if (!metrics || metrics.length === 0) {
      return 'No bandwidth data available for visualization.';
    }
    
    // Sort configurations by average bandwidth
    const sortedByBandwidth = [...metrics].sort((a, b) => b.avgBandwidthMbps - a.avgBandwidthMbps);
    const bestConfig = sortedByBandwidth[0];
    const worstConfig = sortedByBandwidth[sortedByBandwidth.length - 1];
    
    if (!bestConfig || !worstConfig) {
      return 'Insufficient bandwidth data for comparison.';
    }
    
    const bandwidthDifference = bestConfig.avgBandwidthMbps - worstConfig.avgBandwidthMbps;
    const percentageDifference = (bandwidthDifference / worstConfig.avgBandwidthMbps) * 100;
    
    return [
      `The bandwidth comparison chart shows that the **${bestConfig.configuration}** configuration achieves the highest average bandwidth at **${bestConfig.avgBandwidthMbps.toFixed(2)} Mbps**. This is **${percentageDifference.toFixed(2)}%** higher than the lowest performing configuration (**${worstConfig.configuration}** at **${worstConfig.avgBandwidthMbps.toFixed(2)} Mbps**).`,
      '',
      `The 95th percentile bandwidth for the best configuration is **${bestConfig.percentile95.toFixed(2)} Mbps**, indicating consistent high performance. The standard deviation of **${bestConfig.standardDeviation.toFixed(2)}** suggests ${bestConfig.standardDeviation < 5 ? 'stable' : 'variable'} performance across test runs.`
    ].join('\n');
  }

  /**
   * Describe MTU impact analysis insights
   * @param mtuAnalysis The MTU analysis to describe
   * @returns The MTU impact description
   */
  private describeMtuImpact(mtuAnalysis: any): string {
    if (!mtuAnalysis) {
      return 'No MTU analysis data available.';
    }
    
    const { optimalMtu, performanceByMtu, recommendations } = mtuAnalysis;
    
    if (!performanceByMtu || Object.keys(performanceByMtu).length === 0) {
      return `MTU analysis shows that ${optimalMtu || 'N/A'} is the recommended MTU size, but detailed performance data is not available.`;
    }
    
    // Get MTU sizes and sort them
    const mtuSizes = Object.keys(performanceByMtu).map(Number).sort((a, b) => a - b);
    
    let description = [
      `Analysis of different MTU sizes shows that **${optimalMtu}** provides the optimal balance of performance metrics. `,
      ''
    ];

    // Add comparison between different MTU sizes
    if (mtuSizes.length > 1) {
      const comparisons = [];
      
      for (let i = 0; i < mtuSizes.length - 1; i++) {
        const currentMtu = mtuSizes[i];
        const nextMtu = mtuSizes[i + 1];
        
        if (typeof currentMtu === 'number' && typeof nextMtu === 'number' && 
            performanceByMtu[currentMtu] && performanceByMtu[nextMtu]) {
          
          const currentPerf = performanceByMtu[currentMtu];
          const nextPerf = performanceByMtu[nextMtu];
          
          const bandwidthDiff = ((nextPerf.avgBandwidth - currentPerf.avgBandwidth) / currentPerf.avgBandwidth) * 100;
          const latencyDiff = ((nextPerf.avgLatency - currentPerf.avgLatency) / currentPerf.avgLatency) * 100;
          
          comparisons.push(`Increasing MTU from **${currentMtu}** to **${nextMtu}** resulted in a **${bandwidthDiff.toFixed(2)}%** change in bandwidth and a **${latencyDiff.toFixed(2)}%** change in latency.`);
        }
      }
      
      if (comparisons.length > 0) {
        description = description.concat(comparisons);
        description.push('');
      }
    }

    // Add recommendations
    if (recommendations && recommendations.length > 0) {
      description.push('**Recommendations based on MTU analysis:**');
      description.push('');
      recommendations.forEach((rec: string) => {
        description.push(`- ${rec}`);
      });
    }

    return description.join('\n');
  }

  /**
   * Describe DNS performance insights
   * @param metrics The DNS performance metrics to describe
   * @returns The DNS performance description
   */
  private describeDnsPerformance(metrics: DnsPerformanceMetrics[]): string {
    if (!metrics || metrics.length === 0) {
      return 'No DNS performance data available for analysis.';
    }
    
    // Sort configurations by average response time
    const sortedByResponseTime = [...metrics].sort((a, b) => a.avgResponseTimeMs - b.avgResponseTimeMs);
    const bestConfig = sortedByResponseTime[0];
    const worstConfig = sortedByResponseTime[sortedByResponseTime.length - 1];
    
    if (!bestConfig || !worstConfig) {
      return 'Insufficient DNS performance data for comparison.';
    }
    
    const timeDifference = worstConfig.avgResponseTimeMs - bestConfig.avgResponseTimeMs;
    const percentageDifference = (timeDifference / bestConfig.avgResponseTimeMs) * 100;
    
    return [
      `DNS performance analysis shows that the **${bestConfig.configuration}** configuration achieves the fastest average response time at **${bestConfig.avgResponseTimeMs.toFixed(2)} ms**. This is **${percentageDifference.toFixed(2)}%** faster than the slowest configuration (**${worstConfig.configuration}** at **${worstConfig.avgResponseTimeMs.toFixed(2)} ms**).`,
      '',
      `The success rate for DNS queries ranges from **${(bestConfig.successRate * 100).toFixed(2)}%** to **${(worstConfig.successRate * 100).toFixed(2)}%** across configurations.`,
      '',
      `Analysis of the slowest domains reveals patterns that may indicate network configuration issues or DNS server performance limitations. The slowest domains consistently show higher response times across all configurations.`
    ].join('\n');
  }

  /**
   * Generate a section for performance anomalies
   * @param analysis The analysis results
   * @returns The anomalies section as a markdown string
   */
  private generateAnomaliesSection(analysis: AnalysisResults): string {
    const { anomalies } = analysis;
    
    if (!anomalies || anomalies.length === 0) {
      return '## Performance Anomalies\n\nNo significant performance anomalies were detected in the analyzed datasets.';
    }
    
    const section = [
      '## Performance Anomalies',
      '',
      'The following performance anomalies were detected during analysis:',
      ''
    ];

    // Group anomalies by severity
    const highSeverity = anomalies.filter(a => a.severity === 'high');
    const mediumSeverity = anomalies.filter(a => a.severity === 'medium');
    const lowSeverity = anomalies.filter(a => a.severity === 'low');
    
    if (highSeverity.length > 0) {
      section.push('### High Severity Anomalies');
      section.push('');
      highSeverity.forEach(anomaly => {
        section.push(this.formatAnomalyEntry(anomaly));
      });
    }
    
    if (mediumSeverity.length > 0) {
      section.push('### Medium Severity Anomalies');
      section.push('');
      mediumSeverity.forEach(anomaly => {
        section.push(this.formatAnomalyEntry(anomaly));
      });
    }
    
    if (lowSeverity.length > 0) {
      section.push('### Low Severity Anomalies');
      section.push('');
      lowSeverity.forEach(anomaly => {
        section.push(this.formatAnomalyEntry(anomaly));
      });
    }

    return section.join('\n');
  }

  /**
   * Format an anomaly entry for the report
   * @param anomaly The anomaly to format
   * @returns The formatted anomaly entry
   */
  private formatAnomalyEntry(anomaly: PerformanceAnomaly): string {
    const entry = [
      `#### ${anomaly.type.toUpperCase()} Anomaly in ${anomaly.configuration}`,
      '',
      `**Description:** ${anomaly.description}`,
      '',
      '**Affected Metrics:**'
    ];
    
    anomaly.affectedMetrics.forEach(metric => {
      entry.push(`- ${metric}`);
    });
    
    entry.push('');
    entry.push('**Recommendations:**');
    
    anomaly.recommendations.forEach(rec => {
      entry.push(`- ${rec}`);
    });
    
    entry.push('');
    return entry.join('\n');
  }

  /**
   * Generate a recommendations section for the report
   * @param analysis The analysis results
   * @returns The recommendations section as a markdown string
   */
  private generateRecommendationsSection(analysis: AnalysisResults): string {
    const { summary } = analysis;
    
    const section = [
      '## Recommendations',
      '',
      'Based on the comprehensive analysis of network performance across configurations, the following recommendations are provided:'
    ];

    // Add recommendations as bullet points
    summary.recommendations.forEach(recommendation => {
      section.push(`- ${recommendation}`);
    });
    
    return section.join('\n');
  }
}

export { ReportGenerator };