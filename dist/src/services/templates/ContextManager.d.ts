/**
 * Context management system for template rendering
 * Handles variable scoping and resolution for template rendering
 */
/**
 * Render context for template rendering
 * Contains the data and scope stack for variable resolution
 */
export interface RenderContext {
    /**
     * Root data object
     */
    data: any;
    /**
     * Stack of scopes for nested contexts (e.g., each loops)
     * The last item in the array is the current scope
     */
    scopes: any[];
    /**
     * Map of helper functions
     */
    helpers?: Map<string, TemplateHelper>;
    /**
     * Debug mode flag
     */
    debugMode: boolean;
}
/**
 * Template helper function interface
 */
export interface TemplateHelper {
    /**
     * Name of the helper
     */
    name: string;
    /**
     * Execute the helper function
     * @param args Arguments passed to the helper
     * @param context Current render context
     * @returns Result of the helper function
     */
    execute(args: any[], context: RenderContext): string;
}
/**
 * Variable resolution result
 */
export interface VariableResolution {
    /**
     * Path to the variable
     */
    path: string;
    /**
     * Resolved value
     */
    value: any;
    /**
     * Source of the resolution (current, parent, root, helper)
     */
    source: 'current' | 'parent' | 'root' | 'helper' | 'not-found';
    /**
     * Whether the variable was successfully resolved
     */
    resolved: boolean;
}
/**
 * Context Manager class
 * Responsible for managing render contexts and resolving variables
 */
export declare class ContextManager {
    /**
     * Create a new render context with the provided data
     * @param data Data to use for rendering
     * @param debugMode Whether to enable debug mode
     * @returns New render context
     */
    createContext(data: any, debugMode?: boolean): RenderContext;
    /**
     * Push a new scope onto the context's scope stack
     * @param context Current render context
     * @param scopeData Data for the new scope
     * @returns Updated render context
     */
    pushScope(context: RenderContext, scopeData: any): RenderContext;
    /**
     * Pop the top scope from the context's scope stack
     * @param context Current render context
     * @returns Updated render context
     */
    popScope(context: RenderContext): RenderContext;
    /**
     * Resolve a variable path in the current context
     * @param context Current render context
     * @param path Path to the variable (dot notation)
     * @returns Resolved value or undefined if not found
     */
    resolveVariable(context: RenderContext, path: string): any;
    /**
     * Get a nested value from an object using a property chain
     * @param obj Object to get value from
     * @param propertyChain Chain of properties to access
     * @returns The value or undefined if not found
     * @private
     */
    private getNestedValue;
    /**
     * Log debug information
     * @param message Debug message
     * @param data Debug data
     * @private
     */
    private debugLog;
    /**
     * Safely stringify a value with a maximum length
     * @param value Value to stringify
     * @param maxLength Maximum length of the stringified value
     * @returns Stringified value
     * @private
     */
    private safeStringify;
}
//# sourceMappingURL=ContextManager.d.ts.map