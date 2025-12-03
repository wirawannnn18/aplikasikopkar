# Implementation Plan

- [x] 1. Buat helper functions untuk date formatting dan parsing





  - Implementasi fungsi `formatDateToDisplay(isoDate)` untuk convert ISO ke DD/MM/YYYY
  - Implementasi fungsi `formatDateToISO(displayDate)` untuk convert DD/MM/YYYY ke ISO
  - Implementasi fungsi `getCurrentDateISO()` untuk mendapatkan tanggal hari ini dalam format ISO
  - Implementasi fungsi `parseDateFlexible(dateString)` untuk parse berbagai format tanggal
  - Tambahkan validasi tanggal (tidak boleh di masa depan, tidak sebelum tahun 1900)
  - _Requirements: 1.2, 5.5_

- [x] 1.1 Write property test untuk date formatting functions


  - **Property 2: ISO 8601 format compliance**
  - **Property 11: Flexible date parsing**
  - **Validates: Requirements 1.2, 5.5**

- [x] 1.2 Write unit tests untuk date helper functions


  - Test formatDateToDisplay dengan berbagai input ISO date
  - Test formatDateToISO dengan berbagai input DD/MM/YYYY
  - Test parseDateFlexible dengan format DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY
  - Test edge cases: invalid dates, empty strings, null values
  - _Requirements: 1.2, 5.5_

- [x] 2. Update fungsi saveAnggota untuk menangani tanggalDaftar





  - Modifikasi fungsi `saveAnggota()` untuk set tanggalDaftar otomatis untuk anggota baru
  - Pastikan tanggalDaftar tidak berubah saat edit anggota existing
  - Handle legacy data: jika tanggalDaftar tidak ada, set dengan tanggal hari ini
  - Validasi tanggalDaftar tidak boleh kosong untuk anggota baru
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.2_

- [x] 2.1 Write property test untuk auto-registration date


  - **Property 1: New member auto-registration date**
  - **Validates: Requirements 1.1**

- [x] 2.2 Write property test untuk non-empty registration date


  - **Property 3: Non-empty registration date**
  - **Validates: Requirements 1.3**

- [x] 2.3 Write property test untuk registration date immutability


  - **Property 4: Registration date immutability**
  - **Validates: Requirements 1.4**

- [x] 2.4 Write property test untuk legacy data backfill


  - **Property 7: Legacy data backfill**
  - **Validates: Requirements 4.2**

- [x] 3. Update UI form anggota untuk menampilkan field tanggalDaftar





  - Tambahkan field tanggal pendaftaran di modal form anggota (`renderAnggota()`)
  - Set default value tanggal hari ini untuk form tambah anggota baru
  - Set field sebagai read-only untuk form edit anggota
  - Tampilkan tanggal dalam format DD/MM/YYYY di form edit
  - Tambahkan icon dan label yang sesuai
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 4. Update fungsi showAnggotaModal untuk handle tanggalDaftar





  - Set default tanggalDaftar ke tanggal hari ini untuk anggota baru
  - Pastikan field kosong saat membuka form tambah anggota
  - _Requirements: 2.1_

- [x] 5. Update fungsi editAnggota untuk load dan display tanggalDaftar





  - Load tanggalDaftar dari data anggota
  - Convert ke format DD/MM/YYYY untuk display
  - Set field sebagai read-only
  - Handle legacy data: jika tidak ada tanggalDaftar, tampilkan tanggal hari ini
  - _Requirements: 2.2, 2.4, 4.2_

- [x] 5.1 Write property test untuk display format conversion


  - **Property 5: Display format conversion**`
  - **Validates: Requirements 2.2, 2.3, 3.2**

- [x] 6. Update tabel daftar anggota untuk menampilkan kolom tanggalDaftar





  - Tambahkan kolom "Tanggal Pendaftaran" di header tabel (`renderAnggota()`)
  - Update fungsi `renderTableAnggota()` untuk render tanggalDaftar di setiap row
  - Format tanggal sebagai DD/MM/YYYY
  - Handle legacy data: tampilkan "-" jika tanggalDaftar tidak ada
  - _Requirements: 3.1, 3.2, 4.1_

- [x] 6.1 Write property test untuk legacy data handling


  - **Property 6: Legacy data handling**
  - **Validates: Requirements 4.1, 4.3**

- [x] 7. Update fungsi viewAnggota untuk menampilkan tanggalDaftar di detail view





  - Tambahkan row tanggal pendaftaran di modal detail anggota
  - Format tanggal sebagai DD/MM/YYYY
  - Handle legacy data: tampilkan "Tidak tercatat" jika tanggalDaftar tidak ada
  - Tambahkan icon yang sesuai
  - _Requirements: 2.3, 4.1_

- [x] 8. Update fungsi downloadTemplateAnggota untuk include kolom tanggalDaftar





  - Tambahkan kolom "Tanggal Pendaftaran" di header template CSV
  - Tambahkan contoh format tanggal yang benar (DD/MM/YYYY)
  - Update dokumentasi template
  - _Requirements: 5.4_

- [x] 9. Update fungsi previewImport untuk parse kolom tanggalDaftar





  - Parse kolom tanggalDaftar dari CSV jika ada
  - Gunakan fungsi `parseDateFlexible()` untuk support berbagai format
  - Jika kolom tidak ada, set default ke tanggal hari ini
  - Tampilkan tanggal di preview table
  - _Requirements: 5.1, 5.2, 5.5_

- [x] 9.1 Write property test untuk import with registration date


  - **Property 8: Import with registration date**
  - **Validates: Requirements 5.1**

- [x] 9.2 Write property test untuk import without registration date


  - **Property 9: Import without registration date**
  - **Validates: Requirements 5.2**

- [x] 10. Update fungsi processImport untuk save tanggalDaftar





  - Simpan tanggalDaftar yang sudah di-parse ke localStorage
  - Convert ke format ISO 8601 sebelum save
  - Validasi format tanggal
  - Handle error parsing dengan fallback ke tanggal hari ini
  - _Requirements: 5.1, 5.2, 5.5_

- [x] 11. Update fungsi exportAnggota untuk include kolom tanggalDaftar





  - Tambahkan kolom "Tanggal Pendaftaran" di header CSV export
  - Format tanggal sebagai DD/MM/YYYY di setiap row
  - Handle legacy data: export empty string atau "-" jika tanggalDaftar tidak ada
  - _Requirements: 5.3_

- [x] 11.1 Write property test untuk export includes registration date


  - **Property 10: Export includes registration date**
  - **Validates: Requirements 5.3**

- [x] 12. Implementasi fitur sorting berdasarkan tanggalDaftar (opsional)





  - Tambahkan event handler untuk klik header kolom tanggalDaftar
  - Implementasi sorting ascending/descending
  - Update UI untuk menampilkan indikator sort direction
  - Handle legacy data dalam sorting
  - _Requirements: 6.2_

- [x] 12.1 Write property test untuk date-based sorting


  - **Property 12: Date-based sorting**
  - **Validates: Requirements 6.2**

- [x] 13. Implementasi fitur filter berdasarkan rentang tanggal (opsional)





  - Tambahkan input date range di section filter
  - Implementasi logika filter berdasarkan tanggalDaftar
  - Update fungsi `filterAnggota()` untuk support date range filter
  - Handle legacy data dalam filtering
  - _Requirements: 6.1, 6.3_

- [x] 13.1 Write property test untuk date range filtering


  - **Property 13: Date range filtering**
  - **Validates: Requirements 6.3**

- [x] 14. Testing dan validasi





  - Test dengan data anggota existing (backward compatibility)
  - Test import/export round-trip
  - Test di berbagai browser
  - Validasi semua requirements terpenuhi

- [x] 15. Checkpoint - Pastikan semua tests passing





  - Ensure all tests pass, ask the user if questions arise.
