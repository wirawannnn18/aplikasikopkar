/**
 * Reset Data Koperasi - UI Module
 * Handles all UI rendering and interactions for reset functionality
 */

// ============================================================================
// Main Reset Page Rendering
// ============================================================================

/**
 * Render reset data page
 */
function renderResetDataPage() {
    const content = document.getElementById('mainContent');

    // Check if content element exists
    if (!content) {
        console.error('mainContent element not found');
        return;
    }

    // Check permissions
    let currentUser = null;
    try {
        // Try to get from global variable first
        if (typeof window.currentUser !== 'undefined' && window.currentUser) {
            currentUser = window.currentUser;
            console.log('Got user from window.currentUser:', currentUser);
        } else {
            // Fallback to localStorage
            const userData = localStorage.getItem('currentUser');
            if (userData) {
                currentUser = JSON.parse(userData);
                console.log('Got user from localStorage:', currentUser);
            }
        }
    } catch (e) {
        console.error('Error getting current user:', e);
    }

    // Debug: log user info
    console.log('Current user for reset page:', currentUser);
    console.log('User role:', currentUser ? currentUser.role : 'null');

    if (!currentUser || (currentUser.role !== 'super_admin' && currentUser.role !== 'administrator')) {
        content.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                <strong>Akses Ditolak</strong>
                <p class="mb-0 mt-2">Anda tidak memiliki izin untuk mengakses halaman ini. Fitur Reset Data hanya tersedia untuk Super Administrator.</p>
                <p class="mb-0 mt-2"><small><strong>Debug Info:</strong></small></p>
                <p class="mb-0"><small>Current role: <code>${currentUser ? currentUser.role : 'not logged in'}</code></small></p>
                <p class="mb-0"><small>Username: <code>${currentUser ? currentUser.username : 'N/A'}</code></small></p>
                <p class="mb-0 mt-2"><small>Allowed roles: <code>super_admin</code> atau <code>administrator</code></small></p>
                <hr>
                <button class="btn btn-sm btn-info" onclick="console.log('localStorage currentUser:', localStorage.getItem('currentUser')); console.log('window.currentUser:', window.currentUser);">
                    Debug: Show User Data in Console
                </button>
            </div>
        `;
        return;
    }

    // Initialize services
    let resetService, categoryManager;
    try {
        resetService = new ResetService();
        categoryManager = new CategoryManager();
    } catch (e) {
        content.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                <strong>Error Inisialisasi</strong>
                <p class="mb-0 mt-2">Gagal menginisialisasi service: ${e.message}</p>
            </div>
        `;
        console.error('Service initialization error:', e);
        return;
    }

    // Get categories
    const categoryGroups = categoryManager.getCategoryGroups();
    const allCategories = categoryManager.getAllCategories();

    // Calculate statistics
    const totalRecords = allCategories.reduce((sum, cat) => sum + cat.count, 0);
    const totalSize = allCategories.reduce((sum, cat) => sum + cat.size, 0);

    // Check if test mode is active
    const testMode = sessionStorage.getItem(RESET_CONSTANTS.TEST_MODE_KEY) === 'true';

    content.innerHTML = `
        <div class="container-fluid">
            ${testMode ? `
                <div class="alert alert-warning mb-4">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <i class="bi bi-exclamation-triangle-fill me-2"></i>
                            <strong>TEST MODE AKTIF</strong> - Reset tidak akan menghapus data sebenarnya
                        </div>
                        <button class="btn btn-sm btn-outline-warning" onclick="toggleTestMode()">
                            <i class="bi bi-x-circle me-1"></i>Nonaktifkan Test Mode
                        </button>
                    </div>
                </div>
            ` : ''}

            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 style="color: #dc3545; font-weight: 700;">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>Reset Data Koperasi
                </h2>
                ${!testMode ? `
                    <button class="btn btn-outline-secondary" onclick="toggleTestMode()">
                        <i class="bi bi-bug me-1"></i>Aktifkan Test Mode
                    </button>
                ` : ''}
            </div>

            <!-- Critical Warning -->
            <div class="alert alert-danger border-danger mb-4">
                <h5 class="alert-heading">
                    <i class="bi bi-exclamation-octagon-fill me-2"></i>
                    PERINGATAN: Tindakan Berbahaya!
                </h5>
                <hr>
                <p class="mb-2">
                    <strong>Reset data akan menghapus SELURUH atau SEBAGIAN data dari aplikasi ini.</strong>
                </p>
                <p class="mb-2">
                    Fitur ini dirancang untuk mempersiapkan aplikasi agar dapat digunakan untuk koperasi yang berbeda.
                </p>
                <p class="mb-0">
                    <strong>Backup otomatis akan dibuat sebelum reset dilakukan.</strong>
                </p>
            </div>

            <!-- Statistics Cards -->
            <div class="row mb-4">
                <div class="col-md-4 mb-3">
                    <div class="card border-0 shadow-sm h-100" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <div class="card-body text-white">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-2" style="opacity: 0.9;">Total Records</h6>
                                    <h2 class="mb-0" style="font-weight: 700;">${totalRecords.toLocaleString('id-ID')}</h2>
                                </div>
                                <i class="bi bi-database-fill" style="font-size: 3rem; opacity: 0.3;"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-md-4 mb-3">
                    <div class="card border-0 shadow-sm h-100" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                        <div class="card-body text-white">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-2" style="opacity: 0.9;">Kategori Data</h6>
                                    <h2 class="mb-0" style="font-weight: 700;">${allCategories.length}</h2>
                                </div>
                                <i class="bi bi-folder-fill" style="font-size: 3rem; opacity: 0.3;"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-md-4 mb-3">
                    <div class="card border-0 shadow-sm h-100" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                        <div class="card-body text-white">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 class="mb-2" style="opacity: 0.9;">Total Ukuran</h6>
                                    <h2 class="mb-0" style="font-weight: 700; font-size: 1.5rem;">${formatSizeForUI(totalSize)}</h2>
                                </div>
                                <i class="bi bi-hdd-fill" style="font-size: 3rem; opacity: 0.3;"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Reset Type Selection -->
            <div class="card border-0 shadow-sm mb-4">
                <div class="card-header bg-white border-0 py-3">
                    <h5 class="mb-0">
                        <i class="bi bi-gear me-2" style="color: #dc3545;"></i>Pilih Tipe Reset
                    </h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <div class="form-check p-3 border rounded" style="cursor: pointer;" onclick="selectResetType('full')">
                                <input class="form-check-input" type="radio" name="resetType" id="resetTypeFull" value="full" checked>
                                <label class="form-check-label w-100" for="resetTypeFull" style="cursor: pointer;">
                                    <strong class="d-block mb-1">Reset Semua Data</strong>
                                    <small class="text-muted">Hapus seluruh data koperasi (kecuali session login)</small>
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <div class="form-check p-3 border rounded" style="cursor: pointer;" onclick="selectResetType('selective')">
                                <input class="form-check-input" type="radio" name="resetType" id="resetTypeSelective" value="selective">
                                <label class="form-check-label w-100" for="resetTypeSelective" style="cursor: pointer;">
                                    <strong class="d-block mb-1">Reset Selektif</strong>
                                    <small class="text-muted">Pilih kategori data tertentu yang akan dihapus</small>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Category Selection (hidden by default) -->
            <div class="card border-0 shadow-sm mb-4" id="categorySelectionCard" style="display: none;">
                <div class="card-header bg-white border-0 py-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">
                            <i class="bi bi-list-check me-2" style="color: #dc3545;"></i>Pilih Kategori Data
                        </h5>
                        <div>
                            <button class="btn btn-sm btn-outline-primary me-2" onclick="selectAllCategories()">
                                <i class="bi bi-check-square me-1"></i>Pilih Semua
                            </button>
                            <button class="btn btn-sm btn-outline-secondary" onclick="deselectAllCategories()">
                                <i class="bi bi-square me-1"></i>Hapus Semua
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    ${Object.entries(categoryGroups).map(([groupKey, group]) => `
                        <div class="mb-4">
                            <h6 class="mb-3 text-primary">
                                <i class="bi bi-folder2-open me-2"></i>${group.label}
                            </h6>
                            <div class="row">
                                ${group.categories.map(cat => `
                                    <div class="col-md-6 mb-2">
                                        <div class="form-check p-2 border rounded">
                                            <input class="form-check-input category-checkbox" type="checkbox" 
                                                   value="${cat.key}" id="cat_${cat.key}" 
                                                   ${cat.protected ? 'disabled title="Kategori ini dilindungi"' : ''}
                                                   onchange="updateResetEstimate()">
                                            <label class="form-check-label w-100" for="cat_${cat.key}">
                                                <div class="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <strong>${cat.label}</strong>
                                                        ${cat.protected ? '<span class="badge bg-warning text-dark ms-1">Protected</span>' : ''}
                                                        <br>
                                                        <small class="text-muted">${cat.count} records, ${formatSizeForUI(cat.size)}</small>
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Estimate -->
            <div class="card border-0 shadow-sm mb-4">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <h6 class="mb-2">Estimasi Data yang Akan Dihapus</h6>
                            <div id="resetEstimate">
                                <strong id="estimateRecords">${totalRecords.toLocaleString('id-ID')}</strong> records, 
                                <strong id="estimateSize">${formatSizeForUI(totalSize)}</strong>
                            </div>
                            <small class="text-muted" id="estimateCategories">${allCategories.length} kategori dipilih</small>
                        </div>
                        <div class="col-md-4 text-end">
                            <button class="btn btn-danger btn-lg" id="btnStartReset" onclick="startResetProcess()">
                                <i class="bi bi-trash-fill me-2"></i>Mulai Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-white border-0 py-3">
                    <h5 class="mb-0">
                        <i class="bi bi-lightning-fill me-2" style="color: #ffc107;"></i>Aksi Cepat
                    </h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6 mb-2">
                            <button class="btn btn-outline-primary w-100" onclick="navigateToBackupRestore()">
                                <i class="bi bi-upload me-2"></i>Restore dari Backup
                            </button>
                        </div>
                        <div class="col-md-6 mb-2">
                            <button class="btn btn-outline-secondary w-100" onclick="viewResetHistory()">
                                <i class="bi bi-clock-history me-2"></i>Riwayat Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Initialize
    updateResetEstimate();
}

// ============================================================================
// Reset Type Selection
// ============================================================================

/**
 * Select reset type
 * @param {string} type - 'full' or 'selective'
 */
function selectResetType(type) {
    document.getElementById('resetTypeFull').checked = (type === 'full');
    document.getElementById('resetTypeSelective').checked = (type === 'selective');

    const categoryCard = document.getElementById('categorySelectionCard');
    if (type === 'selective') {
        categoryCard.style.display = 'block';
    } else {
        categoryCard.style.display = 'none';
    }

    updateResetEstimate();
}

/**
 * Select all categories
 */
function selectAllCategories() {
    document.querySelectorAll('.category-checkbox:not(:disabled)').forEach(checkbox => {
        checkbox.checked = true;
    });
    updateResetEstimate();
}

/**
 * Deselect all categories
 */
function deselectAllCategories() {
    document.querySelectorAll('.category-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
    updateResetEstimate();
}

/**
 * Update reset estimate
 */
function updateResetEstimate() {
    const resetType = document.getElementById('resetTypeFull').checked ? 'full' : 'selective';
    const categoryManager = new CategoryManager();
    const allCategories = categoryManager.getAllCategories();

    let selectedCategories = [];
    let totalRecords = 0;
    let totalSize = 0;

    if (resetType === 'full') {
        selectedCategories = allCategories;
        totalRecords = allCategories.reduce((sum, cat) => sum + cat.count, 0);
        totalSize = allCategories.reduce((sum, cat) => sum + cat.size, 0);
    } else {
        const checkboxes = document.querySelectorAll('.category-checkbox:checked');
        checkboxes.forEach(checkbox => {
            const cat = allCategories.find(c => c.key === checkbox.value);
            if (cat) {
                selectedCategories.push(cat);
                totalRecords += cat.count;
                totalSize += cat.size;
            }
        });
    }

    // Update UI
    document.getElementById('estimateRecords').textContent = totalRecords.toLocaleString('id-ID');
    document.getElementById('estimateSize').textContent = formatSizeForUI(totalSize);
    document.getElementById('estimateCategories').textContent = `${selectedCategories.length} kategori dipilih`;

    // Enable/disable reset button
    const btnReset = document.getElementById('btnStartReset');
    if (resetType === 'selective' && selectedCategories.length === 0) {
        btnReset.disabled = true;
        btnReset.innerHTML = '<i class="bi bi-trash-fill me-2"></i>Pilih Minimal 1 Kategori';
    } else {
        btnReset.disabled = false;
        btnReset.innerHTML = '<i class="bi bi-trash-fill me-2"></i>Mulai Reset';
    }
}


// ============================================================================
// Reset Process Flow
// ============================================================================

/**
 * Start reset process
 */
function startResetProcess() {
    const resetType = document.getElementById('resetTypeFull').checked ? 'full' : 'selective';
    const categoryManager = new CategoryManager();
    const allCategories = categoryManager.getAllCategories();

    // Get selected categories
    let selectedCategories = [];
    if (resetType === 'selective') {
        const checkboxes = document.querySelectorAll('.category-checkbox:checked');
        checkboxes.forEach(checkbox => {
            selectedCategories.push(checkbox.value);
        });

        if (selectedCategories.length === 0) {
            showResetAlert('Pilih minimal satu kategori untuk direset', 'warning');
            return;
        }
    } else {
        selectedCategories = allCategories.map(c => c.key);
    }

    // Calculate totals
    let totalRecords = 0;
    let totalSize = 0;
    selectedCategories.forEach(catKey => {
        const cat = allCategories.find(c => c.key === catKey);
        if (cat) {
            totalRecords += cat.count;
            totalSize += cat.size;
        }
    });

    // Show first confirmation
    showFirstConfirmation(resetType, selectedCategories, totalRecords, totalSize);
}

/**
 * Show first confirmation dialog
 */
function showFirstConfirmation(resetType, categories, totalRecords, totalSize) {
    const categoryManager = new CategoryManager();
    const allCategories = categoryManager.getAllCategories();

    const categoryList = categories.map(catKey => {
        const cat = allCategories.find(c => c.key === catKey);
        return cat ? `<li><strong>${cat.label}</strong> - ${cat.count} records, ${formatSizeForUI(cat.size)}</li>` : '';
    }).join('');

    const modalHTML = `
        <div class="modal fade" id="firstConfirmationModal" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title">
                            <i class="bi bi-exclamation-triangle-fill me-2"></i>Konfirmasi Reset Data
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-warning">
                            <h6 class="alert-heading">
                                <i class="bi bi-info-circle-fill me-2"></i>Data Berikut Akan Dihapus:
                            </h6>
                            <ul class="mb-0">
                                ${categoryList}
                            </ul>
                        </div>

                        <div class="p-3 border rounded mb-3" style="background-color: #f8f9fa;">
                            <div class="row">
                                <div class="col-6">
                                    <small class="text-muted d-block">Total Records:</small>
                                    <strong>${totalRecords.toLocaleString('id-ID')}</strong>
                                </div>
                                <div class="col-6">
                                    <small class="text-muted d-block">Total Ukuran:</small>
                                    <strong>${formatSizeForUI(totalSize)}</strong>
                                </div>
                            </div>
                        </div>

                        <div class="alert alert-info mb-0">
                            <i class="bi bi-shield-check me-2"></i>
                            <small>
                                <strong>Backup otomatis akan dibuat sebelum reset dimulai.</strong>
                                File backup akan diunduh ke komputer Anda.
                            </small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-1"></i>Batal
                        </button>
                        <button type="button" class="btn btn-warning" onclick="proceedToSecondConfirmation('${resetType}', ${JSON.stringify(categories)})">
                            <i class="bi bi-arrow-right me-1"></i>Lanjutkan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal
    const existing = document.getElementById('firstConfirmationModal');
    if (existing) existing.remove();

    // Add and show modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('firstConfirmationModal'));
    modal.show();
}

/**
 * Proceed to second confirmation
 */
function proceedToSecondConfirmation(resetType, categories) {
    // Close first modal
    const firstModal = bootstrap.Modal.getInstance(document.getElementById('firstConfirmationModal'));
    if (firstModal) firstModal.hide();

    // Show second confirmation
    setTimeout(() => {
        showSecondConfirmation(resetType, categories);
    }, 300);
}

/**
 * Show second confirmation dialog
 */
function showSecondConfirmation(resetType, categories) {
    const testMode = sessionStorage.getItem(RESET_CONSTANTS.TEST_MODE_KEY) === 'true';

    const modalHTML = `
        <div class="modal fade" id="secondConfirmationModal" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-exclamation-octagon-fill me-2"></i>Konfirmasi Final
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-danger border-danger">
                            <h6 class="alert-heading">
                                <i class="bi bi-exclamation-octagon-fill me-2"></i>
                                PERINGATAN: Tindakan Tidak Dapat Dibatalkan!
                            </h6>
                            <hr>
                            <p class="mb-2">
                                <strong>Data yang dihapus TIDAK DAPAT dikembalikan kecuali dari file backup.</strong>
                            </p>
                            <p class="mb-0">
                                Pastikan Anda memahami konsekuensi dari tindakan ini sebelum melanjutkan.
                            </p>
                        </div>

                        ${testMode ? `
                            <div class="alert alert-warning">
                                <i class="bi bi-bug-fill me-2"></i>
                                <strong>TEST MODE AKTIF</strong> - Data tidak akan benar-benar dihapus. Ini hanya simulasi.
                            </div>
                        ` : ''}

                        <div class="mb-3">
                            <label for="confirmationText" class="form-label">
                                <strong>Ketik <code class="text-danger">${RESET_CONSTANTS.CONFIRMATION_TEXT}</code> untuk melanjutkan:</strong>
                            </label>
                            <input type="text" class="form-control" id="confirmationText" 
                                   placeholder="Ketik ${RESET_CONSTANTS.CONFIRMATION_TEXT}" 
                                   autocomplete="off"
                                   oninput="validateConfirmationText()">
                            <div class="invalid-feedback" id="confirmationError">
                                Kata kunci salah. Ketik '${RESET_CONSTANTS.CONFIRMATION_TEXT}' untuk melanjutkan.
                            </div>
                        </div>

                        <div class="alert alert-info mb-0">
                            <i class="bi bi-info-circle-fill me-2"></i>
                            <small>
                                Proses reset akan dimulai segera setelah Anda mengklik tombol konfirmasi.
                                Jangan tutup browser atau navigasi keluar halaman selama proses berlangsung.
                            </small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-1"></i>Batal
                        </button>
                        <button type="button" class="btn btn-danger" id="btnFinalConfirm" disabled 
                                onclick="executeReset('${resetType}', ${JSON.stringify(categories)})">
                            <i class="bi bi-trash-fill me-1"></i>${testMode ? 'Jalankan Simulasi' : 'Reset Sekarang'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal
    const existing = document.getElementById('secondConfirmationModal');
    if (existing) existing.remove();

    // Add and show modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('secondConfirmationModal'));
    modal.show();
}

/**
 * Validate confirmation text
 */
function validateConfirmationText() {
    const input = document.getElementById('confirmationText');
    const button = document.getElementById('btnFinalConfirm');
    const validationService = new ResetValidationService();

    const isValid = validationService.validateConfirmation(input.value, RESET_CONSTANTS.CONFIRMATION_TEXT);

    if (isValid) {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        button.disabled = false;
    } else {
        if (input.value.length > 0) {
            input.classList.add('is-invalid');
        } else {
            input.classList.remove('is-invalid');
        }
        input.classList.remove('is-valid');
        button.disabled = true;
    }
}

/**
 * Execute reset
 */
async function executeReset(resetType, categories) {
    // Close confirmation modal
    const confirmModal = bootstrap.Modal.getInstance(document.getElementById('secondConfirmationModal'));
    if (confirmModal) confirmModal.hide();

    // Show progress modal
    showProgressModal();

    // Get test mode
    const testMode = sessionStorage.getItem(RESET_CONSTANTS.TEST_MODE_KEY) === 'true';

    // Create reset request
    const currentUser = getCurrentUserForReset();
    const request = {
        type: resetType,
        categories: categories,
        createBackup: true,
        testMode: testMode,
        userId: currentUser ? currentUser.username : 'unknown',
        timestamp: new Date().toISOString()
    };

    // Execute reset
    const resetService = new ResetService();

    try {
        let result;

        if (testMode) {
            // Dry run
            result = resetService.performDryRun(request);
            updateProgressModal(100, 'Simulasi selesai', 1, 1);
            await new Promise(resolve => setTimeout(resolve, 500));
            showDryRunResult(result);
        } else {
            // Real reset
            result = await resetService.executeReset(request, (progress, category, processed, total) => {
                updateProgressModal(progress, category, processed, total);
            });

            // Show result
            showResetResult(result);
        }

    } catch (error) {
        console.error('Reset execution error:', error);
        showResetAlert('Error saat melakukan reset: ' + error.message, 'danger');
        hideProgressModal();
    }
}

// ============================================================================
// Progress Modal
// ============================================================================

/**
 * Show progress modal
 */
function showProgressModal() {
    const modalHTML = `
        <div class="modal fade" id="progressModal" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-hourglass-split me-2"></i>Proses Reset Sedang Berjalan
                        </h5>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-2">
                                <span id="progressCategory">Memulai...</span>
                                <span id="progressPercentage">0%</span>
                            </div>
                            <div class="progress" style="height: 25px;">
                                <div class="progress-bar progress-bar-striped progress-bar-animated" 
                                     id="progressBar" 
                                     role="progressbar" 
                                     style="width: 0%">
                                </div>
                            </div>
                        </div>
                        <div class="text-center">
                            <small class="text-muted" id="progressStatus">Kategori 0 dari 0</small>
                        </div>
                        <div class="alert alert-warning mt-3 mb-0">
                            <i class="bi bi-exclamation-triangle-fill me-2"></i>
                            <small>Jangan tutup browser atau navigasi keluar halaman ini.</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal
    const existing = document.getElementById('progressModal');
    if (existing) existing.remove();

    // Add and show modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('progressModal'));
    modal.show();
}

/**
 * Update progress modal
 */
function updateProgressModal(progress, category, processed, total) {
    const progressBar = document.getElementById('progressBar');
    const progressPercentage = document.getElementById('progressPercentage');
    const progressCategory = document.getElementById('progressCategory');
    const progressStatus = document.getElementById('progressStatus');

    if (progressBar) {
        progressBar.style.width = progress + '%';
        progressBar.textContent = Math.floor(progress) + '%';
    }

    if (progressPercentage) {
        progressPercentage.textContent = Math.floor(progress) + '%';
    }

    if (progressCategory) {
        progressCategory.textContent = category;
    }

    if (progressStatus) {
        progressStatus.textContent = `Kategori ${processed} dari ${total}`;
    }
}

/**
 * Hide progress modal
 */
function hideProgressModal() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('progressModal'));
    if (modal) modal.hide();
}


// ============================================================================
// Result Modals
// ============================================================================

/**
 * Show reset result
 */
function showResetResult(result) {
    hideProgressModal();

    const modalHTML = `
        <div class="modal fade" id="resultModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header ${result.success ? 'bg-success' : 'bg-danger'} text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-${result.success ? 'check-circle-fill' : 'x-circle-fill'} me-2"></i>
                            ${result.success ? 'Reset Berhasil' : 'Reset Gagal'}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${result.success ? `
                            <div class="alert alert-success">
                                <h6 class="alert-heading">
                                    <i class="bi bi-check-circle-fill me-2"></i>Reset Selesai
                                </h6>
                                <p class="mb-0">${result.message}</p>
                            </div>

                            <div class="mb-3">
                                <h6>Ringkasan:</h6>
                                <ul>
                                    <li><strong>${result.deleted.recordCount.toLocaleString('id-ID')}</strong> records dihapus</li>
                                    <li><strong>${result.deleted.categories.length}</strong> kategori diproses</li>
                                    <li><strong>${formatSizeForUI(result.deleted.totalSize)}</strong> ruang dibebaskan</li>
                                    <li>Durasi: <strong>${(result.duration / 1000).toFixed(2)}</strong> detik</li>
                                </ul>
                            </div>

                            ${result.backup.created ? `
                                <div class="alert alert-info">
                                    <i class="bi bi-shield-check me-2"></i>
                                    <strong>Backup berhasil dibuat:</strong> ${result.backup.filename}
                                    <br>
                                    <small>Ukuran: ${formatSizeForUI(result.backup.size)}</small>
                                </div>
                            ` : ''}

                            ${result.warnings.length > 0 ? `
                                <div class="alert alert-warning">
                                    <h6 class="alert-heading">
                                        <i class="bi bi-exclamation-triangle-fill me-2"></i>Peringatan:
                                    </h6>
                                    <ul class="mb-0">
                                        ${result.warnings.map(w => `<li><small>${w}</small></li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}

                            <div class="alert alert-primary mb-0">
                                <i class="bi bi-info-circle-fill me-2"></i>
                                <strong>Langkah Selanjutnya:</strong> Setup koperasi baru dengan mengklik tombol di bawah.
                            </div>
                        ` : `
                            <div class="alert alert-danger">
                                <h6 class="alert-heading">
                                    <i class="bi bi-x-circle-fill me-2"></i>Reset Gagal
                                </h6>
                                <p class="mb-0">${result.message}</p>
                            </div>

                            ${result.errors.length > 0 ? `
                                <div class="mb-3">
                                    <h6>Error:</h6>
                                    <ul class="text-danger mb-0">
                                        ${result.errors.map(e => `<li>${e}</li>`).join('')}
                                    </ul>
                                </div>
                            ` : ''}

                            <div class="alert alert-info mb-0">
                                <i class="bi bi-info-circle-fill me-2"></i>
                                <small>
                                    Jika backup berhasil dibuat, Anda dapat restore data dari file backup.
                                </small>
                            </div>
                        `}
                    </div>
                    <div class="modal-footer">
                        ${result.success ? `
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="bi bi-x-circle me-1"></i>Tutup
                            </button>
                            <button type="button" class="btn btn-primary" onclick="showSetupWizard()">
                                <i class="bi bi-arrow-right me-1"></i>Setup Koperasi Baru
                            </button>
                        ` : `
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="bi bi-x-circle me-1"></i>Tutup
                            </button>
                            <button type="button" class="btn btn-primary" onclick="navigateToBackupRestore()">
                                <i class="bi bi-upload me-1"></i>Restore dari Backup
                            </button>
                        `}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal
    const existing = document.getElementById('resultModal');
    if (existing) existing.remove();

    // Add and show modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('resultModal'));
    modal.show();

    // Reload page after modal is closed if successful
    if (result.success) {
        document.getElementById('resultModal').addEventListener('hidden.bs.modal', () => {
            // Don't reload, let user navigate to setup wizard
        });
    }
}

/**
 * Show dry run result
 */
function showDryRunResult(result) {
    hideProgressModal();

    const modalHTML = `
        <div class="modal fade" id="dryRunResultModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title">
                            <i class="bi bi-bug-fill me-2"></i>Hasil Simulasi (Test Mode)
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-warning">
                            <i class="bi bi-info-circle-fill me-2"></i>
                            <strong>Ini adalah simulasi.</strong> Tidak ada data yang benar-benar dihapus.
                        </div>

                        <div class="mb-3">
                            <h6>Ringkasan Simulasi:</h6>
                            <ul>
                                <li><strong>${result.simulation.recordCount.toLocaleString('id-ID')}</strong> records akan dihapus</li>
                                <li><strong>${result.simulation.categories.length}</strong> kategori akan diproses</li>
                                <li><strong>${formatSizeForUI(result.simulation.totalSize)}</strong> ruang akan dibebaskan</li>
                            </ul>
                        </div>

                        <div class="mb-3">
                            <h6>Log Detail:</h6>
                            <div class="border rounded p-3" style="background-color: #f8f9fa; max-height: 300px; overflow-y: auto;">
                                <pre class="mb-0" style="font-size: 0.85rem;">${result.simulation.log.join('\n')}</pre>
                            </div>
                        </div>

                        <div class="alert alert-info mb-0">
                            <i class="bi bi-lightbulb-fill me-2"></i>
                            <small>
                                Untuk melakukan reset sebenarnya, nonaktifkan Test Mode dan ulangi proses.
                            </small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-1"></i>Tutup
                        </button>
                        <button type="button" class="btn btn-primary" onclick="downloadDryRunReport(${JSON.stringify(result).replace(/"/g, '&quot;')})">
                            <i class="bi bi-download me-1"></i>Download Laporan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal
    const existing = document.getElementById('dryRunResultModal');
    if (existing) existing.remove();

    // Add and show modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('dryRunResultModal'));
    modal.show();
}

// ============================================================================
// Setup Wizard
// ============================================================================

/**
 * Show setup wizard
 */
function showSetupWizard() {
    // Close result modal
    const resultModal = bootstrap.Modal.getInstance(document.getElementById('resultModal'));
    if (resultModal) resultModal.hide();

    // Render setup wizard
    renderSetupWizardPage();
}

/**
 * Render setup wizard page
 */
function renderSetupWizardPage() {
    const content = document.getElementById('mainContent');
    const wizardService = new SetupWizardService();
    const steps = wizardService.getSetupSteps();
    const progress = wizardService.getProgress();

    content.innerHTML = `
        <div class="container-fluid">
            <div class="text-center mb-4">
                <h2 style="color: #2d6a4f; font-weight: 700;">
                    <i class="bi bi-rocket-takeoff-fill me-2"></i>Setup Koperasi Baru
                </h2>
                <p class="text-muted">Ikuti langkah-langkah berikut untuk mengatur koperasi baru</p>
            </div>

            <!-- Progress -->
            <div class="card border-0 shadow-sm mb-4">
                <div class="card-body">
                    <div class="d-flex justify-content-between mb-2">
                        <span>Progress Setup</span>
                        <span><strong>${progress.completedRequired}</strong> dari <strong>${progress.requiredSteps}</strong> langkah wajib</span>
                    </div>
                    <div class="progress" style="height: 25px;">
                        <div class="progress-bar ${progress.isComplete ? 'bg-success' : 'bg-primary'}" 
                             role="progressbar" 
                             style="width: ${progress.percentage}%">
                            ${progress.percentage}%
                        </div>
                    </div>
                </div>
            </div>

            <!-- Setup Steps -->
            <div class="row">
                ${steps.map(step => `
                    <div class="col-md-6 mb-3">
                        <div class="card border-0 shadow-sm h-100 ${step.completed ? 'border-success' : ''}">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <h6 class="mb-0">
                                        ${step.completed ? '<i class="bi bi-check-circle-fill text-success me-2"></i>' : '<i class="bi bi-circle me-2"></i>'}
                                        ${step.title}
                                        ${step.required ? '<span class="badge bg-danger ms-2">Wajib</span>' : '<span class="badge bg-secondary ms-2">Opsional</span>'}
                                    </h6>
                                </div>
                                <p class="text-muted mb-3">${step.description}</p>
                                <button class="btn btn-sm ${step.completed ? 'btn-outline-success' : 'btn-primary'}" 
                                        onclick="navigateToSetupStep('${step.id}')">
                                    <i class="bi bi-${step.completed ? 'check' : 'arrow-right'} me-1"></i>
                                    ${step.completed ? 'Lihat/Edit' : 'Mulai Setup'}
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>

            ${progress.isComplete ? `
                <div class="alert alert-success mt-4">
                    <h5 class="alert-heading">
                        <i class="bi bi-check-circle-fill me-2"></i>Setup Selesai!
                    </h5>
                    <p class="mb-0">
                        Semua langkah wajib telah diselesaikan. Koperasi siap digunakan.
                    </p>
                </div>
            ` : ''}

            <div class="text-center mt-4">
                <button class="btn btn-outline-secondary" onclick="renderResetDataPage()">
                    <i class="bi bi-arrow-left me-1"></i>Kembali ke Reset Data
                </button>
            </div>
        </div>
    `;
}

/**
 * Navigate to setup step
 */
function navigateToSetupStep(stepId) {
    // This would navigate to the actual configuration page
    // For now, just mark as completed for demo
    const wizardService = new SetupWizardService();
    wizardService.completeStep(stepId);
    showResetAlert(`Setup "${stepId}" ditandai sebagai selesai`, 'success');
    renderSetupWizardPage();
}

// ============================================================================
// Test Mode
// ============================================================================

/**
 * Toggle test mode
 */
function toggleTestMode() {
    const currentMode = sessionStorage.getItem(RESET_CONSTANTS.TEST_MODE_KEY) === 'true';
    const newMode = !currentMode;

    if (newMode) {
        // Activating test mode
        sessionStorage.setItem(RESET_CONSTANTS.TEST_MODE_KEY, 'true');
        showResetAlert('Test Mode diaktifkan. Reset tidak akan menghapus data sebenarnya.', 'warning');
    } else {
        // Deactivating test mode - require confirmation
        showTestModeConfirmation();
        return;
    }

    renderResetDataPage();
}

/**
 * Show test mode deactivation confirmation
 */
function showTestModeConfirmation() {
    const modalHTML = `
        <div class="modal fade" id="testModeConfirmModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title">
                            <i class="bi bi-exclamation-triangle-fill me-2"></i>Nonaktifkan Test Mode?
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>Anda akan menonaktifkan Test Mode.</p>
                        <p class="mb-0">
                            <strong>Reset selanjutnya akan menghapus data sebenarnya.</strong>
                        </p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="button" class="btn btn-warning" onclick="confirmDeactivateTestMode()">
                            Nonaktifkan Test Mode
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal
    const existing = document.getElementById('testModeConfirmModal');
    if (existing) existing.remove();

    // Add and show modal
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('testModeConfirmModal'));
    modal.show();
}

/**
 * Confirm deactivate test mode
 */
function confirmDeactivateTestMode() {
    sessionStorage.removeItem(RESET_CONSTANTS.TEST_MODE_KEY);
    const modal = bootstrap.Modal.getInstance(document.getElementById('testModeConfirmModal'));
    if (modal) modal.hide();
    showResetAlert('Test Mode dinonaktifkan. Reset akan menghapus data sebenarnya.', 'info');
    renderResetDataPage();
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get current user for reset
 */
function getCurrentUserForReset() {
    try {
        const userData = localStorage.getItem('currentUser');
        return userData ? JSON.parse(userData) : null;
    } catch (e) {
        return null;
    }
}

/**
 * Format size for UI
 */
function formatSizeForUI(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Show reset alert
 */
function showResetAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px; max-width: 500px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

/**
 * Navigate to backup/restore page
 */
function navigateToBackupRestore() {
    if (typeof renderBackupRestore === 'function') {
        renderBackupRestore();
    } else {
        window.location.hash = '#backup-restore';
    }
}

/**
 * View reset history
 */
function viewResetHistory() {
    // This would show audit logs filtered for reset operations
    showResetAlert('Fitur riwayat reset akan segera tersedia', 'info');
}

/**
 * Download dry run report
 */
function downloadDryRunReport(result) {
    const report = {
        type: 'dry-run-report',
        timestamp: new Date().toISOString(),
        simulation: result.simulation,
        message: result.message
    };

    const jsonString = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reset-simulation-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showResetAlert('Laporan simulasi berhasil diunduh', 'success');
}

// ============================================================================
// Check for post-reset flag on page load
// ============================================================================

/**
 * Check if system was recently reset
 */
function checkPostResetFlag() {
    const resetFlag = localStorage.getItem(RESET_CONSTANTS.RESET_FLAG_KEY);
    if (resetFlag) {
        // Show notification
        showResetAlert(
            '<strong>Sistem telah direset.</strong><br>Silakan setup koperasi baru atau restore dari backup.',
            'warning'
        );
    }
}

// Auto-check on page load
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', checkPostResetFlag);
}

