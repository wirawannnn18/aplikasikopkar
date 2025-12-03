/**
 * Audit Utilities
 * Provides core utility functions for audit and repair system
 */

class AuditUtils {
    /**
     * Generate unique ID for audit records
     */
    static generateId(prefix = 'AUD') {
        const timestamp = new Date().getTime();
        const random = Math.floor(Math.random() * 1000);
        return `${prefix}-${timestamp}-${random}`;
    }

    /**
     * Format date for audit logs
     */
    static formatDate(date = new Date()) {
        return date.toISOString();
    }

    /**
     * Parse date from ISO string
     */
    static parseDate(dateString) {
        return new Date(dateString);
    }

    /**
     * Calculate percentage
     */
    static calculatePercentage(completed, total) {
        if (total === 0) return 0;
        return Math.round((completed / total) * 100 * 100) / 100;
    }

    /**
     * Deep clone object
     */
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Compare two objects for equality
     */
    static isEqual(obj1, obj2) {
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    }

    /**
     * Safe JSON parse with error handling
     */
    static safeJsonParse(jsonString, defaultValue = null) {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('JSON parse error:', error);
            return defaultValue;
        }
    }

    /**
     * Safe JSON stringify
     */
    static safeJsonStringify(obj, defaultValue = '{}') {
        try {
            return JSON.stringify(obj);
        } catch (error) {
            console.error('JSON stringify error:', error);
            return defaultValue;
        }
    }

    /**
     * Get current user info
     */
    static getCurrentUser() {
        const userStr = localStorage.getItem('currentUser');
        return this.safeJsonParse(userStr, { username: 'system', role: 'system' });
    }

    /**
     * Format number as currency (IDR)
     */
    static formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    /**
     * Sanitize string for HTML display
     */
    static sanitizeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Truncate string with ellipsis
     */
    static truncate(str, maxLength = 50) {
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength - 3) + '...';
    }

    /**
     * Group array by key
     */
    static groupBy(array, key) {
        return array.reduce((result, item) => {
            const group = item[key];
            if (!result[group]) {
                result[group] = [];
            }
            result[group].push(item);
            return result;
        }, {});
    }

    /**
     * Sort array by key
     */
    static sortBy(array, key, ascending = true) {
        return array.sort((a, b) => {
            const aVal = a[key];
            const bVal = b[key];
            if (aVal < bVal) return ascending ? -1 : 1;
            if (aVal > bVal) return ascending ? 1 : -1;
            return 0;
        });
    }

    /**
     * Filter array by predicate
     */
    static filterBy(array, predicate) {
        return array.filter(predicate);
    }

    /**
     * Check if value is empty
     */
    static isEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim() === '';
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    }

    /**
     * Debounce function
     */
    static debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * Throttle function
     */
    static throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Retry function with exponential backoff
     */
    static async retry(func, maxRetries = 3, delay = 1000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await func();
            } catch (error) {
                if (i === maxRetries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
            }
        }
    }

    /**
     * Measure execution time
     */
    static async measureTime(func, label = 'Operation') {
        const start = performance.now();
        const result = await func();
        const end = performance.now();
        console.log(`${label} took ${(end - start).toFixed(2)}ms`);
        return result;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuditUtils;
}
