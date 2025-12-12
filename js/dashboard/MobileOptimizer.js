/**
 * Mobile Performance Optimizer
 * 
 * Optimizes dashboard performance for mobile devices by implementing:
 * - Data compression for mobile networks
 * - Progressive image loading for charts
 * - Mobile-specific caching strategies
 * - Network-aware performance tuning
 */

export class MobileOptimizer {
    constructor(dashboardController) {
        this.dashboardController = dashboardController;
        this.isInitialized = false;
        
        // Performance settings
        this.performanceSettings = {
            enableDataCompression: true,
            enableProgressiveLoading: true,
            enableMobileCaching: true,
            enableNetworkAwareness: true,
            compressionLevel: 'medium',
            imageQuality: 0.8,
            maxCacheSize: 50 * 1024 * 1024, // 50MB
            networkThrottleThreshold: '3g'
        };
        
        // Network monitoring
        this.networkInfo = {
            type: 'unknown',
            effectiveType: 'unknown',
            downlink: 0,
            rtt: 0,
            saveData: false
        };
        
        // Cache management
        this.cache = new Map();
        this.cacheStats = {
            hits: 0,
            misses: 0,
            size: 0,
            lastCleanup: Date.now()
        };
        
        // Performance metrics
        this.metrics = {
            dataTransferred: 0,
            compressionRatio: 0,
            loadTimes: [],
            cacheHitRate: 0
        };
        
        // Bind methods
        this.handleNetworkChange = this.handleNetworkChange.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    }
    
    /**
     * Initialize mobile optimizer
     */
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            // Detect mobile environment
            this.detectMobileEnvironment();
            
            // Initialize network monitoring
            this.initializeNetworkMonitoring();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize compression system
            this.initializeCompression();
            
            // Setup progressive loading
            this.initializeProgressiveLoading();
            
            // Initialize mobile caching
            this.initializeMobileCaching();
            
            this.isInitialized = true;
            console.log('Mobile optimizer initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize mobile optimizer:', error);
            throw error;
        }
    }
    
    /**
     * Detect mobile environment and capabilities
     */
    detectMobileEnvironment() {
        // Device detection
        this.deviceInfo = {
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            isTablet: /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent),
            isTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            pixelRatio: window.devicePixelRatio || 1,
            screenSize: {
                width: window.screen.width,
                height: window.screen.height
            },
            viewportSize: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        };
        
        // Memory detection
        if ('memory' in performance) {
            this.deviceInfo.memory = performance.memory.jsHeapSizeLimit;
        }
        
        // Hardware concurrency
        this.deviceInfo.cores = navigator.hardwareConcurrency || 2;
        
        // Adjust performance settings based on device
        this.adjustPerformanceSettings();
    }
    
    /**
     * Adjust performance settings based on device capabilities
     */
    adjustPerformanceSettings() {
        const { isMobile, memory, cores } = this.deviceInfo;
        
        if (isMobile) {
            // Mobile-specific optimizations
            this.performanceSettings.compressionLevel = 'high';
            this.performanceSettings.imageQuality = 0.7;
            this.performanceSettings.maxCacheSize = 25 * 1024 * 1024; // 25MB
        }
        
        // Low-end device detection
        const isLowEnd = (memory && memory < 1000000000) || cores < 4;
        if (isLowEnd) {
            this.performanceSettings.compressionLevel = 'maximum';
            this.performanceSettings.imageQuality = 0.6;
            this.performanceSettings.maxCacheSize = 10 * 1024 * 1024; // 10MB
        }
    }
    
    /**
     * Initialize network monitoring
     */
    initializeNetworkMonitoring() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            this.networkInfo = {
                type: connection.type || 'unknown',
                effectiveType: connection.effectiveType || 'unknown',
                downlink: connection.downlink || 0,
                rtt: connection.rtt || 0,
                saveData: connection.saveData || false
            };
            
            // Listen for network changes
            connection.addEventListener('change', this.handleNetworkChange);
        }
        
        // Fallback network detection
        this.detectNetworkSpeed();
    }
    
    /**
     * Detect network speed using timing
     */
    async detectNetworkSpeed() {
        try {
            const startTime = performance.now();
            
            // Download a small test image
            const testImage = new Image();
            testImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            
            await new Promise((resolve, reject) => {
                testImage.onload = resolve;
                testImage.onerror = reject;
                setTimeout(reject, 5000); // 5 second timeout
            });
            
            const loadTime = performance.now() - startTime;
            
            // Estimate connection speed
            if (loadTime < 100) {
                this.networkInfo.estimatedSpeed = 'fast';
            } else if (loadTime < 500) {
                this.networkInfo.estimatedSpeed = 'medium';
            } else {
                this.networkInfo.estimatedSpeed = 'slow';
            }
            
        } catch (error) {
            this.networkInfo.estimatedSpeed = 'unknown';
        }
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Visibility change for performance optimization
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Window resize for responsive optimization
        window.addEventListener('resize', () => {
            this.deviceInfo.viewportSize = {
                width: window.innerWidth,
                height: window.innerHeight
            };
        });
        
        // Page unload for cleanup
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
    }
    
    /**
     * Handle network change events
     */
    handleNetworkChange() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            this.networkInfo = {
                type: connection.type || 'unknown',
                effectiveType: connection.effectiveType || 'unknown',
                downlink: connection.downlink || 0,
                rtt: connection.rtt || 0,
                saveData: connection.saveData || false
            };
            
            // Adjust performance based on network
            this.adjustPerformanceForNetwork();
        }
    }
    
    /**
     * Adjust performance settings based on network conditions
     */
    adjustPerformanceForNetwork() {
        const { effectiveType, saveData } = this.networkInfo;
        
        // Slow network optimizations
        if (['slow-2g', '2g', '3g'].includes(effectiveType) || saveData) {
            this.performanceSettings.compressionLevel = 'maximum';
            this.performanceSettings.imageQuality = 0.5;
            this.performanceSettings.enableProgressiveLoading = true;
        }
        
        // Fast network optimizations
        if (['4g'].includes(effectiveType) && !saveData) {
            this.performanceSettings.compressionLevel = 'medium';
            this.performanceSettings.imageQuality = 0.8;
        }
        
        // Notify dashboard of network change
        if (this.dashboardController.onNetworkChange) {
            this.dashboardController.onNetworkChange(this.networkInfo);
        }
    }
    
    /**
     * Handle visibility change for performance optimization
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden, reduce performance
            this.pauseNonEssentialOperations();
        } else {
            // Page is visible, resume normal performance
            this.resumeOperations();
        }
    }
    
    /**
     * Initialize data compression system
     */
    initializeCompression() {
        // Check for compression support
        this.compressionSupport = {
            gzip: 'CompressionStream' in window,
            brotli: false // Not widely supported yet
        };
        
        console.log('Compression support:', this.compressionSupport);
    }
    
    /**
     * Compress data for mobile networks
     */
    async compressData(data, options = {}) {
        if (!this.performanceSettings.enableDataCompression) {
            return data;
        }
        
        const startTime = performance.now();
        let compressedData = data;
        
        try {
            // Convert data to string if needed
            const dataString = typeof data === 'string' ? data : JSON.stringify(data);
            const originalSize = new Blob([dataString]).size;
            
            // Apply compression based on level
            switch (this.performanceSettings.compressionLevel) {
                case 'maximum':
                    compressedData = await this.maximumCompress(dataString);
                    break;
                case 'high':
                    compressedData = await this.highCompress(dataString);
                    break;
                case 'medium':
                    compressedData = await this.mediumCompress(dataString);
                    break;
                default:
                    compressedData = dataString;
            }
            
            // Calculate compression metrics
            const compressedSize = new Blob([compressedData]).size;
            const compressionRatio = (originalSize - compressedSize) / originalSize;
            
            this.metrics.compressionRatio = compressionRatio;
            this.metrics.dataTransferred += compressedSize;
            
            const compressionTime = performance.now() - startTime;
            console.log(`Data compressed: ${originalSize} -> ${compressedSize} bytes (${(compressionRatio * 100).toFixed(1)}% reduction) in ${compressionTime.toFixed(1)}ms`);
            
            return compressedData;
            
        } catch (error) {
            console.error('Compression failed:', error);
            return data;
        }
    }
    
    /**
     * Maximum compression for very slow networks
     */
    async maximumCompress(data) {
        // Remove unnecessary whitespace and formatting
        let compressed = data.replace(/\s+/g, ' ').trim();
        
        // Apply additional compression techniques
        compressed = this.applyStringCompression(compressed);
        
        return compressed;
    }
    
    /**
     * High compression for mobile networks
     */
    async highCompress(data) {
        // Remove some whitespace
        let compressed = data.replace(/\s{2,}/g, ' ').trim();
        
        // Apply moderate compression
        compressed = this.applyStringCompression(compressed);
        
        return compressed;
    }
    
    /**
     * Medium compression for good networks
     */
    async mediumCompress(data) {
        // Light compression
        return data.replace(/\s{3,}/g, '  ').trim();
    }
    
    /**
     * Apply string compression techniques
     */
    applyStringCompression(data) {
        // Simple string compression using common patterns
        const compressionMap = {
            'transaction': 'tx',
            'member': 'mbr',
            'balance': 'bal',
            'amount': 'amt',
            'description': 'desc',
            'timestamp': 'ts',
            'created_at': 'ca',
            'updated_at': 'ua'
        };
        
        let compressed = data;
        for (const [original, replacement] of Object.entries(compressionMap)) {
            compressed = compressed.replace(new RegExp(`"${original}"`, 'g'), `"${replacement}"`);
        }
        
        return compressed;
    }
    
    /**
     * Initialize progressive loading system
     */
    initializeProgressiveLoading() {
        this.progressiveLoader = {
            queue: [],
            loading: false,
            batchSize: this.deviceInfo.isMobile ? 2 : 5,
            delay: this.networkInfo.effectiveType === 'slow-2g' ? 1000 : 500
        };
    }
    
    /**
     * Load chart images progressively
     */
    async loadChartProgressively(chartConfig, container) {
        if (!this.performanceSettings.enableProgressiveLoading) {
            return this.loadChartNormally(chartConfig, container);
        }
        
        return new Promise((resolve, reject) => {
            this.progressiveLoader.queue.push({
                chartConfig,
                container,
                resolve,
                reject,
                priority: chartConfig.priority || 0
            });
            
            this.processProgressiveQueue();
        });
    }
    
    /**
     * Process progressive loading queue
     */
    async processProgressiveQueue() {
        if (this.progressiveLoader.loading || this.progressiveLoader.queue.length === 0) {
            return;
        }
        
        this.progressiveLoader.loading = true;
        
        try {
            // Sort by priority
            this.progressiveLoader.queue.sort((a, b) => b.priority - a.priority);
            
            // Process in batches
            while (this.progressiveLoader.queue.length > 0) {
                const batch = this.progressiveLoader.queue.splice(0, this.progressiveLoader.batchSize);
                
                // Load batch concurrently
                const promises = batch.map(item => this.loadChartItem(item));
                await Promise.all(promises);
                
                // Delay between batches for performance
                if (this.progressiveLoader.queue.length > 0) {
                    await this.delay(this.progressiveLoader.delay);
                }
            }
            
        } finally {
            this.progressiveLoader.loading = false;
        }
    }
    
    /**
     * Load individual chart item
     */
    async loadChartItem(item) {
        try {
            const startTime = performance.now();
            
            // Create optimized chart configuration
            const optimizedConfig = this.optimizeChartConfig(item.chartConfig);
            
            // Load chart with optimization
            const result = await this.loadOptimizedChart(optimizedConfig, item.container);
            
            const loadTime = performance.now() - startTime;
            this.metrics.loadTimes.push(loadTime);
            
            item.resolve(result);
            
        } catch (error) {
            console.error('Failed to load chart item:', error);
            item.reject(error);
        }
    }
    
    /**
     * Optimize chart configuration for mobile
     */
    optimizeChartConfig(config) {
        const optimized = { ...config };
        
        // Reduce data points for mobile
        if (this.deviceInfo.isMobile && optimized.data && optimized.data.datasets) {
            optimized.data.datasets = optimized.data.datasets.map(dataset => ({
                ...dataset,
                data: this.reduceDataPoints(dataset.data)
            }));
        }
        
        // Adjust image quality
        if (optimized.options) {
            optimized.options.devicePixelRatio = Math.min(
                this.deviceInfo.pixelRatio,
                this.performanceSettings.imageQuality * 2
            );
        }
        
        // Disable animations on slow networks
        if (['slow-2g', '2g'].includes(this.networkInfo.effectiveType)) {
            optimized.options = optimized.options || {};
            optimized.options.animation = false;
        }
        
        return optimized;
    }
    
    /**
     * Reduce data points for mobile optimization
     */
    reduceDataPoints(data) {
        if (!Array.isArray(data) || data.length <= 50) {
            return data;
        }
        
        // Sample data points for mobile
        const sampleRate = this.deviceInfo.isMobile ? 0.7 : 0.9;
        const targetLength = Math.floor(data.length * sampleRate);
        const step = data.length / targetLength;
        
        const reduced = [];
        for (let i = 0; i < data.length; i += step) {
            reduced.push(data[Math.floor(i)]);
        }
        
        return reduced;
    }
    
    /**
     * Load optimized chart
     */
    async loadOptimizedChart(config, container) {
        // This would integrate with the actual chart library
        // For now, return a mock implementation
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    config,
                    container,
                    optimized: true
                });
            }, 100);
        });
    }
    
    /**
     * Load chart normally (fallback)
     */
    async loadChartNormally(config, container) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    config,
                    container,
                    optimized: false
                });
            }, 200);
        });
    }
    
    /**
     * Initialize mobile caching system
     */
    initializeMobileCaching() {
        // Setup cache with size limits
        this.setupCacheManagement();
        
        // Load existing cache from localStorage
        this.loadCacheFromStorage();
        
        // Setup periodic cleanup
        this.setupCacheCleanup();
    }
    
    /**
     * Setup cache management
     */
    setupCacheManagement() {
        this.cacheConfig = {
            maxSize: this.performanceSettings.maxCacheSize,
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            cleanupInterval: 60 * 60 * 1000, // 1 hour
            compressionEnabled: true
        };
    }
    
    /**
     * Cache data with mobile optimization
     */
    async cacheData(key, data, options = {}) {
        if (!this.performanceSettings.enableMobileCaching) {
            return;
        }
        
        try {
            const cacheEntry = {
                key,
                data: await this.compressData(data),
                timestamp: Date.now(),
                size: this.calculateDataSize(data),
                ttl: options.ttl || this.cacheConfig.maxAge,
                compressed: true
            };
            
            // Check cache size limits
            if (this.cacheStats.size + cacheEntry.size > this.cacheConfig.maxSize) {
                await this.evictOldEntries(cacheEntry.size);
            }
            
            // Store in memory cache
            this.cache.set(key, cacheEntry);
            this.cacheStats.size += cacheEntry.size;
            
            // Store in localStorage for persistence
            this.saveCacheToStorage(key, cacheEntry);
            
            console.log(`Cached data: ${key} (${cacheEntry.size} bytes)`);
            
        } catch (error) {
            console.error('Failed to cache data:', error);
        }
    }
    
    /**
     * Retrieve cached data
     */
    async getCachedData(key) {
        if (!this.performanceSettings.enableMobileCaching) {
            return null;
        }
        
        const cacheEntry = this.cache.get(key);
        
        if (!cacheEntry) {
            this.cacheStats.misses++;
            return null;
        }
        
        // Check if expired
        if (Date.now() - cacheEntry.timestamp > cacheEntry.ttl) {
            this.cache.delete(key);
            this.cacheStats.size -= cacheEntry.size;
            this.removeCacheFromStorage(key);
            this.cacheStats.misses++;
            return null;
        }
        
        this.cacheStats.hits++;
        this.updateCacheHitRate();
        
        // Decompress if needed
        if (cacheEntry.compressed) {
            return this.decompressData(cacheEntry.data);
        }
        
        return cacheEntry.data;
    }
    
    /**
     * Calculate data size in bytes
     */
    calculateDataSize(data) {
        const dataString = typeof data === 'string' ? data : JSON.stringify(data);
        return new Blob([dataString]).size;
    }
    
    /**
     * Evict old cache entries to make space
     */
    async evictOldEntries(requiredSpace) {
        const entries = Array.from(this.cache.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        let freedSpace = 0;
        
        for (const [key, entry] of entries) {
            this.cache.delete(key);
            this.removeCacheFromStorage(key);
            this.cacheStats.size -= entry.size;
            freedSpace += entry.size;
            
            if (freedSpace >= requiredSpace) {
                break;
            }
        }
        
        console.log(`Evicted cache entries, freed ${freedSpace} bytes`);
    }
    
    /**
     * Update cache hit rate
     */
    updateCacheHitRate() {
        const total = this.cacheStats.hits + this.cacheStats.misses;
        this.metrics.cacheHitRate = total > 0 ? this.cacheStats.hits / total : 0;
    }
    
    /**
     * Load cache from localStorage
     */
    loadCacheFromStorage() {
        try {
            const cacheKeys = JSON.parse(localStorage.getItem('mobileOptimizer_cacheKeys') || '[]');
            
            for (const key of cacheKeys) {
                const cacheEntry = JSON.parse(localStorage.getItem(`mobileOptimizer_${key}`) || 'null');
                
                if (cacheEntry && Date.now() - cacheEntry.timestamp < cacheEntry.ttl) {
                    this.cache.set(key, cacheEntry);
                    this.cacheStats.size += cacheEntry.size;
                } else {
                    localStorage.removeItem(`mobileOptimizer_${key}`);
                }
            }
            
            // Update cache keys
            const validKeys = Array.from(this.cache.keys());
            localStorage.setItem('mobileOptimizer_cacheKeys', JSON.stringify(validKeys));
            
        } catch (error) {
            console.error('Failed to load cache from storage:', error);
        }
    }
    
    /**
     * Save cache entry to localStorage
     */
    saveCacheToStorage(key, cacheEntry) {
        try {
            localStorage.setItem(`mobileOptimizer_${key}`, JSON.stringify(cacheEntry));
            
            const cacheKeys = JSON.parse(localStorage.getItem('mobileOptimizer_cacheKeys') || '[]');
            if (!cacheKeys.includes(key)) {
                cacheKeys.push(key);
                localStorage.setItem('mobileOptimizer_cacheKeys', JSON.stringify(cacheKeys));
            }
            
        } catch (error) {
            console.error('Failed to save cache to storage:', error);
        }
    }
    
    /**
     * Remove cache entry from localStorage
     */
    removeCacheFromStorage(key) {
        try {
            localStorage.removeItem(`mobileOptimizer_${key}`);
            
            const cacheKeys = JSON.parse(localStorage.getItem('mobileOptimizer_cacheKeys') || '[]');
            const updatedKeys = cacheKeys.filter(k => k !== key);
            localStorage.setItem('mobileOptimizer_cacheKeys', JSON.stringify(updatedKeys));
            
        } catch (error) {
            console.error('Failed to remove cache from storage:', error);
        }
    }
    
    /**
     * Setup periodic cache cleanup
     */
    setupCacheCleanup() {
        setInterval(() => {
            this.cleanupCache();
        }, this.cacheConfig.cleanupInterval);
    }
    
    /**
     * Cleanup expired cache entries
     */
    cleanupCache() {
        const now = Date.now();
        let cleanedSize = 0;
        
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > entry.ttl) {
                this.cache.delete(key);
                this.removeCacheFromStorage(key);
                this.cacheStats.size -= entry.size;
                cleanedSize += entry.size;
            }
        }
        
        this.cacheStats.lastCleanup = now;
        
        if (cleanedSize > 0) {
            console.log(`Cache cleanup: removed ${cleanedSize} bytes`);
        }
    }
    
    /**
     * Pause non-essential operations when page is hidden
     */
    pauseNonEssentialOperations() {
        // Reduce refresh rates
        if (this.dashboardController.autoRefreshManager) {
            this.dashboardController.autoRefreshManager.pauseRefresh();
        }
        
        // Clear progressive loading queue
        this.progressiveLoader.queue = [];
        
        console.log('Paused non-essential operations');
    }
    
    /**
     * Resume operations when page becomes visible
     */
    resumeOperations() {
        // Resume refresh rates
        if (this.dashboardController.autoRefreshManager) {
            this.dashboardController.autoRefreshManager.resumeRefresh();
        }
        
        console.log('Resumed operations');
    }
    
    /**
     * Decompress data
     */
    async decompressData(compressedData) {
        // For now, return as-is since we're using simple compression
        return compressedData;
    }
    
    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return {
            ...this.metrics,
            cacheStats: { ...this.cacheStats },
            networkInfo: { ...this.networkInfo },
            deviceInfo: { ...this.deviceInfo },
            performanceSettings: { ...this.performanceSettings }
        };
    }
    
    /**
     * Get optimization status
     */
    getOptimizationStatus() {
        return {
            isOptimized: this.isInitialized,
            compressionEnabled: this.performanceSettings.enableDataCompression,
            progressiveLoadingEnabled: this.performanceSettings.enableProgressiveLoading,
            cachingEnabled: this.performanceSettings.enableMobileCaching,
            networkAware: this.performanceSettings.enableNetworkAwareness,
            cacheHitRate: this.metrics.cacheHitRate,
            compressionRatio: this.metrics.compressionRatio,
            averageLoadTime: this.metrics.loadTimes.length > 0 
                ? this.metrics.loadTimes.reduce((a, b) => a + b, 0) / this.metrics.loadTimes.length 
                : 0
        };
    }
    
    /**
     * Cleanup resources
     */
    cleanup() {
        // Remove event listeners
        if ('connection' in navigator) {
            navigator.connection.removeEventListener('change', this.handleNetworkChange);
        }
        
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Clear cache
        this.cache.clear();
        
        // Reset state
        this.isInitialized = false;
        
        console.log('Mobile optimizer cleaned up');
    }
    
    /**
     * Destroy the optimizer
     */
    destroy() {
        this.cleanup();
    }
}