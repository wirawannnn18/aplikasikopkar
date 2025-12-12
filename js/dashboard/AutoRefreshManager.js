/**
 * Dashboard Analytics & KPI - Auto Refresh Manager
 * 
 * Advanced auto-refresh system that handles configurable refresh intervals,
 * real-time data change detection, and efficient partial updates.
 */

class AutoRefreshManager {
    /**
     * Initialize Auto Refresh Manager
     * @param {DashboardController} dashboardController - Dashboard controller instance
     */
    constructor(dashboardController) {
        this.dashboardController = dashboardController;
        this.refreshTimers = new Map(); // Per-widget refresh timers
        this.globalRefreshTimer = null;
        this.isActive = false;
        this.lastUpdateTimestamps = new Map(); // Track last update time per widget
        this.changeDetectionEnabled = true;
        
        // Configuration
        this.config = {
            defaultRefreshInterval: 300000, // 5 minutes
            minRefreshInterval: 30000, // 30 seconds minimum
            maxRefreshInterval: 3600000, // 1 hour maximum
            changeDetectionInterval: 60000, // 1 minute for change detection
            retryAttempts: 3,
            retryDelay: 5000 // 5 seconds
        };
        
        // Bind methods
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.handleOnline = this.handleOnline.bind(this);
        this.handleOffline = this.handleOffline.bind(this);
    }

    /**
     * Initialize the auto-refresh system
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            console.log('Initializing Auto Refresh Manager...');
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize change detection
            if (this.changeDetectionEnabled) {
                this.startChangeDetection();
            }
            
            console.log('Auto Refresh Manager initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Auto Refresh Manager:', error);
            throw error;
        }
    }

    /**
     * Start auto-refresh for all widgets
     * @param {Map} widgets - Map of widget instances
     */
    startAutoRefresh(widgets) {
        if (this.isActive) {
            console.warn('Auto-refresh already active');
            return;
        }

        console.log('Starting auto-refresh for dashboard widgets...');
        this.isActive = true;

        // Start individual widget refresh timers
        widgets.forEach((widget, widgetId) => {
            this.startWidgetRefresh(widget);
        });

        // Start global refresh timer for synchronized updates
        this.startGlobalRefresh();
        
        console.log(`Auto-refresh started for ${widgets.size} widgets`);
    }

    /**
     * Stop auto-refresh for all widgets
     */
    stopAutoRefresh() {
        if (!this.isActive) {
            return;
        }

        console.log('Stopping auto-refresh...');
        this.isActive = false;

        // Clear all widget timers
        this.refreshTimers.forEach((timer, widgetId) => {
            clearInterval(timer);
        });
        this.refreshTimers.clear();

        // Clear global timer
        if (this.globalRefreshTimer) {
            clearInterval(this.globalRefreshTimer);
            this.globalRefreshTimer = null;
        }

        console.log('Auto-refresh stopped');
    }

    /**
     * Start refresh timer for a specific widget
     * @param {Object} widget - Widget instance
     * @private
     */
    startWidgetRefresh(widget) {
        if (!widget || !widget.config) {
            return;
        }

        const widgetId = widget.config.id;
        const refreshInterval = this.getWidgetRefreshInterval(widget);

        // Clear existing timer if any
        if (this.refreshTimers.has(widgetId)) {
            clearInterval(this.refreshTimers.get(widgetId));
        }

        // Create new timer
        const timer = setInterval(async () => {
            if (this.shouldRefreshWidget(widget)) {
                await this.refreshWidget(widget);
            }
        }, refreshInterval);

        this.refreshTimers.set(widgetId, timer);
        
        console.log(`Started refresh timer for widget ${widgetId} (interval: ${refreshInterval}ms)`);
    }

    /**
     * Start global refresh timer for synchronized updates
     * @private
     */
    startGlobalRefresh() {
        if (this.globalRefreshTimer) {
            clearInterval(this.globalRefreshTimer);
        }

        this.globalRefreshTimer = setInterval(async () => {
            if (this.shouldPerformGlobalRefresh()) {
                await this.performGlobalRefresh();
            }
        }, this.config.defaultRefreshInterval);
    }

    /**
     * Get refresh interval for a specific widget
     * @param {Object} widget - Widget instance
     * @returns {number} Refresh interval in milliseconds
     * @private
     */
    getWidgetRefreshInterval(widget) {
        const configInterval = widget.config.refreshInterval || this.config.defaultRefreshInterval;
        
        // Ensure interval is within acceptable bounds
        return Math.max(
            this.config.minRefreshInterval,
            Math.min(this.config.maxRefreshInterval, configInterval)
        );
    }

    /**
     * Check if widget should be refreshed
     * @param {Object} widget - Widget instance
     * @returns {boolean} True if widget should be refreshed
     * @private
     */
    shouldRefreshWidget(widget) {
        // Don't refresh if page is not visible
        if (document.visibilityState !== 'visible') {
            return false;
        }

        // Don't refresh if offline
        if (!navigator.onLine) {
            return false;
        }

        // Don't refresh if widget is not visible in viewport
        if (!this.isWidgetVisible(widget)) {
            return false;
        }

        return true;
    }

    /**
     * Check if global refresh should be performed
     * @returns {boolean} True if global refresh should be performed
     * @private
     */
    shouldPerformGlobalRefresh() {
        return document.visibilityState === 'visible' && navigator.onLine;
    }

    /**
     * Check if widget is visible in viewport
     * @param {Object} widget - Widget instance
     * @returns {boolean} True if widget is visible
     * @private
     */
    isWidgetVisible(widget) {
        if (!widget.element) {
            return false;
        }

        const rect = widget.element.getBoundingClientRect();
        const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
        const viewWidth = Math.max(document.documentElement.clientWidth, window.innerWidth);

        return (
            rect.bottom >= 0 &&
            rect.right >= 0 &&
            rect.top <= viewHeight &&
            rect.left <= viewWidth
        );
    }

    /**
     * Refresh a specific widget with retry logic
     * @param {Object} widget - Widget instance
     * @returns {Promise<void>}
     * @private
     */
    async refreshWidget(widget) {
        const widgetId = widget.config.id;
        let attempts = 0;

        while (attempts < this.config.retryAttempts) {
            try {
                console.log(`Refreshing widget ${widgetId} (attempt ${attempts + 1})`);
                
                const startTime = performance.now();
                
                // Check for data changes before refreshing
                const hasChanges = await this.detectDataChanges(widget);
                
                if (hasChanges || attempts === 0) {
                    // Perform partial update if possible
                    if (widget.supportsPartialUpdate && hasChanges) {
                        await widget.partialUpdate(hasChanges);
                    } else {
                        await widget.refresh();
                    }
                    
                    // Update timestamp
                    this.lastUpdateTimestamps.set(widgetId, new Date());
                    
                    const refreshTime = performance.now() - startTime;
                    console.log(`Widget ${widgetId} refreshed successfully in ${refreshTime.toFixed(2)}ms`);
                    
                    // Emit refresh event
                    this.emitRefreshEvent(widgetId, {
                        success: true,
                        refreshTime,
                        hasChanges,
                        timestamp: new Date()
                    });
                }
                
                return; // Success, exit retry loop
                
            } catch (error) {
                attempts++;
                console.error(`Failed to refresh widget ${widgetId} (attempt ${attempts}):`, error);
                
                if (attempts < this.config.retryAttempts) {
                    // Wait before retry
                    await this.delay(this.config.retryDelay * attempts);
                } else {
                    // All attempts failed
                    console.error(`Widget ${widgetId} refresh failed after ${attempts} attempts`);
                    
                    // Emit error event
                    this.emitRefreshEvent(widgetId, {
                        success: false,
                        error: error.message,
                        attempts,
                        timestamp: new Date()
                    });
                }
            }
        }
    }

    /**
     * Perform global refresh for synchronized updates
     * @returns {Promise<void>}
     * @private
     */
    async performGlobalRefresh() {
        try {
            console.log('Performing global dashboard refresh...');
            
            const startTime = performance.now();
            
            // Refresh dashboard controller data
            await this.dashboardController.refreshData();
            
            const refreshTime = performance.now() - startTime;
            console.log(`Global refresh completed in ${refreshTime.toFixed(2)}ms`);
            
            // Emit global refresh event
            this.emitRefreshEvent('global', {
                success: true,
                refreshTime,
                timestamp: new Date()
            });
            
        } catch (error) {
            console.error('Global refresh failed:', error);
            
            this.emitRefreshEvent('global', {
                success: false,
                error: error.message,
                timestamp: new Date()
            });
        }
    }

    /**
     * Detect data changes for a widget
     * @param {Object} widget - Widget instance
     * @returns {Promise<Object|null>} Changed data or null if no changes
     * @private
     */
    async detectDataChanges(widget) {
        try {
            if (!widget.getDataChecksum) {
                return null; // Widget doesn't support change detection
            }

            const currentChecksum = await widget.getDataChecksum();
            const lastChecksum = widget.lastDataChecksum;

            if (lastChecksum && currentChecksum === lastChecksum) {
                return null; // No changes detected
            }

            // Store new checksum
            widget.lastDataChecksum = currentChecksum;

            // Get changed data if widget supports it
            if (widget.getChangedData) {
                return await widget.getChangedData();
            }

            return { hasChanges: true }; // Generic change indication
            
        } catch (error) {
            console.error(`Failed to detect changes for widget ${widget.config.id}:`, error);
            return null;
        }
    }

    /**
     * Start change detection system
     * @private
     */
    startChangeDetection() {
        setInterval(async () => {
            if (this.isActive && document.visibilityState === 'visible') {
                await this.checkForDataChanges();
            }
        }, this.config.changeDetectionInterval);
    }

    /**
     * Check for data changes across all widgets
     * @returns {Promise<void>}
     * @private
     */
    async checkForDataChanges() {
        try {
            const widgets = this.dashboardController.widgets;
            
            for (const [widgetId, widget] of widgets) {
                const changes = await this.detectDataChanges(widget);
                
                if (changes) {
                    console.log(`Data changes detected for widget ${widgetId}`);
                    
                    // Trigger immediate refresh for changed widget
                    await this.refreshWidget(widget);
                }
            }
            
        } catch (error) {
            console.error('Failed to check for data changes:', error);
        }
    }

    /**
     * Add a new widget to auto-refresh system
     * @param {Object} widget - Widget instance
     */
    addWidget(widget) {
        if (this.isActive) {
            this.startWidgetRefresh(widget);
        }
    }

    /**
     * Remove a widget from auto-refresh system
     * @param {string} widgetId - Widget ID
     */
    removeWidget(widgetId) {
        if (this.refreshTimers.has(widgetId)) {
            clearInterval(this.refreshTimers.get(widgetId));
            this.refreshTimers.delete(widgetId);
        }
        
        this.lastUpdateTimestamps.delete(widgetId);
    }

    /**
     * Update refresh interval for a widget
     * @param {string} widgetId - Widget ID
     * @param {number} interval - New refresh interval in milliseconds
     */
    updateWidgetRefreshInterval(widgetId, interval) {
        const widget = this.dashboardController.widgets.get(widgetId);
        
        if (widget) {
            widget.config.refreshInterval = interval;
            
            // Restart timer with new interval
            if (this.isActive) {
                this.startWidgetRefresh(widget);
            }
        }
    }

    /**
     * Setup event listeners
     * @private
     */
    setupEventListeners() {
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        window.addEventListener('online', this.handleOnline);
        window.addEventListener('offline', this.handleOffline);
    }

    /**
     * Handle visibility change events
     * @private
     */
    handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            console.log('Page became visible, resuming auto-refresh');
            
            // Trigger immediate refresh when page becomes visible
            if (this.isActive) {
                this.performGlobalRefresh();
            }
        } else {
            console.log('Page became hidden, auto-refresh will pause');
        }
    }

    /**
     * Handle online events
     * @private
     */
    handleOnline() {
        console.log('Connection restored, resuming auto-refresh');
        
        if (this.isActive) {
            // Trigger immediate refresh when connection is restored
            this.performGlobalRefresh();
        }
    }

    /**
     * Handle offline events
     * @private
     */
    handleOffline() {
        console.log('Connection lost, auto-refresh will pause');
    }

    /**
     * Emit refresh event
     * @param {string} widgetId - Widget ID or 'global'
     * @param {Object} data - Event data
     * @private
     */
    emitRefreshEvent(widgetId, data) {
        const event = new CustomEvent('dashboard:refresh', {
            detail: {
                widgetId,
                ...data
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Utility function to create delay
     * @param {number} ms - Delay in milliseconds
     * @returns {Promise<void>}
     * @private
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get refresh status for all widgets
     * @returns {Object} Refresh status information
     */
    getRefreshStatus() {
        const status = {
            isActive: this.isActive,
            activeTimers: this.refreshTimers.size,
            lastUpdateTimestamps: Object.fromEntries(this.lastUpdateTimestamps),
            config: this.config
        };

        return status;
    }

    /**
     * Destroy auto-refresh manager and cleanup resources
     */
    destroy() {
        this.stopAutoRefresh();
        
        // Remove event listeners
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.handleOffline);
        
        // Clear data
        this.lastUpdateTimestamps.clear();
        
        console.log('Auto Refresh Manager destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AutoRefreshManager };
} else {
    window.AutoRefreshManager = AutoRefreshManager;
}