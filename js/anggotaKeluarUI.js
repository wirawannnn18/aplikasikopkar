// Anggota Keluar UI Module
// Handles UI rendering and user interactions for member exit features

/**
 * Render "Anggota Keluar" button for anggota table
 * @param {string} anggotaId - ID of the anggota
 * @param {string} status - Current status of anggota
 * @returns {string} HTML string for the button
 */
function renderAnggotaKeluarButton(anggotaId, status) {
    // Implementation will be added in Task 7.1
    return '';
}

/**
 * Show anggota keluar confirmation modal
 * @param {string} anggotaId - ID of the anggota
 */
function showAnggotaKeluarModal(anggotaId) {
    // Get anggota data
    const anggota = getAnggotaById(anggotaId);
    
    if (!anggota) {
        alert('Anggota tidak ditemukan');
        return;
    }
    
    // Check if already keluar (Task 9.1: Updated to check pengembalianStatus)
    if (anggota.pengembalianStatus === 'Pending' || anggota.pengembalianStatus === 'Selesai') {
        alert('Anggota sudah berstatus keluar');
        return;
    }
    
    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="anggotaKeluarModal" tabindex="-1" aria-labelledby="anggotaKeluarModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title" id="anggotaKeluarModalLabel">
                            <i class="bi bi-box-arrow-right me-2"></i>Anggota Keluar dari Koperasi
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-warning">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            <strong>Perhatian:</strong> Tindakan ini akan menandai anggota keluar dari koperasi. 
                            Anggota tidak dapat melakukan transaksi baru setelah ditandai keluar.
                        </div>
                        
                        <h6 class="mb-3">Detail Anggota:</h6>
                        <table class="table table-sm table-borderless">
                            <tr>
                                <td width="120"><strong>NIK</strong></td>
                                <td>: ${anggota.nik}</td>
                            </tr>
                            <tr>
                                <td><strong>Nama</strong></td>
                                <td>: ${anggota.nama}</td>
                            </tr>
                            <tr>
                                <td><strong>Departemen</strong></td>
                                <td>: ${anggota.departemen || '-'}</td>
                            </tr>
                            <tr>
                                <td><strong>Tipe</strong></td>
                                <td>: ${anggota.tipeAnggota || 'Umum'}</td>
                            </tr>
                        </table>
                        
                        <hr>
                        
                        <form id="formAnggotaKeluar">
                            <input type="hidden" id="anggotaKeluarId" value="${anggotaId}">
                            
                            <div class="mb-3">
                                <label for="tanggalKeluar" class="form-label">
                                    Tanggal Keluar <span class="text-danger">*</span>
                                </label>
                                <input type="date" class="form-control" id="tanggalKeluar" 
                                       max="${getCurrentDateISO()}" required>
                                <div class="form-text">Tanggal tidak boleh di masa depan</div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="alasanKeluar" class="form-label">
                                    Alasan Keluar <span class="text-danger">*</span>
                                </label>
                                <textarea class="form-control" id="alasanKeluar" rows="3" 
                                          placeholder="Masukkan alasan anggota keluar dari koperasi" 
                                          required></textarea>
                                <div class="form-text">Minimal 10 karakter</div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-1"></i>Batal
                        </button>
                        <button type="button" class="btn btn-warning" onclick="handleMarkKeluar(event)">
                            <i class="bi bi-check-circle me-1"></i>Simpan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('anggotaKeluarModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('anggotaKeluarModal'));
    modal.show();
    
    // Set default date to today
    document.getElementById('tanggalKeluar').value = getCurrentDateISO();
}

/**
 * Show pengembalian detail and processing modal
 * @param {string} anggotaId - ID of the anggota
 */
function showPengembalianModal(anggotaId) {
    // Get anggota data
    const anggota = getAnggotaById(anggotaId);
    
    if (!anggota) {
        alert('Anggota tidak ditemukan');
        return;
    }
    
    // Check if anggota has status "Keluar"
    if (anggota.statusKeanggotaan !== 'Keluar') {
        alert('Anggota belum berstatus keluar. Tandai anggota keluar terlebih dahulu.');
        return;
    }
    
    // Check if pengembalian already processed
    if (anggota.pengembalianStatus === 'Selesai') {
        alert('Pengembalian sudah diproses untuk anggota ini');
        return;
    }
    
    // Calculate pengembalian
    const calculation = calculatePengembalian(anggotaId);
    
    if (!calculation.success) {
        alert(`Gagal menghitung pengembalian: ${calculation.error.message}`);
        return;
    }
    
    const data = calculation.data;
    
    // Validate pengembalian (without metodePembayaran parameter)
    const validation = validatePengembalian(anggotaId);
    
    // Build validation warnings HTML
    let validationHTML = '';
    if (!validation.valid) {
        validationHTML = '<div class="alert alert-danger mt-3"><h6 class="alert-heading"><i class="bi bi-exclamation-triangle me-2"></i>Validasi Gagal:</h6><ul class="mb-0">';
        validation.errors.forEach(error => {
            validationHTML += `<li>${error.message}</li>`;
        });
        validationHTML += '</ul></div>';
    } else if (validation.warnings && validation.warnings.length > 0) {
        validationHTML = '<div class="alert alert-warning mt-3"><h6 class="alert-heading"><i class="bi bi-info-circle me-2"></i>Peringatan:</h6><ul class="mb-0">';
        validation.warnings.forEach(warning => {
            validationHTML += `<li>${warning.message}</li>`;
        });
        validationHTML += '</ul></div>';
    }
    
    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="pengembalianModal" tabindex="-1" aria-labelledby="pengembalianModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title" id="pengembalianModalLabel">
                            <i class="bi bi-cash-coin me-2"></i>Proses Pengembalian Simpanan
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <!-- Anggota Information -->
                        <h6 class="mb-3">Informasi Anggota:</h6>
                        <table class="table table-sm table-borderless">
                            <tr>
                                <td width="150"><strong>NIK</strong></td>
                                <td>: ${data.anggotaNIK}</td>
                            </tr>
                            <tr>
                                <td><strong>Nama</strong></td>
                                <td>: ${data.anggotaNama}</td>
                            </tr>
                            <tr>
                                <td><strong>Tanggal Keluar</strong></td>
                                <td>: ${anggota.tanggalKeluar ? formatDateToDisplay(anggota.tanggalKeluar) : '-'}</td>
                            </tr>
                            <tr>
                                <td><strong>Alasan Keluar</strong></td>
                                <td>: ${anggota.alasanKeluar || '-'}</td>
                            </tr>
                        </table>
                        
                        <hr>
                        
                        <!-- Rincian Simpanan -->
                        <h6 class="mb-3">Rincian Simpanan:</h6>
                        <table class="table table-sm">
                            <tr>
                                <td width="200"><strong>Simpanan Pokok</strong></td>
                                <td class="text-end">Rp ${data.simpananPokok.toLocaleString('id-ID')}</td>
                            </tr>
                            <tr>
                                <td><strong>Simpanan Wajib</strong></td>
                                <td class="text-end">Rp ${data.simpananWajib.toLocaleString('id-ID')}</td>
                            </tr>
                            <tr class="table-light">
                                <td><strong>Total Simpanan</strong></td>
                                <td class="text-end"><strong>Rp ${data.totalSimpanan.toLocaleString('id-ID')}</strong></td>
                            </tr>
                            ${data.kewajibanLain > 0 ? `
                            <tr class="table-warning">
                                <td><strong>Kewajiban Lain</strong></td>
                                <td class="text-end text-danger">- Rp ${data.kewajibanLain.toLocaleString('id-ID')}</td>
                            </tr>
                            ` : ''}
                            <tr class="table-success">
                                <td><strong>Total Pengembalian</strong></td>
                                <td class="text-end"><h5 class="mb-0 text-success">Rp ${data.totalPengembalian.toLocaleString('id-ID')}</h5></td>
                            </tr>
                        </table>
                        
                        ${validationHTML}
                        
                        ${validation.valid ? `
                        <hr>
                        
                        <!-- Processing Form -->
                        <h6 class="mb-3">Form Pengembalian:</h6>
                        <form id="formProsesPengembalian">
                            <input type="hidden" id="pengembalianAnggotaId" value="${anggotaId}">
                            
                            <div class="mb-3">
                                <label for="metodePembayaran" class="form-label">
                                    Metode Pembayaran <span class="text-danger">*</span>
                                </label>
                                <select class="form-select" id="metodePembayaran" required>
                                    <option value="">-- Pilih Metode Pembayaran --</option>
                                    <option value="Kas">Kas</option>
                                    <option value="Transfer Bank">Transfer Bank</option>
                                </select>
                            </div>
                            
                            <div class="mb-3">
                                <label for="tanggalPembayaran" class="form-label">
                                    Tanggal Pembayaran <span class="text-danger">*</span>
                                </label>
                                <input type="date" class="form-control" id="tanggalPembayaran" 
                                       max="${getCurrentDateISO()}" required>
                                <div class="form-text">Tanggal tidak boleh di masa depan</div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="keteranganPengembalian" class="form-label">
                                    Keterangan (Opsional)
                                </label>
                                <textarea class="form-control" id="keteranganPengembalian" rows="2" 
                                          placeholder="Catatan tambahan untuk pengembalian ini"></textarea>
                            </div>
                        </form>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-1"></i>Tutup
                        </button>
                        ${validation.valid ? `
                        <button type="button" class="btn btn-primary" onclick="handleProsesPengembalian(event)">
                            <i class="bi bi-check-circle me-1"></i>Proses Pengembalian
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('pengembalianModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('pengembalianModal'));
    modal.show();
    
    // Set default date to today
    if (validation.valid) {
        document.getElementById('tanggalPembayaran').value = getCurrentDateISO();
    }
}

/**
 * Render laporan anggota keluar page
 * @param {string} startDate - Optional start date filter (YYYY-MM-DD)
 * @param {string} endDate - Optional end date filter (YYYY-MM-DD)
 */
function renderLaporanAnggotaKeluar(startDate = null, endDate = null) {
    // Get all anggota keluar
    let anggotaKeluar = getAnggotaKeluar();
    
    // Apply date range filter if provided (Requirement 5.4)
    if (startDate || endDate) {
        anggotaKeluar = filterAnggotaKeluarByDateRange(anggotaKeluar, startDate, endDate);
    }
    
    // Get pengembalian data for each anggota
    const anggotaWithPengembalian = anggotaKeluar.map(anggota => {
        const pengembalian = getPengembalianByAnggota(anggota.id);
        const latestPengembalian = pengembalian.length > 0 ? pengembalian[pengembalian.length - 1] : null;
        
        return {
            ...anggota,
            totalPengembalian: latestPengembalian ? latestPengembalian.totalPengembalian : 0,
            pengembalianData: latestPengembalian
        };
    });
    
    // Build HTML
    let html = `
        <div class="container-fluid mt-4">
            <div class="row mb-4">
                <div class="col-12">
                    <h3><i class="bi bi-file-earmark-text me-2"></i>Laporan Anggota Keluar</h3>
                    <p class="text-muted">Daftar anggota yang telah keluar dari koperasi</p>
                </div>
            </div>
            
            <!-- Filter Section -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header bg-primary text-white">
                            <i class="bi bi-funnel me-2"></i>Filter Laporan
                        </div>
                        <div class="card-body">
                            <form id="formFilterLaporan" class="row g-3">
                                <div class="col-md-4">
                                    <label for="filterStartDate" class="form-label">Tanggal Mulai</label>
                                    <input type="date" class="form-control" id="filterStartDate" 
                                           value="${startDate || ''}"
                                           max="${getCurrentDateISO()}">
                                </div>
                                <div class="col-md-4">
                                    <label for="filterEndDate" class="form-label">Tanggal Akhir</label>
                                    <input type="date" class="form-control" id="filterEndDate" 
                                           value="${endDate || ''}"
                                           max="${getCurrentDateISO()}">
                                </div>
                                <div class="col-md-4 d-flex align-items-end">
                                    <button type="button" class="btn btn-primary me-2" onclick="handleFilterLaporan(event)">
                                        <i class="bi bi-search me-1"></i>Terapkan Filter
                                    </button>
                                    <button type="button" class="btn btn-secondary" onclick="handleResetFilter(event)">
                                        <i class="bi bi-x-circle me-1"></i>Reset
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Summary Section -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card bg-info text-white">
                        <div class="card-body">
                            <h6 class="card-title">Total Anggota Keluar</h6>
                            <h3 class="mb-0">${anggotaWithPengembalian.length}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-warning text-dark">
                        <div class="card-body">
                            <h6 class="card-title">Pending</h6>
                            <h3 class="mb-0">${anggotaWithPengembalian.filter(a => a.pengembalianStatus === 'Pending').length}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <h6 class="card-title">Selesai</h6>
                            <h3 class="mb-0">${anggotaWithPengembalian.filter(a => a.pengembalianStatus === 'Selesai').length}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <h6 class="card-title">Total Pengembalian</h6>
                            <h3 class="mb-0">Rp ${anggotaWithPengembalian.reduce((sum, a) => sum + a.totalPengembalian, 0).toLocaleString('id-ID')}</h3>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Export Button -->
            <div class="row mb-3">
                <div class="col-12 text-end">
                    <button type="button" class="btn btn-success" onclick="handleExportCSV(event)">
                        <i class="bi bi-file-earmark-spreadsheet me-1"></i>Export CSV
                    </button>
                </div>
            </div>
            
            <!-- Table Section -->
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header bg-light">
                            <i class="bi bi-table me-2"></i>Daftar Anggota Keluar
                        </div>
                        <div class="card-body">
                            ${anggotaWithPengembalian.length === 0 ? `
                                <div class="alert alert-info text-center">
                                    <i class="bi bi-info-circle me-2"></i>
                                    Tidak ada data anggota keluar${startDate || endDate ? ' untuk periode yang dipilih' : ''}.
                                </div>
                            ` : `
                                <div class="table-responsive">
                                    <table class="table table-striped table-hover">
                                        <thead class="table-dark">
                                            <tr>
                                                <th>No</th>
                                                <th>NIK</th>
                                                <th>Nama</th>
                                                <th>Departemen</th>
                                                <th>Tanggal Keluar</th>
                                                <th>Status Pengembalian</th>
                                                <th>Total Pengembalian</th>
                                                <th>Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${anggotaWithPengembalian.map((anggota, index) => `
                                                <tr>
                                                    <td>${index + 1}</td>
                                                    <td>${anggota.nik}</td>
                                                    <td>${anggota.nama}</td>
                                                    <td>${anggota.departemen || '-'}</td>
                                                    <td>${anggota.tanggalKeluar ? formatDateToDisplay(anggota.tanggalKeluar) : '-'}</td>
                                                    <td>
                                                        ${anggota.pengembalianStatus === 'Selesai' 
                                                            ? '<span class="badge bg-success">Selesai</span>'
                                                            : anggota.pengembalianStatus === 'Diproses'
                                                            ? '<span class="badge bg-info">Diproses</span>'
                                                            : '<span class="badge bg-warning">Pending</span>'
                                                        }
                                                    </td>
                                                    <td class="text-end">Rp ${anggota.totalPengembalian.toLocaleString('id-ID')}</td>
                                                    <td>
                                                        <button class="btn btn-sm btn-secondary me-1" 
                                                                onclick="handleCetakBuktiAnggotaKeluar('${anggota.id}')"
                                                                title="Cetak Bukti Anggota Keluar">
                                                            <i class="bi bi-file-earmark-person"></i>
                                                        </button>
                                                        ${anggota.pengembalianStatus === 'Selesai' && anggota.pengembalianId ? `
                                                            <button class="btn btn-sm btn-primary me-1" 
                                                                    onclick="handleCetakBukti('${anggota.pengembalianId}')"
                                                                    title="Cetak Bukti Pengembalian">
                                                                <i class="bi bi-printer"></i>
                                                            </button>
                                                            <button class="btn btn-sm btn-success me-1" 
                                                                    onclick="handleCetakSuratPengunduranDiri('${anggota.id}')"
                                                                    title="Cetak Surat Pengunduran Diri">
                                                                <i class="bi bi-file-earmark-text"></i>
                                                            </button>
                                                            <button class="btn btn-sm btn-danger" 
                                                                    onclick="showDeleteConfirmationModal('${anggota.id}')"
                                                                    title="Hapus Data Permanen">
                                                                <i class="bi bi-trash"></i>
                                                            </button>
                                                        ` : `
                                                            <button class="btn btn-sm btn-info" 
                                                                    onclick="showPengembalianModal('${anggota.id}')"
                                                                    title="Proses Pengembalian">
                                                                <i class="bi bi-cash-coin"></i>
                                                            </button>
                                                        `}
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return html;
}

/**
 * Filter anggota keluar by date range
 * @param {array} anggotaKeluar - Array of anggota keluar
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {array} Filtered array
 */
function filterAnggotaKeluarByDateRange(anggotaKeluar, startDate, endDate) {
    return anggotaKeluar.filter(anggota => {
        if (!anggota.tanggalKeluar) return false;
        
        const tanggalKeluar = new Date(anggota.tanggalKeluar);
        tanggalKeluar.setHours(0, 0, 0, 0);
        
        // Apply start date filter
        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (tanggalKeluar < start) return false;
        }
        
        // Apply end date filter
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(0, 0, 0, 0);
            if (tanggalKeluar > end) return false;
        }
        
        return true;
    });
}

/**
 * Handle filter laporan action
 * @param {Event} event - Click event
 */
function handleFilterLaporan(event) {
    event.preventDefault();
    
    const startDate = document.getElementById('filterStartDate').value;
    const endDate = document.getElementById('filterEndDate').value;
    
    // Validate date range
    if (startDate && endDate && startDate > endDate) {
        alert('Tanggal mulai tidak boleh lebih besar dari tanggal akhir');
        return;
    }
    
    // Re-render with filter
    const html = renderLaporanAnggotaKeluar(startDate, endDate);
    const contentArea = document.getElementById('content-area');
    if (contentArea) {
        contentArea.innerHTML = html;
    }
}

/**
 * Handle reset filter action
 * @param {Event} event - Click event
 */
function handleResetFilter(event) {
    event.preventDefault();
    
    // Clear filter inputs
    document.getElementById('filterStartDate').value = '';
    document.getElementById('filterEndDate').value = '';
    
    // Re-render without filter
    const html = renderLaporanAnggotaKeluar();
    const contentArea = document.getElementById('content-area');
    if (contentArea) {
        contentArea.innerHTML = html;
    }
}

/**
 * Show cancellation confirmation modal
 * @param {string} anggotaId - ID of the anggota
 */
function showCancelKeluarModal(anggotaId) {
    // Get anggota data
    const anggota = getAnggotaById(anggotaId);
    
    if (!anggota) {
        alert('Anggota tidak ditemukan');
        return;
    }
    
    // Check if anggota has status "Keluar"
    if (anggota.statusKeanggotaan !== 'Keluar') {
        alert('Anggota tidak berstatus keluar');
        return;
    }
    
    // Check if pengembalian already processed
    if (anggota.pengembalianStatus === 'Selesai') {
        alert('Pembatalan tidak dapat dilakukan karena pengembalian sudah diproses');
        return;
    }
    
    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="cancelKeluarModal" tabindex="-1" aria-labelledby="cancelKeluarModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title" id="cancelKeluarModalLabel">
                            <i class="bi bi-x-circle me-2"></i>Batalkan Status Keluar
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-warning">
                            <i class="bi bi-exclamation-triangle me-2"></i>
                            <strong>Perhatian:</strong> Tindakan ini akan membatalkan status keluar dan mengembalikan anggota ke status aktif.
                        </div>
                        
                        <h6 class="mb-3">Detail Anggota:</h6>
                        <table class="table table-sm table-borderless">
                            <tr>
                                <td width="150"><strong>NIK</strong></td>
                                <td>: ${anggota.nik}</td>
                            </tr>
                            <tr>
                                <td><strong>Nama</strong></td>
                                <td>: ${anggota.nama}</td>
                            </tr>
                            <tr>
                                <td><strong>Tanggal Keluar</strong></td>
                                <td>: ${anggota.tanggalKeluar ? formatDateToDisplay(anggota.tanggalKeluar) : '-'}</td>
                            </tr>
                            <tr>
                                <td><strong>Alasan Keluar</strong></td>
                                <td>: ${anggota.alasanKeluar || '-'}</td>
                            </tr>
                            <tr>
                                <td><strong>Status Pengembalian</strong></td>
                                <td>: <span class="badge bg-warning">${anggota.pengembalianStatus || 'Pending'}</span></td>
                            </tr>
                        </table>
                        
                        <div class="alert alert-info mt-3">
                            <i class="bi bi-info-circle me-2"></i>
                            Setelah dibatalkan, anggota akan kembali ke status <strong>Aktif</strong> dan dapat melakukan transaksi seperti biasa.
                        </div>
                        
                        <input type="hidden" id="cancelKeluarAnggotaId" value="${anggotaId}">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-arrow-left me-1"></i>Kembali
                        </button>
                        <button type="button" class="btn btn-danger" onclick="handleCancelKeluar(event)">
                            <i class="bi bi-check-circle me-1"></i>Ya, Batalkan Status Keluar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('cancelKeluarModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('cancelKeluarModal'));
    modal.show();
}

// ===== Event Handlers =====

/**
 * Handle mark anggota keluar action
 * @param {Event} event - Click event
 */
function handleMarkKeluar(event) {
    event.preventDefault();
    
    // Check access control
    if (!checkAccessOrDeny('markKeluar')) {
        return;
    }
    
    // Clear previous validation errors
    clearValidationErrors('formAnggotaKeluar');
    
    // Get form data
    const anggotaId = document.getElementById('anggotaKeluarId').value;
    const tanggalKeluar = document.getElementById('tanggalKeluar').value;
    const alasanKeluar = document.getElementById('alasanKeluar').value;
    
    // Sanitize input data
    const sanitizeResult = sanitizeAnggotaKeluarData({
        anggotaId: anggotaId,
        tanggalKeluar: tanggalKeluar,
        alasanKeluar: alasanKeluar
    });
    
    if (!sanitizeResult.valid) {
        displayValidationErrors('formAnggotaKeluar', sanitizeResult.errors);
        return;
    }
    
    // Use sanitized data
    const sanitizedData = sanitizeResult.sanitized;
    
    // Validate form using validation rules
    const validation = validateForm('formAnggotaKeluar', {
        tanggalKeluar: {
            required: true,
            label: 'Tanggal keluar',
            requiredMessage: 'Tanggal keluar harus diisi',
            custom: (value) => {
                const selectedDate = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (selectedDate > today) {
                    return 'Tanggal keluar tidak boleh di masa depan';
                }
                return true;
            }
        },
        alasanKeluar: {
            required: true,
            minLength: 10,
            label: 'Alasan keluar',
            requiredMessage: 'Alasan keluar harus diisi',
            minLengthMessage: 'Alasan keluar minimal 10 karakter'
        }
    });
    
    // Display validation errors if any
    if (!validation.valid) {
        displayValidationErrors('formAnggotaKeluar', validation.errors);
        return;
    }
    
    // Get anggota data for confirmation
    const anggota = getAnggotaById(anggotaId);
    if (!anggota) {
        showToast('Anggota tidak ditemukan', 'error');
        return;
    }
    
    // Confirm action with custom modal
    confirmAction(
        'Konfirmasi Anggota Keluar',
        `<p>Apakah Anda yakin ingin menandai anggota ini keluar dari koperasi?</p>
         <table class="table table-sm table-borderless">
            <tr><td width="100"><strong>Nama</strong></td><td>: ${anggota.nama}</td></tr>
            <tr><td><strong>NIK</strong></td><td>: ${anggota.nik}</td></tr>
            <tr><td><strong>Tanggal</strong></td><td>: ${formatDateToDisplay(tanggalKeluar)}</td></tr>
            <tr><td><strong>Alasan</strong></td><td>: ${alasanKeluar}</td></tr>
         </table>
         <p class="text-danger mb-0"><small><i class="bi bi-exclamation-triangle me-1"></i>Anggota tidak dapat melakukan transaksi baru setelah ditandai keluar.</small></p>`,
        () => {
            // Get button for loading state
            const saveButton = event.target;
            const restoreButton = showButtonLoading(saveButton, 'Menyimpan...');
            
            // Call markAnggotaKeluar function with sanitized data
            const result = markAnggotaKeluar(
                sanitizedData.anggotaId,
                sanitizedData.tanggalKeluar,
                sanitizedData.alasanKeluar
            );
            
            // Restore button
            restoreButton();
            
            if (result.success) {
                // Log audit action
                logAnggotaKeluarAction('MARK_KELUAR', {
                    anggotaId: sanitizedData.anggotaId,
                    anggotaNama: anggota.nama,
                    tanggalKeluar: sanitizedData.tanggalKeluar,
                    alasanKeluar: sanitizedData.alasanKeluar
                });
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('anggotaKeluarModal'));
                modal.hide();
                
                // Show success modal with print option
                showSuccessAnggotaKeluarModal(sanitizedData.anggotaId, anggota.nama);
                
                // Refresh anggota table
                if (typeof renderTableAnggota === 'function') {
                    renderTableAnggota();
                }
            } else {
                // Show error toast
                showToast(result.error.message, 'error');
            }
        },
        {
            confirmText: 'Ya, Tandai Keluar',
            cancelText: 'Batal',
            type: 'warning'
        }
    );
}

/**
 * Handle proses pengembalian action
 * @param {Event} event - Submit event
 */
function handleProsesPengembalian(event) {
    event.preventDefault();
    
    // Check access control
    if (!checkAccessOrDeny('processPengembalian')) {
        return;
    }
    
    // Clear previous validation errors
    clearValidationErrors('formProsesPengembalian');
    
    // Get form data
    const anggotaId = document.getElementById('pengembalianAnggotaId').value;
    const metodePembayaran = document.getElementById('metodePembayaran').value;
    const tanggalPembayaran = document.getElementById('tanggalPembayaran').value;
    const keterangan = document.getElementById('keteranganPengembalian').value;
    
    // Sanitize input data
    const sanitizeResult = sanitizePengembalianData({
        anggotaId: anggotaId,
        metodePembayaran: metodePembayaran,
        tanggalPembayaran: tanggalPembayaran,
        keterangan: keterangan
    });
    
    if (!sanitizeResult.valid) {
        displayValidationErrors('formProsesPengembalian', sanitizeResult.errors);
        return;
    }
    
    // Use sanitized data
    const sanitizedData = sanitizeResult.sanitized;
    
    // Validate form using validation rules
    const validation = validateForm('formProsesPengembalian', {
        metodePembayaran: {
            required: true,
            label: 'Metode pembayaran',
            requiredMessage: 'Metode pembayaran harus dipilih'
        },
        tanggalPembayaran: {
            required: true,
            label: 'Tanggal pembayaran',
            requiredMessage: 'Tanggal pembayaran harus diisi',
            custom: (value) => {
                const selectedDate = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (selectedDate > today) {
                    return 'Tanggal pembayaran tidak boleh di masa depan';
                }
                return true;
            }
        }
    });
    
    // Display validation errors if any
    if (!validation.valid) {
        displayValidationErrors('formProsesPengembalian', validation.errors);
        return;
    }
    
    // Get anggota data for confirmation
    const anggota = getAnggotaById(anggotaId);
    if (!anggota) {
        showToast('Anggota tidak ditemukan', 'error');
        return;
    }
    
    // Calculate pengembalian for confirmation
    const calculation = calculatePengembalian(anggotaId);
    if (!calculation.success) {
        showToast(`Gagal menghitung pengembalian: ${calculation.error.message}`, 'error');
        return;
    }
    
    const totalPengembalian = calculation.data.totalPengembalian;
    
    // Confirm action with custom modal
    confirmAction(
        'Konfirmasi Proses Pengembalian',
        `<p>Apakah Anda yakin ingin memproses pengembalian simpanan?</p>
         <table class="table table-sm table-borderless">
            <tr><td width="150"><strong>Anggota</strong></td><td>: ${anggota.nama}</td></tr>
            <tr><td><strong>Total Pengembalian</strong></td><td>: <strong class="text-success">Rp ${totalPengembalian.toLocaleString('id-ID')}</strong></td></tr>
            <tr><td><strong>Metode</strong></td><td>: ${metodePembayaran}</td></tr>
            <tr><td><strong>Tanggal</strong></td><td>: ${formatDateToDisplay(tanggalPembayaran)}</td></tr>
         </table>
         <p class="text-danger mb-0"><small><i class="bi bi-exclamation-triangle me-1"></i>Tindakan ini tidak dapat dibatalkan setelah diproses.</small></p>`,
        () => {
            // Get button for loading state
            const processButton = event.target;
            const restoreButton = showButtonLoading(processButton, 'Memproses...');
            
            // Call processPengembalian function with sanitized data
            const result = processPengembalian(
                sanitizedData.anggotaId,
                sanitizedData.metodePembayaran,
                sanitizedData.tanggalPembayaran,
                sanitizedData.keterangan
            );
            
            // Restore button
            restoreButton();
            
            if (result.success) {
                // Log audit action
                logAnggotaKeluarAction('PROSES_PENGEMBALIAN', {
                    anggotaId: sanitizedData.anggotaId,
                    anggotaNama: anggota.nama,
                    pengembalianId: result.data.pengembalianId,
                    nomorReferensi: result.data.nomorReferensi,
                    totalPengembalian: result.data.totalPengembalian,
                    metodePembayaran: sanitizedData.metodePembayaran,
                    tanggalPembayaran: sanitizedData.tanggalPembayaran
                });
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('pengembalianModal'));
                modal.hide();
                
                // Show success toast with action summary
                const successMessage = `Pengembalian simpanan berhasil diproses<br>` +
                                      `<small>Nomor Referensi: ${result.data.nomorReferensi}<br>` +
                                      `Total: Rp ${result.data.totalPengembalian.toLocaleString('id-ID')}</small>`;
                showToast(successMessage, 'success', 7000);
                
                // Show print options modal
                setTimeout(() => {
                    showPrintOptionsModal(sanitizedData.anggotaId, result.data.pengembalianId, result.data.nomorReferensi);
                }, 500);
                
                // Refresh anggota table
                if (typeof renderTableAnggota === 'function') {
                    renderTableAnggota();
                }
            } else {
                // Show error with details
                let errorMessage = result.error.message;
                
                // Show detailed validation errors if available
                if (result.error.details && Array.isArray(result.error.details)) {
                    errorMessage += '<br><br><strong>Detail Error:</strong><ul class="mb-0 mt-2">';
                    result.error.details.forEach(detail => {
                        errorMessage += `<li>${detail.message}</li>`;
                    });
                    errorMessage += '</ul>';
                }
                
                showToast(errorMessage, 'error', 10000);
            }
        },
        {
            confirmText: 'Ya, Proses Pengembalian',
            cancelText: 'Batal',
            type: 'danger'
        }
    );
}

/**
 * Handle cancel status keluar action
 * @param {Event} event - Click event
 */
function handleCancelKeluar(event) {
    event.preventDefault();
    
    // Check access control
    if (!checkAccessOrDeny('cancelKeluar')) {
        return;
    }
    
    // Get anggota ID
    const anggotaId = document.getElementById('cancelKeluarAnggotaId').value;
    
    // Get anggota data for confirmation
    const anggota = getAnggotaById(anggotaId);
    if (!anggota) {
        showToast('Anggota tidak ditemukan', 'error');
        return;
    }
    
    // Confirm action - no need for nested confirmation since modal already has one
    // Get button for loading state
    const cancelButton = event.target;
    const restoreButton = showButtonLoading(cancelButton, 'Membatalkan...');
    
    // Call cancelStatusKeluar function
    const result = cancelStatusKeluar(anggotaId);
    
    // Restore button
    restoreButton();
    
    if (result.success) {
        // Log audit action
        logAnggotaKeluarAction('CANCEL_KELUAR', {
            anggotaId: anggotaId,
            anggotaNama: anggota.nama,
            previousStatus: 'Keluar',
            newStatus: 'Aktif'
        });
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('cancelKeluarModal'));
        modal.hide();
        
        // Show success toast
        showToast(`Status keluar berhasil dibatalkan. ${anggota.nama} sekarang berstatus Aktif.`, 'success');
        
        // Refresh anggota table
        if (typeof renderTableAnggota === 'function') {
            renderTableAnggota();
        }
    } else {
        // Show error toast
        showToast(result.error.message, 'error');
    }
}

/**
 * Handle cetak bukti action
 * @param {string} pengembalianId - ID of the pengembalian record
 */
function handleCetakBukti(pengembalianId) {
    if (!pengembalianId) {
        showToast('ID pengembalian tidak valid', 'error');
        return;
    }
    
    // Show loading toast
    showToast('Membuat bukti pengembalian...', 'info', 2000);
    
    // Generate bukti pengembalian
    const result = generateBuktiPengembalian(pengembalianId);
    
    if (result.success) {
        // Open bukti in new window
        const buktiWindow = window.open('', '_blank');
        
        if (buktiWindow) {
            buktiWindow.document.write(result.data.html);
            buktiWindow.document.close();
            
            // Focus on new window
            buktiWindow.focus();
            
            // Show success toast
            showToast('Bukti pengembalian berhasil dibuat', 'success');
        } else {
            showToast('Gagal membuka jendela baru. Pastikan popup tidak diblokir oleh browser.', 'warning', 7000);
        }
    } else {
        showToast(`Gagal membuat bukti pengembalian: ${result.error.message}`, 'error');
    }
}

/**
 * Handle export CSV action
 * @param {Event} event - Click event
 */
function handleExportCSV(event) {
    event.preventDefault();
    
    // Check access control
    if (!checkAccessOrDeny('exportCSV')) {
        return;
    }
    
    // Get current filter values
    const startDate = document.getElementById('filterStartDate')?.value || null;
    const endDate = document.getElementById('filterEndDate')?.value || null;
    
    // Get filtered anggota keluar
    let anggotaKeluar = getAnggotaKeluar();
    
    if (startDate || endDate) {
        anggotaKeluar = filterAnggotaKeluarByDateRange(anggotaKeluar, startDate, endDate);
    }
    
    // Check if there's data to export
    if (anggotaKeluar.length === 0) {
        showToast('Tidak ada data untuk diekspor', 'warning');
        return;
    }
    
    // Show loading toast
    showToast('Membuat file CSV...', 'info', 2000);
    
    // Generate CSV content
    const csvResult = generateCSVAnggotaKeluar(anggotaKeluar);
    
    if (!csvResult.success) {
        showToast(`Gagal membuat CSV: ${csvResult.error.message}`, 'error');
        return;
    }
    
    // Create download link
    const blob = new Blob([csvResult.data.csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', csvResult.data.filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Log audit action
    logAnggotaKeluarAction('EXPORT_CSV', {
        recordCount: anggotaKeluar.length,
        filename: csvResult.data.filename,
        startDate: startDate,
        endDate: endDate
    });
    
    // Show success toast
    const successMessage = `Berhasil mengekspor ${anggotaKeluar.length} data anggota keluar<br><small>File: ${csvResult.data.filename}</small>`;
    showToast(successMessage, 'success');
}

/**
 * Generate CSV content for anggota keluar
 * @param {array} anggotaKeluar - Array of anggota keluar
 * @returns {object} Result with CSV content and filename
 */
function generateCSVAnggotaKeluar(anggotaKeluar) {
    try {
        // Validate input
        if (!Array.isArray(anggotaKeluar)) {
            return {
                success: false,
                error: {
                    code: 'INVALID_PARAMETER',
                    message: 'Data anggota keluar tidak valid',
                    timestamp: new Date().toISOString()
                }
            };
        }
        
        // CSV Header (Requirement 5.5)
        const headers = [
            'NIK',
            'Nama',
            'Departemen',
            'Tipe Anggota',
            'Tanggal Keluar',
            'Alasan Keluar',
            'Status Pengembalian',
            'Simpanan Pokok',
            'Simpanan Wajib',
            'Kewajiban Lain',
            'Total Pengembalian',
            'Metode Pembayaran',
            'Tanggal Pembayaran',
            'Nomor Referensi'
        ];
        
        // Build CSV rows
        const rows = anggotaKeluar.map(anggota => {
            // Get pengembalian data
            const pengembalianList = getPengembalianByAnggota(anggota.id);
            const pengembalian = pengembalianList.length > 0 ? pengembalianList[pengembalianList.length - 1] : null;
            
            // Calculate totals if pengembalian not yet processed
            let simpananPokok = 0;
            let simpananWajib = 0;
            let kewajibanLain = 0;
            let totalPengembalian = 0;
            
            if (pengembalian) {
                simpananPokok = pengembalian.simpananPokok || 0;
                simpananWajib = pengembalian.simpananWajib || 0;
                kewajibanLain = pengembalian.kewajibanLain || 0;
                totalPengembalian = pengembalian.totalPengembalian || 0;
            } else {
                // Calculate from raw data
                const calculation = calculatePengembalian(anggota.id);
                if (calculation.success) {
                    simpananPokok = calculation.data.simpananPokok;
                    simpananWajib = calculation.data.simpananWajib;
                    kewajibanLain = calculation.data.kewajibanLain;
                    totalPengembalian = calculation.data.totalPengembalian;
                }
            }
            
            return [
                escapeCSV(anggota.nik || ''),
                escapeCSV(anggota.nama || ''),
                escapeCSV(anggota.departemen || ''),
                escapeCSV(anggota.tipeAnggota || 'Umum'),
                anggota.tanggalKeluar || '',
                escapeCSV(anggota.alasanKeluar || ''),
                anggota.pengembalianStatus || 'Pending',
                simpananPokok,
                simpananWajib,
                kewajibanLain,
                totalPengembalian,
                pengembalian ? escapeCSV(pengembalian.metodePembayaran || '') : '',
                pengembalian ? (pengembalian.tanggalPembayaran || '') : '',
                pengembalian ? escapeCSV(pengembalian.nomorReferensi || '') : ''
            ];
        });
        
        // Combine headers and rows
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const filename = `laporan-anggota-keluar-${timestamp}.csv`;
        
        return {
            success: true,
            data: {
                csv: csvContent,
                filename: filename,
                rowCount: anggotaKeluar.length
            },
            message: `CSV berhasil dibuat dengan ${anggotaKeluar.length} baris data`
        };
        
    } catch (error) {
        console.error('Error in generateCSVAnggotaKeluar:', error);
        return {
            success: false,
            error: {
                code: 'SYSTEM_ERROR',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };
    }
}

/**
 * Escape CSV field value
 * @param {string} value - Value to escape
 * @returns {string} Escaped value
 */
function escapeCSV(value) {
    if (value === null || value === undefined) {
        return '';
    }
    
    const stringValue = String(value);
    
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return '"' + stringValue.replace(/"/g, '""') + '"';
    }
    
    return stringValue;
}

// ===== UI Helper Functions =====

/**
 * Show loading indicator
 * @param {string} message - Loading message
 */
function showLoadingIndicator(message = 'Memproses...') {
    // Implementation will be added in Task 11.3
}

/**
 * Hide loading indicator
 */
function hideLoadingIndicator() {
    // Implementation will be added in Task 11.3
}

/**
 * Show validation error
 * @param {string} fieldId - ID of the field with error
 * @param {string} message - Error message
 */
function showValidationError(fieldId, message) {
    // Implementation will be added in Task 11.1
}

/**
 * Clear validation errors
 */
function clearValidationErrors() {
    // Implementation will be added in Task 11.1
}

/**
 * Show success notification
 * @param {string} message - Success message
 */
function showSuccessNotification(message) {
    // Implementation will be added in Task 11.2
}

/**
 * Show error notification
 * @param {string} message - Error message
 */
function showErrorNotification(message) {
    // Implementation will be added in Task 11.2
}

/**
 * Show success modal after marking anggota keluar with print option
 * @param {string} anggotaId - ID of the anggota
 * @param {string} anggotaNama - Name of the anggota
 */
function showSuccessAnggotaKeluarModal(anggotaId, anggotaNama) {
    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="successAnggotaKeluarModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-check-circle me-2"></i>Anggota Berhasil Ditandai Keluar
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-success">
                            <i class="bi bi-check-circle-fill me-2"></i>
                            <strong>${anggotaNama}</strong> telah berhasil ditandai keluar dari koperasi.
                        </div>
                        
                        <p>Anda dapat:</p>
                        <ul>
                            <li>Mencetak bukti anggota keluar untuk dokumentasi</li>
                            <li>Memproses pengembalian simpanan setelah ini</li>
                        </ul>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-1"></i>Tutup
                        </button>
                        <button type="button" class="btn btn-primary" onclick="handleCetakBuktiAnggotaKeluar('${anggotaId}')">
                            <i class="bi bi-printer me-1"></i>Cetak Bukti Anggota Keluar
                        </button>
                        <button type="button" class="btn btn-success" onclick="handleProsesPengembalianFromSuccess('${anggotaId}')">
                            <i class="bi bi-cash-coin me-1"></i>Proses Pengembalian
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('successAnggotaKeluarModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('successAnggotaKeluarModal'));
    modal.show();
}

/**
 * Handle cetak bukti anggota keluar action
 * @param {string} anggotaId - ID of the anggota
 */
function handleCetakBuktiAnggotaKeluar(anggotaId) {
    try {
        // Generate bukti
        const result = generateBuktiAnggotaKeluar(anggotaId);
        
        if (!result.success) {
            showToast(result.error.message, 'error');
            return;
        }
        
        // Open in new window for printing
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            showToast('Popup diblokir. Mohon izinkan popup untuk mencetak bukti.', 'error');
            return;
        }
        
        printWindow.document.write(result.data.html);
        printWindow.document.close();
        
        // Auto print after load
        printWindow.onload = function() {
            printWindow.focus();
            // Don't auto print, let user decide
            // printWindow.print();
        };
        
        showToast('Bukti anggota keluar berhasil dibuka di tab baru', 'success');
        
    } catch (error) {
        console.error('Error in handleCetakBuktiAnggotaKeluar:', error);
        showToast('Gagal mencetak bukti: ' + error.message, 'error');
    }
}

/**
 * Handle proses pengembalian from success modal
 * @param {string} anggotaId - ID of the anggota
 */
function handleProsesPengembalianFromSuccess(anggotaId) {
    // Close success modal
    const successModal = bootstrap.Modal.getInstance(document.getElementById('successAnggotaKeluarModal'));
    if (successModal) {
        successModal.hide();
    }
    
    // Show pengembalian modal
    showPengembalianModal(anggotaId);
}


/**
 * Generate surat pengunduran diri for printing
 * @param {string} anggotaId - ID of the anggota
 * @param {string} pengembalianId - ID of the pengembalian record
 * @returns {object} Document generation result
 */
function generateSuratPengunduranDiri(anggotaId, pengembalianId) {
    try {
        // Validate input
        if (!anggotaId || typeof anggotaId !== 'string') {
            return {
                success: false,
                error: {
                    code: 'INVALID_PARAMETER',
                    message: 'ID anggota tidak valid',
                    timestamp: new Date().toISOString()
                }
            };
        }
        
        if (!pengembalianId || typeof pengembalianId !== 'string') {
            return {
                success: false,
                error: {
                    code: 'INVALID_PARAMETER',
                    message: 'ID pengembalian tidak valid',
                    timestamp: new Date().toISOString()
                }
            };
        }
        
        // Get anggota data
        const anggota = getAnggotaById(anggotaId);
        if (!anggota) {
            return {
                success: false,
                error: {
                    code: 'ANGGOTA_NOT_FOUND',
                    message: 'Data anggota tidak ditemukan',
                    timestamp: new Date().toISOString()
                }
            };
        }
        
        // Get pengembalian record
        const pengembalianList = JSON.parse(localStorage.getItem('pengembalian') || '[]');
        const pengembalian = pengembalianList.find(p => p.id === pengembalianId);
        
        if (!pengembalian) {
            return {
                success: false,
                error: {
                    code: 'PENGEMBALIAN_NOT_FOUND',
                    message: 'Data pengembalian tidak ditemukan',
                    timestamp: new Date().toISOString()
                }
            };
        }
        
        // Get system settings for koperasi info
        const systemSettings = JSON.parse(localStorage.getItem('systemSettings') || '{}');
        const namaKoperasi = systemSettings.namaKoperasi || 'KOPERASI';
        const alamatKoperasi = systemSettings.alamatKoperasi || '';
        const teleponKoperasi = systemSettings.teleponKoperasi || '';
        const logoKoperasi = systemSettings.logoKoperasi || '';
        
        // Format dates
        const tanggalCetak = new Date().toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        
        const tanggalKeluar = anggota.tanggalKeluar ? new Date(anggota.tanggalKeluar).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        }) : '-';
        
        const tanggalPembayaran = new Date(pengembalian.tanggalPembayaran).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        
        // Generate HTML document
        const suratHTML = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Surat Pengunduran Diri - ${anggota.nama}</title>
    <style>
        @media print {
            @page {
                size: A4;
                margin: 2cm;
            }
            body {
                margin: 0;
                padding: 0;
            }
            .no-print {
                display: none !important;
            }
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #333;
            max-width: 21cm;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            border-bottom: 3px solid #333;
            padding-bottom: 15px;
            margin-bottom: 30px;
        }
        
        .header .logo {
            max-width: 100px;
            max-height: 100px;
            margin-bottom: 10px;
        }
        
        .header h1 {
            margin: 0;
            font-size: 20pt;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .header p {
            margin: 5px 0;
            font-size: 10pt;
        }
        
        .title {
            text-align: center;
            margin: 30px 0;
        }
        
        .title h2 {
            margin: 0;
            font-size: 16pt;
            font-weight: bold;
            text-decoration: underline;
        }
        
        .reference {
            text-align: center;
            margin-bottom: 30px;
            font-size: 11pt;
        }
        
        .content {
            margin: 20px 0;
            text-align: justify;
        }
        
        .content p {
            margin: 15px 0;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        table.info td {
            padding: 8px;
            vertical-align: top;
            border: 1px solid #333;
        }
        
        table.info td:first-child {
            width: 40%;
            font-weight: bold;
            background-color: #f0f0f0;
        }
        
        .signatures {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
        }
        
        .signature-box {
            width: 45%;
            text-align: center;
        }
        
        .signature-line {
            margin-top: 80px;
            border-top: 1px solid #333;
            padding-top: 5px;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ccc;
            font-size: 9pt;
            color: #666;
            text-align: center;
        }
        
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 1000;
        }
        
        .print-button:hover {
            background-color: #0056b3;
        }
        
        .close-button {
            position: fixed;
            top: 20px;
            right: 180px;
            padding: 10px 20px;
            background-color: #6c757d;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 1000;
        }
        
        .close-button:hover {
            background-color: #5a6268;
        }
        
        .delete-button {
            position: fixed;
            top: 70px;
            right: 20px;
            padding: 10px 20px;
            background-color: #dc3545;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 1000;
        }
        
        .delete-button:hover {
            background-color: #c82333;
        }
    </style>
    <script>
    function handleDeleteAfterPrint(anggotaId) {
        // Close print window
        window.close();
        
        // Call delete function in parent window
        if (window.opener && typeof window.opener.showDeleteConfirmationModal === 'function') {
            window.opener.showDeleteConfirmationModal(anggotaId);
        }
    }
    </script>
</head>
<body>
    <button class="print-button no-print" onclick="window.print()">
        🖨️ Cetak Dokumen
    </button>
    <button class="close-button no-print" onclick="window.close()">
        ✖ Tutup
    </button>
    ${anggota.pengembalianStatus === 'Selesai' ? `
    <button class="delete-button no-print" onclick="handleDeleteAfterPrint('${anggotaId}')">
        🗑️ Hapus Data Permanen
    </button>
    ` : ''}
    
    <!-- Header Koperasi -->
    <div class="header">
        ${logoKoperasi ? `<img src="${logoKoperasi}" alt="Logo" class="logo">` : ''}
        <h1>${namaKoperasi}</h1>
        ${alamatKoperasi ? `<p>${alamatKoperasi}</p>` : ''}
        ${teleponKoperasi ? `<p>Telp: ${teleponKoperasi}</p>` : ''}
    </div>
    
    <!-- Title -->
    <div class="title">
        <h2>SURAT KETERANGAN PENGUNDURAN DIRI</h2>
    </div>
    
    <!-- Reference Number -->
    <div class="reference">
        <strong>No: ${pengembalian.nomorReferensi}</strong>
    </div>
    
    <!-- Content -->
    <div class="content">
        <p>Yang bertanda tangan di bawah ini, Pengurus ${namaKoperasi}, menerangkan bahwa:</p>
        
        <!-- Informasi Anggota -->
        <table class="info">
            <tr>
                <td>Nama</td>
                <td>${anggota.nama}</td>
            </tr>
            <tr>
                <td>NIK</td>
                <td>${anggota.nik}</td>
            </tr>
            <tr>
                <td>No. Kartu Anggota</td>
                <td>${anggota.noKartu || '-'}</td>
            </tr>
            <tr>
                <td>Departemen</td>
                <td>${anggota.departemen || '-'}</td>
            </tr>
            <tr>
                <td>Tanggal Keluar</td>
                <td>${tanggalKeluar}</td>
            </tr>
            <tr>
                <td>Alasan Keluar</td>
                <td>${anggota.alasanKeluar || '-'}</td>
            </tr>
        </table>
        
        <p>Telah mengundurkan diri sebagai anggota koperasi dan telah menerima pengembalian simpanan dengan rincian sebagai berikut:</p>
        
        <!-- Rincian Pengembalian -->
        <table class="info">
            <tr>
                <td>Simpanan Pokok</td>
                <td>Rp ${pengembalian.simpananPokok.toLocaleString('id-ID')}</td>
            </tr>
            <tr>
                <td>Simpanan Wajib</td>
                <td>Rp ${pengembalian.simpananWajib.toLocaleString('id-ID')}</td>
            </tr>
            <tr style="background-color: #e8f5e9;">
                <td><strong>Total Pengembalian</strong></td>
                <td><strong>Rp ${pengembalian.totalPengembalian.toLocaleString('id-ID')}</strong></td>
            </tr>
            <tr>
                <td>Metode Pembayaran</td>
                <td>${pengembalian.metodePembayaran}</td>
            </tr>
            <tr>
                <td>Tanggal Pembayaran</td>
                <td>${tanggalPembayaran}</td>
            </tr>
        </table>
        
        <p>Demikian surat keterangan ini dibuat untuk dapat dipergunakan sebagaimana mestinya.</p>
    </div>
    
    <!-- Tanda Tangan -->
    <div class="signatures">
        <div class="signature-box">
            <p>Yang Menerima,</p>
            <div class="signature-line">
                ${anggota.nama}
            </div>
        </div>
        <div class="signature-box">
            <p>Pengurus Koperasi,</p>
            <div class="signature-line">
                (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;)
            </div>
        </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
        <p>Dokumen ini dicetak pada: ${tanggalCetak}</p>
        <p>Referensi: ${pengembalian.nomorReferensi}</p>
        <p><em>Dokumen ini sah tanpa tanda tangan basah</em></p>
    </div>
</body>
</html>
        `;
        
        // Return success with HTML
        return {
            success: true,
            data: {
                anggotaId: anggotaId,
                pengembalianId: pengembalianId,
                anggotaNama: anggota.nama,
                nomorReferensi: pengembalian.nomorReferensi,
                html: suratHTML
            },
            message: 'Surat pengunduran diri berhasil dibuat'
        };
        
    } catch (error) {
        console.error('Error in generateSuratPengunduranDiri:', error);
        return {
            success: false,
            error: {
                code: 'SYSTEM_ERROR',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };
    }
}

/**
 * Handle cetak surat pengunduran diri action
 * @param {string} anggotaId - ID of the anggota
 */
function handleCetakSuratPengunduranDiri(anggotaId) {
    try {
        // Get anggota data
        const anggota = getAnggotaById(anggotaId);
        if (!anggota) {
            showToast('Anggota tidak ditemukan', 'error');
            return;
        }
        
        // Check if anggota has pengembalianId
        if (!anggota.pengembalianId) {
            showToast('Pengembalian belum diproses untuk anggota ini', 'warning');
            return;
        }
        
        // Show loading toast
        showToast('Membuat surat pengunduran diri...', 'info', 2000);
        
        // Generate surat
        const result = generateSuratPengunduranDiri(anggotaId, anggota.pengembalianId);
        
        if (!result.success) {
            showToast(result.error.message, 'error');
            return;
        }
        
        // Open in new window for printing
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            showToast('Popup diblokir. Mohon izinkan popup untuk mencetak surat.', 'error');
            return;
        }
        
        printWindow.document.write(result.data.html);
        printWindow.document.close();
        printWindow.focus();
        
        // Log audit action
        if (typeof logAnggotaKeluarAction === 'function') {
            logAnggotaKeluarAction('CETAK_SURAT_PENGUNDURAN_DIRI', {
                anggotaId: anggotaId,
                anggotaNama: anggota.nama,
                pengembalianId: anggota.pengembalianId,
                nomorReferensi: result.data.nomorReferensi
            });
        }
        
        // Show success toast
        showToast('Surat pengunduran diri berhasil dibuat', 'success');
        
    } catch (error) {
        console.error('Error in handleCetakSuratPengunduranDiri:', error);
        showToast('Terjadi kesalahan saat membuat surat', 'error');
    }
}

/**
 * Handle proses pengembalian from success modal
 * @param {string} anggotaId - ID of the anggota
 */
function handleProsesPengembalianFromSuccess(anggotaId) {
    // Close success modal
    const successModal = bootstrap.Modal.getInstance(document.getElementById('successAnggotaKeluarModal'));
    if (successModal) {
        successModal.hide();
    }
    
    // Show pengembalian modal
    setTimeout(() => {
        showPengembalianModal(anggotaId);
    }, 300);
}


/**
 * Show print options modal after pengembalian is processed
 * @param {string} anggotaId - ID of the anggota
 * @param {string} pengembalianId - ID of the pengembalian record
 * @param {string} nomorReferensi - Reference number
 */
function showPrintOptionsModal(anggotaId, pengembalianId, nomorReferensi) {
    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="printOptionsModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-printer me-2"></i>Opsi Cetak Dokumen
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-success">
                            <i class="bi bi-check-circle-fill me-2"></i>
                            Pengembalian simpanan berhasil diproses!
                        </div>
                        
                        <p><strong>Nomor Referensi:</strong> ${nomorReferensi}</p>
                        
                        <p>Pilih dokumen yang ingin dicetak:</p>
                        
                        <div class="d-grid gap-2">
                            <button type="button" class="btn btn-outline-primary btn-lg" 
                                    onclick="handleCetakBukti('${pengembalianId}'); bootstrap.Modal.getInstance(document.getElementById('printOptionsModal')).hide();">
                                <i class="bi bi-printer me-2"></i>Cetak Bukti Pengembalian
                                <br><small class="text-muted">Dokumen rincian pengembalian simpanan</small>
                            </button>
                            
                            <button type="button" class="btn btn-outline-success btn-lg" 
                                    onclick="handleCetakSuratPengunduranDiri('${anggotaId}'); bootstrap.Modal.getInstance(document.getElementById('printOptionsModal')).hide();">
                                <i class="bi bi-file-earmark-text me-2"></i>Cetak Surat Pengunduran Diri
                                <br><small class="text-muted">Surat keterangan resmi pengunduran diri</small>
                            </button>
                            
                            <button type="button" class="btn btn-outline-info btn-lg" 
                                    onclick="handleCetakKeduaDokumen('${anggotaId}', '${pengembalianId}'); bootstrap.Modal.getInstance(document.getElementById('printOptionsModal')).hide();">
                                <i class="bi bi-files me-2"></i>Cetak Kedua Dokumen
                                <br><small class="text-muted">Bukti pengembalian dan surat pengunduran diri</small>
                            </button>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-1"></i>Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('printOptionsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('printOptionsModal'));
    modal.show();
}

/**
 * Handle cetak kedua dokumen (bukti pengembalian dan surat pengunduran diri)
 * @param {string} anggotaId - ID of the anggota
 * @param {string} pengembalianId - ID of the pengembalian record
 */
function handleCetakKeduaDokumen(anggotaId, pengembalianId) {
    try {
        // Show loading toast
        showToast('Membuat dokumen...', 'info', 2000);
        
        // Print bukti pengembalian first
        setTimeout(() => {
            handleCetakBukti(pengembalianId);
        }, 500);
        
        // Print surat pengunduran diri after a delay
        setTimeout(() => {
            handleCetakSuratPengunduranDiri(anggotaId);
        }, 1500);
        
        // Show success message
        setTimeout(() => {
            showToast('Kedua dokumen berhasil dibuat', 'success');
        }, 2000);
        
    } catch (error) {
        console.error('Error in handleCetakKeduaDokumen:', error);
        showToast('Terjadi kesalahan saat membuat dokumen', 'error');
    }
}

// ===== Permanent Deletion UI Functions =====
// Feature: hapus-data-anggota-keluar-setelah-print

/**
 * Show delete confirmation modal
 * @param {string} anggotaId - ID of the anggota
 */
function showDeleteConfirmationModal(anggotaId) {
    // Validate deletion eligibility first
    const validation = validateDeletion(anggotaId);
    
    if (!validation.valid) {
        showToast(validation.error.message, 'error');
        return;
    }
    
    const anggota = validation.data;
    
    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="deleteConfirmModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title">⚠️ Konfirmasi Penghapusan Permanen</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-danger">
                            <strong>PERINGATAN:</strong> Data yang dihapus tidak dapat dipulihkan!
                        </div>
                        
                        <h6>Data yang akan dihapus:</h6>
                        <table class="table table-sm table-bordered">
                            <tr>
                                <td><strong>Nama:</strong></td>
                                <td>${anggota.anggotaNama}</td>
                            </tr>
                            <tr>
                                <td><strong>NIK:</strong></td>
                                <td>${anggota.anggotaNIK}</td>
                            </tr>
                        </table>
                        
                        <p class="mb-2"><strong>Data yang akan dihapus:</strong></p>
                        <ul class="small">
                            <li>Data anggota</li>
                            <li>Semua data simpanan (pokok, wajib, sukarela)</li>
                            <li>Transaksi POS terkait</li>
                            <li>Data pinjaman yang sudah lunas</li>
                            <li>Riwayat pembayaran hutang/piutang</li>
                        </ul>
                        
                        <p class="mb-2"><strong>Data yang TETAP tersimpan:</strong></p>
                        <ul class="small">
                            <li>Jurnal akuntansi</li>
                            <li>Data pengembalian simpanan</li>
                            <li>Audit log</li>
                        </ul>
                        
                        <div class="mt-3">
                            <label class="form-label">
                                Ketik <strong>HAPUS</strong> untuk konfirmasi:
                            </label>
                            <input type="text" class="form-control" id="deleteConfirmInput" 
                                   placeholder="Ketik HAPUS" autocomplete="off">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            Batal
                        </button>
                        <button type="button" class="btn btn-danger" id="btnConfirmDelete">
                            Hapus Permanen
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('deleteConfirmModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    modal.show();
    
    // Handle confirm button
    document.getElementById('btnConfirmDelete').addEventListener('click', function() {
        const confirmInput = document.getElementById('deleteConfirmInput').value;
        
        if (confirmInput !== 'HAPUS') {
            showToast('Ketik "HAPUS" untuk konfirmasi penghapusan', 'warning');
            return;
        }
        
        // Disable button to prevent double click
        this.disabled = true;
        this.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Menghapus...';
        
        // Execute deletion
        const result = deleteAnggotaKeluarPermanent(anggotaId);
        
        if (result.success) {
            modal.hide();
            showToast(result.message, 'success');
            
            // Refresh anggota keluar list
            if (typeof renderAnggotaKeluar === 'function') {
                renderAnggotaKeluar();
            }
            
            // Close detail modal if open
            const detailModal = document.getElementById('modalDetailAnggotaKeluar');
            if (detailModal) {
                const bsModal = bootstrap.Modal.getInstance(detailModal);
                if (bsModal) {
                    bsModal.hide();
                }
            }
        } else {
            showToast(result.error.message, 'error');
            this.disabled = false;
            this.innerHTML = 'Hapus Permanen';
        }
    });
}


/**
 * Render Anggota Keluar view using pengembalian data
 * Task 6.1: Get data from pengembalian table instead of anggota table
 */
function renderAnggotaKeluar() {
    const content = document.getElementById('mainContent');
    
    // Get data from pengembalian table (not anggota table) - Task 6.1
    const pengembalianList = JSON.parse(localStorage.getItem('pengembalian') || '[]');
    
    // Sort by tanggal keluar (newest first)
    pengembalianList.sort((a, b) => {
        const dateA = new Date(a.tanggalPembayaran || a.createdAt || 0);
        const dateB = new Date(b.tanggalPembayaran || b.createdAt || 0);
        return dateB - dateA;
    });
    
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 style="color: #2d6a4f; font-weight: 700;">
                <i class="bi bi-box-arrow-right me-2"></i>Anggota Keluar
            </h2>
            <span class="badge" style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); font-size: 1rem;">
                Total: ${pengembalianList.length} Anggota Keluar
            </span>
        </div>
        
        <!-- Filter dan Pencarian -->
        <div class="card mb-3">
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">
                            <i class="bi bi-search me-1"></i>Pencarian
                        </label>
                        <input type="text" class="form-control" id="searchAnggotaKeluar" 
                            placeholder="Cari NIK atau Nama..." 
                            onkeyup="filterAnggotaKeluar()">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">
                            <i class="bi bi-calendar-range me-1"></i>Tanggal Dari
                        </label>
                        <input type="date" class="form-control" id="filterTanggalKeluarDari" onchange="filterAnggotaKeluar()">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">
                            <i class="bi bi-calendar-range me-1"></i>Tanggal Sampai
                        </label>
                        <input type="date" class="form-control" id="filterTanggalKeluarSampai" onchange="filterAnggotaKeluar()">
                    </div>
                </div>
                <div class="mt-2">
                    <small class="text-muted">
                        <i class="bi bi-info-circle me-1"></i>
                        Menampilkan <strong id="countFilteredKeluar">${pengembalianList.length}</strong> dari <strong>${pengembalianList.length}</strong> anggota keluar
                    </small>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <i class="bi bi-table me-2"></i>Daftar Anggota Keluar (Riwayat Pengembalian)
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>NIK</th>
                                <th>Nama</th>
                                <th>Tanggal Pengembalian</th>
                                <th>Total Pengembalian</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="tbodyAnggotaKeluar">
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    // Render table - Task 6.2
    renderTableAnggotaKeluar(pengembalianList);
}

/**
 * Render table for Anggota Keluar using pengembalian data
 * Task 6.2: Use pengembalian data for rendering
 */
function renderTableAnggotaKeluar(data) {
    const tbody = document.getElementById('tbodyAnggotaKeluar');
    
    if (!tbody) return;
    
    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <i class="bi bi-inbox me-2"></i>Tidak ada data anggota keluar
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = data.map(p => {
        const statusBadge = p.status === 'Selesai' ? 
            '<span class="badge bg-success">Selesai</span>' : 
            '<span class="badge bg-warning">Diproses</span>';
        
        const totalPengembalian = (p.simpananPokok || 0) + 
                                 (p.simpananWajib || 0);
        
        const tanggalPengembalian = p.tanggalPembayaran || p.createdAt || '-';
        const tanggalDisplay = tanggalPengembalian !== '-' ? formatDateToDisplay(tanggalPengembalian) : '-';
        
        return `
            <tr>
                <td>${p.anggotaNIK || '-'}</td>
                <td>${p.anggotaNama || '-'}</td>
                <td>${tanggalDisplay}</td>
                <td>Rp ${totalPengembalian.toLocaleString('id-ID')}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="showDetailPengembalian('${p.id}')" title="Lihat Detail">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="cetakSuratPengunduranDiri('${p.id}')" title="Cetak Surat">
                        <i class="bi bi-printer"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Filter Anggota Keluar based on search and date range
 * Task 6.3: Filter pengembalian data instead of anggota data
 */
function filterAnggotaKeluar() {
    const pengembalianList = JSON.parse(localStorage.getItem('pengembalian') || '[]');
    const searchText = document.getElementById('searchAnggotaKeluar')?.value.toLowerCase() || '';
    const filterTanggalDari = document.getElementById('filterTanggalKeluarDari')?.value || '';
    const filterTanggalSampai = document.getElementById('filterTanggalKeluarSampai')?.value || '';
    
    let filtered = pengembalianList.filter(p => {
        // Search filter (NIK or Nama)
        const matchSearch = !searchText || 
            (p.anggotaNIK && p.anggotaNIK.toLowerCase().includes(searchText)) ||
            (p.anggotaNama && p.anggotaNama.toLowerCase().includes(searchText));
        
        // Date range filter
        let matchDateRange = true;
        if (filterTanggalDari || filterTanggalSampai) {
            const pengembalianDate = p.tanggalPembayaran || p.createdAt || '1900-01-01';
            
            if (filterTanggalDari && filterTanggalSampai) {
                matchDateRange = pengembalianDate >= filterTanggalDari && pengembalianDate <= filterTanggalSampai;
            } else if (filterTanggalDari) {
                matchDateRange = pengembalianDate >= filterTanggalDari;
            } else if (filterTanggalSampai) {
                matchDateRange = pengembalianDate <= filterTanggalSampai;
            }
        }
        
        return matchSearch && matchDateRange;
    });
    
    // Update count
    const countElement = document.getElementById('countFilteredKeluar');
    if (countElement) {
        countElement.textContent = filtered.length;
    }
    
    // Render filtered table
    renderTableAnggotaKeluar(filtered);
}

// ==================== WIZARD ANGGOTA KELUAR UI FUNCTIONS ====================
// Task 5: Implement Step 3 - Print Dokumen

/**
 * Generate printable documents for anggota keluar
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 * @param {string} anggotaId - ID of the anggota
 * @param {string} pengembalianId - ID of the pengembalian
 * @returns {object} Document references
 */
function generateDokumenAnggotaKeluar(anggotaId, pengembalianId) {
    try {
        // Get anggota data
        const anggota = getAnggotaById(anggotaId);
        if (!anggota) {
            throw new Error('Anggota tidak ditemukan');
        }
        
        // Get pengembalian data
        const pengembalianList = JSON.parse(localStorage.getItem('pengembalian') || '[]');
        const pengembalian = pengembalianList.find(p => p.id === pengembalianId);
        if (!pengembalian) {
            throw new Error('Data pengembalian tidak ditemukan');
        }
        
        const tanggalPrint = new Date().toISOString();
        const suratId = `SURAT-${Date.now()}`;
        const buktiId = `BUKTI-${Date.now()}`;
        
        // Requirement 4.1 & 4.3: Generate surat pengunduran diri
        const suratHTML = generateSuratPengunduranDiri(anggota, pengembalian, suratId);
        
        // Requirement 4.2 & 4.4: Generate bukti pencairan
        const buktiHTML = generateBuktiPencairan(anggota, pengembalian, buktiId);
        
        // Open print dialog for both documents
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Dokumen Anggota Keluar - ${anggota.nama}</title>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
                    <style>
                        @media print {
                            .page-break { page-break-after: always; }
                            .no-print { display: none; }
                        }
                        body { font-family: Arial, sans-serif; }
                        .document { padding: 40px; margin: 20px auto; max-width: 800px; }
                    </style>
                </head>
                <body>
                    <div class="no-print text-center mb-3">
                        <button class="btn btn-primary" onclick="window.print()">
                            <i class="bi bi-printer"></i> Cetak Dokumen
                        </button>
                        <button class="btn btn-secondary" onclick="window.close()">
                            <i class="bi bi-x-circle"></i> Tutup
                        </button>
                    </div>
                    ${suratHTML}
                    <div class="page-break"></div>
                    ${buktiHTML}
                </body>
                </html>
            `);
            printWindow.document.close();
        }
        
        // Requirement 4.5: Return document references
        return {
            suratId: suratId,
            buktiId: buktiId,
            tanggalPrint: tanggalPrint,
            printWindow: printWindow ? 'opened' : 'blocked'
        };
        
    } catch (error) {
        console.error('Error in generateDokumenAnggotaKeluar:', error);
        throw error;
    }
}

/**
 * Generate surat pengunduran diri HTML
 * @param {object} anggota - Anggota data
 * @param {object} pengembalian - Pengembalian data
 * @param {string} suratId - Surat ID
 * @returns {string} HTML string
 */
function generateSuratPengunduranDiri(anggota, pengembalian, suratId) {
    const tanggalSurat = formatDateToDisplay(new Date().toISOString().split('T')[0]);
    
    return `
        <div class="document">
            <div class="text-center mb-4">
                <h4>SURAT PENGUNDURAN DIRI</h4>
                <p class="mb-0">Nomor: ${suratId}</p>
            </div>
            
            <p>Yang bertanda tangan di bawah ini:</p>
            
            <table class="table table-borderless" style="width: 100%; max-width: 600px;">
                <tr>
                    <td width="150">NIK</td>
                    <td width="20">:</td>
                    <td>${anggota.nik}</td>
                </tr>
                <tr>
                    <td>Nama</td>
                    <td>:</td>
                    <td>${anggota.nama}</td>
                </tr>
                <tr>
                    <td>Alamat</td>
                    <td>:</td>
                    <td>${anggota.alamat || '-'}</td>
                </tr>
                <tr>
                    <td>Departemen</td>
                    <td>:</td>
                    <td>${anggota.departemen || '-'}</td>
                </tr>
            </table>
            
            <p class="mt-4">
                Dengan ini menyatakan mengundurkan diri sebagai anggota koperasi 
                terhitung sejak tanggal ${formatDateToDisplay(anggota.tanggalKeluar || new Date().toISOString().split('T')[0])}.
            </p>
            
            <p>
                <strong>Alasan pengunduran diri:</strong><br>
                ${anggota.alasanKeluar || '-'}
            </p>
            
            <p class="mt-4">
                Demikian surat pengunduran diri ini dibuat dengan sebenarnya.
            </p>
            
            <div class="row mt-5">
                <div class="col-6">
                    <p>Mengetahui,<br>Pengurus Koperasi</p>
                    <br><br><br>
                    <p>(_____________________)</p>
                </div>
                <div class="col-6 text-end">
                    <p>${tanggalSurat}<br>Yang Mengundurkan Diri</p>
                    <br><br><br>
                    <p>${anggota.nama}</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Generate bukti pencairan HTML
 * @param {object} anggota - Anggota data
 * @param {object} pengembalian - Pengembalian data
 * @param {string} buktiId - Bukti ID
 * @returns {string} HTML string
 */
function generateBuktiPencairan(anggota, pengembalian, buktiId) {
    const tanggalBukti = formatDateToDisplay(pengembalian.tanggalPembayaran || new Date().toISOString().split('T')[0]);
    
    return `
        <div class="document">
            <div class="text-center mb-4">
                <h4>BUKTI PENCAIRAN SIMPANAN</h4>
                <p class="mb-0">Nomor: ${buktiId}</p>
                <p class="mb-0">Referensi: ${pengembalian.nomorReferensi}</p>
            </div>
            
            <p>Telah diterima dari Koperasi:</p>
            
            <table class="table table-borderless" style="width: 100%; max-width: 600px;">
                <tr>
                    <td width="150">NIK</td>
                    <td width="20">:</td>
                    <td>${anggota.nik}</td>
                </tr>
                <tr>
                    <td>Nama</td>
                    <td>:</td>
                    <td>${anggota.nama}</td>
                </tr>
                <tr>
                    <td>Tanggal</td>
                    <td>:</td>
                    <td>${tanggalBukti}</td>
                </tr>
                <tr>
                    <td>Metode Pembayaran</td>
                    <td>:</td>
                    <td>${pengembalian.metodePembayaran}</td>
                </tr>
            </table>
            
            <h5 class="mt-4">Rincian Pencairan:</h5>
            <table class="table table-bordered">
                <thead class="table-light">
                    <tr>
                        <th>Jenis Simpanan</th>
                        <th class="text-end">Jumlah</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Simpanan Pokok</td>
                        <td class="text-end">Rp ${(pengembalian.simpananPokok || 0).toLocaleString('id-ID')}</td>
                    </tr>
                    <tr>
                        <td>Simpanan Wajib</td>
                        <td class="text-end">Rp ${(pengembalian.simpananWajib || 0).toLocaleString('id-ID')}</td>
                    </tr>
                    <tr>
                        <td>Simpanan Sukarela</td>
                        <td class="text-end">Rp ${(pengembalian.simpananSukarela || 0).toLocaleString('id-ID')}</td>
                    </tr>
                    <tr class="table-success">
                        <th>Total Pencairan</th>
                        <th class="text-end">Rp ${(pengembalian.totalPengembalian || 0).toLocaleString('id-ID')}</th>
                    </tr>
                </tbody>
            </table>
            
            ${pengembalian.keterangan ? `
            <p class="mt-3">
                <strong>Keterangan:</strong><br>
                ${pengembalian.keterangan}
            </p>
            ` : ''}
            
            <div class="row mt-5">
                <div class="col-6">
                    <p>Petugas Koperasi</p>
                    <br><br><br>
                    <p>(_____________________)</p>
                </div>
                <div class="col-6 text-end">
                    <p>Penerima</p>
                    <br><br><br>
                    <p>${anggota.nama}</p>
                </div>
            </div>
        </div>
    `;
}

// ==================== WIZARD UI COMPONENTS ====================
// Task 8: Implement wizard UI components

/**
 * Show wizard modal for anggota keluar process
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.4, 8.5
 * @param {string} anggotaId - ID of the anggota
 */
function showWizardAnggotaKeluar(anggotaId) {
    try {
        // Get anggota data
        const anggota = getAnggotaById(anggotaId);
        if (!anggota) {
            alert('Anggota tidak ditemukan');
            return;
        }
        
        // Create wizard instance
        window.currentWizard = new AnggotaKeluarWizard(anggotaId);
        
        // Create modal HTML
        const modalHTML = `
            <div class="modal fade" id="wizardAnggotaKeluarModal" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="bi bi-magic me-2"></i>Wizard Anggota Keluar - ${anggota.nama}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" onclick="confirmCancelWizard()"></button>
                        </div>
                        <div class="modal-body">
                            <!-- Step Indicator -->
                            <div id="wizardStepIndicator" class="mb-4">
                                ${window.currentWizard.renderStepIndicator()}
                            </div>
                            
                            <!-- Step Content -->
                            <div id="wizardStepContent">
                                ${renderWizardStepContent(1, anggotaId)}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <div id="wizardNavigationButtons">
                                ${window.currentWizard.renderNavigationButtons()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        const existingModal = document.getElementById('wizardAnggotaKeluarModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('wizardAnggotaKeluarModal'));
        modal.show();
        
    } catch (error) {
        console.error('Error in showWizardAnggotaKeluar:', error);
        alert('Gagal membuka wizard: ' + error.message);
    }
}

/**
 * Render wizard step content based on current step
 * @param {number} stepNumber - Current step number (1-5)
 * @param {string} anggotaId - ID of the anggota
 * @returns {string} HTML for step content
 */
function renderWizardStepContent(stepNumber, anggotaId) {
    switch (stepNumber) {
        case 1:
            return renderStep1Validasi(anggotaId);
        case 2:
            return renderStep2Pencairan(anggotaId);
        case 3:
            return renderStep3Print(anggotaId);
        case 4:
            return renderStep4Update(anggotaId);
        case 5:
            return renderStep5Verifikasi(anggotaId);
        default:
            return '<div class="alert alert-danger">Step tidak valid</div>';
    }
}

/**
 * Render Step 1: Validasi Hutang/Piutang
 * @param {string} anggotaId - ID of the anggota
 * @returns {string} HTML for step 1
 */
function renderStep1Validasi(anggotaId) {
    const anggota = getAnggotaById(anggotaId);
    
    return `
        <div class="step-content">
            <h4 class="mb-3">
                <i class="bi bi-shield-check me-2"></i>Step 1: Validasi Hutang/Piutang
            </h4>
            
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                Sistem akan memeriksa apakah anggota memiliki kewajiban finansial yang belum diselesaikan.
            </div>
            
            <div class="card mb-3">
                <div class="card-header bg-light">
                    <strong>Informasi Anggota</strong>
                </div>
                <div class="card-body">
                    <table class="table table-sm table-borderless">
                        <tr>
                            <td width="150"><strong>NIK</strong></td>
                            <td>: ${anggota.nik}</td>
                        </tr>
                        <tr>
                            <td><strong>Nama</strong></td>
                            <td>: ${anggota.nama}</td>
                        </tr>
                        <tr>
                            <td><strong>Departemen</strong></td>
                            <td>: ${anggota.departemen || '-'}</td>
                        </tr>
                    </table>
                </div>
            </div>
            
            <div id="validationResult" class="mt-3">
                <div class="text-center">
                    <button type="button" class="btn btn-primary btn-lg" onclick="executeStep1Validation()">
                        <i class="bi bi-play-circle me-2"></i>Mulai Validasi
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render Step 2: Pencairan Simpanan
 * @param {string} anggotaId - ID of the anggota
 * @returns {string} HTML for step 2
 */
function renderStep2Pencairan(anggotaId) {
    const calculation = hitungTotalSimpanan(anggotaId);
    
    if (!calculation.success) {
        return `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Gagal menghitung simpanan: ${calculation.error}
            </div>
        `;
    }
    
    const data = calculation.data;
    
    return `
        <div class="step-content">
            <h4 class="mb-3">
                <i class="bi bi-cash-coin me-2"></i>Step 2: Pencairan Simpanan
            </h4>
            
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                Sistem akan memproses pencairan simpanan dan membuat jurnal accounting otomatis.
            </div>
            
            <div class="card mb-3">
                <div class="card-header bg-light">
                    <strong>Rincian Simpanan</strong>
                </div>
                <div class="card-body">
                    <table class="table table-sm">
                        <tr>
                            <td width="200"><strong>Simpanan Pokok</strong></td>
                            <td class="text-end">Rp ${data.simpananPokok.toLocaleString('id-ID')}</td>
                        </tr>
                        <tr>
                            <td><strong>Simpanan Wajib</strong></td>
                            <td class="text-end">Rp ${data.simpananWajib.toLocaleString('id-ID')}</td>
                        </tr>
                        <tr>
                            <td><strong>Simpanan Sukarela</strong></td>
                            <td class="text-end">Rp ${data.simpananSukarela.toLocaleString('id-ID')}</td>
                        </tr>
                        <tr class="table-success">
                            <td><strong>Total Simpanan</strong></td>
                            <td class="text-end"><h5 class="mb-0">Rp ${data.totalSimpanan.toLocaleString('id-ID')}</h5></td>
                        </tr>
                    </table>
                </div>
            </div>
            
            <div class="card mb-3">
                <div class="card-header bg-light">
                    <strong>Saldo Kas/Bank Saat Ini</strong>
                </div>
                <div class="card-body">
                    <table class="table table-sm table-borderless">
                        <tr>
                            <td width="200"><strong>Saldo Kas</strong></td>
                            <td class="text-end">Rp ${data.kasBalance.toLocaleString('id-ID')}</td>
                        </tr>
                        <tr>
                            <td><strong>Saldo Bank</strong></td>
                            <td class="text-end">Rp ${data.bankBalance.toLocaleString('id-ID')}</td>
                        </tr>
                        <tr class="table-info">
                            <td><strong>Total Tersedia</strong></td>
                            <td class="text-end"><strong>Rp ${data.totalAvailable.toLocaleString('id-ID')}</strong></td>
                        </tr>
                    </table>
                </div>
            </div>
            
            <form id="formPencairanSimpanan">
                <div class="mb-3">
                    <label for="metodePembayaran" class="form-label">
                        Metode Pembayaran <span class="text-danger">*</span>
                    </label>
                    <select class="form-select" id="metodePembayaran" required>
                        <option value="">-- Pilih Metode --</option>
                        <option value="Kas">Kas</option>
                        <option value="Transfer Bank">Transfer Bank</option>
                    </select>
                </div>
                
                <div class="mb-3">
                    <label for="tanggalPembayaran" class="form-label">
                        Tanggal Pembayaran <span class="text-danger">*</span>
                    </label>
                    <input type="date" class="form-control" id="tanggalPembayaran" 
                           value="${getCurrentDateISO()}" max="${getCurrentDateISO()}" required>
                </div>
                
                <div class="mb-3">
                    <label for="keteranganPencairan" class="form-label">
                        Keterangan (Opsional)
                    </label>
                    <textarea class="form-control" id="keteranganPencairan" rows="2" 
                              placeholder="Catatan tambahan"></textarea>
                </div>
                
                <div class="text-center">
                    <button type="button" class="btn btn-primary btn-lg" onclick="executeStep2Pencairan()">
                        <i class="bi bi-check-circle me-2"></i>Proses Pencairan
                    </button>
                </div>
            </form>
        </div>
    `;
}

/**
 * Render Step 3: Print Dokumen
 * @param {string} anggotaId - ID of the anggota
 * @returns {string} HTML for step 3
 */
function renderStep3Print(anggotaId) {
    const anggota = getAnggotaById(anggotaId);
    
    return `
        <div class="step-content">
            <h4 class="mb-3">
                <i class="bi bi-printer me-2"></i>Step 3: Print Dokumen
            </h4>
            
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                Sistem akan mencetak surat pengunduran diri dan bukti pencairan simpanan.
            </div>
            
            <div class="card mb-3">
                <div class="card-header bg-light">
                    <strong>Dokumen yang Akan Dicetak</strong>
                </div>
                <div class="card-body">
                    <div class="list-group">
                        <div class="list-group-item">
                            <div class="d-flex w-100 justify-content-between">
                                <h6 class="mb-1">
                                    <i class="bi bi-file-earmark-text me-2"></i>Surat Pengunduran Diri
                                </h6>
                            </div>
                            <p class="mb-1 text-muted">Dokumen resmi pengunduran diri dari koperasi</p>
                        </div>
                        <div class="list-group-item">
                            <div class="d-flex w-100 justify-content-between">
                                <h6 class="mb-1">
                                    <i class="bi bi-receipt me-2"></i>Bukti Pencairan Simpanan
                                </h6>
                            </div>
                            <p class="mb-1 text-muted">Rincian lengkap pencairan simpanan</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="text-center">
                <button type="button" class="btn btn-primary btn-lg" onclick="executeStep3Print()">
                    <i class="bi bi-printer me-2"></i>Cetak Dokumen
                </button>
            </div>
            
            <div id="printResult" class="mt-3"></div>
        </div>
    `;
}

/**
 * Render Step 4: Update Status
 * @param {string} anggotaId - ID of the anggota
 * @returns {string} HTML for step 4
 */
function renderStep4Update(anggotaId) {
    const anggota = getAnggotaById(anggotaId);
    
    return `
        <div class="step-content">
            <h4 class="mb-3">
                <i class="bi bi-person-check me-2"></i>Step 4: Update Status Anggota
            </h4>
            
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                Sistem akan mengupdate status anggota menjadi "Keluar" dan menyimpan informasi terkait.
            </div>
            
            <form id="formUpdateStatus">
                <div class="mb-3">
                    <label for="tanggalKeluar" class="form-label">
                        Tanggal Keluar <span class="text-danger">*</span>
                    </label>
                    <input type="date" class="form-control" id="tanggalKeluar" 
                           value="${getCurrentDateISO()}" max="${getCurrentDateISO()}" required>
                </div>
                
                <div class="mb-3">
                    <label for="alasanKeluar" class="form-label">
                        Alasan Keluar <span class="text-danger">*</span>
                    </label>
                    <textarea class="form-control" id="alasanKeluar" rows="3" 
                              placeholder="Masukkan alasan anggota keluar dari koperasi" required></textarea>
                    <div class="form-text">Minimal 10 karakter</div>
                </div>
                
                <div class="text-center">
                    <button type="button" class="btn btn-primary btn-lg" onclick="executeStep4Update()">
                        <i class="bi bi-check-circle me-2"></i>Update Status
                    </button>
                </div>
            </form>
        </div>
    `;
}

/**
 * Render Step 5: Verifikasi Accounting
 * @param {string} anggotaId - ID of the anggota
 * @returns {string} HTML for step 5
 */
function renderStep5Verifikasi(anggotaId) {
    return `
        <div class="step-content">
            <h4 class="mb-3">
                <i class="bi bi-calculator me-2"></i>Step 5: Verifikasi Accounting
            </h4>
            
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                Sistem akan memverifikasi bahwa semua jurnal tercatat dengan benar dan tidak ada selisih keuangan.
            </div>
            
            <div class="card mb-3">
                <div class="card-header bg-light">
                    <strong>Pemeriksaan yang Akan Dilakukan</strong>
                </div>
                <div class="card-body">
                    <ul class="list-unstyled mb-0">
                        <li class="mb-2">
                            <i class="bi bi-check-circle text-primary me-2"></i>
                            Semua jurnal pencairan tercatat
                        </li>
                        <li class="mb-2">
                            <i class="bi bi-check-circle text-primary me-2"></i>
                            Total debit sama dengan total kredit
                        </li>
                        <li class="mb-2">
                            <i class="bi bi-check-circle text-primary me-2"></i>
                            Total pencairan sesuai dengan jurnal
                        </li>
                        <li class="mb-2">
                            <i class="bi bi-check-circle text-primary me-2"></i>
                            Saldo kas/bank mencukupi
                        </li>
                    </ul>
                </div>
            </div>
            
            <div id="verificationResult" class="mt-3">
                <div class="text-center">
                    <button type="button" class="btn btn-primary btn-lg" onclick="executeStep5Verification()">
                        <i class="bi bi-play-circle me-2"></i>Mulai Verifikasi
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ==================== WIZARD STEP EXECUTION HANDLERS ====================

/**
 * Execute Step 1: Validation
 */
async function executeStep1Validation() {
    try {
        const resultDiv = document.getElementById('validationResult');
        resultDiv.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Memvalidasi...</p></div>';
        
        const result = await window.currentWizard.executeStep1Validation();
        
        if (result.valid) {
            resultDiv.innerHTML = `
                <div class="alert alert-success">
                    <i class="bi bi-check-circle me-2"></i>
                    <strong>Validasi Berhasil!</strong><br>
                    ${result.message}
                </div>
            `;
            
            // Update navigation buttons
            updateWizardUI();
        } else {
            let errorHTML = `
                <div class="alert alert-danger">
                    <h6 class="alert-heading">
                        <i class="bi bi-exclamation-triangle me-2"></i>Validasi Gagal
                    </h6>
                    <p class="mb-2">${result.error.message}</p>
            `;
            
            if (result.error.details) {
                const details = result.error.details;
                errorHTML += '<hr><strong>Detail:</strong><ul class="mb-0">';
                
                if (details.pinjamanCount > 0) {
                    errorHTML += `<li>Pinjaman Aktif: ${details.pinjamanCount} (Total: Rp ${details.totalPinjaman.toLocaleString('id-ID')})</li>`;
                }
                if (details.piutangCount > 0) {
                    errorHTML += `<li>Piutang Aktif: ${details.piutangCount} (Total: Rp ${details.totalPiutang.toLocaleString('id-ID')})</li>`;
                }
                
                errorHTML += '</ul>';
            }
            
            errorHTML += '</div>';
            resultDiv.innerHTML = errorHTML;
        }
        
    } catch (error) {
        console.error('Error in executeStep1Validation:', error);
        document.getElementById('validationResult').innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-x-circle me-2"></i>
                Error: ${error.message}
            </div>
        `;
    }
}

/**
 * Execute Step 2: Pencairan
 */
async function executeStep2Pencairan() {
    try {
        const form = document.getElementById('formPencairanSimpanan');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const metodePembayaran = document.getElementById('metodePembayaran').value;
        const tanggalPembayaran = document.getElementById('tanggalPembayaran').value;
        const keterangan = document.getElementById('keteranganPencairan').value;
        
        // Disable form
        const submitBtn = event.target;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Memproses...';
        
        const result = await window.currentWizard.executeStep2Pencairan(metodePembayaran, tanggalPembayaran, keterangan);
        
        if (result.success) {
            // Show success message
            form.innerHTML = `
                <div class="alert alert-success">
                    <i class="bi bi-check-circle me-2"></i>
                    <strong>Pencairan Berhasil!</strong><br>
                    ${result.message}<br>
                    <small>Pengembalian ID: ${result.data.pengembalianId}</small>
                </div>
            `;
            
            // Update navigation buttons
            updateWizardUI();
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Proses Pencairan';
            
            alert('Gagal memproses pencairan: ' + result.error);
        }
        
    } catch (error) {
        console.error('Error in executeStep2Pencairan:', error);
        alert('Error: ' + error.message);
    }
}

/**
 * Execute Step 3: Print
 */
async function executeStep3Print() {
    try {
        const resultDiv = document.getElementById('printResult');
        resultDiv.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Menyiapkan dokumen...</p></div>';
        
        const result = await window.currentWizard.executeStep3Print();
        
        if (result.success) {
            resultDiv.innerHTML = `
                <div class="alert alert-success">
                    <i class="bi bi-check-circle me-2"></i>
                    <strong>Dokumen Berhasil Dicetak!</strong><br>
                    Silakan periksa jendela print yang terbuka.
                </div>
            `;
            
            // Update navigation buttons
            updateWizardUI();
        } else {
            resultDiv.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-x-circle me-2"></i>
                    Gagal mencetak dokumen: ${result.error}
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error in executeStep3Print:', error);
        document.getElementById('printResult').innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-x-circle me-2"></i>
                Error: ${error.message}
            </div>
        `;
    }
}

/**
 * Execute Step 4: Update Status
 */
async function executeStep4Update() {
    try {
        const form = document.getElementById('formUpdateStatus');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const tanggalKeluar = document.getElementById('tanggalKeluar').value;
        const alasanKeluar = document.getElementById('alasanKeluar').value;
        
        if (alasanKeluar.trim().length < 10) {
            alert('Alasan keluar minimal 10 karakter');
            return;
        }
        
        // Disable form
        const submitBtn = event.target;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Memproses...';
        
        const result = await window.currentWizard.executeStep4Update(tanggalKeluar, alasanKeluar);
        
        if (result.success) {
            // Show success message
            form.innerHTML = `
                <div class="alert alert-success">
                    <i class="bi bi-check-circle me-2"></i>
                    <strong>Status Berhasil Diupdate!</strong><br>
                    ${result.message}
                </div>
            `;
            
            // Update navigation buttons
            updateWizardUI();
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Update Status';
            
            alert('Gagal mengupdate status: ' + result.error);
        }
        
    } catch (error) {
        console.error('Error in executeStep4Update:', error);
        alert('Error: ' + error.message);
    }
}

/**
 * Execute Step 5: Verification
 */
async function executeStep5Verification() {
    try {
        const resultDiv = document.getElementById('verificationResult');
        resultDiv.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Memverifikasi...</p></div>';
        
        const result = await window.currentWizard.executeStep5Verification();
        
        if (result.valid) {
            let detailsHTML = '';
            if (result.details) {
                detailsHTML = `
                    <hr>
                    <strong>Detail Verifikasi:</strong>
                    <ul class="mb-0">
                        <li>Jurnal: ${result.details.jurnalCount.found}/${result.details.jurnalCount.expected} tercatat</li>
                        <li>Balance: Debit Rp ${result.details.balance.debit.toLocaleString('id-ID')} = Kredit Rp ${result.details.balance.kredit.toLocaleString('id-ID')}</li>
                        <li>Pencairan: Rp ${result.details.amounts.pencairan.toLocaleString('id-ID')} = Jurnal Rp ${result.details.amounts.jurnal.toLocaleString('id-ID')}</li>
                        <li>Saldo Kas: Rp ${result.details.balances.kas.toLocaleString('id-ID')}</li>
                        <li>Saldo Bank: Rp ${result.details.balances.bank.toLocaleString('id-ID')}</li>
                    </ul>
                `;
            }
            
            resultDiv.innerHTML = `
                <div class="alert alert-success">
                    <i class="bi bi-check-circle me-2"></i>
                    <strong>Verifikasi Berhasil!</strong><br>
                    ${result.message}
                    ${detailsHTML}
                </div>
            `;
            
            // Update navigation buttons
            updateWizardUI();
        } else {
            let errorHTML = `
                <div class="alert alert-danger">
                    <h6 class="alert-heading">
                        <i class="bi bi-exclamation-triangle me-2"></i>Verifikasi Gagal
                    </h6>
                    <p class="mb-2">${result.error.message}</p>
            `;
            
            if (result.error.errors && result.error.errors.length > 0) {
                errorHTML += '<hr><strong>Error:</strong><ul class="mb-0">';
                result.error.errors.forEach(err => {
                    errorHTML += `<li>${err.message}</li>`;
                });
                errorHTML += '</ul>';
            }
            
            errorHTML += '</div>';
            resultDiv.innerHTML = errorHTML;
        }
        
    } catch (error) {
        console.error('Error in executeStep5Verification:', error);
        document.getElementById('verificationResult').innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-x-circle me-2"></i>
                Error: ${error.message}
            </div>
        `;
    }
}

// ==================== WIZARD NAVIGATION AND UTILITIES ====================

/**
 * Update wizard UI (step indicator and navigation buttons)
 */
function updateWizardUI() {
    // Update step indicator
    const stepIndicatorDiv = document.getElementById('wizardStepIndicator');
    if (stepIndicatorDiv && window.currentWizard) {
        stepIndicatorDiv.innerHTML = window.currentWizard.renderStepIndicator();
    }
    
    // Update navigation buttons
    const navButtonsDiv = document.getElementById('wizardNavigationButtons');
    if (navButtonsDiv && window.currentWizard) {
        navButtonsDiv.innerHTML = window.currentWizard.renderNavigationButtons();
    }
}

/**
 * Navigate to next step
 */
function wizardNextStep() {
    if (!window.currentWizard) return;
    
    const result = window.currentWizard.nextStep();
    if (result.success) {
        // Render new step content
        const contentDiv = document.getElementById('wizardStepContent');
        if (contentDiv) {
            contentDiv.innerHTML = renderWizardStepContent(
                window.currentWizard.currentStep,
                window.currentWizard.anggotaId
            );
        }
        
        // Update UI
        updateWizardUI();
    } else {
        alert(result.error);
    }
}

/**
 * Navigate to previous step
 */
function wizardPreviousStep() {
    if (!window.currentWizard) return;
    
    const result = window.currentWizard.previousStep();
    if (result.success) {
        // Render new step content
        const contentDiv = document.getElementById('wizardStepContent');
        if (contentDiv) {
            contentDiv.innerHTML = renderWizardStepContent(
                window.currentWizard.currentStep,
                window.currentWizard.anggotaId
            );
        }
        
        // Update UI
        updateWizardUI();
    } else {
        alert(result.error);
    }
}

/**
 * Complete wizard
 */
function completeWizard() {
    if (!window.currentWizard) return;
    
    const result = window.currentWizard.complete();
    if (result.success) {
        // Show success message
        const modal = bootstrap.Modal.getInstance(document.getElementById('wizardAnggotaKeluarModal'));
        if (modal) {
            modal.hide();
        }
        
        // Show success notification
        alert('Wizard berhasil diselesaikan! Anggota telah diproses keluar dari koperasi.');
        
        // Refresh page or update UI
        if (typeof renderLaporanAnggotaKeluar === 'function') {
            const contentArea = document.getElementById('content-area');
            if (contentArea) {
                contentArea.innerHTML = renderLaporanAnggotaKeluar();
            }
        } else {
            location.reload();
        }
    } else {
        alert('Gagal menyelesaikan wizard: ' + result.error);
    }
}

/**
 * Confirm cancel wizard (Requirement 8.5)
 */
function confirmCancelWizard() {
    if (!window.currentWizard) return;
    
    const confirmed = confirm(
        'Apakah Anda yakin ingin membatalkan proses wizard?\n\n' +
        'Semua progress yang belum disimpan akan hilang.'
    );
    
    if (confirmed) {
        const result = window.currentWizard.cancel('User cancelled');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('wizardAnggotaKeluarModal'));
        if (modal) {
            modal.hide();
        }
        
        // Clean up
        window.currentWizard = null;
    }
}

// ==================== WIZARD CSS STYLES ====================

/**
 * Inject wizard CSS styles into the page
 */
function injectWizardStyles() {
    // Check if styles already injected
    if (document.getElementById('wizardStyles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'wizardStyles';
    styleElement.textContent = `
        /* Wizard Step Indicator */
        .wizard-step-indicator {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 0;
            margin-bottom: 20px;
        }
        
        .wizard-step {
            flex: 1;
            text-align: center;
            position: relative;
        }
        
        .wizard-step .step-icon {
            font-size: 2rem;
            margin-bottom: 8px;
        }
        
        .wizard-step .step-label {
            font-size: 0.9rem;
            font-weight: 500;
        }
        
        .wizard-step.completed .step-icon {
            color: #28a745;
        }
        
        .wizard-step.completed .step-label {
            color: #28a745;
        }
        
        .wizard-step.active .step-icon {
            color: #007bff;
        }
        
        .wizard-step.active .step-label {
            color: #007bff;
            font-weight: 600;
        }
        
        .wizard-step.pending .step-icon {
            color: #6c757d;
        }
        
        .wizard-step.pending .step-label {
            color: #6c757d;
        }
        
        .step-arrow {
            flex: 0 0 30px;
            text-align: center;
            color: #dee2e6;
            font-size: 1.5rem;
        }
        
        /* Wizard Navigation Buttons */
        .wizard-navigation-buttons {
            width: 100%;
        }
        
        /* Step Content */
        .step-content {
            min-height: 400px;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .wizard-step-indicator {
                flex-direction: column;
            }
            
            .wizard-step {
                margin-bottom: 15px;
            }
            
            .step-arrow {
                transform: rotate(90deg);
                margin: 10px 0;
            }
        }
    `;
    
    document.head.appendChild(styleElement);
}

// Inject styles when this script loads
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectWizardStyles);
    } else {
        injectWizardStyles();
    }
}

// ==================== ANGGOTA KELUAR PAGE RENDERING ====================
// Task 11: Integrate wizard with anggota keluar menu

/**
 * Render Anggota Keluar Page
 * Main page for managing member exits with wizard integration
 */
function renderAnggotaKeluarPage() {
    const content = document.getElementById('mainContent');
    
    // Get all anggota
    const anggotaList = JSON.parse(localStorage.getItem('anggota') || '[]');
    
    // Separate active and keluar anggota
    const anggotaAktif = anggotaList.filter(a => 
        a.status === 'Aktif' && 
        (!a.pengembalianStatus || a.pengembalianStatus === '')
    );
    
    const anggotaKeluar = anggotaList.filter(a => 
        a.status === 'Nonaktif' || 
        a.pengembalianStatus === 'Pending' || 
        a.pengembalianStatus === 'Selesai'
    );
    
    content.innerHTML = `
        <div class="container-fluid">
            <div class="row mb-4">
                <div class="col-12">
                    <h2 style="color: #2d6a4f; font-weight: 700;">
                        <i class="bi bi-box-arrow-right me-2"></i>Manajemen Anggota Keluar
                    </h2>
                    <p class="text-muted">Kelola proses anggota keluar dari koperasi dengan wizard 5 langkah</p>
                </div>
            </div>
            
            <!-- Summary Cards -->
            <div class="row mb-4">
                <div class="col-md-4">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <h6 class="card-title">Anggota Aktif</h6>
                            <h3 class="mb-0">${anggotaAktif.length}</h3>
                            <small>Dapat diproses keluar</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-warning text-dark">
                        <div class="card-body">
                            <h6 class="card-title">Pending Pengembalian</h6>
                            <h3 class="mb-0">${anggotaKeluar.filter(a => a.pengembalianStatus === 'Pending').length}</h3>
                            <small>Menunggu proses pengembalian</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <h6 class="card-title">Selesai</h6>
                            <h3 class="mb-0">${anggotaKeluar.filter(a => a.pengembalianStatus === 'Selesai').length}</h3>
                            <small>Proses keluar selesai</small>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Tabs -->
            <ul class="nav nav-tabs mb-3" id="anggotaKeluarTabs" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active" id="aktif-tab" data-bs-toggle="tab" data-bs-target="#aktif" type="button" role="tab">
                        <i class="bi bi-people me-1"></i>Anggota Aktif (${anggotaAktif.length})
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link" id="keluar-tab" data-bs-toggle="tab" data-bs-target="#keluar" type="button" role="tab">
                        <i class="bi bi-box-arrow-right me-1"></i>Anggota Keluar (${anggotaKeluar.length})
                    </button>
                </li>
            </ul>
            
            <!-- Tab Content -->
            <div class="tab-content" id="anggotaKeluarTabContent">
                <!-- Anggota Aktif Tab -->
                <div class="tab-pane fade show active" id="aktif" role="tabpanel">
                    <div class="card">
                        <div class="card-header bg-primary text-white">
                            <i class="bi bi-people me-2"></i>Daftar Anggota Aktif
                        </div>
                        <div class="card-body">
                            ${anggotaAktif.length === 0 ? `
                                <div class="alert alert-info text-center">
                                    <i class="bi bi-info-circle me-2"></i>
                                    Tidak ada anggota aktif.
                                </div>
                            ` : `
                                <div class="table-responsive">
                                    <table class="table table-striped table-hover">
                                        <thead class="table-dark">
                                            <tr>
                                                <th>No</th>
                                                <th>NIK</th>
                                                <th>Nama</th>
                                                <th>Departemen</th>
                                                <th>Tipe</th>
                                                <th>Status</th>
                                                <th>Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${anggotaAktif.map((anggota, index) => `
                                                <tr>
                                                    <td>${index + 1}</td>
                                                    <td>${anggota.nik}</td>
                                                    <td>${anggota.nama}</td>
                                                    <td>${anggota.departemen || '-'}</td>
                                                    <td>${anggota.tipeAnggota || 'Umum'}</td>
                                                    <td><span class="badge bg-success">Aktif</span></td>
                                                    <td>
                                                        <button class="btn btn-sm btn-warning" 
                                                                onclick="showWizardAnggotaKeluar('${anggota.id}')"
                                                                title="Proses Keluar dengan Wizard">
                                                            <i class="bi bi-magic me-1"></i>Proses Keluar (Wizard)
                                                        </button>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
                
                <!-- Anggota Keluar Tab -->
                <div class="tab-pane fade" id="keluar" role="tabpanel">
                    <div class="card">
                        <div class="card-header bg-warning text-dark">
                            <i class="bi bi-box-arrow-right me-2"></i>Daftar Anggota Keluar
                        </div>
                        <div class="card-body">
                            ${anggotaKeluar.length === 0 ? `
                                <div class="alert alert-info text-center">
                                    <i class="bi bi-info-circle me-2"></i>
                                    Tidak ada anggota keluar.
                                </div>
                            ` : `
                                <div class="table-responsive">
                                    <table class="table table-striped table-hover">
                                        <thead class="table-dark">
                                            <tr>
                                                <th>No</th>
                                                <th>NIK</th>
                                                <th>Nama</th>
                                                <th>Departemen</th>
                                                <th>Tanggal Keluar</th>
                                                <th>Status Pengembalian</th>
                                                <th>Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${anggotaKeluar.map((anggota, index) => `
                                                <tr>
                                                    <td>${index + 1}</td>
                                                    <td>${anggota.nik}</td>
                                                    <td>${anggota.nama}</td>
                                                    <td>${anggota.departemen || '-'}</td>
                                                    <td>${anggota.tanggalKeluar ? formatDateToDisplay(anggota.tanggalKeluar) : '-'}</td>
                                                    <td>
                                                        ${anggota.pengembalianStatus === 'Selesai' 
                                                            ? '<span class="badge bg-success">Selesai</span>'
                                                            : anggota.pengembalianStatus === 'Pending'
                                                            ? '<span class="badge bg-warning">Pending</span>'
                                                            : '<span class="badge bg-secondary">-</span>'
                                                        }
                                                    </td>
                                                    <td>
                                                        ${anggota.pengembalianStatus === 'Pending' ? `
                                                            <button class="btn btn-sm btn-primary" 
                                                                    onclick="showWizardAnggotaKeluar('${anggota.id}')"
                                                                    title="Lanjutkan Proses dengan Wizard">
                                                                <i class="bi bi-play-circle me-1"></i>Lanjutkan
                                                            </button>
                                                        ` : anggota.pengembalianStatus === 'Selesai' ? `
                                                            <button class="btn btn-sm btn-info" 
                                                                    onclick="handleCetakBuktiAnggotaKeluar('${anggota.id}')"
                                                                    title="Cetak Bukti">
                                                                <i class="bi bi-printer me-1"></i>Cetak
                                                            </button>
                                                        ` : `
                                                            <button class="btn btn-sm btn-warning" 
                                                                    onclick="showWizardAnggotaKeluar('${anggota.id}')"
                                                                    title="Proses dengan Wizard">
                                                                <i class="bi bi-magic me-1"></i>Proses
                                                            </button>
                                                        `}
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Info Card -->
            <div class="row mt-4">
                <div class="col-12">
                    <div class="card border-info">
                        <div class="card-header bg-info text-white">
                            <i class="bi bi-info-circle me-2"></i>Tentang Wizard Anggota Keluar
                        </div>
                        <div class="card-body">
                            <h6>Wizard 5 Langkah untuk Proses Anggota Keluar:</h6>
                            <ol class="mb-0">
                                <li><strong>Validasi Hutang/Piutang</strong> - Memastikan tidak ada pinjaman atau hutang aktif</li>
                                <li><strong>Pencairan Simpanan</strong> - Menghitung dan memproses pengembalian simpanan</li>
                                <li><strong>Print Dokumen</strong> - Mencetak surat pengunduran diri dan bukti pencairan</li>
                                <li><strong>Update Status</strong> - Mengubah status anggota menjadi keluar</li>
                                <li><strong>Verifikasi Accounting</strong> - Memverifikasi semua jurnal tercatat dengan benar</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
