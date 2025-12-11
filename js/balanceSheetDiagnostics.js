/**
 * Balance Sheet Diagnostics and Performance Monitor
 * Task 6: Add error handling and user feedback
 * Requirements: 4.1, 4.4
 */

/**
 * Performance Monitor for Balance Sheet Operations
 */
class BalanceSheetDiagnostics {
    constructor() {
        this.performanceLog = [];
        this.dataValidationCache = new Map();
        this.performanceThresholds = {
            calculation: 5000,    // 5 seconds
            display: 3000,        // 3 seconds
            export: 10000,        // 10 seconds
            validation: 1000      // 1 second
        };
        this.chunkSizes = {
            accounts: 100,        // Process 100 accounts at a time
            journalEntries: 500,  // Process 500 journal entries at a time
            exportRows: 1000      // Export 1000 rows at a time
        };
    }

    /**
     * Start performance monitoring for an operation
     * Requirements: 4.1
     * @param {string} operation - Operation name
     * @param {Object} context - Additional context
     * @returns {Object} Performance monitor object
     */
    startMonitoring(operation, context = {}) {
        const monitor = {
            operation,
            context,
            startTime: performance.now(),
            startMemory: this.getMemoryUsage(),
            id: `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        return monitor;
    }

    /**
     * End performance monitoring and log results
     * Requirements: 4.1, 4.4
     * @param {Object} monitor - Performance monitor object
     * @param {Object} result - Operation result
     * @returns {Object} Performance metrics
     */
    endMonitoring(monitor, result = {}) {
        const endTime = performance.now();
        const endMemory = this.getMemoryUsage();
        
        const metrics = {
            operation: monitor.operation,
            context: monitor.context,
            duration: endTime - monitor.startTime,
            memoryUsed: endMemory - monitor.startMemory,
            timestamp: new Date(),
            success: !result.error,
            dataSize: this.calculateDataSize(result),
            threshold: this.performanceThresholds[monitor.operation] || 5000,
            id: monitor.id
        };

        metrics.isSlowOperation = metrics.duration > metrics.threshold;
        metrics.isMemoryIntensive = metrics.memoryUsed > 50 * 1024 * 1024; // 50MB

        this.logPerformance(metrics);
        
        // Trigger performance warnings if needed
        if (metrics.isSlowOperation || metrics.isMemoryIntensive) {
            this.handlePerformanceIssue(metrics);
        }

        return metrics;
    }

    /**
     * Validate COA structure integrity
     * Requirements: 4.2
     * @param {Array} coa - Chart of Accounts data
     * @returns {Object} Validation result
     */
    validateCOAStructure(coa) {
        const cacheKey = `coa_${JSON.stringify(coa).length}_${Date.now()}`;
        
        if (this.dataValidationCache.has(cacheKey)) {
            return this.dataValidationCache.get(cacheKey);
        }

        const monitor = this.startMonitoring('validation', { type: 'COA', accounts: coa.length });
        
        const validation = {
            isValid: true,
            errors: [],
            warnings: [],
            stats: {
                totalAccounts: coa.length,
                assetAccounts: 0,
                liabilityAccounts: 0,
                equityAccounts: 0,
                invalidAccounts: 0
            }
        };

        try {
            // Check if COA exists and is array
            if (!Array.isArray(coa) || coa.length === 0) {
                validation.isValid = false;
                validation.errors.push('COA tidak tersedia atau kosong');
                return validation;
            }

            // Validate each account
            coa.forEach((account, index) => {
                const accountErrors = this.validateAccount(account, index);
                
                if (accountErrors.length > 0) {
                    validation.errors.push(...accountErrors);
                    validation.stats.invalidAccounts++;
                } else {
                    // Count valid accounts by type
                    const accountType = account.tipe?.toLowerCase();
                    if (accountType === 'aset' || accountType === 'asset') {
                        validation.stats.assetAccounts++;
                    } else if (accountType === 'kewajiban' || accountType === 'liability') {
                        validation.stats.liabilityAccounts++;
                    } else if (accountType === 'modal' || accountType === 'equity') {
                        validation.stats.equityAccounts++;
                    }
                }
            });

            // Check for minimum required accounts
            if (validation.stats.assetAccounts === 0) {
                validation.warnings.push('Tidak ada akun aset yang ditemukan');
            }
            if (validation.stats.liabilityAccounts === 0) {
                validation.warnings.push('Tidak ada akun kewajiban yang ditemukan');
            }
            if (validation.stats.equityAccounts === 0) {
                validation.warnings.push('Tidak ada akun modal yang ditemukan');
            }

            // Check for duplicate account codes
            const accountCodes = coa.map(a => a.kode).filter(Boolean);
            const duplicateCodes = accountCodes.filter((code, index) => accountCodes.indexOf(code) !== index);
            if (duplicateCodes.length > 0) {
                validation.errors.push(`Kode akun duplikat ditemukan: ${duplicateCodes.join(', ')}`);
                validation.isValid = false;
            }

            validation.isValid = validation.errors.length === 0;

        } catch (error) {
            validation.isValid = false;
            validation.errors.push(`Error validasi COA: ${error.message}`);
        }

        this.endMonitoring(monitor, validation);
        
        // Cache validation result for 5 minutes
        setTimeout(() => {
            this.dataValidationCache.delete(cacheKey);
        }, 5 * 60 * 1000);
        
        this.dataValidationCache.set(cacheKey, validation);
        return validation;
    }

    /**
     * Validate individual account structure
     * @param {Object} account - Account object
     * @param {number} index - Account index
     * @returns {Array} Array of validation errors
     */
    validateAccount(account, index) {
        const errors = [];

        if (!account || typeof account !== 'object') {
            errors.push(`Akun index ${index}: Struktur akun tidak valid`);
            return errors;
        }

        // Required fields
        if (!account.kode) {
            errors.push(`Akun index ${index}: Kode akun tidak ada`);
        } else if (typeof account.kode !== 'string' || account.kode.trim() === '') {
            errors.push(`Akun index ${index}: Kode akun tidak valid`);
        }

        if (!account.nama) {
            errors.push(`Akun index ${index}: Nama akun tidak ada`);
        } else if (typeof account.nama !== 'string' || account.nama.trim() === '') {
            errors.push(`Akun index ${index}: Nama akun tidak valid`);
        }

        if (!account.tipe) {
            errors.push(`Akun index ${index}: Tipe akun tidak ada`);
        } else {
            const validTypes = ['aset', 'asset', 'kewajiban', 'liability', 'modal', 'equity', 'pendapatan', 'revenue', 'beban', 'expense'];
            if (!validTypes.includes(account.tipe.toLowerCase())) {
                errors.push(`Akun index ${index}: Tipe akun tidak valid (${account.tipe})`);
            }
        }

        // Saldo should be a number
        if (account.saldo !== undefined && (typeof account.saldo !== 'number' || isNaN(account.saldo))) {
            errors.push(`Akun index ${index}: Saldo tidak valid`);
        }

        return errors;
    }

    /**
     * Check if data chunking is needed for large datasets
     * Requirements: 4.4
     * @param {Object} data - Data to check
     * @returns {Object} Chunking recommendation
     */
    checkDataChunking(data) {
        const recommendation = {
            needsChunking: false,
            chunkSize: 0,
            estimatedChunks: 0,
            dataType: '',
            reason: ''
        };

        if (Array.isArray(data)) {
            if (data.length > this.chunkSizes.accounts && data[0]?.kode) {
                // COA data
                recommendation.needsChunking = true;
                recommendation.chunkSize = this.chunkSizes.accounts;
                recommendation.estimatedChunks = Math.ceil(data.length / this.chunkSizes.accounts);
                recommendation.dataType = 'COA';
                recommendation.reason = `Dataset besar (${data.length} akun) memerlukan chunking untuk performa optimal`;
            } else if (data.length > this.chunkSizes.journalEntries && data[0]?.entries) {
                // Journal data
                recommendation.needsChunking = true;
                recommendation.chunkSize = this.chunkSizes.journalEntries;
                recommendation.estimatedChunks = Math.ceil(data.length / this.chunkSizes.journalEntries);
                recommendation.dataType = 'Journal';
                recommendation.reason = `Dataset besar (${data.length} jurnal) memerlukan chunking untuk performa optimal`;
            }
        }

        return recommendation;
    }

    /**
     * Process data in chunks to maintain performance
     * Requirements: 4.4
     * @param {Array} data - Data to process
     * @param {Function} processor - Processing function
     * @param {number} chunkSize - Size of each chunk
     * @param {Function} progressCallback - Progress callback function
     * @returns {Promise} Processing result
     */
    async processInChunks(data, processor, chunkSize, progressCallback) {
        const monitor = this.startMonitoring('chunked_processing', { 
            totalItems: data.length, 
            chunkSize 
        });

        const results = [];
        const totalChunks = Math.ceil(data.length / chunkSize);

        try {
            for (let i = 0; i < data.length; i += chunkSize) {
                const chunk = data.slice(i, i + chunkSize);
                const chunkIndex = Math.floor(i / chunkSize);
                
                // Process chunk
                const chunkResult = await processor(chunk, chunkIndex);
                results.push(chunkResult);

                // Report progress
                if (progressCallback) {
                    const progress = {
                        completed: chunkIndex + 1,
                        total: totalChunks,
                        percentage: Math.round(((chunkIndex + 1) / totalChunks) * 100),
                        currentChunk: chunk.length,
                        processedItems: Math.min(i + chunkSize, data.length)
                    };
                    progressCallback(progress);
                }

                // Allow UI to update between chunks
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            this.endMonitoring(monitor, { success: true, chunks: results.length });
            return results;

        } catch (error) {
            this.endMonitoring(monitor, { error, chunks: results.length });
            throw error;
        }
    }

    /**
     * Handle performance issues
     * Requirements: 4.1, 4.4
     * @param {Object} metrics - Performance metrics
     */
    handlePerformanceIssue(metrics) {
        const issue = {
            type: metrics.isSlowOperation ? 'SLOW_OPERATION' : 'MEMORY_INTENSIVE',
            operation: metrics.operation,
            metrics,
            recommendations: []
        };

        if (metrics.isSlowOperation) {
            issue.recommendations.push('Pertimbangkan untuk menggunakan data chunking');
            issue.recommendations.push('Gunakan filter periode untuk mengurangi data');
            issue.recommendations.push('Cache hasil untuk penggunaan selanjutnya');
        }

        if (metrics.isMemoryIntensive) {
            issue.recommendations.push('Proses data dalam batch yang lebih kecil');
            issue.recommendations.push('Bersihkan data yang tidak diperlukan');
            issue.recommendations.push('Gunakan pagination untuk display');
        }

        // Trigger performance warning
        if (typeof balanceSheetErrorHandler !== 'undefined') {
            const performanceError = new Error(`Performa lambat: ${metrics.operation} memakan waktu ${Math.round(metrics.duration)}ms`);
            balanceSheetErrorHandler.handleError(performanceError, metrics.operation, {
                type: 'PERFORMANCE',
                metrics,
                recommendations: issue.recommendations
            });
        }

        console.warn('Performance Issue:', issue);
    }

    /**
     * Get memory usage (if available)
     * @returns {number} Memory usage in bytes
     */
    getMemoryUsage() {
        if (performance.memory) {
            return performance.memory.usedJSHeapSize;
        }
        return 0;
    }

    /**
     * Calculate data size for performance metrics
     * @param {Object} data - Data object
     * @returns {number} Estimated data size
     */
    calculateDataSize(data) {
        try {
            return JSON.stringify(data).length;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Log performance metrics
     * @param {Object} metrics - Performance metrics
     */
    logPerformance(metrics) {
        this.performanceLog.push(metrics);
        
        // Keep only last 50 performance logs
        if (this.performanceLog.length > 50) {
            this.performanceLog = this.performanceLog.slice(-50);
        }

        // Console logging for development
        if (metrics.isSlowOperation || metrics.isMemoryIntensive) {
            console.warn('Performance Warning:', {
                operation: metrics.operation,
                duration: `${Math.round(metrics.duration)}ms`,
                memory: `${Math.round(metrics.memoryUsed / 1024 / 1024)}MB`,
                threshold: `${metrics.threshold}ms`
            });
        }
    }

    /**
     * Get performance statistics
     * @returns {Object} Performance statistics
     */
    getPerformanceStats() {
        const stats = {
            total: this.performanceLog.length,
            averageDuration: 0,
            slowOperations: 0,
            memoryIntensiveOperations: 0,
            byOperation: {},
            recent: this.performanceLog.slice(-10)
        };

        if (this.performanceLog.length > 0) {
            stats.averageDuration = this.performanceLog.reduce((sum, log) => sum + log.duration, 0) / this.performanceLog.length;
            stats.slowOperations = this.performanceLog.filter(log => log.isSlowOperation).length;
            stats.memoryIntensiveOperations = this.performanceLog.filter(log => log.isMemoryIntensive).length;

            this.performanceLog.forEach(log => {
                if (!stats.byOperation[log.operation]) {
                    stats.byOperation[log.operation] = {
                        count: 0,
                        totalDuration: 0,
                        averageDuration: 0,
                        slowCount: 0
                    };
                }
                
                const opStats = stats.byOperation[log.operation];
                opStats.count++;
                opStats.totalDuration += log.duration;
                opStats.averageDuration = opStats.totalDuration / opStats.count;
                if (log.isSlowOperation) opStats.slowCount++;
            });
        }

        return stats;
    }

    /**
     * Clear performance log
     */
    clearPerformanceLog() {
        this.performanceLog = [];
        this.dataValidationCache.clear();
    }
}

// Global instance
const balanceSheetDiagnostics = new BalanceSheetDiagnostics();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BalanceSheetDiagnostics, balanceSheetDiagnostics };
}