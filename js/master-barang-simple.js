/**
 * Master Barang Simple Functions
 * Fallback functions for import/export if complex managers are not available
 */

// Simple template download function
function downloadTemplate(format) {
    try {
        const templateData = generateTemplateData();
        const fileName = `template_master_barang_${new Date().toISOString().slice(0, 10)}.${format}`;
        
        if (format === 'csv') {
            downloadCSVTemplate(templateData, fileName);
        } else if (format === 'excel' || format === 'xlsx') {
            downloadExcelTemplate(templateData, fileName);
        }
    } catch (error) {
        console.error('Error downloading template:', error);
        alert('Gagal mendownload template: ' + error.message);
    }
}

// Generate template data
function generateTemplateData() {
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

// Download CSV template
function downloadCSVTemplate(templateData, fileName) {
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
    
    downloadBlob(blob, fileName);
}

// Download Excel template (simplified HTML format)
function downloadExcelTemplate(templateData, fileName) {
    let html = '<table>';
    
    // Add headers
    html += '<tr>';
    templateData.headers.forEach(header => {
        html += `<th>${escapeHtml(header)}</th>`;
    });
    html += '</tr>';
    
    // Add sample data
    templateData.data.forEach(row => {
        html += '<tr>';
        row.forEach(cell => {
            html += `<td>${escapeHtml(cell)}</td>`;
        });
        html += '</tr>';
    });
    
    html += '</table>';

    const blob = new Blob([html], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    downloadBlob(blob, fileName);
}

// Simple export data function
function exportData() {
    try {
        const format = document.getElementById('export-format')?.value || 'excel';
        const exportAll = document.getElementById('export-all')?.checked || true;
        
        // Get data to export
        let dataToExport = JSON.parse(localStorage.getItem('master_barang') || '[]');
        
        if (dataToExport.length === 0) {
            alert('Tidak ada data untuk diekspor');
            return;
        }
        
        const fileName = `export_master_barang_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}.${format}`;
        
        if (format === 'csv') {
            exportToCSV(dataToExport, fileName);
        } else if (format === 'excel' || format === 'xlsx') {
            exportToExcel(dataToExport, fileName);
        } else if (format === 'json') {
            exportToJSON(dataToExport, fileName);
        }
        
        alert(`Data berhasil diekspor ke file: ${fileName}`);
        
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Gagal mengekspor data: ' + error.message);
    }
}

// Export to CSV
function exportToCSV(data, fileName) {
    const headers = ['Kode', 'Nama', 'Kategori', 'Satuan', 'Harga Beli', 'Harga Jual', 'Stok', 'Stok Minimum', 'Deskripsi'];
    const csvContent = [
        headers.join(','),
        ...data.map(item => [
            item.kode || '',
            item.nama || '',
            item.kategori_nama || '',
            item.satuan_nama || '',
            item.harga_beli || 0,
            item.harga_jual || 0,
            item.stok || 0,
            item.stok_minimum || 0,
            item.deskripsi || ''
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
    downloadBlob(blob, fileName);
}

// Export to Excel
function exportToExcel(data, fileName) {
    let html = '<table>';
    
    // Add headers
    const headers = ['Kode', 'Nama', 'Kategori', 'Satuan', 'Harga Beli', 'Harga Jual', 'Stok', 'Stok Minimum', 'Deskripsi'];
    html += '<tr>';
    headers.forEach(header => {
        html += `<th>${escapeHtml(header)}</th>`;
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
            item.stok || 0,
            item.stok_minimum || 0,
            item.deskripsi || ''
        ].forEach(cell => {
            html += `<td>${escapeHtml(cell)}</td>`;
        });
        html += '</tr>';
    });
    
    html += '</table>';

    const blob = new Blob([html], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    downloadBlob(blob, fileName);
}

// Export to JSON
function exportToJSON(data, fileName) {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    downloadBlob(blob, fileName);
}

// Simple import dialog
function openImportDialog() {
    const importDialog = `
        <div class="modal fade" id="simpleImportModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Import Data Barang</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <h6><i class="fas fa-info-circle"></i> Panduan Import:</h6>
                            <ol>
                                <li>Download template terlebih dahulu</li>
                                <li>Isi data sesuai format template</li>
                                <li>Upload file yang sudah diisi</li>
                                <li>Pastikan format data sudah benar</li>
                            </ol>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Download Template:</label>
                            <div class="d-grid gap-2">
                                <button class="btn btn-outline-success" onclick="downloadTemplate('excel')">
                                    <i class="fas fa-file-excel"></i> Template Excel
                                </button>
                                <button class="btn btn-outline-info" onclick="downloadTemplate('csv')">
                                    <i class="fas fa-file-csv"></i> Template CSV
                                </button>
                            </div>
                        </div>
                        
                        <hr>
                        
                        <div class="mb-3">
                            <label for="simpleImportFile" class="form-label">Upload File:</label>
                            <input type="file" id="simpleImportFile" class="form-control" 
                                   accept=".xlsx,.xls,.csv">
                            <div class="form-text">
                                Format yang didukung: Excel (.xlsx, .xls) dan CSV (.csv)
                            </div>
                        </div>
                        
                        <div class="alert alert-warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            <strong>Catatan:</strong> Fitur import sederhana ini memerlukan validasi manual. 
                            Pastikan data sudah sesuai format sebelum menggunakan.
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                        <button type="button" class="btn btn-primary" onclick="processSimpleImport()">
                            <i class="fas fa-upload"></i> Proses Import
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('simpleImportModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', importDialog);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('simpleImportModal'));
    modal.show();
}

// Simple export dialog
function openExportDialog() {
    const exportDialog = `
        <div class="modal fade" id="simpleExportModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Export Data Barang</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">Format Export:</label>
                            <select id="simpleExportFormat" class="form-select">
                                <option value="excel">Excel (.xlsx)</option>
                                <option value="csv">CSV (.csv)</option>
                                <option value="json">JSON (.json)</option>
                            </select>
                        </div>
                        
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i>
                            Data yang akan diekspor: <strong id="exportDataCount">0</strong> barang
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="button" class="btn btn-success" onclick="processSimpleExport()">
                            <i class="fas fa-download"></i> Export
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('simpleExportModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', exportDialog);
    
    // Update data count
    const dataCount = JSON.parse(localStorage.getItem('master_barang') || '[]').length;
    setTimeout(() => {
        const countElement = document.getElementById('exportDataCount');
        if (countElement) {
            countElement.textContent = dataCount;
        }
    }, 100);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('simpleExportModal'));
    modal.show();
}

// Process simple import
function processSimpleImport() {
    const fileInput = document.getElementById('simpleImportFile');
    const file = fileInput?.files[0];
    
    if (!file) {
        alert('Pilih file yang akan diimport');
        return;
    }
    
    alert('Fitur import sedang dalam pengembangan. Silakan gunakan fitur import yang lebih lengkap.');
}

// Process simple export
function processSimpleExport() {
    const format = document.getElementById('simpleExportFormat')?.value || 'excel';
    
    try {
        const data = JSON.parse(localStorage.getItem('master_barang') || '[]');
        
        if (data.length === 0) {
            alert('Tidak ada data untuk diekspor');
            return;
        }
        
        const fileName = `export_master_barang_${new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')}.${format}`;
        
        if (format === 'csv') {
            exportToCSV(data, fileName);
        } else if (format === 'excel') {
            exportToExcel(data, fileName);
        } else if (format === 'json') {
            exportToJSON(data, fileName);
        }
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('simpleExportModal'));
        if (modal) {
            modal.hide();
        }
        
        alert(`Data berhasil diekspor ke file: ${fileName}`);
        
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Gagal mengekspor data: ' + error.message);
    }
}

// Utility functions
function downloadBlob(blob, fileName) {
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show section function
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    // Update navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // Find and activate the clicked nav link
    const activeLink = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

// Handle file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        // Show preview section
        const previewSection = document.getElementById('import-preview');
        if (previewSection) {
            previewSection.style.display = 'block';
            
            // Show file info
            const previewHeader = document.getElementById('preview-header');
            const previewBody = document.getElementById('preview-body');
            
            if (previewHeader && previewBody) {
                previewHeader.innerHTML = '<tr><th colspan="100%">File: ' + file.name + ' (Size: ' + formatFileSize(file.size) + ')</th></tr>';
                previewBody.innerHTML = '<tr><td colspan="100%" class="text-center text-muted">Preview akan tersedia setelah implementasi parser file</td></tr>';
            }
        }
    }
}

// Cancel import
function cancelImport() {
    const importPreview = document.getElementById('import-preview');
    if (importPreview) {
        importPreview.style.display = 'none';
    }
    const fileInput = document.getElementById('import-file');
    if (fileInput) {
        fileInput.value = '';
    }
}

// Process import
function processImport() {
    alert('Fitur import sedang dalam pengembangan. Gunakan dialog import yang lebih lengkap.');
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Show help
function showHelp() {
    const helpContent = `
        <div class="modal fade" id="helpModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Bantuan Master Barang</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <h6>Fitur Import Data:</h6>
                        <ul>
                            <li>Download template Excel atau CSV</li>
                            <li>Isi data sesuai format template</li>
                            <li>Upload file melalui tombol Import Data</li>
                            <li>Preview dan validasi data sebelum import</li>
                        </ul>
                        
                        <h6>Fitur Export Data:</h6>
                        <ul>
                            <li>Pilih format export (Excel, CSV, JSON)</li>
                            <li>Tentukan filter data yang akan diekspor</li>
                            <li>Download file hasil export</li>
                        </ul>
                        
                        <h6>Template Download:</h6>
                        <ul>
                            <li>Template Excel: Format .xlsx dengan contoh data</li>
                            <li>Template CSV: Format .csv yang kompatibel</li>
                        </ul>
                        
                        <h6>Format Data Template:</h6>
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Kolom</th>
                                    <th>Wajib</th>
                                    <th>Keterangan</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td>Kode Barang</td><td>Ya</td><td>Kode unik barang</td></tr>
                                <tr><td>Nama Barang</td><td>Ya</td><td>Nama lengkap barang</td></tr>
                                <tr><td>Kategori</td><td>Ya</td><td>Kategori barang</td></tr>
                                <tr><td>Satuan</td><td>Ya</td><td>Satuan barang (PCS, KG, dll)</td></tr>
                                <tr><td>Harga Beli</td><td>Tidak</td><td>Harga beli (angka)</td></tr>
                                <tr><td>Harga Jual</td><td>Tidak</td><td>Harga jual (angka)</td></tr>
                                <tr><td>Stok</td><td>Tidak</td><td>Jumlah stok (angka)</td></tr>
                                <tr><td>Stok Minimum</td><td>Tidak</td><td>Batas minimum stok</td></tr>
                                <tr><td>Deskripsi</td><td>Tidak</td><td>Deskripsi tambahan</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('helpModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', helpContent);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('helpModal'));
    modal.show();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Show default section
    showSection('data-table');
    
    console.log('Master Barang Simple Import/Export system initialized');
});