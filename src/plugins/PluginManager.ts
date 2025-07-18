// Plugin Manager for Network Performance Analyzer
import path from "path";
import fs from "fs-extra";
import { ConfigurationManager } from "../config/ConfigurationManager";

/**
 * Plugin interface that all plugins must implement
 */
export interface Plugin {
  /**
   * Unique name of the plugin
   */
  name: string;

  /**
   * Description of the plugin functionality
   */
  description: string;

  /**
   * Version of the plugin
   */
  version: string;

  /**
   * Initialize the plugin with configuration
   * @param config Plugin configuration
   */
  initialize(config: any): Promise<void>;

  /**
   * Execute the plugin functionality
   * @param context Context data for plugin execution
   * @returns Result of plugin execution
   */
  execute(context: PluginContext): Promise<any>;
}

/**
 * Context data provided to plugins during execution
 */
export interface PluginContext {
  /**
   * Datasets being analyzed
   */
  datasets: any[];

  /**
   * Analysis results
   */
  analysisResults?: any;

  /**
   * Report content
   */
  reportContent?: string;

  /**
   * Additional context data
   */
  [key: string]: any;
}

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  /**
   * Unique name of the plugin
   */
  name: string;

  /**
   * Description of the plugin functionality
   */
  description: string;

  /**
   * Version of the plugin
   */
  version: string;

  /**
   * Author of the plugin
   */
  author?: string;

  /**
   * Plugin type (analyzer, reporter, etc.)
   */
  type: "analyzer" | "reporter" | "parser" | "validator" | "utility";

  /**
   * Path to the plugin module
   */
  path: string;

  /**
   * Whether the plugin is enabled
   */
  enabled: boolean;
}

/**
 * Plugin registration options
 */
export interface PluginRegistrationOptions {
  /**
   * Whether to enable the plugin immediately
   */
  enabled?: boolean;

  /**
   * Plugin configuration
   */
  config?: any;
}

/**
 * Plugin Manager for loading, registering, and executing plugins
 */
export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private pluginMetadata: Map<string, PluginMetadata> = new Map();
  private pluginConfigs: Map<string, any> = new Map();
  private pluginDirectories: string[] = [];
  private configManager: ConfigurationManager;

  /**
   * Create a new PluginManager instance
   * @param configManager Configuration manager instance
   */
  constructor(configManager: ConfigurationManager) {
    this.configManager = configManager;
  }

  /**
   * Add a plugin directory to search for plugins
   * @param directory Directory path to search for plugins
   * @returns This PluginManager instance for chaining
   */
  addPluginDirectory(directory: string): PluginManager {
    if (!this.pluginDirectories.includes(directory)) {
      this.pluginDirectories.push(directory);
    }
    return this;
  }

  /**
   * Discover and load plugins from registered directories
   * @returns Promise that resolves when all plugins are discovered
   */
  async discoverPlugins(): Promise<PluginMetadata[]> {
    const discoveredPlugins: PluginMetadata[] = [];

    for (const directory of this.pluginDirectories) {
      try {
        if (await fs.pathExists(directory)) {
          const files = await fs.readdir(directory);

          for (const file of files) {
            // Only consider .js and .ts files
            if (file.endsWith(".js") || file.endsWith(".ts")) {
              const pluginPath = path.join(directory, file);

              try {
                // Try to load the plugin
                const pluginModule = require(pluginPath);

                // Check if the module exports a plugin
                if (
                  pluginModule.default &&
                  this.isValidPlugin(pluginModule.default)
                ) {
                  const plugin = pluginModule.default;

                  // Create metadata
                  const metadata: PluginMetadata = {
                    name: plugin.name,
                    description: plugin.description,
                    version: plugin.version,
                    author: pluginModule.author,
                    type: pluginModule.type || "utility",
                    path: pluginPath,
                    enabled: false,
                  };

                  discoveredPlugins.push(metadata);
                  this.pluginMetadata.set(plugin.name, metadata);
                }
              } catch (error) {
                console.error(
                  `Error loading plugin from ${pluginPath}:`,
                  error
                );
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error discovering plugins in ${directory}:`, error);
      }
    }

    return discoveredPlugins;
  }

  /**
   * Register a plugin
   * @param plugin Plugin instance to register
   * @param options Plugin registration options
   * @returns This PluginManager instance for chaining
   */
  registerPlugin(
    plugin: Plugin,
    options: PluginRegistrationOptions = {}
  ): PluginManager {
    if (!this.isValidPlugin(plugin)) {
      throw new Error(`Invalid plugin: ${(plugin as any).name || "unknown"}`);
    }

    // Store plugin instance
    this.plugins.set(plugin.name, plugin);

    // Create metadata if not already exists
    if (!this.pluginMetadata.has(plugin.name)) {
      this.pluginMetadata.set(plugin.name, {
        name: plugin.name,
        description: plugin.description,
        version: plugin.version,
        type: "utility",
        path: "custom",
        enabled: options.enabled || false,
      });
    } else {
      // Update enabled status
      const metadata = this.pluginMetadata.get(plugin.name)!;
      metadata.enabled =
        options.enabled !== undefined ? options.enabled : metadata.enabled;
    }

    // Store plugin configuration
    if (options.config) {
      this.pluginConfigs.set(plugin.name, options.config);
    }

    return this;
  }

  /**
   * Enable a plugin
   * @param pluginName Name of the plugin to enable
   * @returns This PluginManager instance for chaining
   */
  enablePlugin(pluginName: string): PluginManager {
    const metadata = this.pluginMetadata.get(pluginName);

    if (metadata) {
      metadata.enabled = true;

      // Update configuration
      const pluginConfig = this.configManager.getSection("plugins");
      if (
        pluginConfig &&
        pluginConfig.enabled &&
        !pluginConfig.enabled.includes(pluginName)
      ) {
        pluginConfig.enabled.push(pluginName);
        this.configManager.update({ plugins: pluginConfig });
      }
    }

    return this;
  }

  /**
   * Disable a plugin
   * @param pluginName Name of the plugin to disable
   * @returns This PluginManager instance for chaining
   */
  disablePlugin(pluginName: string): PluginManager {
    const metadata = this.pluginMetadata.get(pluginName);

    if (metadata) {
      metadata.enabled = false;

      // Update configuration
      const pluginConfig = this.configManager.getSection("plugins");
      if (pluginConfig && pluginConfig.enabled) {
        const index = pluginConfig.enabled.indexOf(pluginName);
        if (index !== -1) {
          pluginConfig.enabled.splice(index, 1);
          this.configManager.update({ plugins: pluginConfig });
        }
      }
    }

    return this;
  }

  /**
   * Get all registered plugins
   * @returns Array of plugin metadata
   */
  getPlugins(): PluginMetadata[] {
    return Array.from(this.pluginMetadata.values());
  }

  /**
   * Get enabled plugins
   * @returns Array of enabled plugin metadata
   */
  getEnabledPlugins(): PluginMetadata[] {
    return Array.from(this.pluginMetadata.values()).filter(
      (metadata) => metadata.enabled
    );
  }

  /**
   * Get plugins by type
   * @param type Plugin type
   * @returns Array of plugin metadata matching the type
   */
  getPluginsByType(type: string): PluginMetadata[] {
    return Array.from(this.pluginMetadata.values()).filter(
      (metadata) => metadata.type === type
    );
  }

  /**
   * Execute all enabled plugins of a specific type
   * @param type Plugin type to execute
   * @param context Context data for plugin execution
   * @returns Promise that resolves with the results of all plugin executions
   */
  async executePlugins(type: string, context: PluginContext): Promise<any[]> {
    const results: any[] = [];
    const enabledPlugins = this.getEnabledPlugins().filter(
      (metadata) => metadata.type === type
    );

    for (const metadata of enabledPlugins) {
      try {
        const plugin = this.plugins.get(metadata.name);

        if (plugin) {
          // Initialize plugin with configuration
          const config =
            this.pluginConfigs.get(metadata.name) ||
            this.configManager.getSection("plugins")?.config?.[metadata.name];

          await plugin.initialize(config);

          // Execute plugin
          const result = await plugin.execute(context);
          results.push(result);
        }
      } catch (error) {
        console.error(`Error executing plugin ${metadata.name}:`, error);
      }
    }

    return results;
  }

  /**
   * Load enabled plugins from configuration
   * @returns Promise that resolves when all enabled plugins are loaded
   */
  async loadEnabledPlugins(): Promise<void> {
    const pluginConfig = this.configManager.getSection("plugins");

    if (pluginConfig && pluginConfig.enabled) {
      for (const pluginName of pluginConfig.enabled) {
        const metadata = this.pluginMetadata.get(pluginName);

        if (metadata && metadata.path !== "custom") {
          try {
            // Load the plugin module
            const pluginModule = require(metadata.path);

            if (
              pluginModule.default &&
              this.isValidPlugin(pluginModule.default)
            ) {
              const plugin = pluginModule.default;

              // Register the plugin
              this.registerPlugin(plugin, {
                enabled: true,
                config: pluginConfig.config?.[pluginName],
              });
            }
          } catch (error) {
            console.error(`Error loading plugin ${pluginName}:`, error);
          }
        }
      }
    }
  }

  /**
   * Check if an object is a valid plugin
   * @param obj Object to check
   * @returns True if the object is a valid plugin
   * @private
   */
  private isValidPlugin(obj: any): obj is Plugin {
    return (
      obj &&
      typeof obj.name === "string" &&
      typeof obj.description === "string" &&
      typeof obj.version === "string" &&
      typeof obj.initialize === "function" &&
      typeof obj.execute === "function"
    );
  }
}
