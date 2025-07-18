"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateRenderer = void 0;
const TemplateAST_1 = require("./TemplateAST");
const ContextManager_1 = require("./ContextManager");
/**
 * Template Renderer class
 * Responsible for rendering templates using the AST and context manager
 */
class TemplateRenderer {
    /**
     * Create a new TemplateRenderer instance
     * @param contextManager Context manager instance
     */
    constructor(contextManager) {
        this.defaultOptions = {
            debugMode: false,
            strictMode: false,
            maxIterations: 1000
        };
        this.contextManager = contextManager || new ContextManager_1.ContextManager();
    }
    /**
     * Render a template AST with data
     * @param ast Template AST to render
     * @param data Data to use for rendering
     * @param options Render options
     * @returns Rendered template
     */
    render(ast, data, options = {}) {
        // Merge options with defaults
        const mergedOptions = { ...this.defaultOptions, ...options };
        // Create render context
        const context = this.contextManager.createContext(data, mergedOptions.debugMode);
        // Add helpers to context if provided
        if (mergedOptions.helpers) {
            context.helpers = mergedOptions.helpers;
        }
        // Render the AST
        return this.renderNode(ast, context, mergedOptions);
    }
    /**
     * Render a node in the AST
     * @param node Node to render
     * @param context Render context
     * @param options Render options
     * @returns Rendered node
     * @private
     */
    renderNode(node, context, options) {
        if (options.debugMode) {
            console.log(`[TEMPLATE DEBUG] Rendering node of type: ${node.type}`);
        }
        switch (node.type) {
            case TemplateAST_1.TemplateNodeType.ROOT:
                return this.renderRoot(node, context, options);
            case TemplateAST_1.TemplateNodeType.TEXT:
                return this.renderText(node, context, options);
            case TemplateAST_1.TemplateNodeType.VARIABLE:
                return this.renderVariable(node, context, options);
            case TemplateAST_1.TemplateNodeType.EACH:
                return this.renderEach(node, context, options);
            case TemplateAST_1.TemplateNodeType.IF:
                return this.renderIf(node, context, options);
            case TemplateAST_1.TemplateNodeType.HELPER:
                return this.renderHelper(node, context, options);
            default:
                if (options.strictMode) {
                    throw new Error(`Unknown node type: ${node.type}`);
                }
                return '';
        }
    }
    /**
     * Render a root node
     * @param node Root node to render
     * @param context Render context
     * @param options Render options
     * @returns Rendered root node
     * @private
     */
    renderRoot(node, context, options) {
        if (!node.children || node.children.length === 0) {
            return '';
        }
        // Render each child node and join the results
        return node.children.map(child => this.renderNode(child, context, options)).join('');
    }
    /**
     * Render a text node
     * @param node Text node to render
     * @param context Render context
     * @param options Render options
     * @returns Rendered text node
     * @private
     */
    renderText(node, context, options) {
        return node.content;
    }
    /**
     * Render a variable node
     * @param node Variable node to render
     * @param context Render context
     * @param options Render options
     * @returns Rendered variable node
     * @private
     */
    renderVariable(node, context, options) {
        // Handle special case for this.property syntax
        if (node.path.startsWith('this.')) {
            const property = node.path.substring(5); // Remove 'this.' prefix
            const currentScope = context.scopes[context.scopes.length - 1];
            if (currentScope && typeof currentScope === 'object') {
                const value = this.getNestedProperty(currentScope, property.split('.'));
                if (value !== undefined && value !== null) {
                    return this.valueToString(value);
                }
            }
            if (options.strictMode) {
                throw new Error(`Property not found: ${property} in this`);
            }
            return '';
        }
        // Resolve the variable
        const value = this.contextManager.resolveVariable(context, node.path);
        if (value === undefined || value === null) {
            if (options.strictMode) {
                throw new Error(`Variable not found: ${node.path}`);
            }
            return '';
        }
        return this.valueToString(value);
    }
    /**
     * Convert a value to a string
     * @param value Value to convert
     * @returns String representation of the value
     * @private
     */
    valueToString(value) {
        // Convert the value to a string
        if (typeof value === 'object') {
            try {
                return JSON.stringify(value);
            }
            catch (error) {
                return '[Object]';
            }
        }
        return String(value);
    }
    /**
     * Get a nested property from an object
     * @param obj Object to get property from
     * @param propertyChain Chain of properties to access
     * @returns The property value or undefined if not found
     * @private
     */
    getNestedProperty(obj, propertyChain) {
        if (!obj || propertyChain.length === 0) {
            return undefined;
        }
        let value = obj;
        for (const prop of propertyChain) {
            if (value === undefined || value === null) {
                return undefined;
            }
            value = value[prop];
        }
        return value;
    }
    /**
     * Render an each node
     * @param node Each node to render
     * @param context Render context
     * @param options Render options
     * @returns Rendered each node
     * @private
     */
    renderEach(node, context, options) {
        // Resolve the array to iterate over
        const array = this.contextManager.resolveVariable(context, node.items);
        if (!array) {
            if (options.strictMode) {
                throw new Error(`Array not found: ${node.items}`);
            }
            return '';
        }
        if (!Array.isArray(array)) {
            if (options.strictMode) {
                throw new Error(`Not an array: ${node.items}`);
            }
            return '';
        }
        if (array.length === 0) {
            return '';
        }
        // Check if we've exceeded the maximum number of iterations
        if (options.maxIterations && array.length > options.maxIterations) {
            if (options.strictMode) {
                throw new Error(`Array exceeds maximum iterations: ${array.length} > ${options.maxIterations}`);
            }
            if (options.debugMode) {
                console.log(`[TEMPLATE DEBUG] Array exceeds maximum iterations: ${array.length} > ${options.maxIterations}`);
            }
        }
        // Render each item in the array
        const results = [];
        for (let i = 0; i < array.length; i++) {
            if (options.maxIterations && i >= options.maxIterations) {
                break;
            }
            const item = array[i];
            if (options.debugMode) {
                console.log(`[TEMPLATE DEBUG] Iterating array item ${i}:`, item);
            }
            // Push the item as a new scope
            const itemContext = this.contextManager.pushScope(context, item);
            // Render the children with the item context
            const result = node.children.map(child => this.renderNode(child, itemContext, options)).join('');
            results.push(result);
        }
        return results.join('');
    }
    /**
     * Render an if node
     * @param node If node to render
     * @param context Render context
     * @param options Render options
     * @returns Rendered if node
     * @private
     */
    renderIf(node, context, options) {
        // Resolve the condition
        const condition = this.contextManager.resolveVariable(context, node.condition);
        if (options.debugMode) {
            console.log(`[TEMPLATE DEBUG] Evaluating condition: ${node.condition} = ${condition}`);
        }
        // Evaluate the condition
        if (this.evaluateCondition(condition)) {
            // Render the children
            return node.children.map(child => this.renderNode(child, context, options)).join('');
        }
        else if (node.else) {
            // Render the else children
            return node.else.map((child) => this.renderNode(child, context, options)).join('');
        }
        return '';
    }
    /**
     * Render a helper node
     * @param node Helper node to render
     * @param context Render context
     * @param options Render options
     * @returns Rendered helper node
     * @private
     */
    renderHelper(node, context, options) {
        if (!context.helpers) {
            if (options.strictMode) {
                throw new Error(`Helper not found: ${node.name}`);
            }
            return '';
        }
        const helper = context.helpers.get(node.name);
        if (!helper) {
            if (options.strictMode) {
                throw new Error(`Helper not found: ${node.name}`);
            }
            return '';
        }
        try {
            // Execute the helper
            return helper.execute(node.args, context);
        }
        catch (error) {
            if (options.strictMode) {
                throw error;
            }
            if (options.debugMode) {
                console.error(`[TEMPLATE DEBUG] Error executing helper ${node.name}:`, error);
            }
            return '';
        }
    }
    /**
     * Evaluate a condition for if nodes
     * @param condition Condition to evaluate
     * @returns Whether the condition is truthy
     * @private
     */
    evaluateCondition(condition) {
        // Handle common falsy values
        if (condition === undefined || condition === null || condition === false || condition === '') {
            return false;
        }
        // Handle arrays - always truthy in JavaScript, even if empty
        if (Array.isArray(condition)) {
            return true;
        }
        // Handle objects - always truthy in JavaScript, even if empty
        if (typeof condition === 'object') {
            return true;
        }
        // Handle numbers
        if (typeof condition === 'number') {
            return condition !== 0;
        }
        // Handle strings
        if (typeof condition === 'string') {
            // Check for string representations of false
            const lowerCase = condition.toLowerCase();
            if (lowerCase === 'false' || lowerCase === '0' || lowerCase === 'no' || lowerCase === 'n') {
                return false;
            }
        }
        // Default to truthy
        return true;
    }
}
exports.TemplateRenderer = TemplateRenderer;
//# sourceMappingURL=TemplateRenderer.js.map