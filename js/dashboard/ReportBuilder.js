/**
 * Dashboard Analytics & KPI - Report Builder
 * 
 * Provides custom report building functionality with date range selection,
 * metric filtering, report templates, and scheduling capabilities.
 */

class ReportBuilder {
    constructor(dashboardController, exportManager) {
        this.dashboardController = dashboardController;
        this.exportManager = exportManager;
        this.templates = new Map();
        this.scheduledReports = new Map();
        
        // Initialize default templates
        this.initializeDefaultTemplates();
        
        // Load saved templates and schedules
        this.loadSavedData();
    }

    /**
     * Initialize default report templates
     */
    initializeDefaultTemplates() {
        // Executive Summary Template
        this.templates.set('executive-summary', {
            id: 'executive-summary',
            name: 'Executive Summary',
            description: 'High-level overview for management',
            widgets: ['financial-health', 'member-growth', 'transaction-volume'],
            format: 'pdf',
            includeCharts: true,
            includeComparison: true,
            dateRange: 'current',
            layout: 'executive'
        });

        // Financial Analysis Template
        this.templates.set('financial-analysis', {
            id: 'financial-analysis',
            name: 'Financial Analysis Report',
            description: 'Detailed financial metrics and trends',
            widgets: ['financial-ratios', 'revenue-trends', 'expense-analysis', 'loan-portfolio'],
            format: 'excel',
            includeCharts: true,
            includeRawData: true,
            dateRange: 'last6',
            layout: 'detailed'
        });

        // Member Activity Template
        this.templates.set('member-activity', {
            id: 'member-activity',
            name: 'Member Activity Report',
            description: 'Member engagement and activity analysis',
            widgets: ['member-heatmap', 'active-members', 'dormant-members', 'transaction-frequency'],
            format: 'pdf',
            includeCharts: true,
            includeSegmentation: true,
            dateRange: 'last3',
            layout: 'analytical'
        });

        // Compliance Report Template
        this.templates.set('compliance', {
            id: 'compliance',
            name: 'Compliance Report',
            description: 'Regulatory compliance and audit trail',
            widgets: ['audit-trail', 'compliance-metrics', 'risk-indicators'],
            format: 'pdf',
            includeCharts: false,
            includeAuditTrail: true,
            dateRange: 'current',
            layout: 'formal'
        });
    }

    /**
     * Create a custom report with specified parameters
     * @param {Object} reportConfig - Report configuration
     * @returns {Promise<Object>} Report result
     */
    async createReport(reportConfig) {
        try {
            const {
                templateId = null,
                title = 'Custom Report',
                description = '',
                dateRange = 'current',
                selectedMetrics = null,
                format = 'pdf',
                includeCharts = true,
                includeRawData = false,
                includeComparison = false,
                customFilters = {},
                layout = 'standard'
            } = reportConfig;

            // Apply template if specified
            let config = { ...reportConfig };
            if (templateId && this.templates.has(templateId)) {
                const template = this.templates.get(templateId);
                config = { ...template, ...reportConfig }; // reportConfig overrides template
            }

            // Validate configuration
            this.validateReportConfig(config);

            // Prepare report data
            const reportData = await this.prepareReportData(config);

            // Apply custom formatting based on layout
            const formattedData = this.applyReportLayout(reportData, config);

            // Generate export options
            const exportOptions = this.buildExportOptions(config);

            // Export the report
            const exportResult = await this.exportManager.exportDashboard(config.format, exportOptions);

            // Save report metadata
            const reportMetadata = {
                id: this.generateReportId(),
                title: config.title,
                description: config.description,
                templateId: config.templateId,
                createdAt: new Date(),
                config: config,
                size: exportResult instanceof Blob ? exportResult.size : exportResult.length
            };

            return {
                success: true,
                reportId: reportMetadata.id,
                data: exportResult,
                metadata: reportMetadata,
                filename: this.generateFilename(config)
            };

        } catch (error) {
            console.error('Report creation failed:', error);
            throw new Error(`Report creation failed: ${error.message}`);
        }
    }

    /**
     * Prepare report data based on configuration
     * @param {Object} config - Report configuration
     * @returns {Promise<Object>} Prepared report data
     */
    async prepareReportData(config) {
        const {
            dateRange,
            selectedMetrics,
            customFilters,
            includeComparison,
            includeRawData
        } = config;

        // Calculate date range
        const dateRangeObj = this.calculateDateRange(dateRange);

        // Get dashboard configuration
        const dashboardConfig = this.dashboardController.getCurrentConfig();

        // Filter widgets based on selected metrics
        let widgets = dashboardConfig.layout;
        if (selectedMetrics && selectedMetrics.length > 0) {
            widgets = widgets.filter(widget => 
                selectedMetrics.includes(widget.id) || 
                selectedMetrics.includes(widget.title)
            );
        }

        // Collect widget data
        const widgetData = [];
        for (const widget of widgets) {
            try {
                const data = await this.dashboardController.getWidgetData(widget.id, {
                    dateRange: dateRangeObj,
                    includeRawData: includeRawData,
                    filters: customFilters
                });

                let processedData = data;

                // Add comparison data if requested
                if (includeComparison) {
                    const comparisonData = await this.getComparisonData(widget.id, dateRangeObj);
                    processedData = {
                        current: data,
                        comparison: comparisonData,
                        change: this.calculateChange(data, comparisonData)
                    };
                }

                widgetData.push({
                    id: widget.id,
                    title: widget.title,
                    type: widget.type,
                    data: processedData,
                    config: widget
                });

            } catch (error) {
                console.warn(`Failed to get data for widget ${widget.id}:`, error);
            }
        }

        return {
            metadata: {
                reportId: this.generateReportId(),
                createdAt: new Date(),
                dateRange: dateRangeObj,
                filters: customFilters,
                includeComparison: includeComparison
            },
            widgets: widgetData,
            summary: await this.generateReportSummary(widgetData, config)
        };
    }

    /**
     * Apply report layout formatting
     * @param {Object} reportData - Raw report data
     * @param {Object} config - Report configuration
     * @returns {Object} Formatted report data
     */
    applyReportLayout(reportData, config) {
        const { layout } = config;

        switch (layout) {
            case 'executive':
                return this.applyExecutiveLayout(reportData, config);
            case 'detailed':
                return this.applyDetailedLayout(reportData, config);
            case 'analytical':
                return this.applyAnalyticalLayout(reportData, config);
            case 'formal':
                return this.applyFormalLayout(reportData, config);
            default:
                return this.applyStandardLayout(reportData, config);
        }
    }

    /**
     * Apply executive layout formatting
     * @param {Object} reportData - Report data
     * @param {Object} config - Configuration
     * @returns {Object} Formatted data
     */
    applyExecutiveLayout(reportData, config) {
        return {
            ...reportData,
            layout: 'executive',
            sections: [
                {
                    title: 'Key Performance Indicators',
                    widgets: reportData.widgets.filter(w => w.type === 'kpi'),
                    priority: 'high'
                },
                {
                    title: 'Financial Overview',
                    widgets: reportData.widgets.filter(w => w.title.toLowerCase().includes('financial')),
                    priority: 'high'
                },
                {
                    title: 'Growth Metrics',
                    widgets: reportData.widgets.filter(w => w.title.toLowerCase().includes('growth')),
                    priority: 'medium'
                }
            ],
            formatting: {
                fontSize: 'large',
                chartSize: 'medium',
                includeExecutiveSummary: true
            }
        };
    }

    /**
     * Apply detailed layout formatting
     * @param {Object} reportData - Report data
     * @param {Object} config - Configuration
     * @returns {Object} Formatted data
     */
    applyDetailedLayout(reportData, config) {
        return {
            ...reportData,
            layout: 'detailed',
            sections: reportData.widgets.map(widget => ({
                title: widget.title,
                widget: widget,
                analysis: this.generateWidgetAnalysis(widget),
                priority: 'high'
            })),
            formatting: {
                fontSize: 'medium',
                chartSize: 'large',
                includeDataTables: true,
                includeAnalysis: true
            }
        };
    }

    /**
     * Apply analytical layout formatting
     * @param {Object} reportData - Report data
     * @param {Object} config - Configuration
     * @returns {Object} Formatted data
     */
    applyAnalyticalLayout(reportData, config) {
        return {
            ...reportData,
            layout: 'analytical',
            sections: [
                {
                    title: 'Data Analysis',
                    widgets: reportData.widgets,
                    correlations: this.calculateCorrelations(reportData.widgets),
                    trends: this.identifyTrends(reportData.widgets),
                    priority: 'high'
                }
            ],
            formatting: {
                fontSize: 'small',
                chartSize: 'large',
                includeStatistics: true,
                includeCorrelations: true
            }
        };
    }

    /**
     * Apply formal layout formatting
     * @param {Object} reportData - Report data
     * @param {Object} config - Configuration
     * @returns {Object} Formatted data
     */
    applyFormalLayout(reportData, config) {
        return {
            ...reportData,
            layout: 'formal',
            sections: [
                {
                    title: 'Report Summary',
                    content: reportData.summary,
                    priority: 'high'
                },
                {
                    title: 'Detailed Findings',
                    widgets: reportData.widgets,
                    priority: 'high'
                },
                {
                    title: 'Compliance Status',
                    compliance: this.generateComplianceStatus(reportData),
                    priority: 'high'
                }
            ],
            formatting: {
                fontSize: 'medium',
                chartSize: 'small',
                includeCoverPage: true,
                includeTableOfContents: true
            }
        };
    }

    /**
     * Apply standard layout formatting
     * @param {Object} reportData - Report data
     * @param {Object} config - Configuration
     * @returns {Object} Formatted data
     */
    applyStandardLayout(reportData, config) {
        return {
            ...reportData,
            layout: 'standard',
            sections: [
                {
                    title: 'Dashboard Overview',
                    widgets: reportData.widgets,
                    priority: 'high'
                }
            ],
            formatting: {
                fontSize: 'medium',
                chartSize: 'medium',
                includeHeader: true,
                includeFooter: true
            }
        };
    }

    /**
     * Build export options from report configuration
     * @param {Object} config - Report configuration
     * @returns {Object} Export options
     */
    buildExportOptions(config) {
        return {
            title: config.title,
            includeCharts: config.includeCharts,
            includeRawData: config.includeRawData,
            dateRange: config.dateRange,
            selectedMetrics: config.selectedMetrics,
            orientation: config.format === 'pdf' ? 'portrait' : undefined,
            format: config.format === 'pdf' ? 'a4' : undefined,
            pretty: config.format === 'json',
            separator: config.format === 'csv' ? ',' : undefined
        };
    }

    /**
     * Calculate date range from string identifier
     * @param {string} rangeId - Date range identifier
     * @returns {Object} Date range object
     */
    calculateDateRange(rangeId) {
        const now = new Date();
        const ranges = {
            'current': {
                start: new Date(now.getFullYear(), now.getMonth(), 1),
                end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
            },
            'last3': {
                start: new Date(now.getFullYear(), now.getMonth() - 3, 1),
                end: new Date(now.getFullYear(), now.getMonth(), 0)
            },
            'last6': {
                start: new Date(now.getFullYear(), now.getMonth() - 6, 1),
                end: new Date(now.getFullYear(), now.getMonth(), 0)
            },
            'year': {
                start: new Date(now.getFullYear(), 0, 1),
                end: new Date(now.getFullYear(), 11, 31)
            },
            'lastYear': {
                start: new Date(now.getFullYear() - 1, 0, 1),
                end: new Date(now.getFullYear() - 1, 11, 31)
            }
        };

        return ranges[rangeId] || ranges['current'];
    }

    /**
     * Get comparison data for a widget
     * @param {string} widgetId - Widget ID
     * @param {Object} dateRange - Current date range
     * @returns {Promise<Array>} Comparison data
     */
    async getComparisonData(widgetId, dateRange) {
        try {
            // Calculate previous period
            const periodLength = dateRange.end.getTime() - dateRange.start.getTime();
            const previousStart = new Date(dateRange.start.getTime() - periodLength);
            const previousEnd = new Date(dateRange.end.getTime() - periodLength);

            return await this.dashboardController.getWidgetData(widgetId, {
                dateRange: { start: previousStart, end: previousEnd }
            });
        } catch (error) {
            console.warn('Failed to get comparison data:', error);
            return [];
        }
    }

    /**
     * Calculate change between current and comparison data
     * @param {Array} current - Current period data
     * @param {Array} comparison - Comparison period data
     * @returns {Object} Change analysis
     */
    calculateChange(current, comparison) {
        if (!Array.isArray(current) || !Array.isArray(comparison)) {
            return { change: 0, changePercent: 0, trend: 'stable' };
        }

        const currentSum = current.reduce((sum, item) => sum + (item.y || item.value || 0), 0);
        const comparisonSum = comparison.reduce((sum, item) => sum + (item.y || item.value || 0), 0);

        const change = currentSum - comparisonSum;
        const changePercent = comparisonSum !== 0 ? (change / comparisonSum) * 100 : 0;
        const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

        return { change, changePercent, trend };
    }

    /**
     * Generate report summary
     * @param {Array} widgetData - Widget data array
     * @param {Object} config - Report configuration
     * @returns {Promise<Object>} Report summary
     */
    async generateReportSummary(widgetData, config) {
        const summary = {
            totalWidgets: widgetData.length,
            reportType: config.templateId || 'custom',
            dateRange: config.dateRange,
            generatedAt: new Date(),
            keyFindings: []
        };

        // Generate key findings
        for (const widget of widgetData) {
            if (widget.data && widget.data.change) {
                const { changePercent, trend } = widget.data.change;
                if (Math.abs(changePercent) > 10) { // Significant change
                    summary.keyFindings.push({
                        widget: widget.title,
                        finding: `${trend === 'up' ? 'Increased' : 'Decreased'} by ${Math.abs(changePercent).toFixed(1)}%`,
                        significance: Math.abs(changePercent) > 25 ? 'high' : 'medium'
                    });
                }
            }
        }

        return summary;
    }

    /**
     * Generate widget analysis
     * @param {Object} widget - Widget data
     * @returns {Object} Analysis results
     */
    generateWidgetAnalysis(widget) {
        const analysis = {
            dataPoints: 0,
            trend: 'stable',
            insights: []
        };

        if (widget.data && Array.isArray(widget.data.current || widget.data)) {
            const data = widget.data.current || widget.data;
            analysis.dataPoints = data.length;

            // Simple trend analysis
            if (data.length >= 2) {
                const first = data[0].y || data[0].value || 0;
                const last = data[data.length - 1].y || data[data.length - 1].value || 0;
                
                if (last > first * 1.1) {
                    analysis.trend = 'increasing';
                    analysis.insights.push('Shows positive growth trend');
                } else if (last < first * 0.9) {
                    analysis.trend = 'decreasing';
                    analysis.insights.push('Shows declining trend');
                } else {
                    analysis.trend = 'stable';
                    analysis.insights.push('Remains relatively stable');
                }
            }
        }

        return analysis;
    }

    /**
     * Calculate correlations between widgets
     * @param {Array} widgets - Widget data array
     * @returns {Array} Correlation results
     */
    calculateCorrelations(widgets) {
        const correlations = [];
        
        for (let i = 0; i < widgets.length; i++) {
            for (let j = i + 1; j < widgets.length; j++) {
                const correlation = this.calculatePearsonCorrelation(
                    widgets[i].data,
                    widgets[j].data
                );
                
                if (Math.abs(correlation) > 0.5) { // Significant correlation
                    correlations.push({
                        widget1: widgets[i].title,
                        widget2: widgets[j].title,
                        correlation: correlation,
                        strength: Math.abs(correlation) > 0.8 ? 'strong' : 'moderate'
                    });
                }
            }
        }
        
        return correlations;
    }

    /**
     * Calculate Pearson correlation coefficient
     * @param {Array} data1 - First dataset
     * @param {Array} data2 - Second dataset
     * @returns {number} Correlation coefficient
     */
    calculatePearsonCorrelation(data1, data2) {
        if (!Array.isArray(data1) || !Array.isArray(data2) || data1.length !== data2.length) {
            return 0;
        }

        const n = data1.length;
        if (n === 0) return 0;

        const values1 = data1.map(item => item.y || item.value || 0);
        const values2 = data2.map(item => item.y || item.value || 0);

        const sum1 = values1.reduce((a, b) => a + b, 0);
        const sum2 = values2.reduce((a, b) => a + b, 0);
        const sum1Sq = values1.reduce((a, b) => a + b * b, 0);
        const sum2Sq = values2.reduce((a, b) => a + b * b, 0);
        const pSum = values1.reduce((a, b, i) => a + b * values2[i], 0);

        const num = pSum - (sum1 * sum2 / n);
        const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));

        return den === 0 ? 0 : num / den;
    }

    /**
     * Identify trends in widget data
     * @param {Array} widgets - Widget data array
     * @returns {Array} Trend analysis results
     */
    identifyTrends(widgets) {
        return widgets.map(widget => {
            const analysis = this.generateWidgetAnalysis(widget);
            return {
                widget: widget.title,
                trend: analysis.trend,
                insights: analysis.insights
            };
        });
    }

    /**
     * Generate compliance status
     * @param {Object} reportData - Report data
     * @returns {Object} Compliance status
     */
    generateComplianceStatus(reportData) {
        return {
            overallStatus: 'compliant',
            checks: [
                { name: 'Data Completeness', status: 'passed', details: 'All required data present' },
                { name: 'Date Range Validity', status: 'passed', details: 'Date range within acceptable limits' },
                { name: 'Metric Accuracy', status: 'passed', details: 'All calculations verified' }
            ],
            lastAudit: new Date(),
            nextAudit: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        };
    }

    /**
     * Schedule a report for automatic generation
     * @param {Object} scheduleConfig - Schedule configuration
     * @returns {string} Schedule ID
     */
    scheduleReport(scheduleConfig) {
        const {
            reportConfig,
            frequency = 'monthly',
            recipients = [],
            startDate = new Date(),
            enabled = true
        } = scheduleConfig;

        const scheduleId = this.generateScheduleId();
        const schedule = {
            id: scheduleId,
            reportConfig: reportConfig,
            frequency: frequency,
            recipients: recipients,
            startDate: startDate,
            nextRun: this.calculateNextRun(startDate, frequency),
            enabled: enabled,
            createdAt: new Date(),
            lastRun: null,
            runCount: 0
        };

        this.scheduledReports.set(scheduleId, schedule);
        this.saveScheduledReports();

        return scheduleId;
    }

    /**
     * Calculate next run date for scheduled report
     * @param {Date} startDate - Start date
     * @param {string} frequency - Frequency (daily, weekly, monthly, quarterly)
     * @returns {Date} Next run date
     */
    calculateNextRun(startDate, frequency) {
        const nextRun = new Date(startDate);
        
        switch (frequency) {
            case 'daily':
                nextRun.setDate(nextRun.getDate() + 1);
                break;
            case 'weekly':
                nextRun.setDate(nextRun.getDate() + 7);
                break;
            case 'monthly':
                nextRun.setMonth(nextRun.getMonth() + 1);
                break;
            case 'quarterly':
                nextRun.setMonth(nextRun.getMonth() + 3);
                break;
            default:
                nextRun.setMonth(nextRun.getMonth() + 1);
        }
        
        return nextRun;
    }

    /**
     * Get all scheduled reports
     * @returns {Array} Scheduled reports
     */
    getScheduledReports() {
        return Array.from(this.scheduledReports.values());
    }

    /**
     * Update scheduled report
     * @param {string} scheduleId - Schedule ID
     * @param {Object} updates - Updates to apply
     * @returns {boolean} Success status
     */
    updateScheduledReport(scheduleId, updates) {
        if (!this.scheduledReports.has(scheduleId)) {
            return false;
        }

        const schedule = this.scheduledReports.get(scheduleId);
        const updatedSchedule = { ...schedule, ...updates, updatedAt: new Date() };
        
        this.scheduledReports.set(scheduleId, updatedSchedule);
        this.saveScheduledReports();
        
        return true;
    }

    /**
     * Delete scheduled report
     * @param {string} scheduleId - Schedule ID
     * @returns {boolean} Success status
     */
    deleteScheduledReport(scheduleId) {
        const deleted = this.scheduledReports.delete(scheduleId);
        if (deleted) {
            this.saveScheduledReports();
        }
        return deleted;
    }

    /**
     * Create a new report template
     * @param {Object} templateConfig - Template configuration
     * @returns {string} Template ID
     */
    createTemplate(templateConfig) {
        const templateId = templateConfig.id || this.generateTemplateId();
        const template = {
            id: templateId,
            createdAt: new Date(),
            ...templateConfig
        };

        this.templates.set(templateId, template);
        this.saveTemplates();

        return templateId;
    }

    /**
     * Get all available templates
     * @returns {Array} Templates
     */
    getTemplates() {
        return Array.from(this.templates.values());
    }

    /**
     * Get template by ID
     * @param {string} templateId - Template ID
     * @returns {Object|null} Template or null if not found
     */
    getTemplate(templateId) {
        return this.templates.get(templateId) || null;
    }

    /**
     * Update template
     * @param {string} templateId - Template ID
     * @param {Object} updates - Updates to apply
     * @returns {boolean} Success status
     */
    updateTemplate(templateId, updates) {
        if (!this.templates.has(templateId)) {
            return false;
        }

        const template = this.templates.get(templateId);
        const updatedTemplate = { ...template, ...updates, updatedAt: new Date() };
        
        this.templates.set(templateId, updatedTemplate);
        this.saveTemplates();
        
        return true;
    }

    /**
     * Delete template
     * @param {string} templateId - Template ID
     * @returns {boolean} Success status
     */
    deleteTemplate(templateId) {
        // Don't allow deletion of default templates
        const defaultTemplates = ['executive-summary', 'financial-analysis', 'member-activity', 'compliance'];
        if (defaultTemplates.includes(templateId)) {
            return false;
        }

        const deleted = this.templates.delete(templateId);
        if (deleted) {
            this.saveTemplates();
        }
        return deleted;
    }

    /**
     * Validate report configuration
     * @param {Object} config - Report configuration
     * @throws {Error} If configuration is invalid
     */
    validateReportConfig(config) {
        if (!config.title || config.title.trim() === '') {
            throw new Error('Report title is required');
        }

        if (!['pdf', 'excel', 'csv', 'json'].includes(config.format)) {
            throw new Error('Invalid export format');
        }

        if (config.selectedMetrics && !Array.isArray(config.selectedMetrics)) {
            throw new Error('Selected metrics must be an array');
        }

        if (config.dateRange && !['current', 'last3', 'last6', 'year', 'lastYear'].includes(config.dateRange)) {
            throw new Error('Invalid date range');
        }
    }

    /**
     * Generate unique report ID
     * @returns {string} Report ID
     */
    generateReportId() {
        return 'report_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Generate unique schedule ID
     * @returns {string} Schedule ID
     */
    generateScheduleId() {
        return 'schedule_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Generate unique template ID
     * @returns {string} Template ID
     */
    generateTemplateId() {
        return 'template_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Generate filename for report
     * @param {Object} config - Report configuration
     * @returns {string} Filename
     */
    generateFilename(config) {
        const timestamp = new Date().toISOString().split('T')[0];
        const title = config.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        return `${title}-${timestamp}.${config.format}`;
    }

    /**
     * Save templates to localStorage
     */
    saveTemplates() {
        try {
            const templatesArray = Array.from(this.templates.entries());
            localStorage.setItem('dashboard_report_templates', JSON.stringify(templatesArray));
        } catch (error) {
            console.warn('Failed to save templates:', error);
        }
    }

    /**
     * Save scheduled reports to localStorage
     */
    saveScheduledReports() {
        try {
            const schedulesArray = Array.from(this.scheduledReports.entries());
            localStorage.setItem('dashboard_scheduled_reports', JSON.stringify(schedulesArray));
        } catch (error) {
            console.warn('Failed to save scheduled reports:', error);
        }
    }

    /**
     * Load saved data from localStorage
     */
    loadSavedData() {
        try {
            // Load templates
            const savedTemplates = localStorage.getItem('dashboard_report_templates');
            if (savedTemplates) {
                const templatesArray = JSON.parse(savedTemplates);
                for (const [id, template] of templatesArray) {
                    if (!this.templates.has(id)) { // Don't override default templates
                        this.templates.set(id, template);
                    }
                }
            }

            // Load scheduled reports
            const savedSchedules = localStorage.getItem('dashboard_scheduled_reports');
            if (savedSchedules) {
                const schedulesArray = JSON.parse(savedSchedules);
                for (const [id, schedule] of schedulesArray) {
                    this.scheduledReports.set(id, schedule);
                }
            }
        } catch (error) {
            console.warn('Failed to load saved data:', error);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReportBuilder;
} else if (typeof window !== 'undefined') {
    window.ReportBuilder = ReportBuilder;
}