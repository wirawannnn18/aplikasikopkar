/**
 * StockManager - Pengelola stok barang untuk transformasi
 * 
 * Kelas ini bertanggung jawab untuk mengelola perubahan stok
 * dengan operasi atomic dan validasi konsistensi.
 */

class StockManager {
    constructor() {
        this.initialized = false;
        this.stockCache = new Map(); // Cache untuk performa
    }

    /**
     * Initialize StockManager
     */
    initialize() {
        this.initialized = true;
        this._loadStockData();
    }

    /**
     * Update stok untuk item tertentu
     * @param {string} itemId - ID item
     * @param {string} unit - Unit item
     * @param {number} quantityChange - Perubahan quantity (positif/negatif)
     * @returns {Promise<StockUpdateResult>} Hasil update stok
     */
    async updateStock(itemId, unit, quantityChange) {
        this._ensureInitialized();
        
        try {
            // Validasi input
            if (!itemId || typeof itemId !== 'string') {
                throw new Error('Item ID harus berupa string yang valid');
            }
            
            if (typeof quantityChange !== 'number' || isNaN(quantityChange)) {
                throw new Error('Quantity change harus berupa angka yang valid');
            }

            // Dapatkan data master barang
            const masterBarang = this._getMasterBarangData();
            const itemIndex = masterBarang.findIndex(item => item.kode === itemId);
            
            if (itemIndex === -1) {
                throw new Error(`Item dengan ID ${itemId} tidak ditemukan`);
            }

            const item = masterBarang[itemIndex];
            const currentStock = item.stok || 0;
            const newStock = currentStock + quantityChange;

            // Validasi stok tidak boleh negatif
            if (newStock < 0) {
                throw new Error(`Stok tidak mencukupi. Stok saat ini: ${currentStock}, perubahan: ${quantityChange}`);
            }

            // Simpan stok sebelumnya untuk rollback
            const previousStock = currentStock;

            // Update stok
            masterBarang[itemIndex].stok = newStock;
            
            // Simpan ke localStorage
            this._saveMasterBarangData(masterBarang);

            // Update cache
            const cacheKey = `${itemId}`;
            this.stockCache.set(cacheKey, {
                stok: newStock,
                lastUpdated: Date.now()
            });

            return {
                success: true,
                itemId,
                unit,
                previousStock,
                newStock,
                quantityChange,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error updating stock:', error);
            throw error;
        }
    }

    /**
     * Mendapatkan saldo stok untuk item dan unit tertentu
     * @param {string} itemId - ID item
     * @param {string} unit - Unit item
     * @returns {Promise<number>} Jumlah stok saat ini
     */
    async getStockBalance(itemId, unit) {
        this._ensureInitialized();
        
        try {
            // Validasi input
            if (!itemId || typeof itemId !== 'string') {
                throw new Error('Item ID harus berupa string yang valid');
            }

            // Cek cache terlebih dahulu
            const cacheKey = `${itemId}`;
            if (this.stockCache.has(cacheKey)) {
                const cached = this.stockCache.get(cacheKey);
                // Cache valid untuk 5 menit
                if (Date.now() - cached.lastUpdated < 5 * 60 * 1000) {
                    return cached.stok;
                }
            }

            // Ambil dari localStorage jika tidak ada di cache atau expired
            const masterBarang = this._getMasterBarangData();
            const item = masterBarang.find(item => item.kode === itemId);
            
            if (!item) {
                throw new Error(`Item dengan ID ${itemId} tidak ditemukan`);
            }

            const stock = item.stok || 0;

            // Update cache
            this.stockCache.set(cacheKey, {
                stok: stock,
                lastUpdated: Date.now()
            });

            return stock;

        } catch (error) {
            console.error('Error getting stock balance:', error);
            throw error;
        }
    }

    /**
     * Validasi konsistensi stok setelah transformasi
     * @param {TransformationRecord} transformationRecord - Record transformasi
     * @returns {Promise<boolean>} True jika konsisten
     */
    async validateStockConsistency(transformationRecord) {
        this._ensureInitialized();
        
        try {
            if (!transformationRecord) {
                throw new Error('Transformation record harus disediakan');
            }

            const { sourceItem, targetItem, conversionRatio } = transformationRecord;

            if (!sourceItem || !targetItem) {
                throw new Error('Source dan target item harus disediakan');
            }

            // Validasi bahwa perubahan stok sesuai dengan rasio konversi
            const expectedTargetQuantity = sourceItem.quantity * conversionRatio;
            
            if (Math.abs(targetItem.quantity - expectedTargetQuantity) > 1) {
                console.error('Inconsistent conversion calculation:', {
                    sourceQuantity: sourceItem.quantity,
                    conversionRatio,
                    expectedTargetQuantity,
                    actualTargetQuantity: targetItem.quantity
                });
                return false;
            }

            // Validasi bahwa stok sebelum dan sesudah konsisten
            const sourceStockChange = sourceItem.stockBefore - sourceItem.stockAfter;
            const targetStockChange = targetItem.stockAfter - targetItem.stockBefore;

            if (sourceStockChange !== sourceItem.quantity) {
                console.error('Inconsistent source stock change:', {
                    expected: sourceItem.quantity,
                    actual: sourceStockChange
                });
                return false;
            }

            if (targetStockChange !== targetItem.quantity) {
                console.error('Inconsistent target stock change:', {
                    expected: targetItem.quantity,
                    actual: targetStockChange
                });
                return false;
            }

            // Validasi stok saat ini di sistem
            const currentSourceStock = await this.getStockBalance(sourceItem.id);
            const currentTargetStock = await this.getStockBalance(targetItem.id);

            if (currentSourceStock !== sourceItem.stockAfter) {
                console.error('Source stock mismatch with system:', {
                    expected: sourceItem.stockAfter,
                    actual: currentSourceStock
                });
                return false;
            }

            if (currentTargetStock !== targetItem.stockAfter) {
                console.error('Target stock mismatch with system:', {
                    expected: targetItem.stockAfter,
                    actual: currentTargetStock
                });
                return false;
            }

            return true;

        } catch (error) {
            console.error('Error validating stock consistency:', error);
            return false;
        }
    }

    /**
     * Melakukan atomic update untuk transformasi (source dan target bersamaan)
     * @param {Object} sourceUpdate - Update untuk source item
     * @param {Object} targetUpdate - Update untuk target item
     * @returns {Promise<StockUpdateResult>} Hasil atomic update
     */
    async atomicTransformationUpdate(sourceUpdate, targetUpdate) {
        this._ensureInitialized();
        
        try {
            // Validasi input
            if (!sourceUpdate || !targetUpdate) {
                throw new Error('Source dan target update harus disediakan');
            }

            const { itemId: sourceId, quantityChange: sourceChange } = sourceUpdate;
            const { itemId: targetId, quantityChange: targetChange } = targetUpdate;

            if (!sourceId || !targetId) {
                throw new Error('Item ID untuk source dan target harus disediakan');
            }

            // Dapatkan data master barang
            const masterBarang = this._getMasterBarangData();
            
            // Cari index untuk kedua item
            const sourceIndex = masterBarang.findIndex(item => item.kode === sourceId);
            const targetIndex = masterBarang.findIndex(item => item.kode === targetId);

            if (sourceIndex === -1) {
                throw new Error(`Source item dengan ID ${sourceId} tidak ditemukan`);
            }

            if (targetIndex === -1) {
                throw new Error(`Target item dengan ID ${targetId} tidak ditemukan`);
            }

            // Simpan stok sebelumnya untuk rollback
            const sourceItem = masterBarang[sourceIndex];
            const targetItem = masterBarang[targetIndex];
            const originalSourceStock = sourceItem.stok || 0;
            const originalTargetStock = targetItem.stok || 0;

            // Hitung stok baru
            const newSourceStock = originalSourceStock + sourceChange;
            const newTargetStock = originalTargetStock + targetChange;

            // Validasi stok tidak boleh negatif
            if (newSourceStock < 0) {
                throw new Error(`Stok source tidak mencukupi. Stok saat ini: ${originalSourceStock}, perubahan: ${sourceChange}`);
            }

            if (newTargetStock < 0) {
                throw new Error(`Stok target akan menjadi negatif. Stok saat ini: ${originalTargetStock}, perubahan: ${targetChange}`);
            }

            // Lakukan atomic update
            masterBarang[sourceIndex].stok = newSourceStock;
            masterBarang[targetIndex].stok = newTargetStock;

            // Simpan ke localStorage
            this._saveMasterBarangData(masterBarang);

            // Update cache untuk kedua item
            this.stockCache.set(sourceId, {
                stok: newSourceStock,
                lastUpdated: Date.now()
            });

            this.stockCache.set(targetId, {
                stok: newTargetStock,
                lastUpdated: Date.now()
            });

            return {
                success: true,
                timestamp: new Date().toISOString(),
                sourceUpdate: {
                    itemId: sourceId,
                    previousStock: originalSourceStock,
                    newStock: newSourceStock,
                    quantityChange: sourceChange
                },
                targetUpdate: {
                    itemId: targetId,
                    previousStock: originalTargetStock,
                    newStock: newTargetStock,
                    quantityChange: targetChange
                },
                rollbackData: {
                    sourceId,
                    targetId,
                    originalSourceStock,
                    originalTargetStock
                }
            };

        } catch (error) {
            console.error('Error performing atomic transformation update:', error);
            throw error;
        }
    }

    /**
     * Rollback perubahan stok jika terjadi error
     * @param {Object} rollbackData - Data untuk rollback
     * @returns {Promise<boolean>} True jika rollback berhasil
     */
    async rollbackStockChanges(rollbackData) {
        this._ensureInitialized();
        
        try {
            if (!rollbackData) {
                throw new Error('Rollback data harus disediakan');
            }

            const { sourceId, targetId, originalSourceStock, originalTargetStock } = rollbackData;

            if (!sourceId || !targetId) {
                throw new Error('Source dan target ID harus disediakan untuk rollback');
            }

            // Dapatkan data master barang
            const masterBarang = this._getMasterBarangData();
            
            // Cari index untuk kedua item
            const sourceIndex = masterBarang.findIndex(item => item.kode === sourceId);
            const targetIndex = masterBarang.findIndex(item => item.kode === targetId);

            if (sourceIndex === -1) {
                console.error(`Source item ${sourceId} tidak ditemukan untuk rollback`);
                return false;
            }

            if (targetIndex === -1) {
                console.error(`Target item ${targetId} tidak ditemukan untuk rollback`);
                return false;
            }

            // Restore stok ke nilai semula
            masterBarang[sourceIndex].stok = originalSourceStock;
            masterBarang[targetIndex].stok = originalTargetStock;

            // Simpan ke localStorage
            this._saveMasterBarangData(masterBarang);

            // Update cache
            this.stockCache.set(sourceId, {
                stok: originalSourceStock,
                lastUpdated: Date.now()
            });

            this.stockCache.set(targetId, {
                stok: originalTargetStock,
                lastUpdated: Date.now()
            });

            console.log('Stock rollback successful:', {
                sourceId,
                targetId,
                restoredSourceStock: originalSourceStock,
                restoredTargetStock: originalTargetStock
            });

            return true;

        } catch (error) {
            console.error('Error rolling back stock changes:', error);
            return false;
        }
    }

    /**
     * Mendapatkan semua item dengan stok yang tersedia
     * @returns {Promise<Object[]>} Array item dengan stok
     */
    async getItemsWithStock() {
        this._ensureInitialized();
        
        try {
            const masterBarang = this._getMasterBarangData();
            return masterBarang.filter(item => item.stok > 0);
        } catch (error) {
            console.error('Error getting items with stock:', error);
            throw error;
        }
    }

    /**
     * Cek apakah stok mencukupi untuk transformasi
     * @param {string} itemId - ID item
     * @param {number} requiredQuantity - Quantity yang dibutuhkan
     * @returns {Promise<boolean>} True jika stok mencukupi
     */
    async isStockSufficient(itemId, requiredQuantity) {
        this._ensureInitialized();
        
        try {
            // Validasi input
            if (!itemId || typeof itemId !== 'string') {
                throw new Error('Item ID harus berupa string yang valid');
            }

            if (typeof requiredQuantity !== 'number' || requiredQuantity < 0) {
                throw new Error('Required quantity harus berupa angka non-negatif');
            }

            const currentStock = await this.getStockBalance(itemId);
            return currentStock >= requiredQuantity;
        } catch (error) {
            console.error('Error checking stock sufficiency:', error);
            return false;
        }
    }

    /**
     * Memuat data stok dari localStorage
     * @private
     */
    _loadStockData() {
        try {
            const masterBarang = this._getMasterBarangData();
            this.stockCache.clear();
            
            // Build cache untuk performa
            masterBarang.forEach(item => {
                const key = `${item.kode}`;
                this.stockCache.set(key, {
                    stok: item.stok,
                    lastUpdated: Date.now()
                });
            });
        } catch (error) {
            console.error('Error loading stock data:', error);
            this.stockCache.clear();
        }
    }

    /**
     * Mendapatkan data master barang dari localStorage
     * @returns {Object[]} Array master barang
     * @private
     */
    _getMasterBarangData() {
        try {
            const data = localStorage.getItem('masterBarang');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error getting master barang data:', error);
            return [];
        }
    }

    /**
     * Menyimpan data master barang ke localStorage
     * @param {Object[]} masterBarang - Array master barang
     * @private
     */
    _saveMasterBarangData(masterBarang) {
        try {
            localStorage.setItem('masterBarang', JSON.stringify(masterBarang));
            this._loadStockData(); // Reload cache
        } catch (error) {
            console.error('Error saving master barang data:', error);
            throw error;
        }
    }

    /**
     * Refresh cache stok
     */
    refreshStockCache() {
        this._ensureInitialized();
        this._loadStockData();
    }

    /**
     * Mendapatkan informasi stok untuk multiple items sekaligus
     * @param {string[]} itemIds - Array ID item
     * @returns {Promise<Object>} Object dengan itemId sebagai key dan stock sebagai value
     */
    async getBulkStockBalance(itemIds) {
        this._ensureInitialized();
        
        try {
            if (!Array.isArray(itemIds)) {
                throw new Error('Item IDs harus berupa array');
            }

            const result = {};
            
            for (const itemId of itemIds) {
                try {
                    result[itemId] = await this.getStockBalance(itemId);
                } catch (error) {
                    console.warn(`Error getting stock for ${itemId}:`, error.message);
                    result[itemId] = 0; // Default ke 0 jika error
                }
            }

            return result;
        } catch (error) {
            console.error('Error getting bulk stock balance:', error);
            throw error;
        }
    }

    /**
     * Mendapatkan statistik stok
     * @returns {Promise<Object>} Statistik stok
     */
    async getStockStatistics() {
        this._ensureInitialized();
        
        try {
            const masterBarang = this._getMasterBarangData();
            
            const stats = {
                totalItems: masterBarang.length,
                itemsWithStock: 0,
                itemsOutOfStock: 0,
                totalStockValue: 0,
                lowStockItems: [], // Items dengan stok < 5
                highStockItems: [] // Items dengan stok > 100
            };

            masterBarang.forEach(item => {
                const stock = item.stok || 0;
                
                if (stock > 0) {
                    stats.itemsWithStock++;
                } else {
                    stats.itemsOutOfStock++;
                }

                if (stock < 5 && stock > 0) {
                    stats.lowStockItems.push({
                        id: item.kode,
                        name: item.nama,
                        stock: stock
                    });
                }

                if (stock > 100) {
                    stats.highStockItems.push({
                        id: item.kode,
                        name: item.nama,
                        stock: stock
                    });
                }

                // Hitung total value jika ada harga beli
                if (item.hargaBeli) {
                    stats.totalStockValue += stock * item.hargaBeli;
                }
            });

            return stats;
        } catch (error) {
            console.error('Error getting stock statistics:', error);
            throw error;
        }
    }

    /**
     * Backup data stok ke format yang bisa di-restore
     * @returns {Promise<Object>} Backup data
     */
    async createStockBackup() {
        this._ensureInitialized();
        
        try {
            const masterBarang = this._getMasterBarangData();
            
            return {
                timestamp: new Date().toISOString(),
                version: '1.0',
                stockData: masterBarang.map(item => ({
                    kode: item.kode,
                    nama: item.nama,
                    stok: item.stok || 0
                }))
            };
        } catch (error) {
            console.error('Error creating stock backup:', error);
            throw error;
        }
    }

    /**
     * Restore data stok dari backup
     * @param {Object} backupData - Data backup
     * @returns {Promise<boolean>} True jika restore berhasil
     */
    async restoreStockFromBackup(backupData) {
        this._ensureInitialized();
        
        try {
            if (!backupData || !backupData.stockData) {
                throw new Error('Backup data tidak valid');
            }

            const masterBarang = this._getMasterBarangData();
            let restoredCount = 0;

            // Restore stok untuk setiap item yang ada di backup
            backupData.stockData.forEach(backupItem => {
                const itemIndex = masterBarang.findIndex(item => item.kode === backupItem.kode);
                if (itemIndex !== -1) {
                    masterBarang[itemIndex].stok = backupItem.stok;
                    restoredCount++;
                }
            });

            // Simpan perubahan
            this._saveMasterBarangData(masterBarang);

            console.log(`Stock restore completed. ${restoredCount} items restored.`);
            return true;

        } catch (error) {
            console.error('Error restoring stock from backup:', error);
            return false;
        }
    }

    /**
     * Memastikan StockManager sudah diinisialisasi
     * @private
     */
    _ensureInitialized() {
        if (!this.initialized) {
            throw new Error('StockManager belum diinisialisasi. Panggil initialize() terlebih dahulu.');
        }
    }
}

// Export untuk browser dan Node.js
if (typeof window !== 'undefined') {
    window.StockManager = StockManager;
}

// ES6 module export (commented out for browser compatibility)
// export default StockManager;