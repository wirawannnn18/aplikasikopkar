# Keyboard Shortcuts & Tips - Tutup Kasir POS

## Daftar Isi
1. [Keyboard Shortcuts](#keyboard-shortcuts)
2. [Navigation Tips](#navigation-tips)
3. [Productivity Tips](#productivity-tips)
4. [Accessibility Features](#accessibility-features)
5. [Browser Shortcuts](#browser-shortcuts)
6. [Quick Actions](#quick-actions)

---

## Keyboard Shortcuts

### Shortcut Utama Tutup Kasir

| Shortcut | Fungsi | Context | Keterangan |
|----------|--------|---------|------------|
| **F10** | Buka Modal Tutup Kasir | Halaman POS | Shortcut utama untuk tutup kasir |
| **Esc** | Tutup Modal | Modal tutup kasir | Menutup modal tanpa save |
| **Tab** | Navigasi Maju | Modal tutup kasir | Pindah ke field berikutnya |
| **Shift+Tab** | Navigasi Mundur | Modal tutup kasir | Pindah ke field sebelumnya |
| **Enter** | Submit/Konfirmasi | Field terakhir | Submit form atau konfirmasi |
| **Ctrl+P** | Print | Window print | Print laporan |

### Shortcut Navigasi POS

| Shortcut | Fungsi | Context | Keterangan |
|----------|--------|---------|------------|
| **Alt+H** | Home/Dashboard | Semua halaman | Kembali ke dashboard |
| **Alt+P** | POS | Semua halaman | Buka halaman POS |
| **Alt+K** | Keuangan | Semua halaman | Buka menu keuangan |
| **Alt+R** | Riwayat | Menu keuangan | Buka riwayat tutup kasir |
| **F11** | Fullscreen POS | Halaman POS | Toggle fullscreen mode |

### Shortcut Input dan Editing

| Shortcut | Fungsi | Context | Keterangan |
|----------|--------|---------|------------|
| **Ctrl+A** | Select All | Text field | Pilih semua text |
| **Ctrl+C** | Copy | Text field | Copy text |
| **Ctrl+V** | Paste | Text field | Paste text |
| **Ctrl+Z** | Undo | Text field | Undo perubahan |
| **Delete** | Clear Field | Text field | Hapus isi field |
| **Home** | Awal Field | Text field | Cursor ke awal |
| **End** | Akhir Field | Text field | Cursor ke akhir |

---

## Navigation Tips

### Navigasi Modal Tutup Kasir

**Urutan Tab Navigation:**
1. **Kas Aktual** (input field) - Auto focus saat modal terbuka
2. **Keterangan Selisih** (textarea) - Muncul jika ada selisih
3. **Tombol Batal** (button)
4. **Tombol Proses Tutup Kasir** (button)

**Tips Navigasi Cepat:**
- Langsung ketik angka saat modal terbuka (auto focus ke kas aktual)
- Tekan **Tab** untuk pindah ke keterangan (jika ada selisih)
- Tekan **Enter** di field terakhir untuk submit
- Tekan **Esc** kapan saja untuk batal

### Navigasi Keyboard-Only

**Untuk pengguna yang tidak bisa menggunakan mouse:**

1. **Buka Modal:**
   - Tekan **F10** dari halaman POS
   - Atau gunakan **Tab** untuk navigate ke tombol, lalu **Enter**

2. **Input Data:**
   - Kas aktual: Langsung ketik (auto focus)
   - Keterangan: **Tab** lalu ketik
   - Submit: **Tab** sampai tombol "Proses", lalu **Enter**

3. **Print Laporan:**
   - Window print terbuka otomatis
   - Tekan **Ctrl+P** atau **Enter** untuk print
   - **Esc** untuk batal print

### Visual Indicators

**Focus Indicators:**
- Field yang aktif akan memiliki border biru
- Tombol yang di-focus akan memiliki outline
- Tooltip muncul saat hover/focus

**Status Indicators:**
- 🟢 **Hijau**: Kas sesuai (selisih = 0)
- 🟡 **Kuning**: Kas lebih (selisih > 0)
- 🔴 **Merah**: Kas kurang (selisih < 0)

---

## Productivity Tips

### Tips Cepat Tutup Kasir

**Persiapan Sebelum Tutup Kasir:**
1. Siapkan kalkulator untuk hitung kas fisik
2. Pisahkan uang per pecahan
3. Pastikan tidak ada transaksi pending
4. Siapkan alasan jika ada selisih

**Workflow Optimal:**
1. **F10** → Buka modal
2. Hitung kas fisik sambil lihat ringkasan penjualan
3. Input kas aktual langsung (auto focus)
4. **Tab** → Isi keterangan jika perlu
5. **Enter** → Submit
6. **Ctrl+P** → Print laporan

**Time-Saving Tips:**
- Gunakan **F10** daripada klik tombol
- Siapkan keterangan standar untuk selisih umum
- Hitung kas fisik per pecahan untuk akurasi
- Double-check angka sebelum submit

### Template Keterangan Selisih

**Kas Kurang:**
- "Salah kembalian ke pelanggan Rp [jumlah]"
- "Uang pecahan [nominal] sobek/rusak"
- "Lupa input transaksi cash Rp [jumlah]"
- "Kembalian kurang Rp [jumlah] untuk transaksi [waktu]"

**Kas Lebih:**
- "Pelanggan lupa ambil kembalian Rp [jumlah]"
- "Salah hitung kembalian, lebih Rp [jumlah]"
- "Double input transaksi, kelebihan Rp [jumlah]"
- "Uang tips dari pelanggan Rp [jumlah]"

### Shortcuts untuk Angka

**Input Kas Aktual:**
- Gunakan numpad untuk input cepat
- Tidak perlu titik/koma untuk ribuan
- Contoh: 1500000 (untuk Rp 1.500.000)
- Sistem otomatis format tampilan

**Validasi Cepat:**
- Kas seharusnya = Modal awal + Penjualan cash
- Selisih = Kas aktual - Kas seharusnya
- Jika selisih ≠ 0, wajib isi keterangan

---

## Accessibility Features

### Screen Reader Support

**ARIA Labels:**
- Semua field memiliki label yang jelas
- Status selisih diumumkan oleh screen reader
- Error messages dibaca otomatis

**Keyboard Navigation:**
- Semua fungsi dapat diakses via keyboard
- Tab order yang logis
- Focus indicators yang jelas

### High Contrast Mode

**Dukungan untuk pengguna dengan gangguan penglihatan:**
- Warna kontras tinggi untuk text
- Border yang jelas untuk field
- Icon yang mudah dibedakan

### Font Size Adjustment

**Browser Zoom:**
- **Ctrl++** : Perbesar tampilan
- **Ctrl+-** : Perkecil tampilan
- **Ctrl+0** : Reset ke ukuran normal

**Responsive Design:**
- Modal menyesuaikan ukuran layar
- Text tetap readable di semua zoom level
- Button size menyesuaikan

---

## Browser Shortcuts

### Chrome/Edge Shortcuts

| Shortcut | Fungsi | Keterangan |
|----------|--------|------------|
| **Ctrl+R** | Refresh | Refresh halaman |
| **Ctrl+Shift+R** | Hard Refresh | Refresh + clear cache |
| **F12** | Developer Tools | Buka console untuk debug |
| **Ctrl+Shift+I** | Inspect Element | Inspect HTML element |
| **Ctrl+U** | View Source | Lihat source code |
| **Ctrl+Shift+Delete** | Clear Data | Clear browser cache/data |

### Firefox Shortcuts

| Shortcut | Fungsi | Keterangan |
|----------|--------|------------|
| **F5** | Refresh | Refresh halaman |
| **Ctrl+F5** | Hard Refresh | Refresh + clear cache |
| **F12** | Developer Tools | Buka console untuk debug |
| **Ctrl+Shift+K** | Web Console | Buka console langsung |

### Safari Shortcuts (Mac)

| Shortcut | Fungsi | Keterangan |
|----------|--------|------------|
| **Cmd+R** | Refresh | Refresh halaman |
| **Cmd+Shift+R** | Hard Refresh | Refresh + clear cache |
| **Cmd+Option+I** | Developer Tools | Buka console untuk debug |

---

## Quick Actions

### Emergency Shortcuts

**Jika sistem hang:**
1. **Ctrl+Shift+Esc** → Task Manager (Windows)
2. **Cmd+Option+Esc** → Force Quit (Mac)
3. **Alt+F4** → Close browser window
4. **Ctrl+Alt+Delete** → System options (Windows)

**Jika modal tidak respond:**
1. **Esc** → Coba tutup modal
2. **F5** → Refresh halaman
3. **Ctrl+Shift+R** → Hard refresh
4. **F12** → Cek console error

### Data Recovery Shortcuts

**Jika data hilang:**
```javascript
// Paste di browser console (F12)
// Cek session data
console.log(sessionStorage.getItem('bukaKas'));

// Cek riwayat data
console.log(localStorage.getItem('riwayatTutupKas'));

// Export error log
if (window.errorHandler) window.errorHandler.exportErrorLog();
```

### Print Shortcuts

**Alternative print methods:**
1. **Ctrl+P** → Normal print
2. **Ctrl+S** → Save as PDF
3. **Ctrl+Shift+P** → Print preview (some browsers)

**Print troubleshooting:**
- **F12** → Console → Check for print errors
- **Ctrl+Shift+Delete** → Clear cache if print broken
- Try different browser if print not working

---

## Customization Tips

### Browser Settings untuk Optimal Experience

**Chrome/Edge:**
1. Settings → Advanced → Privacy and security
2. Site Settings → Pop-ups and redirects → Allow for aplikasi
3. Site Settings → JavaScript → Allow
4. Site Settings → Cookies → Allow

**Firefox:**
1. Preferences → Privacy & Security
2. Permissions → Block pop-up windows → Exceptions → Add aplikasi
3. Permissions → Notifications → Allow for aplikasi

### Bookmark Setup

**Recommended bookmarks:**
- POS Fullscreen: `[domain]/pos.html`
- Keuangan: `[domain]/#keuangan`
- Riwayat Tutup Kasir: `[domain]/#riwayat-tutup-kasir`

**Bookmark shortcuts:**
- **Ctrl+D** → Add bookmark
- **Ctrl+Shift+D** → Bookmark all tabs
- **Ctrl+Shift+B** → Show/hide bookmark bar

### Keyboard Layout Optimization

**For numeric input:**
- Enable NumLock for number pad
- Use number pad for kas aktual input
- Consider external numeric keypad for laptops

---

## Training Exercises

### Keyboard Navigation Practice

**Exercise 1: Modal Navigation**
1. Open POS page
2. Press **F10** to open modal
3. Navigate using only **Tab** and **Shift+Tab**
4. Practice reaching each element
5. Press **Esc** to close

**Exercise 2: Speed Input**
1. Open modal with **F10**
2. Type kas aktual quickly (use numpad)
3. **Tab** to keterangan if needed
4. **Enter** to submit
5. Time yourself - target under 30 seconds

**Exercise 3: Error Recovery**
1. Intentionally create validation error
2. Use **Tab** to navigate to error field
3. Fix error using keyboard only
4. Submit successfully

### Accessibility Testing

**Test with eyes closed:**
1. Navigate using only keyboard
2. Listen to screen reader announcements
3. Identify all elements by sound/voice
4. Complete full tutup kasir process

**Test with high contrast:**
1. Enable high contrast mode in OS
2. Check if all elements visible
3. Verify text readability
4. Test color-blind friendly mode

---

## Troubleshooting Keyboard Issues

### Common Problems

**Shortcuts not working:**
1. Check if NumLock is on
2. Disable browser extensions
3. Check for conflicting shortcuts
4. Try different browser

**Tab navigation broken:**
1. Refresh page (**F5**)
2. Check for JavaScript errors (**F12**)
3. Clear browser cache
4. Update browser

**Focus indicators missing:**
1. Check browser accessibility settings
2. Enable focus indicators in OS
3. Use high contrast mode
4. Update browser/OS

### Browser-Specific Issues

**Chrome:**
- Some shortcuts conflict with extensions
- Disable extensions temporarily
- Check chrome://settings/content

**Firefox:**
- about:config → accessibility.tabfocus
- Set to 7 for full keyboard navigation

**Safari:**
- System Preferences → Keyboard → Shortcuts
- Enable "Use keyboard navigation to move focus between controls"

---

## Best Practices

### For Kasir

1. **Learn the F10 shortcut** - Fastest way to open tutup kasir
2. **Use Tab navigation** - More reliable than mouse clicks
3. **Prepare keterangan** - Have standard explanations ready
4. **Double-check input** - Use keyboard to verify numbers
5. **Practice regularly** - Build muscle memory for shortcuts

### For Supervisor

1. **Teach shortcuts to kasir** - Improve efficiency
2. **Monitor keyboard usage** - Ensure accessibility compliance
3. **Test on different devices** - Verify compatibility
4. **Document custom shortcuts** - Share with team
5. **Regular training** - Keep skills updated

### For Admin

1. **Test accessibility** - Ensure compliance with standards
2. **Monitor performance** - Check if shortcuts improve speed
3. **Update documentation** - Keep shortcuts current
4. **Browser compatibility** - Test on all supported browsers
5. **User feedback** - Collect input on shortcut effectiveness

---

**Versi:** 1.0  
**Terakhir Update:** Desember 2024  
**Feedback:** Kirim ke support@koperasi.com untuk saran perbaikan shortcuts