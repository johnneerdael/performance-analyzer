# Network Performance Data Gatherer Guide

## Overview

The Network Performance Data Gatherer (`network_performance_tester.py`) is a comprehensive Python tool designed to collect detailed network performance metrics through iperf3 bandwidth testing and DNS resolution performance analysis. This tool generates structured datasets that can be analyzed by the Network Performance Analyzer to provide insights into network behavior across different configurations.

## Key Features

- **Comprehensive iperf3 Testing**: Multiple test scenarios including TCP/UDP bandwidth, congestion testing, window size analysis, and packet size variations
- **DNS Performance Analysis**: Resolution time measurement with CGN (Carrier-Grade NAT) IP validation
- **Zone File Integration**: Automatic domain discovery from DNS zone files
- **Statistical Aggregation**: Multiple test runs with median-based results for reliability
- **Visualization Generation**: Automatic chart creation for performance comparison
- **Concurrent Testing**: Parallel DNS testing for improved efficiency
- **Detailed Reporting**: Human-readable performance reports with statistical analysis

## Installation and Dependencies

### Prerequisites

- Python 3.7 or higher
- iperf3 installed and available in system PATH
- dig command (part of bind-utils/dnsutils package)
- Network connectivity to target servers

### Python Dependencies

Install required Python packages:

```bash
pip install -r requirements.txt
```

The tool requires:
- `pandas>=1.0.0,<3.0.0` - Data manipulation and analysis
- `matplotlib>=3.0.0,<4.0.0` - Visualization generation
- `numpy>=1.18.0,<2.0.0` - Numerical computations

### System Dependencies

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install iperf3 dnsutils
```

**CentOS/RHEL/Fedora:**
```bash
sudo yum install iperf3 bind-utils
# or for newer versions:
sudo dnf install iperf3 bind-utils
```

**macOS:**
```bash
brew install iperf3 bind
```

## Basic Usage

### Command Line Interface

```bash
python3 network_performance_tester.py [OPTIONS]
```

### Command Line Options

| Option | Description | Default | Example |
|--------|-------------|---------|---------|
| `--servers` | Comma-separated list of iperf3 server addresses | None (required) | `--servers 192.168.1.100,10.0.0.50` |
| `--dns-servers` | Comma-separated list of DNS servers to test | `system,8.8.8.8,1.1.1.1` | `--dns-servers 8.8.8.8,1.1.1.1,9.9.9.9` |
| `--output-dir` | Directory for results and visualizations | `performance_results` | `--output-dir /tmp/network_tests` |
| `--zone-file` | Path to DNS zone file for domain testing | `thepi.es.txt` | `--zone-file /path/to/domains.txt` |
| `--skip-iperf` | Skip iperf3 testing (DNS only) | False | `--skip-iperf` |
| `--skip-dns` | Skip DNS testing (iperf3 only) | False | `--skip-dns` |
| `--verbose` | Enable verbose logging | False | `--verbose` |

### Basic Example

```bash
# Test against two iperf3 servers with default DNS servers
python3 network_performance_tester.py --servers 192.168.1.100,10.0.0.50

# Test with custom DNS servers and output directory
python3 network_performance_tester.py \
    --servers 192.168.1.100 \
    --dns-servers 8.8.8.8,1.1.1.1 \
    --output-dir /tmp/network_analysis
```

## Understanding Test Scenarios

### iperf3 Test Scenarios

The tool executes 18 different iperf3 test scenarios designed to comprehensively evaluate network performance:

#### TCP Bandwidth Tests
- **TCP Bandwidth (Parallel 4)**: 4 parallel streams for 15 seconds
- **TCP Bandwidth (Parallel 8)**: 8 parallel streams for 20 seconds  
- **TCP Bandwidth (Reverse, P4)**: 4 parallel reverse streams for 15 seconds
- **TCP Congestion Test (P8, T30)**: 8 parallel streams for 30 seconds
- **High Congestion (P16, T60)**: 16 parallel streams for 60 seconds
- **Very High Congestion (P32, T90)**: 32 parallel streams for 90 seconds

#### TCP Window Size Tests
- **TCP Window Size 64K/128K/256K/512K/1M**: Tests with different TCP window sizes

#### TCP Packet Size Tests
- **TCP Small Packets (64B)**: Small packet size testing
- **TCP Large Packets (64KB)**: Large packet size testing

#### UDP Bandwidth Tests
- **UDP Bandwidth (100Mbps/200Mbps/500Mbps/1Gbps)**: Various target bitrates
- **UDP Bandwidth (1Gbps, Small/Large Pkt)**: Packet size variations at 1Gbps

### DNS Test Scenarios

DNS testing validates resolution performance and CGN compliance:

#### Test Process
1. **Domain Discovery**: Parses zone file to extract A and CNAME records
2. **Resolution Testing**: Uses `dig` command with multiple DNS servers
3. **CGN Validation**: Verifies resolved IPs are within 100.64.0.0/10 range
4. **Performance Measurement**: Records response times and success rates

#### DNS Servers Tested
- **System DNS**: Default system resolver
- **Google DNS**: 8.8.8.8
- **Cloudflare DNS**: 1.1.1.1
- **Custom DNS**: User-specified servers

## Zone File Format

The tool expects DNS zone files in standard BIND format:

```
;; A Records
example.domain.com.    1    IN    A    100.64.1.10
subdomain.domain.com.  1    IN    A    100.64.1.20

;; CNAME Records  
alias.domain.com.      1    IN    CNAME target.domain.com.
```

### CGN IP Validation

The tool validates that resolved IP addresses fall within the Carrier-Grade NAT range (100.64.0.0/10) as defined in RFC 6598. This ensures testing focuses on the intended network infrastructure.

## Output Format and Data Structure

### Results Directory Structure

```
performance_results/
├── results_YYYYMMDD_HHMMSS.json          # Raw test results
├── parameters-results_YYYYMMDD_HHMMSS.json # Test parameters
├── iperf_bandwidth_comparison.png         # Bandwidth visualization
├── iperf_retransmits_comparison.png      # Retransmits visualization  
├── dns_performance_comparison.png         # DNS performance chart
├── dns_slowest_domains.png               # Slowest domains chart
├── iperf_performance_report.txt          # Human-readable iperf report
└── dns_performance_report.txt            # Human-readable DNS report
```

### JSON Data Structure

#### Parameters File
```json
{
  "backend_server": "192.168.1.100",
  "mtu": 1500,
  "query_logging": "disabled",
  "timestamp": "2025-07-17T10:30:00Z",
  "test_scenarios": ["TCP Bandwidth", "DNS Resolution"],
  "dns_servers": ["system", "8.8.8.8", "1.1.1.1"]
}
```

#### Results File
```json
{
  "iperf_tests": [
    {
      "server": "192.168.1.100",
      "scenario": "TCP Bandwidth (Parallel 4)",
      "success": true,
      "bandwidth_mbps": 945.2,
      "retransmits": 12,
      "duration": 15.1,
      "all_raw_data": [...]
    }
  ],
  "dns_tests": [
    {
      "domain": "example.domain.com",
      "dns_server": "8.8.8.8", 
      "success": true,
      "response_time_ms": 23.4,
      "query_time_ms": 23.4,
      "resolved_ips": ["100.64.1.10"],
      "status": "SUCCESS"
    }
  ]
}
```

## Performance Considerations

### Test Duration and Resource Usage

- **Total Test Time**: Approximately 45-60 minutes per server for complete iperf3 suite
- **Memory Usage**: 50-200MB depending on result set size
- **CPU Usage**: Moderate during iperf3 tests, minimal during DNS tests
- **Network Impact**: High bandwidth utilization during iperf3 tests

### Scaling Recommendations

#### Single Server Testing
- Suitable for up to 5 iperf3 servers simultaneously
- DNS testing scales well with concurrent execution
- Monitor system resources during high-congestion tests

#### Large-Scale Testing
- **Batch Processing**: Test servers in groups to manage resource usage
- **Time Scheduling**: Spread tests across time periods to avoid network congestion
- **Result Aggregation**: Use separate analysis runs for large datasets

#### Network Considerations
- **Bandwidth Requirements**: Up to 1Gbps per iperf3 test
- **Concurrent Streams**: High-congestion tests use up to 32 parallel streams
- **DNS Query Rate**: Concurrent DNS testing may generate high query volumes

### Optimization Tips

1. **Reduce Test Scenarios**: Comment out unnecessary scenarios in the code
2. **Adjust Test Durations**: Modify time parameters for faster completion
3. **Limit Parallel Streams**: Reduce stream counts for resource-constrained environments
4. **Batch DNS Testing**: Process domains in smaller groups for memory efficiency

## Integration with Analysis Pipeline

### Data Flow

```
Data Gatherer → JSON Results → Analysis Engine → Reports
```

### File Naming Convention

The tool generates files with timestamps that the analysis engine expects:
- `results_YYYYMMDD_HHMMSS.json`
- `parameters-results_YYYYMMDD_HHMMSS.json`

### Analysis Integration

1. **Data Collection**: Run data gatherer with consistent parameters
2. **Dataset Organization**: Place results in analysis-friendly directory structure
3. **Analysis Execution**: Use Network Performance Analyzer to process results
4. **Report Generation**: Generate comparative analysis across configurations

### Directory Structure for Analysis

```
datasets/
├── config1-mtu1500-logs_disabled/
│   ├── parameters-results_20250717_120000.json
│   └── results_20250717_120000.json
├── config2-mtu1420-logs_disabled/
│   ├── parameters-results_20250717_130000.json
│   └── results_20250717_130000.json
└── config3-mtu8920-logs_disabled/
    ├── parameters-results_20250717_140000.json
    └── results_20250717_140000.json
```

## Troubleshooting

### Common Issues

#### iperf3 Connection Failures
```
Error: unable to connect to server: Connection refused
```
**Solutions:**
- Verify iperf3 server is running: `iperf3 -s`
- Check firewall settings on server
- Confirm network connectivity: `ping <server_ip>`
- Verify port 5201 is accessible

#### DNS Resolution Failures
```
Error: dig command failed
```
**Solutions:**
- Install dig: `sudo apt-get install dnsutils`
- Check DNS server connectivity
- Verify zone file format and path
- Test manual dig command: `dig @8.8.8.8 example.com`

#### CGN Validation Failures
```
Status: FAILED_CGN_VALIDATION
```
**Solutions:**
- Verify zone file contains correct IP ranges (100.64.0.0/10)
- Check DNS server configuration
- Confirm domain resolution returns expected IPs

#### Permission Errors
```
Error: Permission denied
```
**Solutions:**
- Run with appropriate permissions
- Check output directory write permissions
- Verify zone file read permissions

### Performance Issues

#### High Memory Usage
- Reduce number of concurrent tests
- Process results in smaller batches
- Clear intermediate data structures

#### Slow Test Execution
- Reduce test durations in scenario definitions
- Limit number of parallel streams
- Skip unnecessary test scenarios

#### Network Timeouts
- Increase timeout values in code
- Check network stability
- Reduce concurrent connection count

## Advanced Configuration

### Customizing Test Scenarios

Edit the `iperf_scenarios` list in the code to modify test parameters:

```python
self.iperf_scenarios = [
    {'name': 'Custom TCP Test', 'params': ['-c', '{server}', '-t', '30', '-P', '2', '-J']},
    # Add more scenarios as needed
]
```

### Custom DNS Servers

Specify alternative DNS servers for testing:

```bash
python3 network_performance_tester.py \
    --servers 192.168.1.100 \
    --dns-servers 9.9.9.9,208.67.222.222,8.26.56.26
```

### Zone File Customization

Create custom zone files for specific testing domains:

```
# custom_domains.txt
test1.example.com.    1    IN    A    100.64.1.10
test2.example.com.    1    IN    A    100.64.1.20
```

```bash
python3 network_performance_tester.py \
    --servers 192.168.1.100 \
    --zone-file custom_domains.txt
```

## Best Practices

### Test Planning
1. **Baseline Testing**: Establish baseline performance before configuration changes
2. **Consistent Timing**: Run tests at consistent times to avoid variable network conditions
3. **Multiple Runs**: Execute multiple test cycles for statistical reliability
4. **Documentation**: Record test conditions and network configurations

### Data Management
1. **Organized Storage**: Use descriptive directory names for different configurations
2. **Backup Results**: Maintain copies of raw test data
3. **Version Control**: Track changes to test configurations and zone files
4. **Metadata Recording**: Document test environment and conditions

### Analysis Preparation
1. **Consistent Parameters**: Use identical test parameters across configuration comparisons
2. **Complete Datasets**: Ensure all required files are present for analysis
3. **Quality Validation**: Review test results for anomalies before analysis
4. **Configuration Documentation**: Maintain clear records of test configurations

## Related Documentation

For more detailed information on specific aspects of the data gatherer tool, refer to these additional guides:

- **[iperf3 Test Scenarios](iperf-test-scenarios.md)**: Detailed explanation of all 18 iperf3 test scenarios, their purposes, and interpretation guidelines
- **[DNS Testing Guide](dns-testing-guide.md)**: Comprehensive coverage of DNS testing functionality, CGN validation, and zone file management
- **[Configuration Reference](configuration-reference.md)**: Complete configuration options, customization examples, and environment-specific settings
- **[Troubleshooting and Examples](troubleshooting-examples.md)**: Common issues, solutions, and practical usage examples from basic to advanced scenarios

## Quick Start Checklist

Before running your first test, ensure you have:

- [ ] Python 3.7+ installed
- [ ] Required Python packages: `pip install -r requirements.txt`
- [ ] iperf3 installed and accessible: `iperf3 --version`
- [ ] dig command available: `dig --version`
- [ ] iperf3 server running on target hosts: `iperf3 -s`
- [ ] Network connectivity to target servers
- [ ] Zone file available (or use provided thepi.es.txt)
- [ ] Appropriate permissions for output directory

## Getting Help

If you encounter issues not covered in this documentation:

1. Check the [Troubleshooting Guide](troubleshooting-examples.md) for common problems
2. Verify your configuration against the [Configuration Reference](configuration-reference.md)
3. Review the specific test documentation for [iperf3](iperf-test-scenarios.md) or [DNS](dns-testing-guide.md) issues
4. Check system logs and error messages for additional context

This comprehensive guide provides the foundation for effective use of the Network Performance Data Gatherer tool in conjunction with the analysis pipeline.