/**
 * Property-Based Tests for Hapus Data Jurnal
 * Feature: hapus-data-jurnal
 */

import fc from 'fast-check';

// Mock Repository classes for testing
class JournalRepository {
    getAll() {
        return JSON.parse(localStorage.getItem('jurnal') || '[]');
    }
    
    getById(id) {
        const journals = this.getAll();
        return journals.find(j => j.id === id) || null;
    }
    
    getByType(type) {
        const journals = this.getAll();
        return journals.filter(j => j.tipe === type);
    }
    
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
    
    hasReferences(id) {
        const journal = this.getById(id);
        if (!journal) return false;
        
        if (journal.referensi && journal.referensi.id) {
            return true;
        }
        
        return false;
    }
}

class COARepository {
    getAll() {
        return JSON.parse(localStorage.getItem('coa') || '[]');
    }
    
    getByCode(code) {
        const accounts = this.getAll();
        return accounts.find(a => a.kode === code) || null;
    }
    
    updateBalance(code, amount, type) {
        const accounts = this.getAll();
        const account = accounts.find(a => a.kode === code);
        
        if (!account) {
            return false;
        }
        
        const isDebitAccount = ['Aset', 'Beban'].includes(account.tipe);
        
        if (type === 'debit') {
            account.saldo = (account.saldo || 0) + (isDebitAccount ? amount : -amount);
        } else if (type === 'credit') {
            account.saldo = (account.saldo || 0) + (isDebitAccount ? -amount : amount);
        }
        
        localStorage.setItem('coa', JSON.stringify(accounts));
        return true;
    }
    
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

class AuditLogRepository {
    save(log) {
        const logs = this.getAll();
        logs.push(log);
        localStorage.setItem('journalDeletionLog', JSON.stringify(logs));
        return log.id;
    }
    
    getAll() {
        return JSON.parse(localStorage.getItem('journalDeletionLog') || '[]');
    }
    
    getByJournalId(journalId) {
        const logs = this.getAll();
        return logs.find(l => l.journalId === journalId) || null;
    }
    
    getByDateRange(start, end) {
        const logs = this.getAll();
        return logs.filter(l => {
            const logDate = new Date(l.deletedAt);
            return logDate >= start && logDate <= end;
        });
    }
}

class PeriodRepository {
    getAll() {
        return JSON.parse(localStorage.getItem('accountingPeriods') || '[]');
    }
    
    getCurrentPeriod() {
        const periods = this.getAll();
        const now = new Date();
        
        return periods.find(p => {
            const start = new Date(p.startDate);
            const end = new Date(p.endDate);
            return now >= start && now <= end;
        }) || null;
    }
    
    isPeriodClosed(date) {
        const period = this.getByDate(date);
        return period ? period.status === 'closed' : false;
    }
    
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

class ValidationService {
    constructor() {
        this.journalRepo = new JournalRepository();
        this.periodRepo = new PeriodRepository();
    }
    
    validateAuthorization(user) {
        if (!user) {
            return {
                valid: false,
                message: 'User tidak ditemukan',
                errors: ['User tidak ditemukan']
            };
        }
        
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
    
    validatePeriodStatus(journalDate) {
        if (!journalDate) {
            return {
                valid: false,
                message: 'Tanggal jurnal tidak valid',
                errors: ['Tanggal jurnal tidak valid']
            };
        }
        
        const date = new Date(journalDate);
        
        if (isNaN(date.getTime())) {
            return {
                valid: false,
                message: 'Format tanggal tidak valid',
                errors: ['Format tanggal tidak valid']
            };
        }
        
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
    
    validateReason(reason) {
        if (!reason || typeof reason !== 'string') {
            return {
                valid: false,
                message: 'Alasan penghapusan harus diisi',
                errors: ['Alasan penghapusan harus diisi']
            };
        }
        
        const trimmedReason = reason.trim();
        
        if (trimmedReason.length === 0) {
            return {
                valid: false,
                message: 'Alasan penghapusan tidak boleh kosong',
                errors: ['Alasan penghapusan tidak boleh kosong']
            };
        }
        
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
    
    validateDeletion(journalId, reason, user) {
        const errors = [];
        
        const authResult = this.validateAuthorization(user);
        if (!authResult.valid) {
            errors.push(...authResult.errors);
        }
        
        const journal = this.journalRepo.getById(journalId);
        if (!journal) {
            return {
                valid: false,
                message: 'Jurnal tidak ditemukan',
                errors: ['Jurnal tidak ditemukan']
            };
        }
        
        const periodResult = this.validatePeriodStatus(journal.tanggal);
        if (!periodResult.valid) {
            errors.push(...periodResult.errors);
        }
        
        const refResult = this.checkReferences(journalId);
        if (!refResult.valid && refResult.hasReferences) {
            errors.push(...refResult.errors);
        }
        
        const reasonResult = this.validateReason(reason);
        if (!reasonResult.valid) {
            errors.push(...reasonResult.errors);
        }
        
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

// Custom arbitraries for generating test data
const safeStringArbitrary = fc.stringOf(
    fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-'.split('')),
    { minLength: 5, maxLength: 20 }
).filter(s => /^[a-zA-Z]/.test(s) && !s.endsWith('-'));

const journalEntryArbitrary = fc.record({
    akun: fc.constantFrom('1-1000', '1-1200', '2-1000', '3-1000', '4-1000', '5-1000'),
    namaAkun: fc.string({ minLength: 5, maxLength: 50 }),
    debit: fc.nat({ max: 10000000 }),
    kredit: fc.nat({ max: 10000000 })
}).filter(entry => {
    // Ensure only one of debit or kredit is non-zero
    return (entry.debit === 0 && entry.kredit > 0) || (entry.kredit === 0 && entry.debit > 0);
});

const journalArbitrary = fc.record({
    id: safeStringArbitrary,
    tanggal: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString()),
    nomorJurnal: fc.string({ minLength: 5, maxLength: 20 }),
    tipe: fc.constantFrom('umum', 'kas', 'pembelian'),
    keterangan: fc.string({ minLength: 10, maxLength: 200 }),
    entries: fc.array(journalEntryArbitrary, { minLength: 2, maxLength: 10 }),
    createdBy: fc.string({ minLength: 3, maxLength: 50 }),
    createdAt: fc.date().map(d => d.toISOString()),
    referensi: fc.option(fc.record({
        tipe: fc.constantFrom('transaksi_pos', 'pembelian', 'manual'),
        id: safeStringArbitrary
    }), { nil: null })
}).map(journal => {
    // Calculate total debit and credit
    const totalDebit = journal.entries.reduce((sum, e) => sum + e.debit, 0);
    const totalKredit = journal.entries.reduce((sum, e) => sum + e.kredit, 0);
    
    // Balance the journal by adjusting the last entry
    if (totalDebit !== totalKredit) {
        const diff = totalDebit - totalKredit;
        const lastEntry = journal.entries[journal.entries.length - 1];
        
        if (diff > 0) {
            // Need more credit
            lastEntry.kredit += diff;
            lastEntry.debit = 0;
        } else {
            // Need more debit
            lastEntry.debit += Math.abs(diff);
            lastEntry.kredit = 0;
        }
    }
    
    journal.totalDebit = journal.entries.reduce((sum, e) => sum + e.debit, 0);
    journal.totalKredit = journal.entries.reduce((sum, e) => sum + e.kredit, 0);
    
    return journal;
});

// Test configuration
const testConfig = { numRuns: 100 };

describe('Hapus Data Jurnal - Repository Operations', () => {
    let journalRepo;
    let coaRepo;
    let auditLogRepo;
    let periodRepo;
    
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        
        // Initialize repositories
        journalRepo = new JournalRepository();
        coaRepo = new COARepository();
        auditLogRepo = new AuditLogRepository();
        periodRepo = new PeriodRepository();
    });
    
    afterEach(() => {
        localStorage.clear();
    });
    
    /**
     * Feature: hapus-data-jurnal, Property 14: Journal list display completeness
     * Validates: Requirements 1.1, 2.1, 3.1, 1.4
     * 
     * For any journal displayed in the list view, all required fields 
     * (date, number, description, type, total debit/credit) should be 
     * present and correctly formatted
     */
    test('Property 14: Journal list display completeness', () => {
        fc.assert(
            fc.property(
                fc.array(journalArbitrary, { minLength: 1, maxLength: 50 }),
                (journals) => {
                    // Setup: Save all journals to localStorage
                    localStorage.setItem('jurnal', JSON.stringify(journals));
                    
                    // Action: Retrieve all journals
                    const retrievedJournals = journalRepo.getAll();
                    
                    // Verify: All journals have required fields
                    const allHaveRequiredFields = retrievedJournals.every(journal => {
                        // Check required fields exist
                        const hasId = typeof journal.id === 'string' && journal.id.length > 0;
                        const hasTanggal = typeof journal.tanggal === 'string' && journal.tanggal.length > 0;
                        const hasNomorJurnal = typeof journal.nomorJurnal === 'string' && journal.nomorJurnal.length > 0;
                        const hasTipe = ['umum', 'kas', 'pembelian'].includes(journal.tipe);
                        const hasKeterangan = typeof journal.keterangan === 'string' && journal.keterangan.length > 0;
                        const hasTotalDebit = typeof journal.totalDebit === 'number' && journal.totalDebit >= 0;
                        const hasTotalKredit = typeof journal.totalKredit === 'number' && journal.totalKredit >= 0;
                        
                        // Check that totals are balanced
                        const isBalanced = journal.totalDebit === journal.totalKredit;
                        
                        return hasId && hasTanggal && hasNomorJurnal && hasTipe && 
                               hasKeterangan && hasTotalDebit && hasTotalKredit && isBalanced;
                    });
                    
                    // Verify: Retrieved count matches saved count
                    const countMatches = retrievedJournals.length === journals.length;
                    
                    return allHaveRequiredFields && countMatches;
                }
            ),
            testConfig
        );
    });
    
    test('JournalRepository.getById returns correct journal', () => {
        fc.assert(
            fc.property(
                fc.array(journalArbitrary, { minLength: 1, maxLength: 20 }),
                fc.integer({ min: 0, max: 19 }),
                (journals, index) => {
                    fc.pre(index < journals.length);
                    
                    // Setup
                    localStorage.setItem('jurnal', JSON.stringify(journals));
                    const targetJournal = journals[index];
                    
                    // Action
                    const retrieved = journalRepo.getById(targetJournal.id);
                    
                    // Verify
                    return retrieved !== null && 
                           retrieved.id === targetJournal.id &&
                           retrieved.nomorJurnal === targetJournal.nomorJurnal;
                }
            ),
            testConfig
        );
    });
    
    test('JournalRepository.getByType filters correctly', () => {
        fc.assert(
            fc.property(
                fc.array(journalArbitrary, { minLength: 5, maxLength: 30 }),
                fc.constantFrom('umum', 'kas', 'pembelian'),
                (journals, filterType) => {
                    // Setup
                    localStorage.setItem('jurnal', JSON.stringify(journals));
                    
                    // Action
                    const filtered = journalRepo.getByType(filterType);
                    
                    // Verify: All returned journals match the type
                    return filtered.every(j => j.tipe === filterType);
                }
            ),
            testConfig
        );
    });
    
    test('JournalRepository.delete removes journal', () => {
        fc.assert(
            fc.property(
                fc.array(journalArbitrary, { minLength: 1, maxLength: 20 }),
                fc.integer({ min: 0, max: 19 }),
                (journals, index) => {
                    fc.pre(index < journals.length);
                    
                    // Setup
                    localStorage.setItem('jurnal', JSON.stringify(journals));
                    const targetId = journals[index].id;
                    const initialCount = journals.length;
                    
                    // Action
                    const deleted = journalRepo.delete(targetId);
                    
                    // Verify
                    const afterDeletion = journalRepo.getAll();
                    const journalGone = journalRepo.getById(targetId) === null;
                    const countDecreased = afterDeletion.length === initialCount - 1;
                    
                    return deleted && journalGone && countDecreased;
                }
            ),
            testConfig
        );
    });
    
    test('JournalRepository.hasReferences detects references', () => {
        fc.assert(
            fc.property(
                journalArbitrary,
                (journal) => {
                    // Setup
                    localStorage.setItem('jurnal', JSON.stringify([journal]));
                    
                    // Action
                    const hasRef = journalRepo.hasReferences(journal.id);
                    
                    // Verify: Should match whether referensi exists
                    const expectedHasRef = journal.referensi !== null && journal.referensi.id !== undefined;
                    
                    return hasRef === expectedHasRef;
                }
            ),
            testConfig
        );
    });
    
    test('COARepository.getByCode returns correct account', () => {
        const accounts = [
            { kode: '1-1000', nama: 'Kas', tipe: 'Aset', saldo: 1000000 },
            { kode: '1-1200', nama: 'Bank', tipe: 'Aset', saldo: 5000000 },
            { kode: '4-1000', nama: 'Pendapatan', tipe: 'Pendapatan', saldo: 0 }
        ];
        
        localStorage.setItem('coa', JSON.stringify(accounts));
        
        const account = coaRepo.getByCode('1-1000');
        expect(account).not.toBeNull();
        expect(account.nama).toBe('Kas');
    });
    
    test('AuditLogRepository.save and retrieve', () => {
        const log = {
            id: 'AUDIT-001',
            journalId: 'J-001',
            deletedBy: 'admin',
            deletedAt: new Date().toISOString(),
            reason: 'Test deletion'
        };
        
        const savedId = auditLogRepo.save(log);
        expect(savedId).toBe('AUDIT-001');
        
        const retrieved = auditLogRepo.getByJournalId('J-001');
        expect(retrieved).not.toBeNull();
        expect(retrieved.deletedBy).toBe('admin');
    });
    
    test('PeriodRepository.isPeriodClosed checks status', () => {
        const periods = [
            {
                id: 'P-001',
                nama: 'Januari 2024',
                startDate: '2024-01-01T00:00:00.000Z',
                endDate: '2024-01-31T23:59:59.999Z',
                status: 'closed'
            },
            {
                id: 'P-002',
                nama: 'Februari 2024',
                startDate: '2024-02-01T00:00:00.000Z',
                endDate: '2024-02-29T23:59:59.999Z',
                status: 'open'
            }
        ];
        
        localStorage.setItem('accountingPeriods', JSON.stringify(periods));
        
        const isClosed = periodRepo.isPeriodClosed(new Date('2024-01-15'));
        expect(isClosed).toBe(true);
        
        const isOpen = periodRepo.isPeriodClosed(new Date('2024-02-15'));
        expect(isOpen).toBe(false);
    });
});

describe('Hapus Data Jurnal - Validation Service', () => {
    let validationService;
    let journalRepo;
    let periodRepo;
    
    beforeEach(() => {
        localStorage.clear();
        validationService = new ValidationService();
        journalRepo = new JournalRepository();
        periodRepo = new PeriodRepository();
    });
    
    afterEach(() => {
        localStorage.clear();
    });
    
    /**
     * Feature: hapus-data-jurnal, Property 3: Role-based deletion authorization
     * Validates: Requirements 5.1
     * 
     * For any user attempting to delete a journal, the operation should only 
     * proceed if the user has super admin role, otherwise it should be blocked 
     * with an authorization error
     */
    test('Property 3: Role-based deletion authorization', () => {
        fc.assert(
            fc.property(
                fc.record({
                    username: fc.string({ minLength: 3, maxLength: 50 }),
                    role: fc.constantFrom('administrator', 'kasir', 'user', 'manager', 'staff')
                }),
                (user) => {
                    // Action: Validate authorization
                    const result = validationService.validateAuthorization(user);
                    
                    // Verify: Only administrator (super admin) should be authorized
                    const isSuperAdmin = user.role === 'administrator';
                    
                    if (isSuperAdmin) {
                        // Super admin should be authorized
                        return result.valid === true && 
                               result.errors.length === 0;
                    } else {
                        // Non-admin should be blocked
                        return result.valid === false && 
                               result.errors.length > 0 &&
                               result.message.includes('super admin');
                    }
                }
            ),
            testConfig
        );
    });
    
    /**
     * Feature: hapus-data-jurnal, Property 4: Closed period protection
     * Validates: Requirements 5.3, 5.4
     * 
     * For any journal in a closed accounting period, deletion attempts should 
     * be blocked and return an error message indicating the period is closed
     */
    test('Property 4: Closed period protection', () => {
        fc.assert(
            fc.property(
                fc.record({
                    date: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
                    status: fc.constantFrom('open', 'closed')
                }),
                (testCase) => {
                    // Setup: Create a period with the specified status
                    const period = {
                        id: 'P-TEST',
                        nama: 'Test Period',
                        startDate: new Date(testCase.date.getFullYear(), testCase.date.getMonth(), 1).toISOString(),
                        endDate: new Date(testCase.date.getFullYear(), testCase.date.getMonth() + 1, 0, 23, 59, 59, 999).toISOString(),
                        status: testCase.status
                    };
                    
                    localStorage.setItem('accountingPeriods', JSON.stringify([period]));
                    
                    // Action: Validate period status
                    const result = validationService.validatePeriodStatus(testCase.date.toISOString());
                    
                    // Verify: Closed periods should be blocked
                    if (testCase.status === 'closed') {
                        return result.valid === false && 
                               result.errors.length > 0 &&
                               result.message.includes('ditutup');
                    } else {
                        // Open periods should be allowed
                        return result.valid === true && 
                               result.errors.length === 0;
                    }
                }
            ),
            testConfig
        );
    });
    
    /**
     * Feature: hapus-data-jurnal, Property 2: Referential integrity protection
     * Validates: Requirements 1.5, 3.5, 5.2
     * 
     * For any journal that has references to other transactions (POS, purchases, 
     * payments), deletion attempts should be blocked and return an error message 
     * indicating the reference
     */
    test('Property 2: Referential integrity protection', () => {
        fc.assert(
            fc.property(
                journalArbitrary,
                (journal) => {
                    // Setup: Save journal to localStorage
                    localStorage.setItem('jurnal', JSON.stringify([journal]));
                    
                    // Action: Check references
                    const result = validationService.checkReferences(journal.id);
                    
                    // Verify: Journals with references should be blocked
                    const hasReference = journal.referensi !== null && journal.referensi.id !== undefined;
                    
                    if (hasReference) {
                        return result.valid === false && 
                               result.hasReferences === true &&
                               result.errors.length > 0 &&
                               result.message.includes('referensi');
                    } else {
                        // Journals without references should be allowed
                        return result.valid === true && 
                               result.hasReferences === false &&
                               result.errors.length === 0;
                    }
                }
            ),
            testConfig
        );
    });
    
    /**
     * Feature: hapus-data-jurnal, Property 15: Reason validation
     * Validates: Requirements 5.5
     * 
     * For any deletion attempt, a non-empty reason string (max 500 characters) 
     * must be provided, otherwise the deletion should be blocked
     */
    test('Property 15: Reason validation', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.string({ minLength: 1, maxLength: 500 }),
                    fc.string({ minLength: 501, maxLength: 1000 }),
                    fc.constant(''),
                    fc.constant('   '),
                    fc.constant(null),
                    fc.constant(undefined)
                ),
                (reason) => {
                    // Action: Validate reason
                    const result = validationService.validateReason(reason);
                    
                    // Verify: Valid reasons should pass, invalid should fail
                    if (reason && typeof reason === 'string') {
                        const trimmed = reason.trim();
                        
                        if (trimmed.length > 0 && trimmed.length <= 500) {
                            // Valid reason
                            return result.valid === true && result.errors.length === 0;
                        } else if (trimmed.length === 0) {
                            // Empty reason
                            return result.valid === false && 
                                   result.errors.length > 0 &&
                                   (result.message.includes('kosong') || result.message.includes('diisi'));
                        } else {
                            // Too long
                            return result.valid === false && 
                                   result.errors.length > 0 &&
                                   result.message.includes('panjang');
                        }
                    } else {
                        // Null or undefined
                        return result.valid === false && 
                               result.errors.length > 0 &&
                               result.message.includes('diisi');
                    }
                }
            ),
            testConfig
        );
    });
});
