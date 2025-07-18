"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportTemplateManager = exports.DEFAULT_TEMPLATE = void 0;
// Report Template Manager for Network Performance Analyzer
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const TemplateParser_1 = require("./templates/TemplateParser");
const TemplateRenderer_1 = require("./templates/TemplateRenderer");
const ContextManager_1 = require("./templates/ContextManager");
/**
 * Default report template
 */
exports.DEFAULT_TEMPLATE = {
    name: 'Default Markdown Template',
    description: 'Standard markdown report template with all sections',
    format: 'markdown',
    sections: [
        {
            id: 'header',
            name: 'Report Header',
            template: '# Network Performance Analysis Report\n\n**Date:** {{date}}\n**Datasets Analyzed:** {{datasetCount}}\n\n',
            required: true,
            order: 0
        },
        {
            id: 'executive-summary',
            name: 'Executive Summary',
            template: '## Executive Summary\n\nThis report presents a comprehensive analysis of network performance across different configurations, focusing on bandwidth, latency, reliability, and DNS resolution performance.\n\n### Key Findings\n\n{{#each keyFindings}}- {{this}}\n{{/each}}\n\n### Optimal Configuration\n\nBased on the analysis, the **{{optimalConfiguration}}** configuration provides the best overall performance.\n\n### Performance Highlights\n\n{{#each performanceHighlights}}- {{this}}\n{{/each}}\n',
            required: true,
            order: 1
        },
        {
            id: 'configuration-overview',
            name: 'Configuration Overview',
            template: '## Configuration Overview\n\nThe following configurations were analyzed and ranked based on overall performance:\n\n| Rank | Configuration | Overall Score | Bandwidth Score | Latency Score | Reliability Score |\n|------|--------------|--------------|----------------|--------------|------------------|\n{{#each configurations}}| {{rank}} | {{displayName}} | {{overallScore}} | {{bandwidthScore}} | {{latencyScore}} | {{reliabilityScore}} |\n{{/each}}\n',
            required: true,
            order: 2
        },
        {
            id: 'side-by-side-comparisons',
            name: 'Side-by-Side Comparisons',
            template: '## Side-by-Side Comparisons\n\nThese tables provide direct comparisons across different configurations to help identify patterns and make informed decisions.\n\n### DNS Performance Comparison\n\nThis table provides a side-by-side comparison of DNS performance metrics across all configurations:\n\n| Configuration | Avg Response (ms) | Median Response (ms) | Success Rate (%) | Domains with >150ms |\n|---------------|------------------|----------------------|------------------|---------------------|\n{{#each dnsMetrics}}| {{displayName}} | {{avgResponseTimeMs}} | {{medianResponseTimeMs}} | {{successRate}} | {{slowDomainsCount}} |\n{{/each}}\n\n### MTU Impact Analysis\n\nThis table shows the impact of different MTU settings across DNS server implementations:\n\n| MTU Setting | Avg Bandwidth (Mbps) | Avg Latency (ms) | Jitter (ms) | Packet Loss (%) | Overall Score |\n|-------------|----------------------|------------------|-------------|-----------------|---------------|\n{{#each mtuImpactData}}| {{mtuSetting}} | {{avgBandwidth}} | {{avgLatency}} | {{jitter}} | {{packetLoss}} | {{overallScore}} |\n{{/each}}\n\n### DNS Server Implementation Comparison\n\nThis table compares the performance of different DNS server implementations across key metrics:\n\n| DNS Server | Avg Bandwidth (Mbps) | Avg Latency (ms) | DNS Response (ms) | Packet Loss (%) | Overall Score |\n|------------|----------------------|------------------|-------------------|-----------------|---------------|\n{{#each dnsServerData}}| {{server}} | {{avgBandwidth}} | {{avgLatency}} | {{dnsResponse}} | {{packetLoss}} | {{overallScore}} |\n{{/each}}\n\n### Logging Impact Analysis\n\nThis table shows the impact of logging configuration on network performance:\n\n| Logging | Avg Bandwidth (Mbps) | Avg Latency (ms) | DNS Response (ms) | Packet Loss (%) | Overall Score |\n|---------|----------------------|------------------|-------------------|-----------------|---------------|\n{{#each loggingImpactData}}| {{status}} | {{avgBandwidth}} | {{avgLatency}} | {{dnsResponse}} | {{packetLoss}} | {{overallScore}} |\n{{/each}}\n\n### Anomaly Distribution\n\nThis table summarizes the distribution of anomalies by type and severity across configurations:\n\n| Configuration | Bandwidth Anomalies | Latency Anomalies | Packet Loss Anomalies | DNS Anomalies | Total |\n|---------------|---------------------|-------------------|----------------------|---------------|-------|\n{{#each anomalyDistribution}}| {{configuration}} | {{bandwidthAnomalies}} | {{latencyAnomalies}} | {{packetLossAnomalies}} | {{dnsAnomalies}} | {{total}} |\n{{/each}}\n',
            required: true,
            order: 3
        },
        {
            id: 'bandwidth-analysis',
            name: 'Bandwidth Analysis',
            template: '## Bandwidth Performance Analysis\n\n### Bandwidth Metrics\n\nThe following table shows bandwidth performance metrics across different configurations:\n\n| Configuration | Avg (Mbps) | Median (Mbps) | Max (Mbps) | Min (Mbps) | Std Dev | 95th % | 99th % |\n|--------------|------------|---------------|------------|------------|---------|--------|--------|\n{{#each bandwidthMetrics}}| {{displayName}} | {{avgBandwidthMbps}} | {{medianBandwidthMbps}} | {{maxBandwidthMbps}} | {{minBandwidthMbps}} | {{standardDeviation}} | {{percentile95}} | {{percentile99}} |\n{{/each}}\n',
            required: false,
            order: 3
        },
        {
            id: 'latency-analysis',
            name: 'Latency Analysis',
            template: '## Latency Performance Analysis\n\n### Latency Metrics\n\nThe following table shows latency performance metrics across different configurations:\n\n| Configuration | Avg (ms) | Median (ms) | Max (ms) | Min (ms) | Jitter (ms) |\n|--------------|----------|-------------|----------|----------|-------------|\n{{#each latencyMetrics}}| {{displayName}} | {{avgLatencyMs}} | {{medianLatencyMs}} | {{maxLatencyMs}} | {{minLatencyMs}} | {{jitterMs}} |\n{{/each}}\n',
            required: false,
            order: 4
        },
        {
            id: 'dns-analysis',
            name: 'DNS Analysis',
            template: '## DNS Performance Analysis\n\n### DNS Performance Metrics\n\nThe following table shows DNS performance metrics across different configurations:\n\n| Configuration | Avg Response Time (ms) | Median Response Time (ms) | Success Rate (%) |\n|--------------|------------------------|---------------------------|------------------|\n{{#each dnsMetrics}}| {{displayName}} | {{avgResponseTimeMs}} | {{medianResponseTimeMs}} | {{successRate}} |\n{{/each}}\n\n### Slowest DNS Domains\n\nThe following table shows the 10 slowest domains by average response time:\n\n| Domain | Avg Response Time (ms) | Success Rate (%) | Query Count |\n|--------|------------------------|------------------|-------------|\n{{#each slowestDomains}}| {{domain}} | {{avgResponseTimeMs}} | {{successRate}} | {{queryCount}} |\n{{/each}}\n',
            required: false,
            order: 5
        },
        {
            id: 'anomalies',
            name: 'Performance Anomalies',
            template: '## Performance Anomalies\n\n{{#if anomalies.length}}The following performance anomalies were detected during analysis:\n\n{{#each anomalies}}### {{severity}} Severity: {{type}} Anomaly in {{displayName}}\n\n**Description:** {{description}}\n\n**Affected Metrics:**\n{{#each affectedMetrics}}- {{this}}\n{{/each}}\n\n**Recommendations:**\n{{#each recommendations}}- {{this}}\n{{/each}}\n\n{{/each}}{{else}}No significant performance anomalies were detected in the analyzed datasets.{{/if}}\n',
            required: false,
            order: 6
        },
        {
            id: 'recommendations',
            name: 'Recommendations',
            template: '## Recommendations\n\nBased on the comprehensive analysis of network performance across configurations, the following recommendations are provided:\n\n{{#each recommendations}}- {{this}}\n{{/each}}\n',
            required: true,
            order: 7
        },
        {
            id: 'footer',
            name: 'Report Footer',
            template: '\n\n---\n\n*Report generated by Network Performance Analyzer on {{timestamp}}*',
            required: true,
            order: 8
        }
    ]
};
/**
 * Report Template Manager for loading, customizing, and applying report templates
 */
class ReportTemplateManager {
    /**
     * Create a new ReportTemplateManager instance
     * @param configManager Configuration manager instance
     */
    constructor(configManager) {
        this.templates = new Map();
        this.activeTemplate = 'default';
        this.configManager = configManager;
        // Initialize template system components
        this.contextManager = new ContextManager_1.ContextManager();
        this.templateParser = new TemplateParser_1.TemplateParser();
        this.templateRenderer = new TemplateRenderer_1.TemplateRenderer(this.contextManager);
        // Register default template
        this.registerTemplate('default', exports.DEFAULT_TEMPLATE);
    }
    /**
     * Register a template
     * @param id Template ID
     * @param template Template definition
     * @returns This ReportTemplateManager instance for chaining
     */
    registerTemplate(id, template) {
        this.templates.set(id, template);
        return this;
    }
    /**
     * Load a template from a file
     * @param filePath Path to the template file
     * @param id Optional ID for the template (defaults to filename without extension)
     * @returns Promise that resolves to the loaded template
     */
    async loadTemplateFromFile(filePath, id) {
        try {
            const templateData = await fs_extra_1.default.readJson(filePath);
            const templateId = id || path_1.default.basename(filePath, path_1.default.extname(filePath));
            // Validate template
            if (!this.isValidTemplate(templateData)) {
                throw new Error(`Invalid template format in ${filePath}`);
            }
            // Register template
            this.registerTemplate(templateId, templateData);
            return templateData;
        }
        catch (error) {
            console.error(`Error loading template from ${filePath}:`, error);
            throw error;
        }
    }
    /**
     * Save a template to a file
     * @param templateId Template ID
     * @param filePath Path to save the template file
     * @returns Promise that resolves when the file is saved
     */
    async saveTemplateToFile(templateId, filePath) {
        const template = this.getTemplate(templateId);
        if (!template) {
            throw new Error(`Template not found: ${templateId}`);
        }
        try {
            // Ensure directory exists
            await fs_extra_1.default.ensureDir(path_1.default.dirname(filePath));
            // Write template to file
            await fs_extra_1.default.writeJson(filePath, template, { spaces: 2 });
            console.log(`Template saved to ${filePath}`);
        }
        catch (error) {
            console.error(`Error saving template to ${filePath}:`, error);
            throw error;
        }
    }
    /**
     * Get a template by ID
     * @param id Template ID
     * @returns The template or undefined if not found
     */
    getTemplate(id) {
        return this.templates.get(id);
    }
    /**
     * Get all registered templates
     * @returns Array of template IDs and names
     */
    getTemplates() {
        return Array.from(this.templates.entries()).map(([id, template]) => ({
            id,
            name: template.name
        }));
    }
    /**
     * Set the active template
     * @param templateId Template ID
     * @returns This ReportTemplateManager instance for chaining
     */
    setActiveTemplate(templateId) {
        if (!this.templates.has(templateId)) {
            throw new Error(`Template not found: ${templateId}`);
        }
        this.activeTemplate = templateId;
        return this;
    }
    /**
     * Get the active template
     * @returns The active template
     */
    getActiveTemplate() {
        const template = this.templates.get(this.activeTemplate);
        if (!template) {
            // Fall back to default template
            return exports.DEFAULT_TEMPLATE;
        }
        return template;
    }
    /**
     * Get template sections for the active template
     * @param includedSections Optional array of section IDs to include
     * @returns Array of template sections
     */
    getTemplateSections(includedSections) {
        const template = this.getActiveTemplate();
        let sections = template.sections;
        // Filter sections if includedSections is provided
        if (includedSections) {
            sections = sections.filter(section => section.required || includedSections.includes(section.id));
        }
        // Sort sections by order
        return sections.sort((a, b) => a.order - b.order);
    }
    /**
     * Create a custom template by modifying the active template
     * @param customizations Template customizations
     * @returns The customized template
     */
    createCustomTemplate(customizations) {
        const baseTemplate = this.getActiveTemplate();
        // Create a deep copy of the base template
        const customTemplate = JSON.parse(JSON.stringify(baseTemplate));
        // Apply customizations
        if (customizations.name)
            customTemplate.name = customizations.name;
        if (customizations.description)
            customTemplate.description = customizations.description;
        if (customizations.format)
            customTemplate.format = customizations.format;
        // Merge sections
        if (customizations.sections) {
            for (const customSection of customizations.sections) {
                const existingIndex = customTemplate.sections.findIndex(s => s.id === customSection.id);
                if (existingIndex >= 0) {
                    // Update existing section
                    customTemplate.sections[existingIndex] = {
                        ...customTemplate.sections[existingIndex],
                        ...customSection
                    };
                }
                else {
                    // Add new section
                    customTemplate.sections.push(customSection);
                }
            }
        }
        return customTemplate;
    }
    /**
     * Apply a template to generate a report
     * @param template Template to apply
     * @param data Data to use in the template
     * @returns The generated report
     */
    applyTemplate(template, data) {
        // Get included sections from configuration
        const reportConfig = this.configManager.getSection('reporting');
        const includedSections = reportConfig?.includeSections;
        // Get template sections
        const sections = this.getTemplateSections(includedSections);
        // Apply each section template
        const renderedSections = sections.map(section => {
            return this.renderTemplateSection(section.template, data);
        });
        // Join sections to create the complete report
        return renderedSections.join('\n\n');
    }
    /**
     * Render a template section with data
     * @param template Template string
     * @param data Data to use in the template
     * @returns The rendered template
     * @private
     */
    renderTemplateSection(template, data) {
        try {
            // Parse the template into an AST
            const ast = this.templateParser.parse(template);
            // Render the AST with the data
            const result = this.templateRenderer.render(ast, data, {
                debugMode: process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development'
            });
            return result;
        }
        catch (error) {
            console.error('Error rendering template section:', error);
            // Fall back to the old rendering method if there's an error
            return this.legacyRenderTemplateSection(template, data);
        }
    }
    /**
     * Legacy template rendering method (used as fallback)
     * @param template Template string
     * @param data Data to use in the template
     * @returns The rendered template
     * @private
     */
    legacyRenderTemplateSection(template, data) {
        // Simple template rendering with {{variable}} and {{#each array}}...{{/each}} support
        let result = template;
        // Replace {{variable}} with data values
        result = result.replace(/\{\{([^#\/][^}]*)\}\}/g, (match, key) => {
            const trimmedKey = key.trim();
            return this.getNestedValue(data, trimmedKey) || '';
        });
        // Handle {{#each array}}...{{/each}} loops
        result = result.replace(/\{\{#each\s+([^}]*)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayKey, content) => {
            const trimmedKey = arrayKey.trim();
            const array = this.getNestedValue(data, trimmedKey);
            console.log(`[DEBUG] Template each loop - key: ${trimmedKey}, array:`, array);
            if (!Array.isArray(array)) {
                console.log(`[DEBUG] Not an array or undefined for key: ${trimmedKey}`);
                return '';
            }
            const result = array.map(item => {
                let itemContent = content;
                console.log(`[DEBUG] Processing item:`, item, `Content template:`, content);
                // Replace {{this}} with the current item
                if (typeof item === 'object' && item !== null) {
                    try {
                        itemContent = itemContent.replace(/\{\{this\}\}/g, JSON.stringify(item));
                    }
                    catch (error) {
                        itemContent = itemContent.replace(/\{\{this\}\}/g, '[Object]');
                    }
                }
                else {
                    itemContent = itemContent.replace(/\{\{this\}\}/g, String(item));
                }
                console.log(`[DEBUG] After {{this}} replacement:`, itemContent);
                // Replace {{property}} with item properties
                itemContent = itemContent.replace(/\{\{([^#\/][^}]*)\}\}/g, (propMatch, propKey) => {
                    const trimmedPropKey = propKey.trim();
                    if (typeof item === 'object' && item !== null) {
                        const value = item[trimmedPropKey];
                        if (value !== undefined) {
                            if (typeof value === 'object' && value !== null) {
                                try {
                                    return JSON.stringify(value);
                                }
                                catch (error) {
                                    return '[Object]';
                                }
                            }
                            return String(value);
                        }
                        return '';
                    }
                    return '';
                });
                return itemContent;
            }).join('');
            console.log(`[DEBUG] Template each result for ${trimmedKey}:`, result);
            return result;
        });
        // Handle {{#if condition}}...{{else}}...{{/if}} conditionals
        result = result.replace(/\{\{#if\s+([^}]*)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g, (match, condition, ifContent, elseContent = '') => {
            const trimmedCondition = condition.trim();
            const conditionValue = this.getNestedValue(data, trimmedCondition);
            if (conditionValue) {
                return ifContent;
            }
            else {
                return elseContent;
            }
        });
        return result;
    }
    /**
     * Get a nested value from an object using dot notation
     * @param obj Object to get value from
     * @param path Path to the value using dot notation
     * @returns The value or undefined if not found
     * @private
     */
    getNestedValue(obj, path) {
        if (!obj)
            return undefined;
        const keys = path.split('.');
        let value = obj;
        for (const key of keys) {
            if (value === undefined || value === null) {
                return undefined;
            }
            value = value[key];
        }
        return value;
    }
    /**
     * Check if an object is a valid template
     * @param obj Object to check
     * @returns True if the object is a valid template
     * @private
     */
    isValidTemplate(obj) {
        return obj &&
            typeof obj.name === 'string' &&
            typeof obj.description === 'string' &&
            (obj.format === 'markdown' || obj.format === 'html' || obj.format === 'json') &&
            Array.isArray(obj.sections) &&
            obj.sections.every((section) => typeof section.id === 'string' &&
                typeof section.name === 'string' &&
                typeof section.template === 'string' &&
                typeof section.required === 'boolean' &&
                typeof section.order === 'number');
    }
    /**
     * Create a default template file if it doesn't exist
     * @param filePath Path to create the template file
     * @returns Promise that resolves when the file is created
     */
    static async createDefaultTemplate(filePath) {
        try {
            if (!await fs_extra_1.default.pathExists(filePath)) {
                // Ensure directory exists
                await fs_extra_1.default.ensureDir(path_1.default.dirname(filePath));
                // Write default template to file
                await fs_extra_1.default.writeJson(filePath, exports.DEFAULT_TEMPLATE, { spaces: 2 });
                console.log(`Default template created at ${filePath}`);
            }
        }
        catch (error) {
            console.error(`Error creating default template at ${filePath}:`, error);
            throw error;
        }
    }
}
exports.ReportTemplateManager = ReportTemplateManager;
//# sourceMappingURL=ReportTemplateManager.js.map