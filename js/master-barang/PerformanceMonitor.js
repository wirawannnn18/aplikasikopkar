/**
 * Master Barang Komprehensif - Performance Monitor
 * Monitors and tracks performance metrics for optimization
 */

export class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.thresholds = {
            crud_operation: 100, // ms
            search_operation: 50, // ms
            bulk_operation: 1000, // ms
            export_operation: 2000, // ms
            import_operation: 3000, // ms
            concurrent_reads: 2000, // ms
            large_dataset_creation: 5000 // ms
        };
        this.history = [];
        this.maxHistorySize = 1000;
    }
    
    /**
     * Start timing an operation
     * @param {string} operationName - Name of the operation
     * @param {Object} metadata - Additional metadata
     */
    startTimer(operationName, metadata = {}) {
        const startTime = performance.now();
        this.metrics.set(operationName, {
            startTime: startTime,
            endTime: null,
            duration: null,
            metadata: metadata,
            timestamp: Date.now()
        });
        
        return startTime;
    }
    
    /**
     * End timing an operation
     * @param {string} operationName - Name of the operation
     * @returns {Object} Performance metric
     */
    endTimer(operationName) {
        const metric = this.metrics.get(operationName);
        if (!metric) {
            console.warn(`Performance timer '${operationName}' was not started`);
            return null;
        }
        
        const endTime = performance.now();
        metric.endTime = endTime;
        metric.duration = endTime - metric.startTime;
        
        // Check if operation exceeds threshold
        const threshold = this.thresholds[operationName] || 1000;
        metric.exceedsThreshold = metric.duration > threshold;
        
        if (metric.exceedsThreshold) {
            console.warn(`Performance warning: ${operationName} took ${metric.duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
        }
        
        // Add to history
        this.addToHistory(operationName, metric);
        
        return metric;
    }
    
    /**
     * Add metric to history
     * @param {string} operationName - Operation name
     * @param {Object} metric - Performance metric
     */
    addToHistory(operationName, metric) {
        this.history.push({
            operation: operationName,
            duration: metric.duration,
            timestamp: metric.timestamp,
            exceedsThreshold: metric.exceedsThreshold,
            metadata: metric.metadata
        });
        
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }
    
    /**
     * Get current metrics
     * @returns {Object} Current metrics
     */
    getMetrics() {
        const results = {};
        this.metrics.forEach((value, key) => {
            results[key] = {
                duration: value.duration,
                exceedsThreshold: value.exceedsThreshold,
                timestamp: value.timestamp,
                metadata: value.metadata
            };
        });
        return results;
    }
    
    /**
     * Get performance statistics
     * @param {string} operationName - Optional operation name filter
     * @returns {Object} Performance statistics
     */
    getStatistics(operationName = null) {
        let filteredHistory = this.history;
        
        if (operationName) {
            filteredHistory = this.history.filter(h => h.operation === operationName);
        }
        
        if (filteredHistory.length === 0) {
            return {
                count: 0,
                averageDuration: 0,
                minDuration: 0,
                maxDuration: 0,
                thresholdViolations: 0
            };
        }
        
        const durations = filteredHistory.map(h => h.duration);
        const thresholdViolations = filteredHistory.filter(h => h.exceedsThreshold).length;
        
        return {
            count: filteredHistory.length,
            averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
            minDuration: Math.min(...durations),
            maxDuration: Math.max(...durations),
            thresholdViolations: thresholdViolations,
            thresholdViolationRate: (thresholdViolations / filteredHistory.length) * 100
        };
    }
    
    /**
     * Get slow operations
     * @param {number} limit - Number of results to return
     * @returns {Array} Slowest operations
     */
    getSlowOperations(limit = 10) {
        return this.history
            .sort((a, b) => b.duration - a.duration)
            .slice(0, limit);
    }
    
    /**
     * Clear metrics and history
     */
    clear() {
        this.metrics.clear();
        this.history = [];
    }
    
    /**
     * Set performance threshold for operation
     * @param {string} operationName - Operation name
     * @param {number} threshold - Threshold in milliseconds
     */
    setThreshold(operationName, threshold) {
        this.thresholds[operationName] = threshold;
    }
    
    /**
     * Get performance report
     * @returns {Object} Comprehensive performance report
     */
    getPerformanceReport() {
        const operations = [...new Set(this.history.map(h => h.operation))];
        const report = {
            summary: {
                totalOperations: this.history.length,
                uniqueOperations: operations.length,
                totalThresholdViolations: this.history.filter(h => h.exceedsThreshold).length,
                reportGeneratedAt: new Date().toISOString()
            },
            operationStats: {},
            slowestOperations: this.getSlowOperations(5),
            recentActivity: this.history.slice(-10)
        };
        
        // Generate stats for each operation type
        operations.forEach(op => {
            report.operationStats[op] = this.getStatistics(op);
        });
        
        return report;
    }
    
    /**
     * Export performance data
     * @param {string} format - Export format ('json' or 'csv')
     * @returns {Object} Export result
     */
    exportPerformanceData(format = 'json') {
        try {
            if (format === 'json') {
                const data = {
                    report: this.getPerformanceReport(),
                    rawData: this.history,
                    thresholds: this.thresholds
                };
                
                return {
                    success: true,
                    content: JSON.stringify(data, null, 2),
                    filename: `performance_report_${new Date().toISOString().split('T')[0]}.json`,
                    format: 'json'
                };
            } else if (format === 'csv') {
                const csvRows = ['Operation,Duration,Timestamp,Exceeds Threshold,Metadata'];
                
                this.history.forEach(h => {
                    csvRows.push([
                        h.operation,
                        h.duration.toFixed(2),
                        new Date(h.timestamp).toISOString(),
                        h.exceedsThreshold ? 'Yes' : 'No',
                        JSON.stringify(h.metadata || {})
                    ].join(','));
                });
                
                return {
                    success: true,
                    content: csvRows.join('\n'),
                    filename: `performance_data_${new Date().toISOString().split('T')[0]}.csv`,
                    format: 'csv'
                };
            } else {
                throw new Error('Unsupported export format');
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}