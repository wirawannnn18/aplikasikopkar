# Design Document

## Overview

Sistem Upload Master Barang Excel adalah fitur yang memungkinkan pengguna untuk mengupload data barang secara massal menggunakan file Excel (.xlsx) atau CSV (.csv). Sistem ini dirancang dengan arsitektur modular yang mencakup validasi data komprehensif, manajemen kategori dan satuan otomatis, serta audit logging yang lengkap.

Fitur ini mengintegrasikan drag & drop interface, real-time validation, progress tracking, dan error handling yang robust untuk memberikan pengalaman pengguna yang optimal dalam pengelolaan data master barang.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Upload UI     │────│  Validation      │────│   Data Storage  │
│   Component     │    │  Engine          │    │   Layer         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌──────────────────┐             │
         └──────────────│  Category &      │─────────────┘
                        │  Unit Manager    │
                        └──────────────────┘
                                 │
                        ┌──────────────────┐
                        │  Audit Logger    │
                        └──────────────────┘
```

### Component Architecture

1. **Upload UI Component**: Interface pengguna untuk drag & drop, preview, dan kontrol upload
2. **Validation Engine**: Sistem validasi multi-layer untuk format, business rules, dan integritas data
3. **Category & Unit Manager**: Pengelolaan kategori dan satuan dengan auto-creation capability
4. **Data Storage Layer**: Persistensi data dengan localStorage dan backup mechanism
5. **Audit Logger**: Pencatatan semua aktivitas untuk audit trail dan compliance

## Components and Interfaces

### 1. ExcelUploadManager

**Responsibility**: Koordinasi utama untuk proses upload dan manajemen state

```javascript
class ExcelUploadManager {
    constructor()
    uploadFile(file)
    validateData(data)
    previewData(data)
    importData(validatedData)
    getUploadHistory()
    rollbackImport(importId)
}
```

**Key Methods**:
- `uploadFile()`: Menangani file upload dan parsing awal
- `validateData()`: Koordinasi validasi dengan ValidationEngine
- `previewData()`: Generate preview table dengan validation indicators
- `importData()`: Eksekusi import dengan progress tracking
- `getUploadHistory()`: Retrieve riwayat upload untuk audit
- `rollbackImport()`: Rollback import berdasarkan audit log

### 2. ValidationEngine

**Responsibility**: Validasi komprehensif data upload

```javascript
class ValidationEngine {
    validateFileFormat(file)
    validateFileSize(file)
    validateHeaders(headers)
    validateDataTypes(row)
    validateBusinessRules(row)
    validateDuplicates(data)
    validateExistingData(data)
}
```

**Validation Layers**:
- **File Level**: Format, size, encoding validation
- **Structure Level**: Header validation, column mapping
- **Data Type Level**: Type conversion dan format validation
- **Business Rule Level**: Required fields, ranges, constraints
- **Integrity Level**: Duplicate detection, referential integrity

### 3. CategoryUnitManager

**Responsibility**: Manajemen kategori dan satuan dengan auto-creation

```javascript
class CategoryUnitManager {
    getCategories()
    getUnits()
    createCategory(name)
    createUnit(name)
    deleteCategory(name)
    deleteUnit(name)
    validateCategoryUsage(name)
    validateUnitUsage(name)
    autoCreateFromData(data)
}
```

**Features**:
- Auto-detection kategori dan satuan baru dari data upload
- Validation sebelum penghapusan (check usage)
- Persistence dengan localStorage backup
- Normalisasi nama (lowercase, trim)

### 4. DataProcessor

**Responsibility**: Processing dan transformasi data untuk import

```javascript
class DataProcessor {
    parseCSV(csvContent)
    parseExcel(excelFile)
    transformData(rawData)
    chunkData(data, chunkSize)
    processChunk(chunk)
    mergeResults(results)
}
```

**Processing Features**:
- Multi-format parsing (CSV, Excel)
- Data transformation dan normalisasi
- Chunked processing untuk performa optimal
- Progress tracking dan status updates

### 5. AuditLogger

**Responsibility**: Comprehensive audit logging untuk compliance

```javascript
class AuditLogger {
    logUploadStart(user, fileName, recordCount)
    logValidationResults(errors, warnings)
    logDataChanges(oldData, newData)
    logImportComplete(results)
    logError(error, context)
    getAuditTrail(filters)
    exportAuditLog(format)
}
```

**Audit Features**:
- Timestamp dan user tracking
- Before/after data logging untuk changes
- Error dan exception logging
- Searchable audit trail
- Export capability untuk compliance

## Data Models

### UploadSession

```javascript
{
    id: "string",
    timestamp: "ISO8601",
    user: "string",
    fileName: "string",
    fileSize: "number",
    recordCount: "number",
    status: "pending|processing|completed|failed",
    validationResults: {
        errors: ["ValidationError"],
        warnings: ["ValidationWarning"]
    },
    importResults: {
        created: "number",
        updated: "number",
        failed: "number",
        totalProcessed: "number"
    },
    auditLog: ["AuditEntry"]
}
```

### ValidationError

```javascript
{
    type: "format|business|integrity",
    field: "string",
    row: "number",
    message: "string",
    severity: "error|warning",
    code: "string"
}
```

### BarangData

```javascript
{
    kode: "string",           // Required, unique, max 20 chars
    nama: "string",           // Required, max 100 chars
    kategori: "string",       // Required, lowercase
    satuan: "string",         // Required, lowercase
    harga_beli: "number",     // Required, positive
    stok: "number",           // Required, non-negative
    supplier: "string",       // Optional, max 100 chars
    created_at: "ISO8601",
    updated_at: "ISO8601"
}
```

### AuditEntry

```javascript
{
    id: "string",
    timestamp: "ISO8601",
    user: "string",
    action: "upload|validate|import|rollback",
    details: "object",
    oldData: "object",
    newData: "object",
    sessionId: "string"
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: File Format Validation Consistency
*For any* uploaded file, the validation engine should correctly identify valid CSV/Excel formats and reject invalid formats with appropriate error messages
**Validates: Requirements 1.2**

### Property 2: Data Preview Completeness
*For any* valid uploaded file, the data preview should display all records from the file in an interactive table format
**Validates: Requirements 1.3**

### Property 3: Auto-Creation Category Consistency
*For any* upload data containing new categories, the category management system should automatically create those categories and make them available for future use
**Validates: Requirements 1.4**

### Property 4: Progress Tracking Accuracy
*For any* import process, the progress tracking should accurately reflect the current processing status and completion percentage
**Validates: Requirements 1.5**

### Property 5: Required Field Validation Completeness
*For any* uploaded data, the validation engine should identify and report all missing required fields (kode, nama, kategori, satuan, harga_beli, stok)
**Validates: Requirements 2.1**

### Property 6: Duplicate Detection Accuracy
*For any* file containing duplicate kode barang, the validation engine should detect all duplicates and prevent import with specific error messages
**Validates: Requirements 2.2**

### Property 7: Error Reporting Precision
*For any* invalid data format, the error handler should provide specific error messages including the exact row number and field causing the error
**Validates: Requirements 2.3**

### Property 8: Negative Value Validation
*For any* data containing negative harga_beli or stok values, the validation engine should reject the data with appropriate error messages
**Validates: Requirements 2.4**

### Property 9: Existing Data Update Warning
*For any* upload containing existing kode barang, the validation engine should display warnings and offer update options while preserving data integrity
**Validates: Requirements 2.5**

### Property 10: New Unit Auto-Creation
*For any* upload data containing new satuan, the unit management system should create new units automatically after user confirmation
**Validates: Requirements 3.2**

### Property 11: Referential Integrity Validation
*For any* attempt to delete categories or units, the system should validate that no existing barang records reference them before allowing deletion
**Validates: Requirements 3.5**

### Property 12: Error Message Helpfulness
*For any* upload error, the error handler should provide specific troubleshooting guidance relevant to the type of error encountered
**Validates: Requirements 4.4**

### Property 13: Import Summary Completeness
*For any* successful upload, the system should display a complete summary including counts of created, updated, and failed records
**Validates: Requirements 4.5**

### Property 14: Progress Display Consistency
*For any* running import process, the system should display real-time progress indicators and status updates without blocking the UI
**Validates: Requirements 5.2**

### Property 15: Error Recovery Capability
*For any* error during import, the system should provide recovery mechanisms and rollback capabilities to restore previous state
**Validates: Requirements 5.3**

### Property 16: Import Results Detail
*For any* completed import, the system should provide detailed results including exact counts of successful, failed, and updated records
**Validates: Requirements 5.4**

### Property 17: Upload Activity Logging
*For any* upload operation, the system should log complete activity details including timestamp, user, and operation specifics
**Validates: Requirements 6.1**

### Property 18: Data Change Audit Trail
*For any* data modification during import, the system should log both old and new values for complete audit trail
**Validates: Requirements 6.2**

### Property 19: Failure Logging Completeness
*For any* import failure, the system should log detailed error information and failure causes for troubleshooting
**Validates: Requirements 6.3**

### Property 20: Rollback Information Sufficiency
*For any* import operation, the system should maintain sufficient information to enable complete rollback to previous state
**Validates: Requirements 6.5**

## Error Handling

### Error Categories

1. **File Errors**
   - Invalid format (non-CSV/Excel)
   - File too large (>5MB)
   - Corrupted file
   - Encoding issues

2. **Data Errors**
   - Missing required fields
   - Invalid data types
   - Business rule violations
   - Duplicate records

3. **System Errors**
   - Storage failures
   - Memory limitations
   - Network issues
   - Permission errors

### Error Recovery Strategies

1. **Graceful Degradation**: Continue processing valid records when possible
2. **Rollback Mechanism**: Complete rollback for critical failures
3. **Retry Logic**: Automatic retry for transient failures
4. **User Guidance**: Clear instructions for error resolution

### Error Reporting

- **Structured Messages**: Consistent error format with codes
- **Context Information**: Row numbers, field names, values
- **Actionable Guidance**: Specific steps to resolve issues
- **Severity Levels**: Error (blocking) vs Warning (informational)

## Testing Strategy

### Unit Testing Approach

Unit tests will focus on individual component functionality:

- **File Processing**: CSV/Excel parsing accuracy
- **Validation Logic**: Business rule enforcement
- **Data Transformation**: Format conversion correctness
- **Error Handling**: Exception scenarios and recovery
- **Category Management**: CRUD operations and validation

### Property-Based Testing Approach

Property-based tests will verify universal behaviors using fast-check library with minimum 100 iterations per test:

- **File Format Validation**: Test with various file types and formats
- **Data Validation**: Test with random valid/invalid data combinations
- **Duplicate Detection**: Test with various duplicate patterns
- **Category Auto-Creation**: Test with random new categories/units
- **Import Process**: Test with various data sizes and compositions
- **Audit Logging**: Test logging completeness across all operations
- **Error Recovery**: Test rollback functionality with various failure scenarios

Each property-based test will be tagged with format: **Feature: upload-master-barang-excel, Property {number}: {property_text}**

### Integration Testing

- **End-to-End Workflows**: Complete upload process testing
- **Cross-Component Integration**: Component interaction validation
- **Performance Testing**: Large file handling (1000+ records)
- **Browser Compatibility**: Multi-browser testing
- **Error Scenario Testing**: Comprehensive failure mode testing

### Test Data Strategy

- **Template Validation**: Test with provided CSV template
- **Edge Cases**: Empty files, single records, maximum size files
- **Invalid Data**: Various invalid formats and business rule violations
- **Performance Data**: Large datasets for performance validation
- **Real-World Data**: Realistic data patterns and edge cases