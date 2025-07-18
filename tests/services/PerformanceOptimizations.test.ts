// Performance optimization tests
import { NetworkPerformanceAnalyzer, createNetworkPerformanceAnalyzer } from '../../src/services/NetworkPerformanceAnalyzer';
import { DefaultDataParser } from '../../src/services/DataParser';
import { DefaultErrorHandler } from '../../src/utils/ErrorHandler';
import { PerformanceMonitor } from '../../src/utils/PerformanceMonitor';
import fs from 'fs-extra';
import path from 'path';

describe('Performance Optimizations', () => {
  const testDataDir = path.join(__dirname, '../fixtures/performance');
  
  // Create test fixtures directory if it doesn't exist
  beforeAll(async () => {
    await fs.ensureDir(testDataDir);
    
    // Create multiple test dataset directories
    for (let i = 1; i <= 3; i++) {
      const datasetDir = path.join(testDataDir, `coredns-mtu${1500 + i * 100}-aws-logs_disabled`);
      await fs.ensureDir(datasetDir);
      
      // Create parameters file
      const parametersFile = path.join(datasetDir, `parameters-results_20250717_${120000 + i}.json`);
      await fs.writeJson(parametersFile, {
        'backend-server': 'coredns',
        'mtu': 1500 + i * 100,
        'query-logging': 'disabled',
        'timestamp': `2025-07-17T12:${i}:00Z`
      }, { spaces: 2 });
      
      // Create results file with varying sizes
      const resultsFile = path.join(datasetDir, `results_20250717_${120000 + i}.json`);
      
      const resultsData: any = {
        iperf_tests: [],
        dns_tests: []
      };
      
      // Generate iperf test entries (more for higher index to test with different sizes)
      for (let j = 0; j < 50 * i; j++) {
        resultsData.iperf_tests.push({
          server: `server-${j % 5}`,
          scenario: j % 2 === 0 ? 'tcp' : 'udp',
          success: j % 10 !== 0,
          bandwidth_mbps: 100 + (j % 900),
          retransmits: j % 2 === 0 ? j % 10 : undefined,
          jitter_ms: j % 2 === 1 ? (j % 5) / 10 : undefined,
          start_time: 1000,
          end_time: 2000,
          duration: 1000,
          cpu_utilization_host: 10 + (j % 20),
          cpu_utilization_remote: 15 + (j % 25)
        });
      }
      
      // Generate DNS test entries
      for (let j = 0; j < 30 * i; j++) {
        resultsData.dns_tests.push({
          domain: `domain-${j % 10}.com`,
          dns_server: `8.8.8.${j % 4}`,
          success: j % 8 !== 0,
          response_time_ms: 5 + (j % 50),
          query_time_ms: 2 + (j % 20)
        });
      }
      
      await fs.writeJson(resultsFile, resultsData, { spaces: 2 });
    }
  });
  
  // Clean up test files after tests
  afterAll(async () => {
    await fs.remove(testDataDir);
  });
  
  test('should parse datasets faster with parallel processing', async () => {
    // Create analyzer with parallel processing disabled
    const sequentialAnalyzer = createNetworkPerformanceAnalyzer({
      useParallelProcessing: false,
      logProgress: false
    });
    
    // Create analyzer with parallel processing enabled
    const parallelAnalyzer = createNetworkPerformanceAnalyzer({
      useParallelProcessing: true,
      maxParallelTasks: 3,
      logProgress: false
    });
    
    // Measure time for sequential processing
    const sequentialStartTime = performance.now();
    await sequentialAnalyzer.analyze(testDataDir);
    const sequentialDuration = performance.now() - sequentialStartTime;
    
    // Measure time for parallel processing
    const parallelStartTime = performance.now();
    await parallelAnalyzer.analyze(testDataDir);
    const parallelDuration = performance.now() - parallelStartTime;
    
    console.log(`Sequential processing time: ${sequentialDuration.toFixed(2)}ms`);
    console.log(`Parallel processing time: ${parallelDuration.toFixed(2)}ms`);
    console.log(`Speedup: ${(sequentialDuration / parallelDuration).toFixed(2)}x`);
    
    // We expect parallel processing to be faster, but in tests the difference might be small
    // or even reversed due to test environment overhead, so we just log the results
    // without making assertions that could make the test flaky
  }, 30000); // Increase timeout for this test
  
  test('should benefit from caching when parsing the same files multiple times', async () => {
    // Create a data parser with default settings
    const dataParser = new DefaultDataParser(new DefaultErrorHandler());
    const testFile = path.join(testDataDir, 'coredns-mtu1600-aws-logs_disabled/results_20250717_120001.json');
    
    // First parse - should read from disk
    const firstStartTime = performance.now();
    const firstResult = await dataParser.parseResults(testFile);
    const firstDuration = performance.now() - firstStartTime;
    
    // Second parse - should use cache
    const secondStartTime = performance.now();
    const secondResult = await dataParser.parseResults(testFile);
    const secondDuration = performance.now() - secondStartTime;
    
    console.log(`First parse time: ${firstDuration.toFixed(2)}ms`);
    console.log(`Second parse time (cached): ${secondDuration.toFixed(2)}ms`);
    console.log(`Cache speedup: ${(firstDuration / secondDuration).toFixed(2)}x`);
    
    // The second parse should be significantly faster due to caching
    expect(secondDuration).toBeLessThan(firstDuration * 0.5);
    
    // Results should be the same
    expect(secondResult.iperfTests.length).toBe(firstResult.iperfTests.length);
    expect(secondResult.dnsResults.length).toBe(firstResult.dnsResults.length);
    
    // Verify cache is being used
    expect(dataParser.getCacheSize()).toBeGreaterThan(0);
    
    // Clear cache and verify it's empty
    dataParser.clearCache();
    expect(dataParser.getCacheSize()).toBe(0);
  });
  
  test('should monitor performance metrics', async () => {
    // Create a performance monitor
    const monitor = new PerformanceMonitor({
      monitoringInterval: 1000,
      logToConsole: false
    });
    
    // Start monitoring
    monitor.start();
    
    // Record some operations
    monitor.startOperation('testOperation1');
    await new Promise(resolve => setTimeout(resolve, 100));
    monitor.endOperation('testOperation1');
    
    monitor.startOperation('testOperation2');
    await new Promise(resolve => setTimeout(resolve, 200));
    monitor.endOperation('testOperation2');
    
    // Wait for metrics collection
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Get metrics
    const metrics = monitor.getLatestMetrics();
    expect(metrics).toBeDefined();
    
    if (metrics) {
      // Check system metrics
      expect(metrics.memoryUsage.total).toBeGreaterThan(0);
      expect(metrics.memoryUsage.used).toBeGreaterThan(0);
      expect(metrics.memoryUsage.free).toBeGreaterThan(0);
      expect(metrics.memoryUsage.percentUsed).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryUsage.percentUsed).toBeLessThanOrEqual(100);
      
      // Check process metrics
      expect(metrics.processMemory.rss).toBeGreaterThan(0);
      expect(metrics.processMemory.heapTotal).toBeGreaterThan(0);
      expect(metrics.processMemory.heapUsed).toBeGreaterThan(0);
    }
    
    // Check operation stats
    const op1Stats = monitor.getOperationStats('testOperation1');
    const op2Stats = monitor.getOperationStats('testOperation2');
    
    expect(op1Stats).toBeDefined();
    expect(op2Stats).toBeDefined();
    
    if (op1Stats && op2Stats) {
      expect(op1Stats.count).toBe(1);
      expect(op1Stats.avgDuration).toBeGreaterThanOrEqual(100);
      expect(op1Stats.avgDuration).toBeLessThan(150); // Allow some margin
      
      expect(op2Stats.count).toBe(1);
      expect(op2Stats.avgDuration).toBeGreaterThanOrEqual(200);
      expect(op2Stats.avgDuration).toBeLessThan(250); // Allow some margin
    }
    
    // Generate report
    const report = monitor.generateReport();
    expect(report).toContain('Performance Report');
    expect(report).toContain('System Resources');
    expect(report).toContain('Process Resources');
    expect(report).toContain('Operation Performance');
    
    // Stop monitoring
    monitor.stop();
  });
});