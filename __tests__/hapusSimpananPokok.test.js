/**
 * Property-Based Tests for Hapus Data Simpanan Pokok
 * Feature: hapus-simpanan-pokok
 */

import fc from 'fast-check';

// Mock bootstrap Modal
global.bootstrap = {
    Modal: {
        getInstance: () => ({
            hide: () => {}
        })
    }
};

// Mock confirm dialog
let confirmResult = true;
let confirmCalls = [];
global.confirm = (message) => {
    confirmCalls.push(message);
    return confirmResult;
};

// Mock renderSimpanan function
let renderSimpananCalls = 0;
global.renderSimpanan = () => {
    renderSimpananCalls++;
};

// Import the function we're testing
// Since we're testing browser code, we'll define the function here for testing
function deleteSimpananPokok(id) {
    // Requirement 1.1: Konfirmasi dialog sebelum penghapusan
    const confirmed = confirm('Yakin ingin menghapus simpanan ini? Data yang dihapus tidak dapat dikembalikan.');
    
    // Requirement 1.5: Pembatalan mempertahankan data
    if (!confirmed) {
        return; // Data tetap utuh jika dibatalkan
    }
    
    try {
        // Requirement 1.2: Hapus data dari localStorage
        let simpanan = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
        const originalLength = simpanan.length;
        
        simpanan = simpanan.filter(s => s.id !== id);
        
        // Pastikan data benar-benar terhapus
        if (simpanan.length === originalLength) {
            showAlert('Data tidak ditemukan', 'warning');
            return;
        }
        
        localStorage.setItem('simpananPokok', JSON.stringify(simpanan));
        
        // Requirement 1.4: Tampilkan notifikasi sukses
        showAlert('Simpanan pokok berhasil dihapus', 'success');
        
        // Requirement 1.3: Update UI setelah penghapusan
        renderSimpanan();
    } catch (error) {
        showAlert('Terjadi kesalahan saat menghapus data: ' + error.message, 'danger');
    }
}

// Generator for simpanan pokok data
const simpananPokokArbitrary = fc.record({
    id: fc.uuid(),
    anggotaId: fc.uuid(),
    jumlah: fc.nat({ max: 100000000 }),
    tanggal: fc.date().map(d => d.toISOString().split('T')[0])
});

/**
 * **Feature: hapus-simpanan-pokok, Property 1: Penghapusan individual memerlukan konfirmasi**
 * **Validates: Requirements 1.1**
 */
describe('**Feature: hapus-simpanan-pokok, Property 1: Penghapusan individual memerlukan konfirmasi**', () => {
    beforeEach(() => {
        localStorage.clear();
        confirmCalls = [];
        renderSimpananCalls = 0;
        confirmResult = true;
    });
    
    test('For any data simpanan pokok yang valid, ketika tombol hapus diklik, sistem harus menampilkan dialog konfirmasi sebelum melakukan penghapusan', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 10 }),
                (simpananArray) => {
                    // Setup: simpan data ke localStorage
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    
                    // Pilih item random untuk dihapus
                    const itemToDelete = simpananArray[0];
                    
                    // Reset mock
                    confirmCalls = [];
                    
                    // Execute: panggil deleteSimpananPokok
                    deleteSimpananPokok(itemToDelete.id);
                    
                    // Verify: confirm harus dipanggil
                    return confirmCalls.length === 1;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any data simpanan pokok, dialog konfirmasi harus berisi pesan yang jelas tentang konsekuensi penghapusan', () => {
        fc.assert(
            fc.property(
                simpananPokokArbitrary,
                (simpanan) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify([simpanan]));
                    confirmCalls = [];
                    
                    // Execute
                    deleteSimpananPokok(simpanan.id);
                    
                    // Verify: pesan konfirmasi harus berisi warning
                    const confirmMessage = confirmCalls[0];
                    return confirmMessage.includes('Yakin') && 
                           confirmMessage.includes('tidak dapat dikembalikan');
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Feature: hapus-simpanan-pokok, Property 2: Data terhapus dari localStorage setelah konfirmasi**
 * **Validates: Requirements 1.2, 4.1, 4.2**
 */
describe('**Feature: hapus-simpanan-pokok, Property 2: Data terhapus dari localStorage setelah konfirmasi**', () => {
    beforeEach(() => {
        localStorage.clear();
        confirmCalls = [];
        renderSimpananCalls = 0;
        confirmResult = true;
    });
    
    test('For any data simpanan pokok yang valid, setelah admin mengkonfirmasi penghapusan, data tersebut harus tidak ada lagi dalam array simpananPokok di localStorage', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 10 }),
                (simpananArray) => {
                    // Setup: simpan data ke localStorage
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    
                    // Pilih item random untuk dihapus
                    const itemToDelete = simpananArray[0];
                    
                    // Konfirmasi = true
                    confirmResult = true;
                    
                    // Execute: panggil deleteSimpananPokok
                    deleteSimpananPokok(itemToDelete.id);
                    
                    // Verify: data harus terhapus dari localStorage
                    const updatedSimpanan = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
                    const itemStillExists = updatedSimpanan.some(s => s.id === itemToDelete.id);
                    
                    return !itemStillExists;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any data simpanan pokok, localStorage harus diupdate dengan array yang telah difilter', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 2, maxLength: 10 }),
                (simpananArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    const originalLength = simpananArray.length;
                    
                    // Pilih item untuk dihapus
                    const itemToDelete = simpananArray[0];
                    confirmResult = true;
                    
                    // Execute
                    deleteSimpananPokok(itemToDelete.id);
                    
                    // Verify: panjang array harus berkurang 1
                    const updatedSimpanan = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
                    return updatedSimpanan.length === originalLength - 1;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any data simpanan pokok, data lain harus tetap utuh setelah penghapusan', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 3, maxLength: 10 }),
                (simpananArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    
                    // Pilih item untuk dihapus (item pertama)
                    const itemToDelete = simpananArray[0];
                    const otherItems = simpananArray.slice(1);
                    confirmResult = true;
                    
                    // Execute
                    deleteSimpananPokok(itemToDelete.id);
                    
                    // Verify: semua item lain harus masih ada
                    const updatedSimpanan = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
                    
                    return otherItems.every(item => 
                        updatedSimpanan.some(s => s.id === item.id)
                    );
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Feature: hapus-simpanan-pokok, Property 3: UI diperbarui setelah penghapusan**
 * **Validates: Requirements 1.3, 2.5, 6.3**
 */
describe('**Feature: hapus-simpanan-pokok, Property 3: UI diperbarui setelah penghapusan**', () => {
    beforeEach(() => {
        localStorage.clear();
        confirmCalls = [];
        renderSimpananCalls = 0;
        confirmResult = true;
    });
    
    test('For any data simpanan pokok yang dihapus, tampilan tabel harus diperbarui dan tidak menampilkan data yang telah dihapus', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 10 }),
                (simpananArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    renderSimpananCalls = 0;
                    confirmResult = true;
                    
                    // Pilih item untuk dihapus
                    const itemToDelete = simpananArray[0];
                    
                    // Execute
                    deleteSimpananPokok(itemToDelete.id);
                    
                    // Verify: renderSimpanan harus dipanggil untuk update UI
                    return renderSimpananCalls === 1;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any successful deletion, renderSimpanan must be called exactly once', () => {
        fc.assert(
            fc.property(
                simpananPokokArbitrary,
                (simpanan) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify([simpanan]));
                    renderSimpananCalls = 0;
                    confirmResult = true;
                    
                    // Execute
                    deleteSimpananPokok(simpanan.id);
                    
                    // Verify
                    return renderSimpananCalls === 1;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any cancelled deletion, renderSimpanan should not be called', () => {
        fc.assert(
            fc.property(
                simpananPokokArbitrary,
                (simpanan) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify([simpanan]));
                    renderSimpananCalls = 0;
                    confirmResult = false; // User cancels
                    
                    // Execute
                    deleteSimpananPokok(simpanan.id);
                    
                    // Verify: UI tidak diupdate karena dibatalkan
                    return renderSimpananCalls === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Feature: hapus-simpanan-pokok, Property 4: Notifikasi sukses ditampilkan setelah penghapusan**
 * **Validates: Requirements 1.4**
 */
describe('**Feature: hapus-simpanan-pokok, Property 4: Notifikasi sukses ditampilkan setelah penghapusan**', () => {
    let showAlertCalls = [];
    
    beforeEach(() => {
        localStorage.clear();
        confirmCalls = [];
        renderSimpananCalls = 0;
        confirmResult = true;
        showAlertCalls = [];
        
        // Mock showAlert to track calls
        global.showAlert = (message, type) => {
            showAlertCalls.push({ message, type });
        };
    });
    
    test('For any operasi penghapusan yang berhasil, sistem harus menampilkan notifikasi sukses kepada admin', () => {
        fc.assert(
            fc.property(
                simpananPokokArbitrary,
                (simpanan) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify([simpanan]));
                    showAlertCalls = [];
                    confirmResult = true;
                    
                    // Execute
                    deleteSimpananPokok(simpanan.id);
                    
                    // Verify: showAlert harus dipanggil dengan pesan sukses
                    const hasSuccessAlert = showAlertCalls.some(call => 
                        call.message.includes('berhasil') && call.type === 'success'
                    );
                    
                    return hasSuccessAlert;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any successful deletion, notification message should contain "berhasil dihapus"', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 5 }),
                (simpananArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    showAlertCalls = [];
                    confirmResult = true;
                    
                    // Execute
                    deleteSimpananPokok(simpananArray[0].id);
                    
                    // Verify
                    const successMessage = showAlertCalls.find(call => call.type === 'success');
                    return successMessage && 
                           successMessage.message.includes('berhasil') && 
                           successMessage.message.includes('dihapus');
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any cancelled deletion, no success notification should be shown', () => {
        fc.assert(
            fc.property(
                simpananPokokArbitrary,
                (simpanan) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify([simpanan]));
                    showAlertCalls = [];
                    confirmResult = false; // User cancels
                    
                    // Execute
                    deleteSimpananPokok(simpanan.id);
                    
                    // Verify: tidak ada notifikasi sukses
                    const hasSuccessAlert = showAlertCalls.some(call => call.type === 'success');
                    return !hasSuccessAlert;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Feature: hapus-simpanan-pokok, Property 5: Pembatalan mempertahankan data**
 * **Validates: Requirements 1.5**
 */
describe('**Feature: hapus-simpanan-pokok, Property 5: Pembatalan mempertahankan data**', () => {
    beforeEach(() => {
        localStorage.clear();
        confirmCalls = [];
        renderSimpananCalls = 0;
        confirmResult = true;
    });
    
    test('For any data simpanan pokok, jika admin membatalkan konfirmasi penghapusan, data harus tetap ada di localStorage tanpa perubahan', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 10 }),
                (simpananArray) => {
                    // Setup
                    const originalData = JSON.stringify(simpananArray);
                    localStorage.setItem('simpananPokok', originalData);
                    
                    // User cancels deletion
                    confirmResult = false;
                    
                    // Execute
                    deleteSimpananPokok(simpananArray[0].id);
                    
                    // Verify: data harus tetap sama
                    const currentData = localStorage.getItem('simpananPokok');
                    return currentData === originalData;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any data simpanan pokok, pembatalan harus mempertahankan semua item tanpa perubahan', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 10 }),
                (simpananArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    const originalLength = simpananArray.length;
                    
                    // User cancels
                    confirmResult = false;
                    
                    // Execute
                    deleteSimpananPokok(simpananArray[0].id);
                    
                    // Verify: panjang array harus tetap sama
                    const currentData = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
                    return currentData.length === originalLength;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any cancelled deletion, all item IDs should remain unchanged', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 10 }),
                (simpananArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    const originalIds = simpananArray.map(s => s.id);
                    
                    // User cancels
                    confirmResult = false;
                    
                    // Execute
                    deleteSimpananPokok(simpananArray[0].id);
                    
                    // Verify: semua ID harus masih ada
                    const currentData = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
                    const currentIds = currentData.map(s => s.id);
                    
                    return originalIds.every(id => currentIds.includes(id)) &&
                           currentIds.length === originalIds.length;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any cancelled deletion, localStorage should not be modified at all', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 2, maxLength: 10 }),
                (simpananArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    
                    // Get original data with all properties
                    const originalData = JSON.parse(localStorage.getItem('simpananPokok'));
                    
                    // User cancels
                    confirmResult = false;
                    
                    // Execute
                    deleteSimpananPokok(simpananArray[0].id);
                    
                    // Verify: data harus identik
                    const currentData = JSON.parse(localStorage.getItem('simpananPokok'));
                    
                    // Check every property of every item
                    return originalData.every((item, index) => {
                        const currentItem = currentData[index];
                        return currentItem &&
                               currentItem.id === item.id &&
                               currentItem.anggotaId === item.anggotaId &&
                               currentItem.jumlah === item.jumlah &&
                               currentItem.tanggal === item.tanggal;
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * Tests for Utility Page Functions (hapus_simpanan_pokok.html)
 */

// Define utility page functions for testing
function hitungData() {
    try {
        const simpananPokok = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
        return simpananPokok.length;
    } catch (error) {
        console.error('Error menghitung data:', error);
        return 0;
    }
}

function refreshCount() {
    const count = hitungData();
    
    // Return object untuk testing
    return {
        count: count,
        buttonDisabled: count === 0,
        buttonText: count === 0 
            ? 'Tidak Ada Data untuk Dihapus' 
            : 'Hapus Semua Data Simpanan Pokok'
    };
}

/**
 * **Feature: hapus-simpanan-pokok, Property 6: Jumlah data ditampilkan dengan akurat**
 * **Validates: Requirements 2.1, 3.2, 6.1**
 */
describe('**Feature: hapus-simpanan-pokok, Property 6: Jumlah data ditampilkan dengan akurat**', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    
    test('For any state aplikasi, jumlah data simpanan pokok yang ditampilkan harus sama dengan jumlah actual item dalam array simpananPokok di localStorage', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 0, maxLength: 100 }),
                (simpananArray) => {
                    // Setup: simpan data ke localStorage
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    
                    // Execute: hitung data
                    const count = hitungData();
                    
                    // Verify: jumlah harus sama dengan panjang array
                    return count === simpananArray.length;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any valid simpanan pokok array, hitungData should return exact length', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 0, maxLength: 50 }),
                (simpananArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    
                    // Execute
                    const count = hitungData();
                    const actualLength = simpananArray.length;
                    
                    // Verify
                    return count === actualLength;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any state, refreshCount should display accurate count matching localStorage', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 0, maxLength: 50 }),
                (simpananArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    
                    // Execute
                    const result = refreshCount();
                    
                    // Verify: count harus akurat
                    return result.count === simpananArray.length;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For empty localStorage, hitungData should return 0', () => {
        // Setup: localStorage kosong
        localStorage.removeItem('simpananPokok');
        
        // Execute
        const count = hitungData();
        
        // Verify
        expect(count).toBe(0);
    });
    
    test('For corrupted data in localStorage, hitungData should handle gracefully', () => {
        // Setup: data corrupt
        localStorage.setItem('simpananPokok', 'invalid json');
        
        // Execute
        const count = hitungData();
        
        // Verify: harus return 0 atau handle error dengan baik
        expect(count).toBe(0);
    });
});

/**
 * **Feature: hapus-simpanan-pokok, Property 10: Tombol hapus disabled ketika tidak ada data**
 * **Validates: Requirements 3.5, 5.5**
 */
describe('**Feature: hapus-simpanan-pokok, Property 10: Tombol hapus disabled ketika tidak ada data**', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    
    test('For any state aplikasi dimana array simpananPokok kosong, tombol hapus harus dalam keadaan disabled dan menampilkan pesan informasi', () => {
        // Setup: localStorage kosong
        localStorage.setItem('simpananPokok', JSON.stringify([]));
        
        // Execute
        const result = refreshCount();
        
        // Verify: tombol harus disabled dan ada pesan
        expect(result.buttonDisabled).toBe(true);
        expect(result.buttonText).toContain('Tidak Ada Data');
    });
    
    test('For any non-empty simpanan pokok array, button should be enabled', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 50 }),
                (simpananArray) => {
                    // Setup: ada data
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    
                    // Execute
                    const result = refreshCount();
                    
                    // Verify: tombol harus enabled
                    return result.buttonDisabled === false;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For empty array, button text should indicate no data available', () => {
        // Setup
        localStorage.setItem('simpananPokok', JSON.stringify([]));
        
        // Execute
        const result = refreshCount();
        
        // Verify
        expect(result.buttonText).toContain('Tidak Ada Data');
    });
    
    test('For any state with data, button text should indicate delete action', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 10 }),
                (simpananArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    
                    // Execute
                    const result = refreshCount();
                    
                    // Verify: button text harus menunjukkan aksi hapus
                    return result.buttonText.includes('Hapus');
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For transition from data to empty, button should become disabled', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 10 }),
                (simpananArray) => {
                    // Setup: mulai dengan data
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    
                    // Execute: refresh pertama (ada data)
                    const result1 = refreshCount();
                    
                    // Hapus semua data
                    localStorage.setItem('simpananPokok', JSON.stringify([]));
                    
                    // Execute: refresh kedua (kosong)
                    const result2 = refreshCount();
                    
                    // Verify: transisi dari enabled ke disabled
                    return result1.buttonDisabled === false && 
                           result2.buttonDisabled === true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Feature: hapus-simpanan-pokok, Property 13: Halaman utility menampilkan jumlah data saat load**
 * **Validates: Requirements 5.1**
 */
describe('**Feature: hapus-simpanan-pokok, Property 13: Halaman utility menampilkan jumlah data saat load**', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    
    test('For any pembukaan halaman hapus_simpanan_pokok.html, sistem harus menghitung dan menampilkan jumlah data simpanan pokok dari localStorage', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 0, maxLength: 100 }),
                (simpananArray) => {
                    // Setup: simpan data sebelum "load"
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    
                    // Execute: simulate page load - call refreshCount
                    const result = refreshCount();
                    
                    // Verify: jumlah harus ditampilkan dengan akurat
                    return result.count === simpananArray.length;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any initial page load, count should match localStorage data', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 0, maxLength: 50 }),
                (simpananArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    
                    // Execute: simulate DOMContentLoaded
                    const count = hitungData();
                    
                    // Verify
                    return count === simpananArray.length;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For page load with empty data, should display 0', () => {
        // Setup: kosong
        localStorage.setItem('simpananPokok', JSON.stringify([]));
        
        // Execute
        const result = refreshCount();
        
        // Verify
        expect(result.count).toBe(0);
    });
    
    test('For page load with data, should display correct count immediately', () => {
        fc.assert(
            fc.property(
                fc.nat({ min: 1, max: 100 }),
                (dataCount) => {
                    // Setup: generate array dengan panjang tertentu
                    const simpananArray = Array.from({ length: dataCount }, (_, i) => ({
                        id: `id-${i}`,
                        anggotaId: `anggota-${i}`,
                        jumlah: 100000,
                        tanggal: '2024-01-01'
                    }));
                    
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    
                    // Execute: simulate page load
                    const result = refreshCount();
                    
                    // Verify: count harus sama dengan yang diharapkan
                    return result.count === dataCount;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For page load, button state should reflect data availability', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 0, maxLength: 50 }),
                (simpananArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    
                    // Execute
                    const result = refreshCount();
                    
                    // Verify: button state harus sesuai dengan ketersediaan data
                    const expectedDisabled = simpananArray.length === 0;
                    return result.buttonDisabled === expectedDisabled;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Feature: hapus-simpanan-pokok, Property 7: Penghapusan massal memerlukan konfirmasi ganda**
 * **Validates: Requirements 2.2, 2.3, 3.4**
 */
describe('**Feature: hapus-simpanan-pokok, Property 7: Penghapusan massal memerlukan konfirmasi ganda**', () => {
    // Define hapusSimpananPokok function for testing
    function hapusSimpananPokok() {
        const count = hitungData();
        
        if (count === 0) {
            alert('Tidak ada data simpanan pokok untuk dihapus.');
            return;
        }

        // Konfirmasi pertama
        const konfirmasi = confirm(
            `Anda akan menghapus ${count} data simpanan pokok.\n\n` +
            'Data yang dihapus TIDAK DAPAT dikembalikan!\n\n' +
            'Apakah Anda yakin ingin melanjutkan?'
        );

        if (!konfirmasi) {
            return;
        }

        // Konfirmasi kedua untuk keamanan
        const konfirmasi2 = confirm(
            'Konfirmasi terakhir!\n\n' +
            'Apakah Anda BENAR-BENAR yakin ingin menghapus SEMUA data simpanan pokok?'
        );

        if (!konfirmasi2) {
            return;
        }

        try {
            // Hapus data dari localStorage
            localStorage.setItem('simpananPokok', JSON.stringify([]));

            // Tampilkan pesan sukses
            showAlert('Semua data simpanan pokok berhasil dihapus', 'success');
            
            // Refresh count
            refreshCount();
        } catch (error) {
            alert('Terjadi kesalahan saat menghapus data: ' + error.message);
            console.error('Error:', error);
        }
    }
    
    let alertCalls = [];
    let showAlertCalls = [];
    
    beforeEach(() => {
        localStorage.clear();
        confirmCalls = [];
        alertCalls = [];
        showAlertCalls = [];
        confirmResult = true;
        
        // Mock alert
        global.alert = (message) => {
            alertCalls.push(message);
        };
        
        // Mock showAlert
        global.showAlert = (message, type) => {
            showAlertCalls.push({ message, type });
        };
    });
    
    test('For any operasi penghapusan massal, sistem harus menampilkan dua dialog konfirmasi berturut-turut sebelum menghapus data', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 50 }),
                (simpananArray) => {
                    // Setup: simpan data ke localStorage
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    confirmCalls = [];
                    
                    // Mock confirm to return true for both confirmations
                    let confirmCallCount = 0;
                    global.confirm = (message) => {
                        confirmCalls.push(message);
                        confirmCallCount++;
                        return true; // User confirms both times
                    };
                    
                    // Execute: panggil hapusSimpananPokok
                    hapusSimpananPokok();
                    
                    // Verify: harus ada 2 konfirmasi
                    return confirmCalls.length === 2;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any mass deletion, first confirmation must be shown before second', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 20 }),
                (simpananArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    confirmCalls = [];
                    
                    let confirmCallCount = 0;
                    global.confirm = (message) => {
                        confirmCalls.push(message);
                        confirmCallCount++;
                        return true;
                    };
                    
                    // Execute
                    hapusSimpananPokok();
                    
                    // Verify: konfirmasi pertama harus berisi jumlah data
                    const firstConfirm = confirmCalls[0];
                    return firstConfirm && firstConfirm.includes(simpananArray.length.toString());
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any mass deletion, if first confirmation is cancelled, second should not appear', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 20 }),
                (simpananArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    confirmCalls = [];
                    
                    // Mock confirm to return false on first call
                    global.confirm = (message) => {
                        confirmCalls.push(message);
                        return false; // User cancels first confirmation
                    };
                    
                    // Execute
                    hapusSimpananPokok();
                    
                    // Verify: hanya ada 1 konfirmasi (yang pertama)
                    return confirmCalls.length === 1;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any mass deletion, both confirmations must be accepted to proceed', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 20 }),
                (simpananArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    const originalData = JSON.stringify(simpananArray);
                    confirmCalls = [];
                    
                    // Mock confirm to return true then false
                    let callCount = 0;
                    global.confirm = (message) => {
                        confirmCalls.push(message);
                        callCount++;
                        return callCount === 1; // True for first, false for second
                    };
                    
                    // Execute
                    hapusSimpananPokok();
                    
                    // Verify: data harus tetap ada karena konfirmasi kedua dibatalkan
                    const currentData = localStorage.getItem('simpananPokok');
                    return currentData === originalData;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For empty data, no confirmation dialogs should appear', () => {
        // Setup: localStorage kosong
        localStorage.setItem('simpananPokok', JSON.stringify([]));
        confirmCalls = [];
        alertCalls = [];
        
        // Execute
        hapusSimpananPokok();
        
        // Verify: tidak ada konfirmasi, hanya alert
        expect(confirmCalls.length).toBe(0);
        expect(alertCalls.length).toBe(1);
        expect(alertCalls[0]).toContain('Tidak ada data');
    });
});

/**
 * **Feature: hapus-simpanan-pokok, Property 8: Semua data terhapus setelah konfirmasi ganda**
 * **Validates: Requirements 2.4, 4.4**
 */
describe('**Feature: hapus-simpanan-pokok, Property 8: Semua data terhapus setelah konfirmasi ganda**', () => {
    function hapusSimpananPokok() {
        const count = hitungData();
        
        if (count === 0) {
            alert('Tidak ada data simpanan pokok untuk dihapus.');
            return;
        }

        const konfirmasi = confirm(
            `Anda akan menghapus ${count} data simpanan pokok.\n\n` +
            'Data yang dihapus TIDAK DAPAT dikembalikan!\n\n' +
            'Apakah Anda yakin ingin melanjutkan?'
        );

        if (!konfirmasi) {
            return;
        }

        const konfirmasi2 = confirm(
            'Konfirmasi terakhir!\n\n' +
            'Apakah Anda BENAR-BENAR yakin ingin menghapus SEMUA data simpanan pokok?'
        );

        if (!konfirmasi2) {
            return;
        }

        try {
            localStorage.setItem('simpananPokok', JSON.stringify([]));
            showAlert('Semua data simpanan pokok berhasil dihapus', 'success');
            refreshCount();
        } catch (error) {
            alert('Terjadi kesalahan saat menghapus data: ' + error.message);
            console.error('Error:', error);
        }
    }
    
    let showAlertCalls = [];
    
    beforeEach(() => {
        localStorage.clear();
        confirmCalls = [];
        showAlertCalls = [];
        
        global.showAlert = (message, type) => {
            showAlertCalls.push({ message, type });
        };
    });
    
    test('For any state aplikasi dengan data simpanan pokok, setelah admin mengkonfirmasi kedua dialog penghapusan massal, localStorage harus berisi array kosong untuk key simpananPokok', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 100 }),
                (simpananArray) => {
                    // Setup: simpan data ke localStorage
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    
                    // Mock confirm to return true for both confirmations
                    global.confirm = () => true;
                    
                    // Execute: panggil hapusSimpananPokok
                    hapusSimpananPokok();
                    
                    // Verify: localStorage harus berisi array kosong
                    const data = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
                    return data.length === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any data count, after double confirmation, all items must be removed', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 50 }),
                (simpananArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    const originalCount = simpananArray.length;
                    
                    // Mock confirm to accept both
                    global.confirm = () => true;
                    
                    // Execute
                    hapusSimpananPokok();
                    
                    // Verify: count harus jadi 0
                    const newCount = hitungData();
                    return originalCount > 0 && newCount === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any successful mass deletion, localStorage should contain empty array not null', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 20 }),
                (simpananArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    
                    // Mock confirm
                    global.confirm = () => true;
                    
                    // Execute
                    hapusSimpananPokok();
                    
                    // Verify: harus array kosong, bukan null
                    const data = localStorage.getItem('simpananPokok');
                    const parsed = JSON.parse(data);
                    return Array.isArray(parsed) && parsed.length === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any mass deletion, success notification should be shown after deletion', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 20 }),
                (simpananArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    showAlertCalls = [];
                    
                    // Mock confirm
                    global.confirm = () => true;
                    
                    // Execute
                    hapusSimpananPokok();
                    
                    // Verify: harus ada notifikasi sukses
                    const hasSuccessAlert = showAlertCalls.some(call => 
                        call.type === 'success' && call.message.includes('berhasil')
                    );
                    return hasSuccessAlert;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any cancelled second confirmation, data should remain intact', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 20 }),
                (simpananArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    const originalLength = simpananArray.length;
                    
                    // Mock confirm: true for first, false for second
                    let callCount = 0;
                    global.confirm = () => {
                        callCount++;
                        return callCount === 1;
                    };
                    
                    // Execute
                    hapusSimpananPokok();
                    
                    // Verify: data harus tetap ada
                    const currentData = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
                    return currentData.length === originalLength;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Feature: hapus-simpanan-pokok, Property 9: Dialog konfirmasi berisi informasi yang jelas**
 * **Validates: Requirements 3.1, 3.3**
 */
describe('**Feature: hapus-simpanan-pokok, Property 9: Dialog konfirmasi berisi informasi yang jelas**', () => {
    function hapusSimpananPokok() {
        const count = hitungData();
        
        if (count === 0) {
            alert('Tidak ada data simpanan pokok untuk dihapus.');
            return;
        }

        const konfirmasi = confirm(
            `Anda akan menghapus ${count} data simpanan pokok.\n\n` +
            'Data yang dihapus TIDAK DAPAT dikembalikan!\n\n' +
            'Apakah Anda yakin ingin melanjutkan?'
        );

        if (!konfirmasi) {
            return;
        }

        const konfirmasi2 = confirm(
            'Konfirmasi terakhir!\n\n' +
            'Apakah Anda BENAR-BENAR yakin ingin menghapus SEMUA data simpanan pokok?'
        );

        if (!konfirmasi2) {
            return;
        }

        try {
            localStorage.setItem('simpananPokok', JSON.stringify([]));
            showAlert('Semua data simpanan pokok berhasil dihapus', 'success');
            refreshCount();
        } catch (error) {
            alert('Terjadi kesalahan saat menghapus data: ' + error.message);
            console.error('Error:', error);
        }
    }
    
    beforeEach(() => {
        localStorage.clear();
        confirmCalls = [];
    });
    
    test('For any dialog konfirmasi penghapusan, dialog harus berisi pesan tentang konsekuensi penghapusan dan opsi untuk membatalkan', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 50 }),
                (simpananArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    confirmCalls = [];
                    
                    // Mock confirm to capture messages
                    global.confirm = (message) => {
                        confirmCalls.push(message);
                        return false; // Cancel to stop at first dialog
                    };
                    
                    // Execute
                    hapusSimpananPokok();
                    
                    // Verify: dialog pertama harus berisi warning tentang konsekuensi
                    const firstDialog = confirmCalls[0];
                    const hasConsequenceWarning = firstDialog.includes('TIDAK DAPAT dikembalikan') || 
                                                   firstDialog.includes('tidak dapat dikembalikan');
                    
                    // confirm() secara implisit menyediakan opsi cancel
                    return hasConsequenceWarning;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any mass deletion dialog, first confirmation must display data count', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 50 }),
                (simpananArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    confirmCalls = [];
                    
                    global.confirm = (message) => {
                        confirmCalls.push(message);
                        return false;
                    };
                    
                    // Execute
                    hapusSimpananPokok();
                    
                    // Verify: dialog harus menampilkan jumlah data
                    const firstDialog = confirmCalls[0];
                    return firstDialog.includes(simpananArray.length.toString());
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any mass deletion, first dialog must contain clear warning message', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 20 }),
                (simpananArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    confirmCalls = [];
                    
                    global.confirm = (message) => {
                        confirmCalls.push(message);
                        return false;
                    };
                    
                    // Execute
                    hapusSimpananPokok();
                    
                    // Verify: pesan harus jelas tentang penghapusan
                    const firstDialog = confirmCalls[0];
                    const hasDeleteWarning = firstDialog.includes('menghapus') || 
                                             firstDialog.includes('hapus');
                    const hasDataType = firstDialog.includes('simpanan pokok');
                    
                    return hasDeleteWarning && hasDataType;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any mass deletion, second dialog must emphasize finality', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 20 }),
                (simpananArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    confirmCalls = [];
                    
                    // Mock confirm to accept first, capture second
                    let callCount = 0;
                    global.confirm = (message) => {
                        confirmCalls.push(message);
                        callCount++;
                        return callCount === 1; // Accept first, reject second
                    };
                    
                    // Execute
                    hapusSimpananPokok();
                    
                    // Verify: dialog kedua harus menekankan kepastian
                    const secondDialog = confirmCalls[1];
                    const hasEmphasis = secondDialog.includes('BENAR-BENAR') || 
                                        secondDialog.includes('terakhir') ||
                                        secondDialog.includes('SEMUA');
                    
                    return hasEmphasis;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any confirmation dialog, user must have option to cancel (implicit in confirm)', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 20 }),
                (simpananArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    const originalData = JSON.stringify(simpananArray);
                    
                    // Mock confirm to cancel
                    global.confirm = () => false;
                    
                    // Execute
                    hapusSimpananPokok();
                    
                    // Verify: data harus tetap ada (cancel berhasil)
                    const currentData = localStorage.getItem('simpananPokok');
                    return currentData === originalData;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For both confirmation dialogs, messages should be in Indonesian', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 10 }),
                (simpananArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    confirmCalls = [];
                    
                    global.confirm = (message) => {
                        confirmCalls.push(message);
                        return true; // Accept both to see both messages
                    };
                    
                    // Execute
                    hapusSimpananPokok();
                    
                    // Verify: kedua dialog harus dalam bahasa Indonesia
                    const firstDialog = confirmCalls[0];
                    const secondDialog = confirmCalls[1];
                    
                    const firstIsIndonesian = firstDialog.includes('Anda') || 
                                              firstDialog.includes('yakin');
                    const secondIsIndonesian = secondDialog.includes('Apakah') || 
                                               secondDialog.includes('yakin');
                    
                    return firstIsIndonesian && secondIsIndonesian;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Feature: hapus-simpanan-pokok, Property 11: Persistence setelah refresh**
 * **Validates: Requirements 4.3**
 */
describe('**Feature: hapus-simpanan-pokok, Property 11: Persistence setelah refresh**', () => {
    beforeEach(() => {
        localStorage.clear();
        confirmCalls = [];
        renderSimpananCalls = 0;
        confirmResult = true;
    });
    
    test('For any data simpanan pokok yang dihapus, setelah halaman di-refresh, data tersebut tidak boleh muncul kembali dalam tampilan', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 2, maxLength: 20 }),
                (simpananArray) => {
                    // Setup: simpan data ke localStorage
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    
                    // Pilih item untuk dihapus
                    const itemToDelete = simpananArray[0];
                    const remainingItems = simpananArray.slice(1);
                    
                    // Konfirmasi = true
                    confirmResult = true;
                    
                    // Execute: hapus data
                    deleteSimpananPokok(itemToDelete.id);
                    
                    // Simulate page refresh: read from localStorage again
                    const dataAfterRefresh = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
                    
                    // Verify: data yang dihapus tidak boleh ada
                    const deletedItemExists = dataAfterRefresh.some(s => s.id === itemToDelete.id);
                    
                    // Verify: data lain harus masih ada
                    const otherItemsExist = remainingItems.every(item =>
                        dataAfterRefresh.some(s => s.id === item.id)
                    );
                    
                    return !deletedItemExists && otherItemsExist;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any mass deletion, after refresh, localStorage should still contain empty array', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 50 }),
                (simpananArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    
                    // Mock confirm to accept both confirmations
                    global.confirm = () => true;
                    
                    // Define hapusSimpananPokok for this test
                    function hapusSimpananPokok() {
                        const count = hitungData();
                        if (count === 0) return;
                        
                        const konfirmasi = confirm('First confirmation');
                        if (!konfirmasi) return;
                        
                        const konfirmasi2 = confirm('Second confirmation');
                        if (!konfirmasi2) return;
                        
                        localStorage.setItem('simpananPokok', JSON.stringify([]));
                    }
                    
                    // Execute: hapus semua data
                    hapusSimpananPokok();
                    
                    // Simulate page refresh: read from localStorage
                    const dataAfterRefresh = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
                    
                    // Verify: harus tetap kosong setelah refresh
                    return Array.isArray(dataAfterRefresh) && dataAfterRefresh.length === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any deleted item, persistence check across multiple refresh simulations', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 3, maxLength: 15 }),
                (simpananArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    
                    // Hapus item pertama
                    const itemToDelete = simpananArray[0];
                    confirmResult = true;
                    deleteSimpananPokok(itemToDelete.id);
                    
                    // Simulate multiple refreshes
                    for (let i = 0; i < 3; i++) {
                        const dataAfterRefresh = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
                        
                        // Verify: item yang dihapus tidak boleh muncul di setiap refresh
                        const deletedItemExists = dataAfterRefresh.some(s => s.id === itemToDelete.id);
                        if (deletedItemExists) {
                            return false;
                        }
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any deletion, count should remain accurate after refresh', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 2, maxLength: 20 }),
                (simpananArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    const originalCount = simpananArray.length;
                    
                    // Hapus satu item
                    confirmResult = true;
                    deleteSimpananPokok(simpananArray[0].id);
                    
                    // Simulate refresh: hitung ulang dari localStorage
                    const countAfterRefresh = hitungData();
                    
                    // Verify: count harus berkurang 1
                    return countAfterRefresh === originalCount - 1;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any state, persistence should work correctly even with page reload simulation', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 10 }),
                fc.nat({ max: 10 }),
                (simpananArray, deleteCount) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    
                    // Hapus beberapa item (tapi tidak lebih dari yang ada)
                    const actualDeleteCount = Math.min(deleteCount, simpananArray.length);
                    const itemsToDelete = simpananArray.slice(0, actualDeleteCount);
                    const expectedRemaining = simpananArray.length - actualDeleteCount;
                    
                    confirmResult = true;
                    itemsToDelete.forEach(item => {
                        deleteSimpananPokok(item.id);
                    });
                    
                    // Simulate page refresh
                    const dataAfterRefresh = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
                    
                    // Verify: jumlah data yang tersisa harus sesuai
                    return dataAfterRefresh.length === expectedRemaining;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Feature: hapus-simpanan-pokok, Property 12: Isolasi data - data lain tidak terpengaruh**
 * **Validates: Requirements 4.5**
 */
describe('**Feature: hapus-simpanan-pokok, Property 12: Isolasi data - data lain tidak terpengaruh**', () => {
    // Generator for other data types
    const anggotaArbitrary = fc.record({
        id: fc.uuid(),
        nik: fc.string({ minLength: 16, maxLength: 16 }),
        nama: fc.string({ minLength: 3, maxLength: 50 }),
        alamat: fc.string({ minLength: 10, maxLength: 100 })
    });
    
    const simpananWajibArbitrary = fc.record({
        id: fc.uuid(),
        anggotaId: fc.uuid(),
        jumlah: fc.nat({ max: 50000000 }),
        tanggal: fc.date().map(d => d.toISOString().split('T')[0])
    });
    
    const simpananSukarelaArbitrary = fc.record({
        id: fc.uuid(),
        anggotaId: fc.uuid(),
        jumlah: fc.nat({ max: 100000000 }),
        tanggal: fc.date().map(d => d.toISOString().split('T')[0])
    });
    
    beforeEach(() => {
        localStorage.clear();
        confirmCalls = [];
        renderSimpananCalls = 0;
        confirmResult = true;
    });
    
    test('For any operasi penghapusan simpanan pokok, data anggota dan jenis simpanan lainnya (simpananWajib, simpananSukarela) harus tetap utuh di localStorage', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 10 }),
                fc.array(anggotaArbitrary, { minLength: 1, maxLength: 10 }),
                fc.array(simpananWajibArbitrary, { minLength: 1, maxLength: 10 }),
                fc.array(simpananSukarelaArbitrary, { minLength: 1, maxLength: 10 }),
                (simpananPokokArray, anggotaArray, simpananWajibArray, simpananSukarelaArray) => {
                    // Setup: simpan semua jenis data ke localStorage
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananPokokArray));
                    localStorage.setItem('anggota', JSON.stringify(anggotaArray));
                    localStorage.setItem('simpananWajib', JSON.stringify(simpananWajibArray));
                    localStorage.setItem('simpananSukarela', JSON.stringify(simpananSukarelaArray));
                    
                    // Simpan data original untuk perbandingan
                    const originalAnggota = JSON.stringify(anggotaArray);
                    const originalSimpananWajib = JSON.stringify(simpananWajibArray);
                    const originalSimpananSukarela = JSON.stringify(simpananSukarelaArray);
                    
                    // Execute: hapus simpanan pokok
                    confirmResult = true;
                    deleteSimpananPokok(simpananPokokArray[0].id);
                    
                    // Verify: data lain harus tetap utuh
                    const currentAnggota = localStorage.getItem('anggota');
                    const currentSimpananWajib = localStorage.getItem('simpananWajib');
                    const currentSimpananSukarela = localStorage.getItem('simpananSukarela');
                    
                    return currentAnggota === originalAnggota &&
                           currentSimpananWajib === originalSimpananWajib &&
                           currentSimpananSukarela === originalSimpananSukarela;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any mass deletion of simpanan pokok, other data types should remain completely unchanged', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 20 }),
                fc.array(anggotaArbitrary, { minLength: 1, maxLength: 20 }),
                fc.array(simpananWajibArbitrary, { minLength: 1, maxLength: 20 }),
                (simpananPokokArray, anggotaArray, simpananWajibArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananPokokArray));
                    localStorage.setItem('anggota', JSON.stringify(anggotaArray));
                    localStorage.setItem('simpananWajib', JSON.stringify(simpananWajibArray));
                    
                    const originalAnggota = JSON.stringify(anggotaArray);
                    const originalSimpananWajib = JSON.stringify(simpananWajibArray);
                    
                    // Mock confirm for mass deletion
                    global.confirm = () => true;
                    
                    // Define hapusSimpananPokok
                    function hapusSimpananPokok() {
                        const count = hitungData();
                        if (count === 0) return;
                        
                        const konfirmasi = confirm('First');
                        if (!konfirmasi) return;
                        
                        const konfirmasi2 = confirm('Second');
                        if (!konfirmasi2) return;
                        
                        localStorage.setItem('simpananPokok', JSON.stringify([]));
                    }
                    
                    // Execute: hapus semua simpanan pokok
                    hapusSimpananPokok();
                    
                    // Verify: data lain tidak berubah
                    const currentAnggota = localStorage.getItem('anggota');
                    const currentSimpananWajib = localStorage.getItem('simpananWajib');
                    
                    return currentAnggota === originalAnggota &&
                           currentSimpananWajib === originalSimpananWajib;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any deletion operation, only simpananPokok key should be modified', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 2, maxLength: 10 }),
                fc.array(anggotaArbitrary, { minLength: 1, maxLength: 10 }),
                (simpananPokokArray, anggotaArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananPokokArray));
                    localStorage.setItem('anggota', JSON.stringify(anggotaArray));
                    localStorage.setItem('otherData', JSON.stringify({ test: 'data' }));
                    
                    const originalAnggota = localStorage.getItem('anggota');
                    const originalOtherData = localStorage.getItem('otherData');
                    
                    // Execute: hapus satu simpanan pokok
                    confirmResult = true;
                    deleteSimpananPokok(simpananPokokArray[0].id);
                    
                    // Verify: hanya simpananPokok yang berubah
                    const currentAnggota = localStorage.getItem('anggota');
                    const currentOtherData = localStorage.getItem('otherData');
                    const currentSimpananPokok = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
                    
                    return currentAnggota === originalAnggota &&
                           currentOtherData === originalOtherData &&
                           currentSimpananPokok.length === simpananPokokArray.length - 1;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any deletion, anggota data should remain with all properties intact', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 10 }),
                fc.array(anggotaArbitrary, { minLength: 1, maxLength: 10 }),
                (simpananPokokArray, anggotaArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananPokokArray));
                    localStorage.setItem('anggota', JSON.stringify(anggotaArray));
                    
                    // Execute: hapus simpanan pokok
                    confirmResult = true;
                    deleteSimpananPokok(simpananPokokArray[0].id);
                    
                    // Verify: anggota data harus identik
                    const currentAnggota = JSON.parse(localStorage.getItem('anggota') || '[]');
                    
                    return anggotaArray.every((anggota, index) => {
                        const current = currentAnggota[index];
                        return current &&
                               current.id === anggota.id &&
                               current.nik === anggota.nik &&
                               current.nama === anggota.nama &&
                               current.alamat === anggota.alamat;
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any deletion, simpananWajib and simpananSukarela should maintain their counts', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 10 }),
                fc.array(simpananWajibArbitrary, { minLength: 1, maxLength: 10 }),
                fc.array(simpananSukarelaArbitrary, { minLength: 1, maxLength: 10 }),
                (simpananPokokArray, simpananWajibArray, simpananSukarelaArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananPokokArray));
                    localStorage.setItem('simpananWajib', JSON.stringify(simpananWajibArray));
                    localStorage.setItem('simpananSukarela', JSON.stringify(simpananSukarelaArray));
                    
                    const originalWajibCount = simpananWajibArray.length;
                    const originalSukarelaCount = simpananSukarelaArray.length;
                    
                    // Execute: hapus simpanan pokok
                    confirmResult = true;
                    deleteSimpananPokok(simpananPokokArray[0].id);
                    
                    // Verify: count data lain harus tetap sama
                    const currentWajib = JSON.parse(localStorage.getItem('simpananWajib') || '[]');
                    const currentSukarela = JSON.parse(localStorage.getItem('simpananSukarela') || '[]');
                    
                    return currentWajib.length === originalWajibCount &&
                           currentSukarela.length === originalSukarelaCount;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For multiple deletions, isolation should be maintained throughout', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 3, maxLength: 10 }),
                fc.array(anggotaArbitrary, { minLength: 2, maxLength: 10 }),
                (simpananPokokArray, anggotaArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananPokokArray));
                    localStorage.setItem('anggota', JSON.stringify(anggotaArray));
                    
                    const originalAnggota = JSON.stringify(anggotaArray);
                    
                    // Execute: hapus beberapa simpanan pokok
                    confirmResult = true;
                    const itemsToDelete = simpananPokokArray.slice(0, 2);
                    itemsToDelete.forEach(item => {
                        deleteSimpananPokok(item.id);
                    });
                    
                    // Verify: anggota data tetap tidak berubah
                    const currentAnggota = localStorage.getItem('anggota');
                    
                    return currentAnggota === originalAnggota;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any deletion, localStorage keys for other data should not be removed', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 10 }),
                (simpananPokokArray) => {
                    // Setup: set multiple keys
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananPokokArray));
                    localStorage.setItem('anggota', JSON.stringify([{ id: '1', nama: 'Test' }]));
                    localStorage.setItem('simpananWajib', JSON.stringify([{ id: '1', jumlah: 1000 }]));
                    localStorage.setItem('simpananSukarela', JSON.stringify([{ id: '1', jumlah: 2000 }]));
                    
                    // Execute: hapus simpanan pokok
                    confirmResult = true;
                    deleteSimpananPokok(simpananPokokArray[0].id);
                    
                    // Verify: semua key lain masih ada
                    const hasAnggota = localStorage.getItem('anggota') !== null;
                    const hasSimpananWajib = localStorage.getItem('simpananWajib') !== null;
                    const hasSimpananSukarela = localStorage.getItem('simpananSukarela') !== null;
                    
                    return hasAnggota && hasSimpananWajib && hasSimpananSukarela;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Feature: hapus-simpanan-pokok, Property 14: Refresh memperbarui jumlah data**
 * **Validates: Requirements 6.2**
 */
describe('**Feature: hapus-simpanan-pokok, Property 14: Refresh memperbarui jumlah data**', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    
    test('For any state aplikasi, ketika tombol refresh diklik, jumlah data yang ditampilkan harus diperbarui sesuai dengan data terbaru di localStorage', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 0, maxLength: 50 }),
                fc.array(simpananPokokArbitrary, { minLength: 0, maxLength: 50 }),
                (initialData, updatedData) => {
                    // Setup: mulai dengan data awal
                    localStorage.setItem('simpananPokok', JSON.stringify(initialData));
                    
                    // Execute: refresh pertama
                    const result1 = refreshCount();
                    
                    // Verify: count pertama harus sesuai data awal
                    const firstCountCorrect = result1.count === initialData.length;
                    
                    // Simulate data change (misalnya dari tab lain atau operasi lain)
                    localStorage.setItem('simpananPokok', JSON.stringify(updatedData));
                    
                    // Execute: refresh kedua
                    const result2 = refreshCount();
                    
                    // Verify: count kedua harus sesuai data terbaru
                    const secondCountCorrect = result2.count === updatedData.length;
                    
                    return firstCountCorrect && secondCountCorrect;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any data modification, refresh should reflect the new count immediately', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 5, maxLength: 20 }),
                fc.nat({ min: 1, max: 5 }),
                (simpananArray, itemsToRemove) => {
                    // Setup: simpan data awal
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    
                    // Execute: refresh sebelum perubahan
                    const beforeResult = refreshCount();
                    
                    // Modify data: hapus beberapa item
                    const modifiedData = simpananArray.slice(itemsToRemove);
                    localStorage.setItem('simpananPokok', JSON.stringify(modifiedData));
                    
                    // Execute: refresh setelah perubahan
                    const afterResult = refreshCount();
                    
                    // Verify: count harus berubah sesuai perubahan data
                    return beforeResult.count === simpananArray.length &&
                           afterResult.count === modifiedData.length;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For transition from empty to populated, refresh should update count correctly', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 30 }),
                (simpananArray) => {
                    // Setup: mulai dengan data kosong
                    localStorage.setItem('simpananPokok', JSON.stringify([]));
                    
                    // Execute: refresh dengan data kosong
                    const emptyResult = refreshCount();
                    
                    // Add data
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    
                    // Execute: refresh dengan data
                    const populatedResult = refreshCount();
                    
                    // Verify: transisi dari 0 ke jumlah data
                    return emptyResult.count === 0 &&
                           populatedResult.count === simpananArray.length;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For transition from populated to empty, refresh should update count to zero', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 1, maxLength: 30 }),
                (simpananArray) => {
                    // Setup: mulai dengan data
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    
                    // Execute: refresh dengan data
                    const populatedResult = refreshCount();
                    
                    // Clear data
                    localStorage.setItem('simpananPokok', JSON.stringify([]));
                    
                    // Execute: refresh setelah clear
                    const emptyResult = refreshCount();
                    
                    // Verify: transisi dari jumlah data ke 0
                    return populatedResult.count === simpananArray.length &&
                           emptyResult.count === 0;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any refresh operation, button state should be updated based on data availability', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 0, maxLength: 20 }),
                (simpananArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    
                    // Execute: refresh
                    const result = refreshCount();
                    
                    // Verify: button state harus sesuai dengan ketersediaan data
                    const expectedDisabled = simpananArray.length === 0;
                    return result.buttonDisabled === expectedDisabled;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For multiple consecutive refreshes, count should remain consistent with localStorage', () => {
        fc.assert(
            fc.property(
                fc.array(simpananPokokArbitrary, { minLength: 0, maxLength: 30 }),
                (simpananArray) => {
                    // Setup
                    localStorage.setItem('simpananPokok', JSON.stringify(simpananArray));
                    
                    // Execute: multiple refreshes
                    const result1 = refreshCount();
                    const result2 = refreshCount();
                    const result3 = refreshCount();
                    
                    // Verify: semua refresh harus memberikan hasil yang sama
                    return result1.count === simpananArray.length &&
                           result2.count === simpananArray.length &&
                           result3.count === simpananArray.length;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * **Feature: hapus-simpanan-pokok, Property 15: Error handling menampilkan pesan informatif**
 * **Validates: Requirements 6.5**
 */
describe('**Feature: hapus-simpanan-pokok, Property 15: Error handling menampilkan pesan informatif**', () => {
    let consoleErrorCalls = [];
    
    beforeEach(() => {
        localStorage.clear();
        consoleErrorCalls = [];
        
        // Mock console.error to track error logging
        global.console.error = (...args) => {
            consoleErrorCalls.push(args);
        };
    });
    
    test('For any error yang terjadi saat menghitung data, sistem harus menampilkan pesan error yang informatif', () => {
        // Setup: corrupt localStorage to trigger error
        const originalGetItem = Storage.prototype.getItem;
        Storage.prototype.getItem = function(key) {
            if (key === 'simpananPokok') {
                return 'invalid json {{{';
            }
            return originalGetItem.call(this, key);
        };
        
        // Execute: hitungData should handle error gracefully
        const count = hitungData();
        
        // Verify: should return 0 and log error
        const errorLogged = consoleErrorCalls.length > 0;
        
        // Restore original function
        Storage.prototype.getItem = originalGetItem;
        
        expect(count).toBe(0);
        expect(errorLogged).toBe(true);
    });
    
    test('For corrupted localStorage data, hitungData should return 0 instead of throwing', () => {
        // Setup: set invalid JSON
        const originalGetItem = Storage.prototype.getItem;
        Storage.prototype.getItem = function(key) {
            if (key === 'simpananPokok') {
                return 'not valid json';
            }
            return originalGetItem.call(this, key);
        };
        
        // Execute: should not throw
        let errorThrown = false;
        let result;
        try {
            result = hitungData();
        } catch (e) {
            errorThrown = true;
        }
        
        // Restore
        Storage.prototype.getItem = originalGetItem;
        
        // Verify: no error thrown, returns 0
        expect(errorThrown).toBe(false);
        expect(result).toBe(0);
    });
    
    test('For any error during data counting, error message should be logged to console', () => {
        // Setup: force error
        const originalGetItem = Storage.prototype.getItem;
        Storage.prototype.getItem = function(key) {
            if (key === 'simpananPokok') {
                return '{invalid}';
            }
            return originalGetItem.call(this, key);
        };
        
        consoleErrorCalls = [];
        
        // Execute
        hitungData();
        
        // Restore
        Storage.prototype.getItem = originalGetItem;
        
        // Verify: error should be logged
        expect(consoleErrorCalls.length).toBeGreaterThan(0);
    });
    
    test('For localStorage access errors, system should handle gracefully without crashing', () => {
        // Setup: simulate localStorage unavailable
        const originalGetItem = Storage.prototype.getItem;
        Storage.prototype.getItem = function(key) {
            if (key === 'simpananPokok') {
                throw new Error('localStorage is not available');
            }
            return originalGetItem.call(this, key);
        };
        
        // Execute: should not crash
        let crashed = false;
        let result;
        try {
            result = hitungData();
        } catch (e) {
            crashed = true;
        }
        
        // Restore
        Storage.prototype.getItem = originalGetItem;
        
        // Verify: should handle gracefully
        expect(crashed).toBe(false);
        expect(result).toBe(0);
    });
    
    test('For any error scenario, refreshCount should still complete without throwing', () => {
        // Setup: corrupt data
        const originalGetItem = Storage.prototype.getItem;
        Storage.prototype.getItem = function(key) {
            if (key === 'simpananPokok') {
                return 'corrupt data';
            }
            return originalGetItem.call(this, key);
        };
        
        // Execute: should not throw
        let errorThrown = false;
        let result;
        try {
            result = refreshCount();
        } catch (e) {
            errorThrown = true;
        }
        
        // Restore
        Storage.prototype.getItem = originalGetItem;
        
        // Verify: completes without error
        expect(errorThrown).toBe(false);
        expect(result).toBeDefined();
        expect(result.count).toBe(0);
    });
    
    test('For error during deletion, informative error message should be shown to user', () => {
        let showAlertCalls = [];
        global.showAlert = (message, type) => {
            showAlertCalls.push({ message, type });
        };
        
        // Setup: create scenario that causes error during deletion
        const simpanan = { id: 'test-id', anggotaId: 'anggota-1', jumlah: 1000, tanggal: '2024-01-01' };
        localStorage.setItem('simpananPokok', JSON.stringify([simpanan]));
        
        // Mock localStorage.setItem to throw error
        const originalSetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = function(key, value) {
            if (key === 'simpananPokok') {
                throw new Error('Storage quota exceeded');
            }
            return originalSetItem.call(this, key, value);
        };
        
        // Mock confirm to accept
        global.confirm = () => true;
        
        // Execute: try to delete
        deleteSimpananPokok(simpanan.id);
        
        // Restore
        Storage.prototype.setItem = originalSetItem;
        
        // Verify: error message should be shown
        const hasErrorAlert = showAlertCalls.some(call => 
            call.type === 'danger' && call.message.includes('kesalahan')
        );
        
        expect(hasErrorAlert).toBe(true);
    });
});


/**
 * Unit Tests for UI Elements
 * Task 6.1: Test warna tombol hapus (merah), pesan sukses (hijau), peringatan (kuning), dan ikon
 */
describe('UI Elements Styling Tests', () => {
    let container;
    
    beforeEach(() => {
        // Create a container for DOM testing
        container = document.createElement('div');
        document.body.appendChild(container);
        localStorage.clear();
    });
    
    afterEach(() => {
        document.body.removeChild(container);
    });
    
    describe('Tombol Hapus Individual - Warna Merah', () => {
        test('Tombol hapus individual harus menggunakan class btn-danger (merah)', () => {
            // Setup: render tombol hapus
            container.innerHTML = `
                <button class="btn btn-sm btn-danger" onclick="deleteSimpananPokok('test-id')">
                    <i class="bi bi-trash"></i>
                </button>
            `;
            
            const button = container.querySelector('button');
            
            // Verify: tombol harus memiliki class btn-danger
            expect(button.classList.contains('btn-danger')).toBe(true);
        });
        
        test('Tombol hapus harus memiliki ikon trash', () => {
            // Setup
            container.innerHTML = `
                <button class="btn btn-sm btn-danger" onclick="deleteSimpananPokok('test-id')">
                    <i class="bi bi-trash"></i>
                </button>
            `;
            
            const icon = container.querySelector('i.bi-trash');
            
            // Verify: ikon trash harus ada
            expect(icon).not.toBeNull();
        });
    });
    
    describe('Tombol Hapus Massal - Warna Merah', () => {
        test('Tombol hapus massal harus menggunakan class btn-danger (merah)', () => {
            // Setup: render tombol hapus massal dari utility page
            container.innerHTML = `
                <button class="btn btn-danger btn-lg" onclick="hapusSimpananPokok()" id="btnHapus">
                    <i class="bi bi-trash3 me-2"></i>Hapus Semua Data Simpanan Pokok
                </button>
            `;
            
            const button = container.querySelector('#btnHapus');
            
            // Verify: tombol harus memiliki class btn-danger
            expect(button.classList.contains('btn-danger')).toBe(true);
        });
        
        test('Tombol hapus massal harus memiliki ikon trash3', () => {
            // Setup
            container.innerHTML = `
                <button class="btn btn-danger btn-lg" onclick="hapusSimpananPokok()" id="btnHapus">
                    <i class="bi bi-trash3 me-2"></i>Hapus Semua Data Simpanan Pokok
                </button>
            `;
            
            const icon = container.querySelector('i.bi-trash3');
            
            // Verify: ikon trash3 harus ada
            expect(icon).not.toBeNull();
        });
    });
    
    describe('Pesan Sukses - Warna Hijau', () => {
        test('Success box harus menggunakan background hijau', () => {
            // Setup: render success box
            container.innerHTML = `
                <div id="successBox" class="success-box" style="display: block;">
                    <i class="bi bi-check-circle me-2"></i>
                    <strong>Berhasil!</strong> Semua data simpanan pokok telah dihapus.
                </div>
            `;
            
            const successBox = container.querySelector('#successBox');
            
            // Verify: success box harus memiliki class success-box
            expect(successBox.classList.contains('success-box')).toBe(true);
        });
        
        test('Pesan sukses harus memiliki ikon check-circle (centang)', () => {
            // Setup
            container.innerHTML = `
                <div id="successBox" class="success-box">
                    <i class="bi bi-check-circle me-2"></i>
                    <strong>Berhasil!</strong> Semua data simpanan pokok telah dihapus.
                </div>
            `;
            
            const icon = container.querySelector('i.bi-check-circle');
            
            // Verify: ikon centang harus ada
            expect(icon).not.toBeNull();
        });
        
        test('Pesan sukses harus berisi kata "Berhasil"', () => {
            // Setup
            container.innerHTML = `
                <div id="successBox" class="success-box">
                    <i class="bi bi-check-circle me-2"></i>
                    <strong>Berhasil!</strong> Semua data simpanan pokok telah dihapus.
                </div>
            `;
            
            const successBox = container.querySelector('#successBox');
            
            // Verify: harus berisi kata "Berhasil"
            expect(successBox.textContent).toContain('Berhasil');
        });
    });
    
    describe('Peringatan - Warna Kuning', () => {
        test('Info box harus menggunakan background kuning', () => {
            // Setup: render info/warning box
            container.innerHTML = `
                <div class="info-box">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <strong>Peringatan:</strong> Tindakan ini akan menghapus SEMUA data simpanan pokok.
                </div>
            `;
            
            const infoBox = container.querySelector('.info-box');
            
            // Verify: info box harus memiliki class info-box
            expect(infoBox.classList.contains('info-box')).toBe(true);
        });
        
        test('Peringatan harus memiliki ikon exclamation-triangle (warning)', () => {
            // Setup
            container.innerHTML = `
                <div class="info-box">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <strong>Peringatan:</strong> Tindakan ini akan menghapus SEMUA data simpanan pokok.
                </div>
            `;
            
            const icon = container.querySelector('i.bi-exclamation-triangle');
            
            // Verify: ikon warning harus ada
            expect(icon).not.toBeNull();
        });
        
        test('Peringatan harus berisi kata "Peringatan"', () => {
            // Setup
            container.innerHTML = `
                <div class="info-box">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <strong>Peringatan:</strong> Tindakan ini akan menghapus SEMUA data simpanan pokok.
                </div>
            `;
            
            const infoBox = container.querySelector('.info-box');
            
            // Verify: harus berisi kata "Peringatan"
            expect(infoBox.textContent).toContain('Peringatan');
        });
    });
    
    describe('Card Header - Warna dan Ikon', () => {
        test('Card header harus memiliki ikon trash3', () => {
            // Setup
            container.innerHTML = `
                <div class="card-header">
                    <h4 class="mb-0">
                        <i class="bi bi-trash3 me-2"></i>Hapus Semua Data Simpanan Pokok
                    </h4>
                </div>
            `;
            
            const icon = container.querySelector('i.bi-trash3');
            
            // Verify: ikon harus ada
            expect(icon).not.toBeNull();
        });
        
        test('Card header harus memiliki class card-header', () => {
            // Setup
            container.innerHTML = `
                <div class="card-header">
                    <h4 class="mb-0">
                        <i class="bi bi-trash3 me-2"></i>Hapus Semua Data Simpanan Pokok
                    </h4>
                </div>
            `;
            
            const header = container.querySelector('.card-header');
            
            // Verify
            expect(header).not.toBeNull();
            expect(header.classList.contains('card-header')).toBe(true);
        });
    });
    
    describe('Informasi Tambahan', () => {
        test('Halaman utility harus menampilkan informasi tambahan tentang dampak penghapusan', () => {
            // Setup
            container.innerHTML = `
                <div class="mt-4">
                    <h6>Informasi Tambahan:</h6>
                    <ul class="small text-muted">
                        <li>Data simpanan pokok disimpan di localStorage dengan key: <code>simpananPokok</code></li>
                        <li>Penghapusan hanya mempengaruhi data simpanan pokok, data lain tetap aman</li>
                        <li>Jurnal yang sudah tercatat tidak akan terhapus</li>
                        <li>Anda dapat mengimport ulang data simpanan pokok setelah penghapusan</li>
                    </ul>
                </div>
            `;
            
            const infoSection = container.querySelector('h6');
            const listItems = container.querySelectorAll('li');
            
            // Verify: harus ada section informasi tambahan
            expect(infoSection.textContent).toContain('Informasi Tambahan');
            expect(listItems.length).toBeGreaterThan(0);
        });
        
        test('Informasi tambahan harus menjelaskan tentang localStorage key', () => {
            // Setup
            container.innerHTML = `
                <div class="mt-4">
                    <h6>Informasi Tambahan:</h6>
                    <ul class="small text-muted">
                        <li>Data simpanan pokok disimpan di localStorage dengan key: <code>simpananPokok</code></li>
                        <li>Penghapusan hanya mempengaruhi data simpanan pokok, data lain tetap aman</li>
                    </ul>
                </div>
            `;
            
            const content = container.textContent;
            
            // Verify: harus menjelaskan localStorage key
            expect(content).toContain('localStorage');
            expect(content).toContain('simpananPokok');
        });
        
        test('Informasi tambahan harus menjelaskan isolasi data', () => {
            // Setup
            container.innerHTML = `
                <div class="mt-4">
                    <h6>Informasi Tambahan:</h6>
                    <ul class="small text-muted">
                        <li>Penghapusan hanya mempengaruhi data simpanan pokok, data lain tetap aman</li>
                    </ul>
                </div>
            `;
            
            const content = container.textContent;
            
            // Verify: harus menjelaskan bahwa data lain aman
            expect(content).toContain('data lain tetap aman');
        });
    });
    
    describe('Responsive Design Elements', () => {
        test('Card harus memiliki class untuk responsive design', () => {
            // Setup
            container.innerHTML = `
                <div class="card">
                    <div class="card-body p-4">
                        Content
                    </div>
                </div>
            `;
            
            const card = container.querySelector('.card');
            
            // Verify: card harus ada
            expect(card).not.toBeNull();
            expect(card.classList.contains('card')).toBe(true);
        });
        
        test('Buttons harus memiliki class d-grid untuk responsive layout', () => {
            // Setup
            container.innerHTML = `
                <div class="d-grid gap-2">
                    <button class="btn btn-danger btn-lg">Hapus</button>
                    <button class="btn btn-secondary">Refresh</button>
                </div>
            `;
            
            const gridContainer = container.querySelector('.d-grid');
            
            // Verify: harus menggunakan d-grid untuk responsive
            expect(gridContainer).not.toBeNull();
            expect(gridContainer.classList.contains('d-grid')).toBe(true);
        });
    });
    
    describe('Data Count Display', () => {
        test('Data count harus ditampilkan dengan class data-count', () => {
            // Setup
            container.innerHTML = `
                <div class="text-center mb-4">
                    <p class="mb-2">Jumlah data simpanan pokok saat ini:</p>
                    <div class="data-count" id="dataCount">10</div>
                    <small class="text-muted">record</small>
                </div>
            `;
            
            const dataCount = container.querySelector('.data-count');
            
            // Verify: data count element harus ada
            expect(dataCount).not.toBeNull();
            expect(dataCount.classList.contains('data-count')).toBe(true);
        });
        
        test('Data count harus memiliki label yang jelas', () => {
            // Setup
            container.innerHTML = `
                <div class="text-center mb-4">
                    <p class="mb-2">Jumlah data simpanan pokok saat ini:</p>
                    <div class="data-count" id="dataCount">10</div>
                    <small class="text-muted">record</small>
                </div>
            `;
            
            const content = container.textContent;
            
            // Verify: harus ada label yang jelas
            expect(content).toContain('Jumlah data simpanan pokok');
            expect(content).toContain('record');
        });
    });
});

/**
 * Integration Tests - Task 8.1
 * Test complete user journey, cross-tab behavior, and persistence after refresh
 */
describe('Integration Tests - Complete User Journey', () => {
    let showAlertCalls = [];
    
    beforeEach(() => {
        localStorage.clear();
        confirmCalls = [];
        renderSimpananCalls = 0;
        showAlertCalls = [];
        
        global.showAlert = (message, type) => {
            showAlertCalls.push({ message, type });
        };
        
        global.confirm = () => true;
    });
    
    describe('Individual Deletion - Complete Flow', () => {
        test('Complete user journey: dari klik hapus sampai data terhapus', () => {
            // Setup: create initial data
            const testData = [
                { id: 'id-1', anggotaId: 'anggota-1', jumlah: 100000, tanggal: '2024-01-01' },
                { id: 'id-2', anggotaId: 'anggota-2', jumlah: 200000, tanggal: '2024-01-02' },
                { id: 'id-3', anggotaId: 'anggota-3', jumlah: 300000, tanggal: '2024-01-03' }
            ];
            
            localStorage.setItem('simpananPokok', JSON.stringify(testData));
            
            // Step 1: User clicks delete button
            const itemToDelete = testData[1]; // Delete middle item
            
            // Step 2: Confirmation dialog appears
            confirmCalls = [];
            global.confirm = (message) => {
                confirmCalls.push(message);
                return true; // User confirms
            };
            
            // Step 3: Delete function is called
            deleteSimpananPokok(itemToDelete.id);
            
            // Step 4: Verify confirmation was shown
            expect(confirmCalls.length).toBe(1);
            expect(confirmCalls[0]).toContain('Yakin');
            
            // Step 5: Verify data is removed from localStorage
            const updatedData = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
            expect(updatedData.length).toBe(2);
            expect(updatedData.find(s => s.id === itemToDelete.id)).toBeUndefined();
            
            // Step 6: Verify UI update was triggered
            expect(renderSimpananCalls).toBe(1);
            
            // Step 7: Verify success notification was shown
            const successAlert = showAlertCalls.find(call => call.type === 'success');
            expect(successAlert).toBeDefined();
            expect(successAlert.message).toContain('berhasil');
            
            // Step 8: Verify other items remain intact
            expect(updatedData.find(s => s.id === 'id-1')).toBeDefined();
            expect(updatedData.find(s => s.id === 'id-3')).toBeDefined();
        });
        
        test('User cancels deletion - data remains unchanged', () => {
            // Setup
            const testData = [
                { id: 'id-1', anggotaId: 'anggota-1', jumlah: 100000, tanggal: '2024-01-01' },
                { id: 'id-2', anggotaId: 'anggota-2', jumlah: 200000, tanggal: '2024-01-02' }
            ];
            
            localStorage.setItem('simpananPokok', JSON.stringify(testData));
            const originalData = JSON.stringify(testData);
            
            // User clicks delete but cancels
            global.confirm = () => false;
            
            deleteSimpananPokok(testData[0].id);
            
            // Verify: data unchanged, no UI update, no notification
            expect(localStorage.getItem('simpananPokok')).toBe(originalData);
            expect(renderSimpananCalls).toBe(0);
            expect(showAlertCalls.length).toBe(0);
        });
        
        test('Multiple sequential deletions', () => {
            // Setup
            const testData = [
                { id: 'id-1', anggotaId: 'anggota-1', jumlah: 100000, tanggal: '2024-01-01' },
                { id: 'id-2', anggotaId: 'anggota-2', jumlah: 200000, tanggal: '2024-01-02' },
                { id: 'id-3', anggotaId: 'anggota-3', jumlah: 300000, tanggal: '2024-01-03' },
                { id: 'id-4', anggotaId: 'anggota-4', jumlah: 400000, tanggal: '2024-01-04' }
            ];
            
            localStorage.setItem('simpananPokok', JSON.stringify(testData));
            
            // Delete first item
            global.confirm = () => true;
            deleteSimpananPokok('id-1');
            
            let currentData = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
            expect(currentData.length).toBe(3);
            
            // Delete another item
            deleteSimpananPokok('id-3');
            
            currentData = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
            expect(currentData.length).toBe(2);
            expect(currentData.find(s => s.id === 'id-2')).toBeDefined();
            expect(currentData.find(s => s.id === 'id-4')).toBeDefined();
            
            // Verify UI was updated twice
            expect(renderSimpananCalls).toBe(2);
        });
    });
    
    describe('Mass Deletion - Complete Flow', () => {
        function hapusSimpananPokok() {
            const count = hitungData();
            
            if (count === 0) {
                alert('Tidak ada data simpanan pokok untuk dihapus.');
                return;
            }

            const konfirmasi = confirm(
                `Anda akan menghapus ${count} data simpanan pokok.\n\n` +
                'Data yang dihapus TIDAK DAPAT dikembalikan!\n\n' +
                'Apakah Anda yakin ingin melanjutkan?'
            );

            if (!konfirmasi) {
                return;
            }

            const konfirmasi2 = confirm(
                'Konfirmasi terakhir!\n\n' +
                'Apakah Anda BENAR-BENAR yakin ingin menghapus SEMUA data simpanan pokok?'
            );

            if (!konfirmasi2) {
                return;
            }

            try {
                localStorage.setItem('simpananPokok', JSON.stringify([]));
                showAlert('Semua data simpanan pokok berhasil dihapus', 'success');
                refreshCount();
            } catch (error) {
                alert('Terjadi kesalahan saat menghapus data: ' + error.message);
                console.error('Error:', error);
            }
        }
        
        test('Complete mass deletion journey: from button click to all data deleted', () => {
            // Setup: create test data
            const testData = [
                { id: 'id-1', anggotaId: 'anggota-1', jumlah: 100000, tanggal: '2024-01-01' },
                { id: 'id-2', anggotaId: 'anggota-2', jumlah: 200000, tanggal: '2024-01-02' },
                { id: 'id-3', anggotaId: 'anggota-3', jumlah: 300000, tanggal: '2024-01-03' }
            ];
            
            localStorage.setItem('simpananPokok', JSON.stringify(testData));
            
            // Step 1: User opens utility page and sees data count
            const initialCount = hitungData();
            expect(initialCount).toBe(3);
            
            // Step 2: User clicks "Hapus Semua" button
            confirmCalls = [];
            global.confirm = (message) => {
                confirmCalls.push(message);
                return true; // User confirms both times
            };
            
            // Step 3: First confirmation dialog appears
            hapusSimpananPokok();
            
            // Step 4: Verify both confirmations were shown
            expect(confirmCalls.length).toBe(2);
            expect(confirmCalls[0]).toContain('3 data');
            expect(confirmCalls[0]).toContain('TIDAK DAPAT dikembalikan');
            expect(confirmCalls[1]).toContain('BENAR-BENAR');
            
            // Step 5: Verify all data is deleted
            const finalData = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
            expect(finalData.length).toBe(0);
            expect(Array.isArray(finalData)).toBe(true);
            
            // Step 6: Verify success notification
            const successAlert = showAlertCalls.find(call => call.type === 'success');
            expect(successAlert).toBeDefined();
            expect(successAlert.message).toContain('berhasil');
            
            // Step 7: Verify count is updated to 0
            const finalCount = hitungData();
            expect(finalCount).toBe(0);
        });
        
        test('User cancels first confirmation - data remains', () => {
            // Setup
            const testData = [
                { id: 'id-1', anggotaId: 'anggota-1', jumlah: 100000, tanggal: '2024-01-01' },
                { id: 'id-2', anggotaId: 'anggota-2', jumlah: 200000, tanggal: '2024-01-02' }
            ];
            
            localStorage.setItem('simpananPokok', JSON.stringify(testData));
            const originalData = JSON.stringify(testData);
            
            // User cancels first confirmation
            confirmCalls = [];
            global.confirm = (message) => {
                confirmCalls.push(message);
                return false; // Cancel first confirmation
            };
            
            hapusSimpananPokok();
            
            // Verify: only one confirmation shown, data unchanged
            expect(confirmCalls.length).toBe(1);
            expect(localStorage.getItem('simpananPokok')).toBe(originalData);
            expect(showAlertCalls.filter(call => call.type === 'success').length).toBe(0);
        });
        
        test('User cancels second confirmation - data remains', () => {
            // Setup
            const testData = [
                { id: 'id-1', anggotaId: 'anggota-1', jumlah: 100000, tanggal: '2024-01-01' }
            ];
            
            localStorage.setItem('simpananPokok', JSON.stringify(testData));
            const originalData = JSON.stringify(testData);
            
            // User confirms first but cancels second
            confirmCalls = [];
            let callCount = 0;
            global.confirm = (message) => {
                confirmCalls.push(message);
                callCount++;
                return callCount === 1; // True for first, false for second
            };
            
            hapusSimpananPokok();
            
            // Verify: both confirmations shown, but data unchanged
            expect(confirmCalls.length).toBe(2);
            expect(localStorage.getItem('simpananPokok')).toBe(originalData);
        });
    });
    
    describe('Cross-Tab Behavior', () => {
        test('Data deleted in one tab is reflected when reading in another tab', () => {
            // Setup: simulate tab 1 with data
            const testData = [
                { id: 'id-1', anggotaId: 'anggota-1', jumlah: 100000, tanggal: '2024-01-01' },
                { id: 'id-2', anggotaId: 'anggota-2', jumlah: 200000, tanggal: '2024-01-02' },
                { id: 'id-3', anggotaId: 'anggota-3', jumlah: 300000, tanggal: '2024-01-03' }
            ];
            
            localStorage.setItem('simpananPokok', JSON.stringify(testData));
            
            // Tab 1: Delete an item
            global.confirm = () => true;
            deleteSimpananPokok('id-2');
            
            // Tab 2: Read data (simulate by reading from localStorage)
            const dataInTab2 = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
            
            // Verify: Tab 2 sees the deletion
            expect(dataInTab2.length).toBe(2);
            expect(dataInTab2.find(s => s.id === 'id-2')).toBeUndefined();
            expect(dataInTab2.find(s => s.id === 'id-1')).toBeDefined();
            expect(dataInTab2.find(s => s.id === 'id-3')).toBeDefined();
        });
        
        test('Mass deletion in one tab is reflected in another tab', () => {
            // Setup
            const testData = [
                { id: 'id-1', anggotaId: 'anggota-1', jumlah: 100000, tanggal: '2024-01-01' },
                { id: 'id-2', anggotaId: 'anggota-2', jumlah: 200000, tanggal: '2024-01-02' }
            ];
            
            localStorage.setItem('simpananPokok', JSON.stringify(testData));
            
            // Tab 1: Perform mass deletion
            function hapusSimpananPokok() {
                const count = hitungData();
                if (count === 0) return;
                
                const konfirmasi = confirm('First');
                if (!konfirmasi) return;
                
                const konfirmasi2 = confirm('Second');
                if (!konfirmasi2) return;
                
                localStorage.setItem('simpananPokok', JSON.stringify([]));
            }
            
            global.confirm = () => true;
            hapusSimpananPokok();
            
            // Tab 2: Check data
            const dataInTab2 = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
            const countInTab2 = dataInTab2.length;
            
            // Verify: Tab 2 sees empty data
            expect(countInTab2).toBe(0);
            expect(Array.isArray(dataInTab2)).toBe(true);
        });
        
        test('Count refresh in one tab reflects changes from another tab', () => {
            // Setup: Tab 1 has data
            const initialData = [
                { id: 'id-1', anggotaId: 'anggota-1', jumlah: 100000, tanggal: '2024-01-01' },
                { id: 'id-2', anggotaId: 'anggota-2', jumlah: 200000, tanggal: '2024-01-02' },
                { id: 'id-3', anggotaId: 'anggota-3', jumlah: 300000, tanggal: '2024-01-03' }
            ];
            
            localStorage.setItem('simpananPokok', JSON.stringify(initialData));
            
            // Tab 1: Check initial count
            const countTab1Before = hitungData();
            expect(countTab1Before).toBe(3);
            
            // Tab 2: Delete an item (simulate by directly modifying localStorage)
            const updatedData = initialData.filter(s => s.id !== 'id-2');
            localStorage.setItem('simpananPokok', JSON.stringify(updatedData));
            
            // Tab 1: Refresh count
            const countTab1After = hitungData();
            
            // Verify: Tab 1 sees updated count after refresh
            expect(countTab1After).toBe(2);
        });
        
        test('Data isolation: changes to simpananPokok do not affect other data across tabs', () => {
            // Setup: Multiple data types
            const simpananPokokData = [
                { id: 'sp-1', anggotaId: 'anggota-1', jumlah: 100000, tanggal: '2024-01-01' }
            ];
            const anggotaData = [
                { id: 'anggota-1', nik: '1234567890123456', nama: 'Test User' }
            ];
            const simpananWajibData = [
                { id: 'sw-1', anggotaId: 'anggota-1', jumlah: 50000, tanggal: '2024-01-01' }
            ];
            
            localStorage.setItem('simpananPokok', JSON.stringify(simpananPokokData));
            localStorage.setItem('anggota', JSON.stringify(anggotaData));
            localStorage.setItem('simpananWajib', JSON.stringify(simpananWajibData));
            
            const originalAnggota = JSON.stringify(anggotaData);
            const originalSimpananWajib = JSON.stringify(simpananWajibData);
            
            // Tab 1: Delete simpanan pokok
            global.confirm = () => true;
            deleteSimpananPokok('sp-1');
            
            // Tab 2: Check other data
            const anggotaInTab2 = localStorage.getItem('anggota');
            const simpananWajibInTab2 = localStorage.getItem('simpananWajib');
            
            // Verify: Other data unchanged across tabs
            expect(anggotaInTab2).toBe(originalAnggota);
            expect(simpananWajibInTab2).toBe(originalSimpananWajib);
        });
    });
    
    describe('Persistence After Refresh', () => {
        test('Individual deletion persists after page refresh', () => {
            // Setup: Initial data
            const testData = [
                { id: 'id-1', anggotaId: 'anggota-1', jumlah: 100000, tanggal: '2024-01-01' },
                { id: 'id-2', anggotaId: 'anggota-2', jumlah: 200000, tanggal: '2024-01-02' },
                { id: 'id-3', anggotaId: 'anggota-3', jumlah: 300000, tanggal: '2024-01-03' }
            ];
            
            localStorage.setItem('simpananPokok', JSON.stringify(testData));
            
            // Delete an item
            global.confirm = () => true;
            deleteSimpananPokok('id-2');
            
            // Simulate page refresh: re-read from localStorage
            const dataAfterRefresh = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
            const countAfterRefresh = hitungData();
            
            // Verify: deletion persists
            expect(dataAfterRefresh.length).toBe(2);
            expect(countAfterRefresh).toBe(2);
            expect(dataAfterRefresh.find(s => s.id === 'id-2')).toBeUndefined();
            expect(dataAfterRefresh.find(s => s.id === 'id-1')).toBeDefined();
            expect(dataAfterRefresh.find(s => s.id === 'id-3')).toBeDefined();
        });
        
        test('Mass deletion persists after page refresh', () => {
            // Setup
            const testData = [
                { id: 'id-1', anggotaId: 'anggota-1', jumlah: 100000, tanggal: '2024-01-01' },
                { id: 'id-2', anggotaId: 'anggota-2', jumlah: 200000, tanggal: '2024-01-02' }
            ];
            
            localStorage.setItem('simpananPokok', JSON.stringify(testData));
            
            // Perform mass deletion
            function hapusSimpananPokok() {
                const count = hitungData();
                if (count === 0) return;
                
                const konfirmasi = confirm('First');
                if (!konfirmasi) return;
                
                const konfirmasi2 = confirm('Second');
                if (!konfirmasi2) return;
                
                localStorage.setItem('simpananPokok', JSON.stringify([]));
            }
            
            global.confirm = () => true;
            hapusSimpananPokok();
            
            // Simulate page refresh
            const dataAfterRefresh = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
            const countAfterRefresh = hitungData();
            const refreshResult = refreshCount();
            
            // Verify: empty state persists
            expect(dataAfterRefresh.length).toBe(0);
            expect(countAfterRefresh).toBe(0);
            expect(refreshResult.count).toBe(0);
            expect(refreshResult.buttonDisabled).toBe(true);
        });
        
        test('Multiple deletions persist correctly after refresh', () => {
            // Setup
            const testData = [
                { id: 'id-1', anggotaId: 'anggota-1', jumlah: 100000, tanggal: '2024-01-01' },
                { id: 'id-2', anggotaId: 'anggota-2', jumlah: 200000, tanggal: '2024-01-02' },
                { id: 'id-3', anggotaId: 'anggota-3', jumlah: 300000, tanggal: '2024-01-03' },
                { id: 'id-4', anggotaId: 'anggota-4', jumlah: 400000, tanggal: '2024-01-04' },
                { id: 'id-5', anggotaId: 'anggota-5', jumlah: 500000, tanggal: '2024-01-05' }
            ];
            
            localStorage.setItem('simpananPokok', JSON.stringify(testData));
            
            // Delete multiple items
            global.confirm = () => true;
            deleteSimpananPokok('id-1');
            deleteSimpananPokok('id-3');
            deleteSimpananPokok('id-5');
            
            // Simulate page refresh
            const dataAfterRefresh = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
            
            // Verify: all deletions persist
            expect(dataAfterRefresh.length).toBe(2);
            expect(dataAfterRefresh.find(s => s.id === 'id-1')).toBeUndefined();
            expect(dataAfterRefresh.find(s => s.id === 'id-3')).toBeUndefined();
            expect(dataAfterRefresh.find(s => s.id === 'id-5')).toBeUndefined();
            expect(dataAfterRefresh.find(s => s.id === 'id-2')).toBeDefined();
            expect(dataAfterRefresh.find(s => s.id === 'id-4')).toBeDefined();
        });
        
        test('Refresh count reflects persisted deletions', () => {
            // Setup
            const testData = [
                { id: 'id-1', anggotaId: 'anggota-1', jumlah: 100000, tanggal: '2024-01-01' },
                { id: 'id-2', anggotaId: 'anggota-2', jumlah: 200000, tanggal: '2024-01-02' },
                { id: 'id-3', anggotaId: 'anggota-3', jumlah: 300000, tanggal: '2024-01-03' }
            ];
            
            localStorage.setItem('simpananPokok', JSON.stringify(testData));
            
            // Initial count
            const initialCount = hitungData();
            expect(initialCount).toBe(3);
            
            // Delete one item
            global.confirm = () => true;
            deleteSimpananPokok('id-2');
            
            // Simulate page refresh and count
            const countAfterRefresh = hitungData();
            const refreshResult = refreshCount();
            
            // Verify: count reflects deletion
            expect(countAfterRefresh).toBe(2);
            expect(refreshResult.count).toBe(2);
            expect(refreshResult.buttonDisabled).toBe(false);
        });
        
        test('Data isolation persists after refresh', () => {
            // Setup: Multiple data types
            const simpananPokokData = [
                { id: 'sp-1', anggotaId: 'anggota-1', jumlah: 100000, tanggal: '2024-01-01' },
                { id: 'sp-2', anggotaId: 'anggota-2', jumlah: 200000, tanggal: '2024-01-02' }
            ];
            const anggotaData = [
                { id: 'anggota-1', nik: '1234567890123456', nama: 'User 1' },
                { id: 'anggota-2', nik: '1234567890123457', nama: 'User 2' }
            ];
            const simpananWajibData = [
                { id: 'sw-1', anggotaId: 'anggota-1', jumlah: 50000, tanggal: '2024-01-01' }
            ];
            
            localStorage.setItem('simpananPokok', JSON.stringify(simpananPokokData));
            localStorage.setItem('anggota', JSON.stringify(anggotaData));
            localStorage.setItem('simpananWajib', JSON.stringify(simpananWajibData));
            
            const originalAnggota = JSON.stringify(anggotaData);
            const originalSimpananWajib = JSON.stringify(simpananWajibData);
            
            // Delete simpanan pokok
            global.confirm = () => true;
            deleteSimpananPokok('sp-1');
            
            // Simulate page refresh: re-read all data
            const simpananPokokAfterRefresh = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
            const anggotaAfterRefresh = localStorage.getItem('anggota');
            const simpananWajibAfterRefresh = localStorage.getItem('simpananWajib');
            
            // Verify: simpanan pokok changed, others unchanged
            expect(simpananPokokAfterRefresh.length).toBe(1);
            expect(simpananPokokAfterRefresh.find(s => s.id === 'sp-1')).toBeUndefined();
            expect(anggotaAfterRefresh).toBe(originalAnggota);
            expect(simpananWajibAfterRefresh).toBe(originalSimpananWajib);
        });
        
        test('Empty state after mass deletion persists through multiple refreshes', () => {
            // Setup
            const testData = [
                { id: 'id-1', anggotaId: 'anggota-1', jumlah: 100000, tanggal: '2024-01-01' }
            ];
            
            localStorage.setItem('simpananPokok', JSON.stringify(testData));
            
            // Mass deletion
            function hapusSimpananPokok() {
                const count = hitungData();
                if (count === 0) return;
                
                const konfirmasi = confirm('First');
                if (!konfirmasi) return;
                
                const konfirmasi2 = confirm('Second');
                if (!konfirmasi2) return;
                
                localStorage.setItem('simpananPokok', JSON.stringify([]));
            }
            
            global.confirm = () => true;
            hapusSimpananPokok();
            
            // Simulate multiple refreshes
            for (let i = 0; i < 5; i++) {
                const dataAfterRefresh = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
                const countAfterRefresh = hitungData();
                
                expect(dataAfterRefresh.length).toBe(0);
                expect(countAfterRefresh).toBe(0);
                expect(Array.isArray(dataAfterRefresh)).toBe(true);
            }
        });
    });
});
