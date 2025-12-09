# Design Document

## Overview

Menu Laporan Transaksi dan Simpanan Anggota adalah fitur baru yang menyediakan tampilan komprehensif tentang aktivitas keuangan setiap anggota koperasi. Fitur ini mengintegrasikan data dari modul POS (transaksi cash dan bon) dan modul Simpanan (pokok, wajib, sukarela) untuk memberikan visibilitas penuh kepada admin dan kasir.

Fitur ini akan diimplementasikan sebagai menu baru dalam sidebar aplikasi dan akan menggunakan data yang sudah ada di localStorage tanpa mengubah struktur data existing.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Main Report  │  │ Detail Modal │  │ Export/Print │      │
│  │   View       │  │   Dialogs    │  │   Functions  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Data        │  │  Filter &    │  │  Statistics  │      │
│  │  Aggregator  │  │  Search      │  │  Calculator  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                     Data Access Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Anggota     │  │  Penjualan   │  │  Simpanan    │      │
│  │  Repository  │  │  Repository  │  │  Repository  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    LocalStorage Layer                        │
│     anggota | penjualan | simpananPokok | simpananWajib    │
│                    | simpananSukarela                        │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **User Request** → UI Layer renders main report view
2. **Data Loading** → Data Access Layer fetches from localStorage
3. **Data Processing** → Business Logic aggregates and calculates
4. **Display** → UI Layer renders processed data
5. **User Interaction** → Filters, search, sort, detail view
6. **Export/Print** → Generate CSV or print-friendly format

## Components and Interfaces

### 1. Main Report Module (`laporanTransaksiSimpananAnggota.js`)

**Purpose**: Core module untuk mengelola laporan transaksi dan simpanan anggota

**Key Functions**:

```javascript
// Render main report view
function renderLaporanTransaksiSimpananAnggota()

// Get aggregated data for all members
function getAnggotaReportData()

// Filter and search functions
function filterLaporanAnggota()
function resetFilterLaporan()

// Sort functions
function sortLaporanBy(column)

// Detail view functions
function showDetailTransaksi(anggotaId)
function showDetailSimpanan(anggotaId)

// Export functions
function exportLaporanToCSV()
function printLaporan()

// Statistics calculation
function calculateStatistics(data)
```

### 2. Data Aggregator

**Purpose**: Mengagregasi data dari berbagai sumber

**Interface**:

```javascript
class AnggotaDataAggregator {
  constructor(anggotaId) {
    this.anggotaId = anggotaId;
    this.anggota = null;
    this.transaksi = [];
    this.simpanan = {
      pokok: [],
      wajib: [],
      sukarela: []
    };
  }
  
  // Load all data for member
  loadData()
  
  // Calculate transaction totals
  getTotalTransaksiCash()
  getTotalTransaksiBon()
  getOutstandingBalance()
  
  // Calculate savings totals
  getTotalSimpananPokok()
  getTotalSimpananWajib()
  getTotalSimpananSukarela()
  getTotalSimpanan()
  
  // Get detailed lists
  getTransaksiList()
  getSimpananList(type)
}
```

### 3. Filter Manager

**Purpose**: Mengelola filter dan pencarian

**Interface**:

```javascript
class LaporanFilterManager {
  constructor() {
    this.filters = {
      search: '',
      departemen: '',
      tipeAnggota: ''
    };
  }
  
  // Apply filters to data
  applyFilters(data)
  
  // Reset all filters
  reset()
  
  // Get filtered count
  getFilteredCount()
}
```

### 4. Export Manager

**Purpose**: Mengelola ekspor data ke CSV

**Interface**:

```javascript
class LaporanExportManager {
  // Export to CSV
  exportToCSV(data, filename)
  
  // Generate CSV content
  generateCSVContent(data)
  
  // Download file
  downloadFile(content, filename)
}
```

## Data Models

### Aggregated Report Data Model

```javascript
{
  anggotaId: string,
  nik: string,
  nama: string,
  noKartu: string,
  departemen: string,
  tipeAnggota: string,
  status: string,
  
  // Transaction summary
  transaksi: {
    totalCash: number,
    totalBon: number,
    countCash: number,
    countBon: number,
    outstandingBalance: number
  },
  
  // Savings summary
  simpanan: {
    pokok: number,
    wajib: number,
    sukarela: number,
    total: number
  },
  
  // Grand total
  grandTotal: number
}
```

### Transaction Detail Model

```javascript
{
  id: string,
  noTransaksi: string,
  tanggal: string,
  kasir: string,
  metode: 'cash' | 'bon',
  total: number,
  status: 'lunas' | 'kredit',
  items: Array<{
    nama: string,
    qty: number,
    harga: number
  }>
}
```

### Savings Detail Model

```javascript
{
  type: 'pokok' | 'wajib' | 'sukarela',
  id: string,
  jumlah: number,
  tanggal: string,
  periode: string, // for wajib only
  statusPengembalian: string
}
```

## 
Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


Property 1: Anggota keluar exclusion
*For any* list of anggota, when filtering for active members, all anggota with statusKeanggotaan === 'Keluar' should be excluded from the result
**Validates: Requirements 1.3**

Property 2: Required fields presence
*For any* anggota displayed in the report, the rendered data should contain NIK, nama, departemen, total transaksi, total simpanan, and outstanding balance
**Validates: Requirements 1.2**

Property 3: Total calculation consistency
*For any* set of anggota data, the grand total displayed should equal the sum of individual anggota totals for transaksi, simpanan, and outstanding balance
**Validates: Requirements 1.5**

Property 4: Search filter correctness
*For any* search query, all filtered results should contain the query string in either NIK, nama, or noKartu fields
**Validates: Requirements 2.1**

Property 5: Departemen filter correctness
*For any* selected departemen filter, all filtered results should have departemen matching the selected value
**Validates: Requirements 2.2**

Property 6: Tipe anggota filter correctness
*For any* selected tipe anggota filter, all filtered results should have tipeAnggota matching the selected value
**Validates: Requirements 2.3**

Property 7: Filter reset idempotence
*For any* filter state, applying reset then applying the same filters again should produce the same result as the original filtered state
**Validates: Requirements 2.4**

Property 8: Filtered count accuracy
*For any* applied filter, the displayed count should equal the length of the filtered result array
**Validates: Requirements 2.5**

Property 9: Transaction detail completeness
*For any* transaction displayed in detail modal, it should contain noTransaksi, tanggal, kasir, metode, total, and status fields
**Validates: Requirements 3.2**

Property 10: Transaction method separation
*For any* anggota's transaction list, transactions with metode 'cash' should be separate from transactions with metode 'bon'
**Validates: Requirements 3.3**

Property 11: Transaction total calculation
*For any* anggota, the sum of cash transactions should equal totalCash and the sum of bon transactions should equal totalBon
**Validates: Requirements 3.4**

Property 12: Simpanan detail completeness
*For any* simpanan displayed, it should contain the required fields: jumlah and tanggal for all types, plus periode for simpanan wajib
**Validates: Requirements 4.2, 4.3, 4.4, 4.5**

Property 13: CSV column completeness
*For any* exported CSV row, it should contain all required columns: NIK, Nama, Departemen, Tipe Anggota, Total Transaksi Cash, Total Transaksi Bon, Total Simpanan Pokok, Total Simpanan Wajib, Total Simpanan Sukarela, and Outstanding Balance
**Validates: Requirements 5.2**

Property 14: CSV format compatibility
*For any* generated CSV content, it should use comma as delimiter and proper escaping for fields containing commas or quotes
**Validates: Requirements 5.3**

Property 15: Export filename convention
*For any* exported file, the filename should follow the pattern 'laporan_transaksi_simpanan_YYYY-MM-DD.csv' where the date is the export date
**Validates: Requirements 5.4**

Property 16: Print content completeness
*For any* print operation, the print view should contain header with koperasi name and date, all displayed anggota data, and footer with totals
**Validates: Requirements 6.3, 6.4, 6.5**

Property 17: Statistics aggregation accuracy
*For any* set of displayed anggota, the statistics cards should show totals that equal the sum of respective values from all anggota
**Validates: Requirements 7.2, 7.3, 7.4**

Property 18: Statistics reactivity
*For any* filter application, the statistics should update to reflect only the filtered data
**Validates: Requirements 7.5**

Property 19: Ascending sort correctness
*For any* sortable column, clicking it once should sort the data in ascending order based on that column's values
**Validates: Requirements 8.1**

Property 20: Sort toggle behavior
*For any* sorted column, clicking it again should reverse the sort order to descending
**Validates: Requirements 8.2**

Property 21: Sort indicator visibility
*For any* sorted column, a visual indicator should be displayed on the column header showing the sort direction
**Validates: Requirements 8.3**

Property 22: Numeric sort correctness
*For any* numeric column sort, values should be ordered numerically (e.g., 2 < 10 < 100) not lexicographically
**Validates: Requirements 8.4**

Property 23: Alphabetic sort correctness
*For any* text column sort, values should be ordered alphabetically following locale-specific rules
**Validates: Requirements 8.5**

Property 24: Role-based data filtering
*For any* user with role 'anggota', the displayed data should only include transactions and simpanan where anggotaId matches the user's ID
**Validates: Requirements 9.3**

## Error Handling

### Error Scenarios

1. **Data Loading Errors**
   - localStorage unavailable or corrupted
   - Missing required data structures
   - Invalid data formats

2. **Calculation Errors**
   - Division by zero in percentage calculations
   - Null or undefined values in aggregations
   - Invalid numeric values

3. **Export Errors**
   - No data to export
   - File generation failures
   - Browser download restrictions

4. **Authorization Errors**
   - User not logged in
   - Insufficient permissions
   - Invalid user role

### Error Handling Strategy

```javascript
// Graceful degradation for missing data
function safeGetData(key, defaultValue = []) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key}:`, error);
    return defaultValue;
  }
}

// Safe numeric operations
function safeSum(array, key) {
  return array.reduce((sum, item) => {
    const value = parseFloat(item[key]) || 0;
    return sum + value;
  }, 0);
}

// Authorization check with redirect
function checkAccess() {
  if (!currentUser) {
    showAlert('Silakan login terlebih dahulu', 'warning');
    navigateTo('login');
    return false;
  }
  
  const allowedRoles = ['admin', 'kasir', 'anggota'];
  if (!allowedRoles.includes(currentUser.role)) {
    showAlert('Anda tidak memiliki akses ke halaman ini', 'error');
    navigateTo('dashboard');
    return false;
  }
  
  return true;
}
```

## Testing Strategy

### Unit Testing

Unit tests will focus on individual functions and components:

1. **Data Aggregation Tests**
   - Test `AnggotaDataAggregator` class methods
   - Verify correct calculation of totals
   - Test with various data scenarios (empty, single, multiple)

2. **Filter Tests**
   - Test `LaporanFilterManager` class
   - Verify filter logic for each filter type
   - Test filter combinations
   - Test reset functionality

3. **Export Tests**
   - Test CSV generation
   - Verify CSV format and structure
   - Test filename generation

4. **Sort Tests**
   - Test sorting for numeric columns
   - Test sorting for text columns
   - Test sort direction toggle

### Property-Based Testing

Property-based tests will verify universal properties using fast-check library:

1. **Property Tests for Data Integrity**
   - Generate random anggota data
   - Verify totals always equal sum of parts
   - Verify filters always produce valid subsets

2. **Property Tests for Calculations**
   - Generate random transaction and simpanan data
   - Verify aggregation properties hold
   - Verify no data loss in transformations

3. **Property Tests for Export**
   - Generate random report data
   - Verify CSV round-trip (parse exported CSV should match original data structure)
   - Verify all rows have same number of columns

### Integration Testing

Integration tests will verify end-to-end workflows:

1. **Full Report Flow**
   - Load page → verify data displayed
   - Apply filters → verify filtered results
   - Export → verify file downloaded
   - Print → verify print view generated

2. **Detail View Flow**
   - Click detail button → verify modal opens
   - Verify correct data loaded
   - Close modal → verify state cleaned up

3. **Authorization Flow**
   - Test access for each role
   - Verify data filtering for anggota role
   - Verify redirect for unauthorized access

### Test Configuration

- **Framework**: Jest for unit and integration tests
- **PBT Library**: fast-check for property-based tests
- **Minimum Iterations**: 100 runs per property test
- **Coverage Target**: 80% code coverage minimum

## UI/UX Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Header: Laporan Transaksi & Simpanan Anggota              │
├─────────────────────────────────────────────────────────────┤
│  Statistics Cards Row                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ Total    │ │ Total    │ │ Total    │ │ Total    │      │
│  │ Anggota  │ │ Transaksi│ │ Simpanan │ │ Tagihan  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
├─────────────────────────────────────────────────────────────┤
│  Action Buttons: [Export CSV] [Print]                       │
├─────────────────────────────────────────────────────────────┤
│  Filters & Search                                            │
│  [Search...] [Departemen▼] [Tipe▼] [Reset]                 │
│  Showing X of Y anggota                                      │
├─────────────────────────────────────────────────────────────┤
│  Data Table                                                  │
│  ┌────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐  │
│  │NIK │Nama  │Dept  │Trans │Simp  │Tag   │Aksi  │      │  │
│  ├────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤  │
│  │... │...   │...   │...   │...   │...   │[Det] │      │  │
│  └────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘  │
├─────────────────────────────────────────────────────────────┤
│  Footer: Totals                                              │
└─────────────────────────────────────────────────────────────┘
```

### Color Scheme

- Primary: #2d6a4f (Green - consistent with app theme)
- Success: #52b788 (Light Green)
- Warning: #f4a261 (Orange for outstanding balance)
- Danger: #e63946 (Red for high debt)
- Info: #457b9d (Blue for information)
- Background: #f8f9fa (Light Gray)

### Responsive Breakpoints

- Desktop: >= 1200px (Full table view)
- Tablet: 768px - 1199px (Scrollable table)
- Mobile: < 768px (Card view)

## Performance Considerations

### Optimization Strategies

1. **Data Caching**
   - Cache aggregated data to avoid recalculation
   - Invalidate cache only when source data changes

2. **Lazy Loading**
   - Load detail data only when modal is opened
   - Defer non-critical calculations

3. **Pagination**
   - Implement pagination for large datasets (> 100 anggota)
   - Show 25 items per page by default

4. **Debouncing**
   - Debounce search input (300ms delay)
   - Prevent excessive re-renders during typing

5. **Virtual Scrolling**
   - Consider virtual scrolling for very large lists
   - Render only visible rows

### Performance Targets

- Initial load: < 1 second
- Filter/search response: < 200ms
- Export generation: < 2 seconds for 1000 records
- Modal open: < 100ms

## Security Considerations

1. **Data Access Control**
   - Verify user authentication before rendering
   - Filter data based on user role
   - Prevent direct access to other users' data

2. **Input Sanitization**
   - Sanitize search input to prevent XSS
   - Validate filter values

3. **Export Security**
   - Limit export to authorized users
   - Include only data user has access to
   - No sensitive information in filenames

## Implementation Notes

1. **Integration Points**
   - Use existing `filterActiveAnggota()` function from koperasi.js
   - Leverage existing `formatRupiah()` and `formatDate()` utilities
   - Integrate with existing auth system (`currentUser`)

2. **Backward Compatibility**
   - No changes to existing data structures
   - Read-only operations on localStorage
   - No breaking changes to other modules

3. **Future Enhancements**
   - Add date range filter for transactions
   - Add export to PDF
   - Add charts/graphs for visualization
   - Add email report functionality
   - Add scheduled reports

## Dependencies

- Bootstrap 5 (UI framework)
- Bootstrap Icons (icons)
- Existing utility functions (formatRupiah, formatDate, generateId)
- Existing auth system (currentUser, checkRole)
- Existing data structures (anggota, penjualan, simpanan*)
