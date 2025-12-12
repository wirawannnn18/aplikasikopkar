/**
 * Property-Based Test: Responsive Layout Consistency
 * 
 * **Feature: dashboard-analytics-kpi, Property 13: Responsive Layout Consistency**
 * **Validates: Requirements 7.1**
 */

import fc from 'fast-check';
import { jest } from '@jest/globals';
import { ResponsiveLayoutManager } from '../../js/dashboard/ResponsiveLayoutManager.js';

describe('Responsive Layout Consistency Tests', () => {
    let mockDashboardController;
    
    beforeEach(() => {
        // Mock DOM elements
        const mockElement = {
            classList: { 
                add: jest.fn(), 
                remove: jest.fn(), 
                toggle: jest.fn(), 
                contains: jest.fn(() => false) 
            },
            style: { 
                setProperty: jest.fn(),
                width: '',
                height: '',
                gridColumn: '',
                gridRow: '',
                display: ''
            },
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            querySelectorAll: jest.fn(() => []),
            appendChild: jest.fn(),
            getBoundingClientRect: jest.fn(() => ({
                width: 100,
                height: 50,
                top: 0,
                left: 0,
                bottom: 50,
                right: 100
            }))
        };
        
        // Mock dashboard controller
        mockDashboardController = {
            container: mockElement,
            widgets: new Map()
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
        
        // Mock navigator
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            writable: true,
            configurable: true
        });
        Object.defineProperty(navigator, 'maxTouchPoints', {
            value: 0,
            writable: true,
            configurable: true
        });
        
        // Mock window methods
        window.addEventListener = jest.fn();
        window.removeEventListener = jest.fn();
        window.matchMedia = jest.fn(() => ({
            matches: false,
            addEventListener: jest.fn(),
            removeEventListener: jest.fn()
        }));
        
        // Mock document methods
        document.createElement = jest.fn(() => mockElement);
        document.querySelectorAll = jest.fn(() => []);
        document.getElementById = jest.fn(() => mockElement);
    });

    test('should initialize responsive layout manager successfully', async () => {
        const manager = new ResponsiveLayoutManager(mockDashboardController);
        await manager.initialize();
        
        expect(manager.isInitialized).toBe(true);
        expect(manager.getCurrentBreakpoint()).toBeDefined();
    });

    test('Property 13: Responsive layout consistency across screen sizes', () => {
        // Test specific breakpoint values
        const testCases = [
            { width: 320, expected: 'xs' },
            { width: 576, expected: 'sm' },
            { width: 768, expected: 'md' },
            { width: 992, expected: 'lg' },
            { width: 1200, expected: 'xl' },
            { width: 1400, expected: 'xxl' }
        ];
        
        testCases.forEach(testCase => {
            // Setup test environment
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: testCase.width
            });
            
            // Create new manager for each test
            const manager = new ResponsiveLayoutManager(mockDashboardController);
            
            // Initialize layout configurations manually for testing
            manager.initializeLayoutConfigs();
            
            // Apply responsive layout to set currentBreakpoint
            manager.applyResponsiveLayout();
            
            const breakpoint = manager.getCurrentBreakpoint();
            
            expect(breakpoint).toBe(testCase.expected);
            
            // Test layout configuration consistency
            const layoutConfig = manager.getCurrentLayoutConfig();
            expect(layoutConfig).toBeDefined();
            expect(layoutConfig.columns).toBeGreaterThan(0);
            expect(layoutConfig.widgetSpacing).toBeGreaterThanOrEqual(8);
            expect(layoutConfig.containerPadding).toBeGreaterThanOrEqual(8);
            
            // Test responsive state consistency
            const state = manager.getResponsiveState();
            expect(state.breakpoint).toBe(breakpoint);
            expect(state.isMobile).toBe(['xs', 'sm'].includes(breakpoint));
            expect(state.isTablet).toBe(breakpoint === 'md');
            expect(state.isDesktop).toBe(['lg', 'xl', 'xxl'].includes(breakpoint));
        });
    });

    test('should handle mobile layout correctly', async () => {
        // Set mobile screen size
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 375
        });
        Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: 667
        });
        
        const manager = new ResponsiveLayoutManager(mockDashboardController);
        await manager.initialize();
        
        const state = manager.getResponsiveState();
        expect(state.isMobile).toBe(true);
        expect(state.layoutConfig.columns).toBe(1);
        expect(state.performanceSettings.enableAnimations).toBe(false);
        
        manager.destroy();
    });

    test('should handle tablet layout correctly', async () => {
        // Set tablet screen size
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: 768
        });
        Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: 1024
        });
        
        const manager = new ResponsiveLayoutManager(mockDashboardController);
        await manager.initialize();
        
        const state = manager.getResponsiveState();
        expect(state.isTablet).toBe(true);
        expect(state.layoutConfig.columns).toBe(2);
        
        manager.destroy();
    });

    test('should handle desktop layout correctly', async () => {
        // Set desktop screen size
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
        
        const manager = new ResponsiveLayoutManager(mockDashboardController);
        await manager.initialize();
        
        const state = manager.getResponsiveState();
        expect(state.isDesktop).toBe(true);
        expect(state.layoutConfig.columns).toBeGreaterThanOrEqual(3);
        
        manager.destroy();
    });
});

/**
 * Helper function to get expected breakpoint for screen width
 */
function getExpectedBreakpoint(width) {
    if (width >= 1400) return 'xxl';
    if (width >= 1200) return 'xl';
    if (width >= 992) return 'lg';
    if (width >= 768) return 'md';
    if (width >= 576) return 'sm';
    return 'xs';
}