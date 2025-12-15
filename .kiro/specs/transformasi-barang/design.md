# Design Document - Sistem Transformasi Barang

## Overview

Sistem Transformasi Barang adalah fitur yang memungkinkan pengguna untuk mengkonversi barang dari satu unit ke unit lainnya secara otomatis. Sistem ini dirancang untuk mengelola stok barang yang memiliki kemasan berbeda, seperti mengkonversi dari DUS ke PCS atau sebaliknya, dengan tetap menjaga integritas data dan akurasi stok.

Fitur ini terintegrasi dengan sistem master barang yang sudah ada dan menggunakan localStorage sebagai penyimpanan data. Sistem akan secara otomatis mengurangi stok unit asal dan menambah stok unit tujuan berdasarkan rasio konversi yang telah ditentukan.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Layer      │    │  Business Logic │    │   Data Layer    │
│                 │    │                 │    │                 │
│ - Menu          │◄──►│ - Transformation│◄──►│ - localStorage  │
│ - Forms         │    │   Manager       │    │ - Master Barang │
│ - Validation    │    │ - Validation    │    │ - Conversion    │
│ - Preview       │    │ - Calculation   │    │   Ratios        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Architecture

1. **TransformationManager**: Komponen utama yang mengelola seluruh proses transformasi
2. **ValidationEngine**: Memvalidasi data dan aturan bisnis
3. **ConversionCalculator**: Menghitung konversi antar unit
4. **StockManager**: Mengelola perubahan stok
5. **AuditLogger**: Mencatat semua transaksi transformasi
6. **UIController**: Mengelola antarmuka pengguna

## Components and Interfaces

### 1. TransformationManager

```javascript
class TransformationManager {
    constructor() {
        this.validationEngine = new ValidationEngine();
        this.calculator = new ConversionCalculator();
        this.stockManager = new StockManager();
        this.auditLogger = new AuditLogger();
    }
    
    // Core methods
    getTransformableItems()
    validateTransformation(sourceItem, targetItem, quantity)
    executeTransformation(transformationData)
    getTransformationHistory()
}
```

### 2. ValidationEngine

```javascript
class ValidationEngine {
    validateProductMatch(sourceItem, targetItem)
    validateStockAvailability(sourceItem, quantity)
    validateConversionRatio(sourceUnit, targetUnit)
    validateQuantityCalculation(sourceQty, targetQty, ratio)
}
```

### 3. ConversionCalculator

```javascript
class ConversionCalculator {
    calculateTargetQuantity(sourceQty, conversionRatio)
    getConversionRatio(sourceUnit, targetUnit)
    validateWholeNumberResult(calculatedQty)
}
```

### 4. StockManager

```javascript
class StockManager {
    updateStock(itemId, unit, quantityChange)
    getStockBalance(itemId, unit)
    validateStockConsistency()
}
```

## Data Models

### Transformation Record

```javascript
{
    id: "TRF-001",
    timestamp: "2024-12-14T10:30:00Z",
    user: "kasir01",
    sourceItem: {
        id: "AQUA-DUS",
        name: "Aqua 1L DUS",
        unit: "dus",
        quantity: 1,
        stockBefore: 10,
        stockAfter: 9
    },
    targetItem: {
        id: "AQUA-PCS", 
        name: "Aqua 1L PCS",
        unit: "pcs",
        quantity: 12,
        stockBefore: 5,
        stockAfter: 17
    },
    conversionRatio: 12,
    status: "completed"
}
```

### Conversion Ratio Configuration

```javascript
{
    baseProduct: "AQUA-1L",
    conversions: [
        {
            from: "dus",
            to: "pcs", 
            ratio: 12
        },
        {
            from: "pcs",
            to: "dus",
            ratio: 0.0833 // 1/12
        }
    ]
}
```

### Master Barang Extension

```javascript
{
    kode: "AQUA-DUS",
    nama: "Aqua 1L DUS",
    baseProduct: "AQUA-1L", // Pengelompokan produk yang sama
    kategori: "minuman",
    satuan: "dus",
    stok: 10,
    hargaBeli: 12000,
    // ... existing fields
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Product Validation Consistency
*For any* transformation request, the system should only allow transformations between items that belong to the same base product
**Validates: Requirements 1.1**

### Property 2: Conversion Calculation Accuracy  
*For any* transformation with valid conversion ratio, the calculated target quantity should equal source quantity multiplied by the conversion ratio
**Validates: Requirements 1.2**

### Property 3: Stock Balance Conservation
*For any* successful transformation, the total value of stock (in base units) should remain constant before and after the transformation
**Validates: Requirements 1.3**

### Property 4: Transaction Logging Completeness
*For any* completed transformation, a corresponding transaction log entry should exist with all required details
**Validates: Requirements 1.4**

### Property 5: Preview Information Completeness
*For any* transformation preview, all required information (current stock, transformation quantity, resulting stock) should be displayed for both units
**Validates: Requirements 1.5**

### Property 6: Transformable Items Filtering
*For any* product in the system, it should appear in the transformable items list if and only if it has multiple units with defined conversion ratios
**Validates: Requirements 2.1**

### Property 7: Stock Display Accuracy
*For any* displayed stock information, the values should match the actual stock data in the system
**Validates: Requirements 2.2**

### Property 8: Conversion Options Completeness
*For any* selected base product, all valid unit combinations with their conversion ratios should be displayed
**Validates: Requirements 2.3**

### Property 9: Insufficient Stock Handling
*For any* transformation request where source stock is insufficient, the system should disable the transformation and display appropriate warning
**Validates: Requirements 2.4**

### Property 10: Missing Ratio Error Handling
*For any* transformation request with undefined conversion ratio, the system should prevent execution and display error message
**Validates: Requirements 2.5**

### Property 11: Stock Availability Validation
*For any* transformation request, the system should verify sufficient stock exists before allowing execution
**Validates: Requirements 3.1**

### Property 12: Whole Number Conversion
*For any* transformation calculation, the result should produce whole numbers for the target unit
**Validates: Requirements 3.2**

### Property 13: Negative Stock Prevention
*For any* transformation that would result in negative stock, the system should reject the request
**Validates: Requirements 3.3**

### Property 14: Invalid Data Rejection
*For any* transformation with invalid input data, the system should prevent execution and provide specific error details
**Validates: Requirements 3.4**

### Property 15: Stock Balance Equation Consistency
*For any* successful transformation, the stock balance equations should remain mathematically consistent
**Validates: Requirements 3.5**

### Property 16: Complete Transaction Logging
*For any* transformation, the transaction log should contain all required fields including user, timestamp, quantities, and units
**Validates: Requirements 4.1**

### Property 17: Chronological History Display
*For any* transformation history view, records should be displayed in chronological order with proper filtering
**Validates: Requirements 4.2**

### Property 18: Historical Data Completeness
*For any* transformation record display, before and after stock levels should be shown for both units
**Validates: Requirements 4.3**

### Property 19: Export Data Completeness
*For any* transformation data export, all relevant transaction details should be included in the output
**Validates: Requirements 4.4**

### Property 20: Search Filter Functionality
*For any* transformation history search, filtering by date range, product, user, and type should work correctly
**Validates: Requirements 4.5**

### Property 21: Configuration Display Completeness
*For any* admin access to ratio configuration, all products with their unit relationships and ratios should be displayed
**Validates: Requirements 5.1**

### Property 22: Ratio Validation Rules
*For any* new transformation ratio setup, the system should validate mathematical consistency and positive values
**Validates: Requirements 5.2**

### Property 23: Configuration Change Impact Warning
*For any* ratio update, the system should warn about potential impacts on existing calculations
**Validates: Requirements 5.3**

### Property 24: Immediate Configuration Application
*For any* saved ratio configuration, changes should apply immediately to all future transformations
**Validates: Requirements 5.4**

### Property 25: Corrupted Data Error Handling
*For any* corrupted or missing ratio data, the system should prevent transformations and alert administrators
**Validates: Requirements 5.5**

### Property 26: UI Functionality Completeness
*For any* transformation interface element, auto-complete and dropdown selections should function correctly
**Validates: Requirements 6.2**

### Property 27: Success Confirmation Display
*For any* transformation result, clear success confirmation with updated stock levels should be shown
**Validates: Requirements 6.4**

### Property 28: Error Message Quality
*For any* transformation error, user-friendly messages with corrective actions should be displayed
**Validates: Requirements 6.5**

## Error Handling

### Error Categories

1. **Validation Errors**
   - Produk tidak cocok
   - Stok tidak mencukupi
   - Rasio konversi tidak ditemukan
   - Data input tidak valid

2. **Calculation Errors**
   - Hasil konversi bukan bilangan bulat
   - Overflow/underflow numerik
   - Pembagian dengan nol

3. **System Errors**
   - Gagal mengakses localStorage
   - Data korup
   - Konflik concurrent access

4. **Business Logic Errors**
   - Stok akan menjadi negatif
   - Transformasi tidak diizinkan
   - Konfigurasi tidak lengkap

### Error Handling Strategy

```javascript
class ErrorHandler {
    handleValidationError(error, context) {
        // Log error untuk debugging
        // Tampilkan pesan user-friendly
        // Berikan saran perbaikan
    }
    
    handleSystemError(error, context) {
        // Log error dengan detail lengkap
        // Rollback perubahan jika perlu
        // Tampilkan pesan generic ke user
    }
    
    handleBusinessLogicError(error, context) {
        // Log business rule violation
        // Tampilkan pesan spesifik
        // Berikan alternatif solusi
    }
}
```

## Testing Strategy

### Dual Testing Approach

Sistem ini akan menggunakan kombinasi unit testing dan property-based testing untuk memastikan kualitas dan keandalan:

**Unit Testing:**
- Menguji fungsi-fungsi spesifik dengan input yang sudah ditentukan
- Menguji edge cases dan kondisi error
- Menguji integrasi antar komponen
- Memverifikasi behavior yang sudah dikethaui

**Property-Based Testing:**
- Menggunakan library **fast-check** untuk JavaScript
- Setiap property-based test akan dijalankan minimal **100 iterasi**
- Setiap test akan diberi tag dengan format: **'Feature: transformasi-barang, Property {number}: {property_text}'**
- Menguji universal properties yang harus berlaku untuk semua input
- Menggunakan random data generation untuk menemukan edge cases

**Testing Requirements:**
- Unit tests dan property tests saling melengkapi
- Unit tests menangkap bug spesifik, property tests memverifikasi correctness umum
- Setiap correctness property harus diimplementasikan dalam satu property-based test
- Property tests harus ditempatkan sedekat mungkin dengan implementasi untuk mendeteksi error lebih awal

### Test Coverage Areas

1. **Transformation Logic Tests**
   - Validasi produk yang sama
   - Kalkulasi konversi
   - Update stok atomik

2. **Validation Tests**
   - Input validation
   - Business rule validation
   - Data integrity checks

3. **UI Integration Tests**
   - Form validation
   - Display accuracy
   - User interaction flows

4. **Error Handling Tests**
   - Error message accuracy
   - Recovery mechanisms
   - Rollback functionality

5. **Performance Tests**
   - Response time requirements
   - Large dataset handling
   - Concurrent access scenarios