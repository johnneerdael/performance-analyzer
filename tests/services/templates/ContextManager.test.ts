import { ContextManager, RenderContext } from '../../../src/services/templates/ContextManager';

describe('ContextManager', () => {
  let contextManager: ContextManager;
  let mockConsoleLog: jest.SpyInstance;

  beforeEach(() => {
    contextManager = new ContextManager();
    // Mock console.log to avoid cluttering test output
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
  });

  describe('createContext', () => {
    it('should create a context with the provided data', () => {
      const data = { name: 'Test', items: [1, 2, 3] };
      const context = contextManager.createContext(data);

      expect(context.data).toBe(data);
      expect(context.scopes).toHaveLength(1);
      expect(context.scopes[0]).toBe(data);
      expect(context.debugMode).toBe(false);
    });

    it('should create a context with debug mode enabled', () => {
      const data = { name: 'Test' };
      const context = contextManager.createContext(data, true);

      expect(context.debugMode).toBe(true);
    });
  });

  describe('pushScope', () => {
    it('should add a new scope to the context', () => {
      const rootData = { name: 'Root' };
      const context = contextManager.createContext(rootData);
      const newScope = { name: 'Child' };

      const updatedContext = contextManager.pushScope(context, newScope);

      expect(updatedContext.scopes).toHaveLength(2);
      expect(updatedContext.scopes[0]).toBe(rootData);
      expect(updatedContext.scopes[1]).toBe(newScope);
    });

    it('should not modify the original context', () => {
      const rootData = { name: 'Root' };
      const context = contextManager.createContext(rootData);
      const newScope = { name: 'Child' };

      const updatedContext = contextManager.pushScope(context, newScope);

      expect(context.scopes).toHaveLength(1);
      expect(updatedContext).not.toBe(context);
    });
  });

  describe('popScope', () => {
    it('should remove the top scope from the context', () => {
      const rootData = { name: 'Root' };
      const context = contextManager.createContext(rootData);
      const newScope = { name: 'Child' };
      const contextWithScope = contextManager.pushScope(context, newScope);

      const updatedContext = contextManager.popScope(contextWithScope);

      expect(updatedContext.scopes).toHaveLength(1);
      expect(updatedContext.scopes[0]).toBe(rootData);
    });

    it('should throw an error when trying to pop the root scope', () => {
      const rootData = { name: 'Root' };
      const context = contextManager.createContext(rootData);

      expect(() => {
        contextManager.popScope(context);
      }).toThrow('Cannot pop the root scope from the context');
    });

    it('should not modify the original context', () => {
      const rootData = { name: 'Root' };
      const context = contextManager.createContext(rootData);
      const newScope = { name: 'Child' };
      const contextWithScope = contextManager.pushScope(context, newScope);

      const updatedContext = contextManager.popScope(contextWithScope);

      expect(contextWithScope.scopes).toHaveLength(2);
      expect(updatedContext).not.toBe(contextWithScope);
    });
  });

  describe('resolveVariable', () => {
    it('should resolve "this" to the current scope', () => {
      const rootData = { name: 'Root' };
      const context = contextManager.createContext(rootData);
      const newScope = { name: 'Child' };
      const contextWithScope = contextManager.pushScope(context, newScope);

      const result = contextManager.resolveVariable(contextWithScope, 'this');

      expect(result).toBe(newScope);
    });

    it('should resolve variables from the current scope', () => {
      const rootData = { name: 'Root', shared: 'Shared' };
      const context = contextManager.createContext(rootData);
      const newScope = { name: 'Child', unique: 'Unique' };
      const contextWithScope = contextManager.pushScope(context, newScope);

      const result = contextManager.resolveVariable(contextWithScope, 'unique');

      expect(result).toBe('Unique');
    });

    it('should resolve variables from parent scopes if not found in current scope', () => {
      const rootData = { name: 'Root', shared: 'Shared' };
      const context = contextManager.createContext(rootData);
      const newScope = { name: 'Child', unique: 'Unique' };
      const contextWithScope = contextManager.pushScope(context, newScope);

      const result = contextManager.resolveVariable(contextWithScope, 'shared');

      expect(result).toBe('Shared');
    });

    it('should resolve nested properties using dot notation', () => {
      const data = {
        user: {
          profile: {
            name: 'John',
            age: 30
          }
        }
      };
      const context = contextManager.createContext(data);

      const result = contextManager.resolveVariable(context, 'user.profile.name');

      expect(result).toBe('John');
    });

    it('should return undefined for non-existent variables', () => {
      const data = { name: 'Test' };
      const context = contextManager.createContext(data);

      const result = contextManager.resolveVariable(context, 'nonexistent');

      expect(result).toBeUndefined();
    });

    it('should return undefined for non-existent nested properties', () => {
      const data = { user: { name: 'John' } };
      const context = contextManager.createContext(data);

      const result = contextManager.resolveVariable(context, 'user.profile.name');

      expect(result).toBeUndefined();
    });

    it('should log debug information when debug mode is enabled', () => {
      const data = { name: 'Test' };
      const context = contextManager.createContext(data, true);

      contextManager.resolveVariable(context, 'name');

      expect(mockConsoleLog).toHaveBeenCalled();
    });

    it('should not log debug information when debug mode is disabled', () => {
      const data = { name: 'Test' };
      const context = contextManager.createContext(data, false);

      contextManager.resolveVariable(context, 'name');

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });
  });

  describe('complex scenarios', () => {
    it('should handle nested scopes correctly', () => {
      const rootData = { 
        users: [
          { id: 1, name: 'User 1' },
          { id: 2, name: 'User 2' }
        ],
        settings: {
          theme: 'dark'
        }
      };
      
      // Create root context
      const rootContext = contextManager.createContext(rootData);
      
      // Push first user as scope
      const user1Context = contextManager.pushScope(rootContext, rootData.users[0]);
      
      // Resolve variables
      expect(contextManager.resolveVariable(user1Context, 'id')).toBe(1);
      expect(contextManager.resolveVariable(user1Context, 'name')).toBe('User 1');
      expect(contextManager.resolveVariable(user1Context, 'settings.theme')).toBe('dark');
      
      // Push second user as scope
      const user2Context = contextManager.pushScope(rootContext, rootData.users[1]);
      
      // Resolve variables
      expect(contextManager.resolveVariable(user2Context, 'id')).toBe(2);
      expect(contextManager.resolveVariable(user2Context, 'name')).toBe('User 2');
      expect(contextManager.resolveVariable(user2Context, 'settings.theme')).toBe('dark');
    });
    
    it('should handle deeply nested properties', () => {
      const data = {
        report: {
          metadata: {
            generated: {
              date: '2025-07-18',
              by: 'System'
            }
          },
          content: {
            sections: [
              { title: 'Section 1', items: [1, 2, 3] },
              { title: 'Section 2', items: [4, 5, 6] }
            ]
          }
        }
      };
      
      const context = contextManager.createContext(data);
      
      expect(contextManager.resolveVariable(context, 'report.metadata.generated.date')).toBe('2025-07-18');
      expect(contextManager.resolveVariable(context, 'report.content.sections.0.title')).toBe('Section 1');
      expect(contextManager.resolveVariable(context, 'report.content.sections.1.items.2')).toBe(6);
    });
  });
});
