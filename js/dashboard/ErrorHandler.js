/**
 * Comprehensive Error Handler for Dashboard Analytics & KPI
 * Handles errors, logging, user feedback, and recovery mechanisms
 */

class DashboardErrorHandler {
    constructor(config = {}) {
        this.config = {
            logLevel: config.logLevel || 'info',
            enableConsoleLogging: config.enableConsoleLogging !== false,
            enableRemoteLogging: config.enableRemoteLogging || false,
            maxLogEntries: config.maxLogEntries || 1000,
            retryAttempts: config.retryAttempts || 3,
            retryDelay: config.retryDelay || 1000,
            enableUserNotifications: config.enableUserNotifications !== false,
            ...config
        };
        
        this.logs = [];
        this.errorCounts = new Map();
        this.performanceMetrics = new Map();
        this.retryQueue = new Map();
        
        this.initializeErrorHandling();
    }

    // Initialize global error handling
    initializeErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'javascript',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                severity: 'error'
            });
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'promise',
                message: event.reason?.message || 'Unhandled promise rejection',
                error: event.reason,
                severity: 'error'
            });
        });

        // Performance monitoring
        if (typeof PerformanceObserver !== 'undefined') {
            this.initializePerformanceMonitoring();
        }
    }

    // Initialize performance monitoring
    initializePerformanceMonitoring() {
        try {
            // Monitor long tasks
            const longTaskObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 50) { // Tasks longer than 50ms
                        this.logPerformanceIssue({
                            type: 'long_task',
                            duration: entry.duration,
                            startTime: entry.startTime,
                            severity: entry.duration > 100 ? 'warning' : 'info'
                        });
                    }
                }
            });
            longTaskObserver.observe({ entryTypes: ['longtask'] });

            // Monitor navigation timing
            const navigationObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.logPerformanceMetric({
                        type: 'navigation',
                        loadTime: entry.loadEventEnd - entry.navigationStart,
                        domContentLoaded: entry.domContentLoadedEventEnd - entry.navigationStart,
                        firstPaint: entry.responseEnd - entry.requestStart
                    });
                }
            });
            navigationObserver.observe({ entryTypes: ['navigation'] });

        } catch (error) {
            this.log('Failed to initialize performance monitoring', 'warning', { error });
        }
    }

    // Main error handling method
    handleError(errorInfo) {
        try {
            // Normalize error information
            const normalizedError = this.normalizeError(errorInfo);
            
            // Log the error
            this.log(normalizedError.message, normalizedError.severity, normalizedError);
            
            // Track error frequency
            this.trackErrorFrequency(normalizedError);
            
            // Attempt recovery if possible
            this.attemptRecovery(normalizedError);
            
            // Show user notification if appropriate
            if (this.shouldNotifyUser(normalizedError)) {
                this.showUserNotification(normalizedError);
            }
            
            // Report to remote logging service if enabled
            if (this.config.enableRemoteLogging) {
                this.reportToRemoteService(normalizedError);
            }
            
        } catch (handlingError) {
            // Fallback error handling
            console.error('Error in error handler:', handlingError);
            console.error('Original error:', errorInfo);
        }
    }

    // Normalize error information
    normalizeError(errorInfo) {
        const timestamp = new Date().toISOString();
        const userAgent = navigator.userAgent;
        const url = window.location.href;
        
        let normalized = {
            id: this.generateErrorId(),
            timestamp,
            userAgent,
            url,
            type: errorInfo.type || 'unknown',
            severity: errorInfo.severity || 'error',
            message: errorInfo.message || 'Unknown error',
            stack: null,
            context: errorInfo.context || {},
            recoverable: errorInfo.recoverable !== false
        };

        // Extract stack trace if available
        if (errorInfo.error && errorInfo.error.stack) {
            normalized.stack = errorInfo.error.stack;
        }

        // Add specific error type information
        switch (errorInfo.type) {
            case 'dashboard_load':
                normalized.category = 'dashboard';
                normalized.operation = 'load';
                break;
            case 'widget_render':
                normalized.category = 'widget';
                normalized.operation = 'render';
                break;
            case 'data_fetch':
                normalized.category = 'data';
                normalized.operation = 'fetch';
                break;
            case 'export':
                normalized.category = 'export';
                normalized.operation = 'generate';
                break;
            case 'performance':
                normalized.category = 'performance';
                normalized.operation = 'monitor';
                break;
            default:
                normalized.category = 'general';
                normalized.operation = 'unknown';
        }

        return normalized;
    }

    // Generate unique error ID
    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Track error frequency for pattern detection
    trackErrorFrequency(error) {
        const key = `${error.type}_${error.message}`;
        const count = this.errorCounts.get(key) || 0;
        this.errorCounts.set(key, count + 1);

        // Alert if error frequency is high
        if (count + 1 >= 5) {
            this.handleHighFrequencyError(error, count + 1);
        }
    }

    // Handle high frequency errors
    handleHighFrequencyError(error, count) {
        this.log(`High frequency error detected: ${error.message} (${count} occurrences)`, 'critical', {
            errorType: error.type,
            frequency: count,
            timeWindow: '5 minutes'
        });

        // Disable problematic features if necessary
        if (error.category === 'widget' && count >= 10) {
            this.disableProblematicWidget(error.context.widgetId);
        }
    }

    // Attempt automatic error recovery
    async attemptRecovery(error) {
        if (!error.recoverable) return false;

        const recoveryKey = `${error.type}_${error.context.operation || 'default'}`;
        
        try {
            switch (error.type) {
                case 'dashboard_load':
                    return await this.recoverDashboardLoad(error);
                
                case 'widget_render':
                    return await this.recoverWidgetRender(error);
                
                case 'data_fetch':
                    return await this.recoverDataFetch(error);
                
                case 'export':
                    return await this.recoverExport(error);
                
                default:
                    return await this.genericRecovery(error);
            }
        } catch (recoveryError) {
            this.log(`Recovery failed for ${error.type}`, 'error', { 
                originalError: error,
                recoveryError: recoveryError.message 
            });
            return false;
        }
    }

    // Recover dashboard loading errors
    async recoverDashboardLoad(error) {
        this.log('Attempting dashboard load recovery', 'info');
        
        try {
            // Clear cache and retry
            if (typeof caches !== 'undefined') {
                await caches.delete('dashboard-cache');
            }
            
            // Reload with minimal configuration
            const minimalConfig = {
                widgets: ['financial-health', 'member-count'],
                theme: 'default',
                refreshInterval: 300000
            };
            
            // Trigger dashboard reload with minimal config
            if (window.dashboardController) {
                await window.dashboardController.loadDashboard('recovery', 'basic', minimalConfig);
                this.log('Dashboard recovery successful', 'info');
                return true;
            }
            
        } catch (recoveryError) {
            this.log('Dashboard recovery failed', 'error', { error: recoveryError.message });
        }
        
        return false;
    }

    // Recover widget rendering errors
    async recoverWidgetRender(error) {
        const widgetId = error.context.widgetId;
        if (!widgetId) return false;
        
        this.log(`Attempting widget recovery for ${widgetId}`, 'info');
        
        try {
            // Remove problematic widget
            const widgetElement = document.getElementById(widgetId);
            if (widgetElement) {
                widgetElement.innerHTML = this.createErrorWidget(error);
            }
            
            // Try to reload widget with default configuration
            if (window.widgetManager) {
                await window.widgetManager.reloadWidget(widgetId, { 
                    fallbackMode: true,
                    reducedFeatures: true 
                });
                this.log(`Widget ${widgetId} recovery successful`, 'info');
                return true;
            }
            
        } catch (recoveryError) {
            this.log(`Widget ${widgetId} recovery failed`, 'error', { error: recoveryError.message });
        }
        
        return false;
    }

    // Recover data fetching errors
    async recoverDataFetch(error) {
        const endpoint = error.context.endpoint;
        const retryKey = `data_fetch_${endpoint}`;
        
        // Check retry count
        const retryCount = this.retryQueue.get(retryKey) || 0;
        if (retryCount >= this.config.retryAttempts) {
            this.log(`Max retry attempts reached for ${endpoint}`, 'warning');
            return false;
        }
        
        this.log(`Attempting data fetch recovery for ${endpoint} (attempt ${retryCount + 1})`, 'info');
        
        try {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (retryCount + 1)));
            
            // Update retry count
            this.retryQueue.set(retryKey, retryCount + 1);
            
            // Attempt to refetch data
            if (window.dataManager) {
                const data = await window.dataManager.fetchData(endpoint, { 
                    timeout: 10000,
                    fallbackToCache: true 
                });
                
                // Clear retry count on success
                this.retryQueue.delete(retryKey);
                this.log(`Data fetch recovery successful for ${endpoint}`, 'info');
                return true;
            }
            
        } catch (recoveryError) {
            this.log(`Data fetch recovery failed for ${endpoint}`, 'error', { 
                error: recoveryError.message,
                attempt: retryCount + 1 
            });
        }
        
        return false;
    }

    // Recover export errors
    async recoverExport(error) {
        const exportType = error.context.exportType;
        
        this.log(`Attempting export recovery for ${exportType}`, 'info');
        
        try {
            // Try with reduced dataset
            if (window.exportManager) {
                const reducedOptions = {
                    ...error.context.options,
                    maxRecords: 1000,
                    includeCharts: false,
                    compression: true
                };
                
                await window.exportManager.export(exportType, reducedOptions);
                this.log(`Export recovery successful for ${exportType}`, 'info');
                return true;
            }
            
        } catch (recoveryError) {
            this.log(`Export recovery failed for ${exportType}`, 'error', { error: recoveryError.message });
        }
        
        return false;
    }

    // Generic recovery mechanism
    async genericRecovery(error) {
        this.log('Attempting generic recovery', 'info');
        
        try {
            // Clear any problematic state
            if (error.context.clearState) {
                localStorage.removeItem('dashboard-state');
                sessionStorage.clear();
            }
            
            // Refresh page as last resort
            if (error.severity === 'critical') {
                this.log('Critical error - initiating page refresh', 'warning');
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
                return true;
            }
            
        } catch (recoveryError) {
            this.log('Generic recovery failed', 'error', { error: recoveryError.message });
        }
        
        return false;
    }

    // Create error widget placeholder
    createErrorWidget(error) {
        return `
            <div class="error-widget" style="
                padding: 20px;
                border: 1px solid #dc3545;
                border-radius: 4px;
                background-color: #f8d7da;
                color: #721c24;
                text-align: center;
            ">
                <h4>Widget Error</h4>
                <p>This widget encountered an error and couldn't load properly.</p>
                <small>Error ID: ${error.id}</small>
                <br>
                <button onclick="window.errorHandler.retryWidget('${error.context.widgetId}')" 
                        style="margin-top: 10px; padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 3px;">
                    Retry
                </button>
            </div>
        `;
    }

    // Retry widget loading
    async retryWidget(widgetId) {
        try {
            if (window.widgetManager) {
                await window.widgetManager.reloadWidget(widgetId);
                this.log(`Widget ${widgetId} retry successful`, 'info');
            }
        } catch (error) {
            this.handleError({
                type: 'widget_retry',
                message: `Failed to retry widget ${widgetId}`,
                context: { widgetId },
                error
            });
        }
    }

    // Determine if user should be notified
    shouldNotifyUser(error) {
        if (!this.config.enableUserNotifications) return false;
        
        // Don't notify for low-severity errors
        if (error.severity === 'info' || error.severity === 'debug') return false;
        
        // Don't spam user with repeated errors
        const recentErrors = this.logs.filter(log => 
            log.timestamp > Date.now() - 60000 && // Last minute
            log.level === error.severity &&
            log.message === error.message
        );
        
        return recentErrors.length <= 1;
    }

    // Show user notification
    showUserNotification(error) {
        const notification = this.createNotificationElement(error);
        document.body.appendChild(notification);
        
        // Auto-remove after delay
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, error.severity === 'critical' ? 10000 : 5000);
    }

    // Create notification element
    createNotificationElement(error) {
        const notification = document.createElement('div');
        notification.className = `error-notification error-${error.severity}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            max-width: 400px;
            padding: 15px;
            border-radius: 4px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.4;
        `;
        
        // Set colors based on severity
        const colors = {
            error: { bg: '#f8d7da', border: '#dc3545', text: '#721c24' },
            warning: { bg: '#fff3cd', border: '#ffc107', text: '#856404' },
            critical: { bg: '#d1ecf1', border: '#17a2b8', text: '#0c5460' }
        };
        
        const color = colors[error.severity] || colors.error;
        notification.style.backgroundColor = color.bg;
        notification.style.borderLeft = `4px solid ${color.border}`;
        notification.style.color = color.text;
        
        notification.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="flex: 1;">
                    <strong>${this.getErrorTitle(error.severity)}</strong>
                    <div style="margin-top: 5px;">${this.getUserFriendlyMessage(error)}</div>
                    ${error.severity === 'critical' ? '<div style="margin-top: 5px; font-size: 12px;">The page will refresh automatically to resolve this issue.</div>' : ''}
                </div>
                <button onclick="this.parentNode.parentNode.remove()" 
                        style="background: none; border: none; font-size: 18px; cursor: pointer; color: ${color.text}; margin-left: 10px;">
                    ×
                </button>
            </div>
        `;
        
        return notification;
    }

    // Get error title based on severity
    getErrorTitle(severity) {
        const titles = {
            error: 'Error',
            warning: 'Warning',
            critical: 'Critical Error'
        };
        return titles[severity] || 'Notice';
    }

    // Convert technical error to user-friendly message
    getUserFriendlyMessage(error) {
        const friendlyMessages = {
            'dashboard_load': 'Unable to load dashboard. Please refresh the page.',
            'widget_render': 'A dashboard widget failed to load. Some information may be missing.',
            'data_fetch': 'Unable to retrieve the latest data. Showing cached information.',
            'export': 'Export failed. Please try again or contact support.',
            'network': 'Network connection issue. Please check your internet connection.',
            'performance': 'The application is running slowly. Consider closing other browser tabs.'
        };
        
        return friendlyMessages[error.type] || 
               friendlyMessages[error.category] || 
               'An unexpected error occurred. Please try refreshing the page.';
    }

    // Disable problematic widget
    disableProblematicWidget(widgetId) {
        this.log(`Disabling problematic widget: ${widgetId}`, 'warning');
        
        const widgetElement = document.getElementById(widgetId);
        if (widgetElement) {
            widgetElement.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #6c757d;">
                    <p>This widget has been temporarily disabled due to repeated errors.</p>
                    <button onclick="window.errorHandler.enableWidget('${widgetId}')" 
                            style="padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 3px;">
                        Re-enable
                    </button>
                </div>
            `;
        }
    }

    // Re-enable widget
    async enableWidget(widgetId) {
        try {
            // Clear error count for this widget
            const errorKeys = Array.from(this.errorCounts.keys()).filter(key => 
                key.includes('widget_render') && key.includes(widgetId)
            );
            errorKeys.forEach(key => this.errorCounts.delete(key));
            
            // Reload widget
            if (window.widgetManager) {
                await window.widgetManager.reloadWidget(widgetId);
                this.log(`Widget ${widgetId} re-enabled successfully`, 'info');
            }
        } catch (error) {
            this.handleError({
                type: 'widget_enable',
                message: `Failed to re-enable widget ${widgetId}`,
                context: { widgetId },
                error
            });
        }
    }

    // Log performance issue
    logPerformanceIssue(issue) {
        this.log(`Performance issue detected: ${issue.type}`, issue.severity, issue);
        
        // Store performance metrics
        const key = `${issue.type}_${new Date().toISOString().split('T')[0]}`;
        const existing = this.performanceMetrics.get(key) || [];
        existing.push(issue);
        this.performanceMetrics.set(key, existing);
        
        // Alert if performance is consistently poor
        if (existing.length >= 10) {
            this.handlePerformanceDegradation(issue.type, existing);
        }
    }

    // Handle performance degradation
    handlePerformanceDegradation(type, issues) {
        const avgDuration = issues.reduce((sum, issue) => sum + issue.duration, 0) / issues.length;
        
        this.log(`Performance degradation detected: ${type}`, 'warning', {
            averageDuration: avgDuration,
            issueCount: issues.length,
            timeframe: '24 hours'
        });
        
        // Suggest optimizations
        if (type === 'long_task' && avgDuration > 100) {
            this.suggestOptimization('Consider enabling performance mode to reduce resource usage.');
        }
    }

    // Suggest optimization to user
    suggestOptimization(message) {
        if (this.config.enableUserNotifications) {
            this.showUserNotification({
                severity: 'info',
                type: 'optimization',
                message: message
            });
        }
    }

    // Log performance metric
    logPerformanceMetric(metric) {
        this.log(`Performance metric: ${metric.type}`, 'debug', metric);
        
        // Check against thresholds
        if (metric.type === 'navigation' && metric.loadTime > 5000) {
            this.logPerformanceIssue({
                type: 'slow_navigation',
                duration: metric.loadTime,
                severity: 'warning'
            });
        }
    }

    // Report to remote logging service
    async reportToRemoteService(error) {
        try {
            const payload = {
                ...error,
                userAgent: navigator.userAgent,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                performance: this.getPerformanceSnapshot()
            };
            
            // Send to logging endpoint (implement based on your logging service)
            await fetch('/api/logs/error', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
        } catch (reportingError) {
            this.log('Failed to report error to remote service', 'warning', { 
                error: reportingError.message 
            });
        }
    }

    // Get performance snapshot
    getPerformanceSnapshot() {
        const snapshot = {
            timestamp: Date.now(),
            memory: null,
            timing: null
        };
        
        // Memory information
        if (performance.memory) {
            snapshot.memory = {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            };
        }
        
        // Timing information
        if (performance.timing) {
            const timing = performance.timing;
            snapshot.timing = {
                navigationStart: timing.navigationStart,
                loadEventEnd: timing.loadEventEnd,
                domContentLoadedEventEnd: timing.domContentLoadedEventEnd
            };
        }
        
        return snapshot;
    }

    // Main logging method
    log(message, level = 'info', data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data,
            id: this.generateLogId()
        };
        
        // Add to logs array
        this.logs.push(logEntry);
        
        // Maintain log size limit
        if (this.logs.length > this.config.maxLogEntries) {
            this.logs.shift();
        }
        
        // Console logging
        if (this.config.enableConsoleLogging && this.shouldLogToConsole(level)) {
            const consoleMethod = this.getConsoleMethod(level);
            consoleMethod(`[${level.toUpperCase()}] ${message}`, data);
        }
    }

    // Generate unique log ID
    generateLogId() {
        return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Determine if should log to console based on level
    shouldLogToConsole(level) {
        const levels = ['debug', 'info', 'warning', 'error', 'critical'];
        const configLevel = levels.indexOf(this.config.logLevel);
        const messageLevel = levels.indexOf(level);
        
        return messageLevel >= configLevel;
    }

    // Get appropriate console method
    getConsoleMethod(level) {
        switch (level) {
            case 'debug': return console.debug;
            case 'info': return console.info;
            case 'warning': return console.warn;
            case 'error':
            case 'critical': return console.error;
            default: return console.log;
        }
    }

    // Get error statistics
    getErrorStatistics() {
        const now = Date.now();
        const last24Hours = now - (24 * 60 * 60 * 1000);
        const lastHour = now - (60 * 60 * 1000);
        
        const recentLogs = this.logs.filter(log => 
            new Date(log.timestamp).getTime() > last24Hours
        );
        
        const hourlyLogs = this.logs.filter(log => 
            new Date(log.timestamp).getTime() > lastHour
        );
        
        const errorsByLevel = {};
        recentLogs.forEach(log => {
            errorsByLevel[log.level] = (errorsByLevel[log.level] || 0) + 1;
        });
        
        return {
            totalLogs: this.logs.length,
            last24Hours: recentLogs.length,
            lastHour: hourlyLogs.length,
            errorsByLevel,
            topErrors: this.getTopErrors(),
            performanceIssues: this.performanceMetrics.size
        };
    }

    // Get top errors by frequency
    getTopErrors() {
        return Array.from(this.errorCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([error, count]) => ({ error, count }));
    }

    // Export logs for analysis
    exportLogs(format = 'json') {
        const data = {
            exportTime: new Date().toISOString(),
            statistics: this.getErrorStatistics(),
            logs: this.logs,
            errorCounts: Object.fromEntries(this.errorCounts),
            performanceMetrics: Object.fromEntries(this.performanceMetrics)
        };
        
        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        } else if (format === 'csv') {
            return this.convertLogsToCSV(this.logs);
        }
        
        return data;
    }

    // Convert logs to CSV format
    convertLogsToCSV(logs) {
        const headers = ['Timestamp', 'Level', 'Message', 'Type', 'Category'];
        const rows = logs.map(log => [
            log.timestamp,
            log.level,
            log.message.replace(/"/g, '""'),
            log.data.type || '',
            log.data.category || ''
        ]);
        
        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }

    // Clear logs
    clearLogs() {
        this.logs = [];
        this.errorCounts.clear();
        this.performanceMetrics.clear();
        this.retryQueue.clear();
        
        this.log('Logs cleared', 'info');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardErrorHandler;
}

// Global instance
window.DashboardErrorHandler = DashboardErrorHandler;