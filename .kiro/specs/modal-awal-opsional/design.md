# Design Document: Modal Awal Opsional

## Overview

Fitur ini mengubah validasi modal awal koperasi agar dapat menerima nilai 0 (nol) atau field kosong. Saat ini, sistem memaksa modal awal harus lebih besar dari 0, yang tidak sesuai dengan kebutuhan bisnis. Perubahan ini akan memungkinkan administrator untuk:

1. Memulai periode akuntansi dengan modal 0
2. Mengosongkan field modal awal (diperlakukan sebagai 0)
3. Mengubah modal awal menjadi 0 saat mengedit saldo awal periode

Sistem tetap akan mencatat jurnal dan memperbarui COA bahkan ketika modal bernilai 0, untuk menjaga konsistensi audit trail.

## Architecture

### Komponen yang Terpengaruh

1. **Wizard Saldo Awal (js/saldoAwal.js)**
   - Fungsi `renderStep1TanggalModal()` - Form input modal awal
   - Fungsi `validateCurrentStep()` - Validasi step 1
   - Fungsi `generateJurnalPembuka()` - Generate jurnal pembuka
   - Fungsi `generateJurnalKoreksi()` - Generate jurnal koreksi saat edit

2. **Data Koperasi (js/koperasi.js)**
   - Fungsi yang menangani perubahan modal awal koperasi
   - Validasi modal awal di form data koperasi

### Alur Perubahan

```
Input Modal Awal (0 atau kosong)
    ↓
Validasi (hanya tolak nilai negatif)
    ↓
Konversi kosong → 0
    ↓
Generate Jurnal (bahkan jika nilai 0)
    ↓
Update COA (set saldo = 0)
    ↓
Simpan ke localStorage
```

## Components and Interfaces

### 1. Form Input Modal Awal

**File:** `js/saldoAwal.js` - Fungsi `renderStep1TanggalModal()`

**Perubahan:**
- Hapus atribut `min="0"` dari input field (agar bisa dikosongkan)
- Ubah handler `onchange` untuk menerima nilai kosong atau 0
- Update teks bantuan untuk menjelaskan bahwa 0 adalah nilai valid

**Interface:**
```javascript
<input type="number" 
       class="form-control" 
       id="modalKoperasi" 
       value="${wizardState.data.modalKoperasi}"
       onchange="wizardState.data.modalKoperasi = parseFloat(this.value) || 0"
       step="1000">
```

### 2. Validasi Modal Awal

**File:** `js/saldoAwal.js` - Fungsi `validateCurrentStep()`

**Logika Validasi Baru:**
```javascript
if (wizardState.currentStep === 1) {
    // Validasi tanggal periode (skip jika edit mode)
    if (!wizardState.isEditMode) {
        const dateValidation = validateUniquePeriodDate(wizardState.data.tanggalMulai);
        if (!dateValidation.isValid) {
            errors.push(dateValidation.message);
        }
    }
    
    // Validasi modal koperasi - HANYA tolak nilai negatif
    const modalValidation = validatePositiveValue(wizardState.data.modalKoperasi, 'Modal Koperasi');
    if (!modalValidation.isValid) {
        errors.push(modalValidation.message);
    } else if (wizardState.data.modalKoperasi < 0) {
        errors.push('Modal Koperasi tidak boleh negatif');
    }
    // HAPUS: } else if (wizardState.data.modalKoperasi <= 0) {
    //     errors.push('Modal Koperasi harus lebih besar dari 0');
    // }
}
```

### 3. Generate Jurnal Pembuka

**File:** `js/saldoAwal.js` - Fungsi `generateJurnalPembuka()`

**Perubahan:**
- Ubah kondisi `if (saldoAwalData.modalKoperasi > 0)` menjadi `if (saldoAwalData.modalKoperasi >= 0)`
- Tetap catat jurnal bahkan jika nilai 0 untuk audit trail

**Logika Baru:**
```javascript
// 1. Modal Koperasi: Debit Kas, Kredit Modal Koperasi
// Catat jurnal bahkan jika nilai 0 untuk audit trail
if (saldoAwalData.modalKoperasi >= 0) {
    entries.push({
        akun: '1-1000', // Kas
        debit: saldoAwalData.modalKoperasi,
        kredit: 0
    });
    entries.push({
        akun: '3-1000', // Modal Koperasi
        debit: 0,
        kredit: saldoAwalData.modalKoperasi
    });
}
```

### 4. Generate Jurnal Koreksi

**File:** `js/saldoAwal.js` - Fungsi `generateJurnalKoreksi()`

**Perubahan:**
- Fungsi `addKoreksiEntry()` sudah mendukung nilai 0
- Pastikan koreksi dari nilai X ke 0 dicatat dengan benar

**Logika yang Sudah Ada (tidak perlu diubah):**
```javascript
// 10. Koreksi Modal Koperasi
addKoreksiEntry('3-1000', oldSaldoAwal.modalKoperasi || 0, newSaldoAwal.modalKoperasi || 0);
```

Fungsi `addKoreksiEntry` sudah menangani perubahan ke 0 dengan benar karena menggunakan selisih.

## Data Models

### Wizard State

```javascript
wizardState = {
    currentStep: 1,
    totalSteps: 7,
    isEditMode: false,
    oldSaldoAwal: null,
    data: {
        tanggalMulai: '',
        modalKoperasi: 0,  // Bisa 0 atau lebih besar
        kas: 0,
        bank: 0,
        // ... fields lainnya
    }
}
```

### Saldo Awal Periode

```javascript
saldoAwalPeriode = {
    tanggalMulai: '2024-01-01',
    modalKoperasi: 0,  // Bisa 0
    kas: 0,
    bank: 0,
    // ... fields lainnya
    totalModal: 0,  // Bisa 0
    balance: true
}
```

### COA Entry

```javascript
{
    kode: '3-1000',
    nama: 'Modal Koperasi',
    tipe: 'Modal',
    saldo: 0  // Bisa 0
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptance Criteria Testing Prework:

1.1 WHEN administrator menginput nilai 0 untuk modal awal THEN Sistem Koperasi SHALL menerima nilai tersebut tanpa menampilkan error
Thoughts: Ini adalah aturan yang harus berlaku untuk semua input dengan nilai 0. Kita bisa test dengan memberikan nilai 0 dan memastikan tidak ada error yang muncul.
Testable: yes - property

1.2 WHEN administrator mengosongkan field modal awal THEN Sistem Koperasi SHALL memperlakukan nilai tersebut sebagai 0
Thoughts: Ini adalah aturan tentang bagaimana sistem menangani input kosong. Kita bisa test dengan mengosongkan field dan memastikan nilai yang tersimpan adalah 0.
Testable: yes - property

1.3 WHEN modal awal bernilai 0 THEN Sistem Koperasi SHALL tetap mencatat jurnal dengan nilai 0 untuk debit Kas (1-1000) dan kredit Modal Koperasi (3-1000)
Thoughts: Ini adalah aturan tentang pencatatan jurnal. Kita bisa test dengan memberikan modal 0 dan memastikan jurnal tetap dicatat dengan nilai 0.
Testable: yes - property

1.4 WHEN administrator menyimpan saldo awal dengan modal 0 THEN Sistem Koperasi SHALL memperbarui saldo akun Modal Koperasi (3-1000) menjadi 0 di COA
Thoughts: Ini adalah aturan tentang update COA. Kita bisa test dengan menyimpan modal 0 dan memastikan saldo di COA menjadi 0.
Testable: yes - property

1.5 WHEN modal awal bernilai 0 THEN Sistem Koperasi SHALL menampilkan nilai 0 di laporan Laba Rugi dan laporan SHU
Thoughts: Ini adalah aturan tentang tampilan laporan. Kita bisa test dengan modal 0 dan memastikan laporan menampilkan 0.
Testable: yes - property

2.1 WHEN administrator menginput nilai negatif untuk modal awal THEN Sistem Koperasi SHALL menampilkan pesan error "Modal Koperasi tidak boleh negatif"
Thoughts: Ini adalah aturan validasi untuk nilai negatif. Kita bisa test dengan memberikan nilai negatif dan memastikan error muncul.
Testable: yes - property

2.2 WHEN administrator menginput nilai non-numerik untuk modal awal THEN Sistem Koperasi SHALL menampilkan pesan error "Modal Koperasi harus berupa angka"
Thoughts: Ini adalah aturan validasi untuk nilai non-numerik. Browser HTML5 input type="number" sudah menangani ini, tapi kita bisa test validasi JavaScript.
Testable: yes - property

2.3 WHEN administrator menginput nilai 0 atau lebih besar untuk modal awal THEN Sistem Koperasi SHALL menerima nilai tersebut dan melanjutkan ke step berikutnya
Thoughts: Ini adalah aturan tentang flow wizard. Kita bisa test dengan nilai 0 atau positif dan memastikan bisa lanjut ke step berikutnya.
Testable: yes - property

2.4 WHEN field modal awal dikosongkan THEN Sistem Koperasi SHALL mengkonversi nilai kosong menjadi 0 tanpa menampilkan error
Thoughts: Ini adalah aturan konversi nilai kosong. Kita bisa test dengan mengosongkan field dan memastikan tidak ada error.
Testable: yes - property

3.1 WHEN administrator mengedit saldo awal periode dan mengubah modal awal menjadi 0 THEN Sistem Koperasi SHALL membuat jurnal koreksi yang mengurangi modal awal ke 0
Thoughts: Ini adalah aturan tentang jurnal koreksi. Kita bisa test dengan mengubah modal dari X ke 0 dan memastikan jurnal koreksi dicatat.
Testable: yes - property

3.2 WHEN modal awal diubah dari nilai X menjadi 0 THEN Sistem Koperasi SHALL mencatat jurnal dengan debit Modal Koperasi (3-1000) sebesar X dan kredit Kas (1-1000) sebesar X
Thoughts: Ini adalah aturan spesifik tentang format jurnal koreksi. Kita bisa test dengan mengubah dari X ke 0 dan memastikan jurnal sesuai format.
Testable: yes - property

3.3 WHEN modal awal diubah menjadi 0 THEN Sistem Koperasi SHALL memperbarui saldo akun Modal Koperasi (3-1000) menjadi 0 di COA
Thoughts: Ini adalah aturan tentang update COA saat edit. Kita bisa test dengan mengubah ke 0 dan memastikan COA terupdate.
Testable: yes - property

3.4 WHEN modal awal diubah menjadi 0 THEN Sistem Koperasi SHALL menampilkan nilai 0 di laporan keuangan
Thoughts: Ini adalah aturan tentang tampilan laporan setelah edit. Kita bisa test dengan mengubah ke 0 dan memastikan laporan menampilkan 0.
Testable: yes - property

### Property Reflection

Setelah mereview semua properties di atas, saya menemukan beberapa redundansi:

1. **Property 1.2 dan 2.4** adalah duplikat - keduanya tentang konversi field kosong menjadi 0
2. **Property 1.4 dan 3.3** sangat mirip - keduanya tentang update COA menjadi 0, hanya konteksnya berbeda (create vs edit)
3. **Property 1.5 dan 3.4** sangat mirip - keduanya tentang tampilan laporan dengan modal 0

**Konsolidasi:**
- Gabungkan 1.2 dan 2.4 menjadi satu property tentang konversi field kosong
- Gabungkan 1.4 dan 3.3 menjadi satu property tentang update COA (berlaku untuk create dan edit)
- Gabungkan 1.5 dan 3.4 menjadi satu property tentang tampilan laporan

### Correctness Properties

Property 1: Zero value acceptance
*For any* input modal awal dengan nilai 0, sistem harus menerima nilai tersebut tanpa menampilkan error dan melanjutkan ke step berikutnya
**Validates: Requirements 1.1, 2.3**

Property 2: Empty field conversion
*For any* field modal awal yang dikosongkan, sistem harus mengkonversi nilai kosong menjadi 0 tanpa menampilkan error
**Validates: Requirements 1.2, 2.4**

Property 3: Zero value journal recording
*For any* saldo awal dengan modal 0, sistem harus tetap mencatat jurnal dengan debit Kas (1-1000) = 0 dan kredit Modal Koperasi (3-1000) = 0
**Validates: Requirements 1.3**

Property 4: Zero value COA update
*For any* saldo awal dengan modal 0 (baik create maupun edit), sistem harus memperbarui saldo akun Modal Koperasi (3-1000) menjadi 0 di COA
**Validates: Requirements 1.4, 3.3**

Property 5: Zero value report display
*For any* saldo awal dengan modal 0, sistem harus menampilkan nilai 0 di laporan Laba Rugi dan laporan SHU
**Validates: Requirements 1.5, 3.4**

Property 6: Negative value rejection
*For any* input modal awal dengan nilai negatif, sistem harus menampilkan pesan error "Modal Koperasi tidak boleh negatif" dan tidak melanjutkan ke step berikutnya
**Validates: Requirements 2.1**

Property 7: Non-numeric value rejection
*For any* input modal awal dengan nilai non-numerik, sistem harus menampilkan pesan error atau mencegah input tersebut
**Validates: Requirements 2.2**

Property 8: Edit to zero correction journal
*For any* edit saldo awal yang mengubah modal dari nilai X (X > 0) menjadi 0, sistem harus membuat jurnal koreksi dengan debit Modal Koperasi (3-1000) = X dan kredit Kas (1-1000) = X
**Validates: Requirements 3.1, 3.2**

## Error Handling

### Validasi Input

1. **Nilai Negatif**
   - Error: "Modal Koperasi tidak boleh negatif"
   - Aksi: Tampilkan alert, tidak lanjut ke step berikutnya

2. **Nilai Non-Numerik**
   - Browser HTML5 input type="number" akan mencegah input non-numerik
   - Fallback: `parseFloat(value) || 0` akan mengkonversi ke 0

3. **Field Kosong**
   - Tidak dianggap error
   - Dikonversi menjadi 0 secara otomatis

### Edge Cases

1. **Modal 0 dengan Kas > 0**
   - Sistem akan tetap mencatat jurnal untuk modal 0
   - Kas akan dicatat dari sumber lain (bank, piutang, dll)

2. **Edit dari X ke 0**
   - Jurnal koreksi: Debit Modal (3-1000) = X, Kredit Kas (1-1000) = X
   - COA akan terupdate dengan benar

3. **Balance Check dengan Modal 0**
   - Persamaan akuntansi tetap harus balance: Aset = Kewajiban + Modal
   - Modal 0 adalah nilai valid dalam persamaan

## Testing Strategy

### Unit Tests

1. **Test Validasi Modal Awal**
   - Input: 0 → Expected: Valid, no error
   - Input: -100 → Expected: Error "Modal Koperasi tidak boleh negatif"
   - Input: 1000000 → Expected: Valid, no error
   - Input: '' (kosong) → Expected: Converted to 0, no error

2. **Test Generate Jurnal Pembuka**
   - Modal = 0 → Expected: Jurnal dengan debit Kas = 0, kredit Modal = 0
   - Modal = 1000000 → Expected: Jurnal dengan debit Kas = 1000000, kredit Modal = 1000000

3. **Test Generate Jurnal Koreksi**
   - Old = 1000000, New = 0 → Expected: Debit Modal = 1000000, Kredit Kas = 1000000
   - Old = 0, New = 1000000 → Expected: Debit Kas = 1000000, Kredit Modal = 1000000
   - Old = 0, New = 0 → Expected: No entries (no change)

4. **Test Update COA**
   - Modal = 0 → Expected: COA akun 3-1000 saldo = 0
   - Modal = 1000000 → Expected: COA akun 3-1000 saldo = 1000000

### Property-Based Tests

Property-based testing akan menggunakan Jest dengan library `fast-check` untuk JavaScript. Setiap test akan dijalankan minimal 100 iterasi.

1. **Property Test: Zero Value Acceptance**
   - Generate: Random wizard state dengan modalKoperasi = 0
   - Test: validateCurrentStep() harus return valid (no errors)
   - Tag: **Feature: modal-awal-opsional, Property 1: Zero value acceptance**

2. **Property Test: Empty Field Conversion**
   - Generate: Random input values termasuk empty string
   - Test: parseFloat(value) || 0 harus selalu return 0 untuk empty string
   - Tag: **Feature: modal-awal-opsional, Property 2: Empty field conversion**

3. **Property Test: Zero Value Journal Recording**
   - Generate: Random saldo awal data dengan modalKoperasi = 0
   - Test: generateJurnalPembuka() harus return entries dengan modal = 0
   - Tag: **Feature: modal-awal-opsional, Property 3: Zero value journal recording**

4. **Property Test: Zero Value COA Update**
   - Generate: Random saldo awal dengan modalKoperasi = 0
   - Test: Setelah saveSaldoAwal(), COA akun 3-1000 saldo harus = 0
   - Tag: **Feature: modal-awal-opsional, Property 4: Zero value COA update**

5. **Property Test: Negative Value Rejection**
   - Generate: Random negative numbers
   - Test: validateCurrentStep() harus return error untuk nilai negatif
   - Tag: **Feature: modal-awal-opsional, Property 6: Negative value rejection**

6. **Property Test: Edit to Zero Correction Journal**
   - Generate: Random old modal > 0, new modal = 0
   - Test: generateJurnalKoreksi() harus return correct entries
   - Tag: **Feature: modal-awal-opsional, Property 8: Edit to zero correction journal**

### Integration Tests

1. **Test Full Wizard Flow dengan Modal 0**
   - Jalankan wizard dari step 1 sampai 7 dengan modal = 0
   - Verify: Saldo awal tersimpan, jurnal tercatat, COA terupdate

2. **Test Edit Saldo Awal ke Modal 0**
   - Create saldo awal dengan modal = 1000000
   - Edit menjadi modal = 0
   - Verify: Jurnal koreksi tercatat, COA terupdate, laporan menampilkan 0

3. **Test Laporan dengan Modal 0**
   - Create saldo awal dengan modal = 0
   - Generate Laporan Laba Rugi dan SHU
   - Verify: Modal awal ditampilkan sebagai 0

## Implementation Notes

### Perubahan Minimal

Untuk meminimalkan risiko, perubahan hanya dilakukan pada:

1. **Validasi di `validateCurrentStep()`**
   - Hapus kondisi `modalKoperasi <= 0`
   - Ubah menjadi `modalKoperasi < 0`

2. **Generate Jurnal di `generateJurnalPembuka()`**
   - Ubah kondisi `modalKoperasi > 0` menjadi `modalKoperasi >= 0`

3. **UI Text (opsional)**
   - Update teks bantuan untuk menjelaskan bahwa 0 adalah nilai valid

### Backward Compatibility

- Saldo awal yang sudah ada dengan modal > 0 tidak terpengaruh
- Jurnal yang sudah tercatat tetap valid
- COA yang sudah ada tetap konsisten

### Testing Checklist

- [ ] Unit test untuk validasi modal 0
- [ ] Unit test untuk validasi modal negatif
- [ ] Unit test untuk generate jurnal dengan modal 0
- [ ] Unit test untuk generate jurnal koreksi ke 0
- [ ] Property test untuk zero value acceptance
- [ ] Property test untuk negative value rejection
- [ ] Property test untuk edit to zero correction
- [ ] Integration test untuk full wizard flow dengan modal 0
- [ ] Integration test untuk edit saldo awal ke modal 0
- [ ] Manual test untuk UI dengan modal 0
