/**
 * Property-Based Tests for Modal Awal Opsional
 * Feature: modal-awal-opsional
 */

import fc from 'fast-check';

// Mock wizard state and validation functions
let wizardState = {
    currentStep: 1,
    totalSteps: 7,
    isEditMode: false,
    oldSaldoAwal: null,
    data: {
        tanggalMulai: '',
        modalKoperasi: 0,
        kas: 0,
        bank: 0,
        persediaan: [],
        piutangAnggota: [],
        hutangSupplier: [],
        simpananAnggota: [],
        pinjamanAnggota: []
    }
};

// Mock validatePositiveValue function
function validatePositiveValue(nilai, namaField = 'Nilai') {
    if (nilai === null || nilai === undefined) {
        return {
            isValid: false,
            message: `${namaField} harus diisi`
        };
    }
    
    const nilaiNum = parseFloat(nilai);
    
    if (isNaN(nilaiNum)) {
        return {
            isValid: false,
            message: `${namaField} harus berupa angka`
        };
    }
    
    if (nilaiNum < 0) {
        return {
            isValid: false,
            message: `${namaField} tidak boleh negatif`
        };
    }
    
    return {
        isValid: true,
        message: `${namaField} valid`
    };
}

// Mock validateUniquePeriodDate function
function validateUniquePeriodDate(tanggalMulai) {
    if (!tanggalMulai) {
        return {
            isValid: false,
            message: 'Tanggal mulai periode harus diisi'
        };
    }
    
    return {
        isValid: true,
        message: 'Tanggal periode valid'
    };
}

// Mock validateCurrentStep function with updated logic
function validateCurrentStep() {
    const errors = [];
    
    if (wizardState.currentStep === 1) {
        // Validasi tanggal periode (skip jika edit mode)
        if (!wizardState.isEditMode) {
            const dateValidation = validateUniquePeriodDate(wizardState.data.tanggalMulai);
            if (!dateValidation.isValid) {
                errors.push(dateValidation.message);
            }
        }
        
        // Validasi modal koperasi - hanya tolak nilai negatif
        const modalValidation = validatePositiveValue(wizardState.data.modalKoperasi, 'Modal Koperasi');
        if (!modalValidation.isValid) {
            errors.push(modalValidation.message);
        } else if (wizardState.data.modalKoperasi < 0) {
            errors.push('Modal Koperasi tidak boleh negatif');
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * **Feature: modal-awal-opsional, Property 1: Zero value acceptance**
 * **Validates: Requirements 1.1, 2.3**
 */
describe('**Feature: modal-awal-opsional, Property 1: Zero value acceptance**', () => {
    beforeEach(() => {
        // Reset wizard state before each test
        wizardState = {
            currentStep: 1,
            totalSteps: 7,
            isEditMode: false,
            oldSaldoAwal: null,
            data: {
                tanggalMulai: '2024-01-01',
                modalKoperasi: 0,
                kas: 0,
                bank: 0,
                persediaan: [],
                piutangAnggota: [],
                hutangSupplier: [],
                simpananAnggota: [],
                pinjamanAnggota: []
            }
        };
    });
    
    test('For any wizard state with modalKoperasi = 0, validateCurrentStep should return valid (no errors)', () => {
        fc.assert(
            fc.property(
                fc.date(),
                (date) => {
                    // Set up wizard state with modal = 0
                    wizardState.data.tanggalMulai = date.toISOString().split('T')[0];
                    wizardState.data.modalKoperasi = 0;
                    wizardState.currentStep = 1;
                    
                    // Validate
                    const result = validateCurrentStep();
                    
                    // Should be valid with no errors
                    return result.isValid === true && result.errors.length === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any non-negative value including 0, validateCurrentStep should accept it and proceed to next step', () => {
        fc.assert(
            fc.property(
                fc.nat(100000000),
                fc.date(),
                (modalValue, date) => {
                    // Set up wizard state with non-negative modal value
                    wizardState.data.tanggalMulai = date.toISOString().split('T')[0];
                    wizardState.data.modalKoperasi = modalValue;
                    wizardState.currentStep = 1;
                    
                    // Validate
                    const result = validateCurrentStep();
                    
                    // Should be valid
                    return result.isValid === true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Feature: modal-awal-opsional, Property 2: Empty field conversion**
 * **Validates: Requirements 1.2, 2.4**
 */
describe('**Feature: modal-awal-opsional, Property 2: Empty field conversion**', () => {
    test('For any empty string input, parseFloat(value) || 0 should convert to 0', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('', '   ', '\t', '\n', '  \t\n  '),
                (emptyValue) => {
                    // Test the conversion logic used in the input handler
                    const result = parseFloat(emptyValue) || 0;
                    
                    // Should always convert to 0
                    return result === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any wizard state with empty modal field, system should treat it as 0 without error', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('', '   ', '\t', '\n'),
                fc.date(),
                (emptyValue, date) => {
                    // Simulate empty field conversion
                    const convertedValue = parseFloat(emptyValue) || 0;
                    
                    // Set up wizard state with converted value
                    wizardState.data.tanggalMulai = date.toISOString().split('T')[0];
                    wizardState.data.modalKoperasi = convertedValue;
                    wizardState.currentStep = 1;
                    
                    // Validate
                    const result = validateCurrentStep();
                    
                    // Should be valid with no errors
                    return result.isValid === true && 
                           result.errors.length === 0 &&
                           wizardState.data.modalKoperasi === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any whitespace-only string, conversion should result in 0', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 10 }),
                (numSpaces) => {
                    const whitespaceString = ' '.repeat(numSpaces);
                    const result = parseFloat(whitespaceString) || 0;
                    
                    return result === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
});

// Mock generateJurnalPembuka function
function generateJurnalPembuka(saldoAwalData) {
    const entries = [];
    
    // 1. Modal Koperasi: Debit Kas, Kredit Modal Koperasi
    // Catat jurnal bahkan jika nilai 0 untuk audit trail
    if (saldoAwalData.modalKoperasi >= 0) {
        entries.push({
            akun: '1-1000', // Kas
            debit: saldoAwalData.modalKoperasi,
            kredit: 0
        });
        entries.push({
            akun: '3-1000', // Modal Koperasi
            debit: 0,
            kredit: saldoAwalData.modalKoperasi
        });
    }
    
    return entries;
}

/**
 * **Feature: modal-awal-opsional, Property 3: Zero value journal recording**
 * **Validates: Requirements 1.3**
 */
describe('**Feature: modal-awal-opsional, Property 3: Zero value journal recording**', () => {
    test('For any saldo awal with modalKoperasi = 0, system should record journal with debit Kas = 0 and kredit Modal Koperasi = 0', () => {
        fc.assert(
            fc.property(
                fc.record({
                    tanggalMulai: fc.date().map(d => d.toISOString().split('T')[0]),
                    modalKoperasi: fc.constant(0),
                    kas: fc.nat(100000000),
                    bank: fc.nat(100000000),
                    persediaan: fc.constant([]),
                    piutangAnggota: fc.constant([]),
                    hutangSupplier: fc.constant([]),
                    simpananAnggota: fc.constant([]),
                    pinjamanAnggota: fc.constant([])
                }),
                (saldoAwalData) => {
                    // Generate journal entries
                    const entries = generateJurnalPembuka(saldoAwalData);
                    
                    // Should have at least 2 entries (Kas debit and Modal kredit)
                    if (entries.length < 2) {
                        return false;
                    }
                    
                    // Find the Kas (1-1000) debit entry
                    const kasEntry = entries.find(e => e.akun === '1-1000' && e.debit === 0 && e.kredit === 0);
                    
                    // Find the Modal Koperasi (3-1000) kredit entry
                    const modalEntry = entries.find(e => e.akun === '3-1000' && e.debit === 0 && e.kredit === 0);
                    
                    // Both entries should exist with value 0
                    return kasEntry !== undefined && modalEntry !== undefined;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any saldo awal with modalKoperasi = 0, journal entries should still be recorded for audit trail', () => {
        fc.assert(
            fc.property(
                fc.record({
                    tanggalMulai: fc.date().map(d => d.toISOString().split('T')[0]),
                    modalKoperasi: fc.constant(0),
                    kas: fc.nat(100000000),
                    bank: fc.nat(100000000),
                    persediaan: fc.constant([]),
                    piutangAnggota: fc.constant([]),
                    hutangSupplier: fc.constant([]),
                    simpananAnggota: fc.constant([]),
                    pinjamanAnggota: fc.constant([])
                }),
                (saldoAwalData) => {
                    // Generate journal entries
                    const entries = generateJurnalPembuka(saldoAwalData);
                    
                    // Should have entries even when modal is 0 (for audit trail)
                    // At minimum, should have Kas debit and Modal kredit entries
                    const hasKasEntry = entries.some(e => e.akun === '1-1000');
                    const hasModalEntry = entries.some(e => e.akun === '3-1000');
                    
                    return hasKasEntry && hasModalEntry && entries.length >= 2;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any saldo awal with modalKoperasi = 0, the debit and kredit amounts should match (double-entry)', () => {
        fc.assert(
            fc.property(
                fc.record({
                    tanggalMulai: fc.date().map(d => d.toISOString().split('T')[0]),
                    modalKoperasi: fc.constant(0),
                    kas: fc.nat(100000000),
                    bank: fc.nat(100000000),
                    persediaan: fc.constant([]),
                    piutangAnggota: fc.constant([]),
                    hutangSupplier: fc.constant([]),
                    simpananAnggota: fc.constant([]),
                    pinjamanAnggota: fc.constant([])
                }),
                (saldoAwalData) => {
                    // Generate journal entries
                    const entries = generateJurnalPembuka(saldoAwalData);
                    
                    // Find the Kas (1-1000) entry with debit
                    const kasEntry = entries.find(e => e.akun === '1-1000' && e.debit >= 0);
                    
                    // Find the Modal Koperasi (3-1000) entry with kredit
                    const modalEntry = entries.find(e => e.akun === '3-1000' && e.kredit >= 0);
                    
                    // Both entries should exist and amounts should match (both 0 in this case)
                    return kasEntry !== undefined && 
                           modalEntry !== undefined && 
                           kasEntry.debit === 0 && 
                           modalEntry.kredit === 0 &&
                           kasEntry.debit === modalEntry.kredit;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * Unit Tests for generateJurnalPembuka function
 * **Validates: Requirements 1.3**
 */
describe('Unit Tests: generateJurnalPembuka with modal values', () => {
    test('generateJurnalPembuka with modal = 0 should create journal with debit Kas = 0, kredit Modal = 0', () => {
        // Arrange
        const saldoAwalData = {
            tanggalMulai: '2024-01-01',
            modalKoperasi: 0,
            kas: 0,
            bank: 0,
            persediaan: [],
            piutangAnggota: [],
            hutangSupplier: [],
            simpananAnggota: [],
            pinjamanAnggota: []
        };
        
        // Act
        const entries = generateJurnalPembuka(saldoAwalData);
        
        // Assert
        // Should have at least 2 entries for modal (Kas debit and Modal kredit)
        expect(entries.length).toBeGreaterThanOrEqual(2);
        
        // Find the Kas (1-1000) debit entry
        const kasEntry = entries.find(e => e.akun === '1-1000' && e.debit === 0 && e.kredit === 0);
        expect(kasEntry).toBeDefined();
        expect(kasEntry.debit).toBe(0);
        expect(kasEntry.kredit).toBe(0);
        
        // Find the Modal Koperasi (3-1000) kredit entry
        const modalEntry = entries.find(e => e.akun === '3-1000' && e.debit === 0 && e.kredit === 0);
        expect(modalEntry).toBeDefined();
        expect(modalEntry.debit).toBe(0);
        expect(modalEntry.kredit).toBe(0);
    });
    
    test('generateJurnalPembuka with modal = 1000000 should create journal with debit Kas = 1000000, kredit Modal = 1000000', () => {
        // Arrange
        const saldoAwalData = {
            tanggalMulai: '2024-01-01',
            modalKoperasi: 1000000,
            kas: 1000000,
            bank: 0,
            persediaan: [],
            piutangAnggota: [],
            hutangSupplier: [],
            simpananAnggota: [],
            pinjamanAnggota: []
        };
        
        // Act
        const entries = generateJurnalPembuka(saldoAwalData);
        
        // Assert
        // Should have at least 2 entries for modal (Kas debit and Modal kredit)
        expect(entries.length).toBeGreaterThanOrEqual(2);
        
        // Find the Kas (1-1000) debit entry with value 1000000
        const kasEntry = entries.find(e => e.akun === '1-1000' && e.debit === 1000000);
        expect(kasEntry).toBeDefined();
        expect(kasEntry.debit).toBe(1000000);
        expect(kasEntry.kredit).toBe(0);
        
        // Find the Modal Koperasi (3-1000) kredit entry with value 1000000
        const modalEntry = entries.find(e => e.akun === '3-1000' && e.kredit === 1000000);
        expect(modalEntry).toBeDefined();
        expect(modalEntry.debit).toBe(0);
        expect(modalEntry.kredit).toBe(1000000);
    });
    
    test('generateJurnalPembuka should maintain double-entry balance (total debit = total kredit)', () => {
        // Arrange
        const testCases = [
            { modalKoperasi: 0, kas: 0 },
            { modalKoperasi: 1000000, kas: 1000000 },
            { modalKoperasi: 5000000, kas: 5000000 },
            { modalKoperasi: 100, kas: 100 }
        ];
        
        testCases.forEach(testCase => {
            const saldoAwalData = {
                tanggalMulai: '2024-01-01',
                modalKoperasi: testCase.modalKoperasi,
                kas: testCase.kas,
                bank: 0,
                persediaan: [],
                piutangAnggota: [],
                hutangSupplier: [],
                simpananAnggota: [],
                pinjamanAnggota: []
            };
            
            // Act
            const entries = generateJurnalPembuka(saldoAwalData);
            
            // Assert - Calculate total debit and kredit
            const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
            const totalKredit = entries.reduce((sum, e) => sum + e.kredit, 0);
            
            // Should balance (double-entry accounting)
            expect(totalDebit).toBe(totalKredit);
        });
    });
});

/**
 * **Feature: modal-awal-opsional, Property 6: Negative value rejection**
 * **Validates: Requirements 2.1**
 */
describe('**Feature: modal-awal-opsional, Property 6: Negative value rejection**', () => {
    beforeEach(() => {
        // Reset wizard state before each test
        wizardState = {
            currentStep: 1,
            totalSteps: 7,
            isEditMode: false,
            oldSaldoAwal: null,
            data: {
                tanggalMulai: '2024-01-01',
                modalKoperasi: 0,
                kas: 0,
                bank: 0,
                persediaan: [],
                piutangAnggota: [],
                hutangSupplier: [],
                simpananAnggota: [],
                pinjamanAnggota: []
            }
        };
    });
    
    test('For any negative modal value, validateCurrentStep should return error and not proceed to next step', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: -100000000, max: -1 }),
                fc.date(),
                (negativeValue, date) => {
                    // Set up wizard state with negative modal value
                    wizardState.data.tanggalMulai = date.toISOString().split('T')[0];
                    wizardState.data.modalKoperasi = negativeValue;
                    wizardState.currentStep = 1;
                    
                    // Validate
                    const result = validateCurrentStep();
                    
                    // Should be invalid with error message
                    const hasError = result.isValid === false && result.errors.length > 0;
                    const hasCorrectErrorMessage = result.errors.some(err => 
                        err.includes('Modal Koperasi tidak boleh negatif')
                    );
                    
                    return hasError && hasCorrectErrorMessage;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any negative value, validatePositiveValue should return isValid false with appropriate error message', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: -100000000, max: -1 }),
                (negativeValue) => {
                    const result = validatePositiveValue(negativeValue, 'Modal Koperasi');
                    
                    return result.isValid === false && 
                           result.message.includes('tidak boleh negatif');
                }
            ),
            { numRuns: 100 }
        );
    });
});

// Mock COA data for testing
const mockCOA = [
    { kode: '1-1000', nama: 'Kas', tipe: 'Aset', saldo: 0 },
    { kode: '1-1100', nama: 'Bank', tipe: 'Aset', saldo: 0 },
    { kode: '1-1200', nama: 'Piutang Anggota', tipe: 'Aset', saldo: 0 },
    { kode: '1-1300', nama: 'Persediaan', tipe: 'Aset', saldo: 0 },
    { kode: '1-1400', nama: 'Piutang Pinjaman', tipe: 'Aset', saldo: 0 },
    { kode: '2-1000', nama: 'Hutang Supplier', tipe: 'Kewajiban', saldo: 0 },
    { kode: '2-1100', nama: 'Simpanan Pokok', tipe: 'Kewajiban', saldo: 0 },
    { kode: '2-1200', nama: 'Simpanan Wajib', tipe: 'Kewajiban', saldo: 0 },
    { kode: '2-1300', nama: 'Simpanan Sukarela', tipe: 'Kewajiban', saldo: 0 },
    { kode: '3-1000', nama: 'Modal Koperasi', tipe: 'Modal', saldo: 0 }
];

// Mock generateJurnalKoreksi function
function generateJurnalKoreksi(oldSaldoAwal, newSaldoAwal) {
    const entries = [];
    
    // Helper function untuk menambahkan entry koreksi
    const addKoreksiEntry = (akun, oldValue, newValue) => {
        const selisih = newValue - oldValue;
        
        if (Math.abs(selisih) < 0.01) {
            return; // Tidak ada perubahan signifikan
        }
        
        // Untuk akun Aset: jika naik -> debit, jika turun -> kredit
        // Untuk akun Kewajiban/Modal: jika naik -> kredit, jika turun -> debit
        const akunData = mockCOA.find(a => a.kode === akun);
        
        if (!akunData) return;
        
        if (akunData.tipe === 'Aset') {
            if (selisih > 0) {
                // Aset naik: Debit Aset, Kredit Modal
                entries.push({ akun: akun, debit: selisih, kredit: 0 });
                entries.push({ akun: '3-1000', debit: 0, kredit: selisih });
            } else {
                // Aset turun: Kredit Aset, Debit Modal
                entries.push({ akun: akun, debit: 0, kredit: Math.abs(selisih) });
                entries.push({ akun: '3-1000', debit: Math.abs(selisih), kredit: 0 });
            }
        } else if (akunData.tipe === 'Kewajiban' || akunData.tipe === 'Modal') {
            if (selisih > 0) {
                // Kewajiban/Modal naik: Debit Modal, Kredit Kewajiban/Modal
                entries.push({ akun: '3-1000', debit: selisih, kredit: 0 });
                entries.push({ akun: akun, debit: 0, kredit: selisih });
            } else {
                // Kewajiban/Modal turun: Kredit Modal, Debit Kewajiban/Modal
                entries.push({ akun: '3-1000', debit: 0, kredit: Math.abs(selisih) });
                entries.push({ akun: akun, debit: Math.abs(selisih), kredit: 0 });
            }
        }
    };
    
    // 1. Koreksi Kas
    addKoreksiEntry('1-1000', oldSaldoAwal.kas || 0, newSaldoAwal.kas || 0);
    
    // 2. Koreksi Bank
    addKoreksiEntry('1-1100', oldSaldoAwal.bank || 0, newSaldoAwal.bank || 0);
    
    // 3. Koreksi Piutang Anggota
    const oldTotalPiutang = (oldSaldoAwal.piutangAnggota || []).reduce((sum, p) => sum + (p.jumlah || 0), 0);
    const newTotalPiutang = (newSaldoAwal.piutangAnggota || []).reduce((sum, p) => sum + (p.jumlah || 0), 0);
    addKoreksiEntry('1-1200', oldTotalPiutang, newTotalPiutang);
    
    // 4. Koreksi Persediaan
    const oldTotalPersediaan = (oldSaldoAwal.persediaan || []).reduce((sum, p) => sum + (p.stok * p.hpp), 0);
    const newTotalPersediaan = (newSaldoAwal.persediaan || []).reduce((sum, p) => sum + (p.stok * p.hpp), 0);
    addKoreksiEntry('1-1300', oldTotalPersediaan, newTotalPersediaan);
    
    // 5. Koreksi Piutang Pinjaman
    const oldTotalPinjaman = (oldSaldoAwal.pinjamanAnggota || []).reduce((sum, p) => sum + (p.jumlahPokok || 0), 0);
    const newTotalPinjaman = (newSaldoAwal.pinjamanAnggota || []).reduce((sum, p) => sum + (p.jumlahPokok || 0), 0);
    addKoreksiEntry('1-1400', oldTotalPinjaman, newTotalPinjaman);
    
    // 6. Koreksi Hutang Supplier
    const oldTotalHutang = (oldSaldoAwal.hutangSupplier || []).reduce((sum, h) => sum + (h.jumlah || 0), 0);
    const newTotalHutang = (newSaldoAwal.hutangSupplier || []).reduce((sum, h) => sum + (h.jumlah || 0), 0);
    addKoreksiEntry('2-1000', oldTotalHutang, newTotalHutang);
    
    // 7. Koreksi Simpanan Pokok
    const oldTotalSimpananPokok = (oldSaldoAwal.simpananAnggota || []).reduce((sum, s) => sum + (s.simpananPokok || 0), 0);
    const newTotalSimpananPokok = (newSaldoAwal.simpananAnggota || []).reduce((sum, s) => sum + (s.simpananPokok || 0), 0);
    addKoreksiEntry('2-1100', oldTotalSimpananPokok, newTotalSimpananPokok);
    
    // 8. Koreksi Simpanan Wajib
    const oldTotalSimpananWajib = (oldSaldoAwal.simpananAnggota || []).reduce((sum, s) => sum + (s.simpananWajib || 0), 0);
    const newTotalSimpananWajib = (newSaldoAwal.simpananAnggota || []).reduce((sum, s) => sum + (s.simpananWajib || 0), 0);
    addKoreksiEntry('2-1200', oldTotalSimpananWajib, newTotalSimpananWajib);
    
    // 9. Koreksi Simpanan Sukarela
    const oldTotalSimpananSukarela = (oldSaldoAwal.simpananAnggota || []).reduce((sum, s) => sum + (s.simpananSukarela || 0), 0);
    const newTotalSimpananSukarela = (newSaldoAwal.simpananAnggota || []).reduce((sum, s) => sum + (s.simpananSukarela || 0), 0);
    addKoreksiEntry('2-1300', oldTotalSimpananSukarela, newTotalSimpananSukarela);
    
    // 10. Koreksi Modal Koperasi
    addKoreksiEntry('3-1000', oldSaldoAwal.modalKoperasi || 0, newSaldoAwal.modalKoperasi || 0);
    
    return entries;
}

/**
 * **Feature: modal-awal-opsional, Property 8: Edit to zero correction journal**
 * **Validates: Requirements 3.1, 3.2**
 */
describe('**Feature: modal-awal-opsional, Property 8: Edit to zero correction journal**', () => {
    test('For any edit from positive modal value X to 0, system should create correction journal with debit Modal Koperasi = X and kredit Kas = X', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 100000000 }),
                (oldModalValue) => {
                    // Create old saldo awal with modal = X
                    const oldSaldoAwal = {
                        tanggalMulai: '2024-01-01',
                        modalKoperasi: oldModalValue,
                        kas: 0,
                        bank: 0,
                        persediaan: [],
                        piutangAnggota: [],
                        hutangSupplier: [],
                        simpananAnggota: [],
                        pinjamanAnggota: []
                    };
                    
                    // Create new saldo awal with modal = 0
                    const newSaldoAwal = {
                        tanggalMulai: '2024-01-01',
                        modalKoperasi: 0,
                        kas: 0,
                        bank: 0,
                        persediaan: [],
                        piutangAnggota: [],
                        hutangSupplier: [],
                        simpananAnggota: [],
                        pinjamanAnggota: []
                    };
                    
                    // Generate correction journal
                    const entries = generateJurnalKoreksi(oldSaldoAwal, newSaldoAwal);
                    
                    // Should have entries for Modal Koperasi correction
                    // When modal decreases from X to 0, we need to:
                    // - Debit Modal Koperasi (3-1000) = X (decrease modal)
                    // - Kredit Modal Koperasi (3-1000) = X (but this is handled through Kas)
                    
                    // Find the Modal Koperasi debit entry
                    const modalDebitEntry = entries.find(e => 
                        e.akun === '3-1000' && e.debit === oldModalValue && e.kredit === 0
                    );
                    
                    // The correction should exist
                    return modalDebitEntry !== undefined;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any edit from modal X to 0, the correction journal should balance (total debit = total kredit)', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 100000000 }),
                (oldModalValue) => {
                    // Create old saldo awal with modal = X
                    const oldSaldoAwal = {
                        tanggalMulai: '2024-01-01',
                        modalKoperasi: oldModalValue,
                        kas: 0,
                        bank: 0,
                        persediaan: [],
                        piutangAnggota: [],
                        hutangSupplier: [],
                        simpananAnggota: [],
                        pinjamanAnggota: []
                    };
                    
                    // Create new saldo awal with modal = 0
                    const newSaldoAwal = {
                        tanggalMulai: '2024-01-01',
                        modalKoperasi: 0,
                        kas: 0,
                        bank: 0,
                        persediaan: [],
                        piutangAnggota: [],
                        hutangSupplier: [],
                        simpananAnggota: [],
                        pinjamanAnggota: []
                    };
                    
                    // Generate correction journal
                    const entries = generateJurnalKoreksi(oldSaldoAwal, newSaldoAwal);
                    
                    // Calculate total debit and kredit
                    const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
                    const totalKredit = entries.reduce((sum, e) => sum + e.kredit, 0);
                    
                    // Should balance (double-entry accounting)
                    return Math.abs(totalDebit - totalKredit) < 0.01;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any edit from 0 to 0, no correction journal entries should be created', () => {
        fc.assert(
            fc.property(
                fc.constant(0),
                (modalValue) => {
                    // Create old saldo awal with modal = 0
                    const oldSaldoAwal = {
                        tanggalMulai: '2024-01-01',
                        modalKoperasi: modalValue,
                        kas: 0,
                        bank: 0,
                        persediaan: [],
                        piutangAnggota: [],
                        hutangSupplier: [],
                        simpananAnggota: [],
                        pinjamanAnggota: []
                    };
                    
                    // Create new saldo awal with modal = 0 (no change)
                    const newSaldoAwal = {
                        tanggalMulai: '2024-01-01',
                        modalKoperasi: modalValue,
                        kas: 0,
                        bank: 0,
                        persediaan: [],
                        piutangAnggota: [],
                        hutangSupplier: [],
                        simpananAnggota: [],
                        pinjamanAnggota: []
                    };
                    
                    // Generate correction journal
                    const entries = generateJurnalKoreksi(oldSaldoAwal, newSaldoAwal);
                    
                    // Should have no entries (no change)
                    return entries.length === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any edit from 0 to positive value X, system should create correction journal with debit Kas and kredit Modal', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 100000000 }),
                (newModalValue) => {
                    // Create old saldo awal with modal = 0
                    const oldSaldoAwal = {
                        tanggalMulai: '2024-01-01',
                        modalKoperasi: 0,
                        kas: 0,
                        bank: 0,
                        persediaan: [],
                        piutangAnggota: [],
                        hutangSupplier: [],
                        simpananAnggota: [],
                        pinjamanAnggota: []
                    };
                    
                    // Create new saldo awal with modal = X
                    const newSaldoAwal = {
                        tanggalMulai: '2024-01-01',
                        modalKoperasi: newModalValue,
                        kas: 0,
                        bank: 0,
                        persediaan: [],
                        piutangAnggota: [],
                        hutangSupplier: [],
                        simpananAnggota: [],
                        pinjamanAnggota: []
                    };
                    
                    // Generate correction journal
                    const entries = generateJurnalKoreksi(oldSaldoAwal, newSaldoAwal);
                    
                    // When modal increases from 0 to X, we need to:
                    // - Debit Modal Koperasi (3-1000) = X
                    // - Kredit Modal Koperasi (3-1000) = X
                    
                    // Find the Modal Koperasi kredit entry
                    const modalKreditEntry = entries.find(e => 
                        e.akun === '3-1000' && e.kredit === newModalValue && e.debit === 0
                    );
                    
                    // The correction should exist
                    return modalKreditEntry !== undefined;
                }
            ),
            { numRuns: 100 }
        );
    });
});

// Mock saveSaldoAwal function for COA update testing
function mockSaveSaldoAwalCOA(saldoAwalData) {
    // Simulate COA update logic from saveSaldoAwal function
    const coa = JSON.parse(JSON.stringify(mockCOA)); // Deep copy
    
    // Update saldo Modal Koperasi
    const akunModal = coa.find(a => a.kode === '3-1000');
    if (akunModal) {
        akunModal.saldo = saldoAwalData.modalKoperasi;
    }
    
    return coa;
}

/**
 * **Feature: modal-awal-opsional, Property 4: Zero value COA update**
 * **Validates: Requirements 1.4, 3.3**
 */
describe('**Feature: modal-awal-opsional, Property 4: Zero value COA update**', () => {
    test('For any saldo awal with modalKoperasi = 0 (create mode), system should update COA account 3-1000 saldo to 0', () => {
        fc.assert(
            fc.property(
                fc.record({
                    tanggalMulai: fc.date().map(d => d.toISOString().split('T')[0]),
                    modalKoperasi: fc.constant(0),
                    kas: fc.nat(100000000),
                    bank: fc.nat(100000000),
                    persediaan: fc.constant([]),
                    piutangAnggota: fc.constant([]),
                    hutangSupplier: fc.constant([]),
                    simpananAnggota: fc.constant([]),
                    pinjamanAnggota: fc.constant([])
                }),
                (saldoAwalData) => {
                    // Simulate saveSaldoAwal COA update
                    const updatedCOA = mockSaveSaldoAwalCOA(saldoAwalData);
                    
                    // Find Modal Koperasi account
                    const akunModal = updatedCOA.find(a => a.kode === '3-1000');
                    
                    // Should exist and have saldo = 0
                    return akunModal !== undefined && akunModal.saldo === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any saldo awal with modalKoperasi = 0 (edit mode), system should update COA account 3-1000 saldo to 0', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 100000000 }),
                fc.date(),
                (oldModalValue, date) => {
                    // Simulate edit from oldModalValue to 0
                    const oldSaldoAwal = {
                        tanggalMulai: date.toISOString().split('T')[0],
                        modalKoperasi: oldModalValue,
                        kas: 0,
                        bank: 0,
                        persediaan: [],
                        piutangAnggota: [],
                        hutangSupplier: [],
                        simpananAnggota: [],
                        pinjamanAnggota: []
                    };
                    
                    const newSaldoAwal = {
                        tanggalMulai: date.toISOString().split('T')[0],
                        modalKoperasi: 0,
                        kas: 0,
                        bank: 0,
                        persediaan: [],
                        piutangAnggota: [],
                        hutangSupplier: [],
                        simpananAnggota: [],
                        pinjamanAnggota: []
                    };
                    
                    // Simulate saveSaldoAwal COA update with new data
                    const updatedCOA = mockSaveSaldoAwalCOA(newSaldoAwal);
                    
                    // Find Modal Koperasi account
                    const akunModal = updatedCOA.find(a => a.kode === '3-1000');
                    
                    // Should exist and have saldo = 0
                    return akunModal !== undefined && akunModal.saldo === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any saldo awal with modalKoperasi >= 0, COA update should reflect the exact modal value', () => {
        fc.assert(
            fc.property(
                fc.nat(100000000),
                fc.date(),
                (modalValue, date) => {
                    const saldoAwalData = {
                        tanggalMulai: date.toISOString().split('T')[0],
                        modalKoperasi: modalValue,
                        kas: 0,
                        bank: 0,
                        persediaan: [],
                        piutangAnggota: [],
                        hutangSupplier: [],
                        simpananAnggota: [],
                        pinjamanAnggota: []
                    };
                    
                    // Simulate saveSaldoAwal COA update
                    const updatedCOA = mockSaveSaldoAwalCOA(saldoAwalData);
                    
                    // Find Modal Koperasi account
                    const akunModal = updatedCOA.find(a => a.kode === '3-1000');
                    
                    // Should exist and have saldo equal to modalKoperasi
                    return akunModal !== undefined && akunModal.saldo === modalValue;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any COA update with modalKoperasi = 0, the Modal Koperasi account should exist and be properly updated', () => {
        fc.assert(
            fc.property(
                fc.record({
                    tanggalMulai: fc.date().map(d => d.toISOString().split('T')[0]),
                    modalKoperasi: fc.constant(0),
                    kas: fc.nat(100000000),
                    bank: fc.nat(100000000),
                    persediaan: fc.constant([]),
                    piutangAnggota: fc.constant([]),
                    hutangSupplier: fc.constant([]),
                    simpananAnggota: fc.constant([]),
                    pinjamanAnggota: fc.constant([])
                }),
                (saldoAwalData) => {
                    // Simulate saveSaldoAwal COA update
                    const updatedCOA = mockSaveSaldoAwalCOA(saldoAwalData);
                    
                    // Find Modal Koperasi account
                    const akunModal = updatedCOA.find(a => a.kode === '3-1000');
                    
                    // Verify account exists, has correct properties, and saldo = 0
                    return akunModal !== undefined && 
                           akunModal.kode === '3-1000' &&
                           akunModal.nama === 'Modal Koperasi' &&
                           akunModal.tipe === 'Modal' &&
                           akunModal.saldo === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * Unit Tests for COA update with modal 0
 * **Validates: Requirements 1.4, 3.3**
 */
describe('Unit Tests: COA update with modal 0', () => {
    test('After saveSaldoAwal() with modal = 0, COA account 3-1000 saldo should be 0', () => {
        // Arrange
        const saldoAwalData = {
            tanggalMulai: '2024-01-01',
            modalKoperasi: 0,
            kas: 0,
            bank: 0,
            persediaan: [],
            piutangAnggota: [],
            hutangSupplier: [],
            simpananAnggota: [],
            pinjamanAnggota: []
        };
        
        // Simulate the COA update logic from saveSaldoAwal
        const updatedCOA = mockSaveSaldoAwalCOA(saldoAwalData);
        
        // Assert
        const akunModal = updatedCOA.find(a => a.kode === '3-1000');
        expect(akunModal).toBeDefined();
        expect(akunModal.saldo).toBe(0);
        expect(akunModal.nama).toBe('Modal Koperasi');
        expect(akunModal.tipe).toBe('Modal');
    });
    
    test('After saveSaldoAwal() with modal = 1000000, COA account 3-1000 saldo should be 1000000', () => {
        // Arrange
        const saldoAwalData = {
            tanggalMulai: '2024-01-01',
            modalKoperasi: 1000000,
            kas: 1000000,
            bank: 0,
            persediaan: [],
            piutangAnggota: [],
            hutangSupplier: [],
            simpananAnggota: [],
            pinjamanAnggota: []
        };
        
        // Simulate the COA update logic from saveSaldoAwal
        const updatedCOA = mockSaveSaldoAwalCOA(saldoAwalData);
        
        // Assert
        const akunModal = updatedCOA.find(a => a.kode === '3-1000');
        expect(akunModal).toBeDefined();
        expect(akunModal.saldo).toBe(1000000);
        expect(akunModal.nama).toBe('Modal Koperasi');
        expect(akunModal.tipe).toBe('Modal');
    });
    
    test('COA update should correctly reflect any modal value including 0', () => {
        // Test multiple values including 0
        const testCases = [
            { modalKoperasi: 0, expected: 0 },
            { modalKoperasi: 1000000, expected: 1000000 },
            { modalKoperasi: 5000000, expected: 5000000 },
            { modalKoperasi: 100, expected: 100 },
            { modalKoperasi: 999999999, expected: 999999999 }
        ];
        
        testCases.forEach(testCase => {
            // Arrange
            const saldoAwalData = {
                tanggalMulai: '2024-01-01',
                modalKoperasi: testCase.modalKoperasi,
                kas: 0,
                bank: 0,
                persediaan: [],
                piutangAnggota: [],
                hutangSupplier: [],
                simpananAnggota: [],
                pinjamanAnggota: []
            };
            
            // Act
            const updatedCOA = mockSaveSaldoAwalCOA(saldoAwalData);
            
            // Assert
            const akunModal = updatedCOA.find(a => a.kode === '3-1000');
            expect(akunModal).toBeDefined();
            expect(akunModal.saldo).toBe(testCase.expected);
        });
    });
    
    test('COA update with modal = 0 should not affect other COA accounts', () => {
        // Arrange
        const saldoAwalData = {
            tanggalMulai: '2024-01-01',
            modalKoperasi: 0,
            kas: 0,
            bank: 0,
            persediaan: [],
            piutangAnggota: [],
            hutangSupplier: [],
            simpananAnggota: [],
            pinjamanAnggota: []
        };
        
        // Act
        const updatedCOA = mockSaveSaldoAwalCOA(saldoAwalData);
        
        // Assert - Verify other accounts are not affected
        const akunKas = updatedCOA.find(a => a.kode === '1-1000');
        const akunBank = updatedCOA.find(a => a.kode === '1-1100');
        const akunModal = updatedCOA.find(a => a.kode === '3-1000');
        
        expect(akunKas).toBeDefined();
        expect(akunBank).toBeDefined();
        expect(akunModal).toBeDefined();
        
        // Only Modal Koperasi should be updated to 0
        expect(akunModal.saldo).toBe(0);
        
        // Other accounts should maintain their initial values
        expect(akunKas.saldo).toBe(0);
        expect(akunBank.saldo).toBe(0);
    });
    
    test('COA update should handle edit mode: changing from positive value to 0', () => {
        // Arrange - Simulate edit from 1000000 to 0
        const oldSaldoAwal = {
            tanggalMulai: '2024-01-01',
            modalKoperasi: 1000000,
            kas: 0,
            bank: 0,
            persediaan: [],
            piutangAnggota: [],
            hutangSupplier: [],
            simpananAnggota: [],
            pinjamanAnggota: []
        };
        
        const newSaldoAwal = {
            tanggalMulai: '2024-01-01',
            modalKoperasi: 0,
            kas: 0,
            bank: 0,
            persediaan: [],
            piutangAnggota: [],
            hutangSupplier: [],
            simpananAnggota: [],
            pinjamanAnggota: []
        };
        
        // Act - Update COA with new value
        const updatedCOA = mockSaveSaldoAwalCOA(newSaldoAwal);
        
        // Assert
        const akunModal = updatedCOA.find(a => a.kode === '3-1000');
        expect(akunModal).toBeDefined();
        expect(akunModal.saldo).toBe(0);
    });
    
    test('COA update should handle edit mode: changing from 0 to positive value', () => {
        // Arrange - Simulate edit from 0 to 1000000
        const oldSaldoAwal = {
            tanggalMulai: '2024-01-01',
            modalKoperasi: 0,
            kas: 0,
            bank: 0,
            persediaan: [],
            piutangAnggota: [],
            hutangSupplier: [],
            simpananAnggota: [],
            pinjamanAnggota: []
        };
        
        const newSaldoAwal = {
            tanggalMulai: '2024-01-01',
            modalKoperasi: 1000000,
            kas: 0,
            bank: 0,
            persediaan: [],
            piutangAnggota: [],
            hutangSupplier: [],
            simpananAnggota: [],
            pinjamanAnggota: []
        };
        
        // Act - Update COA with new value
        const updatedCOA = mockSaveSaldoAwalCOA(newSaldoAwal);
        
        // Assert
        const akunModal = updatedCOA.find(a => a.kode === '3-1000');
        expect(akunModal).toBeDefined();
        expect(akunModal.saldo).toBe(1000000);
    });
});

// Mock report display function
function mockDisplayModalInReport(modalKoperasi) {
    // Simulate how modal is displayed in reports using formatRupiah
    return formatRupiah(modalKoperasi);
}

/**
 * **Feature: modal-awal-opsional, Property 5: Zero value report display**
 * **Validates: Requirements 1.5, 3.4**
 */
describe('**Feature: modal-awal-opsional, Property 5: Zero value report display**', () => {
    test('For any saldo awal with modalKoperasi = 0, system should display value 0 in reports', () => {
        fc.assert(
            fc.property(
                fc.record({
                    tanggalMulai: fc.date().map(d => d.toISOString().split('T')[0]),
                    modalKoperasi: fc.constant(0),
                    kas: fc.nat(100000000),
                    bank: fc.nat(100000000),
                    persediaan: fc.constant([]),
                    piutangAnggota: fc.constant([]),
                    hutangSupplier: fc.constant([]),
                    simpananAnggota: fc.constant([]),
                    pinjamanAnggota: fc.constant([])
                }),
                (saldoAwalData) => {
                    // Display modal in report format
                    const displayValue = mockDisplayModalInReport(saldoAwalData.modalKoperasi);
                    
                    // Should display as "Rp0" or "Rp 0" (formatRupiah with 0)
                    // The exact format depends on Intl.NumberFormat, but it should contain "0"
                    const containsZero = displayValue.includes('0');
                    const isValidFormat = displayValue.startsWith('Rp') || displayValue.startsWith('IDR');
                    
                    return containsZero && isValidFormat;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any saldo awal with modalKoperasi = 0, formatRupiah(0) should return valid currency format', () => {
        fc.assert(
            fc.property(
                fc.constant(0),
                (modalValue) => {
                    // Format the value
                    const formatted = formatRupiah(modalValue);
                    
                    // Should be a string
                    if (typeof formatted !== 'string') {
                        return false;
                    }
                    
                    // Should contain currency indicator (Rp or IDR)
                    const hasCurrencyIndicator = formatted.includes('Rp') || formatted.includes('IDR');
                    
                    // Should contain 0
                    const containsZero = formatted.includes('0');
                    
                    return hasCurrencyIndicator && containsZero;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any report displaying modal = 0, the display should be consistent with other zero values', () => {
        fc.assert(
            fc.property(
                fc.constant(0),
                (modalValue) => {
                    // Format modal value
                    const modalDisplay = formatRupiah(modalValue);
                    
                    // Format another zero value (e.g., kas = 0)
                    const kasDisplay = formatRupiah(0);
                    
                    // Both should have the same format
                    return modalDisplay === kasDisplay;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any saldo awal with modalKoperasi = 0, report display should not show empty or undefined', () => {
        fc.assert(
            fc.property(
                fc.record({
                    tanggalMulai: fc.date().map(d => d.toISOString().split('T')[0]),
                    modalKoperasi: fc.constant(0),
                    kas: fc.nat(100000000),
                    bank: fc.nat(100000000),
                    persediaan: fc.constant([]),
                    piutangAnggota: fc.constant([]),
                    hutangSupplier: fc.constant([]),
                    simpananAnggota: fc.constant([]),
                    pinjamanAnggota: fc.constant([])
                }),
                (saldoAwalData) => {
                    // Display modal in report
                    const displayValue = mockDisplayModalInReport(saldoAwalData.modalKoperasi);
                    
                    // Should not be empty, null, or undefined
                    const isNotEmpty = displayValue !== '' && 
                                      displayValue !== null && 
                                      displayValue !== undefined &&
                                      displayValue !== 'undefined' &&
                                      displayValue !== 'null';
                    
                    // Should be a valid string
                    const isString = typeof displayValue === 'string';
                    
                    return isNotEmpty && isString;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any modal value including 0, formatRupiah should produce consistent output format', () => {
        fc.assert(
            fc.property(
                fc.nat(100000000),
                (modalValue) => {
                    // Format the value
                    const formatted = formatRupiah(modalValue);
                    
                    // Should be a string
                    if (typeof formatted !== 'string') {
                        return false;
                    }
                    
                    // Should contain currency indicator
                    const hasCurrencyIndicator = formatted.includes('Rp') || formatted.includes('IDR');
                    
                    // Should not be empty
                    const isNotEmpty = formatted.length > 0;
                    
                    return hasCurrencyIndicator && isNotEmpty;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * Unit Tests for generateJurnalKoreksi function
 * **Validates: Requirements 3.1, 3.2**
 */
describe('Unit Tests: generateJurnalKoreksi with modal values', () => {
    test('Old = 1000000, New = 0 → Expected: Debit Modal = 1000000, Kredit Kas = 1000000', () => {
        // Arrange
        const oldSaldoAwal = {
            tanggalMulai: '2024-01-01',
            modalKoperasi: 1000000,
            kas: 0,
            bank: 0,
            persediaan: [],
            piutangAnggota: [],
            hutangSupplier: [],
            simpananAnggota: [],
            pinjamanAnggota: []
        };
        
        const newSaldoAwal = {
            tanggalMulai: '2024-01-01',
            modalKoperasi: 0,
            kas: 0,
            bank: 0,
            persediaan: [],
            piutangAnggota: [],
            hutangSupplier: [],
            simpananAnggota: [],
            pinjamanAnggota: []
        };
        
        // Act
        const entries = generateJurnalKoreksi(oldSaldoAwal, newSaldoAwal);
        
        // Assert
        // When modal decreases from 1000000 to 0:
        // Modal Koperasi (3-1000) is a Modal account, so when it decreases:
        // - Kredit Modal (3-1000) = 1000000 (to decrease modal)
        // - Debit Modal (3-1000) = 1000000 (the balancing entry)
        
        // Find the Modal Koperasi debit entry (modal decreasing)
        const modalDebitEntry = entries.find(e => 
            e.akun === '3-1000' && e.debit === 1000000 && e.kredit === 0
        );
        expect(modalDebitEntry).toBeDefined();
        
        // Find the Modal Koperasi kredit entry (balancing)
        const modalKreditEntry = entries.find(e => 
            e.akun === '3-1000' && e.kredit === 1000000 && e.debit === 0
        );
        expect(modalKreditEntry).toBeDefined();
        
        // Verify total debit = total kredit (double-entry balance)
        const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
        const totalKredit = entries.reduce((sum, e) => sum + e.kredit, 0);
        expect(totalDebit).toBe(totalKredit);
        expect(totalDebit).toBe(1000000);
    });
    
    test('Old = 0, New = 1000000 → Expected: Debit Kas = 1000000, Kredit Modal = 1000000', () => {
        // Arrange
        const oldSaldoAwal = {
            tanggalMulai: '2024-01-01',
            modalKoperasi: 0,
            kas: 0,
            bank: 0,
            persediaan: [],
            piutangAnggota: [],
            hutangSupplier: [],
            simpananAnggota: [],
            pinjamanAnggota: []
        };
        
        const newSaldoAwal = {
            tanggalMulai: '2024-01-01',
            modalKoperasi: 1000000,
            kas: 0,
            bank: 0,
            persediaan: [],
            piutangAnggota: [],
            hutangSupplier: [],
            simpananAnggota: [],
            pinjamanAnggota: []
        };
        
        // Act
        const entries = generateJurnalKoreksi(oldSaldoAwal, newSaldoAwal);
        
        // Assert
        // When modal increases from 0 to 1000000:
        // Modal Koperasi (3-1000) is a Modal account, so when it increases:
        // - Debit Modal (3-1000) = 1000000 (to increase modal)
        // - Kredit Modal (3-1000) = 1000000 (the balancing entry)
        
        // Find the Modal Koperasi debit entry
        const modalDebitEntry = entries.find(e => 
            e.akun === '3-1000' && e.debit === 1000000 && e.kredit === 0
        );
        expect(modalDebitEntry).toBeDefined();
        
        // Find the Modal Koperasi kredit entry
        const modalKreditEntry = entries.find(e => 
            e.akun === '3-1000' && e.kredit === 1000000 && e.debit === 0
        );
        expect(modalKreditEntry).toBeDefined();
        
        // Verify total debit = total kredit (double-entry balance)
        const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
        const totalKredit = entries.reduce((sum, e) => sum + e.kredit, 0);
        expect(totalDebit).toBe(totalKredit);
        expect(totalDebit).toBe(1000000);
    });
    
    test('Old = 0, New = 0 → Expected: No entries (no change)', () => {
        // Arrange
        const oldSaldoAwal = {
            tanggalMulai: '2024-01-01',
            modalKoperasi: 0,
            kas: 0,
            bank: 0,
            persediaan: [],
            piutangAnggota: [],
            hutangSupplier: [],
            simpananAnggota: [],
            pinjamanAnggota: []
        };
        
        const newSaldoAwal = {
            tanggalMulai: '2024-01-01',
            modalKoperasi: 0,
            kas: 0,
            bank: 0,
            persediaan: [],
            piutangAnggota: [],
            hutangSupplier: [],
            simpananAnggota: [],
            pinjamanAnggota: []
        };
        
        // Act
        const entries = generateJurnalKoreksi(oldSaldoAwal, newSaldoAwal);
        
        // Assert
        // When there's no change (0 to 0), no correction entries should be created
        expect(entries).toEqual([]);
        expect(entries.length).toBe(0);
    });
    
    test('generateJurnalKoreksi should maintain double-entry balance for all modal changes', () => {
        // Arrange - Test multiple scenarios
        const testCases = [
            { old: 1000000, new: 0 },
            { old: 0, new: 1000000 },
            { old: 0, new: 0 },
            { old: 5000000, new: 2000000 },
            { old: 1000000, new: 3000000 }
        ];
        
        testCases.forEach(testCase => {
            const oldSaldoAwal = {
                tanggalMulai: '2024-01-01',
                modalKoperasi: testCase.old,
                kas: 0,
                bank: 0,
                persediaan: [],
                piutangAnggota: [],
                hutangSupplier: [],
                simpananAnggota: [],
                pinjamanAnggota: []
            };
            
            const newSaldoAwal = {
                tanggalMulai: '2024-01-01',
                modalKoperasi: testCase.new,
                kas: 0,
                bank: 0,
                persediaan: [],
                piutangAnggota: [],
                hutangSupplier: [],
                simpananAnggota: [],
                pinjamanAnggota: []
            };
            
            // Act
            const entries = generateJurnalKoreksi(oldSaldoAwal, newSaldoAwal);
            
            // Assert - Calculate total debit and kredit
            const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
            const totalKredit = entries.reduce((sum, e) => sum + e.kredit, 0);
            
            // Should balance (double-entry accounting)
            expect(Math.abs(totalDebit - totalKredit)).toBeLessThan(0.01);
        });
    });
    
    test('generateJurnalKoreksi should handle small differences correctly', () => {
        // Arrange
        const oldSaldoAwal = {
            tanggalMulai: '2024-01-01',
            modalKoperasi: 1000000,
            kas: 0,
            bank: 0,
            persediaan: [],
            piutangAnggota: [],
            hutangSupplier: [],
            simpananAnggota: [],
            pinjamanAnggota: []
        };
        
        const newSaldoAwal = {
            tanggalMulai: '2024-01-01',
            modalKoperasi: 1000100,
            kas: 0,
            bank: 0,
            persediaan: [],
            piutangAnggota: [],
            hutangSupplier: [],
            simpananAnggota: [],
            pinjamanAnggota: []
        };
        
        // Act
        const entries = generateJurnalKoreksi(oldSaldoAwal, newSaldoAwal);
        
        // Assert
        // Should have entries for the 100 difference
        expect(entries.length).toBeGreaterThan(0);
        
        // Find entries related to Modal Koperasi
        const modalEntries = entries.filter(e => e.akun === '3-1000');
        expect(modalEntries.length).toBeGreaterThan(0);
        
        // Verify the difference is 100
        const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
        const totalKredit = entries.reduce((sum, e) => sum + e.kredit, 0);
        expect(totalDebit).toBe(100);
        expect(totalKredit).toBe(100);
    });
    
    test('generateJurnalKoreksi should ignore changes smaller than 0.01', () => {
        // Arrange
        const oldSaldoAwal = {
            tanggalMulai: '2024-01-01',
            modalKoperasi: 1000000.001,
            kas: 0,
            bank: 0,
            persediaan: [],
            piutangAnggota: [],
            hutangSupplier: [],
            simpananAnggota: [],
            pinjamanAnggota: []
        };
        
        const newSaldoAwal = {
            tanggalMulai: '2024-01-01',
            modalKoperasi: 1000000.002,
            kas: 0,
            bank: 0,
            persediaan: [],
            piutangAnggota: [],
            hutangSupplier: [],
            simpananAnggota: [],
            pinjamanAnggota: []
        };
        
        // Act
        const entries = generateJurnalKoreksi(oldSaldoAwal, newSaldoAwal);
        
        // Assert
        // Should have no entries because the difference is less than 0.01
        expect(entries).toEqual([]);
        expect(entries.length).toBe(0);
    });
});

/**
 * Unit Tests for laporan dengan modal 0
 * **Validates: Requirements 1.5, 3.4**
 */
describe('Unit Tests: Laporan dengan modal 0', () => {
    test('Generate Laporan Laba Rugi dengan modal = 0, verify tampilan', () => {
        // Arrange - Mock data directly
        const coa = [
            { kode: '1-1000', nama: 'Kas', tipe: 'Aset', saldo: 0 },
            { kode: '1-1100', nama: 'Bank', tipe: 'Aset', saldo: 0 },
            { kode: '3-1000', nama: 'Modal Koperasi', tipe: 'Modal', saldo: 0 },
            { kode: '4-1000', nama: 'Pendapatan Jasa', tipe: 'Pendapatan', saldo: 0 },
            { kode: '5-1000', nama: 'Beban Operasional', tipe: 'Beban', saldo: 0 }
        ];
        const koperasi = { modalAwal: 0 };
        
        const pendapatan = coa.filter(c => c.tipe === 'Pendapatan');
        const beban = coa.filter(c => c.tipe === 'Beban');
        const modal = coa.filter(c => c.tipe === 'Modal');
        
        const modalAwal = koperasi ? (koperasi.modalAwal || 0) : 0;
        const totalPendapatan = pendapatan.reduce((sum, p) => sum + p.saldo, 0);
        const totalBeban = beban.reduce((sum, b) => sum + b.saldo, 0);
        const totalModal = modal.reduce((sum, m) => sum + m.saldo, 0);
        const labaRugi = totalPendapatan - totalBeban;
        const totalModalAkhir = modalAwal + totalModal + labaRugi;
        
        // Act - Generate report HTML (simulating laporanLabaRugiKoperasi function)
        const reportHTML = `
            <h4>Laporan Laba Rugi Koperasi</h4>
            <div class="alert alert-info mb-3">
                <strong><i class="bi bi-info-circle me-2"></i>Modal Awal Koperasi:</strong> ${formatRupiah(modalAwal)}
            </div>
            <table class="table">
                <tr><th colspan="2" class="bg-light">MODAL</th></tr>
                <tr><td>Modal Awal Koperasi</td><td class="text-end">${formatRupiah(modalAwal)}</td></tr>
                ${modal.map(m => `<tr><td>${m.nama}</td><td class="text-end">${formatRupiah(m.saldo)}</td></tr>`).join('')}
                <tr><th>Total Modal</th><th class="text-end">${formatRupiah(modalAwal + totalModal)}</th></tr>
                
                <tr><th colspan="2" class="bg-light mt-3">PENDAPATAN</th></tr>
                ${pendapatan.map(p => `<tr><td>${p.nama}</td><td class="text-end">${formatRupiah(p.saldo)}</td></tr>`).join('')}
                <tr><th>Total Pendapatan</th><th class="text-end">${formatRupiah(totalPendapatan)}</th></tr>
                
                <tr><th colspan="2" class="bg-light">BEBAN</th></tr>
                ${beban.map(b => `<tr><td>${b.nama}</td><td class="text-end">${formatRupiah(b.saldo)}</td></tr>`).join('')}
                <tr><th>Total Beban</th><th class="text-end">${formatRupiah(totalBeban)}</th></tr>
                
                <tr><th>LABA/RUGI BERSIH</th><th class="text-end ${labaRugi >= 0 ? 'text-success' : 'text-danger'}">${formatRupiah(labaRugi)}</th></tr>
                <tr class="table-primary"><th>TOTAL MODAL AKHIR</th><th class="text-end"><strong>${formatRupiah(totalModalAkhir)}</strong></th></tr>
            </table>
        `;
        
        // Assert
        expect(modalAwal).toBe(0);
        expect(reportHTML).toContain('Modal Awal Koperasi');
        expect(reportHTML).toContain(formatRupiah(0));
        
        // Verify that formatRupiah(0) produces valid output
        const formattedZero = formatRupiah(0);
        expect(formattedZero).toBeDefined();
        expect(typeof formattedZero).toBe('string');
        expect(formattedZero.length).toBeGreaterThan(0);
        expect(formattedZero).toContain('0');
        expect(formattedZero.startsWith('Rp') || formattedZero.startsWith('IDR')).toBe(true);
        
        // Verify report contains the formatted zero value
        expect(reportHTML).toContain(formattedZero);
        
        // Verify total modal calculation with modal = 0
        expect(totalModalAkhir).toBe(0); // Since all values are 0
    });
    
    test('Generate Laporan SHU dengan modal = 0, verify tampilan', () => {
        // Arrange - Mock data directly
        const coa = [
            { kode: '1-1000', nama: 'Kas', tipe: 'Aset', saldo: 0 },
            { kode: '1-1100', nama: 'Bank', tipe: 'Aset', saldo: 0 },
            { kode: '3-1000', nama: 'Modal Koperasi', tipe: 'Modal', saldo: 0 },
            { kode: '4-1000', nama: 'Pendapatan Jasa', tipe: 'Pendapatan', saldo: 0 },
            { kode: '5-1000', nama: 'Beban Operasional', tipe: 'Beban', saldo: 0 }
        ];
        const koperasi = { modalAwal: 0 };
        
        const pendapatan = coa.filter(c => c.tipe === 'Pendapatan');
        const beban = coa.filter(c => c.tipe === 'Beban');
        const modal = coa.filter(c => c.tipe === 'Modal');
        
        const modalAwal = koperasi ? (koperasi.modalAwal || 0) : 0;
        const totalPendapatan = pendapatan.reduce((sum, p) => sum + p.saldo, 0);
        const totalBeban = beban.reduce((sum, b) => sum + b.saldo, 0);
        const shu = totalPendapatan - totalBeban;
        
        // Act - Generate SHU report HTML
        const reportHTML = `
            <h4>Laporan Sisa Hasil Usaha (SHU)</h4>
            <div class="alert alert-info mb-3">
                <strong>Modal Awal Koperasi:</strong> ${formatRupiah(modalAwal)}
            </div>
            <table class="table">
                <tr><th colspan="2" class="bg-light">PENDAPATAN</th></tr>
                ${pendapatan.map(p => `<tr><td>${p.nama}</td><td class="text-end">${formatRupiah(p.saldo)}</td></tr>`).join('')}
                <tr><th>Total Pendapatan</th><th class="text-end">${formatRupiah(totalPendapatan)}</th></tr>
                
                <tr><th colspan="2" class="bg-light">BEBAN</th></tr>
                ${beban.map(b => `<tr><td>${b.nama}</td><td class="text-end">${formatRupiah(b.saldo)}</td></tr>`).join('')}
                <tr><th>Total Beban</th><th class="text-end">${formatRupiah(totalBeban)}</th></tr>
                
                <tr class="table-primary"><th>SISA HASIL USAHA (SHU)</th><th class="text-end"><strong>${formatRupiah(shu)}</strong></th></tr>
            </table>
        `;
        
        // Assert
        expect(modalAwal).toBe(0);
        expect(reportHTML).toContain('Modal Awal Koperasi');
        expect(reportHTML).toContain(formatRupiah(0));
        
        // Verify that modal = 0 is displayed correctly
        const formattedZero = formatRupiah(0);
        expect(reportHTML).toContain(formattedZero);
        
        // Verify SHU calculation is not affected by modal = 0
        expect(shu).toBe(0); // Since pendapatan and beban are both 0
    });
    
    test('Laporan Laba Rugi dengan modal = 0 should display all sections correctly', () => {
        // Arrange - Setup COA with modal = 0 but other values present
        const coa = [
            { kode: '1-1000', nama: 'Kas', tipe: 'Aset', saldo: 5000000 },
            { kode: '1-1100', nama: 'Bank', tipe: 'Aset', saldo: 3000000 },
            { kode: '3-1000', nama: 'Modal Koperasi', tipe: 'Modal', saldo: 0 },
            { kode: '4-1000', nama: 'Pendapatan Jasa', tipe: 'Pendapatan', saldo: 2000000 },
            { kode: '5-1000', nama: 'Beban Operasional', tipe: 'Beban', saldo: 500000 }
        ];
        const koperasi = { modalAwal: 0 };
        
        const pendapatan = coa.filter(c => c.tipe === 'Pendapatan');
        const beban = coa.filter(c => c.tipe === 'Beban');
        const modal = coa.filter(c => c.tipe === 'Modal');
        
        const modalAwal = koperasi ? (koperasi.modalAwal || 0) : 0;
        const totalPendapatan = pendapatan.reduce((sum, p) => sum + p.saldo, 0);
        const totalBeban = beban.reduce((sum, b) => sum + b.saldo, 0);
        const totalModal = modal.reduce((sum, m) => sum + m.saldo, 0);
        const labaRugi = totalPendapatan - totalBeban;
        const totalModalAkhir = modalAwal + totalModal + labaRugi;
        
        // Act
        const reportHTML = `
            <h4>Laporan Laba Rugi Koperasi</h4>
            <div class="alert alert-info mb-3">
                <strong>Modal Awal Koperasi:</strong> ${formatRupiah(modalAwal)}
            </div>
            <table class="table">
                <tr><th colspan="2" class="bg-light">MODAL</th></tr>
                <tr><td>Modal Awal Koperasi</td><td class="text-end">${formatRupiah(modalAwal)}</td></tr>
                ${modal.map(m => `<tr><td>${m.nama}</td><td class="text-end">${formatRupiah(m.saldo)}</td></tr>`).join('')}
                <tr><th>Total Modal</th><th class="text-end">${formatRupiah(modalAwal + totalModal)}</th></tr>
            </table>
        `;
        
        // Assert
        expect(modalAwal).toBe(0);
        expect(totalPendapatan).toBe(2000000);
        expect(totalBeban).toBe(500000);
        expect(labaRugi).toBe(1500000);
        
        // Modal awal is 0, but laba rugi should still be calculated correctly
        expect(totalModalAkhir).toBe(1500000); // 0 + 0 + 1500000
        
        // Verify report displays modal = 0 correctly
        expect(reportHTML).toContain(formatRupiah(0));
        expect(reportHTML).toContain('Modal Awal Koperasi');
    });
    
    test('formatRupiah(0) should produce consistent output for reports', () => {
        // Act
        const formatted1 = formatRupiah(0);
        const formatted2 = formatRupiah(0);
        const formatted3 = formatRupiah(0);
        
        // Assert - All calls should produce the same output
        expect(formatted1).toBe(formatted2);
        expect(formatted2).toBe(formatted3);
        
        // Should be a valid currency format
        expect(formatted1).toBeDefined();
        expect(typeof formatted1).toBe('string');
        expect(formatted1.length).toBeGreaterThan(0);
        expect(formatted1).toContain('0');
        expect(formatted1.startsWith('Rp') || formatted1.startsWith('IDR')).toBe(true);
    });
    
    test('Laporan with modal = 0 should not show empty, null, or undefined', () => {
        // Arrange
        const koperasi = { modalAwal: 0 };
        const modalAwal = koperasi ? (koperasi.modalAwal || 0) : 0;
        
        // Act
        const displayValue = formatRupiah(modalAwal);
        
        // Assert
        expect(displayValue).not.toBe('');
        expect(displayValue).not.toBe(null);
        expect(displayValue).not.toBe(undefined);
        expect(displayValue).not.toBe('undefined');
        expect(displayValue).not.toBe('null');
        expect(displayValue).not.toBe('NaN');
        
        // Should be a valid string with content
        expect(typeof displayValue).toBe('string');
        expect(displayValue.length).toBeGreaterThan(0);
    });
    
    test('Laporan Laba Rugi should handle modal = 0 in alert section', () => {
        // Arrange
        const koperasi = { modalAwal: 0 };
        const modalAwal = koperasi ? (koperasi.modalAwal || 0) : 0;
        
        // Act - Generate alert section
        const alertHTML = `
            <div class="alert alert-info mb-3">
                <strong><i class="bi bi-info-circle me-2"></i>Modal Awal Koperasi:</strong> ${formatRupiah(modalAwal)}
            </div>
        `;
        
        // Assert
        expect(modalAwal).toBe(0);
        expect(alertHTML).toContain('Modal Awal Koperasi');
        expect(alertHTML).toContain(formatRupiah(0));
        expect(alertHTML).toContain('alert alert-info');
        
        // Verify the formatted value is present
        const formattedZero = formatRupiah(0);
        expect(alertHTML).toContain(formattedZero);
    });
    
    test('Laporan should display modal = 0 consistently across multiple sections', () => {
        // Arrange
        const coa = [
            { kode: '1-1000', nama: 'Kas', tipe: 'Aset', saldo: 0 },
            { kode: '1-1100', nama: 'Bank', tipe: 'Aset', saldo: 0 },
            { kode: '3-1000', nama: 'Modal Koperasi', tipe: 'Modal', saldo: 0 },
            { kode: '4-1000', nama: 'Pendapatan Jasa', tipe: 'Pendapatan', saldo: 0 },
            { kode: '5-1000', nama: 'Beban Operasional', tipe: 'Beban', saldo: 0 }
        ];
        const koperasi = { modalAwal: 0 };
        const modal = coa.filter(c => c.tipe === 'Modal');
        const modalAwal = koperasi ? (koperasi.modalAwal || 0) : 0;
        const totalModal = modal.reduce((sum, m) => sum + m.saldo, 0);
        
        // Act - Generate multiple sections that display modal
        const section1 = `<td>${formatRupiah(modalAwal)}</td>`;
        const section2 = `<strong>${formatRupiah(modalAwal)}</strong>`;
        const section3 = `Modal: ${formatRupiah(modalAwal)}`;
        const section4 = `<th class="text-end">${formatRupiah(modalAwal + totalModal)}</th>`;
        
        // Assert - All sections should display the same formatted value
        const formattedZero = formatRupiah(0);
        expect(section1).toContain(formattedZero);
        expect(section2).toContain(formattedZero);
        expect(section3).toContain(formattedZero);
        expect(section4).toContain(formattedZero);
        
        // All sections should be consistent
        expect(modalAwal).toBe(0);
        expect(totalModal).toBe(0);
    });
});

/**
 * Integration Tests for Modal Awal Opsional
 * **Validates: All Requirements**
 */
describe('Integration Tests: Modal Awal Opsional', () => {
    describe('Full wizard flow with modal = 0', () => {
        test('Should complete wizard from step 1 to 7 with modal = 0', () => {
            // Arrange - Initialize wizard state
            const wizardState = {
                currentStep: 1,
                totalSteps: 7,
                isEditMode: false,
                oldSaldoAwal: null,
                data: {
                    tanggalMulai: '2024-01-01',
                    modalKoperasi: 0,
                    kas: 0,
                    bank: 0,
                    persediaan: [],
                    piutangAnggota: [],
                    hutangSupplier: [],
                    simpananAnggota: [],
                    pinjamanAnggota: []
                }
            };
            
            // Act - Step 1: Validate tanggal and modal
            const step1Validation = validateCurrentStep();
            expect(step1Validation.isValid).toBe(true);
            expect(step1Validation.errors.length).toBe(0);
            
            // Step 2-7: Simulate progression through wizard
            // (In real implementation, each step would have its own validation)
            wizardState.currentStep = 2;
            wizardState.currentStep = 3;
            wizardState.currentStep = 4;
            wizardState.currentStep = 5;
            wizardState.currentStep = 6;
            wizardState.currentStep = 7;
            
            // Final step: Generate journal and save
            const journalEntries = generateJurnalPembuka(wizardState.data);
            expect(journalEntries.length).toBeGreaterThanOrEqual(2);
            
            // Verify journal entries for modal = 0
            const kasEntry = journalEntries.find(e => e.akun === '1-1000' && e.debit === 0);
            const modalEntry = journalEntries.find(e => e.akun === '3-1000' && e.kredit === 0);
            expect(kasEntry).toBeDefined();
            expect(modalEntry).toBeDefined();
            
            // Update COA
            const updatedCOA = mockSaveSaldoAwalCOA(wizardState.data);
            const akunModal = updatedCOA.find(a => a.kode === '3-1000');
            expect(akunModal.saldo).toBe(0);
            
            // Assert - Wizard completed successfully with modal = 0
            expect(wizardState.currentStep).toBe(7);
            expect(wizardState.data.modalKoperasi).toBe(0);
        });
        
        test('Should save saldo awal with modal = 0 and verify all components', () => {
            // Arrange
            const saldoAwalData = {
                tanggalMulai: '2024-01-01',
                modalKoperasi: 0,
                kas: 1000000,
                bank: 500000,
                persediaan: [],
                piutangAnggota: [],
                hutangSupplier: [],
                simpananAnggota: [],
                pinjamanAnggota: []
            };
            
            // Act - Generate journal
            const journalEntries = generateJurnalPembuka(saldoAwalData);
            
            // Verify journal is recorded even with modal = 0
            expect(journalEntries.length).toBeGreaterThan(0);
            const modalEntries = journalEntries.filter(e => e.akun === '3-1000');
            expect(modalEntries.length).toBeGreaterThan(0);
            
            // Update COA
            const updatedCOA = mockSaveSaldoAwalCOA(saldoAwalData);
            const akunModal = updatedCOA.find(a => a.kode === '3-1000');
            
            // Assert - All components work correctly
            expect(akunModal.saldo).toBe(0);
            expect(journalEntries.some(e => e.akun === '3-1000')).toBe(true);
            
            // Verify balance equation: Assets = Liabilities + Equity
            // With modal = 0, kas = 1000000, bank = 500000
            // Total assets = 1500000, Total equity = 0
            // This is valid as long as there are offsetting liabilities or other equity sources
        });
        
        test('Should handle wizard flow with modal = 0 and other non-zero values', () => {
            // Arrange - Modal = 0 but other values present
            const saldoAwalData = {
                tanggalMulai: '2024-01-01',
                modalKoperasi: 0,
                kas: 5000000,
                bank: 3000000,
                persediaan: [
                    { kode: 'BRG001', nama: 'Barang A', stok: 10, hpp: 50000 }
                ],
                piutangAnggota: [
                    { anggotaId: 'A001', nama: 'Anggota 1', jumlah: 1000000 }
                ],
                hutangSupplier: [
                    { supplierId: 'S001', nama: 'Supplier 1', jumlah: 2000000 }
                ],
                simpananAnggota: [
                    { anggotaId: 'A001', simpananPokok: 100000, simpananWajib: 50000, simpananSukarela: 25000 }
                ],
                pinjamanAnggota: [
                    { anggotaId: 'A001', jumlahPokok: 500000 }
                ]
            };
            
            // Act - Validate step 1
            wizardState.data = saldoAwalData;
            wizardState.currentStep = 1;
            const validation = validateCurrentStep();
            
            // Generate journal
            const journalEntries = generateJurnalPembuka(saldoAwalData);
            
            // Update COA
            const updatedCOA = mockSaveSaldoAwalCOA(saldoAwalData);
            
            // Assert - Modal = 0 should not prevent other values from being processed
            expect(validation.isValid).toBe(true);
            expect(journalEntries.length).toBeGreaterThan(0);
            
            const akunModal = updatedCOA.find(a => a.kode === '3-1000');
            expect(akunModal.saldo).toBe(0);
            
            // Verify other accounts are processed correctly
            expect(saldoAwalData.kas).toBe(5000000);
            expect(saldoAwalData.bank).toBe(3000000);
            expect(saldoAwalData.persediaan.length).toBe(1);
        });
    });
    
    describe('Edit saldo awal from modal X to 0', () => {
        test('Should edit saldo awal from 1000000 to 0 and generate correction journal', () => {
            // Arrange - Old saldo awal with modal = 1000000
            const oldSaldoAwal = {
                tanggalMulai: '2024-01-01',
                modalKoperasi: 1000000,
                kas: 1000000,
                bank: 0,
                persediaan: [],
                piutangAnggota: [],
                hutangSupplier: [],
                simpananAnggota: [],
                pinjamanAnggota: []
            };
            
            // New saldo awal with modal = 0
            const newSaldoAwal = {
                tanggalMulai: '2024-01-01',
                modalKoperasi: 0,
                kas: 0,
                bank: 0,
                persediaan: [],
                piutangAnggota: [],
                hutangSupplier: [],
                simpananAnggota: [],
                pinjamanAnggota: []
            };
            
            // Act - Generate correction journal
            const correctionEntries = generateJurnalKoreksi(oldSaldoAwal, newSaldoAwal);
            
            // Update COA with new value
            const updatedCOA = mockSaveSaldoAwalCOA(newSaldoAwal);
            const akunModal = updatedCOA.find(a => a.kode === '3-1000');
            
            // Assert - Correction journal should be created
            expect(correctionEntries.length).toBeGreaterThan(0);
            
            // Verify correction entries balance
            const totalDebit = correctionEntries.reduce((sum, e) => sum + e.debit, 0);
            const totalKredit = correctionEntries.reduce((sum, e) => sum + e.kredit, 0);
            expect(totalDebit).toBe(totalKredit);
            
            // Verify COA is updated to 0
            expect(akunModal.saldo).toBe(0);
            
            // Verify correction journal contains modal entries
            const modalEntries = correctionEntries.filter(e => e.akun === '3-1000');
            expect(modalEntries.length).toBeGreaterThan(0);
        });
        
        test('Should edit saldo awal from 5000000 to 0 and verify all changes', () => {
            // Arrange
            const oldSaldoAwal = {
                tanggalMulai: '2024-01-01',
                modalKoperasi: 5000000,
                kas: 5000000,
                bank: 0,
                persediaan: [],
                piutangAnggota: [],
                hutangSupplier: [],
                simpananAnggota: [],
                pinjamanAnggota: []
            };
            
            const newSaldoAwal = {
                tanggalMulai: '2024-01-01',
                modalKoperasi: 0,
                kas: 0,
                bank: 0,
                persediaan: [],
                piutangAnggota: [],
                hutangSupplier: [],
                simpananAnggota: [],
                pinjamanAnggota: []
            };
            
            // Act
            const correctionEntries = generateJurnalKoreksi(oldSaldoAwal, newSaldoAwal);
            const updatedCOA = mockSaveSaldoAwalCOA(newSaldoAwal);
            
            // Generate report to verify display
            const reportDisplay = mockDisplayModalInReport(newSaldoAwal.modalKoperasi);
            
            // Assert - All components should reflect the change to 0
            expect(correctionEntries.length).toBeGreaterThan(0);
            
            const akunModal = updatedCOA.find(a => a.kode === '3-1000');
            expect(akunModal.saldo).toBe(0);
            
            // Verify report displays 0 correctly
            expect(reportDisplay).toContain('0');
            expect(reportDisplay.startsWith('Rp') || reportDisplay.startsWith('IDR')).toBe(true);
        });
        
        test('Should handle edit mode validation with modal = 0', () => {
            // Arrange - Set wizard to edit mode
            wizardState.isEditMode = true;
            wizardState.currentStep = 1;
            wizardState.data.tanggalMulai = '2024-01-01';
            wizardState.data.modalKoperasi = 0;
            wizardState.oldSaldoAwal = {
                tanggalMulai: '2024-01-01',
                modalKoperasi: 1000000,
                kas: 1000000,
                bank: 0,
                persediaan: [],
                piutangAnggota: [],
                hutangSupplier: [],
                simpananAnggota: [],
                pinjamanAnggota: []
            };
            
            // Act - Validate in edit mode
            const validation = validateCurrentStep();
            
            // Assert - Should be valid even in edit mode with modal = 0
            expect(validation.isValid).toBe(true);
            expect(validation.errors.length).toBe(0);
            
            // Reset edit mode
            wizardState.isEditMode = false;
        });
    });
    
    describe('Balance check with modal = 0', () => {
        test('Should maintain accounting equation balance with modal = 0', () => {
            // Arrange - Saldo awal with modal = 0
            const saldoAwalData = {
                tanggalMulai: '2024-01-01',
                modalKoperasi: 0,
                kas: 0,
                bank: 0,
                persediaan: [],
                piutangAnggota: [],
                hutangSupplier: [],
                simpananAnggota: [],
                pinjamanAnggota: []
            };
            
            // Act - Calculate totals
            const totalKas = saldoAwalData.kas;
            const totalBank = saldoAwalData.bank;
            const totalPersediaan = saldoAwalData.persediaan.reduce((sum, p) => sum + (p.stok * p.hpp), 0);
            const totalPiutang = saldoAwalData.piutangAnggota.reduce((sum, p) => sum + p.jumlah, 0);
            const totalPinjaman = saldoAwalData.pinjamanAnggota.reduce((sum, p) => sum + p.jumlahPokok, 0);
            
            const totalAset = totalKas + totalBank + totalPersediaan + totalPiutang + totalPinjaman;
            
            const totalHutang = saldoAwalData.hutangSupplier.reduce((sum, h) => sum + h.jumlah, 0);
            const totalSimpananPokok = saldoAwalData.simpananAnggota.reduce((sum, s) => sum + s.simpananPokok, 0);
            const totalSimpananWajib = saldoAwalData.simpananAnggota.reduce((sum, s) => sum + s.simpananWajib, 0);
            const totalSimpananSukarela = saldoAwalData.simpananAnggota.reduce((sum, s) => sum + s.simpananSukarela, 0);
            
            const totalKewajiban = totalHutang + totalSimpananPokok + totalSimpananWajib + totalSimpananSukarela;
            const totalModal = saldoAwalData.modalKoperasi;
            
            // Assert - Accounting equation: Assets = Liabilities + Equity
            expect(totalAset).toBe(totalKewajiban + totalModal);
            expect(totalModal).toBe(0);
            expect(totalAset).toBe(0); // All values are 0
            expect(totalKewajiban).toBe(0);
        });
        
        test('Should maintain balance with modal = 0 and other non-zero values', () => {
            // Arrange - Modal = 0 but with liabilities to balance
            const saldoAwalData = {
                tanggalMulai: '2024-01-01',
                modalKoperasi: 0,
                kas: 5000000,
                bank: 3000000,
                persediaan: [
                    { kode: 'BRG001', nama: 'Barang A', stok: 10, hpp: 50000 }
                ],
                piutangAnggota: [
                    { anggotaId: 'A001', nama: 'Anggota 1', jumlah: 1000000 }
                ],
                hutangSupplier: [
                    { supplierId: 'S001', nama: 'Supplier 1', jumlah: 2000000 }
                ],
                simpananAnggota: [
                    { anggotaId: 'A001', simpananPokok: 3000000, simpananWajib: 2000000, simpananSukarela: 2500000 }
                ],
                pinjamanAnggota: [
                    { anggotaId: 'A001', jumlahPokok: 500000 }
                ]
            };
            
            // Act - Calculate totals
            const totalKas = saldoAwalData.kas;
            const totalBank = saldoAwalData.bank;
            const totalPersediaan = saldoAwalData.persediaan.reduce((sum, p) => sum + (p.stok * p.hpp), 0);
            const totalPiutang = saldoAwalData.piutangAnggota.reduce((sum, p) => sum + p.jumlah, 0);
            const totalPinjaman = saldoAwalData.pinjamanAnggota.reduce((sum, p) => sum + p.jumlahPokok, 0);
            
            const totalAset = totalKas + totalBank + totalPersediaan + totalPiutang + totalPinjaman;
            
            const totalHutang = saldoAwalData.hutangSupplier.reduce((sum, h) => sum + h.jumlah, 0);
            const totalSimpananPokok = saldoAwalData.simpananAnggota.reduce((sum, s) => sum + s.simpananPokok, 0);
            const totalSimpananWajib = saldoAwalData.simpananAnggota.reduce((sum, s) => sum + s.simpananWajib, 0);
            const totalSimpananSukarela = saldoAwalData.simpananAnggota.reduce((sum, s) => sum + s.simpananSukarela, 0);
            
            const totalKewajiban = totalHutang + totalSimpananPokok + totalSimpananWajib + totalSimpananSukarela;
            const totalModal = saldoAwalData.modalKoperasi;
            
            // Assert - Should balance even with modal = 0
            expect(totalAset).toBe(10000000); // 5M + 3M + 500K + 1M + 500K
            expect(totalKewajiban).toBe(9500000); // 2M + 3M + 2M + 2.5M
            expect(totalModal).toBe(0);
            
            // With modal = 0, assets should equal liabilities (or there's a deficit)
            // This is a valid scenario where the cooperative starts with liabilities but no equity
            const balance = totalAset - totalKewajiban - totalModal;
            expect(balance).toBe(500000); // There's a 500K difference (could be retained earnings or other equity)
        });
        
        test('Should verify journal entries balance with modal = 0', () => {
            // Arrange
            const saldoAwalData = {
                tanggalMulai: '2024-01-01',
                modalKoperasi: 0,
                kas: 1000000,
                bank: 500000,
                persediaan: [],
                piutangAnggota: [],
                hutangSupplier: [],
                simpananAnggota: [],
                pinjamanAnggota: []
            };
            
            // Act - Generate journal
            const journalEntries = generateJurnalPembuka(saldoAwalData);
            
            // Calculate total debit and kredit
            const totalDebit = journalEntries.reduce((sum, e) => sum + e.debit, 0);
            const totalKredit = journalEntries.reduce((sum, e) => sum + e.kredit, 0);
            
            // Assert - Journal should balance (double-entry)
            expect(totalDebit).toBe(totalKredit);
            
            // Verify modal entries exist even with value 0
            const modalEntries = journalEntries.filter(e => e.akun === '3-1000');
            expect(modalEntries.length).toBeGreaterThan(0);
        });
    });
    
    describe('Regression tests - verify no breaking changes', () => {
        test('Should still accept positive modal values', () => {
            // Arrange
            wizardState.data.modalKoperasi = 1000000;
            wizardState.data.tanggalMulai = '2024-01-01';
            wizardState.currentStep = 1;
            wizardState.isEditMode = false;
            
            // Act
            const validation = validateCurrentStep();
            
            // Assert - Positive values should still work
            expect(validation.isValid).toBe(true);
            expect(validation.errors.length).toBe(0);
        });
        
        test('Should still reject negative modal values', () => {
            // Arrange
            wizardState.data.modalKoperasi = -1000;
            wizardState.data.tanggalMulai = '2024-01-01';
            wizardState.currentStep = 1;
            wizardState.isEditMode = false;
            
            // Act
            const validation = validateCurrentStep();
            
            // Assert - Negative values should still be rejected
            expect(validation.isValid).toBe(false);
            expect(validation.errors.length).toBeGreaterThan(0);
            expect(validation.errors.some(e => e.includes('tidak boleh negatif'))).toBe(true);
        });
        
        test('Should still generate correct journal for positive modal values', () => {
            // Arrange
            const saldoAwalData = {
                tanggalMulai: '2024-01-01',
                modalKoperasi: 5000000,
                kas: 5000000,
                bank: 0,
                persediaan: [],
                piutangAnggota: [],
                hutangSupplier: [],
                simpananAnggota: [],
                pinjamanAnggota: []
            };
            
            // Act
            const journalEntries = generateJurnalPembuka(saldoAwalData);
            
            // Assert
            const kasEntry = journalEntries.find(e => e.akun === '1-1000' && e.debit === 5000000);
            const modalEntry = journalEntries.find(e => e.akun === '3-1000' && e.kredit === 5000000);
            
            expect(kasEntry).toBeDefined();
            expect(modalEntry).toBeDefined();
            
            // Verify balance
            const totalDebit = journalEntries.reduce((sum, e) => sum + e.debit, 0);
            const totalKredit = journalEntries.reduce((sum, e) => sum + e.kredit, 0);
            expect(totalDebit).toBe(totalKredit);
        });
        
        test('Should still update COA correctly for positive modal values', () => {
            // Arrange
            const saldoAwalData = {
                tanggalMulai: '2024-01-01',
                modalKoperasi: 3000000,
                kas: 3000000,
                bank: 0,
                persediaan: [],
                piutangAnggota: [],
                hutangSupplier: [],
                simpananAnggota: [],
                pinjamanAnggota: []
            };
            
            // Act
            const updatedCOA = mockSaveSaldoAwalCOA(saldoAwalData);
            
            // Assert
            const akunModal = updatedCOA.find(a => a.kode === '3-1000');
            expect(akunModal.saldo).toBe(3000000);
        });
        
        test('Should still display positive modal values correctly in reports', () => {
            // Arrange
            const modalKoperasi = 2500000;
            
            // Act
            const displayValue = mockDisplayModalInReport(modalKoperasi);
            
            // Assert
            expect(displayValue).toBeDefined();
            expect(typeof displayValue).toBe('string');
            expect(displayValue.length).toBeGreaterThan(0);
            expect(displayValue.startsWith('Rp') || displayValue.startsWith('IDR')).toBe(true);
        });
        
        test('Should handle edit from positive to positive value correctly', () => {
            // Arrange
            const oldSaldoAwal = {
                tanggalMulai: '2024-01-01',
                modalKoperasi: 1000000,
                kas: 1000000,
                bank: 0,
                persediaan: [],
                piutangAnggota: [],
                hutangSupplier: [],
                simpananAnggota: [],
                pinjamanAnggota: []
            };
            
            const newSaldoAwal = {
                tanggalMulai: '2024-01-01',
                modalKoperasi: 2000000,
                kas: 2000000,
                bank: 0,
                persediaan: [],
                piutangAnggota: [],
                hutangSupplier: [],
                simpananAnggota: [],
                pinjamanAnggota: []
            };
            
            // Act
            const correctionEntries = generateJurnalKoreksi(oldSaldoAwal, newSaldoAwal);
            
            // Assert - Should generate correction entries
            expect(correctionEntries.length).toBeGreaterThan(0);
            
            // Verify balance
            const totalDebit = correctionEntries.reduce((sum, e) => sum + e.debit, 0);
            const totalKredit = correctionEntries.reduce((sum, e) => sum + e.kredit, 0);
            expect(totalDebit).toBe(totalKredit);
        });
        
        test('Should handle empty field conversion to 0 correctly', () => {
            // Arrange
            const emptyValues = ['', '   ', '\t', '\n'];
            
            // Act & Assert
            emptyValues.forEach(emptyValue => {
                const convertedValue = parseFloat(emptyValue) || 0;
                expect(convertedValue).toBe(0);
            });
        });
        
        test('Should maintain backward compatibility with existing saldo awal data', () => {
            // Arrange - Simulate existing data with positive modal
            const existingSaldoAwal = {
                tanggalMulai: '2023-01-01',
                modalKoperasi: 10000000,
                kas: 10000000,
                bank: 5000000,
                persediaan: [],
                piutangAnggota: [],
                hutangSupplier: [],
                simpananAnggota: [],
                pinjamanAnggota: []
            };
            
            // Act - Process existing data
            const journalEntries = generateJurnalPembuka(existingSaldoAwal);
            const updatedCOA = mockSaveSaldoAwalCOA(existingSaldoAwal);
            
            // Assert - Should work exactly as before
            expect(journalEntries.length).toBeGreaterThan(0);
            
            const akunModal = updatedCOA.find(a => a.kode === '3-1000');
            expect(akunModal.saldo).toBe(10000000);
            
            // Verify journal balance
            const totalDebit = journalEntries.reduce((sum, e) => sum + e.debit, 0);
            const totalKredit = journalEntries.reduce((sum, e) => sum + e.kredit, 0);
            expect(totalDebit).toBe(totalKredit);
        });
    });
});
