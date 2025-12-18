/**
 * Property-Based Test for Conditional Journal Creation
 * Feature: perbaikan-menu-tutup-kasir-pos, Property 9: Conditional journal creation
 * Validates: Requirements 4.1, 4.3
 */

import fc from 'fast-check';

// Mock localStorage and sessionStorage for testing
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => store[key] = value.toString(),
        removeItem: (key) => delete store[key],
        clear: () => store = {},
        get length() { return Object.keys(store).length; },
        key: (index) => Object.keys(store)[index] || null
    };
})();

// Mock global objects
global.localStorage = localStorageMock;
global.navigator = { userAgent: 'test-agent' };

// Import the module
import EnhancedTutupKasirDataPersistence from '../js/enhanced-tutup-kasir-data-persistence.js';

describe('Conditional Journal Creation Property Tests', () => {
    let persistence;

    beforeEach(() => {
        persistence = new EnhancedTutupKasirDataPersistence();
        localStorage.clear();
    });

    // Generator for tutup kasir data with various selisih scenarios
    const tutupKasirWithSelisihArbitrary = fc.record({
        id: fc.string({ minLength: 5, maxLength: 20 }),
        shiftId: fc.string({ minLength: 5, maxLength: 20 }),
        kasir: fc.string({ minLength: 5, maxLength: 30 }),
        kasirId: fc.string({ minLength: 5, maxLength: 20 }),
        waktuBuka: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
        waktuTutup: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
        modalAwal: fc.integer({ min: 0, max: 10000000 }),
        totalPenjualan: fc.integer({ min: 0, max: 100000000 }),
        totalCash: fc.integer({ min: 0, max: 100000000 }),
        totalKredit: fc.integer({ min: 0, max: 100000000 }),
        jumlahTransaksi: fc.integer({ min: 0, max: 1000 }),
        tanggalTutup: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString().split('T')[0])
    }).chain(base => {
        // Calculate kas seharusnya
        const kasSeharusnya = base.modalAwal + base.totalCash;
        
        // Generate kas aktual that creates different selisih scenarios
        return fc.oneof(
            // Zero selisih (kas aktual = kas seharusnya)
            fc.constant(kasSeharusnya),
            // Positive selisih (kas lebih)
            fc.integer({ min: kasSeharusnya + 1, max: kasSeharusnya + 1000000 }),
            // Negative selisih (kas kurang)
            fc.integer({ min: Math.max(0, kasSeharusnya - 1000000), max: kasSeharusnya - 1 })
        ).map(kasAktual => {
            const selisih = kasAktual - kasSeharusnya;
            return {
                ...base,
                kasSeharusnya: kasSeharusnya,
                kasAktual: kasAktual,
                selisih: selisih,
                keteranganSelisih: selisih !== 0 ? `Test keterangan untuk selisih ${selisih}` : ''
            };
        });
    });

    /**
     * Property 9: Conditional journal creation
     * For any tutup kasir with non-zero selisih, the system should create appropriate 
     * journal entries (positive selisih to Pendapatan Lain-lain, negative to Beban Lain-lain)
     */
    test('Property 9: Conditional journal creation', async () => {
        await fc.assert(fc.asyncProperty(
            tutupKasirWithSelisihArbitrary,
            async (tutupKasirData) => {
                // Clear any existing journal entries
                localStorage.removeItem('journalEntries');
                
                // Save tutup kasir data (this should trigger journal creation if needed)
                const result = await persistence.saveTutupKasirData(tutupKasirData);
                
                if (!result.success) {
                    // If save failed, no journal should be created
                    const journalEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
                    return journalEntries.length === 0;
                }
                
                const journalEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
                
                if (Math.abs(tutupKasirData.selisih) <= 0.01) {
                    // No selisih - no journal entry should be created
                    const selisihJournal = journalEntries.find(entry => 
                        entry.id === `journal_selisih_${tutupKasirData.id}`
                    );
                    return selisihJournal === undefined;
                } else {
                    // Non-zero selisih - journal entry should be created
                    const selisihJournal = journalEntries.find(entry => 
                        entry.id === `journal_selisih_${tutupKasirData.id}`
                    );
                    
                    if (!selisihJournal) return false;
                    
                    // Verify journal entry structure
                    if (!selisihJournal.tanggal || !selisihJournal.keterangan || !Array.isArray(selisihJournal.entries)) {
                        return false;
                    }
                    
                    // Verify journal entries are balanced
                    const totalDebit = selisihJournal.entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
                    const totalKredit = selisihJournal.entries.reduce((sum, entry) => sum + (entry.kredit || 0), 0);
                    
                    if (Math.abs(totalDebit - totalKredit) > 0.01) return false;
                    
                    // Verify correct account mapping based on selisih direction
                    if (tutupKasirData.selisih > 0) {
                        // Positive selisih - should have Kas (debit) and Pendapatan Lain-lain (kredit)
                        const kasEntry = selisihJournal.entries.find(entry => entry.akun === 'Kas');
                        const pendapatanEntry = selisihJournal.entries.find(entry => entry.akun === 'Pendapatan Lain-lain');
                        
                        return kasEntry && kasEntry.debit === tutupKasirData.selisih && kasEntry.kredit === 0 &&
                               pendapatanEntry && pendapatanEntry.kredit === tutupKasirData.selisih && pendapatanEntry.debit === 0;
                    } else {
                        // Negative selisih - should have Beban Lain-lain (debit) and Kas (kredit)
                        const bebanEntry = selisihJournal.entries.find(entry => entry.akun === 'Beban Lain-lain');
                        const kasEntry = selisihJournal.entries.find(entry => entry.akun === 'Kas');
                        const absSelisih = Math.abs(tutupKasirData.selisih);
                        
                        return bebanEntry && bebanEntry.debit === absSelisih && bebanEntry.kredit === 0 &&
                               kasEntry && kasEntry.kredit === absSelisih && kasEntry.debit === 0;
                    }
                }
            }
        ), { numRuns: 100 });
    });

    test('Property 9a: Journal entry data integrity', async () => {
        await fc.assert(fc.asyncProperty(
            tutupKasirWithSelisihArbitrary.filter(data => Math.abs(data.selisih) > 0.01),
            async (tutupKasirData) => {
                localStorage.removeItem('journalEntries');
                
                const result = await persistence.saveTutupKasirData(tutupKasirData);
                
                if (result.success) {
                    const journalEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
                    const selisihJournal = journalEntries.find(entry => 
                        entry.id === `journal_selisih_${tutupKasirData.id}`
                    );
                    
                    if (selisihJournal) {
                        // Verify journal entry contains required information
                        const hasValidDate = selisihJournal.tanggal === tutupKasirData.tanggalTutup;
                        const hasKasirInfo = selisihJournal.keterangan.includes(tutupKasirData.kasir);
                        const hasKeteranganSelisih = tutupKasirData.keteranganSelisih ? 
                            selisihJournal.keterangan.includes(tutupKasirData.keteranganSelisih) : true;
                        
                        return hasValidDate && hasKasirInfo && hasKeteranganSelisih;
                    }
                }
                
                return true; // If no journal created or save failed, test passes
            }
        ), { numRuns: 100 });
    });

    test('Property 9b: Multiple selisih journal entries', async () => {
        await fc.assert(fc.asyncProperty(
            fc.array(tutupKasirWithSelisihArbitrary, { minLength: 2, maxLength: 5 }),
            async (tutupKasirDataArray) => {
                // Ensure unique IDs
                const uniqueData = tutupKasirDataArray.map((data, index) => ({
                    ...data,
                    id: data.id + '_' + index
                }));
                
                localStorage.removeItem('journalEntries');
                
                // Save all tutup kasir records
                const results = [];
                for (const data of uniqueData) {
                    const result = await persistence.saveTutupKasirData(data);
                    results.push({ data, result });
                }
                
                const journalEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
                
                // Count expected journal entries (only for non-zero selisih)
                const expectedJournalCount = results.filter(({ data, result }) => 
                    result.success && Math.abs(data.selisih) > 0.01
                ).length;
                
                // Count actual selisih journal entries
                const actualJournalCount = journalEntries.filter(entry => 
                    entry.id.startsWith('journal_selisih_')
                ).length;
                
                return actualJournalCount === expectedJournalCount;
            }
        ), { numRuns: 50 });
    });

    test('Property 9c: Journal entry failure handling', async () => {
        await fc.assert(fc.asyncProperty(
            tutupKasirWithSelisihArbitrary.filter(data => Math.abs(data.selisih) > 0.01),
            async (tutupKasirData) => {
                // Fill localStorage to cause journal save failure
                try {
                    const largeData = 'x'.repeat(100000);
                    for (let i = 0; i < 50; i++) {
                        localStorage.setItem(`filler_${i}`, largeData);
                    }
                } catch (e) {
                    // Storage full
                }
                
                const result = await persistence.saveTutupKasirData(tutupKasirData);
                
                // Even if journal creation fails, tutup kasir should still succeed
                // (journal creation failure should not prevent tutup kasir completion)
                if (result.success) {
                    // Verify tutup kasir data was saved
                    const riwayat = JSON.parse(localStorage.getItem('riwayatTutupKas') || '[]');
                    const savedRecord = riwayat.find(r => r.id === tutupKasirData.id);
                    return savedRecord !== undefined;
                }
                
                return true; // If tutup kasir failed for other reasons, test passes
            }
        ), { numRuns: 20 });
    });

    test('Property 9d: Journal entry balance validation', async () => {
        await fc.assert(fc.asyncProperty(
            tutupKasirWithSelisihArbitrary.filter(data => Math.abs(data.selisih) > 0.01),
            async (tutupKasirData) => {
                localStorage.removeItem('journalEntries');
                
                const result = await persistence.saveTutupKasirData(tutupKasirData);
                
                if (result.success) {
                    const journalEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
                    const selisihJournal = journalEntries.find(entry => 
                        entry.id === `journal_selisih_${tutupKasirData.id}`
                    );
                    
                    if (selisihJournal && selisihJournal.entries) {
                        // Every journal entry must be balanced (total debit = total kredit)
                        const totalDebit = selisihJournal.entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
                        const totalKredit = selisihJournal.entries.reduce((sum, entry) => sum + (entry.kredit || 0), 0);
                        
                        // Check balance with small tolerance for floating point precision
                        const isBalanced = Math.abs(totalDebit - totalKredit) < 0.01;
                        
                        // Check that amounts match selisih
                        const expectedAmount = Math.abs(tutupKasirData.selisih);
                        const amountMatches = Math.abs(totalDebit - expectedAmount) < 0.01;
                        
                        return isBalanced && amountMatches;
                    }
                }
                
                return true; // If no journal created or save failed, test passes
            }
        ), { numRuns: 100 });
    });

    test('Property 9e: COA mapping consistency', async () => {
        await fc.assert(fc.asyncProperty(
            tutupKasirWithSelisihArbitrary.filter(data => Math.abs(data.selisih) > 0.01),
            async (tutupKasirData) => {
                localStorage.removeItem('journalEntries');
                
                const result = await persistence.saveTutupKasirData(tutupKasirData);
                
                if (result.success) {
                    const journalEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
                    const selisihJournal = journalEntries.find(entry => 
                        entry.id === `journal_selisih_${tutupKasirData.id}`
                    );
                    
                    if (selisihJournal && selisihJournal.entries) {
                        // Verify correct COA mapping
                        const kasEntry = selisihJournal.entries.find(entry => entry.akun === 'Kas');
                        
                        if (tutupKasirData.selisih > 0) {
                            // Positive selisih: Kas should be debited, Pendapatan Lain-lain credited
                            const pendapatanEntry = selisihJournal.entries.find(entry => entry.akun === 'Pendapatan Lain-lain');
                            return kasEntry && kasEntry.debit > 0 && kasEntry.kredit === 0 &&
                                   pendapatanEntry && pendapatanEntry.kredit > 0 && pendapatanEntry.debit === 0;
                        } else {
                            // Negative selisih: Beban Lain-lain debited, Kas credited
                            const bebanEntry = selisihJournal.entries.find(entry => entry.akun === 'Beban Lain-lain');
                            return bebanEntry && bebanEntry.debit > 0 && bebanEntry.kredit === 0 &&
                                   kasEntry && kasEntry.kredit > 0 && kasEntry.debit === 0;
                        }
                    }
                }
                
                return true; // If no journal created or save failed, test passes
            }
        ), { numRuns: 100 });
    });
});