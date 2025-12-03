# Implementation Plan

- [x] 1. Setup security layer dan repository extensions








  - Buat file `js/hapusTransaksiTutupKasir.js` untuk semua fungsi terkait fitur ini
  - Implementasi `RoleValidator` class dengan method `isSuperAdmin()`
  - Implementasi `PasswordVerificationService` class dengan method `verifyPassword()`, `isBlocked()`, `resetFailedAttempts()`
  - Implementasi `RateLimiterService` class dengan method `checkRateLimit()`, `recordDeletion()`
  - Setup localStorage keys baru: `closedShiftDeletionLog`, `passwordVerificationTracking`, `rateLimitTracking`
  - _Requirements: 2.1, 2.2, 2.5, 10.1_

- [x] 1.1 Write property test for security components




  - **Property 1: Super admin role requirement**
  - **Property 2: Password verification requirement**
  - **Property 3: Failed password attempt blocking**
  - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

- [x] 2. Implementasi tutup kasir adjustment service





  - Buat `TutupKasirAdjustmentService` class dengan method `adjustTutupKasir(transaction, shiftId)`
  - Implementasi method `identifyShift(transaction)` untuk mencari shift terkait
  - Implementasi logic untuk kurangi total penjualan, kas/piutang dari laporan tutup kasir
  - Implementasi logic untuk tambahkan catatan adjustment dengan referensi transaksi
  - Simpan snapshot before/after untuk audit
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 2.1 Write property test for tutup kasir adjustment


  - **Property 5: Tutup kasir adjustment correctness**
  - **Property 6: Adjustment note creation**
  - **Validates: Requirements 4.2, 4.3, 4.4, 4.5**

- [x] 3. Implementasi critical audit logger service





  - Buat `CriticalAuditLoggerService` class dengan method `logCriticalDeletion(data)`
  - Implementasi generate unique audit ID dengan format "AUDIT-CLOSED-YYYYMMDD-NNNN"
  - Implementasi collect system info (user agent, timestamp)
  - Implementasi save comprehensive log entry dengan level CRITICAL
  - Implementasi method `getCriticalHistory()` untuk ambil semua critical logs
  - Implementasi method `exportToPDF(auditId)` untuk format data export
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.5_

- [x] 3.1 Write property test for critical audit logging


  - **Property 12: Critical audit log creation**
  - **Property 13: Audit log completeness**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6**

- [x] 4. Implementasi data integrity validator




  - Buat `DataIntegrityValidator` class dengan method `preDeleteValidation(transactionId)`
  - Implementasi validasi: transaksi exists, shift exists, referential integrity
  - Implementasi method `postDeleteValidation(context)` untuk validasi setelah deletion
  - Implementasi validasi: transaksi terhapus, stok dikembalikan, jurnal dibuat, tutup kasir di-adjust, audit log tersimpan
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 4.1 Write property test for data integrity validation



  - **Property 18: Pre-deletion validation**
  - **Property 19: Post-deletion validation with rollback**
  - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

- [x] 5. Implementasi closed shift deletion service








  - Buat `ClosedShiftDeletionService` class dengan method `deleteClosedTransaction(transactionId, deletionData)`
  - Implementasi flow lengkap: validate role, verify password, check rate limit
  - Implementasi pre-deletion validation
  - Reuse existing `TransactionDeletionService` untuk delete transaksi
  - Call `TutupKasirAdjustmentService` untuk adjust laporan
  - Modify `JournalReversalService` untuk tambahkan tag "CLOSED_SHIFT_REVERSAL"
  - Call `CriticalAuditLoggerService` untuk log audit
  - Implementasi post-deletion validation dengan rollback jika gagal
  - Return hasil dengan audit ID
  - _Requirements: 2.2, 4.1, 5.1, 6.1, 9.1, 9.3_

- [x] 5.1 Write property test for journal reversal with special tag



  - **Property 7: Reversal journal with special tag**
  - **Property 8: Reversal journal date correctness**
  - **Property 9: Cash transaction reversal for closed shift**
  - **Property 10: Credit transaction reversal for closed shift**
  - **Property 11: HPP reversal for closed shift**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

- [x] 5.2 Write property test for rate limiting

  - **Property 20: Rate limit warning at 5 deletions**
  - **Property 21: Rate limit blocking at 10 deletions**
  - **Validates: Requirements 10.2, 10.3, 10.4**

- [x] 6. Checkpoint - Pastikan semua tests passing




  - Ensure all tests pass, ask the user if questions arise.


- [x] 7. Implementasi UI components untuk closed shift indication






- [x] 7.1 Implementasi closed shift indicator

  - Buat function `renderClosedShiftIndicator(transaction)` untuk tampilkan badge "Shift Tertutup"
  - Modifikasi existing transaction table untuk tampilkan indicator
  - Tambahkan filter khusus untuk transaksi tertutup
  - Tampilkan info shift (tanggal tutup, kasir, nomor laporan) di detail transaksi
  - _Requirements: 1.1, 1.2, 1.3, 1.4_


- [x] 7.2 Implementasi warning dialog

  - Buat function `showClosedShiftWarning(transaction, shiftData)` untuk tampilkan warning
  - Tampilkan daftar dampak: laporan tutup kasir, jurnal, stok, laporan keuangan
  - Tambahkan checkbox "Saya memahami konsekuensi dari tindakan ini"
  - Disable tombol konfirmasi sampai checkbox dicentang
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_


- [x] 7.3 Write property test for warning dialog

  - **Property 17: Warning dialog requirement**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

- [x] 8. Implementasi password confirmation dialog





  - Buat function `showPasswordConfirmation(callback)` untuk tampilkan modal password
  - Implementasi input password dengan type password
  - Tampilkan peringatan failed attempts dan remaining attempts
  - Tampilkan countdown jika account diblokir
  - Call `PasswordVerificationService.verifyPassword()` saat konfirmasi
  - Handle failed attempts dan blocking
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [x] 9. Implementasi category and reason dialog





  - Buat function `showCategoryReasonDialog(transaction)` untuk tampilkan modal
  - Implementasi dropdown kategori: Kesalahan Input, Transaksi Duplikat, Fraud, Koreksi Akuntansi, Lainnya
  - Implementasi textarea alasan dengan min 20, max 1000 karakter
  - Tambahkan character counter real-time
  - Tampilkan ringkasan transaksi yang akan dihapus
  - Validasi input sebelum allow konfirmasi
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 9.1 Write property test for category and reason validation


  - **Property 4: Category and reason requirement**
  - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 10. Wire up complete deletion flow untuk closed transactions











  - Modifikasi function `handleDeleteTransaction()` untuk detect closed transactions
  - Jika closed transaction, panggil flow khusus:
    1. Check role dengan `RoleValidator.isSuperAdmin()`
    2. Show warning dialog dengan checkbox
    3. Show password confirmation dialog
    4. Show category/reason dialog
    5. Check rate limit dengan `RateLimiterService.checkRateLimit()`
    6. Call `ClosedShiftDeletionService.deleteClosedTransaction()`
    7. Handle rollback jika terjadi error
    8. Show success notification dengan audit ID
    9. Refresh transaction list
  - _Requirements: 2.1, 2.2, 3.1, 8.1, 9.1, 10.2_

- [x] 11. Implementasi critical history page



- [x] 11.1 Implementasi tab transaksi tertutup


  - Modifikasi halaman riwayat untuk tambahkan tab "Transaksi Tertutup"
  - Buat function `renderCriticalHistory()` untuk tampilkan critical logs
  - Tampilkan tabel dengan badge CRITICAL pada setiap entry
  - Tampilkan kolom: Audit ID, No Transaksi, Tanggal Transaksi, Tanggal Tutup Kasir, Tanggal Penghapusan, User, Kategori, Status Adjustment
  - Implementasi filter dan pencarian untuk critical logs
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 11.2 Implementasi detail view untuk critical logs


  - Buat function `showCriticalDeletionDetail(auditId)` untuk tampilkan modal detail
  - Tampilkan semua informasi audit lengkap
  - Tampilkan snapshot before/after untuk transaksi dan shift
  - Tampilkan journal entries yang dibuat
  - Tampilkan validation results
  - Tampilkan system info (user agent, timestamp, etc)
  - _Requirements: 7.4_

- [x] 11.3 Implementasi export to PDF


  - Buat function `exportCriticalAuditToPDF(auditId)` untuk export audit log
  - Format data menggunakan `CriticalAuditLoggerService.exportToPDF()`
  - Generate PDF dengan library (jsPDF atau similar)
  - Include semua detail audit dalam PDF
  - _Requirements: 7.5_

- [x] 11.4 Write property test for critical history display



  - **Property 14: Critical history separation**
  - **Property 15: History display completeness**
  - **Property 16: Detail view completeness**
  - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

- [x] 12. Testing dan refinement











- [x] 12.1 Write integration tests




  - Test complete closed shift deletion flow end-to-end
  - Test rollback scenario when journal creation fails
  - Test rate limiting scenario (5 warning, 10 block)
  - Test password blocking scenario (3 failed attempts)
  - Test unauthorized access (non-admin user)
  - Test validation failures (pre and post deletion)
  - _Requirements: All_

- [x] 12.2 Manual testing dan bug fixes


  - Test dengan berbagai skenario transaksi tertutup (cash, kredit)
  - Test password verification dengan correct/incorrect password
  - Test rate limiting dengan multiple deletions
  - Test warning dialog dan checkbox requirement
  - Test category/reason validation
  - Test tutup kasir adjustment correctness
  - Test critical audit log creation dan completeness
  - Test rollback mechanism
  - Fix any bugs yang ditemukan
  - _Requirements: All_

- [x] 13. Final checkpoint - Pastikan semua tests passing






  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Documentation dan security review









  - Tambahkan JSDoc comments untuk semua security functions
  - Buat panduan penggunaan fitur untuk super admin
  - Buat security checklist untuk deployment
  - Document rate limiting policy
  - Document audit trail format
  - Review security implementation dengan checklist
  - _Requirements: All_
