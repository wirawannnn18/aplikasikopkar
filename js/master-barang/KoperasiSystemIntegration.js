/**
 * Master Barang Komprehensif - Koperasi System Integration
 * Handles integration with existing koperasi system modules
 */

export class KoperasiSystemIntegration {
    constructor(masterBarangSystem) {
        this.masterBarangSystem = masterBarangSystem;
        this.eventBus = window.eventBus || this.createEventBus();
        this.integrationStatus = {
            pos: false,
            inventory: false,
            accounting: false,
            reporting: false
        };
        this.eventHandlers = new Map();
    }
    
    /**
     * Create simple event bus if not available
     * @returns {Object} Event bus instance
     */
    createEventBus() {
        return {
            listeners: new Map(),
            on: function(event, callback) {
                if (!this.listeners.has(event)) {
                    this.listeners.set(event, []);
                }
                this.listeners.get(event).push(callback);
            },
            emit: function(event, data) {
                if (this.listeners.has(event)) {
                    this.listeners.get(event).forEach(callback => {
                        try {
                            callback(data);
                        } catch (error) {
                            console.error(`Error in event handler for ${event}:`, error);
                        }
                    });
                }
            },
            off: function(event, callback) {
                if (this.listeners.has(event)) {
                    const handlers = this.listeners.get(event);
                    const index = handlers.indexOf(callback);
                    if (index > -1) {
                        handlers.splice(index, 1);
                    }
                }
            }
        };
    }
    
    /**
     * Initialize integration with existing koperasi system
     * @returns {Object} Initialization result
     */
    initialize() {
        try {
            // Set global event bus if not exists
            if (!window.eventBus) {
                window.eventBus = this.eventBus;
            }
            
            // Register event handlers
            this.registerEventHandlers();
            
            // Register master barang events
            this.registerMasterBarangEvents();
            
            // Test integration points
            this.testIntegrationPoints();
            
            return { 
                success: true, 
                message: 'Integration initialized successfully',
                integrationStatus: this.integrationStatus
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Register event handlers for external system events
     */
    registerEventHandlers() {
        // POS System Integration
        this.registerHandler('pos.item.needed', this.handlePOSItemRequest.bind(this));
        this.registerHandler('pos.stock.check', this.handleStockCheck.bind(this));
        this.registerHandler('pos.price.request', this.handlePriceRequest.bind(this));
        
        // Inventory System Integration
        this.registerHandler('inventory.stock.update', this.handleStockUpdate.bind(this));
        this.registerHandler('inventory.item.transfer', this.handleItemTransfer.bind(this));
        this.registerHandler('inventory.adjustment', this.handleStockAdjustment.bind(this));
        
        // Accounting System Integration
        this.registerHandler('accounting.coa.update', this.handleCOAUpdate.bind(this));
        this.registerHandler('accounting.journal.request', this.handleJournalRequest.bind(this));
        
        // Reporting System Integration
        this.registerHandler('reporting.data.request', this.handleReportingDataRequest.bind(this));
        this.registerHandler('reporting.export.request', this.handleExportRequest.bind(this));
    }
    
    /**
     * Register event handler with error handling
     * @param {string} event - Event name
     * @param {Function} handler - Event handler function
     */
    registerHandler(event, handler) {
        this.eventBus.on(event, handler);
        this.eventHandlers.set(event, handler);
    }
    
    /**
     * Handle POS item requests
     * @param {Object} data - Request data
     */
    async handlePOSItemRequest(data) {
        try {
            const { kode, quantity, transaction_id } = data;
            
            const item = this.masterBarangSystem.barangManager.getByKode(kode);
            
            if (item) {
                const response = {
                    transaction_id: transaction_id,
                    item: {
                        id: item.id,
                        kode: item.kode,
                        nama: item.nama,
                        harga_jual: item.harga_jual,
                        stok: item.stok,
                        kategori: item.kategori_nama,
                        satuan: item.satuan_nama
                    },
                    available: item.stok >= quantity,
                    available_quantity: item.stok,
                    requested_quantity: quantity
                };
                
                if (item.stok >= quantity) {
                    this.eventBus.emit('master.barang.available', response);
                } else {
                    this.eventBus.emit('master.barang.insufficient_stock', response);
                }
            } else {
                this.eventBus.emit('master.barang.not_found', {
                    transaction_id: transaction_id,
                    kode: kode,
                    requested_quantity: quantity
                });
            }
        } catch (error) {
            this.eventBus.emit('master.barang.error', {
                error: error.message,
                event: 'pos.item.needed',
                data: data
            });
        }
    }
    
    /**
     * Handle stock check requests
     * @param {Object} data - Stock check data
     */
    async handleStockCheck(data) {
        try {
            const { items } = data;
            const stockInfo = [];
            
            for (const itemRequest of items) {
                const item = this.masterBarangSystem.barangManager.getByKode(itemRequest.kode);
                stockInfo.push({
                    kode: itemRequest.kode,
                    available: item ? item.stok : 0,
                    requested: itemRequest.quantity,
                    sufficient: item ? item.stok >= itemRequest.quantity : false,
                    item_exists: !!item
                });
            }
            
            this.eventBus.emit('master.barang.stock_info', {
                request_id: data.request_id,
                stock_info: stockInfo
            });
        } catch (error) {
            this.eventBus.emit('master.barang.error', {
                error: error.message,
                event: 'pos.stock.check',
                data: data
            });
        }
    }
    
    /**
     * Handle price requests
     * @param {Object} data - Price request data
     */
    async handlePriceRequest(data) {
        try {
            const { kode_list } = data;
            const priceInfo = [];
            
            for (const kode of kode_list) {
                const item = this.masterBarangSystem.barangManager.getByKode(kode);
                priceInfo.push({
                    kode: kode,
                    harga_beli: item ? item.harga_beli : 0,
                    harga_jual: item ? item.harga_jual : 0,
                    item_exists: !!item
                });
            }
            
            this.eventBus.emit('master.barang.price_info', {
                request_id: data.request_id,
                price_info: priceInfo
            });
        } catch (error) {
            this.eventBus.emit('master.barang.error', {
                error: error.message,
                event: 'pos.price.request',
                data: data
            });
        }
    }
    
    /**
     * Handle stock updates from inventory system
     * @param {Object} data - Stock update data
     */
    async handleStockUpdate(data) {
        try {
            const { kode, new_stock, transaction_type, reference_id } = data;
            
            const item = this.masterBarangSystem.barangManager.getByKode(kode);
            if (item) {
                const oldStock = item.stok;
                const updateResult = this.masterBarangSystem.barangManager.update(item.id, {
                    stok: new_stock
                });
                
                if (updateResult.success) {
                    this.eventBus.emit('master.barang.stock.updated', {
                        kode: kode,
                        old_stock: oldStock,
                        new_stock: new_stock,
                        transaction_type: transaction_type,
                        reference_id: reference_id,
                        updated_at: new Date().toISOString()
                    });
                } else {
                    this.eventBus.emit('master.barang.stock.update_failed', {
                        kode: kode,
                        error: updateResult.errors,
                        reference_id: reference_id
                    });
                }
            } else {
                this.eventBus.emit('master.barang.stock.item_not_found', {
                    kode: kode,
                    reference_id: reference_id
                });
            }
        } catch (error) {
            this.eventBus.emit('master.barang.error', {
                error: error.message,
                event: 'inventory.stock.update',
                data: data
            });
        }
    }
    
    /**
     * Handle item transfer requests
     * @param {Object} data - Transfer data
     */
    async handleItemTransfer(data) {
        try {
            const { from_location, to_location, items, transfer_id } = data;
            
            // For now, just acknowledge the transfer
            // In a full implementation, this would update location-specific stock
            this.eventBus.emit('master.barang.transfer.acknowledged', {
                transfer_id: transfer_id,
                from_location: from_location,
                to_location: to_location,
                items: items,
                acknowledged_at: new Date().toISOString()
            });
        } catch (error) {
            this.eventBus.emit('master.barang.error', {
                error: error.message,
                event: 'inventory.item.transfer',
                data: data
            });
        }
    }
    
    /**
     * Handle stock adjustment requests
     * @param {Object} data - Adjustment data
     */
    async handleStockAdjustment(data) {
        try {
            const { adjustments, reason, reference_id } = data;
            const results = [];
            
            for (const adjustment of adjustments) {
                const item = this.masterBarangSystem.barangManager.getByKode(adjustment.kode);
                if (item) {
                    const newStock = item.stok + adjustment.quantity_change;
                    const updateResult = this.masterBarangSystem.barangManager.update(item.id, {
                        stok: Math.max(0, newStock) // Prevent negative stock
                    });
                    
                    results.push({
                        kode: adjustment.kode,
                        success: updateResult.success,
                        old_stock: item.stok,
                        new_stock: Math.max(0, newStock),
                        quantity_change: adjustment.quantity_change
                    });
                } else {
                    results.push({
                        kode: adjustment.kode,
                        success: false,
                        error: 'Item not found'
                    });
                }
            }
            
            this.eventBus.emit('master.barang.adjustment.completed', {
                reference_id: reference_id,
                reason: reason,
                results: results,
                completed_at: new Date().toISOString()
            });
        } catch (error) {
            this.eventBus.emit('master.barang.error', {
                error: error.message,
                event: 'inventory.adjustment',
                data: data
            });
        }
    }
    
    /**
     * Handle COA updates from accounting system
     * @param {Object} data - COA update data
     */
    async handleCOAUpdate(data) {
        try {
            // For now, just acknowledge the COA update
            // In a full implementation, this would update item accounting codes
            this.eventBus.emit('master.barang.coa.acknowledged', {
                coa_data: data,
                acknowledged_at: new Date().toISOString()
            });
        } catch (error) {
            this.eventBus.emit('master.barang.error', {
                error: error.message,
                event: 'accounting.coa.update',
                data: data
            });
        }
    }
    
    /**
     * Handle journal entry requests
     * @param {Object} data - Journal request data
     */
    async handleJournalRequest(data) {
        try {
            const { transaction_type, items, reference_id } = data;
            
            // Generate journal entries for master barang transactions
            const journalEntries = [];
            
            for (const item of items) {
                const barangItem = this.masterBarangSystem.barangManager.getByKode(item.kode);
                if (barangItem) {
                    journalEntries.push({
                        account_code: '1140', // Inventory account
                        account_name: 'Persediaan Barang',
                        debit: item.quantity * barangItem.harga_beli,
                        credit: 0,
                        description: `${transaction_type} - ${barangItem.nama}`,
                        item_kode: item.kode
                    });
                }
            }
            
            this.eventBus.emit('master.barang.journal.generated', {
                reference_id: reference_id,
                transaction_type: transaction_type,
                journal_entries: journalEntries,
                generated_at: new Date().toISOString()
            });
        } catch (error) {
            this.eventBus.emit('master.barang.error', {
                error: error.message,
                event: 'accounting.journal.request',
                data: data
            });
        }
    }
    
    /**
     * Handle reporting data requests
     * @param {Object} data - Reporting request data
     */
    async handleReportingDataRequest(data) {
        try {
            const { report_type, filters, request_id } = data;
            let reportData = {};
            
            switch (report_type) {
                case 'stock_summary':
                    reportData = this.generateStockSummary(filters);
                    break;
                case 'item_list':
                    reportData = this.generateItemList(filters);
                    break;
                case 'category_summary':
                    reportData = this.generateCategorySummary(filters);
                    break;
                default:
                    throw new Error(`Unsupported report type: ${report_type}`);
            }
            
            this.eventBus.emit('master.barang.report.data', {
                request_id: request_id,
                report_type: report_type,
                data: reportData,
                generated_at: new Date().toISOString()
            });
        } catch (error) {
            this.eventBus.emit('master.barang.error', {
                error: error.message,
                event: 'reporting.data.request',
                data: data
            });
        }
    }
    
    /**
     * Handle export requests
     * @param {Object} data - Export request data
     */
    async handleExportRequest(data) {
        try {
            const { format, filters, request_id } = data;
            
            const exportResult = this.masterBarangSystem.exportManager.exportData({
                format: format,
                filters: filters
            });
            
            this.eventBus.emit('master.barang.export.completed', {
                request_id: request_id,
                export_result: exportResult,
                completed_at: new Date().toISOString()
            });
        } catch (error) {
            this.eventBus.emit('master.barang.error', {
                error: error.message,
                event: 'reporting.export.request',
                data: data
            });
        }
    }
    
    /**
     * Register master barang events for other modules
     */
    registerMasterBarangEvents() {
        // Listen for barang changes and notify other modules
        if (this.masterBarangSystem.barangManager.on) {
            this.masterBarangSystem.barangManager.on('item.created', (item) => {
                this.eventBus.emit('master.barang.created', {
                    item: item,
                    timestamp: new Date().toISOString()
                });
            });
            
            this.masterBarangSystem.barangManager.on('item.updated', (item) => {
                this.eventBus.emit('master.barang.updated', {
                    item: item,
                    timestamp: new Date().toISOString()
                });
            });
            
            this.masterBarangSystem.barangManager.on('item.deleted', (item) => {
                this.eventBus.emit('master.barang.deleted', {
                    item: item,
                    timestamp: new Date().toISOString()
                });
            });
        }
    }
    
    /**
     * Test integration points
     */
    testIntegrationPoints() {
        // Test if other modules are responding
        setTimeout(() => {
            this.eventBus.emit('master.barang.integration.test', {
                timestamp: new Date().toISOString(),
                message: 'Testing integration points'
            });
        }, 100);
    }
    
    /**
     * Generate stock summary report
     * @param {Object} filters - Report filters
     * @returns {Object} Stock summary data
     */
    generateStockSummary(filters) {
        const items = this.masterBarangSystem.barangManager.getAll(filters);
        
        return {
            total_items: items.length,
            total_stock_value: items.reduce((sum, item) => sum + (item.stok * item.harga_beli), 0),
            low_stock_items: items.filter(item => item.stok < 10).length,
            out_of_stock_items: items.filter(item => item.stok === 0).length,
            categories: [...new Set(items.map(item => item.kategori_nama))].length
        };
    }
    
    /**
     * Generate item list report
     * @param {Object} filters - Report filters
     * @returns {Array} Item list data
     */
    generateItemList(filters) {
        return this.masterBarangSystem.barangManager.getAll(filters).map(item => ({
            kode: item.kode,
            nama: item.nama,
            kategori: item.kategori_nama,
            satuan: item.satuan_nama,
            stok: item.stok,
            harga_beli: item.harga_beli,
            harga_jual: item.harga_jual
        }));
    }
    
    /**
     * Generate category summary report
     * @param {Object} filters - Report filters
     * @returns {Array} Category summary data
     */
    generateCategorySummary(filters) {
        const items = this.masterBarangSystem.barangManager.getAll(filters);
        const categoryMap = new Map();
        
        items.forEach(item => {
            const category = item.kategori_nama || 'Uncategorized';
            if (!categoryMap.has(category)) {
                categoryMap.set(category, {
                    category: category,
                    item_count: 0,
                    total_stock: 0,
                    total_value: 0
                });
            }
            
            const catData = categoryMap.get(category);
            catData.item_count++;
            catData.total_stock += item.stok;
            catData.total_value += item.stok * item.harga_beli;
        });
        
        return Array.from(categoryMap.values());
    }
    
    /**
     * Get integration status
     * @returns {Object} Integration status
     */
    getIntegrationStatus() {
        return {
            ...this.integrationStatus,
            event_handlers: this.eventHandlers.size,
            event_bus_available: !!window.eventBus,
            last_check: new Date().toISOString()
        };
    }
    
    /**
     * Cleanup integration
     */
    cleanup() {
        // Remove event handlers
        this.eventHandlers.forEach((handler, event) => {
            this.eventBus.off(event, handler);
        });
        this.eventHandlers.clear();
    }
}