/**
 * Debug the specific failing test
 */

import { KategoriManager } from './js/master-barang/KategoriManager.js';

// Mock localStorage exactly like in the test
let testStorageCounter = 0;

function createMockLocalStorage() {
    const storageId = ++testStorageCounter;
    return {
        data: {},
        storageId,
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
}

// Setup global localStorage mock
const mockLocalStorage = createMockLocalStorage();
global.localStorage = mockLocalStorage;

console.log('=== Debug Specific Test ===');

// Simulate the exact beforeEach setup
console.log('\n--- beforeEach setup ---');
mockLocalStorage.clear();
let kategoriManager = new KategoriManager();
kategoriManager.data = [];

console.log('After beforeEach setup:');
console.log('- mockLocalStorage.data:', mockLocalStorage.data);
console.log('- kategoriManager.data:', kategoriManager.data);

// Simulate the failing test
console.log('\n--- Test: should prevent duplicate category names ---');

// Create first category
console.log('\n1. Creating first category...');
const firstResult = kategoriManager.createKategori({
    nama: "Test Category",
    deskripsi: "First description"
});

console.log('First result:', firstResult);
console.log('Manager data after first create:', kategoriManager.data.length);

if (!firstResult.success) {
    console.log('FIRST CREATION FAILED!');
    console.log('Errors:', firstResult.errors);
    console.log('Current data in manager:', kategoriManager.data);
    console.log('Current localStorage data:', mockLocalStorage.data);
    
    // Check if there's existing data
    const existingData = kategoriManager.loadData();
    console.log('Data from loadData():', existingData);
    
    // Check uniqueness validation
    const exists = kategoriManager.existsByNama("Test Category");
    console.log('existsByNama("Test Category"):', exists);
}

// Attempt to create duplicate
console.log('\n2. Creating duplicate category...');
const duplicateResult = kategoriManager.createKategori({
    nama: "Test Category",
    deskripsi: "Duplicate description"
});

console.log('Duplicate result:', duplicateResult);
console.log('Manager data after duplicate attempt:', kategoriManager.data.length);