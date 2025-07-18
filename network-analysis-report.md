# Network Performance Analysis Report

**Date:** 2025-07-18
**Datasets Analyzed:** 7



## Executive Summary

This report presents a comprehensive analysis of network performance across different configurations, focusing on bandwidth, latency, reliability, and DNS resolution performance.

### Key Findings

- MTU 1500 provides the best overall network performance.
- DNS query logging degrades overall performance by approximately 712.5%.
- Highest average bandwidth of 373.23 Mbps achieved with bind9-mtu1500-logging_disabled configuration.
- Fastest DNS resolution (134.27 ms) achieved with bind9-mtu1420-logging_enabled configuration.
- Detected 1 high severity performance anomalies that require attention.


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
| dataset-mtu1500-logging_disabled | 0 | 0 | 1 (high) | 1 (low) | 2 |
| dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled | 0 | 0 | 0 | 29 (low) | 29 |



## Performance Anomalies

The following performance anomalies were detected during analysis:

### high Severity: packet_loss Anomaly in dataset-mtu1500-logging_disabled

**Description:** High packet loss detected (120.90%) - above threshold of 1.00%

**Affected Metrics:**
- packetLoss
- lostPackets


**Recommendations:**
- Check for network congestion or interference
- Investigate potential hardware issues
- Consider adjusting MTU settings to reduce fragmentation


### low Severity: dns_failure Anomaly in dataset-mtu1500-logging_disabled

**Description:** Slow DNS response times detected (152.95 ms) - above threshold of 100 ms

**Affected Metrics:**
- responseTimeMs
- queryTimeMs


**Recommendations:**
- Check DNS server performance and load
- Investigate network latency to DNS servers
- Consider DNS caching or using alternative DNS servers


### low Severity: dns_failure Anomaly in dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled

**Description:** Consistently slow DNS resolution for domain "flowise.thepi.es" (184.99 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled

**Description:** Consistently slow DNS resolution for domain "dockge1.thepi.es" (187.67 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled

**Description:** Consistently slow DNS resolution for domain "faker.thepi.es" (183.69 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled

**Description:** Consistently slow DNS resolution for domain "comics.thepi.es" (184.66 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled

**Description:** Consistently slow DNS resolution for domain "dockge2.thepi.es" (188.61 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled

**Description:** Consistently slow DNS resolution for domain "aitranslator.thepi.es" (153.78 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled

**Description:** Consistently slow DNS resolution for domain "n8n.thepi.es" (159.36 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled

**Description:** Consistently slow DNS resolution for domain "asus.thepi.es" (160.44 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled

**Description:** Consistently slow DNS resolution for domain "audiobookshelf.thepi.es" (162.93 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled

**Description:** Consistently slow DNS resolution for domain "audiobookrequest.thepi.es" (158.27 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled

**Description:** Consistently slow DNS resolution for domain "data-admin.thepi.es" (165.78 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled

**Description:** Consistently slow DNS resolution for domain "boardgameroom.thepi.es" (155.60 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled

**Description:** Consistently slow DNS resolution for domain "cameras.thepi.es" (160.80 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled

**Description:** Consistently slow DNS resolution for domain "comet.thepi.es" (152.80 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled

**Description:** Consistently slow DNS resolution for domain "cloud.thepi.es" (155.24 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled

**Description:** Consistently slow DNS resolution for domain "downloader.thepi.es" (150.98 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled

**Description:** Consistently slow DNS resolution for domain "files.thepi.es" (153.57 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled

**Description:** Consistently slow DNS resolution for domain "mediaflow.thepi.es" (155.07 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled

**Description:** Consistently slow DNS resolution for domain "mosquitto.thepi.es" (156.97 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled

**Description:** Consistently slow DNS resolution for domain "okta.thepi.es" (153.50 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled

**Description:** Consistently slow DNS resolution for domain "pdf.thepi.es" (158.36 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled

**Description:** Consistently slow DNS resolution for domain "pomodoro.thepi.es" (167.41 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled

**Description:** Consistently slow DNS resolution for domain "pong.thepi.es" (154.31 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled

**Description:** Consistently slow DNS resolution for domain "router.thepi.es" (152.93 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled

**Description:** Consistently slow DNS resolution for domain "stremthru.thepi.es" (165.61 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled

**Description:** Consistently slow DNS resolution for domain "stremio-jackett.thepi.es" (150.76 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled

**Description:** Consistently slow DNS resolution for domain "url.thepi.es" (158.88 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled

**Description:** Consistently slow DNS resolution for domain "warp.thepi.es" (155.26 ms)

**Affected Metrics:**
- responseTimeMs
- domain


**Recommendations:**
- Investigate DNS resolution path for this specific domain
- Check if the domain uses DNSSEC which may increase resolution time
- Verify if the domain has multiple DNS lookups in its resolution chain


### low Severity: dns_failure Anomaly in dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled, dataset-mtu1500-logging_disabled

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
- Check for network congestion or interference
- Investigate potential hardware issues
- Consider adjusting MTU settings to reduce fragmentation





---

*Report generated by Network Performance Analyzer on 2025-07-18T17:44:39.528Z*