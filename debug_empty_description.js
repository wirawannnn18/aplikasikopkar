/**
 * Debug empty description issue
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

console.log('=== Debug Empty Description Issue ===');

const manager = new KategoriManager();

// Test with empty description
console.log('\n--- Test with empty description ---');
const result1 = manager.createKategori({
    nama: "Electronics",
    deskripsi: ""
});

console.log('Result with empty description:', result1);

// Test validation directly
console.log('\n--- Test validation directly ---');
const validation = manager.validate({
    nama: "Electronics",
    deskripsi: ""
});

console.log('Validation result:', validation);

// Test with undefined description
console.log('\n--- Test with undefined description ---');
mockLocalStorage.clear();
manager.data = manager.loadData();

const result2 = manager.createKategori({
    nama: "Electronics"
    // no deskripsi field
});

console.log('Result with undefined description:', result2);