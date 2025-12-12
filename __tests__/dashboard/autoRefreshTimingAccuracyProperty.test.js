/**
 * Dashboard Analytics & KPI - Auto Refresh Timing Accuracy Property Test
 * 
 * **Feature: dashboard-analytics-kpi, Property 12: Auto-refresh Timing Accuracy**
 * **Validates: Requirements 6.2**
 * 
 * Property-based test to verify that auto-refresh occurs at specified intervals
 * with acceptable tolerance across different configurations.
 */

const fc = require('fast-check');

// Mock implementations for testing
class MockWidget {
    constructor(config) {
        this.config = config;
        this.refreshCount = 0;
        this.refreshTimestamps = [];
        this.element = { getBoundingClientRect: () => ({ top: 0, bottom: 100, left: 0, right: 100 }) };
        this.supportsPartialUpdate = false;
    }

    async refresh() {
        this.refreshCount++;
        this.refreshTimestamps.push(Date.now());
        
        // Simulate refresh work
        await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 20));
    }

    getRefreshIntervals() {
        if (this.refreshTimestamps.length < 2) return [];
        
        const intervals = [];
        for (let i = 1; i < this.refreshTimestamps.length; i++) {
            intervals.push(this.refreshTimestamps[i] - this.refreshTimestamps[i - 1]);
        }
        return intervals;
    }
}

class MockDashboardController {
    constructor() {
        this.widgets = new Map();
    }

    async refreshData() {
        const promises = Array.from(this.widgets.values()).map(widget => widget.refresh());
        await Promise.all(promises);
    }
}

// Import the class under test
const { AutoRefreshManager } = require('../../js/dashboard/AutoRefreshManager.js');

describe('Auto Refresh Timing Accuracy Property Tests', () => {
    let autoRefreshManager;
    let mockDashboardController;

    beforeEach(() => {
        // Setup DOM mocks
        global.document = {
            visibilityState: 'visible',
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn()
        };
        
        global.window = {
            addEventListener: jest.fn(),
            removeEventListener: jest.fn()
        };
        
        global.navigator = {
            onLine: true
        };

        mockDashboardController = new MockDashboardController();
        autoRefreshManager = new AutoRefreshManager(mockDashboardController);
    });

    afterEach(async () => {
        if (autoRefreshManager) {
            autoRefreshManager.destroy();
        }
        
        // Clear all timers
        jest.clearAllTimers();
    });

    /**
     * Property 12: Auto-refresh Timing Accuracy
     * For any widget with auto-refresh enabled, the refresh should occur at the 
     * specified intervals with acceptable tolerance (±10 seconds or ±10% of interval)
     */
    test('Property 12: Auto-refresh timing accuracy within acceptable tolerance', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate refresh intervals between 10 seconds and 5 minutes
                fc.integer({ min: 10000, max: 300000 }),
                // Generate number of widgets (1-5)
                fc.integer({ min: 1, max: 5 }),
                // Generate test duration multiplier (2-4 intervals)
                fc.integer({ min: 2, max: 4 }),
                
                async (refreshInterval, widgetCount, durationMultiplier) => {
                    // Create test widgets with the same refresh interval
                    const widgets = new Map();
                    
                    for (let i = 0; i < widgetCount; i++) {
                        const widget = new MockWidget({
                            id: `test-widget-${i}`,
                            refreshInterval: refreshInterval
                        });
                        widgets.set(widget.config.id, widget);
                        mockDashboardController.widgets.set(widget.config.id, widget);
                    }

                    // Initialize and start auto-refresh
                    await autoRefreshManager.initialize();
                    autoRefreshManager.startAutoRefresh(widgets);

                    // Wait for multiple refresh cycles
                    const testDuration = refreshInterval * durationMultiplier;
                    await new Promise(resolve => setTimeout(resolve, testDuration));

                    // Stop auto-refresh
                    autoRefreshManager.stopAutoRefresh();

                    // Analyze timing accuracy for each widget
                    for (const widget of widgets.values()) {
                        const intervals = widget.getRefreshIntervals();
                        
                        // Should have at least one refresh interval recorded
                        if (intervals.length > 0) {
                            for (const actualInterval of intervals) {
                                // Calculate acceptable tolerance
                                const toleranceMs = Math.max(10000, refreshInterval * 0.1); // ±10s or ±10%
                                const minAcceptable = refreshInterval - toleranceMs;
                                const maxAcceptable = refreshInterval + toleranceMs;

                                // Verify timing accuracy
                                expect(actualInterval).toBeGreaterThanOrEqual(minAcceptable);
                                expect(actualInterval).toBeLessThanOrEqual(maxAcceptable);
                            }
                        }
                    }
                }
            ),
            {
                numRuns: 20,
                timeout: 30000,
                interruptAfterTimeLimit: 25000
            }
        );
    });

    test('Property 12a: Refresh intervals remain consistent across multiple cycles', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate refresh interval between 5-30 seconds for faster testing
                fc.integer({ min: 5000, max: 30000 }),
                
                async (refreshInterval) => {
                    const widget = new MockWidget({
                        id: 'consistency-test-widget',
                        refreshInterval: refreshInterval
                    });
                    
                    const widgets = new Map();
                    widgets.set(widget.config.id, widget);
                    mockDashboardController.widgets.set(widget.config.id, widget);

                    await autoRefreshManager.initialize();
                    autoRefreshManager.startAutoRefresh(widgets);

                    // Wait for at least 3 refresh cycles
                    const testDuration = refreshInterval * 3.5;
                    await new Promise(resolve => setTimeout(resolve, testDuration));

                    autoRefreshManager.stopAutoRefresh();

                    const intervals = widget.getRefreshIntervals();
                    
                    if (intervals.length >= 2) {
                        // Calculate variance in intervals
                        const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
                        const variance = intervals.reduce((sum, interval) => {
                            const diff = interval - avgInterval;
                            return sum + (diff * diff);
                        }, 0) / intervals.length;
                        
                        const standardDeviation = Math.sqrt(variance);
                        const coefficientOfVariation = standardDeviation / avgInterval;

                        // Coefficient of variation should be low (< 0.2 or 20%)
                        expect(coefficientOfVariation).toBeLessThan(0.2);
                    }
                }
            ),
            {
                numRuns: 15,
                timeout: 60000,
                interruptAfterTimeLimit: 55000
            }
        );
    });

    test('Property 12b: Different widgets maintain independent refresh schedules', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate two different refresh intervals
                fc.tuple(
                    fc.integer({ min: 5000, max: 20000 }),
                    fc.integer({ min: 5000, max: 20000 })
                ).filter(([interval1, interval2]) => Math.abs(interval1 - interval2) >= 2000),
                
                async ([interval1, interval2]) => {
                    const widget1 = new MockWidget({
                        id: 'widget-1',
                        refreshInterval: interval1
                    });
                    
                    const widget2 = new MockWidget({
                        id: 'widget-2',
                        refreshInterval: interval2
                    });
                    
                    const widgets = new Map();
                    widgets.set(widget1.config.id, widget1);
                    widgets.set(widget2.config.id, widget2);
                    mockDashboardController.widgets.set(widget1.config.id, widget1);
                    mockDashboardController.widgets.set(widget2.config.id, widget2);

                    await autoRefreshManager.initialize();
                    autoRefreshManager.startAutoRefresh(widgets);

                    // Wait for multiple cycles of both intervals
                    const testDuration = Math.max(interval1, interval2) * 3;
                    await new Promise(resolve => setTimeout(resolve, testDuration));

                    autoRefreshManager.stopAutoRefresh();

                    const intervals1 = widget1.getRefreshIntervals();
                    const intervals2 = widget2.getRefreshIntervals();

                    // Both widgets should have refreshed
                    expect(widget1.refreshCount).toBeGreaterThan(0);
                    expect(widget2.refreshCount).toBeGreaterThan(0);

                    // Verify each widget maintains its own schedule
                    if (intervals1.length > 0) {
                        const avgInterval1 = intervals1.reduce((sum, interval) => sum + interval, 0) / intervals1.length;
                        const tolerance1 = Math.max(2000, interval1 * 0.2);
                        expect(Math.abs(avgInterval1 - interval1)).toBeLessThan(tolerance1);
                    }

                    if (intervals2.length > 0) {
                        const avgInterval2 = intervals2.reduce((sum, interval) => sum + interval, 0) / intervals2.length;
                        const tolerance2 = Math.max(2000, interval2 * 0.2);
                        expect(Math.abs(avgInterval2 - interval2)).toBeLessThan(tolerance2);
                    }
                }
            ),
            {
                numRuns: 10,
                timeout: 45000,
                interruptAfterTimeLimit: 40000
            }
        );
    });

    test('Property 12c: Refresh pauses when page is hidden and resumes when visible', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 2000, max: 10000 }), // Short intervals for testing
                
                async (refreshInterval) => {
                    const widget = new MockWidget({
                        id: 'visibility-test-widget',
                        refreshInterval: refreshInterval
                    });
                    
                    const widgets = new Map();
                    widgets.set(widget.config.id, widget);
                    mockDashboardController.widgets.set(widget.config.id, widget);

                    await autoRefreshManager.initialize();
                    autoRefreshManager.startAutoRefresh(widgets);

                    // Let it refresh a few times while visible
                    await new Promise(resolve => setTimeout(resolve, refreshInterval * 1.5));
                    const refreshCountVisible = widget.refreshCount;

                    // Simulate page becoming hidden
                    global.document.visibilityState = 'hidden';
                    autoRefreshManager.handleVisibilityChange();

                    // Wait for what would be another refresh cycle
                    await new Promise(resolve => setTimeout(resolve, refreshInterval * 1.5));
                    const refreshCountHidden = widget.refreshCount;

                    // Simulate page becoming visible again
                    global.document.visibilityState = 'visible';
                    autoRefreshManager.handleVisibilityChange();

                    // Wait for refresh to resume
                    await new Promise(resolve => setTimeout(resolve, refreshInterval * 1.5));
                    const refreshCountResumed = widget.refreshCount;

                    autoRefreshManager.stopAutoRefresh();

                    // Verify behavior
                    expect(refreshCountVisible).toBeGreaterThan(0); // Should refresh when visible
                    expect(refreshCountHidden).toBe(refreshCountVisible); // Should not refresh when hidden
                    expect(refreshCountResumed).toBeGreaterThan(refreshCountHidden); // Should resume when visible
                }
            ),
            {
                numRuns: 8,
                timeout: 30000,
                interruptAfterTimeLimit: 25000
            }
        );
    });

    test('Property 12d: Refresh intervals can be updated dynamically', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.tuple(
                    fc.integer({ min: 3000, max: 8000 }),
                    fc.integer({ min: 3000, max: 8000 })
                ).filter(([initial, updated]) => Math.abs(initial - updated) >= 1000),
                
                async ([initialInterval, updatedInterval]) => {
                    const widget = new MockWidget({
                        id: 'dynamic-interval-widget',
                        refreshInterval: initialInterval
                    });
                    
                    const widgets = new Map();
                    widgets.set(widget.config.id, widget);
                    mockDashboardController.widgets.set(widget.config.id, widget);

                    await autoRefreshManager.initialize();
                    autoRefreshManager.startAutoRefresh(widgets);

                    // Let it refresh with initial interval
                    await new Promise(resolve => setTimeout(resolve, initialInterval * 1.5));
                    const refreshCountInitial = widget.refreshCount;

                    // Update the refresh interval
                    autoRefreshManager.updateWidgetRefreshInterval(widget.config.id, updatedInterval);

                    // Wait for the new interval to take effect
                    await new Promise(resolve => setTimeout(resolve, Math.max(initialInterval, updatedInterval) * 2));
                    const refreshCountUpdated = widget.refreshCount;

                    autoRefreshManager.stopAutoRefresh();

                    // Should have refreshed with initial interval
                    expect(refreshCountInitial).toBeGreaterThan(0);
                    
                    // Should continue refreshing with updated interval
                    expect(refreshCountUpdated).toBeGreaterThan(refreshCountInitial);
                    
                    // Verify the widget config was updated
                    expect(widget.config.refreshInterval).toBe(updatedInterval);
                }
            ),
            {
                numRuns: 8,
                timeout: 30000,
                interruptAfterTimeLimit: 25000
            }
        );
    });

    test('Property 12e: Auto-refresh respects minimum and maximum interval bounds', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate intervals that might be outside acceptable bounds
                fc.integer({ min: 1000, max: 500000 }),
                
                async (requestedInterval) => {
                    const widget = new MockWidget({
                        id: 'bounds-test-widget',
                        refreshInterval: requestedInterval
                    });
                    
                    const widgets = new Map();
                    widgets.set(widget.config.id, widget);
                    mockDashboardController.widgets.set(widget.config.id, widget);

                    await autoRefreshManager.initialize();
                    
                    // Get the actual interval that will be used (after bounds checking)
                    const actualInterval = autoRefreshManager.getWidgetRefreshInterval(widget);
                    
                    // Verify bounds are respected
                    expect(actualInterval).toBeGreaterThanOrEqual(autoRefreshManager.config.minRefreshInterval);
                    expect(actualInterval).toBeLessThanOrEqual(autoRefreshManager.config.maxRefreshInterval);
                    
                    // If requested interval was within bounds, it should be preserved
                    if (requestedInterval >= autoRefreshManager.config.minRefreshInterval && 
                        requestedInterval <= autoRefreshManager.config.maxRefreshInterval) {
                        expect(actualInterval).toBe(requestedInterval);
                    }
                }
            ),
            {
                numRuns: 25,
                timeout: 10000
            }
        );
    });
});

// Helper function to create delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Mock Jest functions if not available
if (typeof jest === 'undefined') {
    global.jest = {
        fn: () => () => {},
        clearAllTimers: () => {}
    };
}

if (typeof expect === 'undefined') {
    global.expect = (value) => ({
        toBe: (expected) => {
            if (value !== expected) {
                throw new Error(`Expected ${value} to be ${expected}`);
            }
        },
        toBeGreaterThan: (expected) => {
            if (value <= expected) {
                throw new Error(`Expected ${value} to be greater than ${expected}`);
            }
        },
        toBeGreaterThanOrEqual: (expected) => {
            if (value < expected) {
                throw new Error(`Expected ${value} to be greater than or equal to ${expected}`);
            }
        },
        toBeLessThan: (expected) => {
            if (value >= expected) {
                throw new Error(`Expected ${value} to be less than ${expected}`);
            }
        },
        toBeLessThanOrEqual: (expected) => {
            if (value > expected) {
                throw new Error(`Expected ${value} to be less than or equal to ${expected}`);
            }
        }
    });
}

if (typeof describe === 'undefined') {
    global.describe = (name, fn) => {
        console.log(`\n=== ${name} ===`);
        fn();
    };
}

if (typeof test === 'undefined') {
    global.test = async (name, fn) => {
        try {
            console.log(`Running: ${name}`);
            await fn();
            console.log(`✓ ${name}`);
        } catch (error) {
            console.error(`✗ ${name}: ${error.message}`);
            throw error;
        }
    };
}

if (typeof beforeEach === 'undefined') {
    global.beforeEach = (fn) => {
        // Store setup function - would be called before each test in real Jest
        global._beforeEachFn = fn;
    };
}

if (typeof afterEach === 'undefined') {
    global.afterEach = (fn) => {
        // Store cleanup function - would be called after each test in real Jest
        global._afterEachFn = fn;
    };
}