/**
 * Template AST interfaces for structured template representation
 */
/**
 * Base interface for all AST nodes
 */
export interface TemplateASTNode {
    /**
     * Type of the node
     */
    type: TemplateNodeType;
    /**
     * Source location information
     */
    location?: SourceLocation;
}
/**
 * Types of template nodes
 */
export declare enum TemplateNodeType {
    ROOT = "root",
    TEXT = "text",
    VARIABLE = "variable",
    EACH = "each",
    IF = "if",
    HELPER = "helper",
    COMMENT = "comment"
}
/**
 * Source location information for error reporting
 */
export interface SourceLocation {
    /**
     * Start position in the source template
     */
    start: number;
    /**
     * End position in the source template
     */
    end: number;
    /**
     * Line number (1-based)
     */
    line: number;
    /**
     * Column number (1-based)
     */
    column: number;
}
/**
 * Root node of the template AST
 */
export interface RootNode extends TemplateASTNode {
    type: TemplateNodeType.ROOT;
    /**
     * Child nodes
     */
    children: TemplateASTNode[];
}
/**
 * Text node representing static text content
 */
export interface TextNode extends TemplateASTNode {
    type: TemplateNodeType.TEXT;
    /**
     * Text content
     */
    content: string;
}
/**
 * Variable node representing a variable placeholder
 */
export interface VariableNode extends TemplateASTNode {
    type: TemplateNodeType.VARIABLE;
    /**
     * Variable path (e.g., "user.name", "items.0.id")
     */
    path: string;
    /**
     * Original expression including braces (e.g., "{{user.name}}")
     */
    original: string;
}
/**
 * Each node representing a loop block
 */
export interface EachNode extends TemplateASTNode {
    type: TemplateNodeType.EACH;
    /**
     * Array path to iterate over
     */
    items: string;
    /**
     * Optional variable name for the current item (defaults to "this")
     */
    item?: string;
    /**
     * Optional variable name for the current index
     */
    index?: string;
    /**
     * Child nodes within the each block
     */
    children: TemplateASTNode[];
    /**
     * Original expression including braces (e.g., "{{#each items}}")
     */
    original: string;
}
/**
 * If node representing a conditional block
 */
export interface IfNode extends TemplateASTNode {
    type: TemplateNodeType.IF;
    /**
     * Condition expression
     */
    condition: string;
    /**
     * Child nodes for the true branch
     */
    children: TemplateASTNode[];
    /**
     * Child nodes for the false branch (else block)
     */
    else?: TemplateASTNode[];
    /**
     * Original expression including braces (e.g., "{{#if condition}}")
     */
    original: string;
}
/**
 * Helper node representing a helper function call
 */
export interface HelperNode extends TemplateASTNode {
    type: TemplateNodeType.HELPER;
    /**
     * Helper name
     */
    name: string;
    /**
     * Helper arguments
     */
    args: string[];
    /**
     * Child nodes within the helper block (for block helpers)
     */
    children?: TemplateASTNode[];
    /**
     * Original expression including braces (e.g., "{{formatDate date 'YYYY-MM-DD'}}")
     */
    original: string;
}
/**
 * Comment node representing a comment in the template
 */
export interface CommentNode extends TemplateASTNode {
    type: TemplateNodeType.COMMENT;
    /**
     * Comment content
     */
    content: string;
    /**
     * Original expression including braces (e.g., "{{!-- comment --}}")
     */
    original: string;
}
/**
 * Type guard for RootNode
 */
export declare function isRootNode(node: TemplateASTNode): node is RootNode;
/**
 * Type guard for TextNode
 */
export declare function isTextNode(node: TemplateASTNode): node is TextNode;
/**
 * Type guard for VariableNode
 */
export declare function isVariableNode(node: TemplateASTNode): node is VariableNode;
/**
 * Type guard for EachNode
 */
export declare function isEachNode(node: TemplateASTNode): node is EachNode;
/**
 * Type guard for IfNode
 */
export declare function isIfNode(node: TemplateASTNode): node is IfNode;
/**
 * Type guard for HelperNode
 */
export declare function isHelperNode(node: TemplateASTNode): node is HelperNode;
/**
 * Type guard for CommentNode
 */
export declare function isCommentNode(node: TemplateASTNode): node is CommentNode;
/**
 * Create a root node
 */
export declare function createRootNode(children?: TemplateASTNode[]): RootNode;
/**
 * Create a text node
 */
export declare function createTextNode(content: string, location?: SourceLocation): TextNode;
/**
 * Create a variable node
 */
export declare function createVariableNode(path: string, original: string, location?: SourceLocation): VariableNode;
/**
 * Create an each node
 */
export declare function createEachNode(items: string, children: TemplateASTNode[], original: string, item?: string, index?: string, location?: SourceLocation): EachNode;
/**
 * Create an if node
 */
export declare function createIfNode(condition: string, children: TemplateASTNode[], original: string, elseChildren?: TemplateASTNode[], location?: SourceLocation): IfNode;
/**
 * Create a helper node
 */
export declare function createHelperNode(name: string, args: string[], original: string, children?: TemplateASTNode[], location?: SourceLocation): HelperNode;
/**
 * Create a comment node
 */
export declare function createCommentNode(content: string, original: string, location?: SourceLocation): CommentNode;
/**
 * Template AST interface - represents the entire AST
 * Note: This is a simplified version that directly extends RootNode
 * to maintain compatibility with existing code
 */
export interface TemplateAST extends RootNode {
    /**
     * Original template string
     */
    source: string;
}
/**
 * Create a template AST
 */
export declare function createTemplateAST(children?: TemplateASTNode[], source?: string): TemplateAST;
/**
 * Validation result for template validation
 */
export interface ValidationResult {
    /**
     * Whether the template is valid
     */
    isValid: boolean;
    /**
     * Errors found during validation
     */
    errors: TemplateError[];
    /**
     * Warnings found during validation
     */
    warnings: TemplateWarning[];
}
/**
 * Template error
 */
export interface TemplateError {
    /**
     * Error type
     */
    type: 'syntax' | 'runtime' | 'data';
    /**
     * Error message
     */
    message: string;
    /**
     * Line number where the error occurred
     */
    line?: number;
    /**
     * Column number where the error occurred
     */
    column?: number;
    /**
     * Context around the error
     */
    context?: string;
}
/**
 * Template warning
 */
export interface TemplateWarning {
    /**
     * Warning type
     */
    type: 'performance' | 'deprecated' | 'best-practice';
    /**
     * Warning message
     */
    message: string;
    /**
     * Suggestion for fixing the warning
     */
    suggestion?: string;
}
/**
 * Token for lexical analysis
 */
export interface Token {
    /**
     * Token type
     */
    type: 'text' | 'expression' | 'block-start' | 'block-end' | 'comment';
    /**
     * Token value
     */
    value: string;
    /**
     * Start position in the source
     */
    start: number;
    /**
     * End position in the source
     */
    end: number;
    /**
     * Line number
     */
    line: number;
    /**
     * Column number
     */
    column: number;
}
//# sourceMappingURL=TemplateAST.d.ts.map