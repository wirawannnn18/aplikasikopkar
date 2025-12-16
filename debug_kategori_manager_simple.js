/**
 * Simple debug test for KategoriManager
 */

import { KategoriManager } from './js/master-barang/KategoriManager.js';

// Mock localStorage
const mockLocalStorage = {
    data: {},
    getItem: function(key) {
        return this.data[key] || null;
    },
    setItem: function(key, value) {
        this.data[key] = value;
    },
    clear: function() {
        this.data = {};
    }
};

global.localStorage = mockLocalStorage;

// Test basic functionality
console.log('=== Testing KategoriManager ===');

const manager = new KategoriManager();
console.log('Manager created, initial data:', manager.data);

// Test creating a simple category
console.log('\n--- Test 1: Create simple category ---');
const result1 = manager.createKategori({
    nama: "Electronics",
    deskripsi: "Electronic items"
});

console.log('Create result:', result1);
console.log('Manager data after create:', manager.data);

// Test validation directly
console.log('\n--- Test 2: Test validation directly ---');
const validation = manager.validate({
    nama: "Electronics",
    deskripsi: "Electronic items"
});

console.log('Validation result:', validation);

// Test existsByNama
console.log('\n--- Test 3: Test existsByNama ---');
console.log('existsByNama("Electronics"):', manager.existsByNama("Electronics"));
console.log('existsByNama("electronics"):', manager.existsByNama("electronics"));
console.log('existsByNama("Food"):', manager.existsByNama("Food"));