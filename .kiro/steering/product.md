# Product Overview

## Aplikasi Koperasi Karyawan

A comprehensive cooperative management system with integrated Point of Sales (POS) and financial management capabilities for employee cooperatives.

## Core Features

### Member Management
- Member registration with unique member codes
- Department-based organization
- Member exit workflow with automated data cleanup
- Savings management (mandatory, voluntary, principal)

### Financial System
- Double-entry accounting with Chart of Accounts (COA)
- Automatic journal entries for all transactions
- Loan management with installment tracking
- Financial reporting (Balance Sheet, P&L, Cash Flow)

### Point of Sales (POS)
- Cash register operations with daily opening/closing
- Barcode scanning and manual item search
- Member and general customer transactions
- Credit limit management for members
- Receipt printing and transaction history

### Inventory Management
- Master item database with categories and units
- Stock tracking with minimum stock alerts
- Item transformation (unit conversion)
- Purchase management and stock opname
- Excel import/export capabilities

### Reporting & Analytics
- Member transaction reports
- Financial statements
- Sales reports (cash and credit)
- Stock reports with average cost calculation
- Export to CSV functionality

## User Roles

- **Super Admin**: Full system access including system settings
- **Administrator**: Full access except system configuration
- **Admin Keuangan**: Financial module access
- **Kasir**: POS operations and basic member services

## Technology Stack

Frontend-only application using vanilla JavaScript with Bootstrap 5 UI framework, supporting both offline (LocalStorage) and online (Supabase) data persistence.