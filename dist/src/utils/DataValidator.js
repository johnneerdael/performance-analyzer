"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataValidator = void 0;
/**
 * Data validator class for validating input data
 */
class DataValidator {
    /**
     * Creates a new DataValidator instance
     * @param errorHandler Error handler for logging validation errors
     */
    constructor(errorHandler) {
        this.errorHandler = errorHandler;
    }
    /**
     * Validates a dataset object
     * @param dataset The dataset to validate
     * @returns Validation result
     */
    validateDataset(dataset) {
        const errors = [];
        // Check required fields
        if (!dataset.name) {
            errors.push({
                field: 'name',
                message: 'Dataset name is required',
                severity: 'error'
            });
        }
        if (!dataset.parametersFile) {
            errors.push({
                field: 'parametersFile',
                message: 'Parameters file path is missing (optional if results file exists)',
                severity: 'warning'
            });
        }
        if (!dataset.resultsFile) {
            errors.push({
                field: 'resultsFile',
                message: 'Results file path is required',
                severity: 'error'
            });
        }
        // Validate configuration
        if (!dataset.configuration) {
            errors.push({
                field: 'configuration',
                message: 'Configuration is required',
                severity: 'error'
            });
        }
        else {
            // Validate MTU
            if (typeof dataset.configuration.mtu !== 'number' || dataset.configuration.mtu <= 0) {
                errors.push({
                    field: 'configuration.mtu',
                    message: 'MTU must be a positive number',
                    severity: 'error'
                });
            }
            // Validate AWS logging
            if (typeof dataset.configuration.awsLogging !== 'boolean') {
                errors.push({
                    field: 'configuration.awsLogging',
                    message: 'AWS logging must be a boolean',
                    severity: 'error'
                });
            }
            // Validate backend server
            if (!dataset.configuration.backendServer) {
                errors.push({
                    field: 'configuration.backendServer',
                    message: 'Backend server is required',
                    severity: 'warning'
                });
            }
            // Validate test date
            if (!dataset.configuration.testDate) {
                errors.push({
                    field: 'configuration.testDate',
                    message: 'Test date is required',
                    severity: 'warning'
                });
            }
        }
        const isValid = errors.filter(e => e.severity === 'error').length === 0;
        if (!isValid) {
            this.errorHandler.handleValidationError(new Error(`Dataset validation failed with ${errors.length} errors`), 'Dataset', dataset.name || 'unknown');
        }
        return {
            isValid,
            data: isValid ? dataset : null,
            errors
        };
    }
    /**
     * Validates test parameters
     * @param params The test parameters to validate
     * @returns Validation result
     */
    validateTestParameters(params) {
        const errors = [];
        // Check required fields
        if (!params.backendServer) {
            errors.push({
                field: 'backendServer',
                message: 'Backend server is required',
                severity: 'warning'
            });
        }
        // Validate MTU
        if (typeof params.mtu !== 'number' || params.mtu <= 0) {
            errors.push({
                field: 'mtu',
                message: 'MTU must be a positive number',
                severity: 'error'
            });
        }
        // Validate query logging
        if (params.queryLogging !== 'enabled' && params.queryLogging !== 'disabled') {
            errors.push({
                field: 'queryLogging',
                message: "Query logging must be 'enabled' or 'disabled'",
                severity: 'error'
            });
        }
        const isValid = errors.filter(e => e.severity === 'error').length === 0;
        if (!isValid) {
            this.errorHandler.handleValidationError(new Error(`Test parameters validation failed with ${errors.length} errors`), 'TestParameters', 'unknown');
        }
        return {
            isValid,
            data: isValid ? params : null,
            errors
        };
    }
    /**
     * Validates test results
     * @param results The test results to validate
     * @returns Validation result
     */
    validateTestResults(results) {
        const errors = [];
        // Check if iperfTests array exists
        if (!Array.isArray(results.iperfTests)) {
            errors.push({
                field: 'iperfTests',
                message: 'iperfTests must be an array',
                severity: 'error'
            });
        }
        else {
            // Validate each iperf test result
            results.iperfTests.forEach((test, index) => {
                const iperfErrors = this.validateIperfTestResult(test);
                iperfErrors.forEach(error => {
                    errors.push({
                        field: `iperfTests[${index}].${error.field}`,
                        message: error.message,
                        severity: error.severity
                    });
                });
            });
        }
        // Check if dnsResults array exists
        if (!Array.isArray(results.dnsResults)) {
            errors.push({
                field: 'dnsResults',
                message: 'dnsResults must be an array',
                severity: 'error'
            });
        }
        else {
            // Validate each DNS test result
            results.dnsResults.forEach((test, index) => {
                const dnsErrors = this.validateDnsTestResult(test);
                dnsErrors.forEach(error => {
                    errors.push({
                        field: `dnsResults[${index}].${error.field}`,
                        message: error.message,
                        severity: error.severity
                    });
                });
            });
        }
        const isValid = errors.filter(e => e.severity === 'error').length === 0;
        if (!isValid) {
            this.errorHandler.handleValidationError(new Error(`Test results validation failed with ${errors.length} errors`), 'TestResults', 'unknown');
        }
        return {
            isValid,
            data: isValid ? this.sanitizeTestResults(results) : null,
            errors
        };
    }
    /**
     * Validates an iperf test result
     * @param test The iperf test result to validate
     * @returns Array of validation errors
     */
    validateIperfTestResult(test) {
        const errors = [];
        // Check required fields
        if (!test.server) {
            errors.push({
                field: 'server',
                message: 'Server is required',
                severity: 'error'
            });
        }
        if (!test.scenario) {
            errors.push({
                field: 'scenario',
                message: 'Scenario is required',
                severity: 'error'
            });
        }
        // Validate success flag
        if (typeof test.success !== 'boolean') {
            errors.push({
                field: 'success',
                message: 'Success must be a boolean',
                severity: 'error'
            });
        }
        // If test failed, ensure error message exists
        if (test.success === false && !test.error) {
            errors.push({
                field: 'error',
                message: 'Error message is required for failed tests',
                severity: 'warning'
            });
        }
        // Validate numeric fields if they exist
        if (test.startTime !== undefined && (typeof test.startTime !== 'number' || test.startTime < 0)) {
            errors.push({
                field: 'startTime',
                message: 'Start time must be a non-negative number',
                severity: 'warning'
            });
        }
        if (test.endTime !== undefined && (typeof test.endTime !== 'number' || test.endTime < 0)) {
            errors.push({
                field: 'endTime',
                message: 'End time must be a non-negative number',
                severity: 'warning'
            });
        }
        if (test.duration !== undefined && (typeof test.duration !== 'number' || test.duration <= 0)) {
            errors.push({
                field: 'duration',
                message: 'Duration must be a positive number',
                severity: 'warning'
            });
        }
        // Validate bandwidth
        if (test.success && test.bandwidthMbps !== undefined &&
            (typeof test.bandwidthMbps !== 'number' || test.bandwidthMbps < 0)) {
            errors.push({
                field: 'bandwidthMbps',
                message: 'Bandwidth must be a non-negative number',
                severity: 'error'
            });
        }
        return errors;
    }
    /**
     * Validates a DNS test result
     * @param test The DNS test result to validate
     * @returns Array of validation errors
     */
    validateDnsTestResult(test) {
        const errors = [];
        // Check required fields
        if (!test.domain) {
            errors.push({
                field: 'domain',
                message: 'Domain is required',
                severity: 'error'
            });
        }
        if (!test.dnsServer) {
            errors.push({
                field: 'dnsServer',
                message: 'DNS server is required',
                severity: 'error'
            });
        }
        // Validate success flag
        if (typeof test.success !== 'boolean') {
            errors.push({
                field: 'success',
                message: 'Success must be a boolean',
                severity: 'error'
            });
        }
        // If test failed, ensure error message exists
        if (test.success === false && !test.error) {
            errors.push({
                field: 'error',
                message: 'Error message is required for failed tests',
                severity: 'warning'
            });
        }
        // Validate response time
        if (test.success && test.responseTimeMs !== undefined &&
            (typeof test.responseTimeMs !== 'number' || test.responseTimeMs < 0)) {
            errors.push({
                field: 'responseTimeMs',
                message: 'Response time must be a non-negative number',
                severity: 'error'
            });
        }
        // Validate query time
        if (test.success && test.queryTimeMs !== undefined &&
            (typeof test.queryTimeMs !== 'number' || test.queryTimeMs < 0)) {
            errors.push({
                field: 'queryTimeMs',
                message: 'Query time must be a non-negative number',
                severity: 'warning'
            });
        }
        // Validate resolved IPs
        if (test.success && test.resolvedIps !== undefined && !Array.isArray(test.resolvedIps)) {
            errors.push({
                field: 'resolvedIps',
                message: 'Resolved IPs must be an array',
                severity: 'warning'
            });
        }
        return errors;
    }
    /**
     * Sanitizes test results by removing invalid data and providing defaults
     * @param results The test results to sanitize
     * @returns Sanitized test results
     */
    sanitizeTestResults(results) {
        const sanitized = {
            iperfTests: [],
            dnsResults: []
        };
        // Sanitize iperf tests
        if (Array.isArray(results.iperfTests)) {
            sanitized.iperfTests = results.iperfTests
                .filter(test => test && typeof test === 'object')
                .map(test => this.sanitizeIperfTestResult(test));
        }
        // Sanitize DNS results
        if (Array.isArray(results.dnsResults)) {
            sanitized.dnsResults = results.dnsResults
                .filter(test => test && typeof test === 'object')
                .map(test => this.sanitizeDnsTestResult(test));
        }
        return sanitized;
    }
    /**
     * Sanitizes an iperf test result
     * @param test The iperf test result to sanitize
     * @returns Sanitized iperf test result
     */
    sanitizeIperfTestResult(test) {
        const sanitized = {
            server: test.server || 'unknown',
            scenario: test.scenario || 'unknown',
            success: typeof test.success === 'boolean' ? test.success : false
        };
        // Copy valid properties
        if (typeof test.startTime === 'number' && test.startTime >= 0) {
            sanitized.startTime = test.startTime;
        }
        if (typeof test.endTime === 'number' && test.endTime >= 0) {
            sanitized.endTime = test.endTime;
        }
        if (typeof test.duration === 'number' && test.duration > 0) {
            sanitized.duration = test.duration;
        }
        else if (sanitized.startTime !== undefined && sanitized.endTime !== undefined) {
            sanitized.duration = sanitized.endTime - sanitized.startTime;
        }
        if (typeof test.numStreams === 'number' && test.numStreams > 0) {
            sanitized.numStreams = test.numStreams;
        }
        if (typeof test.cpuUtilizationHost === 'number' && test.cpuUtilizationHost >= 0) {
            sanitized.cpuUtilizationHost = test.cpuUtilizationHost;
        }
        if (typeof test.cpuUtilizationRemote === 'number' && test.cpuUtilizationRemote >= 0) {
            sanitized.cpuUtilizationRemote = test.cpuUtilizationRemote;
        }
        // TCP specific
        if (typeof test.tcpMssDefault === 'number' && test.tcpMssDefault > 0) {
            sanitized.tcpMssDefault = test.tcpMssDefault;
        }
        if (typeof test.retransmits === 'number' && test.retransmits >= 0) {
            sanitized.retransmits = test.retransmits;
        }
        if (typeof test.sndCwnd === 'number' && test.sndCwnd > 0) {
            sanitized.sndCwnd = test.sndCwnd;
        }
        // UDP specific
        if (typeof test.jitterMs === 'number' && test.jitterMs >= 0) {
            sanitized.jitterMs = test.jitterMs;
        }
        if (typeof test.packets === 'number' && test.packets >= 0) {
            sanitized.packets = test.packets;
        }
        if (typeof test.lostPackets === 'number' && test.lostPackets >= 0) {
            sanitized.lostPackets = test.lostPackets;
        }
        if (typeof test.packetLoss === 'number' && test.packetLoss >= 0) {
            sanitized.packetLoss = test.packetLoss;
        }
        else if (sanitized.packets && sanitized.lostPackets) {
            sanitized.packetLoss = (sanitized.lostPackets / sanitized.packets) * 100;
        }
        // Common metrics
        if (typeof test.blksize === 'number' && test.blksize > 0) {
            sanitized.blksize = test.blksize;
        }
        if (typeof test.bytes === 'number' && test.bytes >= 0) {
            sanitized.bytes = test.bytes;
        }
        if (typeof test.bitsPerSecond === 'number' && test.bitsPerSecond >= 0) {
            sanitized.bitsPerSecond = test.bitsPerSecond;
        }
        if (typeof test.bandwidthMbps === 'number' && test.bandwidthMbps >= 0) {
            sanitized.bandwidthMbps = test.bandwidthMbps;
        }
        else if (sanitized.bitsPerSecond) {
            sanitized.bandwidthMbps = sanitized.bitsPerSecond / 1000000;
        }
        if (test.error) {
            sanitized.error = test.error;
        }
        // Keep raw data if available
        if (test.allRawData) {
            sanitized.allRawData = test.allRawData;
        }
        return sanitized;
    }
    /**
     * Sanitizes a DNS test result
     * @param test The DNS test result to sanitize
     * @returns Sanitized DNS test result
     */
    sanitizeDnsTestResult(test) {
        const sanitized = {
            domain: test.domain || 'unknown',
            dnsServer: test.dnsServer || 'unknown',
            success: typeof test.success === 'boolean' ? test.success : false
        };
        // Copy valid properties
        if (typeof test.responseTimeMs === 'number' && test.responseTimeMs >= 0) {
            sanitized.responseTimeMs = test.responseTimeMs;
        }
        if (typeof test.queryTimeMs === 'number' && test.queryTimeMs >= 0) {
            sanitized.queryTimeMs = test.queryTimeMs;
        }
        if (test.status) {
            sanitized.status = test.status;
        }
        if (Array.isArray(test.resolvedIps)) {
            sanitized.resolvedIps = test.resolvedIps.filter(ip => typeof ip === 'string');
        }
        if (test.error) {
            sanitized.error = test.error;
        }
        return sanitized;
    }
}
exports.DataValidator = DataValidator;
//# sourceMappingURL=DataValidator.js.map