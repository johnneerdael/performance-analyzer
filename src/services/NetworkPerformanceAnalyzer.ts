// Network Performance Analyzer - Main Orchestrator
import {
  Dataset,
  AnalysisResults,
  DatasetDiscoveryService,
  DataParser,
  AnalysisEngine,
  ReportGenerator,
  ErrorHandler,
  ExecutiveSummary,
  TestResults,
  PerformanceAnomaly,
} from "../models";
import fs from "fs-extra";
import path from "path";
import { DefaultDatasetDiscoveryService } from "./DatasetDiscoveryService";
import { DefaultDataParser } from "./DataParser";
import { DefaultAnalysisEngine } from "./AnalysisEngine";
import { DefaultReportGenerator } from "./ReportGenerator";
import { DefaultErrorHandler } from "../utils/ErrorHandler";
import { ConfigurationManager } from "../config/ConfigurationManager";
import { PluginManager } from "../plugins/PluginManager";
import { ReportTemplateManager } from "./ReportTemplateManager";

/**
 * Configuration options for the NetworkPerformanceAnalyzer
 */
export interface AnalyzerConfig {
  /**
   * Whether to continue analysis when a dataset fails to parse
   * @default true
   */
  continueOnError?: boolean | undefined;

  /**
   * Whether to log progress information during analysis
   * @default true
   */
  logProgress?: boolean | undefined;

  /**
   * Path to save the generated report
   * If not provided, the report will only be returned as a string
   */
  reportOutputPath?: string | undefined;

  /**
   * Custom thresholds for anomaly detection
   */
  anomalyThresholds?:
    | {
        bandwidthVariation?: number | undefined;
        latencyVariation?: number | undefined;
        packetLossThreshold?: number | undefined;
        dnsResponseTimeVariation?: number | undefined;
        cpuUtilizationThreshold?: number | undefined;
      }
    | undefined;

  /**
   * Whether to use parallel processing for dataset analysis
   * @default true
   */
  useParallelProcessing?: boolean | undefined;

  /**
   * Maximum number of parallel tasks to run
   * @default 4
   */
  maxParallelTasks?: number | undefined;

  /**
   * Whether to enable performance monitoring
   * @default false
   */
  enablePerformanceMonitoring?: boolean | undefined;

  /**
   * Maximum memory usage percentage before triggering garbage collection
   * @default 80
   */
  memoryThresholdPercent?: number | undefined;

  /**
   * Path to configuration file
   * If provided, configuration will be loaded from this file
   */
  configPath?: string | undefined;

  /**
   * Environment to use for configuration
   * @default 'development'
   */
  environment?: string | undefined;

  /**
   * Paths to plugin directories
   */
  pluginDirectories?: string[] | undefined;

  /**
   * Report template ID to use
   * @default 'default'
   */
  reportTemplateId?: string | undefined;

  /**
   * Report sections to include
   */
  includeSections?: string[] | undefined;
}

/**
 * Main orchestrator class for the Network Performance Analyzer
 * Coordinates the end-to-end workflow from dataset discovery to report generation
 */
import { PerformanceMonitor } from "../utils/PerformanceMonitor";

export class NetworkPerformanceAnalyzer {
  private discoveryService: DatasetDiscoveryService;
  private dataParser: DataParser;
  private analysisEngine: AnalysisEngine;
  private reportGenerator: ReportGenerator;
  private errorHandler: ErrorHandler;
  private config: Required<AnalyzerConfig>;
  private performanceMonitor: PerformanceMonitor | null = null;
  private pluginManager?: PluginManager;
  private datasetDisplayNames: Map<string, string> = new Map();

  /**
   * Create a new NetworkPerformanceAnalyzer instance
   * @param discoveryService Service for discovering datasets
   * @param dataParser Service for parsing dataset files
   * @param analysisEngine Service for analyzing performance data
   * @param reportGenerator Service for generating reports
   * @param errorHandler Service for handling errors
   * @param config Configuration options for the analyzer
   */
  constructor(
    discoveryService: DatasetDiscoveryService,
    dataParser: DataParser,
    analysisEngine: AnalysisEngine,
    reportGenerator: ReportGenerator,
    errorHandler: ErrorHandler,
    config: AnalyzerConfig = {}
  ) {
    this.discoveryService = discoveryService;
    this.dataParser = dataParser;
    this.analysisEngine = analysisEngine;
    this.reportGenerator = reportGenerator;
    this.errorHandler = errorHandler;

    // Set default configuration values
    this.config = {
      continueOnError:
        config.continueOnError !== undefined ? config.continueOnError : true,
      logProgress: config.logProgress !== undefined ? config.logProgress : true,
      reportOutputPath: config.reportOutputPath,
      anomalyThresholds: config.anomalyThresholds
        ? { ...config.anomalyThresholds }
        : {},
      useParallelProcessing:
        config.useParallelProcessing !== undefined
          ? config.useParallelProcessing
          : true,
      maxParallelTasks: config.maxParallelTasks || 4,
      enablePerformanceMonitoring:
        config.enablePerformanceMonitoring !== undefined
          ? config.enablePerformanceMonitoring
          : false,
      memoryThresholdPercent: config.memoryThresholdPercent || 80,
      configPath: config.configPath,
      environment: config.environment || "development",
      pluginDirectories: config.pluginDirectories || [],
      reportTemplateId: config.reportTemplateId || "default",
      includeSections: config.includeSections || [],
    };

    // Initialize performance monitoring if enabled
    if (this.config.enablePerformanceMonitoring) {
      this.initializePerformanceMonitoring();
    }
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    this.performanceMonitor = new PerformanceMonitor({
      monitoringInterval: 5000,
      memoryThresholdPercent: this.config.memoryThresholdPercent || 80,
      ...(this.config.logProgress !== undefined
        ? { logToConsole: this.config.logProgress }
        : {}),
    });

    // Set up event listeners
    this.performanceMonitor.on("memory-threshold-exceeded", (data) => {
      this.logProgress(
        `Memory threshold exceeded: ${data.current.toFixed(1)}% > ${
          data.threshold
        }%`
      );
    });

    // Start monitoring
    this.performanceMonitor.start();
  }

  /**
   * Run the complete analysis workflow
   * @param rootPath Path to the directory containing dataset directories
   * @returns A promise that resolves to the generated report
   */
  async analyze(rootPath: string): Promise<string> {
    try {
      this.logProgress(`Starting analysis of datasets in ${rootPath}`);

      // Step 1: Discover datasets
      this.logProgress("Discovering datasets...");
      const datasets = await this.discoverDatasets(rootPath);
      
      // Set dataset display names in the report generator
      this.reportGenerator.setDatasetDisplayNames(datasets);

      if (datasets.length === 0) {
        const error = new Error(`No valid datasets found in ${rootPath}`);
        this.errorHandler.logError(error, "Dataset discovery failed");

        if (this.config.continueOnError) {
          this.logProgress(
            "Continuing with empty dataset list due to continueOnError=true"
          );
          return this.generateEmptyReport();
        }

        throw error;
      }

      this.logProgress(`Found ${datasets.length} datasets for analysis`);

      // Step 2: Load and parse dataset files
      this.logProgress("Loading and parsing dataset files...");
      const parsedDatasets = await this.parseDatasetFiles(datasets);

      if (parsedDatasets.length === 0) {
        const error = new Error("No datasets could be successfully parsed");
        this.errorHandler.logError(error, "Dataset parsing failed");

        if (this.config.continueOnError) {
          this.logProgress(
            "Continuing with empty dataset list due to continueOnError=true"
          );
          return this.generateEmptyReport();
        }

        throw error;
      }

      this.logProgress(`Successfully parsed ${parsedDatasets.length} datasets`);

      // Step 3: Perform analysis
      this.logProgress("Performing analysis...");
      const analysisResults = await this.performAnalysis(parsedDatasets);

      // Step 4: Generate report
      this.logProgress("Generating report...");
      const report = await this.reportGenerator.generateReport(analysisResults);

      // Step 5: Save report if output path is provided
      if (this.config.reportOutputPath) {
        await this.saveReport(report, this.config.reportOutputPath);
        this.logProgress(`Report saved to ${this.config.reportOutputPath}`);
      }

      this.logProgress("Analysis completed successfully");
      return report;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.errorHandler.logError(
        error instanceof Error ? error : new Error(errorMessage),
        "Error during analysis workflow"
      );

      // If configured to continue on error, return an error report
      if (this.config.continueOnError) {
        this.logProgress("Generating error report due to continueOnError=true");
        return this.generateErrorReport(errorMessage);
      }

      throw error;
    }
  }

  /**
   * Generate a report for when no datasets are available
   * @returns A simple markdown report indicating no datasets were found
   * @private
   */
  private generateEmptyReport(): string {
    return `# Network Performance Analysis Report

## Error: No Valid Datasets

No valid datasets were found or could be successfully parsed. Please check the following:

1. Ensure the dataset directories follow the naming pattern: \`(coredns|stock)-mtu\\d+-aws-logs_(enabled|disabled)\`
2. Verify that each dataset directory contains either:
   - A parameters file named \`parameters-results_*.json\`
   - A results file named \`results_*.json\`
3. Check the error log for specific parsing or validation errors

## Troubleshooting

- Verify file permissions and accessibility
- Ensure JSON files are properly formatted
- Check for missing required fields in the dataset files
- Review the application logs for detailed error information

*Report generated on ${new Date().toISOString()}*
`;
  }

  /**
   * Generate a report for when an error occurs during analysis
   * @param errorMessage The error message to include in the report
   * @returns A simple markdown report with the error information
   * @private
   */
  private generateErrorReport(errorMessage: string): string {
    return `# Network Performance Analysis Report

## Error During Analysis

An error occurred during the analysis process:

\`\`\`
${errorMessage}
\`\`\`

### Partial Results

The analysis could not be completed successfully. Any partial results may be incomplete or inaccurate.

## Troubleshooting

- Check the error log for detailed information about the failure
- Verify that all dataset files contain valid and complete data
- Ensure sufficient system resources are available for analysis
- Try running the analysis with a smaller subset of datasets

*Report generated on ${new Date().toISOString()}*
`;
  }

  /**
   * Discover datasets in the given root path
   * @param rootPath Path to the directory containing dataset directories
   * @returns A promise that resolves to an array of discovered datasets
   * @private
   */
  private async discoverDatasets(rootPath: string): Promise<Dataset[]> {
    try {
      // Use the discovery service to find datasets
      const datasets = await this.discoveryService.discoverDatasets(rootPath);

      // Log information about each dataset
      datasets.forEach((dataset) => {
        this.logProgress(
          `Found dataset: ${dataset.name} (MTU: ${
            dataset.configuration.mtu
          }, DNS Query Logging: ${
            dataset.configuration.awsLogging ? "enabled" : "disabled"
          })`
        );
      });

      return datasets;
    } catch (error) {
      this.errorHandler.logError(error as Error, "Error discovering datasets");

      // If configured to continue on error, return empty array
      if (this.config.continueOnError) {
        return [];
      }

      throw error;
    }
  }

  /**
   * Parse dataset files for all discovered datasets
   * @param datasets The datasets to parse files for
   * @returns A promise that resolves to an array of datasets with parsed results
   * @private
   */
  private async parseDatasetFiles(datasets: Dataset[]): Promise<Dataset[]> {
    // Start performance monitoring for this operation
    if (this.performanceMonitor) {
      this.performanceMonitor.startOperation("parseDatasetFiles");
    }

    try {
      const parsedDatasets: Dataset[] = [];

      // Use parallel processing if enabled
      if (this.config.useParallelProcessing && datasets.length > 1) {
        this.logProgress(
          `Using parallel processing for ${datasets.length} datasets (max ${this.config.maxParallelTasks} concurrent tasks)`
        );

        // Process datasets in batches to limit concurrency
        const batches: Dataset[][] = [];
        const batchSize = Math.min(
          this.config.maxParallelTasks || 4,
          datasets.length
        );

        // Create batches of datasets
        for (let i = 0; i < datasets.length; i += batchSize) {
          batches.push(datasets.slice(i, i + batchSize));
        }

        // Process each batch in parallel
        for (const batch of batches) {
          // Create parsing promises for all datasets in the batch
          const parsingPromises = batch.map(async (dataset) => {
            try {
              this.logProgress(`Parsing dataset: ${dataset.name}`);

              // Parse parameters file if it exists
              let parameters = null;
              if (
                dataset.parametersFile &&
                (await fs.pathExists(dataset.parametersFile))
              ) {
                this.logProgress(
                  `Parsing parameters file: ${path.basename(
                    dataset.parametersFile
                  )}`
                );
                parameters = await this.dataParser.parseParameters(
                  dataset.parametersFile
                );
              }

              // Parse results file if it exists
              let results: TestResults | null = null;
              if (
                dataset.resultsFile &&
                (await fs.pathExists(dataset.resultsFile))
              ) {
                this.logProgress(
                  `Parsing results file: ${path.basename(dataset.resultsFile)}`
                );
                results = await this.dataParser.parseResults(
                  dataset.resultsFile
                );
              }

              // Add parsed data to dataset
              const parsedDataset = {
                ...dataset,
                parameters,
                results,
              };

              // Only return datasets with results
              if (parsedDataset.results) {
                this.logProgress(
                  `Successfully parsed dataset: ${dataset.name}`
                );
                return parsedDataset;
              } else {
                this.logProgress(
                  `Skipping dataset ${dataset.name} - no results found`
                );
                return null;
              }
            } catch (error) {
              this.errorHandler.logError(
                error as Error,
                `Error parsing dataset: ${dataset.name}`
              );

              // If configured to continue on error, return null
              if (this.config.continueOnError) {
                return null;
              }

              throw error;
            }
          });

          // Wait for all parsing promises in this batch to complete
          const batchResults = await Promise.all(parsingPromises);

          // Add successful results to the parsed datasets array
          parsedDatasets.push(
            ...batchResults.filter(
              (result): result is Dataset & { parameters: any; results: any } =>
                result !== null
            )
          );
        }
      } else {
        // Use sequential processing for a single dataset or if parallel processing is disabled
        for (const dataset of datasets) {
          try {
            this.logProgress(`Parsing dataset: ${dataset.name}`);

            // Parse parameters file if it exists
            let parameters = null;
            if (
              dataset.parametersFile &&
              (await fs.pathExists(dataset.parametersFile))
            ) {
              this.logProgress(
                `Parsing parameters file: ${path.basename(
                  dataset.parametersFile
                )}`
              );
              parameters = await this.dataParser.parseParameters(
                dataset.parametersFile
              );
            }

            // Parse results file if it exists
            let results: TestResults | null = null;
            if (
              dataset.resultsFile &&
              (await fs.pathExists(dataset.resultsFile))
            ) {
              this.logProgress(
                `Parsing results file: ${path.basename(dataset.resultsFile)}`
              );
              results = await this.dataParser.parseResults(dataset.resultsFile);
            }

            // Add parsed data to dataset
            const parsedDataset = {
              ...dataset,
              parameters,
              results,
            };

            // Only add datasets with results
            if (parsedDataset.results) {
              parsedDatasets.push(parsedDataset);
              this.logProgress(`Successfully parsed dataset: ${dataset.name}`);
            } else {
              this.logProgress(
                `Skipping dataset ${dataset.name} - no results found`
              );
            }
          } catch (error) {
            this.errorHandler.logError(
              error as Error,
              `Error parsing dataset: ${dataset.name}`
            );

            // If configured to continue on error, skip this dataset
            if (!this.config.continueOnError) {
              throw error;
            }
          }
        }
      }

      return parsedDatasets;
    } finally {
      // End performance monitoring for this operation
      if (this.performanceMonitor) {
        const duration =
          this.performanceMonitor.endOperation("parseDatasetFiles");
        if (duration) {
          this.logProgress(
            `Dataset parsing completed in ${duration.toFixed(2)}ms`
          );
        }
      }
    }
  }

  /**
   * Perform analysis on the parsed datasets
   * @param datasets The datasets to analyze
   * @returns A promise that resolves to the analysis results
   * @private
   */
  private async performAnalysis(datasets: Dataset[]): Promise<AnalysisResults> {
    // Execute analyzer plugins if available
    let pluginResults = [];
    if (this.pluginManager) {
      try {
        pluginResults = await this.pluginManager.executePlugins("analyzer", {
          datasets,
        });
      } catch (error) {
        console.error("Error executing analyzer plugins:", error);
      }
    }
    // Start performance monitoring for this operation
    if (this.performanceMonitor) {
      this.performanceMonitor.startOperation("performAnalysis");
    }

    try {
      let iperfAnalysis, dnsAnalysis, configurationComparison, anomalies;

      // Use parallel processing if enabled
      if (this.config.useParallelProcessing) {
        this.logProgress("Using parallel processing for analysis tasks");

        // Run analysis tasks in parallel
        [iperfAnalysis, dnsAnalysis, configurationComparison, anomalies] =
          await Promise.all([
            // Task 1: Analyze iperf performance
            (async () => {
              if (this.performanceMonitor) {
                this.performanceMonitor.startOperation(
                  "analyzeIperfPerformance"
                );
              }
              this.logProgress("Analyzing iperf performance...");
              try {
                const result =
                  await this.analysisEngine.analyzeIperfPerformance(datasets);
                if (this.performanceMonitor) {
                  const duration = this.performanceMonitor.endOperation(
                    "analyzeIperfPerformance"
                  );
                  if (duration) {
                    this.logProgress(
                      `Iperf analysis completed in ${duration.toFixed(2)}ms`
                    );
                  }
                }
                return result;
              } catch (error) {
                this.errorHandler.logError(
                  error as Error,
                  "Error analyzing iperf performance"
                );
                throw error;
              }
            })(),

            // Task 2: Analyze DNS performance
            (async () => {
              if (this.performanceMonitor) {
                this.performanceMonitor.startOperation("analyzeDnsPerformance");
              }
              this.logProgress("Analyzing DNS performance...");
              try {
                const result = await this.analysisEngine.analyzeDnsPerformance(
                  datasets
                );
                if (this.performanceMonitor) {
                  const duration = this.performanceMonitor.endOperation(
                    "analyzeDnsPerformance"
                  );
                  if (duration) {
                    this.logProgress(
                      `DNS analysis completed in ${duration.toFixed(2)}ms`
                    );
                  }
                }
                return result;
              } catch (error) {
                this.errorHandler.logError(
                  error as Error,
                  "Error analyzing DNS performance"
                );
                throw error;
              }
            })(),

            // Task 3: Compare configurations
            (async () => {
              if (this.performanceMonitor) {
                this.performanceMonitor.startOperation("compareConfigurations");
              }
              this.logProgress("Comparing configurations...");
              try {
                const result = await this.analysisEngine.compareConfigurations(
                  datasets
                );
                if (this.performanceMonitor) {
                  const duration = this.performanceMonitor.endOperation(
                    "compareConfigurations"
                  );
                  if (duration) {
                    this.logProgress(
                      `Configuration comparison completed in ${duration.toFixed(
                        2
                      )}ms`
                    );
                  }
                }
                return result;
              } catch (error) {
                this.errorHandler.logError(
                  error as Error,
                  "Error comparing configurations"
                );
                throw error;
              }
            })(),

            // Task 4: Detect anomalies
            (async () => {
              if (this.performanceMonitor) {
                this.performanceMonitor.startOperation("detectAnomalies");
              }
              this.logProgress("Detecting performance anomalies...");
              try {
                const result = await this.analysisEngine.detectAnomalies(
                  datasets
                );
                if (this.performanceMonitor) {
                  const duration =
                    this.performanceMonitor.endOperation("detectAnomalies");
                  if (duration) {
                    this.logProgress(
                      `Anomaly detection completed in ${duration.toFixed(2)}ms`
                    );
                  }
                }
                return result;
              } catch (error) {
                this.errorHandler.logError(
                  error as Error,
                  "Error detecting anomalies"
                );
                throw error;
              }
            })(),
          ]);
      } else {
        // Sequential processing
        // Step 1: Analyze iperf performance
        if (this.performanceMonitor) {
          this.performanceMonitor.startOperation("analyzeIperfPerformance");
        }
        this.logProgress("Analyzing iperf performance...");
        iperfAnalysis = await this.analysisEngine.analyzeIperfPerformance(
          datasets
        );
        if (this.performanceMonitor) {
          const duration = this.performanceMonitor.endOperation(
            "analyzeIperfPerformance"
          );
          if (duration) {
            this.logProgress(
              `Iperf analysis completed in ${duration.toFixed(2)}ms`
            );
          }
        }

        // Step 2: Analyze DNS performance
        if (this.performanceMonitor) {
          this.performanceMonitor.startOperation("analyzeDnsPerformance");
        }
        this.logProgress("Analyzing DNS performance...");
        dnsAnalysis = await this.analysisEngine.analyzeDnsPerformance(datasets);
        if (this.performanceMonitor) {
          const duration = this.performanceMonitor.endOperation(
            "analyzeDnsPerformance"
          );
          if (duration) {
            this.logProgress(
              `DNS analysis completed in ${duration.toFixed(2)}ms`
            );
          }
        }

        // Step 3: Compare configurations
        if (this.performanceMonitor) {
          this.performanceMonitor.startOperation("compareConfigurations");
        }
        this.logProgress("Comparing configurations...");
        configurationComparison =
          await this.analysisEngine.compareConfigurations(datasets);
        if (this.performanceMonitor) {
          const duration = this.performanceMonitor.endOperation(
            "compareConfigurations"
          );
          if (duration) {
            this.logProgress(
              `Configuration comparison completed in ${duration.toFixed(2)}ms`
            );
          }
        }

        // Step 4: Detect anomalies
        if (this.performanceMonitor) {
          this.performanceMonitor.startOperation("detectAnomalies");
        }
        this.logProgress("Detecting performance anomalies...");
        anomalies = await this.analysisEngine.detectAnomalies(datasets);
        if (this.performanceMonitor) {
          const duration =
            this.performanceMonitor.endOperation("detectAnomalies");
          if (duration) {
            this.logProgress(
              `Anomaly detection completed in ${duration.toFixed(2)}ms`
            );
          }
        }
      }

      // Step 5: Create executive summary
      if (this.performanceMonitor) {
        this.performanceMonitor.startOperation("createExecutiveSummary");
      }
      this.logProgress("Creating executive summary...");
      const summary = this.createExecutiveSummary(
        datasets,
        iperfAnalysis,
        dnsAnalysis,
        configurationComparison,
        anomalies
      );
      if (this.performanceMonitor) {
        const duration = this.performanceMonitor.endOperation(
          "createExecutiveSummary"
        );
        if (duration) {
          this.logProgress(
            `Executive summary created in ${duration.toFixed(2)}ms`
          );
        }
      }

      // Combine all analysis results
      return {
        iperfAnalysis,
        dnsAnalysis,
        configurationComparison,
        anomalies,
        summary,
      };
    } catch (error) {
      this.errorHandler.logError(error as Error, "Error performing analysis");
      throw error;
    } finally {
      // End performance monitoring for this operation
      if (this.performanceMonitor) {
        const duration =
          this.performanceMonitor.endOperation("performAnalysis");
        if (duration) {
          this.logProgress(`Analysis completed in ${duration.toFixed(2)}ms`);

          // Generate performance report if monitoring is enabled
          if (this.config.enablePerformanceMonitoring) {
            const perfReport = this.performanceMonitor.generateReport();
            this.logProgress("Performance report generated");

            // Save performance report if output path is provided
            if (this.config.reportOutputPath) {
              const perfReportPath = this.config.reportOutputPath.replace(
                /\.md$/,
                "-performance.md"
              );
              try {
                fs.writeFileSync(perfReportPath, perfReport);
                this.logProgress(
                  `Performance report saved to ${perfReportPath}`
                );
              } catch (error) {
                this.errorHandler.logError(
                  error as Error,
                  "Error saving performance report"
                );
              }
            }
          }
        }
      }
    }
  }

  /**
   * Create an executive summary from the analysis results
   * @param datasets The analyzed datasets
   * @param iperfAnalysis The iperf performance analysis
   * @param dnsAnalysis The DNS performance analysis
   * @param configurationComparison The configuration comparison
   * @param anomalies The detected anomalies
   * @returns The executive summary
   * @private
   */
  private createExecutiveSummary(
    datasets: Dataset[],
    iperfAnalysis: any,
    dnsAnalysis: any,
    configurationComparison: any,
    anomalies: any[]
  ): ExecutiveSummary {
    // Find optimal configuration
    console.log('[DEBUG] Overall ranking length:', configurationComparison.overallRanking.length);
    console.log('[DEBUG] Overall ranking:', configurationComparison.overallRanking);
    
    const optimalConfig =
      configurationComparison.overallRanking.length > 0
        ? configurationComparison.overallRanking.sort(
            (a: any, b: any) => a.rank - b.rank
          )[0].configuration
        : "Unknown";
        
    console.log('[DEBUG] Optimal config determined:', optimalConfig);

    // Generate key findings
    const keyFindings: string[] = [];

    // Add MTU impact finding
    if (
      configurationComparison.mtuImpact &&
      configurationComparison.mtuImpact.optimalMtu
    ) {
      keyFindings.push(
        `MTU ${configurationComparison.mtuImpact.optimalMtu} provides the best overall network performance.`
      );
    }

    // Add DNS query logging impact finding
    if (configurationComparison.loggingImpact) {
      const impact = configurationComparison.loggingImpact.performanceImpact;
      const direction = impact > 0 ? "improves" : "degrades";
      const magnitude = Math.abs(impact);

      if (magnitude > 0.05) {
        // 5% threshold for significance
        keyFindings.push(
          `DNS query logging ${direction} overall performance by approximately ${(
            magnitude * 100
          ).toFixed(1)}%.`
        );
      } else {
        keyFindings.push(
          "DNS query logging has minimal impact on overall network performance."
        );
      }
    }

    // Add bandwidth finding
    if (
      iperfAnalysis.bandwidthComparison &&
      iperfAnalysis.bandwidthComparison.length > 0
    ) {
      const bestBandwidth = [...iperfAnalysis.bandwidthComparison].sort(
        (a, b) => b.avgBandwidthMbps - a.avgBandwidthMbps
      )[0];
      keyFindings.push(
        `Highest average bandwidth of ${bestBandwidth.avgBandwidthMbps.toFixed(
          2
        )} Mbps achieved with ${bestBandwidth.configuration} configuration.`
      );
    }

    // Add DNS performance finding
    if (
      dnsAnalysis.performanceMetrics &&
      dnsAnalysis.performanceMetrics.length > 0
    ) {
      const bestDns = [...dnsAnalysis.performanceMetrics].sort(
        (a, b) => a.avgResponseTimeMs - b.avgResponseTimeMs
      )[0];
      keyFindings.push(
        `Fastest DNS resolution (${bestDns.avgResponseTimeMs.toFixed(
          2
        )} ms) achieved with ${bestDns.configuration} configuration.`
      );
    }

    // Add anomaly finding if any exist
    if (anomalies && anomalies.length > 0) {
      const highSeverity = anomalies.filter((a) => a.severity === "high");
      if (highSeverity.length > 0) {
        keyFindings.push(
          `Detected ${highSeverity.length} high severity performance anomalies that require attention.`
        );
      }
    }

    // Generate recommendations
    const recommendations: string[] = [];

    // Add MTU recommendations
    if (
      configurationComparison.mtuImpact &&
      configurationComparison.mtuImpact.recommendations
    ) {
      recommendations.push(
        ...configurationComparison.mtuImpact.recommendations
      );
    }

    // Add logging recommendations
    if (
      configurationComparison.loggingImpact &&
      configurationComparison.loggingImpact.recommendations
    ) {
      recommendations.push(
        ...configurationComparison.loggingImpact.recommendations
      );
    }

    // Add anomaly recommendations
    if (anomalies && anomalies.length > 0) {
      const highSeverityRecs = anomalies
        .filter((a) => a.severity === "high")
        .flatMap((a) => a.recommendations);

      // Add unique recommendations
      const uniqueRecs = new Set(highSeverityRecs);
      recommendations.push(...uniqueRecs);
    }

    // Generate performance highlights
    const performanceHighlights: string[] = [];

    // Add bandwidth highlight
    if (
      iperfAnalysis.bandwidthComparison &&
      iperfAnalysis.bandwidthComparison.length > 1
    ) {
      const sorted = [...iperfAnalysis.bandwidthComparison].sort(
        (a, b) => b.avgBandwidthMbps - a.avgBandwidthMbps
      );
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      const difference =
        ((best.avgBandwidthMbps - worst.avgBandwidthMbps) /
          worst.avgBandwidthMbps) *
        100;

      performanceHighlights.push(
        `Bandwidth varies by up to ${difference.toFixed(
          1
        )}% across different configurations.`
      );
    }

    // Add latency highlight
    if (
      iperfAnalysis.latencyAnalysis &&
      iperfAnalysis.latencyAnalysis.length > 0
    ) {
      const bestLatency = [...iperfAnalysis.latencyAnalysis].sort(
        (a, b) => a.avgLatencyMs - b.avgLatencyMs
      )[0];
      performanceHighlights.push(
        `Lowest average latency (${bestLatency.avgLatencyMs.toFixed(
          2
        )} ms) achieved with ${bestLatency.configuration} configuration.`
      );
    }

    // Add reliability highlight
    if (
      iperfAnalysis.reliabilityMetrics &&
      iperfAnalysis.reliabilityMetrics.length > 0
    ) {
      const bestReliability = [...iperfAnalysis.reliabilityMetrics].sort(
        (a, b) => b.successRate - a.successRate
      )[0];
      performanceHighlights.push(
        `Highest reliability (${(bestReliability.successRate * 100).toFixed(
          2
        )}% success rate) achieved with ${
          bestReliability.configuration
        } configuration.`
      );
    }

    return {
      totalDatasets: datasets.length,
      keyFindings,
      recommendations,
      optimalConfiguration: optimalConfig,
      performanceHighlights,
    };
  }

  /**
   * Save the generated report to a file
   * @param report The report content to save
   * @param outputPath The path to save the report to
   * @returns A promise that resolves when the report is saved
   * @private
   */
  private async saveReport(report: string, outputPath: string): Promise<void> {
    try {
      // Ensure the directory exists
      await fs.ensureDir(path.dirname(outputPath));

      // Write the report to the file
      await fs.writeFile(outputPath, report, "utf8");
    } catch (error) {
      this.errorHandler.logError(
        error as Error,
        `Error saving report to ${outputPath}`
      );
      throw error;
    }
  }

  /**
   * Log progress information if enabled
   * @param message The progress message to log
   * @private
   */
  private logProgress(message: string): void {
    if (this.config.logProgress) {
      console.log(`[NetworkPerformanceAnalyzer] ${message}`);
    }
  }
  
  /**
   * Prepare MTU impact data for the comparison table
   * @param analysis The analysis results
   * @returns The MTU impact data
   */
  private prepareMtuImpactData(analysis: AnalysisResults): any[] {
    const { iperfAnalysis, configurationComparison } = analysis;
    const { bandwidthComparison, latencyAnalysis, reliabilityMetrics } = iperfAnalysis;
    const { overallRanking } = configurationComparison;
    
    // Group configurations by MTU and DNS server
    const configsByMtu = new Map<string, any[]>();
    
    // Extract MTU and DNS server from configuration names
    overallRanking.forEach(config => {
      const displayName = this.getConfigurationDisplayName(config.configuration);
      const parts = displayName.split('-');
      if (parts.length >= 2) {
        const dnsServer = parts[0]; // e.g., 'bind9' or 'coredns'
        const mtuPart = parts[1]; // e.g., 'mtu1420'
        if (mtuPart && mtuPart.startsWith('mtu')) {
          const mtu = mtuPart.replace('mtu', ''); // e.g., '1420' from 'mtu1420'
          const key = `${mtu} (${dnsServer})`;
          
          if (!configsByMtu.has(key)) {
            configsByMtu.set(key, []);
          }
          const configList = configsByMtu.get(key);
          if (configList) {
            configList.push({
              ...config,
              displayName,
              mtu,
              dnsServer
            });
          }
        }
      }
    });
    
    const mtuImpactData: any[] = [];
    
    // Create MTU impact data entries
    configsByMtu.forEach((configs, mtuSetting) => {
      if (configs.length > 0) {
        const config = configs[0];
        const bandwidthMetric = bandwidthComparison.find(m => m.configuration === config.configuration);
        const latencyMetric = latencyAnalysis.find(m => m.configuration === config.configuration);
        const reliabilityMetric = reliabilityMetrics.find(m => m.configuration === config.configuration);
        
        mtuImpactData.push({
          mtuSetting,
          avgBandwidth: bandwidthMetric ? bandwidthMetric.avgBandwidthMbps.toFixed(2) : 'N/A',
          avgLatency: latencyMetric ? latencyMetric.avgLatencyMs.toFixed(2) : 'N/A',
          jitter: latencyMetric ? latencyMetric.jitterMs.toFixed(2) : 'N/A',
          packetLoss: reliabilityMetric ? (reliabilityMetric.packetLossRate * 100).toFixed(2) : 'N/A',
          overallScore: config.overallScore.toFixed(2)
        });
      }
    });
    
    return mtuImpactData;
  }
  
  /**
   * Prepare DNS server data for the comparison table
   * @param analysis The analysis results
   * @returns The DNS server data
   */
  private prepareDnsServerData(analysis: AnalysisResults): any[] {
    const { iperfAnalysis, dnsAnalysis, configurationComparison } = analysis;
    const { bandwidthComparison, latencyAnalysis, reliabilityMetrics } = iperfAnalysis;
    const { performanceMetrics } = dnsAnalysis;
    const { overallRanking } = configurationComparison;
    
    // Group configurations by DNS server
    const configsByServer = new Map<string, any[]>();
    
    // Extract DNS server from configuration names
    overallRanking.forEach(config => {
      const displayName = this.getConfigurationDisplayName(config.configuration);
      const parts = displayName.split('-');
      if (parts.length >= 1 && parts[0]) {
        const dnsServer = parts[0]; // e.g., 'bind9' or 'coredns'
        
        if (!configsByServer.has(dnsServer)) {
          configsByServer.set(dnsServer, []);
        }
        const configList = configsByServer.get(dnsServer);
        if (configList) {
          configList.push({
            ...config,
            displayName
          });
        }
      }
    });
    
    const dnsServerData: any[] = [];
    
    // Calculate averages for each DNS server
    configsByServer.forEach((configs, server) => {
      if (configs.length > 0) {
        // Calculate average bandwidth
        const bandwidthValues = configs
          .map(c => bandwidthComparison.find(m => m.configuration === c.configuration)?.avgBandwidthMbps || 0);
        const avgBandwidth = bandwidthValues.length > 0 
          ? (bandwidthValues.reduce((sum, val) => sum + val, 0) / bandwidthValues.length).toFixed(2)
          : 'N/A';
        
        // Calculate average latency
        const latencyValues = configs
          .map(c => latencyAnalysis.find(m => m.configuration === c.configuration)?.avgLatencyMs || 0);
        const avgLatency = latencyValues.length > 0
          ? (latencyValues.reduce((sum, val) => sum + val, 0) / latencyValues.length).toFixed(2)
          : 'N/A';
        
        // Calculate average DNS response time
        const dnsResponseValues = configs
          .map(c => performanceMetrics.find(m => m.configuration === c.configuration)?.avgResponseTimeMs || 0);
        const avgDnsResponse = dnsResponseValues.length > 0
          ? (dnsResponseValues.reduce((sum, val) => sum + val, 0) / dnsResponseValues.length).toFixed(2)
          : 'N/A';
        
        // Calculate average packet loss
        const packetLossValues = configs
          .map(c => {
            const reliabilityMetric = reliabilityMetrics.find(m => m.configuration === c.configuration);
            return reliabilityMetric ? reliabilityMetric.packetLossRate * 100 : 0;
          });
        const avgPacketLoss = packetLossValues.length > 0
          ? (packetLossValues.reduce((sum, val) => sum + val, 0) / packetLossValues.length).toFixed(2)
          : 'N/A';
        
        // Calculate average overall score
        const scoreValues = configs.map(c => c.overallScore);
        const avgScore = scoreValues.length > 0
          ? (scoreValues.reduce((sum, val) => sum + val, 0) / scoreValues.length).toFixed(2)
          : 'N/A';
        
        dnsServerData.push({
          server,
          avgBandwidth,
          avgLatency,
          dnsResponse: avgDnsResponse,
          packetLoss: avgPacketLoss,
          overallScore: avgScore
        });
      }
    });
    
    return dnsServerData;
  }
  
  /**
   * Prepare logging impact data for the comparison table
   * @param analysis The analysis results
   * @returns The logging impact data
   */
  private prepareLoggingImpactData(analysis: AnalysisResults): any[] {
    const { iperfAnalysis, dnsAnalysis, configurationComparison } = analysis;
    const { bandwidthComparison, latencyAnalysis, reliabilityMetrics } = iperfAnalysis;
    const { performanceMetrics } = dnsAnalysis;
    const { overallRanking } = configurationComparison;
    
    // Group configurations by logging status
    const configsByLogging = new Map<string, any[]>();
    
    // Extract logging status from configuration names
    overallRanking.forEach(config => {
      const displayName = this.getConfigurationDisplayName(config.configuration);
      const parts = displayName.split('-');
      if (parts.length >= 3 && parts[2]) {
        const loggingStatus = parts[2].includes('enabled') ? 'Enabled' : 'Disabled';
        
        if (!configsByLogging.has(loggingStatus)) {
          configsByLogging.set(loggingStatus, []);
        }
        const configList = configsByLogging.get(loggingStatus);
        if (configList) {
          configList.push({
            ...config,
            displayName
          });
        }
      }
    });
    
    const loggingImpactData: any[] = [];
    
    // Calculate averages for each logging status
    configsByLogging.forEach((configs, status) => {
      if (configs.length > 0) {
        // Calculate average bandwidth
        const bandwidthValues = configs
          .map(c => bandwidthComparison.find(m => m.configuration === c.configuration)?.avgBandwidthMbps || 0);
        const avgBandwidth = bandwidthValues.length > 0 
          ? (bandwidthValues.reduce((sum, val) => sum + val, 0) / bandwidthValues.length).toFixed(2)
          : 'N/A';
        
        // Calculate average latency
        const latencyValues = configs
          .map(c => latencyAnalysis.find(m => m.configuration === c.configuration)?.avgLatencyMs || 0);
        const avgLatency = latencyValues.length > 0
          ? (latencyValues.reduce((sum, val) => sum + val, 0) / latencyValues.length).toFixed(2)
          : 'N/A';
        
        // Calculate average DNS response time
        const dnsResponseValues = configs
          .map(c => performanceMetrics.find(m => m.configuration === c.configuration)?.avgResponseTimeMs || 0);
        const avgDnsResponse = dnsResponseValues.length > 0
          ? (dnsResponseValues.reduce((sum, val) => sum + val, 0) / dnsResponseValues.length).toFixed(2)
          : 'N/A';
        
        // Calculate average packet loss
        const packetLossValues = configs
          .map(c => {
            const reliabilityMetric = reliabilityMetrics.find(m => m.configuration === c.configuration);
            return reliabilityMetric ? reliabilityMetric.packetLossRate * 100 : 0;
          });
        const avgPacketLoss = packetLossValues.length > 0
          ? (packetLossValues.reduce((sum, val) => sum + val, 0) / packetLossValues.length).toFixed(2)
          : 'N/A';
        
        // Calculate average overall score
        const scoreValues = configs.map(c => c.overallScore);
        const avgScore = scoreValues.length > 0
          ? (scoreValues.reduce((sum, val) => sum + val, 0) / scoreValues.length).toFixed(2)
          : 'N/A';
        
        loggingImpactData.push({
          status,
          avgBandwidth,
          avgLatency,
          dnsResponse: avgDnsResponse,
          packetLoss: avgPacketLoss,
          overallScore: avgScore
        });
      }
    });
    
    return loggingImpactData;
  }
  
  /**
   * Prepare anomaly distribution data for the comparison table
   * @param anomalies The performance anomalies
   * @returns The anomaly distribution data
   */
  private prepareAnomalyDistributionData(anomalies: PerformanceAnomaly[]): any[] {
    // Group anomalies by configuration and type
    const anomalyMap = new Map<string, Map<string, { count: number, severities: string[] }>>();
    
    anomalies.forEach(anomaly => {
      const configName = this.getConfigurationDisplayName(anomaly.configuration);
      
      if (!anomalyMap.has(configName)) {
        anomalyMap.set(configName, new Map());
      }
      
      const configAnomalies = anomalyMap.get(configName);
      if (configAnomalies) {
        if (!configAnomalies.has(anomaly.type)) {
          configAnomalies.set(anomaly.type, { count: 0, severities: [] });
        }
        
        const typeAnomalies = configAnomalies.get(anomaly.type);
        if (typeAnomalies) {
          typeAnomalies.count++;
          typeAnomalies.severities.push(anomaly.severity);
        }
      }
    });
    
    const anomalyDistribution: any[] = [];
    
    // Format anomaly distribution data
    anomalyMap.forEach((configAnomalies, configuration) => {
      // Format anomaly counts with severity
      const formatAnomalies = (type: string) => {
        if (!configAnomalies.has(type)) return '0';
        
        const anomalyData = configAnomalies.get(type);
        if (!anomalyData) return '0';
        
        const { count, severities } = anomalyData;
        const severityCounts = {
          high: severities.filter(s => s === 'high').length,
          medium: severities.filter(s => s === 'medium').length,
          low: severities.filter(s => s === 'low').length
        };
        
        const parts = [];
        if (severityCounts.high > 0) parts.push(`${severityCounts.high} (high)`);
        if (severityCounts.medium > 0) parts.push(`${severityCounts.medium} (medium)`);
        if (severityCounts.low > 0) parts.push(`${severityCounts.low} (low)`);
        
        return parts.join(', ');
      };
      
      const bandwidthAnomalies = formatAnomalies('bandwidth');
      const latencyAnomalies = formatAnomalies('latency');
      const packetLossAnomalies = formatAnomalies('packet_loss');
      const dnsAnomalies = formatAnomalies('dns_failure');
      
      // Calculate total anomalies
      const totalAnomalies = Array.from(configAnomalies.values())
        .reduce((sum, anomalyData) => sum + anomalyData.count, 0);
      
      anomalyDistribution.push({
        configuration,
        bandwidthAnomalies,
        latencyAnomalies,
        packetLossAnomalies,
        dnsAnomalies,
        total: totalAnomalies
      });
    });
    
    return anomalyDistribution;
  }
  
  /**
   * Get the display name for a configuration
   * @param configName The configuration name
   * @returns The display name if available, otherwise the original name
   */
  private getConfigurationDisplayName(configName: string): string {
    return this.datasetDisplayNames.get(configName) || configName;
  }
}
/**
 * Factory function to create a new NetworkPerformanceAnalyzer instance with configuration and plugin support
 * @param config Configuration options for the analyzer
 * @returns A new NetworkPerformanceAnalyzer instance
 */
export function createNetworkPerformanceAnalyzer(
  config: AnalyzerConfig = {}
): NetworkPerformanceAnalyzer {
  // Initialize configuration manager
  const configManager = new ConfigurationManager();

  // Load configuration from file if provided
  if (config.configPath) {
    configManager.loadFromFile(config.configPath);
  }

  // Set environment if provided
  if (config.environment) {
    configManager.setEnvironment(config.environment);
  }

  // Merge provided config with loaded config
  configManager.update({
    ...(config.continueOnError !== undefined ||
    config.logProgress !== undefined ||
    config.useParallelProcessing !== undefined ||
    config.maxParallelTasks !== undefined ||
    config.enablePerformanceMonitoring !== undefined ||
    config.memoryThresholdPercent !== undefined
      ? {
          analysis: {
            ...(config.continueOnError !== undefined
              ? { continueOnError: config.continueOnError }
              : {}),
            ...(config.logProgress !== undefined
              ? { logProgress: config.logProgress }
              : {}),
            ...(config.useParallelProcessing !== undefined
              ? { useParallelProcessing: config.useParallelProcessing }
              : {}),
            ...(config.maxParallelTasks !== undefined
              ? { maxParallelTasks: config.maxParallelTasks }
              : {}),
            ...(config.enablePerformanceMonitoring !== undefined
              ? {
                  enablePerformanceMonitoring:
                    config.enablePerformanceMonitoring,
                }
              : {}),
            ...(config.memoryThresholdPercent !== undefined
              ? { memoryThresholdPercent: config.memoryThresholdPercent }
              : {}),
          },
        }
      : {}),
    ...(config.anomalyThresholds
      ? { 
          anomalyThresholds: Object.fromEntries(
            Object.entries(config.anomalyThresholds).filter(([_, value]) => value !== undefined)
          )
        }
      : {}),
    ...(config.reportOutputPath || config.includeSections
      ? {
          reporting: {
            ...(config.reportOutputPath
              ? {
                  outputDirectory: path.dirname(config.reportOutputPath),
                  defaultFilename: path.basename(config.reportOutputPath),
                }
              : {}),
            ...(config.includeSections
              ? { includeSections: config.includeSections }
              : {}),
          },
        }
      : {}),
  });

  // Get final analyzer config
  const analyzerConfig = configManager.getAnalyzerConfig();

  // Initialize plugin manager
  const pluginManager = new PluginManager(configManager);

  // Add plugin directories if provided
  if (config.pluginDirectories) {
    for (const dir of config.pluginDirectories) {
      pluginManager.addPluginDirectory(dir);
    }
  }

  // Add default plugin directory
  pluginManager.addPluginDirectory(path.join(__dirname, "../plugins"));

  // Initialize template manager
  const templateManager = new ReportTemplateManager(configManager);

  // Set active template if provided
  if (config.reportTemplateId) {
    try {
      templateManager.setActiveTemplate(config.reportTemplateId);
    } catch (error) {
      console.warn(
        `Template ${config.reportTemplateId} not found, using default template`
      );
    }
  }

  // Create services
  const discoveryService = new DefaultDatasetDiscoveryService();
  const dataParser = new DefaultDataParser();
  const analysisEngine = new DefaultAnalysisEngine();

  // Create custom report generator that integrates with plugins and templates
  const reportGenerator = new (class extends DefaultReportGenerator {
    // Helper methods for preparing comparison table data
    private prepareMtuImpactData(analysis: AnalysisResults): any[] {
      const { iperfAnalysis, configurationComparison } = analysis;
      const { bandwidthComparison, latencyAnalysis, reliabilityMetrics } = iperfAnalysis;
      const { overallRanking } = configurationComparison;
      
      // Group configurations by MTU and DNS server
      const configsByMtu = new Map<string, any[]>();
      
      // Extract MTU and DNS server from configuration names
      overallRanking.forEach(config => {
        const displayName = this.getConfigurationDisplayName(config.configuration);
        const parts = displayName.split('-');
        if (parts.length >= 2) {
          const dnsServer = parts[0]; // e.g., 'bind9' or 'coredns'
          const mtuPart = parts[1]; // e.g., 'mtu1420'
          if (mtuPart && mtuPart.startsWith('mtu')) {
            const mtu = mtuPart.replace('mtu', ''); // e.g., '1420' from 'mtu1420'
            const key = `${mtu} (${dnsServer})`;
            
            if (!configsByMtu.has(key)) {
              configsByMtu.set(key, []);
            }
            const configList = configsByMtu.get(key);
            if (configList) {
              configList.push({
                ...config,
                displayName,
                mtu,
                dnsServer
              });
            }
          }
        }
      });
      
      const mtuImpactData: any[] = [];
      
      // Create MTU impact data entries
      configsByMtu.forEach((configs, mtuSetting) => {
        if (configs.length > 0) {
          const config = configs[0];
          const bandwidthMetric = bandwidthComparison.find(m => m.configuration === config.configuration);
          const latencyMetric = latencyAnalysis.find(m => m.configuration === config.configuration);
          const reliabilityMetric = reliabilityMetrics.find(m => m.configuration === config.configuration);
          
          mtuImpactData.push({
            mtuSetting,
            avgBandwidth: bandwidthMetric ? bandwidthMetric.avgBandwidthMbps.toFixed(2) : 'N/A',
            avgLatency: latencyMetric ? latencyMetric.avgLatencyMs.toFixed(2) : 'N/A',
            jitter: latencyMetric ? latencyMetric.jitterMs.toFixed(2) : 'N/A',
            packetLoss: reliabilityMetric ? (reliabilityMetric.packetLossRate * 100).toFixed(2) : 'N/A',
            overallScore: config.overallScore.toFixed(2)
          });
        }
      });
      
      return mtuImpactData;
    }
    
    private prepareDnsServerData(analysis: AnalysisResults): any[] {
      const { iperfAnalysis, dnsAnalysis, configurationComparison } = analysis;
      const { bandwidthComparison, latencyAnalysis, reliabilityMetrics } = iperfAnalysis;
      const { performanceMetrics } = dnsAnalysis;
      const { overallRanking } = configurationComparison;
      
      // Group configurations by DNS server
      const configsByServer = new Map<string, any[]>();
      
      // Extract DNS server from configuration names
      overallRanking.forEach(config => {
        const displayName = this.getConfigurationDisplayName(config.configuration);
        const parts = displayName.split('-');
        if (parts.length >= 1 && parts[0]) {
          const dnsServer = parts[0]; // e.g., 'bind9' or 'coredns'
          
          if (!configsByServer.has(dnsServer)) {
            configsByServer.set(dnsServer, []);
          }
          const configList = configsByServer.get(dnsServer);
          if (configList) {
            configList.push({
              ...config,
              displayName
            });
          }
        }
      });
      
      const dnsServerData: any[] = [];
      
      // Calculate averages for each DNS server
      configsByServer.forEach((configs, server) => {
        if (configs.length > 0) {
          // Calculate average bandwidth
          const bandwidthValues = configs
            .map(c => bandwidthComparison.find(m => m.configuration === c.configuration)?.avgBandwidthMbps || 0);
          const avgBandwidth = bandwidthValues.length > 0 
            ? (bandwidthValues.reduce((sum, val) => sum + val, 0) / bandwidthValues.length).toFixed(2)
            : 'N/A';
          
          // Calculate average latency
          const latencyValues = configs
            .map(c => latencyAnalysis.find(m => m.configuration === c.configuration)?.avgLatencyMs || 0);
          const avgLatency = latencyValues.length > 0
            ? (latencyValues.reduce((sum, val) => sum + val, 0) / latencyValues.length).toFixed(2)
            : 'N/A';
          
          // Calculate average DNS response time
          const dnsResponseValues = configs
            .map(c => performanceMetrics.find(m => m.configuration === c.configuration)?.avgResponseTimeMs || 0);
          const avgDnsResponse = dnsResponseValues.length > 0
            ? (dnsResponseValues.reduce((sum, val) => sum + val, 0) / dnsResponseValues.length).toFixed(2)
            : 'N/A';
          
          // Calculate average packet loss
          const packetLossValues = configs
            .map(c => {
              const reliabilityMetric = reliabilityMetrics.find(m => m.configuration === c.configuration);
              return reliabilityMetric ? reliabilityMetric.packetLossRate * 100 : 0;
            });
          const avgPacketLoss = packetLossValues.length > 0
            ? (packetLossValues.reduce((sum, val) => sum + val, 0) / packetLossValues.length).toFixed(2)
            : 'N/A';
          
          // Calculate average overall score
          const scoreValues = configs.map(c => c.overallScore);
          const avgScore = scoreValues.length > 0
            ? (scoreValues.reduce((sum, val) => sum + val, 0) / scoreValues.length).toFixed(2)
            : 'N/A';
          
          dnsServerData.push({
            server,
            avgBandwidth,
            avgLatency,
            dnsResponse: avgDnsResponse,
            packetLoss: avgPacketLoss,
            overallScore: avgScore
          });
        }
      });
      
      return dnsServerData;
    }
    
    private prepareLoggingImpactData(analysis: AnalysisResults): any[] {
      const { iperfAnalysis, dnsAnalysis, configurationComparison } = analysis;
      const { bandwidthComparison, latencyAnalysis, reliabilityMetrics } = iperfAnalysis;
      const { performanceMetrics } = dnsAnalysis;
      const { overallRanking } = configurationComparison;
      
      // Group configurations by logging status
      const configsByLogging = new Map<string, any[]>();
      
      // Extract logging status from configuration names
      overallRanking.forEach(config => {
        const displayName = this.getConfigurationDisplayName(config.configuration);
        const parts = displayName.split('-');
        if (parts.length >= 3 && parts[2]) {
          const loggingStatus = parts[2].includes('enabled') ? 'Enabled' : 'Disabled';
          
          if (!configsByLogging.has(loggingStatus)) {
            configsByLogging.set(loggingStatus, []);
          }
          const configList = configsByLogging.get(loggingStatus);
          if (configList) {
            configList.push({
              ...config,
              displayName
            });
          }
        }
      });
      
      const loggingImpactData: any[] = [];
      
      // Calculate averages for each logging status
      configsByLogging.forEach((configs, status) => {
        if (configs.length > 0) {
          // Calculate average bandwidth
          const bandwidthValues = configs
            .map(c => bandwidthComparison.find(m => m.configuration === c.configuration)?.avgBandwidthMbps || 0);
          const avgBandwidth = bandwidthValues.length > 0 
            ? (bandwidthValues.reduce((sum, val) => sum + val, 0) / bandwidthValues.length).toFixed(2)
            : 'N/A';
          
          // Calculate average latency
          const latencyValues = configs
            .map(c => latencyAnalysis.find(m => m.configuration === c.configuration)?.avgLatencyMs || 0);
          const avgLatency = latencyValues.length > 0
            ? (latencyValues.reduce((sum, val) => sum + val, 0) / latencyValues.length).toFixed(2)
            : 'N/A';
          
          // Calculate average DNS response time
          const dnsResponseValues = configs
            .map(c => performanceMetrics.find(m => m.configuration === c.configuration)?.avgResponseTimeMs || 0);
          const avgDnsResponse = dnsResponseValues.length > 0
            ? (dnsResponseValues.reduce((sum, val) => sum + val, 0) / dnsResponseValues.length).toFixed(2)
            : 'N/A';
          
          // Calculate average packet loss
          const packetLossValues = configs
            .map(c => {
              const reliabilityMetric = reliabilityMetrics.find(m => m.configuration === c.configuration);
              return reliabilityMetric ? reliabilityMetric.packetLossRate * 100 : 0;
            });
          const avgPacketLoss = packetLossValues.length > 0
            ? (packetLossValues.reduce((sum, val) => sum + val, 0) / packetLossValues.length).toFixed(2)
            : 'N/A';
          
          // Calculate average overall score
          const scoreValues = configs.map(c => c.overallScore);
          const avgScore = scoreValues.length > 0
            ? (scoreValues.reduce((sum, val) => sum + val, 0) / scoreValues.length).toFixed(2)
            : 'N/A';
          
          loggingImpactData.push({
            status,
            avgBandwidth,
            avgLatency,
            dnsResponse: avgDnsResponse,
            packetLoss: avgPacketLoss,
            overallScore: avgScore
          });
        }
      });
      
      return loggingImpactData;
    }
    
    private prepareAnomalyDistributionData(anomalies: PerformanceAnomaly[]): any[] {
      // Group anomalies by configuration and type
      const anomalyMap = new Map<string, Map<string, { count: number, severities: string[] }>>();
      
      anomalies.forEach(anomaly => {
        const configName = this.getConfigurationDisplayName(anomaly.configuration);
        
        if (!anomalyMap.has(configName)) {
          anomalyMap.set(configName, new Map());
        }
        
        const configAnomalies = anomalyMap.get(configName);
        if (configAnomalies) {
          if (!configAnomalies.has(anomaly.type)) {
            configAnomalies.set(anomaly.type, { count: 0, severities: [] });
          }
          
          const typeAnomalies = configAnomalies.get(anomaly.type);
          if (typeAnomalies) {
            typeAnomalies.count++;
            typeAnomalies.severities.push(anomaly.severity);
          }
        }
      });
      
      const anomalyDistribution: any[] = [];
      
      // Format anomaly distribution data
      anomalyMap.forEach((configAnomalies, configuration) => {
        // Format anomaly counts with severity
        const formatAnomalies = (type: string) => {
          if (!configAnomalies.has(type)) return '0';
          
          const anomalyData = configAnomalies.get(type);
          if (!anomalyData) return '0';
          
          const { count, severities } = anomalyData;
          const severityCounts = {
            high: severities.filter(s => s === 'high').length,
            medium: severities.filter(s => s === 'medium').length,
            low: severities.filter(s => s === 'low').length
          };
          
          const parts = [];
          if (severityCounts.high > 0) parts.push(`${severityCounts.high} (high)`);
          if (severityCounts.medium > 0) parts.push(`${severityCounts.medium} (medium)`);
          if (severityCounts.low > 0) parts.push(`${severityCounts.low} (low)`);
          
          return parts.join(', ');
        };
        
        const bandwidthAnomalies = formatAnomalies('bandwidth');
        const latencyAnomalies = formatAnomalies('latency');
        const packetLossAnomalies = formatAnomalies('packet_loss');
        const dnsAnomalies = formatAnomalies('dns_failure');
        
        // Calculate total anomalies
        const totalAnomalies = Array.from(configAnomalies.values())
          .reduce((sum, anomalyData) => sum + anomalyData.count, 0);
        
        anomalyDistribution.push({
          configuration: this.getConfigurationDisplayName(configuration),
          bandwidthAnomalies,
          latencyAnomalies,
          packetLossAnomalies,
          dnsAnomalies,
          total: totalAnomalies
        });
      });
      
      return anomalyDistribution;
    }
    
    async generateReport(analysis: AnalysisResults): Promise<string> {
      try {
        // Execute reporter plugins
        const pluginResults = await pluginManager.executePlugins("reporter", {
          datasets: [], // We don't have the original datasets here
          analysisResults: analysis,
        });
        
        // Log dataset display names for debugging
        if (this.datasetDisplayNames.size > 0) {
          console.log('[DEBUG] Using dataset display names:', 
            Array.from(this.datasetDisplayNames.entries())
              .map(([name, displayName]) => `${name} -> ${displayName}`)
              .join(', ')
          );
        }

        // Prepare data for the comparison tables
        const mtuImpactData = this.prepareMtuImpactData(analysis);
        const dnsServerData = this.prepareDnsServerData(analysis);
        const loggingImpactData = this.prepareLoggingImpactData(analysis);
        const anomalyDistribution = this.prepareAnomalyDistributionData(analysis.anomalies);
        
        // Prepare DNS metrics with slow domains count
        const dnsMetricsWithSlowDomains = analysis.dnsAnalysis.performanceMetrics.map(metric => {
          const slowDomains = metric.slowestDomains ? 
            metric.slowestDomains.filter(d => d.avgResponseTimeMs > 150) : [];
          return {
            ...metric,
            displayName: this.getConfigurationDisplayName(metric.configuration),
            slowDomainsCount: slowDomains.length,
            successRate: (metric.successRate * 100).toFixed(1)
          };
        });
        
        // Merge plugin results with analysis results and flatten summary data for template
        const reportData = {
          ...analysis,
          // Flatten summary properties to top level for template compatibility
          ...analysis.summary,
          date: new Date().toISOString().split('T')[0],
          timestamp: new Date().toISOString(),
          datasetCount: analysis.summary.totalDatasets,
          configurations: analysis.configurationComparison.overallRanking,
          bandwidthMetrics: analysis.iperfAnalysis.bandwidthComparison,
          latencyMetrics: analysis.iperfAnalysis.latencyAnalysis,
          dnsMetrics: dnsMetricsWithSlowDomains,
          slowestDomains: analysis.dnsAnalysis.domainRankings?.slice(0, 10) || [],
          mtuImpactData,
          dnsServerData,
          loggingImpactData,
          anomalyDistribution,
          ...pluginResults.reduce((acc, result) => ({ ...acc, ...result }), {}),
        };
        
        // Replace dataset names with display names in key findings and performance highlights
        if (this.datasetDisplayNames.size > 0) {
          // Update key findings
          if (reportData.keyFindings && Array.isArray(reportData.keyFindings)) {
            reportData.keyFindings = reportData.keyFindings.map((finding: string) => {
              let updatedFinding = finding;
              this.datasetDisplayNames.forEach((displayName, name) => {
                updatedFinding = updatedFinding.replace(name, displayName);
              });
              return updatedFinding;
            });
          }
          
          // Update performance highlights
          if (reportData.performanceHighlights && Array.isArray(reportData.performanceHighlights)) {
            reportData.performanceHighlights = reportData.performanceHighlights.map((highlight: string) => {
              let updatedHighlight = highlight;
              this.datasetDisplayNames.forEach((displayName, name) => {
                updatedHighlight = updatedHighlight.replace(name, displayName);
              });
              return updatedHighlight;
            });
          }
          
          // Update optimal configuration
          if (reportData.optimalConfiguration) {
            reportData.optimalConfiguration = this.datasetDisplayNames.get(reportData.optimalConfiguration) || 
                                             reportData.optimalConfiguration;
          }
          
          // Update configurations
          if (reportData.configurations && Array.isArray(reportData.configurations)) {
            reportData.configurations = reportData.configurations.map((config: { configuration: string; [key: string]: any }) => ({
              ...config,
              displayName: this.datasetDisplayNames.get(config.configuration) || config.configuration
            }));
          }
          
          // Add displayName to anomalies
          if (reportData.anomalies && Array.isArray(reportData.anomalies)) {
            reportData.anomalies = reportData.anomalies.map((anomaly: { configuration: string; [key: string]: any }) => ({
              ...anomaly,
              displayName: this.datasetDisplayNames.get(anomaly.configuration) || anomaly.configuration
            }));
          }
        }

        // Use template manager to generate report
        const template = templateManager.getActiveTemplate();
        console.log('[DEBUG] Report data being passed to template:', JSON.stringify({
          optimalConfiguration: reportData.optimalConfiguration,
          totalDatasets: reportData.totalDatasets,
          keyFindings: reportData.keyFindings,
          performanceHighlights: reportData.performanceHighlights
        }, null, 2));
        return templateManager.applyTemplate(template, reportData);
      } catch (error) {
        console.error("Error generating report with plugins:", error);
        // Fall back to default report generation
        return super.generateReport(analysis);
      }
    }
  })();

  const errorHandler = new DefaultErrorHandler();

  // Create analyzer with configured services
  const analyzer = new NetworkPerformanceAnalyzer(
    discoveryService,
    dataParser,
    analysisEngine,
    reportGenerator,
    errorHandler,
    analyzerConfig
  );

  // Discover and load plugins
  (async () => {
    try {
      await pluginManager.discoverPlugins();
      await pluginManager.loadEnabledPlugins();

      const enabledPlugins = pluginManager.getEnabledPlugins();
      if (enabledPlugins.length > 0 && analyzerConfig.logProgress) {
        console.log(
          `Loaded ${enabledPlugins.length} plugins: ${enabledPlugins
            .map((p) => p.name)
            .join(", ")}`
        );
      }
    } catch (error) {
      console.error("Error loading plugins:", error);
    }
  })();

  return analyzer;
}
