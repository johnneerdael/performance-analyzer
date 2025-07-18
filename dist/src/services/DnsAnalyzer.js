"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DnsAnalyzer = void 0;
const ErrorHandler_1 = require("../utils/ErrorHandler");
/**
 * DnsAnalyzer class for processing DNS resolution performance metrics
 * Analyzes response times, success rates, and domain performance across datasets
 */
class DnsAnalyzer {
    /**
     * Creates a new instance of DnsAnalyzer
     */
    constructor() {
        this.errorHandler = new ErrorHandler_1.DefaultErrorHandler();
    }
    /**
     * Analyze DNS performance metrics across datasets
     * @param datasets The datasets containing DNS test results
     * @returns DNS performance analysis results
     */
    analyzeDnsPerformance(datasets) {
        try {
            // Calculate performance metrics for each configuration
            const performanceMetrics = this.calculatePerformanceMetrics(datasets);
            // Calculate domain rankings across all configurations
            const domainRankings = this.calculateDomainRankings(datasets);
            // Calculate DNS server comparison metrics
            const serverComparison = this.calculateServerComparison(datasets);
            return {
                performanceMetrics,
                domainRankings,
                serverComparison
            };
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
     * Calculate DNS performance metrics for each configuration
     * @param datasets The datasets containing DNS test results
     * @returns Array of DNS performance metrics for each configuration
     */
    calculatePerformanceMetrics(datasets) {
        try {
            return datasets.map(dataset => {
                const dnsResults = this.getDnsResults(dataset);
                // Calculate response time statistics
                const responseTimesMs = dnsResults
                    .filter(result => result.success && result.responseTimeMs !== undefined)
                    .map(result => result.responseTimeMs);
                // Calculate success rate
                const successRate = dnsResults.length > 0
                    ? dnsResults.filter(result => result.success).length / dnsResults.length
                    : 0;
                // Calculate domain performance metrics
                const domainPerformance = this.calculateDomainPerformanceForDataset(dataset);
                // Sort domains by response time
                const sortedDomains = [...domainPerformance].sort((a, b) => b.avgResponseTimeMs - a.avgResponseTimeMs);
                // Get slowest and fastest domains
                const slowestDomains = sortedDomains.slice(0, 5);
                const fastestDomains = [...sortedDomains].reverse().slice(0, 5);
                return {
                    configuration: dataset.name,
                    avgResponseTimeMs: this.calculateMean(responseTimesMs),
                    medianResponseTimeMs: this.calculateMedian(responseTimesMs),
                    successRate,
                    slowestDomains,
                    fastestDomains
                };
            });
        }
        catch (error) {
            const analysisError = new Error(error instanceof Error ? error.message : String(error));
            analysisError.analysisType = 'dns_performance_metrics';
            this.errorHandler.handleAnalysisError(analysisError);
            return [];
        }
    }
    /**
     * Calculate domain performance rankings across all datasets
     * @param datasets The datasets containing DNS test results
     * @returns Array of domain performance metrics sorted by average response time
     */
    calculateDomainRankings(datasets) {
        try {
            // Get all unique domains across all datasets
            const allDomains = new Set();
            datasets.forEach(dataset => {
                const dnsResults = this.getDnsResults(dataset);
                dnsResults.forEach(result => {
                    if (result.domain) {
                        allDomains.add(result.domain);
                    }
                });
            });
            // Calculate performance metrics for each domain across all datasets
            const domainPerformance = Array.from(allDomains).map(domain => {
                let totalResponseTime = 0;
                let successCount = 0;
                let totalCount = 0;
                // Collect metrics for this domain across all datasets
                datasets.forEach(dataset => {
                    const dnsResults = this.getDnsResults(dataset);
                    const domainResults = dnsResults.filter(result => result.domain === domain);
                    domainResults.forEach(result => {
                        totalCount++;
                        if (result.success && result.responseTimeMs !== undefined) {
                            totalResponseTime += result.responseTimeMs;
                            successCount++;
                        }
                    });
                });
                // Calculate average response time and success rate
                const avgResponseTimeMs = successCount > 0 ? totalResponseTime / successCount : 0;
                const successRate = totalCount > 0 ? successCount / totalCount : 0;
                return {
                    domain,
                    avgResponseTimeMs,
                    successRate,
                    queryCount: totalCount
                };
            });
            // Sort domains by average response time (slowest first)
            return domainPerformance.sort((a, b) => b.avgResponseTimeMs - a.avgResponseTimeMs);
        }
        catch (error) {
            const analysisError = new Error(error instanceof Error ? error.message : String(error));
            analysisError.analysisType = 'domain_rankings';
            this.errorHandler.handleAnalysisError(analysisError);
            return [];
        }
    }
    /**
     * Calculate DNS server comparison metrics across all datasets
     * @param datasets The datasets containing DNS test results
     * @returns Array of DNS server comparison metrics
     */
    calculateServerComparison(datasets) {
        try {
            // Get all unique DNS servers across all datasets
            const allServers = new Set();
            datasets.forEach(dataset => {
                const dnsResults = this.getDnsResults(dataset);
                dnsResults.forEach(result => {
                    if (result.dnsServer) {
                        allServers.add(result.dnsServer);
                    }
                });
            });
            // Calculate performance metrics for each DNS server across all datasets
            const serverComparison = Array.from(allServers).map(server => {
                let totalResponseTime = 0;
                let successCount = 0;
                let totalCount = 0;
                const configurations = new Set();
                // Collect metrics for this server across all datasets
                datasets.forEach(dataset => {
                    const dnsResults = this.getDnsResults(dataset);
                    const serverResults = dnsResults.filter(result => result.dnsServer === server);
                    if (serverResults.length > 0) {
                        configurations.add(dataset.name);
                    }
                    serverResults.forEach(result => {
                        totalCount++;
                        if (result.success && result.responseTimeMs !== undefined) {
                            totalResponseTime += result.responseTimeMs;
                            successCount++;
                        }
                    });
                });
                // Calculate average response time and success rate
                const avgResponseTimeMs = successCount > 0 ? totalResponseTime / successCount : 0;
                const successRate = totalCount > 0 ? successCount / totalCount : 0;
                return {
                    server,
                    avgResponseTimeMs,
                    successRate,
                    configurations: Array.from(configurations)
                };
            });
            // Sort servers by average response time (fastest first)
            return serverComparison.sort((a, b) => a.avgResponseTimeMs - b.avgResponseTimeMs);
        }
        catch (error) {
            const analysisError = new Error(error instanceof Error ? error.message : String(error));
            analysisError.analysisType = 'server_comparison';
            this.errorHandler.handleAnalysisError(analysisError);
            return [];
        }
    }
    /**
     * Calculate domain performance metrics for a single dataset
     * @param dataset The dataset containing DNS test results
     * @returns Array of domain performance metrics
     */
    calculateDomainPerformanceForDataset(dataset) {
        try {
            const dnsResults = this.getDnsResults(dataset);
            // Get all unique domains in this dataset
            const domains = new Set();
            dnsResults.forEach(result => {
                if (result.domain) {
                    domains.add(result.domain);
                }
            });
            // Calculate performance metrics for each domain
            return Array.from(domains).map(domain => {
                const domainResults = dnsResults.filter(result => result.domain === domain);
                const successfulResults = domainResults.filter(result => result.success && result.responseTimeMs !== undefined);
                const responseTimes = successfulResults.map(result => result.responseTimeMs);
                const avgResponseTimeMs = this.calculateMean(responseTimes);
                const successRate = domainResults.length > 0
                    ? successfulResults.length / domainResults.length
                    : 0;
                return {
                    domain,
                    avgResponseTimeMs,
                    successRate,
                    queryCount: domainResults.length
                };
            });
        }
        catch (error) {
            const analysisError = new Error(error instanceof Error ? error.message : String(error));
            analysisError.analysisType = 'domain_performance';
            analysisError.datasetName = dataset.name;
            this.errorHandler.handleAnalysisError(analysisError);
            return [];
        }
    }
    /**
     * Analyze DNS failure patterns across datasets
     * @param datasets The datasets containing DNS test results
     * @returns Object containing failure pattern analysis
     */
    analyzeFailurePatterns(datasets) {
        try {
            // Initialize failure pattern counter
            const failurePatterns = {};
            // Count occurrences of each failure pattern
            datasets.forEach(dataset => {
                const dnsResults = this.getDnsResults(dataset);
                dnsResults.forEach(result => {
                    if (!result.success && result.error) {
                        // Normalize error message to create a pattern
                        const pattern = this.normalizeErrorMessage(result.error);
                        // Increment pattern count
                        failurePatterns[pattern] = (failurePatterns[pattern] || 0) + 1;
                    }
                });
            });
            return failurePatterns;
        }
        catch (error) {
            const analysisError = new Error(error instanceof Error ? error.message : String(error));
            analysisError.analysisType = 'failure_patterns';
            this.errorHandler.handleAnalysisError(analysisError);
            return {};
        }
    }
    /**
     * Normalize error message to create a pattern
     * @param errorMessage The error message to normalize
     * @returns Normalized error pattern
     */
    normalizeErrorMessage(errorMessage) {
        // Remove specific details like IP addresses, timestamps, etc.
        // This helps group similar errors together
        return errorMessage
            .replace(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g, '[IP]')
            .replace(/\b\d+\b/g, '[NUM]')
            .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[UUID]')
            .replace(/\b[0-9a-f]{24}\b/gi, '[ID]')
            .trim();
    }
    /**
     * Get DNS test results from a dataset
     * @param dataset The dataset to extract DNS results from
     * @returns Array of DNS test results
     */
    getDnsResults(dataset) {
        try {
            // This is a placeholder - in a real implementation, we would need to load the results file
            // For now, we'll assume the dataset already has the parsed results
            return dataset.results?.dnsResults || [];
        }
        catch (error) {
            const analysisError = new Error(error instanceof Error ? error.message : String(error));
            analysisError.analysisType = 'data_extraction';
            analysisError.datasetName = dataset.name;
            this.errorHandler.handleAnalysisError(analysisError);
            return [];
        }
    }
    /**
     * Calculate the mean of an array of numbers
     * @param values Array of numbers
     * @returns The mean value, or 0 if the array is empty
     */
    calculateMean(values) {
        if (values.length === 0)
            return 0;
        const sum = values.reduce((acc, val) => acc + val, 0);
        return sum / values.length;
    }
    /**
     * Calculate the median of an array of numbers
     * @param values Array of numbers
     * @returns The median value, or 0 if the array is empty
     */
    calculateMedian(values) {
        if (values.length === 0)
            return 0;
        const sortedValues = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sortedValues.length / 2);
        if (sortedValues.length % 2 === 0) {
            // For even-length arrays, average the two middle values
            const midValue1 = sortedValues[mid - 1] || 0;
            const midValue2 = sortedValues[mid] || 0;
            return (midValue1 + midValue2) / 2;
        }
        else {
            // For odd-length arrays, return the middle value
            return sortedValues[mid] || 0;
        }
    }
}
exports.DnsAnalyzer = DnsAnalyzer;
//# sourceMappingURL=DnsAnalyzer.js.map