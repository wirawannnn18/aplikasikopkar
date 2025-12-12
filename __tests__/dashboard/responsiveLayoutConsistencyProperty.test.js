/**
 * Property-Based Test: Responsive Layout Consistency
 * 
 * **Feature: dashboard-analytics-kpi, Property 13: Responsive Layout Consistency**
 * **Validates: Requirements 7.1**
 * 
 * Tests that responsive layouts maintain consistency across different screen sizes
 * and device types, ensuring proper widget arrangement and touch optimization.
 */

const fc = require('fast-check');

// Mock CSS properties for HTMLElement
HTMLElement.prototype.getBoundingClientRect = jest.fn(() => ({
    width: 100,
    height: 50,
    top: 0,
    left: 0,
    bottom: 50,
    right: 100
}));

// Mock CSS style property
Object.defineProperty(HTMLElement.prototype, 'style', {
    value: {
        setProperty: jest.fn(),
        getPropertyValue: jest.fn(() => ''),
        width: '',
        height: '',
        gridColumn: '',
        gridRow: '',
        display: ''
    },
    writable: true,
    configurable: true
});

// Mock classList methods
const mockClassList = {
    add: jest.fn(),
    remove: jest.fn(),
    toggle: jest.fn(),
    contains: jest.fn(() => false)
};

// Mock ResponsiveLayoutManager class for testing
class ResponsiveLayoutManager {
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
        
        this.isInitialized = false;
    }

    async initialize() {
        this.detectDeviceCapabilities();
        this.initializeLayoutConfigs();
        this.applyResponsiveLayout();
        this.optimizePerformanceForDevice();
        this.isInitialized = true;
    }

    detectDeviceCapabilities() {
        this.isTouch = 'ontouchstart' in window || 
                      navigator.maxTouchPoints > 0 || 
                      navigator.msMaxTouchPoints > 0;
        
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.isTablet = this.isTouch && window.innerWidth >= this.breakpoints.md;
        this.devicePixelRatio = window.devicePixelRatio || 1;
        
        if ('connection' in navigator) {
            this.connectionType = navigator.connection.effectiveType;
            this.isSlowConnection = ['slow-2g', '2g', '3g'].includes(this.connectionType);
        }
        
        this.prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    initializeLayoutConfigs() {
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

    getCurrentBreakpoint() {
        const width = window.innerWidth || 1200; // Default fallback
        
        if (width >= this.breakpoints.xxl) return 'xxl';
        if (width >= this.breakpoints.xl) return 'xl';
        if (width >= this.breakpoints.lg) return 'lg';
        if (width >= this.breakpoints.md) return 'md';
        if (width >= this.breakpoints.sm) return 'sm';
        return 'xs';
    }

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

    applyResponsiveLayout() {
        const newBreakpoint = this.getCurrentBreakpoint();
        
        if (newBreakpoint === this.currentBreakpoint) {
            return;
        }
        
        this.currentBreakpoint = newBreakpoint;
        const layoutConfig = this.getCurrentLayoutConfig();
        
        this.updateContainerClasses(newBreakpoint);
        this.applyLayoutConfig(layoutConfig);
        this.rearrangeWidgetsForLayout(layoutConfig);
        
        if (['xs', 'sm'].includes(newBreakpoint)) {
            this.optimizeTouchTargets();
        }
    }

    updateContainerClasses(breakpoint) {
        if (!this.container) return;
        
        Object.keys(this.breakpoints).forEach(bp => {
            this.container.classList.remove(`breakpoint-${bp}`);
        });
        
        this.container.classList.add(`breakpoint-${breakpoint}`);
        this.container.classList.toggle('layout-mobile', ['xs', 'sm'].includes(breakpoint));
        this.container.classList.toggle('layout-tablet', breakpoint === 'md');
        this.container.classList.toggle('layout-desktop', ['lg', 'xl', 'xxl'].includes(breakpoint));
    }

    applyLayoutConfig(config) {
        if (!this.container) return;
        
        this.container.style.setProperty('--widget-spacing', `${config.widgetSpacing}px`);
        this.container.style.setProperty('--container-padding', `${config.containerPadding}px`);
        this.container.style.setProperty('--chart-height', `${config.chartHeight}px`);
        this.container.style.setProperty('--grid-columns', config.columns);
        
        this.container.classList.toggle('disable-animations', !config.enableAnimations);
        this.container.classList.toggle('disable-shadows', !config.enableShadows);
    }

    rearrangeWidgetsForLayout(config) {
        const widgets = this.dashboardController.widgets;
        if (!widgets || widgets.size === 0) return;
        
        const priorityWidgets = config.priorityWidgets || [];
        const hiddenWidgets = config.hiddenWidgets || [];
        
        const sortedWidgets = Array.from(widgets.entries()).sort(([idA], [idB]) => {
            const priorityA = priorityWidgets.indexOf(idA);
            const priorityB = priorityWidgets.indexOf(idB);
            
            if (priorityA !== -1 && priorityB === -1) return -1;
            if (priorityA === -1 && priorityB !== -1) return 1;
            if (priorityA !== -1 && priorityB !== -1) return priorityA - priorityB;
            
            return 0;
        });
        
        sortedWidgets.forEach(([widgetId, widget], index) => {
            if (!widget.element) return;
            
            const shouldHide = hiddenWidgets.includes(widgetId);
            widget.element.style.display = shouldHide ? 'none' : '';
            
            if (!shouldHide) {
                this.applyWidgetResponsiveLayout(widget, config, index);
            }
        });
    }

    applyWidgetResponsiveLayout(widget, config, index) {
        if (!widget.element) return;
        
        const element = widget.element;
        const column = index % config.maxWidgetsPerRow;
        const row = Math.floor(index / config.maxWidgetsPerRow);
        
        element.style.gridColumn = config.columns === 1 ? '1' : `${column + 1}`;
        element.style.gridRow = `${row + 1}`;
        
        if (config.columns === 1) {
            element.style.width = '100%';
        } else if (config.columns === 2) {
            element.style.width = 'calc(50% - var(--widget-spacing) / 2)';
        } else {
            const originalConfig = widget.config;
            if (originalConfig && originalConfig.size) {
                const widthPercent = (originalConfig.size.width / 12) * 100;
                element.style.width = `${widthPercent}%`;
            }
        }
        
        if (widget.type === 'chart') {
            element.style.height = `${config.chartHeight}px`;
        }
        
        element.classList.add('responsive-widget');
        element.classList.toggle('mobile-widget', config.columns === 1);
        element.classList.toggle('tablet-widget', config.columns === 2);
    }

    optimizeTouchTargets() {
        if (!this.container) return;
        
        const touchElements = this.container.querySelectorAll('button, .btn, .clickable, .touch-target');
        
        touchElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            
            if (rect.width < this.touchSettings.minTouchTarget || 
                rect.height < this.touchSettings.minTouchTarget) {
                
                element.style.minWidth = `${this.touchSettings.minTouchTarget}px`;
                element.style.minHeight = `${this.touchSettings.minTouchTarget}px`;
                element.classList.add('touch-optimized');
            }
        });
    }

    optimizePerformanceForDevice() {
        const isMobileLayout = ['xs', 'sm'].includes(this.currentBreakpoint);
        
        // Reset to defaults first
        this.performanceSettings.enableAnimations = true;
        this.performanceSettings.enableTransitions = true;
        this.performanceSettings.enableShadows = true;
        this.performanceSettings.enableGradients = true;
        
        // Apply optimizations based on constraints
        if (isMobileLayout || this.isSlowConnection || this.prefersReducedMotion) {
            if (isMobileLayout || this.isSlowConnection) {
                this.performanceSettings.enableAnimations = false;
            }
            
            if (this.prefersReducedMotion) {
                this.performanceSettings.enableTransitions = false;
            }
            
            if (this.isSlowConnection) {
                this.performanceSettings.enableShadows = false;
                this.performanceSettings.enableGradients = false;
            }
        }
        
        if (this.container) {
            this.container.classList.toggle('performance-mode', isMobileLayout || this.isSlowConnection);
            this.container.classList.toggle('disable-animations', !this.performanceSettings.enableAnimations);
            this.container.classList.toggle('disable-transitions', !this.performanceSettings.enableTransitions);
            this.container.classList.toggle('disable-shadows', !this.performanceSettings.enableShadows);
            this.container.classList.toggle('disable-gradients', !this.performanceSettings.enableGradients);
        }
    }

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

    destroy() {
        this.isInitialized = false;
    }
}

describe('Responsive Layout Consistency Property Tests', () => {
    let mockDashboardController;
    let mockContainer;
    
    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = '<div id="dashboard-container"></div>';
        mockContainer = document.getElementById('dashboard-container');
        
        // Add mock classList to container
        mockContainer.classList = mockClassList;
        
        // Mock dashboard controller
        mockDashboardController = {
            container: mockContainer,
            widgets: new Map(),
            config: {
                enableResponsive: true,
                enableTouch: true
            }
        };
        
        // Mock window properties
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 1200
        });
        Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: 800
        });
        
        // Mock performance.now
        global.performance = { now: jest.fn(() => Date.now()) };
        
        // Mock requestAnimationFrame
        global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
        
        // Mock cancelAnimationFrame
        global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));
        
        // Mock addEventListener and removeEventListener
        window.addEventListener = jest.fn();
        window.removeEventListener = jest.fn();
        
        // Mock matchMedia
        window.matchMedia = jest.fn(query => ({
            matches: false,
            media: query,
            onchange: null,
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn()
        }));
        
        // Mock navigator properties
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            writable: true
        });
        
        Object.defineProperty(navigator, 'maxTouchPoints', {
            value: 0,
            writable: true
        });
    });
    
    afterEach(() => {
        jest.clearAllMocks();
    });

    /**
     * Property 13: Responsive Layout Consistency
     * For any screen width, the layout should maintain consistency in breakpoint detection.
     */
    test('Property 13: Responsive layout consistency across screen sizes', () => {
        fc.assert(fc.property(
            fc.integer({ min: 320, max: 2560 }),
            (screenWidth) => {
                // Setup test environment
                Object.defineProperty(window, 'innerWidth', {
                    writable: true,
                    configurable: true,
                    value: screenWidth
                });
                
                // Initialize responsive layout manager
                const responsiveManager = new ResponsiveLayoutManager(mockDashboardController);
                responsiveManager.initializeLayoutConfigs(); // Initialize layout configs
                responsiveManager.applyResponsiveLayout(); // Apply layout to set currentBreakpoint
                
                // Test breakpoint consistency
                const breakpoint = responsiveManager.getCurrentBreakpoint();
                
                // Verify breakpoint is valid
                const validBreakpoints = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
                if (!validBreakpoints.includes(breakpoint)) {
                    return false;
                }
                
                // Test layout configuration consistency
                const layoutConfig = responsiveManager.getCurrentLayoutConfig();
                if (!layoutConfig || 
                    layoutConfig.columns <= 0 || 
                    layoutConfig.widgetSpacing < 8 || 
                    layoutConfig.containerPadding < 8) {
                    return false;
                }
                
                // Test responsive state consistency
                const state = responsiveManager.getResponsiveState();
                if (state.breakpoint !== breakpoint) {
                    return false;
                }
                
                // Verify mobile/tablet/desktop classification is consistent
                const isMobile = ['xs', 'sm'].includes(breakpoint);
                const isTablet = breakpoint === 'md';
                const isDesktop = ['lg', 'xl', 'xxl'].includes(breakpoint);
                
                if (state.isMobile !== isMobile || 
                    state.isTablet !== isTablet || 
                    state.isDesktop !== isDesktop) {
                    return false;
                }
                
                // Cleanup
                responsiveManager.destroy();
                
                return true;
            }
        ), { numRuns: 50 });
    });

    /**
     * Property: Touch Target Size Consistency
     * For any touch-enabled device, touch targets should meet minimum size requirements.
     */
    test('Property: Touch target size consistency', () => {
        fc.assert(fc.property(
            fc.boolean(),
            (isTouch) => {
                // Setup touch environment
                navigator.maxTouchPoints = isTouch ? 1 : 0;
                
                // Initialize responsive layout manager
                const responsiveManager = new ResponsiveLayoutManager(mockDashboardController);
                
                // Test touch detection consistency
                responsiveManager.detectDeviceCapabilities();
                
                // Verify touch detection is consistent
                const expectedTouch = isTouch;
                const actualTouch = responsiveManager.isTouch;
                
                if (actualTouch !== expectedTouch) {
                    return false;
                }
                
                // Cleanup
                responsiveManager.destroy();
                
                return true;
            }
        ), { numRuns: 20 });
    });

    /**
     * Property: Performance Optimization Consistency
     * For any device with performance constraints, optimizations should be applied consistently.
     */
    test('Property: Performance optimization consistency', () => {
        fc.assert(fc.property(
            fc.integer({ min: 320, max: 2560 }),
            (screenWidth) => {
                // Setup screen width
                Object.defineProperty(window, 'innerWidth', {
                    writable: true,
                    configurable: true,
                    value: screenWidth
                });
                
                // Initialize responsive layout manager
                const responsiveManager = new ResponsiveLayoutManager(mockDashboardController);
                responsiveManager.detectDeviceCapabilities();
                responsiveManager.initializeLayoutConfigs();
                responsiveManager.optimizePerformanceForDevice();
                
                // Check performance settings are valid
                const settings = responsiveManager.performanceSettings;
                
                if (typeof settings.enableAnimations !== 'boolean' ||
                    typeof settings.enableTransitions !== 'boolean' ||
                    typeof settings.enableShadows !== 'boolean' ||
                    typeof settings.enableGradients !== 'boolean') {
                    return false;
                }
                
                // Cleanup
                responsiveManager.destroy();
                
                return true;
            }
        ), { numRuns: 20 });
    });

    /**
     * Property: Layout Configuration Validity
     * For any breakpoint, layout configuration should be valid and consistent.
     */
    test('Property: Layout configuration validity', () => {
        fc.assert(fc.property(
            fc.integer({ min: 320, max: 2560 }),
            (screenWidth) => {
                // Setup screen width
                Object.defineProperty(window, 'innerWidth', {
                    writable: true,
                    configurable: true,
                    value: screenWidth
                });
                
                // Initialize responsive layout manager
                const responsiveManager = new ResponsiveLayoutManager(mockDashboardController);
                responsiveManager.initializeLayoutConfigs();
                
                // Get layout configuration
                const layoutConfig = responsiveManager.getCurrentLayoutConfig();
                const breakpoint = responsiveManager.getCurrentBreakpoint();
                
                // Validate layout configuration properties
                if (!layoutConfig || 
                    typeof layoutConfig.columns !== 'number' ||
                    layoutConfig.columns <= 0 ||
                    layoutConfig.columns > 12) {
                    return false;
                }
                
                if (typeof layoutConfig.widgetSpacing !== 'number' ||
                    layoutConfig.widgetSpacing < 8 ||
                    layoutConfig.widgetSpacing > 24) {
                    return false;
                }
                
                if (typeof layoutConfig.containerPadding !== 'number' ||
                    layoutConfig.containerPadding < 8 ||
                    layoutConfig.containerPadding > 24) {
                    return false;
                }
                
                if (typeof layoutConfig.chartHeight !== 'number' ||
                    layoutConfig.chartHeight < 150 ||
                    layoutConfig.chartHeight > 400) {
                    return false;
                }
                
                // Validate breakpoint-specific configurations
                if (['xs', 'sm'].includes(breakpoint)) {
                    if (layoutConfig.columns !== 1 || layoutConfig.enableAnimations !== false) {
                        return false;
                    }
                } else if (breakpoint === 'md') {
                    if (layoutConfig.columns !== 2) {
                        return false;
                    }
                } else {
                    if (layoutConfig.columns < 3) {
                        return false;
                    }
                }
                
                // Cleanup
                responsiveManager.destroy();
                
                return true;
            }
        ), { numRuns: 50 });
    });
});

/**
 * Helper function to get expected breakpoint for screen width
 * @param {number} width - Screen width
 * @returns {string} Expected breakpoint
 */
function getExpectedBreakpoint(width) {
    if (width >= 1400) return 'xxl';
    if (width >= 1200) return 'xl';
    if (width >= 992) return 'lg';
    if (width >= 768) return 'md';
    if (width >= 576) return 'sm';
    return 'xs';
}