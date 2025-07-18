// Service interfaces for Network Performance Analyzer
import {
  Dataset,
  TestParameters,
  TestResults,
  IperfAnalysis,
  DnsAnalysis,
  ConfigurationComparison,
  PerformanceAnomaly,
  AnalysisResults
} from './models';

export interface DatasetDiscoveryService {
  discoverDatasets(rootPath: string): Promise<Dataset[]>;
  validateDatasetCompleteness(dataset: Dataset): boolean;
}

export interface DataParser {
  parseParameters(filePath: string): Promise<TestParameters>;
  parseResults(filePath: string): Promise<TestResults>;
}

export interface AnalysisEngine {
  analyzeIperfPerformance(datasets: Dataset[]): Promise<IperfAnalysis>;
  analyzeDnsPerformance(datasets: Dataset[]): Promise<DnsAnalysis>;
  compareConfigurations(datasets: Dataset[]): Promise<ConfigurationComparison>;
  detectAnomalies(datasets: Dataset[]): Promise<PerformanceAnomaly[]>;
}

export interface ReportGenerator {
  generateReport(analysis: AnalysisResults): Promise<string>;
  createExecutiveSummary(analysis: AnalysisResults): string;
  generateDetailedTables(analysis: AnalysisResults): string;
  createVisualizationDescriptions(analysis: AnalysisResults): string;
}

export interface ErrorHandler {
  handleFileSystemError(error: FileSystemError): boolean;
  handleParsingError(error: ParsingError): boolean;
  handleAnalysisError(error: AnalysisError): boolean;
  handleValidationError(error: Error, entityType: string, entityId: string): boolean;
  logError(error: Error, context: string): void;
}

// Error types
export interface FileSystemError extends Error {
  code: string;
  path: string;
}

export interface ParsingError extends Error {
  filePath: string;
  lineNumber?: number;
  columnNumber?: number;
}

export interface AnalysisError extends Error {
  analysisType: string;
  datasetName?: string;
}