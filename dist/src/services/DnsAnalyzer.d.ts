import { Dataset, DnsPerformanceMetrics, DomainPerformance, DnsServerComparison, DnsAnalysis } from '../models';
/**
 * DnsAnalyzer class for processing DNS resolution performance metrics
 * Analyzes response times, success rates, and domain performance across datasets
 */
export declare class DnsAnalyzer {
    private errorHandler;
    /**
     * Creates a new instance of DnsAnalyzer
     */
    constructor();
    /**
     * Analyze DNS performance metrics across datasets
     * @param datasets The datasets containing DNS test results
     * @returns DNS performance analysis results
     */
    analyzeDnsPerformance(datasets: Dataset[]): DnsAnalysis;
    /**
     * Calculate DNS performance metrics for each configuration
     * @param datasets The datasets containing DNS test results
     * @returns Array of DNS performance metrics for each configuration
     */
    calculatePerformanceMetrics(datasets: Dataset[]): DnsPerformanceMetrics[];
    /**
     * Calculate domain performance rankings across all datasets
     * @param datasets The datasets containing DNS test results
     * @returns Array of domain performance metrics sorted by average response time
     */
    calculateDomainRankings(datasets: Dataset[]): DomainPerformance[];
    /**
     * Calculate DNS server comparison metrics across all datasets
     * @param datasets The datasets containing DNS test results
     * @returns Array of DNS server comparison metrics
     */
    calculateServerComparison(datasets: Dataset[]): DnsServerComparison[];
    /**
     * Calculate domain performance metrics for a single dataset
     * @param dataset The dataset containing DNS test results
     * @returns Array of domain performance metrics
     */
    private calculateDomainPerformanceForDataset;
    /**
     * Analyze DNS failure patterns across datasets
     * @param datasets The datasets containing DNS test results
     * @returns Object containing failure pattern analysis
     */
    analyzeFailurePatterns(datasets: Dataset[]): Record<string, number>;
    /**
     * Normalize error message to create a pattern
     * @param errorMessage The error message to normalize
     * @returns Normalized error pattern
     */
    private normalizeErrorMessage;
    /**
     * Get DNS test results from a dataset
     * @param dataset The dataset to extract DNS results from
     * @returns Array of DNS test results
     */
    private getDnsResults;
    /**
     * Calculate the mean of an array of numbers
     * @param values Array of numbers
     * @returns The mean value, or 0 if the array is empty
     */
    private calculateMean;
    /**
     * Calculate the median of an array of numbers
     * @param values Array of numbers
     * @returns The median value, or 0 if the array is empty
     */
    private calculateMedian;
}
//# sourceMappingURL=DnsAnalyzer.d.ts.map