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
  PerformanceAnomaly,
} from "../models";

/**
 * Default implementation of the ReportGenerator interface
 * Generates comprehensive markdown reports from analysis results
 */
export class DefaultReportGenerator implements ReportGenerator {
  // Map to store dataset name to display name mappings
  protected datasetDisplayNames: Map<string, string> = new Map();
  
  /**
   * Set the dataset display name mapping
   * @param datasets Array of datasets with name and displayName properties
   */
  setDatasetDisplayNames(datasets: { name: string; displayName?: string }[]): void {
    this.datasetDisplayNames.clear();
    datasets.forEach(dataset => {
      if (dataset.displayName) {
        this.datasetDisplayNames.set(dataset.name, dataset.displayName);
      }
    });
  }
  
  /**
   * Get the display name for a configuration
   * @param configName The configuration name
   * @returns The display name if available, otherwise the original name
   */
  protected getConfigurationDisplayName(configName: string): string {
    return this.datasetDisplayNames.get(configName) || configName;
  }
  /**
   * Generate a complete markdown report from analysis results
   * @param analysis The analysis results to include in the report
   * @returns A promise that resolves to the generated markdown report
   */
  async generateReport(analysis: AnalysisResults): Promise<string> {
    try {
      // Prepare data for template
      const templateData = this.prepareTemplateData(analysis);
      
      const reportParts = [
        this.generateReportHeader(analysis),
        this.createExecutiveSummary(analysis),
        this.generateConfigurationOverview(analysis),
        this.generateComparisonTables(analysis),
        this.generateDetailedTables(analysis),
        this.createVisualizationDescriptions(analysis),
        this.generateAnomaliesSection(analysis),
        this.generateRecommendationsSection(analysis),
      ];

      // Join the report parts with double newlines
      return reportParts.filter(part => part && part.trim().length > 0).join("\n\n");
    } catch (error: any) {
      console.error("Error generating report:", error);
      const errorMessage = error.message || "Unknown error";
      throw new Error(`Failed to generate report: ${errorMessage}`);
    }
  }

  /**
   * Generate the report header with title and date
   * @param analysis The analysis results
   * @returns The header as a markdown string
   */
  private generateReportHeader(analysis: AnalysisResults): string {
    const date = new Date().toISOString().split("T")[0];
    return [
      "# Network Performance Analysis Report",
      "",
      `**Date:** ${date}`,
      `**Datasets Analyzed:** ${analysis.summary.totalDatasets}`,
      "",
    ].join("\n");
  }

  /**
   * Create an executive summary section for the report
   * @param analysis The analysis results to summarize
   * @returns The executive summary as a markdown string
   */
  createExecutiveSummary(analysis: AnalysisResults): string {
    const { summary } = analysis;
    
    console.log('[DEBUG] Summary object:', summary);
    console.log('[DEBUG] Optimal configuration from summary:', summary.optimalConfiguration);

    const executiveSummary = [
      "## Executive Summary",
      "",
      "This report presents a comprehensive analysis of network performance across different configurations, focusing on bandwidth, latency, reliability, and DNS resolution performance.",
      "",
      "### Key Findings",
      "",
    ];

    // Add key findings as bullet points
    summary.keyFindings.forEach((finding) => {
      // Replace dataset names with display names in findings
      let updatedFinding = finding;
      this.datasetDisplayNames.forEach((displayName, name) => {
        updatedFinding = updatedFinding.replace(name, displayName);
      });
      executiveSummary.push(`- ${updatedFinding}`);
    });

    executiveSummary.push("");
    executiveSummary.push("### Optimal Configuration");
    executiveSummary.push("");
    executiveSummary.push(
      `Based on the analysis, the **${this.getConfigurationDisplayName(summary.optimalConfiguration)}** configuration provides the best overall performance.`
    );
    executiveSummary.push("");

    // Add performance highlights
    executiveSummary.push("### Performance Highlights");
    executiveSummary.push("");
    summary.performanceHighlights.forEach((highlight) => {
      // Replace dataset names with display names in highlights
      let updatedHighlight = highlight;
      this.datasetDisplayNames.forEach((displayName, name) => {
        updatedHighlight = updatedHighlight.replace(name, displayName);
      });
      executiveSummary.push(`- ${updatedHighlight}`);
    });

    return executiveSummary.join("\n");
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
      "## Configuration Overview",
      "",
      "The following configurations were analyzed and ranked based on overall performance:",
      "",
      "| Rank | Configuration | Overall Score | Bandwidth Score | Latency Score | Reliability Score |",
      "|------|--------------|--------------|----------------|--------------|------------------|",
    ];

    // Sort configurations by rank
    const sortedConfigs = [...overallRanking].sort((a, b) => a.rank - b.rank);

    sortedConfigs.forEach((config) => {
      overview.push(
        `| ${config.rank} | ${
          this.getConfigurationDisplayName(config.configuration)
        } | ${config.overallScore.toFixed(2)} | ${config.bandwidthScore.toFixed(
          2
        )} | ${config.latencyScore.toFixed(
          2
        )} | ${config.reliabilityScore.toFixed(2)} |`
      );
    });

    return overview.join("\n");
  }

  /**
   * Generate detailed performance tables for the report
   * @param analysis The analysis results to tabulate
   * @returns The detailed tables as a markdown string
   */
  /**
   * Generate side-by-side comparison tables for better analysis
   * @param analysis The analysis results
   * @returns The comparison tables as a markdown string
   */
  generateComparisonTables(analysis: AnalysisResults): string {
    // Prepare template data to get the dnsMetrics with displayName
    const templateData = this.prepareTemplateData(analysis);
    
    const sections = [
      "## Side-by-Side Comparisons",
      "",
      "These tables provide direct comparisons across different configurations to help identify patterns and make informed decisions.",
      "",
      this.generateDnsComparisonTable(templateData.dnsMetrics),
      "",
      this.generateMtuImpactTable(analysis),
      "",
      this.generateDnsServerComparisonTable(analysis),
      "",
      this.generateLoggingImpactTable(analysis),
      "",
      this.generateAnomalyDistributionTable(analysis.anomalies),
    ];

    return sections.join("\n");
  }

  /**
   * Generate a DNS performance comparison table
   * @param metrics The DNS performance metrics
   * @returns The DNS comparison table as a markdown string
   */
  /**
   * Prepare data for the template
   * @param analysis The analysis results
   * @returns The prepared data for the template
   */
  private prepareTemplateData(analysis: AnalysisResults): any {
    const { iperfAnalysis, dnsAnalysis, configurationComparison, anomalies } = analysis;
    const { bandwidthComparison, latencyAnalysis, reliabilityMetrics } = iperfAnalysis;
    const { performanceMetrics } = dnsAnalysis;
    const { overallRanking } = configurationComparison;
    
    // Prepare DNS metrics with slow domains count and display names
    const dnsMetricsWithSlowDomains = performanceMetrics.map(metric => {
      const slowDomains = metric.slowestDomains ? 
        metric.slowestDomains.filter(d => d.avgResponseTimeMs > 150) : [];
      return {
        ...metric,
        displayName: this.getConfigurationDisplayName(metric.configuration),
        slowDomainsCount: slowDomains.length,
        successRate: (metric.successRate * 100).toFixed(1)
      };
    });
    
    // Prepare MTU impact data
    const mtuImpactData: any[] = [];
    const configsByMtu = new Map<string, any[]>();
    
    // Group configurations by MTU and DNS server
    overallRanking.forEach(config => {
      const displayName = this.getConfigurationDisplayName(config.configuration);
      const parts = displayName.split('-');
      if (parts.length >= 2 && parts[0] && parts[1]) {
        const dnsServer = parts[0]; // e.g., 'bind9' or 'coredns'
        const mtu = parts[1].replace('mtu', ''); // e.g., '1420' from 'mtu1420'
        const key = `${mtu} (${dnsServer})`;
        
        if (!configsByMtu.has(key)) {
          configsByMtu.set(key, []);
        }
        const configList = configsByMtu.get(key);
        if (configList) {
          configList.push({
            ...config,
            displayName,
            mtu,
            dnsServer
          });
        }
      }
    });
    
    // Create MTU impact data entries
    configsByMtu.forEach((configs, mtuSetting) => {
      if (configs.length > 0) {
        const config = configs[0];
        const bandwidthMetric = bandwidthComparison.find(m => m.configuration === config.configuration);
        const latencyMetric = latencyAnalysis.find(m => m.configuration === config.configuration);
        const reliabilityMetric = reliabilityMetrics.find(m => m.configuration === config.configuration);
        
        mtuImpactData.push({
          mtuSetting,
          avgBandwidth: bandwidthMetric ? bandwidthMetric.avgBandwidthMbps.toFixed(2) : 'N/A',
          avgLatency: latencyMetric ? latencyMetric.avgLatencyMs.toFixed(2) : 'N/A',
          jitter: latencyMetric ? latencyMetric.jitterMs.toFixed(2) : 'N/A',
          packetLoss: reliabilityMetric ? (reliabilityMetric.packetLossRate * 100).toFixed(2) : 'N/A',
          overallScore: config.overallScore.toFixed(2)
        });
      }
    });
    
    // Prepare DNS server data
    const dnsServerData: any[] = [];
    const configsByServer = new Map<string, any[]>();
    
    // Group configurations by DNS server
    overallRanking.forEach(config => {
      const displayName = this.getConfigurationDisplayName(config.configuration);
      const parts = displayName.split('-');
      if (parts.length >= 1 && parts[0]) {
        const dnsServer = parts[0]; // e.g., 'bind9' or 'coredns'
        
        if (!configsByServer.has(dnsServer)) {
          configsByServer.set(dnsServer, []);
        }
        const configList = configsByServer.get(dnsServer);
        if (configList) {
          configList.push({
            ...config,
            displayName
          });
        }
      }
    });
    
    // Calculate averages for each DNS server
    configsByServer.forEach((configs, server) => {
      if (configs.length > 0) {
        // Calculate average bandwidth
        const bandwidthValues = configs
          .map(c => bandwidthComparison.find(m => m.configuration === c.configuration)?.avgBandwidthMbps || 0);
        const avgBandwidth = bandwidthValues.length > 0 
          ? (bandwidthValues.reduce((sum, val) => sum + val, 0) / bandwidthValues.length).toFixed(2)
          : 'N/A';
        
        // Calculate average latency
        const latencyValues = configs
          .map(c => latencyAnalysis.find(m => m.configuration === c.configuration)?.avgLatencyMs || 0);
        const avgLatency = latencyValues.length > 0
          ? (latencyValues.reduce((sum, val) => sum + val, 0) / latencyValues.length).toFixed(2)
          : 'N/A';
        
        // Calculate average DNS response time
        const dnsResponseValues = configs
          .map(c => performanceMetrics.find(m => m.configuration === c.configuration)?.avgResponseTimeMs || 0);
        const avgDnsResponse = dnsResponseValues.length > 0
          ? (dnsResponseValues.reduce((sum, val) => sum + val, 0) / dnsResponseValues.length).toFixed(2)
          : 'N/A';
        
        // Calculate average packet loss
        const packetLossValues = configs
          .map(c => {
            const reliabilityMetric = reliabilityMetrics.find(m => m.configuration === c.configuration);
            return reliabilityMetric ? reliabilityMetric.packetLossRate * 100 : 0;
          });
        const avgPacketLoss = packetLossValues.length > 0
          ? (packetLossValues.reduce((sum, val) => sum + val, 0) / packetLossValues.length).toFixed(2)
          : 'N/A';
        
        // Calculate average overall score
        const scoreValues = configs.map(c => c.overallScore);
        const avgScore = scoreValues.length > 0
          ? (scoreValues.reduce((sum, val) => sum + val, 0) / scoreValues.length).toFixed(2)
          : 'N/A';
        
        dnsServerData.push({
          server,
          avgBandwidth,
          avgLatency,
          dnsResponse: avgDnsResponse,
          packetLoss: avgPacketLoss,
          overallScore: avgScore
        });
      }
    });
    
    // Prepare logging impact data
    const loggingImpactData: any[] = [];
    const configsByLogging = new Map<string, any[]>();
    
    // Group configurations by logging status
    overallRanking.forEach(config => {
      const displayName = this.getConfigurationDisplayName(config.configuration);
      const parts = displayName.split('-');
      if (parts.length >= 3 && parts[2]) {
        const loggingStatus = parts[2].includes('enabled') ? 'Enabled' : 'Disabled';
        
        if (!configsByLogging.has(loggingStatus)) {
          configsByLogging.set(loggingStatus, []);
        }
        const configList = configsByLogging.get(loggingStatus);
        if (configList) {
          configList.push({
            ...config,
            displayName
          });
        }
      }
    });
    
    // Calculate averages for each logging status
    configsByLogging.forEach((configs, status) => {
      if (configs.length > 0) {
        // Calculate average bandwidth
        const bandwidthValues = configs
          .map(c => bandwidthComparison.find(m => m.configuration === c.configuration)?.avgBandwidthMbps || 0);
        const avgBandwidth = bandwidthValues.length > 0 
          ? (bandwidthValues.reduce((sum, val) => sum + val, 0) / bandwidthValues.length).toFixed(2)
          : 'N/A';
        
        // Calculate average latency
        const latencyValues = configs
          .map(c => latencyAnalysis.find(m => m.configuration === c.configuration)?.avgLatencyMs || 0);
        const avgLatency = latencyValues.length > 0
          ? (latencyValues.reduce((sum, val) => sum + val, 0) / latencyValues.length).toFixed(2)
          : 'N/A';
        
        // Calculate average DNS response time
        const dnsResponseValues = configs
          .map(c => performanceMetrics.find(m => m.configuration === c.configuration)?.avgResponseTimeMs || 0);
        const avgDnsResponse = dnsResponseValues.length > 0
          ? (dnsResponseValues.reduce((sum, val) => sum + val, 0) / dnsResponseValues.length).toFixed(2)
          : 'N/A';
        
        // Calculate average packet loss
        const packetLossValues = configs
          .map(c => {
            const reliabilityMetric = reliabilityMetrics.find(m => m.configuration === c.configuration);
            return reliabilityMetric ? reliabilityMetric.packetLossRate * 100 : 0;
          });
        const avgPacketLoss = packetLossValues.length > 0
          ? (packetLossValues.reduce((sum, val) => sum + val, 0) / packetLossValues.length).toFixed(2)
          : 'N/A';
        
        // Calculate average overall score
        const scoreValues = configs.map(c => c.overallScore);
        const avgScore = scoreValues.length > 0
          ? (scoreValues.reduce((sum, val) => sum + val, 0) / scoreValues.length).toFixed(2)
          : 'N/A';
        
        loggingImpactData.push({
          status,
          avgBandwidth,
          avgLatency,
          dnsResponse: avgDnsResponse,
          packetLoss: avgPacketLoss,
          overallScore: avgScore
        });
      }
    });
    
    // Prepare anomaly distribution data
    const anomalyDistribution: any[] = [];
    const anomalyMap = new Map<string, Map<string, { count: number, severities: string[] }>>();
    
    // Group anomalies by configuration and type
    anomalies.forEach(anomaly => {
      const configName = this.getConfigurationDisplayName(anomaly.configuration);
      
      if (!anomalyMap.has(configName)) {
        anomalyMap.set(configName, new Map());
      }
      
      const configAnomalies = anomalyMap.get(configName)!;
      if (!configAnomalies.has(anomaly.type)) {
        configAnomalies.set(anomaly.type, { count: 0, severities: [] });
      }
      
      const typeAnomalies = configAnomalies.get(anomaly.type)!;
      typeAnomalies.count++;
      typeAnomalies.severities.push(anomaly.severity);
    });
    
    // Format anomaly distribution data
    anomalyMap.forEach((configAnomalies, configuration) => {
      // Format anomaly counts with severity
      const formatAnomalies = (type: string) => {
        if (!configAnomalies.has(type)) return '0';
        
        const anomalyData = configAnomalies.get(type);
        if (!anomalyData) return '0';
        
        const { count, severities } = anomalyData;
        const severityCounts = {
          high: severities.filter(s => s === 'high').length,
          medium: severities.filter(s => s === 'medium').length,
          low: severities.filter(s => s === 'low').length
        };
        
        const parts = [];
        if (severityCounts.high > 0) parts.push(`${severityCounts.high} (high)`);
        if (severityCounts.medium > 0) parts.push(`${severityCounts.medium} (medium)`);
        if (severityCounts.low > 0) parts.push(`${severityCounts.low} (low)`);
        
        return parts.join(', ');
      };
      
      const bandwidthAnomalies = formatAnomalies('bandwidth');
      const latencyAnomalies = formatAnomalies('latency');
      const packetLossAnomalies = formatAnomalies('packet_loss');
      const dnsAnomalies = formatAnomalies('dns_failure');
      
      // Calculate total anomalies
      const totalAnomalies = Array.from(configAnomalies.values())
        .reduce((sum, anomalyData) => sum + anomalyData.count, 0);
      
      anomalyDistribution.push({
        configuration,
        bandwidthAnomalies,
        latencyAnomalies,
        packetLossAnomalies,
        dnsAnomalies,
        total: totalAnomalies
      });
    });
    
    // Return the prepared data
    return {
      ...analysis,
      ...analysis.summary,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      datasetCount: analysis.summary.totalDatasets,
      configurations: overallRanking,
      bandwidthMetrics: bandwidthComparison,
      latencyMetrics: latencyAnalysis,
      dnsMetrics: dnsMetricsWithSlowDomains,
      slowestDomains: dnsAnalysis.domainRankings?.slice(0, 10) || [],
      mtuImpactData,
      dnsServerData,
      loggingImpactData,
      anomalyDistribution
    };
  }

  private generateDnsComparisonTable(metrics: DnsPerformanceMetrics[]): string {
    // Count domains with response time > 150ms for each configuration
    const domainsOver150ms = metrics.map(metric => {
      const slowDomains = metric.slowestDomains ? 
        metric.slowestDomains.filter(d => d.avgResponseTimeMs > 150) : [];
      return {
        configuration: metric.configuration,
        count: slowDomains.length
      };
    });

    const table = [
      "### DNS Performance Comparison",
      "",
      "This table provides a side-by-side comparison of DNS performance metrics across all configurations:",
      "",
      "| Configuration | Avg Response (ms) | Median Response (ms) | Success Rate (%) | Domains with >150ms |",
      "|---------------|------------------|----------------------|------------------|---------------------|",
    ];

    // Sort by average response time
    const sortedMetrics = [...metrics].sort((a, b) => a.avgResponseTimeMs - b.avgResponseTimeMs);

    sortedMetrics.forEach((metric) => {
      const matchingDomain = domainsOver150ms.find(d => d.configuration === metric.configuration);
      const slowDomainsCount = matchingDomain ? matchingDomain.count : 0;
      
      // Use displayName if available, otherwise fall back to getConfigurationDisplayName
      const displayName = (metric as any).displayName || this.getConfigurationDisplayName(metric.configuration);
      
      table.push(
        `| ${displayName} | ${metric.avgResponseTimeMs.toFixed(2)} | ${metric.medianResponseTimeMs.toFixed(2)} | ${(metric.successRate * 100).toFixed(1)} | ${slowDomainsCount} |`
      );
    });

    return table.join("\n");
  }

  /**
   * Generate an MTU impact analysis table
   * @param analysis The analysis results
   * @returns The MTU impact table as a markdown string
   */
  private generateMtuImpactTable(analysis: AnalysisResults): string {
    const { iperfAnalysis, configurationComparison } = analysis;
    const { bandwidthComparison, latencyAnalysis } = iperfAnalysis;
    const { reliabilityMetrics } = iperfAnalysis;
    const { overallRanking } = configurationComparison;

    // Group configurations by MTU and DNS server
    const configsByMtu = new Map<string, any[]>();
    
    // Extract MTU and DNS server from configuration names
    overallRanking.forEach(config => {
      const displayName = this.getConfigurationDisplayName(config.configuration);
      const parts = displayName.split('-');
      if (parts.length >= 2 && parts[0] && parts[1]) {
        const dnsServer = parts[0]; // e.g., 'bind9' or 'coredns'
        const mtu = parts[1].replace('mtu', ''); // e.g., '1420' from 'mtu1420'
        const key = `${mtu} (${dnsServer})`;
        
        if (!configsByMtu.has(key)) {
          configsByMtu.set(key, []);
        }
        const configList = configsByMtu.get(key);
        if (configList) {
          configList.push({
            ...config,
            displayName,
            mtu,
            dnsServer
          });
        }
      }
    });

    // Create table
    const table = [
      "### MTU Impact Analysis",
      "",
      "This table shows the impact of different MTU settings across DNS server implementations:",
      "",
      "| MTU Setting | Avg Bandwidth (Mbps) | Avg Latency (ms) | Jitter (ms) | Packet Loss (%) | Overall Score |",
      "|-------------|----------------------|------------------|-------------|-----------------|---------------|",
    ];

    // Sort by MTU and then by DNS server
    const sortedKeys = Array.from(configsByMtu.keys()).sort((a, b) => {
      const aParts = a.split(' ');
      const bParts = b.split(' ');
      const mtuA = aParts.length > 0 ? parseInt(aParts[0] || '0') : 0;
      const mtuB = bParts.length > 0 ? parseInt(bParts[0] || '0') : 0;
      if (mtuA !== mtuB) return mtuA - mtuB;
      return a.localeCompare(b);
    });

    sortedKeys.forEach(key => {
      const configs = configsByMtu.get(key) || [];
      if (configs.length > 0) {
        // Use the first config in each group
        const config = configs[0];
        
        // Find corresponding bandwidth and latency metrics
        const bandwidthMetric = bandwidthComparison.find(m => m.configuration === config.configuration);
        const latencyMetric = latencyAnalysis.find(m => m.configuration === config.configuration);
        const reliabilityMetric = reliabilityMetrics.find(m => m.configuration === config.configuration);
        
        // Format metrics with null checks
        const formatMetric = (value: number | undefined, multiplier = 1): string => {
          return value !== undefined ? (value * multiplier).toFixed(2) : 'N/A';
        };
        
        const avgBandwidth = bandwidthMetric ? formatMetric(bandwidthMetric.avgBandwidthMbps) : 'N/A';
        const avgLatency = latencyMetric ? formatMetric(latencyMetric.avgLatencyMs) : 'N/A';
        const jitter = latencyMetric ? formatMetric(latencyMetric.jitterMs) : 'N/A';
        const packetLoss = reliabilityMetric ? formatMetric(reliabilityMetric.packetLossRate, 100) : 'N/A';
        const overallScore = config.overallScore.toFixed(2);
        
        table.push(
          `| ${key} | ${avgBandwidth} | ${avgLatency} | ${jitter} | ${packetLoss} | ${overallScore} |`
        );
      }
    });

    return table.join("\n");
  }

  /**
   * Generate a DNS server implementation comparison table
   * @param analysis The analysis results
   * @returns The DNS server comparison table as a markdown string
   */
  private generateDnsServerComparisonTable(analysis: AnalysisResults): string {
    const { iperfAnalysis, dnsAnalysis, configurationComparison } = analysis;
    const { bandwidthComparison, latencyAnalysis } = iperfAnalysis;
    const { performanceMetrics } = dnsAnalysis;
    const { overallRanking } = configurationComparison;

    // Group configurations by DNS server
    const configsByServer = new Map<string, any[]>();
    
    // Extract DNS server from configuration names
    overallRanking.forEach(config => {
      const displayName = this.getConfigurationDisplayName(config.configuration);
      const parts = displayName.split('-');
      if (parts.length >= 1 && parts[0]) {
        const dnsServer = parts[0]; // e.g., 'bind9' or 'coredns'
        
        if (!configsByServer.has(dnsServer)) {
          configsByServer.set(dnsServer, []);
        }
        const configList = configsByServer.get(dnsServer);
        if (configList) {
          configList.push({
            ...config,
            displayName
          });
        }
      }
    });

    // Create table
    const table = [
      "### DNS Server Implementation Comparison",
      "",
      "This table compares the performance of different DNS server implementations across key metrics:",
      "",
      "| DNS Server | Avg Bandwidth (Mbps) | Avg Latency (ms) | DNS Response (ms) | Packet Loss (%) | Overall Score |",
      "|------------|----------------------|------------------|-------------------|-----------------|---------------|",
    ];

    // Calculate averages for each DNS server
    configsByServer.forEach((configs, dnsServer) => {
      if (configs.length > 0) {
        // Helper function to calculate and format averages
        const calculateAverage = (values: number[]): string => {
          return values.length > 0
            ? (values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(2)
            : 'N/A';
        };
        
        // Calculate average bandwidth
        const bandwidthValues = configs
          .map(c => bandwidthComparison.find(m => m.configuration === c.configuration)?.avgBandwidthMbps || 0);
        const avgBandwidth = calculateAverage(bandwidthValues);
        
        // Calculate average latency
        const latencyValues = configs
          .map(c => latencyAnalysis.find(m => m.configuration === c.configuration)?.avgLatencyMs || 0);
        const avgLatency = calculateAverage(latencyValues);
        
        // Calculate average DNS response time
        const dnsResponseValues = configs
          .map(c => performanceMetrics.find(m => m.configuration === c.configuration)?.avgResponseTimeMs || 0);
        const avgDnsResponse = calculateAverage(dnsResponseValues);
        
        // Calculate average packet loss
        const packetLossValues = configs
          .map(c => {
            const reliabilityMetric = analysis.iperfAnalysis.reliabilityMetrics.find(m => m.configuration === c.configuration);
            return reliabilityMetric ? reliabilityMetric.packetLossRate * 100 : 0;
          });
        const avgPacketLoss = calculateAverage(packetLossValues);
        
        // Calculate average overall score
        const scoreValues = configs.map(c => c.overallScore);
        const avgScore = calculateAverage(scoreValues);
        
        table.push(
          `| ${dnsServer} | ${avgBandwidth} | ${avgLatency} | ${avgDnsResponse} | ${avgPacketLoss} | ${avgScore} |`
        );
      }
    });

    return table.join("\n");
  }

  /**
   * Generate a logging impact analysis table
   * @param analysis The analysis results
   * @returns The logging impact table as a markdown string
   */
  private generateLoggingImpactTable(analysis: AnalysisResults): string {
    const { iperfAnalysis, dnsAnalysis, configurationComparison } = analysis;
    const { bandwidthComparison, latencyAnalysis } = iperfAnalysis;
    const { performanceMetrics } = dnsAnalysis;
    const { overallRanking } = configurationComparison;

    // Group configurations by logging status
    const configsByLogging = new Map<string, any[]>();
    
    // Extract logging status from configuration names
    overallRanking.forEach(config => {
      const displayName = this.getConfigurationDisplayName(config.configuration);
      const parts = displayName.split('-');
      if (parts.length >= 3 && parts[2]) {
        const loggingStatus = parts[2].includes('enabled') ? 'Enabled' : 'Disabled';
        
        if (!configsByLogging.has(loggingStatus)) {
          configsByLogging.set(loggingStatus, []);
        }
        const configList = configsByLogging.get(loggingStatus);
        if (configList) {
          configList.push({
            ...config,
            displayName
          });
        }
      }
    });

    // Create table
    const table = [
      "### Logging Impact Analysis",
      "",
      "This table shows the impact of logging configuration on network performance:",
      "",
      "| Logging | Avg Bandwidth (Mbps) | Avg Latency (ms) | DNS Response (ms) | Packet Loss (%) | Overall Score |",
      "|---------|----------------------|------------------|-------------------|-----------------|---------------|",
    ];

    // Calculate averages for each logging status
    configsByLogging.forEach((configs, loggingStatus) => {
      if (configs.length > 0) {
        // Calculate average bandwidth
        const bandwidthValues = configs
          .map(c => bandwidthComparison.find(m => m.configuration === c.configuration)?.avgBandwidthMbps || 0);
        const avgBandwidth = bandwidthValues.length > 0 
          ? (bandwidthValues.reduce((sum, val) => sum + val, 0) / bandwidthValues.length).toFixed(2)
          : 'N/A';
        
        // Calculate average latency
        const latencyValues = configs
          .map(c => latencyAnalysis.find(m => m.configuration === c.configuration)?.avgLatencyMs || 0);
        const avgLatency = latencyValues.length > 0
          ? (latencyValues.reduce((sum, val) => sum + val, 0) / latencyValues.length).toFixed(2)
          : 'N/A';
        
        // Calculate average DNS response time
        const dnsResponseValues = configs
          .map(c => performanceMetrics.find(m => m.configuration === c.configuration)?.avgResponseTimeMs || 0);
        const avgDnsResponse = dnsResponseValues.length > 0
          ? (dnsResponseValues.reduce((sum, val) => sum + val, 0) / dnsResponseValues.length).toFixed(2)
          : 'N/A';
        
        // Calculate average packet loss
        const packetLossValues = configs
          .map(c => {
            const reliabilityMetric = analysis.iperfAnalysis.reliabilityMetrics.find(m => m.configuration === c.configuration);
            return reliabilityMetric ? reliabilityMetric.packetLossRate * 100 : 0;
          });
        const avgPacketLoss = packetLossValues.length > 0
          ? (packetLossValues.reduce((sum, val) => sum + val, 0) / packetLossValues.length).toFixed(2)
          : 'N/A';
        
        // Calculate average overall score
        const scoreValues = configs.map(c => c.overallScore);
        const avgScore = scoreValues.length > 0
          ? (scoreValues.reduce((sum, val) => sum + val, 0) / scoreValues.length).toFixed(2)
          : 'N/A';
        
        table.push(
          `| ${loggingStatus} | ${avgBandwidth} | ${avgLatency} | ${avgDnsResponse} | ${avgPacketLoss} | ${avgScore} |`
        );
      }
    });

    return table.join("\n");
  }

  /**
   * Generate an anomaly distribution table
   * @param anomalies The performance anomalies
   * @returns The anomaly distribution table as a markdown string
   */
  private generateAnomalyDistributionTable(anomalies: PerformanceAnomaly[]): string {
    // Group anomalies by configuration and type
    const anomalyMap = new Map<string, Map<string, { count: number, severities: string[] }>>();
    
    anomalies.forEach(anomaly => {
      const configName = this.getConfigurationDisplayName(anomaly.configuration);
      
      if (!anomalyMap.has(configName)) {
        anomalyMap.set(configName, new Map());
      }
      
      const configAnomalies = anomalyMap.get(configName)!;
      if (!configAnomalies.has(anomaly.type)) {
        configAnomalies.set(anomaly.type, { count: 0, severities: [] });
      }
      
      const typeAnomalies = configAnomalies.get(anomaly.type)!;
      typeAnomalies.count++;
      typeAnomalies.severities.push(anomaly.severity);
    });
    
    // Create table
    const table = [
      "### Anomaly Distribution",
      "",
      "This table summarizes the distribution of anomalies by type and severity across configurations:",
      "",
      "| Configuration | Bandwidth Anomalies | Latency Anomalies | Packet Loss Anomalies | DNS Anomalies | Total |",
      "|---------------|---------------------|-------------------|----------------------|---------------|-------|",
    ];
    
    // Sort configurations alphabetically
    const sortedConfigs = Array.from(anomalyMap.keys()).sort();
    
    sortedConfigs.forEach(config => {
      const configAnomalies = anomalyMap.get(config) || new Map<string, { count: number, severities: string[] }>();
      
      // Format anomaly counts with severity
      const formatAnomalies = (type: string) => {
        if (!configAnomalies.has(type)) return '0';
        
        const anomalyData = configAnomalies.get(type);
        if (!anomalyData) return '0';
        
        const { count, severities } = anomalyData;
        const severityCounts = {
          high: severities.filter(s => s === 'high').length,
          medium: severities.filter(s => s === 'medium').length,
          low: severities.filter(s => s === 'low').length
        };
        
        const parts = [];
        if (severityCounts.high > 0) parts.push(`${severityCounts.high} (high)`);
        if (severityCounts.medium > 0) parts.push(`${severityCounts.medium} (medium)`);
        if (severityCounts.low > 0) parts.push(`${severityCounts.low} (low)`);
        
        return parts.join(', ');
      };
      
      const bandwidthAnomalies = formatAnomalies('bandwidth');
      const latencyAnomalies = formatAnomalies('latency');
      const packetLossAnomalies = formatAnomalies('packet_loss');
      const dnsAnomalies = formatAnomalies('dns_failure');
      
      // Calculate total anomalies
      const totalAnomalies = Array.from(configAnomalies.values())
        .reduce((sum, anomalyData) => sum + anomalyData.count, 0);
      
      table.push(
        `| ${config} | ${bandwidthAnomalies} | ${latencyAnomalies} | ${packetLossAnomalies} | ${dnsAnomalies} | ${totalAnomalies} |`
      );
    });
    
    return table.join("\n");
  }

  generateDetailedTables(analysis: AnalysisResults): string {
    const sections = [
      "## Detailed Performance Analysis",
      "",
      this.generateBandwidthTable(analysis.iperfAnalysis.bandwidthComparison),
      "",
      this.generateLatencyTable(analysis.iperfAnalysis.latencyAnalysis),
      "",
      this.generateReliabilityTable(analysis.iperfAnalysis.reliabilityMetrics),
      "",
      this.generateCpuUtilizationTable(
        analysis.iperfAnalysis.cpuUtilizationAnalysis
      ),
      "",
      this.generateDnsPerformanceTable(analysis.dnsAnalysis.performanceMetrics),
      "",
      this.generateDomainRankingTable(analysis.dnsAnalysis.domainRankings),
    ];

    return sections.join("\n");
  }

  /**
   * Generate a table for bandwidth metrics
   * @param metrics The bandwidth metrics to tabulate
   * @returns The bandwidth table as a markdown string
   */
  private generateBandwidthTable(metrics: BandwidthMetrics[]): string {
    const table = [
      "### Bandwidth Performance",
      "",
      "The following table shows bandwidth performance metrics across different configurations:",
      "",
      "| Configuration | Avg (Mbps) | Median (Mbps) | Max (Mbps) | Min (Mbps) | Std Dev | 95th % | 99th % |",
      "|--------------|------------|---------------|------------|------------|---------|--------|--------|",
    ];

    metrics.forEach((metric) => {
      table.push(
        `| ${this.getConfigurationDisplayName(metric.configuration)} | ${metric.avgBandwidthMbps.toFixed(
          2
        )} | ${metric.medianBandwidthMbps.toFixed(
          2
        )} | ${metric.maxBandwidthMbps.toFixed(
          2
        )} | ${metric.minBandwidthMbps.toFixed(
          2
        )} | ${metric.standardDeviation.toFixed(
          2
        )} | ${metric.percentile95.toFixed(2)} | ${metric.percentile99.toFixed(
          2
        )} |`
      );
    });

    return table.join("\n");
  }

  /**
   * Generate a table for latency metrics
   * @param metrics The latency metrics to tabulate
   * @returns The latency table as a markdown string
   */
  private generateLatencyTable(metrics: LatencyMetrics[]): string {
    const table = [
      "### Latency Performance",
      "",
      "The following table shows latency performance metrics across different configurations:",
      "",
      "| Configuration | Avg (ms) | Median (ms) | Max (ms) | Min (ms) | Jitter (ms) |",
      "|--------------|----------|-------------|----------|----------|-------------|",
    ];

    metrics.forEach((metric) => {
      table.push(
        `| ${this.getConfigurationDisplayName(metric.configuration)} | ${metric.avgLatencyMs.toFixed(
          2
        )} | ${metric.medianLatencyMs.toFixed(
          2
        )} | ${metric.maxLatencyMs.toFixed(2)} | ${metric.minLatencyMs.toFixed(
          2
        )} | ${metric.jitterMs.toFixed(2)} |`
      );
    });

    return table.join("\n");
  }

  /**
   * Generate a table for reliability metrics
   * @param metrics The reliability metrics to tabulate
   * @returns The reliability table as a markdown string
   */
  private generateReliabilityTable(metrics: ReliabilityMetrics[]): string {
    const table = [
      "### Reliability Metrics",
      "",
      "The following table shows reliability metrics across different configurations:",
      "",
      "| Configuration | Success Rate (%) | Retransmit Rate (%) | Packet Loss (%) | Error Count |",
      "|--------------|------------------|---------------------|-----------------|-------------|",
    ];

    metrics.forEach((metric) => {
      table.push(
        `| ${this.getConfigurationDisplayName(metric.configuration)} | ${(metric.successRate * 100).toFixed(
          2
        )} | ${(metric.retransmitRate * 100).toFixed(2)} | ${(
          metric.packetLossRate * 100
        ).toFixed(2)} | ${metric.errorCount} |`
      );
    });

    return table.join("\n");
  }

  /**
   * Generate a table for CPU utilization metrics
   * @param metrics The CPU metrics to tabulate
   * @returns The CPU utilization table as a markdown string
   */
  private generateCpuUtilizationTable(metrics: CpuMetrics[]): string {
    const table = [
      "### CPU Utilization",
      "",
      "The following table shows CPU utilization metrics across different configurations:",
      "",
      "| Configuration | Avg Host CPU (%) | Avg Remote CPU (%) | Max Host CPU (%) | Max Remote CPU (%) |",
      "|--------------|------------------|-------------------|------------------|-------------------|",
    ];

    metrics.forEach((metric) => {
      table.push(
        `| ${this.getConfigurationDisplayName(metric.configuration)} | ${(metric.avgHostCpuUsage * 100).toFixed(
          2
        )} | ${(metric.avgRemoteCpuUsage * 100).toFixed(2)} | ${(
          metric.maxHostCpuUsage * 100
        ).toFixed(2)} | ${(metric.maxRemoteCpuUsage * 100).toFixed(2)} |`
      );
    });

    return table.join("\n");
  }

  /**
   * Generate a table for DNS performance metrics
   * @param metrics The DNS performance metrics to tabulate
   * @returns The DNS performance table as a markdown string
   */
  private generateDnsPerformanceTable(
    metrics: DnsPerformanceMetrics[]
  ): string {
    const table = [
      "### DNS Performance",
      "",
      "The following table shows DNS performance metrics across different configurations:",
      "",
      "| Configuration | Avg Response Time (ms) | Median Response Time (ms) | Success Rate (%) |",
      "|--------------|------------------------|---------------------------|------------------|",
    ];

    metrics.forEach((metric) => {
      table.push(
        `| ${this.getConfigurationDisplayName(metric.configuration)} | ${metric.avgResponseTimeMs.toFixed(
          2
        )} | ${metric.medianResponseTimeMs.toFixed(2)} | ${(
          metric.successRate * 100
        ).toFixed(2)} |`
      );
    });

    return table.join("\n");
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
      "### Slowest DNS Domains",
      "",
      "The following table shows the 10 slowest domains by average response time:",
      "",
      "| Domain | Avg Response Time (ms) | Success Rate (%) | Query Count |",
      "|--------|------------------------|------------------|-------------|",
    ];

    slowestDomains.forEach((domain) => {
      table.push(
        `| ${domain.domain} | ${domain.avgResponseTimeMs.toFixed(2)} | ${(
          domain.successRate * 100
        ).toFixed(2)} | ${domain.queryCount} |`
      );
    });

    return table.join("\n");
  }

  /**
   * Create textual descriptions of visualizations for the report
   * @param analysis The analysis results to describe
   * @returns The visualization descriptions as a markdown string
   */
  createVisualizationDescriptions(analysis: AnalysisResults): string {
    const { iperfAnalysis, dnsAnalysis, configurationComparison } = analysis;

    const descriptions = [
      "## Performance Visualization Analysis",
      "",
      "### Bandwidth Comparison",
      "",
      this.describeBandwidthVisualization(iperfAnalysis.bandwidthComparison),
      "",
      "### MTU Impact Analysis",
      "",
      this.describeMtuImpact(configurationComparison.mtuImpact),
      "",
      "### DNS Performance Patterns",
      "",
      this.describeDnsPerformance(dnsAnalysis.performanceMetrics),
    ];

    return descriptions.join("\n");
  }

  /**
   * Describe bandwidth visualization insights
   * @param metrics The bandwidth metrics to describe
   * @returns The bandwidth visualization description
   */
  private describeBandwidthVisualization(metrics: BandwidthMetrics[]): string {
    if (!metrics || metrics.length === 0) {
      return "No bandwidth data available for visualization.";
    }

    // Sort configurations by average bandwidth
    const sortedByBandwidth = [...metrics].sort(
      (a, b) => b.avgBandwidthMbps - a.avgBandwidthMbps
    );
    const bestConfig = sortedByBandwidth[0];
    const worstConfig = sortedByBandwidth[sortedByBandwidth.length - 1];

    if (!bestConfig || !worstConfig) {
      return "Insufficient bandwidth data for comparison.";
    }

    const bandwidthDifference =
      bestConfig.avgBandwidthMbps - worstConfig.avgBandwidthMbps;
    const percentageDifference =
      (bandwidthDifference / worstConfig.avgBandwidthMbps) * 100;

    const bestConfigName = this.getConfigurationDisplayName(bestConfig.configuration);
    const worstConfigName = this.getConfigurationDisplayName(worstConfig.configuration);

    return [
      `The bandwidth comparison chart shows that the **${
        bestConfigName
      }** configuration achieves the highest average bandwidth at **${bestConfig.avgBandwidthMbps.toFixed(
        2
      )} Mbps**. This is **${percentageDifference.toFixed(
        2
      )}%** higher than the lowest performing configuration (**${
        worstConfigName
      }** at **${worstConfig.avgBandwidthMbps.toFixed(2)} Mbps**).`,
      "",
      `The 95th percentile bandwidth for the best configuration is **${bestConfig.percentile95.toFixed(
        2
      )} Mbps**, indicating consistent high performance. The standard deviation of **${bestConfig.standardDeviation.toFixed(
        2
      )}** suggests ${
        bestConfig.standardDeviation < 5 ? "stable" : "variable"
      } performance across test runs.`,
    ].join("\n");
  }

  /**
   * Describe MTU impact analysis insights
   * @param mtuAnalysis The MTU analysis to describe
   * @returns The MTU impact description
   */
  private describeMtuImpact(mtuAnalysis: any): string {
    if (!mtuAnalysis) {
      return "No MTU analysis data available.";
    }

    const { optimalMtu, performanceByMtu, recommendations } = mtuAnalysis;

    if (!performanceByMtu || Object.keys(performanceByMtu).length === 0) {
      return `MTU analysis shows that ${
        optimalMtu || "N/A"
      } is the recommended MTU size, but detailed performance data is not available.`;
    }

    // Get MTU sizes and sort them
    const mtuSizes = Object.keys(performanceByMtu)
      .map(Number)
      .sort((a, b) => a - b);

    let description = [
      `Analysis of different MTU sizes shows that **${optimalMtu}** provides the optimal balance of performance metrics. `,
      "",
    ];

    // Add comparison between different MTU sizes
    if (mtuSizes.length > 1) {
      const comparisons = [];

      for (let i = 0; i < mtuSizes.length - 1; i++) {
        const currentMtu = mtuSizes[i];
        const nextMtu = mtuSizes[i + 1];

        if (
          typeof currentMtu === "number" &&
          typeof nextMtu === "number" &&
          performanceByMtu[currentMtu] &&
          performanceByMtu[nextMtu]
        ) {
          const currentPerf = performanceByMtu[currentMtu];
          const nextPerf = performanceByMtu[nextMtu];

          const bandwidthDiff =
            ((nextPerf.avgBandwidth - currentPerf.avgBandwidth) /
              currentPerf.avgBandwidth) *
            100;
          const latencyDiff =
            ((nextPerf.avgLatency - currentPerf.avgLatency) /
              currentPerf.avgLatency) *
            100;

          comparisons.push(
            `Increasing MTU from **${currentMtu}** to **${nextMtu}** resulted in a **${bandwidthDiff.toFixed(
              2
            )}%** change in bandwidth and a **${latencyDiff.toFixed(
              2
            )}%** change in latency.`
          );
        }
      }

      if (comparisons.length > 0) {
        description = description.concat(comparisons);
        description.push("");
      }
    }

    // Add recommendations
    if (recommendations && recommendations.length > 0) {
      description.push("**Recommendations based on MTU analysis:**");
      description.push("");
      recommendations.forEach((rec: string) => {
        description.push(`- ${rec}`);
      });
    }

    return description.join("\n");
  }

  /**
   * Describe DNS performance insights
   * @param metrics The DNS performance metrics to describe
   * @returns The DNS performance description
   */
  private describeDnsPerformance(metrics: DnsPerformanceMetrics[]): string {
    if (!metrics || metrics.length === 0) {
      return "No DNS performance data available for analysis.";
    }

    // Sort configurations by average response time
    const sortedByResponseTime = [...metrics].sort(
      (a, b) => a.avgResponseTimeMs - b.avgResponseTimeMs
    );
    const bestConfig = sortedByResponseTime[0];
    const worstConfig = sortedByResponseTime[sortedByResponseTime.length - 1];

    if (!bestConfig || !worstConfig) {
      return "Insufficient DNS performance data for comparison.";
    }

    const timeDifference =
      worstConfig.avgResponseTimeMs - bestConfig.avgResponseTimeMs;
    const percentageDifference =
      (timeDifference / bestConfig.avgResponseTimeMs) * 100;

    const bestConfigName = this.getConfigurationDisplayName(bestConfig.configuration);
    const worstConfigName = this.getConfigurationDisplayName(worstConfig.configuration);

    return [
      `DNS performance analysis shows that the **${
        bestConfigName
      }** configuration achieves the fastest average response time at **${bestConfig.avgResponseTimeMs.toFixed(
        2
      )} ms**. This is **${percentageDifference.toFixed(
        2
      )}%** faster than the slowest configuration (**${
        worstConfigName
      }** at **${worstConfig.avgResponseTimeMs.toFixed(2)} ms**).`,
      "",
      `The success rate for DNS queries ranges from **${(
        bestConfig.successRate * 100
      ).toFixed(2)}%** to **${(worstConfig.successRate * 100).toFixed(
        2
      )}%** across configurations.`,
      "",
      `Analysis of the slowest domains reveals patterns that may indicate network configuration issues or DNS server performance limitations. The slowest domains consistently show higher response times across all configurations.`,
    ].join("\n");
  }

  /**
   * Generate a section for performance anomalies
   * @param analysis The analysis results
   * @returns The anomalies section as a markdown string
   */
  private generateAnomaliesSection(analysis: AnalysisResults): string {
    const { anomalies } = analysis;

    if (!anomalies || anomalies.length === 0) {
      return "## Performance Anomalies\n\nNo significant performance anomalies were detected in the analyzed datasets.";
    }

    const section = [
      "## Performance Anomalies",
      "",
      "The following performance anomalies were detected during analysis:",
      "",
    ];

    // Group anomalies by severity
    const highSeverity = anomalies.filter((a) => a.severity === "high");
    const mediumSeverity = anomalies.filter((a) => a.severity === "medium");
    const lowSeverity = anomalies.filter((a) => a.severity === "low");

    if (highSeverity.length > 0) {
      section.push("### High Severity Anomalies");
      section.push("");
      highSeverity.forEach((anomaly) => {
        section.push(this.formatAnomalyEntry(anomaly));
      });
    }

    if (mediumSeverity.length > 0) {
      section.push("### Medium Severity Anomalies");
      section.push("");
      mediumSeverity.forEach((anomaly) => {
        section.push(this.formatAnomalyEntry(anomaly));
      });
    }

    if (lowSeverity.length > 0) {
      section.push("### Low Severity Anomalies");
      section.push("");
      lowSeverity.forEach((anomaly) => {
        section.push(this.formatAnomalyEntry(anomaly));
      });
    }

    return section.join("\n");
  }

  /**
   * Format an anomaly entry for the report
   * @param anomaly The anomaly to format
   * @returns The formatted anomaly entry
   */
  private formatAnomalyEntry(anomaly: PerformanceAnomaly): string {
    const entry = [
      `#### ${anomaly.type.toUpperCase()} Anomaly in ${this.getConfigurationDisplayName(anomaly.configuration)}`,
      "",
      `**Description:** ${anomaly.description}`,
      "",
      "**Affected Metrics:**",
    ];

    anomaly.affectedMetrics.forEach((metric) => {
      entry.push(`- ${metric}`);
    });

    entry.push("");
    entry.push("**Recommendations:**");

    anomaly.recommendations.forEach((rec) => {
      entry.push(`- ${rec}`);
    });

    entry.push("");
    return entry.join("\n");
  }

  /**
   * Generate a recommendations section for the report
   * @param analysis The analysis results
   * @returns The recommendations section as a markdown string
   */
  private generateRecommendationsSection(analysis: AnalysisResults): string {
    const { summary } = analysis;

    const section = [
      "## Recommendations",
      "",
      "Based on the comprehensive analysis of network performance across configurations, the following recommendations are provided:",
    ];

    // Add recommendations as bullet points
    summary.recommendations.forEach((recommendation) => {
      section.push(`- ${recommendation}`);
    });

    return section.join("\n");
  }
}

export { ReportGenerator };
