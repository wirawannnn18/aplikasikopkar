/**
 * CategoryUnitManager - Management of categories and units with auto-creation
 * 
 * This class handles CRUD operations for categories and units,
 * including automatic creation from upload data and usage validation.
 */

class CategoryUnitManager {
    constructor() {
        /** @type {string} */
        this.categoriesKey = 'masterKategori';
        
        /** @type {string} */
        this.unitsKey = 'masterSatuan';
        
        this.initializeDefaults();
    }

    /**
     * Initialize default categories and units if they don't exist
     * @private
     */
    initializeDefaults() {
        // Initialize default categories if none exist
        const existingCategories = this.getCategories();
        if (existingCategories.length === 0) {
            const defaultCategories = [
                { name: 'makanan', created_at: new Date().toISOString(), usage_count: 0 },
                { name: 'minuman', created_at: new Date().toISOString(), usage_count: 0 },
                { name: 'alat tulis', created_at: new Date().toISOString(), usage_count: 0 },
                { name: 'elektronik', created_at: new Date().toISOString(), usage_count: 0 }
            ];
            this.saveCategories(defaultCategories);
        }

        // Initialize default units if none exist
        const existingUnits = this.getUnits();
        if (existingUnits.length === 0) {
            const defaultUnits = [
                { name: 'pcs', created_at: new Date().toISOString(), usage_count: 0 },
                { name: 'kg', created_at: new Date().toISOString(), usage_count: 0 },
                { name: 'liter', created_at: new Date().toISOString(), usage_count: 0 },
                { name: 'box', created_at: new Date().toISOString(), usage_count: 0 },
                { name: 'pack', created_at: new Date().toISOString(), usage_count: 0 }
            ];
            this.saveUnits(defaultUnits);
        }
    }

    /**
     * Get all categories
     * @returns {CategoryData[]} Array of categories
     */
    getCategories() {
        try {
            const data = localStorage.getItem(this.categoriesKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading categories:', error);
            return [];
        }
    }

    /**
     * Get all units
     * @returns {UnitData[]} Array of units
     */
    getUnits() {
        try {
            const data = localStorage.getItem(this.unitsKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading units:', error);
            return [];
        }
    }

    /**
     * Create a new category
     * @param {string} name - Category name
     * @returns {boolean} Success status
     */
    createCategory(name) {
        try {
            const normalizedName = this.normalizeName(name);
            
            if (!normalizedName) {
                throw new Error('Category name cannot be empty');
            }

            const categories = this.getCategories();
            
            // Check if category already exists
            if (categories.some(cat => cat.name === normalizedName)) {
                return false; // Already exists
            }

            // Add new category
            const newCategory = {
                name: normalizedName,
                created_at: new Date().toISOString(),
                usage_count: 0
            };

            categories.push(newCategory);
            this.saveCategories(categories);
            
            return true;
            
        } catch (error) {
            console.error('Error creating category:', error);
            return false;
        }
    }

    /**
     * Create a new unit
     * @param {string} name - Unit name
     * @returns {boolean} Success status
     */
    createUnit(name) {
        try {
            const normalizedName = this.normalizeName(name);
            
            if (!normalizedName) {
                throw new Error('Unit name cannot be empty');
            }

            const units = this.getUnits();
            
            // Check if unit already exists
            if (units.some(unit => unit.name === normalizedName)) {
                return false; // Already exists
            }

            // Add new unit
            const newUnit = {
                name: normalizedName,
                created_at: new Date().toISOString(),
                usage_count: 0
            };

            units.push(newUnit);
            this.saveUnits(units);
            
            return true;
            
        } catch (error) {
            console.error('Error creating unit:', error);
            return false;
        }
    }

    /**
     * Delete a category
     * @param {string} name - Category name to delete
     * @returns {boolean} Success status
     */
    deleteCategory(name) {
        try {
            const normalizedName = this.normalizeName(name);
            
            // Check if category is in use
            if (this.validateCategoryUsage(normalizedName)) {
                throw new Error('Cannot delete category that is in use');
            }

            const categories = this.getCategories();
            const filteredCategories = categories.filter(cat => cat.name !== normalizedName);
            
            if (filteredCategories.length === categories.length) {
                return false; // Category not found
            }

            this.saveCategories(filteredCategories);
            return true;
            
        } catch (error) {
            console.error('Error deleting category:', error);
            return false;
        }
    }

    /**
     * Delete a unit
     * @param {string} name - Unit name to delete
     * @returns {boolean} Success status
     */
    deleteUnit(name) {
        try {
            const normalizedName = this.normalizeName(name);
            
            // Check if unit is in use
            if (this.validateUnitUsage(normalizedName)) {
                throw new Error('Cannot delete unit that is in use');
            }

            const units = this.getUnits();
            const filteredUnits = units.filter(unit => unit.name !== normalizedName);
            
            if (filteredUnits.length === units.length) {
                return false; // Unit not found
            }

            this.saveUnits(filteredUnits);
            return true;
            
        } catch (error) {
            console.error('Error deleting unit:', error);
            return false;
        }
    }

    /**
     * Validate if category is in use by any products
     * @param {string} name - Category name to check
     * @returns {boolean} True if category is in use
     */
    validateCategoryUsage(name) {
        try {
            const normalizedName = this.normalizeName(name);
            const barangData = this.getExistingBarangData();
            
            return barangData.some(barang => 
                this.normalizeName(barang.kategori) === normalizedName
            );
            
        } catch (error) {
            console.error('Error validating category usage:', error);
            return true; // Err on the side of caution
        }
    }

    /**
     * Validate if unit is in use by any products
     * @param {string} name - Unit name to check
     * @returns {boolean} True if unit is in use
     */
    validateUnitUsage(name) {
        try {
            const normalizedName = this.normalizeName(name);
            const barangData = this.getExistingBarangData();
            
            return barangData.some(barang => 
                this.normalizeName(barang.satuan) === normalizedName
            );
            
        } catch (error) {
            console.error('Error validating unit usage:', error);
            return true; // Err on the side of caution
        }
    }

    /**
     * Auto-create categories and units from upload data
     * @param {Object[]} data - Upload data to analyze
     * @returns {Object} Summary of created categories and units
     */
    autoCreateFromData(data) {
        const result = {
            categoriesCreated: [],
            unitsCreated: [],
            categoriesSkipped: [],
            unitsSkipped: []
        };

        try {
            // Extract unique categories and units from data
            const categories = new Set();
            const units = new Set();

            data.forEach(row => {
                if (row.kategori) {
                    categories.add(this.normalizeName(row.kategori));
                }
                if (row.satuan) {
                    units.add(this.normalizeName(row.satuan));
                }
            });

            // Create new categories
            categories.forEach(categoryName => {
                if (this.createCategory(categoryName)) {
                    result.categoriesCreated.push(categoryName);
                } else {
                    result.categoriesSkipped.push(categoryName);
                }
            });

            // Create new units
            units.forEach(unitName => {
                if (this.createUnit(unitName)) {
                    result.unitsCreated.push(unitName);
                } else {
                    result.unitsSkipped.push(unitName);
                }
            });

            // Update usage counts
            this.updateUsageCounts();

            return result;
            
        } catch (error) {
            console.error('Error in auto-create from data:', error);
            return result;
        }
    }

    /**
     * Update usage counts for categories and units
     */
    updateUsageCounts() {
        try {
            const barangData = this.getExistingBarangData();
            const categories = this.getCategories();
            const units = this.getUnits();

            // Count category usage
            const categoryUsage = {};
            const unitUsage = {};

            barangData.forEach(barang => {
                const kategori = this.normalizeName(barang.kategori);
                const satuan = this.normalizeName(barang.satuan);

                categoryUsage[kategori] = (categoryUsage[kategori] || 0) + 1;
                unitUsage[satuan] = (unitUsage[satuan] || 0) + 1;
            });

            // Update category usage counts
            categories.forEach(category => {
                category.usage_count = categoryUsage[category.name] || 0;
            });

            // Update unit usage counts
            units.forEach(unit => {
                unit.usage_count = unitUsage[unit.name] || 0;
            });

            // Save updated data
            this.saveCategories(categories);
            this.saveUnits(units);
            
        } catch (error) {
            console.error('Error updating usage counts:', error);
        }
    }

    /**
     * Get categories that would be created from upload data
     * @param {Object[]} data - Upload data to analyze
     * @returns {string[]} Array of new category names
     */
    getNewCategoriesFromData(data) {
        const existingCategories = new Set(this.getCategories().map(c => c.name));
        const newCategories = new Set();

        data.forEach(row => {
            if (row.kategori) {
                const normalized = this.normalizeName(row.kategori);
                if (!existingCategories.has(normalized)) {
                    newCategories.add(normalized);
                }
            }
        });

        return Array.from(newCategories);
    }

    /**
     * Get units that would be created from upload data
     * @param {Object[]} data - Upload data to analyze
     * @returns {string[]} Array of new unit names
     */
    getNewUnitsFromData(data) {
        const existingUnits = new Set(this.getUnits().map(u => u.name));
        const newUnits = new Set();

        data.forEach(row => {
            if (row.satuan) {
                const normalized = this.normalizeName(row.satuan);
                if (!existingUnits.has(normalized)) {
                    newUnits.add(normalized);
                }
            }
        });

        return Array.from(newUnits);
    }

    /**
     * Normalize name (lowercase, trim, handle special characters)
     * @param {string} name - Name to normalize
     * @returns {string} Normalized name
     * @private
     */
    normalizeName(name) {
        if (!name || typeof name !== 'string') {
            return '';
        }
        
        return name.toLowerCase().trim().replace(/\s+/g, ' ');
    }

    /**
     * Save categories to localStorage
     * @param {CategoryData[]} categories - Categories to save
     * @private
     */
    saveCategories(categories) {
        try {
            localStorage.setItem(this.categoriesKey, JSON.stringify(categories));
        } catch (error) {
            console.error('Error saving categories:', error);
            throw error;
        }
    }

    /**
     * Save units to localStorage
     * @param {UnitData[]} units - Units to save
     * @private
     */
    saveUnits(units) {
        try {
            localStorage.setItem(this.unitsKey, JSON.stringify(units));
        } catch (error) {
            console.error('Error saving units:', error);
            throw error;
        }
    }

    /**
     * Get existing barang data from localStorage
     * @returns {Object[]} Existing barang data
     * @private
     */
    getExistingBarangData() {
        try {
            const data = localStorage.getItem('masterBarang');
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading existing barang data:', error);
            return [];
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CategoryUnitManager;
}