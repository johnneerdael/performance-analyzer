# Extending the Network Performance Analyzer

This document provides comprehensive guidance on how to extend the Network Performance Analyzer with new metrics, analysis capabilities, and report sections. For more detailed guides on specific topics, see:

- [API Documentation](./api.md) - Detailed API reference
- [Custom Plugins Guide](./custom-plugins-guide.md) - Step-by-step guide to creating plugins

## Table of Contents

1. [Configuration System](#configuration-system)
2. [Plugin Architecture](#plugin-architecture)
3. [Creating Custom Plugins](#creating-custom-plugins)
4. [Customizing Report Templates](#customizing-report-templates)
5. [Environment-Specific Configuration](#environment-specific-configuration)
6. [Advanced Customization](#advanced-customization)
7. [Integration with External Systems](#integration-with-external-systems)

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

## Advanced Customization

### Custom Data Validators

You can create custom data validators to ensure your datasets meet specific requirements:

```typescript
import { DataValidator } from '../utils/DataValidator';

class CustomDataValidator extends DataValidator {
  constructor() {
    super();
    // Add custom validation rules
    this.addValidationRule('iperfTests', this.validateIperfTests);
    this.addValidationRule('dnsResults', this.validateDnsResults);
  }
  
  private validateIperfTests(iperfTests: any[]): boolean {
    if (!Array.isArray(iperfTests) || iperfTests.length === 0) {
      this.addValidationError('iperfTests', 'No iperf test results found');
      return false;
    }
    
    // Check for required fields in each test
    for (let i = 0; i < iperfTests.length; i++) {
      const test = iperfTests[i];
      
      if (!test.bandwidthMbps) {
        this.addValidationError('iperfTests', `Test ${i} is missing bandwidthMbps`);
        return false;
      }
      
      if (test.bandwidthMbps <= 0) {
        this.addValidationError('iperfTests', `Test ${i} has invalid bandwidthMbps: ${test.bandwidthMbps}`);
        return false;
      }
    }
    
    return true;
  }
  
  private validateDnsResults(dnsResults: any[]): boolean {
    // Implement custom DNS validation logic
    return true;
  }
}
```

### Custom Performance Monitoring

You can extend the performance monitoring capabilities:

```typescript
import { PerformanceMonitor } from '../utils/PerformanceMonitor';

class EnhancedPerformanceMonitor extends PerformanceMonitor {
  private cpuUsageHistory: number[] = [];
  private networkUsageHistory: number[] = [];
  
  constructor(options: any) {
    super(options);
    
    // Add additional monitoring metrics
    this.monitorCpuUsage();
    this.monitorNetworkUsage();
  }
  
  private monitorCpuUsage(): void {
    const interval = setInterval(() => {
      const cpuUsage = this.getCurrentCpuUsage();
      this.cpuUsageHistory.push(cpuUsage);
      
      if (cpuUsage > this.options.cpuThresholdPercent) {
        this.emit('cpu-threshold-exceeded', {
          current: cpuUsage,
          threshold: this.options.cpuThresholdPercent
        });
      }
    }, this.options.monitoringInterval);
    
    this.intervals.push(interval);
  }
  
  private monitorNetworkUsage(): void {
    // Implement network usage monitoring
  }
  
  private getCurrentCpuUsage(): number {
    // Implement CPU usage calculation
    return 0;
  }
  
  generateReport(): string {
    const baseReport = super.generateReport();
    
    // Add CPU and network usage to the report
    let enhancedReport = baseReport + '\n\n## CPU Usage\n\n';
    enhancedReport += 'Time | CPU Usage (%)\n';
    enhancedReport += '---- | ------------\n';
    
    for (let i = 0; i < this.cpuUsageHistory.length; i++) {
      const timestamp = new Date(this.startTime + i * this.options.monitoringInterval).toISOString();
      enhancedReport += `${timestamp} | ${this.cpuUsageHistory[i].toFixed(2)}\n`;
    }
    
    return enhancedReport;
  }
}
```

### Custom Streaming Data Processing

For handling large datasets efficiently:

```typescript
import { StreamingJsonParser } from '../utils/StreamingJsonParser';
import { Transform } from 'stream';

class EnhancedStreamingParser extends StreamingJsonParser {
  async parseFileWithTransform(filePath: string, transformFn: (data: any) => any): Promise<any> {
    return new Promise((resolve, reject) => {
      const results: any = {};
      
      // Create transform stream
      const transformStream = new Transform({
        objectMode: true,
        transform(chunk, encoding, callback) {
          try {
            // Apply transformation function
            const transformedChunk = transformFn(chunk);
            this.push(transformedChunk);
            callback();
          } catch (error) {
            callback(error);
          }
        }
      });
      
      // Set up pipeline
      this.createReadStream(filePath)
        .pipe(transformStream)
        .on('data', (data) => {
          // Process transformed data
          if (data.type === 'iperfTest') {
            if (!results.iperfTests) results.iperfTests = [];
            results.iperfTests.push(data.value);
          } else if (data.type === 'dnsResult') {
            if (!results.dnsResults) results.dnsResults = [];
            results.dnsResults.push(data.value);
          }
        })
        .on('error', (error) => {
          reject(error);
        })
        .on('end', () => {
          resolve(results);
        });
    });
  }
}
```

## Integration with External Systems

### Exporting Results to External Systems

You can create plugins to export analysis results to external systems:

```typescript
import { Plugin, PluginContext } from './PluginManager';
import axios from 'axios';

class ExternalSystemExporter implements Plugin {
  name = 'external-system-exporter';
  description = 'Exports analysis results to an external system';
  version = '1.0.0';
  private config: any = {};
  
  async initialize(config: any): Promise<void> {
    this.config = config || {};
    
    // Validate required configuration
    if (!this.config.apiUrl) {
      throw new Error('apiUrl is required in plugin configuration');
    }
    
    if (!this.config.apiKey) {
      throw new Error('apiKey is required in plugin configuration');
    }
  }
  
  async execute(context: PluginContext): Promise<any> {
    const { analysisResults } = context;
    
    if (!analysisResults) {
      return { error: 'No analysis results to export' };
    }
    
    try {
      // Prepare data for export
      const exportData = this.prepareExportData(analysisResults);
      
      // Send data to external system
      const response = await axios.post(this.config.apiUrl, exportData, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      return {
        exported: true,
        exportId: response.data.id,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error exporting to external system:', error);
      return {
        exported: false,
        error: error.message
      };
    }
  }
  
  private prepareExportData(analysisResults: any): any {
    // Extract relevant data for export
    return {
      summary: analysisResults.summary,
      iperfPerformance: analysisResults.iperfAnalysis?.bandwidthComparison || [],
      dnsPerformance: analysisResults.dnsAnalysis?.performanceMetrics || [],
      anomalies: analysisResults.anomalies || [],
      timestamp: new Date().toISOString(),
      source: 'network-performance-analyzer'
    };
  }
}

export const type = 'reporter';
export const author = 'Your Name';
export default new ExternalSystemExporter();
```

### Importing Data from External Sources

You can create plugins to import data from external sources:

```typescript
import { Plugin, PluginContext } from './PluginManager';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';

class ExternalDataImporter implements Plugin {
  name = 'external-data-importer';
  description = 'Imports network performance data from external sources';
  version = '1.0.0';
  private config: any = {};
  
  async initialize(config: any): Promise<void> {
    this.config = config || {};
    
    // Validate required configuration
    if (!this.config.dataSources || !Array.isArray(this.config.dataSources)) {
      throw new Error('dataSources array is required in plugin configuration');
    }
  }
  
  async execute(context: PluginContext): Promise<any> {
    const { datasetPath } = context;
    
    if (!datasetPath) {
      return { error: 'No dataset path provided' };
    }
    
    try {
      const importedDatasets = [];
      
      // Import data from each configured source
      for (const source of this.config.dataSources) {
        const data = await this.importFromSource(source);
        
        if (data) {
          // Save imported data to dataset directory
          const datasetName = `imported-${source.name}-${new Date().toISOString().replace(/[:.]/g, '-')}`;
          const datasetDir = path.join(datasetPath, datasetName);
          
          await fs.ensureDir(datasetDir);
          
          // Save results file
          const resultsFile = path.join(datasetDir, `results_${Date.now()}.json`);
          await fs.writeJson(resultsFile, data, { spaces: 2 });
          
          importedDatasets.push({
            name: datasetName,
            source: source.name,
            path: datasetDir,
            resultsFile
          });
        }
      }
      
      return {
        importedDatasets
      };
    } catch (error) {
      console.error('Error importing external data:', error);
      return {
        error: error.message
      };
    }
  }
  
  private async importFromSource(source: any): Promise<any> {
    switch (source.type) {
      case 'api':
        return this.importFromApi(source);
      case 'file':
        return this.importFromFile(source);
      default:
        throw new Error(`Unsupported source type: ${source.type}`);
    }
  }
  
  private async importFromApi(source: any): Promise<any> {
    const response = await axios.get(source.url, {
      headers: source.headers || {}
    });
    
    // Transform API response to match expected format
    return this.transformData(response.data, source.mapping);
  }
  
  private async importFromFile(source: any): Promise<any> {
    const data = await fs.readJson(source.path);
    
    // Transform file data to match expected format
    return this.transformData(data, source.mapping);
  }
  
  private transformData(data: any, mapping: any): any {
    if (!mapping) return data;
    
    const result: any = {};
    
    // Map iperf tests
    if (mapping.iperfTests && data[mapping.iperfTests.source]) {
      result.iperfTests = data[mapping.iperfTests.source].map((item: any) => ({
        server: item[mapping.iperfTests.serverField] || 'unknown',
        scenario: item[mapping.iperfTests.scenarioField] || 'unknown',
        success: item[mapping.iperfTests.successField] !== undefined ? item[mapping.iperfTests.successField] : true,
        bandwidthMbps: parseFloat(item[mapping.iperfTests.bandwidthField]) || 0,
        jitterMs: parseFloat(item[mapping.iperfTests.jitterField]) || 0,
        packetLoss: parseFloat(item[mapping.iperfTests.packetLossField]) || 0
      }));
    }
    
    // Map DNS results
    if (mapping.dnsResults && data[mapping.dnsResults.source]) {
      result.dnsResults = data[mapping.dnsResults.source].map((item: any) => ({
        domain: item[mapping.dnsResults.domainField] || 'unknown',
        dnsServer: item[mapping.dnsResults.serverField] || 'unknown',
        success: item[mapping.dnsResults.successField] !== undefined ? item[mapping.dnsResults.successField] : true,
        responseTimeMs: parseFloat(item[mapping.dnsResults.responseTimeField]) || 0
      }));
    }
    
    return result;
  }
}

export const type = 'parser';
export const author = 'Your Name';
export default new ExternalDataImporter();
```

### Integration with Monitoring Systems

You can create plugins to integrate with monitoring systems:

```typescript
import { Plugin, PluginContext } from './PluginManager';

class MonitoringSystemIntegration implements Plugin {
  name = 'monitoring-system-integration';
  description = 'Integrates analysis results with monitoring systems';
  version = '1.0.0';
  private config: any = {};
  
  async initialize(config: any): Promise<void> {
    this.config = config || {};
  }
  
  async execute(context: PluginContext): Promise<any> {
    const { analysisResults } = context;
    
    if (!analysisResults) {
      return { error: 'No analysis results available' };
    }
    
    try {
      // Generate metrics for monitoring system
      const metrics = this.generateMetrics(analysisResults);
      
      // Send metrics to monitoring system
      if (this.config.prometheusEndpoint) {
        await this.sendToPrometheus(metrics);
      }
      
      if (this.config.grafanaEndpoint) {
        await this.sendToGrafana(metrics);
      }
      
      return {
        metricsGenerated: metrics.length,
        monitoringSystemsUpdated: [
          this.config.prometheusEndpoint ? 'Prometheus' : null,
          this.config.grafanaEndpoint ? 'Grafana' : null
        ].filter(Boolean)
      };
    } catch (error) {
      console.error('Error integrating with monitoring systems:', error);
      return {
        error: error.message
      };
    }
  }
  
  private generateMetrics(analysisResults: any): any[] {
    const metrics = [];
    
    // Generate bandwidth metrics
    if (analysisResults.iperfAnalysis && analysisResults.iperfAnalysis.bandwidthComparison) {
      for (const item of analysisResults.iperfAnalysis.bandwidthComparison) {
        metrics.push({
          name: 'network_bandwidth_mbps',
          value: item.avgBandwidthMbps,
          labels: {
            configuration: item.configuration,
            mtu: item.configuration.split('-')[0].replace('mtu', ''),
            aws_logging: item.configuration.includes('enabled') ? 'enabled' : 'disabled'
          }
        });
      }
    }
    
    // Generate DNS metrics
    if (analysisResults.dnsAnalysis && analysisResults.dnsAnalysis.performanceMetrics) {
      for (const item of analysisResults.dnsAnalysis.performanceMetrics) {
        metrics.push({
          name: 'dns_response_time_ms',
          value: item.avgResponseTimeMs,
          labels: {
            configuration: item.configuration,
            mtu: item.configuration.split('-')[0].replace('mtu', ''),
            aws_logging: item.configuration.includes('enabled') ? 'enabled' : 'disabled'
          }
        });
      }
    }
    
    return metrics;
  }
  
  private async sendToPrometheus(metrics: any[]): Promise<void> {
    // Implement Prometheus integration
  }
  
  private async sendToGrafana(metrics: any[]): Promise<void> {
    // Implement Grafana integration
  }
}

export const type = 'reporter';
export const author = 'Your Name';
export default new MonitoringSystemIntegration();
```

By leveraging these advanced customization options and integration capabilities, you can extend the Network Performance Analyzer to fit your specific requirements and integrate it seamlessly with your existing systems and workflows.