// Basic CLI tests
import { Command } from 'commander';

// Mock the required modules
jest.mock('commander');
jest.mock('fs-extra');
jest.mock('../src/services/NetworkPerformanceAnalyzer');

// Import the CLI module
import { run } from '../src/cli';

describe('CLI', () => {
  // Mock console and process.exit
  const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
  const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should initialize the CLI', async () => {
    // Setup mock for commander
    const mockCommand = {
      name: jest.fn().mockReturnThis(),
      description: jest.fn().mockReturnThis(),
      version: jest.fn().mockReturnThis(),
      argument: jest.fn().mockReturnThis(),
      option: jest.fn().mockReturnThis(),
      addHelpText: jest.fn().mockReturnThis(),
      parse: jest.fn().mockReturnThis(),
      args: ['/test/input/dir'],
      opts: jest.fn().mockReturnValue({})
    };
    (Command as jest.MockedClass<typeof Command>).mockImplementation(() => mockCommand as any);
    
    // Run the CLI
    await run(['node', 'cli.js', '/test/input/dir']);
    
    // Verify commander was initialized correctly
    expect(mockCommand.name).toHaveBeenCalledWith('network-performance-analyzer');
    expect(mockCommand.description).toHaveBeenCalled();
    expect(mockCommand.version).toHaveBeenCalled();
    expect(mockCommand.argument).toHaveBeenCalled();
    expect(mockCommand.option).toHaveBeenCalled();
    expect(mockCommand.parse).toHaveBeenCalled();
  });
});