// Tests for StreamingJsonParser
import { StreamingJsonParser } from '../../src/utils/StreamingJsonParser';
import fs from 'fs-extra';
import path from 'path';
import { DefaultErrorHandler } from '../../src/utils/ErrorHandler';

describe('StreamingJsonParser', () => {
  const testDataDir = path.join(__dirname, '../fixtures');
  const smallFilePath = path.join(testDataDir, 'small-results.json');
  const largeFilePath = path.join(testDataDir, 'large-results.json');
  
  // Create test fixtures directory if it doesn't exist
  beforeAll(async () => {
    await fs.ensureDir(testDataDir);
    
    // Create a small test file
    const smallData = {
      iperf_tests: [
        { id: 1, server: 'test1', scenario: 'tcp', success: true, bandwidth_mbps: 100 },
        { id: 2, server: 'test2', scenario: 'udp', success: true, bandwidth_mbps: 200 }
      ],
      dns_tests: [
        { domain: 'example.com', dns_server: '8.8.8.8', success: true, response_time_ms: 10 },
        { domain: 'test.com', dns_server: '8.8.8.8', success: true, response_time_ms: 15 }
      ]
    };
    
    await fs.writeJson(smallFilePath, smallData, { spaces: 2 });
    
    // Create a larger test file with more entries
    const largeData: any = {
      iperf_tests: [],
      dns_tests: []
    };
    
    // Generate 1000 iperf test entries
    for (let i = 0; i < 1000; i++) {
      largeData.iperf_tests.push({
        id: i,
        server: `server-${i % 10}`,
        scenario: i % 2 === 0 ? 'tcp' : 'udp',
        success: i % 20 !== 0, // Some failures
        bandwidth_mbps: 100 + (i % 900),
        retransmits: i % 2 === 0 ? i % 10 : undefined,
        jitter_ms: i % 2 === 1 ? (i % 5) / 10 : undefined
      });
    }
    
    // Generate 1000 DNS test entries
    for (let i = 0; i < 1000; i++) {
      largeData.dns_tests.push({
        domain: `domain-${i % 50}.com`,
        dns_server: `8.8.8.${i % 10}`,
        success: i % 15 !== 0, // Some failures
        response_time_ms: 5 + (i % 100),
        query_time_ms: 2 + (i % 50)
      });
    }
    
    await fs.writeJson(largeFilePath, largeData, { spaces: 2 });
  });
  
  // Clean up test files after tests
  afterAll(async () => {
    await fs.remove(smallFilePath);
    await fs.remove(largeFilePath);
  });
  
  test('should parse small JSON file using streaming', async () => {
    const parser = new StreamingJsonParser();
    const iperfResults: any[] = [];
    const dnsResults: any[] = [];
    
    // Parse iperf tests
    await parser.parseJsonStream(
      {
        filePath: smallFilePath,
        selector: 'iperf_tests.*',
        batchSize: 10
      },
      async (batch) => {
        iperfResults.push(...batch);
      }
    );
    
    // Parse DNS tests
    await parser.parseJsonStream(
      {
        filePath: smallFilePath,
        selector: 'dns_tests.*',
        batchSize: 10
      },
      async (batch) => {
        dnsResults.push(...batch);
      }
    );
    
    // Verify results
    expect(iperfResults.length).toBe(2);
    expect(dnsResults.length).toBe(2);
    expect(iperfResults[0].server).toBe('test1');
    expect(dnsResults[0].domain).toBe('example.com');
  });
  
  test('should parse large JSON file in batches', async () => {
    const parser = new StreamingJsonParser();
    const iperfResults: any[] = [];
    const dnsResults: any[] = [];
    const batchSizes: number[] = [];
    
    // Parse iperf tests with small batch size
    await parser.parseJsonStream(
      {
        filePath: largeFilePath,
        selector: 'iperf_tests.*',
        batchSize: 50
      },
      async (batch) => {
        iperfResults.push(...batch);
        batchSizes.push(batch.length);
      }
    );
    
    // Parse DNS tests with larger batch size
    await parser.parseJsonStream(
      {
        filePath: largeFilePath,
        selector: 'dns_tests.*',
        batchSize: 100
      },
      async (batch) => {
        dnsResults.push(...batch);
      }
    );
    
    // Verify results
    expect(iperfResults.length).toBe(1000);
    expect(dnsResults.length).toBe(1000);
    
    // Verify batching worked
    expect(batchSizes.length).toBeGreaterThan(1);
    expect(batchSizes[0]).toBeLessThanOrEqual(50);
  });
  
  test('should count objects in JSON file', async () => {
    const parser = new StreamingJsonParser();
    
    const iperfCount = await parser.countObjects({
      filePath: largeFilePath,
      selector: 'iperf_tests.*'
    });
    
    const dnsCount = await parser.countObjects({
      filePath: largeFilePath,
      selector: 'dns_tests.*'
    });
    
    expect(iperfCount).toBe(1000);
    expect(dnsCount).toBe(1000);
  });
  
  test('should detect large files correctly', () => {
    const parser = new StreamingJsonParser();
    
    // Check if large file is detected as large
    const isLargeFile = parser.isLargeFile(largeFilePath, 0.001); // Very small threshold
    expect(isLargeFile).toBe(true);
    
    // Check if small file is detected as small
    const isSmallFile = parser.isLargeFile(smallFilePath, 1); // 1MB threshold
    expect(isSmallFile).toBe(false);
  });
  
  test('should handle errors gracefully', async () => {
    const errorHandler = new DefaultErrorHandler();
    const handleFileSystemErrorSpy = jest.spyOn(errorHandler, 'handleFileSystemError');
    const parser = new StreamingJsonParser(errorHandler);
    
    // Try to parse a non-existent file
    await expect(parser.parseJsonStream(
      {
        filePath: 'non-existent-file.json',
        selector: 'iperf_tests.*',
        errorHandler
      },
      async () => {}
    )).rejects.toThrow();
    
    expect(handleFileSystemErrorSpy).toHaveBeenCalled();
  });
});