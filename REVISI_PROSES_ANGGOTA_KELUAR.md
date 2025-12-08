# Revisi Proses Pencatatan Anggota Keluar

**Tanggal**: 2024-12-09  
**Status**: Proposal Revisi

---

## 📋 Kebutuhan Revisi

### Proses Saat Ini
Proses anggota keluar saat ini kurang terstruktur dan tidak memastikan:
- ❌ Hutang/piutang sudah diselesaikan
- ❌ Simpanan sudah dicairkan
- ❌ Accounting terintegrasi dengan benar
- ❌ Tidak ada selisih keuangan

### Proses Yang Diinginkan

**Urutan Proses Baru**:
1. ✅ **Validasi Hutang/Piutang** - Cek apakah anggota punya hutang/piutang
2. ✅ **Pencairan Simpanan** - Proses pengembalian semua simpanan
3. ✅ **Print Dokumen** - Cetak surat/dokumen anggota keluar
4. ✅ **Update Status** - Ubah statusKeanggotaan menjadi 'Keluar'
5. ✅ **Integrasi Accounting** - Sistem accounting otomatis terkoneksi

---

## 🎯 Tujuan Revisi

1. **Mencegah Selisih Keuangan**
   - Pastikan semua transaksi keuangan selesai sebelum anggota keluar
   - Accounting terintegrasi otomatis

2. **Proses Terstruktur**
   - Urutan yang jelas dan tidak bisa dilewati
   - Validasi di setiap tahap

3. **Data Integrity**
   - Tidak ada hutang/piutang yang tertinggal
   - Semua simpanan sudah dicairkan
   - Jurnal accounting lengkap

4. **Audit Trail**
   - Semua proses tercatat dengan baik
   - Dokumen lengkap (print)

---

## 📊 Alur Proses Baru

### Diagram Alur

```
┌─────────────────────────────────────────────────────────────┐
│  1. VALIDASI HUTANG/PIUTANG                                  │
├─────────────────────────────────────────────────────────────┤
│  - Cek apakah anggota punya pinjaman aktif                   │
│  - Cek apakah anggota punya piutang                          │
│  - Jika ada → BLOKIR proses, harus diselesaikan dulu        │
│  - Jika tidak ada → LANJUT ke tahap 2                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. PENCAIRAN SIMPANAN                                       │
├─────────────────────────────────────────────────────────────┤
│  - Hitung total simpanan (pokok + wajib + sukarela)         │
│  - Tampilkan rincian untuk konfirmasi                        │
│  - Proses pencairan dengan jurnal:                           │
│    * Debit: Simpanan Anggota (2-1100, 2-1200, 2-1300)       │
│    * Kredit: Kas (1-1000)                                    │
│  - Tandai simpanan sebagai "Dikembalikan"                    │
│  - LANJUT ke tahap 3                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. PRINT DOKUMEN                                            │
├─────────────────────────────────────────────────────────────┤
│  - Generate surat pengunduran diri                           │
│  - Generate bukti pencairan simpanan                         │
│  - Print dokumen                                             │
│  - Simpan referensi dokumen                                  │
│  - LANJUT ke tahap 4                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. UPDATE STATUS ANGGOTA                                    │
├─────────────────────────────────────────────────────────────┤
│  - Update statusKeanggotaan = 'Keluar'                       │
│  - Set tanggalKeluar = tanggal proses                        │
│  - Set pengembalianStatus = 'Selesai'                        │
│  - Simpan ke localStorage                                    │
│  - LANJUT ke tahap 5                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  5. VERIFIKASI ACCOUNTING                                    │
├─────────────────────────────────────────────────────────────┤
│  - Verifikasi semua jurnal tercatat                          │
│  - Cek saldo kas mencukupi                                   │
│  - Verifikasi tidak ada selisih                              │
│  - Generate laporan anggota keluar                           │
│  - SELESAI ✅                                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Detail Setiap Tahap

### Tahap 1: Validasi Hutang/Piutang

**Tujuan**: Memastikan anggota tidak punya kewajiban finansial

**Validasi**:
```javascript
function validateHutangPiutang(anggotaId) {
    // Cek pinjaman aktif
    const pinjaman = JSON.parse(localStorage.getItem('pinjaman') || '[]');
    const pinjamanAktif = pinjaman.filter(p => 
        p.anggotaId === anggotaId && 
        p.sisaPinjaman > 0
    );
    
    // Cek piutang
    const piutang = JSON.parse(localStorage.getItem('piutang') || '[]');
    const piutangAktif = piutang.filter(p => 
        p.anggotaId === anggotaId && 
        p.sisaPiutang > 0
    );
    
    return {
        valid: pinjamanAktif.length === 0 && piutangAktif.length === 0,
        pinjaman: pinjamanAktif,
        piutang: piutangAktif
    };
}
```

**UI**:
- ✅ Jika tidak ada hutang/piutang → Tombol "Lanjut ke Pencairan Simpanan"
- ❌ Jika ada hutang/piutang → Tampilkan peringatan dan blokir proses

**Pesan Error**:
```
⚠️ Anggota tidak dapat keluar karena masih memiliki:
- Pinjaman aktif: Rp X (harus dilunasi)
- Piutang: Rp Y (harus diselesaikan)

Silakan selesaikan kewajiban finansial terlebih dahulu.
```

---

### Tahap 2: Pencairan Simpanan

**Tujuan**: Mengembalikan semua simpanan anggota

**Perhitungan**:
```javascript
function hitungTotalSimpanan(anggotaId) {
    const simpananPokok = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
    const simpananWajib = JSON.parse(localStorage.getItem('simpananWajib') || '[]');
    const simpananSukarela = JSON.parse(localStorage.getItem('simpananSukarela') || '[]');
    
    const totalPokok = simpananPokok
        .filter(s => s.anggotaId === anggotaId && s.jumlah > 0)
        .reduce((sum, s) => sum + s.jumlah, 0);
    
    const totalWajib = simpananWajib
        .filter(s => s.anggotaId === anggotaId && s.jumlah > 0)
        .reduce((sum, s) => sum + s.jumlah, 0);
    
    const totalSukarela = simpananSukarela
        .filter(s => s.anggotaId === anggotaId && s.jumlah > 0)
        .reduce((sum, s) => sum + s.jumlah, 0);
    
    return {
        pokok: totalPokok,
        wajib: totalWajib,
        sukarela: totalSukarela,
        total: totalPokok + totalWajib + totalSukarela
    };
}
```

**Jurnal Accounting**:
```javascript
function jurnalPencairanSimpanan(anggotaId, rincian) {
    const jurnal = [];
    
    // Simpanan Pokok
    if (rincian.pokok > 0) {
        jurnal.push({
            tanggal: new Date().toISOString(),
            keterangan: `Pencairan Simpanan Pokok - ${anggotaNama}`,
            debit: [{ akun: '2-1100', jumlah: rincian.pokok }],  // Simpanan Pokok
            kredit: [{ akun: '1-1000', jumlah: rincian.pokok }]  // Kas
        });
    }
    
    // Simpanan Wajib
    if (rincian.wajib > 0) {
        jurnal.push({
            tanggal: new Date().toISOString(),
            keterangan: `Pencairan Simpanan Wajib - ${anggotaNama}`,
            debit: [{ akun: '2-1200', jumlah: rincian.wajib }],  // Simpanan Wajib
            kredit: [{ akun: '1-1000', jumlah: rincian.wajib }]  // Kas
        });
    }
    
    // Simpanan Sukarela
    if (rincian.sukarela > 0) {
        jurnal.push({
            tanggal: new Date().toISOString(),
            keterangan: `Pencairan Simpanan Sukarela - ${anggotaNama}`,
            debit: [{ akun: '2-1300', jumlah: rincian.sukarela }],  // Simpanan Sukarela
            kredit: [{ akun: '1-1000', jumlah: rincian.sukarela }]  // Kas
        });
    }
    
    // Catat semua jurnal
    jurnal.forEach(j => addJurnal(j.keterangan, j.debit.concat(j.kredit)));
}
```

**UI Konfirmasi**:
```
┌─────────────────────────────────────────────────────────┐
│  Konfirmasi Pencairan Simpanan                          │
├─────────────────────────────────────────────────────────┤
│  Anggota: Budi Santoso (NIK: 3201...)                   │
│                                                          │
│  Rincian Simpanan:                                       │
│  - Simpanan Pokok    : Rp  1.000.000                     │
│  - Simpanan Wajib    : Rp  5.000.000                     │
│  - Simpanan Sukarela : Rp  3.000.000                     │
│  ─────────────────────────────────────                   │
│  Total Pencairan     : Rp  9.000.000                     │
│                                                          │
│  Saldo Kas Saat Ini  : Rp 50.000.000                     │
│  Saldo Kas Setelah   : Rp 41.000.000                     │
│                                                          │
│  [Batal]  [Proses Pencairan]                            │
└─────────────────────────────────────────────────────────┘
```

---

### Tahap 3: Print Dokumen

**Tujuan**: Mencetak dokumen resmi untuk arsip

**Dokumen yang Dicetak**:

1. **Surat Pengunduran Diri**
   - Nama anggota
   - Tanggal keluar
   - Alasan (opsional)
   - Tanda tangan

2. **Bukti Pencairan Simpanan**
   - Rincian simpanan yang dicairkan
   - Total pencairan
   - Tanggal pencairan
   - Tanda tangan penerima dan kasir

**Implementasi**:
```javascript
function printDokumenAnggotaKeluar(anggotaId) {
    // Generate surat pengunduran diri
    const suratPengunduran = generateSuratPengunduran(anggotaId);
    
    // Generate bukti pencairan
    const buktiPencairan = generateBuktiPencairan(anggotaId);
    
    // Print
    window.print();
    
    // Simpan referensi dokumen
    return {
        suratId: suratPengunduran.id,
        buktiId: buktiPencairan.id,
        tanggalPrint: new Date().toISOString()
    };
}
```

---

### Tahap 4: Update Status Anggota

**Tujuan**: Mengubah status anggota menjadi keluar

**Update Data**:
```javascript
function updateStatusAnggotaKeluar(anggotaId, dokumenRef) {
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const index = anggota.findIndex(a => a.id === anggotaId);
    
    if (index !== -1) {
        anggota[index].statusKeanggotaan = 'Keluar';
        anggota[index].tanggalKeluar = new Date().toISOString();
        anggota[index].pengembalianStatus = 'Selesai';
        anggota[index].dokumenKeluar = dokumenRef;
        
        localStorage.setItem('anggota', JSON.stringify(anggota));
    }
}
```

---

### Tahap 5: Verifikasi Accounting

**Tujuan**: Memastikan tidak ada selisih keuangan

**Verifikasi**:
```javascript
function verifikasiAccounting(anggotaId, totalPencairan) {
    // 1. Cek semua jurnal tercatat
    const jurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
    const jurnalAnggota = jurnal.filter(j => 
        j.keterangan.includes(anggotaId) &&
        j.tanggal === new Date().toISOString().split('T')[0]
    );
    
    // 2. Cek saldo kas
    const saldoKas = hitungSaldoKas();
    
    // 3. Verifikasi tidak ada selisih
    const totalDebit = jurnalAnggota.reduce((sum, j) => 
        sum + j.entries.filter(e => e.debit > 0).reduce((s, e) => s + e.debit, 0), 0
    );
    const totalKredit = jurnalAnggota.reduce((sum, j) => 
        sum + j.entries.filter(e => e.kredit > 0).reduce((s, e) => s + e.kredit, 0), 0
    );
    
    return {
        valid: totalDebit === totalKredit && totalKredit === totalPencairan,
        saldoKas: saldoKas,
        totalDebit: totalDebit,
        totalKredit: totalKredit,
        selisih: totalDebit - totalKredit
    };
}
```

---

## 🎨 UI/UX Design

### Wizard Interface

**Step Indicator**:
```
[1. Validasi] → [2. Pencairan] → [3. Print] → [4. Selesai]
   ✅              ⏳              ⏸️            ⏸️
```

**Tombol Navigasi**:
- **Kembali**: Kembali ke tahap sebelumnya (jika diperlukan)
- **Batal**: Batalkan seluruh proses
- **Lanjut**: Lanjut ke tahap berikutnya (hanya aktif jika validasi OK)

---

## 📝 Implementasi

### File yang Perlu Dibuat/Dimodifikasi

1. **js/anggotaKeluarWizard.js** (BARU)
   - Wizard untuk proses anggota keluar
   - Validasi setiap tahap
   - Integrasi dengan accounting

2. **js/anggotaKeluarManager.js** (MODIFIKASI)
   - Tambahkan fungsi validasi hutang/piutang
   - Tambahkan fungsi pencairan simpanan
   - Tambahkan fungsi verifikasi accounting

3. **js/anggotaKeluarUI.js** (MODIFIKASI)
   - Update UI untuk wizard
   - Tambahkan konfirmasi di setiap tahap

4. **anggota_keluar.html** (MODIFIKASI)
   - Tambahkan wizard interface
   - Tambahkan step indicator

---

## ✅ Checklist Implementasi

### Tahap 1: Validasi Hutang/Piutang
- [ ] Fungsi `validateHutangPiutang()`
- [ ] UI peringatan jika ada hutang/piutang
- [ ] Blokir proses jika validasi gagal

### Tahap 2: Pencairan Simpanan
- [ ] Fungsi `hitungTotalSimpanan()`
- [ ] Fungsi `jurnalPencairanSimpanan()`
- [ ] UI konfirmasi pencairan
- [ ] Validasi saldo kas mencukupi

### Tahap 3: Print Dokumen
- [ ] Template surat pengunduran diri
- [ ] Template bukti pencairan
- [ ] Fungsi print
- [ ] Simpan referensi dokumen

### Tahap 4: Update Status
- [ ] Fungsi `updateStatusAnggotaKeluar()`
- [ ] Update semua field yang diperlukan
- [ ] Simpan ke localStorage

### Tahap 5: Verifikasi Accounting
- [ ] Fungsi `verifikasiAccounting()`
- [ ] Cek semua jurnal tercatat
- [ ] Verifikasi tidak ada selisih
- [ ] Generate laporan

### UI/UX
- [ ] Wizard interface dengan step indicator
- [ ] Tombol navigasi (Kembali, Batal, Lanjut)
- [ ] Konfirmasi di setiap tahap
- [ ] Pesan error yang jelas

---

## 🎯 Manfaat Revisi

1. **Mencegah Selisih Keuangan** ✅
   - Semua transaksi tercatat dengan benar
   - Jurnal accounting lengkap
   - Verifikasi otomatis

2. **Proses Terstruktur** ✅
   - Urutan yang jelas
   - Tidak bisa dilewati
   - Validasi di setiap tahap

3. **Data Integrity** ✅
   - Tidak ada hutang/piutang tertinggal
   - Semua simpanan dicairkan
   - Status anggota akurat

4. **Audit Trail** ✅
   - Semua proses tercatat
   - Dokumen lengkap
   - Mudah dilacak

---

## 📊 Estimasi Waktu Implementasi

- **Tahap 1 (Validasi)**: 2-3 jam
- **Tahap 2 (Pencairan)**: 3-4 jam
- **Tahap 3 (Print)**: 2-3 jam
- **Tahap 4 (Update Status)**: 1-2 jam
- **Tahap 5 (Verifikasi)**: 2-3 jam
- **UI/UX Wizard**: 3-4 jam
- **Testing**: 2-3 jam

**Total**: 15-22 jam (2-3 hari kerja)

---

## 🚀 Next Steps

1. **Review Proposal** - Konfirmasi apakah alur ini sudah sesuai
2. **Create Spec** - Buat spec lengkap dengan requirements dan design
3. **Implementation** - Implementasi step-by-step
4. **Testing** - Test setiap tahap
5. **Deployment** - Deploy ke production

---

**Status**: Menunggu konfirmasi untuk lanjut ke pembuatan spec lengkap
