# Network Performance Analyzer API Documentation

This document provides detailed information about the Network Performance Analyzer API for developers who want to integrate the analyzer into their own applications or extend its functionality.

## Table of Contents

1. [Core API](#core-api)
2. [Configuration API](#configuration-api)
3. [Plugin API](#plugin-api)
4. [Report Template API](#report-template-api)
5. [Error Handling](#error-handling)
6. [Performance Monitoring](#performance-monitoring)
7. [Utility Functions](#utility-functions)

## Core API

### NetworkPerformanceAnalyzer

The main class that orchestrates the entire analysis workflow.

```typescript
import {
  createNetworkPerformanceAnalyzer,
  AnalyzerConfig,
} from "network-performance-analyzer";

// Create analyzer with configuration
const config: AnalyzerConfig = {
  continueOnError: true,
  logProgress: true,
  reportOutputPath: "./reports/analysis.md",
  anomalyThresholds: {
    bandwidthVariation: 0.2,
    latencyVariation: 0.3,
  },
  maxParallelTasks: 4,
  enablePerformanceMonitoring: false,
};

const analyzer = createNetworkPerformanceAnalyzer(config);

// Run analysis
const report = await analyzer.analyze("./test-datasets");
```

#### AnalyzerConfig Interface

```typescript
interface AnalyzerConfig {
  /**
   * Whether to continue analysis when a dataset fails to parse
   * @default true
   */
  continueOnError?: boolean;

  /**
   * Whether to log progress information during analysis
   * @default true
   */
  logProgress?: boolean;

  /**
   * Path to save the generated report
   */
  reportOutputPath?: string;

  /**
   * Custom thresholds for anomaly detection
   */
  anomalyThresholds?: {
    bandwidthVariation?: number;
    latencyVariation?: number;
    packetLossThreshold?: number;
    dnsResponseTimeVariation?: number;
    cpuUtilizationThreshold?: number;
  };

  /**
   * Whether to use parallel processing for dataset analysis
   * @default true
   */
  useParallelProcessing?: boolean;

  /**
   * Maximum number of parallel tasks to run
   * @default 4
   */
  maxParallelTasks?: number;

  /**
   * Whether to enable performance monitoring
   * @default false
   */
  enablePerformanceMonitoring?: boolean;

  /**
   * Maximum memory usage percentage before triggering garbage collection
   * @default 80
   */
  memoryThresholdPercent?: number;

  /**
   * Path to configuration file
   */
  configPath?: string;

  /**
   * Environment to use for configuration
   * @default 'development'
   */
  environment?: string;

  /**
   * Paths to plugin directories
   */
  pluginDirectories?: string[];

  /**
   * Report template ID to use
   * @default 'default'
   */
  reportTemplateId?: string;

  /**
   * Report sections to include
   */
  includeSections?: string[];
}
```

### DatasetDiscoveryService

Service for discovering datasets in a directory.

```typescript
import { DefaultDatasetDiscoveryService } from "network-performance-analyzer";

const discoveryService = new DefaultDatasetDiscoveryService();
const datasets = await discoveryService.discoverDatasets("./test-datasets");
```

### DataParser

Service for parsing dataset files.

```typescript
import { DefaultDataParser } from "network-performance-analyzer";

const parser = new DefaultDataParser();
const parameters = await parser.parseParameters(
  "./dataset/parameters-results.json"
);
const results = await parser.parseResults("./dataset/results.json");
```

### AnalysisEngine

Service for analyzing performance data.

```typescript
import { DefaultAnalysisEngine } from "network-performance-analyzer";

const analysisEngine = new DefaultAnalysisEngine();
const iperfAnalysis = await analysisEngine.analyzeIperfPerformance(datasets);
const dnsAnalysis = await analysisEngine.analyzeDnsPerformance(datasets);
const configComparison = await analysisEngine.compareConfigurations(datasets);
const anomalies = await analysisEngine.detectAnomalies(datasets);
```

### ReportGenerator

Service for generating reports.

```typescript
import { DefaultReportGenerator } from "network-performance-analyzer";

const reportGenerator = new DefaultReportGenerator();
const report = await reportGenerator.generateReport(analysisResults);
```

## Configuration API

### ConfigurationManager

Manages configuration loading, validation, and access.

```typescript
import { ConfigurationManager } from "network-performance-analyzer";

// Create a new configuration manager
const configManager = new ConfigurationManager();

// Load configuration from file
configManager.loadFromFile("./config.json");

// Set environment
configManager.setEnvironment("production");

// Update configuration
configManager.update({
  analysis: {
    maxParallelTasks: 8,
  },
});

// Get analyzer configuration
const analyzerConfig = configManager.getAnalyzerConfig();

// Save configuration to file
await configManager.saveToFile("./updated-config.json");

// Create default configuration file
await ConfigurationManager.createDefaultConfig("./default-config.json");
```

## Plugin API

### Plugin Interface

Interface that all plugins must implement.

```typescript
interface Plugin {
  /**
   * Unique name of the plugin
   */
  name: string;

  /**
   * Description of the plugin functionality
   */
  description: string;

  /**
   * Version of the plugin
   */
  version: string;

  /**
   * Initialize the plugin with configuration
   * @param config Plugin configuration
   */
  initialize(config: any): Promise<void>;

  /**
   * Execute the plugin functionality
   * @param context Context data for plugin execution
   * @returns Result of plugin execution
   */
  execute(context: PluginContext): Promise<any>;
}
```

### PluginManager

Manages plugin discovery, registration, and execution.

```typescript
import { PluginManager } from "network-performance-analyzer";

// Create plugin manager
const pluginManager = new PluginManager(configManager);

// Add plugin directory
pluginManager.addPluginDirectory("./plugins");

// Discover plugins
const plugins = await pluginManager.discoverPlugins();

// Register a custom plugin
pluginManager.registerPlugin(customPlugin, { enabled: true });

// Enable a plugin
pluginManager.enablePlugin("custom-analyzer");

// Disable a plugin
pluginManager.disablePlugin("example-analyzer");

// Get all plugins
const allPlugins = pluginManager.getPlugins();

// Get enabled plugins
const enabledPlugins = pluginManager.getEnabledPlugins();

// Get plugins by type
const analyzerPlugins = pluginManager.getPluginsByType("analyzer");

// Execute plugins of a specific type
const results = await pluginManager.executePlugins("analyzer", { datasets });

// Load enabled plugins from configuration
await pluginManager.loadEnabledPlugins();
```

### Creating a Custom Plugin

Example of creating a custom analyzer plugin:

```typescript
import { Plugin, PluginContext } from "network-performance-analyzer";

class CustomAnalyzerPlugin implements Plugin {
  name = "custom-analyzer";
  description = "Custom analyzer plugin";
  version = "1.0.0";
  private config: any = {};

  async initialize(config: any): Promise<void> {
    this.config = config || {};
  }

  async execute(context: PluginContext): Promise<any> {
    const { datasets } = context;

    // Perform custom analysis
    const results = {
      customMetric: this.calculateCustomMetric(datasets),
    };

    return results;
  }

  private calculateCustomMetric(datasets: any[]): any {
    // Custom metric calculation logic
    return {
      /* custom metrics */
    };
  }
}

// Export plugin metadata
export const type = "analyzer";
export const author = "Your Name";

// Export plugin as default
export default new CustomAnalyzerPlugin();
```

## Report Template API

### ReportTemplateManager

Manages report templates for customizing report generation.

```typescript
import { ReportTemplateManager } from "network-performance-analyzer";

// Create template manager
const templateManager = new ReportTemplateManager(configManager);

// Get default template
const defaultTemplate = templateManager.getDefaultTemplate();

// Create custom template
const customTemplate = templateManager.createCustomTemplate({
  name: "Custom Template",
  description: "My custom report template",
  sections: [
    {
      id: "custom-section",
      name: "Custom Analysis",
      template:
        "## Custom Analysis\n\n{{#each customMetrics}}* {{name}}: {{value}}\n{{/each}}\n",
      required: false,
      order: 5,
    },
  ],
});

// Register custom template
templateManager.registerTemplate("custom", customTemplate);

// Set active template
templateManager.setActiveTemplate("custom");

// Get active template
const activeTemplate = templateManager.getActiveTemplate();

// Apply template to data
const report = templateManager.applyTemplate(activeTemplate, reportData);

// Save template to file
await templateManager.saveTemplateToFile(
  "custom",
  "./templates/custom-template.json"
);

// Load template from file
const loadedTemplate = await templateManager.loadTemplateFromFile(
  "./templates/custom-template.json"
);
```

## Error Handling

### ErrorHandler

Handles and logs errors during analysis.

```typescript
import { DefaultErrorHandler } from "network-performance-analyzer";

const errorHandler = new DefaultErrorHandler();

// Log an error
errorHandler.logError(
  new Error("Something went wrong"),
  "Error during analysis"
);

// Get all logged errors
const errors = errorHandler.getErrors();

// Clear errors
errorHandler.clearErrors();

// Check if there are any errors
const hasErrors = errorHandler.hasErrors();

// Get error count
const errorCount = errorHandler.getErrorCount();
```

## Performance Monitoring

### PerformanceMonitor

Monitors performance metrics during analysis.

```typescript
import { PerformanceMonitor } from "network-performance-analyzer";

// Create performance monitor
const monitor = new PerformanceMonitor({
  monitoringInterval: 5000,
  memoryThresholdPercent: 80,
  logToConsole: true,
});

// Start monitoring
monitor.start();

// Start operation timing
monitor.startOperation("parseDatasetFiles");

// End operation timing
const duration = monitor.endOperation("parseDatasetFiles");

// Get memory usage
const memoryUsage = monitor.getMemoryUsage();

// Generate performance report
const report = monitor.generateReport();

// Stop monitoring
monitor.stop();
```

## Utility Functions

### StreamingJsonParser

Parses large JSON files using streaming to reduce memory usage.

```typescript
import { StreamingJsonParser } from "network-performance-analyzer";

// Create parser
const parser = new StreamingJsonParser();

// Parse large JSON file
const results = await parser.parseFile("./large-dataset.json");

// Parse with path filter (only extract specific paths)
const filteredResults = await parser.parseFile("./large-dataset.json", {
  pathFilter: ["iperfTests", "dnsResults"],
});
```

### DataValidator

Validates dataset structure and content.

```typescript
import { DataValidator } from "network-performance-analyzer";

// Create validator
const validator = new DataValidator();

// Validate dataset
const isValid = validator.validateDataset(dataset);

// Get validation errors
const validationErrors = validator.getValidationErrors();
```

## Complete Example

Here's a complete example of using the Network Performance Analyzer API:

```typescript
import {
  createNetworkPerformanceAnalyzer,
  ConfigurationManager,
  PluginManager,
  ReportTemplateManager,
  AnalyzerConfig,
} from "network-performance-analyzer";

async function runAnalysis() {
  try {
    // Create configuration manager
    const configManager = new ConfigurationManager();

    // Load configuration from file or create default
    try {
      configManager.loadFromFile("./config.json");
    } catch (error) {
      await ConfigurationManager.createDefaultConfig("./config.json");
      configManager.loadFromFile("./config.json");
    }

    // Set environment
    configManager.setEnvironment("production");

    // Create plugin manager
    const pluginManager = new PluginManager(configManager);

    // Add plugin directory and discover plugins
    pluginManager.addPluginDirectory("./plugins");
    await pluginManager.discoverPlugins();

    // Enable a specific plugin
    pluginManager.enablePlugin("example-analyzer");

    // Create template manager
    const templateManager = new ReportTemplateManager(configManager);

    // Create custom template
    const customTemplate = templateManager.createCustomTemplate({
      name: "Custom Template",
      description: "My custom report template",
      sections: [
        {
          id: "custom-section",
          name: "Custom Analysis",
          template:
            "## Custom Analysis\n\n{{#each customMetrics}}* {{name}}: {{value}}\n{{/each}}\n",
          required: false,
          order: 5,
        },
      ],
    });

    // Register and set as active template
    templateManager.registerTemplate("custom", customTemplate);
    templateManager.setActiveTemplate("custom");

    // Configure analyzer
    const config: AnalyzerConfig = {
      continueOnError: true,
      logProgress: true,
      reportOutputPath: "./reports/analysis.md",
      anomalyThresholds: {
        bandwidthVariation: 0.2,
        latencyVariation: 0.3,
      },
      maxParallelTasks: 4,
      enablePerformanceMonitoring: true,
      pluginDirectories: ["./plugins"],
      reportTemplateId: "custom",
    };

    // Create analyzer
    const analyzer = createNetworkPerformanceAnalyzer(config);

    // Run analysis
    const report = await analyzer.analyze("./test-datasets");

    console.log("Analysis completed successfully");
    console.log(`Report saved to: ${config.reportOutputPath}`);

    return report;
  } catch (error) {
    console.error("Error running analysis:", error);
    throw error;
  }
}

runAnalysis().catch(console.error);
```

## Type Definitions

For complete type definitions, refer to the TypeScript declaration files included with the package.
