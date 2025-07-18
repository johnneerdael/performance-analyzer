// Configuration Manager for Network Performance Analyzer
import fs from 'fs-extra';
import path from 'path';
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
export const DEFAULT_CONFIG: ConfigFile = {
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
export class ConfigurationManager {
  private config: ConfigFile;
  private configPath: string | null = null;
  private environment: string = 'development';
  
  /**
   * Create a new ConfigurationManager instance
   * @param initialConfig Optional initial configuration
   */
  constructor(initialConfig?: Partial<ConfigFile>) {
    // Start with default configuration
    this.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    
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
  loadFromFile(filePath: string): ConfigurationManager {
    try {
      if (fs.existsSync(filePath)) {
        const fileConfig = fs.readJsonSync(filePath);
        this.configPath = filePath;
        this.mergeConfig(fileConfig);
        console.log(`Configuration loaded from ${filePath}`);
      } else {
        console.warn(`Configuration file not found: ${filePath}`);
      }
    } catch (error) {
      console.error(`Error loading configuration from ${filePath}:`, error);
    }
    
    return this;
  }
  
  /**
   * Save the current configuration to a file
   * @param filePath Path to save the configuration file
   * @returns Promise that resolves when the file is saved
   */
  async saveToFile(filePath?: string): Promise<void> {
    const savePath = filePath || this.configPath || 'config.json';
    
    try {
      // Ensure directory exists
      await fs.ensureDir(path.dirname(savePath));
      
      // Write configuration to file
      await fs.writeJson(savePath, this.config, { spaces: 2 });
      
      this.configPath = savePath;
      console.log(`Configuration saved to ${savePath}`);
    } catch (error) {
      console.error(`Error saving configuration to ${savePath}:`, error);
      throw error;
    }
  }
  
  /**
   * Set the current environment
   * @param env Environment name
   * @returns This ConfigurationManager instance for chaining
   */
  setEnvironment(env: string): ConfigurationManager {
    this.environment = env;
    
    // Apply environment-specific configuration if available
    if (this.config.environments && this.config.environments[env]) {
      this.mergeConfig(this.config.environments[env] as ConfigFile);
      console.log(`Applied ${env} environment configuration`);
    }
    
    return this;
  }
  
  /**
   * Get the current environment name
   * @returns The current environment name
   */
  getEnvironment(): string {
    return this.environment;
  }
  
  /**
   * Update configuration with new values
   * @param newConfig New configuration values to apply
   * @returns This ConfigurationManager instance for chaining
   */
  update(newConfig: Partial<ConfigFile>): ConfigurationManager {
    this.mergeConfig(newConfig);
    return this;
  }
  
  /**
   * Get the complete configuration
   * @returns The current configuration
   */
  getConfig(): ConfigFile {
    return JSON.parse(JSON.stringify(this.config));
  }
  
  /**
   * Get analyzer configuration for the NetworkPerformanceAnalyzer
   * @returns Analyzer configuration
   */
  getAnalyzerConfig(): AnalyzerConfig {
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
        ? path.join(reporting.outputDirectory, reporting.defaultFilename || 'network-analysis-report.md')
        : undefined
    };
  }
  
  /**
   * Get a specific configuration section
   * @param section Section name
   * @returns The requested configuration section
   */
  getSection<K extends keyof ConfigFile>(section: K): ConfigFile[K] {
    return this.config[section] ? JSON.parse(JSON.stringify(this.config[section])) : undefined;
  }
  
  /**
   * Create a default configuration file if it doesn't exist
   * @param filePath Path to create the configuration file
   * @returns Promise that resolves when the file is created
   */
  static async createDefaultConfig(filePath: string): Promise<void> {
    try {
      if (!await fs.pathExists(filePath)) {
        // Ensure directory exists
        await fs.ensureDir(path.dirname(filePath));
        
        // Write default configuration to file
        await fs.writeJson(filePath, DEFAULT_CONFIG, { spaces: 2 });
        
        console.log(`Default configuration created at ${filePath}`);
      }
    } catch (error) {
      console.error(`Error creating default configuration at ${filePath}:`, error);
      throw error;
    }
  }
  
  /**
   * Merge new configuration into the current configuration
   * @param newConfig New configuration to merge
   * @private
   */
  private mergeConfig(newConfig: Partial<ConfigFile>): void {
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
  private deepMerge(target: any, source: any): any {
    const output = { ...target };
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
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
  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }
}