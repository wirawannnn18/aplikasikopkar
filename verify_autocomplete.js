// Simple verification script for autocomplete functionality
// This simulates the Property 18 test without requiring full Jest setup

// Mock localStorage
const mockLocalStorage = {
    data: {},
    getItem: function(key) { return this.data[key] || null; },
    setItem: function(key, value) { this.data[key] = value; }
};

// Mock global functions
function filterTransactableAnggota() {
    const anggota = JSON.parse(mockLocalStorage.getItem('anggota') || '[]');
    return anggota.filter(a => a.status === 'Aktif' && a.statusKeanggotaan !== 'Keluar');
}

// Copy the searchAnggota function from the main module
function searchAnggota(query) {
    try {
        const anggotaList = JSON.parse(mockLocalStorage.getItem('anggota') || '[]');
        const searchLower = query.toLowerCase();
        
        // Filter to only transactable anggota (Aktif status AND not Keluar)
        const transactableAnggota = filterTransactableAnggota();
        
        // Search within transactable anggota
        const results = transactableAnggota.filter(anggota => {
            const nikMatch = (anggota.nik || '').toLowerCase().includes(searchLower);
            const namaMatch = (anggota.nama || '').toLowerCase().includes(searchLower);
            
            return nikMatch || namaMatch;
        });
        
        // Limit to 10 results
        return results.slice(0, 10);
    } catch (error) {
        console.error('Error searching anggota:', error);
        return [];
    }
}

// Test Property 18: Autocomplete matching
function testAutocompleteMatching() {
    console.log('=== Testing Property 18: Autocomplete matching ===\n');
    
    // Test data
    const testAnggota = [
        { id: 'A001', nama: 'Ahmad Budi', nik: '001', status: 'Aktif', statusKeanggotaan: 'Aktif' },
        { id: 'A002', nama: 'Budi Santoso', nik: '002', status: 'Aktif', statusKeanggotaan: 'Aktif' },
        { id: 'A003', nama: 'Citra Dewi', nik: '003', status: 'Aktif', statusKeanggotaan: 'Aktif' },
        { id: 'A004', nama: 'Dewi Sari', nik: '004', status: 'Aktif', statusKeanggotaan: 'Aktif' },
        { id: 'A005', nama: 'Eko Prasetyo', nik: '005', status: 'Aktif', statusKeanggotaan: 'Aktif' },
        { id: 'A006', nama: 'Fajar Ahmad', nik: '006', status: 'Nonaktif', statusKeanggotaan: 'Aktif' },
        { id: 'A007', nama: 'Gita Sari', nik: '007', status: 'Aktif', statusKeanggotaan: 'Keluar' },
        { id: 'A008', nama: 'Hadi Budi', nik: '008', status: 'Aktif', statusKeanggotaan: 'Aktif' },
        { id: 'A009', nama: 'Indra Citra', nik: '009', status: 'Aktif', statusKeanggotaan: 'Aktif' },
        { id: 'A010', nama: 'Joko Dewi', nik: '010', status: 'Aktif', statusKeanggotaan: 'Aktif' }
    ];

    // Setup test data
    mockLocalStorage.setItem('anggota', JSON.stringify(testAnggota));

    let allTestsPassed = true;
    let testCount = 0;
    let passedCount = 0;

    // Test cases
    const testCases = [
        {
            name: 'Search by name "budi"',
            query: 'budi',
            expectedMatches: ['Ahmad Budi', 'Budi Santoso', 'Hadi Budi']
        },
        {
            name: 'Search by NIK "00"',
            query: '00',
            expectedCount: 8 // All active members with NIK containing "00"
        },
        {
            name: 'Search case insensitive "AHMAD"',
            query: 'AHMAD',
            expectedMatches: ['Ahmad Budi'] // Fajar Ahmad is Nonaktif, should be excluded
        },
        {
            name: 'Search with no results "xyz"',
            query: 'xyz',
            expectedCount: 0
        },
        {
            name: 'Empty search query',
            query: '',
            expectedCount: 0
        }
    ];

    testCases.forEach((testCase) => {
        testCount++;
        console.log(`Test: ${testCase.name}`);
        console.log(`Query: "${testCase.query}"`);
        
        const results = searchAnggota(testCase.query);
        console.log(`Results: ${results.length} items`);
        console.log(`Result names: ${results.map(r => r.nama).join(', ')}`);
        
        let testPassed = true;
        let errors = [];

        // Property: All results should match the search query (if not empty)
        if (testCase.query) {
            const allMatch = results.every(a => 
                a.nama.toLowerCase().includes(testCase.query.toLowerCase()) ||
                a.nik.toLowerCase().includes(testCase.query.toLowerCase())
            );
            if (!allMatch) {
                testPassed = false;
                errors.push('Some results do not match the search query');
            }
        }

        // Property: Only active, non-keluar members should be returned
        const invalidResults = results.filter(r => r.status !== 'Aktif' || r.statusKeanggotaan === 'Keluar');
        if (invalidResults.length > 0) {
            testPassed = false;
            errors.push(`Found invalid results: ${invalidResults.map(r => r.nama).join(', ')}`);
        }

        // Property: Results should be limited to 10
        if (results.length > 10) {
            testPassed = false;
            errors.push(`Too many results: ${results.length} (max 10)`);
        }

        // Check expected matches if provided
        if (testCase.expectedMatches) {
            const resultNames = results.map(r => r.nama);
            const missingMatches = testCase.expectedMatches.filter(name => !resultNames.includes(name));
            if (missingMatches.length > 0) {
                testPassed = false;
                errors.push(`Missing expected matches: ${missingMatches.join(', ')}`);
            }
        }

        // Check expected count if provided
        if (testCase.expectedCount !== undefined && results.length !== testCase.expectedCount) {
            testPassed = false;
            errors.push(`Expected ${testCase.expectedCount} results, got ${results.length}`);
        }

        if (testPassed) {
            passedCount++;
            console.log('✅ PASS');
        } else {
            allTestsPassed = false;
            console.log('❌ FAIL');
            errors.forEach(error => console.log(`   Error: ${error}`));
        }
        console.log('');
    });

    // Property-based test simulation
    console.log('=== Property-Based Test Simulation ===');
    const queries = ['ah', 'bu', 'ci', '00', 'de'];
    let propertyTestsPassed = 0;
    
    queries.forEach(query => {
        const results = searchAnggota(query);
        
        // Property: All results must match the query
        const allMatch = results.every(a => 
            a.nama.toLowerCase().includes(query.toLowerCase()) ||
            a.nik.toLowerCase().includes(query.toLowerCase())
        );
        
        // Property: All results must be active and not keluar
        const allValid = results.every(a => a.status === 'Aktif' && a.statusKeanggotaan !== 'Keluar');
        
        // Property: Results must be limited to 10
        const withinLimit = results.length <= 10;
        
        if (allMatch && allValid && withinLimit) {
            propertyTestsPassed++;
            console.log(`✅ Query "${query}": ${results.length} results - PASS`);
        } else {
            console.log(`❌ Query "${query}": ${results.length} results - FAIL`);
            if (!allMatch) console.log('   - Not all results match query');
            if (!allValid) console.log('   - Found invalid results');
            if (!withinLimit) console.log('   - Too many results');
        }
    });

    console.log('\n=== FINAL RESULTS ===');
    console.log(`Unit Tests: ${passedCount}/${testCount} passed`);
    console.log(`Property Tests: ${propertyTestsPassed}/${queries.length} passed`);
    console.log(`Overall: ${allTestsPassed && propertyTestsPassed === queries.length ? 'PASS' : 'FAIL'}`);
    console.log(`Property 18 (Autocomplete matching): ${allTestsPassed && propertyTestsPassed === queries.length ? 'VALIDATED ✅' : 'FAILED ❌'}`);
    
    return allTestsPassed && propertyTestsPassed === queries.length;
}

// Run the test
const result = testAutocompleteMatching();
process.exit(result ? 0 : 1);