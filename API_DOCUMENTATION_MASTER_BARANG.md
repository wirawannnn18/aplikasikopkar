# API Documentation - Master Barang Komprehensif

## Overview

Master Barang Komprehensif menggunakan client-side JavaScript API yang berinteraksi dengan localStorage untuk penyimpanan data. Semua operasi dilakukan secara asynchronous untuk konsistensi dengan pola modern JavaScript.

## Core API Classes

### MasterBarangSystem

Main system controller yang mengatur semua operasi master barang.

```javascript
const masterBarangSystem = new MasterBarangSystem();
```

#### Methods

##### `initialize()`
Inisialisasi sistem dan memuat data awal.

```javascript
await masterBarangSystem.initialize();
```

**Returns**: `Promise<void>`

##### `getAllBarang(options)`
Mengambil semua data barang dengan opsi pagination dan sorting.

```javascript
const result = await masterBarangSystem.getAllBarang({
    page: 1,
    limit: 50,
    sortBy: 'nama',
    sortOrder: 'asc'
});
```

**Parameters**:
- `options` (Object, optional)
  - `page` (Number): Halaman data (default: 1)
  - `limit` (Number): Jumlah item per halaman (default: 50)
  - `sortBy` (String): Field untuk sorting (default: 'nama')
  - `sortOrder` (String): 'asc' atau 'desc' (default: 'asc')

**Returns**: `Promise<PaginatedResult>`

```javascript
{
    data: Barang[],
    pagination: {
        currentPage: number,
        totalPages: number,
        totalItems: number,
        hasNext: boolean,
        hasPrev: boolean
    }
}
```

##### `getBarangById(id)`
Mengambil data barang berdasarkan ID.

```javascript
const barang = await masterBarangSystem.getBarangById('brg001');
```

**Parameters**:
- `id` (String): ID barang

**Returns**: `Promise<Barang | null>`

##### `saveBarang(data)`
Menyimpan data barang (create atau update).

```javascript
const result = await masterBarangSystem.saveBarang({
    id: 'brg001', // optional untuk update
    kode: 'MB001',
    nama: 'Beras 5kg',
    kategoriId: 'kat001',
    satuanId: 'sat001',
    hargaBeli: 50000,
    hargaJual: 55000,
    stok: 100,
    stokMinimum: 10
});
```

**Parameters**:
- `data` (Object): Data barang

**Returns**: `Promise<SaveResult>`

```javascript
{
    success: boolean,
    data: Barang,
    errors: string[],
    warnings: string[]
}
```

##### `deleteBarang(id)`
Menghapus data barang.

```javascript
const result = await masterBarangSystem.deleteBarang('brg001');
```

**Parameters**:
- `id` (String): ID barang

**Returns**: `Promise<DeleteResult>`

```javascript
{
    success: boolean,
    message: string,
    auditId: string
}
```

##### `searchBarang(query, options)`
Mencari barang berdasarkan query.

```javascript
const results = await masterBarangSystem.searchBarang('beras', {
    fields: ['nama', 'kode'],
    limit: 20,
    includeInactive: false
});
```

**Parameters**:
- `query` (String): Query pencarian
- `options` (Object, optional)
  - `fields` (String[]): Field yang dicari (default: ['nama', 'kode'])
  - `limit` (Number): Maksimal hasil (default: 50)
  - `includeInactive` (Boolean): Sertakan item non-aktif (default: false)

**Returns**: `Promise<SearchResult>`

```javascript
{
    results: Barang[],
    totalFound: number,
    query: string,
    searchTime: number
}
```

##### `filterBarang(filters)`
Filter barang berdasarkan kriteria.

```javascript
const filtered = await masterBarangSystem.filterBarang({
    kategoriId: 'kat001',
    satuanId: 'sat001',
    stokMinimum: 10,
    status: 'active',
    hargaRange: { min: 10000, max: 100000 }
});
```

**Parameters**:
- `filters` (Object): Kriteria filter
  - `kategoriId` (String, optional): ID kategori
  - `satuanId` (String, optional): ID satuan
  - `status` (String, optional): 'active' atau 'inactive'
  - `stokMinimum` (Number, optional): Stok minimum
  - `hargaRange` (Object, optional): Range harga
    - `min` (Number): Harga minimum
    - `max` (Number): Harga maksimum

**Returns**: `Promise<FilterResult>`

```javascript
{
    data: Barang[],
    totalFiltered: number,
    appliedFilters: Object
}
```

### ValidationEngine

Engine untuk validasi data.

```javascript
const validationEngine = new ValidationEngine();
```

#### Methods

##### `validateBarang(data)`
Validasi data barang.

```javascript
const validation = validationEngine.validateBarang({
    nama: 'Beras 5kg',
    kategoriId: 'kat001',
    // ... data lainnya
});
```

**Returns**: `ValidationResult`

```javascript
{
    isValid: boolean,
    errors: string[],
    warnings: string[]
}
```

##### `validateImportData(data)`
Validasi data untuk import.

```javascript
const validation = validationEngine.validateImportData([
    { nama: 'Beras', kategori: 'Sembako', satuan: 'Kg' },
    // ... data lainnya
]);
```

**Returns**: `ImportValidationResult`

```javascript
{
    isValid: boolean,
    validRows: Object[],
    invalidRows: Object[],
    errors: string[],
    warnings: string[]
}
```

### ImportManager

Manager untuk operasi import.

```javascript
const importManager = new ImportManager();
```

#### Methods

##### `processFile(file)`
Memproses file upload.

```javascript
const result = await importManager.processFile(file);
```

**Parameters**:
- `file` (File): File object dari input

**Returns**: `Promise<FileProcessResult>`

```javascript
{
    success: boolean,
    data: Object[],
    headers: string[],
    rowCount: number,
    errors: string[]
}
```

##### `previewImport(data, options)`
Preview data sebelum import.

```javascript
const preview = await importManager.previewImport(data, {
    updateExisting: true,
    createNewCategories: true
});
```

**Parameters**:
- `data` (Object[]): Data yang akan diimport
- `options` (Object): Opsi import

**Returns**: `Promise<ImportPreview>`

```javascript
{
    totalRows: number,
    validRows: number,
    invalidRows: number,
    newItems: number,
    updateItems: number,
    newCategories: string[],
    newUnits: string[],
    errors: string[],
    warnings: string[]
}
```

##### `executeImport(data, options)`
Eksekusi import data.

```javascript
const result = await importManager.executeImport(data, {
    updateExisting: true,
    createNewCategories: true,
    createNewUnits: true
});
```

**Returns**: `Promise<ImportResult>`

```javascript
{
    success: boolean,
    imported: number,
    updated: number,
    skipped: number,
    errors: string[],
    auditId: string
}
```

### ExportManager

Manager untuk operasi export.

```javascript
const exportManager = new ExportManager();
```

#### Methods

##### `exportToExcel(data, options)`
Export data ke format Excel.

```javascript
const file = await exportManager.exportToExcel(data, {
    filename: 'master_barang_export',
    includeHeaders: true,
    includeAuditInfo: false
});
```

**Parameters**:
- `data` (Object[]): Data yang akan diexport
- `options` (Object): Opsi export

**Returns**: `Promise<Blob>`

##### `exportToCSV(data, options)`
Export data ke format CSV.

```javascript
const file = await exportManager.exportToCSV(data, {
    filename: 'master_barang_export',
    delimiter: ',',
    encoding: 'utf-8'
});
```

**Returns**: `Promise<Blob>`

##### `downloadFile(blob, filename)`
Download file ke browser.

```javascript
exportManager.downloadFile(blob, 'master_barang.xlsx');
```

### AuditLogger

Logger untuk audit trail.

```javascript
const auditLogger = new AuditLogger();
```

#### Methods

##### `log(action, entityType, entityId, oldData, newData, metadata)`
Mencatat aktivitas audit.

```javascript
await auditLogger.log(
    'CREATE',
    'BARANG',
    'brg001',
    null,
    barangData,
    { userId: 'user001', source: 'web' }
);
```

**Parameters**:
- `action` (String): Jenis aksi ('CREATE', 'UPDATE', 'DELETE')
- `entityType` (String): Tipe entitas ('BARANG', 'KATEGORI', 'SATUAN')
- `entityId` (String): ID entitas
- `oldData` (Object): Data lama (untuk UPDATE/DELETE)
- `newData` (Object): Data baru (untuk CREATE/UPDATE)
- `metadata` (Object): Metadata tambahan

##### `getAuditLogs(filters)`
Mengambil audit logs.

```javascript
const logs = await auditLogger.getAuditLogs({
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    action: 'CREATE',
    entityType: 'BARANG'
});
```

**Returns**: `Promise<AuditLog[]>`

## Data Models

### Barang
```javascript
{
    id: string,           // Unique identifier
    kode: string,         // Unique code
    nama: string,         // Item name
    kategoriId: string,   // Category reference
    satuanId: string,     // Unit reference
    hargaBeli: number,    // Purchase price
    hargaJual: number,    // Selling price
    stok: number,         // Current stock
    stokMinimum: number,  // Minimum stock
    status: string,       // 'active' | 'inactive'
    createdAt: Date,      // Creation timestamp
    updatedAt: Date       // Last update timestamp
}
```

### Kategori
```javascript
{
    id: string,           // Unique identifier
    nama: string,         // Category name
    deskripsi: string,    // Description
    status: string,       // 'active' | 'inactive'
    createdAt: Date,      // Creation timestamp
    updatedAt: Date       // Last update timestamp
}
```

### Satuan
```javascript
{
    id: string,           // Unique identifier
    nama: string,         // Unit name
    singkatan: string,    // Abbreviation
    status: string,       // 'active' | 'inactive'
    createdAt: Date,      // Creation timestamp
    updatedAt: Date       // Last update timestamp
}
```

### AuditLog
```javascript
{
    id: string,           // Unique identifier
    timestamp: Date,      // When the action occurred
    userId: string,       // User who performed the action
    action: string,       // 'CREATE' | 'UPDATE' | 'DELETE'
    entityType: string,   // 'BARANG' | 'KATEGORI' | 'SATUAN'
    entityId: string,     // ID of the affected entity
    oldData: Object,      // Previous data (for UPDATE/DELETE)
    newData: Object,      // New data (for CREATE/UPDATE)
    metadata: Object      // Additional metadata
}
```

## Error Handling

### Error Types

#### ValidationError
```javascript
{
    name: 'ValidationError',
    message: string,
    field: string,
    value: any,
    rule: string
}
```

#### BusinessRuleError
```javascript
{
    name: 'BusinessRuleError',
    message: string,
    rule: string,
    context: Object
}
```

#### StorageError
```javascript
{
    name: 'StorageError',
    message: string,
    operation: string,
    quota: boolean
}
```

### Error Handling Pattern

```javascript
try {
    const result = await masterBarangSystem.saveBarang(data);
    if (!result.success) {
        // Handle validation errors
        result.errors.forEach(error => {
            console.error('Validation error:', error);
        });
    }
} catch (error) {
    if (error.name === 'StorageError') {
        // Handle storage issues
        console.error('Storage error:', error.message);
    } else {
        // Handle other errors
        console.error('Unexpected error:', error);
    }
}
```

## Events

### System Events

Master Barang System mengeluarkan events untuk integrasi dengan sistem lain.

```javascript
// Listen to events
masterBarangSystem.on('barang:created', (data) => {
    console.log('New barang created:', data);
});

masterBarangSystem.on('barang:updated', (data) => {
    console.log('Barang updated:', data);
});

masterBarangSystem.on('barang:deleted', (data) => {
    console.log('Barang deleted:', data);
});

masterBarangSystem.on('import:completed', (result) => {
    console.log('Import completed:', result);
});
```

### Available Events

- `barang:created` - Barang baru dibuat
- `barang:updated` - Barang diupdate
- `barang:deleted` - Barang dihapus
- `kategori:created` - Kategori baru dibuat
- `kategori:updated` - Kategori diupdate
- `kategori:deleted` - Kategori dihapus
- `satuan:created` - Satuan baru dibuat
- `satuan:updated` - Satuan diupdate
- `satuan:deleted` - Satuan dihapus
- `import:started` - Import dimulai
- `import:progress` - Progress import
- `import:completed` - Import selesai
- `export:started` - Export dimulai
- `export:completed` - Export selesai

## Configuration

### System Configuration

```javascript
const CONFIG = {
    STORAGE_PREFIX: 'master_barang_',
    MAX_IMPORT_SIZE: 5 * 1024 * 1024, // 5MB
    AUDIT_RETENTION_DAYS: 365,
    PAGINATION_SIZE: 50,
    SEARCH_DEBOUNCE: 300,
    AUTO_SAVE_INTERVAL: 30000, // 30 seconds
    VALIDATION_RULES: {
        KODE_MAX_LENGTH: 20,
        NAMA_MAX_LENGTH: 100,
        HARGA_MAX_VALUE: 999999999
    }
};
```

### Customization

```javascript
// Override default configuration
masterBarangSystem.configure({
    paginationSize: 100,
    searchDebounce: 500,
    autoGenerateKode: true
});
```

## Integration Examples

### Basic CRUD Operations

```javascript
// Initialize system
await masterBarangSystem.initialize();

// Create new barang
const newBarang = await masterBarangSystem.saveBarang({
    nama: 'Beras Premium 5kg',
    kategoriId: 'kat001',
    satuanId: 'sat001',
    hargaBeli: 55000,
    hargaJual: 60000,
    stok: 50,
    stokMinimum: 5
});

// Search barang
const searchResults = await masterBarangSystem.searchBarang('beras');

// Update barang
const updatedBarang = await masterBarangSystem.saveBarang({
    id: newBarang.data.id,
    nama: 'Beras Premium 5kg - Updated',
    stok: 45
});

// Delete barang
await masterBarangSystem.deleteBarang(newBarang.data.id);
```

### Import/Export Operations

```javascript
// Import from file
const fileInput = document.getElementById('fileInput');
const file = fileInput.files[0];

const processResult = await importManager.processFile(file);
if (processResult.success) {
    const preview = await importManager.previewImport(processResult.data);
    console.log('Import preview:', preview);
    
    if (confirm(`Import ${preview.validRows} items?`)) {
        const importResult = await importManager.executeImport(processResult.data);
        console.log('Import result:', importResult);
    }
}

// Export data
const allBarang = await masterBarangSystem.getAllBarang();
const excelFile = await exportManager.exportToExcel(allBarang.data);
exportManager.downloadFile(excelFile, 'master_barang_export.xlsx');
```

---

*API documentation ini mencakup semua interface publik yang tersedia untuk integrasi dengan sistem Master Barang Komprehensif.*