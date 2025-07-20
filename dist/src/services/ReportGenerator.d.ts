import { ReportGenerator, AnalysisResults } from "../models";
/**
 * Default implementation of the ReportGenerator interface
 * Generates comprehensive markdown reports from analysis results
 */
export declare class DefaultReportGenerator implements ReportGenerator {
    protected datasetDisplayNames: Map<string, string>;
    /**
     * Set the dataset display name mapping
     * @param datasets Array of datasets with name and displayName properties
     */
    setDatasetDisplayNames(datasets: {
        name: string;
        displayName?: string;
    }[]): void;
    /**
     * Get the display name for a configuration
     * @param configName The configuration name
     * @returns The display name if available, otherwise the original name
     */
    protected getConfigurationDisplayName(configName: string): string;
    /**
     * Generate a complete markdown report from analysis results
     * @param analysis The analysis results to include in the report
     * @returns A promise that resolves to the generated markdown report
     */
    generateReport(analysis: AnalysisResults): Promise<string>;
    /**
     * Generate the report header with title and date
     * @param analysis The analysis results
     * @returns The header as a markdown string
     */
    private generateReportHeader;
    /**
     * Create an executive summary section for the report
     * @param analysis The analysis results to summarize
     * @returns The executive summary as a markdown string
     */
    createExecutiveSummary(analysis: AnalysisResults): string;
    /**
     * Generate an overview of the configurations analyzed
     * @param analysis The analysis results
     * @returns The configuration overview as a markdown string
     */
    private generateConfigurationOverview;
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
    generateComparisonTables(analysis: AnalysisResults): string;
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
    private prepareTemplateData;
    private generateDnsComparisonTable;
    /**
     * Generate an MTU impact analysis table
     * @param analysis The analysis results
     * @returns The MTU impact table as a markdown string
     */
    private generateMtuImpactTable;
    /**
     * Generate a DNS server implementation comparison table
     * @param analysis The analysis results
     * @returns The DNS server comparison table as a markdown string
     */
    private generateDnsServerComparisonTable;
    /**
     * Generate a logging impact analysis table
     * @param analysis The analysis results
     * @returns The logging impact table as a markdown string
     */
    private generateLoggingImpactTable;
    /**
     * Generate an anomaly distribution table
     * @param anomalies The performance anomalies
     * @returns The anomaly distribution table as a markdown string
     */
    private generateAnomalyDistributionTable;
    generateDetailedTables(analysis: AnalysisResults): string;
    /**
     * Generate a table for bandwidth metrics
     * @param metrics The bandwidth metrics to tabulate
     * @returns The bandwidth table as a markdown string
     */
    private generateBandwidthTable;
    /**
     * Generate a table for latency metrics
     * @param metrics The latency metrics to tabulate
     * @returns The latency table as a markdown string
     */
    private generateLatencyTable;
    /**
     * Generate a table for reliability metrics
     * @param metrics The reliability metrics to tabulate
     * @returns The reliability table as a markdown string
     */
    private generateReliabilityTable;
    /**
     * Generate a table for CPU utilization metrics
     * @param metrics The CPU metrics to tabulate
     * @returns The CPU utilization table as a markdown string
     */
    private generateCpuUtilizationTable;
    /**
     * Generate a table for DNS performance metrics
     * @param metrics The DNS performance metrics to tabulate
     * @returns The DNS performance table as a markdown string
     */
    private generateDnsPerformanceTable;
    /**
     * Generate a table for domain ranking by performance
     * @param domains The domain performance metrics to tabulate
     * @returns The domain ranking table as a markdown string
     */
    private generateDomainRankingTable;
    /**
     * Create textual descriptions of visualizations for the report
     * @param analysis The analysis results to describe
     * @returns The visualization descriptions as a markdown string
     */
    createVisualizationDescriptions(analysis: AnalysisResults): string;
    /**
     * Describe bandwidth visualization insights
     * @param metrics The bandwidth metrics to describe
     * @returns The bandwidth visualization description
     */
    private describeBandwidthVisualization;
    /**
     * Describe MTU impact analysis insights
     * @param mtuAnalysis The MTU analysis to describe
     * @returns The MTU impact description
     */
    private describeMtuImpact;
    /**
     * Describe DNS performance insights
     * @param metrics The DNS performance metrics to describe
     * @returns The DNS performance description
     */
    private describeDnsPerformance;
    /**
     * Generate a section for performance anomalies
     * @param analysis The analysis results
     * @returns The anomalies section as a markdown string
     */
    private generateAnomaliesSection;
    /**
     * Format an anomaly entry for the report
     * @param anomaly The anomaly to format
     * @returns The formatted anomaly entry
     */
    private formatAnomalyEntry;
    /**
     * Generate a recommendations section for the report
     * @param analysis The analysis results
     * @returns The recommendations section as a markdown string
     */
    private generateRecommendationsSection;
    /**
     * Generate advanced analysis tables for detailed performance metrics
     * @param analysis The analysis results
     * @returns The advanced analysis tables as a markdown string
     */
    private generateAdvancedAnalysisTables;
    /**
     * Generate a detailed bandwidth analysis table
     * @param metrics The bandwidth metrics to analyze
     * @returns The detailed bandwidth analysis as a markdown string
     */
    private generateDetailedBandwidthAnalysis;
    /**
     * Generate a jitter analysis table
     * @param metrics The latency metrics to analyze
     * @returns The jitter analysis as a markdown string
     */
    private generateJitterAnalysis;
    /**
     * Generate a retransmission analysis table
     * @param metrics The reliability metrics to analyze
     * @returns The retransmission analysis as a markdown string
     */
    private generateRetransmissionAnalysis;
    /**
     * Generate a performance correlation matrix
     * @param analysis The analysis results
     * @returns The performance correlation matrix as a markdown string
     */
    private generatePerformanceCorrelationMatrix;
}
export { ReportGenerator };
//# sourceMappingURL=ReportGenerator.d.ts.map