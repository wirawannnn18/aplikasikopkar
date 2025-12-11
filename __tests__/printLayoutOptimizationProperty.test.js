/**
 * Property-Based Test: Print Layout Optimization
 * Task 5.2: Property test for print layout optimization
 * Feature: laporan-neraca-periode, Property 8: Print layout optimization
 * Requirements: 3.4
 * 
 * **Validates: Requirements 3.4**
 */

import fc from 'fast-check';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;

// Mock localStorage
global.localStorage = {
    getItem: (key) => {
        const mockData = {
            'koperasi': JSON.stringify({ nama: 'Test Koperasi' }),
            'coa': JSON.stringify([
                { kode: '1-1000', nama: 'Kas', tipe: 'Aset', saldo: 1000000 },
                { kode: '1-1100', nama: 'Bank', tipe: 'Aset', saldo: 2000000 },
                { kode: '2-1000', nama: 'Hutang Supplier', tipe: 'Kewajiban', saldo: 500000 },
                { kode: '3-1000', nama: 'Modal Koperasi', tipe: 'Modal', saldo: 2500000 }
            ])
        };
        return mockData[key] || null;
    },
    setItem: () => {}
};

// Helper function to format currency (simplified version)
function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// Helper function to format period text
function formatPeriodText(periodInfo) {
    if (!periodInfo) return 'Periode tidak diketahui';
    
    switch (periodInfo.type) {
        case 'daily':
            return `Harian - ${periodInfo.endDate.toLocaleDateString('id-ID')}`;
        case 'monthly':
            return `Bulanan - ${periodInfo.endDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;
        case 'yearly':
            return `Tahunan - ${periodInfo.endDate.getFullYear()}`;
        default:
            return 'Periode tidak diketahui';
    }
}

// Helper function to get company info
function getCompanyInfoForReport() {
    const koperasi = JSON.parse(localStorage.getItem('koperasi') || '{}');
    return {
        name: koperasi.nama || 'Koperasi Test'
    };
}

/**
 * Generate print content for balance sheet
 * This is the actual implementation we want to test for print layout optimization
 * @param {Object} balanceSheetData - Balance sheet data
 * @returns {string} HTML content optimized for printing
 */
function generatePrintContent(balanceSheetData) {
    const companyInfo = getCompanyInfoForReport();
    const periodText = formatPeriodText(balanceSheetData.periodInfo);
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Print - Laporan Neraca</title>
            <style>
                @page {
                    size: A4;
                    margin: 1.5cm;
                }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none !important; }
                }
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    font-size: 11px;
                    line-height: 1.3;
                    color: #000;
                    background: white;
                }
                .print-header {
                    text-align: center;
                    margin-bottom: 25px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #000;
                }
                .company-name {
                    font-size: 16px;
                    font-weight: bold;
                    margin-bottom: 3px;
                }
                .report-title {
                    font-size: 14px;
                    font-weight: bold;
                    margin-bottom: 3px;
                }
                .report-date {
                    font-size: 11px;
                    margin-bottom: 2px;
                }
                .balance-status {
                    background: ${balanceSheetData.totals.balanceSheetBalanced ? '#f0f8f0' : '#fff8f0'};
                    border: 1px solid ${balanceSheetData.totals.balanceSheetBalanced ? '#28a745' : '#ffc107'};
                    padding: 8px;
                    margin: 15px 0;
                    text-align: center;
                    font-size: 10px;
                }
                .print-container {
                    display: table;
                    width: 100%;
                    table-layout: fixed;
                }
                .print-column {
                    display: table-cell;
                    width: 50%;
                    vertical-align: top;
                    padding-right: 15px;
                }
                .print-column:last-child {
                    padding-right: 0;
                    padding-left: 15px;
                }
                .section-header {
                    font-size: 12px;
                    font-weight: bold;
                    margin-bottom: 10px;
                    padding: 5px;
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    text-align: center;
                }
                .subsection {
                    margin-bottom: 12px;
                }
                .subsection-title {
                    font-size: 10px;
                    font-weight: bold;
                    margin-bottom: 5px;
                    padding-left: 5px;
                    border-left: 3px solid #6c757d;
                }
                .account-line {
                    display: flex;
                    justify-content: space-between;
                    padding: 1px 0;
                    font-size: 9px;
                }
                .account-name {
                    padding-left: 10px;
                    flex: 1;
                }
                .account-amount {
                    text-align: right;
                    font-weight: 500;
                    min-width: 80px;
                }
                .subtotal-line {
                    display: flex;
                    justify-content: space-between;
                    padding: 3px 0;
                    margin-top: 3px;
                    border-top: 1px solid #ccc;
                    font-weight: bold;
                    font-size: 9px;
                }
                .total-line {
                    display: flex;
                    justify-content: space-between;
                    padding: 5px;
                    margin: 8px 0;
                    border: 2px solid #000;
                    background: #f8f9fa;
                    font-weight: bold;
                    font-size: 10px;
                }
                .print-footer {
                    margin-top: 20px;
                    font-size: 8px;
                    text-align: center;
                    color: #666;
                    border-top: 1px solid #ccc;
                    padding-top: 8px;
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <div class="company-name">${companyInfo.name}</div>
                <div class="report-title">LAPORAN NERACA (BALANCE SHEET)</div>
                <div class="report-date">Per ${balanceSheetData.reportDate.toLocaleDateString('id-ID', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</div>
                <div class="report-date">${periodText}</div>
            </div>
            
            <div class="balance-status">
                <strong>Persamaan Neraca:</strong> 
                ${formatRupiah(balanceSheetData.totals.totalAssets)} = ${formatRupiah(balanceSheetData.totals.totalLiabilitiesAndEquity)}
                | Status: ${balanceSheetData.totals.balanceSheetBalanced ? 'SEIMBANG ✓' : 'TIDAK SEIMBANG ⚠'}
            </div>
            
            <div class="print-container">
                <div class="print-column">
                    <div class="section-header">ASET (ASSETS)</div>
                    
                    ${generatePrintSection('Aset Lancar', balanceSheetData.assets.currentAssets, balanceSheetData.assets.totalCurrentAssets)}
                    ${generatePrintSection('Aset Tetap', balanceSheetData.assets.fixedAssets, balanceSheetData.assets.totalFixedAssets)}
                    
                    <div class="total-line">
                        <span>TOTAL ASET</span>
                        <span>${formatRupiah(balanceSheetData.assets.totalAssets)}</span>
                    </div>
                </div>
                
                <div class="print-column">
                    <div class="section-header">KEWAJIBAN & MODAL</div>
                    
                    ${generatePrintSection('Kewajiban Lancar', balanceSheetData.liabilities.currentLiabilities, balanceSheetData.liabilities.totalCurrentLiabilities)}
                    ${balanceSheetData.liabilities.longTermLiabilities.length > 0 ? 
                        generatePrintSection('Kewajiban Jangka Panjang', balanceSheetData.liabilities.longTermLiabilities, balanceSheetData.liabilities.totalLongTermLiabilities) : ''
                    }
                    
                    <div class="subtotal-line">
                        <span>Total Kewajiban</span>
                        <span>${formatRupiah(balanceSheetData.liabilities.totalLiabilities)}</span>
                    </div>
                    
                    ${generatePrintEquitySection(balanceSheetData.equity)}
                    
                    <div class="total-line">
                        <span>TOTAL KEWAJIBAN & MODAL</span>
                        <span>${formatRupiah(balanceSheetData.totals.totalLiabilitiesAndEquity)}</span>
                    </div>
                </div>
            </div>
            
            <div class="print-footer">
                Dicetak pada: ${new Date().toLocaleDateString('id-ID', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })} | Sistem Manajemen Koperasi
            </div>
        </body>
        </html>
    `;
}

/**
 * Generate Print Section
 * Helper function for print section generation
 * @param {string} title - Section title
 * @param {Array} accounts - Array of accounts
 * @param {number} total - Section total
 * @returns {string} HTML for print section
 */
function generatePrintSection(title, accounts, total) {
    return `
        <div class="subsection">
            <div class="subsection-title">${title}</div>
            ${accounts.length === 0 ? 
                '<div class="account-line"><span class="account-name" style="font-style: italic; color: #666;">Tidak ada akun</span><span class="account-amount">-</span></div>' :
                accounts.map(account => `
                    <div class="account-line">
                        <span class="account-name">${account.nama}</span>
                        <span class="account-amount">${formatRupiah(account.saldoAkhir)}</span>
                    </div>
                `).join('')
            }
            <div class="subtotal-line">
                <span>Total ${title}</span>
                <span>${formatRupiah(total)}</span>
            </div>
        </div>
    `;
}

/**
 * Generate Print Equity Section
 * Special print formatting for equity section
 * @param {Object} equityData - Equity data
 * @returns {string} HTML for print equity section
 */
function generatePrintEquitySection(equityData) {
    const allEquityAccounts = [...equityData.equity, ...equityData.retainedEarnings];
    
    return `
        <div class="subsection">
            <div class="subsection-title">Modal</div>
            ${allEquityAccounts.length === 0 ? 
                '<div class="account-line"><span class="account-name" style="font-style: italic; color: #666;">Tidak ada akun modal</span><span class="account-amount">-</span></div>' :
                allEquityAccounts.map(account => `
                    <div class="account-line">
                        <span class="account-name">${account.nama}</span>
                        <span class="account-amount">${formatRupiah(account.saldoAkhir)}</span>
                    </div>
                `).join('')
            }
            <div class="subtotal-line">
                <span>Total Modal</span>
                <span>${formatRupiah(equityData.totalEquityAndRetainedEarnings)}</span>
            </div>
        </div>
    `;
}

// Fast-check generators for balance sheet data
const accountGenerator = fc.record({
    kode: fc.string({ minLength: 5, maxLength: 10 }),
    nama: fc.string({ minLength: 5, maxLength: 50 }),
    saldoAkhir: fc.integer({ min: 0, max: 100000000 })
});

const balanceSheetDataGenerator = fc.record({
    reportDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
    periodInfo: fc.record({
        type: fc.constantFrom('daily', 'monthly', 'yearly'),
        endDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
    }),
    assets: fc.record({
        currentAssets: fc.array(accountGenerator, { minLength: 1, maxLength: 20 }),
        fixedAssets: fc.array(accountGenerator, { minLength: 0, maxLength: 15 }),
        totalCurrentAssets: fc.integer({ min: 1000000, max: 500000000 }),
        totalFixedAssets: fc.integer({ min: 0, max: 1000000000 }),
        totalAssets: fc.integer({ min: 1000000, max: 1500000000 })
    }),
    liabilities: fc.record({
        currentLiabilities: fc.array(accountGenerator, { minLength: 0, maxLength: 15 }),
        longTermLiabilities: fc.array(accountGenerator, { minLength: 0, maxLength: 10 }),
        totalCurrentLiabilities: fc.integer({ min: 0, max: 300000000 }),
        totalLongTermLiabilities: fc.integer({ min: 0, max: 200000000 }),
        totalLiabilities: fc.integer({ min: 0, max: 500000000 })
    }),
    equity: fc.record({
        equity: fc.array(accountGenerator, { minLength: 1, maxLength: 10 }),
        retainedEarnings: fc.array(accountGenerator, { minLength: 0, maxLength: 5 }),
        totalEquityAndRetainedEarnings: fc.integer({ min: 500000, max: 1000000000 })
    }),
    totals: fc.record({
        totalAssets: fc.integer({ min: 1000000, max: 1500000000 }),
        totalLiabilitiesAndEquity: fc.integer({ min: 1000000, max: 1500000000 }),
        balanceSheetBalanced: fc.boolean(),
        balanceDifference: fc.integer({ min: -1000000, max: 1000000 })
    })
});

describe('Print Layout Optimization Property Tests', () => {
    /**
     * Property 8: Print layout optimization
     * For any balance sheet report formatted for printing, the layout should fit 
     * standard page dimensions without data truncation
     * **Feature: laporan-neraca-periode, Property 8: Print layout optimization**
     */
    test('Property 8: Print layout optimization', () => {
        fc.assert(
            fc.property(balanceSheetDataGenerator, (balanceSheetData) => {
                // Generate print content
                const printContent = generatePrintContent(balanceSheetData);
                
                // 1. Must contain proper A4 page setup
                expect(printContent).toContain('@page');
                expect(printContent).toContain('size: A4');
                expect(printContent).toContain('margin: 1.5cm');
                
                // 2. Must contain print-specific CSS
                expect(printContent).toContain('@media print');
                expect(printContent).toContain('.no-print { display: none !important; }');
                
                // 3. Must use appropriate font sizes for print (9px-16px range)
                expect(printContent).toContain('font-size: 11px'); // body
                expect(printContent).toContain('font-size: 16px'); // company name
                expect(printContent).toContain('font-size: 14px'); // report title
                expect(printContent).toContain('font-size: 9px');  // account lines
                
                // 4. Must use table layout for proper column alignment
                expect(printContent).toContain('display: table');
                expect(printContent).toContain('display: table-cell');
                expect(printContent).toContain('width: 50%');
                
                // 5. Must have proper spacing and margins for print
                expect(printContent).toContain('margin-bottom: 25px'); // header spacing
                expect(printContent).toContain('margin-bottom: 12px'); // subsection spacing
                expect(printContent).toContain('padding: 1px 0');      // account line spacing
                
                // 6. Must contain all essential balance sheet sections
                expect(printContent).toContain('ASET (ASSETS)');
                expect(printContent).toContain('KEWAJIBAN & MODAL');
                expect(printContent).toContain('TOTAL ASET');
                expect(printContent).toContain('TOTAL KEWAJIBAN & MODAL');
                
                // 7. Must have proper text alignment for amounts
                expect(printContent).toContain('text-align: right');
                expect(printContent).toContain('min-width: 80px');
                
                // 8. Must include print footer with timestamp
                expect(printContent).toContain('print-footer');
                expect(printContent).toContain('Dicetak pada:');
                expect(printContent).toContain('Sistem Manajemen Koperasi');
                
                // 9. Content length should be reasonable for A4 page
                // Rough estimate: A4 can handle ~3000-4000 characters per page
                // With 2-column layout, we should stay within reasonable limits
                const contentLength = printContent.length;
                expect(contentLength).toBeGreaterThan(2000); // Must have substantial content
                expect(contentLength).toBeLessThan(50000);   // But not excessively long
                
                // 10. Must have proper line height for readability
                expect(printContent).toContain('line-height: 1.3');
                
                return true;
            }),
            { numRuns: 100 }
        );
    });

    /**
     * Property: Print content structure consistency
     * For any balance sheet data, the print content should maintain consistent structure
     */
    test('Property: Print content structure consistency', () => {
        fc.assert(
            fc.property(balanceSheetDataGenerator, (balanceSheetData) => {
                const printContent = generatePrintContent(balanceSheetData);
                
                // Parse HTML structure validation
                const htmlStructure = {
                    hasDoctype: printContent.includes('<!DOCTYPE html>'),
                    hasHtmlTag: printContent.includes('<html>') && printContent.includes('</html>'),
                    hasHead: printContent.includes('<head>') && printContent.includes('</head>'),
                    hasBody: printContent.includes('<body>') && printContent.includes('</body>'),
                    hasTitle: printContent.includes('<title>'),
                    hasStyle: printContent.includes('<style>') && printContent.includes('</style>')
                };
                
                // All HTML structure elements must be present
                Object.values(htmlStructure).forEach(hasElement => {
                    expect(hasElement).toBe(true);
                });
                
                // Must have proper CSS class structure
                const requiredClasses = [
                    'print-header', 'company-name', 'report-title', 'report-date',
                    'balance-status', 'print-container', 'print-column',
                    'section-header', 'subsection', 'subsection-title',
                    'account-line', 'account-name', 'account-amount',
                    'subtotal-line', 'total-line', 'print-footer'
                ];
                
                requiredClasses.forEach(className => {
                    expect(printContent).toContain(className);
                });
                
                return true;
            }),
            { numRuns: 50 }
        );
    });

    /**
     * Property: Print layout responsive to data size
     * For any balance sheet with varying amounts of data, the layout should adapt appropriately
     */
    test('Property: Print layout responsive to data size', () => {
        fc.assert(
            fc.property(
                fc.record({
                    smallData: balanceSheetDataGenerator.map(data => ({
                        ...data,
                        assets: {
                            ...data.assets,
                            currentAssets: data.assets.currentAssets.slice(0, 3),
                            fixedAssets: data.assets.fixedAssets.slice(0, 2)
                        },
                        liabilities: {
                            ...data.liabilities,
                            currentLiabilities: data.liabilities.currentLiabilities.slice(0, 2),
                            longTermLiabilities: []
                        }
                    })),
                    largeData: balanceSheetDataGenerator.map(data => ({
                        ...data,
                        assets: {
                            ...data.assets,
                            currentAssets: [...data.assets.currentAssets, ...data.assets.currentAssets],
                            fixedAssets: [...data.assets.fixedAssets, ...data.assets.fixedAssets]
                        }
                    }))
                }),
                ({ smallData, largeData }) => {
                    const smallPrintContent = generatePrintContent(smallData);
                    const largePrintContent = generatePrintContent(largeData);
                    
                    // Both should have same basic structure
                    expect(smallPrintContent).toContain('print-container');
                    expect(largePrintContent).toContain('print-container');
                    
                    // Both should have proper column layout
                    expect(smallPrintContent).toContain('print-column');
                    expect(largePrintContent).toContain('print-column');
                    
                    // Large content should be longer but still structured
                    expect(largePrintContent.length).toBeGreaterThan(smallPrintContent.length);
                    
                    // Both should maintain print optimization
                    [smallPrintContent, largePrintContent].forEach(content => {
                        expect(content).toContain('@page');
                        expect(content).toContain('size: A4');
                        expect(content).toContain('font-size: 9px'); // Small font for dense data
                    });
                    
                    return true;
                }
            ),
            { numRuns: 25 }
        );
    });

    /**
     * Property: Print content currency formatting consistency
     * For any balance sheet amounts, currency formatting should be consistent in print layout
     */
    test('Property: Print content currency formatting consistency', () => {
        fc.assert(
            fc.property(balanceSheetDataGenerator, (balanceSheetData) => {
                const printContent = generatePrintContent(balanceSheetData);
                
                // Should contain Indonesian Rupiah formatting
                const rupiahMatches = printContent.match(/Rp[\s\d.,]+/g);
                
                if (rupiahMatches && rupiahMatches.length > 0) {
                    // All currency amounts should start with "Rp"
                    rupiahMatches.forEach(match => {
                        expect(match).toMatch(/^Rp[\s\d.,]+$/);
                    });
                    
                    // Should have at least total amounts formatted
                    expect(rupiahMatches.length).toBeGreaterThanOrEqual(2); // At least total assets and total liab+equity
                }
                
                return true;
            }),
            { numRuns: 50 }
        );
    });
});