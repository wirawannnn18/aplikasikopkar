// Anggota Keluar Cache Module
// Implements caching for expensive calculations and frequently accessed data
// Task 15.1: Implement data caching

/**
 * Cache Manager for Anggota Keluar Feature
 * Provides memoization and cache invalidation for performance optimization
 */
const AnggotaKeluarCache = (function() {
    'use strict';

    // Cache storage
    const cache = {
        calculations: new Map(),      // Cached calculation results
        totals: new Map(),            // Cached total calculations
        reports: new Map(),           // Cached report data
        metadata: new Map()           // Cache metadata (timestamps, hit counts)
    };

    // Cache configuration
    const config = {
        maxAge: 5 * 60 * 1000,       // 5 minutes default TTL
        maxSize: 100,                 // Maximum cache entries
        enableLogging: false          // Enable cache logging for debugging
    };

    /**
     * Generate cache key from parameters
     * @param {string} prefix - Cache key prefix
     * @param {object} params - Parameters to include in key
     * @returns {string} Cache key
     */
    function generateCacheKey(prefix, params) {
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}:${JSON.stringify(params[key])}`)
            .join('|');
        return `${prefix}:${sortedParams}`;
    }

    /**
     * Check if cache entry is still valid
     * @param {object} metadata - Cache metadata
     * @returns {boolean} True if valid
     */
    function isValid(metadata) {
        if (!metadata) return false;
        const age = Date.now() - metadata.timestamp;
        return age < config.maxAge;
    }

    /**
     * Log cache operation (if logging enabled)
     * @param {string} operation - Operation type
     * @param {string} key - Cache key
     * @param {any} data - Additional data
     */
    function log(operation, key, data = null) {
        if (config.enableLogging) {
            console.log(`[Cache] ${operation}:`, key, data);
        }
    }

    /**
     * Evict oldest entries if cache is full
     * @param {Map} cacheMap - Cache map to clean
     */
    function evictOldest(cacheMap) {
        if (cacheMap.size >= config.maxSize) {
            // Find oldest entry
            let oldestKey = null;
            let oldestTime = Infinity;

            for (const [key, _] of cacheMap) {
                const metadata = cache.metadata.get(key);
                if (metadata && metadata.timestamp < oldestTime) {
                    oldestTime = metadata.timestamp;
                    oldestKey = key;
                }
            }

            if (oldestKey) {
                cacheMap.delete(oldestKey);
                cache.metadata.delete(oldestKey);
                log('EVICT', oldestKey);
            }
        }
    }

    /**
     * Set cache entry
     * @param {string} type - Cache type (calculations, totals, reports)
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     */
    function set(type, key, value) {
        const cacheMap = cache[type];
        if (!cacheMap) {
            console.error(`Invalid cache type: ${type}`);
            return;
        }

        // Evict oldest if needed
        evictOldest(cacheMap);

        // Store value
        cacheMap.set(key, value);

        // Store metadata
        cache.metadata.set(key, {
            timestamp: Date.now(),
            hits: 0,
            type: type
        });

        log('SET', key, { type, size: cacheMap.size });
    }

    /**
     * Get cache entry
     * @param {string} type - Cache type
     * @param {string} key - Cache key
     * @returns {any} Cached value or null
     */
    function get(type, key) {
        const cacheMap = cache[type];
        if (!cacheMap) {
            console.error(`Invalid cache type: ${type}`);
            return null;
        }

        const metadata = cache.metadata.get(key);
        
        // Check if entry exists and is valid
        if (!cacheMap.has(key) || !isValid(metadata)) {
            log('MISS', key, { type });
            return null;
        }

        // Update hit count
        metadata.hits++;
        cache.metadata.set(key, metadata);

        log('HIT', key, { type, hits: metadata.hits });
        return cacheMap.get(key);
    }

    /**
     * Invalidate cache entries by pattern
     * @param {string} pattern - Pattern to match (supports wildcards)
     */
    function invalidate(pattern) {
        let count = 0;

        // Convert pattern to regex
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');

        // Check all cache types
        for (const [type, cacheMap] of Object.entries(cache)) {
            if (type === 'metadata') continue;

            for (const key of cacheMap.keys()) {
                if (regex.test(key)) {
                    cacheMap.delete(key);
                    cache.metadata.delete(key);
                    count++;
                }
            }
        }

        log('INVALIDATE', pattern, { count });
        return count;
    }

    /**
     * Clear all cache
     */
    function clear() {
        cache.calculations.clear();
        cache.totals.clear();
        cache.reports.clear();
        cache.metadata.clear();
        log('CLEAR', 'all');
    }

    /**
     * Get cache statistics
     * @returns {object} Cache statistics
     */
    function getStats() {
        const stats = {
            size: {
                calculations: cache.calculations.size,
                totals: cache.totals.size,
                reports: cache.reports.size,
                total: cache.calculations.size + cache.totals.size + cache.reports.size
            },
            hits: 0,
            entries: []
        };

        // Calculate total hits and collect entry info
        for (const [key, metadata] of cache.metadata) {
            stats.hits += metadata.hits;
            stats.entries.push({
                key,
                type: metadata.type,
                age: Date.now() - metadata.timestamp,
                hits: metadata.hits
            });
        }

        return stats;
    }

    // ============================================
    // Memoized Functions for Expensive Operations
    // ============================================

    /**
     * Memoized: Calculate total simpanan pokok for anggota
     * @param {string} anggotaId - ID of the anggota
     * @returns {number} Total simpanan pokok
     */
    function getTotalSimpananPokokCached(anggotaId) {
        const key = generateCacheKey('simpanan_pokok', { anggotaId });
        
        // Check cache first
        let total = get('totals', key);
        if (total !== null) {
            return total;
        }

        // Calculate if not cached
        const simpananPokok = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
        total = simpananPokok
            .filter(s => s.anggotaId === anggotaId)
            .reduce((sum, s) => sum + (parseFloat(s.jumlah) || 0), 0);

        // Cache result
        set('totals', key, total);
        return total;
    }

    /**
     * Memoized: Calculate total simpanan wajib for anggota
     * @param {string} anggotaId - ID of the anggota
     * @returns {number} Total simpanan wajib
     */
    function getTotalSimpananWajibCached(anggotaId) {
        const key = generateCacheKey('simpanan_wajib', { anggotaId });
        
        let total = get('totals', key);
        if (total !== null) {
            return total;
        }

        const simpananWajib = JSON.parse(localStorage.getItem('simpananWajib') || '[]');
        total = simpananWajib
            .filter(s => s.anggotaId === anggotaId)
            .reduce((sum, s) => sum + (parseFloat(s.jumlah) || 0), 0);

        set('totals', key, total);
        return total;
    }

    /**
     * Memoized: Calculate kewajiban lain for anggota
     * @param {string} anggotaId - ID of the anggota
     * @returns {number} Total kewajiban
     */
    function getKewajibanLainCached(anggotaId) {
        const key = generateCacheKey('kewajiban', { anggotaId });
        
        let total = get('totals', key);
        if (total !== null) {
            return total;
        }

        const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
        const pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
        
        const totalKredit = penjualan
            .filter(p => p.anggotaId === anggotaId && p.status === 'kredit')
            .reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
        
        const totalBayar = pembayaran
            .filter(p => p.anggotaId === anggotaId && p.jenis === 'hutang' && p.status === 'selesai')
            .reduce((sum, p) => sum + (parseFloat(p.jumlah) || 0), 0);
        
        total = totalKredit - totalBayar;
        total = total > 0 ? total : 0;

        set('totals', key, total);
        return total;
    }

    /**
     * Memoized: Calculate total pengembalian for anggota
     * @param {string} anggotaId - ID of the anggota
     * @returns {object} Calculation result with breakdown
     */
    function calculatePengembalianCached(anggotaId) {
        const key = generateCacheKey('pengembalian', { anggotaId });
        
        let result = get('calculations', key);
        if (result !== null) {
            return result;
        }

        // Calculate using cached sub-totals
        const simpananPokok = getTotalSimpananPokokCached(anggotaId);
        const simpananWajib = getTotalSimpananWajibCached(anggotaId);
        const kewajibanLain = getKewajibanLainCached(anggotaId);

        result = {
            simpananPokok,
            simpananWajib,
            totalSimpanan: simpananPokok + simpananWajib,
            kewajibanLain,
            totalPengembalian: (simpananPokok + simpananWajib) - kewajibanLain
        };

        set('calculations', key, result);
        return result;
    }

    /**
     * Memoized: Get filtered anggota keluar report
     * @param {string} startDate - Start date filter (YYYY-MM-DD)
     * @param {string} endDate - End date filter (YYYY-MM-DD)
     * @returns {array} Filtered anggota keluar records
     */
    function getAnggotaKeluarReportCached(startDate, endDate) {
        const key = generateCacheKey('report', { startDate, endDate });
        
        let report = get('reports', key);
        if (report !== null) {
            return report;
        }

        // Get all anggota keluar
        const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
        let filtered = anggota.filter(a => a.statusKeanggotaan === 'Keluar');

        // Apply date filters
        if (startDate) {
            filtered = filtered.filter(a => a.tanggalKeluar >= startDate);
        }
        if (endDate) {
            filtered = filtered.filter(a => a.tanggalKeluar <= endDate);
        }

        // Enrich with pengembalian data (using cached calculations)
        report = filtered.map(a => {
            const calculation = calculatePengembalianCached(a.id);
            return {
                ...a,
                ...calculation
            };
        });

        set('reports', key, report);
        return report;
    }

    // ============================================
    // Cache Invalidation Helpers
    // ============================================

    /**
     * Invalidate cache for specific anggota
     * @param {string} anggotaId - ID of the anggota
     */
    function invalidateAnggota(anggotaId) {
        invalidate(`*anggotaId:*${anggotaId}*`);
    }

    /**
     * Invalidate all simpanan-related cache
     */
    function invalidateSimpanan() {
        invalidate('simpanan_*');
        invalidate('pengembalian:*');
        invalidate('report:*');
    }

    /**
     * Invalidate all reports cache
     */
    function invalidateReports() {
        invalidate('report:*');
    }

    /**
     * Invalidate all calculations cache
     */
    function invalidateCalculations() {
        invalidate('pengembalian:*');
        invalidate('simpanan_*');
        invalidate('kewajiban:*');
    }

    // Public API
    return {
        // Core cache operations
        set,
        get,
        invalidate,
        clear,
        getStats,
        
        // Memoized functions
        getTotalSimpananPokokCached,
        getTotalSimpananWajibCached,
        getKewajibanLainCached,
        calculatePengembalianCached,
        getAnggotaKeluarReportCached,
        
        // Cache invalidation helpers
        invalidateAnggota,
        invalidateSimpanan,
        invalidateReports,
        invalidateCalculations,
        
        // Configuration
        config
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnggotaKeluarCache;
}
