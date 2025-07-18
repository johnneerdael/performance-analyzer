# Troubleshooting Guide and Usage Examples

## Overview

This guide provides comprehensive troubleshooting solutions for common issues encountered when using the Network Performance Data Gatherer, along with practical usage examples ranging from basic to advanced scenarios.

## Common Issues and Solutions

### Installation and Dependencies

#### Python Dependencies Issues

**Problem**: `ModuleNotFoundError: No module named 'pandas'`
```
Traceback (most recent call last):
  File "network_performance_tester.py", line 4, in <module>
    import pandas as pd
ModuleNotFoundError: No module named 'pandas'
```

**Solutions**:
```bash
# Install dependencies
pip install -r requirements.txt

# Or install individually
pip install pandas matplotlib numpy

# For system-wide installation
sudo pip install pandas matplotlib numpy

# Using conda
conda install pandas matplotlib numpy
```

**Verification**:
```bash
python3 -c "import pandas, matplotlib, numpy; print('All dependencies installed')"
```

#### iperf3 Not Found

**Problem**: `iperf3: command not found`

**Solutions by Platform**:

**Ubuntu/Debian**:
```bash
sudo apt-get update
sudo apt-get install iperf3

# Verify installation
iperf3 --version
which iperf3
```

**CentOS/RHEL/Fedora**:
```bash
# CentOS/RHEL 7
sudo yum install iperf3

# CentOS/RHEL 8+ / Fedora
sudo dnf install iperf3

# Verify installation
iperf3 --version
```

**macOS**:
```bash
# Using Homebrew
brew install iperf3

# Using MacPorts
sudo port install iperf3

# Verify installation
iperf3 --version
```

#### dig Command Not Available

**Problem**: `dig: command not found`

**Solutions**:

**Ubuntu/Debian**:
```bash
sudo apt-get install dnsutils
```

**CentOS/RHEL/Fedora**:
```bash
# CentOS/RHEL
sudo yum install bind-utils

# Fedora
sudo dnf install bind-utils
```

**macOS**:
```bash
brew install bind
```

**Verification**:
```bash
dig --version
which dig
```

### Network Connectivity Issues

#### iperf3 Server Connection Failures

**Problem**: `unable to connect to server: Connection refused`

**Diagnostic Steps**:
```bash
# Test basic connectivity
ping <server_ip>

# Test iperf3 port (5201)
telnet <server_ip> 5201
# or
nc -v <server_ip> 5201

# Check if iperf3 server is running
nmap -p 5201 <server_ip>
```

**Solutions**:

1. **Start iperf3 Server**:
```bash
# On the server machine
iperf3 -s

# Run as daemon
iperf3 -s -D

# Bind to specific interface
iperf3 -s -B <server_ip>

# Use different port
iperf3 -s -p 5202
```

2. **Firewall Configuration**:
```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 5201

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=5201/tcp
sudo firewall-cmd --reload

# iptables
sudo iptables -A INPUT -p tcp --dport 5201 -j ACCEPT
```

3. **Network Security Groups** (Cloud environments):
- AWS: Allow inbound TCP 5201 in Security Group
- Azure: Allow inbound TCP 5201 in Network Security Group
- GCP: Allow tcp:5201 in firewall rules

#### DNS Resolution Issues

**Problem**: DNS queries failing or timing out

**Diagnostic Commands**:
```bash
# Test manual DNS resolution
dig @8.8.8.8 google.com

# Test with different DNS servers
dig @1.1.1.1 google.com
dig @9.9.9.9 google.com

# Check system DNS configuration
cat /etc/resolv.conf

# Test DNS connectivity
nc -u -v 8.8.8.8 53
```

**Solutions**:

1. **DNS Server Issues**:
```bash
# Try alternative DNS servers
python3 network_performance_tester.py \
    --servers 192.168.1.100 \
    --dns-servers 8.8.8.8,1.1.1.1,9.9.9.9
```

2. **Network Connectivity**:
```bash
# Check internet connectivity
ping 8.8.8.8

# Check DNS port connectivity
nc -u -v 8.8.8.8 53
```

3. **Firewall/Proxy Issues**:
```bash
# Check for DNS blocking
sudo iptables -L | grep 53
sudo netstat -tulpn | grep :53
```

### Zone File and CGN Validation Issues

#### Zone File Parsing Errors

**Problem**: `Warning: Zone file 'thepi.es.txt' not found`

**Solutions**:
```bash
# Check file existence and permissions
ls -la thepi.es.txt

# Use absolute path
python3 network_performance_tester.py \
    --zone-file /full/path/to/thepi.es.txt \
    --servers 192.168.1.100

# Verify file format
head -20 thepi.es.txt
```

**Zone File Validation**:
```bash
# Check for proper format
grep "IN A" thepi.es.txt | head -5
grep "IN CNAME" thepi.es.txt | head -5

# Validate syntax (if bind tools available)
named-checkzone example.com thepi.es.txt
```

#### CGN Validation Failures

**Problem**: `Status: FAILED_CGN_VALIDATION - Resolved IP(s) not within 100.64.0.0/10 CGN range`

**Diagnostic Steps**:
```bash
# Check what IPs are being resolved
dig +short example.domain.com

# Verify IP range
python3 -c "
import ipaddress
ip = '192.168.1.10'  # Replace with actual resolved IP
cgn_range = ipaddress.ip_network('100.64.0.0/10')
print(f'IP {ip} in CGN range: {ipaddress.ip_address(ip) in cgn_range}')
"
```

**Solutions**:

1. **Update Zone File**:
```
# Correct format with CGN IPs
domain1.example.com.    1    IN    A    100.64.1.10
domain2.example.com.    1    IN    A    100.64.1.20
```

2. **Verify DNS Server Configuration**:
```bash
# Test with authoritative DNS server
dig @ns1.example.com domain.example.com
```

### Performance and Resource Issues

#### High Memory Usage

**Problem**: Script consuming excessive memory

**Diagnostic Commands**:
```bash
# Monitor memory usage during execution
top -p $(pgrep -f network_performance_tester.py)

# Check memory usage
ps aux | grep network_performance_tester.py
```

**Solutions**:

1. **Reduce Concurrent Operations**:
```python
# Modify in code - reduce DNS concurrent workers
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
```

2. **Process in Batches**:
```bash
# Test fewer servers at once
python3 network_performance_tester.py --servers 192.168.1.100
# Then separately:
python3 network_performance_tester.py --servers 192.168.1.101
```

3. **Limit Test Scenarios**:
```python
# Comment out memory-intensive scenarios in code
self.iperf_scenarios = [
    # Keep only essential scenarios
    {'name': 'TCP Bandwidth (Parallel 4)', 'params': ['-c', '{server}', '-t', '15', '-P', '4', '-J']},
    {'name': 'UDP Bandwidth (100Mbps)', 'params': ['-c', '{server}', '-t', '10', '-u', '-b', '100M', '-J']},
]
```

#### Slow Test Execution

**Problem**: Tests taking too long to complete

**Optimization Strategies**:

1. **Reduce Test Durations**:
```python
# Modify scenario durations in code
{'name': 'TCP Bandwidth (Parallel 4)', 'params': ['-c', '{server}', '-t', '5', '-P', '4', '-J']},  # Reduced from 15s
```

2. **Skip Unnecessary Tests**:
```bash
# DNS testing only
python3 network_performance_tester.py --skip-iperf --servers 192.168.1.100

# iperf3 testing only
python3 network_performance_tester.py --skip-dns --servers 192.168.1.100
```

3. **Parallel Server Testing**:
```bash
# Test multiple servers in parallel (separate terminals)
python3 network_performance_tester.py --servers 192.168.1.100 --output-dir results_server1 &
python3 network_performance_tester.py --servers 192.168.1.101 --output-dir results_server2 &
```

### Output and File Issues

#### Permission Denied Errors

**Problem**: `Permission denied: 'performance_results'`

**Solutions**:
```bash
# Create directory with proper permissions
mkdir -p performance_results
chmod 755 performance_results

# Use different output directory
python3 network_performance_tester.py \
    --servers 192.168.1.100 \
    --output-dir /tmp/network_tests

# Run with appropriate permissions
sudo python3 network_performance_tester.py --servers 192.168.1.100
```

#### JSON Output Errors

**Problem**: Invalid JSON in results files

**Diagnostic Steps**:
```bash
# Validate JSON files
python3 -m json.tool results_20250717_120000.json

# Check file completeness
tail -10 results_20250717_120000.json
```

**Solutions**:
1. **Re-run Failed Tests**: Often caused by interrupted execution
2. **Check Disk Space**: Ensure sufficient space for output files
3. **Verify File Permissions**: Ensure write permissions to output directory

## Usage Examples

### Basic Usage Examples

#### Example 1: Single Server Basic Test
```bash
# Test single server with default settings
python3 network_performance_tester.py --servers 192.168.1.100

# Expected output structure:
# performance_results/
# ├── results_20250717_120000.json
# ├── parameters-results_20250717_120000.json
# ├── iperf_bandwidth_comparison.png
# ├── dns_performance_comparison.png
# └── *.txt report files
```

#### Example 2: Multiple Servers with Custom DNS
```bash
# Test multiple servers with specific DNS servers
python3 network_performance_tester.py \
    --servers 192.168.1.100,192.168.1.101,192.168.1.102 \
    --dns-servers 8.8.8.8,1.1.1.1 \
    --output-dir multi_server_test
```

#### Example 3: DNS-Only Testing
```bash
# Test DNS performance only (skip iperf3)
python3 network_performance_tester.py \
    --skip-iperf \
    --dns-servers 8.8.8.8,1.1.1.1,9.9.9.9 \
    --zone-file custom_domains.txt \
    --output-dir dns_only_test
```

### Advanced Usage Examples

#### Example 4: High-Performance Network Testing
```bash
# For 10Gbps+ networks - modify scenarios in code first
python3 network_performance_tester.py \
    --servers 10.0.0.100 \
    --output-dir high_performance_test \
    --verbose

# Custom scenarios for high-performance testing:
# - Longer test durations (60-120 seconds)
# - Higher UDP bitrates (5G, 10G)
# - Larger TCP windows (2M, 4M)
```

#### Example 5: Batch Testing for Multiple Configurations
```bash
#!/bin/bash
# Script for testing multiple network configurations

SERVERS="192.168.1.100,192.168.1.101"
BASE_DIR="/tmp/network_analysis"

# Test different MTU configurations
for MTU in 1500 1420 8920; do
    echo "Testing MTU $MTU configuration"
    
    # Configure MTU (example - adjust for your environment)
    sudo ip link set dev eth0 mtu $MTU
    
    # Run tests
    python3 network_performance_tester.py \
        --servers $SERVERS \
        --output-dir "${BASE_DIR}/mtu_${MTU}_test" \
        --verbose
    
    # Wait between tests
    sleep 30
done
```

#### Example 6: Custom Zone File Testing
```bash
# Create custom zone file for specific testing
cat > custom_test_domains.txt << EOF
;; Custom test domains for performance analysis
test1.internal.com.    1    IN    A    100.64.1.10
test2.internal.com.    1    IN    A    100.64.1.20
api.internal.com.      1    IN    A    100.64.1.30
db.internal.com.       1    IN    A    100.64.1.40
cache.internal.com.    1    IN    A    100.64.1.50
EOF

# Run tests with custom domains
python3 network_performance_tester.py \
    --servers 192.168.1.100 \
    --zone-file custom_test_domains.txt \
    --dns-servers 192.168.1.1,8.8.8.8 \
    --output-dir custom_domain_test
```

### Integration Examples

#### Example 7: Automated Testing Pipeline
```bash
#!/bin/bash
# Automated testing pipeline script

set -e  # Exit on any error

# Configuration
SERVERS="192.168.1.100,192.168.1.101"
OUTPUT_BASE="/data/network_analysis"
DATE=$(date +%Y%m%d_%H%M%S)
TEST_DIR="${OUTPUT_BASE}/test_${DATE}"

# Create test directory
mkdir -p "$TEST_DIR"

# Run performance tests
echo "Starting network performance tests at $(date)"
python3 network_performance_tester.py \
    --servers "$SERVERS" \
    --output-dir "$TEST_DIR" \
    --verbose 2>&1 | tee "$TEST_DIR/test_execution.log"

# Verify results
if [ -f "$TEST_DIR/results_*.json" ]; then
    echo "Tests completed successfully"
    
    # Optional: Run analysis
    cd /path/to/network-performance-analyzer
    npm run analyze -- --input "$TEST_DIR"
    
    # Optional: Send notification
    echo "Network performance tests completed: $TEST_DIR" | \
        mail -s "Performance Test Results" admin@example.com
else
    echo "Tests failed - no results file found"
    exit 1
fi
```

#### Example 8: Continuous Monitoring Setup
```bash
#!/bin/bash
# Continuous monitoring script (run via cron)

# Add to crontab: 0 */6 * * * /path/to/continuous_monitoring.sh

SERVERS="192.168.1.100"
OUTPUT_DIR="/var/log/network_monitoring/$(date +%Y%m%d)"
RETENTION_DAYS=30

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Run lightweight test suite
python3 network_performance_tester.py \
    --servers "$SERVERS" \
    --output-dir "$OUTPUT_DIR" \
    --skip-dns  # Skip DNS for faster execution

# Cleanup old results
find /var/log/network_monitoring -type d -mtime +$RETENTION_DAYS -exec rm -rf {} \;

# Check for performance degradation
CURRENT_BW=$(grep -o '"bandwidth_mbps": [0-9.]*' "$OUTPUT_DIR"/results_*.json | \
             head -1 | cut -d: -f2 | tr -d ' ')

if (( $(echo "$CURRENT_BW < 500" | bc -l) )); then
    echo "WARNING: Bandwidth below threshold: ${CURRENT_BW}Mbps" | \
        logger -t network_monitor
fi
```

### Performance Benchmarking Examples

#### Example 9: Baseline Performance Establishment
```bash
#!/bin/bash
# Establish baseline performance metrics

SERVERS="192.168.1.100"
BASELINE_DIR="/data/baselines/$(date +%Y%m%d)"

# Run comprehensive baseline test
python3 network_performance_tester.py \
    --servers "$SERVERS" \
    --output-dir "$BASELINE_DIR" \
    --verbose

# Generate baseline report
echo "Baseline Performance Report - $(date)" > "$BASELINE_DIR/baseline_summary.txt"
echo "=======================================" >> "$BASELINE_DIR/baseline_summary.txt"

# Extract key metrics
grep -o '"bandwidth_mbps": [0-9.]*' "$BASELINE_DIR"/results_*.json | \
    awk -F: '{sum+=$2; count++} END {print "Average Bandwidth: " sum/count " Mbps"}' \
    >> "$BASELINE_DIR/baseline_summary.txt"

grep -o '"response_time_ms": [0-9.]*' "$BASELINE_DIR"/results_*.json | \
    awk -F: '{sum+=$2; count++} END {print "Average DNS Response: " sum/count " ms"}' \
    >> "$BASELINE_DIR/baseline_summary.txt"
```

#### Example 10: A/B Configuration Testing
```bash
#!/bin/bash
# Compare two different network configurations

CONFIG_A_SERVERS="192.168.1.100"
CONFIG_B_SERVERS="192.168.2.100"
COMPARISON_DIR="/data/ab_testing/$(date +%Y%m%d)"

# Test Configuration A
echo "Testing Configuration A..."
python3 network_performance_tester.py \
    --servers "$CONFIG_A_SERVERS" \
    --output-dir "$COMPARISON_DIR/config_a" \
    --verbose

# Test Configuration B
echo "Testing Configuration B..."
python3 network_performance_tester.py \
    --servers "$CONFIG_B_SERVERS" \
    --output-dir "$COMPARISON_DIR/config_b" \
    --verbose

# Generate comparison report
echo "A/B Configuration Comparison - $(date)" > "$COMPARISON_DIR/comparison_report.txt"
echo "========================================" >> "$COMPARISON_DIR/comparison_report.txt"

# Compare average bandwidth
BW_A=$(grep -o '"bandwidth_mbps": [0-9.]*' "$COMPARISON_DIR/config_a"/results_*.json | \
       awk -F: '{sum+=$2; count++} END {print sum/count}')
BW_B=$(grep -o '"bandwidth_mbps": [0-9.]*' "$COMPARISON_DIR/config_b"/results_*.json | \
       awk -F: '{sum+=$2; count++} END {print sum/count}')

echo "Configuration A Average Bandwidth: ${BW_A} Mbps" >> "$COMPARISON_DIR/comparison_report.txt"
echo "Configuration B Average Bandwidth: ${BW_B} Mbps" >> "$COMPARISON_DIR/comparison_report.txt"

# Determine winner
if (( $(echo "$BW_A > $BW_B" | bc -l) )); then
    echo "Winner: Configuration A ($(echo "$BW_A - $BW_B" | bc -l) Mbps improvement)" \
        >> "$COMPARISON_DIR/comparison_report.txt"
else
    echo "Winner: Configuration B ($(echo "$BW_B - $BW_A" | bc -l) Mbps improvement)" \
        >> "$COMPARISON_DIR/comparison_report.txt"
fi
```

## Error Message Reference

### Common Error Messages and Solutions

| Error Message | Cause | Solution |
|---------------|-------|----------|
| `ModuleNotFoundError: No module named 'pandas'` | Missing Python dependencies | `pip install -r requirements.txt` |
| `iperf3: command not found` | iperf3 not installed | Install iperf3 package for your OS |
| `dig: command not found` | dig utility not installed | Install bind-utils/dnsutils package |
| `unable to connect to server: Connection refused` | iperf3 server not running | Start iperf3 server: `iperf3 -s` |
| `Permission denied` | Insufficient file permissions | Check directory permissions or run with sudo |
| `Timeout` | Network connectivity issues | Check network connectivity and firewall settings |
| `FAILED_CGN_VALIDATION` | IPs not in CGN range | Verify zone file contains 100.64.0.0/10 IPs |
| `Zone file not found` | Missing or incorrect zone file path | Verify zone file path and permissions |

This comprehensive troubleshooting guide and examples collection provides solutions for common issues and demonstrates practical usage patterns for the Network Performance Data Gatherer tool.