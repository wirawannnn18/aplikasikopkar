// Pembayaran Hutang Piutang Module
// Handles payment processing for member debts (hutang) and receivables (piutang)
// Requirements: 1.1-8.5

/**
 * Check if current user has permission to access pembayaran hutang piutang
 * Requirements: Security - Role-based access control
 * @returns {boolean} True if user has permission
 */
function checkPembayaranAccess() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const allowedRoles = ['super_admin', 'administrator', 'admin', 'kasir'];
        
        if (!currentUser.role) {
            return false;
        }
        
        return allowedRoles.includes(currentUser.role.toLowerCase());
    } catch (error) {
        console.error('Error checking access:', error);
        return false;
    }
}

/**
 * Check if current user has permission for specific operations
 * Requirements: 13.1 - Enhanced role-based access validation
 * @param {string} operation - Operation type ('view', 'process', 'print', 'history')
 * @returns {boolean} True if user has permission
 */
function checkOperationPermission(operation) {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        if (!currentUser.role) {
            return false;
        }
        
        const role = currentUser.role.toLowerCase();
        
        // Define permissions for each role
        const permissions = {
            'super_admin': ['view', 'process', 'print', 'history', 'audit'],
            'administrator': ['view', 'process', 'print', 'history', 'audit'],
            'admin': ['view', 'process', 'print', 'history'],
            'kasir': ['view', 'process', 'print'],
            'keuangan': ['view', 'history'],
            'anggota': []
        };
        
        const userPermissions = permissions[role] || [];
        return userPermissions.includes(operation);
    } catch (error) {
        console.error('Error checking operation permission:', error);
        return false;
    }
}

/**
 * Validate user session and role consistency
 * Requirements: 13.1 - Enhanced role-based access validation
 * @returns {Object} Validation result
 */
function validateUserSession() {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Check if user exists
        if (!currentUser.id) {
            return {
                valid: false,
                error: 'Sesi tidak valid. Silakan login kembali.',
                code: 'INVALID_SESSION'
            };
        }
        
        // Check if user still exists in system
        const userExists = users.find(u => u.id === currentUser.id);
        if (!userExists) {
            return {
                valid: false,
                error: 'Akun tidak ditemukan. Silakan login kembali.',
                code: 'USER_NOT_FOUND'
            };
        }
        
        // Check if user is still active
        if (userExists.active === false) {
            return {
                valid: false,
                error: 'Akun telah dinonaktifkan. Hubungi administrator.',
                code: 'USER_INACTIVE'
            };
        }
        
        // Check role consistency
        if (currentUser.role !== userExists.role) {
            return {
                valid: false,
                error: 'Role telah berubah. Silakan login kembali.',
                code: 'ROLE_CHANGED'
            };
        }
        
        return {
            valid: true,
            user: userExists
        };
    } catch (error) {
        console.error('Error validating user session:', error);
        return {
            valid: false,
            error: 'Terjadi kesalahan validasi sesi. Silakan login kembali.',
            code: 'VALIDATION_ERROR'
        };
    }
}

/**
 * Initialize and render the main pembayaran hutang piutang page
 * Requirements: 6.1, 13.1 - Enhanced role-based access validation
 */
function renderPembayaranHutangPiutang() {
    // Enhanced session and access validation
    const sessionValidation = validateUserSession();
    if (!sessionValidation.valid) {
        const content = document.getElementById('content');
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
        const content = document.getElementById('content');
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
        const content = document.getElementById('content');
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
    
    const content = document.getElementById('content');
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
    updateSummaryCards();
    renderFormPembayaran();
    renderRiwayatPembayaran();
}

/**
 * Update summary cards with total hutang and piutang
 */
function updateSummaryCards() {
    try {
        const anggotaList = JSON.parse(localStorage.getItem('anggota') || '[]');
        
        let totalHutang = 0;
        let totalPiutang = 0;

        anggotaList.forEach(anggota => {
            totalHutang += hitungSaldoHutang(anggota.id);
            totalPiutang += hitungSaldoPiutang(anggota.id);
        });

        document.getElementById('totalHutangDisplay').textContent = formatRupiah(totalHutang);
        document.getElementById('totalPiutangDisplay').textContent = formatRupiah(totalPiutang);
    } catch (error) {
        console.error('Error updating summary cards:', error);
    }
}

/**
 * Render form pembayaran
 * Requirements: 6.1, 6.4
 */
function renderFormPembayaran() {
    const container = document.getElementById('formPembayaranContainer');
    if (!container) return;

    container.innerHTML = `
        <form id="formPembayaran" onsubmit="event.preventDefault(); prosesPembayaran();">
            <!-- Jenis Pembayaran -->
            <div class="mb-3">
                <label for="jenisPembayaran" class="form-label">Jenis Pembayaran <span class="text-danger">*</span></label>
                <select class="form-select" id="jenisPembayaran" required onchange="onJenisChange()">
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
                       oninput="onSearchAnggota(this.value)">
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
                       oninput="validateFormRealTime()">
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
                <button type="button" class="btn btn-secondary" onclick="resetFormPembayaran()">
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
 * Handle jenis pembayaran change
 * Requirements: 6.4
 */
function onJenisChange() {
    const jenis = document.getElementById('jenisPembayaran').value;
    const saldoDisplay = document.getElementById('saldoDisplay');
    const anggotaId = document.getElementById('selectedAnggotaId').value;
    
    if (jenis && anggotaId) {
        saldoDisplay.style.display = 'block';
        
        // Get current saldo values
        const saldoHutang = hitungSaldoHutang(anggotaId);
        const saldoPiutang = hitungSaldoPiutang(anggotaId);
        
        // Dynamic highlighting and input control
        highlightRelevantSaldoDynamic(jenis, saldoHutang, saldoPiutang);
        
        // Enable/disable jumlah input based on saldo availability
        controlJumlahInputBasedOnSaldo(jenis, saldoHutang, saldoPiutang);
    }
    
    // Validate form in real-time
    validateFormRealTime();
}

/**
 * Highlight relevant saldo based on jenis
 * Requirements: 6.4
 */
function highlightRelevantSaldo(jenis) {
    const hutangDisplay = document.getElementById('displaySaldoHutang').parentElement;
    const piutangDisplay = document.getElementById('displaySaldoPiutang').parentElement;
    
    if (jenis === 'hutang') {
        hutangDisplay.classList.add('border', 'border-danger', 'p-2', 'rounded');
        piutangDisplay.classList.remove('border', 'border-success', 'p-2', 'rounded');
    } else if (jenis === 'piutang') {
        piutangDisplay.classList.add('border', 'border-success', 'p-2', 'rounded');
        hutangDisplay.classList.remove('border', 'border-danger', 'p-2', 'rounded');
    }
}

/**
 * Dynamic highlighting with saldo availability check
 * Requirements: 6.4 - Task 11.2
 * @param {string} jenis - Payment type (hutang/piutang)
 * @param {number} saldoHutang - Current hutang balance
 * @param {number} saldoPiutang - Current piutang balance
 */
function highlightRelevantSaldoDynamic(jenis, saldoHutang, saldoPiutang) {
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
function controlJumlahInputBasedOnSaldo(jenis, saldoHutang, saldoPiutang) {
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
 * Reset form pembayaran
 */
function resetFormPembayaran() {
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
 * Calculate hutang saldo for an anggota
 * Requirements: 1.1
 * @param {string} anggotaId - ID of the anggota
 * @returns {number} Current hutang balance
 */
function hitungSaldoHutang(anggotaId) {
    try {
        const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
        const pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
        
        // Total kredit from POS transactions
        const totalKredit = penjualan
            .filter(p => p.anggotaId === anggotaId && p.metodePembayaran === 'Kredit')
            .reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
        
        // Total payments already made
        const totalBayar = pembayaran
            .filter(p => p.anggotaId === anggotaId && p.jenis === 'hutang' && p.status === 'selesai')
            .reduce((sum, p) => sum + (parseFloat(p.jumlah) || 0), 0);
        
        return totalKredit - totalBayar;
    } catch (error) {
        console.error('Error calculating hutang saldo:', error);
        return 0;
    }
}

/**
 * Calculate piutang saldo for an anggota
 * Requirements: 2.1
 * @param {string} anggotaId - ID of the anggota
 * @returns {number} Current piutang balance
 */
function hitungSaldoPiutang(anggotaId) {
    try {
        // Piutang comes from simpanan that need to be returned to anggota
        // This includes pengembalian simpanan for anggota keluar
        const simpananList = JSON.parse(localStorage.getItem('simpanan') || '[]');
        const pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
        
        // Get simpanan for this anggota that are marked for pengembalian
        const anggotaSimpanan = simpananList.filter(s => 
            s.anggotaId === anggotaId && 
            s.statusPengembalian === 'pending'
        );
        
        // Calculate total piutang from simpanan balances
        let totalPiutang = 0;
        anggotaSimpanan.forEach(simpanan => {
            totalPiutang += parseFloat(simpanan.saldo || 0);
        });
        
        // Subtract payments already made
        const totalBayar = pembayaran
            .filter(p => p.anggotaId === anggotaId && p.jenis === 'piutang' && p.status === 'selesai')
            .reduce((sum, p) => sum + (parseFloat(p.jumlah) || 0), 0);
        
        return totalPiutang - totalBayar;
    } catch (error) {
        console.error('Error calculating piutang saldo:', error);
        return 0;
    }
}

/**
 * Render riwayat pembayaran
 * Requirements: 4.1, 4.2
 */
function renderRiwayatPembayaran() {
    const container = document.getElementById('riwayatPembayaranContainer');
    if (!container) return;
    
    container.innerHTML = `
        <!-- Filters -->
        <div class="row mb-3">
            <div class="col-md-3">
                <label class="form-label">Jenis Pembayaran</label>
                <select class="form-select" id="filterJenis" onchange="applyFilters()">
                    <option value="">Semua</option>
                    <option value="hutang">Hutang</option>
                    <option value="piutang">Piutang</option>
                </select>
            </div>
            <div class="col-md-3">
                <label class="form-label">Dari Tanggal</label>
                <input type="date" class="form-control" id="filterTanggalDari" onchange="applyFilters()">
            </div>
            <div class="col-md-3">
                <label class="form-label">Sampai Tanggal</label>
                <input type="date" class="form-control" id="filterTanggalSampai" onchange="applyFilters()">
            </div>
            <div class="col-md-3">
                <label class="form-label">Anggota</label>
                <select class="form-select" id="filterAnggota" onchange="applyFilters()">
                    <option value="">Semua Anggota</option>
                </select>
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
                        <th>Jumlah</th>
                        <th>Saldo Sebelum</th>
                        <th>Saldo Sesudah</th>
                        <th>Kasir</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody id="riwayatTableBody">
                    <tr>
                        <td colspan="8" class="text-center">Memuat data...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
    
    // Populate anggota filter
    populateAnggotaFilter();
    
    // Load transactions
    loadRiwayatPembayaran();
}

/**
 * Populate anggota filter dropdown
 */
function populateAnggotaFilter() {
    try {
        const pembayaranList = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
        const filterSelect = document.getElementById('filterAnggota');
        if (!filterSelect) return;
        
        // Get unique anggota from transactions
        const uniqueAnggota = {};
        pembayaranList.forEach(p => {
            if (!uniqueAnggota[p.anggotaId]) {
                uniqueAnggota[p.anggotaId] = {
                    id: p.anggotaId,
                    nama: p.anggotaNama,
                    nik: p.anggotaNIK
                };
            }
        });
        
        // Add options
        Object.values(uniqueAnggota).forEach(anggota => {
            const option = document.createElement('option');
            option.value = anggota.id;
            option.textContent = `${anggota.nama} (${anggota.nik})`;
            filterSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error populating anggota filter:', error);
    }
}

/**
 * Load and display riwayat pembayaran
 * Requirements: 4.1, 4.2, 13.1 - Enhanced access validation
 */
function loadRiwayatPembayaran() {
    // Check history permission
    if (!checkOperationPermission('history')) {
        const tbody = document.getElementById('riwayatTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center text-warning">
                        <i class="bi bi-exclamation-triangle"></i> 
                        Anda tidak memiliki izin untuk melihat riwayat pembayaran
                    </td>
                </tr>
            `;
        }
        return;
    }
    
    try {
        let pembayaranList = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
        
        // Apply filters
        pembayaranList = applyRiwayatFilters(pembayaranList);
        
        // Sort by date descending
        pembayaranList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        const tbody = document.getElementById('riwayatTableBody');
        if (!tbody) return;
        
        if (pembayaranList.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">Tidak ada data pembayaran</td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = pembayaranList.map(p => {
            const jenisClass = p.jenis === 'hutang' ? 'text-danger' : 'text-success';
            const jenisText = p.jenis === 'hutang' ? 'Hutang' : 'Piutang';
            
            return `
                <tr>
                    <td>${formatTanggal(p.tanggal)}</td>
                    <td>
                        <strong>${escapeHtml(p.anggotaNama)}</strong><br>
                        <small class="text-muted">${escapeHtml(p.anggotaNIK)}</small>
                    </td>
                    <td><span class="badge bg-${p.jenis === 'hutang' ? 'danger' : 'success'}">${jenisText}</span></td>
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
                    <td colspan="8" class="text-center text-danger">Error memuat data</td>
                </tr>
            `;
        }
    }
}

/**
 * Apply filters to riwayat
 * Requirements: 4.3, 4.4, 4.5
 * @param {Array} list - Transaction list
 * @returns {Array} Filtered list
 */
function applyRiwayatFilters(list) {
    const filterJenis = document.getElementById('filterJenis')?.value || '';
    const filterTanggalDari = document.getElementById('filterTanggalDari')?.value || '';
    const filterTanggalSampai = document.getElementById('filterTanggalSampai')?.value || '';
    const filterAnggota = document.getElementById('filterAnggota')?.value || '';
    
    return list.filter(p => {
        // Filter by jenis
        if (filterJenis && p.jenis !== filterJenis) {
            return false;
        }
        
        // Filter by date range
        if (filterTanggalDari && p.tanggal < filterTanggalDari) {
            return false;
        }
        if (filterTanggalSampai && p.tanggal > filterTanggalSampai) {
            return false;
        }
        
        // Filter by anggota
        if (filterAnggota && p.anggotaId !== filterAnggota) {
            return false;
        }
        
        return true;
    });
}

/**
 * Apply filters and reload table
 */
function applyFilters() {
    loadRiwayatPembayaran();
}

/**
 * Format tanggal for display
 * @param {string} tanggal - ISO date string
 * @returns {string} Formatted date
 */
function formatTanggal(tanggal) {
    try {
        const date = new Date(tanggal);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch (error) {
        return tanggal;
    }
}

/**
 * Validate pembayaran data
 * Requirements: 3.1, 3.2, 3.3, 3.4
 * @param {Object} data - Payment data
 * @returns {Object} Validation result {valid: boolean, message: string}
 */
function validatePembayaran(data) {
    // Check anggota selected
    if (!data.anggotaId) {
        return { valid: false, message: 'Silakan pilih anggota terlebih dahulu' };
    }
    
    // Check jenis selected
    if (!data.jenis) {
        return { valid: false, message: 'Silakan pilih jenis pembayaran' };
    }
    
    // Check jumlah
    if (!data.jumlah || data.jumlah <= 0) {
        return { valid: false, message: 'Jumlah pembayaran harus lebih dari 0' };
    }
    
    if (data.jumlah < 0) {
        return { valid: false, message: 'Jumlah pembayaran tidak boleh negatif' };
    }
    
    // Check against saldo
    const saldo = data.jenis === 'hutang' 
        ? hitungSaldoHutang(data.anggotaId)
        : hitungSaldoPiutang(data.anggotaId);
    
    if (saldo === 0) {
        const jenisText = data.jenis === 'hutang' ? 'hutang' : 'piutang';
        return { valid: false, message: `Anggota tidak memiliki ${jenisText} yang perlu dibayar` };
    }
    
    if (data.jumlah > saldo) {
        const jenisText = data.jenis === 'hutang' ? 'hutang' : 'piutang';
        return { valid: false, message: `Jumlah pembayaran melebihi saldo ${jenisText} (${formatRupiah(saldo)})` };
    }
    
    return { valid: true, message: '' };
}

/**
 * Show success notification with payment details
 * Requirements: 1.5, 2.5 - Task 12.2
 * @param {Object} transaksi - Transaction data
 * @param {string} jenisText - Payment type text
 */
function showSuccessNotification(transaksi, jenisText) {
    // Create success modal HTML
    const modalHTML = `
        <div class="modal fade" id="successModal" tabindex="-1" aria-labelledby="successModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title" id="successModalLabel">
                            <i class="bi bi-check-circle-fill"></i> Pembayaran Berhasil!
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-success">
                            <i class="bi bi-check-circle-fill"></i> 
                            <strong>Pembayaran ${jenisText.toLowerCase()} telah berhasil diproses!</strong>
                        </div>
                        
                        <div class="card">
                            <div class="card-header bg-light">
                                <h6 class="mb-0"><i class="bi bi-receipt"></i> Detail Transaksi</h6>
                            </div>
                            <div class="card-body">
                                <div class="row mb-2">
                                    <div class="col-sm-5"><strong>No. Transaksi:</strong></div>
                                    <div class="col-sm-7">
                                        <code>${transaksi.id}</code>
                                    </div>
                                </div>
                                <div class="row mb-2">
                                    <div class="col-sm-5"><strong>Anggota:</strong></div>
                                    <div class="col-sm-7">${escapeHtml(transaksi.anggotaNama)}</div>
                                </div>
                                <div class="row mb-2">
                                    <div class="col-sm-5"><strong>Jenis:</strong></div>
                                    <div class="col-sm-7">
                                        <span class="badge bg-${transaksi.jenis === 'hutang' ? 'danger' : 'success'}">
                                            Pembayaran ${jenisText}
                                        </span>
                                    </div>
                                </div>
                                <div class="row mb-2">
                                    <div class="col-sm-5"><strong>Jumlah Dibayar:</strong></div>
                                    <div class="col-sm-7">
                                        <span class="text-primary fw-bold fs-5">
                                            ${formatRupiah(transaksi.jumlah)}
                                        </span>
                                    </div>
                                </div>
                                <div class="row mb-2">
                                    <div class="col-sm-5"><strong>Saldo Terbaru:</strong></div>
                                    <div class="col-sm-7">
                                        <span class="text-${transaksi.jenis === 'hutang' ? 'danger' : 'success'} fw-bold">
                                            ${formatRupiah(transaksi.saldoSesudah)}
                                        </span>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-sm-5"><strong>Waktu:</strong></div>
                                    <div class="col-sm-7">${new Date(transaksi.createdAt).toLocaleString('id-ID')}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mt-3">
                            <div class="d-grid gap-2">
                                <button type="button" class="btn btn-primary btn-lg" onclick="cetakBuktiPembayaran('${transaksi.id}')">
                                    <i class="bi bi-printer"></i> Cetak Bukti Pembayaran
                                </button>
                                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                                    <i class="bi bi-x-circle"></i> Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('successModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('successModal'));
    
    // Auto-close modal when print button is clicked
    document.getElementById('successModal').addEventListener('hidden.bs.modal', () => {
        document.getElementById('successModal').remove();
    });
    
    modal.show();
    
    // Also show a toast notification
    showToastNotification(`Pembayaran ${jenisText.toLowerCase()} berhasil diproses!`, 'success');
}

/**
 * Show error notification with user-friendly messages and guidance
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5 - Task 12.3
 * @param {Error} error - Error object
 * @param {string} title - Error title
 */
function showErrorNotification(error, title = 'Terjadi Kesalahan') {
    let userMessage = '';
    let guidance = '';
    let errorType = 'danger';
    
    // Determine user-friendly message and guidance based on error
    if (error.message.includes('Gagal mencatat jurnal')) {
        userMessage = 'Sistem tidak dapat mencatat jurnal akuntansi. Transaksi telah dibatalkan untuk menjaga konsistensi data.';
        guidance = 'Silakan coba lagi. Jika masalah berlanjut, hubungi administrator sistem.';
    } else if (error.message.includes('anggota tidak ditemukan')) {
        userMessage = 'Data anggota tidak ditemukan dalam sistem.';
        guidance = 'Pastikan anggota sudah terdaftar dan aktif. Hubungi admin jika diperlukan.';
    } else if (error.message.includes('saldo tidak mencukupi')) {
        userMessage = 'Saldo tidak mencukupi untuk melakukan pembayaran.';
        guidance = 'Periksa kembali saldo anggota dan jumlah pembayaran yang diinput.';
        errorType = 'warning';
    } else if (error.message.includes('akses ditolak') || error.message.includes('permission')) {
        userMessage = 'Anda tidak memiliki izin untuk melakukan operasi ini.';
        guidance = 'Hubungi administrator untuk mendapatkan akses yang diperlukan.';
    } else if (error.message.includes('localStorage')) {
        userMessage = 'Terjadi masalah dengan penyimpanan data lokal.';
        guidance = 'Coba refresh halaman. Jika masalah berlanjut, hubungi administrator.';
    } else if (error.message.includes('network') || error.message.includes('connection')) {
        userMessage = 'Terjadi masalah koneksi jaringan.';
        guidance = 'Periksa koneksi internet Anda dan coba lagi.';
    } else {
        userMessage = error.message || 'Terjadi kesalahan yang tidak diketahui.';
        guidance = 'Silakan coba lagi. Jika masalah berlanjut, catat pesan error dan hubungi administrator.';
    }
    
    // Create error modal HTML
    const modalHTML = `
        <div class="modal fade" id="errorModal" tabindex="-1" aria-labelledby="errorModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-${errorType} text-white">
                        <h5 class="modal-title" id="errorModalLabel">
                            <i class="bi bi-${errorType === 'warning' ? 'exclamation-triangle-fill' : 'x-circle-fill'}"></i> 
                            ${title}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-${errorType}">
                            <i class="bi bi-${errorType === 'warning' ? 'exclamation-triangle-fill' : 'x-circle-fill'}"></i> 
                            <strong>${userMessage}</strong>
                        </div>
                        
                        <div class="card">
                            <div class="card-header bg-light">
                                <h6 class="mb-0"><i class="bi bi-lightbulb"></i> Panduan Penyelesaian</h6>
                            </div>
                            <div class="card-body">
                                <p class="mb-0">${guidance}</p>
                            </div>
                        </div>
                        
                        <div class="mt-3">
                            <details>
                                <summary class="text-muted" style="cursor: pointer;">
                                    <small>Detail Error (untuk Administrator)</small>
                                </summary>
                                <div class="mt-2">
                                    <code class="text-danger small">${escapeHtml(error.message)}</code>
                                    <br>
                                    <small class="text-muted">
                                        Waktu: ${new Date().toLocaleString('id-ID')}
                                    </small>
                                </div>
                            </details>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle"></i> Tutup
                        </button>
                        <button type="button" class="btn btn-primary" onclick="location.reload()">
                            <i class="bi bi-arrow-clockwise"></i> Refresh Halaman
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('errorModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('errorModal'));
    
    // Clean up modal when hidden
    document.getElementById('errorModal').addEventListener('hidden.bs.modal', () => {
        document.getElementById('errorModal').remove();
    });
    
    modal.show();
    
    // Also show toast notification
    showToastNotification(userMessage, 'error');
}

/**
 * Enhanced validation with user-friendly messages
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5 - Task 12.3
 * @param {Object} data - Payment data
 * @returns {Object} Enhanced validation result
 */
function validatePembayaranEnhanced(data) {
    const errors = [];
    const warnings = [];
    
    // Check anggota selected
    if (!data.anggotaId) {
        errors.push({
            field: 'anggota',
            message: 'Silakan pilih anggota terlebih dahulu',
            guidance: 'Gunakan kolom pencarian untuk mencari anggota berdasarkan NIK atau nama'
        });
    }
    
    // Check jenis selected
    if (!data.jenis) {
        errors.push({
            field: 'jenis',
            message: 'Silakan pilih jenis pembayaran',
            guidance: 'Pilih "Hutang" jika anggota membayar ke koperasi, atau "Piutang" jika koperasi membayar ke anggota'
        });
    }
    
    // Check jumlah
    if (!data.jumlah || data.jumlah <= 0) {
        errors.push({
            field: 'jumlah',
            message: 'Jumlah pembayaran harus lebih dari 0',
            guidance: 'Masukkan jumlah dalam Rupiah (angka saja, tanpa titik atau koma)'
        });
    }
    
    if (data.jumlah < 0) {
        errors.push({
            field: 'jumlah',
            message: 'Jumlah pembayaran tidak boleh negatif',
            guidance: 'Pastikan jumlah yang dimasukkan adalah angka positif'
        });
    }
    
    // Check against saldo if anggota and jenis are selected
    if (data.anggotaId && data.jenis) {
        const saldo = data.jenis === 'hutang' 
            ? hitungSaldoHutang(data.anggotaId)
            : hitungSaldoPiutang(data.anggotaId);
        
        const jenisText = data.jenis === 'hutang' ? 'hutang' : 'piutang';
        
        if (saldo === 0) {
            errors.push({
                field: 'saldo',
                message: `Anggota tidak memiliki ${jenisText} yang perlu dibayar`,
                guidance: jenisText === 'hutang' 
                    ? 'Periksa riwayat transaksi POS anggota atau pastikan ada transaksi kredit yang belum dibayar'
                    : 'Pastikan anggota memiliki simpanan yang perlu dikembalikan atau piutang lainnya'
            });
        } else if (data.jumlah > saldo) {
            errors.push({
                field: 'jumlah',
                message: `Jumlah pembayaran melebihi saldo ${jenisText} (${formatRupiah(saldo)})`,
                guidance: `Maksimal pembayaran adalah ${formatRupiah(saldo)}. Sesuaikan jumlah pembayaran.`
            });
        } else if (data.jumlah === saldo) {
            warnings.push({
                field: 'jumlah',
                message: `Pembayaran ini akan melunasi seluruh ${jenisText}`,
                guidance: 'Pastikan ini sesuai dengan yang diinginkan'
            });
        }
    }
    
    return {
        valid: errors.length === 0,
        errors: errors,
        warnings: warnings,
        message: errors.length > 0 ? errors[0].message : ''
    };
}

/**
 * Show validation errors in a user-friendly way
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5 - Task 12.3
 * @param {Object} validation - Validation result
 */
function showValidationErrors(validation) {
    if (validation.valid) return;
    
    const errorHTML = `
        <div class="alert alert-warning alert-dismissible fade show" role="alert">
            <h6><i class="bi bi-exclamation-triangle-fill"></i> Periksa Input Anda</h6>
            <ul class="mb-2">
                ${validation.errors.map(error => `
                    <li>
                        <strong>${error.message}</strong>
                        <br><small class="text-muted">${error.guidance}</small>
                    </li>
                `).join('')}
            </ul>
            ${validation.warnings.length > 0 ? `
                <hr>
                <h6><i class="bi bi-info-circle-fill"></i> Perhatian</h6>
                <ul class="mb-0">
                    ${validation.warnings.map(warning => `
                        <li>
                            <strong>${warning.message}</strong>
                            <br><small class="text-muted">${warning.guidance}</small>
                        </li>
                    `).join('')}
                </ul>
            ` : ''}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    // Show in validation messages container
    const validationContainer = document.getElementById('formValidationMessages');
    if (validationContainer) {
        validationContainer.innerHTML = errorHTML;
        validationContainer.style.display = 'block';
        
        // Scroll to validation messages
        validationContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

/**
 * Show toast notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, warning, info)
 */
function showToastNotification(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }
    
    const toastId = 'toast_' + Date.now();
    const bgClass = type === 'success' ? 'bg-success' : 
                   type === 'error' ? 'bg-danger' : 
                   type === 'warning' ? 'bg-warning' : 'bg-info';
    
    const toastHTML = `
        <div id="${toastId}" class="toast ${bgClass} text-white" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header ${bgClass} text-white border-0">
                <i class="bi bi-${type === 'success' ? 'check-circle-fill' : 
                                 type === 'error' ? 'exclamation-triangle-fill' : 
                                 type === 'warning' ? 'exclamation-triangle-fill' : 'info-circle-fill'} me-2"></i>
                <strong class="me-auto">Notifikasi</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${escapeHtml(message)}
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, {
        autohide: true,
        delay: 5000
    });
    
    // Remove toast element after it's hidden
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
    
    toast.show();
}

/**
 * Show confirmation dialog before processing payment
 * Requirements: 1.5, 2.5 - Task 12.1
 * @param {Object} data - Payment data
 * @param {number} saldoSebelum - Balance before payment
 * @returns {boolean} True if user confirms
 */
function showConfirmationDialog(data, saldoSebelum) {
    const jenisText = data.jenis === 'hutang' ? 'Hutang' : 'Piutang';
    const saldoSesudah = saldoSebelum - data.jumlah;
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="confirmationModal" tabindex="-1" aria-labelledby="confirmationModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title" id="confirmationModalLabel">
                            <i class="bi bi-check-circle"></i> Konfirmasi Pembayaran ${jenisText}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <i class="bi bi-info-circle"></i> 
                            Pastikan data pembayaran berikut sudah benar sebelum diproses.
                        </div>
                        
                        <div class="row mb-3">
                            <div class="col-sm-4"><strong>Anggota:</strong></div>
                            <div class="col-sm-8">${escapeHtml(data.anggotaNama)}</div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-sm-4"><strong>NIK:</strong></div>
                            <div class="col-sm-8">${escapeHtml(data.anggotaNIK)}</div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-sm-4"><strong>Jenis Pembayaran:</strong></div>
                            <div class="col-sm-8">
                                <span class="badge bg-${data.jenis === 'hutang' ? 'danger' : 'success'} fs-6">
                                    Pembayaran ${jenisText}
                                </span>
                            </div>
                        </div>
                        
                        <hr>
                        
                        <div class="row mb-2">
                            <div class="col-sm-6"><strong>Saldo Sebelum:</strong></div>
                            <div class="col-sm-6 text-end">
                                <span class="text-${data.jenis === 'hutang' ? 'danger' : 'success'} fw-bold">
                                    ${formatRupiah(saldoSebelum)}
                                </span>
                            </div>
                        </div>
                        <div class="row mb-2">
                            <div class="col-sm-6"><strong>Jumlah Pembayaran:</strong></div>
                            <div class="col-sm-6 text-end">
                                <span class="text-primary fw-bold fs-5">
                                    ${formatRupiah(data.jumlah)}
                                </span>
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-sm-6"><strong>Saldo Sesudah:</strong></div>
                            <div class="col-sm-6 text-end">
                                <span class="text-${data.jenis === 'hutang' ? 'danger' : 'success'} fw-bold">
                                    ${formatRupiah(saldoSesudah)}
                                </span>
                            </div>
                        </div>
                        
                        ${data.keterangan ? `
                        <div class="row mb-3">
                            <div class="col-sm-4"><strong>Keterangan:</strong></div>
                            <div class="col-sm-8">
                                <em>${escapeHtml(data.keterangan)}</em>
                            </div>
                        </div>
                        ` : ''}
                        
                        <hr>
                        
                        <div class="row">
                            <div class="col-sm-4"><strong>Diproses oleh:</strong></div>
                            <div class="col-sm-8">${escapeHtml(currentUser.nama || 'Unknown')}</div>
                        </div>
                        <div class="row">
                            <div class="col-sm-4"><strong>Tanggal & Waktu:</strong></div>
                            <div class="col-sm-8">${new Date().toLocaleString('id-ID')}</div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle"></i> Batal
                        </button>
                        <button type="button" class="btn btn-primary" id="confirmProcessBtn">
                            <i class="bi bi-check-circle"></i> Ya, Proses Pembayaran
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('confirmationModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal and return promise
    return new Promise((resolve) => {
        const modal = new bootstrap.Modal(document.getElementById('confirmationModal'));
        const confirmBtn = document.getElementById('confirmProcessBtn');
        
        // Handle confirm button
        confirmBtn.addEventListener('click', () => {
            modal.hide();
            resolve(true);
        });
        
        // Handle modal close (cancel)
        document.getElementById('confirmationModal').addEventListener('hidden.bs.modal', () => {
            document.getElementById('confirmationModal').remove();
            resolve(false);
        });
        
        modal.show();
    });
}

/**
 * Process pembayaran
 * Requirements: 1.3, 1.5, 2.3, 2.5, 7.4, 7.5, 13.1, 13.2 - Enhanced security
 */
async function prosesPembayaran() {
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
        
        // Validate business logic with enhanced messages
        const validation = validatePembayaranEnhanced(data);
        if (!validation.valid) {
            showValidationErrors(validation);
            return;
        }
        
        // Get saldo before
        const saldoSebelum = jenis === 'hutang' 
            ? hitungSaldoHutang(anggotaId)
            : hitungSaldoPiutang(anggotaId);
        
        // Show enhanced confirmation dialog
        const confirmed = await showConfirmationDialog(data, saldoSebelum);
        if (!confirmed) {
            return;
        }
        
        // Save transaction
        const transaksi = savePembayaran({
            ...data,
            saldoSebelum,
            saldoSesudah: saldoSebelum - jumlah
        });
        
        // Record journal
        try {
            if (jenis === 'hutang') {
                createJurnalPembayaranHutang(transaksi);
            } else {
                createJurnalPembayaranPiutang(transaksi);
            }
        } catch (error) {
            // Rollback on journal error
            rollbackPembayaran(transaksi.id);
            throw new Error('Gagal mencatat jurnal. Transaksi dibatalkan.');
        }
        
        // Save audit log
        saveAuditLog('PEMBAYARAN_' + jenis.toUpperCase(), transaksi);
        
        // Show success notification with details
        showSuccessNotification(transaksi, jenisText);
        
        // Reset form and refresh
        resetFormPembayaran();
        updateSummaryCards();
        renderRiwayatPembayaran();
        
    } catch (error) {
        console.error('Error proses pembayaran:', error);
        showErrorNotification(error, 'Gagal memproses pembayaran');
    }
}

/**
 * Save pembayaran transaction
 * Requirements: 1.3, 2.3
 * @param {Object} data - Payment data
 * @returns {Object} Saved transaction
 */
function savePembayaran(data) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const timestamp = new Date().toISOString();
    
    const transaksi = {
        id: generateId(),
        tanggal: timestamp.split('T')[0],
        anggotaId: data.anggotaId,
        anggotaNama: data.anggotaNama,
        anggotaNIK: data.anggotaNIK,
        jenis: data.jenis,
        jumlah: data.jumlah,
        saldoSebelum: data.saldoSebelum,
        saldoSesudah: data.saldoSesudah,
        keterangan: data.keterangan || '',
        kasirId: currentUser.id || '',
        kasirNama: currentUser.nama || '',
        jurnalId: '',
        status: 'selesai',
        createdAt: timestamp,
        updatedAt: timestamp
    };
    
    const pembayaranList = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
    pembayaranList.push(transaksi);
    localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaranList));
    
    return transaksi;
}

/**
 * Rollback pembayaran transaction
 * Requirements: 7.4
 * @param {string} transaksiId - Transaction ID to rollback
 */
function rollbackPembayaran(transaksiId) {
    try {
        const pembayaranList = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
        const filtered = pembayaranList.filter(p => p.id !== transaksiId);
        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(filtered));
        console.log('Transaction rolled back:', transaksiId);
    } catch (error) {
        console.error('Error rolling back transaction:', error);
    }
}

/**
 * Create journal entry for hutang payment
 * Requirements: 1.4, 7.1, 7.3
 * @param {Object} transaksi - Transaction data
 */
function createJurnalPembayaranHutang(transaksi) {
    const keterangan = `Pembayaran Hutang - ${transaksi.anggotaNama}`;
    const entries = [
        { akun: '1-1000', debit: transaksi.jumlah, kredit: 0 },  // Kas bertambah
        { akun: '2-1000', debit: 0, kredit: transaksi.jumlah }   // Hutang berkurang
    ];
    
    addJurnal(keterangan, entries, transaksi.tanggal);
}

/**
 * Create journal entry for piutang payment
 * Requirements: 2.4, 7.2, 7.3
 * @param {Object} transaksi - Transaction data
 */
function createJurnalPembayaranPiutang(transaksi) {
    const keterangan = `Pembayaran Piutang - ${transaksi.anggotaNama}`;
    const entries = [
        { akun: '1-1200', debit: transaksi.jumlah, kredit: 0 },  // Piutang berkurang
        { akun: '1-1000', debit: 0, kredit: transaksi.jumlah }   // Kas berkurang
    ];
    
    addJurnal(keterangan, entries, transaksi.tanggal);
}

/**
 * Save audit log
 * Requirements: 5.1, 5.2, 5.3
 * @param {string} action - Action type
 * @param {Object} details - Transaction details
 */
function saveAuditLog(action, details) {
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const auditLog = JSON.parse(localStorage.getItem('auditLog') || '[]');
        
        const logEntry = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            userId: currentUser.id || '',
            userName: currentUser.nama || '',
            action: action,
            details: details,
            module: 'pembayaran-hutang-piutang'
        };
        
        auditLog.push(logEntry);
        localStorage.setItem('auditLog', JSON.stringify(auditLog));
    } catch (error) {
        console.error('Error saving audit log:', error);
    }
}

/**
 * Search anggota with debounce and input sanitization
 * Requirements: 6.2, 13.2 - Enhanced input sanitization
 */
let searchDebounceTimer;
function onSearchAnggota(query) {
    clearTimeout(searchDebounceTimer);
    
    searchDebounceTimer = setTimeout(() => {
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
        renderAnggotaSuggestions(results);
    }, 300);
}

/**
 * Search anggota by NIK or nama
 * Requirements: 6.2
 * @param {string} query - Search query
 * @returns {Array} Matching anggota (max 10)
 */
function searchAnggota(query) {
    try {
        const anggotaList = JSON.parse(localStorage.getItem('anggota') || '[]');
        const searchLower = query.toLowerCase();
        
        // Filter to only transactable anggota (Aktif status AND not Keluar)
        const transactableAnggota = filterTransactableAnggota();
        
        // Search within transactable anggota
        const results = transactableAnggota.filter(anggota => {
            const nikMatch = (anggota.nik || '').toLowerCase().includes(searchLower);
            const namaMatch = (anggota.nama || '').toLowerCase().includes(searchLower);
            
            return nikMatch || namaMatch;
        });
        
        // Limit to 10 results
        return results.slice(0, 10);
    } catch (error) {
        console.error('Error searching anggota:', error);
        return [];
    }
}

/**
 * Render anggota suggestions dropdown
 * Requirements: 6.2, 6.3
 * @param {Array} results - Search results
 */
function renderAnggotaSuggestions(results) {
    const container = document.getElementById('anggotaSuggestions');
    if (!container) return;
    
    if (results.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.innerHTML = results.map(anggota => `
        <button type="button" class="list-group-item list-group-item-action" 
                onclick="selectAnggota('${anggota.id}', '${escapeHtml(anggota.nama)}', '${escapeHtml(anggota.nik)}')">
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
 * Select anggota from suggestions
 * Requirements: 6.3
 * @param {string} id - Anggota ID
 * @param {string} nama - Anggota nama
 * @param {string} nik - Anggota NIK
 */
function selectAnggota(id, nama, nik) {
    // Set hidden fields
    document.getElementById('selectedAnggotaId').value = id;
    document.getElementById('selectedAnggotaNama').value = nama;
    document.getElementById('selectedAnggotaNIK').value = nik;
    
    // Update search input
    document.getElementById('searchAnggota').value = `${nama} (${nik})`;
    
    // Hide suggestions
    document.getElementById('anggotaSuggestions').style.display = 'none';
    
    // Automatically display saldo for both hutang and piutang
    displaySaldoAnggotaAutomatic(id);
    
    // Enable form validation feedback
    validateFormRealTime();
}

/**
 * Display saldo for selected anggota
 * Requirements: 6.3
 * @param {string} anggotaId - Anggota ID
 */
function displaySaldoAnggota(anggotaId) {
    const saldoHutang = hitungSaldoHutang(anggotaId);
    const saldoPiutang = hitungSaldoPiutang(anggotaId);
    
    document.getElementById('displaySaldoHutang').textContent = formatRupiah(saldoHutang);
    document.getElementById('displaySaldoPiutang').textContent = formatRupiah(saldoPiutang);
    
    document.getElementById('saldoDisplay').style.display = 'block';
    
    // Highlight relevant saldo if jenis is selected
    const jenis = document.getElementById('jenisPembayaran').value;
    if (jenis) {
        highlightRelevantSaldo(jenis);
    }
}

/**
 * Automatically display saldo when anggota is selected
 * Requirements: 6.3 - Task 11.1
 * @param {string} anggotaId - Anggota ID
 */
function displaySaldoAnggotaAutomatic(anggotaId) {
    const saldoHutang = hitungSaldoHutang(anggotaId);
    const saldoPiutang = hitungSaldoPiutang(anggotaId);
    
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
        highlightRelevantSaldoDynamic(jenis, saldoHutang, saldoPiutang);
    }
    
    // Update form validation state
    validateFormRealTime();
}

/**
 * Real-time form validation with feedback and input sanitization
 * Requirements: 6.5, 13.2 - Enhanced validation with sanitization
 */
function validateFormRealTime() {
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
    
    // Validate jumlah against saldo if anggota and jenis are selected
    if (anggotaId && jenis && ['hutang', 'piutang'].includes(jenis)) {
        const saldo = jenis === 'hutang' 
            ? hitungSaldoHutang(anggotaId)
            : hitungSaldoPiutang(anggotaId);
        
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
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    if (typeof text !== 'string') {
        return '';
    }
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Sanitize text input to prevent XSS attacks
 * Requirements: 13.2 - Input sanitization
 * @param {string} input - Input text to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeTextInput(input) {
    if (typeof input !== 'string') {
        return '';
    }
    
    // Remove script tags and their content
    let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');
    
    // Remove event handlers (onclick, onload, etc.)
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    
    // Remove data: protocol for images (potential XSS vector)
    sanitized = sanitized.replace(/data:\s*[^;]*;[^,]*,/gi, '');
    
    // Remove vbscript: protocol
    sanitized = sanitized.replace(/vbscript:/gi, '');
    
    // Remove expression() CSS (IE specific XSS)
    sanitized = sanitized.replace(/expression\s*\(/gi, '');
    
    // Escape HTML entities
    return escapeHtml(sanitized);
}

/**
 * Validate and sanitize numeric input
 * Requirements: 13.2 - Input sanitization
 * @param {any} input - Input to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
function validateNumericInput(input, options = {}) {
    const {
        min = null,
        max = null,
        allowNegative = false,
        allowDecimal = true,
        fieldName = 'Input'
    } = options;
    
    // Convert to string for processing
    const inputStr = String(input).trim();
    
    if (!inputStr) {
        return {
            valid: false,
            sanitized: null,
            error: `${fieldName} tidak boleh kosong`
        };
    }
    
    // Remove non-numeric characters except decimal point and minus
    const cleanInput = inputStr.replace(/[^\d.-]/g, '');
    
    // Parse as number
    const num = parseFloat(cleanInput);
    
    if (isNaN(num)) {
        return {
            valid: false,
            sanitized: null,
            error: `${fieldName} harus berupa angka`
        };
    }
    
    // Check negative values
    if (!allowNegative && num < 0) {
        return {
            valid: false,
            sanitized: null,
            error: `${fieldName} tidak boleh negatif`
        };
    }
    
    // Check decimal values
    if (!allowDecimal && num % 1 !== 0) {
        return {
            valid: false,
            sanitized: null,
            error: `${fieldName} harus berupa bilangan bulat`
        };
    }
    
    // Check minimum value
    if (min !== null && num < min) {
        return {
            valid: false,
            sanitized: null,
            error: `${fieldName} minimal ${formatRupiah(min)}`
        };
    }
    
    // Check maximum value
    if (max !== null && num > max) {
        return {
            valid: false,
            sanitized: null,
            error: `${fieldName} maksimal ${formatRupiah(max)}`
        };
    }
    
    return {
        valid: true,
        sanitized: num,
        error: null
    };
}

/**
 * Validate and sanitize date input
 * Requirements: 13.2 - Input sanitization
 * @param {string} dateString - Date string to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
function validateDateInput(dateString, options = {}) {
    const {
        allowFuture = false,
        allowPast = true,
        fieldName = 'Tanggal'
    } = options;
    
    if (!dateString || typeof dateString !== 'string') {
        return {
            valid: false,
            sanitized: null,
            error: `${fieldName} tidak boleh kosong`
        };
    }
    
    // Sanitize input - remove potential XSS
    const sanitizedInput = sanitizeTextInput(dateString.trim());
    
    // Check date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(sanitizedInput)) {
        return {
            valid: false,
            sanitized: null,
            error: `${fieldName} harus dalam format YYYY-MM-DD`
        };
    }
    
    // Parse date
    const date = new Date(sanitizedInput);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
        return {
            valid: false,
            sanitized: null,
            error: `${fieldName} tidak valid`
        };
    }
    
    // Check if parsed date matches input (handles invalid dates like 2024-02-30)
    const isoString = date.toISOString().split('T')[0];
    if (isoString !== sanitizedInput) {
        return {
            valid: false,
            sanitized: null,
            error: `${fieldName} tidak valid`
        };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check future dates
    if (!allowFuture && date > today) {
        return {
            valid: false,
            sanitized: null,
            error: `${fieldName} tidak boleh di masa depan`
        };
    }
    
    // Check past dates
    if (!allowPast && date < today) {
        return {
            valid: false,
            sanitized: null,
            error: `${fieldName} tidak boleh di masa lalu`
        };
    }
    
    return {
        valid: true,
        sanitized: sanitizedInput,
        error: null
    };
}

/**
 * Sanitize and validate payment form data
 * Requirements: 13.2 - Input sanitization
 * @param {Object} formData - Form data to sanitize
 * @returns {Object} Sanitization result
 */
function sanitizePaymentFormData(formData) {
    const errors = [];
    const sanitized = {};
    
    // Sanitize anggota data
    if (formData.anggotaId) {
        sanitized.anggotaId = sanitizeTextInput(formData.anggotaId);
    } else {
        errors.push('ID Anggota tidak boleh kosong');
    }
    
    if (formData.anggotaNama) {
        sanitized.anggotaNama = sanitizeTextInput(formData.anggotaNama);
    } else {
        errors.push('Nama Anggota tidak boleh kosong');
    }
    
    if (formData.anggotaNIK) {
        sanitized.anggotaNIK = sanitizeTextInput(formData.anggotaNIK);
    } else {
        errors.push('NIK Anggota tidak boleh kosong');
    }
    
    // Validate jenis pembayaran
    if (formData.jenis) {
        const jenisValid = ['hutang', 'piutang'].includes(formData.jenis);
        if (jenisValid) {
            sanitized.jenis = formData.jenis;
        } else {
            errors.push('Jenis pembayaran tidak valid');
        }
    } else {
        errors.push('Jenis pembayaran tidak boleh kosong');
    }
    
    // Validate jumlah
    if (formData.jumlah !== undefined) {
        const numValidation = validateNumericInput(formData.jumlah, {
            min: 1,
            allowNegative: false,
            allowDecimal: true,
            fieldName: 'Jumlah pembayaran'
        });
        
        if (numValidation.valid) {
            sanitized.jumlah = numValidation.sanitized;
        } else {
            errors.push(numValidation.error);
        }
    } else {
        errors.push('Jumlah pembayaran tidak boleh kosong');
    }
    
    // Sanitize keterangan (optional)
    if (formData.keterangan) {
        sanitized.keterangan = sanitizeTextInput(formData.keterangan);
        
        // Limit keterangan length
        if (sanitized.keterangan.length > 500) {
            sanitized.keterangan = sanitized.keterangan.substring(0, 500);
        }
    } else {
        sanitized.keterangan = '';
    }
    
    return {
        valid: errors.length === 0,
        sanitized: sanitized,
        errors: errors
    };
}

/**
 * Cetak bukti pembayaran
 * Requirements: 8.1, 8.2, 8.3, 8.5, 13.1 - Enhanced access validation
 * @param {string} transaksiId - Transaction ID
 */
function cetakBuktiPembayaran(transaksiId) {
    // Enhanced session validation
    const sessionValidation = validateUserSession();
    if (!sessionValidation.valid) {
        showAlert(sessionValidation.error, 'danger');
        return;
    }
    
    // Check print permission
    if (!checkOperationPermission('print')) {
        showAlert('Anda tidak memiliki izin untuk mencetak bukti pembayaran', 'danger');
        return;
    }
    
    // Sanitize transaction ID
    const sanitizedId = sanitizeTextInput(transaksiId);
    
    try {
        const pembayaranList = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
        const transaksi = pembayaranList.find(p => p.id === sanitizedId);
        
        if (!transaksi) {
            showAlert('Transaksi tidak ditemukan', 'danger');
            return;
        }
        
        const systemSettings = JSON.parse(localStorage.getItem('systemSettings') || '{}');
        const namaKoperasi = systemSettings.namaKoperasi || 'KOPERASI';
        const alamatKoperasi = systemSettings.alamat || '';
        const teleponKoperasi = systemSettings.telepon || '';
        
        const jenisText = transaksi.jenis === 'hutang' ? 'HUTANG' : 'PIUTANG';
        
        const receiptHTML = `
            <!DOCTYPE html>
            <html>
            <head>
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
                    .row.total {
                        border-top: 1px dashed #000;
                        border-bottom: 2px solid #000;
                        padding: 5px 0;
                        font-weight: bold;
                        font-size: 14px;
                    }
                    .footer {
                        text-align: center;
                        margin-top: 20px;
                        padding-top: 10px;
                        border-top: 2px dashed #000;
                        font-size: 11px;
                    }
                    @media print {
                        body {
                            width: 80mm;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>${namaKoperasi}</h2>
                    <p>${alamatKoperasi}</p>
                    <p>Telp: ${teleponKoperasi}</p>
                    <p style="margin-top: 10px; font-weight: bold;">BUKTI PEMBAYARAN ${jenisText}</p>
                </div>
                
                <div class="content">
                    <div class="row">
                        <span>No. Transaksi</span>
                        <span>${transaksi.id}</span>
                    </div>
                    <div class="row">
                        <span>Tanggal</span>
                        <span>${formatTanggal(transaksi.tanggal)}</span>
                    </div>
                    <div class="row">
                        <span>Waktu</span>
                        <span>${new Date(transaksi.createdAt).toLocaleTimeString('id-ID')}</span>
                    </div>
                    <div class="row" style="border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 10px;">
                        <span>Kasir</span>
                        <span>${transaksi.kasirNama}</span>
                    </div>
                    
                    <div class="row">
                        <span>Anggota</span>
                        <span>${transaksi.anggotaNama}</span>
                    </div>
                    <div class="row" style="margin-bottom: 10px;">
                        <span>NIK</span>
                        <span>${transaksi.anggotaNIK}</span>
                    </div>
                    
                    <div class="row">
                        <span>Jenis Pembayaran</span>
                        <span>${jenisText}</span>
                    </div>
                    <div class="row">
                        <span>Saldo Sebelum</span>
                        <span>${formatRupiah(transaksi.saldoSebelum)}</span>
                    </div>
                    <div class="row total">
                        <span>JUMLAH BAYAR</span>
                        <span>${formatRupiah(transaksi.jumlah)}</span>
                    </div>
                    <div class="row">
                        <span>Saldo Sesudah</span>
                        <span>${formatRupiah(transaksi.saldoSesudah)}</span>
                    </div>
                    
                    ${transaksi.keterangan ? `
                    <div class="row" style="margin-top: 10px;">
                        <span>Keterangan:</span>
                    </div>
                    <div style="margin-left: 10px; font-style: italic;">
                        ${transaksi.keterangan}
                    </div>
                    ` : ''}
                </div>
                
                <div class="footer">
                    <p>Terima kasih atas pembayaran Anda</p>
                    <p>Simpan bukti ini sebagai tanda terima yang sah</p>
                    <p style="margin-top: 10px; font-size: 10px;">
                        Dicetak: ${new Date().toLocaleString('id-ID')}
                    </p>
                </div>
                
                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `;
        
        // Open print window
        const printWindow = window.open('', '_blank', 'width=300,height=600');
        printWindow.document.write(receiptHTML);
        printWindow.document.close();
        
        // Log print action
        saveAuditLog('CETAK_BUKTI_PEMBAYARAN', {
            transaksiId: transaksi.id,
            jenis: transaksi.jenis,
            anggotaNama: transaksi.anggotaNama,
            jumlah: transaksi.jumlah
        });
        
    } catch (error) {
        console.error('Error printing receipt:', error);
        showAlert('Gagal mencetak bukti pembayaran', 'danger');
    }
}

// Export functions for testing
export {
    renderPembayaranHutangPiutang,
    hitungSaldoHutang,
    hitungSaldoPiutang,
    updateSummaryCards,
    renderFormPembayaran,
    searchAnggota,
    validatePembayaran,
    validatePembayaranEnhanced,
    savePembayaran,
    rollbackPembayaran,
    createJurnalPembayaranHutang,
    createJurnalPembayaranPiutang,
    saveAuditLog,
    cetakBuktiPembayaran,
    checkPembayaranAccess,
    checkOperationPermission,
    validateUserSession,
    sanitizeTextInput,
    validateNumericInput,
    validateDateInput,
    sanitizePaymentFormData,
    applyRiwayatFilters,
    loadRiwayatPembayaran,
    renderRiwayatPembayaran,
    displaySaldoAnggotaAutomatic,
    highlightRelevantSaldoDynamic,
    controlJumlahInputBasedOnSaldo,
    validateFormRealTime,
    showConfirmationDialog,
    showSuccessNotification,
    showErrorNotification,
    showValidationErrors,
    showToastNotification
};

// ES module exports for testing (conditional to avoid syntax errors in browser)
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment - already exported above
} else if (typeof window !== 'undefined') {
    // Browser environment - attach to window for testing
    window.PembayaranHutangPiutangModule = {
        renderPembayaranHutangPiutang,
        hitungSaldoHutang,
        hitungSaldoPiutang,
        updateSummaryCards,
        renderFormPembayaran,
        searchAnggota,
        validatePembayaran,
        validatePembayaranEnhanced,
        savePembayaran,
        rollbackPembayaran,
        createJurnalPembayaranHutang,
        createJurnalPembayaranPiutang,
        saveAuditLog,
        cetakBuktiPembayaran,
        checkPembayaranAccess,
        checkOperationPermission,
        validateUserSession,
        sanitizeTextInput,
        validateNumericInput,
        validateDateInput,
        sanitizePaymentFormData,
        applyRiwayatFilters,
        loadRiwayatPembayaran,
        renderRiwayatPembayaran,
        displaySaldoAnggotaAutomatic,
        highlightRelevantSaldoDynamic,
        controlJumlahInputBasedOnSaldo,
        validateFormRealTime,
        showConfirmationDialog,
        showSuccessNotification,
        showErrorNotification,
        showValidationErrors,
        showToastNotification
    };
}
