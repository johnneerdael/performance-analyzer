// Tests for DatasetDiscoveryService
import { DefaultDatasetDiscoveryService } from '../../src/services/DatasetDiscoveryService';
import { Dataset } from '../../src/models';
import fs from 'fs-extra';
import path from 'path';

// Mock fs-extra
jest.mock('fs-extra', () => ({
  pathExists: jest.fn(),
  readdir: jest.fn(),
  existsSync: jest.fn(),
  readFile: jest.fn()
}));

describe('DatasetDiscoveryService', () => {
  let discoveryService: DefaultDatasetDiscoveryService;

  beforeEach(() => {
    discoveryService = new DefaultDatasetDiscoveryService();
    jest.clearAllMocks();
  });

  describe('discoverDatasets', () => {
    it('should return empty array when root path does not exist', async () => {
      // Arrange
      (fs.pathExists as jest.Mock).mockResolvedValue(false);
      
      // Act
      const result = await discoveryService.discoverDatasets('/non-existent-path');
      
      // Assert
      expect(result).toEqual([]);
      expect(fs.pathExists).toHaveBeenCalledWith('/non-existent-path');
    });
    
    it('should discover datasets matching the pattern', async () => {
      // Arrange
      const rootPath = '/test-data';
      (fs.pathExists as jest.Mock).mockResolvedValue(true);
      
      // Mock directory entries
      (fs.readdir as jest.Mock).mockImplementation((dirPath) => {
        if (dirPath === rootPath) {
          return Promise.resolve([
            { name: 'coredns-mtu1500-aws-logs_enabled', isDirectory: () => true },
            { name: 'coredns-mtu1420-aws-logs_disabled', isDirectory: () => true },
            { name: 'stock-mtu8920-aws-logs_disabled', isDirectory: () => true },
            { name: 'other-directory', isDirectory: () => true },
            { name: 'some-file.txt', isDirectory: () => false }
          ]);
        } else if (dirPath === `${rootPath}/coredns-mtu1500-aws-logs_enabled`) {
          return Promise.resolve([
            'parameters-results_20250717_113356.json',
            'results_20250717_113356.json',
            'dns_performance_comparison.png'
          ]);
        } else if (dirPath === `${rootPath}/coredns-mtu1420-aws-logs_disabled`) {
          return Promise.resolve([
            'parameters-results_20250717_151520.json',
            'results_20250717_151520.json',
            'dns_slowest_domains.png'
          ]);
        } else if (dirPath === `${rootPath}/stock-mtu8920-aws-logs_disabled`) {
          return Promise.resolve([
            'results_20250717_194728.json',
            'iperf_bandwidth_comparison.png'
          ]);
        }
        return Promise.resolve([]);
      });
      
      // Mock file existence checks
      (fs.existsSync as jest.Mock).mockImplementation((filePath) => {
        return String(filePath).includes('parameters-results') || String(filePath).includes('results_');
      });
      
      // Act
      const result = await discoveryService.discoverDatasets(rootPath);
      
      // Assert
      expect(result.length).toBe(3);
      expect(result[0]?.name).toBe('coredns-mtu1500-aws-logs_enabled');
      expect(result[0]?.configuration.mtu).toBe(1500);
      expect(result[0]?.configuration.awsLogging).toBe(true);
      expect(result[0]?.configuration.backendServer).toBe('coredns');
      
      expect(result[1]?.name).toBe('coredns-mtu1420-aws-logs_disabled');
      expect(result[1]?.configuration.mtu).toBe(1420);
      expect(result[1]?.configuration.awsLogging).toBe(false);
      
      expect(result[2]?.name).toBe('stock-mtu8920-aws-logs_disabled');
      expect(result[2]?.configuration.mtu).toBe(8920);
      expect(result[2]?.configuration.backendServer).toBe('stock');
    });
    
    it('should handle errors when reading directories', async () => {
      // Arrange
      const rootPath = '/test-data';
      (fs.pathExists as jest.Mock).mockResolvedValue(true);
      
      // Mock directory entries for root
      (fs.readdir as jest.Mock).mockImplementationOnce(() => {
        return Promise.resolve([
          { name: 'coredns-mtu1500-aws-logs_enabled', isDirectory: () => true },
          { name: 'error-directory', isDirectory: () => true }
        ]);
      });
      
      // Mock successful directory read
      (fs.readdir as jest.Mock).mockImplementationOnce(() => {
        return Promise.resolve([
          'parameters-results_20250717_113356.json',
          'results_20250717_113356.json'
        ]);
      });
      
      // Mock error for second directory
      (fs.readdir as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Permission denied');
      });
      
      // Mock file existence checks
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = await discoveryService.discoverDatasets(rootPath);
      
      // Assert
      expect(result.length).toBe(1);
      expect(result[0]?.name).toBe('coredns-mtu1500-aws-logs_enabled');
    });
    
    it('should skip directories with no parameter or result files', async () => {
      // Arrange
      const rootPath = '/test-data';
      (fs.pathExists as jest.Mock).mockResolvedValue(true);
      
      // Mock directory entries
      (fs.readdir as jest.Mock).mockImplementationOnce(() => {
        return Promise.resolve([
          { name: 'coredns-mtu1500-aws-logs_enabled', isDirectory: () => true },
          { name: 'empty-directory-match', isDirectory: () => true }
        ]);
      });
      
      // Mock successful directory read
      (fs.readdir as jest.Mock).mockImplementationOnce(() => {
        return Promise.resolve([
          'parameters-results_20250717_113356.json',
          'results_20250717_113356.json'
        ]);
      });
      
      // Mock empty directory
      (fs.readdir as jest.Mock).mockImplementationOnce(() => {
        return Promise.resolve([
          'some-other-file.txt',
          'image.png'
        ]);
      });
      
      // Mock file existence checks
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = await discoveryService.discoverDatasets(rootPath);
      
      // Assert
      expect(result.length).toBe(1);
      expect(result[0]?.name).toBe('coredns-mtu1500-aws-logs_enabled');
    });
  });

  describe('validateDatasetCompleteness', () => {
    it('should return true for complete datasets', () => {
      // Arrange
      const dataset: Dataset = {
        name: 'coredns-mtu1500-aws-logs_enabled',
        parametersFile: '/path/to/parameters-results_20250717_113356.json',
        resultsFile: '/path/to/results_20250717_113356.json',
        configuration: {
          mtu: 1500,
          awsLogging: true,
          backendServer: 'coredns',
          testDate: '2025-07-17 11:33:56'
        }
      };
      
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = discoveryService.validateDatasetCompleteness(dataset);
      
      // Assert
      expect(result).toBe(true);
    });
    
    it('should return false when both parameter and result files are missing', () => {
      // Arrange
      const dataset: Dataset = {
        name: 'coredns-mtu1500-aws-logs_enabled',
        parametersFile: '/path/to/parameters-results_20250717_113356.json',
        resultsFile: '/path/to/results_20250717_113356.json',
        configuration: {
          mtu: 1500,
          awsLogging: true,
          backendServer: 'coredns',
          testDate: '2025-07-17 11:33:56'
        }
      };
      
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      
      // Act
      const result = discoveryService.validateDatasetCompleteness(dataset);
      
      // Assert
      expect(result).toBe(false);
    });
    
    it('should return false for datasets with invalid configuration', () => {
      // Arrange
      const dataset: Dataset = {
        name: 'coredns-mtu1500-aws-logs_enabled',
        parametersFile: '/path/to/parameters-results_20250717_113356.json',
        resultsFile: '/path/to/results_20250717_113356.json',
        configuration: {
          mtu: -1, // Invalid MTU
          awsLogging: true,
          backendServer: 'coredns',
          testDate: '2025-07-17 11:33:56'
        }
      };
      
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      
      // Act
      const result = discoveryService.validateDatasetCompleteness(dataset);
      
      // Assert
      expect(result).toBe(false);
    });
    
    it('should return true when only results file exists', () => {
      // Arrange
      const dataset: Dataset = {
        name: 'stock-mtu8920-aws-logs_disabled',
        parametersFile: '', // No parameters file
        resultsFile: '/path/to/results_20250717_194728.json',
        configuration: {
          mtu: 8920,
          awsLogging: false,
          backendServer: 'stock',
          testDate: '2025-07-17 19:47:28'
        }
      };
      
      (fs.existsSync as jest.Mock).mockImplementation((filePath) => {
        return String(filePath).includes('results_');
      });
      
      // Act
      const result = discoveryService.validateDatasetCompleteness(dataset);
      
      // Assert
      expect(result).toBe(true);
    });
  });
  
  describe('extractConfigurationFromDirName', () => {
    it('should correctly extract configuration from directory names', () => {
      // Using the private method through reflection for testing
      const extractConfig = (discoveryService as any).extractConfigurationFromDirName.bind(discoveryService);
      
      // Test various directory name patterns
      expect(extractConfig('coredns-mtu1500-aws-logs_enabled')).toEqual({
        mtu: 1500,
        awsLogging: true,
        backendServer: 'coredns'
      });
      
      expect(extractConfig('stock-mtu8920-aws-logs_disabled')).toEqual({
        mtu: 8920,
        awsLogging: false,
        backendServer: 'stock'
      });
      
      expect(extractConfig('invalid-directory-name')).toEqual({
        mtu: 0,
        awsLogging: false,
        backendServer: 'unknown'
      });
    });
  });
  
  describe('extractDateFromFileName', () => {
    it('should correctly extract date from file names', () => {
      // Using the private method through reflection for testing
      const extractDate = (discoveryService as any).extractDateFromFileName.bind(discoveryService);
      
      // Test various file name patterns
      expect(extractDate('parameters-results_20250717_113356.json')).toBe('2025-07-17 11:33:56');
      expect(extractDate('results_20250717_194728.json')).toBe('2025-07-17 19:47:28');
      
      // Test with invalid file name (should return current date)
      const result = extractDate('invalid-file-name.json');
      expect(result).not.toBe('');
    });
  });
});