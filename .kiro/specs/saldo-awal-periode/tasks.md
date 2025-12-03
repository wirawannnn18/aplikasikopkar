# Implementation Plan - Saldo Awal Periode Akuntansi Koperasi

- [x] 1. Setup struktur file dan integrasi menu





  - Buat file `js/saldoAwal.js` baru
  - Tambahkan menu "Saldo Awal Periode" di sidebar (update `js/koperasi.js` atau file menu yang sesuai)
  - Tambahkan script tag untuk `saldoAwal.js` di `index.html`
  - Inisialisasi localStorage keys baru (`saldoAwalPeriode`, `periodeAktif`, `piutangAwal`, `hutangAwal`)
  - _Requirements: 1.1, 13.1_

- [x] 2. Implementasi fungsi render halaman utama dan form input





  - Implementasi fungsi `renderSaldoAwal()` untuk menampilkan halaman utama
  - Implementasi fungsi `showFormSaldoAwal()` untuk menampilkan form wizard multi-step
  - Buat UI form dengan 7 steps (tanggal & modal, kas & bank, piutang, hutang, persediaan, simpanan, pinjaman, ringkasan)
  - Implementasi navigasi antar steps dalam wizard
  - _Requirements: 1.1, 2.1, 3.1, 3.2, 4.1, 5.1, 6.1, 7.1, 8.1_

- [x] 3. Implementasi validasi input dan balance





  - Implementasi fungsi `validateBalance(entries)` untuk validasi double-entry
  - Implementasi validasi tanggal periode unik (tidak duplikat)
  - Implementasi validasi nilai positif untuk semua input saldo
  - Implementasi perhitungan persamaan akuntansi (Aset = Kewajiban + Modal)
  - Tampilkan error message yang jelas untuk setiap jenis validasi error
  - _Requirements: 1.2, 2.2, 3.3, 9.1, 9.2, 9.4, 9.5_

- [x] 3.1 Write property test untuk validasi balance


  - **Property 1: Double-Entry Balance**
  - **Property 2: Accounting Equation Balance**
  - **Property 5: Positive Value Validation**
  - **Property 6: Unique Period Date**
  - **Validates: Requirements 1.2, 2.2, 3.3, 9.1, 9.2, 9.5**

- [x] 4. Implementasi penyimpanan saldo awal dan integrasi dengan COA





  - Implementasi fungsi `saveSaldoAwal()` untuk menyimpan data ke localStorage
  - Implementasi update field `saldo` pada akun-akun di array COA
  - Implementasi fungsi `generateJurnalPembuka(saldoAwalData)` untuk membuat entries jurnal
  - Panggil fungsi `addJurnal()` dari `keuangan.js` untuk mencatat jurnal pembuka
  - Pastikan keterangan jurnal adalah "Saldo Awal Periode"
  - _Requirements: 1.3, 1.4, 2.1, 2.3, 3.1, 3.2, 3.4, 4.3, 5.3, 6.4, 7.5, 8.4, 9.3, 13.1, 13.2_

- [x] 4.1 Write property test untuk COA synchronization


  - **Property 3: COA Synchronization**
  - **Property 4: Jurnal Integration**
  - **Validates: Requirements 1.3, 1.4, 2.3, 3.1, 3.2, 4.3, 5.3, 6.4, 7.5, 8.4, 13.1, 13.2**

- [x] 5. Implementasi input modal awal koperasi





  - Implementasi form input modal awal dengan validasi nilai positif
  - Generate jurnal dengan debit Kas (1-1000) dan kredit Modal Koperasi (3-1000)
  - Update saldo akun Kas dan Modal Koperasi di COA
  - Simpan modal awal ke objek koperasi di localStorage
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 6. Implementasi input kas, bank, dan persediaan





  - Implementasi input saldo kas awal (update akun 1-1000)
  - Implementasi input saldo bank awal (update akun 1-1100)
  - Implementasi input stok awal per barang dengan daftar barang dari localStorage
  - Hitung total nilai persediaan (stok × hpp per barang)
  - Update akun Persediaan Barang (1-1300) dan field stok di array produk
  - Generate jurnal untuk kas, bank, dan persediaan
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 6.1 Write property test untuk persediaan calculation


  - **Property 9: Persediaan Calculation**
  - **Property 15: Stok Update Synchronization**
  - **Validates: Requirements 6.2, 6.3, 6.4**

- [x] 7. Implementasi input piutang anggota





  - Tampilkan daftar anggota dari localStorage untuk memilih debitur
  - Implementasi form untuk menambah piutang per anggota (NIK, nama, jumlah)
  - Simpan detail piutang ke array `piutangAwal` di localStorage
  - Hitung total piutang dan update akun Piutang Anggota (1-1200)
  - Generate jurnal dengan debit Piutang Anggota dan kredit Modal
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 7.1 Write property test untuk piutang aggregation


  - **Property 7: Piutang Aggregation**
  - **Validates: Requirements 4.3**

- [x] 8. Implementasi input hutang supplier





  - Implementasi form untuk menambah hutang per supplier (nama, jumlah)
  - Simpan detail hutang ke array `hutangAwal` di localStorage
  - Hitung total hutang dan update akun Hutang Supplier (2-1000)
  - Generate jurnal dengan debit Modal dan kredit Hutang Supplier
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 8.1 Write property test untuk hutang aggregation


  - **Property 8: Hutang Aggregation**
  - **Validates: Requirements 5.3**

- [x] 9. Implementasi input simpanan anggota





  - Tampilkan daftar anggota dengan kolom simpanan pokok, wajib, dan sukarela
  - Implementasi input simpanan per anggota
  - Update field `simpananPokok`, `simpananWajib`, `simpananSukarela` di array anggota
  - Hitung total per jenis simpanan dan update akun COA (2-1100, 2-1200, 2-1300)
  - Generate jurnal dengan debit Modal dan kredit Simpanan
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [x] 9.1 Write property test untuk simpanan


  - **Property 10: Simpanan Aggregation**
  - **Property 16: Simpanan Field Update**
  - **Validates: Requirements 7.2, 7.3, 7.4, 7.5**

- [x] 10. Implementasi input pinjaman anggota





  - Implementasi form untuk menambah pinjaman per anggota
  - Input detail pinjaman (NIK, jumlah pokok, bunga, tenor, tanggal jatuh tempo)
  - Simpan ke array `pinjaman` di localStorage dengan status "Aktif"
  - Buat atau update akun Piutang Pinjaman di COA
  - Generate jurnal dengan debit Piutang Pinjaman dan kredit Modal
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 10.1 Write property test untuk pinjaman


  - **Property 17: Pinjaman Data Persistence**
  - **Validates: Requirements 8.2, 8.6**

- [x] 11. Checkpoint - Pastikan semua tests passing





  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Implementasi ringkasan dan validasi final





  - Implementasi fungsi `showRingkasanSaldoAwal()` untuk menampilkan ringkasan
  - Tampilkan tanggal periode dan status (aktif/tutup)
  - Hitung dan tampilkan total aset, kewajiban, dan modal dari COA
  - Tampilkan rincian per kategori akun
  - Tampilkan indikator balance (✓ Balance / ✗ Tidak Balance)
  - Implementasi tombol aksi (Simpan, Batal)
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 12.1 Write property test untuk ringkasan


  - **Property 2: Accounting Equation Balance**
  - **Validates: Requirements 10.2**

- [x] 13. Implementasi fitur edit dan koreksi saldo awal





  - Implementasi fungsi `editSaldoAwal()` untuk edit periode yang belum dikunci
  - Implementasi perhitungan selisih antara saldo lama dan baru
  - Generate jurnal koreksi dengan keterangan "Koreksi Saldo Awal"
  - Implementasi warning dan konfirmasi untuk periode yang sudah dikunci
  - Update saldo akun melalui mekanisme addJurnal()
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 13.1 Write property test untuk koreksi


  - **Property 11: Correction Journal Audit Trail**
  - **Validates: Requirements 2.5, 11.2, 11.4, 13.7**

- [x] 14. Implementasi period locking mechanism





  - Implementasi flag `periodeAktif` di localStorage
  - Implementasi fungsi untuk lock/unlock periode
  - Cegah perubahan langsung pada periode yang locked
  - Izinkan perubahan hanya melalui jurnal koreksi
  - _Requirements: 10.5, 11.1, 11.3_

- [x] 14.1 Write property test untuk locked period


  - **Property 14: Locked Period Protection**
  - **Validates: Requirements 10.5, 11.1, 11.3**

- [x] 15. Implementasi export laporan CSV





  - Implementasi fungsi untuk generate CSV dari data saldo awal
  - Include semua akun dengan saldo awal
  - Format: kode akun, nama akun, tipe, saldo
  - Implementasi download file CSV
  - _Requirements: 10.4_

- [x] 16. Implementasi import CSV/Excel





  - Implementasi fungsi `importSaldoAwal()` dengan upload file interface
  - Validasi format file dan struktur kolom (kode akun, nama akun, tipe, saldo)
  - Implementasi preview data sebelum import
  - Proses setiap baris dan update saldo di COA
  - Generate jurnal pembuka dari data import menggunakan addJurnal()
  - Tampilkan ringkasan hasil import (berhasil/gagal)
  - Tampilkan daftar error dengan detail (baris dan alasan)
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [x] 16.1 Write property test untuk import


  - **Property 12: Import Data Integrity**
  - **Property 18: Import Batch Processing**
  - **Validates: Requirements 12.2, 12.4, 12.5, 12.6, 12.7**

- [x] 17. Integrasi dengan laporan keuangan existing





  - Verifikasi bahwa Laporan Laba Rugi menampilkan modal awal dari saldo awal periode
  - Verifikasi bahwa Laporan SHU menggunakan modal awal dari saldo awal periode
  - Verifikasi bahwa Jurnal Harian menampilkan jurnal pembuka saldo awal
  - Verifikasi bahwa Buku Besar menampilkan saldo awal sebagai baris pertama per akun
  - Update fungsi laporan jika diperlukan untuk integrasi yang lebih baik
  - _Requirements: 1.5, 2.4, 13.3, 13.4, 13.5, 13.6_

- [x] 17.1 Write property test untuk integrasi laporan


  - **Property 13: Report Integration Consistency**
  - **Property 19: Buku Besar First Entry**
  - **Property 20: Jurnal Harian Visibility**
  - **Validates: Requirements 2.4, 13.3, 13.4, 13.5, 13.6**

- [x] 18. Testing dan bug fixes





  - Test semua flow dari awal sampai akhir
  - Test edge cases (nilai 0, nilai besar, banyak anggota, dll)
  - Test error handling
  - Test integrasi dengan sistem existing
  - Fix bugs yang ditemukan
  - _Requirements: All_

- [x] 19. Final checkpoint - Pastikan semua tests passing





  - Ensure all tests pass, ask the user if questions arise.

