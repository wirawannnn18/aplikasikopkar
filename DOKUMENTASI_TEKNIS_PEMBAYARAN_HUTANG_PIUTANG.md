# Dokumentasi Teknis - Pembayaran Hutang Piutang Anggota

## Daftar Isi
1. [Arsitektur Sistem](#arsitektur-sistem)
2. [API Reference](#api-reference)
3. [Database Schema](#database-schema)
4. [Security Implementation](#security-implementation)
5. [Testing Strategy](#testing-strategy)
6. [Deployment Guide](#deployment-guide)
7. [Maintenance](#maintenance)

---

## Arsitektur Sistem

### Overview
Modul Pembayaran Hutang Piutang menggunakan arsitektur client-side dengan localStorage sebagai storage layer.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Presentation  │    │   Business      │    │   Data          │
│   Layer         │    │   Logic Layer   │    │   Layer         │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ - UI Components │    │ - Validation    │    │ - localStorage  │
│ - Event Handlers│    │ - Calculation   │    │ - JSON Storage  │
│ - Modal Dialogs │    │ - Journal Entry │    │ - Data Models   │
│ - Form Controls │    │ - Audit Logging │    │ - Persistence   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Bootstrap 5.3.0
- **Icons**: Bootstrap Icons 1.11.0
- **Storage**: localStorage (Browser)
- **Testing**: Jest + fast-check
- **Module System**: ES6 Modules

### File Structure
```
js/
├── pembayaranHutangPiutang.js    # Main module
├── auth.js                       # Authentication
└── koperasi.js                   # Main app

__tests__/
└── pembayaranHutangPiutang.test.js  # Test suite

docs/
├── PANDUAN_PEMBAYARAN_HUTANG_PIUTANG.md
├── DOKUMENTASI_TEKNIS_PEMBAYARAN_HUTANG_PIUTANG.md
└── IMPLEMENTASI_TASK*.md

test/
└── test_pembayaran_hutang_piutang_integration.html
```

---

## API Reference

### Core Functions

#### `renderPembayaranHutangPiutang()`
**Purpose:** Main render function for the payment module

**Access Control:** Requires kasir, admin, or super_admin role

**Returns:** `void`

**Example:**
```javascript
renderPembayaranHutangPiutang();
```

---

#### `hitungSaldoHutang(anggotaId)`
**Purpose:** Calculate hutang balance for an anggota

**Parameters:**
- `anggotaId` (string): Anggota ID

**Returns:** `number` - Current hutang balance

**Algorithm:**
```javascript
// Saldo Hutang = Total Kredit POS - Total Pembayaran Hutang
const totalKredit = penjualan
  .filter(p => p.anggotaId === anggotaId && p.status === 'kredit')
  .reduce((sum, p) => sum + p.total, 0);

const totalPembayaran = pembayaran
  .filter(p => p.anggotaId === anggotaId && p.jenis === 'hutang' && p.status === 'selesai')
  .reduce((sum, p) => sum + p.jumlah, 0);

return totalKredit - totalPembayaran;
```

**Example:**
```javascript
const saldo = hitungSaldoHutang('A001');
console.log(`Saldo hutang: ${formatRupiah(saldo)}`);
```

---

#### `hitungSaldoPiutang(anggotaId)`
**Purpose:** Calculate piutang balance for an anggota

**Parameters:**
- `anggotaId` (string): Anggota ID

**Returns:** `number` - Current piutang balance

**Algorithm:**
```javascript
// Saldo Piutang = Total Pembayaran Piutang
const totalPiutang = pembayaran
  .filter(p => p.anggotaId === anggotaId && p.jenis === 'piutang' && p.status === 'selesai')
  .reduce((sum, p) => sum + p.jumlah, 0);

return totalPiutang;
```

---

#### `validatePembayaran(data)`
**Purpose:** Validate payment data before processing

**Parameters:**
- `data` (object): Payment data
  - `anggotaId` (string): Anggota ID
  - `jenis` (string): 'hutang' or 'piutang'
  - `jumlah` (number): Payment amount
  - `saldo` (number): Current balance

**Returns:** `object`
```javascript
{
  isValid: boolean,
  errors: string[]
}
```

**Validation Rules:**
1. `anggotaId` must not be empty
2. `jenis` must be 'hutang' or 'piutang'
3. `jumlah` must be > 0
4. For hutang: `jumlah` must not exceed `saldo`
5. For piutang: `saldo` must be > 0

**Example:**
```javascript
const validation = validatePembayaran({
  anggotaId: 'A001',
  jenis: 'hutang',
  jumlah: 200000,
  saldo: 500000
});

if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}
```

---

#### `savePembayaran(data)`
**Purpose:** Save payment transaction to localStorage

**Parameters:**
- `data` (object): Transaction data
  - `anggotaId` (string): Anggota ID
  - `anggotaNama` (string): Anggota name
  - `anggotaNIK` (string): Anggota NIK
  - `jenis` (string): Payment type
  - `jumlah` (number): Payment amount
  - `saldoSebelum` (number): Balance before
  - `saldoSesudah` (number): Balance after
  - `keterangan` (string): Notes

**Returns:** `object` - Saved transaction with generated ID

**Security:** All text inputs are sanitized using `sanitizeInput()`

**Example:**
```javascript
const transaksi = savePembayaran({
  anggotaId: 'A001',
  anggotaNama: 'Budi Santoso',
  anggotaNIK: '1234567890',
  jenis: 'hutang',
  jumlah: 200000,
  saldoSebelum: 500000,
  saldoSesudah: 300000,
  keterangan: 'Pembayaran cicilan'
});

console.log('Transaction ID:', transaksi.id);
```

---

#### `rollbackPembayaran(transaksiId)`
**Purpose:** Rollback a payment transaction

**Parameters:**
- `transaksiId` (string): Transaction ID to rollback

**Returns:** `boolean` - Success status

**Example:**
```javascript
const success = rollbackPembayaran('PHT-abc123');
if (success) {
  console.log('Transaction rolled back successfully');
}
```

---

#### `searchAnggota(query)`
**Purpose:** Search anggota by name or NIK

**Parameters:**
- `query` (string): Search query (minimum 2 characters)

**Returns:** `array` - Array of matching anggota (max 10 results)

**Search Logic:**
- Case insensitive
- Matches nama or NIK
- Partial matching
- Sorted by relevance

**Example:**
```javascript
const results = searchAnggota('Budi');
results.forEach(anggota => {
  console.log(`${anggota.nama} - ${anggota.nik}`);
});
```

---

### Security Functions

#### `checkPembayaranAccess()`
**Purpose:** Check if user has access to payment module

**Returns:** `boolean`

**Allowed Roles:** kasir, admin, super_admin

---

#### `canProcessPayment()`
**Purpose:** Check if user can process payments

**Returns:** `boolean`

**Allowed Roles:** kasir, admin, super_admin

---

#### `canViewAllHistory()`
**Purpose:** Check if user can view all payment history

**Returns:** `boolean`

**Allowed Roles:** admin, super_admin

---

#### `sanitizeInput(input)`
**Purpose:** Sanitize text input to prevent XSS

**Parameters:**
- `input` (string): Text to sanitize

**Returns:** `string` - Sanitized text

**Sanitization Rules:**
- HTML encode: `< > " ' /`
- Trim whitespace
- Convert to string

**Example:**
```javascript
const safe = sanitizeInput('<script>alert("XSS")</script>');
// Result: "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;"
```

---

### Utility Functions

#### `formatRupiah(amount)`
**Purpose:** Format number as Indonesian Rupiah

**Parameters:**
- `amount` (number): Amount to format

**Returns:** `string` - Formatted currency

**Example:**
```javascript
const formatted = formatRupiah(1500000);
// Result: "Rp 1.500.000"
```

---

#### `generateId()`
**Purpose:** Generate unique transaction ID

**Returns:** `string` - Unique ID with format 'PHT-{timestamp}{random}'

**Example:**
```javascript
const id = generateId();
// Result: "PHT-k2j3h4k5l6m7n8"
```

---

## Database Schema

### localStorage Keys

#### `pembayaranHutangPiutang`
**Type:** Array of transaction objects

**Schema:**
```javascript
{
  id: string,                    // Unique transaction ID
  tanggal: string,              // ISO 8601 timestamp
  anggotaId: string,            // Anggota ID
  anggotaNama: string,          // Anggota name (sanitized)
  anggotaNIK: string,           // Anggota NIK (sanitized)
  jenis: string,                // 'hutang' or 'piutang'
  jumlah: number,               // Payment amount
  saldoSebelum: number,         // Balance before payment
  saldoSesudah: number,         // Balance after payment
  keterangan: string,           // Notes (sanitized)
  kasirId: string,              // Cashier ID
  kasirNama: string,            // Cashier name (sanitized)
  status: string,               // 'selesai' or 'dibatalkan'
  createdAt: string             // Creation timestamp
}
```

**Example:**
```javascript
[
  {
    "id": "PHT-k2j3h4k5l6m7n8",
    "tanggal": "2024-12-02T07:30:00.000Z",
    "anggotaId": "A001",
    "anggotaNama": "Budi Santoso",
    "anggotaNIK": "1234567890",
    "jenis": "hutang",
    "jumlah": 200000,
    "saldoSebelum": 500000,
    "saldoSesudah": 300000,
    "keterangan": "Pembayaran cicilan",
    "kasirId": "U001",
    "kasirNama": "Test Kasir",
    "status": "selesai",
    "createdAt": "2024-12-02T07:30:15.123Z"
  }
]
```

---

#### `auditLogPembayaranHutangPiutang`
**Type:** Array of audit log objects

**Schema:**
```javascript
{
  id: string,                    // Unique log ID
  timestamp: string,             // ISO 8601 timestamp
  userId: string,                // User ID
  userName: string,              // User name
  action: string,                // Action type
  details: object,               // Action details
  ipAddress: string,             // User IP (if available)
  userAgent: string              // User agent (if available)
}
```

**Action Types:**
- `PAYMENT_SUCCESS`: Successful payment
- `PAYMENT_FAILED`: Failed payment
- `PAYMENT_ERROR`: System error
- `ROLLBACK_SUCCESS`: Successful rollback
- `ACCESS_DENIED`: Access denied

---

#### Related Data Dependencies

**`anggota`** - Master anggota data
```javascript
{
  id: string,
  nik: string,
  nama: string,
  departemen: string
}
```

**`penjualan`** - POS sales data (for hutang calculation)
```javascript
{
  id: string,
  anggotaId: string,
  status: string,              // 'kredit' or 'tunai'
  total: number,
  tanggal: string
}
```

**`coa`** - Chart of Accounts (for journal entries)
```javascript
{
  kode: string,                // Account code
  nama: string,                // Account name
  tipe: string                 // Account type
}
```

**Required COA Accounts:**
- `1-1000`: Kas (Aset)
- `1-1200`: Piutang Anggota (Aset)
- `2-1000`: Hutang Anggota (Kewajiban)

---

## Security Implementation

### Authentication & Authorization

#### Role-Based Access Control (RBAC)
```javascript
// Access Matrix
const permissions = {
  'kasir': {
    accessModule: true,
    processPayment: true,
    viewAllHistory: false
  },
  'admin': {
    accessModule: true,
    processPayment: true,
    viewAllHistory: true
  },
  'super_admin': {
    accessModule: true,
    processPayment: true,
    viewAllHistory: true
  }
};
```

#### Implementation
1. **Module Level**: Check `checkPembayaranAccess()` before rendering
2. **Function Level**: Check `canProcessPayment()` before processing
3. **Data Level**: Check `canViewAllHistory()` before showing history

---

### Input Sanitization

#### XSS Prevention
```javascript
function sanitizeInput(input) {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}
```

#### Validation
```javascript
function validateNumericInput(input) {
  const num = parseFloat(input);
  if (isNaN(num) || !isFinite(num) || num < 0) {
    return null;
  }
  return num;
}
```

---

### Data Integrity

#### Transaction Atomicity
```javascript
try {
  // 1. Save transaction
  const transaksi = savePembayaran(data);
  
  // 2. Create journal entry
  const jurnalSuccess = createJurnalEntry(transaksi);
  
  if (!jurnalSuccess) {
    // 3. Rollback on failure
    rollbackPembayaran(transaksi.id);
    throw new Error('Journal entry failed');
  }
  
  // 4. Log success
  saveAuditLog('PAYMENT_SUCCESS', transaksi);
  
} catch (error) {
  // 5. Log error
  saveAuditLog('PAYMENT_ERROR', { error: error.message });
  throw error;
}
```

#### Data Validation
1. **Type Checking**: Ensure correct data types
2. **Range Validation**: Check numeric ranges
3. **Business Rules**: Validate business logic
4. **Referential Integrity**: Check foreign key constraints

---

## Testing Strategy

### Test Pyramid

```
        /\           E2E Tests (5%)
       /  \          Integration Tests (15%)
      /____\         Unit Tests (80%)
```

### Unit Tests (80%)
**File:** `__tests__/pembayaranHutangPiutang.test.js`

**Coverage:**
- Saldo calculation functions
- Validation functions
- Payment processing functions
- Utility functions
- Security functions

**Example:**
```javascript
test('hitungSaldoHutang calculates correct balance', () => {
  // Setup
  const penjualan = [{ anggotaId: 'A001', status: 'kredit', total: 500000 }];
  const pembayaran = [{ anggotaId: 'A001', jenis: 'hutang', jumlah: 200000, status: 'selesai' }];
  
  localStorage.setItem('penjualan', JSON.stringify(penjualan));
  localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaran));
  
  // Execute
  const saldo = hitungSaldoHutang('A001');
  
  // Assert
  expect(saldo).toBe(300000);
});
```

### Property-Based Tests
**Library:** fast-check

**Properties Tested:**
- Saldo calculation accuracy
- Payment validation correctness
- Transaction atomicity
- Data consistency

**Example:**
```javascript
test('Property: Hutang saldo equals total kredit minus total payments', () => {
  fc.assert(
    fc.property(
      fc.string(),
      fc.nat(1000000),
      fc.nat(500000),
      (anggotaId, kreditAmount, paymentAmount) => {
        // Setup data
        const penjualan = [{ anggotaId, status: 'kredit', total: kreditAmount }];
        const pembayaran = [{ anggotaId, jenis: 'hutang', jumlah: paymentAmount, status: 'selesai' }];
        
        localStorage.setItem('penjualan', JSON.stringify(penjualan));
        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(pembayaran));
        
        // Test property
        const saldo = hitungSaldoHutang(anggotaId);
        return saldo === (kreditAmount - paymentAmount);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Tests (15%)
**File:** `test_pembayaran_hutang_piutang_integration.html`

**Test Scenarios:**
1. **End-to-End Payment Flow**
   - Complete hutang payment process
   - Complete piutang payment process
   - Journal entry verification
   - Saldo update verification

2. **Error Scenarios**
   - Validation errors
   - Journal recording errors
   - Rollback functionality

3. **Real Data Scenarios**
   - Search functionality
   - Multiple transactions
   - Filtering and audit logging

### E2E Tests (5%)
**Manual Testing Checklist:**

1. **User Authentication**
   - [ ] Login as different roles
   - [ ] Access control verification
   - [ ] Permission enforcement

2. **Payment Processing**
   - [ ] Hutang payment end-to-end
   - [ ] Piutang payment end-to-end
   - [ ] Confirmation dialogs
   - [ ] Success notifications

3. **Error Handling**
   - [ ] Validation error messages
   - [ ] System error recovery
   - [ ] Rollback verification

4. **Data Integrity**
   - [ ] Saldo accuracy
   - [ ] Journal entries
   - [ ] Audit trail

---

## Deployment Guide

### Prerequisites
- Modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Web server (Apache, Nginx, or development server)
- HTTPS recommended for production

### File Deployment

1. **Copy Files to Web Server**
   ```bash
   # Main application files
   cp js/pembayaranHutangPiutang.js /var/www/html/js/
   cp js/auth.js /var/www/html/js/
   cp js/koperasi.js /var/www/html/js/
   
   # Documentation
   cp PANDUAN_PEMBAYARAN_HUTANG_PIUTANG.md /var/www/html/docs/
   cp DOKUMENTASI_TEKNIS_PEMBAYARAN_HUTANG_PIUTANG.md /var/www/html/docs/
   
   # Test files (optional)
   cp test_pembayaran_hutang_piutang_integration.html /var/www/html/test/
   ```

2. **Set Permissions**
   ```bash
   chmod 644 /var/www/html/js/*.js
   chmod 644 /var/www/html/docs/*.md
   chmod 644 /var/www/html/test/*.html
   ```

### Configuration

1. **Update Main HTML**
   ```html
   <!-- Include Bootstrap CSS -->
   <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
   <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css">
   
   <!-- Include JavaScript modules -->
   <script src="js/auth.js"></script>
   <script src="js/pembayaranHutangPiutang.js"></script>
   <script src="js/koperasi.js"></script>
   
   <!-- Include Bootstrap JS -->
   <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
   ```

2. **Initialize Chart of Accounts**
   ```javascript
   // Run once during initial setup
   const coa = [
     { kode: '1-1000', nama: 'Kas', tipe: 'Aset' },
     { kode: '1-1200', nama: 'Piutang Anggota', tipe: 'Aset' },
     { kode: '2-1000', nama: 'Hutang Anggota', tipe: 'Kewajiban' }
   ];
   localStorage.setItem('coa', JSON.stringify(coa));
   ```

### Environment Setup

#### Development
```javascript
// Enable debug mode
window.DEBUG_MODE = true;

// Mock data for testing
if (window.DEBUG_MODE) {
  // Setup sample data
  setupSampleData();
}
```

#### Production
```javascript
// Disable debug mode
window.DEBUG_MODE = false;

// Enable error reporting
window.addEventListener('error', (event) => {
  // Send error to logging service
  console.error('Production error:', event.error);
});
```

### Performance Optimization

1. **Minification**
   ```bash
   # Minify JavaScript files
   uglifyjs js/pembayaranHutangPiutang.js -o js/pembayaranHutangPiutang.min.js
   ```

2. **Compression**
   ```apache
   # Apache .htaccess
   <IfModule mod_deflate.c>
     AddOutputFilterByType DEFLATE text/javascript
     AddOutputFilterByType DEFLATE application/javascript
   </IfModule>
   ```

3. **Caching**
   ```apache
   # Cache static assets
   <IfModule mod_expires.c>
     ExpiresActive On
     ExpiresByType text/javascript "access plus 1 month"
     ExpiresByType application/javascript "access plus 1 month"
   </IfModule>
   ```

---

## Maintenance

### Regular Tasks

#### Daily
- [ ] Monitor error logs
- [ ] Check system performance
- [ ] Verify backup integrity

#### Weekly
- [ ] Review audit logs
- [ ] Check localStorage usage
- [ ] Update documentation if needed

#### Monthly
- [ ] Performance analysis
- [ ] Security review
- [ ] User feedback analysis
- [ ] Update dependencies

### Monitoring

#### Performance Metrics
```javascript
// Monitor localStorage size
function checkStorageUsage() {
  const usage = JSON.stringify(localStorage).length;
  const limit = 5 * 1024 * 1024; // 5MB
  
  if (usage > limit * 0.8) {
    console.warn('localStorage usage high:', usage, 'bytes');
  }
}

// Monitor function performance
function measurePerformance(fn, name) {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  console.log(`${name} took ${end - start} milliseconds`);
  return result;
}
```

#### Error Tracking
```javascript
// Track JavaScript errors
window.addEventListener('error', (event) => {
  const errorData = {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  // Log to console or send to monitoring service
  console.error('JavaScript Error:', errorData);
});
```

### Backup & Recovery

#### Data Backup
```javascript
// Export all payment data
function exportPaymentData() {
  const data = {
    pembayaran: JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]'),
    auditLog: JSON.parse(localStorage.getItem('auditLogPembayaranHutangPiutang') || '[]'),
    timestamp: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `payment-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}

// Import payment data
function importPaymentData(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      
      if (data.pembayaran) {
        localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(data.pembayaran));
      }
      
      if (data.auditLog) {
        localStorage.setItem('auditLogPembayaranHutangPiutang', JSON.stringify(data.auditLog));
      }
      
      console.log('Data imported successfully');
    } catch (error) {
      console.error('Import failed:', error);
    }
  };
  reader.readAsText(file);
}
```

### Troubleshooting

#### Common Issues

1. **localStorage Full**
   ```javascript
   // Check and clean old data
   function cleanOldData() {
     const pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
     const cutoffDate = new Date();
     cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
     
     const filtered = pembayaran.filter(p => new Date(p.tanggal) > cutoffDate);
     localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(filtered));
   }
   ```

2. **Performance Issues**
   ```javascript
   // Optimize large datasets
   function optimizeData() {
     // Index frequently accessed data
     const pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
     
     // Create index by anggotaId
     const index = {};
     pembayaran.forEach(p => {
       if (!index[p.anggotaId]) {
         index[p.anggotaId] = [];
       }
       index[p.anggotaId].push(p);
     });
     
     localStorage.setItem('pembayaranIndex', JSON.stringify(index));
   }
   ```

3. **Data Corruption**
   ```javascript
   // Validate and repair data
   function validateData() {
     try {
       const pembayaran = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
       
       // Check data integrity
       const valid = pembayaran.every(p => {
         return p.id && p.anggotaId && p.jenis && typeof p.jumlah === 'number';
       });
       
       if (!valid) {
         console.error('Data corruption detected');
         // Restore from backup or reset
       }
       
       return valid;
     } catch (error) {
       console.error('Data validation failed:', error);
       return false;
     }
   }
   ```

### Updates & Patches

#### Version Control
```javascript
// Version tracking
const MODULE_VERSION = '1.0.0';
const DATA_VERSION = '1.0';

// Migration function
function migrateData(fromVersion, toVersion) {
  console.log(`Migrating data from ${fromVersion} to ${toVersion}`);
  
  // Implement migration logic
  switch (fromVersion) {
    case '0.9':
      // Migrate from version 0.9 to 1.0
      migrateFrom09To10();
      break;
    default:
      console.log('No migration needed');
  }
}
```

#### Deployment Checklist
- [ ] Backup current data
- [ ] Test in staging environment
- [ ] Update version numbers
- [ ] Deploy files
- [ ] Run migration scripts
- [ ] Verify functionality
- [ ] Update documentation
- [ ] Notify users

---

## Appendix

### Error Codes

| Code | Description | Action |
|------|-------------|--------|
| PHT001 | Invalid anggota ID | Check anggota exists |
| PHT002 | Insufficient balance | Check saldo |
| PHT003 | Journal entry failed | Check COA setup |
| PHT004 | Access denied | Check user role |
| PHT005 | Data validation failed | Check input data |

### Performance Benchmarks

| Operation | Target Time | Acceptable Time |
|-----------|-------------|----------------|
| Saldo calculation | < 1ms | < 5ms |
| Payment processing | < 10ms | < 50ms |
| Search anggota | < 5ms | < 20ms |
| Render history | < 50ms | < 200ms |

### Browser Compatibility

| Browser | Minimum Version | Tested Version |
|---------|----------------|----------------|
| Chrome | 90 | 120 |
| Firefox | 88 | 120 |
| Safari | 14 | 17 |
| Edge | 90 | 120 |

---

**Document Version:** 1.0  
**Last Updated:** 2 December 2024  
**Module:** Pembayaran Hutang Piutang Anggota  
**Author:** Development Team
