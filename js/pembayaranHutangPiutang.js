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
        const allowedRoles = ['admin', 'kasir'];
        
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
 * Initialize and render the main pembayaran hutang piutang page
 * Requirements: 6.1
 */
function renderPembayaranHutangPiutang() {
    // Check access permission
    if (!checkPembayaranAccess()) {
        const content = document.getElementById('content');
        if (content) {
            content.innerHTML = `
                <div class="container-fluid py-4">
                    <div class="alert alert-danger">
                        <h4><i class="bi bi-exclamation-triangle"></i> Akses Ditolak</h4>
                        <p>Anda tidak memiliki izin untuk mengakses fitur Pembayaran Hutang/Piutang.</p>
                        <p>Fitur ini hanya dapat diakses oleh Admin dan Kasir.</p>
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
                       min="1" step="1" required>
                <div class="form-text">Masukkan jumlah dalam Rupiah (tanpa titik atau koma)</div>
            </div>

            <!-- Keterangan -->
            <div class="mb-3">
                <label for="keteranganPembayaran" class="form-label">Keterangan</label>
                <textarea class="form-control" id="keteranganPembayaran" rows="3" 
                          placeholder="Keterangan tambahan (opsional)"></textarea>
            </div>

            <!-- Buttons -->
            <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                <button type="button" class="btn btn-secondary" onclick="resetFormPembayaran()">
                    <i class="bi bi-x-circle"></i> Reset
                </button>
                <button type="submit" class="btn btn-primary" id="btnProsesPembayaran">
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
    
    if (jenis && document.getElementById('selectedAnggotaId').value) {
        saldoDisplay.style.display = 'block';
        highlightRelevantSaldo(jenis);
    }
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
 * Reset form pembayaran
 */
function resetFormPembayaran() {
    document.getElementById('formPembayaran').reset();
    document.getElementById('selectedAnggotaId').value = '';
    document.getElementById('selectedAnggotaNama').value = '';
    document.getElementById('selectedAnggotaNIK').value = '';
    document.getElementById('saldoDisplay').style.display = 'none';
    document.getElementById('anggotaSuggestions').style.display = 'none';
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
 * Requirements: 4.1, 4.2
 */
function loadRiwayatPembayaran() {
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
 * Process pembayaran
 * Requirements: 1.3, 1.5, 2.3, 2.5, 7.4, 7.5
 */
function prosesPembayaran() {
    // Check access permission
    if (!checkPembayaranAccess()) {
        showAlert('Anda tidak memiliki izin untuk memproses pembayaran', 'danger');
        return;
    }
    
    try {
        // Get form data
        const anggotaId = document.getElementById('selectedAnggotaId').value;
        const anggotaNama = document.getElementById('selectedAnggotaNama').value;
        const anggotaNIK = document.getElementById('selectedAnggotaNIK').value;
        const jenis = document.getElementById('jenisPembayaran').value;
        const jumlah = parseFloat(document.getElementById('jumlahPembayaran').value);
        const keterangan = document.getElementById('keteranganPembayaran').value;
        
        // Validate anggota status first
        const anggotaValidation = validateAnggotaForHutangPiutang(anggotaId);
        if (!anggotaValidation.valid) {
            showAlert(anggotaValidation.error, 'error');
            return;
        }
        
        const data = {
            anggotaId,
            anggotaNama,
            anggotaNIK,
            jenis,
            jumlah,
            keterangan
        };
        
        // Validate business logic
        const validation = validatePembayaran(data);
        if (!validation.valid) {
            showAlert(validation.message, 'warning');
            return;
        }
        
        // Get saldo before
        const saldoSebelum = jenis === 'hutang' 
            ? hitungSaldoHutang(anggotaId)
            : hitungSaldoPiutang(anggotaId);
        
        // Show confirmation
        const jenisText = jenis === 'hutang' ? 'Hutang' : 'Piutang';
        const confirmMessage = `
            Konfirmasi Pembayaran ${jenisText}
            
            Anggota: ${anggotaNama} (${anggotaNIK})
            Saldo Sebelum: ${formatRupiah(saldoSebelum)}
            Jumlah Bayar: ${formatRupiah(jumlah)}
            Saldo Sesudah: ${formatRupiah(saldoSebelum - jumlah)}
            
            Proses pembayaran ini?
        `;
        
        if (!confirm(confirmMessage)) {
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
        
        // Success
        showAlert(`Pembayaran ${jenisText.toLowerCase()} berhasil diproses!`, 'success');
        
        // Ask to print receipt
        if (confirm('Cetak bukti pembayaran?')) {
            cetakBuktiPembayaran(transaksi.id);
        }
        
        // Reset form and refresh
        resetFormPembayaran();
        updateSummaryCards();
        renderRiwayatPembayaran();
        
    } catch (error) {
        console.error('Error proses pembayaran:', error);
        showAlert('Terjadi kesalahan: ' + error.message, 'danger');
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
 * Search anggota with debounce
 * Requirements: 6.2
 */
let searchDebounceTimer;
function onSearchAnggota(query) {
    clearTimeout(searchDebounceTimer);
    
    searchDebounceTimer = setTimeout(() => {
        if (!query || query.length < 2) {
            document.getElementById('anggotaSuggestions').style.display = 'none';
            return;
        }
        
        const results = searchAnggota(query);
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
    
    // Display saldo
    displaySaldoAnggota(id);
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
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Cetak bukti pembayaran
 * Requirements: 8.1, 8.2, 8.3, 8.5
 * @param {string} transaksiId - Transaction ID
 */
function cetakBuktiPembayaran(transaksiId) {
    // Check access permission
    if (!checkPembayaranAccess()) {
        showAlert('Anda tidak memiliki izin untuk mencetak bukti pembayaran', 'danger');
        return;
    }
    
    try {
        const pembayaranList = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
        const transaksi = pembayaranList.find(p => p.id === transaksiId);
        
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
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        renderPembayaranHutangPiutang,
        hitungSaldoHutang,
        hitungSaldoPiutang,
        updateSummaryCards,
        renderFormPembayaran,
        searchAnggota,
        validatePembayaran,
        savePembayaran,
        rollbackPembayaran,
        createJurnalPembayaranHutang,
        createJurnalPembayaranPiutang,
        saveAuditLog,
        cetakBuktiPembayaran,
        checkPembayaranAccess
    };
}

// ES module exports for testing (conditional to avoid syntax errors in browser)
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        renderPembayaranHutangPiutang,
        hitungSaldoHutang,
        hitungSaldoPiutang,
        updateSummaryCards,
        renderFormPembayaran,
        searchAnggota,
        validatePembayaran,
        savePembayaran,
        rollbackPembayaran,
        createJurnalPembayaranHutang,
        createJurnalPembayaranPiutang,
        saveAuditLog,
        cetakBuktiPembayaran,
        checkPembayaranAccess
    };
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
        savePembayaran,
        rollbackPembayaran,
        createJurnalPembayaranHutang,
        createJurnalPembayaranPiutang,
        saveAuditLog,
        cetakBuktiPembayaran,
        checkPembayaranAccess
    };
}
