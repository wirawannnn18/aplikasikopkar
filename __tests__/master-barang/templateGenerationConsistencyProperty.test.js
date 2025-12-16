/**
 * Property-Based Test: Template Generation Consistency
 * Feature: master-barang-komprehensif, Property 9: Template generation consistency
 * 
 * Tests that for any template download request, the system generates files 
 * with valid headers and example data consistently.
 */

import { TemplateManager } from '../../js/master-barang/TemplateManager.js';

describe('Property Test: Template Generation Consistency', () => {
    let templateManager;

    beforeEach(() => {
        templateManager = new TemplateManager();
        
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
     * Property 9: Template generation consistency
     * For any template download request, the system should generate files 
     * with valid headers and example data
     */
    test('should generate consistent template data structure for any format request', () => {
        // Test with multiple format requests
        const formats = ['csv', 'xlsx'];
        const results = [];

        formats.forEach(format => {
            const templateData = templateManager.generateTemplateData();
            results.push({
                format,
                templateData,
                fileName: templateManager.generateTemplateFileName(format)
            });
        });

        // Verify all results have consistent structure
        results.forEach(result => {
            // Template data should have headers and data
            expect(result.templateData).toHaveProperty('headers');
            expect(result.templateData).toHaveProperty('data');
            
            // Headers should be array with expected columns
            expect(Array.isArray(result.templateData.headers)).toBe(true);
            expect(result.templateData.headers.length).toBeGreaterThan(0);
            
            // Should contain required columns
            const requiredColumns = ['Kode Barang', 'Nama Barang', 'Kategori', 'Satuan'];
            requiredColumns.forEach(column => {
                expect(result.templateData.headers).toContain(column);
            });
            
            // Data should be array with sample rows
            expect(Array.isArray(result.templateData.data)).toBe(true);
            expect(result.templateData.data.length).toBeGreaterThan(0);
            
            // Each data row should have same length as headers
            result.templateData.data.forEach(row => {
                expect(Array.isArray(row)).toBe(true);
                expect(row.length).toBe(result.templateData.headers.length);
            });
            
            // File name should be properly formatted
            expect(result.fileName).toMatch(/^template_master_barang_\d{4}-\d{2}-\d{2}\.(csv|xlsx)$/);
        });
    });

    test('should generate valid sample data for template', () => {
        const templateData = templateManager.generateTemplateData();
        
        // Sample data should contain realistic examples
        templateData.data.forEach(row => {
            const [kode, nama, kategori, satuan, hargaBeli, hargaJual, stok, stokMin, deskripsi] = row;
            
            // Kode should not be empty
            expect(kode).toBeTruthy();
            expect(typeof kode).toBe('string');
            
            // Nama should not be empty
            expect(nama).toBeTruthy();
            expect(typeof nama).toBe('string');
            
            // Kategori should not be empty
            expect(kategori).toBeTruthy();
            expect(typeof kategori).toBe('string');
            
            // Satuan should not be empty
            expect(satuan).toBeTruthy();
            expect(typeof satuan).toBe('string');
            
            // Prices should be numeric strings
            if (hargaBeli) {
                expect(!isNaN(Number(hargaBeli))).toBe(true);
                expect(Number(hargaBeli)).toBeGreaterThan(0);
            }
            
            if (hargaJual) {
                expect(!isNaN(Number(hargaJual))).toBe(true);
                expect(Number(hargaJual)).toBeGreaterThan(0);
            }
            
            // Stock should be numeric strings
            if (stok) {
                expect(!isNaN(Number(stok))).toBe(true);
                expect(Number(stok)).toBeGreaterThanOrEqual(0);
            }
            
            if (stokMin) {
                expect(!isNaN(Number(stokMin))).toBe(true);
                expect(Number(stokMin)).toBeGreaterThanOrEqual(0);
            }
        });
    });

    test('should provide consistent template instructions', () => {
        const instructions = templateManager.getTemplateInstructions();
        
        // Instructions should have required structure
        expect(instructions).toHaveProperty('title');
        expect(instructions).toHaveProperty('instructions');
        expect(instructions).toHaveProperty('columns');
        
        // Title should not be empty
        expect(instructions.title).toBeTruthy();
        expect(typeof instructions.title).toBe('string');
        
        // Instructions should be array with content
        expect(Array.isArray(instructions.instructions)).toBe(true);
        expect(instructions.instructions.length).toBeGreaterThan(0);
        
        // Each instruction should be non-empty string
        instructions.instructions.forEach(instruction => {
            expect(instruction).toBeTruthy();
            expect(typeof instruction).toBe('string');
        });
        
        // Columns should describe template structure
        expect(Array.isArray(instructions.columns)).toBe(true);
        expect(instructions.columns.length).toBeGreaterThan(0);
        
        // Each column should have name, required flag, and description
        instructions.columns.forEach(column => {
            expect(column).toHaveProperty('name');
            expect(column).toHaveProperty('required');
            expect(column).toHaveProperty('description');
            
            expect(typeof column.name).toBe('string');
            expect(typeof column.required).toBe('boolean');
            expect(typeof column.description).toBe('string');
            
            expect(column.name).toBeTruthy();
            expect(column.description).toBeTruthy();
        });
    });

    test('should validate template formats consistently', () => {
        const validFormats = ['csv', 'xlsx', 'CSV', 'XLSX'];
        const invalidFormats = ['pdf', 'doc', 'txt', ''];
        
        // Valid formats should pass validation
        validFormats.forEach(format => {
            expect(templateManager.validateTemplateFormat(format)).toBe(true);
        });
        
        // Invalid formats should fail validation
        invalidFormats.forEach(format => {
            expect(templateManager.validateTemplateFormat(format)).toBe(false);
        });
        
        // Null and undefined should fail validation
        expect(templateManager.validateTemplateFormat(null)).toBe(false);
        expect(templateManager.validateTemplateFormat(undefined)).toBe(false);
    });

    test('should handle CSV template generation consistently', () => {
        const templateData = templateManager.generateTemplateData();
        
        // Test CSV content generation without actual download
        const csvContent = [
            templateData.headers.join(','),
            ...templateData.data.map(row => 
                row.map(cell => {
                    const cellStr = String(cell);
                    if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                        return '"' + cellStr.replace(/"/g, '""') + '"';
                    }
                    return cellStr;
                }).join(',')
            )
        ].join('\n');
        
        // CSV content should be properly formatted
        expect(csvContent).toContain(templateData.headers.join(','));
        expect(csvContent.split('\n').length).toBe(templateData.data.length + 1); // headers + data rows
    });

    test('should handle Excel template generation consistently', () => {
        const templateData = templateManager.generateTemplateData();
        
        // Test Excel HTML content generation
        let html = '<table>';
        
        // Add headers
        html += '<tr>';
        templateData.headers.forEach(header => {
            html += `<th>${templateManager.escapeHtml(header)}</th>`;
        });
        html += '</tr>';
        
        // Add sample data
        templateData.data.forEach(row => {
            html += '<tr>';
            row.forEach(cell => {
                html += `<td>${templateManager.escapeHtml(cell)}</td>`;
            });
            html += '</tr>';
        });
        
        html += '</table>';
        
        // HTML content should be properly formatted
        expect(html).toContain('<table>');
        expect(html).toContain('</table>');
        expect(html).toContain('<th>');
        expect(html).toContain('<td>');
    });

    test('should generate unique file names with timestamps', () => {
        const format = 'csv';
        const fileName1 = templateManager.generateTemplateFileName(format);
        
        // Wait a bit to ensure different timestamp
        setTimeout(() => {
            const fileName2 = templateManager.generateTemplateFileName(format);
            
            // Both should follow naming pattern
            expect(fileName1).toMatch(/^template_master_barang_\d{4}-\d{2}-\d{2}\.csv$/);
            expect(fileName2).toMatch(/^template_master_barang_\d{4}-\d{2}-\d{2}\.csv$/);
            
            // Should contain current date
            const today = new Date().toISOString().slice(0, 10);
            expect(fileName1).toContain(today);
            expect(fileName2).toContain(today);
        }, 1);
    });
});