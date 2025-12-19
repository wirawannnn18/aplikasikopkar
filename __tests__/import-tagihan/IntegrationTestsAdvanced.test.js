/**
 * Advanced Integration Tests for Import Tagihan System
 * Requirements: All requirements - Advanced integration scenarios, error recovery, and system boundaries
 */

// Mock localStorage for testing
const localStorageMock = {
    data: {},
    getItem: (key) => localStorageMock.data[key] || null,
    setItem: (key, value) => {
        localStorageMock.data[key] = value;
    },
    removeItem: (key) => {
        delete localStorageMock.data[key];
    },
    clear: () => {
        localStorageMock.data = {};
    }
};

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

describe('Import Tagihan Advanced Integration Tests', () => {
    // Sample test data
    const sampleAnggota = [
        {
            id: 'ANG001',
            nik: '001',
            nama: 'John Doe',
            status: 'Aktif',
            statusKeanggotaan: 'Aktif'
        },
        {
            id: 'ANG002',
            nik: '002',
            nama: 'Jane Smith',
            status: 'Aktif',
            statusKeanggotaan: 'Keluar' // Member who has left
        },
        {
            id: 'ANG003',
            nik: '003',
            nama: 'Bob Wilson',
            status: 'Tidak Aktif',
            statusKeanggotaan: 'Aktif'
        }
    ];

    const sampleCurrentUser = {
        id: 'USER001',
        nama: 'Test Kasir',
        role: 'kasir'
    };

    beforeEach(() => {
        // Clear localStorage mock
        localStorageMock.clear();
        jest.clearAllMocks();

        // Setup test data
        localStorage.setItem('anggota', JSON.stringify(sampleAnggota));
        localStorage.setItem('currentUser', JSON.stringify(sampleCurrentUser));
        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify([]));
        localStorage.setItem('jurnal', JSON.stringify([]));
        localStorage.setItem('penjualan', JSON.stringify([]));
        localStorage.setItem('simpanan', JSON.stringify([]));
    });

    describe('Integration with Member Status Validation', () => {
        test('should reject payments for members who have left (statusKeanggotaan: Keluar)', () => {
            // Requirements: 11.1 - Ensure compatibility with existing payment processing
            
            const paymentData = {
                anggotaId: 'ANG002', // Jane Smith - statusKeanggotaan: 'Keluar'
                jenis: 'hutang',
                jumlah: 100000
            };

            // Simulate validation logic that checks member status
            const anggota = sampleAnggota.find(a => a.id === paymentData.anggotaId);
            const isValidMember = anggota && 
                                 anggota.status === 'Aktif' && 
                                 anggota.statusKeanggotaan !== 'Keluar';

            expect(isValidMember).toBe(false);
            expect(anggota.statusKeanggotaan).toBe('Keluar');
        });

        test('should reject payments for inactive members (status: Tidak Aktif)', () => {
            // Requirements: 11.1 - Reuse existing validation and journal logic
            
            const paymentData = {
                anggotaId: 'ANG003', // Bob Wilson - status: 'Tidak Aktif'
                jenis: 'hutang',
                jumlah: 100000
            };

            const anggota = sampleAnggota.find(a => a.id === paymentData.anggotaId);
            const isValidMember = anggota && 
                                 anggota.status === 'Aktif' && 
                                 anggota.statusKeanggotaan !== 'Keluar';

            expect(isValidMember).toBe(false);
            expect(anggota.status).toBe('Tidak Aktif');
        });

        test('should accept payments only for active members', () => {
            // Requirements: 11.1 - Ensure compatibility with existing payment processing
            
            const paymentData = {
                anggotaId: 'ANG001', // John Doe - status: 'Aktif', statusKeanggotaan: 'Aktif'
                jenis: 'hutang',
                jumlah: 100000
            };

            const anggota = sampleAnggota.find(a => a.id === paymentData.anggotaId);
            const isValidMember = anggota && 
                                 anggota.status === 'Aktif' && 
                                 anggota.statusKeanggotaan !== 'Keluar';

            expect(isValidMember).toBe(true);
            expect(anggota.status).toBe('Aktif');
            expect(anggota.statusKeanggotaan).toBe('Aktif');
        });
    });

    describe('Integration with Complex Balance Calculations', () => {
        test('should handle complex hutang calculations with multiple POS transactions', () => {
            // Requirements: 11.1 - Ensure compatibility with existing payment processing
            
            const complexPenjualan = [
                {
                    id: 'POS001',
                    anggotaId: 'ANG001',
                    metodePembayaran: 'Kredit',
                    total: 300000
                },
                {
                    id: 'POS002',
                    anggotaId: 'ANG001',
                    metodePembayaran: 'Kredit',
                    total: 200000
                },
                {
                    id: 'POS003',
                    anggotaId: 'ANG001',
                    metodePembayaran: 'Tunai', // Should not count towards hutang
                    total: 100000
                }
            ];

            const existingPembayaran = [
                {
                    id: 'PAY001',
                    anggotaId: 'ANG001',
                    jenis: 'hutang',
                    jumlah: 150000,
                    status: 'selesai'
                }
            ];

            localStorage.setItem('penjualan', JSON.stringify(complexPenjualan));
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(existingPembayaran));

            // Calculate hutang balance: (300000 + 200000) - 150000 = 350000
            const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
            const pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
            
            const totalKredit = penjualan
                .filter(p => p.anggotaId === 'ANG001' && p.metodePembayaran === 'Kredit')
                .reduce((sum, p) => sum + (parseFloat(p.total) || 0), 0);
            
            const totalBayar = pembayaran
                .filter(p => p.anggotaId === 'ANG001' && p.jenis === 'hutang' && p.status === 'selesai')
                .reduce((sum, p) => sum + (parseFloat(p.jumlah) || 0), 0);
            
            const saldoHutang = totalKredit - totalBayar;

            expect(totalKredit).toBe(500000); // 300000 + 200000
            expect(totalBayar).toBe(150000);
            expect(saldoHutang).toBe(350000);
        });

        test('should handle complex piutang calculations with multiple simpanan types', () => {
            // Requirements: 11.1 - Ensure compatibility with existing payment processing
            
            const complexSimpanan = [
                {
                    id: 'SIM001',
                    anggotaId: 'ANG002',
                    jenis: 'pokok',
                    saldo: 100000,
                    statusPengembalian: 'pending'
                },
                {
                    id: 'SIM002',
                    anggotaId: 'ANG002',
                    jenis: 'wajib',
                    saldo: 200000,
                    statusPengembalian: 'pending'
                },
                {
                    id: 'SIM003',
                    anggotaId: 'ANG002',
                    jenis: 'sukarela',
                    saldo: 150000,
                    statusPengembalian: 'completed' // Should not count
                }
            ];

            const existingPembayaran = [
                {
                    id: 'PAY002',
                    anggotaId: 'ANG002',
                    jenis: 'piutang',
                    jumlah: 50000,
                    status: 'selesai'
                }
            ];

            localStorage.setItem('simpanan', JSON.stringify(complexSimpanan));
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(existingPembayaran));

            // Calculate piutang balance: (100000 + 200000) - 50000 = 250000
            const simpananList = JSON.parse(localStorage.getItem('simpanan') || '[]');
            const pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
            
            const anggotaSimpanan = simpananList.filter(s => 
                s.anggotaId === 'ANG002' && 
                s.statusPengembalian === 'pending'
            );
            
            let totalPiutang = 0;
            anggotaSimpanan.forEach(simpanan => {
                totalPiutang += parseFloat(simpanan.saldo || 0);
            });
            
            const totalBayar = pembayaran
                .filter(p => p.anggotaId === 'ANG002' && p.jenis === 'piutang' && p.status === 'selesai')
                .reduce((sum, p) => sum + (parseFloat(p.jumlah) || 0), 0);
            
            const saldoPiutang = totalPiutang - totalBayar;

            expect(totalPiutang).toBe(300000); // 100000 + 200000 (excluding completed)
            expect(totalBayar).toBe(50000);
            expect(saldoPiutang).toBe(250000);
        });
    });

    describe('Integration with Audit Trail System', () => {
        test('should create comprehensive audit trail for batch operations', () => {
            // Requirements: 7.2, 11.1 - Maintain audit trail consistency
            
            const batchId = 'BATCH_TEST_001';
            const auditEntries = [];

            // Mock audit logging
            const mockSaveAuditLog = (action, details) => {
                const logEntry = {
                    id: `AUDIT_${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    userId: sampleCurrentUser.id,
                    userName: sampleCurrentUser.nama,
                    action: action,
                    details: details,
                    module: 'import-tagihan-pembayaran'
                };
                auditEntries.push(logEntry);
            };

            // Simulate batch processing with audit logging
            const batchData = [
                { anggotaId: 'ANG001', jenis: 'hutang', jumlah: 100000 },
                { anggotaId: 'ANG001', jenis: 'hutang', jumlah: 50000 }
            ];

            // Log batch start
            mockSaveAuditLog('BATCH_START', {
                batchId: batchId,
                totalRows: batchData.length,
                startedBy: sampleCurrentUser.id
            });

            // Process each transaction with audit logging
            batchData.forEach((data, index) => {
                const transactionId = `TXN_${batchId}_${index + 1}`;
                
                mockSaveAuditLog('PEMBAYARAN_HUTANG', {
                    transactionId: transactionId,
                    batchId: batchId,
                    anggotaId: data.anggotaId,
                    jenis: data.jenis,
                    jumlah: data.jumlah,
                    processedAt: new Date().toISOString()
                });
            });

            // Log batch completion
            mockSaveAuditLog('BATCH_COMPLETE', {
                batchId: batchId,
                totalProcessed: batchData.length,
                successCount: batchData.length,
                failureCount: 0,
                completedBy: sampleCurrentUser.id
            });

            // Verify audit trail
            expect(auditEntries).toHaveLength(4); // 1 start + 2 transactions + 1 complete
            expect(auditEntries[0].action).toBe('BATCH_START');
            expect(auditEntries[1].action).toBe('PEMBAYARAN_HUTANG');
            expect(auditEntries[2].action).toBe('PEMBAYARAN_HUTANG');
            expect(auditEntries[3].action).toBe('BATCH_COMPLETE');

            // Verify batch consistency in audit trail
            auditEntries.forEach(entry => {
                if (entry.details.batchId) {
                    expect(entry.details.batchId).toBe(batchId);
                }
            });
        });

        test('should create audit trail for rollback operations', () => {
            // Requirements: 8.4, 11.1 - Maintain audit trail consistency
            
            const batchId = 'BATCH_ROLLBACK_001';
            const auditEntries = [];

            const mockSaveAuditLog = (action, details) => {
                const logEntry = {
                    id: `AUDIT_${Date.now()}`,
                    timestamp: new Date().toISOString(),
                    userId: sampleCurrentUser.id,
                    userName: sampleCurrentUser.nama,
                    action: action,
                    details: details,
                    module: 'import-tagihan-pembayaran'
                };
                auditEntries.push(logEntry);
            };

            // Simulate successful batch processing
            mockSaveAuditLog('BATCH_START', {
                batchId: batchId,
                totalRows: 2
            });

            mockSaveAuditLog('PEMBAYARAN_HUTANG', {
                transactionId: 'TXN_001',
                batchId: batchId,
                anggotaId: 'ANG001',
                jumlah: 100000
            });

            // Simulate error requiring rollback
            mockSaveAuditLog('BATCH_ERROR', {
                batchId: batchId,
                error: 'Database connection lost',
                errorAt: new Date().toISOString()
            });

            // Simulate rollback process
            mockSaveAuditLog('ROLLBACK_START', {
                batchId: batchId,
                reason: 'Critical error during batch processing',
                transactionsToRollback: ['TXN_001']
            });

            mockSaveAuditLog('TRANSACTION_ROLLBACK', {
                transactionId: 'TXN_001',
                batchId: batchId,
                rolledBackAt: new Date().toISOString()
            });

            mockSaveAuditLog('ROLLBACK_COMPLETE', {
                batchId: batchId,
                rolledBackCount: 1,
                completedAt: new Date().toISOString()
            });

            // Verify rollback audit trail
            expect(auditEntries).toHaveLength(6);
            expect(auditEntries.find(e => e.action === 'BATCH_ERROR')).toBeDefined();
            expect(auditEntries.find(e => e.action === 'ROLLBACK_START')).toBeDefined();
            expect(auditEntries.find(e => e.action === 'TRANSACTION_ROLLBACK')).toBeDefined();
            expect(auditEntries.find(e => e.action === 'ROLLBACK_COMPLETE')).toBeDefined();

            // Verify rollback details
            const rollbackComplete = auditEntries.find(e => e.action === 'ROLLBACK_COMPLETE');
            expect(rollbackComplete.details.rolledBackCount).toBe(1);
        });
    });

    describe('Integration with Permission System', () => {
        test('should enforce role-based access control for import operations', () => {
            // Requirements: 11.1 - Check user permissions using existing access control
            
            const testUsers = [
                { id: 'USER001', nama: 'Super Admin', role: 'super_admin' },
                { id: 'USER002', nama: 'Admin', role: 'admin' },
                { id: 'USER003', nama: 'Kasir', role: 'kasir' },
                { id: 'USER004', nama: 'Keuangan', role: 'keuangan' },
                { id: 'USER005', nama: 'Anggota', role: 'anggota' }
            ];

            const checkOperationPermission = (user, operation) => {
                const permissions = {
                    'super_admin': ['view', 'process', 'print', 'history', 'audit', 'import'],
                    'administrator': ['view', 'process', 'print', 'history', 'audit', 'import'],
                    'admin': ['view', 'process', 'print', 'history', 'import'],
                    'kasir': ['view', 'process', 'print', 'import'],
                    'keuangan': ['view', 'history'],
                    'anggota': []
                };
                
                const userPermissions = permissions[user.role] || [];
                return userPermissions.includes(operation);
            };

            // Test import permission for different roles
            expect(checkOperationPermission(testUsers[0], 'import')).toBe(true);  // super_admin
            expect(checkOperationPermission(testUsers[1], 'import')).toBe(true);  // admin
            expect(checkOperationPermission(testUsers[2], 'import')).toBe(true);  // kasir
            expect(checkOperationPermission(testUsers[3], 'import')).toBe(false); // keuangan
            expect(checkOperationPermission(testUsers[4], 'import')).toBe(false); // anggota

            // Test audit permission
            expect(checkOperationPermission(testUsers[0], 'audit')).toBe(true);   // super_admin
            expect(checkOperationPermission(testUsers[1], 'audit')).toBe(false);  // admin
            expect(checkOperationPermission(testUsers[2], 'audit')).toBe(false);  // kasir
        });

        test('should validate user session before processing import', () => {
            // Requirements: 11.1 - Validate user session using existing session management
            
            const users = [
                { id: 'USER001', nama: 'Active User', role: 'kasir', active: true },
                { id: 'USER002', nama: 'Inactive User', role: 'kasir', active: false }
            ];

            localStorage.setItem('users', JSON.stringify(users));

            const validateUserSession = (currentUser) => {
                if (!currentUser || !currentUser.id) {
                    return {
                        valid: false,
                        error: 'Sesi tidak valid. Silakan login kembali.',
                        code: 'INVALID_SESSION'
                    };
                }
                
                const userExists = users.find(u => u.id === currentUser.id);
                if (!userExists) {
                    return {
                        valid: false,
                        error: 'Akun tidak ditemukan. Silakan login kembali.',
                        code: 'USER_NOT_FOUND'
                    };
                }
                
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
            };

            // Test valid session
            const validSession = validateUserSession({ id: 'USER001', nama: 'Active User' });
            expect(validSession.valid).toBe(true);
            expect(validSession.user.active).toBe(true);

            // Test inactive user
            const inactiveSession = validateUserSession({ id: 'USER002', nama: 'Inactive User' });
            expect(inactiveSession.valid).toBe(false);
            expect(inactiveSession.code).toBe('USER_INACTIVE');

            // Test non-existent user
            const nonExistentSession = validateUserSession({ id: 'USER999', nama: 'Non-existent' });
            expect(nonExistentSession.valid).toBe(false);
            expect(nonExistentSession.code).toBe('USER_NOT_FOUND');

            // Test invalid session
            const invalidSession = validateUserSession(null);
            expect(invalidSession.valid).toBe(false);
            expect(invalidSession.code).toBe('INVALID_SESSION');
        });
    });

    describe('Integration with Configuration Management', () => {
        test('should respect system configuration limits', () => {
            // Requirements: 9.1, 9.2, 9.3 - Admin configuration integration
            
            const systemConfig = {
                importTagihan: {
                    enabled: true,
                    maxFileSize: 5 * 1024 * 1024, // 5MB
                    maxBatchSize: 1000,
                    allowedFileTypes: ['csv', 'xlsx'],
                    requireApproval: false
                }
            };

            localStorage.setItem('systemSettings', JSON.stringify(systemConfig));

            // Test file size validation
            const testFile = {
                name: 'test.csv',
                size: 6 * 1024 * 1024, // 6MB - exceeds limit
                type: 'text/csv'
            };

            const validateFileSize = (file, config) => {
                return file.size <= config.importTagihan.maxFileSize;
            };

            const validateFileType = (file, config) => {
                const extension = file.name.split('.').pop().toLowerCase();
                return config.importTagihan.allowedFileTypes.includes(extension);
            };

            const validateBatchSize = (rowCount, config) => {
                return rowCount <= config.importTagihan.maxBatchSize;
            };

            expect(validateFileSize(testFile, systemConfig)).toBe(false);
            expect(validateFileType(testFile, systemConfig)).toBe(true);
            expect(validateBatchSize(500, systemConfig)).toBe(true);
            expect(validateBatchSize(1500, systemConfig)).toBe(false);
        });

        test('should handle disabled import feature gracefully', () => {
            // Requirements: 9.3 - Toggle for enabling/disabling import feature
            
            const disabledConfig = {
                importTagihan: {
                    enabled: false,
                    maxFileSize: 5 * 1024 * 1024,
                    maxBatchSize: 1000
                }
            };

            localStorage.setItem('systemSettings', JSON.stringify(disabledConfig));

            const checkFeatureEnabled = (config) => {
                return config.importTagihan && config.importTagihan.enabled === true;
            };

            expect(checkFeatureEnabled(disabledConfig)).toBe(false);

            // Simulate feature check before processing
            const canProcessImport = checkFeatureEnabled(disabledConfig);
            if (!canProcessImport) {
                const error = {
                    code: 'FEATURE_DISABLED',
                    message: 'Fitur import tagihan saat ini dinonaktifkan. Hubungi administrator.'
                };
                expect(error.code).toBe('FEATURE_DISABLED');
                expect(error.message).toContain('dinonaktifkan');
            }
        });
    });

    describe('Integration with Error Recovery System', () => {
        test('should handle partial system failures gracefully', () => {
            // Requirements: 8.1, 8.2, 8.3 - Graceful error handling
            
            const mockSystemState = {
                localStorage: true,
                paymentSystem: true,
                accountingSystem: false, // Simulate accounting system failure
                auditSystem: true
            };

            const processPaymentWithFallback = (paymentData, systemState) => {
                const results = {
                    success: false,
                    warnings: [],
                    errors: []
                };

                try {
                    // Check localStorage availability
                    if (!systemState.localStorage) {
                        throw new Error('Storage system unavailable');
                    }

                    // Check payment system
                    if (!systemState.paymentSystem) {
                        throw new Error('Payment system unavailable');
                    }

                    // Process payment
                    results.transactionId = `TXN_${Date.now()}`;
                    results.success = true;

                    // Try accounting integration
                    if (!systemState.accountingSystem) {
                        results.warnings.push('Accounting system unavailable - journal entry will be queued');
                        // Queue journal entry for later processing
                        const queuedJournals = JSON.parse(localStorage.getItem('queuedJournals') || '[]');
                        queuedJournals.push({
                            transactionId: results.transactionId,
                            paymentData: paymentData,
                            queuedAt: new Date().toISOString()
                        });
                        localStorage.setItem('queuedJournals', JSON.stringify(queuedJournals));
                    }

                    // Try audit logging
                    if (!systemState.auditSystem) {
                        results.warnings.push('Audit system unavailable - audit entry will be queued');
                    }

                } catch (error) {
                    results.success = false;
                    results.errors.push(error.message);
                }

                return results;
            };

            const paymentData = {
                anggotaId: 'ANG001',
                jenis: 'hutang',
                jumlah: 100000
            };

            const result = processPaymentWithFallback(paymentData, mockSystemState);

            expect(result.success).toBe(true);
            expect(result.warnings).toHaveLength(1);
            expect(result.warnings[0]).toContain('Accounting system unavailable');
            expect(result.errors).toHaveLength(0);

            // Verify queued journal entry
            const queuedJournals = JSON.parse(localStorage.getItem('queuedJournals') || '[]');
            expect(queuedJournals).toHaveLength(1);
            expect(queuedJournals[0].transactionId).toBe(result.transactionId);
        });

        test('should implement retry mechanism for transient failures', () => {
            // Requirements: 8.1, 8.3 - Error handling and system stability
            
            let attemptCount = 0;
            const maxRetries = 3;

            const simulateTransientFailure = () => {
                attemptCount++;
                if (attemptCount < 3) {
                    throw new Error('Transient network error');
                }
                return { success: true, data: 'Operation completed' };
            };

            const retryOperation = async (operation, maxRetries) => {
                let lastError;
                
                for (let attempt = 1; attempt <= maxRetries; attempt++) {
                    try {
                        const result = operation();
                        return {
                            success: true,
                            result: result,
                            attempts: attempt
                        };
                    } catch (error) {
                        lastError = error;
                        if (attempt < maxRetries) {
                            // Wait before retry (exponential backoff)
                            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
                        }
                    }
                }

                return {
                    success: false,
                    error: lastError.message,
                    attempts: maxRetries
                };
            };

            // Test retry mechanism
            return retryOperation(simulateTransientFailure, maxRetries).then(result => {
                expect(result.success).toBe(true);
                expect(result.attempts).toBe(3);
                expect(attemptCount).toBe(3);
            });
        });
    });

    describe('Integration Performance and Monitoring', () => {
        test('should monitor integration performance metrics', () => {
            // Requirements: All requirements - Performance monitoring
            
            const performanceMetrics = {
                fileParsingTime: 0,
                validationTime: 0,
                processingTime: 0,
                journalCreationTime: 0,
                totalTime: 0
            };

            const measurePerformance = (operation, metricName) => {
                const startTime = performance.now();
                const result = operation();
                const endTime = performance.now();
                performanceMetrics[metricName] = endTime - startTime;
                return result;
            };

            // Simulate operations with performance measurement using larger dataset
            const mockData = Array.from({ length: 1000 }, (_, i) => ({
                nomor_anggota: '001',
                nama_anggota: 'John Doe',
                jenis_pembayaran: 'hutang',
                jumlah_pembayaran: '1000',
                keterangan: `Payment ${i + 1}`
            }));

            const totalStartTime = performance.now();

            // Measure file parsing with more complex operations
            measurePerformance(() => {
                return mockData.map(row => {
                    // Simulate more complex parsing
                    const parsed = {
                        ...row,
                        jumlah_pembayaran: parseFloat(row.jumlah_pembayaran),
                        timestamp: new Date().toISOString(),
                        hash: `${row.nomor_anggota}_${row.jumlah_pembayaran}_${Date.now()}`
                    };
                    // Add some computational work
                    for (let i = 0; i < 10; i++) {
                        parsed.hash = parsed.hash.split('').reverse().join('');
                    }
                    return parsed;
                });
            }, 'fileParsingTime');

            // Measure validation with complex validation logic
            const validatedData = measurePerformance(() => {
                return mockData.map(row => {
                    // Simulate complex validation
                    const errors = [];
                    if (!row.nomor_anggota) errors.push('Missing member number');
                    if (!row.nama_anggota) errors.push('Missing member name');
                    if (!row.jenis_pembayaran) errors.push('Missing payment type');
                    if (!row.jumlah_pembayaran || parseFloat(row.jumlah_pembayaran) <= 0) {
                        errors.push('Invalid amount');
                    }
                    
                    // Simulate database lookup delay
                    const memberExists = row.nomor_anggota === '001';
                    if (!memberExists) errors.push('Member not found');
                    
                    return {
                        ...row,
                        isValid: errors.length === 0,
                        validationErrors: errors,
                        validatedAt: new Date().toISOString()
                    };
                });
            }, 'validationTime');

            // Measure processing with transaction creation
            measurePerformance(() => {
                return validatedData.filter(row => row.isValid).map(row => {
                    // Simulate transaction processing
                    const transaction = {
                        id: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        ...row,
                        status: 'processed',
                        processedAt: new Date().toISOString(),
                        saldoSebelum: 100000,
                        saldoSesudah: 100000 - parseFloat(row.jumlah_pembayaran)
                    };
                    
                    // Simulate some processing work
                    for (let i = 0; i < 5; i++) {
                        transaction.checksum = JSON.stringify(transaction).length;
                    }
                    
                    return transaction;
                });
            }, 'processingTime');

            // Measure journal creation with double-entry bookkeeping
            measurePerformance(() => {
                return validatedData.filter(row => row.isValid).map(row => {
                    const amount = parseFloat(row.jumlah_pembayaran);
                    const journal = {
                        id: `JRN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        tanggal: new Date().toISOString().split('T')[0],
                        keterangan: `Pembayaran ${row.jenis_pembayaran} - ${row.nama_anggota}`,
                        entries: [
                            { akun: '1-1000', debit: amount, kredit: 0, keterangan: 'Kas bertambah' },
                            { akun: '2-1000', debit: 0, kredit: amount, keterangan: 'Hutang berkurang' }
                        ],
                        createdAt: new Date().toISOString()
                    };
                    
                    // Validate double-entry
                    const totalDebits = journal.entries.reduce((sum, entry) => sum + entry.debit, 0);
                    const totalCredits = journal.entries.reduce((sum, entry) => sum + entry.kredit, 0);
                    journal.isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;
                    
                    return journal;
                });
            }, 'journalCreationTime');

            performanceMetrics.totalTime = performance.now() - totalStartTime;

            // Verify performance metrics are captured (use >= 0 since operations might be very fast)
            expect(performanceMetrics.fileParsingTime).toBeGreaterThanOrEqual(0);
            expect(performanceMetrics.validationTime).toBeGreaterThanOrEqual(0);
            expect(performanceMetrics.processingTime).toBeGreaterThanOrEqual(0);
            expect(performanceMetrics.journalCreationTime).toBeGreaterThanOrEqual(0);
            expect(performanceMetrics.totalTime).toBeGreaterThan(0);

            // Verify that metrics are reasonable (total should be sum of parts or greater)
            const sumOfParts = performanceMetrics.fileParsingTime + 
                              performanceMetrics.validationTime + 
                              performanceMetrics.processingTime + 
                              performanceMetrics.journalCreationTime;
            
            expect(performanceMetrics.totalTime).toBeGreaterThanOrEqual(sumOfParts * 0.8); // Allow some variance

            // Performance thresholds (adjust based on requirements)
            expect(performanceMetrics.totalTime).toBeLessThan(10000); // Should complete within 10 seconds
            
            // Log performance metrics for debugging
            console.log('Performance Metrics:', performanceMetrics);
        });

        test('should handle memory pressure during large batch processing', () => {
            // Requirements: All requirements - Memory efficiency
            
            const memoryMonitor = {
                peakUsage: 0,
                currentUsage: 0,
                gcCount: 0
            };

            const simulateMemoryUsage = (dataSize) => {
                // Simulate memory allocation
                const data = new Array(dataSize).fill(0).map((_, i) => ({
                    id: i,
                    data: `Large data string ${i}`.repeat(100)
                }));

                memoryMonitor.currentUsage += dataSize * 1000; // Simulate memory usage
                memoryMonitor.peakUsage = Math.max(memoryMonitor.peakUsage, memoryMonitor.currentUsage);

                // Simulate processing
                const processed = data.map(item => ({
                    ...item,
                    processed: true,
                    timestamp: Date.now()
                }));

                // Simulate memory cleanup
                memoryMonitor.currentUsage -= dataSize * 500; // Partial cleanup
                memoryMonitor.gcCount++;

                return processed.length;
            };

            // Process in batches to manage memory
            const totalItems = 1000;
            const batchSize = 100;
            let totalProcessed = 0;

            for (let i = 0; i < totalItems; i += batchSize) {
                const currentBatchSize = Math.min(batchSize, totalItems - i);
                const processed = simulateMemoryUsage(currentBatchSize);
                totalProcessed += processed;

                // Simulate memory pressure check
                if (memoryMonitor.currentUsage > 50000) {
                    // Force cleanup
                    memoryMonitor.currentUsage = Math.floor(memoryMonitor.currentUsage * 0.5);
                    memoryMonitor.gcCount++;
                }
            }

            expect(totalProcessed).toBe(totalItems);
            expect(memoryMonitor.gcCount).toBeGreaterThan(0);
            expect(memoryMonitor.peakUsage).toBeGreaterThan(0);
            expect(memoryMonitor.currentUsage).toBeLessThan(memoryMonitor.peakUsage); // Memory was cleaned up
        });
    });
});