# Creating Custom Plugins for Network Performance Analyzer

This guide provides detailed instructions on creating custom plugins for the Network Performance Analyzer. Plugins allow you to extend the analyzer's functionality with custom metrics, analysis capabilities, and report sections.

## Table of Contents

1. [Plugin Types](#plugin-types)
2. [Plugin Structure](#plugin-structure)
3. [Creating an Analyzer Plugin](#creating-an-analyzer-plugin)
4. [Creating a Reporter Plugin](#creating-a-reporter-plugin)
5. [Creating a Parser Plugin](#creating-a-parser-plugin)
6. [Plugin Configuration](#plugin-configuration)
7. [Plugin Registration](#plugin-registration)
8. [Plugin Execution](#plugin-execution)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

## Plugin Types

The Network Performance Analyzer supports several types of plugins:

- **analyzer**: Adds new analysis capabilities and metrics
- **reporter**: Customizes report generation and formatting
- **parser**: Adds support for new data formats or sources
- **validator**: Adds custom validation rules for datasets
- **utility**: Provides utility functions for other plugins

## Plugin Structure

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

A plugin file should export:

1. The plugin instance as the default export
2. A `type` string indicating the plugin type
3. An optional `author` string

Example:

```typescript
export const type = 'analyzer';
export const author = 'Your Name';
export default new MyCustomPlugin();
```

## Creating an Analyzer Plugin

Analyzer plugins process datasets and generate additional metrics or insights. Here's a step-by-step guide to creating an analyzer plugin:

### 1. Create a new file for your plugin

Create a new file in your plugins directory, e.g., `MyCustomAnalyzer.ts`.

### 2. Import required interfaces

```typescript
import { Plugin, PluginContext } from 'network-performance-analyzer';
```

### 3. Implement the Plugin interface

```typescript
class MyCustomAnalyzer implements Plugin {
  name = 'my-custom-analyzer';
  description = 'Analyzes network performance data and calculates custom metrics';
  version = '1.0.0';
  private config: any = {};
  
  async initialize(config: any): Promise<void> {
    this.config = config || {};
    console.log(`Initializing ${this.name} plugin with config:`, this.config);
  }
  
  async execute(context: PluginContext): Promise<any> {
    console.log(`Executing ${this.name} plugin`);
    
    const { datasets } = context;
    
    if (!datasets || datasets.length === 0) {
      return { error: 'No datasets provided' };
    }
    
    // Calculate custom metrics
    const customMetrics = this.calculateCustomMetrics(datasets);
    
    return {
      customMetrics
    };
  }
  
  private calculateCustomMetrics(datasets: any[]): any {
    // Group datasets by configuration
    const configGroups = this.groupByConfiguration(datasets);
    const results = [];
    
    // Calculate metrics for each configuration
    for (const [config, configDatasets] of Object.entries(configGroups)) {
      // Extract data from datasets
      const metricValues = this.extractMetricValues(configDatasets);
      
      // Calculate statistics
      const stats = this.calculateStatistics(metricValues);
      
      // Add to results
      results.push({
        configuration: config,
        ...stats
      });
    }
    
    return results;
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
  
  private extractMetricValues(datasets: any[]): number[] {
    const values: number[] = [];
    
    for (const dataset of datasets) {
      if (dataset.results && dataset.results.iperfTests) {
        for (const test of dataset.results.iperfTests) {
          // Extract the metric you're interested in
          if (test.bandwidthMbps) {
            values.push(test.bandwidthMbps);
          }
        }
      }
    }
    
    return values;
  }
  
  private calculateStatistics(values: number[]): any {
    if (values.length === 0) {
      return {
        count: 0,
        min: 0,
        max: 0,
        mean: 0,
        median: 0,
        stdDev: 0
      };
    }
    
    // Sort values for percentile calculations
    const sortedValues = [...values].sort((a, b) => a - b);
    
    // Calculate statistics
    const count = values.length;
    const min = sortedValues[0];
    const max = sortedValues[count - 1];
    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / count;
    
    // Calculate median
    const midIndex = Math.floor(count / 2);
    const median = count % 2 === 0
      ? (sortedValues[midIndex - 1] + sortedValues[midIndex]) / 2
      : sortedValues[midIndex];
    
    // Calculate standard deviation
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
    const stdDev = Math.sqrt(variance);
    
    return {
      count,
      min,
      max,
      mean,
      median,
      stdDev
    };
  }
}

export const type = 'analyzer';
export const author = 'Your Name';
export default new MyCustomAnalyzer();
```

## Creating a Reporter Plugin

Reporter plugins customize the report generation process. Here's how to create one:

### 1. Create a new file for your plugin

Create a new file in your plugins directory, e.g., `MyCustomReporter.ts`.

### 2. Import required interfaces

```typescript
import { Plugin, PluginContext } from 'network-performance-analyzer';
```

### 3. Implement the Plugin interface

```typescript
class MyCustomReporter implements Plugin {
  name = 'my-custom-reporter';
  description = 'Customizes report generation with additional sections';
  version = '1.0.0';
  private config: any = {};
  
  async initialize(config: any): Promise<void> {
    this.config = config || {};
    console.log(`Initializing ${this.name} plugin with config:`, this.config);
  }
  
  async execute(context: PluginContext): Promise<any> {
    console.log(`Executing ${this.name} plugin`);
    
    const { reportContent, analysisResults } = context;
    
    if (!reportContent || !analysisResults) {
      return { error: 'Missing report content or analysis results' };
    }
    
    // Generate custom report section
    const customSection = this.generateCustomSection(analysisResults);
    
    // Return the custom section to be included in the report
    return {
      customSection
    };
  }
  
  private generateCustomSection(analysisResults: any): string {
    // Create a markdown section
    let section = '## Custom Performance Insights\n\n';
    
    // Add content based on analysis results
    if (analysisResults.iperfAnalysis && analysisResults.iperfAnalysis.bandwidthComparison) {
      section += '### Bandwidth Performance\n\n';
      section += 'Configuration | Average Bandwidth (Mbps) | Stability Score\n';
      section += '------------- | ----------------------- | --------------\n';
      
      for (const item of analysisResults.iperfAnalysis.bandwidthComparison) {
        const stability = this.calculateStabilityScore(item);
        section += `${item.configuration} | ${item.avgBandwidthMbps.toFixed(2)} | ${stability.toFixed(2)}\n`;
      }
      
      section += '\n';
    }
    
    // Add recommendations
    section += '### Custom Recommendations\n\n';
    section += '- Consider optimizing TCP window size for better performance\n';
    section += '- Monitor network congestion during peak hours\n';
    section += '- Evaluate the impact of different MTU sizes on application performance\n\n';
    
    return section;
  }
  
  private calculateStabilityScore(item: any): number {
    // Example stability calculation
    if (!item.stdDevBandwidthMbps || !item.avgBandwidthMbps) {
      return 1.0;
    }
    
    const coefficientOfVariation = item.stdDevBandwidthMbps / item.avgBandwidthMbps;
    return Math.max(0, Math.min(1, 1 - (coefficientOfVariation / 0.5)));
  }
}

export const type = 'reporter';
export const author = 'Your Name';
export default new MyCustomReporter();
```

## Creating a Parser Plugin

Parser plugins add support for new data formats or sources. Here's how to create one:

### 1. Create a new file for your plugin

Create a new file in your plugins directory, e.g., `MyCustomParser.ts`.

### 2. Import required interfaces

```typescript
import { Plugin, PluginContext } from 'network-performance-analyzer';
import fs from 'fs-extra';
import path from 'path';
```

### 3. Implement the Plugin interface

```typescript
class MyCustomParser implements Plugin {
  name = 'my-custom-parser';
  description = 'Parses custom format network performance data';
  version = '1.0.0';
  private config: any = {};
  
  async initialize(config: any): Promise<void> {
    this.config = config || {};
    console.log(`Initializing ${this.name} plugin with config:`, this.config);
  }
  
  async execute(context: PluginContext): Promise<any> {
    console.log(`Executing ${this.name} plugin`);
    
    const { datasetPath } = context;
    
    if (!datasetPath) {
      return { error: 'No dataset path provided' };
    }
    
    // Check for custom format files
    const customFiles = await this.findCustomFormatFiles(datasetPath);
    
    if (customFiles.length === 0) {
      return { message: 'No custom format files found' };
    }
    
    // Parse custom format files
    const parsedData = await this.parseCustomFiles(customFiles);
    
    return {
      customData: parsedData
    };
  }
  
  private async findCustomFormatFiles(datasetPath: string): Promise<string[]> {
    const files = await fs.readdir(datasetPath);
    return files
      .filter(file => file.endsWith('.custom') || file.endsWith('.csv'))
      .map(file => path.join(datasetPath, file));
  }
  
  private async parseCustomFiles(filePaths: string[]): Promise<any[]> {
    const results = [];
    
    for (const filePath of filePaths) {
      try {
        if (filePath.endsWith('.csv')) {
          const data = await this.parseCsvFile(filePath);
          results.push(data);
        } else if (filePath.endsWith('.custom')) {
          const data = await this.parseCustomFormat(filePath);
          results.push(data);
        }
      } catch (error) {
        console.error(`Error parsing file ${filePath}:`, error);
      }
    }
    
    return results;
  }
  
  private async parseCsvFile(filePath: string): Promise<any> {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    // Parse header
    const header = lines[0].split(',').map(col => col.trim());
    
    // Parse data rows
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(val => val.trim());
      
      if (values.length === header.length) {
        const row: Record<string, any> = {};
        
        for (let j = 0; j < header.length; j++) {
          // Try to convert to number if possible
          const numValue = parseFloat(values[j]);
          row[header[j]] = isNaN(numValue) ? values[j] : numValue;
        }
        
        rows.push(row);
      }
    }
    
    return {
      type: 'csv',
      source: path.basename(filePath),
      data: rows
    };
  }
  
  private async parseCustomFormat(filePath: string): Promise<any> {
    const content = await fs.readFile(filePath, 'utf8');
    
    // Implement your custom format parsing logic here
    // This is just a placeholder example
    const sections = content.split('---').filter(section => section.trim());
    const parsedSections = sections.map(section => {
      const lines = section.split('\n').filter(line => line.trim());
      const sectionData: Record<string, any> = {};
      
      for (const line of lines) {
        const match = line.match(/^([^:]+):\s*(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          
          // Try to convert to number if possible
          const numValue = parseFloat(value);
          sectionData[key] = isNaN(numValue) ? value : numValue;
        }
      }
      
      return sectionData;
    });
    
    return {
      type: 'custom',
      source: path.basename(filePath),
      data: parsedSections
    };
  }
}

export const type = 'parser';
export const author = 'Your Name';
export default new MyCustomParser();
```

## Plugin Configuration

Plugins can be configured through the configuration file:

```json
{
  "plugins": {
    "enabled": ["my-custom-analyzer", "my-custom-reporter"],
    "config": {
      "my-custom-analyzer": {
        "metricWeight": 0.5,
        "thresholdValue": 0.2,
        "includeOutliers": false
      },
      "my-custom-reporter": {
        "includeCharts": true,
        "detailLevel": "high"
      }
    }
  }
}
```

Access configuration in your plugin:

```typescript
async initialize(config: any): Promise<void> {
  this.config = config || {};
  
  // Access configuration values with defaults
  this.metricWeight = this.config.metricWeight || 0.5;
  this.thresholdValue = this.config.thresholdValue || 0.2;
  this.includeOutliers = this.config.includeOutliers !== undefined ? this.config.includeOutliers : false;
}
```

## Plugin Registration

### Automatic Registration

Place your plugin file in a plugin directory and register the directory with the PluginManager:

```typescript
const pluginManager = new PluginManager(configManager);
pluginManager.addPluginDirectory('./plugins');
await pluginManager.discoverPlugins();
```

Enable your plugin in the configuration:

```json
{
  "plugins": {
    "enabled": ["my-custom-analyzer"]
  }
}
```

### Manual Registration

You can also register plugins programmatically:

```typescript
import MyCustomAnalyzer from './plugins/MyCustomAnalyzer';

const pluginManager = new PluginManager(configManager);
pluginManager.registerPlugin(MyCustomAnalyzer, {
  enabled: true,
  config: {
    metricWeight: 0.5,
    thresholdValue: 0.2
  }
});
```

## Plugin Execution

Plugins are executed automatically during the analysis process. The PluginManager executes all enabled plugins of a specific type:

```typescript
const analyzerResults = await pluginManager.executePlugins('analyzer', { datasets });
const reporterResults = await pluginManager.executePlugins('reporter', { 
  reportContent, 
  analysisResults 
});
```

## Best Practices

1. **Focus on a Single Responsibility**: Each plugin should focus on a specific task or metric.

2. **Handle Errors Gracefully**: Add proper error handling to prevent failures from affecting the entire analysis process.

```typescript
async execute(context: PluginContext): Promise<any> {
  try {
    // Plugin logic
    return results;
  } catch (error) {
    console.error(`Error executing ${this.name} plugin:`, error);
    return { error: `Plugin execution failed: ${error.message}` };
  }
}
```

3. **Provide Clear Documentation**: Document your plugin's purpose, configuration options, and output format.

4. **Use TypeScript Interfaces**: Define interfaces for your plugin's input and output data structures.

```typescript
interface CustomMetric {
  name: string;
  value: number;
  unit: string;
  description: string;
}

interface PluginResults {
  metrics: CustomMetric[];
  insights: string[];
  recommendations: string[];
}
```

5. **Optimize Performance**: Be mindful of memory usage and processing time, especially when dealing with large datasets.

6. **Add Unit Tests**: Write tests for your plugin to ensure it works correctly.

```typescript
// MyCustomAnalyzer.test.ts
import MyCustomAnalyzer from './MyCustomAnalyzer';

describe('MyCustomAnalyzer', () => {
  let plugin;
  
  beforeEach(() => {
    plugin = new MyCustomAnalyzer();
    await plugin.initialize({});
  });
  
  test('should calculate statistics correctly', () => {
    const values = [10, 20, 30, 40, 50];
    const stats = plugin.calculateStatistics(values);
    
    expect(stats.count).toBe(5);
    expect(stats.min).toBe(10);
    expect(stats.max).toBe(50);
    expect(stats.mean).toBe(30);
    expect(stats.median).toBe(30);
  });
});
```

## Troubleshooting

### Common Issues

#### Plugin Not Found

If your plugin is not being discovered:

1. Verify that the plugin file is in the correct directory
2. Check that the file has a `.js` or `.ts` extension
3. Ensure the plugin is exported as the default export
4. Verify that the `type` export is set correctly

#### Plugin Not Enabled

If your plugin is discovered but not executed:

1. Check that the plugin is enabled in the configuration
2. Verify that the plugin name in the configuration matches the plugin's `name` property
3. Ensure the plugin type is correct for the execution context

#### Plugin Execution Errors

If your plugin throws errors during execution:

1. Check the plugin's error handling
2. Verify that the plugin correctly handles missing or invalid data
3. Ensure the plugin's dependencies are available
4. Check for type errors or null/undefined values

#### Plugin Results Not Included in Report

If your plugin's results are not appearing in the report:

1. Verify that the plugin is returning the expected data structure
2. Check that the report template includes sections for your plugin's data
3. Ensure the plugin is being executed before report generation

### Debugging Tips

1. Add console.log statements to your plugin to track execution flow
2. Use the verbose logging option (`--verbose`) when running the analyzer
3. Check the error logs for detailed error messages
4. Use a debugger to step through your plugin's code

## Example Plugins

For more examples, see the following plugin implementations:

- [Example Analyzer Plugin](../src/plugins/ExampleAnalyzerPlugin.ts)
- [Bandwidth Stability Analyzer](../examples/plugins/BandwidthStabilityAnalyzer.ts)
- [Custom Report Section Plugin](../examples/plugins/CustomReportSectionPlugin.ts)

## Conclusion

Creating custom plugins is a powerful way to extend the Network Performance Analyzer with your own metrics, analysis capabilities, and report sections. By following the guidelines in this document, you can create plugins that integrate seamlessly with the analyzer and provide valuable insights from your network performance data.