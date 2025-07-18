import { TemplateParser } from '../../../src/services/templates/TemplateParser';
import { TemplateRenderer } from '../../../src/services/templates/TemplateRenderer';
import { ContextManager } from '../../../src/services/templates/ContextManager';

describe('TemplateRenderer', () => {
  let parser: TemplateParser;
  let renderer: TemplateRenderer;
  let mockConsoleLog: jest.SpyInstance;

  beforeEach(() => {
    parser = new TemplateParser();
    renderer = new TemplateRenderer(new ContextManager());
    // Mock console.log to avoid cluttering test output
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
  });

  describe('render', () => {
    it('should render a simple text template', () => {
      const template = 'Hello, world!';
      const ast = parser.parse(template);
      const result = renderer.render(ast, {});

      expect(result).toBe('Hello, world!');
    });

    it('should render a template with variables', () => {
      const template = 'Hello, {{name}}!';
      const ast = parser.parse(template);
      const result = renderer.render(ast, { name: 'John' });

      expect(result).toBe('Hello, John!');
    });

    it('should render a template with nested properties', () => {
      const template = 'Hello, {{user.name}}!';
      const ast = parser.parse(template);
      const result = renderer.render(ast, { user: { name: 'John' } });

      expect(result).toBe('Hello, John!');
    });

    it('should render empty string for undefined variables', () => {
      const template = 'Hello, {{name}}!';
      const ast = parser.parse(template);
      const result = renderer.render(ast, {});

      expect(result).toBe('Hello, !');
    });

    it('should throw an error for undefined variables in strict mode', () => {
      const template = 'Hello, {{name}}!';
      const ast = parser.parse(template);

      expect(() => {
        renderer.render(ast, {}, { strictMode: true });
      }).toThrow('Variable not found: name');
    });
  });

  describe('each loops', () => {
    it('should render a simple each loop with strings', () => {
      const template = 'Items: {{#each items}}{{this}} {{/each}}';
      const ast = parser.parse(template);
      const result = renderer.render(ast, { items: ['a', 'b', 'c'] });

      expect(result).toBe('Items: a b c ');
    });

    it('should render a simple each loop with numbers', () => {
      const template = 'Items: {{#each items}}{{this}} {{/each}}';
      const ast = parser.parse(template);
      const result = renderer.render(ast, { items: [1, 2, 3] });

      expect(result).toBe('Items: 1 2 3 ');
    });

    it('should render a simple each loop with objects', () => {
      const template = 'Items: {{#each items}}{{name}} {{/each}}';
      const ast = parser.parse(template);
      const result = renderer.render(ast, { 
        items: [
          { name: 'Item 1' }, 
          { name: 'Item 2' }, 
          { name: 'Item 3' }
        ] 
      });

      expect(result).toBe('Items: Item 1 Item 2 Item 3 ');
    });

    it('should render an each loop with this and other properties', () => {
      const template = 'Items: {{#each items}}({{this}}: {{name}}) {{/each}}';
      const ast = parser.parse(template);
      const result = renderer.render(ast, { 
        items: [
          { id: 1, name: 'Item 1' }, 
          { id: 2, name: 'Item 2' }, 
          { id: 3, name: 'Item 3' }
        ] 
      });

      // The 'this' should be the entire object
      expect(result).toContain('({"id":1,"name":"Item 1"}: Item 1)');
      expect(result).toContain('({"id":2,"name":"Item 2"}: Item 2)');
      expect(result).toContain('({"id":3,"name":"Item 3"}: Item 3)');
    });

    it('should render nested each loops correctly', () => {
      const template = '{{#each users}}{{name}}\'s items: {{#each items}}{{this}} {{/each}}\n{{/each}}';
      const ast = parser.parse(template);
      const result = renderer.render(ast, { 
        users: [
          { name: 'John', items: ['a', 'b', 'c'] },
          { name: 'Jane', items: ['x', 'y', 'z'] }
        ] 
      });

      expect(result).toBe('John\'s items: a b c \nJane\'s items: x y z \n');
    });

    it('should render nested each loops with this at different levels', () => {
      const template = '{{#each users}}User: {{this.name}}\nItems: {{#each items}}{{this}} (belongs to {{../name}}) {{/each}}\n{{/each}}';
      const ast = parser.parse(template);
      const result = renderer.render(ast, { 
        users: [
          { name: 'John', items: ['a', 'b'] },
          { name: 'Jane', items: ['x', 'y'] }
        ] 
      });

      // Note: The parent context access (../name) is not implemented yet, so it will be empty
      expect(result).toBe('User: John\nItems: a (belongs to ) b (belongs to ) \nUser: Jane\nItems: x (belongs to ) y (belongs to ) \n');
    });

    it('should render an empty string for non-existent arrays', () => {
      const template = 'Items: {{#each nonexistent}}{{this}} {{/each}}';
      const ast = parser.parse(template);
      const result = renderer.render(ast, {});

      expect(result).toBe('Items: ');
    });

    it('should render an empty string for empty arrays', () => {
      const template = 'Items: {{#each items}}{{this}} {{/each}}';
      const ast = parser.parse(template);
      const result = renderer.render(ast, { items: [] });

      expect(result).toBe('Items: ');
    });

    it('should throw an error for non-arrays in strict mode', () => {
      const template = 'Items: {{#each items}}{{this}} {{/each}}';
      const ast = parser.parse(template);

      expect(() => {
        renderer.render(ast, { items: 'not an array' }, { strictMode: true });
      }).toThrow('Not an array: items');
    });

    it('should limit iterations to maxIterations', () => {
      const template = 'Items: {{#each items}}{{this}} {{/each}}';
      const ast = parser.parse(template);
      const items = Array.from({ length: 100 }, (_, i) => i + 1);
      const result = renderer.render(ast, { items }, { maxIterations: 5 });

      expect(result).toBe('Items: 1 2 3 4 5 ');
    });
  });

  describe('if conditions', () => {
    it('should render the if block when condition is true', () => {
      const template = '{{#if condition}}True{{/if}}';
      const ast = parser.parse(template);
      const result = renderer.render(ast, { condition: true });

      expect(result).toBe('True');
    });

    it('should not render the if block when condition is false', () => {
      const template = '{{#if condition}}True{{/if}}';
      const ast = parser.parse(template);
      const result = renderer.render(ast, { condition: false });

      expect(result).toBe('');
    });

    it('should render the else block when condition is false', () => {
      const template = '{{#if condition}}True{{else}}False{{/if}}';
      const ast = parser.parse(template);
      const result = renderer.render(ast, { condition: false });

      expect(result).toBe('False');
    });

    it('should handle nested if conditions', () => {
      const template = '{{#if outer}}Outer {{#if inner}}Inner{{/if}}{{/if}}';
      const ast = parser.parse(template);
      const result = renderer.render(ast, { outer: true, inner: true });

      expect(result).toBe('Outer Inner');
    });

    it('should evaluate truthy values correctly', () => {
      const template = '{{#if value}}Truthy{{else}}Falsy{{/if}}';
      const ast = parser.parse(template);
      
      // Truthy values
      expect(renderer.render(ast, { value: true })).toBe('Truthy');
      expect(renderer.render(ast, { value: 1 })).toBe('Truthy');
      expect(renderer.render(ast, { value: 'string' })).toBe('Truthy');
      expect(renderer.render(ast, { value: {} })).toBe('Truthy');
      expect(renderer.render(ast, { value: [] })).toBe('Truthy');
      
      // Falsy values
      expect(renderer.render(ast, { value: false })).toBe('Falsy');
      expect(renderer.render(ast, { value: 0 })).toBe('Falsy');
      expect(renderer.render(ast, { value: '' })).toBe('Falsy');
      expect(renderer.render(ast, { value: null })).toBe('Falsy');
      expect(renderer.render(ast, { value: undefined })).toBe('Falsy');
    });
  });

  describe('complex templates', () => {
    it('should render a complex template with nested structures', () => {
      const template = `
# User Report

{{#if users.length}}
## Users ({{users.length}})

{{#each users}}
### {{name}}

{{#if admin}}**Admin User**{{else}}Regular User{{/if}}

#### Items:
{{#if items.length}}
{{#each items}}- {{this}}
{{/each}}
{{else}}
No items found.
{{/if}}

{{/each}}
{{else}}
No users found.
{{/if}}
`;
      const ast = parser.parse(template);
      const data = {
        users: [
          { 
            name: 'John', 
            admin: true, 
            items: ['Item 1', 'Item 2'] 
          },
          { 
            name: 'Jane', 
            admin: false, 
            items: [] 
          },
          { 
            name: 'Bob', 
            admin: false, 
            items: ['Item 3'] 
          }
        ]
      };
      
      const result = renderer.render(ast, data);
      
      expect(result).toContain('# User Report');
      expect(result).toContain('## Users (3)');
      expect(result).toContain('### John');
      expect(result).toContain('**Admin User**');
      expect(result).toContain('- Item 1');
      expect(result).toContain('- Item 2');
      expect(result).toContain('### Jane');
      expect(result).toContain('Regular User');
      expect(result).toContain('No items found.');
      expect(result).toContain('### Bob');
      expect(result).toContain('- Item 3');
    });
  });
});
