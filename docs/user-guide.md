# Network Performance Analyzer User Guide

This guide provides detailed instructions on how to use the Network Performance Analyzer effectively for various network performance analysis scenarios.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Basic Usage](#basic-usage)
3. [Working with Datasets](#working-with-datasets)
4. [Configuration Options](#configuration-options)
5. [Analyzing Results](#analyzing-results)
6. [Common Analysis Scenarios](#common-analysis-scenarios)
7. [Advanced Usage](#advanced-usage)
8. [Troubleshooting](#troubleshooting)

## Getting Started

### Installation

Install the Network Performance Analyzer using npm:

```bash
npm install -g network-performance-analyzer
```

Or install from source:

```bash
git clone https://github.com/your-org/network-performance-analyzer.git
cd network-performance-analyzer
npm install
npm run build
npm link
```

### Verify Installation

Verify that the installation was successful:

```bash
network-performance-analyzer --version
```

This should display the version number of the installed analyzer.

## Basic Usage

### Running a Basic Analysis

To run a basic analysis on a directory containing network performance test datasets:

```bash
network-performance-analyzer ./test-datasets
```

This will:
1. Discover all valid datasets in the specified directory
2. Parse the dataset files
3. Analyze the performance data
4. Generate a report at `./network-analysis-report.md`

### Command Line Options

The analyzer supports various command line options:

```
Usage: network-performance-analyzer [options] <input-dir>

Arguments:
  input-dir                      Directory containing network performance test datasets

Options:
  -V, --version                  output the version number
  -o, --output <file>            Output file path for the generated report (default: network-analysis-report.md)
  -v, --verbose                  Enable verbose logging (default: false)
  -c, --continue-on-error        Continue analysis when individual datasets fail (default: true)
  -t, --anomaly-thresholds <json> Custom thresholds for anomaly detection as JSON string
  -p, --parallel <number>        Maximum number of parallel tasks to run (default: "4")
  -m, --monitor                  Enable performance monitoring (default: false)
  -e, --environment <env>        Environment to use for configuration (development, production, testing)
  -C, --config <file>            Path to configuration file
  -P, --plugins <dirs>           Comma-separated list of plugin directories
  -T, --template <id>            Report template ID to use
  -S, --sections <list>          Comma-separated list of report sections to include
  -h, --help                     display help for command
```

### Example Commands

```bash
# Specify output file
network-performance-analyzer ./test-datasets -o ./reports/analysis.md

# Enable verbose logging
network-performance-analyzer ./test-datasets -v

# Use custom anomaly thresholds
network-performance-analyzer ./test-datasets -t '{"bandwidthVariation":0.2,"latencyVariation":0.3}'

# Use custom configuration file
network-performance-analyzer ./test-datasets -C ./config.json -e production

# Use custom plugins
network-performance-analyzer ./test-datasets -P ./plugins,./custom-plugins

# Customize report sections
network-performance-analyzer ./test-datasets -T custom -S executive-summary,configuration-overview,recommendations
```

## Working with Datasets

### Dataset Structure

The analyzer expects datasets in directories with the following naming pattern:

```
(coredns|stock)-mtu<size>-aws-logs_(enabled|disabled)
```

Examples:
- `coredns-mtu1500-aws-logs_enabled`
- `stock-mtu8920-aws-logs_disabled`

Each dataset directory should contain:

1. A parameters file named `parameters-results_*.json` (optional)
2. A results file named `results_*.json` (required)

### Creating Test Datasets

To create test datasets for analysis:

1. Create a directory for each configuration you want to test
2. Name the directories according to the pattern above
3. Create a results file in each directory with the required format

Example results file structure:

```json
{
  "iperfTests": [
    {
      "server": "test-server",
      "scenario": "bandwidth-test",
      "success": true,
      "startTime": 1626912345,
      "endTime": 1626912355,
      "duration": 10,
      "numStreams": 1,
      "cpuUtilizationHost": 12.5,
      "cpuUtilizationRemote": 8.3,
      "tcpMssDefault": 1460,
      "retransmits": 0,
      "sndCwnd": 43800,
      "blksize": 131072,
      "bytes": 1073741824,
      "bitsPerSecond": 858993459.2,
      "bandwidthMbps": 819.2
    }
  ],
  "dnsResults": [
    {
      "domain": "example.com",
      "dnsServer": "8.8.8.8",
      "success": true,
      "responseTimeMs": 12.5,
      "queryTimeMs": 10.2,
      "resolvedIps": ["93.184.216.34"]
    }
  ]
}
```

### Importing Existing Data

If you have existing network performance data in a different format, you can:

1. Create a custom parser plugin to import the data
2. Convert the data to the expected format using a script
3. Use the data import API to programmatically import the data

## Configuration Options

### Configuration File

Create a configuration file to customize the analyzer's behavior:

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

### Environment-Specific Configuration

You can define different configurations for different environments:

```bash
# Use development environment
network-performance-analyzer ./test-datasets -e development

# Use production environment
network-performance-analyzer ./test-datasets -e production

# Use custom environment
network-performance-analyzer ./test-datasets -e custom
```

### Performance Tuning

To optimize performance for large datasets:

```bash
# Enable performance monitoring
network-performance-analyzer ./test-datasets -m

# Adjust parallel processing
network-performance-analyzer ./test-datasets -p 8

# Use streaming parser (via configuration file)
network-performance-analyzer ./test-datasets -C ./config-streaming.json
```

Example streaming configuration:

```json
{
  "analysis": {
    "useStreamingParser": true,
    "streamingChunkSize": 1024,
    "maxParallelTasks": 2
  }
}
```

## Analyzing Results

### Understanding the Report

The generated report includes several sections:

1. **Executive Summary**: High-level overview of the analysis results
2. **Configuration Overview**: Summary of the analyzed configurations
3. **Detailed Tables**: Detailed performance metrics for each configuration
4. **Visualizations**: Charts and graphs of the performance data
5. **Anomalies**: Detected performance anomalies
6. **Recommendations**: Recommendations for improving performance

### Key Metrics

The analyzer calculates several key metrics:

- **Bandwidth**: Average, minimum, and maximum bandwidth in Mbps
- **Latency**: Average, minimum, and maximum latency in milliseconds
- **Packet Loss**: Percentage of packets lost during transmission
- **DNS Response Time**: Average, minimum, and maximum DNS response time in milliseconds
- **Configuration Comparison**: Relative performance of different configurations
- **Anomaly Detection**: Identification of performance outliers

### Interpreting Results

When interpreting the results:

1. Look at the executive summary for high-level insights
2. Compare the performance of different configurations
3. Identify the optimal configuration for your use case
4. Check for anomalies that may indicate issues
5. Review the recommendations for potential improvements

## Common Analysis Scenarios

### Comparing MTU Sizes

To compare the performance of different MTU sizes:

1. Create datasets with different MTU sizes (e.g., 1500, 8920)
2. Run the analyzer on the datasets
3. Look at the configuration comparison section of the report
4. Check the MTU impact analysis for insights

Example command:

```bash
network-performance-analyzer ./mtu-comparison-datasets -o ./reports/mtu-comparison.md
```

### Evaluating AWS Logging Impact

To evaluate the impact of AWS logging on performance:

1. Create datasets with logging enabled and disabled
2. Run the analyzer on the datasets
3. Look at the logging impact analysis in the report

Example command:

```bash
network-performance-analyzer ./logging-comparison-datasets -o ./reports/logging-impact.md
```

### Detecting Performance Anomalies

To detect performance anomalies:

1. Run the analyzer with custom anomaly thresholds
2. Check the anomalies section of the report

Example command:

```bash
network-performance-analyzer ./test-datasets -t '{"bandwidthVariation":0.1,"latencyVariation":0.2}' -o ./reports/anomaly-detection.md
```

### Comparing DNS Performance

To compare DNS performance across configurations:

1. Ensure your datasets include DNS test results
2. Run the analyzer on the datasets
3. Look at the DNS performance section of the report

Example command:

```bash
network-performance-analyzer ./dns-test-datasets -S executive-summary,dns-performance -o ./reports/dns-analysis.md
```

## Advanced Usage

### Using Custom Plugins

To use custom plugins:

1. Create a plugin file (see [Custom Plugins Guide](./custom-plugins-guide.md))
2. Place the plugin file in a plugins directory
3. Run the analyzer with the plugins directory specified

Example command:

```bash
network-performance-analyzer ./test-datasets -P ./my-plugins -o ./reports/custom-analysis.md
```

### Customizing Report Templates

To customize the report template:

1. Create a custom template file (see [Extending the Analyzer](./extending-the-analyzer.md))
2. Run the analyzer with the custom template

Example command:

```bash
network-performance-analyzer ./test-datasets -T my-custom-template -o ./reports/custom-report.md
```

### Programmatic Usage

You can use the analyzer programmatically in your own Node.js applications:

```typescript
import { createNetworkPerformanceAnalyzer, AnalyzerConfig } from 'network-performance-analyzer';

async function runAnalysis() {
  const config: AnalyzerConfig = {
    continueOnError: true,
    logProgress: true,
    reportOutputPath: './reports/analysis.md',
    anomalyThresholds: {
      bandwidthVariation: 0.2,
      latencyVariation: 0.3
    }
  };
  
  const analyzer = createNetworkPerformanceAnalyzer(config);
  const report = await analyzer.analyze('./test-datasets');
  
  console.log('Analysis completed successfully');
  console.log(`Report saved to: ${config.reportOutputPath}`);
  
  return report;
}

runAnalysis().catch(console.error);
```

### Batch Processing

To process multiple dataset directories in batch:

```bash
#!/bin/bash

# Process multiple dataset directories
for dir in ./datasets/*/; do
  echo "Processing $dir..."
  network-performance-analyzer "$dir" -o "./reports/$(basename "$dir").md"
done

echo "Batch processing complete"
```

## Troubleshooting

### Common Issues

#### No Datasets Found

If the analyzer reports that no datasets were found:

1. Verify that your dataset directories follow the naming pattern: `(coredns|stock)-mtu<size>-aws-logs_(enabled|disabled)`
2. Ensure each dataset directory contains a results file named `results_*.json`
3. Check file permissions to ensure the analyzer can read the files

#### Parsing Errors

If the analyzer encounters parsing errors:

1. Verify that your JSON files are properly formatted
2. Ensure the required fields are present in the dataset files
3. Check for any special characters or encoding issues in the files

#### Memory Issues with Large Datasets

If the analyzer runs out of memory with large datasets:

1. Enable streaming JSON parsing with the `--config` option and a configuration file that sets `"useStreamingParser": true`
2. Reduce the number of parallel tasks with `--parallel 2`
3. Run the analyzer on a machine with more memory

### Debugging

To debug issues with the analyzer:

1. Run with verbose logging enabled:

```bash
network-performance-analyzer ./test-datasets -v
```

2. Check the error messages in the console output

3. Enable performance monitoring to identify bottlenecks:

```bash
network-performance-analyzer ./test-datasets -m
```

4. If using custom plugins, check for errors in the plugin execution:

```bash
network-performance-analyzer ./test-datasets -v -P ./my-plugins
```

### Getting Help

If you encounter issues that you cannot resolve:

1. Check the [API Documentation](./api.md) for detailed information about the analyzer's API
2. Review the [Extending the Analyzer](./extending-the-analyzer.md) guide for information about customization
3. Submit an issue on the GitHub repository with detailed information about the problem
4. Contact the maintainers for support

## Conclusion

The Network Performance Analyzer is a powerful tool for analyzing network performance test datasets. By following this guide, you can effectively use the analyzer to gain insights into your network performance and identify opportunities for optimization.

For more information, see:

- [API Documentation](./api.md)
- [Extending the Analyzer](./extending-the-analyzer.md)
- [Custom Plugins Guide](./custom-plugins-guide.md)