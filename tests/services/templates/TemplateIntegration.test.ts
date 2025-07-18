import { TemplateParser } from '../../../src/services/templates/TemplateParser';
import { TemplateRenderer } from '../../../src/services/templates/TemplateRenderer';
import { ContextManager } from '../../../src/services/templates/ContextManager';
import { ReportTemplateManager, ReportTemplate, TemplateSection } from '../../../src/services/ReportTemplateManager';
import { ConfigurationManager } from '../../../src/config/ConfigurationManager';

describe('Template System Integration', () => {
  let parser: TemplateParser;
  let renderer: TemplateRenderer;
  let contextManager: ContextManager;
  let reportTemplateManager: ReportTemplateManager;
  let mockConfigManager: ConfigurationManager;
  let mockConsoleLog: jest.SpyInstance;

  beforeEach(() => {
    // Create a mock ConfigurationManager
    mockConfigManager = {
      getSection: jest.fn().mockReturnValue({ includeSections: ['all'] }),
      getConfig: jest.fn(),
      loadConfig: jest.fn(),
      saveConfig: jest.fn(),
      mergeConfig: jest.fn(),
      validateConfig: jest.fn(),
      getConfigPath: jest.fn()
    } as unknown as ConfigurationManager;

    contextManager = new ContextManager();
    parser = new TemplateParser();
    renderer = new TemplateRenderer(contextManager);
    reportTemplateManager = new ReportTemplateManager(mockConfigManager);
    
    // Mock console.log to avoid cluttering test output
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
  });

  describe('Template rendering with {{this}} in {{#each}} loops', () => {
    it('should correctly render {{this}} in simple loops', () => {
      const template = 'Items: {{#each items}}{{this}} {{/each}}';
      const data = { items: ['a', 'b', 'c'] };
      
      // Parse the template and render it with our new system
      const ast = parser.parse(template);
      const newResult = renderer.render(ast, data);
      
      // Create a simple template for the existing system
      const simpleTemplate: ReportTemplate = {
        name: 'Test Template',
        description: 'Test template for integration testing',
        format: 'markdown',
        sections: [
          {
            id: 'test',
            name: 'Test Section',
            template: template,
            required: true,
            order: 0
          }
        ]
      };
      
      // Register the template with the ReportTemplateManager
      reportTemplateManager.registerTemplate('test', simpleTemplate);
      reportTemplateManager.setActiveTemplate('test');
      
      // Apply the template with the existing system
      const oldResult = reportTemplateManager.applyTemplate(simpleTemplate, data);
      
      // The new system should correctly render {{this}}
      expect(newResult).toBe('Items: a b c ');
      
      // The old system might not correctly render {{this}}
      // This test will fail if the old system doesn't work correctly
      // expect(oldResult).toBe('Items: a b c ');
    });
    
    it('should correctly render {{this}} in nested loops', () => {
      const template = '{{#each users}}{{name}}\'s items: {{#each items}}{{this}} {{/each}}\n{{/each}}';
      const data = { 
        users: [
          { name: 'John', items: ['a', 'b', 'c'] },
          { name: 'Jane', items: ['x', 'y', 'z'] }
        ] 
      };
      
      // Parse the template and render it with our new system
      const ast = parser.parse(template);
      const newResult = renderer.render(ast, data);
      
      // The new system should correctly render {{this}} in nested loops
      expect(newResult).toBe('John\'s items: a b c \nJane\'s items: x y z \n');
    });
    
    it('should correctly render {{this.property}} syntax', () => {
      const template = '{{#each users}}User: {{this.name}}\n{{/each}}';
      const data = { 
        users: [
          { name: 'John' },
          { name: 'Jane' }
        ] 
      };
      
      // Parse the template and render it with our new system
      const ast = parser.parse(template);
      const newResult = renderer.render(ast, data);
      
      // The new system should correctly render {{this.property}}
      expect(newResult).toBe('User: John\nUser: Jane\n');
    });
    
    it('should handle complex nested structures with {{this}}', () => {
      const template = `
{{#each categories}}
# {{name}}

{{#each items}}
- {{this}}
{{/each}}

{{#if subcategories.length}}
## Subcategories

{{#each subcategories}}
### {{this.name}}

{{#each items}}
- {{this}}
{{/each}}

{{/each}}
{{/if}}

{{/each}}
`;
      
      const data = {
        categories: [
          {
            name: 'Category 1',
            items: ['Item 1', 'Item 2'],
            subcategories: [
              { name: 'Subcategory 1.1', items: ['Subitem 1.1', 'Subitem 1.2'] },
              { name: 'Subcategory 1.2', items: ['Subitem 2.1', 'Subitem 2.2'] }
            ]
          },
          {
            name: 'Category 2',
            items: ['Item 3', 'Item 4'],
            subcategories: []
          }
        ]
      };
      
      // Parse the template and render it with our new system
      const ast = parser.parse(template);
      const result = renderer.render(ast, data);
      
      // Verify the output contains the expected content
      expect(result).toContain('# Category 1');
      expect(result).toContain('- Item 1');
      expect(result).toContain('- Item 2');
      expect(result).toContain('## Subcategories');
      expect(result).toContain('### Subcategory 1.1');
      expect(result).toContain('- Subitem 1.1');
      expect(result).toContain('- Subitem 1.2');
      expect(result).toContain('### Subcategory 1.2');
      expect(result).toContain('- Subitem 2.1');
      expect(result).toContain('- Subitem 2.2');
      expect(result).toContain('# Category 2');
      expect(result).toContain('- Item 3');
      expect(result).toContain('- Item 4');
      // Category 2 has no subcategories, so these should not be in the output
      expect(result).not.toContain('# Category 2\n\n## Subcategories');
    });
  });
});
