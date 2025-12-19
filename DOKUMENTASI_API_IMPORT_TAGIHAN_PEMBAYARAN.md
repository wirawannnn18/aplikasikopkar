# API Documentation - Import Tagihan Pembayaran

## Overview

This document provides comprehensive API documentation for the Import Tagihan Pembayaran module. The module provides a complete workflow for importing payment data in bulk via CSV/Excel files.

## Architecture

### Module Structure
```
js/import-tagihan/
├── ImportTagihanManager.js      # Main orchestrator
├── FileParser.js                # File parsing (CSV/Excel)
├── ValidationEngine.js          # Data validation
├── PreviewGenerator.js          # Preview generation
├── BatchProcessor.js            # Batch processing
├── AuditLogger.js              # Audit logging
├── ReportGenerator.js          # Report generation
├── ErrorHandler.js             # Error handling
├── RollbackManager.js          # Rollback operations
├── ConfigurationInterface.js   # Admin configuration
├── ImportUploadInterface.js    # Upload UI
├── PreviewConfirmationInterface.js # Preview UI
├── ProgressResultsInterface.js # Progress/Results UI
├── PaymentSystemIntegration.js # Payment system integration
├── AccountingIntegration.js    # Accounting integration
├── PerformanceOptimizer.js     # Performance optimization
├── SecurityValidator.js        # Security validation
├── interfaces.js               # Type definitions
└── index.js                    # Module entry point
```

## Core APIs

### 1. ImportTagihanManager

Main orchestrator class that coordinates the entire import workflow.

#### Constructor
```javascript
new ImportTagihanManager(paymentEngine, auditLogger)
```

**Parameters:**
- `paymentEngine` (Object): Payment processing engine
- `auditLogger` (AuditLogger): Audit logging instance

#### Methods

##### uploadFile(file)
Uploads and performs initial validation of import file.

```javascript
async uploadFile(file)
```

**Parameters:**
- `file` (File): File object from HTML input

**Returns:**
```javascript
{
    batchId: string,
    fileName: string,
    fileSize: number,
    totalRows: number,
    status: 'uploaded',
    uploadedAt: Date,
    rawData: Array<Object>
}
```

**Throws:**
- `FileFormatError`: Invalid file format
- `FileSizeError`: File too large
- `FileParsingError`: Cannot parse file

##### validateData(rawData)
Validates import data against business rules.

```javascript
async validateData(rawData)
```

**Parameters:**
- `rawData` (Array): Raw data from file parsing

**Returns:**
```javascript
{
    batchId: string,
    validRows: Array<ImportRow>,
    invalidRows: Array<ImportRow>,
    validationSummary: {
        totalRows: number,
        validCount: number,
        invalidCount: number,
        errors: Array<ValidationError>
    }
}
```

##### generatePreview(validatedData)
Generates preview data for user confirmation.

```javascript
async generatePreview(validatedData)
```

**Parameters:**
- `validatedData` (Object): Validated data from validateData()

**Returns:**
```javascript
{
    previewTable: Array<PreviewRow>,
    summary: {
        totalTransactions: number,
        totalAmount: number,
        totalHutang: number,
        totalPiutang: number,
        validCount: number,
        invalidCount: number
    },
    errors: Array<ValidationError>
}
```

##### processBatch(confirmedData)
Processes confirmed batch of payments.

```javascript
async processBatch(confirmedData)
```

**Parameters:**
- `confirmedData` (Object): Confirmed data from preview

**Returns:**
```javascript
{
    batchId: string,
    results: {
        totalProcessed: number,
        successCount: number,
        failureCount: number,
        successTransactions: Array<Transaction>,
        failedTransactions: Array<FailedTransaction>
    },
    processedAt: Date
}
```

##### generateReport(results)
Generates final report of import results.

```javascript
async generateReport(results)
```

**Parameters:**
- `results` (Object): Results from processBatch()

**Returns:**
```javascript
{
    reportId: string,
    summary: ImportSummary,
    successDetails: Array<SuccessDetail>,
    failureDetails: Array<FailureDetail>,
    downloadUrl: string
}
```

### 2. FileParser

Handles parsing of CSV and Excel files.

#### Constructor
```javascript
new FileParser(config = {})
```

**Parameters:**
- `config` (Object): Configuration options
  - `maxFileSize` (number): Maximum file size in bytes (default: 5MB)
  - `supportedFormats` (Array): Supported file formats (default: ['csv', 'xlsx'])

#### Methods

##### validateFileFormat(file)
Validates file format.

```javascript
validateFileFormat(file)
```

**Parameters:**
- `file` (File): File object

**Returns:**
```javascript
{
    isValid: boolean,
    format: string | null,
    error: string | null
}
```

##### validateFileSize(file)
Validates file size.

```javascript
validateFileSize(file)
```

**Parameters:**
- `file` (File): File object

**Returns:**
```javascript
{
    isValid: boolean,
    size: number,
    maxSize: number,
    error: string | null
}
```

##### parseCSV(file)
Parses CSV file.

```javascript
async parseCSV(file)
```

**Parameters:**
- `file` (File): CSV file object

**Returns:**
```javascript
{
    headers: Array<string>,
    data: Array<Object>,
    rowCount: number
}
```

##### parseExcel(file)
Parses Excel file.

```javascript
async parseExcel(file)
```

**Parameters:**
- `file` (File): Excel file object

**Returns:**
```javascript
{
    headers: Array<string>,
    data: Array<Object>,
    rowCount: number,
    sheetName: string
}
```

### 3. ValidationEngine

Validates import data against business rules.

#### Constructor
```javascript
new ValidationEngine(memberService, paymentService)
```

**Parameters:**
- `memberService` (Object): Member data service
- `paymentService` (Object): Payment service for balance checking

#### Methods

##### validateRow(rowData, rowNumber)
Validates a single row of import data.

```javascript
async validateRow(rowData, rowNumber)
```

**Parameters:**
- `rowData` (Object): Single row data
- `rowNumber` (number): Row number for error reporting

**Returns:**
```javascript
{
    isValid: boolean,
    rowNumber: number,
    data: Object,
    errors: Array<ValidationError>
}
```

##### validateMember(memberNumber, memberName)
Validates member existence and name match.

```javascript
async validateMember(memberNumber, memberName)
```

**Parameters:**
- `memberNumber` (string): Member number
- `memberName` (string): Member name

**Returns:**
```javascript
{
    isValid: boolean,
    member: Object | null,
    error: string | null
}
```

##### validatePaymentType(paymentType)
Validates payment type.

```javascript
validatePaymentType(paymentType)
```

**Parameters:**
- `paymentType` (string): Payment type ('hutang' or 'piutang')

**Returns:**
```javascript
{
    isValid: boolean,
    normalizedType: string | null,
    error: string | null
}
```

##### validateAmount(amount, memberBalance, paymentType)
Validates payment amount.

```javascript
async validateAmount(amount, memberBalance, paymentType)
```

**Parameters:**
- `amount` (number): Payment amount
- `memberBalance` (Object): Member balance information
- `paymentType` (string): Payment type

**Returns:**
```javascript
{
    isValid: boolean,
    amount: number,
    availableBalance: number,
    error: string | null
}
```

### 4. BatchProcessor

Processes payment transactions in batches.

#### Constructor
```javascript
new BatchProcessor(paymentEngine, auditLogger)
```

**Parameters:**
- `paymentEngine` (Object): Payment processing engine
- `auditLogger` (AuditLogger): Audit logger instance

#### Methods

##### processPayments(validatedData, progressCallback)
Processes batch of payments with progress tracking.

```javascript
async processPayments(validatedData, progressCallback)
```

**Parameters:**
- `validatedData` (Array): Array of validated payment data
- `progressCallback` (Function): Progress callback function

**Returns:**
```javascript
{
    batchId: string,
    totalProcessed: number,
    successCount: number,
    failureCount: number,
    successTransactions: Array<Transaction>,
    failedTransactions: Array<FailedTransaction>,
    processingTime: number
}
```

##### trackProgress(callback)
Sets up progress tracking callback.

```javascript
trackProgress(callback)
```

**Parameters:**
- `callback` (Function): Progress callback function
  - `progress` (Object): Progress information
    - `current` (number): Current processed count
    - `total` (number): Total count
    - `percentage` (number): Completion percentage
    - `currentItem` (Object): Currently processing item

##### handleCancellation()
Handles batch processing cancellation.

```javascript
async handleCancellation()
```

**Returns:**
```javascript
{
    cancelled: boolean,
    processedCount: number,
    rollbackRequired: boolean
}
```

### 5. PreviewGenerator

Generates preview data for user confirmation.

#### Constructor
```javascript
new PreviewGenerator()
```

#### Methods

##### generatePreviewTable(validatedData)
Generates preview table data.

```javascript
generatePreviewTable(validatedData)
```

**Parameters:**
- `validatedData` (Array): Validated import data

**Returns:**
```javascript
Array<{
    rowNumber: number,
    memberNumber: string,
    memberName: string,
    paymentType: string,
    amount: number,
    description: string,
    status: 'valid' | 'error' | 'warning',
    errors: Array<string>,
    formattedAmount: string
}>
```

##### calculateSummary(data)
Calculates summary statistics.

```javascript
calculateSummary(data)
```

**Parameters:**
- `data` (Array): Import data

**Returns:**
```javascript
{
    totalTransactions: number,
    totalAmount: number,
    totalHutang: number,
    totalPiutang: number,
    validCount: number,
    invalidCount: number,
    warningCount: number
}
```

##### highlightErrors(data)
Highlights and categorizes errors.

```javascript
highlightErrors(data)
```

**Parameters:**
- `data` (Array): Import data with validation results

**Returns:**
```javascript
{
    criticalErrors: Array<ValidationError>,
    warnings: Array<ValidationError>,
    errorSummary: Object
}
```

## Data Models

### ImportBatch
```javascript
{
    id: string,                    // Unique batch identifier
    fileName: string,              // Original filename
    uploadedBy: string,           // User who uploaded
    uploadedAt: Date,             // Upload timestamp
    totalRows: number,            // Total rows in file
    validRows: number,            // Number of valid rows
    invalidRows: number,          // Number of invalid rows
    status: string,               // 'uploaded' | 'validated' | 'processing' | 'completed' | 'cancelled'
    processedAt: Date | null,     // Processing completion timestamp
    results: ImportResult | null  // Processing results
}
```

### ImportRow
```javascript
{
    rowNumber: number,            // Row number in file
    memberNumber: string,         // Member number
    memberName: string,           // Member name
    paymentType: string,          // 'hutang' | 'piutang'
    amount: number,               // Payment amount
    description: string,          // Payment description
    isValid: boolean,             // Validation status
    validationErrors: Array<string>, // Validation error messages
    transactionId: string | null, // Transaction ID if processed
    processedAt: Date | null      // Processing timestamp
}
```

### ImportResult
```javascript
{
    batchId: string,              // Batch identifier
    totalProcessed: number,       // Total rows processed
    successCount: number,         // Successful transactions
    failureCount: number,         // Failed transactions
    successTransactions: Array<Transaction>, // Successful transaction details
    failedTransactions: Array<FailedTransaction>, // Failed transaction details
    summary: {
        totalAmount: number,      // Total amount processed
        totalHutang: number,      // Total hutang payments
        totalPiutang: number      // Total piutang payments
    },
    processingTime: number,       // Processing time in milliseconds
    completedAt: Date            // Completion timestamp
}
```

### ValidationError
```javascript
{
    code: string,                 // Error code (e.g., 'VE001')
    message: string,              // Human-readable error message
    field: string,                // Field that caused error
    value: any,                   // Invalid value
    rowNumber: number,            // Row number where error occurred
    severity: string              // 'error' | 'warning'
}
```

### Transaction
```javascript
{
    id: string,                   // Transaction ID
    memberNumber: string,         // Member number
    memberName: string,           // Member name
    paymentType: string,          // Payment type
    amount: number,               // Payment amount
    description: string,          // Payment description
    journalEntries: Array<JournalEntry>, // Associated journal entries
    createdAt: Date,              // Transaction timestamp
    createdBy: string             // User who created transaction
}
```

## Configuration

### Default Configuration
```javascript
{
    fileParser: {
        maxFileSize: 5 * 1024 * 1024,  // 5MB
        supportedFormats: ['csv', 'xlsx'],
        encoding: 'utf-8'
    },
    validation: {
        maxRowsPerBatch: 1000,
        strictMemberValidation: true,
        allowPartialPayments: true
    },
    processing: {
        batchSize: 50,
        timeoutMs: 30 * 60 * 1000,     // 30 minutes
        retryAttempts: 3
    },
    ui: {
        previewRowLimit: 100,
        progressUpdateInterval: 1000
    }
}
```

### Configuration Methods

#### updateConfiguration(config)
Updates module configuration.

```javascript
updateConfiguration(config)
```

**Parameters:**
- `config` (Object): Configuration object

**Example:**
```javascript
updateConfiguration({
    fileParser: {
        maxFileSize: 10 * 1024 * 1024  // 10MB
    },
    processing: {
        batchSize: 100
    }
});
```

## Error Handling

### Error Types

#### FileFormatError
Thrown when file format is not supported.

```javascript
class FileFormatError extends Error {
    constructor(format, supportedFormats) {
        super(`File format '${format}' not supported. Supported formats: ${supportedFormats.join(', ')}`);
        this.name = 'FileFormatError';
        this.code = 'FE001';
        this.format = format;
        this.supportedFormats = supportedFormats;
    }
}
```

#### FileSizeError
Thrown when file size exceeds limit.

```javascript
class FileSizeError extends Error {
    constructor(size, maxSize) {
        super(`File size ${size} bytes exceeds maximum ${maxSize} bytes`);
        this.name = 'FileSizeError';
        this.code = 'FE002';
        this.size = size;
        this.maxSize = maxSize;
    }
}
```

#### ValidationError
Thrown when data validation fails.

```javascript
class ValidationError extends Error {
    constructor(message, field, value, rowNumber) {
        super(message);
        this.name = 'ValidationError';
        this.code = 'VE001';
        this.field = field;
        this.value = value;
        this.rowNumber = rowNumber;
    }
}
```

#### ProcessingError
Thrown when transaction processing fails.

```javascript
class ProcessingError extends Error {
    constructor(message, transactionData, originalError) {
        super(message);
        this.name = 'ProcessingError';
        this.code = 'PE001';
        this.transactionData = transactionData;
        this.originalError = originalError;
    }
}
```

## Integration Points

### Payment System Integration
```javascript
// Integration with existing pembayaranHutangPiutang.js
const paymentEngine = {
    processPayment: async (paymentData) => {
        // Delegates to existing payment processing logic
        return await pembayaranHutangPiutang.processPayment(paymentData);
    },
    
    validateBalance: async (memberNumber, paymentType) => {
        // Validates member balance
        return await pembayaranHutangPiutang.getMemberBalance(memberNumber, paymentType);
    }
};
```

### Accounting Integration
```javascript
// Integration with accounting module
const accountingEngine = {
    createJournalEntry: async (transactionData) => {
        // Creates journal entries following existing patterns
        return await accountingModule.createJournalEntry(transactionData);
    },
    
    validateCOA: async (accountCode) => {
        // Validates chart of accounts
        return await accountingModule.validateAccount(accountCode);
    }
};
```

### Audit Integration
```javascript
// Integration with audit system
const auditLogger = {
    logImportStart: async (batchData) => {
        // Logs import start
        return await auditSystem.log('IMPORT_START', batchData);
    },
    
    logTransaction: async (transactionData) => {
        // Logs individual transactions
        return await auditSystem.log('IMPORT_TRANSACTION', transactionData);
    }
};
```

## Usage Examples

### Basic Usage
```javascript
import { initializeImportTagihan } from './js/import-tagihan/index.js';

// Initialize components
const components = initializeImportTagihan(paymentEngine, auditLogger);

// Upload file
const file = document.getElementById('fileInput').files[0];
const batch = await components.manager.uploadFile(file);

// Validate data
const validatedData = await components.manager.validateData(batch.rawData);

// Generate preview
const preview = await components.manager.generatePreview(validatedData);

// Process if confirmed
if (userConfirmed) {
    const results = await components.manager.processBatch(validatedData);
    const report = await components.manager.generateReport(results);
}
```

### Advanced Usage with Progress Tracking
```javascript
// Setup progress tracking
components.batchProcessor.trackProgress((progress) => {
    console.log(`Processing: ${progress.percentage}% (${progress.current}/${progress.total})`);
    updateProgressBar(progress.percentage);
});

// Process with cancellation support
const processingPromise = components.manager.processBatch(validatedData);

// Setup cancellation
document.getElementById('cancelBtn').onclick = async () => {
    await components.batchProcessor.handleCancellation();
};

// Wait for completion
const results = await processingPromise;
```

### Custom Configuration
```javascript
// Custom file parser configuration
const customParser = new FileParser({
    maxFileSize: 10 * 1024 * 1024,  // 10MB
    supportedFormats: ['csv']        // CSV only
});

// Custom validation engine
const customValidator = new ValidationEngine(memberService, paymentService);
customValidator.strictMode = false;  // Allow warnings

// Initialize with custom components
const manager = new ImportTagihanManager(paymentEngine, auditLogger);
manager.fileParser = customParser;
manager.validationEngine = customValidator;
```

## Testing

### Unit Tests
```javascript
// Example unit test
describe('FileParser', () => {
    test('should validate CSV format correctly', () => {
        const parser = new FileParser();
        const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
        
        const result = parser.validateFileFormat(mockFile);
        
        expect(result.isValid).toBe(true);
        expect(result.format).toBe('csv');
    });
});
```

### Integration Tests
```javascript
// Example integration test
describe('Import Workflow', () => {
    test('should complete full import workflow', async () => {
        const manager = new ImportTagihanManager(mockPaymentEngine, mockAuditLogger);
        
        const batch = await manager.uploadFile(mockFile);
        const validated = await manager.validateData(batch.rawData);
        const preview = await manager.generatePreview(validated);
        const results = await manager.processBatch(validated);
        
        expect(results.successCount).toBeGreaterThan(0);
    });
});
```

### Property-Based Tests
```javascript
// Example property-based test using fast-check
import fc from 'fast-check';

describe('Validation Properties', () => {
    test('should validate all positive amounts correctly', () => {
        fc.assert(fc.property(
            fc.integer({ min: 1, max: 1000000 }),
            (amount) => {
                const validator = new ValidationEngine();
                const result = validator.validateAmount(amount, { balance: amount + 1000 }, 'hutang');
                expect(result.isValid).toBe(true);
            }
        ));
    });
});
```

## Performance Considerations

### Memory Management
- Process files in chunks to avoid memory overflow
- Clean up temporary data after processing
- Use streaming for large files when possible

### Processing Optimization
- Batch database operations
- Use connection pooling
- Implement caching for frequently accessed data

### UI Responsiveness
- Use web workers for heavy processing
- Implement progress indicators
- Provide cancellation capabilities

## Security Considerations

### File Upload Security
- Validate file types and extensions
- Scan for malicious content
- Limit file sizes
- Sanitize file names

### Data Validation
- Validate all input data
- Prevent SQL injection
- Sanitize user inputs
- Implement rate limiting

### Access Control
- Verify user permissions
- Log all operations
- Implement session management
- Audit sensitive operations

---

**Note**: This API documentation is for the current version of the Import Tagihan Pembayaran module. Always refer to the latest version for the most up-to-date information.