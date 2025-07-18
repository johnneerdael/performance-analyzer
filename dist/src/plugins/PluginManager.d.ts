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
export declare class PluginManager {
    private plugins;
    private pluginMetadata;
    private pluginConfigs;
    private pluginDirectories;
    private configManager;
    /**
     * Create a new PluginManager instance
     * @param configManager Configuration manager instance
     */
    constructor(configManager: ConfigurationManager);
    /**
     * Add a plugin directory to search for plugins
     * @param directory Directory path to search for plugins
     * @returns This PluginManager instance for chaining
     */
    addPluginDirectory(directory: string): PluginManager;
    /**
     * Discover and load plugins from registered directories
     * @returns Promise that resolves when all plugins are discovered
     */
    discoverPlugins(): Promise<PluginMetadata[]>;
    /**
     * Register a plugin
     * @param plugin Plugin instance to register
     * @param options Plugin registration options
     * @returns This PluginManager instance for chaining
     */
    registerPlugin(plugin: Plugin, options?: PluginRegistrationOptions): PluginManager;
    /**
     * Enable a plugin
     * @param pluginName Name of the plugin to enable
     * @returns This PluginManager instance for chaining
     */
    enablePlugin(pluginName: string): PluginManager;
    /**
     * Disable a plugin
     * @param pluginName Name of the plugin to disable
     * @returns This PluginManager instance for chaining
     */
    disablePlugin(pluginName: string): PluginManager;
    /**
     * Get all registered plugins
     * @returns Array of plugin metadata
     */
    getPlugins(): PluginMetadata[];
    /**
     * Get enabled plugins
     * @returns Array of enabled plugin metadata
     */
    getEnabledPlugins(): PluginMetadata[];
    /**
     * Get plugins by type
     * @param type Plugin type
     * @returns Array of plugin metadata matching the type
     */
    getPluginsByType(type: string): PluginMetadata[];
    /**
     * Execute all enabled plugins of a specific type
     * @param type Plugin type to execute
     * @param context Context data for plugin execution
     * @returns Promise that resolves with the results of all plugin executions
     */
    executePlugins(type: string, context: PluginContext): Promise<any[]>;
    /**
     * Load enabled plugins from configuration
     * @returns Promise that resolves when all enabled plugins are loaded
     */
    loadEnabledPlugins(): Promise<void>;
    /**
     * Check if an object is a valid plugin
     * @param obj Object to check
     * @returns True if the object is a valid plugin
     * @private
     */
    private isValidPlugin;
}
//# sourceMappingURL=PluginManager.d.ts.map