# Implementation Plan

- [x] 1. Setup struktur file dan repository classes





  - Buat file `js/hapusTransaksi.js` untuk semua fungsi terkait hapus transaksi
  - Implementasi `TransactionRepository` class dengan method `getAll()`, `getById()`, `delete()`, dan `filter()`
  - Implementasi `StockRepository` class dengan method `getAll()` dan `addStock()`
  - Implementasi `JournalRepository` class dengan method `add()` dan `updateCOASaldo()`
  - Implementasi `DeletionLogRepository` class dengan method `save()`, `getAll()`, dan `getByTransactionId()`
  - _Requirements: 1.1, 2.2, 3.1, 4.1, 5.1_

- [x] 1.1 Write property test for repository filter operations






  - **Property 1: Search filtering correctness**
  - **Property 2: Payment method filtering correctness**
  - **Property 3: Date range filtering correctness**
  - **Validates: Requirements 1.2, 1.3, 1.4**

- [x] 2. Implementasi validation services





  - Buat `ValidationService` class dengan method `validateDeletion()` untuk cek apakah transaksi bisa dihapus
  - Implementasi validasi closed shift - cek apakah transaksi sudah masuk dalam shift yang sudah ditutup
  - Implementasi method `validateReason()` untuk validasi alasan penghapusan (tidak kosong, max 500 karakter)
  - _Requirements: 6.1, 6.2, 6.4, 7.1, 7.2_

- [x] 2.1 Write property test for validation logic






  - **Property 18: Reason input requirement**
  - **Property 20: Closed shift validation**
  - **Validates: Requirements 6.1, 7.1**

- [x] 3. Implementasi business logic services





- [x] 3.1 Implementasi StockRestorationService


  - Buat `StockRestorationService` class dengan method `restoreStock(items)`
  - Loop setiap item dalam transaksi dan kembalikan stok menggunakan `StockRepository.addStock()`
  - Handle kasus barang tidak ditemukan dengan mencatat warning
  - Return hasil dengan status success dan array warnings
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 3.2 Write property test for stock restoration






  - **Property 9: Stock restoration for all items**
  - **Validates: Requirements 3.1, 3.2**

- [x] 3.3 Implementasi JournalReversalService


  - Buat `JournalReversalService` class dengan method `createReversalJournals(transaction)`
  - Hitung total HPP dari semua items dalam transaksi
  - Buat jurnal pembalik pendapatan (berbeda untuk cash vs kredit)
  - Buat jurnal pembalik HPP
  - Gunakan tanggal penghapusan (current date) untuk jurnal
  - Include nomor transaksi dalam deskripsi jurnal
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 3.4 Write property test for journal reversal






  - **Property 10: Cash transaction journal reversal**
  - **Property 11: Credit transaction journal reversal**
  - **Property 12: HPP journal reversal**
  - **Property 13: Reversal journal description format**
  - **Property 14: Reversal journal date**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

- [x] 3.5 Implementasi AuditLoggerService


  - Buat `AuditLoggerService` class dengan method `logDeletion(transaction, reason, deletedBy)`
  - Simpan complete transaction data, reason, user, dan timestamp ke deletion log
  - Implementasi method `getDeletionHistory()` untuk ambil semua log
  - _Requirements: 5.1, 5.2_

- [x] 3.6 Write property test for audit logging






  - **Property 15: Deletion log creation**
  - **Property 19: Reason storage in log**
  - **Validates: Requirements 5.1, 6.3**

- [x] 3.7 Implementasi TransactionDeletionService


  - Buat `TransactionDeletionService` class dengan method `deleteTransaction(transactionId, reason, deletedBy)`
  - Validasi transaksi menggunakan `ValidationService`
  - Ambil data transaksi lengkap dari `TransactionRepository`
  - Kembalikan stok menggunakan `StockRestorationService`
  - Buat jurnal reversal menggunakan `JournalReversalService`
  - Hapus transaksi dari localStorage menggunakan `TransactionRepository.delete()`
  - Catat log audit menggunakan `AuditLoggerService`
  - Return hasil dengan status success/error dan message
  - _Requirements: 2.2, 3.1, 4.1, 5.1_

- [x] 3.8 Write property test for complete deletion flow






  - **Property 5: Transaction deletion removes from storage**
  - **Property 7: Cancellation preserves data**
  - **Validates: Requirements 2.2, 2.4**

- [x] 4. Checkpoint - Pastikan semua tests passing




  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implementasi UI components





- [x] 5.1 Implementasi halaman utama hapus transaksi


  - Buat function `renderHapusTransaksi()` yang menampilkan halaman dengan header, filter panel, dan tabel transaksi
  - Tambahkan menu item "Hapus Transaksi" di sidebar (hanya untuk admin dan kasir)
  - Wire up navigation ke halaman hapus transaksi
  - _Requirements: 1.1_

- [x] 5.2 Implementasi filter panel


  - Buat function `renderFilterPanel()` dengan input search, dropdown metode pembayaran, dan date range picker
  - Implementasi event handlers untuk update filter state
  - Implementasi function `applyFilters()` yang memanggil `TransactionRepository.filter()`
  - Tambahkan tombol reset filter
  - _Requirements: 1.2, 1.3, 1.4_

- [x] 5.3 Implementasi transaction table


  - Buat function `renderTransactionTable(transactions)` yang menampilkan tabel dengan kolom: No Transaksi, Tanggal, Kasir, Anggota/Umum, Total, Metode, Status, Aksi
  - Tambahkan tombol "Hapus" di kolom Aksi untuk setiap row
  - Handle kasus daftar kosong dengan pesan "Tidak ada transaksi"
  - Format tanggal dan rupiah dengan proper formatting
  - _Requirements: 1.1, 1.5_

- [x] 5.4 Implementasi confirmation dialog


  - Buat function `showDeleteConfirmation(transaction)` yang menampilkan Bootstrap modal
  - Tampilkan detail lengkap transaksi: nomor, tanggal, kasir, items, total, metode
  - Tambahkan textarea untuk input alasan penghapusan (required)
  - Tambahkan character counter untuk alasan (max 500)
  - Implementasi tombol "Konfirmasi" dan "Batal"
  - _Requirements: 2.1, 6.1_

- [x] 5.5 Wire up deletion flow


  - Implementasi function `handleDeleteTransaction(transactionId)` yang dipanggil saat tombol Hapus diklik
  - Panggil `ValidationService.validateDeletion()` untuk cek apakah bisa dihapus
  - Jika valid, tampilkan confirmation dialog
  - Saat konfirmasi, validasi alasan dengan `ValidationService.validateReason()`
  - Panggil `TransactionDeletionService.deleteTransaction()` dengan transaction ID, reason, dan current user
  - Tampilkan success notification atau error message
  - Refresh transaction list setelah deletion
  - _Requirements: 2.2, 2.3, 2.5, 6.2, 6.4, 7.2_

- [x] 5.6 Implementasi cancellation handling


  - Implementasi function `handleCancelDeletion()` yang menutup dialog tanpa mengubah data
  - Pastikan tidak ada perubahan data saat cancel
  - _Requirements: 2.4_

- [x] 5.7 Write unit tests for UI components





  - Test filter panel updates transaction list correctly
  - Test confirmation dialog displays all transaction details
  - Test success/error notifications appear correctly
  - Test cancellation preserves data
  - _Requirements: 1.2, 1.3, 1.4, 2.1, 2.3, 2.4, 2.5_

- [x] 6. Implementasi halaman riwayat penghapusan






- [x] 6.1 Implementasi halaman riwayat

  - Buat function `renderRiwayatHapusTransaksi()` yang menampilkan daftar deletion logs
  - Tampilkan tabel dengan kolom: No Transaksi, Tanggal Transaksi, Tanggal Penghapusan, User, Alasan
  - Tambahkan tombol "Detail" untuk setiap row
  - Tambahkan menu item "Riwayat Hapus Transaksi" di sidebar
  - _Requirements: 5.3, 5.4_

- [x] 6.2 Implementasi detail deletion log

  - Buat function `showDeletionDetail(logId)` yang menampilkan modal dengan detail lengkap
  - Tampilkan complete transaction data yang telah dihapus
  - Tampilkan informasi penghapusan: user, waktu, alasan
  - Tampilkan warnings jika ada (e.g., barang tidak ditemukan)
  - _Requirements: 5.5_

- [x] 6.3 Write property test for deletion history display






  - **Property 16: Deletion history display format**
  - **Property 17: Deletion detail completeness**
  - **Validates: Requirements 5.4, 5.5**

- [x] 7. Testing dan refinement




- [x] 7.1 Write integration tests






  - Test complete deletion flow end-to-end
  - Test closed shift prevention
  - Test error scenarios (missing items, invalid transaction ID, empty reason)
  - _Requirements: All_

- [x] 7.2 Manual testing dan bug fixes

  - Test dengan berbagai skenario transaksi (cash, kredit, dengan/tanpa anggota)
  - Test filter dan pencarian dengan berbagai input
  - Test validation errors (empty reason, too long reason, closed shift)
  - Test stock restoration dengan barang yang ada dan tidak ada
  - Test journal reversal untuk cash dan kredit
  - Fix any bugs yang ditemukan
  - _Requirements: All_

- [x] 8. Final checkpoint - Pastikan semua tests passing





  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Documentation dan cleanup








  - Tambahkan JSDoc comments untuk semua functions dan classes
  - Buat file README atau panduan penggunaan fitur hapus transaksi
  - Review dan cleanup code untuk readability
  - _Requirements: All_
