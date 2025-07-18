import { TemplateAST } from './TemplateAST';
import { ContextManager, TemplateHelper } from './ContextManager';
/**
 * Render options for template rendering
 */
export interface RenderOptions {
    /**
     * Whether to enable debug mode
     */
    debugMode?: boolean;
    /**
     * Whether to enable strict mode (throw errors for undefined variables)
     */
    strictMode?: boolean;
    /**
     * Maximum number of iterations for each loops
     */
    maxIterations?: number;
    /**
     * Custom helpers for template rendering
     */
    helpers?: Map<string, TemplateHelper>;
}
/**
 * Template Renderer class
 * Responsible for rendering templates using the AST and context manager
 */
export declare class TemplateRenderer {
    private contextManager;
    private defaultOptions;
    /**
     * Create a new TemplateRenderer instance
     * @param contextManager Context manager instance
     */
    constructor(contextManager?: ContextManager);
    /**
     * Render a template AST with data
     * @param ast Template AST to render
     * @param data Data to use for rendering
     * @param options Render options
     * @returns Rendered template
     */
    render(ast: TemplateAST, data: any, options?: RenderOptions): string;
    /**
     * Render a node in the AST
     * @param node Node to render
     * @param context Render context
     * @param options Render options
     * @returns Rendered node
     * @private
     */
    private renderNode;
    /**
     * Render a root node
     * @param node Root node to render
     * @param context Render context
     * @param options Render options
     * @returns Rendered root node
     * @private
     */
    private renderRoot;
    /**
     * Render a text node
     * @param node Text node to render
     * @param context Render context
     * @param options Render options
     * @returns Rendered text node
     * @private
     */
    private renderText;
    /**
     * Render a variable node
     * @param node Variable node to render
     * @param context Render context
     * @param options Render options
     * @returns Rendered variable node
     * @private
     */
    private renderVariable;
    /**
     * Convert a value to a string
     * @param value Value to convert
     * @returns String representation of the value
     * @private
     */
    private valueToString;
    /**
     * Get a nested property from an object
     * @param obj Object to get property from
     * @param propertyChain Chain of properties to access
     * @returns The property value or undefined if not found
     * @private
     */
    private getNestedProperty;
    /**
     * Render an each node
     * @param node Each node to render
     * @param context Render context
     * @param options Render options
     * @returns Rendered each node
     * @private
     */
    private renderEach;
    /**
     * Render an if node
     * @param node If node to render
     * @param context Render context
     * @param options Render options
     * @returns Rendered if node
     * @private
     */
    private renderIf;
    /**
     * Render a helper node
     * @param node Helper node to render
     * @param context Render context
     * @param options Render options
     * @returns Rendered helper node
     * @private
     */
    private renderHelper;
    /**
     * Evaluate a condition for if nodes
     * @param condition Condition to evaluate
     * @returns Whether the condition is truthy
     * @private
     */
    private evaluateCondition;
}
//# sourceMappingURL=TemplateRenderer.d.ts.map