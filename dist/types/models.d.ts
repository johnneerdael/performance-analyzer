export interface Dataset {
    name: string;
    parametersFile: string;
    resultsFile: string;
    configuration: TestConfiguration;
}
export interface TestConfiguration {
    mtu: number;
    awsLogging: boolean;
    backendServer: string;
    testDate: string;
}
export interface TestParameters {
    backendServer: string;
    mtu: number;
    queryLogging: 'enabled' | 'disabled';
    timestamp?: string;
}
export interface TestResults {
    iperfTests: IperfTestResult[];
    dnsResults: DnsTestResult[];
}
export interface IperfTestResult {
    server: string;
    scenario: string;
    success: boolean;
    startTime?: number;
    endTime?: number;
    duration?: number;
    numStreams?: number;
    cpuUtilizationHost?: number;
    cpuUtilizationRemote?: number;
    tcpMssDefault?: number;
    retransmits?: number;
    sndCwnd?: number;
    jitterMs?: number;
    packets?: number;
    lostPackets?: number;
    packetLoss?: number;
    blksize?: number;
    bytes?: number;
    bitsPerSecond?: number;
    bandwidthMbps?: number;
    error?: string;
    allRawData?: any;
}
export interface DnsTestResult {
    domain: string;
    dnsServer: string;
    success: boolean;
    responseTimeMs?: number;
    queryTimeMs?: number;
    status?: string;
    resolvedIps?: string[];
    error?: string;
}
export interface BandwidthMetrics {
    configuration: string;
    avgBandwidthMbps: number;
    medianBandwidthMbps: number;
    maxBandwidthMbps: number;
    minBandwidthMbps: number;
    standardDeviation: number;
    percentile95: number;
    percentile99: number;
}
export interface LatencyMetrics {
    configuration: string;
    avgLatencyMs: number;
    medianLatencyMs: number;
    maxLatencyMs: number;
    minLatencyMs: number;
    jitterMs: number;
}
export interface ReliabilityMetrics {
    configuration: string;
    successRate: number;
    retransmitRate: number;
    packetLossRate: number;
    errorCount: number;
}
export interface CpuMetrics {
    configuration: string;
    avgHostCpuUsage: number;
    avgRemoteCpuUsage: number;
    maxHostCpuUsage: number;
    maxRemoteCpuUsage: number;
}
export interface DnsPerformanceMetrics {
    configuration: string;
    avgResponseTimeMs: number;
    medianResponseTimeMs: number;
    successRate: number;
    slowestDomains: DomainPerformance[];
    fastestDomains: DomainPerformance[];
}
export interface DomainPerformance {
    domain: string;
    avgResponseTimeMs: number;
    successRate: number;
    queryCount: number;
}
export interface IperfAnalysis {
    bandwidthComparison: BandwidthMetrics[];
    latencyAnalysis: LatencyMetrics[];
    reliabilityMetrics: ReliabilityMetrics[];
    cpuUtilizationAnalysis: CpuMetrics[];
}
export interface DnsAnalysis {
    performanceMetrics: DnsPerformanceMetrics[];
    domainRankings: DomainPerformance[];
    serverComparison: DnsServerComparison[];
}
export interface DnsServerComparison {
    server: string;
    avgResponseTimeMs: number;
    successRate: number;
    configurations: string[];
}
export interface ConfigurationComparison {
    mtuImpact: MtuAnalysis;
    loggingImpact: LoggingAnalysis;
    overallRanking: ConfigurationRanking[];
}
export interface MtuAnalysis {
    optimalMtu: number;
    performanceByMtu: {
        [mtu: number]: PerformanceSummary;
    };
    recommendations: string[];
}
export interface LoggingAnalysis {
    performanceImpact: number;
    bandwidthDifference: number;
    latencyDifference: number;
    recommendations: string[];
}
export interface ConfigurationRanking {
    configuration: string;
    overallScore: number;
    bandwidthScore: number;
    latencyScore: number;
    reliabilityScore: number;
    rank: number;
}
export interface PerformanceSummary {
    avgBandwidth: number;
    avgLatency: number;
    successRate: number;
    cpuUsage: number;
}
export interface PerformanceAnomaly {
    type: 'bandwidth' | 'latency' | 'packet_loss' | 'dns_failure';
    configuration: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    affectedMetrics: string[];
    recommendations: string[];
}
export interface AnalysisResults {
    iperfAnalysis: IperfAnalysis;
    dnsAnalysis: DnsAnalysis;
    configurationComparison: ConfigurationComparison;
    anomalies: PerformanceAnomaly[];
    summary: ExecutiveSummary;
}
export interface ExecutiveSummary {
    totalDatasets: number;
    keyFindings: string[];
    recommendations: string[];
    optimalConfiguration: string;
    performanceHighlights: string[];
}
//# sourceMappingURL=models.d.ts.map