import { AnalysisEngine, Dataset, IperfAnalysis, DnsAnalysis, ConfigurationComparison, PerformanceAnomaly } from '../models';
/**
 * Default implementation of the AnalysisEngine interface
 * Performs statistical analysis and comparative calculations on network performance data
 */
export declare class DefaultAnalysisEngine implements AnalysisEngine {
    private iperfAnalyzer;
    private dnsAnalyzer;
    private configurationComparator;
    private anomalyDetector;
    private errorHandler;
    private dataParser;
    /**
     * Creates a new instance of DefaultAnalysisEngine
     */
    constructor();
    /**
     * Analyze iperf3 performance data across multiple datasets
     * @param datasets The datasets containing iperf3 test results
     * @returns A promise that resolves to the iperf3 performance analysis
     */
    analyzeIperfPerformance(datasets: Dataset[]): Promise<IperfAnalysis>;
    /**
     * Analyze DNS performance data across multiple datasets
     * @param datasets The datasets containing DNS test results
     * @returns A promise that resolves to the DNS performance analysis
     */
    analyzeDnsPerformance(datasets: Dataset[]): Promise<DnsAnalysis>;
    /**
     * Compare different network configurations based on performance metrics
     * @param datasets The datasets representing different network configurations
     * @returns A promise that resolves to the configuration comparison analysis
     */
    compareConfigurations(datasets: Dataset[]): Promise<ConfigurationComparison>;
    /**
     * Detect performance anomalies across datasets
     * @param datasets The datasets to analyze for anomalies
     * @returns A promise that resolves to an array of detected performance anomalies
     */
    detectAnomalies(datasets: Dataset[]): Promise<PerformanceAnomaly[]>;
    /**
     * Load test results for each dataset
     * @param datasets The datasets to load results for
     * @returns A promise that resolves to datasets with loaded results
     */
    private loadTestResults;
}
export { AnalysisEngine };
//# sourceMappingURL=AnalysisEngine.d.ts.map