/**
 * Dashboard Analytics & KPI - Chart Renderer
 * 
 * Comprehensive chart rendering system supporting multiple chart types,
 * responsive design, and interactive features for data visualization.
 */

class ChartRenderer {
    /**
     * Initialize Chart Renderer
     */
    constructor() {
        this.isInitialized = false;
        this.chartInstances = new Map();
        this.chartConfigs = new Map();
        this.colorPalettes = this.initializeColorPalettes();
        this.defaultOptions = this.initializeDefaultOptions();
        
        // Performance tracking
        this.renderingMetrics = {
            renderTimes: [],
            totalCharts: 0,
            failedRenders: 0,
            averageRenderTime: 0
        };
        
        // Chart.js configuration
        this.chartJsDefaults = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#333',
                    borderWidth: 1
                }
            }
        };
    }

    /**
     * Initialize color palettes for different themes
     * @returns {Object} Color palettes
     */
    initializeColorPalettes() {
        return {
            default: [
                '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
                '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
            ],
            financial: [
                '#059669', '#DC2626', '#D97706', '#7C3AED', '#0891B2',
                '#65A30D', '#C2410C', '#BE185D', '#4338CA', '#0D9488'
            ],
            pastel: [
                '#93C5FD', '#86EFAC', '#FDE68A', '#FCA5A5', '#C4B5FD',
                '#67E8F9', '#BEF264', '#FDBA74', '#F9A8D4', '#A5B4FC'
            ],
            dark: [
                '#1E40AF', '#047857', '#B45309', '#B91C1C', '#6D28D9',
                '#0E7490', '#4D7C0F', '#9A3412', '#A21CAF', '#3730A3'
            ]
        };
    }

    /**
     * Initialize default chart options
     * @returns {Object} Default options by chart type
     */
    initializeDefaultOptions() {
        return {
            line: {
                tension: 0.4,
                fill: false,
                pointRadius: 4,
                pointHoverRadius: 6,
                borderWidth: 2
            },
            bar: {
                borderRadius: 4,
                borderSkipped: false,
                maxBarThickness: 50
            },
            pie: {
                cutout: 0,
                borderWidth: 2,
                hoverBorderWidth: 4
            },
            doughnut: {
                cutout: '60%',
                borderWidth: 2,
                hoverBorderWidth: 4
            },
            radar: {
                pointRadius: 4,
                pointHoverRadius: 6,
                borderWidth: 2,
                fill: true,
                fillOpacity: 0.2
            }
        };
    }

    /**
     * Initialize chart renderer
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            console.log('Initializing Chart Renderer...');
            
            // Check if Chart.js is available
            if (typeof Chart === 'undefined') {
                throw new Error('Chart.js library not found. Please include Chart.js before initializing ChartRenderer.');
            }
            
            // Register Chart.js plugins and components
            this.registerChartJsComponents();
            
            // Setup responsive resize handler
            this.setupResizeHandler();
            
            this.isInitialized = true;
            console.log('Chart Renderer initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Chart Renderer:', error);
            throw error;
        }
    }

    /**
     * Register Chart.js components and plugins
     */
    registerChartJsComponents() {
        // Register default Chart.js components
        Chart.register(
            Chart.CategoryScale,
            Chart.LinearScale,
            Chart.PointElement,
            Chart.LineElement,
            Chart.BarElement,
            Chart.ArcElement,
            Chart.RadialLinearScale,
            Chart.Title,
            Chart.Tooltip,
            Chart.Legend,
            Chart.Filler
        );
        
        // Register custom plugins
        Chart.register({
            id: 'customTooltip',
            afterDraw: (chart) => {
                // Custom tooltip enhancements can be added here
            }
        });
    }

    /**
     * Setup responsive resize handler
     */
    setupResizeHandler() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.resizeAllCharts();
            }, 250);
        });
    }

    /**
     * Render a chart
     * @param {string} containerId - Container element ID
     * @param {Object} config - Chart configuration
     * @returns {Promise<Chart>} Chart instance
     */
    async renderChart(containerId, config) {
        const startTime = performance.now();
        
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }
            
            // Validate configuration
            this.validateChartConfig(config);
            
            // Get container element
            const container = document.getElementById(containerId);
            if (!container) {
                throw new Error(`Container element with ID '${containerId}' not found`);
            }
            
            // Destroy existing chart if present
            if (this.chartInstances.has(containerId)) {
                this.destroyChart(containerId);
            }
            
            // Create canvas element
            const canvas = this.createCanvas(container, containerId);
            
            // Prepare chart configuration
            const chartConfig = this.prepareChartConfig(config);
            
            // Create Chart.js instance
            const chart = new Chart(canvas, chartConfig);
            
            // Store chart instance and config
            this.chartInstances.set(containerId, chart);
            this.chartConfigs.set(containerId, config);
            
            // Update performance metrics
            const renderTime = performance.now() - startTime;
            this.updateRenderingMetrics(renderTime, true);
            
            console.log(`Chart rendered successfully in ${renderTime.toFixed(2)}ms`);
            return chart;
            
        } catch (error) {
            console.error('Failed to render chart:', error);
            this.updateRenderingMetrics(performance.now() - startTime, false);
            throw error;
        }
    }

    /**
     * Create canvas element for chart
     * @param {HTMLElement} container - Container element
     * @param {string} containerId - Container ID
     * @returns {HTMLCanvasElement} Canvas element
     */
    createCanvas(container, containerId) {
        // Clear container
        container.innerHTML = '';
        
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.id = `${containerId}-canvas`;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        
        container.appendChild(canvas);
        return canvas;
    }

    /**
     * Validate chart configuration
     * @param {Object} config - Chart configuration
     */
    validateChartConfig(config) {
        if (!config) {
            throw new Error('Chart configuration is required');
        }
        
        if (!config.type) {
            throw new Error('Chart type is required');
        }
        
        const supportedTypes = ['line', 'bar', 'pie', 'doughnut', 'radar', 'heatmap', 'gauge'];
        if (!supportedTypes.includes(config.type)) {
            throw new Error(`Unsupported chart type: ${config.type}`);
        }
        
        if (!config.data) {
            throw new Error('Chart data is required');
        }
    }

    /**
     * Prepare Chart.js configuration
     * @param {Object} config - Input configuration
     * @returns {Object} Chart.js configuration
     */
    prepareChartConfig(config) {
        const chartType = this.mapChartType(config.type);
        
        return {
            type: chartType,
            data: this.prepareChartData(config.data, config.type),
            options: this.prepareChartOptions(config.options, config.type)
        };
    }

    /**
     * Map custom chart types to Chart.js types
     * @param {string} type - Custom chart type
     * @returns {string} Chart.js chart type
     */
    mapChartType(type) {
        const typeMapping = {
            'heatmap': 'scatter',
            'gauge': 'doughnut'
        };
        
        return typeMapping[type] || type;
    }

    /**
     * Prepare chart data
     * @param {Object} data - Input data
     * @param {string} chartType - Chart type
     * @returns {Object} Chart.js data configuration
     */
    prepareChartData(data, chartType) {
        const colors = this.getColorPalette(data.colorScheme || 'default');
        
        if (chartType === 'heatmap') {
            return this.prepareHeatmapData(data, colors);
        }
        
        if (chartType === 'gauge') {
            return this.prepareGaugeData(data, colors);
        }
        
        return {
            labels: data.labels || [],
            datasets: (data.datasets || []).map((dataset, index) => ({
                ...dataset,
                backgroundColor: dataset.backgroundColor || colors[index % colors.length],
                borderColor: dataset.borderColor || colors[index % colors.length],
                ...this.defaultOptions[chartType]
            }))
        };
    }

    /**
     * Prepare heatmap data
     * @param {Object} data - Input data
     * @param {string[]} colors - Color palette
     * @returns {Object} Heatmap data configuration
     */
    prepareHeatmapData(data, colors) {
        const heatmapData = [];
        
        if (data.matrix) {
            data.matrix.forEach((row, y) => {
                row.forEach((value, x) => {
                    heatmapData.push({
                        x: data.xLabels ? data.xLabels[x] : x,
                        y: data.yLabels ? data.yLabels[y] : y,
                        v: value
                    });
                });
            });
        }
        
        return {
            datasets: [{
                label: data.label || 'Heatmap',
                data: heatmapData,
                backgroundColor: (ctx) => {
                    const value = ctx.parsed.v;
                    const max = Math.max(...data.matrix.flat());
                    const min = Math.min(...data.matrix.flat());
                    const normalized = (value - min) / (max - min);
                    return this.getHeatmapColor(normalized, colors);
                }
            }]
        };
    }

    /**
     * Prepare gauge data
     * @param {Object} data - Input data
     * @param {string[]} colors - Color palette
     * @returns {Object} Gauge data configuration
     */
    prepareGaugeData(data, colors) {
        const value = data.value || 0;
        const max = data.max || 100;
        const remaining = max - value;
        
        return {
            datasets: [{
                data: [value, remaining],
                backgroundColor: [
                    this.getGaugeColor(value / max, colors),
                    'rgba(200, 200, 200, 0.2)'
                ],
                borderWidth: 0,
                cutout: '80%',
                circumference: 180,
                rotation: 270
            }]
        };
    }

    /**
     * Get heatmap color based on value
     * @param {number} normalized - Normalized value (0-1)
     * @param {string[]} colors - Color palette
     * @returns {string} Color
     */
    getHeatmapColor(normalized, colors) {
        if (normalized <= 0.2) return 'rgba(59, 130, 246, 0.3)';
        if (normalized <= 0.4) return 'rgba(59, 130, 246, 0.5)';
        if (normalized <= 0.6) return 'rgba(59, 130, 246, 0.7)';
        if (normalized <= 0.8) return 'rgba(59, 130, 246, 0.9)';
        return 'rgba(59, 130, 246, 1)';
    }

    /**
     * Get gauge color based on value
     * @param {number} normalized - Normalized value (0-1)
     * @param {string[]} colors - Color palette
     * @returns {string} Color
     */
    getGaugeColor(normalized, colors) {
        if (normalized <= 0.3) return '#EF4444'; // Red
        if (normalized <= 0.7) return '#F59E0B'; // Yellow
        return '#10B981'; // Green
    }

    /**
     * Prepare chart options
     * @param {Object} options - Input options
     * @param {string} chartType - Chart type
     * @returns {Object} Chart.js options
     */
    prepareChartOptions(options = {}, chartType) {
        const baseOptions = {
            ...this.chartJsDefaults,
            ...options
        };
        
        // Add chart-specific options
        if (chartType === 'heatmap') {
            return this.prepareHeatmapOptions(baseOptions);
        }
        
        if (chartType === 'gauge') {
            return this.prepareGaugeOptions(baseOptions);
        }
        
        return baseOptions;
    }

    /**
     * Prepare heatmap options
     * @param {Object} baseOptions - Base options
     * @returns {Object} Heatmap options
     */
    prepareHeatmapOptions(baseOptions) {
        return {
            ...baseOptions,
            scales: {
                x: {
                    type: 'category',
                    position: 'bottom'
                },
                y: {
                    type: 'category',
                    position: 'left'
                }
            },
            plugins: {
                ...baseOptions.plugins,
                legend: {
                    display: false
                }
            }
        };
    }

    /**
     * Prepare gauge options
     * @param {Object} baseOptions - Base options
     * @returns {Object} Gauge options
     */
    prepareGaugeOptions(baseOptions) {
        return {
            ...baseOptions,
            plugins: {
                ...baseOptions.plugins,
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            }
        };
    }

    /**
     * Get color palette
     * @param {string} scheme - Color scheme name
     * @returns {string[]} Color array
     */
    getColorPalette(scheme = 'default') {
        return this.colorPalettes[scheme] || this.colorPalettes.default;
    }

    /**
     * Update chart data
     * @param {string} containerId - Container ID
     * @param {Object} newData - New data
     */
    updateChart(containerId, newData) {
        const chart = this.chartInstances.get(containerId);
        if (!chart) {
            console.warn(`Chart not found for container: ${containerId}`);
            return;
        }
        
        try {
            // Update data
            chart.data = this.prepareChartData(newData, this.chartConfigs.get(containerId).type);
            
            // Animate update
            chart.update('active');
            
        } catch (error) {
            console.error('Failed to update chart:', error);
        }
    }

    /**
     * Destroy chart
     * @param {string} containerId - Container ID
     */
    destroyChart(containerId) {
        const chart = this.chartInstances.get(containerId);
        if (chart) {
            chart.destroy();
            this.chartInstances.delete(containerId);
            this.chartConfigs.delete(containerId);
        }
    }

    /**
     * Resize all charts
     */
    resizeAllCharts() {
        this.chartInstances.forEach((chart) => {
            chart.resize();
        });
    }

    /**
     * Update rendering metrics
     * @param {number} renderTime - Render time in milliseconds
     * @param {boolean} success - Whether render was successful
     */
    updateRenderingMetrics(renderTime, success) {
        this.renderingMetrics.totalCharts++;
        
        if (success) {
            this.renderingMetrics.renderTimes.push(renderTime);
            
            // Keep only last 100 render times
            if (this.renderingMetrics.renderTimes.length > 100) {
                this.renderingMetrics.renderTimes.shift();
            }
            
            // Calculate average
            this.renderingMetrics.averageRenderTime = 
                this.renderingMetrics.renderTimes.reduce((a, b) => a + b, 0) / 
                this.renderingMetrics.renderTimes.length;
        } else {
            this.renderingMetrics.failedRenders++;
        }
    }

    /**
     * Get rendering performance metrics
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        return {
            ...this.renderingMetrics,
            successRate: ((this.renderingMetrics.totalCharts - this.renderingMetrics.failedRenders) / 
                         this.renderingMetrics.totalCharts * 100).toFixed(2) + '%'
        };
    }

    /**
     * Export chart as image
     * @param {string} containerId - Container ID
     * @param {string} format - Image format (png, jpeg, webp)
     * @returns {string} Data URL
     */
    exportChart(containerId, format = 'png') {
        const chart = this.chartInstances.get(containerId);
        if (!chart) {
            throw new Error(`Chart not found for container: ${containerId}`);
        }
        
        return chart.toBase64Image(format, 1.0);
    }

    /**
     * Get chart instance
     * @param {string} containerId - Container ID
     * @returns {Chart|null} Chart instance
     */
    getChart(containerId) {
        return this.chartInstances.get(containerId) || null;
    }

    /**
     * Check if renderer is initialized
     * @returns {boolean} Initialization status
     */
    isReady() {
        return this.isInitialized;
    }

    // ========================================
    // INTERACTIVE FEATURES (Task 4.3)
    // ========================================

    /**
     * Enable drill-down functionality for a chart
     * @param {string} containerId - Container ID
     * @param {Function} drillDownCallback - Callback function for drill-down
     * @param {Object} options - Drill-down options
     */
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

        // Add click event listener for drill-down
        chart.options.onClick = (event, elements) => {
            if (elements.length > 0) {
                const element = elements[0];
                const datasetIndex = element.datasetIndex;
                const index = element.index;
                const chart = element.chart;
                
                const drillDownData = {
                    datasetIndex,
                    index,
                    label: chart.data.labels[index],
                    value: chart.data.datasets[datasetIndex].data[index],
                    dataset: chart.data.datasets[datasetIndex],
                    chartType: chart.config.type,
                    containerId
                };

                // Execute drill-down callback
                if (typeof drillDownCallback === 'function') {
                    drillDownCallback(drillDownData);
                }
            }
        };

        // Add hover effects
        if (drillDownOptions.highlightOnHover) {
            chart.options.onHover = (event, elements) => {
                event.native.target.style.cursor = elements.length > 0 ? 
                    drillDownOptions.cursorStyle : 'default';
            };
        }

        // Update chart with new options
        chart.update();

        console.log(`Drill-down enabled for chart: ${containerId}`);
    }

    /**
     * Disable drill-down functionality for a chart
     * @param {string} containerId - Container ID
     */
    disableDrillDown(containerId) {
        const chart = this.chartInstances.get(containerId);
        if (!chart) {
            throw new Error(`Chart not found for container: ${containerId}`);
        }

        // Remove event listeners
        delete chart.options.onClick;
        delete chart.options.onHover;

        // Update chart
        chart.update();

        console.log(`Drill-down disabled for chart: ${containerId}`);
    }

    /**
     * Export chart to various formats
     * @param {string} containerId - Container ID
     * @param {Object} exportOptions - Export configuration
     * @returns {Promise<string|Blob>} Export result
     */
    async exportChartAdvanced(containerId, exportOptions = {}) {
        const chart = this.chartInstances.get(containerId);
        if (!chart) {
            throw new Error(`Chart not found for container: ${containerId}`);
        }

        const options = {
            format: 'png', // png, jpeg, webp, svg, pdf
            quality: 1.0,
            width: null,
            height: null,
            backgroundColor: '#ffffff',
            filename: `chart-${containerId}-${Date.now()}`,
            download: false,
            ...exportOptions
        };

        try {
            let exportData;

            if (options.format === 'svg') {
                exportData = await this.exportToSVG(chart, options);
            } else if (options.format === 'pdf') {
                exportData = await this.exportToPDF(chart, options);
            } else {
                // PNG, JPEG, WebP
                exportData = chart.toBase64Image(options.format, options.quality);
            }

            // Auto-download if requested
            if (options.download) {
                this.downloadExport(exportData, options.filename, options.format);
            }

            return exportData;

        } catch (error) {
            console.error('Failed to export chart:', error);
            throw error;
        }
    }

    /**
     * Export chart to SVG format
     * @param {Chart} chart - Chart instance
     * @param {Object} options - Export options
     * @returns {Promise<string>} SVG string
     */
    async exportToSVG(chart, options) {
        // Create a temporary canvas for SVG conversion
        const canvas = chart.canvas;
        const ctx = canvas.getContext('2d');
        
        // Get chart dimensions
        const width = options.width || canvas.width;
        const height = options.height || canvas.height;
        
        // Create SVG string
        const svgString = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <foreignObject width="100%" height="100%">
                    <div xmlns="http://www.w3.org/1999/xhtml">
                        <canvas width="${width}" height="${height}"></canvas>
                    </div>
                </foreignObject>
            </svg>
        `;
        
        // For now, return the base64 image embedded in SVG
        const imageData = chart.toBase64Image('png', options.quality);
        const svgWithImage = `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <image href="${imageData}" width="${width}" height="${height}"/>
            </svg>
        `;
        
        return svgWithImage;
    }

    /**
     * Export chart to PDF format
     * @param {Chart} chart - Chart instance
     * @param {Object} options - Export options
     * @returns {Promise<Blob>} PDF blob
     */
    async exportToPDF(chart, options) {
        // This is a simplified PDF export
        // In a real implementation, you would use a library like jsPDF
        const imageData = chart.toBase64Image('png', options.quality);
        
        // Create a simple PDF-like structure (this is a mock implementation)
        const pdfContent = {
            format: 'pdf',
            image: imageData,
            width: options.width || chart.canvas.width,
            height: options.height || chart.canvas.height,
            title: options.filename || 'Chart Export'
        };
        
        // Convert to blob (mock implementation)
        const pdfString = JSON.stringify(pdfContent);
        return new Blob([pdfString], { type: 'application/json' }); // Mock PDF
    }

    /**
     * Download exported chart
     * @param {string|Blob} data - Export data
     * @param {string} filename - File name
     * @param {string} format - File format
     */
    downloadExport(data, filename, format) {
        const link = document.createElement('a');
        
        if (data instanceof Blob) {
            link.href = URL.createObjectURL(data);
        } else {
            link.href = data;
        }
        
        link.download = `${filename}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up object URL if it was created
        if (data instanceof Blob) {
            URL.revokeObjectURL(link.href);
        }
    }

    /**
     * Apply theme to chart
     * @param {string} containerId - Container ID
     * @param {Object} theme - Theme configuration
     */
    applyTheme(containerId, theme) {
        const chart = this.chartInstances.get(containerId);
        if (!chart) {
            throw new Error(`Chart not found for container: ${containerId}`);
        }

        const themeConfig = this.getThemeConfig(theme);
        
        // Apply theme to chart options
        this.mergeThemeOptions(chart.options, themeConfig);
        
        // Apply theme to data (colors)
        if (themeConfig.colors) {
            chart.data.datasets.forEach((dataset, index) => {
                const colorIndex = index % themeConfig.colors.length;
                dataset.backgroundColor = themeConfig.colors[colorIndex];
                dataset.borderColor = themeConfig.colors[colorIndex];
            });
        }
        
        // Update chart
        chart.update();
        
        console.log(`Theme applied to chart: ${containerId}`);
    }

    /**
     * Get theme configuration
     * @param {string|Object} theme - Theme name or configuration
     * @returns {Object} Theme configuration
     */
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
            },
            vibrant: {
                backgroundColor: '#ffffff',
                textColor: '#333333',
                gridColor: '#e0e0e0',
                colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD']
            }
        };

        if (typeof theme === 'string') {
            return predefinedThemes[theme] || predefinedThemes.light;
        }

        return { ...predefinedThemes.light, ...theme };
    }

    /**
     * Merge theme options with chart options
     * @param {Object} chartOptions - Chart options
     * @param {Object} themeConfig - Theme configuration
     */
    mergeThemeOptions(chartOptions, themeConfig) {
        // Apply background color
        if (themeConfig.backgroundColor) {
            chartOptions.plugins = chartOptions.plugins || {};
            chartOptions.plugins.legend = chartOptions.plugins.legend || {};
            chartOptions.plugins.legend.labels = chartOptions.plugins.legend.labels || {};
            chartOptions.plugins.legend.labels.color = themeConfig.textColor;
        }

        // Apply grid colors
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

        // Apply text colors
        if (themeConfig.textColor) {
            chartOptions.plugins = chartOptions.plugins || {};
            chartOptions.plugins.title = chartOptions.plugins.title || {};
            chartOptions.plugins.title.color = themeConfig.textColor;
        }
    }

    /**
     * Add custom annotations to chart
     * @param {string} containerId - Container ID
     * @param {Array} annotations - Array of annotation objects
     */
    addAnnotations(containerId, annotations) {
        const chart = this.chartInstances.get(containerId);
        if (!chart) {
            throw new Error(`Chart not found for container: ${containerId}`);
        }

        // Initialize annotations plugin options
        chart.options.plugins = chart.options.plugins || {};
        chart.options.plugins.annotation = chart.options.plugins.annotation || {
            annotations: {}
        };

        // Add each annotation
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

        // Update chart
        chart.update();

        console.log(`Annotations added to chart: ${containerId}`);
    }

    /**
     * Remove annotations from chart
     * @param {string} containerId - Container ID
     * @param {Array} annotationIds - Array of annotation IDs to remove
     */
    removeAnnotations(containerId, annotationIds = []) {
        const chart = this.chartInstances.get(containerId);
        if (!chart) {
            throw new Error(`Chart not found for container: ${containerId}`);
        }

        if (!chart.options.plugins?.annotation?.annotations) {
            return;
        }

        if (annotationIds.length === 0) {
            // Remove all annotations
            chart.options.plugins.annotation.annotations = {};
        } else {
            // Remove specific annotations
            annotationIds.forEach(id => {
                delete chart.options.plugins.annotation.annotations[id];
            });
        }

        // Update chart
        chart.update();

        console.log(`Annotations removed from chart: ${containerId}`);
    }

    /**
     * Enable chart zoom and pan functionality
     * @param {string} containerId - Container ID
     * @param {Object} zoomOptions - Zoom configuration
     */
    enableZoomPan(containerId, zoomOptions = {}) {
        const chart = this.chartInstances.get(containerId);
        if (!chart) {
            throw new Error(`Chart not found for container: ${containerId}`);
        }

        const options = {
            zoom: {
                enabled: true,
                mode: 'x',
                sensitivity: 0.1,
                ...zoomOptions.zoom
            },
            pan: {
                enabled: true,
                mode: 'x',
                ...zoomOptions.pan
            }
        };

        // Add zoom plugin options
        chart.options.plugins = chart.options.plugins || {};
        chart.options.plugins.zoom = options;

        // Update chart
        chart.update();

        console.log(`Zoom and pan enabled for chart: ${containerId}`);
    }

    /**
     * Reset chart zoom
     * @param {string} containerId - Container ID
     */
    resetZoom(containerId) {
        const chart = this.chartInstances.get(containerId);
        if (!chart && typeof chart.resetZoom === 'function') {
            chart.resetZoom();
        }
    }

    /**
     * Add custom tooltip formatter
     * @param {string} containerId - Container ID
     * @param {Function} formatter - Tooltip formatter function
     */
    setCustomTooltip(containerId, formatter) {
        const chart = this.chartInstances.get(containerId);
        if (!chart) {
            throw new Error(`Chart not found for container: ${containerId}`);
        }

        chart.options.plugins = chart.options.plugins || {};
        chart.options.plugins.tooltip = chart.options.plugins.tooltip || {};
        
        chart.options.plugins.tooltip.callbacks = {
            ...chart.options.plugins.tooltip.callbacks,
            label: formatter
        };

        // Update chart
        chart.update();

        console.log(`Custom tooltip set for chart: ${containerId}`);
    }

    /**
     * Get chart interaction data
     * @param {string} containerId - Container ID
     * @returns {Object} Interaction data and methods
     */
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
            removeAnnotations: (ids) => this.removeAnnotations(containerId, ids),
            enableZoomPan: (options) => this.enableZoomPan(containerId, options),
            resetZoom: () => this.resetZoom(containerId),
            setCustomTooltip: (formatter) => this.setCustomTooltip(containerId, formatter),
            updateData: (newData) => this.updateChart(containerId, newData),
            destroy: () => this.destroyChart(containerId)
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartRenderer;
} else if (typeof window !== 'undefined') {
    window.ChartRenderer = ChartRenderer;
}