// Filter dan Hapus Jurnal Module

// ============================================
// DATA STRUCTURES AND INITIALIZATION
// ============================================

/**
 * Initialize default data structures in localStorage if not exists
 */
function initializeJurnalDataStructures() {
    // Initialize audit log if not exists
    if (!localStorage.getItem('auditLog')) {
        localStorage.setItem('auditLog', JSON.stringify([]));
    }
    
    // Initialize closed periods if not exists
    if (!localStorage.getItem('closedPeriods')) {
        localStorage.setItem('closedPeriods', JSON.stringify([]));
    }
    
    // Extend existing journal entries with new fields if needed
    const jurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
    let updated = false;
    
    jurnal.forEach(entry => {
        if (entry.reconciled === undefined) {
            entry.reconciled = false;
            updated = true;
        }
        if (entry.periodClosed === undefined) {
            entry.periodClosed = false;
            updated = true;
        }
        if (entry.deletedAt === undefined) {
            entry.deletedAt = null;
            updated = true;
        }
        if (entry.deletedBy === undefined) {
            entry.deletedBy = null;
            updated = true;
        }
        if (entry.deletedReason === undefined) {
            entry.deletedReason = null;
            updated = true;
        }
    });
    
    if (updated) {
        localStorage.setItem('jurnal', JSON.stringify(jurnal));
    }
}

// ============================================
// DATE UTILITY FUNCTIONS
// ============================================

/**
 * Calculate date range for preset periods
 * @param {string} presetType - 'today', 'thisWeek', 'thisMonth', 'lastMonth'
 * @returns {Object} Object with startDate and endDate in ISO format
 */
function calculatePresetDateRange(presetType) {
    const today = new Date();
    let startDate, endDate;
    
    switch (presetType) {
        case 'today':
            startDate = new Date(today);
            endDate = new Date(today);
            break;
            
        case 'thisWeek':
            // Start of week (Monday)
            const dayOfWeek = today.getDay();
            // If Sunday (0), go back 6 days to Monday
            // If Monday (1), stay at 0
            // If Tuesday (2), go back 1 day to Monday, etc.
            const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            startDate = new Date(today);
            startDate.setDate(today.getDate() + diffToMonday);
            startDate.setHours(0, 0, 0, 0);
            
            // End of week (Sunday)
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            endDate.setHours(23, 59, 59, 999);
            break;
            
        case 'thisMonth':
            // First day of current month
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            
            // Last day of current month
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            break;
            
        case 'lastMonth':
            // First day of last month
            startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            
            // Last day of last month
            endDate = new Date(today.getFullYear(), today.getMonth(), 0);
            break;
            
        default:
            throw new Error(`Unknown preset type: ${presetType}`);
    }
    
    return {
        startDate: formatDateToISO(startDate),
        endDate: formatDateToISO(endDate)
    };
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 * @param {Date} date - Date object
 * @returns {string} ISO formatted date string
 */
function formatDateToISO(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Validate date range
 * @param {string} startDate - Start date in ISO format
 * @param {string} endDate - End date in ISO format
 * @returns {Object} Object with isValid boolean and error message if invalid
 */
function validateDateRange(startDate, endDate) {
    if (!startDate || !endDate) {
        return {
            isValid: false,
            error: 'Mohon isi tanggal awal dan akhir'
        };
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end < start) {
        return {
            isValid: false,
            error: 'Tanggal akhir harus lebih besar atau sama dengan tanggal awal'
        };
    }
    
    // Check if dates are in the future (warning, not error)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (end > today) {
        return {
            isValid: true,
            warning: 'Filter mencakup tanggal di masa depan'
        };
    }
    
    return { isValid: true };
}

// ============================================
// SESSION STORAGE FUNCTIONS
// ============================================

/**
 * Save filter criteria to session storage
 * @param {Object} filterCriteria - Filter criteria object
 */
function saveFilterToSession(filterCriteria) {
    try {
        const data = {
            ...filterCriteria,
            appliedAt: new Date().toISOString()
        };
        sessionStorage.setItem('jurnalFilter', JSON.stringify(data));
    } catch (error) {
        console.warn('SessionStorage unavailable:', error);
    }
}

/**
 * Load filter criteria from session storage
 * @returns {Object|null} Filter criteria object or null if not found
 */
function loadFilterFromSession() {
    try {
        const data = sessionStorage.getItem('jurnalFilter');
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.warn('SessionStorage unavailable:', error);
        return null;
    }
}

/**
 * Clear filter from session storage
 */
function clearFilterFromSession() {
    try {
        sessionStorage.removeItem('jurnalFilter');
    } catch (error) {
        console.warn('SessionStorage unavailable:', error);
    }
}

// ============================================
// FILTER FUNCTIONS
// ============================================

/**
 * Apply date filter to journal entries
 * @param {Array} entries - Journal entries array
 * @param {string} startDate - Start date in ISO format
 * @param {string} endDate - End date in ISO format
 * @returns {Array} Filtered journal entries
 */
function applyDateFilter(entries, startDate, endDate) {
    if (!startDate || !endDate) {
        return entries;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Set time to start and end of day for proper comparison
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    return entries.filter(entry => {
        const entryDate = new Date(entry.tanggal);
        return entryDate >= start && entryDate <= end;
    });
}

// ============================================
// PERMISSION FUNCTIONS
// ============================================

/**
 * Check if user can delete a journal entry
 * @param {Object} jurnalEntry - Journal entry object
 * @param {Object} user - Current user object
 * @returns {Object} Object with canDelete boolean and error message if blocked
 */
function canDeleteJurnal(jurnalEntry, user) {
    // Check if entry is reconciled
    if (jurnalEntry.reconciled) {
        return {
            canDelete: false,
            error: 'Jurnal yang sudah direkonsiliasi tidak dapat dihapus'
        };
    }
    
    // Check if entry is in closed period
    if (jurnalEntry.periodClosed) {
        if (user.role !== 'SuperAdmin') {
            return {
                canDelete: false,
                error: 'Jurnal dari periode tertutup hanya dapat dihapus oleh Super Admin'
            };
        }
        // SuperAdmin can delete, but needs extra confirmation
        return {
            canDelete: true,
            requiresExtraConfirmation: true,
            warning: 'Anda akan menghapus jurnal dari periode tertutup'
        };
    }
    
    return { canDelete: true };
}

// ============================================
// REVERSAL GENERATION FUNCTIONS
// ============================================

/**
 * Generate reversal entries for a journal entry
 * @param {Object} jurnalEntry - Original journal entry
 * @returns {Object} Reversal journal entry
 */
function generateReversalEntries(jurnalEntry) {
    const reversalEntries = jurnalEntry.entries.map(entry => ({
        akun: entry.akun,
        debit: entry.kredit, // Swap debit and credit
        kredit: entry.debit
    }));
    
    return {
        id: generateId(),
        tanggal: new Date().toISOString().split('T')[0],
        keterangan: `REVERSAL: ${jurnalEntry.keterangan} (Ref: ${jurnalEntry.id})`,
        entries: reversalEntries,
        reconciled: false,
        periodClosed: false,
        deletedAt: null,
        deletedBy: null,
        deletedReason: null,
        isReversal: true,
        originalEntryId: jurnalEntry.id
    };
}

/**
 * Calculate balance impact of deleting a journal entry
 * @param {Object} jurnalEntry - Journal entry object
 * @param {Array} coa - Chart of accounts array
 * @returns {Object} Balance impact per account
 */
function calculateBalanceImpact(jurnalEntry, coa) {
    const impact = {};
    
    jurnalEntry.entries.forEach(entry => {
        const akun = coa.find(c => c.kode === entry.akun);
        const akunNama = akun ? akun.nama : entry.akun;
        const akunTipe = akun ? akun.tipe : 'Unknown';
        
        if (!impact[entry.akun]) {
            impact[entry.akun] = {
                kode: entry.akun,
                nama: akunNama,
                tipe: akunTipe,
                debit: 0,
                kredit: 0,
                netImpact: 0
            };
        }
        
        impact[entry.akun].debit += entry.debit;
        impact[entry.akun].kredit += entry.kredit;
        
        // Calculate net impact based on account type
        if (akunTipe === 'Aset' || akunTipe === 'Beban') {
            impact[entry.akun].netImpact = entry.debit - entry.kredit;
        } else {
            impact[entry.akun].netImpact = entry.kredit - entry.debit;
        }
    });
    
    return impact;
}

// ============================================
// AUDIT LOG FUNCTIONS
// ============================================

/**
 * Create audit log entry
 * @param {string} action - Action type (e.g., 'DELETE_JOURNAL', 'CREATE_REVERSAL')
 * @param {Object} details - Details object
 * @param {string} priority - Priority level ('normal', 'high')
 * @returns {Object} Audit log entry
 */
function createAuditLog(action, details, priority = 'normal') {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    const auditEntry = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        action: action,
        userId: user.id || 'unknown',
        userName: user.username || 'unknown',
        userRole: user.role || 'unknown',
        priority: priority,
        details: details
    };
    
    const auditLog = JSON.parse(localStorage.getItem('auditLog') || '[]');
    auditLog.push(auditEntry);
    localStorage.setItem('auditLog', JSON.stringify(auditLog));
    
    return auditEntry;
}

/**
 * Link reversal entries to original entry in audit log
 * @param {string} originalId - Original journal entry ID
 * @param {string} reversalId - Reversal journal entry ID
 */
function linkReversalToOriginal(originalId, reversalId) {
    const auditLog = JSON.parse(localStorage.getItem('auditLog') || '[]');
    
    // Find the delete audit entry for the original
    const deleteEntry = auditLog.find(
        log => log.action === 'DELETE_JOURNAL' && 
               log.details.jurnalId === originalId
    );
    
    if (deleteEntry) {
        if (!deleteEntry.details.reversalIds) {
            deleteEntry.details.reversalIds = [];
        }
        deleteEntry.details.reversalIds.push(reversalId);
        localStorage.setItem('auditLog', JSON.stringify(auditLog));
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Initialize data structures on module load
if (typeof window !== 'undefined') {
    initializeJurnalDataStructures();
}

// ============================================
// UI RENDERING FUNCTIONS
// ============================================

/**
 * Render date filter UI component
 * @returns {string} HTML string for date filter UI
 */
function renderJurnalDateFilter() {
    // Load saved filter from session if exists
    const savedFilter = loadFilterFromSession();
    const startDate = savedFilter ? savedFilter.startDate : '';
    const endDate = savedFilter ? savedFilter.endDate : '';
    const activePreset = savedFilter ? savedFilter.preset : null;
    
    return `
        <div class="card mb-3" id="jurnalFilterCard">
            <div class="card-body">
                <h6 class="card-title mb-3">
                    <i class="bi bi-funnel me-2"></i>Filter Tanggal
                </h6>
                <div class="row g-3">
                    <div class="col-md-3">
                        <label class="form-label">Tanggal Awal</label>
                        <input type="date" class="form-control" id="jurnalStartDate" 
                               value="${startDate}" onchange="handleManualDateChange()">
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Tanggal Akhir</label>
                        <input type="date" class="form-control" id="jurnalEndDate" 
                               value="${endDate}" onchange="handleManualDateChange()">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label">Preset Periode</label>
                        <div class="btn-group w-100" role="group">
                            <button type="button" class="btn btn-outline-primary ${activePreset === 'today' ? 'active' : ''}" 
                                    onclick="setJurnalPreset('today')">Hari Ini</button>
                            <button type="button" class="btn btn-outline-primary ${activePreset === 'thisWeek' ? 'active' : ''}" 
                                    onclick="setJurnalPreset('thisWeek')">Minggu Ini</button>
                            <button type="button" class="btn btn-outline-primary ${activePreset === 'thisMonth' ? 'active' : ''}" 
                                    onclick="setJurnalPreset('thisMonth')">Bulan Ini</button>
                            <button type="button" class="btn btn-outline-primary ${activePreset === 'lastMonth' ? 'active' : ''}" 
                                    onclick="setJurnalPreset('lastMonth')">Bulan Lalu</button>
                        </div>
                    </div>
                </div>
                <div class="row mt-3">
                    <div class="col-12">
                        <div id="filterValidationMessage" class="alert d-none" role="alert"></div>
                    </div>
                </div>
                <div class="row mt-2">
                    <div class="col-12">
                        <button type="button" class="btn btn-primary" onclick="applyJurnalDateFilter()">
                            <i class="bi bi-check-circle me-1"></i>Terapkan Filter
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="clearJurnalDateFilter()">
                            <i class="bi bi-x-circle me-1"></i>Hapus Filter
                        </button>
                        <span id="filterStatus" class="ms-3 text-muted"></span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Set preset date range
 * @param {string} presetType - 'today', 'thisWeek', 'thisMonth', 'lastMonth'
 */
function setJurnalPreset(presetType) {
    try {
        const dateRange = calculatePresetDateRange(presetType);
        
        // Update date inputs
        document.getElementById('jurnalStartDate').value = dateRange.startDate;
        document.getElementById('jurnalEndDate').value = dateRange.endDate;
        
        // Update active preset button
        document.querySelectorAll('#jurnalFilterCard .btn-group button').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Store preset in a data attribute for later reference
        document.getElementById('jurnalFilterCard').setAttribute('data-active-preset', presetType);
        
    } catch (error) {
        console.error('Error setting preset:', error);
        showFilterError('Gagal mengatur preset tanggal');
    }
}

/**
 * Handle manual date change - clear preset selection
 */
function handleManualDateChange() {
    // Clear all active preset buttons
    document.querySelectorAll('#jurnalFilterCard .btn-group button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Clear preset data attribute
    const filterCard = document.getElementById('jurnalFilterCard');
    if (filterCard) {
        filterCard.removeAttribute('data-active-preset');
    }
}

/**
 * Apply date filter to journal list
 */
function applyJurnalDateFilter() {
    const startDate = document.getElementById('jurnalStartDate').value;
    const endDate = document.getElementById('jurnalEndDate').value;
    
    // Validate date range
    const validation = validateDateRange(startDate, endDate);
    
    if (!validation.isValid) {
        showFilterError(validation.error);
        return;
    }
    
    // Show warning if exists
    if (validation.warning) {
        showFilterWarning(validation.warning);
    }
    
    // Get active preset if any
    const filterCard = document.getElementById('jurnalFilterCard');
    const activePreset = filterCard ? filterCard.getAttribute('data-active-preset') : null;
    
    // Save filter to session
    saveFilterToSession({
        startDate: startDate,
        endDate: endDate,
        preset: activePreset
    });
    
    // Re-render journal with filter applied
    renderJurnal();
    
    // Show success message
    showFilterSuccess(`Filter diterapkan: ${formatDate(startDate)} - ${formatDate(endDate)}`);
}

/**
 * Clear date filter
 */
function clearJurnalDateFilter() {
    // Clear date inputs
    document.getElementById('jurnalStartDate').value = '';
    document.getElementById('jurnalEndDate').value = '';
    
    // Clear active preset buttons
    document.querySelectorAll('#jurnalFilterCard .btn-group button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Clear preset data attribute
    const filterCard = document.getElementById('jurnalFilterCard');
    if (filterCard) {
        filterCard.removeAttribute('data-active-preset');
    }
    
    // Clear session storage
    clearFilterFromSession();
    
    // Re-render journal without filter
    renderJurnal();
    
    // Clear validation messages
    hideFilterMessage();
    
    // Show success message
    showFilterSuccess('Filter dihapus, menampilkan semua data');
}

/**
 * Show filter error message
 * @param {string} message - Error message
 */
function showFilterError(message) {
    const messageDiv = document.getElementById('filterValidationMessage');
    if (messageDiv) {
        messageDiv.className = 'alert alert-danger';
        messageDiv.textContent = message;
        messageDiv.classList.remove('d-none');
    }
}

/**
 * Show filter warning message
 * @param {string} message - Warning message
 */
function showFilterWarning(message) {
    const messageDiv = document.getElementById('filterValidationMessage');
    if (messageDiv) {
        messageDiv.className = 'alert alert-warning';
        messageDiv.textContent = message;
        messageDiv.classList.remove('d-none');
    }
}

/**
 * Show filter success message
 * @param {string} message - Success message
 */
function showFilterSuccess(message) {
    const statusSpan = document.getElementById('filterStatus');
    if (statusSpan) {
        statusSpan.textContent = message;
        statusSpan.className = 'ms-3 text-success';
    }
    hideFilterMessage();
}

/**
 * Hide filter validation message
 */
function hideFilterMessage() {
    const messageDiv = document.getElementById('filterValidationMessage');
    if (messageDiv) {
        messageDiv.classList.add('d-none');
    }
}

// ============================================
// DELETE CONFIRMATION DIALOG
// ============================================

/**
 * Show delete confirmation dialog for a journal entry
 * @param {string} jurnalId - Journal entry ID
 */
function showDeleteJurnalConfirmation(jurnalId) {
    // Get journal entry
    const jurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
    const entry = jurnal.find(j => j.id === jurnalId);
    
    if (!entry) {
        if (typeof showAlert === 'function') {
            showAlert('Entri jurnal tidak ditemukan', 'danger');
        } else {
            alert('Entri jurnal tidak ditemukan');
        }
        return;
    }
    
    // Get current user
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    // Check permissions
    const permission = canDeleteJurnal(entry, user);
    
    if (!permission.canDelete) {
        if (typeof showAlert === 'function') {
            showAlert(permission.error, 'danger');
        } else {
            alert(permission.error);
        }
        return;
    }
    
    // Get COA for account names
    const coa = JSON.parse(localStorage.getItem('coa') || '[]');
    
    // Calculate balance impact
    const balanceImpact = calculateBalanceImpact(entry, coa);
    
    // Create modal HTML
    const modalHtml = createDeleteConfirmationModal(entry, balanceImpact, permission, coa);
    
    // Remove existing modal if present
    const existingModal = document.getElementById('deleteJurnalModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('deleteJurnalModal'));
    modal.show();
    
    // Clean up modal after it's hidden
    document.getElementById('deleteJurnalModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

/**
 * Create HTML for delete confirmation modal
 * @param {Object} entry - Journal entry object
 * @param {Object} balanceImpact - Balance impact per account
 * @param {Object} permission - Permission check result
 * @param {Array} coa - Chart of accounts
 * @returns {string} Modal HTML
 */
function createDeleteConfirmationModal(entry, balanceImpact, permission, coa) {
    // Format date for display
    const formattedDate = typeof formatDate === 'function' 
        ? formatDate(entry.tanggal) 
        : new Date(entry.tanggal).toLocaleDateString('id-ID');
    
    // Format currency
    const formatCurrency = (amount) => {
        if (typeof formatRupiah === 'function') {
            return formatRupiah(amount);
        }
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };
    
    // Build entry details table
    let entryDetailsHtml = '';
    entry.entries.forEach(e => {
        const akun = coa.find(c => c.kode === e.akun);
        const akunNama = akun ? akun.nama : e.akun;
        
        entryDetailsHtml += `
            <tr>
                <td><strong>${e.akun}</strong><br><small class="text-muted">${akunNama}</small></td>
                <td class="text-end">${e.debit > 0 ? formatCurrency(e.debit) : '-'}</td>
                <td class="text-end">${e.kredit > 0 ? formatCurrency(e.kredit) : '-'}</td>
            </tr>
        `;
    });
    
    // Calculate totals
    const totalDebit = entry.entries.reduce((sum, e) => sum + e.debit, 0);
    const totalKredit = entry.entries.reduce((sum, e) => sum + e.kredit, 0);
    
    // Check if journal is balanced
    const isBalanced = totalDebit === totalKredit;
    const balanceWarningHtml = !isBalanced ? `
        <div class="alert alert-danger mb-3">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            <strong>Peringatan:</strong> Jurnal ini tidak seimbang! Total Debit (${formatCurrency(totalDebit)}) tidak sama dengan Total Kredit (${formatCurrency(totalKredit)}). 
            Jurnal yang tidak seimbang menunjukkan kesalahan data dan sebaiknya diperbaiki terlebih dahulu sebelum dihapus.
        </div>
    ` : '';
    
    entryDetailsHtml += `
        <tr class="table-secondary fw-bold">
            <td>TOTAL</td>
            <td class="text-end">${formatCurrency(totalDebit)}</td>
            <td class="text-end">${formatCurrency(totalKredit)}</td>
        </tr>
    `;
    
    // Build balance impact table
    let balanceImpactHtml = '';
    Object.values(balanceImpact).forEach(impact => {
        const impactClass = impact.netImpact > 0 ? 'text-success' : impact.netImpact < 0 ? 'text-danger' : 'text-muted';
        const impactSign = impact.netImpact > 0 ? '+' : '';
        
        balanceImpactHtml += `
            <tr>
                <td><strong>${impact.kode}</strong><br><small class="text-muted">${impact.nama}</small></td>
                <td><span class="badge bg-secondary">${impact.tipe}</span></td>
                <td class="text-end">${formatCurrency(impact.debit)}</td>
                <td class="text-end">${formatCurrency(impact.kredit)}</td>
                <td class="text-end ${impactClass}"><strong>${impactSign}${formatCurrency(Math.abs(impact.netImpact))}</strong></td>
            </tr>
        `;
    });
    
    // Extra confirmation warning for SuperAdmin deleting closed period
    const extraWarningHtml = permission.requiresExtraConfirmation ? `
        <div class="alert alert-warning mb-3">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            <strong>Peringatan:</strong> ${permission.warning}
            <div class="form-check mt-2">
                <input class="form-check-input" type="checkbox" id="confirmClosedPeriod">
                <label class="form-check-label" for="confirmClosedPeriod">
                    Saya memahami risiko menghapus jurnal dari periode tertutup
                </label>
            </div>
        </div>
    ` : '';
    
    return `
        <div class="modal fade" id="deleteJurnalModal" tabindex="-1" aria-labelledby="deleteJurnalModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title" id="deleteJurnalModalLabel">
                            <i class="bi bi-exclamation-triangle-fill me-2"></i>Konfirmasi Hapus Jurnal
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        ${balanceWarningHtml}
                        ${extraWarningHtml}
                        
                        <div class="alert alert-info">
                            <i class="bi bi-info-circle me-2"></i>
                            Menghapus jurnal akan membuat entri reversal untuk menjaga keseimbangan akuntansi.
                        </div>
                        
                        <h6 class="mb-3"><i class="bi bi-file-text me-2"></i>Detail Jurnal</h6>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <p class="mb-1"><strong>Tanggal:</strong></p>
                                <p class="text-muted">${formattedDate}</p>
                            </div>
                            <div class="col-md-6">
                                <p class="mb-1"><strong>ID Jurnal:</strong></p>
                                <p class="text-muted"><code>${entry.id}</code></p>
                            </div>
                        </div>
                        <div class="row mb-4">
                            <div class="col-12">
                                <p class="mb-1"><strong>Keterangan:</strong></p>
                                <p class="text-muted">${entry.keterangan}</p>
                            </div>
                        </div>
                        
                        <h6 class="mb-3"><i class="bi bi-table me-2"></i>Entri Jurnal</h6>
                        <div class="table-responsive mb-4">
                            <table class="table table-bordered table-sm">
                                <thead class="table-light">
                                    <tr>
                                        <th>Akun</th>
                                        <th class="text-end">Debit</th>
                                        <th class="text-end">Kredit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${entryDetailsHtml}
                                </tbody>
                            </table>
                        </div>
                        
                        <h6 class="mb-3"><i class="bi bi-calculator me-2"></i>Dampak pada Saldo Akun</h6>
                        <div class="table-responsive mb-4">
                            <table class="table table-bordered table-sm">
                                <thead class="table-light">
                                    <tr>
                                        <th>Akun</th>
                                        <th>Tipe</th>
                                        <th class="text-end">Debit</th>
                                        <th class="text-end">Kredit</th>
                                        <th class="text-end">Dampak Bersih</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${balanceImpactHtml}
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="mb-3">
                            <label for="deleteReason" class="form-label">
                                <i class="bi bi-chat-left-text me-2"></i>Alasan Penghapusan (Opsional)
                            </label>
                            <textarea class="form-control" id="deleteReason" rows="3" 
                                      placeholder="Masukkan alasan penghapusan jurnal ini untuk audit trail..."></textarea>
                            <small class="text-muted">Alasan ini akan disimpan dalam log audit untuk keperluan dokumentasi.</small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-1"></i>Batal
                        </button>
                        <button type="button" class="btn btn-danger" onclick="confirmDeleteJurnal('${entry.id}', ${permission.requiresExtraConfirmation})">
                            <i class="bi bi-trash me-1"></i>Hapus Jurnal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Confirm and execute journal deletion
 * @param {string} jurnalId - Journal entry ID
 * @param {boolean} requiresExtraConfirmation - Whether extra confirmation is needed
 */
function confirmDeleteJurnal(jurnalId, requiresExtraConfirmation) {
    // Check extra confirmation for closed period if required
    if (requiresExtraConfirmation) {
        const checkbox = document.getElementById('confirmClosedPeriod');
        if (!checkbox || !checkbox.checked) {
            if (typeof showAlert === 'function') {
                showAlert('Mohon centang konfirmasi untuk melanjutkan penghapusan', 'warning');
            } else {
                alert('Mohon centang konfirmasi untuk melanjutkan penghapusan');
            }
            return;
        }
    }
    
    // Get reason from textarea
    const reasonInput = document.getElementById('deleteReason');
    const reason = reasonInput ? reasonInput.value.trim() : null;
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteJurnalModal'));
    if (modal) {
        modal.hide();
    }
    
    // Execute deletion
    try {
        const result = deleteJurnalEntry(jurnalId, reason);
        
        if (result.success) {
            // Show success message
            if (typeof showAlert === 'function') {
                showAlert(result.message, 'success');
            } else {
                alert(result.message);
            }
            
            // Refresh journal list
            if (typeof renderJurnal === 'function') {
                renderJurnal();
            }
        } else {
            // Show error message
            if (typeof showAlert === 'function') {
                showAlert(result.message, 'danger');
            } else {
                alert('Error: ' + result.message);
            }
        }
    } catch (error) {
        console.error('Error deleting journal:', error);
        if (typeof showAlert === 'function') {
            showAlert('Terjadi kesalahan saat menghapus jurnal: ' + error.message, 'danger');
        } else {
            alert('Terjadi kesalahan saat menghapus jurnal: ' + error.message);
        }
    }
}

/**
 * Main deletion function - orchestrates the complete deletion process
 * @param {string} jurnalId - Journal entry ID
 * @param {string} reason - Deletion reason
 * @returns {Object} Result object with success status and message
 */
function deleteJurnalEntry(jurnalId, reason) {
    // Get current user
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    // Get journal entry first (needed for permission check)
    const jurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
    const jurnalIndex = jurnal.findIndex(j => j.id === jurnalId);
    
    if (jurnalIndex === -1) {
        return {
            success: false,
            message: 'Entri jurnal tidak ditemukan',
            errors: ['Entri jurnal tidak ditemukan']
        };
    }
    
    const jurnalEntry = jurnal[jurnalIndex];
    
    // Check permissions (pass jurnalEntry object, not ID)
    const permissionResult = canDeleteJurnal(jurnalEntry, currentUser);
    if (!permissionResult.canDelete) {
        return {
            success: false,
            message: permissionResult.error || 'Tidak memiliki izin untuk menghapus jurnal',
            errors: [permissionResult.error || 'Permission denied']
        };
    }
    
    // Generate reversal entries
    const reversalEntries = generateReversalEntries(jurnalEntry);
    
    // Update COA balances (reverse the original impact)
    const balanceUpdateResult = updateCOABalancesForDeletion(jurnalEntry);
    
    if (!balanceUpdateResult.success) {
        return {
            success: false,
            message: 'Gagal memperbarui saldo COA: ' + balanceUpdateResult.message,
            errors: balanceUpdateResult.errors || []
        };
    }
    
    // Remove original entry from jurnal array
    jurnal.splice(jurnalIndex, 1);
    localStorage.setItem('jurnal', JSON.stringify(jurnal));
    
    // Create audit log entry
    const auditLog = createAuditLog(
        'DELETE_JOURNAL',
        {
            jurnalId: jurnalEntry.id,
            tanggal: jurnalEntry.tanggal,
            keterangan: jurnalEntry.keterangan,
            entries: jurnalEntry.entries,
            reason: reason,
            balanceImpact: balanceUpdateResult.adjustments,
            reversalEntries: reversalEntries
        },
        jurnalEntry.periodClosed ? 'high' : 'normal'
    );
    
    const auditLogId = auditLog.id;
    
    return {
        success: true,
        message: 'Jurnal berhasil dihapus',
        auditLogId: auditLogId,
        adjustments: balanceUpdateResult.adjustments
    };
}

/**
 * Update COA balances when deleting a journal entry
 * @param {Object} jurnalEntry - Journal entry to reverse
 * @returns {Object} Result with success status and adjustments
 */
function updateCOABalancesForDeletion(jurnalEntry) {
    if (!jurnalEntry || !jurnalEntry.entries || jurnalEntry.entries.length === 0) {
        return {
            success: false,
            message: 'Jurnal tidak valid atau tidak memiliki entries',
            adjustments: [],
            errors: ['Jurnal tidak valid']
        };
    }
    
    const coa = JSON.parse(localStorage.getItem('coa') || '[]');
    const adjustments = [];
    const errors = [];
    
    try {
        // Reverse each journal entry
        for (const entry of jurnalEntry.entries) {
            const account = coa.find(a => a.kode === entry.akun);
            
            if (!account) {
                errors.push(`Akun ${entry.akun} tidak ditemukan`);
                continue;
            }
            
            // Store balance before adjustment
            const balanceBefore = account.saldo || 0;
            
            // Reverse the balance impact
            // For Aset and Beban accounts: debit increases, credit decreases
            // For Kewajiban, Modal, Pendapatan: credit increases, debit decreases
            const isDebitAccount = ['Aset', 'Beban'].includes(account.tipe);
            
            if (entry.debit > 0) {
                // Original was debit, so we reverse by subtracting
                if (isDebitAccount) {
                    account.saldo -= entry.debit;
                } else {
                    account.saldo += entry.debit;
                }
            }
            
            if (entry.kredit > 0) {
                // Original was credit, so we reverse by subtracting
                if (isDebitAccount) {
                    account.saldo += entry.kredit;
                } else {
                    account.saldo -= entry.kredit;
                }
            }
            
            // Record the adjustment
            adjustments.push({
                accountCode: entry.akun,
                accountName: account.nama,
                accountType: account.tipe,
                balanceBefore: balanceBefore,
                balanceAfter: account.saldo,
                originalDebit: entry.debit,
                originalKredit: entry.kredit
            });
        }
        
        // Save updated COA
        localStorage.setItem('coa', JSON.stringify(coa));
        
        // Check if there were any errors
        if (errors.length > 0) {
            return {
                success: false,
                message: `Terjadi ${errors.length} kesalahan saat penyesuaian saldo`,
                adjustments: adjustments,
                errors: errors
            };
        }
        
        return {
            success: true,
            message: `Berhasil menyesuaikan ${adjustments.length} akun`,
            adjustments: adjustments,
            errors: []
        };
        
    } catch (error) {
        return {
            success: false,
            message: 'Terjadi kesalahan sistem saat penyesuaian saldo',
            adjustments: adjustments,
            errors: [error.message]
        };
    }
}

// Make functions available globally for onclick handlers and other modules
if (typeof window !== 'undefined') {
    window.showDeleteJurnalConfirmation = showDeleteJurnalConfirmation;
    window.confirmDeleteJurnal = confirmDeleteJurnal;
    window.clearFilterFromSession = clearFilterFromSession;
    window.setJurnalPreset = setJurnalPreset;
    window.handleManualDateChange = handleManualDateChange;
    window.applyJurnalDateFilter = applyJurnalDateFilter;
    window.clearJurnalDateFilter = clearJurnalDateFilter;
}

// Export functions for testing
// Note: Export commented out for browser compatibility
// Uncomment if using ES6 modules or for testing with Node.js
/*
export {
    calculatePresetDateRange,
    formatDateToISO,
    validateDateRange,
    saveFilterToSession,
    loadFilterFromSession,
    clearFilterFromSession,
    applyDateFilter,
    canDeleteJurnal,
    generateReversalEntries,
    calculateBalanceImpact,
    createAuditLog,
    linkReversalToOriginal,
    generateId,
    handleManualDateChange,
    createDeleteConfirmationModal,
    showDeleteJurnalConfirmation,
    confirmDeleteJurnal
};
*/
