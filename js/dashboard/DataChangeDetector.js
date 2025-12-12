/**
 * Dashboard Analytics & KPI - Data Change Detector
 * 
 * Real-time data change detection system that monitors data sources
 * and triggers updates only when actual changes occur.
 */

class DataChangeDetector {
    /**
     * Initialize Data Change Detector
     */
    constructor() {
        this.dataChecksums = new Map(); // Store data checksums for change detection
        this.changeListeners = new Map(); // Store change listeners per data source
        this.pollingIntervals = new Map(); // Store polling intervals per data source
        this.isActive = false;
        
        // Configuration
        this.config = {
            defaultPollingInterval: 60000, // 1 minute
            minPollingInterval: 10000, // 10 seconds
            maxPollingInterval: 300000, // 5 minutes
            checksumAlgorithm: 'simple', // 'simple' or 'hash'
            batchSize: 10, // Number of data sources to check per batch
            batchDelay: 100 // Delay between batches in milliseconds
        };
        
        // Data source configurations
        this.dataSources = new Map();
    }

    /**
     * Initialize the data change detector
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            console.log('Initializing Data Change Detector...');
            
            // Register default data sources
            this.registerDefaultDataSources();
            
            console.log('Data Change Detector initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Data Change Detector:', error);
            throw error;
        }
    }

    /**
     * Register default data sources for monitoring
     * @private
     */
    registerDefaultDataSources() {
        // Financial data sources
        this.registerDataSource('financial-health', {
            endpoint: '/api/financial/health',
            pollingInterval: 300000, // 5 minutes
            priority: 'high'
        });

        this.registerDataSource('cash-balance', {
            endpoint: '/api/financial/cash-balance',
            pollingInterval: 60000, // 1 minute
            priority: 'high'
        });

        this.registerDataSource('transaction-volume', {
            endpoint: '/api/transactions/volume',
            pollingInterval: 120000, // 2 minutes
            priority: 'medium'
        });

        // Member data sources
        this.registerDataSource('member-analytics', {
            endpoint: '/api/members/analytics',
            pollingInterval: 300000, // 5 minutes
            priority: 'medium'
        });

        this.registerDataSource('member-activity', {
            endpoint: '/api/members/activity',
            pollingInterval: 180000, // 3 minutes
            priority: 'medium'
        });

        // Savings and loans data sources
        this.registerDataSource('savings-total', {
            endpoint: '/api/savings/total',
            pollingInterval: 300000, // 5 minutes
            priority: 'medium'
        });

        this.registerDataSource('loans-outstanding', {
            endpoint: '/api/loans/outstanding',
            pollingInterval: 300000, // 5 minutes
            priority: 'medium'
        });

        // Analytics data sources
        this.registerDataSource('financial-ratios', {
            endpoint: '/api/analytics/financial-ratios',
            pollingInterval: 600000, // 10 minutes
            priority: 'low'
        });

        this.registerDataSource('revenue-expense', {
            endpoint: '/api/analytics/revenue-expense',
            pollingInterval: 600000, // 10 minutes
            priority: 'low'
        });
    }

    /**
     * Register a data source for monitoring
     * @param {string} sourceId - Data source identifier
     * @param {Object} config - Data source configuration
     */
    registerDataSource(sourceId, config) {
        const dataSourceConfig = {
            id: sourceId,
            endpoint: config.endpoint,
            pollingInterval: config.pollingInterval || this.config.defaultPollingInterval,
            priority: config.priority || 'medium',
            lastChecked: null,
            lastChecksum: null,
            errorCount: 0,
            maxErrors: 3,
            ...config
        };

        this.dataSources.set(sourceId, dataSourceConfig);
        console.log(`Registered data source: ${sourceId}`);
    }

    /**
     * Start monitoring data sources for changes
     */
    startMonitoring() {
        if (this.isActive) {
            console.warn('Data change monitoring already active');
            return;
        }

        console.log('Starting data change monitoring...');
        this.isActive = true;

        // Start polling for each data source
        this.dataSources.forEach((config, sourceId) => {
            this.startPolling(sourceId);
        });

        console.log(`Started monitoring ${this.dataSources.size} data sources`);
    }

    /**
     * Stop monitoring data sources
     */
    stopMonitoring() {
        if (!this.isActive) {
            return;
        }

        console.log('Stopping data change monitoring...');
        this.isActive = false;

        // Clear all polling intervals
        this.pollingIntervals.forEach((interval, sourceId) => {
            clearInterval(interval);
        });
        this.pollingIntervals.clear();

        console.log('Data change monitoring stopped');
    }

    /**
     * Start polling for a specific data source
     * @param {string} sourceId - Data source identifier
     * @private
     */
    startPolling(sourceId) {
        const config = this.dataSources.get(sourceId);
        if (!config) {
            console.error(`Data source ${sourceId} not found`);
            return;
        }

        // Clear existing interval if any
        if (this.pollingIntervals.has(sourceId)) {
            clearInterval(this.pollingIntervals.get(sourceId));
        }

        // Create new polling interval
        const interval = setInterval(async () => {
            if (this.isActive && this.shouldCheckDataSource(config)) {
                await this.checkDataSource(sourceId);
            }
        }, config.pollingInterval);

        this.pollingIntervals.set(sourceId, interval);
        
        // Perform initial check
        setTimeout(() => this.checkDataSource(sourceId), 1000);
    }

    /**
     * Check if data source should be checked now
     * @param {Object} config - Data source configuration
     * @returns {boolean} True if should check
     * @private
     */
    shouldCheckDataSource(config) {
        // Don't check if page is not visible (unless high priority)
        if (document.visibilityState !== 'visible' && config.priority !== 'high') {
            return false;
        }

        // Don't check if offline
        if (!navigator.onLine) {
            return false;
        }

        // Don't check if too many errors
        if (config.errorCount >= config.maxErrors) {
            return false;
        }

        return true;
    }

    /**
     * Check a specific data source for changes
     * @param {string} sourceId - Data source identifier
     * @returns {Promise<void>}
     * @private
     */
    async checkDataSource(sourceId) {
        const config = this.dataSources.get(sourceId);
        if (!config) {
            return;
        }

        try {
            console.log(`Checking data source: ${sourceId}`);
            
            const startTime = performance.now();
            
            // Fetch current data
            const currentData = await this.fetchDataSource(config);
            
            // Calculate checksum
            const currentChecksum = this.calculateChecksum(currentData);
            
            // Compare with previous checksum
            const hasChanges = config.lastChecksum !== null && 
                              config.lastChecksum !== currentChecksum;

            if (hasChanges) {
                console.log(`Data changes detected in ${sourceId}`);
                
                // Notify listeners about changes
                await this.notifyDataChange(sourceId, {
                    previousChecksum: config.lastChecksum,
                    currentChecksum,
                    data: currentData,
                    timestamp: new Date()
                });
            }

            // Update tracking information
            config.lastChecksum = currentChecksum;
            config.lastChecked = new Date();
            config.errorCount = 0; // Reset error count on success

            const checkTime = performance.now() - startTime;
            console.log(`Data source ${sourceId} checked in ${checkTime.toFixed(2)}ms (changes: ${hasChanges})`);

        } catch (error) {
            config.errorCount++;
            console.error(`Failed to check data source ${sourceId}:`, error);

            // If too many errors, temporarily disable this data source
            if (config.errorCount >= config.maxErrors) {
                console.warn(`Data source ${sourceId} disabled due to repeated errors`);
                
                // Notify about error
                this.notifyDataError(sourceId, {
                    error: error.message,
                    errorCount: config.errorCount,
                    timestamp: new Date()
                });
            }
        }
    }

    /**
     * Fetch data from a data source
     * @param {Object} config - Data source configuration
     * @returns {Promise<any>} Fetched data
     * @private
     */
    async fetchDataSource(config) {
        // Simulate API call for now - replace with actual API calls
        if (config.endpoint.includes('/api/')) {
            return await this.simulateApiCall(config.endpoint);
        }

        // For localStorage or other sources
        if (config.storageKey) {
            return this.getStorageData(config.storageKey);
        }

        throw new Error(`Unknown data source type for ${config.id}`);
    }

    /**
     * Simulate API call (replace with actual implementation)
     * @param {string} endpoint - API endpoint
     * @returns {Promise<any>} Simulated data
     * @private
     */
    async simulateApiCall(endpoint) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

        // Generate mock data based on endpoint
        const timestamp = Date.now();
        const randomFactor = Math.random();

        switch (endpoint) {
            case '/api/financial/health':
                return {
                    score: 75 + Math.floor(randomFactor * 20),
                    timestamp,
                    factors: {
                        liquidity: 0.8 + randomFactor * 0.2,
                        profitability: 0.7 + randomFactor * 0.3,
                        efficiency: 0.75 + randomFactor * 0.25
                    }
                };

            case '/api/financial/cash-balance':
                return {
                    balance: 1000000 + Math.floor(randomFactor * 500000),
                    timestamp,
                    currency: 'IDR'
                };

            case '/api/transactions/volume':
                return {
                    daily: Math.floor(50 + randomFactor * 100),
                    weekly: Math.floor(300 + randomFactor * 200),
                    monthly: Math.floor(1200 + randomFactor * 800),
                    timestamp
                };

            case '/api/members/analytics':
                return {
                    total: 1500 + Math.floor(randomFactor * 100),
                    active: 1200 + Math.floor(randomFactor * 80),
                    newThisMonth: 10 + Math.floor(randomFactor * 20),
                    timestamp
                };

            case '/api/members/activity':
                return {
                    activeToday: Math.floor(100 + randomFactor * 50),
                    transactionsToday: Math.floor(200 + randomFactor * 100),
                    avgTransactionValue: 50000 + Math.floor(randomFactor * 100000),
                    timestamp
                };

            default:
                return {
                    data: `Mock data for ${endpoint}`,
                    timestamp,
                    random: randomFactor
                };
        }
    }

    /**
     * Get data from localStorage
     * @param {string} key - Storage key
     * @returns {any} Stored data
     * @private
     */
    getStorageData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Failed to get storage data for key ${key}:`, error);
            return null;
        }
    }

    /**
     * Calculate checksum for data
     * @param {any} data - Data to calculate checksum for
     * @returns {string} Checksum
     * @private
     */
    calculateChecksum(data) {
        if (this.config.checksumAlgorithm === 'hash') {
            return this.calculateHashChecksum(data);
        } else {
            return this.calculateSimpleChecksum(data);
        }
    }

    /**
     * Calculate simple checksum (JSON string length + content sample)
     * @param {any} data - Data to calculate checksum for
     * @returns {string} Simple checksum
     * @private
     */
    calculateSimpleChecksum(data) {
        try {
            const jsonString = JSON.stringify(data);
            const length = jsonString.length;
            const sample = jsonString.substring(0, 100) + jsonString.substring(jsonString.length - 100);
            return `${length}-${this.simpleHash(sample)}`;
        } catch (error) {
            return `error-${Date.now()}`;
        }
    }

    /**
     * Calculate hash-based checksum (more accurate but slower)
     * @param {any} data - Data to calculate checksum for
     * @returns {string} Hash checksum
     * @private
     */
    calculateHashChecksum(data) {
        try {
            const jsonString = JSON.stringify(data);
            return this.djb2Hash(jsonString);
        } catch (error) {
            return `error-${Date.now()}`;
        }
    }

    /**
     * Simple hash function for strings
     * @param {string} str - String to hash
     * @returns {string} Hash value
     * @private
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * DJB2 hash function for strings
     * @param {string} str - String to hash
     * @returns {string} Hash value
     * @private
     */
    djb2Hash(str) {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Add change listener for a data source
     * @param {string} sourceId - Data source identifier
     * @param {Function} callback - Callback function to call on changes
     */
    addChangeListener(sourceId, callback) {
        if (!this.changeListeners.has(sourceId)) {
            this.changeListeners.set(sourceId, new Set());
        }
        
        this.changeListeners.get(sourceId).add(callback);
        console.log(`Added change listener for data source: ${sourceId}`);
    }

    /**
     * Remove change listener for a data source
     * @param {string} sourceId - Data source identifier
     * @param {Function} callback - Callback function to remove
     */
    removeChangeListener(sourceId, callback) {
        if (this.changeListeners.has(sourceId)) {
            this.changeListeners.get(sourceId).delete(callback);
        }
    }

    /**
     * Notify listeners about data changes
     * @param {string} sourceId - Data source identifier
     * @param {Object} changeInfo - Change information
     * @returns {Promise<void>}
     * @private
     */
    async notifyDataChange(sourceId, changeInfo) {
        const listeners = this.changeListeners.get(sourceId);
        if (!listeners || listeners.size === 0) {
            return;
        }

        const promises = Array.from(listeners).map(async (callback) => {
            try {
                await callback(changeInfo);
            } catch (error) {
                console.error(`Error in change listener for ${sourceId}:`, error);
            }
        });

        await Promise.all(promises);

        // Emit global event
        const event = new CustomEvent('dashboard:dataChange', {
            detail: {
                sourceId,
                ...changeInfo
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Notify about data source errors
     * @param {string} sourceId - Data source identifier
     * @param {Object} errorInfo - Error information
     * @private
     */
    notifyDataError(sourceId, errorInfo) {
        const event = new CustomEvent('dashboard:dataError', {
            detail: {
                sourceId,
                ...errorInfo
            }
        });
        document.dispatchEvent(event);
    }

    /**
     * Force check all data sources
     * @returns {Promise<void>}
     */
    async forceCheckAll() {
        console.log('Force checking all data sources...');
        
        const sourceIds = Array.from(this.dataSources.keys());
        const batches = this.createBatches(sourceIds, this.config.batchSize);

        for (const batch of batches) {
            const promises = batch.map(sourceId => this.checkDataSource(sourceId));
            await Promise.all(promises);
            
            // Delay between batches to avoid overwhelming the system
            if (batches.indexOf(batch) < batches.length - 1) {
                await new Promise(resolve => setTimeout(resolve, this.config.batchDelay));
            }
        }

        console.log('Force check completed');
    }

    /**
     * Create batches from array
     * @param {Array} array - Array to batch
     * @param {number} batchSize - Size of each batch
     * @returns {Array[]} Array of batches
     * @private
     */
    createBatches(array, batchSize) {
        const batches = [];
        for (let i = 0; i < array.length; i += batchSize) {
            batches.push(array.slice(i, i + batchSize));
        }
        return batches;
    }

    /**
     * Get monitoring status
     * @returns {Object} Status information
     */
    getStatus() {
        const status = {
            isActive: this.isActive,
            dataSourceCount: this.dataSources.size,
            activePolling: this.pollingIntervals.size,
            dataSources: {}
        };

        this.dataSources.forEach((config, sourceId) => {
            status.dataSources[sourceId] = {
                lastChecked: config.lastChecked,
                errorCount: config.errorCount,
                pollingInterval: config.pollingInterval,
                priority: config.priority
            };
        });

        return status;
    }

    /**
     * Update polling interval for a data source
     * @param {string} sourceId - Data source identifier
     * @param {number} interval - New polling interval in milliseconds
     */
    updatePollingInterval(sourceId, interval) {
        const config = this.dataSources.get(sourceId);
        if (config) {
            config.pollingInterval = Math.max(
                this.config.minPollingInterval,
                Math.min(this.config.maxPollingInterval, interval)
            );

            // Restart polling with new interval
            if (this.isActive) {
                this.startPolling(sourceId);
            }

            console.log(`Updated polling interval for ${sourceId}: ${config.pollingInterval}ms`);
        }
    }

    /**
     * Destroy data change detector and cleanup resources
     */
    destroy() {
        this.stopMonitoring();
        
        // Clear all data
        this.dataChecksums.clear();
        this.changeListeners.clear();
        this.dataSources.clear();
        
        console.log('Data Change Detector destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataChangeDetector };
} else {
    window.DataChangeDetector = DataChangeDetector;
}