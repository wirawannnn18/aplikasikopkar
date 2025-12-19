/**
 * Payment System Integration - Integrates import tagihan with existing pembayaranHutangPiutang.js
 * Requirements: 5.2, 5.3, 7.2, 11.1, 11.2
 */

// Import AccountingIntegration - conditional import for different environments
let AccountingIntegration;
if (typeof require !== 'undefined') {
    // Node.js environment
    try {
        AccountingIntegration = require('./AccountingIntegration.js').AccountingIntegration;
    } catch (e) {
        // Fallback if require fails
        AccountingIntegration = null;
    }
} else if (typeof window !== 'undefined') {
    // Browser environment
    AccountingIntegration = window.AccountingIntegration;
}

/**
 * Integration layer between import tagihan system and existing payment system
 * Ensures compatibility and reuses existing validation and journal logic
 */
class PaymentSystemIntegration {
    constructor() {
        this.currentUser = null;
        this._initializeUserContext();
        
        // Initialize AccountingIntegration for consistent journal entries
        // Requirements: 11.2 - Integrate with accounting module
        if (AccountingIntegration) {
            this.accountingIntegration = new AccountingIntegration();
        } else {
            console.warn('AccountingIntegration not available, using fallback journal logic');
            this.accountingIntegration = null;
        }
    }

    /**
     * Initialize user context from localStorage
     * @private
     */
    _initializeUserContext() {
        if (typeof localStorage !== 'undefined') {
            try {
                const currentUser = localStorage.getItem('currentUser');
                if (currentUser) {
                    this.currentUser = JSON.parse(currentUser);
                }
            } catch (error) {
                console.warn('Failed to initialize user context:', error);
            }
        }
    }

    /**
     * Validate member for hutang/piutang transactions using existing logic
     * Requirements: 5.2, 11.1
     * @param {string} anggotaId - Member ID
     * @returns {Object} Validation result
     */
    validateAnggotaForHutangPiutang(anggotaId) {
        // Use existing validation function if available
        if (typeof validateAnggotaForHutangPiutang === 'function') {
            return validateAnggotaForHutangPiutang(anggotaId);
        }

        // Fallback validation logic
        try {
            const anggotaList = JSON.parse(localStorage.getItem('anggota') || '[]');
            const anggota = anggotaList.find(a => a.id === anggotaId);

            if (!anggota) {
                return {
                    valid: false,
                    error: 'Anggota tidak ditemukan dalam sistem'
                };
            }

            // Check if anggota is active and can transact
            if (anggota.status !== 'Aktif') {
                return {
                    valid: false,
                    error: 'Anggota tidak aktif dan tidak dapat melakukan transaksi'
                };
            }

            // Check if anggota is not in "Keluar" status
            if (anggota.statusKeanggotaan === 'Keluar') {
                return {
                    valid: false,
                    error: 'Anggota sudah keluar dan tidak dapat melakukan transaksi'
                };
            }

            return {
                valid: true,
                anggota: anggota
            };

        } catch (error) {
            console.error('Error validating anggota:', error);
            return {
                valid: false,
                error: 'Terjadi kesalahan saat validasi anggota'
            };
        }
    }

    /**
     * Calculate hutang balance using existing logic
     * Requirements: 5.2, 11.1
     * @param {string} anggotaId - Member ID
     * @returns {number} Current hutang balance
     */
    hitungSaldoHutang(anggotaId) {
        // Use existing function if available
        if (typeof hitungSaldoHutang === 'function') {
            return hitungSaldoHutang(anggotaId);
        }

        // Fallback calculation logic
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
     * Calculate piutang balance using existing logic
     * Requirements: 5.2, 11.1
     * @param {string} anggotaId - Member ID
     * @returns {number} Current piutang balance
     */
    hitungSaldoPiutang(anggotaId) {
        // Use existing function if available
        if (typeof hitungSaldoPiutang === 'function') {
            return hitungSaldoPiutang(anggotaId);
        }

        // Fallback calculation logic
        try {
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
     * Validate payment data using existing validation logic
     * Requirements: 5.2, 11.1
     * @param {Object} paymentData - Payment data to validate
     * @returns {Object} Validation result
     */
    validatePembayaran(paymentData) {
        // Use existing validation function if available
        if (typeof validatePembayaran === 'function') {
            return validatePembayaran(paymentData);
        }

        // Use enhanced validation if available
        if (typeof validatePembayaranEnhanced === 'function') {
            return validatePembayaranEnhanced(paymentData);
        }

        // Fallback validation logic
        try {
            // Check anggota selected
            if (!paymentData.anggotaId) {
                return { valid: false, message: 'Silakan pilih anggota terlebih dahulu' };
            }
            
            // Check jenis selected
            if (!paymentData.jenis) {
                return { valid: false, message: 'Silakan pilih jenis pembayaran' };
            }
            
            // Check jumlah
            if (!paymentData.jumlah || paymentData.jumlah <= 0) {
                return { valid: false, message: 'Jumlah pembayaran harus lebih dari 0' };
            }
            
            if (paymentData.jumlah < 0) {
                return { valid: false, message: 'Jumlah pembayaran tidak boleh negatif' };
            }
            
            // Check against saldo
            const saldo = paymentData.jenis === 'hutang' 
                ? this.hitungSaldoHutang(paymentData.anggotaId)
                : this.hitungSaldoPiutang(paymentData.anggotaId);
            
            if (saldo === 0) {
                const jenisText = paymentData.jenis === 'hutang' ? 'hutang' : 'piutang';
                return { valid: false, message: `Anggota tidak memiliki ${jenisText} yang perlu dibayar` };
            }
            
            if (paymentData.jumlah > saldo) {
                const jenisText = paymentData.jenis === 'hutang' ? 'hutang' : 'piutang';
                return { valid: false, message: `Jumlah pembayaran melebihi saldo ${jenisText} (${this.formatRupiah(saldo)})` };
            }
            
            return { valid: true, message: '' };

        } catch (error) {
            console.error('Error validating payment:', error);
            return { valid: false, message: 'Terjadi kesalahan saat validasi pembayaran' };
        }
    }

    /**
     * Save payment transaction using existing logic
     * Requirements: 5.2, 11.1
     * @param {Object} paymentData - Payment data
     * @returns {Object} Saved transaction
     */
    savePembayaran(paymentData) {
        // Use existing function if available
        if (typeof savePembayaran === 'function') {
            return savePembayaran(paymentData);
        }

        // Fallback save logic
        try {
            const timestamp = new Date().toISOString();
            
            const transaksi = {
                id: this.generateId(),
                tanggal: timestamp.split('T')[0],
                anggotaId: paymentData.anggotaId,
                anggotaNama: paymentData.anggotaNama,
                anggotaNIK: paymentData.anggotaNIK,
                jenis: paymentData.jenis,
                jumlah: paymentData.jumlah,
                saldoSebelum: paymentData.saldoSebelum,
                saldoSesudah: paymentData.saldoSesudah,
                keterangan: paymentData.keterangan || '',
                kasirId: this.currentUser?.id || '',
                kasirNama: this.currentUser?.nama || '',
                batchId: paymentData.batchId || '',
                jurnalId: '',
                status: 'selesai',
                createdAt: timestamp,
                updatedAt: timestamp
            };
            
            const pembayaranList = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
            pembayaranList.push(transaksi);
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaranList));
            
            return transaksi;

        } catch (error) {
            console.error('Error saving payment:', error);
            throw new Error('Gagal menyimpan transaksi pembayaran');
        }
    }

    /**
     * Create journal entry using integrated accounting system
     * Requirements: 5.3, 7.1, 11.2 - Integrate with accounting module
     * @param {Object} transaction - Transaction data
     */
    createJournalEntry(transaction) {
        try {
            // Use AccountingIntegration if available for consistent journal patterns
            // Requirements: 11.2 - Ensure journal entries follow existing patterns
            if (this.accountingIntegration) {
                const isBatch = Boolean(transaction.batchId);
                return this.accountingIntegration.createJournalEntry(transaction, isBatch);
            } else {
                // Fallback to existing logic
                if (transaction.jenis === 'hutang') {
                    this.createJurnalPembayaranHutang(transaction);
                } else {
                    this.createJurnalPembayaranPiutang(transaction);
                }
            }
        } catch (error) {
            console.error('Error creating journal entry:', error);
            throw new Error('Gagal mencatat jurnal akuntansi');
        }
    }

    /**
     * Create journal entry for hutang payment using existing logic
     * Requirements: 5.3, 7.1, 11.2 - Maintain chart of accounts consistency
     * @param {Object} transaksi - Transaction data
     */
    createJurnalPembayaranHutang(transaksi) {
        // Use existing function if available
        if (typeof createJurnalPembayaranHutang === 'function') {
            return createJurnalPembayaranHutang(transaksi);
        }

        // Fallback journal creation with consistent patterns
        const keterangan = `Pembayaran Hutang - ${transaksi.anggotaNama}${transaksi.batchId ? ' (Import Batch)' : ''}`;
        const entries = [
            { akun: '1-1000', debit: transaksi.jumlah, kredit: 0 },  // Kas bertambah
            { akun: '2-1000', debit: 0, kredit: transaksi.jumlah }   // Hutang berkurang
        ];
        
        this.addJurnal(keterangan, entries, transaksi.tanggal);
    }

    /**
     * Create journal entry for piutang payment using existing logic
     * Requirements: 5.3, 7.2, 11.2 - Preserve double-entry bookkeeping rules
     * @param {Object} transaksi - Transaction data
     */
    createJurnalPembayaranPiutang(transaksi) {
        // Use existing function if available
        if (typeof createJurnalPembayaranPiutang === 'function') {
            return createJurnalPembayaranPiutang(transaksi);
        }

        // Fallback journal creation with consistent patterns
        const keterangan = `Pembayaran Piutang - ${transaksi.anggotaNama}${transaksi.batchId ? ' (Import Batch)' : ''}`;
        const entries = [
            { akun: '1-1200', debit: transaksi.jumlah, kredit: 0 },  // Piutang berkurang
            { akun: '1-1000', debit: 0, kredit: transaksi.jumlah }   // Kas berkurang
        ];
        
        this.addJurnal(keterangan, entries, transaksi.tanggal);
    }

    /**
     * Add journal entry using existing accounting system
     * Requirements: 7.1, 11.2
     * @param {string} keterangan - Description
     * @param {Array} entries - Journal entries
     * @param {string} tanggal - Date
     */
    addJurnal(keterangan, entries, tanggal) {
        // Use existing addJurnal function if available
        if (typeof addJurnal === 'function') {
            return addJurnal(keterangan, entries, tanggal);
        }

        // Fallback journal creation
        try {
            const jurnalList = JSON.parse(localStorage.getItem('jurnal') || '[]');
            const jurnalEntry = {
                id: this.generateId(),
                tanggal: tanggal,
                keterangan: keterangan,
                entries: entries,
                createdAt: new Date().toISOString()
            };
            jurnalList.push(jurnalEntry);
            localStorage.setItem('jurnal', JSON.stringify(jurnalList));
        } catch (error) {
            console.error('Error adding journal entry:', error);
            throw new Error('Gagal menambahkan jurnal');
        }
    }

    /**
     * Save audit log using existing audit system
     * Requirements: 7.2, 11.1
     * @param {string} action - Action type
     * @param {Object} details - Transaction details
     */
    saveAuditLog(action, details) {
        // Use existing function if available
        if (typeof saveAuditLog === 'function') {
            return saveAuditLog(action, details);
        }

        // Fallback audit logging
        try {
            const auditLog = JSON.parse(localStorage.getItem('auditLog') || '[]');
            
            const logEntry = {
                id: this.generateId(),
                timestamp: new Date().toISOString(),
                userId: this.currentUser?.id || '',
                userName: this.currentUser?.nama || '',
                action: action,
                details: details,
                module: 'import-tagihan-pembayaran'
            };
            
            auditLog.push(logEntry);
            localStorage.setItem('auditLog', JSON.stringify(auditLog));
        } catch (error) {
            console.error('Error saving audit log:', error);
        }
    }

    /**
     * Rollback payment transaction using existing logic
     * Requirements: 8.4, 11.1
     * @param {string} transaksiId - Transaction ID to rollback
     */
    rollbackPembayaran(transaksiId) {
        // Use existing function if available
        if (typeof rollbackPembayaran === 'function') {
            return rollbackPembayaran(transaksiId);
        }

        // Fallback rollback logic
        try {
            const pembayaranList = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
            const filtered = pembayaranList.filter(p => p.id !== transaksiId);
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(filtered));
            console.log('Transaction rolled back:', transaksiId);
        } catch (error) {
            console.error('Error rolling back transaction:', error);
            throw new Error('Gagal melakukan rollback transaksi');
        }
    }

    /**
     * Process single payment using existing payment engine
     * Requirements: 5.2, 5.3, 11.1
     * @param {Object} paymentData - Payment data
     * @returns {Promise<Object>} Transaction result
     */
    async processSinglePayment(paymentData) {
        try {
            // Validate anggota
            const anggotaValidation = this.validateAnggotaForHutangPiutang(paymentData.anggotaId);
            if (!anggotaValidation.valid) {
                throw new Error(anggotaValidation.error);
            }

            // Calculate balances
            const saldoSebelum = paymentData.jenis === 'hutang' 
                ? this.hitungSaldoHutang(paymentData.anggotaId)
                : this.hitungSaldoPiutang(paymentData.anggotaId);

            const saldoSesudah = saldoSebelum - paymentData.jumlah;

            // Prepare transaction data
            const transactionData = {
                ...paymentData,
                saldoSebelum,
                saldoSesudah
            };

            // Validate payment
            const validation = this.validatePembayaran(transactionData);
            if (!validation.valid) {
                throw new Error(validation.message);
            }

            // Save transaction
            const transaction = this.savePembayaran(transactionData);

            // Create journal entry
            this.createJournalEntry(transaction);

            // Save audit log
            this.saveAuditLog('PEMBAYARAN_' + paymentData.jenis.toUpperCase(), transaction);

            return transaction;

        } catch (error) {
            console.error('Error processing single payment:', error);
            throw error;
        }
    }

    /**
     * Check user permissions using existing access control
     * Requirements: 11.1
     * @param {string} operation - Operation type
     * @returns {boolean} Permission granted
     */
    checkOperationPermission(operation) {
        // Use existing function if available
        if (typeof checkOperationPermission === 'function') {
            return checkOperationPermission(operation);
        }

        // Fallback permission check
        try {
            const currentUser = this.currentUser;
            
            if (!currentUser || !currentUser.role) {
                return false;
            }
            
            const role = currentUser.role.toLowerCase();
            
            // Define permissions for each role
            const permissions = {
                'super_admin': ['view', 'process', 'print', 'history', 'audit', 'import'],
                'administrator': ['view', 'process', 'print', 'history', 'audit', 'import'],
                'admin': ['view', 'process', 'print', 'history', 'import'],
                'kasir': ['view', 'process', 'print', 'import'],
                'keuangan': ['view', 'history'],
                'anggota': []
            };
            
            const userPermissions = permissions[role] || [];
            return userPermissions.includes(operation);
        } catch (error) {
            console.error('Error checking operation permission:', error);
            return false;
        }
    }

    /**
     * Validate user session using existing session management
     * Requirements: 11.1
     * @returns {Object} Session validation result
     */
    validateUserSession() {
        // Use existing function if available
        if (typeof validateUserSession === 'function') {
            return validateUserSession();
        }

        // Fallback session validation
        try {
            const currentUser = this.currentUser;
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            
            // Check if user exists
            if (!currentUser || !currentUser.id) {
                return {
                    valid: false,
                    error: 'Sesi tidak valid. Silakan login kembali.',
                    code: 'INVALID_SESSION'
                };
            }
            
            // Check if user still exists in system
            const userExists = users.find(u => u.id === currentUser.id);
            if (!userExists) {
                return {
                    valid: false,
                    error: 'Akun tidak ditemukan. Silakan login kembali.',
                    code: 'USER_NOT_FOUND'
                };
            }
            
            // Check if user is still active
            if (userExists.active === false) {
                return {
                    valid: false,
                    error: 'Akun telah dinonaktifkan. Hubungi administrator.',
                    code: 'USER_INACTIVE'
                };
            }
            
            return {
                valid: true,
                user: userExists
            };
        } catch (error) {
            console.error('Error validating user session:', error);
            return {
                valid: false,
                error: 'Terjadi kesalahan validasi sesi. Silakan login kembali.',
                code: 'VALIDATION_ERROR'
            };
        }
    }

    /**
     * Format currency using existing formatting
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency
     */
    formatRupiah(amount) {
        // Use existing function if available
        if (typeof formatRupiah === 'function') {
            return formatRupiah(amount);
        }

        // Fallback formatting
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    /**
     * Generate unique ID using existing ID generation
     * @returns {string} Unique ID
     */
    generateId() {
        // Use existing function if available
        if (typeof generateId === 'function') {
            return generateId();
        }

        // Fallback ID generation
        return `ID_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get integration status and available functions
     * @returns {Object} Integration status
     */
    getIntegrationStatus() {
        const accountingStatus = this.accountingIntegration ? 
            this.accountingIntegration.getIntegrationStatus() : 
            { available: false };

        return {
            paymentSystemAvailable: typeof hitungSaldoHutang === 'function' && typeof hitungSaldoPiutang === 'function',
            validationAvailable: typeof validatePembayaran === 'function' || typeof validatePembayaranEnhanced === 'function',
            journalSystemAvailable: typeof addJurnal === 'function',
            auditSystemAvailable: typeof saveAuditLog === 'function',
            accessControlAvailable: typeof checkOperationPermission === 'function',
            sessionManagementAvailable: typeof validateUserSession === 'function',
            rollbackAvailable: typeof rollbackPembayaran === 'function',
            accountingIntegrationAvailable: Boolean(this.accountingIntegration),
            accountingIntegrationStatus: accountingStatus,
            currentUser: this.currentUser
        };
    }

    /**
     * Rollback journal entry using accounting integration
     * Requirements: 8.4, 11.2
     * @param {string} transactionId - Transaction ID to rollback
     * @returns {boolean} Rollback success
     */
    rollbackJournalEntry(transactionId) {
        if (this.accountingIntegration) {
            return this.accountingIntegration.rollbackJournalEntry(transactionId);
        }

        // Fallback rollback logic
        try {
            const jurnalList = JSON.parse(localStorage.getItem('jurnal') || '[]');
            const filteredJurnal = jurnalList.filter(j => j.transactionId !== transactionId);
            
            if (filteredJurnal.length < jurnalList.length) {
                localStorage.setItem('jurnal', JSON.stringify(filteredJurnal));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error rolling back journal entry:', error);
            return false;
        }
    }

    /**
     * Rollback batch journal entries using accounting integration
     * Requirements: 8.4, 11.2
     * @param {string} batchId - Batch ID to rollback
     * @returns {Object} Rollback result
     */
    rollbackBatchJournalEntries(batchId) {
        if (this.accountingIntegration) {
            return this.accountingIntegration.rollbackBatchJournalEntries(batchId);
        }

        // Fallback rollback logic
        try {
            const jurnalList = JSON.parse(localStorage.getItem('jurnal') || '[]');
            const batchEntries = jurnalList.filter(j => j.batchId === batchId);
            const filteredJurnal = jurnalList.filter(j => j.batchId !== batchId);
            
            if (batchEntries.length > 0) {
                localStorage.setItem('jurnal', JSON.stringify(filteredJurnal));
                return {
                    success: true,
                    rolledBackCount: batchEntries.length
                };
            }

            return {
                success: true,
                rolledBackCount: 0
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                rolledBackCount: 0
            };
        }
    }
}

// Export for both browser and Node.js environments
if (typeof window !== 'undefined') {
    window.PaymentSystemIntegration = PaymentSystemIntegration;
}

// ES Module export
export { PaymentSystemIntegration };

// CommonJS export for compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PaymentSystemIntegration };
}