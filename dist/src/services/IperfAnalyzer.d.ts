import { Dataset, BandwidthMetrics, LatencyMetrics, ReliabilityMetrics, CpuMetrics } from '../models';
/**
 * IperfAnalyzer class for processing iperf3 performance metrics
 * Analyzes bandwidth, latency, reliability, and CPU utilization across datasets
 */
export declare class IperfAnalyzer {
    private errorHandler;
    /**
     * Creates a new instance of IperfAnalyzer
     */
    constructor();
    /**
     * Analyze bandwidth metrics across datasets
     * @param datasets The datasets containing iperf test results
     * @returns Array of bandwidth metrics for each configuration
     */
    analyzeBandwidth(datasets: Dataset[]): BandwidthMetrics[];
    /**
     * Analyze latency metrics across datasets
     * @param datasets The datasets containing iperf test results
     * @returns Array of latency metrics for each configuration
     */
    analyzeLatency(datasets: Dataset[]): LatencyMetrics[];
    /**
     * Analyze reliability metrics across datasets
     * @param datasets The datasets containing iperf test results
     * @returns Array of reliability metrics for each configuration
     */
    analyzeReliability(datasets: Dataset[]): ReliabilityMetrics[];
    /**
     * Analyze CPU utilization metrics across datasets
     * @param datasets The datasets containing iperf test results
     * @returns Array of CPU utilization metrics for each configuration
     */
    analyzeCpuUtilization(datasets: Dataset[]): CpuMetrics[];
    /**
     * Get all iperf tests from a dataset
     * @param dataset The dataset to extract tests from
     * @returns Array of iperf test results
     */
    private getAllIperfTests;
    /**
     * Get successful iperf tests from a dataset, optionally filtered by scenario type
     * @param dataset The dataset to extract tests from
     * @param scenarioFilter Optional scenario type filter (e.g., 'TCP', 'UDP')
     * @returns Array of successful iperf test results
     */
    private getSuccessfulIperfTests;
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
    /**
     * Calculate the maximum value in an array of numbers
     * @param values Array of numbers
     * @returns The maximum value, or 0 if the array is empty
     */
    private calculateMax;
    /**
     * Calculate the minimum value in an array of numbers
     * @param values Array of numbers
     * @returns The minimum value, or 0 if the array is empty
     */
    private calculateMin;
    /**
     * Calculate the standard deviation of an array of numbers
     * @param values Array of numbers
     * @returns The standard deviation, or 0 if the array is empty
     */
    private calculateStandardDeviation;
    /**
     * Calculate a percentile value from an array of numbers
     * @param values Array of numbers
     * @param percentile The percentile to calculate (0-100)
     * @returns The percentile value, or 0 if the array is empty
     */
    private calculatePercentile;
}
//# sourceMappingURL=IperfAnalyzer.d.ts.map