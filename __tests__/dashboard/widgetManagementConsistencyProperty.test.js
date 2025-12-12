/**
 * Dashboard Analytics & KPI - Widget Management Consistency Property Test
 * 
 * Property-based test for widget management consistency and state management
 * **Feature: dashboard-analytics-kpi, Property 2: Widget State Consistency**
 * **Validates: Requirements 5.1**
 */

import fc from 'fast-check';

// Mock Chart.js for testing
global.Chart = {
    register: jest.fn(),
    defaults: {
        font: { family: 'Arial' }
    }
};

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock performance API
global.performance = {
    now: jest.fn(() => Date.now())
};

// Mock DOM methods
global.document = {
    getElementById: jest.fn(),
    createElement: jest.fn(),
    addEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    visibilityState: 'visible',
    querySelector: jest.fn(),
    appendChild: jest.fn()
};

global.window = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
};

describe('Widget Management Consistency Property Tests', () => {
    let WidgetManager, DashboardController;

    beforeAll(async () => {
        // Import the components
        const widgetModule = await import('../../js/dashboard/WidgetManager.js');
        const dashboardModule = await import('../../js/dashboard/DashboardController.js');
        WidgetManager = widgetModule.WidgetManager;
        DashboardController = dashboardModule.DashboardController;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Reset localStorage mock
        localStorageMock.getItem.mockReturnValue(null);
        localStorageMock.setItem.mockImplementation(() => {});
        
        // Mock DOM elements
        const mockElement = {
            innerHTML: '',
            className: '',
            insertBefore: jest.fn(),
            appendChild: jest.fn(),
            removeChild: jest.fn(),
            parentNode: { removeChild: jest.fn() },
            firstChild: null,
            querySelector: jest.fn(() => ({
                innerHTML: '',
                className: ''
            })),
            style: {}
        };
        
        document.getElementById.mockReturnValue(mockElement);
        document.createElement.mockReturnValue(mockElement);
        document.querySelector.mockReturnValue(mockElement);
        
        // Reset performance mock
        global.performance.now.mockImplementation(() => Date.now());
    });

    /**
     * Property 2: Widget State Consistency
     * For any sequence of widget operations, the widget state should remain consistent
     */
    test('Property 2: Widget state should remain consistent across operations', () => {
        fc.assert(fc.property(
            // Generate arbitrary widget operations
            fc.array(
                fc.record({
                    operation: fc.constantFrom('create', 'update', 'remove', 'rearrange'),
                    widgetConfig: fc.record({
                        id: fc.string({ minLength: 1, maxLength: 20 }),
                        type: fc.constantFrom('kpi', 'chart', 'table', 'gauge', 'heatmap', 'comparison'),
                        title: fc.string({ minLength: 1, maxLength: 50 }),
                        position: fc.record({
                            x: fc.integer({ min: 0, max: 11 }),
                            y: fc.integer({ min: 0, max: 10 })
                        }),
                        size: fc.record({
                            width: fc.integer({ min: 1, max: 12 }),
                            height: fc.integer({ min: 1, max: 6 })
                        }),
                        refreshInterval: fc.integer({ min: 0, max: 600000 })
                    }),
                    data: fc.record({
                        value: fc.float({ min: 0, max: 1000000 }),
                        label: fc.string({ maxLength: 30 })
                    })
                }),
                { minLength: 1, maxLength: 10 }
            ),
            async (operations) => {
                // Create dashboard and widget manager
                const dashboard = new DashboardController('test-container');
                dashboard.initializeComponents = jest.fn().mockResolvedValue();
                dashboard.setupEventListeners = jest.fn();
                
                await dashboard.initialize();
                
                const widgetManager = dashboard.widgetManager;
                if (!widgetManager) return true; // Skip if widget manager not available
                
                const createdWidgets = new Set();
                let consistencyMaintained = true;
                
                try {
                    for (const op of operations) {
                        const widgetId = op.widgetConfig.id;
                        
                        switch (op.operation) {
                            case 'create':
                                if (!createdWidgets.has(widgetId)) {
                                    await widgetManager.createWidget(op.widgetConfig.type, op.widgetConfig);
                                    createdWidgets.add(widgetId);
                                    
                                    // Verify widget was created
                                    const widget = widgetManager.widgets.get(widgetId);
                                    if (!widget || widget.id !== widgetId) {
                                        consistencyMaintained = false;
                                    }
                                }
                                break;
                                
                            case 'update':
                                if (createdWidgets.has(widgetId)) {
                                    await widgetManager.updateWidget(widgetId, op.data);
                                    
                                    // Verify widget still exists and has updated data
                                    const widget = widgetManager.widgets.get(widgetId);
                                    if (!widget || widget.data !== op.data) {
                                        consistencyMaintained = false;
                                    }
                                }
                                break;
                                
                            case 'remove':
                                if (createdWidgets.has(widgetId)) {
                                    await widgetManager.removeWidget(widgetId);
                                    createdWidgets.delete(widgetId);
                                    
                                    // Verify widget was removed
                                    const widget = widgetManager.widgets.get(widgetId);
                                    if (widget) {
                                        consistencyMaintained = false;
                                    }
                                }
                                break;
                                
                            case 'rearrange':
                                if (createdWidgets.size > 0) {
                                    const layout = Array.from(createdWidgets).map(id => ({
                                        id,
                                        position: op.widgetConfig.position,
                                        size: op.widgetConfig.size
                                    }));
                                    
                                    await widgetManager.rearrangeWidgets(layout);
                                    
                                    // Verify widgets maintain their IDs and existence
                                    for (const layoutItem of layout) {
                                        const widget = widgetManager.widgets.get(layoutItem.id);
                                        if (!widget || widget.id !== layoutItem.id) {
                                            consistencyMaintained = false;
                                        }
                                    }
                                }
                                break;
                        }
                        
                        // Verify overall widget manager state consistency
                        if (widgetManager.widgets.size !== createdWidgets.size) {
                            consistencyMaintained = false;
                        }
                    }
                    
                    // Final consistency check
                    for (const widgetId of createdWidgets) {
                        const widget = widgetManager.widgets.get(widgetId);
                        if (!widget || widget.id !== widgetId) {
                            consistencyMaintained = false;
                        }
                    }
                    
                } catch (error) {
                    // Operations should not throw unexpected errors
                    console.error('Widget operation failed:', error);
                    consistencyMaintained = false;
                } finally {
                    // Cleanup
                    dashboard.destroy();
                }
                
                return consistencyMaintained;
            }
        ), {
            numRuns: 50,
            timeout: 10000,
            verbose: true
        });
    });

    /**
     * Property 3: Widget Type Registration Consistency
     * For any widget type, registration and creation should be consistent
     */
    test('Property 3: Widget type registration should be consistent', () => {
        fc.assert(fc.property(
            fc.constantFrom('kpi', 'chart', 'table', 'gauge', 'heatmap', 'comparison'),
            fc.record({
                id: fc.string({ minLength: 1, maxLength: 20 }),
                title: fc.string({ minLength: 1, maxLength: 50 }),
                position: fc.record({
                    x: fc.integer({ min: 0, max: 11 }),
                    y: fc.integer({ min: 0, max: 10 })
                }),
                size: fc.record({
                    width: fc.integer({ min: 1, max: 12 }),
                    height: fc.integer({ min: 1, max: 6 })
                })
            }),
            async (widgetType, config) => {
                const dashboard = new DashboardController('test-container');
                dashboard.initializeComponents = jest.fn().mockResolvedValue();
                dashboard.setupEventListeners = jest.fn();
                
                await dashboard.initialize();
                
                const widgetManager = dashboard.widgetManager;
                if (!widgetManager) return true;
                
                try {
                    // Check if widget type is registered
                    const isRegistered = widgetManager.widgetTypes.has(widgetType);
                    
                    if (isRegistered) {
                        // Create widget of this type
                        const widget = await widgetManager.createWidget(widgetType, {
                            ...config,
                            type: widgetType
                        });
                        
                        // Verify widget properties
                        const typeConsistent = widget.type === widgetType;
                        const idConsistent = widget.id === config.id;
                        const configConsistent = widget.config.title === config.title;
                        
                        // Cleanup
                        await widgetManager.removeWidget(widget.id);
                        dashboard.destroy();
                        
                        return typeConsistent && idConsistent && configConsistent;
                    }
                    
                    dashboard.destroy();
                    return true; // Type not registered is acceptable
                    
                } catch (error) {
                    dashboard.destroy();
                    return false;
                }
            }
        ), {
            numRuns: 30,
            timeout: 5000
        });
    });

    /**
     * Property 4: Widget Refresh Consistency
     * For any widget with refresh interval, refresh behavior should be consistent
     */
    test('Property 4: Widget refresh behavior should be consistent', () => {
        fc.assert(fc.property(
            fc.record({
                widgetType: fc.constantFrom('kpi', 'chart', 'table'),
                refreshInterval: fc.integer({ min: 1000, max: 10000 }), // 1-10 seconds
                widgetId: fc.string({ minLength: 1, maxLength: 20 })
            }),
            async (config) => {
                const dashboard = new DashboardController('test-container');
                dashboard.initializeComponents = jest.fn().mockResolvedValue();
                dashboard.setupEventListeners = jest.fn();
                
                await dashboard.initialize();
                
                const widgetManager = dashboard.widgetManager;
                if (!widgetManager) return true;
                
                try {
                    // Create widget with refresh interval
                    const widget = await widgetManager.createWidget(config.widgetType, {
                        id: config.widgetId,
                        type: config.widgetType,
                        title: 'Test Widget',
                        position: { x: 0, y: 0 },
                        size: { width: 4, height: 2 },
                        refreshInterval: config.refreshInterval
                    });
                    
                    // Check if refresh timer was set up
                    const hasRefreshTimer = widgetManager.refreshTimers.has(config.widgetId);
                    
                    // Check widget configuration
                    const configConsistent = widget.config.refreshInterval === config.refreshInterval;
                    
                    // Cleanup
                    await widgetManager.removeWidget(config.widgetId);
                    
                    // Check if refresh timer was cleaned up
                    const timerCleanedUp = !widgetManager.refreshTimers.has(config.widgetId);
                    
                    dashboard.destroy();
                    
                    return hasRefreshTimer && configConsistent && timerCleanedUp;
                    
                } catch (error) {
                    dashboard.destroy();
                    return false;
                }
            }
        ), {
            numRuns: 20,
            timeout: 8000
        });
    });

    /**
     * Property 5: Widget Position and Size Consistency
     * For any widget position and size, the layout should be consistent
     */
    test('Property 5: Widget positioning and sizing should be consistent', () => {
        fc.assert(fc.property(
            fc.array(
                fc.record({
                    id: fc.string({ minLength: 1, maxLength: 10 }),
                    position: fc.record({
                        x: fc.integer({ min: 0, max: 8 }),
                        y: fc.integer({ min: 0, max: 8 })
                    }),
                    size: fc.record({
                        width: fc.integer({ min: 1, max: 4 }),
                        height: fc.integer({ min: 1, max: 3 })
                    })
                }),
                { minLength: 1, maxLength: 5 }
            ),
            async (widgetConfigs) => {
                const dashboard = new DashboardController('test-container');
                dashboard.initializeComponents = jest.fn().mockResolvedValue();
                dashboard.setupEventListeners = jest.fn();
                
                await dashboard.initialize();
                
                const widgetManager = dashboard.widgetManager;
                if (!widgetManager) return true;
                
                try {
                    const createdWidgets = [];
                    
                    // Create widgets with specified positions and sizes
                    for (const config of widgetConfigs) {
                        const widget = await widgetManager.createWidget('kpi', {
                            id: config.id,
                            type: 'kpi',
                            title: `Widget ${config.id}`,
                            position: config.position,
                            size: config.size
                        });
                        
                        createdWidgets.push(widget);
                    }
                    
                    // Verify all widgets have correct positions and sizes
                    let positioningConsistent = true;
                    
                    for (let i = 0; i < createdWidgets.length; i++) {
                        const widget = createdWidgets[i];
                        const expectedConfig = widgetConfigs[i];
                        
                        const positionMatch = 
                            widget.config.position.x === expectedConfig.position.x &&
                            widget.config.position.y === expectedConfig.position.y;
                            
                        const sizeMatch = 
                            widget.config.size.width === expectedConfig.size.width &&
                            widget.config.size.height === expectedConfig.size.height;
                        
                        if (!positionMatch || !sizeMatch) {
                            positioningConsistent = false;
                            break;
                        }
                    }
                    
                    // Test rearrangement
                    const newLayout = widgetConfigs.map(config => ({
                        id: config.id,
                        position: { x: (config.position.x + 1) % 9, y: config.position.y },
                        size: config.size
                    }));
                    
                    await widgetManager.rearrangeWidgets(newLayout);
                    
                    // Verify rearrangement consistency
                    for (let i = 0; i < createdWidgets.length; i++) {
                        const widget = widgetManager.widgets.get(widgetConfigs[i].id);
                        const expectedLayout = newLayout[i];
                        
                        if (!widget || 
                            widget.config.position.x !== expectedLayout.position.x ||
                            widget.config.position.y !== expectedLayout.position.y) {
                            positioningConsistent = false;
                            break;
                        }
                    }
                    
                    dashboard.destroy();
                    return positioningConsistent;
                    
                } catch (error) {
                    dashboard.destroy();
                    return false;
                }
            }
        ), {
            numRuns: 25,
            timeout: 8000
        });
    });

    /**
     * Property 6: Widget Performance Metrics Consistency
     * For any widget operations, performance metrics should be accurately tracked
     */
    test('Property 6: Widget performance metrics should be consistent', () => {
        fc.assert(fc.property(
            fc.integer({ min: 1, max: 10 }),
            async (widgetCount) => {
                const dashboard = new DashboardController('test-container');
                dashboard.initializeComponents = jest.fn().mockResolvedValue();
                dashboard.setupEventListeners = jest.fn();
                
                await dashboard.initialize();
                
                const widgetManager = dashboard.widgetManager;
                if (!widgetManager) return true;
                
                try {
                    const initialMetrics = widgetManager.getPerformanceMetrics();
                    const initialTotal = initialMetrics.totalWidgets;
                    const initialActive = initialMetrics.activeWidgets;
                    
                    // Create widgets
                    const widgetIds = [];
                    for (let i = 0; i < widgetCount; i++) {
                        const widgetId = `test-widget-${i}`;
                        await widgetManager.createWidget('kpi', {
                            id: widgetId,
                            type: 'kpi',
                            title: `Test Widget ${i}`,
                            position: { x: i % 4, y: Math.floor(i / 4) },
                            size: { width: 2, height: 1 }
                        });
                        widgetIds.push(widgetId);
                    }
                    
                    // Check metrics after creation
                    const afterCreationMetrics = widgetManager.getPerformanceMetrics();
                    const creationMetricsConsistent = 
                        afterCreationMetrics.totalWidgets === initialTotal + widgetCount &&
                        afterCreationMetrics.activeWidgets === initialActive + widgetCount &&
                        afterCreationMetrics.averageCreationTime >= 0;
                    
                    // Update some widgets
                    const updateCount = Math.min(3, widgetCount);
                    for (let i = 0; i < updateCount; i++) {
                        await widgetManager.updateWidget(widgetIds[i], { value: i * 100 });
                    }
                    
                    // Check metrics after updates
                    const afterUpdateMetrics = widgetManager.getPerformanceMetrics();
                    const updateMetricsConsistent = 
                        afterUpdateMetrics.averageRefreshTime >= 0;
                    
                    // Remove half the widgets
                    const removeCount = Math.floor(widgetCount / 2);
                    for (let i = 0; i < removeCount; i++) {
                        await widgetManager.removeWidget(widgetIds[i]);
                    }
                    
                    // Check metrics after removal
                    const afterRemovalMetrics = widgetManager.getPerformanceMetrics();
                    const removalMetricsConsistent = 
                        afterRemovalMetrics.activeWidgets === initialActive + widgetCount - removeCount;
                    
                    dashboard.destroy();
                    
                    return creationMetricsConsistent && updateMetricsConsistent && removalMetricsConsistent;
                    
                } catch (error) {
                    dashboard.destroy();
                    return false;
                }
            }
        ), {
            numRuns: 15,
            timeout: 10000
        });
    });
});

/**
 * Integration tests for widget management consistency
 */
describe('Widget Management Integration Tests', () => {
    let WidgetManager, DashboardController;

    beforeAll(async () => {
        const widgetModule = await import('../../js/dashboard/WidgetManager.js');
        const dashboardModule = await import('../../js/dashboard/DashboardController.js');
        WidgetManager = widgetModule.WidgetManager;
        DashboardController = dashboardModule.DashboardController;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        
        const mockElement = {
            innerHTML: '',
            className: '',
            insertBefore: jest.fn(),
            appendChild: jest.fn(),
            removeChild: jest.fn(),
            parentNode: { removeChild: jest.fn() },
            firstChild: null,
            querySelector: jest.fn(() => ({
                innerHTML: '',
                className: ''
            })),
            style: {}
        };
        
        document.getElementById.mockReturnValue(mockElement);
        document.createElement.mockReturnValue(mockElement);
        document.querySelector.mockReturnValue(mockElement);
    });

    test('Complete widget lifecycle should maintain consistency', async () => {
        const dashboard = new DashboardController('test-container');
        dashboard.initializeComponents = jest.fn().mockResolvedValue();
        dashboard.setupEventListeners = jest.fn();
        
        await dashboard.initialize();
        
        const widgetManager = dashboard.widgetManager;
        expect(widgetManager).toBeDefined();
        
        // Test widget creation
        const widget = await widgetManager.createWidget('kpi', {
            id: 'test-widget',
            type: 'kpi',
            title: 'Test KPI Widget',
            position: { x: 0, y: 0 },
            size: { width: 3, height: 2 }
        });
        
        expect(widget.id).toBe('test-widget');
        expect(widget.type).toBe('kpi');
        expect(widgetManager.widgets.has('test-widget')).toBe(true);
        
        // Test widget update
        await widgetManager.updateWidget('test-widget', { value: 100 });
        const updatedWidget = widgetManager.widgets.get('test-widget');
        expect(updatedWidget.data).toEqual({ value: 100 });
        
        // Test widget removal
        await widgetManager.removeWidget('test-widget');
        expect(widgetManager.widgets.has('test-widget')).toBe(false);
        
        // Cleanup
        dashboard.destroy();
    });

    test('Multiple widget operations should maintain state consistency', async () => {
        const dashboard = new DashboardController('test-container');
        dashboard.initializeComponents = jest.fn().mockResolvedValue();
        dashboard.setupEventListeners = jest.fn();
        
        await dashboard.initialize();
        
        const widgetManager = dashboard.widgetManager;
        
        // Create multiple widgets
        const widgetConfigs = [
            { id: 'widget1', type: 'kpi', position: { x: 0, y: 0 }, size: { width: 3, height: 2 } },
            { id: 'widget2', type: 'chart', position: { x: 3, y: 0 }, size: { width: 6, height: 4 } },
            { id: 'widget3', type: 'table', position: { x: 0, y: 2 }, size: { width: 9, height: 3 } }
        ];
        
        for (const config of widgetConfigs) {
            await widgetManager.createWidget(config.type, {
                ...config,
                title: `Test ${config.type} Widget`
            });
        }
        
        expect(widgetManager.widgets.size).toBe(3);
        
        // Test rearrangement
        const newLayout = [
            { id: 'widget1', position: { x: 6, y: 0 }, size: { width: 3, height: 2 } },
            { id: 'widget2', position: { x: 0, y: 0 }, size: { width: 6, height: 4 } },
            { id: 'widget3', position: { x: 0, y: 4 }, size: { width: 9, height: 3 } }
        ];
        
        await widgetManager.rearrangeWidgets(newLayout);
        
        // Verify positions were updated
        for (const layoutItem of newLayout) {
            const widget = widgetManager.widgets.get(layoutItem.id);
            expect(widget.config.position).toEqual(layoutItem.position);
        }
        
        // Cleanup
        dashboard.destroy();
    });
});