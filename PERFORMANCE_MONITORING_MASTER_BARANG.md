# Performance Monitoring Setup - Master Barang Komprehensif

## Overview

Dokumen ini menjelaskan setup monitoring performa untuk sistem Master Barang Komprehensif, termasuk metrics yang dipantau, tools yang digunakan, dan threshold alerting.

## Key Performance Indicators (KPIs)

### 1. Load Time Metrics
- **Page Load Time**: < 3 detik (target)
- **Time to First Byte (TTFB)**: < 500ms
- **First Contentful Paint (FCP)**: < 1.5 detik
- **Largest Contentful Paint (LCP)**: < 2.5 detik
- **Cumulative Layout Shift (CLS)**: < 0.1

### 2. Runtime Performance
- **JavaScript Execution Time**: < 100ms per operation
- **Memory Usage**: < 100MB untuk 1000 items
- **Search Response Time**: < 300ms
- **Filter Application Time**: < 200ms
- **Save Operation Time**: < 1 detik

### 3. Data Handling Performance
- **Import 1000 items**: < 30 detik
- **Export 1000 items**: < 10 detik
- **Bulk operations**: < 5 detik untuk 100 items
- **localStorage operations**: < 50ms

## Monitoring Implementation

### 1. Client-Side Performance Monitoring

#### Performance Observer Setup
```javascript
// performance-monitor.js
class PerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.thresholds = {
            loadTime: 3000,
            searchTime: 300,
            saveTime: 1000,
            memoryUsage: 100 * 1024 * 1024 // 100MB
        };
        this.setupObservers();
    }
    
    setupObservers() {
        // Navigation timing
        if ('PerformanceObserver' in window) {
            const navObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordNavigationMetrics(entry);
                }
            });
            navObserver.observe({ entryTypes: ['navigation'] });
            
            // Paint timing
            const paintObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordPaintMetrics(entry);
                }
            });
            paintObserver.observe({ entryTypes: ['paint'] });
            
            // Layout shift
            const clsObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordLayoutShift(entry);
                }
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
        }
    }
    
    recordNavigationMetrics(entry) {
        this.metrics.navigation = {
            loadTime: entry.loadEventEnd - entry.loadEventStart,
            domReady: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            ttfb: entry.responseStart - entry.requestStart,
            timestamp: Date.now()
        };
        
        this.checkThresholds('navigation');
        this.sendMetrics('navigation', this.metrics.navigation);
    }
    
    recordPaintMetrics(entry) {
        this.metrics.paint = this.metrics.paint || {};
        this.metrics.paint[entry.name] = entry.startTime;
        
        if (entry.name === 'first-contentful-paint') {
            this.checkThresholds('fcp', entry.startTime);
        }
    }
    
    recordLayoutShift(entry) {
        if (!entry.hadRecentInput) {
            this.metrics.cls = (this.metrics.cls || 0) + entry.value;
            this.checkThresholds('cls', this.metrics.cls);
        }
    }
    
    // Custom timing for application operations
    startTiming(operation) {
        this.timings = this.timings || {};
        this.timings[operation] = performance.now();
    }
    
    endTiming(operation) {
        if (this.timings && this.timings[operation]) {
            const duration = performance.now() - this.timings[operation];
            this.recordCustomMetric(operation, duration);
            delete this.timings[operation];
            return duration;
        }
    }
    
    recordCustomMetric(operation, duration) {
        this.metrics.custom = this.metrics.custom || {};
        this.metrics.custom[operation] = {
            duration,
            timestamp: Date.now()
        };
        
        this.checkThresholds(operation, duration);
        this.sendMetrics('custom', { operation, duration });
    }
    
    checkThresholds(metric, value) {
        const threshold = this.thresholds[metric];
        if (threshold && value > threshold) {
            this.alertThresholdExceeded(metric, value, threshold);
        }
    }
    
    alertThresholdExceeded(metric, value, threshold) {
        console.warn(`Performance threshold exceeded: ${metric} = ${value}ms (threshold: ${threshold}ms)`);
        
        // Send alert to monitoring service
        this.sendAlert({
            type: 'performance_threshold_exceeded',
            metric,
            value,
            threshold,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });
    }
    
    // Memory monitoring
    monitorMemory() {
        if (performance.memory) {
            const memoryInfo = {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
                timestamp: Date.now()
            };
            
            this.metrics.memory = memoryInfo;
            this.checkThresholds('memoryUsage', memoryInfo.used);
            this.sendMetrics('memory', memoryInfo);
        }
    }
    
    // Send metrics to monitoring service
    sendMetrics(type, data) {
        // Implementation depends on monitoring service
        if (window.gtag) {
            // Google Analytics 4
            gtag('event', 'performance_metric', {
                metric_type: type,
                metric_data: JSON.stringify(data)
            });
        }
        
        // Custom monitoring endpoint
        if (CONFIG.MONITORING_ENDPOINT) {
            fetch(CONFIG.MONITORING_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'performance',
                    subtype: type,
                    data,
                    session: this.getSessionId(),
                    timestamp: Date.now()
                })
            }).catch(console.error);
        }
    }
    
    sendAlert(alertData) {
        // Send to alerting service
        if (CONFIG.ALERT_ENDPOINT) {
            fetch(CONFIG.ALERT_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(alertData)
            }).catch(console.error);
        }
    }
    
    getSessionId() {
        if (!this.sessionId) {
            this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        return this.sessionId;
    }
    
    // Generate performance report
    generateReport() {
        return {
            session: this.getSessionId(),
            timestamp: Date.now(),
            metrics: this.metrics,
            browser: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                cookieEnabled: navigator.cookieEnabled
            },
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            },
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : null
        };
    }
}

// Initialize performance monitoring
const performanceMonitor = new PerformanceMonitor();

// Monitor memory every 30 seconds
setInterval(() => {
    performanceMonitor.monitorMemory();
}, 30000);
```

#### Integration with Master Barang Operations
```javascript
// Integrate with MasterBarangSystem
class MonitoredMasterBarangSystem extends MasterBarangSystem {
    async saveBarang(data) {
        performanceMonitor.startTiming('saveBarang');
        try {
            const result = await super.saveBarang(data);
            return result;
        } finally {
            performanceMonitor.endTiming('saveBarang');
        }
    }
    
    async searchBarang(query, options) {
        performanceMonitor.startTiming('searchBarang');
        try {
            const result = await super.searchBarang(query, options);
            return result;
        } finally {
            performanceMonitor.endTiming('searchBarang');
        }
    }
    
    async getAllBarang(options) {
        performanceMonitor.startTiming('getAllBarang');
        try {
            const result = await super.getAllBarang(options);
            return result;
        } finally {
            performanceMonitor.endTiming('getAllBarang');
        }
    }
}
```

### 2. Error Monitoring

#### Error Tracking Setup
```javascript
// error-monitor.js
class ErrorMonitor {
    constructor() {
        this.setupErrorHandlers();
        this.errorQueue = [];
        this.maxQueueSize = 100;
    }
    
    setupErrorHandlers() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.recordError({
                type: 'javascript_error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack,
                timestamp: Date.now()
            });
        });
        
        // Unhandled promise rejection
        window.addEventListener('unhandledrejection', (event) => {
            this.recordError({
                type: 'unhandled_promise_rejection',
                message: event.reason?.message || 'Unhandled promise rejection',
                stack: event.reason?.stack,
                timestamp: Date.now()
            });
        });
        
        // Custom error handler for Master Barang operations
        this.setupCustomErrorHandling();
    }
    
    setupCustomErrorHandling() {
        // Override console.error to capture application errors
        const originalConsoleError = console.error;
        console.error = (...args) => {
            this.recordError({
                type: 'console_error',
                message: args.join(' '),
                timestamp: Date.now()
            });
            originalConsoleError.apply(console, args);
        };
    }
    
    recordError(errorData) {
        // Add context information
        const enrichedError = {
            ...errorData,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: Date.now(),
            sessionId: performanceMonitor.getSessionId()
        };
        
        // Add to queue
        this.errorQueue.push(enrichedError);
        
        // Limit queue size
        if (this.errorQueue.length > this.maxQueueSize) {
            this.errorQueue.shift();
        }
        
        // Send immediately for critical errors
        if (this.isCriticalError(errorData)) {
            this.sendError(enrichedError);
        }
        
        // Batch send non-critical errors
        this.scheduleBatchSend();
    }
    
    isCriticalError(errorData) {
        const criticalPatterns = [
            /storage.*quota.*exceeded/i,
            /network.*error/i,
            /security.*error/i,
            /permission.*denied/i
        ];
        
        return criticalPatterns.some(pattern => 
            pattern.test(errorData.message)
        );
    }
    
    scheduleBatchSend() {
        if (!this.batchSendTimer) {
            this.batchSendTimer = setTimeout(() => {
                this.sendBatchErrors();
                this.batchSendTimer = null;
            }, 5000); // Send batch every 5 seconds
        }
    }
    
    sendBatchErrors() {
        if (this.errorQueue.length === 0) return;
        
        const errors = [...this.errorQueue];
        this.errorQueue = [];
        
        if (CONFIG.ERROR_ENDPOINT) {
            fetch(CONFIG.ERROR_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'error_batch',
                    errors,
                    timestamp: Date.now()
                })
            }).catch(console.error);
        }
    }
    
    sendError(errorData) {
        if (CONFIG.ERROR_ENDPOINT) {
            fetch(CONFIG.ERROR_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'error_immediate',
                    error: errorData,
                    timestamp: Date.now()
                })
            }).catch(() => {
                // Fallback: store in localStorage for later sending
                try {
                    const storedErrors = JSON.parse(localStorage.getItem('pending_errors') || '[]');
                    storedErrors.push(errorData);
                    localStorage.setItem('pending_errors', JSON.stringify(storedErrors.slice(-50)));
                } catch (e) {
                    // localStorage full or unavailable
                }
            });
        }
    }
}

// Initialize error monitoring
const errorMonitor = new ErrorMonitor();
```

### 3. User Experience Monitoring

#### User Interaction Tracking
```javascript
// ux-monitor.js
class UXMonitor {
    constructor() {
        this.interactions = [];
        this.setupInteractionTracking();
    }
    
    setupInteractionTracking() {
        // Track clicks
        document.addEventListener('click', (event) => {
            this.recordInteraction('click', event.target, event);
        });
        
        // Track form submissions
        document.addEventListener('submit', (event) => {
            this.recordInteraction('form_submit', event.target, event);
        });
        
        // Track input focus/blur for form analytics
        document.addEventListener('focusin', (event) => {
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                this.recordInteraction('input_focus', event.target, event);
            }
        });
        
        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            this.recordInteraction('visibility_change', document, {
                hidden: document.hidden
            });
        });
    }
    
    recordInteraction(type, element, event) {
        const interaction = {
            type,
            timestamp: Date.now(),
            element: {
                tagName: element.tagName,
                id: element.id,
                className: element.className,
                textContent: element.textContent?.substring(0, 100)
            },
            page: window.location.pathname,
            sessionId: performanceMonitor.getSessionId()
        };
        
        // Add specific data based on interaction type
        if (type === 'click') {
            interaction.coordinates = {
                x: event.clientX,
                y: event.clientY
            };
        }
        
        this.interactions.push(interaction);
        
        // Limit array size
        if (this.interactions.length > 1000) {
            this.interactions = this.interactions.slice(-500);
        }
        
        // Send critical interactions immediately
        if (this.isCriticalInteraction(interaction)) {
            this.sendInteraction(interaction);
        }
    }
    
    isCriticalInteraction(interaction) {
        return interaction.type === 'form_submit' || 
               (interaction.type === 'click' && interaction.element.textContent?.includes('Simpan'));
    }
    
    sendInteraction(interaction) {
        if (CONFIG.UX_ENDPOINT) {
            fetch(CONFIG.UX_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'user_interaction',
                    interaction,
                    timestamp: Date.now()
                })
            }).catch(console.error);
        }
    }
    
    // Generate UX report
    generateUXReport() {
        const now = Date.now();
        const last24h = now - (24 * 60 * 60 * 1000);
        
        const recentInteractions = this.interactions.filter(i => i.timestamp > last24h);
        
        return {
            sessionId: performanceMonitor.getSessionId(),
            timestamp: now,
            totalInteractions: recentInteractions.length,
            interactionsByType: this.groupBy(recentInteractions, 'type'),
            mostClickedElements: this.getMostClicked(recentInteractions),
            sessionDuration: this.getSessionDuration(),
            pageViews: this.getPageViews(recentInteractions)
        };
    }
    
    groupBy(array, key) {
        return array.reduce((result, item) => {
            const group = item[key];
            result[group] = (result[group] || 0) + 1;
            return result;
        }, {});
    }
    
    getMostClicked(interactions) {
        const clicks = interactions.filter(i => i.type === 'click');
        const clickCounts = {};
        
        clicks.forEach(click => {
            const key = `${click.element.tagName}#${click.element.id}.${click.element.className}`;
            clickCounts[key] = (clickCounts[key] || 0) + 1;
        });
        
        return Object.entries(clickCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
    }
    
    getSessionDuration() {
        if (this.interactions.length === 0) return 0;
        const first = this.interactions[0].timestamp;
        const last = this.interactions[this.interactions.length - 1].timestamp;
        return last - first;
    }
    
    getPageViews(interactions) {
        const pageViews = {};
        interactions.forEach(interaction => {
            pageViews[interaction.page] = (pageViews[interaction.page] || 0) + 1;
        });
        return pageViews;
    }
}

// Initialize UX monitoring
const uxMonitor = new UXMonitor();
```

## Monitoring Dashboard

### Real-time Metrics Display
```html
<!-- monitoring-dashboard.html -->
<div id="monitoring-dashboard" style="position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.8); color: white; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px; z-index: 9999;">
    <div>Performance Monitor</div>
    <div id="load-time">Load Time: --</div>
    <div id="memory-usage">Memory: --</div>
    <div id="operation-time">Last Op: --</div>
    <div id="error-count">Errors: 0</div>
</div>

<script>
function updateDashboard() {
    const dashboard = document.getElementById('monitoring-dashboard');
    if (!dashboard) return;
    
    // Update load time
    if (performanceMonitor.metrics.navigation) {
        document.getElementById('load-time').textContent = 
            `Load Time: ${performanceMonitor.metrics.navigation.loadTime}ms`;
    }
    
    // Update memory usage
    if (performanceMonitor.metrics.memory) {
        const memoryMB = Math.round(performanceMonitor.metrics.memory.used / 1024 / 1024);
        document.getElementById('memory-usage').textContent = `Memory: ${memoryMB}MB`;
    }
    
    // Update last operation time
    if (performanceMonitor.metrics.custom) {
        const lastOp = Object.entries(performanceMonitor.metrics.custom)
            .sort(([,a], [,b]) => b.timestamp - a.timestamp)[0];
        if (lastOp) {
            document.getElementById('operation-time').textContent = 
                `Last Op: ${lastOp[0]} (${Math.round(lastOp[1].duration)}ms)`;
        }
    }
    
    // Update error count
    document.getElementById('error-count').textContent = 
        `Errors: ${errorMonitor.errorQueue.length}`;
}

// Update dashboard every 2 seconds
setInterval(updateDashboard, 2000);

// Hide dashboard in production
if (CONFIG.ENVIRONMENT === 'production') {
    document.getElementById('monitoring-dashboard').style.display = 'none';
}
</script>
```

## Alerting Configuration

### Alert Rules
```javascript
// alert-rules.js
const ALERT_RULES = {
    performance: {
        page_load_time: {
            threshold: 5000, // 5 seconds
            severity: 'warning',
            message: 'Page load time exceeded 5 seconds'
        },
        memory_usage: {
            threshold: 150 * 1024 * 1024, // 150MB
            severity: 'critical',
            message: 'Memory usage exceeded 150MB'
        },
        search_time: {
            threshold: 1000, // 1 second
            severity: 'warning',
            message: 'Search operation took longer than 1 second'
        }
    },
    errors: {
        error_rate: {
            threshold: 10, // 10 errors per minute
            window: 60000, // 1 minute
            severity: 'critical',
            message: 'High error rate detected'
        },
        storage_quota: {
            pattern: /quota.*exceeded/i,
            severity: 'critical',
            message: 'Storage quota exceeded'
        }
    },
    business: {
        failed_saves: {
            threshold: 5, // 5 failed saves per hour
            window: 3600000, // 1 hour
            severity: 'warning',
            message: 'High number of failed save operations'
        }
    }
};
```

### Notification Channels
```javascript
// notification-channels.js
class NotificationManager {
    constructor() {
        this.channels = {
            email: CONFIG.EMAIL_ALERTS_ENABLED,
            slack: CONFIG.SLACK_WEBHOOK_URL,
            browser: 'Notification' in window
        };
    }
    
    async sendAlert(alert) {
        // Browser notification
        if (this.channels.browser && alert.severity === 'critical') {
            this.sendBrowserNotification(alert);
        }
        
        // Email notification
        if (this.channels.email) {
            await this.sendEmailAlert(alert);
        }
        
        // Slack notification
        if (this.channels.slack) {
            await this.sendSlackAlert(alert);
        }
    }
    
    sendBrowserNotification(alert) {
        if (Notification.permission === 'granted') {
            new Notification('Master Barang Alert', {
                body: alert.message,
                icon: '/favicon.ico',
                tag: alert.type
            });
        }
    }
    
    async sendEmailAlert(alert) {
        // Implementation depends on email service
        return fetch(CONFIG.EMAIL_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: CONFIG.ALERT_EMAIL_RECIPIENTS,
                subject: `Master Barang Alert: ${alert.type}`,
                body: this.formatEmailAlert(alert)
            })
        });
    }
    
    async sendSlackAlert(alert) {
        return fetch(this.channels.slack, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: `🚨 Master Barang Alert`,
                attachments: [{
                    color: alert.severity === 'critical' ? 'danger' : 'warning',
                    fields: [
                        { title: 'Type', value: alert.type, short: true },
                        { title: 'Severity', value: alert.severity, short: true },
                        { title: 'Message', value: alert.message, short: false },
                        { title: 'Timestamp', value: new Date(alert.timestamp).toISOString(), short: true }
                    ]
                }]
            })
        });
    }
    
    formatEmailAlert(alert) {
        return `
            Alert Details:
            - Type: ${alert.type}
            - Severity: ${alert.severity}
            - Message: ${alert.message}
            - Timestamp: ${new Date(alert.timestamp).toISOString()}
            - URL: ${alert.url || 'N/A'}
            - User Agent: ${alert.userAgent || 'N/A'}
            
            Please investigate this issue promptly.
        `;
    }
}

const notificationManager = new NotificationManager();
```

## Reporting

### Daily Performance Report
```javascript
// Generate daily report
function generateDailyReport() {
    const report = {
        date: new Date().toISOString().split('T')[0],
        performance: performanceMonitor.generateReport(),
        ux: uxMonitor.generateUXReport(),
        errors: {
            total: errorMonitor.errorQueue.length,
            byType: errorMonitor.errorQueue.reduce((acc, error) => {
                acc[error.type] = (acc[error.type] || 0) + 1;
                return acc;
            }, {})
        },
        recommendations: generateRecommendations()
    };
    
    // Send report
    if (CONFIG.REPORT_ENDPOINT) {
        fetch(CONFIG.REPORT_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(report)
        });
    }
    
    return report;
}

function generateRecommendations() {
    const recommendations = [];
    
    // Performance recommendations
    if (performanceMonitor.metrics.memory?.used > 100 * 1024 * 1024) {
        recommendations.push({
            type: 'performance',
            priority: 'high',
            message: 'Memory usage is high. Consider implementing data pagination or cleanup.'
        });
    }
    
    // Error recommendations
    if (errorMonitor.errorQueue.length > 10) {
        recommendations.push({
            type: 'reliability',
            priority: 'medium',
            message: 'Multiple errors detected. Review error logs and fix common issues.'
        });
    }
    
    return recommendations;
}

// Schedule daily report
if (CONFIG.ENVIRONMENT === 'production') {
    setInterval(generateDailyReport, 24 * 60 * 60 * 1000); // Daily
}
```

---

*Setup monitoring ini memberikan visibilitas lengkap terhadap performa sistem Master Barang Komprehensif dan memungkinkan deteksi dini masalah performa.*