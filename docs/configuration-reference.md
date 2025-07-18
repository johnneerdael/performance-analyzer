# Configuration and Customization Reference

## Overview

The Network Performance Data Gatherer provides extensive configuration options for customizing test scenarios, parameters, and output formats. This guide covers all configuration aspects, from basic command-line options to advanced code modifications for specialized testing requirements.

## Command-Line Configuration

### Basic Options

#### Server Configuration
```bash
# Single server testing
--servers 192.168.1.100

# Multiple server testing
--servers 192.168.1.100,10.0.0.50,172.16.1.200

# IPv6 server support
--servers 2001:db8::1,192.168.1.100
```

#### DNS Server Configuration
```bash
# Default DNS servers (system, Google, Cloudflare)
# No option needed - uses defaults

# Custom DNS servers
--dns-servers 9.9.9.9,208.67.222.222

# Single DNS server
--dns-servers 8.8.8.8

# Include system DNS with custom servers
--dns-servers system,8.8.8.8,1.1.1.1
```

#### Output Configuration
```bash
# Custom output directory
--output-dir /path/to/results

# Timestamped output directory
--output-dir results_$(date +%Y%m%d_%H%M%S)

# Network-mounted storage
--output-dir /mnt/network_storage/performance_tests
```

#### Zone File Configuration
```bash
# Custom zone file
--zone-file /path/to/custom_domains.txt

# Multiple zone files (requires code modification)
--zone-file primary_domains.txt

# Remote zone file (download first)
wget https://example.com/domains.txt
--zone-file domains.txt
```

### Test Control Options

#### Selective Testing
```bash
# iperf3 testing only
--skip-dns

# DNS testing only  
--skip-iperf

# Full testing (default)
# No flags needed
```

#### Verbose Output
```bash
# Enable detailed logging
--verbose

# Quiet mode (minimal output)
--quiet
```

## Advanced Configuration

### Test Scenario Customization

#### Modifying iperf3 Scenarios

Edit the `iperf_scenarios` list in `network_performance_tester.py`:

```python
self.iperf_scenarios = [
    # Basic bandwidth test
    {
        'name': 'TCP Bandwidth Basic', 
        'params': ['-c', '{server}', '-t', '10', '-J']
    },
    
    # Custom parallel test
    {
        'name': 'TCP Custom Parallel', 
        'params': ['-c', '{server}', '-t', '30', '-P', '6', '-J']
    },
    
    # Custom UDP test with specific bitrate
    {
        'name': 'UDP Custom Rate', 
        'params': ['-c', '{server}', '-t', '15', '-u', '-b', '750M', '-J']
    },
    
    # Custom window size test
    {
        'name': 'TCP Custom Window', 
        'params': ['-c', '{server}', '-t', '10', '-w', '384K', '-J']
    }
]
```

#### Scenario Parameter Reference

**Common iperf3 Parameters**:
- `-t <seconds>`: Test duration
- `-P <streams>`: Number of parallel streams
- `-w <window>`: TCP window size (64K, 128K, 256K, etc.)
- `-l <length>`: Buffer length/packet size
- `-b <bitrate>`: Target bitrate for UDP (100M, 500M, 1G)
- `-R`: Reverse mode (server sends to client)
- `-u`: UDP mode
- `-J`: JSON output format (required)

**Advanced Parameters**:
- `-C <algo>`: TCP congestion control algorithm
- `-M <mss>`: TCP maximum segment size
- `-N`: No delay (disable Nagle's algorithm)
- `-Z`: Zero copy (sendfile)
- `-O <seconds>`: Omit initial seconds from results

### Custom Test Scenarios

#### High-Performance Testing
```python
# High-throughput scenarios for 10Gbps+ networks
high_performance_scenarios = [
    {'name': 'TCP 10G Baseline', 'params': ['-c', '{server}', '-t', '30', '-P', '1', '-J']},
    {'name': 'TCP 10G Parallel', 'params': ['-c', '{server}', '-t', '30', '-P', '4', '-J']},
    {'name': 'UDP 10G Test', 'params': ['-c', '{server}', '-t', '30', '-u', '-b', '10G', '-J']},
]
```

#### Low-Latency Testing
```python
# Optimized for low-latency networks
low_latency_scenarios = [
    {'name': 'TCP Low Latency', 'params': ['-c', '{server}', '-t', '10', '-N', '-J']},
    {'name': 'TCP Small Window', 'params': ['-c', '{server}', '-t', '10', '-w', '32K', '-J']},
    {'name': 'UDP Low Jitter', 'params': ['-c', '{server}', '-t', '10', '-u', '-b', '100M', '-l', '1400', '-J']},
]
```

#### Congestion Control Testing
```python
# Different congestion control algorithms
congestion_scenarios = [
    {'name': 'TCP Cubic', 'params': ['-c', '{server}', '-t', '20', '-C', 'cubic', '-J']},
    {'name': 'TCP BBR', 'params': ['-c', '{server}', '-t', '20', '-C', 'bbr', '-J']},
    {'name': 'TCP Reno', 'params': ['-c', '{server}', '-t', '20', '-C', 'reno', '-J']},
]
```

### DNS Testing Customization

#### Custom DNS Servers

```python
# Modify default DNS servers
def run_all_dns_tests(self, dns_servers: List[str] = None) -> None:
    if dns_servers is None:
        dns_servers = [
            None,           # System DNS
            '8.8.8.8',      # Google Primary
            '8.8.4.4',      # Google Secondary
            '1.1.1.1',      # Cloudflare Primary
            '1.0.0.1',      # Cloudflare Secondary
            '9.9.9.9',      # Quad9
            '208.67.222.222', # OpenDNS
        ]
```

#### Custom dig Parameters

```python
# Modify dig command parameters
def run_dns_performance_test(self, domain: str, dns_server: str = None) -> Dict:
    cmd = [
        'dig', 
        '+time=10',     # Increased timeout
        '+tries=5',     # More retry attempts
        '+short',       # Concise output
        '+tcp'          # Force TCP instead of UDP
    ]
```

#### Zone File Customization

**Custom Zone File Format**:
```
# Custom testing domains
test1.internal.com.    1    IN    A    100.64.1.10
test2.internal.com.    1    IN    A    100.64.1.20
api.internal.com.      1    IN    A    100.64.1.30
db.internal.com.       1    IN    A    100.64.1.40

# CNAME testing
www.internal.com.      1    IN    CNAME test1.internal.com.
admin.internal.com.    1    IN    CNAME api.internal.com.
```

## Performance Tuning Configuration

### Test Execution Tuning

#### Timeout Configuration
```python
# Modify timeout calculation
def run_iperf_test(self, server: str, scenario: Dict) -> Dict:
    # Custom timeout logic
    base_timeout = 60
    duration_multiplier = 1.5
    
    for i, p in enumerate(params):
        if p == '-t' and i + 1 < len(params):
            try:
                test_duration = int(params[i+1])
                timeout_sec = int(test_duration * duration_multiplier) + base_timeout
            except ValueError:
                timeout_sec = base_timeout
```

#### Retry Configuration
```python
# Custom retry logic for failed tests
def run_iperf_test_with_retry(self, server: str, scenario: Dict, max_retries: int = 3) -> Dict:
    for attempt in range(max_retries):
        result = self.run_iperf_test(server, scenario)
        if result['success']:
            return result
        time.sleep(5)  # Wait between retries
    return result  # Return last failed attempt
```

#### Concurrent Testing Configuration
```python
# Adjust DNS testing concurrency
def run_all_dns_tests(self, dns_servers: List[str] = None) -> None:
    # Reduce concurrent workers for resource-constrained systems
    max_workers = 3  # Default is 5
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        # ... rest of implementation
```

### Memory and Resource Optimization

#### Result Data Management
```python
# Limit raw data storage for memory efficiency
def run_all_iperf_tests(self, servers: List[str]) -> None:
    # Store only essential raw data
    aggregated = {
        'server': server,
        'scenario': scenario['name'],
        'success': True,
        'bandwidth_mbps': statistics.median(bw_list),
        # Store only summary statistics instead of all raw data
        'raw_data_summary': {
            'sample_count': len(successful_trials),
            'bandwidth_stats': {
                'min': min(bw_list),
                'max': max(bw_list),
                'std': statistics.stdev(bw_list) if len(bw_list) > 1 else 0
            }
        }
    }
```

#### Batch Processing Configuration
```python
# Process servers in batches to manage resource usage
def run_tests_in_batches(self, servers: List[str], batch_size: int = 3):
    for i in range(0, len(servers), batch_size):
        batch = servers[i:i + batch_size]
        print(f"Processing batch {i//batch_size + 1}: {batch}")
        
        for server in batch:
            self.run_all_iperf_tests([server])
            
        # Optional: Clear intermediate results to free memory
        if hasattr(self, 'intermediate_results'):
            self.intermediate_results.clear()
```

## Output Format Customization

### JSON Output Structure

#### Custom Parameters File
```python
def generate_parameters_file(self, output_dir: str, custom_params: Dict = None) -> str:
    parameters = {
        'backend_server': self.current_server,
        'mtu': self.network_mtu,
        'query_logging': 'disabled',
        'timestamp': datetime.now().isoformat(),
        'test_scenarios': [s['name'] for s in self.iperf_scenarios],
        'dns_servers': self.dns_servers_used,
        'custom_configuration': custom_params or {}
    }
    
    filename = f"parameters-results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    filepath = os.path.join(output_dir, filename)
    
    with open(filepath, 'w') as f:
        json.dump(parameters, f, indent=2)
    
    return filepath
```

#### Extended Results Format
```python
def generate_extended_results(self) -> Dict:
    return {
        'metadata': {
            'test_version': '2.0',
            'system_info': {
                'platform': platform.system(),
                'python_version': platform.python_version(),
                'hostname': platform.node()
            },
            'test_duration': self.total_test_duration,
            'test_timestamp': datetime.now().isoformat()
        },
        'iperf_tests': self.results['iperf_tests'],
        'dns_tests': self.results['dns_tests'],
        'summary_statistics': self.calculate_summary_stats()
    }
```

### Visualization Customization

#### Custom Chart Configuration
```python
def create_custom_visualizations(self, output_dir: str = 'performance_results') -> None:
    # Custom color schemes
    colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd']
    
    # Custom figure sizes and DPI
    plt.figure(figsize=(16, 10))
    
    # Custom styling
    plt.style.use('seaborn-v0_8')  # or 'ggplot', 'bmh', etc.
    
    # Custom chart types
    # Box plots for distribution analysis
    # Heatmaps for correlation analysis
    # Time series plots for temporal analysis
```

#### Report Template Customization
```python
def generate_custom_report(self) -> str:
    template = """
# Network Performance Analysis Report

## Executive Summary
{executive_summary}

## Test Configuration
- **Test Date**: {test_date}
- **Servers Tested**: {server_count}
- **DNS Servers**: {dns_servers}
- **Total Tests**: {total_tests}

## Performance Highlights
{performance_highlights}

## Detailed Analysis
{detailed_analysis}

## Recommendations
{recommendations}
"""
    
    return template.format(
        executive_summary=self.generate_executive_summary(),
        test_date=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        server_count=len(self.servers_tested),
        dns_servers=', '.join(self.dns_servers_used),
        total_tests=len(self.results['iperf_tests']) + len(self.results['dns_tests']),
        performance_highlights=self.generate_highlights(),
        detailed_analysis=self.generate_detailed_analysis(),
        recommendations=self.generate_recommendations()
    )
```

## Environment-Specific Configuration

### Development Environment
```python
# Development configuration with reduced test times
DEVELOPMENT_CONFIG = {
    'iperf_test_duration': 5,      # Reduced from 10-90 seconds
    'iperf_parallel_streams': 2,   # Reduced from 4-32 streams
    'dns_timeout': 3,              # Reduced from 5 seconds
    'retry_attempts': 1,           # Reduced from 3 attempts
    'concurrent_dns_workers': 2    # Reduced from 5 workers
}
```

### Production Environment
```python
# Production configuration with comprehensive testing
PRODUCTION_CONFIG = {
    'iperf_test_duration': 'default',  # Use scenario defaults
    'iperf_parallel_streams': 'default',
    'dns_timeout': 10,                 # Increased timeout
    'retry_attempts': 5,               # More retry attempts
    'concurrent_dns_workers': 10,      # More concurrent workers
    'enable_detailed_logging': True,
    'generate_all_visualizations': True
}
```

### High-Performance Environment
```python
# Configuration for high-performance networks
HIGH_PERFORMANCE_CONFIG = {
    'iperf_scenarios': 'high_throughput',  # Custom scenario set
    'test_duration_multiplier': 2.0,       # Longer tests
    'enable_zero_copy': True,              # iperf3 -Z flag
    'tcp_window_sizes': ['1M', '2M', '4M'], # Larger windows
    'udp_bitrates': ['5G', '10G', '25G']   # Higher bitrates
}
```

## Integration Configuration

### Analysis Pipeline Integration

#### File Naming Convention
```python
def generate_output_filenames(self, config_name: str) -> Dict[str, str]:
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    return {
        'results': f"results_{timestamp}.json",
        'parameters': f"parameters-results_{timestamp}.json",
        'config_marker': f"{config_name}-mtu{self.mtu}-logs_{self.logging_status}",
        'directory': f"{config_name}-mtu{self.mtu}-logs_{self.logging_status}"
    }
```

#### Metadata Enhancement
```python
def add_analysis_metadata(self, results: Dict) -> Dict:
    results['analysis_metadata'] = {
        'data_gatherer_version': '2.0',
        'compatible_analyzer_versions': ['1.0', '1.1', '2.0'],
        'data_format_version': '2.0',
        'required_analysis_features': [
            'iperf3_analysis',
            'dns_analysis', 
            'cgn_validation',
            'statistical_aggregation'
        ]
    }
    return results
```

### Custom Plugin Architecture

#### Plugin Interface
```python
class TestPlugin:
    def __init__(self, config: Dict):
        self.config = config
    
    def pre_test_hook(self, test_context: Dict) -> Dict:
        """Called before each test execution"""
        pass
    
    def post_test_hook(self, test_result: Dict) -> Dict:
        """Called after each test execution"""
        pass
    
    def custom_analysis(self, results: List[Dict]) -> Dict:
        """Custom analysis of results"""
        pass
```

#### Example Custom Plugin
```python
class LatencyAnalysisPlugin(TestPlugin):
    def post_test_hook(self, test_result: Dict) -> Dict:
        if 'iperf_data' in test_result:
            # Extract latency metrics from iperf3 data
            latency_data = self.extract_latency_metrics(test_result['iperf_data'])
            test_result['latency_analysis'] = latency_data
        return test_result
    
    def extract_latency_metrics(self, iperf_data: Dict) -> Dict:
        # Custom latency analysis implementation
        return {
            'rtt_min': self.calculate_min_rtt(iperf_data),
            'rtt_avg': self.calculate_avg_rtt(iperf_data),
            'rtt_max': self.calculate_max_rtt(iperf_data)
        }
```

This comprehensive configuration reference enables complete customization of the Network Performance Data Gatherer for any testing environment or specific requirements.