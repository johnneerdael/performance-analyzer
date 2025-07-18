"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationManager = exports.DEFAULT_CONFIG = void 0;
// Configuration Manager for Network Performance Analyzer
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
/**
 * Default configuration values
 */
exports.DEFAULT_CONFIG = {
    analysis: {
        continueOnError: true,
        logProgress: true,
        useParallelProcessing: true,
        maxParallelTasks: 4,
        enablePerformanceMonitoring: false,
        memoryThresholdPercent: 80
    },
    anomalyThresholds: {
        bandwidthVariation: 0.2,
        latencyVariation: 0.3,
        packetLossThreshold: 0.05,
        dnsResponseTimeVariation: 0.5,
        cpuUtilizationThreshold: 0.8
    },
    reporting: {
        outputDirectory: './reports',
        defaultFilename: 'network-analysis-report.md',
        includeSections: ['executive-summary', 'configuration-overview', 'detailed-tables', 'visualizations', 'anomalies', 'recommendations'],
        format: 'markdown'
    },
    plugins: {
        enabled: []
    },
    environments: {}
};
/**
 * Configuration Manager for loading, validating, and providing access to configuration
 */
class ConfigurationManager {
    /**
     * Create a new ConfigurationManager instance
     * @param initialConfig Optional initial configuration
     */
    constructor(initialConfig) {
        this.configPath = null;
        this.environment = 'development';
        // Start with default configuration
        this.config = JSON.parse(JSON.stringify(exports.DEFAULT_CONFIG));
        // Apply initial configuration if provided
        if (initialConfig) {
            this.mergeConfig(initialConfig);
        }
    }
    /**
     * Load configuration from a file
     * @param filePath Path to the configuration file
     * @returns This ConfigurationManager instance for chaining
     */
    loadFromFile(filePath) {
        try {
            if (fs_extra_1.default.existsSync(filePath)) {
                const fileConfig = fs_extra_1.default.readJsonSync(filePath);
                this.configPath = filePath;
                this.mergeConfig(fileConfig);
                console.log(`Configuration loaded from ${filePath}`);
            }
            else {
                console.warn(`Configuration file not found: ${filePath}`);
            }
        }
        catch (error) {
            console.error(`Error loading configuration from ${filePath}:`, error);
        }
        return this;
    }
    /**
     * Save the current configuration to a file
     * @param filePath Path to save the configuration file
     * @returns Promise that resolves when the file is saved
     */
    async saveToFile(filePath) {
        const savePath = filePath || this.configPath || 'config.json';
        try {
            // Ensure directory exists
            await fs_extra_1.default.ensureDir(path_1.default.dirname(savePath));
            // Write configuration to file
            await fs_extra_1.default.writeJson(savePath, this.config, { spaces: 2 });
            this.configPath = savePath;
            console.log(`Configuration saved to ${savePath}`);
        }
        catch (error) {
            console.error(`Error saving configuration to ${savePath}:`, error);
            throw error;
        }
    }
    /**
     * Set the current environment
     * @param env Environment name
     * @returns This ConfigurationManager instance for chaining
     */
    setEnvironment(env) {
        this.environment = env;
        // Apply environment-specific configuration if available
        if (this.config.environments && this.config.environments[env]) {
            this.mergeConfig(this.config.environments[env]);
            console.log(`Applied ${env} environment configuration`);
        }
        return this;
    }
    /**
     * Get the current environment name
     * @returns The current environment name
     */
    getEnvironment() {
        return this.environment;
    }
    /**
     * Update configuration with new values
     * @param newConfig New configuration values to apply
     * @returns This ConfigurationManager instance for chaining
     */
    update(newConfig) {
        this.mergeConfig(newConfig);
        return this;
    }
    /**
     * Get the complete configuration
     * @returns The current configuration
     */
    getConfig() {
        return JSON.parse(JSON.stringify(this.config));
    }
    /**
     * Get analyzer configuration for the NetworkPerformanceAnalyzer
     * @returns Analyzer configuration
     */
    getAnalyzerConfig() {
        const { analysis, anomalyThresholds, reporting } = this.config;
        return {
            continueOnError: analysis?.continueOnError,
            logProgress: analysis?.logProgress,
            useParallelProcessing: analysis?.useParallelProcessing,
            maxParallelTasks: analysis?.maxParallelTasks,
            enablePerformanceMonitoring: analysis?.enablePerformanceMonitoring,
            memoryThresholdPercent: analysis?.memoryThresholdPercent,
            anomalyThresholds: anomalyThresholds ? { ...anomalyThresholds } : undefined,
            reportOutputPath: reporting?.outputDirectory
                ? path_1.default.join(reporting.outputDirectory, reporting.defaultFilename || 'network-analysis-report.md')
                : undefined
        };
    }
    /**
     * Get a specific configuration section
     * @param section Section name
     * @returns The requested configuration section
     */
    getSection(section) {
        return this.config[section] ? JSON.parse(JSON.stringify(this.config[section])) : undefined;
    }
    /**
     * Create a default configuration file if it doesn't exist
     * @param filePath Path to create the configuration file
     * @returns Promise that resolves when the file is created
     */
    static async createDefaultConfig(filePath) {
        try {
            if (!await fs_extra_1.default.pathExists(filePath)) {
                // Ensure directory exists
                await fs_extra_1.default.ensureDir(path_1.default.dirname(filePath));
                // Write default configuration to file
                await fs_extra_1.default.writeJson(filePath, exports.DEFAULT_CONFIG, { spaces: 2 });
                console.log(`Default configuration created at ${filePath}`);
            }
        }
        catch (error) {
            console.error(`Error creating default configuration at ${filePath}:`, error);
            throw error;
        }
    }
    /**
     * Merge new configuration into the current configuration
     * @param newConfig New configuration to merge
     * @private
     */
    mergeConfig(newConfig) {
        // Deep merge configuration
        this.config = this.deepMerge(this.config, newConfig);
    }
    /**
     * Deep merge two objects
     * @param target Target object
     * @param source Source object
     * @returns Merged object
     * @private
     */
    deepMerge(target, source) {
        const output = { ...target };
        if (this.isObject(target) && this.isObject(source)) {
            Object.keys(source).forEach(key => {
                if (this.isObject(source[key])) {
                    if (!(key in target)) {
                        Object.assign(output, { [key]: source[key] });
                    }
                    else {
                        output[key] = this.deepMerge(target[key], source[key]);
                    }
                }
                else {
                    Object.assign(output, { [key]: source[key] });
                }
            });
        }
        return output;
    }
    /**
     * Check if a value is an object
     * @param item Value to check
     * @returns True if the value is an object
     * @private
     */
    isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }
}
exports.ConfigurationManager = ConfigurationManager;
//# sourceMappingURL=ConfigurationManager.js.map