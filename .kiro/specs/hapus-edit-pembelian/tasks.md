# Implementation Plan

- [x] 1. Implementasi fungsi edit pembelian





  - [x] 1.1 Buat fungsi `editPembelian(id)` untuk load data transaksi ke form


    - Retrieve transaksi dari LocalStorage berdasarkan id
    - Populate form fields (noFaktur, tanggal, supplier)
    - Load items ke array `itemsPembelian`
    - Set flag `isEditMode = true` dan `editingTransactionId = id`
    - Show modal pembelian
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Buat fungsi `savePembelianEdit(id)` untuk menyimpan perubahan


    - Validate minimal 1 item dalam daftar
    - Get data transaksi lama dari LocalStorage
    - Calculate perubahan untuk setiap item (old vs new)
    - Update transaksi di LocalStorage
    - _Requirements: 1.3_

  - [x] 1.3 Implementasi logika adjustment stok pada edit


    - Buat fungsi `adjustStockForEdit(oldItems, newItems)`
    - Compare items by barangId
    - Calculate qty difference: `newStok = currentStok - oldQty + newQty`
    - Handle item yang dihapus (reduce stock)
    - Handle item baru (increase stock)
    - Update barang array di LocalStorage
    - _Requirements: 1.4, 4.5_

  - [x] 1.4 Implementasi recalculate HPP pada edit


    - Buat fungsi `recalculateHPPOnEdit(barangId, oldQty, oldHarga, newQty, newHarga)`
    - Remove old purchase impact dari HPP
    - Add new purchase impact
    - Calculate weighted average: `newHPP = totalValue / newStok`
    - Update HPP barang di LocalStorage
    - _Requirements: 1.5_

  - [x] 1.5 Tambahkan tombol edit pada tabel daftar pembelian


    - Tambah kolom "Aksi" di tabel jika belum ada
    - Tambahkan button edit dengan icon dan onclick handler
    - Style button sesuai dengan design existing
    - _Requirements: 1.1_

- [x] 2. Implementasi fungsi hapus pembelian





  - [x] 2.1 Buat fungsi `deletePembelian(id)` dengan konfirmasi


    - Show confirmation dialog menggunakan SweetAlert2 atau confirm()
    - Jika cancelled, return tanpa action
    - Jika confirmed, lanjut ke proses delete
    - _Requirements: 2.1, 2.5_

  - [x] 2.2 Implementasi logika pengurangan stok pada delete


    - Buat fungsi `adjustStockForDelete(items)`
    - For each item: `newStok = currentStok - item.qty`
    - Show warning jika stok menjadi negatif
    - Update barang array di LocalStorage
    - _Requirements: 2.2_

  - [x] 2.3 Implementasi penghapusan transaksi dari storage


    - Remove transaksi dari array pembelian
    - Save updated array ke LocalStorage
    - _Requirements: 2.3_

  - [x] 2.4 Tambahkan tombol hapus pada tabel daftar pembelian


    - Tambahkan button delete dengan icon dan onclick handler
    - Style button dengan warna danger
    - _Requirements: 2.1_

- [x] 3. Implementasi jurnal akuntansi untuk edit dan hapus





  - [x] 3.1 Buat fungsi `createJurnalKoreksi(oldTotal, newTotal, tanggal, description)`


    - Calculate selisih = newTotal - oldTotal
    - If selisih > 0: Debit Persediaan (1-1300), Kredit Kas (1-1000)
    - If selisih < 0: Debit Kas (1-1000), Kredit Persediaan (1-1300)
    - Validate total debit = total kredit
    - Save jurnal ke LocalStorage
    - _Requirements: 3.1, 3.3, 3.4_

  - [x] 3.2 Buat fungsi `createJurnalPembalik(total, tanggal, description)`

    - Create reversing entry: Debit Kas (1-1000), Kredit Persediaan (1-1300)
    - Validate total debit = total kredit
    - Save jurnal ke LocalStorage
    - _Requirements: 3.2, 3.3, 3.4_

  - [x] 3.3 Integrasikan jurnal koreksi ke `savePembelianEdit()`


    - Call `createJurnalKoreksi()` jika ada perubahan total
    - Handle error jika jurnal creation failed
    - _Requirements: 3.1_

  - [x] 3.4 Integrasikan jurnal pembalik ke `deletePembelian()`


    - Call `createJurnalPembalik()` setelah delete confirmed
    - Handle error jika jurnal creation failed
    - _Requirements: 3.2_

- [x] 4. Implementasi manajemen items dalam edit mode





  - [x] 4.1 Tampilkan daftar items existing dengan tombol hapus


    - Render items dengan button delete untuk setiap row
    - Implement `removeItemFromEdit(index)` function
    - Update total setelah item dihapus
    - _Requirements: 4.1, 4.2_

  - [x] 4.2 Support penambahan item baru dalam edit mode


    - Pastikan fungsi `tambahItemPembelian()` bekerja di edit mode
    - Update total setelah item ditambah
    - _Requirements: 4.3_

  - [x] 4.3 Implementasi auto-update subtotal dan total


    - Update subtotal saat qty atau harga berubah
    - Recalculate total pembelian dari sum of subtotals
    - _Requirements: 4.4_

- [x] 5. Implementasi notifikasi dan feedback







  - [x] 5.1 Tambahkan notifikasi sukses untuk operasi berhasil


    - Show success notification setelah edit berhasil
    - Show success notification setelah delete berhasil
    - Gunakan SweetAlert2 atau toast notification
    - _Requirements: 2.4, 5.1_

  - [x] 5.2 Tambahkan notifikasi error untuk operasi gagal



    - Catch dan display error dari stock adjustment
    - Catch dan display error dari journal creation
    - Catch dan display error dari LocalStorage operations
    - _Requirements: 5.2_

  - [x] 5.3 Implementasi validasi dengan pesan yang jelas





    - Validate empty items list dengan pesan "Tambahkan minimal 1 item pembelian"
    - Validate negative qty/harga
    - Validate required fields (noFaktur, tanggal)
    - _Requirements: 5.3_

  - [x] 5.4 Implementasi UI refresh setelah operasi


    - Close modal setelah save/cancel
    - Re-render daftar pembelian dengan data terbaru
    - Reset form dan flags (isEditMode, editingTransactionId)
    - _Requirements: 5.4, 5.5_

- [x] 6. Testing dan validasi



  - [x] 6.1 Write unit tests untuk stock adjustment functions


    - Test `adjustStockForEdit()` dengan berbagai skenario
    - Test `adjustStockForDelete()` dengan multiple items
    - Test edge cases: item removed, item added, qty changed
    - _Requirements: 1.4, 2.2, 4.5_

  - [x] 6.2 Write unit tests untuk HPP calculation

    - Test `recalculateHPPOnEdit()` dengan berbagai skenario
    - Test weighted average formula accuracy
    - Test edge cases: zero stock, first purchase
    - _Requirements: 1.5_

  - [x] 6.3 Write unit tests untuk validation functions

    - Test empty items validation
    - Test negative qty/harga validation
    - Test required fields validation
    - _Requirements: 1.3, 5.3_

  - [x] 6.4 Write unit tests untuk journal entry functions

    - Test `createJurnalKoreksi()` dengan positive dan negative differences
    - Test `createJurnalPembalik()` dengan berbagai totals
    - Test journal balance validation
    - _Requirements: 3.1, 3.2, 3.4_

  - [x] 6.5 Write property test untuk stock adjustment consistency

    - **Property 3: Stock adjustment on edit**
    - **Validates: Requirements 1.4, 4.5**
    - Generate random transactions dengan random edits
    - Verify stock changes match qty differences

  - [x] 6.6 Write property test untuk HPP weighted average

    - **Property 4: HPP weighted average calculation**
    - **Validates: Requirements 1.5**
    - Generate random purchase scenarios
    - Verify HPP calculation menggunakan weighted average formula

  - [x] 6.7 Write property test untuk journal balance

    - **Property 11: Journal balance**
    - **Validates: Requirements 3.4**
    - Generate random edit/delete operations
    - Verify all journals have total debit = total kredit

  - [x] 6.8 Write property test untuk total calculations

    - **Property 12-14: Item removal/addition updates total**
    - **Validates: Requirements 4.2, 4.3, 4.4**
    - Generate random item modifications
    - Verify totals are always sum of subtotals

  - [x] 6.9 Write integration tests untuk complete flows

    - Test complete edit flow: load → modify → save → verify
    - Test complete delete flow: select → confirm → verify
    - Test cancel operations preserve state
    - Test UI updates after operations
    - _Requirements: All_

- [x] 7. Checkpoint - Pastikan semua tests passing



  - Ensure all tests pass, ask the user if questions arise.
