"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.author = exports.type = void 0;
/**
 * Example analyzer plugin that calculates additional metrics
 */
class ExampleAnalyzerPlugin {
    constructor() {
        this.name = 'example-analyzer';
        this.description = 'Example plugin that calculates additional performance metrics';
        this.version = '1.0.0';
        this.config = {};
    }
    /**
     * Initialize the plugin with configuration
     * @param config Plugin configuration
     */
    async initialize(config) {
        this.config = config || {};
        console.log(`Initializing ${this.name} plugin with config:`, this.config);
    }
    /**
     * Execute the plugin functionality
     * @param context Context data for plugin execution
     * @returns Additional metrics calculated by the plugin
     */
    async execute(context) {
        console.log(`Executing ${this.name} plugin`);
        const { datasets } = context;
        if (!datasets || datasets.length === 0) {
            return { error: 'No datasets provided' };
        }
        // Calculate additional metrics
        const additionalMetrics = {
            bandwidthToLatencyRatio: this.calculateBandwidthToLatencyRatio(datasets),
            configurationStability: this.calculateConfigurationStability(datasets),
            performanceIndex: this.calculatePerformanceIndex(datasets)
        };
        return additionalMetrics;
    }
    /**
     * Calculate bandwidth to latency ratio for each configuration
     * @param datasets Datasets to analyze
     * @returns Bandwidth to latency ratio metrics
     * @private
     */
    calculateBandwidthToLatencyRatio(datasets) {
        const results = [];
        // Group datasets by configuration
        const configGroups = this.groupByConfiguration(datasets);
        // Calculate ratio for each configuration
        for (const [config, configDatasets] of Object.entries(configGroups)) {
            let totalBandwidth = 0;
            let totalLatency = 0;
            let count = 0;
            for (const dataset of configDatasets) {
                if (dataset.results && dataset.results.iperfTests) {
                    for (const test of dataset.results.iperfTests) {
                        if (test.bandwidthMbps && test.jitterMs) {
                            totalBandwidth += test.bandwidthMbps;
                            totalLatency += test.jitterMs;
                            count++;
                        }
                    }
                }
            }
            if (count > 0 && totalLatency > 0) {
                const avgBandwidth = totalBandwidth / count;
                const avgLatency = totalLatency / count;
                const ratio = avgBandwidth / avgLatency;
                results.push({
                    configuration: config,
                    avgBandwidth,
                    avgLatency,
                    bandwidthToLatencyRatio: ratio,
                    performanceScore: ratio * (this.config.ratioWeight || 1)
                });
            }
        }
        return results;
    }
    /**
     * Calculate configuration stability based on variance in metrics
     * @param datasets Datasets to analyze
     * @returns Configuration stability metrics
     * @private
     */
    calculateConfigurationStability(datasets) {
        const results = [];
        // Group datasets by configuration
        const configGroups = this.groupByConfiguration(datasets);
        // Calculate stability for each configuration
        for (const [config, configDatasets] of Object.entries(configGroups)) {
            const bandwidthValues = [];
            const latencyValues = [];
            const packetLossValues = [];
            for (const dataset of configDatasets) {
                if (dataset.results && dataset.results.iperfTests) {
                    for (const test of dataset.results.iperfTests) {
                        if (test.bandwidthMbps)
                            bandwidthValues.push(test.bandwidthMbps);
                        if (test.jitterMs)
                            latencyValues.push(test.jitterMs);
                        if (test.packetLoss)
                            packetLossValues.push(test.packetLoss);
                    }
                }
            }
            const bandwidthStability = this.calculateStabilityScore(bandwidthValues);
            const latencyStability = this.calculateStabilityScore(latencyValues);
            const packetLossStability = this.calculateStabilityScore(packetLossValues);
            const overallStability = (bandwidthStability * (this.config.bandwidthWeight || 0.4) +
                latencyStability * (this.config.latencyWeight || 0.4) +
                packetLossStability * (this.config.packetLossWeight || 0.2));
            results.push({
                configuration: config,
                bandwidthStability,
                latencyStability,
                packetLossStability,
                overallStability
            });
        }
        return results;
    }
    /**
     * Calculate a composite performance index for each configuration
     * @param datasets Datasets to analyze
     * @returns Performance index metrics
     * @private
     */
    calculatePerformanceIndex(datasets) {
        const results = [];
        // Group datasets by configuration
        const configGroups = this.groupByConfiguration(datasets);
        // Calculate performance index for each configuration
        for (const [config, configDatasets] of Object.entries(configGroups)) {
            let totalBandwidth = 0;
            let totalLatency = 0;
            let totalPacketLoss = 0;
            let totalRetransmits = 0;
            let count = 0;
            for (const dataset of configDatasets) {
                if (dataset.results && dataset.results.iperfTests) {
                    for (const test of dataset.results.iperfTests) {
                        if (test.bandwidthMbps) {
                            totalBandwidth += test.bandwidthMbps;
                            totalLatency += test.jitterMs || 0;
                            totalPacketLoss += test.packetLoss || 0;
                            totalRetransmits += test.retransmits || 0;
                            count++;
                        }
                    }
                }
            }
            if (count > 0) {
                const avgBandwidth = totalBandwidth / count;
                const avgLatency = totalLatency / count;
                const avgPacketLoss = totalPacketLoss / count;
                const avgRetransmits = totalRetransmits / count;
                // Calculate performance index using weighted formula
                const bandwidthScore = avgBandwidth * (this.config.bandwidthWeight || 0.4);
                const latencyScore = (1 / (avgLatency + 1)) * (this.config.latencyWeight || 0.3);
                const reliabilityScore = (1 - avgPacketLoss) * (this.config.packetLossWeight || 0.2);
                const retransmitScore = (1 / (avgRetransmits + 1)) * (this.config.retransmitWeight || 0.1);
                const performanceIndex = bandwidthScore + latencyScore + reliabilityScore + retransmitScore;
                results.push({
                    configuration: config,
                    performanceIndex,
                    bandwidthScore,
                    latencyScore,
                    reliabilityScore,
                    retransmitScore
                });
            }
        }
        // Sort by performance index
        return results.sort((a, b) => b.performanceIndex - a.performanceIndex);
    }
    /**
     * Group datasets by configuration
     * @param datasets Datasets to group
     * @returns Object with configuration keys and dataset arrays
     * @private
     */
    groupByConfiguration(datasets) {
        const groups = {};
        for (const dataset of datasets) {
            if (dataset.configuration) {
                const configKey = `mtu${dataset.configuration.mtu}-logs_${dataset.configuration.awsLogging ? 'enabled' : 'disabled'}`;
                if (!groups[configKey]) {
                    groups[configKey] = [];
                }
                groups[configKey].push(dataset);
            }
        }
        return groups;
    }
    /**
     * Calculate stability score based on coefficient of variation
     * @param values Array of values
     * @returns Stability score (0-1, higher is more stable)
     * @private
     */
    calculateStabilityScore(values) {
        if (values.length < 2)
            return 1; // Perfect stability with insufficient data
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        if (mean === 0)
            return 1; // Avoid division by zero
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        const coefficientOfVariation = stdDev / mean;
        // Convert coefficient of variation to stability score (0-1)
        // Lower coefficient of variation means higher stability
        return Math.max(0, Math.min(1, 1 - (coefficientOfVariation / (this.config.maxVariation || 1))));
    }
}
// Export plugin metadata
exports.type = 'analyzer';
exports.author = 'Network Performance Analyzer Team';
// Export plugin as default
exports.default = new ExampleAnalyzerPlugin();
//# sourceMappingURL=ExampleAnalyzerPlugin.js.map