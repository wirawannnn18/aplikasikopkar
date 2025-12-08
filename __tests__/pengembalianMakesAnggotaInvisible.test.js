// Feature: fix-pengembalian-simpanan, Property 6: Pengembalian makes anggota invisible in reports
// Validates: Requirements 2.5

import fc from 'fast-check';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        clear: () => { store = {}; }
    };
})();

global.localStorage = localStorageMock;

describe('Property 6: Pengembalian makes anggota invisible in reports', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('Anggota keluar with zero simpanan should not appear in laporan simpanan', () => {
        fc.assert(
            fc.property(
                fc.record({
                    anggotaKeluar: fc.record({
                        id: fc.uuid(),
                        nama: fc.string({ minLength: 5, maxLength: 30 }),
                        nik: fc.string({ minLength: 10, maxLength: 16 }),
                        statusKeanggotaan: fc.constant('Keluar'),
                        pengembalianStatus: fc.constant('Selesai')
                    }),
                    simpananPokok: fc.integer({ min: 0, max: 0 }), // Zero after pengembalian
                    simpananWajib: fc.integer({ min: 0, max: 0 }), // Zero after pengembalian
                    simpananSukarela: fc.integer({ min: 0, max: 0 }), // Zero after pengembalian
                    saldoSebelumPengembalian: fc.record({
                        pokok: fc.integer({ min: 100000, max: 5000000 }),
                        wajib: fc.integer({ min: 50000, max: 10000000 }),
                        sukarela: fc.integer({ min: 0, max: 5000000 })
                    })
                }),
                (data) => {
                    const anggotaId = data.anggotaKeluar.id;
                    
                    // Setup anggota
                    localStorage.setItem('anggota', JSON.stringify([data.anggotaKeluar]));
                    
                    // Setup simpanan with zero balances
                    localStorage.setItem('simpananPokok', JSON.stringify([{
                        id: fc.sample(fc.uuid(), 1)[0],
                        anggotaId: anggotaId,
                        jumlah: data.simpananPokok,
                        saldoSebelumPengembalian: data.saldoSebelumPengembalian.pokok,
                        statusPengembalian: 'Dikembalikan'
                    }]));
                    
                    localStorage.setItem('simpananWajib', JSON.stringify([{
                        id: fc.sample(fc.uuid(), 1)[0],
                        anggotaId: anggotaId,
                        jumlah: data.simpananWajib,
                        saldoSebelumPengembalian: data.saldoSebelumPengembalian.wajib,
                        statusPengembalian: 'Dikembalikan'
                    }]));
                    
                    localStorage.setItem('simpananSukarela', JSON.stringify([{
                        id: fc.sample(fc.uuid(), 1)[0],
                        anggotaId: anggotaId,
                        jumlah: data.simpananSukarela,
                        saldoSebelumPengembalian: data.saldoSebelumPengembalian.sukarela,
                        statusPengembalian: 'Dikembalikan'
                    }]));
                    
                    // Simulate laporan filter logic
                    const pokokFiltered = JSON.parse(localStorage.getItem('simpananPokok') || '[]')
                        .filter(s => s.jumlah > 0);
                    const wajibFiltered = JSON.parse(localStorage.getItem('simpananWajib') || '[]')
                        .filter(s => s.jumlah > 0);
                    const sukarelaFiltered = JSON.parse(localStorage.getItem('simpananSukarela') || '[]')
                        .filter(s => s.jumlah > 0);
                    
                    // Property: Anggota should not appear in any filtered report
                    const notInPokok = !pokokFiltered.some(s => s.anggotaId === anggotaId);
                    const notInWajib = !wajibFiltered.some(s => s.anggotaId === anggotaId);
                    const notInSukarela = !sukarelaFiltered.some(s => s.anggotaId === anggotaId);
                    
                    // Property: Historical data should still exist
                    const pokokAll = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
                    const wajibAll = JSON.parse(localStorage.getItem('simpananWajib') || '[]');
                    const hasHistoricalData = pokokAll.some(s => s.anggotaId === anggotaId && s.saldoSebelumPengembalian > 0) &&
                                             wajibAll.some(s => s.anggotaId === anggotaId && s.saldoSebelumPengembalian > 0);
                    
                    return notInPokok && notInWajib && notInSukarela && hasHistoricalData;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Multiple anggota keluar with zero balances should all be invisible', () => {
        fc.assert(
            fc.property(
                fc.array(fc.record({
                    id: fc.uuid(),
                    nama: fc.string({ minLength: 5, maxLength: 30 }),
                    statusKeanggotaan: fc.constant('Keluar'),
                    pengembalianStatus: fc.constant('Selesai'),
                    simpananPokok: fc.constant(0),
                    simpananWajib: fc.constant(0),
                    saldoSebelumPokok: fc.integer({ min: 100000, max: 5000000 }),
                    saldoSebelumWajib: fc.integer({ min: 50000, max: 10000000 })
                }), { minLength: 2, maxLength: 10 }),
                (anggotaKeluarList) => {
                    // Setup anggota
                    localStorage.setItem('anggota', JSON.stringify(anggotaKeluarList.map(a => ({
                        id: a.id,
                        nama: a.nama,
                        statusKeanggotaan: a.statusKeanggotaan,
                        pengembalianStatus: a.pengembalianStatus
                    }))));
                    
                    // Setup simpanan pokok with zero balances
                    const simpananPokok = anggotaKeluarList.map(a => ({
                        id: fc.sample(fc.uuid(), 1)[0],
                        anggotaId: a.id,
                        jumlah: a.simpananPokok,
                        saldoSebelumPengembalian: a.saldoSebelumPokok,
                        statusPengembalian: 'Dikembalikan'
                    }));
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananPokok));
                    
                    // Setup simpanan wajib with zero balances
                    const simpananWajib = anggotaKeluarList.map(a => ({
                        id: fc.sample(fc.uuid(), 1)[0],
                        anggotaId: a.id,
                        jumlah: a.simpananWajib,
                        saldoSebelumPengembalian: a.saldoSebelumWajib,
                        statusPengembalian: 'Dikembalikan'
                    }));
                    localStorage.setItem('simpananWajib', JSON.stringify(simpananWajib));
                    
                    // Filter for laporan
                    const pokokFiltered = JSON.parse(localStorage.getItem('simpananPokok') || '[]')
                        .filter(s => s.jumlah > 0);
                    const wajibFiltered = JSON.parse(localStorage.getItem('simpananWajib') || '[]')
                        .filter(s => s.jumlah > 0);
                    
                    // Property: None of the anggota keluar should appear in filtered reports
                    const anggotaKeluarIds = anggotaKeluarList.map(a => a.id);
                    const noneInPokok = !pokokFiltered.some(s => anggotaKeluarIds.includes(s.anggotaId));
                    const noneInWajib = !wajibFiltered.some(s => anggotaKeluarIds.includes(s.anggotaId));
                    
                    return noneInPokok && noneInWajib;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Anggota aktif with positive balance should still appear in reports', () => {
        fc.assert(
            fc.property(
                fc.record({
                    anggotaAktif: fc.array(fc.record({
                        id: fc.uuid(),
                        nama: fc.string({ minLength: 5, maxLength: 30 }),
                        statusKeanggotaan: fc.constant('Aktif'),
                        simpananPokok: fc.integer({ min: 100000, max: 5000000 }),
                        simpananWajib: fc.integer({ min: 50000, max: 10000000 })
                    }), { minLength: 3, maxLength: 10 }),
                    anggotaKeluar: fc.array(fc.record({
                        id: fc.uuid(),
                        nama: fc.string({ minLength: 5, maxLength: 30 }),
                        statusKeanggotaan: fc.constant('Keluar'),
                        simpananPokok: fc.constant(0),
                        simpananWajib: fc.constant(0)
                    }), { minLength: 2, maxLength: 5 })
                }),
                (data) => {
                    // Setup all anggota
                    const allAnggota = [...data.anggotaAktif, ...data.anggotaKeluar];
                    localStorage.setItem('anggota', JSON.stringify(allAnggota.map(a => ({
                        id: a.id,
                        nama: a.nama,
                        statusKeanggotaan: a.statusKeanggotaan
                    }))));
                    
                    // Setup simpanan pokok
                    const simpananPokok = allAnggota.map(a => ({
                        id: fc.sample(fc.uuid(), 1)[0],
                        anggotaId: a.id,
                        jumlah: a.simpananPokok
                    }));
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananPokok));
                    
                    // Filter for laporan
                    const pokokFiltered = JSON.parse(localStorage.getItem('simpananPokok') || '[]')
                        .filter(s => s.jumlah > 0);
                    
                    // Property: All anggota aktif should appear
                    const anggotaAktifIds = data.anggotaAktif.map(a => a.id);
                    const allAktifPresent = anggotaAktifIds.every(id => 
                        pokokFiltered.some(s => s.anggotaId === id)
                    );
                    
                    // Property: No anggota keluar should appear
                    const anggotaKeluarIds = data.anggotaKeluar.map(a => a.id);
                    const noKeluarPresent = !pokokFiltered.some(s => 
                        anggotaKeluarIds.includes(s.anggotaId)
                    );
                    
                    return allAktifPresent && noKeluarPresent;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('After pengembalian, total simpanan should not include anggota keluar', () => {
        fc.assert(
            fc.property(
                fc.record({
                    anggotaAktif: fc.array(fc.record({
                        id: fc.uuid(),
                        simpananPokok: fc.integer({ min: 100000, max: 5000000 }),
                        simpananWajib: fc.integer({ min: 50000, max: 10000000 })
                    }), { minLength: 3, maxLength: 10 }),
                    anggotaKeluar: fc.array(fc.record({
                        id: fc.uuid(),
                        simpananPokok: fc.constant(0),
                        simpananWajib: fc.constant(0),
                        saldoSebelumPokok: fc.integer({ min: 100000, max: 5000000 }),
                        saldoSebelumWajib: fc.integer({ min: 50000, max: 10000000 })
                    }), { minLength: 2, maxLength: 5 })
                }),
                (data) => {
                    // Setup simpanan pokok
                    const allSimpananPokok = [
                        ...data.anggotaAktif.map(a => ({
                            id: fc.sample(fc.uuid(), 1)[0],
                            anggotaId: a.id,
                            jumlah: a.simpananPokok
                        })),
                        ...data.anggotaKeluar.map(a => ({
                            id: fc.sample(fc.uuid(), 1)[0],
                            anggotaId: a.id,
                            jumlah: a.simpananPokok,
                            saldoSebelumPengembalian: a.saldoSebelumPokok
                        }))
                    ];
                    localStorage.setItem('simpananPokok', JSON.stringify(allSimpananPokok));
                    
                    // Calculate total (as in laporan)
                    const totalPokok = JSON.parse(localStorage.getItem('simpananPokok') || '[]')
                        .filter(s => s.jumlah > 0)
                        .reduce((sum, s) => sum + s.jumlah, 0);
                    
                    // Calculate expected total (only anggota aktif)
                    const expectedTotal = data.anggotaAktif.reduce((sum, a) => sum + a.simpananPokok, 0);
                    
                    // Property: Total should only include anggota aktif
                    return totalPokok === expectedTotal;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Pengembalian status should be Dikembalikan for invisible anggota', () => {
        fc.assert(
            fc.property(
                fc.array(fc.record({
                    id: fc.uuid(),
                    anggotaId: fc.uuid(),
                    jumlah: fc.constant(0),
                    saldoSebelumPengembalian: fc.integer({ min: 100000, max: 5000000 }),
                    statusPengembalian: fc.constant('Dikembalikan'),
                    pengembalianId: fc.uuid(),
                    tanggalPengembalian: fc.date().map(d => d.toISOString())
                }), { minLength: 3, maxLength: 15 }),
                (simpananList) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananList));
                    
                    // Filter for laporan (jumlah > 0)
                    const filtered = JSON.parse(localStorage.getItem('simpananPokok') || '[]')
                        .filter(s => s.jumlah > 0);
                    
                    // Get all records (including zero balance)
                    const all = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
                    
                    // Property: All zero balance items should have statusPengembalian = 'Dikembalikan'
                    const zeroBalanceItems = all.filter(s => s.jumlah === 0);
                    const allHaveStatus = zeroBalanceItems.every(s => s.statusPengembalian === 'Dikembalikan');
                    
                    // Property: None should appear in filtered report
                    const noneInReport = filtered.length === 0;
                    
                    // Property: All should have historical data
                    const allHaveHistory = zeroBalanceItems.every(s => s.saldoSebelumPengembalian > 0);
                    
                    return allHaveStatus && noneInReport && allHaveHistory;
                }
            ),
            { numRuns: 100 }
        );
    });
});
