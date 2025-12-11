/**
 * Upload Master Barang Module
 * Mengelola upload massal data barang dengan kategori dan satuan
 */

class UploadMasterBarangManager {
    constructor() {
        this.uploadedData = [];
        this.validationErrors = [];
        this.categories = [];
        this.units = [];
        this.currentStep = 1;
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.supportedFormats = ['.csv'];
        this.requiredHeaders = ['kode', 'nama', 'kategori', 'satuan', 'harga_beli', 'stok', 'supplier'];
        
        this.init();
    }

    init() {
        this.loadCategories();
        this.loadUnits();
        this.setupEventListeners();
    }

    // Setup event listeners
    setupEventListeners() {
        // File input change
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        // Drag and drop
        this.setupDragAndDrop();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    // Setup drag and drop functionality
    setupDragAndDrop() {
        const dropZone = document.querySelector('.drop-zone');
        if (!dropZone) return;

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        });

        dropZone.addEventListener('click', () => {
            document.getElementById('fileInput')?.click();
        });
    }

    // Handle file selection
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.handleFile(file);
        }
    }

    // Handle file processing
    async handleFile(file) {
        try {
            // Validate file
            this.validateFile(file);
            
            // Read and parse file
            const csvText = await this.readFile(file);
            this.parseCSV(csvText);
            
            // Show preview
            this.showPreview();
            this.updateStep(2);
            
        } catch (error) {
            this.showError('Error processing file: ' + error.message);
        }
    }

    // Validate file
    validateFile(file) {
        // Check file type
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!this.supportedFormats.includes(fileExtension)) {
            throw new Error(`Format file tidak didukung. Gunakan: ${this.supportedFormats.join(', ')}`);
        }

        // Check file size
        if (file.size > this.maxFileSize) {
            throw new Error(`Ukuran file terlalu besar. Maksimal ${this.maxFileSize / (1024 * 1024)}MB`);
        }

        // Check if file is empty
        if (file.size === 0) {
            throw new Error('File kosong');
        }
    }

    // Read file content
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Gagal membaca file'));
            reader.readAsText(file);
        });
    }

    // Parse CSV data
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        
        if (lines.length < 2) {
            throw new Error('File CSV harus memiliki minimal 2 baris (header + data)');
        }

        // Parse headers
        const headers = this.parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
        
        // Validate headers
        this.validateHeaders(headers);

        // Parse data
        this.uploadedData = [];
        const errors = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue; // Skip empty lines

            try {
                const values = this.parseCSVLine(line);
                const item = this.createItemFromCSVRow(headers, values, i + 1);
                this.uploadedData.push(item);
            } catch (error) {
                errors.push(`Baris ${i + 1}: ${error.message}`);
            }
        }

        if (errors.length > 0) {
            throw new Error('Error parsing CSV:\n' + errors.join('\n'));
        }

        if (this.uploadedData.length === 0) {
            throw new Error('Tidak ada data valid ditemukan dalam file');
        }

        // Update record count
        const recordCountElement = document.getElementById('recordCount');
        if (recordCountElement) {
            recordCountElement.textContent = `${this.uploadedData.length} records`;
        }
    }

    // Parse CSV line (handles quoted values)
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    // Validate CSV headers
    validateHeaders(headers) {
        const missingHeaders = this.requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
            throw new Error(`Header yang hilang: ${missingHeaders.join(', ')}\nHeader yang diperlukan: ${this.requiredHeaders.join(', ')}`);
        }
    }

    // Create item object from CSV row
    createItemFromCSVRow(headers, values, lineNumber) {
        if (values.length !== headers.length) {
            throw new Error(`Jumlah kolom tidak sesuai dengan header (expected ${headers.length}, got ${values.length})`);
        }

        const item = {};
        
        headers.forEach((header, index) => {
            item[header] = values[index] ? values[index].replace(/^"|"$/g, '') : ''; // Remove quotes
        });

        // Validate and convert data types
        this.validateAndConvertItem(item, lineNumber);
        
        return item;
    }

    // Validate and convert item data types
    validateAndConvertItem(item, lineNumber) {
        // Required field validation
        if (!item.kode?.trim()) {
            throw new Error('Kode barang wajib diisi');
        }
        if (!item.nama?.trim()) {
            throw new Error('Nama barang wajib diisi');
        }

        // Convert numeric fields
        item.harga_beli = this.parseNumber(item.harga_beli, 'Harga beli');
        item.stok = this.parseInteger(item.stok, 'Stok');

        // Validate numeric ranges
        if (item.harga_beli < 0) {
            throw new Error('Harga beli tidak boleh negatif');
        }
        if (item.stok < 0) {
            throw new Error('Stok tidak boleh negatif');
        }

        // Clean and validate text fields
        item.kode = item.kode.trim().toUpperCase();
        item.nama = item.nama.trim();
        item.kategori = item.kategori?.trim().toLowerCase() || '';
        item.satuan = item.satuan?.trim().toLowerCase() || '';
        item.supplier = item.supplier?.trim() || '';

        if (!item.kategori) {
            throw new Error('Kategori wajib diisi');
        }
        if (!item.satuan) {
            throw new Error('Satuan wajib diisi');
        }
    }

    // Parse number with validation
    parseNumber(value, fieldName) {
        if (!value || value === '') return 0;
        
        const num = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
        if (isNaN(num)) {
            throw new Error(`${fieldName} harus berupa angka valid`);
        }
        return num;
    }

    // Parse integer with validation
    parseInteger(value, fieldName) {
        if (!value || value === '') return 0;
        
        const num = parseInt(value.toString().replace(/[^\d-]/g, ''));
        if (isNaN(num)) {
            throw new Error(`${fieldName} harus berupa angka bulat valid`);
        }
        return num;
    }

    // Show preview
    showPreview() {
        this.hideAllSections();
        document.getElementById('previewSection').style.display = 'block';
        this.renderPreviewTable();
        this.updateStep(2);
    }

    // Render preview table
    renderPreviewTable() {
        const tbody = document.getElementById('previewTableBody');
        if (!tbody) return;

        tbody.innerHTML = '';

        this.uploadedData.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${this.escapeHtml(item.kode)}</strong></td>
                <td>${this.escapeHtml(item.nama)}</td>
                <td><span class="badge bg-secondary category-badge">${this.escapeHtml(item.kategori)}</span></td>
                <td><span class="badge bg-info category-badge">${this.escapeHtml(item.satuan)}</span></td>
                <td>Rp ${this.formatRupiah(item.harga_beli)}</td>
                <td>${item.stok}</td>
                <td>${this.escapeHtml(item.supplier)}</td>
            `;
            tbody.appendChild(row);
        });
    }

    // Validate data for import
    async validateData() {
        this.validationErrors = [];
        
        try {
            const existingItems = await this.getExistingItems();
            const existingCodes = existingItems.map(item => item.kode);
            const uploadCodes = new Set();

            this.uploadedData.forEach((item, index) => {
                const errors = [];
                const warnings = [];

                // Check for duplicates within upload
                if (uploadCodes.has(item.kode)) {
                    errors.push('Kode duplikat dalam file upload');
                } else {
                    uploadCodes.add(item.kode);
                }

                // Check for existing items
                if (existingCodes.includes(item.kode)) {
                    warnings.push('Kode sudah ada, akan diupdate');
                }

                // Check category and unit existence
                if (!this.categories.includes(item.kategori)) {
                    warnings.push(`Kategori "${item.kategori}" baru akan dibuat`);
                }
                if (!this.units.includes(item.satuan)) {
                    warnings.push(`Satuan "${item.satuan}" baru akan dibuat`);
                }

                // Additional business validations
                if (item.harga_beli > 10000000) { // 10 million
                    warnings.push('Harga beli sangat tinggi, pastikan benar');
                }
                if (item.stok > 10000) {
                    warnings.push('Stok sangat tinggi, pastikan benar');
                }

                if (errors.length > 0 || warnings.length > 0) {
                    this.validationErrors.push({
                        index: index,
                        item: item,
                        errors: errors,
                        warnings: warnings
                    });
                }
            });

            this.showValidationResults();
            this.updateStep(3);

        } catch (error) {
            this.showError('Error during validation: ' + error.message);
        }
    }

    // Show validation results
    showValidationResults() {
        this.hideAllSections();
        document.getElementById('validationSection').style.display = 'block';

        const resultsContainer = document.getElementById('validationResults');
        if (!resultsContainer) return;

        resultsContainer.innerHTML = '';

        if (this.validationErrors.length === 0) {
            resultsContainer.innerHTML = `
                <div class="alert alert-success validation-success">
                    <h6><i class="fas fa-check-circle me-2"></i>Validasi Berhasil</h6>
                    <p class="mb-0">Semua data valid dan siap untuk diimport (${this.uploadedData.length} items).</p>
                </div>
            `;
            this.enableImportButton();
        } else {
            const errorCount = this.validationErrors.filter(e => e.errors.length > 0).length;
            const warningCount = this.validationErrors.filter(e => e.warnings.length > 0 && e.errors.length === 0).length;

            let summaryHtml = `
                <div class="alert ${errorCount > 0 ? 'alert-danger validation-error' : 'alert-warning validation-warning'}">
                    <h6><i class="fas fa-exclamation-triangle me-2"></i>Hasil Validasi</h6>
                    <p class="mb-0">
                        Total items: ${this.uploadedData.length} | 
                        ${errorCount > 0 ? `Errors: ${errorCount} | ` : ''}
                        ${warningCount > 0 ? `Warnings: ${warningCount}` : ''}
                    </p>
                </div>
            `;

            // Show detailed validation results
            this.validationErrors.forEach(validation => {
                const hasErrors = validation.errors.length > 0;
                summaryHtml += `
                    <div class="alert ${hasErrors ? 'alert-danger' : 'alert-warning'} py-2 mb-2">
                        <strong>Baris ${validation.index + 2}: ${this.escapeHtml(validation.item.kode)} - ${this.escapeHtml(validation.item.nama)}</strong>
                        ${validation.errors.map(error => `<div class="text-danger small"><i class="fas fa-times me-1"></i>${this.escapeHtml(error)}</div>`).join('')}
                        ${validation.warnings.map(warning => `<div class="text-warning small"><i class="fas fa-exclamation-triangle me-1"></i>${this.escapeHtml(warning)}</div>`).join('')}
                    </div>
                `;
            });

            resultsContainer.innerHTML = summaryHtml;
            
            if (errorCount > 0) {
                this.disableImportButton();
            } else {
                this.enableImportButton();
            }
        }
    }

    // Import data
    async importData() {
        try {
            this.hideAllSections();
            document.getElementById('progressSection').style.display = 'block';
            this.updateStep(4);

            const result = await this.processImport();
            this.showResults(result);

        } catch (error) {
            this.showError('Import failed: ' + error.message);
        }
    }

    // Process import with progress tracking
    async processImport() {
        const progressBar = document.getElementById('importProgress');
        const statusDiv = document.getElementById('importStatus');
        
        let imported = 0;
        let updated = 0;
        let failed = 0;
        const failedItems = [];

        // Load existing data
        const existingItems = await this.getExistingItems();
        const existingMap = new Map(existingItems.map(item => [item.kode, item]));

        // Process each item
        for (let i = 0; i < this.uploadedData.length; i++) {
            const item = this.uploadedData[i];
            const progress = ((i + 1) / this.uploadedData.length) * 100;
            
            // Update progress
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
                progressBar.textContent = `${Math.round(progress)}%`;
            }
            if (statusDiv) {
                statusDiv.textContent = `Processing ${item.kode} - ${item.nama}...`;
            }

            try {
                // Add/update categories and units
                await this.addCategoryIfNotExists(item.kategori);
                await this.addUnitIfNotExists(item.satuan);

                // Prepare item data
                const itemData = {
                    kode: item.kode,
                    nama: item.nama,
                    kategori: item.kategori,
                    satuan: item.satuan,
                    hargaBeli: item.harga_beli,
                    stok: item.stok,
                    supplier: item.supplier,
                    tanggalBuat: existingMap.has(item.kode) ? 
                        existingMap.get(item.kode).tanggalBuat : 
                        new Date().toISOString(),
                    tanggalUpdate: new Date().toISOString()
                };

                if (existingMap.has(item.kode)) {
                    // Update existing item
                    existingMap.set(item.kode, { ...existingMap.get(item.kode), ...itemData });
                    updated++;
                } else {
                    // Add new item
                    existingMap.set(item.kode, itemData);
                    imported++;
                }

                // Simulate processing delay for better UX
                await this.delay(30);

            } catch (error) {
                console.error(`Error processing ${item.kode}:`, error);
                failed++;
                failedItems.push({
                    item: item,
                    error: error.message
                });
            }
        }

        // Save to localStorage
        const finalData = Array.from(existingMap.values());
        await this.saveMasterBarang(finalData);

        // Log activity
        this.logActivity({
            timestamp: new Date().toISOString(),
            user: this.getCurrentUser(),
            action: 'BULK_IMPORT_MASTER_BARANG',
            details: `Import ${imported} new items, updated ${updated} items, ${failed} failed`,
            data: { 
                imported, 
                updated, 
                failed, 
                total: this.uploadedData.length,
                failedItems: failedItems
            }
        });

        return { imported, updated, failed, failedItems };
    }

    // Show import results
    showResults(result) {
        this.hideAllSections();
        document.getElementById('resultsSection').style.display = 'block';

        const { imported, updated, failed, failedItems } = result;
        const isSuccess = failed === 0;
        
        const resultsHeader = document.getElementById('resultsHeader');
        if (resultsHeader) {
            resultsHeader.className = `card-header text-white ${isSuccess ? 'bg-success' : 'bg-warning'}`;
        }

        const resultsContent = document.getElementById('resultsContent');
        if (!resultsContent) return;

        let resultsHtml = `
            <div class="row">
                <div class="col-md-4">
                    <div class="text-center">
                        <h4 class="text-success">${imported}</h4>
                        <small class="text-muted">Items Baru</small>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="text-center">
                        <h4 class="text-info">${updated}</h4>
                        <small class="text-muted">Items Diupdate</small>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="text-center">
                        <h4 class="text-danger">${failed}</h4>
                        <small class="text-muted">Gagal</small>
                    </div>
                </div>
            </div>
            <div class="alert ${isSuccess ? 'alert-success' : 'alert-warning'} mt-3">
                <h6><i class="fas ${isSuccess ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-2"></i>
                    ${isSuccess ? 'Import Berhasil!' : 'Import Selesai dengan Peringatan'}
                </h6>
                <p class="mb-0">
                    ${isSuccess ? 
                        'Semua data berhasil diimport ke master barang.' : 
                        `Import selesai dengan ${failed} item yang gagal diproses.`
                    }
                </p>
            </div>
        `;

        // Show failed items if any
        if (failed > 0 && failedItems.length > 0) {
            resultsHtml += `
                <div class="alert alert-danger mt-3">
                    <h6>Items yang Gagal:</h6>
                    <ul class="mb-0">
                        ${failedItems.map(item => 
                            `<li>${this.escapeHtml(item.item.kode)} - ${this.escapeHtml(item.item.nama)}: ${this.escapeHtml(item.error)}</li>`
                        ).join('')}
                    </ul>
                </div>
            `;
        }

        resultsContent.innerHTML = resultsHtml;
    }

    // Category and Unit Management
    loadCategories() {
        const stored = localStorage.getItem('masterBarangCategories');
        this.categories = stored ? JSON.parse(stored) : [
            'makanan', 'minuman', 'alat-tulis', 'elektronik', 'kebersihan', 'lainnya'
        ];
    }

    loadUnits() {
        const stored = localStorage.getItem('masterBarangUnits');
        this.units = stored ? JSON.parse(stored) : [
            'pcs', 'kg', 'gram', 'liter', 'ml', 'box', 'pack', 'botol', 'kaleng', 'meter'
        ];
    }

    async addCategoryIfNotExists(category) {
        const lowerCategory = category.toLowerCase();
        if (!this.categories.includes(lowerCategory)) {
            this.categories.push(lowerCategory);
            localStorage.setItem('masterBarangCategories', JSON.stringify(this.categories));
        }
    }

    async addUnitIfNotExists(unit) {
        const lowerUnit = unit.toLowerCase();
        if (!this.units.includes(lowerUnit)) {
            this.units.push(lowerUnit);
            localStorage.setItem('masterBarangUnits', JSON.stringify(this.units));
        }
    }

    // Data management
    async getExistingItems() {
        const stored = localStorage.getItem('masterBarang');
        return stored ? JSON.parse(stored) : [];
    }

    async saveMasterBarang(data) {
        localStorage.setItem('masterBarang', JSON.stringify(data));
    }

    // UI Management
    updateStep(step) {
        for (let i = 1; i <= 4; i++) {
            const stepElement = document.getElementById(`step${i}`);
            if (stepElement) {
                stepElement.classList.remove('active', 'completed');
                
                if (i < step) {
                    stepElement.classList.add('completed');
                } else if (i === step) {
                    stepElement.classList.add('active');
                }
            }
        }
        this.currentStep = step;
    }

    hideAllSections() {
        const sections = [
            'uploadSection', 'previewSection', 'validationSection', 
            'progressSection', 'resultsSection'
        ];
        
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.style.display = 'none';
            }
        });
    }

    enableImportButton() {
        const importBtn = document.getElementById('importBtn');
        if (importBtn) {
            importBtn.disabled = false;
        }
    }

    disableImportButton() {
        const importBtn = document.getElementById('importBtn');
        if (importBtn) {
            importBtn.disabled = true;
        }
    }

    // Reset upload process
    resetUpload() {
        this.uploadedData = [];
        this.validationErrors = [];
        
        this.hideAllSections();
        document.getElementById('uploadSection').style.display = 'block';
        
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
        }
        
        this.updateStep(1);
    }

    // Generate CSV template
    generateTemplate() {
        const template = [
            this.requiredHeaders.join(','),
            'BRG001,"Beras Premium 5kg",makanan,kg,65000,50,"PT Beras Sejahtera"',
            'BRG002,"Minyak Goreng 1L",makanan,botol,15000,30,"CV Minyak Murni"',
            'BRG003,"Pulpen Pilot Hitam",alat-tulis,pcs,3000,100,"Toko ATK Lengkap"',
            'BRG004,"Air Mineral 600ml",minuman,botol,2500,200,"PT Air Bersih"'
        ].join('\n');

        return template;
    }

    downloadTemplate() {
        const template = this.generateTemplate();
        const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'template_master_barang.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    // Error handling
    showError(message) {
        console.error('Upload Error:', message);
        alert(message); // Simple error display - could be enhanced with better UI
    }

    // Keyboard shortcuts
    handleKeyboardShortcuts(e) {
        if (e.ctrlKey && e.key === 'u') {
            e.preventDefault();
            document.getElementById('fileInput')?.click();
        }
        
        if (e.key === 'Escape') {
            // Could add escape functionality
        }
    }

    // Utility functions
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    formatRupiah(amount) {
        return new Intl.NumberFormat('id-ID').format(amount);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getCurrentUser() {
        return localStorage.getItem('currentUser') || 'Admin';
    }

    logActivity(entry) {
        const logs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
        logs.push(entry);
        // Limit logs to prevent storage overflow
        if (logs.length > 1000) {
            logs.splice(0, logs.length - 1000);
        }
        localStorage.setItem('activityLogs', JSON.stringify(logs));
    }

    // Public API methods
    getUploadStats() {
        return {
            totalUploaded: this.uploadedData.length,
            validationErrors: this.validationErrors.length,
            currentStep: this.currentStep,
            categories: this.categories.length,
            units: this.units.length
        };
    }

    getValidationSummary() {
        const errorCount = this.validationErrors.filter(e => e.errors.length > 0).length;
        const warningCount = this.validationErrors.filter(e => e.warnings.length > 0 && e.errors.length === 0).length;
        
        return {
            totalItems: this.uploadedData.length,
            errors: errorCount,
            warnings: warningCount,
            canImport: errorCount === 0
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UploadMasterBarangManager;
}