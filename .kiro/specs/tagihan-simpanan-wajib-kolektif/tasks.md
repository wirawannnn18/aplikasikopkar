# Implementation Plan

- [ ] 1. Setup project structure dan data models
  - Buat file `js/billingManager.js` untuk logika bisnis tagihan
  - Buat file `js/paymentProcessor.js` untuk logika pembayaran
  - Buat file `js/schedulerService.js` untuk scheduler otomatis
  - Buat file `js/billingRepository.js` untuk akses data
  - Setup fast-check library untuk property-based testing
  - _Requirements: All_

- [ ]* 1.1 Write property test for data model validation
  - **Property 3: Status awal tagihan adalah belum dibayar**
  - **Validates: Requirements 1.3, 5.2**

- [ ] 2. Implement BillingRepository untuk data access layer
  - Implementasi method `save()` untuk menyimpan tagihan baru
  - Implementasi method `findById()` untuk mendapatkan tagihan by ID
  - Implementasi method `findAll()` untuk mendapatkan semua tagihan
  - Implementasi method `update()` untuk update tagihan
  - Implementasi method `delete()` untuk hapus tagihan
  - Implementasi method `existsByMemberAndPeriod()` untuk cek duplikat
  - Gunakan localStorage dengan key `billings`
  - _Requirements: 1.5, 6.2_

- [ ]* 2.1 Write property test for duplicate prevention
  - **Property 5: Tidak ada tagihan duplikat per periode**
  - **Validates: Requirements 1.5**

- [ ]* 2.2 Write property test for deletion
  - **Property 24: Tagihan terhapus tidak ada di storage**
  - **Validates: Requirements 6.2**

- [ ] 3. Implement BillingManager untuk business logic
  - Implementasi `createMonthlyBillings()` untuk membuat tagihan bulanan
  - Validasi anggota aktif sebelum membuat tagihan (status check)
  - Implementasi `createInitialSavingBilling()` untuk simpanan pokok 250 ribu
  - Implementasi `getBillings()` dengan filter status, periode, dan search
  - Implementasi sorting berdasarkan createdAt descending
  - Implementasi `deleteBilling()` dengan validasi status
  - Implementasi `getMemberPaymentHistory()` dengan filter tanggal
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.2, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 8.1, 8.2_

- [ ]* 3.1 Write property test for active member filtering
  - **Property 1: Tagihan dibuat untuk semua anggota aktif**
  - **Validates: Requirements 1.1, 8.1, 8.2**

- [ ]* 3.2 Write property test for period format
  - **Property 2: Format periode tagihan konsisten**
  - **Validates: Requirements 1.2**

- [ ]* 3.3 Write property test for billing amount
  - **Property 4: Nominal tagihan sesuai pengaturan anggota**
  - **Validates: Requirements 1.4**

- [ ]* 3.4 Write property test for simpanan pokok creation
  - **Property 20: Anggota baru mendapat tagihan simpanan pokok 250 ribu**
  - **Validates: Requirements 5.1**

- [ ]* 3.5 Write property test for status filter
  - **Property 7: Filter status mengembalikan hasil yang sesuai**
  - **Validates: Requirements 2.2**

- [ ]* 3.6 Write property test for period filter
  - **Property 8: Filter periode mengembalikan hasil yang sesuai**
  - **Validates: Requirements 2.3**

- [ ]* 3.7 Write property test for search functionality
  - **Property 9: Pencarian nama anggota mengembalikan hasil yang relevan**
  - **Validates: Requirements 2.4**

- [ ]* 3.8 Write property test for sorting
  - **Property 10: Daftar tagihan terurut berdasarkan tanggal pembuatan**
  - **Validates: Requirements 2.5**

- [ ]* 3.9 Write property test for paid billing deletion prevention
  - **Property 25: Tagihan yang sudah dibayar tidak dapat dihapus**
  - **Validates: Requirements 6.3**

- [ ]* 3.10 Write property test for payment history display
  - **Property 27: Riwayat pembayaran menampilkan semua pembayaran anggota**
  - **Validates: Requirements 7.1**

- [ ]* 3.11 Write property test for payment history sorting
  - **Property 28: Riwayat pembayaran terurut berdasarkan periode**
  - **Validates: Requirements 7.2**

- [ ]* 3.12 Write property test for date range filter
  - **Property 29: Filter tanggal riwayat mengembalikan hasil dalam rentang**
  - **Validates: Requirements 7.3**

- [ ]* 3.13 Write property test for payment history total
  - **Property 30: Total riwayat pembayaran dihitung dengan benar**
  - **Validates: Requirements 7.4**

- [ ] 4. Implement PaymentProcessor untuk payment logic
  - Implementasi `processCollectivePayment()` untuk pembayaran kolektif
  - Update status tagihan menjadi "dibayar"
  - Catat tanggal pembayaran (paidAt)
  - Update saldo simpanan wajib anggota
  - Buat jurnal akuntansi (debit kas, kredit simpanan wajib)
  - Implementasi `payInitialSaving()` untuk pembayaran simpanan pokok
  - Buat jurnal untuk simpanan pokok (debit kas, kredit simpanan pokok)
  - Implementasi `rollbackPayment()` untuk rollback jika gagal
  - _Requirements: 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 5.3, 5.4, 5.5_

- [ ]* 4.1 Write property test for payment status update
  - **Property 12: Pembayaran kolektif mengubah status semua tagihan**
  - **Validates: Requirements 3.3**

- [ ]* 4.2 Write property test for payment date recording
  - **Property 13: Pembayaran mencatat tanggal untuk semua tagihan**
  - **Validates: Requirements 3.4**

- [ ]* 4.3 Write property test for balance updates
  - **Property 14: Pembayaran menambah saldo anggota dengan benar**
  - **Validates: Requirements 3.5**

- [ ]* 4.4 Write property test for journal structure
  - **Property 15: Jurnal pembayaran memiliki struktur akun yang benar**
  - **Validates: Requirements 4.1**

- [ ]* 4.5 Write property test for journal amount
  - **Property 16: Nominal jurnal sama dengan total pembayaran**
  - **Validates: Requirements 4.2**

- [ ]* 4.6 Write property test for journal description
  - **Property 17: Deskripsi jurnal mencantumkan informasi lengkap**
  - **Validates: Requirements 4.3**

- [ ]* 4.7 Write property test for journal date consistency
  - **Property 18: Tanggal jurnal konsisten dengan tanggal pembayaran**
  - **Validates: Requirements 4.4**

- [ ]* 4.8 Write property test for payment rollback
  - **Property 19: Rollback pembayaran gagal tidak meninggalkan jejak**
  - **Validates: Requirements 4.5**

- [ ]* 4.9 Write property test for simpanan pokok payment
  - **Property 21: Pembayaran simpanan pokok mengubah status**
  - **Validates: Requirements 5.3**

- [ ]* 4.10 Write property test for simpanan pokok balance
  - **Property 22: Pembayaran simpanan pokok menambah saldo 250 ribu**
  - **Validates: Requirements 5.4**

- [ ]* 4.11 Write property test for simpanan pokok journal
  - **Property 23: Jurnal simpanan pokok memiliki struktur yang benar**
  - **Validates: Requirements 5.5**

- [ ] 5. Implement SchedulerService untuk automatic billing
  - Implementasi `shouldCreateBillings()` untuk cek tanggal 20
  - Implementasi `getCurrentPeriod()` untuk format periode "YYYY-MM"
  - Implementasi `runScheduledBillingCreation()` untuk eksekusi otomatis
  - Implementasi `logSchedulerExecution()` untuk logging
  - Integrasikan dengan BillingManager untuk create billings
  - _Requirements: 1.1, 1.2_

- [ ]* 5.1 Write unit test for date checking logic
  - Test shouldCreateBillings() returns true on 20th
  - Test shouldCreateBillings() returns false on other dates
  - _Requirements: 1.1_

- [ ]* 5.2 Write unit test for period format
  - Test getCurrentPeriod() returns correct "YYYY-MM" format
  - _Requirements: 1.2_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Create UI untuk halaman tagihan simpanan wajib
  - Buat file `tagihan_simpanan_wajib.html` untuk halaman tagihan
  - Tampilkan tabel dengan kolom: checkbox, nama anggota, periode, nominal, status, aksi
  - Implementasi filter berdasarkan status (semua, belum dibayar, dibayar)
  - Implementasi filter berdasarkan periode (dropdown bulan-tahun)
  - Implementasi search box untuk nama anggota
  - Tampilkan tombol "Bayar Kolektif" yang aktif jika ada checkbox terpilih
  - Tampilkan tombol "Hapus" untuk setiap tagihan belum dibayar
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 6.1_

- [ ]* 7.1 Write property test for UI field display
  - **Property 6: Daftar tagihan menampilkan semua field wajib**
  - **Validates: Requirements 2.1**

- [ ] 8. Implement collective payment UI flow
  - Implementasi checkbox selection untuk multiple billings
  - Hitung total nominal dan jumlah anggota yang dipilih
  - Tampilkan modal konfirmasi dengan detail pembayaran
  - Implementasi tombol konfirmasi untuk proses pembayaran
  - Tampilkan loading state saat proses pembayaran
  - Tampilkan notifikasi sukses/error setelah pembayaran
  - Refresh tabel tagihan setelah pembayaran berhasil
  - _Requirements: 3.1, 3.2, 3.3_

- [ ]* 8.1 Write property test for payment confirmation calculation
  - **Property 11: Konfirmasi pembayaran menampilkan total yang benar**
  - **Validates: Requirements 3.2**

- [ ] 9. Implement audit logging untuk deletion
  - Buat file `js/auditLogger.js` untuk audit trail
  - Implementasi method `logDeletion()` untuk catat penghapusan
  - Simpan log dengan admin ID, billing ID, timestamp, dan reason
  - Integrasikan dengan BillingManager.deleteBilling()
  - _Requirements: 6.4_

- [ ]* 9.1 Write property test for audit log creation
  - **Property 26: Penghapusan tagihan mencatat audit log**
  - **Validates: Requirements 6.4**

- [ ] 10. Integrate dengan member registration flow
  - Modifikasi fungsi pendaftaran anggota di `js/members.js`
  - Panggil BillingManager.createInitialSavingBilling() setelah member dibuat
  - Tampilkan notifikasi bahwa tagihan simpanan pokok telah dibuat
  - _Requirements: 5.1, 5.2_

- [ ] 11. Create UI untuk payment history di member detail
  - Modifikasi halaman detail anggota untuk menampilkan riwayat pembayaran
  - Tampilkan tabel dengan kolom: periode, tanggal pembayaran, nominal
  - Implementasi filter rentang tanggal
  - Tampilkan total simpanan wajib yang telah dibayar
  - Tampilkan pesan jika belum ada pembayaran
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 12. Implement error handling dan validation
  - Implementasi validasi input untuk semua form
  - Implementasi error handling untuk localStorage quota exceeded
  - Implementasi error messages dalam Bahasa Indonesia
  - Implementasi rollback mechanism untuk payment failures
  - Tampilkan user-friendly error messages
  - _Requirements: 4.5, 6.3_

- [ ]* 12.1 Write unit test for validation errors
  - Test invalid billing data rejection
  - Test invalid payment data rejection
  - _Requirements: All_

- [ ]* 12.2 Write unit test for storage error handling
  - Test localStorage quota exceeded handling
  - Test data corruption handling
  - _Requirements: All_

- [ ] 13. Setup scheduler initialization
  - Buat fungsi initialization di `js/app.js` atau entry point
  - Jalankan SchedulerService.runScheduledBillingCreation() saat app load
  - Implementasi check untuk mencegah multiple executions per hari
  - Simpan last execution date di localStorage
  - _Requirements: 1.1_

- [ ] 14. Add navigation menu item
  - Tambahkan menu "Tagihan Simpanan Wajib" di sidebar
  - Pastikan hanya admin yang bisa akses
  - Link ke halaman `tagihan_simpanan_wajib.html`
  - _Requirements: 2.1_

- [ ] 15. Create system settings untuk simpanan wajib
  - Tambahkan field "Nominal Simpanan Wajib Default" di system settings
  - Implementasi UI untuk edit nominal default
  - Simpan setting di localStorage dengan key `systemSettings`
  - Gunakan setting ini sebagai default saat create billing
  - _Requirements: 1.4_

- [ ] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Create user documentation
  - Buat file `PANDUAN_TAGIHAN_SIMPANAN_WAJIB.md`
  - Dokumentasikan cara menggunakan fitur tagihan otomatis
  - Dokumentasikan cara melakukan pembayaran kolektif
  - Dokumentasikan cara melihat riwayat pembayaran
  - Sertakan screenshot dan contoh penggunaan
  - _Requirements: All_
