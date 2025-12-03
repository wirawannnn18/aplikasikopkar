# Design Document - Filter dan Hapus Jurnal

## Overview

Fitur ini menambahkan kemampuan filtering berdasarkan tanggal dan penghapusan entri jurnal pada menu jurnal yang sudah ada. Sistem akan mengintegrasikan filter tanggal dengan preset periode umum, serta menyediakan mekanisme penghapusan jurnal yang aman dengan reversal otomatis, audit trail lengkap, dan validasi berbasis role.

Implementasi akan memperluas fungsi `renderJurnal()` yang ada di `js/keuangan.js` dengan menambahkan:
- UI filter tanggal dengan preset periode
- Tombol hapus per entri jurnal
- Dialog konfirmasi dengan detail lengkap
- Mekanisme reversal otomatis
- Audit logging
- Session storage untuk persistensi filter

## Architecture

### Component Structure

```
Filter & Delete Jurnal System
├── UI Layer
│   ├── Date Filter Component
│   │   ├── Start Date Input
│   │   ├── End Date Input
│   │   ├── Preset Buttons (Hari Ini, Minggu Ini, dll)
│   │   └── Clear Filter Button
│   ├── Journal Table Component
│   │   ├── Filtered Journal List
│   │   ├── Delete Button per Entry
│   │   └── Entry Count Display
│   └── Confirmation Dialog
│       ├── Entry Details Display
│       ├── Balance Impact Preview
│       ├── Reason Input (optional)
│       └── Confirm/Cancel Actions
├── Business Logic Layer
│   ├── Filter Manager
│   │   ├── Date Range Validation
│   │   ├── Preset Date Calculator
│   │   ├── Filter Application
│   │   └── Session Persistence
│   ├── Delete Manager
│   │   ├── Permission Validator
│   │   ├── Reversal Generator
│   │   ├── Balance Calculator
│   │   └── Audit Logger
│   └── Journal Service
│       ├── CRUD Operations
│       ├── COA Integration
│       └── Balance Updates
└── Data Layer
    ├── LocalStorage
    │   ├── jurnal[]
    │   ├── coa[]
    │   ├── auditLog[]
    │   └── closedPeriods[]
    └── SessionStorage
        └── jurnalFilter{}
```

### Integration Points

1. **Existing Journal System**: Extends `renderJurnal()` function in `js/keuangan.js`
2. **COA System**: Reads account information for display and reversal
3. **Auth System**: Uses `currentUser` for permission checks and audit logging
4. **Alert System**: Uses existing `showAlert()` for notifications

## Components and Interfaces

### 1. Date Filter Component

**Functions:**
```javascript
// Render filter UI
function renderJurnalDateFilter()

// Apply date filter
function applyJurnalDateFilter(startDate, endDate)

// Clear filter
function clearJurnalDateFilter()

// Set preset period
function setJurnalPreset(presetType) // 'today', 'thisWeek', 'thisMonth', 'lastMonth'

// Validate date range
function validateDateRange(startDate, endDate)

// Save filter to session
function saveFilterToSession(filterCriteria)

// Load filter from session
function loadFilterFromSession()
```

### 2. Delete Manager Component

**Functions:**
```javascript
// Show delete confirmation
function showDeleteJurnalConfirmation(jurnalId)

// Execute deletion
function deleteJurnalEntry(jurnalId, reason)

// Generate reversal entries
function generateReversalEntries(jurnalEntry)

// Check if entry can be deleted
function canDeleteJurnal(jurnalEntry, user)

// Calculate balance impact
function calculateBalanceImpact(jurnalEntry)
```

### 3. Audit Logger Component

**Functions:**
```javascript
// Create audit log entry
function createAuditLog(action, details, priority)

// Link reversal to original
function linkReversalToOriginal(originalId, reversalId)

// Get audit logs
function getAuditLogs(filters)
```

## Data Models

### Journal Entry (Existing - Extended)
```javascript
{
  id: string,
  tanggal: string (ISO date),
  keterangan: string,
  entries: [
    {
      akun: string (kode akun),
      debit: number,
      kredit: number
    }
  ],
  // New fields
  reconciled: boolean,
  periodClosed: boolean,
  deletedAt: string | null,
  deletedBy: string | null,
  deletedReason: string | null
}
```

### Filter Criteria (Session Storage)
```javascript
{
  startDate: string (ISO date),
  endDate: string (ISO date),
  preset: string | null, // 'today', 'thisWeek', 'thisMonth', 'lastMonth'
  appliedAt: string (timestamp)
}
```

### Audit Log Entry
```javascript
{
  id: string,
  timestamp: string (ISO datetime),
  action: string, // 'DELETE_JOURNAL', 'CREATE_REVERSAL'
  userId: string,
  userName: string,
  userRole: string,
  priority: string, // 'normal', 'high'
  details: {
    jurnalId: string,
    tanggal: string,
    keterangan: string,
    entries: array,
    reason: string | null,
    balanceImpact: object,
    reversalIds: array
  }
}
```

### Closed Period
```javascript
{
  id: string,
  periodStart: string (ISO date),
  periodEnd: string (ISO date),
  closedAt: string (ISO datetime),
  closedBy: string
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After reviewing all testable criteria from the prework, I've identified the following redundancies and consolidations:

- Properties 2.3 and 5.1 both test deletion behavior - these can be combined into a comprehensive deletion property
- Properties 3.1 and 3.2 both test dialog display - these can be combined
- Properties 4.1 and 4.2 test session storage round-trip - these should be combined
- Properties 5.1, 5.2, and 5.3 all test audit logging - these can be consolidated into one comprehensive audit property

The refined properties below eliminate these redundancies while maintaining complete coverage.

### Property 1: Date filter returns only entries within range
*For any* valid date range (start date, end date) and any set of journal entries, applying the filter should return only entries where the entry date is >= start date AND <= end date
**Validates: Requirements 1.2**

### Property 2: Clear filter shows all entries
*For any* filtered journal list, clearing the filter should result in displaying all journal entries in the system
**Validates: Requirements 1.3**

### Property 3: Invalid date range shows error
*For any* date range where end date < start date, the system should display a validation error and prevent filter application
**Validates: Requirements 1.4**

### Property 4: Filtered count matches actual count
*For any* applied filter, the displayed count should equal the actual number of entries shown in the filtered list
**Validates: Requirements 1.5**

### Property 5: Delete button present for all entries
*For any* journal entry displayed to an admin user, the rendered HTML should contain a delete button
**Validates: Requirements 2.1**

### Property 6: Deletion removes entry and creates audit log
*For any* deletable journal entry, confirming deletion should remove the entry from storage AND create an audit log entry with timestamp, user, entry details, and reason (if provided)
**Validates: Requirements 2.3, 5.1, 5.3**

### Property 7: Deletion creates balanced reversals
*For any* deleted journal entry, the system should create reversal entries such that the sum of (original debits + reversal debits) equals the sum of (original credits + reversal credits), and these reversals should be linked in the audit log
**Validates: Requirements 2.4, 5.2**

### Property 8: Confirmation dialog shows complete details
*For any* journal entry, clicking delete should display a confirmation dialog containing entry date, account names, debit amounts, credit amounts, description, and calculated balance impact
**Validates: Requirements 3.1, 3.2**

### Property 9: Cancel maintains state
*For any* journal entry, clicking delete then cancel should result in the entry count and all entry data remaining unchanged
**Validates: Requirements 3.3**

### Property 10: Filter persists in session (round-trip)
*For any* applied filter criteria, the criteria should be stored in session storage, and navigating away then returning should restore the exact same filter settings
**Validates: Requirements 4.1, 4.2**

### Property 11: Reconciled entries cannot be deleted
*For any* journal entry marked as reconciled, attempting deletion should be prevented and an error message should be displayed
**Validates: Requirements 6.1**

### Property 12: Closed period entries require SuperAdmin
*For any* journal entry in a closed period, deletion should be prevented for non-SuperAdmin users and allowed only for SuperAdmin users
**Validates: Requirements 6.2**

### Property 13: Preset populates correct date range
*For any* preset option ('today', 'thisWeek', 'thisMonth', 'lastMonth'), selecting it should populate the start and end date fields with the correct calculated dates for that period
**Validates: Requirements 7.2**

### Property 14: Manual date change clears preset
*For any* active preset selection, manually changing either the start or end date should clear the preset selection indicator
**Validates: Requirements 7.3**

## Error Handling

### Validation Errors
1. **Invalid Date Range**: Display error message "Tanggal akhir harus lebih besar atau sama dengan tanggal awal"
2. **Empty Date Fields**: Display error message "Mohon isi tanggal awal dan akhir"
3. **Future Dates**: Allow but warn "Filter mencakup tanggal di masa depan"

### Permission Errors
1. **Reconciled Entry**: Display error "Jurnal yang sudah direkonsiliasi tidak dapat dihapus"
2. **Closed Period (Non-SuperAdmin)**: Display error "Jurnal dari periode tertutup hanya dapat dihapus oleh Super Admin"
3. **Insufficient Permission**: Display error "Anda tidak memiliki izin untuk menghapus jurnal"

### Data Integrity Errors
1. **Entry Not Found**: Display error "Entri jurnal tidak ditemukan"
2. **COA Account Missing**: Log warning and use account code as fallback
3. **Reversal Generation Failed**: Rollback deletion and display error "Gagal membuat reversal entries"

### Storage Errors
1. **LocalStorage Full**: Display error "Penyimpanan penuh, mohon hapus data lama"
2. **SessionStorage Unavailable**: Disable filter persistence, show warning

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

1. **Date Calculation Tests**
   - Test preset date calculations for each preset type
   - Test date range validation with various invalid inputs
   - Test edge cases: same start/end date, year boundaries

2. **Permission Tests**
   - Test deletion permission for each role type
   - Test reconciled entry blocking
   - Test closed period blocking for non-SuperAdmin

3. **Reversal Generation Tests**
   - Test reversal creation for simple entries (1 debit, 1 credit)
   - Test reversal creation for complex entries (multiple accounts)
   - Test reversal linking in audit log

4. **UI Rendering Tests**
   - Test filter UI renders with all required elements
   - Test delete button renders for each entry
   - Test confirmation dialog renders with entry details

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using **fast-check** library (JavaScript PBT framework). Each test will run a minimum of 100 iterations.

1. **Property Test: Date Filter Range**
   - **Feature: filter-hapus-jurnal, Property 1: Date filter returns only entries within range**
   - Generate: random date ranges, random journal entries with various dates
   - Verify: all filtered results have dates within the specified range

2. **Property Test: Filter Clear**
   - **Feature: filter-hapus-jurnal, Property 2: Clear filter shows all entries**
   - Generate: random journal entries, random filter criteria
   - Verify: clearing filter returns count equal to total entries

3. **Property Test: Invalid Date Range**
   - **Feature: filter-hapus-jurnal, Property 3: Invalid date range shows error**
   - Generate: random date ranges where end < start
   - Verify: validation error is displayed

4. **Property Test: Count Accuracy**
   - **Feature: filter-hapus-jurnal, Property 4: Filtered count matches actual count**
   - Generate: random journal entries, random filter criteria
   - Verify: displayed count equals actual filtered entry count

5. **Property Test: Delete Button Presence**
   - **Feature: filter-hapus-jurnal, Property 5: Delete button present for all entries**
   - Generate: random journal entries
   - Verify: rendered HTML contains delete button for each entry

6. **Property Test: Deletion and Audit**
   - **Feature: filter-hapus-jurnal, Property 6: Deletion removes entry and creates audit log**
   - Generate: random deletable journal entries
   - Verify: entry removed from storage AND audit log created with all required fields

7. **Property Test: Balanced Reversals**
   - **Feature: filter-hapus-jurnal, Property 7: Deletion creates balanced reversals**
   - Generate: random journal entries with various debit/credit combinations
   - Verify: sum(original debits + reversal debits) = sum(original credits + reversal credits)

8. **Property Test: Confirmation Dialog Content**
   - **Feature: filter-hapus-jurnal, Property 8: Confirmation dialog shows complete details**
   - Generate: random journal entries
   - Verify: dialog HTML contains all required fields (date, accounts, amounts, description, impact)

9. **Property Test: Cancel Preservation**
   - **Feature: filter-hapus-jurnal, Property 9: Cancel maintains state**
   - Generate: random journal entries
   - Verify: after delete-then-cancel, entry count and data unchanged

10. **Property Test: Session Persistence Round-Trip**
    - **Feature: filter-hapus-jurnal, Property 10: Filter persists in session (round-trip)**
    - Generate: random filter criteria
    - Verify: save to session, load from session produces identical criteria

11. **Property Test: Reconciled Entry Protection**
    - **Feature: filter-hapus-jurnal, Property 11: Reconciled entries cannot be deleted**
    - Generate: random reconciled journal entries
    - Verify: deletion attempt is blocked and error displayed

12. **Property Test: Closed Period Access Control**
    - **Feature: filter-hapus-jurnal, Property 12: Closed period entries require SuperAdmin**
    - Generate: random closed period entries, random user roles
    - Verify: deletion blocked for non-SuperAdmin, allowed for SuperAdmin

13. **Property Test: Preset Date Calculation**
    - **Feature: filter-hapus-jurnal, Property 13: Preset populates correct date range**
    - Generate: random current dates, all preset types
    - Verify: calculated date ranges match expected periods

14. **Property Test: Manual Override Clears Preset**
    - **Feature: filter-hapus-jurnal, Property 14: Manual date change clears preset**
    - Generate: random preset selections, random manual date changes
    - Verify: preset indicator cleared after manual input

### Integration Testing

Integration tests will verify the complete flow:

1. **Filter and Delete Flow**
   - Apply filter → verify filtered list → delete entry → verify entry removed from filtered list
   
2. **Session Persistence Flow**
   - Apply filter → navigate away → return → verify filter restored

3. **Audit Trail Flow**
   - Delete entry → verify audit log → verify reversal entries → verify audit links

4. **Permission Flow**
   - Login as different roles → attempt deletions → verify appropriate access control

