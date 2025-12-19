/**
 * Error Tracking System for Integrasi Pembayaran Laporan
 * Tracks JavaScript errors, unhandled promises, and application-specific errors
 */

class ErrorTracker {
    constructor() {
        this.errorQueue = [];
        this.maxQueueSize = 100;
        this.flushInterval = 30000; // 30 seconds
        this.setupErrorHandlers();
        this.startPeriodicFlush();
    }
    
    setupErrorHandlers() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.trackError({
                type: 'javascript_error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                userAgent: navigator.userAgent
            });
        });
        
        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.trackError({
                type: 'unhandled_promise_rejection',
                message: event.reason?.message || 'Unhandled Promise Rejection',
                stack: event.reason?.stack,
                timestamp: new Date().toISOString(),
                url: window.location.href
            });
        });
        
        // Console error override for application errors
        const originalConsoleError = console.error;
        console.error = (...args) => {
            this.trackError({
                type: 'console_error',
                message: args.join(' '),
                timestamp: new Date().toISOString(),
                url: window.location.href
            });
            originalConsoleError.apply(console, args);
        };
    }
    
    trackError(errorData) {
        // Add context information
        const enrichedError = {
            ...errorData,
            sessionId: this.getSessionId(),
            userId: this.getCurrentUserId(),
            feature: 'integrasi-pembayaran-laporan',
            activeTab: this.getActiveTab(),
            browserInfo: this.getBrowserInfo(),
            memoryUsage: this.getMemoryUsage(),
            connectionType: this.getConnectionType()
        };
        
        this.errorQueue.push(enrichedError);
        
        // Immediate flush for critical errors
        if (this.isCriticalError(errorData)) {
            this.flushErrors();
        }
        
        // Manage queue size
        if (this.errorQueue.length > this.maxQueueSize) {
            this.errorQueue.shift();
        }
        
        // Store in localStorage as backup
        this.storeErrorLocally(enrichedError);
    }
    
    isCriticalError(error) {
        const criticalPatterns = [
            /payment.*failed/i,
            /transaction.*error/i,
            /saldo.*inconsistent/i,
            /journal.*error/i,
            /authentication.*failed/i,
            /data.*corruption/i,
            /security.*violation/i
        ];
        
        return criticalPatterns.some(pattern => 
            pattern.test(error.message) || pattern.test(error.stack)
        );
    }
    
    startPeriodicFlush() {
        setInterval(() => {
            this.flushErrors();
        }, this.flushInterval);
    }
    
    flushErrors() {
        if (this.errorQueue.length === 0) return;
        
        const errors = [...this.errorQueue];
        this.errorQueue = [];
        
        // Send to monitoring service
        this.sendToMonitoringService(errors);
        
        // Update error statistics
        this.updateErrorStatistics(errors);
    }
    
    sendToMonitoringService(errors) {
        // Implementation depends on monitoring service used
        // Example for custom endpoint:
        fetch('/api/monitoring/errors', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                errors: errors,
                timestamp: new Date().toISOString(),
                source: 'integrasi-pembayaran-laporan'
            })
        }).catch(err => {
            console.warn('Failed to send errors to monitoring service:', err);
            // Store failed errors for retry
            this.storeFailedErrors(errors);
        });
    }
    
    storeErrorLocally(error) {
        try {
            const localErrors = JSON.parse(localStorage.getItem('errorTracker_errors') || '[]');
            localErrors.push(error);
            
            // Keep only last 50 errors locally
            if (localErrors.length > 50) {
                localErrors.splice(0, localErrors.length - 50);
            }
            
            localStorage.setItem('errorTracker_errors', JSON.stringify(localErrors));
        } catch (e) {
            console.warn('Failed to store error locally:', e);
        }
    }
    
    storeFailedErrors(errors) {
        try {
            const failedErrors = JSON.parse(localStorage.getItem('errorTracker_failed') || '[]');
            failedErrors.push(...errors);
            
            // Keep only last 100 failed errors
            if (failedErrors.length > 100) {
                failedErrors.splice(0, failedErrors.length - 100);
            }
            
            localStorage.setItem('errorTracker_failed', JSON.stringify(failedErrors));
        } catch (e) {
            console.warn('Failed to store failed errors:', e);
        }
    }
    
    updateErrorStatistics(errors) {
        try {
            const stats = JSON.parse(localStorage.getItem('errorTracker_stats') || '{}');
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            
            if (!stats[today]) {
                stats[today] = {
                    total: 0,
                    critical: 0,
                    byType: {}
                };
            }
            
            errors.forEach(error => {
                stats[today].total++;
                
                if (this.isCriticalError(error)) {
                    stats[today].critical++;
                }
                
                const type = error.type || 'unknown';
                stats[today].byType[type] = (stats[today].byType[type] || 0) + 1;
            });
            
            // Keep only last 30 days of stats
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            Object.keys(stats).forEach(date => {
                if (new Date(date) < thirtyDaysAgo) {
                    delete stats[date];
                }
            });
            
            localStorage.setItem('errorTracker_stats', JSON.stringify(stats));
        } catch (e) {
            console.warn('Failed to update error statistics:', e);
        }
    }
    
    getActiveTab() {
        const activeTab = document.querySelector('.tab-btn.active');
        return activeTab ? activeTab.dataset.tab : 'unknown';
    }
    
    getSessionId() {
        let sessionId = sessionStorage.getItem('sessionId');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('sessionId', sessionId);
        }
        return sessionId;
    }
    
    getCurrentUserId() {
        return localStorage.getItem('currentUser') || 'anonymous';
    }
    
    getBrowserInfo() {
        return {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
    }
    
    getMemoryUsage() {
        if ('memory' in performance) {
            return {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
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
    
    // Public methods for manual error tracking
    trackCustomError(message, context = {}) {
        this.trackError({
            type: 'custom_error',
            message: message,
            context: context,
            timestamp: new Date().toISOString(),
            url: window.location.href
        });
    }
    
    trackPaymentError(paymentData, error) {
        this.trackError({
            type: 'payment_error',
            message: error.message || 'Payment processing failed',
            paymentData: {
                mode: paymentData.mode,
                amount: paymentData.jumlah,
                type: paymentData.jenisPembayaran,
                anggotaId: paymentData.anggotaId
            },
            error: error,
            timestamp: new Date().toISOString(),
            url: window.location.href
        });
    }
    
    trackImportError(importData, error) {
        this.trackError({
            type: 'import_error',
            message: error.message || 'Import processing failed',
            importData: {
                fileName: importData.fileName,
                fileSize: importData.fileSize,
                rowCount: importData.rowCount
            },
            error: error,
            timestamp: new Date().toISOString(),
            url: window.location.href
        });
    }
    
    // Get error statistics
    getErrorStatistics() {
        try {
            return JSON.parse(localStorage.getItem('errorTracker_stats') || '{}');
        } catch (e) {
            return {};
        }
    }
    
    // Get recent errors
    getRecentErrors(limit = 10) {
        try {
            const errors = JSON.parse(localStorage.getItem('errorTracker_errors') || '[]');
            return errors.slice(-limit);
        } catch (e) {
            return [];
        }
    }
    
    // Clear error data (for testing/debugging)
    clearErrorData() {
        localStorage.removeItem('errorTracker_errors');
        localStorage.removeItem('errorTracker_stats');
        localStorage.removeItem('errorTracker_failed');
        this.errorQueue = [];
    }
}

// Initialize error tracking
if (typeof window !== 'undefined') {
    window.errorTracker = new ErrorTracker();
    
    // Expose for debugging in development
    if (window.location.hostname === 'localhost') {
        window.ErrorTracker = ErrorTracker;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorTracker;
}