/**
 * Dashboard Analytics & KPI - Widget Manager
 * 
 * Manages widget lifecycle, positioning, data binding, and refresh mechanisms.
 * Handles widget creation, configuration, updates, and cleanup.
 */

class WidgetManager {
    /**
     * Initialize Widget Manager
     * @param {DashboardController} dashboardController - Parent dashboard controller
     */
    constructor(dashboardController) {
        this.dashboardController = dashboardController;
        this.widgets = new Map();
        this.widgetTypes = new Map();
        this.refreshTimers = new Map();
        this.isInitialized = false;
        
        // Widget positioning and layout
        this.gridColumns = 12;
        this.gridRowHeight = 60; // pixels
        this.gridGap = 20; // pixels
        
        // Performance tracking
        this.performanceMetrics = {
            widgetCreationTimes: [],
            refreshTimes: [],
            totalWidgets: 0
        };
        
        // Bind methods
        this.handleWidgetError = this.handleWidgetError.bind(this);
        this.handleWidgetResize = this.handleWidgetResize.bind(this);
    }

    /**
     * Initialize widget manager
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            console.log('Initializing Widget Manager...');
            
            // Register built-in widget types
            await this.registerBuiltInWidgetTypes();
            
            // Setup widget container
            this.setupWidgetContainer();
            
            this.isInitialized = true;
            console.log('Widget Manager initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Widget Manager:', error);
            throw error;
        }
    }

    /**
     * Register built-in widget types
     * @private
     */
    async registerBuiltInWidgetTypes() {
        // Register KPI widget type
        this.widgetTypes.set('kpi', {
            name: 'KPI Widget',
            description: 'Key Performance Indicator display',
            defaultSize: { width: 3, height: 2 },
            minSize: { width: 2, height: 1 },
            maxSize: { width: 6, height: 4 },
            createWidget: this.createKPIWidget.bind(this)
        });

        // Register Chart widget type
        this.widgetTypes.set('chart', {
            name: 'Chart Widget',
            description: 'Data visualization charts',
            defaultSize: { width: 6, height: 4 },
            minSize: { width: 4, height: 3 },
            maxSize: { width: 12, height: 8 },
            createWidget: this.createChartWidget.bind(this)
        });

        // Register Table widget type
        this.widgetTypes.set('table', {
            name: 'Table Widget',
            description: 'Tabular data display',
            defaultSize: { width: 6, height: 4 },
            minSize: { width: 4, height: 3 },
            maxSize: { width: 12, height: 6 },
            createWidget: this.createTableWidget.bind(this)
        });

        // Register Gauge widget type
        this.widgetTypes.set('gauge', {
            name: 'Gauge Widget',
            description: 'Progress and performance gauges',
            defaultSize: { width: 3, height: 3 },
            minSize: { width: 2, height: 2 },
            maxSize: { width: 4, height: 4 },
            createWidget: this.createGaugeWidget.bind(this)
        });

        // Register Heatmap widget type
        this.widgetTypes.set('heatmap', {
            name: 'Heatmap Widget',
            description: 'Activity and correlation heatmaps',
            defaultSize: { width: 8, height: 4 },
            minSize: { width: 6, height: 3 },
            maxSize: { width: 12, height: 6 },
            createWidget: this.createHeatmapWidget.bind(this)
        });

        // Register Comparison widget type
        this.widgetTypes.set('comparison', {
            name: 'Comparison Widget',
            description: 'Side-by-side metric comparisons',
            defaultSize: { width: 6, height: 3 },
            minSize: { width: 4, height: 2 },
            maxSize: { width: 8, height: 4 },
            createWidget: this.createComparisonWidget.bind(this)
        });
    }

    /**
     * Setup widget container in dashboard
     * @private
     */
    setupWidgetContainer() {
        const container = this.dashboardController.container;
        if (!container) return;

        // Find or create dashboard content area
        let contentArea = container.querySelector('#dashboardContent');
        if (!contentArea) {
            contentArea = document.createElement('div');
            contentArea.id = 'dashboardContent';
            contentArea.className = 'dashboard-grid';
            container.appendChild(contentArea);
        }

        this.widgetContainer = contentArea;
    }

    /**
     * Create a new widget
     * @param {WidgetType} type - Widget type
     * @param {WidgetConfig} config - Widget configuration
     * @returns {Promise<Widget>}
     */
    async createWidget(type, config) {
        try {
            const startTime = performance.now();
            
            // Validate widget type
            const widgetType = this.widgetTypes.get(type);
            if (!widgetType) {
                throw new Error(`Unknown widget type: ${type}`);
            }

            // Validate and normalize configuration
            const normalizedConfig = this.normalizeWidgetConfig(config, widgetType);

            // Create widget instance
            const widget = await widgetType.createWidget(normalizedConfig);
            
            // Setup widget properties
            widget.id = normalizedConfig.id;
            widget.type = type;
            widget.config = normalizedConfig;
            widget.manager = this;
            
            // Create widget DOM element
            const widgetElement = this.createWidgetElement(widget);
            widget.element = widgetElement;
            
            // Position widget in grid
            this.positionWidget(widget);
            
            // Setup widget refresh if configured
            if (normalizedConfig.refreshInterval > 0) {
                this.setupWidgetRefresh(widget);
            }
            
            // Add to widget registry
            this.widgets.set(widget.id, widget);
            
            // Track performance
            const creationTime = performance.now() - startTime;
            this.performanceMetrics.widgetCreationTimes.push(creationTime);
            this.performanceMetrics.totalWidgets++;
            
            console.log(`Widget ${widget.id} created in ${creationTime.toFixed(2)}ms`);
            
            // Emit widget created event
            this.emitWidgetEvent('widgetCreated', widget);
            
            return widget;
            
        } catch (error) {
            console.error(`Failed to create widget ${config.id}:`, error);
            throw error;
        }
    }

    /**
     * Update widget data and refresh display
     * @param {string} widgetId - Widget identifier
     * @param {any} data - New widget data
     * @returns {Promise<void>}
     */
    async updateWidget(widgetId, data) {
        try {
            const widget = this.widgets.get(widgetId);
            if (!widget) {
                throw new Error(`Widget not found: ${widgetId}`);
            }

            const startTime = performance.now();
            
            // Update widget data
            widget.data = data;
            
            // Refresh widget display
            if (typeof widget.refresh === 'function') {
                await widget.refresh(data);
            }
            
            // Update last refresh timestamp
            widget.lastRefresh = new Date();
            
            // Track performance
            const refreshTime = performance.now() - startTime;
            this.performanceMetrics.refreshTimes.push(refreshTime);
            
            // Emit widget updated event
            this.emitWidgetEvent('widgetUpdated', widget);
            
        } catch (error) {
            console.error(`Failed to update widget ${widgetId}:`, error);
            this.handleWidgetError(widgetId, error);
        }
    }

    /**
     * Remove widget from dashboard
     * @param {string} widgetId - Widget identifier
     * @returns {Promise<void>}
     */
    async removeWidget(widgetId) {
        try {
            const widget = this.widgets.get(widgetId);
            if (!widget) {
                console.warn(`Widget not found for removal: ${widgetId}`);
                return;
            }

            // Clear refresh timer
            this.clearWidgetRefresh(widgetId);
            
            // Destroy widget
            if (typeof widget.destroy === 'function') {
                await widget.destroy();
            }
            
            // Remove DOM element
            if (widget.element && widget.element.parentNode) {
                widget.element.parentNode.removeChild(widget.element);
            }
            
            // Remove from registry
            this.widgets.delete(widgetId);
            
            console.log(`Widget ${widgetId} removed successfully`);
            
            // Emit widget removed event
            this.emitWidgetEvent('widgetRemoved', { id: widgetId });
            
        } catch (error) {
            console.error(`Failed to remove widget ${widgetId}:`, error);
        }
    }

    /**
     * Rearrange widgets according to new layout
     * @param {WidgetLayout[]} layout - New widget layout
     * @returns {Promise<void>}
     */
    async rearrangeWidgets(layout) {
        try {
            console.log('Rearranging widgets...');
            
            // Update widget positions
            for (const layoutItem of layout) {
                const widget = this.widgets.get(layoutItem.id);
                if (widget) {
                    widget.config.position = layoutItem.position;
                    widget.config.size = layoutItem.size;
                    this.positionWidget(widget);
                }
            }
            
            // Emit layout changed event
            this.emitWidgetEvent('layoutChanged', layout);
            
            console.log('Widget rearrangement completed');
            
        } catch (error) {
            console.error('Failed to rearrange widgets:', error);
        }
    }

    /**
     * Normalize widget configuration
     * @param {WidgetConfig} config - Raw widget configuration
     * @param {Object} widgetType - Widget type definition
     * @returns {WidgetConfig}
     * @private
     */
    normalizeWidgetConfig(config, widgetType) {
        return {
            id: config.id || `widget_${Date.now()}`,
            type: config.type,
            title: config.title || 'Untitled Widget',
            position: config.position || { x: 0, y: 0 },
            size: config.size || widgetType.defaultSize,
            dataSource: config.dataSource || 'default',
            refreshInterval: config.refreshInterval || 0,
            chartOptions: config.chartOptions || {},
            filters: config.filters || [],
            ...config
        };
    }

    /**
     * Create widget DOM element
     * @param {Widget} widget - Widget instance
     * @returns {HTMLElement}
     * @private
     */
    createWidgetElement(widget) {
        const element = document.createElement('div');
        element.id = `widget-${widget.id}`;
        element.className = 'widget';
        element.setAttribute('data-widget-id', widget.id);
        element.setAttribute('data-widget-type', widget.type);
        
        // Create widget structure
        element.innerHTML = `
            <div class="widget-header">
                <h3 class="widget-title">${widget.config.title}</h3>
                <div class="widget-controls">
                    <button class="widget-menu btn btn-sm btn-outline-secondary" 
                            onclick="window.widgetManager?.showWidgetMenu('${widget.id}')">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
            </div>
            <div class="widget-content" id="widget-content-${widget.id}">
                <div class="widget-loading">
                    <div class="spinner-border spinner-border-sm" role="status"></div>
                    <span class="ms-2">Loading...</span>
                </div>
            </div>
            <div class="widget-footer" style="display: none;">
                <small class="text-muted">Last updated: <span class="last-update-time">-</span></small>
            </div>
        `;
        
        // Add to container
        if (this.widgetContainer) {
            this.widgetContainer.appendChild(element);
        }
        
        return element;
    }

    /**
     * Position widget in grid layout
     * @param {Widget} widget - Widget to position
     * @private
     */
    positionWidget(widget) {
        if (!widget.element) return;
        
        const { position, size } = widget.config;
        
        // Calculate grid position
        const gridColumn = `${position.x + 1} / span ${size.width}`;
        const gridRow = `${position.y + 1} / span ${size.height}`;
        
        // Apply CSS Grid positioning
        widget.element.style.gridColumn = gridColumn;
        widget.element.style.gridRow = gridRow;
        
        // Add size classes for responsive behavior
        widget.element.className = `widget widget-${size.width}x${size.height}`;
    }

    /**
     * Setup automatic widget refresh
     * @param {Widget} widget - Widget to setup refresh for
     * @private
     */
    setupWidgetRefresh(widget) {
        if (widget.config.refreshInterval <= 0) return;
        
        const refreshTimer = setInterval(async () => {
            try {
                if (typeof widget.refresh === 'function') {
                    await widget.refresh();
                }
            } catch (error) {
                console.error(`Widget refresh failed for ${widget.id}:`, error);
                this.handleWidgetError(widget.id, error);
            }
        }, widget.config.refreshInterval);
        
        this.refreshTimers.set(widget.id, refreshTimer);
    }

    /**
     * Clear widget refresh timer
     * @param {string} widgetId - Widget identifier
     * @private
     */
    clearWidgetRefresh(widgetId) {
        const timer = this.refreshTimers.get(widgetId);
        if (timer) {
            clearInterval(timer);
            this.refreshTimers.delete(widgetId);
        }
    }

    /**
     * Handle widget errors
     * @param {string} widgetId - Widget identifier
     * @param {Error} error - Error object
     * @private
     */
    handleWidgetError(widgetId, error) {
        const widget = this.widgets.get(widgetId);
        if (!widget || !widget.element) return;
        
        // Show error in widget
        const contentElement = widget.element.querySelector('.widget-content');
        if (contentElement) {
            contentElement.innerHTML = `
                <div class="widget-error alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Error:</strong> ${error.message}
                    <button class="btn btn-sm btn-outline-danger ms-2" 
                            onclick="window.widgetManager?.retryWidget('${widgetId}')">
                        <i class="fas fa-redo me-1"></i>Retry
                    </button>
                </div>
            `;
        }
        
        // Emit error event
        this.emitWidgetEvent('widgetError', { widgetId, error });
    }

    /**
     * Retry failed widget
     * @param {string} widgetId - Widget identifier
     */
    async retryWidget(widgetId) {
        try {
            const widget = this.widgets.get(widgetId);
            if (!widget) return;
            
            // Show loading state
            const contentElement = widget.element.querySelector('.widget-content');
            if (contentElement) {
                contentElement.innerHTML = `
                    <div class="widget-loading">
                        <div class="spinner-border spinner-border-sm" role="status"></div>
                        <span class="ms-2">Retrying...</span>
                    </div>
                `;
            }
            
            // Retry widget refresh
            if (typeof widget.refresh === 'function') {
                await widget.refresh();
            }
            
        } catch (error) {
            console.error(`Widget retry failed for ${widgetId}:`, error);
            this.handleWidgetError(widgetId, error);
        }
    }

    /**
     * Handle widget resize
     * @param {string} widgetId - Widget identifier
     * @private
     */
    handleWidgetResize(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (!widget) return;
        
        // Trigger widget resize if supported
        if (typeof widget.resize === 'function') {
            widget.resize();
        }
        
        // Emit resize event
        this.emitWidgetEvent('widgetResized', widget);
    }

    /**
     * Emit widget event
     * @param {string} eventName - Event name
     * @param {any} data - Event data
     * @private
     */
    emitWidgetEvent(eventName, data) {
        const event = new CustomEvent(`widget:${eventName}`, {
            detail: data
        });
        document.dispatchEvent(event);
    }

    /**
     * Get widget performance metrics
     * @returns {Object}
     */
    getPerformanceMetrics() {
        const metrics = this.performanceMetrics;
        
        return {
            totalWidgets: metrics.totalWidgets,
            averageCreationTime: metrics.widgetCreationTimes.length > 0 
                ? metrics.widgetCreationTimes.reduce((a, b) => a + b, 0) / metrics.widgetCreationTimes.length 
                : 0,
            averageRefreshTime: metrics.refreshTimes.length > 0
                ? metrics.refreshTimes.reduce((a, b) => a + b, 0) / metrics.refreshTimes.length
                : 0,
            activeWidgets: this.widgets.size,
            activeRefreshTimers: this.refreshTimers.size
        };
    }

    // Widget Type Creators (Placeholder implementations)
    
    /**
     * Create KPI widget
     * @param {WidgetConfig} config - Widget configuration
     * @returns {Promise<Widget>}
     * @private
     */
    async createKPIWidget(config) {
        return {
            refresh: async (data) => {
                // KPI widget refresh implementation
                const contentElement = document.getElementById(`widget-content-${config.id}`);
                if (contentElement) {
                    contentElement.innerHTML = `
                        <div class="kpi-widget text-center">
                            <div class="kpi-value text-primary">
                                ${data?.value || '0'}
                            </div>
                            <div class="kpi-label text-muted">
                                ${config.title}
                            </div>
                        </div>
                    `;
                }
            },
            resize: () => {
                // KPI widget resize implementation
            },
            destroy: async () => {
                // KPI widget cleanup
            }
        };
    }

    /**
     * Create Chart widget
     * @param {WidgetConfig} config - Widget configuration
     * @returns {Promise<Widget>}
     * @private
     */
    async createChartWidget(config) {
        return {
            refresh: async (data) => {
                // Chart widget refresh implementation
                const contentElement = document.getElementById(`widget-content-${config.id}`);
                if (contentElement) {
                    contentElement.innerHTML = `
                        <div class="chart-widget">
                            <canvas id="chart-${config.id}"></canvas>
                        </div>
                    `;
                }
            },
            resize: () => {
                // Chart widget resize implementation
            },
            destroy: async () => {
                // Chart widget cleanup
            }
        };
    }

    /**
     * Create Table widget
     * @param {WidgetConfig} config - Widget configuration
     * @returns {Promise<Widget>}
     * @private
     */
    async createTableWidget(config) {
        return {
            refresh: async (data) => {
                // Table widget refresh implementation
                const contentElement = document.getElementById(`widget-content-${config.id}`);
                if (contentElement) {
                    contentElement.innerHTML = `
                        <div class="table-widget">
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead><tr><th>Data</th><th>Value</th></tr></thead>
                                    <tbody><tr><td colspan="2">No data available</td></tr></tbody>
                                </table>
                            </div>
                        </div>
                    `;
                }
            },
            resize: () => {
                // Table widget resize implementation
            },
            destroy: async () => {
                // Table widget cleanup
            }
        };
    }

    /**
     * Create Gauge widget
     * @param {WidgetConfig} config - Widget configuration
     * @returns {Promise<Widget>}
     * @private
     */
    async createGaugeWidget(config) {
        return {
            refresh: async (data) => {
                // Gauge widget refresh implementation
                const contentElement = document.getElementById(`widget-content-${config.id}`);
                if (contentElement) {
                    contentElement.innerHTML = `
                        <div class="gauge-widget text-center">
                            <div class="gauge-container">
                                <canvas id="gauge-${config.id}" width="200" height="200"></canvas>
                            </div>
                        </div>
                    `;
                }
            },
            resize: () => {
                // Gauge widget resize implementation
            },
            destroy: async () => {
                // Gauge widget cleanup
            }
        };
    }

    /**
     * Create Heatmap widget
     * @param {WidgetConfig} config - Widget configuration
     * @returns {Promise<Widget>}
     * @private
     */
    async createHeatmapWidget(config) {
        return {
            refresh: async (data) => {
                // Heatmap widget refresh implementation
                const contentElement = document.getElementById(`widget-content-${config.id}`);
                if (contentElement) {
                    contentElement.innerHTML = `
                        <div class="heatmap-widget">
                            <canvas id="heatmap-${config.id}"></canvas>
                        </div>
                    `;
                }
            },
            resize: () => {
                // Heatmap widget resize implementation
            },
            destroy: async () => {
                // Heatmap widget cleanup
            }
        };
    }

    /**
     * Create Comparison widget
     * @param {WidgetConfig} config - Widget configuration
     * @returns {Promise<Widget>}
     * @private
     */
    async createComparisonWidget(config) {
        return {
            refresh: async (data) => {
                // Comparison widget refresh implementation
                const contentElement = document.getElementById(`widget-content-${config.id}`);
                if (contentElement) {
                    contentElement.innerHTML = `
                        <div class="comparison-widget">
                            <div class="row">
                                <div class="col-6 text-center">
                                    <div class="comparison-value">0</div>
                                    <div class="comparison-label">Current</div>
                                </div>
                                <div class="col-6 text-center">
                                    <div class="comparison-value">0</div>
                                    <div class="comparison-label">Previous</div>
                                </div>
                            </div>
                        </div>
                    `;
                }
            },
            resize: () => {
                // Comparison widget resize implementation
            },
            destroy: async () => {
                // Comparison widget cleanup
            }
        };
    }

    /**
     * Destroy widget manager and cleanup resources
     */
    destroy() {
        // Clear all refresh timers
        this.refreshTimers.forEach((timer, widgetId) => {
            clearInterval(timer);
        });
        this.refreshTimers.clear();
        
        // Destroy all widgets
        this.widgets.forEach(async (widget) => {
            if (typeof widget.destroy === 'function') {
                await widget.destroy();
            }
        });
        this.widgets.clear();
        
        this.isInitialized = false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WidgetManager };
} else {
    window.WidgetManager = WidgetManager;
    window.widgetManager = null; // Will be set by DashboardController
}