import { DatasetDiscoveryService, Dataset } from '../models';
import { DefaultErrorHandler } from '../utils/ErrorHandler';
/**
 * Default implementation of the DatasetDiscoveryService interface
 * Discovers and validates network performance test datasets in the filesystem
 */
export declare class DefaultDatasetDiscoveryService implements DatasetDiscoveryService {
    private errorHandler;
    private validator;
    /**
     * Creates a new instance of DefaultDatasetDiscoveryService
     * @param errorHandler Optional custom error handler
     */
    constructor(errorHandler?: DefaultErrorHandler);
    /**
     * Discover all datasets in the given root path
     * @param rootPath The root directory to search for datasets
     * @returns A promise that resolves to an array of discovered datasets
     */
    discoverDatasets(rootPath: string): Promise<Dataset[]>;
    /**
     * Validate that a dataset has all required files and information
     * @param dataset The dataset to validate
     * @returns True if the dataset is complete, false otherwise
     */
    validateDatasetCompleteness(dataset: Dataset): boolean;
    /**
     * Check if a path exists with error handling
     * @param filePath Path to check
     * @returns True if the path exists, false otherwise
     */
    private pathExists;
    /**
     * Read a directory with error handling
     * @param dirPath Path to the directory
     * @returns Array of directory entries or null if an error occurred
     */
    private readDirectory;
    /**
     * Extract configuration information from directory name
     * @param dirName The directory name to parse
     * @returns Configuration information extracted from the directory name
     */
    private extractConfigurationFromDirName;
    /**
     * Extract date from file name
     * @param fileName The file name to parse
     * @returns Date string extracted from the file name
     */
    private extractDateFromFileName;
}
export { DatasetDiscoveryService };
//# sourceMappingURL=DatasetDiscoveryService.d.ts.map