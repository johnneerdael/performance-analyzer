import { AnalysisEngine, Dataset, IperfAnalysis, DnsAnalysis, ConfigurationComparison, PerformanceAnomaly } from '../models';
export declare class DefaultAnalysisEngine implements AnalysisEngine {
    analyzeIperfPerformance(datasets: Dataset[]): Promise<IperfAnalysis>;
    analyzeDnsPerformance(datasets: Dataset[]): Promise<DnsAnalysis>;
    compareConfigurations(datasets: Dataset[]): Promise<ConfigurationComparison>;
    detectAnomalies(datasets: Dataset[]): Promise<PerformanceAnomaly[]>;
}
export { AnalysisEngine };
//# sourceMappingURL=AnalysisEngine.d.ts.map