/**
 * Hapus Transaksi Tutup Kasir Module
 * 
 * This module provides functionality for deleting POS transactions that are
 * already included in closed shift reports. This is a critical operation that
 * requires enhanced security controls and comprehensive audit logging.
 * 
 * Features:
 * - Multi-layer security (role check, password verification, rate limiting)
 * - Tutup kasir report adjustment
 * - Critical audit logging
 * - Data integrity validation
 * - Automatic rollback on failure
 * 
 * @module hapusTransaksiTutupKasir
 * @author Tim Development Koperasi Karyawan
 * @version 1.0.0
 * 
 * @requires localStorage - For data persistence
 */

// ===== Security Layer =====

// Note: RoleValidator class is defined in backup.js and shared across modules

/**
 * Service for password verification with failed attempt tracking
 * Implements security measures to prevent brute force attacks
 */
class PasswordVerificationService {
    constructor() {
        this.storageKey = 'passwordVerificationTracking';
        this.blockDurationMinutes = 5;
        this.maxFailedAttempts = 3;
    }
    
    /**
     * Verify user password
     * @param {string} username - Username to verify
     * @param {string} password - Password to verify
     * @returns {Object} { valid: boolean, message: string, remainingAttempts?: number }
     */
    verifyPassword(username, password) {
        // Check if user is currently blocked
        const blockStatus = this.isBlocked(username);
        if (blockStatus.blocked) {
            return {
                valid: false,
                message: `Akses diblokir sementara. Coba lagi dalam ${Math.ceil(blockStatus.remainingTime / 60)} menit.`
            };
        }
        
        // Get user from localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.username === username);
        
        if (!user) {
            return {
                valid: false,
                message: 'User tidak ditemukan'
            };
        }
        
        // Verify password
        if (user.password === password) {
            // Password correct - reset failed attempts
            this.resetFailedAttempts(username);
            return {
                valid: true,
                message: 'Password terverifikasi'
            };
        } else {
            // Password incorrect - track failed attempt
            const tracking = this._getTracking();
            const key = `user_${username}`;
            const userTracking = Object.prototype.hasOwnProperty.call(tracking, key)
                ? tracking[key]
                : {
                    failedAttempts: 0,
                    lastFailedAt: null,
                    blockedUntil: null
                };
            
            userTracking.failedAttempts += 1;
            userTracking.lastFailedAt = new Date().toISOString();
            
            // Block user if max attempts reached
            if (userTracking.failedAttempts >= this.maxFailedAttempts) {
                const blockUntil = new Date();
                blockUntil.setMinutes(blockUntil.getMinutes() + this.blockDurationMinutes);
                userTracking.blockedUntil = blockUntil.toISOString();
            }
            
            tracking[key] = userTracking;
            this._saveTracking(tracking);
            
            const remainingAttempts = this.maxFailedAttempts - userTracking.failedAttempts;
            
            if (remainingAttempts > 0) {
                return {
                    valid: false,
                    message: `Password salah. Sisa percobaan: ${remainingAttempts}`,
                    remainingAttempts: remainingAttempts
                };
            } else {
                return {
                    valid: false,
                    message: `Akses diblokir sementara selama ${this.blockDurationMinutes} menit karena terlalu banyak percobaan gagal.`,
                    remainingAttempts: 0
                };
            }
        }
    }
    
    /**
     * Check if user is currently blocked
     * @param {string} username - Username to check
     * @returns {Object} { blocked: boolean, remainingTime: number }
     */
    isBlocked(username) {
        const tracking = this._getTracking();
        const key = `user_${username}`;
        const userTracking = Object.prototype.hasOwnProperty.call(tracking, key)
            ? tracking[key]
            : null;
        
        if (!userTracking || !userTracking.blockedUntil) {
            return {
                blocked: false,
                remainingTime: 0
            };
        }
        
        const now = new Date();
        const blockedUntil = new Date(userTracking.blockedUntil);
        
        if (now < blockedUntil) {
            const remainingSeconds = Math.ceil((blockedUntil - now) / 1000);
            return {
                blocked: true,
                remainingTime: remainingSeconds
            };
        } else {
            // Block period expired - reset
            this.resetFailedAttempts(username);
            return {
                blocked: false,
                remainingTime: 0
            };
        }
    }
    
    /**
     * Reset failed attempts for a user
     * @param {string} username - Username to reset
     */
    resetFailedAttempts(username) {
        const tracking = this._getTracking();
        const key = `user_${username}`;
        if (Object.prototype.hasOwnProperty.call(tracking, key)) {
            delete tracking[key];
            this._saveTracking(tracking);
        }
    }
    
    /**
     * Get tracking data from localStorage
     * @private
     * @returns {Object} Tracking data
     */
    _getTracking() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '{}');
    }
    
    /**
     * Save tracking data to localStorage
     * @private
     * @param {Object} tracking - Tracking data to save
     */
    _saveTracking(tracking) {
        localStorage.setItem(this.storageKey, JSON.stringify(tracking));
    }
}

/**
 * Service for rate limiting deletion operations
 * Prevents abuse by limiting the number of deletions per day
 */
class RateLimiterService {
    constructor() {
        this.storageKey = 'rateLimitTracking';
        this.warningThreshold = 5;
        this.blockThreshold = 10;
    }
    
    /**
     * Check if user has exceeded rate limit
     * @param {string} username - Username to check
     * @returns {Object} { allowed: boolean, count: number, message: string, level: string }
     */
    checkRateLimit(username) {
        const tracking = this._getTracking();
        const today = new Date().toISOString().split('T')[0];
        
        // Use prefixed key to avoid prototype pollution
        const key = `user_${username}`;
        
        // Get or initialize user tracking
        const userTracking = Object.prototype.hasOwnProperty.call(tracking, key) 
            ? tracking[key] 
            : { deletions: [] };
        
        // Filter deletions for today
        const todayDeletions = userTracking.deletions.filter(d => {
            const deletionDate = new Date(d.timestamp).toISOString().split('T')[0];
            return deletionDate === today;
        });
        
        const count = todayDeletions.length;
        
        // Check thresholds
        if (count >= this.blockThreshold) {
            return {
                allowed: false,
                count: count,
                message: `Batas maksimal penghapusan transaksi tertutup tercapai (${this.blockThreshold} per hari). Akses diblokir.`,
                level: 'block'
            };
        } else if (count >= this.warningThreshold) {
            return {
                allowed: true,
                count: count,
                message: `Peringatan: Anda telah menghapus ${count} transaksi tertutup hari ini. Harap berhati-hati.`,
                level: 'warning'
            };
        } else {
            return {
                allowed: true,
                count: count,
                message: 'Rate limit OK',
                level: 'ok'
            };
        }
    }
    
    /**
     * Record a deletion for rate limiting
     * @param {string} username - Username who performed deletion
     * @param {string} transactionId - Transaction ID that was deleted
     * @param {string} auditId - Audit ID for the deletion
     */
    recordDeletion(username, transactionId, auditId) {
        const tracking = this._getTracking();
        
        // Use prefixed key to avoid prototype pollution
        const key = `user_${username}`;
        
        // Get or initialize user tracking
        const userTracking = Object.prototype.hasOwnProperty.call(tracking, key)
            ? tracking[key]
            : { deletions: [] };
        
        // Add new deletion record
        userTracking.deletions.push({
            timestamp: new Date().toISOString(),
            transactionId: transactionId,
            auditId: auditId
        });
        
        // Keep only last 30 days of data
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        userTracking.deletions = userTracking.deletions.filter(d => {
            return new Date(d.timestamp) > thirtyDaysAgo;
        });
        
        tracking[key] = userTracking;
        this._saveTracking(tracking);
    }
    
    /**
     * Get tracking data from localStorage
     * @private
     * @returns {Object} Tracking data
     */
    _getTracking() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '{}');
    }
    
    /**
     * Save tracking data to localStorage
     * @private
     * @param {Object} tracking - Tracking data to save
     */
    _saveTracking(tracking) {
        localStorage.setItem(this.storageKey, JSON.stringify(tracking));
    }
}

// ===== Business Logic Services =====

/**
 * Service for adjusting tutup kasir reports after transaction deletion
 * Ensures financial reports remain accurate and balanced
 */
class TutupKasirAdjustmentService {
    constructor() {
        this.storageKey = 'riwayatTutupKas';
    }
    
    /**
     * Adjust tutup kasir report after transaction deletion
     * @param {Object} transaction - Transaction data that was deleted
     * @param {string} shiftId - Shift ID to adjust (optional, will be identified if not provided)
     * @returns {Object} { success: boolean, adjustmentData: Object, message: string }
     */
    adjustTutupKasir(transaction, shiftId = null) {
        try {
            // Identify shift if not provided
            let shift = null;
            if (shiftId) {
                const shifts = this._getShifts();
                shift = shifts.find(s => s.id === shiftId);
            } else {
                shift = this.identifyShift(transaction);
            }
            
            if (!shift) {
                return {
                    success: false,
                    adjustmentData: null,
                    message: 'Laporan tutup kasir tidak ditemukan untuk transaksi ini'
                };
            }
            
            // Save snapshot before adjustment
            const snapshotBefore = JSON.parse(JSON.stringify(shift));
            
            // Calculate adjustment amounts
            const transactionTotal = parseFloat(transaction.total) || 0;
            
            // Adjust total penjualan
            shift.totalPenjualan = (parseFloat(shift.totalPenjualan) || 0) - transactionTotal;
            
            // Adjust kas or piutang based on payment method
            if (transaction.metode === 'cash') {
                shift.totalKas = (parseFloat(shift.totalKas) || 0) - transactionTotal;
            } else if (transaction.metode === 'bon' || transaction.metode === 'kredit') {
                shift.totalPiutang = (parseFloat(shift.totalPiutang) || 0) - transactionTotal;
            }
            
            // Add adjustment note
            if (!shift.adjustments) {
                shift.adjustments = [];
            }
            
            const adjustmentNote = {
                timestamp: new Date().toISOString(),
                transactionId: transaction.id,
                transactionNo: transaction.noTransaksi,
                amount: transactionTotal,
                type: 'deletion',
                reason: 'Penghapusan transaksi tertutup',
                adjustedBy: transaction.deletedBy || 'system'
            };
            
            shift.adjustments.push(adjustmentNote);
            
            // Save updated shift
            const shifts = this._getShifts();
            const shiftIndex = shifts.findIndex(s => s.id === shift.id);
            if (shiftIndex !== -1) {
                shifts[shiftIndex] = shift;
                this._saveShifts(shifts);
            }
            
            // Save snapshot after adjustment
            const snapshotAfter = JSON.parse(JSON.stringify(shift));
            
            return {
                success: true,
                adjustmentData: {
                    shiftId: shift.id,
                    snapshotBefore: snapshotBefore,
                    snapshotAfter: snapshotAfter,
                    adjustmentNote: adjustmentNote
                },
                message: 'Laporan tutup kasir berhasil disesuaikan'
            };
            
        } catch (error) {
            return {
                success: false,
                adjustmentData: null,
                message: `Gagal melakukan adjustment: ${error.message}`
            };
        }
    }
    
    /**
     * Identify shift from transaction
     * Finds the shift that includes the transaction date
     * @param {Object} transaction - Transaction data
     * @returns {Object|null} Shift data or null if not found
     */
    identifyShift(transaction) {
        if (!transaction || !transaction.tanggal) {
            return null;
        }
        
        const shifts = this._getShifts();
        const transactionDate = new Date(transaction.tanggal);
        
        // Find shift that includes this transaction date
        for (const shift of shifts) {
            if (!shift.tanggalTutup) continue;
            
            const shiftDate = new Date(shift.tanggalTutup);
            
            // Check if transaction date matches shift date (same day)
            if (transactionDate.toDateString() === shiftDate.toDateString()) {
                return shift;
            }
            
            // Also check if shift has a date range
            if (shift.tanggalBuka) {
                const shiftStartDate = new Date(shift.tanggalBuka);
                if (transactionDate >= shiftStartDate && transactionDate <= shiftDate) {
                    return shift;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Get shifts from localStorage
     * @private
     * @returns {Array} Array of shift data
     */
    _getShifts() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    }
    
    /**
     * Save shifts to localStorage
     * @private
     * @param {Array} shifts - Shifts data to save
     */
    _saveShifts(shifts) {
        localStorage.setItem(this.storageKey, JSON.stringify(shifts));
    }
}

/**
 * Service for critical audit logging
 * Provides comprehensive audit trail for closed transaction deletions
 */
class CriticalAuditLoggerService {
    constructor() {
        this.storageKey = 'closedShiftDeletionLog';
    }
    
    /**
     * Log critical deletion with comprehensive audit data
     * @param {Object} data - Complete audit data
     * @param {Object} data.transaction - Transaction that was deleted
     * @param {Object} data.shift - Shift data (before/after snapshots)
     * @param {string} data.category - Error category
     * @param {string} data.reason - Detailed reason for deletion
     * @param {string} data.deletedBy - Username who performed deletion
     * @param {string} data.passwordVerifiedAt - ISO timestamp of password verification
     * @param {Array} data.journalEntries - Journal entries created
     * @param {Object} data.adjustmentData - Tutup kasir adjustment data
     * @param {Object} data.validationResults - Pre and post validation results
     * @param {boolean} data.stockRestored - Stock restoration status
     * @param {Array} data.warnings - Any warnings during the process
     * @returns {string} Audit ID
     */
    logCriticalDeletion(data) {
        try {
            // Generate unique audit ID
            const auditId = this._generateAuditId();
            
            // Collect system info
            const systemInfo = this._collectSystemInfo();
            
            // Create comprehensive log entry
            const logEntry = {
                auditId: auditId,
                level: 'CRITICAL',
                transactionId: data.transaction.id,
                transactionNo: data.transaction.noTransaksi,
                transactionSnapshot: JSON.parse(JSON.stringify(data.transaction)),
                shiftId: data.shift ? data.shift.shiftId : null,
                shiftSnapshot: data.shift ? {
                    before: data.shift.snapshotBefore,
                    after: data.shift.snapshotAfter
                } : null,
                category: data.category,
                reason: data.reason,
                deletedBy: data.deletedBy,
                deletedAt: new Date().toISOString(),
                passwordVerifiedAt: data.passwordVerifiedAt,
                systemInfo: systemInfo,
                journalEntries: data.journalEntries || [],
                adjustmentData: data.adjustmentData || null,
                validationResults: {
                    preDelete: data.validationResults?.preDelete || null,
                    postDelete: data.validationResults?.postDelete || null
                },
                stockRestored: data.stockRestored !== undefined ? data.stockRestored : false,
                warnings: data.warnings || []
            };
            
            // Save to storage
            const logs = this.getCriticalHistory();
            logs.push(logEntry);
            localStorage.setItem(this.storageKey, JSON.stringify(logs));
            
            return auditId;
            
        } catch (error) {
            console.error('CRITICAL: Failed to save audit log:', error);
            throw new Error(`Gagal menyimpan audit log: ${error.message}`);
        }
    }
    
    /**
     * Get all critical deletion history
     * @returns {Array} Array of critical audit logs
     */
    getCriticalHistory() {
        try {
            const logs = localStorage.getItem(this.storageKey);
            return logs ? JSON.parse(logs) : [];
        } catch (error) {
            console.error('Error reading critical history:', error);
            return [];
        }
    }
    
    /**
     * Export audit log to PDF-ready format
     * @param {string} auditId - Audit ID to export
     * @returns {Object|null} Formatted data for PDF or null if not found
     */
    exportToPDF(auditId) {
        const logs = this.getCriticalHistory();
        const log = logs.find(l => l.auditId === auditId);
        
        if (!log) {
            return null;
        }
        
        // Format data for PDF export
        return {
            title: 'AUDIT LOG - PENGHAPUSAN TRANSAKSI TERTUTUP',
            auditId: log.auditId,
            level: log.level,
            
            // Transaction Information
            transactionInfo: {
                id: log.transactionId,
                number: log.transactionNo,
                date: log.transactionSnapshot.tanggal,
                total: log.transactionSnapshot.total,
                method: log.transactionSnapshot.metode,
                cashier: log.transactionSnapshot.kasir,
                items: log.transactionSnapshot.items
            },
            
            // Shift Information
            shiftInfo: log.shiftSnapshot ? {
                shiftId: log.shiftId,
                beforeAdjustment: {
                    totalPenjualan: log.shiftSnapshot.before.totalPenjualan,
                    totalKas: log.shiftSnapshot.before.totalKas,
                    totalPiutang: log.shiftSnapshot.before.totalPiutang
                },
                afterAdjustment: {
                    totalPenjualan: log.shiftSnapshot.after.totalPenjualan,
                    totalKas: log.shiftSnapshot.after.totalKas,
                    totalPiutang: log.shiftSnapshot.after.totalPiutang
                }
            } : null,
            
            // Deletion Information
            deletionInfo: {
                category: log.category,
                reason: log.reason,
                deletedBy: log.deletedBy,
                deletedAt: log.deletedAt,
                passwordVerifiedAt: log.passwordVerifiedAt
            },
            
            // System Information
            systemInfo: log.systemInfo,
            
            // Journal Entries
            journalEntries: log.journalEntries,
            
            // Adjustment Data
            adjustmentData: log.adjustmentData,
            
            // Validation Results
            validationResults: log.validationResults,
            
            // Status
            stockRestored: log.stockRestored,
            warnings: log.warnings,
            
            // Metadata
            generatedAt: new Date().toISOString()
        };
    }
    
    /**
     * Generate unique audit ID with format AUDIT-CLOSED-YYYYMMDD-NNNN
     * @private
     * @returns {string} Unique audit ID
     */
    _generateAuditId() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const dateStr = `${year}${month}${day}`;
        
        // Get existing logs for today to determine sequence number
        const logs = this.getCriticalHistory();
        const todayLogs = logs.filter(log => {
            return log.auditId && log.auditId.includes(dateStr);
        });
        
        // Generate sequence number (NNNN)
        const sequenceNumber = String(todayLogs.length + 1).padStart(4, '0');
        
        return `AUDIT-CLOSED-${dateStr}-${sequenceNumber}`;
    }
    
    /**
     * Collect system information for audit
     * @private
     * @returns {Object} System information
     */
    _collectSystemInfo() {
        const systemInfo = {
            timestamp: new Date().toISOString(),
            userAgent: null,
            ipAddress: null,
            platform: null,
            language: null
        };
        
        // Collect browser information if available
        if (typeof navigator !== 'undefined') {
            systemInfo.userAgent = navigator.userAgent || null;
            systemInfo.platform = navigator.platform || null;
            systemInfo.language = navigator.language || null;
        }
        
        // Note: IP address cannot be reliably obtained from client-side JavaScript
        // This would need to be provided by the server or left as null
        systemInfo.ipAddress = 'N/A (client-side)';
        
        return systemInfo;
    }
}

/**
 * Service for data integrity validation
 * Ensures data consistency before and after deletion operations
 */
class DataIntegrityValidator {
    /**
     * Validate data integrity before deletion
     * @param {string} transactionId - Transaction ID to validate
     * @returns {Object} { valid: boolean, errors: Array<string> }
     */
    preDeleteValidation(transactionId) {
        const errors = [];
        
        try {
            // 1. Check transaction exists
            const transactions = JSON.parse(localStorage.getItem('posTransactions') || '[]');
            const transaction = transactions.find(t => t.id === transactionId);
            
            if (!transaction) {
                errors.push('Transaksi tidak ditemukan');
                return { valid: false, errors };
            }
            
            // 2. Check shift exists
            const adjustmentService = new TutupKasirAdjustmentService();
            const shift = adjustmentService.identifyShift(transaction);
            
            if (!shift) {
                errors.push('Laporan tutup kasir tidak ditemukan untuk transaksi ini');
            }
            
            // 3. Check referential integrity
            // Verify transaction has required fields
            if (!transaction.id) {
                errors.push('Transaksi tidak memiliki ID yang valid');
            }
            
            if (!transaction.noTransaksi) {
                errors.push('Transaksi tidak memiliki nomor transaksi');
            }
            
            if (!transaction.tanggal) {
                errors.push('Transaksi tidak memiliki tanggal');
            }
            
            if (!transaction.items || !Array.isArray(transaction.items) || transaction.items.length === 0) {
                errors.push('Transaksi tidak memiliki item yang valid');
            }
            
            // Verify shift has required fields
            if (shift) {
                if (!shift.id) {
                    errors.push('Shift tidak memiliki ID yang valid');
                }
                
                if (shift.totalPenjualan === undefined || shift.totalPenjualan === null) {
                    errors.push('Shift tidak memiliki total penjualan yang valid');
                }
            }
            
            return {
                valid: errors.length === 0,
                errors: errors
            };
            
        } catch (error) {
            errors.push(`Error saat validasi: ${error.message}`);
            return {
                valid: false,
                errors: errors
            };
        }
    }
    
    /**
     * Validate data integrity after deletion
     * @param {Object} context - Deletion context
     * @param {string} context.transactionId - Transaction ID that was deleted
     * @param {string} context.shiftId - Shift ID that was adjusted
     * @param {Array} context.journalEntries - Journal entries that were created
     * @param {string} context.auditId - Audit ID that was created
     * @param {boolean} context.stockRestored - Whether stock was restored
     * @returns {Object} { valid: boolean, errors: Array<string> }
     */
    postDeleteValidation(context) {
        const errors = [];
        
        try {
            // 1. Check transaction is deleted
            const transactions = JSON.parse(localStorage.getItem('posTransactions') || '[]');
            const transaction = transactions.find(t => t.id === context.transactionId);
            
            if (transaction) {
                errors.push('Transaksi masih ada setelah penghapusan');
            }
            
            // 2. Check stock is restored (if applicable)
            if (context.stockRestored === false) {
                errors.push('Stok belum dikembalikan');
            }
            
            // 3. Check journal entries are created
            if (!context.journalEntries || context.journalEntries.length === 0) {
                errors.push('Jurnal pembalik belum dibuat');
            } else {
                // Verify journals exist in storage
                const journals = JSON.parse(localStorage.getItem('journals') || '[]');
                
                for (const entry of context.journalEntries) {
                    const journalExists = journals.some(j => 
                        j.id === entry.id || 
                        (j.deskripsi && j.deskripsi.includes(entry.deskripsi))
                    );
                    
                    if (!journalExists) {
                        errors.push(`Jurnal dengan deskripsi "${entry.deskripsi}" tidak ditemukan di storage`);
                    }
                }
            }
            
            // 4. Check tutup kasir is adjusted
            if (context.shiftId) {
                const shifts = JSON.parse(localStorage.getItem('riwayatTutupKas') || '[]');
                const shift = shifts.find(s => s.id === context.shiftId);
                
                if (!shift) {
                    errors.push('Shift tidak ditemukan setelah adjustment');
                } else {
                    // Check if adjustment note exists
                    if (!shift.adjustments || shift.adjustments.length === 0) {
                        errors.push('Catatan adjustment tidak ditemukan pada shift');
                    } else {
                        const hasAdjustment = shift.adjustments.some(adj => 
                            adj.transactionId === context.transactionId
                        );
                        
                        if (!hasAdjustment) {
                            errors.push('Adjustment untuk transaksi ini tidak ditemukan pada shift');
                        }
                    }
                }
            }
            
            // 5. Check audit log is saved
            if (!context.auditId) {
                errors.push('Audit ID tidak tersedia');
            } else {
                const auditLogger = new CriticalAuditLoggerService();
                const logs = auditLogger.getCriticalHistory();
                const auditLog = logs.find(log => log.auditId === context.auditId);
                
                if (!auditLog) {
                    errors.push('Audit log tidak ditemukan di storage');
                } else {
                    // Verify audit log has required fields
                    if (!auditLog.transactionId) {
                        errors.push('Audit log tidak memiliki transaction ID');
                    }
                    
                    if (!auditLog.deletedBy) {
                        errors.push('Audit log tidak memiliki informasi user yang menghapus');
                    }
                    
                    if (!auditLog.category) {
                        errors.push('Audit log tidak memiliki kategori');
                    }
                    
                    if (!auditLog.reason) {
                        errors.push('Audit log tidak memiliki alasan');
                    }
                }
            }
            
            return {
                valid: errors.length === 0,
                errors: errors
            };
            
        } catch (error) {
            errors.push(`Error saat validasi: ${error.message}`);
            return {
                valid: false,
                errors: errors
            };
        }
    }
}

/**
 * Main service for deleting closed shift transactions
 * Orchestrates the complete deletion flow with security checks and validations
 */
class ClosedShiftDeletionService {
    constructor() {
        this.roleValidator = new RoleValidator();
        this.passwordService = new PasswordVerificationService();
        this.rateLimiter = new RateLimiterService();
        this.adjustmentService = new TutupKasirAdjustmentService();
        this.auditLogger = new CriticalAuditLoggerService();
        this.integrityValidator = new DataIntegrityValidator();
    }
    
    /**
     * Delete a closed shift transaction with full security and audit trail
     * @param {string} transactionId - Transaction ID to delete
     * @param {Object} deletionData - Deletion data
     * @param {string} deletionData.category - Error category
     * @param {string} deletionData.reason - Detailed reason for deletion
     * @param {string} deletionData.username - Username performing deletion
     * @param {string} deletionData.password - Password for verification
     * @param {Object} deletionData.user - Complete user object
     * @returns {Object} { success: boolean, message: string, auditId?: string, warnings?: Array }
     */
    deleteClosedTransaction(transactionId, deletionData) {
        const snapshots = {}; // For rollback
        
        try {
            // 1. Validate role (super admin only)
            if (!this.roleValidator.isSuperAdmin(deletionData.user)) {
                return {
                    success: false,
                    message: 'Akses ditolak. Hanya Super Admin yang dapat menghapus transaksi tertutup.'
                };
            }
            
            // 2. Verify password
            const passwordResult = this.passwordService.verifyPassword(
                deletionData.username,
                deletionData.password
            );
            
            if (!passwordResult.valid) {
                return {
                    success: false,
                    message: passwordResult.message,
                    remainingAttempts: passwordResult.remainingAttempts
                };
            }
            
            const passwordVerifiedAt = new Date().toISOString();
            
            // 3. Check rate limit
            const rateLimitResult = this.rateLimiter.checkRateLimit(deletionData.username);
            
            if (!rateLimitResult.allowed) {
                return {
                    success: false,
                    message: rateLimitResult.message,
                    level: rateLimitResult.level
                };
            }
            
            // Store warning if at warning threshold
            const warnings = [];
            if (rateLimitResult.level === 'warning') {
                warnings.push(rateLimitResult.message);
            }
            
            // 4. Pre-deletion validation
            const preValidation = this.integrityValidator.preDeleteValidation(transactionId);
            
            if (!preValidation.valid) {
                return {
                    success: false,
                    message: `Validasi gagal: ${preValidation.errors.join(', ')}. Penghapusan dibatalkan.`
                };
            }
            
            // 5. Get transaction and shift data
            const transactions = JSON.parse(localStorage.getItem('posTransactions') || '[]');
            const transaction = transactions.find(t => t.id === transactionId);
            
            if (!transaction) {
                return {
                    success: false,
                    message: 'Transaksi tidak ditemukan'
                };
            }
            
            // Save transaction snapshot for rollback
            snapshots.transaction = JSON.parse(JSON.stringify(transaction));
            
            const shift = this.adjustmentService.identifyShift(transaction);
            
            if (!shift) {
                return {
                    success: false,
                    message: 'Laporan tutup kasir tidak ditemukan untuk transaksi ini'
                };
            }
            
            // Save shift snapshot for rollback
            snapshots.shift = JSON.parse(JSON.stringify(shift));
            
            // 6. Save snapshots BEFORE making any changes
            // Save stock snapshot for rollback (BEFORE restoring stock)
            snapshots.stock = this._getStockSnapshot(transaction.items);
            
            // Save journal snapshot for rollback (BEFORE creating journals)
            snapshots.journals = JSON.parse(localStorage.getItem('journals') || '[]').slice();
            
            // Save COA snapshot for rollback (BEFORE updating COA)
            snapshots.coa = JSON.parse(localStorage.getItem('coa') || '[]').slice();
            
            // 7. Now make the changes
            // Restore stock
            const stockRestored = this._restoreStock(transaction.items);
            
            // Create reversal journals with special tag (this may throw error if COA incomplete)
            const journalEntries = this._createReversalJournalsWithTag(transaction);
            
            // 8. Delete transaction from storage
            const updatedTransactions = transactions.filter(t => t.id !== transactionId);
            localStorage.setItem('posTransactions', JSON.stringify(updatedTransactions));
            
            // 9. Adjust tutup kasir report
            const adjustmentResult = this.adjustmentService.adjustTutupKasir(transaction, shift.id);
            
            if (!adjustmentResult.success) {
                // Rollback
                this._rollback(snapshots);
                return {
                    success: false,
                    message: `Gagal melakukan adjustment laporan tutup kasir: ${adjustmentResult.message}`
                };
            }
            
            // 10. Log critical audit
            const auditData = {
                transaction: snapshots.transaction,
                shift: adjustmentResult.adjustmentData,
                category: deletionData.category,
                reason: deletionData.reason,
                deletedBy: deletionData.username,
                passwordVerifiedAt: passwordVerifiedAt,
                journalEntries: journalEntries,
                adjustmentData: adjustmentResult.adjustmentData,
                validationResults: {
                    preDelete: preValidation
                },
                stockRestored: stockRestored,
                warnings: warnings
            };
            
            const auditId = this.auditLogger.logCriticalDeletion(auditData);
            
            // 11. Post-deletion validation
            const postValidation = this.integrityValidator.postDeleteValidation({
                transactionId: transactionId,
                shiftId: shift.id,
                journalEntries: journalEntries,
                auditId: auditId,
                stockRestored: stockRestored
            });
            
            if (!postValidation.valid) {
                // Rollback all changes
                this._rollback(snapshots);
                
                return {
                    success: false,
                    message: `Validasi integritas data gagal. Melakukan rollback... Errors: ${postValidation.errors.join(', ')}`
                };
            }
            
            // 12. Record deletion for rate limiting
            this.rateLimiter.recordDeletion(deletionData.username, transactionId, auditId);
            
            // Return success
            return {
                success: true,
                message: 'Transaksi tertutup berhasil dihapus',
                auditId: auditId,
                warnings: warnings.length > 0 ? warnings : undefined
            };
            
        } catch (error) {
            // Rollback on any error
            if (Object.keys(snapshots).length > 0) {
                this._rollback(snapshots);
            }
            
            return {
                success: false,
                message: `Error saat menghapus transaksi: ${error.message}`
            };
        }
    }
    
    /**
     * Restore stock for transaction items
     * @private
     * @param {Array} items - Transaction items
     * @returns {boolean} True if stock restored successfully
     */
    _restoreStock(items) {
        if (!items || items.length === 0) {
            return true;
        }
        
        const barang = JSON.parse(localStorage.getItem('barang') || '[]');
        
        for (const item of items) {
            const product = barang.find(b => b.id === item.id);
            if (product) {
                product.stok = (product.stok || 0) + item.qty;
            }
        }
        
        localStorage.setItem('barang', JSON.stringify(barang));
        return true;
    }
    
    /**
     * Get stock snapshot for rollback
     * @private
     * @param {Array} items - Transaction items
     * @returns {Array} Stock snapshot
     */
    _getStockSnapshot(items) {
        if (!items || items.length === 0) {
            return [];
        }
        
        const barang = JSON.parse(localStorage.getItem('barang') || '[]');
        const snapshot = [];
        
        for (const item of items) {
            const product = barang.find(b => b.id === item.id);
            if (product) {
                snapshot.push({
                    id: product.id,
                    stok: product.stok
                });
            }
        }
        
        return snapshot;
    }
    
    /**
     * Create reversal journals with CLOSED_SHIFT_REVERSAL tag
     * @private
     * @param {Object} transaction - Transaction object
     * @returns {Array} Array of journal entries created
     */
    _createReversalJournalsWithTag(transaction) {
        const journals = JSON.parse(localStorage.getItem('journals') || '[]');
        const journalEntries = [];
        const currentDate = new Date().toISOString();
        
        // Calculate total HPP
        let totalHPP = 0;
        if (transaction.items && transaction.items.length > 0) {
            totalHPP = transaction.items.reduce((sum, item) => {
                return sum + ((item.hpp || 0) * item.qty);
            }, 0);
        }
        
        // Create revenue reversal journal with special tag
        const revenueJournal = {
            id: this._generateJournalId(),
            tanggal: currentDate,
            deskripsi: `Reversal Transaksi Tertutup ${transaction.noTransaksi || transaction.id}`,
            tag: 'CLOSED_SHIFT_REVERSAL',
            entries: []
        };
        
        if (transaction.metode === 'cash') {
            // Cash transaction: Debit Revenue, Credit Cash
            revenueJournal.entries = [
                {
                    akun: '4-1000', // Pendapatan Penjualan
                    debit: transaction.total,
                    kredit: 0
                },
                {
                    akun: '1-1000', // Kas
                    debit: 0,
                    kredit: transaction.total
                }
            ];
        } else {
            // Credit transaction: Debit Revenue, Credit Accounts Receivable
            revenueJournal.entries = [
                {
                    akun: '4-1000', // Pendapatan Penjualan
                    debit: transaction.total,
                    kredit: 0
                },
                {
                    akun: '1-1200', // Piutang Anggota
                    debit: 0,
                    kredit: transaction.total
                }
            ];
        }
        
        journals.push(revenueJournal);
        journalEntries.push(revenueJournal);
        
        // Create HPP reversal journal with special tag
        if (totalHPP > 0) {
            const hppJournal = {
                id: this._generateJournalId(),
                tanggal: currentDate,
                deskripsi: `Reversal HPP Transaksi Tertutup ${transaction.noTransaksi || transaction.id}`,
                tag: 'CLOSED_SHIFT_REVERSAL',
                entries: [
                    {
                        akun: '1-1300', // Persediaan Barang
                        debit: totalHPP,
                        kredit: 0
                    },
                    {
                        akun: '5-1000', // Harga Pokok Penjualan
                        debit: 0,
                        kredit: totalHPP
                    }
                ]
            };
            
            journals.push(hppJournal);
            journalEntries.push(hppJournal);
        }
        
        // Update COA saldo
        this._updateCOASaldo(journalEntries);
        
        // Save journals
        localStorage.setItem('journals', JSON.stringify(journals));
        
        return journalEntries;
    }
    
    /**
     * Update COA saldo based on journal entries
     * @private
     * @param {Array} journalEntries - Journal entries
     * @throws {Error} If any required account is not found in COA
     */
    _updateCOASaldo(journalEntries) {
        const coa = JSON.parse(localStorage.getItem('coa') || '[]');
        
        // First, validate that all required accounts exist
        const missingAccounts = [];
        journalEntries.forEach(journal => {
            journal.entries.forEach(entry => {
                const akun = coa.find(c => c.kode === entry.akun);
                if (!akun) {
                    missingAccounts.push(entry.akun);
                }
            });
        });
        
        if (missingAccounts.length > 0) {
            throw new Error(`Akun COA tidak ditemukan: ${[...new Set(missingAccounts)].join(', ')}`);
        }
        
        // Now update the balances
        journalEntries.forEach(journal => {
            journal.entries.forEach(entry => {
                const akun = coa.find(c => c.kode === entry.akun);
                // We already validated that akun exists, so this is safe
                // For Asset and Expense accounts: increase with debit, decrease with credit
                // For Liability, Equity, and Revenue accounts: increase with credit, decrease with debit
                if (akun.tipe === 'Aset' || akun.tipe === 'Beban') {
                    akun.saldo = (akun.saldo || 0) + entry.debit - entry.kredit;
                } else {
                    akun.saldo = (akun.saldo || 0) + entry.kredit - entry.debit;
                }
            });
        });
        
        localStorage.setItem('coa', JSON.stringify(coa));
    }
    
    /**
     * Generate unique journal ID
     * @private
     * @returns {string} Unique ID
     */
    _generateJournalId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
    
    /**
     * Rollback all changes
     * @private
     * @param {Object} snapshots - Snapshots of data before changes
     */
    _rollback(snapshots) {
        try {
            // Restore transaction (only if it was deleted)
            if (snapshots.transaction) {
                const transactions = JSON.parse(localStorage.getItem('posTransactions') || '[]');
                // Check if transaction was actually deleted before restoring
                const exists = transactions.some(t => t.id === snapshots.transaction.id);
                if (!exists) {
                    transactions.push(snapshots.transaction);
                    localStorage.setItem('posTransactions', JSON.stringify(transactions));
                }
            }
            
            // Restore shift
            if (snapshots.shift) {
                const shifts = JSON.parse(localStorage.getItem('riwayatTutupKas') || '[]');
                const shiftIndex = shifts.findIndex(s => s.id === snapshots.shift.id);
                if (shiftIndex !== -1) {
                    shifts[shiftIndex] = snapshots.shift;
                    localStorage.setItem('riwayatTutupKas', JSON.stringify(shifts));
                }
            }
            
            // Restore stock
            if (snapshots.stock && snapshots.stock.length > 0) {
                const barang = JSON.parse(localStorage.getItem('barang') || '[]');
                for (const stockItem of snapshots.stock) {
                    const product = barang.find(b => b.id === stockItem.id);
                    if (product) {
                        product.stok = stockItem.stok;
                    }
                }
                localStorage.setItem('barang', JSON.stringify(barang));
            }
            
            // Restore journals
            if (snapshots.journals) {
                localStorage.setItem('journals', JSON.stringify(snapshots.journals));
            }
            
            // Restore COA
            if (snapshots.coa) {
                localStorage.setItem('coa', JSON.stringify(snapshots.coa));
            }
            
        } catch (error) {
            console.error('CRITICAL: Rollback failed:', error);
        }
    }
}

// Initialize localStorage keys if they don't exist
(function initializeStorage() {
    const keys = [
        'closedShiftDeletionLog',
        'passwordVerificationTracking',
        'rateLimitTracking'
    ];
    
    keys.forEach(key => {
        if (!localStorage.getItem(key)) {
            if (key === 'closedShiftDeletionLog') {
                localStorage.setItem(key, JSON.stringify([]));
            } else {
                localStorage.setItem(key, JSON.stringify({}));
            }
        }
    });
})();

// Export classes for testing (if in Node.js environment)
// Note: RoleValidator is exported from backup.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PasswordVerificationService,
        RateLimiterService,
        TutupKasirAdjustmentService,
        CriticalAuditLoggerService,
        DataIntegrityValidator,
        ClosedShiftDeletionService
    };
}

// Also make available globally for browser environment
// Note: RoleValidator is made available by backup.js
if (typeof window !== 'undefined') {
    window.PasswordVerificationService = PasswordVerificationService;
    window.RateLimiterService = RateLimiterService;
    window.TutupKasirAdjustmentService = TutupKasirAdjustmentService;
    window.CriticalAuditLoggerService = CriticalAuditLoggerService;
    window.DataIntegrityValidator = DataIntegrityValidator;
    window.ClosedShiftDeletionService = ClosedShiftDeletionService;
}

// For ES6 module environments
// Note: RoleValidator is made available by backup.js
if (typeof global !== 'undefined') {
    global.PasswordVerificationService = PasswordVerificationService;
    global.RateLimiterService = RateLimiterService;
    global.TutupKasirAdjustmentService = TutupKasirAdjustmentService;
    global.CriticalAuditLoggerService = CriticalAuditLoggerService;
    global.DataIntegrityValidator = DataIntegrityValidator;
    global.ClosedShiftDeletionService = ClosedShiftDeletionService;
}

// ===== UI Components =====

/**
 * Render closed shift indicator badge for a transaction
 * @param {Object} transaction - Transaction object
 * @returns {string} HTML string for the badge, or empty string if not closed
 */
function renderClosedShiftIndicator(transaction) {
    if (!transaction) {
        return '';
    }
    
    // Check if transaction is in a closed shift
    const adjustmentService = new TutupKasirAdjustmentService();
    const shift = adjustmentService.identifyShift(transaction);
    
    if (!shift) {
        return '';
    }
    
    // Create badge HTML
    const badge = `
        <span class="badge badge-danger closed-shift-badge" 
              data-shift-id="${shift.id || ''}"
              data-transaction-id="${transaction.id || ''}"
              title="Transaksi ini sudah masuk dalam shift tertutup">
            <i class="fas fa-lock"></i> Shift Tertutup
        </span>
    `;
    
    return badge;
}

/**
 * Get shift information for a transaction
 * @param {Object} transaction - Transaction object
 * @returns {Object|null} Shift information or null if not found
 */
function getShiftInfo(transaction) {
    if (!transaction) {
        return null;
    }
    
    const adjustmentService = new TutupKasirAdjustmentService();
    const shift = adjustmentService.identifyShift(transaction);
    
    if (!shift) {
        return null;
    }
    
    return {
        shiftId: shift.id,
        tanggalTutup: shift.tanggalTutup,
        kasir: shift.kasir || shift.user || 'N/A',
        nomorLaporan: shift.nomorLaporan || shift.id,
        totalPenjualan: shift.totalPenjualan,
        totalKas: shift.totalKas,
        totalPiutang: shift.totalPiutang
    };
}

/**
 * Render shift information detail for a transaction
 * @param {Object} transaction - Transaction object
 * @returns {string} HTML string for shift info, or empty string if not closed
 */
function renderShiftInfoDetail(transaction) {
    const shiftInfo = getShiftInfo(transaction);
    
    if (!shiftInfo) {
        return '';
    }
    
    const tanggalTutup = shiftInfo.tanggalTutup 
        ? new Date(shiftInfo.tanggalTutup).toLocaleString('id-ID')
        : 'N/A';
    
    const html = `
        <div class="shift-info-detail alert alert-warning">
            <h6><i class="fas fa-info-circle"></i> Informasi Shift Tertutup</h6>
            <table class="table table-sm table-borderless mb-0">
                <tr>
                    <td><strong>Nomor Laporan:</strong></td>
                    <td>${shiftInfo.nomorLaporan}</td>
                </tr>
                <tr>
                    <td><strong>Tanggal Tutup:</strong></td>
                    <td>${tanggalTutup}</td>
                </tr>
                <tr>
                    <td><strong>Kasir:</strong></td>
                    <td>${shiftInfo.kasir}</td>
                </tr>
                <tr>
                    <td><strong>Total Penjualan:</strong></td>
                    <td>Rp ${(shiftInfo.totalPenjualan || 0).toLocaleString('id-ID')}</td>
                </tr>
            </table>
        </div>
    `;
    
    return html;
}

/**
 * Check if a transaction is in a closed shift
 * @param {Object} transaction - Transaction object
 * @returns {boolean} True if transaction is in a closed shift
 */
function isTransactionClosed(transaction) {
    if (!transaction) {
        return false;
    }
    
    const adjustmentService = new TutupKasirAdjustmentService();
    const shift = adjustmentService.identifyShift(transaction);
    
    return shift !== null;
}

/**
 * Filter transactions to show only closed transactions
 * @param {Array} transactions - Array of transaction objects
 * @returns {Array} Array of closed transactions
 */
function filterClosedTransactions(transactions) {
    if (!transactions || !Array.isArray(transactions)) {
        return [];
    }
    
    const adjustmentService = new TutupKasirAdjustmentService();
    
    return transactions.filter(transaction => {
        const shift = adjustmentService.identifyShift(transaction);
        return shift !== null;
    });
}

/**
 * Show warning dialog for closed shift deletion
 * @param {Object} transaction - Transaction to be deleted
 * @param {Object} shiftData - Shift data
 * @param {Function} onConfirm - Callback function when confirmed
 * @param {Function} onCancel - Callback function when cancelled
 */
function showClosedShiftWarning(transaction, shiftData, onConfirm, onCancel) {
    if (!transaction) {
        console.error('Transaction is required for warning dialog');
        return;
    }
    
    // Create modal HTML
    const modalId = 'closedShiftWarningModal';
    const existingModal = document.getElementById(modalId);
    
    if (existingModal) {
        existingModal.remove();
    }
    
    const tanggalTutup = shiftData && shiftData.tanggalTutup
        ? new Date(shiftData.tanggalTutup).toLocaleString('id-ID')
        : 'N/A';
    
    const modalHTML = `
        <div class="modal fade" id="${modalId}" tabindex="-1" role="dialog" data-backdrop="static" data-keyboard="false">
            <div class="modal-dialog modal-lg" role="document">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-exclamation-triangle"></i> 
                            PERINGATAN: Hapus Transaksi Tertutup
                        </h5>
                        <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-danger">
                            <strong>PERHATIAN!</strong> Anda akan menghapus transaksi yang sudah masuk dalam laporan tutup kasir yang telah ditutup.
                        </div>
                        
                        <h6 class="mb-3"><strong>Informasi Transaksi:</strong></h6>
                        <table class="table table-sm table-bordered mb-4">
                            <tr>
                                <td><strong>No. Transaksi:</strong></td>
                                <td>${transaction.noTransaksi || transaction.id}</td>
                            </tr>
                            <tr>
                                <td><strong>Tanggal:</strong></td>
                                <td>${transaction.tanggal ? new Date(transaction.tanggal).toLocaleString('id-ID') : 'N/A'}</td>
                            </tr>
                            <tr>
                                <td><strong>Total:</strong></td>
                                <td>Rp ${(transaction.total || 0).toLocaleString('id-ID')}</td>
                            </tr>
                            <tr>
                                <td><strong>Shift Tertutup:</strong></td>
                                <td>${tanggalTutup}</td>
                            </tr>
                        </table>
                        
                        <h6 class="mb-3"><strong>Dampak yang Akan Terjadi:</strong></h6>
                        <ul class="list-group mb-4">
                            <li class="list-group-item">
                                <i class="fas fa-file-invoice text-warning"></i>
                                <strong>Laporan Tutup Kasir:</strong> Total penjualan dan kas/piutang akan disesuaikan
                            </li>
                            <li class="list-group-item">
                                <i class="fas fa-book text-warning"></i>
                                <strong>Jurnal Akuntansi:</strong> Jurnal pembalik akan dibuat dengan tag khusus "CLOSED_SHIFT_REVERSAL"
                            </li>
                            <li class="list-group-item">
                                <i class="fas fa-boxes text-warning"></i>
                                <strong>Stok Barang:</strong> Stok akan dikembalikan sesuai item transaksi
                            </li>
                            <li class="list-group-item">
                                <i class="fas fa-chart-line text-warning"></i>
                                <strong>Laporan Keuangan:</strong> Semua laporan keuangan yang terkait akan terpengaruh
                            </li>
                            <li class="list-group-item">
                                <i class="fas fa-clipboard-check text-info"></i>
                                <strong>Audit Trail:</strong> Penghapusan ini akan dicatat dengan level CRITICAL
                            </li>
                        </ul>
                        
                        <div class="form-check mb-3">
                            <input type="checkbox" class="form-check-input" id="confirmUnderstandCheckbox">
                            <label class="form-check-label" for="confirmUnderstandCheckbox">
                                <strong>Saya memahami konsekuensi dari tindakan ini</strong>
                            </label>
                        </div>
                        
                        <div class="alert alert-info mb-0">
                            <i class="fas fa-info-circle"></i>
                            Setelah mengkonfirmasi, Anda akan diminta untuk memasukkan password dan memberikan alasan penghapusan.
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal" id="cancelWarningBtn">
                            <i class="fas fa-times"></i> Batal
                        </button>
                        <button type="button" class="btn btn-danger" id="confirmWarningBtn" disabled>
                            <i class="fas fa-check"></i> Lanjutkan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Get modal element
    const modalElement = document.getElementById(modalId);
    const checkbox = document.getElementById('confirmUnderstandCheckbox');
    const confirmBtn = document.getElementById('confirmWarningBtn');
    const cancelBtn = document.getElementById('cancelWarningBtn');
    
    // Enable/disable confirm button based on checkbox
    checkbox.addEventListener('change', function() {
        confirmBtn.disabled = !this.checked;
    });
    
    // Handle confirm
    confirmBtn.addEventListener('click', function() {
        // Close modal using jQuery if available, otherwise use vanilla JS
        if (typeof $ !== 'undefined' && $.fn.modal) {
            $(modalElement).modal('hide');
        } else {
            modalElement.style.display = 'none';
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
        }
        
        // Call onConfirm callback
        if (typeof onConfirm === 'function') {
            onConfirm();
        }
    });
    
    // Handle cancel
    cancelBtn.addEventListener('click', function() {
        if (typeof onCancel === 'function') {
            onCancel();
        }
    });
    
    // Show modal using jQuery if available, otherwise use vanilla JS
    if (typeof $ !== 'undefined' && $.fn.modal) {
        $(modalElement).modal('show');
        
        // Clean up on hide
        $(modalElement).on('hidden.bs.modal', function() {
            modalElement.remove();
        });
    } else {
        modalElement.style.display = 'block';
        modalElement.classList.add('show');
        
        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        document.body.appendChild(backdrop);
    }
}

/**
 * Show password confirmation dialog
 * @param {Function} callback - Callback function when password is verified
 *                              Receives { success: boolean, password: string, message: string }
 */
function showPasswordConfirmation(callback) {
    // Get current user
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (!currentUser || !currentUser.username) {
        if (typeof callback === 'function') {
            callback({
                success: false,
                password: null,
                message: 'User tidak ditemukan. Silakan login kembali.'
            });
        }
        return;
    }
    
    // Check if user is currently blocked
    const passwordService = new PasswordVerificationService();
    const blockStatus = passwordService.isBlocked(currentUser.username);
    
    // Create modal HTML
    const modalId = 'passwordConfirmationModal';
    const existingModal = document.getElementById(modalId);
    
    if (existingModal) {
        existingModal.remove();
    }
    
    // Prepare block warning HTML if user is blocked
    let blockWarningHTML = '';
    if (blockStatus.blocked) {
        const remainingMinutes = Math.ceil(blockStatus.remainingTime / 60);
        const remainingSeconds = blockStatus.remainingTime % 60;
        
        blockWarningHTML = `
            <div class="alert alert-danger" id="blockWarning">
                <i class="fas fa-ban"></i>
                <strong>Akses Diblokir!</strong><br>
                Terlalu banyak percobaan gagal. Silakan coba lagi dalam 
                <strong id="countdownTimer">${remainingMinutes}:${String(remainingSeconds).padStart(2, '0')}</strong>
            </div>
        `;
    }
    
    const modalHTML = `
        <div class="modal fade" id="${modalId}" tabindex="-1" role="dialog" data-backdrop="static" data-keyboard="false">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-lock"></i> 
                            Konfirmasi Password
                        </h5>
                        <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i>
                            Untuk keamanan, silakan masukkan password Anda untuk melanjutkan.
                        </div>
                        
                        ${blockWarningHTML}
                        
                        <div id="errorMessage" class="alert alert-danger" style="display: none;">
                            <i class="fas fa-exclamation-triangle"></i>
                            <span id="errorText"></span>
                        </div>
                        
                        <div class="form-group">
                            <label for="passwordInput">
                                <strong>Password untuk ${currentUser.username}:</strong>
                            </label>
                            <input type="password" 
                                   class="form-control" 
                                   id="passwordInput" 
                                   placeholder="Masukkan password Anda"
                                   ${blockStatus.blocked ? 'disabled' : ''}>
                        </div>
                        
                        <div id="attemptWarning" class="alert alert-warning" style="display: none;">
                            <i class="fas fa-exclamation-circle"></i>
                            <span id="attemptText"></span>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal" id="cancelPasswordBtn">
                            <i class="fas fa-times"></i> Batal
                        </button>
                        <button type="button" class="btn btn-primary" id="confirmPasswordBtn" ${blockStatus.blocked ? 'disabled' : ''}>
                            <i class="fas fa-check"></i> Konfirmasi
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Get modal elements
    const modalElement = document.getElementById(modalId);
    const passwordInput = document.getElementById('passwordInput');
    const confirmBtn = document.getElementById('confirmPasswordBtn');
    const cancelBtn = document.getElementById('cancelPasswordBtn');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const attemptWarning = document.getElementById('attemptWarning');
    const attemptText = document.getElementById('attemptText');
    
    // Start countdown timer if blocked
    let countdownInterval = null;
    if (blockStatus.blocked) {
        let remainingTime = blockStatus.remainingTime;
        const countdownTimer = document.getElementById('countdownTimer');
        
        countdownInterval = setInterval(() => {
            remainingTime--;
            
            if (remainingTime <= 0) {
                clearInterval(countdownInterval);
                
                // Re-enable input and button
                passwordInput.disabled = false;
                confirmBtn.disabled = false;
                
                // Hide block warning
                const blockWarning = document.getElementById('blockWarning');
                if (blockWarning) {
                    blockWarning.style.display = 'none';
                }
                
                // Show success message
                errorMessage.style.display = 'block';
                errorMessage.className = 'alert alert-success';
                errorText.textContent = 'Akses telah dipulihkan. Silakan masukkan password Anda.';
            } else {
                const minutes = Math.floor(remainingTime / 60);
                const seconds = remainingTime % 60;
                countdownTimer.textContent = `${minutes}:${String(seconds).padStart(2, '0')}`;
            }
        }, 1000);
    }
    
    // Handle password verification
    const verifyPassword = () => {
        const password = passwordInput.value.trim();
        
        if (!password) {
            errorMessage.style.display = 'block';
            errorText.textContent = 'Password tidak boleh kosong';
            return;
        }
        
        // Verify password
        const result = passwordService.verifyPassword(currentUser.username, password);
        
        if (result.valid) {
            // Clear countdown if exists
            if (countdownInterval) {
                clearInterval(countdownInterval);
            }
            
            // Close modal
            if (typeof $ !== 'undefined' && $.fn.modal) {
                $(modalElement).modal('hide');
            } else {
                modalElement.style.display = 'none';
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) {
                    backdrop.remove();
                }
            }
            
            // Call callback with success
            if (typeof callback === 'function') {
                callback({
                    success: true,
                    password: password,
                    message: result.message
                });
            }
        } else {
            // Show error message
            errorMessage.style.display = 'block';
            errorMessage.className = 'alert alert-danger';
            errorText.textContent = result.message;
            
            // Show remaining attempts warning if available
            if (result.remainingAttempts !== undefined) {
                if (result.remainingAttempts > 0) {
                    attemptWarning.style.display = 'block';
                    attemptText.textContent = `Sisa percobaan: ${result.remainingAttempts}`;
                } else {
                    // User is now blocked - disable input and button
                    passwordInput.disabled = true;
                    confirmBtn.disabled = true;
                    
                    // Start countdown
                    const blockDuration = 5 * 60; // 5 minutes in seconds
                    let remainingTime = blockDuration;
                    
                    // Show block warning
                    const blockWarningDiv = document.createElement('div');
                    blockWarningDiv.className = 'alert alert-danger';
                    blockWarningDiv.id = 'blockWarning';
                    blockWarningDiv.innerHTML = `
                        <i class="fas fa-ban"></i>
                        <strong>Akses Diblokir!</strong><br>
                        Terlalu banyak percobaan gagal. Silakan coba lagi dalam 
                        <strong id="countdownTimer">${Math.floor(remainingTime / 60)}:${String(remainingTime % 60).padStart(2, '0')}</strong>
                    `;
                    
                    // Insert after info alert
                    const infoAlert = modalElement.querySelector('.alert-info');
                    if (infoAlert) {
                        infoAlert.insertAdjacentElement('afterend', blockWarningDiv);
                    }
                    
                    const countdownTimer = document.getElementById('countdownTimer');
                    
                    countdownInterval = setInterval(() => {
                        remainingTime--;
                        
                        if (remainingTime <= 0) {
                            clearInterval(countdownInterval);
                            
                            // Re-enable input and button
                            passwordInput.disabled = false;
                            confirmBtn.disabled = false;
                            
                            // Hide block warning
                            blockWarningDiv.style.display = 'none';
                            
                            // Show success message
                            errorMessage.style.display = 'block';
                            errorMessage.className = 'alert alert-success';
                            errorText.textContent = 'Akses telah dipulihkan. Silakan masukkan password Anda.';
                            
                            // Clear password input
                            passwordInput.value = '';
                        } else {
                            const minutes = Math.floor(remainingTime / 60);
                            const seconds = remainingTime % 60;
                            countdownTimer.textContent = `${minutes}:${String(seconds).padStart(2, '0')}`;
                        }
                    }, 1000);
                }
            }
            
            // Clear password input
            passwordInput.value = '';
            passwordInput.focus();
        }
    };
    
    // Handle confirm button click
    confirmBtn.addEventListener('click', verifyPassword);
    
    // Handle Enter key in password input
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !confirmBtn.disabled) {
            verifyPassword();
        }
    });
    
    // Handle cancel
    cancelBtn.addEventListener('click', function() {
        // Clear countdown if exists
        if (countdownInterval) {
            clearInterval(countdownInterval);
        }
        
        if (typeof callback === 'function') {
            callback({
                success: false,
                password: null,
                message: 'Dibatalkan oleh user'
            });
        }
    });
    
    // Show modal
    if (typeof $ !== 'undefined' && $.fn.modal) {
        $(modalElement).modal('show');
        
        // Clean up on hide
        $(modalElement).on('hidden.bs.modal', function() {
            if (countdownInterval) {
                clearInterval(countdownInterval);
            }
            modalElement.remove();
        });
    } else {
        modalElement.style.display = 'block';
        modalElement.classList.add('show');
        
        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        document.body.appendChild(backdrop);
    }
    
    // Focus on password input if not blocked
    if (!blockStatus.blocked) {
        setTimeout(() => {
            passwordInput.focus();
        }, 500);
    }
}

/**
 * Show category and reason dialog for closed shift deletion
 * @param {Object} transaction - Transaction to be deleted
 * @param {Function} callback - Callback function when confirmed
 *                              Receives { success: boolean, category: string, reason: string, message: string }
 */
function showCategoryReasonDialog(transaction, callback) {
    if (!transaction) {
        console.error('Transaction is required for category/reason dialog');
        if (typeof callback === 'function') {
            callback({
                success: false,
                category: null,
                reason: null,
                message: 'Transaksi tidak valid'
            });
        }
        return;
    }
    
    // Create modal HTML
    const modalId = 'categoryReasonModal';
    const existingModal = document.getElementById(modalId);
    
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalHTML = `
        <div class="modal fade" id="${modalId}" tabindex="-1" role="dialog" data-backdrop="static" data-keyboard="false">
            <div class="modal-dialog modal-lg" role="document">
                <div class="modal-content">
                    <div class="modal-header bg-warning text-dark">
                        <h5 class="modal-title">
                            <i class="fas fa-clipboard-list"></i> 
                            Kategori dan Alasan Penghapusan
                        </h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i>
                            Untuk keperluan audit, silakan pilih kategori kesalahan dan berikan alasan detail penghapusan transaksi ini.
                        </div>
                        
                        <h6 class="mb-3"><strong>Ringkasan Transaksi yang Akan Dihapus:</strong></h6>
                        <div class="card mb-4">
                            <div class="card-body">
                                <table class="table table-sm table-borderless mb-0">
                                    <tr>
                                        <td width="40%"><strong>No. Transaksi:</strong></td>
                                        <td>${transaction.noTransaksi || transaction.id}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Tanggal:</strong></td>
                                        <td>${transaction.tanggal ? new Date(transaction.tanggal).toLocaleString('id-ID') : 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Kasir:</strong></td>
                                        <td>${transaction.kasir || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Metode Pembayaran:</strong></td>
                                        <td>${transaction.metode === 'cash' ? 'Tunai' : 'Kredit/Bon'}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Total:</strong></td>
                                        <td><strong class="text-primary">Rp ${(transaction.total || 0).toLocaleString('id-ID')}</strong></td>
                                    </tr>
                                    <tr>
                                        <td><strong>Jumlah Item:</strong></td>
                                        <td>${transaction.items ? transaction.items.length : 0} item</td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                        
                        <div id="validationError" class="alert alert-danger" style="display: none;">
                            <i class="fas fa-exclamation-triangle"></i>
                            <span id="validationErrorText"></span>
                        </div>
                        
                        <div class="form-group">
                            <label for="categorySelect">
                                <strong>Kategori Kesalahan: <span class="text-danger">*</span></strong>
                            </label>
                            <select class="form-control" id="categorySelect">
                                <option value="">-- Pilih Kategori --</option>
                                <option value="Kesalahan Input">Kesalahan Input</option>
                                <option value="Transaksi Duplikat">Transaksi Duplikat</option>
                                <option value="Fraud">Fraud</option>
                                <option value="Koreksi Akuntansi">Koreksi Akuntansi</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                            <small class="form-text text-muted">
                                Pilih kategori yang paling sesuai dengan alasan penghapusan
                            </small>
                        </div>
                        
                        <div class="form-group">
                            <label for="reasonTextarea">
                                <strong>Alasan Detail: <span class="text-danger">*</span></strong>
                            </label>
                            <textarea class="form-control" 
                                      id="reasonTextarea" 
                                      rows="5" 
                                      placeholder="Jelaskan secara detail alasan penghapusan transaksi ini (minimal 20 karakter, maksimal 1000 karakter)"
                                      maxlength="1000"></textarea>
                            <div class="d-flex justify-content-between mt-1">
                                <small class="form-text text-muted">
                                    Minimal 20 karakter, maksimal 1000 karakter
                                </small>
                                <small class="form-text" id="charCounter">
                                    <span id="charCount">0</span> / 1000 karakter
                                </small>
                            </div>
                        </div>
                        
                        <div class="alert alert-warning mb-0">
                            <i class="fas fa-exclamation-circle"></i>
                            <strong>Catatan:</strong> Informasi ini akan disimpan dalam audit log dan tidak dapat diubah setelah penghapusan.
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal" id="cancelCategoryBtn">
                            <i class="fas fa-times"></i> Batal
                        </button>
                        <button type="button" class="btn btn-primary" id="confirmCategoryBtn">
                            <i class="fas fa-check"></i> Konfirmasi
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Get modal elements
    const modalElement = document.getElementById(modalId);
    const categorySelect = document.getElementById('categorySelect');
    const reasonTextarea = document.getElementById('reasonTextarea');
    const charCount = document.getElementById('charCount');
    const charCounter = document.getElementById('charCounter');
    const confirmBtn = document.getElementById('confirmCategoryBtn');
    const cancelBtn = document.getElementById('cancelCategoryBtn');
    const validationError = document.getElementById('validationError');
    const validationErrorText = document.getElementById('validationErrorText');
    
    // Character counter with real-time update
    reasonTextarea.addEventListener('input', function() {
        const length = this.value.length;
        charCount.textContent = length;
        
        // Update color based on length
        if (length < 20) {
            charCounter.className = 'form-text text-danger';
        } else if (length >= 1000) {
            charCounter.className = 'form-text text-warning';
        } else {
            charCounter.className = 'form-text text-success';
        }
    });
    
    // Validation function
    const validateInput = () => {
        const category = categorySelect.value.trim();
        const reasonRaw = reasonTextarea.value;
        const reason = reasonRaw.trim();
        const errors = [];
        
        // Validate category
        if (!category) {
            errors.push('Kategori kesalahan harus dipilih');
        }
        
        // Validate reason length (use trimmed version for validation)
        if (!reason) {
            errors.push('Alasan harus diisi');
        } else if (reason.length < 20) {
            errors.push(`Alasan harus minimal 20 karakter (saat ini: ${reason.length} karakter)`);
        } else if (reasonRaw.length > 1000) {
            // Check raw length for max limit (before trim)
            errors.push('Alasan maksimal 1000 karakter');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors,
            category: category,
            reason: reason
        };
    };
    
    // Handle confirmation
    const handleConfirm = () => {
        const validation = validateInput();
        
        if (!validation.valid) {
            // Show validation errors
            validationError.style.display = 'block';
            validationErrorText.innerHTML = validation.errors.join('<br>');
            
            // Highlight invalid fields
            if (!validation.category) {
                categorySelect.classList.add('is-invalid');
            } else {
                categorySelect.classList.remove('is-invalid');
            }
            
            if (!validation.reason || validation.reason.length < 20 || validation.reason.length > 1000) {
                reasonTextarea.classList.add('is-invalid');
            } else {
                reasonTextarea.classList.remove('is-invalid');
            }
            
            return;
        }
        
        // Close modal
        if (typeof $ !== 'undefined' && $.fn.modal) {
            $(modalElement).modal('hide');
        } else {
            modalElement.style.display = 'none';
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
        }
        
        // Call callback with success
        if (typeof callback === 'function') {
            callback({
                success: true,
                category: validation.category,
                reason: validation.reason,
                message: 'Kategori dan alasan berhasil divalidasi'
            });
        }
    };
    
    // Handle confirm button click
    confirmBtn.addEventListener('click', handleConfirm);
    
    // Handle Enter key in textarea (Ctrl+Enter to submit)
    reasonTextarea.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            handleConfirm();
        }
    });
    
    // Clear validation errors when user types
    categorySelect.addEventListener('change', function() {
        validationError.style.display = 'none';
        this.classList.remove('is-invalid');
    });
    
    reasonTextarea.addEventListener('input', function() {
        validationError.style.display = 'none';
        this.classList.remove('is-invalid');
    });
    
    // Handle cancel
    cancelBtn.addEventListener('click', function() {
        if (typeof callback === 'function') {
            callback({
                success: false,
                category: null,
                reason: null,
                message: 'Dibatalkan oleh user'
            });
        }
    });
    
    // Show modal
    if (typeof $ !== 'undefined' && $.fn.modal) {
        $(modalElement).modal('show');
        
        // Clean up on hide
        $(modalElement).on('hidden.bs.modal', function() {
            modalElement.remove();
        });
    } else {
        modalElement.style.display = 'block';
        modalElement.classList.add('show');
        
        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        document.body.appendChild(backdrop);
    }
    
    // Focus on category select
    setTimeout(() => {
        categorySelect.focus();
    }, 500);
}

// Export UI functions for browser environment
if (typeof window !== 'undefined') {
    window.renderClosedShiftIndicator = renderClosedShiftIndicator;
    window.getShiftInfo = getShiftInfo;
    window.renderShiftInfoDetail = renderShiftInfoDetail;
    window.isTransactionClosed = isTransactionClosed;
    window.filterClosedTransactions = filterClosedTransactions;
    window.showClosedShiftWarning = showClosedShiftWarning;
    window.showPasswordConfirmation = showPasswordConfirmation;
    window.showCategoryReasonDialog = showCategoryReasonDialog;
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ...module.exports,
        renderClosedShiftIndicator,
        getShiftInfo,
        renderShiftInfoDetail,
        isTransactionClosed,
        filterClosedTransactions,
        showClosedShiftWarning,
        showPasswordConfirmation,
        showCategoryReasonDialog
    };
}

// ===== Critical History Page Components =====

/**
 * Render critical history page with tab for closed transaction deletions
 * @param {string} containerId - ID of container element to render into
 */
function renderCriticalHistory(containerId = 'content') {
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error(`Container with ID "${containerId}" not found`);
        return;
    }
    
    // Get critical history logs
    const auditLogger = new CriticalAuditLoggerService();
    const logs = auditLogger.getCriticalHistory();
    
    // Sort logs by deletion date (newest first)
    logs.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));
    
    // Create page HTML
    const pageHTML = `
        <div class="critical-history-page">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>
                    <i class="fas fa-history text-danger"></i>
                    Riwayat Penghapusan Transaksi Tertutup
                </h2>
            </div>
            
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                <strong>Informasi:</strong> Halaman ini menampilkan riwayat penghapusan transaksi yang sudah masuk dalam laporan tutup kasir yang telah ditutup. 
                Semua penghapusan dicatat dengan level <span class="badge badge-danger">CRITICAL</span> untuk keperluan audit.
            </div>
            
            <!-- Filter and Search -->
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4 mb-3 mb-md-0">
                            <label class="form-label"><strong>Cari:</strong></label>
                            <input type="text" 
                                   class="form-control" 
                                   id="searchCriticalHistory" 
                                   placeholder="Cari berdasarkan Audit ID, No Transaksi, atau User...">
                        </div>
                        <div class="col-md-3 mb-3 mb-md-0">
                            <label class="form-label"><strong>Kategori:</strong></label>
                            <select class="form-control" id="filterCategory">
                                <option value="">Semua Kategori</option>
                                <option value="Kesalahan Input">Kesalahan Input</option>
                                <option value="Transaksi Duplikat">Transaksi Duplikat</option>
                                <option value="Fraud">Fraud</option>
                                <option value="Koreksi Akuntansi">Koreksi Akuntansi</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                        </div>
                        <div class="col-md-3 mb-3 mb-md-0">
                            <label class="form-label"><strong>Tanggal:</strong></label>
                            <input type="date" class="form-control" id="filterDate">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">&nbsp;</label>
                            <button class="btn btn-secondary btn-block w-100" onclick="resetCriticalHistoryFilters()">
                                <i class="fas fa-redo"></i> Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Statistics -->
            <div class="row mb-4">
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="card bg-danger text-white">
                        <div class="card-body">
                            <h5 class="card-title">
                                <i class="fas fa-exclamation-triangle"></i> Total Critical
                            </h5>
                            <h2 class="mb-0">${logs.length}</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="card bg-warning text-dark">
                        <div class="card-body">
                            <h5 class="card-title">
                                <i class="fas fa-calendar-day"></i> Hari Ini
                            </h5>
                            <h2 class="mb-0">${countLogsToday(logs)}</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="card bg-info text-white">
                        <div class="card-body">
                            <h5 class="card-title">
                                <i class="fas fa-calendar-week"></i> Minggu Ini
                            </h5>
                            <h2 class="mb-0">${countLogsThisWeek(logs)}</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6 mb-3">
                    <div class="card bg-secondary text-white">
                        <div class="card-body">
                            <h5 class="card-title">
                                <i class="fas fa-calendar-alt"></i> Bulan Ini
                            </h5>
                            <h2 class="mb-0">${countLogsThisMonth(logs)}</h2>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Critical History Table -->
            <div class="card">
                <div class="card-header bg-danger text-white">
                    <h5 class="mb-0">
                        <i class="fas fa-list"></i> Daftar Penghapusan Transaksi Tertutup
                    </h5>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-striped table-hover" id="criticalHistoryTable">
                            <thead class="thead-dark">
                                <tr>
                                    <th>Level</th>
                                    <th>Audit ID</th>
                                    <th>No Transaksi</th>
                                    <th>Tanggal Transaksi</th>
                                    <th>Tanggal Tutup Kasir</th>
                                    <th>Tanggal Penghapusan</th>
                                    <th>User</th>
                                    <th>Kategori</th>
                                    <th>Status Adjustment</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody id="criticalHistoryTableBody">
                                ${renderCriticalHistoryRows(logs)}
                            </tbody>
                        </table>
                    </div>
                    
                    <div id="noDataMessage" class="text-center py-5 ${logs.length > 0 ? 'd-none' : ''}">
                        <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                        <p class="text-muted">Belum ada riwayat penghapusan transaksi tertutup</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = pageHTML;
    
    // Attach event listeners for filters
    attachCriticalHistoryFilters();
}

/**
 * Render table rows for critical history
 * @param {Array} logs - Array of audit logs
 * @returns {string} HTML string for table rows
 */
function renderCriticalHistoryRows(logs) {
    if (!logs || logs.length === 0) {
        return '';
    }
    
    return logs.map(log => {
        const transactionDate = log.transactionSnapshot?.tanggal 
            ? new Date(log.transactionSnapshot.tanggal).toLocaleDateString('id-ID')
            : 'N/A';
        
        const shiftDate = log.shiftSnapshot?.before?.tanggalTutup
            ? new Date(log.shiftSnapshot.before.tanggalTutup).toLocaleDateString('id-ID')
            : 'N/A';
        
        const deletionDate = log.deletedAt
            ? new Date(log.deletedAt).toLocaleString('id-ID')
            : 'N/A';
        
        const adjustmentStatus = log.adjustmentData?.success !== false
            ? '<span class="badge badge-success">Berhasil</span>'
            : '<span class="badge badge-danger">Gagal</span>';
        
        return `
            <tr data-audit-id="${log.auditId}" 
                data-category="${log.category}" 
                data-user="${log.deletedBy}"
                data-date="${log.deletedAt}">
                <td>
                    <span class="badge badge-danger">
                        <i class="fas fa-exclamation-circle"></i> CRITICAL
                    </span>
                </td>
                <td><code>${log.auditId}</code></td>
                <td>${log.transactionNo || log.transactionId}</td>
                <td>${transactionDate}</td>
                <td>${shiftDate}</td>
                <td>${deletionDate}</td>
                <td>${log.deletedBy}</td>
                <td>
                    <span class="badge badge-secondary">${log.category}</span>
                </td>
                <td>${adjustmentStatus}</td>
                <td>
                    <button class="btn btn-sm btn-info" 
                            onclick="showCriticalDeletionDetail('${log.auditId}')"
                            title="Lihat Detail">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-primary" 
                            onclick="exportCriticalAuditToPDF('${log.auditId}')"
                            title="Export PDF">
                        <i class="fas fa-file-pdf"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Count logs from today
 * @param {Array} logs - Array of audit logs
 * @returns {number} Count of logs from today
 */
function countLogsToday(logs) {
    const today = new Date().toISOString().split('T')[0];
    return logs.filter(log => {
        const logDate = new Date(log.deletedAt).toISOString().split('T')[0];
        return logDate === today;
    }).length;
}

/**
 * Count logs from this week
 * @param {Array} logs - Array of audit logs
 * @returns {number} Count of logs from this week
 */
function countLogsThisWeek(logs) {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    
    return logs.filter(log => {
        const logDate = new Date(log.deletedAt);
        return logDate >= weekStart;
    }).length;
}

/**
 * Count logs from this month
 * @param {Array} logs - Array of audit logs
 * @returns {number} Count of logs from this month
 */
function countLogsThisMonth(logs) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return logs.filter(log => {
        const logDate = new Date(log.deletedAt);
        return logDate >= monthStart;
    }).length;
}

/**
 * Attach event listeners for critical history filters
 */
function attachCriticalHistoryFilters() {
    const searchInput = document.getElementById('searchCriticalHistory');
    const categoryFilter = document.getElementById('filterCategory');
    const dateFilter = document.getElementById('filterDate');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterCriticalHistoryTable);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterCriticalHistoryTable);
    }
    
    if (dateFilter) {
        dateFilter.addEventListener('change', filterCriticalHistoryTable);
    }
}

/**
 * Filter critical history table based on search and filter inputs
 */
function filterCriticalHistoryTable() {
    const searchValue = document.getElementById('searchCriticalHistory')?.value.toLowerCase() || '';
    const categoryValue = document.getElementById('filterCategory')?.value || '';
    const dateValue = document.getElementById('filterDate')?.value || '';
    
    const tableBody = document.getElementById('criticalHistoryTableBody');
    const rows = tableBody?.querySelectorAll('tr') || [];
    
    let visibleCount = 0;
    
    rows.forEach(row => {
        const auditId = row.getAttribute('data-audit-id') || '';
        const category = row.getAttribute('data-category') || '';
        const user = row.getAttribute('data-user') || '';
        const date = row.getAttribute('data-date') || '';
        const transactionNo = row.cells[2]?.textContent || '';
        
        // Check search match
        const searchMatch = !searchValue || 
            auditId.toLowerCase().includes(searchValue) ||
            transactionNo.toLowerCase().includes(searchValue) ||
            user.toLowerCase().includes(searchValue);
        
        // Check category match
        const categoryMatch = !categoryValue || category === categoryValue;
        
        // Check date match
        let dateMatch = true;
        if (dateValue) {
            const rowDate = new Date(date).toISOString().split('T')[0];
            dateMatch = rowDate === dateValue;
        }
        
        // Show/hide row based on all filters
        if (searchMatch && categoryMatch && dateMatch) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    // Show/hide no data message
    const noDataMessage = document.getElementById('noDataMessage');
    if (noDataMessage) {
        if (visibleCount === 0) {
            noDataMessage.classList.remove('d-none');
            noDataMessage.innerHTML = `
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <p class="text-muted">Tidak ada data yang sesuai dengan filter</p>
            `;
        } else {
            noDataMessage.classList.add('d-none');
        }
    }
}

/**
 * Reset all critical history filters
 */
function resetCriticalHistoryFilters() {
    const searchInput = document.getElementById('searchCriticalHistory');
    const categoryFilter = document.getElementById('filterCategory');
    const dateFilter = document.getElementById('filterDate');
    
    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (dateFilter) dateFilter.value = '';
    
    filterCriticalHistoryTable();
}

/**
 * Show detailed view of a critical deletion audit log
 * @param {string} auditId - Audit ID to display
 */
function showCriticalDeletionDetail(auditId) {
    if (!auditId) {
        console.error('Audit ID is required');
        return;
    }
    
    // Get audit log
    const auditLogger = new CriticalAuditLoggerService();
    const logs = auditLogger.getCriticalHistory();
    const log = logs.find(l => l.auditId === auditId);
    
    if (!log) {
        alert('Audit log tidak ditemukan');
        return;
    }
    
    // Create modal HTML
    const modalId = 'criticalDeletionDetailModal';
    const existingModal = document.getElementById(modalId);
    
    if (existingModal) {
        existingModal.remove();
    }
    
    // Format dates
    const transactionDate = log.transactionSnapshot?.tanggal 
        ? new Date(log.transactionSnapshot.tanggal).toLocaleString('id-ID')
        : 'N/A';
    
    const deletionDate = log.deletedAt
        ? new Date(log.deletedAt).toLocaleString('id-ID')
        : 'N/A';
    
    const passwordVerifiedAt = log.passwordVerifiedAt
        ? new Date(log.passwordVerifiedAt).toLocaleString('id-ID')
        : 'N/A';
    
    // Format transaction items
    const itemsHTML = log.transactionSnapshot?.items?.map(item => `
        <tr>
            <td>${item.nama || 'N/A'}</td>
            <td class="text-center">${item.qty || 0}</td>
            <td class="text-right">Rp ${(item.harga || 0).toLocaleString('id-ID')}</td>
            <td class="text-right">Rp ${((item.harga || 0) * (item.qty || 0)).toLocaleString('id-ID')}</td>
        </tr>
    `).join('') || '<tr><td colspan="4" class="text-center">Tidak ada item</td></tr>';
    
    // Format shift snapshots
    const shiftBeforeHTML = log.shiftSnapshot?.before ? `
        <table class="table table-sm table-bordered">
            <tr>
                <td><strong>Total Penjualan:</strong></td>
                <td class="text-right">Rp ${(log.shiftSnapshot.before.totalPenjualan || 0).toLocaleString('id-ID')}</td>
            </tr>
            <tr>
                <td><strong>Total Kas:</strong></td>
                <td class="text-right">Rp ${(log.shiftSnapshot.before.totalKas || 0).toLocaleString('id-ID')}</td>
            </tr>
            <tr>
                <td><strong>Total Piutang:</strong></td>
                <td class="text-right">Rp ${(log.shiftSnapshot.before.totalPiutang || 0).toLocaleString('id-ID')}</td>
            </tr>
        </table>
    ` : '<p class="text-muted">Data tidak tersedia</p>';
    
    const shiftAfterHTML = log.shiftSnapshot?.after ? `
        <table class="table table-sm table-bordered">
            <tr>
                <td><strong>Total Penjualan:</strong></td>
                <td class="text-right">Rp ${(log.shiftSnapshot.after.totalPenjualan || 0).toLocaleString('id-ID')}</td>
            </tr>
            <tr>
                <td><strong>Total Kas:</strong></td>
                <td class="text-right">Rp ${(log.shiftSnapshot.after.totalKas || 0).toLocaleString('id-ID')}</td>
            </tr>
            <tr>
                <td><strong>Total Piutang:</strong></td>
                <td class="text-right">Rp ${(log.shiftSnapshot.after.totalPiutang || 0).toLocaleString('id-ID')}</td>
            </tr>
        </table>
    ` : '<p class="text-muted">Data tidak tersedia</p>';
    
    // Format journal entries
    const journalEntriesHTML = log.journalEntries?.map((journal, index) => `
        <div class="card mb-2">
            <div class="card-header bg-light">
                <strong>Jurnal ${index + 1}:</strong> ${journal.deskripsi || 'N/A'}
                ${journal.tag ? `<span class="badge badge-info ml-2">${journal.tag}</span>` : ''}
            </div>
            <div class="card-body p-2">
                <table class="table table-sm table-bordered mb-0">
                    <thead>
                        <tr>
                            <th>Akun</th>
                            <th class="text-right">Debit</th>
                            <th class="text-right">Kredit</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${journal.entries?.map(entry => `
                            <tr>
                                <td>${entry.akun || 'N/A'}</td>
                                <td class="text-right">Rp ${(entry.debit || 0).toLocaleString('id-ID')}</td>
                                <td class="text-right">Rp ${(entry.kredit || 0).toLocaleString('id-ID')}</td>
                            </tr>
                        `).join('') || '<tr><td colspan="3" class="text-center">Tidak ada entry</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `).join('') || '<p class="text-muted">Tidak ada jurnal</p>';
    
    // Format validation results
    const preValidationHTML = log.validationResults?.preDelete ? `
        <div class="alert ${log.validationResults.preDelete.valid ? 'alert-success' : 'alert-danger'}">
            <strong>Status:</strong> ${log.validationResults.preDelete.valid ? 'Valid' : 'Invalid'}
            ${log.validationResults.preDelete.errors?.length > 0 ? `
                <ul class="mb-0 mt-2">
                    ${log.validationResults.preDelete.errors.map(err => `<li>${err}</li>`).join('')}
                </ul>
            ` : ''}
        </div>
    ` : '<p class="text-muted">Data tidak tersedia</p>';
    
    const postValidationHTML = log.validationResults?.postDelete ? `
        <div class="alert ${log.validationResults.postDelete.valid ? 'alert-success' : 'alert-danger'}">
            <strong>Status:</strong> ${log.validationResults.postDelete.valid ? 'Valid' : 'Invalid'}
            ${log.validationResults.postDelete.errors?.length > 0 ? `
                <ul class="mb-0 mt-2">
                    ${log.validationResults.postDelete.errors.map(err => `<li>${err}</li>`).join('')}
                </ul>
            ` : ''}
        </div>
    ` : '<p class="text-muted">Data tidak tersedia</p>';
    
    // Format warnings
    const warningsHTML = log.warnings?.length > 0 ? `
        <div class="alert alert-warning">
            <strong><i class="fas fa-exclamation-triangle"></i> Peringatan:</strong>
            <ul class="mb-0 mt-2">
                ${log.warnings.map(warning => `<li>${warning}</li>`).join('')}
            </ul>
        </div>
    ` : '<p class="text-muted">Tidak ada peringatan</p>';
    
    const modalHTML = `
        <div class="modal fade" id="${modalId}" tabindex="-1" role="dialog">
            <div class="modal-dialog modal-xl" role="document" style="max-width: 95%;">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title">
                            <i class="fas fa-file-alt"></i> 
                            Detail Audit Log - ${log.auditId}
                        </h5>
                        <button type="button" class="close text-white" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body" style="max-height: 80vh; overflow-y: auto;">
                        <!-- Audit Information -->
                        <div class="card mb-3">
                            <div class="card-header bg-dark text-white">
                                <h6 class="mb-0"><i class="fas fa-info-circle"></i> Informasi Audit</h6>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <table class="table table-sm table-borderless">
                                            <tr>
                                                <td width="40%"><strong>Audit ID:</strong></td>
                                                <td><code>${log.auditId}</code></td>
                                            </tr>
                                            <tr>
                                                <td><strong>Level:</strong></td>
                                                <td><span class="badge badge-danger">${log.level}</span></td>
                                            </tr>
                                            <tr>
                                                <td><strong>Dihapus Oleh:</strong></td>
                                                <td>${log.deletedBy}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Tanggal Penghapusan:</strong></td>
                                                <td>${deletionDate}</td>
                                            </tr>
                                        </table>
                                    </div>
                                    <div class="col-md-6">
                                        <table class="table table-sm table-borderless">
                                            <tr>
                                                <td width="40%"><strong>Password Verified:</strong></td>
                                                <td>${passwordVerifiedAt}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Kategori:</strong></td>
                                                <td><span class="badge badge-secondary">${log.category}</span></td>
                                            </tr>
                                            <tr>
                                                <td><strong>Stok Dikembalikan:</strong></td>
                                                <td>${log.stockRestored ? '<span class="badge badge-success">Ya</span>' : '<span class="badge badge-danger">Tidak</span>'}</td>
                                            </tr>
                                        </table>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col-12">
                                        <strong>Alasan Penghapusan:</strong>
                                        <div class="alert alert-light mt-2">
                                            ${log.reason || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Transaction Snapshot -->
                        <div class="card mb-3">
                            <div class="card-header bg-primary text-white">
                                <h6 class="mb-0"><i class="fas fa-receipt"></i> Snapshot Transaksi</h6>
                            </div>
                            <div class="card-body">
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <table class="table table-sm table-borderless">
                                            <tr>
                                                <td width="40%"><strong>No. Transaksi:</strong></td>
                                                <td>${log.transactionNo || log.transactionId}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Tanggal:</strong></td>
                                                <td>${transactionDate}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Kasir:</strong></td>
                                                <td>${log.transactionSnapshot?.kasir || 'N/A'}</td>
                                            </tr>
                                        </table>
                                    </div>
                                    <div class="col-md-6">
                                        <table class="table table-sm table-borderless">
                                            <tr>
                                                <td width="40%"><strong>Metode:</strong></td>
                                                <td>${log.transactionSnapshot?.metode === 'cash' ? 'Tunai' : 'Kredit/Bon'}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Total:</strong></td>
                                                <td><strong class="text-primary">Rp ${(log.transactionSnapshot?.total || 0).toLocaleString('id-ID')}</strong></td>
                                            </tr>
                                        </table>
                                    </div>
                                </div>
                                
                                <strong>Item Transaksi:</strong>
                                <div class="table-responsive mt-2">
                                    <table class="table table-sm table-bordered">
                                        <thead class="thead-light">
                                            <tr>
                                                <th>Nama Barang</th>
                                                <th class="text-center">Qty</th>
                                                <th class="text-right">Harga</th>
                                                <th class="text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${itemsHTML}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Shift Snapshots -->
                        <div class="card mb-3">
                            <div class="card-header bg-warning text-dark">
                                <h6 class="mb-0"><i class="fas fa-exchange-alt"></i> Snapshot Laporan Tutup Kasir</h6>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6 class="text-danger"><i class="fas fa-arrow-left"></i> Sebelum Adjustment</h6>
                                        ${shiftBeforeHTML}
                                    </div>
                                    <div class="col-md-6">
                                        <h6 class="text-success"><i class="fas fa-arrow-right"></i> Setelah Adjustment</h6>
                                        ${shiftAfterHTML}
                                    </div>
                                </div>
                                
                                ${log.shiftSnapshot?.before && log.shiftSnapshot?.after ? `
                                    <div class="alert alert-info mt-3">
                                        <strong><i class="fas fa-calculator"></i> Perubahan:</strong>
                                        <ul class="mb-0 mt-2">
                                            <li>Total Penjualan: Rp ${((log.shiftSnapshot.before.totalPenjualan || 0) - (log.shiftSnapshot.after.totalPenjualan || 0)).toLocaleString('id-ID')}</li>
                                            <li>Total Kas: Rp ${((log.shiftSnapshot.before.totalKas || 0) - (log.shiftSnapshot.after.totalKas || 0)).toLocaleString('id-ID')}</li>
                                            <li>Total Piutang: Rp ${((log.shiftSnapshot.before.totalPiutang || 0) - (log.shiftSnapshot.after.totalPiutang || 0)).toLocaleString('id-ID')}</li>
                                        </ul>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <!-- Journal Entries -->
                        <div class="card mb-3">
                            <div class="card-header bg-success text-white">
                                <h6 class="mb-0"><i class="fas fa-book"></i> Jurnal Pembalik</h6>
                            </div>
                            <div class="card-body">
                                ${journalEntriesHTML}
                            </div>
                        </div>
                        
                        <!-- Validation Results -->
                        <div class="card mb-3">
                            <div class="card-header bg-info text-white">
                                <h6 class="mb-0"><i class="fas fa-check-circle"></i> Hasil Validasi</h6>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <h6>Pre-Deletion Validation</h6>
                                        ${preValidationHTML}
                                    </div>
                                    <div class="col-md-6">
                                        <h6>Post-Deletion Validation</h6>
                                        ${postValidationHTML}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Warnings -->
                        ${log.warnings?.length > 0 ? `
                            <div class="card mb-3">
                                <div class="card-header bg-warning text-dark">
                                    <h6 class="mb-0"><i class="fas fa-exclamation-triangle"></i> Peringatan</h6>
                                </div>
                                <div class="card-body">
                                    ${warningsHTML}
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- System Information -->
                        <div class="card mb-3">
                            <div class="card-header bg-secondary text-white">
                                <h6 class="mb-0"><i class="fas fa-server"></i> Informasi Sistem</h6>
                            </div>
                            <div class="card-body">
                                <table class="table table-sm table-borderless">
                                    <tr>
                                        <td width="20%"><strong>Timestamp:</strong></td>
                                        <td>${log.systemInfo?.timestamp ? new Date(log.systemInfo.timestamp).toLocaleString('id-ID') : 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>User Agent:</strong></td>
                                        <td><small>${log.systemInfo?.userAgent || 'N/A'}</small></td>
                                    </tr>
                                    <tr>
                                        <td><strong>Platform:</strong></td>
                                        <td>${log.systemInfo?.platform || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Language:</strong></td>
                                        <td>${log.systemInfo?.language || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>IP Address:</strong></td>
                                        <td>${log.systemInfo?.ipAddress || 'N/A'}</td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" onclick="exportCriticalAuditToPDF('${log.auditId}')">
                            <i class="fas fa-file-pdf"></i> Export PDF
                        </button>
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">
                            <i class="fas fa-times"></i> Tutup
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Get modal element
    const modalElement = document.getElementById(modalId);
    
    // Show modal
    if (typeof $ !== 'undefined' && $.fn.modal) {
        $(modalElement).modal('show');
        
        // Clean up on hide
        $(modalElement).on('hidden.bs.modal', function() {
            modalElement.remove();
        });
    } else {
        modalElement.style.display = 'block';
        modalElement.classList.add('show');
        
        // Add backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        document.body.appendChild(backdrop);
        
        // Handle close button
        const closeButtons = modalElement.querySelectorAll('[data-dismiss="modal"]');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modalElement.style.display = 'none';
                modalElement.classList.remove('show');
                backdrop.remove();
                modalElement.remove();
            });
        });
    }
}

/**
 * Export critical audit log to PDF
 * @param {string} auditId - Audit ID to export
 */
function exportCriticalAuditToPDF(auditId) {
    if (!auditId) {
        console.error('Audit ID is required');
        alert('Audit ID tidak valid');
        return;
    }
    
    // Get audit log
    const auditLogger = new CriticalAuditLoggerService();
    const pdfData = auditLogger.exportToPDF(auditId);
    
    if (!pdfData) {
        alert('Audit log tidak ditemukan');
        return;
    }
    
    // Check if jsPDF is available
    if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
        // Fallback: Generate HTML report and print
        generateHTMLReport(pdfData);
        return;
    }
    
    try {
        // Use jsPDF to generate PDF
        const { jsPDF } = window.jspdf || jspdf;
        const doc = new jsPDF();
        
        let yPos = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        const maxWidth = pageWidth - (margin * 2);
        
        // Helper function to check if we need a new page
        const checkNewPage = (requiredSpace = 10) => {
            if (yPos + requiredSpace > pageHeight - margin) {
                doc.addPage();
                yPos = 20;
                return true;
            }
            return false;
        };
        
        // Helper function to add text with word wrap
        const addText = (text, fontSize = 10, isBold = false) => {
            doc.setFontSize(fontSize);
            doc.setFont(undefined, isBold ? 'bold' : 'normal');
            
            const lines = doc.splitTextToSize(text, maxWidth);
            lines.forEach(line => {
                checkNewPage();
                doc.text(line, margin, yPos);
                yPos += fontSize * 0.5;
            });
            yPos += 2;
        };
        
        // Title
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text(pdfData.title, pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;
        
        // Audit ID
        doc.setFontSize(12);
        doc.text(`Audit ID: ${pdfData.auditId}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;
        
        // Level Badge
        doc.setFillColor(220, 53, 69); // Red color for CRITICAL
        doc.rect(pageWidth / 2 - 15, yPos - 5, 30, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text(pdfData.level, pageWidth / 2, yPos, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        yPos += 15;
        
        // Deletion Information
        addText('INFORMASI PENGHAPUSAN', 12, true);
        addText(`Dihapus Oleh: ${pdfData.deletionInfo.deletedBy}`);
        addText(`Tanggal Penghapusan: ${new Date(pdfData.deletionInfo.deletedAt).toLocaleString('id-ID')}`);
        addText(`Password Verified: ${new Date(pdfData.deletionInfo.passwordVerifiedAt).toLocaleString('id-ID')}`);
        addText(`Kategori: ${pdfData.deletionInfo.category}`);
        addText(`Alasan: ${pdfData.deletionInfo.reason}`);
        yPos += 5;
        
        // Transaction Information
        checkNewPage(30);
        addText('INFORMASI TRANSAKSI', 12, true);
        addText(`No. Transaksi: ${pdfData.transactionInfo.number}`);
        addText(`Tanggal: ${new Date(pdfData.transactionInfo.date).toLocaleString('id-ID')}`);
        addText(`Kasir: ${pdfData.transactionInfo.cashier}`);
        addText(`Metode: ${pdfData.transactionInfo.method === 'cash' ? 'Tunai' : 'Kredit/Bon'}`);
        addText(`Total: Rp ${(pdfData.transactionInfo.total || 0).toLocaleString('id-ID')}`);
        yPos += 5;
        
        // Transaction Items
        if (pdfData.transactionInfo.items && pdfData.transactionInfo.items.length > 0) {
            checkNewPage(30);
            addText('Item Transaksi:', 11, true);
            pdfData.transactionInfo.items.forEach((item, index) => {
                checkNewPage();
                addText(`${index + 1}. ${item.nama} - Qty: ${item.qty} x Rp ${(item.harga || 0).toLocaleString('id-ID')} = Rp ${((item.harga || 0) * item.qty).toLocaleString('id-ID')}`);
            });
            yPos += 5;
        }
        
        // Shift Information
        if (pdfData.shiftInfo) {
            checkNewPage(40);
            addText('INFORMASI LAPORAN TUTUP KASIR', 12, true);
            addText('Sebelum Adjustment:');
            addText(`  Total Penjualan: Rp ${(pdfData.shiftInfo.beforeAdjustment.totalPenjualan || 0).toLocaleString('id-ID')}`);
            addText(`  Total Kas: Rp ${(pdfData.shiftInfo.beforeAdjustment.totalKas || 0).toLocaleString('id-ID')}`);
            addText(`  Total Piutang: Rp ${(pdfData.shiftInfo.beforeAdjustment.totalPiutang || 0).toLocaleString('id-ID')}`);
            yPos += 3;
            
            addText('Setelah Adjustment:');
            addText(`  Total Penjualan: Rp ${(pdfData.shiftInfo.afterAdjustment.totalPenjualan || 0).toLocaleString('id-ID')}`);
            addText(`  Total Kas: Rp ${(pdfData.shiftInfo.afterAdjustment.totalKas || 0).toLocaleString('id-ID')}`);
            addText(`  Total Piutang: Rp ${(pdfData.shiftInfo.afterAdjustment.totalPiutang || 0).toLocaleString('id-ID')}`);
            yPos += 5;
        }
        
        // Journal Entries
        if (pdfData.journalEntries && pdfData.journalEntries.length > 0) {
            checkNewPage(30);
            addText('JURNAL PEMBALIK', 12, true);
            pdfData.journalEntries.forEach((journal, index) => {
                checkNewPage(20);
                addText(`Jurnal ${index + 1}: ${journal.deskripsi}`, 11, true);
                if (journal.tag) {
                    addText(`Tag: ${journal.tag}`);
                }
                if (journal.entries) {
                    journal.entries.forEach(entry => {
                        checkNewPage();
                        addText(`  ${entry.akun} - Debit: Rp ${(entry.debit || 0).toLocaleString('id-ID')}, Kredit: Rp ${(entry.kredit || 0).toLocaleString('id-ID')}`);
                    });
                }
                yPos += 3;
            });
            yPos += 5;
        }
        
        // Validation Results
        checkNewPage(30);
        addText('HASIL VALIDASI', 12, true);
        addText(`Pre-Deletion: ${pdfData.validationResults.preDelete?.valid ? 'Valid' : 'Invalid'}`);
        if (pdfData.validationResults.preDelete?.errors?.length > 0) {
            pdfData.validationResults.preDelete.errors.forEach(err => {
                checkNewPage();
                addText(`  - ${err}`);
            });
        }
        yPos += 3;
        
        addText(`Post-Deletion: ${pdfData.validationResults.postDelete?.valid ? 'Valid' : 'Invalid'}`);
        if (pdfData.validationResults.postDelete?.errors?.length > 0) {
            pdfData.validationResults.postDelete.errors.forEach(err => {
                checkNewPage();
                addText(`  - ${err}`);
            });
        }
        yPos += 5;
        
        // System Information
        checkNewPage(30);
        addText('INFORMASI SISTEM', 12, true);
        addText(`Timestamp: ${new Date(pdfData.systemInfo.timestamp).toLocaleString('id-ID')}`);
        addText(`Platform: ${pdfData.systemInfo.platform || 'N/A'}`);
        addText(`Language: ${pdfData.systemInfo.language || 'N/A'}`);
        addText(`User Agent: ${pdfData.systemInfo.userAgent || 'N/A'}`, 8);
        yPos += 5;
        
        // Footer
        checkNewPage(20);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        addText(`Dokumen ini digenerate secara otomatis pada ${new Date(pdfData.generatedAt).toLocaleString('id-ID')}`);
        addText('Dokumen ini bersifat rahasia dan hanya untuk keperluan audit internal.');
        
        // Save PDF
        const filename = `Audit_${pdfData.auditId}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);
        
        // Show success message
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: 'Export Berhasil',
                text: `Audit log berhasil diexport ke ${filename}`,
                timer: 3000
            });
        } else {
            alert(`Audit log berhasil diexport ke ${filename}`);
        }
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        
        // Fallback to HTML report
        if (confirm('Gagal generate PDF. Apakah Anda ingin membuka laporan dalam format HTML untuk dicetak?')) {
            generateHTMLReport(pdfData);
        }
    }
}

/**
 * Generate HTML report as fallback when PDF library is not available
 * @param {Object} pdfData - Formatted data for report
 */
function generateHTMLReport(pdfData) {
    // Create a new window for the report
    const reportWindow = window.open('', '_blank');
    
    if (!reportWindow) {
        alert('Popup diblokir. Silakan izinkan popup untuk melihat laporan.');
        return;
    }
    
    // Format transaction items
    const itemsHTML = pdfData.transactionInfo.items?.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${item.nama}</td>
            <td class="text-center">${item.qty}</td>
            <td class="text-right">Rp ${(item.harga || 0).toLocaleString('id-ID')}</td>
            <td class="text-right">Rp ${((item.harga || 0) * item.qty).toLocaleString('id-ID')}</td>
        </tr>
    `).join('') || '<tr><td colspan="5" class="text-center">Tidak ada item</td></tr>';
    
    // Format journal entries
    const journalHTML = pdfData.journalEntries?.map((journal, index) => `
        <div class="journal-entry">
            <h4>Jurnal ${index + 1}: ${journal.deskripsi}</h4>
            ${journal.tag ? `<p><strong>Tag:</strong> <span class="badge">${journal.tag}</span></p>` : ''}
            <table>
                <thead>
                    <tr>
                        <th>Akun</th>
                        <th class="text-right">Debit</th>
                        <th class="text-right">Kredit</th>
                    </tr>
                </thead>
                <tbody>
                    ${journal.entries?.map(entry => `
                        <tr>
                            <td>${entry.akun}</td>
                            <td class="text-right">Rp ${(entry.debit || 0).toLocaleString('id-ID')}</td>
                            <td class="text-right">Rp ${(entry.kredit || 0).toLocaleString('id-ID')}</td>
                        </tr>
                    `).join('') || '<tr><td colspan="3" class="text-center">Tidak ada entry</td></tr>'}
                </tbody>
            </table>
        </div>
    `).join('') || '<p>Tidak ada jurnal</p>';
    
    const reportHTML = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${pdfData.title} - ${pdfData.auditId}</title>
            <style>
                @media print {
                    .no-print { display: none; }
                    body { margin: 0; }
                }
                
                body {
                    font-family: Arial, sans-serif;
                    margin: 20px;
                    font-size: 12px;
                    line-height: 1.6;
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 3px solid #dc3545;
                    padding-bottom: 20px;
                }
                
                .header h1 {
                    color: #dc3545;
                    margin: 0;
                    font-size: 24px;
                }
                
                .header .audit-id {
                    font-size: 16px;
                    color: #666;
                    margin: 10px 0;
                }
                
                .badge {
                    display: inline-block;
                    padding: 5px 15px;
                    background-color: #dc3545;
                    color: white;
                    border-radius: 3px;
                    font-weight: bold;
                }
                
                .section {
                    margin-bottom: 25px;
                    page-break-inside: avoid;
                }
                
                .section h2 {
                    background-color: #f8f9fa;
                    padding: 10px;
                    border-left: 4px solid #dc3545;
                    margin-bottom: 15px;
                    font-size: 16px;
                }
                
                .section h3 {
                    color: #495057;
                    font-size: 14px;
                    margin-top: 15px;
                    margin-bottom: 10px;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 15px;
                }
                
                table th, table td {
                    padding: 8px;
                    border: 1px solid #dee2e6;
                    text-align: left;
                }
                
                table th {
                    background-color: #e9ecef;
                    font-weight: bold;
                }
                
                .text-right {
                    text-align: right;
                }
                
                .text-center {
                    text-align: center;
                }
                
                .info-table td:first-child {
                    font-weight: bold;
                    width: 30%;
                    background-color: #f8f9fa;
                }
                
                .reason-box {
                    background-color: #fff3cd;
                    border: 1px solid #ffc107;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 10px 0;
                }
                
                .comparison {
                    display: flex;
                    gap: 20px;
                }
                
                .comparison > div {
                    flex: 1;
                }
                
                .before {
                    border-left: 4px solid #dc3545;
                    padding-left: 10px;
                }
                
                .after {
                    border-left: 4px solid #28a745;
                    padding-left: 10px;
                }
                
                .journal-entry {
                    background-color: #f8f9fa;
                    padding: 15px;
                    margin-bottom: 15px;
                    border-radius: 5px;
                }
                
                .journal-entry h4 {
                    margin-top: 0;
                    color: #495057;
                }
                
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 2px solid #dee2e6;
                    font-size: 10px;
                    color: #6c757d;
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
                }
                
                .print-button:hover {
                    background-color: #0056b3;
                }
            </style>
        </head>
        <body>
            <button class="print-button no-print" onclick="window.print()">
                🖨️ Cetak / Save as PDF
            </button>
            
            <div class="header">
                <h1>${pdfData.title}</h1>
                <div class="audit-id">Audit ID: <strong>${pdfData.auditId}</strong></div>
                <span class="badge">${pdfData.level}</span>
            </div>
            
            <div class="section">
                <h2>Informasi Penghapusan</h2>
                <table class="info-table">
                    <tr>
                        <td>Dihapus Oleh</td>
                        <td>${pdfData.deletionInfo.deletedBy}</td>
                    </tr>
                    <tr>
                        <td>Tanggal Penghapusan</td>
                        <td>${new Date(pdfData.deletionInfo.deletedAt).toLocaleString('id-ID')}</td>
                    </tr>
                    <tr>
                        <td>Password Verified</td>
                        <td>${new Date(pdfData.deletionInfo.passwordVerifiedAt).toLocaleString('id-ID')}</td>
                    </tr>
                    <tr>
                        <td>Kategori</td>
                        <td><span class="badge" style="background-color: #6c757d;">${pdfData.deletionInfo.category}</span></td>
                    </tr>
                </table>
                
                <h3>Alasan Penghapusan:</h3>
                <div class="reason-box">
                    ${pdfData.deletionInfo.reason}
                </div>
            </div>
            
            <div class="section">
                <h2>Informasi Transaksi</h2>
                <table class="info-table">
                    <tr>
                        <td>No. Transaksi</td>
                        <td>${pdfData.transactionInfo.number}</td>
                    </tr>
                    <tr>
                        <td>Tanggal</td>
                        <td>${new Date(pdfData.transactionInfo.date).toLocaleString('id-ID')}</td>
                    </tr>
                    <tr>
                        <td>Kasir</td>
                        <td>${pdfData.transactionInfo.cashier}</td>
                    </tr>
                    <tr>
                        <td>Metode Pembayaran</td>
                        <td>${pdfData.transactionInfo.method === 'cash' ? 'Tunai' : 'Kredit/Bon'}</td>
                    </tr>
                    <tr>
                        <td>Total</td>
                        <td><strong>Rp ${(pdfData.transactionInfo.total || 0).toLocaleString('id-ID')}</strong></td>
                    </tr>
                </table>
                
                <h3>Item Transaksi:</h3>
                <table>
                    <thead>
                        <tr>
                            <th width="5%">No</th>
                            <th>Nama Barang</th>
                            <th width="10%" class="text-center">Qty</th>
                            <th width="20%" class="text-right">Harga</th>
                            <th width="20%" class="text-right">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>
            </div>
            
            ${pdfData.shiftInfo ? `
                <div class="section">
                    <h2>Laporan Tutup Kasir</h2>
                    <div class="comparison">
                        <div class="before">
                            <h3>Sebelum Adjustment</h3>
                            <table class="info-table">
                                <tr>
                                    <td>Total Penjualan</td>
                                    <td class="text-right">Rp ${(pdfData.shiftInfo.beforeAdjustment.totalPenjualan || 0).toLocaleString('id-ID')}</td>
                                </tr>
                                <tr>
                                    <td>Total Kas</td>
                                    <td class="text-right">Rp ${(pdfData.shiftInfo.beforeAdjustment.totalKas || 0).toLocaleString('id-ID')}</td>
                                </tr>
                                <tr>
                                    <td>Total Piutang</td>
                                    <td class="text-right">Rp ${(pdfData.shiftInfo.beforeAdjustment.totalPiutang || 0).toLocaleString('id-ID')}</td>
                                </tr>
                            </table>
                        </div>
                        <div class="after">
                            <h3>Setelah Adjustment</h3>
                            <table class="info-table">
                                <tr>
                                    <td>Total Penjualan</td>
                                    <td class="text-right">Rp ${(pdfData.shiftInfo.afterAdjustment.totalPenjualan || 0).toLocaleString('id-ID')}</td>
                                </tr>
                                <tr>
                                    <td>Total Kas</td>
                                    <td class="text-right">Rp ${(pdfData.shiftInfo.afterAdjustment.totalKas || 0).toLocaleString('id-ID')}</td>
                                </tr>
                                <tr>
                                    <td>Total Piutang</td>
                                    <td class="text-right">Rp ${(pdfData.shiftInfo.afterAdjustment.totalPiutang || 0).toLocaleString('id-ID')}</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>
            ` : ''}
            
            <div class="section">
                <h2>Jurnal Pembalik</h2>
                ${journalHTML}
            </div>
            
            <div class="section">
                <h2>Hasil Validasi</h2>
                <h3>Pre-Deletion Validation</h3>
                <p><strong>Status:</strong> ${pdfData.validationResults.preDelete?.valid ? '✓ Valid' : '✗ Invalid'}</p>
                ${pdfData.validationResults.preDelete?.errors?.length > 0 ? `
                    <ul>
                        ${pdfData.validationResults.preDelete.errors.map(err => `<li>${err}</li>`).join('')}
                    </ul>
                ` : ''}
                
                <h3>Post-Deletion Validation</h3>
                <p><strong>Status:</strong> ${pdfData.validationResults.postDelete?.valid ? '✓ Valid' : '✗ Invalid'}</p>
                ${pdfData.validationResults.postDelete?.errors?.length > 0 ? `
                    <ul>
                        ${pdfData.validationResults.postDelete.errors.map(err => `<li>${err}</li>`).join('')}
                    </ul>
                ` : ''}
            </div>
            
            <div class="section">
                <h2>Informasi Sistem</h2>
                <table class="info-table">
                    <tr>
                        <td>Timestamp</td>
                        <td>${new Date(pdfData.systemInfo.timestamp).toLocaleString('id-ID')}</td>
                    </tr>
                    <tr>
                        <td>Platform</td>
                        <td>${pdfData.systemInfo.platform || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td>Language</td>
                        <td>${pdfData.systemInfo.language || 'N/A'}</td>
                    </tr>
                    <tr>
                        <td>User Agent</td>
                        <td style="word-break: break-all;">${pdfData.systemInfo.userAgent || 'N/A'}</td>
                    </tr>
                </table>
            </div>
            
            <div class="footer">
                <p>Dokumen ini digenerate secara otomatis pada ${new Date(pdfData.generatedAt).toLocaleString('id-ID')}</p>
                <p>Dokumen ini bersifat rahasia dan hanya untuk keperluan audit internal.</p>
                <p><strong>© ${new Date().getFullYear()} Koperasi Karyawan. All rights reserved.</strong></p>
            </div>
        </body>
        </html>
    `;
    
    reportWindow.document.write(reportHTML);
    reportWindow.document.close();
    
    // Auto print after a short delay
    setTimeout(() => {
        reportWindow.focus();
    }, 500);
}

// Export functions for browser environment
if (typeof window !== 'undefined') {
    window.renderCriticalHistory = renderCriticalHistory;
    window.showCriticalDeletionDetail = showCriticalDeletionDetail;
    window.exportCriticalAuditToPDF = exportCriticalAuditToPDF;
    window.generateHTMLReport = generateHTMLReport;
    window.resetCriticalHistoryFilters = resetCriticalHistoryFilters;
    window.filterCriticalHistoryTable = filterCriticalHistoryTable;
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ...module.exports,
        renderCriticalHistory,
        showCriticalDeletionDetail,
        exportCriticalAuditToPDF,
        generateHTMLReport
    };
}
