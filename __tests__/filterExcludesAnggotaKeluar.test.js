// Feature: fix-pengembalian-simpanan, Property 12: Filter excludes anggota keluar
// Validates: Requirements 5.3

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

describe('Property 12: Filter excludes anggota keluar', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('Filter by departemen should exclude anggota keluar', () => {
        fc.assert(
            fc.property(
                fc.record({
                    departemen: fc.constantFrom('IT', 'Finance', 'HR', 'Operations'),
                    anggotaCount: fc.integer({ min: 10, max: 25 })
                }),
                (data) => {
                    // Generate anggota with various departments
                    const anggota = Array.from({ length: data.anggotaCount }, (_, i) => ({
                        id: `anggota-${i}`,
                        nik: `NIK${i}`,
                        nama: `Anggota ${i}`,
                        noKartu: `CARD${i}`,
                        departemen: i % 2 === 0 ? data.departemen : 'Other',
                        statusKeanggotaan: i % 4 === 0 ? 'Keluar' : 'Aktif'
                    }));
                    
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify(anggota));
                    
                    // Filter by departemen
                    const filterDept = data.departemen;
                    const stored = JSON.parse(localStorage.getItem('anggota') || '[]');
                    const filtered = stored.filter(a => {
                        const notKeluar = a.statusKeanggotaan !== 'Keluar';
                        const matchDept = !filterDept || a.departemen === filterDept;
                        return notKeluar && matchDept;
                    });
                    
                    // Property: No keluar in results
                    const noKeluar = filtered.every(a => a.statusKeanggotaan !== 'Keluar');
                    
                    // Property: All results match department filter
                    const allMatchDept = filtered.every(a => a.departemen === data.departemen);
                    
                    return noKeluar && allMatchDept;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Filter by tipe anggota should exclude anggota keluar', () => {
        fc.assert(
            fc.property(
                fc.record({
                    tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota', 'Umum'),
                    anggotaCount: fc.integer({ min: 10, max: 25 })
                }),
                (data) => {
                    // Generate anggota with various types
                    const anggota = Array.from({ length: data.anggotaCount }, (_, i) => ({
                        id: `anggota-${i}`,
                        nik: `NIK${i}`,
                        nama: `Anggota ${i}`,
                        tipeAnggota: i % 2 === 0 ? data.tipeAnggota : 'Other',
                        statusKeanggotaan: i % 4 === 0 ? 'Keluar' : 'Aktif'
                    }));
                    
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify(anggota));
                    
                    // Filter by tipe
                    const filterTipe = data.tipeAnggota;
                    const stored = JSON.parse(localStorage.getItem('anggota') || '[]');
                    const filtered = stored.filter(a => {
                        const notKeluar = a.statusKeanggotaan !== 'Keluar';
                        const matchTipe = !filterTipe || a.tipeAnggota === filterTipe;
                        return notKeluar && matchTipe;
                    });
                    
                    // Property: No keluar in results
                    const noKeluar = filtered.every(a => a.statusKeanggotaan !== 'Keluar');
                    
                    // Property: All results match tipe filter
                    const allMatchTipe = filtered.every(a => a.tipeAnggota === data.tipeAnggota);
                    
                    return noKeluar && allMatchTipe;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Filter by status should exclude anggota keluar', () => {
        fc.assert(
            fc.property(
                fc.record({
                    status: fc.constantFrom('Aktif', 'Nonaktif', 'Cuti'),
                    anggotaCount: fc.integer({ min: 10, max: 25 })
                }),
                (data) => {
                    // Generate anggota with various statuses
                    const anggota = Array.from({ length: data.anggotaCount }, (_, i) => ({
                        id: `anggota-${i}`,
                        nik: `NIK${i}`,
                        nama: `Anggota ${i}`,
                        status: i % 2 === 0 ? data.status : 'Other',
                        statusKeanggotaan: i % 4 === 0 ? 'Keluar' : 'Aktif'
                    }));
                    
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify(anggota));
                    
                    // Filter by status
                    const filterStatus = data.status;
                    const stored = JSON.parse(localStorage.getItem('anggota') || '[]');
                    const filtered = stored.filter(a => {
                        const notKeluar = a.statusKeanggotaan !== 'Keluar';
                        const matchStatus = !filterStatus || a.status === filterStatus;
                        return notKeluar && matchStatus;
                    });
                    
                    // Property: No keluar in results
                    const noKeluar = filtered.every(a => a.statusKeanggotaan !== 'Keluar');
                    
                    // Property: All results match status filter
                    const allMatchStatus = filtered.every(a => a.status === data.status);
                    
                    return noKeluar && allMatchStatus;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Multiple filters combined should exclude anggota keluar', () => {
        fc.assert(
            fc.property(
                fc.record({
                    departemen: fc.constantFrom('IT', 'Finance', 'HR'),
                    tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota'),
                    status: fc.constantFrom('Aktif', 'Nonaktif'),
                    anggotaCount: fc.integer({ min: 15, max: 30 })
                }),
                (data) => {
                    // Generate diverse anggota
                    const anggota = Array.from({ length: data.anggotaCount }, (_, i) => ({
                        id: `anggota-${i}`,
                        nik: `NIK${i}`,
                        nama: `Anggota ${i}`,
                        departemen: i % 3 === 0 ? data.departemen : 'Other',
                        tipeAnggota: i % 2 === 0 ? data.tipeAnggota : 'Umum',
                        status: i % 5 === 0 ? data.status : 'Cuti',
                        statusKeanggotaan: i % 6 === 0 ? 'Keluar' : 'Aktif'
                    }));
                    
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify(anggota));
                    
                    // Apply multiple filters
                    const stored = JSON.parse(localStorage.getItem('anggota') || '[]');
                    const filtered = stored.filter(a => {
                        const notKeluar = a.statusKeanggotaan !== 'Keluar';
                        const matchDept = a.departemen === data.departemen;
                        const matchTipe = a.tipeAnggota === data.tipeAnggota;
                        const matchStatus = a.status === data.status;
                        return notKeluar && matchDept && matchTipe && matchStatus;
                    });
                    
                    // Property: No keluar in results
                    const noKeluar = filtered.every(a => a.statusKeanggotaan !== 'Keluar');
                    
                    // Property: All results match all filters
                    const allMatch = filtered.every(a => 
                        a.departemen === data.departemen &&
                        a.tipeAnggota === data.tipeAnggota &&
                        a.status === data.status
                    );
                    
                    return noKeluar && (filtered.length === 0 || allMatch);
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Date range filter should exclude anggota keluar', () => {
        fc.assert(
            fc.property(
                fc.record({
                    startDate: fc.date({ min: new Date('2020-01-01'), max: new Date('2023-12-31') }),
                    endDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
                    anggotaCount: fc.integer({ min: 10, max: 25 })
                }),
                (data) => {
                    const startDateStr = data.startDate.toISOString().split('T')[0];
                    const endDateStr = data.endDate.toISOString().split('T')[0];
                    
                    // Generate anggota with various registration dates
                    const anggota = Array.from({ length: data.anggotaCount }, (_, i) => {
                        const date = new Date(data.startDate);
                        date.setDate(date.getDate() + i * 10);
                        
                        return {
                            id: `anggota-${i}`,
                            nik: `NIK${i}`,
                            nama: `Anggota ${i}`,
                            tanggalDaftar: date.toISOString().split('T')[0],
                            statusKeanggotaan: i % 4 === 0 ? 'Keluar' : 'Aktif'
                        };
                    });
                    
                    // Setup
                    localStorage.setItem('anggota', JSON.stringify(anggota));
                    
                    // Filter by date range
                    const stored = JSON.parse(localStorage.getItem('anggota') || '[]');
                    const filtered = stored.filter(a => {
                        const notKeluar = a.statusKeanggotaan !== 'Keluar';
                        const memberDate = a.tanggalDaftar || '1900-01-01';
                        const matchDateRange = memberDate >= startDateStr && memberDate <= endDateStr;
                        return notKeluar && matchDateRange;
                    });
                    
                    // Property: No keluar in results
                    const noKeluar = filtered.every(a => a.statusKeanggotaan !== 'Keluar');
                    
                    // Property: All results within date range
                    const allInRange = filtered.every(a => {
                        const memberDate = a.tanggalDaftar || '1900-01-01';
                        return memberDate >= startDateStr && memberDate <= endDateStr;
                    });
                    
                    return noKeluar && (filtered.length === 0 || allInRange);
                }
            ),
            { numRuns: 100 }
        );
    });
});
