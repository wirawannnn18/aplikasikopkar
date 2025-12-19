/**
 * Enhanced Pembayaran Hutang Piutang Module - Integration Ready
 * Requirements: 2.1, 2.2, 2.3, 6.1 - Updated to use SharedPaymentServices
 * 
 * This enhanced version uses SharedPaymentServices for:
 * - Journal recording with mode tracking
 * - Saldo calculations
 * - Audit logging with mode parameter
 * - Unified transaction processing
 */

/**
 * Enhanced Pembayaran Hutang Piutang Class
 * Uses SharedPaymentServices for integration compatibility
 */
class PembayaranHutangPiutangEnhanced {
    constructor(sharedServices = null) {
        // Initialize shared services
        this.sharedServices = sharedServices || new SharedPaymentServices();
        
        // Initialize callbacks for integration
        this.callbacks = {
            onTransactionComplete: null,
            onSummaryUpdate: null
        };
        
        // Track integration mode
        this.integrationMode = false;
        this.tabContext = null;
    }

    /**
     * Set integration mode and callbacks
     * Requirements: 2.4, 2.5, 5.5 - Integration-specific features
     * @param {boolean} enabled - Enable integration mode
     * @param {Object} callbacks - Integration callbacks
     */
    setIntegrationMode(enabled, callbacks = {}) {
        this.integrationMode = enabled;
        this.callbacks = {
            onTransactionComplete: callbacks.onTransactionComplete || null,
            onSummaryUpdate: callbacks.onSummaryUpdate || null
        };
    }

    /**
     * Set tab context for integration
     * Requirements: 2.4, 2.5 - Tab switching compatibility
     * @param {string} tabContext - Current tab context
     */
    setTabContext(tabContext) {
        this.tabContext = tabContext;
    }

    /**
     * Initialize and render the main pembayaran hutang piutang page
     * Requirements: 6.1, 13.1 - Enhanced role-based access validation
     */
    render() {
        // Enhanced session and access validation using existing functions
        const sessionValidation = validateUserSession();
        if (!sessionValidation.valid) {
            const content = document.getElementById('mainContent');
            if (content) {
                content.innerHTML = `
                    <div class="container-fluid py-4">
                        <div class="alert alert-danger">
                            <h4><i class="bi bi-exclamation-triangle"></i> Sesi Tidak Valid</h4>
                            <p>${escapeHtml(sessionValidation.error)}</p>
                            <button class="btn btn-primary" onclick="location.reload()">
                                <i class="bi bi-arrow-clockwise"></i> Refresh Halaman
                            </button>
                        </div>
                    </div>
                `;
            }
            return;
        }
        
        // Check basic access permission
        if (!checkPembayaranAccess()) {
            const content = document.getElementById('mainContent');
            if (content) {
                content.innerHTML = `
                    <div class="container-fluid py-4">
                        <div class="alert alert-danger">
                            <h4><i class="bi bi-exclamation-triangle"></i> Akses Ditolak</h4>
                            <p>Anda tidak memiliki izin untuk mengakses fitur Pembayaran Hutang/Piutang.</p>
                            <p>Fitur ini hanya dapat diakses oleh Super Admin, Administrator, Admin, dan Kasir.</p>
                            <p>Role Anda saat ini: <strong>${escapeHtml(sessionValidation.user.role || 'Tidak diketahui')}</strong></p>
                        </div>
                    </div>
                `;
            }
            return;
        }
        
        // Check view permission
        if (!checkOperationPermission('view')) {
            const content = document.getElementById('mainContent');
            if (content) {
                content.innerHTML = `
                    <div class="container-fluid py-4">
                        <div class="alert alert-warning">
                            <h4><i class="bi bi-eye-slash"></i> Akses Terbatas</h4>
                            <p>Anda tidak memiliki izin untuk melihat halaman ini.</p>
                            <p>Hubungi administrator untuk mendapatkan akses yang diperlukan.</p>
                        </div>
                    </div>
                `;
            }
            return;
        }
        
        const content = document.getElementById('mainContent');
        if (!content) {
            console.error('Content element not found');
            return;
        }

        content.innerHTML = `
            <style>
                .fade-in {
                    animation: fadeIn 0.3s ease-in;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .saldo-highlight {
                    transition: all 0.3s ease;
                }
            </style>
            <div class="container-fluid py-4">
                <div class="row mb-4">
                    <div class="col-12">
                        <h2><i class="bi bi-cash-coin"></i> Pembayaran Hutang / Piutang Anggota</h2>
                        <p class="text-muted">Proses pembayaran hutang dari anggota atau pembayaran piutang kepada anggota</p>
                    </div>
                </div>

                <!-- Summary Cards -->
                <div class="row mb-4">
                    <div class="col-md-6">
                        <div class="card border-danger">
                            <div class="card-body">
                                <h5 class="card-title text-danger">
                                    <i class="bi bi-arrow-down-circle"></i> Total Hutang Anggota
                                </h5>
                                <h3 class="mb-0" id="totalHutangDisplay">Rp 0</h3>
                                <small class="text-muted">Kewajiban anggota kepada koperasi</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card border-success">
                            <div class="card-body">
                                <h5 class="card-title text-success">
                                    <i class="bi bi-arrow-up-circle"></i> Total Piutang Anggota
                                </h5>
                                <h3 class="mb-0" id="totalPiutangDisplay">Rp 0</h3>
                                <small class="text-muted">Hak anggota dari koperasi</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tabs -->
                <ul class="nav nav-tabs mb-3" id="pembayaranTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="form-tab" data-bs-toggle="tab" 
                                data-bs-target="#form-panel" type="button" role="tab">
                            <i class="bi bi-plus-circle"></i> Form Pembayaran
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="riwayat-tab" data-bs-toggle="tab" 
                                data-bs-target="#riwayat-panel" type="button" role="tab">
                            <i class="bi bi-clock-history"></i> Riwayat Pembayaran
                        </button>
                    </li>
                </ul>

                <!-- Tab Content -->
                <div class="tab-content" id="pembayaranTabContent">
                    <!-- Form Panel -->
                    <div class="tab-pane fade show active" id="form-panel" role="tabpanel">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Form Pembayaran</h5>
                            </div>
                            <div class="card-body">
                                <div id="formPembayaranContainer">
                                    <!-- Form will be rendered here -->
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Riwayat Panel -->
                    <div class="tab-pane fade" id="riwayat-panel" role="tabpanel">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">Riwayat Pembayaran</h5>
                            </div>
                            <div class="card-body">
                                <div id="riwayatPembayaranContainer">
                                    <!-- Riwayat will be rendered here -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Initialize
        this.updateSummaryCards();
        this.renderFormPembayaran();
        this.renderRiwayatPembayaran();
    }

    /**
     * Update summary cards with total hutang and piutang using shared services
     * Requirements: 6.2 - Use shared saldo calculation functions
     */
    updateSummaryCards() {
        try {
            const anggotaList = JSON.parse(localStorage.getItem('anggota') || '[]');
            
            let totalHutang = 0;
            let totalPiutang = 0;

            anggotaList.forEach(anggota => {
                // Use shared services for saldo calculation
                totalHutang += this.sharedServices.hitungSaldoHutang(anggota.id);
                totalPiutang += this.sharedServices.hitungSaldoPiutang(anggota.id);
            });

            document.getElementById('totalHutangDisplay').textContent = formatRupiah(totalHutang);
            document.getElementById('totalPiutangDisplay').textContent = formatRupiah(totalPiutang);
            
            // Trigger callback for integration
            if (this.integrationMode && this.callbacks.onSummaryUpdate) {
                this.callbacks.onSummaryUpdate({
                    totalHutang,
                    totalPiutang,
                    source: 'manual'
                });
            }
        } catch (error) {
            console.error('Error updating summary cards:', error);
        }
    }

    /**
     * Render form pembayaran
     * Requirements: 6.1, 6.4
     */
    renderFormPembayaran() {
        const container = document.getElementById('formPembayaranContainer');
        if (!container) return;

        container.innerHTML = `
            <form id="formPembayaran" onsubmit="event.preventDefault(); window.enhancedPembayaran.prosesPembayaran();">
                <!-- Jenis Pembayaran -->
                <div class="mb-3">
                    <label for="jenisPembayaran" class="form-label">Jenis Pembayaran <span class="text-danger">*</span></label>
                    <select class="form-select" id="jenisPembayaran" required onchange="window.enhancedPembayaran.onJenisChange()">
                        <option value="">-- Pilih Jenis --</option>
                        <option value="hutang">Pembayaran Hutang (Anggota bayar ke Koperasi)</option>
                        <option value="piutang">Pembayaran Piutang (Koperasi bayar ke Anggota)</option>
                    </select>
                </div>

                <!-- Search Anggota -->
                <div class="mb-3">
                    <label for="searchAnggota" class="form-label">Cari Anggota <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="searchAnggota" 
                           placeholder="Ketik NIK atau Nama anggota..." 
                           autocomplete="off"
                           oninput="window.enhancedPembayaran.onSearchAnggota(this.value)">
                    <div id="anggotaSuggestions" class="list-group mt-1" style="position: absolute; z-index: 1000; max-height: 300px; overflow-y: auto; display: none;"></div>
                    <input type="hidden" id="selectedAnggotaId">
                    <input type="hidden" id="selectedAnggotaNama">
                    <input type="hidden" id="selectedAnggotaNIK">
                </div>

                <!-- Display Saldo -->
                <div id="saldoDisplay" style="display: none;">
                    <div class="alert alert-info">
                        <div class="row">
                            <div class="col-md-6">
                                <strong>Saldo Hutang:</strong>
                                <h5 class="mb-0 text-danger" id="displaySaldoHutang">Rp 0</h5>
                            </div>
                            <div class="col-md-6">
                                <strong>Saldo Piutang:</strong>
                                <h5 class="mb-0 text-success" id="displaySaldoPiutang">Rp 0</h5>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Jumlah Pembayaran -->
                <div class="mb-3">
                    <label for="jumlahPembayaran" class="form-label">Jumlah Pembayaran <span class="text-danger">*</span></label>
                    <input type="number" class="form-control" id="jumlahPembayaran" 
                           placeholder="Masukkan jumlah pembayaran" 
                           min="1" step="1" required
                           oninput="window.enhancedPembayaran.validateFormRealTime()">
                    <div class="form-text" id="jumlahHelpText">Masukkan jumlah dalam Rupiah (tanpa titik atau koma)</div>
                    <div class="invalid-feedback" id="jumlahErrorText"></div>
                </div>

                <!-- Keterangan -->
                <div class="mb-3">
                    <label for="keteranganPembayaran" class="form-label">Keterangan</label>
                    <textarea class="form-control" id="keteranganPembayaran" rows="3" 
                              placeholder="Keterangan tambahan (opsional)"></textarea>
                </div>

                <!-- Validation Messages -->
                <div id="formValidationMessages" class="mb-3" style="display: none;">
                    <div class="alert alert-warning" id="validationAlert">
                        <ul class="mb-0" id="validationList"></ul>
                    </div>
                </div>

                <!-- Buttons -->
                <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                    <button type="button" class="btn btn-secondary" onclick="window.enhancedPembayaran.resetFormPembayaran()">
                        <i class="bi bi-x-circle"></i> Reset
                    </button>
                    <button type="submit" class="btn btn-primary" id="btnProsesPembayaran" disabled>
                        <i class="bi bi-check-circle"></i> Proses Pembayaran
                    </button>
                </div>
            </form>
        `;
    }

    /**
     * Process pembayaran using shared services
     * Requirements: 1.3, 1.5, 2.3, 2.5, 7.4, 7.5, 13.1, 13.2 - Enhanced security
     */
    async prosesPembayaran() {
        // Enhanced session validation
        const sessionValidation = validateUserSession();
        if (!sessionValidation.valid) {
            showErrorNotification(new Error(sessionValidation.error), 'Sesi Tidak Valid');
            return;
        }
        
        // Check process permission
        if (!checkOperationPermission('process')) {
            showAlert('Anda tidak memiliki izin untuk memproses pembayaran', 'danger');
            return;
        }
        
        try {
            // Get raw form data
            const rawFormData = {
                anggotaId: document.getElementById('selectedAnggotaId')?.value || '',
                anggotaNama: document.getElementById('selectedAnggotaNama')?.value || '',
                anggotaNIK: document.getElementById('selectedAnggotaNIK')?.value || '',
                jenis: document.getElementById('jenisPembayaran')?.value || '',
                jumlah: document.getElementById('jumlahPembayaran')?.value || '',
                keterangan: document.getElementById('keteranganPembayaran')?.value || ''
            };
            
            // Sanitize and validate form data
            const sanitizationResult = sanitizePaymentFormData(rawFormData);
            if (!sanitizationResult.valid) {
                showValidationErrors({
                    valid: false,
                    errors: sanitizationResult.errors.map(error => ({
                        message: error,
                        guidance: 'Pastikan semua input valid dan tidak mengandung karakter berbahaya'
                    })),
                    warnings: []
                });
                return;
            }
            
            const data = sanitizationResult.sanitized;
            
            // Validate anggota status first
            const anggotaValidation = validateAnggotaForHutangPiutang(data.anggotaId);
            if (!anggotaValidation.valid) {
                showErrorNotification(new Error(anggotaValidation.error), 'Validasi Anggota Gagal');
                return;
            }
            
            // Use shared services for validation
            const validation = this.sharedServices.validatePaymentData(data, 'manual');
            if (!validation.valid) {
                showValidationErrors({
                    valid: false,
                    errors: validation.errors.map(error => ({
                        message: error,
                        guidance: 'Periksa kembali data yang dimasukkan'
                    })),
                    warnings: validation.warnings.map(warning => ({
                        message: warning,
                        guidance: 'Perhatian tambahan'
                    }))
                });
                return;
            }
            
            // Get saldo before using shared services
            const saldoSebelum = data.jenis === 'hutang' 
                ? this.sharedServices.hitungSaldoHutang(data.anggotaId)
                : this.sharedServices.hitungSaldoPiutang(data.anggotaId);
            
            // Show enhanced confirmation dialog
            const confirmed = await showConfirmationDialog(data, saldoSebelum);
            if (!confirmed) {
                return;
            }
            
            // Process payment using shared services
            const result = await this.sharedServices.processPayment(data, 'manual');
            
            if (result.success) {
                const jenisText = data.jenis === 'hutang' ? 'Hutang' : 'Piutang';
                
                // Show success notification with details
                showSuccessNotification(result.transaction, jenisText);
                
                // Reset form and refresh
                this.resetFormPembayaran();
                this.updateSummaryCards();
                this.renderRiwayatPembayaran();
                
                // Trigger callback for integration
                if (this.integrationMode && this.callbacks.onTransactionComplete) {
                    this.callbacks.onTransactionComplete({
                        transaction: result.transaction,
                        mode: 'manual',
                        source: 'manual-tab'
                    });
                }
            }
            
        } catch (error) {
            console.error('Error proses pembayaran:', error);
            showErrorNotification(error, 'Gagal memproses pembayaran');
        }
    }

    /**
     * Handle jenis pembayaran change using shared services
     * Requirements: 6.4
     */
    onJenisChange() {
        const jenis = document.getElementById('jenisPembayaran').value;
        const saldoDisplay = document.getElementById('saldoDisplay');
        const anggotaId = document.getElementById('selectedAnggotaId').value;
        
        if (jenis && anggotaId) {
            saldoDisplay.style.display = 'block';
            
            // Get current saldo values using shared services
            const saldoHutang = this.sharedServices.hitungSaldoHutang(anggotaId);
            const saldoPiutang = this.sharedServices.hitungSaldoPiutang(anggotaId);
            
            // Dynamic highlighting and input control
            this.highlightRelevantSaldoDynamic(jenis, saldoHutang, saldoPiutang);
            
            // Enable/disable jumlah input based on saldo availability
            this.controlJumlahInputBasedOnSaldo(jenis, saldoHutang, saldoPiutang);
        }
        
        // Validate form in real-time
        this.validateFormRealTime();
    }

    /**
     * Search anggota with debounce and input sanitization
     * Requirements: 6.2, 13.2 - Enhanced input sanitization
     */
    onSearchAnggota(query) {
        clearTimeout(this.searchDebounceTimer);
        
        this.searchDebounceTimer = setTimeout(() => {
            // Sanitize search query
            const sanitizedQuery = sanitizeTextInput(query || '');
            
            if (!sanitizedQuery || sanitizedQuery.length < 2) {
                document.getElementById('anggotaSuggestions').style.display = 'none';
                return;
            }
            
            // Additional validation for search query length
            if (sanitizedQuery.length > 100) {
                document.getElementById('anggotaSuggestions').innerHTML = `
                    <div class="list-group-item text-warning">
                        <i class="bi bi-exclamation-triangle"></i> 
                        Pencarian terlalu panjang. Maksimal 100 karakter.
                    </div>
                `;
                document.getElementById('anggotaSuggestions').style.display = 'block';
                return;
            }
            
            const results = searchAnggota(sanitizedQuery);
            this.renderAnggotaSuggestions(results);
        }, 300);
    }

    /**
     * Render anggota suggestions dropdown
     * Requirements: 6.2, 6.3
     * @param {Array} results - Search results
     */
    renderAnggotaSuggestions(results) {
        const container = document.getElementById('anggotaSuggestions');
        if (!container) return;
        
        if (results.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        container.innerHTML = results.map(anggota => `
            <button type="button" class="list-group-item list-group-item-action" 
                    onclick="window.enhancedPembayaran.selectAnggota('${anggota.id}', '${escapeHtml(anggota.nama)}', '${escapeHtml(anggota.nik)}')">
                <div class="d-flex justify-content-between">
                    <div>
                        <strong>${escapeHtml(anggota.nama)}</strong>
                        <br>
                        <small class="text-muted">NIK: ${escapeHtml(anggota.nik)}</small>
                    </div>
                </div>
            </button>
        `).join('');
        
        container.style.display = 'block';
    }

    /**
     * Select anggota from suggestions using shared services
     * Requirements: 6.3
     * @param {string} id - Anggota ID
     * @param {string} nama - Anggota nama
     * @param {string} nik - Anggota NIK
     */
    selectAnggota(id, nama, nik) {
        // Set hidden fields
        document.getElementById('selectedAnggotaId').value = id;
        document.getElementById('selectedAnggotaNama').value = nama;
        document.getElementById('selectedAnggotaNIK').value = nik;
        
        // Update search input
        document.getElementById('searchAnggota').value = `${nama} (${nik})`;
        
        // Hide suggestions
        document.getElementById('anggotaSuggestions').style.display = 'none';
        
        // Automatically display saldo for both hutang and piutang using shared services
        this.displaySaldoAnggotaAutomatic(id);
        
        // Enable form validation feedback
        this.validateFormRealTime();
    }

    /**
     * Display saldo for selected anggota using shared services
     * Requirements: 6.3 - Task 11.1
     * @param {string} anggotaId - Anggota ID
     */
    displaySaldoAnggotaAutomatic(anggotaId) {
        // Use shared services for saldo calculation
        const saldoHutang = this.sharedServices.hitungSaldoHutang(anggotaId);
        const saldoPiutang = this.sharedServices.hitungSaldoPiutang(anggotaId);
        
        // Update saldo display with enhanced formatting
        const hutangElement = document.getElementById('displaySaldoHutang');
        const piutangElement = document.getElementById('displaySaldoPiutang');
        
        hutangElement.textContent = formatRupiah(saldoHutang);
        piutangElement.textContent = formatRupiah(saldoPiutang);
        
        // Add visual indicators for zero balances
        if (saldoHutang === 0) {
            hutangElement.classList.add('text-muted');
            hutangElement.parentElement.classList.add('opacity-50');
        } else {
            hutangElement.classList.remove('text-muted');
            hutangElement.parentElement.classList.remove('opacity-50');
        }
        
        if (saldoPiutang === 0) {
            piutangElement.classList.add('text-muted');
            piutangElement.parentElement.classList.add('opacity-50');
        } else {
            piutangElement.classList.remove('text-muted');
            piutangElement.parentElement.classList.remove('opacity-50');
        }
        
        // Show saldo display with animation
        const saldoDisplay = document.getElementById('saldoDisplay');
        saldoDisplay.style.display = 'block';
        saldoDisplay.classList.add('fade-in');
        
        // Highlight relevant saldo if jenis is already selected
        const jenis = document.getElementById('jenisPembayaran').value;
        if (jenis) {
            this.highlightRelevantSaldoDynamic(jenis, saldoHutang, saldoPiutang);
        }
        
        // Update form validation state
        this.validateFormRealTime();
    }

    /**
     * Dynamic highlighting with saldo availability check
     * Requirements: 6.4 - Task 11.2
     * @param {string} jenis - Payment type (hutang/piutang)
     * @param {number} saldoHutang - Current hutang balance
     * @param {number} saldoPiutang - Current piutang balance
     */
    highlightRelevantSaldoDynamic(jenis, saldoHutang, saldoPiutang) {
        const hutangContainer = document.getElementById('displaySaldoHutang').parentElement;
        const piutangContainer = document.getElementById('displaySaldoPiutang').parentElement;
        
        // Reset all highlighting
        hutangContainer.classList.remove('border', 'border-danger', 'border-success', 'p-2', 'rounded', 'bg-light');
        piutangContainer.classList.remove('border', 'border-danger', 'border-success', 'p-2', 'rounded', 'bg-light');
        
        if (jenis === 'hutang') {
            if (saldoHutang > 0) {
                // Highlight available hutang
                hutangContainer.classList.add('border', 'border-danger', 'p-2', 'rounded', 'bg-light');
                hutangContainer.style.borderWidth = '2px';
            } else {
                // Show unavailable hutang
                hutangContainer.classList.add('border', 'border-secondary', 'p-2', 'rounded');
                hutangContainer.style.borderStyle = 'dashed';
            }
            // Dim piutang
            piutangContainer.classList.add('opacity-50');
        } else if (jenis === 'piutang') {
            if (saldoPiutang > 0) {
                // Highlight available piutang
                piutangContainer.classList.add('border', 'border-success', 'p-2', 'rounded', 'bg-light');
                piutangContainer.style.borderWidth = '2px';
            } else {
                // Show unavailable piutang
                piutangContainer.classList.add('border', 'border-secondary', 'p-2', 'rounded');
                piutangContainer.style.borderStyle = 'dashed';
            }
            // Dim hutang
            hutangContainer.classList.add('opacity-50');
        }
    }

    /**
     * Control jumlah input based on saldo availability
     * Requirements: 6.4 - Task 11.2
     * @param {string} jenis - Payment type (hutang/piutang)
     * @param {number} saldoHutang - Current hutang balance
     * @param {number} saldoPiutang - Current piutang balance
     */
    controlJumlahInputBasedOnSaldo(jenis, saldoHutang, saldoPiutang) {
        const jumlahInput = document.getElementById('jumlahPembayaran');
        const submitButton = document.getElementById('btnProsesPembayaran');
        
        if (jenis === 'hutang') {
            if (saldoHutang > 0) {
                jumlahInput.disabled = false;
                jumlahInput.max = saldoHutang;
                jumlahInput.placeholder = `Maksimal: ${formatRupiah(saldoHutang)}`;
                jumlahInput.classList.remove('is-invalid');
            } else {
                jumlahInput.disabled = true;
                jumlahInput.placeholder = 'Tidak ada hutang yang perlu dibayar';
                jumlahInput.value = '';
                jumlahInput.classList.add('is-invalid');
            }
        } else if (jenis === 'piutang') {
            if (saldoPiutang > 0) {
                jumlahInput.disabled = false;
                jumlahInput.max = saldoPiutang;
                jumlahInput.placeholder = `Maksimal: ${formatRupiah(saldoPiutang)}`;
                jumlahInput.classList.remove('is-invalid');
            } else {
                jumlahInput.disabled = true;
                jumlahInput.placeholder = 'Tidak ada piutang yang perlu dibayar';
                jumlahInput.value = '';
                jumlahInput.classList.add('is-invalid');
            }
        } else {
            // No jenis selected
            jumlahInput.disabled = false;
            jumlahInput.removeAttribute('max');
            jumlahInput.placeholder = 'Masukkan jumlah pembayaran';
            jumlahInput.classList.remove('is-invalid');
        }
    }

    /**
     * Real-time form validation with feedback and input sanitization using shared services
     * Requirements: 6.5, 13.2 - Enhanced validation with sanitization
     */
    validateFormRealTime() {
        // Get and sanitize form values
        const anggotaId = sanitizeTextInput(document.getElementById('selectedAnggotaId')?.value || '');
        const jenis = sanitizeTextInput(document.getElementById('jenisPembayaran')?.value || '');
        const jumlahRaw = document.getElementById('jumlahPembayaran')?.value || '';
        const submitButton = document.getElementById('btnProsesPembayaran');
        const validationMessages = document.getElementById('formValidationMessages');
        const validationList = document.getElementById('validationList');
        const jumlahInput = document.getElementById('jumlahPembayaran');
        const jumlahErrorText = document.getElementById('jumlahErrorText');
        
        const errors = [];
        let isValid = true;
        
        // Validate numeric input
        const jumlahValidation = validateNumericInput(jumlahRaw, {
            min: 1,
            allowNegative: false,
            allowDecimal: true,
            fieldName: 'Jumlah pembayaran'
        });
        
        const jumlah = jumlahValidation.valid ? jumlahValidation.sanitized : 0;
        
        // Reset validation states
        jumlahInput.classList.remove('is-valid', 'is-invalid');
        
        // Validate anggota selection
        if (!anggotaId) {
            errors.push('Pilih anggota terlebih dahulu');
            isValid = false;
        }
        
        // Validate jenis selection
        if (!jenis) {
            errors.push('Pilih jenis pembayaran');
            isValid = false;
        }
        
        // Validate jumlah input
        if (!jumlahValidation.valid && jumlahRaw !== '') {
            errors.push(jumlahValidation.error);
            jumlahInput.classList.add('is-invalid');
            jumlahErrorText.textContent = jumlahValidation.error;
            isValid = false;
        } else if (jumlahValidation.valid) {
            jumlahInput.classList.remove('is-invalid');
            jumlahErrorText.textContent = '';
        }
        
        // Validate jumlah against saldo if anggota and jenis are selected using shared services
        if (anggotaId && jenis && ['hutang', 'piutang'].includes(jenis)) {
            const saldo = jenis === 'hutang' 
                ? this.sharedServices.hitungSaldoHutang(anggotaId)
                : this.sharedServices.hitungSaldoPiutang(anggotaId);
            
            if (saldo === 0) {
                const jenisText = jenis === 'hutang' ? 'hutang' : 'piutang';
                errors.push(`Anggota tidak memiliki ${jenisText} yang perlu dibayar`);
                isValid = false;
            } else if (jumlah > 0) {
                if (jumlah > saldo) {
                    const jenisText = jenis === 'hutang' ? 'hutang' : 'piutang';
                    errors.push(`Jumlah melebihi saldo ${jenisText} (${formatRupiah(saldo)})`);
                    jumlahInput.classList.add('is-invalid');
                    jumlahErrorText.textContent = `Maksimal: ${formatRupiah(saldo)}`;
                    isValid = false;
                } else {
                    jumlahInput.classList.add('is-valid');
                    if (!jumlahErrorText.textContent) {
                        jumlahErrorText.textContent = '';
                    }
                }
            }
        }
        
        // Validate jenis pembayaran
        if (jenis && !['hutang', 'piutang'].includes(jenis)) {
            errors.push('Jenis pembayaran tidak valid');
            isValid = false;
        }
        
        // Update validation messages
        if (errors.length > 0) {
            validationList.innerHTML = errors.map(error => `<li>${error}</li>`).join('');
            validationMessages.style.display = 'block';
        } else {
            validationMessages.style.display = 'none';
        }
        
        // Enable/disable submit button
        submitButton.disabled = !isValid || !anggotaId || !jenis || jumlah <= 0;
        
        // Update button appearance
        if (submitButton.disabled) {
            submitButton.classList.remove('btn-primary');
            submitButton.classList.add('btn-secondary');
        } else {
            submitButton.classList.remove('btn-secondary');
            submitButton.classList.add('btn-primary');
        }
        
        return isValid;
    }

    /**
     * Reset form pembayaran
     */
    resetFormPembayaran() {
        document.getElementById('formPembayaran').reset();
        document.getElementById('selectedAnggotaId').value = '';
        document.getElementById('selectedAnggotaNama').value = '';
        document.getElementById('selectedAnggotaNIK').value = '';
        document.getElementById('saldoDisplay').style.display = 'none';
        document.getElementById('anggotaSuggestions').style.display = 'none';
        
        // Reset validation states
        const jumlahInput = document.getElementById('jumlahPembayaran');
        jumlahInput.classList.remove('is-valid', 'is-invalid');
        jumlahInput.disabled = false;
        jumlahInput.removeAttribute('max');
        jumlahInput.placeholder = 'Masukkan jumlah pembayaran';
        
        const validationMessages = document.getElementById('formValidationMessages');
        if (validationMessages) {
            validationMessages.style.display = 'none';
        }
        
        const submitButton = document.getElementById('btnProsesPembayaran');
        submitButton.disabled = true;
        submitButton.classList.remove('btn-primary');
        submitButton.classList.add('btn-secondary');
        
        // Reset saldo highlighting
        const hutangContainer = document.getElementById('displaySaldoHutang')?.parentElement;
        const piutangContainer = document.getElementById('displaySaldoPiutang')?.parentElement;
        if (hutangContainer) {
            hutangContainer.classList.remove('border', 'border-danger', 'border-success', 'border-secondary', 'p-2', 'rounded', 'bg-light', 'opacity-50');
            hutangContainer.style.borderWidth = '';
            hutangContainer.style.borderStyle = '';
        }
        if (piutangContainer) {
            piutangContainer.classList.remove('border', 'border-danger', 'border-success', 'border-secondary', 'p-2', 'rounded', 'bg-light', 'opacity-50');
            piutangContainer.style.borderWidth = '';
            piutangContainer.style.borderStyle = '';
        }
    }

    /**
     * Render riwayat pembayaran using shared services
     * Requirements: 4.1, 4.2
     */
    renderRiwayatPembayaran() {
        const container = document.getElementById('riwayatPembayaranContainer');
        if (!container) return;
        
        container.innerHTML = `
            <!-- Filters -->
            <div class="row mb-3">
                <div class="col-md-3">
                    <label class="form-label">Jenis Pembayaran</label>
                    <select class="form-select" id="filterJenis" onchange="window.enhancedPembayaran.applyFilters()">
                        <option value="">Semua</option>
                        <option value="hutang">Hutang</option>
                        <option value="piutang">Piutang</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <label class="form-label">Mode Pembayaran</label>
                    <select class="form-select" id="filterMode" onchange="window.enhancedPembayaran.applyFilters()">
                        <option value="">Semua Mode</option>
                        <option value="manual">Manual</option>
                        <option value="import">Import Batch</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <label class="form-label">Dari Tanggal</label>
                    <input type="date" class="form-control" id="filterTanggalDari" onchange="window.enhancedPembayaran.applyFilters()">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Sampai Tanggal</label>
                    <input type="date" class="form-control" id="filterTanggalSampai" onchange="window.enhancedPembayaran.applyFilters()">
                </div>
            </div>
            
            <!-- Table -->
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>Tanggal</th>
                            <th>Anggota</th>
                            <th>Jenis</th>
                            <th>Mode</th>
                            <th>Jumlah</th>
                            <th>Saldo Sebelum</th>
                            <th>Saldo Sesudah</th>
                            <th>Kasir</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="riwayatTableBody">
                        <tr>
                            <td colspan="9" class="text-center">Memuat data...</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        
        // Load transactions using shared services
        this.loadRiwayatPembayaran();
    }

    /**
     * Load and display riwayat pembayaran using shared services
     * Requirements: 4.1, 4.2, 13.1 - Enhanced access validation
     */
    loadRiwayatPembayaran() {
        // Check history permission
        if (!checkOperationPermission('history')) {
            const tbody = document.getElementById('riwayatTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" class="text-center text-warning">
                            <i class="bi bi-exclamation-triangle"></i> 
                            Anda tidak memiliki izin untuk melihat riwayat pembayaran
                        </td>
                    </tr>
                `;
            }
            return;
        }
        
        try {
            // Get transaction history using shared services
            const filters = {
                jenis: document.getElementById('filterJenis')?.value || '',
                mode: document.getElementById('filterMode')?.value || '',
                tanggalDari: document.getElementById('filterTanggalDari')?.value || '',
                tanggalSampai: document.getElementById('filterTanggalSampai')?.value || ''
            };
            
            const pembayaranList = this.sharedServices.getTransactionHistory(filters);
            
            const tbody = document.getElementById('riwayatTableBody');
            if (!tbody) return;
            
            if (pembayaranList.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" class="text-center">Tidak ada data pembayaran</td>
                    </tr>
                `;
                return;
            }
            
            tbody.innerHTML = pembayaranList.map(p => {
                const jenisClass = p.jenis === 'hutang' ? 'text-danger' : 'text-success';
                const jenisText = p.jenis === 'hutang' ? 'Hutang' : 'Piutang';
                const modeClass = p.mode === 'import' ? 'bg-info' : 'bg-secondary';
                const modeText = p.mode === 'import' ? 'Import' : 'Manual';
                
                return `
                    <tr>
                        <td>${formatTanggal(p.tanggal)}</td>
                        <td>
                            <strong>${escapeHtml(p.anggotaNama)}</strong><br>
                            <small class="text-muted">${escapeHtml(p.anggotaNIK)}</small>
                        </td>
                        <td><span class="badge bg-${p.jenis === 'hutang' ? 'danger' : 'success'}">${jenisText}</span></td>
                        <td><span class="badge ${modeClass}">${modeText}</span></td>
                        <td class="${jenisClass}"><strong>${formatRupiah(p.jumlah)}</strong></td>
                        <td>${formatRupiah(p.saldoSebelum)}</td>
                        <td>${formatRupiah(p.saldoSesudah)}</td>
                        <td>${escapeHtml(p.kasirNama)}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="cetakBuktiPembayaran('${p.id}')" title="Cetak Bukti">
                                <i class="bi bi-printer"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading riwayat:', error);
            const tbody = document.getElementById('riwayatTableBody');
            if (tbody) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="9" class="text-center text-danger">Error memuat data</td>
                    </tr>
                `;
            }
        }
    }

    /**
     * Apply filters and reload table
     */
    applyFilters() {
        this.loadRiwayatPembayaran();
    }

    /**
     * Refresh summary data (for integration callbacks)
     * Requirements: 2.4, 2.5, 5.5
     */
    refreshSummaryData() {
        this.updateSummaryCards();
        this.loadRiwayatPembayaran();
    }

    /**
     * Get current tab compatibility status
     * Requirements: 2.4, 2.5 - Tab switching compatibility
     */
    isCompatibleWithTabSwitching() {
        return true; // This enhanced version is designed for tab integration
    }

    /**
     * Check for unsaved data
     * Requirements: 2.4, 2.5 - Tab switching compatibility
     */
    hasUnsavedData() {
        const anggotaId = document.getElementById('selectedAnggotaId')?.value || '';
        const jenis = document.getElementById('jenisPembayaran')?.value || '';
        const jumlah = document.getElementById('jumlahPembayaran')?.value || '';
        
        return anggotaId || jenis || jumlah;
    }

    /**
     * Save current state for tab switching
     * Requirements: 2.4, 2.5 - Tab switching compatibility
     */
    saveState() {
        return {
            anggotaId: document.getElementById('selectedAnggotaId')?.value || '',
            anggotaNama: document.getElementById('selectedAnggotaNama')?.value || '',
            anggotaNIK: document.getElementById('selectedAnggotaNIK')?.value || '',
            jenis: document.getElementById('jenisPembayaran')?.value || '',
            jumlah: document.getElementById('jumlahPembayaran')?.value || '',
            keterangan: document.getElementById('keteranganPembayaran')?.value || ''
        };
    }

    /**
     * Restore state after tab switching
     * Requirements: 2.4, 2.5 - Tab switching compatibility
     */
    restoreState(state) {
        if (state.anggotaId) {
            document.getElementById('selectedAnggotaId').value = state.anggotaId;
            document.getElementById('selectedAnggotaNama').value = state.anggotaNama;
            document.getElementById('selectedAnggotaNIK').value = state.anggotaNIK;
            document.getElementById('searchAnggota').value = `${state.anggotaNama} (${state.anggotaNIK})`;
            this.displaySaldoAnggotaAutomatic(state.anggotaId);
        }
        
        if (state.jenis) {
            document.getElementById('jenisPembayaran').value = state.jenis;
            this.onJenisChange();
        }
        
        if (state.jumlah) {
            document.getElementById('jumlahPembayaran').value = state.jumlah;
        }
        
        if (state.keterangan) {
            document.getElementById('keteranganPembayaran').value = state.keterangan;
        }
        
        this.validateFormRealTime();
    }
}

// Make enhanced class available globally
if (typeof window !== 'undefined') {
    window.PembayaranHutangPiutangEnhanced = PembayaranHutangPiutangEnhanced;
    
    // Create global instance for integration
    window.enhancedPembayaran = new PembayaranHutangPiutangEnhanced();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PembayaranHutangPiutangEnhanced };
}