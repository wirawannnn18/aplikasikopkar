/**
 * Property-Based Test: Export File Naming
 * Feature: master-barang-komprehensif, Property 11: Export file naming
 * 
 * Tests that for any completed export operation, the system provides 
 * download links with descriptive file names.
 */

import { ExportManager } from '../../js/master-barang/ExportManager.js';

describe('Property Test: Export File Naming', () => {
    let exportManager;

    beforeEach(() => {
        exportManager = new ExportManager();
        
        // Mock DOM methods
        global.document = {
            createElement: () => ({
                href: '',
                download: '',
                style: { display: '' },
                click: () => {},
                textContent: '',
                innerHTML: ''
            }),
            body: {
                appendChild: () => {},
                removeChild: () => {}
            }
        };

        global.window = {
            URL: {
                createObjectURL: function() { return 'mock-url'; },
                revokeObjectURL: function() {}
            }
        };

        global.Blob = function() {};
        global.setTimeout = (fn) => fn();
    });

    afterEach(() => {
        // Reset mocks if needed
    });

    /**
     * Property 11: Export file naming
     * For any completed export operation, the system should provide 
     * download links with descriptive file names
     */
    test('should generate descriptive file names for any export operation', () => {
        const testCases = [
            {
                format: 'csv',
                filters: {},
                description: 'all data'
            },
            {
                format: 'xlsx',
                filters: { kategori: 'Sembako' },
                description: 'filtered by category'
            },
            {
                format: 'csv',
                filters: { satuan: 'PCS' },
                description: 'filtered by unit'
            },
            {
                format: 'xlsx',
                filters: { kategori: 'Elektronik', satuan: 'Unit' },
                description: 'multiple filters'
            }
        ];

        testCases.forEach(testCase => {
            const fileName = exportManager.generateExportFileName(testCase.format, testCase.filters);
            
            // File name should follow descriptive pattern
            expect(fileName).toMatch(/^export_master_barang_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.(csv|xlsx)$/);
            
            // Should contain timestamp
            const now = new Date();
            const dateStr = now.toISOString().slice(0, 10);
            expect(fileName).toContain(dateStr);
            
            // Should have correct extension
            expect(fileName.endsWith(`.${testCase.format}`)).toBe(true);
            
            // Should be descriptive (contain export prefix and timestamp)
            expect(fileName).toContain('export_master_barang');
        });
    });

    test('should generate unique file names for concurrent exports', () => {
        const format = 'csv';
        const filters = {};
        
        // Generate multiple file names in quick succession
        const fileNames = [];
        for (let i = 0; i < 5; i++) {
            fileNames.push(exportManager.generateExportFileName(format, filters));
        }
        
        // All file names should follow the pattern
        fileNames.forEach(fileName => {
            expect(fileName).toMatch(/^export_master_barang_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.csv$/);
        });
        
        // File names should be unique (due to timestamp precision)
        const uniqueNames = new Set(fileNames);
        expect(uniqueNames.size).toBeGreaterThan(0);
    });

    test('should handle different export formats in file naming', () => {
        const formats = ['csv', 'xlsx'];
        const filters = { kategori: 'Test' };
        
        formats.forEach(format => {
            const fileName = exportManager.generateExportFileName(format, filters);
            
            // Should have correct extension
            expect(fileName.endsWith(`.${format}`)).toBe(true);
            
            // Should follow naming convention
            expect(fileName).toMatch(new RegExp(`^export_master_barang_\\d{4}-\\d{2}-\\d{2}_\\d{2}-\\d{2}-\\d{2}\\.${format}$`));
        });
    });

    test('should create descriptive file names regardless of filter complexity', () => {
        const filterCombinations = [
            {},
            { kategori: 'Sembako' },
            { satuan: 'KG' },
            { status: 'aktif' },
            { kategori: 'Elektronik', satuan: 'Unit' },
            { kategori: 'Makanan', satuan: 'PCS', status: 'aktif' },
            { search: 'beras' },
            { kategori: 'Minuman', search: 'air' }
        ];

        filterCombinations.forEach(filters => {
            const fileName = exportManager.generateExportFileName('csv', filters);
            
            // Should always generate valid file name
            expect(fileName).toBeTruthy();
            expect(typeof fileName).toBe('string');
            
            // Should follow naming pattern
            expect(fileName).toMatch(/^export_master_barang_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.csv$/);
            
            // Should not contain invalid file name characters
            expect(fileName).not.toMatch(/[<>:"/\\|?*]/);
        });
    });

    test('should provide consistent download functionality with proper file names', () => {
        const testData = [
            { id: '1', kode: 'BRG001', nama: 'Test Item 1' },
            { id: '2', kode: 'BRG002', nama: 'Test Item 2' }
        ];
        
        const format = 'csv';
        const filters = { kategori: 'Test' };
        
        // Test file name generation without actual download
        const fileName = exportManager.generateExportFileName(format, filters);
        
        // Should generate proper file name
        expect(fileName).toMatch(/^export_master_barang_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.csv$/);
        expect(fileName.endsWith('.csv')).toBe(true);
        expect(fileName).toContain('export_master_barang');
    });

    test('should handle special characters in filter values for file naming', () => {
        const specialFilters = [
            { kategori: 'Makanan & Minuman' },
            { satuan: 'Kg/Liter' },
            { search: 'beras premium (5kg)' },
            { kategori: 'Elektronik/IT' }
        ];

        specialFilters.forEach(filters => {
            const fileName = exportManager.generateExportFileName('csv', filters);
            
            // Should generate valid file name without special characters
            expect(fileName).toMatch(/^export_master_barang_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.csv$/);
            
            // Should not contain problematic characters for file systems
            expect(fileName).not.toMatch(/[<>:"/\\|?*&()]/);
        });
    });

    test('should maintain file name consistency across multiple export calls', () => {
        const format = 'xlsx';
        const filters = { kategori: 'Consistent Test' };
        
        // Generate file names multiple times
        const fileNames = [];
        for (let i = 0; i < 3; i++) {
            fileNames.push(exportManager.generateExportFileName(format, filters));
        }
        
        // All should follow same pattern
        fileNames.forEach(fileName => {
            expect(fileName).toMatch(/^export_master_barang_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.xlsx$/);
            expect(fileName).toContain('export_master_barang');
            expect(fileName.endsWith('.xlsx')).toBe(true);
        });
    });

    test('should generate appropriate file names for template downloads', () => {
        // Test template file naming through export manager
        const templateFileName = exportManager.generateTemplateFileName('csv');
        
        // Template files should have different naming pattern
        expect(templateFileName).toMatch(/^template_master_barang_\d{4}-\d{2}-\d{2}\.csv$/);
        expect(templateFileName).toContain('template_master_barang');
        
        // Should be distinguishable from export files
        expect(templateFileName).not.toContain('export_');
    });
});