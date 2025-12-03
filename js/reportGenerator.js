/**
 * Report Generator
 * Generates various audit and validation reports
 */

class ReportGenerator {
    constructor() {
        this.reportTemplates = {};
    }

    /**
     * Generate audit report
     */
    generateAuditReport(auditData) {
        const report = {
            id: AuditUtils.generateId('RPT'),
            type: 'AUDIT',
            generatedAt: AuditUtils.formatDate(),
            generatedBy: AuditUtils.getCurrentUser().username,
            data: auditData,
            summary: this._generateAuditSummary(auditData)
        };

        return report;
    }

    /**
     * Generate validation report
     */
    generateValidationReport(validationResults) {
        const report = {
            id: AuditUtils.generateId('RPT'),
            type: 'VALIDATION',
            generatedAt: AuditUtils.formatDate(),
            generatedBy: AuditUtils.getCurrentUser().username,
            data: validationResults,
            summary: this._generateValidationSummary(validationResults)
        };

        return report;
    }

    /**
     * Generate performance report
     */
    generatePerformanceReport(performanceData) {
        const report = {
            id: AuditUtils.generateId('RPT'),
            type: 'PERFORMANCE',
            generatedAt: AuditUtils.formatDate(),
            generatedBy: AuditUtils.getCurrentUser().username,
            data: performanceData,
            summary: this._generatePerformanceSummary(performanceData)
        };

        return report;
    }

    /**
     * Export report to HTML
     */
    exportToHtml(report) {
        const html = this._generateHtmlReport(report);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `report-${report.type.toLowerCase()}-${new Date().toISOString().split('T')[0]}.html`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    /**
     * Export report to JSON
     */
    exportToJson(report) {
        const json = JSON.stringify(report, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `report-${report.type.toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    /**
     * Print report
     */
    printReport(report) {
        const html = this._generateHtmlReport(report);
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }

    /**
     * Display report in modal
     */
    displayReport(report, containerId = 'reportContainer') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Report container not found');
            return;
        }

        const html = this._generateReportContent(report);
        container.innerHTML = html;
    }

    // Private methods

    _generateAuditSummary(auditData) {
        return {
            totalSpecs: auditData.totalSpecs || 0,
            completedSpecs: auditData.completedSpecs || 0,
            incompleteSpecs: auditData.incompleteSpecs?.length || 0,
            overallCompletion: auditData.overallCompletion || 0,
            criticalIssues: auditData.criticalIssues || 0
        };
    }

    _generateValidationSummary(validationResults) {
        let totalIssues = 0;
        let criticalIssues = 0;
        let warnings = 0;

        if (validationResults.accountingValidation) {
            totalIssues += validationResults.accountingValidation.errors?.length || 0;
            warnings += validationResults.accountingValidation.warnings?.length || 0;
        }

        if (validationResults.dataValidation) {
            totalIssues += validationResults.dataValidation.errors?.length || 0;
            warnings += validationResults.dataValidation.warnings?.length || 0;
        }

        if (validationResults.integrationValidation) {
            totalIssues += validationResults.integrationValidation.errors?.length || 0;
            warnings += validationResults.integrationValidation.warnings?.length || 0;
        }

        return {
            totalIssues,
            criticalIssues,
            warnings,
            isValid: totalIssues === 0
        };
    }

    _generatePerformanceSummary(performanceData) {
        return {
            cacheHitRate: performanceData.cacheHitRate || 0,
            averageLoadTime: performanceData.averageLoadTime || 0,
            storageUsage: performanceData.storageUsage || 0,
            optimizationScore: performanceData.optimizationScore || 0
        };
    }

    _generateHtmlReport(report) {
        const content = this._generateReportContent(report);
        
        return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan ${report.type} - ${new Date(report.generatedAt).toLocaleDateString('id-ID')}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .report-container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .report-header {
            border-bottom: 3px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .report-title {
            font-size: 2rem;
            color: #007bff;
            margin: 0 0 10px 0;
        }
        .report-meta {
            color: #666;
            font-size: 0.9rem;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .summary-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .summary-value {
            font-size: 2.5rem;
            font-weight: 700;
            color: #007bff;
        }
        .summary-label {
            color: #666;
            margin-top: 5px;
        }
        .section {
            margin: 30px 0;
        }
        .section-title {
            font-size: 1.5rem;
            color: #333;
            border-bottom: 2px solid #dee2e6;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #dee2e6;
        }
        th {
            background: #f8f9fa;
            font-weight: 600;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: 600;
        }
        .badge-success { background: #d4edda; color: #155724; }
        .badge-warning { background: #fff3cd; color: #856404; }
        .badge-danger { background: #f8d7da; color: #721c24; }
        .badge-info { background: #d1ecf1; color: #0c5460; }
        @media print {
            body { background: white; }
            .report-container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="report-container">
        ${content}
    </div>
</body>
</html>
        `;
    }

    _generateReportContent(report) {
        const date = new Date(report.generatedAt).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        let content = `
            <div class="report-header">
                <h1 class="report-title">Laporan ${this._getReportTypeName(report.type)}</h1>
                <div class="report-meta">
                    <div>Dibuat: ${date}</div>
                    <div>Oleh: ${report.generatedBy}</div>
                    <div>ID: ${report.id}</div>
                </div>
            </div>
        `;

        // Add summary
        content += this._generateSummaryHtml(report);

        // Add detailed content based on report type
        if (report.type === 'AUDIT') {
            content += this._generateAuditContent(report.data);
        } else if (report.type === 'VALIDATION') {
            content += this._generateValidationContent(report.data);
        } else if (report.type === 'PERFORMANCE') {
            content += this._generatePerformanceContent(report.data);
        }

        return content;
    }

    _generateSummaryHtml(report) {
        const summary = report.summary;
        let html = '<div class="summary-grid">';

        for (const [key, value] of Object.entries(summary)) {
            const label = this._formatLabel(key);
            const formattedValue = this._formatValue(value, key);
            
            html += `
                <div class="summary-card">
                    <div class="summary-value">${formattedValue}</div>
                    <div class="summary-label">${label}</div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    _generateAuditContent(data) {
        let html = '<div class="section">';
        html += '<h2 class="section-title">Detail Audit Spec</h2>';

        if (data.incompleteSpecs && data.incompleteSpecs.length > 0) {
            html += '<table>';
            html += '<thead><tr><th>Spec</th><th>Completion</th><th>Status</th></tr></thead>';
            html += '<tbody>';

            data.incompleteSpecs.forEach(spec => {
                const completion = spec.completionPercentage || 0;
                const badge = completion === 100 ? 'success' : completion >= 50 ? 'warning' : 'danger';
                
                html += `
                    <tr>
                        <td>${spec.name}</td>
                        <td>${completion.toFixed(1)}%</td>
                        <td><span class="badge badge-${badge}">${completion === 100 ? 'Complete' : 'Incomplete'}</span></td>
                    </tr>
                `;
            });

            html += '</tbody></table>';
        }

        html += '</div>';
        return html;
    }

    _generateValidationContent(data) {
        let html = '<div class="section">';
        html += '<h2 class="section-title">Hasil Validasi</h2>';

        // Add validation results
        if (data.accountingValidation) {
            html += this._generateValidationSection('Validasi Akuntansi', data.accountingValidation);
        }

        if (data.dataValidation) {
            html += this._generateValidationSection('Validasi Data', data.dataValidation);
        }

        if (data.integrationValidation) {
            html += this._generateValidationSection('Validasi Integrasi', data.integrationValidation);
        }

        html += '</div>';
        return html;
    }

    _generateValidationSection(title, validation) {
        let html = `<h3>${title}</h3>`;
        
        const status = validation.isValid ? 'success' : 'danger';
        html += `<p>Status: <span class="badge badge-${status}">${validation.isValid ? 'Valid' : 'Invalid'}</span></p>`;

        if (validation.errors && validation.errors.length > 0) {
            html += '<h4>Errors:</h4><ul>';
            validation.errors.forEach(error => {
                html += `<li>${AuditUtils.sanitizeHtml(error)}</li>`;
            });
            html += '</ul>';
        }

        if (validation.warnings && validation.warnings.length > 0) {
            html += '<h4>Warnings:</h4><ul>';
            validation.warnings.forEach(warning => {
                html += `<li>${AuditUtils.sanitizeHtml(warning)}</li>`;
            });
            html += '</ul>';
        }

        return html;
    }

    _generatePerformanceContent(data) {
        let html = '<div class="section">';
        html += '<h2 class="section-title">Metrik Performa</h2>';
        
        // Add performance metrics
        html += '<table>';
        html += '<thead><tr><th>Metrik</th><th>Nilai</th></tr></thead>';
        html += '<tbody>';

        for (const [key, value] of Object.entries(data)) {
            html += `
                <tr>
                    <td>${this._formatLabel(key)}</td>
                    <td>${this._formatValue(value, key)}</td>
                </tr>
            `;
        }

        html += '</tbody></table>';
        html += '</div>';
        return html;
    }

    _getReportTypeName(type) {
        const names = {
            'AUDIT': 'Audit Sistem',
            'VALIDATION': 'Validasi',
            'PERFORMANCE': 'Performa'
        };
        return names[type] || type;
    }

    _formatLabel(key) {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    _formatValue(value, key) {
        if (typeof value === 'number') {
            if (key.includes('Percentage') || key.includes('Rate')) {
                return `${value.toFixed(1)}%`;
            }
            if (key.includes('Time')) {
                return `${value.toFixed(2)}ms`;
            }
            if (key.includes('Usage') || key.includes('Size')) {
                return this._formatBytes(value);
            }
            return value.toLocaleString('id-ID');
        }
        return value;
    }

    _formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// Create global instance
const reportGenerator = new ReportGenerator();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReportGenerator;
}
