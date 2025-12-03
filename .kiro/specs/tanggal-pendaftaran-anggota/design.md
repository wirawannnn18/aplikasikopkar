# Design Document

## Overview

Fitur tanggal pendaftaran anggota akan menambahkan field baru `tanggalDaftar` ke dalam data model anggota yang sudah ada. Fitur ini akan terintegrasi dengan modul Master Anggota yang sudah ada di file `js/koperasi.js`. Implementasi akan mencakup perubahan pada UI (form input, tabel, dan detail view), logika penyimpanan data, serta fungsi import/export.

Pendekatan implementasi akan bersifat backward-compatible, artinya data anggota lama yang belum memiliki tanggal pendaftaran akan tetap dapat ditampilkan dan diproses dengan baik.

## Architecture

Aplikasi ini menggunakan arsitektur client-side dengan penyimpanan data di localStorage. Komponen yang akan dimodifikasi:

1. **Data Layer**: Struktur data anggota di localStorage
2. **Business Logic Layer**: Fungsi-fungsi di `js/koperasi.js` untuk CRUD anggota
3. **Presentation Layer**: HTML template yang di-render oleh fungsi `renderAnggota()`
4. **Import/Export Layer**: Fungsi untuk import dan export data CSV

## Components and Interfaces

### 1. Data Model Extension

Struktur data anggota yang sudah ada akan ditambahkan field baru:

```javascript
{
  id: string,
  nik: string,
  nama: string,
  noKartu: string,
  departemen: string,
  tipeAnggota: string,
  status: string,
  telepon: string,
  email: string,
  alamat: string,
  statusKartu: string,
  riwayatKartu: array,
  tanggalUbahKartu: string,
  catatanKartu: string,
  tanggalDaftar: string  // NEW FIELD - ISO 8601 format (YYYY-MM-DD)
}
```

### 2. UI Components

#### Form Anggota Modal
- Tambah field input tanggal pendaftaran
- Mode tambah: field terisi otomatis dengan tanggal hari ini, dapat diedit
- Mode edit: field read-only untuk mencegah perubahan tidak sengaja

#### Tabel Daftar Anggota
- Tambah kolom "Tanggal Pendaftaran"
- Format tampilan: DD/MM/YYYY
- Sortable column (opsional untuk fase 1)

#### Detail View Anggota
- Tampilkan tanggal pendaftaran dalam format DD/MM/YYYY
- Posisi: di bagian informasi utama anggota

### 3. Business Logic Functions

#### Modified Functions:
- `renderAnggota()`: Update HTML template untuk menambah kolom tanggal pendaftaran
- `showAnggotaModal()`: Set default tanggal pendaftaran untuk anggota baru
- `editAnggota(id)`: Load tanggal pendaftaran dari data
- `saveAnggota()`: Simpan tanggal pendaftaran ke localStorage
- `viewAnggota(id)`: Tampilkan tanggal pendaftaran di detail view
- `renderTableAnggota()`: Render kolom tanggal pendaftaran di tabel

#### New Helper Functions:
- `formatDateToDisplay(isoDate)`: Convert ISO date ke DD/MM/YYYY
- `formatDateToISO(displayDate)`: Convert DD/MM/YYYY ke ISO format
- `getCurrentDateISO()`: Get tanggal hari ini dalam format ISO
- `parseDateFlexible(dateString)`: Parse berbagai format tanggal untuk import

### 4. Import/Export Functions

#### Modified Functions:
- `downloadTemplateAnggota()`: Tambah kolom tanggal pendaftaran di template
- `previewImport()`: Parse kolom tanggal pendaftaran dari CSV
- `processImport()`: Validasi dan simpan tanggal pendaftaran
- `exportAnggota()`: Include tanggal pendaftaran dalam export

## Data Models

### Anggota Model (Extended)

```javascript
class AnggotaModel {
  constructor(data) {
    this.id = data.id || generateId();
    this.nik = data.nik;
    this.nama = data.nama;
    this.noKartu = data.noKartu;
    this.departemen = data.departemen || '';
    this.tipeAnggota = data.tipeAnggota || 'Umum';
    this.status = data.status || 'Aktif';
    this.telepon = data.telepon || '';
    this.email = data.email || '';
    this.alamat = data.alamat || '';
    this.statusKartu = data.statusKartu || 'nonaktif';
    this.riwayatKartu = data.riwayatKartu || [];
    this.tanggalUbahKartu = data.tanggalUbahKartu || new Date().toISOString();
    this.catatanKartu = data.catatanKartu || '';
    this.tanggalDaftar = data.tanggalDaftar || new Date().toISOString().split('T')[0];
  }
}
```

### Date Format Standards

- **Storage Format**: ISO 8601 (YYYY-MM-DD) - untuk konsistensi dan sorting
- **Display Format**: DD/MM/YYYY - untuk user-friendly display
- **Input Format**: HTML5 date input (YYYY-MM-DD)
- **Import Format**: Flexible - support DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: New member auto-registration date
*For any* new member being created, the system should automatically set the tanggalDaftar field to today's date in ISO 8601 format.
**Validates: Requirements 1.1**

### Property 2: ISO 8601 format compliance
*For any* member saved to localStorage, the tanggalDaftar field should match the ISO 8601 date format pattern (YYYY-MM-DD).
**Validates: Requirements 1.2**

### Property 3: Non-empty registration date
*For any* newly created member, the tanggalDaftar field should never be null, undefined, or empty string.
**Validates: Requirements 1.3**

### Property 4: Registration date immutability
*For any* existing member being edited, updating any other field should not change the original tanggalDaftar value.
**Validates: Requirements 1.4**

### Property 5: Display format conversion
*For any* member with a valid tanggalDaftar in ISO format, when displayed in the UI (form, table, or detail view), it should be shown in DD/MM/YYYY format.
**Validates: Requirements 2.2, 2.3, 3.2**

### Property 6: Legacy data handling
*For any* member without a tanggalDaftar field, the system should display a placeholder text ("-" or "Tidak tercatat") and continue functioning without errors.
**Validates: Requirements 4.1, 4.3**

### Property 7: Legacy data backfill
*For any* member without a tanggalDaftar field being edited, the system should populate the field with today's date as default.
**Validates: Requirements 4.2**

### Property 8: Import with registration date
*For any* CSV import containing a tanggalDaftar column, the system should correctly parse and store the date for each member.
**Validates: Requirements 5.1**

### Property 9: Import without registration date
*For any* CSV import without a tanggalDaftar column, the system should assign today's date as the default registration date for all imported members.
**Validates: Requirements 5.2**

### Property 10: Export includes registration date
*For any* export operation, the resulting CSV should include a tanggalDaftar column with dates formatted as DD/MM/YYYY.
**Validates: Requirements 5.3**

### Property 11: Flexible date parsing
*For any* date string in formats DD/MM/YYYY, YYYY-MM-DD, or DD-MM-YYYY during import, the system should correctly parse and convert it to ISO 8601 format for storage.
**Validates: Requirements 5.5**

### Property 12: Date-based sorting
*For any* list of members, when sorted by tanggalDaftar, the members should be ordered chronologically (either ascending or descending based on sort direction).
**Validates: Requirements 6.2**

### Property 13: Date range filtering
*For any* date range filter applied, only members whose tanggalDaftar falls within the specified range should be displayed.
**Validates: Requirements 6.3**

## Error Handling

### Invalid Date Formats
- When parsing dates during import, if a date string cannot be parsed by any supported format, the system should:
  - Log a warning message
  - Use today's date as fallback
  - Continue processing other records

### Missing Date Field
- When displaying or processing members without tanggalDaftar:
  - Display operations should show placeholder text
  - Edit operations should populate with today's date
  - Export operations should show empty or placeholder value
  - No errors should be thrown

### Date Validation
- Validate that parsed dates are reasonable (not in the future, not before year 1900)
- If validation fails, use today's date as fallback

## Testing Strategy

### Unit Testing
The testing strategy will use Jest as the testing framework (already configured in the project).

**Unit tests will cover:**
- Date formatting functions (ISO to DD/MM/YYYY and vice versa)
- Date parsing functions for various input formats
- Edge cases: empty dates, invalid dates, future dates
- Legacy data handling scenarios
- Import/export CSV parsing with and without date columns

**Example unit tests:**
```javascript
describe('Date Formatting', () => {
  test('formatDateToDisplay converts ISO to DD/MM/YYYY', () => {
    expect(formatDateToDisplay('2024-01-15')).toBe('15/01/2024');
  });
  
  test('formatDateToISO converts DD/MM/YYYY to ISO', () => {
    expect(formatDateToISO('15/01/2024')).toBe('2024-01-15');
  });
});
```

### Property-Based Testing
The project will use **fast-check** library for property-based testing in JavaScript.

**Property-based tests will:**
- Run a minimum of 100 iterations per property
- Each test will be tagged with a comment referencing the design document property
- Test format: `// Feature: tanggal-pendaftaran-anggota, Property X: [property description]`

**Property tests will cover:**
- Property 1: Auto-registration date for new members
- Property 2: ISO 8601 format compliance
- Property 3: Non-empty registration date
- Property 4: Registration date immutability
- Property 5: Display format conversion
- Property 6: Legacy data handling
- Property 7: Legacy data backfill
- Property 8-11: Import/export operations
- Property 12-13: Sorting and filtering

**Example property test:**
```javascript
// Feature: tanggal-pendaftaran-anggota, Property 2: ISO 8601 format compliance
test('all saved members have ISO 8601 formatted registration dates', () => {
  fc.assert(
    fc.property(
      fc.record({
        nik: fc.string(),
        nama: fc.string(),
        noKartu: fc.string()
      }),
      (memberData) => {
        const savedMember = saveAnggota(memberData);
        const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
        return isoRegex.test(savedMember.tanggalDaftar);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing
- Test the complete flow: create member → save → retrieve → display
- Test import CSV → process → save → export CSV round-trip
- Test edit existing member → verify date unchanged

### Manual Testing Checklist
- Verify UI displays correctly on different screen sizes
- Test with real CSV files
- Verify backward compatibility with existing data
- Test date picker behavior across different browsers

## Implementation Notes

### Backward Compatibility
- Existing anggota data without tanggalDaftar will continue to work
- Migration is lazy: dates are added when members are edited
- No database migration needed (using localStorage)

### Performance Considerations
- Date formatting is done on-demand during rendering
- No performance impact expected for typical dataset sizes (< 10,000 members)
- Consider caching formatted dates if performance issues arise

### Browser Compatibility
- HTML5 date input is supported in all modern browsers
- Fallback to text input with placeholder for older browsers
- Date parsing uses standard JavaScript Date object

### Localization
- Current implementation uses DD/MM/YYYY format (Indonesian standard)
- ISO 8601 storage format allows easy conversion to other locales if needed

## Future Enhancements

1. **Advanced Filtering**: Add preset filters (e.g., "Last 30 days", "This year")
2. **Analytics**: Show registration trends over time
3. **Bulk Date Update**: Allow admin to set registration dates for multiple members
4. **Date Validation**: Add more sophisticated validation rules
5. **Audit Trail**: Track when registration dates are modified (if ever allowed)
