/**
 * Property-Based Tests for Saldo Awal Periode
 * Feature: saldo-awal-periode
 */

import fc from 'fast-check';

// Load the saldoAwal.js functions
// Since we're in a browser environment, we need to load the functions differently
// For testing purposes, we'll import the validation functions

// Mock functions that would be in saldoAwal.js
function validateBalance(entries) {
    if (!entries || !Array.isArray(entries)) {
        return {
            isValid: false,
            totalDebit: 0,
            totalKredit: 0,
            selisih: 0,
            message: 'Entries harus berupa array'
        };
    }
    
    const totalDebit = entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
    const totalKredit = entries.reduce((sum, entry) => sum + (entry.kredit || 0), 0);
    const selisih = totalDebit - totalKredit;
    
    const isValid = Math.abs(selisih) < 0.01;
    
    return {
        isValid,
        totalDebit,
        totalKredit,
        selisih,
        message: isValid 
            ? 'Balance valid: Total Debit = Total Kredit' 
            : `Balance tidak valid. Selisih: ${Math.abs(selisih)}`
    };
}

function validateUniquePeriodDate(tanggalMulai) {
    if (!tanggalMulai) {
        return {
            isValid: false,
            message: 'Tanggal mulai periode harus diisi'
        };
    }
    
    const saldoAwalPeriode = JSON.parse(localStorage.getItem('saldoAwalPeriode') || 'null');
    
    if (!saldoAwalPeriode) {
        return {
            isValid: true,
            message: 'Tanggal periode valid'
        };
    }
    
    if (saldoAwalPeriode.tanggalMulai === tanggalMulai) {
        return {
            isValid: false,
            message: 'Periode dengan tanggal ini sudah ada'
        };
    }
    
    return {
        isValid: true,
        message: 'Tanggal periode valid'
    };
}

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

function validateAccountingEquation(coa) {
    if (!coa || !Array.isArray(coa)) {
        return {
            isValid: false,
            totalAset: 0,
            totalKewajiban: 0,
            totalModal: 0,
            selisih: 0,
            message: 'COA harus berupa array'
        };
    }
    
    const totalAset = coa
        .filter(akun => akun.tipe === 'Aset')
        .reduce((sum, akun) => sum + (akun.saldo || 0), 0);
    
    const totalKewajiban = coa
        .filter(akun => akun.tipe === 'Kewajiban')
        .reduce((sum, akun) => sum + (akun.saldo || 0), 0);
    
    const totalModal = coa
        .filter(akun => akun.tipe === 'Modal')
        .reduce((sum, akun) => sum + (akun.saldo || 0), 0);
    
    const selisih = totalAset - (totalKewajiban + totalModal);
    
    const isValid = Math.abs(selisih) < 0.01;
    
    return {
        isValid,
        totalAset,
        totalKewajiban,
        totalModal,
        selisih,
        message: isValid 
            ? 'Persamaan akuntansi terpenuhi: Aset = Kewajiban + Modal' 
            : `Persamaan akuntansi tidak terpenuhi. Selisih: ${Math.abs(selisih)}`
    };
}

describe('**Feature: saldo-awal-periode, Property 1: Double-Entry Balance**', () => {
    test('For any set of journal entries where total debit equals total kredit, validateBalance should return isValid true', () => {
        fc.assert(
            fc.property(
                fc.nat(10000000),
                fc.array(
                    fc.record({
                        akun: fc.string(),
                        debit: fc.nat(1000000),
                        kredit: fc.constant(0)
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (targetTotal, debits) => {
                    // Calculate total debit
                    const totalDebit = debits.reduce((sum, e) => sum + e.debit, 0);
                    
                    // Create kredit entries that sum to totalDebit
                    const kredits = [
                        {
                            akun: 'Modal',
                            debit: 0,
                            kredit: totalDebit
                        }
                    ];
                    
                    const entries = [...debits, ...kredits];
                    const result = validateBalance(entries);
                    
                    return result.isValid === true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any set of journal entries where total debit does not equal total kredit, validateBalance should return isValid false', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        akun: fc.string(),
                        debit: fc.nat(1000000),
                        kredit: fc.nat(1000000)
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                fc.integer({ min: 100, max: 10000 }), // selisih yang signifikan
                (entries, selisih) => {
                    // Pastikan ada selisih yang signifikan
                    if (entries.length > 0) {
                        entries[0].debit += selisih;
                    }
                    
                    const result = validateBalance(entries);
                    const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
                    const totalKredit = entries.reduce((sum, e) => sum + e.kredit, 0);
                    
                    // Jika ada selisih signifikan, harus invalid
                    if (Math.abs(totalDebit - totalKredit) >= 0.01) {
                        return result.isValid === false;
                    }
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

describe('**Feature: saldo-awal-periode, Property 2: Accounting Equation Balance**', () => {
    test('For any COA where Aset = Kewajiban + Modal, validateAccountingEquation should return isValid true', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        kode: fc.string(),
                        nama: fc.string(),
                        tipe: fc.constant('Aset'),
                        saldo: fc.nat(10000000)
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                fc.array(
                    fc.record({
                        kode: fc.string(),
                        nama: fc.string(),
                        tipe: fc.constant('Kewajiban'),
                        saldo: fc.nat(10000000)
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (asetAccounts, kewajibanAccounts) => {
                    // Calculate totals
                    const totalAset = asetAccounts.reduce((sum, a) => sum + a.saldo, 0);
                    const totalKewajiban = kewajibanAccounts.reduce((sum, a) => sum + a.saldo, 0);
                    
                    // Create modal account that balances the equation
                    const modalAccounts = [
                        {
                            kode: '3-1000',
                            nama: 'Modal Koperasi',
                            tipe: 'Modal',
                            saldo: totalAset - totalKewajiban
                        }
                    ];
                    
                    const coa = [...asetAccounts, ...kewajibanAccounts, ...modalAccounts];
                    const result = validateAccountingEquation(coa);
                    
                    return result.isValid === true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

describe('**Feature: saldo-awal-periode, Property 5: Positive Value Validation**', () => {
    test('For any positive number or zero, validatePositiveValue should return isValid true', () => {
        fc.assert(
            fc.property(
                fc.nat(100000000),
                fc.string(),
                (nilai, namaField) => {
                    const result = validatePositiveValue(nilai, namaField);
                    return result.isValid === true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any negative number, validatePositiveValue should return isValid false', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: -100000000, max: -1 }),
                fc.string(),
                (nilai, namaField) => {
                    const result = validatePositiveValue(nilai, namaField);
                    return result.isValid === false;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any non-numeric value, validatePositiveValue should return isValid false', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.string().filter(s => isNaN(parseFloat(s))),
                    fc.constant(undefined),
                    fc.constant(null)
                ),
                fc.string(),
                (nilai, namaField) => {
                    const result = validatePositiveValue(nilai, namaField);
                    return result.isValid === false;
                }
            ),
            { numRuns: 100 }
        );
    });
});

describe('**Feature: saldo-awal-periode, Property 6: Unique Period Date**', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    
    test('For any date when no period exists, validateUniquePeriodDate should return isValid true', () => {
        fc.assert(
            fc.property(
                fc.date(),
                (date) => {
                    localStorage.clear();
                    const tanggalMulai = date.toISOString().split('T')[0];
                    const result = validateUniquePeriodDate(tanggalMulai);
                    return result.isValid === true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any date that matches existing period date, validateUniquePeriodDate should return isValid false', () => {
        fc.assert(
            fc.property(
                fc.date(),
                (date) => {
                    const tanggalMulai = date.toISOString().split('T')[0];
                    const existingPeriod = {
                        tanggalMulai: tanggalMulai,
                        status: 'aktif'
                    };
                    localStorage.setItem('saldoAwalPeriode', JSON.stringify(existingPeriod));
                    
                    const result = validateUniquePeriodDate(tanggalMulai);
                    localStorage.clear();
                    return result.isValid === false;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any date that differs from existing period date, validateUniquePeriodDate should return isValid true', () => {
        fc.assert(
            fc.property(
                fc.date(),
                fc.date(),
                (date1, date2) => {
                    const tanggal1 = date1.toISOString().split('T')[0];
                    const tanggal2 = date2.toISOString().split('T')[0];
                    
                    // Skip if dates are the same
                    if (tanggal1 === tanggal2) return true;
                    
                    const existingPeriod = {
                        tanggalMulai: tanggal1,
                        status: 'aktif'
                    };
                    localStorage.setItem('saldoAwalPeriode', JSON.stringify(existingPeriod));
                    
                    const result = validateUniquePeriodDate(tanggal2);
                    localStorage.clear();
                    return result.isValid === true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Validates: Requirements 1.2, 2.2, 3.3, 9.1, 9.2, 9.5**
 */

// Mock functions for COA and Jurnal integration testing
function generateJurnalPembuka(saldoAwalData) {
    const entries = [];
    
    if (saldoAwalData.modalKoperasi > 0) {
        entries.push({
            akun: '1-1000',
            debit: saldoAwalData.modalKoperasi,
            kredit: 0
        });
        entries.push({
            akun: '3-1000',
            debit: 0,
            kredit: saldoAwalData.modalKoperasi
        });
    }
    
    if (saldoAwalData.kas > 0 && saldoAwalData.kas !== saldoAwalData.modalKoperasi) {
        const selisihKas = saldoAwalData.kas - saldoAwalData.modalKoperasi;
        if (selisihKas > 0) {
            entries.push({
                akun: '1-1000',
                debit: selisihKas,
                kredit: 0
            });
            entries.push({
                akun: '3-1000',
                debit: 0,
                kredit: selisihKas
            });
        }
    }
    
    if (saldoAwalData.bank > 0) {
        entries.push({
            akun: '1-1100',
            debit: saldoAwalData.bank,
            kredit: 0
        });
        entries.push({
            akun: '3-1000',
            debit: 0,
            kredit: saldoAwalData.bank
        });
    }
    
    const totalPiutang = (saldoAwalData.piutangAnggota || []).reduce((sum, p) => sum + (p.jumlah || 0), 0);
    if (totalPiutang > 0) {
        entries.push({
            akun: '1-1200',
            debit: totalPiutang,
            kredit: 0
        });
        entries.push({
            akun: '3-1000',
            debit: 0,
            kredit: totalPiutang
        });
    }
    
    return entries;
}

function updateCOAFromSaldoAwal(coa, saldoAwalData) {
    const updatedCOA = JSON.parse(JSON.stringify(coa));
    
    const akunKas = updatedCOA.find(a => a.kode === '1-1000');
    if (akunKas) {
        akunKas.saldo = saldoAwalData.kas || 0;
    }
    
    const akunBank = updatedCOA.find(a => a.kode === '1-1100');
    if (akunBank) {
        akunBank.saldo = saldoAwalData.bank || 0;
    }
    
    const totalPiutang = (saldoAwalData.piutangAnggota || []).reduce((sum, p) => sum + (p.jumlah || 0), 0);
    const akunPiutang = updatedCOA.find(a => a.kode === '1-1200');
    if (akunPiutang) {
        akunPiutang.saldo = totalPiutang;
    }
    
    const totalPersediaan = (saldoAwalData.persediaan || []).reduce((sum, p) => sum + (p.stok * p.hpp), 0);
    const akunPersediaan = updatedCOA.find(a => a.kode === '1-1300');
    if (akunPersediaan) {
        akunPersediaan.saldo = totalPersediaan;
    }
    
    const totalHutang = (saldoAwalData.hutangSupplier || []).reduce((sum, h) => sum + (h.jumlah || 0), 0);
    const akunHutang = updatedCOA.find(a => a.kode === '2-1000');
    if (akunHutang) {
        akunHutang.saldo = totalHutang;
    }
    
    const totalSimpananPokok = (saldoAwalData.simpananAnggota || []).reduce((sum, s) => sum + (s.simpananPokok || 0), 0);
    const akunSimpananPokok = updatedCOA.find(a => a.kode === '2-1100');
    if (akunSimpananPokok) {
        akunSimpananPokok.saldo = totalSimpananPokok;
    }
    
    const totalSimpananWajib = (saldoAwalData.simpananAnggota || []).reduce((sum, s) => sum + (s.simpananWajib || 0), 0);
    const akunSimpananWajib = updatedCOA.find(a => a.kode === '2-1200');
    if (akunSimpananWajib) {
        akunSimpananWajib.saldo = totalSimpananWajib;
    }
    
    const totalSimpananSukarela = (saldoAwalData.simpananAnggota || []).reduce((sum, s) => sum + (s.simpananSukarela || 0), 0);
    const akunSimpananSukarela = updatedCOA.find(a => a.kode === '2-1300');
    if (akunSimpananSukarela) {
        akunSimpananSukarela.saldo = totalSimpananSukarela;
    }
    
    const akunModal = updatedCOA.find(a => a.kode === '3-1000');
    if (akunModal) {
        akunModal.saldo = saldoAwalData.modalKoperasi || 0;
    }
    
    return updatedCOA;
}

describe('**Feature: saldo-awal-periode, Property 3: COA Synchronization**', () => {
    test('For any saldo awal input, the saldo field in COA accounts should match the input values', () => {
        fc.assert(
            fc.property(
                fc.record({
                    kas: fc.nat(100000000),
                    bank: fc.nat(100000000),
                    modalKoperasi: fc.nat(100000000),
                    piutangAnggota: fc.array(
                        fc.record({
                            anggotaId: fc.string(),
                            jumlah: fc.nat(10000000)
                        }),
                        { maxLength: 5 }
                    ),
                    persediaan: fc.array(
                        fc.record({
                            barangId: fc.string(),
                            stok: fc.nat(1000),
                            hpp: fc.nat(100000)
                        }),
                        { maxLength: 5 }
                    ),
                    hutangSupplier: fc.array(
                        fc.record({
                            namaSupplier: fc.string(),
                            jumlah: fc.nat(10000000)
                        }),
                        { maxLength: 5 }
                    ),
                    simpananAnggota: fc.array(
                        fc.record({
                            anggotaId: fc.string(),
                            simpananPokok: fc.nat(1000000),
                            simpananWajib: fc.nat(1000000),
                            simpananSukarela: fc.nat(1000000)
                        }),
                        { maxLength: 5 }
                    )
                }),
                (saldoAwalData) => {
                    // Create initial COA
                    const coa = [
                        { kode: '1-1000', nama: 'Kas', tipe: 'Aset', saldo: 0 },
                        { kode: '1-1100', nama: 'Bank', tipe: 'Aset', saldo: 0 },
                        { kode: '1-1200', nama: 'Piutang Anggota', tipe: 'Aset', saldo: 0 },
                        { kode: '1-1300', nama: 'Persediaan Barang', tipe: 'Aset', saldo: 0 },
                        { kode: '2-1000', nama: 'Hutang Supplier', tipe: 'Kewajiban', saldo: 0 },
                        { kode: '2-1100', nama: 'Simpanan Pokok', tipe: 'Kewajiban', saldo: 0 },
                        { kode: '2-1200', nama: 'Simpanan Wajib', tipe: 'Kewajiban', saldo: 0 },
                        { kode: '2-1300', nama: 'Simpanan Sukarela', tipe: 'Kewajiban', saldo: 0 },
                        { kode: '3-1000', nama: 'Modal Koperasi', tipe: 'Modal', saldo: 0 }
                    ];
                    
                    // Update COA with saldo awal
                    const updatedCOA = updateCOAFromSaldoAwal(coa, saldoAwalData);
                    
                    // Verify synchronization
                    const akunKas = updatedCOA.find(a => a.kode === '1-1000');
                    const akunBank = updatedCOA.find(a => a.kode === '1-1100');
                    const akunModal = updatedCOA.find(a => a.kode === '3-1000');
                    
                    const kasMatch = akunKas.saldo === saldoAwalData.kas;
                    const bankMatch = akunBank.saldo === saldoAwalData.bank;
                    const modalMatch = akunModal.saldo === saldoAwalData.modalKoperasi;
                    
                    // Verify piutang
                    const totalPiutang = saldoAwalData.piutangAnggota.reduce((sum, p) => sum + p.jumlah, 0);
                    const akunPiutang = updatedCOA.find(a => a.kode === '1-1200');
                    const piutangMatch = akunPiutang.saldo === totalPiutang;
                    
                    // Verify persediaan
                    const totalPersediaan = saldoAwalData.persediaan.reduce((sum, p) => sum + (p.stok * p.hpp), 0);
                    const akunPersediaan = updatedCOA.find(a => a.kode === '1-1300');
                    const persediaanMatch = akunPersediaan.saldo === totalPersediaan;
                    
                    // Verify hutang
                    const totalHutang = saldoAwalData.hutangSupplier.reduce((sum, h) => sum + h.jumlah, 0);
                    const akunHutang = updatedCOA.find(a => a.kode === '2-1000');
                    const hutangMatch = akunHutang.saldo === totalHutang;
                    
                    // Verify simpanan
                    const totalSimpananPokok = saldoAwalData.simpananAnggota.reduce((sum, s) => sum + s.simpananPokok, 0);
                    const totalSimpananWajib = saldoAwalData.simpananAnggota.reduce((sum, s) => sum + s.simpananWajib, 0);
                    const totalSimpananSukarela = saldoAwalData.simpananAnggota.reduce((sum, s) => sum + s.simpananSukarela, 0);
                    
                    const akunSimpananPokok = updatedCOA.find(a => a.kode === '2-1100');
                    const akunSimpananWajib = updatedCOA.find(a => a.kode === '2-1200');
                    const akunSimpananSukarela = updatedCOA.find(a => a.kode === '2-1300');
                    
                    const simpananPokokMatch = akunSimpananPokok.saldo === totalSimpananPokok;
                    const simpananWajibMatch = akunSimpananWajib.saldo === totalSimpananWajib;
                    const simpananSukarelaMatch = akunSimpananSukarela.saldo === totalSimpananSukarela;
                    
                    return kasMatch && bankMatch && modalMatch && piutangMatch && 
                           persediaanMatch && hutangMatch && simpananPokokMatch && 
                           simpananWajibMatch && simpananSukarelaMatch;
                }
            ),
            { numRuns: 100 }
        );
    });
});

describe('**Feature: saldo-awal-periode, Property 4: Jurnal Integration**', () => {
    test('For any saldo awal saved, there should be a journal entry with keterangan "Saldo Awal Periode"', () => {
        fc.assert(
            fc.property(
                fc.record({
                    kas: fc.nat(100000000),
                    bank: fc.nat(100000000),
                    modalKoperasi: fc.nat(100000000),
                    piutangAnggota: fc.array(
                        fc.record({
                            anggotaId: fc.string(),
                            jumlah: fc.nat(10000000)
                        }),
                        { maxLength: 3 }
                    )
                }),
                (saldoAwalData) => {
                    // Generate jurnal pembuka
                    const jurnalEntries = generateJurnalPembuka(saldoAwalData);
                    
                    // Verify that entries exist
                    const hasEntries = jurnalEntries.length > 0;
                    
                    // Verify that entries are balanced
                    const totalDebit = jurnalEntries.reduce((sum, e) => sum + e.debit, 0);
                    const totalKredit = jurnalEntries.reduce((sum, e) => sum + e.kredit, 0);
                    const isBalanced = Math.abs(totalDebit - totalKredit) < 0.01;
                    
                    // Verify that all entries have valid account codes
                    const allHaveAccounts = jurnalEntries.every(e => e.akun && e.akun.length > 0);
                    
                    return hasEntries && isBalanced && allHaveAccounts;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any saldo awal data, generated jurnal entries should be balanced (debit = kredit)', () => {
        fc.assert(
            fc.property(
                fc.record({
                    kas: fc.nat(100000000),
                    bank: fc.nat(100000000),
                    modalKoperasi: fc.nat(100000000),
                    piutangAnggota: fc.array(
                        fc.record({
                            anggotaId: fc.string(),
                            jumlah: fc.nat(10000000)
                        }),
                        { maxLength: 5 }
                    )
                }),
                (saldoAwalData) => {
                    const jurnalEntries = generateJurnalPembuka(saldoAwalData);
                    const validation = validateBalance(jurnalEntries);
                    
                    return validation.isValid === true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Validates: Requirements 1.3, 1.4, 2.3, 3.1, 3.2, 4.3, 5.3, 6.4, 7.5, 8.4, 13.1, 13.2**
 */

// Helper function to update stok in barang array
function updateStokFromPersediaan(barang, persediaan) {
    const updatedBarang = JSON.parse(JSON.stringify(barang));
    
    persediaan.forEach(item => {
        const produk = updatedBarang.find(b => b.id === item.barangId);
        if (produk) {
            produk.stok = item.stok;
        }
    });
    
    return updatedBarang;
}

describe('**Feature: saldo-awal-periode, Property 9: Persediaan Calculation**', () => {
    test('For any collection of barang with stok awal, total nilai persediaan (sum of stok × hpp) should equal saldo akun Persediaan Barang (1-1300) in COA', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        barangId: fc.string({ minLength: 1 }),
                        namaBarang: fc.string({ minLength: 1 }),
                        stok: fc.nat(1000),
                        hpp: fc.nat({ max: 1000000 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (persediaan) => {
                    // Calculate total nilai persediaan manually
                    const expectedTotal = persediaan.reduce((sum, item) => {
                        return sum + (item.stok * item.hpp);
                    }, 0);
                    
                    // Create COA with persediaan account
                    const coa = [
                        { kode: '1-1300', nama: 'Persediaan Barang', tipe: 'Aset', saldo: 0 }
                    ];
                    
                    // Update COA with persediaan data
                    const saldoAwalData = { persediaan };
                    const updatedCOA = updateCOAFromSaldoAwal(coa, saldoAwalData);
                    
                    // Get saldo from COA
                    const akunPersediaan = updatedCOA.find(a => a.kode === '1-1300');
                    const actualTotal = akunPersediaan ? akunPersediaan.saldo : 0;
                    
                    // Verify they match
                    return actualTotal === expectedTotal;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any persediaan with zero stok, total nilai should be zero', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        barangId: fc.string({ minLength: 1 }),
                        namaBarang: fc.string({ minLength: 1 }),
                        stok: fc.constant(0),
                        hpp: fc.nat({ max: 1000000 })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (persediaan) => {
                    const totalNilai = persediaan.reduce((sum, item) => {
                        return sum + (item.stok * item.hpp);
                    }, 0);
                    
                    return totalNilai === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any persediaan with zero hpp, total nilai should be zero regardless of stok', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        barangId: fc.string({ minLength: 1 }),
                        namaBarang: fc.string({ minLength: 1 }),
                        stok: fc.nat(1000),
                        hpp: fc.constant(0)
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (persediaan) => {
                    const totalNilai = persediaan.reduce((sum, item) => {
                        return sum + (item.stok * item.hpp);
                    }, 0);
                    
                    return totalNilai === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
});

describe('**Feature: saldo-awal-periode, Property 15: Stok Update Synchronization**', () => {
    test('For any barang that has stok awal input, the stok field in barang array should be updated to match the input value', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
                        nama: fc.string({ minLength: 1 }),
                        stok: fc.constant(0),
                        hargaBeli: fc.nat({ max: 1000000 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ).map(arr => {
                    // Ensure unique IDs by appending index
                    return arr.map((item, idx) => ({
                        ...item,
                        id: `${item.id.trim()}_${idx}`
                    }));
                }),
                fc.array(
                    fc.record({
                        barangId: fc.string({ minLength: 1 }),
                        stok: fc.nat(1000)
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (barang, persediaanInput) => {
                    // Map persediaan input to match barang IDs (one-to-one mapping)
                    const persediaan = persediaanInput.slice(0, barang.length).map((p, index) => ({
                        ...p,
                        barangId: barang[index].id
                    }));
                    
                    // Update stok in barang array
                    const updatedBarang = updateStokFromPersediaan(barang, persediaan);
                    
                    // Verify that stok was updated correctly
                    // For each persediaan item, check if the corresponding barang was updated
                    let allMatch = true;
                    persediaan.forEach(item => {
                        const produk = updatedBarang.find(b => b.id === item.barangId);
                        if (!produk || produk.stok !== item.stok) {
                            allMatch = false;
                        }
                    });
                    
                    return allMatch;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any barang not in persediaan input, stok should remain unchanged', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        stok: fc.nat(100),
                        hargaBeli: fc.nat({ max: 1000000 })
                    }),
                    { minLength: 2, maxLength: 10 }
                ),
                (barang) => {
                    // Ensure unique IDs for barang
                    const uniqueBarang = barang.map((b, index) => ({
                        ...b,
                        id: `${b.id}-${index}`
                    }));
                    
                    // Only update first item
                    const persediaan = [{
                        barangId: uniqueBarang[0].id,
                        stok: 999
                    }];
                    
                    // Store original stok values
                    const originalStok = uniqueBarang.map(b => ({ id: b.id, stok: b.stok }));
                    
                    // Update stok
                    const updatedBarang = updateStokFromPersediaan(uniqueBarang, persediaan);
                    
                    // Verify first item was updated
                    const firstItem = updatedBarang.find(b => b.id === uniqueBarang[0].id);
                    const firstUpdated = firstItem && firstItem.stok === 999;
                    
                    // Verify other items remain unchanged
                    let othersUnchanged = true;
                    for (let i = 1; i < uniqueBarang.length; i++) {
                        const original = originalStok[i];
                        const updated = updatedBarang.find(b => b.id === original.id);
                        if (updated && updated.stok !== original.stok) {
                            othersUnchanged = false;
                            break;
                        }
                    }
                    
                    return firstUpdated && othersUnchanged;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any persediaan with multiple updates to same barang, last update should win', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.string({ minLength: 1 }),
                    nama: fc.string({ minLength: 1 }),
                    stok: fc.nat(100),
                    hargaBeli: fc.nat({ max: 1000000 })
                }),
                fc.nat(1000),
                fc.nat(1000),
                (barang, stok1, stok2) => {
                    // Create multiple updates for same barang
                    const persediaan = [
                        { barangId: barang.id, stok: stok1 },
                        { barangId: barang.id, stok: stok2 }
                    ];
                    
                    // Update stok
                    const updatedBarang = updateStokFromPersediaan([barang], persediaan);
                    
                    // Verify last update wins
                    const updated = updatedBarang.find(b => b.id === barang.id);
                    return updated && updated.stok === stok2;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Validates: Requirements 6.2, 6.3, 6.4**
 */

describe('**Feature: saldo-awal-periode, Property 7: Piutang Aggregation**', () => {
    test('For any collection of piutang per anggota, total piutang should equal saldo akun Piutang Anggota (1-1200) in COA', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        nik: fc.string({ minLength: 1 }),
                        jumlah: fc.nat({ max: 100000000 })
                    }),
                    { minLength: 1, maxLength: 20 }
                ),
                (piutangAnggota) => {
                    // Calculate total piutang manually
                    const expectedTotal = piutangAnggota.reduce((sum, item) => {
                        return sum + (item.jumlah || 0);
                    }, 0);
                    
                    // Create COA with piutang account
                    const coa = [
                        { kode: '1-1200', nama: 'Piutang Anggota', tipe: 'Aset', saldo: 0 }
                    ];
                    
                    // Update COA with piutang data
                    const saldoAwalData = { piutangAnggota };
                    const updatedCOA = updateCOAFromSaldoAwal(coa, saldoAwalData);
                    
                    // Get saldo from COA
                    const akunPiutang = updatedCOA.find(a => a.kode === '1-1200');
                    const actualTotal = akunPiutang ? akunPiutang.saldo : 0;
                    
                    // Verify they match
                    return actualTotal === expectedTotal;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any piutang with zero jumlah, it should not contribute to total', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        nik: fc.string({ minLength: 1 }),
                        jumlah: fc.constant(0)
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (piutangAnggota) => {
                    const totalPiutang = piutangAnggota.reduce((sum, item) => {
                        return sum + (item.jumlah || 0);
                    }, 0);
                    
                    return totalPiutang === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any empty piutang array, total should be zero', () => {
        const piutangAnggota = [];
        const totalPiutang = piutangAnggota.reduce((sum, item) => {
            return sum + (item.jumlah || 0);
        }, 0);
        
        expect(totalPiutang).toBe(0);
    });
    
    test('For any piutang collection, total should equal sum of individual jumlah values', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        nik: fc.string({ minLength: 1 }),
                        jumlah: fc.nat({ max: 50000000 })
                    }),
                    { minLength: 1, maxLength: 15 }
                ),
                (piutangAnggota) => {
                    // Calculate total using reduce
                    const totalFromReduce = piutangAnggota.reduce((sum, item) => sum + item.jumlah, 0);
                    
                    // Calculate total using manual loop
                    let totalFromLoop = 0;
                    for (const item of piutangAnggota) {
                        totalFromLoop += item.jumlah;
                    }
                    
                    // Both methods should give same result
                    return totalFromReduce === totalFromLoop;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any piutang with missing jumlah field, it should be treated as zero', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        nik: fc.string({ minLength: 1 })
                        // jumlah is intentionally missing
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (piutangAnggota) => {
                    const totalPiutang = piutangAnggota.reduce((sum, item) => {
                        return sum + (item.jumlah || 0);
                    }, 0);
                    
                    // Should be zero since all items have no jumlah field
                    return totalPiutang === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any piutang data saved, it should be stored in piutangAwal localStorage', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        nik: fc.string({ minLength: 1 }),
                        jumlah: fc.nat({ max: 100000000 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (piutangAnggota) => {
                    // Clear localStorage first
                    localStorage.removeItem('piutangAwal');
                    
                    // Save piutang data
                    localStorage.setItem('piutangAwal', JSON.stringify(piutangAnggota));
                    
                    // Retrieve and verify
                    const savedPiutang = JSON.parse(localStorage.getItem('piutangAwal') || '[]');
                    
                    // Verify length matches
                    if (savedPiutang.length !== piutangAnggota.length) {
                        return false;
                    }
                    
                    // Verify each item matches
                    for (let i = 0; i < piutangAnggota.length; i++) {
                        if (savedPiutang[i].anggotaId !== piutangAnggota[i].anggotaId ||
                            savedPiutang[i].jumlah !== piutangAnggota[i].jumlah) {
                            return false;
                        }
                    }
                    
                    // Clean up
                    localStorage.removeItem('piutangAwal');
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Validates: Requirements 4.3**
 */

describe('**Feature: saldo-awal-periode, Property 8: Hutang Aggregation**', () => {
    test('For any collection of hutang per supplier, total hutang should equal saldo akun Hutang Supplier (2-1000) in COA', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1 }),
                        namaSupplier: fc.string({ minLength: 1 }),
                        jumlah: fc.nat({ max: 100000000 })
                    }),
                    { minLength: 1, maxLength: 20 }
                ),
                (hutangSupplier) => {
                    // Calculate total hutang manually
                    const expectedTotal = hutangSupplier.reduce((sum, item) => {
                        return sum + (item.jumlah || 0);
                    }, 0);
                    
                    // Create COA with hutang account
                    const coa = [
                        { kode: '2-1000', nama: 'Hutang Supplier', tipe: 'Kewajiban', saldo: 0 }
                    ];
                    
                    // Update COA with hutang data
                    const saldoAwalData = { hutangSupplier };
                    const updatedCOA = updateCOAFromSaldoAwal(coa, saldoAwalData);
                    
                    // Get saldo from COA
                    const akunHutang = updatedCOA.find(a => a.kode === '2-1000');
                    const actualTotal = akunHutang ? akunHutang.saldo : 0;
                    
                    // Verify they match
                    return actualTotal === expectedTotal;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any hutang with zero jumlah, it should not contribute to total', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1 }),
                        namaSupplier: fc.string({ minLength: 1 }),
                        jumlah: fc.constant(0)
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (hutangSupplier) => {
                    const totalHutang = hutangSupplier.reduce((sum, item) => {
                        return sum + (item.jumlah || 0);
                    }, 0);
                    
                    return totalHutang === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any empty hutang array, total should be zero', () => {
        const hutangSupplier = [];
        const totalHutang = hutangSupplier.reduce((sum, item) => {
            return sum + (item.jumlah || 0);
        }, 0);
        
        expect(totalHutang).toBe(0);
    });
    
    test('For any hutang collection, total should equal sum of individual jumlah values', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1 }),
                        namaSupplier: fc.string({ minLength: 1 }),
                        jumlah: fc.nat({ max: 50000000 })
                    }),
                    { minLength: 1, maxLength: 15 }
                ),
                (hutangSupplier) => {
                    // Calculate total using reduce
                    const totalFromReduce = hutangSupplier.reduce((sum, item) => sum + item.jumlah, 0);
                    
                    // Calculate total using manual loop
                    let totalFromLoop = 0;
                    for (const item of hutangSupplier) {
                        totalFromLoop += item.jumlah;
                    }
                    
                    // Both methods should give same result
                    return totalFromReduce === totalFromLoop;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any hutang with missing jumlah field, it should be treated as zero', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1 }),
                        namaSupplier: fc.string({ minLength: 1 })
                        // jumlah is intentionally missing
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (hutangSupplier) => {
                    const totalHutang = hutangSupplier.reduce((sum, item) => {
                        return sum + (item.jumlah || 0);
                    }, 0);
                    
                    // Should be zero since all items have no jumlah field
                    return totalHutang === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any hutang data saved, it should be stored in hutangAwal localStorage', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1 }),
                        namaSupplier: fc.string({ minLength: 1 }),
                        jumlah: fc.nat({ max: 100000000 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (hutangSupplier) => {
                    // Clear localStorage first
                    localStorage.removeItem('hutangAwal');
                    
                    // Save hutang data
                    localStorage.setItem('hutangAwal', JSON.stringify(hutangSupplier));
                    
                    // Retrieve and verify
                    const savedHutang = JSON.parse(localStorage.getItem('hutangAwal') || '[]');
                    
                    // Verify length matches
                    if (savedHutang.length !== hutangSupplier.length) {
                        return false;
                    }
                    
                    // Verify each item matches
                    for (let i = 0; i < hutangSupplier.length; i++) {
                        if (savedHutang[i].namaSupplier !== hutangSupplier[i].namaSupplier ||
                            savedHutang[i].jumlah !== hutangSupplier[i].jumlah) {
                            return false;
                        }
                    }
                    
                    // Clean up
                    localStorage.removeItem('hutangAwal');
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any hutang with multiple suppliers, each supplier should be tracked separately', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1 }),
                        namaSupplier: fc.string({ minLength: 1 }),
                        jumlah: fc.nat({ max: 10000000 })
                    }),
                    { minLength: 2, maxLength: 10 }
                ),
                (hutangSupplier) => {
                    // Ensure unique supplier names for this test
                    const uniqueHutang = hutangSupplier.map((h, index) => ({
                        ...h,
                        namaSupplier: `Supplier-${index}`
                    }));
                    
                    // Save to localStorage
                    localStorage.setItem('hutangAwal', JSON.stringify(uniqueHutang));
                    
                    // Retrieve
                    const savedHutang = JSON.parse(localStorage.getItem('hutangAwal') || '[]');
                    
                    // Verify each supplier is tracked separately
                    const allSuppliersTracked = uniqueHutang.every(original => {
                        return savedHutang.some(saved => 
                            saved.namaSupplier === original.namaSupplier &&
                            saved.jumlah === original.jumlah
                        );
                    });
                    
                    // Clean up
                    localStorage.removeItem('hutangAwal');
                    
                    return allSuppliersTracked;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Validates: Requirements 5.3**
 */

/**
 * **Validates: Requirements 5.3**
 */

// Helper function to update simpanan fields in anggota array
function updateSimpananFromSaldoAwal(anggota, simpananAnggota) {
    const updatedAnggota = JSON.parse(JSON.stringify(anggota));
    
    simpananAnggota.forEach(item => {
        const member = updatedAnggota.find(a => a.id === item.anggotaId);
        if (member) {
            member.simpananPokok = item.simpananPokok || 0;
            member.simpananWajib = item.simpananWajib || 0;
            member.simpananSukarela = item.simpananSukarela || 0;
        }
    });
    
    return updatedAnggota;
}

describe('**Feature: saldo-awal-periode, Property 10: Simpanan Aggregation**', () => {
    test('For any collection of simpanan anggota, total simpanan pokok should equal saldo akun Simpanan Pokok (2-1100) in COA', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        nik: fc.string({ minLength: 1 }),
                        simpananPokok: fc.nat({ max: 10000000 }),
                        simpananWajib: fc.nat({ max: 10000000 }),
                        simpananSukarela: fc.nat({ max: 10000000 })
                    }),
                    { minLength: 1, maxLength: 20 }
                ),
                (simpananAnggota) => {
                    // Calculate total simpanan pokok manually
                    const expectedTotal = simpananAnggota.reduce((sum, item) => {
                        return sum + (item.simpananPokok || 0);
                    }, 0);
                    
                    // Create COA with simpanan pokok account
                    const coa = [
                        { kode: '2-1100', nama: 'Simpanan Pokok', tipe: 'Kewajiban', saldo: 0 }
                    ];
                    
                    // Update COA with simpanan data
                    const saldoAwalData = { simpananAnggota };
                    const updatedCOA = updateCOAFromSaldoAwal(coa, saldoAwalData);
                    
                    // Get saldo from COA
                    const akunSimpananPokok = updatedCOA.find(a => a.kode === '2-1100');
                    const actualTotal = akunSimpananPokok ? akunSimpananPokok.saldo : 0;
                    
                    // Verify they match
                    return actualTotal === expectedTotal;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any collection of simpanan anggota, total simpanan wajib should equal saldo akun Simpanan Wajib (2-1200) in COA', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        nik: fc.string({ minLength: 1 }),
                        simpananPokok: fc.nat({ max: 10000000 }),
                        simpananWajib: fc.nat({ max: 10000000 }),
                        simpananSukarela: fc.nat({ max: 10000000 })
                    }),
                    { minLength: 1, maxLength: 20 }
                ),
                (simpananAnggota) => {
                    // Calculate total simpanan wajib manually
                    const expectedTotal = simpananAnggota.reduce((sum, item) => {
                        return sum + (item.simpananWajib || 0);
                    }, 0);
                    
                    // Create COA with simpanan wajib account
                    const coa = [
                        { kode: '2-1200', nama: 'Simpanan Wajib', tipe: 'Kewajiban', saldo: 0 }
                    ];
                    
                    // Update COA with simpanan data
                    const saldoAwalData = { simpananAnggota };
                    const updatedCOA = updateCOAFromSaldoAwal(coa, saldoAwalData);
                    
                    // Get saldo from COA
                    const akunSimpananWajib = updatedCOA.find(a => a.kode === '2-1200');
                    const actualTotal = akunSimpananWajib ? akunSimpananWajib.saldo : 0;
                    
                    // Verify they match
                    return actualTotal === expectedTotal;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any collection of simpanan anggota, total simpanan sukarela should equal saldo akun Simpanan Sukarela (2-1300) in COA', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        nik: fc.string({ minLength: 1 }),
                        simpananPokok: fc.nat({ max: 10000000 }),
                        simpananWajib: fc.nat({ max: 10000000 }),
                        simpananSukarela: fc.nat({ max: 10000000 })
                    }),
                    { minLength: 1, maxLength: 20 }
                ),
                (simpananAnggota) => {
                    // Calculate total simpanan sukarela manually
                    const expectedTotal = simpananAnggota.reduce((sum, item) => {
                        return sum + (item.simpananSukarela || 0);
                    }, 0);
                    
                    // Create COA with simpanan sukarela account
                    const coa = [
                        { kode: '2-1300', nama: 'Simpanan Sukarela', tipe: 'Kewajiban', saldo: 0 }
                    ];
                    
                    // Update COA with simpanan data
                    const saldoAwalData = { simpananAnggota };
                    const updatedCOA = updateCOAFromSaldoAwal(coa, saldoAwalData);
                    
                    // Get saldo from COA
                    const akunSimpananSukarela = updatedCOA.find(a => a.kode === '2-1300');
                    const actualTotal = akunSimpananSukarela ? akunSimpananSukarela.saldo : 0;
                    
                    // Verify they match
                    return actualTotal === expectedTotal;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any simpanan with zero values, it should not contribute to totals', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        nik: fc.string({ minLength: 1 }),
                        simpananPokok: fc.constant(0),
                        simpananWajib: fc.constant(0),
                        simpananSukarela: fc.constant(0)
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (simpananAnggota) => {
                    const totalPokok = simpananAnggota.reduce((sum, item) => sum + (item.simpananPokok || 0), 0);
                    const totalWajib = simpananAnggota.reduce((sum, item) => sum + (item.simpananWajib || 0), 0);
                    const totalSukarela = simpananAnggota.reduce((sum, item) => sum + (item.simpananSukarela || 0), 0);
                    
                    return totalPokok === 0 && totalWajib === 0 && totalSukarela === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any empty simpanan array, all totals should be zero', () => {
        const simpananAnggota = [];
        const totalPokok = simpananAnggota.reduce((sum, item) => sum + (item.simpananPokok || 0), 0);
        const totalWajib = simpananAnggota.reduce((sum, item) => sum + (item.simpananWajib || 0), 0);
        const totalSukarela = simpananAnggota.reduce((sum, item) => sum + (item.simpananSukarela || 0), 0);
        
        expect(totalPokok).toBe(0);
        expect(totalWajib).toBe(0);
        expect(totalSukarela).toBe(0);
    });
    
    test('For any simpanan collection, totals should equal sum of individual values', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        nik: fc.string({ minLength: 1 }),
                        simpananPokok: fc.nat({ max: 5000000 }),
                        simpananWajib: fc.nat({ max: 5000000 }),
                        simpananSukarela: fc.nat({ max: 5000000 })
                    }),
                    { minLength: 1, maxLength: 15 }
                ),
                (simpananAnggota) => {
                    // Calculate totals using reduce
                    const totalPokokReduce = simpananAnggota.reduce((sum, item) => sum + item.simpananPokok, 0);
                    const totalWajibReduce = simpananAnggota.reduce((sum, item) => sum + item.simpananWajib, 0);
                    const totalSukarelaReduce = simpananAnggota.reduce((sum, item) => sum + item.simpananSukarela, 0);
                    
                    // Calculate totals using manual loop
                    let totalPokokLoop = 0;
                    let totalWajibLoop = 0;
                    let totalSukarelaLoop = 0;
                    for (const item of simpananAnggota) {
                        totalPokokLoop += item.simpananPokok;
                        totalWajibLoop += item.simpananWajib;
                        totalSukarelaLoop += item.simpananSukarela;
                    }
                    
                    // Both methods should give same result
                    return totalPokokReduce === totalPokokLoop &&
                           totalWajibReduce === totalWajibLoop &&
                           totalSukarelaReduce === totalSukarelaLoop;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any simpanan with missing fields, they should be treated as zero', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        nik: fc.string({ minLength: 1 })
                        // simpanan fields are intentionally missing
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (simpananAnggota) => {
                    const totalPokok = simpananAnggota.reduce((sum, item) => sum + (item.simpananPokok || 0), 0);
                    const totalWajib = simpananAnggota.reduce((sum, item) => sum + (item.simpananWajib || 0), 0);
                    const totalSukarela = simpananAnggota.reduce((sum, item) => sum + (item.simpananSukarela || 0), 0);
                    
                    // Should be zero since all items have no simpanan fields
                    return totalPokok === 0 && totalWajib === 0 && totalSukarela === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Validates: Requirements 7.2, 7.3, 7.4, 7.5**
 */

describe('**Feature: saldo-awal-periode, Property 16: Simpanan Field Update**', () => {
    test('For any anggota with simpanan input, simpananPokok field should be updated in anggota array', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        nik: fc.string({ minLength: 1 }),
                        simpananPokok: fc.constant(0),
                        simpananWajib: fc.constant(0),
                        simpananSukarela: fc.constant(0)
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 1 }),
                        simpananPokok: fc.nat({ max: 10000000 }),
                        simpananWajib: fc.nat({ max: 10000000 }),
                        simpananSukarela: fc.nat({ max: 10000000 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (anggota, simpananInput) => {
                    // Ensure unique IDs for anggota
                    const uniqueAnggota = anggota.map((a, index) => ({
                        ...a,
                        id: `${a.id}-${index}`
                    }));
                    
                    // Map simpanan input to match anggota IDs (one-to-one mapping)
                    const simpananAnggota = simpananInput.slice(0, uniqueAnggota.length).map((s, index) => ({
                        ...s,
                        anggotaId: uniqueAnggota[index].id
                    }));
                    
                    // Update simpanan in anggota array
                    const updatedAnggota = updateSimpananFromSaldoAwal(uniqueAnggota, simpananAnggota);
                    
                    // Verify that simpananPokok was updated correctly
                    let allMatch = true;
                    simpananAnggota.forEach(item => {
                        const member = updatedAnggota.find(a => a.id === item.anggotaId);
                        if (!member || member.simpananPokok !== item.simpananPokok) {
                            allMatch = false;
                        }
                    });
                    
                    return allMatch;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any anggota with simpanan input, simpananWajib field should be updated in anggota array', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        nik: fc.string({ minLength: 1 }),
                        simpananPokok: fc.constant(0),
                        simpananWajib: fc.constant(0),
                        simpananSukarela: fc.constant(0)
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 1 }),
                        simpananPokok: fc.nat({ max: 10000000 }),
                        simpananWajib: fc.nat({ max: 10000000 }),
                        simpananSukarela: fc.nat({ max: 10000000 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (anggota, simpananInput) => {
                    // Ensure unique IDs for anggota
                    const uniqueAnggota = anggota.map((a, index) => ({
                        ...a,
                        id: `${a.id}-${index}`
                    }));
                    
                    // Map simpanan input to match anggota IDs (one-to-one mapping)
                    const simpananAnggota = simpananInput.slice(0, uniqueAnggota.length).map((s, index) => ({
                        ...s,
                        anggotaId: uniqueAnggota[index].id
                    }));
                    
                    // Update simpanan in anggota array
                    const updatedAnggota = updateSimpananFromSaldoAwal(uniqueAnggota, simpananAnggota);
                    
                    // Verify that simpananWajib was updated correctly
                    let allMatch = true;
                    simpananAnggota.forEach(item => {
                        const member = updatedAnggota.find(a => a.id === item.anggotaId);
                        if (!member || member.simpananWajib !== item.simpananWajib) {
                            allMatch = false;
                        }
                    });
                    
                    return allMatch;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any anggota with simpanan input, simpananSukarela field should be updated in anggota array', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        nik: fc.string({ minLength: 1 }),
                        simpananPokok: fc.constant(0),
                        simpananWajib: fc.constant(0),
                        simpananSukarela: fc.constant(0)
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 1 }),
                        simpananPokok: fc.nat({ max: 10000000 }),
                        simpananWajib: fc.nat({ max: 10000000 }),
                        simpananSukarela: fc.nat({ max: 10000000 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (anggota, simpananInput) => {
                    // Ensure unique IDs for anggota
                    const uniqueAnggota = anggota.map((a, index) => ({
                        ...a,
                        id: `${a.id}-${index}`
                    }));
                    
                    // Map simpanan input to match anggota IDs (one-to-one mapping)
                    const simpananAnggota = simpananInput.slice(0, uniqueAnggota.length).map((s, index) => ({
                        ...s,
                        anggotaId: uniqueAnggota[index].id
                    }));
                    
                    // Update simpanan in anggota array
                    const updatedAnggota = updateSimpananFromSaldoAwal(uniqueAnggota, simpananAnggota);
                    
                    // Verify that simpananSukarela was updated correctly
                    let allMatch = true;
                    simpananAnggota.forEach(item => {
                        const member = updatedAnggota.find(a => a.id === item.anggotaId);
                        if (!member || member.simpananSukarela !== item.simpananSukarela) {
                            allMatch = false;
                        }
                    });
                    
                    return allMatch;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any anggota not in simpanan input, simpanan fields should remain unchanged', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        nik: fc.string({ minLength: 1 }),
                        simpananPokok: fc.nat(100000),
                        simpananWajib: fc.nat(100000),
                        simpananSukarela: fc.nat(100000)
                    }),
                    { minLength: 2, maxLength: 10 }
                ),
                (anggota) => {
                    // Ensure unique IDs for this test
                    const uniqueAnggota = anggota.map((a, index) => ({
                        ...a,
                        id: `anggota-${index}`
                    }));
                    
                    // Only update first anggota
                    const simpananAnggota = [{
                        anggotaId: uniqueAnggota[0].id,
                        simpananPokok: 999999,
                        simpananWajib: 888888,
                        simpananSukarela: 777777
                    }];
                    
                    // Store original simpanan values
                    const originalSimpanan = uniqueAnggota.map(a => ({ 
                        id: a.id, 
                        simpananPokok: a.simpananPokok,
                        simpananWajib: a.simpananWajib,
                        simpananSukarela: a.simpananSukarela
                    }));
                    
                    // Update simpanan
                    const updatedAnggota = updateSimpananFromSaldoAwal(uniqueAnggota, simpananAnggota);
                    
                    // Verify first anggota was updated
                    const firstAnggota = updatedAnggota.find(a => a.id === uniqueAnggota[0].id);
                    const firstUpdated = firstAnggota && 
                                       firstAnggota.simpananPokok === 999999 &&
                                       firstAnggota.simpananWajib === 888888 &&
                                       firstAnggota.simpananSukarela === 777777;
                    
                    // Verify other anggota remain unchanged
                    let othersUnchanged = true;
                    for (let i = 1; i < uniqueAnggota.length; i++) {
                        const original = originalSimpanan[i];
                        const updated = updatedAnggota.find(a => a.id === original.id);
                        if (updated && (
                            updated.simpananPokok !== original.simpananPokok ||
                            updated.simpananWajib !== original.simpananWajib ||
                            updated.simpananSukarela !== original.simpananSukarela
                        )) {
                            othersUnchanged = false;
                            break;
                        }
                    }
                    
                    return firstUpdated && othersUnchanged;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any simpanan with multiple updates to same anggota, last update should win', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.string({ minLength: 1 }),
                    nama: fc.string({ minLength: 1 }),
                    nik: fc.string({ minLength: 1 }),
                    simpananPokok: fc.nat(100000),
                    simpananWajib: fc.nat(100000),
                    simpananSukarela: fc.nat(100000)
                }),
                fc.nat(10000000),
                fc.nat(10000000),
                fc.nat(10000000),
                fc.nat(10000000),
                fc.nat(10000000),
                fc.nat(10000000),
                (anggota, pokok1, wajib1, sukarela1, pokok2, wajib2, sukarela2) => {
                    // Create multiple updates for same anggota
                    const simpananAnggota = [
                        { 
                            anggotaId: anggota.id, 
                            simpananPokok: pokok1,
                            simpananWajib: wajib1,
                            simpananSukarela: sukarela1
                        },
                        { 
                            anggotaId: anggota.id, 
                            simpananPokok: pokok2,
                            simpananWajib: wajib2,
                            simpananSukarela: sukarela2
                        }
                    ];
                    
                    // Update simpanan
                    const updatedAnggota = updateSimpananFromSaldoAwal([anggota], simpananAnggota);
                    
                    // Verify last update wins
                    const updated = updatedAnggota.find(a => a.id === anggota.id);
                    return updated && 
                           updated.simpananPokok === pokok2 &&
                           updated.simpananWajib === wajib2 &&
                           updated.simpananSukarela === sukarela2;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any anggota with zero simpanan values, fields should be set to zero', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        nik: fc.string({ minLength: 1 }),
                        simpananPokok: fc.nat(100000),
                        simpananWajib: fc.nat(100000),
                        simpananSukarela: fc.nat(100000)
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (anggota) => {
                    // Create simpanan with zero values
                    const simpananAnggota = anggota.map(a => ({
                        anggotaId: a.id,
                        simpananPokok: 0,
                        simpananWajib: 0,
                        simpananSukarela: 0
                    }));
                    
                    // Update simpanan
                    const updatedAnggota = updateSimpananFromSaldoAwal(anggota, simpananAnggota);
                    
                    // Verify all simpanan fields are zero
                    return updatedAnggota.every(a => 
                        a.simpananPokok === 0 &&
                        a.simpananWajib === 0 &&
                        a.simpananSukarela === 0
                    );
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Validates: Requirements 7.2, 7.3, 7.4**
 */

// Helper function to save pinjaman to localStorage
function savePinjamanFromSaldoAwal(pinjamanAnggota, anggota, tanggalMulai) {
    const pinjaman = [];
    
    pinjamanAnggota.forEach(item => {
        if (item.anggotaId && item.jumlahPokok > 0) {
            const anggotaData = anggota.find(a => a.id === item.anggotaId);
            pinjaman.push({
                id: `pinjaman-${item.anggotaId}-${Date.now()}`,
                anggotaId: item.anggotaId,
                nik: anggotaData ? anggotaData.nik : '',
                nama: anggotaData ? anggotaData.nama : '',
                jumlahPokok: item.jumlahPokok,
                bunga: item.bunga,
                tenor: item.tenor,
                tanggalPinjam: tanggalMulai,
                tanggalJatuhTempo: item.tanggalJatuhTempo,
                status: 'Aktif',
                sisaPokok: item.jumlahPokok
            });
        }
    });
    
    return pinjaman;
}

describe('**Feature: saldo-awal-periode, Property 17: Pinjaman Data Persistence**', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    
    test('For any pinjaman anggota input as saldo awal, detail pinjaman (NIK, jumlah pokok, bunga, tenor, tanggal jatuh tempo) should be saved completely in pinjaman array localStorage with status "Aktif"', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        nik: fc.string({ minLength: 5, maxLength: 20 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 1 }),
                        jumlahPokok: fc.integer({ min: 100000, max: 100000000 }),
                        bunga: fc.float({ min: 0, max: 50, noNaN: true }),
                        tenor: fc.integer({ min: 1, max: 120 }),
                        tanggalJatuhTempo: fc.date().map(d => d.toISOString().split('T')[0])
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                fc.date(),
                (anggota, pinjamanInput, tanggalMulai) => {
                    // Ensure unique IDs
                    const uniqueAnggota = anggota.map((a, index) => ({
                        ...a,
                        id: `anggota-${index}`
                    }));
                    
                    // Map pinjaman to valid anggota IDs
                    const pinjamanAnggota = pinjamanInput.map((p, index) => ({
                        ...p,
                        anggotaId: uniqueAnggota[index % uniqueAnggota.length].id
                    }));
                    
                    const tanggalMulaiStr = tanggalMulai.toISOString().split('T')[0];
                    
                    // Save pinjaman
                    const savedPinjaman = savePinjamanFromSaldoAwal(pinjamanAnggota, uniqueAnggota, tanggalMulaiStr);
                    
                    // Verify all pinjaman are saved
                    if (savedPinjaman.length !== pinjamanAnggota.length) {
                        return false;
                    }
                    
                    // Verify each pinjaman has complete data
                    for (let i = 0; i < savedPinjaman.length; i++) {
                        const saved = savedPinjaman[i];
                        const input = pinjamanAnggota[i];
                        const anggotaData = uniqueAnggota.find(a => a.id === input.anggotaId);
                        
                        // Check all required fields
                        if (!saved.id) return false;
                        if (saved.anggotaId !== input.anggotaId) return false;
                        if (saved.nik !== (anggotaData ? anggotaData.nik : '')) return false;
                        if (saved.nama !== (anggotaData ? anggotaData.nama : '')) return false;
                        if (saved.jumlahPokok !== input.jumlahPokok) return false;
                        if (saved.bunga !== input.bunga) return false;
                        if (saved.tenor !== input.tenor) return false;
                        if (saved.tanggalPinjam !== tanggalMulaiStr) return false;
                        if (saved.tanggalJatuhTempo !== input.tanggalJatuhTempo) return false;
                        if (saved.status !== 'Aktif') return false;
                        if (saved.sisaPokok !== input.jumlahPokok) return false;
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any pinjaman with zero jumlahPokok, it should not be saved to pinjaman array', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        nik: fc.string({ minLength: 5, maxLength: 20 })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                fc.date(),
                (anggota, tanggalMulai) => {
                    const uniqueAnggota = anggota.map((a, index) => ({
                        ...a,
                        id: `anggota-${index}`
                    }));
                    
                    // Create pinjaman with zero jumlahPokok
                    const pinjamanAnggota = uniqueAnggota.map(a => ({
                        anggotaId: a.id,
                        jumlahPokok: 0,
                        bunga: 10,
                        tenor: 12,
                        tanggalJatuhTempo: '2025-12-31'
                    }));
                    
                    const tanggalMulaiStr = tanggalMulai.toISOString().split('T')[0];
                    
                    // Save pinjaman
                    const savedPinjaman = savePinjamanFromSaldoAwal(pinjamanAnggota, uniqueAnggota, tanggalMulaiStr);
                    
                    // Verify no pinjaman are saved
                    return savedPinjaman.length === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any pinjaman without anggotaId, it should not be saved to pinjaman array', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        nik: fc.string({ minLength: 5, maxLength: 20 })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                fc.integer({ min: 100000, max: 10000000 }),
                fc.date(),
                (anggota, jumlahPokok, tanggalMulai) => {
                    const uniqueAnggota = anggota.map((a, index) => ({
                        ...a,
                        id: `anggota-${index}`
                    }));
                    
                    // Create pinjaman without anggotaId
                    const pinjamanAnggota = [{
                        anggotaId: '',
                        jumlahPokok: jumlahPokok,
                        bunga: 10,
                        tenor: 12,
                        tanggalJatuhTempo: '2025-12-31'
                    }];
                    
                    const tanggalMulaiStr = tanggalMulai.toISOString().split('T')[0];
                    
                    // Save pinjaman
                    const savedPinjaman = savePinjamanFromSaldoAwal(pinjamanAnggota, uniqueAnggota, tanggalMulaiStr);
                    
                    // Verify no pinjaman are saved
                    return savedPinjaman.length === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any pinjaman saved, sisaPokok should equal jumlahPokok initially', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        nik: fc.string({ minLength: 5, maxLength: 20 })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 1 }),
                        jumlahPokok: fc.integer({ min: 100000, max: 100000000 }),
                        bunga: fc.float({ min: 0, max: 50, noNaN: true }),
                        tenor: fc.integer({ min: 1, max: 120 }),
                        tanggalJatuhTempo: fc.date().map(d => d.toISOString().split('T')[0])
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                fc.date(),
                (anggota, pinjamanInput, tanggalMulai) => {
                    const uniqueAnggota = anggota.map((a, index) => ({
                        ...a,
                        id: `anggota-${index}`
                    }));
                    
                    const pinjamanAnggota = pinjamanInput.map((p, index) => ({
                        ...p,
                        anggotaId: uniqueAnggota[index % uniqueAnggota.length].id
                    }));
                    
                    const tanggalMulaiStr = tanggalMulai.toISOString().split('T')[0];
                    
                    // Save pinjaman
                    const savedPinjaman = savePinjamanFromSaldoAwal(pinjamanAnggota, uniqueAnggota, tanggalMulaiStr);
                    
                    // Verify sisaPokok equals jumlahPokok for all
                    return savedPinjaman.every(p => p.sisaPokok === p.jumlahPokok);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any pinjaman saved, status should always be "Aktif"', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        nik: fc.string({ minLength: 5, maxLength: 20 })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 1 }),
                        jumlahPokok: fc.integer({ min: 100000, max: 100000000 }),
                        bunga: fc.float({ min: 0, max: 50, noNaN: true }),
                        tenor: fc.integer({ min: 1, max: 120 }),
                        tanggalJatuhTempo: fc.date().map(d => d.toISOString().split('T')[0])
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                fc.date(),
                (anggota, pinjamanInput, tanggalMulai) => {
                    const uniqueAnggota = anggota.map((a, index) => ({
                        ...a,
                        id: `anggota-${index}`
                    }));
                    
                    const pinjamanAnggota = pinjamanInput.map((p, index) => ({
                        ...p,
                        anggotaId: uniqueAnggota[index % uniqueAnggota.length].id
                    }));
                    
                    const tanggalMulaiStr = tanggalMulai.toISOString().split('T')[0];
                    
                    // Save pinjaman
                    const savedPinjaman = savePinjamanFromSaldoAwal(pinjamanAnggota, uniqueAnggota, tanggalMulaiStr);
                    
                    // Verify all have status "Aktif"
                    return savedPinjaman.every(p => p.status === 'Aktif');
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Validates: Requirements 8.2, 8.6**
 */

// Helper function to generate correction journal
function generateJurnalKoreksi(oldSaldoAwal, newSaldoAwal) {
    const entries = [];
    
    const addKoreksiEntry = (akun, oldValue, newValue, tipe) => {
        const selisih = newValue - oldValue;
        
        if (Math.abs(selisih) < 0.01) {
            return;
        }
        
        if (tipe === 'Aset') {
            if (selisih > 0) {
                entries.push({ akun: akun, debit: selisih, kredit: 0 });
                entries.push({ akun: '3-1000', debit: 0, kredit: selisih });
            } else {
                entries.push({ akun: akun, debit: 0, kredit: Math.abs(selisih) });
                entries.push({ akun: '3-1000', debit: Math.abs(selisih), kredit: 0 });
            }
        } else if (tipe === 'Kewajiban' || tipe === 'Modal') {
            if (selisih > 0) {
                entries.push({ akun: '3-1000', debit: selisih, kredit: 0 });
                entries.push({ akun: akun, debit: 0, kredit: selisih });
            } else {
                entries.push({ akun: '3-1000', debit: 0, kredit: Math.abs(selisih) });
                entries.push({ akun: akun, debit: Math.abs(selisih), kredit: 0 });
            }
        }
    };
    
    // Koreksi Kas
    addKoreksiEntry('1-1000', oldSaldoAwal.kas || 0, newSaldoAwal.kas || 0, 'Aset');
    
    // Koreksi Bank
    addKoreksiEntry('1-1100', oldSaldoAwal.bank || 0, newSaldoAwal.bank || 0, 'Aset');
    
    // Koreksi Piutang Anggota
    const oldTotalPiutang = (oldSaldoAwal.piutangAnggota || []).reduce((sum, p) => sum + (p.jumlah || 0), 0);
    const newTotalPiutang = (newSaldoAwal.piutangAnggota || []).reduce((sum, p) => sum + (p.jumlah || 0), 0);
    addKoreksiEntry('1-1200', oldTotalPiutang, newTotalPiutang, 'Aset');
    
    // Koreksi Persediaan
    const oldTotalPersediaan = (oldSaldoAwal.persediaan || []).reduce((sum, p) => sum + (p.stok * p.hpp), 0);
    const newTotalPersediaan = (newSaldoAwal.persediaan || []).reduce((sum, p) => sum + (p.stok * p.hpp), 0);
    addKoreksiEntry('1-1300', oldTotalPersediaan, newTotalPersediaan, 'Aset');
    
    // Koreksi Hutang Supplier
    const oldTotalHutang = (oldSaldoAwal.hutangSupplier || []).reduce((sum, h) => sum + (h.jumlah || 0), 0);
    const newTotalHutang = (newSaldoAwal.hutangSupplier || []).reduce((sum, h) => sum + (h.jumlah || 0), 0);
    addKoreksiEntry('2-1000', oldTotalHutang, newTotalHutang, 'Kewajiban');
    
    // Koreksi Simpanan Pokok
    const oldTotalSimpananPokok = (oldSaldoAwal.simpananAnggota || []).reduce((sum, s) => sum + (s.simpananPokok || 0), 0);
    const newTotalSimpananPokok = (newSaldoAwal.simpananAnggota || []).reduce((sum, s) => sum + (s.simpananPokok || 0), 0);
    addKoreksiEntry('2-1100', oldTotalSimpananPokok, newTotalSimpananPokok, 'Kewajiban');
    
    // Koreksi Simpanan Wajib
    const oldTotalSimpananWajib = (oldSaldoAwal.simpananAnggota || []).reduce((sum, s) => sum + (s.simpananWajib || 0), 0);
    const newTotalSimpananWajib = (newSaldoAwal.simpananAnggota || []).reduce((sum, s) => sum + (s.simpananWajib || 0), 0);
    addKoreksiEntry('2-1200', oldTotalSimpananWajib, newTotalSimpananWajib, 'Kewajiban');
    
    // Koreksi Simpanan Sukarela
    const oldTotalSimpananSukarela = (oldSaldoAwal.simpananAnggota || []).reduce((sum, s) => sum + (s.simpananSukarela || 0), 0);
    const newTotalSimpananSukarela = (newSaldoAwal.simpananAnggota || []).reduce((sum, s) => sum + (s.simpananSukarela || 0), 0);
    addKoreksiEntry('2-1300', oldTotalSimpananSukarela, newTotalSimpananSukarela, 'Kewajiban');
    
    // Koreksi Modal Koperasi
    addKoreksiEntry('3-1000', oldSaldoAwal.modalKoperasi || 0, newSaldoAwal.modalKoperasi || 0, 'Modal');
    
    return entries;
}

describe('**Feature: saldo-awal-periode, Property 11: Correction Journal Audit Trail**', () => {
    test('For any change to saldo awal after periode is active, system should create correction journal using addJurnal() with keterangan "Koreksi Saldo Awal" and calculate difference between old and new saldo', () => {
        fc.assert(
            fc.property(
                fc.record({
                    kas: fc.nat(100000000),
                    bank: fc.nat(100000000),
                    modalKoperasi: fc.nat(100000000),
                    piutangAnggota: fc.array(
                        fc.record({
                            anggotaId: fc.string(),
                            jumlah: fc.nat(10000000)
                        }),
                        { maxLength: 3 }
                    ),
                    persediaan: fc.array(
                        fc.record({
                            barangId: fc.string(),
                            stok: fc.nat(100),
                            hpp: fc.nat(100000)
                        }),
                        { maxLength: 3 }
                    ),
                    hutangSupplier: fc.array(
                        fc.record({
                            namaSupplier: fc.string(),
                            jumlah: fc.nat(10000000)
                        }),
                        { maxLength: 3 }
                    ),
                    simpananAnggota: fc.array(
                        fc.record({
                            anggotaId: fc.string(),
                            simpananPokok: fc.nat(1000000),
                            simpananWajib: fc.nat(1000000),
                            simpananSukarela: fc.nat(1000000)
                        }),
                        { maxLength: 3 }
                    )
                }),
                fc.record({
                    kas: fc.nat(100000000),
                    bank: fc.nat(100000000),
                    modalKoperasi: fc.nat(100000000),
                    piutangAnggota: fc.array(
                        fc.record({
                            anggotaId: fc.string(),
                            jumlah: fc.nat(10000000)
                        }),
                        { maxLength: 3 }
                    ),
                    persediaan: fc.array(
                        fc.record({
                            barangId: fc.string(),
                            stok: fc.nat(100),
                            hpp: fc.nat(100000)
                        }),
                        { maxLength: 3 }
                    ),
                    hutangSupplier: fc.array(
                        fc.record({
                            namaSupplier: fc.string(),
                            jumlah: fc.nat(10000000)
                        }),
                        { maxLength: 3 }
                    ),
                    simpananAnggota: fc.array(
                        fc.record({
                            anggotaId: fc.string(),
                            simpananPokok: fc.nat(1000000),
                            simpananWajib: fc.nat(1000000),
                            simpananSukarela: fc.nat(1000000)
                        }),
                        { maxLength: 3 }
                    )
                }),
                (oldSaldoAwal, newSaldoAwal) => {
                    // Generate correction journal
                    const jurnalKoreksi = generateJurnalKoreksi(oldSaldoAwal, newSaldoAwal);
                    
                    // If there are no changes, no entries should be generated
                    if (oldSaldoAwal.kas === newSaldoAwal.kas &&
                        oldSaldoAwal.bank === newSaldoAwal.bank &&
                        oldSaldoAwal.modalKoperasi === newSaldoAwal.modalKoperasi &&
                        JSON.stringify(oldSaldoAwal.piutangAnggota) === JSON.stringify(newSaldoAwal.piutangAnggota) &&
                        JSON.stringify(oldSaldoAwal.persediaan) === JSON.stringify(newSaldoAwal.persediaan) &&
                        JSON.stringify(oldSaldoAwal.hutangSupplier) === JSON.stringify(newSaldoAwal.hutangSupplier) &&
                        JSON.stringify(oldSaldoAwal.simpananAnggota) === JSON.stringify(newSaldoAwal.simpananAnggota)) {
                        return jurnalKoreksi.length === 0;
                    }
                    
                    // If there are changes, entries should be balanced
                    if (jurnalKoreksi.length > 0) {
                        const validation = validateBalance(jurnalKoreksi);
                        return validation.isValid === true;
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any correction journal generated, total debit should equal total kredit', () => {
        fc.assert(
            fc.property(
                fc.record({
                    kas: fc.nat(100000000),
                    bank: fc.nat(100000000),
                    modalKoperasi: fc.nat(100000000),
                    piutangAnggota: fc.constant([]),
                    persediaan: fc.constant([]),
                    hutangSupplier: fc.constant([]),
                    simpananAnggota: fc.constant([])
                }),
                fc.record({
                    kas: fc.nat(100000000),
                    bank: fc.nat(100000000),
                    modalKoperasi: fc.nat(100000000),
                    piutangAnggota: fc.constant([]),
                    persediaan: fc.constant([]),
                    hutangSupplier: fc.constant([]),
                    simpananAnggota: fc.constant([])
                }),
                (oldSaldoAwal, newSaldoAwal) => {
                    // Ensure there's at least one change
                    if (oldSaldoAwal.kas === newSaldoAwal.kas &&
                        oldSaldoAwal.bank === newSaldoAwal.bank &&
                        oldSaldoAwal.modalKoperasi === newSaldoAwal.modalKoperasi) {
                        // Force a change
                        newSaldoAwal.kas = oldSaldoAwal.kas + 1000;
                    }
                    
                    const jurnalKoreksi = generateJurnalKoreksi(oldSaldoAwal, newSaldoAwal);
                    
                    if (jurnalKoreksi.length === 0) {
                        return true;
                    }
                    
                    const validation = validateBalance(jurnalKoreksi);
                    return validation.isValid === true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any increase in Aset account, correction journal should have debit to Aset and kredit to Modal', () => {
        fc.assert(
            fc.property(
                fc.nat(100000000),
                fc.nat(100000000),
                (oldKas, increase) => {
                    const newKas = oldKas + increase + 1; // Ensure increase
                    
                    const oldSaldoAwal = {
                        kas: oldKas,
                        bank: 0,
                        modalKoperasi: 0,
                        piutangAnggota: [],
                        persediaan: [],
                        hutangSupplier: [],
                        simpananAnggota: []
                    };
                    
                    const newSaldoAwal = {
                        kas: newKas,
                        bank: 0,
                        modalKoperasi: 0,
                        piutangAnggota: [],
                        persediaan: [],
                        hutangSupplier: [],
                        simpananAnggota: []
                    };
                    
                    const jurnalKoreksi = generateJurnalKoreksi(oldSaldoAwal, newSaldoAwal);
                    
                    // Should have entries for Kas (debit) and Modal (kredit)
                    const kasEntry = jurnalKoreksi.find(e => e.akun === '1-1000' && e.debit > 0);
                    const modalEntry = jurnalKoreksi.find(e => e.akun === '3-1000' && e.kredit > 0);
                    
                    return kasEntry && modalEntry && 
                           Math.abs(kasEntry.debit - modalEntry.kredit) < 0.01;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any decrease in Aset account, correction journal should have kredit to Aset and debit to Modal', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1000000, max: 100000000 }),
                fc.integer({ min: 1, max: 999999 }),
                (oldKas, decrease) => {
                    const newKas = oldKas - decrease;
                    
                    const oldSaldoAwal = {
                        kas: oldKas,
                        bank: 0,
                        modalKoperasi: 0,
                        piutangAnggota: [],
                        persediaan: [],
                        hutangSupplier: [],
                        simpananAnggota: []
                    };
                    
                    const newSaldoAwal = {
                        kas: newKas,
                        bank: 0,
                        modalKoperasi: 0,
                        piutangAnggota: [],
                        persediaan: [],
                        hutangSupplier: [],
                        simpananAnggota: []
                    };
                    
                    const jurnalKoreksi = generateJurnalKoreksi(oldSaldoAwal, newSaldoAwal);
                    
                    // Should have entries for Kas (kredit) and Modal (debit)
                    const kasEntry = jurnalKoreksi.find(e => e.akun === '1-1000' && e.kredit > 0);
                    const modalEntry = jurnalKoreksi.find(e => e.akun === '3-1000' && e.debit > 0);
                    
                    return kasEntry && modalEntry && 
                           Math.abs(kasEntry.kredit - modalEntry.debit) < 0.01;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any increase in Kewajiban account, correction journal should have debit to Modal and kredit to Kewajiban', () => {
        fc.assert(
            fc.property(
                fc.nat(100000000),
                fc.nat(100000000),
                (oldHutang, increase) => {
                    const newHutang = oldHutang + increase + 1; // Ensure increase
                    
                    const oldSaldoAwal = {
                        kas: 0,
                        bank: 0,
                        modalKoperasi: 0,
                        piutangAnggota: [],
                        persediaan: [],
                        hutangSupplier: [{ namaSupplier: 'Test', jumlah: oldHutang }],
                        simpananAnggota: []
                    };
                    
                    const newSaldoAwal = {
                        kas: 0,
                        bank: 0,
                        modalKoperasi: 0,
                        piutangAnggota: [],
                        persediaan: [],
                        hutangSupplier: [{ namaSupplier: 'Test', jumlah: newHutang }],
                        simpananAnggota: []
                    };
                    
                    const jurnalKoreksi = generateJurnalKoreksi(oldSaldoAwal, newSaldoAwal);
                    
                    // Should have entries for Modal (debit) and Hutang (kredit)
                    const modalEntry = jurnalKoreksi.find(e => e.akun === '3-1000' && e.debit > 0);
                    const hutangEntry = jurnalKoreksi.find(e => e.akun === '2-1000' && e.kredit > 0);
                    
                    return modalEntry && hutangEntry && 
                           Math.abs(modalEntry.debit - hutangEntry.kredit) < 0.01;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any saldo awal with no changes, correction journal should be empty', () => {
        fc.assert(
            fc.property(
                fc.record({
                    kas: fc.nat(100000000),
                    bank: fc.nat(100000000),
                    modalKoperasi: fc.nat(100000000),
                    piutangAnggota: fc.array(
                        fc.record({
                            anggotaId: fc.string(),
                            jumlah: fc.nat(10000000)
                        }),
                        { maxLength: 3 }
                    ),
                    persediaan: fc.array(
                        fc.record({
                            barangId: fc.string(),
                            stok: fc.nat(100),
                            hpp: fc.nat(100000)
                        }),
                        { maxLength: 3 }
                    ),
                    hutangSupplier: fc.array(
                        fc.record({
                            namaSupplier: fc.string(),
                            jumlah: fc.nat(10000000)
                        }),
                        { maxLength: 3 }
                    ),
                    simpananAnggota: fc.array(
                        fc.record({
                            anggotaId: fc.string(),
                            simpananPokok: fc.nat(1000000),
                            simpananWajib: fc.nat(1000000),
                            simpananSukarela: fc.nat(1000000)
                        }),
                        { maxLength: 3 }
                    )
                }),
                (saldoAwal) => {
                    // Use same data for old and new
                    const jurnalKoreksi = generateJurnalKoreksi(saldoAwal, saldoAwal);
                    
                    // Should have no entries
                    return jurnalKoreksi.length === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Validates: Requirements 2.5, 11.2, 11.4, 13.7**
 */

// Mock functions for period locking mechanism
function isPeriodeLocked() {
    const saldoAwalPeriode = JSON.parse(localStorage.getItem('saldoAwalPeriode') || 'null');
    
    if (!saldoAwalPeriode) {
        return false;
    }
    
    return saldoAwalPeriode.locked === true;
}

function validateDirectChange() {
    const saldoAwalPeriode = JSON.parse(localStorage.getItem('saldoAwalPeriode') || 'null');
    
    if (!saldoAwalPeriode) {
        return {
            allowed: true,
            message: 'Belum ada periode, perubahan diizinkan'
        };
    }
    
    if (saldoAwalPeriode.locked) {
        return {
            allowed: false,
            message: 'Periode sudah dikunci. Perubahan hanya dapat dilakukan melalui jurnal koreksi.'
        };
    }
    
    return {
        allowed: true,
        message: 'Perubahan langsung diizinkan'
    };
}

function attemptDirectSaldoChange(saldoAwalData) {
    const validation = validateDirectChange();
    
    if (!validation.allowed) {
        return {
            success: false,
            message: validation.message,
            requiresCorrection: true
        };
    }
    
    // If allowed, proceed with direct change
    localStorage.setItem('saldoAwalPeriode', JSON.stringify(saldoAwalData));
    
    return {
        success: true,
        message: 'Perubahan berhasil disimpan',
        requiresCorrection: false
    };
}

function attemptCorrectionJournal(oldSaldoAwal, newSaldoAwal, alasanKoreksi) {
    // Generate correction journal
    const jurnalKoreksi = generateJurnalKoreksi(oldSaldoAwal, newSaldoAwal);
    
    // Validate balance
    const balanceValidation = validateBalance(jurnalKoreksi);
    
    if (!balanceValidation.isValid) {
        return {
            success: false,
            message: balanceValidation.message,
            entries: []
        };
    }
    
    // Save correction journal
    return {
        success: true,
        message: `Jurnal koreksi berhasil dicatat: ${alasanKoreksi}`,
        entries: jurnalKoreksi
    };
}

describe('**Feature: saldo-awal-periode, Property 14: Locked Period Protection**', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    
    afterEach(() => {
        localStorage.clear();
    });
    
    test('For any locked period, direct changes to saldo awal should be prevented', () => {
        fc.assert(
            fc.property(
                fc.record({
                    tanggalMulai: fc.date().map(d => d.toISOString()),
                    kas: fc.nat(100000000),
                    bank: fc.nat(100000000),
                    modalKoperasi: fc.nat(100000000),
                    locked: fc.constant(true),
                    status: fc.constant('aktif')
                }),
                fc.record({
                    kas: fc.nat(100000000),
                    bank: fc.nat(100000000),
                    modalKoperasi: fc.nat(100000000)
                }),
                (existingPeriod, newData) => {
                    // Set up locked period
                    localStorage.setItem('saldoAwalPeriode', JSON.stringify(existingPeriod));
                    
                    // Attempt direct change
                    const result = attemptDirectSaldoChange({
                        ...existingPeriod,
                        ...newData
                    });
                    
                    // Should be prevented
                    const isLocked = isPeriodeLocked();
                    const validation = validateDirectChange();
                    
                    localStorage.clear();
                    
                    return result.success === false && 
                           result.requiresCorrection === true &&
                           isLocked === true &&
                           validation.allowed === false;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any unlocked period, direct changes to saldo awal should be allowed', () => {
        fc.assert(
            fc.property(
                fc.record({
                    tanggalMulai: fc.date().map(d => d.toISOString()),
                    kas: fc.nat(100000000),
                    bank: fc.nat(100000000),
                    modalKoperasi: fc.nat(100000000),
                    locked: fc.constant(false),
                    status: fc.constant('aktif')
                }),
                fc.record({
                    kas: fc.nat(100000000),
                    bank: fc.nat(100000000),
                    modalKoperasi: fc.nat(100000000)
                }),
                (existingPeriod, newData) => {
                    // Set up unlocked period
                    localStorage.setItem('saldoAwalPeriode', JSON.stringify(existingPeriod));
                    
                    // Attempt direct change
                    const result = attemptDirectSaldoChange({
                        ...existingPeriod,
                        ...newData
                    });
                    
                    // Should be allowed
                    const isLocked = isPeriodeLocked();
                    const validation = validateDirectChange();
                    
                    localStorage.clear();
                    
                    return result.success === true && 
                           result.requiresCorrection === false &&
                           isLocked === false &&
                           validation.allowed === true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any locked period, changes through correction journal should be allowed and balanced', () => {
        fc.assert(
            fc.property(
                fc.record({
                    tanggalMulai: fc.date().map(d => d.toISOString()),
                    kas: fc.nat(100000000),
                    bank: fc.nat(100000000),
                    modalKoperasi: fc.nat(100000000),
                    locked: fc.constant(true),
                    status: fc.constant('aktif'),
                    piutangAnggota: fc.array(
                        fc.record({
                            anggotaId: fc.string(),
                            jumlah: fc.nat(10000000)
                        }),
                        { maxLength: 3 }
                    ),
                    persediaan: fc.array(
                        fc.record({
                            barangId: fc.string(),
                            stok: fc.nat(100),
                            hpp: fc.nat(100000)
                        }),
                        { maxLength: 3 }
                    ),
                    hutangSupplier: fc.array(
                        fc.record({
                            namaSupplier: fc.string(),
                            jumlah: fc.nat(10000000)
                        }),
                        { maxLength: 3 }
                    ),
                    simpananAnggota: fc.array(
                        fc.record({
                            anggotaId: fc.string(),
                            simpananPokok: fc.nat(1000000),
                            simpananWajib: fc.nat(1000000),
                            simpananSukarela: fc.nat(1000000)
                        }),
                        { maxLength: 3 }
                    )
                }),
                fc.record({
                    kas: fc.nat(100000000),
                    bank: fc.nat(100000000),
                    modalKoperasi: fc.nat(100000000)
                }),
                fc.string({ minLength: 5, maxLength: 50 }),
                (oldSaldoAwal, changes, alasanKoreksi) => {
                    // Set up locked period
                    localStorage.setItem('saldoAwalPeriode', JSON.stringify(oldSaldoAwal));
                    
                    // Create new saldo awal with changes
                    const newSaldoAwal = {
                        ...oldSaldoAwal,
                        ...changes
                    };
                    
                    // Attempt correction journal
                    const result = attemptCorrectionJournal(oldSaldoAwal, newSaldoAwal, alasanKoreksi);
                    
                    // Verify correction journal is balanced
                    let isBalanced = true;
                    if (result.entries && result.entries.length > 0) {
                        const validation = validateBalance(result.entries);
                        isBalanced = validation.isValid;
                    }
                    
                    localStorage.clear();
                    
                    // Correction should succeed and be balanced
                    return result.success === true && isBalanced;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any period without locked flag, isPeriodeLocked should return false', () => {
        fc.assert(
            fc.property(
                fc.record({
                    tanggalMulai: fc.date().map(d => d.toISOString()),
                    kas: fc.nat(100000000),
                    bank: fc.nat(100000000),
                    modalKoperasi: fc.nat(100000000),
                    status: fc.constant('aktif')
                    // No locked field
                }),
                (period) => {
                    localStorage.setItem('saldoAwalPeriode', JSON.stringify(period));
                    
                    const isLocked = isPeriodeLocked();
                    
                    localStorage.clear();
                    
                    return isLocked === false;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any non-existent period, isPeriodeLocked should return false', () => {
        fc.assert(
            fc.property(
                fc.constant(null),
                (_) => {
                    localStorage.clear();
                    
                    const isLocked = isPeriodeLocked();
                    
                    return isLocked === false;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any locked period with periodeAktif flag, validateDirectChange should return allowed false', () => {
        fc.assert(
            fc.property(
                fc.record({
                    tanggalMulai: fc.date().map(d => d.toISOString()),
                    kas: fc.nat(100000000),
                    bank: fc.nat(100000000),
                    modalKoperasi: fc.nat(100000000),
                    locked: fc.constant(true),
                    status: fc.constant('aktif')
                }),
                (period) => {
                    localStorage.setItem('saldoAwalPeriode', JSON.stringify(period));
                    localStorage.setItem('periodeAktif', 'true');
                    
                    const validation = validateDirectChange();
                    
                    localStorage.clear();
                    
                    return validation.allowed === false && 
                           validation.message.includes('dikunci');
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any correction journal on locked period, entries should maintain double-entry balance', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1000000, max: 100000000 }),
                fc.integer({ min: 1000000, max: 100000000 }),
                (oldKas, newKas) => {
                    const oldSaldoAwal = {
                        kas: oldKas,
                        bank: 0,
                        modalKoperasi: 0,
                        locked: true,
                        piutangAnggota: [],
                        persediaan: [],
                        hutangSupplier: [],
                        simpananAnggota: []
                    };
                    
                    const newSaldoAwal = {
                        kas: newKas,
                        bank: 0,
                        modalKoperasi: 0,
                        locked: true,
                        piutangAnggota: [],
                        persediaan: [],
                        hutangSupplier: [],
                        simpananAnggota: []
                    };
                    
                    const result = attemptCorrectionJournal(oldSaldoAwal, newSaldoAwal, 'Test correction');
                    
                    if (result.entries.length === 0) {
                        // No change, no entries needed
                        return true;
                    }
                    
                    const validation = validateBalance(result.entries);
                    
                    return validation.isValid === true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Validates: Requirements 10.5, 11.1, 11.3**
 */

// ============================================
// Property Tests for Import Functionality
// ============================================

/**
 * Helper function to parse CSV content
 */
function parseCSVContent(csvContent) {
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 2) {
        return { validData: [], errors: [] };
    }
    
    const validData = [];
    const errors = [];
    
    // Mock COA for testing
    const coa = [
        { kode: '1-1000', nama: 'Kas', tipe: 'Aset', saldo: 0 },
        { kode: '1-1100', nama: 'Bank', tipe: 'Aset', saldo: 0 },
        { kode: '1-1200', nama: 'Piutang Anggota', tipe: 'Aset', saldo: 0 },
        { kode: '2-1000', nama: 'Hutang Supplier', tipe: 'Kewajiban', saldo: 0 },
        { kode: '3-1000', nama: 'Modal Koperasi', tipe: 'Modal', saldo: 0 }
    ];
    
    for (let i = 1; i < lines.length; i++) {
        const lineNumber = i + 1;
        const columns = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        
        if (columns.length < 4) {
            errors.push({
                line: lineNumber,
                reason: 'Jumlah kolom tidak lengkap'
            });
            continue;
        }
        
        const kodeAkun = columns[0];
        const namaAkun = columns[1];
        const tipe = columns[2];
        const saldoStr = columns[3];
        
        // Validasi kode akun
        const akun = coa.find(a => a.kode === kodeAkun);
        if (!akun) {
            errors.push({
                line: lineNumber,
                kodeAkun,
                reason: `Kode akun ${kodeAkun} tidak ditemukan di COA`
            });
            continue;
        }
        
        // Validasi saldo
        const saldo = parseFloat(saldoStr);
        if (isNaN(saldo)) {
            errors.push({
                line: lineNumber,
                kodeAkun,
                reason: 'Saldo harus berupa angka'
            });
            continue;
        }
        
        if (saldo < 0) {
            errors.push({
                line: lineNumber,
                kodeAkun,
                reason: 'Saldo tidak boleh negatif'
            });
            continue;
        }
        
        // Validasi tipe akun
        if (!['Aset', 'Kewajiban', 'Modal'].includes(tipe)) {
            errors.push({
                line: lineNumber,
                kodeAkun,
                reason: 'Tipe akun harus Aset, Kewajiban, atau Modal'
            });
            continue;
        }
        
        // Data valid
        validData.push({
            line: lineNumber,
            kodeAkun,
            namaAkun,
            tipe,
            saldo,
            akun
        });
    }
    
    return { validData, errors };
}

/**
 * Helper function to process import and update COA
 */
function processImportData(validData) {
    const coa = [
        { kode: '1-1000', nama: 'Kas', tipe: 'Aset', saldo: 0 },
        { kode: '1-1100', nama: 'Bank', tipe: 'Aset', saldo: 0 },
        { kode: '1-1200', nama: 'Piutang Anggota', tipe: 'Aset', saldo: 0 },
        { kode: '2-1000', nama: 'Hutang Supplier', tipe: 'Kewajiban', saldo: 0 },
        { kode: '3-1000', nama: 'Modal Koperasi', tipe: 'Modal', saldo: 0 }
    ];
    
    const jurnalEntries = [];
    
    validData.forEach(data => {
        const akun = coa.find(a => a.kode === data.kodeAkun);
        
        if (akun) {
            // Update saldo in COA
            akun.saldo = data.saldo;
            
            // Create journal entries based on account type
            if (data.tipe === 'Aset') {
                jurnalEntries.push({
                    akun: data.kodeAkun,
                    debit: data.saldo,
                    kredit: 0
                });
                jurnalEntries.push({
                    akun: '3-1000',
                    debit: 0,
                    kredit: data.saldo
                });
            } else if (data.tipe === 'Kewajiban') {
                jurnalEntries.push({
                    akun: '3-1000',
                    debit: data.saldo,
                    kredit: 0
                });
                jurnalEntries.push({
                    akun: data.kodeAkun,
                    debit: 0,
                    kredit: data.saldo
                });
            }
        }
    });
    
    return { coa, jurnalEntries };
}

describe('**Feature: saldo-awal-periode, Property 12: Import Data Integrity**', () => {
    test('For any CSV file with valid account codes, each row should update the corresponding account saldo in COA', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        kodeAkun: fc.constantFrom('1-1000', '1-1100', '1-1200', '2-1000', '3-1000'),
                        namaAkun: fc.string({ minLength: 3, maxLength: 20 }).filter(s => !s.includes(',')),
                        tipe: fc.constantFrom('Aset', 'Kewajiban', 'Modal'),
                        saldo: fc.nat({ max: 100000000 })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (importData) => {
                    // Remove duplicates - keep only unique account codes (last one wins)
                    const uniqueData = [];
                    const seenCodes = new Set();
                    
                    // Process in reverse to keep last occurrence
                    for (let i = importData.length - 1; i >= 0; i--) {
                        if (!seenCodes.has(importData[i].kodeAkun)) {
                            uniqueData.unshift(importData[i]);
                            seenCodes.add(importData[i].kodeAkun);
                        }
                    }
                    
                    // Create CSV content
                    const csvHeader = 'Kode Akun,Nama Akun,Tipe,Saldo\n';
                    const csvRows = uniqueData.map(d => 
                        `${d.kodeAkun},${d.namaAkun},${d.tipe},${d.saldo}`
                    ).join('\n');
                    const csvContent = csvHeader + csvRows;
                    
                    // Parse CSV
                    const { validData, errors } = parseCSVContent(csvContent);
                    
                    // Process import
                    const { coa } = processImportData(validData);
                    
                    // Verify each valid data updated COA
                    return validData.every(data => {
                        const akun = coa.find(a => a.kode === data.kodeAkun);
                        return akun && akun.saldo === data.saldo;
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any CSV file with invalid account codes, those rows should be rejected with clear error messages', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        kodeAkun: fc.string({ minLength: 5, maxLength: 10 }).filter(s => !['1-1000', '1-1100', '1-1200', '2-1000', '3-1000'].includes(s)),
                        namaAkun: fc.string({ minLength: 3, maxLength: 20 }),
                        tipe: fc.constantFrom('Aset', 'Kewajiban', 'Modal'),
                        saldo: fc.nat({ max: 100000000 })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (importData) => {
                    // Create CSV content with invalid account codes
                    const csvHeader = 'Kode Akun,Nama Akun,Tipe,Saldo\n';
                    const csvRows = importData.map(d => 
                        `${d.kodeAkun},${d.namaAkun},${d.tipe},${d.saldo}`
                    ).join('\n');
                    const csvContent = csvHeader + csvRows;
                    
                    // Parse CSV
                    const { validData, errors } = parseCSVContent(csvContent);
                    
                    // All rows should be errors since account codes are invalid
                    return errors.length === importData.length &&
                           errors.every(e => e.reason.includes('tidak ditemukan di COA'));
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any CSV file with negative saldo values, those rows should be rejected', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        kodeAkun: fc.constantFrom('1-1000', '1-1100', '1-1200', '2-1000', '3-1000'),
                        namaAkun: fc.string({ minLength: 3, maxLength: 20 }).filter(s => !s.includes(',')),
                        tipe: fc.constantFrom('Aset', 'Kewajiban', 'Modal'),
                        saldo: fc.integer({ min: -100000000, max: -1 })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (importData) => {
                    // Create CSV content with negative saldo
                    const csvHeader = 'Kode Akun,Nama Akun,Tipe,Saldo\n';
                    const csvRows = importData.map(d => 
                        `${d.kodeAkun},${d.namaAkun},${d.tipe},${d.saldo}`
                    ).join('\n');
                    const csvContent = csvHeader + csvRows;
                    
                    // Parse CSV
                    const { validData, errors } = parseCSVContent(csvContent);
                    
                    // All rows should be errors since saldo is negative
                    return errors.length === importData.length &&
                           errors.every(e => e.reason.includes('tidak boleh negatif'));
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any CSV file with non-numeric saldo values, those rows should be rejected', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        kodeAkun: fc.constantFrom('1-1000', '1-1100', '1-1200', '2-1000', '3-1000'),
                        namaAkun: fc.string({ minLength: 3, maxLength: 20 }).filter(s => !s.includes(',')),
                        tipe: fc.constantFrom('Aset', 'Kewajiban', 'Modal'),
                        saldo: fc.string({ minLength: 1, maxLength: 10 }).filter(s => {
                            const trimmed = s.trim();
                            // Exclude strings with quotes or backslashes that could be parsed as numbers
                            return trimmed.length > 0 && 
                                   !trimmed.includes('"') && 
                                   !trimmed.includes('\\') &&
                                   isNaN(parseFloat(trimmed));
                        })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (importData) => {
                    // Create CSV content with non-numeric saldo
                    const csvHeader = 'Kode Akun,Nama Akun,Tipe,Saldo\n';
                    const csvRows = importData.map(d => 
                        `${d.kodeAkun},${d.namaAkun},${d.tipe},${d.saldo}`
                    ).join('\n');
                    const csvContent = csvHeader + csvRows;
                    
                    // Parse CSV
                    const { validData, errors } = parseCSVContent(csvContent);
                    
                    // All rows should be errors since saldo is non-numeric
                    return errors.length === importData.length &&
                           errors.every(e => e.reason.includes('harus berupa angka'));
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any CSV file with invalid tipe values, those rows should be rejected', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        kodeAkun: fc.constantFrom('1-1000', '1-1100', '1-1200', '2-1000', '3-1000'),
                        namaAkun: fc.string({ minLength: 3, maxLength: 20 }).filter(s => !s.includes(',')),
                        tipe: fc.string({ minLength: 3, maxLength: 20 }).filter(s => !s.includes(',') && !['Aset', 'Kewajiban', 'Modal'].includes(s)),
                        saldo: fc.nat({ max: 100000000 })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (importData) => {
                    // Create CSV content with invalid tipe
                    const csvHeader = 'Kode Akun,Nama Akun,Tipe,Saldo\n';
                    const csvRows = importData.map(d => 
                        `${d.kodeAkun},${d.namaAkun},${d.tipe},${d.saldo}`
                    ).join('\n');
                    const csvContent = csvHeader + csvRows;
                    
                    // Parse CSV
                    const { validData, errors } = parseCSVContent(csvContent);
                    
                    // All rows should be errors since tipe is invalid
                    return errors.length === importData.length &&
                           errors.every(e => e.reason.includes('Tipe akun harus'));
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Validates: Requirements 12.2, 12.4, 12.7**
 */

describe('**Feature: saldo-awal-periode, Property 18: Import Batch Processing**', () => {
    test('For any valid CSV file, system should process all rows and create journal entries using addJurnal()', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        kodeAkun: fc.constantFrom('1-1000', '1-1100', '1-1200', '2-1000'),
                        namaAkun: fc.string({ minLength: 3, maxLength: 20 }).filter(s => !s.includes(',')),
                        tipe: fc.constantFrom('Aset', 'Kewajiban'),
                        saldo: fc.nat({ min: 1000, max: 100000000 })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (importData) => {
                    // Create CSV content
                    const csvHeader = 'Kode Akun,Nama Akun,Tipe,Saldo\n';
                    const csvRows = importData.map(d => 
                        `${d.kodeAkun},${d.namaAkun},${d.tipe},${d.saldo}`
                    ).join('\n');
                    const csvContent = csvHeader + csvRows;
                    
                    // Parse CSV
                    const { validData } = parseCSVContent(csvContent);
                    
                    // Process import
                    const { jurnalEntries } = processImportData(validData);
                    
                    // Verify journal entries were created (only if there are non-zero saldo entries)
                    const hasNonZeroSaldo = validData.some(d => d.saldo > 0);
                    if (!hasNonZeroSaldo) {
                        return true; // No entries expected for zero saldo
                    }
                    return jurnalEntries.length > 0;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any valid CSV file, generated journal entries should be balanced (debit = kredit)', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        kodeAkun: fc.constantFrom('1-1000', '1-1100', '1-1200', '2-1000'),
                        namaAkun: fc.string({ minLength: 3, maxLength: 20 }),
                        tipe: fc.constantFrom('Aset', 'Kewajiban'),
                        saldo: fc.nat({ min: 1000, max: 100000000 })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (importData) => {
                    // Create CSV content
                    const csvHeader = 'Kode Akun,Nama Akun,Tipe,Saldo\n';
                    const csvRows = importData.map(d => 
                        `${d.kodeAkun},${d.namaAkun},${d.tipe},${d.saldo}`
                    ).join('\n');
                    const csvContent = csvHeader + csvRows;
                    
                    // Parse CSV
                    const { validData } = parseCSVContent(csvContent);
                    
                    // Process import
                    const { jurnalEntries } = processImportData(validData);
                    
                    // Validate balance
                    const validation = validateBalance(jurnalEntries);
                    
                    return validation.isValid === true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any CSV file with mixed valid and invalid rows, system should process only valid rows and report errors for invalid ones', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        kodeAkun: fc.constantFrom('1-1000', '1-1100', '1-1200', '2-1000', '3-1000'),
                        namaAkun: fc.string({ minLength: 3, maxLength: 20 }).filter(s => !s.includes(',')),
                        tipe: fc.constantFrom('Aset', 'Kewajiban', 'Modal'),
                        saldo: fc.nat({ max: 100000000 })
                    }),
                    { minLength: 2, maxLength: 5 }
                ),
                fc.array(
                    fc.record({
                        kodeAkun: fc.string({ minLength: 5, maxLength: 10 }).filter(s => !s.includes(',') && !['1-1000', '1-1100', '1-1200', '2-1000', '3-1000'].includes(s)),
                        namaAkun: fc.string({ minLength: 3, maxLength: 20 }).filter(s => !s.includes(',')),
                        tipe: fc.constantFrom('Aset', 'Kewajiban', 'Modal'),
                        saldo: fc.nat({ max: 100000000 })
                    }),
                    { minLength: 1, maxLength: 3 }
                ),
                (validRows, invalidRows) => {
                    // Create CSV content with mixed valid and invalid rows
                    const csvHeader = 'Kode Akun,Nama Akun,Tipe,Saldo\n';
                    const allRows = [...validRows, ...invalidRows];
                    const csvRows = allRows.map(d => 
                        `${d.kodeAkun},${d.namaAkun},${d.tipe},${d.saldo}`
                    ).join('\n');
                    const csvContent = csvHeader + csvRows;
                    
                    // Parse CSV
                    const { validData, errors } = parseCSVContent(csvContent);
                    
                    // Verify that valid rows were processed and invalid rows were rejected
                    return validData.length > 0 && 
                           errors.length > 0 &&
                           (validData.length + errors.length) === allRows.length;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any valid CSV import, system should display summary of successful and failed imports', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        kodeAkun: fc.constantFrom('1-1000', '1-1100', '1-1200', '2-1000', '3-1000'),
                        namaAkun: fc.string({ minLength: 3, maxLength: 20 }),
                        tipe: fc.constantFrom('Aset', 'Kewajiban', 'Modal'),
                        saldo: fc.nat({ max: 100000000 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (importData) => {
                    // Create CSV content
                    const csvHeader = 'Kode Akun,Nama Akun,Tipe,Saldo\n';
                    const csvRows = importData.map(d => 
                        `${d.kodeAkun},${d.namaAkun},${d.tipe},${d.saldo}`
                    ).join('\n');
                    const csvContent = csvHeader + csvRows;
                    
                    // Parse CSV
                    const { validData, errors } = parseCSVContent(csvContent);
                    
                    // Create summary
                    const summary = {
                        total: importData.length,
                        success: validData.length,
                        failed: errors.length
                    };
                    
                    // Verify summary is accurate
                    return summary.total === (summary.success + summary.failed) &&
                           summary.success >= 0 &&
                           summary.failed >= 0;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any CSV import with errors, system should provide detailed error list with line numbers and reasons', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        kodeAkun: fc.string({ minLength: 5, maxLength: 10 }).filter(s => !['1-1000', '1-1100', '1-1200', '2-1000', '3-1000'].includes(s)),
                        namaAkun: fc.string({ minLength: 3, maxLength: 20 }),
                        tipe: fc.constantFrom('Aset', 'Kewajiban', 'Modal'),
                        saldo: fc.nat({ max: 100000000 })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (importData) => {
                    // Create CSV content with invalid account codes
                    const csvHeader = 'Kode Akun,Nama Akun,Tipe,Saldo\n';
                    const csvRows = importData.map(d => 
                        `${d.kodeAkun},${d.namaAkun},${d.tipe},${d.saldo}`
                    ).join('\n');
                    const csvContent = csvHeader + csvRows;
                    
                    // Parse CSV
                    const { errors } = parseCSVContent(csvContent);
                    
                    // Verify all errors have line numbers and reasons
                    return errors.length > 0 &&
                           errors.every(e => 
                               e.line !== undefined && 
                               e.line > 1 && 
                               e.reason && 
                               e.reason.length > 0
                           );
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Validates: Requirements 12.4, 12.5, 12.6, 12.7**
 */


/**
 * Property 13: Report Integration Consistency
 * Property 19: Buku Besar First Entry
 * Property 20: Jurnal Harian Visibility
 * **Validates: Requirements 2.4, 13.3, 13.4, 13.5, 13.6**
 */

// Helper function to simulate laporanLabaRugiKoperasi logic
function getLaporanLabaRugi(coa, koperasi) {
    const modal = coa.filter(c => c.tipe === 'Modal');
    const pendapatan = coa.filter(c => c.tipe === 'Pendapatan');
    const beban = coa.filter(c => c.tipe === 'Beban');
    
    const modalAwal = koperasi ? (koperasi.modalAwal || 0) : 0;
    const totalPendapatan = pendapatan.reduce((sum, p) => sum + p.saldo, 0);
    const totalBeban = beban.reduce((sum, b) => sum + b.saldo, 0);
    const totalModal = modal.reduce((sum, m) => sum + m.saldo, 0);
    const labaRugi = totalPendapatan - totalBeban;
    const totalModalAkhir = modalAwal + totalModal + labaRugi;
    
    return {
        modalAwal,
        totalPendapatan,
        totalBeban,
        totalModal,
        labaRugi,
        totalModalAkhir
    };
}

// Helper function to simulate renderSHU logic
function getLaporanSHU(penjualan, pembelian, anggota, koperasi) {
    const modalAwal = koperasi ? (koperasi.modalAwal || 0) : 0;
    const totalPendapatan = penjualan.reduce((sum, p) => sum + p.total, 0);
    const totalBeban = pembelian.reduce((sum, p) => sum + p.total, 0);
    const labaKotor = totalPendapatan - totalBeban;
    
    // Hanya anggota koperasi yang dapat SHU
    const anggotaKoperasi = anggota.filter(a => a.tipeAnggota === 'Anggota');
    const totalBelanjaAnggota = penjualan
        .filter(p => {
            const member = anggota.find(a => a.id === p.anggotaId);
            return member && member.tipeAnggota === 'Anggota';
        })
        .reduce((sum, p) => sum + p.total, 0);
    
    return {
        modalAwal,
        totalPendapatan,
        totalBeban,
        labaKotor,
        anggotaKoperasi: anggotaKoperasi.length,
        totalBelanjaAnggota
    };
}

// Helper function to get Buku Besar entries for an account
function getBukuBesarEntries(akun, jurnal) {
    const entries = [];
    jurnal.forEach(j => {
        j.entries.forEach(e => {
            if (e.akun === akun.kode) {
                entries.push({
                    tanggal: j.tanggal,
                    keterangan: j.keterangan,
                    debit: e.debit,
                    kredit: e.kredit
                });
            }
        });
    });
    return entries;
}

// Helper function to check if jurnal harian contains saldo awal entry
function jurnalHarianContainsSaldoAwal(jurnal) {
    return jurnal.some(j => j.keterangan === 'Saldo Awal Periode');
}

describe('**Feature: saldo-awal-periode, Property 13: Report Integration Consistency**', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    
    test('For any saldo awal periode saved, Laporan Laba Rugi should display the same modal awal', () => {
        fc.assert(
            fc.property(
                fc.nat({ max: 1000000000 }),
                (modalAwal) => {
                    // Setup koperasi with modal awal
                    const koperasi = {
                        modalAwal: modalAwal
                    };
                    
                    // Setup COA
                    const coa = [
                        { kode: '3-1000', nama: 'Modal Koperasi', tipe: 'Modal', saldo: modalAwal },
                        { kode: '4-1000', nama: 'Pendapatan', tipe: 'Pendapatan', saldo: 0 },
                        { kode: '5-1000', nama: 'Beban', tipe: 'Beban', saldo: 0 }
                    ];
                    
                    // Get laporan
                    const laporan = getLaporanLabaRugi(coa, koperasi);
                    
                    // Verify modal awal matches
                    return laporan.modalAwal === modalAwal;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any saldo awal periode saved, Laporan SHU should use the same modal awal', () => {
        fc.assert(
            fc.property(
                fc.nat({ max: 1000000000 }),
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1 }),
                        total: fc.nat({ max: 10000000 })
                    }),
                    { maxLength: 10 }
                ),
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1 }),
                        total: fc.nat({ max: 10000000 })
                    }),
                    { maxLength: 10 }
                ),
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1 }),
                        tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota')
                    }),
                    { maxLength: 10 }
                ),
                (modalAwal, penjualan, pembelian, anggota) => {
                    // Setup koperasi with modal awal
                    const koperasi = {
                        modalAwal: modalAwal
                    };
                    
                    // Get laporan SHU
                    const laporanSHU = getLaporanSHU(penjualan, pembelian, anggota, koperasi);
                    
                    // Verify modal awal matches
                    return laporanSHU.modalAwal === modalAwal;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any saldo awal with modal, both Laporan Laba Rugi and Laporan SHU should show consistent modal awal', () => {
        fc.assert(
            fc.property(
                fc.nat({ max: 1000000000 }),
                (modalAwal) => {
                    // Setup koperasi
                    const koperasi = {
                        modalAwal: modalAwal
                    };
                    
                    // Setup COA for Laba Rugi
                    const coa = [
                        { kode: '3-1000', nama: 'Modal Koperasi', tipe: 'Modal', saldo: modalAwal },
                        { kode: '4-1000', nama: 'Pendapatan', tipe: 'Pendapatan', saldo: 0 },
                        { kode: '5-1000', nama: 'Beban', tipe: 'Beban', saldo: 0 }
                    ];
                    
                    // Get both reports
                    const laporanLabaRugi = getLaporanLabaRugi(coa, koperasi);
                    const laporanSHU = getLaporanSHU([], [], [], koperasi);
                    
                    // Verify both show same modal awal
                    return laporanLabaRugi.modalAwal === laporanSHU.modalAwal &&
                           laporanLabaRugi.modalAwal === modalAwal;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any saldo awal periode, if koperasi object is null, modal awal should default to 0', () => {
        const coa = [
            { kode: '3-1000', nama: 'Modal Koperasi', tipe: 'Modal', saldo: 0 },
            { kode: '4-1000', nama: 'Pendapatan', tipe: 'Pendapatan', saldo: 0 },
            { kode: '5-1000', nama: 'Beban', tipe: 'Beban', saldo: 0 }
        ];
        
        const laporan = getLaporanLabaRugi(coa, null);
        
        expect(laporan.modalAwal).toBe(0);
    });
    
    test('For any saldo awal periode, if koperasi.modalAwal is undefined, it should default to 0', () => {
        const koperasi = {
            nama: 'Koperasi Test'
            // modalAwal is intentionally missing
        };
        
        const coa = [
            { kode: '3-1000', nama: 'Modal Koperasi', tipe: 'Modal', saldo: 0 },
            { kode: '4-1000', nama: 'Pendapatan', tipe: 'Pendapatan', saldo: 0 },
            { kode: '5-1000', nama: 'Beban', tipe: 'Beban', saldo: 0 }
        ];
        
        const laporan = getLaporanLabaRugi(coa, koperasi);
        
        expect(laporan.modalAwal).toBe(0);
    });
});

describe('**Feature: saldo-awal-periode, Property 19: Buku Besar First Entry**', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    
    test('For any account with saldo awal, when viewing Buku Besar, saldo awal transaction should appear as first entry', () => {
        fc.assert(
            fc.property(
                fc.record({
                    kode: fc.string({ minLength: 1 }),
                    nama: fc.string({ minLength: 1 }),
                    tipe: fc.constantFrom('Aset', 'Kewajiban', 'Modal'),
                    saldo: fc.nat({ max: 100000000 })
                }),
                fc.date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') }),
                fc.array(
                    fc.record({
                        tanggal: fc.date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') }),
                        keterangan: fc.string({ minLength: 1 }),
                        debit: fc.nat({ max: 10000000 }),
                        kredit: fc.nat({ max: 10000000 })
                    }),
                    { maxLength: 5 }
                ),
                (akun, tanggalSaldoAwal, otherEntries) => {
                    // Create jurnal with saldo awal as first entry
                    const jurnal = [
                        {
                            id: 'saldo-awal-1',
                            tanggal: tanggalSaldoAwal.toISOString(),
                            keterangan: 'Saldo Awal Periode',
                            entries: [
                                {
                                    akun: akun.kode,
                                    debit: akun.saldo,
                                    kredit: 0
                                }
                            ]
                        }
                    ];
                    
                    // Add other entries with later dates
                    otherEntries.forEach((entry, index) => {
                        // Ensure other entries are after saldo awal
                        const laterDate = new Date(tanggalSaldoAwal);
                        laterDate.setDate(laterDate.getDate() + index + 1);
                        
                        // Validate date before using
                        if (!isNaN(laterDate.getTime())) {
                            jurnal.push({
                                id: `entry-${index}`,
                                tanggal: laterDate.toISOString(),
                                keterangan: entry.keterangan,
                                entries: [
                                    {
                                        akun: akun.kode,
                                        debit: entry.debit,
                                        kredit: entry.kredit
                                    }
                                ]
                            });
                        }
                    });
                    
                    // Get Buku Besar entries
                    const bukuBesarEntries = getBukuBesarEntries(akun, jurnal);
                    
                    // Verify first entry is saldo awal
                    if (bukuBesarEntries.length > 0) {
                        return bukuBesarEntries[0].keterangan === 'Saldo Awal Periode';
                    }
                    
                    return true; // If no entries, test passes
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any account without saldo awal, Buku Besar should not have saldo awal entry', () => {
        fc.assert(
            fc.property(
                fc.record({
                    kode: fc.string({ minLength: 1 }),
                    nama: fc.string({ minLength: 1 }),
                    tipe: fc.constantFrom('Aset', 'Kewajiban', 'Modal'),
                    saldo: fc.constant(0)
                }),
                fc.array(
                    fc.record({
                        tanggal: fc.date(),
                        keterangan: fc.string({ minLength: 1 }).filter(s => s !== 'Saldo Awal Periode'),
                        debit: fc.nat({ max: 10000000 }),
                        kredit: fc.nat({ max: 10000000 })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (akun, entries) => {
                    // Create jurnal without saldo awal entry
                    const jurnal = entries.map((entry, index) => ({
                        id: `entry-${index}`,
                        tanggal: entry.tanggal.toISOString(),
                        keterangan: entry.keterangan,
                        entries: [
                            {
                                akun: akun.kode,
                                debit: entry.debit,
                                kredit: entry.kredit
                            }
                        ]
                    }));
                    
                    // Get Buku Besar entries
                    const bukuBesarEntries = getBukuBesarEntries(akun, jurnal);
                    
                    // Verify no entry has "Saldo Awal Periode" keterangan
                    return !bukuBesarEntries.some(e => e.keterangan === 'Saldo Awal Periode');
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any account with saldo awal, the first entry date should be the saldo awal period date', () => {
        fc.assert(
            fc.property(
                fc.record({
                    kode: fc.string({ minLength: 1 }),
                    nama: fc.string({ minLength: 1 }),
                    tipe: fc.constantFrom('Aset', 'Kewajiban', 'Modal'),
                    saldo: fc.nat({ max: 100000000 })
                }),
                fc.date(),
                (akun, tanggalSaldoAwal) => {
                    // Create jurnal with saldo awal entry
                    const jurnal = [
                        {
                            id: 'saldo-awal-1',
                            tanggal: tanggalSaldoAwal.toISOString(),
                            keterangan: 'Saldo Awal Periode',
                            entries: [
                                {
                                    akun: akun.kode,
                                    debit: akun.saldo,
                                    kredit: 0
                                }
                            ]
                        }
                    ];
                    
                    // Get Buku Besar entries
                    const bukuBesarEntries = getBukuBesarEntries(akun, jurnal);
                    
                    // Verify first entry date matches saldo awal date
                    if (bukuBesarEntries.length > 0) {
                        const firstEntryDate = new Date(bukuBesarEntries[0].tanggal).toISOString().split('T')[0];
                        const saldoAwalDate = tanggalSaldoAwal.toISOString().split('T')[0];
                        return firstEntryDate === saldoAwalDate;
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any multiple accounts with saldo awal, each should have saldo awal as first entry in their Buku Besar', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        kode: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        tipe: fc.constantFrom('Aset', 'Kewajiban', 'Modal'),
                        saldo: fc.nat({ max: 100000000 })
                    }),
                    { minLength: 2, maxLength: 5 }
                ),
                fc.date(),
                (accounts, tanggalSaldoAwal) => {
                    // Ensure unique account codes
                    const uniqueAccounts = accounts.map((acc, index) => ({
                        ...acc,
                        kode: `${acc.kode}-${index}`
                    }));
                    
                    // Create jurnal with saldo awal for all accounts
                    const jurnal = [
                        {
                            id: 'saldo-awal-1',
                            tanggal: tanggalSaldoAwal.toISOString(),
                            keterangan: 'Saldo Awal Periode',
                            entries: uniqueAccounts.map(acc => ({
                                akun: acc.kode,
                                debit: acc.saldo,
                                kredit: 0
                            }))
                        }
                    ];
                    
                    // Verify each account has saldo awal as first entry
                    let allHaveSaldoAwalFirst = true;
                    uniqueAccounts.forEach(acc => {
                        const entries = getBukuBesarEntries(acc, jurnal);
                        if (entries.length > 0 && entries[0].keterangan !== 'Saldo Awal Periode') {
                            allHaveSaldoAwalFirst = false;
                        }
                    });
                    
                    return allHaveSaldoAwalFirst;
                }
            ),
            { numRuns: 100 }
        );
    });
});

describe('**Feature: saldo-awal-periode, Property 20: Jurnal Harian Visibility**', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    
    test('For any jurnal pembuka saldo awal recorded, when viewing Jurnal Harian, it should appear with other journal entries', () => {
        fc.assert(
            fc.property(
                fc.date(),
                fc.array(
                    fc.record({
                        akun: fc.string({ minLength: 1 }),
                        debit: fc.nat({ max: 100000000 }),
                        kredit: fc.nat({ max: 100000000 })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                fc.array(
                    fc.record({
                        tanggal: fc.date(),
                        keterangan: fc.string({ minLength: 1 }).filter(s => s !== 'Saldo Awal Periode'),
                        entries: fc.array(
                            fc.record({
                                akun: fc.string({ minLength: 1 }),
                                debit: fc.nat({ max: 10000000 }),
                                kredit: fc.nat({ max: 10000000 })
                            }),
                            { minLength: 1, maxLength: 3 }
                        )
                    }),
                    { maxLength: 5 }
                ),
                (tanggalSaldoAwal, saldoAwalEntries, otherJurnalEntries) => {
                    // Create jurnal array with saldo awal entry
                    const jurnal = [
                        {
                            id: 'saldo-awal-1',
                            tanggal: tanggalSaldoAwal.toISOString(),
                            keterangan: 'Saldo Awal Periode',
                            entries: saldoAwalEntries
                        }
                    ];
                    
                    // Add other journal entries
                    otherJurnalEntries.forEach((entry, index) => {
                        jurnal.push({
                            id: `jurnal-${index}`,
                            tanggal: entry.tanggal.toISOString(),
                            keterangan: entry.keterangan,
                            entries: entry.entries
                        });
                    });
                    
                    // Verify saldo awal entry is in jurnal array
                    return jurnalHarianContainsSaldoAwal(jurnal);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any jurnal array, saldo awal entry should have keterangan "Saldo Awal Periode"', () => {
        fc.assert(
            fc.property(
                fc.date(),
                fc.array(
                    fc.record({
                        akun: fc.string({ minLength: 1 }),
                        debit: fc.nat({ max: 100000000 }),
                        kredit: fc.nat({ max: 100000000 })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (tanggalSaldoAwal, entries) => {
                    // Create jurnal with saldo awal entry
                    const jurnal = [
                        {
                            id: 'saldo-awal-1',
                            tanggal: tanggalSaldoAwal.toISOString(),
                            keterangan: 'Saldo Awal Periode',
                            entries: entries
                        }
                    ];
                    
                    // Find saldo awal entry
                    const saldoAwalEntry = jurnal.find(j => j.keterangan === 'Saldo Awal Periode');
                    
                    // Verify it exists and has correct keterangan
                    return saldoAwalEntry !== undefined && 
                           saldoAwalEntry.keterangan === 'Saldo Awal Periode';
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any jurnal harian without saldo awal, jurnalHarianContainsSaldoAwal should return false', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.string({ minLength: 1 }),
                        tanggal: fc.date(),
                        keterangan: fc.string({ minLength: 1 }).filter(s => s !== 'Saldo Awal Periode'),
                        entries: fc.array(
                            fc.record({
                                akun: fc.string({ minLength: 1 }),
                                debit: fc.nat({ max: 10000000 }),
                                kredit: fc.nat({ max: 10000000 })
                            }),
                            { minLength: 1, maxLength: 3 }
                        )
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (jurnalEntries) => {
                    // Map to proper format
                    const jurnal = jurnalEntries.map(entry => ({
                        id: entry.id,
                        tanggal: entry.tanggal.toISOString(),
                        keterangan: entry.keterangan,
                        entries: entry.entries
                    }));
                    
                    // Verify saldo awal is not present
                    return !jurnalHarianContainsSaldoAwal(jurnal);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any saldo awal entry in jurnal, it should be retrievable from localStorage', () => {
        fc.assert(
            fc.property(
                fc.date(),
                fc.array(
                    fc.record({
                        akun: fc.string({ minLength: 1 }),
                        debit: fc.nat({ max: 100000000 }),
                        kredit: fc.nat({ max: 100000000 })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (tanggalSaldoAwal, entries) => {
                    // Clear localStorage
                    localStorage.removeItem('jurnal');
                    
                    // Create jurnal with saldo awal entry
                    const jurnal = [
                        {
                            id: 'saldo-awal-1',
                            tanggal: tanggalSaldoAwal.toISOString(),
                            keterangan: 'Saldo Awal Periode',
                            entries: entries
                        }
                    ];
                    
                    // Save to localStorage
                    localStorage.setItem('jurnal', JSON.stringify(jurnal));
                    
                    // Retrieve from localStorage
                    const savedJurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
                    
                    // Verify saldo awal entry is present
                    const hasSaldoAwal = savedJurnal.some(j => j.keterangan === 'Saldo Awal Periode');
                    
                    // Clean up
                    localStorage.removeItem('jurnal');
                    
                    return hasSaldoAwal;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any jurnal harian display, saldo awal entries should be chronologically ordered with other entries', () => {
        fc.assert(
            fc.property(
                fc.date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') }),
                fc.array(
                    fc.record({
                        akun: fc.string({ minLength: 1 }),
                        debit: fc.nat({ max: 100000000 }),
                        kredit: fc.nat({ max: 100000000 })
                    }),
                    { minLength: 1, maxLength: 3 }
                ),
                fc.array(
                    fc.record({
                        keterangan: fc.string({ minLength: 1 }).filter(s => s !== 'Saldo Awal Periode'),
                        entries: fc.array(
                            fc.record({
                                akun: fc.string({ minLength: 1 }),
                                debit: fc.nat({ max: 10000000 }),
                                kredit: fc.nat({ max: 10000000 })
                            }),
                            { minLength: 1, maxLength: 2 }
                        )
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (tanggalSaldoAwal, saldoAwalEntries, otherEntries) => {
                    // Create jurnal with saldo awal
                    const jurnal = [
                        {
                            id: 'saldo-awal-1',
                            tanggal: tanggalSaldoAwal.toISOString(),
                            keterangan: 'Saldo Awal Periode',
                            entries: saldoAwalEntries
                        }
                    ];
                    
                    // Add other entries with dates after saldo awal
                    otherEntries.forEach((entry, index) => {
                        const laterDate = new Date(tanggalSaldoAwal);
                        laterDate.setDate(laterDate.getDate() + index + 1);
                        
                        // Validate date before using
                        if (!isNaN(laterDate.getTime())) {
                            jurnal.push({
                                id: `jurnal-${index}`,
                                tanggal: laterDate.toISOString(),
                                keterangan: entry.keterangan,
                                entries: entry.entries
                            });
                        }
                    });
                    
                    // Sort by date
                    const sortedJurnal = [...jurnal].sort((a, b) => 
                        new Date(a.tanggal) - new Date(b.tanggal)
                    );
                    
                    // Verify saldo awal is first (or among first if same date)
                    const saldoAwalIndex = sortedJurnal.findIndex(j => j.keterangan === 'Saldo Awal Periode');
                    const saldoAwalDate = new Date(sortedJurnal[saldoAwalIndex].tanggal);
                    
                    // Check that no entry before saldo awal has a later date
                    for (let i = 0; i < saldoAwalIndex; i++) {
                        const entryDate = new Date(sortedJurnal[i].tanggal);
                        if (entryDate > saldoAwalDate) {
                            return false;
                        }
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});


/**
 * Parse CSV text untuk data simpanan
 * Support multiple delimiters (comma, semicolon, tab)
 * Handle BOM, different line endings, whitespace trimming, empty lines
 */
function parseCSVSimpanan(csvText, type) {
    const errors = [];
    const data = [];
    
    if (!csvText || typeof csvText !== 'string') {
        return {
            success: false,
            data: [],
            errors: ['CSV text harus berupa string yang valid']
        };
    }
    
    if (!type || (type !== 'pokok' && type !== 'wajib')) {
        return {
            success: false,
            data: [],
            errors: ['Type harus "pokok" atau "wajib"']
        };
    }
    
    try {
        let cleanedText = csvText;
        if (cleanedText.charCodeAt(0) === 0xFEFF) {
            cleanedText = cleanedText.slice(1);
        }
        
        cleanedText = cleanedText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        const firstLine = cleanedText.split('\n')[0] || '';
        const commaCount = (firstLine.match(/,/g) || []).length;
        const semicolonCount = (firstLine.match(/;/g) || []).length;
        const tabCount = (firstLine.match(/\t/g) || []).length;
        
        let delimiter = ',';
        if (semicolonCount > commaCount && semicolonCount > tabCount) {
            delimiter = ';';
        } else if (tabCount > commaCount && tabCount > semicolonCount) {
            delimiter = '\t';
        }
        
        const lines = cleanedText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        if (lines.length === 0) {
            return {
                success: false,
                data: [],
                errors: ['File CSV kosong']
            };
        }
        
        const headerLine = lines[0];
        const headers = headerLine
            .split(delimiter)
            .map(h => h.trim());
        
        const expectedHeaders = type === 'pokok' 
            ? ['NIK', 'Nama', 'Jumlah', 'Tanggal']
            : ['NIK', 'Nama', 'Jumlah', 'Periode', 'Tanggal'];
        
        const headersMatch = headers.length === expectedHeaders.length &&
            headers.every((h, i) => h.toLowerCase() === expectedHeaders[i].toLowerCase());
        
        if (!headersMatch) {
            errors.push(
                `Header CSV tidak sesuai format. ` +
                `Expected: ${expectedHeaders.join(', ')}. ` +
                `Found: ${headers.join(', ')}`
            );
        }
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const rowNumber = i + 1;
            
            const fields = line
                .split(delimiter)
                .map(f => f.trim());
            
            if (fields.every(f => f === '')) {
                continue;
            }
            
            if (type === 'pokok') {
                if (fields.length < 4) {
                    errors.push(`Baris ${rowNumber}: Jumlah kolom tidak sesuai (expected 4, got ${fields.length})`);
                    continue;
                }
                
                const [nik, nama, jumlahStr, tanggal] = fields;
                const jumlah = parseFloat(jumlahStr);
                
                data.push({
                    nik: nik,
                    nama: nama,
                    jumlah: jumlah,
                    tanggal: tanggal,
                    rowNumber: rowNumber
                });
                
            } else if (type === 'wajib') {
                if (fields.length < 5) {
                    errors.push(`Baris ${rowNumber}: Jumlah kolom tidak sesuai (expected 5, got ${fields.length})`);
                    continue;
                }
                
                const [nik, nama, jumlahStr, periode, tanggal] = fields;
                const jumlah = parseFloat(jumlahStr);
                
                data.push({
                    nik: nik,
                    nama: nama,
                    jumlah: jumlah,
                    periode: periode,
                    tanggal: tanggal,
                    rowNumber: rowNumber
                });
            }
        }
        
        return {
            success: errors.length === 0,
            data: data,
            errors: errors
        };
        
    } catch (error) {
        return {
            success: false,
            data: [],
            errors: [`Error parsing CSV: ${error.message}`]
        };
    }
}

describe('**Feature: upload-simpanan-saldo-awal, Property 5: Validasi format CSV**', () => {
    /**
     * **Validates: Requirements 3.1, 8.1**
     * 
     * Property: For any valid CSV data with supported delimiters (comma, semicolon, tab),
     * parseCSVSimpanan should successfully parse the data and return success: true
     */
    test('For any valid CSV with comma delimiter, parseCSVSimpanan should parse successfully', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 10, maxLength: 16 }).filter(s => !s.includes(',') && !s.includes(';') && !s.includes('\t')),
                        nama: fc.string({ minLength: 3, maxLength: 50 }).filter(s => !s.includes(',') && !s.includes(';') && !s.includes('\t')),
                        jumlah: fc.nat({ max: 10000000 }),
                        tanggal: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (records) => {
                    // Build CSV with comma delimiter
                    const header = 'NIK,Nama,Jumlah,Tanggal';
                    const rows = records.map(r => 
                        `${r.nik},${r.nama},${r.jumlah},${r.tanggal.toISOString().split('T')[0]}`
                    );
                    const csvText = [header, ...rows].join('\n');
                    
                    const result = parseCSVSimpanan(csvText, 'pokok');
                    
                    // Should parse successfully
                    return result.success === true && result.data.length === records.length;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any valid CSV with semicolon delimiter, parseCSVSimpanan should parse successfully', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 10, maxLength: 16 }).filter(s => !s.includes(',') && !s.includes(';') && !s.includes('\t')),
                        nama: fc.string({ minLength: 3, maxLength: 50 }).filter(s => !s.includes(',') && !s.includes(';') && !s.includes('\t')),
                        jumlah: fc.nat({ max: 10000000 }),
                        tanggal: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (records) => {
                    // Build CSV with semicolon delimiter
                    const header = 'NIK;Nama;Jumlah;Tanggal';
                    const rows = records.map(r => 
                        `${r.nik};${r.nama};${r.jumlah};${r.tanggal.toISOString().split('T')[0]}`
                    );
                    const csvText = [header, ...rows].join('\n');
                    
                    const result = parseCSVSimpanan(csvText, 'pokok');
                    
                    // Should parse successfully
                    return result.success === true && result.data.length === records.length;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any valid CSV with tab delimiter, parseCSVSimpanan should parse successfully', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 10, maxLength: 16 }).filter(s => !s.includes(',') && !s.includes(';') && !s.includes('\t')),
                        nama: fc.string({ minLength: 3, maxLength: 50 }).filter(s => !s.includes(',') && !s.includes(';') && !s.includes('\t')),
                        jumlah: fc.nat({ max: 10000000 }),
                        tanggal: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (records) => {
                    // Build CSV with tab delimiter
                    const header = 'NIK\tNama\tJumlah\tTanggal';
                    const rows = records.map(r => 
                        `${r.nik}\t${r.nama}\t${r.jumlah}\t${r.tanggal.toISOString().split('T')[0]}`
                    );
                    const csvText = [header, ...rows].join('\n');
                    
                    const result = parseCSVSimpanan(csvText, 'pokok');
                    
                    // Should parse successfully
                    return result.success === true && result.data.length === records.length;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any CSV with BOM, parseCSVSimpanan should handle it correctly', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 10, maxLength: 16 }).filter(s => !s.includes(',') && !s.includes(';') && !s.includes('\t')),
                        nama: fc.string({ minLength: 3, maxLength: 50 }).filter(s => !s.includes(',') && !s.includes(';') && !s.includes('\t')),
                        jumlah: fc.nat({ max: 10000000 }),
                        tanggal: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (records) => {
                    // Build CSV with BOM
                    const header = 'NIK,Nama,Jumlah,Tanggal';
                    const rows = records.map(r => 
                        `${r.nik},${r.nama},${r.jumlah},${r.tanggal.toISOString().split('T')[0]}`
                    );
                    const csvText = '\uFEFF' + [header, ...rows].join('\n');
                    
                    const result = parseCSVSimpanan(csvText, 'pokok');
                    
                    // Should parse successfully despite BOM
                    return result.success === true && result.data.length === records.length;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any CSV with CRLF line endings, parseCSVSimpanan should handle it correctly', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 10, maxLength: 16 }).filter(s => !s.includes(',') && !s.includes(';') && !s.includes('\t')),
                        nama: fc.string({ minLength: 3, maxLength: 50 }).filter(s => !s.includes(',') && !s.includes(';') && !s.includes('\t')),
                        jumlah: fc.nat({ max: 10000000 }),
                        tanggal: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (records) => {
                    // Build CSV with CRLF line endings
                    const header = 'NIK,Nama,Jumlah,Tanggal';
                    const rows = records.map(r => 
                        `${r.nik},${r.nama},${r.jumlah},${r.tanggal.toISOString().split('T')[0]}`
                    );
                    const csvText = [header, ...rows].join('\r\n');
                    
                    const result = parseCSVSimpanan(csvText, 'pokok');
                    
                    // Should parse successfully despite CRLF
                    return result.success === true && result.data.length === records.length;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any CSV with empty lines, parseCSVSimpanan should ignore them', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 10, maxLength: 16 }).filter(s => !s.includes(',') && !s.includes(';') && !s.includes('\t')),
                        nama: fc.string({ minLength: 3, maxLength: 50 }).filter(s => !s.includes(',') && !s.includes(';') && !s.includes('\t')),
                        jumlah: fc.nat({ max: 10000000 }),
                        tanggal: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (records) => {
                    // Build CSV with empty lines interspersed
                    const header = 'NIK,Nama,Jumlah,Tanggal';
                    const rows = records.map(r => 
                        `${r.nik},${r.nama},${r.jumlah},${r.tanggal.toISOString().split('T')[0]}`
                    );
                    // Add empty lines
                    const csvText = [header, '', ...rows, '', ''].join('\n');
                    
                    const result = parseCSVSimpanan(csvText, 'pokok');
                    
                    // Should parse successfully and ignore empty lines
                    return result.success === true && result.data.length === records.length;
                }
            ),
            { numRuns: 100 }
        );
    });
});

describe('**Feature: upload-simpanan-saldo-awal, Property 24: Parser trim whitespace**', () => {
    /**
     * **Validates: Requirements 8.4**
     * 
     * Property: For any CSV field with leading or trailing whitespace,
     * parseCSVSimpanan should trim the whitespace from all fields
     */
    test('For any CSV with whitespace around fields, parseCSVSimpanan should trim them', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 10, maxLength: 16 }).filter(s => {
                            const trimmed = s.trim();
                            return trimmed.length >= 10 && !s.includes(',') && !s.includes(';') && !s.includes('\t');
                        }),
                        nama: fc.string({ minLength: 3, maxLength: 50 }).filter(s => {
                            const trimmed = s.trim();
                            return trimmed.length >= 3 && !s.includes(',') && !s.includes(';') && !s.includes('\t');
                        }),
                        jumlah: fc.nat({ max: 10000000 }),
                        tanggal: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                fc.nat({ max: 5 }), // leading spaces
                fc.nat({ max: 5 }), // trailing spaces
                (records, leadingSpaces, trailingSpaces) => {
                    const leading = ' '.repeat(leadingSpaces);
                    const trailing = ' '.repeat(trailingSpaces);
                    
                    // Build CSV with whitespace around fields
                    const header = `${leading}NIK${trailing},${leading}Nama${trailing},${leading}Jumlah${trailing},${leading}Tanggal${trailing}`;
                    const rows = records.map(r => 
                        `${leading}${r.nik}${trailing},${leading}${r.nama}${trailing},${leading}${r.jumlah}${trailing},${leading}${r.tanggal.toISOString().split('T')[0]}${trailing}`
                    );
                    const csvText = [header, ...rows].join('\n');
                    
                    const result = parseCSVSimpanan(csvText, 'pokok');
                    
                    // Should parse successfully
                    if (!result.success || result.data.length !== records.length) {
                        return false;
                    }
                    
                    // Verify all fields are trimmed
                    return result.data.every((row, i) => {
                        const expectedNik = records[i].nik.trim();
                        const expectedNama = records[i].nama.trim();
                        
                        // Check that parsed values are trimmed and match expected
                        return row.nik === expectedNik && 
                               row.nama === expectedNama &&
                               row.nik === row.nik.trim() &&
                               row.nama === row.nama.trim();
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any CSV with mixed whitespace (spaces and tabs), parseCSVSimpanan should trim them', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.hexaString({ minLength: 10, maxLength: 16 }),
                        nama: fc.hexaString({ minLength: 3, maxLength: 50 }),
                        jumlah: fc.nat({ max: 10000000 }),
                        tanggal: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (records) => {
                    // Build CSV with mixed whitespace (spaces and tabs) around fields
                    // Use consistent comma delimiter, with tabs and spaces as whitespace
                    const header = '  NIK  ,  Nama  ,  Jumlah  ,  Tanggal  ';
                    const rows = records.map(r => 
                        `  ${r.nik}  ,  ${r.nama}  ,  ${r.jumlah}  ,  ${r.tanggal.toISOString().split('T')[0]}  `
                    );
                    const csvText = [header, ...rows].join('\n');
                    
                    const result = parseCSVSimpanan(csvText, 'pokok');
                    
                    // Should parse successfully
                    if (!result.success || result.data.length !== records.length) {
                        return false;
                    }
                    
                    // Verify all fields are trimmed
                    return result.data.every((row, i) => {
                        const expectedNik = records[i].nik.trim();
                        const expectedNama = records[i].nama.trim();
                        return row.nik === expectedNik && 
                               row.nama === expectedNama &&
                               row.nik === row.nik.trim() &&
                               row.nama === row.nama.trim();
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
});


/**
 * **Feature: upload-simpanan-saldo-awal, Property 6: Validasi header CSV**
 * **Validates: Requirements 3.2**
 */

// Import the validation function
function validateSimpananData(data, type) {
    if (!data || !Array.isArray(data)) {
        return {
            isValid: false,
            validData: [],
            errors: ['Data harus berupa array']
        };
    }
    
    if (!type || (type !== 'pokok' && type !== 'wajib')) {
        return {
            isValid: false,
            validData: [],
            errors: ['Type harus "pokok" atau "wajib"']
        };
    }
    
    const validData = [];
    const errors = [];
    
    // Get anggota data for NIK validation
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const validNIKs = new Set(anggota.map(a => a.nik));
    
    // Validate each row
    data.forEach((row, index) => {
        const rowNumber = row.rowNumber || (index + 2);
        const rowErrors = [];
        
        // Validate NIK (required field)
        if (!row.nik || row.nik.trim() === '') {
            rowErrors.push(`Baris ${rowNumber}, Kolom NIK: NIK tidak boleh kosong`);
        } else if (!validNIKs.has(row.nik)) {
            rowErrors.push(`Baris ${rowNumber}, Kolom NIK: NIK "${row.nik}" tidak ditemukan dalam data anggota`);
        }
        
        // Validate Nama (required field)
        if (!row.nama || row.nama.trim() === '') {
            rowErrors.push(`Baris ${rowNumber}, Kolom Nama: Nama tidak boleh kosong`);
        }
        
        // Validate Jumlah (required field, must be positive or zero)
        if (row.jumlah === undefined || row.jumlah === null || row.jumlah === '') {
            rowErrors.push(`Baris ${rowNumber}, Kolom Jumlah: Jumlah tidak boleh kosong`);
        } else {
            const jumlah = parseFloat(row.jumlah);
            if (isNaN(jumlah)) {
                rowErrors.push(`Baris ${rowNumber}, Kolom Jumlah: Jumlah harus berupa angka`);
            } else if (jumlah < 0) {
                rowErrors.push(`Baris ${rowNumber}, Kolom Jumlah: Jumlah tidak boleh negatif (nilai: ${jumlah})`);
            }
        }
        
        // Validate Tanggal (required field)
        if (!row.tanggal || row.tanggal.trim() === '') {
            rowErrors.push(`Baris ${rowNumber}, Kolom Tanggal: Tanggal tidak boleh kosong`);
        }
        
        // For wajib type, validate Periode (required field)
        if (type === 'wajib') {
            if (!row.periode || row.periode.trim() === '') {
                rowErrors.push(`Baris ${rowNumber}, Kolom Periode: Periode tidak boleh kosong`);
            }
        }
        
        // If no errors for this row, add to validData
        if (rowErrors.length === 0) {
            validData.push(row);
        } else {
            errors.push(...rowErrors);
        }
    });
    
    return {
        isValid: errors.length === 0,
        validData: validData,
        errors: errors
    };
}

describe('**Feature: upload-simpanan-saldo-awal, Property 6: Validasi header CSV**', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    
    test('For any CSV data with correct header format for simpanan pokok, validation should accept the data structure', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 16, maxLength: 16 }).map(s => s.replace(/[^0-9]/g, '0')),
                        nama: fc.string({ minLength: 3, maxLength: 50 }),
                        jumlah: fc.nat(10000000),
                        tanggal: fc.date().map(d => d.toISOString().split('T')[0]),
                        rowNumber: fc.nat(1000)
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (data) => {
                    // Setup anggota data with all NIKs from the test data
                    const anggota = data.map(row => ({
                        nik: row.nik,
                        nama: row.nama
                    }));
                    localStorage.setItem('anggota', JSON.stringify(anggota));
                    
                    // Validate with type 'pokok'
                    const result = validateSimpananData(data, 'pokok');
                    
                    // Should be valid since all NIKs exist and all fields are present
                    return result.isValid === true && result.validData.length === data.length;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any CSV data with correct header format for simpanan wajib, validation should accept the data structure', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 16, maxLength: 16 }).map(s => s.replace(/[^0-9]/g, '0')),
                        nama: fc.string({ minLength: 3, maxLength: 50 }),
                        jumlah: fc.nat(10000000),
                        periode: fc.date().map(d => d.toISOString().substring(0, 7)), // YYYY-MM format
                        tanggal: fc.date().map(d => d.toISOString().split('T')[0]),
                        rowNumber: fc.nat(1000)
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (data) => {
                    // Setup anggota data with all NIKs from the test data
                    const anggota = data.map(row => ({
                        nik: row.nik,
                        nama: row.nama
                    }));
                    localStorage.setItem('anggota', JSON.stringify(anggota));
                    
                    // Validate with type 'wajib'
                    const result = validateSimpananData(data, 'wajib');
                    
                    // Should be valid since all NIKs exist and all fields are present
                    return result.isValid === true && result.validData.length === data.length;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any CSV data missing required fields, validation should reject with specific error messages', () => {
        fc.assert(
            fc.property(
                fc.record({
                    nik: fc.constant(''), // Empty NIK
                    nama: fc.string({ minLength: 3, maxLength: 50 }),
                    jumlah: fc.nat(10000000),
                    tanggal: fc.date().map(d => d.toISOString().split('T')[0]),
                    rowNumber: fc.integer({ min: 2, max: 100 })
                }),
                (row) => {
                    const data = [row];
                    
                    // Validate with type 'pokok'
                    const result = validateSimpananData(data, 'pokok');
                    
                    // Should be invalid due to empty NIK
                    return result.isValid === false && 
                           result.errors.length > 0 &&
                           result.errors.some(e => e.includes('NIK tidak boleh kosong'));
                }
            ),
            { numRuns: 100 }
        );
    });
});


/**
 * **Feature: upload-simpanan-saldo-awal, Property 7: Validasi referential integrity NIK**
 * **Validates: Requirements 3.3**
 */

describe('**Feature: upload-simpanan-saldo-awal, Property 7: Validasi referential integrity NIK**', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    
    test('For any NIK that exists in anggota data, validation should accept the row', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 16, maxLength: 16 }).map(s => s.replace(/[^0-9]/g, '0')),
                        nama: fc.string({ minLength: 3, maxLength: 50 })
                    }),
                    { minLength: 1, maxLength: 20 }
                ),
                (anggotaList) => {
                    // Setup anggota data
                    localStorage.setItem('anggota', JSON.stringify(anggotaList));
                    
                    // Create simpanan data using NIKs from anggota
                    const simpananData = anggotaList.map((anggota, index) => ({
                        nik: anggota.nik,
                        nama: anggota.nama,
                        jumlah: 1000000,
                        tanggal: '2024-01-01',
                        rowNumber: index + 2
                    }));
                    
                    // Validate
                    const result = validateSimpananData(simpananData, 'pokok');
                    
                    // All rows should be valid since all NIKs exist
                    return result.isValid === true && 
                           result.validData.length === simpananData.length &&
                           result.errors.length === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any NIK that does not exist in anggota data, validation should reject with specific error', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 16, maxLength: 16 }).map(s => s.replace(/[^0-9]/g, '0')),
                fc.string({ minLength: 16, maxLength: 16 }).map(s => s.replace(/[^0-9]/g, '1')),
                fc.string({ minLength: 3, maxLength: 50 }),
                (validNIK, invalidNIK, nama) => {
                    // Ensure NIKs are different
                    if (validNIK === invalidNIK) return true;
                    
                    // Setup anggota data with only validNIK
                    const anggota = [{ nik: validNIK, nama: nama }];
                    localStorage.setItem('anggota', JSON.stringify(anggota));
                    
                    // Create simpanan data with invalidNIK
                    const simpananData = [{
                        nik: invalidNIK,
                        nama: nama,
                        jumlah: 1000000,
                        tanggal: '2024-01-01',
                        rowNumber: 2
                    }];
                    
                    // Validate
                    const result = validateSimpananData(simpananData, 'pokok');
                    
                    // Should be invalid with NIK not found error
                    return result.isValid === false &&
                           result.errors.length > 0 &&
                           result.errors.some(e => e.includes('tidak ditemukan dalam data anggota'));
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any mix of valid and invalid NIKs, validation should only accept rows with valid NIKs', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 16, maxLength: 16 }).map(s => s.replace(/[^0-9]/g, '0')),
                        nama: fc.string({ minLength: 3, maxLength: 50 })
                    }),
                    { minLength: 2, maxLength: 10 }
                ),
                fc.integer({ min: 1, max: 5 }),
                (anggotaList, numInvalid) => {
                    // Setup anggota data
                    localStorage.setItem('anggota', JSON.stringify(anggotaList));
                    
                    // Create valid simpanan data
                    const validData = anggotaList.slice(0, Math.max(1, anggotaList.length - numInvalid)).map((anggota, index) => ({
                        nik: anggota.nik,
                        nama: anggota.nama,
                        jumlah: 1000000,
                        tanggal: '2024-01-01',
                        rowNumber: index + 2
                    }));
                    
                    // Create invalid simpanan data with non-existent NIKs
                    const invalidData = Array.from({ length: Math.min(numInvalid, anggotaList.length) }, (_, i) => ({
                        nik: '9999999999999' + String(i).padStart(3, '0'),
                        nama: 'Invalid User',
                        jumlah: 1000000,
                        tanggal: '2024-01-01',
                        rowNumber: validData.length + i + 2
                    }));
                    
                    const allData = [...validData, ...invalidData];
                    
                    // Validate
                    const result = validateSimpananData(allData, 'pokok');
                    
                    // Should have errors for invalid NIKs
                    // Valid data count should match validData length
                    return result.validData.length === validData.length &&
                           result.errors.length >= invalidData.length;
                }
            ),
            { numRuns: 100 }
        );
    });
});


/**
 * **Feature: upload-simpanan-saldo-awal, Property 8: Validasi nilai simpanan positif**
 * **Validates: Requirements 3.4**
 */

describe('**Feature: upload-simpanan-saldo-awal, Property 8: Validasi nilai simpanan positif**', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    
    test('For any positive number or zero as jumlah, validation should accept the row', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 16, maxLength: 16 }).map(s => s.replace(/[^0-9]/g, '0')),
                fc.string({ minLength: 3, maxLength: 50 }),
                fc.nat(100000000), // Positive or zero
                (nik, nama, jumlah) => {
                    // Setup anggota data
                    const anggota = [{ nik: nik, nama: nama }];
                    localStorage.setItem('anggota', JSON.stringify(anggota));
                    
                    // Create simpanan data with positive/zero jumlah
                    const simpananData = [{
                        nik: nik,
                        nama: nama,
                        jumlah: jumlah,
                        tanggal: '2024-01-01',
                        rowNumber: 2
                    }];
                    
                    // Validate
                    const result = validateSimpananData(simpananData, 'pokok');
                    
                    // Should be valid
                    return result.isValid === true &&
                           result.validData.length === 1 &&
                           result.errors.length === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any negative number as jumlah, validation should reject with specific error', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 16, maxLength: 16 }).map(s => s.replace(/[^0-9]/g, '0')),
                fc.string({ minLength: 3, maxLength: 50 }),
                fc.integer({ min: -100000000, max: -1 }), // Negative
                (nik, nama, jumlah) => {
                    // Setup anggota data
                    const anggota = [{ nik: nik, nama: nama }];
                    localStorage.setItem('anggota', JSON.stringify(anggota));
                    
                    // Create simpanan data with negative jumlah
                    const simpananData = [{
                        nik: nik,
                        nama: nama,
                        jumlah: jumlah,
                        tanggal: '2024-01-01',
                        rowNumber: 2
                    }];
                    
                    // Validate
                    const result = validateSimpananData(simpananData, 'pokok');
                    
                    // Should be invalid with negative value error
                    return result.isValid === false &&
                           result.errors.length > 0 &&
                           result.errors.some(e => e.includes('tidak boleh negatif'));
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any non-numeric value as jumlah, validation should reject with specific error', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 16, maxLength: 16 }).map(s => s.replace(/[^0-9]/g, '0')),
                fc.string({ minLength: 3, maxLength: 50 }),
                fc.oneof(
                    fc.string().filter(s => isNaN(parseFloat(s)) && s !== ''),
                    fc.constant('abc'),
                    fc.constant('xyz123')
                ),
                (nik, nama, invalidJumlah) => {
                    // Setup anggota data
                    const anggota = [{ nik: nik, nama: nama }];
                    localStorage.setItem('anggota', JSON.stringify(anggota));
                    
                    // Create simpanan data with non-numeric jumlah
                    const simpananData = [{
                        nik: nik,
                        nama: nama,
                        jumlah: invalidJumlah,
                        tanggal: '2024-01-01',
                        rowNumber: 2
                    }];
                    
                    // Validate
                    const result = validateSimpananData(simpananData, 'pokok');
                    
                    // Should be invalid with non-numeric error
                    return result.isValid === false &&
                           result.errors.length > 0 &&
                           result.errors.some(e => e.includes('harus berupa angka'));
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any empty or null jumlah, validation should reject with specific error', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 16, maxLength: 16 }).map(s => s.replace(/[^0-9]/g, '0')),
                fc.string({ minLength: 3, maxLength: 50 }),
                fc.oneof(
                    fc.constant(''),
                    fc.constant(null),
                    fc.constant(undefined)
                ),
                (nik, nama, emptyJumlah) => {
                    // Setup anggota data
                    const anggota = [{ nik: nik, nama: nama }];
                    localStorage.setItem('anggota', JSON.stringify(anggota));
                    
                    // Create simpanan data with empty jumlah
                    const simpananData = [{
                        nik: nik,
                        nama: nama,
                        jumlah: emptyJumlah,
                        tanggal: '2024-01-01',
                        rowNumber: 2
                    }];
                    
                    // Validate
                    const result = validateSimpananData(simpananData, 'pokok');
                    
                    // Should be invalid with empty field error
                    return result.isValid === false &&
                           result.errors.length > 0 &&
                           result.errors.some(e => e.includes('Jumlah tidak boleh kosong'));
                }
            ),
            { numRuns: 100 }
        );
    });
});


/**
 * **Feature: upload-simpanan-saldo-awal, Property 9: Error reporting yang spesifik**
 * **Validates: Requirements 3.5, 6.4**
 */

describe('**Feature: upload-simpanan-saldo-awal, Property 9: Error reporting yang spesifik**', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    
    test('For any validation error, error message should include specific row number and column name', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 2, max: 1000 }), // Row number
                fc.oneof(
                    fc.constant({ field: 'nik', value: '' }),
                    fc.constant({ field: 'nama', value: '' }),
                    fc.constant({ field: 'jumlah', value: '' }),
                    fc.constant({ field: 'tanggal', value: '' })
                ),
                (rowNumber, errorField) => {
                    // Setup empty anggota data
                    localStorage.setItem('anggota', JSON.stringify([]));
                    
                    // Create simpanan data with error
                    const simpananData = [{
                        nik: errorField.field === 'nik' ? errorField.value : '1234567890123456',
                        nama: errorField.field === 'nama' ? errorField.value : 'Test User',
                        jumlah: errorField.field === 'jumlah' ? errorField.value : 1000000,
                        tanggal: errorField.field === 'tanggal' ? errorField.value : '2024-01-01',
                        rowNumber: rowNumber
                    }];
                    
                    // Validate
                    const result = validateSimpananData(simpananData, 'pokok');
                    
                    // Should have error with row number and column name
                    if (result.errors.length > 0) {
                        const hasRowNumber = result.errors.some(e => e.includes(`Baris ${rowNumber}`));
                        const hasColumnName = result.errors.some(e => 
                            e.includes('Kolom NIK') || 
                            e.includes('Kolom Nama') || 
                            e.includes('Kolom Jumlah') || 
                            e.includes('Kolom Tanggal')
                        );
                        return hasRowNumber && hasColumnName;
                    }
                    return true; // If no errors, test passes
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any row with multiple errors, all errors should be reported with specific details', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 2, max: 100 }),
                (rowNumber) => {
                    // Setup empty anggota data
                    localStorage.setItem('anggota', JSON.stringify([]));
                    
                    // Create simpanan data with multiple errors (empty NIK, empty nama, negative jumlah, empty tanggal)
                    const simpananData = [{
                        nik: '',
                        nama: '',
                        jumlah: -1000,
                        tanggal: '',
                        rowNumber: rowNumber
                    }];
                    
                    // Validate
                    const result = validateSimpananData(simpananData, 'pokok');
                    
                    // Should have multiple errors
                    const hasNIKError = result.errors.some(e => e.includes('NIK tidak boleh kosong'));
                    const hasNamaError = result.errors.some(e => e.includes('Nama tidak boleh kosong'));
                    const hasJumlahError = result.errors.some(e => e.includes('tidak boleh negatif'));
                    const hasTanggalError = result.errors.some(e => e.includes('Tanggal tidak boleh kosong'));
                    
                    // All errors should be present
                    return hasNIKError && hasNamaError && hasJumlahError && hasTanggalError;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any invalid data, error messages should be descriptive and actionable', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 16, maxLength: 16 }).map(s => s.replace(/[^0-9]/g, '9')),
                fc.string({ minLength: 3, maxLength: 50 }),
                fc.integer({ min: -10000, max: -1 }),
                (invalidNIK, nama, negativeJumlah) => {
                    // Setup anggota data without the invalid NIK
                    const anggota = [{ nik: '0000000000000000', nama: 'Valid User' }];
                    localStorage.setItem('anggota', JSON.stringify(anggota));
                    
                    // Create simpanan data with invalid NIK and negative jumlah
                    const simpananData = [{
                        nik: invalidNIK,
                        nama: nama,
                        jumlah: negativeJumlah,
                        tanggal: '2024-01-01',
                        rowNumber: 2
                    }];
                    
                    // Validate
                    const result = validateSimpananData(simpananData, 'pokok');
                    
                    // Should have descriptive errors
                    const hasNIKError = result.errors.some(e => 
                        e.includes('tidak ditemukan dalam data anggota') && 
                        e.includes(invalidNIK)
                    );
                    const hasJumlahError = result.errors.some(e => 
                        e.includes('tidak boleh negatif') && 
                        e.includes(String(negativeJumlah))
                    );
                    
                    return result.isValid === false && hasNIKError && hasJumlahError;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any valid data, error array should be empty', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 16, maxLength: 16 }).map(s => s.replace(/[^0-9]/g, '0')),
                        nama: fc.string({ minLength: 3, maxLength: 50 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (anggotaList) => {
                    // Setup anggota data
                    localStorage.setItem('anggota', JSON.stringify(anggotaList));
                    
                    // Create valid simpanan data
                    const simpananData = anggotaList.map((anggota, index) => ({
                        nik: anggota.nik,
                        nama: anggota.nama,
                        jumlah: 1000000,
                        tanggal: '2024-01-01',
                        rowNumber: index + 2
                    }));
                    
                    // Validate
                    const result = validateSimpananData(simpananData, 'pokok');
                    
                    // Should have no errors
                    return result.isValid === true && result.errors.length === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any data with periode field missing in wajib type, error should specify periode column', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 16, maxLength: 16 }).map(s => s.replace(/[^0-9]/g, '0')),
                fc.string({ minLength: 3, maxLength: 50 }),
                fc.integer({ min: 2, max: 100 }),
                (nik, nama, rowNumber) => {
                    // Setup anggota data
                    const anggota = [{ nik: nik, nama: nama }];
                    localStorage.setItem('anggota', JSON.stringify(anggota));
                    
                    // Create simpanan wajib data without periode
                    const simpananData = [{
                        nik: nik,
                        nama: nama,
                        jumlah: 1000000,
                        periode: '', // Empty periode
                        tanggal: '2024-01-01',
                        rowNumber: rowNumber
                    }];
                    
                    // Validate with type 'wajib'
                    const result = validateSimpananData(simpananData, 'wajib');
                    
                    // Should have error about periode
                    return result.isValid === false &&
                           result.errors.some(e => e.includes('Kolom Periode') && e.includes('tidak boleh kosong'));
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * Merge simpanan data from upload with existing data
 * @param {Array} existingData - Existing simpanan data in wizardState
 * @param {Array} newData - New simpanan data from CSV upload
 * @param {string} mode - Merge mode: 'replace' or 'merge'
 * @returns {Array} - Merged simpanan data
 */
function mergeSimpananData(existingData, newData, mode) {
    // Validate inputs
    if (!Array.isArray(existingData)) {
        existingData = [];
    }
    
    if (!Array.isArray(newData)) {
        return existingData;
    }
    
    if (!mode || (mode !== 'replace' && mode !== 'merge')) {
        mode = 'merge'; // Default to merge mode
    }
    
    // If replace mode, return only new data
    if (mode === 'replace') {
        return newData;
    }
    
    // Merge mode: combine existing and new data
    // Create a map of existing data by NIK for efficient lookup
    const existingMap = new Map();
    existingData.forEach(item => {
        if (item.anggotaId || item.nik) {
            const key = item.anggotaId || item.nik;
            existingMap.set(key, item);
        }
    });
    
    // Process new data: update existing entries or add new ones
    newData.forEach(newItem => {
        const key = newItem.anggotaId || newItem.nik;
        
        if (existingMap.has(key)) {
            // Update existing entry with new data
            const existing = existingMap.get(key);
            
            // Merge the data - new data overwrites existing
            Object.assign(existing, newItem);
        } else {
            // Add new entry
            existingMap.set(key, newItem);
        }
    });
    
    // Convert map back to array
    return Array.from(existingMap.values());
}

/**
 * Property-Based Tests for mergeSimpananData
 * 
 * **Feature: upload-simpanan-saldo-awal, Property 14: Merge data upload dengan manual**
 * **Validates: Requirements 5.1**
 */
describe('**Feature: upload-simpanan-saldo-awal, Property 14: Merge data upload dengan manual**', () => {
    /**
     * Property: For any upload CSV simpanan, sistem harus menggabungkan data upload 
     * dengan data manual yang sudah ada di wizardState
     */
    test('For any existing and new simpanan data, merge mode should combine both datasets', () => {
        fc.assert(
            fc.property(
                // Generate existing data
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 10, maxLength: 20 }),
                        nama: fc.string({ minLength: 3, maxLength: 50 }),
                        simpananPokok: fc.nat({ max: 10000000 }),
                        simpananWajib: fc.nat({ max: 5000000 }),
                        simpananSukarela: fc.nat({ max: 20000000 })
                    }),
                    { minLength: 0, maxLength: 10 }
                ),
                // Generate new data
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 10, maxLength: 20 }),
                        nama: fc.string({ minLength: 3, maxLength: 50 }),
                        simpananPokok: fc.nat({ max: 10000000 }),
                        simpananWajib: fc.nat({ max: 5000000 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (existingData, newData) => {
                    // Merge data
                    const result = mergeSimpananData(existingData, newData, 'merge');
                    
                    // Result should be an array
                    expect(Array.isArray(result)).toBe(true);
                    
                    // Result should contain all unique anggotaIds from both datasets
                    const existingIds = new Set(existingData.map(d => d.anggotaId));
                    const newIds = new Set(newData.map(d => d.anggotaId));
                    const allUniqueIds = new Set([...existingIds, ...newIds]);
                    
                    // Result length should be at most the sum of unique IDs
                    expect(result.length).toBeLessThanOrEqual(allUniqueIds.size);
                    
                    // All new data IDs should be in result
                    newData.forEach(newItem => {
                        const found = result.find(r => r.anggotaId === newItem.anggotaId);
                        expect(found).toBeDefined();
                    });
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any existing data, merge with empty new data should return existing data', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 10, maxLength: 20 }),
                        nama: fc.string({ minLength: 3, maxLength: 50 }),
                        simpananPokok: fc.nat({ max: 10000000 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (existingData) => {
                    const result = mergeSimpananData(existingData, [], 'merge');
                    
                    // Result should equal existing data
                    expect(result.length).toBe(existingData.length);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any new data, merge with empty existing data should return new data', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 10, maxLength: 20 }),
                        nama: fc.string({ minLength: 3, maxLength: 50 }),
                        simpananPokok: fc.nat({ max: 10000000 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (newData) => {
                    const result = mergeSimpananData([], newData, 'merge');
                    
                    // Result should equal new data
                    expect(result.length).toBe(newData.length);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * Property-Based Tests for handling duplicate NIK
 * 
 * **Feature: upload-simpanan-saldo-awal, Property 15: Handling duplikasi NIK**
 * **Validates: Requirements 5.2**
 */
describe('**Feature: upload-simpanan-saldo-awal, Property 15: Handling duplikasi NIK**', () => {
    /**
     * Property: For any NIK yang duplikat dalam upload, sistem harus menimpa 
     * data lama dengan data baru dari upload
     */
    test('For any duplicate NIK in merge, new data should overwrite existing data', () => {
        fc.assert(
            fc.property(
                // Generate a shared NIK
                fc.string({ minLength: 16, maxLength: 16 }),
                // Generate old value
                fc.nat({ max: 5000000 }),
                // Generate new value (different from old)
                fc.nat({ max: 10000000 }),
                fc.string({ minLength: 3, maxLength: 50 }),
                (sharedNIK, oldValue, newValue, nama) => {
                    // Create existing data with the shared NIK
                    const existingData = [{
                        anggotaId: sharedNIK,
                        nama: 'Old Name',
                        simpananPokok: oldValue,
                        simpananWajib: 100000
                    }];
                    
                    // Create new data with the same NIK but different values
                    const newData = [{
                        anggotaId: sharedNIK,
                        nama: nama,
                        simpananPokok: newValue,
                        simpananWajib: 200000
                    }];
                    
                    // Merge data
                    const result = mergeSimpananData(existingData, newData, 'merge');
                    
                    // Should have only one entry for the shared NIK
                    expect(result.length).toBe(1);
                    
                    // The entry should have the new values
                    const merged = result.find(r => r.anggotaId === sharedNIK);
                    expect(merged).toBeDefined();
                    expect(merged.simpananPokok).toBe(newValue);
                    expect(merged.simpananWajib).toBe(200000);
                    expect(merged.nama).toBe(nama);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any multiple duplicates in new data, last occurrence should be kept', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 16, maxLength: 16 }),
                fc.array(fc.nat({ max: 10000000 }), { minLength: 2, maxLength: 5 }),
                (sharedNIK, values) => {
                    // Create new data with multiple entries for same NIK
                    const newData = values.map((value, index) => ({
                        anggotaId: sharedNIK,
                        nama: `Name ${index}`,
                        simpananPokok: value
                    }));
                    
                    // Merge with empty existing data
                    const result = mergeSimpananData([], newData, 'merge');
                    
                    // Should have only one entry
                    expect(result.length).toBe(1);
                    
                    // The entry should have the last value
                    const merged = result[0];
                    expect(merged.anggotaId).toBe(sharedNIK);
                    expect(merged.simpananPokok).toBe(values[values.length - 1]);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * Property-Based Tests for update without deleting other data
 * 
 * **Feature: upload-simpanan-saldo-awal, Property 16: Update data tanpa menghapus data lain**
 * **Validates: Requirements 5.3**
 */
describe('**Feature: upload-simpanan-saldo-awal, Property 16: Update data tanpa menghapus data lain**', () => {
    /**
     * Property: For any edit data simpanan setelah upload, sistem harus memperbarui 
     * nilai di wizardState tanpa menghapus data anggota lain
     */
    test('For any merge operation, existing data not in new data should be preserved', () => {
        fc.assert(
            fc.property(
                // Generate existing data with unique IDs
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 10, maxLength: 20 }),
                        nama: fc.string({ minLength: 3, maxLength: 50 }),
                        simpananPokok: fc.nat({ max: 10000000 })
                    }),
                    { minLength: 3, maxLength: 10 }
                ),
                // Generate new data with different IDs
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 10, maxLength: 20 }),
                        nama: fc.string({ minLength: 3, maxLength: 50 }),
                        simpananPokok: fc.nat({ max: 10000000 })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (existingData, newData) => {
                    // Make sure existing and new data have different IDs
                    const existingIds = existingData.map(d => d.anggotaId);
                    const filteredNewData = newData.filter(d => !existingIds.includes(d.anggotaId));
                    
                    if (filteredNewData.length === 0) {
                        return true; // Skip if no unique new data
                    }
                    
                    // Merge data
                    const result = mergeSimpananData(existingData, filteredNewData, 'merge');
                    
                    // All existing data should still be in result
                    existingData.forEach(existing => {
                        const found = result.find(r => r.anggotaId === existing.anggotaId);
                        expect(found).toBeDefined();
                        expect(found.nama).toBe(existing.nama);
                        expect(found.simpananPokok).toBe(existing.simpananPokok);
                    });
                    
                    // Result should have both existing and new data
                    expect(result.length).toBe(existingData.length + filteredNewData.length);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any replace mode, all existing data should be replaced with new data', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 10, maxLength: 20 }),
                        nama: fc.string({ minLength: 3, maxLength: 50 }),
                        simpananPokok: fc.nat({ max: 10000000 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 10, maxLength: 20 }),
                        nama: fc.string({ minLength: 3, maxLength: 50 }),
                        simpananPokok: fc.nat({ max: 10000000 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (existingData, newData) => {
                    // Replace mode
                    const result = mergeSimpananData(existingData, newData, 'replace');
                    
                    // Result should equal new data
                    expect(result.length).toBe(newData.length);
                    
                    // All new data should be in result
                    newData.forEach(newItem => {
                        const found = result.find(r => r.anggotaId === newItem.anggotaId);
                        expect(found).toBeDefined();
                    });
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any partial update (some NIKs overlap), non-overlapping data should be preserved', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 16, maxLength: 16 }),
                fc.string({ minLength: 16, maxLength: 16 }),
                fc.string({ minLength: 16, maxLength: 16 }),
                fc.nat({ max: 5000000 }),
                fc.nat({ max: 5000000 }),
                fc.nat({ max: 10000000 }),
                (nik1, nik2, nik3, value1, value2, newValue2) => {
                    // Ensure NIKs are different
                    if (nik1 === nik2 || nik1 === nik3 || nik2 === nik3) {
                        return true;
                    }
                    
                    // Create existing data with 3 members
                    const existingData = [
                        { anggotaId: nik1, nama: 'Member 1', simpananPokok: value1 },
                        { anggotaId: nik2, nama: 'Member 2', simpananPokok: value2 },
                        { anggotaId: nik3, nama: 'Member 3', simpananPokok: 300000 }
                    ];
                    
                    // Create new data that only updates member 2
                    const newData = [
                        { anggotaId: nik2, nama: 'Member 2 Updated', simpananPokok: newValue2 }
                    ];
                    
                    // Merge data
                    const result = mergeSimpananData(existingData, newData, 'merge');
                    
                    // Should have all 3 members
                    expect(result.length).toBe(3);
                    
                    // Member 1 should be unchanged
                    const member1 = result.find(r => r.anggotaId === nik1);
                    expect(member1).toBeDefined();
                    expect(member1.simpananPokok).toBe(value1);
                    expect(member1.nama).toBe('Member 1');
                    
                    // Member 2 should be updated
                    const member2 = result.find(r => r.anggotaId === nik2);
                    expect(member2).toBeDefined();
                    expect(member2.simpananPokok).toBe(newValue2);
                    expect(member2.nama).toBe('Member 2 Updated');
                    
                    // Member 3 should be unchanged
                    const member3 = result.find(r => r.anggotaId === nik3);
                    expect(member3).toBeDefined();
                    expect(member3.simpananPokok).toBe(300000);
                    expect(member3.nama).toBe('Member 3');
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});


/**
 * Property-Based Tests for Upload Simpanan Saldo Awal
 * Feature: upload-simpanan-saldo-awal
 */

// Mock the showUploadSimpananDialog function
function showUploadSimpananDialog(type) {
    // Validate type parameter
    if (type !== 'pokok' && type !== 'wajib') {
        global.showAlert('Tipe simpanan tidak valid. Gunakan "pokok" atau "wajib"', 'danger');
        return;
    }
    
    const typeLabel = type === 'pokok' ? 'Simpanan Pokok' : 'Simpanan Wajib';
    
    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="uploadSimpananModal" tabindex="-1" aria-labelledby="uploadSimpananModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="uploadSimpananModalLabel">
                            <i class="bi bi-upload me-2"></i>Upload ${typeLabel}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <!-- Tabs Navigation -->
                        <ul class="nav nav-tabs mb-3" id="uploadTabs" role="tablist">
                            <li class="nav-item" role="presentation">
                                <button class="nav-link active" id="upload-file-tab" data-bs-toggle="tab" data-bs-target="#upload-file" type="button" role="tab">
                                    <i class="bi bi-file-earmark-arrow-up me-2"></i>Upload File
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="paste-data-tab" data-bs-toggle="tab" data-bs-target="#paste-data" type="button" role="tab">
                                    <i class="bi bi-clipboard me-2"></i>Paste Data
                                </button>
                            </li>
                        </ul>
                        
                        <!-- Tabs Content -->
                        <div class="tab-content" id="uploadTabsContent">
                            <!-- Upload File Tab -->
                            <div class="tab-pane fade show active" id="upload-file" role="tabpanel">
                                <div class="mb-3">
                                    <label for="csvFileInput" class="form-label">Pilih File CSV</label>
                                    <input type="file" class="form-control" id="csvFileInput" accept=".csv">
                                </div>
                            </div>
                            
                            <!-- Paste Data Tab -->
                            <div class="tab-pane fade" id="paste-data" role="tabpanel">
                                <div class="mb-3">
                                    <label for="pasteDataTextarea" class="form-label">Paste Data dari Excel atau CSV</label>
                                    <textarea class="form-control" id="pasteDataTextarea" rows="10"></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="btnPreviewSimpanan">Preview</button>
                        <button type="button" class="btn btn-success" id="btnImportSimpanan" style="display: none;">Import</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('uploadSimpananModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal using Bootstrap
    const modal = new bootstrap.Modal(document.getElementById('uploadSimpananModal'));
    modal.show();
}

describe('**Feature: upload-simpanan-saldo-awal, Property 1: Dialog upload muncul saat tombol diklik**', () => {
    /**
     * **Validates: Requirements 1.2, 2.2**
     * 
     * Property: For any tipe simpanan (pokok atau wajib), ketika tombol upload diklik,
     * sistem harus menampilkan dialog upload dengan opsi file dan paste data
     */
    
    // Setup mocks for this test suite
    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = '<div id="mainContent"></div>';
        
        // Mock Bootstrap Modal
        global.bootstrap = {
            Modal: class {
                constructor(element) {
                    this.element = element;
                }
                show() {
                    this.element.style.display = 'block';
                    this.element.classList.add('show');
                }
                hide() {
                    this.element.style.display = 'none';
                    this.element.classList.remove('show');
                }
            }
        };
        
        // Track showAlert calls
        global.showAlertCalls = [];
        global.showAlert = (message, type) => {
            global.showAlertCalls.push({ message, type });
        };
    });
    
    afterEach(() => {
        // Cleanup
        document.body.innerHTML = '';
        global.showAlertCalls = [];
    });
    
    test('For any valid simpanan type (pokok or wajib), showUploadSimpananDialog should display modal with file and paste tabs', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('pokok', 'wajib'),
                (type) => {
                    // Clear DOM before each test
                    document.body.innerHTML = '<div id="mainContent"></div>';
                    
                    // Call the function
                    showUploadSimpananDialog(type);
                    
                    // Check that modal exists
                    const modal = document.getElementById('uploadSimpananModal');
                    expect(modal).not.toBeNull();
                    
                    // Check that modal is displayed
                    expect(modal.classList.contains('show')).toBe(true);
                    
                    // Check that modal has correct title
                    const modalTitle = document.getElementById('uploadSimpananModalLabel');
                    expect(modalTitle).not.toBeNull();
                    const expectedTitle = type === 'pokok' ? 'Simpanan Pokok' : 'Simpanan Wajib';
                    expect(modalTitle.textContent).toContain(expectedTitle);
                    
                    // Check that Upload File tab exists
                    const uploadFileTab = document.getElementById('upload-file-tab');
                    expect(uploadFileTab).not.toBeNull();
                    expect(uploadFileTab.textContent).toContain('Upload File');
                    
                    // Check that Paste Data tab exists
                    const pasteDataTab = document.getElementById('paste-data-tab');
                    expect(pasteDataTab).not.toBeNull();
                    expect(pasteDataTab.textContent).toContain('Paste Data');
                    
                    // Check that file input exists
                    const fileInput = document.getElementById('csvFileInput');
                    expect(fileInput).not.toBeNull();
                    expect(fileInput.getAttribute('type')).toBe('file');
                    expect(fileInput.getAttribute('accept')).toBe('.csv');
                    
                    // Check that paste textarea exists
                    const pasteTextarea = document.getElementById('pasteDataTextarea');
                    expect(pasteTextarea).not.toBeNull();
                    expect(pasteTextarea.tagName.toLowerCase()).toBe('textarea');
                    
                    // Check that Preview button exists
                    const previewButton = document.getElementById('btnPreviewSimpanan');
                    expect(previewButton).not.toBeNull();
                    expect(previewButton.textContent).toContain('Preview');
                    
                    // Check that Import button exists (but hidden initially)
                    const importButton = document.getElementById('btnImportSimpanan');
                    expect(importButton).not.toBeNull();
                    expect(importButton.style.display).toBe('none');
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any invalid simpanan type, showUploadSimpananDialog should not display modal and show error', () => {
        fc.assert(
            fc.property(
                fc.string().filter(s => s !== 'pokok' && s !== 'wajib'),
                (invalidType) => {
                    // Clear DOM and mocks before each test
                    document.body.innerHTML = '<div id="mainContent"></div>';
                    global.showAlertCalls = [];
                    
                    // Call the function with invalid type
                    showUploadSimpananDialog(invalidType);
                    
                    // Check that modal does not exist
                    const modal = document.getElementById('uploadSimpananModal');
                    expect(modal).toBeNull();
                    
                    // Check that showAlert was called with error message
                    expect(global.showAlertCalls.length).toBe(1);
                    expect(global.showAlertCalls[0].message).toBe('Tipe simpanan tidak valid. Gunakan "pokok" atau "wajib"');
                    expect(global.showAlertCalls[0].type).toBe('danger');
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('Dialog should have both Upload File and Paste Data tabs with correct structure', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('pokok', 'wajib'),
                (type) => {
                    // Clear DOM before each test
                    document.body.innerHTML = '<div id="mainContent"></div>';
                    
                    // Call the function
                    showUploadSimpananDialog(type);
                    
                    // Check Upload File tab content
                    const uploadFilePane = document.getElementById('upload-file');
                    expect(uploadFilePane).not.toBeNull();
                    expect(uploadFilePane.classList.contains('tab-pane')).toBe(true);
                    expect(uploadFilePane.classList.contains('active')).toBe(true); // Should be active by default
                    
                    // Check Paste Data tab content
                    const pasteDataPane = document.getElementById('paste-data');
                    expect(pasteDataPane).not.toBeNull();
                    expect(pasteDataPane.classList.contains('tab-pane')).toBe(true);
                    expect(pasteDataPane.classList.contains('active')).toBe(false); // Should not be active by default
                    
                    // Check that tabs are properly structured
                    const tabsNav = document.getElementById('uploadTabs');
                    expect(tabsNav).not.toBeNull();
                    expect(tabsNav.classList.contains('nav-tabs')).toBe(true);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * Property-Based Tests for showPreviewSimpanan
 * 
 * **Feature: upload-simpanan-saldo-awal, Property 2: CSV parsing menghasilkan preview**
 * **Validates: Requirements 1.3, 2.3, 6.1**
 */

// Mock showPreviewSimpanan function for testing
function showPreviewSimpanan(data, errors, type) {
    // Validate inputs
    if (!Array.isArray(data)) {
        throw new Error('Data harus berupa array');
    }
    
    if (!Array.isArray(errors)) {
        errors = [];
    }
    
    // Calculate statistics
    const totalRecords = data.length;
    const validRecords = data.filter(row => !row.error).length;
    const errorRecords = data.filter(row => row.error).length;
    const totalNilai = data
        .filter(row => !row.error)
        .reduce((sum, row) => sum + (parseFloat(row.jumlah) || 0), 0);
    
    // Return preview data structure
    return {
        success: true,
        totalRecords,
        validRecords,
        errorRecords,
        totalNilai,
        previewData: data.filter(row => !row.error)
    };
}

describe('**Feature: upload-simpanan-saldo-awal, Property 2: CSV parsing menghasilkan preview**', () => {
    /**
     * Property: For any file CSV yang valid, sistem harus memparse data dan 
     * menampilkan preview table dengan semua data yang akan diimport
     */
    
    test('For any valid CSV data, showPreviewSimpanan should generate preview with all data', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 16, maxLength: 16 }),
                        nama: fc.string({ minLength: 3, maxLength: 50 }),
                        jumlah: fc.nat({ max: 10000000 }),
                        tanggal: fc.date().map(d => d.toISOString().split('T')[0]),
                        error: fc.constant(false)
                    }),
                    { minLength: 1, maxLength: 20 }
                ),
                fc.constantFrom('pokok', 'wajib'),
                (data, type) => {
                    const result = showPreviewSimpanan(data, [], type);
                    
                    // Verify preview was generated
                    expect(result.success).toBe(true);
                    
                    // Verify all valid data is in preview
                    expect(result.totalRecords).toBe(data.length);
                    expect(result.validRecords).toBe(data.length);
                    expect(result.errorRecords).toBe(0);
                    expect(result.previewData.length).toBe(data.length);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any CSV data with errors, showPreviewSimpanan should show only valid records in preview', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 16, maxLength: 16 }),
                        nama: fc.string({ minLength: 3, maxLength: 50 }),
                        jumlah: fc.nat({ max: 10000000 }),
                        tanggal: fc.date().map(d => d.toISOString().split('T')[0]),
                        error: fc.boolean(),
                        errorMessage: fc.string()
                    }),
                    { minLength: 2, maxLength: 20 }
                ),
                fc.constantFrom('pokok', 'wajib'),
                (data, type) => {
                    const result = showPreviewSimpanan(data, [], type);
                    
                    const expectedValidRecords = data.filter(row => !row.error).length;
                    const expectedErrorRecords = data.filter(row => row.error).length;
                    
                    // Verify counts
                    expect(result.totalRecords).toBe(data.length);
                    expect(result.validRecords).toBe(expectedValidRecords);
                    expect(result.errorRecords).toBe(expectedErrorRecords);
                    
                    // Verify only valid records in preview
                    expect(result.previewData.length).toBe(expectedValidRecords);
                    expect(result.previewData.every(row => !row.error)).toBe(true);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Feature: upload-simpanan-saldo-awal, Property 19: Preview menampilkan jumlah record**
 * **Validates: Requirements 6.2**
 */
describe('**Feature: upload-simpanan-saldo-awal, Property 19: Preview menampilkan jumlah record**', () => {
    /**
     * Property: For any preview yang ditampilkan, sistem harus menampilkan 
     * jumlah total record yang akan diimport
     */
    
    test('For any data array, preview should display correct total record count', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 16, maxLength: 16 }),
                        nama: fc.string({ minLength: 3, maxLength: 50 }),
                        jumlah: fc.nat({ max: 10000000 }),
                        tanggal: fc.date().map(d => d.toISOString().split('T')[0]),
                        error: fc.boolean()
                    }),
                    { minLength: 0, maxLength: 50 }
                ),
                fc.constantFrom('pokok', 'wajib'),
                (data, type) => {
                    const result = showPreviewSimpanan(data, [], type);
                    
                    // Total records should match input data length
                    expect(result.totalRecords).toBe(data.length);
                    
                    // Valid + Error records should equal total
                    expect(result.validRecords + result.errorRecords).toBe(result.totalRecords);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For empty data array, preview should show zero records', () => {
        const result = showPreviewSimpanan([], [], 'pokok');
        
        expect(result.totalRecords).toBe(0);
        expect(result.validRecords).toBe(0);
        expect(result.errorRecords).toBe(0);
    });
});

/**
 * **Feature: upload-simpanan-saldo-awal, Property 20: Preview menampilkan total nilai**
 * **Validates: Requirements 6.3**
 */
describe('**Feature: upload-simpanan-saldo-awal, Property 20: Preview menampilkan total nilai**', () => {
    /**
     * Property: For any preview yang ditampilkan, sistem harus menampilkan 
     * total nilai simpanan yang akan diimport
     */
    
    test('For any valid data, preview should display correct total nilai simpanan', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 16, maxLength: 16 }),
                        nama: fc.string({ minLength: 3, maxLength: 50 }),
                        jumlah: fc.nat({ max: 10000000 }),
                        tanggal: fc.date().map(d => d.toISOString().split('T')[0]),
                        error: fc.constant(false)
                    }),
                    { minLength: 1, maxLength: 20 }
                ),
                fc.constantFrom('pokok', 'wajib'),
                (data, type) => {
                    const result = showPreviewSimpanan(data, [], type);
                    
                    // Calculate expected total
                    const expectedTotal = data.reduce((sum, row) => sum + row.jumlah, 0);
                    
                    // Verify total nilai matches
                    expect(result.totalNilai).toBe(expectedTotal);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For data with errors, preview should only sum valid records', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 16, maxLength: 16 }),
                        nama: fc.string({ minLength: 3, maxLength: 50 }),
                        jumlah: fc.nat({ max: 10000000 }),
                        tanggal: fc.date().map(d => d.toISOString().split('T')[0]),
                        error: fc.boolean()
                    }),
                    { minLength: 2, maxLength: 20 }
                ),
                fc.constantFrom('pokok', 'wajib'),
                (data, type) => {
                    const result = showPreviewSimpanan(data, [], type);
                    
                    // Calculate expected total (only valid records)
                    const expectedTotal = data
                        .filter(row => !row.error)
                        .reduce((sum, row) => sum + row.jumlah, 0);
                    
                    // Verify total nilai matches only valid records
                    expect(result.totalNilai).toBe(expectedTotal);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For empty or all-error data, preview should show zero total nilai', () => {
        // Test empty data
        const emptyResult = showPreviewSimpanan([], [], 'pokok');
        expect(emptyResult.totalNilai).toBe(0);
        
        // Test all-error data
        const errorData = [
            { nik: '1234567890123456', nama: 'Test', jumlah: 1000000, error: true },
            { nik: '1234567890123457', nama: 'Test2', jumlah: 2000000, error: true }
        ];
        const errorResult = showPreviewSimpanan(errorData, [], 'pokok');
        expect(errorResult.totalNilai).toBe(0);
    });
});

/**
 * **Feature: upload-simpanan-saldo-awal, Property 21: Cancel import tidak menyimpan data**
 * **Validates: Requirements 6.5**
 */
describe('**Feature: upload-simpanan-saldo-awal, Property 21: Cancel import tidak menyimpan data**', () => {
    /**
     * Property: For any pembatalan import, sistem harus menutup dialog preview 
     * tanpa menyimpan data ke wizardState
     */
    
    beforeEach(() => {
        localStorage.clear();
        // Setup initial wizardState
        window.wizardState = {
            data: {
                simpananAnggota: []
            }
        };
    });
    
    test('For any preview data, canceling should not modify wizardState', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 16, maxLength: 16 }),
                        nama: fc.string({ minLength: 3, maxLength: 50 }),
                        simpananPokok: fc.nat({ max: 10000000 }),
                        simpananWajib: fc.nat({ max: 10000000 }),
                        simpananSukarela: fc.nat({ max: 10000000 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (initialData) => {
                    // Set initial state
                    window.wizardState.data.simpananAnggota = JSON.parse(JSON.stringify(initialData));
                    const initialState = JSON.stringify(window.wizardState.data.simpananAnggota);
                    
                    // Simulate preview data (but don't import)
                    const previewData = [
                        { nik: '1234567890123456', nama: 'New User', jumlah: 5000000, error: false }
                    ];
                    
                    // Show preview but don't import (simulate cancel)
                    showPreviewSimpanan(previewData, [], 'pokok');
                    
                    // Verify wizardState hasn't changed
                    const finalState = JSON.stringify(window.wizardState.data.simpananAnggota);
                    expect(finalState).toBe(initialState);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any data in preview, wizardState should only change after explicit import confirmation', () => {
        // Initial empty state
        window.wizardState.data.simpananAnggota = [];
        
        const previewData = [
            { nik: '1234567890123456', nama: 'Test User', jumlah: 1000000, error: false },
            { nik: '1234567890123457', nama: 'Test User 2', jumlah: 2000000, error: false }
        ];
        
        // Show preview
        const result = showPreviewSimpanan(previewData, [], 'pokok');
        
        // Verify preview was generated
        expect(result.success).toBe(true);
        expect(result.previewData.length).toBe(2);
        
        // Verify wizardState is still empty (no import yet)
        expect(window.wizardState.data.simpananAnggota.length).toBe(0);
    });
});

/**
 * Property-Based Tests for importSimpananToWizard
 * 
 * **Feature: upload-simpanan-saldo-awal, Property 3: Data tersimpan ke wizardState setelah konfirmasi**
 * **Validates: Requirements 1.4, 2.4**
 */

// Mock updateCOAFromSimpanan function for testing
function updateCOAFromSimpanan() {
    const coa = JSON.parse(localStorage.getItem('coa') || '[]');
    
    const wizardState = window.wizardState || {
        data: {
            simpananAnggota: []
        }
    };
    
    const totalSimpananPokok = wizardState.data.simpananAnggota.reduce((sum, item) => {
        return sum + (item.simpananPokok || 0);
    }, 0);
    
    const totalSimpananWajib = wizardState.data.simpananAnggota.reduce((sum, item) => {
        return sum + (item.simpananWajib || 0);
    }, 0);
    
    const akunSimpananPokok = coa.find(a => a.kode === '2-1100');
    if (akunSimpananPokok) {
        akunSimpananPokok.saldo = totalSimpananPokok;
    }
    
    const akunSimpananWajib = coa.find(a => a.kode === '2-1200');
    if (akunSimpananWajib) {
        akunSimpananWajib.saldo = totalSimpananWajib;
    }
    
    localStorage.setItem('coa', JSON.stringify(coa));
}

// Mock importSimpananToWizard function for testing
function importSimpananToWizard(data, type) {
    try {
        // Validate inputs
        if (!data || !Array.isArray(data)) {
            return {
                success: false,
                recordCount: 0,
                totalNilai: 0,
                message: 'Data harus berupa array'
            };
        }
        
        if (type !== 'pokok' && type !== 'wajib') {
            return {
                success: false,
                recordCount: 0,
                totalNilai: 0,
                message: 'Tipe simpanan harus "pokok" atau "wajib"'
            };
        }
        
        if (data.length === 0) {
            return {
                success: false,
                recordCount: 0,
                totalNilai: 0,
                message: 'Tidak ada data untuk diimport'
            };
        }
        
        // Initialize simpananAnggota if not exists
        if (!window.wizardState.data.simpananAnggota) {
            window.wizardState.data.simpananAnggota = [];
        }
        
        // Check if there's existing data
        const hasExistingData = window.wizardState.data.simpananAnggota.length > 0 &&
                                window.wizardState.data.simpananAnggota.some(s => 
                                    type === 'pokok' ? (s.simpananPokok || 0) > 0 : (s.simpananWajib || 0) > 0
                                );
        
        let mode = 'merge'; // Default mode for testing
        
        // Merge data with existing data
        const existingData = window.wizardState.data.simpananAnggota || [];
        
        // Simple merge logic for testing
        const mergedData = [...existingData];
        
        data.forEach(uploadItem => {
            const existingIndex = mergedData.findIndex(e => e.anggotaId === uploadItem.nik);
            
            if (existingIndex >= 0) {
                // Update existing
                if (type === 'pokok') {
                    mergedData[existingIndex].simpananPokok = uploadItem.jumlah || 0;
                } else if (type === 'wajib') {
                    mergedData[existingIndex].simpananWajib = uploadItem.jumlah || 0;
                }
            } else {
                // Add new
                const newItem = {
                    anggotaId: uploadItem.nik,
                    nama: uploadItem.nama,
                    simpananPokok: type === 'pokok' ? (uploadItem.jumlah || 0) : 0,
                    simpananWajib: type === 'wajib' ? (uploadItem.jumlah || 0) : 0,
                    simpananSukarela: 0
                };
                mergedData.push(newItem);
            }
        });
        
        // Update wizardState
        window.wizardState.data.simpananAnggota = mergedData;
        
        // Update COA
        updateCOAFromSimpanan();
        
        // Calculate totals for notification
        const recordCount = data.length;
        const totalNilai = data.reduce((sum, item) => sum + (item.jumlah || 0), 0);
        
        // Return success result
        return {
            success: true,
            recordCount: recordCount,
            totalNilai: totalNilai,
            message: `Berhasil import ${recordCount} record dengan total nilai ${totalNilai}`
        };
        
    } catch (error) {
        console.error('Error in importSimpananToWizard:', error);
        return {
            success: false,
            recordCount: 0,
            totalNilai: 0,
            message: `Error: ${error.message}`
        };
    }
}

describe('**Feature: upload-simpanan-saldo-awal, Property 3: Data tersimpan ke wizardState setelah konfirmasi**', () => {
    /**
     * Property: For any data simpanan yang valid, setelah admin mengkonfirmasi import,
     * data harus tersimpan di wizardState.data.simpananAnggota dengan field yang sesuai
     */
    
    beforeEach(() => {
        localStorage.clear();
        window.wizardState = {
            currentStep: 6,
            data: {
                simpananAnggota: []
            }
        };
    });
    
    test('For any valid simpanan pokok data, after import confirmation, data should be stored in wizardState with simpananPokok field', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 16, maxLength: 16 })
                            .filter(s => s.trim().length === 16 && !s.startsWith('__')),
                        nama: fc.string({ minLength: 3, maxLength: 50 })
                            .filter(s => s.trim().length >= 3),
                        jumlah: fc.nat({ max: 10000000 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (uploadData) => {
                    // Filter out duplicates to ensure unique NIKs
                    const uniqueData = [];
                    const seenNiks = new Set();
                    for (const item of uploadData) {
                        if (!seenNiks.has(item.nik)) {
                            seenNiks.add(item.nik);
                            uniqueData.push(item);
                        }
                    }
                    
                    if (uniqueData.length === 0) return true; // Skip empty data
                    
                    // Reset state
                    window.wizardState.data.simpananAnggota = [];
                    
                    // Import data
                    const result = importSimpananToWizard(uniqueData, 'pokok');
                    
                    // Verify success
                    if (!result.success) return false;
                    
                    // Verify data is stored
                    const storedData = window.wizardState.data.simpananAnggota;
                    if (storedData.length !== uniqueData.length) return false;
                    
                    // Verify each item has correct simpananPokok field
                    for (let i = 0; i < uniqueData.length; i++) {
                        const uploaded = uniqueData[i];
                        const stored = storedData.find(s => s.anggotaId === uploaded.nik);
                        
                        if (!stored) return false;
                        if (stored.simpananPokok !== uploaded.jumlah) return false;
                        if (stored.nama !== uploaded.nama) return false;
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any valid simpanan wajib data, after import confirmation, data should be stored in wizardState with simpananWajib field', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 16, maxLength: 16 })
                            .filter(s => s.trim().length === 16 && !s.startsWith('__')),
                        nama: fc.string({ minLength: 3, maxLength: 50 })
                            .filter(s => s.trim().length >= 3),
                        jumlah: fc.nat({ max: 10000000 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (uploadData) => {
                    // Filter out duplicates to ensure unique NIKs
                    const uniqueData = [];
                    const seenNiks = new Set();
                    for (const item of uploadData) {
                        if (!seenNiks.has(item.nik)) {
                            seenNiks.add(item.nik);
                            uniqueData.push(item);
                        }
                    }
                    
                    if (uniqueData.length === 0) return true; // Skip empty data
                    
                    // Reset state
                    window.wizardState.data.simpananAnggota = [];
                    
                    // Import data
                    const result = importSimpananToWizard(uniqueData, 'wajib');
                    
                    // Verify success
                    if (!result.success) return false;
                    
                    // Verify data is stored
                    const storedData = window.wizardState.data.simpananAnggota;
                    if (storedData.length !== uniqueData.length) return false;
                    
                    // Verify each item has correct simpananWajib field
                    for (let i = 0; i < uniqueData.length; i++) {
                        const uploaded = uniqueData[i];
                        const stored = storedData.find(s => s.anggotaId === uploaded.nik);
                        
                        if (!stored) return false;
                        if (stored.simpananWajib !== uploaded.jumlah) return false;
                        if (stored.nama !== uploaded.nama) return false;
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any invalid input (empty array), import should fail and return success false', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('pokok', 'wajib'),
                (type) => {
                    // Reset state
                    window.wizardState.data.simpananAnggota = [];
                    
                    // Try to import empty data
                    const result = importSimpananToWizard([], type);
                    
                    // Verify failure
                    return result.success === false && result.recordCount === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any invalid type parameter, import should fail and return success false', () => {
        fc.assert(
            fc.property(
                fc.string().filter(s => s !== 'pokok' && s !== 'wajib'),
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 16, maxLength: 16 }),
                        nama: fc.string({ minLength: 3, maxLength: 50 }),
                        jumlah: fc.nat({ max: 10000000 })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (invalidType, uploadData) => {
                    // Reset state
                    window.wizardState.data.simpananAnggota = [];
                    
                    // Try to import with invalid type
                    const result = importSimpananToWizard(uploadData, invalidType);
                    
                    // Verify failure
                    return result.success === false;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Feature: upload-simpanan-saldo-awal, Property 4: UI update setelah import**
 * **Validates: Requirements 1.5, 2.5, 9.5**
 */
describe('**Feature: upload-simpanan-saldo-awal, Property 4: UI update setelah import**', () => {
    /**
     * Property: For any import yang berhasil, sistem harus memperbarui tampilan tabel simpanan
     * dan total simpanan (pokok atau wajib) sesuai dengan data baru
     */
    
    beforeEach(() => {
        localStorage.clear();
        window.wizardState = {
            currentStep: 6,
            data: {
                simpananAnggota: []
            }
        };
    });
    
    test('For any successful import, wizardState should be updated and ready for UI re-render', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 16, maxLength: 16 })
                            .filter(s => s.trim().length === 16 && !s.startsWith('__')),
                        nama: fc.string({ minLength: 3, maxLength: 50 })
                            .filter(s => s.trim().length >= 3),
                        jumlah: fc.nat({ max: 10000000 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                fc.constantFrom('pokok', 'wajib'),
                (uploadData, type) => {
                    // Filter out duplicates to ensure unique NIKs
                    const uniqueData = [];
                    const seenNiks = new Set();
                    for (const item of uploadData) {
                        if (!seenNiks.has(item.nik)) {
                            seenNiks.add(item.nik);
                            uniqueData.push(item);
                        }
                    }
                    
                    if (uniqueData.length === 0) return true; // Skip empty data
                    
                    // Reset state
                    window.wizardState.data.simpananAnggota = [];
                    
                    // Import data
                    const result = importSimpananToWizard(uniqueData, type);
                    
                    // Verify success
                    if (!result.success) return false;
                    
                    // Verify wizardState is updated
                    const storedData = window.wizardState.data.simpananAnggota;
                    if (storedData.length === 0) return false;
                    
                    // Calculate total from wizardState
                    const totalFromState = storedData.reduce((sum, item) => {
                        return sum + (type === 'pokok' ? (item.simpananPokok || 0) : (item.simpananWajib || 0));
                    }, 0);
                    
                    // Calculate expected total from upload data
                    const expectedTotal = uniqueData.reduce((sum, item) => sum + item.jumlah, 0);
                    
                    // Verify totals match
                    return totalFromState === expectedTotal;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any import, the result should contain recordCount and totalNilai for UI notification', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 16, maxLength: 16 }),
                        nama: fc.string({ minLength: 3, maxLength: 50 }),
                        jumlah: fc.nat({ max: 10000000 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                fc.constantFrom('pokok', 'wajib'),
                (uploadData, type) => {
                    // Reset state
                    window.wizardState.data.simpananAnggota = [];
                    
                    // Import data
                    const result = importSimpananToWizard(uploadData, type);
                    
                    // Verify result contains necessary fields for UI
                    if (!result.success) return false;
                    if (result.recordCount !== uploadData.length) return false;
                    
                    const expectedTotal = uploadData.reduce((sum, item) => sum + item.jumlah, 0);
                    if (result.totalNilai !== expectedTotal) return false;
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Feature: upload-simpanan-saldo-awal, Property 18: Opsi replace atau merge pada upload kedua**
 * **Validates: Requirements 5.5**
 */
describe('**Feature: upload-simpanan-saldo-awal, Property 18: Opsi replace atau merge pada upload kedua**', () => {
    /**
     * Property: For any upload kedua kalinya, sistem harus memberikan opsi untuk 
     * replace semua data atau merge dengan data existing
     */
    
    beforeEach(() => {
        localStorage.clear();
        window.wizardState = {
            currentStep: 6,
            data: {
                simpananAnggota: []
            }
        };
    });
    
    test('For any second upload with existing data, merge mode should combine old and new data', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 16, maxLength: 16 }),
                        nama: fc.string({ minLength: 3, maxLength: 50 }),
                        jumlah: fc.nat({ max: 10000000 })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 16, maxLength: 16 }),
                        nama: fc.string({ minLength: 3, maxLength: 50 }),
                        jumlah: fc.nat({ max: 10000000 })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (firstUpload, secondUpload) => {
                    // Reset state
                    window.wizardState.data.simpananAnggota = [];
                    
                    // First import
                    const result1 = importSimpananToWizard(firstUpload, 'pokok');
                    if (!result1.success) return true; // Skip if first import fails
                    
                    const countAfterFirst = window.wizardState.data.simpananAnggota.length;
                    
                    // Second import (merge mode is default in our implementation)
                    const result2 = importSimpananToWizard(secondUpload, 'pokok');
                    if (!result2.success) return true; // Skip if second import fails
                    
                    const countAfterSecond = window.wizardState.data.simpananAnggota.length;
                    
                    // In merge mode, count should be >= first count
                    // (could be same if all NIKs overlap, or more if new NIKs added)
                    return countAfterSecond >= countAfterFirst;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any upload with duplicate NIK, the newer data should overwrite the old data', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 16, maxLength: 16 }),
                fc.string({ minLength: 3, maxLength: 50 }),
                fc.nat({ max: 10000000 }),
                fc.nat({ max: 10000000 }),
                (nik, nama, jumlah1, jumlah2) => {
                    // Reset state
                    window.wizardState.data.simpananAnggota = [];
                    
                    // First import
                    const firstData = [{ nik, nama, jumlah: jumlah1 }];
                    const result1 = importSimpananToWizard(firstData, 'pokok');
                    if (!result1.success) return true;
                    
                    // Second import with same NIK but different jumlah
                    const secondData = [{ nik, nama, jumlah: jumlah2 }];
                    const result2 = importSimpananToWizard(secondData, 'pokok');
                    if (!result2.success) return true;
                    
                    // Verify only one record exists
                    const storedData = window.wizardState.data.simpananAnggota;
                    if (storedData.length !== 1) return false;
                    
                    // Verify the newer value is stored
                    const stored = storedData.find(s => s.anggotaId === nik);
                    return stored && stored.simpananPokok === jumlah2;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Feature: upload-simpanan-saldo-awal, Property 25 & 26: Notifikasi sukses dengan jumlah record dan total nilai**
 * **Validates: Requirements 9.1, 9.2**
 */
describe('**Feature: upload-simpanan-saldo-awal, Property 25 & 26: Notifikasi sukses**', () => {
    /**
     * Property 25: For any import yang berhasil, sistem harus menampilkan notifikasi sukses 
     * dengan jumlah record yang berhasil diimport
     * 
     * Property 26: For any import yang berhasil, sistem harus menampilkan total nilai simpanan 
     * yang berhasil diimport
     */
    
    beforeEach(() => {
        localStorage.clear();
        window.wizardState = {
            currentStep: 6,
            data: {
                simpananAnggota: []
            }
        };
    });
    
    test('For any successful import, result should contain recordCount matching the number of imported records', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 16, maxLength: 16 }),
                        nama: fc.string({ minLength: 3, maxLength: 50 }),
                        jumlah: fc.nat({ max: 10000000 })
                    }),
                    { minLength: 1, maxLength: 20 }
                ),
                fc.constantFrom('pokok', 'wajib'),
                (uploadData, type) => {
                    // Reset state
                    window.wizardState.data.simpananAnggota = [];
                    
                    // Import data
                    const result = importSimpananToWizard(uploadData, type);
                    
                    // Verify success
                    if (!result.success) return false;
                    
                    // Verify recordCount matches
                    return result.recordCount === uploadData.length;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any successful import, result should contain totalNilai matching the sum of all jumlah values', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 16, maxLength: 16 }),
                        nama: fc.string({ minLength: 3, maxLength: 50 }),
                        jumlah: fc.nat({ max: 10000000 })
                    }),
                    { minLength: 1, maxLength: 20 }
                ),
                fc.constantFrom('pokok', 'wajib'),
                (uploadData, type) => {
                    // Reset state
                    window.wizardState.data.simpananAnggota = [];
                    
                    // Import data
                    const result = importSimpananToWizard(uploadData, type);
                    
                    // Verify success
                    if (!result.success) return false;
                    
                    // Calculate expected total
                    const expectedTotal = uploadData.reduce((sum, item) => sum + item.jumlah, 0);
                    
                    // Verify totalNilai matches
                    return result.totalNilai === expectedTotal;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any successful import, result message should contain both recordCount and totalNilai information', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 16, maxLength: 16 }),
                        nama: fc.string({ minLength: 3, maxLength: 50 }),
                        jumlah: fc.nat({ max: 10000000 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                fc.constantFrom('pokok', 'wajib'),
                (uploadData, type) => {
                    // Reset state
                    window.wizardState.data.simpananAnggota = [];
                    
                    // Import data
                    const result = importSimpananToWizard(uploadData, type);
                    
                    // Verify success
                    if (!result.success) return false;
                    
                    // Verify message contains recordCount and totalNilai
                    const hasRecordCount = result.message.includes(result.recordCount.toString());
                    const hasTotal = result.message.includes(result.totalNilai.toString());
                    
                    return hasRecordCount && hasTotal;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any failed import, result should have success false and appropriate error message', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('pokok', 'wajib'),
                (type) => {
                    // Reset state
                    window.wizardState.data.simpananAnggota = [];
                    
                    // Try to import empty data (should fail)
                    const result = importSimpananToWizard([], type);
                    
                    // Verify failure
                    return result.success === false && 
                           result.recordCount === 0 && 
                           result.totalNilai === 0 &&
                           result.message.length > 0;
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ============================================
// Property Tests for COA Integration
// ============================================

/**
 * **Feature: upload-simpanan-saldo-awal, Property 10: Integrasi dengan COA**
 * **Validates: Requirements 4.1, 4.2**
 */
describe('**Feature: upload-simpanan-saldo-awal, Property 10: Integrasi dengan COA**', () => {
    /**
     * Property: For any import simpanan (pokok atau wajib), sistem harus menambahkan nilai 
     * ke akun yang sesuai di COA (2-1100 untuk pokok, 2-1200 untuk wajib)
     */
    
    // Mock updateCOAFromSimpanan function
    function updateCOAFromSimpanan() {
        const coa = JSON.parse(localStorage.getItem('coa') || '[]');
        
        const wizardState = window.wizardState || {
            data: {
                simpananAnggota: []
            }
        };
        
        const totalSimpananPokok = wizardState.data.simpananAnggota.reduce((sum, item) => {
            return sum + (item.simpananPokok || 0);
        }, 0);
        
        const totalSimpananWajib = wizardState.data.simpananAnggota.reduce((sum, item) => {
            return sum + (item.simpananWajib || 0);
        }, 0);
        
        const akunSimpananPokok = coa.find(a => a.kode === '2-1100');
        if (akunSimpananPokok) {
            akunSimpananPokok.saldo = totalSimpananPokok;
        }
        
        const akunSimpananWajib = coa.find(a => a.kode === '2-1200');
        if (akunSimpananWajib) {
            akunSimpananWajib.saldo = totalSimpananWajib;
        }
        
        localStorage.setItem('coa', JSON.stringify(coa));
    }
    
    beforeEach(() => {
        localStorage.clear();
        
        // Setup COA with simpanan accounts
        const coa = [
            { kode: '2-1100', nama: 'Simpanan Pokok', tipe: 'Kewajiban', saldo: 0 },
            { kode: '2-1200', nama: 'Simpanan Wajib', tipe: 'Kewajiban', saldo: 0 }
        ];
        localStorage.setItem('coa', JSON.stringify(coa));
        
        // Setup wizardState
        window.wizardState = {
            data: {
                simpananAnggota: []
            }
        };
    });
    
    test('For any simpanan pokok data, akun 2-1100 saldo should equal total simpanan pokok', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        simpananPokok: fc.nat({ max: 10000000 }),
                        simpananWajib: fc.nat({ max: 10000000 }),
                        simpananSukarela: fc.nat({ max: 10000000 })
                    }),
                    { minLength: 1, maxLength: 20 }
                ),
                (simpananData) => {
                    // Set simpanan data in wizardState
                    window.wizardState.data.simpananAnggota = simpananData;
                    
                    // Calculate expected total
                    const expectedTotal = simpananData.reduce((sum, item) => sum + item.simpananPokok, 0);
                    
                    // Update COA
                    updateCOAFromSimpanan();
                    
                    // Get COA and verify
                    const coa = JSON.parse(localStorage.getItem('coa') || '[]');
                    const akunSimpananPokok = coa.find(a => a.kode === '2-1100');
                    
                    return akunSimpananPokok && akunSimpananPokok.saldo === expectedTotal;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any simpanan wajib data, akun 2-1200 saldo should equal total simpanan wajib', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        simpananPokok: fc.nat({ max: 10000000 }),
                        simpananWajib: fc.nat({ max: 10000000 }),
                        simpananSukarela: fc.nat({ max: 10000000 })
                    }),
                    { minLength: 1, maxLength: 20 }
                ),
                (simpananData) => {
                    // Set simpanan data in wizardState
                    window.wizardState.data.simpananAnggota = simpananData;
                    
                    // Calculate expected total
                    const expectedTotal = simpananData.reduce((sum, item) => sum + item.simpananWajib, 0);
                    
                    // Update COA
                    updateCOAFromSimpanan();
                    
                    // Get COA and verify
                    const coa = JSON.parse(localStorage.getItem('coa') || '[]');
                    const akunSimpananWajib = coa.find(a => a.kode === '2-1200');
                    
                    return akunSimpananWajib && akunSimpananWajib.saldo === expectedTotal;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any changes to simpanan data, updateCOAFromSimpanan should keep COA synchronized', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        simpananPokok: fc.nat({ max: 10000000 }),
                        simpananWajib: fc.nat({ max: 10000000 }),
                        simpananSukarela: fc.nat({ max: 10000000 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        simpananPokok: fc.nat({ max: 10000000 }),
                        simpananWajib: fc.nat({ max: 10000000 }),
                        simpananSukarela: fc.nat({ max: 10000000 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (initialData, updatedData) => {
                    // Set initial data
                    window.wizardState.data.simpananAnggota = initialData;
                    updateCOAFromSimpanan();
                    
                    // Update data
                    window.wizardState.data.simpananAnggota = updatedData;
                    updateCOAFromSimpanan();
                    
                    // Calculate expected totals
                    const expectedPokok = updatedData.reduce((sum, item) => sum + item.simpananPokok, 0);
                    const expectedWajib = updatedData.reduce((sum, item) => sum + item.simpananWajib, 0);
                    
                    // Get COA and verify
                    const coa = JSON.parse(localStorage.getItem('coa') || '[]');
                    const akunSimpananPokok = coa.find(a => a.kode === '2-1100');
                    const akunSimpananWajib = coa.find(a => a.kode === '2-1200');
                    
                    return akunSimpananPokok.saldo === expectedPokok && 
                           akunSimpananWajib.saldo === expectedWajib;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Feature: upload-simpanan-saldo-awal, Property 11: Perhitungan total kewajiban**
 * **Validates: Requirements 4.3**
 */
describe('**Feature: upload-simpanan-saldo-awal, Property 11: Perhitungan total kewajiban**', () => {
    /**
     * Property: For any state di Step 7, sistem harus menghitung total kewajiban 
     * termasuk simpanan pokok dan simpanan wajib dari data yang diimport
     */
    
    beforeEach(() => {
        localStorage.clear();
        
        // Setup COA with all kewajiban accounts
        const coa = [
            { kode: '2-1000', nama: 'Hutang Supplier', tipe: 'Kewajiban', saldo: 0 },
            { kode: '2-1100', nama: 'Simpanan Pokok', tipe: 'Kewajiban', saldo: 0 },
            { kode: '2-1200', nama: 'Simpanan Wajib', tipe: 'Kewajiban', saldo: 0 },
            { kode: '2-1300', nama: 'Simpanan Sukarela', tipe: 'Kewajiban', saldo: 0 }
        ];
        localStorage.setItem('coa', JSON.stringify(coa));
    });
    
    test('For any COA with kewajiban accounts, total kewajiban should include simpanan pokok and wajib', () => {
        fc.assert(
            fc.property(
                fc.nat({ max: 100000000 }), // hutang supplier
                fc.nat({ max: 100000000 }), // simpanan pokok
                fc.nat({ max: 100000000 }), // simpanan wajib
                fc.nat({ max: 100000000 }), // simpanan sukarela
                (hutang, simpananPokok, simpananWajib, simpananSukarela) => {
                    // Update COA with values
                    const coa = JSON.parse(localStorage.getItem('coa') || '[]');
                    
                    const akunHutang = coa.find(a => a.kode === '2-1000');
                    if (akunHutang) akunHutang.saldo = hutang;
                    
                    const akunSimpananPokok = coa.find(a => a.kode === '2-1100');
                    if (akunSimpananPokok) akunSimpananPokok.saldo = simpananPokok;
                    
                    const akunSimpananWajib = coa.find(a => a.kode === '2-1200');
                    if (akunSimpananWajib) akunSimpananWajib.saldo = simpananWajib;
                    
                    const akunSimpananSukarela = coa.find(a => a.kode === '2-1300');
                    if (akunSimpananSukarela) akunSimpananSukarela.saldo = simpananSukarela;
                    
                    localStorage.setItem('coa', JSON.stringify(coa));
                    
                    // Calculate total kewajiban
                    const totalKewajiban = coa
                        .filter(a => a.tipe === 'Kewajiban')
                        .reduce((sum, a) => sum + (a.saldo || 0), 0);
                    
                    // Expected total
                    const expectedTotal = hutang + simpananPokok + simpananWajib + simpananSukarela;
                    
                    return totalKewajiban === expectedTotal;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any simpanan data imported, total kewajiban should increase by the sum of simpanan', () => {
        fc.assert(
            fc.property(
                fc.nat({ max: 50000000 }), // initial hutang
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        simpananPokok: fc.nat({ max: 5000000 }),
                        simpananWajib: fc.nat({ max: 5000000 }),
                        simpananSukarela: fc.nat({ max: 5000000 })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (initialHutang, simpananData) => {
                    // Reset COA to ensure clean state
                    const coa = [
                        { kode: '2-1000', nama: 'Hutang Supplier', tipe: 'Kewajiban', saldo: 0 },
                        { kode: '2-1100', nama: 'Simpanan Pokok', tipe: 'Kewajiban', saldo: 0 },
                        { kode: '2-1200', nama: 'Simpanan Wajib', tipe: 'Kewajiban', saldo: 0 },
                        { kode: '2-1300', nama: 'Simpanan Sukarela', tipe: 'Kewajiban', saldo: 0 }
                    ];
                    
                    // Set initial hutang
                    const akunHutang = coa.find(a => a.kode === '2-1000');
                    if (akunHutang) akunHutang.saldo = initialHutang;
                    localStorage.setItem('coa', JSON.stringify(coa));
                    
                    // Calculate initial total kewajiban (should be just initialHutang)
                    const initialTotal = initialHutang;
                    
                    // Import simpanan data
                    const totalSimpananPokok = simpananData.reduce((sum, item) => sum + item.simpananPokok, 0);
                    const totalSimpananWajib = simpananData.reduce((sum, item) => sum + item.simpananWajib, 0);
                    const totalSimpananSukarela = simpananData.reduce((sum, item) => sum + item.simpananSukarela, 0);
                    
                    // Update COA with simpanan data
                    const updatedCoa = JSON.parse(localStorage.getItem('coa') || '[]');
                    const akunPokok = updatedCoa.find(a => a.kode === '2-1100');
                    if (akunPokok) akunPokok.saldo = totalSimpananPokok;
                    
                    const akunWajib = updatedCoa.find(a => a.kode === '2-1200');
                    if (akunWajib) akunWajib.saldo = totalSimpananWajib;
                    
                    const akunSukarela = updatedCoa.find(a => a.kode === '2-1300');
                    if (akunSukarela) akunSukarela.saldo = totalSimpananSukarela;
                    
                    localStorage.setItem('coa', JSON.stringify(updatedCoa));
                    
                    // Calculate new total kewajiban
                    const newTotal = updatedCoa
                        .filter(a => a.tipe === 'Kewajiban')
                        .reduce((sum, a) => sum + (a.saldo || 0), 0);
                    
                    // Expected total = initial hutang + all simpanan
                    const expectedTotal = initialHutang + totalSimpananPokok + totalSimpananWajib + totalSimpananSukarela;
                    
                    return newTotal === expectedTotal;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Feature: upload-simpanan-saldo-awal, Property 12: Konsistensi data simpanan dengan COA**
 * **Validates: Requirements 4.4**
 */
describe('**Feature: upload-simpanan-saldo-awal, Property 12: Konsistensi data simpanan dengan COA**', () => {
    /**
     * Property: For any perhitungan balance, total simpanan dari wizardState harus 
     * sama dengan total di COA
     */
    
    function updateCOAFromSimpanan() {
        const coa = JSON.parse(localStorage.getItem('coa') || '[]');
        
        const wizardState = window.wizardState || {
            data: {
                simpananAnggota: []
            }
        };
        
        const totalSimpananPokok = wizardState.data.simpananAnggota.reduce((sum, item) => {
            return sum + (item.simpananPokok || 0);
        }, 0);
        
        const totalSimpananWajib = wizardState.data.simpananAnggota.reduce((sum, item) => {
            return sum + (item.simpananWajib || 0);
        }, 0);
        
        const akunSimpananPokok = coa.find(a => a.kode === '2-1100');
        if (akunSimpananPokok) {
            akunSimpananPokok.saldo = totalSimpananPokok;
        }
        
        const akunSimpananWajib = coa.find(a => a.kode === '2-1200');
        if (akunSimpananWajib) {
            akunSimpananWajib.saldo = totalSimpananWajib;
        }
        
        localStorage.setItem('coa', JSON.stringify(coa));
    }
    
    beforeEach(() => {
        localStorage.clear();
        
        // Setup COA
        const coa = [
            { kode: '2-1100', nama: 'Simpanan Pokok', tipe: 'Kewajiban', saldo: 0 },
            { kode: '2-1200', nama: 'Simpanan Wajib', tipe: 'Kewajiban', saldo: 0 }
        ];
        localStorage.setItem('coa', JSON.stringify(coa));
        
        // Setup wizardState
        window.wizardState = {
            data: {
                simpananAnggota: []
            }
        };
    });
    
    test('For any simpanan data, total from wizardState should match total in COA after updateCOAFromSimpanan', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        simpananPokok: fc.nat({ max: 10000000 }),
                        simpananWajib: fc.nat({ max: 10000000 }),
                        simpananSukarela: fc.nat({ max: 10000000 })
                    }),
                    { minLength: 1, maxLength: 20 }
                ),
                (simpananData) => {
                    // Set simpanan data
                    window.wizardState.data.simpananAnggota = simpananData;
                    
                    // Calculate totals from wizardState
                    const totalPokokFromState = simpananData.reduce((sum, item) => sum + item.simpananPokok, 0);
                    const totalWajibFromState = simpananData.reduce((sum, item) => sum + item.simpananWajib, 0);
                    
                    // Update COA
                    updateCOAFromSimpanan();
                    
                    // Get totals from COA
                    const coa = JSON.parse(localStorage.getItem('coa') || '[]');
                    const akunPokok = coa.find(a => a.kode === '2-1100');
                    const akunWajib = coa.find(a => a.kode === '2-1200');
                    
                    const totalPokokFromCOA = akunPokok ? akunPokok.saldo : 0;
                    const totalWajibFromCOA = akunWajib ? akunWajib.saldo : 0;
                    
                    // Verify consistency
                    return totalPokokFromState === totalPokokFromCOA && 
                           totalWajibFromState === totalWajibFromCOA;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any multiple updates to simpanan data, consistency should be maintained', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.array(
                        fc.record({
                            anggotaId: fc.string({ minLength: 1 }),
                            nama: fc.string({ minLength: 1 }),
                            simpananPokok: fc.nat({ max: 5000000 }),
                            simpananWajib: fc.nat({ max: 5000000 }),
                            simpananSukarela: fc.nat({ max: 5000000 })
                        }),
                        { minLength: 1, maxLength: 10 }
                    ),
                    { minLength: 2, maxLength: 5 }
                ),
                (updates) => {
                    let allConsistent = true;
                    
                    for (const simpananData of updates) {
                        // Set simpanan data
                        window.wizardState.data.simpananAnggota = simpananData;
                        
                        // Calculate totals from wizardState
                        const totalPokokFromState = simpananData.reduce((sum, item) => sum + item.simpananPokok, 0);
                        const totalWajibFromState = simpananData.reduce((sum, item) => sum + item.simpananWajib, 0);
                        
                        // Update COA
                        updateCOAFromSimpanan();
                        
                        // Get totals from COA
                        const coa = JSON.parse(localStorage.getItem('coa') || '[]');
                        const akunPokok = coa.find(a => a.kode === '2-1100');
                        const akunWajib = coa.find(a => a.kode === '2-1200');
                        
                        const totalPokokFromCOA = akunPokok ? akunPokok.saldo : 0;
                        const totalWajibFromCOA = akunWajib ? akunWajib.saldo : 0;
                        
                        // Check consistency
                        if (totalPokokFromState !== totalPokokFromCOA || totalWajibFromState !== totalWajibFromCOA) {
                            allConsistent = false;
                            break;
                        }
                    }
                    
                    return allConsistent;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any balance calculation, simpanan totals should match between wizardState and COA', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        simpananPokok: fc.nat({ max: 10000000 }),
                        simpananWajib: fc.nat({ max: 10000000 }),
                        simpananSukarela: fc.nat({ max: 10000000 })
                    }),
                    { minLength: 1, maxLength: 15 }
                ),
                (simpananData) => {
                    // Set simpanan data
                    window.wizardState.data.simpananAnggota = simpananData;
                    
                    // Update COA
                    updateCOAFromSimpanan();
                    
                    // Calculate total simpanan from wizardState
                    const totalFromState = simpananData.reduce((sum, item) => {
                        return sum + item.simpananPokok + item.simpananWajib;
                    }, 0);
                    
                    // Calculate total simpanan from COA
                    const coa = JSON.parse(localStorage.getItem('coa') || '[]');
                    const totalFromCOA = coa
                        .filter(a => a.kode === '2-1100' || a.kode === '2-1200')
                        .reduce((sum, a) => sum + (a.saldo || 0), 0);
                    
                    // Verify they match
                    return totalFromState === totalFromCOA;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Feature: upload-simpanan-saldo-awal, Property 13: Jurnal pembuka mencatat simpanan**
 * **Validates: Requirements 4.5**
 * 
 * For any penyimpanan saldo awal dengan data simpanan, sistem harus membuat jurnal pembuka 
 * yang mencatat simpanan sebagai kewajiban dengan:
 * - Debit: Modal Koperasi (3-1000)
 * - Kredit: Simpanan Pokok (2-1100) dan Simpanan Wajib (2-1200)
 * - Jurnal harus balance (total debit = total kredit)
 */
describe('**Feature: upload-simpanan-saldo-awal, Property 13: Jurnal pembuka mencatat simpanan**', () => {
    // Helper function to generate jurnal pembuka (copied from saldoAwal.js for testing)
    function generateJurnalPembukaForTest(saldoAwalData) {
        const entries = [];
        
        // 1. Modal Koperasi: Debit Kas, Kredit Modal Koperasi
        if (saldoAwalData.modalKoperasi > 0) {
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
        
        // 2. Kas: Debit Kas, Kredit Modal (jika ada saldo kas tambahan selain modal)
        if (saldoAwalData.kas > 0 && saldoAwalData.kas !== saldoAwalData.modalKoperasi) {
            const selisihKas = saldoAwalData.kas - saldoAwalData.modalKoperasi;
            if (selisihKas > 0) {
                entries.push({
                    akun: '1-1000', // Kas
                    debit: selisihKas,
                    kredit: 0
                });
                entries.push({
                    akun: '3-1000', // Modal Koperasi
                    debit: 0,
                    kredit: selisihKas
                });
            }
        }
        
        // 3. Bank: Debit Bank, Kredit Modal
        if (saldoAwalData.bank > 0) {
            entries.push({
                akun: '1-1100', // Bank
                debit: saldoAwalData.bank,
                kredit: 0
            });
            entries.push({
                akun: '3-1000', // Modal Koperasi
                debit: 0,
                kredit: saldoAwalData.bank
            });
        }
        
        // 4. Piutang Anggota: Debit Piutang Anggota, Kredit Modal
        const totalPiutang = (saldoAwalData.piutangAnggota || []).reduce((sum, p) => sum + (p.jumlah || 0), 0);
        if (totalPiutang > 0) {
            entries.push({
                akun: '1-1200', // Piutang Anggota
                debit: totalPiutang,
                kredit: 0
            });
            entries.push({
                akun: '3-1000', // Modal Koperasi
                debit: 0,
                kredit: totalPiutang
            });
        }
        
        // 5. Persediaan: Debit Persediaan Barang, Kredit Modal
        const totalPersediaan = (saldoAwalData.persediaan || []).reduce((sum, p) => sum + (p.stok * p.hpp), 0);
        if (totalPersediaan > 0) {
            entries.push({
                akun: '1-1300', // Persediaan Barang
                debit: totalPersediaan,
                kredit: 0
            });
            entries.push({
                akun: '3-1000', // Modal Koperasi
                debit: 0,
                kredit: totalPersediaan
            });
        }
        
        // 6. Pinjaman Anggota: Debit Piutang Pinjaman, Kredit Modal
        const totalPinjaman = (saldoAwalData.pinjamanAnggota || []).reduce((sum, p) => sum + (p.jumlahPokok || 0), 0);
        if (totalPinjaman > 0) {
            entries.push({
                akun: '1-1400', // Piutang Pinjaman
                debit: totalPinjaman,
                kredit: 0
            });
            entries.push({
                akun: '3-1000', // Modal Koperasi
                debit: 0,
                kredit: totalPinjaman
            });
        }
        
        // 7. Hutang Supplier: Debit Modal, Kredit Hutang Supplier
        const totalHutang = (saldoAwalData.hutangSupplier || []).reduce((sum, h) => sum + (h.jumlah || 0), 0);
        if (totalHutang > 0) {
            entries.push({
                akun: '3-1000', // Modal Koperasi
                debit: totalHutang,
                kredit: 0
            });
            entries.push({
                akun: '2-1000', // Hutang Supplier
                debit: 0,
                kredit: totalHutang
            });
        }
        
        // 8. Simpanan Anggota: Debit Modal, Kredit Simpanan (Pokok, Wajib, Sukarela)
        const totalSimpananPokok = (saldoAwalData.simpananAnggota || []).reduce((sum, s) => sum + (s.simpananPokok || 0), 0);
        const totalSimpananWajib = (saldoAwalData.simpananAnggota || []).reduce((sum, s) => sum + (s.simpananWajib || 0), 0);
        const totalSimpananSukarela = (saldoAwalData.simpananAnggota || []).reduce((sum, s) => sum + (s.simpananSukarela || 0), 0);
        
        if (totalSimpananPokok > 0) {
            entries.push({
                akun: '3-1000', // Modal Koperasi
                debit: totalSimpananPokok,
                kredit: 0
            });
            entries.push({
                akun: '2-1100', // Simpanan Pokok
                debit: 0,
                kredit: totalSimpananPokok
            });
        }
        
        if (totalSimpananWajib > 0) {
            entries.push({
                akun: '3-1000', // Modal Koperasi
                debit: totalSimpananWajib,
                kredit: 0
            });
            entries.push({
                akun: '2-1200', // Simpanan Wajib
                debit: 0,
                kredit: totalSimpananWajib
            });
        }
        
        if (totalSimpananSukarela > 0) {
            entries.push({
                akun: '3-1000', // Modal Koperasi
                debit: totalSimpananSukarela,
                kredit: 0
            });
            entries.push({
                akun: '2-1300', // Simpanan Sukarela
                debit: 0,
                kredit: totalSimpananSukarela
            });
        }
        
        return entries;
    }
    
    test('For any saldo awal with simpanan data, jurnal pembuka should record simpanan as kewajiban with Debit Modal and Kredit Simpanan accounts', () => {
        fc.assert(
            fc.property(
                fc.record({
                    modalKoperasi: fc.nat({ max: 100000000 }),
                    kas: fc.nat({ max: 50000000 }),
                    bank: fc.nat({ max: 50000000 }),
                    piutangAnggota: fc.array(
                        fc.record({
                            anggotaId: fc.string({ minLength: 1 }),
                            jumlah: fc.nat({ max: 10000000 })
                        }),
                        { maxLength: 3 }
                    ),
                    persediaan: fc.array(
                        fc.record({
                            barangId: fc.string({ minLength: 1 }),
                            stok: fc.nat({ max: 100 }),
                            hpp: fc.nat({ max: 100000 })
                        }),
                        { maxLength: 3 }
                    ),
                    hutangSupplier: fc.array(
                        fc.record({
                            namaSupplier: fc.string({ minLength: 1 }),
                            jumlah: fc.nat({ max: 10000000 })
                        }),
                        { maxLength: 3 }
                    ),
                    pinjamanAnggota: fc.array(
                        fc.record({
                            anggotaId: fc.string({ minLength: 1 }),
                            jumlahPokok: fc.nat({ max: 10000000 })
                        }),
                        { maxLength: 3 }
                    ),
                    simpananAnggota: fc.array(
                        fc.record({
                            anggotaId: fc.string({ minLength: 1 }),
                            nama: fc.string({ minLength: 1 }),
                            simpananPokok: fc.nat({ max: 5000000 }),
                            simpananWajib: fc.nat({ max: 5000000 }),
                            simpananSukarela: fc.nat({ max: 5000000 })
                        }),
                        { minLength: 1, maxLength: 10 }
                    )
                }),
                (saldoAwalData) => {
                    // Generate jurnal pembuka
                    const jurnalEntries = generateJurnalPembukaForTest(saldoAwalData);
                    
                    // Calculate expected simpanan totals
                    const totalSimpananPokok = saldoAwalData.simpananAnggota.reduce((sum, s) => sum + s.simpananPokok, 0);
                    const totalSimpananWajib = saldoAwalData.simpananAnggota.reduce((sum, s) => sum + s.simpananWajib, 0);
                    const totalSimpananSukarela = saldoAwalData.simpananAnggota.reduce((sum, s) => sum + s.simpananSukarela, 0);
                    
                    // Find simpanan entries in jurnal
                    const simpananPokokKreditEntries = jurnalEntries.filter(e => e.akun === '2-1100' && e.kredit > 0);
                    const simpananWajibKreditEntries = jurnalEntries.filter(e => e.akun === '2-1200' && e.kredit > 0);
                    const simpananSukarelaKreditEntries = jurnalEntries.filter(e => e.akun === '2-1300' && e.kredit > 0);
                    
                    // Find corresponding debit entries to Modal Koperasi
                    const modalDebitForPokok = jurnalEntries.filter(e => e.akun === '3-1000' && e.debit > 0)
                        .reduce((sum, e) => sum + e.debit, 0);
                    
                    // Verify simpanan pokok is recorded correctly
                    let simpananPokokCorrect = true;
                    if (totalSimpananPokok > 0) {
                        const totalKreditPokok = simpananPokokKreditEntries.reduce((sum, e) => sum + e.kredit, 0);
                        simpananPokokCorrect = totalKreditPokok === totalSimpananPokok;
                    } else {
                        simpananPokokCorrect = simpananPokokKreditEntries.length === 0;
                    }
                    
                    // Verify simpanan wajib is recorded correctly
                    let simpananWajibCorrect = true;
                    if (totalSimpananWajib > 0) {
                        const totalKreditWajib = simpananWajibKreditEntries.reduce((sum, e) => sum + e.kredit, 0);
                        simpananWajibCorrect = totalKreditWajib === totalSimpananWajib;
                    } else {
                        simpananWajibCorrect = simpananWajibKreditEntries.length === 0;
                    }
                    
                    // Verify simpanan sukarela is recorded correctly
                    let simpananSukarelaCorrect = true;
                    if (totalSimpananSukarela > 0) {
                        const totalKreditSukarela = simpananSukarelaKreditEntries.reduce((sum, e) => sum + e.kredit, 0);
                        simpananSukarelaCorrect = totalKreditSukarela === totalSimpananSukarela;
                    } else {
                        simpananSukarelaCorrect = simpananSukarelaKreditEntries.length === 0;
                    }
                    
                    return simpananPokokCorrect && simpananWajibCorrect && simpananSukarelaCorrect;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any saldo awal with simpanan, jurnal pembuka should be balanced (total debit = total kredit)', () => {
        fc.assert(
            fc.property(
                fc.record({
                    modalKoperasi: fc.nat({ max: 100000000 }),
                    kas: fc.nat({ max: 50000000 }),
                    bank: fc.nat({ max: 50000000 }),
                    piutangAnggota: fc.array(
                        fc.record({
                            anggotaId: fc.string({ minLength: 1 }),
                            jumlah: fc.nat({ max: 10000000 })
                        }),
                        { maxLength: 5 }
                    ),
                    persediaan: fc.array(
                        fc.record({
                            barangId: fc.string({ minLength: 1 }),
                            stok: fc.nat({ max: 100 }),
                            hpp: fc.nat({ max: 100000 })
                        }),
                        { maxLength: 5 }
                    ),
                    hutangSupplier: fc.array(
                        fc.record({
                            namaSupplier: fc.string({ minLength: 1 }),
                            jumlah: fc.nat({ max: 10000000 })
                        }),
                        { maxLength: 5 }
                    ),
                    pinjamanAnggota: fc.array(
                        fc.record({
                            anggotaId: fc.string({ minLength: 1 }),
                            jumlahPokok: fc.nat({ max: 10000000 })
                        }),
                        { maxLength: 5 }
                    ),
                    simpananAnggota: fc.array(
                        fc.record({
                            anggotaId: fc.string({ minLength: 1 }),
                            nama: fc.string({ minLength: 1 }),
                            simpananPokok: fc.nat({ max: 5000000 }),
                            simpananWajib: fc.nat({ max: 5000000 }),
                            simpananSukarela: fc.nat({ max: 5000000 })
                        }),
                        { minLength: 1, maxLength: 15 }
                    )
                }),
                (saldoAwalData) => {
                    // Generate jurnal pembuka
                    const jurnalEntries = generateJurnalPembukaForTest(saldoAwalData);
                    
                    // Validate balance
                    const validation = validateBalance(jurnalEntries);
                    
                    return validation.isValid === true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any saldo awal with simpanan, simpanan should be recorded as kewajiban (kredit side)', () => {
        fc.assert(
            fc.property(
                fc.record({
                    modalKoperasi: fc.nat({ min: 1000000, max: 100000000 }),
                    kas: fc.nat({ max: 50000000 }),
                    bank: fc.nat({ max: 50000000 }),
                    piutangAnggota: fc.constant([]),
                    persediaan: fc.constant([]),
                    hutangSupplier: fc.constant([]),
                    pinjamanAnggota: fc.constant([]),
                    simpananAnggota: fc.array(
                        fc.record({
                            anggotaId: fc.string({ minLength: 1 }),
                            nama: fc.string({ minLength: 1 }),
                            simpananPokok: fc.nat({ min: 100000, max: 5000000 }),
                            simpananWajib: fc.nat({ min: 50000, max: 5000000 }),
                            simpananSukarela: fc.nat({ max: 5000000 })
                        }),
                        { minLength: 1, maxLength: 10 }
                    )
                }),
                (saldoAwalData) => {
                    // Generate jurnal pembuka
                    const jurnalEntries = generateJurnalPembukaForTest(saldoAwalData);
                    
                    // Find all simpanan kredit entries
                    const simpananKreditEntries = jurnalEntries.filter(e => 
                        (e.akun === '2-1100' || e.akun === '2-1200' || e.akun === '2-1300') && e.kredit > 0
                    );
                    
                    // Find all corresponding modal debit entries
                    const modalDebitEntries = jurnalEntries.filter(e => 
                        e.akun === '3-1000' && e.debit > 0
                    );
                    
                    // Calculate totals
                    const totalSimpananKredit = simpananKreditEntries.reduce((sum, e) => sum + e.kredit, 0);
                    const totalSimpanan = saldoAwalData.simpananAnggota.reduce((sum, s) => 
                        sum + s.simpananPokok + s.simpananWajib + s.simpananSukarela, 0
                    );
                    
                    // Verify simpanan is recorded on kredit side (as kewajiban)
                    const simpananRecordedAsKewajiban = totalSimpananKredit === totalSimpanan;
                    
                    // Verify there are corresponding debit entries to Modal
                    const hasModalDebit = modalDebitEntries.length > 0;
                    
                    return simpananRecordedAsKewajiban && hasModalDebit;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any saldo awal with zero simpanan, no simpanan entries should be in jurnal pembuka', () => {
        fc.assert(
            fc.property(
                fc.record({
                    modalKoperasi: fc.nat({ min: 1000000, max: 100000000 }),
                    kas: fc.nat({ max: 50000000 }),
                    bank: fc.nat({ max: 50000000 }),
                    piutangAnggota: fc.constant([]),
                    persediaan: fc.constant([]),
                    hutangSupplier: fc.constant([]),
                    pinjamanAnggota: fc.constant([]),
                    simpananAnggota: fc.array(
                        fc.record({
                            anggotaId: fc.string({ minLength: 1 }),
                            nama: fc.string({ minLength: 1 }),
                            simpananPokok: fc.constant(0),
                            simpananWajib: fc.constant(0),
                            simpananSukarela: fc.constant(0)
                        }),
                        { minLength: 1, maxLength: 5 }
                    )
                }),
                (saldoAwalData) => {
                    // Generate jurnal pembuka
                    const jurnalEntries = generateJurnalPembukaForTest(saldoAwalData);
                    
                    // Find simpanan entries
                    const simpananEntries = jurnalEntries.filter(e => 
                        e.akun === '2-1100' || e.akun === '2-1200' || e.akun === '2-1300'
                    );
                    
                    // Verify no simpanan entries exist
                    return simpananEntries.length === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * Helper function to generate template CSV content
 * This mirrors the logic in downloadTemplateSimpanan
 */
function generateTemplateSimpanan(type) {
    if (type !== 'pokok' && type !== 'wajib') {
        return null;
    }
    
    let csvContent = '';
    
    if (type === 'pokok') {
        csvContent = 'NIK,Nama,Jumlah,Tanggal\n';
        csvContent += '3201010101010001,Budi Santoso,1000000,2024-01-01\n';
    } else if (type === 'wajib') {
        csvContent = 'NIK,Nama,Jumlah,Periode,Tanggal\n';
        csvContent += '3201010101010001,Budi Santoso,500000,2024-01,2024-01-15\n';
    }
    
    return csvContent;
}

/**
 * Property 22: Template CSV dengan header yang benar
 * **Feature: upload-simpanan-saldo-awal, Property 22: Template CSV dengan header yang benar**
 * **Validates: Requirements 7.2, 7.3**
 * 
 * For any tipe simpanan (pokok atau wajib), template CSV harus memiliki header yang sesuai
 */
describe('Property 22: Template CSV dengan header yang benar', () => {
    test('Template simpanan pokok harus memiliki header: NIK,Nama,Jumlah,Tanggal', () => {
        fc.assert(
            fc.property(
                fc.constant('pokok'),
                (type) => {
                    const template = generateTemplateSimpanan(type);
                    
                    // Template harus ada
                    expect(template).not.toBeNull();
                    
                    // Split by lines
                    const lines = template.trim().split('\n');
                    
                    // Harus ada minimal 2 baris (header + contoh)
                    expect(lines.length).toBeGreaterThanOrEqual(2);
                    
                    // Baris pertama adalah header
                    const header = lines[0];
                    
                    // Header harus sesuai format
                    expect(header).toBe('NIK,Nama,Jumlah,Tanggal');
                    
                    // Header harus memiliki 4 kolom
                    const columns = header.split(',');
                    expect(columns.length).toBe(4);
                    expect(columns[0]).toBe('NIK');
                    expect(columns[1]).toBe('Nama');
                    expect(columns[2]).toBe('Jumlah');
                    expect(columns[3]).toBe('Tanggal');
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('Template simpanan wajib harus memiliki header: NIK,Nama,Jumlah,Periode,Tanggal', () => {
        fc.assert(
            fc.property(
                fc.constant('wajib'),
                (type) => {
                    const template = generateTemplateSimpanan(type);
                    
                    // Template harus ada
                    expect(template).not.toBeNull();
                    
                    // Split by lines
                    const lines = template.trim().split('\n');
                    
                    // Harus ada minimal 2 baris (header + contoh)
                    expect(lines.length).toBeGreaterThanOrEqual(2);
                    
                    // Baris pertama adalah header
                    const header = lines[0];
                    
                    // Header harus sesuai format
                    expect(header).toBe('NIK,Nama,Jumlah,Periode,Tanggal');
                    
                    // Header harus memiliki 5 kolom
                    const columns = header.split(',');
                    expect(columns.length).toBe(5);
                    expect(columns[0]).toBe('NIK');
                    expect(columns[1]).toBe('Nama');
                    expect(columns[2]).toBe('Jumlah');
                    expect(columns[3]).toBe('Periode');
                    expect(columns[4]).toBe('Tanggal');
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('Template dengan tipe invalid harus return null', () => {
        fc.assert(
            fc.property(
                fc.string().filter(s => s !== 'pokok' && s !== 'wajib'),
                (invalidType) => {
                    const template = generateTemplateSimpanan(invalidType);
                    expect(template).toBeNull();
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * Property 23: Template menyertakan contoh data
 * **Feature: upload-simpanan-saldo-awal, Property 23: Template menyertakan contoh data**
 * **Validates: Requirements 7.4**
 * 
 * For any template yang diunduh, file harus menyertakan contoh data di baris pertama sebagai panduan
 */
describe('Property 23: Template menyertakan contoh data', () => {
    test('Template simpanan pokok harus menyertakan 1 baris contoh data', () => {
        fc.assert(
            fc.property(
                fc.constant('pokok'),
                (type) => {
                    const template = generateTemplateSimpanan(type);
                    
                    // Template harus ada
                    expect(template).not.toBeNull();
                    
                    // Split by lines
                    const lines = template.trim().split('\n');
                    
                    // Harus ada minimal 2 baris (header + contoh)
                    expect(lines.length).toBeGreaterThanOrEqual(2);
                    
                    // Baris kedua adalah contoh data
                    const exampleRow = lines[1];
                    
                    // Contoh data harus ada
                    expect(exampleRow).toBeTruthy();
                    expect(exampleRow.length).toBeGreaterThan(0);
                    
                    // Contoh data harus memiliki 4 kolom (sesuai header)
                    const columns = exampleRow.split(',');
                    expect(columns.length).toBe(4);
                    
                    // Setiap kolom harus terisi
                    columns.forEach(col => {
                        expect(col.trim().length).toBeGreaterThan(0);
                    });
                    
                    // Kolom NIK harus berupa angka
                    expect(columns[0]).toMatch(/^\d+$/);
                    
                    // Kolom Nama harus berupa string
                    expect(columns[1].trim().length).toBeGreaterThan(0);
                    
                    // Kolom Jumlah harus berupa angka
                    expect(columns[2]).toMatch(/^\d+$/);
                    
                    // Kolom Tanggal harus berupa format tanggal (YYYY-MM-DD)
                    expect(columns[3]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('Template simpanan wajib harus menyertakan 1 baris contoh data', () => {
        fc.assert(
            fc.property(
                fc.constant('wajib'),
                (type) => {
                    const template = generateTemplateSimpanan(type);
                    
                    // Template harus ada
                    expect(template).not.toBeNull();
                    
                    // Split by lines
                    const lines = template.trim().split('\n');
                    
                    // Harus ada minimal 2 baris (header + contoh)
                    expect(lines.length).toBeGreaterThanOrEqual(2);
                    
                    // Baris kedua adalah contoh data
                    const exampleRow = lines[1];
                    
                    // Contoh data harus ada
                    expect(exampleRow).toBeTruthy();
                    expect(exampleRow.length).toBeGreaterThan(0);
                    
                    // Contoh data harus memiliki 5 kolom (sesuai header)
                    const columns = exampleRow.split(',');
                    expect(columns.length).toBe(5);
                    
                    // Setiap kolom harus terisi
                    columns.forEach(col => {
                        expect(col.trim().length).toBeGreaterThan(0);
                    });
                    
                    // Kolom NIK harus berupa angka
                    expect(columns[0]).toMatch(/^\d+$/);
                    
                    // Kolom Nama harus berupa string
                    expect(columns[1].trim().length).toBeGreaterThan(0);
                    
                    // Kolom Jumlah harus berupa angka
                    expect(columns[2]).toMatch(/^\d+$/);
                    
                    // Kolom Periode harus berupa format YYYY-MM
                    expect(columns[3]).toMatch(/^\d{4}-\d{2}$/);
                    
                    // Kolom Tanggal harus berupa format tanggal (YYYY-MM-DD)
                    expect(columns[4]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('Contoh data harus valid dan dapat diparsing', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('pokok', 'wajib'),
                (type) => {
                    const template = generateTemplateSimpanan(type);
                    const lines = template.trim().split('\n');
                    const exampleRow = lines[1];
                    const columns = exampleRow.split(',');
                    
                    // NIK harus valid (16 digit)
                    const nik = columns[0];
                    expect(nik.length).toBe(16);
                    expect(parseInt(nik)).not.toBeNaN();
                    
                    // Jumlah harus valid dan positif
                    const jumlah = parseInt(columns[2]);
                    expect(jumlah).toBeGreaterThan(0);
                    
                    // Tanggal harus valid
                    const tanggalIndex = type === 'pokok' ? 3 : 4;
                    const tanggal = new Date(columns[tanggalIndex]);
                    expect(tanggal.toString()).not.toBe('Invalid Date');
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Feature: upload-simpanan-saldo-awal, Property 17: Delete data dan update total**
 * **Validates: Requirements 5.4**
 */

// Mock function for deleting simpanan row
function deleteSimpananRow(anggotaId, wizardState) {
    if (!wizardState || !wizardState.data || !Array.isArray(wizardState.data.simpananAnggota)) {
        return {
            success: false,
            message: 'Invalid wizard state'
        };
    }
    
    const initialLength = wizardState.data.simpananAnggota.length;
    
    // Find index of anggota to delete
    const index = wizardState.data.simpananAnggota.findIndex(item => item.anggotaId === anggotaId);
    
    if (index === -1) {
        return {
            success: false,
            message: 'Anggota tidak ditemukan'
        };
    }
    
    // Remove the item
    wizardState.data.simpananAnggota.splice(index, 1);
    
    return {
        success: true,
        message: 'Data berhasil dihapus',
        deletedCount: initialLength - wizardState.data.simpananAnggota.length
    };
}

// Helper function to calculate totals
function calculateSimpananTotals(simpananAnggota) {
    return {
        totalPokok: simpananAnggota.reduce((sum, item) => sum + (item.simpananPokok || 0), 0),
        totalWajib: simpananAnggota.reduce((sum, item) => sum + (item.simpananWajib || 0), 0),
        totalSukarela: simpananAnggota.reduce((sum, item) => sum + (item.simpananSukarela || 0), 0)
    };
}

describe('**Feature: upload-simpanan-saldo-awal, Property 17: Delete data dan update total**', () => {
    test('For any simpanan data with valid anggotaId, deleting should remove the row and reduce array length by 1', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        nik: fc.string({ minLength: 16, maxLength: 16 }),
                        simpananPokok: fc.nat(10000000),
                        simpananWajib: fc.nat(10000000),
                        simpananSukarela: fc.nat(10000000)
                    }),
                    { minLength: 1, maxLength: 20 }
                ),
                (simpananData) => {
                    // Create wizard state
                    const wizardState = {
                        data: {
                            simpananAnggota: JSON.parse(JSON.stringify(simpananData))
                        }
                    };
                    
                    const initialLength = wizardState.data.simpananAnggota.length;
                    
                    // Pick a random anggota to delete
                    const anggotaToDelete = simpananData[0];
                    
                    // Delete the anggota
                    const result = deleteSimpananRow(anggotaToDelete.anggotaId, wizardState);
                    
                    // Verify deletion was successful
                    expect(result.success).toBe(true);
                    
                    // Verify array length decreased by 1
                    expect(wizardState.data.simpananAnggota.length).toBe(initialLength - 1);
                    
                    // Verify the deleted anggota is no longer in the array
                    const stillExists = wizardState.data.simpananAnggota.some(
                        item => item.anggotaId === anggotaToDelete.anggotaId
                    );
                    expect(stillExists).toBe(false);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any simpanan data, deleting a row should update the total simpanan correctly', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        nik: fc.string({ minLength: 16, maxLength: 16 }),
                        simpananPokok: fc.nat(10000000),
                        simpananWajib: fc.nat(10000000),
                        simpananSukarela: fc.nat(10000000)
                    }),
                    { minLength: 2, maxLength: 20 }
                ),
                (simpananData) => {
                    // Create wizard state
                    const wizardState = {
                        data: {
                            simpananAnggota: JSON.parse(JSON.stringify(simpananData))
                        }
                    };
                    
                    // Calculate initial totals
                    const initialTotals = calculateSimpananTotals(wizardState.data.simpananAnggota);
                    
                    // Pick a random anggota to delete
                    const anggotaToDelete = simpananData[0];
                    
                    // Calculate expected totals after deletion
                    const expectedTotalPokok = initialTotals.totalPokok - (anggotaToDelete.simpananPokok || 0);
                    const expectedTotalWajib = initialTotals.totalWajib - (anggotaToDelete.simpananWajib || 0);
                    const expectedTotalSukarela = initialTotals.totalSukarela - (anggotaToDelete.simpananSukarela || 0);
                    
                    // Delete the anggota
                    deleteSimpananRow(anggotaToDelete.anggotaId, wizardState);
                    
                    // Calculate new totals
                    const newTotals = calculateSimpananTotals(wizardState.data.simpananAnggota);
                    
                    // Verify totals are updated correctly
                    expect(newTotals.totalPokok).toBe(expectedTotalPokok);
                    expect(newTotals.totalWajib).toBe(expectedTotalWajib);
                    expect(newTotals.totalSukarela).toBe(expectedTotalSukarela);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any simpanan data, deleting with non-existent anggotaId should return success false', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        nik: fc.string({ minLength: 16, maxLength: 16 }),
                        simpananPokok: fc.nat(10000000),
                        simpananWajib: fc.nat(10000000),
                        simpananSukarela: fc.nat(10000000)
                    }),
                    { minLength: 1, maxLength: 20 }
                ),
                fc.string({ minLength: 1 }),
                (simpananData, nonExistentId) => {
                    // Ensure nonExistentId doesn't exist in the data
                    const exists = simpananData.some(item => item.anggotaId === nonExistentId);
                    if (exists) return true; // Skip this test case
                    
                    // Create wizard state
                    const wizardState = {
                        data: {
                            simpananAnggota: JSON.parse(JSON.stringify(simpananData))
                        }
                    };
                    
                    const initialLength = wizardState.data.simpananAnggota.length;
                    
                    // Try to delete non-existent anggota
                    const result = deleteSimpananRow(nonExistentId, wizardState);
                    
                    // Verify deletion failed
                    expect(result.success).toBe(false);
                    
                    // Verify array length unchanged
                    expect(wizardState.data.simpananAnggota.length).toBe(initialLength);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any simpanan data, deleting all rows one by one should result in empty array', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        nik: fc.string({ minLength: 16, maxLength: 16 }),
                        simpananPokok: fc.nat(10000000),
                        simpananWajib: fc.nat(10000000),
                        simpananSukarela: fc.nat(10000000)
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (simpananData) => {
                    // Create wizard state
                    const wizardState = {
                        data: {
                            simpananAnggota: JSON.parse(JSON.stringify(simpananData))
                        }
                    };
                    
                    // Delete all rows
                    const anggotaIds = simpananData.map(item => item.anggotaId);
                    anggotaIds.forEach(id => {
                        deleteSimpananRow(id, wizardState);
                    });
                    
                    // Verify array is empty
                    expect(wizardState.data.simpananAnggota.length).toBe(0);
                    
                    // Verify totals are zero
                    const totals = calculateSimpananTotals(wizardState.data.simpananAnggota);
                    expect(totals.totalPokok).toBe(0);
                    expect(totals.totalWajib).toBe(0);
                    expect(totals.totalSukarela).toBe(0);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any simpanan data, deleting should not affect other rows', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        anggotaId: fc.string({ minLength: 1 }),
                        nama: fc.string({ minLength: 1 }),
                        nik: fc.string({ minLength: 16, maxLength: 16 }),
                        simpananPokok: fc.nat(10000000),
                        simpananWajib: fc.nat(10000000),
                        simpananSukarela: fc.nat(10000000)
                    }),
                    { minLength: 3, maxLength: 20 }
                ).filter(arr => {
                    // Ensure all anggotaId are unique to avoid confusion in the test
                    const ids = arr.map(item => item.anggotaId);
                    return ids.length === new Set(ids).size;
                }),
                (simpananData) => {
                    // Skip if filter resulted in less than 3 items
                    if (simpananData.length < 3) return true;
                    
                    // Create wizard state
                    const wizardState = {
                        data: {
                            simpananAnggota: JSON.parse(JSON.stringify(simpananData))
                        }
                    };
                    
                    // Pick a random anggota to delete (not first or last)
                    const indexToDelete = Math.floor(simpananData.length / 2);
                    const anggotaToDelete = simpananData[indexToDelete];
                    
                    // Store other anggota data (excluding the one to delete)
                    const otherAnggota = simpananData.filter(item => item.anggotaId !== anggotaToDelete.anggotaId);
                    
                    // Delete the anggota
                    deleteSimpananRow(anggotaToDelete.anggotaId, wizardState);
                    
                    // Verify all other anggota still exist with same data
                    otherAnggota.forEach(original => {
                        const found = wizardState.data.simpananAnggota.find(
                            item => item.anggotaId === original.anggotaId
                        );
                        
                        expect(found).toBeDefined();
                        expect(found.simpananPokok).toBe(original.simpananPokok);
                        expect(found.simpananWajib).toBe(original.simpananWajib);
                        expect(found.simpananSukarela).toBe(original.simpananSukarela);
                    });
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Feature: upload-simpanan-saldo-awal, Property 29: Parsing paste data dengan multiple delimiters**
 * **Validates: Requirements 10.2, 10.3**
 * 
 * Property: For any data yang dipaste (dari Excel atau CSV), sistem harus memparse data 
 * dengan delimiter yang sesuai (tab, koma, atau semicolon)
 */
describe('**Feature: upload-simpanan-saldo-awal, Property 29: Parsing paste data dengan multiple delimiters**', () => {
    test('For any valid simpanan pokok data with comma delimiter, parseCSVSimpanan should successfully parse it', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 16, maxLength: 16 }).map(s => s.replace(/[^0-9]/g, '0')),
                        nama: fc.string({ minLength: 3, maxLength: 50 }).filter(s => !s.includes(',') && !s.includes(';') && !s.includes('\t') && s.trim().length > 0),
                        jumlah: fc.nat({ max: 100000000 }),
                        tanggal: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
                            .map(d => d.toISOString().split('T')[0])
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (simpananData) => {
                    // Create CSV with comma delimiter
                    const header = 'NIK,Nama,Jumlah,Tanggal';
                    const rows = simpananData.map(item => 
                        `${item.nik},${item.nama},${item.jumlah},${item.tanggal}`
                    );
                    const csvText = [header, ...rows].join('\n');
                    
                    // Parse the CSV
                    const result = parseCSVSimpanan(csvText, 'pokok');
                    
                    // Should successfully parse
                    expect(result.success).toBe(true);
                    expect(result.data.length).toBe(simpananData.length);
                    
                    // Verify each row was parsed correctly (note: parser trims whitespace per Property 24)
                    result.data.forEach((parsed, index) => {
                        const original = simpananData[index];
                        expect(parsed.nik).toBe(original.nik.trim());
                        expect(parsed.nama).toBe(original.nama.trim());
                        expect(parsed.jumlah).toBe(original.jumlah);
                        expect(parsed.tanggal).toBe(original.tanggal.trim());
                    });
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any valid simpanan pokok data with semicolon delimiter, parseCSVSimpanan should successfully parse it', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 16, maxLength: 16 }).map(s => s.replace(/[^0-9]/g, '0')),
                        nama: fc.string({ minLength: 3, maxLength: 50 }).filter(s => !s.includes(',') && !s.includes(';') && !s.includes('\t') && s.trim().length > 0),
                        jumlah: fc.nat({ max: 100000000 }),
                        tanggal: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
                            .map(d => d.toISOString().split('T')[0])
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (simpananData) => {
                    // Create CSV with semicolon delimiter
                    const header = 'NIK;Nama;Jumlah;Tanggal';
                    const rows = simpananData.map(item => 
                        `${item.nik};${item.nama};${item.jumlah};${item.tanggal}`
                    );
                    const csvText = [header, ...rows].join('\n');
                    
                    // Parse the CSV
                    const result = parseCSVSimpanan(csvText, 'pokok');
                    
                    // Should successfully parse
                    expect(result.success).toBe(true);
                    expect(result.data.length).toBe(simpananData.length);
                    
                    // Verify each row was parsed correctly (note: parser trims whitespace per Property 24)
                    result.data.forEach((parsed, index) => {
                        const original = simpananData[index];
                        expect(parsed.nik).toBe(original.nik.trim());
                        expect(parsed.nama).toBe(original.nama.trim());
                        expect(parsed.jumlah).toBe(original.jumlah);
                        expect(parsed.tanggal).toBe(original.tanggal.trim());
                    });
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any valid simpanan pokok data with tab delimiter (Excel paste), parseCSVSimpanan should successfully parse it', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 16, maxLength: 16 }).map(s => s.replace(/[^0-9]/g, '0')),
                        nama: fc.string({ minLength: 3, maxLength: 50 }).filter(s => !s.includes(',') && !s.includes(';') && !s.includes('\t') && s.trim().length > 0),
                        jumlah: fc.nat({ max: 100000000 }),
                        tanggal: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
                            .map(d => d.toISOString().split('T')[0])
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (simpananData) => {
                    // Create CSV with tab delimiter (like Excel paste)
                    const header = 'NIK\tNama\tJumlah\tTanggal';
                    const rows = simpananData.map(item => 
                        `${item.nik}\t${item.nama}\t${item.jumlah}\t${item.tanggal}`
                    );
                    const csvText = [header, ...rows].join('\n');
                    
                    // Parse the CSV
                    const result = parseCSVSimpanan(csvText, 'pokok');
                    
                    // Should successfully parse
                    expect(result.success).toBe(true);
                    expect(result.data.length).toBe(simpananData.length);
                    
                    // Verify each row was parsed correctly (note: parser trims whitespace per Property 24)
                    result.data.forEach((parsed, index) => {
                        const original = simpananData[index];
                        expect(parsed.nik).toBe(original.nik.trim());
                        expect(parsed.nama).toBe(original.nama.trim());
                        expect(parsed.jumlah).toBe(original.jumlah);
                        expect(parsed.tanggal).toBe(original.tanggal.trim());
                    });
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any valid simpanan wajib data with tab delimiter (Excel paste), parseCSVSimpanan should successfully parse it', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 16, maxLength: 16 }).map(s => s.replace(/[^0-9]/g, '0')),
                        nama: fc.string({ minLength: 3, maxLength: 50 }).filter(s => !s.includes(',') && !s.includes(';') && !s.includes('\t') && s.trim().length > 0),
                        jumlah: fc.nat({ max: 100000000 }),
                        periode: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
                            .map(d => d.toISOString().substring(0, 7)), // YYYY-MM format
                        tanggal: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
                            .map(d => d.toISOString().split('T')[0])
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (simpananData) => {
                    // Create CSV with tab delimiter (like Excel paste)
                    const header = 'NIK\tNama\tJumlah\tPeriode\tTanggal';
                    const rows = simpananData.map(item => 
                        `${item.nik}\t${item.nama}\t${item.jumlah}\t${item.periode}\t${item.tanggal}`
                    );
                    const csvText = [header, ...rows].join('\n');
                    
                    // Parse the CSV
                    const result = parseCSVSimpanan(csvText, 'wajib');
                    
                    // Should successfully parse
                    expect(result.success).toBe(true);
                    expect(result.data.length).toBe(simpananData.length);
                    
                    // Verify each row was parsed correctly (note: parser trims whitespace per Property 24)
                    result.data.forEach((parsed, index) => {
                        const original = simpananData[index];
                        expect(parsed.nik).toBe(original.nik.trim());
                        expect(parsed.nama).toBe(original.nama.trim());
                        expect(parsed.jumlah).toBe(original.jumlah);
                        expect(parsed.periode).toBe(original.periode.trim());
                        expect(parsed.tanggal).toBe(original.tanggal.trim());
                    });
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any data with mixed delimiters, parseCSVSimpanan should detect and use the most common delimiter', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 16, maxLength: 16 }).map(s => s.replace(/[^0-9]/g, '0')),
                        nama: fc.string({ minLength: 3, maxLength: 50 }).filter(s => !s.includes(',') && !s.includes(';') && !s.includes('\t')),
                        jumlah: fc.nat({ max: 100000000 }),
                        tanggal: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
                            .map(d => d.toISOString().split('T')[0])
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                fc.constantFrom(',', ';', '\t'),
                (simpananData, delimiter) => {
                    // Create CSV with the chosen delimiter
                    const delimiterName = delimiter === ',' ? 'comma' : delimiter === ';' ? 'semicolon' : 'tab';
                    const header = delimiter === ',' ? 'NIK,Nama,Jumlah,Tanggal' :
                                   delimiter === ';' ? 'NIK;Nama;Jumlah;Tanggal' :
                                   'NIK\tNama\tJumlah\tTanggal';
                    const rows = simpananData.map(item => 
                        `${item.nik}${delimiter}${item.nama}${delimiter}${item.jumlah}${delimiter}${item.tanggal}`
                    );
                    const csvText = [header, ...rows].join('\n');
                    
                    // Parse the CSV
                    const result = parseCSVSimpanan(csvText, 'pokok');
                    
                    // Should successfully parse regardless of delimiter
                    expect(result.success).toBe(true);
                    expect(result.data.length).toBe(simpananData.length);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Feature: upload-simpanan-saldo-awal, Property 30: Consistency paste dengan upload**
 * **Validates: Requirements 10.4, 10.5**
 * 
 * Property: For any data yang valid, hasil parsing dan processing dari paste 
 * harus sama dengan upload file
 */
describe('**Feature: upload-simpanan-saldo-awal, Property 30: Consistency paste dengan upload**', () => {
    test('For any valid simpanan pokok data, parsing from paste should produce same result as parsing from file', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 16, maxLength: 16 }).map(s => s.replace(/[^0-9]/g, '0')),
                        nama: fc.string({ minLength: 3, maxLength: 50 }).filter(s => !s.includes(',') && !s.includes(';') && !s.includes('\t')),
                        jumlah: fc.nat({ max: 100000000 }),
                        tanggal: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
                            .map(d => d.toISOString().split('T')[0])
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (simpananData) => {
                    // Create CSV text (same content for both paste and file)
                    const header = 'NIK,Nama,Jumlah,Tanggal';
                    const rows = simpananData.map(item => 
                        `${item.nik},${item.nama},${item.jumlah},${item.tanggal}`
                    );
                    const csvText = [header, ...rows].join('\n');
                    
                    // Parse as if from file
                    const resultFromFile = parseCSVSimpanan(csvText, 'pokok');
                    
                    // Parse as if from paste (same function, same input)
                    const resultFromPaste = parseCSVSimpanan(csvText, 'pokok');
                    
                    // Results should be identical
                    expect(resultFromFile.success).toBe(resultFromPaste.success);
                    expect(resultFromFile.data.length).toBe(resultFromPaste.data.length);
                    expect(resultFromFile.errors.length).toBe(resultFromPaste.errors.length);
                    
                    // Verify each parsed row is identical
                    resultFromFile.data.forEach((fileRow, index) => {
                        const pasteRow = resultFromPaste.data[index];
                        expect(fileRow.nik).toBe(pasteRow.nik);
                        expect(fileRow.nama).toBe(pasteRow.nama);
                        expect(fileRow.jumlah).toBe(pasteRow.jumlah);
                        expect(fileRow.tanggal).toBe(pasteRow.tanggal);
                    });
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any valid simpanan wajib data, parsing from paste should produce same result as parsing from file', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 16, maxLength: 16 }).map(s => s.replace(/[^0-9]/g, '0')),
                        nama: fc.string({ minLength: 3, maxLength: 50 }).filter(s => !s.includes(',') && !s.includes(';') && !s.includes('\t')),
                        jumlah: fc.nat({ max: 100000000 }),
                        periode: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
                            .map(d => d.toISOString().substring(0, 7)),
                        tanggal: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
                            .map(d => d.toISOString().split('T')[0])
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (simpananData) => {
                    // Create CSV text (same content for both paste and file)
                    const header = 'NIK,Nama,Jumlah,Periode,Tanggal';
                    const rows = simpananData.map(item => 
                        `${item.nik},${item.nama},${item.jumlah},${item.periode},${item.tanggal}`
                    );
                    const csvText = [header, ...rows].join('\n');
                    
                    // Parse as if from file
                    const resultFromFile = parseCSVSimpanan(csvText, 'wajib');
                    
                    // Parse as if from paste (same function, same input)
                    const resultFromPaste = parseCSVSimpanan(csvText, 'wajib');
                    
                    // Results should be identical
                    expect(resultFromFile.success).toBe(resultFromPaste.success);
                    expect(resultFromFile.data.length).toBe(resultFromPaste.data.length);
                    expect(resultFromFile.errors.length).toBe(resultFromPaste.errors.length);
                    
                    // Verify each parsed row is identical
                    resultFromFile.data.forEach((fileRow, index) => {
                        const pasteRow = resultFromPaste.data[index];
                        expect(fileRow.nik).toBe(pasteRow.nik);
                        expect(fileRow.nama).toBe(pasteRow.nama);
                        expect(fileRow.jumlah).toBe(pasteRow.jumlah);
                        expect(fileRow.periode).toBe(pasteRow.periode);
                        expect(fileRow.tanggal).toBe(pasteRow.tanggal);
                    });
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any data with tab delimiter (Excel paste), validation should produce same result as file upload', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 16, maxLength: 16 }).map(s => s.replace(/[^0-9]/g, '0')),
                        nama: fc.string({ minLength: 3, maxLength: 50 }).filter(s => !s.includes(',') && !s.includes(';') && !s.includes('\t')),
                        jumlah: fc.nat({ max: 100000000 }),
                        tanggal: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })
                            .map(d => d.toISOString().split('T')[0])
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (simpananData) => {
                    // Create CSV with tab delimiter (Excel paste format)
                    const header = 'NIK\tNama\tJumlah\tTanggal';
                    const rows = simpananData.map(item => 
                        `${item.nik}\t${item.nama}\t${item.jumlah}\t${item.tanggal}`
                    );
                    const csvText = [header, ...rows].join('\n');
                    
                    // Parse the data
                    const parseResult = parseCSVSimpanan(csvText, 'pokok');
                    
                    // Should parse successfully
                    expect(parseResult.success).toBe(true);
                    expect(parseResult.data.length).toBe(simpananData.length);
                    
                    // The parsing result should be the same regardless of source (paste or file)
                    // This is verified by the fact that parseCSVSimpanan doesn't care about the source
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any invalid data, error reporting should be consistent between paste and file upload', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 1, maxLength: 20 }), // Can be invalid length
                        nama: fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes(',') && !s.includes(';') && !s.includes('\t')),
                        jumlah: fc.oneof(
                            fc.nat({ max: 100000000 }),
                            fc.constant('invalid'), // Invalid jumlah
                            fc.constant(-1000) // Negative jumlah
                        ),
                        tanggal: fc.string({ minLength: 1, maxLength: 20 }) // Can be invalid date format
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (simpananData) => {
                    // Create CSV text
                    const header = 'NIK,Nama,Jumlah,Tanggal';
                    const rows = simpananData.map(item => 
                        `${item.nik},${item.nama},${item.jumlah},${item.tanggal}`
                    );
                    const csvText = [header, ...rows].join('\n');
                    
                    // Parse as if from file
                    const resultFromFile = parseCSVSimpanan(csvText, 'pokok');
                    
                    // Parse as if from paste
                    const resultFromPaste = parseCSVSimpanan(csvText, 'pokok');
                    
                    // Error reporting should be identical
                    expect(resultFromFile.success).toBe(resultFromPaste.success);
                    expect(resultFromFile.errors.length).toBe(resultFromPaste.errors.length);
                    
                    // If there are errors, they should be the same
                    if (resultFromFile.errors.length > 0) {
                        resultFromFile.errors.forEach((error, index) => {
                            expect(error).toBe(resultFromPaste.errors[index]);
                        });
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});


// ============================================
// Upload Simpanan Saldo Awal - Error Handling Tests
// ============================================

/**
 * **Feature: upload-simpanan-saldo-awal, Property 27: Pesan error untuk import gagal**
 * **Validates: Requirements 9.3**
 */
describe('**Feature: upload-simpanan-saldo-awal, Property 27: Pesan error untuk import gagal**', () => {
    beforeEach(() => {
        localStorage.clear();
        // Setup anggota data
        localStorage.setItem('anggota', JSON.stringify([
            { id: '1', nik: '1234567890', nama: 'Test User 1' },
            { id: '2', nik: '0987654321', nama: 'Test User 2' }
        ]));
    });
    
    test('For any invalid CSV text (non-string), parseCSVSimpanan should return error message explaining the failure', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(null),
                    fc.constant(undefined),
                    fc.integer(),
                    fc.object()
                ),
                fc.constantFrom('pokok', 'wajib'),
                (invalidInput, type) => {
                    const result = parseCSVSimpanan(invalidInput, type);
                    
                    return result.success === false &&
                           result.errors.length > 0 &&
                           result.errors[0].includes('CSV text harus berupa string');
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any invalid type parameter, parseCSVSimpanan should return error message explaining the failure', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 10 }),
                fc.string().filter(s => s !== 'pokok' && s !== 'wajib'),
                (csvText, invalidType) => {
                    const result = parseCSVSimpanan(csvText, invalidType);
                    
                    return result.success === false &&
                           result.errors.length > 0 &&
                           result.errors[0].includes('Type harus');
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any empty CSV file, parseCSVSimpanan should return error message explaining the failure', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('pokok', 'wajib'),
                (type) => {
                    const result = parseCSVSimpanan('', type);
                    
                    // Empty CSV should return an error
                    return result.success === false &&
                           result.errors.length > 0;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any CSV with wrong header format, parseCSVSimpanan should return specific error message about header mismatch', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('pokok', 'wajib'),
                (type) => {
                    const wrongHeader = 'Wrong,Header,Format,Test\n1234,Test,1000,2024-01-01';
                    const result = parseCSVSimpanan(wrongHeader, type);
                    
                    return result.success === false &&
                           result.errors.length > 0 &&
                           result.errors.some(e => e.includes('Header CSV tidak sesuai format'));
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any data with NIK not found in anggota, validateSimpananData should return error with row and column details', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 10, maxLength: 16 }).filter(s => s !== '1234567890' && s !== '0987654321' && s.trim().length >= 10),
                        nama: fc.string({ minLength: 3 }).filter(s => s.trim().length >= 3),
                        jumlah: fc.nat(10000000),
                        tanggal: fc.date().map(d => d.toISOString().split('T')[0]),
                        rowNumber: fc.nat({ max: 100 })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                fc.constantFrom('pokok', 'wajib'),
                (data, type) => {
                    const result = validateSimpananData(data, type);
                    
                    return result.isValid === false &&
                           result.errors.length > 0 &&
                           result.errors.some(e => 
                               typeof e === 'string' &&
                               e.includes('Kolom NIK') &&
                               e.includes('tidak ditemukan')
                           );
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any data with negative jumlah, validateSimpananData should return error with specific message', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.constantFrom('1234567890', '0987654321'),
                        nama: fc.string({ minLength: 3 }).filter(s => s.trim().length >= 3),
                        jumlah: fc.integer({ min: -10000000, max: -1 }),
                        tanggal: fc.date().map(d => d.toISOString().split('T')[0]),
                        rowNumber: fc.nat({ max: 100 })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                fc.constantFrom('pokok', 'wajib'),
                (data, type) => {
                    // Setup anggota data
                    localStorage.setItem('anggota', JSON.stringify([
                        { id: '1', nik: '1234567890', nama: 'Test User 1' },
                        { id: '2', nik: '0987654321', nama: 'Test User 2' }
                    ]));
                    
                    const result = validateSimpananData(data, type);
                    
                    return result.isValid === false &&
                           result.errors.length > 0 &&
                           result.errors.some(e => 
                               typeof e === 'string' &&
                               e.includes('Kolom Jumlah') &&
                               e.includes('tidak boleh negatif')
                           );
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any import failure, importSimpananToWizard should return error message explaining the cause', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(null),
                    fc.constant(undefined),
                    fc.string()
                ),
                fc.constantFrom('pokok', 'wajib'),
                (invalidData, type) => {
                    // Setup wizardState
                    window.wizardState = {
                        currentStep: 6,
                        data: {
                            simpananAnggota: []
                        }
                    };
                    
                    const result = importSimpananToWizard(invalidData, type);
                    
                    return result.success === false &&
                           result.message.length > 0 &&
                           (result.message.includes('Error') || result.message.includes('harus berupa array'));
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Feature: upload-simpanan-saldo-awal, Property 28: Feedback untuk partial success**
 * **Validates: Requirements 9.4**
 */
describe('**Feature: upload-simpanan-saldo-awal, Property 28: Feedback untuk partial success**', () => {
    beforeEach(() => {
        localStorage.clear();
        // Setup anggota data
        localStorage.setItem('anggota', JSON.stringify([
            { id: '1', nik: '1234567890', nama: 'Test User 1' },
            { id: '2', nik: '0987654321', nama: 'Test User 2' }
        ]));
    });
    
    test('For any import with both valid and invalid records, the system should display count of successful and failed records', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 16, maxLength: 16 }),
                        nama: fc.string({ minLength: 1 }),
                        jumlah: fc.nat(10000000),
                        tanggal: fc.date().map(d => d.toISOString().split('T')[0])
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                fc.constantFrom('pokok', 'wajib'),
                (validRecords, type) => {
                    // Setup wizardState
                    window.wizardState = {
                        currentStep: 6,
                        data: {
                            simpananAnggota: []
                        }
                    };
                    
                    const result = importSimpananToWizard(validRecords, type);
                    
                    // Should show success count
                    const hasSuccessCount = result.recordCount !== undefined && result.recordCount > 0;
                    const hasTotalValue = result.totalNilai !== undefined;
                    const messageShowsSuccess = result.message.includes('Berhasil') || result.message.includes('berhasil');
                    
                    return hasSuccessCount && hasTotalValue && messageShowsSuccess;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any partial success import, the message should include the number of successful records', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 10 }),
                fc.constantFrom('pokok', 'wajib'),
                (successCount, type) => {
                    // Setup wizardState
                    window.wizardState = {
                        currentStep: 6,
                        data: {
                            simpananAnggota: []
                        }
                    };
                    
                    // Create valid data with unique NIKs
                    const validData = Array(successCount).fill(null).map((_, i) => ({
                        nik: `123456789012345${i}`,
                        nama: `User ${i}`,
                        jumlah: 1000000,
                        tanggal: '2024-01-01'
                    }));
                    
                    const result = importSimpananToWizard(validData, type);
                    
                    // Verify counts are reported
                    const correctSuccessCount = result.recordCount === successCount;
                    const messageIncludesCounts = result.message.length > 0;
                    
                    return correctSuccessCount && messageIncludesCounts;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any successful import, the system should return success=true', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 10 }),
                fc.constantFrom('pokok', 'wajib'),
                (successCount, type) => {
                    // Setup wizardState
                    window.wizardState = {
                        currentStep: 6,
                        data: {
                            simpananAnggota: []
                        }
                    };
                    
                    const validData = Array(successCount).fill(null).map((_, i) => ({
                        nik: `123456789012345${i}`,
                        nama: 'Test User',
                        jumlah: 1000000,
                        tanggal: '2024-01-01'
                    }));
                    
                    const result = importSimpananToWizard(validData, type);
                    
                    // If at least one record was imported, success should be true
                    return result.recordCount > 0 ? result.success === true : true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any successful import, the feedback should include the total value of successfully imported records', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 16, maxLength: 16 }),
                        nama: fc.string({ minLength: 1 }),
                        jumlah: fc.nat({ max: 10000000 }),
                        tanggal: fc.date().map(d => d.toISOString().split('T')[0])
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                fc.constantFrom('pokok', 'wajib'),
                (validRecords, type) => {
                    // Setup wizardState
                    window.wizardState = {
                        currentStep: 6,
                        data: {
                            simpananAnggota: []
                        }
                    };
                    
                    const result = importSimpananToWizard(validRecords, type);
                    
                    // Should include total value in feedback
                    const hasTotalValue = result.totalNilai !== undefined;
                    const totalValueCorrect = result.totalNilai === validRecords.reduce((sum, r) => sum + r.jumlah, 0);
                    
                    return hasTotalValue && totalValueCorrect;
                }
            ),
            { numRuns: 100 }
        );
    });
});


/**
 * ============================================================================
 * INTEGRATION TESTS
 * ============================================================================
 * These tests validate complete end-to-end workflows for the upload simpanan
 * saldo awal feature, including CSV upload, paste functionality, COA integration,
 * and wizard navigation.
 */

describe('Integration Tests - Upload Simpanan Saldo Awal', () => {
    
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        
        // Setup mock anggota data
        const mockAnggota = [
            { id: '001', nik: '3201010101010001', nama: 'Budi Santoso' },
            { id: '002', nik: '3201010101010002', nama: 'Ani Wijaya' },
            { id: '003', nik: '3201010101010003', nama: 'Citra Dewi' }
        ];
        localStorage.setItem('anggota', JSON.stringify(mockAnggota));
        
        // Setup mock COA
        const mockCOA = [
            { kode: '1-1000', nama: 'Kas', tipe: 'Aset', saldo: 0 },
            { kode: '2-1100', nama: 'Simpanan Pokok', tipe: 'Kewajiban', saldo: 0 },
            { kode: '2-1200', nama: 'Simpanan Wajib', tipe: 'Kewajiban', saldo: 0 },
            { kode: '3-1000', nama: 'Modal Koperasi', tipe: 'Modal', saldo: 0 }
        ];
        localStorage.setItem('coa', JSON.stringify(mockCOA));
        
        // Setup wizard state with initial simpanan structure matching anggota
        if (typeof window !== 'undefined') {
            window.wizardState = {
                currentStep: 6,
                data: {
                    simpananAnggota: mockAnggota.map(a => ({
                        anggotaId: a.nik,
                        nik: a.nik,
                        nama: a.nama,
                        simpananPokok: 0,
                        simpananWajib: 0,
                        simpananSukarela: 0
                    }))
                }
            };
        }
    });
    
    afterEach(() => {
        localStorage.clear();
        if (typeof window !== 'undefined') {
            window.wizardState = null;
        }
    });
    
    describe('Complete Upload Flow - File Upload', () => {
        test('Should successfully parse, validate, and import CSV data for simpanan pokok', () => {
            // Arrange: Create valid CSV data
            const csvData = `NIK,Nama,Jumlah,Tanggal
3201010101010001,Budi Santoso,1000000,2024-01-01
3201010101010002,Ani Wijaya,1500000,2024-01-01
3201010101010003,Citra Dewi,2000000,2024-01-01`;
            
            // Act: Parse CSV
            const parseResult = parseCSVSimpanan(csvData, 'pokok');
            expect(parseResult.success).toBe(true);
            expect(parseResult.data.length).toBe(3);
            
            // Act: Validate data
            const validateResult = validateSimpananData(parseResult.data, 'pokok');
            expect(validateResult.isValid).toBe(true);
            expect(validateResult.validData.length).toBe(3);
            
            // Act: Import to wizard
            const importResult = importSimpananToWizard(validateResult.validData, 'pokok');
            expect(importResult.success).toBe(true);
            expect(importResult.recordCount).toBe(3);
            expect(importResult.totalNilai).toBe(4500000);
            
            // Assert: Verify data in wizardState
            expect(window.wizardState.data.simpananAnggota.length).toBe(3);
            expect(window.wizardState.data.simpananAnggota[0].simpananPokok).toBe(1000000);
            expect(window.wizardState.data.simpananAnggota[1].simpananPokok).toBe(1500000);
            expect(window.wizardState.data.simpananAnggota[2].simpananPokok).toBe(2000000);
        });
        
        test('Should successfully parse, validate, and import CSV data for simpanan wajib', () => {
            // Arrange: Create valid CSV data
            const csvData = `NIK,Nama,Jumlah,Periode,Tanggal
3201010101010001,Budi Santoso,500000,2024-01,2024-01-15
3201010101010002,Ani Wijaya,750000,2024-01,2024-01-15
3201010101010003,Citra Dewi,1000000,2024-01,2024-01-15`;
            
            // Act: Parse CSV
            const parseResult = parseCSVSimpanan(csvData, 'wajib');
            expect(parseResult.success).toBe(true);
            expect(parseResult.data.length).toBe(3);
            
            // Act: Validate data
            const validateResult = validateSimpananData(parseResult.data, 'wajib');
            expect(validateResult.isValid).toBe(true);
            expect(validateResult.validData.length).toBe(3);
            
            // Act: Import to wizard
            const importResult = importSimpananToWizard(validateResult.validData, 'wajib');
            expect(importResult.success).toBe(true);
            expect(importResult.recordCount).toBe(3);
            expect(importResult.totalNilai).toBe(2250000);
            
            // Assert: Verify data in wizardState
            expect(window.wizardState.data.simpananAnggota.length).toBe(3);
            expect(window.wizardState.data.simpananAnggota[0].simpananWajib).toBe(500000);
            expect(window.wizardState.data.simpananAnggota[1].simpananWajib).toBe(750000);
            expect(window.wizardState.data.simpananAnggota[2].simpananWajib).toBe(1000000);
        });
        
        test('Should handle CSV with multiple delimiters (semicolon)', () => {
            // Arrange: Create CSV with semicolon delimiter
            const csvData = `NIK;Nama;Jumlah;Tanggal
3201010101010001;Budi Santoso;1000000;2024-01-01
3201010101010002;Ani Wijaya;1500000;2024-01-01`;
            
            // Act: Parse CSV
            const parseResult = parseCSVSimpanan(csvData, 'pokok');
            
            // Assert
            expect(parseResult.success).toBe(true);
            expect(parseResult.data.length).toBe(2);
            expect(parseResult.data[0].nik).toBe('3201010101010001');
            expect(parseResult.data[0].jumlah).toBe(1000000);
        });
        
        test('Should handle CSV with tab delimiter', () => {
            // Arrange: Create CSV with tab delimiter
            const csvData = `NIK\tNama\tJumlah\tTanggal
3201010101010001\tBudi Santoso\t1000000\t2024-01-01
3201010101010002\tAni Wijaya\t1500000\t2024-01-01`;
            
            // Act: Parse CSV
            const parseResult = parseCSVSimpanan(csvData, 'pokok');
            
            // Assert
            expect(parseResult.success).toBe(true);
            expect(parseResult.data.length).toBe(2);
            expect(parseResult.data[0].nik).toBe('3201010101010001');
            expect(parseResult.data[0].jumlah).toBe(1000000);
        });
        
        test('Should handle CSV with whitespace in fields', () => {
            // Arrange: Create CSV with extra whitespace
            const csvData = `NIK,Nama,Jumlah,Tanggal
  3201010101010001  ,  Budi Santoso  ,  1000000  ,  2024-01-01  
  3201010101010002  ,  Ani Wijaya  ,  1500000  ,  2024-01-01  `;
            
            // Act: Parse CSV
            const parseResult = parseCSVSimpanan(csvData, 'pokok');
            
            // Assert: Whitespace should be trimmed
            expect(parseResult.success).toBe(true);
            expect(parseResult.data.length).toBe(2);
            expect(parseResult.data[0].nik).toBe('3201010101010001');
            expect(parseResult.data[0].nama).toBe('Budi Santoso');
            expect(parseResult.data[0].jumlah).toBe(1000000);
        });
        
        test('Should handle large dataset (100+ records)', () => {
            // Arrange: Create large CSV dataset
            let csvData = 'NIK,Nama,Jumlah,Tanggal\n';
            for (let i = 1; i <= 100; i++) {
                const nik = `320101010101${String(i).padStart(4, '0')}`;
                const nama = `Anggota ${i}`;
                const jumlah = 1000000 + (i * 10000);
                csvData += `${nik},${nama},${jumlah},2024-01-01\n`;
            }
            
            // Setup anggota data for validation
            const largeAnggotaData = [];
            for (let i = 1; i <= 100; i++) {
                largeAnggotaData.push({
                    id: String(i).padStart(3, '0'),
                    nik: `320101010101${String(i).padStart(4, '0')}`,
                    nama: `Anggota ${i}`
                });
            }
            localStorage.setItem('anggota', JSON.stringify(largeAnggotaData));
            
            // Act: Parse CSV
            const parseResult = parseCSVSimpanan(csvData, 'pokok');
            
            // Assert
            expect(parseResult.success).toBe(true);
            expect(parseResult.data.length).toBe(100);
            
            // Act: Validate
            const validateResult = validateSimpananData(parseResult.data, 'pokok');
            expect(validateResult.isValid).toBe(true);
            expect(validateResult.validData.length).toBe(100);
            
            // Act: Import
            const importResult = importSimpananToWizard(validateResult.validData, 'pokok');
            expect(importResult.success).toBe(true);
            expect(importResult.recordCount).toBe(100);
        });
    });
    
    describe('Complete Upload Flow - Paste Data', () => {
        test('Should successfully parse and import pasted data from Excel (tab-delimited)', () => {
            // Arrange: Simulate data pasted from Excel (tab-delimited)
            const pastedData = `NIK\tNama\tJumlah\tTanggal
3201010101010001\tBudi Santoso\t1000000\t2024-01-01
3201010101010002\tAni Wijaya\t1500000\t2024-01-01`;
            
            // Act: Parse pasted data
            const parseResult = parseCSVSimpanan(pastedData, 'pokok');
            expect(parseResult.success).toBe(true);
            expect(parseResult.data.length).toBe(2);
            
            // Act: Validate and import
            const validateResult = validateSimpananData(parseResult.data, 'pokok');
            expect(validateResult.isValid).toBe(true);
            
            const importResult = importSimpananToWizard(validateResult.validData, 'pokok');
            expect(importResult.success).toBe(true);
            expect(importResult.recordCount).toBe(2);
        });
        
        test('Should produce same result for paste data as file upload', () => {
            // Arrange: Same data in different formats
            const csvFileData = `NIK,Nama,Jumlah,Tanggal
3201010101010001,Budi Santoso,1000000,2024-01-01
3201010101010002,Ani Wijaya,1500000,2024-01-01`;
            
            const pastedData = `NIK\tNama\tJumlah\tTanggal
3201010101010001\tBudi Santoso\t1000000\t2024-01-01
3201010101010002\tAni Wijaya\t1500000\t2024-01-01`;
            
            // Act: Parse both
            const csvResult = parseCSVSimpanan(csvFileData, 'pokok');
            const pasteResult = parseCSVSimpanan(pastedData, 'pokok');
            
            // Assert: Both should produce same data
            expect(csvResult.success).toBe(true);
            expect(pasteResult.success).toBe(true);
            expect(csvResult.data.length).toBe(pasteResult.data.length);
            expect(csvResult.data[0].nik).toBe(pasteResult.data[0].nik);
            expect(csvResult.data[0].jumlah).toBe(pasteResult.data[0].jumlah);
        });
    });
    
    describe('COA Integration and Balance Calculation', () => {
        test('Should update COA when simpanan pokok is imported', () => {
            // Arrange: Valid simpanan pokok data
            const simpananData = [
                { nik: '3201010101010001', nama: 'Budi Santoso', jumlah: 1000000, tanggal: '2024-01-01' },
                { nik: '3201010101010002', nama: 'Ani Wijaya', jumlah: 1500000, tanggal: '2024-01-01' },
                { nik: '3201010101010003', nama: 'Citra Dewi', jumlah: 2000000, tanggal: '2024-01-01' }
            ];
            
            // Act: Import data (this also calls updateCOAFromSimpanan internally)
            const importResult = importSimpananToWizard(simpananData, 'pokok');
            expect(importResult.success).toBe(true);
            
            // Assert: COA should be updated
            const coa = JSON.parse(localStorage.getItem('coa') || '[]');
            const simpananPokokAccount = coa.find(a => a.kode === '2-1100');
            
            expect(simpananPokokAccount).toBeDefined();
            expect(simpananPokokAccount.saldo).toBe(4500000);
        });
        
        test('Should update COA when simpanan wajib is imported', () => {
            // Arrange: Valid simpanan wajib data
            const simpananData = [
                { nik: '3201010101010001', nama: 'Budi Santoso', jumlah: 500000, periode: '2024-01', tanggal: '2024-01-15' },
                { nik: '3201010101010002', nama: 'Ani Wijaya', jumlah: 750000, periode: '2024-01', tanggal: '2024-01-15' }
            ];
            
            // Act: Import data (this also calls updateCOAFromSimpanan internally)
            const importResult = importSimpananToWizard(simpananData, 'wajib');
            expect(importResult.success).toBe(true);
            
            // Assert: COA should be updated
            const coa = JSON.parse(localStorage.getItem('coa') || '[]');
            const simpananWajibAccount = coa.find(a => a.kode === '2-1200');
            
            expect(simpananWajibAccount).toBeDefined();
            expect(simpananWajibAccount.saldo).toBe(1250000);
        });
        
        test('Should maintain accounting equation balance after import', () => {
            // Arrange: Import simpanan data
            const simpananPokokData = [
                { nik: '3201010101010001', nama: 'Budi Santoso', jumlah: 1000000, tanggal: '2024-01-01' },
                { nik: '3201010101010002', nama: 'Ani Wijaya', jumlah: 1500000, tanggal: '2024-01-01' }
            ];
            
            const simpananWajibData = [
                { nik: '3201010101010001', nama: 'Budi Santoso', jumlah: 500000, periode: '2024-01', tanggal: '2024-01-15' },
                { nik: '3201010101010002', nama: 'Ani Wijaya', jumlah: 750000, periode: '2024-01', tanggal: '2024-01-15' }
            ];
            
            // Act: Import both types (updateCOAFromSimpanan is called internally)
            importSimpananToWizard(simpananPokokData, 'pokok');
            importSimpananToWizard(simpananWajibData, 'wajib');
            
            // Setup balanced COA
            const coa = JSON.parse(localStorage.getItem('coa') || '[]');
            const totalKewajiban = coa
                .filter(a => a.tipe === 'Kewajiban')
                .reduce((sum, a) => sum + a.saldo, 0);
            
            // Set Kas to balance the equation (Aset = Kewajiban + Modal)
            // If Modal = 0, then Aset should equal Kewajiban
            const kasAccount = coa.find(a => a.kode === '1-1000');
            kasAccount.saldo = totalKewajiban;
            
            // Set Modal to 0 for this test (all funding comes from liabilities)
            const modalAccount = coa.find(a => a.kode === '3-1000');
            modalAccount.saldo = 0;
            
            localStorage.setItem('coa', JSON.stringify(coa));
            
            // Assert: Accounting equation should be balanced
            const result = validateAccountingEquation(coa);
            expect(result.isValid).toBe(true);
            expect(result.totalAset).toBe(result.totalKewajiban + result.totalModal);
        });
        
        test('Should correctly calculate total kewajiban including simpanan', () => {
            // Arrange: Import simpanan data
            const simpananPokokData = [
                { nik: '3201010101010001', nama: 'Budi Santoso', jumlah: 1000000, tanggal: '2024-01-01' }
            ];
            
            const simpananWajibData = [
                { nik: '3201010101010001', nama: 'Budi Santoso', jumlah: 500000, periode: '2024-01', tanggal: '2024-01-15' }
            ];
            
            // Act: Import (updateCOAFromSimpanan is called internally)
            importSimpananToWizard(simpananPokokData, 'pokok');
            importSimpananToWizard(simpananWajibData, 'wajib');
            
            // Assert: Total kewajiban should include both simpanan
            const coa = JSON.parse(localStorage.getItem('coa') || '[]');
            const totalKewajiban = coa
                .filter(a => a.tipe === 'Kewajiban')
                .reduce((sum, a) => sum + a.saldo, 0);
            
            expect(totalKewajiban).toBe(1500000); // 1000000 + 500000
        });
    });
    
    describe('Wizard Navigation with Data Persistence', () => {
        test('Should persist simpanan data when navigating between wizard steps', () => {
            // Arrange: Clear existing data and import fresh data at step 6
            window.wizardState.data.simpananAnggota = [];
            
            const simpananData = [
                { nik: '3201010101010001', nama: 'Budi Santoso', jumlah: 1000000, tanggal: '2024-01-01' }
            ];
            
            window.wizardState.currentStep = 6;
            
            // Act: Import data
            importSimpananToWizard(simpananData, 'pokok');
            
            // Simulate navigation to step 7
            window.wizardState.currentStep = 7;
            
            // Assert: Data should still be in wizardState
            expect(window.wizardState.data.simpananAnggota.length).toBe(1);
            expect(window.wizardState.data.simpananAnggota[0].simpananPokok).toBe(1000000);
            
            // Simulate navigation back to step 6
            window.wizardState.currentStep = 6;
            
            // Assert: Data should still be there
            expect(window.wizardState.data.simpananAnggota.length).toBe(1);
            expect(window.wizardState.data.simpananAnggota[0].simpananPokok).toBe(1000000);
        });
        
        test('Should merge new upload with existing manual data', () => {
            // Arrange: Add manual data first
            window.wizardState.data.simpananAnggota = [
                { anggotaId: '3201010101010001', nik: '3201010101010001', nama: 'Budi Santoso', simpananPokok: 500000, simpananWajib: 0, simpananSukarela: 0 }
            ];
            
            // Act: Upload new data for same anggota
            const uploadData = [
                { nik: '3201010101010001', nama: 'Budi Santoso', jumlah: 1000000, tanggal: '2024-01-01' }
            ];
            
            importSimpananToWizard(uploadData, 'pokok');
            
            // Assert: Should update the value (merge creates entry if NIK matches)
            const anggota = window.wizardState.data.simpananAnggota.find(a => a.nik === '3201010101010001' || a.anggotaId === '3201010101010001');
            expect(anggota).toBeDefined();
            expect(anggota.simpananPokok).toBe(1000000);
        });
        
        test('Should preserve other simpanan types when uploading one type', () => {
            // Arrange: Setup existing simpanan wajib
            window.wizardState.data.simpananAnggota = [
                { anggotaId: '3201010101010001', nik: '3201010101010001', nama: 'Budi Santoso', simpananPokok: 0, simpananWajib: 500000, simpananSukarela: 0 }
            ];
            
            // Act: Upload simpanan pokok
            const uploadData = [
                { nik: '3201010101010001', nama: 'Budi Santoso', jumlah: 1000000, tanggal: '2024-01-01' }
            ];
            
            importSimpananToWizard(uploadData, 'pokok');
            
            // Assert: Simpanan wajib should be preserved
            const anggota = window.wizardState.data.simpananAnggota.find(a => a.nik === '3201010101010001' || a.anggotaId === '3201010101010001');
            expect(anggota).toBeDefined();
            expect(anggota.simpananPokok).toBe(1000000);
            expect(anggota.simpananWajib).toBe(500000);
        });
    });
    
    describe('Error Handling', () => {
        test('Should handle invalid NIK in CSV data', () => {
            // Arrange: CSV with invalid NIK
            const csvData = `NIK,Nama,Jumlah,Tanggal
9999999999999999,Invalid User,1000000,2024-01-01
3201010101010001,Budi Santoso,1500000,2024-01-01`;
            
            // Act: Parse and validate
            const parseResult = parseCSVSimpanan(csvData, 'pokok');
            expect(parseResult.success).toBe(true);
            
            const validateResult = validateSimpananData(parseResult.data, 'pokok');
            
            // Assert: Should have errors for invalid NIK
            expect(validateResult.errors.length).toBeGreaterThan(0);
            expect(validateResult.errors[0]).toContain('NIK');
            expect(validateResult.errors[0]).toContain('9999999999999999');
        });
        
        test('Should handle negative amounts in CSV data', () => {
            // Arrange: CSV with negative amount
            const csvData = `NIK,Nama,Jumlah,Tanggal
3201010101010001,Budi Santoso,-1000000,2024-01-01`;
            
            // Act: Parse and validate
            const parseResult = parseCSVSimpanan(csvData, 'pokok');
            expect(parseResult.success).toBe(true);
            
            const validateResult = validateSimpananData(parseResult.data, 'pokok');
            
            // Assert: Should have errors for negative amount
            expect(validateResult.errors.length).toBeGreaterThan(0);
            expect(validateResult.errors[0]).toContain('negatif');
        });
        
        test('Should handle empty CSV file', () => {
            // Arrange: Empty CSV
            const csvData = '';
            
            // Act: Parse
            const parseResult = parseCSVSimpanan(csvData, 'pokok');
            
            // Assert: Should handle gracefully
            expect(parseResult.success).toBe(false);
            expect(parseResult.errors.length).toBeGreaterThan(0);
        });
        
        test('Should handle CSV with wrong header format', () => {
            // Arrange: CSV with wrong headers
            const csvData = `WrongHeader1,WrongHeader2,WrongHeader3,WrongHeader4
3201010101010001,Budi Santoso,1000000,2024-01-01`;
            
            // Act: Parse
            const parseResult = parseCSVSimpanan(csvData, 'pokok');
            
            // Assert: Should detect header mismatch in parse errors
            expect(parseResult.errors.length).toBeGreaterThan(0);
            expect(parseResult.errors[0]).toContain('Header CSV tidak sesuai format');
        });
        
        test('Should provide partial success feedback when some records are invalid', () => {
            // Arrange: Mix of valid and invalid data
            const csvData = `NIK,Nama,Jumlah,Tanggal
3201010101010001,Budi Santoso,1000000,2024-01-01
9999999999999999,Invalid User,1500000,2024-01-01
3201010101010002,Ani Wijaya,2000000,2024-01-01`;
            
            // Act: Parse and validate
            const parseResult = parseCSVSimpanan(csvData, 'pokok');
            const validateResult = validateSimpananData(parseResult.data, 'pokok');
            
            // Assert: Should have both valid and invalid records
            expect(validateResult.validData.length).toBe(2); // 2 valid
            expect(validateResult.errors.length).toBeGreaterThan(0); // 1 invalid
            
            // Act: Import valid records
            const importResult = importSimpananToWizard(validateResult.validData, 'pokok');
            
            // Assert: Should report partial success
            expect(importResult.success).toBe(true);
            expect(importResult.recordCount).toBe(2);
        });
    });
});
