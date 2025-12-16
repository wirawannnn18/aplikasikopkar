# Design Document

## Overview

Sistem Master Barang Komprehensif adalah solusi pengelolaan data barang yang terintegrasi dan user-friendly untuk aplikasi koperasi. Sistem ini dirancang dengan arsitektur modular yang mencakup interface management, import/export engine, search & filter system, dan comprehensive validation engine.

Fitur utama meliputi CRUD operations dengan real-time validation, bulk import/export dari Excel/CSV, template management, advanced search & filtering, category/unit management, bulk operations, dan comprehensive audit logging. Sistem ini menggunakan localStorage sebagai storage backend dan dirancang untuk memberikan pengalaman pengguna yang optimal dengan performa yang baik.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Layer      │    │  Business Logic │    │   Data Layer    │
│                 │    │                 │    │                 │
│ - Master Barang │◄──►│ - CRUD Manager  │◄──►│ - localStorage  │
│   Interface     │    │ - Import/Export │    │ - Master Barang │
│ - Import/Export │    │   Engine        │    │ - Categories    │
│   Dialogs       │    │ - Search Engine │    │ - Units         │
│ - Search/Filter │    │ - Validation    │    │ - Audit Logs    │
│ - Category Mgmt │    │   Engine        │    │                 │
│ - Bulk Ops      │    │ - Audit Logger  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Components and Interfaces

### 1. Master Barang Interface
- **MasterBarangController**: Main controller untuk halaman master barang
- **DataTableManager**: Mengelola tampilan tabel dengan pagination dan sorting
- **FormManager**: Mengelola form input/edit barang dengan validasi
- **BulkOperationsManager**: Mengelola operasi massal (bulk delete, update)

### 2. Import/Export Engine
- **ImportManager**: Mengelola proses import dari Excel/CSV
- **ExportManager**: Mengelola proses export ke Excel/CSV
- **TemplateManager**: Mengelola template download dan generation
- **FileProcessor**: Memproses file upload dan parsing data

### 3. Search & Filter System
- **SearchEngine**: Mengelola pencarian real-time
- **FilterManager**: Mengelola multiple filters (kategori, satuan, status)
- **QueryBuilder**: Membangun query berdasarkan search dan filter criteria

### 4. Category & Unit Management
- **CategoryManager**: CRUD operations untuk kategori barang
- **UnitManager**: CRUD operations untuk satuan barang
- **DependencyValidator**: Validasi dependency sebelum delete

### 5. Validation Engine
- **DataValidator**: Validasi data barang (format, uniqueness, business rules)
- **FileValidator**: Validasi file upload (format, size, structure)
- **BusinessRuleValidator**: Validasi business rules dan constraints

### 6. Audit Logger
- **AuditLogger**: Mencatat semua aktivitas user
- **AuditViewer**: Interface untuk melihat audit logs
- **AuditExporter**: Export audit logs untuk compliance

## Data Models

### Barang Model
```javascript
{
  id: string,
  kode: string,           // Unique identifier
  nama: string,           // Nama barang
  kategori_id: string,    // Reference to kategori
  kategori_nama: string,  // Denormalized for performance
  satuan_id: string,      // Reference to satuan
  satuan_nama: string,    // Denormalized for performance
  harga_beli: number,     // Harga beli
  harga_jual: number,     // Harga jual
  stok: number,           // Stok current
  stok_minimum: number,   // Minimum stock threshold
  deskripsi: string,      // Optional description
  status: 'aktif' | 'nonaktif',
  created_at: timestamp,
  updated_at: timestamp,
  created_by: string,
  updated_by: string
}
```

### Kategori Model
```javascript
{
  id: string,
  nama: string,           // Unique name
  deskripsi: string,      // Optional description
  status: 'aktif' | 'nonaktif',
  created_at: timestamp,
  updated_at: timestamp,
  created_by: string,
  updated_by: string
}
```

### Satuan Model
```javascript
{
  id: string,
  nama: string,           // Unique name (PCS, DUS, KG, etc.)
  deskripsi: string,      // Optional description
  status: 'aktif' | 'nonaktif',
  created_at: timestamp,
  updated_at: timestamp,
  created_by: string,
  updated_by: string
}
```

### Audit Log Model
```javascript
{
  id: string,
  table_name: string,     // 'barang', 'kategori', 'satuan'
  record_id: string,      // ID of affected record
  action: 'create' | 'update' | 'delete' | 'import' | 'export' | 'bulk_operation',
  old_data: object,       // Data before change (for update/delete)
  new_data: object,       // Data after change (for create/update)
  user_id: string,
  user_name: string,
  timestamp: timestamp,
  ip_address: string,
  user_agent: string,
  additional_info: object // Extra context (file name for import, etc.)
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Property 1: Data table display consistency
*For any* set of barang data, the master barang interface should display the data in a properly formatted table with working pagination
**Validates: Requirements 1.1**

Property 2: Form validation consistency
*For any* barang form input, the validation engine should validate kode uniqueness, required fields, and data formats consistently
**Validates: Requirements 1.3**

Property 3: Save operation reliability
*For any* valid barang data, the save operation should successfully store the data and display confirmation
**Validates: Requirements 1.4**

Property 4: Audit logging completeness
*For any* edit or delete operation, the audit logger should record the activity with timestamp and user information
**Validates: Requirements 1.5**

Property 5: File validation consistency
*For any* uploaded Excel/CSV file, the validation engine should validate file format and data structure consistently
**Validates: Requirements 2.2**

Property 6: Import preview accuracy
*For any* valid uploaded file, the import engine should display accurate preview data with column mapping options
**Validates: Requirements 2.3**

Property 7: New category/unit handling
*For any* import data containing new categories or units, the system should display confirmation dialogs for creating new data
**Validates: Requirements 2.4**

Property 8: Import processing reliability
*For any* confirmed import operation, the system should process data with progress tracking and proper error handling
**Validates: Requirements 2.5**

Property 9: Template generation consistency
*For any* template download request, the system should generate files with valid headers and example data
**Validates: Requirements 3.2**

Property 10: Export data accuracy
*For any* export operation with filters, the system should generate files containing only data that matches the selected filters
**Validates: Requirements 3.4**

Property 11: Export file naming
*For any* completed export operation, the system should provide download links with descriptive file names
**Validates: Requirements 3.5**

Property 12: Search functionality accuracy
*For any* search term entered, the search system should return results that match the term in kode, nama, or kategori fields
**Validates: Requirements 4.2**

Property 13: Category filter accuracy
*For any* selected category filter, the system should display only barang items that belong to that category
**Validates: Requirements 4.3**

Property 14: Unit filter accuracy
*For any* selected unit filter, the system should display only barang items that use that unit
**Validates: Requirements 4.4**

Property 15: Multiple filter combination
*For any* combination of filters applied, the system should display results that satisfy all filter criteria simultaneously
**Validates: Requirements 4.5**

Property 16: Category uniqueness validation
*For any* new category creation, the system should validate name uniqueness and prevent duplicate categories
**Validates: Requirements 5.2**

Property 17: Category dependency validation
*For any* category deletion attempt, the system should validate that no barang items are using that category
**Validates: Requirements 5.3**

Property 18: Unit management validation
*For any* unit management operation, the system should validate name uniqueness and check dependencies with existing barang
**Validates: Requirements 5.5**

Property 19: Bulk operation availability
*For any* multiple barang selection, the system should provide appropriate bulk operation options (delete, update category, update unit)
**Validates: Requirements 6.1**

Property 20: Bulk delete confirmation
*For any* bulk delete operation, the system should display confirmation with details of items to be deleted
**Validates: Requirements 6.2**

Property 21: Bulk update validation
*For any* bulk update operation, the system should validate data and show preview of changes before execution
**Validates: Requirements 6.3**

Property 22: Bulk operation progress tracking
*For any* bulk operation execution, the system should display progress and results of the operation
**Validates: Requirements 6.4**

Property 23: Bulk operation audit logging
*For any* completed bulk operation, the audit logger should record all changes with complete details
**Validates: Requirements 6.5**

Property 24: Code validation consistency
*For any* barang code input, the validation engine should check format and uniqueness consistently
**Validates: Requirements 7.1**

Property 25: Price validation rules
*For any* price input, the validation engine should validate numeric format and prevent negative values
**Validates: Requirements 7.2**

Property 26: Stock validation and warnings
*For any* stock input, the validation engine should validate numeric format and provide low stock warnings
**Validates: Requirements 7.3**

Property 27: Category/unit status validation
*For any* category or unit selection, the validation engine should verify the selected item is active and valid
**Validates: Requirements 7.4**

Property 28: Error message clarity
*For any* validation error, the system should display clear and actionable error messages
**Validates: Requirements 7.5**

Property 29: Data change audit logging
*For any* barang data modification, the audit logger should record timestamp, user, and change details
**Validates: Requirements 8.1**

Property 30: Import/export audit logging
*For any* import or export operation, the audit logger should record activity with data count and status
**Validates: Requirements 8.2**

Property 31: Bulk operation audit logging
*For any* bulk operation, the audit logger should record operation details and affected records
**Validates: Requirements 8.3**

Property 32: Audit log export functionality
*For any* audit log data, the system should provide export capability in readable format
**Validates: Requirements 8.5**

## Error Handling

### Validation Errors
- **Field Validation**: Real-time validation dengan pesan error yang jelas
- **Business Rule Validation**: Validasi business rules dengan context yang relevan
- **File Upload Errors**: Handling untuk file format, size, dan structure errors
- **Import Errors**: Detailed error reporting dengan line numbers dan suggestions

### System Errors
- **Storage Errors**: Graceful handling untuk localStorage issues
- **Network Errors**: Retry mechanism untuk network-dependent operations
- **Performance Issues**: Timeout handling dan progress indicators
- **Concurrent Access**: Conflict resolution untuk simultaneous operations

### User Experience
- **Progressive Enhancement**: Fallback untuk browser compatibility issues
- **Accessibility**: Error messages yang accessible untuk screen readers
- **Mobile Responsiveness**: Error handling yang optimal untuk mobile devices
- **Internationalization**: Error messages dalam bahasa yang sesuai

## Testing Strategy

### Unit Testing
- **Component Testing**: Test individual components dengan mock dependencies
- **Validation Testing**: Test validation rules dengan various input scenarios
- **Utility Function Testing**: Test helper functions dan utility methods
- **Error Handling Testing**: Test error scenarios dan recovery mechanisms

### Property-Based Testing
- **Data Integrity Properties**: Test data consistency across operations
- **UI Behavior Properties**: Test UI behavior dengan random data sets
- **Import/Export Properties**: Test round-trip data integrity
- **Search/Filter Properties**: Test search accuracy dengan various queries
- **Audit Logging Properties**: Test audit completeness dan accuracy

### Integration Testing
- **End-to-End Workflows**: Test complete user workflows
- **Cross-Component Integration**: Test component interactions
- **Data Flow Testing**: Test data flow through system layers
- **Performance Testing**: Test system performance dengan large datasets

### User Acceptance Testing
- **Usability Testing**: Test user experience dan interface usability
- **Business Scenario Testing**: Test real-world business scenarios
- **Accessibility Testing**: Test accessibility compliance
- **Cross-Browser Testing**: Test compatibility across different browsers