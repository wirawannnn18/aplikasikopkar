/**
 * Hapus Data Jurnal Module
 * 
 * This module provides functionality for deleting journal entries (jurnal umum, 
 * jurnal kas, jurnal pembelian) with proper data integrity management including:
 * - Balance reversal and adjustment
 * - Referential integrity validation
 * - Period status checking
 * - Comprehensive audit logging
 * - Double confirmation workflow
 * 
 * @module hapusDataJurnal
 * @author Tim Development Koperasi Karyawan
 * @version 1.0.0
 * 
 * @requires bootstrap - For modal dialogs and UI components
 * @requires localStorage - For data persistence
 * 
 * Architecture:
 * - Repository Layer: Data access and persistence
 * - Service Layer: Business logic and orchestration
 * - UI Layer: User interface components and interactions
 */

// ===== Repository Classes =====

/**
 * Repository for Journal operations
 * Handles CRUD operations for journal entries
 */
class JournalRepository {
    /**
     * Get all journals from localStorage
     * @returns {Array} Array of journal objects
     */
    getAll() {
        return JSON.parse(localStorage.getItem('jurnal') || '[]');
    }
    
    /**
     * Get journal by ID
     * @param {string} id - Journal ID
     * @returns {Object|null} Journal object or null if not found
     */
    getById(id) {
        const journals = this.getAll();
        return journals.find(j => j.id === id) || null;
    }
    
    /**
     * Get journals by type
     * @param {string} type - Journal type ('umum', 'kas', 'pembelian')
     * @returns {Array} Array of journals matching the type
     */
    getByType(type) {
        const journals = this.getAll();
        return journals.filter(j => j.tipe === type);
    }
    
    /**
     * Filter journals based on criteria
     * @param {Object} filters - Filter criteria
     * @param {string} filters.search - Search query for journal number or description
     * @param {string} filters.tipe - Journal type filter
     * @param {string} filters.startDate - Start date (ISO format)
     * @param {string} filters.endDate - End date (ISO format)
     * @param {string} filters.accountCode - Account code filter
     * @returns {Array} Filtered journals
     */
    filter(filters) {
        let journals = this.getAll();
        
        // Filter by search query
        if (filters.search) {
            const query = filters.search.toLowerCase();
            journals = journals.filter(j => 
                (j.nomorJurnal && j.nomorJurnal.toLowerCase().includes(query)) ||
                (j.keterangan && j.keterangan.toLowerCase().includes(query))
            );
        }
        
        // Filter by journal type
        if (filters.tipe && filters.tipe !== 'all') {
            journals = journals.filter(j => j.tipe === filters.tipe);
        }
        
        // Filter by date range
        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            startDate.setHours(0, 0, 0, 0);
            journals = journals.filter(j => 
                new Date(j.tanggal) >= startDate
            );
        }
        
        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999);
            journals = journals.filter(j => 
                new Date(j.tanggal) <= endDate
            );
        }
        
        // Filter by account code
        if (filters.accountCode) {
            journals = journals.filter(j => 
                j.entries && j.entries.some(e => e.akun === filters.accountCode)
            );
        }
        
        return journals;
    }
    
    /**
     * Delete journal from localStorage
     * @param {string} id - Journal ID
     * @returns {boolean} True if deleted successfully
     */
    delete(id) {
        let journals = this.getAll();
        const initialLength = journals.length;
        journals = journals.filter(j => j.id !== id);
        
        if (journals.length < initialLength) {
            localStorage.setItem('jurnal', JSON.stringify(journals));
            return true;
        }
        
        return false;
    }
    
    /**
     * Check if journal has references to other transactions
     * @param {string} id - Journal ID
     * @returns {boolean} True if journal has references
     */
    hasReferences(id) {
        const journal = this.getById(id);
        if (!journal) return false;
        
        // Check if journal has a reference to source transaction
        if (journal.referensi && journal.referensi.id) {
            return true;
        }
        
        return false;
    }
}

/**
 * Repository for Chart of Accounts (COA) operations
 * Handles account balance management
 */
class COARepository {
    /**
     * Get all accounts from localStorage
     * @returns {Array} Array of account objects
     */
    getAll() {
        return JSON.parse(localStorage.getItem('coa') || '[]');
    }
    
    /**
     * Get account by code
     * @param {string} code - Account code
     * @returns {Object|null} Account object or null if not found
     */
    getByCode(code) {
        const accounts = this.getAll();
        return accounts.find(a => a.kode === code) || null;
    }
    
    /**
     * Update account balance
     * @param {string} code - Account code
     * @param {number} amount - Amount to adjust (positive or negative)
     * @param {string} type - Adjustment type ('debit' or 'credit')
     * @returns {boolean} True if balance updated successfully
     */
    updateBalance(code, amount, type) {
        const accounts = this.getAll();
        const account = accounts.find(a => a.kode === code);
        
        if (!account) {
            return false;
        }
        
        // Adjust balance based on account type and adjustment type
        // Aset and Beban increase with debit, decrease with credit
        // Kewajiban, Modal, and Pendapatan increase with credit, decrease with debit
        const isDebitAccount = ['Aset', 'Beban'].includes(account.tipe);
        
        if (type === 'debit') {
            account.saldo = (account.saldo || 0) + (isDebitAccount ? amount : -amount);
        } else if (type === 'credit') {
            account.saldo = (account.saldo || 0) + (isDebitAccount ? -amount : amount);
        }
        
        localStorage.setItem('coa', JSON.stringify(accounts));
        return true;
    }
    
    /**
     * Get accounts affected by a journal entry
     * @param {string} journalId - Journal ID
     * @returns {Array} Array of affected account objects
     */
    getAffectedAccounts(journalId) {
        const journalRepo = new JournalRepository();
        const journal = journalRepo.getById(journalId);
        
        if (!journal || !journal.entries) {
            return [];
        }
        
        const accountCodes = [...new Set(journal.entries.map(e => e.akun))];
        const accounts = this.getAll();
        
        return accounts.filter(a => accountCodes.includes(a.kode));
    }
}

/**
 * Repository for Audit Log operations
 * Handles deletion logging and audit trail
 */
class AuditLogRepository {
    /**
     * Save audit log to localStorage
     * @param {Object} log - Audit log object
     * @returns {string} Audit log ID
     */
    save(log) {
        const logs = this.getAll();
        logs.push(log);
        localStorage.setItem('journalDeletionLog', JSON.stringify(logs));
        return log.id;
    }
    
    /**
     * Get all audit logs from localStorage
     * @returns {Array} Array of audit log objects
     */
    getAll() {
        return JSON.parse(localStorage.getItem('journalDeletionLog') || '[]');
    }
    
    /**
     * Get audit log by journal ID
     * @param {string} journalId - Journal ID
     * @returns {Object|null} Audit log object or null if not found
     */
    getByJournalId(journalId) {
        const logs = this.getAll();
        return logs.find(l => l.journalId === journalId) || null;
    }
    
    /**
     * Get audit logs within a date range
     * @param {Date} start - Start date
     * @param {Date} end - End date
     * @returns {Array} Array of audit logs within the date range
     */
    getByDateRange(start, end) {
        const logs = this.getAll();
        return logs.filter(l => {
            const logDate = new Date(l.deletedAt);
            return logDate >= start && logDate <= end;
        });
    }
}

/**
 * Repository for Accounting Period operations
 * Handles period status checks
 */
class PeriodRepository {
    /**
     * Get all accounting periods from localStorage
     * @returns {Array} Array of period objects
     */
    getAll() {
        return JSON.parse(localStorage.getItem('accountingPeriods') || '[]');
    }
    
    /**
     * Get current accounting period
     * @returns {Object|null} Current period object or null if not found
     */
    getCurrentPeriod() {
        const periods = this.getAll();
        const now = new Date();
        
        return periods.find(p => {
            const start = new Date(p.startDate);
            const end = new Date(p.endDate);
            return now >= start && now <= end;
        }) || null;
    }
    
    /**
     * Check if a period is closed for a given date
     * @param {Date} date - Date to check
     * @returns {boolean} True if period is closed
     */
    isPeriodClosed(date) {
        const period = this.getByDate(date);
        return period ? period.status === 'closed' : false;
    }
    
    /**
     * Get period by date
     * @param {Date} date - Date to find period for
     * @returns {Object|null} Period object or null if not found
     */
    getByDate(date) {
        const periods = this.getAll();
        const checkDate = new Date(date);
        
        return periods.find(p => {
            const start = new Date(p.startDate);
            const end = new Date(p.endDate);
            return checkDate >= start && checkDate <= end;
        }) || null;
    }
}

// ===== Service Classes =====

/**
 * Service for validation operations
 * Handles authorization, period status, reference checking, and reason validation
 */
class JournalValidationService {
    constructor() {
        this.journalRepo = new JournalRepository();
        this.periodRepo = new PeriodRepository();
    }
    
    /**
     * Validate if user is authorized to delete journals (super admin only)
     * @param {Object} user - User object with role property
     * @returns {Object} ValidationResult with valid flag and message
     */
    validateAuthorization(user) {
        if (!user) {
            return {
                valid: false,
                message: 'User tidak ditemukan',
                errors: ['User tidak ditemukan']
            };
        }
        
        // Check if user has administrator (super admin) role
        const isSuperAdmin = user.role === 'administrator';
        
        if (!isSuperAdmin) {
            return {
                valid: false,
                message: 'Hanya super admin yang dapat menghapus jurnal',
                errors: ['Akses ditolak: Hanya super admin yang dapat menghapus jurnal']
            };
        }
        
        return {
            valid: true,
            message: 'User terotorisasi',
            errors: []
        };
    }
    
    /**
     * Validate period status for a journal date
     * @param {string|Date} journalDate - Journal date to check
     * @returns {Object} ValidationResult with valid flag and message
     */
    validatePeriodStatus(journalDate) {
        if (!journalDate) {
            return {
                valid: false,
                message: 'Tanggal jurnal tidak valid',
                errors: ['Tanggal jurnal tidak valid']
            };
        }
        
        const date = new Date(journalDate);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return {
                valid: false,
                message: 'Format tanggal tidak valid',
                errors: ['Format tanggal tidak valid']
            };
        }
        
        // Check if period is closed
        const isClosed = this.periodRepo.isPeriodClosed(date);
        
        if (isClosed) {
            return {
                valid: false,
                message: 'Periode akuntansi sudah ditutup',
                errors: ['Periode akuntansi sudah ditutup. Jurnal tidak dapat dihapus.']
            };
        }
        
        return {
            valid: true,
            message: 'Periode akuntansi masih terbuka',
            errors: []
        };
    }
    
    /**
     * Check if journal has references to other transactions
     * @param {string} journalId - Journal ID to check
     * @returns {Object} ReferenceCheckResult with hasReferences flag and details
     */
    checkReferences(journalId) {
        if (!journalId) {
            return {
                hasReferences: false,
                valid: false,
                message: 'Journal ID tidak valid',
                errors: ['Journal ID tidak valid'],
                references: []
            };
        }
        
        const journal = this.journalRepo.getById(journalId);
        
        if (!journal) {
            return {
                hasReferences: false,
                valid: false,
                message: 'Jurnal tidak ditemukan',
                errors: ['Jurnal tidak ditemukan'],
                references: []
            };
        }
        
        // Check if journal has references
        const hasRef = this.journalRepo.hasReferences(journalId);
        
        if (hasRef) {
            const references = [];
            if (journal.referensi) {
                references.push({
                    type: journal.referensi.tipe,
                    id: journal.referensi.id
                });
            }
            
            return {
                hasReferences: true,
                valid: false,
                message: 'Jurnal memiliki referensi ke transaksi lain',
                errors: ['Jurnal memiliki referensi ke transaksi lain dan tidak dapat dihapus'],
                references: references
            };
        }
        
        return {
            hasReferences: false,
            valid: true,
            message: 'Jurnal tidak memiliki referensi',
            errors: [],
            references: []
        };
    }
    
    /**
     * Validate deletion reason
     * @param {string} reason - Deletion reason
     * @returns {Object} ValidationResult with valid flag and message
     */
    validateReason(reason) {
        // Check if reason is provided
        if (!reason || typeof reason !== 'string') {
            return {
                valid: false,
                message: 'Alasan penghapusan harus diisi',
                errors: ['Alasan penghapusan harus diisi']
            };
        }
        
        // Trim whitespace
        const trimmedReason = reason.trim();
        
        // Check if reason is empty after trimming
        if (trimmedReason.length === 0) {
            return {
                valid: false,
                message: 'Alasan penghapusan tidak boleh kosong',
                errors: ['Alasan penghapusan tidak boleh kosong']
            };
        }
        
        // Check maximum length (500 characters)
        if (trimmedReason.length > 500) {
            return {
                valid: false,
                message: 'Alasan penghapusan terlalu panjang (maksimal 500 karakter)',
                errors: [`Alasan penghapusan terlalu panjang (${trimmedReason.length}/500 karakter)`]
            };
        }
        
        return {
            valid: true,
            message: 'Alasan penghapusan valid',
            errors: []
        };
    }
    
    /**
     * Validate complete deletion request
     * @param {string} journalId - Journal ID
     * @param {string} reason - Deletion reason
     * @param {Object} user - User object
     * @returns {Object} Complete validation result
     */
    validateDeletion(journalId, reason, user) {
        const errors = [];
        
        // Validate authorization
        const authResult = this.validateAuthorization(user);
        if (!authResult.valid) {
            errors.push(...authResult.errors);
        }
        
        // Get journal to check period
        const journal = this.journalRepo.getById(journalId);
        if (!journal) {
            return {
                valid: false,
                message: 'Jurnal tidak ditemukan',
                errors: ['Jurnal tidak ditemukan']
            };
        }
        
        // Validate period status
        const periodResult = this.validatePeriodStatus(journal.tanggal);
        if (!periodResult.valid) {
            errors.push(...periodResult.errors);
        }
        
        // Check references
        const refResult = this.checkReferences(journalId);
        if (!refResult.valid && refResult.hasReferences) {
            errors.push(...refResult.errors);
        }
        
        // Validate reason
        const reasonResult = this.validateReason(reason);
        if (!reasonResult.valid) {
            errors.push(...reasonResult.errors);
        }
        
        // Return combined result
        if (errors.length > 0) {
            return {
                valid: false,
                message: errors[0],
                errors: errors
            };
        }
        
        return {
            valid: true,
            message: 'Validasi berhasil',
            errors: []
        };
    }
}

/**
 * Service for balance adjustment operations
 * Handles balance reversal and consistency validation when deleting journals
 */
class BalanceAdjustmentService {
    constructor() {
        this.coaRepo = new COARepository();
        this.journalRepo = new JournalRepository();
    }
    
    /**
     * Reverse journal entries and adjust account balances
     * @param {Object} journal - Journal object to reverse
     * @returns {Object} AdjustmentResult with success status and details
     */
    adjustBalances(journal) {
        if (!journal || !journal.entries || journal.entries.length === 0) {
            return {
                success: false,
                message: 'Jurnal tidak valid atau tidak memiliki entries',
                adjustments: [],
                errors: ['Jurnal tidak valid']
            };
        }
        
        const adjustments = [];
        const errors = [];
        
        try {
            // Reverse each journal entry
            for (const entry of journal.entries) {
                const account = this.coaRepo.getByCode(entry.akun);
                
                if (!account) {
                    errors.push(`Akun ${entry.akun} tidak ditemukan`);
                    continue;
                }
                
                // Calculate reversal amounts
                // When deleting, we reverse the original entry:
                // - If original was debit, we credit to reverse
                // - If original was credit, we debit to reverse
                let reversalAmount = 0;
                let reversalType = '';
                
                if (entry.debit > 0) {
                    reversalAmount = entry.debit;
                    reversalType = 'credit'; // Reverse debit with credit
                } else if (entry.kredit > 0) {
                    reversalAmount = entry.kredit;
                    reversalType = 'debit'; // Reverse credit with debit
                }
                
                if (reversalAmount === 0) {
                    continue; // Skip zero entries
                }
                
                // Store balance before adjustment
                const balanceBefore = account.saldo || 0;
                
                // Apply the reversal
                const updated = this.coaRepo.updateBalance(entry.akun, reversalAmount, reversalType);
                
                if (!updated) {
                    errors.push(`Gagal memperbarui saldo akun ${entry.akun}`);
                    continue;
                }
                
                // Get updated account to record balance after
                const updatedAccount = this.coaRepo.getByCode(entry.akun);
                const balanceAfter = updatedAccount ? updatedAccount.saldo : balanceBefore;
                
                // Record the adjustment
                adjustments.push({
                    accountCode: entry.akun,
                    accountName: account.nama,
                    accountType: account.tipe,
                    balanceBefore: balanceBefore,
                    balanceAfter: balanceAfter,
                    adjustmentAmount: reversalAmount,
                    adjustmentType: reversalType,
                    originalDebit: entry.debit,
                    originalKredit: entry.kredit
                });
            }
            
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
    
    /**
     * Generate reversal entries for a journal (for preview/audit purposes)
     * @param {Object} journal - Journal object
     * @returns {Array} Array of reversal entries
     */
    reverseJournalEntries(journal) {
        if (!journal || !journal.entries) {
            return [];
        }
        
        return journal.entries.map(entry => {
            // Swap debit and credit to create reversal
            return {
                akun: entry.akun,
                namaAkun: entry.namaAkun,
                debit: entry.kredit,  // Original credit becomes debit
                kredit: entry.debit   // Original debit becomes credit
            };
        });
    }
    
    /**
     * Validate balance consistency after adjustments
     * Checks that all accounts have valid balances and no negative balances for certain account types
     * @returns {Object} ConsistencyResult with valid flag and details
     */
    validateBalanceConsistency() {
        const accounts = this.coaRepo.getAll();
        const issues = [];
        const warnings = [];
        
        for (const account of accounts) {
            // Check for undefined or null balances
            if (account.saldo === undefined || account.saldo === null) {
                issues.push({
                    accountCode: account.kode,
                    accountName: account.nama,
                    issue: 'Saldo tidak terdefinisi',
                    severity: 'error'
                });
                continue;
            }
            
            // Check for NaN balances
            if (isNaN(account.saldo)) {
                issues.push({
                    accountCode: account.kode,
                    accountName: account.nama,
                    issue: 'Saldo tidak valid (NaN)',
                    severity: 'error'
                });
                continue;
            }
            
            // Check for negative balances in accounts that shouldn't have them
            // Aset accounts should generally not be negative
            if (account.tipe === 'Aset' && account.saldo < 0) {
                warnings.push({
                    accountCode: account.kode,
                    accountName: account.nama,
                    issue: `Saldo aset negatif: ${account.saldo}`,
                    severity: 'warning'
                });
            }
            
            // Cash accounts (typically 1-1000) should not be negative
            if (account.kode === '1-1000' && account.saldo < 0) {
                issues.push({
                    accountCode: account.kode,
                    accountName: account.nama,
                    issue: `Saldo kas negatif: ${account.saldo}`,
                    severity: 'error'
                });
            }
        }
        
        return {
            valid: issues.length === 0,
            message: issues.length === 0 
                ? 'Konsistensi saldo valid' 
                : `Ditemukan ${issues.length} masalah konsistensi`,
            issues: issues,
            warnings: warnings,
            totalAccounts: accounts.length,
            accountsWithIssues: issues.length,
            accountsWithWarnings: warnings.length
        };
    }
    
    /**
     * Check if a journal deletion would cause negative cash balance
     * @param {Object} journal - Journal to check
     * @returns {Object} Result with canDelete flag and details
     */
    checkNegativeBalancePrevention(journal) {
        if (!journal || !journal.entries) {
            return {
                canDelete: false,
                message: 'Jurnal tidak valid',
                affectedAccounts: []
            };
        }
        
        const affectedAccounts = [];
        let wouldCauseNegative = false;
        
        // Check each entry to see if reversal would cause negative balance
        for (const entry of journal.entries) {
            const account = this.coaRepo.getByCode(entry.akun);
            
            if (!account) {
                continue;
            }
            
            // Calculate what the balance would be after reversal
            const currentBalance = account.saldo || 0;
            let projectedBalance = currentBalance;
            
            // Determine reversal effect
            const isDebitAccount = ['Aset', 'Beban'].includes(account.tipe);
            
            if (entry.debit > 0) {
                // Reversing a debit entry (will credit)
                projectedBalance = isDebitAccount 
                    ? currentBalance - entry.debit 
                    : currentBalance + entry.debit;
            } else if (entry.kredit > 0) {
                // Reversing a credit entry (will debit)
                projectedBalance = isDebitAccount 
                    ? currentBalance + entry.kredit 
                    : currentBalance - entry.kredit;
            }
            
            // Check if this would cause a problematic negative balance
            const isCashAccount = account.kode === '1-1000';
            const isAssetAccount = account.tipe === 'Aset';
            
            if (projectedBalance < 0 && (isCashAccount || isAssetAccount)) {
                wouldCauseNegative = true;
                affectedAccounts.push({
                    accountCode: account.kode,
                    accountName: account.nama,
                    accountType: account.tipe,
                    currentBalance: currentBalance,
                    projectedBalance: projectedBalance,
                    difference: projectedBalance - currentBalance,
                    isCritical: isCashAccount
                });
            }
        }
        
        if (wouldCauseNegative) {
            const criticalAccounts = affectedAccounts.filter(a => a.isCritical);
            
            return {
                canDelete: false,
                message: criticalAccounts.length > 0
                    ? 'Penghapusan akan menyebabkan saldo kas negatif'
                    : 'Penghapusan akan menyebabkan saldo aset negatif',
                affectedAccounts: affectedAccounts,
                blockingReason: 'negative_balance'
            };
        }
        
        return {
            canDelete: true,
            message: 'Penghapusan tidak akan menyebabkan saldo negatif',
            affectedAccounts: [],
            blockingReason: null
        };
    }
    
    /**
     * Create a snapshot of current account balances for rollback purposes
     * @param {Array} accountCodes - Array of account codes to snapshot
     * @returns {Object} Snapshot object with account balances
     */
    createBalanceSnapshot(accountCodes) {
        const snapshot = {};
        
        for (const code of accountCodes) {
            const account = this.coaRepo.getByCode(code);
            if (account) {
                snapshot[code] = {
                    saldo: account.saldo,
                    nama: account.nama,
                    tipe: account.tipe
                };
            }
        }
        
        return {
            timestamp: new Date().toISOString(),
            accounts: snapshot
        };
    }
    
    /**
     * Restore account balances from a snapshot
     * @param {Object} snapshot - Snapshot object created by createBalanceSnapshot
     * @returns {Object} Result with success status
     */
    restoreBalanceSnapshot(snapshot) {
        if (!snapshot || !snapshot.accounts) {
            return {
                success: false,
                message: 'Snapshot tidak valid',
                restored: 0
            };
        }
        
        const accounts = this.coaRepo.getAll();
        let restored = 0;
        
        for (const [code, snapshotData] of Object.entries(snapshot.accounts)) {
            const account = accounts.find(a => a.kode === code);
            if (account) {
                account.saldo = snapshotData.saldo;
                restored++;
            }
        }
        
        // Save updated accounts back to localStorage
        localStorage.setItem('coa', JSON.stringify(accounts));
        
        return {
            success: true,
            message: `Berhasil mengembalikan ${restored} akun`,
            restored: restored
        };
    }
}
