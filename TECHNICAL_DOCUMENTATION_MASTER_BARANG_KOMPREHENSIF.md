# Technical Documentation - Master Barang Komprehensif

## Architecture Overview

### System Components
```
┌─────────────────────────────────────────────────────────────┐
│                    Master Barang System                     │
├─────────────────────────────────────────────────────────────┤
│  UI Layer (HTML/CSS/JS)                                    │
│  ├── master_barang.html                                    │
│  ├── css/master-barang.css                                 │
│  └── JavaScript Controllers                                │
├─────────────────────────────────────────────────────────────┤
│  Business Logic Layer                                      │
│  ├── MasterBarangController                                │
│  ├── ValidationEngine                                      │
│  ├── SearchEngine                                          │
│  └── FilterManager                                         │
├─────────────────────────────────────────────────────────────┤
│  Data Management Layer                                     │
│  ├── BarangManager                                         │
│  ├── KategoriManager                                       │
│  ├── SatuanManager                                         │
│  └── AuditLogger                                           │
├─────────────────────────────────────────────────────────────┤
│  Import/Export Layer                                       │
│  ├── ImportManager                                         │
│  ├── ExportManager                                         │
│  ├── FileProcessor                                         │
│  └── TemplateManager                                       │
├─────────────────────────────────────────────────────────────┤
│  Storage Layer                                             │
│  └── localStorage (Browser Storage)                        │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Data Models

#### Barang Model
```javascript
const BarangModel = {
    id: String,           // Unique identifier
    kode: String,         // Unique code
    nama: String,         // Item name
    kategoriId: String,   // Category reference
    satuanId: String,     // Unit reference
    hargaBeli: Number,    // Purchase price
    hargaJual: Number,    // Selling price
    stok: Number,         // Current stock
    stokMinimum: Number,  // Minimum stock
    status: String,       // active/inactive
    createdAt: Date,      // Creation timestamp
    updatedAt: Date       // Last update timestamp
};
```

#### Kategori Model
```javascript
const KategoriModel = {
    id: String,           // Unique identifier
    nama: String,         // Category name
    deskripsi: String,    // Description
    status: String,       // active/inactive
    createdAt: Date,      // Creation timestamp
    updatedAt: Date       // Last update timestamp
};
```

#### Satuan Model
```javascript
const SatuanModel = {
    id: String,           // Unique identifier
    nama: String,         // Unit name
    singkatan: String,    // Abbreviation
    status: String,       // active/inactive
    createdAt: Date,      // Creation timestamp
    updatedAt: Date       // Last update timestamp
};
```

### 2. Core Managers

#### MasterBarangSystem
Main system controller that orchestrates all operations.

```javascript
class MasterBarangSystem {
    constructor() {
        this.barangManager = new BarangManager();
        this.kategoriManager = new KategoriManager();
        this.satuanManager = new SatuanManager();
        this.auditLogger = new AuditLogger();
        this.validationEngine = new ValidationEngine();
    }
    
    // Core methods
    async initialize()
    async getAllBarang()
    async saveBarang(data)
    async deleteBarang(id)
    async searchBarang(query)
    async filterBarang(filters)
}
```

#### ValidationEngine
Handles all data validation with comprehensive rules.

```javascript
class ValidationEngine {
    // Validation methods
    validateBarang(data)
    validateKategori(data)
    validateSatuan(data)
    validateImportData(data)
    
    // Business rule validation
    checkUniqueKode(kode, excludeId)
    checkStokMinimum(stok, minimum)
    checkHargaValid(hargaBeli, hargaJual)
}
```

### 3. Import/Export System

#### ImportManager
Handles file import operations with validation and preview.

```javascript
class ImportManager {
    async processFile(file)
    async validateData(data)
    async previewImport(data)
    async executeImport(data, options)
    
    // Supported formats
    supportedFormats = ['xlsx', 'xls', 'csv']
}
```

#### ExportManager
Handles data export in multiple formats.

```javascript
class ExportManager {
    async exportToExcel(data, options)
    async exportToCSV(data, options)
    async exportAuditLog(filters)
    
    // Export options
    defaultOptions = {
        includeHeaders: true,
        dateFormat: 'DD/MM/YYYY',
        filename: 'master_barang_export'
    }
}
```

## API Reference

### Core Operations

#### Get All Barang
```javascript
const barang = await masterBarangSystem.getAllBarang({
    page: 1,
    limit: 50,
    sortBy: 'nama',
    sortOrder: 'asc'
});
```

#### Search Barang
```javascript
const results = await masterBarangSystem.searchBarang({
    query: 'beras',
    fields: ['nama', 'kode'],
    limit: 20
});
```

#### Filter Barang
```javascript
const filtered = await masterBarangSystem.filterBarang({
    kategoriId: 'kat001',
    satuanId: 'sat001',
    stokMinimum: 10,
    status: 'active'
});
```

#### Save Barang
```javascript
const result = await masterBarangSystem.saveBarang({
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

### Import/Export Operations

#### Import Data
```javascript
const importResult = await importManager.executeImport(data, {
    updateExisting: true,
    createNewCategories: true,
    createNewUnits: true,
    validateOnly: false
});
```

#### Export Data
```javascript
const exportFile = await exportManager.exportToExcel(data, {
    filename: 'master_barang_backup',
    includeAuditInfo: true,
    format: 'xlsx'
});
```

## Storage Schema

### localStorage Structure
```javascript
// Main data storage
localStorage.setItem('master_barang_data', JSON.stringify({
    barang: [...],
    kategori: [...],
    satuan: [...],
    settings: {...}
}));

// Audit log storage
localStorage.setItem('master_barang_audit', JSON.stringify([
    {
        id: 'audit001',
        timestamp: '2024-01-01T10:00:00Z',
        userId: 'user001',
        action: 'CREATE',
        entityType: 'BARANG',
        entityId: 'brg001',
        oldData: null,
        newData: {...},
        metadata: {...}
    }
]));

// System settings
localStorage.setItem('master_barang_settings', JSON.stringify({
    autoGenerateKode: true,
    defaultStokMinimum: 0,
    auditRetentionDays: 365,
    exportFormat: 'xlsx'
}));
```

## Performance Considerations

### Data Loading
- Implement pagination for large datasets
- Use virtual scrolling for better performance
- Cache frequently accessed data

### Search Optimization
- Debounce search input (300ms)
- Index commonly searched fields
- Limit search results to reasonable number

### Memory Management
- Clean up event listeners on component destroy
- Implement data cleanup for old audit logs
- Use weak references where appropriate

## Security Considerations

### Data Validation
- Server-side validation for all inputs
- Sanitize user inputs to prevent XSS
- Validate file uploads thoroughly

### Access Control
- Implement role-based permissions
- Log all data modifications
- Secure sensitive operations

### Audit Trail
- Log all CRUD operations
- Include user context in logs
- Implement log integrity checks

## Testing Strategy

### Unit Tests
- Test all core business logic
- Mock external dependencies
- Achieve >90% code coverage

### Integration Tests
- Test component interactions
- Test import/export workflows
- Test error scenarios

### Property-Based Tests
- Test data consistency properties
- Test validation rules
- Test performance characteristics

## Deployment

### Prerequisites
- Modern web browser (Chrome 80+, Firefox 75+, Safari 13+)
- JavaScript enabled
- localStorage support (5MB minimum)

### Installation
1. Copy all files to web server
2. Configure web server for SPA routing
3. Set appropriate cache headers
4. Test all functionality

### Configuration
```javascript
// config.js
const CONFIG = {
    STORAGE_PREFIX: 'master_barang_',
    MAX_IMPORT_SIZE: 5 * 1024 * 1024, // 5MB
    AUDIT_RETENTION_DAYS: 365,
    PAGINATION_SIZE: 50,
    SEARCH_DEBOUNCE: 300
};
```

## Monitoring and Maintenance

### Performance Monitoring
- Monitor page load times
- Track user interactions
- Monitor error rates

### Data Maintenance
- Regular backup of localStorage data
- Clean up old audit logs
- Monitor storage usage

### Updates
- Version control for all changes
- Test updates in staging environment
- Maintain backward compatibility

## Troubleshooting

### Common Issues
1. **Import failures**: Check file format and data validation
2. **Performance issues**: Check data size and browser resources
3. **Storage errors**: Check localStorage quota and availability

### Debug Mode
Enable debug mode by setting:
```javascript
localStorage.setItem('master_barang_debug', 'true');
```

This will enable:
- Detailed console logging
- Performance timing
- Validation details
- Error stack traces

---

*This documentation is maintained by the development team and updated with each release.*