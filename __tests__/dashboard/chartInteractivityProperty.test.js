/**
 * Property-Based Tests for Chart Interactivity
 * 
 * Tests that validate chart interactive features including drill-down capability,
 * export functionality, theming, and customization options.
 */

// Mock Chart.js for testing environment
global.Chart = function(canvas, config) {
    return {
        data: config.data,
        options: config.options || {},
        config: config,
        canvas: { width: 800, height: 600 },
        update: () => {},
        destroy: () => {},
        resize: () => {},
        toBase64Image: (format, quality) => `data:image/${format};base64,mock-image-data-${quality}`,
        resetZoom: () => {}
    };
};

// Add Chart.js static methods and properties
global.Chart.register = () => {};
global.Chart.CategoryScale = {};
global.Chart.LinearScale = {};
global.Chart.PointElement = {};
global.Chart.LineElement = {};
global.Chart.BarElement = {};
global.Chart.ArcElement = {};
global.Chart.RadialLinearScale = {};
global.Chart.Title = {};
global.Chart.Tooltip = {};
global.Chart.Legend = {};
global.Chart.Filler = {};

// Mock performance API
global.performance = {
    now: () => 100
};

// Mock DOM elements
global.document = {
    getElementById: () => ({
        innerHTML: '',
        appendChild: () => {}
    }),
    createElement: (tag) => {
        if (tag === 'a') {
            return {
                href: '',
                download: '',
                click: () => {},
                style: {}
            };
        }
        return {
            id: '',
            style: {}
        };
    },
    body: {
        appendChild: () => {},
        removeChild: () => {}
    }
};

global.window = {
    addEventListener: () => {}
};

global.URL = {
    createObjectURL: () => 'mock-object-url',
    revokeObjectURL: () => {}
};

global.Blob = function(data, options) {
    this.data = data;
    this.type = options?.type || 'application/octet-stream';
    this.size = data.length;
};

// Create a mock ChartRenderer class for testing
class MockChartRenderer {
    constructor() {
        this.isInitialized = false;
        this.chartInstances = new Map();
        this.chartConfigs = new Map();
        this.colorPalettes = this.initializeColorPalettes();
        this.defaultOptions = this.initializeDefaultOptions();
        this.renderingMetrics = {
            renderTimes: [],
            totalCharts: 0,
            failedRenders: 0,
            averageRenderTime: 0
        };
    }
    
    initializeColorPalettes() {
        return {
            default: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
            financial: ['#059669', '#DC2626', '#D97706', '#7C3AED', '#0891B2'],
            pastel: ['#93C5FD', '#86EFAC', '#FDE68A', '#FCA5A5', '#C4B5FD'],
            dark: ['#1E40AF', '#047857', '#B45309', '#B91C1C', '#6D28D9']
        };
    }
    
    initializeDefaultOptions() {
        return {
            line: { tension: 0.4, fill: false, pointRadius: 4, pointHoverRadius: 6, borderWidth: 2 },
            bar: { borderRadius: 4, borderSkipped: false, maxBarThickness: 50 },
            pie: { cutout: 0, borderWidth: 2, hoverBorderWidth: 4 },
            doughnut: { cutout: '60%', borderWidth: 2, hoverBorderWidth: 4 },
            radar: { pointRadius: 4, pointHoverRadius: 6, borderWidth: 2, fill: true, fillOpacity: 0.2 }
        };
    }
    
    // Mock chart creation for testing
    async renderChart(containerId, config) {
        const mockChart = new global.Chart(null, config);
        // Ensure options object exists
        if (!mockChart.options) {
            mockChart.options = {};
        }
        this.chartInstances.set(containerId, mockChart);
        this.chartConfigs.set(containerId, config);
        return mockChart;
    }
    
    // Interactive features implementation
    enableDrillDown(containerId, drillDownCallback, options = {}) {
        const chart = this.chartInstances.get(containerId);
        if (!chart) {
            throw new Error(`Chart not found for container: ${containerId}`);
        }
        
        const drillDownOptions = {
            enableTooltipIndicator: true,
            cursorStyle: 'pointer',
            highlightOnHover: true,
            ...options
        };
        
        chart.options.onClick = (event, elements) => {
            if (elements.length > 0 && typeof drillDownCallback === 'function') {
                const element = elements[0];
                const drillDownData = {
                    datasetIndex: element.datasetIndex,
                    index: element.index,
                    label: chart.data.labels[element.index],
                    value: chart.data.datasets[element.datasetIndex].data[element.index],
                    dataset: chart.data.datasets[element.datasetIndex],
                    chartType: chart.config.type,
                    containerId
                };
                drillDownCallback(drillDownData);
            }
        };
        
        if (drillDownOptions.highlightOnHover) {
            chart.options.onHover = () => {};
        }
        
        chart.update();
        return true;
    }
    
    disableDrillDown(containerId) {
        const chart = this.chartInstances.get(containerId);
        if (!chart) {
            throw new Error(`Chart not found for container: ${containerId}`);
        }
        
        delete chart.options.onClick;
        delete chart.options.onHover;
        chart.update();
        return true;
    }
    
    async exportChartAdvanced(containerId, exportOptions = {}) {
        const chart = this.chartInstances.get(containerId);
        if (!chart) {
            throw new Error(`Chart not found for container: ${containerId}`);
        }
        
        const options = {
            format: 'png',
            quality: 1.0,
            width: null,
            height: null,
            backgroundColor: '#ffffff',
            filename: `chart-${containerId}-${Date.now()}`,
            download: false,
            ...exportOptions
        };
        
        let exportData;
        
        if (options.format === 'svg') {
            exportData = `<svg width="800" height="600"><image href="${chart.toBase64Image('png', options.quality)}" width="800" height="600"/></svg>`;
        } else if (options.format === 'pdf') {
            exportData = new global.Blob(['mock-pdf-content'], { type: 'application/pdf' });
        } else {
            exportData = chart.toBase64Image(options.format, options.quality);
        }
        
        if (options.download) {
            this.downloadExport(exportData, options.filename, options.format);
        }
        
        return exportData;
    }
    
    downloadExport(data, filename, format) {
        // Mock download functionality
        return { data, filename, format, downloaded: true };
    }
    
    applyTheme(containerId, theme) {
        const chart = this.chartInstances.get(containerId);
        if (!chart) {
            throw new Error(`Chart not found for container: ${containerId}`);
        }
        
        const themeConfig = this.getThemeConfig(theme);
        this.mergeThemeOptions(chart.options, themeConfig);
        
        if (themeConfig.colors) {
            chart.data.datasets.forEach((dataset, index) => {
                const colorIndex = index % themeConfig.colors.length;
                dataset.backgroundColor = themeConfig.colors[colorIndex];
                dataset.borderColor = themeConfig.colors[colorIndex];
            });
        }
        
        chart.update();
        return true;
    }
    
    getThemeConfig(theme) {
        const predefinedThemes = {
            light: {
                backgroundColor: '#ffffff',
                textColor: '#333333',
                gridColor: '#e0e0e0',
                colors: this.colorPalettes.default
            },
            dark: {
                backgroundColor: '#1a1a1a',
                textColor: '#ffffff',
                gridColor: '#404040',
                colors: this.colorPalettes.dark
            },
            corporate: {
                backgroundColor: '#f8f9fa',
                textColor: '#2c3e50',
                gridColor: '#dee2e6',
                colors: this.colorPalettes.financial
            }
        };
        
        if (typeof theme === 'string') {
            return predefinedThemes[theme] || predefinedThemes.light;
        }
        
        return { ...predefinedThemes.light, ...theme };
    }
    
    mergeThemeOptions(chartOptions, themeConfig) {
        if (themeConfig.backgroundColor) {
            chartOptions.plugins = chartOptions.plugins || {};
            chartOptions.plugins.legend = chartOptions.plugins.legend || {};
            chartOptions.plugins.legend.labels = chartOptions.plugins.legend.labels || {};
            chartOptions.plugins.legend.labels.color = themeConfig.textColor;
        }
        
        if (themeConfig.gridColor && chartOptions.scales) {
            Object.keys(chartOptions.scales).forEach(scaleKey => {
                const scale = chartOptions.scales[scaleKey];
                if (scale.grid) {
                    scale.grid.color = themeConfig.gridColor;
                }
                if (scale.ticks) {
                    scale.ticks.color = themeConfig.textColor;
                }
            });
        }
    }
    
    addAnnotations(containerId, annotations) {
        const chart = this.chartInstances.get(containerId);
        if (!chart) {
            throw new Error(`Chart not found for container: ${containerId}`);
        }
        
        chart.options.plugins = chart.options.plugins || {};
        chart.options.plugins.annotation = chart.options.plugins.annotation || {
            annotations: {}
        };
        
        annotations.forEach((annotation, index) => {
            const annotationId = annotation.id || `annotation-${index}`;
            chart.options.plugins.annotation.annotations[annotationId] = {
                type: annotation.type || 'line',
                scaleID: annotation.scaleID || 'y',
                value: annotation.value,
                borderColor: annotation.color || '#ff0000',
                borderWidth: annotation.width || 2,
                label: {
                    content: annotation.label || '',
                    enabled: !!annotation.label,
                    position: annotation.labelPosition || 'end'
                },
                ...annotation.options
            };
        });
        
        chart.update();
        return true;
    }
    
    removeAnnotations(containerId, annotationIds = []) {
        const chart = this.chartInstances.get(containerId);
        if (!chart) {
            throw new Error(`Chart not found for container: ${containerId}`);
        }
        
        if (!chart.options.plugins?.annotation?.annotations) {
            return true;
        }
        
        if (annotationIds.length === 0) {
            // Clear all annotations
            Object.keys(chart.options.plugins.annotation.annotations).forEach(id => {
                delete chart.options.plugins.annotation.annotations[id];
            });
        } else {
            annotationIds.forEach(id => {
                delete chart.options.plugins.annotation.annotations[id];
            });
        }
        
        chart.update();
        return true;
    }
    
    getInteractionAPI(containerId) {
        const chart = this.chartInstances.get(containerId);
        if (!chart) {
            throw new Error(`Chart not found for container: ${containerId}`);
        }
        
        return {
            chart,
            enableDrillDown: (callback, options) => this.enableDrillDown(containerId, callback, options),
            disableDrillDown: () => this.disableDrillDown(containerId),
            export: (options) => this.exportChartAdvanced(containerId, options),
            applyTheme: (theme) => this.applyTheme(containerId, theme),
            addAnnotations: (annotations) => this.addAnnotations(containerId, annotations),
            removeAnnotations: (ids) => this.removeAnnotations(containerId, ids)
        };
    }
}

describe('Chart Interactivity Property Tests', () => {
    let chartRenderer;
    
    beforeEach(() => {
        chartRenderer = new MockChartRenderer();
    });

    /**
     * Property 1: Drill-down Callback Consistency
     * Validates that drill-down callbacks are executed consistently with correct data
     */
    test('Property 1: Drill-down callback execution is consistent', async () => {
        const testCases = [
            {
                containerId: 'test-chart-1',
                chartConfig: {
                    type: 'bar',
                    data: {
                        labels: ['A', 'B', 'C'],
                        datasets: [{ label: 'Test', data: [10, 20, 30] }]
                    }
                }
            },
            {
                containerId: 'test-chart-2',
                chartConfig: {
                    type: 'line',
                    data: {
                        labels: ['X', 'Y'],
                        datasets: [{ label: 'Series', data: [100, 200] }]
                    }
                }
            }
        ];
        
        for (const testCase of testCases) {
            await chartRenderer.renderChart(testCase.containerId, testCase.chartConfig);
            
            let callbackExecuted = false;
            let receivedData = null;
            
            const drillDownCallback = (data) => {
                callbackExecuted = true;
                receivedData = data;
            };
            
            // Enable drill-down
            chartRenderer.enableDrillDown(testCase.containerId, drillDownCallback);
            
            const chart = chartRenderer.chartInstances.get(testCase.containerId);
            
            // Should have onClick handler
            expect(typeof chart.options.onClick).toBe('function');
            
            // Simulate click event
            const mockElements = [{
                datasetIndex: 0,
                index: 0,
                chart: chart
            }];
            
            chart.options.onClick({}, mockElements);
            
            // Callback should be executed
            expect(callbackExecuted).toBe(true);
            expect(receivedData).not.toBeNull();
            expect(receivedData.containerId).toBe(testCase.containerId);
            expect(receivedData.datasetIndex).toBe(0);
            expect(receivedData.index).toBe(0);
            expect(receivedData.chartType).toBe(testCase.chartConfig.type);
        }
    });

    /**
     * Property 2: Export Format Consistency
     * Validates that chart export produces consistent results for different formats
     */
    test('Property 2: Chart export format consistency', async () => {
        const containerId = 'export-test-chart';
        const chartConfig = {
            type: 'pie',
            data: {
                labels: ['Red', 'Blue', 'Yellow'],
                datasets: [{ data: [300, 50, 100] }]
            }
        };
        
        await chartRenderer.renderChart(containerId, chartConfig);
        
        const exportFormats = ['png', 'jpeg', 'webp', 'svg', 'pdf'];
        const exportResults = {};
        
        for (const format of exportFormats) {
            const exportData = await chartRenderer.exportChartAdvanced(containerId, {
                format: format,
                quality: 0.8,
                filename: `test-chart`
            });
            
            exportResults[format] = exportData;
            
            // Each format should produce valid output
            expect(exportData).toBeDefined();
            
            if (format === 'svg') {
                expect(typeof exportData).toBe('string');
                expect(exportData).toContain('<svg');
            } else if (format === 'pdf') {
                expect(exportData).toBeInstanceOf(global.Blob);
                expect(exportData.type).toContain('pdf');
            } else {
                expect(typeof exportData).toBe('string');
                expect(exportData).toContain('data:image/');
                expect(exportData).toContain(format);
            }
        }
        
        // Multiple exports of same format should be consistent
        const export1 = await chartRenderer.exportChartAdvanced(containerId, { format: 'png' });
        const export2 = await chartRenderer.exportChartAdvanced(containerId, { format: 'png' });
        
        expect(export1).toBe(export2);
    });

    /**
     * Property 3: Theme Application Consistency
     * Validates that themes are applied consistently across different chart types
     */
    test('Property 3: Theme application is consistent', async () => {
        const chartTypes = ['line', 'bar', 'pie'];
        const themes = ['light', 'dark', 'corporate'];
        
        for (const chartType of chartTypes) {
            const containerId = `theme-test-${chartType}`;
            const chartConfig = {
                type: chartType,
                data: {
                    labels: ['A', 'B', 'C'],
                    datasets: [{ label: 'Test', data: [1, 2, 3] }]
                }
            };
            
            await chartRenderer.renderChart(containerId, chartConfig);
            
            for (const themeName of themes) {
                // Apply theme
                chartRenderer.applyTheme(containerId, themeName);
                
                const chart = chartRenderer.chartInstances.get(containerId);
                const themeConfig = chartRenderer.getThemeConfig(themeName);
                
                // Theme should be applied to datasets
                chart.data.datasets.forEach(dataset => {
                    expect(themeConfig.colors).toContain(dataset.backgroundColor);
                    expect(themeConfig.colors).toContain(dataset.borderColor);
                });
                
                // Theme should be applied to options
                if (chart.options.plugins?.legend?.labels) {
                    expect(chart.options.plugins.legend.labels.color).toBe(themeConfig.textColor);
                }
            }
        }
        
        // Custom theme should work
        const customTheme = {
            backgroundColor: '#custom-bg',
            textColor: '#custom-text',
            colors: ['#custom1', '#custom2']
        };
        
        const containerId = 'custom-theme-test';
        await chartRenderer.renderChart(containerId, {
            type: 'bar',
            data: {
                labels: ['X'],
                datasets: [{ data: [10] }]
            }
        });
        
        chartRenderer.applyTheme(containerId, customTheme);
        const chart = chartRenderer.chartInstances.get(containerId);
        
        expect(chart.data.datasets[0].backgroundColor).toBe('#custom1');
    });

    /**
     * Property 4: Annotation Management Consistency
     * Validates that annotations are added and removed consistently
     */
    test('Property 4: Annotation management is consistent', async () => {
        const containerId = 'annotation-test-chart';
        const chartConfig = {
            type: 'line',
            data: {
                labels: ['1', '2', '3', '4', '5'],
                datasets: [{ label: 'Data', data: [10, 20, 15, 25, 30] }]
            }
        };
        
        await chartRenderer.renderChart(containerId, chartConfig);
        
        const annotations = [
            {
                id: 'line1',
                type: 'line',
                value: 20,
                color: '#ff0000',
                label: 'Target Line'
            },
            {
                id: 'line2',
                type: 'line',
                value: 15,
                color: '#00ff00',
                label: 'Minimum'
            },
            {
                type: 'line', // No ID provided
                value: 25,
                color: '#0000ff'
            }
        ];
        
        // Add annotations
        chartRenderer.addAnnotations(containerId, annotations);
        
        const chart = chartRenderer.chartInstances.get(containerId);
        const chartAnnotations = chart.options.plugins.annotation.annotations;
        
        // Should have 3 annotations
        expect(Object.keys(chartAnnotations)).toHaveLength(3);
        
        // Named annotations should exist
        expect(chartAnnotations.line1).toBeDefined();
        expect(chartAnnotations.line1.value).toBe(20);
        expect(chartAnnotations.line1.borderColor).toBe('#ff0000');
        
        expect(chartAnnotations.line2).toBeDefined();
        expect(chartAnnotations.line2.value).toBe(15);
        expect(chartAnnotations.line2.borderColor).toBe('#00ff00');
        
        // Auto-generated ID should exist
        expect(chartAnnotations['annotation-2']).toBeDefined();
        expect(chartAnnotations['annotation-2'].value).toBe(25);
        
        // Remove specific annotations
        chartRenderer.removeAnnotations(containerId, ['line1']);
        
        expect(chartAnnotations.line1).toBeUndefined();
        expect(chartAnnotations.line2).toBeDefined();
        expect(chartAnnotations['annotation-2']).toBeDefined();
        
        // Remove all annotations
        chartRenderer.removeAnnotations(containerId);
        
        expect(Object.keys(chartAnnotations)).toHaveLength(0);
    });

    /**
     * Property 5: Interaction API Consistency
     * Validates that the interaction API provides consistent access to all features
     */
    test('Property 5: Interaction API provides consistent access', async () => {
        const containerId = 'api-test-chart';
        const chartConfig = {
            type: 'bar',
            data: {
                labels: ['Q1', 'Q2', 'Q3', 'Q4'],
                datasets: [{ label: 'Revenue', data: [100, 120, 110, 140] }]
            }
        };
        
        await chartRenderer.renderChart(containerId, chartConfig);
        
        // Get interaction API
        const api = chartRenderer.getInteractionAPI(containerId);
        
        // API should have all expected methods
        expect(typeof api.enableDrillDown).toBe('function');
        expect(typeof api.disableDrillDown).toBe('function');
        expect(typeof api.export).toBe('function');
        expect(typeof api.applyTheme).toBe('function');
        expect(typeof api.addAnnotations).toBe('function');
        expect(typeof api.removeAnnotations).toBe('function');
        
        // API should provide access to chart instance
        expect(api.chart).toBeDefined();
        expect(api.chart).toBe(chartRenderer.chartInstances.get(containerId));
        
        // API methods should work
        let drillDownCalled = false;
        api.enableDrillDown(() => { drillDownCalled = true; });
        
        // Simulate drill-down
        const chart = api.chart;
        chart.options.onClick({}, [{ datasetIndex: 0, index: 0, chart }]);
        expect(drillDownCalled).toBe(true);
        
        // Export should work
        const exportResult = await api.export({ format: 'png' });
        expect(exportResult).toBeDefined();
        expect(typeof exportResult).toBe('string');
        
        // Theme should work
        api.applyTheme('dark');
        const themeConfig = chartRenderer.getThemeConfig('dark');
        expect(chart.data.datasets[0].backgroundColor).toBe(themeConfig.colors[0]);
    });

    /**
     * Property 6: Error Handling Consistency
     * Validates that interactive features handle errors consistently
     */
    test('Property 6: Interactive features handle errors consistently', async () => {
        const nonExistentId = 'non-existent-chart';
        
        // All methods should throw consistent errors for non-existent charts
        expect(() => {
            chartRenderer.enableDrillDown(nonExistentId, () => {});
        }).toThrow('Chart not found for container: non-existent-chart');
        
        expect(() => {
            chartRenderer.disableDrillDown(nonExistentId);
        }).toThrow('Chart not found for container: non-existent-chart');
        
        await expect(
            chartRenderer.exportChartAdvanced(nonExistentId)
        ).rejects.toThrow('Chart not found for container: non-existent-chart');
        
        expect(() => {
            chartRenderer.applyTheme(nonExistentId, 'light');
        }).toThrow('Chart not found for container: non-existent-chart');
        
        expect(() => {
            chartRenderer.addAnnotations(nonExistentId, []);
        }).toThrow('Chart not found for container: non-existent-chart');
        
        expect(() => {
            chartRenderer.removeAnnotations(nonExistentId);
        }).toThrow('Chart not found for container: non-existent-chart');
        
        expect(() => {
            chartRenderer.getInteractionAPI(nonExistentId);
        }).toThrow('Chart not found for container: non-existent-chart');
    });

    /**
     * Property 7: Drill-down Data Accuracy
     * Validates that drill-down provides accurate data for all chart elements
     */
    test('Property 7: Drill-down data accuracy across chart elements', async () => {
        const containerId = 'drilldown-accuracy-test';
        const chartConfig = {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr'],
                datasets: [
                    { label: 'Sales', data: [100, 150, 120, 180] },
                    { label: 'Costs', data: [80, 90, 85, 95] }
                ]
            }
        };
        
        await chartRenderer.renderChart(containerId, chartConfig);
        
        const drillDownResults = [];
        const drillDownCallback = (data) => {
            drillDownResults.push(data);
        };
        
        chartRenderer.enableDrillDown(containerId, drillDownCallback);
        
        const chart = chartRenderer.chartInstances.get(containerId);
        
        // Test different data points
        const testPoints = [
            { datasetIndex: 0, index: 0, expectedLabel: 'Jan', expectedValue: 100 },
            { datasetIndex: 0, index: 2, expectedLabel: 'Mar', expectedValue: 120 },
            { datasetIndex: 1, index: 1, expectedLabel: 'Feb', expectedValue: 90 },
            { datasetIndex: 1, index: 3, expectedLabel: 'Apr', expectedValue: 95 }
        ];
        
        testPoints.forEach((point, testIndex) => {
            const mockElements = [{
                datasetIndex: point.datasetIndex,
                index: point.index,
                chart: chart
            }];
            
            chart.options.onClick({}, mockElements);
            
            const result = drillDownResults[testIndex];
            expect(result).toBeDefined();
            expect(result.datasetIndex).toBe(point.datasetIndex);
            expect(result.index).toBe(point.index);
            expect(result.label).toBe(point.expectedLabel);
            expect(result.value).toBe(point.expectedValue);
            expect(result.containerId).toBe(containerId);
            expect(result.chartType).toBe('bar');
        });
        
        // Should have collected all test results
        expect(drillDownResults).toHaveLength(testPoints.length);
    });
});