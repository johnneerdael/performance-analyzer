import { TemplateParser } from '../../../src/services/templates/TemplateParser';
import { 
  TemplateNodeType, 
  isRootNode, 
  isTextNode, 
  isVariableNode, 
  isEachNode, 
  isIfNode, 
  isHelperNode 
} from '../../../src/services/templates/TemplateAST';

describe('TemplateParser', () => {
  let parser: TemplateParser;

  beforeEach(() => {
    parser = new TemplateParser();
  });

  describe('parse', () => {
    it('should parse a simple template with text and variables', () => {
      const template = 'Hello, {{name}}!';
      const ast = parser.parse(template);

      expect(ast.type).toBe(TemplateNodeType.ROOT);
      expect(ast.children.length).toBe(3);
      
      expect(ast.children[0] && isTextNode(ast.children[0])).toBe(true);
      expect(ast.children[0]?.type).toBe(TemplateNodeType.TEXT);
      expect((ast.children[0] as any)?.content).toBe('Hello, ');
      
      expect(ast.children[1] && isVariableNode(ast.children[1])).toBe(true);
      expect(ast.children[1]?.type).toBe(TemplateNodeType.VARIABLE);
      expect((ast.children[1] as any)?.path).toBe('name');
      expect((ast.children[1] as any)?.original).toBe('{{name}}');
      
      expect(ast.children[2] && isTextNode(ast.children[2])).toBe(true);
      expect(ast.children[2]?.type).toBe(TemplateNodeType.TEXT);
      expect((ast.children[2] as any)?.content).toBe('!');
    });

    it('should parse a template with an each block', () => {
      const template = '{{#each items}}\n  - {{this}}\n{{/each}}';
      const ast = parser.parse(template);

      expect(ast.type).toBe(TemplateNodeType.ROOT);
      expect(ast.children.length).toBe(1);
      
      expect(ast.children[0] && isEachNode(ast.children[0])).toBe(true);
      expect(ast.children[0]?.type).toBe(TemplateNodeType.EACH);
      expect((ast.children[0] as any)?.items).toBe('items');
      expect((ast.children[0] as any)?.original).toBe('{{#each items}}');
      
      const eachNode = ast.children[0] as any;
      expect(eachNode.children.length).toBe(3);
      
      expect(isTextNode(eachNode.children[0])).toBe(true);
      expect(eachNode.children[0].content).toBe('\n  - ');
      
      expect(isVariableNode(eachNode.children[1])).toBe(true);
      expect(eachNode.children[1].path).toBe('this');
      
      expect(isTextNode(eachNode.children[2])).toBe(true);
      expect(eachNode.children[2].content).toBe('\n');
    });

    it('should parse a template with an if block', () => {
      const template = '{{#if condition}}True{{else}}False{{/if}}';
      const ast = parser.parse(template);

      expect(ast.type).toBe(TemplateNodeType.ROOT);
      expect(ast.children.length).toBe(1);
      
      expect(ast.children[0] && isIfNode(ast.children[0])).toBe(true);
      expect(ast.children[0]?.type).toBe(TemplateNodeType.IF);
      expect((ast.children[0] as any)?.condition).toBe('condition');
      expect((ast.children[0] as any)?.original).toBe('{{#if condition}}');
      
      const ifNode = ast.children[0] as any;
      expect(ifNode.children.length).toBe(1);
      expect(isTextNode(ifNode.children[0])).toBe(true);
      expect(ifNode.children[0].content).toBe('True');
      
      expect(ifNode.else).toBeDefined();
      expect(ifNode.else.length).toBe(1);
      expect(isTextNode(ifNode.else[0])).toBe(true);
      expect(ifNode.else[0].content).toBe('False');
    });

    it('should parse a template with nested blocks', () => {
      const template = '{{#each items}}{{#if this.active}}{{this.name}}{{/if}}{{/each}}';
      const ast = parser.parse(template);

      expect(ast.type).toBe(TemplateNodeType.ROOT);
      expect(ast.children.length).toBe(1);
      
      expect(ast.children[0] && isEachNode(ast.children[0])).toBe(true);
      const eachNode = ast.children[0] as any;
      expect(eachNode?.items).toBe('items');
      expect(eachNode?.children.length).toBe(1);
      
      expect(eachNode?.children[0] && isIfNode(eachNode?.children[0])).toBe(true);
      const ifNode = eachNode?.children[0] as any;
      expect(ifNode?.condition).toBe('this.active');
      expect(ifNode?.children.length).toBe(1);
      
      expect(ifNode?.children[0] && isVariableNode(ifNode?.children[0])).toBe(true);
      expect(ifNode?.children[0]?.path).toBe('this.name');
    });

    it('should parse a template with helper functions', () => {
      const template = '{{formatDate date "YYYY-MM-DD"}}';
      const ast = parser.parse(template);

      expect(ast.type).toBe(TemplateNodeType.ROOT);
      expect(ast.children.length).toBe(1);
      
      expect(ast.children[0] && isHelperNode(ast.children[0])).toBe(true);
      const helperNode = ast.children[0] as any;
      expect(helperNode?.name).toBe('formatDate');
      expect(helperNode?.args).toEqual(['date', '"YYYY-MM-DD"']);
      expect(helperNode?.original).toBe('{{formatDate date "YYYY-MM-DD"}}');
    });
  });

  describe('validate', () => {
    it('should validate a valid template', () => {
      const template = 'Hello, {{name}}! {{#if showItems}}{{#each items}}{{this}}{{/each}}{{/if}}';
      const result = parser.validate(template);
      
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should detect unclosed tags', () => {
      const template = '{{#each items}}{{this}}';
      const result = parser.validate(template);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.message).toContain('Unclosed tag');
    });

    it('should detect mismatched tags', () => {
      const template = '{{#each items}}{{this}}{{/if}}';
      const result = parser.validate(template);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.message).toContain('Mismatched closing tag');
    });

    it('should warn about deeply nested blocks', () => {
      const template = '{{#if a}}{{#if b}}{{#if c}}{{#if d}}{{#if e}}{{#if f}}Too deep{{/if}}{{/if}}{{/if}}{{/if}}{{/if}}{{/if}}';
      const result = parser.validate(template);
      
      expect(result.isValid).toBe(true); // Still valid, just not recommended
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]?.type).toBe('best-practice');
      expect(result.warnings[0]?.message).toContain('nested blocks');
    });

    it('should warn about deeply nested each loops', () => {
      const template = '{{#each a}}{{#each b}}{{#each c}}Too deep{{/each}}{{/each}}{{/each}}';
      const result = parser.validate(template);
      
      expect(result.isValid).toBe(true); // Still valid, just not recommended
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]?.type).toBe('performance');
      expect(result.warnings[0]?.message).toContain('nested each loops');
    });
  });

  describe('edge cases', () => {
    it('should handle empty templates', () => {
      const template = '';
      const ast = parser.parse(template);
      
      expect(ast.type).toBe(TemplateNodeType.ROOT);
      expect(ast.children.length).toBe(0);
    });

    it('should handle templates with only text', () => {
      const template = 'Just some static text';
      const ast = parser.parse(template);
      
      expect(ast.type).toBe(TemplateNodeType.ROOT);
      expect(ast.children.length).toBe(1);
      expect(ast.children[0] && isTextNode(ast.children[0])).toBe(true);
      expect((ast.children[0] as any)?.content).toBe('Just some static text');
    });

    it('should handle templates with only variables', () => {
      const template = '{{variable}}';
      const ast = parser.parse(template);
      
      expect(ast.type).toBe(TemplateNodeType.ROOT);
      expect(ast.children.length).toBe(1);
      expect(ast.children[0] && isVariableNode(ast.children[0])).toBe(true);
      expect((ast.children[0] as any)?.path).toBe('variable');
    });

    it('should handle whitespace correctly', () => {
      const template = '  {{  variable  }}  ';
      const ast = parser.parse(template);
      
      expect(ast.type).toBe(TemplateNodeType.ROOT);
      expect(ast.children.length).toBe(3);
      expect(ast.children[0] && isTextNode(ast.children[0])).toBe(true);
      expect((ast.children[0] as any)?.content).toBe('  ');
      expect(ast.children[1] && isVariableNode(ast.children[1])).toBe(true);
      expect((ast.children[1] as any)?.path).toBe('variable');
      expect(ast.children[2] && isTextNode(ast.children[2])).toBe(true);
      expect((ast.children[2] as any)?.content).toBe('  ');
    });
  });
});
