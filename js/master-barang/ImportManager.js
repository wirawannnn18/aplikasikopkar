/**
 * ImportManager - Handles file upload and import operations for master barang
 * Supports Excel and CSV file formats with validation and preview functionality
 */

import { BaseManager } from './BaseManager.js';
import { ValidationEngine } from './ValidationEngine.js';
import { AuditLogger } from './AuditLogger.js';
import { FileProcessor } from './FileProcessor.js';

export class ImportManager extends BaseManager {
    constructor() {
        super();
        this.validationEngine = new ValidationEngine();
        this.auditLogger = new AuditLogger();
        this.fileProcessor = new FileProcessor();
        this.currentFile = null;
        this.previewData = null;
        this.columnMapping = {};
        this.newCategories = [];
        this.newUnits = [];
    }

    /**
     * Initialize import dialog and setup event handlers
     */
    initializeImportDialog() {
        const importDialog = document.getElementById('importDialog');
        if (!importDialog) {
            this.createImportDialog();
        }
        this.setupEventHandlers();
    }

    /**
     * Create import dialog HTML structure
     */
    createImportDialog() {
        const dialogHTML = `
            <div id="importDialog" class="modal fade" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Import Data Barang</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <!-- Step 1: File Upload -->
                            <div id="uploadStep" class="import-step">
                                <h6>Step 1: Upload File</h6>
                                <div class="upload-area" id="uploadArea">
                                    <div class="upload-content">
                                        <i class="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                                        <p class="mb-2">Drag & drop file Excel/CSV atau klik untuk browse</p>
                                        <p class="text-muted small">Format yang didukung: .xlsx, .xls, .csv (Max: 10MB)</p>
                                        <input type="file" id="fileInput" accept=".xlsx,.xls,.csv" style="display: none;">
                                        <button type="button" class="btn btn-outline-primary" onclick="document.getElementById('fileInput').click()">
                                            <i class="fas fa-folder-open"></i> Browse File
                                        </button>
                                    </div>
                                </div>
                                <div id="fileInfo" class="mt-3" style="display: none;">
                                    <div class="alert alert-info">
                                        <strong>File Selected:</strong> <span id="fileName"></span><br>
                                        <strong>Size:</strong> <span id="fileSize"></span><br>
                                        <strong>Type:</strong> <span id="fileType"></span>
                                    </div>
                                </div>
                            </div>

                            <!-- Step 2: Preview & Column Mapping -->
                            <div id="previewStep" class="import-step" style="display: none;">
                                <h6>Step 2: Preview Data & Column Mapping</h6>
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label class="form-label">Sheet (untuk Excel):</label>
                                        <select id="sheetSelect" class="form-select">
                                            <option value="">Pilih Sheet...</option>
                                        </select>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Header Row:</label>
                                        <input type="number" id="headerRow" class="form-control" value="1" min="1">
                                    </div>
                                </div>
                                
                                <div class="table-responsive" style="max-height: 400px;">
                                    <table id="previewTable" class="table table-sm table-bordered">
                                        <thead id="previewHeader"></thead>
                                        <tbody id="previewBody"></tbody>
                                    </table>
                                </div>

                                <div class="mt-3">
                                    <h6>Column Mapping:</h6>
                                    <div id="columnMapping" class="row"></div>
                                </div>
                            </div>

                            <!-- Step 3: Validation & Confirmation -->
                            <div id="confirmStep" class="import-step" style="display: none;">
                                <h6>Step 3: Validation & Confirmation</h6>
                                
                                <div id="validationResults" class="mb-3"></div>
                                
                                <div id="newDataConfirmation" style="display: none;">
                                    <div class="alert alert-warning">
                                        <h6><i class="fas fa-exclamation-triangle"></i> Data Baru Ditemukan</h6>
                                        <div id="newCategoriesSection" style="display: none;">
                                            <strong>Kategori Baru:</strong>
                                            <ul id="newCategoriesList"></ul>
                                        </div>
                                        <div id="newUnitsSection" style="display: none;">
                                            <strong>Satuan Baru:</strong>
                                            <ul id="newUnitsList"></ul>
                                        </div>
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="confirmNewData">
                                            <label class="form-check-label" for="confirmNewData">
                                                Saya konfirmasi untuk membuat kategori/satuan baru tersebut
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div class="import-summary">
                                    <div class="row text-center">
                                        <div class="col-md-3">
                                            <div class="card bg-primary text-white">
                                                <div class="card-body">
                                                    <h5 id="totalRows">0</h5>
                                                    <small>Total Rows</small>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-3">
                                            <div class="card bg-success text-white">
                                                <div class="card-body">
                                                    <h5 id="validRows">0</h5>
                                                    <small>Valid Rows</small>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-3">
                                            <div class="card bg-warning text-white">
                                                <div class="card-body">
                                                    <h5 id="warningRows">0</h5>
                                                    <small>Warnings</small>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-3">
                                            <div class="card bg-danger text-white">
                                                <div class="card-body">
                                                    <h5 id="errorRows">0</h5>
                                                    <small>Errors</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Step 4: Import Progress -->
                            <div id="progressStep" class="import-step" style="display: none;">
                                <h6>Step 4: Import Progress</h6>
                                <div class="progress mb-3">
                                    <div id="importProgress" class="progress-bar progress-bar-striped progress-bar-animated" 
                                         role="progressbar" style="width: 0%"></div>
                                </div>
                                <div id="progressText" class="text-center">Memulai import...</div>
                                <div id="importResults" class="mt-3" style="display: none;"></div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" id="prevStepBtn" class="btn btn-outline-primary" style="display: none;">
                                <i class="fas fa-arrow-left"></i> Previous
                            </button>
                            <button type="button" id="nextStepBtn" class="btn btn-primary" disabled>
                                Next <i class="fas fa-arrow-right"></i>
                            </button>
                            <button type="button" id="importBtn" class="btn btn-success" style="display: none;">
                                <i class="fas fa-upload"></i> Start Import
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', dialogHTML);
    }

    /**
     * Setup event handlers for import dialog
     */
    setupEventHandlers() {
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        const nextStepBtn = document.getElementById('nextStepBtn');
        const prevStepBtn = document.getElementById('prevStepBtn');
        const importBtn = document.getElementById('importBtn');

        // File input change
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files[0]));

        // Drag & drop functionality
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file) {
                this.handleFileSelect(file);
            }
        });

        // Navigation buttons
        nextStepBtn.addEventListener('click', () => this.nextStep());
        prevStepBtn.addEventListener('click', () => this.prevStep());
        importBtn.addEventListener('click', () => this.startImport());

        // Sheet selection change
        document.getElementById('sheetSelect').addEventListener('change', () => this.updatePreview());
        document.getElementById('headerRow').addEventListener('change', () => this.updatePreview());
    }

    /**
     * Handle file selection and validation
     */
    async handleFileSelect(file) {
        try {
            // Validate file
            const validation = this.validateFile(file);
            if (!validation.isValid) {
                this.showError(validation.errors.join('<br>'));
                return;
            }

            this.currentFile = file;
            this.showFileInfo(file);

            // Process file
            const result = await this.fileProcessor.processFile(file);
            if (result.success) {
                this.previewData = result.data;
                this.populateSheetOptions(result.sheets);
                document.getElementById('nextStepBtn').disabled = false;
            } else {
                this.showError(result.error);
            }

        } catch (error) {
            console.error('Error handling file:', error);
            this.showError('Error processing file: ' + error.message);
        }
    }

    /**
     * Validate uploaded file
     */
    validateFile(file) {
        const errors = [];
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'text/csv' // .csv
        ];

        if (!file) {
            errors.push('No file selected');
        } else {
            if (file.size > maxSize) {
                errors.push('File size exceeds 10MB limit');
            }

            if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.csv')) {
                errors.push('Invalid file format. Only Excel (.xlsx, .xls) and CSV files are supported');
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Show file information
     */
    showFileInfo(file) {
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = this.formatFileSize(file.size);
        document.getElementById('fileType').textContent = file.type || 'text/csv';
        document.getElementById('fileInfo').style.display = 'block';
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Populate sheet selection options for Excel files
     */
    populateSheetOptions(sheets) {
        const sheetSelect = document.getElementById('sheetSelect');
        sheetSelect.innerHTML = '<option value="">Pilih Sheet...</option>';
        
        if (sheets && sheets.length > 0) {
            sheets.forEach(sheet => {
                const option = document.createElement('option');
                option.value = sheet;
                option.textContent = sheet;
                sheetSelect.appendChild(option);
            });
            
            // Auto-select first sheet
            if (sheets.length === 1) {
                sheetSelect.value = sheets[0];
                this.updatePreview();
            }
        } else {
            // For CSV files, hide sheet selection
            sheetSelect.closest('.col-md-6').style.display = 'none';
            this.updatePreview();
        }
    }

    /**
     * Update preview table based on selected sheet and header row
     */
    async updatePreview() {
        try {
            const sheetName = document.getElementById('sheetSelect').value;
            const headerRow = parseInt(document.getElementById('headerRow').value) || 1;

            const previewData = await this.fileProcessor.getPreviewData(
                this.currentFile, 
                sheetName, 
                headerRow
            );

            if (previewData.success) {
                this.displayPreview(previewData.data, previewData.headers);
                this.createColumnMapping(previewData.headers);
            } else {
                this.showError(previewData.error);
            }

        } catch (error) {
            console.error('Error updating preview:', error);
            this.showError('Error updating preview: ' + error.message);
        }
    }

    /**
     * Display preview data in table
     */
    displayPreview(data, headers) {
        const previewHeader = document.getElementById('previewHeader');
        const previewBody = document.getElementById('previewBody');

        // Clear existing content
        previewHeader.innerHTML = '';
        previewBody.innerHTML = '';

        // Create header row
        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        previewHeader.appendChild(headerRow);

        // Create data rows (limit to first 10 rows for preview)
        const previewRows = data.slice(0, 10);
        previewRows.forEach(row => {
            const tr = document.createElement('tr');
            headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = row[header] || '';
                tr.appendChild(td);
            });
            previewBody.appendChild(tr);
        });

        // Show row count info
        if (data.length > 10) {
            const infoRow = document.createElement('tr');
            const infoCell = document.createElement('td');
            infoCell.colSpan = headers.length;
            infoCell.className = 'text-center text-muted';
            infoCell.textContent = `... and ${data.length - 10} more rows`;
            infoRow.appendChild(infoCell);
            previewBody.appendChild(infoRow);
        }
    }

    /**
     * Create column mapping interface
     */
    createColumnMapping(headers) {
        const mappingContainer = document.getElementById('columnMapping');
        mappingContainer.innerHTML = '';

        const requiredFields = [
            { key: 'kode', label: 'Kode Barang', required: true },
            { key: 'nama', label: 'Nama Barang', required: true },
            { key: 'kategori', label: 'Kategori', required: true },
            { key: 'satuan', label: 'Satuan', required: true },
            { key: 'harga_beli', label: 'Harga Beli', required: false },
            { key: 'harga_jual', label: 'Harga Jual', required: false },
            { key: 'stok', label: 'Stok', required: false },
            { key: 'stok_minimum', label: 'Stok Minimum', required: false },
            { key: 'deskripsi', label: 'Deskripsi', required: false }
        ];

        requiredFields.forEach(field => {
            const colDiv = document.createElement('div');
            colDiv.className = 'col-md-6 mb-2';

            const label = document.createElement('label');
            label.className = 'form-label';
            label.textContent = field.label + (field.required ? ' *' : '');

            const select = document.createElement('select');
            select.className = 'form-select';
            select.id = `mapping_${field.key}`;
            select.dataset.field = field.key;
            select.dataset.required = field.required;

            // Add empty option
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = '-- Pilih Kolom --';
            select.appendChild(emptyOption);

            // Add header options
            headers.forEach(header => {
                const option = document.createElement('option');
                option.value = header;
                option.textContent = header;
                
                // Auto-select if header name matches
                if (header.toLowerCase().includes(field.key.toLowerCase()) ||
                    field.key.toLowerCase().includes(header.toLowerCase())) {
                    option.selected = true;
                }
                
                select.appendChild(option);
            });

            colDiv.appendChild(label);
            colDiv.appendChild(select);
            mappingContainer.appendChild(colDiv);
        });
    }

    /**
     * Navigate to next step
     */
    nextStep() {
        const currentStep = this.getCurrentStep();
        
        switch (currentStep) {
            case 'upload':
                if (this.currentFile && this.previewData) {
                    this.showStep('preview');
                }
                break;
            case 'preview':
                if (this.validateColumnMapping()) {
                    this.processDataValidation();
                    this.showStep('confirm');
                }
                break;
            case 'confirm':
                this.showStep('progress');
                break;
        }
    }

    /**
     * Navigate to previous step
     */
    prevStep() {
        const currentStep = this.getCurrentStep();
        
        switch (currentStep) {
            case 'preview':
                this.showStep('upload');
                break;
            case 'confirm':
                this.showStep('preview');
                break;
            case 'progress':
                this.showStep('confirm');
                break;
        }
    }

    /**
     * Get current active step
     */
    getCurrentStep() {
        const steps = ['upload', 'preview', 'confirm', 'progress'];
        for (const step of steps) {
            const stepElement = document.getElementById(`${step}Step`);
            if (stepElement && stepElement.style.display !== 'none') {
                return step;
            }
        }
        return 'upload';
    }

    /**
     * Show specific step and update navigation
     */
    showStep(step) {
        // Hide all steps
        ['upload', 'preview', 'confirm', 'progress'].forEach(s => {
            document.getElementById(`${s}Step`).style.display = 'none';
        });

        // Show target step
        document.getElementById(`${step}Step`).style.display = 'block';

        // Update navigation buttons
        const nextBtn = document.getElementById('nextStepBtn');
        const prevBtn = document.getElementById('prevStepBtn');
        const importBtn = document.getElementById('importBtn');

        switch (step) {
            case 'upload':
                nextBtn.style.display = 'inline-block';
                nextBtn.disabled = !this.currentFile;
                prevBtn.style.display = 'none';
                importBtn.style.display = 'none';
                break;
            case 'preview':
                nextBtn.style.display = 'inline-block';
                nextBtn.disabled = false;
                prevBtn.style.display = 'inline-block';
                importBtn.style.display = 'none';
                break;
            case 'confirm':
                nextBtn.style.display = 'none';
                prevBtn.style.display = 'inline-block';
                importBtn.style.display = 'inline-block';
                break;
            case 'progress':
                nextBtn.style.display = 'none';
                prevBtn.style.display = 'none';
                importBtn.style.display = 'none';
                break;
        }
    }

    /**
     * Validate column mapping
     */
    validateColumnMapping() {
        const requiredFields = ['kode', 'nama', 'kategori', 'satuan'];
        const errors = [];

        requiredFields.forEach(field => {
            const select = document.getElementById(`mapping_${field}`);
            if (!select.value) {
                errors.push(`${field} mapping is required`);
            }
        });

        if (errors.length > 0) {
            this.showError(errors.join('<br>'));
            return false;
        }

        // Store column mapping
        this.columnMapping = {};
        document.querySelectorAll('[id^="mapping_"]').forEach(select => {
            if (select.value) {
                this.columnMapping[select.dataset.field] = select.value;
            }
        });

        return true;
    }

    /**
     * Process data validation and show results
     */
    async processDataValidation() {
        try {
            // Get mapped data
            const mappedData = await this.fileProcessor.getMappedData(
                this.currentFile,
                document.getElementById('sheetSelect').value,
                parseInt(document.getElementById('headerRow').value) || 1,
                this.columnMapping
            );

            if (!mappedData.success) {
                this.showError(mappedData.error);
                return;
            }

            // Validate each row
            const validationResults = await this.validateImportData(mappedData.data);
            this.displayValidationResults(validationResults);

        } catch (error) {
            console.error('Error processing validation:', error);
            this.showError('Error validating data: ' + error.message);
        }
    }

    /**
     * Validate import data
     */
    async validateImportData(data) {
        const results = {
            total: data.length,
            valid: 0,
            warnings: 0,
            errors: 0,
            rows: [],
            newCategories: new Set(),
            newUnits: new Set()
        };

        // Get existing data for validation
        const existingBarang = JSON.parse(localStorage.getItem('master_barang') || '[]');
        const existingKategori = JSON.parse(localStorage.getItem('kategori_barang') || '[]');
        const existingSatuan = JSON.parse(localStorage.getItem('satuan_barang') || '[]');

        const existingKodes = new Set(existingBarang.map(b => b.kode));
        const existingKategoriNames = new Set(existingKategori.map(k => k.nama.toLowerCase()));
        const existingSatuanNames = new Set(existingSatuan.map(s => s.nama.toLowerCase()));

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowResult = {
                index: i + 1,
                data: row,
                errors: [],
                warnings: [],
                status: 'valid'
            };

            // Validate required fields
            if (!row.kode || !row.kode.trim()) {
                rowResult.errors.push('Kode barang is required');
            } else if (existingKodes.has(row.kode.trim())) {
                rowResult.errors.push('Kode barang already exists');
            }

            if (!row.nama || !row.nama.trim()) {
                rowResult.errors.push('Nama barang is required');
            }

            if (!row.kategori || !row.kategori.trim()) {
                rowResult.errors.push('Kategori is required');
            } else if (!existingKategoriNames.has(row.kategori.trim().toLowerCase())) {
                results.newCategories.add(row.kategori.trim());
                rowResult.warnings.push('New category will be created: ' + row.kategori.trim());
            }

            if (!row.satuan || !row.satuan.trim()) {
                rowResult.errors.push('Satuan is required');
            } else if (!existingSatuanNames.has(row.satuan.trim().toLowerCase())) {
                results.newUnits.add(row.satuan.trim());
                rowResult.warnings.push('New unit will be created: ' + row.satuan.trim());
            }

            // Validate numeric fields
            if (row.harga_beli && isNaN(parseFloat(row.harga_beli))) {
                rowResult.errors.push('Harga beli must be a number');
            }

            if (row.harga_jual && isNaN(parseFloat(row.harga_jual))) {
                rowResult.errors.push('Harga jual must be a number');
            }

            if (row.stok && isNaN(parseFloat(row.stok))) {
                rowResult.errors.push('Stok must be a number');
            }

            if (row.stok_minimum && isNaN(parseFloat(row.stok_minimum))) {
                rowResult.errors.push('Stok minimum must be a number');
            }

            // Set row status
            if (rowResult.errors.length > 0) {
                rowResult.status = 'error';
                results.errors++;
            } else if (rowResult.warnings.length > 0) {
                rowResult.status = 'warning';
                results.warnings++;
            } else {
                results.valid++;
            }

            results.rows.push(rowResult);
        }

        this.newCategories = Array.from(results.newCategories);
        this.newUnits = Array.from(results.newUnits);

        return results;
    }

    /**
     * Display validation results
     */
    displayValidationResults(results) {
        // Update summary cards
        document.getElementById('totalRows').textContent = results.total;
        document.getElementById('validRows').textContent = results.valid;
        document.getElementById('warningRows').textContent = results.warnings;
        document.getElementById('errorRows').textContent = results.errors;

        // Show new data confirmation if needed
        if (this.newCategories.length > 0 || this.newUnits.length > 0) {
            this.showNewDataConfirmation();
        }

        // Show detailed validation results
        const validationContainer = document.getElementById('validationResults');
        if (results.errors > 0) {
            const errorRows = results.rows.filter(r => r.status === 'error');
            const errorHtml = `
                <div class="alert alert-danger">
                    <h6><i class="fas fa-exclamation-circle"></i> Validation Errors Found</h6>
                    <p>The following rows have errors that must be fixed before import:</p>
                    <ul class="mb-0">
                        ${errorRows.slice(0, 5).map(row => 
                            `<li>Row ${row.index}: ${row.errors.join(', ')}</li>`
                        ).join('')}
                        ${errorRows.length > 5 ? `<li>... and ${errorRows.length - 5} more errors</li>` : ''}
                    </ul>
                </div>
            `;
            validationContainer.innerHTML = errorHtml;
            document.getElementById('importBtn').disabled = true;
        } else {
            validationContainer.innerHTML = `
                <div class="alert alert-success">
                    <i class="fas fa-check-circle"></i> All data validated successfully!
                    ${results.warnings > 0 ? `<br><small>Note: ${results.warnings} rows have warnings but can be imported.</small>` : ''}
                </div>
            `;
            document.getElementById('importBtn').disabled = false;
        }
    }

    /**
     * Show new data confirmation dialog
     */
    showNewDataConfirmation() {
        const confirmationDiv = document.getElementById('newDataConfirmation');
        confirmationDiv.style.display = 'block';

        if (this.newCategories.length > 0) {
            const categoriesSection = document.getElementById('newCategoriesSection');
            const categoriesList = document.getElementById('newCategoriesList');
            categoriesSection.style.display = 'block';
            categoriesList.innerHTML = this.newCategories.map(cat => `<li>${cat}</li>`).join('');
        }

        if (this.newUnits.length > 0) {
            const unitsSection = document.getElementById('newUnitsSection');
            const unitsList = document.getElementById('newUnitsList');
            unitsSection.style.display = 'block';
            unitsList.innerHTML = this.newUnits.map(unit => `<li>${unit}</li>`).join('');
        }

        // Update import button state based on confirmation
        const confirmCheckbox = document.getElementById('confirmNewData');
        const importBtn = document.getElementById('importBtn');
        
        confirmCheckbox.addEventListener('change', () => {
            if (this.newCategories.length > 0 || this.newUnits.length > 0) {
                importBtn.disabled = !confirmCheckbox.checked;
            }
        });

        importBtn.disabled = true;
    }

    /**
     * Start the import process
     */
    async startImport() {
        try {
            this.showStep('progress');
            
            // Create new categories and units if needed
            await this.createNewCategoriesAndUnits();

            // Get final mapped data
            const mappedData = await this.fileProcessor.getMappedData(
                this.currentFile,
                document.getElementById('sheetSelect').value,
                parseInt(document.getElementById('headerRow').value) || 1,
                this.columnMapping
            );

            if (!mappedData.success) {
                throw new Error(mappedData.error);
            }

            // Process import with progress tracking
            await this.processImport(mappedData.data);

        } catch (error) {
            console.error('Import error:', error);
            this.showImportError(error.message);
        }
    }

    /**
     * Create new categories and units
     */
    async createNewCategoriesAndUnits() {
        const existingKategori = JSON.parse(localStorage.getItem('kategori_barang') || '[]');
        const existingSatuan = JSON.parse(localStorage.getItem('satuan_barang') || '[]');

        // Create new categories
        for (const categoryName of this.newCategories) {
            const newCategory = {
                id: this.generateId(),
                nama: categoryName,
                deskripsi: `Auto-created during import`,
                status: 'aktif',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                created_by: 'system',
                updated_by: 'system'
            };
            existingKategori.push(newCategory);
        }

        // Create new units
        for (const unitName of this.newUnits) {
            const newUnit = {
                id: this.generateId(),
                nama: unitName,
                deskripsi: `Auto-created during import`,
                status: 'aktif',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                created_by: 'system',
                updated_by: 'system'
            };
            existingSatuan.push(newUnit);
        }

        // Save to localStorage
        localStorage.setItem('kategori_barang', JSON.stringify(existingKategori));
        localStorage.setItem('satuan_barang', JSON.stringify(existingSatuan));
    }

    /**
     * Process import with progress tracking
     */
    async processImport(data) {
        const progressBar = document.getElementById('importProgress');
        const progressText = document.getElementById('progressText');
        const resultsDiv = document.getElementById('importResults');

        const existingBarang = JSON.parse(localStorage.getItem('master_barang') || '[]');
        const existingKategori = JSON.parse(localStorage.getItem('kategori_barang') || '[]');
        const existingSatuan = JSON.parse(localStorage.getItem('satuan_barang') || '[]');

        // Create lookup maps
        const kategoriMap = new Map();
        existingKategori.forEach(k => kategoriMap.set(k.nama.toLowerCase(), k));

        const satuanMap = new Map();
        existingSatuan.forEach(s => satuanMap.set(s.nama.toLowerCase(), s));

        let imported = 0;
        let skipped = 0;
        const errors = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            
            try {
                // Update progress
                const progress = ((i + 1) / data.length) * 100;
                progressBar.style.width = progress + '%';
                progressText.textContent = `Processing row ${i + 1} of ${data.length}...`;

                // Skip invalid rows
                if (!row.kode || !row.nama || !row.kategori || !row.satuan) {
                    skipped++;
                    continue;
                }

                // Get category and unit IDs
                const kategori = kategoriMap.get(row.kategori.toLowerCase());
                const satuan = satuanMap.get(row.satuan.toLowerCase());

                if (!kategori || !satuan) {
                    errors.push(`Row ${i + 1}: Category or unit not found`);
                    skipped++;
                    continue;
                }

                // Create barang object
                const barang = {
                    id: this.generateId(),
                    kode: row.kode.trim(),
                    nama: row.nama.trim(),
                    kategori_id: kategori.id,
                    kategori_nama: kategori.nama,
                    satuan_id: satuan.id,
                    satuan_nama: satuan.nama,
                    harga_beli: parseFloat(row.harga_beli) || 0,
                    harga_jual: parseFloat(row.harga_jual) || 0,
                    stok: parseFloat(row.stok) || 0,
                    stok_minimum: parseFloat(row.stok_minimum) || 0,
                    deskripsi: row.deskripsi || '',
                    status: 'aktif',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    created_by: 'import',
                    updated_by: 'import'
                };

                existingBarang.push(barang);
                imported++;

                // Add small delay to show progress
                if (i % 10 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 50));
                }

            } catch (error) {
                console.error(`Error processing row ${i + 1}:`, error);
                errors.push(`Row ${i + 1}: ${error.message}`);
                skipped++;
            }
        }

        // Save imported data
        localStorage.setItem('master_barang', JSON.stringify(existingBarang));

        // Log import activity
        await this.auditLogger.log({
            table_name: 'barang',
            action: 'import',
            new_data: {
                file_name: this.currentFile.name,
                total_rows: data.length,
                imported: imported,
                skipped: skipped,
                errors: errors.length
            },
            additional_info: {
                new_categories: this.newCategories,
                new_units: this.newUnits
            }
        });

        // Show results
        this.showImportResults(imported, skipped, errors);
    }

    /**
     * Show import results
     */
    showImportResults(imported, skipped, errors) {
        const progressBar = document.getElementById('importProgress');
        const progressText = document.getElementById('progressText');
        const resultsDiv = document.getElementById('importResults');

        progressBar.style.width = '100%';
        progressBar.classList.remove('progress-bar-animated');
        progressText.textContent = 'Import completed!';

        const resultHtml = `
            <div class="alert ${errors.length > 0 ? 'alert-warning' : 'alert-success'}">
                <h6><i class="fas fa-check-circle"></i> Import Completed</h6>
                <ul class="mb-0">
                    <li><strong>${imported}</strong> records imported successfully</li>
                    ${skipped > 0 ? `<li><strong>${skipped}</strong> records skipped</li>` : ''}
                    ${errors.length > 0 ? `<li><strong>${errors.length}</strong> errors occurred</li>` : ''}
                </ul>
                ${errors.length > 0 ? `
                    <details class="mt-2">
                        <summary>View Errors</summary>
                        <ul class="mt-2 mb-0">
                            ${errors.slice(0, 10).map(error => `<li>${error}</li>`).join('')}
                            ${errors.length > 10 ? `<li>... and ${errors.length - 10} more errors</li>` : ''}
                        </ul>
                    </details>
                ` : ''}
            </div>
            <div class="text-center mt-3">
                <button type="button" class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-refresh"></i> Refresh Page
                </button>
            </div>
        `;

        resultsDiv.innerHTML = resultHtml;
        resultsDiv.style.display = 'block';
    }

    /**
     * Show import error
     */
    showImportError(message) {
        const resultsDiv = document.getElementById('importResults');
        resultsDiv.innerHTML = `
            <div class="alert alert-danger">
                <h6><i class="fas fa-exclamation-circle"></i> Import Failed</h6>
                <p>${message}</p>
            </div>
        `;
        resultsDiv.style.display = 'block';
    }

    /**
     * Show error message
     */
    showError(message) {
        // You can implement a toast notification or alert here
        alert(message);
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return 'barang_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Open import dialog
     */
    openImportDialog() {
        this.initializeImportDialog();
        const modal = new bootstrap.Modal(document.getElementById('importDialog'));
        modal.show();
        
        // Reset to first step
        this.showStep('upload');
        
        // Reset form state
        this.currentFile = null;
        this.previewData = null;
        this.columnMapping = {};
        this.newCategories = [];
        this.newUnits = [];
        
        document.getElementById('fileInput').value = '';
        document.getElementById('fileInfo').style.display = 'none';
    }
}