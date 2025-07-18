import { TestParameters, TestResults, Dataset } from '../models';
import { ErrorHandler } from './ErrorHandler';
/**
 * Validation result interface
 */
export interface ValidationResult<T> {
    isValid: boolean;
    data: T | null;
    errors: ValidationError[];
}
/**
 * Validation error interface
 */
export interface ValidationError {
    field: string;
    message: string;
    severity: 'warning' | 'error';
}
/**
 * Data validator class for validating input data
 */
export declare class DataValidator {
    private errorHandler;
    /**
     * Creates a new DataValidator instance
     * @param errorHandler Error handler for logging validation errors
     */
    constructor(errorHandler: ErrorHandler);
    /**
     * Validates a dataset object
     * @param dataset The dataset to validate
     * @returns Validation result
     */
    validateDataset(dataset: Dataset): ValidationResult<Dataset>;
    /**
     * Validates test parameters
     * @param params The test parameters to validate
     * @returns Validation result
     */
    validateTestParameters(params: TestParameters): ValidationResult<TestParameters>;
    /**
     * Validates test results
     * @param results The test results to validate
     * @returns Validation result
     */
    validateTestResults(results: TestResults): ValidationResult<TestResults>;
    /**
     * Validates an iperf test result
     * @param test The iperf test result to validate
     * @returns Array of validation errors
     */
    private validateIperfTestResult;
    /**
     * Validates a DNS test result
     * @param test The DNS test result to validate
     * @returns Array of validation errors
     */
    private validateDnsTestResult;
    /**
     * Sanitizes test results by removing invalid data and providing defaults
     * @param results The test results to sanitize
     * @returns Sanitized test results
     */
    private sanitizeTestResults;
    /**
     * Sanitizes an iperf test result
     * @param test The iperf test result to sanitize
     * @returns Sanitized iperf test result
     */
    private sanitizeIperfTestResult;
    /**
     * Sanitizes a DNS test result
     * @param test The DNS test result to sanitize
     * @returns Sanitized DNS test result
     */
    private sanitizeDnsTestResult;
}
//# sourceMappingURL=DataValidator.d.ts.map