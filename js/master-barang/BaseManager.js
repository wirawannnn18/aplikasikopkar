/**
 * Master Barang Komprehensif - Base Manager
 * Base class for all managers with common functionality
 */

import { STORAGE_KEYS, DEFAULTS } from './types.js';

export class BaseManager {
    constructor(storageKey) {
        this.storageKey = storageKey;
        this.data = this.loadData();
    }

    /**
     * Load data from localStorage
     * @returns {Array} Array of data items
     */
    loadData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error(`Error loading data from ${this.storageKey}:`, error);
            return [];
        }
    }

    /**
     * Save data to localStorage
     * @param {Array} data - Data to save
     * @returns {boolean} Success status
     */
    saveData(data = this.data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            this.data = data;
            return true;
        } catch (error) {
            console.error(`Error saving data to ${this.storageKey}:`, error);
            return false;
        }
    }

    /**
     * Generate unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get current timestamp
     * @returns {number} Current timestamp
     */
    getCurrentTimestamp() {
        return Date.now();
    }

    /**
     * Get current user info (placeholder - should be integrated with auth system)
     * @returns {Object} User info
     */
    getCurrentUser() {
        // TODO: Integrate with actual auth system
        return {
            id: 'user_1',
            name: 'Admin User'
        };
    }

    /**
     * Find item by ID
     * @param {string} id - Item ID
     * @returns {Object|null} Found item or null
     */
    findById(id) {
        return this.data.find(item => item.id === id) || null;
    }

    /**
     * Find items by field value
     * @param {string} field - Field name
     * @param {*} value - Field value
     * @returns {Array} Array of matching items
     */
    findByField(field, value) {
        return this.data.filter(item => item[field] === value);
    }

    /**
     * Check if item exists by field value
     * @param {string} field - Field name
     * @param {*} value - Field value
     * @param {string|null} excludeId - ID to exclude from check
     * @returns {boolean} Whether item exists
     */
    existsByField(field, value, excludeId = null) {
        return this.data.some(item => 
            item[field] === value && 
            (excludeId ? item.id !== excludeId : true)
        );
    }

    /**
     * Get all items with optional filtering
     * @param {Object} filters - Filter options
     * @returns {Array} Filtered items
     */
    getAll(filters = {}) {
        let result = [...this.data];

        // Apply status filter
        if (filters.status) {
            result = result.filter(item => item.status === filters.status);
        }

        // Apply search filter
        if (filters.searchTerm) {
            const term = filters.searchTerm.toLowerCase();
            result = result.filter(item => 
                (item.nama && item.nama.toLowerCase().includes(term)) ||
                (item.kode && item.kode.toLowerCase().includes(term))
            );
        }

        return result;
    }

    /**
     * Get paginated results
     * @param {Object} options - Pagination options
     * @returns {Object} Pagination result
     */
    getPaginated(options = {}) {
        const {
            page = 1,
            limit = DEFAULTS.PAGE_SIZE,
            sortBy = 'nama',
            sortOrder = 'asc',
            ...filters
        } = options;

        // Get filtered data
        let result = this.getAll(filters);

        // Apply sorting
        result.sort((a, b) => {
            const aVal = a[sortBy] || '';
            const bVal = b[sortBy] || '';
            
            if (typeof aVal === 'string' && typeof bVal === 'string') {
                const comparison = aVal.localeCompare(bVal);
                return sortOrder === 'desc' ? -comparison : comparison;
            } else {
                const comparison = aVal - bVal;
                return sortOrder === 'desc' ? -comparison : comparison;
            }
        });

        // Calculate pagination
        const total = result.length;
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;
        const paginatedData = result.slice(offset, offset + limit);

        return {
            data: paginatedData,
            total,
            page,
            limit,
            totalPages
        };
    }

    /**
     * Create new item
     * @param {Object} itemData - Item data
     * @returns {Object} Created item
     */
    create(itemData) {
        const user = this.getCurrentUser();
        const timestamp = this.getCurrentTimestamp();

        const newItem = {
            id: this.generateId(),
            ...itemData,
            status: itemData.status || 'aktif',
            created_at: timestamp,
            updated_at: timestamp,
            created_by: user.id,
            updated_by: user.id
        };

        this.data.push(newItem);
        this.saveData();

        return newItem;
    }

    /**
     * Update existing item
     * @param {string} id - Item ID
     * @param {Object} updateData - Update data
     * @returns {Object|null} Updated item or null
     */
    update(id, updateData) {
        const index = this.data.findIndex(item => item.id === id);
        if (index === -1) return null;

        const user = this.getCurrentUser();
        const timestamp = this.getCurrentTimestamp();

        const updatedItem = {
            ...this.data[index],
            ...updateData,
            updated_at: timestamp,
            updated_by: user.id
        };

        this.data[index] = updatedItem;
        this.saveData();

        return updatedItem;
    }

    /**
     * Delete item
     * @param {string} id - Item ID
     * @returns {boolean} Success status
     */
    delete(id) {
        const index = this.data.findIndex(item => item.id === id);
        if (index === -1) return false;

        this.data.splice(index, 1);
        this.saveData();

        return true;
    }

    /**
     * Bulk delete items
     * @param {Array<string>} ids - Array of item IDs
     * @returns {Object} Result with success and failed counts
     */
    bulkDelete(ids) {
        const result = {
            success: 0,
            failed: 0,
            errors: []
        };

        ids.forEach(id => {
            if (this.delete(id)) {
                result.success++;
            } else {
                result.failed++;
                result.errors.push(`Failed to delete item with ID: ${id}`);
            }
        });

        return result;
    }

    /**
     * Get item count
     * @param {Object} filters - Filter options
     * @returns {number} Item count
     */
    getCount(filters = {}) {
        return this.getAll(filters).length;
    }

    /**
     * Clear all data (for testing purposes)
     * @returns {boolean} Success status
     */
    clearAll() {
        this.data = [];
        return this.saveData();
    }

    /**
     * Import data from array
     * @param {Array} importData - Data to import
     * @param {boolean} replaceExisting - Whether to replace existing data
     * @returns {Object} Import result
     */
    importData(importData, replaceExisting = false) {
        const result = {
            success: 0,
            failed: 0,
            updated: 0,
            errors: []
        };

        if (replaceExisting) {
            this.data = [];
        }

        importData.forEach((item, index) => {
            try {
                // Check if item already exists (by kode if available)
                const existingItem = item.kode ? 
                    this.data.find(existing => existing.kode === item.kode) : null;

                if (existingItem && !replaceExisting) {
                    // Update existing item
                    this.update(existingItem.id, item);
                    result.updated++;
                } else {
                    // Create new item
                    this.create(item);
                    result.success++;
                }
            } catch (error) {
                result.failed++;
                result.errors.push(`Row ${index + 1}: ${error.message}`);
            }
        });

        return result;
    }

    /**
     * Export data to array
     * @param {Object} filters - Filter options
     * @returns {Array} Exported data
     */
    exportData(filters = {}) {
        return this.getAll(filters);
    }
}