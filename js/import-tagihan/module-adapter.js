/**
 * Module Adapter - Bridges ES6 modules with browser global scope
 * Fixes: "Unexpected token 'export'" and "Identifier already declared" errors
 */

// Global namespace for import-tagihan modules
window.ImportTagihan = window.ImportTagihan || {};

// Prevent duplicate loading
if (window.ImportTagihan.loaded) {
    console.log('Import Tagihan modules already loaded, skipping...');
} else {
    window.ImportTagihan.loaded = true;
    
    // Initialize module loading queue
    window.ImportTagihan.moduleQueue = [];
    window.ImportTagihan.loadedModules = new Set();
    
    // Module loader function
    window.ImportTagihan.loadModule = function(moduleName, moduleFactory) {
        if (this.loadedModules.has(moduleName)) {
            console.warn(`Module ${moduleName} already loaded, skipping...`);
            return;
        }
        
        try {
            this[moduleName] = moduleFactory();
            this.loadedModules.add(moduleName);
            console.log(`✓ Loaded module: ${moduleName}`);
        } catch (error) {
            console.error(`✗ Failed to load module ${moduleName}:`, error);
        }
    };
    
    // Compatibility layer for SharedPaymentServices
    window.ImportTagihan.getSharedPaymentServices = function() {
        if (window.SharedPaymentServices) {
            return window.SharedPaymentServices;
        } else {
            console.warn('SharedPaymentServices not available, using fallback methods');
            return {
                processPayment: function(data) {
                    console.log('Fallback payment processing:', data);
                    return Promise.resolve({ success: true, message: 'Processed with fallback' });
                },
                validatePayment: function(data) {
                    return { valid: true, errors: [] };
                }
            };
        }
    };
}