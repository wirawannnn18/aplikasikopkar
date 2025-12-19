/**
 * Unified Transaction Exporter
 * Enhanced export functionality with mode information and flexible options
 * Requirements: 4.4, 8.5
 */

class UnifiedTransactionExporter {
    constructor(sharedServices) {
        this.sharedServices = sharedServices;
        this.exportFormats = ['csv', 'excel', 'pdf'];
        this.defaultColumns = [
            'tanggal',
            'anggotaNama',
            'anggotaNIK',
            'jenis',
            'mode',
            'jumlah',
            'saldoSebelum',
            'saldoSesudah',
            'kasirNama',
            'batchId',
            'keterangan'
        ];
    }

    /**
     * Export transactions with enhanced options
     * Requirements: 4.4, 8.5
     * @param {Object} options - Export configuration
     * @returns {Promise<Object>} Export result
     */
    async exportTransactions(options = {}) {
        try {
            const {
                format = 'csv',
                filters = {},
                columns = this.defaultColumns,
                filename = null,
                includeHeaders = true,
                groupByMode = false,
                includeSummary = true
            } = options;

            // Validate format
            if (!this.exportFormats.includes(format)) {
                throw new Error(`Unsupported export format: ${format}`);
            }

            // Get transactions based on filters
            const transactions = this.sharedServices.getTransactionHistory(filters);
            
            if (transactions.length === 0) {
                throw new Error('Tidak ada data untuk diekspor');
            }

            // Generate filename if not provided
            const exportFilename = filename || this._generateFilename(format, filters);

            // Export based on format
            let result;
            switch (format) {
                case 'csv':
                    result = await this._exportToCSV(transactions, {
                        columns,
                        includeHeaders,
                        groupByMode,
                        includeSummary,
                        filename: exportFilename
                    });
                    break;
                case 'excel':
                    result = await this._exportToExcel(transactions, {
                        columns,
                        includeHeaders,
                        groupByMode,
                        includeSummary,
                        filename: exportFilename
                    });
                    break;
                case 'pdf':
                    result = await this._exportToPDF(transactions, {
                        columns,
                        includeHeaders,
                        groupByMode,
                        includeSummary,
                        filename: exportFilename
                    });
                    break;
                default:
                    throw new Error(`Format ${format} belum diimplementasikan`);
            }

            return {
                success: true,
                filename: exportFilename,
                recordCount: transactions.length,
                format,
                ...result
            };

        } catch (error) {
            console.error('Export error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Export to CSV format
     * Requirements: 4.4, 8.5
     * @private
     * @param {Array} transactions - Transactions to export
     * @param {Object} options - Export options
     * @returns {Promise<Object>} Export result
     */
    async _exportToCSV(transactions, options) {
        const { columns, includeHeaders, groupByMode, includeSummary, filename } = options;
        
        let csvContent = '';
        
        // Add BOM for proper UTF-8 encoding in Excel
        csvContent = '\uFEFF';
        
        if (groupByMode) {
            // Export grouped by mode
            const groupedTransactions = this._groupTransactionsByMode(transactions);
            
            for (const [mode, modeTransactions] of Object.entries(groupedTransactions)) {
                if (modeTransactions.length === 0) continue;
                
                // Mode header
                csvContent += `\n"=== TRANSAKSI ${mode.toUpperCase()} ==="\n`;
                
                // Headers for this group
                if (includeHeaders) {
                    csvContent += this._generateCSVHeaders(columns) + '\n';
                }
                
                // Data rows
                csvContent += this._generateCSVRows(modeTransactions, columns);
                
                // Summary for this mode
                if (includeSummary) {
                    csvContent += this._generateCSVSummary(modeTransactions, mode);
                }
                
                csvContent += '\n';
            }
        } else {
            // Standard export
            if (includeHeaders) {
                csvContent += this._generateCSVHeaders(columns) + '\n';
            }
            
            csvContent += this._generateCSVRows(transactions, columns);
        }
        
        // Overall summary
        if (includeSummary && !groupByMode) {
            csvContent += this._generateCSVSummary(transactions, 'SEMUA');
        }
        
        // Download the file
        this._downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
        
        return {
            size: csvContent.length,
            mimeType: 'text/csv'
        };
    }

    /**
     * Export to Excel format (using CSV with Excel-specific formatting)
     * Requirements: 4.4, 8.5
     * @private
     * @param {Array} transactions - Transactions to export
     * @param {Object} options - Export options
     * @returns {Promise<Object>} Export result
     */
    async _exportToExcel(transactions, options) {
        // For now, use enhanced CSV that works well with Excel
        // In the future, this could be enhanced with a proper Excel library
        const result = await this._exportToCSV(transactions, {
            ...options,
            filename: options.filename.replace('.xlsx', '.csv')
        });
        
        return {
            ...result,
            mimeType: 'application/vnd.ms-excel'
        };
    }

    /**
     * Export to PDF format
     * Requirements: 4.4, 8.5
     * @private
     * @param {Array} transactions - Transactions to export
     * @param {Object} options - Export options
     * @returns {Promise<Object>} Export result
     */
    async _exportToPDF(transactions, options) {
        // Create a printable HTML version for PDF export
        const htmlContent = this._generatePrintableHTML(transactions, options);
        
        // Open in new window for printing to PDF
        const printWindow = window.open('', '_blank');
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Trigger print dialog
        setTimeout(() => {
            printWindow.print();
        }, 500);
        
        return {
            mimeType: 'application/pdf',
            method: 'browser_print'
        };
    }

    /**
     * Generate CSV headers
     * @private
     * @param {Array} columns - Column names
     * @returns {string} CSV header row
     */
    _generateCSVHeaders(columns) {
        const headers = columns.map(col => this._getColumnLabel(col));
        return headers.map(h => `"${h}"`).join(',');
    }

    /**
     * Generate CSV data rows
     * @private
     * @param {Array} transactions - Transactions
     * @param {Array} columns - Column names
     * @returns {string} CSV data rows
     */
    _generateCSVRows(transactions, columns) {
        return transactions.map(transaction => {
            const row = columns.map(col => {
                let value = transaction[col] || '';
                
                // Format specific columns
                switch (col) {
                    case 'tanggal':
                        value = this._formatDateForExport(value);
                        break;
                    case 'jumlah':
                    case 'saldoSebelum':
                    case 'saldoSesudah':
                        value = this._formatCurrencyForExport(value);
                        break;
                    case 'mode':
                        value = value === 'import' ? 'Import Batch' : 'Manual';
                        break;
                    case 'jenis':
                        value = value === 'hutang' ? 'Hutang' : 'Piutang';
                        break;
                    case 'batchId':
                        value = value || '-';
                        break;
                }
                
                // Escape quotes and wrap in quotes
                return `"${String(value).replace(/"/g, '""')}"`;
            });
            
            return row.join(',');
        }).join('\n');
    }

    /**
     * Generate CSV summary section
     * @private
     * @param {Array} transactions - Transactions
     * @param {string} label - Summary label
     * @returns {string} CSV summary rows
     */
    _generateCSVSummary(transactions, label) {
        const stats = this._calculateSummaryStats(transactions);
        
        return `\n"=== RINGKASAN ${label} ==="\n` +
               `"Total Transaksi","${stats.totalCount}"\n` +
               `"Total Hutang","${stats.hutangCount}","${this._formatCurrencyForExport(stats.hutangAmount)}"\n` +
               `"Total Piutang","${stats.piutangCount}","${this._formatCurrencyForExport(stats.piutangAmount)}"\n` +
               `"Total Nilai","${this._formatCurrencyForExport(stats.totalAmount)}"\n`;
    }

    /**
     * Group transactions by mode
     * @private
     * @param {Array} transactions - All transactions
     * @returns {Object} Grouped transactions
     */
    _groupTransactionsByMode(transactions) {
        const grouped = {
            manual: [],
            import: []
        };
        
        transactions.forEach(t => {
            const mode = t.mode || 'manual';
            if (grouped[mode]) {
                grouped[mode].push(t);
            }
        });
        
        return grouped;
    }

    /**
     * Calculate summary statistics
     * @private
     * @param {Array} transactions - Transactions
     * @returns {Object} Summary statistics
     */
    _calculateSummaryStats(transactions) {
        const stats = {
            totalCount: transactions.length,
            hutangCount: 0,
            piutangCount: 0,
            hutangAmount: 0,
            piutangAmount: 0,
            totalAmount: 0
        };
        
        transactions.forEach(t => {
            const amount = parseFloat(t.jumlah) || 0;
            stats.totalAmount += amount;
            
            if (t.jenis === 'hutang') {
                stats.hutangCount++;
                stats.hutangAmount += amount;
            } else {
                stats.piutangCount++;
                stats.piutangAmount += amount;
            }
        });
        
        return stats;
    }

    /**
     * Generate printable HTML for PDF export
     * @private
     * @param {Array} transactions - Transactions
     * @param {Object} options - Export options
     * @returns {string} HTML content
     */
    _generatePrintableHTML(transactions, options) {
        const { columns, groupByMode, includeSummary } = options;
        const stats = this._calculateSummaryStats(transactions);
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Laporan Transaksi Pembayaran</title>
                <style>
                    body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .header h1 { margin: 0; color: #2d6a4f; }
                    .header p { margin: 5px 0; color: #666; }
                    .summary { background: #f8f9fa; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
                    .summary h3 { margin-top: 0; color: #2d6a4f; }
                    .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
                    .summary-item { display: flex; justify-content: space-between; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f8f9fa; font-weight: bold; }
                    .text-right { text-align: right; }
                    .mode-manual { background-color: #e3f2fd; }
                    .mode-import { background-color: #f3e5f5; }
                    .footer { margin-top: 30px; text-align: center; color: #666; font-size: 10px; }
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Laporan Transaksi Pembayaran Hutang/Piutang</h1>
                    <p>Tanggal Cetak: ${this._formatDateForExport(new Date())}</p>
                    <p>Total Transaksi: ${stats.totalCount}</p>
                </div>
                
                ${includeSummary ? `
                <div class="summary">
                    <h3>Ringkasan</h3>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <span>Total Transaksi:</span>
                            <strong>${stats.totalCount}</strong>
                        </div>
                        <div class="summary-item">
                            <span>Total Nilai:</span>
                            <strong>${this._formatCurrencyForExport(stats.totalAmount)}</strong>
                        </div>
                        <div class="summary-item">
                            <span>Transaksi Hutang:</span>
                            <strong>${stats.hutangCount} (${this._formatCurrencyForExport(stats.hutangAmount)})</strong>
                        </div>
                        <div class="summary-item">
                            <span>Transaksi Piutang:</span>
                            <strong>${stats.piutangCount} (${this._formatCurrencyForExport(stats.piutangAmount)})</strong>
                        </div>
                    </div>
                </div>
                ` : ''}
                
                ${this._generateHTMLTable(transactions, columns, groupByMode)}
                
                <div class="footer">
                    <p>Dicetak dari Sistem Koperasi - ${new Date().toLocaleString('id-ID')}</p>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Generate HTML table for transactions
     * @private
     * @param {Array} transactions - Transactions
     * @param {Array} columns - Columns to include
     * @param {boolean} groupByMode - Whether to group by mode
     * @returns {string} HTML table
     */
    _generateHTMLTable(transactions, columns, groupByMode) {
        if (groupByMode) {
            const grouped = this._groupTransactionsByMode(transactions);
            let html = '';
            
            for (const [mode, modeTransactions] of Object.entries(grouped)) {
                if (modeTransactions.length === 0) continue;
                
                html += `
                    <h3>Transaksi ${mode === 'import' ? 'Import Batch' : 'Manual'}</h3>
                    ${this._generateSingleHTMLTable(modeTransactions, columns, mode)}
                `;
            }
            
            return html;
        } else {
            return this._generateSingleHTMLTable(transactions, columns);
        }
    }

    /**
     * Generate single HTML table
     * @private
     * @param {Array} transactions - Transactions
     * @param {Array} columns - Columns
     * @param {string} mode - Mode for styling
     * @returns {string} HTML table
     */
    _generateSingleHTMLTable(transactions, columns, mode = null) {
        const modeClass = mode ? `mode-${mode}` : '';
        
        const headers = columns.map(col => `<th>${this._getColumnLabel(col)}</th>`).join('');
        
        const rows = transactions.map(t => {
            const cells = columns.map(col => {
                let value = t[col] || '';
                let className = '';
                
                switch (col) {
                    case 'tanggal':
                        value = this._formatDateForExport(value);
                        break;
                    case 'jumlah':
                    case 'saldoSebelum':
                    case 'saldoSesudah':
                        value = this._formatCurrencyForExport(value);
                        className = 'text-right';
                        break;
                    case 'mode':
                        value = value === 'import' ? 'Import Batch' : 'Manual';
                        break;
                    case 'jenis':
                        value = value === 'hutang' ? 'Hutang' : 'Piutang';
                        break;
                    case 'batchId':
                        value = value || '-';
                        break;
                }
                
                return `<td class="${className}">${value}</td>`;
            }).join('');
            
            return `<tr class="${modeClass}">${cells}</tr>`;
        }).join('');
        
        return `
            <table>
                <thead>
                    <tr>${headers}</tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    }

    /**
     * Get column label for display
     * @private
     * @param {string} column - Column name
     * @returns {string} Display label
     */
    _getColumnLabel(column) {
        const labels = {
            tanggal: 'Tanggal',
            anggotaNama: 'Nama Anggota',
            anggotaNIK: 'NIK',
            jenis: 'Jenis',
            mode: 'Mode Pembayaran',
            jumlah: 'Jumlah',
            saldoSebelum: 'Saldo Sebelum',
            saldoSesudah: 'Saldo Sesudah',
            kasirNama: 'Kasir',
            batchId: 'Batch ID',
            keterangan: 'Keterangan',
            createdAt: 'Dibuat Pada'
        };
        
        return labels[column] || column;
    }

    /**
     * Format date for export
     * @private
     * @param {string|Date} date - Date to format
     * @returns {string} Formatted date
     */
    _formatDateForExport(date) {
        if (!date) return '';
        
        try {
            const d = new Date(date);
            return d.toLocaleDateString('id-ID');
        } catch (error) {
            return String(date);
        }
    }

    /**
     * Format currency for export
     * @private
     * @param {number|string} amount - Amount to format
     * @returns {string} Formatted currency
     */
    _formatCurrencyForExport(amount) {
        if (!amount && amount !== 0) return '0';
        
        try {
            const num = parseFloat(amount);
            return num.toLocaleString('id-ID');
        } catch (error) {
            return String(amount);
        }
    }

    /**
     * Generate filename for export
     * @private
     * @param {string} format - Export format
     * @param {Object} filters - Applied filters
     * @returns {string} Generated filename
     */
    _generateFilename(format, filters) {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        let filename = `transaksi_pembayaran_${timestamp}`;
        
        // Add filter info to filename
        if (filters.mode) {
            filename += `_${filters.mode}`;
        }
        
        if (filters.tanggalDari && filters.tanggalSampai) {
            const dari = filters.tanggalDari.replace(/-/g, '');
            const sampai = filters.tanggalSampai.replace(/-/g, '');
            filename += `_${dari}_${sampai}`;
        }
        
        // Add extension
        const extensions = {
            csv: '.csv',
            excel: '.xlsx',
            pdf: '.pdf'
        };
        
        filename += extensions[format] || '.csv';
        
        return filename;
    }

    /**
     * Download file to user's device
     * @private
     * @param {string} content - File content
     * @param {string} filename - Filename
     * @param {string} mimeType - MIME type
     */
    _downloadFile(content, filename, mimeType) {
        try {
            const blob = new Blob([content], { type: mimeType });
            const url = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 100);
            
        } catch (error) {
            console.error('Error downloading file:', error);
            throw new Error('Gagal mengunduh file');
        }
    }

    /**
     * Show export options dialog
     * Requirements: 8.5 - Export configuration interface
     * @param {Object} currentFilters - Current applied filters
     * @returns {Promise<Object>} Export configuration
     */
    async showExportDialog(currentFilters = {}) {
        return new Promise((resolve, reject) => {
            const modal = this._createExportModal(currentFilters);
            document.body.appendChild(modal);
            
            // Show modal
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
            
            // Handle form submission
            const form = modal.querySelector('#exportForm');
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const formData = new FormData(form);
                const config = {
                    format: formData.get('format'),
                    groupByMode: formData.get('groupByMode') === 'on',
                    includeSummary: formData.get('includeSummary') === 'on',
                    includeHeaders: formData.get('includeHeaders') === 'on',
                    filters: currentFilters
                };
                
                bsModal.hide();
                resolve(config);
            });
            
            // Handle modal close
            modal.addEventListener('hidden.bs.modal', () => {
                document.body.removeChild(modal);
            });
        });
    }

    /**
     * Create export configuration modal
     * @private
     * @param {Object} currentFilters - Current filters
     * @returns {HTMLElement} Modal element
     */
    _createExportModal(currentFilters) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-download me-2"></i>
                            Ekspor Transaksi
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <form id="exportForm">
                        <div class="modal-body">
                            <div class="mb-3">
                                <label class="form-label">Format Export</label>
                                <select class="form-select" name="format" required>
                                    <option value="csv">CSV (Excel Compatible)</option>
                                    <option value="excel">Excel (.xlsx)</option>
                                    <option value="pdf">PDF (Print)</option>
                                </select>
                            </div>
                            
                            <div class="mb-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="groupByMode" id="groupByMode">
                                    <label class="form-check-label" for="groupByMode">
                                        Kelompokkan berdasarkan mode pembayaran
                                    </label>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="includeSummary" id="includeSummary" checked>
                                    <label class="form-check-label" for="includeSummary">
                                        Sertakan ringkasan statistik
                                    </label>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" name="includeHeaders" id="includeHeaders" checked>
                                    <label class="form-check-label" for="includeHeaders">
                                        Sertakan header kolom
                                    </label>
                                </div>
                            </div>
                            
                            ${Object.keys(currentFilters).length > 0 ? `
                            <div class="alert alert-info">
                                <h6>Filter yang Diterapkan:</h6>
                                <ul class="mb-0">
                                    ${Object.entries(currentFilters).map(([key, value]) => 
                                        value ? `<li>${this._getFilterLabel(key)}: ${value}</li>` : ''
                                    ).filter(Boolean).join('')}
                                </ul>
                            </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                Batal
                            </button>
                            <button type="submit" class="btn btn-primary">
                                <i class="bi bi-download me-2"></i>
                                Ekspor
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        return modal;
    }

    /**
     * Get filter label for display
     * @private
     * @param {string} filterKey - Filter key
     * @returns {string} Display label
     */
    _getFilterLabel(filterKey) {
        const labels = {
            mode: 'Mode Pembayaran',
            jenis: 'Jenis Pembayaran',
            tanggalDari: 'Dari Tanggal',
            tanggalSampai: 'Sampai Tanggal',
            anggotaSearch: 'Pencarian Anggota'
        };
        
        return labels[filterKey] || filterKey;
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UnifiedTransactionExporter };
} else if (typeof window !== 'undefined') {
    window.UnifiedTransactionExporter = UnifiedTransactionExporter;
}