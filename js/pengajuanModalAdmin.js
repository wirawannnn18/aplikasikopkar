// Pengajuan Modal Admin UI Module

/**
 * Render halaman kelola pengajuan modal untuk admin
 */
function renderKelolaPengajuanModal() {
    const content = document.getElementById('mainContent');
    
    if (!currentUser || !['admin', 'administrator', 'super_admin'].includes(currentUser.role)) {
        content.innerHTML = '<div class="alert alert-danger">Anda tidak memiliki akses ke halaman ini</div>';
        return;
    }
    
    // Get pending pengajuan
    const pendingList = getPengajuanPending();
    
    content.innerHTML = `
        <div class="container-fluid">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2><i class="bi bi-clipboard-check me-2"></i>Kelola Pengajuan Modal</h2>
                <span class="badge bg-warning text-dark" style="font-size: 1.2rem;">
                    ${pendingList.length} Pending
                </span>
            </div>
            
            <!-- Filter Section -->
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-3">
                            <label class="form-label">Filter Status</label>
                            <select class="form-select" id="filterStatusAdmin" onchange="filterPengajuanAdmin()">
                                <option value="pending">Pending</option>
                                <option value="">Semua Status</option>
                                <option value="approved">Disetujui</option>
                                <option value="rejected">Ditolak</option>
                                <option value="used">Sudah Digunakan</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Tanggal Dari</label>
                            <input type="date" class="form-control" id="filterStartDate" onchange="filterPengajuanAdmin()">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Tanggal Sampai</label>
                            <input type="date" class="form-control" id="filterEndDate" onchange="filterPengajuanAdmin()">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Cari Kasir</label>
                            <input type="text" class="form-control" id="searchKasir" 
                                placeholder="Nama kasir..." onkeyup="filterPengajuanAdmin()">
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Pengajuan List -->
            <div id="pengajuanAdminListContainer">
                ${renderPengajuanAdminList(pendingList)}
            </div>
        </div>
    `;
}

/**
 * Render list pengajuan for admin
 * @param {Array} pengajuanList - Array of pengajuan
 * @returns {string} HTML string
 */
function renderPengajuanAdminList(pengajuanList) {
    if (pengajuanList.length === 0) {
        return `
            <div class="card">
                <div class="card-body text-center py-5">
                    <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc;"></i>
                    <p class="text-muted mt-3">Tidak ada pengajuan modal</p>
                </div>
            </div>
        `;
    }
    
    return pengajuanList.map(p => {
        const statusBadge = getStatusBadge(p.status);
        const statusIcon = getStatusIcon(p.status);
        const isPending = p.status === 'pending';
        
        return `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-8">
                            <div class="d-flex align-items-start">
                                <div class="me-3" style="font-size: 2rem;">
                                    ${statusIcon}
                                </div>
                                <div class="flex-grow-1">
                                    <h5 class="mb-1">
                                        ${formatRupiah(p.jumlahDiminta)}
                                        ${statusBadge}
                                    </h5>
                                    <p class="mb-1">
                                        <strong><i class="bi bi-person me-1"></i>${p.kasirName}</strong>
                                    </p>
                                    <p class="text-muted mb-2">
                                        <small>
                                            <i class="bi bi-calendar me-1"></i>
                                            ${new Date(p.tanggalPengajuan).toLocaleString('id-ID')}
                                        </small>
                                    </p>
                                    ${p.keterangan ? `
                                        <p class="mb-2"><strong>Keterangan:</strong> ${p.keterangan}</p>
                                    ` : ''}
                                    
                                    ${!isPending && p.adminName ? `
                                        <div class="mt-2">
                                            <small class="text-muted">
                                                <i class="bi bi-person-check me-1"></i>
                                                Diproses oleh: ${p.adminName} pada ${new Date(p.tanggalProses).toLocaleString('id-ID')}
                                            </small>
                                        </div>
                                    ` : ''}
                                    
                                    ${p.status === 'rejected' && p.alasanPenolakan ? `
                                        <div class="alert alert-danger mt-2 mb-0">
                                            <small>
                                                <strong><i class="bi bi-exclamation-triangle me-1"></i>Alasan Penolakan:</strong><br>
                                                ${p.alasanPenolakan}
                                            </small>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4 text-end">
                            ${isPending ? `
                                <button class="btn btn-success btn-sm mb-2 w-100" 
                                    onclick="showApprovalModal('${p.id}')">
                                    <i class="bi bi-check-circle me-1"></i>Setujui
                                </button>
                                <button class="btn btn-danger btn-sm w-100" 
                                    onclick="showRejectionModal('${p.id}')">
                                    <i class="bi bi-x-circle me-1"></i>Tolak
                                </button>
                            ` : `
                                <button class="btn btn-outline-primary btn-sm w-100" 
                                    onclick="showDetailPengajuanAdmin('${p.id}')">
                                    <i class="bi bi-eye me-1"></i>Detail
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Filter pengajuan for admin
 */
function filterPengajuanAdmin() {
    const filterStatus = document.getElementById('filterStatusAdmin').value;
    const startDate = document.getElementById('filterStartDate').value;
    const endDate = document.getElementById('filterEndDate').value;
    const searchTerm = document.getElementById('searchKasir').value;
    
    const filters = {};
    if (filterStatus) filters.status = filterStatus;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (searchTerm) filters.searchTerm = searchTerm;
    
    const pengajuanList = getPengajuanHistory(filters);
    
    document.getElementById('pengajuanAdminListContainer').innerHTML = renderPengajuanAdminList(pengajuanList);
}

/**
 * Show approval modal
 * @param {string} pengajuanId - ID pengajuan
 */
function showApprovalModal(pengajuanId) {
    const pengajuanList = getAllPengajuanModal();
    const pengajuan = pengajuanList.find(p => p.id === pengajuanId);
    
    if (!pengajuan) {
        showAlert('Pengajuan tidak ditemukan', 'error');
        return;
    }
    
    const modalHtml = `
        <div class="modal fade" id="approvalModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-check-circle me-2"></i>
                            Setujui Pengajuan Modal
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <h6>Detail Pengajuan:</h6>
                            <p class="mb-1"><strong>Kasir:</strong> ${pengajuan.kasirName}</p>
                            <p class="mb-1"><strong>Jumlah:</strong> ${formatRupiah(pengajuan.jumlahDiminta)}</p>
                            <p class="mb-1"><strong>Tanggal:</strong> ${new Date(pengajuan.tanggalPengajuan).toLocaleString('id-ID')}</p>
                            ${pengajuan.keterangan ? `<p class="mb-0"><strong>Keterangan:</strong> ${pengajuan.keterangan}</p>` : ''}
                        </div>
                        
                        <p class="mb-3">Apakah Anda yakin ingin menyetujui pengajuan modal ini?</p>
                        
                        <div class="alert alert-warning">
                            <small>
                                <i class="bi bi-info-circle me-1"></i>
                                Setelah disetujui, kasir dapat menggunakan modal ini untuk membuka shift kasir.
                            </small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="button" class="btn btn-success" onclick="confirmApproval('${pengajuanId}')">
                            <i class="bi bi-check-circle me-1"></i>Ya, Setujui
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('approvalModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('approvalModal'));
    modal.show();
    
    // Clean up after modal is hidden
    document.getElementById('approvalModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

/**
 * Confirm approval
 * @param {string} pengajuanId - ID pengajuan
 */
function confirmApproval(pengajuanId) {
    const result = approvePengajuan(pengajuanId, currentUser.id, currentUser.name);
    
    if (result.success) {
        showAlert('Pengajuan modal berhasil disetujui', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('approvalModal'));
        modal.hide();
        
        // Refresh list
        renderKelolaPengajuanModal();
    } else {
        showAlert(result.message, 'error');
    }
}

/**
 * Show rejection modal
 * @param {string} pengajuanId - ID pengajuan
 */
function showRejectionModal(pengajuanId) {
    const pengajuanList = getAllPengajuanModal();
    const pengajuan = pengajuanList.find(p => p.id === pengajuanId);
    
    if (!pengajuan) {
        showAlert('Pengajuan tidak ditemukan', 'error');
        return;
    }
    
    const modalHtml = `
        <div class="modal fade" id="rejectionModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-x-circle me-2"></i>
                            Tolak Pengajuan Modal
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <h6>Detail Pengajuan:</h6>
                            <p class="mb-1"><strong>Kasir:</strong> ${pengajuan.kasirName}</p>
                            <p class="mb-1"><strong>Jumlah:</strong> ${formatRupiah(pengajuan.jumlahDiminta)}</p>
                            <p class="mb-1"><strong>Tanggal:</strong> ${new Date(pengajuan.tanggalPengajuan).toLocaleString('id-ID')}</p>
                            ${pengajuan.keterangan ? `<p class="mb-0"><strong>Keterangan:</strong> ${pengajuan.keterangan}</p>` : ''}
                        </div>
                        
                        <form id="rejectionForm">
                            <div class="mb-3">
                                <label class="form-label">Alasan Penolakan <span class="text-danger">*</span></label>
                                <textarea class="form-control" id="alasanPenolakan" rows="4" 
                                    placeholder="Jelaskan alasan penolakan..." required></textarea>
                                <small class="text-muted">Alasan ini akan dilihat oleh kasir</small>
                            </div>
                            
                            <div class="alert alert-warning">
                                <small>
                                    <i class="bi bi-info-circle me-1"></i>
                                    Setelah ditolak, kasir dapat mengajukan modal baru.
                                </small>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="button" class="btn btn-danger" onclick="confirmRejection('${pengajuanId}')">
                            <i class="bi bi-x-circle me-1"></i>Ya, Tolak
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('rejectionModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('rejectionModal'));
    modal.show();
    
    // Clean up after modal is hidden
    document.getElementById('rejectionModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

/**
 * Confirm rejection
 * @param {string} pengajuanId - ID pengajuan
 */
function confirmRejection(pengajuanId) {
    const alasan = document.getElementById('alasanPenolakan').value.trim();
    
    if (!alasan) {
        showAlert('Alasan penolakan harus diisi', 'error');
        return;
    }
    
    const result = rejectPengajuan(pengajuanId, currentUser.id, currentUser.name, alasan);
    
    if (result.success) {
        showAlert('Pengajuan modal berhasil ditolak', 'success');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('rejectionModal'));
        modal.hide();
        
        // Refresh list
        renderKelolaPengajuanModal();
    } else {
        showAlert(result.message, 'error');
    }
}

/**
 * Show detail pengajuan for admin
 * @param {string} pengajuanId - ID pengajuan
 */
function showDetailPengajuanAdmin(pengajuanId) {
    const pengajuanList = getAllPengajuanModal();
    const pengajuan = pengajuanList.find(p => p.id === pengajuanId);
    
    if (!pengajuan) {
        showAlert('Pengajuan tidak ditemukan', 'error');
        return;
    }
    
    const modalHtml = `
        <div class="modal fade" id="detailPengajuanAdminModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-file-earmark-text me-2"></i>
                            Detail Pengajuan Modal
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <strong>Status:</strong><br>
                                ${getStatusBadge(pengajuan.status)}
                            </div>
                            <div class="col-md-6">
                                <strong>Jumlah Modal:</strong><br>
                                <span class="h5 text-primary">${formatRupiah(pengajuan.jumlahDiminta)}</span>
                            </div>
                        </div>
                        
                        <hr>
                        
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <strong>Kasir:</strong><br>
                                ${pengajuan.kasirName}
                            </div>
                            <div class="col-md-6">
                                <strong>Tanggal Pengajuan:</strong><br>
                                ${new Date(pengajuan.tanggalPengajuan).toLocaleString('id-ID')}
                            </div>
                        </div>
                        
                        ${pengajuan.keterangan ? `
                            <div class="mb-3">
                                <strong>Keterangan:</strong><br>
                                <p class="text-muted">${pengajuan.keterangan}</p>
                            </div>
                        ` : ''}
                        
                        ${pengajuan.status !== 'pending' ? `
                            <hr>
                            <h6>Informasi Pemrosesan</h6>
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <strong>Diproses oleh:</strong><br>
                                    ${pengajuan.adminName}
                                </div>
                                <div class="col-md-6">
                                    <strong>Tanggal Diproses:</strong><br>
                                    ${new Date(pengajuan.tanggalProses).toLocaleString('id-ID')}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${pengajuan.status === 'rejected' && pengajuan.alasanPenolakan ? `
                            <div class="alert alert-danger">
                                <strong><i class="bi bi-exclamation-triangle me-2"></i>Alasan Penolakan:</strong><br>
                                ${pengajuan.alasanPenolakan}
                            </div>
                        ` : ''}
                        
                        ${pengajuan.status === 'used' && pengajuan.shiftId ? `
                            <hr>
                            <h6>Informasi Penggunaan</h6>
                            <div class="alert alert-info">
                                <i class="bi bi-check-circle me-2"></i>
                                Modal telah digunakan untuk shift kasir<br>
                                <small>Tanggal: ${new Date(pengajuan.tanggalDigunakan).toLocaleString('id-ID')}</small>
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('detailPengajuanAdminModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('detailPengajuanAdminModal'));
    modal.show();
    
    // Clean up after modal is hidden
    document.getElementById('detailPengajuanAdminModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

/**
 * Render halaman riwayat pengajuan untuk admin
 */
function renderRiwayatPengajuanAdmin() {
    const content = document.getElementById('mainContent');
    
    if (!currentUser || !['admin', 'administrator', 'super_admin'].includes(currentUser.role)) {
        content.innerHTML = '<div class="alert alert-danger">Anda tidak memiliki akses ke halaman ini</div>';
        return;
    }
    
    // Get all pengajuan (exclude pending)
    const pengajuanList = getPengajuanHistory({ status: 'approved' })
        .concat(getPengajuanHistory({ status: 'rejected' }))
        .concat(getPengajuanHistory({ status: 'used' }))
        .sort((a, b) => new Date(b.tanggalPengajuan) - new Date(a.tanggalPengajuan));
    
    content.innerHTML = `
        <div class="container-fluid">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2><i class="bi bi-clock-history me-2"></i>Riwayat Pengajuan Modal</h2>
                <button class="btn btn-success" onclick="exportPengajuanToCSV()">
                    <i class="bi bi-download me-2"></i>Export CSV
                </button>
            </div>
            
            <!-- Filter Section -->
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-3">
                            <label class="form-label">Filter Status</label>
                            <select class="form-select" id="filterStatusRiwayat" onchange="filterRiwayatAdmin()">
                                <option value="">Semua Status</option>
                                <option value="approved">Disetujui</option>
                                <option value="rejected">Ditolak</option>
                                <option value="used">Sudah Digunakan</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Tanggal Dari</label>
                            <input type="date" class="form-control" id="filterStartDateRiwayat" onchange="filterRiwayatAdmin()">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Tanggal Sampai</label>
                            <input type="date" class="form-control" id="filterEndDateRiwayat" onchange="filterRiwayatAdmin()">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Cari Kasir</label>
                            <input type="text" class="form-control" id="searchKasirRiwayat" 
                                placeholder="Nama kasir..." onkeyup="filterRiwayatAdmin()">
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Statistics -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <h6>Disetujui</h6>
                            <h3>${getPengajuanHistory({ status: 'approved' }).length + getPengajuanHistory({ status: 'used' }).length}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-danger text-white">
                        <div class="card-body">
                            <h6>Ditolak</h6>
                            <h3>${getPengajuanHistory({ status: 'rejected' }).length}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-info text-white">
                        <div class="card-body">
                            <h6>Sudah Digunakan</h6>
                            <h3>${getPengajuanHistory({ status: 'used' }).length}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <h6>Total Modal Disetujui</h6>
                            <h3 style="font-size: 1.2rem;">${formatRupiah(
                                getPengajuanHistory({ status: 'approved' })
                                    .concat(getPengajuanHistory({ status: 'used' }))
                                    .reduce((sum, p) => sum + p.jumlahDiminta, 0)
                            )}</h3>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Riwayat List -->
            <div id="riwayatAdminListContainer">
                ${renderRiwayatAdminList(pengajuanList)}
            </div>
        </div>
    `;
}

/**
 * Render riwayat list for admin
 * @param {Array} pengajuanList - Array of pengajuan
 * @returns {string} HTML string
 */
function renderRiwayatAdminList(pengajuanList) {
    if (pengajuanList.length === 0) {
        return `
            <div class="card">
                <div class="card-body text-center py-5">
                    <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc;"></i>
                    <p class="text-muted mt-3">Tidak ada riwayat pengajuan</p>
                </div>
            </div>
        `;
    }
    
    return `
        <div class="card">
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Kasir</th>
                                <th>Jumlah</th>
                                <th>Status</th>
                                <th>Diproses Oleh</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pengajuanList.map(p => `
                                <tr>
                                    <td>${new Date(p.tanggalPengajuan).toLocaleDateString('id-ID')}</td>
                                    <td>${p.kasirName}</td>
                                    <td>${formatRupiah(p.jumlahDiminta)}</td>
                                    <td>${getStatusBadge(p.status)}</td>
                                    <td>${p.adminName || '-'}</td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary" 
                                            onclick="showDetailPengajuanAdmin('${p.id}')">
                                            <i class="bi bi-eye"></i>
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

/**
 * Filter riwayat for admin
 */
function filterRiwayatAdmin() {
    const filterStatus = document.getElementById('filterStatusRiwayat').value;
    const startDate = document.getElementById('filterStartDateRiwayat').value;
    const endDate = document.getElementById('filterEndDateRiwayat').value;
    const searchTerm = document.getElementById('searchKasirRiwayat').value;
    
    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (searchTerm) filters.searchTerm = searchTerm;
    
    let pengajuanList = [];
    
    if (filterStatus) {
        pengajuanList = getPengajuanHistory({ ...filters, status: filterStatus });
    } else {
        pengajuanList = getPengajuanHistory({ ...filters, status: 'approved' })
            .concat(getPengajuanHistory({ ...filters, status: 'rejected' }))
            .concat(getPengajuanHistory({ ...filters, status: 'used' }))
            .sort((a, b) => new Date(b.tanggalPengajuan) - new Date(a.tanggalPengajuan));
    }
    
    document.getElementById('riwayatAdminListContainer').innerHTML = renderRiwayatAdminList(pengajuanList);
}

/**
 * Export pengajuan to CSV
 */
function exportPengajuanToCSV() {
    const filterStatus = document.getElementById('filterStatusRiwayat')?.value || '';
    const startDate = document.getElementById('filterStartDateRiwayat')?.value || '';
    const endDate = document.getElementById('filterEndDateRiwayat')?.value || '';
    const searchTerm = document.getElementById('searchKasirRiwayat')?.value || '';
    
    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (searchTerm) filters.searchTerm = searchTerm;
    
    let pengajuanList = [];
    
    if (filterStatus) {
        pengajuanList = getPengajuanHistory({ ...filters, status: filterStatus });
    } else {
        pengajuanList = getPengajuanHistory({ ...filters, status: 'approved' })
            .concat(getPengajuanHistory({ ...filters, status: 'rejected' }))
            .concat(getPengajuanHistory({ ...filters, status: 'used' }))
            .sort((a, b) => new Date(b.tanggalPengajuan) - new Date(a.tanggalPengajuan));
    }
    
    if (pengajuanList.length === 0) {
        showAlert('Tidak ada data untuk diekspor', 'warning');
        return;
    }
    
    // Create CSV content
    let csv = 'Tanggal Pengajuan,Kasir,Jumlah Modal,Status,Admin,Tanggal Diproses,Keterangan,Alasan Penolakan\n';
    
    pengajuanList.forEach(p => {
        const row = [
            new Date(p.tanggalPengajuan).toLocaleString('id-ID'),
            p.kasirName,
            p.jumlahDiminta,
            p.status,
            p.adminName || '',
            p.tanggalProses ? new Date(p.tanggalProses).toLocaleString('id-ID') : '',
            p.keterangan || '',
            p.alasanPenolakan || ''
        ];
        csv += row.map(field => `"${field}"`).join(',') + '\n';
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `riwayat_pengajuan_modal_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert('Data berhasil diekspor ke CSV', 'success');
}
