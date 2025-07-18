import { Dataset, PerformanceAnomaly, TestResults } from '../models';
/**
 * Interface for anomaly detection configuration
 */
export interface AnomalyDetectionConfig {
    bandwidthDeviationThreshold: number;
    bandwidthMinimumThreshold: number;
    latencyDeviationThreshold: number;
    latencyMaximumThreshold: number;
    packetLossThreshold: number;
    retransmitRateThreshold: number;
    dnsResponseTimeThreshold: number;
    dnsSuccessRateThreshold: number;
    severityLevels: {
        low: number;
        medium: number;
        high: number;
    };
}
/**
 * AnomalyDetector class for detecting performance anomalies in network test data
 */
export declare class AnomalyDetector {
    private config;
    /**
     * Creates a new instance of AnomalyDetector
     * @param config Optional custom configuration for anomaly detection thresholds
     */
    constructor(config?: Partial<AnomalyDetectionConfig>);
    /**
     * Detect anomalies across multiple datasets
     * @param datasets The datasets to analyze for anomalies
     * @returns Array of detected performance anomalies
     */
    detectAnomalies(datasets: (Dataset & {
        results?: TestResults;
    })[]): PerformanceAnomaly[];
    /**
     * Detect bandwidth-related anomalies
     * @param datasets The datasets to analyze
     * @returns Array of bandwidth-related anomalies
     */
    private detectBandwidthAnomalies;
    /**
     * Detect latency-related anomalies
     * @param datasets The datasets to analyze
     * @returns Array of latency-related anomalies
     */
    private detectLatencyAnomalies;
    /**
     * Detect packet loss and retransmission anomalies
     * @param datasets The datasets to analyze
     * @returns Array of packet loss-related anomalies
     */
    private detectPacketLossAnomalies;
    /**
     * Detect DNS-related anomalies
     * @param datasets The datasets to analyze
     * @returns Array of DNS-related anomalies
     */
    private detectDnsAnomalies;
    /**
     * Generate a descriptive name for a configuration
     * @param configName The configuration name
     * @returns A descriptive name
     */
    private getDescriptiveConfigName;
    /**
     * Determine the severity level based on the ratio to threshold
     * @param ratio The ratio of the value to the threshold
     * @returns The severity level as 'low', 'medium', or 'high'
     */
    private determineSeverity;
    /**
     * Calculate the mean (average) of an array of numbers
     * @param values Array of numbers
     * @returns The mean value
     */
    private calculateMean;
    /**
     * Calculate the standard deviation of an array of numbers
     * @param values Array of numbers
     * @param mean The mean value (optional, will be calculated if not provided)
     * @returns The standard deviation
     */
    private calculateStandardDeviation;
}
//# sourceMappingURL=AnomalyDetector.d.ts.map