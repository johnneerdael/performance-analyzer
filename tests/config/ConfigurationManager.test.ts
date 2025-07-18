// Tests for ConfigurationManager
import { ConfigurationManager, DEFAULT_CONFIG } from '../../src/config/ConfigurationManager';
import fs from 'fs-extra';
import path from 'path';

// Mock fs-extra
jest.mock('fs-extra', () => ({
  existsSync: jest.fn(),
  readJsonSync: jest.fn(),
  ensureDir: jest.fn().mockResolvedValue(undefined),
  writeJson: jest.fn().mockResolvedValue(undefined),
  pathExists: jest.fn().mockResolvedValue(false)
}));

describe('ConfigurationManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const configManager = new ConfigurationManager();
      expect(configManager.getConfig()).toEqual(DEFAULT_CONFIG);
    });
    
    it('should apply initial configuration if provided', () => {
      const initialConfig = {
        analysis: {
          continueOnError: false
        }
      };
      
      const configManager = new ConfigurationManager(initialConfig);
      expect(configManager.getConfig().analysis?.continueOnError).toBe(false);
    });
  });
  
  describe('loadFromFile', () => {
    it('should load configuration from a file if it exists', () => {
      const mockConfig = {
        analysis: {
          continueOnError: false,
          maxParallelTasks: 2
        }
      };
      
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readJsonSync as jest.Mock).mockReturnValue(mockConfig);
      
      const configManager = new ConfigurationManager();
      configManager.loadFromFile('config.json');
      
      expect(fs.existsSync).toHaveBeenCalledWith('config.json');
      expect(fs.readJsonSync).toHaveBeenCalledWith('config.json');
      expect(configManager.getConfig().analysis?.continueOnError).toBe(false);
      expect(configManager.getConfig().analysis?.maxParallelTasks).toBe(2);
    });
    
    it('should log a warning if the file does not exist', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      
      const configManager = new ConfigurationManager();
      configManager.loadFromFile('nonexistent.json');
      
      expect(fs.existsSync).toHaveBeenCalledWith('nonexistent.json');
      expect(fs.readJsonSync).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Configuration file not found: nonexistent.json');
      
      consoleSpy.mockRestore();
    });
    
    it('should handle errors when loading the file', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readJsonSync as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid JSON');
      });
      
      const configManager = new ConfigurationManager();
      configManager.loadFromFile('invalid.json');
      
      expect(fs.existsSync).toHaveBeenCalledWith('invalid.json');
      expect(fs.readJsonSync).toHaveBeenCalledWith('invalid.json');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error loading configuration from invalid.json:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('saveToFile', () => {
    it('should save configuration to a file', async () => {
      const configManager = new ConfigurationManager();
      await configManager.saveToFile('config.json');
      
      expect(fs.ensureDir).toHaveBeenCalledWith(path.dirname('config.json'));
      expect(fs.writeJson).toHaveBeenCalledWith('config.json', expect.any(Object), { spaces: 2 });
    });
    
    it('should use the previously loaded file path if not specified', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readJsonSync as jest.Mock).mockReturnValue({});
      
      const configManager = new ConfigurationManager();
      configManager.loadFromFile('previous.json');
      await configManager.saveToFile();
      
      expect(fs.writeJson).toHaveBeenCalledWith('previous.json', expect.any(Object), { spaces: 2 });
    });
    
    it('should handle errors when saving the file', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      (fs.writeJson as jest.Mock).mockRejectedValue(new Error('Write error'));
      
      const configManager = new ConfigurationManager();
      
      await expect(configManager.saveToFile('error.json')).rejects.toThrow('Write error');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error saving configuration to error.json:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('setEnvironment', () => {
    it('should set the environment and apply environment-specific configuration', () => {
      const configManager = new ConfigurationManager({
        environments: {
          production: {
            analysis: {
              enablePerformanceMonitoring: true
            }
          }
        }
      });
      
      configManager.setEnvironment('production');
      
      expect(configManager.getEnvironment()).toBe('production');
      expect(configManager.getConfig().analysis?.enablePerformanceMonitoring).toBe(true);
    });
    
    it('should not apply environment-specific configuration if it does not exist', () => {
      const configManager = new ConfigurationManager();
      configManager.setEnvironment('nonexistent');
      
      expect(configManager.getEnvironment()).toBe('nonexistent');
      expect(configManager.getConfig()).toEqual(DEFAULT_CONFIG);
    });
  });
  
  describe('update', () => {
    it('should update configuration with new values', () => {
      const configManager = new ConfigurationManager();
      
      configManager.update({
        analysis: {
          continueOnError: false,
          maxParallelTasks: 2
        },
        reporting: {
          format: 'html'
        }
      });
      
      expect(configManager.getConfig().analysis?.continueOnError).toBe(false);
      expect(configManager.getConfig().analysis?.maxParallelTasks).toBe(2);
      expect(configManager.getConfig().reporting?.format).toBe('html');
    });
    
    it('should perform a deep merge of configuration objects', () => {
      const configManager = new ConfigurationManager();
      
      configManager.update({
        analysis: {
          continueOnError: false
        }
      });
      
      expect(configManager.getConfig().analysis?.continueOnError).toBe(false);
      expect(configManager.getConfig().analysis?.maxParallelTasks).toBe(4); // Default value preserved
    });
  });
  
  describe('getSection', () => {
    it('should return a specific configuration section', () => {
      const configManager = new ConfigurationManager();
      const analysisSection = configManager.getSection('analysis');
      
      expect(analysisSection).toEqual(DEFAULT_CONFIG.analysis);
    });
    
    it('should return undefined for non-existent sections', () => {
      const configManager = new ConfigurationManager();
      const nonExistentSection = configManager.getSection('nonexistent' as any);
      
      expect(nonExistentSection).toBeUndefined();
    });
  });
  
  describe('getAnalyzerConfig', () => {
    it('should return analyzer configuration for NetworkPerformanceAnalyzer', () => {
      const configManager = new ConfigurationManager({
        analysis: {
          continueOnError: false,
          maxParallelTasks: 2
        },
        anomalyThresholds: {
          bandwidthVariation: 0.1
        },
        reporting: {
          outputDirectory: './custom-reports',
          defaultFilename: 'custom-report.md'
        }
      });
      
      const analyzerConfig = configManager.getAnalyzerConfig();
      
      expect(analyzerConfig).toEqual({
        continueOnError: false,
        maxParallelTasks: 2,
        anomalyThresholds: {
          bandwidthVariation: 0.1
        },
        reportOutputPath: './custom-reports/custom-report.md'
      });
    });
  });
  
  describe('createDefaultConfig', () => {
    it('should create a default configuration file if it does not exist', async () => {
      (fs.pathExists as jest.Mock).mockResolvedValue(false);
      
      await ConfigurationManager.createDefaultConfig('default.json');
      
      expect(fs.pathExists).toHaveBeenCalledWith('default.json');
      expect(fs.ensureDir).toHaveBeenCalledWith(path.dirname('default.json'));
      expect(fs.writeJson).toHaveBeenCalledWith('default.json', DEFAULT_CONFIG, { spaces: 2 });
    });
    
    it('should not create a file if it already exists', async () => {
      (fs.pathExists as jest.Mock).mockResolvedValue(true);
      
      await ConfigurationManager.createDefaultConfig('existing.json');
      
      expect(fs.pathExists).toHaveBeenCalledWith('existing.json');
      expect(fs.writeJson).not.toHaveBeenCalled();
    });
    
    it('should handle errors when creating the file', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      (fs.pathExists as jest.Mock).mockResolvedValue(false);
      (fs.ensureDir as jest.Mock).mockRejectedValue(new Error('Directory error'));
      
      await expect(ConfigurationManager.createDefaultConfig('error.json')).rejects.toThrow('Directory error');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error creating default configuration at error.json:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });
});