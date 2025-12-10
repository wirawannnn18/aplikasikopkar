# Panduan Lengkap Proses Anggota Keluar

## Overview
Panduan ini menjelaskan proses lengkap untuk menangani anggota yang keluar dari koperasi, termasuk pencairan simpanan, jurnal akuntansi, dan pengelolaan data.

---

## 🎯 Tujuan Proses Anggota Keluar

1. **Pencairan Simpanan**: Mengembalikan semua simpanan anggota (pokok, wajib, sukarela)
2. **Jurnal Akuntansi**: Mencatat transaksi pencairan dengan benar
3. **Update Status**: Mengubah status keanggotaan menjadi "Keluar"
4. **Filtering Data**: Memastikan anggota keluar tidak muncul di transaksi aktif
5. **Audit Trail**: Menyimpan data untuk keperluan audit dan laporan

---

## 📋 Langkah-langkah Proses Anggota Keluar

### 1. Persiapan Data Anggota

**Syarat Anggota Keluar:**
- Tidak memiliki pinjaman yang belum lunas
- Tidak memiliki hutang yang belum dibayar
- Sudah mengajukan surat pengunduran diri

**Verifikasi:**
```javascript
// Cek pinjaman aktif
const pinjaman = getPinjamanByAnggota(anggotaId);
const hasActiveLoan = pinjaman.some(p => p.sisaPinjaman > 0);

// Cek hutang aktif  
const hutang = getHutangByAnggota(anggotaId);
const hasActiveDebt = hutang.some(h => h.sisaHutang > 0);

if (hasActiveLoan || hasActiveDebt) {
    alert('Anggota masih memiliki pinjaman/hutang yang belum lunas');
    return false;
}
```

### 2. Perhitungan Total Pengembalian

**Komponen Simpanan:**
- **Simpanan Pokok**: Jumlah tetap sesuai ketentuan
- **Simpanan Wajib**: Akumulasi simpanan bulanan
- **Simpanan Sukarela**: Saldo yang tersedia

**Perhitungan:**
```javascript
function hitungTotalPengembalian(anggotaId) {
    const anggota = getAnggotaById(anggotaId);
    
    const simpananPokok = anggota.simpananPokok || 0;
    const simpananWajib = anggota.simpananWajib || 0;
    const simpananSukarela = anggota.simpananSukarela || 0;
    
    const total = simpananPokok + simpananWajib + simpananSukarela;
    
    return {
        simpananPokok,
        simpananWajib, 
        simpananSukarela,
        total
    };
}
```

### 3. Verifikasi Saldo Kas

**Cek Ketersediaan Kas:**
```javascript
function verifikasiSaldoKas(jumlahPencairan) {
    const saldoKas = getSaldoKas();
    
    if (saldoKas < jumlahPencairan) {
        alert(`Saldo kas tidak mencukupi. Tersedia: ${formatRupiah(saldoKas)}, Dibutuhkan: ${formatRupiah(jumlahPencairan)}`);
        return false;
    }
    
    return true;
}
```

### 4. Proses Pencairan Simpanan

**Menggunakan Wizard Anggota Keluar:**

**Step 1: Input Data Keluar**
- Tanggal keluar
- Alasan keluar
- Catatan tambahan

**Step 2: Perhitungan & Konfirmasi**
- Tampilkan rincian simpanan
- Hitung total pengembalian
- Konfirmasi pencairan

**Step 3: Proses Pencairan**
```javascript
function prosesPencairanSimpanan(anggotaId, tanggalKeluar) {
    try {
        const anggota = getAnggotaById(anggotaId);
        const pengembalian = hitungTotalPengembalian(anggotaId);
        
        // 1. Verifikasi saldo kas
        if (!verifikasiSaldoKas(pengembalian.total)) {
            return false;
        }
        
        // 2. Buat jurnal pencairan
        createPencairanJournal(anggotaId, pengembalian, tanggalKeluar);
        
        // 3. Zero-kan saldo simpanan
        zeroSimpananPokok(anggotaId);
        zeroSimpananWajib(anggotaId);
        zeroSimpananSukarela(anggotaId);
        
        // 4. Update status anggota
        updateStatusAnggotaKeluar(anggotaId, tanggalKeluar);
        
        // 5. Update saldo kas
        updateSaldoKas(-pengembalian.total);
        
        return true;
        
    } catch (error) {
        console.error('Error proses pencairan:', error);
        alert('Terjadi kesalahan saat proses pencairan');
        return false;
    }
}
```

### 5. Jurnal Akuntansi

**Pencatatan Jurnal:**
```javascript
function createPencairanJournal(anggotaId, pengembalian, tanggal) {
    const anggota = getAnggotaById(anggotaId);
    const jurnal = [];
    
    // Debit: Simpanan Pokok
    if (pengembalian.simpananPokok > 0) {
        jurnal.push({
            tanggal: tanggal,
            keterangan: `Pencairan Simpanan Pokok - ${anggota.nama}`,
            akun: 'Simpanan Pokok',
            debit: pengembalian.simpananPokok,
            kredit: 0
        });
    }
    
    // Debit: Simpanan Wajib  
    if (pengembalian.simpananWajib > 0) {
        jurnal.push({
            tanggal: tanggal,
            keterangan: `Pencairan Simpanan Wajib - ${anggota.nama}`,
            akun: 'Simpanan Wajib',
            debit: pengembalian.simpananWajib,
            kredit: 0
        });
    }
    
    // Debit: Simpanan Sukarela
    if (pengembalian.simpananSukarela > 0) {
        jurnal.push({
            tanggal: tanggal,
            keterangan: `Pencairan Simpanan Sukarela - ${anggota.nama}`,
            akun: 'Simpanan Sukarela', 
            debit: pengembalian.simpananSukarela,
            kredit: 0
        });
    }
    
    // Kredit: Kas
    jurnal.push({
        tanggal: tanggal,
        keterangan: `Pencairan Simpanan - ${anggota.nama}`,
        akun: 'Kas',
        debit: 0,
        kredit: pengembalian.total
    });
    
    // Simpan jurnal
    saveJurnal(jurnal);
}
```

### 6. Update Status Anggota

```javascript
function updateStatusAnggotaKeluar(anggotaId, tanggalKeluar) {
    const anggota = getAnggotaById(anggotaId);
    
    anggota.statusKeanggotaan = 'Keluar';
    anggota.tanggalKeluar = tanggalKeluar;
    anggota.pengembalianStatus = 'Selesai';
    
    updateAnggota(anggota);
}
```

---

## 🔍 Filtering dan Validasi

### 1. Master Anggota
- **Tampilan**: Hanya anggota dengan `statusKeanggotaan !== 'Keluar'`
- **Pencarian**: Exclude anggota keluar dari hasil search
- **Export**: Anggota keluar tidak termasuk dalam export

### 2. Dropdown Transaksi
- **Simpanan**: Hanya anggota aktif (`statusKeanggotaan === 'Aktif'`)
- **Pinjaman**: Hanya anggota aktif dan tidak keluar
- **POS**: Hanya anggota yang bisa bertransaksi
- **Hutang/Piutang**: Filter anggota transactable

### 3. Validasi Transaksi
```javascript
function validateAnggotaForTransaction(anggotaId) {
    const anggota = getAnggotaById(anggotaId);
    
    if (!anggota) {
        return { valid: false, message: 'Anggota tidak ditemukan' };
    }
    
    if (anggota.statusKeanggotaan === 'Keluar') {
        return { valid: false, message: 'Anggota sudah keluar, tidak dapat bertransaksi' };
    }
    
    if (anggota.statusKeanggotaan !== 'Aktif') {
        return { valid: false, message: 'Anggota tidak aktif, tidak dapat bertransaksi' };
    }
    
    return { valid: true };
}
```

---

## 📊 Laporan dan Monitoring

### 1. Laporan Simpanan
- **Filter**: Exclude saldo zero setelah pencairan
- **Tampilan**: Hanya anggota dengan saldo > 0
- **Export**: CSV tanpa anggota yang sudah dicairkan

### 2. Laporan Anggota Keluar
- **Akses**: Menu khusus "Anggota Keluar"
- **Data**: Semua anggota dengan `statusKeanggotaan === 'Keluar'`
- **Info**: Tanggal keluar, status pengembalian, saldo (harus 0)

### 3. Audit Trail
- **Jurnal**: Semua transaksi pencairan tercatat
- **Data**: Anggota keluar tetap tersimpan di localStorage
- **History**: Riwayat transaksi sebelum keluar tetap ada

---

## ⚠️ Hal Penting yang Harus Diperhatikan

### 1. Validasi Sebelum Proses
- ✅ Cek pinjaman aktif
- ✅ Cek hutang yang belum lunas  
- ✅ Verifikasi saldo kas mencukupi
- ✅ Konfirmasi data anggota

### 2. Proses Pencairan
- ✅ Buat jurnal SEBELUM zero-kan saldo
- ✅ Update saldo kas dengan benar
- ✅ Simpan semua perubahan secara atomic
- ✅ Handle error dengan graceful

### 3. Setelah Proses
- ✅ Verifikasi saldo simpanan = 0
- ✅ Cek jurnal sudah tercatat
- ✅ Pastikan anggota tidak muncul di dropdown
- ✅ Test transaksi ditolak untuk anggota keluar

### 4. Data Integrity
- ✅ Data anggota keluar tetap tersimpan
- ✅ History transaksi tidak hilang
- ✅ Audit trail lengkap
- ✅ Backup data sebelum proses

---

## 🚨 Troubleshooting

### Error: "Saldo kas tidak mencukupi"
**Solusi:**
1. Cek saldo kas aktual
2. Tunda pencairan sampai kas mencukupi
3. Atau lakukan pencairan bertahap

### Error: "Anggota masih memiliki pinjaman"
**Solusi:**
1. Lunasi pinjaman terlebih dahulu
2. Atau sesuaikan dengan kebijakan koperasi
3. Update status pinjaman jika sudah lunas

### Error: "Jurnal tidak seimbang"
**Solusi:**
1. Cek perhitungan total simpanan
2. Verifikasi mapping akun COA
3. Pastikan debit = kredit

### Anggota keluar masih muncul di dropdown
**Solusi:**
1. Refresh halaman
2. Cek `statusKeanggotaan` di data
3. Verifikasi fungsi filtering

---

## 📝 Checklist Proses Anggota Keluar

### Sebelum Proses:
- [ ] Anggota mengajukan surat pengunduran diri
- [ ] Verifikasi tidak ada pinjaman aktif
- [ ] Verifikasi tidak ada hutang yang belum lunas
- [ ] Cek saldo kas mencukupi untuk pencairan
- [ ] Backup data sebelum proses

### Saat Proses:
- [ ] Gunakan Wizard Anggota Keluar
- [ ] Input tanggal keluar dengan benar
- [ ] Verifikasi perhitungan total pengembalian
- [ ] Konfirmasi sebelum eksekusi
- [ ] Monitor proses sampai selesai

### Setelah Proses:
- [ ] Verifikasi saldo simpanan = 0
- [ ] Cek jurnal sudah tercatat dengan benar
- [ ] Pastikan saldo kas berkurang sesuai pencairan
- [ ] Test anggota tidak muncul di Master Anggota
- [ ] Test transaksi ditolak untuk anggota keluar
- [ ] Verifikasi anggota muncul di menu "Anggota Keluar"

### Dokumentasi:
- [ ] Cetak bukti pencairan simpanan
- [ ] Simpan surat pengunduran diri
- [ ] Update catatan keanggotaan
- [ ] Arsipkan dokumen terkait

---

## 🎯 Kesimpulan

Proses anggota keluar yang benar memastikan:

1. **Akuntansi Akurat**: Jurnal pencairan tercatat dengan benar
2. **Data Integrity**: Anggota keluar tidak mengganggu transaksi aktif
3. **Audit Trail**: Semua data tersimpan untuk keperluan audit
4. **User Experience**: Interface yang jelas dan mudah digunakan
5. **Error Handling**: Proses yang robust dengan validasi lengkap

Dengan mengikuti panduan ini, proses anggota keluar akan berjalan lancar dan sesuai dengan standar akuntansi koperasi.