/**
 * Import Results and Statistics Manager
 * Handles display and management of import results with detailed statistics
 * 
 * Requirements: 4.5, 5.4
 */

class ImportResultsManager {
    constructor(options = {}) {
        this.container = options.container || null;
        this.auditLogger = options.auditLogger || null;
        this.onExport = options.onExport || null;
        this.onRetry = options.onRetry || null;
        
        this.currentResults = null;
        this.sessionId = null;
        this.importHistory = this.loadImportHistory();
    }

    /**
     * Display import results with comprehensive statistics
     * @param {Object} results - Import results data
     * @param {string} sessionId - Import session ID
     */
    displayResults(results, sessionId) {
        this.currentResults = results;
        this.sessionId = sessionId;
        
        // Save to history
        this.saveToHistory(results, sessionId);
        
        if (this.container) {
            this.renderResults();
        }
        
        return this.generateResultsSummary();
    }

    /**
     * Generate comprehensive results summary
     * @returns {Object} Results summary
     */
    generateResultsSummary() {
        if (!this.currentResults) {
            return null;
        }

        const summary = {
            // Basic counts
            totalRecords: this.currentResults.totalRecords || 0,
            processedRecords: this.currentResults.processedRecords || 0,
            successfulRecords: this.currentResults.successfulRecords || 0,
            createdRecords: this.currentResults.createdRecords || 0,
            updatedRecords: this.currentResults.updatedRecords || 0,
            failedRecords: this.currentResults.failedRecords || 0,
            
            // Calculated percentages
            successRate: this.calculateSuccessRate(),
            failureRate: this.calculateFailureRate(),
            updateRate: this.calculateUpdateRate(),
            
            // Performance metrics
            performanceMetrics: this.currentResults.performanceMetrics || {},
            
            // Status determination
            status: this.determineImportStatus(),
            
            // Detailed breakdown
            breakdown: this.generateDetailedBreakdown(),
            
            // Recommendations
            recommendations: this.generateRecommendations(),
            
            // Session info
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            
            // Export options
            exportOptions: this.getExportOptions()
        };

        return summary;
    }

    /**
     * Calculate success rate percentage
     * @returns {number} Success rate (0-100)
     */
    calculateSuccessRate() {
        if (!this.currentResults || this.currentResults.totalRecords === 0) {
            return 0;
        }
        
        return Math.round((this.currentResults.successfulRecords / this.currentResults.totalRecords) * 100);
    }

    /**
     * Calculate failure rate percentage
     * @returns {number} Failure rate (0-100)
     */
    calculateFailureRate() {
        if (!this.currentResults || this.currentResults.totalRecords === 0) {
            return 0;
        }
        
        return Math.round((this.currentResults.failedRecords / this.currentResults.totalRecords) * 100);
    }

    /**
     * Calculate update rate percentage
     * @returns {number} Update rate (0-100)
     */
    calculateUpdateRate() {
        if (!this.currentResults || this.currentResults.successfulRecords === 0) {
            return 0;
        }
        
        return Math.round((this.currentResults.updatedRecords / this.currentResults.successfulRecords) * 100);
    }

    /**
     * Determine overall import status
     * @returns {string} Status (success, partial_success, failure)
     */
    determineImportStatus() {
        if (!this.currentResults) {
            return 'unknown';
        }

        const successRate = this.calculateSuccessRate();
        
        if (successRate === 100) {
            return 'success';
        } else if (successRate >= 50) {
            return 'partial_success';
        } else if (successRate > 0) {
            return 'mostly_failed';
        } else {
            return 'failure';
        }
    }

    /**
     * Generate detailed breakdown of results
     * @returns {Object} Detailed breakdown
     */
    generateDetailedBreakdown() {
        if (!this.currentResults) {
            return {};
        }

        const breakdown = {
            // Record type breakdown
            recordTypes: {
                new: this.currentResults.createdRecords || 0,
                updated: this.currentResults.updatedRecords || 0,
                failed: this.currentResults.failedRecords || 0
            },
            
            // Error breakdown
            errorBreakdown: this.analyzeErrors(),
            
            // Performance breakdown
            performanceBreakdown: this.analyzePerformance(),
            
            // Category breakdown (if available)
            categoryBreakdown: this.analyzeCategoryDistribution(),
            
            // Time breakdown
            timeBreakdown: this.analyzeTimeDistribution()
        };

        return breakdown;
    }

    /**
     * Analyze error patterns
     * @returns {Object} Error analysis
     */
    analyzeErrors() {
        if (!this.currentResults.errors || this.currentResults.errors.length === 0) {
            return {
                totalErrors: 0,
                errorTypes: {},
                commonErrors: [],
                errorRate: 0
            };
        }

        const errorTypes = {};
        const errorMessages = {};
        
        this.currentResults.errors.forEach(error => {
            // Count by error type
            const errorType = error.type || 'unknown';
            errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
            
            // Count by error message
            const message = error.message || 'Unknown error';
            errorMessages[message] = (errorMessages[message] || 0) + 1;
        });

        // Find most common errors
        const commonErrors = Object.entries(errorMessages)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([message, count]) => ({ message, count }));

        return {
            totalErrors: this.currentResults.errors.length,
            errorTypes: errorTypes,
            commonErrors: commonErrors,
            errorRate: this.calculateFailureRate()
        };
    }

    /**
     * Analyze performance metrics
     * @returns {Object} Performance analysis
     */
    analyzePerformance() {
        const metrics = this.currentResults.performanceMetrics || {};
        
        return {
            recordsPerSecond: metrics.recordsPerSecond || 0,
            totalProcessingTime: metrics.totalProcessingTime || 0,
            averageChunkTime: metrics.averageChunkTime || 0,
            memoryUsage: metrics.memoryUsage || 0,
            
            // Performance rating
            performanceRating: this.calculatePerformanceRating(metrics),
            
            // Efficiency metrics
            efficiency: {
                timePerRecord: metrics.totalProcessingTime ? 
                    (metrics.totalProcessingTime / this.currentResults.totalRecords) : 0,
                throughput: metrics.recordsPerSecond || 0,
                resourceUtilization: this.calculateResourceUtilization(metrics)
            }
        };
    }

    /**
     * Calculate performance rating
     * @param {Object} metrics - Performance metrics
     * @returns {string} Performance rating (excellent, good, fair, poor)
     */
    calculatePerformanceRating(metrics) {
        const recordsPerSecond = metrics.recordsPerSecond || 0;
        
        if (recordsPerSecond >= 100) return 'excellent';
        if (recordsPerSecond >= 50) return 'good';
        if (recordsPerSecond >= 20) return 'fair';
        return 'poor';
    }

    /**
     * Calculate resource utilization
     * @param {Object} metrics - Performance metrics
     * @returns {string} Resource utilization level
     */
    calculateResourceUtilization(metrics) {
        const memoryUsage = metrics.memoryUsage || 0;
        const processingTime = metrics.totalProcessingTime || 0;
        
        // Simple heuristic based on memory and time
        if (memoryUsage > 100 * 1024 * 1024 || processingTime > 30000) {
            return 'high';
        } else if (memoryUsage > 50 * 1024 * 1024 || processingTime > 10000) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    /**
     * Analyze category distribution
     * @returns {Object} Category analysis
     */
    analyzeCategoryDistribution() {
        // This would analyze the distribution of categories in the imported data
        // For now, return a placeholder structure
        return {
            totalCategories: 0,
            newCategories: 0,
            categoryDistribution: {},
            topCategories: []
        };
    }

    /**
     * Analyze time distribution
     * @returns {Object} Time analysis
     */
    analyzeTimeDistribution() {
        const metrics = this.currentResults.performanceMetrics || {};
        
        return {
            totalTime: metrics.totalProcessingTime || 0,
            averageTimePerChunk: metrics.averageChunkTime || 0,
            timePerRecord: metrics.totalProcessingTime ? 
                (metrics.totalProcessingTime / this.currentResults.totalRecords) : 0,
            
            // Time breakdown by phase
            phases: {
                validation: 0, // Would be tracked separately
                processing: metrics.totalProcessingTime || 0,
                finalization: 0 // Would be tracked separately
            }
        };
    }

    /**
     * Generate recommendations based on results
     * @returns {Array} Array of recommendation objects
     */
    generateRecommendations() {
        const recommendations = [];
        
        if (!this.currentResults) {
            return recommendations;
        }

        const successRate = this.calculateSuccessRate();
        const failureRate = this.calculateFailureRate();
        const performance = this.analyzePerformance();

        // Success rate recommendations
        if (successRate < 50) {
            recommendations.push({
                type: 'error',
                title: 'High Failure Rate',
                message: 'Lebih dari 50% data gagal diimport. Periksa format data dan perbaiki error yang ada.',
                action: 'review_errors',
                priority: 'high'
            });
        } else if (successRate < 90) {
            recommendations.push({
                type: 'warning',
                title: 'Moderate Failure Rate',
                message: 'Beberapa data gagal diimport. Tinjau error dan pertimbangkan untuk memperbaiki data.',
                action: 'review_errors',
                priority: 'medium'
            });
        }

        // Performance recommendations
        if (performance.performanceRating === 'poor') {
            recommendations.push({
                type: 'info',
                title: 'Performance Optimization',
                message: 'Performa import dapat ditingkatkan. Pertimbangkan untuk mengurangi ukuran file atau meningkatkan chunk size.',
                action: 'optimize_performance',
                priority: 'low'
            });
        }

        // Data quality recommendations
        const errorAnalysis = this.analyzeErrors();
        if (errorAnalysis.commonErrors.length > 0) {
            recommendations.push({
                type: 'info',
                title: 'Data Quality Improvement',
                message: `Error paling umum: ${errorAnalysis.commonErrors[0].message}. Perbaiki pola error ini untuk meningkatkan success rate.`,
                action: 'improve_data_quality',
                priority: 'medium'
            });
        }

        // Success recommendations
        if (successRate === 100) {
            recommendations.push({
                type: 'success',
                title: 'Import Berhasil',
                message: 'Semua data berhasil diimport dengan sempurna!',
                action: 'none',
                priority: 'info'
            });
        }

        return recommendations;
    }

    /**
     * Get available export options
     * @returns {Array} Export options
     */
    getExportOptions() {
        return [
            {
                type: 'summary_pdf',
                label: 'Export Summary (PDF)',
                description: 'Export ringkasan hasil import dalam format PDF'
            },
            {
                type: 'detailed_excel',
                label: 'Export Detailed Report (Excel)',
                description: 'Export laporan detail termasuk error log dalam format Excel'
            },
            {
                type: 'error_log_csv',
                label: 'Export Error Log (CSV)',
                description: 'Export daftar error dalam format CSV'
            },
            {
                type: 'audit_trail_json',
                label: 'Export Audit Trail (JSON)',
                description: 'Export audit trail lengkap dalam format JSON'
            }
        ];
    }

    /**
     * Render results in the container
     */
    renderResults() {
        if (!this.container) {
            return;
        }

        const summary = this.generateResultsSummary();
        const html = this.generateResultsHTML(summary);
        
        this.container.innerHTML = html;
        this.attachEventListeners();
    }

    /**
     * Generate HTML for results display
     * @param {Object} summary - Results summary
     * @returns {string} HTML string
     */
    generateResultsHTML(summary) {
        const statusClass = this.getStatusClass(summary.status);
        const statusIcon = this.getStatusIcon(summary.status);
        
        return `
            <div class="import-results-container">
                <div class="results-header">
                    <div class="status-indicator ${statusClass}">
                        <i class="${statusIcon}"></i>
                        <h3>${this.getStatusTitle(summary.status)}</h3>
                    </div>
                    <div class="results-actions">
                        <button class="btn btn-outline-primary" onclick="this.exportResults('summary_pdf')">
                            <i class="fas fa-download"></i> Export Summary
                        </button>
                        <button class="btn btn-outline-secondary" onclick="this.viewAuditTrail()">
                            <i class="fas fa-history"></i> View Audit Trail
                        </button>
                    </div>
                </div>

                <div class="results-overview">
                    <div class="row">
                        <div class="col-md-3">
                            <div class="stat-card">
                                <div class="stat-number">${summary.totalRecords}</div>
                                <div class="stat-label">Total Records</div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card success">
                                <div class="stat-number">${summary.successfulRecords}</div>
                                <div class="stat-label">Successful</div>
                                <div class="stat-percentage">${summary.successRate}%</div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card ${summary.failedRecords > 0 ? 'danger' : ''}">
                                <div class="stat-number">${summary.failedRecords}</div>
                                <div class="stat-label">Failed</div>
                                <div class="stat-percentage">${summary.failureRate}%</div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="stat-card info">
                                <div class="stat-number">${summary.updatedRecords}</div>
                                <div class="stat-label">Updated</div>
                                <div class="stat-percentage">${summary.updateRate}%</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="results-details">
                    <div class="row">
                        <div class="col-md-6">
                            ${this.generatePerformanceSection(summary.breakdown.performanceBreakdown)}
                        </div>
                        <div class="col-md-6">
                            ${this.generateErrorSection(summary.breakdown.errorBreakdown)}
                        </div>
                    </div>
                </div>

                ${this.generateRecommendationsSection(summary.recommendations)}
                
                <div class="results-actions-footer">
                    <div class="row">
                        <div class="col-md-6">
                            <h5>Export Options</h5>
                            ${this.generateExportOptions(summary.exportOptions)}
                        </div>
                        <div class="col-md-6">
                            <h5>Next Actions</h5>
                            ${this.generateNextActions(summary)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate performance section HTML
     * @param {Object} performance - Performance data
     * @returns {string} HTML string
     */
    generatePerformanceSection(performance) {
        return `
            <div class="card">
                <div class="card-header">
                    <h5><i class="fas fa-tachometer-alt"></i> Performance Metrics</h5>
                </div>
                <div class="card-body">
                    <div class="performance-metrics">
                        <div class="metric">
                            <span class="metric-label">Records/Second:</span>
                            <span class="metric-value">${Math.round(performance.recordsPerSecond || 0)}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Total Time:</span>
                            <span class="metric-value">${this.formatDuration(performance.totalProcessingTime || 0)}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Performance:</span>
                            <span class="metric-value badge badge-${this.getPerformanceBadgeClass(performance.performanceRating)}">
                                ${performance.performanceRating || 'unknown'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate error section HTML
     * @param {Object} errorBreakdown - Error data
     * @returns {string} HTML string
     */
    generateErrorSection(errorBreakdown) {
        if (errorBreakdown.totalErrors === 0) {
            return `
                <div class="card">
                    <div class="card-header">
                        <h5><i class="fas fa-check-circle text-success"></i> No Errors</h5>
                    </div>
                    <div class="card-body">
                        <p class="text-success">All records processed successfully!</p>
                    </div>
                </div>
            `;
        }

        const commonErrorsHTML = errorBreakdown.commonErrors
            .map(error => `
                <div class="error-item">
                    <span class="error-message">${error.message}</span>
                    <span class="error-count badge badge-danger">${error.count}</span>
                </div>
            `).join('');

        return `
            <div class="card">
                <div class="card-header">
                    <h5><i class="fas fa-exclamation-triangle text-warning"></i> Error Summary</h5>
                </div>
                <div class="card-body">
                    <div class="error-summary">
                        <p><strong>Total Errors:</strong> ${errorBreakdown.totalErrors}</p>
                        <h6>Most Common Errors:</h6>
                        <div class="common-errors">
                            ${commonErrorsHTML}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generate recommendations section HTML
     * @param {Array} recommendations - Recommendations array
     * @returns {string} HTML string
     */
    generateRecommendationsSection(recommendations) {
        if (recommendations.length === 0) {
            return '';
        }

        const recommendationsHTML = recommendations
            .map(rec => `
                <div class="alert alert-${this.getRecommendationAlertClass(rec.type)} alert-dismissible">
                    <strong>${rec.title}:</strong> ${rec.message}
                    ${rec.action !== 'none' ? `<button class="btn btn-sm btn-outline-${rec.type} ml-2" onclick="this.handleRecommendationAction('${rec.action}')">Take Action</button>` : ''}
                </div>
            `).join('');

        return `
            <div class="recommendations-section">
                <h5><i class="fas fa-lightbulb"></i> Recommendations</h5>
                ${recommendationsHTML}
            </div>
        `;
    }

    /**
     * Generate export options HTML
     * @param {Array} exportOptions - Export options
     * @returns {string} HTML string
     */
    generateExportOptions(exportOptions) {
        return exportOptions
            .map(option => `
                <button class="btn btn-outline-secondary btn-sm mb-2 d-block" onclick="this.exportResults('${option.type}')">
                    ${option.label}
                </button>
            `).join('');
    }

    /**
     * Generate next actions HTML
     * @param {Object} summary - Results summary
     * @returns {string} HTML string
     */
    generateNextActions(summary) {
        const actions = [];
        
        if (summary.failedRecords > 0) {
            actions.push(`<button class="btn btn-warning btn-sm mb-2 d-block" onclick="this.retryFailedRecords()">Retry Failed Records</button>`);
        }
        
        actions.push(`<button class="btn btn-primary btn-sm mb-2 d-block" onclick="this.startNewImport()">Start New Import</button>`);
        actions.push(`<button class="btn btn-info btn-sm mb-2 d-block" onclick="this.viewImportHistory()">View Import History</button>`);
        
        return actions.join('');
    }

    /**
     * Save results to import history
     * @param {Object} results - Import results
     * @param {string} sessionId - Session ID
     */
    saveToHistory(results, sessionId) {
        const historyEntry = {
            sessionId: sessionId,
            timestamp: new Date().toISOString(),
            summary: this.generateResultsSummary(),
            fileName: results.fileName || 'Unknown',
            status: this.determineImportStatus()
        };

        this.importHistory.unshift(historyEntry);
        
        // Keep only last 50 entries
        if (this.importHistory.length > 50) {
            this.importHistory = this.importHistory.slice(0, 50);
        }

        this.saveImportHistory();
    }

    /**
     * Load import history from localStorage
     * @returns {Array} Import history
     */
    loadImportHistory() {
        try {
            const stored = localStorage.getItem('excel_upload_import_history');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading import history:', error);
            return [];
        }
    }

    /**
     * Save import history to localStorage
     */
    saveImportHistory() {
        try {
            localStorage.setItem('excel_upload_import_history', JSON.stringify(this.importHistory));
        } catch (error) {
            console.error('Error saving import history:', error);
        }
    }

    /**
     * Attach event listeners to the rendered elements
     */
    attachEventListeners() {
        // Event listeners would be attached here for interactive elements
        // This is a placeholder for the actual implementation
    }

    /**
     * Utility methods for HTML generation
     */
    getStatusClass(status) {
        const classes = {
            'success': 'status-success',
            'partial_success': 'status-warning',
            'mostly_failed': 'status-danger',
            'failure': 'status-danger',
            'unknown': 'status-secondary'
        };
        return classes[status] || 'status-secondary';
    }

    getStatusIcon(status) {
        const icons = {
            'success': 'fas fa-check-circle',
            'partial_success': 'fas fa-exclamation-triangle',
            'mostly_failed': 'fas fa-times-circle',
            'failure': 'fas fa-times-circle',
            'unknown': 'fas fa-question-circle'
        };
        return icons[status] || 'fas fa-question-circle';
    }

    getStatusTitle(status) {
        const titles = {
            'success': 'Import Successful',
            'partial_success': 'Import Partially Successful',
            'mostly_failed': 'Import Mostly Failed',
            'failure': 'Import Failed',
            'unknown': 'Import Status Unknown'
        };
        return titles[status] || 'Import Status Unknown';
    }

    getPerformanceBadgeClass(rating) {
        const classes = {
            'excellent': 'success',
            'good': 'primary',
            'fair': 'warning',
            'poor': 'danger'
        };
        return classes[rating] || 'secondary';
    }

    getRecommendationAlertClass(type) {
        const classes = {
            'error': 'danger',
            'warning': 'warning',
            'info': 'info',
            'success': 'success'
        };
        return classes[type] || 'info';
    }

    formatDuration(milliseconds) {
        if (milliseconds < 1000) {
            return `${milliseconds}ms`;
        } else if (milliseconds < 60000) {
            return `${(milliseconds / 1000).toFixed(1)}s`;
        } else {
            const minutes = Math.floor(milliseconds / 60000);
            const seconds = Math.floor((milliseconds % 60000) / 1000);
            return `${minutes}m ${seconds}s`;
        }
    }

    /**
     * Get import history
     * @returns {Array} Import history
     */
    getImportHistory() {
        return this.importHistory;
    }

    /**
     * Clear import history
     */
    clearImportHistory() {
        this.importHistory = [];
        this.saveImportHistory();
    }

    /**
     * Export results in specified format
     * @param {string} format - Export format
     * @returns {Promise} Export promise
     */
    async exportResults(format) {
        if (this.onExport) {
            return await this.onExport(format, this.currentResults, this.sessionId);
        }
        
        console.warn('No export handler configured');
    }

    /**
     * Retry failed records
     * @returns {Promise} Retry promise
     */
    async retryFailedRecords() {
        if (this.onRetry) {
            return await this.onRetry(this.currentResults, this.sessionId);
        }
        
        console.warn('No retry handler configured');
    }
}

// Export for use in other modules
export default ImportResultsManager;