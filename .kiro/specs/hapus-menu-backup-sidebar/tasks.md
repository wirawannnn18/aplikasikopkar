# Implementation Plan

- [x] 1. Update halaman Pengaturan Sistem untuk menambahkan tombol Backup & Restore





  - Modifikasi fungsi `renderSystemSettings()` di `js/auth.js`
  - Ganti placeholder tombol backup dengan tombol fungsional yang memanggil `renderBackupRestore()`
  - Tambahkan styling yang jelas untuk tombol agar mudah ditemukan
  - _Requirements: 1.3, 3.2_

- [x] 2. Update routing untuk redirect backup-restore ke system-settings





  - Modifikasi fungsi `renderPage()` di `js/auth.js`
  - Tambahkan logic redirect di case 'backup-restore' untuk memanggil `navigateTo('system-settings')`
  - _Requirements: 1.4, 2.2_

- [x] 3. Hapus menu item Backup & Restore dari sidebar





  - Modifikasi fungsi `renderMenu()` di `js/auth.js`
  - Hapus entry `{ icon: 'bi-database', text: 'Backup & Restore', page: 'backup-restore' }` dari array `menus.super_admin`
  - Hapus entry yang sama dari array `menus.administrator`
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 4. Write unit tests untuk menu configuration






  - Test bahwa super_admin menu tidak mengandung 'backup-restore'
  - Test bahwa administrator menu tidak mengandung 'backup-restore'
  - Test bahwa role lain tidak terpengaruh
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 5. Write unit tests untuk routing redirect





  - Test bahwa navigateTo('backup-restore') redirect ke 'system-settings'
  - Test bahwa renderPage('backup-restore') memanggil navigateTo
  - _Requirements: 1.4, 2.2_

- [x] 6. Write unit tests untuk System Settings page






  - Test bahwa renderSystemSettings() menghasilkan HTML dengan tombol backup
  - Test bahwa tombol memiliki onclick handler yang benar
  - _Requirements: 1.3, 3.2_

- [x] 7. Write integration tests untuk user flow






  - Test complete flow: login → verify menu → navigate to settings → click backup button
  - Test direct access redirect
  - _Requirements: 1.1, 1.3, 1.4, 3.3_

- [x] 8. Manual testing dan verification





  - Test dengan berbagai role (super_admin, administrator, keuangan, kasir)
  - Verify semua fungsi backup & restore masih berfungsi
  - Test backup dan restore data
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: All_
