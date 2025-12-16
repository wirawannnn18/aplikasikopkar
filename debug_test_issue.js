/**
 * Debug the test issue
 */

import { KategoriManager } from './js/master-barang/KategoriManager.js';

// Mock localStorage
const mockLocalStorage = {
    data: {},
    getItem: function(key) {
        console.log(`localStorage.getItem(${key}) -> ${this.data[key] || null}`);
        return this.data[key] || null;
    },
    setItem: function(key, value) {
        console.log(`localStorage.setItem(${key}, ${value})`);
        this.data[key] = value;
    },
    clear: function() {
        console.log('localStorage.clear()');
        this.data = {};
    }
};

global.localStorage = mockLocalStorage;

console.log('=== Test Issue Debug ===');

// Test 1: Create manager and add category
console.log('\n--- Test 1: Create manager and add category ---');
const manager = new KategoriManager();
console.log('Initial manager.data:', manager.data);

const result1 = manager.createKategori({
    nama: "Electronics",
    deskripsi: "Electronic items"
});
console.log('Create result:', result1.success);
console.log('Manager data after create:', manager.data.length);

// Test 2: Clear localStorage and check manager data
console.log('\n--- Test 2: Clear localStorage and check manager data ---');
mockLocalStorage.clear();
console.log('After localStorage.clear(), manager.data:', manager.data.length);

// Test 3: Force reload data
console.log('\n--- Test 3: Force reload data ---');
manager.data = manager.loadData();
console.log('After manager.loadData(), manager.data:', manager.data.length);

// Test 4: Try to create same category again
console.log('\n--- Test 4: Try to create same category again ---');
const result2 = manager.createKategori({
    nama: "Electronics",
    deskripsi: "Electronic items"
});
console.log('Create result:', result2.success);
console.log('Manager data after second create:', manager.data.length);

// Test 5: Clear data array directly
console.log('\n--- Test 5: Clear data array directly ---');
manager.data = [];
console.log('After manager.data = [], manager.data:', manager.data.length);

const result3 = manager.createKategori({
    nama: "Electronics",
    deskripsi: "Electronic items"
});
console.log('Create result:', result3.success);
console.log('Manager data after third create:', manager.data.length);