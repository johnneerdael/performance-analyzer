#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
// Network Performance Analyzer - Command Line Interface
const commander_1 = require("commander");
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const NetworkPerformanceAnalyzer_1 = require("./services/NetworkPerformanceAnalyzer");
/**
 * Progress indicator for CLI
 */
class ProgressIndicator {
    constructor() {
        this.spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        this.currentIndex = 0;
        this.intervalId = null;
        this.message = '';
        this.isActive = false;
    }
    /**
     * Start the progress indicator with a message
     * @param message The message to display
     */
    start(message) {
        this.message = message;
        this.isActive = true;
        if (process.stdout.isTTY) {
            this.intervalId = setInterval(() => {
                process.stdout.clearLine(0);
                process.stdout.cursorTo(0);
                process.stdout.write(`${this.spinner[this.currentIndex]} ${this.message}`);
                this.currentIndex = (this.currentIndex + 1) % this.spinner.length;
            }, 100);
        }
        else {
            console.log(`${this.message}...`);
        }
    }
    /**
     * Update the progress message
     * @param message The new message to display
     */
    update(message) {
        this.message = message;
        if (!process.stdout.isTTY && this.isActive) {
            console.log(`${this.message}...`);
        }
    }
    /**
     * Stop the progress indicator and display a completion message
     * @param message The completion message to display
     */
    stop(message) {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        if (process.stdout.isTTY) {
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
        }
        if (message) {
            console.log(message);
        }
        this.isActive = false;
    }
}
/**
 * Custom logger for CLI output
 */
class CliLogger {
    /**
     * Create a new CLI logger
     * @param isVerbose Whether to enable verbose logging
     */
    constructor(isVerbose = false) {
        this.isVerbose = isVerbose;
        this.progress = new ProgressIndicator();
    }
    /**
     * Log an informational message
     * @param message The message to log
     */
    info(message) {
        console.log(`[INFO] ${message}`);
    }
    /**
     * Log a verbose message (only if verbose mode is enabled)
     * @param message The message to log
     */
    logVerbose(message) {
        if (this.isVerbose) {
            console.log(`[VERBOSE] ${message}`);
        }
    }
    /**
     * Log an error message
     * @param message The error message to log
     * @param error Optional error object
     */
    error(message, error) {
        console.error(`[ERROR] ${message}`);
        if (error && this.isVerbose) {
            if (error instanceof Error) {
                console.error(error.stack);
            }
            else {
                console.error(String(error));
            }
        }
    }
    /**
     * Log a warning message
     * @param message The warning message to log
     */
    warn(message) {
        console.warn(`[WARNING] ${message}`);
    }
    /**
     * Log a success message
     * @param message The success message to log
     */
    success(message) {
        console.log(`[SUCCESS] ${message}`);
    }
    /**
     * Start a progress indicator
     * @param message The progress message to display
     */
    startProgress(message) {
        this.progress.start(message);
    }
    /**
     * Update the progress indicator message
     * @param message The new progress message to display
     */
    updateProgress(message) {
        this.progress.update(message);
    }
    /**
     * Stop the progress indicator
     * @param message Optional completion message to display
     */
    stopProgress(message) {
        this.progress.stop(message);
    }
}
/**
 * Parse anomaly thresholds from a JSON string
 * @param thresholdsStr JSON string containing anomaly thresholds
 * @returns Parsed anomaly thresholds object
 */
function parseAnomalyThresholds(thresholdsStr) {
    try {
        return JSON.parse(thresholdsStr);
    }
    catch (error) {
        throw new Error(`Invalid anomaly thresholds format: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Validate input directory exists and contains dataset directories
 * @param inputDir Path to input directory
 * @returns True if valid, throws error otherwise
 */
async function validateInputDirectory(inputDir) {
    try {
        const stats = await fs_extra_1.default.stat(inputDir);
        if (!stats.isDirectory()) {
            throw new Error(`Input path is not a directory: ${inputDir}`);
        }
        const contents = await fs_extra_1.default.readdir(inputDir);
        // Check if there are any potential dataset directories
        const potentialDatasets = contents.filter(item => item.startsWith('coredns-mtu') || item.startsWith('stock-mtu'));
        if (potentialDatasets.length === 0) {
            throw new Error(`No potential dataset directories found in: ${inputDir}`);
        }
        return true;
    }
    catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            throw new Error(`Input directory does not exist: ${inputDir}`);
        }
        throw error;
    }
}
/**
 * Run the CLI application
 * @param args Command line arguments
 * @returns Promise that resolves when the application completes
 */
async function run(args = process.argv) {
    const program = new commander_1.Command();
    program
        .name('network-performance-analyzer')
        .description('Analyze network performance test datasets and generate comparative reports')
        .version('1.0.0')
        .argument('<input-dir>', 'Directory containing network performance test datasets')
        .option('-o, --output <file>', 'Output file path for the generated report (default: network-analysis-report.md)')
        .option('-v, --verbose', 'Enable verbose logging', false)
        .option('-c, --continue-on-error', 'Continue analysis when individual datasets fail', true)
        .option('-t, --anomaly-thresholds <json>', 'Custom thresholds for anomaly detection as JSON string')
        .option('-p, --parallel <number>', 'Maximum number of parallel tasks to run', '4')
        .option('-m, --monitor', 'Enable performance monitoring', false)
        .option('-e, --environment <env>', 'Environment to use for configuration (development, production, testing)')
        .option('-C, --config <file>', 'Path to configuration file')
        .option('-P, --plugins <dirs>', 'Comma-separated list of plugin directories')
        .option('-T, --template <id>', 'Report template ID to use')
        .option('-S, --sections <list>', 'Comma-separated list of report sections to include')
        .addHelpText('after', `
Examples:
  $ network-performance-analyzer ./test-datasets
  $ network-performance-analyzer ./test-datasets -o ./reports/analysis.md
  $ network-performance-analyzer ./test-datasets -v -c
  $ network-performance-analyzer ./test-datasets -t '{"bandwidthVariation":0.2,"latencyVariation":0.3}'
  $ network-performance-analyzer ./test-datasets -C ./config.json -e production
  $ network-performance-analyzer ./test-datasets -P ./plugins,./custom-plugins
  $ network-performance-analyzer ./test-datasets -T custom -S executive-summary,configuration-overview,recommendations
    `)
        .parse(args);
    const inputDir = program.args[0];
    const options = program.opts();
    // Create logger
    const logger = new CliLogger(options.verbose);
    try {
        // Validate input directory
        if (inputDir) {
            logger.startProgress(`Validating input directory: ${inputDir}`);
            await validateInputDirectory(inputDir);
            logger.stopProgress(`Input directory validated: ${inputDir}`);
        }
        else {
            logger.error('No input directory specified');
            program.help();
            return;
        }
        // Parse anomaly thresholds if provided
        let anomalyThresholds;
        if (options.anomalyThresholds) {
            try {
                anomalyThresholds = parseAnomalyThresholds(options.anomalyThresholds);
                logger.logVerbose(`Using custom anomaly thresholds: ${JSON.stringify(anomalyThresholds)}`);
            }
            catch (error) {
                if (error instanceof Error) {
                    logger.error(error.message);
                }
                else {
                    logger.error(String(error));
                }
                process.exit(1);
            }
        }
        // Determine output file path
        const outputPath = options.output || path_1.default.join(process.cwd(), 'network-analysis-report.md');
        logger.logVerbose(`Report will be saved to: ${outputPath}`);
        // Configure analyzer
        const config = {
            continueOnError: options.continueOnError,
            logProgress: options.verbose,
            reportOutputPath: outputPath,
            anomalyThresholds,
            maxParallelTasks: options.parallel ? parseInt(options.parallel, 10) : undefined,
            enablePerformanceMonitoring: options.monitor,
            environment: options.environment,
            configPath: options.config,
            pluginDirectories: options.plugins ? options.plugins.split(',') : undefined,
            reportTemplateId: options.template,
            includeSections: options.sections ? options.sections.split(',') : undefined
        };
        // Create analyzer
        const analyzer = (0, NetworkPerformanceAnalyzer_1.createNetworkPerformanceAnalyzer)(config);
        // Run analysis
        logger.info(`Starting network performance analysis on ${inputDir}`);
        logger.startProgress('Analyzing network performance data');
        const report = await analyzer.analyze(inputDir);
        logger.stopProgress('Analysis completed successfully');
        logger.success(`Report generated and saved to: ${outputPath}`);
        // Print report summary
        if (options.verbose) {
            const reportLines = report.split('\n');
            const summaryLines = reportLines.slice(0, Math.min(20, reportLines.length));
            logger.logVerbose('Report summary:');
            console.log(summaryLines.join('\n') + (reportLines.length > 20 ? '\n...' : ''));
        }
    }
    catch (error) {
        logger.stopProgress();
        if (error instanceof Error) {
            logger.error('Analysis failed', error);
            console.error(`Error: ${error.message}`);
        }
        else {
            logger.error('Analysis failed with unknown error');
            console.error(`Error: ${String(error)}`);
        }
        process.exit(1);
    }
}
// Run the CLI if this file is executed directly
if (require.main === module) {
    run().catch(error => {
        console.error('Unhandled error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    });
}
//# sourceMappingURL=cli.js.map