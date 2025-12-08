# Requirements Document

## Introduction

Proses anggota keluar saat ini kurang terstruktur dan tidak memastikan bahwa semua kewajiban finansial telah diselesaikan sebelum anggota keluar dari koperasi. Fitur ini akan mengimplementasikan wizard 5-tahap yang terstruktur untuk memproses anggota keluar, memastikan validasi hutang/piutang, pencairan simpanan dengan jurnal otomatis, pencetakan dokumen, update status, dan verifikasi accounting.

## Glossary

- **Wizard**: Interface multi-tahap yang memandu user melalui proses sequential
- **Anggota Keluar**: Anggota koperasi yang mengajukan keluar dari koperasi
- **Validasi Hutang/Piutang**: Pengecekan apakah anggota memiliki pinjaman aktif atau piutang yang belum diselesaikan
- **Pencairan Simpanan**: Proses pengembalian simpanan pokok, wajib, dan sukarela kepada anggota
- **Pinjaman Aktif**: Pinjaman dengan sisaPinjaman > 0
- **Piutang Aktif**: Piutang dengan sisaPiutang > 0
- **Jurnal Accounting**: Catatan transaksi keuangan dalam sistem double-entry
- **Simpanan Pokok**: Simpanan yang dibayarkan satu kali saat menjadi anggota (akun 2-1100)
- **Simpanan Wajib**: Simpanan yang dibayarkan berkala (akun 2-1200)
- **Simpanan Sukarela**: Simpanan tambahan yang bersifat sukarela (akun 2-1300)
- **Kas**: Akun aset berupa uang tunai (akun 1-1000)
- **Bank**: Akun aset berupa rekening bank (akun 1-1100)
- **Surat Pengunduran Diri**: Dokumen resmi yang menyatakan anggota mengundurkan diri
- **Bukti Pencairan**: Dokumen yang mencatat detail pengembalian simpanan
- **Step Indicator**: Visual indicator yang menunjukkan tahap wizard saat ini

## Requirements

### Requirement 1

**User Story:** Sebagai admin koperasi, saya ingin sistem memvalidasi hutang/piutang anggota sebelum memproses keluar, sehingga tidak ada anggota yang keluar dengan kewajiban finansial yang belum diselesaikan.

#### Acceptance Criteria

1. WHEN admin memulai proses anggota keluar THEN sistem SHALL menampilkan wizard dengan tahap validasi hutang/piutang sebagai tahap pertama
2. WHEN sistem melakukan validasi THEN sistem SHALL mengecek semua pinjaman dengan sisaPinjaman lebih dari 0
3. WHEN sistem melakukan validasi THEN sistem SHALL mengecek semua piutang dengan sisaPiutang lebih dari 0
4. WHEN anggota memiliki pinjaman aktif atau piutang aktif THEN sistem SHALL menampilkan pesan error dan memblokir proses lanjutan
5. WHEN anggota tidak memiliki pinjaman aktif dan piutang aktif THEN sistem SHALL mengaktifkan tombol untuk lanjut ke tahap berikutnya

### Requirement 2

**User Story:** Sebagai admin koperasi, saya ingin sistem menghitung dan menampilkan total simpanan yang akan dikembalikan, sehingga saya dapat memverifikasi jumlah sebelum memproses pencairan.

#### Acceptance Criteria

1. WHEN admin masuk ke tahap pencairan simpanan THEN sistem SHALL menghitung total simpanan pokok anggota
2. WHEN admin masuk ke tahap pencairan simpanan THEN sistem SHALL menghitung total simpanan wajib anggota
3. WHEN admin masuk ke tahap pencairan simpanan THEN sistem SHALL menghitung total simpanan sukarela anggota
4. WHEN sistem menampilkan rincian THEN sistem SHALL menampilkan breakdown per jenis simpanan dan total keseluruhan
5. WHEN sistem menampilkan rincian THEN sistem SHALL menampilkan saldo kas saat ini dan proyeksi saldo setelah pencairan

### Requirement 3

**User Story:** Sebagai admin koperasi, saya ingin sistem membuat jurnal accounting otomatis saat pencairan simpanan, sehingga tidak ada kesalahan manual dalam pencatatan keuangan.

#### Acceptance Criteria

1. WHEN admin memproses pencairan simpanan pokok THEN sistem SHALL membuat jurnal dengan debit akun 2-1100 dan kredit akun kas atau bank
2. WHEN admin memproses pencairan simpanan wajib THEN sistem SHALL membuat jurnal dengan debit akun 2-1200 dan kredit akun kas atau bank
3. WHEN admin memproses pencairan simpanan sukarela THEN sistem SHALL membuat jurnal dengan debit akun 2-1300 dan kredit akun kas atau bank
4. WHEN sistem membuat jurnal THEN sistem SHALL memvalidasi bahwa total debit sama dengan total kredit
5. WHEN sistem membuat jurnal THEN sistem SHALL menyimpan referensi jurnal pada data pengembalian

### Requirement 4

**User Story:** Sebagai admin koperasi, saya ingin sistem menyediakan tombol untuk mencetak dokumen setelah pencairan, sehingga anggota memiliki bukti resmi pengunduran diri dan pencairan simpanan.

#### Acceptance Criteria

1. WHEN pencairan simpanan selesai THEN sistem SHALL menampilkan tombol untuk mencetak surat pengunduran diri
2. WHEN pencairan simpanan selesai THEN sistem SHALL menampilkan tombol untuk mencetak bukti pencairan simpanan
3. WHEN admin mencetak surat pengunduran diri THEN sistem SHALL generate dokumen dengan identitas anggota lengkap
4. WHEN admin mencetak bukti pencairan THEN sistem SHALL generate dokumen dengan rincian simpanan yang dikembalikan
5. WHEN dokumen dicetak THEN sistem SHALL menyimpan referensi dokumen pada data anggota

### Requirement 5

**User Story:** Sebagai admin koperasi, saya ingin sistem mengupdate status anggota menjadi keluar setelah semua proses selesai, sehingga data anggota mencerminkan status terkini.

#### Acceptance Criteria

1. WHEN semua tahap wizard selesai THEN sistem SHALL mengupdate statusKeanggotaan anggota menjadi "Keluar"
2. WHEN sistem mengupdate status THEN sistem SHALL menyimpan tanggalKeluar dengan tanggal proses
3. WHEN sistem mengupdate status THEN sistem SHALL menyimpan alasanKeluar yang diinput admin
4. WHEN sistem mengupdate status THEN sistem SHALL mengupdate pengembalianStatus menjadi "Selesai"
5. WHEN sistem mengupdate status THEN sistem SHALL menyimpan pengembalianId yang mereferensi data pengembalian

### Requirement 6

**User Story:** Sebagai admin koperasi, saya ingin sistem memverifikasi bahwa semua jurnal tercatat dengan benar, sehingga tidak ada selisih keuangan setelah proses anggota keluar.

#### Acceptance Criteria

1. WHEN sistem melakukan verifikasi accounting THEN sistem SHALL mengecek bahwa semua jurnal pencairan tercatat
2. WHEN sistem melakukan verifikasi accounting THEN sistem SHALL memvalidasi bahwa total debit sama dengan total kredit
3. WHEN sistem melakukan verifikasi accounting THEN sistem SHALL memvalidasi bahwa total pencairan sesuai dengan jurnal
4. WHEN sistem melakukan verifikasi accounting THEN sistem SHALL mengecek bahwa saldo kas mencukupi
5. WHEN verifikasi gagal THEN sistem SHALL menampilkan pesan error dengan detail selisih

### Requirement 7

**User Story:** Sebagai admin koperasi, saya ingin wizard menampilkan step indicator yang jelas, sehingga saya tahu di tahap mana saya berada dalam proses.

#### Acceptance Criteria

1. WHEN wizard ditampilkan THEN sistem SHALL menampilkan step indicator dengan 5 tahap
2. WHEN admin berada di tahap tertentu THEN sistem SHALL menandai tahap tersebut sebagai aktif
3. WHEN admin menyelesaikan tahap THEN sistem SHALL menandai tahap tersebut sebagai selesai
4. WHEN admin belum mencapai tahap THEN sistem SHALL menandai tahap tersebut sebagai pending
5. WHEN admin mengklik tahap yang sudah selesai THEN sistem SHALL mengizinkan navigasi kembali ke tahap tersebut

### Requirement 8

**User Story:** Sebagai admin koperasi, saya ingin wizard memvalidasi setiap tahap sebelum lanjut, sehingga tidak ada tahap yang terlewat atau data yang tidak lengkap.

#### Acceptance Criteria

1. WHEN admin mencoba lanjut ke tahap berikutnya THEN sistem SHALL memvalidasi bahwa tahap saat ini sudah lengkap
2. WHEN validasi tahap gagal THEN sistem SHALL menampilkan pesan error dan memblokir navigasi
3. WHEN validasi tahap berhasil THEN sistem SHALL mengaktifkan tombol "Lanjut"
4. WHEN admin di tahap terakhir THEN sistem SHALL menampilkan tombol "Selesai" bukan "Lanjut"
5. WHEN admin mengklik "Batal" THEN sistem SHALL menampilkan konfirmasi sebelum membatalkan proses

### Requirement 9

**User Story:** Sebagai admin koperasi, saya ingin sistem mencatat audit log untuk setiap tahap wizard, sehingga semua proses dapat dilacak untuk keperluan audit.

#### Acceptance Criteria

1. WHEN admin memulai wizard THEN sistem SHALL mencatat audit log dengan action "START_WIZARD_ANGGOTA_KELUAR"
2. WHEN setiap tahap selesai THEN sistem SHALL mencatat audit log dengan detail tahap yang diselesaikan
3. WHEN pencairan simpanan diproses THEN sistem SHALL mencatat audit log dengan detail jumlah pencairan
4. WHEN status anggota diupdate THEN sistem SHALL mencatat audit log dengan detail perubahan status
5. WHEN wizard selesai atau dibatalkan THEN sistem SHALL mencatat audit log dengan hasil akhir

### Requirement 10

**User Story:** Sebagai admin koperasi, saya ingin sistem melakukan rollback otomatis jika terjadi error di tengah proses, sehingga data tetap konsisten dan tidak corrupt.

#### Acceptance Criteria

1. WHEN terjadi error saat membuat jurnal THEN sistem SHALL membatalkan semua perubahan dan mengembalikan ke state sebelumnya
2. WHEN terjadi error saat update status THEN sistem SHALL membatalkan semua perubahan terkait
3. WHEN rollback berhasil THEN sistem SHALL menampilkan pesan error yang jelas kepada user
4. WHEN rollback berhasil THEN sistem SHALL mencatat error di audit log
5. WHEN rollback gagal THEN sistem SHALL mencatat critical error dan menampilkan instruksi recovery manual
