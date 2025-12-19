# Shared Services API Documentation

## Overview
This document provides comprehensive API documentation for the SharedPaymentServices class and related integration components used in the unified payment interface.

## Table of Contents
1. [SharedPaymentServices API](#sharedpaymentservices-api)
2. [EnhancedAuditLogger API](#enhancedauditlogger-api)
3. [UnifiedTransactionModel API](#unifiedtransactionmodel-api)
4. [DataConsistencyValidator API](#dataconsistencyvalidator-api)
5. [Integration Controller API](#integration-controller-api)
6. [Error Handling](#error-handling)
7. [Usage Examples](#usage-examples)

## SharedPaymentServices API

### Class: SharedPaymentServices

The main service class that provides unified payment processing functionality for both manual and import batch modes.

#### Constructor
```javascript
new SharedPaymentServices(options = {})
```

**Parameters:**
- `options` (Object): Configuration options
  - `auditLogger` (EnhancedAuditLogger): Custom audit logger instance
  - `validator` (DataConsistencyValidator): Custom validator instance
  - `database` (Database): Database connection instance

**Example:**
```javascript
const sharedServices = new SharedPaymentServices({
    auditLogger: new EnhancedAuditLogger(),
    validator: new DataConsistencyValidator()
});
```

### Payment Processing Methods

#### processPayment(paymentData, mode)
Process a single payment transaction.

**Parameters:**
- `paymentData` (Object): Payment transaction data
  - `anggotaId` (string): Member ID
  - `anggotaNama` (string): Member name
  - `jenisPembayaran` (string): Payment type ('hutang' or 'piutang')
  - `jumlah` (number): Payment amount
  - `keterangan` (string, optional): Payment description
  - `kasir` (string): Cashier ID
- `mode` (string): Payment mode ('manual' or 'import')

**Returns:** `Promise<Object>`
- `success` (boolean): Operation success status
- `transaction` (Object): Created transaction object
- `jurnalEntry` (Object): Created journal entry
- `saldoUpdate` (Object): Saldo update information

**Throws:**
- `ValidationError`: Invalid payment data
- `InsufficientBalanceError`: Insufficient balance for payment
- `DatabaseError`: Database operation failed

**Example:**
```javascript
try {
    const result = await sharedServices.processPayment({
        anggotaId: 'A001',
        anggotaNama: 'John Doe',
        jenisPembayaran: 'hutang',
        jumlah: 500000,
        keterangan: 'Monthly payment',
        kasir: 'kasir001'
    }, 'manual');
    
    console.log('Payment processed:', result.transaction.id);
} catch (error) {
    console.error('Payment failed:', error.message);
}
```

#### processBatchPayments(batchData, mode)
Process multiple payments in a batch.

**Parameters:**
- `batchData` (Array): Array of payment data objects
- `mode` (string): Payment mode (typically 'import')

**Returns:** `Promise<Object>`
- `batchId` (string): Unique batch identifier
- `total` (number): Total number of payments in batch
- `successful` (number): Number of successful payments
- `failed` (number): Number of failed payments
- `transactions` (Array): Array of successful transaction objects
- `errors` (Array): Array of error objects for failed payments

**Example:**
```javascript
const batchData = [
    {
        anggotaId: 'A001',
        anggotaNama: 'John Doe',
        jenisPembayaran: 'hutang',
        jumlah: 500000,
        kasir: 'kasir001'
    },
    {
        anggotaId: 'A002',
        anggotaNama: 'Jane Smith',
        jenisPembayaran: 'piutang',
        jumlah: 300000,
        kasir: 'kasir001'
    }
];

const result = await sharedServices.processBatchPayments(batchData, 'import');
console.log(`Batch processed: ${result.successful}/${result.total} successful`);
```

### Journal Management Methods

#### createJurnalEntry(transactionData)
Create a journal entry for a transaction.

**Parameters:**
- `transactionData` (Object): Transaction data

**Returns:** `Promise<Object>`
- `id` (string): Journal entry ID
- `debit` (Object): Debit account and amount
- `credit` (Object): Credit account and amount
- `tanggal` (Date): Entry date
- `keterangan` (string): Entry description

**Example:**
```javascript
const jurnalEntry = await sharedServices.createJurnalEntry({
    anggotaId: 'A001',
    jenisPembayaran: 'hutang',
    jumlah: 500000,
    keterangan: 'Payment from member'
});
```

#### updateJurnalEntry(jurnalId, updates)
Update an existing journal entry.

**Parameters:**
- `jurnalId` (string): Journal entry ID
- `updates` (Object): Fields to update

**Returns:** `Promise<Object>` - Updated journal entry

#### reverseJurnalEntry(jurnalId)
Create a reversal entry for a journal entry.

**Parameters:**
- `jurnalId` (string): Original journal entry ID

**Returns:** `Promise<Object>` - Reversal journal entry

### Saldo Management Methods

#### updateSaldoHutang(anggotaId, amount, operation)
Update member's debt balance.

**Parameters:**
- `anggotaId` (string): Member ID
- `amount` (number): Amount to add or subtract
- `operation` (string): 'add' or 'subtract'

**Returns:** `Promise<Object>`
- `anggotaId` (string): Member ID
- `saldoSebelum` (number): Balance before update
- `saldoSesudah` (number): Balance after update
- `perubahan` (number): Change amount (positive for add, negative for subtract)

**Example:**
```javascript
const saldoUpdate = await sharedServices.updateSaldoHutang('A001', 500000, 'subtract');
console.log(`Saldo updated: ${saldoUpdate.saldoSebelum} -> ${saldoUpdate.saldoSesudah}`);
```

#### updateSaldoPiutang(anggotaId, amount, operation)
Update member's receivable balance.

**Parameters:** Same as `updateSaldoHutang`
**Returns:** Same as `updateSaldoHutang`

#### getSaldoSummary(anggotaId)
Get complete balance summary for a member.

**Parameters:**
- `anggotaId` (string): Member ID

**Returns:** `Promise<Object>`
- `anggotaId` (string): Member ID
- `anggotaNama` (string): Member name
- `saldoHutang` (number): Current debt balance
- `saldoPiutang` (number): Current receivable balance
- `lastUpdate` (Date): Last balance update timestamp

### Validation Methods

#### validatePaymentAmount(amount, saldo, jenis)
Validate payment amount against available balance.

**Parameters:**
- `amount` (number): Payment amount
- `saldo` (number): Current balance
- `jenis` (string): Payment type ('hutang' or 'piutang')

**Returns:** `Promise<boolean>` - Validation result

**Throws:**
- `ValidationError`: Invalid amount or insufficient balance

#### validateAnggotaExists(anggotaId)
Validate that a member exists and is active.

**Parameters:**
- `anggotaId` (string): Member ID

**Returns:** `Promise<Object>` - Member data if exists

**Throws:**
- `ValidationError`: Member not found or inactive

#### validateSaldoConsistency()
Validate consistency of all member balances.

**Returns:** `Promise<Object>`
- `consistent` (boolean): Overall consistency status
- `issues` (Array): Array of consistency issues found
- `totalMembers` (number): Total members checked
- `issueCount` (number): Number of members with issues

### Transaction History Methods

#### getUnifiedTransactionHistory(filters)
Get unified transaction history from both manual and import modes.

**Parameters:**
- `filters` (Object): Filter criteria
  - `mode` (string, optional): 'manual', 'import', or 'all'
  - `dateFrom` (Date, optional): Start date
  - `dateTo` (Date, optional): End date
  - `anggotaId` (string, optional): Member ID filter
  - `jenis` (string, optional): Payment type filter
  - `kasir` (string, optional): Cashier filter
  - `limit` (number, optional): Maximum results (default: 50)
  - `offset` (number, optional): Results offset (default: 0)

**Returns:** `Promise<Object>`
- `transactions` (Array): Array of transaction objects
- `total` (number): Total matching transactions
- `hasMore` (boolean): Whether more results are available

**Example:**
```javascript
const history = await sharedServices.getUnifiedTransactionHistory({
    mode: 'all',
    dateFrom: new Date('2024-01-01'),
    dateTo: new Date('2024-12-31'),
    limit: 100
});

console.log(`Found ${history.total} transactions`);
history.transactions.forEach(txn => {
    console.log(`${txn.tanggal}: ${txn.anggotaNama} - ${txn.jumlah} (${txn.mode})`);
});
```

#### exportTransactionHistory(filters, format)
Export transaction history in specified format.

**Parameters:**
- `filters` (Object): Same as `getUnifiedTransactionHistory`
- `format` (string): Export format ('csv' or 'excel')

**Returns:** `Promise<Object>`
- `data` (string|Buffer): Exported data
- `filename` (string): Suggested filename
- `mimeType` (string): MIME type for download

### Audit and Logging Methods

#### logTransaction(transactionData, mode)
Log a transaction for audit trail.

**Parameters:**
- `transactionData` (Object): Transaction data
- `mode` (string): Payment mode

**Returns:** `Promise<void>`

#### logError(error, context, mode)
Log an error with context information.

**Parameters:**
- `error` (Error): Error object
- `context` (Object): Additional context data
- `mode` (string): Payment mode

**Returns:** `Promise<void>`

#### getAuditTrail(filters)
Get audit trail entries.

**Parameters:**
- `filters` (Object): Filter criteria
  - `action` (string, optional): Action type filter
  - `mode` (string, optional): Mode filter
  - `userId` (string, optional): User ID filter
  - `dateFrom` (Date, optional): Start date
  - `dateTo` (Date, optional): End date

**Returns:** `Promise<Array>` - Array of audit log entries

## EnhancedAuditLogger API

### Class: EnhancedAuditLogger

Enhanced audit logging with mode tracking and security features.

#### logTransaction(transaction, mode)
Log a transaction with enhanced audit information.

**Parameters:**
- `transaction` (Object): Transaction data
- `mode` (string): Payment mode

**Returns:** `Promise<string>` - Audit log entry ID

#### logBatchCompletion(batchResult, mode)
Log completion of a batch operation.

**Parameters:**
- `batchResult` (Object): Batch processing result
- `mode` (string): Payment mode

**Returns:** `Promise<string>` - Audit log entry ID

#### logTabSwitch(fromTab, toTab, userId)
Log tab switching activity.

**Parameters:**
- `fromTab` (string): Source tab name
- `toTab` (string): Target tab name
- `userId` (string): User ID

**Returns:** `Promise<string>` - Audit log entry ID

#### logPermissionDenial(userId, attemptedAction, resource)
Log permission denial events.

**Parameters:**
- `userId` (string): User ID
- `attemptedAction` (string): Action that was denied
- `resource` (string): Resource that was accessed

**Returns:** `Promise<string>` - Audit log entry ID

## UnifiedTransactionModel API

### Class: UnifiedTransactionModel

Unified data model for transactions across both payment modes.

#### create(transactionData)
Create a new transaction record.

**Parameters:**
- `transactionData` (Object): Transaction data

**Returns:** `Promise<Object>` - Created transaction with generated ID

#### update(transactionId, updates)
Update an existing transaction.

**Parameters:**
- `transactionId` (string): Transaction ID
- `updates` (Object): Fields to update

**Returns:** `Promise<Object>` - Updated transaction

#### findById(transactionId)
Find a transaction by ID.

**Parameters:**
- `transactionId` (string): Transaction ID

**Returns:** `Promise<Object|null>` - Transaction object or null if not found

#### findByBatchId(batchId)
Find all transactions in a batch.

**Parameters:**
- `batchId` (string): Batch ID

**Returns:** `Promise<Array>` - Array of transactions in the batch

#### search(criteria)
Search transactions by criteria.

**Parameters:**
- `criteria` (Object): Search criteria

**Returns:** `Promise<Array>` - Array of matching transactions

## DataConsistencyValidator API

### Class: DataConsistencyValidator

Validates data consistency across payment modes.

#### validateTransaction(transaction)
Validate a single transaction for consistency.

**Parameters:**
- `transaction` (Object): Transaction to validate

**Returns:** `Promise<Object>`
- `valid` (boolean): Validation result
- `errors` (Array): Array of validation errors
- `warnings` (Array): Array of validation warnings

#### validateBatch(transactions)
Validate a batch of transactions.

**Parameters:**
- `transactions` (Array): Array of transactions to validate

**Returns:** `Promise<Object>`
- `valid` (boolean): Overall validation result
- `validCount` (number): Number of valid transactions
- `invalidCount` (number): Number of invalid transactions
- `errors` (Array): Array of validation errors per transaction

#### validateSaldoConsistency(anggotaId)
Validate saldo consistency for a member.

**Parameters:**
- `anggotaId` (string): Member ID

**Returns:** `Promise<Object>`
- `consistent` (boolean): Consistency status
- `calculatedSaldo` (number): Calculated balance from transactions
- `recordedSaldo` (number): Recorded balance in database
- `difference` (number): Difference between calculated and recorded

## Integration Controller API

### Class: PembayaranHutangPiutangIntegrated

Main integration controller that manages the unified interface.

#### switchTab(tabName)
Switch to a different tab with unsaved data handling.

**Parameters:**
- `tabName` (string): Target tab name ('manual' or 'import')

**Returns:** `Promise<boolean>` - Success status

#### saveTabState(tabName)
Save current tab state to localStorage.

**Parameters:**
- `tabName` (string): Tab name to save state for

**Returns:** `void`

#### restoreTabState(tabName)
Restore tab state from localStorage.

**Parameters:**
- `tabName` (string): Tab name to restore state for

**Returns:** `Object|null` - Restored state or null if not found

#### hasUnsavedData()
Check if current tab has unsaved data.

**Returns:** `boolean` - True if unsaved data exists

#### onTransactionComplete(result)
Handle transaction completion callback.

**Parameters:**
- `result` (Object): Transaction result

**Returns:** `void`

## Error Handling

### Error Types

#### ValidationError
Thrown when data validation fails.

```javascript
class ValidationError extends Error {
    constructor(message, errors = []) {
        super(message);
        this.name = 'ValidationError';
        this.errors = errors;
    }
}
```

#### InsufficientBalanceError
Thrown when payment amount exceeds available balance.

```javascript
class InsufficientBalanceError extends Error {
    constructor(available, requested) {
        super(`Insufficient balance: ${available} available, ${requested} requested`);
        this.name = 'InsufficientBalanceError';
        this.available = available;
        this.requested = requested;
    }
}
```

#### DatabaseError
Thrown when database operations fail.

```javascript
class DatabaseError extends Error {
    constructor(message, originalError) {
        super(message);
        this.name = 'DatabaseError';
        this.originalError = originalError;
    }
}
```

### Error Handling Best Practices

```javascript
try {
    const result = await sharedServices.processPayment(paymentData, 'manual');
    // Handle success
} catch (error) {
    if (error instanceof ValidationError) {
        // Handle validation errors
        console.error('Validation failed:', error.errors);
    } else if (error instanceof InsufficientBalanceError) {
        // Handle insufficient balance
        console.error(`Insufficient balance: ${error.available} available`);
    } else if (error instanceof DatabaseError) {
        // Handle database errors
        console.error('Database error:', error.originalError);
    } else {
        // Handle unexpected errors
        console.error('Unexpected error:', error);
    }
}
```

## Usage Examples

### Complete Payment Processing Example

```javascript
// Initialize services
const sharedServices = new SharedPaymentServices();
const integrationController = new PembayaranHutangPiutangIntegrated();

// Process a manual payment
async function processManualPayment() {
    try {
        // Validate member exists
        const member = await sharedServices.validateAnggotaExists('A001');
        
        // Get current balance
        const saldoSummary = await sharedServices.getSaldoSummary('A001');
        
        // Prepare payment data
        const paymentData = {
            anggotaId: 'A001',
            anggotaNama: member.nama,
            jenisPembayaran: 'hutang',
            jumlah: 500000,
            keterangan: 'Monthly installment',
            kasir: 'kasir001'
        };
        
        // Validate payment amount
        await sharedServices.validatePaymentAmount(
            paymentData.jumlah,
            saldoSummary.saldoHutang,
            paymentData.jenisPembayaran
        );
        
        // Process payment
        const result = await sharedServices.processPayment(paymentData, 'manual');
        
        // Update UI
        integrationController.onTransactionComplete(result);
        
        console.log('Payment processed successfully:', result.transaction.id);
        
    } catch (error) {
        console.error('Payment processing failed:', error.message);
        throw error;
    }
}

// Process batch import
async function processBatchImport(csvData) {
    try {
        // Parse CSV data
        const batchData = parseCsvData(csvData);
        
        // Validate batch
        const validation = await sharedServices.validator.validateBatch(batchData);
        if (!validation.valid) {
            throw new ValidationError('Batch validation failed', validation.errors);
        }
        
        // Process batch
        const result = await sharedServices.processBatchPayments(batchData, 'import');
        
        // Update UI
        integrationController.onBatchComplete(result);
        
        console.log(`Batch processed: ${result.successful}/${result.total} successful`);
        
        return result;
        
    } catch (error) {
        console.error('Batch processing failed:', error.message);
        throw error;
    }
}

// Get unified transaction history
async function getTransactionHistory() {
    try {
        const history = await sharedServices.getUnifiedTransactionHistory({
            mode: 'all',
            dateFrom: new Date('2024-01-01'),
            limit: 100
        });
        
        return history.transactions;
        
    } catch (error) {
        console.error('Failed to get transaction history:', error.message);
        throw error;
    }
}
```

### Tab Management Example

```javascript
// Initialize integration controller
const controller = new PembayaranHutangPiutangIntegrated();

// Handle tab switching with unsaved data
async function switchToImportTab() {
    try {
        // Check for unsaved data
        if (controller.hasUnsavedData()) {
            const userChoice = await controller.showUnsavedDataDialog();
            
            if (userChoice === 'cancel') {
                return false; // User cancelled
            }
        }
        
        // Switch to import tab
        await controller.switchTab('import');
        
        console.log('Switched to import tab');
        return true;
        
    } catch (error) {
        console.error('Tab switch failed:', error.message);
        return false;
    }
}

// Save and restore tab state
function saveCurrentState() {
    const currentTab = controller.activeTab;
    controller.saveTabState(currentTab);
    console.log(`State saved for ${currentTab} tab`);
}

function restoreTabState(tabName) {
    const state = controller.restoreTabState(tabName);
    if (state) {
        console.log(`State restored for ${tabName} tab`);
        return state;
    } else {
        console.log(`No saved state found for ${tabName} tab`);
        return null;
    }
}
```

---

**API Version**: 1.0  
**Last Updated**: December 2024  
**Compatibility**: Integration v1.0+