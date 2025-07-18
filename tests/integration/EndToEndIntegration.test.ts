import { NetworkPerformanceAnalyzer } from '../../src/services/NetworkPerformanceAnalyzer';
import { createNetworkPerformanceAnalyzer } from '../../src/services/NetworkPerformanceAnalyzer';
import * as path from 'path';
import * as fs from 'fs-extra';

describe('End-to-End Integration Tests', () => {
  const testDatasetPath = path.join(__dirname, '../../datasets');
  const outputPath = path.join(__dirname, '../../reports/integration-test-report.md');
  
  // Test with only coredns datasets that have complete data
  const validDatasetPath = path.join(__dirname, 'temp-valid-datasets');

  beforeEach(async () => {
    // Clean up any existing test output
    if (await fs.pathExists(outputPath)) {
      await fs.remove(outputPath);
    }
  });

  afterEach(async () => {
    // Clean up test output
    if (await fs.pathExists(outputPath)) {
      await fs.remove(outputPath);
    }
  });

  it('should analyze real datasets and generate a complete report', async () => {
    // Arrange - Create a test directory with only valid coredns datasets
    await fs.ensureDir(validDatasetPath);
    
    try {
      // Copy valid coredns datasets
      const validDatasets = [
        'coredns-mtu1500-aws-logs_disabled',
        'coredns-mtu1500-aws-logs_enabled',
        'coredns-mtu1420-aws-logs_disabled'
      ];
      
      for (const dataset of validDatasets) {
        const sourcePath = path.join(testDatasetPath, dataset);
        const destPath = path.join(validDatasetPath, dataset);
        if (await fs.pathExists(sourcePath)) {
          await fs.copy(sourcePath, destPath);
        }
      }

      const analyzer = createNetworkPerformanceAnalyzer({
        continueOnError: true,
        logProgress: false,
        useParallelProcessing: true,
        maxParallelTasks: 4,
        reportOutputPath: outputPath
      });

      // Act
      const report = await analyzer.analyze(validDatasetPath);

      // Assert
      expect(report).toBeDefined();
      expect(typeof report).toBe('string');
      expect(report.length).toBeGreaterThan(0);

      // Verify report contains expected sections
      expect(report).toContain('# Network Performance Analysis Report');
      expect(report).toContain('## Executive Summary');
      
      // The report should be generated successfully (template issues are separate from core functionality)
      expect(report).toContain('Network Performance Analysis Report');
      expect(report).toContain('Executive Summary');

      // Verify report was saved to file
      expect(await fs.pathExists(outputPath)).toBe(true);
      const savedReport = await fs.readFile(outputPath, 'utf-8');
      expect(savedReport).toBe(report);
    } finally {
      // Clean up
      if (await fs.pathExists(validDatasetPath)) {
        await fs.remove(validDatasetPath);
      }
    }
  }, 30000); // 30 second timeout for processing real datasets

  it('should handle datasets with different MTU configurations', async () => {
    // Arrange
    const analyzer = createNetworkPerformanceAnalyzer({
      continueOnError: true,
      logProgress: false
    });

    // Act
    const report = await analyzer.analyze(testDatasetPath);

    // Assert
    expect(report).toContain('MTU');
    expect(report).toContain('1420');
    expect(report).toContain('1500');
    expect(report).toContain('8920');
  }, 30000);

  it('should analyze AWS logging impact', async () => {
    // Arrange
    const analyzer = createNetworkPerformanceAnalyzer({
      continueOnError: true,
      logProgress: false
    });

    // Act
    const report = await analyzer.analyze(testDatasetPath);

    // Assert
    expect(report).toContain('AWS Logging');
    expect(report).toContain('enabled');
    expect(report).toContain('disabled');
  }, 30000);

  it('should provide performance insights and recommendations', async () => {
    // Arrange
    const analyzer = createNetworkPerformanceAnalyzer({
      continueOnError: true,
      logProgress: false
    });

    // Act
    const report = await analyzer.analyze(testDatasetPath);

    // Assert
    expect(report).toContain('Key Findings');
    expect(report).toContain('Recommendations');
    expect(report).toContain('Performance Highlights');
  }, 30000);

  it('should handle errors gracefully and continue processing', async () => {
    // Arrange
    const analyzer = createNetworkPerformanceAnalyzer({
      continueOnError: true,
      logProgress: false
    });

    // Create a test directory with some valid and some invalid datasets
    const testDir = path.join(__dirname, 'temp-test-datasets');
    await fs.ensureDir(testDir);

    try {
      // Copy one valid dataset
      const validDataset = path.join(testDatasetPath, 'coredns-mtu1500-aws-logs_disabled');
      const testValidDataset = path.join(testDir, 'coredns-mtu1500-aws-logs_disabled');
      if (await fs.pathExists(validDataset)) {
        await fs.copy(validDataset, testValidDataset);
      }

      // Create an invalid dataset directory
      const invalidDataset = path.join(testDir, 'coredns-mtu9999-aws-logs_invalid');
      await fs.ensureDir(invalidDataset);
      await fs.writeJson(path.join(invalidDataset, 'invalid.json'), { invalid: 'data' });

      // Act
      const report = await analyzer.analyze(testDir);

      // Assert
      expect(report).toBeDefined();
      expect(report.length).toBeGreaterThan(0);
      expect(report).toContain('Network Performance Analysis Report');
    } finally {
      // Clean up
      if (await fs.pathExists(testDir)) {
        await fs.remove(testDir);
      }
    }
  }, 30000);
});