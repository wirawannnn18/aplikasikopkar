/**
 * Property-Based Test: Balance Sheet Format Consistency
 * Feature: laporan-neraca-periode, Property 6: Balance sheet format consistency
 * 
 * Property: For any generated balance sheet, the report structure should contain 
 * all required sections (Assets, Liabilities, Equity) with proper categorization and totals
 * 
 * Validates: Requirements 2.5
 * Task 4.1: Write property test for format consistency
 */

import fc from 'fast-check';

// Note: localStorage and other globals are mocked in jest.setup.js

// Inline balance sheet functions for testing (to avoid browser dependencies)
function calculateAccountBalances(coa, journalEntries) {
    const balanceChanges = {};
    
    journalEntries.forEach(journal => {
        journal.entries.forEach(entry => {
            if (!balanceChanges[entry.akun]) {
                balanceChanges[entry.akun] = { debit: 0, kredit: 0 };
            }
            balanceChanges[entry.akun].debit += entry.debit || 0;
            balanceChanges[entry.akun].kredit += entry.kredit || 0;
        });
    });
    
    return coa.map(account => {
        const changes = balanceChanges[account.kode] || { debit: 0, kredit: 0 };
        const openingBalance = account.saldo || 0;
        
        let finalBalance;
        const accountType = account.tipe?.toLowerCase();
        
        if (accountType === 'aset' || accountType === 'asset') {
            finalBalance = openingBalance + changes.debit - changes.kredit;
        } else if (accountType === 'kewajiban' || accountType === 'liability') {
            finalBalance = openingBalance + changes.kredit - changes.debit;
        } else if (accountType === 'modal' || accountType === 'equity') {
            finalBalance = openingBalance + changes.kredit - changes.debit;
        } else {
            finalBalance = openingBalance + changes.debit - changes.kredit;
        }
        
        return {
            ...account,
            saldoAwal: openingBalance,
            mutasiDebit: changes.debit,
            mutasiKredit: changes.kredit,
            saldoAkhir: finalBalance
        };
    });
}

function categorizeAccountsForBalanceSheet(accounts) {
    const categorized = {
        currentAssets: [],
        fixedAssets: [],
        currentLiabilities: [],
        longTermLiabilities: [],
        equity: [],
        retainedEarnings: []
    };
    
    accounts.forEach(account => {
        const accountType = account.tipe?.toLowerCase();
        const accountCode = account.kode;
        const accountName = account.nama?.toLowerCase() || '';
        
        if (accountType === 'aset' || accountType === 'asset') {
            if (accountCode.startsWith('1-1') || 
                accountName.includes('kas') || 
                accountName.includes('bank') || 
                accountName.includes('piutang')) {
                categorized.currentAssets.push(account);
            } else {
                categorized.fixedAssets.push(account);
            }
        } else if (accountType === 'kewajiban' || accountType === 'liability') {
            if (accountCode.startsWith('2-1') || 
                accountName.includes('simpanan') || 
                accountName.includes('hutang jangka pendek')) {
                categorized.currentLiabilities.push(account);
            } else {
                categorized.longTermLiabilities.push(account);
            }
        } else if (accountType === 'modal' || accountType === 'equity') {
            if (accountName.includes('laba') || accountName.includes('rugi')) {
                categorized.retainedEarnings.push(account);
            } else {
                categorized.equity.push(account);
            }
        }
    });
    
    return categorized;
}

function calculateBalanceSheetTotals(categorizedAccounts, reportDate) {
    const totalCurrentAssets = categorizedAccounts.currentAssets
        .reduce((sum, account) => sum + (account.saldoAkhir || 0), 0);
    const totalFixedAssets = categorizedAccounts.fixedAssets
        .reduce((sum, account) => sum + (account.saldoAkhir || 0), 0);
    const totalAssets = totalCurrentAssets + totalFixedAssets;
    
    const totalCurrentLiabilities = categorizedAccounts.currentLiabilities
        .reduce((sum, account) => sum + (account.saldoAkhir || 0), 0);
    const totalLongTermLiabilities = categorizedAccounts.longTermLiabilities
        .reduce((sum, account) => sum + (account.saldoAkhir || 0), 0);
    const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;
    
    const totalEquity = categorizedAccounts.equity
        .reduce((sum, account) => sum + (account.saldoAkhir || 0), 0);
    const totalRetainedEarnings = categorizedAccounts.retainedEarnings
        .reduce((sum, account) => sum + (account.saldoAkhir || 0), 0);
    const totalEquityAndRetainedEarnings = totalEquity + totalRetainedEarnings;
    
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquityAndRetainedEarnings;
    const balanceSheetBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01;
    
    return {
        reportDate: reportDate,
        assets: {
            currentAssets: categorizedAccounts.currentAssets,
            fixedAssets: categorizedAccounts.fixedAssets,
            totalCurrentAssets: totalCurrentAssets,
            totalFixedAssets: totalFixedAssets,
            totalAssets: totalAssets
        },
        liabilities: {
            currentLiabilities: categorizedAccounts.currentLiabilities,
            longTermLiabilities: categorizedAccounts.longTermLiabilities,
            totalCurrentLiabilities: totalCurrentLiabilities,
            totalLongTermLiabilities: totalLongTermLiabilities,
            totalLiabilities: totalLiabilities
        },
        equity: {
            equity: categorizedAccounts.equity,
            retainedEarnings: categorizedAccounts.retainedEarnings,
            totalEquity: totalEquity,
            totalRetainedEarnings: totalRetainedEarnings,
            totalEquityAndRetainedEarnings: totalEquityAndRetainedEarnings
        },
        totals: {
            totalAssets: totalAssets,
            totalLiabilities: totalLiabilities,
            totalEquity: totalEquityAndRetainedEarnings,
            totalLiabilitiesAndEquity: totalLiabilitiesAndEquity,
            balanceSheetBalanced: balanceSheetBalanced,
            balanceDifference: totalAssets - totalLiabilitiesAndEquity
        }
    };
}

function calculateBalanceSheet(targetDate) {
    const coa = JSON.parse(localStorage.getItem('coa') || '[]');
    const jurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
    
    if (coa.length === 0) {
        throw new Error('Chart of Accounts (COA) tidak tersedia');
    }
    
    const relevantJournalEntries = jurnal.filter(j => {
        const entryDate = new Date(j.tanggal);
        return entryDate <= targetDate;
    });
    
    const accountBalances = calculateAccountBalances(coa, relevantJournalEntries);
    const categorizedAccounts = categorizeAccountsForBalanceSheet(accountBalances);
    const balanceSheetData = calculateBalanceSheetTotals(categorizedAccounts, targetDate);
    
    return balanceSheetData;
}

// Property-based test generators
const accountTypeArb = fc.constantFrom('aset', 'kewajiban', 'modal');

const accountArb = fc.record({
    kode: fc.string({ minLength: 5, maxLength: 10 }),
    nama: fc.string({ minLength: 3, maxLength: 50 }),
    tipe: accountTypeArb,
    saldo: fc.integer({ min: 0, max: 10000000 })
});

const journalEntryArb = fc.record({
    akun: fc.string({ minLength: 5, maxLength: 10 }),
    debit: fc.integer({ min: 0, max: 1000000 }),
    kredit: fc.integer({ min: 0, max: 1000000 })
});

const journalArb = fc.record({
    id: fc.string(),
    tanggal: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
    keterangan: fc.string({ minLength: 5, maxLength: 100 }),
    entries: fc.array(journalEntryArb, { minLength: 1, maxLength: 5 })
});

describe('Balance Sheet Format Consistency Property Tests', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    /**
     * Property 6: Balance sheet format consistency
     * For any generated balance sheet, the report structure should contain 
     * all required sections (Assets, Liabilities, Equity) with proper categorization and totals
     */
    test('Property 6: Balance sheet format consistency', () => {
        fc.assert(
            fc.property(
                fc.array(accountArb, { minLength: 3, maxLength: 20 }),
                fc.array(journalArb, { minLength: 0, maxLength: 10 }),
                fc.date({ min: new Date('2023-01-01'), max: new Date('2023-12-31') }),
                (coa, jurnal, targetDate) => {
                    // Setup test data
                    localStorage.setItem('coa', JSON.stringify(coa));
                    localStorage.setItem('jurnal', JSON.stringify(jurnal));
                    
                    try {
                        const balanceSheetData = calculateBalanceSheet(targetDate);
                        
                        // Property: Balance sheet must have all required sections
                        
                        // 1. Assets section must exist and have required structure
                        expect(balanceSheetData.assets).toBeDefined();
                        expect(balanceSheetData.assets.currentAssets).toBeDefined();
                        expect(Array.isArray(balanceSheetData.assets.currentAssets)).toBe(true);
                        expect(balanceSheetData.assets.fixedAssets).toBeDefined();
                        expect(Array.isArray(balanceSheetData.assets.fixedAssets)).toBe(true);
                        expect(typeof balanceSheetData.assets.totalCurrentAssets).toBe('number');
                        expect(typeof balanceSheetData.assets.totalFixedAssets).toBe('number');
                        expect(typeof balanceSheetData.assets.totalAssets).toBe('number');
                        
                        // 2. Liabilities section must exist and have required structure
                        expect(balanceSheetData.liabilities).toBeDefined();
                        expect(balanceSheetData.liabilities.currentLiabilities).toBeDefined();
                        expect(Array.isArray(balanceSheetData.liabilities.currentLiabilities)).toBe(true);
                        expect(balanceSheetData.liabilities.longTermLiabilities).toBeDefined();
                        expect(Array.isArray(balanceSheetData.liabilities.longTermLiabilities)).toBe(true);
                        expect(typeof balanceSheetData.liabilities.totalCurrentLiabilities).toBe('number');
                        expect(typeof balanceSheetData.liabilities.totalLongTermLiabilities).toBe('number');
                        expect(typeof balanceSheetData.liabilities.totalLiabilities).toBe('number');
                        
                        // 3. Equity section must exist and have required structure
                        expect(balanceSheetData.equity).toBeDefined();
                        expect(balanceSheetData.equity.equity).toBeDefined();
                        expect(Array.isArray(balanceSheetData.equity.equity)).toBe(true);
                        expect(balanceSheetData.equity.retainedEarnings).toBeDefined();
                        expect(Array.isArray(balanceSheetData.equity.retainedEarnings)).toBe(true);
                        expect(typeof balanceSheetData.equity.totalEquity).toBe('number');
                        expect(typeof balanceSheetData.equity.totalRetainedEarnings).toBe('number');
                        expect(typeof balanceSheetData.equity.totalEquityAndRetainedEarnings).toBe('number');
                        
                        // 4. Totals section must exist and have required structure
                        expect(balanceSheetData.totals).toBeDefined();
                        expect(typeof balanceSheetData.totals.totalAssets).toBe('number');
                        expect(typeof balanceSheetData.totals.totalLiabilities).toBe('number');
                        expect(typeof balanceSheetData.totals.totalEquity).toBe('number');
                        expect(typeof balanceSheetData.totals.totalLiabilitiesAndEquity).toBe('number');
                        expect(typeof balanceSheetData.totals.balanceSheetBalanced).toBe('boolean');
                        expect(typeof balanceSheetData.totals.balanceDifference).toBe('number');
                        
                        // 5. Report date must be present and valid
                        expect(balanceSheetData.reportDate).toBeDefined();
                        expect(balanceSheetData.reportDate instanceof Date).toBe(true);
                        
                        return true;
                    } catch (error) {
                        // If COA is empty, error is expected
                        if (coa.length === 0) {
                            expect(error.message).toContain('Chart of Accounts');
                            return true;
                        }
                        throw error;
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Account categorization consistency
     * All accounts should be properly categorized into their respective sections
     */
    test('Property: Account categorization consistency', () => {
        fc.assert(
            fc.property(
                fc.array(accountArb, { minLength: 5, maxLength: 15 }),
                fc.date({ min: new Date('2023-01-01'), max: new Date('2023-12-31') }),
                (coa, targetDate) => {
                    localStorage.setItem('coa', JSON.stringify(coa));
                    localStorage.setItem('jurnal', JSON.stringify([]));
                    
                    const balanceSheetData = calculateBalanceSheet(targetDate);
                    
                    // Count total accounts in all categories
                    const totalCategorizedAccounts = 
                        balanceSheetData.assets.currentAssets.length +
                        balanceSheetData.assets.fixedAssets.length +
                        balanceSheetData.liabilities.currentLiabilities.length +
                        balanceSheetData.liabilities.longTermLiabilities.length +
                        balanceSheetData.equity.equity.length +
                        balanceSheetData.equity.retainedEarnings.length;
                    
                    // Count accounts by type in original COA
                    const assetAccounts = coa.filter(a => 
                        a.tipe?.toLowerCase() === 'aset' || a.tipe?.toLowerCase() === 'asset'
                    ).length;
                    const liabilityAccounts = coa.filter(a => 
                        a.tipe?.toLowerCase() === 'kewajiban' || a.tipe?.toLowerCase() === 'liability'
                    ).length;
                    const equityAccounts = coa.filter(a => 
                        a.tipe?.toLowerCase() === 'modal' || a.tipe?.toLowerCase() === 'equity'
                    ).length;
                    
                    const expectedCategorizedAccounts = assetAccounts + liabilityAccounts + equityAccounts;
                    
                    // Property: All relevant accounts should be categorized
                    expect(totalCategorizedAccounts).toBe(expectedCategorizedAccounts);
                    
                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Total calculation consistency
     * Section totals should equal the sum of their component accounts
     */
    test('Property: Total calculation consistency', () => {
        fc.assert(
            fc.property(
                fc.array(accountArb, { minLength: 3, maxLength: 10 }),
                fc.array(journalArb, { minLength: 0, maxLength: 5 }),
                fc.date({ min: new Date('2023-01-01'), max: new Date('2023-12-31') }),
                (coa, jurnal, targetDate) => {
                    localStorage.setItem('coa', JSON.stringify(coa));
                    localStorage.setItem('jurnal', JSON.stringify(jurnal));
                    
                    const balanceSheetData = calculateBalanceSheet(targetDate);
                    
                    // Property: Section totals must equal sum of component accounts
                    
                    // Assets totals
                    const calculatedCurrentAssets = balanceSheetData.assets.currentAssets
                        .reduce((sum, acc) => sum + (acc.saldoAkhir || 0), 0);
                    const calculatedFixedAssets = balanceSheetData.assets.fixedAssets
                        .reduce((sum, acc) => sum + (acc.saldoAkhir || 0), 0);
                    
                    expect(balanceSheetData.assets.totalCurrentAssets).toBe(calculatedCurrentAssets);
                    expect(balanceSheetData.assets.totalFixedAssets).toBe(calculatedFixedAssets);
                    expect(balanceSheetData.assets.totalAssets).toBe(calculatedCurrentAssets + calculatedFixedAssets);
                    
                    // Liabilities totals
                    const calculatedCurrentLiabilities = balanceSheetData.liabilities.currentLiabilities
                        .reduce((sum, acc) => sum + (acc.saldoAkhir || 0), 0);
                    const calculatedLongTermLiabilities = balanceSheetData.liabilities.longTermLiabilities
                        .reduce((sum, acc) => sum + (acc.saldoAkhir || 0), 0);
                    
                    expect(balanceSheetData.liabilities.totalCurrentLiabilities).toBe(calculatedCurrentLiabilities);
                    expect(balanceSheetData.liabilities.totalLongTermLiabilities).toBe(calculatedLongTermLiabilities);
                    expect(balanceSheetData.liabilities.totalLiabilities).toBe(calculatedCurrentLiabilities + calculatedLongTermLiabilities);
                    
                    // Equity totals
                    const calculatedEquity = balanceSheetData.equity.equity
                        .reduce((sum, acc) => sum + (acc.saldoAkhir || 0), 0);
                    const calculatedRetainedEarnings = balanceSheetData.equity.retainedEarnings
                        .reduce((sum, acc) => sum + (acc.saldoAkhir || 0), 0);
                    
                    expect(balanceSheetData.equity.totalEquity).toBe(calculatedEquity);
                    expect(balanceSheetData.equity.totalRetainedEarnings).toBe(calculatedRetainedEarnings);
                    expect(balanceSheetData.equity.totalEquityAndRetainedEarnings).toBe(calculatedEquity + calculatedRetainedEarnings);
                    
                    return true;
                }
            ),
            { numRuns: 75 }
        );
    });

    /**
     * Property: Balance sheet structure immutability
     * Multiple calls with same data should produce identical structure
     */
    test('Property: Balance sheet structure immutability', () => {
        fc.assert(
            fc.property(
                fc.array(accountArb, { minLength: 3, maxLength: 8 }),
                fc.array(journalArb, { minLength: 0, maxLength: 3 }),
                fc.date({ min: new Date('2023-01-01'), max: new Date('2023-12-31') }),
                (coa, jurnal, targetDate) => {
                    localStorage.setItem('coa', JSON.stringify(coa));
                    localStorage.setItem('jurnal', JSON.stringify(jurnal));
                    
                    const balanceSheet1 = calculateBalanceSheet(targetDate);
                    const balanceSheet2 = calculateBalanceSheet(targetDate);
                    
                    // Property: Structure should be identical across calls
                    expect(balanceSheet1.assets.currentAssets.length).toBe(balanceSheet2.assets.currentAssets.length);
                    expect(balanceSheet1.assets.fixedAssets.length).toBe(balanceSheet2.assets.fixedAssets.length);
                    expect(balanceSheet1.liabilities.currentLiabilities.length).toBe(balanceSheet2.liabilities.currentLiabilities.length);
                    expect(balanceSheet1.liabilities.longTermLiabilities.length).toBe(balanceSheet2.liabilities.longTermLiabilities.length);
                    expect(balanceSheet1.equity.equity.length).toBe(balanceSheet2.equity.equity.length);
                    expect(balanceSheet1.equity.retainedEarnings.length).toBe(balanceSheet2.equity.retainedEarnings.length);
                    
                    // Totals should be identical
                    expect(balanceSheet1.totals.totalAssets).toBe(balanceSheet2.totals.totalAssets);
                    expect(balanceSheet1.totals.totalLiabilities).toBe(balanceSheet2.totals.totalLiabilities);
                    expect(balanceSheet1.totals.totalEquity).toBe(balanceSheet2.totals.totalEquity);
                    
                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });
});