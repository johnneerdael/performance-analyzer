/**
 * Template parser for generating AST from template strings
 */
import {
  TemplateAST,
  TemplateASTNode,
  TemplateNodeType,
  RootNode,
  TextNode,
  VariableNode,
  EachNode,
  IfNode,
  HelperNode,
  CommentNode,
  createRootNode,
  createTextNode,
  createVariableNode,
  createEachNode,
  createIfNode,
  createHelperNode,
  createCommentNode,
  createTemplateAST,
  ValidationResult,
  TemplateError,
  TemplateWarning,
  Token,
  SourceLocation
} from './TemplateAST';

/**
 * Template parser class
 */
export class TemplateParser {
  /**
   * Parse a template string into an AST
   * @param template Template string to parse
   * @returns The parsed template AST
   */
  parse(template: string): TemplateAST {
    // Tokenize the template
    const tokens = this.tokenize(template);
    
    // Parse the tokens into an AST
    const ast = this.parseTokens(tokens, template);
    
    return ast;
  }
  
  /**
   * Validate a template string
   * @param template Template string to validate
   * @returns Validation result
   */
  validate(template: string): ValidationResult {
    const errors: TemplateError[] = [];
    const warnings: TemplateWarning[] = [];
    
    try {
      // Tokenize the template
      const tokens = this.tokenize(template);
      
      // Check for unclosed tags
      this.validateTagBalance(tokens, errors);
      
      // Check for invalid expressions
      this.validateExpressions(tokens, errors, warnings);
      
      // Check for nested blocks
      this.validateBlockNesting(tokens, errors, warnings);
      
      // Parse the tokens into an AST (this will catch syntax errors)
      try {
        this.parseTokens(tokens, template);
      } catch (error) {
        if (error instanceof Error) {
          errors.push({
            type: 'syntax',
            message: error.message,
            context: template
          });
        }
      }
      
      // Check for performance issues
      this.checkPerformance(template, warnings);
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      if (error instanceof Error) {
        errors.push({
          type: 'syntax',
          message: error.message,
          context: template
        });
      }
      
      return {
        isValid: false,
        errors,
        warnings
      };
    }
  }
  
  /**
   * Tokenize a template string
   * @param template Template string to tokenize
   * @returns Array of tokens
   * @private
   */
  private tokenize(template: string): Token[] {
    const tokens: Token[] = [];
    let position = 0;
    let line = 1;
    let column = 1;
    
    // Regular expressions for matching template syntax
    const tagRegex = /\{\{([^}]*)\}\}/g;
    const blockStartRegex = /^\s*#(\w+)\s+(.+?)(?:\s+as\s+(\w+))?(?:\s+index\s+as\s+(\w+))?\s*$/;
    const blockEndRegex = /^\s*\/(\w+)\s*$/;
    const elseRegex = /^\s*else\s*$/;
    const commentRegex = /^\s*!--\s*([\s\S]*?)\s*--\s*$/;
    
    // Reset regex
    tagRegex.lastIndex = 0;
    
    let match;
    let lastIndex = 0;
    
    // Find all tags in the template
    while ((match = tagRegex.exec(template)) !== null) {
      const startIndex = match.index;
      const endIndex = tagRegex.lastIndex;
      
      // Add text before the tag
      if (startIndex > lastIndex) {
        const text = template.substring(lastIndex, startIndex);
        const textLocation = this.calculateLocation(template, lastIndex, startIndex);
        tokens.push({
          type: 'text',
          value: text,
          start: lastIndex,
          end: startIndex,
          line: textLocation.line,
          column: textLocation.column
        });
        
        // Update line and column
        for (const char of text) {
          if (char === '\n') {
            line++;
            column = 1;
          } else {
            column++;
          }
        }
      }
      
      // Process the tag content
      const tagContent = match[1] || '';
      
      // Check if it's a comment
      const commentMatch = tagContent.match(commentRegex);
      if (commentMatch && commentMatch[1]) {
        tokens.push({
          type: 'comment',
          value: commentMatch[1],
          start: startIndex,
          end: endIndex,
          line,
          column
        });
      }
      // Check if it's a block start tag
      else if (tagContent.startsWith('#')) {
        const blockMatch = tagContent.match(blockStartRegex);
        if (blockMatch) {
          const blockType = blockMatch[1] || ''; // each, if, with, etc.
          const expression = blockMatch[2] || ''; // items, condition, etc.
          const itemName = blockMatch[3]; // Optional item name for each
          const indexName = blockMatch[4]; // Optional index name for each
          
          tokens.push({
            type: 'block-start',
            value: tagContent,
            blockType,
            expression,
            itemName,
            indexName,
            start: startIndex,
            end: endIndex,
            line,
            column
          } as unknown as Token);
        } else {
          // Invalid block tag
          tokens.push({
            type: 'expression',
            value: tagContent,
            start: startIndex,
            end: endIndex,
            line,
            column
          });
        }
      }
      // Check if it's a block end tag
      else if (tagContent.startsWith('/')) {
        const blockMatch = tagContent.match(blockEndRegex);
        if (blockMatch) {
          const blockType = blockMatch[1] || ''; // each, if, with, etc.
          
          tokens.push({
            type: 'block-end',
            value: tagContent,
            blockType,
            start: startIndex,
            end: endIndex,
            line,
            column
          } as unknown as Token);
        } else {
          // Invalid block end tag
          tokens.push({
            type: 'expression',
            value: tagContent,
            start: startIndex,
            end: endIndex,
            line,
            column
          });
        }
      }
      // Check if it's an else tag
      else if (tagContent.match(elseRegex)) {
        tokens.push({
          type: 'expression', // Change to expression type to avoid type errors
          value: tagContent,
          start: startIndex,
          end: endIndex,
          line,
          column,
          isElse: true // Add a custom property to identify else tags
        } as unknown as Token);
      }
      // Otherwise it's a variable or helper
      else {
        tokens.push({
          type: 'expression',
          value: tagContent.trim(),
          start: startIndex,
          end: endIndex,
          line,
          column
        });
      }
      
      // Update position
      lastIndex = endIndex;
      
      // Update line and column for the tag
      for (const char of match[0]) {
        if (char === '\n') {
          line++;
          column = 1;
        } else {
          column++;
        }
      }
    }
    
    // Add remaining text
    if (lastIndex < template.length) {
      const text = template.substring(lastIndex);
      const textLocation = this.calculateLocation(template, lastIndex, template.length);
      tokens.push({
        type: 'text',
        value: text,
        start: lastIndex,
        end: template.length,
        line: textLocation.line,
        column: textLocation.column
      });
    }
    
    return tokens;
  }
  
  /**
   * Calculate source location for error reporting
   * @param template Template string
   * @param start Start index
   * @param end End index
   * @returns Source location
   * @private
   */
  private calculateLocation(template: string, start: number, end: number): SourceLocation {
    let line = 1;
    let column = 1;
    
    for (let i = 0; i < start; i++) {
      if (template[i] === '\n') {
        line++;
        column = 1;
      } else {
        column++;
      }
    }
    
    return {
      start,
      end,
      line,
      column
    };
  }
  
  /**
   * Parse tokens into an AST
   * @param tokens Tokens to parse
   * @param template Original template string
   * @returns Template AST
   * @private
   */
  private parseTokens(tokens: Token[], template: string): TemplateAST {
    const root = createRootNode();
    const stack: TemplateASTNode[] = [root];
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (!token) continue;
      
      // Special handling for else tags
      if (token.type === 'expression' && (token as any).isElse) {
        const current = stack[stack.length - 1];
        if (!current) continue;
        
        if (current.type === TemplateNodeType.IF) {
          // Create the else branch if it doesn't exist
          if (!(current as IfNode).else) {
            (current as IfNode).else = [];
          }
          
          // Switch to the else branch - but don't add the else tag itself to the children
          stack.pop();
          const elseIfNode = {
            type: TemplateNodeType.IF,
            condition: (current as IfNode).condition,
            original: (current as IfNode).original,
            location: (current as IfNode).location,
            children: (current as IfNode).else as TemplateASTNode[]
          };
          stack.push(elseIfNode as TemplateASTNode);
          continue; // Skip the normal token processing
        } else {
          throw new Error(`Unexpected else tag at line ${token.line}, column ${token.column}`);
        }
      }
      
      const current = stack[stack.length - 1];
      if (!current) continue;
      
      switch (token.type) {
        case 'text':
          if (current.type === TemplateNodeType.ROOT || 
              current.type === TemplateNodeType.EACH || 
              current.type === TemplateNodeType.IF || 
              current.type === TemplateNodeType.HELPER) {
            const textNode = createTextNode(token.value, {
              start: token.start,
              end: token.end,
              line: token.line,
              column: token.column
            });
            (current as RootNode | EachNode | IfNode | HelperNode).children.push(textNode);
          }
          break;
          
        case 'expression':
          if (current.type === TemplateNodeType.ROOT || 
              current.type === TemplateNodeType.EACH || 
              current.type === TemplateNodeType.IF || 
              current.type === TemplateNodeType.HELPER) {
            // Check if it's a helper call or a variable
            const helperMatch = token.value.match(/^(\w+)\s+(.+)$/);
            if (helperMatch && helperMatch[1] && helperMatch[2]) {
              // It's a helper call
              const helperName = helperMatch[1];
              const argsString = helperMatch[2];
              const args = this.parseHelperArgs(argsString);
              
              const helperNode = createHelperNode(
                helperName,
                args,
                `{{${token.value}}}`,
                undefined,
                {
                  start: token.start,
                  end: token.end,
                  line: token.line,
                  column: token.column
                }
              );
              
              (current as RootNode | EachNode | IfNode | HelperNode).children.push(helperNode);
            } else {
              // It's a variable
              const variableNode = createVariableNode(
                token.value,
                `{{${token.value}}}`,
                {
                  start: token.start,
                  end: token.end,
                  line: token.line,
                  column: token.column
                }
              );
              
              (current as RootNode | EachNode | IfNode | HelperNode).children.push(variableNode);
            }
          }
          break;
          
        case 'block-start':
          if (current.type === TemplateNodeType.ROOT || 
              current.type === TemplateNodeType.EACH || 
              current.type === TemplateNodeType.IF || 
              current.type === TemplateNodeType.HELPER) {
            const blockType = (token as any).blockType;
            const expression = (token as any).expression;
            
            if (blockType === 'each') {
              const eachNode = createEachNode(
                expression,
                [],
                `{{#each ${expression}}}`,
                (token as any).itemName,
                (token as any).indexName,
                {
                  start: token.start,
                  end: token.end,
                  line: token.line,
                  column: token.column
                }
              );
              
              (current as RootNode | EachNode | IfNode | HelperNode).children.push(eachNode);
              stack.push(eachNode);
            } else if (blockType === 'if') {
              const ifNode = createIfNode(
                expression,
                [],
                `{{#if ${expression}}}`,
                undefined,
                {
                  start: token.start,
                  end: token.end,
                  line: token.line,
                  column: token.column
                }
              );
              
              (current as RootNode | EachNode | IfNode | HelperNode).children.push(ifNode);
              stack.push(ifNode);
            } else {
              // Custom block helper
              const helperNode = createHelperNode(
                blockType,
                [expression],
                `{{#${blockType} ${expression}}}`,
                [],
                {
                  start: token.start,
                  end: token.end,
                  line: token.line,
                  column: token.column
                }
              );
              
              (current as RootNode | EachNode | IfNode | HelperNode).children.push(helperNode);
              stack.push(helperNode);
            }
          }
          break;
          
        case 'block-end':
          const blockType = (token as any).blockType;
          
          if (blockType === 'each' && current.type === TemplateNodeType.EACH) {
            stack.pop();
          } else if (blockType === 'if' && current.type === TemplateNodeType.IF) {
            stack.pop();
          } else if (current.type === TemplateNodeType.HELPER && (current as HelperNode).name === blockType) {
            stack.pop();
          } else {
            throw new Error(`Unexpected block end: {{/${blockType}}} at line ${token.line}, column ${token.column}`);
          }
          break;
          
        // Handle 'else' tag (which is actually an expression with isElse=true)
        case 'expression':
          // Check if it's an else tag
          if ((token as any).isElse) {
            if (current.type === TemplateNodeType.IF) {
              // Create the else branch if it doesn't exist
              if (!(current as IfNode).else) {
                (current as IfNode).else = [];
              }
              
              // Switch to the else branch - but don't add the else tag itself to the children
              stack.pop();
              const elseIfNode = {
                type: TemplateNodeType.IF,
                condition: (current as IfNode).condition,
                original: (current as IfNode).original,
                location: (current as IfNode).location,
                children: (current as IfNode).else as TemplateASTNode[]
              };
              stack.push(elseIfNode as TemplateASTNode);
            } else {
              throw new Error(`Unexpected else tag at line ${token.line}, column ${token.column}`);
            }
          } else {
            // Regular expression handling (variable or helper)
            if (current.type === TemplateNodeType.ROOT || 
                current.type === TemplateNodeType.EACH || 
                current.type === TemplateNodeType.IF || 
                current.type === TemplateNodeType.HELPER) {
              // Check if it's a helper call or a variable
              const helperMatch = token.value.match(/^(\w+)\s+(.+)$/);
              if (helperMatch && helperMatch[1] && helperMatch[2]) {
                // It's a helper call
                const helperName = helperMatch[1];
                const argsString = helperMatch[2];
                const args = this.parseHelperArgs(argsString);
                
                const helperNode = createHelperNode(
                  helperName,
                  args,
                  `{{${token.value}}}`,
                  undefined,
                  {
                    start: token.start,
                    end: token.end,
                    line: token.line,
                    column: token.column
                  }
                );
                
                (current as RootNode | EachNode | IfNode | HelperNode).children.push(helperNode);
              } else {
                // It's a variable
                const variableNode = createVariableNode(
                  token.value,
                  `{{${token.value}}}`,
                  {
                    start: token.start,
                    end: token.end,
                    line: token.line,
                    column: token.column
                  }
                );
                
                (current as RootNode | EachNode | IfNode | HelperNode).children.push(variableNode);
              }
            }
          }
          break;
          
        case 'comment':
          if (current.type === TemplateNodeType.ROOT || 
              current.type === TemplateNodeType.EACH || 
              current.type === TemplateNodeType.IF || 
              current.type === TemplateNodeType.HELPER) {
            const commentNode = createCommentNode(
              token.value,
              `{{!-- ${token.value} --}}`,
              {
                start: token.start,
                end: token.end,
                line: token.line,
                column: token.column
              }
            );
            
            (current as RootNode | EachNode | IfNode | HelperNode).children.push(commentNode);
          }
          break;
      }
    }
    
    // Check for unclosed blocks
    if (stack.length > 1) {
      const unclosed = stack[stack.length - 1];
      let blockType = '';
      
      if (unclosed.type === TemplateNodeType.EACH) {
        blockType = 'each';
      } else if (unclosed.type === TemplateNodeType.IF) {
        blockType = 'if';
      } else if (unclosed.type === TemplateNodeType.HELPER) {
        blockType = (unclosed as HelperNode).name;
      }
      
      throw new Error(`Unclosed block: {{#${blockType}}} at line ${(unclosed.location?.line || 0)}, column ${(unclosed.location?.column || 0)}`);
    }
    
    return createTemplateAST(root.children, template);
  }
  
  /**
   * Parse helper arguments
   * @param argsString Arguments string
   * @returns Array of argument strings
   * @private
   */
  private parseHelperArgs(argsString: string): string[] {
    const args: string[] = [];
    let currentArg = '';
    let inString = false;
    let stringChar = '';
    let escaped = false;
    
    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i];
      
      if (escaped) {
        currentArg += char;
        escaped = false;
        continue;
      }
      
      if (char === '\\') {
        escaped = true;
        continue;
      }
      
      if (inString) {
        if (char === stringChar && !escaped) {
          inString = false;
          currentArg += char;
        } else {
          currentArg += char;
        }
      } else {
        if (char === '"' || char === "'") {
          inString = true;
          stringChar = char;
          currentArg += char;
        } else if (char === ' ' && currentArg.trim() !== '') {
          args.push(currentArg.trim());
          currentArg = '';
        } else if (char !== ' ' || currentArg !== '') {
          currentArg += char;
        }
      }
    }
    
    if (currentArg.trim() !== '') {
      args.push(currentArg.trim());
    }
    
    return args;
  }
  
  /**
   * Validate tag balance
   * @param tokens Tokens to validate
   * @param errors Errors array to populate
   * @private
   */
  private validateTagBalance(tokens: Token[], errors: TemplateError[]): void {
    const stack: { type: string; token: Token }[] = [];
    
    for (const token of tokens) {
      if ((token as any).type === 'block-start') {
        stack.push({ type: (token as any).blockType, token });
      } else if ((token as any).type === 'block-end') {
        if (stack.length === 0) {
          errors.push({
            type: 'syntax',
            message: `Unexpected closing tag: {{/${(token as any).blockType}}}`,
            line: token.line,
            column: token.column,
            context: `...{{/${(token as any).blockType}}}...`
          });
        } else {
          const last = stack.pop();
          if (last && last.type !== (token as any).blockType) {
            errors.push({
              type: 'syntax',
              message: `Mismatched closing tag: expected {{/${last.type}}}, found {{/${(token as any).blockType}}}`,
              line: token.line,
              column: token.column,
              context: `...{{/${(token as any).blockType}}}...`
            });
          }
        }
      }
    }
    
    // Check for unclosed tags
    if (stack.length > 0) {
      for (const item of stack) {
        errors.push({
          type: 'syntax',
          message: `Unclosed tag: {{#${item.type}}}`,
          line: item.token.line,
          column: item.token.column,
          context: `...{{#${item.type}}}...`
        });
      }
    }
  }
  
  /**
   * Validate expressions
   * @param tokens Tokens to validate
   * @param errors Errors array to populate
   * @param warnings Warnings array to populate
   * @private
   */
  private validateExpressions(tokens: Token[], errors: TemplateError[], warnings: TemplateWarning[]): void {
    for (const token of tokens) {
      if ((token as any).type === 'expression') {
        // Check for empty expressions
        if (token.value.trim() === '') {
          errors.push({
            type: 'syntax',
            message: 'Empty expression',
            line: token.line,
            column: token.column,
            context: '{{}}' 
          });
        }
        
        // Check for invalid characters
        if (/[<>]/.test(token.value)) {
          warnings.push({
            type: 'best-practice',
            message: 'Expression contains HTML-like characters which may cause issues',
            suggestion: 'Use helper functions to escape HTML characters'
          });
        }
      }
    }
  }
  
  /**
   * Validate block nesting
   * @param tokens Tokens to validate
   * @param errors Errors array to populate
   * @param warnings Warnings array to populate
   * @private
   */
  private validateBlockNesting(tokens: Token[], errors: TemplateError[], warnings: TemplateWarning[]): void {
    let nestingLevel = 0;
    let eachNestingLevel = 0;
    
    for (const token of tokens) {
      if ((token as any).type === 'block-start') {
        nestingLevel++;
        
        if ((token as any).blockType === 'each') {
          eachNestingLevel++;
          
          if (eachNestingLevel > 2) {
            warnings.push({
              type: 'performance',
              message: 'Deeply nested each loops may cause performance issues',
              suggestion: 'Consider restructuring your data or template to reduce nesting'
            });
          }
        }
        
        if (nestingLevel > 5) {
          warnings.push({
            type: 'best-practice',
            message: 'Deeply nested blocks may make templates hard to read and maintain',
            suggestion: 'Consider refactoring your template to reduce nesting'
          });
        }
      } else if ((token as any).type === 'block-end') {
        nestingLevel = Math.max(0, nestingLevel - 1);
        
        if ((token as any).blockType === 'each') {
          eachNestingLevel = Math.max(0, eachNestingLevel - 1);
        }
      }
    }
  }
  
  /**
   * Check for performance issues
   * @param template Template string
   * @param warnings Warnings array to populate
   * @private
   */
  private checkPerformance(template: string, warnings: TemplateWarning[]): void {
    // Check for large templates
    if (template.length > 10000) {
      warnings.push({
        type: 'performance',
        message: 'Large template may cause performance issues',
        suggestion: 'Consider breaking the template into smaller, reusable parts'
      });
    }
    
    // Check for many expressions
    const expressionCount = (template.match(/\{\{[^}]*\}\}/g) || []).length;
    if (expressionCount > 100) {
      warnings.push({
        type: 'performance',
        message: 'Template contains many expressions which may impact rendering performance',
        suggestion: 'Consider simplifying the template or pre-processing data'
      });
    }
  }
}
