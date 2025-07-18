// Tests for PluginManager
import { PluginManager, Plugin, PluginContext } from '../../src/plugins/PluginManager';
import { ConfigurationManager } from '../../src/config/ConfigurationManager';
import fs from 'fs-extra';
import path from 'path';

// Mock fs-extra
jest.mock('fs-extra', () => ({
  pathExists: jest.fn().mockResolvedValue(true),
  readdir: jest.fn().mockResolvedValue(['plugin1.js', 'plugin2.js', 'not-a-plugin.txt'])
}));

// Mock ConfigurationManager
jest.mock('../../src/config/ConfigurationManager');

// Mock require function
const mockRequire = jest.fn();
jest.mock('module', () => {
  const originalModule = jest.requireActual('module');
  return {
    ...originalModule,
    _load: mockRequire
  };
});

// Mock plugins
class MockPlugin1 implements Plugin {
  name = 'mock-plugin-1';
  description = 'Mock plugin 1 for testing';
  version = '1.0.0';
  
  async initialize(config: any): Promise<void> {}
  async execute(context: PluginContext): Promise<any> {
    return { result: 'plugin1-result' };
  }
}

class MockPlugin2 implements Plugin {
  name = 'mock-plugin-2';
  description = 'Mock plugin 2 for testing';
  version = '1.0.0';
  
  async initialize(config: any): Promise<void> {}
  async execute(context: PluginContext): Promise<any> {
    return { result: 'plugin2-result' };
  }
}

describe('PluginManager', () => {
  let pluginManager: PluginManager;
  let mockConfigManager: jest.Mocked<ConfigurationManager>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock ConfigurationManager
    mockConfigManager = new ConfigurationManager() as jest.Mocked<ConfigurationManager>;
    mockConfigManager.getSection = jest.fn().mockReturnValue({
      enabled: ['mock-plugin-1'],
      config: {
        'mock-plugin-1': { option1: 'value1' }
      }
    });
    
    pluginManager = new PluginManager(mockConfigManager);
  });
  
  describe('addPluginDirectory', () => {
    it('should add a plugin directory', () => {
      pluginManager.addPluginDirectory('/plugins');
      pluginManager.addPluginDirectory('/more-plugins');
      
      // Add the same directory again should not duplicate
      pluginManager.addPluginDirectory('/plugins');
      
      // @ts-ignore - Accessing private property for testing
      expect(pluginManager.pluginDirectories).toEqual(['/plugins', '/more-plugins']);
    });
  });
  
  describe('discoverPlugins', () => {
    it('should discover plugins from registered directories', async () => {
      // Setup mock plugin modules
      const mockPlugin1 = new MockPlugin1();
      const mockPlugin2 = new MockPlugin2();
      
      mockRequire.mockImplementation((path: string) => {
        if (path.includes('plugin1.js')) {
          return {
            default: mockPlugin1,
            author: 'Test Author',
            type: 'analyzer'
          };
        } else if (path.includes('plugin2.js')) {
          return {
            default: mockPlugin2,
            type: 'reporter'
          };
        }
        return {};
      });
      
      pluginManager.addPluginDirectory('/plugins');
      
      const discoveredPlugins = await pluginManager.discoverPlugins();
      
      expect(fs.pathExists).toHaveBeenCalledWith('/plugins');
      expect(fs.readdir).toHaveBeenCalledWith('/plugins');
      
      expect(discoveredPlugins).toHaveLength(2);
      expect(discoveredPlugins[0].name).toBe('mock-plugin-1');
      expect(discoveredPlugins[0].type).toBe('analyzer');
      expect(discoveredPlugins[0].author).toBe('Test Author');
      expect(discoveredPlugins[1].name).toBe('mock-plugin-2');
      expect(discoveredPlugins[1].type).toBe('reporter');
    });
    
    it('should handle errors when discovering plugins', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      (fs.pathExists as jest.Mock).mockRejectedValueOnce(new Error('Directory error'));
      
      pluginManager.addPluginDirectory('/error-plugins');
      
      const discoveredPlugins = await pluginManager.discoverPlugins();
      
      expect(discoveredPlugins).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error discovering plugins in /error-plugins:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
    
    it('should handle errors when loading individual plugins', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockRequire.mockImplementationOnce(() => {
        throw new Error('Plugin load error');
      });
      
      pluginManager.addPluginDirectory('/plugins');
      
      await pluginManager.discoverPlugins();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error loading plugin from /plugins/plugin1.js:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('registerPlugin', () => {
    it('should register a plugin', () => {
      const mockPlugin = new MockPlugin1();
      
      pluginManager.registerPlugin(mockPlugin, { enabled: true, config: { option1: 'value1' } });
      
      // @ts-ignore - Accessing private property for testing
      expect(pluginManager.plugins.get('mock-plugin-1')).toBe(mockPlugin);
      // @ts-ignore - Accessing private property for testing
      expect(pluginManager.pluginMetadata.get('mock-plugin-1')).toEqual({
        name: 'mock-plugin-1',
        description: 'Mock plugin 1 for testing',
        version: '1.0.0',
        type: 'utility',
        path: 'custom',
        enabled: true
      });
      // @ts-ignore - Accessing private property for testing
      expect(pluginManager.pluginConfigs.get('mock-plugin-1')).toEqual({ option1: 'value1' });
    });
    
    it('should update existing plugin metadata if already registered', () => {
      const mockPlugin = new MockPlugin1();
      
      // Register with initial metadata
      pluginManager.registerPlugin(mockPlugin, { enabled: false });
      
      // Register again with different enabled status
      pluginManager.registerPlugin(mockPlugin, { enabled: true });
      
      // @ts-ignore - Accessing private property for testing
      expect(pluginManager.pluginMetadata.get('mock-plugin-1')?.enabled).toBe(true);
    });
    
    it('should throw an error for invalid plugins', () => {
      const invalidPlugin = {
        name: 'invalid-plugin',
        // Missing required properties and methods
      };
      
      expect(() => {
        // @ts-ignore - Testing with invalid plugin
        pluginManager.registerPlugin(invalidPlugin);
      }).toThrow('Invalid plugin: invalid-plugin');
    });
  });
  
  describe('enablePlugin and disablePlugin', () => {
    it('should enable a plugin', () => {
      const mockPlugin = new MockPlugin1();
      
      pluginManager.registerPlugin(mockPlugin, { enabled: false });
      pluginManager.enablePlugin('mock-plugin-1');
      
      // @ts-ignore - Accessing private property for testing
      expect(pluginManager.pluginMetadata.get('mock-plugin-1')?.enabled).toBe(true);
      expect(mockConfigManager.update).toHaveBeenCalled();
    });
    
    it('should disable a plugin', () => {
      const mockPlugin = new MockPlugin1();
      
      pluginManager.registerPlugin(mockPlugin, { enabled: true });
      pluginManager.disablePlugin('mock-plugin-1');
      
      // @ts-ignore - Accessing private property for testing
      expect(pluginManager.pluginMetadata.get('mock-plugin-1')?.enabled).toBe(false);
      expect(mockConfigManager.update).toHaveBeenCalled();
    });
  });
  
  describe('getPlugins, getEnabledPlugins, and getPluginsByType', () => {
    beforeEach(() => {
      const mockPlugin1 = new MockPlugin1();
      const mockPlugin2 = new MockPlugin2();
      
      // @ts-ignore - Setting private properties for testing
      pluginManager.pluginMetadata.set('mock-plugin-1', {
        name: 'mock-plugin-1',
        description: 'Mock plugin 1 for testing',
        version: '1.0.0',
        type: 'analyzer',
        path: 'custom',
        enabled: true
      });
      
      // @ts-ignore - Setting private properties for testing
      pluginManager.pluginMetadata.set('mock-plugin-2', {
        name: 'mock-plugin-2',
        description: 'Mock plugin 2 for testing',
        version: '1.0.0',
        type: 'reporter',
        path: 'custom',
        enabled: false
      });
    });
    
    it('should get all plugins', () => {
      const plugins = pluginManager.getPlugins();
      
      expect(plugins).toHaveLength(2);
      expect(plugins[0].name).toBe('mock-plugin-1');
      expect(plugins[1].name).toBe('mock-plugin-2');
    });
    
    it('should get enabled plugins', () => {
      const enabledPlugins = pluginManager.getEnabledPlugins();
      
      expect(enabledPlugins).toHaveLength(1);
      expect(enabledPlugins[0].name).toBe('mock-plugin-1');
    });
    
    it('should get plugins by type', () => {
      const analyzerPlugins = pluginManager.getPluginsByType('analyzer');
      const reporterPlugins = pluginManager.getPluginsByType('reporter');
      
      expect(analyzerPlugins).toHaveLength(1);
      expect(analyzerPlugins[0].name).toBe('mock-plugin-1');
      
      expect(reporterPlugins).toHaveLength(1);
      expect(reporterPlugins[0].name).toBe('mock-plugin-2');
    });
  });
  
  describe('executePlugins', () => {
    it('should execute enabled plugins of a specific type', async () => {
      const mockPlugin1 = new MockPlugin1();
      const mockPlugin2 = new MockPlugin2();
      
      const initializeSpy1 = jest.spyOn(mockPlugin1, 'initialize');
      const executeSpy1 = jest.spyOn(mockPlugin1, 'execute');
      const initializeSpy2 = jest.spyOn(mockPlugin2, 'initialize');
      const executeSpy2 = jest.spyOn(mockPlugin2, 'execute');
      
      // Register plugins
      pluginManager.registerPlugin(mockPlugin1, { enabled: true, config: { option1: 'value1' } });
      pluginManager.registerPlugin(mockPlugin2, { enabled: false });
      
      // @ts-ignore - Setting private properties for testing
      pluginManager.pluginMetadata.get('mock-plugin-1')!.type = 'analyzer';
      // @ts-ignore - Setting private properties for testing
      pluginManager.pluginMetadata.get('mock-plugin-2')!.type = 'analyzer';
      
      const context: PluginContext = { datasets: [] };
      const results = await pluginManager.executePlugins('analyzer', context);
      
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({ result: 'plugin1-result' });
      
      expect(initializeSpy1).toHaveBeenCalledWith({ option1: 'value1' });
      expect(executeSpy1).toHaveBeenCalledWith(context);
      
      expect(initializeSpy2).not.toHaveBeenCalled();
      expect(executeSpy2).not.toHaveBeenCalled();
    });
    
    it('should handle errors when executing plugins', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const mockPlugin = new MockPlugin1();
      jest.spyOn(mockPlugin, 'execute').mockImplementation(() => {
        throw new Error('Plugin execution error');
      });
      
      pluginManager.registerPlugin(mockPlugin, { enabled: true });
      
      // @ts-ignore - Setting private properties for testing
      pluginManager.pluginMetadata.get('mock-plugin-1')!.type = 'analyzer';
      
      const results = await pluginManager.executePlugins('analyzer', { datasets: [] });
      
      expect(results).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error executing plugin mock-plugin-1:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('loadEnabledPlugins', () => {
    it('should load enabled plugins from configuration', async () => {
      // Setup mock plugin modules
      const mockPlugin1 = new MockPlugin1();
      
      mockRequire.mockImplementation(() => ({
        default: mockPlugin1
      }));
      
      // @ts-ignore - Setting private properties for testing
      pluginManager.pluginMetadata.set('mock-plugin-1', {
        name: 'mock-plugin-1',
        description: 'Mock plugin 1 for testing',
        version: '1.0.0',
        type: 'analyzer',
        path: '/plugins/mock-plugin-1.js',
        enabled: false
      });
      
      await pluginManager.loadEnabledPlugins();
      
      // @ts-ignore - Accessing private property for testing
      expect(pluginManager.plugins.get('mock-plugin-1')).toBeDefined();
      // @ts-ignore - Accessing private property for testing
      expect(pluginManager.pluginMetadata.get('mock-plugin-1')?.enabled).toBe(true);
    });
    
    it('should handle errors when loading plugins', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockRequire.mockImplementation(() => {
        throw new Error('Plugin load error');
      });
      
      // @ts-ignore - Setting private properties for testing
      pluginManager.pluginMetadata.set('mock-plugin-1', {
        name: 'mock-plugin-1',
        description: 'Mock plugin 1 for testing',
        version: '1.0.0',
        type: 'analyzer',
        path: '/plugins/mock-plugin-1.js',
        enabled: false
      });
      
      await pluginManager.loadEnabledPlugins();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error loading plugin mock-plugin-1:',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });
});