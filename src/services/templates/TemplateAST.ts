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
export enum TemplateNodeType {
  ROOT = 'root',
  TEXT = 'text',
  VARIABLE = 'variable',
  EACH = 'each',
  IF = 'if',
  HELPER = 'helper',
  COMMENT = 'comment'
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
export function isRootNode(node: TemplateASTNode): node is RootNode {
  return node.type === TemplateNodeType.ROOT;
}

/**
 * Type guard for TextNode
 */
export function isTextNode(node: TemplateASTNode): node is TextNode {
  return node.type === TemplateNodeType.TEXT;
}

/**
 * Type guard for VariableNode
 */
export function isVariableNode(node: TemplateASTNode): node is VariableNode {
  return node.type === TemplateNodeType.VARIABLE;
}

/**
 * Type guard for EachNode
 */
export function isEachNode(node: TemplateASTNode): node is EachNode {
  return node.type === TemplateNodeType.EACH;
}

/**
 * Type guard for IfNode
 */
export function isIfNode(node: TemplateASTNode): node is IfNode {
  return node.type === TemplateNodeType.IF;
}

/**
 * Type guard for HelperNode
 */
export function isHelperNode(node: TemplateASTNode): node is HelperNode {
  return node.type === TemplateNodeType.HELPER;
}

/**
 * Type guard for CommentNode
 */
export function isCommentNode(node: TemplateASTNode): node is CommentNode {
  return node.type === TemplateNodeType.COMMENT;
}

/**
 * Create a root node
 */
export function createRootNode(children: TemplateASTNode[] = []): RootNode {
  return {
    type: TemplateNodeType.ROOT,
    children
  };
}

/**
 * Create a text node
 */
export function createTextNode(content: string, location?: SourceLocation): TextNode {
  return {
    type: TemplateNodeType.TEXT,
    content,
    location
  };
}

/**
 * Create a variable node
 */
export function createVariableNode(path: string, original: string, location?: SourceLocation): VariableNode {
  return {
    type: TemplateNodeType.VARIABLE,
    path,
    original,
    location
  };
}

/**
 * Create an each node
 */
export function createEachNode(
  items: string,
  children: TemplateASTNode[] = [],
  original: string,
  item?: string,
  index?: string,
  location?: SourceLocation
): EachNode {
  return {
    type: TemplateNodeType.EACH,
    items,
    item,
    index,
    children,
    original,
    location
  };
}

/**
 * Create an if node
 */
export function createIfNode(
  condition: string,
  children: TemplateASTNode[] = [],
  original: string,
  elseChildren?: TemplateASTNode[],
  location?: SourceLocation
): IfNode {
  return {
    type: TemplateNodeType.IF,
    condition,
    children,
    else: elseChildren,
    original,
    location
  };
}

/**
 * Create a helper node
 */
export function createHelperNode(
  name: string,
  args: string[] = [],
  original: string,
  children?: TemplateASTNode[],
  location?: SourceLocation
): HelperNode {
  return {
    type: TemplateNodeType.HELPER,
    name,
    args,
    children,
    original,
    location
  };
}

/**
 * Create a comment node
 */
export function createCommentNode(content: string, original: string, location?: SourceLocation): CommentNode {
  return {
    type: TemplateNodeType.COMMENT,
    content,
    original,
    location
  };
}

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
export function createTemplateAST(children: TemplateASTNode[] = [], source: string = ''): TemplateAST {
  return {
    type: TemplateNodeType.ROOT,
    children,
    source
  };
}

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
