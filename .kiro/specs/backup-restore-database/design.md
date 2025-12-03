# Design Document

## Overview

Fitur Backup dan Restore Database adalah modul kritis yang memungkinkan administrator untuk mengekspor seluruh data aplikasi koperasi ke file JSON dan mengimpor kembali data tersebut. Fitur ini dirancang untuk mendukung migrasi data antar koperasi, pemulihan data setelah kehilangan data, dan duplikasi setup untuk koperasi baru.

Sistem ini menggunakan format JSON untuk backup file karena kompatibilitas dengan localStorage dan kemudahan parsing. Fitur ini mencakup validasi integritas data yang komprehensif, backup otomatis sebelum restore, dan kontrol akses yang ketat untuk mencegah penyalahgunaan.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Security & Authorization Layer              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Role Check   │  │ Confirmation │  │ Pre-Restore      │  │
│  │ (Admin Only) │  │ Dialog       │  │ Auto Backup      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     User Interface Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Backup Page  │  │ Statistics   │  │ File Upload      │  │
│  │ Dashboard    │  │ Display      │  │ & Preview        │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Backup       │  │ Restore      │  │ Validation       │  │
│  │ Service      │  │ Service      │  │ Service          │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ localStorage │  │ File System  │  │ JSON Parser      │  │
│  │ Manager      │  │ (Download)   │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Security Components

#### RoleValidator
Validasi role user untuk akses fitur backup/restore.

```javascript
class RoleValidator {
    /**
     * Cek apakah user adalah admin atau super admin
     * @param {Object} user - User object
     * @returns {boolean}
     */
    isAdmin(user) {
        return user && (user.role === 'administrator' || user.role === 'super_admin');
    }
}
```

### 2. Business Logic Services

#### BackupService
Service untuk mengekspor data ke file backup.

```javascript
class BackupService {
    /**
     * Buat backup lengkap dari semua data
     * @param {Object} options - Backup options (full/partial, categories)
     * @returns {Object} Backup data object
     */
    createBackup(options = { type: 'full', categories: [] }) {
        // 1. Collect metadata (timestamp, version, koperasi name)
        // 2. Collect all localStorage data or selected categories
        // 3. Calculate data size
        // 4. Create backup object with metadata
        // 5. Return backup object
    }
    
    /**
     * Download backup file
     * @param {Object} backupData - Backup data object
     */
    downloadBackup(backupData) {
        // 1. Convert to JSON string
        // 2. Create Blob
        // 3. Generate filename with timestamp
        // 4. Trigger download
        // 5. Save backup metadata to history
    }
    
    /**
     * Calculate estimated backup size
     * @param {Array} categories - Categories to backup
     * @returns {number} Size in bytes
     */
    calculateSize(categories = []) {
        // Calculate total size of selected data
    }
    
    /**
     * Get available data categories
     * @returns {Array} List of categories with counts
     */
    getCategories() {
        // Return list of all data categories
    }
}
```

#### RestoreService
Service untuk mengimpor data dari file backup.

```javascript
class RestoreService {
    /**
     * Restore data dari backup file
     * @param {Object} backupData - Parsed backup data
     * @returns {Object} { success: boolean, message: string, errors: Array }
     */
    restoreBackup(backupData) {
        // 1. Validate backup data structure
        // 2. Create auto backup of current data
        // 3. Clear existing data (if full restore)
        // 4. Restore data to localStorage
        // 5. Verify data integrity
        // 6. Return result
    }
    
    /**
     * Parse backup file
     * @param {File} file - Uploaded file
     * @returns {Promise<Object>} Parsed backup data
     */
    async parseBackupFile(file) {
        // 1. Read file as text
        // 2. Parse JSON
        // 3. Return parsed object
    }
    
    /**
     * Preview backup data
     * @param {Object} backupData - Parsed backup data
     * @returns {Object} Preview information
     */
    previewBackup(backupData) {
        // Return metadata and statistics
    }
}
```

#### ValidationService
Service untuk validasi integritas data backup.

```javascript
class ValidationService {
    /**
     * Validasi struktur backup file
     * @param {Object} backupData - Backup data object
     * @returns {Object} { valid: boolean, errors: Array, warnings: Array }
     */
    validateBackupStructure(backupData) {
        // 1. Check metadata exists
        // 2. Check required keys exist
        // 3. Check data types
        // 4. Check version compatibility
        // 5. Return validation result
    }
    
    /**
     * Validasi integritas data
     * @param {Object} backupData - Backup data object
     * @returns {Object} { valid: boolean, errors: Array }
     */
    validateDataIntegrity(backupData) {
        // 1. Check referential integrity
        // 2. Check data consistency
        // 3. Check required fields
        // 4. Return validation result
    }
    
    /**
     * Get required localStorage keys
     * @returns {Array} List of required keys
     */
    getRequiredKeys() {
        return [
            'users', 'koperasi', 'anggota', 'departemen',
            'simpananPokok', 'simpananWajib', 'simpananSukarela',
            'pinjaman', 'coa', 'jurnal', 'kategori', 'satuan',
            'barang', 'supplier', 'pembelian', 'penjualan'
        ];
    }
}
```

#### AutoBackupService
Service untuk backup otomatis sebelum restore.

```javascript
class AutoBackupService {
    /**
     * Buat backup otomatis sebelum restore
     * @returns {Object} { success: boolean, filename: string }
     */
    createPreRestoreBackup() {
        // 1. Create backup with special naming
        // 2. Download file automatically
        // 3. Save to backup history
        // 4. Return result
    }
}
```

### 3. UI Components

#### BackupDashboard
Halaman utama backup/restore.

```javascript
function renderBackupDashboard() {
    // Render dashboard with:
    // - Statistics cards (data counts)
    // - Last backup info
    // - Backup button
    // - Restore button
    // - Backup history
}
```

#### BackupOptionsDialog
Dialog untuk memilih opsi backup.

```javascript
function showBackupOptions() {
    // Show modal with:
    // - Full backup option
    // - Partial backup option
    // - Category checkboxes
    // - Size estimation
    // - Confirm button
}
```

#### RestoreConfirmationDialog
Dialog konfirmasi sebelum restore.

```javascript
function showRestoreConfirmation(backupInfo) {
    // Show modal with:
    // - Warning message
    // - Backup preview info
    // - Impact list
    // - Confirmation checkbox
    // - Keyword input ("RESTORE")
    // - Confirm button
}
```

#### BackupPreviewDialog
Dialog preview backup file.

```javascript
function showBackupPreview(backupData) {
    // Show modal with:
    // - Metadata (date, version, koperasi)
    // - Data statistics
    // - Compatibility warnings
    // - Proceed button
}
```

## Data Models

### Backup File Structure
```javascript
{
    metadata: {
        version: string,              // App version (e.g., "1.0.0")
        backupDate: string (ISO),     // Backup creation date
        backupType: string,           // "full" | "partial"
        koperasiName: string,         // Name of koperasi
        koperasiId: string,           // Unique ID
        categories: Array<string>,    // Categories included in backup
        dataCount: {                  // Count of records per category
            anggota: number,
            transaksi: number,
            // ... other counts
        },
        size: number                  // Backup size in bytes
    },
    data: {
        users: Array,
        koperasi: Object,
        anggota: Array,
        departemen: Array,
        simpananPokok: Array,
        simpananWajib: Array,
        simpananSukarela: Array,
        pinjaman: Array,
        coa: Array,
        jurnal: Array,
        kategori: Array,
        satuan: Array,
        barang: Array,
        supplier: Array,
        pembelian: Array,
        penjualan: Array,
        stokOpname: Array,
        saldoAwalPeriode: Object | null,
        periodeAktif: boolean,
        piutangAwal: Array,
        hutangAwal: Array
    }
}
```

### Backup History Model
```javascript
{
    id: string,
    filename: string,
    date: string (ISO),
    type: string,                     // "full" | "partial" | "pre-restore"
    size: number,
    koperasiName: string,
    categories: Array<string>,
    success: boolean
}
```

### Restore Result Model
```javascript
{
    success: boolean,
    message: string,
    errors: Array<string>,
    warnings: Array<string>,
    restored: {
        categories: Array<string>,
        recordCount: number
    },
    autoBackup: {
        created: boolean,
        filename: string
    }
}
```

## Error Handling

### Validation Errors

1. **Invalid File Format**
   - Error: "File bukan format backup yang valid"
   - Action: Reject file, show error message

2. **Missing Required Keys**
   - Error: "Data backup tidak lengkap. Key yang hilang: [list]"
   - Action: Prevent restore, show missing keys

3. **Version Incompatibility**
   - Warning: "Backup dari versi berbeda (v1.0 vs v2.0). Mungkin ada masalah kompatibilitas."
   - Action: Show warning, allow user to proceed or cancel

4. **Data Type Mismatch**
   - Error: "Tipe data tidak sesuai untuk key '[key]'. Expected: Array, Got: Object"
   - Action: Prevent restore, show error

5. **Corrupted Data**
   - Error: "Data backup rusak atau tidak dapat dibaca"
   - Action: Reject file, suggest re-download

### Runtime Errors

1. **localStorage Full**
   - Error: "Penyimpanan penuh. Tidak dapat restore data."
   - Action: Show error, suggest clearing old data

2. **Auto Backup Failed**
   - Error: "Gagal membuat backup otomatis. Restore dibatalkan untuk keamanan."
   - Action: Cancel restore, show error

3. **Restore Interrupted**
   - Error: "Restore terganggu. Data mungkin tidak lengkap."
   - Action: Attempt rollback, show error

4. **File Read Error**
   - Error: "Gagal membaca file backup"
   - Action: Show error, suggest re-upload

### User Errors

1. **Confirmation Not Provided**
   - Warning: "Anda harus mencentang checkbox konfirmasi"
   - Action: Disable confirm button

2. **Wrong Keyword**
   - Error: "Kata kunci salah. Ketik 'RESTORE' untuk melanjutkan"
   - Action: Prevent restore, highlight input

3. **No File Selected**
   - Error: "Pilih file backup terlebih dahulu"
   - Action: Show error, highlight file input

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Complete data export
*For any* localStorage state, when backup is created, all data keys should be present in the exported JSON.
**Validates: Requirements 1.1**

### Property 2: Filename format correctness
*For any* backup operation, the generated filename should contain the koperasi name and timestamp in the correct format.
**Validates: Requirements 1.2**

### Property 3: Metadata completeness
*For any* backup file, the metadata should contain tanggal, versi aplikasi, and nama koperasi fields.
**Validates: Requirements 1.3**

### Property 4: Password protection
*For any* backup file, user password fields should not be stored in plain text.
**Validates: Requirements 1.4**

### Property 5: Backup validation
*For any* file selected for restore, the system should validate its format and structure before proceeding.
**Validates: Requirements 2.1**

### Property 6: Data replacement completeness
*For any* valid backup file, when restore is confirmed, all localStorage keys should be replaced with data from the backup.
**Validates: Requirements 2.3**

### Property 7: Invalid file rejection
*For any* invalid or corrupted backup file, the system should reject restore and display a specific error message.
**Validates: Requirements 2.5**

### Property 8: Required keys validation
*For any* backup file, the system should verify that all required data keys are present.
**Validates: Requirements 3.1**

### Property 9: Data type validation
*For any* backup file, the system should verify that each key has the correct data type (array, object, string).
**Validates: Requirements 3.2**

### Property 10: Version compatibility warning
*For any* backup file with a different version, the system should display a compatibility warning.
**Validates: Requirements 3.3**

### Property 11: Missing keys reporting
*For any* incomplete backup file, the system should display a list of missing or invalid keys.
**Validates: Requirements 3.4**

### Property 12: Validation failure prevention
*For any* backup file that fails validation, the system should prevent the restore process.
**Validates: Requirements 3.5**

### Property 13: Auto backup creation
*For any* restore operation, the system should automatically create a backup of current data before proceeding.
**Validates: Requirements 4.1**

### Property 14: Pre-restore backup naming
*For any* auto backup created before restore, the filename should indicate it is a pre-restore backup.
**Validates: Requirements 4.2**

### Property 15: Auto backup failure handling
*For any* restore operation where auto backup fails, the system should cancel the restore and display an error.
**Validates: Requirements 4.4**

### Property 16: Statistics calculation accuracy
*For any* localStorage state, the displayed statistics should accurately reflect the count of records in each category.
**Validates: Requirements 5.3**

### Property 17: Admin menu visibility
*For any* user with role super_admin or administrator, the Backup/Restore menu should be visible in the sidebar.
**Validates: Requirements 6.1**

### Property 18: Non-admin menu hiding
*For any* user with role kasir or keuangan, the Backup/Restore menu should be hidden.
**Validates: Requirements 6.2**

### Property 19: Access control enforcement
*For any* non-admin user attempting to access the backup URL, the system should display an access denied message.
**Validates: Requirements 6.3**

### Property 20: Role verification on page load
*For any* page load of the backup feature, the system should verify user role before displaying content.
**Validates: Requirements 6.4**

### Property 21: Keyword confirmation validation
*For any* restore confirmation, the system should validate that the correct keyword is entered before proceeding.
**Validates: Requirements 7.3**

### Property 22: Cancel without changes
*For any* restore operation that is cancelled, no changes should be made to localStorage.
**Validates: Requirements 7.5**

### Property 23: Version metadata inclusion
*For any* backup file created, the metadata should include the application version number.
**Validates: Requirements 8.1**

### Property 24: Data migration for old versions
*For any* backup file from an older version, the system should perform data migration if needed.
**Validates: Requirements 8.2**

### Property 25: Migration logging
*For any* data migration performed, the system should log the changes made.
**Validates: Requirements 8.3**

### Property 26: Incompatibility warnings
*For any* backup file with incompatible version, the system should display a warning with option to proceed.
**Validates: Requirements 8.4**

### Property 27: Post-restore verification
*For any* completed restore operation, the system should verify all data has been migrated correctly.
**Validates: Requirements 8.5**

### Property 28: Partial backup export
*For any* partial backup with selected categories, only data from those categories should be exported.
**Validates: Requirements 9.3**

### Property 29: Partial backup metadata
*For any* partial backup created, the metadata should mark it as a partial backup.
**Validates: Requirements 9.4**

### Property 30: Partial restore behavior
*For any* partial backup being restored, only the categories present in the backup should be replaced.
**Validates: Requirements 9.5**

### Property 31: Size estimation accuracy
*For any* set of selected categories, the estimated backup size should accurately reflect the total data size.
**Validates: Requirements 10.1**

### Property 32: Dynamic size calculation
*For any* change in selected categories, the size estimation should update to reflect the new selection.
**Validates: Requirements 10.3**

### Property 33: Large file warning
*For any* backup with size exceeding a threshold, the system should display a warning about download time.
**Validates: Requirements 10.4**

### Property 34: Size breakdown calculation
*For any* backup operation, the system should calculate and provide size breakdown per data category.
**Validates: Requirements 10.5**

## Testing Strategy

### Unit Testing

Unit tests will verify individual components and functions:

1. **BackupService Tests**
   - Test `createBackup()` with full and partial options
   - Test `calculateSize()` with various data sets
   - Test `getCategories()` returns correct list
   - Test filename generation with various koperasi names

2. **RestoreService Tests**
   - Test `parseBackupFile()` with valid and invalid files
   - Test `previewBackup()` returns correct information
   - Test `restoreBackup()` with various backup data

3. **ValidationService Tests**
   - Test `validateBackupStructure()` with valid/invalid structures
   - Test `validateDataIntegrity()` with various data states
   - Test `getRequiredKeys()` returns complete list
   - Test type validation for each data category

4. **AutoBackupService Tests**
   - Test `createPreRestoreBackup()` creates backup with correct naming
   - Test auto backup failure handling

5. **RoleValidator Tests**
   - Test `isAdmin()` with various user roles
   - Test access control logic

### Property-Based Testing

Property-based tests will verify universal properties using **fast-check** library. Each test will run a minimum of 100 iterations.

1. **Backup Properties**
   - Generate random localStorage states
   - Verify Property 1: Complete data export
   - Verify Property 2: Filename format correctness
   - Verify Property 3: Metadata completeness
   - Verify Property 4: Password protection

2. **Validation Properties**
   - Generate random backup files (valid and invalid)
   - Verify Property 5: Backup validation
   - Verify Property 7: Invalid file rejection
   - Verify Property 8: Required keys validation
   - Verify Property 9: Data type validation
   - Verify Property 10: Version compatibility warning
   - Verify Property 11: Missing keys reporting
   - Verify Property 12: Validation failure prevention

3. **Restore Properties**
   - Generate random valid backups
   - Verify Property 6: Data replacement completeness
   - Verify Property 13: Auto backup creation
   - Verify Property 14: Pre-restore backup naming
   - Verify Property 15: Auto backup failure handling
   - Verify Property 27: Post-restore verification

4. **Access Control Properties**
   - Generate random users with various roles
   - Verify Property 17: Admin menu visibility
   - Verify Property 18: Non-admin menu hiding
   - Verify Property 19: Access control enforcement
   - Verify Property 20: Role verification on page load

5. **Confirmation Properties**
   - Generate random confirmation scenarios
   - Verify Property 21: Keyword confirmation validation
   - Verify Property 22: Cancel without changes

6. **Version Properties**
   - Generate backups with various versions
   - Verify Property 23: Version metadata inclusion
   - Verify Property 24: Data migration for old versions
   - Verify Property 25: Migration logging
   - Verify Property 26: Incompatibility warnings

7. **Partial Backup Properties**
   - Generate random category selections
   - Verify Property 28: Partial backup export
   - Verify Property 29: Partial backup metadata
   - Verify Property 30: Partial restore behavior

8. **Size Calculation Properties**
   - Generate random data sets
   - Verify Property 31: Size estimation accuracy
   - Verify Property 32: Dynamic size calculation
   - Verify Property 33: Large file warning
   - Verify Property 34: Size breakdown calculation

### Integration Testing

Integration tests will verify complete backup/restore flows:

1. **Complete Backup Flow**
   - Create backup with full data
   - Verify file is downloaded
   - Verify file contains all data
   - Verify metadata is correct

2. **Complete Restore Flow**
   - Upload valid backup file
   - Verify preview is shown
   - Confirm restore with keyword
   - Verify auto backup is created
   - Verify data is restored
   - Verify application reloads

3. **Partial Backup/Restore Flow**
   - Select specific categories
   - Create partial backup
   - Restore partial backup
   - Verify only selected categories are affected

4. **Error Handling Flow**
   - Upload invalid file
   - Verify validation errors
   - Verify restore is prevented
   - Upload corrupted file
   - Verify appropriate error messages

5. **Access Control Flow**
   - Login as non-admin user
   - Verify menu is hidden
   - Attempt direct URL access
   - Verify access is denied

### Test Data Generators

For property-based testing, create generators for:

1. **localStorage State Generator**
   ```javascript
   fc.record({
       users: fc.array(userGenerator),
       anggota: fc.array(anggotaGenerator),
       koperasi: koperasiGenerator,
       // ... other data categories
   })
   ```

2. **Backup File Generator**
   ```javascript
   fc.record({
       metadata: metadataGenerator,
       data: localStorageStateGenerator
   })
   ```

3. **User Generator**
   ```javascript
   fc.record({
       id: fc.nat(),
       username: fc.string(),
       role: fc.constantFrom('administrator', 'super_admin', 'kasir', 'keuangan'),
       name: fc.string()
   })
   ```

4. **Category Selection Generator**
   ```javascript
   fc.array(
       fc.constantFrom('anggota', 'transaksi', 'simpanan', 'pinjaman', 'barang'),
       { minLength: 1 }
   )
   ```

## Security Considerations

1. **Access Control**
   - Role-based access (admin/super_admin only)
   - URL access protection
   - Page load verification

2. **Data Protection**
   - Password hashing/encryption in backups
   - Sensitive data handling
   - Secure file download

3. **Validation**
   - Comprehensive file validation
   - Data integrity checks
   - Version compatibility checks

4. **Audit Trail**
   - Log all backup operations
   - Log all restore operations
   - Track backup history

## Performance Considerations

1. **Large Data Handling**
   - Stream large files instead of loading entirely in memory
   - Show progress indicators for long operations
   - Implement chunked processing for large datasets

2. **localStorage Optimization**
   - Batch localStorage operations
   - Minimize read/write operations
   - Clear unused data before restore

3. **File Operations**
   - Compress backup files if size exceeds threshold
   - Use Web Workers for file processing
   - Implement cancellable operations

## Implementation Notes

### Phase 1: Core Backup Functionality
1. Create `js/backup.js` file
2. Implement BackupService
3. Implement basic UI for backup
4. Implement file download

### Phase 2: Core Restore Functionality
1. Implement RestoreService
2. Implement ValidationService
3. Implement file upload and parsing
4. Implement restore confirmation dialog

### Phase 3: Advanced Features
1. Implement AutoBackupService
2. Implement partial backup/restore
3. Implement version migration
4. Implement size estimation

### Phase 4: Security & Access Control
1. Implement RoleValidator
2. Add menu visibility logic
3. Add URL access protection
4. Implement confirmation dialogs

### Phase 5: Testing
1. Write unit tests
2. Write property-based tests
3. Perform integration testing
4. Test with real data scenarios

### Dependencies

**External Libraries:**
- Bootstrap 5.3.0 (already included)
- Bootstrap Icons (already included)
- fast-check (for property-based testing)

**Internal Dependencies:**
- `js/app.js` - for utility functions
- `js/auth.js` - for user authentication
- localStorage - for data persistence

### Browser Compatibility

- Modern browsers with localStorage support
- FileReader API support
- Blob and URL.createObjectURL support
- ES6+ JavaScript features

### localStorage Keys

New keys added:
- `backupHistory` - Array of backup history records
- `lastBackupDate` - ISO date string of last backup
