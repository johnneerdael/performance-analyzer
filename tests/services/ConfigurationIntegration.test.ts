// Integration tests for configuration and plugin systems
import { NetworkPerformanceAnalyzer, createNetworkPerformanceAnalyzer } from '../../src/services/NetworkPerformanceAnalyzer';
import { ConfigurationManager } from '../../src/config/ConfigurationManager';
import { PluginManager } from '../../src/plugins/PluginManager';
import { ReportTemplateManager } from '../../src/services/ReportTemplateManager';
import fs from 'fs-extra';
import path from 'path';

// Mock fs-extra
jest.mock('fs-extra', () => ({
  pathExists: jest.fn().mockResolvedValue(true),
  readJsonSync: jest.fn(),
  writeJson: jest.fn().mockResolvedValue(undefined),
  ensureDir: jest.fn().mockResolvedValue(undefined),
  writeFileSync: jest.fn(),
  readdir: jest.fn().mockResolvedValue(['plugin1.js']),
  stat: jest.fn().mockResolvedValue({ isDirectory: () => true })
}));

// Mock plugin
jest.mock('../../src/plugins/ExampleAnalyzerPlugin', () => ({
  __esModule: true,
  default: {
    name: 'example-analyzer',
    description: 'Example analyzer plugin',
    version: '1.0.0',
    initialize: jest.fn().mockResolvedValue(undefined),
    execute: jest.fn().mockResolvedValue({ customMetrics: { value: 42 } })
  },
  type: 'analyzer',
  author: 'Test Author'
}), { virtual: true });

// Mock require function
jest.mock('module', () => {
  const originalModule = jest.requireActual('module');
  return {
    ...originalModule,
    _load: jest.fn().mockImplementation((path) => {
      if (path.includes('ExampleAnalyzerPlugin')) {
        return require('../../src/plugins/ExampleAnalyzerPlugin');
      }
      return {};
    })
  };
});

describe('Configuration and Plugin Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock configuration
    (fs.readJsonSync as jest.Mock).mockReturnValue({
      analysis: {
        continueOnError: true,
        logProgress: false,
        useParallelProcessing: true,
        maxParallelTasks: 2
      },
      anomalyThresholds: {
        bandwidthVariation: 0.1,
        latencyVariation: 0.2
      },
      reporting: {
        outputDirectory: './reports',
        defaultFilename: 'test-report.md',
        includeSections: ['executive-summary', 'recommendations']
      },
      plugins: {
        enabled: ['example-analyzer'],
        config: {
          'example-analyzer': {
            option1: 'value1'
          }
        }
      }
    });
  });
  
  describe('createNetworkPerformanceAnalyzer', () => {
    it('should create an analyzer with configuration from file', () => {
      // Arrange
      const configPath = './config.json';
      
      // Act
      const analyzer = createNetworkPerformanceAnalyzer({
        configPath
      });
      
      // Assert
      expect(fs.readJsonSync).toHaveBeenCalledWith(configPath);
      expect(analyzer).toBeInstanceOf(NetworkPerformanceAnalyzer);
    });
    
    it('should set environment-specific configuration', () => {
      // Arrange
      const configWithEnvironments = {
        environments: {
          production: {
            analysis: {
              logProgress: false,
              enablePerformanceMonitoring: true
            }
          }
        }
      };
      
      (fs.readJsonSync as jest.Mock).mockReturnValue(configWithEnvironments);
      
      // Act
      const analyzer = createNetworkPerformanceAnalyzer({
        configPath: './config.json',
        environment: 'production'
      });
      
      // Assert
      expect(analyzer).toBeInstanceOf(NetworkPerformanceAnalyzer);
    });
    
    it('should merge provided config with loaded config', () => {
      // Arrange
      const configPath = './config.json';
      const providedConfig = {
        maxParallelTasks: 8,
        reportOutputPath: './custom-report.md'
      };
      
      // Act
      const analyzer = createNetworkPerformanceAnalyzer({
        configPath,
        ...providedConfig
      });
      
      // Assert
      expect(fs.readJsonSync).toHaveBeenCalledWith(configPath);
      expect(analyzer).toBeInstanceOf(NetworkPerformanceAnalyzer);
    });
  });
  
  describe('Plugin Integration', () => {
    it('should discover and load plugins from directories', async () => {
      // Arrange
      const pluginDirectories = ['./plugins'];
      const mockPlugin = require('../../src/plugins/ExampleAnalyzerPlugin').default;
      
      // Act
      const analyzer = createNetworkPerformanceAnalyzer({
        configPath: './config.json',
        pluginDirectories
      });
      
      // Wait for async plugin loading to complete
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Assert
      expect(analyzer).toBeInstanceOf(NetworkPerformanceAnalyzer);
      expect(fs.readdir).toHaveBeenCalled();
    });
  });
  
  describe('Report Template Integration', () => {
    it('should use custom report template if specified', () => {
      // Arrange
      const reportTemplateId = 'custom';
      const mockTemplate = {
        name: 'Custom Template',
        description: 'Custom report template',
        format: 'markdown',
        sections: []
      };
      
      // Mock template manager's getTemplate method
      jest.spyOn(ReportTemplateManager.prototype, 'getTemplate').mockReturnValue(mockTemplate as any);
      jest.spyOn(ReportTemplateManager.prototype, 'setActiveTemplate').mockReturnValue(new ReportTemplateManager({} as any));
      
      // Act
      const analyzer = createNetworkPerformanceAnalyzer({
        configPath: './config.json',
        reportTemplateId
      });
      
      // Assert
      expect(analyzer).toBeInstanceOf(NetworkPerformanceAnalyzer);
      expect(ReportTemplateManager.prototype.setActiveTemplate).toHaveBeenCalledWith(reportTemplateId);
    });
    
    it('should handle template not found gracefully', () => {
      // Arrange
      const reportTemplateId = 'nonexistent';
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Mock template manager's setActiveTemplate method to throw
      jest.spyOn(ReportTemplateManager.prototype, 'setActiveTemplate').mockImplementation(() => {
        throw new Error('Template not found');
      });
      
      // Act
      const analyzer = createNetworkPerformanceAnalyzer({
        configPath: './config.json',
        reportTemplateId
      });
      
      // Assert
      expect(analyzer).toBeInstanceOf(NetworkPerformanceAnalyzer);
      expect(consoleSpy).toHaveBeenCalledWith(
        `Template ${reportTemplateId} not found, using default template`
      );
      
      consoleSpy.mockRestore();
    });
  });
});