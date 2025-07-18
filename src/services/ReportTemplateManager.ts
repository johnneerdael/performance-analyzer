// Report Template Manager for Network Performance Analyzer
import fs from 'fs-extra';
import path from 'path';
import { ConfigurationManager } from '../config/ConfigurationManager';

/**
 * Template section definition
 */
export interface TemplateSection {
  /**
   * Unique ID of the section
   */
  id: string;
  
  /**
   * Display name of the section
   */
  name: string;
  
  /**
   * Template content for the section
   */
  template: string;
  
  /**
   * Whether the section is required
   */
  required: boolean;
  
  /**
   * Order of the section in the report
   */
  order: number;
}

/**
 * Report template definition
 */
export interface ReportTemplate {
  /**
   * Template name
   */
  name: string;
  
  /**
   * Template description
   */
  description: string;
  
  /**
   * Template format (markdown, html, json)
   */
  format: 'markdown' | 'html' | 'json';
  
  /**
   * Template sections
   */
  sections: TemplateSection[];
}

/**
 * Default report template
 */
export const DEFAULT_TEMPLATE: ReportTemplate = {
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
      template: '## Configuration Overview\n\nThe following configurations were analyzed and ranked based on overall performance:\n\n| Rank | Configuration | Overall Score | Bandwidth Score | Latency Score | Reliability Score |\n|------|--------------|--------------|----------------|--------------|------------------|\n{{#each configurations}}| {{rank}} | {{configuration}} | {{overallScore}} | {{bandwidthScore}} | {{latencyScore}} | {{reliabilityScore}} |\n{{/each}}\n',
      required: true,
      order: 2
    },
    {
      id: 'bandwidth-analysis',
      name: 'Bandwidth Analysis',
      template: '## Bandwidth Performance Analysis\n\n### Bandwidth Metrics\n\nThe following table shows bandwidth performance metrics across different configurations:\n\n| Configuration | Avg (Mbps) | Median (Mbps) | Max (Mbps) | Min (Mbps) | Std Dev | 95th % | 99th % |\n|--------------|------------|---------------|------------|------------|---------|--------|--------|\n{{#each bandwidthMetrics}}| {{configuration}} | {{avgBandwidthMbps}} | {{medianBandwidthMbps}} | {{maxBandwidthMbps}} | {{minBandwidthMbps}} | {{standardDeviation}} | {{percentile95}} | {{percentile99}} |\n{{/each}}\n',
      required: false,
      order: 3
    },
    {
      id: 'latency-analysis',
      name: 'Latency Analysis',
      template: '## Latency Performance Analysis\n\n### Latency Metrics\n\nThe following table shows latency performance metrics across different configurations:\n\n| Configuration | Avg (ms) | Median (ms) | Max (ms) | Min (ms) | Jitter (ms) |\n|--------------|----------|-------------|----------|----------|-------------|\n{{#each latencyMetrics}}| {{configuration}} | {{avgLatencyMs}} | {{medianLatencyMs}} | {{maxLatencyMs}} | {{minLatencyMs}} | {{jitterMs}} |\n{{/each}}\n',
      required: false,
      order: 4
    },
    {
      id: 'dns-analysis',
      name: 'DNS Analysis',
      template: '## DNS Performance Analysis\n\n### DNS Performance Metrics\n\nThe following table shows DNS performance metrics across different configurations:\n\n| Configuration | Avg Response Time (ms) | Median Response Time (ms) | Success Rate (%) |\n|--------------|------------------------|---------------------------|------------------|\n{{#each dnsMetrics}}| {{configuration}} | {{avgResponseTimeMs}} | {{medianResponseTimeMs}} | {{successRate}} |\n{{/each}}\n\n### Slowest DNS Domains\n\nThe following table shows the 10 slowest domains by average response time:\n\n| Domain | Avg Response Time (ms) | Success Rate (%) | Query Count |\n|--------|------------------------|------------------|-------------|\n{{#each slowestDomains}}| {{domain}} | {{avgResponseTimeMs}} | {{successRate}} | {{queryCount}} |\n{{/each}}\n',
      required: false,
      order: 5
    },
    {
      id: 'anomalies',
      name: 'Performance Anomalies',
      template: '## Performance Anomalies\n\n{{#if anomalies.length}}The following performance anomalies were detected during analysis:\n\n{{#each anomalies}}### {{severity}} Severity: {{type}} Anomaly in {{configuration}}\n\n**Description:** {{description}}\n\n**Affected Metrics:**\n{{#each affectedMetrics}}- {{this}}\n{{/each}}\n\n**Recommendations:**\n{{#each recommendations}}- {{this}}\n{{/each}}\n\n{{/each}}{{else}}No significant performance anomalies were detected in the analyzed datasets.{{/if}}\n',
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
export class ReportTemplateManager {
  private templates: Map<string, ReportTemplate> = new Map();
  private configManager: ConfigurationManager;
  private activeTemplate: string = 'default';
  
  /**
   * Create a new ReportTemplateManager instance
   * @param configManager Configuration manager instance
   */
  constructor(configManager: ConfigurationManager) {
    this.configManager = configManager;
    
    // Register default template
    this.registerTemplate('default', DEFAULT_TEMPLATE);
  }
  
  /**
   * Register a template
   * @param id Template ID
   * @param template Template definition
   * @returns This ReportTemplateManager instance for chaining
   */
  registerTemplate(id: string, template: ReportTemplate): ReportTemplateManager {
    this.templates.set(id, template);
    return this;
  }
  
  /**
   * Load a template from a file
   * @param filePath Path to the template file
   * @param id Optional ID for the template (defaults to filename without extension)
   * @returns Promise that resolves to the loaded template
   */
  async loadTemplateFromFile(filePath: string, id?: string): Promise<ReportTemplate> {
    try {
      const templateData = await fs.readJson(filePath);
      const templateId = id || path.basename(filePath, path.extname(filePath));
      
      // Validate template
      if (!this.isValidTemplate(templateData)) {
        throw new Error(`Invalid template format in ${filePath}`);
      }
      
      // Register template
      this.registerTemplate(templateId, templateData);
      
      return templateData;
    } catch (error) {
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
  async saveTemplateToFile(templateId: string, filePath: string): Promise<void> {
    const template = this.getTemplate(templateId);
    
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    
    try {
      // Ensure directory exists
      await fs.ensureDir(path.dirname(filePath));
      
      // Write template to file
      await fs.writeJson(filePath, template, { spaces: 2 });
      
      console.log(`Template saved to ${filePath}`);
    } catch (error) {
      console.error(`Error saving template to ${filePath}:`, error);
      throw error;
    }
  }
  
  /**
   * Get a template by ID
   * @param id Template ID
   * @returns The template or undefined if not found
   */
  getTemplate(id: string): ReportTemplate | undefined {
    return this.templates.get(id);
  }
  
  /**
   * Get all registered templates
   * @returns Array of template IDs and names
   */
  getTemplates(): Array<{ id: string; name: string }> {
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
  setActiveTemplate(templateId: string): ReportTemplateManager {
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
  getActiveTemplate(): ReportTemplate {
    const template = this.templates.get(this.activeTemplate);
    
    if (!template) {
      // Fall back to default template
      return DEFAULT_TEMPLATE;
    }
    
    return template;
  }
  
  /**
   * Get template sections for the active template
   * @param includedSections Optional array of section IDs to include
   * @returns Array of template sections
   */
  getTemplateSections(includedSections?: string[]): TemplateSection[] {
    const template = this.getActiveTemplate();
    let sections = template.sections;
    
    // Filter sections if includedSections is provided
    if (includedSections) {
      sections = sections.filter(section => 
        section.required || includedSections.includes(section.id)
      );
    }
    
    // Sort sections by order
    return sections.sort((a, b) => a.order - b.order);
  }
  
  /**
   * Create a custom template by modifying the active template
   * @param customizations Template customizations
   * @returns The customized template
   */
  createCustomTemplate(customizations: Partial<ReportTemplate>): ReportTemplate {
    const baseTemplate = this.getActiveTemplate();
    
    // Create a deep copy of the base template
    const customTemplate: ReportTemplate = JSON.parse(JSON.stringify(baseTemplate));
    
    // Apply customizations
    if (customizations.name) customTemplate.name = customizations.name;
    if (customizations.description) customTemplate.description = customizations.description;
    if (customizations.format) customTemplate.format = customizations.format;
    
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
        } else {
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
  applyTemplate(template: ReportTemplate, data: any): string {
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
  private renderTemplateSection(template: string, data: any): string {
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
      
      if (!Array.isArray(array)) {
        return '';
      }
      
      return array.map(item => {
        let itemContent = content;
        
        // Replace {{this}} with the current item
        itemContent = itemContent.replace(/\{\{this\}\}/g, String(item));
        
        // Replace {{property}} with item properties
        itemContent = itemContent.replace(/\{\{([^#\/][^}]*)\}\}/g, (propMatch: string, propKey: string) => {
          const trimmedPropKey = propKey.trim();
          
          if (typeof item === 'object' && item !== null) {
            return item[trimmedPropKey] !== undefined ? String(item[trimmedPropKey]) : '';
          }
          
          return '';
        });
        
        return itemContent;
      }).join('');
    });
    
    // Handle {{#if condition}}...{{else}}...{{/if}} conditionals
    result = result.replace(/\{\{#if\s+([^}]*)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g, (match, condition, ifContent, elseContent = '') => {
      const trimmedCondition = condition.trim();
      const conditionValue = this.getNestedValue(data, trimmedCondition);
      
      if (conditionValue) {
        return ifContent;
      } else {
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
  private getNestedValue(obj: any, path: string): any {
    if (!obj) return undefined;
    
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
  private isValidTemplate(obj: any): obj is ReportTemplate {
    return obj &&
           typeof obj.name === 'string' &&
           typeof obj.description === 'string' &&
           (obj.format === 'markdown' || obj.format === 'html' || obj.format === 'json') &&
           Array.isArray(obj.sections) &&
           obj.sections.every((section: any) => 
             typeof section.id === 'string' &&
             typeof section.name === 'string' &&
             typeof section.template === 'string' &&
             typeof section.required === 'boolean' &&
             typeof section.order === 'number'
           );
  }
  
  /**
   * Create a default template file if it doesn't exist
   * @param filePath Path to create the template file
   * @returns Promise that resolves when the file is created
   */
  static async createDefaultTemplate(filePath: string): Promise<void> {
    try {
      if (!await fs.pathExists(filePath)) {
        // Ensure directory exists
        await fs.ensureDir(path.dirname(filePath));
        
        // Write default template to file
        await fs.writeJson(filePath, DEFAULT_TEMPLATE, { spaces: 2 });
        
        console.log(`Default template created at ${filePath}`);
      }
    } catch (error) {
      console.error(`Error creating default template at ${filePath}:`, error);
      throw error;
    }
  }
}