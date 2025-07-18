import { ReportTemplateManager } from '../../../src/services/ReportTemplateManager';
import { ConfigurationManager } from '../../../src/config/ConfigurationManager';
import fs from 'fs-extra';
import path from 'path';

/**
 * Test script to verify that the {{this}} replacement issue is fixed
 */
async function testTemplateRendering() {
  // Create a mock ConfigurationManager
  const mockConfigManager = {
    getSection: () => ({ includeSections: ['all'] }),
    getConfig: () => ({}),
    loadConfig: async () => ({}),
    saveConfig: async () => {},
    mergeConfig: () => ({}),
    validateConfig: () => true,
    getConfigPath: () => ''
  } as unknown as ConfigurationManager;

  // Create a ReportTemplateManager instance
  const templateManager = new ReportTemplateManager(mockConfigManager);

  // Create a test template with {{this}} placeholders in {{#each}} loops
  const testTemplate = {
    name: 'Test Template',
    description: 'Template for testing {{this}} replacement',
    format: 'markdown' as const,
    sections: [
      {
        id: 'test',
        name: 'Test Section',
        template: `
# Test Template

## Simple Array Test
{{#each simpleArray}}- {{this}}
{{/each}}

## Object Array Test
{{#each objectArray}}
### {{name}}
- ID: {{id}}
- Full Object: {{this}}
{{/each}}

## Nested Array Test
{{#each nestedArray}}
### Group {{name}}
{{#each items}}- {{this}}
{{/each}}
{{/each}}

## Complex Object Test
{{#each complexObjects}}
### {{name}}
{{#each properties}}
- {{key}}: {{value}}
{{/each}}
{{#if nested}}
#### Nested Items:
{{#each nested}}- {{this}}
{{/each}}
{{/if}}
{{/each}}
`,
        required: true,
        order: 0
      }
    ]
  };

  // Register the test template
  templateManager.registerTemplate('test', testTemplate);
  templateManager.setActiveTemplate('test');

  // Create test data
  const testData = {
    simpleArray: ['Item 1', 'Item 2', 'Item 3'],
    objectArray: [
      { id: 1, name: 'Object 1' },
      { id: 2, name: 'Object 2' },
      { id: 3, name: 'Object 3' }
    ],
    nestedArray: [
      { name: 'Group 1', items: ['Item 1.1', 'Item 1.2', 'Item 1.3'] },
      { name: 'Group 2', items: ['Item 2.1', 'Item 2.2', 'Item 2.3'] }
    ],
    complexObjects: [
      {
        name: 'Complex 1',
        properties: [
          { key: 'Prop 1', value: 'Value 1' },
          { key: 'Prop 2', value: 'Value 2' }
        ],
        nested: ['Nested 1.1', 'Nested 1.2']
      },
      {
        name: 'Complex 2',
        properties: [
          { key: 'Prop 3', value: 'Value 3' },
          { key: 'Prop 4', value: 'Value 4' }
        ]
      }
    ]
  };

  // Render the template
  const result = templateManager.applyTemplate(testTemplate, testData);

  // Save the result to a file
  const outputPath = path.join(process.cwd(), 'reports', 'template-fix-test.md');
  await fs.ensureDir(path.dirname(outputPath));
  await fs.writeFile(outputPath, result);

  console.log(`Test result saved to: ${outputPath}`);
  console.log('Template rendering test completed.');
}

// Run the test
testTemplateRendering().catch(error => {
  console.error('Error running template test:', error);
});
