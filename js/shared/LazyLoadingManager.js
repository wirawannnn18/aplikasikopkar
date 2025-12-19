/**
 * Lazy Loading Manager for Tab Content
 * Requirements: Performance optimization - Load import controller only when needed
 * 
 * Manages lazy loading of tab controllers and content to optimize initial page load time
 * and implement progressive enhancement for the integrated payment interface.
 */

class LazyLoadingManager {
    constructor() {
        this.loadedControllers = new Map();
        this.loadingPromises = new Map();
        this.loadedComponents = new Set();
        this.preloadQueue = [];
        this.isPreloading = false;
        
        // Performance tracking
        this.performanceMetrics = {
            initialLoadTime: null,
            controllerLoadTimes: new Map(),
            componentLoadTimes: new Map(),
            totalLoadTime: null
        };
        
        // Cache for frequently accessed data
        this.dataCache = new Map();
        this.cacheExpiry = new Map();
        this.defaultCacheTimeout = 5 * 60 * 1000; // 5 minutes
        
        console.log('LazyLoadingManager initialized');
    }

    /**
     * Load controller lazily when tab is accessed
     * @param {string} controllerType - Type of controller ('manual' or 'import')
     * @param {Object} sharedServices - Shared services instance
     * @param {Object} options - Loading options
     * @returns {Promise<Object>} Loaded controller
     */
    async loadController(controllerType, sharedServices, options = {}) {
        const startTime = performance.now();
        
        try {
            // Return cached controller if already loaded
            if (this.loadedControllers.has(controllerType)) {
                console.log(`Controller ${controllerType} already loaded, returning cached instance`);
                return this.loadedControllers.get(controllerType);
            }

            // Return existing loading promise if already in progress
            if (this.loadingPromises.has(controllerType)) {
                console.log(`Controller ${controllerType} is already loading, waiting for completion`);
                return await this.loadingPromises.get(controllerType);
            }

            // Create loading promise
            const loadingPromise = this._loadControllerInternal(controllerType, sharedServices, options);
            this.loadingPromises.set(controllerType, loadingPromise);

            const controller = await loadingPromise;
            
            // Cache the loaded controller
            this.loadedControllers.set(controllerType, controller);
            this.loadingPromises.delete(controllerType);
            
            // Track performance
            const loadTime = performance.now() - startTime;
            this.performanceMetrics.controllerLoadTimes.set(controllerType, loadTime);
            
            console.log(`Controller ${controllerType} loaded in ${loadTime.toFixed(2)}ms`);
            
            // Start preloading other components if this is the first load
            if (this.loadedControllers.size === 1 && !this.isPreloading) {
                this._startPreloading();
            }
            
            return controller;
            
        } catch (error) {
            console.error(`Failed to load controller ${controllerType}:`, error);
            this.loadingPromises.delete(controllerType);
            throw error;
        }
    }

    /**
     * Internal controller loading logic
     * @private
     * @param {string} controllerType - Controller type
     * @param {Object} sharedServices - Shared services
     * @param {Object} options - Loading options
     * @returns {Promise<Object>} Controller instance
     */
    async _loadControllerInternal(controllerType, sharedServices, options) {
        switch (controllerType) {
            case 'manual':
                return await this._loadManualController(sharedServices, options);
            case 'import':
                return await this._loadImportController(sharedServices, options);
            default:
                throw new Error(`Unknown controller type: ${controllerType}`);
        }
    }

    /**
     * Load manual payment controller
     * @private
     * @param {Object} sharedServices - Shared services
     * @param {Object} options - Loading options
     * @returns {Promise<Object>} Manual controller
     */
    async _loadManualController(sharedServices, options) {
        console.log('Loading manual payment controller...');
        
        // Manual controller is lightweight, create immediately
        const controller = {
            type: 'manual',
            isInitialized: false,
            currentData: {},
            sharedServices: sharedServices,
            
            render: async () => {
                return await this._renderManualPayment();
            },
            
            hasUnsavedData: () => {
                return this._checkManualUnsavedData();
            },
            
            saveState: () => {
                return this._saveManualState();
            },
            
            restoreState: () => {
                return this._restoreManualState();
            },
            
            initialize: async () => {
                if (!controller.isInitialized) {
                    await this._initializeManualController(controller);
                    controller.isInitialized = true;
                }
            },
            
            destroy: () => {
                this._destroyManualController(controller);
            }
        };
        
        return controller;
    }

    /**
     * Load import batch controller with dependencies
     * @private
     * @param {Object} sharedServices - Shared services
     * @param {Object} options - Loading options
     * @returns {Promise<Object>} Import controller
     */
    async _loadImportController(sharedServices, options) {
        console.log('Loading import batch controller with dependencies...');
        
        // Load required components for import functionality
        await this._loadImportDependencies();
        
        const controller = {
            type: 'import',
            isInitialized: false,
            manager: null,
            sharedServices: sharedServices,
            
            render: async () => {
                return await this._renderImportBatch();
            },
            
            hasUnsavedData: () => {
                return this._checkImportUnsavedData();
            },
            
            saveState: () => {
                return this._saveImportState();
            },
            
            restoreState: () => {
                return this._restoreImportState();
            },
            
            initialize: async () => {
                if (!controller.isInitialized) {
                    await this._initializeImportController(controller, sharedServices);
                    controller.isInitialized = true;
                }
            },
            
            destroy: () => {
                this._destroyImportController(controller);
            }
        };
        
        return controller;
    }

    /**
     * Load import dependencies dynamically
     * @private
     * @returns {Promise<void>}
     */
    async _loadImportDependencies() {
        const requiredComponents = [
            'ImportTagihanManager',
            'ImportTagihanEnhanced', 
            'ImportUploadInterface',
            'FileParser',
            'ValidationEngine',
            'BatchProcessor',
            'PreviewGenerator',
            'AuditLogger'
        ];
        
        const missingComponents = [];
        
        // Check which components are missing
        for (const component of requiredComponents) {
            if (typeof window[component] === 'undefined') {
                missingComponents.push(component);
            }
        }
        
        if (missingComponents.length > 0) {
            console.log(`Loading missing import components: ${missingComponents.join(', ')}`);
            
            // In a real implementation, you would dynamically load these scripts
            // For now, we'll check if they become available after a short delay
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Verify components are now available
            const stillMissing = missingComponents.filter(component => 
                typeof window[component] === 'undefined'
            );
            
            if (stillMissing.length > 0) {
                console.warn(`Import components still missing: ${stillMissing.join(', ')}`);
                // Continue anyway - the controller will handle missing components gracefully
            }
        }
        
        this.loadedComponents.add('import-dependencies');
    }

    /**
     * Preload components in background for better UX
     * @private
     */
    _startPreloading() {
        if (this.isPreloading) return;
        
        this.isPreloading = true;
        console.log('Starting background preloading...');
        
        // Preload import dependencies if manual controller was loaded first
        if (this.loadedControllers.has('manual') && !this.loadedControllers.has('import')) {
            this.preloadQueue.push({
                type: 'controller',
                controllerType: 'import',
                priority: 'low'
            });
        }
        
        // Preload frequently accessed data
        this.preloadQueue.push({
            type: 'data',
            dataType: 'anggota-list',
            priority: 'medium'
        });
        
        this.preloadQueue.push({
            type: 'data', 
            dataType: 'transaction-history',
            priority: 'low'
        });
        
        // Process preload queue
        this._processPreloadQueue();
    }

    /**
     * Process preload queue in background
     * @private
     */
    async _processPreloadQueue() {
        while (this.preloadQueue.length > 0) {
            const item = this.preloadQueue.shift();
            
            try {
                await this._preloadItem(item);
                
                // Add delay between preloads to avoid blocking main thread
                await new Promise(resolve => setTimeout(resolve, 50));
                
            } catch (error) {
                console.warn('Preload failed for item:', item, error);
            }
        }
        
        console.log('Background preloading completed');
    }

    /**
     * Preload individual item
     * @private
     * @param {Object} item - Item to preload
     */
    async _preloadItem(item) {
        switch (item.type) {
            case 'controller':
                // Don't actually load the controller, just load its dependencies
                if (item.controllerType === 'import') {
                    await this._loadImportDependencies();
                }
                break;
                
            case 'data':
                await this._preloadData(item.dataType);
                break;
        }
    }

    /**
     * Preload frequently accessed data
     * @private
     * @param {string} dataType - Type of data to preload
     */
    async _preloadData(dataType) {
        try {
            switch (dataType) {
                case 'anggota-list':
                    if (!this.dataCache.has('anggota-list')) {
                        const anggotaList = this._loadAnggotaData();
                        this._setCachedData('anggota-list', anggotaList);
                    }
                    break;
                    
                case 'transaction-history':
                    if (!this.dataCache.has('transaction-history')) {
                        const transactions = this._loadTransactionHistory();
                        this._setCachedData('transaction-history', transactions);
                    }
                    break;
            }
        } catch (error) {
            console.warn(`Failed to preload ${dataType}:`, error);
        }
    }

    /**
     * Get cached data with expiry check
     * @param {string} key - Cache key
     * @returns {*} Cached data or null if expired/missing
     */
    getCachedData(key) {
        if (!this.dataCache.has(key)) {
            return null;
        }
        
        const expiry = this.cacheExpiry.get(key);
        if (expiry && Date.now() > expiry) {
            this.dataCache.delete(key);
            this.cacheExpiry.delete(key);
            return null;
        }
        
        return this.dataCache.get(key);
    }

    /**
     * Set cached data with expiry
     * @private
     * @param {string} key - Cache key
     * @param {*} data - Data to cache
     * @param {number} timeout - Cache timeout in ms
     */
    _setCachedData(key, data, timeout = this.defaultCacheTimeout) {
        this.dataCache.set(key, data);
        this.cacheExpiry.set(key, Date.now() + timeout);
    }

    /**
     * Clear expired cache entries
     */
    clearExpiredCache() {
        const now = Date.now();
        
        for (const [key, expiry] of this.cacheExpiry.entries()) {
            if (expiry && now > expiry) {
                this.dataCache.delete(key);
                this.cacheExpiry.delete(key);
            }
        }
    }

    /**
     * Get performance metrics
     * @returns {Object} Performance metrics
     */
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            cacheSize: this.dataCache.size,
            loadedControllers: Array.from(this.loadedControllers.keys()),
            loadedComponents: Array.from(this.loadedComponents)
        };
    }

    /**
     * Check if controller is loaded
     * @param {string} controllerType - Controller type
     * @returns {boolean} Is loaded
     */
    isControllerLoaded(controllerType) {
        return this.loadedControllers.has(controllerType);
    }

    /**
     * Unload controller to free memory
     * @param {string} controllerType - Controller type
     */
    unloadController(controllerType) {
        const controller = this.loadedControllers.get(controllerType);
        if (controller && typeof controller.destroy === 'function') {
            controller.destroy();
        }
        
        this.loadedControllers.delete(controllerType);
        console.log(`Controller ${controllerType} unloaded`);
    }

    /**
     * Clear all caches and loaded controllers
     */
    clearAll() {
        // Destroy all controllers
        for (const [type, controller] of this.loadedControllers.entries()) {
            if (typeof controller.destroy === 'function') {
                controller.destroy();
            }
        }
        
        this.loadedControllers.clear();
        this.loadingPromises.clear();
        this.dataCache.clear();
        this.cacheExpiry.clear();
        this.loadedComponents.clear();
        this.preloadQueue.length = 0;
        this.isPreloading = false;
        
        console.log('LazyLoadingManager cleared');
    }

    // ===== CONTROLLER IMPLEMENTATION METHODS =====
    // These methods implement the actual controller functionality

    /**
     * Render manual payment interface
     * @private
     */
    async _renderManualPayment() {
        const container = document.getElementById('manual-payment-container');
        if (!container) return;

        // Use existing renderPembayaranHutangPiutang function if available
        if (typeof window.renderPembayaranHutangPiutang === 'function') {
            const tempDiv = document.createElement('div');
            tempDiv.id = 'mainContent';
            
            document.body.appendChild(tempDiv);
            
            try {
                window.renderPembayaranHutangPiutang();
                container.innerHTML = tempDiv.innerHTML;
            } finally {
                document.body.removeChild(tempDiv);
            }
        } else {
            // Fallback manual interface
            container.innerHTML = `
                <div class="alert alert-info">
                    <h5><i class="bi bi-info-circle"></i> Pembayaran Manual</h5>
                    <p>Interface pembayaran manual akan dimuat di sini.</p>
                    <p>Fitur ini memungkinkan pemrosesan pembayaran hutang/piutang secara satuan.</p>
                </div>
            `;
        }
    }

    /**
     * Render import batch interface
     * @private
     */
    async _renderImportBatch() {
        const container = document.getElementById('import-batch-container');
        if (!container) return;

        // Use existing import tagihan interface if available
        if (typeof window.renderImportTagihanPembayaran === 'function') {
            const tempDiv = document.createElement('div');
            tempDiv.id = 'mainContent';
            
            document.body.appendChild(tempDiv);
            
            try {
                window.renderImportTagihanPembayaran();
                const importContent = tempDiv.innerHTML;
                
                // Remove the header since we already have it in the main tab interface
                const contentWithoutHeader = importContent.replace(
                    /<div class="d-flex justify-content-between.*?<\/div>/s, 
                    ''
                );
                
                container.innerHTML = contentWithoutHeader;
                
                // Re-initialize any JavaScript components
                this._reinitializeImportComponents(container);
                
            } finally {
                document.body.removeChild(tempDiv);
            }
        } else {
            // Fallback import interface
            container.innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle-fill me-2"></i>
                    <strong>Informasi:</strong> Fitur ini memungkinkan Anda memproses pembayaran hutang dan piutang dari banyak anggota sekaligus melalui file CSV atau Excel.
                </div>

                <div id="importTagihanContainer">
                    <div class="text-center py-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-3">Memuat interface import batch...</p>
                    </div>
                </div>
            `;
            
            // Try to initialize import components directly
            this._initializeImportComponents();
        }
    }

    /**
     * Load anggota data for caching
     * @private
     * @returns {Array} Anggota data
     */
    _loadAnggotaData() {
        try {
            return JSON.parse(localStorage.getItem('anggotaList') || '[]');
        } catch (error) {
            console.warn('Failed to load anggota data:', error);
            return [];
        }
    }

    /**
     * Load transaction history for caching
     * @private
     * @returns {Array} Transaction history
     */
    _loadTransactionHistory() {
        try {
            return JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
        } catch (error) {
            console.warn('Failed to load transaction history:', error);
            return [];
        }
    }

    // Placeholder methods for controller functionality
    _checkManualUnsavedData() { return false; }
    _saveManualState() { }
    _restoreManualState() { }
    _initializeManualController(controller) { }
    _destroyManualController(controller) { }
    
    _checkImportUnsavedData() { return false; }
    _saveImportState() { }
    _restoreImportState() { }
    _initializeImportController(controller, sharedServices) { }
    _destroyImportController(controller) { }
    _reinitializeImportComponents(container) { }
    _initializeImportComponents() { }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LazyLoadingManager };
} else if (typeof window !== 'undefined') {
    window.LazyLoadingManager = LazyLoadingManager;
}