// Performance Monitor Utility
import os from 'os';
import { EventEmitter } from 'events';

/**
 * Performance metrics collected by the monitor
 */
export interface PerformanceMetrics {
  timestamp: number;
  memoryUsage: {
    total: number;
    used: number;
    free: number;
    percentUsed: number;
  };
  cpuUsage: {
    percentUsed: number;
    loadAverage: number[];
  };
  processMemory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    percentHeapUsed: number;
  };
  operationDurations: Map<string, number[]>;
}

/**
 * Options for the performance monitor
 */
export interface PerformanceMonitorOptions {
  /**
   * Interval in milliseconds to collect metrics
   * @default 5000
   */
  monitoringInterval?: number;
  
  /**
   * Maximum number of metrics to keep in history
   * @default 100
   */
  maxHistorySize?: number;
  
  /**
   * Memory threshold percentage to trigger garbage collection
   * @default 80
   */
  memoryThresholdPercent?: number;
  
  /**
   * Whether to log metrics to console
   * @default false
   */
  logToConsole?: boolean;
}

/**
 * Performance monitor for tracking system and process resource usage
 * Emits events when thresholds are exceeded
 */
export class PerformanceMonitor extends EventEmitter {
  private options: Required<PerformanceMonitorOptions>;
  private metricsHistory: PerformanceMetrics[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private operationTimers: Map<string, number> = new Map();
  private operationDurations: Map<string, number[]> = new Map();
  
  /**
   * Creates a new PerformanceMonitor instance
   * @param options Configuration options
   */
  constructor(options: PerformanceMonitorOptions = {}) {
    super();
    
    this.options = {
      monitoringInterval: options.monitoringInterval || 5000,
      maxHistorySize: options.maxHistorySize || 100,
      memoryThresholdPercent: options.memoryThresholdPercent || 80,
      logToConsole: options.logToConsole || false
    };
  }
  
  /**
   * Start monitoring performance metrics
   */
  start(): void {
    if (this.monitoringInterval) {
      return; // Already running
    }
    
    // Collect initial metrics
    this.collectMetrics();
    
    // Set up interval for collecting metrics
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, this.options.monitoringInterval);
    
    console.log(`[PerformanceMonitor] Started monitoring at ${this.options.monitoringInterval}ms intervals`);
  }
  
  /**
   * Stop monitoring performance metrics
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('[PerformanceMonitor] Stopped monitoring');
    }
  }
  
  /**
   * Start timing an operation
   * @param operationName Name of the operation to time
   */
  startOperation(operationName: string): void {
    this.operationTimers.set(operationName, performance.now());
  }
  
  /**
   * End timing an operation and record its duration
   * @param operationName Name of the operation that was timed
   * @returns Duration of the operation in milliseconds, or undefined if the operation wasn't started
   */
  endOperation(operationName: string): number | undefined {
    const startTime = this.operationTimers.get(operationName);
    if (startTime === undefined) {
      return undefined;
    }
    
    const duration = performance.now() - startTime;
    this.operationTimers.delete(operationName);
    
    // Add to durations list
    if (!this.operationDurations.has(operationName)) {
      this.operationDurations.set(operationName, []);
    }
    
    const durations = this.operationDurations.get(operationName)!;
    durations.push(duration);
    
    // Keep only the last 100 durations
    if (durations.length > 100) {
      durations.shift();
    }
    
    return duration;
  }
  
  /**
   * Get the latest performance metrics
   * @returns The most recent metrics, or undefined if no metrics have been collected
   */
  getLatestMetrics(): PerformanceMetrics | undefined {
    if (this.metricsHistory.length === 0) {
      return undefined;
    }
    
    return this.metricsHistory[this.metricsHistory.length - 1];
  }
  
  /**
   * Get all collected metrics history
   * @returns Array of all collected metrics
   */
  getMetricsHistory(): PerformanceMetrics[] {
    return [...this.metricsHistory];
  }
  
  /**
   * Get statistics for a specific operation
   * @param operationName Name of the operation
   * @returns Statistics for the operation, or undefined if no data is available
   */
  getOperationStats(operationName: string): {
    count: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
  } | undefined {
    const durations = this.operationDurations.get(operationName);
    if (!durations || durations.length === 0) {
      return undefined;
    }
    
    const count = durations.length;
    const avgDuration = durations.reduce((sum, val) => sum + val, 0) / count;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    
    return {
      count,
      avgDuration,
      minDuration,
      maxDuration
    };
  }
  
  /**
   * Get statistics for all operations
   * @returns Map of operation names to their statistics
   */
  getAllOperationStats(): Map<string, {
    count: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
  }> {
    const stats = new Map();
    
    for (const [operationName, durations] of this.operationDurations.entries()) {
      if (durations.length === 0) {
        continue;
      }
      
      const count = durations.length;
      const avgDuration = durations.reduce((sum, val) => sum + val, 0) / count;
      const minDuration = Math.min(...durations);
      const maxDuration = Math.max(...durations);
      
      stats.set(operationName, {
        count,
        avgDuration,
        minDuration,
        maxDuration
      });
    }
    
    return stats;
  }
  
  /**
   * Generate a performance report in markdown format
   * @returns Markdown formatted performance report
   */
  generateReport(): string {
    const latest = this.getLatestMetrics();
    if (!latest) {
      return '# Performance Report\n\nNo metrics available.';
    }
    
    let report = '# Performance Report\n\n';
    
    // System metrics
    report += '## System Resources\n\n';
    report += `- **Memory Usage**: ${latest.memoryUsage.percentUsed.toFixed(1)}% (${this.formatBytes(latest.memoryUsage.used)} / ${this.formatBytes(latest.memoryUsage.total)})\n`;
    report += `- **CPU Usage**: ${latest.cpuUsage.percentUsed.toFixed(1)}%\n`;
    report += `- **Load Average**: ${latest.cpuUsage.loadAverage.map(load => load.toFixed(2)).join(', ')}\n\n`;
    
    // Process metrics
    report += '## Process Resources\n\n';
    report += `- **RSS**: ${this.formatBytes(latest.processMemory.rss)}\n`;
    report += `- **Heap Usage**: ${latest.processMemory.percentHeapUsed.toFixed(1)}% (${this.formatBytes(latest.processMemory.heapUsed)} / ${this.formatBytes(latest.processMemory.heapTotal)})\n`;
    report += `- **External Memory**: ${this.formatBytes(latest.processMemory.external)}\n\n`;
    
    // Operation durations
    report += '## Operation Performance\n\n';
    
    const stats = this.getAllOperationStats();
    if (stats.size === 0) {
      report += 'No operation timing data available.\n';
    } else {
      report += '| Operation | Count | Avg Duration (ms) | Min Duration (ms) | Max Duration (ms) |\n';
      report += '|-----------|-------|------------------|------------------|------------------|\n';
      
      for (const [name, opStats] of stats.entries()) {
        report += `| ${name} | ${opStats.count} | ${opStats.avgDuration.toFixed(2)} | ${opStats.minDuration.toFixed(2)} | ${opStats.maxDuration.toFixed(2)} |\n`;
      }
    }
    
    return report;
  }
  
  /**
   * Collect current performance metrics
   * @private
   */
  private collectMetrics(): void {
    // System memory
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const percentUsed = (usedMem / totalMem) * 100;
    
    // CPU usage (approximation)
    const cpus = os.cpus();
    const cpuUsage = this.calculateCpuUsage(cpus);
    const loadAverage = os.loadavg();
    
    // Process memory
    const processMemory = process.memoryUsage();
    const percentHeapUsed = (processMemory.heapUsed / processMemory.heapTotal) * 100;
    
    // Create metrics object
    const metrics: PerformanceMetrics = {
      timestamp: Date.now(),
      memoryUsage: {
        total: totalMem,
        used: usedMem,
        free: freeMem,
        percentUsed
      },
      cpuUsage: {
        percentUsed: cpuUsage,
        loadAverage
      },
      processMemory: {
        rss: processMemory.rss,
        heapTotal: processMemory.heapTotal,
        heapUsed: processMemory.heapUsed,
        external: processMemory.external,
        percentHeapUsed
      },
      operationDurations: new Map(this.operationDurations)
    };
    
    // Add to history
    this.metricsHistory.push(metrics);
    
    // Trim history if needed
    if (this.metricsHistory.length > this.options.maxHistorySize) {
      this.metricsHistory.shift();
    }
    
    // Check thresholds
    this.checkThresholds(metrics);
    
    // Log if enabled
    if (this.options.logToConsole) {
      console.log(`[PerformanceMonitor] Memory: ${percentUsed.toFixed(1)}%, Heap: ${percentHeapUsed.toFixed(1)}%, CPU: ${cpuUsage.toFixed(1)}%`);
    }
  }
  
  /**
   * Check if any thresholds have been exceeded
   * @param metrics Current metrics
   * @private
   */
  private checkThresholds(metrics: PerformanceMetrics): void {
    // Check memory threshold
    if (metrics.processMemory.percentHeapUsed > this.options.memoryThresholdPercent) {
      this.emit('memory-threshold-exceeded', {
        threshold: this.options.memoryThresholdPercent,
        current: metrics.processMemory.percentHeapUsed,
        metrics
      });
      
      // Try to force garbage collection if available
      if (global.gc) {
        console.log(`[PerformanceMonitor] Memory threshold exceeded (${metrics.processMemory.percentHeapUsed.toFixed(1)}%), triggering garbage collection`);
        global.gc();
      }
    }
  }
  
  /**
   * Calculate CPU usage percentage
   * @param cpus CPU information from os.cpus()
   * @returns CPU usage percentage
   * @private
   */
  private calculateCpuUsage(cpus: os.CpuInfo[]): number {
    let totalIdle = 0;
    let totalTick = 0;
    
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    }
    
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usedCpu = 100 - (idle / total) * 100;
    
    return usedCpu;
  }
  
  /**
   * Format bytes to a human-readable string
   * @param bytes Number of bytes
   * @returns Formatted string (e.g., "1.23 MB")
   * @private
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }
}

// Use the existing Node.js gc type declaration