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
    
    // Check if already keluar
    if (anggota.statusKeanggotaan === 'Keluar') {
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
                                                            <button class="btn btn-sm btn-primary" 
                                                                    onclick="handleCetakBukti('${anggota.pengembalianId}')"
                                                                    title="Cetak Bukti Pengembalian">
                                                                <i class="bi bi-printer"></i>
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
                
                // Ask if want to print bukti
                setTimeout(() => {
                    confirmAction(
                        'Cetak Bukti Pengembalian',
                        `<p>Apakah Anda ingin mencetak bukti pengembalian?</p>
                         <p class="mb-0"><small>Nomor Referensi: <strong>${result.data.nomorReferensi}</strong></small></p>`,
                        () => {
                            handleCetakBukti(result.data.pengembalianId);
                        },
                        {
                            confirmText: 'Ya, Cetak Bukti',
                            cancelText: 'Tidak',
                            type: 'info'
                        }
                    );
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
