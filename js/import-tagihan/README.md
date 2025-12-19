# Import Tagihan Pembayaran Module

This module provides functionality for importing payment data (tagihan pembayaran) for hutang and piutang transactions in bulk via CSV/Excel files.

## Requirements Coverage

This implementation addresses the following requirements:
- **1.1, 2.1, 3.1**: Core project structure and interfaces
- **2.1-2.5**: File parsing and validation
- **3.1-3.5**: Data validation engine
- **4.1-4.5**: Preview generation
- **5.1-5.5**: Batch processing
- **6.1-6.5**: Reporting
- **7.1-7.5**: Audit logging
- **8.1-8.5**: Error handling
- **9.1-9.5**: Admin configuration
- **10.1-10.5**: Cancellation and rollback

## Components

### 1. ImportTagihanManager
Main orchestrator class that coordinates the entire import workflow.

```javascript
const manager = new ImportTagihanManager(paymentEngine, auditLogger);
await manager.uploadFile(file);
```

### 2. FileParser
Handles CSV and Excel file parsing with validation.

```javascript
const parser = new FileParser();
const formatValid = parser.validateFileFormat(file);
const sizeValid = parser.validateFileSize(file);
```

### 3. ValidationEngine
Validates import data against business rules.

```javascript
const engine = new ValidationEngine();
const typeResult = engine.validatePaymentType('hutang');
const amountResult = engine.validateAmount(1000);
```

### 4. BatchProcessor
Processes payment transactions in batches with progress tracking.

```javascript
const processor = new BatchProcessor(paymentEngine, auditLogger);
processor.trackProgress((progress) => console.log(progress));
```

### 5. PreviewGenerator
Generates preview data for user confirmation before processing.

```javascript
const generator = new PreviewGenerator();
const preview = generator.generateCompletePreview(validatedData);
```

## File Format

The import file must be CSV or Excel format with the following columns:

| Column | Description | Required | Example |
|--------|-------------|----------|---------|
| nomor_anggota | Member number/NIK | Yes | 001 |
| nama_anggota | Member name | Yes | John Doe |
| jenis_pembayaran | Payment type (hutang/piutang) | Yes | hutang |
| jumlah_pembayaran | Payment amount | Yes | 500000 |
| keterangan | Description/notes | No | Cicilan bulan Januari |

## Testing

The module includes comprehensive tests using Jest and fast-check for property-based testing:

```bash
# Run all import-tagihan tests
npx jest __tests__/import-tagihan

# Run specific test file
npx jest __tests__/import-tagihan/FileParser.test.js
```

### Property-Based Testing

Each component includes property-based tests using fast-check to verify correctness across a wide range of inputs:

- File validation properties
- Data validation properties  
- Preview generation properties
- Batch processing properties

## Usage Example

```javascript
import { initializeImportTagihan } from './js/import-tagihan/index.js';

// Initialize with payment engine and audit logger
const components = initializeImportTagihan(paymentEngine, auditLogger);

// Upload and process file
const file = document.getElementById('fileInput').files[0];
const batch = await components.manager.uploadFile(file);
const validatedData = await components.manager.validateData(batch.rawData);
const preview = await components.manager.generatePreview(validatedData);

// Show preview to user, then process if confirmed
if (userConfirmed) {
    const results = await components.manager.processBatch(validatedData);
    const report = await components.manager.generateReport(results);
}
```

## Error Handling

The module implements comprehensive error handling:

- **File Errors**: Invalid format, size limits, corrupted files
- **Validation Errors**: Invalid member numbers, payment types, amounts
- **Processing Errors**: Database failures, journal errors, balance issues
- **System Errors**: Memory limits, network timeouts, authentication failures

All errors are logged for audit purposes and provide user-friendly messages.

## Configuration

Default configuration can be customized:

```javascript
const parser = new FileParser();
parser.maxFileSize = 10 * 1024 * 1024; // 10MB
parser.supportedFormats = ['csv', 'xlsx'];
```

## Integration

This module integrates with existing systems:

- **pembayaranHutangPiutang.js**: For individual payment processing
- **Accounting Module**: For journal entries and balance updates
- **Member Management**: For member validation
- **Audit System**: For comprehensive logging

## Development Status

✅ **Completed**: Project structure, core interfaces, TypeScript definitions
🚧 **In Progress**: Implementation of core functionality
⏳ **Pending**: Integration with existing payment system

## Next Steps

1. Implement file parsing logic (CSV/Excel)
2. Implement member validation against database
3. Implement batch processing with payment engine integration
4. Add comprehensive error handling and rollback
5. Create user interface components
6. Integration testing with existing systems