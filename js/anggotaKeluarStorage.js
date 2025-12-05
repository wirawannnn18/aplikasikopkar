// Anggota Keluar Storage Optimization Module
// Implements data compression and cleanup for localStorage
// Task 15.3: Optimize localStorage usage

/**
 * Storage Manager for Anggota Keluar Feature
 * Provides compression, cleanup, and quota monitoring
 */
const AnggotaKeluarStorage = (function() {
    'use strict';

    // Configuration
    const config = {
        compressionEnabled: true,
        maxAuditLogAge: 90 * 24 * 60 * 60 * 1000,  // 90 days
        maxAuditLogCount: 1000,
        quotaWarningThreshold: 0.8,  // 80% of quota
        autoCleanupEnabled: true
    };

    // Storage keys
    const KEYS = {
        AUDIT_LOGS: 'auditLogsAnggotaKeluar',
        PENGEMBALIAN: 'pengembalian',
        ANGGOTA: 'anggota',
        COMPRESSED_PREFIX: 'compressed_'
    };

    /**
     * Get localStorage usage statistics
     * @returns {object} Storage statistics
     */
    function getStorageStats() {
        let totalSize = 0;
        const itemSizes = {};

        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                const value = localStorage.getItem(key);
                const size = new Blob([value]).size;
                totalSize += size;
                itemSizes[key] = size;
            }
        }

        // Estimate quota (5MB for most browsers)
        const estimatedQuota = 5 * 1024 * 1024;  // 5MB
        const usagePercent = (totalSize / estimatedQuota) * 100;

        return {
            totalSize: totalSize,
            totalSizeFormatted: formatBytes(totalSize),
            estimatedQuota: estimatedQuota,
            estimatedQuotaFormatted: formatBytes(estimatedQuota),
            usagePercent: usagePercent.toFixed(2),
            itemCount: Object.keys(itemSizes).length,
            itemSizes: itemSizes,
            isNearQuota: usagePercent > (config.quotaWarningThreshold * 100)
        };
    }

    /**
     * Format bytes to human readable format
     * @param {number} bytes - Bytes to format
     * @returns {string} Formatted string
     */
    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    /**
     * Simple compression using LZW algorithm
     * @param {string} str - String to compress
     * @returns {string} Compressed string
     */
    function compress(str) {
        if (!config.compressionEnabled || !str) {
            return str;
        }

        try {
            const dict = {};
            const data = (str + '').split('');
            const out = [];
            let currChar;
            let phrase = data[0];
            let code = 256;

            for (let i = 1; i < data.length; i++) {
                currChar = data[i];
                if (dict[phrase + currChar] != null) {
                    phrase += currChar;
                } else {
                    out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
                    dict[phrase + currChar] = code;
                    code++;
                    phrase = currChar;
                }
            }
            out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));

            for (let i = 0; i < out.length; i++) {
                out[i] = String.fromCharCode(out[i]);
            }

            return out.join('');
        } catch (error) {
            console.error('Compression error:', error);
            return str;  // Return original if compression fails
        }
    }

    /**
     * Decompress LZW compressed string
     * @param {string} str - Compressed string
     * @returns {string} Decompressed string
     */
    function decompress(str) {
        if (!config.compressionEnabled || !str) {
            return str;
        }

        try {
            const dict = {};
            const data = (str + '').split('');
            let currChar = data[0];
            let oldPhrase = currChar;
            const out = [currChar];
            let code = 256;
            let phrase;

            for (let i = 1; i < data.length; i++) {
                const currCode = data[i].charCodeAt(0);
                if (currCode < 256) {
                    phrase = data[i];
                } else {
                    phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
                }
                out.push(phrase);
                currChar = phrase.charAt(0);
                dict[code] = oldPhrase + currChar;
                code++;
                oldPhrase = phrase;
            }

            return out.join('');
        } catch (error) {
            console.error('Decompression error:', error);
            return str;  // Return original if decompression fails
        }
    }

    /**
     * Save data with optional compression
     * @param {string} key - Storage key
     * @param {any} data - Data to save
     * @param {boolean} useCompression - Whether to compress
     * @returns {object} Save result
     */
    function saveData(key, data, useCompression = false) {
        try {
            const jsonString = JSON.stringify(data);
            const originalSize = new Blob([jsonString]).size;

            let valueToStore = jsonString;
            let actualKey = key;
            let compressed = false;

            if (useCompression && config.compressionEnabled) {
                const compressedString = compress(jsonString);
                const compressedSize = new Blob([compressedString]).size;

                // Only use compression if it actually reduces size
                if (compressedSize < originalSize) {
                    valueToStore = compressedString;
                    actualKey = KEYS.COMPRESSED_PREFIX + key;
                    compressed = true;
                }
            }

            localStorage.setItem(actualKey, valueToStore);

            const finalSize = new Blob([valueToStore]).size;

            return {
                success: true,
                key: actualKey,
                originalSize: originalSize,
                finalSize: finalSize,
                compressed: compressed,
                compressionRatio: compressed ? ((1 - finalSize / originalSize) * 100).toFixed(2) + '%' : '0%'
            };
        } catch (error) {
            console.error('Save data error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Load data with automatic decompression
     * @param {string} key - Storage key
     * @returns {any} Loaded data
     */
    function loadData(key) {
        try {
            // Check if compressed version exists
            const compressedKey = KEYS.COMPRESSED_PREFIX + key;
            let value = localStorage.getItem(compressedKey);
            let wasCompressed = false;

            if (value) {
                wasCompressed = true;
            } else {
                value = localStorage.getItem(key);
            }

            if (!value) {
                return null;
            }

            // Decompress if needed
            if (wasCompressed) {
                value = decompress(value);
            }

            return JSON.parse(value);
        } catch (error) {
            console.error('Load data error:', error);
            return null;
        }
    }

    /**
     * Clean up old audit logs
     * @returns {object} Cleanup result
     */
    function cleanupAuditLogs() {
        try {
            const auditLogs = JSON.parse(localStorage.getItem(KEYS.AUDIT_LOGS) || '[]');
            const now = Date.now();
            const maxAge = config.maxAuditLogAge;
            const maxCount = config.maxAuditLogCount;

            const originalCount = auditLogs.length;

            // Filter by age
            let cleaned = auditLogs.filter(log => {
                const logDate = new Date(log.timestamp).getTime();
                const age = now - logDate;
                return age < maxAge;
            });

            // Sort by timestamp (newest first)
            cleaned.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            // Keep only maxCount newest logs
            if (cleaned.length > maxCount) {
                cleaned = cleaned.slice(0, maxCount);
            }

            const finalCount = cleaned.length;
            const removedCount = originalCount - finalCount;

            // Save cleaned logs
            localStorage.setItem(KEYS.AUDIT_LOGS, JSON.stringify(cleaned));

            return {
                success: true,
                originalCount: originalCount,
                finalCount: finalCount,
                removedCount: removedCount,
                message: `Berhasil menghapus ${removedCount} audit log lama`
            };
        } catch (error) {
            console.error('Cleanup audit logs error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Clean up completed pengembalian older than specified days
     * @param {number} daysOld - Days threshold
     * @returns {object} Cleanup result
     */
    function cleanupOldPengembalian(daysOld = 365) {
        try {
            const pengembalian = JSON.parse(localStorage.getItem(KEYS.PENGEMBALIAN) || '[]');
            const now = Date.now();
            const maxAge = daysOld * 24 * 60 * 60 * 1000;

            const originalCount = pengembalian.length;

            // Keep only recent or pending pengembalian
            const cleaned = pengembalian.filter(p => {
                // Always keep pending
                if (p.status !== 'Selesai') {
                    return true;
                }

                // Check age for completed
                const processedDate = new Date(p.processedAt).getTime();
                const age = now - processedDate;
                return age < maxAge;
            });

            const finalCount = cleaned.length;
            const removedCount = originalCount - finalCount;

            // Save cleaned data
            localStorage.setItem(KEYS.PENGEMBALIAN, JSON.stringify(cleaned));

            return {
                success: true,
                originalCount: originalCount,
                finalCount: finalCount,
                removedCount: removedCount,
                message: `Berhasil menghapus ${removedCount} data pengembalian lama`
            };
        } catch (error) {
            console.error('Cleanup pengembalian error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Compress large data structures
     * @returns {object} Compression result
     */
    function compressLargeData() {
        try {
            const results = [];
            const keysToCompress = [KEYS.AUDIT_LOGS, KEYS.PENGEMBALIAN];

            keysToCompress.forEach(key => {
                const data = loadData(key);
                if (data) {
                    const result = saveData(key, data, true);
                    results.push({
                        key: key,
                        ...result
                    });
                }
            });

            const totalSaved = results.reduce((sum, r) => sum + (r.originalSize - r.finalSize), 0);

            return {
                success: true,
                results: results,
                totalSaved: totalSaved,
                totalSavedFormatted: formatBytes(totalSaved),
                message: `Berhasil menghemat ${formatBytes(totalSaved)} storage`
            };
        } catch (error) {
            console.error('Compress large data error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Run full cleanup and optimization
     * @returns {object} Optimization result
     */
    function optimize() {
        try {
            const statsBefore = getStorageStats();

            // 1. Cleanup audit logs
            const auditResult = cleanupAuditLogs();

            // 2. Cleanup old pengembalian
            const pengembalianResult = cleanupOldPengembalian();

            // 3. Compress large data
            const compressionResult = compressLargeData();

            const statsAfter = getStorageStats();

            const savedSpace = statsBefore.totalSize - statsAfter.totalSize;

            return {
                success: true,
                before: statsBefore,
                after: statsAfter,
                savedSpace: savedSpace,
                savedSpaceFormatted: formatBytes(savedSpace),
                details: {
                    auditLogs: auditResult,
                    pengembalian: pengembalianResult,
                    compression: compressionResult
                },
                message: `Optimasi selesai. Berhasil menghemat ${formatBytes(savedSpace)} storage`
            };
        } catch (error) {
            console.error('Optimize error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Check if storage optimization is needed
     * @returns {object} Check result
     */
    function checkOptimizationNeeded() {
        const stats = getStorageStats();
        const auditLogs = JSON.parse(localStorage.getItem(KEYS.AUDIT_LOGS) || '[]');

        const needsOptimization = 
            stats.isNearQuota ||
            auditLogs.length > config.maxAuditLogCount;

        return {
            needed: needsOptimization,
            reasons: {
                nearQuota: stats.isNearQuota,
                tooManyAuditLogs: auditLogs.length > config.maxAuditLogCount
            },
            stats: stats,
            auditLogCount: auditLogs.length
        };
    }

    /**
     * Auto cleanup if enabled and needed
     */
    function autoCleanup() {
        if (!config.autoCleanupEnabled) {
            return;
        }

        const check = checkOptimizationNeeded();
        if (check.needed) {
            console.log('Auto cleanup triggered');
            optimize();
        }
    }

    /**
     * Monitor storage quota and warn if near limit
     * @returns {object} Monitor result
     */
    function monitorQuota() {
        const stats = getStorageStats();

        if (stats.isNearQuota) {
            console.warn(`Storage usage: ${stats.usagePercent}% - Near quota limit!`);
            
            // Trigger auto cleanup if enabled
            if (config.autoCleanupEnabled) {
                autoCleanup();
            }

            return {
                warning: true,
                message: `Storage hampir penuh (${stats.usagePercent}%). Pertimbangkan untuk menjalankan optimasi.`,
                stats: stats
            };
        }

        return {
            warning: false,
            message: `Storage usage normal (${stats.usagePercent}%)`,
            stats: stats
        };
    }

    /**
     * Get storage report
     * @returns {object} Detailed storage report
     */
    function getStorageReport() {
        const stats = getStorageStats();
        const auditLogs = JSON.parse(localStorage.getItem(KEYS.AUDIT_LOGS) || '[]');
        const pengembalian = JSON.parse(localStorage.getItem(KEYS.PENGEMBALIAN) || '[]');

        // Calculate oldest audit log
        let oldestAuditLog = null;
        if (auditLogs.length > 0) {
            const sorted = [...auditLogs].sort((a, b) => 
                new Date(a.timestamp) - new Date(b.timestamp)
            );
            oldestAuditLog = sorted[0].timestamp;
        }

        return {
            summary: {
                totalSize: stats.totalSizeFormatted,
                usagePercent: stats.usagePercent + '%',
                itemCount: stats.itemCount,
                isNearQuota: stats.isNearQuota
            },
            auditLogs: {
                count: auditLogs.length,
                size: formatBytes(stats.itemSizes[KEYS.AUDIT_LOGS] || 0),
                oldest: oldestAuditLog,
                maxAllowed: config.maxAuditLogCount
            },
            pengembalian: {
                count: pengembalian.length,
                size: formatBytes(stats.itemSizes[KEYS.PENGEMBALIAN] || 0),
                pending: pengembalian.filter(p => p.status !== 'Selesai').length,
                completed: pengembalian.filter(p => p.status === 'Selesai').length
            },
            recommendations: getRecommendations(stats, auditLogs, pengembalian)
        };
    }

    /**
     * Get optimization recommendations
     * @param {object} stats - Storage stats
     * @param {array} auditLogs - Audit logs
     * @param {array} pengembalian - Pengembalian records
     * @returns {array} Recommendations
     */
    function getRecommendations(stats, auditLogs, pengembalian) {
        const recommendations = [];

        if (stats.isNearQuota) {
            recommendations.push({
                priority: 'high',
                message: 'Storage hampir penuh. Jalankan optimasi segera.',
                action: 'optimize'
            });
        }

        if (auditLogs.length > config.maxAuditLogCount) {
            recommendations.push({
                priority: 'medium',
                message: `Audit logs terlalu banyak (${auditLogs.length}). Hapus log lama.`,
                action: 'cleanupAuditLogs'
            });
        }

        const oldPengembalian = pengembalian.filter(p => {
            if (p.status !== 'Selesai') return false;
            const age = Date.now() - new Date(p.processedAt).getTime();
            return age > 365 * 24 * 60 * 60 * 1000;  // > 1 year
        });

        if (oldPengembalian.length > 0) {
            recommendations.push({
                priority: 'low',
                message: `${oldPengembalian.length} data pengembalian lebih dari 1 tahun. Pertimbangkan untuk diarsipkan.`,
                action: 'cleanupOldPengembalian'
            });
        }

        if (recommendations.length === 0) {
            recommendations.push({
                priority: 'info',
                message: 'Storage dalam kondisi baik. Tidak ada aksi yang diperlukan.',
                action: null
            });
        }

        return recommendations;
    }

    // Initialize: Run auto cleanup on load if enabled
    if (config.autoCleanupEnabled) {
        setTimeout(autoCleanup, 1000);  // Run after 1 second
    }

    // Public API
    return {
        // Configuration
        config,
        
        // Storage stats
        getStorageStats,
        getStorageReport,
        monitorQuota,
        
        // Data operations
        saveData,
        loadData,
        
        // Compression
        compress,
        decompress,
        compressLargeData,
        
        // Cleanup
        cleanupAuditLogs,
        cleanupOldPengembalian,
        
        // Optimization
        optimize,
        checkOptimizationNeeded,
        autoCleanup,
        
        // Utilities
        formatBytes
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnggotaKeluarStorage;
}
