# iperf3 Test Scenarios Documentation

## Overview

The Network Performance Data Gatherer implements 18 distinct iperf3 test scenarios designed to comprehensively evaluate network performance characteristics. Each scenario targets specific aspects of network behavior, from basic bandwidth measurement to complex congestion analysis and protocol-specific optimizations.

## Test Methodology

### Statistical Approach
- Each scenario runs **5 times** per server
- Results are aggregated using **median values** for reliability
- Failed tests are excluded from statistical calculations
- Raw data from all successful runs is preserved for detailed analysis

### Timeout Management
- Dynamic timeout calculation based on test duration
- Safety margin of 20 seconds added to expected test time
- Graceful handling of timeout scenarios with error reporting

## TCP Bandwidth Test Scenarios

### 1. TCP Bandwidth (Parallel 4)
**Purpose**: Baseline TCP bandwidth measurement with moderate parallelism

**Parameters**: 
```bash
iperf3 -c <server> -t 15 -P 4 -J
```

**Details**:
- **Duration**: 15 seconds
- **Parallel Streams**: 4
- **Protocol**: TCP
- **Use Case**: Standard bandwidth baseline for most network configurations

**Interpretation**:
- Provides reliable bandwidth measurement without excessive congestion
- Good balance between throughput and network stability
- Suitable for comparing different network configurations

### 2. TCP Bandwidth (Parallel 8)
**Purpose**: Higher parallelism bandwidth testing

**Parameters**:
```bash
iperf3 -c <server> -t 20 -P 8 -J
```

**Details**:
- **Duration**: 20 seconds
- **Parallel Streams**: 8
- **Protocol**: TCP
- **Use Case**: Testing network capacity under moderate load

**Interpretation**:
- Tests network's ability to handle multiple concurrent connections
- May reveal bandwidth scaling characteristics
- Useful for multi-user environment simulation

### 3. TCP Bandwidth (Reverse, P4)
**Purpose**: Reverse direction bandwidth testing

**Parameters**:
```bash
iperf3 -c <server> -t 15 -R -P 4 -J
```

**Details**:
- **Duration**: 15 seconds
- **Parallel Streams**: 4
- **Protocol**: TCP
- **Direction**: Server to client (reverse)
- **Use Case**: Testing asymmetric network behavior

**Interpretation**:
- Reveals upload vs download performance differences
- Important for asymmetric connections (DSL, cable, etc.)
- Helps identify directional network bottlenecks

## TCP Congestion Test Scenarios

### 4. TCP Congestion Test (P8, T30)
**Purpose**: Moderate congestion testing

**Parameters**:
```bash
iperf3 -c <server> -t 30 -P 8 -J
```

**Details**:
- **Duration**: 30 seconds
- **Parallel Streams**: 8
- **Protocol**: TCP
- **Use Case**: Testing network behavior under sustained moderate load

**Interpretation**:
- Evaluates TCP congestion control effectiveness
- Longer duration reveals sustained performance characteristics
- Useful for identifying network stability under load

### 5. High Congestion (P16, T60)
**Purpose**: High congestion stress testing

**Parameters**:
```bash
iperf3 -c <server> -t 60 -P 16 -J
```

**Details**:
- **Duration**: 60 seconds
- **Parallel Streams**: 16
- **Protocol**: TCP
- **Use Case**: Stress testing network infrastructure

**Interpretation**:
- Tests network behavior under high concurrent load
- May trigger congestion control mechanisms
- Reveals network breaking points and recovery behavior
- High retransmit rates may indicate network limitations

### 6. Very High Congestion (P32, T90)
**Purpose**: Extreme congestion testing

**Parameters**:
```bash
iperf3 -c <server> -t 90 -P 32 -J
```

**Details**:
- **Duration**: 90 seconds
- **Parallel Streams**: 32
- **Protocol**: TCP
- **Use Case**: Maximum stress testing

**Interpretation**:
- Tests absolute network limits
- May cause significant packet loss and retransmissions
- Useful for understanding network failure modes
- Results may show diminishing returns or performance degradation

## TCP Window Size Test Scenarios

### 7-11. TCP Window Size Tests (64K, 128K, 256K, 512K, 1M)
**Purpose**: Evaluate impact of TCP window size on performance

**Parameters**:
```bash
iperf3 -c <server> -t 10 -w <window_size> -J
```

**Window Sizes Tested**:
- 64K (65,536 bytes)
- 128K (131,072 bytes)
- 256K (262,144 bytes)
- 512K (524,288 bytes)
- 1M (1,048,576 bytes)

**Details**:
- **Duration**: 10 seconds each
- **Parallel Streams**: 1 (default)
- **Protocol**: TCP
- **Use Case**: TCP buffer optimization analysis

**Interpretation**:
- **Small Windows (64K-128K)**: May limit throughput on high-latency networks
- **Medium Windows (256K-512K)**: Often optimal for most network conditions
- **Large Windows (1M)**: May improve performance on high-bandwidth, high-latency networks
- **Bandwidth-Delay Product**: Optimal window size ≈ Bandwidth × Round-trip time

**Analysis Guidelines**:
- Compare throughput across different window sizes
- Identify optimal window size for specific network conditions
- Consider latency impact on window size effectiveness

## TCP Packet Size Test Scenarios

### 12. TCP Small Packets (64B)
**Purpose**: Small packet performance testing

**Parameters**:
```bash
iperf3 -c <server> -t 10 -l 64 -J
```

**Details**:
- **Duration**: 10 seconds
- **Packet Size**: 64 bytes
- **Protocol**: TCP
- **Use Case**: Testing network efficiency with small packets

**Interpretation**:
- Tests network overhead impact
- May show reduced throughput due to protocol overhead
- Important for applications with small message sizes
- Higher packet-per-second rates

### 13. TCP Large Packets (64KB)
**Purpose**: Large packet performance testing

**Parameters**:
```bash
iperf3 -c <server> -t 10 -l 64K -J
```

**Details**:
- **Duration**: 10 seconds
- **Packet Size**: 65,536 bytes
- **Protocol**: TCP
- **Use Case**: Testing network efficiency with large packets

**Interpretation**:
- Tests maximum packet size handling
- May approach MTU limitations
- Generally shows higher throughput efficiency
- Lower packet-per-second rates

## UDP Bandwidth Test Scenarios

### 14. UDP Bandwidth (100Mbps)
**Purpose**: Moderate UDP bandwidth testing

**Parameters**:
```bash
iperf3 -c <server> -t 10 -u -b 100M -J
```

**Details**:
- **Duration**: 10 seconds
- **Target Bitrate**: 100 Mbps
- **Protocol**: UDP
- **Use Case**: Baseline UDP performance measurement

**Interpretation**:
- Tests UDP throughput without congestion control
- Measures packet loss at moderate rates
- Establishes UDP baseline performance

### 15. UDP Bandwidth (200Mbps)
**Purpose**: Higher UDP bandwidth testing

**Parameters**:
```bash
iperf3 -c <server> -t 15 -u -b 200M -J
```

**Details**:
- **Duration**: 15 seconds
- **Target Bitrate**: 200 Mbps
- **Protocol**: UDP
- **Use Case**: Medium-rate UDP performance testing

### 16. UDP Bandwidth (500Mbps)
**Purpose**: High UDP bandwidth testing

**Parameters**:
```bash
iperf3 -c <server> -t 20 -u -b 500M -J
```

**Details**:
- **Duration**: 20 seconds
- **Target Bitrate**: 500 Mbps
- **Protocol**: UDP
- **Use Case**: High-rate UDP performance testing

### 17. UDP Bandwidth (1Gbps)
**Purpose**: Maximum UDP bandwidth testing

**Parameters**:
```bash
iperf3 -c <server> -t 25 -u -b 1G -J
```

**Details**:
- **Duration**: 25 seconds
- **Target Bitrate**: 1 Gbps
- **Protocol**: UDP
- **Use Case**: Maximum rate UDP testing

**Interpretation for UDP Tests**:
- **Achieved Bitrate**: Compare actual vs target bitrate
- **Packet Loss**: Higher rates typically show increased loss
- **Jitter**: Measure of packet timing variation
- **Buffer Utilization**: Network buffer capacity testing

### 18. UDP Bandwidth (1Gbps, Small Pkt) & UDP Bandwidth (1Gbps, Large Pkt)
**Purpose**: Packet size impact on UDP performance

**Parameters**:
```bash
# Small packets
iperf3 -c <server> -t 25 -u -b 1G -l 64 -J

# Large packets  
iperf3 -c <server> -t 25 -u -b 1G -l 1400 -J
```

**Details**:
- **Duration**: 25 seconds each
- **Target Bitrate**: 1 Gbps
- **Packet Sizes**: 64 bytes vs 1400 bytes
- **Protocol**: UDP

**Interpretation**:
- **Small Packets (64B)**: Higher packet rate, more CPU intensive
- **Large Packets (1400B)**: Lower packet rate, more efficient
- **MTU Considerations**: 1400 bytes avoids fragmentation on most networks

## Key Metrics Extracted

### TCP Metrics
- **Bandwidth (Mbps)**: Actual throughput achieved
- **Retransmits**: Number of retransmitted packets (reliability indicator)
- **TCP MSS**: Maximum Segment Size negotiated
- **Congestion Window**: TCP congestion control window size
- **CPU Utilization**: Host and remote CPU usage percentages

### UDP Metrics
- **Bandwidth (Mbps)**: Actual throughput achieved
- **Jitter (ms)**: Packet timing variation
- **Packet Loss (%)**: Percentage of lost packets
- **Lost Packets**: Absolute number of lost packets
- **Total Packets**: Total packets transmitted

### Common Metrics
- **Duration**: Actual test duration
- **Bytes Transferred**: Total data transferred
- **Bits per Second**: Raw bitrate measurement

## Test Scenario Selection Guidelines

### Basic Performance Assessment
Use scenarios 1, 2, 14, 15 for fundamental performance characterization.

### Congestion Analysis
Use scenarios 4, 5, 6 to understand network behavior under load.

### Protocol Optimization
Use window size tests (7-11) and packet size tests (12-13) for TCP optimization.

### UDP Capacity Testing
Use scenarios 14-18 for UDP performance limits and packet size optimization.

### Comprehensive Analysis
Run all scenarios for complete network characterization.

## Performance Interpretation

### Expected Results
- **TCP Bandwidth**: Should scale with parallel streams up to network capacity
- **UDP Bandwidth**: May show packet loss at high rates
- **Window Size**: Optimal size depends on bandwidth-delay product
- **Packet Size**: Larger packets generally more efficient

### Warning Signs
- **High Retransmits**: May indicate network congestion or errors
- **Excessive Packet Loss**: Network capacity exceeded or errors present
- **Poor Scaling**: Bandwidth doesn't increase with parallel streams
- **Timeouts**: Network instability or server issues

### Optimization Opportunities
- **Window Size Tuning**: Adjust based on test results
- **Congestion Control**: Consider alternative algorithms
- **Buffer Sizing**: Network equipment buffer optimization
- **QoS Configuration**: Traffic prioritization and shaping

This comprehensive test suite provides detailed insights into network performance characteristics across multiple dimensions, enabling thorough analysis and optimization of network infrastructure.