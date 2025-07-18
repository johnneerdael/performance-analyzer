import { ReportGenerator, AnalysisResults } from '../models';
export declare class DefaultReportGenerator implements ReportGenerator {
    generateReport(analysis: AnalysisResults): Promise<string>;
    createExecutiveSummary(analysis: AnalysisResults): string;
    generateDetailedTables(analysis: AnalysisResults): string;
    createVisualizationDescriptions(analysis: AnalysisResults): string;
}
export { ReportGenerator };
//# sourceMappingURL=ReportGenerator.d.ts.map