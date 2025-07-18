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
export declare const DEFAULT_TEMPLATE: ReportTemplate;
/**
 * Report Template Manager for loading, customizing, and applying report templates
 */
export declare class ReportTemplateManager {
    private templates;
    private configManager;
    private activeTemplate;
    private templateParser;
    private templateRenderer;
    private contextManager;
    /**
     * Create a new ReportTemplateManager instance
     * @param configManager Configuration manager instance
     */
    constructor(configManager: ConfigurationManager);
    /**
     * Register a template
     * @param id Template ID
     * @param template Template definition
     * @returns This ReportTemplateManager instance for chaining
     */
    registerTemplate(id: string, template: ReportTemplate): ReportTemplateManager;
    /**
     * Load a template from a file
     * @param filePath Path to the template file
     * @param id Optional ID for the template (defaults to filename without extension)
     * @returns Promise that resolves to the loaded template
     */
    loadTemplateFromFile(filePath: string, id?: string): Promise<ReportTemplate>;
    /**
     * Save a template to a file
     * @param templateId Template ID
     * @param filePath Path to save the template file
     * @returns Promise that resolves when the file is saved
     */
    saveTemplateToFile(templateId: string, filePath: string): Promise<void>;
    /**
     * Get a template by ID
     * @param id Template ID
     * @returns The template or undefined if not found
     */
    getTemplate(id: string): ReportTemplate | undefined;
    /**
     * Get all registered templates
     * @returns Array of template IDs and names
     */
    getTemplates(): Array<{
        id: string;
        name: string;
    }>;
    /**
     * Set the active template
     * @param templateId Template ID
     * @returns This ReportTemplateManager instance for chaining
     */
    setActiveTemplate(templateId: string): ReportTemplateManager;
    /**
     * Get the active template
     * @returns The active template
     */
    getActiveTemplate(): ReportTemplate;
    /**
     * Get template sections for the active template
     * @param includedSections Optional array of section IDs to include
     * @returns Array of template sections
     */
    getTemplateSections(includedSections?: string[]): TemplateSection[];
    /**
     * Create a custom template by modifying the active template
     * @param customizations Template customizations
     * @returns The customized template
     */
    createCustomTemplate(customizations: Partial<ReportTemplate>): ReportTemplate;
    /**
     * Apply a template to generate a report
     * @param template Template to apply
     * @param data Data to use in the template
     * @returns The generated report
     */
    applyTemplate(template: ReportTemplate, data: any): string;
    /**
     * Render a template section with data
     * @param template Template string
     * @param data Data to use in the template
     * @returns The rendered template
     * @private
     */
    private renderTemplateSection;
    /**
     * Legacy template rendering method (used as fallback)
     * @param template Template string
     * @param data Data to use in the template
     * @returns The rendered template
     * @private
     */
    private legacyRenderTemplateSection;
    /**
     * Get a nested value from an object using dot notation
     * @param obj Object to get value from
     * @param path Path to the value using dot notation
     * @returns The value or undefined if not found
     * @private
     */
    private getNestedValue;
    /**
     * Check if an object is a valid template
     * @param obj Object to check
     * @returns True if the object is a valid template
     * @private
     */
    private isValidTemplate;
    /**
     * Create a default template file if it doesn't exist
     * @param filePath Path to create the template file
     * @returns Promise that resolves when the file is created
     */
    static createDefaultTemplate(filePath: string): Promise<void>;
}
//# sourceMappingURL=ReportTemplateManager.d.ts.map