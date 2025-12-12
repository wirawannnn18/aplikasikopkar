/**
 * Lazy Widget Loader Module
 * Handles lazy loading of dashboard widgets for improved performance
 * 
 * **Feature: dashboard-analytics-kpi, Task 6.3: Caching and Performance Optimization**
 * **Validates: Requirements 6.1, 6.5, 8.1**
 */

class LazyWidgetLoader {
    constructor(options = {}) {
        this.intersectionThreshold = options.intersectionThreshold || 0.1;
        this.rootMargin = options.rootMargin || '50px';
        this.loadDelay = options.loadDelay || 100;
        this.retryAttempts = options.retryAttempts || 3;
        this.retryDelay = options.retryDelay || 1000;
        
        // State management
        this.widgets = new Map();
        this.loadedWidgets = new Set();
        this.loadingWidgets = new Set();
        this.failedWidgets = new Set();
        
        // Performance tracking
        this.metrics = {
            totalWidgets: 0,
            loadedWidgets: 0,
            failedWidgets: 0,
            averageLoadTime: 0,
            totalLoadTime: 0,
            visibilityChecks: 0
        };
        
        // Initialize Intersection Observer
        this.initializeIntersectionObserver();
        
        // Bind methods
        this.registerWidget = this.registerWidget.bind(this);
        this.loadWidget = this.loadWidget.bind(this);
        this.unregisterWidget = this.unregisterWidget.bind(this);
    }

    /**
     * Initialize Intersection Observer for visibility detection
     */
    initializeIntersectionObserver() {
        if (typeof IntersectionObserver === 'undefined') {
            console.warn('IntersectionObserver not supported, falling back to immediate loading');
            this.observer = null;
            return;
        }
        
        this.observer = new IntersectionObserver(
            (entries) => this.handleIntersection(entries),
            {
                threshold: this.intersectionThreshold,
                rootMargin: this.rootMargin
            }
        );
    }

    /**
     * Register widget for lazy loading
     * @param {Object} config - Widget configuration
     * @returns {string} Widget ID
     */
    registerWidget(config) {
        const {
            id = this.generateWidgetId(),
            element,
            loader,
            priority = 'normal',
            preload = false,
            dependencies = [],
            onLoad = null,
            onError = null,
            onProgress = null
        } = config;
        
        // Validate required parameters
        if (!element || !loader) {
            throw new Error('Widget element and loader function are required');
        }
        
        const widget = {
            id,
            element,
            loader,
            priority,
            preload,
            dependencies,
            onLoad,
            onError,
            onProgress,
            registeredAt: Date.now(),
            status: 'registered',
            loadTime: null,
            error: null,
            retryCount: 0
        };
        
        this.widgets.set(id, widget);
        this.metrics.totalWidgets++;
        
        // Add placeholder content
        this.addPlaceholder(element, widget);
        
        // Handle preload or immediate visibility
        if (preload) {
            this.loadWidget(id);
        } else if (this.observer) {
            this.observer.observe(element);
        } else {
            // Fallback: load immediately if no IntersectionObserver
            setTimeout(() => this.loadWidget(id), this.loadDelay);
        }
        
        return id;
    }

    /**
     * Handle intersection observer events
     * @param {Array} entries - Intersection observer entries
     */
    handleIntersection(entries) {
        this.metrics.visibilityChecks++;
        
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const widget = this.findWidgetByElement(entry.target);
                if (widget && !this.loadedWidgets.has(widget.id) && !this.loadingWidgets.has(widget.id)) {
                    // Add small delay to avoid loading too many widgets at once
                    setTimeout(() => this.loadWidget(widget.id), this.loadDelay);
                }
            }
        });
    }

    /**
     * Load widget with dependencies and retry logic
     * @param {string} widgetId - Widget ID to load
     * @returns {Promise<void>}
     */
    async loadWidget(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (!widget) {
            console.warn(`Widget ${widgetId} not found`);
            return;
        }
        
        // Skip if already loaded or loading
        if (this.loadedWidgets.has(widgetId) || this.loadingWidgets.has(widgetId)) {
            return;
        }
        
        this.loadingWidgets.add(widgetId);
        widget.status = 'loading';
        
        const startTime = Date.now();
        
        try {
            // Load dependencies first
            await this.loadDependencies(widget.dependencies);
            
            // Show loading state
            this.showLoadingState(widget);
            
            // Load widget content
            const content = await this.loadWidgetWithRetry(widget);
            
            // Render content
            await this.renderWidget(widget, content);
            
            // Update state
            const loadTime = Date.now() - startTime;
            widget.loadTime = loadTime;
            widget.status = 'loaded';
            
            this.loadedWidgets.add(widgetId);
            this.loadingWidgets.delete(widgetId);
            this.failedWidgets.delete(widgetId);
            
            // Update metrics
            this.updateMetrics(loadTime, true);
            
            // Stop observing this element
            if (this.observer) {
                this.observer.unobserve(widget.element);
            }
            
            // Notify success
            if (widget.onLoad) {
                widget.onLoad({ widgetId, loadTime, content });
            }
            
        } catch (error) {
            console.error(`Failed to load widget ${widgetId}:`, error);
            
            widget.status = 'failed';
            widget.error = error.message;
            
            this.loadingWidgets.delete(widgetId);
            this.failedWidgets.add(widgetId);
            
            // Update metrics
            this.updateMetrics(Date.now() - startTime, false);
            
            // Show error state
            this.showErrorState(widget, error);
            
            // Notify error
            if (widget.onError) {
                widget.onError({ widgetId, error });
            }
        }
    }

    /**
     * Load widget with retry logic
     * @param {Object} widget - Widget configuration
     * @returns {Promise<any>} Widget content
     */
    async loadWidgetWithRetry(widget) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                widget.retryCount = attempt - 1;
                
                // Notify progress
                if (widget.onProgress) {
                    widget.onProgress({
                        widgetId: widget.id,
                        stage: 'loading',
                        attempt,
                        maxAttempts: this.retryAttempts
                    });
                }
                
                const content = await widget.loader();
                return content;
                
            } catch (error) {
                lastError = error;
                console.warn(`Widget ${widget.id} load attempt ${attempt} failed:`, error.message);
                
                if (attempt < this.retryAttempts) {
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
                }
            }
        }
        
        throw new Error(`Failed to load widget ${widget.id} after ${this.retryAttempts} attempts: ${lastError.message}`);
    }

    /**
     * Load widget dependencies
     * @param {Array} dependencies - Array of dependency widget IDs
     * @returns {Promise<void>}
     */
    async loadDependencies(dependencies) {
        if (!dependencies || dependencies.length === 0) {
            return;
        }
        
        const dependencyPromises = dependencies.map(depId => {
            const depWidget = this.widgets.get(depId);
            if (depWidget && !this.loadedWidgets.has(depId)) {
                return this.loadWidget(depId);
            }
            return Promise.resolve();
        });
        
        await Promise.all(dependencyPromises);
    }

    /**
     * Render widget content
     * @param {Object} widget - Widget configuration
     * @param {any} content - Widget content to render
     * @returns {Promise<void>}
     */
    async renderWidget(widget, content) {
        const element = widget.element;
        
        // Clear placeholder
        element.innerHTML = '';
        element.classList.remove('widget-placeholder', 'widget-loading', 'widget-error');
        element.classList.add('widget-loaded');
        
        if (typeof content === 'string') {
            element.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            element.appendChild(content);
        } else if (content && typeof content.render === 'function') {
            await content.render(element);
        } else {
            console.warn(`Unknown content type for widget ${widget.id}`);
        }
        
        // Trigger any initialization scripts
        this.initializeWidgetScripts(element);
    }

    /**
     * Add placeholder content to widget element
     * @param {HTMLElement} element - Widget element
     * @param {Object} widget - Widget configuration
     */
    addPlaceholder(element, widget) {
        element.classList.add('widget-placeholder');
        element.innerHTML = `
            <div class="widget-placeholder-content">
                <div class="placeholder-skeleton">
                    <div class="skeleton-header"></div>
                    <div class="skeleton-body">
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line short"></div>
                    </div>
                </div>
                <div class="placeholder-text">Loading widget...</div>
            </div>
        `;
    }

    /**
     * Show loading state
     * @param {Object} widget - Widget configuration
     */
    showLoadingState(widget) {
        const element = widget.element;
        element.classList.remove('widget-placeholder', 'widget-error');
        element.classList.add('widget-loading');
        
        element.innerHTML = `
            <div class="widget-loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-text">Loading ${widget.id}...</div>
                ${widget.retryCount > 0 ? `<div class="retry-info">Retry ${widget.retryCount}</div>` : ''}
            </div>
        `;
    }

    /**
     * Show error state
     * @param {Object} widget - Widget configuration
     * @param {Error} error - Error object
     */
    showErrorState(widget, error) {
        const element = widget.element;
        element.classList.remove('widget-placeholder', 'widget-loading');
        element.classList.add('widget-error');
        
        element.innerHTML = `
            <div class="widget-error-content">
                <div class="error-icon">⚠️</div>
                <div class="error-message">Failed to load widget</div>
                <div class="error-details">${error.message}</div>
                <button class="retry-button" onclick="window.lazyWidgetLoader?.retryWidget('${widget.id}')">
                    Retry
                </button>
            </div>
        `;
    }

    /**
     * Initialize widget scripts after rendering
     * @param {HTMLElement} element - Widget element
     */
    initializeWidgetScripts(element) {
        // Execute any script tags in the widget content
        const scripts = element.querySelectorAll('script');
        scripts.forEach(script => {
            const newScript = document.createElement('script');
            newScript.textContent = script.textContent;
            
            // Copy attributes
            Array.from(script.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });
            
            script.parentNode.replaceChild(newScript, script);
        });
        
        // Trigger custom initialization event
        const event = new CustomEvent('widgetInitialized', {
            detail: { element }
        });
        element.dispatchEvent(event);
    }

    /**
     * Retry failed widget
     * @param {string} widgetId - Widget ID to retry
     * @returns {Promise<void>}
     */
    async retryWidget(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (!widget) {
            return;
        }
        
        // Reset state
        this.failedWidgets.delete(widgetId);
        widget.status = 'registered';
        widget.error = null;
        widget.retryCount = 0;
        
        // Retry loading
        await this.loadWidget(widgetId);
    }

    /**
     * Preload widgets by priority
     * @param {string} priority - Priority level ('high', 'normal', 'low')
     * @returns {Promise<Array>} Array of load results
     */
    async preloadByPriority(priority = 'high') {
        const widgetsToLoad = Array.from(this.widgets.values())
            .filter(widget => widget.priority === priority && !this.loadedWidgets.has(widget.id))
            .map(widget => widget.id);
        
        const results = [];
        
        for (const widgetId of widgetsToLoad) {
            try {
                await this.loadWidget(widgetId);
                results.push({ widgetId, success: true });
            } catch (error) {
                results.push({ widgetId, success: false, error: error.message });
            }
        }
        
        return results;
    }

    /**
     * Unregister widget
     * @param {string} widgetId - Widget ID to unregister
     * @returns {boolean} Success status
     */
    unregisterWidget(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (!widget) {
            return false;
        }
        
        // Stop observing
        if (this.observer && widget.element) {
            this.observer.unobserve(widget.element);
        }
        
        // Cleanup state
        this.widgets.delete(widgetId);
        this.loadedWidgets.delete(widgetId);
        this.loadingWidgets.delete(widgetId);
        this.failedWidgets.delete(widgetId);
        
        return true;
    }

    /**
     * Find widget by element
     * @param {HTMLElement} element - Element to find widget for
     * @returns {Object|null} Widget configuration or null
     */
    findWidgetByElement(element) {
        for (const widget of this.widgets.values()) {
            if (widget.element === element) {
                return widget;
            }
        }
        return null;
    }

    /**
     * Get widget information
     * @param {string} widgetId - Widget ID (optional)
     * @returns {Object|Array} Widget information
     */
    getWidgetInfo(widgetId = null) {
        if (widgetId) {
            const widget = this.widgets.get(widgetId);
            if (widget) {
                return {
                    ...widget,
                    isLoaded: this.loadedWidgets.has(widgetId),
                    isLoading: this.loadingWidgets.has(widgetId),
                    isFailed: this.failedWidgets.has(widgetId)
                };
            }
            return null;
        }
        
        return Array.from(this.widgets.values()).map(widget => ({
            ...widget,
            isLoaded: this.loadedWidgets.has(widget.id),
            isLoading: this.loadingWidgets.has(widget.id),
            isFailed: this.failedWidgets.has(widget.id)
        }));
    }

    /**
     * Get performance metrics
     * @returns {Object} Performance metrics
     */
    getMetrics() {
        const successRate = this.metrics.totalWidgets > 0 
            ? ((this.metrics.loadedWidgets / this.metrics.totalWidgets) * 100).toFixed(2)
            : 0;
            
        return {
            ...this.metrics,
            successRate: successRate + '%',
            activeWidgets: this.widgets.size,
            loadingWidgets: this.loadingWidgets.size,
            failedWidgets: this.failedWidgets.size
        };
    }

    /**
     * Update performance metrics
     * @param {number} loadTime - Load time in milliseconds
     * @param {boolean} success - Success status
     */
    updateMetrics(loadTime, success) {
        this.metrics.totalLoadTime += loadTime;
        
        if (success) {
            this.metrics.loadedWidgets++;
        } else {
            this.metrics.failedWidgets++;
        }
        
        this.metrics.averageLoadTime = this.metrics.loadedWidgets > 0 
            ? Math.round(this.metrics.totalLoadTime / this.metrics.loadedWidgets)
            : 0;
    }

    /**
     * Generate unique widget ID
     * @returns {string} Unique widget ID
     */
    generateWidgetId() {
        return 'widget_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Destroy lazy widget loader and cleanup resources
     */
    destroy() {
        // Disconnect observer
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        
        // Clear all state
        this.widgets.clear();
        this.loadedWidgets.clear();
        this.loadingWidgets.clear();
        this.failedWidgets.clear();
    }
}

// Global instance for easy access
if (typeof window !== 'undefined') {
    window.lazyWidgetLoader = new LazyWidgetLoader();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LazyWidgetLoader;
}