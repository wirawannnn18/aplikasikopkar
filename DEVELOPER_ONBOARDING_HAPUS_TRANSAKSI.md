# Developer Onboarding Guide - Hapus Transaksi POS

Welcome to the Hapus Transaksi POS feature! This guide will help you get up to speed quickly.

---

## 🎯 Quick Overview

**What is this feature?**  
A transaction deletion system that maintains data integrity by automatically:
- Restoring inventory stock
- Creating accounting journal reversals
- Logging all deletions for audit

**Who uses it?**  
Administrators and cashiers who need to delete incorrect or cancelled transactions.

---

## 📚 Start Here

### 1. Read the Documentation (30 minutes)

**First, read these in order:**

1. **[README_HAPUS_TRANSAKSI.md](README_HAPUS_TRANSAKSI.md)** (5 min)
   - Feature overview and capabilities
   - Quick start guide

2. **[TECHNICAL_DOC_HAPUS_TRANSAKSI.md](TECHNICAL_DOC_HAPUS_TRANSAKSI.md)** (15 min)
   - Architecture and design
   - API documentation
   - Data models

3. **[PANDUAN_HAPUS_TRANSAKSI_POS.md](PANDUAN_HAPUS_TRANSAKSI_POS.md)** (10 min)
   - User perspective
   - How the feature works from UI

### 2. Explore the Code (45 minutes)

**Main file:** `js/hapusTransaksi.js` (~1,665 lines)

**Read in this order:**

#### Step 1: Repository Layer (10 min)
Start at line 1, read through:
- `TransactionRepository` - Transaction CRUD operations
- `StockRepository` - Inventory operations
- `JournalRepository` - Accounting operations
- `DeletionLogRepository` - Audit log operations

**Key concept:** Repositories handle all data access to localStorage.

#### Step 2: Service Layer (15 min)
Continue reading:
- `ValidationService` - Validates deletions (closed shift, reason)
- `StockRestorationService` - Restores stock when deleting
- `JournalReversalService` - Creates reversal journals
- `AuditLoggerService` - Logs deletions
- `TransactionDeletionService` - Orchestrates everything

**Key concept:** Services contain business logic and orchestrate operations.

#### Step 3: UI Layer (20 min)
Read the UI functions:
- `renderHapusTransaksi()` - Main page
- `renderFilterPanel()` - Filter controls
- `renderTransactionTable()` - Transaction list
- `showDeleteConfirmation()` - Confirmation dialog
- `handleDeleteTransaction()` - Deletion flow
- `renderRiwayatHapusTransaksi()` - History page

**Key concept:** UI functions handle presentation and user interaction.

### 3. Run the Tests (15 minutes)

```bash
# Run unit tests
npm test -- hapusTransaksi.test.js

# Run integration tests
npm test -- hapusTransaksi.integration.test.js
```

**What to observe:**
- 70 unit tests covering all properties
- 12 integration tests covering end-to-end flows
- Property-based tests with random data generation

### 4. Try the Feature (30 minutes)

1. **Start the application**
   ```bash
   npm start
   ```

2. **Login as admin or kasir**

3. **Navigate to "Hapus Transaksi"**

4. **Try these scenarios:**
   - Search for a transaction
   - Filter by payment method
   - Filter by date range
   - Delete a transaction (with reason)
   - Cancel a deletion
   - View deletion history
   - Try to delete a transaction in closed shift (should fail)

---

## 🏗️ Architecture Deep Dive

### Layered Architecture

```
UI Layer (Presentation)
    ↓ calls
Service Layer (Business Logic)
    ↓ uses
Repository Layer (Data Access)
    ↓ reads/writes
Data Layer (localStorage)
```

### Data Flow: Deleting a Transaction

```
1. User clicks "Hapus" button
   ↓
2. handleDeleteTransaction() validates transaction
   ↓
3. showDeleteConfirmation() displays dialog
   ↓
4. User enters reason and confirms
   ↓
5. confirmDeletion() calls TransactionDeletionService
   ↓
6. TransactionDeletionService orchestrates:
   - ValidationService.validateDeletion()
   - ValidationService.validateReason()
   - StockRestorationService.restoreStock()
   - JournalReversalService.createReversalJournals()
   - TransactionRepository.delete()
   - AuditLoggerService.logDeletion()
   ↓
7. UI shows success/error notification
   ↓
8. Transaction list refreshes
```

### Key Design Patterns

1. **Repository Pattern**
   - Abstracts data access
   - All localStorage operations in repositories
   - Easy to swap storage mechanism

2. **Service Layer Pattern**
   - Business logic separated from UI
   - Services are reusable and testable
   - Clear separation of concerns

3. **Orchestration Pattern**
   - `TransactionDeletionService` orchestrates multiple services
   - Single entry point for complex operations
   - Easier to maintain and test

---

## 🔑 Key Concepts

### 1. Closed Shift Validation

**Why?** Transactions in closed shifts are part of finalized reports and shouldn't be modified.

**How it works:**
```javascript
// Check if transaction date falls within any closed shift
const riwayatTutupKas = localStorage.getItem('riwayatTutupKas');
for (const shift of riwayatTutupKas) {
    if (transactionDate >= shift.waktuBuka && 
        transactionDate <= shift.waktuTutup) {
        return true; // Transaction is in closed shift
    }
}
```

### 2. Stock Restoration

**Why?** When a sale is deleted, the items should go back to inventory.

**How it works:**
```javascript
// For each item in transaction
for (const item of transaction.items) {
    // Add quantity back to stock
    stockRepo.addStock(item.id, item.qty);
}
```

**Edge case:** If item doesn't exist in inventory, log warning but continue.

### 3. Journal Reversal

**Why?** Accounting entries must be reversed to maintain accurate financial reports.

**How it works:**

**For Cash Transactions:**
```
Original Sale:
  Debit:  Kas (1-1000)                 Rp 100,000
  Credit: Pendapatan Penjualan (4-1000) Rp 100,000

Reversal:
  Debit:  Pendapatan Penjualan (4-1000) Rp 100,000
  Credit: Kas (1-1000)                 Rp 100,000
```

**For Credit Transactions:**
```
Original Sale:
  Debit:  Piutang Anggota (1-1200)     Rp 100,000
  Credit: Pendapatan Penjualan (4-1000) Rp 100,000

Reversal:
  Debit:  Pendapatan Penjualan (4-1000) Rp 100,000
  Credit: Piutang Anggota (1-1200)     Rp 100,000
```

**Important:** Reversal journals use the deletion date, not the original transaction date.

### 4. Audit Logging

**Why?** Track who deleted what and why for accountability.

**What's logged:**
- Complete transaction data (before deletion)
- User who deleted
- Deletion timestamp
- Deletion reason
- Stock restoration status
- Journal reversal status
- Any warnings

**Important:** Logs are immutable - they cannot be deleted or modified.

---

## 🧪 Testing Strategy

### Unit Tests

**Location:** `__tests__/hapusTransaksi.test.js`

**What's tested:**
- Repository filter operations
- Validation logic
- Stock restoration
- Journal reversal
- Audit logging
- UI components

**How to add a test:**
```javascript
describe('Property X: Description', () => {
    test('should do something', () => {
        // Arrange
        const input = createTestData();
        
        // Act
        const result = functionUnderTest(input);
        
        // Assert
        expect(result).toBe(expectedValue);
    });
});
```

### Property-Based Tests

**What are they?** Tests that run with randomly generated data to find edge cases.

**Example:**
```javascript
fc.assert(
    fc.property(
        fc.array(transactionGenerator), // Generate random transactions
        fc.string(),                     // Generate random search query
        (transactions, searchQuery) => {
            // Test that filter works for ANY input
            const filtered = repo.filter({ search: searchQuery });
            // All results should match the query
            return filtered.every(t => 
                t.noTransaksi.includes(searchQuery) ||
                t.kasir.includes(searchQuery)
            );
        }
    )
);
```

### Integration Tests

**Location:** `__tests__/hapusTransaksi.integration.test.js`

**What's tested:**
- Complete deletion flow end-to-end
- Closed shift prevention
- Error scenarios

**When to add integration tests:**
- When adding new multi-step workflows
- When modifying the orchestration logic
- When adding new validation rules

---

## 🛠️ Common Tasks

### Adding a New Filter

1. **Update the filter model:**
   ```javascript
   let currentFilters = {
       search: '',
       metode: 'all',
       startDate: '',
       endDate: '',
       newFilter: '' // Add your filter
   };
   ```

2. **Update renderFilterPanel():**
   ```javascript
   // Add new filter input
   <select id="newFilter">
       <option value="all">All</option>
       <option value="option1">Option 1</option>
   </select>
   ```

3. **Update handleFilterChange():**
   ```javascript
   currentFilters.newFilter = document.getElementById('newFilter').value;
   ```

4. **Update TransactionRepository.filter():**
   ```javascript
   if (filters.newFilter && filters.newFilter !== 'all') {
       transactions = transactions.filter(t => 
           t.someField === filters.newFilter
       );
   }
   ```

5. **Add tests:**
   ```javascript
   test('should filter by new filter', () => {
       const filtered = repo.filter({ newFilter: 'option1' });
       expect(filtered.every(t => t.someField === 'option1')).toBe(true);
   });
   ```

### Adding a New Validation Rule

1. **Update ValidationService.validateDeletion():**
   ```javascript
   validateDeletion(transactionId) {
       // Existing validations...
       
       // Add new validation
       if (someCondition) {
           return {
               valid: false,
               message: 'Error message'
           };
       }
       
       return { valid: true, message: 'Valid' };
   }
   ```

2. **Add tests:**
   ```javascript
   test('should reject when new condition fails', () => {
       const result = validationService.validateDeletion(transactionId);
       expect(result.valid).toBe(false);
       expect(result.message).toContain('Error message');
   });
   ```

### Adding a New Field to Deletion Log

1. **Update AuditLoggerService.logDeletion():**
   ```javascript
   logDeletion(transaction, reason, deletedBy) {
       const logData = {
           // Existing fields...
           newField: someValue // Add new field
       };
       
       return this.deletionLogRepo.save(logData);
   }
   ```

2. **Update showDeletionDetail():**
   ```javascript
   // Add display for new field
   <tr>
       <td><strong>New Field:</strong></td>
       <td>${log.newField}</td>
   </tr>
   ```

3. **Update tests:**
   ```javascript
   test('should include new field in log', () => {
       const result = auditLogger.logDeletion(transaction, reason, user);
       const log = deletionLogRepo.getAll()[0];
       expect(log.newField).toBeDefined();
   });
   ```

---

## 🐛 Debugging Tips

### Common Issues

#### Issue: Filter not working
**Check:**
1. Is `handleFilterChange()` being called?
2. Is `currentFilters` being updated?
3. Is `applyFilters()` being called?
4. Check browser console for errors

**Debug:**
```javascript
function handleFilterChange() {
    console.log('Filter changed');
    currentFilters.search = document.getElementById('searchInput').value;
    console.log('Current filters:', currentFilters);
    applyFilters();
}
```

#### Issue: Transaction not being deleted
**Check:**
1. Is validation passing?
2. Is the transaction ID correct?
3. Is localStorage being updated?
4. Check browser console for errors

**Debug:**
```javascript
deleteTransaction(transactionId, reason, deletedBy) {
    console.log('Deleting transaction:', transactionId);
    
    const validationResult = this.validationService.validateDeletion(transactionId);
    console.log('Validation result:', validationResult);
    
    if (!validationResult.valid) {
        console.log('Validation failed:', validationResult.message);
        return { success: false, message: validationResult.message };
    }
    
    // Continue...
}
```

#### Issue: Stock not being restored
**Check:**
1. Are items in the transaction?
2. Do items exist in inventory?
3. Is `StockRepository.addStock()` being called?
4. Check localStorage 'barang' key

**Debug:**
```javascript
restoreStock(items) {
    console.log('Restoring stock for items:', items);
    
    for (const item of items) {
        console.log('Restoring item:', item.id, 'qty:', item.qty);
        const restored = this.stockRepo.addStock(item.id, item.qty);
        console.log('Restored:', restored);
    }
}
```

### Debugging Tools

1. **Browser DevTools Console**
   - Check for JavaScript errors
   - Use console.log for debugging
   - Inspect network requests

2. **localStorage Inspector**
   - Open DevTools → Application → Local Storage
   - Check 'penjualan', 'barang', 'jurnal', 'deletionLog'
   - Verify data is being saved correctly

3. **Bootstrap Modal Inspector**
   - Check if modal is in DOM
   - Check modal classes (show, fade)
   - Check z-index and backdrop

---

## 📖 Code Style Guide

### Naming Conventions

**Classes:** PascalCase
```javascript
class TransactionRepository { }
```

**Functions:** camelCase
```javascript
function renderHapusTransaksi() { }
```

**Variables:** camelCase
```javascript
const currentFilters = { };
```

**Constants:** UPPER_SNAKE_CASE (if truly constant)
```javascript
const MAX_REASON_LENGTH = 500;
```

**Private methods:** Prefix with underscore
```javascript
_isTransactionInClosedShift(transaction) { }
```

### JSDoc Comments

**Always include:**
- Description
- Parameters with types
- Return value with type
- Examples (for complex functions)

**Example:**
```javascript
/**
 * Filter transactions based on criteria
 * 
 * @param {Object} filters - Filter criteria
 * @param {string} filters.search - Search query
 * @param {string} filters.metode - Payment method
 * @returns {Array<Object>} Filtered transactions
 * 
 * @example
 * const filtered = repo.filter({ search: 'TRX-001' });
 */
filter(filters) {
    // Implementation
}
```

### Error Handling

**Always use try-catch for critical operations:**
```javascript
try {
    // Critical operation
    const result = performOperation();
    return { success: true, data: result };
} catch (error) {
    console.error('Error in performOperation:', error);
    return { 
        success: false, 
        message: `Error: ${error.message}` 
    };
}
```

---

## 🚀 Deployment Checklist

Before deploying changes:

- [ ] All tests passing
- [ ] JSDoc comments added/updated
- [ ] User documentation updated
- [ ] Technical documentation updated
- [ ] No console.log statements
- [ ] No TODO/FIXME comments
- [ ] Code reviewed
- [ ] Manual testing completed
- [ ] Integration testing completed
- [ ] Performance tested
- [ ] Security reviewed

---

## 📞 Getting Help

### Resources

1. **Documentation**
   - README_HAPUS_TRANSAKSI.md
   - TECHNICAL_DOC_HAPUS_TRANSAKSI.md
   - PANDUAN_HAPUS_TRANSAKSI_POS.md

2. **Code**
   - js/hapusTransaksi.js (with JSDoc)
   - __tests__/hapusTransaksi.test.js

3. **Team**
   - Email: dev@koperasi.com
   - Slack: #dev-koperasi

### Questions to Ask

**Before asking:**
1. Have you read the documentation?
2. Have you checked the code comments?
3. Have you looked at the tests?
4. Have you tried debugging?

**When asking:**
1. What are you trying to do?
2. What have you tried?
3. What error are you getting?
4. Can you provide code snippets?

---

## 🎓 Learning Path

### Week 1: Understanding
- [ ] Read all documentation
- [ ] Explore the code
- [ ] Run and understand tests
- [ ] Try the feature as a user

### Week 2: Contributing
- [ ] Fix a small bug
- [ ] Add a test
- [ ] Update documentation
- [ ] Code review others' work

### Week 3: Mastery
- [ ] Add a new feature
- [ ] Refactor existing code
- [ ] Optimize performance
- [ ] Mentor new developers

---

## ✨ Best Practices

### Do's ✅
- Write tests before code (TDD)
- Keep functions small and focused
- Use meaningful variable names
- Add JSDoc comments
- Handle errors gracefully
- Validate input early
- Log important operations
- Update documentation

### Don'ts ❌
- Don't use console.log in production
- Don't ignore errors
- Don't skip tests
- Don't hardcode values
- Don't create god classes
- Don't repeat yourself (DRY)
- Don't commit commented code
- Don't skip code review

---

## 🎯 Success Criteria

You're ready to work on this feature when you can:

- [ ] Explain the architecture in your own words
- [ ] Navigate the codebase confidently
- [ ] Run and understand all tests
- [ ] Debug common issues
- [ ] Add a new filter or validation rule
- [ ] Write tests for new code
- [ ] Update documentation

---

**Welcome to the team! Happy coding! 🚀**

---

**Document Version**: 1.0.0  
**Last Updated**: November 2024  
**Maintained by**: Development Team
