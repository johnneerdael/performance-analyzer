import { ReportGenerator, AnalysisResults } from "../models";
/**
 * Default implementation of the ReportGenerator interface
 * Generates comprehensive markdown reports from analysis results
 */
export declare class DefaultReportGenerator implements ReportGenerator {
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
}
export { ReportGenerator };
//# sourceMappingURL=ReportGenerator.d.ts.map