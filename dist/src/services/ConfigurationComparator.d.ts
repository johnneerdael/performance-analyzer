import { Dataset, ConfigurationComparison, MtuAnalysis, LoggingAnalysis, ConfigurationRanking } from '../models';
/**
 * ConfigurationComparator class for analyzing performance differences between configurations
 * Compares MTU settings, DNS query logging impact, and ranks configurations by performance
 */
export declare class ConfigurationComparator {
    private errorHandler;
    private iperfAnalyzer;
    private dnsAnalyzer;
    /**
     * Creates a new instance of ConfigurationComparator
     */
    constructor();
    /**
     * Compare different network configurations based on performance metrics
     * @param datasets The datasets representing different network configurations
     * @returns Configuration comparison analysis
     */
    compareConfigurations(datasets: Dataset[]): ConfigurationComparison;
    /**
     * Analyze the impact of different MTU settings on performance
     * @param datasets The datasets with different MTU configurations
     * @returns MTU impact analysis
     */
    analyzeMtuImpact(datasets: Dataset[]): MtuAnalysis;
    /**
     * Analyze the impact of DNS query logging on performance
     * @param datasets The datasets with different DNS query logging configurations
     * @returns DNS query logging impact analysis
     */
    analyzeLoggingImpact(datasets: Dataset[]): LoggingAnalysis;
    /**
     * Rank configurations based on overall performance
     * @param datasets The datasets representing different configurations
     * @returns Array of configuration rankings
     */
    rankConfigurations(datasets: Dataset[]): ConfigurationRanking[];
    /**
     * Analyze performance trends across configurations
     * @param datasets The datasets to analyze for trends
     * @returns Object containing trend analysis
     */
    analyzePerformanceTrends(datasets: Dataset[]): Record<string, any>;
    /**
     * Group datasets by MTU setting
     * @param datasets The datasets to group
     * @returns Object with MTU values as keys and arrays of datasets as values
     */
    private groupDatasetsByMtu;
    /**
     * Group datasets by backend server
     * @param datasets The datasets to group
     * @returns Object with server names as keys and arrays of datasets as values
     */
    private groupDatasetsByServer;
    /**
     * Group datasets by DNS query logging status
     * @param datasets The datasets to group
     * @returns Object with logging status as keys and arrays of datasets as values
     */
    private groupDatasetsByLogging;
    /**
     * Analyze performance trends for a group of datasets
     * @param groupedDatasets The grouped datasets to analyze
     * @param groupType The type of grouping (e.g., 'MTU', 'Server', 'Logging')
     * @returns Object containing trend analysis for the group
     */
    private analyzeTrendsByGroup;
    /**
     * Calculate the average of a specific metric across an array of objects
     * @param metrics Array of objects containing the metric
     * @param metricKey The key of the metric to average
     * @returns The average value of the metric
     */
    private calculateAverageMetric;
    /**
     * Generate recommendations based on MTU analysis
     * @param performanceByMtu Performance metrics for each MTU
     * @param optimalMtu The optimal MTU value
     * @returns Array of recommendation strings
     */
    private generateMtuRecommendations;
    /**
     * Generate recommendations based on DNS query logging impact analysis
     * @param performanceImpact Overall performance impact percentage
     * @param bandwidthDifference Bandwidth difference between logging disabled and enabled
     * @param latencyDifference Latency difference between logging enabled and disabled
     * @returns Array of recommendation strings
     */
    private generateLoggingRecommendations;
}
//# sourceMappingURL=ConfigurationComparator.d.ts.map