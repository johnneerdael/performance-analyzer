# 🚀 Network Performance Analyzer

<div align="center">

[![npm version](https://badge.fury.io/js/network-performance-analyzer.svg)](https://badge.fury.io/js/network-performance-analyzer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**A comprehensive toolkit for analyzing network performance in Netskope Private Access (NPA) environments**

_Specialized for testing NPA performance with CGNAT validation and multi-configuration analysis_

</div>

---

## 🎯 Purpose

This toolkit is specifically designed for **Netskope Private Access (NPA) performance testing**. When NPA is properly configured and steered, it returns Carrier-Grade NAT (CGNAT) addresses from the `100.64.0.0/10` range as defined in RFC 6598. Our DNS validation ensures you're testing the correct NPA-steered traffic path.

## ✨ Key Features

| Feature                            | Description                                               | Documentation                                          |
| ---------------------------------- | --------------------------------------------------------- | ------------------------------------------------------ |
| 🔍 **Automated Dataset Discovery** | Finds and processes network performance test datasets     | [User Guide](docs/user-guide.md)                       |
| 📊 **Comprehensive Analysis**      | Analyzes iperf3 and DNS performance across configurations | [API Documentation](docs/api.md)                       |
| ⚖️ **Configuration Comparison**    | Compares MTU sizes, AWS logging, and other parameters     | [Configuration Guide](docs/configuration-reference.md) |
| 🚨 **Anomaly Detection**           | Identifies performance outliers and unusual patterns      | [Extending Guide](docs/extending-the-analyzer.md)      |
| 📝 **Detailed Reporting**          | Generates comprehensive markdown reports with insights    | [User Guide](docs/user-guide.md)                       |
| 🔌 **Plugin Architecture**         | Extensible design for custom analysis capabilities        | [Custom Plugins Guide](docs/custom-plugins-guide.md)   |
| ⚡ **Performance Optimized**       | Parallel processing and streaming for large datasets      | [Performance Guide](docs/extending-the-analyzer.md)    |
| 🌐 **CGNAT Validation**            | Validates NPA traffic steering via CGNAT IP ranges        | [DNS Testing Guide](docs/dns-testing-guide.md)         |

## 🚀 Quick Start

### Prerequisites

| Requirement      | Version        | Installation                                                                    |
| ---------------- | -------------- | ------------------------------------------------------------------------------- |
| 📦 **Node.js**   | 14.x or higher | [Download](https://nodejs.org/)                                                 |
| 📦 **npm**       | 6.x or higher  | Included with Node.js                                                           |
| � **\*Python 3** | 3.7 or higher  | [Download](https://python.org/) or system package manager                       |
| � **\*pip**      | Latest         | Included with Python 3                                                          |
| 🔧 **iperf3**    | Latest         | [Installation Guide](docs/data-gatherer-guide.md#installation-and-dependencies) |
| 🔧 **dig**       | Latest         | [Installation Guide](docs/data-gatherer-guide.md#installation-and-dependencies) |

#### Python Dependencies for Data Gatherer

The data collection tool requires these Python packages:

```bash
# Install Python dependencies for data collection
pip install pandas>=1.0.0 matplotlib>=3.0.0 numpy>=1.18.0

# Or use the requirements file
cd data-gatherer
pip install -r requirements.txt
```

### 📥 Installation Options

#### Option 1: Build from source (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-org/network-performance-analyzer.git
cd network-performance-analyzer

# Install dependencies and build
npm install
npm run build

# Link for global usage (makes 'network-performance-analyzer' command available)
npm link
```

#### Option 2: Local development setup

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

#### Option 3: Direct usage without global install

```bash
# Clone the repository
git clone https://github.com/your-org/network-performance-analyzer.git
cd network-performance-analyzer

# Install dependencies and build
npm install
npm run build

# Run directly with npx
npx . ./datasets

# Or run the built CLI directly
node dist/cli.js ./datasets
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

   📖 _See [Data Gatherer Guide](docs/data-gatherer-guide.md) for detailed instructions_

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

| Option                            | Description                   | Example                           |
| --------------------------------- | ----------------------------- | --------------------------------- |
| `-o, --output <file>`             | Output file path              | `-o ./reports/analysis.md`        |
| `-v, --verbose`                   | Enable detailed logging       | `-v`                              |
| `-c, --continue-on-error`         | Continue on dataset failures  | `-c`                              |
| `-t, --anomaly-thresholds <json>` | Custom anomaly detection      | `-t '{"bandwidthVariation":0.2}'` |
| `-p, --parallel <number>`         | Max parallel tasks            | `-p 8`                            |
| `-m, --monitor`                   | Enable performance monitoring | `-m`                              |
| `-e, --environment <env>`         | Environment configuration     | `-e production`                   |
| `-C, --config <file>`             | Configuration file path       | `-C ./config.json`                |
| `-P, --plugins <dirs>`            | Plugin directories            | `-P ./plugins,./custom`           |
| `-T, --template <id>`             | Report template               | `-T detailed`                     |
| `-S, --sections <list>`           | Report sections               | `-S summary,recommendations`      |

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

| Category                    | Purpose                         | Documentation                                              |
| --------------------------- | ------------------------------- | ---------------------------------------------------------- |
| 🔍 **Analysis Settings**    | Control processing behavior     | [Configuration Reference](docs/configuration-reference.md) |
| 🚨 **Anomaly Thresholds**   | Customize detection sensitivity | [Configuration Reference](docs/configuration-reference.md) |
| 📊 **Reporting Options**    | Control report generation       | [User Guide](docs/user-guide.md)                           |
| 🔌 **Plugin Configuration** | Manage custom extensions        | [Custom Plugins Guide](docs/custom-plugins-guide.md)       |
| 🌍 **Environment Profiles** | Environment-specific settings   | [Configuration Reference](docs/configuration-reference.md) |

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

| Component                      | Description        | Example                                 |
| ------------------------------ | ------------------ | --------------------------------------- |
| `coredns\|stock`               | DNS resolver type  | `coredns`, `stock`                      |
| `mtu<size>`                    | MTU configuration  | `mtu1500`, `mtu1420`, `mtu8920`         |
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

## 🔌 Extending the Analyzer

The Network Performance Analyzer supports custom plugins for specialized NPA analysis requirements.

### 🚀 Quick Plugin Development

```typescript
// Create custom NPA analysis plugin
import { AnalyzerPlugin } from "network-performance-analyzer";

export class NPALatencyPlugin extends AnalyzerPlugin {
  analyze(datasets: Dataset[]): AnalysisResult {
    // Custom NPA-specific latency analysis
    return this.analyzeNPALatencyPatterns(datasets);
  }
}
```

### 📚 Plugin Resources

| Resource                  | Description                    | Link                                                 |
| ------------------------- | ------------------------------ | ---------------------------------------------------- |
| 🏗️ **Plugin Development** | Complete plugin creation guide | [Custom Plugins Guide](docs/custom-plugins-guide.md) |
| 🔧 **API Reference**      | Plugin API documentation       | [API Documentation](docs/api.md)                     |
| 🎯 **Extension Examples** | Real-world plugin examples     | [Extending Guide](docs/extending-the-analyzer.md)    |

## 🛠️ Troubleshooting

### 🚨 Quick Fixes

| Issue                          | Quick Solution                 | Documentation                                              |
| ------------------------------ | ------------------------------ | ---------------------------------------------------------- |
| 📂 **No datasets found**       | Check directory naming pattern | [Data Format Guide](#-dataset-format--structure)           |
| 🔍 **Parsing errors**          | Validate JSON format           | [Troubleshooting Guide](docs/troubleshooting-examples.md)  |
| 💾 **Memory issues**           | Enable streaming parser        | [Configuration Reference](docs/configuration-reference.md) |
| 🌐 **CGNAT validation fails**  | Verify NPA steering            | [DNS Testing Guide](docs/dns-testing-guide.md)             |
| 🔧 **iperf3 connection fails** | Check server setup             | [Data Gatherer Guide](docs/data-gatherer-guide.md)         |

### 🔍 Common Error Solutions

```bash
# Fix dataset discovery issues
ls -la datasets/  # Check directory structure
network-performance-analyzer datasets/ -v  # Enable verbose logging

# Resolve memory issues
network-performance-analyzer datasets/ -p 2 -C low-memory-config.json

# Debug CGNAT validation
python3 -c "
import ipaddress
ip = '100.64.1.10'  # Your resolved IP
cgn = ipaddress.ip_network('100.64.0.0/10')
print(f'IP {ip} in CGNAT range: {ipaddress.ip_address(ip) in cgn}')
"
```

📖 **For comprehensive troubleshooting, see [Troubleshooting and Examples Guide](docs/troubleshooting-examples.md)**

## 📚 Complete Documentation

### 🎯 Core Guides

- 📖 **[User Guide](docs/user-guide.md)** - Complete usage instructions and examples
- 🔧 **[API Documentation](docs/api.md)** - Detailed API reference and integration guide
- ⚙️ **[Configuration Reference](docs/configuration-reference.md)** - All configuration options and examples

### 🚀 Data Collection

- 📊 **[Data Gatherer Guide](docs/data-gatherer-guide.md)** - Complete data collection toolkit
- 🌐 **[DNS Testing Guide](docs/dns-testing-guide.md)** - DNS performance and CGNAT validation
- 🏃 **[iperf3 Test Scenarios](docs/iperf-test-scenarios.md)** - All 18 test scenarios explained

### 🔧 Advanced Topics

- 🔌 **[Custom Plugins Guide](docs/custom-plugins-guide.md)** - Plugin development and examples
- 🚀 **[Extending the Analyzer](docs/extending-the-analyzer.md)** - Advanced customization
- 🛠️ **[Troubleshooting Examples](docs/troubleshooting-examples.md)** - Solutions and usage examples

## 🤝 Contributing

We welcome contributions to improve NPA performance testing capabilities!

### 🚀 Quick Contribution

```bash
# Fork and clone the repository
git clone https://github.com/your-username/network-performance-analyzer.git
cd network-performance-analyzer

# Create feature branch
git checkout -b feature/npa-enhancement

# Make changes and test
npm test
npm run lint

# Submit pull request
git push origin feature/npa-enhancement
```

### 📋 Contribution Areas

- 🔍 **NPA-specific analysis algorithms**
- 🌐 **CGNAT validation improvements**
- 📊 **New visualization types**
- 🔌 **Plugin examples and templates**
- 📚 **Documentation improvements**

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built for Netskope Private Access Performance Testing**

_Ensuring optimal NPA performance through comprehensive network analysis_

[![GitHub stars](https://img.shields.io/github/stars/your-org/network-performance-analyzer?style=social)](https://github.com/your-org/network-performance-analyzer)
[![GitHub forks](https://img.shields.io/github/forks/your-org/network-performance-analyzer?style=social)](https://github.com/your-org/network-performance-analyzer/fork)

</div>
