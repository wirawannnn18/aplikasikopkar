/**
 * Debug the specific test failure
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
            console.log(`[${this.storageId}] localStorage.getItem(${key}) -> ${this.data[key] || null}`);
            return this.data[key] || null;
        },
        setItem: function(key, value) {
            console.log(`[${this.storageId}] localStorage.setItem(${key}, ${value})`);
            this.data[key] = value;
        },
        clear: function() {
            console.log(`[${this.storageId}] localStorage.clear()`);
            this.data = {};
        }
    };
}

// Setup global localStorage mock
const mockLocalStorage = createMockLocalStorage();
global.localStorage = mockLocalStorage;

// Helper function to clear manager data
function clearManagerData(manager) {
    mockLocalStorage.clear();
    manager.data = manager.loadData(); // Force reload from cleared storage
}

// Helper function to create fresh manager
function createFreshManager() {
    mockLocalStorage.clear();
    const manager = new KategoriManager();
    manager.data = manager.loadData(); // Force reload from cleared storage
    return manager;
}

console.log('=== Debug Test Failure ===');

// Simulate the exact test scenario
console.log('\n--- Test: Basic functionality test - should prevent duplicate category names ---');

let kategoriManager = createFreshManager();
console.log('Initial manager data length:', kategoriManager.data.length);

clearManagerData(kategoriManager);
console.log('After clearManagerData, manager data length:', kategoriManager.data.length);

// Create first category
console.log('\n--- Creating first category ---');
const firstResult = kategoriManager.createKategori({
    nama: "Test Category",
    deskripsi: "First description"
});

console.log('First result:', firstResult);
console.log('Manager data length after first create:', kategoriManager.data.length);

// Attempt to create duplicate
console.log('\n--- Creating duplicate category ---');
const duplicateResult = kategoriManager.createKategori({
    nama: "Test Category",
    deskripsi: "Duplicate description"
});

console.log('Duplicate result:', duplicateResult);
console.log('Manager data length after duplicate attempt:', kategoriManager.data.length);

// Test the property test scenario
console.log('\n--- Test: Property test scenario ---');
clearManagerData(kategoriManager);

const categoryName = "Electronics";
const description = "";

console.log(`Testing with categoryName: "${categoryName}", description: "${description}"`);

const propFirstResult = kategoriManager.createKategori({
    nama: categoryName,
    deskripsi: description
});

console.log('Property test first result:', propFirstResult);
console.log('Manager data after property test create:', kategoriManager.data.length);