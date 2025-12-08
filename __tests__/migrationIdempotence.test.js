/**
 * Property-Based Test: Migration Idempotence
 * Feature: fix-status-anggota-keluar, Property 5: Migration idempotence
 * Validates: Requirements 1.4, 2.5
 * 
 * Property: For any number of times migration is run, running it again should result in zero changes
 */

import fc from 'fast-check';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();

global.localStorage = localStorageMock;

// Mock console.log to reduce noise during tests
const originalConsoleLog = console.log;
beforeAll(() => {
    console.log = () => {}; // Silent mock
});

afterAll(() => {
    console.log = originalConsoleLog;
});

// Import the migration function
// Since we're testing the function directly, we need to load it
const migrationCode = fs.readFileSync(path.join(__dirname, '../js/dataMigration.js'), 'utf8');

// Create a function wrapper to execute the migration code
const createMigrationFunction = () => {
    const func = new Function(migrationCode + '\nreturn migrateAnggotaKeluarStatus;');
    return func();
};

const migrateAnggotaKeluarStatus = createMigrationFunction();

describe('Property 5: Migration Idempotence', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('For any anggota list with mixed status, running migration twice should result in zero changes on second run', () => {
        fc.assert(
            fc.property(
                // Generate array of anggota with various inconsistent states
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        nik: fc.stringOf(fc.integer(0, 9).map(n => n.toString()), { minLength: 16, maxLength: 16 }),
                        nama: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
                        status: fc.constantFrom('Aktif', 'Nonaktif', 'Cuti'),
                        // Randomly add fields that should trigger migration
                        tanggalKeluar: fc.option(fc.constant('2024-12-01'), { nil: null }),
                        pengembalianStatus: fc.option(fc.constantFrom('Pending', 'Selesai'), { nil: null }),
                        statusKeanggotaan: fc.option(fc.constantFrom('Keluar', 'Aktif'), { nil: null }),
                        departemen: fc.constantFrom('IT', 'Finance', 'HR'),
                        tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota', 'Umum')
                    }),
                    { minLength: 1, maxLength: 20 }
                ),
                (anggotaList) => {
                    // Setup: Store initial data
                    localStorage.setItem('anggota', JSON.stringify(anggotaList));
                    
                    // Execute: Run migration first time
                    const result1 = migrateAnggotaKeluarStatus();
                    
                    // Get data after first migration
                    const dataAfterFirst = localStorage.getItem('anggota');
                    
                    // Execute: Run migration second time
                    const result2 = migrateAnggotaKeluarStatus();
                    
                    // Get data after second migration
                    const dataAfterSecond = localStorage.getItem('anggota');
                    
                    // Assertion 1: Both migrations should succeed
                    const bothSucceeded = result1.success && result2.success;
                    
                    // Assertion 2: Second run should fix zero records (idempotent)
                    const secondRunFixedZero = result2.fixed === 0;
                    
                    // Assertion 3: Data should be identical after both runs
                    const dataUnchanged = dataAfterFirst === dataAfterSecond;
                    
                    // Assertion 4: If first run fixed something, second run should fix nothing
                    const idempotentBehavior = result1.fixed > 0 ? result2.fixed === 0 : true;
                    
                    return bothSucceeded && secondRunFixedZero && dataUnchanged && idempotentBehavior;
                }
            ),
            { numRuns: 100 } // Run 100 iterations as specified in design
        );
    });

    test('For any anggota with tanggalKeluar, migration should be idempotent', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        nik: fc.stringOf(fc.integer(0, 9).map(n => n.toString()), { minLength: 16, maxLength: 16 }),
                        nama: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
                        status: fc.constantFrom('Aktif', 'Nonaktif'), // Mix of correct and incorrect
                        tanggalKeluar: fc.constant('2024-12-01'), // All have tanggalKeluar
                        departemen: fc.constantFrom('IT', 'Finance', 'HR'),
                        tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota', 'Umum')
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (anggotaList) => {
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify(anggotaList));
                    
                    // First migration
                    const result1 = migrateAnggotaKeluarStatus();
                    const anggotaAfterFirst = JSON.parse(localStorage.getItem('anggota'));
                    
                    // Second migration
                    const result2 = migrateAnggotaKeluarStatus();
                    const anggotaAfterSecond = JSON.parse(localStorage.getItem('anggota'));
                    
                    // All anggota should have status 'Nonaktif' after first run
                    const allNonaktifAfterFirst = anggotaAfterFirst.every(a => a.status === 'Nonaktif');
                    
                    // Second run should fix nothing
                    const secondRunFixedNothing = result2.fixed === 0;
                    
                    // Data should be identical
                    const dataIdentical = JSON.stringify(anggotaAfterFirst) === JSON.stringify(anggotaAfterSecond);
                    
                    return allNonaktifAfterFirst && secondRunFixedNothing && dataIdentical;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any anggota with legacy statusKeanggotaan, migration should be idempotent', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        nik: fc.stringOf(fc.integer(0, 9).map(n => n.toString()), { minLength: 16, maxLength: 16 }),
                        nama: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
                        status: fc.constantFrom('Aktif', 'Nonaktif'),
                        statusKeanggotaan: fc.constant('Keluar'), // All have legacy field
                        departemen: fc.constantFrom('IT', 'Finance', 'HR'),
                        tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota', 'Umum')
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (anggotaList) => {
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify(anggotaList));
                    
                    // First migration
                    const result1 = migrateAnggotaKeluarStatus();
                    const anggotaAfterFirst = JSON.parse(localStorage.getItem('anggota'));
                    
                    // Second migration
                    const result2 = migrateAnggotaKeluarStatus();
                    const anggotaAfterSecond = JSON.parse(localStorage.getItem('anggota'));
                    
                    // After first run: all should have status 'Nonaktif' and no statusKeanggotaan field
                    const allFixed = anggotaAfterFirst.every(a => 
                        a.status === 'Nonaktif' && !a.hasOwnProperty('statusKeanggotaan')
                    );
                    
                    // Second run should fix nothing
                    const secondRunFixedNothing = result2.fixed === 0;
                    
                    // Data should be identical
                    const dataIdentical = JSON.stringify(anggotaAfterFirst) === JSON.stringify(anggotaAfterSecond);
                    
                    return allFixed && secondRunFixedNothing && dataIdentical;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Migration should be idempotent even when run multiple times (3+ runs)', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        nik: fc.stringOf(fc.integer(0, 9).map(n => n.toString()), { minLength: 16, maxLength: 16 }),
                        nama: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
                        status: fc.constantFrom('Aktif', 'Nonaktif', 'Cuti'),
                        tanggalKeluar: fc.option(fc.constant('2024-12-01'), { nil: null }),
                        statusKeanggotaan: fc.option(fc.constant('Keluar'), { nil: null }),
                        departemen: fc.constantFrom('IT', 'Finance', 'HR'),
                        tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota', 'Umum')
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                fc.integer({ min: 3, max: 5 }), // Number of times to run migration
                (anggotaList, numRuns) => {
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify(anggotaList));
                    
                    const results = [];
                    const snapshots = [];
                    
                    // Run migration multiple times
                    for (let i = 0; i < numRuns; i++) {
                        const result = migrateAnggotaKeluarStatus();
                        results.push(result);
                        snapshots.push(localStorage.getItem('anggota'));
                    }
                    
                    // First run might fix something
                    const firstRunMayFix = results[0].success;
                    
                    // All subsequent runs should fix nothing
                    const subsequentRunsFixNothing = results.slice(1).every(r => r.fixed === 0);
                    
                    // All snapshots after first run should be identical
                    const allSnapshotsIdentical = snapshots.slice(1).every(s => s === snapshots[1]);
                    
                    return firstRunMayFix && subsequentRunsFixNothing && allSnapshotsIdentical;
                }
            ),
            { numRuns: 50 } // Fewer runs since we're testing multiple migrations per property
        );
    });

    test('Empty anggota list should remain empty after multiple migrations', () => {
        fc.assert(
            fc.property(
                fc.constant([]), // Empty array
                (emptyList) => {
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify(emptyList));
                    
                    // Run migration twice
                    const result1 = migrateAnggotaKeluarStatus();
                    const result2 = migrateAnggotaKeluarStatus();
                    
                    const anggotaAfter = JSON.parse(localStorage.getItem('anggota'));
                    
                    // Both should succeed with zero fixes
                    const bothSucceeded = result1.success && result2.success;
                    const bothFixedZero = result1.fixed === 0 && result2.fixed === 0;
                    const stillEmpty = anggotaAfter.length === 0;
                    
                    return bothSucceeded && bothFixedZero && stillEmpty;
                }
            ),
            { numRuns: 10 }
        );
    });

    test('Anggota with correct status should remain unchanged after multiple migrations', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        nik: fc.stringOf(fc.integer(0, 9).map(n => n.toString()), { minLength: 16, maxLength: 16 }),
                        nama: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length > 0),
                        status: fc.constant('Aktif'), // All have correct status
                        // No tanggalKeluar, no pengembalianStatus, no statusKeanggotaan
                        departemen: fc.constantFrom('IT', 'Finance', 'HR'),
                        tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota', 'Umum')
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (anggotaList) => {
                    // Setup
                    const originalData = JSON.stringify(anggotaList);
                    localStorage.setItem('anggota', originalData);
                    
                    // Run migration twice
                    const result1 = migrateAnggotaKeluarStatus();
                    const result2 = migrateAnggotaKeluarStatus();
                    
                    const dataAfter = localStorage.getItem('anggota');
                    
                    // Both should fix nothing (data already correct)
                    const bothFixedZero = result1.fixed === 0 && result2.fixed === 0;
                    
                    // Data should be unchanged
                    const dataUnchanged = originalData === dataAfter;
                    
                    return bothFixedZero && dataUnchanged;
                }
            ),
            { numRuns: 100 }
        );
    });
});
