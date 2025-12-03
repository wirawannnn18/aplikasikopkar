// Pembayaran Hutang Piutang Module

/**
 * Task 13.1: Check if user has permission to access this module
 * @returns {boolean} True if user has access
 */
function checkPembayaranAccess() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (!currentUser || !currentUser.role) {
        return false;
    }
    
    // Kasir and Admin can access payment module
    const allowedRoles = ['kasir', 'admin', 'super_admin'];
    return allowedRoles.includes(currentUser.role);
}

/**
 * Task 13.1: Check if user can process payments
 * @returns {boolean} True if user can process payments
 */
function canProcessPayment() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (!currentUser || !currentUser.role) {
        return false;
    }
    
    // Only Kasir and Admin can process payments
    const allowedRoles = ['kasir', 'admin', 'super_admin'];
    return allowedRoles.includes(currentUser.role);
}

/**
 * Task 13.1: Check if user can view all history
 * @returns {boolean} True if user can view all history
 */
function canViewAllHistory() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (!currentUser || !currentUser.role) {
        return false;
    }
    
    // Admin and Super Admin can view all history
    const allowedRoles = ['admin', 'super_admin'];
    return allowedRoles.includes(currentUser.role);
}

/**
 * Task 13.2: Sanitize text input to prevent XSS
 * @param {string} input - Text input to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return '';
    }
    
    // Remove HTML tags and encode special characters
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
}

/**
 * Task 13.2: Validate numeric input
 * @param {any} input - Input to validate
 * @returns {number|null} Valid number or null
 */
function validateNumericInput(input) {
    const num = parseFloat(input);
    
    if (isNaN(num) || !isFinite(num)) {
        return null;
    }
    
    // Check for negative numbers
    if (num < 0) {
        return null;
    }
    
    return num;
}

/**
 * Task 13.2: Validate date format (ISO 8601)
 * @param {string} dateString - Date string to validate
 * @returns {boolean} True if valid date
 */
function validateDateFormat(dateString) {
    if (!dateString || typeof dateString !== 'string') {
        return false;
    }
    
    // Check ISO 8601 format
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
    
    if (!isoDateRegex.test(dateString)) {
        return false;
    }
    
    // Check if date is valid
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Main render function for Pembayaran Hutang Piutang page
 * Task 13.1: Add access control check
 */
function renderPembayaranHutangPiutang() {
    // Task 13.1: Check access permission
    if (!checkPembayaranAccess()) {
        const content = document.getElementById('mainContent');
        content.innerHTML = `
            <div class="alert alert-danger">
                <h4><i class="bi bi-shield-x me-2"></i>Akses Ditolak</h4>
                <p>Anda tidak memiliki izin untuk mengakses modul Pembayaran Hutang Piutang.</p>
                <p>Hubungi administrator untuk mendapatkan akses.</p>
            </div>
        `;
        return;
    }
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 style="color: #2d6a4f; font-weight: 700;">
                <i class="bi bi-cash-coin me-2"></i>Pembayaran Hutang Piutang
            </h2>
        </div>
        
        <!-- Summary Cards -->
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card" style="border-left: 4px solid #e63946;">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">
                            <i class="bi bi-exclamation-triangle me-1"></i>Total Hutang Anggota
                        </h6>
                        <h3 style="color: #e63946; font-weight: 700;" id="totalHutangDisplay">Rp 0</h3>
                        <small class="text-muted">Belum dibayar dari transaksi kredit</small>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card" style="border-left: 4px solid #457b9d;">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">
                            <i class="bi bi-wallet2 me-1"></i>Total Piutang Anggota
                        </h6>
                        <h3 style="color: #457b9d; font-weight: 700;" id="totalPiutangDisplay">Rp 0</h3>
                        <small class="text-muted">Hak anggota yang belum dibayar</small>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Tabs -->
        <ul class="nav nav-tabs mb-3" id="pembayaranTabs" role="tablist">
            <li class="nav-item" role="presentation">
                <button class="nav-link active" id="hutang-tab" data-bs-toggle="tab" 
                    data-bs-target="#hutang-panel" type="button" role="tab">
                    <i class="bi bi-credit-card me-1"></i>Pembayaran Hutang
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="piutang-tab" data-bs-toggle="tab" 
                    data-bs-target="#piutang-panel" type="button" role="tab">
                    <i class="bi bi-wallet me-1"></i>Pembayaran Piutang
                </button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link" id="riwayat-tab" data-bs-toggle="tab" 
                    data-bs-target="#riwayat-panel" type="button" role="tab">
                    <i class="bi bi-clock-history me-1"></i>Riwayat Pembayaran
                </button>
            </li>
        </ul>
        
        <!-- Tab Content -->
        <div class="tab-content" id="pembayaranTabContent">
            <!-- Pembayaran Hutang Panel -->
            <div class="tab-pane fade show active" id="hutang-panel" role="tabpanel">
                <div class="card">
                    <div class="card-header" style="background: linear-gradient(135deg, #e63946 0%, #f77f00 100%); color: white;">
                        <h5 class="mb-0">
                            <i class="bi bi-credit-card me-2"></i>Form Pembayaran Hutang
                        </h5>
                    </div>
                    <div class="card-body">
                        <p class="text-muted">
                            <i class="bi bi-info-circle me-1"></i>
                            Proses pembayaran hutang dari anggota untuk melunasi transaksi kredit POS.
                        </p>
                        <div id="formPembayaranHutang">
                            <!-- Form will be rendered here -->
                            <div class="alert alert-info">
                                <i class="bi bi-tools me-2"></i>Form pembayaran hutang akan segera tersedia.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Pembayaran Piutang Panel -->
            <div class="tab-pane fade" id="piutang-panel" role="tabpanel">
                <div class="card">
                    <div class="card-header" style="background: linear-gradient(135deg, #457b9d 0%, #1d3557 100%); color: white;">
                        <h5 class="mb-0">
                            <i class="bi bi-wallet me-2"></i>Form Pembayaran Piutang
                        </h5>
                    </div>
                    <div class="card-body">
                        <p class="text-muted">
                            <i class="bi bi-info-circle me-1"></i>
                            Proses pembayaran piutang kepada anggota untuk melunasi hak anggota.
                        </p>
                        <div id="formPembayaranPiutang">
                            <!-- Form will be rendered here -->
                            <div class="alert alert-info">
                                <i class="bi bi-tools me-2"></i>Form pembayaran piutang akan segera tersedia.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Riwayat Panel -->
            <div class="tab-pane fade" id="riwayat-panel" role="tabpanel">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-clock-history me-2"></i>Riwayat Pembayaran
                        </h5>
                    </div>
                    <div class="card-body">
                        <div id="riwayatPembayaran">
                            <!-- History will be rendered here -->
                            <div class="alert alert-info">
                                <i class="bi bi-inbox me-2"></i>Belum ada riwayat pembayaran.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Initialize summary
    updateSummaryCards();
    
    // Render forms
    renderFormPembayaranHutang();
    renderFormPembayaranPiutang();
    renderRiwayatPembayaran();
    
    // Initialize autocomplete
    setTimeout(() => {
        initAutocompleteHutang();
        initAutocompletePiutang();
        
        // Task 11.3: Add input listeners for button state and validation
        const jumlahHutang = document.getElementById('jumlahPembayaranHutang');
        if (jumlahHutang) {
            jumlahHutang.addEventListener('input', updateButtonStateHutang);
            // Add keyboard support
            jumlahHutang.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const btn = document.getElementById('btnProsesPembayaranHutang');
                    if (!btn.disabled) {
                        prosesPembayaran('hutang');
                    }
                }
            });
        }
        
        const jumlahPiutang = document.getElementById('jumlahPembayaranPiutang');
        if (jumlahPiutang) {
            jumlahPiutang.addEventListener('input', updateButtonStatePiutang);
            // Add keyboard support
            jumlahPiutang.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const btn = document.getElementById('btnProsesPembayaranPiutang');
                    if (!btn.disabled) {
                        prosesPembayaran('piutang');
                    }
                }
            });
        }
    }, 100);
}

/**
 * Update summary cards with current totals
 */
function updateSummaryCards() {
    // Calculate total hutang
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    let totalHutang = 0;
    let totalPiutang = 0;
    
    anggota.forEach(a => {
        totalHutang += hitungSaldoHutang(a.id);
        totalPiutang += hitungSaldoPiutang(a.id);
    });
    
    // Update display
    const totalHutangEl = document.getElementById('totalHutangDisplay');
    const totalPiutangEl = document.getElementById('totalPiutangDisplay');
    
    if (totalHutangEl) {
        totalHutangEl.textContent = formatRupiah(totalHutang);
    }
    if (totalPiutangEl) {
        totalPiutangEl.textContent = formatRupiah(totalPiutang);
    }
}

/**
 * NOTE: Calculation functions have been moved to js/utils.js for shared use
 * 
 * The following functions are now available from utils.js:
 * - hitungSaldoHutang(anggotaId): Calculate hutang balance
 * - hitungSaldoPiutang(anggotaId): Calculate piutang balance
 * - hitungTotalPembayaranHutang(anggotaId): Calculate total payments
 * - hitungTotalKredit(anggotaId): Calculate total credit transactions
 * - getPembayaranHutangHistory(anggotaId): Get payment history
 * - getPembayaranPiutangHistory(anggotaId): Get piutang payment history
 * 
 * These functions are loaded via <script src="js/utils.js"></script> in index.html
 */

/**
 * Render form pembayaran hutang
 * Task 3.2: Create form pembayaran UI
 */
function renderFormPembayaranHutang() {
    const formContainer = document.getElementById('formPembayaranHutang');
    if (!formContainer) return;
    
    formContainer.innerHTML = `
        <form id="formHutang" onsubmit="return false;">
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">
                            <i class="bi bi-person-search me-1"></i>Cari Anggota <span class="text-danger">*</span>
                        </label>
                        <input type="text" class="form-control" id="searchAnggotaHutang" 
                            placeholder="Ketik NIK atau Nama anggota..." 
                            autocomplete="off">
                        <div id="suggestionsHutang" class="list-group position-absolute" style="z-index: 1000; max-height: 200px; overflow-y: auto; display: none;"></div>
                        <input type="hidden" id="selectedAnggotaIdHutang">
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">
                            <i class="bi bi-info-circle me-1"></i>Anggota Terpilih
                        </label>
                        <div class="form-control bg-light" id="selectedAnggotaDisplayHutang" style="min-height: 38px;">
                            <span class="text-muted">Belum ada anggota dipilih</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">
                            <i class="bi bi-wallet2 me-1"></i>Saldo Hutang Saat Ini
                        </label>
                        <div class="form-control bg-light" id="saldoHutangDisplay" style="font-weight: 700; color: #e63946;">
                            Rp 0
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">
                            <i class="bi bi-cash-stack me-1"></i>Jumlah Pembayaran <span class="text-danger">*</span>
                        </label>
                        <input type="number" class="form-control" id="jumlahPembayaranHutang" 
                            placeholder="Masukkan jumlah pembayaran" min="0" step="1000">
                        <div class="mt-2" id="quickAmountHutang" style="display: none;">
                            <small class="text-muted d-block mb-1">Jumlah Cepat:</small>
                            <div class="btn-group btn-group-sm" role="group">
                                <button type="button" class="btn btn-outline-secondary" onclick="setQuickAmount('hutang', 0.25)">25%</button>
                                <button type="button" class="btn btn-outline-secondary" onclick="setQuickAmount('hutang', 0.5)">50%</button>
                                <button type="button" class="btn btn-outline-secondary" onclick="setQuickAmount('hutang', 0.75)">75%</button>
                                <button type="button" class="btn btn-outline-primary" onclick="setQuickAmount('hutang', 1)">Lunas</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="mb-3">
                <label class="form-label">
                    <i class="bi bi-chat-left-text me-1"></i>Keterangan (Opsional)
                </label>
                <textarea class="form-control" id="keteranganHutang" rows="2" 
                    placeholder="Tambahkan keterangan jika diperlukan"></textarea>
            </div>
            
            <div class="d-flex justify-content-between align-items-center">
                <button type="button" class="btn btn-secondary" onclick="resetFormHutang()">
                    <i class="bi bi-arrow-clockwise me-1"></i>Reset Form
                </button>
                <button type="button" class="btn btn-primary" id="btnProsesPembayaranHutang" 
                    onclick="prosesPembayaran('hutang')" disabled>
                    <i class="bi bi-check-circle me-1"></i>Proses Pembayaran
                </button>
            </div>
        </form>
    `;
}

/**
 * Render form pembayaran piutang
 * Task 3.2: Create form pembayaran UI
 */
function renderFormPembayaranPiutang() {
    const formContainer = document.getElementById('formPembayaranPiutang');
    if (!formContainer) return;
    
    formContainer.innerHTML = `
        <form id="formPiutang" onsubmit="return false;">
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">
                            <i class="bi bi-person-search me-1"></i>Cari Anggota <span class="text-danger">*</span>
                        </label>
                        <input type="text" class="form-control" id="searchAnggotaPiutang" 
                            placeholder="Ketik NIK atau Nama anggota..." 
                            autocomplete="off">
                        <div id="suggestionsPiutang" class="list-group position-absolute" style="z-index: 1000; max-height: 200px; overflow-y: auto; display: none;"></div>
                        <input type="hidden" id="selectedAnggotaIdPiutang">
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">
                            <i class="bi bi-info-circle me-1"></i>Anggota Terpilih
                        </label>
                        <div class="form-control bg-light" id="selectedAnggotaDisplayPiutang" style="min-height: 38px;">
                            <span class="text-muted">Belum ada anggota dipilih</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">
                            <i class="bi bi-wallet2 me-1"></i>Saldo Piutang Saat Ini
                        </label>
                        <div class="form-control bg-light" id="saldoPiutangDisplay" style="font-weight: 700; color: #457b9d;">
                            Rp 0
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">
                            <i class="bi bi-cash-stack me-1"></i>Jumlah Pembayaran <span class="text-danger">*</span>
                        </label>
                        <input type="number" class="form-control" id="jumlahPembayaranPiutang" 
                            placeholder="Masukkan jumlah pembayaran" min="0" step="1000">
                        <div class="mt-2" id="quickAmountPiutang" style="display: none;">
                            <small class="text-muted d-block mb-1">Jumlah Cepat:</small>
                            <div class="btn-group btn-group-sm" role="group">
                                <button type="button" class="btn btn-outline-secondary" onclick="setQuickAmount('piutang', 0.25)">25%</button>
                                <button type="button" class="btn btn-outline-secondary" onclick="setQuickAmount('piutang', 0.5)">50%</button>
                                <button type="button" class="btn btn-outline-secondary" onclick="setQuickAmount('piutang', 0.75)">75%</button>
                                <button type="button" class="btn btn-outline-primary" onclick="setQuickAmount('piutang', 1)">Lunas</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="mb-3">
                <label class="form-label">
                    <i class="bi bi-chat-left-text me-1"></i>Keterangan (Opsional)
                </label>
                <textarea class="form-control" id="keteranganPiutang" rows="2" 
                    placeholder="Tambahkan keterangan jika diperlukan"></textarea>
            </div>
            
            <div class="d-flex justify-content-between align-items-center">
                <button type="button" class="btn btn-secondary" onclick="resetFormPiutang()">
                    <i class="bi bi-arrow-clockwise me-1"></i>Reset Form
                </button>
                <button type="button" class="btn btn-primary" id="btnProsesPembayaranPiutang" 
                    onclick="prosesPembayaran('piutang')" disabled>
                    <i class="bi bi-check-circle me-1"></i>Proses Pembayaran
                </button>
            </div>
        </form>
    `;
}

/**
 * Reset form pembayaran hutang
 */
function resetFormHutang() {
    document.getElementById('searchAnggotaHutang').value = '';
    document.getElementById('selectedAnggotaIdHutang').value = '';
    document.getElementById('selectedAnggotaDisplayHutang').innerHTML = '<span class="text-muted">Belum ada anggota dipilih</span>';
    document.getElementById('saldoHutangDisplay').textContent = 'Rp 0';
    document.getElementById('jumlahPembayaranHutang').value = '';
    document.getElementById('keteranganHutang').value = '';
    document.getElementById('btnProsesPembayaranHutang').disabled = true;
    document.getElementById('suggestionsHutang').style.display = 'none';
}

/**
 * Reset form pembayaran piutang
 */
function resetFormPiutang() {
    document.getElementById('searchAnggotaPiutang').value = '';
    document.getElementById('selectedAnggotaIdPiutang').value = '';
    document.getElementById('selectedAnggotaDisplayPiutang').innerHTML = '<span class="text-muted">Belum ada anggota dipilih</span>';
    document.getElementById('saldoPiutangDisplay').textContent = 'Rp 0';
    document.getElementById('jumlahPembayaranPiutang').value = '';
    document.getElementById('keteranganPiutang').value = '';
    document.getElementById('btnProsesPembayaranPiutang').disabled = true;
    document.getElementById('suggestionsPiutang').style.display = 'none';
}

/**
 * Task 4.1: Search anggota by NIK or nama
 * @param {string} query - Search query
 * @returns {Array} Matching anggota (max 10)
 */
function searchAnggota(query) {
    if (!query || query.trim().length < 2) {
        return [];
    }
    
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const searchTerm = query.toLowerCase().trim();
    
    // Filter by NIK or nama
    const results = anggota.filter(a => {
        const nik = (a.nik || '').toLowerCase();
        const nama = (a.nama || '').toLowerCase();
        return nik.includes(searchTerm) || nama.includes(searchTerm);
    });
    
    // Limit to 10 results
    return results.slice(0, 10);
}

/**
 * Task 4.2: Render autocomplete suggestions
 * @param {Array} results - Search results
 * @param {string} containerId - ID of suggestions container
 * @param {string} jenis - 'hutang' or 'piutang'
 */
function renderAnggotaSuggestions(results, containerId, jenis) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (results.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.innerHTML = results.map(a => `
        <button type="button" class="list-group-item list-group-item-action" 
            onclick="selectAnggota('${a.id}', '${jenis}')">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${a.nama}</strong>
                    <br>
                    <small class="text-muted">NIK: ${a.nik}</small>
                </div>
                <div class="text-end">
                    <small class="badge bg-secondary">${a.departemen || '-'}</small>
                </div>
            </div>
        </button>
    `).join('');
    
    container.style.display = 'block';
}

/**
 * Select anggota from autocomplete
 * Task 11.1: Add automatic saldo display on anggota selection
 * @param {string} anggotaId - Selected anggota ID
 * @param {string} jenis - 'hutang' or 'piutang'
 */
function selectAnggota(anggotaId, jenis) {
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const selected = anggota.find(a => a.id === anggotaId);
    
    if (!selected) return;
    
    if (jenis === 'hutang') {
        // Update hutang form
        document.getElementById('selectedAnggotaIdHutang').value = selected.id;
        document.getElementById('selectedAnggotaDisplayHutang').innerHTML = `
            <strong>${selected.nama}</strong> - NIK: ${selected.nik}
        `;
        
        // Task 11.1: Calculate and display BOTH hutang and piutang saldo
        const saldoHutang = hitungSaldoHutang(selected.id);
        const saldoPiutang = hitungSaldoPiutang(selected.id);
        
        // Display hutang saldo with visual feedback
        const saldoHutangEl = document.getElementById('saldoHutangDisplay');
        saldoHutangEl.textContent = formatRupiah(saldoHutang);
        
        // Add visual feedback based on saldo
        if (saldoHutang > 0) {
            saldoHutangEl.style.color = '#e63946';
            saldoHutangEl.style.fontWeight = '700';
        } else {
            saldoHutangEl.style.color = '#52b788';
            saldoHutangEl.style.fontWeight = '400';
        }
        
        // Task 11.2: Show/hide quick amount buttons based on saldo
        const quickAmountEl = document.getElementById('quickAmountHutang');
        if (quickAmountEl) {
            if (saldoHutang > 0) {
                quickAmountEl.style.display = 'block';
            } else {
                quickAmountEl.style.display = 'none';
            }
        }
        
        // Show info about piutang if exists
        showSaldoInfo('hutang', saldoHutang, saldoPiutang, selected.nama);
        
        // Hide suggestions
        document.getElementById('suggestionsHutang').style.display = 'none';
        
        // Clear search input
        document.getElementById('searchAnggotaHutang').value = '';
        
        // Enable/disable button based on saldo
        updateButtonStateHutang();
    } else if (jenis === 'piutang') {
        // Update piutang form
        document.getElementById('selectedAnggotaIdPiutang').value = selected.id;
        document.getElementById('selectedAnggotaDisplayPiutang').innerHTML = `
            <strong>${selected.nama}</strong> - NIK: ${selected.nik}
        `;
        
        // Task 11.1: Calculate and display BOTH hutang and piutang saldo
        const saldoHutang = hitungSaldoHutang(selected.id);
        const saldoPiutang = hitungSaldoPiutang(selected.id);
        
        // Display piutang saldo with visual feedback
        const saldoPiutangEl = document.getElementById('saldoPiutangDisplay');
        saldoPiutangEl.textContent = formatRupiah(saldoPiutang);
        
        // Add visual feedback based on saldo
        if (saldoPiutang > 0) {
            saldoPiutangEl.style.color = '#457b9d';
            saldoPiutangEl.style.fontWeight = '700';
        } else {
            saldoPiutangEl.style.color = '#52b788';
            saldoPiutangEl.style.fontWeight = '400';
        }
        
        // Task 11.2: Show/hide quick amount buttons based on saldo
        const quickAmountEl = document.getElementById('quickAmountPiutang');
        if (quickAmountEl) {
            if (saldoPiutang > 0) {
                quickAmountEl.style.display = 'block';
            } else {
                quickAmountEl.style.display = 'none';
            }
        }
        
        // Show info about hutang if exists
        showSaldoInfo('piutang', saldoHutang, saldoPiutang, selected.nama);
        
        // Hide suggestions
        document.getElementById('suggestionsPiutang').style.display = 'none';
        
        // Clear search input
        document.getElementById('searchAnggotaPiutang').value = '';
        
        // Enable/disable button based on saldo
        updateButtonStatePiutang();
    }
}

/**
 * Task 11.1: Show additional saldo information
 * Display both hutang and piutang saldo for selected anggota
 * @param {string} currentJenis - Current form type ('hutang' or 'piutang')
 * @param {number} saldoHutang - Hutang balance
 * @param {number} saldoPiutang - Piutang balance
 * @param {string} anggotaNama - Anggota name
 */
function showSaldoInfo(currentJenis, saldoHutang, saldoPiutang, anggotaNama) {
    const formId = currentJenis === 'hutang' ? 'formHutang' : 'formPiutang';
    const form = document.getElementById(formId);
    if (!form) return;
    
    // Remove existing info if any
    const existingInfo = form.querySelector('.saldo-info-alert');
    if (existingInfo) {
        existingInfo.remove();
    }
    
    // Create info message
    let infoHTML = '';
    
    if (currentJenis === 'hutang') {
        if (saldoHutang <= 0) {
            infoHTML = `
                <div class="alert alert-success saldo-info-alert mt-2">
                    <i class="bi bi-check-circle me-2"></i>
                    <strong>${anggotaNama}</strong> tidak memiliki hutang yang perlu dibayar.
                </div>
            `;
        } else if (saldoPiutang > 0) {
            infoHTML = `
                <div class="alert alert-info saldo-info-alert mt-2">
                    <i class="bi bi-info-circle me-2"></i>
                    <strong>${anggotaNama}</strong> juga memiliki piutang sebesar <strong>${formatRupiah(saldoPiutang)}</strong>
                </div>
            `;
        }
    } else if (currentJenis === 'piutang') {
        if (saldoPiutang <= 0) {
            infoHTML = `
                <div class="alert alert-success saldo-info-alert mt-2">
                    <i class="bi bi-check-circle me-2"></i>
                    <strong>${anggotaNama}</strong> tidak memiliki piutang yang perlu dibayar.
                </div>
            `;
        } else if (saldoHutang > 0) {
            infoHTML = `
                <div class="alert alert-warning saldo-info-alert mt-2">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <strong>${anggotaNama}</strong> juga memiliki hutang sebesar <strong>${formatRupiah(saldoHutang)}</strong>
                </div>
            `;
        }
    }
    
    // Insert info after the first row
    if (infoHTML) {
        const firstRow = form.querySelector('.row');
        if (firstRow) {
            firstRow.insertAdjacentHTML('afterend', infoHTML);
        }
    }
}

/**
 * Task 4.3: Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Initialize autocomplete for hutang form
 */
function initAutocompleteHutang() {
    const searchInput = document.getElementById('searchAnggotaHutang');
    if (!searchInput) return;
    
    const debouncedSearch = debounce((query) => {
        const results = searchAnggota(query);
        renderAnggotaSuggestions(results, 'suggestionsHutang', 'hutang');
    }, 300);
    
    searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#searchAnggotaHutang') && !e.target.closest('#suggestionsHutang')) {
            const container = document.getElementById('suggestionsHutang');
            if (container) container.style.display = 'none';
        }
    });
}

/**
 * Initialize autocomplete for piutang form
 */
function initAutocompletePiutang() {
    const searchInput = document.getElementById('searchAnggotaPiutang');
    if (!searchInput) return;
    
    const debouncedSearch = debounce((query) => {
        const results = searchAnggota(query);
        renderAnggotaSuggestions(results, 'suggestionsPiutang', 'piutang');
    }, 300);
    
    searchInput.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#searchAnggotaPiutang') && !e.target.closest('#suggestionsPiutang')) {
            const container = document.getElementById('suggestionsPiutang');
            if (container) container.style.display = 'none';
        }
    });
}

/**
 * Task 11.2 & 11.3: Update button state for hutang form with validation feedback
 */
function updateButtonStateHutang() {
    const anggotaId = document.getElementById('selectedAnggotaIdHutang').value;
    const jumlahInput = document.getElementById('jumlahPembayaranHutang');
    const jumlah = parseFloat(jumlahInput.value) || 0;
    const button = document.getElementById('btnProsesPembayaranHutang');
    const saldoDisplay = document.getElementById('saldoHutangDisplay');
    
    // Remove existing validation feedback
    removeValidationFeedback('jumlahPembayaranHutang');
    
    // Get current saldo
    const saldo = anggotaId ? hitungSaldoHutang(anggotaId) : 0;
    
    // Task 11.2: Highlight relevant saldo
    if (saldoDisplay) {
        if (saldo > 0) {
            saldoDisplay.parentElement.classList.add('border', 'border-danger', 'border-2');
            saldoDisplay.parentElement.classList.remove('border-success');
        } else {
            saldoDisplay.parentElement.classList.add('border', 'border-success', 'border-2');
            saldoDisplay.parentElement.classList.remove('border-danger');
        }
    }
    
    // Task 11.3: Real-time validation feedback
    let isValid = true;
    let feedbackMessage = '';
    
    if (!anggotaId) {
        isValid = false;
        feedbackMessage = 'Pilih anggota terlebih dahulu';
    } else if (saldo <= 0) {
        isValid = false;
        feedbackMessage = 'Anggota tidak memiliki hutang';
        showValidationFeedback('jumlahPembayaranHutang', feedbackMessage, 'warning');
    } else if (jumlah <= 0 && jumlahInput.value !== '') {
        isValid = false;
        feedbackMessage = 'Jumlah harus lebih dari 0';
        showValidationFeedback('jumlahPembayaranHutang', feedbackMessage, 'danger');
    } else if (jumlah > saldo) {
        isValid = false;
        feedbackMessage = `Jumlah melebihi saldo hutang (${formatRupiah(saldo)})`;
        showValidationFeedback('jumlahPembayaranHutang', feedbackMessage, 'danger');
    } else if (jumlah > 0 && jumlah <= saldo) {
        feedbackMessage = `Sisa hutang setelah pembayaran: ${formatRupiah(saldo - jumlah)}`;
        showValidationFeedback('jumlahPembayaranHutang', feedbackMessage, 'success');
    }
    
    // Enable/disable button
    button.disabled = !isValid || jumlah <= 0;
}

/**
 * Task 11.2 & 11.3: Update button state for piutang form with validation feedback
 */
function updateButtonStatePiutang() {
    const anggotaId = document.getElementById('selectedAnggotaIdPiutang').value;
    const jumlahInput = document.getElementById('jumlahPembayaranPiutang');
    const jumlah = parseFloat(jumlahInput.value) || 0;
    const button = document.getElementById('btnProsesPembayaranPiutang');
    const saldoDisplay = document.getElementById('saldoPiutangDisplay');
    
    // Remove existing validation feedback
    removeValidationFeedback('jumlahPembayaranPiutang');
    
    // Get current saldo
    const saldo = anggotaId ? hitungSaldoPiutang(anggotaId) : 0;
    
    // Task 11.2: Highlight relevant saldo
    if (saldoDisplay) {
        if (saldo > 0) {
            saldoDisplay.parentElement.classList.add('border', 'border-info', 'border-2');
            saldoDisplay.parentElement.classList.remove('border-success');
        } else {
            saldoDisplay.parentElement.classList.add('border', 'border-success', 'border-2');
            saldoDisplay.parentElement.classList.remove('border-info');
        }
    }
    
    // Task 11.3: Real-time validation feedback
    let isValid = true;
    let feedbackMessage = '';
    
    if (!anggotaId) {
        isValid = false;
        feedbackMessage = 'Pilih anggota terlebih dahulu';
    } else if (saldo <= 0) {
        isValid = false;
        feedbackMessage = 'Anggota tidak memiliki piutang';
        showValidationFeedback('jumlahPembayaranPiutang', feedbackMessage, 'warning');
    } else if (jumlah <= 0 && jumlahInput.value !== '') {
        isValid = false;
        feedbackMessage = 'Jumlah harus lebih dari 0';
        showValidationFeedback('jumlahPembayaranPiutang', feedbackMessage, 'danger');
    } else if (jumlah > saldo) {
        isValid = false;
        feedbackMessage = `Jumlah melebihi saldo piutang (${formatRupiah(saldo)})`;
        showValidationFeedback('jumlahPembayaranPiutang', feedbackMessage, 'danger');
    } else if (jumlah > 0 && jumlah <= saldo) {
        feedbackMessage = `Sisa piutang setelah pembayaran: ${formatRupiah(saldo - jumlah)}`;
        showValidationFeedback('jumlahPembayaranPiutang', feedbackMessage, 'success');
    }
    
    // Enable/disable button
    button.disabled = !isValid || jumlah <= 0;
}

/**
 * Task 11.3: Show validation feedback message
 * @param {string} inputId - Input element ID
 * @param {string} message - Feedback message
 * @param {string} type - Feedback type ('success', 'danger', 'warning')
 */
function showValidationFeedback(inputId, message, type) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    // Remove existing feedback
    removeValidationFeedback(inputId);
    
    // Add validation class to input
    input.classList.remove('is-valid', 'is-invalid');
    if (type === 'success') {
        input.classList.add('is-valid');
    } else if (type === 'danger') {
        input.classList.add('is-invalid');
    }
    
    // Create feedback element
    const feedbackClass = type === 'success' ? 'valid-feedback' : 
                         type === 'danger' ? 'invalid-feedback' : 
                         'text-warning';
    
    const feedback = document.createElement('div');
    feedback.className = `${feedbackClass} d-block validation-feedback-custom`;
    feedback.innerHTML = `<small><i class="bi bi-${type === 'success' ? 'check-circle' : type === 'danger' ? 'x-circle' : 'exclamation-triangle'} me-1"></i>${message}</small>`;
    
    // Insert after input
    input.parentElement.appendChild(feedback);
}

/**
 * Task 11.3: Remove validation feedback
 * @param {string} inputId - Input element ID
 */
function removeValidationFeedback(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    // Remove validation classes
    input.classList.remove('is-valid', 'is-invalid');
    
    // Remove feedback elements
    const feedback = input.parentElement.querySelector('.validation-feedback-custom');
    if (feedback) {
        feedback.remove();
    }
}

/**
 * Task 11.2: Set quick amount for payment
 * @param {string} jenis - Payment type ('hutang' or 'piutang')
 * @param {number} percentage - Percentage of saldo (0.25, 0.5, 0.75, 1)
 */
function setQuickAmount(jenis, percentage) {
    if (jenis === 'hutang') {
        const anggotaId = document.getElementById('selectedAnggotaIdHutang').value;
        if (!anggotaId) return;
        
        const saldo = hitungSaldoHutang(anggotaId);
        const jumlah = Math.round(saldo * percentage);
        
        document.getElementById('jumlahPembayaranHutang').value = jumlah;
        updateButtonStateHutang();
    } else if (jenis === 'piutang') {
        const anggotaId = document.getElementById('selectedAnggotaIdPiutang').value;
        if (!anggotaId) return;
        
        const saldo = hitungSaldoPiutang(anggotaId);
        const jumlah = Math.round(saldo * percentage);
        
        document.getElementById('jumlahPembayaranPiutang').value = jumlah;
        updateButtonStatePiutang();
    }
}


/**
 * Task 5.1: Validate pembayaran data
 * @param {Object} data - Payment data to validate
 * @param {string} data.anggotaId - Selected anggota ID
 * @param {string} data.jenis - Payment type ('hutang' or 'piutang')
 * @param {number} data.jumlah - Payment amount
 * @param {number} data.saldo - Current saldo
 * @returns {Object} Validation result with isValid and errors array
 */
function validatePembayaran(data) {
    const errors = [];
    
    // Validate anggota is selected
    if (!data.anggotaId || data.anggotaId.trim() === '') {
        errors.push('Anggota harus dipilih');
    }
    
    // Validate jenis pembayaran
    if (!data.jenis || (data.jenis !== 'hutang' && data.jenis !== 'piutang')) {
        errors.push('Jenis pembayaran tidak valid');
    }
    
    // Validate jumlah > 0
    if (!data.jumlah || data.jumlah <= 0) {
        errors.push('Jumlah pembayaran harus lebih besar dari 0');
    }
    
    // Validate jumlah is a valid number
    if (isNaN(data.jumlah)) {
        errors.push('Jumlah pembayaran harus berupa angka');
    }
    
    // Validate jumlah <= saldo
    if (data.jumlah > data.saldo) {
        const jenisText = data.jenis === 'hutang' ? 'hutang' : 'piutang';
        errors.push(`Jumlah pembayaran tidak boleh melebihi saldo ${jenisText} (Rp ${formatRupiah(data.saldo)})`);
    }
    
    // Validate saldo exists (for hutang, must have outstanding balance)
    if (data.jenis === 'hutang' && (!data.saldo || data.saldo <= 0)) {
        errors.push('Anggota tidak memiliki hutang yang perlu dibayar');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}


/**
 * Task 6.2 & 13.2: Save pembayaran to localStorage with input sanitization
 * @param {Object} data - Payment data
 * @returns {Object} Saved transaction object
 */
function savePembayaran(data) {
    const pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
    
    // Generate unique transaction ID
    const transaksiId = 'PHT-' + Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    // Get current user
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    // Task 13.2: Sanitize all text inputs
    const sanitizedData = {
        anggotaId: sanitizeInput(data.anggotaId),
        anggotaNama: sanitizeInput(data.anggotaNama),
        anggotaNIK: sanitizeInput(data.anggotaNIK),
        jenis: sanitizeInput(data.jenis),
        keterangan: sanitizeInput(data.keterangan || '')
    };
    
    // Task 13.2: Validate numeric inputs
    const validatedJumlah = validateNumericInput(data.jumlah);
    const validatedSaldoSebelum = validateNumericInput(data.saldoSebelum);
    const validatedSaldoSesudah = validateNumericInput(data.saldoSesudah);
    
    if (validatedJumlah === null || validatedSaldoSebelum === null || validatedSaldoSesudah === null) {
        throw new Error('Invalid numeric data in transaction');
    }
    
    // Task 13.2: Validate date format
    const tanggal = data.tanggal || new Date().toISOString();
    if (!validateDateFormat(tanggal)) {
        throw new Error('Invalid date format');
    }
    
    // Create transaction object
    const transaksi = {
        id: transaksiId,
        tanggal: tanggal,
        anggotaId: sanitizedData.anggotaId,
        anggotaNama: sanitizedData.anggotaNama,
        anggotaNIK: sanitizedData.anggotaNIK,
        jenis: sanitizedData.jenis,
        jumlah: validatedJumlah,
        saldoSebelum: validatedSaldoSebelum,
        saldoSesudah: validatedSaldoSesudah,
        keterangan: sanitizedData.keterangan,
        kasirId: currentUser.id || '',
        kasirNama: sanitizeInput(currentUser.nama || 'System'),
        status: 'selesai',
        createdAt: new Date().toISOString()
    };
    
    // Add to array
    pembayaran.push(transaksi);
    
    // Save to localStorage
    localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaran));
    
    return transaksi;
}

/**
 * Task 6.3: Rollback pembayaran transaction
 * @param {string} transaksiId - Transaction ID to rollback
 * @returns {boolean} Success status
 */
function rollbackPembayaran(transaksiId) {
    try {
        const pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
        
        // Find and remove transaction
        const index = pembayaran.findIndex(p => p.id === transaksiId);
        
        if (index === -1) {
            console.error('Transaction not found:', transaksiId);
            return false;
        }
        
        // Remove transaction
        pembayaran.splice(index, 1);
        
        // Save updated array
        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaran));
        
        return true;
    } catch (error) {
        console.error('Rollback error:', error);
        return false;
    }
}

/**
 * Task 6.1, 12.1 & 13: Process pembayaran transaction
 * Main function to process payment with validation, journal entry, and error handling
 * @param {string} jenis - Payment type ('hutang' or 'piutang')
 */
function prosesPembayaran(jenis) {
    try {
        // Task 13.1: Check if user can process payment
        if (!canProcessPayment()) {
            showAlert('Anda tidak memiliki izin untuk memproses pembayaran', 'danger');
            return;
        }
        
        // Get form data based on jenis
        let anggotaId, jumlah, keterangan;
        
        if (jenis === 'hutang') {
            anggotaId = document.getElementById('selectedAnggotaIdHutang').value;
            jumlah = parseFloat(document.getElementById('jumlahPembayaranHutang').value) || 0;
            keterangan = document.getElementById('keteranganHutang').value;
        } else if (jenis === 'piutang') {
            anggotaId = document.getElementById('selectedAnggotaIdPiutang').value;
            jumlah = parseFloat(document.getElementById('jumlahPembayaranPiutang').value) || 0;
            keterangan = document.getElementById('keteranganPiutang').value;
        } else {
            showAlert('Jenis pembayaran tidak valid', 'danger');
            return;
        }
        
        // Task 13.2: Sanitize text inputs
        anggotaId = sanitizeInput(anggotaId);
        keterangan = sanitizeInput(keterangan);
        
        // Task 13.2: Validate numeric input
        const validatedJumlah = validateNumericInput(jumlah);
        if (validatedJumlah === null) {
            showAlert('Jumlah pembayaran tidak valid', 'danger');
            return;
        }
        jumlah = validatedJumlah;
        
        // Get anggota data
        const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
        const selectedAnggota = anggota.find(a => a.id === anggotaId);
        
        if (!selectedAnggota) {
            showAlert('Data anggota tidak ditemukan', 'danger');
            return;
        }
        
        // Calculate saldo before
        const saldoSebelum = jenis === 'hutang' 
            ? hitungSaldoHutang(anggotaId) 
            : hitungSaldoPiutang(anggotaId);
        
        // Validate payment data
        const validationData = {
            anggotaId: anggotaId,
            jenis: jenis,
            jumlah: jumlah,
            saldo: saldoSebelum
        };
        
        const validation = validatePembayaran(validationData);
        
        if (!validation.isValid) {
            const errorMessage = validation.errors.join('<br>');
            showAlert(errorMessage, 'danger');
            return;
        }
        
        // Calculate saldo after
        const saldoSesudah = saldoSebelum - jumlah;
        
        // Task 12.1: Show confirmation dialog before processing
        showConfirmationDialog(jenis, selectedAnggota, jumlah, saldoSebelum, saldoSesudah, keterangan);
        
    } catch (error) {
        console.error('Process payment error:', error);
        
        // Log error
        saveAuditLog('PAYMENT_ERROR', {
            jenis: jenis,
            error: error.message,
            stack: error.stack
        });
        
        showAlert('Terjadi kesalahan saat memproses pembayaran: ' + error.message, 'danger');
    }
}

/**
 * Helper function to create journal entry for hutang payment
 * @param {Object} transaksi - Transaction object
 * @returns {boolean} Success status
 */
function createJurnalPembayaranHutang(transaksi) {
    try {
        const keterangan = `Pembayaran Hutang - ${transaksi.anggotaNama} (${transaksi.anggotaNIK})`;
        
        const entries = [
            {
                akunKode: '1-1000', // Kas
                akunNama: 'Kas',
                debit: transaksi.jumlah,
                kredit: 0
            },
            {
                akunKode: '2-1000', // Hutang Anggota
                akunNama: 'Hutang Anggota',
                debit: 0,
                kredit: transaksi.jumlah
            }
        ];
        
        // Call addJurnal function
        if (typeof addJurnal === 'function') {
            addJurnal(keterangan, entries, transaksi.tanggal);
            return true;
        } else {
            console.error('addJurnal function not found');
            return false;
        }
    } catch (error) {
        console.error('Create journal hutang error:', error);
        return false;
    }
}

/**
 * Helper function to create journal entry for piutang payment
 * @param {Object} transaksi - Transaction object
 * @returns {boolean} Success status
 */
function createJurnalPembayaranPiutang(transaksi) {
    try {
        const keterangan = `Pembayaran Piutang - ${transaksi.anggotaNama} (${transaksi.anggotaNIK})`;
        
        const entries = [
            {
                akunKode: '1-1200', // Piutang Anggota
                akunNama: 'Piutang Anggota',
                debit: transaksi.jumlah,
                kredit: 0
            },
            {
                akunKode: '1-1000', // Kas
                akunNama: 'Kas',
                debit: 0,
                kredit: transaksi.jumlah
            }
        ];
        
        // Call addJurnal function
        if (typeof addJurnal === 'function') {
            addJurnal(keterangan, entries, transaksi.tanggal);
            return true;
        } else {
            console.error('addJurnal function not found');
            return false;
        }
    } catch (error) {
        console.error('Create journal piutang error:', error);
        return false;
    }
}


/**
 * Task 8.1: Save audit log entry
 * @param {string} action - Action performed (e.g., 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'PRINT_RECEIPT')
 * @param {Object} details - Details of the action
 * @returns {Object} Saved audit log entry
 */
function saveAuditLog(action, details) {
    try {
        const auditLog = JSON.parse(localStorage.getItem('auditLogPembayaranHutangPiutang') || '[]');
        
        // Get current user
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        // Generate audit log entry
        const logEntry = {
            id: 'AUDIT-' + Date.now().toString(36) + Math.random().toString(36).substr(2),
            timestamp: new Date().toISOString(),
            userId: currentUser.id || '',
            userName: currentUser.nama || 'System',
            action: action,
            details: details,
            createdAt: new Date().toISOString()
        };
        
        // Add to array
        auditLog.push(logEntry);
        
        // Save to localStorage
        localStorage.setItem('auditLogPembayaranHutangPiutang', JSON.stringify(auditLog));
        
        return logEntry;
    } catch (error) {
        console.error('Save audit log error:', error);
        return null;
    }
}


/**
 * Task 9.1 & 13.1: Render riwayat pembayaran with access control
 * Display all payment transactions in a table
 */
function renderRiwayatPembayaran() {
	const container = document.getElementById('riwayatPembayaran');
	if (!container) return;
	
	// Task 13.1: Check if user can view history
	if (!canViewAllHistory()) {
		container.innerHTML = `
			<div class="alert alert-warning">
				<i class="bi bi-shield-exclamation me-2"></i>
				Anda tidak memiliki izin untuk melihat riwayat pembayaran lengkap.
			</div>
		`;
		return;
	}
	
	// Load all transactions
	const pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
	
	if (pembayaran.length === 0) {
		container.innerHTML = `
			<div class="alert alert-info">
				<i class="bi bi-inbox me-2"></i>Belum ada riwayat pembayaran.
			</div>
		`;
		return;
	}
	
	// Sort by date descending (newest first)
	const sortedPembayaran = pembayaran.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
	
	// Render filters
	const filterHTML = `
		<div class="row mb-3">
			<div class="col-md-3">
				<label class="form-label">Filter Jenis</label>
				<select class="form-select" id="filterJenis" onchange="applyFilters()">
					<option value="">Semua</option>
					<option value="hutang">Hutang</option>
					<option value="piutang">Piutang</option>
				</select>
			</div>
			<div class="col-md-3">
				<label class="form-label">Dari Tanggal</label>
				<input type="date" class="form-control" id="filterTanggalMulai" onchange="applyFilters()">
			</div>
			<div class="col-md-3">
				<label class="form-label">Sampai Tanggal</label>
				<input type="date" class="form-control" id="filterTanggalAkhir" onchange="applyFilters()">
			</div>
			<div class="col-md-3">
				<label class="form-label">Filter Anggota</label>
				<select class="form-select" id="filterAnggota" onchange="applyFilters()">
					<option value="">Semua Anggota</option>
					${getUniqueAnggotaOptions(sortedPembayaran)}
				</select>
			</div>
		</div>
	`;
	
	// Render table
	const tableHTML = `
		<div class="table-responsive">
			<table class="table table-striped table-hover" id="tableRiwayat">
				<thead class="table-dark">
					<tr>
						<th>Tanggal</th>
						<th>Anggota</th>
						<th>Jenis</th>
						<th>Jumlah</th>
						<th>Kasir</th>
						<th>Keterangan</th>
						<th>Aksi</th>
					</tr>
				</thead>
				<tbody id="tbodyRiwayat">
					${renderTransactionRows(sortedPembayaran)}
				</tbody>
			</table>
		</div>
	`;
	
	container.innerHTML = filterHTML + tableHTML;
}

/**
 * Helper: Get unique anggota options for filter
 */
function getUniqueAnggotaOptions(pembayaran) {
	const uniqueAnggota = {};
	pembayaran.forEach(p => {
		if (p.anggotaId && !uniqueAnggota[p.anggotaId]) {
			uniqueAnggota[p.anggotaId] = p.anggotaNama;
		}
	});
	
	return Object.keys(uniqueAnggota)
		.map(id => `<option value="${id}">${uniqueAnggota[id]}</option>`)
		.join('');
}

/**
 * Helper: Render transaction rows
 */
function renderTransactionRows(pembayaran) {
	if (pembayaran.length === 0) {
		return `
			<tr>
				<td colspan="7" class="text-center text-muted">
					Tidak ada data yang sesuai dengan filter
				</td>
			</tr>
		`;
	}
	
	return pembayaran.map(p => {
		const tanggal = new Date(p.tanggal).toLocaleDateString('id-ID', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
		
		const jenisBadge = p.jenis === 'hutang' 
			? '<span class="badge bg-danger">Hutang</span>'
			: '<span class="badge bg-info">Piutang</span>';
		
		return `
			<tr>
				<td>${tanggal}</td>
				<td>
					<strong>${p.anggotaNama}</strong><br>
					<small class="text-muted">NIK: ${p.anggotaNIK}</small>
				</td>
				<td>${jenisBadge}</td>
				<td><strong>${formatRupiah(p.jumlah)}</strong></td>
				<td>${p.kasirNama}</td>
				<td>${p.keterangan || '-'}</td>
				<td>
					<button class="btn btn-sm btn-outline-primary" onclick="cetakBuktiPembayaran('${p.id}')" title="Cetak Bukti">
						<i class="bi bi-printer"></i>
					</button>
				</td>
			</tr>
		`;
	}).join('');
}

/**
 * Task 9.2, 9.3, 9.4: Apply filters to transaction history
 */
function applyFilters() {
	// Load all transactions
	const allPembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
	
	// Get filter values
	const filterJenis = document.getElementById('filterJenis')?.value || '';
	const filterTanggalMulai = document.getElementById('filterTanggalMulai')?.value || '';
	const filterTanggalAkhir = document.getElementById('filterTanggalAkhir')?.value || '';
	const filterAnggota = document.getElementById('filterAnggota')?.value || '';
	
	// Apply filters
	let filtered = allPembayaran;
	
	// Filter by jenis
	if (filterJenis) {
		filtered = filtered.filter(p => p.jenis === filterJenis);
	}
	
	// Filter by date range
	if (filterTanggalMulai) {
		const startDate = new Date(filterTanggalMulai);
		startDate.setHours(0, 0, 0, 0);
		filtered = filtered.filter(p => new Date(p.tanggal) >= startDate);
	}
	
	if (filterTanggalAkhir) {
		const endDate = new Date(filterTanggalAkhir);
		endDate.setHours(23, 59, 59, 999);
		filtered = filtered.filter(p => new Date(p.tanggal) <= endDate);
	}
	
	// Filter by anggota
	if (filterAnggota) {
		filtered = filtered.filter(p => p.anggotaId === filterAnggota);
	}
	
	// Sort by date descending
	filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
	
	// Update table
	const tbody = document.getElementById('tbodyRiwayat');
	if (tbody) {
		tbody.innerHTML = renderTransactionRows(filtered);
	}
}


/**
 * Task 12.1: Show confirmation dialog before processing payment
 * @param {string} jenis - Payment type
 * @param {Object} anggota - Selected anggota object
 * @param {number} jumlah - Payment amount
 * @param {number} saldoSebelum - Balance before payment
 * @param {number} saldoSesudah - Balance after payment
 * @param {string} keterangan - Notes
 */
function showConfirmationDialog(jenis, anggota, jumlah, saldoSebelum, saldoSesudah, keterangan) {
    const jenisText = jenis === 'hutang' ? 'Hutang' : 'Piutang';
    const jenisColor = jenis === 'hutang' ? '#e63946' : '#457b9d';
    
    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="confirmPaymentModal" tabindex="-1" aria-labelledby="confirmPaymentModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header" style="background: ${jenisColor}; color: white;">
                        <h5 class="modal-title" id="confirmPaymentModalLabel">
                            <i class="bi bi-exclamation-circle me-2"></i>Konfirmasi Pembayaran ${jenisText}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-warning">
                            <i class="bi bi-info-circle me-2"></i>
                            Pastikan data pembayaran sudah benar sebelum melanjutkan.
                        </div>
                        
                        <table class="table table-borderless">
                            <tr>
                                <td class="text-muted" style="width: 40%;">Anggota:</td>
                                <td><strong>${anggota.nama}</strong></td>
                            </tr>
                            <tr>
                                <td class="text-muted">NIK:</td>
                                <td>${anggota.nik}</td>
                            </tr>
                            <tr>
                                <td class="text-muted">Jenis Pembayaran:</td>
                                <td><span class="badge" style="background: ${jenisColor};">${jenisText}</span></td>
                            </tr>
                            <tr>
                                <td class="text-muted">Saldo Sebelum:</td>
                                <td><strong>${formatRupiah(saldoSebelum)}</strong></td>
                            </tr>
                            <tr>
                                <td class="text-muted">Jumlah Pembayaran:</td>
                                <td><strong style="color: ${jenisColor}; font-size: 1.2em;">${formatRupiah(jumlah)}</strong></td>
                            </tr>
                            <tr>
                                <td class="text-muted">Saldo Sesudah:</td>
                                <td><strong style="color: #52b788;">${formatRupiah(saldoSesudah)}</strong></td>
                            </tr>
                            ${keterangan ? `
                            <tr>
                                <td class="text-muted">Keterangan:</td>
                                <td>${keterangan}</td>
                            </tr>
                            ` : ''}
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-1"></i>Batal
                        </button>
                        <button type="button" class="btn btn-primary" id="btnConfirmPayment" style="background: ${jenisColor}; border-color: ${jenisColor};">
                            <i class="bi bi-check-circle me-1"></i>Ya, Proses Pembayaran
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('confirmPaymentModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('confirmPaymentModal'));
    modal.show();
    
    // Handle confirmation
    document.getElementById('btnConfirmPayment').addEventListener('click', () => {
        modal.hide();
        // Process payment after confirmation
        executePayment(jenis, anggota, jumlah, saldoSebelum, saldoSesudah, keterangan);
    });
    
    // Clean up modal after hide
    document.getElementById('confirmPaymentModal').addEventListener('hidden.bs.modal', () => {
        document.getElementById('confirmPaymentModal').remove();
    });
}

/**
 * Task 12.1: Execute payment after confirmation
 * @param {string} jenis - Payment type
 * @param {Object} anggota - Selected anggota object
 * @param {number} jumlah - Payment amount
 * @param {number} saldoSebelum - Balance before payment
 * @param {number} saldoSesudah - Balance after payment
 * @param {string} keterangan - Notes
 */
function executePayment(jenis, anggota, jumlah, saldoSebelum, saldoSesudah, keterangan) {
    try {
        // Prepare transaction data
        const transaksiData = {
            anggotaId: anggota.id,
            anggotaNama: anggota.nama,
            anggotaNIK: anggota.nik,
            jenis: jenis,
            jumlah: jumlah,
            saldoSebelum: saldoSebelum,
            saldoSesudah: saldoSesudah,
            keterangan: keterangan
        };
        
        // Save transaction
        const transaksi = savePembayaran(transaksiData);
        
        // Create journal entry
        let jurnalSuccess = false;
        try {
            if (jenis === 'hutang') {
                jurnalSuccess = createJurnalPembayaranHutang(transaksi);
            } else if (jenis === 'piutang') {
                jurnalSuccess = createJurnalPembayaranPiutang(transaksi);
            }
        } catch (jurnalError) {
            console.error('Journal entry error:', jurnalError);
            // Rollback transaction
            rollbackPembayaran(transaksi.id);
            
            // Task 12.3: Show user-friendly error message
            showErrorDialog(
                'Gagal Mencatat Jurnal',
                'Terjadi kesalahan saat mencatat jurnal akuntansi. Transaksi telah dibatalkan.',
                'Silakan coba lagi atau hubungi administrator jika masalah berlanjut.'
            );
            return;
        }
        
        if (!jurnalSuccess) {
            // Rollback transaction
            rollbackPembayaran(transaksi.id);
            
            // Log failed payment
            saveAuditLog('PAYMENT_FAILED', {
                anggotaId: anggota.id,
                anggotaNama: anggota.nama,
                anggotaNIK: anggota.nik,
                jenis: jenis,
                jumlah: jumlah,
                error: 'Gagal mencatat jurnal',
                transaksiId: transaksi.id
            });
            
            // Task 12.3: Show user-friendly error message
            showErrorDialog(
                'Gagal Mencatat Jurnal',
                'Sistem tidak dapat mencatat jurnal akuntansi. Transaksi telah dibatalkan.',
                'Pastikan akun-akun berikut tersedia di Chart of Accounts:<br>- Kas (1-1000)<br>- Hutang Anggota (2-1000)<br>- Piutang Anggota (1-1200)'
            );
            return;
        }
        
        // Log successful payment
        saveAuditLog('PAYMENT_SUCCESS', {
            transaksiId: transaksi.id,
            anggotaId: anggota.id,
            anggotaNama: anggota.nama,
            anggotaNIK: anggota.nik,
            jenis: jenis,
            jumlah: jumlah,
            saldoSebelum: saldoSebelum,
            saldoSesudah: saldoSesudah,
            keterangan: keterangan
        });
        
        // Task 12.2: Show success notification with details and print option
        showSuccessDialog(jenis, anggota, jumlah, saldoSesudah, transaksi.id);
        
        // Reset form
        if (jenis === 'hutang') {
            resetFormHutang();
        } else {
            resetFormPiutang();
        }
        
        // Update summary cards
        updateSummaryCards();
        
        // Refresh riwayat if visible
        renderRiwayatPembayaran();
        
    } catch (error) {
        console.error('Execute payment error:', error);
        
        // Log error
        saveAuditLog('PAYMENT_ERROR', {
            jenis: jenis,
            error: error.message,
            stack: error.stack
        });
        
        // Task 12.3: Show user-friendly error message
        showErrorDialog(
            'Terjadi Kesalahan',
            'Sistem mengalami kesalahan yang tidak terduga.',
            `Detail error: ${error.message}<br><br>Silakan coba lagi atau hubungi administrator.`
        );
    }
}

/**
 * Task 12.2: Show success dialog with payment details and print option
 * @param {string} jenis - Payment type
 * @param {Object} anggota - Anggota object
 * @param {number} jumlah - Payment amount
 * @param {number} saldoSesudah - Balance after payment
 * @param {string} transaksiId - Transaction ID
 */
function showSuccessDialog(jenis, anggota, jumlah, saldoSesudah, transaksiId) {
    const jenisText = jenis === 'hutang' ? 'Hutang' : 'Piutang';
    const jenisColor = jenis === 'hutang' ? '#e63946' : '#457b9d';
    
    // Create success modal HTML
    const modalHTML = `
        <div class="modal fade" id="successPaymentModal" tabindex="-1" aria-labelledby="successPaymentModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header" style="background: #52b788; color: white;">
                        <h5 class="modal-title" id="successPaymentModalLabel">
                            <i class="bi bi-check-circle me-2"></i>Pembayaran Berhasil!
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="text-center mb-3">
                            <i class="bi bi-check-circle-fill" style="font-size: 4rem; color: #52b788;"></i>
                        </div>
                        
                        <div class="alert alert-success">
                            <strong>Pembayaran ${jenisText} telah berhasil diproses!</strong>
                        </div>
                        
                        <table class="table table-borderless">
                            <tr>
                                <td class="text-muted" style="width: 40%;">Anggota:</td>
                                <td><strong>${anggota.nama}</strong></td>
                            </tr>
                            <tr>
                                <td class="text-muted">NIK:</td>
                                <td>${anggota.nik}</td>
                            </tr>
                            <tr>
                                <td class="text-muted">Jenis Pembayaran:</td>
                                <td><span class="badge" style="background: ${jenisColor};">${jenisText}</span></td>
                            </tr>
                            <tr>
                                <td class="text-muted">Jumlah Dibayar:</td>
                                <td><strong style="color: ${jenisColor}; font-size: 1.2em;">${formatRupiah(jumlah)}</strong></td>
                            </tr>
                            <tr>
                                <td class="text-muted">Saldo ${jenisText} Sekarang:</td>
                                <td><strong style="color: #52b788; font-size: 1.1em;">${formatRupiah(saldoSesudah)}</strong></td>
                            </tr>
                        </table>
                        
                        <div class="alert alert-info mt-3">
                            <i class="bi bi-printer me-2"></i>
                            Cetak bukti pembayaran untuk diberikan kepada anggota.
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-1"></i>Tutup
                        </button>
                        <button type="button" class="btn btn-primary" onclick="cetakBuktiPembayaran('${transaksiId}'); bootstrap.Modal.getInstance(document.getElementById('successPaymentModal')).hide();">
                            <i class="bi bi-printer me-1"></i>Cetak Bukti Pembayaran
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('successPaymentModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('successPaymentModal'));
    modal.show();
    
    // Clean up modal after hide
    document.getElementById('successPaymentModal').addEventListener('hidden.bs.modal', () => {
        document.getElementById('successPaymentModal').remove();
    });
}

/**
 * Task 12.3: Show error dialog with user-friendly message
 * @param {string} title - Error title
 * @param {string} message - Error message
 * @param {string} guidance - Guidance for resolution
 */
function showErrorDialog(title, message, guidance) {
    // Create error modal HTML
    const modalHTML = `
        <div class="modal fade" id="errorPaymentModal" tabindex="-1" aria-labelledby="errorPaymentModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header" style="background: #e63946; color: white;">
                        <h5 class="modal-title" id="errorPaymentModalLabel">
                            <i class="bi bi-exclamation-triangle me-2"></i>${title}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="text-center mb-3">
                            <i class="bi bi-x-circle-fill" style="font-size: 4rem; color: #e63946;"></i>
                        </div>
                        
                        <div class="alert alert-danger">
                            <strong>${message}</strong>
                        </div>
                        
                        <div class="card">
                            <div class="card-body">
                                <h6 class="card-title">
                                    <i class="bi bi-lightbulb me-2"></i>Panduan Penyelesaian:
                                </h6>
                                <p class="card-text">${guidance}</p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">
                            <i class="bi bi-check-circle me-1"></i>Mengerti
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('errorPaymentModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('errorPaymentModal'));
    modal.show();
    
    // Clean up modal after hide
    document.getElementById('errorPaymentModal').addEventListener('hidden.bs.modal', () => {
        document.getElementById('errorPaymentModal').remove();
    });
}

/**
 * Task 10.1 & 10.2: Cetak bukti pembayaran
 * Generate and print receipt for a transaction
 * @param {string} transaksiId - Transaction ID to print
 */
function cetakBuktiPembayaran(transaksiId) {
	try {
		// Load transaction data
		const pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
		const transaksi = pembayaran.find(p => p.id === transaksiId);
		
		if (!transaksi) {
			showAlert('Transaksi tidak ditemukan', 'danger');
			return;
		}
		
		// Get system settings for koperasi info
		const systemSettings = JSON.parse(localStorage.getItem('systemSettings') || '{}');
		const koperasiNama = systemSettings.namaKoperasi || 'Koperasi';
		
		// Format tanggal
		const tanggal = new Date(transaksi.tanggal).toLocaleDateString('id-ID', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
		
		const jenisText = transaksi.jenis === 'hutang' ? 'HUTANG' : 'PIUTANG';
		
		// Generate receipt HTML
		const receiptHTML = `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8">
				<title>Bukti Pembayaran ${jenisText}</title>
				<style>
					body {
						font-family: 'Courier New', monospace;
						width: 80mm;
						margin: 0 auto;
						padding: 10px;
					}
					.header {
						text-align: center;
						border-bottom: 2px dashed #000;
						padding-bottom: 10px;
						margin-bottom: 10px;
					}
					.header h2 {
						margin: 5px 0;
						font-size: 18px;
					}
					.header p {
						margin: 2px 0;
						font-size: 12px;
					}
					.content {
						font-size: 12px;
					}
					.row {
						display: flex;
						justify-content: space-between;
						margin: 5px 0;
					}
					.label {
						font-weight: bold;
					}
					.divider {
						border-top: 1px dashed #000;
						margin: 10px 0;
					}
					.total {
						font-size: 14px;
						font-weight: bold;
						text-align: center;
						margin: 10px 0;
					}
					.footer {
						text-align: center;
						border-top: 2px dashed #000;
						padding-top: 10px;
						margin-top: 10px;
						font-size: 10px;
					}
					@media print {
						body {
							width: auto;
						}
					}
				</style>
			</head>
			<body>
				<div class="header">
					<h2>${koperasiNama}</h2>
					<p>BUKTI PEMBAYARAN ${jenisText}</p>
				</div>
				
				<div class="content">
					<div class="row">
						<span class="label">No. Transaksi:</span>
						<span>${transaksi.id}</span>
					</div>
					<div class="row">
						<span class="label">Tanggal:</span>
						<span>${tanggal}</span>
					</div>
					
					<div class="divider"></div>
					
					<div class="row">
						<span class="label">Anggota:</span>
						<span>${transaksi.anggotaNama}</span>
					</div>
					<div class="row">
						<span class="label">NIK:</span>
						<span>${transaksi.anggotaNIK}</span>
					</div>
					
					<div class="divider"></div>
					
					<div class="row">
						<span class="label">Jenis:</span>
						<span>${jenisText}</span>
					</div>
					<div class="row">
						<span class="label">Saldo Sebelum:</span>
						<span>${formatRupiah(transaksi.saldoSebelum)}</span>
					</div>
					<div class="row">
						<span class="label">Jumlah Bayar:</span>
						<span>${formatRupiah(transaksi.jumlah)}</span>
					</div>
					<div class="row">
						<span class="label">Saldo Sesudah:</span>
						<span>${formatRupiah(transaksi.saldoSesudah)}</span>
					</div>
					
					${transaksi.keterangan ? `
					<div class="divider"></div>
					<div class="row">
						<span class="label">Keterangan:</span>
					</div>
					<div style="margin-top: 5px;">
						${transaksi.keterangan}
					</div>
					` : ''}
					
					<div class="divider"></div>
					
					<div class="row">
						<span class="label">Kasir:</span>
						<span>${transaksi.kasirNama}</span>
					</div>
				</div>
				
				<div class="footer">
					<p>Terima kasih atas pembayaran Anda</p>
					<p>Dicetak: ${new Date().toLocaleString('id-ID')}</p>
				</div>
			</body>
			</html>
		`;
		
		// Open print dialog
		const printWindow = window.open('', '_blank', 'width=300,height=600');
		if (printWindow) {
			printWindow.document.write(receiptHTML);
			printWindow.document.close();
			
			// Wait for content to load then print
			printWindow.onload = function() {
				printWindow.print();
			};
			
			// Log print action to audit
			saveAuditLog('PRINT_RECEIPT', {
				transaksiId: transaksi.id,
				anggotaId: transaksi.anggotaId,
				anggotaNama: transaksi.anggotaNama,
				jenis: transaksi.jenis,
				jumlah: transaksi.jumlah
			});
		} else {
			showAlert('Gagal membuka jendela cetak. Pastikan popup tidak diblokir.', 'warning');
		}
		
	} catch (error) {
		console.error('Print receipt error:', error);
		showAlert('Terjadi kesalahan saat mencetak bukti: ' + error.message, 'danger');
	}
}
