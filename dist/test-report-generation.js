"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const NetworkPerformanceAnalyzer_1 = require("./src/services/NetworkPerformanceAnalyzer");
const path_1 = __importDefault(require("path"));
async function testReportGeneration() {
    try {
        console.log('Starting test report generation...');
        // Create the analyzer with the current directory as the dataset path
        const analyzer = (0, NetworkPerformanceAnalyzer_1.createNetworkPerformanceAnalyzer)({
            reportOutputPath: path_1.default.join(process.cwd(), 'network-analysis-report.md'),
            logProgress: true,
            continueOnError: true
        });
        // Run the analysis
        console.log('Running analysis...');
        const report = await analyzer.analyze(path_1.default.join(process.cwd(), 'datasets'));
        console.log('Analysis completed successfully');
        console.log('Report saved to: network-analysis-report.md');
    }
    catch (error) {
        console.error('Error generating report:', error);
    }
}
// Run the test
testReportGeneration();
//# sourceMappingURL=test-report-generation.js.map