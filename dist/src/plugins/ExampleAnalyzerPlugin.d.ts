import { Plugin, PluginContext } from './PluginManager';
/**
 * Example analyzer plugin that calculates additional metrics
 */
declare class ExampleAnalyzerPlugin implements Plugin {
    name: string;
    description: string;
    version: string;
    private config;
    /**
     * Initialize the plugin with configuration
     * @param config Plugin configuration
     */
    initialize(config: any): Promise<void>;
    /**
     * Execute the plugin functionality
     * @param context Context data for plugin execution
     * @returns Additional metrics calculated by the plugin
     */
    execute(context: PluginContext): Promise<any>;
    /**
     * Calculate bandwidth to latency ratio for each configuration
     * @param datasets Datasets to analyze
     * @returns Bandwidth to latency ratio metrics
     * @private
     */
    private calculateBandwidthToLatencyRatio;
    /**
     * Calculate configuration stability based on variance in metrics
     * @param datasets Datasets to analyze
     * @returns Configuration stability metrics
     * @private
     */
    private calculateConfigurationStability;
    /**
     * Calculate a composite performance index for each configuration
     * @param datasets Datasets to analyze
     * @returns Performance index metrics
     * @private
     */
    private calculatePerformanceIndex;
    /**
     * Group datasets by configuration
     * @param datasets Datasets to group
     * @returns Object with configuration keys and dataset arrays
     * @private
     */
    private groupByConfiguration;
    /**
     * Calculate stability score based on coefficient of variation
     * @param values Array of values
     * @returns Stability score (0-1, higher is more stable)
     * @private
     */
    private calculateStabilityScore;
}
export declare const type = "analyzer";
export declare const author = "Network Performance Analyzer Team";
declare const _default: ExampleAnalyzerPlugin;
export default _default;
//# sourceMappingURL=ExampleAnalyzerPlugin.d.ts.map