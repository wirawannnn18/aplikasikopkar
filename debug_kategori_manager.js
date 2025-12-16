/**
 * Debug script to test KategoriManager functionality
 */

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

const mockLocalStorage = createMockLocalStorage();
global.localStorage = mockLocalStorage;

// Helper function to create fresh manager (same as test)
function createFreshManager(KategoriManager) {
    mockLocalStorage.clear();
    const manager = new KategoriManager();
    manager.data = manager.loadData(); // Force reload from cleared storage
    return manager;
}

async function runTest() {
    const { KategoriManager } = await import('./js/master-barang/KategoriManager.js');
    
    console.log('=== Test 1: Simple creation ===');
    let kategoriManager = createFreshManager(KategoriManager);
    console.log('Initial data:', kategoriManager.data);
    console.log('Initial localStorage:', mockLocalStorage.data);

    const result1 = kategoriManager.createKategori({
        nama: "Test Category",
        deskripsi: "Test description"
    });

    console.log('Create result:', result1);
    console.log('Data after creation:', kategoriManager.data);
    console.log('localStorage after creation:', mockLocalStorage.data);

    console.log('\n=== Test 2: Fresh manager ===');
    kategoriManager = createFreshManager(KategoriManager);
    console.log('Fresh manager data:', kategoriManager.data);
    console.log('Fresh localStorage:', mockLocalStorage.data);

    const result2 = kategoriManager.createKategori({
        nama: "Electronics",
        deskripsi: ""
    });

    console.log('Electronics create result:', result2);
    
    console.log('\n=== Test 3: Test with undefined deskripsi ===');
    kategoriManager = createFreshManager(KategoriManager);
    
    const result3 = kategoriManager.createKategori({
        nama: "Books"
        // deskripsi is undefined
    });

    console.log('Books create result (undefined deskripsi):', result3);
    
    console.log('\n=== Test 4: Test validation edge cases ===');
    kategoriManager = createFreshManager(KategoriManager);
    
    // Test various edge cases that might be causing issues
    const testCases = [
        { nama: "", deskripsi: "" },
        { nama: "A", deskripsi: "" },
        { nama: "AB", deskripsi: "" },
        { nama: "Electronics", deskripsi: "" },
        { nama: "Electronics" }, // undefined deskripsi
    ];
    
    testCases.forEach((testCase, index) => {
        const validation = kategoriManager.validate(testCase);
        console.log(`Test case ${index + 1}:`, testCase, '-> Valid:', validation.isValid, 'Errors:', validation.errors);
    });
}

runTest().catch(console.error);