"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultDatasetDiscoveryService = void 0;
const ErrorHandler_1 = require("../utils/ErrorHandler");
const DataValidator_1 = require("../utils/DataValidator");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
/**
 * Default implementation of the DatasetDiscoveryService interface
 * Discovers and validates network performance test datasets in the filesystem
 */
class DefaultDatasetDiscoveryService {
    /**
     * Creates a new instance of DefaultDatasetDiscoveryService
     * @param errorHandler Optional custom error handler
     */
    constructor(errorHandler) {
        this.errorHandler = errorHandler || new ErrorHandler_1.DefaultErrorHandler();
        this.validator = new DataValidator_1.DataValidator(this.errorHandler);
    }
    /**
     * Discover all datasets in the given root path
     * @param rootPath The root directory to search for datasets
     * @returns A promise that resolves to an array of discovered datasets
     */
    async discoverDatasets(rootPath) {
        try {
            // Check if the root path exists
            if (!await this.pathExists(rootPath)) {
                const error = new Error(`Root path does not exist: ${rootPath}`);
                error.code = 'ENOENT';
                error.path = rootPath;
                this.errorHandler.handleFileSystemError(error);
                return [];
            }
            // Get all entries in the root path
            const entries = await this.readDirectory(rootPath);
            if (!entries)
                return [];
            // Check if we have a flat structure (files directly in root) or subdirectory structure
            const files = entries.filter(entry => entry.isFile());
            const hasParameterFiles = files.some(file => file.name.startsWith('parameters-results_'));
            const hasResultFiles = files.some(file => file.name.startsWith('results_'));
            if (hasParameterFiles || hasResultFiles) {
                // Flat structure - process files directly in root directory
                return await this.discoverFlatDatasets(rootPath, files);
            }
            else {
                // Subdirectory structure - process subdirectories
                return await this.discoverSubdirectoryDatasets(rootPath, entries);
            }
        }
        catch (error) {
            const fsError = error instanceof Error ? error : new Error(String(error));
            fsError.path = rootPath;
            fsError.code = error.code || 'UNKNOWN';
            this.errorHandler.handleFileSystemError(fsError);
            return [];
        }
    }
    /**
     * Discover datasets from a flat file structure
     * @param rootPath The root directory containing the files
     * @param files Array of file entries
     * @returns A promise that resolves to an array of discovered datasets
     */
    async discoverFlatDatasets(rootPath, files) {
        const datasets = [];
        // Group files by timestamp to create datasets
        const fileGroups = new Map();
        for (const file of files) {
            if (file.name.startsWith('parameters-results_')) {
                const timestamp = this.extractTimestampFromFileName(file.name);
                if (timestamp) {
                    if (!fileGroups.has(timestamp)) {
                        fileGroups.set(timestamp, {});
                    }
                    fileGroups.get(timestamp).parametersFile = file.name;
                }
            }
            else if (file.name.startsWith('results_')) {
                const timestamp = this.extractTimestampFromFileName(file.name);
                if (timestamp) {
                    if (!fileGroups.has(timestamp)) {
                        fileGroups.set(timestamp, {});
                    }
                    fileGroups.get(timestamp).resultsFile = file.name;
                }
            }
        }
        // Create datasets from file groups
        for (const [timestamp, fileGroup] of fileGroups.entries()) {
            if (!fileGroup.resultsFile) {
                console.debug(`[DEBUG] Skipping dataset ${timestamp} - no results file found`);
                continue;
            }
            try {
                // Extract configuration from parameter file if available, otherwise use defaults
                let configInfo = { mtu: 1500, awsLogging: false, backendServer: 'unknown' };
                if (fileGroup.parametersFile) {
                    const parametersPath = path_1.default.join(rootPath, fileGroup.parametersFile);
                    try {
                        const parametersData = JSON.parse(await fs_extra_1.default.readFile(parametersPath, 'utf-8'));
                        configInfo = this.extractConfigurationFromParameters(parametersData);
                    }
                    catch (error) {
                        console.warn(`[WARN] Could not parse parameters file ${fileGroup.parametersFile}, using defaults`);
                    }
                }
                // Generate a descriptive configuration name
                const descriptiveName = this.generateDescriptiveConfigName(configInfo);
                // Create dataset object
                const dataset = {
                    name: descriptiveName, // Use descriptive name here instead of dataset-timestamp
                    displayName: descriptiveName,
                    parametersFile: fileGroup.parametersFile ? path_1.default.join(rootPath, fileGroup.parametersFile) : '',
                    resultsFile: path_1.default.join(rootPath, fileGroup.resultsFile),
                    configuration: {
                        mtu: configInfo.mtu,
                        awsLogging: configInfo.awsLogging,
                        backendServer: configInfo.backendServer,
                        testDate: this.extractDateFromFileName(fileGroup.resultsFile)
                    }
                };
                // Check file existence
                const hasParametersFile = dataset.parametersFile && await this.pathExists(dataset.parametersFile);
                const hasResultsFile = dataset.resultsFile && await this.pathExists(dataset.resultsFile);
                if (hasResultsFile) {
                    datasets.push(dataset);
                }
            }
            catch (error) {
                console.warn(`[WARN] Error processing dataset ${timestamp}:`, error);
            }
        }
        return datasets;
    }
    /**
     * Discover datasets from subdirectory structure (legacy support)
     * @param rootPath The root directory containing subdirectories
     * @param entries Array of directory entries
     * @returns A promise that resolves to an array of discovered datasets
     */
    async discoverSubdirectoryDatasets(rootPath, entries) {
        const datasets = [];
        const directories = entries
            .filter(entry => entry.isDirectory())
            .map(dir => dir.name);
        // Filter directories that match the pattern coredns-mtu*-logging_* or stock-mtu*-logging_*
        const datasetDirs = directories.filter(dir => /^(coredns|stock)-mtu\d+-logging_(enabled|disabled)$/.test(dir));
        // Process each dataset directory
        for (const dirName of datasetDirs) {
            try {
                const dirPath = path_1.default.join(rootPath, dirName);
                const dirEntries = await this.readDirectory(dirPath);
                if (!dirEntries)
                    continue;
                // Look for parameters and results files
                const parametersFile = dirEntries.find(file => file.name.startsWith('parameters-results_'));
                const resultsFile = dirEntries.find(file => file.name.startsWith('results_'));
                if (!parametersFile && !resultsFile) {
                    console.debug(`[DEBUG] No parameter or result files found in directory: ${dirPath}`);
                    continue;
                }
                // Extract configuration from directory name
                const configInfo = this.extractConfigurationFromDirName(dirName);
                // Generate a descriptive configuration name
                const descriptiveName = this.generateDescriptiveConfigName(configInfo);
                // Create dataset object
                const dataset = {
                    name: dirName,
                    displayName: descriptiveName,
                    parametersFile: parametersFile ? path_1.default.join(dirPath, parametersFile.name) : '',
                    resultsFile: resultsFile ? path_1.default.join(dirPath, resultsFile.name) : '',
                    configuration: {
                        mtu: configInfo.mtu,
                        awsLogging: configInfo.awsLogging,
                        backendServer: configInfo.backendServer,
                        testDate: this.extractDateFromFileName(parametersFile?.name || resultsFile?.name || '')
                    }
                };
                // Check file existence
                const hasResultsFile = dataset.resultsFile && await this.pathExists(dataset.resultsFile);
                if (hasResultsFile) {
                    datasets.push(dataset);
                }
                else {
                    console.debug(`[DEBUG] Skipping dataset ${dirName} - no results file found`);
                }
            }
            catch (error) {
                console.warn(`[WARN] Error processing dataset directory ${dirName}:`, error);
            }
        }
        return datasets;
    }
    /**
     * Validate that a dataset has all required files and information
     * @param dataset The dataset to validate
     * @returns True if the dataset is complete, false otherwise
     */
    validateDatasetCompleteness(dataset) {
        try {
            // Use the validator to validate the dataset
            const validationResult = this.validator.validateDataset(dataset);
            if (!validationResult.isValid) {
                return false;
            }
            // Check if either parameters file or results file exists
            const hasParametersFile = !!(dataset.parametersFile && fs_extra_1.default.existsSync(dataset.parametersFile));
            const hasResultsFile = !!(dataset.resultsFile && fs_extra_1.default.existsSync(dataset.resultsFile));
            // At least one file must exist
            return hasParametersFile || hasResultsFile;
        }
        catch (error) {
            // Log the error but don't throw
            this.errorHandler.logError(error instanceof Error ? error : new Error(String(error)), `Error validating dataset completeness: ${dataset.name}`);
            return false;
        }
    }
    /**
     * Check if a path exists with error handling
     * @param filePath Path to check
     * @returns True if the path exists, false otherwise
     */
    async pathExists(filePath) {
        try {
            return await fs_extra_1.default.pathExists(filePath);
        }
        catch (error) {
            const fsError = error instanceof Error ? error : new Error(String(error));
            fsError.path = filePath;
            fsError.code = error.code || 'UNKNOWN';
            this.errorHandler.handleFileSystemError(fsError);
            return false;
        }
    }
    /**
     * Read a directory with error handling
     * @param dirPath Path to the directory
     * @returns Array of directory entries or null if an error occurred
     */
    async readDirectory(dirPath) {
        try {
            return await fs_extra_1.default.readdir(dirPath, { withFileTypes: true });
        }
        catch (error) {
            const fsError = error instanceof Error ? error : new Error(String(error));
            fsError.path = dirPath;
            fsError.code = error.code || 'UNKNOWN';
            this.errorHandler.handleFileSystemError(fsError);
            return null;
        }
    }
    /**
     * Extract configuration information from directory name
     * @param dirName The directory name to parse
     * @returns Configuration information extracted from the directory name
     */
    extractConfigurationFromDirName(dirName) {
        // Parse directory name like "coredns-mtu1500-logging_enabled"
        const mtuMatch = dirName.match(/mtu(\d+)/);
        const loggingMatch = dirName.match(/logging_(enabled|disabled)/);
        const serverMatch = dirName.match(/^(coredns|stock)/);
        return {
            mtu: mtuMatch && mtuMatch[1] ? parseInt(mtuMatch[1], 10) : 0,
            awsLogging: loggingMatch ? loggingMatch[1] === 'enabled' : false,
            backendServer: serverMatch && serverMatch[1] ? serverMatch[1] : 'unknown'
        };
    }
    /**
     * Extract timestamp from file name for grouping
     * @param fileName The file name to parse
     * @returns Timestamp string extracted from the file name
     */
    extractTimestampFromFileName(fileName) {
        // Parse timestamp from file name like "parameters-results_20250717_151520.json"
        const timestampMatch = path_1.default.basename(fileName).match(/(\d{8}_\d{6})/);
        return timestampMatch && timestampMatch[1] ? timestampMatch[1] : null;
    }
    /**
     * Extract configuration from parameters data
     * @param parametersData The parsed parameters JSON data
     * @returns Configuration information extracted from the parameters
     */
    extractConfigurationFromParameters(parametersData) {
        return {
            mtu: parametersData.mtu || parametersData.MTU || 1500,
            awsLogging: parametersData['query-logging'] === 'enabled' || parametersData.queryLogging === 'enabled' || parametersData.aws_logging === true || false,
            backendServer: parametersData['backend-server'] || parametersData.backendServer || parametersData.backend_server || parametersData.server || 'unknown'
        };
    }
    /**
     * Generate a descriptive configuration name from configuration parameters
     * @param config Configuration parameters
     * @returns A descriptive configuration name
     */
    generateDescriptiveConfigName(config) {
        const loggingStatus = config.awsLogging ? 'enabled' : 'disabled';
        return `${config.backendServer}-mtu${config.mtu}-logging_${loggingStatus}`;
    }
    /**
     * Extract date from file name
     * @param fileName The file name to parse
     * @returns Date string extracted from the file name
     */
    extractDateFromFileName(fileName) {
        // Parse date from file name like "parameters-results_20250717_151520.json"
        const dateMatch = path_1.default.basename(fileName).match(/(\d{8}_\d{6})/);
        if (dateMatch && dateMatch[1]) {
            const dateStr = dateMatch[1];
            // Format: YYYYMMDD_HHMMSS
            try {
                const year = dateStr.substring(0, 4);
                const month = dateStr.substring(4, 6);
                const day = dateStr.substring(6, 8);
                const hour = dateStr.substring(9, 11);
                const minute = dateStr.substring(11, 13);
                const second = dateStr.substring(13, 15);
                return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
            }
            catch (error) {
                console.warn(`Failed to parse date from ${dateStr}: ${error}`);
            }
        }
        return new Date().toISOString();
    }
}
exports.DefaultDatasetDiscoveryService = DefaultDatasetDiscoveryService;
//# sourceMappingURL=DatasetDiscoveryService.js.map