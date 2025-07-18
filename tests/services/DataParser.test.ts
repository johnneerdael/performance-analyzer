// Tests for DataParser service
import { DefaultDataParser } from '../../src/services/DataParser';

// Mock fs-extra
jest.mock('fs-extra', () => ({
  readFile: jest.fn()
}));

// Mock ErrorHandler
jest.mock('../../src/utils/ErrorHandler', () => ({
  DefaultErrorHandler: jest.fn().mockImplementation(() => ({
    handleParsingError: jest.fn(),
    logError: jest.fn()
  }))
}));

// Import fs after mocking
import * as fs from 'fs-extra';

describe('DataParser', () => {
  let dataParser: DefaultDataParser;
  
  beforeEach(() => {
    dataParser = new DefaultDataParser();
    jest.clearAllMocks();
  });
  
  describe('parseParameters', () => {
    it('should parse valid parameters file', async () => {
      // Arrange
      const filePath = '/path/to/parameters-results_20250717_122222.json';
      const mockFileContent = JSON.stringify({
        'backend-server': 'coredns',
        'mtu': '1500',
        'query-logging': 'disabled'
      });
      
      // @ts-ignore - Ignore TypeScript errors for mocking
      fs.readFile.mockResolvedValue(mockFileContent);
      
      // Act
      const result = await dataParser.parseParameters(filePath);
      
      // Assert
      expect(result).toEqual({
        backendServer: 'coredns',
        mtu: 1500,
        queryLogging: 'disabled'
      });
      expect(fs.readFile).toHaveBeenCalledWith(filePath, 'utf8');
    });
  });
  
  describe('parseResults', () => {
    it('should parse valid results file with iperf tests', async () => {
      // Arrange
      const filePath = '/path/to/results_20250717_122222.json';
      const mockFileContent = JSON.stringify({
        iperf_tests: [
          {
            server: 'iperf-coredns.netskope.local',
            scenario: 'TCP Bandwidth (Parallel 4)',
            success: true,
            bandwidth_mbps: 306.40505233817044,
            retransmits: 0,
            jitter_ms: 0.0,
            packet_loss: 0.0,
            duration: 16.135075330734253,
            all_raw_data: { some: 'data' }
          }
        ]
      });
      
      // @ts-ignore - Ignore TypeScript errors for mocking
      fs.readFile.mockResolvedValue(mockFileContent);
      
      // Act
      const result = await dataParser.parseResults(filePath);
      
      // Assert
      expect(result.iperfTests).toHaveLength(1);
      expect(result.iperfTests[0]).toEqual({
        server: 'iperf-coredns.netskope.local',
        scenario: 'TCP Bandwidth (Parallel 4)',
        success: true,
        bandwidthMbps: 306.40505233817044,
        retransmits: 0,
        jitterMs: 0.0,
        packetLoss: 0.0,
        duration: 16.135075330734253,
        allRawData: { some: 'data' }
      });
      expect(result.dnsResults).toEqual([]);
    });
    
    it('should parse valid results file with DNS tests', async () => {
      // Arrange
      const filePath = '/path/to/results_20250717_122222.json';
      const mockFileContent = JSON.stringify({
        dns_tests: [
          {
            domain: 'example.com',
            dns_server: '8.8.8.8',
            success: true,
            response_time_ms: 45.2,
            query_time_ms: 30.1,
            status: 'NOERROR',
            resolved_ips: ['93.184.216.34']
          }
        ]
      });
      
      // @ts-ignore - Ignore TypeScript errors for mocking
      fs.readFile.mockResolvedValue(mockFileContent);
      
      // Act
      const result = await dataParser.parseResults(filePath);
      
      // Assert
      expect(result.dnsResults).toHaveLength(1);
      expect(result.dnsResults[0]).toEqual({
        domain: 'example.com',
        dnsServer: '8.8.8.8',
        success: true,
        responseTimeMs: 45.2,
        queryTimeMs: 30.1,
        status: 'NOERROR',
        resolvedIps: ['93.184.216.34']
      });
      expect(result.iperfTests).toEqual([]);
    });
  });
});