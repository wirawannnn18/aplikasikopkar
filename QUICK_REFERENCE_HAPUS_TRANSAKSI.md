# Quick Reference - Hapus Transaksi POS

## Quick Start

### For Users
See: `PANDUAN_HAPUS_TRANSAKSI_POS.md`

### For Developers
See: `TECHNICAL_DOC_HAPUS_TRANSAKSI.md`

## Quick Code Examples

### Delete a Transaction
```javascript
const deletionService = new TransactionDeletionService();
const result = deletionService.deleteTransaction(
    'TRX-241124-0001',
    'Transaksi duplikat',
    'Admin User'
);

if (result.success) {
    console.log('Deleted successfully');
    if (result.warnings) {
        console.warn('Warnings:', result.warnings);
    }
} else {
    console.error('Error:', result.message);
}
```

### Filter Transactions
```javascript
const repo = new TransactionRepository();
const filtered = repo.filter({
    search: 'TRX-241124',
    metode: 'cash',
    startDate: '2024-11-01',
    endDate: '2024-11-30'
});
```

### Validate Transaction
```javascript
const validationService = new ValidationService();
const result = validationService.validateDeletion('TRX-241124-0001');

if (result.valid) {
    // Proceed with deletion
} else {
    console.error(result.message);
}
```

### Get Deletion History
```javascript
const auditLogger = new AuditLoggerService();
const history = auditLogger.getDeletionHistory();
```

## Key Classes

| Class | Purpose | Key Methods |
|-------|---------|-------------|
| `TransactionRepository` | Transaction data access | `getAll()`, `getById()`, `delete()`, `filter()` |
| `StockRepository` | Stock management | `getAll()`, `addStock()` |
| `JournalRepository` | Journal entries | `add()`, `updateCOASaldo()` |
| `DeletionLogRepository` | Audit logs | `save()`, `getAll()`, `getByTransactionId()` |
| `ValidationService` | Validation logic | `validateDeletion()`, `validateReason()` |
| `StockRestorationService` | Stock restoration | `restoreStock()` |
| `JournalReversalService` | Journal reversal | `createReversalJournals()` |
| `AuditLoggerService` | Audit logging | `logDeletion()`, `getDeletionHistory()` |
| `TransactionDeletionService` | Main orchestration | `deleteTransaction()` |

## Key UI Functions

| Function | Purpose |
|----------|---------|
| `renderHapusTransaksi()` | Main page entry point |
| `renderFilterPanel()` | Filter controls |
| `renderTransactionTable()` | Transaction list |
| `handleDeleteTransaction()` | Initiate deletion |
| `showDeleteConfirmation()` | Confirmation dialog |
| `confirmDeletion()` | Execute deletion |
| `renderRiwayatHapusTransaksi()` | History page |
| `showDeletionDetail()` | Detail modal |

## Account Codes

| Code | Account Name | Type |
|------|--------------|------|
| 1-1000 | Kas | Aset |
| 1-1200 | Piutang Anggota | Aset |
| 1-1300 | Persediaan Barang | Aset |
| 4-1000 | Pendapatan Penjualan | Pendapatan |
| 5-1000 | Harga Pokok Penjualan | Beban |

## Journal Entry Patterns

### Cash Transaction Reversal
```
Debit:  Pendapatan Penjualan (4-1000)  [total]
Credit: Kas (1-1000)                   [total]

Debit:  Persediaan Barang (1-1300)     [totalHPP]
Credit: Harga Pokok Penjualan (5-1000) [totalHPP]
```

### Credit Transaction Reversal
```
Debit:  Pendapatan Penjualan (4-1000)  [total]
Credit: Piutang Anggota (1-1200)       [total]

Debit:  Persediaan Barang (1-1300)     [totalHPP]
Credit: Harga Pokok Penjualan (5-1000) [totalHPP]
```

## Validation Rules

| Rule | Condition | Error Message |
|------|-----------|---------------|
| Transaction exists | Transaction must be in localStorage | "Transaksi tidak ditemukan" |
| Not in closed shift | Transaction not in closed shift | "Transaksi sudah masuk dalam laporan tutup kasir..." |
| Reason not empty | Reason must have content | "Alasan penghapusan harus diisi" |
| Reason length | Reason ≤ 500 characters | "Alasan maksimal 500 karakter" |

## localStorage Keys

| Key | Content |
|-----|---------|
| `penjualan` | All transactions |
| `barang` | Inventory items |
| `jurnal` | Journal entries |
| `coa` | Chart of Accounts |
| `deletionLog` | Deletion audit logs |
| `riwayatTutupKas` | Closed shifts |

## Common Patterns

### Error Handling
```javascript
try {
    // Operation
    return { success: true, message: 'Success' };
} catch (error) {
    return { success: false, message: error.message };
}
```

### Repository Pattern
```javascript
class Repository {
    getAll() {
        return JSON.parse(localStorage.getItem('key') || '[]');
    }
    
    save(data) {
        localStorage.setItem('key', JSON.stringify(data));
    }
}
```

### Service Pattern
```javascript
class Service {
    constructor() {
        this.repo = new Repository();
    }
    
    doSomething() {
        const data = this.repo.getAll();
        // Business logic
        this.repo.save(data);
    }
}
```

## Testing Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test hapusTransaksi.test.js

# Run with coverage
npm test -- --coverage

# Run integration tests
npm test hapusTransaksi.integration.test.js
```

## Debugging Tips

### Check localStorage
```javascript
// View all transactions
console.log(JSON.parse(localStorage.getItem('penjualan')));

// View deletion logs
console.log(JSON.parse(localStorage.getItem('deletionLog')));

// View closed shifts
console.log(JSON.parse(localStorage.getItem('riwayatTutupKas')));
```

### Test Validation
```javascript
const validation = new ValidationService();
console.log(validation.validateDeletion('TRX-241124-0001'));
console.log(validation.validateReason('Test reason'));
```

### Test Stock Restoration
```javascript
const stockService = new StockRestorationService();
const result = stockService.restoreStock([
    { id: 'ITEM-001', nama: 'Pensil', qty: 5 }
]);
console.log(result);
```

## Performance Tips

1. **Filter Early**: Apply filters at repository level
2. **Batch Operations**: Group multiple operations when possible
3. **Lazy Load**: Load data only when needed
4. **Cache Results**: Cache filtered results if filters don't change
5. **Minimize DOM Updates**: Update only changed elements

## Security Checklist

- [ ] Validate user role before showing UI
- [ ] Escape all user inputs with `escapeHtml()`
- [ ] Validate transaction ID format
- [ ] Check closed shift status
- [ ] Log all deletions with user info
- [ ] Validate reason length and content

## Common Gotchas

1. **Transaction ID vs noTransaksi**: Some transactions use `id`, others use `noTransaksi`
2. **Date Formats**: Always use ISO format for dates
3. **HPP Calculation**: Some items may not have HPP value
4. **Modal Cleanup**: Always remove modal from DOM after closing
5. **Filter State**: Remember to reset filters when needed

## File Structure

```
js/
  hapusTransaksi.js          # Main implementation (1500+ lines)

__tests__/
  hapusTransaksi.test.js              # Unit tests
  hapusTransaksi.integration.test.js  # Integration tests

Documentation/
  PANDUAN_HAPUS_TRANSAKSI_POS.md      # User guide
  TECHNICAL_DOC_HAPUS_TRANSAKSI.md    # Technical docs
  QUICK_REFERENCE_HAPUS_TRANSAKSI.md  # This file
```

## Related Features

- **POS Module**: Source of transactions
- **Inventory Module**: Stock management
- **Accounting Module**: Journal entries
- **Shift Management**: Closed shift validation
- **User Management**: Authorization

## Useful Links

- [Bootstrap 5 Modal Docs](https://getbootstrap.com/docs/5.0/components/modal/)
- [localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [Jest Testing](https://jestjs.io/docs/getting-started)
- [fast-check PBT](https://github.com/dubzzz/fast-check)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Nov 2024 | Initial release |

---

**Quick Help**: For detailed information, see the full documentation files listed above.
