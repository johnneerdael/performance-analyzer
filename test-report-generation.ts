import { createNetworkPerformanceAnalyzer } from './src/services/NetworkPerformanceAnalyzer';
import path from 'path';

async function testReportGeneration() {
  try {
    console.log('Starting test report generation...');
    
    // Create the analyzer with the current directory as the dataset path
    const analyzer = createNetworkPerformanceAnalyzer({
      reportOutputPath: path.join(process.cwd(), 'network-analysis-report.md'),
      logProgress: true,
      continueOnError: true
    });
    
    // Run the analysis
    console.log('Running analysis...');
    const report = await analyzer.analyze(path.join(process.cwd(), 'datasets'));
    
    console.log('Analysis completed successfully');
    console.log('Report saved to: network-analysis-report.md');
  } catch (error) {
    console.error('Error generating report:', error);
  }
}

// Run the test
testReportGeneration();
