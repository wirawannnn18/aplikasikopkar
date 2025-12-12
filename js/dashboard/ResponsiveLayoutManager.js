/**
 * Dashboard Analytics & KPI - Responsive Layout Manager
 * 
 * Manages responsive layouts and mobile optimization for dashboard widgets.
 * Implements mobile-first responsive design with touch-friendly interactions.
 */

class ResponsiveLayoutManager {
    /**
     * Initialize Responsive Layout Manager
     * @param {DashboardController} dashboardController - Dashboard controller instance
     */
    constructor(dashboardController) {
        this.dashboardController = dashboardController;
        this.container = dashboardController.container;
        
        // Responsive breakpoints (mobile-first approach)
        this.breakpoints = {
            xs: 0,      // Extra small devices (phones)
            sm: 576,    // Small devices (landscape phones)
            md: 768,    // Medium devices (tablets)
            lg: 992,    // Large devices (desktops)
            xl: 1200,   // Extra large devices (large desktops)
            xxl: 1400   // Extra extra large devices
        };
        
        this.currentBreakpoint = null;
        this.isMobile = false;
        this.isTablet = false;
        this.isTouch = false;
        
        // Layout configurations for different screen sizes
        this.layoutConfigs = new Map();
        
        // Touch interaction settings
        this.touchSettings = {
            minTouchTarget: 44, // Minimum touch target size (44px recommended)
            swipeThreshold: 50, // Minimum distance for swipe gestures
            tapTimeout: 300,    // Maximum time for tap gesture
            doubleTapTimeout: 300 // Maximum time between taps for double tap
        };
        
        // Performance optimization settings
        this.performanceSettings = {
            enableAnimations: true,
            enableTransitions: true,
            enableShadows: true,
            enableGradients: true,
            maxVisibleWidgets: 20 // Limit visible widgets on mobile
        };
        
        // Bind methods
        this.handleResize = this.handleResize.bind(this);
        this.handleOrientationChange = this.handleOrientationChange.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        
        this.isInitialized = false;
    }

    /**
     * Initialize responsive layout manager
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            console.log('Initializing Responsive Layout Manager...');
            
            // Detect device capabilities
            this.detectDeviceCapabilities();
            
            // Setup responsive CSS classes
            this.setupResponsiveClasses();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize layout configurations
            this.initializeLayoutConfigs();
            
            // Apply initial responsive layout
            this.applyResponsiveLayout();
            
            // Optimize performance for mobile devices
            this.optimizePerformanceForDevice();
            
            this.isInitialized = true;
            console.log('Responsive Layout Manager initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Responsive Layout Manager:', error);
            throw error;
        }
    }

    /**
     * Detect device capabilities and characteristics
     * @private
     */
    detectDeviceCapabilities() {
        // Detect touch support
        this.isTouch = 'ontouchstart' in window || 
                      navigator.maxTouchPoints > 0 || 
                      navigator.msMaxTouchPoints > 0;
        
        // Detect mobile device
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Detect tablet (larger touch devices)
        this.isTablet = this.isTouch && window.innerWidth >= this.breakpoints.md;
        
        // Detect device pixel ratio for high-DPI displays
        this.devicePixelRatio = window.devicePixelRatio || 1;
        
        // Detect network connection type (if available)
        if ('connection' in navigator) {
            this.connectionType = navigator.connection.effectiveType;
            this.isSlowConnection = ['slow-2g', '2g', '3g'].includes(this.connectionType);
        }
        
        // Detect reduced motion preference
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        console.log('Device capabilities detected:', {
            isTouch: this.isTouch,
            isMobile: this.isMobile,
            isTablet: this.isTablet,
            devicePixelRatio: this.devicePixelRatio,
            connectionType: this.connectionType,
            prefersReducedMotion: this.prefersReducedMotion
        });
    }

    /**
     * Setup responsive CSS classes
     * @private
     */
    setupResponsiveClasses() {
        if (!this.container) return;
        
        // Add device type classes
        this.container.classList.toggle('is-touch', this.isTouch);
        this.container.classList.toggle('is-mobile', this.isMobile);
        this.container.classList.toggle('is-tablet', this.isTablet);
        this.container.classList.toggle('prefers-reduced-motion', this.prefersReducedMotion);
        
        // Add high-DPI class
        if (this.devicePixelRatio > 1) {
            this.container.classList.add('high-dpi');
        }
        
        // Add connection type class
        if (this.connectionType) {
            this.container.classList.add(`connection-${this.connectionType}`);
        }
    }

    /**
     * Setup event listeners for responsive behavior
     * @private
     */
    setupEventListeners() {
        // Resize listener with debouncing
        window.addEventListener('resize', this.debounce(this.handleResize, 250));
        
        // Orientation change listener
        window.addEventListener('orientationchange', this.handleOrientationChange);
        
        // Touch event listeners for mobile interactions
        if (this.isTouch && this.container) {
            this.container.addEventListener('touchstart', this.handleTouchStart, { passive: false });
            this.container.addEventListener('touchmove', this.handleTouchMove, { passive: false });
            this.container.addEventListener('touchend', this.handleTouchEnd, { passive: false });
        }
        
        // Media query listeners for breakpoint changes
        Object.entries(this.breakpoints).forEach(([, width]) => {
            if (width > 0) {
                const mediaQuery = window.matchMedia(`(min-width: ${width}px)`);
                mediaQuery.addEventListener('change', () => this.handleBreakpointChange());
            }
        });
        
        // Network connection change listener
        if ('connection' in navigator) {
            navigator.connection.addEventListener('change', () => {
                this.connectionType = navigator.connection.effectiveType;
                this.isSlowConnection = ['slow-2g', '2g', '3g'].includes(this.connectionType);
                this.optimizePerformanceForDevice();
            });
        }
    }

    /**
     * Initialize layout configurations for different screen sizes
     * @private
     */
    initializeLayoutConfigs() {
        // Mobile layout (xs, sm)
        this.layoutConfigs.set('mobile', {
            columns: 1,
            maxWidgetsPerRow: 1,
            widgetSpacing: 8,
            containerPadding: 12,
            priorityWidgets: ['financial-health', 'cash-balance', 'member-growth'],
            hiddenWidgets: ['detailed-analytics', 'complex-charts'],
            chartHeight: 200,
            enableAnimations: false,
            enableShadows: false
        });
        
        // Tablet layout (md)
        this.layoutConfigs.set('tablet', {
            columns: 2,
            maxWidgetsPerRow: 2,
            widgetSpacing: 12,
            containerPadding: 16,
            priorityWidgets: ['financial-health', 'cash-balance', 'member-growth', 'transaction-volume'],
            hiddenWidgets: [],
            chartHeight: 250,
            enableAnimations: true,
            enableShadows: true
        });
        
        // Desktop layout (lg, xl, xxl)
        this.layoutConfigs.set('desktop', {
            columns: 12,
            maxWidgetsPerRow: 4,
            widgetSpacing: 16,
            containerPadding: 24,
            priorityWidgets: [],
            hiddenWidgets: [],
            chartHeight: 300,
            enableAnimations: true,
            enableShadows: true
        });
    }

    /**
     * Get current breakpoint based on window width
     * @returns {string} Current breakpoint name
     */
    getCurrentBreakpoint() {
        const width = window.innerWidth;
        
        if (width >= this.breakpoints.xxl) return 'xxl';
        if (width >= this.breakpoints.xl) return 'xl';
        if (width >= this.breakpoints.lg) return 'lg';
        if (width >= this.breakpoints.md) return 'md';
        if (width >= this.breakpoints.sm) return 'sm';
        return 'xs';
    }

    /**
     * Get layout configuration for current screen size
     * @returns {Object} Layout configuration
     */
    getCurrentLayoutConfig() {
        const breakpoint = this.getCurrentBreakpoint();
        
        if (['xs', 'sm'].includes(breakpoint)) {
            return this.layoutConfigs.get('mobile');
        } else if (breakpoint === 'md') {
            return this.layoutConfigs.get('tablet');
        } else {
            return this.layoutConfigs.get('desktop');
        }
    }

    /**
     * Apply responsive layout based on current screen size
     */
    applyResponsiveLayout() {
        const newBreakpoint = this.getCurrentBreakpoint();
        
        // Only apply if breakpoint changed
        if (newBreakpoint === this.currentBreakpoint) {
            return;
        }
        
        console.log(`Applying responsive layout for breakpoint: ${newBreakpoint}`);
        
        this.currentBreakpoint = newBreakpoint;
        const layoutConfig = this.getCurrentLayoutConfig();
        
        // Update container classes
        this.updateContainerClasses(newBreakpoint);
        
        // Apply layout configuration
        this.applyLayoutConfig(layoutConfig);
        
        // Rearrange widgets for current layout
        this.rearrangeWidgetsForLayout(layoutConfig);
        
        // Update touch targets for mobile
        if (['xs', 'sm'].includes(newBreakpoint)) {
            this.optimizeTouchTargets();
        }
        
        // Emit layout change event
        this.emit('layoutChanged', {
            breakpoint: newBreakpoint,
            config: layoutConfig,
            isMobile: ['xs', 'sm'].includes(newBreakpoint),
            isTablet: newBreakpoint === 'md'
        });
    }

    /**
     * Update container CSS classes for current breakpoint
     * @param {string} breakpoint - Current breakpoint
     * @private
     */
    updateContainerClasses(breakpoint) {
        if (!this.container) return;
        
        // Remove old breakpoint classes
        Object.keys(this.breakpoints).forEach(bp => {
            this.container.classList.remove(`breakpoint-${bp}`);
        });
        
        // Add current breakpoint class
        this.container.classList.add(`breakpoint-${breakpoint}`);
        
        // Add layout type classes
        this.container.classList.toggle('layout-mobile', ['xs', 'sm'].includes(breakpoint));
        this.container.classList.toggle('layout-tablet', breakpoint === 'md');
        this.container.classList.toggle('layout-desktop', ['lg', 'xl', 'xxl'].includes(breakpoint));
    }

    /**
     * Apply layout configuration to container
     * @param {Object} config - Layout configuration
     * @private
     */
    applyLayoutConfig(config) {
        if (!this.container) return;
        
        // Apply CSS custom properties for layout
        this.container.style.setProperty('--widget-spacing', `${config.widgetSpacing}px`);
        this.container.style.setProperty('--container-padding', `${config.containerPadding}px`);
        this.container.style.setProperty('--chart-height', `${config.chartHeight}px`);
        this.container.style.setProperty('--grid-columns', config.columns);
        
        // Apply performance optimizations
        this.container.classList.toggle('disable-animations', !config.enableAnimations);
        this.container.classList.toggle('disable-shadows', !config.enableShadows);
    }

    /**
     * Rearrange widgets based on layout configuration
     * @param {Object} config - Layout configuration
     * @private
     */
    rearrangeWidgetsForLayout(config) {
        const widgets = this.dashboardController.widgets;
        if (!widgets || widgets.size === 0) return;
        
        // Get priority widgets for mobile layout
        const priorityWidgets = config.priorityWidgets || [];
        const hiddenWidgets = config.hiddenWidgets || [];
        
        // Sort widgets by priority for mobile
        const sortedWidgets = Array.from(widgets.entries()).sort(([idA], [idB]) => {
            const priorityA = priorityWidgets.indexOf(idA);
            const priorityB = priorityWidgets.indexOf(idB);
            
            // Priority widgets come first
            if (priorityA !== -1 && priorityB === -1) return -1;
            if (priorityA === -1 && priorityB !== -1) return 1;
            if (priorityA !== -1 && priorityB !== -1) return priorityA - priorityB;
            
            return 0; // Keep original order for non-priority widgets
        });
        
        // Apply widget visibility and positioning
        sortedWidgets.forEach(([widgetId, widget], index) => {
            if (!widget.element) return;
            
            // Hide widgets that should be hidden on current layout
            const shouldHide = hiddenWidgets.includes(widgetId);
            widget.element.style.display = shouldHide ? 'none' : '';
            
            if (!shouldHide) {
                // Apply responsive positioning
                this.applyWidgetResponsiveLayout(widget, config, index);
            }
        });
    }

    /**
     * Apply responsive layout to individual widget
     * @param {Object} widget - Widget instance
     * @param {Object} config - Layout configuration
     * @param {number} index - Widget index in layout
     * @private
     */
    applyWidgetResponsiveLayout(widget, config, index) {
        if (!widget.element) return;
        
        const element = widget.element;
        
        // Calculate grid position based on layout
        const column = index % config.maxWidgetsPerRow;
        const row = Math.floor(index / config.maxWidgetsPerRow);
        
        // Apply CSS Grid positioning
        element.style.gridColumn = config.columns === 1 ? '1' : `${column + 1}`;
        element.style.gridRow = `${row + 1}`;
        
        // Apply responsive sizing
        if (config.columns === 1) {
            // Mobile: full width
            element.style.width = '100%';
        } else if (config.columns === 2) {
            // Tablet: half width
            element.style.width = 'calc(50% - var(--widget-spacing) / 2)';
        } else {
            // Desktop: use original widget configuration
            const originalConfig = widget.config;
            if (originalConfig && originalConfig.size) {
                const widthPercent = (originalConfig.size.width / 12) * 100;
                element.style.width = `${widthPercent}%`;
            }
        }
        
        // Apply responsive height
        if (widget.type === 'chart') {
            element.style.height = `${config.chartHeight}px`;
        }
        
        // Add responsive classes
        element.classList.add('responsive-widget');
        element.classList.toggle('mobile-widget', config.columns === 1);
        element.classList.toggle('tablet-widget', config.columns === 2);
    }

    /**
     * Optimize touch targets for mobile devices
     * @private
     */
    optimizeTouchTargets() {
        if (!this.container) return;
        
        const touchElements = this.container.querySelectorAll('button, .btn, .clickable, .touch-target');
        
        touchElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            
            // Ensure minimum touch target size
            if (rect.width < this.touchSettings.minTouchTarget || 
                rect.height < this.touchSettings.minTouchTarget) {
                
                element.style.minWidth = `${this.touchSettings.minTouchTarget}px`;
                element.style.minHeight = `${this.touchSettings.minTouchTarget}px`;
                element.classList.add('touch-optimized');
            }
        });
    }

    /**
     * Optimize performance based on device capabilities
     * @private
     */
    optimizePerformanceForDevice() {
        const isMobileLayout = ['xs', 'sm'].includes(this.currentBreakpoint);
        
        // Disable expensive visual effects on mobile or slow connections
        if (isMobileLayout || this.isSlowConnection || this.prefersReducedMotion) {
            this.performanceSettings.enableAnimations = false;
            this.performanceSettings.enableTransitions = !this.prefersReducedMotion;
            this.performanceSettings.enableShadows = !this.isSlowConnection;
            this.performanceSettings.enableGradients = !this.isSlowConnection;
        } else {
            this.performanceSettings.enableAnimations = true;
            this.performanceSettings.enableTransitions = true;
            this.performanceSettings.enableShadows = true;
            this.performanceSettings.enableGradients = true;
        }
        
        // Apply performance settings to container
        if (this.container) {
            this.container.classList.toggle('performance-mode', isMobileLayout || this.isSlowConnection);
            this.container.classList.toggle('disable-animations', !this.performanceSettings.enableAnimations);
            this.container.classList.toggle('disable-transitions', !this.performanceSettings.enableTransitions);
            this.container.classList.toggle('disable-shadows', !this.performanceSettings.enableShadows);
            this.container.classList.toggle('disable-gradients', !this.performanceSettings.enableGradients);
        }
        
        console.log('Performance optimized for device:', this.performanceSettings);
    }

    /**
     * Handle window resize events
     * @private
     */
    handleResize() {
        this.applyResponsiveLayout();
        
        // Notify widgets about resize
        if (this.dashboardController.widgets) {
            this.dashboardController.widgets.forEach(widget => {
                if (widget && typeof widget.handleResize === 'function') {
                    widget.handleResize();
                }
            });
        }
    }

    /**
     * Handle orientation change events
     * @private
     */
    handleOrientationChange() {
        // Wait for orientation change to complete
        setTimeout(() => {
            this.detectDeviceCapabilities();
            this.applyResponsiveLayout();
            
            // Emit orientation change event
            this.emit('orientationChanged', {
                orientation: screen.orientation ? screen.orientation.angle : 0,
                width: window.innerWidth,
                height: window.innerHeight
            });
        }, 100);
    }

    /**
     * Handle breakpoint change events
     * @private
     */
    handleBreakpointChange() {
        this.applyResponsiveLayout();
    }

    /**
     * Handle touch start events
     * @param {TouchEvent} event - Touch event
     * @private
     */
    handleTouchStart(event) {
        this.touchStartTime = Date.now();
        this.touchStartPosition = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
        };
        
        // Add touch feedback
        const target = event.target.closest('.widget, .btn, .clickable');
        if (target) {
            target.classList.add('touch-active');
        }
    }

    /**
     * Handle touch move events
     * @param {TouchEvent} event - Touch event
     * @private
     */
    handleTouchMove(event) {
        if (!this.touchStartPosition) return;
        
        const currentPosition = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
        };
        
        const deltaX = currentPosition.x - this.touchStartPosition.x;
        const deltaY = currentPosition.y - this.touchStartPosition.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Remove touch feedback if moved too far
        if (distance > this.touchSettings.swipeThreshold) {
            const activeElements = this.container.querySelectorAll('.touch-active');
            activeElements.forEach(element => {
                element.classList.remove('touch-active');
            });
        }
    }

    /**
     * Handle touch end events
     * @param {TouchEvent} event - Touch event
     * @private
     */
    handleTouchEnd(event) {
        const touchDuration = Date.now() - this.touchStartTime;
        
        // Remove touch feedback
        const activeElements = this.container.querySelectorAll('.touch-active');
        activeElements.forEach(element => {
            element.classList.remove('touch-active');
        });
        
        // Handle tap gesture
        if (touchDuration < this.touchSettings.tapTimeout) {
            this.handleTapGesture(event);
        }
        
        this.touchStartTime = null;
        this.touchStartPosition = null;
    }

    /**
     * Handle tap gesture
     * @param {TouchEvent} event - Touch event
     * @private
     */
    handleTapGesture(event) {
        const target = event.target.closest('.widget, .btn, .clickable');
        if (!target) return;
        
        // Emit tap event
        this.emit('tap', {
            target: target,
            position: this.touchStartPosition
        });
    }

    /**
     * Get mobile-optimized widget layout for role
     * @param {string} role - User role
     * @returns {Array} Mobile widget layout
     */
    getMobileLayoutForRole(role) {
        const baseLayouts = {
            admin: [
                { id: 'financial-health', priority: 1 },
                { id: 'cash-balance', priority: 2 },
                { id: 'member-growth', priority: 3 },
                { id: 'transaction-volume', priority: 4 }
            ],
            treasurer: [
                { id: 'cash-balance', priority: 1 },
                { id: 'savings-total', priority: 2 },
                { id: 'loans-outstanding', priority: 3 },
                { id: 'financial-ratios', priority: 4 }
            ],
            supervisor: [
                { id: 'member-activity-heatmap', priority: 1 },
                { id: 'top-members', priority: 2 },
                { id: 'engagement-trends', priority: 3 }
            ]
        };
        
        return baseLayouts[role] || baseLayouts.admin;
    }

    /**
     * Debounce function to limit event handler calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     * @private
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Emit custom event
     * @param {string} eventName - Event name
     * @param {any} data - Event data
     * @private
     */
    emit(eventName, data) {
        const event = new CustomEvent(`responsive:${eventName}`, {
            detail: data
        });
        document.dispatchEvent(event);
    }

    /**
     * Get current responsive state
     * @returns {Object} Current responsive state
     */
    getResponsiveState() {
        return {
            breakpoint: this.currentBreakpoint,
            isMobile: ['xs', 'sm'].includes(this.currentBreakpoint),
            isTablet: this.currentBreakpoint === 'md',
            isDesktop: ['lg', 'xl', 'xxl'].includes(this.currentBreakpoint),
            isTouch: this.isTouch,
            layoutConfig: this.getCurrentLayoutConfig(),
            performanceSettings: { ...this.performanceSettings }
        };
    }

    /**
     * Destroy responsive layout manager and cleanup
     */
    destroy() {
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('orientationchange', this.handleOrientationChange);
        
        if (this.container) {
            this.container.removeEventListener('touchstart', this.handleTouchStart);
            this.container.removeEventListener('touchmove', this.handleTouchMove);
            this.container.removeEventListener('touchend', this.handleTouchEnd);
        }
        
        this.isInitialized = false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ResponsiveLayoutManager };
} else {
    window.ResponsiveLayoutManager = ResponsiveLayoutManager;
}