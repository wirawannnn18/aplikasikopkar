// Pengajuan Modal Kasir Module

/**
 * Initialize pengajuan modal data structure
 * Called during app initialization
 */
function initializePengajuanModalData() {
    // Initialize pengajuan modal array if not exists
    if (!localStorage.getItem('pengajuanModal')) {
        localStorage.setItem('pengajuanModal', JSON.stringify([]));
    }
    
    // Initialize system settings for pengajuan modal if not exists
    if (!localStorage.getItem('pengajuanModalSettings')) {
        const defaultSettings = {
            enabled: true,                  // Enable/disable fitur
            batasMaximum: 5000000,         // Batas maksimum pengajuan (Rp 5 juta)
            requireApproval: true,          // Wajib approval atau tidak
            autoApproveAmount: 1000000      // Auto-approve jika <= amount ini (Rp 1 juta)
        };
        localStorage.setItem('pengajuanModalSettings', JSON.stringify(defaultSettings));
    }
    
    // Initialize notification data structure if not exists
    if (!localStorage.getItem('notifications')) {
        localStorage.setItem('notifications', JSON.stringify([]));
    }
    
    // Initialize audit trail for pengajuan modal if not exists
    if (!localStorage.getItem('pengajuanModalAudit')) {
        localStorage.setItem('pengajuanModalAudit', JSON.stringify([]));
    }
}

/**
 * Get pengajuan modal settings
 * @returns {Object} Settings object
 */
function getPengajuanModalSettings() {
    const settings = localStorage.getItem('pengajuanModalSettings');
    if (!settings) {
        // Return default if not found
        return {
            enabled: true,
            batasMaximum: 5000000,
            requireApproval: true,
            autoApproveAmount: 1000000
        };
    }
    return JSON.parse(settings);
}

/**
 * Update pengajuan modal settings
 * @param {Object} newSettings - New settings object
 * @returns {boolean} Success status
 */
function updatePengajuanModalSettings(newSettings) {
    try {
        // Validate settings
        if (typeof newSettings.enabled !== 'boolean') {
            throw new Error('enabled harus berupa boolean');
        }
        if (typeof newSettings.batasMaximum !== 'number' || newSettings.batasMaximum <= 0) {
            throw new Error('batasMaximum harus berupa angka positif');
        }
        if (typeof newSettings.requireApproval !== 'boolean') {
            throw new Error('requireApproval harus berupa boolean');
        }
        if (typeof newSettings.autoApproveAmount !== 'number' || newSettings.autoApproveAmount < 0) {
            throw new Error('autoApproveAmount harus berupa angka non-negatif');
        }
        
        // Save settings
        localStorage.setItem('pengajuanModalSettings', JSON.stringify(newSettings));
        
        // Log audit trail
        logPengajuanModalAudit({
            action: 'UPDATE_SETTINGS',
            userId: currentUser ? currentUser.id : null,
            userName: currentUser ? currentUser.name : 'System',
            timestamp: new Date().toISOString(),
            details: {
                oldSettings: getPengajuanModalSettings(),
                newSettings: newSettings
            }
        });
        
        return true;
    } catch (error) {
        console.error('Error updating pengajuan modal settings:', error);
        return false;
    }
}

/**
 * Log audit trail for pengajuan modal
 * @param {Object} auditEntry - Audit entry object
 */
function logPengajuanModalAudit(auditEntry) {
    try {
        const audit = JSON.parse(localStorage.getItem('pengajuanModalAudit') || '[]');
        
        // Add unique ID and ensure immutability
        const entry = {
            id: generateId(),
            ...auditEntry,
            timestamp: auditEntry.timestamp || new Date().toISOString()
        };
        
        // Freeze object to make it immutable
        Object.freeze(entry);
        
        audit.push(entry);
        localStorage.setItem('pengajuanModalAudit', JSON.stringify(audit));
    } catch (error) {
        console.error('Error logging audit trail:', error);
    }
}

/**
 * Get audit trail for pengajuan modal
 * @param {Object} filters - Optional filters
 * @returns {Array} Array of audit entries
 */
function getPengajuanModalAudit(filters = {}) {
    try {
        let audit = JSON.parse(localStorage.getItem('pengajuanModalAudit') || '[]');
        
        // Apply filters if provided
        if (filters.pengajuanId) {
            audit = audit.filter(a => a.pengajuanId === filters.pengajuanId);
        }
        
        if (filters.action) {
            audit = audit.filter(a => a.action === filters.action);
        }
        
        if (filters.userId) {
            audit = audit.filter(a => a.userId === filters.userId);
        }
        
        if (filters.startDate) {
            audit = audit.filter(a => new Date(a.timestamp) >= new Date(filters.startDate));
        }
        
        if (filters.endDate) {
            audit = audit.filter(a => new Date(a.timestamp) <= new Date(filters.endDate));
        }
        
        // Sort by timestamp descending (newest first)
        audit.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return audit;
    } catch (error) {
        console.error('Error getting audit trail:', error);
        return [];
    }
}

/**
 * Validate if pengajuan modal feature is enabled
 * @returns {boolean} True if enabled
 */
function isPengajuanModalEnabled() {
    const settings = getPengajuanModalSettings();
    return settings.enabled === true;
}

/**
 * Get all pengajuan modal
 * @returns {Array} Array of pengajuan modal
 */
function getAllPengajuanModal() {
    try {
        return JSON.parse(localStorage.getItem('pengajuanModal') || '[]');
    } catch (error) {
        console.error('Error getting pengajuan modal:', error);
        return [];
    }
}

/**
 * Save pengajuan modal array
 * @param {Array} pengajuanArray - Array of pengajuan modal
 * @returns {boolean} Success status
 */
function savePengajuanModal(pengajuanArray) {
    try {
        localStorage.setItem('pengajuanModal', JSON.stringify(pengajuanArray));
        return true;
    } catch (error) {
        console.error('Error saving pengajuan modal:', error);
        return false;
    }
}

/**
 * Check if kasir has active shift
 * @param {string} kasirId - ID kasir
 * @returns {boolean} True if kasir has active shift
 */
function hasActiveShift(kasirId) {
    try {
        // Check session storage for current active shift
        const bukaKas = sessionStorage.getItem('bukaKas');
        if (bukaKas) {
            const shiftData = JSON.parse(bukaKas);
            if (shiftData.kasirId === kasirId) {
                return true;
            }
        }
        
        // Check if there's any unclosed shift in tutupKas data
        const tutupKas = JSON.parse(localStorage.getItem('tutupKas') || '[]');
        const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
        
        // Get all shift IDs that have been closed
        const closedShiftIds = tutupKas.map(tk => tk.shiftId);
        
        // Check if there are any transactions from this kasir that don't have a closed shift
        const kasirTransactions = penjualan.filter(p => p.kasir === kasirId || p.kasirId === kasirId);
        
        // For simplicity, we'll just check session storage
        // A more robust implementation would track all shifts in localStorage
        return false;
    } catch (error) {
        console.error('Error checking active shift:', error);
        return false;
    }
}

/**
 * Check if kasir has pending pengajuan
 * @param {string} kasirId - ID kasir
 * @returns {Object|null} Pending pengajuan or null
 */
function hasPendingPengajuan(kasirId) {
    try {
        const pengajuanList = getAllPengajuanModal();
        const pending = pengajuanList.find(p => p.kasirId === kasirId && p.status === 'pending');
        return pending || null;
    } catch (error) {
        console.error('Error checking pending pengajuan:', error);
        return null;
    }
}

/**
 * Validate jumlah modal
 * @param {number} jumlah - Jumlah modal yang diminta
 * @returns {Object} Validation result {valid: boolean, error: string}
 */
function validateJumlahModal(jumlah) {
    const settings = getPengajuanModalSettings();
    
    // Check if jumlah is a positive number
    if (typeof jumlah !== 'number' || isNaN(jumlah)) {
        return {
            valid: false,
            error: 'Jumlah modal harus berupa angka'
        };
    }
    
    if (jumlah <= 0) {
        return {
            valid: false,
            error: 'Jumlah modal harus lebih besar dari 0'
        };
    }
    
    // Check if jumlah exceeds maximum limit
    if (jumlah > settings.batasMaximum) {
        return {
            valid: false,
            error: `Jumlah modal melebihi batas maksimum ${formatRupiah(settings.batasMaximum)}`
        };
    }
    
    return {
        valid: true,
        error: null
    };
}

/**
 * Create new pengajuan modal
 * @param {string} kasirId - ID kasir
 * @param {string} kasirName - Nama kasir
 * @param {number} jumlah - Jumlah modal yang diminta
 * @param {string} keterangan - Keterangan pengajuan
 * @returns {Object} Result {success: boolean, message: string, data: Object}
 */
function createPengajuanModal(kasirId, kasirName, jumlah, keterangan) {
    try {
        // Check if feature is enabled
        if (!isPengajuanModalEnabled()) {
            return {
                success: false,
                message: 'Fitur pengajuan modal tidak aktif',
                data: null
            };
        }
        
        // Validate kasir doesn't have active shift
        if (hasActiveShift(kasirId)) {
            return {
                success: false,
                message: 'Tidak dapat mengajukan modal. Anda masih memiliki shift kasir aktif',
                data: null
            };
        }
        
        // Check if kasir already has pending pengajuan
        const existingPending = hasPendingPengajuan(kasirId);
        if (existingPending) {
            return {
                success: false,
                message: 'Anda masih memiliki pengajuan modal yang menunggu persetujuan',
                data: null
            };
        }
        
        // Validate jumlah modal
        const validation = validateJumlahModal(jumlah);
        if (!validation.valid) {
            return {
                success: false,
                message: validation.error,
                data: null
            };
        }
        
        // Create pengajuan object
        const pengajuan = {
            id: generateId(),
            kasirId: kasirId,
            kasirName: kasirName,
            jumlahDiminta: jumlah,
            keterangan: keterangan || '',
            status: 'pending',
            tanggalPengajuan: new Date().toISOString(),
            
            // Approval/Rejection data
            adminId: null,
            adminName: null,
            tanggalProses: null,
            alasanPenolakan: null,
            
            // Usage tracking
            shiftId: null,
            tanggalDigunakan: null
        };
        
        // Save to localStorage
        const pengajuanList = getAllPengajuanModal();
        pengajuanList.push(pengajuan);
        
        if (!savePengajuanModal(pengajuanList)) {
            return {
                success: false,
                message: 'Gagal menyimpan pengajuan modal',
                data: null
            };
        }
        
        // Log audit trail
        logPengajuanModalAudit({
            action: 'CREATE_PENGAJUAN',
            pengajuanId: pengajuan.id,
            userId: kasirId,
            userName: kasirName,
            timestamp: new Date().toISOString(),
            details: {
                jumlahDiminta: jumlah,
                keterangan: keterangan
            }
        });
        
        return {
            success: true,
            message: 'Pengajuan modal berhasil dibuat',
            data: pengajuan
        };
        
    } catch (error) {
        console.error('Error creating pengajuan modal:', error);
        return {
            success: false,
            message: 'Terjadi error saat membuat pengajuan modal',
            data: null
        };
    }
}

/**
 * Get pengajuan by kasir ID
 * @param {string} kasirId - ID kasir
 * @returns {Array} Array of pengajuan modal
 */
function getPengajuanByKasir(kasirId) {
    try {
        const pengajuanList = getAllPengajuanModal();
        return pengajuanList.filter(p => p.kasirId === kasirId)
            .sort((a, b) => new Date(b.tanggalPengajuan) - new Date(a.tanggalPengajuan));
    } catch (error) {
        console.error('Error getting pengajuan by kasir:', error);
        return [];
    }
}

/**
 * Get all pending pengajuan
 * @returns {Array} Array of pending pengajuan modal
 */
function getPengajuanPending() {
    try {
        const pengajuanList = getAllPengajuanModal();
        return pengajuanList.filter(p => p.status === 'pending')
            .sort((a, b) => new Date(a.tanggalPengajuan) - new Date(b.tanggalPengajuan));
    } catch (error) {
        console.error('Error getting pending pengajuan:', error);
        return [];
    }
}

/**
 * Get pengajuan history with filters
 * @param {Object} filters - Filter options
 * @param {string} filters.status - Filter by status (approved, rejected, used)
 * @param {string} filters.kasirId - Filter by kasir ID
 * @param {string} filters.startDate - Filter by start date (ISO string)
 * @param {string} filters.endDate - Filter by end date (ISO string)
 * @param {string} filters.searchTerm - Search by kasir name
 * @returns {Array} Array of filtered pengajuan modal
 */
function getPengajuanHistory(filters = {}) {
    try {
        let pengajuanList = getAllPengajuanModal();
        
        // Filter by status
        if (filters.status) {
            pengajuanList = pengajuanList.filter(p => p.status === filters.status);
        }
        
        // Filter by kasir ID
        if (filters.kasirId) {
            pengajuanList = pengajuanList.filter(p => p.kasirId === filters.kasirId);
        }
        
        // Filter by date range
        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            pengajuanList = pengajuanList.filter(p => new Date(p.tanggalPengajuan) >= startDate);
        }
        
        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999); // End of day
            pengajuanList = pengajuanList.filter(p => new Date(p.tanggalPengajuan) <= endDate);
        }
        
        // Search by kasir name
        if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            pengajuanList = pengajuanList.filter(p => 
                p.kasirName.toLowerCase().includes(searchLower)
            );
        }
        
        // Sort by date descending (newest first)
        pengajuanList.sort((a, b) => new Date(b.tanggalPengajuan) - new Date(a.tanggalPengajuan));
        
        return pengajuanList;
    } catch (error) {
        console.error('Error getting pengajuan history:', error);
        return [];
    }
}

/**
 * Approve pengajuan modal
 * @param {string} pengajuanId - ID pengajuan
 * @param {string} adminId - ID admin yang menyetujui
 * @param {string} adminName - Nama admin yang menyetujui
 * @returns {Object} Result {success: boolean, message: string, data: Object}
 */
function approvePengajuan(pengajuanId, adminId, adminName) {
    try {
        // Validate admin role
        if (!currentUser || !['admin', 'administrator', 'super_admin'].includes(currentUser.role)) {
            return {
                success: false,
                message: 'Anda tidak memiliki izin untuk melakukan aksi ini',
                data: null
            };
        }
        
        // Get pengajuan
        const pengajuanList = getAllPengajuanModal();
        const pengajuanIndex = pengajuanList.findIndex(p => p.id === pengajuanId);
        
        if (pengajuanIndex === -1) {
            return {
                success: false,
                message: 'Pengajuan tidak ditemukan',
                data: null
            };
        }
        
        const pengajuan = pengajuanList[pengajuanIndex];
        
        // Validate status is pending
        if (pengajuan.status !== 'pending') {
            return {
                success: false,
                message: 'Pengajuan tidak dapat diproses. Status tidak valid',
                data: null
            };
        }
        
        // Update pengajuan
        pengajuan.status = 'approved';
        pengajuan.adminId = adminId;
        pengajuan.adminName = adminName;
        pengajuan.tanggalProses = new Date().toISOString();
        
        // Save to localStorage
        pengajuanList[pengajuanIndex] = pengajuan;
        if (!savePengajuanModal(pengajuanList)) {
            return {
                success: false,
                message: 'Gagal menyimpan persetujuan pengajuan',
                data: null
            };
        }
        
        // Log audit trail
        logPengajuanModalAudit({
            action: 'APPROVE_PENGAJUAN',
            pengajuanId: pengajuan.id,
            userId: adminId,
            userName: adminName,
            timestamp: new Date().toISOString(),
            details: {
                kasirId: pengajuan.kasirId,
                kasirName: pengajuan.kasirName,
                jumlahDiminta: pengajuan.jumlahDiminta
            }
        });
        
        // Create notification for kasir
        createNotification(
            pengajuan.kasirId,
            'Pengajuan Modal Disetujui',
            `Pengajuan modal Anda sebesar ${formatRupiah(pengajuan.jumlahDiminta)} telah disetujui oleh ${adminName}`,
            'success',
            { pengajuanId: pengajuan.id, type: 'approval' }
        );
        
        return {
            success: true,
            message: 'Pengajuan modal berhasil disetujui',
            data: pengajuan
        };
        
    } catch (error) {
        console.error('Error approving pengajuan:', error);
        return {
            success: false,
            message: 'Terjadi error saat menyetujui pengajuan',
            data: null
        };
    }
}

/**
 * Reject pengajuan modal
 * @param {string} pengajuanId - ID pengajuan
 * @param {string} adminId - ID admin yang menolak
 * @param {string} adminName - Nama admin yang menolak
 * @param {string} alasan - Alasan penolakan
 * @returns {Object} Result {success: boolean, message: string, data: Object}
 */
function rejectPengajuan(pengajuanId, adminId, adminName, alasan) {
    try {
        // Validate admin role
        if (!currentUser || !['admin', 'administrator', 'super_admin'].includes(currentUser.role)) {
            return {
                success: false,
                message: 'Anda tidak memiliki izin untuk melakukan aksi ini',
                data: null
            };
        }
        
        // Validate alasan is not empty
        if (!alasan || alasan.trim() === '') {
            return {
                success: false,
                message: 'Alasan penolakan harus diisi',
                data: null
            };
        }
        
        // Get pengajuan
        const pengajuanList = getAllPengajuanModal();
        const pengajuanIndex = pengajuanList.findIndex(p => p.id === pengajuanId);
        
        if (pengajuanIndex === -1) {
            return {
                success: false,
                message: 'Pengajuan tidak ditemukan',
                data: null
            };
        }
        
        const pengajuan = pengajuanList[pengajuanIndex];
        
        // Validate status is pending
        if (pengajuan.status !== 'pending') {
            return {
                success: false,
                message: 'Pengajuan tidak dapat diproses. Status tidak valid',
                data: null
            };
        }
        
        // Update pengajuan
        pengajuan.status = 'rejected';
        pengajuan.adminId = adminId;
        pengajuan.adminName = adminName;
        pengajuan.tanggalProses = new Date().toISOString();
        pengajuan.alasanPenolakan = alasan.trim();
        
        // Save to localStorage
        pengajuanList[pengajuanIndex] = pengajuan;
        if (!savePengajuanModal(pengajuanList)) {
            return {
                success: false,
                message: 'Gagal menyimpan penolakan pengajuan',
                data: null
            };
        }
        
        // Log audit trail
        logPengajuanModalAudit({
            action: 'REJECT_PENGAJUAN',
            pengajuanId: pengajuan.id,
            userId: adminId,
            userName: adminName,
            timestamp: new Date().toISOString(),
            details: {
                kasirId: pengajuan.kasirId,
                kasirName: pengajuan.kasirName,
                jumlahDiminta: pengajuan.jumlahDiminta,
                alasanPenolakan: alasan
            }
        });
        
        // Create notification for kasir
        createNotification(
            pengajuan.kasirId,
            'Pengajuan Modal Ditolak',
            `Pengajuan modal Anda sebesar ${formatRupiah(pengajuan.jumlahDiminta)} ditolak. Alasan: ${alasan}`,
            'error',
            { pengajuanId: pengajuan.id, type: 'rejection' }
        );
        
        return {
            success: true,
            message: 'Pengajuan modal berhasil ditolak',
            data: pengajuan
        };
        
    } catch (error) {
        console.error('Error rejecting pengajuan:', error);
        return {
            success: false,
            message: 'Terjadi error saat menolak pengajuan',
            data: null
        };
    }
}

/**
 * Mark pengajuan as used (when kasir opens shift)
 * @param {string} pengajuanId - ID pengajuan
 * @param {string} shiftId - ID shift kasir
 * @returns {Object} Result {success: boolean, message: string, data: Object}
 */
function markPengajuanAsUsed(pengajuanId, shiftId) {
    try {
        // Get pengajuan
        const pengajuanList = getAllPengajuanModal();
        const pengajuanIndex = pengajuanList.findIndex(p => p.id === pengajuanId);
        
        if (pengajuanIndex === -1) {
            return {
                success: false,
                message: 'Pengajuan tidak ditemukan',
                data: null
            };
        }
        
        const pengajuan = pengajuanList[pengajuanIndex];
        
        // Validate status is approved
        if (pengajuan.status !== 'approved') {
            return {
                success: false,
                message: 'Pengajuan tidak dapat digunakan. Status harus approved',
                data: null
            };
        }
        
        // Update pengajuan
        pengajuan.status = 'used';
        pengajuan.shiftId = shiftId;
        pengajuan.tanggalDigunakan = new Date().toISOString();
        
        // Save to localStorage
        pengajuanList[pengajuanIndex] = pengajuan;
        if (!savePengajuanModal(pengajuanList)) {
            return {
                success: false,
                message: 'Gagal menyimpan penggunaan pengajuan',
                data: null
            };
        }
        
        // Log audit trail
        logPengajuanModalAudit({
            action: 'USE_PENGAJUAN',
            pengajuanId: pengajuan.id,
            userId: pengajuan.kasirId,
            userName: pengajuan.kasirName,
            timestamp: new Date().toISOString(),
            details: {
                shiftId: shiftId,
                jumlahDiminta: pengajuan.jumlahDiminta
            }
        });
        
        return {
            success: true,
            message: 'Pengajuan modal berhasil ditandai sebagai digunakan',
            data: pengajuan
        };
        
    } catch (error) {
        console.error('Error marking pengajuan as used:', error);
        return {
            success: false,
            message: 'Terjadi error saat menandai pengajuan sebagai digunakan',
            data: null
        };
    }
}

/**
 * Create notification for user
 * @param {string} userId - ID user penerima notifikasi
 * @param {string} title - Judul notifikasi
 * @param {string} message - Pesan notifikasi
 * @param {string} type - Tipe notifikasi (success, error, info, warning)
 * @param {Object} data - Data tambahan
 * @returns {boolean} Success status
 */
function createNotification(userId, title, message, type, data = {}) {
    try {
        const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        
        const notification = {
            id: generateId(),
            userId: userId,
            title: title,
            message: message,
            type: type,
            data: data,
            read: false,
            createdAt: new Date().toISOString()
        };
        
        notifications.push(notification);
        localStorage.setItem('notifications', JSON.stringify(notifications));
        
        return true;
    } catch (error) {
        console.error('Error creating notification:', error);
        return false;
    }
}

/**
 * Get notifications by user ID
 * @param {string} userId - ID user
 * @param {boolean} unreadOnly - Only get unread notifications
 * @returns {Array} Array of notifications
 */
function getNotificationsByUser(userId, unreadOnly = false) {
    try {
        let notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        
        notifications = notifications.filter(n => n.userId === userId);
        
        if (unreadOnly) {
            notifications = notifications.filter(n => !n.read);
        }
        
        // Sort by date descending (newest first)
        notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        return notifications;
    } catch (error) {
        console.error('Error getting notifications:', error);
        return [];
    }
}

/**
 * Mark notification as read
 * @param {string} notificationId - ID notifikasi
 * @returns {boolean} Success status
 */
function markNotificationAsRead(notificationId) {
    try {
        const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        const notificationIndex = notifications.findIndex(n => n.id === notificationId);
        
        if (notificationIndex === -1) {
            return false;
        }
        
        notifications[notificationIndex].read = true;
        notifications[notificationIndex].readAt = new Date().toISOString();
        
        localStorage.setItem('notifications', JSON.stringify(notifications));
        
        return true;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return false;
    }
}

/**
 * Get approved pengajuan for kasir (for buka kasir integration)
 * @param {string} kasirId - ID kasir
 * @returns {Object|null} Approved pengajuan or null
 */
function getApprovedPengajuanForKasir(kasirId) {
    try {
        const pengajuanList = getAllPengajuanModal();
        const approved = pengajuanList.find(p => p.kasirId === kasirId && p.status === 'approved');
        return approved || null;
    } catch (error) {
        console.error('Error getting approved pengajuan:', error);
        return null;
    }
}

/**
 * Render halaman riwayat pengajuan untuk kasir
 */
function renderRiwayatPengajuanKasir() {
    const content = document.getElementById('mainContent');
    
    if (!currentUser) {
        content.innerHTML = '<div class="alert alert-danger">User tidak ditemukan</div>';
        return;
    }
    
    // Get pengajuan for current kasir
    const pengajuanList = getPengajuanByKasir(currentUser.id);
    
    content.innerHTML = `
        <div class="container-fluid">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2><i class="bi bi-clock-history me-2"></i>Riwayat Pengajuan Modal</h2>
            </div>
            
            <!-- Filter Status -->
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4">
                            <label class="form-label">Filter Status</label>
                            <select class="form-select" id="filterStatus" onchange="filterPengajuanKasir()">
                                <option value="">Semua Status</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Disetujui</option>
                                <option value="rejected">Ditolak</option>
                                <option value="used">Sudah Digunakan</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Pengajuan List -->
            <div id="pengajuanListContainer">
                ${renderPengajuanKasirList(pengajuanList)}
            </div>
        </div>
    `;
}

/**
 * Render list pengajuan kasir
 * @param {Array} pengajuanList - Array of pengajuan
 * @returns {string} HTML string
 */
function renderPengajuanKasirList(pengajuanList) {
    if (pengajuanList.length === 0) {
        return `
            <div class="card">
                <div class="card-body text-center py-5">
                    <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc;"></i>
                    <p class="text-muted mt-3">Belum ada pengajuan modal</p>
                </div>
            </div>
        `;
    }
    
    return pengajuanList.map(p => {
        const statusBadge = getStatusBadge(p.status);
        const statusIcon = getStatusIcon(p.status);
        
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
                                    <p class="text-muted mb-2">
                                        <small>
                                            <i class="bi bi-calendar me-1"></i>
                                            ${new Date(p.tanggalPengajuan).toLocaleString('id-ID')}
                                        </small>
                                    </p>
                                    ${p.keterangan ? `
                                        <p class="mb-2"><strong>Keterangan:</strong> ${p.keterangan}</p>
                                    ` : ''}
                                    
                                    ${p.status === 'approved' || p.status === 'rejected' || p.status === 'used' ? `
                                        <div class="mt-2">
                                            <small class="text-muted">
                                                <i class="bi bi-person me-1"></i>
                                                Diproses oleh: ${p.adminName}
                                            </small><br>
                                            <small class="text-muted">
                                                <i class="bi bi-clock me-1"></i>
                                                ${new Date(p.tanggalProses).toLocaleString('id-ID')}
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
                                    
                                    ${p.status === 'used' && p.shiftId ? `
                                        <div class="alert alert-info mt-2 mb-0">
                                            <small>
                                                <i class="bi bi-check-circle me-1"></i>
                                                Digunakan untuk shift kasir pada ${new Date(p.tanggalDigunakan).toLocaleString('id-ID')}
                                            </small>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4 text-end">
                            <button class="btn btn-sm btn-outline-primary" onclick="showDetailPengajuanKasir('${p.id}')">
                                <i class="bi bi-eye me-1"></i>Detail
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Get status badge HTML
 * @param {string} status - Status pengajuan
 * @returns {string} HTML badge
 */
function getStatusBadge(status) {
    const badges = {
        'pending': '<span class="badge bg-warning text-dark">Menunggu</span>',
        'approved': '<span class="badge bg-success">Disetujui</span>',
        'rejected': '<span class="badge bg-danger">Ditolak</span>',
        'used': '<span class="badge bg-info">Sudah Digunakan</span>'
    };
    return badges[status] || '<span class="badge bg-secondary">Unknown</span>';
}

/**
 * Get status icon
 * @param {string} status - Status pengajuan
 * @returns {string} Icon HTML
 */
function getStatusIcon(status) {
    const icons = {
        'pending': '<i class="bi bi-clock-history text-warning"></i>',
        'approved': '<i class="bi bi-check-circle text-success"></i>',
        'rejected': '<i class="bi bi-x-circle text-danger"></i>',
        'used': '<i class="bi bi-check-circle-fill text-info"></i>'
    };
    return icons[status] || '<i class="bi bi-question-circle text-secondary"></i>';
}

/**
 * Filter pengajuan kasir by status
 */
function filterPengajuanKasir() {
    const filterStatus = document.getElementById('filterStatus').value;
    
    let pengajuanList = getPengajuanByKasir(currentUser.id);
    
    if (filterStatus) {
        pengajuanList = pengajuanList.filter(p => p.status === filterStatus);
    }
    
    document.getElementById('pengajuanListContainer').innerHTML = renderPengajuanKasirList(pengajuanList);
}

/**
 * Show detail pengajuan modal for kasir
 * @param {string} pengajuanId - ID pengajuan
 */
function showDetailPengajuanKasir(pengajuanId) {
    const pengajuanList = getAllPengajuanModal();
    const pengajuan = pengajuanList.find(p => p.id === pengajuanId);
    
    if (!pengajuan) {
        showAlert('Pengajuan tidak ditemukan', 'error');
        return;
    }
    
    const modalHtml = `
        <div class="modal fade" id="detailPengajuanModal" tabindex="-1">
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
                                <strong>Tanggal Pengajuan:</strong><br>
                                ${new Date(pengajuan.tanggalPengajuan).toLocaleString('id-ID')}
                            </div>
                            <div class="col-md-6">
                                <strong>Kasir:</strong><br>
                                ${pengajuan.kasirName}
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
    const existingModal = document.getElementById('detailPengajuanModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('detailPengajuanModal'));
    modal.show();
    
    // Clean up after modal is hidden
    document.getElementById('detailPengajuanModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}
