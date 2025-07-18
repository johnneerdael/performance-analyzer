"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultAnalysisEngine = void 0;
const IperfAnalyzer_1 = require("./IperfAnalyzer");
const DnsAnalyzer_1 = require("./DnsAnalyzer");
const ConfigurationComparator_1 = require("./ConfigurationComparator");
const AnomalyDetector_1 = require("./AnomalyDetector");
const ErrorHandler_1 = require("../utils/ErrorHandler");
const DataParser_1 = require("./DataParser");
const fs_extra_1 = __importDefault(require("fs-extra"));
/**
 * Default implementation of the AnalysisEngine interface
 * Performs statistical analysis and comparative calculations on network performance data
 */
class DefaultAnalysisEngine {
    /**
     * Creates a new instance of DefaultAnalysisEngine
     */
    constructor() {
        this.iperfAnalyzer = new IperfAnalyzer_1.IperfAnalyzer();
        this.dnsAnalyzer = new DnsAnalyzer_1.DnsAnalyzer();
        this.configurationComparator = new ConfigurationComparator_1.ConfigurationComparator();
        this.anomalyDetector = new AnomalyDetector_1.AnomalyDetector();
        this.errorHandler = new ErrorHandler_1.DefaultErrorHandler();
        this.dataParser = new DataParser_1.DefaultDataParser();
    }
    /**
     * Analyze iperf3 performance data across multiple datasets
     * @param datasets The datasets containing iperf3 test results
     * @returns A promise that resolves to the iperf3 performance analysis
     */
    async analyzeIperfPerformance(datasets) {
        try {
            // Load test results for each dataset
            const datasetsWithResults = await this.loadTestResults(datasets);
            // Analyze bandwidth metrics
            const bandwidthComparison = this.iperfAnalyzer.analyzeBandwidth(datasetsWithResults);
            // Analyze latency metrics
            const latencyAnalysis = this.iperfAnalyzer.analyzeLatency(datasetsWithResults);
            // Analyze reliability metrics
            const reliabilityMetrics = this.iperfAnalyzer.analyzeReliability(datasetsWithResults);
            // Analyze CPU utilization
            const cpuUtilizationAnalysis = this.iperfAnalyzer.analyzeCpuUtilization(datasetsWithResults);
            return {
                bandwidthComparison,
                latencyAnalysis,
                reliabilityMetrics,
                cpuUtilizationAnalysis
            };
        }
        catch (error) {
            const analysisError = new Error(error instanceof Error ? error.message : String(error));
            analysisError.analysisType = 'iperf_performance';
            this.errorHandler.handleAnalysisError(analysisError);
            // Return empty analysis in case of error
            return {
                bandwidthComparison: [],
                latencyAnalysis: [],
                reliabilityMetrics: [],
                cpuUtilizationAnalysis: []
            };
        }
    }
    /**
     * Analyze DNS performance data across multiple datasets
     * @param datasets The datasets containing DNS test results
     * @returns A promise that resolves to the DNS performance analysis
     */
    async analyzeDnsPerformance(datasets) {
        try {
            // Load test results for each dataset
            const datasetsWithResults = await this.loadTestResults(datasets);
            // Use the DnsAnalyzer to analyze DNS performance
            return this.dnsAnalyzer.analyzeDnsPerformance(datasetsWithResults);
        }
        catch (error) {
            const analysisError = new Error(error instanceof Error ? error.message : String(error));
            analysisError.analysisType = 'dns_performance';
            this.errorHandler.handleAnalysisError(analysisError);
            // Return empty analysis in case of error
            return {
                performanceMetrics: [],
                domainRankings: [],
                serverComparison: []
            };
        }
    }
    /**
     * Compare different network configurations based on performance metrics
     * @param datasets The datasets representing different network configurations
     * @returns A promise that resolves to the configuration comparison analysis
     */
    async compareConfigurations(datasets) {
        try {
            // Load test results for each dataset
            const datasetsWithResults = await this.loadTestResults(datasets);
            // Use the ConfigurationComparator to compare configurations
            return this.configurationComparator.compareConfigurations(datasetsWithResults);
        }
        catch (error) {
            const analysisError = new Error(error instanceof Error ? error.message : String(error));
            analysisError.analysisType = 'configuration_comparison';
            this.errorHandler.handleAnalysisError(analysisError);
            // Return empty analysis in case of error
            return {
                mtuImpact: {
                    optimalMtu: 0,
                    performanceByMtu: {},
                    recommendations: []
                },
                loggingImpact: {
                    performanceImpact: 0,
                    bandwidthDifference: 0,
                    latencyDifference: 0,
                    recommendations: []
                },
                overallRanking: []
            };
        }
    }
    /**
     * Detect performance anomalies across datasets
     * @param datasets The datasets to analyze for anomalies
     * @returns A promise that resolves to an array of detected performance anomalies
     */
    async detectAnomalies(datasets) {
        try {
            // Load test results for each dataset
            const datasetsWithResults = await this.loadTestResults(datasets);
            // Use the AnomalyDetector to detect anomalies
            return this.anomalyDetector.detectAnomalies(datasetsWithResults);
        }
        catch (error) {
            const analysisError = new Error(error instanceof Error ? error.message : String(error));
            analysisError.analysisType = 'anomaly_detection';
            this.errorHandler.handleAnalysisError(analysisError);
            // Return empty array in case of error
            return [];
        }
    }
    /**
     * Load test results for each dataset
     * @param datasets The datasets to load results for
     * @returns A promise that resolves to datasets with loaded results
     */
    async loadTestResults(datasets) {
        const datasetsWithResults = [];
        for (const dataset of datasets) {
            try {
                if (dataset.resultsFile && await fs_extra_1.default.pathExists(dataset.resultsFile)) {
                    const results = await this.dataParser.parseResults(dataset.resultsFile);
                    // Add results to dataset
                    datasetsWithResults.push({
                        ...dataset,
                        results
                    });
                }
                else {
                    console.warn(`Results file not found for dataset: ${dataset.name}`);
                    datasetsWithResults.push(dataset);
                }
            }
            catch (error) {
                console.error(`Error loading results for dataset ${dataset.name}:`, error);
                datasetsWithResults.push(dataset);
            }
        }
        return datasetsWithResults;
    }
}
exports.DefaultAnalysisEngine = DefaultAnalysisEngine;
//# sourceMappingURL=AnalysisEngine.js.map