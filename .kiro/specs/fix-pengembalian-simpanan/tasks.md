# Implementation Plan

- [ ] 1. Update data model untuk simpanan dengan field pengembalian
  - Tambahkan field baru pada struktur data simpanan: saldoSebelumPengembalian, statusPengembalian, pengembalianId, tanggalPengembalian
  - Update semua fungsi yang membaca/menulis data simpanan untuk handle field baru
  - _Requirements: 1.3, 1.4, 1.5_

- [ ] 1.1 Write property test for historical data preservation
  - **Property 2: Historical data preservation**
  - **Validates: Requirements 1.3**

- [ ] 1.2 Write property test for pengembalian metadata completeness
  - **Property 3: Pengembalian metadata completeness**
  - **Validates: Requirements 1.4, 1.5**

- [ ] 2. Modify processPengembalian() untuk zero-kan saldo simpanan
  - Update fungsi processPengembalian() di js/anggotaKeluarManager.js
  - Setelah membuat jurnal, zero-kan saldo simpananPokok, simpananWajib, dan simpananSukarela
  - Simpan saldo lama ke field saldoSebelumPengembalian
  - Set statusPengembalian = 'Dikembalikan'
  - Catat pengembalianId dan tanggalPengembalian
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2.1 Write property test for pengembalian zeros all simpanan
  - **Property 1: Pengembalian zeros all simpanan balances**
  - **Validates: Requirements 1.1, 1.2**

- [ ] 2.2 Write property test for journal entries creation
  - **Property 7: Journal entries for pengembalian**
  - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ] 2.3 Write property test for double-entry balance
  - **Property 8: Double-entry balance**
  - **Validates: Requirements 4.4**

- [ ] 2.4 Write property test for pengembalian references journal
  - **Property 9: Pengembalian references journal**
  - **Validates: Requirements 4.5**

- [x] 3. Update laporan simpanan untuk filter saldo > 0
  - Modify renderLaporanSimpananPokok() di js/koperasi.js
  - Modify renderLaporanSimpananWajib() di js/koperasi.js
  - Modify renderLaporanSimpananSukarela() di js/koperasi.js
  - Filter hanya simpanan dengan jumlah > 0
  - Update perhitungan total untuk exclude saldo 0
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 3.1 Write property test for laporan filters zero balances
  - **Property 4: Laporan filters zero balances**
  - **Validates: Requirements 2.1, 2.2, 2.3**

- [x] 3.2 Write property test for total calculation excludes zeros
  - **Property 5: Total calculation excludes zeros**
  - **Validates: Requirements 2.4**

- [x] 3.3 Write property test for pengembalian makes anggota invisible
  - **Property 6: Pengembalian makes anggota invisible in reports**
  - **Validates: Requirements 2.5**

- [x] 4. Filter anggota keluar dari master anggota
  - Modify renderTableAnggota() di js/koperasi.js untuk filter statusKeanggotaan !== 'Keluar'
  - Modify filterAnggota() di js/koperasi.js untuk exclude anggota keluar
  - Update counter total anggota untuk exclude anggota keluar
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 4.1 Write property test for master anggota excludes keluar
  - **Property 10: Master anggota excludes keluar**
  - **Validates: Requirements 5.1**

- [x] 4.2 Write property test for search excludes anggota keluar
  - **Property 11: Search excludes anggota keluar**
  - **Validates: Requirements 5.2**

- [x] 4.3 Write property test for filter excludes anggota keluar
  - **Property 12: Filter excludes anggota keluar**
  - **Validates: Requirements 5.3**

- [x] 4.4 Write property test for count excludes anggota keluar
  - **Property 13: Count excludes anggota keluar**
  - **Validates: Requirements 5.4**

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Create transaction validation module
  - Buat file baru js/transactionValidator.js
  - Implement validateAnggotaForTransaction() function
  - Function harus check statusKeanggotaan dan return error jika 'Keluar'
  - _Requirements: 6.5_

- [ ] 6.1 Write property test for transaction validation blocks keluar
  - **Property 14: Transaction validation blocks anggota keluar**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

- [ ] 7. Integrate validation ke semua transaksi
  - Add validation call di addToCart() untuk POS transaction (js/koperasi.js)
  - Add validation call di saveKasbon() untuk kasbon payment (js/koperasi.js)
  - Add validation call di saveSimpanan() untuk simpanan transaction (js/koperasi.js)
  - Add validation call di savePinjaman() untuk pinjaman transaction (js/koperasi.js)
  - Show error alert jika validation gagal
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 8. Implement surat pengunduran diri generator
  - Create generateSuratPengunduranDiri() function di js/anggotaKeluarUI.js
  - Generate HTML document dengan semua informasi yang diperlukan
  - Include logo koperasi, identitas anggota, rincian pengembalian
  - Include area untuk tanda tangan
  - Open document di new window untuk printing
  - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [ ] 8.1 Write property test for surat contains anggota identity
  - **Property 15: Surat contains anggota identity**
  - **Validates: Requirements 7.2**

- [ ] 8.2 Write property test for surat contains exit details
  - **Property 16: Surat contains exit details**
  - **Validates: Requirements 7.3**

- [ ] 8.3 Write property test for surat contains pengembalian breakdown
  - **Property 17: Surat contains pengembalian breakdown**
  - **Validates: Requirements 7.4**

- [ ] 8.4 Write property test for surat contains payment details
  - **Property 18: Surat contains payment details**
  - **Validates: Requirements 7.5**

- [ ] 8.5 Write property test for surat contains koperasi branding
  - **Property 19: Surat contains koperasi branding**
  - **Validates: Requirements 7.6**

- [ ] 8.6 Write property test for surat contains signature areas
  - **Property 20: Surat contains signature areas**
  - **Validates: Requirements 7.7**

- [ ] 9. Add button untuk cetak surat di UI anggota keluar
  - Add "Cetak Surat" button di detail anggota keluar
  - Button hanya muncul jika pengembalianStatus = 'Selesai'
  - Button call generateSuratPengunduranDiri() dengan anggotaId dan pengembalianId
  - _Requirements: 7.1_

- [ ] 10. Enhance error handling dan rollback mechanism
  - Verify snapshot/restore mechanism di processPengembalian()
  - Ensure semua perubahan data di-wrap dalam try-catch
  - Add audit log entry untuk failed pengembalian
  - Test rollback dengan inject error
  - _Requirements: 8.1, 8.2, 8.3, 8.5_

- [ ] 10.1 Write property test for rollback preserves data
  - **Property 21: Rollback on error preserves data**
  - **Validates: Requirements 8.1, 8.2, 8.3**

- [ ] 10.2 Write property test for failed pengembalian audit log
  - **Property 22: Failed pengembalian creates audit log**
  - **Validates: Requirements 8.5**

- [ ] 11. Final Checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Integration testing dan manual verification
  - Test complete flow: mark anggota keluar → process pengembalian → verify saldo 0
  - Test anggota keluar tidak muncul di master anggota
  - Test anggota keluar tidak bisa transaksi
  - Test laporan simpanan tidak menampilkan anggota dengan saldo 0
  - Test cetak surat pengunduran diri
  - Verify jurnal akuntansi correct
  - Test rollback scenario
  - _Requirements: All_
