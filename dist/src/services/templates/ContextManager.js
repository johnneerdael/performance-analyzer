"use strict";
/**
 * Context management system for template rendering
 * Handles variable scoping and resolution for template rendering
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextManager = void 0;
/**
 * Context Manager class
 * Responsible for managing render contexts and resolving variables
 */
class ContextManager {
    /**
     * Create a new render context with the provided data
     * @param data Data to use for rendering
     * @param debugMode Whether to enable debug mode
     * @returns New render context
     */
    createContext(data, debugMode = false) {
        return {
            data,
            scopes: [data], // Initialize with root data as the first scope
            debugMode
        };
    }
    /**
     * Push a new scope onto the context's scope stack
     * @param context Current render context
     * @param scopeData Data for the new scope
     * @returns Updated render context
     */
    pushScope(context, scopeData) {
        // Create a new scopes array with the new scope added
        const newScopes = [...context.scopes, scopeData];
        // Return a new context with the updated scopes
        return {
            ...context,
            scopes: newScopes
        };
    }
    /**
     * Pop the top scope from the context's scope stack
     * @param context Current render context
     * @returns Updated render context
     */
    popScope(context) {
        // Ensure there's at least one scope left
        if (context.scopes.length <= 1) {
            throw new Error('Cannot pop the root scope from the context');
        }
        // Create a new scopes array with the top scope removed
        const newScopes = context.scopes.slice(0, -1);
        // Return a new context with the updated scopes
        return {
            ...context,
            scopes: newScopes
        };
    }
    /**
     * Resolve a variable path in the current context
     * @param context Current render context
     * @param path Path to the variable (dot notation)
     * @returns Resolved value or undefined if not found
     */
    resolveVariable(context, path) {
        // Handle special case for 'this'
        if (path === 'this') {
            const currentScope = context.scopes[context.scopes.length - 1];
            if (context.debugMode) {
                this.debugLog('Resolved "this" to current scope', {
                    path,
                    value: currentScope,
                    source: 'current',
                    scope: currentScope
                });
            }
            return currentScope;
        }
        // Split the path by dots to get the property chain
        const parts = path.split('.');
        // Try to resolve from current scope first
        const currentScope = context.scopes[context.scopes.length - 1];
        const fromCurrent = this.getNestedValue(currentScope, parts);
        if (fromCurrent !== undefined) {
            if (context.debugMode) {
                this.debugLog('Resolved from current scope', {
                    path,
                    value: fromCurrent,
                    source: 'current',
                    scope: currentScope
                });
            }
            return fromCurrent;
        }
        // Try to resolve from parent scopes
        for (let i = context.scopes.length - 2; i >= 0; i--) {
            const parentScope = context.scopes[i];
            const fromParent = this.getNestedValue(parentScope, parts);
            if (fromParent !== undefined) {
                if (context.debugMode) {
                    this.debugLog(`Resolved from parent scope at level ${i}`, {
                        path,
                        value: fromParent,
                        source: 'parent',
                        scope: parentScope
                    });
                }
                return fromParent;
            }
        }
        // Try to resolve from root data
        const fromRoot = this.getNestedValue(context.data, parts);
        if (fromRoot !== undefined) {
            if (context.debugMode) {
                this.debugLog('Resolved from root data', {
                    path,
                    value: fromRoot,
                    source: 'root',
                    scope: context.data
                });
            }
            return fromRoot;
        }
        // Try to resolve from helpers
        if (context.helpers && parts.length === 1 && parts[0]) {
            const helperName = parts[0];
            const helper = context.helpers.get(helperName);
            if (helper) {
                if (context.debugMode) {
                    this.debugLog('Resolved to helper function', {
                        path,
                        value: helper,
                        source: 'helper',
                        scope: currentScope
                    });
                }
                return helper;
            }
        }
        // Not found
        if (context.debugMode) {
            this.debugLog('Variable not found', {
                path,
                value: undefined,
                source: 'not-found',
                scope: currentScope
            });
        }
        return undefined;
    }
    /**
     * Get a nested value from an object using a property chain
     * @param obj Object to get value from
     * @param propertyChain Chain of properties to access
     * @returns The value or undefined if not found
     * @private
     */
    getNestedValue(obj, propertyChain) {
        if (!obj)
            return undefined;
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
     * Log debug information
     * @param message Debug message
     * @param data Debug data
     * @private
     */
    debugLog(message, data) {
        console.log(`[TEMPLATE DEBUG] ${message}`);
        console.log(`  - Path: ${data.path}`);
        console.log(`  - Source: ${data.source}`);
        // Get value type
        const valueType = data.value === undefined ? 'undefined' :
            data.value === null ? 'null' :
                Array.isArray(data.value) ? 'array' :
                    typeof data.value;
        console.log(`  - Type: ${valueType}`);
        // Get value preview
        let valuePreview = this.safeStringify(data.value, 50);
        console.log(`  - Value: ${valuePreview}`);
        // Get scope preview
        let scopePreview = this.safeStringify(data.scope, 100);
        console.log(`  - Current scope: ${scopePreview}`);
    }
    /**
     * Safely stringify a value with a maximum length
     * @param value Value to stringify
     * @param maxLength Maximum length of the stringified value
     * @returns Stringified value
     * @private
     */
    safeStringify(value, maxLength) {
        if (value === undefined) {
            return 'undefined';
        }
        if (value === null) {
            return 'null';
        }
        if (typeof value !== 'object') {
            return String(value);
        }
        try {
            const json = JSON.stringify(value);
            if (json.length > maxLength) {
                return json.substring(0, maxLength) + '...';
            }
            return json;
        }
        catch (error) {
            return '[Object - Unable to stringify]';
        }
    }
}
exports.ContextManager = ContextManager;
//# sourceMappingURL=ContextManager.js.map