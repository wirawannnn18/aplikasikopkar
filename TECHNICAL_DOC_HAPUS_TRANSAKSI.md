# Technical Documentation - Hapus Transaksi POS

## Overview

This document provides technical details for developers working on the Hapus Transaksi POS (Delete POS Transaction) feature.

## Architecture

### Layered Architecture

```
┌─────────────────────────────────────────┐
│         UI Layer (Presentation)         │
│  - renderHapusTransaksi()              │
│  - renderFilterPanel()                 │
│  - renderTransactionTable()            │
│  - showDeleteConfirmation()            │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      Service Layer (Business Logic)     │
│  - TransactionDeletionService          │
│  - ValidationService                   │
│  - StockRestorationService             │
│  - JournalReversalService              │
│  - AuditLoggerService                  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│    Repository Layer (Data Access)       │
│  - TransactionRepository               │
│  - StockRepository                     │
│  - JournalRepository                   │
│  - DeletionLogRepository               │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Data Layer (localStorage)       │
│  - penjualan                           │
│  - barang                              │
│  - jurnal                              │
│  - coa                                 │
│  - deletionLog                         │
│  - riwayatTutupKas                     │
└─────────────────────────────────────────┘
```

## Module Structure

### File: `js/hapusTransaksi.js`

**Size**: ~1500 lines  
**Dependencies**: 
- Bootstrap 5 (for modals and UI)
- localStorage API
- Global `currentUser` object
- Global `formatRupiah()` function
- Global `showAlert()` function

## Repository Classes

### TransactionRepository

Handles all transaction data operations.

**Methods:**

#### `getAll(): Array<Object>`
Returns all transactions from localStorage.

```javascript
const repo = new TransactionRepository();
const transactions = repo.getAll();
```

#### `getById(id: string): Object|null`
Retrieves a transaction by ID or noTransaksi.

```javascript
const transaction = repo.getById('TRX-241124-0001');
```

#### `delete(id: string): boolean`
Deletes a transaction from localStorage.

```javascript
const success = repo.delete('TRX-241124-0001');
```

#### `filter(filters: Object): Array<Object>`
Filters transactions based on criteria.

**Filter Object:**
```javascript
{
    search: string,      // Search in noTransaksi, id, or kasir
    metode: string,      // 'all', 'cash', or 'bon'
    startDate: string,   // ISO date string
    endDate: string      // ISO date string
}
```

**Example:**
```javascript
const filtered = repo.filter({
    search: 'TRX-241124',
    metode: 'cash',
    startDate: '2024-11-01',
    endDate: '2024-11-30'
});
```

### StockRepository

Manages inventory stock operations.

**Methods:**

#### `getAll(): Array<Object>`
Returns all items from localStorage.

#### `addStock(itemId: string, quantity: number): boolean`
Adds quantity to an item's stock.

```javascript
const repo = new StockRepository();
const success = repo.addStock('ITEM-001', 5);
```

### JournalRepository

Handles accounting journal entries.

**Methods:**

#### `add(journal: Object): string`
Creates a new journal entry and updates COA balances.

**Journal Object:**
```javascript
{
    tanggal: string,        // ISO date string
    keterangan: string,     // Description
    entries: [
        {
            akun: string,   // Account code (e.g., '4-1000')
            debit: number,  // Debit amount
            kredit: number  // Credit amount
        }
    ]
}
```

**Returns:** Journal ID

#### `updateCOASaldo(entries: Array<Object>): void`
Updates Chart of Accounts balances based on journal entries.

**Logic:**
- Asset & Expense accounts: `saldo += debit - kredit`
- Liability, Equity & Revenue accounts: `saldo += kredit - debit`

### DeletionLogRepository

Manages deletion audit logs.

**Methods:**

#### `save(log: Object): string`
Saves a deletion log entry.

**Log Object:**
```javascript
{
    transactionId: string,
    transactionNo: string,
    transactionData: Object,
    reason: string,
    deletedBy: string,
    stockRestored: boolean,
    journalReversed: boolean,
    warnings: Array<string>
}
```

#### `getAll(): Array<Object>`
Returns all deletion logs.

#### `getByTransactionId(transactionId: string): Object|null`
Retrieves a deletion log by transaction ID.

## Service Classes

### ValidationService

Validates deletion operations.

**Methods:**

#### `validateDeletion(transactionId: string): Object`
Checks if a transaction can be deleted.

**Returns:**
```javascript
{
    valid: boolean,
    message: string
}
```

**Validation Rules:**
1. Transaction must exist
2. Transaction must not be in a closed shift

#### `validateReason(reason: string): Object`
Validates the deletion reason.

**Returns:**
```javascript
{
    valid: boolean,
    message: string
}
```

**Validation Rules:**
1. Reason must not be empty
2. Reason must not exceed 500 characters

#### `_isTransactionInClosedShift(transaction: Object): boolean`
Private method to check if transaction is in a closed shift.

**Logic:**
- Loads `riwayatTutupKas` from localStorage
- Checks if transaction date falls within any closed shift period

### StockRestorationService

Restores stock when transactions are deleted.

**Methods:**

#### `restoreStock(items: Array<Object>): Object`
Restores stock for all items in a transaction.

**Returns:**
```javascript
{
    success: boolean,
    warnings: Array<string>
}
```

**Process:**
1. Loop through each item
2. Add quantity back to stock using `StockRepository.addStock()`
3. Record warning if item not found
4. Continue processing even if warnings occur

### JournalReversalService

Creates reversal journal entries.

**Methods:**

#### `createReversalJournals(transaction: Object): Object`
Creates reversal journals for a deleted transaction.

**Returns:**
```javascript
{
    success: boolean,
    journalIds: Array<string>
}
```

**Process:**

1. **Calculate Total HPP:**
   ```javascript
   totalHPP = items.reduce((sum, item) => sum + (item.hpp * item.qty), 0)
   ```

2. **Create Revenue Reversal:**
   - **For Cash Transactions:**
     ```
     Debit:  Pendapatan Penjualan (4-1000)
     Credit: Kas (1-1000)
     ```
   - **For Credit Transactions:**
     ```
     Debit:  Pendapatan Penjualan (4-1000)
     Credit: Piutang Anggota (1-1200)
     ```

3. **Create HPP Reversal:**
   ```
   Debit:  Persediaan Barang (1-1300)
   Credit: Harga Pokok Penjualan (5-1000)
   ```

**Important Notes:**
- Uses current date (deletion date), not original transaction date
- Description includes "Reversal" and original transaction number
- Both journals are created even if HPP is zero

### AuditLoggerService

Manages audit trail for deletions.

**Methods:**

#### `logDeletion(transaction: Object, reason: string, deletedBy: string): Object`
Creates a deletion log entry.

**Returns:**
```javascript
{
    success: boolean,
    logId: string
}
```

#### `getDeletionHistory(): Array<Object>`
Returns all deletion logs.

### TransactionDeletionService

Main orchestration service for deletion process.

**Methods:**

#### `deleteTransaction(transactionId: string, reason: string, deletedBy: string): Object`
Orchestrates the complete deletion process.

**Returns:**
```javascript
{
    success: boolean,
    message: string,
    warnings?: Array<string>
}
```

**Process Flow:**
```
1. Validate transaction (can it be deleted?)
   ↓
2. Validate reason (is it valid?)
   ↓
3. Get complete transaction data
   ↓
4. Restore stock (add quantities back)
   ↓
5. Create journal reversals
   ↓
6. Delete transaction from localStorage
   ↓
7. Log audit trail
   ↓
8. Return result with any warnings
```

**Error Handling:**
- All operations wrapped in try-catch
- Returns error object on failure
- Warnings don't stop the process

## UI Functions

### Main Page Functions

#### `renderHapusTransaksi()`
Entry point for the delete transaction feature.

**Creates:**
- Page header
- Filter panel container
- Transaction table container

**Calls:**
- `renderFilterPanel()`
- `loadAndRenderTransactions()`

#### `renderFilterPanel()`
Creates filter controls.

**Elements:**
- Search input (transaction number or cashier)
- Payment method dropdown
- Start date picker
- End date picker
- Reset button

**Event Listeners:**
- All inputs trigger `handleFilterChange()`

#### `renderTransactionTable(transactions: Array<Object>)`
Renders transaction table with delete buttons.

**Features:**
- Sorts by date (newest first)
- Formats currency and dates
- Shows badges for payment method and status
- Empty state for no transactions
- Delete button for each row

### Filter Functions

#### `handleFilterChange()`
Updates global filter state and refreshes list.

#### `applyFilters()`
Applies current filters and re-renders table.

#### `resetFilters()`
Clears all filters and shows all transactions.

#### `loadAndRenderTransactions()`
Loads filtered transactions and renders table.

### Deletion Flow Functions

#### `handleDeleteTransaction(transactionId: string)`
Initiates deletion process.

**Steps:**
1. Validate transaction can be deleted
2. Show error if validation fails
3. Get transaction data
4. Show confirmation dialog

#### `showDeleteConfirmation(transaction: Object)`
Displays confirmation modal.

**Features:**
- Shows complete transaction details
- Lists all items with quantities and prices
- Required reason textarea (max 500 chars)
- Character counter
- Confirm and Cancel buttons

#### `confirmDeletion(transactionId: string)`
Executes the deletion.

**Steps:**
1. Get reason from textarea
2. Validate reason
3. Get current user
4. Call `TransactionDeletionService.deleteTransaction()`
5. Close modal
6. Show success/error notification
7. Show warnings if any
8. Refresh transaction list

#### `handleCancelDeletion()`
Closes modal without changes.

### History Page Functions

#### `renderRiwayatHapusTransaksi()`
Renders deletion history page.

#### `loadAndRenderDeletionHistory()`
Loads and displays deletion logs.

#### `renderDeletionHistoryTable(deletionLogs: Array<Object>)`
Renders deletion history table.

**Features:**
- Sorts by deletion date (newest first)
- Shows transaction number, dates, user, reason
- Detail button for each log
- Empty state for no history

#### `showDeletionDetail(logId: string)`
Shows detailed deletion log modal.

**Displays:**
- Deletion information (who, when, why)
- Stock restoration status
- Journal reversal status
- Warnings (if any)
- Complete original transaction data
- All items with HPP

### Utility Functions

#### `formatTanggal(dateString: string): string`
Formats ISO date to Indonesian locale.

**Example:**
```javascript
formatTanggal("2024-11-24T10:30:00.000Z")
// Returns: "24 Nov 2024, 10:30"
```

#### `escapeHtml(text: string): string`
Escapes HTML to prevent XSS attacks.

**Example:**
```javascript
escapeHtml('<script>alert("XSS")</script>')
// Returns: '&lt;script&gt;alert("XSS")&lt;/script&gt;'
```

## Data Models

### Transaction Model
```javascript
{
    id: string,                    // Legacy ID
    noTransaksi: string,           // TRX-YYMMDD-NNNN
    tanggal: string,               // ISO date
    kasir: string,                 // Cashier name
    anggotaId: string | null,      // Member ID
    tipeAnggota: string,           // 'Anggota' or 'Umum'
    metode: string,                // 'cash' or 'bon'
    items: [
        {
            id: string,
            nama: string,
            harga: number,
            hpp: number,
            qty: number,
            stok: number
        }
    ],
    total: number,
    uangBayar: number,             // For cash only
    kembalian: number,             // For cash only
    status: string                 // 'lunas' or 'kredit'
}
```

### Deletion Log Model
```javascript
{
    id: string,
    transactionId: string,
    transactionNo: string,
    transactionData: Object,       // Complete transaction
    reason: string,
    deletedBy: string,
    deletedAt: string,             // ISO date
    stockRestored: boolean,
    journalReversed: boolean,
    warnings: Array<string>
}
```

### Filter Model
```javascript
{
    search: string,
    metode: string,                // 'all', 'cash', or 'bon'
    startDate: string,             // ISO date
    endDate: string                // ISO date
}
```

## localStorage Keys

| Key | Description | Data Type |
|-----|-------------|-----------|
| `penjualan` | All transactions | Array<Transaction> |
| `barang` | All inventory items | Array<Item> |
| `jurnal` | All journal entries | Array<Journal> |
| `coa` | Chart of Accounts | Array<Account> |
| `deletionLog` | Deletion audit logs | Array<DeletionLog> |
| `riwayatTutupKas` | Closed shift history | Array<Shift> |

## Testing

### Unit Tests
Located in: `__tests__/hapusTransaksi.test.js`

**Test Coverage:**
- Repository filter operations
- Validation logic
- Stock restoration
- Journal reversal
- Audit logging
- Complete deletion flow

### Property-Based Tests
Uses `fast-check` library for property-based testing.

**Properties Tested:**
1. Search filtering correctness
2. Payment method filtering correctness
3. Date range filtering correctness
4. Stock restoration for all items
5. Cash transaction journal reversal
6. Credit transaction journal reversal
7. HPP journal reversal
8. Reversal journal description format
9. Reversal journal date
10. Deletion log creation
11. Reason storage in log
12. Closed shift validation

### Integration Tests
Located in: `__tests__/hapusTransaksi.integration.test.js`

**Scenarios:**
- Complete deletion flow end-to-end
- Closed shift prevention
- Error scenarios

## Security Considerations

### Authorization
- Only 'administrator' and 'kasir' roles can access
- Check `currentUser.role` before rendering UI
- Validate role on every deletion operation

### Input Validation
- Reason is sanitized using `escapeHtml()`
- Transaction ID is validated before operations
- All user inputs are validated

### Audit Trail
- All deletions are logged with complete data
- Logs are immutable (cannot be deleted)
- Includes user information and timestamp

### XSS Prevention
- All user-generated content is escaped using `escapeHtml()`
- Particularly important for deletion reasons

## Performance Considerations

### Optimization Strategies
1. **Lazy Loading**: Transactions loaded on demand
2. **Client-side Filtering**: Fast filtering without server calls
3. **Sorted Display**: Pre-sorted by date for better UX
4. **Minimal DOM Updates**: Only update changed elements

### Potential Bottlenecks
- Large transaction lists (>1000 items)
- Complex filter combinations
- Multiple simultaneous deletions

### Recommendations
- Consider pagination for large datasets
- Implement virtual scrolling for very long lists
- Add loading indicators for operations

## Error Handling

### Error Types

#### Validation Errors
- Empty reason
- Reason too long
- Closed shift
- Transaction not found

#### System Errors
- localStorage quota exceeded
- Item not found (warning, not error)
- Journal creation failure

### Error Recovery
All critical operations follow this pattern:
```javascript
try {
    // 1. Validate preconditions
    // 2. Perform operations
    // 3. Return success
} catch (error) {
    // 4. Log error
    // 5. Return user-friendly message
}
```

## Integration Points

### Dependencies on Other Modules
- `currentUser` - Global user object
- `formatRupiah()` - Currency formatting function
- `showAlert()` - Notification function
- Bootstrap 5 - Modal and UI components

### Integration with Other Features
- **POS Module**: Source of transactions
- **Inventory Module**: Stock updates
- **Accounting Module**: Journal entries
- **Shift Management**: Closed shift validation

## Future Enhancements

### Potential Improvements
1. **Batch Deletion**: Delete multiple transactions at once
2. **Advanced Filters**: More filter options (amount range, item name)
3. **Export**: Export deletion history to CSV/PDF
4. **Undo**: Ability to restore deleted transactions
5. **Notifications**: Email/SMS notifications for deletions
6. **Permissions**: Granular permissions for different user roles
7. **Search**: Full-text search across all fields
8. **Analytics**: Dashboard for deletion statistics

### Technical Debt
- Consider moving to a proper database (IndexedDB or server-side)
- Implement proper state management (Redux/Vuex)
- Add TypeScript for type safety
- Implement proper error boundaries
- Add comprehensive logging

## Troubleshooting

### Common Issues

#### Issue: Transactions not appearing
**Cause**: Filter is too restrictive  
**Solution**: Click "Reset" button to clear filters

#### Issue: Cannot delete transaction
**Cause**: Transaction in closed shift  
**Solution**: Check shift status, contact admin if needed

#### Issue: Stock not restored
**Cause**: Item deleted from master data  
**Solution**: Warning is logged, manual stock adjustment needed

#### Issue: Modal not closing
**Cause**: JavaScript error or Bootstrap issue  
**Solution**: Refresh page, check console for errors

## Development Guidelines

### Code Style
- Use JSDoc comments for all functions and classes
- Follow existing naming conventions
- Keep functions small and focused
- Use meaningful variable names

### Adding New Features
1. Update design document first
2. Add tests before implementation
3. Update this technical documentation
4. Update user guide
5. Test thoroughly

### Debugging
- Use browser DevTools console
- Check localStorage contents
- Verify Bootstrap modal state
- Check for JavaScript errors

## Contact

For technical questions or issues:
- **Developer**: Tim Development Koperasi Karyawan
- **Email**: dev@koperasi.com
- **Documentation**: See `PANDUAN_HAPUS_TRANSAKSI_POS.md` for user guide

---

**Version**: 1.0.0  
**Last Updated**: November 2024  
**Maintained by**: Development Team
