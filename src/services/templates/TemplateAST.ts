// Template AST (Abstract Syntax Tree) for structured template representation
import { TemplateNode } from './TemplateNode';

/**
 * Interface for Template AST (Abstract Syntax Tree)
 * Represents the parsed structure of a template
 */
export interface TemplateAST {
  /**
   * Root node of the AST
   */
  root: TemplateNode;
  
  /**
   * Source template string
   */
  source: string;
  
  /**
   * Metadata about the template
   */
  metadata?: {
    /**
     * Template name or identifier
     */
    name?: string;
    
    /**
     * Template version
     */
    version?: string;
    
    /**
     * Template author
     */
    author?: string;
    
    /**
     * Template description
     */
    description?: string;
  };
}

/**
 * Create a new Template AST
 * @param root Root node of the AST
 * @param source Source template string
 * @param metadata Metadata about the template
 * @returns A new Template AST
 */
export function createTemplateAST(
  root: TemplateNode,
  source: string,
  metadata?: TemplateAST['metadata']
): TemplateAST {
  return {
    root,
    source,
    metadata
  };
}

/**
 * Check if an object is a valid Template AST
 * @param obj Object to check
 * @returns True if the object is a valid Template AST
 */
export function isTemplateAST(obj: any): obj is TemplateAST {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.root &&
    typeof obj.source === 'string'
  );
}

/**
 * Clone a Template AST
 * @param ast Template AST to clone
 * @returns A deep copy of the Template AST
 */
export function cloneTemplateAST(ast: TemplateAST): TemplateAST {
  return JSON.parse(JSON.stringify(ast));
}

/**
 * Get a string representation of a Template AST
 * @param ast Template AST to stringify
 * @returns A string representation of the Template AST
 */
export function stringifyTemplateAST(ast: TemplateAST): string {
  return JSON.stringify(ast, null, 2);
}

/**
 * Parse a string representation of a Template AST
 * @param str String representation of a Template AST
 * @returns The parsed Template AST
 */
export function parseTemplateAST(str: string): TemplateAST {
  return JSON.parse(str);
}

/**
 * Get the source template string from a Template AST
 * @param ast Template AST
 * @returns The source template string
 */
export function getTemplateSource(ast: TemplateAST): string {
  return ast.source;
}

/**
 * Get the root node of a Template AST
 * @param ast Template AST
 * @returns The root node
 */
export function getTemplateRoot(ast: TemplateAST): TemplateNode {
  return ast.root;
}

/**
 * Get the metadata of a Template AST
 * @param ast Template AST
 * @returns The metadata
 */
export function getTemplateMetadata(ast: TemplateAST): TemplateAST['metadata'] {
  return ast.metadata;
}

/**
 * Set the metadata of a Template AST
 * @param ast Template AST
 * @param metadata Metadata to set
 * @returns The updated Template AST
 */
export function setTemplateMetadata(
  ast: TemplateAST,
  metadata: TemplateAST['metadata']
): TemplateAST {
  return {
    ...ast,
    metadata
  };
}

/**
 * Update the metadata of a Template AST
 * @param ast Template AST
 * @param metadata Metadata to update
 * @returns The updated Template AST
 */
export function updateTemplateMetadata(
  ast: TemplateAST,
  metadata: Partial<NonNullable<TemplateAST['metadata']>>
): TemplateAST {
  return {
    ...ast,
    metadata: {
      ...ast.metadata,
      ...metadata
    }
  };
}

/**
 * Transform a Template AST using a visitor pattern
 * @param ast Template AST to transform
 * @param visitor Visitor function to apply to each node
 * @returns The transformed Template AST
 */
export function transformTemplateAST(
  ast: TemplateAST,
  visitor: (node: TemplateNode) => TemplateNode
): TemplateAST {
  function transform(node: TemplateNode): TemplateNode {
    // Apply visitor to this node
    const transformedNode = visitor(node);
    
    // Transform children if they exist
    if (transformedNode.children && transformedNode.children.length > 0) {
      transformedNode.children = transformedNode.children.map(transform);
    }
    
    return transformedNode;
  }
  
  return {
    ...ast,
    root: transform(ast.root)
  };
}

/**
 * Validate a Template AST
 * @param ast Template AST to validate
 * @returns True if the AST is valid
 */
export function validateTemplateAST(ast: TemplateAST): boolean {
  // Check if the AST is a valid object
  if (!isTemplateAST(ast)) {
    return false;
  }
  
  // Check if the root node is valid
  if (!ast.root) {
    return false;
  }
  
  // Check if the source is a string
  if (typeof ast.source !== 'string') {
    return false;
  }
  
  // Additional validation can be added here
  
  return true;
}
