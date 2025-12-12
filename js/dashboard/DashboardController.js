/**
 * Dashboard Analytics & KPI - Dashboard Controller
 * 
 * Main controller class that orchestrates dashboard functionality,
 * manages widgets, handles user interactions, and coordinates data flow.
 */

class DashboardController {
    /**
     * Initialize Dashboard Controller
     * @param {string} containerId - HTML container element ID
     * @param {Object} config - Dashboard configuration
     */
    constructor(containerId, config = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.config = {
            theme: 'light',
            refreshInterval: 300000, // 5 minutes
            autoSave: true,
            ...config
        };
        
        this.widgets = new Map();
        this.widgetManager = null;
        this.analyticsEngine = null;
        this.chartRenderer = null;
        this.dataAggregator = null;
        this.autoRefreshManager = null;
        this.dataChangeDetector = null;
        this.connectionMonitor = null;
        
        this.currentUser = null;
        this.currentRole = null;
        this.dashboardConfig = null;
        
        this.refreshTimer = null;
        this.isInitialized = false;
        
        // Bind methods
        this.handleResize = this.handleResize.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    }

    /**
     * Initialize dashboard system
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            if (this.isInitialized) {
                console.warn('Dashboard already initialized');
                return;
            }

            console.log('Initializing Dashboard Analytics & KPI...');
            
            // Validate container
            if (!this.container) {
                throw new Error(`Container element with ID '${this.containerId}' not found`);
            }

            // Initialize core components
            await this.initializeComponents();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Apply theme
            this.applyTheme(this.config.theme);
            
            this.isInitialized = true;
            console.log('Dashboard initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
            throw error;
        }
    }

    /**
     * Initialize core dashboard components
     * @private
     */
    async initializeComponents() {
        // Initialize WidgetManager (available now)
        if (typeof WidgetManager !== 'undefined') {
            this.widgetManager = new WidgetManager(this);
            await this.widgetManager.initialize();
            
            // Make widget manager globally accessible for widget interactions
            window.widgetManager = this.widgetManager;
        }
        
        // Initialize AnalyticsEngine (available now)
        if (typeof AnalyticsEngine !== 'undefined') {
            this.analyticsEngine = new AnalyticsEngine();
            await this.analyticsEngine.initialize();
        }
        
        // Initialize AutoRefreshManager (available now)
        if (typeof AutoRefreshManager !== 'undefined') {
            this.autoRefreshManager = new AutoRefreshManager(this);
            await this.autoRefreshManager.initialize();
        }
        
        // Initialize DataChangeDetector (available now)
        if (typeof DataChangeDetector !== 'undefined') {
            this.dataChangeDetector = new DataChangeDetector();
            await this.dataChangeDetector.initialize();
            
            // Setup data change listeners
            this.setupDataChangeListeners();
        }
        
        // Initialize ConnectionMonitor (available now)
        if (typeof ConnectionMonitor !== 'undefined') {
            this.connectionMonitor = new ConnectionMonitor();
            await this.connectionMonitor.initialize();
            
            // Setup connection status listeners
            this.setupConnectionListeners();
        }
        
        // TODO: Initialize other components when implemented
        // const { ChartRenderer } = await import('./ChartRenderer.js');
        // const { DataAggregator } = await import('./DataAggregator.js');
        
        // this.chartRenderer = new ChartRenderer();
        // this.dataAggregator = new DataAggregator();
        
        // await this.chartRenderer.initialize();
        // await this.dataAggregator.initialize();
    }

    /**
     * Load dashboard for specific user and role
     * @param {string} userId - User identifier
     * @param {string} role - User role
     * @returns {Promise<void>}
     */
    async loadDashboard(userId, role) {
        try {
            const startTime = performance.now();
            
            this.currentUser = userId;
            this.currentRole = role;
            
            // Load dashboard configuration
            this.dashboardConfig = await this.loadDashboardConfig(userId, role);
            
            // Clear existing widgets
            this.clearDashboard();
            
            // Load widgets based on configuration
            await this.loadWidgets(this.dashboardConfig.layout);
            
            // Start auto-refresh if enabled
            if (this.config.refreshInterval > 0) {
                this.startAutoRefresh();
            }
            
            // Start data change monitoring
            if (this.dataChangeDetector) {
                this.dataChangeDetector.startMonitoring();
            }
            
            const loadTime = performance.now() - startTime;
            console.log(`Dashboard loaded in ${loadTime.toFixed(2)}ms`);
            
            // Emit dashboard loaded event
            this.emit('dashboardLoaded', {
                userId,
                role,
                loadTime,
                widgetCount: this.widgets.size
            });
            
        } catch (error) {
            console.error('Failed to load dashboard:', error);
            this.showError('Failed to load dashboard. Please try again.');
            throw error;
        }
    }

    /**
     * Load dashboard configuration from storage
     * @param {string} userId - User identifier
     * @param {string} role - User role
     * @returns {Promise<DashboardConfig>}
     * @private
     */
    async loadDashboardConfig(userId, role) {
        // Try to load user-specific configuration
        let config = this.loadFromStorage(`dashboard_${userId}`);
        
        if (!config) {
            // Load default configuration for role
            config = this.getDefaultDashboardConfig(role);
            
            // Save as user's default
            this.saveToStorage(`dashboard_${userId}`, config);
        }
        
        return config;
    }

    /**
     * Get default dashboard configuration for role
     * @param {string} role - User role
     * @returns {DashboardConfig}
     * @private
     */
    getDefaultDashboardConfig(role) {
        const baseConfig = {
            id: `dashboard_${Date.now()}`,
            userId: this.currentUser,
            role: role,
            theme: 'light',
            refreshInterval: 300000,
            createdAt: new Date(),
            updatedAt: new Date(),
            layout: []
        };

        // Role-specific widget layouts
        switch (role) {
            case 'admin':
            case 'manager':
                baseConfig.layout = this.getManagerDashboardLayout();
                break;
            case 'treasurer':
                baseConfig.layout = this.getTreasurerDashboardLayout();
                break;
            case 'supervisor':
                baseConfig.layout = this.getSupervisorDashboardLayout();
                break;
            default:
                baseConfig.layout = this.getBasicDashboardLayout();
        }

        return baseConfig;
    }

    /**
     * Get manager dashboard layout
     * @returns {WidgetConfig[]}
     * @private
     */
    getManagerDashboardLayout() {
        return [
            {
                id: 'financial-health',
                type: 'kpi',
                title: 'Financial Health Score',
                position: { x: 0, y: 0 },
                size: { width: 4, height: 2 },
                dataSource: 'financial-health',
                refreshInterval: 300000,
                chartOptions: { type: 'gauge' },
                filters: []
            },
            {
                id: 'member-growth',
                type: 'chart',
                title: 'Member Growth Trend',
                position: { x: 4, y: 0 },
                size: { width: 8, height: 4 },
                dataSource: 'member-analytics',
                refreshInterval: 300000,
                chartOptions: { type: 'line' },
                filters: []
            },
            {
                id: 'transaction-volume',
                type: 'kpi',
                title: 'Monthly Transaction Volume',
                position: { x: 0, y: 2 },
                size: { width: 4, height: 2 },
                dataSource: 'transaction-volume',
                refreshInterval: 300000,
                chartOptions: { type: 'kpi' },
                filters: []
            },
            {
                id: 'financial-overview',
                type: 'chart',
                title: 'Financial Overview',
                position: { x: 0, y: 4 },
                size: { width: 12, height: 4 },
                dataSource: 'financial-analytics',
                refreshInterval: 300000,
                chartOptions: { type: 'bar' },
                filters: []
            }
        ];
    }

    /**
     * Get treasurer dashboard layout
     * @returns {WidgetConfig[]}
     * @private
     */
    getTreasurerDashboardLayout() {
        return [
            {
                id: 'cash-balance',
                type: 'kpi',
                title: 'Current Cash Balance',
                position: { x: 0, y: 0 },
                size: { width: 3, height: 2 },
                dataSource: 'cash-balance',
                refreshInterval: 300000,
                chartOptions: { type: 'kpi' },
                filters: []
            },
            {
                id: 'savings-total',
                type: 'kpi',
                title: 'Total Savings',
                position: { x: 3, y: 0 },
                size: { width: 3, height: 2 },
                dataSource: 'savings-total',
                refreshInterval: 300000,
                chartOptions: { type: 'kpi' },
                filters: []
            },
            {
                id: 'loans-outstanding',
                type: 'kpi',
                title: 'Loans Outstanding',
                position: { x: 6, y: 0 },
                size: { width: 3, height: 2 },
                dataSource: 'loans-outstanding',
                refreshInterval: 300000,
                chartOptions: { type: 'kpi' },
                filters: []
            },
            {
                id: 'financial-ratios',
                type: 'kpi',
                title: 'Financial Ratios',
                position: { x: 9, y: 0 },
                size: { width: 3, height: 2 },
                dataSource: 'financial-ratios',
                refreshInterval: 300000,
                chartOptions: { type: 'kpi' },
                filters: []
            },
            {
                id: 'revenue-expense-trend',
                type: 'chart',
                title: 'Revenue vs Expense Trend',
                position: { x: 0, y: 2 },
                size: { width: 12, height: 4 },
                dataSource: 'revenue-expense',
                refreshInterval: 300000,
                chartOptions: { type: 'line' },
                filters: []
            }
        ];
    }

    /**
     * Get supervisor dashboard layout
     * @returns {WidgetConfig[]}
     * @private
     */
    getSupervisorDashboardLayout() {
        return [
            {
                id: 'member-activity-heatmap',
                type: 'heatmap',
                title: 'Member Activity Heatmap',
                position: { x: 0, y: 0 },
                size: { width: 8, height: 4 },
                dataSource: 'member-activity',
                refreshInterval: 300000,
                chartOptions: { type: 'heatmap' },
                filters: []
            },
            {
                id: 'top-members',
                type: 'table',
                title: 'Top Active Members',
                position: { x: 8, y: 0 },
                size: { width: 4, height: 4 },
                dataSource: 'top-members',
                refreshInterval: 300000,
                chartOptions: { type: 'table' },
                filters: []
            },
            {
                id: 'member-segmentation',
                type: 'chart',
                title: 'Member Segmentation',
                position: { x: 0, y: 4 },
                size: { width: 6, height: 4 },
                dataSource: 'member-segmentation',
                refreshInterval: 300000,
                chartOptions: { type: 'pie' },
                filters: []
            },
            {
                id: 'engagement-trends',
                type: 'chart',
                title: 'Engagement Trends',
                position: { x: 6, y: 4 },
                size: { width: 6, height: 4 },
                dataSource: 'engagement-trends',
                refreshInterval: 300000,
                chartOptions: { type: 'line' },
                filters: []
            }
        ];
    }

    /**
     * Get basic dashboard layout
     * @returns {WidgetConfig[]}
     * @private
     */
    getBasicDashboardLayout() {
        return [
            {
                id: 'overview-kpis',
                type: 'kpi',
                title: 'Key Metrics Overview',
                position: { x: 0, y: 0 },
                size: { width: 12, height: 2 },
                dataSource: 'overview-kpis',
                refreshInterval: 300000,
                chartOptions: { type: 'kpi' },
                filters: []
            },
            {
                id: 'monthly-summary',
                type: 'chart',
                title: 'Monthly Summary',
                position: { x: 0, y: 2 },
                size: { width: 12, height: 4 },
                dataSource: 'monthly-summary',
                refreshInterval: 300000,
                chartOptions: { type: 'bar' },
                filters: []
            }
        ];
    }

    /**
     * Load widgets from configuration
     * @param {WidgetConfig[]} layout - Widget layout configuration
     * @returns {Promise<void>}
     * @private
     */
    async loadWidgets(layout) {
        const loadPromises = layout.map(async (widgetConfig) => {
            try {
                const widget = await this.widgetManager.createWidget(
                    widgetConfig.type,
                    widgetConfig
                );
                this.widgets.set(widgetConfig.id, widget);
                return widget;
            } catch (error) {
                console.error(`Failed to load widget ${widgetConfig.id}:`, error);
                return null;
            }
        });

        await Promise.all(loadPromises);
    }

    /**
     * Clear all widgets from dashboard
     * @private
     */
    clearDashboard() {
        this.widgets.forEach(widget => {
            if (widget && typeof widget.destroy === 'function') {
                widget.destroy();
            }
        });
        this.widgets.clear();
        
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    /**
     * Refresh all dashboard data
     * @returns {Promise<void>}
     */
    async refreshData() {
        try {
            console.log('Refreshing dashboard data...');
            
            const refreshPromises = Array.from(this.widgets.values()).map(async (widget) => {
                if (widget && typeof widget.refresh === 'function') {
                    try {
                        await widget.refresh();
                    } catch (error) {
                        console.error(`Failed to refresh widget ${widget.id}:`, error);
                    }
                }
            });

            await Promise.all(refreshPromises);
            
            // Update last refresh timestamp
            this.lastRefresh = new Date();
            
            console.log('Dashboard data refreshed successfully');
            
        } catch (error) {
            console.error('Failed to refresh dashboard data:', error);
        }
    }

    /**
     * Start auto-refresh timer
     * @private
     */
    startAutoRefresh() {
        // Use new AutoRefreshManager if available
        if (this.autoRefreshManager) {
            this.autoRefreshManager.startAutoRefresh(this.widgets);
            return;
        }
        
        // Fallback to legacy refresh timer
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }

        this.refreshTimer = setInterval(() => {
            if (document.visibilityState === 'visible') {
                this.refreshData();
            }
        }, this.config.refreshInterval);
    }

    /**
     * Stop auto-refresh timer
     * @private
     */
    stopAutoRefresh() {
        // Use new AutoRefreshManager if available
        if (this.autoRefreshManager) {
            this.autoRefreshManager.stopAutoRefresh();
            return;
        }
        
        // Fallback to legacy refresh timer
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    /**
     * Setup event listeners
     * @private
     */
    setupEventListeners() {
        window.addEventListener('resize', this.handleResize);
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Setup dashboard-specific event listeners
        document.addEventListener('dashboard:dataChange', this.handleDataChange.bind(this));
        document.addEventListener('dashboard:dataError', this.handleDataError.bind(this));
        document.addEventListener('dashboard:refresh', this.handleRefreshEvent.bind(this));
        document.addEventListener('dashboard:connectionChange', this.handleConnectionChange.bind(this));
    }

    /**
     * Setup data change listeners for real-time updates
     * @private
     */
    setupDataChangeListeners() {
        if (!this.dataChangeDetector) {
            return;
        }

        // Add listeners for each data source that widgets use
        const dataSources = new Set();
        
        this.widgets.forEach(widget => {
            if (widget.config && widget.config.dataSource) {
                dataSources.add(widget.config.dataSource);
            }
        });

        dataSources.forEach(dataSource => {
            this.dataChangeDetector.addChangeListener(dataSource, async (changeInfo) => {
                console.log(`Data change detected for ${dataSource}:`, changeInfo);
                
                // Find widgets that use this data source and refresh them
                const affectedWidgets = Array.from(this.widgets.values()).filter(
                    widget => widget.config && widget.config.dataSource === dataSource
                );

                for (const widget of affectedWidgets) {
                    try {
                        if (widget.supportsPartialUpdate && changeInfo.data) {
                            await widget.partialUpdate(changeInfo.data);
                        } else {
                            await widget.refresh();
                        }
                    } catch (error) {
                        console.error(`Failed to refresh widget ${widget.config.id}:`, error);
                    }
                }
            });
        });
    }

    /**
     * Setup connection status listeners for network monitoring
     * @private
     */
    setupConnectionListeners() {
        if (!this.connectionMonitor) {
            return;
        }

        this.connectionMonitor.addStatusListener((statusInfo) => {
            console.log('Connection status changed:', statusInfo);
            
            // Handle connection state changes
            if (statusInfo.isOnline && !statusInfo.previousStatus.isOnline) {
                // Connection restored
                this.handleConnectionRestored();
            } else if (!statusInfo.isOnline && statusInfo.previousStatus.isOnline) {
                // Connection lost
                this.handleConnectionLost();
            }
            
            // Handle quality changes
            if (statusInfo.quality !== statusInfo.previousStatus.quality) {
                this.handleConnectionQualityChange(statusInfo.quality);
            }
        });
    }

    /**
     * Handle window resize
     * @private
     */
    handleResize() {
        // Debounce resize handling
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.widgets.forEach(widget => {
                if (widget && typeof widget.resize === 'function') {
                    widget.resize();
                }
            });
        }, 250);
    }

    /**
     * Handle visibility change
     * @private
     */
    handleVisibilityChange() {
        if (document.visibilityState === 'visible') {
            // Resume auto-refresh when page becomes visible
            if (this.config.refreshInterval > 0 && !this.refreshTimer) {
                this.startAutoRefresh();
            }
        } else {
            // Pause auto-refresh when page is hidden
            this.stopAutoRefresh();
        }
    }

    /**
     * Handle data change events
     * @param {CustomEvent} event - Data change event
     * @private
     */
    handleDataChange(event) {
        const { sourceId, timestamp } = event.detail;
        console.log(`Dashboard received data change notification for ${sourceId} at ${timestamp}`);
        
        // Update last refresh indicator
        this.updateLastRefreshIndicator(sourceId, timestamp);
    }

    /**
     * Handle data error events
     * @param {CustomEvent} event - Data error event
     * @private
     */
    handleDataError(event) {
        const { sourceId, error, errorCount } = event.detail;
        console.error(`Data error for ${sourceId}: ${error} (count: ${errorCount})`);
        
        // Show error notification to user
        this.showDataSourceError(sourceId, error);
    }

    /**
     * Handle refresh events
     * @param {CustomEvent} event - Refresh event
     * @private
     */
    handleRefreshEvent(event) {
        const { widgetId, success, refreshTime, error } = event.detail;
        
        if (success) {
            console.log(`Widget ${widgetId} refreshed successfully in ${refreshTime}ms`);
        } else {
            console.error(`Widget ${widgetId} refresh failed: ${error}`);
            this.showWidgetError(widgetId, error);
        }
    }

    /**
     * Handle connection change events
     * @param {CustomEvent} event - Connection change event
     * @private
     */
    handleConnectionChange(event) {
        const { isOnline, quality, latency } = event.detail;
        console.log(`Connection status: ${isOnline ? 'online' : 'offline'} (quality: ${quality})`);
        
        // Update connection indicator
        this.updateConnectionIndicator(isOnline, quality, latency);
    }

    /**
     * Handle connection restored
     * @private
     */
    handleConnectionRestored() {
        console.log('Connection restored - resuming dashboard operations');
        
        // Show success notification
        this.showConnectionNotification('Connection restored', 'success');
        
        // Force refresh all widgets
        setTimeout(() => {
            this.refreshData();
        }, 1000);
        
        // Resume auto-refresh if it was active
        if (this.config.refreshInterval > 0) {
            this.startAutoRefresh();
        }
        
        // Resume data change monitoring
        if (this.dataChangeDetector && !this.dataChangeDetector.getStatus().isActive) {
            this.dataChangeDetector.startMonitoring();
        }
    }

    /**
     * Handle connection lost
     * @private
     */
    handleConnectionLost() {
        console.log('Connection lost - entering offline mode');
        
        // Show warning notification
        this.showConnectionNotification('Connection lost - using cached data', 'warning');
        
        // The auto-refresh and data change detection will automatically pause
        // when they detect offline status
    }

    /**
     * Handle connection quality change
     * @param {string} quality - New connection quality
     * @private
     */
    handleConnectionQualityChange(quality) {
        console.log(`Connection quality changed to: ${quality}`);
        
        // Adjust refresh intervals based on connection quality
        if (this.autoRefreshManager) {
            this.adjustRefreshIntervalsForQuality(quality);
        }
        
        // Show quality notification for poor connections
        if (quality === 'poor' || quality === 'very-poor') {
            this.showConnectionNotification(`Slow connection detected (${quality})`, 'info');
        }
    }

    /**
     * Adjust refresh intervals based on connection quality
     * @param {string} quality - Connection quality
     * @private
     */
    adjustRefreshIntervalsForQuality(quality) {
        let multiplier = 1;
        
        switch (quality) {
            case 'excellent':
                multiplier = 0.8; // Faster refresh for excellent connection
                break;
            case 'good':
                multiplier = 1; // Normal refresh
                break;
            case 'fair':
                multiplier = 1.5; // Slower refresh for fair connection
                break;
            case 'poor':
                multiplier = 2; // Much slower refresh for poor connection
                break;
            case 'very-poor':
                multiplier = 3; // Very slow refresh for very poor connection
                break;
        }
        
        // Update refresh intervals for all widgets
        this.widgets.forEach((widget, widgetId) => {
            if (widget.config && widget.config.refreshInterval) {
                const baseInterval = widget.config.refreshInterval;
                const adjustedInterval = Math.floor(baseInterval * multiplier);
                
                this.autoRefreshManager.updateWidgetRefreshInterval(widgetId, adjustedInterval);
            }
        });
        
        console.log(`Adjusted refresh intervals by factor ${multiplier} for ${quality} connection`);
    }

    /**
     * Apply theme to dashboard
     * @param {string} theme - Theme name
     */
    applyTheme(theme) {
        if (this.container) {
            this.container.className = `dashboard-container theme-${theme}`;
        }
        this.config.theme = theme;
    }

    /**
     * Show error message to user
     * @param {string} message - Error message
     * @private
     */
    showError(message) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'dashboard-error alert alert-danger';
        errorDiv.innerHTML = `
            <strong>Error:</strong> ${message}
            <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
        `;
        
        if (this.container) {
            this.container.insertBefore(errorDiv, this.container.firstChild);
        }
    }

    /**
     * Show data source error to user
     * @param {string} sourceId - Data source identifier
     * @param {string} error - Error message
     * @private
     */
    showDataSourceError(sourceId, error) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'dashboard-data-error alert alert-warning';
        errorDiv.innerHTML = `
            <strong>Data Source Error:</strong> ${sourceId} - ${error}
            <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
        `;
        
        if (this.container) {
            this.container.insertBefore(errorDiv, this.container.firstChild);
        }

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 10000);
    }

    /**
     * Show widget error to user
     * @param {string} widgetId - Widget identifier
     * @param {string} error - Error message
     * @private
     */
    showWidgetError(widgetId, error) {
        // Find widget element and show error overlay
        const widget = this.widgets.get(widgetId);
        if (widget && widget.element) {
            const errorOverlay = document.createElement('div');
            errorOverlay.className = 'widget-error-overlay';
            errorOverlay.innerHTML = `
                <div class="error-content">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Failed to refresh widget</p>
                    <small>${error}</small>
                    <button class="btn btn-sm btn-primary" onclick="this.parentElement.parentElement.remove()">
                        Dismiss
                    </button>
                </div>
            `;
            
            widget.element.appendChild(errorOverlay);
            
            // Auto-remove after 15 seconds
            setTimeout(() => {
                if (errorOverlay.parentElement) {
                    errorOverlay.remove();
                }
            }, 15000);
        }
    }

    /**
     * Update last refresh indicator
     * @param {string} sourceId - Data source identifier
     * @param {Date} timestamp - Refresh timestamp
     * @private
     */
    updateLastRefreshIndicator(sourceId, timestamp) {
        // Find widgets that use this data source
        this.widgets.forEach(widget => {
            if (widget.config && widget.config.dataSource === sourceId) {
                this.updateWidgetRefreshIndicator(widget, timestamp);
            }
        });

        // Update global refresh indicator
        this.updateGlobalRefreshIndicator(timestamp);
    }

    /**
     * Update widget refresh indicator
     * @param {Object} widget - Widget instance
     * @param {Date} timestamp - Refresh timestamp
     * @private
     */
    updateWidgetRefreshIndicator(widget, timestamp) {
        if (!widget.element) {
            return;
        }

        let indicator = widget.element.querySelector('.refresh-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'refresh-indicator';
            widget.element.appendChild(indicator);
        }

        const timeString = timestamp.toLocaleTimeString();
        indicator.innerHTML = `
            <i class="fas fa-sync-alt"></i>
            <span>Updated: ${timeString}</span>
        `;
        
        // Add animation
        indicator.classList.add('refresh-animation');
        setTimeout(() => {
            indicator.classList.remove('refresh-animation');
        }, 1000);
    }

    /**
     * Update global refresh indicator
     * @param {Date} timestamp - Refresh timestamp
     * @private
     */
    updateGlobalRefreshIndicator(timestamp) {
        let indicator = document.querySelector('.dashboard-refresh-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'dashboard-refresh-indicator';
            
            if (this.container) {
                this.container.appendChild(indicator);
            }
        }

        const timeString = timestamp.toLocaleTimeString();
        indicator.innerHTML = `
            <i class="fas fa-clock"></i>
            <span>Last updated: ${timeString}</span>
        `;
    }

    /**
     * Show connection notification to user
     * @param {string} message - Notification message
     * @param {string} type - Notification type ('success', 'warning', 'info', 'error')
     * @private
     */
    showConnectionNotification(message, type = 'info') {
        const notificationDiv = document.createElement('div');
        notificationDiv.className = `dashboard-connection-notification alert alert-${type === 'success' ? 'success' : type === 'warning' ? 'warning' : type === 'error' ? 'danger' : 'info'}`;
        notificationDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : type === 'error' ? 'times-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
        `;
        
        if (this.container) {
            this.container.insertBefore(notificationDiv, this.container.firstChild);
        }

        // Auto-remove after delay based on type
        const delay = type === 'error' ? 15000 : type === 'warning' ? 10000 : 5000;
        setTimeout(() => {
            if (notificationDiv.parentElement) {
                notificationDiv.remove();
            }
        }, delay);
    }

    /**
     * Update connection indicator
     * @param {boolean} isOnline - Online status
     * @param {string} quality - Connection quality
     * @param {number|null} latency - Connection latency
     * @private
     */
    updateConnectionIndicator(isOnline, quality, latency) {
        let indicator = document.querySelector('.dashboard-connection-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'dashboard-connection-indicator';
            
            if (this.container) {
                this.container.appendChild(indicator);
            }
        }

        // Determine indicator color and icon
        let colorClass = 'text-success';
        let icon = 'fas fa-wifi';
        
        if (!isOnline) {
            colorClass = 'text-danger';
            icon = 'fas fa-wifi-slash';
        } else {
            switch (quality) {
                case 'excellent':
                    colorClass = 'text-success';
                    break;
                case 'good':
                    colorClass = 'text-success';
                    break;
                case 'fair':
                    colorClass = 'text-warning';
                    break;
                case 'poor':
                case 'very-poor':
                    colorClass = 'text-danger';
                    break;
            }
        }

        const latencyText = latency ? ` (${Math.round(latency)}ms)` : '';
        const statusText = isOnline ? `${quality}${latencyText}` : 'offline';

        indicator.innerHTML = `
            <i class="${icon} ${colorClass}"></i>
            <span class="${colorClass}">${statusText}</span>
        `;
        
        // Add tooltip with more details
        indicator.title = isOnline 
            ? `Connection: ${quality}${latency ? `, Latency: ${Math.round(latency)}ms` : ''}`
            : 'No internet connection';
    }

    /**
     * Save data to localStorage
     * @param {string} key - Storage key
     * @param {any} data - Data to save
     * @private
     */
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }

    /**
     * Load data from localStorage
     * @param {string} key - Storage key
     * @returns {any} Loaded data or null
     * @private
     */
    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            return null;
        }
    }

    /**
     * Emit custom event
     * @param {string} eventName - Event name
     * @param {any} data - Event data
     * @private
     */
    emit(eventName, data) {
        const event = new CustomEvent(`dashboard:${eventName}`, {
            detail: data
        });
        document.dispatchEvent(event);
    }

    /**
     * Destroy dashboard and cleanup resources
     */
    destroy() {
        this.stopAutoRefresh();
        this.clearDashboard();
        
        // Cleanup auto-refresh manager
        if (this.autoRefreshManager) {
            this.autoRefreshManager.destroy();
            this.autoRefreshManager = null;
        }
        
        // Cleanup data change detector
        if (this.dataChangeDetector) {
            this.dataChangeDetector.destroy();
            this.dataChangeDetector = null;
        }
        
        // Cleanup connection monitor
        if (this.connectionMonitor) {
            this.connectionMonitor.destroy();
            this.connectionMonitor = null;
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        document.removeEventListener('dashboard:dataChange', this.handleDataChange);
        document.removeEventListener('dashboard:dataError', this.handleDataError);
        document.removeEventListener('dashboard:refresh', this.handleRefreshEvent);
        document.removeEventListener('dashboard:connectionChange', this.handleConnectionChange);
        
        this.isInitialized = false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DashboardController };
} else {
    window.DashboardController = DashboardController;
}