# Implementation Plan - Upload Simpanan Saldo Awal

- [x] 1. Buat fungsi CSV parser untuk simpanan





  - Implementasikan fungsi `parseCSVSimpanan(csvText, type)` di js/saldoAwal.js
  - Support multiple delimiters (comma, semicolon, tab)
  - Handle BOM (Byte Order Mark)
  - Handle different line endings (CRLF, LF)
  - Trim whitespace dari setiap field
  - Ignore empty lines
  - Return object dengan {success, data, errors}
  - _Requirements: 3.1, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 1.1 Write property test untuk CSV parsing dengan multiple delimiters


  - **Property 5: Validasi format CSV**
  - **Validates: Requirements 3.1, 8.1**

- [x] 1.2 Write property test untuk whitespace trimming


  - **Property 24: Parser trim whitespace**
  - **Validates: Requirements 8.4**

- [x] 2. Buat fungsi validasi data simpanan





  - Implementasikan fungsi `validateSimpananData(data, type)` di js/saldoAwal.js
  - Validasi header CSV sesuai format (NIK,Nama,Jumlah,Tanggal untuk pokok)
  - Validasi NIK exists dalam data anggota
  - Validasi jumlah adalah angka positif atau nol
  - Validasi required fields tidak kosong
  - Return object dengan {isValid, validData, errors} dengan detail baris dan kolom error
  - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [x] 2.1 Write property test untuk validasi header CSV


  - **Property 6: Validasi header CSV**
  - **Validates: Requirements 3.2**

- [x] 2.2 Write property test untuk validasi referential integrity NIK


  - **Property 7: Validasi referential integrity NIK**
  - **Validates: Requirements 3.3**

- [x] 2.3 Write property test untuk validasi nilai positif


  - **Property 8: Validasi nilai simpanan positif**
  - **Validates: Requirements 3.4**

- [x] 2.4 Write property test untuk error reporting


  - **Property 9: Error reporting yang spesifik**
  - **Validates: Requirements 3.5, 6.4**

- [x] 3. Buat fungsi merge data simpanan





  - Implementasikan fungsi `mergeSimpananData(existingData, newData, mode)` di js/saldoAwal.js
  - Support mode 'replace' dan 'merge'
  - Handle duplicate NIK (replace dengan data baru)
  - Preserve data anggota yang tidak ada dalam upload
  - Return merged array
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 3.1 Write property test untuk merge data


  - **Property 14: Merge data upload dengan manual**
  - **Validates: Requirements 5.1**


- [x] 3.2 Write property test untuk handling duplikasi

  - **Property 15: Handling duplikasi NIK**
  - **Validates: Requirements 5.2**

- [x] 3.3 Write property test untuk update tanpa menghapus data lain


  - **Property 16: Update data tanpa menghapus data lain**
  - **Validates: Requirements 5.3**

- [x] 4. Buat UI dialog upload simpanan





  - Implementasikan fungsi `showUploadSimpananDialog(type)` di js/saldoAwal.js
  - Buat modal dialog dengan Bootstrap
  - Tambahkan 2 tabs: "Upload File" dan "Paste Data"
  - Tab Upload File: input file dengan accept=".csv"
  - Tab Paste Data: textarea untuk paste data
  - Tambahkan link download template
  - Tambahkan instruksi format CSV
  - Tambahkan tombol "Preview", "Cancel", "Import"
  - _Requirements: 1.2, 2.2, 7.1, 7.5, 10.1_

- [x] 4.1 Write property test untuk dialog muncul


  - **Property 1: Dialog upload muncul saat tombol diklik**
  - **Validates: Requirements 1.2, 2.2**

- [x] 5. Buat fungsi preview data import





  - Implementasikan fungsi `showPreviewSimpanan(data, errors)` di js/saldoAwal.js
  - Render tabel preview dengan semua data
  - Highlight baris yang error dengan warna merah
  - Tampilkan pesan error per baris
  - Tampilkan jumlah total record
  - Tampilkan total nilai simpanan
  - Tambahkan tombol "Confirm Import" dan "Cancel"
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 5.1 Write property test untuk preview parsing


  - **Property 2: CSV parsing menghasilkan preview**
  - **Validates: Requirements 1.3, 2.3, 6.1**


- [x] 5.2 Write property test untuk preview jumlah record (PASSED)
  - **Property 19: Preview menampilkan jumlah record**
  - **Validates: Requirements 6.2**


- [x] 5.3 Write property test untuk preview total nilai (PASSED)
  - **Property 20: Preview menampilkan total nilai**

  - **Validates: Requirements 6.3**

- [x] 5.4 Write property test untuk cancel import (PASSED)
  - **Property 21: Cancel import tidak menyimpan data**
  - **Validates: Requirements 6.5**

- [x] 6. Implementasi fungsi import data ke wizardState





  - Implementasikan fungsi `importSimpananToWizard(data, type)` di js/saldoAwal.js
  - Tanya user untuk mode: replace atau merge (jika sudah ada data)
  - Merge data dengan existing data di wizardState.data.simpananAnggota
  - Update field simpananPokok atau simpananWajib sesuai type
  - Trigger re-render Step 6
  - Tampilkan notifikasi sukses dengan jumlah record dan total nilai
  - _Requirements: 1.4, 1.5, 2.4, 2.5, 5.5, 9.1, 9.2, 9.5_

- [x] 6.1 Write property test untuk data tersimpan ke wizardState


  - **Property 3: Data tersimpan ke wizardState setelah konfirmasi**
  - **Validates: Requirements 1.4, 2.4**

- [x] 6.2 Write property test untuk UI update

  - **Property 4: UI update setelah import**
  - **Validates: Requirements 1.5, 2.5, 9.5**

- [x] 6.3 Write property test untuk opsi replace/merge

  - **Property 18: Opsi replace atau merge pada upload kedua**
  - **Validates: Requirements 5.5**

- [x] 6.4 Write property test untuk notifikasi sukses

  - **Property 25: Notifikasi sukses dengan jumlah record**
  - **Property 26: Notifikasi sukses dengan total nilai**
  - **Validates: Requirements 9.1, 9.2**

- [x] 7. Implementasi integrasi dengan COA





  - Implementasikan fungsi `updateCOAFromSimpanan()` di js/saldoAwal.js
  - Hitung total simpanan pokok dari wizardState.data.simpananAnggota
  - Hitung total simpanan wajib dari wizardState.data.simpananAnggota
  - Update akun 2-1100 (Simpanan Pokok) di COA
  - Update akun 2-1200 (Simpanan Wajib) di COA
  - Panggil fungsi ini setiap kali data simpanan berubah
  - Panggil fungsi ini di Step 7 untuk perhitungan balance
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 7.1 Write property test untuk integrasi COA


  - **Property 10: Integrasi dengan COA**
  - **Validates: Requirements 4.1, 4.2**

- [x] 7.2 Write property test untuk perhitungan total kewajiban


  - **Property 11: Perhitungan total kewajiban**
  - **Validates: Requirements 4.3**

- [x] 7.3 Write property test untuk konsistensi data


  - **Property 12: Konsistensi data simpanan dengan COA**
  - **Validates: Requirements 4.4**

- [x] 8. Update fungsi generateJurnalPembuka untuk simpanan





  - Modifikasi fungsi `generateJurnalPembuka()` yang sudah ada
  - Pastikan jurnal pembuka mencatat simpanan sebagai kewajiban
  - Debit: Modal Koperasi (3-1000)
  - Kredit: Simpanan Pokok (2-1100) dan Simpanan Wajib (2-1200)
  - Validasi balance jurnal
  - _Requirements: 4.5_

- [x] 8.1 Write property test untuk jurnal pembuka


  - **Property 13: Jurnal pembuka mencatat simpanan**
  - **Validates: Requirements 4.5**

- [x] 9. Buat fungsi download template CSV





  - Implementasikan fungsi `downloadTemplateSimpanan(type)` di js/saldoAwal.js
  - Generate CSV dengan header yang sesuai
  - Simpanan Pokok: NIK,Nama,Jumlah,Tanggal
  - Simpanan Wajib: NIK,Nama,Jumlah,Periode,Tanggal
  - Tambahkan 1 baris contoh data
  - Download file dengan nama yang sesuai (template_simpanan_pokok.csv atau template_simpanan_wajib.csv)
  - _Requirements: 7.2, 7.3, 7.4_

- [x] 9.1 Write property test untuk template header


  - **Property 22: Template CSV dengan header yang benar**
  - **Validates: Requirements 7.2, 7.3**

- [x] 9.2 Write property test untuk template contoh data

  - **Property 23: Template menyertakan contoh data**
  - **Validates: Requirements 7.4**

- [x] 10. Enhance Step 6 wizard dengan tombol upload




  - Modifikasi fungsi `renderStep6Simpanan()` di js/saldoAwal.js
  - Tambahkan tombol "Upload Simpanan Pokok CSV" di atas tabel
  - Tambahkan tombol "Upload Simpanan Wajib CSV" di atas tabel
  - Tombol memanggil `showUploadSimpananDialog('pokok')` atau `showUploadSimpananDialog('wajib')`
  - Pastikan tabel simpanan menampilkan data dari wizardState
  - Update total simpanan pokok, wajib, dan sukarela
  - _Requirements: 1.1, 2.1_

- [x] 11. Implementasi fungsi delete baris simpanan





  - Tambahkan tombol delete per baris di tabel simpanan Step 6
  - Implementasikan fungsi `deleteSimpananRow(anggotaId)` di js/saldoAwal.js
  - Hapus data dari wizardState.data.simpananAnggota
  - Update COA
  - Re-render tabel
  - Update total
  - _Requirements: 5.4_

- [x] 11.1 Write property test untuk delete data


  - **Property 17: Delete data dan update total**
  - **Validates: Requirements 5.4**

- [x] 12. Implementasi paste data functionality





  - Tambahkan event handler untuk textarea paste di dialog upload
  - Detect delimiter dari pasted data (tab untuk Excel, comma/semicolon untuk CSV)
  - Parse pasted data menggunakan `parseCSVSimpanan()`
  - Tampilkan preview sama seperti upload file
  - _Requirements: 10.2, 10.3, 10.4, 10.5_

- [x] 12.1 Write property test untuk parsing paste data


  - **Property 29: Parsing paste data dengan multiple delimiters**
  - **Validates: Requirements 10.2, 10.3**


- [x] 12.2 Write property test untuk consistency paste

  - **Property 30: Consistency paste dengan upload**
  - **Validates: Requirements 10.4, 10.5**

- [x] 13. Implementasi error handling dan feedback





  - Tambahkan try-catch di semua fungsi upload
  - Handle file read errors
  - Handle parsing errors
  - Handle validation errors
  - Tampilkan pesan error yang informatif
  - Handle partial success (beberapa row valid, beberapa invalid)
  - _Requirements: 9.3, 9.4_

- [x] 13.1 Write property test untuk error feedback


  - **Property 27: Pesan error untuk import gagal**
  - **Validates: Requirements 9.3**

- [x] 13.2 Write property test untuk partial success


  - **Property 28: Feedback untuk partial success**
  - **Validates: Requirements 9.4**

- [x] 14. Checkpoint - Pastikan semua tests passing





  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Testing dan validasi akhir





  - Test upload file CSV dari berbagai sources
  - Test paste data dari Excel dan Google Sheets
  - Test dengan data dalam jumlah besar (100+ anggota)
  - Test error handling dengan berbagai jenis error
  - Test integrasi dengan COA dan balance calculation
  - Test wizard navigation dengan data simpanan
  - Validasi bahwa semua requirements terpenuhi
  - _Requirements: All_


- [x] 15.1 Write integration tests

  - Test complete upload flow dari klik sampai data tersimpan
  - Test COA integration dan balance calculation
  - Test wizard navigation dengan data persist
  - Test paste functionality end-to-end

- [x] 16. Final Checkpoint - Pastikan semua tests passing





  - Ensure all tests pass, ask the user if questions arise.
