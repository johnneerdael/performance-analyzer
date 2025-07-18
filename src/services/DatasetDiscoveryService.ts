// Dataset Discovery Service Implementation
import { DatasetDiscoveryService, Dataset, FileSystemError } from '../models';
import { DefaultErrorHandler } from '../utils/ErrorHandler';
import { DataValidator } from '../utils/DataValidator';
import fs from 'fs-extra';
import path from 'path';

/**
 * Default implementation of the DatasetDiscoveryService interface
 * Discovers and validates network performance test datasets in the filesystem
 */
export class DefaultDatasetDiscoveryService implements DatasetDiscoveryService {
  private errorHandler: DefaultErrorHandler;
  private validator: DataValidator;
  
  /**
   * Creates a new instance of DefaultDatasetDiscoveryService
   * @param errorHandler Optional custom error handler
   */
  constructor(errorHandler?: DefaultErrorHandler) {
    this.errorHandler = errorHandler || new DefaultErrorHandler();
    this.validator = new DataValidator(this.errorHandler);
  }
  
  /**
   * Discover all datasets in the given root path
   * @param rootPath The root directory to search for datasets
   * @returns A promise that resolves to an array of discovered datasets
   */
  async discoverDatasets(rootPath: string): Promise<Dataset[]> {
    try {
      // Check if the root path exists
      if (!await this.pathExists(rootPath)) {
        const error = new Error(`Root path does not exist: ${rootPath}`) as FileSystemError;
        error.code = 'ENOENT';
        error.path = rootPath;
        this.errorHandler.handleFileSystemError(error);
        return [];
      }
      
      // Get all directories in the root path
      const entries = await this.readDirectory(rootPath);
      if (!entries) return [];
      
      const directories = entries
        .filter(entry => entry.isDirectory())
        .map(dir => dir.name);
      
      // Filter directories that match the pattern coredns-mtu*-aws-logs_* or stock-mtu*-aws-logs_*
      const datasetDirs = directories.filter(dir => 
        /^(coredns|stock)-mtu\d+-aws-logs_(enabled|disabled)$/.test(dir)
      );
      
      // Process each dataset directory
      const datasets: Dataset[] = [];
      
      for (const dirName of datasetDirs) {
        try {
          const dirPath = path.join(rootPath, dirName);
          const dirEntries = await this.readDirectory(dirPath);
          if (!dirEntries) continue;
          
          // Look for parameters and results files
          const parametersFile = dirEntries.find(file => file.name.startsWith('parameters-results_'));
          const resultsFile = dirEntries.find(file => file.name.startsWith('results_'));
          
          if (!parametersFile && !resultsFile) {
            const error = new Error(`No parameter or result files found in directory: ${dirPath}`) as FileSystemError;
            error.code = 'ENOENT';
            error.path = dirPath;
            this.errorHandler.handleFileSystemError(error);
            continue;
          }
          
          // Extract configuration from directory name
          const configInfo = this.extractConfigurationFromDirName(dirName);
          
          // Create dataset object
          const dataset: Dataset = {
            name: dirName,
            parametersFile: parametersFile ? path.join(dirPath, parametersFile.name) : '',
            resultsFile: resultsFile ? path.join(dirPath, resultsFile.name) : '',
            configuration: {
              mtu: configInfo.mtu,
              awsLogging: configInfo.awsLogging,
              backendServer: configInfo.backendServer,
              testDate: this.extractDateFromFileName(parametersFile?.name || resultsFile?.name || '')
            }
          };
          
          // Validate dataset using the validator
          const validationResult = this.validator.validateDataset(dataset);
          
          if (validationResult.isValid) {
            // Check file existence
            const hasParametersFile = dataset.parametersFile && await this.pathExists(dataset.parametersFile);
            const hasResultsFile = dataset.resultsFile && await this.pathExists(dataset.resultsFile);
            
            if (hasParametersFile || hasResultsFile) {
              datasets.push(dataset);
            } else {
              const error = new Error(`Dataset files do not exist: ${dirPath}`) as FileSystemError;
              error.code = 'ENOENT';
              error.path = dirPath;
              this.errorHandler.handleFileSystemError(error);
            }
          } else {
            // Log validation errors
            const errorMessage = `Invalid dataset in ${dirPath}: ${validationResult.errors
              .filter(e => e.severity === 'error')
              .map(e => `${e.field} - ${e.message}`)
              .join(', ')}`;
            
            const error = new Error(errorMessage) as FileSystemError;
            error.code = 'EINVAL';
            error.path = dirPath;
            this.errorHandler.handleFileSystemError(error);
          }
        } catch (error) {
          const fsError = error instanceof Error ? error : new Error(String(error));
          (fsError as FileSystemError).path = path.join(rootPath, dirName);
          (fsError as FileSystemError).code = (error as any).code || 'UNKNOWN';
          this.errorHandler.handleFileSystemError(fsError as FileSystemError);
        }
      }
      
      return datasets;
    } catch (error) {
      const fsError = error instanceof Error ? error : new Error(String(error));
      (fsError as FileSystemError).path = rootPath;
      (fsError as FileSystemError).code = (error as any).code || 'UNKNOWN';
      this.errorHandler.handleFileSystemError(fsError as FileSystemError);
      return [];
    }
  }

  /**
   * Validate that a dataset has all required files and information
   * @param dataset The dataset to validate
   * @returns True if the dataset is complete, false otherwise
   */
  validateDatasetCompleteness(dataset: Dataset): boolean {
    try {
      // Use the validator to validate the dataset
      const validationResult = this.validator.validateDataset(dataset);
      
      if (!validationResult.isValid) {
        return false;
      }
      
      // Check if either parameters file or results file exists
      const hasParametersFile = !!(dataset.parametersFile && fs.existsSync(dataset.parametersFile));
      const hasResultsFile = !!(dataset.resultsFile && fs.existsSync(dataset.resultsFile));
      
      // At least one file must exist
      return hasParametersFile || hasResultsFile;
    } catch (error) {
      // Log the error but don't throw
      this.errorHandler.logError(
        error instanceof Error ? error : new Error(String(error)),
        `Error validating dataset completeness: ${dataset.name}`
      );
      return false;
    }
  }
  
  /**
   * Check if a path exists with error handling
   * @param filePath Path to check
   * @returns True if the path exists, false otherwise
   */
  private async pathExists(filePath: string): Promise<boolean> {
    try {
      return await fs.pathExists(filePath);
    } catch (error) {
      const fsError = error instanceof Error ? error : new Error(String(error));
      (fsError as FileSystemError).path = filePath;
      (fsError as FileSystemError).code = (error as any).code || 'UNKNOWN';
      this.errorHandler.handleFileSystemError(fsError as FileSystemError);
      return false;
    }
  }
  
  /**
   * Read a directory with error handling
   * @param dirPath Path to the directory
   * @returns Array of directory entries or null if an error occurred
   */
  private async readDirectory(dirPath: string): Promise<fs.Dirent[] | null> {
    try {
      return await fs.readdir(dirPath, { withFileTypes: true });
    } catch (error) {
      const fsError = error instanceof Error ? error : new Error(String(error));
      (fsError as FileSystemError).path = dirPath;
      (fsError as FileSystemError).code = (error as any).code || 'UNKNOWN';
      this.errorHandler.handleFileSystemError(fsError as FileSystemError);
      return null;
    }
  }
  
  /**
   * Extract configuration information from directory name
   * @param dirName The directory name to parse
   * @returns Configuration information extracted from the directory name
   */
  private extractConfigurationFromDirName(dirName: string): {
    mtu: number;
    awsLogging: boolean;
    backendServer: string;
  } {
    // Parse directory name like "coredns-mtu1500-aws-logs_enabled"
    const mtuMatch = dirName.match(/mtu(\d+)/);
    const loggingMatch = dirName.match(/aws-logs_(enabled|disabled)/);
    const serverMatch = dirName.match(/^(coredns|stock)/);
    
    return {
      mtu: mtuMatch && mtuMatch[1] ? parseInt(mtuMatch[1], 10) : 0,
      awsLogging: loggingMatch ? loggingMatch[1] === 'enabled' : false,
      backendServer: serverMatch && serverMatch[1] ? serverMatch[1] : 'unknown'
    };
  }
  
  /**
   * Extract date from file name
   * @param fileName The file name to parse
   * @returns Date string extracted from the file name
   */
  private extractDateFromFileName(fileName: string): string {
    // Parse date from file name like "parameters-results_20250717_151520.json"
    const dateMatch = path.basename(fileName).match(/(\d{8}_\d{6})/);
    
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
      } catch (error) {
        console.warn(`Failed to parse date from ${dateStr}: ${error}`);
      }
    }
    
    return new Date().toISOString();
  }
}

export { DatasetDiscoveryService };