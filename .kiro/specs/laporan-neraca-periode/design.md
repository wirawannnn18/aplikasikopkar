# Design Document - Balance Sheet Period Reports

## Overview

This feature extends the existing reports module to provide flexible period selection for balance sheet (neraca) reports. The system will generate balance sheets for daily, monthly, and yearly periods, integrating with the existing Chart of Accounts (COA) structure and maintaining consistency with current accounting practices.

## Architecture

The balance sheet reporting system follows the existing modular architecture:

- **Frontend**: HTML/JavaScript UI components integrated into the existing reports module
- **Data Layer**: Utilizes existing localStorage-based COA and journal data
- **Report Engine**: New balance sheet calculation functions that work with existing accounting data
- **Export System**: Extends current CSV/PDF export capabilities

## Components and Interfaces

### 1. Balance Sheet Report Generator (`laporanNeraca()`)
- **Purpose**: Main function to render balance sheet with period selection
- **Integration**: Added to existing `renderLaporan()` function in `js/reports.js`
- **Dependencies**: Existing COA structure, journal entries, date utilities

### 2. Period Selection Component
- **Daily Selector**: Date picker for specific day selection
- **Monthly Selector**: Month/year dropdown combinations
- **Yearly Selector**: Year selection dropdown
- **Validation**: Ensures selected periods have available data

### 3. Balance Sheet Calculator (`calculateBalanceSheet()`)
- **Input**: COA data, journal entries, target date
- **Output**: Categorized financial position (Assets, Liabilities, Equity)
- **Logic**: Calculates account balances as of specified date

### 4. Export Functions
- **PDF Export**: Formatted balance sheet layout
- **Excel Export**: Structured spreadsheet with formulas
- **Print Function**: Optimized print layout

## Data Models

### Balance Sheet Data Structure
```javascript
{
  reportDate: Date,
  periodType: 'daily' | 'monthly' | 'yearly',
  assets: {
    currentAssets: [
      { kode: '1-1000', nama: 'Kas', saldo: number },
      { kode: '1-1100', nama: 'Bank', saldo: number }
    ],
    fixedAssets: [
      { kode: '1-1300', nama: 'Persediaan Barang', saldo: number }
    ],
    totalAssets: number
  },
  liabilities: {
    currentLiabilities: [
      { kode: '2-1000', nama: 'Hutang Supplier', saldo: number },
      { kode: '2-1100', nama: 'Simpanan Pokok', saldo: number }
    ],
    totalLiabilities: number
  },
  equity: {
    paidCapital: [
      { kode: '3-1000', nama: 'Modal Koperasi', saldo: number }
    ],
    retainedEarnings: [
      { kode: '3-2000', nama: 'Laba Ditahan', saldo: number }
    ],
    totalEquity: number
  },
  totalLiabilitiesAndEquity: number
}
```

### Period Selection Model
```javascript
{
  type: 'daily' | 'monthly' | 'yearly',
  selectedDate: Date,
  selectedMonth: number,
  selectedYear: number,
  endDate: Date // Calculated based on period type
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Property 1: Period validation consistency
*For any* selected period (daily, monthly, yearly), the validation function should return consistent results when called multiple times with the same parameters
**Validates: Requirements 1.5**

Property 2: Balance sheet equation balance
*For any* generated balance sheet report, the total assets should equal the sum of total liabilities and total equity (Assets = Liabilities + Equity)
**Validates: Requirements 2.1**

Property 3: Date cutoff accuracy for daily reports
*For any* daily report date, only journal entries with dates on or before the selected date should be included in balance calculations
**Validates: Requirements 2.2**

Property 4: Month-end cutoff accuracy
*For any* monthly report, only journal entries with dates on or before the last day of the selected month should be included in balance calculations
**Validates: Requirements 2.3**

Property 5: Year-end cutoff accuracy
*For any* yearly report, only journal entries with dates on or before December 31st of the selected year should be included in balance calculations
**Validates: Requirements 2.4**

Property 6: Balance sheet format consistency
*For any* generated balance sheet, the report structure should contain all required sections (Assets, Liabilities, Equity) with proper categorization and totals
**Validates: Requirements 2.5**

Property 7: Export format preservation
*For any* balance sheet report exported to PDF or Excel, the financial data and structure should be preserved accurately in the exported format
**Validates: Requirements 3.2, 3.3**

Property 8: Print layout optimization
*For any* balance sheet report formatted for printing, the layout should fit standard page dimensions without data truncation
**Validates: Requirements 3.4**

Property 9: Success confirmation consistency
*For any* successful export or print operation, the system should provide user confirmation with operation details
**Validates: Requirements 3.5**

<function_calls>
<invoke name="prework">
<parameter name="featureName">laporan-neraca-periode

## Error Handling

### Data Validation Errors
- **Invalid Period Selection**: Display user-friendly error messages for invalid date ranges
- **No Data Available**: Show informative message with suggestions for alternative periods
- **COA Structure Issues**: Validate COA integrity before report generation

### System Errors
- **Calculation Failures**: Implement retry mechanisms with error logging
- **Export Failures**: Provide fallback options and clear error messages
- **Memory Issues**: Implement data chunking for large datasets

### User Experience
- **Loading States**: Show progress indicators during report generation
- **Graceful Degradation**: Provide basic functionality even if advanced features fail
- **Error Recovery**: Allow users to retry operations or select different periods

## Testing Strategy

### Unit Testing
- Test individual calculation functions with known data sets
- Validate period selection logic with edge cases
- Test export functions with various report sizes
- Verify error handling with invalid inputs

### Property-Based Testing
The system will use Jest with fast-check library for property-based testing. Each property-based test will run a minimum of 100 iterations to ensure comprehensive coverage.

**Property Test Requirements**:
- Each correctness property must be implemented as a single property-based test
- Tests must be tagged with comments referencing the design document property
- Tag format: `**Feature: laporan-neraca-periode, Property {number}: {property_text}**`
- All tests must validate universal properties across generated inputs

**Integration Testing**:
- Test complete report generation workflow from UI to export
- Validate integration with existing COA and journal systems
- Test cross-browser compatibility for date pickers and export functions
- Verify responsive design across different screen sizes

**Performance Testing**:
- Measure report generation time with large datasets
- Test export functionality with maximum expected data volumes
- Validate memory usage during report processing