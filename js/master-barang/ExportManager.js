/**
 * ExportManager - Handles data export operations for master barang
 * Supports Excel and CSV export formats with filtering options
 */

import { BaseManager } from './BaseManager.js';
import { AuditLogger } from './AuditLogger.js';

export class ExportManager extends BaseManager {
    constructor() {
        super();
        this.auditLogger = new AuditLogger();
    }

    /**
     * Initialize export dialog and setup event handlers
     */
    initializeExportDialog() {
        const exportDialog = document.getElementById('exportDialog');
        if (!exportDialog) {
            this.createExportDialog();
        }
        this.setupEventHandlers();
    }

    /**
     * Create export dialog HTML structure
     */
    createExportDialog() {
        const dialogHTML = `
            <div id="exportDialog" class="modal fade" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Export Data Barang</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Format File:</label>
                                        <select id="exportFormat" class="form-select">
                                            <option value="xlsx">Excel (.xlsx)</option>
                                            <option value="csv">CSV (.csv)</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">Include Headers:</label>
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="includeHeaders" checked>
                                            <label class="form-check-label" for="includeHeaders">
                                                Include column headers
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Columns to Export:</label>
                                <div class="row" id="columnSelection">
                                    <div class="col-md-6">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="col_kode" checked>
                                            <label class="form-check-label" for="col_kode">Kode Barang</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="col_nama" checked>
                                            <label class="form-check-label" for="col_nama">Nama Barang</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="col_kategori" checked>
                                            <label class="form-check-label" for="col_kategori">Kategori</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="col_satuan" checked>
                                            <label class="form-check-label" for="col_satuan">Satuan</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="col_harga_beli" checked>
                                            <label class="form-check-label" for="col_harga_beli">Harga Beli</label>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="col_harga_jual" checked>
                                            <label class="form-check-label" for="col_harga_jual">Harga Jual</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="col_stok" checked>
                                            <label class="form-check-label" for="col_stok">Stok</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="col_stok_minimum" checked>
                                            <label class="form-check-label" for="col_stok_minimum">Stok Minimum</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="col_deskripsi">
                                            <label class="form-check-label" for="col_deskripsi">Deskripsi</label>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="col_status">
                                            <label class="form-check-label" for="col_status">Status</label>
                                        </div>
                                    </div>
                                </div>
                                <div class="mt-2">
                                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="exportManager.selectAllColumns()">
                                        Select All
                                    </button>
                                    <button type="button" class="btn btn-sm btn-outline-secondary" onclick="exportManager.deselectAllColumns()">
                                        Deselect All
                                    </button>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Filter Data:</label>
                                <div class="row">
                                    <div class="col-md-6">
                                        <label class="form-label small">Kategori:</label>
                                        <select id="filterKategori" class="form-select form-select-sm">
                                            <option value="">Semua Kategori</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label small">Satuan:</label>
                                        <select id="filterSatuan" class="form-select form-select-sm">
                                            <option value="">Semua Satuan</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="row mt-2">
                                    <div class="col-md-6">
                                        <label class="form-label small">Status:</label>
                                        <select id="filterStatus" class="form-select form-select-sm">
                                            <option value="">Semua Status</option>
                                            <option value="aktif">Aktif</option>
                                            <option value="nonaktif">Non-aktif</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label small">Stok Rendah:</label>
                                        <div class="form-check form-switch">
                                            <input class="form-check-input" type="checkbox" id="filterStokRendah">
                                            <label class="form-check-label" for="filterStokRendah">
                                                Hanya stok di bawah minimum
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label">Preview:</label>
                                <div class="border rounded p-3 bg-light">
                                    <div class="row">
                                        <div class="col-md-4">
                                            <strong>Total Records:</strong>
                                            <span id="previewTotal" class="badge bg-primary">0</span>
                                        </div>
                                        <div class="col-md-4">
                                            <strong>Filtered Records:</strong>
                                            <span id="previewFiltered" class="badge bg-success">0</span>
                                        </div>
                                        <div class="col-md-4">
                                            <strong>Selected Columns:</strong>
                                            <span id="previewColumns" class="badge bg-info">0</span>
                                        </div>
                                    </div>
                                    <div class="mt-2">
                                        <strong>File Name:</strong>
                                        <span id="previewFileName" class="text-muted">master_barang_export.xlsx</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" id="exportBtn" class="btn btn-success">
                                <i class="fas fa-download"></i> Export Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', dialogHTML);
    }

    /**
     * Setup event handlers for export dialog
     */
    setupEventHandlers() {
        const exportBtn = document.getElementById('exportBtn');
        const formatSelect = document.getElementById('exportFormat');
        
        // Export button click
        exportBtn.addEventListener('click', () => this.startExport());

        // Format change
        formatSelect.addEventListener('change', () => this.updatePreview());

        // Column selection changes
        document.querySelectorAll('#columnSelection input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updatePreview());
        });

        // Filter changes
        ['filterKategori', 'filterSatuan', 'filterStatus', 'filterStokRendah'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.updatePreview());
            }
        });

        // Initial preview update
        this.updatePreview();
    }

    /**
     * Populate filter options
     */
    populateFilterOptions() {
        const kategoriSelect = document.getElementById('filterKategori');
        const satuanSelect = document.getElementById('filterSatuan');

        // Clear existing options (except "Semua")
        kategoriSelect.innerHTML = '<option value="">Semua Kategori</option>';
        satuanSelect.innerHTML = '<option value="">Semua Satuan</option>';

        // Get data from localStorage
        const kategoris = JSON.parse(localStorage.getItem('kategori_barang') || '[]');
        const satuans = JSON.parse(localStorage.getItem('satuan_barang') || '[]');

        // Populate kategori options
        kategoris.forEach(kategori => {
            const option = document.createElement('option');
            option.value = kategori.id;
            option.textContent = kategori.nama;
            kategoriSelect.appendChild(option);
        });

        // Populate satuan options
        satuans.forEach(satuan => {
            const option = document.createElement('option');
            option.value = satuan.id;
            option.textContent = satuan.nama;
            satuanSelect.appendChild(option);
        });
    }

    /**
     * Update export preview
     */
    updatePreview() {
        const data = this.getFilteredData();
        const selectedColumns = this.getSelectedColumns();
        const format = document.getElementById('exportFormat').value;

        // Update preview counts
        document.getElementById('previewTotal').textContent = this.getTotalRecords();
        document.getElementById('previewFiltered').textContent = data.length;
        document.getElementById('previewColumns').textContent = selectedColumns.length;

        // Update file name
        const timestamp = new Date().toISOString().slice(0, 10);
        const fileName = `master_barang_export_${timestamp}.${format}`;
        document.getElementById('previewFileName').textContent = fileName;

        // Enable/disable export button
        const exportBtn = document.getElementById('exportBtn');
        exportBtn.disabled = data.length === 0 || selectedColumns.length === 0;
    }

    /**
     * Get total records count
     */
    getTotalRecords() {
        const barangs = JSON.parse(localStorage.getItem('master_barang') || '[]');
        return barangs.length;
    }

    /**
     * Get filtered data based on current filter settings
     */
    getFilteredData() {
        let barangs = JSON.parse(localStorage.getItem('master_barang') || '[]');

        // Apply kategori filter
        const kategoriFilter = document.getElementById('filterKategori').value;
        if (kategoriFilter) {
            barangs = barangs.filter(b => b.kategori_id === kategoriFilter);
        }

        // Apply satuan filter
        const satuanFilter = document.getElementById('filterSatuan').value;
        if (satuanFilter) {
            barangs = barangs.filter(b => b.satuan_id === satuanFilter);
        }

        // Apply status filter
        const statusFilter = document.getElementById('filterStatus').value;
        if (statusFilter) {
            barangs = barangs.filter(b => b.status === statusFilter);
        }

        // Apply stok rendah filter
        const stokRendahFilter = document.getElementById('filterStokRendah').checked;
        if (stokRendahFilter) {
            barangs = barangs.filter(b => b.stok < b.stok_minimum);
        }

        return barangs;
    }

    /**
     * Get selected columns for export
     */
    getSelectedColumns() {
        const columns = [];
        const columnMapping = {
            'col_kode': { key: 'kode', label: 'Kode Barang' },
            'col_nama': { key: 'nama', label: 'Nama Barang' },
            'col_kategori': { key: 'kategori_nama', label: 'Kategori' },
            'col_satuan': { key: 'satuan_nama', label: 'Satuan' },
            'col_harga_beli': { key: 'harga_beli', label: 'Harga Beli' },
            'col_harga_jual': { key: 'harga_jual', label: 'Harga Jual' },
            'col_stok': { key: 'stok', label: 'Stok' },
            'col_stok_minimum': { key: 'stok_minimum', label: 'Stok Minimum' },
            'col_deskripsi': { key: 'deskripsi', label: 'Deskripsi' },
            'col_status': { key: 'status', label: 'Status' }
        };

        Object.keys(columnMapping).forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox && checkbox.checked) {
                columns.push(columnMapping[id]);
            }
        });

        return columns;
    }

    /**
     * Select all columns
     */
    selectAllColumns() {
        document.querySelectorAll('#columnSelection input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = true;
        });
        this.updatePreview();
    }

    /**
     * Deselect all columns
     */
    deselectAllColumns() {
        document.querySelectorAll('#columnSelection input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        this.updatePreview();
    }

    /**
     * Start export process
     */
    async startExport() {
        try {
            const exportBtn = document.getElementById('exportBtn');
            const originalText = exportBtn.innerHTML;
            
            // Show loading state
            exportBtn.disabled = true;
            exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting...';

            const data = this.getFilteredData();
            const columns = this.getSelectedColumns();
            const format = document.getElementById('exportFormat').value;
            const includeHeaders = document.getElementById('includeHeaders').checked;

            if (data.length === 0) {
                throw new Error('No data to export');
            }

            if (columns.length === 0) {
                throw new Error('No columns selected');
            }

            // Generate export data
            const exportData = this.prepareExportData(data, columns, includeHeaders);

            // Create and download file
            const fileName = this.generateFileName(format);
            
            if (format === 'xlsx') {
                await this.exportToExcel(exportData, fileName, includeHeaders);
            } else {
                this.exportToCSV(exportData, fileName);
            }

            // Log export activity
            await this.auditLogger.log({
                table_name: 'barang',
                action: 'export',
                new_data: {
                    format: format,
                    records_count: data.length,
                    columns_count: columns.length,
                    file_name: fileName,
                    filters: this.getCurrentFilters()
                }
            });

            // Show success message
            this.showSuccessMessage(`Data berhasil diekspor ke ${fileName}`);

            // Close dialog
            const modal = bootstrap.Modal.getInstance(document.getElementById('exportDialog'));
            modal.hide();

        } catch (error) {
            console.error('Export error:', error);
            this.showError('Export failed: ' + error.message);
        } finally {
            // Reset button state
            const exportBtn = document.getElementById('exportBtn');
            exportBtn.disabled = false;
            exportBtn.innerHTML = '<i class="fas fa-download"></i> Export Data';
        }
    }

    /**
     * Prepare data for export
     */
    prepareExportData(data, columns, includeHeaders) {
        const exportData = [];

        // Add headers if requested
        if (includeHeaders) {
            const headers = columns.map(col => col.label);
            exportData.push(headers);
        }

        // Add data rows
        data.forEach(item => {
            const row = columns.map(col => {
                let value = item[col.key];
                
                // Format specific fields
                if (col.key === 'harga_beli' || col.key === 'harga_jual') {
                    value = parseFloat(value) || 0;
                } else if (col.key === 'stok' || col.key === 'stok_minimum') {
                    value = parseInt(value) || 0;
                } else if (value === null || value === undefined) {
                    value = '';
                }
                
                return value;
            });
            exportData.push(row);
        });

        return exportData;
    }

    /**
     * Generate file name with timestamp
     */
    generateFileName(format) {
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '');
        return `master_barang_export_${timestamp}.${format}`;
    }

    /**
     * Generate export file name with filters context
     */
    generateExportFileName(format, filters = {}) {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '-');
        return `export_master_barang_${dateStr}_${timeStr}.${format}`;
    }

    /**
     * Generate template file name
     */
    generateTemplateFileName(format) {
        const dateStr = new Date().toISOString().slice(0, 10);
        return `template_master_barang_${dateStr}.${format}`;
    }

    /**
     * Export data with specified format and filters
     */
    exportData(data, format, filters = {}) {
        try {
            const fileName = this.generateExportFileName(format, filters);
            
            if (format === 'csv') {
                this.exportDataToCSV(data, fileName);
            } else if (format === 'xlsx') {
                this.exportDataToExcel(data, fileName);
            } else {
                throw new Error('Unsupported format: ' + format);
            }
            
            return fileName;
        } catch (error) {
            console.error('Export error:', error);
            throw error;
        }
    }

    /**
     * Export data to CSV format
     */
    exportDataToCSV(data, fileName) {
        const headers = ['Kode', 'Nama', 'Kategori', 'Satuan', 'Harga Beli', 'Harga Jual', 'Stok'];
        const csvContent = [
            headers.join(','),
            ...data.map(item => [
                item.kode || '',
                item.nama || '',
                item.kategori_nama || '',
                item.satuan_nama || '',
                item.harga_beli || 0,
                item.harga_jual || 0,
                item.stok || 0
            ].map(cell => {
                const cellStr = String(cell);
                if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                    return '"' + cellStr.replace(/"/g, '""') + '"';
                }
                return cellStr;
            }).join(','))
        ].join('\n');

        const bom = '\uFEFF';
        const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
        this.downloadBlob(blob, fileName);
    }

    /**
     * Export data to Excel format
     */
    exportDataToExcel(data, fileName) {
        let html = '<table>';
        
        // Add headers
        const headers = ['Kode', 'Nama', 'Kategori', 'Satuan', 'Harga Beli', 'Harga Jual', 'Stok'];
        html += '<tr>';
        headers.forEach(header => {
            html += `<th>${this.escapeHtml(header)}</th>`;
        });
        html += '</tr>';
        
        // Add data
        data.forEach(item => {
            html += '<tr>';
            [
                item.kode || '',
                item.nama || '',
                item.kategori_nama || '',
                item.satuan_nama || '',
                item.harga_beli || 0,
                item.harga_jual || 0,
                item.stok || 0
            ].forEach(cell => {
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
     * Get current filter settings
     */
    getCurrentFilters() {
        return {
            kategori: document.getElementById('filterKategori').value,
            satuan: document.getElementById('filterSatuan').value,
            status: document.getElementById('filterStatus').value,
            stok_rendah: document.getElementById('filterStokRendah').checked
        };
    }

    /**
     * Export to Excel format
     */
    async exportToExcel(data, fileName, includeHeaders) {
        // For Excel export, we'll use a simple approach with HTML table
        // In a real implementation, you might want to use a library like SheetJS
        
        let html = '<table>';
        
        data.forEach((row, index) => {
            const isHeader = includeHeaders && index === 0;
            const tag = isHeader ? 'th' : 'td';
            
            html += '<tr>';
            row.forEach(cell => {
                html += `<${tag}>${this.escapeHtml(cell)}</${tag}>`;
            });
            html += '</tr>';
        });
        
        html += '</table>';

        // Create blob and download
        const blob = new Blob([html], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        this.downloadBlob(blob, fileName);
    }

    /**
     * Export to CSV format
     */
    exportToCSV(data, fileName) {
        const csvContent = data.map(row => 
            row.map(cell => {
                // Escape quotes and wrap in quotes if contains comma, quote, or newline
                const cellStr = String(cell);
                if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                    return '"' + cellStr.replace(/"/g, '""') + '"';
                }
                return cellStr;
            }).join(',')
        ).join('\n');

        // Add BOM for proper UTF-8 encoding in Excel
        const bom = '\uFEFF';
        const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
        
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
        
        // Clean up
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
     * Show success message
     */
    showSuccessMessage(message) {
        // You can implement a toast notification here
        // For now, using a simple alert
        alert(message);
    }

    /**
     * Show error message
     */
    showError(message) {
        alert(message);
    }

    /**
     * Open export dialog
     */
    openExportDialog() {
        this.initializeExportDialog();
        this.populateFilterOptions();
        
        const modal = new bootstrap.Modal(document.getElementById('exportDialog'));
        modal.show();
        
        // Update preview
        this.updatePreview();
    }
}

// Make ExportManager available globally
window.exportManager = new ExportManager();