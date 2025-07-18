// Jest setup file for Network Performance Analyzer tests

// Global test configuration
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to suppress console.log during tests
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Setup test environment
beforeEach(() => {
  // Reset any mocks or test state before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  jest.restoreAllMocks();
});