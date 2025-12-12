/**
 * Template Manager
 * Mengelola template download dan dokumentasi
 * Task 5.3: Add template download and documentation
 */

class TemplateManager {
    constructor() {
        this.templateData = this.generateTemplateData();
        this.documentationData = this.generateDocumentationData();
    }

    /**
     * Generate template data with sample records
     * @returns {Array} Template data
     */
    generateTemplateData() {
        return [
            {
                kode: 'BRG001',
                nama: 'Beras Premium 5kg',
                kategori: 'makanan',
                satuan: 'kg',
                harga_beli: 65000,
                stok: 50,
                supplier: 'PT Beras Sejahtera'
            },
            {
                kode: 'BRG002',
                nama: 'Minyak Goreng 1L',
                kategori: 'makanan',
                satuan: 'liter',
                harga_beli: 15000,
                stok: 100,
                supplier: 'CV Minyak Murni'
            },
            {
                kode: 'BRG003',
                nama: 'Pulpen Biru',
                kategori: 'alat-tulis',
                satuan: 'pcs',
                harga_beli: 2500,
                stok: 200,
                supplier: 'Toko Alat Tulis'
            },
            {
                kode: 'BRG004',
                nama: 'Sabun Cuci Piring 500ml',
                kategori: 'kebersihan',
                satuan: 'botol',
                harga_beli: 8500,
                stok: 75,
                supplier: 'PT Kebersihan Indonesia'
            },
            {
                kode: 'BRG005',
                nama: 'Kopi Instan Sachet',
                kategori: 'minuman',
                satuan: 'pack',
                harga_beli: 12000,
                stok: 150,
                supplier: 'CV Kopi Nusantara'
            }
        ];
    }

    /**
     * Generate documentation data
     * @returns {Object} Documentation structure
     */
    generateDocumentationData() {
        return {
            overview: {
                title: 'Panduan Upload Master Barang Excel',
                description: 'Sistem upload master barang memungkinkan Anda mengelola data barang secara massal menggunakan file Excel atau CSV.',
                features: [
                    'Upload file Excel (.xlsx) atau CSV (.csv)',
                    'Validasi data otomatis',
                    'Preview data sebelum import',
                    'Auto-create kategori dan satuan baru',
                    'Progress tracking real-time',
                    'Audit logging lengkap'
                ]
            },
            fileFormat: {
                title: 'Format File',
                supportedFormats: [
                    {
                        format: 'CSV (.csv)',
                        description: 'File teks dengan pemisah koma',
                        encoding: 'UTF-8',
                        maxSize: '5MB'
                    },
                    {
                        format: 'Excel (.xlsx)',
                        description: 'File Microsoft Excel format baru',
                        encoding: 'UTF-8',
                        maxSize: '5MB'
                    }
                ],
                requirements: [
                    'File harus memiliki header di baris pertama',
                    'Maksimal ukuran file 5MB',
                    'Encoding UTF-8 untuk karakter Indonesia',
                    'Tidak boleh ada baris kosong di tengah data'
                ]
            },
            columns: {
                title: 'Struktur Kolom',
                required: [
                    {
                        name: 'kode',
                        description: 'Kode unik barang',
                        type: 'Text',
                        maxLength: 20,
                        example: 'BRG001',
                        rules: ['Wajib diisi', 'Harus unik', 'Maksimal 20 karakter']
                    },
                    {
                        name: 'nama',
                        description: 'Nama barang',
                        type: 'Text',
                        maxLength: 100,
                        example: 'Beras Premium 5kg',
                        rules: ['Wajib diisi', 'Maksimal 100 karakter']
                    },
                    {
                        name: 'kategori',
                        description: 'Kategori barang',
                        type: 'Text',
                        maxLength: 50,
                        example: 'makanan',
                        rules: ['Wajib diisi', 'Huruf kecil', 'Auto-create jika baru']
                    },
                    {
                        name: 'satuan',
                        description: 'Satuan barang',
                        type: 'Text',
                        maxLength: 20,
                        example: 'kg',
                        rules: ['Wajib diisi', 'Huruf kecil', 'Auto-create jika baru']
                    },
                    {
                        name: 'harga_beli',
                        description: 'Harga beli barang',
                        type: 'Number',
                        example: 65000,
                        rules: ['Wajib diisi', 'Harus positif', 'Tanpa pemisah ribuan']
                    },
                    {
                        name: 'stok',
                        description: 'Stok awal barang',
                        type: 'Number',
                        example: 50,
                        rules: ['Wajib diisi', 'Tidak boleh negatif', 'Bilangan bulat']
                    }
                ],
                optional: [
                    {
                        name: 'supplier',
                        description: 'Nama supplier',
                        type: 'Text',
                        maxLength: 100,
                        example: 'PT Beras Sejahtera',
                        rules: ['Opsional', 'Maksimal 100 karakter']
                    }
                ]
            },
            validation: {
                title: 'Aturan Validasi',
                businessRules: [
                    'Kode barang harus unik dalam file dan sistem',
                    'Harga beli harus lebih besar dari 0',
                    'Stok tidak boleh negatif',
                    'Kategori dan satuan akan dibuat otomatis jika belum ada',
                    'Nama barang tidak boleh kosong'
                ],
                dataTypes: [
                    'kode: String (1-20 karakter)',
                    'nama: String (1-100 karakter)',
                    'kategori: String (1-50 karakter)',
                    'satuan: String (1-20 karakter)',
                    'harga_beli: Number (positif)',
                    'stok: Number (non-negatif)',
                    'supplier: String (0-100 karakter)'
                ]
            },
            troubleshooting: {
                title: 'Troubleshooting',
                commonErrors: [
                    {
                        error: 'File format tidak didukung',
                        solution: 'Pastikan file berformat .xlsx atau .csv',
                        prevention: 'Gunakan template yang disediakan'
                    },
                    {
                        error: 'File terlalu besar',
                        solution: 'Kurangi jumlah data atau bagi menjadi beberapa file',
                        prevention: 'Maksimal 5MB per file'
                    },
                    {
                        error: 'Kode barang duplikat',
                        solution: 'Pastikan setiap kode barang unik',
                        prevention: 'Gunakan sistem penomoran yang konsisten'
                    },
                    {
                        error: 'Harga beli negatif',
                        solution: 'Pastikan harga beli lebih besar dari 0',
                        prevention: 'Periksa format angka dan tanda minus'
                    },
                    {
                        error: 'Header tidak sesuai',
                        solution: 'Gunakan header yang sesuai dengan template',
                        prevention: 'Download dan gunakan template resmi'
                    }
                ]
            },
            examples: {
                title: 'Contoh Data',
                csvExample: `kode,nama,kategori,satuan,harga_beli,stok,supplier
BRG001,Beras Premium 5kg,makanan,kg,65000,50,PT Beras Sejahtera
BRG002,Minyak Goreng 1L,makanan,liter,15000,100,CV Minyak Murni
BRG003,Pulpen Biru,alat-tulis,pcs,2500,200,Toko Alat Tulis`,
                notes: [
                    'Gunakan koma (,) sebagai pemisah kolom',
                    'Jangan gunakan koma dalam nilai data',
                    'Gunakan tanda kutip ("") jika data mengandung koma',
                    'Pastikan encoding UTF-8 untuk karakter Indonesia'
                ]
            }
        };
    }

    /**
     * Download CSV template
     * @param {string} filename - Template filename
     */
    downloadCSVTemplate(filename = 'template_master_barang_excel.csv') {
        try {
            const csvContent = this.generateCSVContent(this.templateData);
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log(`Template CSV downloaded: ${filename}`);
            return true;
        } catch (error) {
            console.error('Error downloading CSV template:', error);
            return false;
        }
    }

    /**
     * Download Excel template
     * @param {string} filename - Template filename
     */
    downloadExcelTemplate(filename = 'template_master_barang_excel.xlsx') {
        try {
            // For now, we'll download as CSV since Excel generation requires additional library
            // In production, you would use a library like SheetJS or ExcelJS
            console.log('Excel template download - using CSV format for now');
            return this.downloadCSVTemplate(filename.replace('.xlsx', '.csv'));
        } catch (error) {
            console.error('Error downloading Excel template:', error);
            return false;
        }
    }

    /**
     * Generate CSV content from data
     * @param {Array} data - Data to convert to CSV
     * @returns {string} CSV content
     */
    generateCSVContent(data) {
        if (!data || data.length === 0) {
            return '';
        }
        
        // Get headers from first object
        const headers = Object.keys(data[0]);
        
        // Create CSV content
        let csvContent = headers.join(',') + '\n';
        
        data.forEach(row => {
            const values = headers.map(header => {
                let value = row[header] || '';
                
                // Escape values that contain commas or quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    value = '"' + value.replace(/"/g, '""') + '"';
                }
                
                return value;
            });
            
            csvContent += values.join(',') + '\n';
        });
        
        return csvContent;
    }

    /**
     * Show documentation modal
     */
    showDocumentation() {
        // Create modal if it doesn't exist
        let modal = document.getElementById('documentationModal');
        if (!modal) {
            modal = this.createDocumentationModal();
        }
        
        // Populate modal content
        this.populateDocumentationModal(modal);
        
        // Show modal
        const bootstrapModal = new bootstrap.Modal(modal);
        bootstrapModal.show();
    }

    /**
     * Create documentation modal
     * @returns {HTMLElement} Modal element
     */
    createDocumentationModal() {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'documentationModal';
        modal.innerHTML = `
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-book me-2"></i>Panduan Upload Master Barang
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="documentationContent">
                        <!-- Content will be populated dynamically -->
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" id="downloadTemplateFromModal">
                            <i class="fas fa-download me-2"></i>Download Template
                        </button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listener for template download from modal
        modal.querySelector('#downloadTemplateFromModal').addEventListener('click', () => {
            this.downloadCSVTemplate();
        });
        
        return modal;
    }

    /**
     * Populate documentation modal with content
     * @param {HTMLElement} modal - Modal element
     */
    populateDocumentationModal(modal) {
        const content = modal.querySelector('#documentationContent');
        const doc = this.documentationData;
        
        content.innerHTML = `
            <!-- Navigation Tabs -->
            <ul class="nav nav-tabs" id="docTabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="overview-tab" data-bs-toggle="tab" data-bs-target="#overview" type="button">
                        <i class="fas fa-info-circle me-1"></i>Overview
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="format-tab" data-bs-toggle="tab" data-bs-target="#format" type="button">
                        <i class="fas fa-file me-1"></i>Format File
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="columns-tab" data-bs-toggle="tab" data-bs-target="#columns" type="button">
                        <i class="fas fa-columns me-1"></i>Struktur Kolom
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="validation-tab" data-bs-toggle="tab" data-bs-target="#validation" type="button">
                        <i class="fas fa-check-circle me-1"></i>Validasi
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="troubleshooting-tab" data-bs-toggle="tab" data-bs-target="#troubleshooting" type="button">
                        <i class="fas fa-tools me-1"></i>Troubleshooting
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="examples-tab" data-bs-toggle="tab" data-bs-target="#examples" type="button">
                        <i class="fas fa-code me-1"></i>Contoh
                    </button>
                </li>
            </ul>
            
            <!-- Tab Content -->
            <div class="tab-content mt-3" id="docTabContent">
                <!-- Overview Tab -->
                <div class="tab-pane fade show active" id="overview" role="tabpanel">
                    <h4>${doc.overview.title}</h4>
                    <p class="lead">${doc.overview.description}</p>
                    
                    <h5>Fitur Utama:</h5>
                    <ul class="list-group list-group-flush">
                        ${doc.overview.features.map(feature => `
                            <li class="list-group-item">
                                <i class="fas fa-check text-success me-2"></i>${feature}
                            </li>
                        `).join('')}
                    </ul>
                </div>
                
                <!-- Format Tab -->
                <div class="tab-pane fade" id="format" role="tabpanel">
                    <h4>${doc.fileFormat.title}</h4>
                    
                    <h5>Format yang Didukung:</h5>
                    <div class="row">
                        ${doc.fileFormat.supportedFormats.map(format => `
                            <div class="col-md-6 mb-3">
                                <div class="card">
                                    <div class="card-body">
                                        <h6 class="card-title">${format.format}</h6>
                                        <p class="card-text">${format.description}</p>
                                        <small class="text-muted">
                                            Encoding: ${format.encoding} | Max Size: ${format.maxSize}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <h5>Persyaratan:</h5>
                    <ul class="list-group">
                        ${doc.fileFormat.requirements.map(req => `
                            <li class="list-group-item">
                                <i class="fas fa-exclamation-triangle text-warning me-2"></i>${req}
                            </li>
                        `).join('')}
                    </ul>
                </div>
                
                <!-- Columns Tab -->
                <div class="tab-pane fade" id="columns" role="tabpanel">
                    <h4>${doc.columns.title}</h4>
                    
                    <h5>Kolom Wajib:</h5>
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Nama Kolom</th>
                                    <th>Deskripsi</th>
                                    <th>Tipe</th>
                                    <th>Contoh</th>
                                    <th>Aturan</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${doc.columns.required.map(col => `
                                    <tr>
                                        <td><code>${col.name}</code></td>
                                        <td>${col.description}</td>
                                        <td><span class="badge bg-primary">${col.type}</span></td>
                                        <td><code>${col.example}</code></td>
                                        <td>
                                            ${col.rules.map(rule => `
                                                <span class="badge bg-secondary me-1">${rule}</span>
                                            `).join('')}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <h5>Kolom Opsional:</h5>
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Nama Kolom</th>
                                    <th>Deskripsi</th>
                                    <th>Tipe</th>
                                    <th>Contoh</th>
                                    <th>Aturan</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${doc.columns.optional.map(col => `
                                    <tr>
                                        <td><code>${col.name}</code></td>
                                        <td>${col.description}</td>
                                        <td><span class="badge bg-secondary">${col.type}</span></td>
                                        <td><code>${col.example}</code></td>
                                        <td>
                                            ${col.rules.map(rule => `
                                                <span class="badge bg-light text-dark me-1">${rule}</span>
                                            `).join('')}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Validation Tab -->
                <div class="tab-pane fade" id="validation" role="tabpanel">
                    <h4>${doc.validation.title}</h4>
                    
                    <h5>Aturan Bisnis:</h5>
                    <ul class="list-group mb-4">
                        ${doc.validation.businessRules.map(rule => `
                            <li class="list-group-item">
                                <i class="fas fa-business-time text-primary me-2"></i>${rule}
                            </li>
                        `).join('')}
                    </ul>
                    
                    <h5>Tipe Data:</h5>
                    <ul class="list-group">
                        ${doc.validation.dataTypes.map(type => `
                            <li class="list-group-item">
                                <code>${type}</code>
                            </li>
                        `).join('')}
                    </ul>
                </div>
                
                <!-- Troubleshooting Tab -->
                <div class="tab-pane fade" id="troubleshooting" role="tabpanel">
                    <h4>${doc.troubleshooting.title}</h4>
                    
                    <div class="accordion" id="troubleshootingAccordion">
                        ${doc.troubleshooting.commonErrors.map((error, index) => `
                            <div class="accordion-item">
                                <h2 class="accordion-header" id="heading${index}">
                                    <button class="accordion-button ${index === 0 ? '' : 'collapsed'}" type="button" 
                                            data-bs-toggle="collapse" data-bs-target="#collapse${index}">
                                        <i class="fas fa-exclamation-triangle text-warning me-2"></i>
                                        ${error.error}
                                    </button>
                                </h2>
                                <div id="collapse${index}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" 
                                     data-bs-parent="#troubleshootingAccordion">
                                    <div class="accordion-body">
                                        <div class="row">
                                            <div class="col-md-6">
                                                <h6><i class="fas fa-tools me-1"></i>Solusi:</h6>
                                                <p>${error.solution}</p>
                                            </div>
                                            <div class="col-md-6">
                                                <h6><i class="fas fa-shield-alt me-1"></i>Pencegahan:</h6>
                                                <p>${error.prevention}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Examples Tab -->
                <div class="tab-pane fade" id="examples" role="tabpanel">
                    <h4>${doc.examples.title}</h4>
                    
                    <h5>Contoh Format CSV:</h5>
                    <pre class="bg-light p-3 rounded"><code>${doc.examples.csvExample}</code></pre>
                    
                    <h5>Catatan Penting:</h5>
                    <ul class="list-group">
                        ${doc.examples.notes.map(note => `
                            <li class="list-group-item">
                                <i class="fas fa-info-circle text-info me-2"></i>${note}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * Show inline help for specific field
     * @param {string} fieldName - Field name to show help for
     * @param {HTMLElement} targetElement - Element to show help near
     */
    showInlineHelp(fieldName, targetElement) {
        const column = this.documentationData.columns.required.find(col => col.name === fieldName) ||
                      this.documentationData.columns.optional.find(col => col.name === fieldName);
        
        if (!column) return;
        
        // Create tooltip or popover
        const helpContent = `
            <div class="help-tooltip">
                <h6>${column.description}</h6>
                <p><strong>Tipe:</strong> ${column.type}</p>
                <p><strong>Contoh:</strong> <code>${column.example}</code></p>
                <div class="help-rules">
                    ${column.rules.map(rule => `<span class="badge bg-info me-1">${rule}</span>`).join('')}
                </div>
            </div>
        `;
        
        // Use Bootstrap tooltip or create custom implementation
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
            new bootstrap.Tooltip(targetElement, {
                title: helpContent,
                html: true,
                placement: 'top'
            });
        }
    }

    /**
     * Get template statistics
     * @returns {Object} Template statistics
     */
    getTemplateStatistics() {
        return {
            recordCount: this.templateData.length,
            columnCount: Object.keys(this.templateData[0] || {}).length,
            categories: [...new Set(this.templateData.map(row => row.kategori))],
            units: [...new Set(this.templateData.map(row => row.satuan))],
            suppliers: [...new Set(this.templateData.map(row => row.supplier).filter(Boolean))]
        };
    }

    /**
     * Validate template structure
     * @param {Array} data - Data to validate against template
     * @returns {Object} Validation result
     */
    validateTemplateStructure(data) {
        if (!data || data.length === 0) {
            return { valid: false, error: 'Data kosong' };
        }
        
        const requiredColumns = this.documentationData.columns.required.map(col => col.name);
        const dataColumns = Object.keys(data[0]);
        
        const missingColumns = requiredColumns.filter(col => !dataColumns.includes(col));
        const extraColumns = dataColumns.filter(col => 
            !requiredColumns.includes(col) && 
            !this.documentationData.columns.optional.map(c => c.name).includes(col)
        );
        
        return {
            valid: missingColumns.length === 0,
            missingColumns,
            extraColumns,
            message: missingColumns.length > 0 ? 
                `Kolom wajib tidak ditemukan: ${missingColumns.join(', ')}` : 
                'Struktur template valid'
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TemplateManager;
}