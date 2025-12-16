/**
 * Master Barang Komprehensif - Filter Manager
 * Handles multiple filters for barang data
 */

export class FilterManager {
    constructor() {
        this.activeFilters = new Map();
        this.filterDefinitions = new Map();
        this.filterCache = new Map();
        
        // Initialize default filter definitions
        this.initializeDefaultFilters();
    }

    /**
     * Initialize default filter definitions
     */
    initializeDefaultFilters() {
        // Category filter
        this.defineFilter('kategori', {
            field: 'kategori_id',
            type: 'select',
            label: 'Kategori',
            multiple: false,
            operator: 'equals'
        });

        // Unit filter
        this.defineFilter('satuan', {
            field: 'satuan_id',
            type: 'select',
            label: 'Satuan',
            multiple: false,
            operator: 'equals'
        });

        // Status filter
        this.defineFilter('status', {
            field: 'status',
            type: 'select',
            label: 'Status',
            multiple: false,
            operator: 'equals',
            options: [
                { value: 'aktif', label: 'Aktif' },
                { value: 'nonaktif', label: 'Non-aktif' }
            ]
        });

        // Stock level filter
        this.defineFilter('stock_level', {
            field: 'stok',
            type: 'range',
            label: 'Level Stok',
            operator: 'between'
        });

        // Low stock filter
        this.defineFilter('low_stock', {
            field: 'stok',
            type: 'boolean',
            label: 'Stok Rendah',
            operator: 'custom',
            customFilter: (item) => {
                return item.stok <= item.stok_minimum && item.stok > 0;
            }
        });

        // Price range filter
        this.defineFilter('price_range', {
            field: 'harga_jual',
            type: 'range',
            label: 'Rentang Harga',
            operator: 'between'
        });

        // Created date filter
        this.defineFilter('created_date', {
            field: 'created_at',
            type: 'date_range',
            label: 'Tanggal Dibuat',
            operator: 'between'
        });
    }

    /**
     * Define a new filter
     * @param {string} name - Filter name
     * @param {Object} definition - Filter definition
     */
    defineFilter(name, definition) {
        const filterDef = {
            field: definition.field,
            type: definition.type || 'select',
            label: definition.label || name,
            multiple: definition.multiple || false,
            operator: definition.operator || 'equals',
            options: definition.options || [],
            customFilter: definition.customFilter || null,
            validation: definition.validation || null
        };

        this.filterDefinitions.set(name, filterDef);
    }

    /**
     * Set filter value
     * @param {string} filterName - Filter name
     * @param {any} value - Filter value
     * @returns {boolean} Success status
     */
    setFilter(filterName, value) {
        const definition = this.filterDefinitions.get(filterName);
        if (!definition) {
            console.warn(`Filter '${filterName}' not defined`);
            return false;
        }

        // Validate filter value
        if (definition.validation && !definition.validation(value)) {
            console.warn(`Invalid value for filter '${filterName}':`, value);
            return false;
        }

        // Clear value if null/undefined/empty
        if (value === null || value === undefined || value === '') {
            this.activeFilters.delete(filterName);
        } else {
            this.activeFilters.set(filterName, value);
        }

        // Clear cache when filters change
        this.clearCache();
        return true;
    }

    /**
     * Get filter value
     * @param {string} filterName - Filter name
     * @returns {any} Filter value
     */
    getFilter(filterName) {
        return this.activeFilters.get(filterName);
    }

    /**
     * Remove filter
     * @param {string} filterName - Filter name
     */
    removeFilter(filterName) {
        this.activeFilters.delete(filterName);
        this.clearCache();
    }

    /**
     * Clear all filters
     */
    clearAllFilters() {
        this.activeFilters.clear();
        this.clearCache();
    }

    /**
     * Get all active filters
     * @returns {Object} Active filters object
     */
    getActiveFilters() {
        const filters = {};
        this.activeFilters.forEach((value, key) => {
            filters[key] = value;
        });
        return filters;
    }

    /**
     * Apply filters to data
     * @param {Array} data - Data to filter
     * @returns {Array} Filtered data
     */
    applyFilters(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return data;
        }

        if (this.activeFilters.size === 0) {
            return data;
        }

        // Check cache
        const cacheKey = this.generateCacheKey(data);
        if (this.filterCache.has(cacheKey)) {
            return this.filterCache.get(cacheKey);
        }

        let filteredData = data;

        // Apply each active filter
        this.activeFilters.forEach((value, filterName) => {
            const definition = this.filterDefinitions.get(filterName);
            if (definition) {
                filteredData = this.applyFilter(filteredData, filterName, value, definition);
            }
        });

        // Cache result
        this.filterCache.set(cacheKey, filteredData);
        return filteredData;
    }

    /**
     * Apply single filter to data
     * @param {Array} data - Data to filter
     * @param {string} filterName - Filter name
     * @param {any} value - Filter value
     * @param {Object} definition - Filter definition
     * @returns {Array} Filtered data
     */
    applyFilter(data, filterName, value, definition) {
        const { field, operator, customFilter } = definition;

        return data.filter(item => {
            // Use custom filter if defined
            if (customFilter && typeof customFilter === 'function') {
                return customFilter(item, value);
            }

            const fieldValue = this.getFieldValue(item, field);

            switch (operator) {
                case 'equals':
                    return this.compareEquals(fieldValue, value);
                
                case 'not_equals':
                    return !this.compareEquals(fieldValue, value);
                
                case 'contains':
                    return this.compareContains(fieldValue, value);
                
                case 'starts_with':
                    return this.compareStartsWith(fieldValue, value);
                
                case 'ends_with':
                    return this.compareEndsWith(fieldValue, value);
                
                case 'greater_than':
                    return this.compareGreaterThan(fieldValue, value);
                
                case 'less_than':
                    return this.compareLessThan(fieldValue, value);
                
                case 'between':
                    return this.compareBetween(fieldValue, value);
                
                case 'in':
                    return this.compareIn(fieldValue, value);
                
                case 'not_in':
                    return !this.compareIn(fieldValue, value);
                
                default:
                    return this.compareEquals(fieldValue, value);
            }
        });
    }

    /**
     * Get field value with nested field support
     * @param {Object} item - Data item
     * @param {string} field - Field name
     * @returns {any} Field value
     */
    getFieldValue(item, field) {
        if (!item || !field) return null;

        const fieldParts = field.split('.');
        let value = item;

        for (const part of fieldParts) {
            if (value && typeof value === 'object' && part in value) {
                value = value[part];
            } else {
                return null;
            }
        }

        return value;
    }

    /**
     * Compare equals
     * @param {any} fieldValue - Field value
     * @param {any} filterValue - Filter value
     * @returns {boolean} Comparison result
     */
    compareEquals(fieldValue, filterValue) {
        if (fieldValue === null || fieldValue === undefined) return false;
        return fieldValue.toString() === filterValue.toString();
    }

    /**
     * Compare contains
     * @param {any} fieldValue - Field value
     * @param {any} filterValue - Filter value
     * @returns {boolean} Comparison result
     */
    compareContains(fieldValue, filterValue) {
        if (fieldValue === null || fieldValue === undefined) return false;
        return fieldValue.toString().toLowerCase().includes(filterValue.toString().toLowerCase());
    }

    /**
     * Compare starts with
     * @param {any} fieldValue - Field value
     * @param {any} filterValue - Filter value
     * @returns {boolean} Comparison result
     */
    compareStartsWith(fieldValue, filterValue) {
        if (fieldValue === null || fieldValue === undefined) return false;
        return fieldValue.toString().toLowerCase().startsWith(filterValue.toString().toLowerCase());
    }

    /**
     * Compare ends with
     * @param {any} fieldValue - Field value
     * @param {any} filterValue - Filter value
     * @returns {boolean} Comparison result
     */
    compareEndsWith(fieldValue, filterValue) {
        if (fieldValue === null || fieldValue === undefined) return false;
        return fieldValue.toString().toLowerCase().endsWith(filterValue.toString().toLowerCase());
    }

    /**
     * Compare greater than
     * @param {any} fieldValue - Field value
     * @param {any} filterValue - Filter value
     * @returns {boolean} Comparison result
     */
    compareGreaterThan(fieldValue, filterValue) {
        const numField = Number(fieldValue);
        const numFilter = Number(filterValue);
        return !isNaN(numField) && !isNaN(numFilter) && numField > numFilter;
    }

    /**
     * Compare less than
     * @param {any} fieldValue - Field value
     * @param {any} filterValue - Filter value
     * @returns {boolean} Comparison result
     */
    compareLessThan(fieldValue, filterValue) {
        const numField = Number(fieldValue);
        const numFilter = Number(filterValue);
        return !isNaN(numField) && !isNaN(numFilter) && numField < numFilter;
    }

    /**
     * Compare between (for ranges)
     * @param {any} fieldValue - Field value
     * @param {Object} filterValue - Filter value with min/max
     * @returns {boolean} Comparison result
     */
    compareBetween(fieldValue, filterValue) {
        if (!filterValue || typeof filterValue !== 'object') return true;
        
        const numField = Number(fieldValue);
        if (isNaN(numField)) return false;

        const { min, max } = filterValue;
        
        if (min !== undefined && min !== null) {
            const numMin = Number(min);
            if (!isNaN(numMin) && numField < numMin) return false;
        }
        
        if (max !== undefined && max !== null) {
            const numMax = Number(max);
            if (!isNaN(numMax) && numField > numMax) return false;
        }
        
        return true;
    }

    /**
     * Compare in array
     * @param {any} fieldValue - Field value
     * @param {Array} filterValue - Array of values
     * @returns {boolean} Comparison result
     */
    compareIn(fieldValue, filterValue) {
        if (!Array.isArray(filterValue)) return false;
        return filterValue.some(value => this.compareEquals(fieldValue, value));
    }

    /**
     * Get filter options for a specific filter
     * @param {string} filterName - Filter name
     * @param {Array} data - Data to extract options from
     * @returns {Array} Filter options
     */
    getFilterOptions(filterName, data = []) {
        const definition = this.filterDefinitions.get(filterName);
        if (!definition) return [];

        // Return predefined options if available
        if (definition.options && definition.options.length > 0) {
            return definition.options;
        }

        // Extract unique values from data
        const uniqueValues = new Set();
        data.forEach(item => {
            const value = this.getFieldValue(item, definition.field);
            if (value !== null && value !== undefined) {
                uniqueValues.add(value);
            }
        });

        return Array.from(uniqueValues)
            .sort()
            .map(value => ({
                value: value,
                label: value.toString()
            }));
    }

    /**
     * Get filter summary for display
     * @returns {Array} Filter summary
     */
    getFilterSummary() {
        const summary = [];
        
        this.activeFilters.forEach((value, filterName) => {
            const definition = this.filterDefinitions.get(filterName);
            if (definition) {
                summary.push({
                    name: filterName,
                    label: definition.label,
                    value: value,
                    displayValue: this.formatFilterValue(value, definition)
                });
            }
        });

        return summary;
    }

    /**
     * Format filter value for display
     * @param {any} value - Filter value
     * @param {Object} definition - Filter definition
     * @returns {string} Formatted value
     */
    formatFilterValue(value, definition) {
        if (value === null || value === undefined) return '';

        switch (definition.type) {
            case 'range':
                if (typeof value === 'object' && value.min !== undefined && value.max !== undefined) {
                    return `${value.min} - ${value.max}`;
                }
                return value.toString();
            
            case 'date_range':
                if (typeof value === 'object' && value.start && value.end) {
                    return `${new Date(value.start).toLocaleDateString()} - ${new Date(value.end).toLocaleDateString()}`;
                }
                return value.toString();
            
            case 'boolean':
                return value ? 'Ya' : 'Tidak';
            
            default:
                if (Array.isArray(value)) {
                    return value.join(', ');
                }
                return value.toString();
        }
    }

    /**
     * Generate cache key for current filters and data
     * @param {Array} data - Data array
     * @returns {string} Cache key
     */
    generateCacheKey(data) {
        const filterKey = Array.from(this.activeFilters.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}:${JSON.stringify(value)}`)
            .join('|');
        
        return `${filterKey}_${data.length}`;
    }

    /**
     * Clear filter cache
     */
    clearCache() {
        this.filterCache.clear();
    }

    /**
     * Get filter statistics
     * @returns {Object} Filter statistics
     */
    getFilterStats() {
        return {
            activeFiltersCount: this.activeFilters.size,
            definedFiltersCount: this.filterDefinitions.size,
            cacheSize: this.filterCache.size,
            activeFilters: this.getActiveFilters()
        };
    }

    /**
     * Export filter configuration
     * @returns {Object} Filter configuration
     */
    exportConfig() {
        return {
            activeFilters: this.getActiveFilters(),
            filterDefinitions: Object.fromEntries(this.filterDefinitions)
        };
    }

    /**
     * Import filter configuration
     * @param {Object} config - Filter configuration
     */
    importConfig(config) {
        if (config.activeFilters) {
            this.activeFilters.clear();
            Object.entries(config.activeFilters).forEach(([key, value]) => {
                this.activeFilters.set(key, value);
            });
        }

        if (config.filterDefinitions) {
            Object.entries(config.filterDefinitions).forEach(([key, definition]) => {
                this.filterDefinitions.set(key, definition);
            });
        }

        this.clearCache();
    }
}