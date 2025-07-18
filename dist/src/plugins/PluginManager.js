"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginManager = void 0;
// Plugin Manager for Network Performance Analyzer
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
/**
 * Plugin Manager for loading, registering, and executing plugins
 */
class PluginManager {
    /**
     * Create a new PluginManager instance
     * @param configManager Configuration manager instance
     */
    constructor(configManager) {
        this.plugins = new Map();
        this.pluginMetadata = new Map();
        this.pluginConfigs = new Map();
        this.pluginDirectories = [];
        this.configManager = configManager;
    }
    /**
     * Add a plugin directory to search for plugins
     * @param directory Directory path to search for plugins
     * @returns This PluginManager instance for chaining
     */
    addPluginDirectory(directory) {
        if (!this.pluginDirectories.includes(directory)) {
            this.pluginDirectories.push(directory);
        }
        return this;
    }
    /**
     * Discover and load plugins from registered directories
     * @returns Promise that resolves when all plugins are discovered
     */
    async discoverPlugins() {
        const discoveredPlugins = [];
        for (const directory of this.pluginDirectories) {
            try {
                if (await fs_extra_1.default.pathExists(directory)) {
                    const files = await fs_extra_1.default.readdir(directory);
                    for (const file of files) {
                        // Only consider .js and .ts files
                        if (file.endsWith(".js") || file.endsWith(".ts")) {
                            const pluginPath = path_1.default.join(directory, file);
                            try {
                                // Try to load the plugin
                                const pluginModule = require(pluginPath);
                                // Check if the module exports a plugin
                                if (pluginModule.default &&
                                    this.isValidPlugin(pluginModule.default)) {
                                    const plugin = pluginModule.default;
                                    // Create metadata
                                    const metadata = {
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
                            }
                            catch (error) {
                                console.error(`Error loading plugin from ${pluginPath}:`, error);
                            }
                        }
                    }
                }
            }
            catch (error) {
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
    registerPlugin(plugin, options = {}) {
        if (!this.isValidPlugin(plugin)) {
            throw new Error(`Invalid plugin: ${plugin.name || "unknown"}`);
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
        }
        else {
            // Update enabled status
            const metadata = this.pluginMetadata.get(plugin.name);
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
    enablePlugin(pluginName) {
        const metadata = this.pluginMetadata.get(pluginName);
        if (metadata) {
            metadata.enabled = true;
            // Update configuration
            const pluginConfig = this.configManager.getSection("plugins");
            if (pluginConfig &&
                pluginConfig.enabled &&
                !pluginConfig.enabled.includes(pluginName)) {
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
    disablePlugin(pluginName) {
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
    getPlugins() {
        return Array.from(this.pluginMetadata.values());
    }
    /**
     * Get enabled plugins
     * @returns Array of enabled plugin metadata
     */
    getEnabledPlugins() {
        return Array.from(this.pluginMetadata.values()).filter((metadata) => metadata.enabled);
    }
    /**
     * Get plugins by type
     * @param type Plugin type
     * @returns Array of plugin metadata matching the type
     */
    getPluginsByType(type) {
        return Array.from(this.pluginMetadata.values()).filter((metadata) => metadata.type === type);
    }
    /**
     * Execute all enabled plugins of a specific type
     * @param type Plugin type to execute
     * @param context Context data for plugin execution
     * @returns Promise that resolves with the results of all plugin executions
     */
    async executePlugins(type, context) {
        const results = [];
        const enabledPlugins = this.getEnabledPlugins().filter((metadata) => metadata.type === type);
        for (const metadata of enabledPlugins) {
            try {
                const plugin = this.plugins.get(metadata.name);
                if (plugin) {
                    // Initialize plugin with configuration
                    const config = this.pluginConfigs.get(metadata.name) ||
                        this.configManager.getSection("plugins")?.config?.[metadata.name];
                    await plugin.initialize(config);
                    // Execute plugin
                    const result = await plugin.execute(context);
                    results.push(result);
                }
            }
            catch (error) {
                console.error(`Error executing plugin ${metadata.name}:`, error);
            }
        }
        return results;
    }
    /**
     * Load enabled plugins from configuration
     * @returns Promise that resolves when all enabled plugins are loaded
     */
    async loadEnabledPlugins() {
        const pluginConfig = this.configManager.getSection("plugins");
        if (pluginConfig && pluginConfig.enabled) {
            for (const pluginName of pluginConfig.enabled) {
                const metadata = this.pluginMetadata.get(pluginName);
                if (metadata && metadata.path !== "custom") {
                    try {
                        // Load the plugin module
                        const pluginModule = require(metadata.path);
                        if (pluginModule.default &&
                            this.isValidPlugin(pluginModule.default)) {
                            const plugin = pluginModule.default;
                            // Register the plugin
                            this.registerPlugin(plugin, {
                                enabled: true,
                                config: pluginConfig.config?.[pluginName],
                            });
                        }
                    }
                    catch (error) {
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
    isValidPlugin(obj) {
        return (obj &&
            typeof obj.name === "string" &&
            typeof obj.description === "string" &&
            typeof obj.version === "string" &&
            typeof obj.initialize === "function" &&
            typeof obj.execute === "function");
    }
}
exports.PluginManager = PluginManager;
//# sourceMappingURL=PluginManager.js.map