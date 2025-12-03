// System Settings Module

/**
 * Render system settings page
 */
function renderSystemSettings() {
    const content = document.getElementById('mainContent');
    
    if (!currentUser || currentUser.role !== 'super_admin') {
        content.innerHTML = '<div class="alert alert-danger">Anda tidak memiliki akses ke halaman ini</div>';
        return;
    }
    
    // Get current settings
    const pengajuanSettings = getPengajuanModalSettings();
    
    content.innerHTML = `
        <div class="container-fluid">
            <h2 class="mb-4"><i class="bi bi-gear-fill me-2"></i>Pengaturan Sistem</h2>
            
            <!-- Pengajuan Modal Kasir Settings -->
            <div class="card mb-4">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0"><i class="bi bi-file-earmark-text me-2"></i>Pengajuan Modal Kasir</h5>
                </div>
                <div class="card-body">
                    <form id="pengajuanModalSettingsForm">
                        <!-- Enable/Disable Feature -->
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label class="form-label"><strong>Status Fitur</strong></label>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" id="pengajuanEnabled" 
                                        ${pengajuanSettings.enabled ? 'checked' : ''}>
                                    <label class="form-check-label" for="pengajuanEnabled">
                                        Aktifkan Fitur Pengajuan Modal
                                    </label>
                                </div>
                                <small class="text-muted">Jika dinonaktifkan, kasir tidak dapat mengajukan modal</small>
                            </div>
                            
                            <div class="col-md-6">
                                <label class="form-label"><strong>Require Approval</strong></label>
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" id="requireApproval" 
                                        ${pengajuanSettings.requireApproval ? 'checked' : ''}>
                                    <label class="form-check-label" for="requireApproval">
                                        Wajib Persetujuan Admin
                                    </label>
                                </div>
                                <small class="text-muted">Jika dinonaktifkan, pengajuan otomatis disetujui</small>
                            </div>
                        </div>
                        
                        <hr>
                        
                        <!-- Batas Maksimum -->
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label class="form-label"><strong>Batas Maksimum Pengajuan</strong></label>
                                <div class="input-group">
                                    <span class="input-group-text">Rp</span>
                                    <input type="number" class="form-control" id="batasMaximum" 
                                        value="${pengajuanSettings.batasMaximum}" 
                                        min="0" step="100000" required>
                                </div>
                                <small class="text-muted">Jumlah maksimum yang dapat diajukan kasir</small>
                                <div class="mt-1">
                                    <small class="text-primary">
                                        <i class="bi bi-info-circle me-1"></i>
                                        Format: ${formatRupiah(pengajuanSettings.batasMaximum)}
                                    </small>
                                </div>
                            </div>
                            
                            <div class="col-md-6">
                                <label class="form-label"><strong>Auto-Approve Amount</strong></label>
                                <div class="input-group">
                                    <span class="input-group-text">Rp</span>
                                    <input type="number" class="form-control" id="autoApproveAmount" 
                                        value="${pengajuanSettings.autoApproveAmount}" 
                                        min="0" step="100000" required>
                                </div>
                                <small class="text-muted">Pengajuan ≤ jumlah ini otomatis disetujui</small>
                                <div class="mt-1">
                                    <small class="text-primary">
                                        <i class="bi bi-info-circle me-1"></i>
                                        Format: ${formatRupiah(pengajuanSettings.autoApproveAmount)}
                                    </small>
                                </div>
                            </div>
                        </div>
                        
                        <hr>
                        
                        <!-- Current Settings Summary -->
                        <div class="alert alert-info">
                            <h6><i class="bi bi-info-circle me-2"></i>Pengaturan Saat Ini:</h6>
                            <ul class="mb-0">
                                <li>Status: <strong>${pengajuanSettings.enabled ? 'Aktif' : 'Nonaktif'}</strong></li>
                                <li>Require Approval: <strong>${pengajuanSettings.requireApproval ? 'Ya' : 'Tidak'}</strong></li>
                                <li>Batas Maksimum: <strong>${formatRupiah(pengajuanSettings.batasMaximum)}</strong></li>
                                <li>Auto-Approve: <strong>${formatRupiah(pengajuanSettings.autoApproveAmount)}</strong></li>
                            </ul>
                        </div>
                        
                        <!-- Save Button -->
                        <div class="d-grid gap-2">
                            <button type="submit" class="btn btn-primary btn-lg">
                                <i class="bi bi-save me-2"></i>Simpan Pengaturan
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- Reset Data Koperasi -->
            <div class="card mb-4">
                <div class="card-header bg-danger text-white">
                    <h5 class="mb-0"><i class="bi bi-exclamation-triangle-fill me-2"></i>Reset Data Koperasi</h5>
                </div>
                <div class="card-body">
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i>
                        <strong>Peringatan:</strong> Fitur ini akan menghapus data koperasi. Gunakan dengan hati-hati!
                    </div>
                    <p class="text-muted">
                        Reset data koperasi memungkinkan Anda menghapus seluruh atau sebagian data untuk mempersiapkan aplikasi bagi koperasi baru.
                        Backup otomatis akan dibuat sebelum reset dilakukan.
                    </p>
                    <button class="btn btn-danger" onclick="navigateToResetData()">
                        <i class="bi bi-trash-fill me-2"></i>Buka Halaman Reset Data
                    </button>
                </div>
            </div>
            
            <!-- Other System Settings can be added here -->
            <div class="card">
                <div class="card-header bg-secondary text-white">
                    <h5 class="mb-0"><i class="bi bi-gear me-2"></i>Pengaturan Lainnya</h5>
                </div>
                <div class="card-body">
                    <p class="text-muted">Pengaturan sistem lainnya akan ditambahkan di sini.</p>
                </div>
            </div>
        </div>
    `;
    
    // Setup form handler
    setupPengajuanModalSettingsForm();
}

/**
 * Navigate to reset data page
 */
function navigateToResetData() {
    if (typeof navigateTo === 'function') {
        navigateTo('reset-data');
    } else if (typeof renderResetDataPage === 'function') {
        renderResetDataPage();
    } else {
        showAlert('Fitur reset data belum tersedia. Pastikan file js/resetDataUI.js sudah dimuat.', 'warning');
    }
}

/**
 * Setup form handler for pengajuan modal settings
 */
function setupPengajuanModalSettingsForm() {
    const form = document.getElementById('pengajuanModalSettingsForm');
    if (!form) return;
    
    // Real-time format display
    const batasMaximumInput = document.getElementById('batasMaximum');
    const autoApproveInput = document.getElementById('autoApproveAmount');
    
    if (batasMaximumInput) {
        batasMaximumInput.addEventListener('input', function() {
            const value = parseFloat(this.value) || 0;
            const formatDisplay = this.parentElement.nextElementSibling.nextElementSibling.querySelector('small');
            if (formatDisplay) {
                formatDisplay.innerHTML = `<i class="bi bi-info-circle me-1"></i>Format: ${formatRupiah(value)}`;
            }
        });
    }
    
    if (autoApproveInput) {
        autoApproveInput.addEventListener('input', function() {
            const value = parseFloat(this.value) || 0;
            const formatDisplay = this.parentElement.nextElementSibling.nextElementSibling.querySelector('small');
            if (formatDisplay) {
                formatDisplay.innerHTML = `<i class="bi bi-info-circle me-1"></i>Format: ${formatRupiah(value)}`;
            }
        });
    }
    
    // Form submit handler
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        savePengajuanModalSettings();
    });
}

/**
 * Save pengajuan modal settings
 */
function savePengajuanModalSettings() {
    try {
        // Get form values
        const enabled = document.getElementById('pengajuanEnabled').checked;
        const requireApproval = document.getElementById('requireApproval').checked;
        const batasMaximum = parseFloat(document.getElementById('batasMaximum').value);
        const autoApproveAmount = parseFloat(document.getElementById('autoApproveAmount').value);
        
        // Validate
        if (isNaN(batasMaximum) || batasMaximum <= 0) {
            showAlert('Batas maksimum harus berupa angka positif', 'error');
            return;
        }
        
        if (isNaN(autoApproveAmount) || autoApproveAmount < 0) {
            showAlert('Auto-approve amount harus berupa angka non-negatif', 'error');
            return;
        }
        
        if (autoApproveAmount > batasMaximum) {
            showAlert('Auto-approve amount tidak boleh melebihi batas maksimum', 'warning');
            return;
        }
        
        // Create settings object
        const newSettings = {
            enabled: enabled,
            batasMaximum: batasMaximum,
            requireApproval: requireApproval,
            autoApproveAmount: autoApproveAmount
        };
        
        // Save settings
        const result = updatePengajuanModalSettings(newSettings);
        
        if (result) {
            showAlert('Pengaturan berhasil disimpan', 'success');
            
            // Refresh page to show updated settings
            setTimeout(() => {
                renderSystemSettings();
            }, 1000);
        } else {
            showAlert('Gagal menyimpan pengaturan', 'error');
        }
        
    } catch (error) {
        console.error('Error saving settings:', error);
        showAlert('Terjadi error saat menyimpan pengaturan', 'error');
    }
}
