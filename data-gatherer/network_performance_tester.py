#!/usr/bin/env python3
"""
Comprehensive Network Performance Testing Suite
Tests iperf3 performance and DNS resolution between different endpoints
"""

import subprocess
import json
import time
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
from datetime import datetime
import os
import argparse
from typing import Dict, List, Tuple
import concurrent.futures
import statistics
import platform
import shutil
import re
import ipaddress # For CIDR block validation

class NetworkPerformanceTester:
    def __init__(self):
        self.results = {
            'iperf_tests': [],
            'dns_tests': []
        }
        
        # Define the Carrier-Grade NAT (CGN) CIDR block for validation
        self.cgn_cidr = ipaddress.ip_network('100.64.0.0/10')

        # Load DNS entries from the provided zone file
        self.dns_entries_from_zone = self._parse_zone_file("thepi.es.txt")
        self.dns_domains_to_test = list(self.dns_entries_from_zone.keys())
        
        # iperf test scenarios - optimized for stress testing and detailed data collection
        self.iperf_scenarios = [
            # TCP Bandwidth Stress Tests (focus on parallelism and congestion)
            {'name': 'TCP Bandwidth (Parallel 4)', 'params': ['-c', '{server}', '-t', '15', '-P', '4', '-J']},
            {'name': 'TCP Bandwidth (Parallel 8)', 'params': ['-c', '{server}', '-t', '20', '-P', '8', '-J']},
            {'name': 'TCP Bandwidth (Reverse, P4)', 'params': ['-c', '{server}', '-t', '15', '-R', '-P', '4', '-J']},
            {'name': 'TCP Congestion Test (P8, T30)', 'params': ['-c', '{server}', '-t', '30', '-P', '8', '-J']},
            {'name': 'High Congestion (P16, T60)', 'params': ['-c', '{server}', '-t', '60', '-P', '16', '-J']},
            {'name': 'Very High Congestion (P32, T90)', 'params': ['-c', '{server}', '-t', '90', '-P', '32', '-J']},

            # TCP Window Size Tests (to understand buffer impact)
            {'name': 'TCP Window Size 64K', 'params': ['-c', '{server}', '-t', '10', '-w', '64K', '-J']},
            {'name': 'TCP Window Size 128K', 'params': ['-c', '{server}', '-t', '10', '-w', '128K', '-J']},
            {'name': 'TCP Window Size 256K', 'params': ['-c', '{server}', '-t', '10', '-w', '256K', '-J']},
            {'name': 'TCP Window Size 512K', 'params': ['-c', '{server}', '-t', '10', '-w', '512K', '-J']},
            {'name': 'TCP Window Size 1M', 'params': ['-c', '{server}', '-t', '10', '-w', '1M', '-J']},

            # TCP Packet Size Tests
            {'name': 'TCP Small Packets (64B)', 'params': ['-c', '{server}', '-t', '10', '-l', '64', '-J']},
            {'name': 'TCP Large Packets (64KB)', 'params': ['-c', '{server}', '-t', '10', '-l', '64K', '-J']},

            # UDP Bandwidth Stress Tests (up to 1 Gbps)
            {'name': 'UDP Bandwidth (100Mbps)', 'params': ['-c', '{server}', '-t', '10', '-u', '-b', '100M', '-J']},
            {'name': 'UDP Bandwidth (200Mbps)', 'params': ['-c', '{server}', '-t', '15', '-u', '-b', '200M', '-J']},
            {'name': 'UDP Bandwidth (500Mbps)', 'params': ['-c', '{server}', '-t', '20', '-u', '-b', '500M', '-J']},
            {'name': 'UDP Bandwidth (1Gbps)', 'params': ['-c', '{server}', '-t', '25', '-u', '-b', '1G', '-J']},
            {'name': 'UDP Bandwidth (1Gbps, Small Pkt)', 'params': ['-c', '{server}', '-t', '25', '-u', '-b', '1G', '-l', '64', '-J']},
            {'name': 'UDP Bandwidth (1Gbps, Large Pkt)', 'params': ['-c', '{server}', '-t', '25', '-u', '-b', '1G', '-l', '1400', '-J']},
        ]

    def _parse_zone_file(self, filename: str) -> Dict[str, Dict]:
        """
        Parses a simplified zone file to extract A and CNAME records.
        Returns a dictionary where keys are domain names and values are
        dictionaries containing 'type' ('A' or 'CNAME') and 'target' (IP or CNAME target).
        """
        parsed_records = {}
        try:
            with open(filename, 'r') as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith(';') or line.startswith('$'):
                        continue

                    parts = re.split(r'\s+', line)
                    if len(parts) < 4:
                        continue

                    domain = parts[0].rstrip('.') # Remove trailing dot
                    record_type = parts[3].upper()
                    target = parts[4]

                    if record_type == 'A':
                        parsed_records[domain] = {'type': 'A', 'target': target}
                    elif record_type == 'CNAME':
                        parsed_records[domain] = {'type': 'CNAME', 'target': target.rstrip('.')} # Remove trailing dot
        except FileNotFoundError:
            print(f"Warning: Zone file '{filename}' not found. DNS tests will use default entries.")
        return parsed_records

    def _is_cgn_ip(self, ip_address: str) -> bool:
        """Checks if an IP address is within the 100.64.0.0/10 CIDR block."""
        try:
            return ipaddress.ip_address(ip_address) in self.cgn_cidr
        except ipaddress.AddressValueError:
            return False

    def print_iperf_result(self, result: Dict) -> None:
        """Print iperf test result to CLI in a formatted way"""
        print("  " + "─" * 60)
        if result['success']:
            print(f"  ✅ {result['scenario']} → {result['server']}")
            print(f"     Median Bandwidth: {result['bandwidth_mbps']:.2f} Mbps")
            if result.get('retransmits', 0) > 0:
                print(f"     Median Retransmits: {result['retransmits']}")
            if result.get('jitter_ms', 0) > 0:
                print(f"     Median Jitter: {result['jitter_ms']:.2f} ms")
            if result.get('packet_loss', 0) > 0:
                print(f"     Median Packet Loss: {result['packet_loss']:.2f}%")
            print(f"     Median Duration: {result['duration']:.1f}s")
            # Add more technical details if available
            if result.get('data'):
                if 'start' in result['data'] and 'test_start' in result['data']['start']:
                    print(f"     TCP MSS: {result['data']['start']['test_start'].get('mss', 'N/A')}")
                    print(f"     Congestion Control: {result['data']['start']['test_start'].get('congestion_control', 'N/A')}")
                if 'end' in result['data'] and 'cpu_utilization_percent' in result['data']['end']:
                    cpu_end = result['data']['end']['cpu_utilization_percent']
                    print(f"     CPU Utilization (Sender/Receiver): {cpu_end.get('sender', 'N/A')}% / {cpu_end.get('receiver', 'N/A')}%")
        else:
            print(f"  ❌ {result['scenario']} → {result['server']}")
            print(f"     Error: {result.get('error', 'Unknown error')}")
        print("  " + "─" * 60)

    def run_iperf_test(self, server: str, scenario: Dict) -> Dict:
        """Run a single iperf3 test scenario"""
        print(f"Running {scenario['name']} on {server}...")
        params = [param.format(server=server) if '{server}' in param else param for param in scenario['params']]
        cmd = ['iperf3'] + params
        
        # Determine timeout based on test duration, with a safety margin
        timeout_sec = 60 # Default if -t is not found
        for i, p in enumerate(params):
            if p == '-t' and i + 1 < len(params):
                try:
                    timeout_sec = int(params[i+1]) + 20 # Add 20s headroom
                except ValueError:
                    pass
        
        start_time = time.time()
        try:
            result = subprocess.run(cmd,
                                    capture_output=True,
                                    text=True,
                                    timeout=timeout_sec)
            end_time = time.time()
        except subprocess.TimeoutExpired:
            return {
                'server': server,
                'scenario': scenario['name'],
                'success': False,
                'error': 'Timeout',
                'duration': timeout_sec,
                'data': {} # Ensure data field is present even on failure
            }
        else:
            if result.returncode == 0 and result.stdout:
                try:
                    json_data = json.loads(result.stdout)
                    return {
                        'server': server,
                        'scenario': scenario['name'],
                        'success': True,
                        'duration': end_time - start_time,
                        'data': json_data, # Store full JSON data
                        'bandwidth_mbps': self.extract_bandwidth(json_data),
                        'retransmits': self.extract_retransmits(json_data),
                        'jitter_ms': self.extract_jitter(json_data),
                        'packet_loss': self.extract_packet_loss(json_data)
                    }
                except json.JSONDecodeError:
                    return {
                        'server': server,
                        'scenario': scenario['name'],
                        'success': False,
                        'error': 'Invalid JSON output from iperf3',
                        'duration': end_time - start_time,
                        'data': {}
                    }
            else:
                return {
                    'server': server,
                    'scenario': scenario['name'],
                    'success': False,
                    'error': result.stderr or 'Unknown error',
                    'duration': end_time - start_time,
                    'data': {}
                }
 

    def run_all_iperf_tests(self, servers: List[str]) -> None:
        """Run all iperf3 test scenarios for all servers, each scenario run 5 times with median results"""
        print("Starting iperf3 performance tests...")
        print("=" * 80)
        total_tests = len(servers) * len(self.iperf_scenarios)
        current_test = 0
        for server in servers:
            print(f"\n🖥️  Testing server: {server}")
            print("=" * 80)
            for scenario in self.iperf_scenarios:
                current_test += 1
                print(f"\n📊 Progress: {current_test}/{total_tests} ({scenario['name']})")
                trial_results = []
                # Run the scenario 5 times
                for i in range(5):
                    trial_results.append(self.run_iperf_test(server, scenario))
                    time.sleep(1) # Small delay between trials
                
                # Filter successful runs for aggregation
                successful_trials = [r for r in trial_results if r['success']]

                if successful_trials:
                    # Aggregate metrics from successful runs
                    bw_list = [r['bandwidth_mbps'] for r in successful_trials]
                    rt_list = [r['retransmits'] for r in successful_trials]
                    j_list = [r['jitter_ms'] for r in successful_trials]
                    pl_list = [r['packet_loss'] for r in successful_trials]
                    dur_list = [r['duration'] for r in successful_trials]
                    
                    aggregated = {
                        'server': server,
                        'scenario': scenario['name'],
                        'success': True,
                        'bandwidth_mbps': statistics.median(bw_list),
                        'retransmits': int(statistics.median(rt_list)),
                        'jitter_ms': statistics.median(j_list),
                        'packet_loss': statistics.median(pl_list),
                        'duration': statistics.median(dur_list),
                        'all_raw_data': [r['data'] for r in successful_trials] # Store all raw data for detailed analysis
                    }
                else:
                    # All runs failed
                    errors = [r.get('error', 'Unknown') for r in trial_results]
                    aggregated = {
                        'server': server,
                        'scenario': scenario['name'],
                        'success': False,
                        'error': '; '.join(errors),
                        'bandwidth_mbps': 0.0,
                        'retransmits': 0,
                        'jitter_ms': 0.0,
                        'packet_loss': 0.0,
                        'duration': statistics.median([r['duration'] for r in trial_results]),
                        'all_raw_data': [] # No successful data
                    }
                self.results['iperf_tests'].append(aggregated)
                self.print_iperf_result(aggregated)
                time.sleep(1) # Small delay between scenarios

    def extract_bandwidth(self, json_data: Dict) -> float:
        """Extract bandwidth from iperf3 JSON output"""
        try:
            if 'end' in json_data:
                if 'sum_received' in json_data['end'] and 'bits_per_second' in json_data['end']['sum_received']:
                    return json_data['end']['sum_received']['bits_per_second'] / 1_000_000
                elif 'sum_sent' in json_data['end'] and 'bits_per_second' in json_data['end']['sum_sent']:
                    # For reverse tests, sum_sent might be more relevant
                    return json_data['end']['sum_sent']['bits_per_second'] / 1_000_000
            return 0.0
        except (KeyError, TypeError):
            return 0.0

    def extract_retransmits(self, json_data: Dict) -> int:
        """Extract retransmit count from iperf3 JSON output"""
        try:
            if 'end' in json_data and 'sum_sent' in json_data['end']:
                return json_data['end']['sum_sent'].get('retransmits', 0)
            return 0
        except (KeyError, TypeError):
            return 0

    def extract_jitter(self, json_data: Dict) -> float:
        """Extract jitter from UDP tests"""
        try:
            if 'end' in json_data and 'sum' in json_data['end']:
                return json_data['end']['sum'].get('jitter_ms', 0.0)
            return 0.0
        except (KeyError, TypeError):
            return 0.0

    def extract_packet_loss(self, json_data: Dict) -> float:
        """Extract packet loss percentage from UDP tests"""
        try:
            if 'end' in json_data and 'sum' in json_data['end']:
                return json_data['end']['sum'].get('lost_percent', 0.0)
            return 0.0
        except (KeyError, TypeError):
            return 0.0

    def run_dns_performance_test(self, domain: str, dns_server: str = None) -> Dict:
        """
        Run DNS performance test for a single domain, validating against CGN IP range
        and zone file records.
        """
        result_entry = {
            'domain': domain,
            'dns_server': dns_server or 'system',
            'success': False,
            'response_time_ms': 0.0,
            'query_time_ms': 0.0,
            'status': 'FAILED_VALIDATION',
            'resolved_ips': [],
            'error': ''
        }

        # 1. Check if the domain is in our parsed zone file
        if domain not in self.dns_domains_to_test:
            result_entry['error'] = f"Domain '{domain}' not found in the provided zone file."
            return result_entry
        
        # 2. Run dig command
        cmd = ['dig', '+time=5', '+tries=3', '+short'] # Use +short for cleaner output
        if dns_server:
            cmd.extend(['@' + dns_server])
        cmd.append(domain)
        
        try:
            start_time = time.time()
            process_result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            end_time = time.time()
            
            response_time = (end_time - start_time) * 1000  # Convert to ms
            result_entry['response_time_ms'] = response_time

            if process_result.returncode != 0:
                result_entry['error'] = process_result.stderr or 'dig command failed'
                return result_entry
            
            # Parse dig output for IPs and CNAMEs
            resolved_ips = []
            cname_targets = []
            
            # The +short output will list IPs or CNAMEs directly
            lines = process_result.stdout.strip().split('\n')
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Check for CNAME first
                if 'CNAME' in line: # This might not be precise with +short, dig usually just lists the next target
                    cname_targets.append(line.split()[0]) # Assuming format "target.example.com."
                else:
                    # Assume it's an IP address if not a CNAME. Validate it.
                    try:
                        ip_address = str(ipaddress.ip_address(line))
                        resolved_ips.append(ip_address)
                    except ValueError:
                        # Not an IP, could be another CNAME or something else unexpected
                        pass
            
            result_entry['resolved_ips'] = resolved_ips

            # Determine the effective domain for validation (final A record target)
            effective_domain_for_validation = domain
            if cname_targets:
                # If there were CNAMEs, the last IP in resolved_ips is the one we care about.
                # If no IPs were resolved but CNAMEs were, it means the CNAME chain didn't lead to an A record.
                if not resolved_ips:
                    result_entry['error'] = f"CNAME chain for '{domain}' did not resolve to an A record."
                    return result_entry

            # Validate the resolved IPs against the CGN CIDR
            is_valid_cgn = False
            for ip in resolved_ips:
                if self._is_cgn_ip(ip):
                    is_valid_cgn = True
                    break
            
            if is_valid_cgn:
                result_entry['success'] = True
                result_entry['status'] = 'SUCCESS'
                # For query_time_ms, dig +short doesn't give it directly.
                # We'll use the response_time_ms as a proxy.
                result_entry['query_time_ms'] = response_time
            else:
                result_entry['error'] = "Resolved IP(s) not within 100.64.0.0/10 CGN range."
                result_entry['status'] = 'FAILED_CGN_VALIDATION'
                
        except subprocess.TimeoutExpired:
            result_entry['response_time_ms'] = 10000  # Timeout value
            result_entry['error'] = 'Timeout'
            result_entry['status'] = 'TIMEOUT'
        except Exception as e:
            result_entry['error'] = f"An unexpected error occurred: {e}"
            result_entry['status'] = 'ERROR'
            
        return result_entry

    def run_all_dns_tests(self, dns_servers: List[str] = None) -> None:
        """Run DNS performance tests for all domains from the zone file"""
        print("\nStarting DNS performance tests...")
        
        if dns_servers is None:
            dns_servers = [None, '8.8.8.8', '1.1.1.1']  # System, Google, Cloudflare
        
        # Test each domain from the parsed zone file with each DNS server
        for dns_server in dns_servers:
            server_name = dns_server or 'system'
            print(f"\nTesting with DNS server: {server_name}")
            
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                futures = []
                for domain in self.dns_domains_to_test: # Use domains from parsed zone file
                    future = executor.submit(self.run_dns_performance_test, domain, dns_server)
                    futures.append(future)
                
                for future in concurrent.futures.as_completed(futures):
                    result = future.result()
                    self.results['dns_tests'].append(result)
                    # Print immediate result for visibility
                    if result['success']:
                        print(f"  ✅ {result['domain']} ({server_name}): {result['query_time_ms']:.2f} ms, IPs: {', '.join(result['resolved_ips'])}")
                    else:
                        print(f"  ❌ {result['domain']} ({server_name}): {result['status']} - {result['error']}")

    def generate_iperf_report(self) -> str:
        """Generate human-readable iperf performance report"""
        if not self.results['iperf_tests']:
            return "No iperf test results available."
        
        df = pd.DataFrame(self.results['iperf_tests'])
        successful_tests = df[df['success'] == True]
        
        if successful_tests.empty:
            return "No successful iperf tests completed."
        
        report = []
        report.append("=" * 80)
        report.append("IPERF3 PERFORMANCE ANALYSIS REPORT")
        report.append("=" * 80)
        report.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append(f"Total tests: {len(df)}")
        report.append(f"Successful: {len(successful_tests)}")
        report.append(f"Failed: {len(df) - len(successful_tests)}")
        report.append("")
        
        # Summary by server
        for server in successful_tests['server'].unique():
            server_data = successful_tests[successful_tests['server'] == server]
            report.append(f"Server: {server}")
            report.append("-" * 40)
            
            # Calculate statistics
            bandwidths = server_data['bandwidth_mbps'].dropna()
            retransmits = server_data['retransmits'].dropna()
            jitters = server_data['jitter_ms'].dropna()
            packet_losses = server_data['packet_loss'].dropna()

            if not bandwidths.empty:
                report.append(f"Bandwidth Statistics (Mbps):")
                report.append(f"  Average: {bandwidths.mean():.2f}")
                report.append(f"  Median:  {bandwidths.median():.2f}")
                report.append(f"  Min:     {bandwidths.min():.2f}")
                report.append(f"  Max:     {bandwidths.max():.2f}")
                report.append(f"  Std Dev: {bandwidths.std():.2f}")
            
            if not retransmits.empty:
                report.append(f"Retransmits Statistics:")
                report.append(f"  Average: {retransmits.mean():.2f}")
                report.append(f"  Median:  {retransmits.median():.2f}")
            
            if not jitters.empty:
                report.append(f"Jitter Statistics (ms):")
                report.append(f"  Average: {jitters.mean():.2f}")
                report.append(f"  Median:  {jitters.median():.2f}")

            if not packet_losses.empty:
                report.append(f"Packet Loss Statistics (%):")
                report.append(f"  Average: {packet_losses.mean():.2f}")
                report.append(f"  Median:  {packet_losses.median():.2f}")
            
            report.append("")
            
            # Best performing scenarios
            top_scenarios = server_data.nlargest(3, 'bandwidth_mbps')[['scenario', 'bandwidth_mbps', 'retransmits']]
            report.append("Top 3 Performing Scenarios (by Bandwidth):")
            for idx, row in top_scenarios.iterrows():
                report.append(f"  {row['scenario']}: {row['bandwidth_mbps']:.2f} Mbps (Retransmits: {row['retransmits']})")
            
            report.append("")
        
        # Comparison between servers
        if len(successful_tests['server'].unique()) > 1:
            report.append("SERVER COMPARISON (Median Bandwidth Mbps)")
            report.append("-" * 40)
            
            comparison = successful_tests.groupby('server')['bandwidth_mbps'].agg([
                'mean', 'median', 'std', 'min', 'max'
            ]).round(2)
            
            report.append(comparison.to_string())
            report.append("")
        
        return "\n".join(report)

    def generate_dns_report(self) -> str:
        """Generate human-readable DNS performance report"""
        if not self.results['dns_tests']:
            return "No DNS test results available."
        
        df = pd.DataFrame(self.results['dns_tests'])
        
        # Filter for successful tests that passed CGN validation
        successful_tests = df[(df['success'] == True) & (df['status'] == 'SUCCESS')]
        failed_tests = df[df['success'] == False]
        
        report = []
        report.append("=" * 80)
        report.append("DNS PERFORMANCE ANALYSIS REPORT")
        report.append("=" * 80)
        report.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append(f"Total DNS queries attempted: {len(df)}")
        report.append(f"Successful DNS queries (CGN Validated): {len(successful_tests)}")
        report.append(f"Failed DNS queries: {len(failed_tests)}")
        report.append("")
        
        if successful_tests.empty:
            report.append("No successful DNS tests passed CGN validation.")
        else:
            # Summary by DNS server
            for dns_server in successful_tests['dns_server'].unique():
                server_data = successful_tests[successful_tests['dns_server'] == dns_server]
                report.append(f"DNS Server: {dns_server}")
                report.append("-" * 40)
                
                query_times = server_data['query_time_ms'].dropna()
                if not query_times.empty:
                    report.append(f"Query Time Statistics (ms):")
                    report.append(f"  Average: {query_times.mean():.2f}")
                    report.append(f"  Median:  {query_times.median():.2f}")
                    report.append(f"  Min:     {query_times.min():.2f}")
                    report.append(f"  Max:     {query_times.max():.2f}")
                    report.append(f"  Std Dev: {query_times.std():.2f}")
                
                report.append("")
                
                # Slowest domains
                slowest = server_data.nlargest(5, 'query_time_ms')[['domain', 'query_time_ms', 'resolved_ips']]
                report.append("5 Slowest Domains (CGN Validated):")
                for idx, row in slowest.iterrows():
                    report.append(f"  {row['domain']}: {row['query_time_ms']:.2f} ms (IPs: {', '.join(row['resolved_ips'])})")
                
                report.append("")

        if not failed_tests.empty:
            report.append("FAILED DNS QUERIES SUMMARY")
            report.append("-" * 40)
            for idx, row in failed_tests.iterrows():
                report.append(f"  Domain: {row['domain']}, Server: {row['dns_server']}, Status: {row['status']}, Error: {row['error']}")
            report.append("")
        
        return "\n".join(report)

    def create_visualizations(self, output_dir: str = 'performance_results') -> None:
        """Create performance visualization charts"""
        os.makedirs(output_dir, exist_ok=True)
        
        # iperf bandwidth comparison
        if self.results['iperf_tests']:
            df_iperf = pd.DataFrame(self.results['iperf_tests'])
            successful_iperf = df_iperf[df_iperf['success'] == True]
            
            if not successful_iperf.empty:
                plt.figure(figsize=(14, 9)) # Increased figure size
                
                # Bandwidth by server and scenario
                pivot_data = successful_iperf.pivot_table(
                    values='bandwidth_mbps', 
                    index='scenario', 
                    columns='server', 
                    aggfunc='median' # Use median for consistency with report
                )
                
                pivot_data.plot(kind='bar', ax=plt.gca())
                plt.title('iperf3 Median Bandwidth Performance by Server and Scenario')
                plt.xlabel('Test Scenario')
                plt.ylabel('Bandwidth (Mbps)')
                plt.xticks(rotation=45, ha='right', fontsize=9) # Adjust font size for readability
                plt.yticks(fontsize=9)
                plt.legend(title='Server', bbox_to_anchor=(1.05, 1), loc='upper left') # Move legend
                plt.grid(axis='y', linestyle='--', alpha=0.7)
                plt.tight_layout()
                plt.savefig(f'{output_dir}/iperf_bandwidth_comparison.png', dpi=300)
                plt.close()

                # Retransmits visualization
                retransmits_data = successful_iperf.pivot_table(
                    values='retransmits', 
                    index='scenario', 
                    columns='server', 
                    aggfunc='median'
                )
                if not retransmits_data.empty and retransmits_data.sum().sum() > 0: # Only plot if there are retransmits
                    plt.figure(figsize=(14, 9))
                    retransmits_data.plot(kind='bar', ax=plt.gca())
                    plt.title('iperf3 Median Retransmits by Server and Scenario')
                    plt.xlabel('Test Scenario')
                    plt.ylabel('Retransmits')
                    plt.xticks(rotation=45, ha='right', fontsize=9)
                    plt.yticks(fontsize=9)
                    plt.legend(title='Server', bbox_to_anchor=(1.05, 1), loc='upper left')
                    plt.grid(axis='y', linestyle='--', alpha=0.7)
                    plt.tight_layout()
                    plt.savefig(f'{output_dir}/iperf_retransmits_comparison.png', dpi=300)
                    plt.close()
        
        # DNS performance comparison
        if self.results['dns_tests']:
            df_dns = pd.DataFrame(self.results['dns_tests'])
            successful_dns = df_dns[(df_dns['success'] == True) & (df_dns['status'] == 'SUCCESS')]
            
            if not successful_dns.empty:
                plt.figure(figsize=(12, 7)) # Adjusted figure size
                
                # Query time by DNS server
                dns_summary = successful_dns.groupby('dns_server')['query_time_ms'].agg(['mean', 'std'])
                
                dns_summary['mean'].plot(kind='bar', yerr=dns_summary['std'], ax=plt.gca(), capsize=4)
                plt.title('DNS Query Performance by Server (CGN Validated)')
                plt.xlabel('DNS Server')
                plt.ylabel('Mean Query Time (ms)')
                plt.xticks(rotation=45)
                plt.grid(axis='y', linestyle='--', alpha=0.7)
                plt.tight_layout()
                plt.savefig(f'{output_dir}/dns_performance_comparison.png', dpi=300)
                plt.close()

                # Top N slowest domains across all servers
                top_n = 10
                slowest_domains = successful_dns.nlargest(top_n, 'query_time_ms')
                if not slowest_domains.empty:
                    plt.figure(figsize=(12, 7))
                    plt.barh(slowest_domains['domain'], slowest_domains['query_time_ms'], color='skyblue')
                    plt.xlabel('Query Time (ms)')
                    plt.ylabel('Domain')
                    plt.title(f'Top {top_n} Slowest DNS Queries (CGN Validated)')
                    plt.gca().invert_yaxis() # Slowest at the top
                    plt.grid(axis='x', linestyle='--', alpha=0.7)
                    plt.tight_layout()
                    plt.savefig(f'{output_dir}/dns_slowest_domains.png', dpi=300)
                    plt.close()


    def save_results(self, filename: str = None) -> None:
        """Save results to JSON file"""
        if filename is None:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'performance_results_{timestamp}.json'
        
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"Results saved to: {filename}")

def main():
    parser = argparse.ArgumentParser(description='Network Performance Testing Suite')
    parser.add_argument('--iperf-servers', nargs='+', 
                       default=['iperf-stock.netskope.local', 'iperf-coredns.netskope.local'],
                       help='iperf3 servers to test')
    parser.add_argument('--dns-servers', nargs='+',
                       default=['8.8.8.8', '1.1.1.1'],
                       help='DNS servers to test (system DNS tested automatically)')
    parser.add_argument('--skip-iperf', action='store_true',
                       help='Skip iperf3 tests')
    parser.add_argument('--skip-dns', action='store_true',
                       help='Skip DNS tests')
    parser.add_argument('--output-dir', default='performance_results',
                       help='Output directory for results')
    
    args = parser.parse_args()
    
    tester = NetworkPerformanceTester()
    
    print("Network Performance Testing Suite")
    print("=" * 50)
    
    # Run tests
    if not args.skip_iperf:
        tester.run_all_iperf_tests(args.iperf_servers)
    
    if not args.skip_dns:
        # Pass the dns_domains_to_test to ensure only relevant domains are queried
        # The internal logic of run_dns_performance_test will filter based on zone file
        tester.run_all_dns_tests([None] + args.dns_servers)
    
    # Generate reports
    print("\n" + "=" * 80)
    print(tester.generate_iperf_report())
    print("\n" + "=" * 80)
    print(tester.generate_dns_report())
    
    # Create visualizations
    tester.create_visualizations(args.output_dir)
    
    # Save results
    os.makedirs(args.output_dir, exist_ok=True)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    tester.save_results(f'{args.output_dir}/results_{timestamp}.json')
    
    print(f"\nAll results saved to: {args.output_dir}/")

if __name__ == '__main__':
    main()
