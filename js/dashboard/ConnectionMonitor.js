/**
 * Dashboard Analytics & KPI - Connection Monitor
 * 
 * Network connectivity monitoring and error handling system that manages
 * connection status, retry mechanisms, and graceful degradation.
 */

class ConnectionMonitor {
    /**
     * Initialize Connection Monitor
     */
    constructor() {
        this.isOnline = navigator.onLine;
        this.connectionQuality = 'unknown';
        this.lastOnlineTime = null;
        this.lastOfflineTime = null;
        this.connectionHistory = [];
        this.retryQueue = [];
        this.isMonitoring = false;
        
        // Configuration
        this.config = {
            pingInterval: 30000, // 30 seconds
            pingTimeout: 5000, // 5 seconds
            retryAttempts: 3,
            retryDelay: 2000, // 2 seconds
            retryBackoffMultiplier: 2,
            maxRetryDelay: 30000, // 30 seconds
            connectionTestUrl: '/api/health', // Endpoint to test connection
            qualityTestSize: 1024, // Bytes to download for quality test
            slowConnectionThreshold: 2000, // ms for slow connection
            historyLimit: 100 // Maximum connection events to store
        };
        
        // Event listeners
        this.listeners = new Set();
        
        // Bind methods
        this.handleOnline = this.handleOnline.bind(this);
        this.handleOffline = this.handleOffline.bind(this);
    }

    /**
     * Initialize connection monitoring
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            console.log('Initializing Connection Monitor...');
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Perform initial connection test
            await this.testConnection();
            
            // Start monitoring
            this.startMonitoring();
            
            console.log('Connection Monitor initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize Connection Monitor:', error);
            throw error;
        }
    }

    /**
     * Setup event listeners for connection changes
     * @private
     */
    setupEventListeners() {
        window.addEventListener('online', this.handleOnline);
        window.addEventListener('offline', this.handleOffline);
        
        // Listen for visibility changes to test connection when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.isOnline) {
                this.testConnection();
            }
        });
    }

    /**
     * Start connection monitoring
     */
    startMonitoring() {
        if (this.isMonitoring) {
            console.warn('Connection monitoring already active');
            return;
        }

        console.log('Starting connection monitoring...');
        this.isMonitoring = true;

        // Start periodic connection tests
        this.monitoringInterval = setInterval(() => {
            if (this.isOnline) {
                this.testConnection();
            }
        }, this.config.pingInterval);

        // Process retry queue periodically
        this.retryInterval = setInterval(() => {
            this.processRetryQueue();
        }, this.config.retryDelay);
    }

    /**
     * Stop connection monitoring
     */
    stopMonitoring() {
        if (!this.isMonitoring) {
            return;
        }

        console.log('Stopping connection monitoring...');
        this.isMonitoring = false;

        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }

        if (this.retryInterval) {
            clearInterval(this.retryInterval);
            this.retryInterval = null;
        }
    }

    /**
     * Test connection quality and latency
     * @returns {Promise<Object>} Connection test results
     */
    async testConnection() {
        try {
            const startTime = performance.now();
            
            // Test basic connectivity
            const response = await this.performConnectionTest();
            
            const endTime = performance.now();
            const latency = endTime - startTime;

            // Determine connection quality
            const quality = this.determineConnectionQuality(latency, response);
            
            // Update connection status
            this.updateConnectionStatus(true, quality, latency);
            
            return {
                isOnline: true,
                quality,
                latency,
                timestamp: new Date()
            };
            
        } catch (error) {
            console.error('Connection test failed:', error);
            
            // Update connection status
            this.updateConnectionStatus(false, 'offline', null);
            
            return {
                isOnline: false,
                quality: 'offline',
                latency: null,
                error: error.message,
                timestamp: new Date()
            };
        }
    }

    /**
     * Perform actual connection test
     * @returns {Promise<Response>} Fetch response
     * @private
     */
    async performConnectionTest() {
        // Create a unique URL to avoid caching
        const testUrl = `${this.config.connectionTestUrl}?t=${Date.now()}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.pingTimeout);

        try {
            const response = await fetch(testUrl, {
                method: 'HEAD',
                cache: 'no-cache',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return response;
            
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Connection test timed out');
            }
            
            throw error;
        }
    }

    /**
     * Determine connection quality based on latency and response
     * @param {number} latency - Response latency in milliseconds
     * @param {Response} response - Fetch response
     * @returns {string} Connection quality ('excellent', 'good', 'fair', 'poor')
     * @private
     */
    determineConnectionQuality(latency, response) {
        if (latency < 100) {
            return 'excellent';
        } else if (latency < 300) {
            return 'good';
        } else if (latency < 1000) {
            return 'fair';
        } else if (latency < this.config.slowConnectionThreshold) {
            return 'poor';
        } else {
            return 'very-poor';
        }
    }

    /**
     * Update connection status and notify listeners
     * @param {boolean} isOnline - Online status
     * @param {string} quality - Connection quality
     * @param {number|null} latency - Connection latency
     * @private
     */
    updateConnectionStatus(isOnline, quality, latency) {
        const previousStatus = {
            isOnline: this.isOnline,
            quality: this.connectionQuality
        };

        this.isOnline = isOnline;
        this.connectionQuality = quality;

        // Update timestamps
        if (isOnline && !previousStatus.isOnline) {
            this.lastOnlineTime = new Date();
        } else if (!isOnline && previousStatus.isOnline) {
            this.lastOfflineTime = new Date();
        }

        // Add to connection history
        this.addToHistory({
            isOnline,
            quality,
            latency,
            timestamp: new Date()
        });

        // Notify listeners if status changed
        if (isOnline !== previousStatus.isOnline || quality !== previousStatus.quality) {
            this.notifyStatusChange({
                isOnline,
                quality,
                latency,
                previousStatus,
                timestamp: new Date()
            });
        }
    }

    /**
     * Add connection event to history
     * @param {Object} event - Connection event
     * @private
     */
    addToHistory(event) {
        this.connectionHistory.push(event);
        
        // Limit history size
        if (this.connectionHistory.length > this.config.historyLimit) {
            this.connectionHistory.shift();
        }
    }

    /**
     * Handle online event
     * @private
     */
    handleOnline() {
        console.log('Browser detected online status');
        
        // Test connection to verify actual connectivity
        this.testConnection().then(result => {
            if (result.isOnline) {
                console.log('Connection restored');
                
                // Process any queued retry operations
                this.processRetryQueue();
            }
        });
    }

    /**
     * Handle offline event
     * @private
     */
    handleOffline() {
        console.log('Browser detected offline status');
        this.updateConnectionStatus(false, 'offline', null);
    }

    /**
     * Add a failed request to retry queue
     * @param {Function} requestFunction - Function that performs the request
     * @param {Object} options - Retry options
     * @returns {Promise} Promise that resolves when request succeeds or max retries reached
     */
    addToRetryQueue(requestFunction, options = {}) {
        const retryItem = {
            id: `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            requestFunction,
            attempts: 0,
            maxAttempts: options.maxAttempts || this.config.retryAttempts,
            delay: options.initialDelay || this.config.retryDelay,
            backoffMultiplier: options.backoffMultiplier || this.config.retryBackoffMultiplier,
            maxDelay: options.maxDelay || this.config.maxRetryDelay,
            createdAt: new Date(),
            lastAttempt: null,
            resolve: null,
            reject: null
        };

        return new Promise((resolve, reject) => {
            retryItem.resolve = resolve;
            retryItem.reject = reject;
            
            this.retryQueue.push(retryItem);
            console.log(`Added request to retry queue: ${retryItem.id}`);
        });
    }

    /**
     * Process retry queue
     * @private
     */
    async processRetryQueue() {
        if (!this.isOnline || this.retryQueue.length === 0) {
            return;
        }

        const now = new Date();
        const itemsToRetry = this.retryQueue.filter(item => {
            if (!item.lastAttempt) {
                return true; // First attempt
            }
            
            const timeSinceLastAttempt = now - item.lastAttempt;
            return timeSinceLastAttempt >= item.delay;
        });

        for (const item of itemsToRetry) {
            await this.processRetryItem(item);
        }

        // Remove completed or failed items
        this.retryQueue = this.retryQueue.filter(item => 
            item.attempts < item.maxAttempts && !item.completed
        );
    }

    /**
     * Process a single retry item
     * @param {Object} item - Retry item
     * @private
     */
    async processRetryItem(item) {
        try {
            item.attempts++;
            item.lastAttempt = new Date();
            
            console.log(`Retrying request ${item.id} (attempt ${item.attempts}/${item.maxAttempts})`);
            
            const result = await item.requestFunction();
            
            // Success
            item.completed = true;
            item.resolve(result);
            
            console.log(`Retry successful for ${item.id}`);
            
        } catch (error) {
            console.error(`Retry attempt ${item.attempts} failed for ${item.id}:`, error);
            
            if (item.attempts >= item.maxAttempts) {
                // Max attempts reached
                item.completed = true;
                item.reject(new Error(`Request failed after ${item.attempts} attempts: ${error.message}`));
                
                console.error(`Max retry attempts reached for ${item.id}`);
            } else {
                // Calculate next delay with exponential backoff
                item.delay = Math.min(
                    item.delay * item.backoffMultiplier,
                    item.maxDelay
                );
                
                console.log(`Next retry for ${item.id} in ${item.delay}ms`);
            }
        }
    }

    /**
     * Execute request with automatic retry on failure
     * @param {Function} requestFunction - Function that performs the request
     * @param {Object} options - Retry options
     * @returns {Promise} Promise that resolves with request result
     */
    async executeWithRetry(requestFunction, options = {}) {
        try {
            // Try immediate execution first
            return await requestFunction();
            
        } catch (error) {
            console.log('Request failed, adding to retry queue:', error.message);
            
            // Add to retry queue for automatic retry
            return await this.addToRetryQueue(requestFunction, options);
        }
    }

    /**
     * Add connection status listener
     * @param {Function} listener - Listener function
     */
    addStatusListener(listener) {
        this.listeners.add(listener);
    }

    /**
     * Remove connection status listener
     * @param {Function} listener - Listener function
     */
    removeStatusListener(listener) {
        this.listeners.delete(listener);
    }

    /**
     * Notify listeners about status changes
     * @param {Object} statusInfo - Status change information
     * @private
     */
    notifyStatusChange(statusInfo) {
        this.listeners.forEach(listener => {
            try {
                listener(statusInfo);
            } catch (error) {
                console.error('Error in connection status listener:', error);
            }
        });

        // Emit global event
        const event = new CustomEvent('dashboard:connectionChange', {
            detail: statusInfo
        });
        document.dispatchEvent(event);
    }

    /**
     * Get current connection status
     * @returns {Object} Connection status information
     */
    getStatus() {
        return {
            isOnline: this.isOnline,
            quality: this.connectionQuality,
            lastOnlineTime: this.lastOnlineTime,
            lastOfflineTime: this.lastOfflineTime,
            retryQueueSize: this.retryQueue.length,
            isMonitoring: this.isMonitoring,
            history: this.connectionHistory.slice(-10) // Last 10 events
        };
    }

    /**
     * Get connection statistics
     * @returns {Object} Connection statistics
     */
    getStatistics() {
        const recentHistory = this.connectionHistory.slice(-50); // Last 50 events
        
        if (recentHistory.length === 0) {
            return {
                averageLatency: null,
                uptime: null,
                qualityDistribution: {},
                connectionEvents: 0
            };
        }

        // Calculate average latency
        const latencies = recentHistory
            .filter(event => event.latency !== null)
            .map(event => event.latency);
        
        const averageLatency = latencies.length > 0 
            ? latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length
            : null;

        // Calculate uptime percentage
        const onlineEvents = recentHistory.filter(event => event.isOnline).length;
        const uptime = (onlineEvents / recentHistory.length) * 100;

        // Quality distribution
        const qualityDistribution = {};
        recentHistory.forEach(event => {
            qualityDistribution[event.quality] = (qualityDistribution[event.quality] || 0) + 1;
        });

        return {
            averageLatency: averageLatency ? Math.round(averageLatency) : null,
            uptime: Math.round(uptime * 100) / 100,
            qualityDistribution,
            connectionEvents: recentHistory.length
        };
    }

    /**
     * Force connection test
     * @returns {Promise<Object>} Test results
     */
    async forceTest() {
        console.log('Forcing connection test...');
        return await this.testConnection();
    }

    /**
     * Clear retry queue
     */
    clearRetryQueue() {
        console.log(`Clearing retry queue (${this.retryQueue.length} items)`);
        
        // Reject all pending retries
        this.retryQueue.forEach(item => {
            if (item.reject) {
                item.reject(new Error('Retry queue cleared'));
            }
        });
        
        this.retryQueue = [];
    }

    /**
     * Destroy connection monitor and cleanup resources
     */
    destroy() {
        this.stopMonitoring();
        
        // Remove event listeners
        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.handleOffline);
        
        // Clear retry queue
        this.clearRetryQueue();
        
        // Clear listeners
        this.listeners.clear();
        
        // Clear history
        this.connectionHistory = [];
        
        console.log('Connection Monitor destroyed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ConnectionMonitor };
} else {
    window.ConnectionMonitor = ConnectionMonitor;
}