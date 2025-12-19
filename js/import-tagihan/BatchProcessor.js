/**
 * Batch Processor - Handles batch payment processing
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

// Import required components - conditional import for different environments
let RollbackManager, PaymentSystemIntegration, PerformanceOptimizer;
if (typeof require !== 'undefined') {
    // Node.js environment
    try {
        RollbackManager = require('./RollbackManager.js').RollbackManager;
        PaymentSystemIntegration = require('./PaymentSystemIntegration.js').PaymentSystemIntegration;
        PerformanceOptimizer = require('./PerformanceOptimizer.js').PerformanceOptimizer;
    } catch (e) {
        // Fallback if require fails
        RollbackManager = null;
        PaymentSystemIntegration = null;
        PerformanceOptimizer = null;
    }
} else if (typeof window !== 'undefined') {
    // Browser environment
    RollbackManager = window.RollbackManager;
    PaymentSystemIntegration = window.PaymentSystemIntegration;
    PerformanceOptimizer = window.PerformanceOptimizer;
}

/**
 * Batch processor for payment transactions
 * Handles batch processing with progress tracking and cancellation
 */
class BatchProcessor {
    constructor(paymentEngine, auditLogger) {
        this.paymentEngine = paymentEngine;
        this.auditLogger = auditLogger;
        
        // Initialize PaymentSystemIntegration for compatibility with existing payment system
        // Requirements: 11.1 - Integrate with pembayaranHutangPiutang.js
        if (PaymentSystemIntegration) {
            this.paymentIntegration = new PaymentSystemIntegration();
        } else {
            console.warn('PaymentSystemIntegration not available, using fallback payment logic');
            this.paymentIntegration = null;
        }
        
        // Initialize RollbackManager if available
        if (RollbackManager) {
            this.rollbackManager = new RollbackManager(auditLogger);
        } else {
            console.warn('RollbackManager not available, using fallback rollback mechanism');
            this.rollbackManager = null;
        }
        
        // Initialize PerformanceOptimizer for memory-efficient batch processing
        // Requirements: 5.1 - Implement memory-efficient batch processing
        if (PerformanceOptimizer) {
            this.performanceOptimizer = new PerformanceOptimizer();
        } else {
            console.warn('PerformanceOptimizer not available, using standard batch processing');
            this.performanceOptimizer = null;
        }
        
        this.isProcessing = false;
        this.isCancelled = false;
        this.currentBatchId = null;
        this.processedTransactions = [];
        this.progressCallback = null;
    }

    /**
     * Process batch payments with performance optimization
     * Requirements: 5.1, 5.2, 5.3, 5.4 - Memory-efficient batch processing
     * @param {Array<ImportRow>} validatedData - Valid payment data
     * @returns {Promise<ImportResult>} Processing results
     */
    async processPayments(validatedData) {
        if (this.isProcessing) {
            throw new Error('Batch processing already in progress');
        }

        this.isProcessing = true;
        this.isCancelled = false;
        this.currentBatchId = this.generateBatchId();
        this.processedTransactions = [];

        const batchStartTime = new Date();
        const validRows = validatedData.filter(row => row.isValid);
        
        const results = {
            batchId: this.currentBatchId,
            totalProcessed: 0,
            successCount: 0,
            failureCount: 0,
            successTransactions: [],
            failedTransactions: [],
            summary: {
                totalAmount: 0,
                totalHutang: 0,
                totalPiutang: 0
            }
        };

        try {
            // Use performance optimizer for large batches (>100 items)
            // Requirements: 5.1 - Implement memory-efficient batch processing
            if (this.performanceOptimizer && validRows.length > 100) {
                await this._processPaymentsWithOptimization(validRows, results);
            } else {
                // Standard processing for smaller batches
                await this._processPaymentsStandard(validRows, results);
            }

            // Handle cancellation
            if (this.isCancelled) {
                this.updateProgress(validRows.length, validRows.length, 'Melakukan rollback...');
                const rollbackResult = await this.rollbackManager.rollbackBatch(this.currentBatchId, this.processedTransactions);
                
                if (rollbackResult.success) {
                    results.successCount = 0;
                    results.successTransactions = [];
                    results.summary = { totalAmount: 0, totalHutang: 0, totalPiutang: 0 };
                    results.rollbackResult = rollbackResult;
                    this.updateProgress(validRows.length, validRows.length, 'Batch dibatalkan dan rollback berhasil');
                } else {
                    results.rollbackResult = rollbackResult;
                    this.updateProgress(validRows.length, validRows.length, 'Batch dibatalkan, rollback gagal');
                }
            } else {
                this.updateProgress(validRows.length, validRows.length, 'Batch selesai diproses');
            }

            // Log batch completion with performance metrics
            if (this.auditLogger) {
                const performanceMetrics = this.performanceOptimizer ? this.performanceOptimizer.getPerformanceMetrics() : null;
                this.auditLogger.logBatchCompletion(this.currentBatchId, results, batchStartTime, performanceMetrics);
            }

        } catch (error) {
            console.error('Critical error during batch processing:', error);
            
            // Rollback on critical error using RollbackManager
            if (this.processedTransactions.length > 0) {
                const rollbackResult = await this.rollbackManager.rollbackBatch(this.currentBatchId, this.processedTransactions);
                results.rollbackResult = rollbackResult;
                
                if (rollbackResult.success) {
                    console.log('Critical error rollback completed successfully');
                } else {
                    console.error('Critical error rollback failed:', rollbackResult.errors);
                }
            }
            
            throw error;
        } finally {
            this.isProcessing = false;
            this.isCancelled = false;
            this.currentBatchId = null;
        }

        return results;
    }

    /**
     * Process payments with performance optimization for large batches
     * Requirements: 5.1 - Memory-efficient batch processing
     * @param {Array<ImportRow>} validRows - Valid payment data
     * @param {Object} results - Results object to populate
     * @private
     */
    async _processPaymentsWithOptimization(validRows, results) {
        const chunkProcessor = async (chunk, startIndex) => {
            const chunkResults = [];
            
            for (let i = 0; i < chunk.length; i++) {
                // Check for cancellation
                if (this.isCancelled) {
                    break;
                }

                const row = chunk[i];
                const globalIndex = startIndex + i;
                
                try {
                    const transaction = await this.processSinglePayment(row);
                    
                    // Track successful transaction for potential rollback
                    this.processedTransactions.push(transaction);
                    
                    chunkResults.push({
                        type: 'success',
                        transaction: transaction
                    });

                    // Log successful transaction
                    if (this.auditLogger) {
                        this.auditLogger.logBatchTransaction(this.currentBatchId, transaction, 'success');
                    }

                } catch (error) {
                    console.error(`Error processing row ${row.rowNumber}:`, error);
                    
                    const failedTransaction = {
                        rowNumber: row.rowNumber,
                        memberNumber: row.memberNumber,
                        memberName: row.memberName,
                        paymentType: row.paymentType,
                        amount: row.amount,
                        error: error.message,
                        errorCode: this.categorizeError(error)
                    };
                    
                    chunkResults.push({
                        type: 'failed',
                        transaction: failedTransaction
                    });

                    // Log failed transaction
                    if (this.auditLogger) {
                        this.auditLogger.logBatchTransaction(this.currentBatchId, failedTransaction, 'failed');
                    }
                }
            }
            
            return chunkResults;
        };

        // Use performance optimizer for chunked processing
        const allChunkResults = await this.performanceOptimizer.optimizeBatchProcessing(
            validRows,
            chunkProcessor,
            (progress) => {
                this.updateProgress(progress.current, progress.total, progress.status);
            }
        );

        // Aggregate results from all chunks
        allChunkResults.forEach(chunkResults => {
            chunkResults.forEach(result => {
                if (result.type === 'success') {
                    results.successTransactions.push(result.transaction);
                    results.successCount++;
                    results.summary.totalAmount += result.transaction.jumlah;
                    
                    if (result.transaction.jenis === 'hutang') {
                        results.summary.totalHutang += result.transaction.jumlah;
                    } else {
                        results.summary.totalPiutang += result.transaction.jumlah;
                    }
                } else {
                    results.failedTransactions.push(result.transaction);
                    results.failureCount++;
                }
                results.totalProcessed++;
            });
        });
    }

    /**
     * Standard processing for smaller batches
     * Requirements: 5.1, 5.2, 5.3, 5.4
     * @param {Array<ImportRow>} validRows - Valid payment data
     * @param {Object} results - Results object to populate
     * @private
     */
    async _processPaymentsStandard(validRows, results) {
        this.updateProgress(0, validRows.length, 'Memulai pemrosesan batch...');

        // Process each valid row
        for (let i = 0; i < validRows.length; i++) {
            // Check for cancellation
            if (this.isCancelled) {
                this.updateProgress(i, validRows.length, 'Membatalkan pemrosesan...');
                break;
            }

            const row = validRows[i];
            this.updateProgress(i + 1, validRows.length, `Memproses ${row.memberName}...`);

            try {
                const transaction = await this.processSinglePayment(row);
                
                // Track successful transaction for potential rollback
                this.processedTransactions.push(transaction);
                
                results.successTransactions.push(transaction);
                results.successCount++;
                results.summary.totalAmount += transaction.jumlah;
                
                if (transaction.jenis === 'hutang') {
                    results.summary.totalHutang += transaction.jumlah;
                } else {
                    results.summary.totalPiutang += transaction.jumlah;
                }

                // Log successful transaction
                if (this.auditLogger) {
                    this.auditLogger.logBatchTransaction(this.currentBatchId, transaction, 'success');
                }

            } catch (error) {
                console.error(`Error processing row ${row.rowNumber}:`, error);
                
                const failedTransaction = {
                    rowNumber: row.rowNumber,
                    memberNumber: row.memberNumber,
                    memberName: row.memberName,
                    paymentType: row.paymentType,
                    amount: row.amount,
                    error: error.message,
                    errorCode: this.categorizeError(error)
                };
                
                results.failedTransactions.push(failedTransaction);
                results.failureCount++;

                // Log failed transaction
                if (this.auditLogger) {
                    this.auditLogger.logBatchTransaction(this.currentBatchId, failedTransaction, 'failed');
                }
            }

            results.totalProcessed++;
        }
    }

    /**
     * Rollback batch transactions using RollbackManager
     * Requirements: 8.4, 10.3, 10.4, 10.5
     * @param {string} batchId - Batch ID to rollback
     * @returns {Promise<Object>} Rollback result
     */
    async rollbackBatch(batchId) {
        if (!batchId || this.processedTransactions.length === 0) {
            return {
                success: true,
                rolledBackCount: 0,
                errors: [],
                message: 'No transactions to rollback'
            };
        }

        try {
            // Use RollbackManager for comprehensive rollback
            const rollbackResult = await this.rollbackManager.rollbackBatch(batchId, this.processedTransactions);
            
            // Clear processed transactions after rollback
            this.processedTransactions = [];
            
            return rollbackResult;

        } catch (error) {
            console.error('Critical error during rollback:', error);
            return {
                success: false,
                rolledBackCount: 0,
                errors: [{ critical: true, error: error.message }],
                message: 'Critical rollback error'
            };
        }
    }

    /**
     * Track processing progress
     * Requirements: 5.5, 10.1
     * @param {Function} callback - Progress callback function
     */
    trackProgress(callback) {
        this.progressCallback = callback;
    }

    /**
     * Handle cancellation request
     * Requirements: 10.2, 10.3
     * @returns {Promise<Object>} Cancellation result
     */
    async handleCancellation() {
        if (!this.isProcessing) {
            return {
                success: false,
                message: 'No batch processing in progress'
            };
        }

        this.isCancelled = true;
        
        // If we have processed transactions, rollback using RollbackManager
        if (this.processedTransactions.length > 0 && this.currentBatchId) {
            const rollbackResult = await this.rollbackBatch(this.currentBatchId);
            return {
                success: true,
                message: 'Batch processing cancelled',
                rollbackResult
            };
        }

        return {
            success: true,
            message: 'Batch processing cancelled (no transactions to rollback)'
        };
    }

    /**
     * Process single payment transaction using integrated payment system
     * Requirements: 5.2, 5.3, 11.1 - Integrate with pembayaranHutangPiutang.js
     * @param {ImportRow} rowData - Single payment data
     * @returns {Promise<Object>} Transaction result
     */
    async processSinglePayment(rowData) {
        if (!rowData.isValid) {
            throw new Error('Cannot process invalid row data');
        }

        try {
            // Get member data
            const anggotaList = JSON.parse(localStorage.getItem('anggota') || '[]');
            const anggota = anggotaList.find(a => a.nik === rowData.memberNumber);
            
            if (!anggota) {
                throw new Error(`Anggota dengan NIK ${rowData.memberNumber} tidak ditemukan`);
            }

            // Prepare payment data for integration layer
            const paymentData = {
                anggotaId: anggota.id,
                anggotaNama: anggota.nama,
                anggotaNIK: anggota.nik,
                jenis: rowData.paymentType,
                jumlah: rowData.amount,
                keterangan: rowData.description || `Import batch ${this.currentBatchId}`,
                batchId: this.currentBatchId
            };

            // Use PaymentSystemIntegration if available for compatibility
            // Requirements: 11.1 - Ensure compatibility with existing payment processing
            if (this.paymentIntegration) {
                const transaction = await this.paymentIntegration.processSinglePayment(paymentData);
                return transaction;
            } else {
                // Fallback to original logic if integration not available
                return await this._processSinglePaymentFallback(rowData, anggota, paymentData);
            }

        } catch (error) {
            console.error('Error processing single payment:', error);
            throw error;
        }
    }

    /**
     * Fallback payment processing when integration layer is not available
     * Requirements: 5.2, 5.3
     * @param {ImportRow} rowData - Single payment data
     * @param {Object} anggota - Member data
     * @param {Object} paymentData - Payment data
     * @returns {Promise<Object>} Transaction result
     * @private
     */
    async _processSinglePaymentFallback(rowData, anggota, paymentData) {
        // Calculate current balance
        const saldoSebelum = rowData.paymentType === 'hutang' 
            ? this.hitungSaldoHutang(anggota.id)
            : this.hitungSaldoPiutang(anggota.id);

        // Validate balance
        if (saldoSebelum < rowData.amount) {
            const jenisText = rowData.paymentType === 'hutang' ? 'hutang' : 'piutang';
            throw new Error(`Saldo ${jenisText} tidak mencukupi. Saldo: ${this.formatRupiah(saldoSebelum)}, Pembayaran: ${this.formatRupiah(rowData.amount)}`);
        }

        const saldoSesudah = saldoSebelum - rowData.amount;
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const timestamp = new Date().toISOString();

        // Create transaction object
        const transaction = {
            id: this.generateTransactionId(),
            tanggal: timestamp.split('T')[0],
            anggotaId: anggota.id,
            anggotaNama: anggota.nama,
            anggotaNIK: anggota.nik,
            jenis: rowData.paymentType,
            jumlah: rowData.amount,
            saldoSebelum: saldoSebelum,
            saldoSesudah: saldoSesudah,
            keterangan: paymentData.keterangan,
            kasirId: currentUser.id || '',
            kasirNama: currentUser.nama || '',
            batchId: this.currentBatchId,
            status: 'selesai',
            createdAt: timestamp,
            updatedAt: timestamp
        };

        // Save transaction to localStorage
        const pembayaranList = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
        pembayaranList.push(transaction);
        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaranList));

        // Create journal entry
        this.createJournalEntry(transaction);

        return transaction;
    }

    /**
     * Update progress
     * Requirements: 5.5
     * @param {number} current - Current progress
     * @param {number} total - Total items
     * @param {string} status - Current status
     */
    updateProgress(current, total, status) {
        if (this.progressCallback) {
            this.progressCallback({
                current,
                total,
                percentage: total > 0 ? (current / total * 100).toFixed(1) : 0,
                status
            });
        }
    }

    /**
     * Generate batch ID
     * @returns {string} Unique batch ID
     */
    generateBatchId() {
        return `BATCH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate transaction ID
     * @returns {string} Unique transaction ID
     */
    generateTransactionId() {
        return `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Calculate hutang balance for member using integrated payment system
     * Requirements: 5.2, 11.1 - Reuse existing validation and journal logic
     * @param {string} anggotaId - Member ID
     * @returns {number} Current hutang balance
     */
    hitungSaldoHutang(anggotaId) {
        // Use PaymentSystemIntegration if available for consistency
        if (this.paymentIntegration) {
            return this.paymentIntegration.hitungSaldoHutang(anggotaId);
        }

        // Fallback calculation
        try {
            const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
            const pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
            
            // Total kredit from POS transactions
            const totalKredit = penjualan
                .filter(p => p.anggotaId === anggotaId && p.metodePembayaran === 'Kredit')
                .reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
            
            // Total payments already made
            const totalBayar = pembayaran
                .filter(p => p.anggotaId === anggotaId && p.jenis === 'hutang' && p.status === 'selesai')
                .reduce((sum, p) => sum + (parseFloat(p.jumlah) || 0), 0);
            
            return totalKredit - totalBayar;
        } catch (error) {
            console.error('Error calculating hutang saldo:', error);
            return 0;
        }
    }

    /**
     * Calculate piutang balance for member using integrated payment system
     * Requirements: 5.2, 11.1 - Reuse existing validation and journal logic
     * @param {string} anggotaId - Member ID
     * @returns {number} Current piutang balance
     */
    hitungSaldoPiutang(anggotaId) {
        // Use PaymentSystemIntegration if available for consistency
        if (this.paymentIntegration) {
            return this.paymentIntegration.hitungSaldoPiutang(anggotaId);
        }

        // Fallback calculation
        try {
            const simpananList = JSON.parse(localStorage.getItem('simpanan') || '[]');
            const pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
            
            // Get simpanan for this anggota that are marked for pengembalian
            const anggotaSimpanan = simpananList.filter(s => 
                s.anggotaId === anggotaId && 
                s.statusPengembalian === 'pending'
            );
            
            // Calculate total piutang from simpanan balances
            let totalPiutang = 0;
            anggotaSimpanan.forEach(simpanan => {
                totalPiutang += parseFloat(simpanan.saldo || 0);
            });
            
            // Subtract payments already made
            const totalBayar = pembayaran
                .filter(p => p.anggotaId === anggotaId && p.jenis === 'piutang' && p.status === 'selesai')
                .reduce((sum, p) => sum + (parseFloat(p.jumlah) || 0), 0);
            
            return totalPiutang - totalBayar;
        } catch (error) {
            console.error('Error calculating piutang saldo:', error);
            return 0;
        }
    }

    /**
     * Create journal entry for transaction using integrated accounting system
     * Requirements: 5.3, 11.2 - Integrate with accounting module
     * @param {Object} transaction - Transaction data
     */
    createJournalEntry(transaction) {
        try {
            // Use PaymentSystemIntegration if available for consistency with existing patterns
            // Requirements: 11.2 - Ensure journal entries follow existing patterns
            if (this.paymentIntegration) {
                this.paymentIntegration.createJournalEntry(transaction);
                return;
            }

            // Fallback journal creation
            const keterangan = `${transaction.jenis === 'hutang' ? 'Pembayaran Hutang' : 'Pembayaran Piutang'} - ${transaction.anggotaNama} (Batch Import)`;
            
            let entries;
            if (transaction.jenis === 'hutang') {
                entries = [
                    { akun: '1-1000', debit: transaction.jumlah, kredit: 0 },  // Kas bertambah
                    { akun: '2-1000', debit: 0, kredit: transaction.jumlah }   // Hutang berkurang
                ];
            } else {
                entries = [
                    { akun: '1-1200', debit: transaction.jumlah, kredit: 0 },  // Piutang berkurang
                    { akun: '1-1000', debit: 0, kredit: transaction.jumlah }   // Kas berkurang
                ];
            }

            // Use existing addJurnal function if available, otherwise create journal entry directly
            if (typeof addJurnal === 'function') {
                addJurnal(keterangan, entries, transaction.tanggal);
            } else {
                // Create journal entry directly
                const jurnalList = JSON.parse(localStorage.getItem('jurnal') || '[]');
                const jurnalEntry = {
                    id: this.generateTransactionId(),
                    tanggal: transaction.tanggal,
                    keterangan: keterangan,
                    entries: entries,
                    createdAt: new Date().toISOString()
                };
                jurnalList.push(jurnalEntry);
                localStorage.setItem('jurnal', JSON.stringify(jurnalList));
            }
        } catch (error) {
            console.error('Error creating journal entry:', error);
            throw new Error('Gagal mencatat jurnal akuntansi');
        }
    }

    /**
     * Categorize error for reporting
     * Requirements: 8.1
     * @param {Error} error - Error object
     * @returns {string} Error category
     */
    categorizeError(error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('tidak ditemukan')) {
            return 'MEMBER_NOT_FOUND';
        } else if (message.includes('saldo') && message.includes('tidak mencukupi')) {
            return 'INSUFFICIENT_BALANCE';
        } else if (message.includes('jurnal')) {
            return 'JOURNAL_ERROR';
        } else if (message.includes('validasi')) {
            return 'VALIDATION_ERROR';
        } else {
            return 'SYSTEM_ERROR';
        }
    }

    /**
     * Get rollback manager instance
     * Requirements: 8.4, 10.3
     * @returns {RollbackManager} Rollback manager instance
     */
    getRollbackManager() {
        return this.rollbackManager;
    }

    /**
     * Check if a batch can be rolled back
     * Requirements: 10.3
     * @param {string} batchId - Batch ID to check
     * @returns {Object} Rollback eligibility
     */
    canRollbackBatch(batchId) {
        return this.rollbackManager.canRollback(batchId);
    }

    /**
     * Get rollback statistics
     * Requirements: 8.4
     * @returns {Object} Rollback statistics
     */
    getRollbackStatistics() {
        return this.rollbackManager.getRollbackStatistics();
    }

    /**
     * Format currency for display
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency
     */
    formatRupiah(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }
}

// Export for both browser and Node.js environments
if (typeof window !== 'undefined') {
    window.BatchProcessor = BatchProcessor;
}

// Browser compatibility - exports handled via window object

// CommonJS export for compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BatchProcessor };
}