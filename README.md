# Network Performance Analyzer

A comprehensive tool for analyzing network performance test datasets containing DNS testing results and iperf3 performance measurements. This tool automatically processes multiple test configurations with different parameters (MTU sizes, AWS logging settings) and generates detailed comparative reports in markdown format.

## Features

- **Automated Dataset Discovery**: Automatically finds and processes network performance test datasets
- **Comprehensive Analysis**: Analyzes iperf3 and DNS performance metrics across different configurations
- **Configuration Comparison**: Compares performance across different MTU sizes and AWS logging settings
- **Anomaly Detection**: Identifies performance outliers and unusual patterns
- **Detailed Reporting**: Generates comprehensive markdown reports with insights and recommendations
- **Plugin Architecture**: Extensible design allows adding custom analysis capabilities
- **Performance Optimized**: Supports parallel processing and streaming for large datasets

## Installation

### Prerequisites

- Node.js 14.x or higher
- npm 6.x or higher

### Install from npm

```bash
npm install -g network-performance-analyzer
```

### Install from source

```bash
# Clone the repository
git clone https://github.com/your-org/network-performance-analyzer.git

# Navigate to the project directory
cd network-performance-analyzer

# Install dependencies
npm install

# Build the project
npm run build

# Link for global usage
npm link
```

## Usage

### Basic Usage

```bash
network-performance-analyzer <input-directory>
```

This will analyze all datasets in the input directory and generate a report at `./network-analysis-report.md`.

### Command Line Options

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

### Examples

```bash
# Basic analysis
network-performance-analyzer ./test-datasets

# Specify output file
network-performance-analyzer ./test-datasets -o ./reports/analysis.md

# Enable verbose logging
network-performance-analyzer ./test-datasets -v

# Custom anomaly thresholds
network-performance-analyzer ./test-datasets -t '{"bandwidthVariation":0.2,"latencyVariation":0.3}'

# Use custom configuration file
network-performance-analyzer ./test-datasets -C ./config.json -e production

# Use custom plugins
network-performance-analyzer ./test-datasets -P ./plugins,./custom-plugins

# Customize report sections
network-performance-analyzer ./test-datasets -T custom -S executive-summary,configuration-overview,recommendations
```

## Configuration

The Network Performance Analyzer uses a flexible configuration system that allows you to customize various aspects of the analysis process.

### Configuration File Structure

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

You can create a default configuration file using the provided API:

```typescript
import { ConfigurationManager } from 'network-performance-analyzer';

// Create default configuration file
await ConfigurationManager.createDefaultConfig('./config.json');

// Load configuration from file
const configManager = new ConfigurationManager();
configManager.loadFromFile('./config.json');
```

## Dataset Format

The analyzer expects datasets in directories with the following naming pattern:

```
(coredns|stock)-mtu<size>-aws-logs_(enabled|disabled)
```

Each dataset directory should contain:

1. A parameters file named `parameters-results_*.json` (optional)
2. A results file named `results_*.json` (required)

### Parameters File Format

```json
{
  "backendServer": "string",
  "mtu": 1500,
  "queryLogging": "enabled|disabled",
  "timestamp": "ISO date string"
}
```

### Results File Format

```json
{
  "iperfTests": [
    {
      "server": "string",
      "scenario": "string",
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

## Extending the Analyzer

The Network Performance Analyzer can be extended with custom plugins. See [Extending the Analyzer](docs/extending-the-analyzer.md) for detailed documentation.

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

### Error Messages and Solutions

| Error Message | Possible Cause | Solution |
|---------------|----------------|----------|
| "No valid datasets found" | Incorrect directory structure or naming | Verify dataset directory names and structure |
| "Error parsing dataset" | Malformed JSON or missing required fields | Check JSON format and required fields |
| "Out of memory" | Dataset too large for available memory | Enable streaming parser, reduce parallel tasks |
| "Plugin initialization failed" | Plugin configuration issue | Check plugin configuration in config file |
| "Error generating report" | Report template issue or data format problem | Verify report template and data structure |

## API Documentation

For detailed API documentation, see the [API Documentation](docs/api.md) file.

## License

MIT