/**
 * Template parser for generating AST from template strings
 */
import { TemplateAST, ValidationResult } from './TemplateAST';
/**
 * Template parser class
 */
export declare class TemplateParser {
    /**
     * Parse a template string into an AST
     * @param template Template string to parse
     * @returns The parsed template AST
     */
    parse(template: string): TemplateAST;
    /**
     * Validate a template string
     * @param template Template string to validate
     * @returns Validation result
     */
    validate(template: string): ValidationResult;
    /**
     * Tokenize a template string
     * @param template Template string to tokenize
     * @returns Array of tokens
     * @private
     */
    private tokenize;
    /**
     * Calculate source location for error reporting
     * @param template Template string
     * @param start Start index
     * @param end End index
     * @returns Source location
     * @private
     */
    private calculateLocation;
    /**
     * Parse tokens into an AST
     * @param tokens Tokens to parse
     * @param template Original template string
     * @returns Template AST
     * @private
     */
    private parseTokens;
    /**
     * Parse helper arguments
     * @param argsString Arguments string
     * @returns Array of argument strings
     * @private
     */
    private parseHelperArgs;
    /**
     * Validate tag balance
     * @param tokens Tokens to validate
     * @param errors Errors array to populate
     * @private
     */
    private validateTagBalance;
    /**
     * Validate expressions
     * @param tokens Tokens to validate
     * @param errors Errors array to populate
     * @param warnings Warnings array to populate
     * @private
     */
    private validateExpressions;
    /**
     * Validate block nesting
     * @param tokens Tokens to validate
     * @param errors Errors array to populate
     * @param warnings Warnings array to populate
     * @private
     */
    private validateBlockNesting;
    /**
     * Check for performance issues
     * @param template Template string
     * @param warnings Warnings array to populate
     * @private
     */
    private checkPerformance;
}
//# sourceMappingURL=TemplateParser.d.ts.map