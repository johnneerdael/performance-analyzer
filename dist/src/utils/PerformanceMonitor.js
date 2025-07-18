"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMonitor = void 0;
// Performance Monitor Utility
const os_1 = __importDefault(require("os"));
const events_1 = require("events");
/**
 * Performance monitor for tracking system and process resource usage
 * Emits events when thresholds are exceeded
 */
class PerformanceMonitor extends events_1.EventEmitter {
    /**
     * Creates a new PerformanceMonitor instance
     * @param options Configuration options
     */
    constructor(options = {}) {
        super();
        this.metricsHistory = [];
        this.monitoringInterval = null;
        this.operationTimers = new Map();
        this.operationDurations = new Map();
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
    start() {
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
    stop() {
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
    startOperation(operationName) {
        this.operationTimers.set(operationName, performance.now());
    }
    /**
     * End timing an operation and record its duration
     * @param operationName Name of the operation that was timed
     * @returns Duration of the operation in milliseconds, or undefined if the operation wasn't started
     */
    endOperation(operationName) {
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
        const durations = this.operationDurations.get(operationName);
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
    getLatestMetrics() {
        if (this.metricsHistory.length === 0) {
            return undefined;
        }
        return this.metricsHistory[this.metricsHistory.length - 1];
    }
    /**
     * Get all collected metrics history
     * @returns Array of all collected metrics
     */
    getMetricsHistory() {
        return [...this.metricsHistory];
    }
    /**
     * Get statistics for a specific operation
     * @param operationName Name of the operation
     * @returns Statistics for the operation, or undefined if no data is available
     */
    getOperationStats(operationName) {
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
    getAllOperationStats() {
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
    generateReport() {
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
        }
        else {
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
    collectMetrics() {
        // System memory
        const totalMem = os_1.default.totalmem();
        const freeMem = os_1.default.freemem();
        const usedMem = totalMem - freeMem;
        const percentUsed = (usedMem / totalMem) * 100;
        // CPU usage (approximation)
        const cpus = os_1.default.cpus();
        const cpuUsage = this.calculateCpuUsage(cpus);
        const loadAverage = os_1.default.loadavg();
        // Process memory
        const processMemory = process.memoryUsage();
        const percentHeapUsed = (processMemory.heapUsed / processMemory.heapTotal) * 100;
        // Create metrics object
        const metrics = {
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
    checkThresholds(metrics) {
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
    calculateCpuUsage(cpus) {
        let totalIdle = 0;
        let totalTick = 0;
        for (const cpu of cpus) {
            for (const type in cpu.times) {
                totalTick += cpu.times[type];
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
    formatBytes(bytes) {
        if (bytes === 0)
            return '0 B';
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
// Use the existing Node.js gc type declaration
//# sourceMappingURL=PerformanceMonitor.js.map