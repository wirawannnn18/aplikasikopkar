/**
 * Real-Time Update Manager
 * Requirements: 5.4, 5.5 - Real-time updates between tabs
 * 
 * Manages real-time updates between manual and import tabs, ensuring that
 * when a transaction is completed in one tab, the other tab's summary and
 * statistics are automatically updated.
 */

/**
 * Real-Time Update Manager Class
 * Handles event-driven updates across tabs and components
 */
class RealTimeUpdateManager {
    constructor(sharedServices) {
        this.sharedServices = sharedServices;
        this.eventListeners = new Map();
        this.updateQueue = [];
        this.isProcessing = false;
        this.subscribers = new Map();
        
        // Initialize event system
        this._initializeEventSystem();
    }

    /**
     * Initialize event system
     * Requirements: 5.4, 5.5
     * @private
     */
    _initializeEventSystem() {
        // Create custom event dispatcher
        this.eventDispatcher = document.createElement('div');
        
        // Set up global event listeners
        this._setupGlobalListeners();
    }

    /**
     * Setup global event listeners
     * @private
     */
    _setupGlobalListeners() {
        // Listen for manual payment completion
        document.addEventListener('manualPaymentCompleted', (event) => {
            this._handleManualPaymentCompleted(event.detail);
        });

        // Listen for import batch completion
        document.addEventListener('importBatchCompleted', (event) => {
            this._handleImportBatchCompleted(event.detail);
        });

        // Listen for transaction updates
        document.addEventListener('transactionUpdated', (event) => {
            this._handleTransactionUpdated(event.detail);
        });

        // Listen for batch progress updates
        document.addEventListener('batchProgressUpdated', (event) => {
            this._handleBatchProgressUpdated(event.detail);
        });
    }

    /**
     * Subscribe to updates
     * Requirements: 5.4, 5.5
     * @param {string} eventType - Event type to subscribe to
     * @param {Function} callback - Callback function
     * @returns {string} Subscription ID
     */
    subscribe(eventType, callback) {
        const subscriptionId = this._generateSubscriptionId();
        
        if (!this.subscribers.has(eventType)) {
            this.subscribers.set(eventType, new Map());
        }
        
        this.subscribers.get(eventType).set(subscriptionId, callback);
        
        return subscriptionId;
    }

    /**
     * Unsubscribe from updates
     * @param {string} subscriptionId - Subscription ID
     */
    unsubscribe(subscriptionId) {
        this.subscribers.forEach((callbacks, eventType) => {
            if (callbacks.has(subscriptionId)) {
                callbacks.delete(subscriptionId);
            }
        });
    }

    /**
     * Notify subscribers of an event
     * @private
     * @param {string} eventType - Event type
     * @param {Object} data - Event data
     */
    _notifySubscribers(eventType, data) {
        const callbacks = this.subscribers.get(eventType);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Error in subscriber callback:', error);
                }
            });
        }
    }

    /**
     * Handle manual payment completion
     * Requirements: 5.4, 5.5 - Update import tab when manual payment processed
     * @private
     * @param {Object} paymentData - Payment data
     */
    _handleManualPaymentCompleted(paymentData) {
        console.log('Manual payment completed, triggering updates:', paymentData);
        
        // Queue update for import tab
        this._queueUpdate({
            type: 'manualPaymentCompleted',
            targetTab: 'import',
            data: paymentData,
            timestamp: new Date().toISOString()
        });

        // Queue update for dashboard
        this._queueUpdate({
            type: 'dashboardUpdate',
            targetComponent: 'dashboard',
            data: paymentData,
            timestamp: new Date().toISOString()
        });

        // Notify subscribers
        this._notifySubscribers('manualPaymentCompleted', paymentData);

        // Process update queue
        this._processUpdateQueue();
    }

    /**
     * Handle import batch completion
     * Requirements: 5.4, 5.5 - Update manual tab when import completes
     * @private
     * @param {Object} batchData - Batch data
     */
    _handleImportBatchCompleted(batchData) {
        console.log('Import batch completed, triggering updates:', batchData);
        
        // Queue update for manual tab
        this._queueUpdate({
            type: 'importBatchCompleted',
            targetTab: 'manual',
            data: batchData,
            timestamp: new Date().toISOString()
        });

        // Queue update for dashboard
        this._queueUpdate({
            type: 'dashboardUpdate',
            targetComponent: 'dashboard',
            data: batchData,
            timestamp: new Date().toISOString()
        });

        // Notify subscribers
        this._notifySubscribers('importBatchCompleted', batchData);

        // Process update queue
        this._processUpdateQueue();
    }

    /**
     * Handle transaction update
     * Requirements: 5.4, 5.5
     * @private
     * @param {Object} transactionData - Transaction data
     */
    _handleTransactionUpdated(transactionData) {
        console.log('Transaction updated, triggering updates:', transactionData);
        
        // Queue update for all tabs
        this._queueUpdate({
            type: 'transactionUpdated',
            targetTab: 'all',
            data: transactionData,
            timestamp: new Date().toISOString()
        });

        // Notify subscribers
        this._notifySubscribers('transactionUpdated', transactionData);

        // Process update queue
        this._processUpdateQueue();
    }

    /**
     * Handle batch progress update
     * Requirements: 5.4, 5.5
     * @private
     * @param {Object} progressData - Progress data
     */
    _handleBatchProgressUpdated(progressData) {
        // Queue update for manual tab (to show import progress)
        this._queueUpdate({
            type: 'batchProgressUpdated',
            targetTab: 'manual',
            data: progressData,
            timestamp: new Date().toISOString()
        });

        // Notify subscribers
        this._notifySubscribers('batchProgressUpdated', progressData);

        // Process update queue (with debouncing for progress updates)
        this._debouncedProcessQueue();
    }

    /**
     * Queue an update
     * @private
     * @param {Object} update - Update object
     */
    _queueUpdate(update) {
        this.updateQueue.push(update);
    }

    /**
     * Process update queue
     * Requirements: 5.4, 5.5
     * @private
     */
    async _processUpdateQueue() {
        if (this.isProcessing || this.updateQueue.length === 0) {
            return;
        }

        this.isProcessing = true;

        try {
            while (this.updateQueue.length > 0) {
                const update = this.updateQueue.shift();
                await this._processUpdate(update);
            }
        } catch (error) {
            console.error('Error processing update queue:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Process a single update
     * Requirements: 5.4, 5.5
     * @private
     * @param {Object} update - Update object
     */
    async _processUpdate(update) {
        try {
            switch (update.type) {
                case 'manualPaymentCompleted':
                    await this._updateImportTabSummary(update.data);
                    await this._updateDashboard(update.data);
                    break;

                case 'importBatchCompleted':
                    await this._updateManualTabSummary(update.data);
                    await this._updateDashboard(update.data);
                    break;

                case 'transactionUpdated':
                    await this._updateAllTabsSummary(update.data);
                    await this._updateDashboard(update.data);
                    break;

                case 'batchProgressUpdated':
                    await this._updateProgressDisplay(update.data);
                    break;

                case 'dashboardUpdate':
                    await this._updateDashboard(update.data);
                    break;

                default:
                    console.warn('Unknown update type:', update.type);
            }

            // Log update processing
            this._logUpdate(update);

        } catch (error) {
            console.error('Error processing update:', error);
        }
    }

    /**
     * Update import tab summary
     * Requirements: 5.4, 5.5
     * @private
     * @param {Object} paymentData - Payment data
     */
    async _updateImportTabSummary(paymentData) {
        try {
            // Dispatch custom event for import tab to listen to
            const event = new CustomEvent('updateImportTabSummary', {
                detail: {
                    paymentData,
                    timestamp: new Date().toISOString()
                }
            });
            document.dispatchEvent(event);

            // Update statistics display if visible
            const importStatsContainer = document.getElementById('import-tab-statistics');
            if (importStatsContainer) {
                await this._refreshStatisticsDisplay(importStatsContainer, 'import');
            }

            // Update transaction history in import tab
            const importHistoryContainer = document.getElementById('import-transaction-history');
            if (importHistoryContainer) {
                await this._refreshTransactionHistory(importHistoryContainer);
            }

        } catch (error) {
            console.error('Error updating import tab summary:', error);
        }
    }

    /**
     * Update manual tab summary
     * Requirements: 5.4, 5.5
     * @private
     * @param {Object} batchData - Batch data
     */
    async _updateManualTabSummary(batchData) {
        try {
            // Dispatch custom event for manual tab to listen to
            const event = new CustomEvent('updateManualTabSummary', {
                detail: {
                    batchData,
                    timestamp: new Date().toISOString()
                }
            });
            document.dispatchEvent(event);

            // Update statistics display if visible
            const manualStatsContainer = document.getElementById('manual-tab-statistics');
            if (manualStatsContainer) {
                await this._refreshStatisticsDisplay(manualStatsContainer, 'manual');
            }

            // Update transaction history in manual tab
            const manualHistoryContainer = document.getElementById('manual-transaction-history');
            if (manualHistoryContainer) {
                await this._refreshTransactionHistory(manualHistoryContainer);
            }

            // Show notification about import completion
            this._showImportCompletionNotification(batchData);

        } catch (error) {
            console.error('Error updating manual tab summary:', error);
        }
    }

    /**
     * Update all tabs summary
     * Requirements: 5.4, 5.5
     * @private
     * @param {Object} transactionData - Transaction data
     */
    async _updateAllTabsSummary(transactionData) {
        try {
            // Update both tabs
            await Promise.all([
                this._updateManualTabSummary({ transactions: [transactionData] }),
                this._updateImportTabSummary(transactionData)
            ]);

        } catch (error) {
            console.error('Error updating all tabs summary:', error);
        }
    }

    /**
     * Update dashboard
     * Requirements: 5.4, 5.5
     * @private
     * @param {Object} data - Update data
     */
    async _updateDashboard(data) {
        try {
            // Dispatch custom event for dashboard to listen to
            const event = new CustomEvent('updateDashboard', {
                detail: {
                    data,
                    timestamp: new Date().toISOString()
                }
            });
            document.dispatchEvent(event);

            // If dashboard is visible, refresh it
            const dashboardContainer = document.getElementById('unified-dashboard-container');
            if (dashboardContainer && window.UnifiedDashboardView) {
                // Trigger dashboard refresh
                const refreshEvent = new CustomEvent('refreshDashboard');
                dashboardContainer.dispatchEvent(refreshEvent);
            }

        } catch (error) {
            console.error('Error updating dashboard:', error);
        }
    }

    /**
     * Update progress display
     * Requirements: 5.4, 5.5
     * @private
     * @param {Object} progressData - Progress data
     */
    async _updateProgressDisplay(progressData) {
        try {
            // Update progress bar if visible
            const progressContainer = document.getElementById('batch-progress-container');
            if (progressContainer) {
                progressContainer.innerHTML = `
                    <div class="alert alert-info">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <strong>Import Batch Sedang Berjalan</strong>
                            <span>${progressData.percentage}%</span>
                        </div>
                        <div class="progress">
                            <div class="progress-bar progress-bar-striped progress-bar-animated" 
                                 role="progressbar" 
                                 style="width: ${progressData.percentage}%" 
                                 aria-valuenow="${progressData.current}" 
                                 aria-valuemin="0" 
                                 aria-valuemax="${progressData.total}">
                            </div>
                        </div>
                        <small class="text-muted mt-2 d-block">
                            ${progressData.current} dari ${progressData.total} transaksi diproses
                        </small>
                    </div>
                `;
            }

        } catch (error) {
            console.error('Error updating progress display:', error);
        }
    }

    /**
     * Refresh statistics display
     * @private
     * @param {HTMLElement} container - Container element
     * @param {string} mode - Mode filter ('manual', 'import', or 'all')
     */
    async _refreshStatisticsDisplay(container, mode = 'all') {
        try {
            if (!this.sharedServices) return;

            // Get updated statistics
            const filters = mode !== 'all' ? { mode } : {};
            const statistics = this.sharedServices.getTransactionStatistics(filters);

            if (!statistics) return;

            // Update display
            container.innerHTML = `
                <div class="row">
                    <div class="col-md-4">
                        <div class="stat-card">
                            <div class="stat-label">Total Transaksi</div>
                            <div class="stat-value">${statistics.total.count}</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="stat-card">
                            <div class="stat-label">Total Nilai</div>
                            <div class="stat-value">${this._formatRupiah(statistics.total.amount)}</div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="stat-card">
                            <div class="stat-label">Rata-rata</div>
                            <div class="stat-value">${this._formatRupiah(statistics.total.amount / statistics.total.count || 0)}</div>
                        </div>
                    </div>
                </div>
            `;

        } catch (error) {
            console.error('Error refreshing statistics display:', error);
        }
    }

    /**
     * Refresh transaction history
     * @private
     * @param {HTMLElement} container - Container element
     */
    async _refreshTransactionHistory(container) {
        try {
            if (!this.sharedServices) return;

            // Get updated transactions
            const transactions = this.sharedServices.getTransactionHistory({}, {
                sort: { field: 'createdAt', direction: 'desc' },
                pagination: { page: 1, pageSize: 10 }
            });

            // Dispatch event to refresh history view
            const event = new CustomEvent('refreshTransactionHistory', {
                detail: { transactions }
            });
            container.dispatchEvent(event);

        } catch (error) {
            console.error('Error refreshing transaction history:', error);
        }
    }

    /**
     * Show import completion notification
     * @private
     * @param {Object} batchData - Batch data
     */
    _showImportCompletionNotification(batchData) {
        try {
            const successCount = batchData.successCount || 0;
            const failureCount = batchData.failureCount || 0;
            const totalAmount = batchData.totalAmount || 0;

            const message = `
                Import batch selesai!<br>
                <strong>${successCount}</strong> transaksi berhasil, 
                <strong>${failureCount}</strong> gagal<br>
                Total nilai: <strong>${this._formatRupiah(totalAmount)}</strong>
            `;

            // Use existing notification system if available
            if (typeof window.showNotification === 'function') {
                window.showNotification(message, 'success', 5000);
            } else if (typeof window.showAlert === 'function') {
                window.showAlert(message, 'success');
            } else {
                console.log('Import completion:', message);
            }

        } catch (error) {
            console.error('Error showing import completion notification:', error);
        }
    }

    /**
     * Log update processing
     * @private
     * @param {Object} update - Update object
     */
    _logUpdate(update) {
        if (this.sharedServices && typeof this.sharedServices.logAudit === 'function') {
            this.sharedServices.logAudit('REALTIME_UPDATE_PROCESSED', {
                updateType: update.type,
                targetTab: update.targetTab,
                timestamp: update.timestamp
            });
        }
    }

    /**
     * Debounced process queue for high-frequency updates
     * @private
     */
    _debouncedProcessQueue() {
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
        }

        this._debounceTimer = setTimeout(() => {
            this._processUpdateQueue();
        }, 300); // 300ms debounce
    }

    /**
     * Generate subscription ID
     * @private
     * @returns {string} Subscription ID
     */
    _generateSubscriptionId() {
        return `sub_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    /**
     * Format rupiah currency
     * @private
     */
    _formatRupiah(amount) {
        if (typeof window !== 'undefined' && typeof window.formatRupiah === 'function') {
            return window.formatRupiah(amount);
        }
        
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    /**
     * Trigger manual payment completed event
     * Requirements: 5.4, 5.5
     * @param {Object} paymentData - Payment data
     */
    triggerManualPaymentCompleted(paymentData) {
        const event = new CustomEvent('manualPaymentCompleted', {
            detail: paymentData
        });
        document.dispatchEvent(event);
    }

    /**
     * Trigger import batch completed event
     * Requirements: 5.4, 5.5
     * @param {Object} batchData - Batch data
     */
    triggerImportBatchCompleted(batchData) {
        const event = new CustomEvent('importBatchCompleted', {
            detail: batchData
        });
        document.dispatchEvent(event);
    }

    /**
     * Trigger transaction updated event
     * Requirements: 5.4, 5.5
     * @param {Object} transactionData - Transaction data
     */
    triggerTransactionUpdated(transactionData) {
        const event = new CustomEvent('transactionUpdated', {
            detail: transactionData
        });
        document.dispatchEvent(event);
    }

    /**
     * Trigger batch progress updated event
     * Requirements: 5.4, 5.5
     * @param {Object} progressData - Progress data
     */
    triggerBatchProgressUpdated(progressData) {
        const event = new CustomEvent('batchProgressUpdated', {
            detail: progressData
        });
        document.dispatchEvent(event);
    }

    /**
     * Get current update queue status
     * @returns {Object} Queue status
     */
    getQueueStatus() {
        return {
            queueLength: this.updateQueue.length,
            isProcessing: this.isProcessing,
            subscriberCount: Array.from(this.subscribers.values())
                .reduce((sum, callbacks) => sum + callbacks.size, 0)
        };
    }

    /**
     * Clear update queue
     */
    clearQueue() {
        this.updateQueue = [];
    }

    /**
     * Destroy the update manager and cleanup
     */
    destroy() {
        // Clear debounce timer
        if (this._debounceTimer) {
            clearTimeout(this._debounceTimer);
            this._debounceTimer = null;
        }

        // Clear update queue
        this.clearQueue();

        // Clear all subscribers
        this.subscribers.clear();

        // Remove event listeners
        this.eventListeners.forEach((listener, element) => {
            element.removeEventListener(listener.event, listener.handler);
        });
        this.eventListeners.clear();

        console.log('RealTimeUpdateManager destroyed');
    }
}

// Export for both browser and Node.js environments
if (typeof window !== 'undefined') {
    window.RealTimeUpdateManager = RealTimeUpdateManager;
}

// ES6 export for modern environments
export { RealTimeUpdateManager };

// CommonJS export for compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RealTimeUpdateManager };
}
