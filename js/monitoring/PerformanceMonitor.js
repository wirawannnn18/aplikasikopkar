/**
 * Performance Monitoring System for Integrasi Pembayaran Laporan
 * Tracks application performance metrics, user interactions, and system resources
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = [];
        this.maxMetrics = 1000;
        this.flushInterval = 60000; // 1 minute
        this.setupPerformanceObserver();
        this.trackCustomMetrics();
        this.startPeriodicFlush();
    }
    
    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            try {
                // Track navigation timing
                const navObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.trackMetric({
                            type: 'navigation',
                            name: entry.name,
                            duration: entry.duration,
                            startTime: entry.startTime,
                            loadEventEnd: entry.loadEventEnd,
                            domContentLoadedEventEnd: entry.domContentLoadedEventEnd,
                            timestamp: new Date().toISOString()
                        });
                    }
                });
                navObserver.observe({ entryTypes: ['navigation'] });
                
                // Track resource loading
                const resourceObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.name.includes('.js') || entry.name.includes('.css')) {
                            this.trackMetric({
                                type: 'resource',
                                name: entry.name,
                                duration: entry.duration,
                                size: entry.transferSize || entry.encodedBodySize,
                                cached: entry.transferSize === 0 && entry.encodedBodySize > 0,
                                timestamp: new Date().toISOString()
                            });
                        }
                    }
                });
                resourceObserver.observe({ entryTypes: ['resource'] });
                
                // Track long tasks (performance bottlenecks)
                if ('longtask' in PerformanceObserver.supportedEntryTypes) {
                    const longTaskObserver = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            this.trackMetric({
                                type: 'long_task',
                                duration: entry.duration,
                                startTime: entry.startTime,
                                timestamp: new Date().toISOString()
                            });
                        }
                    });
                    longTaskObserver.observe({ entryTypes: ['longtask'] });
                }
                
                // Track layout shifts
                if ('layout-shift' in PerformanceObserver.supportedEntryTypes) {
                    const clsObserver = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            if (!entry.hadRecentInput) {
                                this.trackMetric({
                                    type: 'layout_shift',
                                    value: entry.value,
                                    startTime: entry.startTime,
                                    timestamp: new Date().toISOString()
                                });
                            }
                        }
                    });
                    clsObserver.observe({ entryTypes: ['layout-shift'] });
                }
            } catch (error) {
                console.warn('Performance Observer setup failed:', error);
            }
        }
    }
    
    trackCustomMetrics() {
        // Track tab switching performance
        this.trackTabSwitchPerformance();
        
        // Track payment processing performance
        this.trackPaymentPerformance();
        
        // Track import batch performance
        this.trackImportPerformance();
        
        // Track UI interaction performance
        this.trackUIInteractions();
        
        // Track memory usage periodically
        this.trackMemoryUsage();
    }
    
    trackTabSwitchPerformance() {
        // Override tab switching function if it exists
        const originalSwitchTab = window.switchTab;
        if (originalSwitchTab) {
            window.switchTab = (tabName) => {
                const startTime = performance.now();
                const startMemory = this.getCurrentMemoryUsage();
                
                try {
                    const result = originalSwitchTab.call(this, tabName);
                    const endTime = performance.now();
                    const endMemory = this.getCurrentMemoryUsage();
                    
                    this.trackMetric({
                        type: 'tab_switch',
                        tabName: tabName,
                        duration: endTime - startTime,
                        memoryDelta: endMemory - startMemory,
                        success: true,
                        timestamp: new Date().toISOString()
                    });
                    
                    return result;
                } catch (error) {
                    const endTime = performance.now();
                    
                    this.trackMetric({
                        type: 'tab_switch',
                        tabName: tabName,
                        duration: endTime - startTime,
                        success: false,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                    
                    throw error;
                }
            };
        }
    }
    
    trackPaymentPerformance() {
        // Override payment processing functions to track performance
        const originalProcessPayment = window.processPayment;
        if (originalProcessPayment) {
            window.processPayment = async (...args) => {
                const startTime = performance.now();
                const startMemory = this.getCurrentMemoryUsage();
                
                try {
                    const result = await originalProcessPayment.apply(this, args);
                    const endTime = performance.now();
                    const endMemory = this.getCurrentMemoryUsage();
                    
                    this.trackMetric({
                        type: 'payment_processing',
                        mode: 'manual',
                        duration: endTime - startTime,
                        memoryDelta: endMemory - startMemory,
                        success: true,
                        timestamp: new Date().toISOString()
                    });
                    
                    return result;
                } catch (error) {
                    const endTime = performance.now();
                    
                    this.trackMetric({
                        type: 'payment_processing',
                        mode: 'manual',
                        duration: endTime - startTime,
                        success: false,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                    
                    throw error;
                }
            };
        }
    }
    
    trackImportPerformance() {
        // Track import batch processing performance
        const originalProcessBatch = window.processBatchPayments;
        if (originalProcessBatch) {
            window.processBatchPayments = async (...args) => {
                const startTime = performance.now();
                const startMemory = this.getCurrentMemoryUsage();
                const batchSize = args[0]?.length || 0;
                
                try {
                    const result = await originalProcessBatch.apply(this, args);
                    const endTime = performance.now();
                    const endMemory = this.getCurrentMemoryUsage();
                    
                    this.trackMetric({
                        type: 'batch_processing',
                        mode: 'import',
                        batchSize: batchSize,
                        duration: endTime - startTime,
                        memoryDelta: endMemory - startMemory,
                        throughput: batchSize / ((endTime - startTime) / 1000), // items per second
                        success: true,
                        timestamp: new Date().toISOString()
                    });
                    
                    return result;
                } catch (error) {
                    const endTime = performance.now();
                    
                    this.trackMetric({
                        type: 'batch_processing',
                        mode: 'import',
                        batchSize: batchSize,
                        duration: endTime - startTime,
                        success: false,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                    
                    throw error;
                }
            };
        }
    }
    
    trackUIInteractions() {
        // Track click performance
        document.addEventListener('click', (event) => {
            const startTime = performance.now();
            
            // Use requestAnimationFrame to measure actual rendering time
            requestAnimationFrame(() => {
                const endTime = performance.now();
                
                this.trackMetric({
                    type: 'ui_interaction',
                    interaction: 'click',
                    element: event.target.tagName.toLowerCase(),
                    className: event.target.className,
                    duration: endTime - startTime,
                    timestamp: new Date().toISOString()
                });
            });
        });
        
        // Track form submission performance
        document.addEventListener('submit', (event) => {
            const startTime = performance.now();
            const form = event.target;
            
            setTimeout(() => {
                const endTime = performance.now();
                
                this.trackMetric({
                    type: 'form_submission',
                    formId: form.id,
                    formAction: form.action,
                    duration: endTime - startTime,
                    timestamp: new Date().toISOString()
                });
            }, 0);
        });
        
        // Track input performance (debounced)
        let inputTimeout;
        document.addEventListener('input', (event) => {
            clearTimeout(inputTimeout);
            inputTimeout = setTimeout(() => {
                const startTime = performance.now();
                
                requestAnimationFrame(() => {
                    const endTime = performance.now();
                    
                    this.trackMetric({
                        type: 'input_response',
                        inputType: event.target.type,
                        valueLength: event.target.value.length,
                        duration: endTime - startTime,
                        timestamp: new Date().toISOString()
                    });
                });
            }, 300);
        });
    }
    
    trackMemoryUsage() {
        // Track memory usage every 30 seconds
        setInterval(() => {
            const memoryUsage = this.getCurrentMemoryUsage();
            const storageUsage = this.getStorageUsage();
            
            this.trackMetric({
                type: 'memory_usage',
                jsHeapSize: memoryUsage,
                localStorageSize: storageUsage.localStorage,
                sessionStorageSize: storageUsage.sessionStorage,
                timestamp: new Date().toISOString()
            });
        }, 30000);
    }
    
    getCurrentMemoryUsage() {
        if ('memory' in performance) {
            return performance.memory.usedJSHeapSize;
        }
        return 0;
    }
    
    getStorageUsage() {
        try {
            let localStorageSize = 0;
            let sessionStorageSize = 0;
            
            // Calculate localStorage size
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    localStorageSize += localStorage[key].length + key.length;
                }
            }
            
            // Calculate sessionStorage size
            for (let key in sessionStorage) {
                if (sessionStorage.hasOwnProperty(key)) {
                    sessionStorageSize += sessionStorage[key].length + key.length;
                }
            }
            
            return {
                localStorage: localStorageSize,
                sessionStorage: sessionStorageSize
            };
        } catch (error) {
            return {
                localStorage: 0,
                sessionStorage: 0
            };
        }
    }
    
    trackMetric(metric) {
        // Add context information
        const enrichedMetric = {
            ...metric,
            sessionId: this.getSessionId(),
            userId: this.getCurrentUserId(),
            feature: 'integrasi-pembayaran-laporan',
            activeTab: this.getActiveTab(),
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            connectionType: this.getConnectionType()
        };
        
        this.metrics.push(enrichedMetric);
        
        // Check for performance issues
        this.checkPerformanceThresholds(enrichedMetric);
        
        // Manage metrics array size
        if (this.metrics.length > this.maxMetrics) {
            this.metrics.splice(0, this.metrics.length - this.maxMetrics);
        }
        
        // Store critical metrics locally
        if (this.isCriticalMetric(enrichedMetric)) {
            this.storeCriticalMetric(enrichedMetric);
        }
    }
    
    isCriticalMetric(metric) {
        const criticalTypes = ['long_task', 'layout_shift'];
        const criticalThresholds = {
            tab_switch: 2000, // 2 seconds
            payment_processing: 10000, // 10 seconds
            batch_processing: 60000, // 1 minute
            navigation: 5000 // 5 seconds
        };
        
        return criticalTypes.includes(metric.type) || 
               (criticalThresholds[metric.type] && metric.duration > criticalThresholds[metric.type]);
    }
    
    storeCriticalMetric(metric) {
        try {
            const criticalMetrics = JSON.parse(localStorage.getItem('performanceMonitor_critical') || '[]');
            criticalMetrics.push(metric);
            
            // Keep only last 50 critical metrics
            if (criticalMetrics.length > 50) {
                criticalMetrics.splice(0, criticalMetrics.length - 50);
            }
            
            localStorage.setItem('performanceMonitor_critical', JSON.stringify(criticalMetrics));
        } catch (error) {
            console.warn('Failed to store critical metric:', error);
        }
    }
    
    checkPerformanceThresholds(metric) {
        const thresholds = {
            tab_switch: 1000, // 1 second
            payment_processing: 5000, // 5 seconds
            batch_processing: 30000, // 30 seconds
            navigation: 3000, // 3 seconds
            resource: 2000, // 2 seconds
            ui_interaction: 100, // 100ms
            form_submission: 500, // 500ms
            input_response: 50 // 50ms
        };
        
        const threshold = thresholds[metric.type];
        if (threshold && metric.duration > threshold) {
            this.triggerPerformanceAlert(metric, threshold);
        }
        
        // Check memory usage thresholds
        if (metric.type === 'memory_usage' && metric.jsHeapSize > 50 * 1024 * 1024) { // 50MB
            this.triggerMemoryAlert(metric);
        }
    }
    
    triggerPerformanceAlert(metric, threshold) {
        const alert = {
            type: 'performance_degradation',
            metric: metric,
            threshold: threshold,
            severity: metric.duration > threshold * 2 ? 'high' : 'medium',
            timestamp: new Date().toISOString()
        };
        
        // Send to error tracker if available
        if (window.errorTracker) {
            window.errorTracker.trackCustomError('Performance degradation detected', alert);
        }
    }
    
    triggerMemoryAlert(metric) {
        const alert = {
            type: 'memory_usage_high',
            metric: metric,
            severity: 'medium',
            timestamp: new Date().toISOString()
        };
        
        // Send to error tracker if available
        if (window.errorTracker) {
            window.errorTracker.trackCustomError('High memory usage detected', alert);
        }
    }
    
    startPeriodicFlush() {
        setInterval(() => {
            this.flushMetrics();
        }, this.flushInterval);
    }
    
    flushMetrics() {
        if (this.metrics.length === 0) return;
        
        const metrics = [...this.metrics];
        this.metrics = [];
        
        // Send to monitoring service
        this.sendToMonitoringService(metrics);
        
        // Update performance statistics
        this.updatePerformanceStatistics(metrics);
    }
    
    sendToMonitoringService(metrics) {
        fetch('/api/monitoring/metrics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                metrics: metrics,
                timestamp: new Date().toISOString(),
                source: 'integrasi-pembayaran-laporan'
            })
        }).catch(err => {
            console.warn('Failed to send metrics to monitoring service:', err);
        });
    }
    
    updatePerformanceStatistics(metrics) {
        try {
            const stats = JSON.parse(localStorage.getItem('performanceMonitor_stats') || '{}');
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            
            if (!stats[today]) {
                stats[today] = {
                    total: 0,
                    byType: {},
                    averages: {}
                };
            }
            
            metrics.forEach(metric => {
                stats[today].total++;
                
                const type = metric.type;
                if (!stats[today].byType[type]) {
                    stats[today].byType[type] = 0;
                }
                stats[today].byType[type]++;
                
                // Calculate averages for duration-based metrics
                if (metric.duration !== undefined) {
                    if (!stats[today].averages[type]) {
                        stats[today].averages[type] = { sum: 0, count: 0 };
                    }
                    stats[today].averages[type].sum += metric.duration;
                    stats[today].averages[type].count++;
                }
            });
            
            // Keep only last 30 days of stats
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            Object.keys(stats).forEach(date => {
                if (new Date(date) < thirtyDaysAgo) {
                    delete stats[date];
                }
            });
            
            localStorage.setItem('performanceMonitor_stats', JSON.stringify(stats));
        } catch (error) {
            console.warn('Failed to update performance statistics:', error);
        }
    }
    
    getActiveTab() {
        const activeTab = document.querySelector('.tab-btn.active');
        return activeTab ? activeTab.dataset.tab : 'unknown';
    }
    
    getSessionId() {
        return sessionStorage.getItem('sessionId') || 'anonymous';
    }
    
    getCurrentUserId() {
        return localStorage.getItem('currentUser') || 'anonymous';
    }
    
    getConnectionType() {
        if ('connection' in navigator) {
            return {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            };
        }
        return null;
    }
    
    // Public methods for manual performance tracking
    startTimer(name) {
        const timerId = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        performance.mark(`${timerId}_start`);
        return timerId;
    }
    
    endTimer(timerId, context = {}) {
        const endMark = `${timerId}_end`;
        performance.mark(endMark);
        
        try {
            performance.measure(timerId, `${timerId}_start`, endMark);
            const measure = performance.getEntriesByName(timerId)[0];
            
            this.trackMetric({
                type: 'custom_timer',
                name: timerId.split('_')[0],
                duration: measure.duration,
                context: context,
                timestamp: new Date().toISOString()
            });
            
            // Clean up marks and measures
            performance.clearMarks(`${timerId}_start`);
            performance.clearMarks(endMark);
            performance.clearMeasures(timerId);
            
            return measure.duration;
        } catch (error) {
            console.warn('Failed to end timer:', error);
            return null;
        }
    }
    
    // Get performance statistics
    getPerformanceStatistics() {
        try {
            return JSON.parse(localStorage.getItem('performanceMonitor_stats') || '{}');
        } catch (error) {
            return {};
        }
    }
    
    // Get recent critical metrics
    getCriticalMetrics() {
        try {
            return JSON.parse(localStorage.getItem('performanceMonitor_critical') || '[]');
        } catch (error) {
            return [];
        }
    }
    
    // Clear performance data (for testing/debugging)
    clearPerformanceData() {
        localStorage.removeItem('performanceMonitor_stats');
        localStorage.removeItem('performanceMonitor_critical');
        this.metrics = [];
    }
}

// Initialize performance monitoring
if (typeof window !== 'undefined') {
    window.performanceMonitor = new PerformanceMonitor();
    
    // Expose for debugging in development
    if (window.location.hostname === 'localhost') {
        window.PerformanceMonitor = PerformanceMonitor;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}