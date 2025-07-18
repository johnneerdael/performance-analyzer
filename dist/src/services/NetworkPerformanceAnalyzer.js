"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkPerformanceAnalyzer = void 0;
exports.createNetworkPerformanceAnalyzer = createNetworkPerformanceAnalyzer;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const DatasetDiscoveryService_1 = require("./DatasetDiscoveryService");
const DataParser_1 = require("./DataParser");
const AnalysisEngine_1 = require("./AnalysisEngine");
const ReportGenerator_1 = require("./ReportGenerator");
const ErrorHandler_1 = require("../utils/ErrorHandler");
const ConfigurationManager_1 = require("../config/ConfigurationManager");
const PluginManager_1 = require("../plugins/PluginManager");
const ReportTemplateManager_1 = require("./ReportTemplateManager");
/**
 * Main orchestrator class for the Network Performance Analyzer
 * Coordinates the end-to-end workflow from dataset discovery to report generation
 */
const PerformanceMonitor_1 = require("../utils/PerformanceMonitor");
class NetworkPerformanceAnalyzer {
    /**
     * Create a new NetworkPerformanceAnalyzer instance
     * @param discoveryService Service for discovering datasets
     * @param dataParser Service for parsing dataset files
     * @param analysisEngine Service for analyzing performance data
     * @param reportGenerator Service for generating reports
     * @param errorHandler Service for handling errors
     * @param config Configuration options for the analyzer
     */
    constructor(discoveryService, dataParser, analysisEngine, reportGenerator, errorHandler, config = {}) {
        this.performanceMonitor = null;
        this.discoveryService = discoveryService;
        this.dataParser = dataParser;
        this.analysisEngine = analysisEngine;
        this.reportGenerator = reportGenerator;
        this.errorHandler = errorHandler;
        // Set default configuration values
        this.config = {
            continueOnError: config.continueOnError !== undefined ? config.continueOnError : true,
            logProgress: config.logProgress !== undefined ? config.logProgress : true,
            reportOutputPath: config.reportOutputPath,
            anomalyThresholds: config.anomalyThresholds
                ? { ...config.anomalyThresholds }
                : {},
            useParallelProcessing: config.useParallelProcessing !== undefined
                ? config.useParallelProcessing
                : true,
            maxParallelTasks: config.maxParallelTasks || 4,
            enablePerformanceMonitoring: config.enablePerformanceMonitoring !== undefined
                ? config.enablePerformanceMonitoring
                : false,
            memoryThresholdPercent: config.memoryThresholdPercent || 80,
            configPath: config.configPath,
            environment: config.environment || "development",
            pluginDirectories: config.pluginDirectories || [],
            reportTemplateId: config.reportTemplateId || "default",
            includeSections: config.includeSections || [],
        };
        // Initialize performance monitoring if enabled
        if (this.config.enablePerformanceMonitoring) {
            this.initializePerformanceMonitoring();
        }
    }
    /**
     * Initialize performance monitoring
     */
    initializePerformanceMonitoring() {
        this.performanceMonitor = new PerformanceMonitor_1.PerformanceMonitor({
            monitoringInterval: 5000,
            memoryThresholdPercent: this.config.memoryThresholdPercent || 80,
            ...(this.config.logProgress !== undefined
                ? { logToConsole: this.config.logProgress }
                : {}),
        });
        // Set up event listeners
        this.performanceMonitor.on("memory-threshold-exceeded", (data) => {
            this.logProgress(`Memory threshold exceeded: ${data.current.toFixed(1)}% > ${data.threshold}%`);
        });
        // Start monitoring
        this.performanceMonitor.start();
    }
    /**
     * Run the complete analysis workflow
     * @param rootPath Path to the directory containing dataset directories
     * @returns A promise that resolves to the generated report
     */
    async analyze(rootPath) {
        try {
            this.logProgress(`Starting analysis of datasets in ${rootPath}`);
            // Step 1: Discover datasets
            this.logProgress("Discovering datasets...");
            const datasets = await this.discoverDatasets(rootPath);
            if (datasets.length === 0) {
                const error = new Error(`No valid datasets found in ${rootPath}`);
                this.errorHandler.logError(error, "Dataset discovery failed");
                if (this.config.continueOnError) {
                    this.logProgress("Continuing with empty dataset list due to continueOnError=true");
                    return this.generateEmptyReport();
                }
                throw error;
            }
            this.logProgress(`Found ${datasets.length} datasets for analysis`);
            // Step 2: Load and parse dataset files
            this.logProgress("Loading and parsing dataset files...");
            const parsedDatasets = await this.parseDatasetFiles(datasets);
            if (parsedDatasets.length === 0) {
                const error = new Error("No datasets could be successfully parsed");
                this.errorHandler.logError(error, "Dataset parsing failed");
                if (this.config.continueOnError) {
                    this.logProgress("Continuing with empty dataset list due to continueOnError=true");
                    return this.generateEmptyReport();
                }
                throw error;
            }
            this.logProgress(`Successfully parsed ${parsedDatasets.length} datasets`);
            // Step 3: Perform analysis
            this.logProgress("Performing analysis...");
            const analysisResults = await this.performAnalysis(parsedDatasets);
            // Step 4: Generate report
            this.logProgress("Generating report...");
            const report = await this.reportGenerator.generateReport(analysisResults);
            // Step 5: Save report if output path is provided
            if (this.config.reportOutputPath) {
                await this.saveReport(report, this.config.reportOutputPath);
                this.logProgress(`Report saved to ${this.config.reportOutputPath}`);
            }
            this.logProgress("Analysis completed successfully");
            return report;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.errorHandler.logError(error instanceof Error ? error : new Error(errorMessage), "Error during analysis workflow");
            // If configured to continue on error, return an error report
            if (this.config.continueOnError) {
                this.logProgress("Generating error report due to continueOnError=true");
                return this.generateErrorReport(errorMessage);
            }
            throw error;
        }
    }
    /**
     * Generate a report for when no datasets are available
     * @returns A simple markdown report indicating no datasets were found
     * @private
     */
    generateEmptyReport() {
        return `# Network Performance Analysis Report

## Error: No Valid Datasets

No valid datasets were found or could be successfully parsed. Please check the following:

1. Ensure the dataset directories follow the naming pattern: \`(coredns|stock)-mtu\\d+-aws-logs_(enabled|disabled)\`
2. Verify that each dataset directory contains either:
   - A parameters file named \`parameters-results_*.json\`
   - A results file named \`results_*.json\`
3. Check the error log for specific parsing or validation errors

## Troubleshooting

- Verify file permissions and accessibility
- Ensure JSON files are properly formatted
- Check for missing required fields in the dataset files
- Review the application logs for detailed error information

*Report generated on ${new Date().toISOString()}*
`;
    }
    /**
     * Generate a report for when an error occurs during analysis
     * @param errorMessage The error message to include in the report
     * @returns A simple markdown report with the error information
     * @private
     */
    generateErrorReport(errorMessage) {
        return `# Network Performance Analysis Report

## Error During Analysis

An error occurred during the analysis process:

\`\`\`
${errorMessage}
\`\`\`

### Partial Results

The analysis could not be completed successfully. Any partial results may be incomplete or inaccurate.

## Troubleshooting

- Check the error log for detailed information about the failure
- Verify that all dataset files contain valid and complete data
- Ensure sufficient system resources are available for analysis
- Try running the analysis with a smaller subset of datasets

*Report generated on ${new Date().toISOString()}*
`;
    }
    /**
     * Discover datasets in the given root path
     * @param rootPath Path to the directory containing dataset directories
     * @returns A promise that resolves to an array of discovered datasets
     * @private
     */
    async discoverDatasets(rootPath) {
        try {
            // Use the discovery service to find datasets
            const datasets = await this.discoveryService.discoverDatasets(rootPath);
            // Log information about each dataset
            datasets.forEach((dataset) => {
                this.logProgress(`Found dataset: ${dataset.name} (MTU: ${dataset.configuration.mtu}, AWS Logging: ${dataset.configuration.awsLogging ? "enabled" : "disabled"})`);
            });
            return datasets;
        }
        catch (error) {
            this.errorHandler.logError(error, "Error discovering datasets");
            // If configured to continue on error, return empty array
            if (this.config.continueOnError) {
                return [];
            }
            throw error;
        }
    }
    /**
     * Parse dataset files for all discovered datasets
     * @param datasets The datasets to parse files for
     * @returns A promise that resolves to an array of datasets with parsed results
     * @private
     */
    async parseDatasetFiles(datasets) {
        // Start performance monitoring for this operation
        if (this.performanceMonitor) {
            this.performanceMonitor.startOperation("parseDatasetFiles");
        }
        try {
            const parsedDatasets = [];
            // Use parallel processing if enabled
            if (this.config.useParallelProcessing && datasets.length > 1) {
                this.logProgress(`Using parallel processing for ${datasets.length} datasets (max ${this.config.maxParallelTasks} concurrent tasks)`);
                // Process datasets in batches to limit concurrency
                const batches = [];
                const batchSize = Math.min(this.config.maxParallelTasks || 4, datasets.length);
                // Create batches of datasets
                for (let i = 0; i < datasets.length; i += batchSize) {
                    batches.push(datasets.slice(i, i + batchSize));
                }
                // Process each batch in parallel
                for (const batch of batches) {
                    // Create parsing promises for all datasets in the batch
                    const parsingPromises = batch.map(async (dataset) => {
                        try {
                            this.logProgress(`Parsing dataset: ${dataset.name}`);
                            // Parse parameters file if it exists
                            let parameters = null;
                            if (dataset.parametersFile &&
                                (await fs_extra_1.default.pathExists(dataset.parametersFile))) {
                                this.logProgress(`Parsing parameters file: ${path_1.default.basename(dataset.parametersFile)}`);
                                parameters = await this.dataParser.parseParameters(dataset.parametersFile);
                            }
                            // Parse results file if it exists
                            let results = null;
                            if (dataset.resultsFile &&
                                (await fs_extra_1.default.pathExists(dataset.resultsFile))) {
                                this.logProgress(`Parsing results file: ${path_1.default.basename(dataset.resultsFile)}`);
                                results = await this.dataParser.parseResults(dataset.resultsFile);
                            }
                            // Add parsed data to dataset
                            const parsedDataset = {
                                ...dataset,
                                parameters,
                                results,
                            };
                            // Only return datasets with results
                            if (parsedDataset.results) {
                                this.logProgress(`Successfully parsed dataset: ${dataset.name}`);
                                return parsedDataset;
                            }
                            else {
                                this.logProgress(`Skipping dataset ${dataset.name} - no results found`);
                                return null;
                            }
                        }
                        catch (error) {
                            this.errorHandler.logError(error, `Error parsing dataset: ${dataset.name}`);
                            // If configured to continue on error, return null
                            if (this.config.continueOnError) {
                                return null;
                            }
                            throw error;
                        }
                    });
                    // Wait for all parsing promises in this batch to complete
                    const batchResults = await Promise.all(parsingPromises);
                    // Add successful results to the parsed datasets array
                    parsedDatasets.push(...batchResults.filter((result) => result !== null));
                }
            }
            else {
                // Use sequential processing for a single dataset or if parallel processing is disabled
                for (const dataset of datasets) {
                    try {
                        this.logProgress(`Parsing dataset: ${dataset.name}`);
                        // Parse parameters file if it exists
                        let parameters = null;
                        if (dataset.parametersFile &&
                            (await fs_extra_1.default.pathExists(dataset.parametersFile))) {
                            this.logProgress(`Parsing parameters file: ${path_1.default.basename(dataset.parametersFile)}`);
                            parameters = await this.dataParser.parseParameters(dataset.parametersFile);
                        }
                        // Parse results file if it exists
                        let results = null;
                        if (dataset.resultsFile &&
                            (await fs_extra_1.default.pathExists(dataset.resultsFile))) {
                            this.logProgress(`Parsing results file: ${path_1.default.basename(dataset.resultsFile)}`);
                            results = await this.dataParser.parseResults(dataset.resultsFile);
                        }
                        // Add parsed data to dataset
                        const parsedDataset = {
                            ...dataset,
                            parameters,
                            results,
                        };
                        // Only add datasets with results
                        if (parsedDataset.results) {
                            parsedDatasets.push(parsedDataset);
                            this.logProgress(`Successfully parsed dataset: ${dataset.name}`);
                        }
                        else {
                            this.logProgress(`Skipping dataset ${dataset.name} - no results found`);
                        }
                    }
                    catch (error) {
                        this.errorHandler.logError(error, `Error parsing dataset: ${dataset.name}`);
                        // If configured to continue on error, skip this dataset
                        if (!this.config.continueOnError) {
                            throw error;
                        }
                    }
                }
            }
            return parsedDatasets;
        }
        finally {
            // End performance monitoring for this operation
            if (this.performanceMonitor) {
                const duration = this.performanceMonitor.endOperation("parseDatasetFiles");
                if (duration) {
                    this.logProgress(`Dataset parsing completed in ${duration.toFixed(2)}ms`);
                }
            }
        }
    }
    /**
     * Perform analysis on the parsed datasets
     * @param datasets The datasets to analyze
     * @returns A promise that resolves to the analysis results
     * @private
     */
    async performAnalysis(datasets) {
        // Execute analyzer plugins if available
        let pluginResults = [];
        if (this.pluginManager) {
            try {
                pluginResults = await this.pluginManager.executePlugins("analyzer", {
                    datasets,
                });
            }
            catch (error) {
                console.error("Error executing analyzer plugins:", error);
            }
        }
        // Start performance monitoring for this operation
        if (this.performanceMonitor) {
            this.performanceMonitor.startOperation("performAnalysis");
        }
        try {
            let iperfAnalysis, dnsAnalysis, configurationComparison, anomalies;
            // Use parallel processing if enabled
            if (this.config.useParallelProcessing) {
                this.logProgress("Using parallel processing for analysis tasks");
                // Run analysis tasks in parallel
                [iperfAnalysis, dnsAnalysis, configurationComparison, anomalies] =
                    await Promise.all([
                        // Task 1: Analyze iperf performance
                        (async () => {
                            if (this.performanceMonitor) {
                                this.performanceMonitor.startOperation("analyzeIperfPerformance");
                            }
                            this.logProgress("Analyzing iperf performance...");
                            try {
                                const result = await this.analysisEngine.analyzeIperfPerformance(datasets);
                                if (this.performanceMonitor) {
                                    const duration = this.performanceMonitor.endOperation("analyzeIperfPerformance");
                                    if (duration) {
                                        this.logProgress(`Iperf analysis completed in ${duration.toFixed(2)}ms`);
                                    }
                                }
                                return result;
                            }
                            catch (error) {
                                this.errorHandler.logError(error, "Error analyzing iperf performance");
                                throw error;
                            }
                        })(),
                        // Task 2: Analyze DNS performance
                        (async () => {
                            if (this.performanceMonitor) {
                                this.performanceMonitor.startOperation("analyzeDnsPerformance");
                            }
                            this.logProgress("Analyzing DNS performance...");
                            try {
                                const result = await this.analysisEngine.analyzeDnsPerformance(datasets);
                                if (this.performanceMonitor) {
                                    const duration = this.performanceMonitor.endOperation("analyzeDnsPerformance");
                                    if (duration) {
                                        this.logProgress(`DNS analysis completed in ${duration.toFixed(2)}ms`);
                                    }
                                }
                                return result;
                            }
                            catch (error) {
                                this.errorHandler.logError(error, "Error analyzing DNS performance");
                                throw error;
                            }
                        })(),
                        // Task 3: Compare configurations
                        (async () => {
                            if (this.performanceMonitor) {
                                this.performanceMonitor.startOperation("compareConfigurations");
                            }
                            this.logProgress("Comparing configurations...");
                            try {
                                const result = await this.analysisEngine.compareConfigurations(datasets);
                                if (this.performanceMonitor) {
                                    const duration = this.performanceMonitor.endOperation("compareConfigurations");
                                    if (duration) {
                                        this.logProgress(`Configuration comparison completed in ${duration.toFixed(2)}ms`);
                                    }
                                }
                                return result;
                            }
                            catch (error) {
                                this.errorHandler.logError(error, "Error comparing configurations");
                                throw error;
                            }
                        })(),
                        // Task 4: Detect anomalies
                        (async () => {
                            if (this.performanceMonitor) {
                                this.performanceMonitor.startOperation("detectAnomalies");
                            }
                            this.logProgress("Detecting performance anomalies...");
                            try {
                                const result = await this.analysisEngine.detectAnomalies(datasets);
                                if (this.performanceMonitor) {
                                    const duration = this.performanceMonitor.endOperation("detectAnomalies");
                                    if (duration) {
                                        this.logProgress(`Anomaly detection completed in ${duration.toFixed(2)}ms`);
                                    }
                                }
                                return result;
                            }
                            catch (error) {
                                this.errorHandler.logError(error, "Error detecting anomalies");
                                throw error;
                            }
                        })(),
                    ]);
            }
            else {
                // Sequential processing
                // Step 1: Analyze iperf performance
                if (this.performanceMonitor) {
                    this.performanceMonitor.startOperation("analyzeIperfPerformance");
                }
                this.logProgress("Analyzing iperf performance...");
                iperfAnalysis = await this.analysisEngine.analyzeIperfPerformance(datasets);
                if (this.performanceMonitor) {
                    const duration = this.performanceMonitor.endOperation("analyzeIperfPerformance");
                    if (duration) {
                        this.logProgress(`Iperf analysis completed in ${duration.toFixed(2)}ms`);
                    }
                }
                // Step 2: Analyze DNS performance
                if (this.performanceMonitor) {
                    this.performanceMonitor.startOperation("analyzeDnsPerformance");
                }
                this.logProgress("Analyzing DNS performance...");
                dnsAnalysis = await this.analysisEngine.analyzeDnsPerformance(datasets);
                if (this.performanceMonitor) {
                    const duration = this.performanceMonitor.endOperation("analyzeDnsPerformance");
                    if (duration) {
                        this.logProgress(`DNS analysis completed in ${duration.toFixed(2)}ms`);
                    }
                }
                // Step 3: Compare configurations
                if (this.performanceMonitor) {
                    this.performanceMonitor.startOperation("compareConfigurations");
                }
                this.logProgress("Comparing configurations...");
                configurationComparison =
                    await this.analysisEngine.compareConfigurations(datasets);
                if (this.performanceMonitor) {
                    const duration = this.performanceMonitor.endOperation("compareConfigurations");
                    if (duration) {
                        this.logProgress(`Configuration comparison completed in ${duration.toFixed(2)}ms`);
                    }
                }
                // Step 4: Detect anomalies
                if (this.performanceMonitor) {
                    this.performanceMonitor.startOperation("detectAnomalies");
                }
                this.logProgress("Detecting performance anomalies...");
                anomalies = await this.analysisEngine.detectAnomalies(datasets);
                if (this.performanceMonitor) {
                    const duration = this.performanceMonitor.endOperation("detectAnomalies");
                    if (duration) {
                        this.logProgress(`Anomaly detection completed in ${duration.toFixed(2)}ms`);
                    }
                }
            }
            // Step 5: Create executive summary
            if (this.performanceMonitor) {
                this.performanceMonitor.startOperation("createExecutiveSummary");
            }
            this.logProgress("Creating executive summary...");
            const summary = this.createExecutiveSummary(datasets, iperfAnalysis, dnsAnalysis, configurationComparison, anomalies);
            if (this.performanceMonitor) {
                const duration = this.performanceMonitor.endOperation("createExecutiveSummary");
                if (duration) {
                    this.logProgress(`Executive summary created in ${duration.toFixed(2)}ms`);
                }
            }
            // Combine all analysis results
            return {
                iperfAnalysis,
                dnsAnalysis,
                configurationComparison,
                anomalies,
                summary,
            };
        }
        catch (error) {
            this.errorHandler.logError(error, "Error performing analysis");
            throw error;
        }
        finally {
            // End performance monitoring for this operation
            if (this.performanceMonitor) {
                const duration = this.performanceMonitor.endOperation("performAnalysis");
                if (duration) {
                    this.logProgress(`Analysis completed in ${duration.toFixed(2)}ms`);
                    // Generate performance report if monitoring is enabled
                    if (this.config.enablePerformanceMonitoring) {
                        const perfReport = this.performanceMonitor.generateReport();
                        this.logProgress("Performance report generated");
                        // Save performance report if output path is provided
                        if (this.config.reportOutputPath) {
                            const perfReportPath = this.config.reportOutputPath.replace(/\.md$/, "-performance.md");
                            try {
                                fs_extra_1.default.writeFileSync(perfReportPath, perfReport);
                                this.logProgress(`Performance report saved to ${perfReportPath}`);
                            }
                            catch (error) {
                                this.errorHandler.logError(error, "Error saving performance report");
                            }
                        }
                    }
                }
            }
        }
    }
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
    createExecutiveSummary(datasets, iperfAnalysis, dnsAnalysis, configurationComparison, anomalies) {
        // Find optimal configuration
        const optimalConfig = configurationComparison.overallRanking.length > 0
            ? configurationComparison.overallRanking.sort((a, b) => a.rank - b.rank)[0].configuration
            : "Unknown";
        // Generate key findings
        const keyFindings = [];
        // Add MTU impact finding
        if (configurationComparison.mtuImpact &&
            configurationComparison.mtuImpact.optimalMtu) {
            keyFindings.push(`MTU ${configurationComparison.mtuImpact.optimalMtu} provides the best overall network performance.`);
        }
        // Add AWS logging impact finding
        if (configurationComparison.loggingImpact) {
            const impact = configurationComparison.loggingImpact.performanceImpact;
            const direction = impact > 0 ? "improves" : "degrades";
            const magnitude = Math.abs(impact);
            if (magnitude > 0.05) {
                // 5% threshold for significance
                keyFindings.push(`AWS logging ${direction} overall performance by approximately ${(magnitude * 100).toFixed(1)}%.`);
            }
            else {
                keyFindings.push("AWS logging has minimal impact on overall network performance.");
            }
        }
        // Add bandwidth finding
        if (iperfAnalysis.bandwidthComparison &&
            iperfAnalysis.bandwidthComparison.length > 0) {
            const bestBandwidth = [...iperfAnalysis.bandwidthComparison].sort((a, b) => b.avgBandwidthMbps - a.avgBandwidthMbps)[0];
            keyFindings.push(`Highest average bandwidth of ${bestBandwidth.avgBandwidthMbps.toFixed(2)} Mbps achieved with ${bestBandwidth.configuration} configuration.`);
        }
        // Add DNS performance finding
        if (dnsAnalysis.performanceMetrics &&
            dnsAnalysis.performanceMetrics.length > 0) {
            const bestDns = [...dnsAnalysis.performanceMetrics].sort((a, b) => a.avgResponseTimeMs - b.avgResponseTimeMs)[0];
            keyFindings.push(`Fastest DNS resolution (${bestDns.avgResponseTimeMs.toFixed(2)} ms) achieved with ${bestDns.configuration} configuration.`);
        }
        // Add anomaly finding if any exist
        if (anomalies && anomalies.length > 0) {
            const highSeverity = anomalies.filter((a) => a.severity === "high");
            if (highSeverity.length > 0) {
                keyFindings.push(`Detected ${highSeverity.length} high severity performance anomalies that require attention.`);
            }
        }
        // Generate recommendations
        const recommendations = [];
        // Add MTU recommendations
        if (configurationComparison.mtuImpact &&
            configurationComparison.mtuImpact.recommendations) {
            recommendations.push(...configurationComparison.mtuImpact.recommendations);
        }
        // Add logging recommendations
        if (configurationComparison.loggingImpact &&
            configurationComparison.loggingImpact.recommendations) {
            recommendations.push(...configurationComparison.loggingImpact.recommendations);
        }
        // Add anomaly recommendations
        if (anomalies && anomalies.length > 0) {
            const highSeverityRecs = anomalies
                .filter((a) => a.severity === "high")
                .flatMap((a) => a.recommendations);
            // Add unique recommendations
            const uniqueRecs = new Set(highSeverityRecs);
            recommendations.push(...uniqueRecs);
        }
        // Generate performance highlights
        const performanceHighlights = [];
        // Add bandwidth highlight
        if (iperfAnalysis.bandwidthComparison &&
            iperfAnalysis.bandwidthComparison.length > 1) {
            const sorted = [...iperfAnalysis.bandwidthComparison].sort((a, b) => b.avgBandwidthMbps - a.avgBandwidthMbps);
            const best = sorted[0];
            const worst = sorted[sorted.length - 1];
            const difference = ((best.avgBandwidthMbps - worst.avgBandwidthMbps) /
                worst.avgBandwidthMbps) *
                100;
            performanceHighlights.push(`Bandwidth varies by up to ${difference.toFixed(1)}% across different configurations.`);
        }
        // Add latency highlight
        if (iperfAnalysis.latencyAnalysis &&
            iperfAnalysis.latencyAnalysis.length > 0) {
            const bestLatency = [...iperfAnalysis.latencyAnalysis].sort((a, b) => a.avgLatencyMs - b.avgLatencyMs)[0];
            performanceHighlights.push(`Lowest average latency (${bestLatency.avgLatencyMs.toFixed(2)} ms) achieved with ${bestLatency.configuration} configuration.`);
        }
        // Add reliability highlight
        if (iperfAnalysis.reliabilityMetrics &&
            iperfAnalysis.reliabilityMetrics.length > 0) {
            const bestReliability = [...iperfAnalysis.reliabilityMetrics].sort((a, b) => b.successRate - a.successRate)[0];
            performanceHighlights.push(`Highest reliability (${(bestReliability.successRate * 100).toFixed(2)}% success rate) achieved with ${bestReliability.configuration} configuration.`);
        }
        return {
            totalDatasets: datasets.length,
            keyFindings,
            recommendations,
            optimalConfiguration: optimalConfig,
            performanceHighlights,
        };
    }
    /**
     * Save the generated report to a file
     * @param report The report content to save
     * @param outputPath The path to save the report to
     * @returns A promise that resolves when the report is saved
     * @private
     */
    async saveReport(report, outputPath) {
        try {
            // Ensure the directory exists
            await fs_extra_1.default.ensureDir(path_1.default.dirname(outputPath));
            // Write the report to the file
            await fs_extra_1.default.writeFile(outputPath, report, "utf8");
        }
        catch (error) {
            this.errorHandler.logError(error, `Error saving report to ${outputPath}`);
            throw error;
        }
    }
    /**
     * Log progress information if enabled
     * @param message The progress message to log
     * @private
     */
    logProgress(message) {
        if (this.config.logProgress) {
            console.log(`[NetworkPerformanceAnalyzer] ${message}`);
        }
    }
}
exports.NetworkPerformanceAnalyzer = NetworkPerformanceAnalyzer;
/**
 * Factory function to create a new NetworkPerformanceAnalyzer instance with configuration and plugin support
 * @param config Configuration options for the analyzer
 * @returns A new NetworkPerformanceAnalyzer instance
 */
function createNetworkPerformanceAnalyzer(config = {}) {
    // Initialize configuration manager
    const configManager = new ConfigurationManager_1.ConfigurationManager();
    // Load configuration from file if provided
    if (config.configPath) {
        configManager.loadFromFile(config.configPath);
    }
    // Set environment if provided
    if (config.environment) {
        configManager.setEnvironment(config.environment);
    }
    // Merge provided config with loaded config
    configManager.update({
        ...(config.continueOnError !== undefined ||
            config.logProgress !== undefined ||
            config.useParallelProcessing !== undefined ||
            config.maxParallelTasks !== undefined ||
            config.enablePerformanceMonitoring !== undefined ||
            config.memoryThresholdPercent !== undefined
            ? {
                analysis: {
                    ...(config.continueOnError !== undefined
                        ? { continueOnError: config.continueOnError }
                        : {}),
                    ...(config.logProgress !== undefined
                        ? { logProgress: config.logProgress }
                        : {}),
                    ...(config.useParallelProcessing !== undefined
                        ? { useParallelProcessing: config.useParallelProcessing }
                        : {}),
                    ...(config.maxParallelTasks !== undefined
                        ? { maxParallelTasks: config.maxParallelTasks }
                        : {}),
                    ...(config.enablePerformanceMonitoring !== undefined
                        ? {
                            enablePerformanceMonitoring: config.enablePerformanceMonitoring,
                        }
                        : {}),
                    ...(config.memoryThresholdPercent !== undefined
                        ? { memoryThresholdPercent: config.memoryThresholdPercent }
                        : {}),
                },
            }
            : {}),
        ...(config.anomalyThresholds
            ? {
                anomalyThresholds: Object.fromEntries(Object.entries(config.anomalyThresholds).filter(([_, value]) => value !== undefined))
            }
            : {}),
        ...(config.reportOutputPath || config.includeSections
            ? {
                reporting: {
                    ...(config.reportOutputPath
                        ? {
                            outputDirectory: path_1.default.dirname(config.reportOutputPath),
                            defaultFilename: path_1.default.basename(config.reportOutputPath),
                        }
                        : {}),
                    ...(config.includeSections
                        ? { includeSections: config.includeSections }
                        : {}),
                },
            }
            : {}),
    });
    // Get final analyzer config
    const analyzerConfig = configManager.getAnalyzerConfig();
    // Initialize plugin manager
    const pluginManager = new PluginManager_1.PluginManager(configManager);
    // Add plugin directories if provided
    if (config.pluginDirectories) {
        for (const dir of config.pluginDirectories) {
            pluginManager.addPluginDirectory(dir);
        }
    }
    // Add default plugin directory
    pluginManager.addPluginDirectory(path_1.default.join(__dirname, "../plugins"));
    // Initialize template manager
    const templateManager = new ReportTemplateManager_1.ReportTemplateManager(configManager);
    // Set active template if provided
    if (config.reportTemplateId) {
        try {
            templateManager.setActiveTemplate(config.reportTemplateId);
        }
        catch (error) {
            console.warn(`Template ${config.reportTemplateId} not found, using default template`);
        }
    }
    // Create services
    const discoveryService = new DatasetDiscoveryService_1.DefaultDatasetDiscoveryService();
    const dataParser = new DataParser_1.DefaultDataParser();
    const analysisEngine = new AnalysisEngine_1.DefaultAnalysisEngine();
    // Create custom report generator that integrates with plugins and templates
    const reportGenerator = new (class extends ReportGenerator_1.DefaultReportGenerator {
        async generateReport(analysis) {
            try {
                // Execute reporter plugins
                const pluginResults = await pluginManager.executePlugins("reporter", {
                    datasets: [], // We don't have the original datasets here
                    analysisResults: analysis,
                });
                // Merge plugin results with analysis results
                const reportData = {
                    ...analysis,
                    ...pluginResults.reduce((acc, result) => ({ ...acc, ...result }), {}),
                };
                // Use template manager to generate report
                const template = templateManager.getActiveTemplate();
                return templateManager.applyTemplate(template, reportData);
            }
            catch (error) {
                console.error("Error generating report with plugins:", error);
                // Fall back to default report generation
                return super.generateReport(analysis);
            }
        }
    })();
    const errorHandler = new ErrorHandler_1.DefaultErrorHandler();
    // Create analyzer with configured services
    const analyzer = new NetworkPerformanceAnalyzer(discoveryService, dataParser, analysisEngine, reportGenerator, errorHandler, analyzerConfig);
    // Discover and load plugins
    (async () => {
        try {
            await pluginManager.discoverPlugins();
            await pluginManager.loadEnabledPlugins();
            const enabledPlugins = pluginManager.getEnabledPlugins();
            if (enabledPlugins.length > 0 && analyzerConfig.logProgress) {
                console.log(`Loaded ${enabledPlugins.length} plugins: ${enabledPlugins
                    .map((p) => p.name)
                    .join(", ")}`);
            }
        }
        catch (error) {
            console.error("Error loading plugins:", error);
        }
    })();
    return analyzer;
}
//# sourceMappingURL=NetworkPerformanceAnalyzer.js.map