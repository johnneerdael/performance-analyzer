import { AnalyzerConfig } from '../services/NetworkPerformanceAnalyzer';
/**
 * Configuration file structure
 */
export interface ConfigFile {
    /**
     * Analysis configuration options
     */
    analysis?: {
        /**
         * Whether to continue analysis when a dataset fails to parse
         */
        continueOnError?: boolean;
        /**
         * Whether to log progress information during analysis
         */
        logProgress?: boolean;
        /**
         * Whether to use parallel processing for dataset analysis
         */
        useParallelProcessing?: boolean;
        /**
         * Maximum number of parallel tasks to run
         */
        maxParallelTasks?: number;
        /**
         * Whether to enable performance monitoring
         */
        enablePerformanceMonitoring?: boolean;
        /**
         * Maximum memory usage percentage before triggering garbage collection
         */
        memoryThresholdPercent?: number;
    };
    /**
     * Anomaly detection thresholds
     */
    anomalyThresholds?: {
        /**
         * Threshold for bandwidth variation (as a percentage)
         */
        bandwidthVariation?: number;
        /**
         * Threshold for latency variation (as a percentage)
         */
        latencyVariation?: number;
        /**
         * Threshold for packet loss (as a percentage)
         */
        packetLossThreshold?: number;
        /**
         * Threshold for DNS response time variation (as a percentage)
         */
        dnsResponseTimeVariation?: number;
        /**
         * Threshold for CPU utilization (as a percentage)
         */
        cpuUtilizationThreshold?: number;
    };
    /**
     * Report generation options
     */
    reporting?: {
        /**
         * Default output directory for reports
         */
        outputDirectory?: string;
        /**
         * Default report filename
         */
        defaultFilename?: string;
        /**
         * Report sections to include
         */
        includeSections?: string[];
        /**
         * Report format (markdown, html, json)
         */
        format?: 'markdown' | 'html' | 'json';
        /**
         * Custom report template path
         */
        templatePath?: string;
    };
    /**
     * Plugin configuration
     */
    plugins?: {
        /**
         * List of enabled plugins
         */
        enabled?: string[];
        /**
         * Plugin-specific configuration
         */
        config?: {
            [pluginName: string]: any;
        };
    };
    /**
     * Environment-specific configuration
     */
    environments?: {
        /**
         * Development environment configuration
         */
        development?: Partial<ConfigFile>;
        /**
         * Production environment configuration
         */
        production?: Partial<ConfigFile>;
        /**
         * Testing environment configuration
         */
        testing?: Partial<ConfigFile>;
        /**
         * Custom environments
         */
        [environment: string]: Partial<ConfigFile> | undefined;
    };
}
/**
 * Default configuration values
 */
export declare const DEFAULT_CONFIG: ConfigFile;
/**
 * Configuration Manager for loading, validating, and providing access to configuration
 */
export declare class ConfigurationManager {
    private config;
    private configPath;
    private environment;
    /**
     * Create a new ConfigurationManager instance
     * @param initialConfig Optional initial configuration
     */
    constructor(initialConfig?: Partial<ConfigFile>);
    /**
     * Load configuration from a file
     * @param filePath Path to the configuration file
     * @returns This ConfigurationManager instance for chaining
     */
    loadFromFile(filePath: string): ConfigurationManager;
    /**
     * Save the current configuration to a file
     * @param filePath Path to save the configuration file
     * @returns Promise that resolves when the file is saved
     */
    saveToFile(filePath?: string): Promise<void>;
    /**
     * Set the current environment
     * @param env Environment name
     * @returns This ConfigurationManager instance for chaining
     */
    setEnvironment(env: string): ConfigurationManager;
    /**
     * Get the current environment name
     * @returns The current environment name
     */
    getEnvironment(): string;
    /**
     * Update configuration with new values
     * @param newConfig New configuration values to apply
     * @returns This ConfigurationManager instance for chaining
     */
    update(newConfig: Partial<ConfigFile>): ConfigurationManager;
    /**
     * Get the complete configuration
     * @returns The current configuration
     */
    getConfig(): ConfigFile;
    /**
     * Get analyzer configuration for the NetworkPerformanceAnalyzer
     * @returns Analyzer configuration
     */
    getAnalyzerConfig(): AnalyzerConfig;
    /**
     * Get a specific configuration section
     * @param section Section name
     * @returns The requested configuration section
     */
    getSection<K extends keyof ConfigFile>(section: K): ConfigFile[K] | undefined;
    /**
     * Create a default configuration file if it doesn't exist
     * @param filePath Path to create the configuration file
     * @returns Promise that resolves when the file is created
     */
    static createDefaultConfig(filePath: string): Promise<void>;
    /**
     * Merge new configuration into the current configuration
     * @param newConfig New configuration to merge
     * @private
     */
    private mergeConfig;
    /**
     * Deep merge two objects
     * @param target Target object
     * @param source Source object
     * @returns Merged object
     * @private
     */
    private deepMerge;
    /**
     * Check if a value is an object
     * @param item Value to check
     * @returns True if the value is an object
     * @private
     */
    private isObject;
}
//# sourceMappingURL=ConfigurationManager.d.ts.map