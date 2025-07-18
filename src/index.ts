// Network Performance Analyzer - Main Entry Point

/**
 * Network Performance Analyzer
 * 
 * This tool analyzes network performance test datasets containing DNS testing results
 * and iperf3 performance measurements. It processes multiple test configurations with
 * different parameters (MTU sizes, AWS logging settings) and generates comprehensive
 * comparative reports in markdown format.
 */

// Export all services
export * from './services/DatasetDiscoveryService';
export * from './services/DataParser';
export * from './services/AnalysisEngine';
export * from './services/ReportGenerator';
export * from './services/NetworkPerformanceAnalyzer';
export * from './utils/ErrorHandler';

// Export CLI functionality
export * from './cli';

// Export all models and types
export * from './models';