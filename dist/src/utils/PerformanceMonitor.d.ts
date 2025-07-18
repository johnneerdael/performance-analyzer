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
export declare class PerformanceMonitor extends EventEmitter {
    private options;
    private metricsHistory;
    private monitoringInterval;
    private operationTimers;
    private operationDurations;
    /**
     * Creates a new PerformanceMonitor instance
     * @param options Configuration options
     */
    constructor(options?: PerformanceMonitorOptions);
    /**
     * Start monitoring performance metrics
     */
    start(): void;
    /**
     * Stop monitoring performance metrics
     */
    stop(): void;
    /**
     * Start timing an operation
     * @param operationName Name of the operation to time
     */
    startOperation(operationName: string): void;
    /**
     * End timing an operation and record its duration
     * @param operationName Name of the operation that was timed
     * @returns Duration of the operation in milliseconds, or undefined if the operation wasn't started
     */
    endOperation(operationName: string): number | undefined;
    /**
     * Get the latest performance metrics
     * @returns The most recent metrics, or undefined if no metrics have been collected
     */
    getLatestMetrics(): PerformanceMetrics | undefined;
    /**
     * Get all collected metrics history
     * @returns Array of all collected metrics
     */
    getMetricsHistory(): PerformanceMetrics[];
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
    } | undefined;
    /**
     * Get statistics for all operations
     * @returns Map of operation names to their statistics
     */
    getAllOperationStats(): Map<string, {
        count: number;
        avgDuration: number;
        minDuration: number;
        maxDuration: number;
    }>;
    /**
     * Generate a performance report in markdown format
     * @returns Markdown formatted performance report
     */
    generateReport(): string;
    /**
     * Collect current performance metrics
     * @private
     */
    private collectMetrics;
    /**
     * Check if any thresholds have been exceeded
     * @param metrics Current metrics
     * @private
     */
    private checkThresholds;
    /**
     * Calculate CPU usage percentage
     * @param cpus CPU information from os.cpus()
     * @returns CPU usage percentage
     * @private
     */
    private calculateCpuUsage;
    /**
     * Format bytes to a human-readable string
     * @param bytes Number of bytes
     * @returns Formatted string (e.g., "1.23 MB")
     * @private
     */
    private formatBytes;
}
//# sourceMappingURL=PerformanceMonitor.d.ts.map