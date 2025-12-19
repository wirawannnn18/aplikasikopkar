/**
 * Report Generator - Generate success/failure summary reports for import tagihan pembayaran
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 * 
 * This class handles report generation including:
 * - Success/failure summary reports
 * - Transaction IDs and error details
 * - CSV export functionality
 * - Timestamped reports with kasir information
 */

/**
 * Report Generator class for import tagihan processing results
 * Generates comprehensive reports for audit and user feedback
 */
class ReportGenerator {
    constructor() {
        this.reportCounter = 0; // Counter to ensure filename uniqueness
    }

    /**
     * Generate comprehensive processing report
     * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
     * @param {Object} reportData - Report generation data
     * @param {string} reportData.batchId - Batch identifier
     * @param {string} reportData.fileName - Original filename
     * @param {ImportResult} reportData.results - Processing results
     * @param {string} reportData.kasirId - Kasir ID who processed
     * @param {string} reportData.kasirNama - Kasir name
     * @param {Date} reportData.processedAt - Processing timestamp
     * @returns {Object} Generated report data
     */
    generateProcessingReport(reportData) {
        const report = {
            metadata: this._generateReportMetadata(reportData),
            summary: this._generateSummarySection(reportData.results),
            successTransactions: this._generateSuccessSection(reportData.results.successTransactions),
            failedTransactions: this._generateFailureSection(reportData.results.failedTransactions),
            statistics: this._generateStatisticsSection(reportData.results),
            auditInfo: this._generateAuditSection(reportData)
        };

        return report;
    }

    /**
     * Generate CSV export content for the report
     * Requirements: 6.4, 6.5
     * @param {Object} report - Generated report data
     * @returns {Object} CSV export data with filename and content
     */
    generateCSVExport(report) {
        // Generate unique filename with timestamp and kasir info
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -1);
        this.reportCounter++;
        const filename = `laporan_import_tagihan_${report.metadata.batchId}_${timestamp}_${this.reportCounter}.csv`;

        // Generate CSV content sections
        const csvSections = [
            this._generateCSVHeader(report.metadata),
            this._generateCSVSummary(report.summary),
            this._generateCSVSuccessTransactions(report.successTransactions),
            this._generateCSVFailedTransactions(report.failedTransactions),
            this._generateCSVStatistics(report.statistics)
        ];

        const csvContent = csvSections.join('\n\n');

        return {
            filename,
            content: csvContent,
            mimeType: 'text/csv',
            size: csvContent.length,
            timestamp: new Date(),
            encoding: 'utf-8'
        };
    }

    /**
     * Download CSV report (browser environment)
     * Requirements: 6.4
     * @param {Object} report - Generated report data
     * @returns {boolean} Download success
     */
    downloadCSVReport(report) {
        if (typeof window === 'undefined') {
            throw new Error('Download functionality only available in browser environment');
        }

        try {
            const csvExport = this.generateCSVExport(report);
            
            // Create blob with UTF-8 BOM for proper Excel compatibility
            const bom = '\uFEFF';
            const blob = new Blob([bom + csvExport.content], { 
                type: csvExport.mimeType + ';charset=utf-8' 
            });
            const url = window.URL.createObjectURL(blob);
            
            // Create temporary download link
            const link = document.createElement('a');
            link.href = url;
            link.download = csvExport.filename;
            link.style.display = 'none';
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up object URL
            window.URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('CSV report download failed:', error);
            return false;
        }
    }

    /**
     * Generate HTML report for display
     * Requirements: 6.1, 6.2, 6.3
     * @param {Object} report - Generated report data
     * @returns {string} HTML report content
     */
    generateHTMLReport(report) {
        return `
        <div class="import-report">
            <div class="report-header">
                <h3>Laporan Import Tagihan Pembayaran</h3>
                <div class="report-metadata">
                    <p><strong>Batch ID:</strong> ${report.metadata.batchId}</p>
                    <p><strong>File:</strong> ${report.metadata.originalFileName}</p>
                    <p><strong>Diproses oleh:</strong> ${report.metadata.kasirNama}</p>
                    <p><strong>Tanggal:</strong> ${this._formatDateTime(report.metadata.processedAt)}</p>
                </div>
            </div>

            <div class="report-summary">
                <h4>Ringkasan</h4>
                <div class="row">
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h5 class="card-title text-primary">${report.summary.totalProcessed}</h5>
                                <p class="card-text">Total Diproses</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h5 class="card-title text-success">${report.summary.successCount}</h5>
                                <p class="card-text">Berhasil</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h5 class="card-title text-danger">${report.summary.failureCount}</h5>
                                <p class="card-text">Gagal</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h5 class="card-title text-info">${report.summary.formattedTotalAmount}</h5>
                                <p class="card-text">Total Nominal</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            ${this._generateHTMLSuccessSection(report.successTransactions)}
            ${this._generateHTMLFailureSection(report.failedTransactions)}
            ${this._generateHTMLStatisticsSection(report.statistics)}
        </div>
        `;
    }

    // Private helper methods for report generation

    /**
     * Generate report metadata
     * @private
     */
    _generateReportMetadata(reportData) {
        return {
            batchId: reportData.batchId,
            originalFileName: reportData.fileName,
            kasirId: reportData.kasirId,
            kasirNama: reportData.kasirNama,
            processedAt: reportData.processedAt,
            generatedAt: new Date(),
            reportVersion: '1.0'
        };
    }

    /**
     * Generate summary section
     * @private
     */
    _generateSummarySection(results) {
        return {
            totalProcessed: results.totalProcessed,
            successCount: results.successCount,
            failureCount: results.failureCount,
            successRate: results.totalProcessed > 0 ? ((results.successCount / results.totalProcessed) * 100).toFixed(2) : '0.00',
            failureRate: results.totalProcessed > 0 ? ((results.failureCount / results.totalProcessed) * 100).toFixed(2) : '0.00',
            totalAmount: results.summary?.totalAmount || 0,
            totalHutang: results.summary?.totalHutang || 0,
            totalPiutang: results.summary?.totalPiutang || 0,
            formattedTotalAmount: this._formatCurrency(results.summary?.totalAmount || 0),
            formattedTotalHutang: this._formatCurrency(results.summary?.totalHutang || 0),
            formattedTotalPiutang: this._formatCurrency(results.summary?.totalPiutang || 0)
        };
    }

    /**
     * Generate success transactions section
     * @private
     */
    _generateSuccessSection(successTransactions) {
        return {
            count: successTransactions.length,
            transactions: successTransactions.map(transaction => ({
                transactionId: transaction.id,
                memberNumber: transaction.anggotaNIK,
                memberName: transaction.anggotaNama,
                paymentType: transaction.jenis,
                amount: transaction.jumlah,
                formattedAmount: this._formatCurrency(transaction.jumlah),
                description: transaction.keterangan,
                balanceBefore: transaction.saldoSebelum,
                balanceAfter: transaction.saldoSesudah,
                formattedBalanceBefore: this._formatCurrency(transaction.saldoSebelum),
                formattedBalanceAfter: this._formatCurrency(transaction.saldoSesudah),
                processedAt: transaction.createdAt
            }))
        };
    }

    /**
     * Generate failed transactions section
     * @private
     */
    _generateFailureSection(failedTransactions) {
        // Group errors by type for better reporting
        const errorGroups = {};
        failedTransactions.forEach(failed => {
            const errorType = failed.errorCode || 'UNKNOWN_ERROR';
            if (!errorGroups[errorType]) {
                errorGroups[errorType] = {
                    errorType: errorType,
                    errorMessage: failed.error,
                    count: 0,
                    transactions: []
                };
            }
            errorGroups[errorType].count++;
            errorGroups[errorType].transactions.push({
                rowNumber: failed.rowNumber,
                memberNumber: failed.memberNumber,
                memberName: failed.memberName,
                paymentType: failed.paymentType,
                amount: failed.amount,
                formattedAmount: this._formatCurrency(failed.amount),
                error: failed.error
            });
        });

        return {
            count: failedTransactions.length,
            errorGroups: Object.values(errorGroups),
            transactions: failedTransactions.map(failed => ({
                rowNumber: failed.rowNumber,
                memberNumber: failed.memberNumber,
                memberName: failed.memberName,
                paymentType: failed.paymentType,
                amount: failed.amount,
                formattedAmount: this._formatCurrency(failed.amount),
                error: failed.error,
                errorCode: failed.errorCode || 'UNKNOWN_ERROR'
            }))
        };
    }

    /**
     * Generate statistics section
     * @private
     */
    _generateStatisticsSection(results) {
        const hutangTransactions = results.successTransactions.filter(t => t.jenis === 'hutang');
        const piutangTransactions = results.successTransactions.filter(t => t.jenis === 'piutang');

        return {
            paymentTypeBreakdown: {
                hutang: {
                    count: hutangTransactions.length,
                    totalAmount: hutangTransactions.reduce((sum, t) => sum + t.jumlah, 0),
                    formattedTotalAmount: this._formatCurrency(hutangTransactions.reduce((sum, t) => sum + t.jumlah, 0)),
                    averageAmount: hutangTransactions.length > 0 ? hutangTransactions.reduce((sum, t) => sum + t.jumlah, 0) / hutangTransactions.length : 0
                },
                piutang: {
                    count: piutangTransactions.length,
                    totalAmount: piutangTransactions.reduce((sum, t) => sum + t.jumlah, 0),
                    formattedTotalAmount: this._formatCurrency(piutangTransactions.reduce((sum, t) => sum + t.jumlah, 0)),
                    averageAmount: piutangTransactions.length > 0 ? piutangTransactions.reduce((sum, t) => sum + t.jumlah, 0) / piutangTransactions.length : 0
                }
            },
            amountRanges: this._calculateAmountRanges(results.successTransactions),
            processingMetrics: {
                totalTransactions: results.totalProcessed,
                successRate: ((results.successCount / results.totalProcessed) * 100).toFixed(2),
                averageTransactionAmount: results.successCount > 0 ? (results.summary?.totalAmount || 0) / results.successCount : 0
            }
        };
    }

    /**
     * Generate audit information section
     * @private
     */
    _generateAuditSection(reportData) {
        return {
            batchId: reportData.batchId,
            kasirId: reportData.kasirId,
            kasirNama: reportData.kasirNama,
            processedAt: reportData.processedAt,
            originalFileName: reportData.fileName,
            reportGeneratedAt: new Date(),
            reportGeneratedBy: 'System'
        };
    }

    /**
     * Calculate amount ranges for statistics
     * @private
     */
    _calculateAmountRanges(transactions) {
        const ranges = {
            'under_100k': { min: 0, max: 100000, count: 0 },
            '100k_500k': { min: 100000, max: 500000, count: 0 },
            '500k_1m': { min: 500000, max: 1000000, count: 0 },
            '1m_5m': { min: 1000000, max: 5000000, count: 0 },
            'over_5m': { min: 5000000, max: Infinity, count: 0 }
        };

        transactions.forEach(transaction => {
            const amount = transaction.jumlah;
            Object.keys(ranges).forEach(rangeKey => {
                const range = ranges[rangeKey];
                if (amount >= range.min && amount < range.max) {
                    range.count++;
                }
            });
        });

        return ranges;
    }

    // CSV Generation Methods

    /**
     * Generate CSV header section
     * @private
     */
    _generateCSVHeader(metadata) {
        return [
            'LAPORAN IMPORT TAGIHAN PEMBAYARAN HUTANG PIUTANG',
            '',
            `Batch ID,${metadata.batchId}`,
            `File Asli,${metadata.originalFileName}`,
            `Diproses oleh,${metadata.kasirNama} (${metadata.kasirId})`,
            `Tanggal Proses,${this._formatDateTime(metadata.processedAt)}`,
            `Laporan Dibuat,${this._formatDateTime(metadata.generatedAt)}`,
            ''
        ].join('\n');
    }

    /**
     * Generate CSV summary section
     * @private
     */
    _generateCSVSummary(summary) {
        return [
            'RINGKASAN',
            'Kategori,Jumlah,Persentase,Nominal',
            `Total Diproses,${summary.totalProcessed},100.00%,${summary.formattedTotalAmount}`,
            `Berhasil,${summary.successCount},${summary.successRate}%,${summary.formattedTotalAmount}`,
            `Gagal,${summary.failureCount},${summary.failureRate}%,-`,
            `Total Hutang,-,-,${summary.formattedTotalHutang}`,
            `Total Piutang,-,-,${summary.formattedTotalPiutang}`,
            ''
        ].join('\n');
    }

    /**
     * Generate CSV success transactions section
     * @private
     */
    _generateCSVSuccessTransactions(successSection) {
        if (successSection.count === 0) {
            return 'TRANSAKSI BERHASIL\nTidak ada transaksi berhasil';
        }

        const headers = 'ID Transaksi,No Anggota,Nama Anggota,Jenis,Jumlah,Saldo Sebelum,Saldo Sesudah,Keterangan,Tanggal';
        const rows = successSection.transactions.map(t => 
            `${t.transactionId},${t.memberNumber},${t.memberName},${t.paymentType},${t.amount},${t.balanceBefore},${t.balanceAfter},"${t.description}",${this._formatDateTime(t.processedAt)}`
        );

        return [
            'TRANSAKSI BERHASIL',
            headers,
            ...rows,
            ''
        ].join('\n');
    }

    /**
     * Generate CSV failed transactions section
     * @private
     */
    _generateCSVFailedTransactions(failureSection) {
        if (failureSection.count === 0) {
            return 'TRANSAKSI GAGAL\nTidak ada transaksi gagal';
        }

        const headers = 'Baris,No Anggota,Nama Anggota,Jenis,Jumlah,Alasan Gagal';
        const rows = failureSection.transactions.map(t => 
            `${t.rowNumber},${t.memberNumber},${t.memberName},${t.paymentType},${t.amount},"${t.error}"`
        );

        return [
            'TRANSAKSI GAGAL',
            headers,
            ...rows,
            ''
        ].join('\n');
    }

    /**
     * Generate CSV statistics section
     * @private
     */
    _generateCSVStatistics(statistics) {
        return [
            'STATISTIK',
            'Jenis Pembayaran,Jumlah Transaksi,Total Nominal,Rata-rata',
            `Hutang,${statistics.paymentTypeBreakdown.hutang.count},${statistics.paymentTypeBreakdown.hutang.totalAmount},${(statistics.paymentTypeBreakdown.hutang.averageAmount || 0).toFixed(0)}`,
            `Piutang,${statistics.paymentTypeBreakdown.piutang.count},${statistics.paymentTypeBreakdown.piutang.totalAmount},${(statistics.paymentTypeBreakdown.piutang.averageAmount || 0).toFixed(0)}`,
            '',
            'Rentang Nominal,Jumlah Transaksi',
            `< Rp 100.000,${statistics.amountRanges.under_100k.count}`,
            `Rp 100.000 - Rp 500.000,${statistics.amountRanges['100k_500k'].count}`,
            `Rp 500.000 - Rp 1.000.000,${statistics.amountRanges['500k_1m'].count}`,
            `Rp 1.000.000 - Rp 5.000.000,${statistics.amountRanges['1m_5m'].count}`,
            `> Rp 5.000.000,${statistics.amountRanges.over_5m.count}`
        ].join('\n');
    }

    // HTML Generation Methods

    /**
     * Generate HTML success section
     * @private
     */
    _generateHTMLSuccessSection(successSection) {
        if (successSection.count === 0) {
            return '<div class="alert alert-info">Tidak ada transaksi berhasil</div>';
        }

        const rows = successSection.transactions.slice(0, 10).map(t => `
            <tr>
                <td>${t.transactionId}</td>
                <td>${t.memberNumber}</td>
                <td>${t.memberName}</td>
                <td><span class="badge badge-${t.paymentType === 'hutang' ? 'danger' : 'success'}">${t.paymentType}</span></td>
                <td class="text-right">${t.formattedAmount}</td>
                <td>${t.description}</td>
            </tr>
        `).join('');

        return `
        <div class="report-success">
            <h4>Transaksi Berhasil (${successSection.count})</h4>
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>ID Transaksi</th>
                            <th>No Anggota</th>
                            <th>Nama</th>
                            <th>Jenis</th>
                            <th>Jumlah</th>
                            <th>Keterangan</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
            ${successSection.count > 10 ? `<p class="text-muted">Menampilkan 10 dari ${successSection.count} transaksi berhasil</p>` : ''}
        </div>
        `;
    }

    /**
     * Generate HTML failure section
     * @private
     */
    _generateHTMLFailureSection(failureSection) {
        if (failureSection.count === 0) {
            return '<div class="alert alert-success">Semua transaksi berhasil diproses</div>';
        }

        const rows = failureSection.transactions.slice(0, 10).map(t => `
            <tr>
                <td>${t.rowNumber}</td>
                <td>${t.memberNumber}</td>
                <td>${t.memberName}</td>
                <td><span class="badge badge-${t.paymentType === 'hutang' ? 'danger' : 'success'}">${t.paymentType}</span></td>
                <td class="text-right">${t.formattedAmount}</td>
                <td class="text-danger">${t.error}</td>
            </tr>
        `).join('');

        return `
        <div class="report-failures">
            <h4>Transaksi Gagal (${failureSection.count})</h4>
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Baris</th>
                            <th>No Anggota</th>
                            <th>Nama</th>
                            <th>Jenis</th>
                            <th>Jumlah</th>
                            <th>Alasan Gagal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
            ${failureSection.count > 10 ? `<p class="text-muted">Menampilkan 10 dari ${failureSection.count} transaksi gagal</p>` : ''}
        </div>
        `;
    }

    /**
     * Generate HTML statistics section
     * @private
     */
    _generateHTMLStatisticsSection(statistics) {
        return `
        <div class="report-statistics">
            <h4>Statistik</h4>
            <div class="row">
                <div class="col-md-6">
                    <h5>Berdasarkan Jenis Pembayaran</h5>
                    <table class="table table-sm">
                        <tr>
                            <td>Hutang</td>
                            <td class="text-right">${statistics.paymentTypeBreakdown.hutang.count} transaksi</td>
                            <td class="text-right">${statistics.paymentTypeBreakdown.hutang.formattedTotalAmount}</td>
                        </tr>
                        <tr>
                            <td>Piutang</td>
                            <td class="text-right">${statistics.paymentTypeBreakdown.piutang.count} transaksi</td>
                            <td class="text-right">${statistics.paymentTypeBreakdown.piutang.formattedTotalAmount}</td>
                        </tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h5>Berdasarkan Rentang Nominal</h5>
                    <table class="table table-sm">
                        <tr><td>< Rp 100.000</td><td class="text-right">${statistics.amountRanges.under_100k.count}</td></tr>
                        <tr><td>Rp 100.000 - Rp 500.000</td><td class="text-right">${statistics.amountRanges['100k_500k'].count}</td></tr>
                        <tr><td>Rp 500.000 - Rp 1.000.000</td><td class="text-right">${statistics.amountRanges['500k_1m'].count}</td></tr>
                        <tr><td>Rp 1.000.000 - Rp 5.000.000</td><td class="text-right">${statistics.amountRanges['1m_5m'].count}</td></tr>
                        <tr><td>> Rp 5.000.000</td><td class="text-right">${statistics.amountRanges.over_5m.count}</td></tr>
                    </table>
                </div>
            </div>
        </div>
        `;
    }

    // Utility Methods

    /**
     * Format currency amount
     * @private
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency
     */
    _formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    /**
     * Format date and time
     * @private
     * @param {Date} date - Date to format
     * @returns {string} Formatted date time
     */
    _formatDateTime(date) {
        try {
            const dateObj = new Date(date);
            if (isNaN(dateObj.getTime())) {
                return new Date().toLocaleString('id-ID');
            }
            return new Intl.DateTimeFormat('id-ID', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }).format(dateObj);
        } catch (error) {
            return new Date().toLocaleString('id-ID');
        }
    }
}

// Export for both browser and Node.js environments
if (typeof window !== 'undefined') {
    window.ReportGenerator = ReportGenerator;
}

// CommonJS export for compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ReportGenerator };
}

// Browser compatibility - exports handled via window object