// Tests for DataValidator utility
import { DataValidator, ValidationResult } from '../../src/utils/DataValidator';
import { DefaultErrorHandler } from '../../src/utils/ErrorHandler';
import { 
  Dataset, 
  TestParameters, 
  TestResults, 
  TestConfiguration,
  IperfTestResult,
  DnsTestResult
} from '../../src/models';

describe('DataValidator', () => {
  let validator: DataValidator;
  let errorHandler: DefaultErrorHandler;
  let handleValidationErrorSpy: jest.SpyInstance;
  
  beforeEach(() => {
    errorHandler = new DefaultErrorHandler();
    handleValidationErrorSpy = jest.spyOn(errorHandler, 'handleValidationError').mockImplementation(() => true);
    validator = new DataValidator(errorHandler);
  });
  
  afterEach(() => {
    handleValidationErrorSpy.mockRestore();
  });
  
  describe('validateDataset', () => {
    it('should validate a valid dataset', () => {
      // Arrange
      const dataset: Dataset = {
        name: 'test-dataset',
        parametersFile: '/path/to/parameters.json',
        resultsFile: '/path/to/results.json',
        configuration: {
          mtu: 1500,
          awsLogging: false,
          backendServer: 'test-server',
          testDate: '2025-07-17'
        }
      };
      
      // Act
      const result = validator.validateDataset(dataset);
      
      // Assert
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual(dataset);
      expect(result.errors).toEqual([]);
      expect(handleValidationErrorSpy).not.toHaveBeenCalled();
    });
    
    it('should invalidate a dataset with missing required fields', () => {
      // Arrange
      const dataset = {
        name: '',
        parametersFile: '',
        resultsFile: '/path/to/results.json',
        configuration: {
          mtu: -1,
          awsLogging: 'invalid' as any,
          backendServer: '',
          testDate: ''
        }
      } as Dataset;
      
      // Act
      const result = validator.validateDataset(dataset);
      
      // Assert
      expect(result.isValid).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.field === 'name')).toBe(true);
      expect(result.errors.some(e => e.field === 'parametersFile')).toBe(true);
      expect(result.errors.some(e => e.field === 'configuration.mtu')).toBe(true);
      expect(result.errors.some(e => e.field === 'configuration.awsLogging')).toBe(true);
      expect(handleValidationErrorSpy).toHaveBeenCalled();
    });
    
    it('should handle missing configuration', () => {
      // Arrange
      const dataset = {
        name: 'test-dataset',
        parametersFile: '/path/to/parameters.json',
        resultsFile: '/path/to/results.json'
      } as Dataset;
      
      // Act
      const result = validator.validateDataset(dataset);
      
      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'configuration')).toBe(true);
    });
  });
  
  describe('validateTestParameters', () => {
    it('should validate valid test parameters', () => {
      // Arrange
      const params: TestParameters = {
        backendServer: 'test-server',
        mtu: 1500,
        queryLogging: 'disabled',
        timestamp: '2025-07-17T12:00:00Z'
      };
      
      // Act
      const result = validator.validateTestParameters(params);
      
      // Assert
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual(params);
      expect(result.errors).toEqual([]);
    });
    
    it('should invalidate test parameters with invalid values', () => {
      // Arrange
      const params = {
        backendServer: '',
        mtu: -1,
        queryLogging: 'invalid' as any
      } as TestParameters;
      
      // Act
      const result = validator.validateTestParameters(params);
      
      // Assert
      expect(result.isValid).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.field === 'mtu')).toBe(true);
      expect(result.errors.some(e => e.field === 'queryLogging')).toBe(true);
      expect(handleValidationErrorSpy).toHaveBeenCalled();
    });
    
    it('should mark missing backendServer as a warning', () => {
      // Arrange
      const params: TestParameters = {
        backendServer: '',
        mtu: 1500,
        queryLogging: 'disabled'
      };
      
      // Act
      const result = validator.validateTestParameters(params);
      
      // Assert
      expect(result.isValid).toBe(true); // Warnings don't make it invalid
      expect(result.errors.some(e => e.field === 'backendServer' && e.severity === 'warning')).toBe(true);
    });
  });
  
  describe('validateTestResults', () => {
    it('should validate valid test results', () => {
      // Arrange
      const results: TestResults = {
        iperfTests: [
          {
            server: 'test-server',
            scenario: 'tcp',
            success: true,
            bandwidthMbps: 100,
            duration: 10
          }
        ],
        dnsResults: [
          {
            domain: 'example.com',
            dnsServer: '8.8.8.8',
            success: true,
            responseTimeMs: 10
          }
        ]
      };
      
      // Act
      const result = validator.validateTestResults(results);
      
      // Assert
      expect(result.isValid).toBe(true);
      expect(result.data).toBeTruthy();
      expect(result.errors).toEqual([]);
    });
    
    it('should invalidate test results with missing arrays', () => {
      // Arrange
      const results = {} as TestResults;
      
      // Act
      const result = validator.validateTestResults(results);
      
      // Assert
      expect(result.isValid).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors.length).toBe(2);
      expect(result.errors.some(e => e.field === 'iperfTests')).toBe(true);
      expect(result.errors.some(e => e.field === 'dnsResults')).toBe(true);
    });
    
    it('should validate and sanitize test results with invalid entries', () => {
      // Arrange
      const results: TestResults = {
        iperfTests: [
          {
            server: 'test-server',
            scenario: 'tcp',
            success: true,
            bandwidthMbps: -1, // Invalid
            duration: 10
          },
          {
            server: 'test-server',
            scenario: 'udp',
            success: false,
            // Missing error message (warning)
            packets: 100,
            lostPackets: 5
          }
        ],
        dnsResults: [
          {
            domain: 'example.com',
            dnsServer: '8.8.8.8',
            success: true,
            responseTimeMs: -1 // Invalid
          },
          {
            domain: 'example.org',
            dnsServer: '1.1.1.1',
            success: false,
            error: 'DNS resolution failed'
          }
        ]
      };
      
      // Act
      const result = validator.validateTestResults(results);
      
      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.field.includes('bandwidthMbps'))).toBe(true);
      expect(result.errors.some(e => e.field.includes('responseTimeMs'))).toBe(true);
      expect(result.errors.some(e => e.field.includes('error') && e.severity === 'warning')).toBe(true);
    });
    
    it('should sanitize test results by calculating derived values', () => {
      // Arrange
      const results: TestResults = {
        iperfTests: [
          {
            server: 'test-server',
            scenario: 'tcp',
            success: true,
            bitsPerSecond: 100000000, // 100 Mbps
            // bandwidthMbps should be calculated
            startTime: 0,
            endTime: 10
            // duration should be calculated
          },
          {
            server: 'test-server',
            scenario: 'udp',
            success: true,
            packets: 100,
            lostPackets: 10
            // packetLoss should be calculated
          }
        ],
        dnsResults: []
      };
      
      // Act
      const result = validator.validateTestResults(results);
      
      // Assert
      expect(result.isValid).toBe(true);
      expect(result.data).toBeTruthy();
      if (result.data && result.data.iperfTests && result.data.iperfTests.length >= 2 && 
          result.data.iperfTests[0] && result.data.iperfTests[1]) {
        expect(result.data.iperfTests[0].bandwidthMbps).toBe(100);
        expect(result.data.iperfTests[0].duration).toBe(10);
        expect(result.data.iperfTests[1].packetLoss).toBe(10);
      }
    });
  });
});