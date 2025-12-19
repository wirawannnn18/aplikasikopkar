/**
 * Preview Generator - Generates preview data for user confirmation
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

/**
 * Preview generator for import data
 * Creates preview tables and summary statistics
 */
class PreviewGenerator {
    constructor() {
        this.maxPreviewRows = 100; // Limit preview for performance
    }

    /**
     * Generate preview table
     * Requirements: 4.1, 4.2, 4.3
     * @param {Array<ImportRow>} validatedData - Validated import data
     * @returns {Object} Preview table data
     */
    generatePreviewTable(validatedData) {
        const previewRows = validatedData.slice(0, this.maxPreviewRows);
        const hasMore = validatedData.length > this.maxPreviewRows;

        return {
            rows: previewRows.map(row => ({
                ...row,
                statusClass: row.isValid ? 'table-success' : 'table-danger',
                statusIcon: row.isValid ? 'bi-check-circle-fill' : 'bi-x-circle-fill',
                statusText: row.isValid ? 'Valid' : 'Error',
                formattedAmount: this.formatCurrency(row.amount),
                errorText: row.validationErrors.join('; ')
            })),
            hasMore,
            totalRows: validatedData.length,
            showingRows: previewRows.length
        };
    }

    /**
     * Calculate summary statistics
     * Requirements: 4.3, 4.4
     * @param {Array<ImportRow>} data - Import data
     * @returns {Object} Summary statistics
     */
    calculateSummary(data) {
        const validRows = data.filter(row => row.isValid);
        const invalidRows = data.filter(row => !row.isValid);

        const hutangRows = validRows.filter(row => row.paymentType === 'hutang');
        const piutangRows = validRows.filter(row => row.paymentType === 'piutang');

        const totalAmount = validRows.reduce((sum, row) => sum + row.amount, 0);
        const totalHutang = hutangRows.reduce((sum, row) => sum + row.amount, 0);
        const totalPiutang = piutangRows.reduce((sum, row) => sum + row.amount, 0);

        return {
            totalRows: data.length,
            validRows: validRows.length,
            invalidRows: invalidRows.length,
            validPercentage: data.length > 0 ? (validRows.length / data.length * 100).toFixed(1) : '0',
            totalAmount: totalAmount,
            totalHutang: totalHutang,
            totalPiutang: totalPiutang,
            hutangCount: hutangRows.length,
            piutangCount: piutangRows.length,
            formattedTotalAmount: this.formatCurrency(totalAmount),
            formattedTotalHutang: this.formatCurrency(totalHutang),
            formattedTotalPiutang: this.formatCurrency(totalPiutang)
        };
    }

    /**
     * Highlight errors in data
     * Requirements: 4.4
     * @param {Array<ImportRow>} data - Import data
     * @returns {Object} Error highlights
     */
    highlightErrors(data) {
        const errorTypes = Object.create(null); // Use null prototype to avoid conflicts
        const errorRows = data.filter(row => !row.isValid);

        errorRows.forEach(row => {
            row.validationErrors.forEach(error => {
                // Ensure error is a string and not empty
                const errorKey = String(error || 'Unknown error');
                
                if (!errorTypes[errorKey]) {
                    errorTypes[errorKey] = {
                        count: 0,
                        rows: []
                    };
                }
                errorTypes[errorKey].count++;
                errorTypes[errorKey].rows.push(row.rowNumber);
            });
        });

        return {
            errorTypes,
            totalErrors: Object.keys(errorTypes).length,
            totalErrorRows: errorRows.length,
            errorSummary: Object.entries(errorTypes).map(([error, data]) => ({
                error,
                count: data.count,
                percentage: errorRows.length > 0 ? (data.count / errorRows.length * 100).toFixed(1) : 0
            }))
        };
    }

    /**
     * Format currency for display
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency
     */
    formatCurrency(amount) {
        if (typeof amount !== 'number' || isNaN(amount)) {
            return 'Rp 0';
        }
        
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    /**
     * Generate complete preview data
     * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
     * @param {Array<ImportRow>} validatedData - Validated import data
     * @returns {Object} Complete preview data
     */
    generateCompletePreview(validatedData) {
        const table = this.generatePreviewTable(validatedData);
        const summary = this.calculateSummary(validatedData);
        const errors = this.highlightErrors(validatedData);

        return {
            table,
            summary,
            errors,
            canProceed: summary.validRows > 0,
            warnings: this.generateWarnings(summary, errors)
        };
    }

    /**
     * Generate warnings for user attention
     * Requirements: 4.5
     * @param {Object} summary - Summary statistics
     * @param {Object} errors - Error highlights
     * @returns {Array} Warning messages
     */
    generateWarnings(summary, errors) {
        const warnings = [];

        if (summary.invalidRows > 0) {
            warnings.push({
                type: 'warning',
                message: `${summary.invalidRows} baris data tidak valid dan akan dilewati`,
                icon: 'bi-exclamation-triangle-fill'
            });
        }

        if (summary.validRows === 0) {
            warnings.push({
                type: 'danger',
                message: 'Tidak ada data valid untuk diproses',
                icon: 'bi-x-circle-fill'
            });
        }

        if (summary.totalAmount > 100000000) { // 100 million
            warnings.push({
                type: 'info',
                message: 'Total pembayaran sangat besar, pastikan data sudah benar',
                icon: 'bi-info-circle-fill'
            });
        }

        return warnings;
    }
}

// Export for both browser and Node.js environments
if (typeof window !== 'undefined') {
    window.PreviewGenerator = PreviewGenerator;
}

// ES Module export
export { PreviewGenerator };

// CommonJS export for compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PreviewGenerator };
}