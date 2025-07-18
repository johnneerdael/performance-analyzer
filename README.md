# 🚀 Network Performance Analyzer

<div align="center">

[![npm version](https://badge.fury.io/js/network-performance-analyzer.svg)](https://badge.fury.io/js/network-performance-analyzer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/your-org/network-performance-analyzer/workflows/Node.js%20CI/badge.svg)](https://github.com/your-org/network-performance-analyzer/actions)

**A comprehensive toolkit for analyzing network performance in Netskope Private Access (NPA) environments**

*Specialized for testing NPA performance with CGNAT validation and multi-configuration analysis*

</div>

---

## 🎯 Purpose

This toolkit is specifically designed for **Netskope Private Access (NPA) performance testing**. When NPA is properly configured and steered, it returns Carrier-Grade NAT (CGNAT) addresses from the `100.64.0.0/10` range as defined in RFC 6598. Our DNS validation ensures you're testing the correct NPA-steered traffic path.

## ✨ Key Features

| Feature | Description | Documentation |
|---------|-------------|---------------|
| 🔍 **Automated Dataset Discovery** | Finds and processes network performance test datasets | [User Guide](docs/user-guide.md) |
| 📊 **Comprehensive Analysis** | Analyzes iperf3 and DNS performance across configurations | [API Documentation](docs/api.md) |
| ⚖️ **Configuration Comparison** | Compares MTU sizes, AWS logging, and other parameters | [Configuration Guide](docs/configuration-reference.md) |
| 🚨 **Anomaly Detection** | Identifies performance outliers and unusual patterns | [Extending Guide](docs/extending-the-analyzer.md) |
| 📝 **Detailed Reporting** | Generates comprehensive markdown reports with insights | [User Guide](docs/user-guide.md) |
| 🔌 **Plugin Architecture** | Extensible design for custom analysis capabilities | [Custom Plugins Guide](docs/custom-plugins-guide.md) |
| ⚡ **Performance Optimized** | Parallel processing and streaming for large datasets | [Performance Guide](docs/extending-the-analyzer.md) |
| 🌐 **CGNAT Validation** | Validates NPA traffic steering via CGNAT IP ranges | [DNS Testing Guide](docs/dns-testing-guide.md) |

## 🚀 Quick Start

### Prerequisites

| Requirement | Version | Installation |
|-------------|---------|--------------|
| 📦 **Node.js** | 14.x or higher | [Download](https://nodejs.org/) |
| 📦 **npm** | 6.x or higher | Included with Node.js |
| 🔧 **iperf3** | Latest | [Installation Guide](docs/data-gatherer-guide.md#installation-and-dependencies) |
| 🔧 **dig** | Latest | [Installation Guide](docs/data-gatherer-guide.md#installation-and-dependencies) |

### 📥 Installation Options

#### Option 1: Install from npm (Recommended)
```bash
npm install -g network-performance-analyzer
```

#### Option 2: Build from source
```bash
# Clone the repository
git clone https://github.com/your-org/network-performance-analyzer.git
cd network-performance-analyzer

# Install dependencies and build
npm install
npm run build

# Link for global usage
npm link
```

#### Option 3: Development setup
```bash
# Clone and setup for development
git clone https://github.com/your-org/network-performance-analyzer.git
cd network-performance-analyzer

# Install dependencies
npm install

# Run tests
npm test

# Start development mode
npm run dev
```

### ⚡ Getting Started in 3 Steps

1. **📊 Collect Data** - Use our data gatherer tool:
   ```bash
   # Navigate to data gatherer
   cd data-gatherer
   
   # Install Python dependencies
   pip install -r requirements.txt
   
   # Run performance tests (requires iperf3 servers)
   python3 network_performance_tester.py --servers 192.168.1.100
   ```
   📖 *See [Data Gatherer Guide](docs/data-gatherer-guide.md) for detailed instructions*

2. **🔍 Analyze Results** - Process your datasets:
   ```bash
   # Analyze collected data
   network-performance-analyzer ./datasets
   ```

3. **📈 Review Reports** - Check generated analysis:
   ```bash
   # View the generated report
   cat network-analysis-report.md
   ```

## 💻 Usage

### 🎯 Basic Analysis
```bash
# Analyze datasets in current directory
network-performance-analyzer ./datasets

# Specify custom output location
network-performance-analyzer ./datasets -o ./reports/npa-analysis.md
```

### 🔧 Command Line Options

| Option | Description | Example |
|--------|-------------|---------|
| `-o, --output <file>` | Output file path | `-o ./reports/analysis.md` |
| `-v, --verbose` | Enable detailed logging | `-v` |
| `-c, --continue-on-error` | Continue on dataset failures | `-c` |
| `-t, --anomaly-thresholds <json>` | Custom anomaly detection | `-t '{"bandwidthVariation":0.2}'` |
| `-p, --parallel <number>` | Max parallel tasks | `-p 8` |
| `-m, --monitor` | Enable performance monitoring | `-m` |
| `-e, --environment <env>` | Environment configuration | `-e production` |
| `-C, --config <file>` | Configuration file path | `-C ./config.json` |
| `-P, --plugins <dirs>` | Plugin directories | `-P ./plugins,./custom` |
| `-T, --template <id>` | Report template | `-T detailed` |
| `-S, --sections <list>` | Report sections | `-S summary,recommendations` |

### 🚀 Advanced Examples

```bash
# 🔍 Comprehensive analysis with custom settings
network-performance-analyzer ./npa-datasets \
  -o ./reports/npa-performance-$(date +%Y%m%d).md \
  -v -m \
  -t '{"bandwidthVariation":0.15,"dnsResponseTimeVariation":0.4}' \
  -e production

# 🔌 Using custom plugins for specialized analysis
network-performance-analyzer ./datasets \
  -P ./custom-plugins \
  -T npa-optimized \
  -S executive-summary,npa-validation,performance-comparison

# ⚡ High-performance analysis for large datasets
network-performance-analyzer ./large-datasets \
  -p 16 \
  -C ./configs/high-performance.json \
  --continue-on-error
```

📖 **For more usage examples, see [Troubleshooting and Examples Guide](docs/troubleshooting-examples.md)**

## ⚙️ Configuration

The analyzer provides flexible configuration for different testing environments and requirements.

### 🔧 Quick Configuration
```bash
# Generate default configuration
network-performance-analyzer --init-config

# Use environment-specific settings
network-performance-analyzer ./datasets -e production -C ./npa-config.json
```

### 📋 Configuration Categories

| Category | Purpose | Documentation |
|----------|---------|---------------|
| 🔍 **Analysis Settings** | Control processing behavior | [Configuration Reference](docs/configuration-reference.md) |
| 🚨 **Anomaly Thresholds** | Customize detection sensitivity | [Configuration Reference](docs/configuration-reference.md) |
| 📊 **Reporting Options** | Control report generation | [User Guide](docs/user-guide.md) |
| 🔌 **Plugin Configuration** | Manage custom extensions | [Custom Plugins Guide](docs/custom-plugins-guide.md) |
| 🌍 **Environment Profiles** | Environment-specific settings | [Configuration Reference](docs/configuration-reference.md) |

📖 **For complete configuration options, see [Configuration Reference](docs/configuration-reference.md)**

## 📁 Dataset Format & Structure

### 🗂️ Directory Structure
The analyzer expects datasets organized with specific naming patterns for NPA testing:

```
datasets/
├── coredns-mtu1500-aws-logs_enabled/
│   ├── parameters-results_20250717_120000.json
│   └── results_20250717_120000.json
├── coredns-mtu1420-aws-logs_disabled/
│   ├── parameters-results_20250717_130000.json
│   └── results_20250717_130000.json
└── stock-mtu8920-aws-logs_disabled/
    ├── parameters-results_20250717_140000.json
    └── results_20250717_140000.json
```

### 📋 Naming Convention
```
(coredns|stock)-mtu<size>-aws-logs_(enabled|disabled)
```

| Component | Description | Example |
|-----------|-------------|---------|
| `coredns\|stock` | DNS resolver type | `coredns`, `stock` |
| `mtu<size>` | MTU configuration | `mtu1500`, `mtu1420`, `mtu8920` |
| `aws-logs_(enabled\|disabled)` | AWS logging status | `aws-logs_enabled`, `aws-logs_disabled` |

### 📊 Data Files

#### Parameters File (`parameters-results_*.json`)
```json
{
  "backendServer": "192.168.1.100",
  "mtu": 1500,
  "queryLogging": "enabled",
  "timestamp": "2025-07-17T12:00:00Z"
}
```

#### Results File (`results_*.json`)
```json
{
  "iperfTests": [
    {
      "server": "192.168.1.100",
      "scenario": "TCP Bandwidth (Parallel 4)",
      "success": true,
      "bandwidthMbps": 945.2,
      "retransmits": 12,
      "duration": 15.1
    }
  ],
  "dnsResults": [
    {
      "domain": "example.npa.com",
      "dnsServer": "8.8.8.8",
      "success": true,
      "responseTimeMs": 23.4,
      "resolvedIps": ["100.64.1.10"]
    }
  ]
}
```

📖 **For complete data format specifications, see [Data Gatherer Guide](docs/data-gatherer-guide.md#output-format-and-data-structure)**

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