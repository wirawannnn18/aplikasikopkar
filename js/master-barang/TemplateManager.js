/**
 * TemplateManager - Handles template generation and download for import operations
 */

import { BaseManager } from './BaseManager.js';

export class TemplateManager extends BaseManager {
    constructor() {
        super();
        this.templateFormats = ['xlsx', 'csv'];
    }

    /**
     * Generate and download template file
     */
    downloadTemplate(format = 'csv') {
        try {
            const templateData = this.generateTemplateData();
            const fileName = this.generateTemplateFileName(format);

            if (format === 'csv') {
                this.downloadCSVTemplate(templateData, fileName);
            } else if (format === 'xlsx') {
                this.downloadExcelTemplate(templateData, fileName);
            } else {
                throw new Error('Unsupported format: ' + format);
            }

        } catch (error) {
            console.error('Error downloading template:', error);
            alert('Error downloading template: ' + error.message);
        }
    }

    /**
     * Generate template data with headers and sample rows
     */
    generateTemplateData() {
        const headers = [
            'Kode Barang',
            'Nama Barang', 
            'Kategori',
            'Satuan',
            'Harga Beli',
            'Harga Jual',
            'Stok',
            'Stok Minimum',
            'Deskripsi'
        ];

        const sampleData = [
            [
                'BRG001',
                'Beras Premium 5kg',
                'Sembako',
                'Karung',
                '45000',
                '50000',
                '100',
                '10',
                'Beras premium kualitas terbaik'
            ],
            [
                'BRG002',
                'Minyak Goreng 1L',
                'Sembako',
                'Botol',
                '12000',
                '14000',
                '50',
                '5',
                'Minyak goreng berkualitas'
            ],
            [
                'BRG003',
                'Gula Pasir 1kg',
                'Sembako',
                'Kg',
                '13000',
                '15000',
                '75',
                '15',
                'Gula pasir putih bersih'
            ]
        ];

        return {
            headers: headers,
            data: sampleData
        };
    }

    /**
     * Generate template file name
     */
    generateTemplateFileName(format) {
        const timestamp = new Date().toISOString().slice(0, 10);
        return `template_master_barang_${timestamp}.${format}`;
    }

    /**
     * Download CSV template
     */
    downloadCSVTemplate(templateData, fileName) {
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

        // Add BOM for proper UTF-8 encoding
        const bom = '\uFEFF';
        const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
        
        this.downloadBlob(blob, fileName);
    }

    /**
     * Download Excel template (simplified HTML format)
     */
    downloadExcelTemplate(templateData, fileName) {
        let html = '<table>';
        
        // Add headers
        html += '<tr>';
        templateData.headers.forEach(header => {
            html += `<th>${this.escapeHtml(header)}</th>`;
        });
        html += '</tr>';
        
        // Add sample data
        templateData.data.forEach(row => {
            html += '<tr>';
            row.forEach(cell => {
                html += `<td>${this.escapeHtml(cell)}</td>`;
            });
            html += '</tr>';
        });
        
        html += '</table>';

        const blob = new Blob([html], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        this.downloadBlob(blob, fileName);
    }

    /**
     * Download blob as file
     */
    downloadBlob(blob, fileName) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
    }

    /**
     * Escape HTML characters
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Validate template format
     */
    validateTemplateFormat(format) {
        if (!format || typeof format !== 'string') {
            return false;
        }
        return this.templateFormats.includes(format.toLowerCase());
    }

    /**
     * Get template instructions
     */
    getTemplateInstructions() {
        return {
            title: 'Panduan Penggunaan Template Master Barang',
            instructions: [
                'Download template dalam format CSV atau Excel',
                'Isi data barang sesuai dengan kolom yang tersedia',
                'Pastikan Kode Barang unik dan tidak duplikat',
                'Kategori dan Satuan harus sesuai atau akan dibuat otomatis',
                'Harga dan Stok harus berupa angka',
                'Simpan file dan upload melalui fitur Import'
            ],
            columns: [
                { name: 'Kode Barang', required: true, description: 'Kode unik untuk identifikasi barang' },
                { name: 'Nama Barang', required: true, description: 'Nama lengkap barang' },
                { name: 'Kategori', required: true, description: 'Kategori barang (akan dibuat otomatis jika belum ada)' },
                { name: 'Satuan', required: true, description: 'Satuan barang (PCS, KG, DUS, dll)' },
                { name: 'Harga Beli', required: false, description: 'Harga beli barang (angka)' },
                { name: 'Harga Jual', required: false, description: 'Harga jual barang (angka)' },
                { name: 'Stok', required: false, description: 'Jumlah stok saat ini (angka)' },
                { name: 'Stok Minimum', required: false, description: 'Batas minimum stok (angka)' },
                { name: 'Deskripsi', required: false, description: 'Deskripsi tambahan barang' }
            ]
        };
    }
}

// Make TemplateManager available globally
window.templateManager = new TemplateManager();