import { DatasetDiscoveryService, DataParser, AnalysisEngine, ReportGenerator, ErrorHandler } from "../models";
/**
 * Configuration options for the NetworkPerformanceAnalyzer
 */
export interface AnalyzerConfig {
    /**
     * Whether to continue analysis when a dataset fails to parse
     * @default true
     */
    continueOnError?: boolean | undefined;
    /**
     * Whether to log progress information during analysis
     * @default true
     */
    logProgress?: boolean | undefined;
    /**
     * Path to save the generated report
     * If not provided, the report will only be returned as a string
     */
    reportOutputPath?: string | undefined;
    /**
     * Custom thresholds for anomaly detection
     */
    anomalyThresholds?: {
        bandwidthVariation?: number | undefined;
        latencyVariation?: number | undefined;
        packetLossThreshold?: number | undefined;
        dnsResponseTimeVariation?: number | undefined;
        cpuUtilizationThreshold?: number | undefined;
    } | undefined;
    /**
     * Whether to use parallel processing for dataset analysis
     * @default true
     */
    useParallelProcessing?: boolean | undefined;
    /**
     * Maximum number of parallel tasks to run
     * @default 4
     */
    maxParallelTasks?: number | undefined;
    /**
     * Whether to enable performance monitoring
     * @default false
     */
    enablePerformanceMonitoring?: boolean | undefined;
    /**
     * Maximum memory usage percentage before triggering garbage collection
     * @default 80
     */
    memoryThresholdPercent?: number | undefined;
    /**
     * Path to configuration file
     * If provided, configuration will be loaded from this file
     */
    configPath?: string | undefined;
    /**
     * Environment to use for configuration
     * @default 'development'
     */
    environment?: string | undefined;
    /**
     * Paths to plugin directories
     */
    pluginDirectories?: string[] | undefined;
    /**
     * Report template ID to use
     * @default 'default'
     */
    reportTemplateId?: string | undefined;
    /**
     * Report sections to include
     */
    includeSections?: string[] | undefined;
}
export declare class NetworkPerformanceAnalyzer {
    private discoveryService;
    private dataParser;
    private analysisEngine;
    private reportGenerator;
    private errorHandler;
    private config;
    private performanceMonitor;
    private pluginManager?;
    /**
     * Create a new NetworkPerformanceAnalyzer instance
     * @param discoveryService Service for discovering datasets
     * @param dataParser Service for parsing dataset files
     * @param analysisEngine Service for analyzing performance data
     * @param reportGenerator Service for generating reports
     * @param errorHandler Service for handling errors
     * @param config Configuration options for the analyzer
     */
    constructor(discoveryService: DatasetDiscoveryService, dataParser: DataParser, analysisEngine: AnalysisEngine, reportGenerator: ReportGenerator, errorHandler: ErrorHandler, config?: AnalyzerConfig);
    /**
     * Initialize performance monitoring
     */
    private initializePerformanceMonitoring;
    /**
     * Run the complete analysis workflow
     * @param rootPath Path to the directory containing dataset directories
     * @returns A promise that resolves to the generated report
     */
    analyze(rootPath: string): Promise<string>;
    /**
     * Generate a report for when no datasets are available
     * @returns A simple markdown report indicating no datasets were found
     * @private
     */
    private generateEmptyReport;
    /**
     * Generate a report for when an error occurs during analysis
     * @param errorMessage The error message to include in the report
     * @returns A simple markdown report with the error information
     * @private
     */
    private generateErrorReport;
    /**
     * Discover datasets in the given root path
     * @param rootPath Path to the directory containing dataset directories
     * @returns A promise that resolves to an array of discovered datasets
     * @private
     */
    private discoverDatasets;
    /**
     * Parse dataset files for all discovered datasets
     * @param datasets The datasets to parse files for
     * @returns A promise that resolves to an array of datasets with parsed results
     * @private
     */
    private parseDatasetFiles;
    /**
     * Perform analysis on the parsed datasets
     * @param datasets The datasets to analyze
     * @returns A promise that resolves to the analysis results
     * @private
     */
    private performAnalysis;
    /**
     * Create an executive summary from the analysis results
     * @param datasets The analyzed datasets
     * @param iperfAnalysis The iperf performance analysis
     * @param dnsAnalysis The DNS performance analysis
     * @param configurationComparison The configuration comparison
     * @param anomalies The detected anomalies
     * @returns The executive summary
     * @private
     */
    private createExecutiveSummary;
    /**
     * Save the generated report to a file
     * @param report The report content to save
     * @param outputPath The path to save the report to
     * @returns A promise that resolves when the report is saved
     * @private
     */
    private saveReport;
    /**
     * Log progress information if enabled
     * @param message The progress message to log
     * @private
     */
    private logProgress;
}
/**
 * Factory function to create a new NetworkPerformanceAnalyzer instance with configuration and plugin support
 * @param config Configuration options for the analyzer
 * @returns A new NetworkPerformanceAnalyzer instance
 */
export declare function createNetworkPerformanceAnalyzer(config?: AnalyzerConfig): NetworkPerformanceAnalyzer;
//# sourceMappingURL=NetworkPerformanceAnalyzer.d.ts.map