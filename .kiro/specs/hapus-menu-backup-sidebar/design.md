# Design Document

## Overview

Desain ini menghilangkan duplikasi menu "Backup & Restore" dari sidebar dengan mempertahankan fungsi backup & restore yang sudah ada di halaman Pengaturan Sistem. Perubahan ini akan meningkatkan konsistensi navigasi dan mengurangi kebingungan pengguna dengan menyediakan satu titik akses yang jelas untuk fitur backup & restore.

## Architecture

Perubahan arsitektur minimal yang diperlukan:

1. **Menu Configuration Layer**: Modifikasi array menu di `auth.js` untuk menghapus entry backup-restore
2. **Routing Layer**: Update fungsi `renderPage()` untuk redirect route backup-restore ke system-settings
3. **UI Layer**: Modifikasi halaman Pengaturan Sistem untuk menampilkan tombol akses ke backup & restore
4. **Backward Compatibility**: Memastikan fungsi `renderBackupRestore()` tetap tersedia untuk dipanggil dari Pengaturan Sistem

## Components and Interfaces

### 1. Menu Configuration (auth.js)

**Lokasi**: `js/auth.js` - fungsi `renderMenu()`

**Perubahan**:
- Hapus entry `{ icon: 'bi-database', text: 'Backup & Restore', page: 'backup-restore' }` dari array `menus.super_admin`
- Hapus entry yang sama dari array `menus.administrator`

**Interface**:
```javascript
const menus = {
    super_admin: [
        // ... menu lainnya
        // HAPUS: { icon: 'bi-database', text: 'Backup & Restore', page: 'backup-restore' },
        // ... menu lainnya
    ],
    administrator: [
        // ... menu lainnya
        // HAPUS: { icon: 'bi-database', text: 'Backup & Restore', page: 'backup-restore' },
        // ... menu lainnya
    ]
}
```

### 2. Page Routing (auth.js)

**Lokasi**: `js/auth.js` - fungsi `renderPage()`

**Perubahan**:
- Modifikasi case 'backup-restore' untuk redirect ke 'system-settings'

**Interface**:
```javascript
function renderPage(page) {
    const content = document.getElementById('mainContent');
    
    switch(page) {
        // ... cases lainnya
        case 'backup-restore':
            // Redirect to system settings
            navigateTo('system-settings');
            return;
        // ... cases lainnya
    }
}
```

### 3. System Settings Page Enhancement (auth.js)

**Lokasi**: `js/auth.js` - fungsi `renderSystemSettings()`

**Perubahan**:
- Tambahkan tombol "Buka Backup & Restore" yang memanggil `renderBackupRestore()`
- Ganti placeholder tombol dengan tombol fungsional

**Interface**:
```javascript
function renderSystemSettings() {
    // ... kode existing
    
    // Ganti bagian tombol backup/restore dengan:
    <button class="btn btn-primary" onclick="renderBackupRestore()">
        <i class="bi bi-database me-2"></i>Buka Backup & Restore
    </button>
}
```

### 4. Backup Module (backup.js)

**Status**: Tidak ada perubahan diperlukan

**Catatan**: 
- Fungsi `renderBackupRestore()` tetap tersedia dan berfungsi
- Script `backup.js` tetap dimuat di `index.html`
- Semua fungsi backup & restore tetap berfungsi normal

## Data Models

Tidak ada perubahan pada data models. Semua struktur data localStorage tetap sama.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptance Criteria Testing Prework:

1.1 WHEN sistem menampilkan sidebar untuk role super_admin THEN sistem SHALL NOT menampilkan menu item "Backup & Restore"
Thoughts: Ini adalah aturan yang harus berlaku untuk semua instance sidebar yang di-render untuk super_admin. Kita bisa mengecek bahwa array menu yang dihasilkan tidak mengandung item dengan page 'backup-restore'
Testable: yes - property

1.2 WHEN sistem menampilkan sidebar untuk role administrator THEN sistem SHALL NOT menampilkan menu item "Backup & Restore"
Thoughts: Sama seperti 1.1, ini adalah aturan untuk semua instance sidebar administrator
Testable: yes - property

1.3 WHEN pengguna mengakses halaman Pengaturan Sistem THEN sistem SHALL menampilkan tombol akses ke fitur backup & restore
Thoughts: Ini adalah aturan tentang konten yang harus ada di halaman Pengaturan Sistem. Kita bisa mengecek bahwa HTML yang dihasilkan mengandung tombol dengan fungsi renderBackupRestore
Testable: yes - property

1.4 WHEN pengguna mencoba mengakses route 'backup-restore' secara langsung THEN sistem SHALL redirect ke halaman Pengaturan Sistem
Thoughts: Ini adalah aturan tentang routing behavior. Kita bisa test bahwa memanggil navigateTo('backup-restore') akan menghasilkan navigasi ke 'system-settings'
Testable: yes - property

1.5 WHEN menu sidebar di-render THEN sistem SHALL tidak menyertakan entry dengan page 'backup-restore' untuk semua role
Thoughts: Ini adalah aturan umum yang mencakup semua role. Kita bisa mengecek bahwa tidak ada role yang memiliki menu item dengan page 'backup-restore'
Testable: yes - property

2.1 WHEN file auth.js dibaca THEN file SHALL NOT berisi menu item dengan page 'backup-restore' dalam array menus
Thoughts: Ini adalah pemeriksaan statis terhadap kode. Bukan property yang bisa ditest secara runtime
Testable: no

2.2 WHEN fungsi renderPage dipanggil dengan parameter 'backup-restore' THEN fungsi SHALL redirect ke 'system-settings'
Thoughts: Ini adalah aturan tentang behavior fungsi renderPage. Kita bisa test bahwa memanggil renderPage('backup-restore') menghasilkan redirect
Testable: yes - property

2.3 WHEN file index.html dibaca THEN file SHALL tetap memuat script backup.js untuk fungsi backup yang digunakan di Pengaturan Sistem
Thoughts: Ini adalah pemeriksaan statis terhadap HTML. Bukan property runtime
Testable: no

2.4 WHEN fungsi renderBackupRestore dipanggil THEN fungsi SHALL tetap tersedia untuk digunakan dari halaman Pengaturan Sistem
Thoughts: Ini adalah pemeriksaan bahwa fungsi masih terdefinisi dan bisa dipanggil
Testable: yes - example

3.1 WHEN pengguna yang terbiasa mengklik menu "Backup & Restore" mencari fitur tersebut THEN pengguna SHALL menemukan fitur di halaman Pengaturan Sistem dengan jelas
Thoughts: Ini adalah requirement UX yang subjektif tentang "jelas". Tidak bisa ditest secara otomatis
Testable: no

3.2 WHEN halaman Pengaturan Sistem ditampilkan THEN sistem SHALL menampilkan tombol "Backup & Restore" yang menonjol
Thoughts: Ini tentang keberadaan tombol di UI. Kita bisa test bahwa HTML mengandung tombol dengan teks atau fungsi tertentu
Testable: yes - property

3.3 WHEN tombol "Backup & Restore" di Pengaturan Sistem diklik THEN sistem SHALL menampilkan antarmuka backup & restore lengkap
Thoughts: Ini adalah test integrasi tentang behavior tombol. Kita bisa test bahwa klik tombol memanggil renderBackupRestore
Testable: yes - property

3.4 WHEN sistem di-upgrade THEN semua fungsi backup & restore SHALL tetap berfungsi normal
Thoughts: Ini adalah requirement tentang backward compatibility yang luas. Tidak spesifik untuk ditest sebagai property tunggal
Testable: no

### Property Reflection:

Reviewing properties for redundancy:
- Property 1.1 dan 1.2 bisa digabung menjadi satu property yang mengecek semua role
- Property 1.5 sudah mencakup 1.1 dan 1.2, jadi 1.1 dan 1.2 redundan
- Property 1.4 dan 2.2 pada dasarnya sama, bisa digabung
- Property 1.3 dan 3.2 serupa, bisa digabung menjadi satu property yang lebih komprehensif

### Correctness Properties:

Property 1: Menu tidak mengandung backup-restore
*For any* role dalam sistem, menu yang di-generate tidak boleh mengandung item dengan page 'backup-restore'
**Validates: Requirements 1.1, 1.2, 1.5**

Property 2: Redirect backup-restore ke system-settings
*For any* pemanggilan navigasi ke 'backup-restore', sistem harus redirect ke 'system-settings'
**Validates: Requirements 1.4, 2.2**

Property 3: Pengaturan Sistem menampilkan akses backup
*For any* rendering halaman system-settings, HTML yang dihasilkan harus mengandung tombol atau link yang memanggil renderBackupRestore
**Validates: Requirements 1.3, 3.2**

Property 4: Fungsi backup tetap tersedia
*For any* state aplikasi setelah perubahan, fungsi renderBackupRestore harus tetap terdefinisi dan dapat dipanggil
**Validates: Requirements 2.4, 3.3**

## Error Handling

### Scenario 1: User mencoba akses langsung via URL hash
**Handling**: Fungsi renderPage akan mendeteksi route 'backup-restore' dan otomatis redirect ke 'system-settings'

### Scenario 2: Fungsi renderBackupRestore tidak ditemukan
**Handling**: Tambahkan error handling di tombol Pengaturan Sistem untuk menampilkan pesan error jika fungsi tidak tersedia

### Scenario 3: User non-admin mencoba akses Pengaturan Sistem
**Handling**: Sudah ada validasi role di renderSystemSettings() yang akan redirect ke dashboard

## Testing Strategy

### Unit Tests

1. **Test Menu Configuration**
   - Verify super_admin menu tidak mengandung 'backup-restore'
   - Verify administrator menu tidak mengandung 'backup-restore'
   - Verify kasir dan keuangan menu tidak terpengaruh

2. **Test Routing**
   - Verify navigateTo('backup-restore') redirect ke 'system-settings'
   - Verify renderPage('backup-restore') memanggil navigateTo('system-settings')

3. **Test System Settings Page**
   - Verify renderSystemSettings() menghasilkan HTML dengan tombol backup
   - Verify tombol memiliki onclick handler yang benar

4. **Test Backward Compatibility**
   - Verify renderBackupRestore() masih terdefinisi
   - Verify renderBackupRestore() masih berfungsi normal

### Integration Tests

1. **Test User Flow**
   - Login sebagai super_admin
   - Verify menu tidak menampilkan "Backup & Restore"
   - Navigate ke Pengaturan Sistem
   - Verify tombol backup tersedia
   - Click tombol backup
   - Verify UI backup & restore muncul

2. **Test Direct Access**
   - Simulate direct navigation ke 'backup-restore'
   - Verify redirect ke 'system-settings'

### Manual Testing Checklist

1. Login sebagai super_admin, verify menu tidak ada "Backup & Restore"
2. Login sebagai administrator, verify menu tidak ada "Backup & Restore"
3. Akses Pengaturan Sistem, verify tombol backup tersedia
4. Click tombol backup, verify UI backup muncul
5. Test semua fungsi backup & restore masih berfungsi
6. Test restore data, verify tidak ada error
7. Test download backup, verify file tergenerate

## Implementation Notes

1. **Urutan Implementasi**:
   - Pertama: Update renderSystemSettings() untuk menambahkan tombol backup
   - Kedua: Update renderPage() untuk redirect backup-restore
   - Ketiga: Hapus menu item dari array menus
   - Keempat: Test semua fungsi

2. **Rollback Plan**:
   - Jika ada masalah, cukup kembalikan perubahan di auth.js
   - Tidak ada perubahan database atau localStorage

3. **Deployment**:
   - Perubahan hanya di frontend JavaScript
   - Tidak perlu migrasi data
   - Bisa di-deploy langsung tanpa downtime

## Security Considerations

- Tidak ada perubahan pada security model
- Role-based access control tetap sama
- Fungsi backup & restore tetap hanya accessible oleh admin/super_admin melalui Pengaturan Sistem
