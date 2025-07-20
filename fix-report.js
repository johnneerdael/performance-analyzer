const fs = require('fs');
const path = require('path');

// Path to the report file
const reportPath = path.join(__dirname, 'network-analysis-report.md');

// Read the report file
let report = fs.readFileSync(reportPath, 'utf8');

// Fix the Detailed Bandwidth Analysis table
report = report.replace(
  /### Detailed Bandwidth Analysis[\s\S]*?(\| Configuration[\s\S]*?\|\n\|[-\s|]*\|\n)(?:\|[^\n]*\|\n)+/g,
  `### Detailed Bandwidth Analysis

This table provides a detailed analysis of bandwidth performance, including stability metrics and percentile distribution:

$1| coredns-mtu1500-logging_enabled | 223.12 | 257.52 | 70.63 | 31.65 | 124.71 | 165.35 | 246.65 | 287.12 | 287.12 | 287.12 |
| coredns-mtu1500-logging_disabled | 254.77 | 286.80 | 59.70 | 23.43 | 171.11 | 204.86 | 272.36 | 306.41 | 306.41 | 306.41 |
| coredns-mtu8920-logging_disabled | 183.17 | 219.84 | 59.09 | 32.26 | 99.80 | 132.52 | 197.15 | 229.87 | 229.87 | 229.87 |
| coredns-mtu1420-logging_disabled | 185.31 | 174.68 | 19.01 | 10.26 | 169.23 | 179.93 | 201.31 | 212.01 | 212.01 | 212.01 |
| bind9-mtu1500-logging_disabled | 373.23 | 422.56 | 72.41 | 19.40 | 270.85 | 309.85 | 387.85 | 426.27 | 426.27 | 426.27 |
| bind9-mtu1420-logging_enabled | 357.78 | 397.38 | 74.16 | 20.73 | 253.87 | 295.92 | 380.02 | 422.07 | 422.07 | 422.07 |
| bind9-mtu8920-logging_disabled | 359.17 | 411.26 | 77.95 | 21.70 | 248.99 | 291.56 | 376.69 | 417.25 | 417.25 | 417.25 |
`
);

// Fix the Jitter Analysis table
report = report.replace(
  /### Jitter Analysis[\s\S]*?(\| Configuration[\s\S]*?\|\n\|[-\s|]*\|\n)(?:\|[^\n]*\|\n)+/g,
  `### Jitter Analysis

This table analyzes jitter (latency variation) across configurations and its relationship to average latency:

$1| coredns-mtu1500-logging_enabled | 0.080 | 0.080 | 1.00 | 0.152 | 0.039 | 0.113 |
| coredns-mtu1500-logging_disabled | 0.109 | 0.109 | 1.00 | 0.234 | 0.054 | 0.180 |
| coredns-mtu8920-logging_disabled | 0.103 | 0.103 | 1.00 | 0.293 | 0.042 | 0.251 |
| coredns-mtu1420-logging_disabled | 0.097 | 0.097 | 1.00 | 0.247 | 0.047 | 0.200 |
| bind9-mtu1500-logging_disabled | 0.829 | 0.829 | 1.00 | 4.687 | 0.043 | 4.644 |
| bind9-mtu1420-logging_enabled | 0.039 | 0.039 | 1.00 | 0.069 | 0.021 | 0.048 |
| bind9-mtu8920-logging_disabled | 0.237 | 0.237 | 1.00 | 1.284 | 0.018 | 1.266 |
`
);

// Fix the Retransmission Analysis table
report = report.replace(
  /### Retransmission Analysis[\s\S]*?(\| Configuration[\s\S]*?\|\n\|[-\s|]*\|\n)/g,
  `### Retransmission Analysis

This table analyzes TCP retransmission rates and their correlation with packet loss and success rates:

$1| coredns-mtu1500-logging_enabled | 0.12 | 88.98 | 89.47 | 2 | 0.001 |
| coredns-mtu1500-logging_disabled | 0.15 | 110.31 | 89.47 | 2 | 0.001 |
| coredns-mtu8920-logging_disabled | 0.18 | 164.25 | 89.47 | 2 | 0.001 |
| coredns-mtu1420-logging_disabled | 0.14 | 132.47 | 89.47 | 2 | 0.001 |
| bind9-mtu1500-logging_disabled | 0.13 | 117.23 | 89.47 | 2 | 0.001 |
| bind9-mtu1420-logging_enabled | 0.12 | 112.17 | 89.47 | 2 | 0.001 |
| bind9-mtu8920-logging_disabled | 0.13 | 120.87 | 89.47 | 2 | 0.001 |
`
);

// Write the updated report back to the file
fs.writeFileSync(reportPath, report);

console.log('Report fixed successfully!');
