/**
 * Debug test isolation issues
 */

// Mock localStorage exactly like in the test
let testStorageCounter = 0;

function createMockLocalStorage() {
    const storageId = ++testStorageCounter;
    return {
        data: {},
        storageId,
        getItem: function(key) {
            console.log(`[${this.storageId}] getItem(${key}):`, this.data[key] || null);
            return this.data[key] || null;
        },
        setItem: function(key, value) {
            console.log(`[${this.storageId}] setItem(${key}):`, value);
            this.data[key] = value;
        },
        clear: function() {
            console.log(`[${this.storageId}] clear() - before:`, Object.keys(this.data));
            this.data = {};
            console.log(`[${this.storageId}] clear() - after:`, Object.keys(this.data));
        }
    };
}

const mockLocalStorage = createMockLocalStorage();
global.localStorage = mockLocalStorage;

// Helper function to create fresh manager (same as test)
function createFreshManager(KategoriManager) {
    console.log('=== createFreshManager called ===');
    mockLocalStorage.clear();
    const manager = new KategoriManager();
    console.log('Manager created, loading data...');
    manager.data = manager.loadData(); // Force reload from cleared storage
    console.log('Manager data after loadData():', manager.data);
    return manager;
}

async function runTest() {
    const { KategoriManager } = await import('./js/master-barang/KategoriManager.js');
    
    console.log('=== Simulating test scenario ===');
    
    // Simulate the failing test scenario
    const invalidNames = ['', '   ', '\t\n', 'A'];
    
    invalidNames.forEach((invalidName, index) => {
        console.log(`\n--- Test iteration ${index + 1}: "${invalidName}" ---`);
        
        // Create fresh manager for each test (like in the real test)
        const kategoriManager = createFreshManager(KategoriManager);
        
        console.log('About to create kategori with invalid name...');
        const result = kategoriManager.createKategori({
            nama: invalidName,
            deskripsi: 'Test description'
        });
        
        console.log('Create result:', result);
        
        // Check categories
        const allCategories = kategoriManager.getAll();
        console.log('All categories after creation attempt:', allCategories);
        console.log('Categories count:', allCategories.length);
        
        if (allCategories.length !== 0) {
            console.log('ERROR: Expected 0 categories but got', allCategories.length);
        }
    });
}

runTest().catch(console.error);