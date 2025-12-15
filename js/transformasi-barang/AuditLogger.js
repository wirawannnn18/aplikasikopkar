/**
 * AuditLogger - Logger untuk audit trail transformasi barang
 * 
 * Kelas ini bertanggung jawab untuk mencatat semua transaksi transformasi
 * dengan detail lengkap untuk keperluan audit dan tracking.
 */

class AuditLogger {
    constructor() {
        this.initialized = false;
        this.logCache = []; // Cache untuk batch operations
    }

    /**
     * Initialize AuditLogger
     */
    initialize() {
        this.initialized = true;
        this._loadExistingLogs();
    }

    /**
     * Mencatat transaksi transformasi
     * @param {TransformationRecord} transformationRecord - Record transformasi
     * @returns {Promise<boolean>} True jika logging berhasil
     */
    async logTransformation(transformationRecord) {
        this._ensureInitialized();
        
        try {
            // Validasi input
            if (!transformationRecord) {
                throw new Error('Transformation record harus disediakan');
            }

            // Buat log entry dengan detail lengkap
            const logEntry = {
                id: this._generateLogId(),
                timestamp: new Date().toISOString(),
                type: 'transformation',
                transformationId: transformationRecord.id,
                user: transformationRecord.user,
                status: transformationRecord.status,
                sourceItem: {
                    id: transformationRecord.sourceItem.id,
                    name: transformationRecord.sourceItem.name,
                    unit: transformationRecord.sourceItem.unit,
                    quantity: transformationRecord.sourceItem.quantity,
                    stockBefore: transformationRecord.sourceItem.stockBefore,
                    stockAfter: transformationRecord.sourceItem.stockAfter,
                    baseProduct: transformationRecord.sourceItem.baseProduct
                },
                targetItem: {
                    id: transformationRecord.targetItem.id,
                    name: transformationRecord.targetItem.name,
                    unit: transformationRecord.targetItem.unit,
                    quantity: transformationRecord.targetItem.quantity,
                    stockBefore: transformationRecord.targetItem.stockBefore,
                    stockAfter: transformationRecord.targetItem.stockAfter,
                    baseProduct: transformationRecord.targetItem.baseProduct
                },
                conversionRatio: transformationRecord.conversionRatio,
                metadata: {
                    totalValueChange: this._calculateValueChange(transformationRecord),
                    baseProduct: transformationRecord.sourceItem.baseProduct || 
                                transformationRecord.sourceItem.id.split('-')[0],
                    transformationType: `${transformationRecord.sourceItem.unit}_to_${transformationRecord.targetItem.unit}`
                }
            };

            // Add to cache
            this.logCache.push(logEntry);
            
            // Save to localStorage
            await this._saveLogEntry(logEntry);
            
            // Log event untuk audit trail
            await this.logEvent('info', 
                `Transformation logged: ${transformationRecord.sourceItem.quantity} ${transformationRecord.sourceItem.unit} → ${transformationRecord.targetItem.quantity} ${transformationRecord.targetItem.unit}`,
                { transformationId: transformationRecord.id, user: transformationRecord.user }
            );
            
            return true;
        } catch (error) {
            console.error('Error logging transformation:', error);
            // Log error event
            await this.logEvent('error', 
                `Failed to log transformation: ${error.message}`,
                { transformationRecord: transformationRecord?.id }
            );
            throw error;
        }
    }

    /**
     * Mendapatkan history transformasi dengan filtering
     * @param {Object} filters - Filter untuk history
     * @param {string} [filters.dateFrom] - Tanggal mulai (ISO string)
     * @param {string} [filters.dateTo] - Tanggal akhir (ISO string)
     * @param {string} [filters.product] - Filter berdasarkan produk
     * @param {string} [filters.user] - Filter berdasarkan user
     * @param {string} [filters.status] - Filter berdasarkan status
     * @param {string} [filters.transformationType] - Filter berdasarkan tipe transformasi
     * @param {number} [filters.limit] - Limit jumlah hasil
     * @param {number} [filters.offset] - Offset untuk pagination
     * @returns {Promise<Object>} Object dengan data dan metadata
     */
    async getTransformationHistory(filters = {}) {
        this._ensureInitialized();
        
        try {
            const allLogs = this._getAllLogs();
            
            // Filter hanya log transformasi
            let transformationLogs = allLogs.filter(log => log.type === 'transformation');
            
            // Apply filters
            if (filters.dateFrom) {
                const fromDate = new Date(filters.dateFrom);
                transformationLogs = transformationLogs.filter(log => 
                    new Date(log.timestamp) >= fromDate
                );
            }
            
            if (filters.dateTo) {
                const toDate = new Date(filters.dateTo);
                transformationLogs = transformationLogs.filter(log => 
                    new Date(log.timestamp) <= toDate
                );
            }
            
            if (filters.product) {
                transformationLogs = transformationLogs.filter(log => 
                    log.metadata.baseProduct?.toLowerCase().includes(filters.product.toLowerCase()) ||
                    log.sourceItem.id?.toLowerCase().includes(filters.product.toLowerCase()) ||
                    log.targetItem.id?.toLowerCase().includes(filters.product.toLowerCase()) ||
                    log.sourceItem.name?.toLowerCase().includes(filters.product.toLowerCase()) ||
                    log.targetItem.name?.toLowerCase().includes(filters.product.toLowerCase())
                );
            }
            
            if (filters.user) {
                transformationLogs = transformationLogs.filter(log => 
                    log.user?.toLowerCase().includes(filters.user.toLowerCase())
                );
            }
            
            if (filters.status) {
                transformationLogs = transformationLogs.filter(log => 
                    log.status === filters.status
                );
            }
            
            if (filters.transformationType) {
                transformationLogs = transformationLogs.filter(log => 
                    log.metadata.transformationType === filters.transformationType
                );
            }
            
            // Sort by timestamp (newest first)
            transformationLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            // Apply pagination
            const totalCount = transformationLogs.length;
            const offset = filters.offset || 0;
            const limit = filters.limit || totalCount;
            
            const paginatedLogs = transformationLogs.slice(offset, offset + limit);
            
            return {
                data: paginatedLogs,
                metadata: {
                    totalCount,
                    offset,
                    limit,
                    hasMore: offset + limit < totalCount,
                    filters: filters
                }
            };
        } catch (error) {
            console.error('Error getting transformation history:', error);
            throw error;
        }
    }

    /**
     * Mencatat error atau warning dalam transformasi
     * @param {string} level - Level log (error, warning, info)
     * @param {string} message - Pesan log
     * @param {Object} context - Context tambahan
     * @returns {Promise<boolean>} True jika logging berhasil
     */
    async logEvent(level, message, context = {}) {
        this._ensureInitialized();
        
        try {
            const logEntry = {
                id: this._generateLogId(),
                timestamp: new Date().toISOString(),
                level: level,
                message: message,
                context: context,
                type: 'event'
            };

            // Add to cache
            this.logCache.push(logEntry);
            
            // Save to localStorage
            await this._saveLogEntry(logEntry);
            
            return true;
        } catch (error) {
            console.error('Error logging event:', error);
            return false;
        }
    }

    /**
     * Export history transformasi ke format yang dapat diunduh
     * @param {Object} filters - Filter untuk export
     * @param {string} format - Format export (json, csv)
     * @returns {Promise<string>} Data dalam format yang diminta
     */
    async exportTransformationHistory(filters = {}, format = 'json') {
        this._ensureInitialized();
        
        try {
            const historyResult = await this.getTransformationHistory(filters);
            const transformations = historyResult.data;
            
            if (format === 'csv') {
                return this._exportToCSV(transformations);
            } else if (format === 'json') {
                return this._exportToJSON(transformations);
            } else {
                throw new Error(`Format export tidak didukung: ${format}`);
            }
        } catch (error) {
            console.error('Error exporting transformation history:', error);
            throw error;
        }
    }

    /**
     * Membersihkan log lama berdasarkan retention policy
     * @param {number} retentionDays - Jumlah hari untuk menyimpan log
     * @returns {Promise<number>} Jumlah log yang dihapus
     */
    async cleanupOldLogs(retentionDays = 90) {
        this._ensureInitialized();
        
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
            
            const allLogs = this._getAllLogs();
            const logsToKeep = allLogs.filter(log => 
                new Date(log.timestamp) >= cutoffDate
            );
            
            const deletedCount = allLogs.length - logsToKeep.length;
            
            // Save filtered logs
            localStorage.setItem('transformationLogs', JSON.stringify(logsToKeep));
            this._loadExistingLogs();
            
            return deletedCount;
        } catch (error) {
            console.error('Error cleaning up old logs:', error);
            throw error;
        }
    }

    /**
     * Mendapatkan statistik transformasi
     * @param {Object} filters - Filter untuk statistik
     * @returns {Promise<Object>} Statistik transformasi
     */
    async getTransformationStatistics(filters = {}) {
        this._ensureInitialized();
        
        try {
            const history = await this.getTransformationHistory(filters);
            
            const stats = {
                totalTransformations: history.length,
                successfulTransformations: history.filter(t => t.status === 'completed').length,
                failedTransformations: history.filter(t => t.status === 'failed').length,
                uniqueUsers: [...new Set(history.map(t => t.user))].length,
                uniqueProducts: [...new Set(history.map(t => t.sourceItem.baseProduct || t.sourceItem.id))].length,
                dateRange: {
                    earliest: history.length > 0 ? Math.min(...history.map(t => new Date(t.timestamp))) : null,
                    latest: history.length > 0 ? Math.max(...history.map(t => new Date(t.timestamp))) : null
                }
            };
            
            return stats;
        } catch (error) {
            console.error('Error getting transformation statistics:', error);
            throw error;
        }
    }

    /**
     * Memuat log yang sudah ada dari localStorage
     * @private
     */
    _loadExistingLogs() {
        try {
            const logsData = localStorage.getItem('transformationLogs');
            this.logCache = logsData ? JSON.parse(logsData) : [];
        } catch (error) {
            console.error('Error loading existing logs:', error);
            this.logCache = [];
        }
    }

    /**
     * Menyimpan log entry ke localStorage
     * @param {Object} logEntry - Entry log yang akan disimpan
     * @private
     */
    async _saveLogEntry(logEntry) {
        try {
            const allLogs = this._getAllLogs();
            allLogs.push(logEntry);
            
            // Sort by timestamp (newest first)
            allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            localStorage.setItem('transformationLogs', JSON.stringify(allLogs));
        } catch (error) {
            console.error('Error saving log entry:', error);
            throw error;
        }
    }

    /**
     * Mendapatkan semua log dari localStorage
     * @returns {Object[]} Array semua log
     * @private
     */
    _getAllLogs() {
        try {
            const logsData = localStorage.getItem('transformationLogs');
            return logsData ? JSON.parse(logsData) : [];
        } catch (error) {
            console.error('Error getting all logs:', error);
            return [];
        }
    }

    /**
     * Generate unique ID untuk log entry
     * @returns {string} Unique log ID
     * @private
     */
    _generateLogId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `LOG-${timestamp}-${random}`;
    }

    /**
     * Mendapatkan log berdasarkan transformation ID
     * @param {string} transformationId - ID transformasi
     * @returns {Promise<Object|null>} Log entry atau null jika tidak ditemukan
     */
    async getTransformationLog(transformationId) {
        this._ensureInitialized();
        
        try {
            const allLogs = this._getAllLogs();
            const log = allLogs.find(log => 
                log.type === 'transformation' && log.transformationId === transformationId
            );
            
            return log || null;
        } catch (error) {
            console.error('Error getting transformation log:', error);
            throw error;
        }
    }

    /**
     * Mendapatkan ringkasan aktivitas transformasi per hari
     * @param {number} days - Jumlah hari ke belakang
     * @returns {Promise<Object[]>} Array ringkasan per hari
     */
    async getDailyTransformationSummary(days = 30) {
        this._ensureInitialized();
        
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            
            const historyResult = await this.getTransformationHistory({
                dateFrom: startDate.toISOString(),
                dateTo: endDate.toISOString()
            });
            
            const transformations = historyResult.data;
            const dailySummary = {};
            
            // Group by date
            transformations.forEach(log => {
                const date = new Date(log.timestamp).toISOString().split('T')[0];
                
                if (!dailySummary[date]) {
                    dailySummary[date] = {
                        date,
                        totalTransformations: 0,
                        successfulTransformations: 0,
                        failedTransformations: 0,
                        uniqueUsers: new Set(),
                        uniqueProducts: new Set(),
                        transformationTypes: {}
                    };
                }
                
                const summary = dailySummary[date];
                summary.totalTransformations++;
                
                if (log.status === 'completed') {
                    summary.successfulTransformations++;
                } else if (log.status === 'failed') {
                    summary.failedTransformations++;
                }
                
                summary.uniqueUsers.add(log.user);
                summary.uniqueProducts.add(log.metadata.baseProduct);
                
                const transformationType = log.metadata.transformationType;
                summary.transformationTypes[transformationType] = 
                    (summary.transformationTypes[transformationType] || 0) + 1;
            });
            
            // Convert Sets to counts and return array
            return Object.values(dailySummary).map(summary => ({
                ...summary,
                uniqueUsers: summary.uniqueUsers.size,
                uniqueProducts: summary.uniqueProducts.size
            })).sort((a, b) => new Date(b.date) - new Date(a.date));
            
        } catch (error) {
            console.error('Error getting daily transformation summary:', error);
            throw error;
        }
    }

    /**
     * Mencari log berdasarkan kriteria tertentu
     * @param {string} searchTerm - Term pencarian
     * @param {Object} options - Opsi pencarian
     * @returns {Promise<Object[]>} Array hasil pencarian
     */
    async searchLogs(searchTerm, options = {}) {
        this._ensureInitialized();
        
        try {
            const allLogs = this._getAllLogs();
            const searchTermLower = searchTerm.toLowerCase();
            
            const results = allLogs.filter(log => {
                // Search in various fields
                const searchFields = [
                    log.user,
                    log.message,
                    log.sourceItem?.name,
                    log.targetItem?.name,
                    log.sourceItem?.id,
                    log.targetItem?.id,
                    log.metadata?.baseProduct,
                    log.transformationId
                ];
                
                return searchFields.some(field => 
                    field && field.toString().toLowerCase().includes(searchTermLower)
                );
            });
            
            // Sort by relevance (transformation logs first, then by timestamp)
            results.sort((a, b) => {
                if (a.type === 'transformation' && b.type !== 'transformation') return -1;
                if (a.type !== 'transformation' && b.type === 'transformation') return 1;
                return new Date(b.timestamp) - new Date(a.timestamp);
            });
            
            return results;
        } catch (error) {
            console.error('Error searching logs:', error);
            throw error;
        }
    }

    /**
     * Menghitung perubahan nilai dari transformasi
     * @param {Object} transformationRecord - Record transformasi
     * @returns {number} Perubahan nilai total
     * @private
     */
    _calculateValueChange(transformationRecord) {
        try {
            // Asumsi: harga per unit sama untuk source dan target dari produk yang sama
            // Dalam implementasi nyata, ini bisa lebih kompleks
            const sourceValue = transformationRecord.sourceItem.quantity * 
                               (transformationRecord.sourceItem.unitPrice || 0);
            const targetValue = transformationRecord.targetItem.quantity * 
                               (transformationRecord.targetItem.unitPrice || 0);
            
            return targetValue - sourceValue;
        } catch (error) {
            console.warn('Error calculating value change:', error);
            return 0;
        }
    }

    /**
     * Export ke format CSV
     * @param {Object[]} transformations - Array transformasi
     * @returns {string} Data dalam format CSV
     * @private
     */
    _exportToCSV(transformations) {
        const headers = [
            'Timestamp',
            'User',
            'Status',
            'Source Item',
            'Source Unit',
            'Source Quantity',
            'Source Stock Before',
            'Source Stock After',
            'Target Item',
            'Target Unit',
            'Target Quantity',
            'Target Stock Before',
            'Target Stock After',
            'Conversion Ratio',
            'Base Product',
            'Transformation Type'
        ];
        
        const csvRows = [headers.join(',')];
        
        transformations.forEach(log => {
            const row = [
                log.timestamp,
                log.user,
                log.status,
                `"${log.sourceItem.name}"`,
                log.sourceItem.unit,
                log.sourceItem.quantity,
                log.sourceItem.stockBefore,
                log.sourceItem.stockAfter,
                `"${log.targetItem.name}"`,
                log.targetItem.unit,
                log.targetItem.quantity,
                log.targetItem.stockBefore,
                log.targetItem.stockAfter,
                log.conversionRatio,
                log.metadata.baseProduct,
                log.metadata.transformationType
            ];
            csvRows.push(row.join(','));
        });
        
        return csvRows.join('\n');
    }

    /**
     * Export ke format JSON
     * @param {Object[]} transformations - Array transformasi
     * @returns {string} Data dalam format JSON
     * @private
     */
    _exportToJSON(transformations) {
        const exportData = {
            exportTimestamp: new Date().toISOString(),
            totalRecords: transformations.length,
            transformations: transformations
        };
        
        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Memastikan AuditLogger sudah diinisialisasi
     * @private
     */
    _ensureInitialized() {
        if (!this.initialized) {
            throw new Error('AuditLogger belum diinisialisasi. Panggil initialize() terlebih dahulu.');
        }
    }
}

// Export untuk browser dan Node.js
if (typeof window !== 'undefined') {
    window.AuditLogger = AuditLogger;
}

// ES6 module export
export default AuditLogger;