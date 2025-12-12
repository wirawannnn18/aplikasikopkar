/**
 * Dashboard Analytics & KPI - Export Manager
 * 
 * Handles multi-format export functionality including PDF reports,
 * Excel exports, and email integration for automated report distribution.
 */

class ExportManager {
    constructor(dashboardController) {
        this.dashboardController = dashboardController;
        this.supportedFormats = ['pdf', 'excel', 'csv', 'json'];
        this.emailConfig = null;
        
        // Initialize export libraries
        this.initializeLibraries();
    }

    /**
     * Initialize required libraries for export functionality
     */
    initializeLibraries() {
        // Check if jsPDF is available for PDF generation
        if (typeof window !== 'undefined' && window.jsPDF) {
            this.pdfLib = window.jsPDF;
        }
        
        // Check if SheetJS is available for Excel generation
        if (typeof window !== 'undefined' && window.XLSX) {
            this.xlsxLib = window.XLSX;
        }
    }

    /**
     * Export dashboard data in specified format
     * @param {string} format - Export format (pdf, excel, csv, json)
     * @param {Object} options - Export options
     * @returns {Promise<Blob|string>} Exported data
     */
    async exportDashboard(format, options = {}) {
        try {
            const dashboardData = await this.prepareDashboardData(options);
            
            switch (format.toLowerCase()) {
                case 'pdf':
                    return await this.exportToPDF(dashboardData, options);
                case 'excel':
                    return await this.exportToExcel(dashboardData, options);
                case 'csv':
                    return await this.exportToCSV(dashboardData, options);
                case 'json':
                    return await this.exportToJSON(dashboardData, options);
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
        } catch (error) {
            console.error('Export failed:', error);
            throw new Error(`Export failed: ${error.message}`);
        }
    }

    /**
     * Prepare dashboard data for export
     * @param {Object} options - Export options
     * @returns {Promise<Object>} Prepared dashboard data
     */
    async prepareDashboardData(options = {}) {
        const {
            dateRange = null,
            selectedMetrics = null,
            includeCharts = true,
            includeRawData = false
        } = options;

        // Get current dashboard configuration
        const dashboardConfig = this.dashboardController.getCurrentConfig();
        
        // Collect data from all widgets
        const widgetData = [];
        for (const widget of dashboardConfig.layout) {
            try {
                const data = await this.dashboardController.getWidgetData(widget.id, {
                    dateRange,
                    includeCharts,
                    includeRawData
                });
                
                if (!selectedMetrics || selectedMetrics.includes(widget.title)) {
                    widgetData.push({
                        id: widget.id,
                        title: widget.title,
                        type: widget.type,
                        data: data,
                        chartImage: includeCharts ? await this.captureWidgetChart(widget.id) : null
                    });
                }
            } catch (error) {
                console.warn(`Failed to get data for widget ${widget.id}:`, error);
            }
        }

        return {
            metadata: {
                exportedAt: new Date(),
                dashboardId: dashboardConfig.id,
                userId: dashboardConfig.userId,
                dateRange: dateRange,
                selectedMetrics: selectedMetrics
            },
            widgets: widgetData,
            summary: await this.generateSummary(widgetData)
        };
    }

    /**
     * Export dashboard to PDF format
     * @param {Object} dashboardData - Prepared dashboard data
     * @param {Object} options - PDF export options
     * @returns {Promise<Blob>} PDF blob
     */
    async exportToPDF(dashboardData, options = {}) {
        if (!this.pdfLib) {
            throw new Error('jsPDF library not available');
        }

        const {
            orientation = 'portrait',
            format = 'a4',
            title = 'Dashboard Report',
            includeCharts = true,
            includeHeader = true,
            includeFooter = true
        } = options;

        const doc = new this.pdfLib.jsPDF({
            orientation: orientation,
            unit: 'mm',
            format: format
        });

        let yPosition = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;

        // Add header
        if (includeHeader) {
            doc.setFontSize(20);
            doc.setFont(undefined, 'bold');
            doc.text(title, margin, yPosition);
            yPosition += 10;

            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            doc.text(`Generated: ${dashboardData.metadata.exportedAt.toLocaleString()}`, margin, yPosition);
            yPosition += 15;
        }

        // Add summary section
        if (dashboardData.summary) {
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('Executive Summary', margin, yPosition);
            yPosition += 10;

            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            
            for (const [key, value] of Object.entries(dashboardData.summary)) {
                if (yPosition > pageHeight - 30) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                doc.text(`${this.formatLabel(key)}: ${this.formatValue(value)}`, margin, yPosition);
                yPosition += 6;
            }
            yPosition += 10;
        }

        // Add widget data
        for (const widget of dashboardData.widgets) {
            // Check if we need a new page
            if (yPosition > pageHeight - 60) {
                doc.addPage();
                yPosition = 20;
            }

            // Widget title
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text(widget.title, margin, yPosition);
            yPosition += 10;

            // Add chart image if available
            if (includeCharts && widget.chartImage) {
                try {
                    const imgWidth = pageWidth - (margin * 2);
                    const imgHeight = 60; // Fixed height for charts
                    
                    doc.addImage(widget.chartImage, 'PNG', margin, yPosition, imgWidth, imgHeight);
                    yPosition += imgHeight + 10;
                } catch (error) {
                    console.warn('Failed to add chart image:', error);
                }
            }

            // Add widget data table
            if (widget.data && Array.isArray(widget.data)) {
                const tableData = this.prepareTableData(widget.data);
                if (tableData.length > 0) {
                    yPosition = this.addTableToPDF(doc, tableData, margin, yPosition, pageWidth - (margin * 2));
                }
            }

            yPosition += 10;
        }

        // Add footer
        if (includeFooter) {
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 10);
            }
        }

        return doc.output('blob');
    }

    /**
     * Export dashboard to Excel format
     * @param {Object} dashboardData - Prepared dashboard data
     * @param {Object} options - Excel export options
     * @returns {Promise<Blob>} Excel blob
     */
    async exportToExcel(dashboardData, options = {}) {
        if (!this.xlsxLib) {
            throw new Error('SheetJS library not available');
        }

        const {
            filename = 'dashboard-report',
            includeCharts = false, // Excel charts are complex, default to false
            separateSheets = true
        } = options;

        const workbook = this.xlsxLib.utils.book_new();

        // Add summary sheet
        if (dashboardData.summary) {
            const summaryData = Object.entries(dashboardData.summary).map(([key, value]) => [
                this.formatLabel(key),
                this.formatValue(value)
            ]);
            
            const summarySheet = this.xlsxLib.utils.aoa_to_sheet([
                ['Metric', 'Value'],
                ...summaryData
            ]);
            
            this.xlsxLib.utils.book_append_sheet(workbook, summarySheet, 'Summary');
        }

        // Add widget data
        if (separateSheets) {
            // Each widget gets its own sheet
            for (const widget of dashboardData.widgets) {
                if (widget.data && Array.isArray(widget.data)) {
                    const sheetData = this.prepareExcelSheetData(widget.data);
                    const worksheet = this.xlsxLib.utils.aoa_to_sheet(sheetData);
                    
                    // Sanitize sheet name (Excel has restrictions)
                    const sheetName = widget.title.replace(/[\\\/\?\*\[\]]/g, '').substring(0, 31);
                    this.xlsxLib.utils.book_append_sheet(workbook, worksheet, sheetName);
                }
            }
        } else {
            // All data in one sheet
            const allData = [];
            allData.push(['Widget', 'Metric', 'Value', 'Date']);
            
            for (const widget of dashboardData.widgets) {
                if (widget.data && Array.isArray(widget.data)) {
                    for (const dataPoint of widget.data) {
                        allData.push([
                            widget.title,
                            dataPoint.label || 'Value',
                            dataPoint.y || dataPoint.value,
                            dataPoint.x || new Date().toISOString()
                        ]);
                    }
                }
            }
            
            const worksheet = this.xlsxLib.utils.aoa_to_sheet(allData);
            this.xlsxLib.utils.book_append_sheet(workbook, worksheet, 'All Data');
        }

        // Generate Excel file
        const excelBuffer = this.xlsxLib.write(workbook, { bookType: 'xlsx', type: 'array' });
        return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    }

    /**
     * Export dashboard to CSV format
     * @param {Object} dashboardData - Prepared dashboard data
     * @param {Object} options - CSV export options
     * @returns {Promise<string>} CSV string
     */
    async exportToCSV(dashboardData, options = {}) {
        const {
            separator = ',',
            includeHeaders = true,
            flattenData = true
        } = options;

        let csvContent = '';
        
        if (includeHeaders) {
            csvContent += `"Widget","Metric","Value","Date","Category"\n`;
        }

        for (const widget of dashboardData.widgets) {
            if (widget.data && Array.isArray(widget.data)) {
                for (const dataPoint of widget.data) {
                    const row = [
                        `"${widget.title}"`,
                        `"${dataPoint.label || 'Value'}"`,
                        dataPoint.y || dataPoint.value || 0,
                        `"${dataPoint.x || new Date().toISOString()}"`,
                        `"${dataPoint.category || widget.type}"`
                    ];
                    csvContent += row.join(separator) + '\n';
                }
            }
        }

        return csvContent;
    }

    /**
     * Export dashboard to JSON format
     * @param {Object} dashboardData - Prepared dashboard data
     * @param {Object} options - JSON export options
     * @returns {Promise<string>} JSON string
     */
    async exportToJSON(dashboardData, options = {}) {
        const {
            pretty = true,
            includeMetadata = true
        } = options;

        const exportData = {
            ...(includeMetadata && { metadata: dashboardData.metadata }),
            summary: dashboardData.summary,
            widgets: dashboardData.widgets.map(widget => ({
                id: widget.id,
                title: widget.title,
                type: widget.type,
                data: widget.data
            }))
        };

        return pretty ? JSON.stringify(exportData, null, 2) : JSON.stringify(exportData);
    }

    /**
     * Send exported report via email
     * @param {Blob|string} exportData - Exported data
     * @param {string} format - Export format
     * @param {Object} emailOptions - Email configuration
     * @returns {Promise<boolean>} Success status
     */
    async sendReportByEmail(exportData, format, emailOptions) {
        const {
            to,
            subject = 'Dashboard Report',
            body = 'Please find the attached dashboard report.',
            filename = `dashboard-report.${format}`
        } = emailOptions;

        try {
            // This would typically integrate with a backend email service
            // For now, we'll create a mailto link with the data
            
            if (typeof exportData === 'string' && exportData.length < 2000) {
                // For small text data, include in email body
                const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body + '\n\n' + exportData)}`;
                window.open(mailtoLink);
                return true;
            } else {
                // For larger data or binary formats, we need a backend service
                console.warn('Email integration requires backend service for file attachments');
                
                // Create download link as fallback
                this.downloadExportedData(exportData, filename, format);
                
                // Open mailto for manual attachment
                const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body + '\n\nPlease find the downloaded file attached.')}`;
                window.open(mailtoLink);
                
                return true;
            }
        } catch (error) {
            console.error('Failed to send email:', error);
            throw new Error(`Email sending failed: ${error.message}`);
        }
    }

    /**
     * Download exported data as file
     * @param {Blob|string} data - Data to download
     * @param {string} filename - File name
     * @param {string} format - File format
     */
    downloadExportedData(data, filename, format) {
        let blob;
        
        if (data instanceof Blob) {
            blob = data;
        } else if (typeof data === 'string') {
            const mimeType = this.getMimeType(format);
            blob = new Blob([data], { type: mimeType });
        } else {
            throw new Error('Invalid data type for download');
        }

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
    }

    /**
     * Get MIME type for format
     * @param {string} format - File format
     * @returns {string} MIME type
     */
    getMimeType(format) {
        const mimeTypes = {
            'pdf': 'application/pdf',
            'excel': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'csv': 'text/csv',
            'json': 'application/json'
        };
        
        return mimeTypes[format.toLowerCase()] || 'application/octet-stream';
    }

    /**
     * Capture widget chart as image
     * @param {string} widgetId - Widget ID
     * @returns {Promise<string>} Base64 image data
     */
    async captureWidgetChart(widgetId) {
        try {
            const widgetElement = document.getElementById(widgetId);
            if (!widgetElement) {
                return null;
            }

            const canvas = widgetElement.querySelector('canvas');
            if (canvas) {
                return canvas.toDataURL('image/png');
            }

            // Fallback: use html2canvas if available
            if (typeof html2canvas !== 'undefined') {
                const canvas = await html2canvas(widgetElement);
                return canvas.toDataURL('image/png');
            }

            return null;
        } catch (error) {
            console.warn('Failed to capture chart image:', error);
            return null;
        }
    }

    /**
     * Generate summary from widget data
     * @param {Array} widgetData - Array of widget data
     * @returns {Object} Summary object
     */
    async generateSummary(widgetData) {
        const summary = {};
        
        try {
            // Count widgets by type
            const widgetTypes = {};
            widgetData.forEach(widget => {
                widgetTypes[widget.type] = (widgetTypes[widget.type] || 0) + 1;
            });
            
            summary['Total Widgets'] = widgetData.length;
            summary['Widget Types'] = Object.keys(widgetTypes).join(', ');
            
            // Extract key metrics
            const kpiWidgets = widgetData.filter(w => w.type === 'kpi');
            if (kpiWidgets.length > 0) {
                summary['Key Metrics Count'] = kpiWidgets.length;
            }
            
            // Add timestamp
            summary['Report Generated'] = new Date().toLocaleString();
            
        } catch (error) {
            console.warn('Failed to generate summary:', error);
        }
        
        return summary;
    }

    /**
     * Format label for display
     * @param {string} label - Raw label
     * @returns {string} Formatted label
     */
    formatLabel(label) {
        return label.replace(/([A-Z])/g, ' $1')
                   .replace(/^./, str => str.toUpperCase())
                   .trim();
    }

    /**
     * Format value for display
     * @param {any} value - Raw value
     * @returns {string} Formatted value
     */
    formatValue(value) {
        if (typeof value === 'number') {
            return value.toLocaleString();
        }
        if (value instanceof Date) {
            return value.toLocaleString();
        }
        return String(value);
    }

    /**
     * Prepare table data for PDF
     * @param {Array} data - Raw data
     * @returns {Array} Table data
     */
    prepareTableData(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return [];
        }

        const headers = ['Metric', 'Value', 'Date'];
        const rows = data.map(item => [
            item.label || 'Value',
            this.formatValue(item.y || item.value),
            item.x ? new Date(item.x).toLocaleDateString() : ''
        ]);

        return [headers, ...rows];
    }

    /**
     * Add table to PDF document
     * @param {Object} doc - jsPDF document
     * @param {Array} tableData - Table data
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Table width
     * @returns {number} New Y position
     */
    addTableToPDF(doc, tableData, x, y, width) {
        const rowHeight = 6;
        const colWidth = width / tableData[0].length;
        
        // Add headers
        doc.setFont(undefined, 'bold');
        doc.setFontSize(9);
        
        for (let i = 0; i < tableData[0].length; i++) {
            doc.text(tableData[0][i], x + (i * colWidth), y);
        }
        
        y += rowHeight;
        
        // Add data rows
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8);
        
        for (let row = 1; row < Math.min(tableData.length, 20); row++) { // Limit rows
            for (let col = 0; col < tableData[row].length; col++) {
                const text = String(tableData[row][col]).substring(0, 20); // Limit text length
                doc.text(text, x + (col * colWidth), y);
            }
            y += rowHeight;
        }
        
        return y + 5;
    }

    /**
     * Prepare data for Excel sheet
     * @param {Array} data - Raw data
     * @returns {Array} Excel sheet data
     */
    prepareExcelSheetData(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return [['No data available']];
        }

        const headers = ['Metric', 'Value', 'Date', 'Category'];
        const rows = data.map(item => [
            item.label || 'Value',
            item.y || item.value || 0,
            item.x || new Date().toISOString(),
            item.category || 'General'
        ]);

        return [headers, ...rows];
    }

    /**
     * Configure email settings
     * @param {Object} config - Email configuration
     */
    configureEmail(config) {
        this.emailConfig = {
            ...this.emailConfig,
            ...config
        };
    }

    /**
     * Get supported export formats
     * @returns {Array} Supported formats
     */
    getSupportedFormats() {
        return [...this.supportedFormats];
    }

    /**
     * Validate export options
     * @param {string} format - Export format
     * @param {Object} options - Export options
     * @returns {boolean} Validation result
     */
    validateExportOptions(format, options) {
        if (!this.supportedFormats.includes(format.toLowerCase())) {
            throw new Error(`Unsupported format: ${format}`);
        }

        if (format === 'pdf' && !this.pdfLib) {
            throw new Error('PDF export requires jsPDF library');
        }

        if (format === 'excel' && !this.xlsxLib) {
            throw new Error('Excel export requires SheetJS library');
        }

        return true;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExportManager;
} else if (typeof window !== 'undefined') {
    window.ExportManager = ExportManager;
}