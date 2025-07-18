# Extending the Network Performance Analyzer

This document provides guidance on how to extend the Network Performance Analyzer with new metrics, analysis capabilities, and report sections.

## Table of Contents

1. [Configuration System](#configuration-system)
2. [Plugin Architecture](#plugin-architecture)
3. [Creating Custom Plugins](#creating-custom-plugins)
4. [Customizing Report Templates](#customizing-report-templates)
5. [Environment-Specific Configuration](#environment-specific-configuration)

## Configuration System

The Network Performance Analyzer uses a flexible configuration system that allows you to customize various aspects of the analysis process.

### Configuration File Structure

The configuration file is a JSON file with the following structure:

```json
{
  "analysis": {
    "continueOnError": true,
    "logProgress": true,
    "useParallelProcessing": true,
    "maxParallelTasks": 4,
    "enablePerformanceMonitoring": false,
    "memoryThresholdPercent": 80
  },
  "anomalyThresholds": {
    "bandwidthVariation": 0.2,
    "latencyVariation": 0.3,
    "packetLossThreshold": 0.05,
    "dnsResponseTimeVariation": 0.5,
    "cpuUtilizationThreshold": 0.8
  },
  "reporting": {
    "outputDirectory": "./reports",
    "defaultFilename": "network-analysis-report.md",
    "includeSections": [
      "executive-summary",
      "configuration-overview",
      "detailed-tables",
      "visualizations",
      "anomalies",
      "recommendations"
    ],
    "format": "markdown"
  },
  "plugins": {
    "enabled": ["example-analyzer"],
    "config": {
      "example-analyzer": {
        "bandwidthWeight": 0.4,
        "latencyWeight": 0.4,
        "packetLossWeight": 0.2
      }
    }
  },
  "environments": {
    "development": {
      "analysis": {
        "logProgress": true,
        "enablePerformanceMonitoring": true
      }
    },
    "production": {
      "analysis": {
        "logProgress": false,
        "enablePerformanceMonitoring": false
      }
    }
  }
}
```

### Creating and Loading Configuration

You can create a default configuration file using the `ConfigurationManager.createDefaultConfig()` method:

```typescript
import { ConfigurationManager } from './config/ConfigurationManager';

// Create default configuration file
await ConfigurationManager.createDefaultConfig('./config.json');

// Load configuration from file
const configManager = new ConfigurationManager();
configManager.loadFromFile('./config.json');

// Get analyzer configuration
const analyzerConfig = configManager.getAnalyzerConfig();
```

### Customizing Configuration

You can customize the configuration programmatically:

```typescript
// Update configuration
configManager.update({
  analysis: {
    maxParallelTasks: 8
  },
  anomalyThresholds: {
    bandwidthVariation: 0.1
  }
});

// Save updated configuration
await configManager.saveToFile('./custom-config.json');
```

## Plugin Architecture

The Network Performance Analyzer includes a plugin architecture that allows you to extend its functionality with custom analysis capabilities.

### Plugin Types

Plugins can be of different types:

- **analyzer**: Adds new analysis capabilities
- **reporter**: Customizes report generation
- **parser**: Adds support for new data formats
- **validator**: Adds custom validation rules
- **utility**: Provides utility functions

### Plugin Interface

All plugins must implement the `Plugin` interface:

```typescript
interface Plugin {
  name: string;
  description: string;
  version: string;
  initialize(config: any): Promise<void>;
  execute(context: PluginContext): Promise<any>;
}
```

## Creating Custom Plugins

### Basic Plugin Structure

Here's an example of a basic analyzer plugin:

```typescript
import { Plugin, PluginContext } from './PluginManager';

class CustomAnalyzerPlugin implements Plugin {
  name = 'custom-analyzer';
  description = 'Custom analyzer plugin';
  version = '1.0.0';
  private config: any = {};
  
  async initialize(config: any): Promise<void> {
    this.config = config || {};
  }
  
  async execute(context: PluginContext): Promise<any> {
    const { datasets } = context;
    
    // Perform custom analysis
    const results = {
      customMetric: this.calculateCustomMetric(datasets)
    };
    
    return results;
  }
  
  private calculateCustomMetric(datasets: any[]): any {
    // Custom metric calculation logic
    return { /* custom metrics */ };
  }
}

// Export plugin metadata
export const type = 'analyzer';
export const author = 'Your Name';

// Export plugin as default
export default new CustomAnalyzerPlugin();
```

### Registering and Using Plugins

To use custom plugins:

1. Place your plugin file in a plugin directory (e.g., `./plugins/`)
2. Register the plugin directory with the PluginManager
3. Enable the plugin in the configuration

```typescript
import { PluginManager } from './plugins/PluginManager';
import { ConfigurationManager } from './config/ConfigurationManager';

// Create configuration manager
const configManager = new ConfigurationManager();

// Create plugin manager
const pluginManager = new PluginManager(configManager);

// Add plugin directory
pluginManager.addPluginDirectory('./plugins');

// Discover plugins
await pluginManager.discoverPlugins();

// Enable a plugin
pluginManager.enablePlugin('custom-analyzer');

// Execute plugins of a specific type
const analyzerResults = await pluginManager.executePlugins('analyzer', {
  datasets: /* your datasets */
});
```

## Customizing Report Templates

The Network Performance Analyzer uses a template-based report generation system that allows you to customize the format and content of reports.

### Report Template Structure

A report template consists of multiple sections, each with its own template string:

```typescript
interface ReportTemplate {
  name: string;
  description: string;
  format: 'markdown' | 'html' | 'json';
  sections: TemplateSection[];
}

interface TemplateSection {
  id: string;
  name: string;
  template: string;
  required: boolean;
  order: number;
}
```

### Creating Custom Templates

You can create custom templates by modifying the default template:

```typescript
import { ReportTemplateManager } from './services/ReportTemplateManager';
import { ConfigurationManager } from './config/ConfigurationManager';

// Create configuration manager
const configManager = new ConfigurationManager();

// Create template manager
const templateManager = new ReportTemplateManager(configManager);

// Create custom template
const customTemplate = templateManager.createCustomTemplate({
  name: 'Custom Template',
  description: 'My custom report template',
  sections: [
    {
      id: 'custom-section',
      name: 'Custom Analysis',
      template: '## Custom Analysis\n\n{{#each customMetrics}}* {{name}}: {{value}}\n{{/each}}\n',
      required: false,
      order: 5
    }
  ]
});

// Register custom template
templateManager.registerTemplate('custom', customTemplate);

// Set as active template
templateManager.setActiveTemplate('custom');

// Save template to file
await templateManager.saveTemplateToFile('custom', './templates/custom-template.json');
```

### Template Variables and Helpers

Templates support the following syntax:

- `{{variable}}`: Insert a variable value
- `{{#each array}}...{{/each}}`: Loop through an array
- `{{#if condition}}...{{else}}...{{/if}}`: Conditional content

## Environment-Specific Configuration

The Network Performance Analyzer supports environment-specific configuration, allowing you to have different settings for development, testing, and production environments.

### Setting the Environment

```typescript
// Set environment
configManager.setEnvironment('production');

// Get current environment
const env = configManager.getEnvironment();
```

### Environment-Specific Configuration

Define environment-specific settings in the configuration file:

```json
{
  "environments": {
    "development": {
      "analysis": {
        "logProgress": true,
        "enablePerformanceMonitoring": true
      }
    },
    "production": {
      "analysis": {
        "logProgress": false,
        "enablePerformanceMonitoring": false
      }
    }
  }
}
```

## Best Practices

1. **Use the Configuration System**: Store all configurable parameters in the configuration system rather than hardcoding them.

2. **Create Modular Plugins**: Design plugins to be modular and focused on a specific task.

3. **Follow the Plugin Interface**: Ensure your plugins implement the Plugin interface correctly.

4. **Handle Errors Gracefully**: Add proper error handling in your plugins to prevent failures from affecting the entire analysis process.

5. **Document Your Extensions**: Provide clear documentation for your custom plugins and templates.

6. **Use Environment-Specific Configuration**: Leverage environment-specific configuration for different deployment scenarios.

7. **Test Your Extensions**: Write unit tests for your custom plugins and templates to ensure they work correctly.

## Example: Adding a New Metric

Here's a complete example of adding a new metric to the analyzer:

1. Create a custom analyzer plugin:

```typescript
// plugins/BandwidthStabilityAnalyzer.ts
import { Plugin, PluginContext } from '../src/plugins/PluginManager';

class BandwidthStabilityAnalyzer implements Plugin {
  name = 'bandwidth-stability-analyzer';
  description = 'Analyzes bandwidth stability across test runs';
  version = '1.0.0';
  private config: any = {};
  
  async initialize(config: any): Promise<void> {
    this.config = config || {};
  }
  
  async execute(context: PluginContext): Promise<any> {
    const { datasets } = context;
    
    // Group datasets by configuration
    const configGroups = this.groupByConfiguration(datasets);
    const results = [];
    
    // Calculate stability for each configuration
    for (const [config, configDatasets] of Object.entries(configGroups)) {
      const bandwidthValues: number[] = [];
      
      // Extract bandwidth values
      for (const dataset of configDatasets) {
        if (dataset.results && dataset.results.iperfTests) {
          for (const test of dataset.results.iperfTests) {
            if (test.bandwidthMbps) {
              bandwidthValues.push(test.bandwidthMbps);
            }
          }
        }
      }
      
      // Calculate stability metrics
      const mean = this.calculateMean(bandwidthValues);
      const stdDev = this.calculateStdDev(bandwidthValues, mean);
      const stabilityScore = this.calculateStabilityScore(stdDev, mean);
      
      results.push({
        configuration: config,
        mean,
        stdDev,
        stabilityScore,
        variationCoefficient: stdDev / mean
      });
    }
    
    return {
      bandwidthStability: results.sort((a, b) => b.stabilityScore - a.stabilityScore)
    };
  }
  
  private groupByConfiguration(datasets: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};
    
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
  
  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  private calculateStdDev(values: number[], mean: number): number {
    if (values.length <= 1) return 0;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
  
  private calculateStabilityScore(stdDev: number, mean: number): number {
    if (mean === 0) return 0;
    const coefficientOfVariation = stdDev / mean;
    return Math.max(0, Math.min(1, 1 - (coefficientOfVariation / (this.config.maxVariation || 0.5))));
  }
}

export const type = 'analyzer';
export const author = 'Your Name';
export default new BandwidthStabilityAnalyzer();
```

2. Add a custom report section template:

```typescript
// Create custom template with bandwidth stability section
const customTemplate = templateManager.createCustomTemplate({
  sections: [
    {
      id: 'bandwidth-stability',
      name: 'Bandwidth Stability Analysis',
      template: '## Bandwidth Stability Analysis\n\nThe following table shows bandwidth stability metrics across different configurations:\n\n| Configuration | Stability Score | Mean (Mbps) | Std Dev | Variation Coefficient |\n|--------------|----------------|------------|---------|------------------------|\n{{#each bandwidthStability}}| {{configuration}} | {{stabilityScore}} | {{mean}} | {{stdDev}} | {{variationCoefficient}} |\n{{/each}}\n',
      required: false,
      order: 4
    }
  ]
});
```

3. Update the configuration to enable the plugin:

```json
{
  "plugins": {
    "enabled": ["bandwidth-stability-analyzer"],
    "config": {
      "bandwidth-stability-analyzer": {
        "maxVariation": 0.5
      }
    }
  },
  "reporting": {
    "includeSections": [
      "executive-summary",
      "configuration-overview",
      "bandwidth-stability",
      "detailed-tables",
      "recommendations"
    ]
  }
}
```

4. Integrate the plugin results into the report data:

```typescript
// In your report generation code
const pluginResults = await pluginManager.executePlugins('analyzer', { datasets });

// Merge plugin results with analysis results
const reportData = {
  ...analysisResults,
  ...pluginResults.reduce((acc, result) => ({ ...acc, ...result }), {})
};

// Generate report using template
const report = templateManager.applyTemplate(templateManager.getActiveTemplate(), reportData);
```

By following these steps, you can extend the Network Performance Analyzer with custom metrics, analysis capabilities, and report sections.