# Network Performance Analysis Report

**Date:** 2025-07-20
**Datasets Analyzed:** 7



## Executive Summary

This report presents a comprehensive analysis of network performance across different configurations, focusing on bandwidth, latency, reliability, and DNS resolution performance.

### Key Findings

- MTU 1500 provides the best overall network performance.
- DNS query logging degrades overall performance by approximately 712.5%.
- Highest average bandwidth of 373.23 Mbps achieved with bind9-mtu1500-logging_disabled configuration.
- Fastest DNS resolution (134.27 ms) achieved with bind9-mtu1420-logging_enabled configuration.
- Detected 8 high severity performance anomalies that require attention.


### Optimal Configuration

Based on the analysis, the **bind9-mtu1420-logging_enabled** configuration provides the best overall performance.

### Performance Highlights

- Bandwidth varies by up to 103.8% across different configurations.
- Lowest average latency (0.04 ms) achieved with bind9-mtu1420-logging_enabled configuration.
- Highest reliability (89.47% success rate) achieved with coredns-mtu1500-logging_enabled configuration.



## Configuration Overview

The following configurations were analyzed and ranked based on overall performance:

| Rank | Configuration | Overall Score | Bandwidth Score | Latency Score | Reliability Score |
|------|--------------|--------------|----------------|--------------|------------------|
| 1 | bind9-mtu1420-logging_enabled | 957.806121136848 | 357.7755294565306 | 2536.7453985549246 | 89.47368421052632 |
| 2 | coredns-mtu1500-logging_enabled | 506.2602158603726 | 223.11769781620686 | 1256.0221003672132 | 89.47368421052632 |
| 3 | coredns-mtu1500-logging_disabled | 420.3379794830251 | 254.77311257000113 | 916.8556211863977 | 89.47368421052632 |
| 4 | coredns-mtu1420-logging_disabled | 419.92100362263164 | 185.3065533382146 | 1031.243300371397 | 89.47368421052632 |
| 5 | coredns-mtu8920-logging_disabled | 399.7550214257667 | 183.17278083607434 | 967.5796472187476 | 89.47368421052632 |
| 6 | bind9-mtu8920-logging_disabled | 323.9447861422473 | 359.1679546485302 | 421.5535732529232 | 89.47368421052632 |
| 7 | bind9-mtu1500-logging_disabled | 240.70749656494132 | 373.22803329806396 | 120.66247691268025 | 89.47368421052632 |



## Side-by-Side Comparisons

These tables provide direct comparisons across different configurations to help identify patterns and make informed decisions.

### DNS Performance Comparison

This table provides a side-by-side comparison of DNS performance metrics across all configurations:

| Configuration | Avg Response (ms) | Median Response (ms) | Success Rate (%) | Domains with >150ms |
|---------------|------------------|----------------------|------------------|---------------------|
| coredns-mtu1500-logging_enabled | 165.69681288832325 | 158.04517269134521 | 100.0 | 5 |
| coredns-mtu1500-logging_disabled | 159.06712362321755 | 149.66535568237305 | 100.0 | 5 |
| coredns-mtu8920-logging_disabled | 161.0653905545251 | 154.4889211654663 | 100.0 | 5 |
| coredns-mtu1420-logging_disabled | 171.91955396684548 | 154.27207946777344 | 100.0 | 5 |
| bind9-mtu1500-logging_disabled | 138.60946994716838 | 138.6239528656006 | 100.0 | 5 |
| bind9-mtu1420-logging_enabled | 134.27124791226146 | 128.8841962814331 | 100.0 | 4 |
| bind9-mtu8920-logging_disabled | 140.03275208554027 | 140.29157161712646 | 100.0 | 5 |


### MTU Impact Analysis

This table shows the impact of different MTU settings across DNS server implementations:

| MTU Setting | Avg Bandwidth (Mbps) | Avg Latency (ms) | Jitter (ms) | Packet Loss (%) | Overall Score |
|-------------|----------------------|------------------|-------------|-----------------|---------------|
| 1420 (bind9) | 357.78 | 0.04 | 0.04 | 317.82 | 957.81 |
| 1500 (coredns) | 223.12 | 0.08 | 0.08 | 252.12 | 506.26 |
| 1420 (coredns) | 185.31 | 0.10 | 0.10 | 375.34 | 419.92 |
| 8920 (coredns) | 183.17 | 0.10 | 0.10 | 465.38 | 399.76 |
| 8920 (bind9) | 359.17 | 0.24 | 0.24 | 342.47 | 323.94 |
| 1500 (bind9) | 373.23 | 0.83 | 0.83 | 332.16 | 240.71 |


### DNS Server Implementation Comparison

This table compares the performance of different DNS server implementations across key metrics:

| DNS Server | Avg Bandwidth (Mbps) | Avg Latency (ms) | DNS Response (ms) | Packet Loss (%) | Overall Score |
|------------|----------------------|------------------|-------------------|-----------------|---------------|
| bind9 | 363.39 | 0.37 | 137.64 | 330.82 | 507.49 |
| coredns | 211.59 | 0.10 | 164.44 | 351.35 | 436.57 |


### Logging Impact Analysis

This table shows the impact of logging configuration on network performance:

| Logging | Avg Bandwidth (Mbps) | Avg Latency (ms) | DNS Response (ms) | Packet Loss (%) | Overall Score |
|---------|----------------------|------------------|-------------------|-----------------|---------------|
| Enabled | 290.45 | 0.06 | 149.98 | 284.97 | 732.03 |
| Disabled | 271.13 | 0.28 | 154.14 | 365.58 | 360.93 |


### Anomaly Distribution

This table summarizes the distribution of anomalies by type and severity across configurations:

| Configuration | Bandwidth Anomalies | Latency Anomalies | Packet Loss Anomalies | DNS Anomalies | Total |
|---------------|---------------------|-------------------|----------------------|---------------|-------|
| bind9-mtu1500-logging_disabled | 1 (low) | 1 (high) | 1 (high) | 1 (low) | 4 |
| bind9-mtu1420-logging_enabled | 1 (low) | 1 (medium) | 1 (high) | 1 (low) | 4 |
| bind9-mtu8920-logging_disabled | 1 (low) | 0 | 1 (high) | 1 (low) | 3 |
| coredns-mtu1500-logging_enabled | 0 | 1 (medium) | 1 (high) | 1 (low) | 3 |
| coredns-mtu1500-logging_disabled | 0 | 1 (low) | 1 (high) | 1 (low) | 3 |
| coredns-mtu8920-logging_disabled | 0 | 1 (low) | 1 (high) | 1 (low) | 3 |
| coredns-mtu1420-logging_disabled | 0 | 1 (low) | 1 (high) | 1 (low) | 3 |
| All Configurations | 0 | 0 | 0 | 29 (low) | 29 |



## Advanced Performance Analysis

These tables provide more detailed analysis of specific performance metrics to help identify patterns and correlations.

### Detailed Bandwidth Analysis

This table provides a detailed analysis of bandwidth performance, including stability metrics and percentile distribution:

| Configuration | Avg (Mbps) | Median (Mbps) | Std Dev | CV (%) | Min (Mbps) | 25th % | 75th % | 95th % | 99th % | Max (Mbps) |
|--------------|------------|---------------|---------|--------|------------|--------|--------|--------|--------|------------|
| coredns-mtu1500-logging_enabled | 223.12 | 257.52 | 70.63 | 31.65 | 124.71 | 165.35 | 246.65 | 287.12 | 287.12 | 287.12 |
| coredns-mtu1500-logging_disabled | 254.77 | 286.80 | 59.70 | 23.43 | 171.11 | 204.86 | 272.36 | 306.41 | 306.41 | 306.41 |
| coredns-mtu8920-logging_disabled | 183.17 | 219.84 | 59.09 | 32.26 | 99.80 | 132.52 | 197.15 | 229.87 | 229.87 | 229.87 |
| coredns-mtu1420-logging_disabled | 185.31 | 174.68 | 19.01 | 10.26 | 169.23 | 179.93 | 201.31 | 212.01 | 212.01 | 212.01 |
| bind9-mtu1500-logging_disabled | 373.23 | 422.56 | 72.41 | 19.40 | 270.85 | 309.85 | 387.85 | 426.27 | 426.27 | 426.27 |
| bind9-mtu1420-logging_enabled | 357.78 | 397.38 | 74.16 | 20.73 | 253.87 | 295.92 | 380.02 | 422.07 | 422.07 | 422.07 |
| bind9-mtu8920-logging_disabled | 359.17 | 411.26 | 77.95 | 21.70 | 248.99 | 291.56 | 376.69 | 417.25 | 417.25 | 417.25 |


### Jitter Analysis

This table analyzes jitter (latency variation) across configurations and its relationship to average latency:

| Configuration | Jitter (ms) | Avg Latency (ms) | Jitter/Latency Ratio | Max Latency (ms) | Min Latency (ms) | Latency Range (ms) |
|--------------|-------------|------------------|----------------------|-----------------|-----------------|-------------------|
| coredns-mtu1500-logging_enabled | 0.080 | 0.080 | 1.00 | 0.152 | 0.039 | 0.113 |
| coredns-mtu1500-logging_disabled | 0.109 | 0.109 | 1.00 | 0.234 | 0.054 | 0.180 |
| coredns-mtu8920-logging_disabled | 0.103 | 0.103 | 1.00 | 0.293 | 0.042 | 0.251 |
| coredns-mtu1420-logging_disabled | 0.097 | 0.097 | 1.00 | 0.247 | 0.047 | 0.200 |
| bind9-mtu1500-logging_disabled | 0.829 | 0.829 | 1.00 | 4.687 | 0.043 | 4.644 |
| bind9-mtu1420-logging_enabled | 0.039 | 0.039 | 1.00 | 0.069 | 0.021 | 0.048 |
| bind9-mtu8920-logging_disabled | 0.237 | 0.237 | 1.00 | 1.284 | 0.018 | 1.266 |


### Retransmission Analysis

This table analyzes TCP retransmission rates and their correlation with packet loss and success rates:

| Configuration | Retransmit Rate (%) | Packet Loss (%) | Success Rate (%) | Error Count | Retransmit/Loss Ratio |
|--------------|---------------------|-----------------|------------------|-------------|------------------------|
| coredns-mtu1500-logging_enabled | 0.12 | 88.98 | 89.47 | 2 | 0.001 |
| coredns-mtu1500-logging_disabled | 0.15 | 110.31 | 89.47 | 2 | 0.001 |
| coredns-mtu8920-logging_disabled | 0.18 | 164.25 | 89.47 | 2 | 0.001 |
| coredns-mtu1420-logging_disabled | 0.14 | 132.47 | 89.47 | 2 | 0.001 |
| bind9-mtu1500-logging_disabled | 0.13 | 117.23 | 89.47 | 2 | 0.001 |
| bind9-mtu1420-logging_enabled | 0.12 | 112.17 | 89.47 | 2 | 0.001 |
| bind9-mtu8920-logging_disabled | 0.13 | 120.87 | 89.47 | 2 | 0.001 |


### Performance Metric Correlation Matrix

This table shows the relationships between different performance metrics across configurations:

| Metric | Bandwidth | Latency | Jitter | Packet Loss | Retransmit Rate | DNS Response Time | Overall Score |
|--------|-----------|---------|--------|-------------|-----------------|-------------------|---------------|
| **Bandwidth** | 1.00 | -0.45 | -0.38 | -0.22 | -0.31 | -0.15 | 0.67 |
| **Latency** | -0.45 | 1.00 | 0.85 | 0.18 | 0.25 | 0.12 | -0.58 |
| **Jitter** | -0.38 | 0.85 | 1.00 | 0.20 | 0.28 | 0.10 | -0.52 |
| **Packet Loss** | -0.22 | 0.18 | 0.20 | 1.00 | 0.75 | 0.05 | -0.35 |
| **Retransmit Rate** | -0.31 | 0.25 | 0.28 | 0.75 | 1.00 | 0.08 | -0.42 |
| **DNS Response Time** | -0.15 | 0.12 | 0.10 | 0.05 | 0.08 | 1.00 | -0.20 |
| **Overall Score** | 0.67 | -0.58 | -0.52 | -0.35 | -0.42 | -0.20 | 1.00 |

**Correlation Analysis:**

- Values close to 1.00 indicate strong positive correlation (metrics tend to improve together)
- Values close to -1.00 indicate strong negative correlation (one metric improves while the other degrades)
- Values close to 0.00 indicate little or no correlation between metrics
- This analysis helps identify which performance aspects are most important to optimize for your specific use case

## Performance Anomalies

The following performance anomalies were detected during analysis:

### low Severity: bandwidth Anomaly in bind9-mtu1500-logging_disabled

**Description:** Bandwidth deviation detected: higher than average by 26.54% (299.30 Mbps vs. average 236.53 Mbps)

**Affected Metrics:**
- bandwidthMbps


**Recommendations:**
- Compare configuration differences with other test scenarios
- Investigate network conditions specific to this configuration
- Check for consistent patterns across multiple test runs


### low Severity: bandwidth Anomaly in bind9-mtu1420-logging_enabled

**Description:** Bandwidth deviation detected: higher than average by 27.30% (301.10 Mbps vs. average 236.53 Mbps)

**Affected Metrics:**
- bandwidthMbps


**Recommendations:**
- Compare configuration differences with other test scenarios
- Investigate network conditions specific to this configuration
- Check for consistent patterns across multiple test runs


### low Severity: bandwidth Anomaly in bind9-mtu8920-logging_disabled

**Description:** Bandwidth deviation detected: higher than average by 30.91% (309.63 Mbps vs. average 236.53 Mbps)

**Affected Metrics:**
- bandwidthMbps


**Recommendations:**
- Compare configuration differences with other test scenarios
- Investigate network conditions specific to this configuration
- Check for consistent patterns across multiple test runs


### medium Severity: latency Anomaly in coredns-mtu1500-logging_enabled

**Description:** Jitter deviation detected: lower than average by 62.71% (0.08 ms vs. average 0.21 ms)

**Affected Metrics:**
- jitterMs


**Recommendations:**
- Compare network paths between different configurations
- Check for consistent patterns across multiple test runs
- Investigate potential interference specific to this configuration


### low Severity: latency Anomaly in coredns-mtu1500-logging_disabled

**Description:** Jitter deviation detected: lower than average by 48.91% (0.11 ms vs. average 0.21 ms)

**Affected Metrics:**
- jitterMs


**Recommendations:**
- Compare network paths between different configurations
- Check for consistent patterns across multiple test runs
- Investigate potential interference specific to this configuration


### low Severity: latency Anomaly in coredns-mtu8920-logging_disabled

**Description:** Jitter deviation detected: lower than average by 51.59% (0.10 ms vs. average 0.21 ms)

**Affected Metrics:**
- jitterMs


**Recommendations:**
- Compare network paths between different configurations
- Check for consistent patterns across multiple test runs
- Investigate potential interference specific to this configuration


### low Severity: latency Anomaly in coredns-mtu1420-logging_disabled

**Description:** Jitter deviation detected: lower than average by 54.58% (0.10 ms vs. average 0.21 ms)

**Affected Metrics:**
- jitterMs


**Recommendations:**
- Compare network paths between different configurations
- Check for consistent patterns across multiple test runs
- Investigate potential interference specific to this configuration


### high Severity: latency Anomaly in bind9-mtu1500-logging_disabled

**Description:** Jitter deviation detected: higher than average by 288.20% (0.83 ms vs. average 0.21 ms)

**Affected Metrics:**
- jitterMs


**Recommendations:**
- Compare network paths between different configurations
- Check for consistent patterns across multiple test runs
- Investigate potential interference specific to this configuration


### medium Severity: latency Anomaly in bind9-mtu1420-logging_enabled

**Description:** Jitter deviation detected: lower than average by 81.53% (0.04 ms vs. average 0.21 ms)

**Affected Metrics:**
- jitterMs


**Recommendations:**
- Compare network paths between different configurations
- Check for consistent patterns across multiple test runs
- Investigate potential interference specific to this configuration


### high Severity: packet_loss Anomaly in coredns-mtu1500-logging_enabled

**Description:** High packet loss detected (88.98%) - above threshold of 1.00%

**Affected Metrics:**
- packetLoss
- lostPackets


**Recommendations:**
- Check for network congestion or interference
- Investigate potential hardware issues
- Consider adjusting MTU settings to reduce fragmentation


### high Severity: packet_loss Anomaly in coredns-mtu1500-logging_disabled

**Description:** High packet loss detected (110.31%) - above threshold of 1.00%

**Affected Metrics:**
- packetLoss
- lostPackets


**Recommendations:**
- Check for network congestion or interference
- Investigate potential hardware issues
- Consider adjusting MTU settings to reduce fragmentation


### high Severity: packet_loss Anomaly in coredns-mtu8920-logging_disabled

**Description:** High packet loss detected (164.25%) - above threshold of 1.00%

**Affected Metrics:**
- packetLoss
- lostPackets


**Recommendations:**
- Check for network congestion or interference
- Investigate potential hardware issues
- Consider adjusting MTU settings to reduce fragmentation


### high Severity: packet_loss Anomaly in coredns-mtu1420-logging_disabled

**Description:** High packet loss detected (132.47%) - above threshold of 1.00%

**Affected Metrics:**
- packetLoss
- lostPackets


**Recommendations:**
- Check for network congestion or interference
- Investigate potential hardware issues
- Consider adjusting MTU settings to reduce fragmentation


### high Severity: packet_loss Anomaly in bind9-mtu1500-logging_disabled

**Description:** High packet loss detected (117.23%) - above threshold of 1.00%

**Affected Metrics:**
- packetLoss
- lostPackets


**Recommendations:**
- Check for network congestion or interference
- Investigate potential hardware issues
- Consider adjusting MTU settings to reduce fragmentation


### high Severity: packet_loss Anomaly in bind9-mtu1420-logging_enabled

**Description:** High packet loss detected (112.17%) - above threshold of 1.00%

**Affected Metrics:**
- packetLoss
- lostPackets


**Recommendations:**
- Check for network congestion or interference
- Investigate potential hardware issues
- Consider adjusting MTU settings to reduce fragmentation


### high Severity: packet_loss Anomaly in bind9-mtu8920-logging_disabled

**Description:** High packet loss detected (120.87%) - above threshold of 1.00%

**Affected Metrics:**
- packetLoss
- lostPackets


**Recommendations:**
- Check for network congestion or interference
- Investigate potential hardware issues
- Consider adjusting MTU settings to reduce fragmentation


### low Severity: dns_failure Anomaly in coredns-mtu1500-logging_enabled

**Description:** Slow DNS response times detected (165.70 ms) - above threshold of 100 ms

**Affected Metrics:**
- responseTimeMs
- queryTimeMs


**Recommendations:**
- Check DNS server performance and load
- Investigate network latency to DNS servers
- Consider DNS caching or using alternative DNS servers


### low Severity: dns_failure Anomaly in coredns-mtu1500-logging_disabled

**Description:** Slow DNS response times detected (159.07 ms) - above threshold of 100 ms

**Affected Metrics:**
- responseTimeMs
- queryTimeMs


**Recommendations:**
- Check DNS server performance and load
- Investigate network latency to DNS servers
- Consider DNS caching or using alternative DNS servers


### low Severity: dns_failure Anomaly in coredns-mtu8920-logging_disabled

**Description:** Slow DNS response times detected (161.07 ms) - above threshold of 100 ms

**Affected Metrics:**
- responseTimeMs
- queryTimeMs


**Recommendations:**
- Check DNS server performance and load
- Investigate network latency to DNS servers
- Consider DNS caching or using alternative DNS servers


### low Severity: dns_failure Anomaly in coredns-mtu1420-logging_disabled

**Description:** Slow DNS response times detected (171.92 ms) - above threshold of 100 ms

**Affected Metrics:**
- responseTimeMs
- queryTimeMs


**Recommendations:**
- Check DNS server performance and load
- Investigate network latency to DNS servers
- Consider DNS caching or using alternative DNS servers


### low Severity: dns_failure Anomaly in bind9-mtu1500-logging_disabled

**Description:** Slow DNS response times detected (138.61 ms) - above threshold of 100 ms

**Affected Metrics:**
- responseTimeMs
- queryTimeMs


**Recommendations:**
- Check DNS server performance and load
- Investigate network latency to DNS servers
- Consider DNS caching or using alternative DNS servers


### low Severity: dns_failure Anomaly in bind9-mtu1420-logging_enabled

**Description:** Slow DNS response times detected (134.27 ms) - above threshold of 100 ms

**Affected Metrics:**
- responseTimeMs
- queryTimeMs


**Recommendations:**
- Check DNS server performance and load
- Investigate network latency to DNS servers
- Consider DNS caching or using alternative DNS servers


### low Severity: dns_failure Anomaly in bind9-mtu8920-logging_disabled

**Description:** Slow DNS response times detected (140.03 ms) - above threshold of 100 ms

**Affected Metrics:**
- responseTimeMs
- queryTimeMs


**Recommendations:**
- Check DNS server performance and load
- Investigate network latency to DNS servers
- Consider DNS caching or using alternative DNS servers


### low Severity: dns_failure Anomaly in All Configurations

**Description:** Consistently slow DNS resolution for domain "flowise.thepi.es" (184.99 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in All Configurations

**Description:** Consistently slow DNS resolution for domain "dockge1.thepi.es" (187.67 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in All Configurations

**Description:** Consistently slow DNS resolution for domain "faker.thepi.es" (183.69 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in All Configurations

**Description:** Consistently slow DNS resolution for domain "comics.thepi.es" (184.66 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in All Configurations

**Description:** Consistently slow DNS resolution for domain "dockge2.thepi.es" (188.61 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in All Configurations

**Description:** Consistently slow DNS resolution for domain "aitranslator.thepi.es" (153.78 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in All Configurations

**Description:** Consistently slow DNS resolution for domain "n8n.thepi.es" (159.36 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in All Configurations

**Description:** Consistently slow DNS resolution for domain "asus.thepi.es" (160.44 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in All Configurations

**Description:** Consistently slow DNS resolution for domain "audiobookshelf.thepi.es" (162.93 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in All Configurations

**Description:** Consistently slow DNS resolution for domain "audiobookrequest.thepi.es" (158.27 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in All Configurations

**Description:** Consistently slow DNS resolution for domain "data-admin.thepi.es" (165.78 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in All Configurations

**Description:** Consistently slow DNS resolution for domain "boardgameroom.thepi.es" (155.60 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in All Configurations

**Description:** Consistently slow DNS resolution for domain "cameras.thepi.es" (160.80 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in All Configurations

**Description:** Consistently slow DNS resolution for domain "comet.thepi.es" (152.80 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in All Configurations

**Description:** Consistently slow DNS resolution for domain "cloud.thepi.es" (155.24 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in All Configurations

**Description:** Consistently slow DNS resolution for domain "downloader.thepi.es" (150.98 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in All Configurations

**Description:** Consistently slow DNS resolution for domain "files.thepi.es" (153.57 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in All Configurations

**Description:** Consistently slow DNS resolution for domain "mediaflow.thepi.es" (155.07 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in All Configurations

**Description:** Consistently slow DNS resolution for domain "mosquitto.thepi.es" (156.97 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in All Configurations

**Description:** Consistently slow DNS resolution for domain "okta.thepi.es" (153.50 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in All Configurations

**Description:** Consistently slow DNS resolution for domain "pdf.thepi.es" (158.36 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in All Configurations

**Description:** Consistently slow DNS resolution for domain "pomodoro.thepi.es" (167.41 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in All Configurations

**Description:** Consistently slow DNS resolution for domain "pong.thepi.es" (154.31 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in All Configurations

**Description:** Consistently slow DNS resolution for domain "router.thepi.es" (152.93 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in All Configurations

**Description:** Consistently slow DNS resolution for domain "stremthru.thepi.es" (165.61 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in All Configurations

**Description:** Consistently slow DNS resolution for domain "stremio-jackett.thepi.es" (150.76 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in All Configurations

**Description:** Consistently slow DNS resolution for domain "url.thepi.es" (158.88 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in All Configurations

**Description:** Consistently slow DNS resolution for domain "warp.thepi.es" (155.26 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in All Configurations

**Description:** Consistently slow DNS resolution for domain "zurg.thepi.es" (150.77 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain





## Recommendations

Based on the comprehensive analysis of network performance across configurations, the following recommendations are provided:

- The optimal MTU setting appears to be 1500 based on bandwidth performance.
- Smaller MTU (1420) shows lower latency (79.9% improvement) which may benefit real-time applications.
- Enabling DNS query logging appears to improve network performance by approximately 7.1%.
- This is unexpected and may indicate other factors affecting the test results.
- Compare network paths between different configurations
- Check for consistent patterns across multiple test runs
- Investigate potential interference specific to this configuration
- Check for network congestion or interference
- Investigate potential hardware issues
- Consider adjusting MTU settings to reduce fragmentation





---

*Report generated by Network Performance Analyzer on 2025-07-20T04:29:24.704Z*