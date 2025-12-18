# Troubleshooting Guide - Tutup Kasir POS

## Daftar Isi
1. [Masalah Umum](#masalah-umum)
2. [Error Messages](#error-messages)
3. [Masalah Print](#masalah-print)
4. [Masalah Data](#masalah-data)
5. [Masalah Performance](#masalah-performance)
6. [Recovery Procedures](#recovery-procedures)
7. [Diagnostic Tools](#diagnostic-tools)

---

## Masalah Umum

### 1. Tombol Tutup Kasir Tidak Muncul

**Gejala:**
- Tombol "Tutup Kasir" tidak terlihat di header POS
- Header POS kosong atau tidak lengkap

**Diagnosis:**
1. Cek apakah sudah buka kas:
   ```javascript
   console.log(sessionStorage.getItem('bukaKas'));
   ```
   Jika `null`, berarti belum buka kas.

2. Cek session data:
   ```javascript
   const bukaKas = JSON.parse(sessionStorage.getItem('bukaKas'));
   console.log('Session data:', bukaKas);
   ```

**Solusi:**
1. **Belum Buka Kas:**
   - Masuk ke menu Keuangan → Buka Kas
   - Input modal awal dan klik "Buka Kas"

2. **Session Hilang:**
   - Refresh halaman (F5)
   - Jika masih hilang, logout dan login kembali
   - Buka kas ulang

3. **CSS/Layout Issue:**
   - Cek browser console untuk error CSS
   - Clear browser cache (Ctrl+Shift+Delete)
   - Coba browser lain

**Pencegahan:**
- Jangan gunakan private/incognito mode
- Jangan clear browser data saat shift aktif
- Bookmark halaman POS untuk akses cepat

### 2. Modal Tutup Kasir Tidak Terbuka

**Gejala:**
- Klik tombol "Tutup Kasir" tidak ada respon
- Modal muncul tapi kosong/error
- JavaScript error di console

**Diagnosis:**
1. Buka browser console (F12)
2. Cari error message saat klik tombol
3. Cek apakah Bootstrap JS loaded:
   ```javascript
   console.log(typeof bootstrap);
   ```

**Solusi:**
1. **JavaScript Error:**
   - Refresh halaman
   - Clear browser cache
   - Disable browser extensions sementara

2. **Bootstrap Not Loaded:**
   - Cek koneksi internet
   - Refresh halaman
   - Hubungi admin jika CDN bermasalah

3. **Session Corrupted:**
   ```javascript
   // Clear corrupted session
   sessionStorage.removeItem('bukaKas');
   localStorage.removeItem('bukaKas_backup');
   ```
   - Logout dan login kembali
   - Buka kas ulang

### 3. Perhitungan Selisih Tidak Akurat

**Gejala:**
- Selisih kas tidak sesuai perhitungan manual
- Angka selisih aneh (NaN, Infinity, dll)
- Kas seharusnya salah

**Diagnosis:**
1. Cek data penjualan:
   ```javascript
   const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
   console.log('Transactions:', transactions);
   ```

2. Cek perhitungan:
   ```javascript
   const bukaKas = JSON.parse(sessionStorage.getItem('bukaKas'));
   const modalAwal = bukaKas.modalAwal;
   const totalCash = transactions
     .filter(t => t.metodePembayaran === 'cash')
     .reduce((sum, t) => sum + t.total, 0);
   const kasSeharusnya = modalAwal + totalCash;
   console.log('Modal:', modalAwal, 'Cash:', totalCash, 'Seharusnya:', kasSeharusnya);
   ```

**Solusi:**
1. **Data Transaksi Corrupted:**
   - Export data transaksi untuk backup
   - Hitung manual berdasarkan struk
   - Input manual jika perlu

2. **Floating Point Error:**
   - Sistem sudah handle ini, tapi jika masih ada:
   - Round ke 2 decimal places
   - Gunakan integer (dalam sen) untuk perhitungan

3. **Missing Transactions:**
   - Cek apakah ada transaksi yang belum tercatat
   - Bandingkan dengan struk fisik
   - Input transaksi yang missing

### 4. Validasi Input Bermasalah

**Gejala:**
- Tidak bisa input kas aktual
- Validasi error meskipun input benar
- Field keterangan tidak muncul saat ada selisih

**Diagnosis:**
1. Cek validation rules:
   ```javascript
   const kasAktual = document.getElementById('kasAktual').value;
   console.log('Input value:', kasAktual, 'Type:', typeof kasAktual);
   ```

2. Cek selisih calculation:
   ```javascript
   const selisih = parseFloat(kasAktual) - kasSeharusnya;
   console.log('Selisih:', selisih, 'Abs:', Math.abs(selisih));
   ```

**Solusi:**
1. **Input Validation:**
   - Pastikan input hanya angka
   - Tidak boleh negatif
   - Maksimal 999,999,999

2. **Keterangan Field:**
   - Muncul otomatis jika |selisih| > 0.01
   - Refresh modal jika tidak muncul
   - Cek JavaScript console untuk error

---

## Error Messages

### Session Errors

#### "Belum ada kas yang dibuka"
**Penyebab:** Session buka kas tidak ditemukan
**Solusi:**
1. Buka kas terlebih dahulu
2. Jika sudah buka kas tapi masih error:
   ```javascript
   // Cek session
   console.log(sessionStorage.getItem('bukaKas'));
   ```
3. Jika null, buka kas ulang

#### "Session tidak ditemukan"
**Penyebab:** Data session hilang atau corrupted
**Solusi:**
1. Logout dan login kembali
2. Buka kas ulang
3. Jika berulang, clear browser data

#### "Session rusak dan tidak dapat dipulihkan"
**Penyebab:** Data session corrupted dan backup juga rusak
**Solusi:**
1. Clear semua session data:
   ```javascript
   sessionStorage.clear();
   localStorage.removeItem('bukaKas_backup');
   ```
2. Logout dan login kembali
3. Buka kas ulang dengan data yang benar

### Validation Errors

#### "Kas aktual harus berupa angka positif"
**Penyebab:** Input kas aktual tidak valid
**Solusi:**
1. Input hanya angka (tanpa titik/koma untuk ribuan)
2. Tidak boleh negatif
3. Contoh benar: 1500000 (untuk Rp 1.500.000)

#### "Kas aktual terlalu besar"
**Penyebab:** Input melebihi batas maksimal (999,999,999)
**Solusi:**
1. Periksa ulang jumlah kas aktual
2. Jika benar segitu, hubungi admin untuk adjust limit

#### "Keterangan wajib diisi"
**Penyebab:** Ada selisih kas tapi keterangan kosong
**Solusi:**
1. Isi keterangan dengan penjelasan yang jelas
2. Minimal 10 karakter
3. Jelaskan penyebab selisih

### Storage Errors

#### "Penyimpanan penuh"
**Penyebab:** localStorage quota exceeded
**Solusi:**
1. Sistem akan otomatis cleanup data lama
2. Tunggu proses selesai
3. Jika masih error, manual cleanup:
   ```javascript
   // Backup data penting dulu
   const riwayat = localStorage.getItem('riwayatTutupKas');
   
   // Clear storage
   localStorage.clear();
   
   // Restore data penting
   localStorage.setItem('riwayatTutupKas', riwayat);
   ```

#### "Tidak dapat menyimpan data"
**Penyebab:** localStorage tidak tersedia atau disabled
**Solusi:**
1. Enable localStorage di browser settings
2. Jangan gunakan private/incognito mode
3. Cek browser compatibility

### Print Errors

#### "Gagal mencetak laporan"
**Penyebab:** Printer tidak tersedia atau popup blocked
**Solusi:**
1. Allow popup dari aplikasi
2. Cek koneksi printer
3. Gunakan alternatif:
   - Download PDF
   - Kirim email
   - Print ulang dari riwayat

---

## Masalah Print

### Print Window Tidak Terbuka

**Diagnosis:**
1. Cek popup blocker:
   - Lihat icon popup di address bar
   - Allow popup dari domain aplikasi

2. Cek printer connection:
   - Test print dari aplikasi lain
   - Pastikan printer online

**Solusi:**
1. **Popup Blocked:**
   - Klik icon popup di browser
   - Select "Always allow popups from this site"
   - Retry print

2. **Printer Offline:**
   - Cek kabel/WiFi printer
   - Restart printer
   - Set as default printer

3. **Browser Issue:**
   - Try different browser
   - Update browser to latest version
   - Disable extensions temporarily

### Print Quality Issues

**Gejala:**
- Laporan terpotong
- Font terlalu kecil/besar
- Layout berantakan

**Solusi:**
1. **Page Setup:**
   - Set paper size to A4
   - Margins: 1cm all sides
   - Scale: 100%

2. **Print Settings:**
   - Select correct printer
   - Quality: Normal/High
   - Color: Black & White (untuk hemat tinta)

3. **Browser Print Settings:**
   - Remove headers/footers
   - Background graphics: Off
   - Shrink to fit: On

### Alternative Print Methods

**Jika print normal gagal:**

1. **Download PDF:**
   - Sistem akan generate HTML file
   - Open di browser
   - Print to PDF
   - Print PDF file

2. **Email Report:**
   - Sistem buka email client
   - Send ke email supervisor
   - Print dari email

3. **Save and Print Later:**
   - Data tersimpan di sistem
   - Print ulang dari menu riwayat
   - Akses kapan saja

---

## Masalah Data

### Data Tidak Tersimpan

**Gejala:**
- Setelah tutup kasir, data tidak muncul di riwayat
- Error saat save
- Data hilang setelah refresh

**Diagnosis:**
1. Cek localStorage:
   ```javascript
   const riwayat = localStorage.getItem('riwayatTutupKas');
   console.log('Riwayat:', riwayat ? JSON.parse(riwayat) : 'Empty');
   ```

2. Cek storage quota:
   ```javascript
   function checkStorageQuota() {
     if ('storage' in navigator && 'estimate' in navigator.storage) {
       navigator.storage.estimate().then(estimate => {
         console.log('Storage used:', estimate.usage);
         console.log('Storage quota:', estimate.quota);
         console.log('Usage %:', (estimate.usage / estimate.quota * 100).toFixed(2));
       });
     }
   }
   checkStorageQuota();
   ```

**Solusi:**
1. **Storage Full:**
   - Export data lama
   - Clear old data
   - Retry save

2. **Browser Restrictions:**
   - Don't use private mode
   - Enable localStorage in settings
   - Add site to exceptions

3. **Data Corruption:**
   - Check backup:
     ```javascript
     const backup = localStorage.getItem('riwayatTutupKas_backup');
     if (backup) {
       localStorage.setItem('riwayatTutupKas', backup);
     }
     ```

### Data Inconsistency

**Gejala:**
- Riwayat menampilkan data yang salah
- Perhitungan tidak konsisten
- Missing fields

**Diagnosis:**
1. Validate data structure:
   ```javascript
   const riwayat = JSON.parse(localStorage.getItem('riwayatTutupKas') || '[]');
   riwayat.forEach((item, index) => {
     const required = ['id', 'kasir', 'modalAwal', 'kasAktual', 'selisih'];
     const missing = required.filter(field => !item[field] && item[field] !== 0);
     if (missing.length > 0) {
       console.log(`Item ${index} missing:`, missing);
     }
   });
   ```

**Solusi:**
1. **Missing Fields:**
   - Reconstruct from available data
   - Set default values for optional fields
   - Mark as "Data Incomplete" if critical fields missing

2. **Wrong Calculations:**
   - Recalculate selisih:
     ```javascript
     item.selisih = item.kasAktual - (item.modalAwal + item.totalCash);
     ```
   - Update localStorage with corrected data

### Data Migration

**Saat update sistem:**

1. **Backup Current Data:**
   ```javascript
   const backup = {
     riwayatTutupKas: localStorage.getItem('riwayatTutupKas'),
     bukaKas: sessionStorage.getItem('bukaKas'),
     timestamp: new Date().toISOString()
   };
   console.log('Backup:', JSON.stringify(backup));
   ```

2. **Validate After Migration:**
   - Check all required fields exist
   - Verify calculations are correct
   - Test basic functionality

---

## Masalah Performance

### Modal Loading Lambat

**Gejala:**
- Modal tutup kasir lama terbuka
- Hang saat klik tombol
- Browser freeze

**Diagnosis:**
1. Cek jumlah transaksi:
   ```javascript
   const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
   console.log('Total transactions:', transactions.length);
   ```

2. Cek memory usage:
   ```javascript
   console.log('Memory:', performance.memory);
   ```

**Solusi:**
1. **Too Many Transactions:**
   - Archive old transactions
   - Keep only current shift data
   - Implement pagination

2. **Memory Issues:**
   - Close other browser tabs
   - Restart browser
   - Clear browser cache

3. **Optimize Calculations:**
   - Cache calculated values
   - Use efficient algorithms
   - Avoid unnecessary DOM updates

### Browser Compatibility

**Masalah di browser lama:**

1. **localStorage Not Supported:**
   - Upgrade browser
   - Use polyfill if needed
   - Fallback to cookies

2. **ES6 Features Not Supported:**
   - Use transpiled version
   - Avoid arrow functions in old browsers
   - Use var instead of let/const

3. **CSS Issues:**
   - Use vendor prefixes
   - Fallback for flexbox
   - Test in target browsers

---

## Recovery Procedures

### Session Recovery

**Jika session hilang tapi shift masih aktif:**

1. **Check Backup:**
   ```javascript
   const backup = localStorage.getItem('bukaKas_backup');
   if (backup) {
     sessionStorage.setItem('bukaKas', backup);
     location.reload();
   }
   ```

2. **Manual Recovery:**
   ```javascript
   // Reconstruct session from riwayat
   const riwayat = JSON.parse(localStorage.getItem('riwayatTutupKas') || '[]');
   const lastShift = riwayat[riwayat.length - 1];
   
   if (lastShift && !lastShift.waktuTutup) {
     // Shift masih aktif
     const sessionData = {
       id: lastShift.shiftId,
       kasir: lastShift.kasir,
       kasirId: lastShift.kasirId,
       modalAwal: lastShift.modalAwal,
       waktuBuka: lastShift.waktuBuka,
       tanggal: new Date().toLocaleDateString()
     };
     sessionStorage.setItem('bukaKas', JSON.stringify(sessionData));
   }
   ```

### Data Recovery

**Jika data riwayat hilang:**

1. **Check Browser History:**
   - Look for cached pages
   - Check browser developer tools
   - Look for temporary files

2. **Reconstruct from Journals:**
   - Check accounting journals
   - Look for tutup kasir entries
   - Rebuild riwayat from journal data

3. **Manual Entry:**
   - Input data manually from printed reports
   - Verify with supervisor
   - Mark as "Reconstructed Data"

### System Recovery

**Jika sistem completely broken:**

1. **Emergency Procedure:**
   - Document current state
   - Take screenshots
   - Note error messages
   - Contact admin immediately

2. **Temporary Workaround:**
   - Use manual tutup kasir process
   - Print manual receipt
   - Input to system later when fixed

3. **Data Preservation:**
   - Export all localStorage data
   - Backup to external file
   - Don't clear browser data until fixed

---

## Diagnostic Tools

### Browser Console Commands

**Check System Status:**
```javascript
// Check error handler status
if (window.errorHandler) {
  console.log('Error Handler:', window.errorHandler.getErrorStats());
} else {
  console.log('Error Handler: Not loaded');
}

// Check session data
console.log('Session:', sessionStorage.getItem('bukaKas'));

// Check riwayat data
const riwayat = localStorage.getItem('riwayatTutupKas');
console.log('Riwayat count:', riwayat ? JSON.parse(riwayat).length : 0);

// Check storage usage
for (let key in localStorage) {
  if (localStorage.hasOwnProperty(key)) {
    console.log(key, localStorage[key].length, 'chars');
  }
}
```

**Test Functions:**
```javascript
// Test modal opening
if (window.enhancedTutupKasir) {
  window.enhancedTutupKasir.showTutupKasirModal();
} else {
  console.log('Enhanced Tutup Kasir not loaded');
}

// Test error handling
window.errorHandler.logError('Test Error', new Error('Test message'));

// Test validation
const validation = window.errorHandler.validateInput('1000', 'currency', 'Test');
console.log('Validation result:', validation);
```

### Performance Monitoring

**Monitor Performance:**
```javascript
// Monitor modal opening time
console.time('Modal Open');
// ... open modal ...
console.timeEnd('Modal Open');

// Monitor calculation time
console.time('Calculation');
// ... do calculations ...
console.timeEnd('Calculation');

// Monitor memory usage
setInterval(() => {
  if (performance.memory) {
    console.log('Memory:', {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
    });
  }
}, 5000);
```

### Error Logging

**Export Error Log:**
```javascript
// Export error log for analysis
if (window.errorHandler) {
  window.errorHandler.exportErrorLog();
}

// Manual error log check
const errorLog = localStorage.getItem('errorLog');
if (errorLog) {
  const errors = JSON.parse(errorLog);
  console.log('Recent errors:', errors.slice(-10));
}
```

### Health Check

**System Health Check:**
```javascript
function systemHealthCheck() {
  const health = {
    timestamp: new Date().toISOString(),
    browser: navigator.userAgent,
    localStorage: {
      available: typeof Storage !== 'undefined',
      quota: 'unknown'
    },
    session: {
      bukaKas: !!sessionStorage.getItem('bukaKas'),
      valid: false
    },
    errorHandler: !!window.errorHandler,
    enhancedTutupKasir: !!window.enhancedTutupKasir
  };

  // Check session validity
  try {
    const bukaKas = JSON.parse(sessionStorage.getItem('bukaKas'));
    if (bukaKas && bukaKas.id && bukaKas.kasir) {
      health.session.valid = true;
    }
  } catch (e) {
    health.session.error = e.message;
  }

  // Check storage quota
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    navigator.storage.estimate().then(estimate => {
      health.localStorage.quota = {
        used: estimate.usage,
        total: estimate.quota,
        percentage: (estimate.usage / estimate.quota * 100).toFixed(2) + '%'
      };
      console.log('System Health:', health);
    });
  } else {
    console.log('System Health:', health);
  }

  return health;
}

// Run health check
systemHealthCheck();
```

---

## Escalation Matrix

### Level 1: User Self-Service
**Masalah yang bisa diselesaikan sendiri:**
- Tombol tidak muncul → Refresh/buka kas ulang
- Modal tidak terbuka → Clear cache/restart browser
- Print gagal → Gunakan alternatif (PDF/Email)
- Input validation error → Perbaiki input

**Waktu resolusi:** 5-15 menit

### Level 2: Supervisor Support
**Masalah yang perlu bantuan supervisor:**
- Data tidak konsisten → Verifikasi manual
- Selisih kas besar → Investigasi bersama
- Session hilang berulang → Cek prosedur kerja
- Print bermasalah terus → Cek printer/network

**Waktu resolusi:** 15-60 menit

### Level 3: Admin/IT Support
**Masalah yang perlu bantuan teknis:**
- System error berulang → Debug code
- Data corruption → Recovery procedure
- Performance issue → Optimization
- Browser compatibility → Update/config

**Waktu resolusi:** 1-4 jam

### Level 4: Developer Support
**Masalah yang perlu developer:**
- Bug di sistem → Code fix
- Feature request → Development
- Integration issue → System analysis
- Security concern → Security audit

**Waktu resolusi:** 1-7 hari

---

## Kontak Support

### Internal Support
- **Supervisor**: Ext. 101
- **IT Admin**: Ext. 201
- **Manager**: Ext. 301

### External Support
- **Email**: support@koperasi.com
- **Phone**: (021) 1234-5678
- **WhatsApp**: 0812-3456-7890

### Emergency Contact
- **24/7 Hotline**: (021) 9999-0000
- **Emergency Email**: emergency@koperasi.com

---

**Dokumen ini akan terus diupdate berdasarkan masalah yang ditemukan di lapangan.**

**Versi:** 1.0  
**Terakhir Update:** Desember 2024  
**Next Review:** Januari 2025