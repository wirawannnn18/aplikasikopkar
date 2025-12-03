# Implementation Plan - Pengajuan Modal Kasir

- [x] 1. Setup struktur data dan konfigurasi sistem
  - Buat struktur data pengajuan modal di localStorage
  - Tambahkan konfigurasi pengajuan modal ke system settings
  - Inisialisasi default settings untuk fitur pengajuan modal
  - _Requirements: 5.2_

- [ ] 2. Implementasi Pengajuan Modal Service
- [ ] 2.1 Implementasi fungsi core di js/pengajuanModal.js
  - Implementasi `createPengajuanModal()` untuk membuat pengajuan baru
  - Implementasi `getPengajuanByKasir()` untuk mengambil pengajuan kasir
  - Implementasi `getPengajuanPending()` untuk mengambil pengajuan pending
  - Implementasi `getPengajuanHistory()` dengan filter
  - Implementasi helper functions untuk validasi (cek shift aktif, cek pending, validasi jumlah)
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 5.1, 5.2_

- [ ]* 2.2 Write property test untuk validasi jumlah modal
  - **Property 3: Jumlah modal yang diminta harus valid**
  - **Validates: Requirements 1.2, 5.2**

- [ ]* 2.3 Write property test untuk validasi shift aktif
  - **Property 1: Pengajuan modal hanya dapat dibuat jika kasir tidak memiliki shift aktif**
  - **Validates: Requirements 5.1**

- [ ]* 2.4 Write property test untuk validasi satu pending per kasir
  - **Property 6: Kasir hanya dapat memiliki satu pengajuan pending**
  - **Validates: Requirements 1.5**

- [ ] 3. Implementasi fungsi approval dan rejection
- [ ] 3.1 Implementasi fungsi approval dan rejection di pengajuanModal.js
  - Implementasi `approvePengajuan()` dengan validasi role dan status
  - Implementasi `rejectPengajuan()` dengan validasi alasan
  - Implementasi `markPengajuanAsUsed()` untuk tracking penggunaan
  - Tambahkan audit trail untuk setiap perubahan status
  - _Requirements: 2.3, 2.4, 5.3, 5.4_

- [ ]* 3.2 Write property test untuk approval pengajuan
  - **Property 2: Pengajuan dengan status pending dapat diproses**
  - **Validates: Requirements 2.3, 2.4**

- [ ]* 3.3 Write property test untuk validasi alasan penolakan
  - **Property 4: Penolakan pengajuan wajib memiliki alasan**
  - **Validates: Requirements 2.4**

- [ ]* 3.4 Write property test untuk validasi role admin
  - **Property 10: Admin hanya dapat memproses pengajuan dengan role yang sesuai**
  - **Validates: Requirements 5.3**

- [ ] 4. Implementasi UI untuk Kasir
- [ ] 4.1 Modifikasi form buka kasir untuk integrasi pengajuan modal
  - Modifikasi `showBukaKasModal()` di js/pos.js untuk menampilkan opsi pengajuan modal
  - Tambahkan tombol "Ajukan Modal" yang membuka form pengajuan
  - Buat form input jumlah modal dan keterangan untuk pengajuan
  - Implementasi validasi client-side untuk jumlah modal (positif, tidak melebihi batas)
  - Tambahkan handler untuk submit pengajuan yang memanggil `createPengajuanModal()`
  - Tampilkan status pengajuan aktif jika ada (pending/approved/rejected)
  - Jika ada pengajuan approved, auto-fill modal awal dan disable input manual
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.3_

- [ ]* 4.2 Write unit test untuk form pengajuan modal kasir
  - Test validasi input jumlah modal
  - Test submit handler
  - Test tampilan status pengajuan
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 4.3 Buat halaman riwayat pengajuan untuk kasir
  - Implementasi `renderRiwayatPengajuanKasir()` di js/pengajuanModal.js
  - Tampilkan daftar pengajuan kasir dengan filter status
  - Implementasi detail view untuk setiap pengajuan
  - Tampilkan alasan penolakan untuk pengajuan yang ditolak
  - Tampilkan info shift untuk pengajuan yang sudah digunakan
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 4.4 Write property test untuk filter status kasir
  - **Property: Filter status menampilkan pengajuan yang sesuai**
  - **Validates: Requirements 6.3**

- [ ] 5. Implementasi UI untuk Admin
- [ ] 5.1 Buat halaman kelola pengajuan modal untuk admin
  - Implementasi `renderKelolaPengajuanModal()` di js/pengajuanModal.js
  - Tampilkan daftar pengajuan pending dengan informasi lengkap (kasir, jumlah, tanggal, keterangan)
  - Implementasi filter berdasarkan status, tanggal, dan nama kasir
  - Tambahkan search functionality untuk nama kasir
  - Tampilkan counter jumlah pengajuan pending
  - Tambahkan tombol aksi untuk approve/reject setiap pengajuan
  - _Requirements: 2.1, 2.2, 2.5_

- [ ]* 5.2 Write property test untuk filter pengajuan admin
  - **Property: Filter menampilkan pengajuan berdasarkan kriteria**
  - **Validates: Requirements 2.5**

- [ ] 5.3 Implementasi modal approval dan rejection
  - Buat modal untuk detail pengajuan dengan semua informasi
  - Tambahkan form approval dengan konfirmasi
  - Tambahkan form rejection dengan input alasan wajib
  - Implementasi validasi client-side untuk alasan penolakan
  - Implementasi error handling dan feedback
  - Panggil `approvePengajuan()` atau `rejectPengajuan()` dari service
  - _Requirements: 2.2, 2.3, 2.4_

- [ ]* 5.4 Write unit test untuk modal approval dan rejection
  - Test validasi alasan penolakan
  - Test konfirmasi approval
  - Test error handling
  - _Requirements: 2.3, 2.4_

- [ ] 5.5 Buat halaman riwayat pengajuan untuk admin
  - Implementasi `renderRiwayatPengajuanAdmin()` di js/pengajuanModal.js
  - Tampilkan semua pengajuan dengan status approved, rejected, dan used
  - Implementasi filter periode tanggal (dari-sampai)
  - Implementasi detail view dengan informasi lengkap termasuk admin yang memproses
  - Tambahkan fungsi export ke CSV dengan semua data
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ]* 5.6 Write property test untuk filter tanggal
  - **Property 9: Filter tanggal menampilkan pengajuan dalam rentang yang benar**
  - **Validates: Requirements 4.2**

- [ ]* 5.7 Write property test untuk export CSV
  - **Property: Export CSV menghasilkan file dengan data yang benar**
  - **Validates: Requirements 4.4**

- [ ] 6. Implementasi Notification Service
- [ ] 6.1 Buat notification service untuk pengajuan modal
  - Implementasi `createNotification()` untuk membuat notifikasi
  - Implementasi `getNotificationsByUser()` untuk mengambil notifikasi user
  - Implementasi `markNotificationAsRead()` untuk menandai notifikasi dibaca
  - Integrasikan dengan `approvePengajuan()` untuk kirim notifikasi approval
  - Integrasikan dengan `rejectPengajuan()` untuk kirim notifikasi rejection
  - _Requirements: 3.1, 3.2_

- [ ]* 6.2 Write property test untuk notifikasi
  - **Property 8: Notifikasi dikirim saat status berubah**
  - **Validates: Requirements 3.1, 3.2**

- [ ] 6.3 Implementasi UI notifikasi
  - Tambahkan badge notifikasi di navbar untuk menampilkan jumlah notifikasi unread
  - Implementasi dropdown notifikasi dengan daftar notifikasi terbaru
  - Tambahkan auto-refresh untuk notifikasi baru (polling atau event-based)
  - Implementasi mark as read functionality saat notifikasi diklik
  - _Requirements: 3.1, 3.2_

- [ ]* 6.4 Write unit test untuk UI notifikasi
  - Test badge counter
  - Test dropdown display
  - Test mark as read
  - _Requirements: 3.1, 3.2_

- [ ] 7. Update status pengajuan saat buka kasir
- [ ] 7.1 Modifikasi event handler buka kasir
  - Update event handler submit di `showBukaKasModal()` untuk cek pengajuan approved
  - Jika ada pengajuan approved, panggil `markPengajuanAsUsed()` dengan shiftId
  - Simpan referensi pengajuanId di data shift kasir
  - Tambahkan validasi bahwa pengajuan masih berstatus approved
  - _Requirements: 3.4, 3.5_

- [ ]* 7.2 Write property test untuk integrasi buka kasir
  - **Property 5: Pengajuan yang disetujui dapat digunakan untuk buka kasir**
  - **Validates: Requirements 3.3, 3.5**

- [ ]* 7.3 Write integration test untuk flow lengkap
  - Test flow dari pengajuan sampai buka kasir
  - Test validasi dan error handling
  - Test update status pengajuan
  - _Requirements: 1.1, 2.3, 3.3, 3.5_

- [ ] 8. Update Menu dan Routing
- [ ] 8.1 Tambahkan menu pengajuan modal ke navigation
  - Tambahkan menu "Riwayat Pengajuan Modal" untuk kasir di js/auth.js (menus.kasir)
  - Tambahkan menu "Kelola Pengajuan Modal" untuk admin di js/auth.js (menus.administrator dan super_admin)
  - Tambahkan menu "Riwayat Pengajuan Modal" untuk admin di js/auth.js
  - Update `renderPage()` di js/auth.js untuk handle route baru:
    - 'riwayat-pengajuan-kasir' -> renderRiwayatPengajuanKasir()
    - 'kelola-pengajuan-modal' -> renderKelolaPengajuanModal()
    - 'riwayat-pengajuan-admin' -> renderRiwayatPengajuanAdmin()
  - _Requirements: 1.1, 2.1, 4.1, 6.1_

- [ ]* 8.2 Write unit test untuk routing
  - Test routing ke halaman pengajuan modal
  - Test permission untuk setiap route
  - _Requirements: 1.1, 2.1_

- [ ] 9. Implementasi System Settings untuk Pengajuan Modal
- [ ] 9.1 Tambahkan UI untuk konfigurasi pengajuan modal
  - Tambahkan section "Pengajuan Modal Kasir" di halaman system settings
  - Implementasi toggle enable/disable fitur dengan `updatePengajuanModalSettings()`
  - Implementasi input batas maksimum pengajuan (format rupiah)
  - Implementasi toggle require approval
  - Implementasi input auto-approve amount (format rupiah)
  - Tambahkan validasi client-side untuk nilai positif
  - _Requirements: 5.2_

- [ ]* 9.2 Write unit test untuk system settings
  - Test save settings
  - Test validasi settings
  - Test default values
  - _Requirements: 5.2_

- [x] 10. Testing dan Validasi
- [x]* 10.1 Jalankan semua property tests
  - Pastikan semua property tests pass dengan 100+ iterasi
  - Fix bugs yang ditemukan dari property tests
  - Verify coverage untuk semua correctness properties
  - _Requirements: All_

- [x]* 10.2 Jalankan semua unit tests
  - Pastikan semua unit tests pass
  - Verify test coverage > 80%
  - Fix bugs yang ditemukan
  - _Requirements: All_

- [x]* 10.3 Jalankan integration tests
  - Test flow lengkap dari kasir ke admin ke buka kasir
  - Test error scenarios
  - Test edge cases
  - _Requirements: All_

- [ ] 11. Dokumentasi dan Panduan
- [ ]* 11.1 Buat dokumentasi pengguna
  - Buat PANDUAN_PENGAJUAN_MODAL.md dengan instruksi lengkap
  - Tambahkan screenshot untuk setiap langkah
  - Dokumentasikan error messages dan solusinya
  - Tambahkan FAQ
  - _Requirements: All_

- [ ]* 11.2 Buat dokumentasi teknis
  - Dokumentasikan API functions
  - Dokumentasikan data models
  - Dokumentasikan integration points
  - Tambahkan code examples
  - _Requirements: All_

- [x] 12. Final Checkpoint - Pastikan semua tests passing
  - Ensure all tests pass, ask the user if questions arise.
