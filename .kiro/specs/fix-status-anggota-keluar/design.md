# Design Document: Fix Status Anggota Keluar

## Overview

Dokumen ini menjelaskan desain untuk memperbaiki bug di mana anggota yang sudah keluar masih menampilkan status "Aktif" di Master Anggota. Solusi melibatkan migrasi data otomatis dan perbaikan logika tampilan status.

## Architecture

Solusi ini menggunakan pendekatan **data migration on load** di mana sistem akan:
1. Mendeteksi inkonsistensi data saat aplikasi dimuat
2. Memperbaiki data secara otomatis di background
3. Memastikan tampilan selalu menggunakan data yang sudah diperbaiki

### Component Diagram

```
┌─────────────────────┐
│   Master Anggota    │
│      (UI Layer)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Data Migration     │
│     Service         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   LocalStorage      │
│   (Data Layer)      │
└─────────────────────┘
```

## Components and Interfaces

### 1. Data Migration Service

**File**: `js/dataMigration.js` (sudah ada, akan ditambahkan fungsi baru)

**Fungsi Baru**: `migrateAnggotaKeluarStatus()`

```javascript
/**
 * Migrate anggota keluar status to ensure consistency
 * Fixes legacy data where statusKeanggotaan = 'Keluar' but status = 'Aktif'
 * @returns {Object} Migration result with count of fixed records
 */
function migrateAnggotaKeluarStatus() {
    // Load anggota data
    // Find anggota with inconsistent status
    // Fix status field to 'Nonaktif'
    // Remove statusKeanggotaan field
    // Save back to localStorage
    // Return migration stats
}
```

### 2. Koperasi Module Enhancement

**File**: `js/koperasi.js`

**Fungsi yang Dimodifikasi**: `renderAnggota()`

Akan menambahkan pemanggilan migrasi data sebelum render:

```javascript
function renderAnggota() {
    // Run migration first
    const migrationResult = migrateAnggotaKeluarStatus();
    if (migrationResult.fixed > 0) {
        console.log(`Fixed ${migrationResult.fixed} anggota records`);
    }
    
    // Continue with existing render logic
    // ...
}
```

### 3. Display Logic Enhancement

**File**: `js/koperasi.js`

**Fungsi yang Dimodifikasi**: `renderTableAnggota()`

Memastikan status yang ditampilkan selalu konsisten:

```javascript
// Determine actual status (with fallback for legacy data)
const actualStatus = a.tanggalKeluar ? 'Nonaktif' : (a.status || 'Aktif');
const statusBadge = actualStatus === 'Aktif' ? 'bg-success' : 
                   actualStatus === 'Nonaktif' ? 'bg-secondary' : 'bg-warning';
```

## Data Models

### Anggota Object (Before Migration)

```javascript
{
    id: "uuid",
    nik: "1234567890123456",
    nama: "John Doe",
    status: "Aktif",  // ❌ WRONG - should be Nonaktif
    statusKeanggotaan: "Keluar",  // ❌ Legacy field
    tanggalKeluar: "2024-12-01",
    alasanKeluar: "Pensiun",
    pengembalianStatus: "Pending"
}
```

### Anggota Object (After Migration)

```javascript
{
    id: "uuid",
    nik: "1234567890123456",
    nama: "John Doe",
    status: "Nonaktif",  // ✅ FIXED
    // statusKeanggotaan removed
    tanggalKeluar: "2024-12-01",
    alasanKeluar: "Pensiun",
    pengembalianStatus: "Pending"
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Status consistency for exited members

*For any* anggota with `tanggalKeluar` field populated, the `status` field should always be "Nonaktif"

**Validates: Requirements 1.2, 2.1**

### Property 2: Legacy field removal

*For any* anggota after migration, the `statusKeanggotaan` field should not exist

**Validates: Requirements 2.2, 2.3**

### Property 3: Display status correctness

*For any* anggota displayed in Master Anggota, if they have `tanggalKeluar` then the displayed status badge should show "Nonaktif" with grey color

**Validates: Requirements 1.1, 3.5**

### Property 4: Filter consistency

*For any* filter selection "Nonaktif", the results should include all anggota with `status = 'Nonaktif'` including those with `tanggalKeluar`

**Validates: Requirements 3.1, 3.4**

### Property 5: Migration idempotence

*For any* number of times migration is run, running it again should result in zero changes (idempotent operation)

**Validates: Requirements 1.4, 2.5**

## Error Handling

### Migration Errors

- **Scenario**: LocalStorage read/write fails
- **Handling**: Log error to console, continue with existing data, show warning to user
- **Recovery**: User can refresh page to retry migration

### Data Validation Errors

- **Scenario**: Anggota object has invalid structure
- **Handling**: Skip invalid records, log warning, continue with valid records
- **Recovery**: Manual data cleanup may be required

### Display Errors

- **Scenario**: Status field is missing or invalid
- **Handling**: Use fallback logic (check tanggalKeluar, default to 'Aktif')
- **Recovery**: Migration will fix on next load

## Testing Strategy

### Unit Tests

1. **Test migration function**
   - Test with anggota having `statusKeanggotaan = 'Keluar'` and `status = 'Aktif'`
   - Verify status is changed to 'Nonaktif'
   - Verify statusKeanggotaan field is removed

2. **Test display logic**
   - Test status badge color for different status values
   - Test fallback logic when status is missing

3. **Test filter logic**
   - Test filter "Nonaktif" includes anggota with tanggalKeluar
   - Test filter "Aktif" excludes anggota with tanggalKeluar

### Property-Based Tests

Property-based tests will be written using **fast-check** library for JavaScript. Each test will run a minimum of 100 iterations.

1. **Property 1 Test**: Generate random anggota with tanggalKeluar, run migration, verify status is 'Nonaktif'
2. **Property 2 Test**: Generate random anggota with statusKeanggotaan, run migration, verify field is removed
3. **Property 3 Test**: Generate random anggota with tanggalKeluar, render display, verify badge shows 'Nonaktif'
4. **Property 4 Test**: Generate random anggota list, apply filter 'Nonaktif', verify all results have status 'Nonaktif'
5. **Property 5 Test**: Generate random anggota list, run migration twice, verify second run changes nothing

### Integration Tests

1. **End-to-end test**: Load page, verify migration runs, verify display is correct
2. **Filter test**: Apply different filters, verify results match expected status
3. **Persistence test**: Migrate data, reload page, verify data remains fixed

## Implementation Notes

### Migration Timing

Migration akan dijalankan:
- Saat `renderAnggota()` dipanggil (setiap kali Master Anggota dibuka)
- Migrasi bersifat idempotent, aman dijalankan berulang kali
- Tidak perlu migrasi manual atau one-time script

### Backward Compatibility

- Sistem tetap dapat membaca data lama
- Fallback logic memastikan tampilan tetap benar meskipun migrasi belum berjalan
- Tidak ada breaking changes pada struktur data yang sudah benar

### Performance Considerations

- Migrasi hanya memproses data yang perlu diperbaiki
- Kompleksitas: O(n) di mana n = jumlah anggota
- Untuk 1000 anggota, migrasi selesai dalam < 100ms
- Tidak mempengaruhi user experience

## Deployment Plan

1. Deploy kode baru ke production
2. Migrasi akan berjalan otomatis saat user membuka Master Anggota
3. Monitor console log untuk melihat jumlah data yang diperbaiki
4. Verifikasi tampilan status sudah benar
5. Tidak perlu downtime atau maintenance window
