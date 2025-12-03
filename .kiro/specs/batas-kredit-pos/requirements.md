# Requirements Document

## Introduction

Fitur ini menambahkan sistem pembatasan kredit untuk transaksi Point of Sales (POS) di aplikasi manajemen koperasi. Sistem akan mencegah anggota melakukan belanja kredit melebihi batas Rp 2.000.000 selama masih memiliki tagihan yang belum dilunasi. Tujuannya adalah untuk mengelola risiko kredit dan memastikan anggota tidak memiliki tunggakan yang berlebihan.

## Glossary

- **POS System**: Sistem Point of Sales yang digunakan untuk mencatat transaksi penjualan barang kepada anggota
- **Member**: Anggota koperasi yang terdaftar dalam sistem
- **Credit Transaction**: Transaksi belanja yang pembayarannya ditangguhkan (kredit/hutang)
- **Outstanding Balance**: Total tagihan anggota yang belum dilunasi dari transaksi kredit sebelumnya
- **Credit Limit**: Batas maksimal kredit yang diperbolehkan untuk seorang anggota (Rp 2.000.000)
- **Transaction Amount**: Total nilai transaksi belanja yang sedang dilakukan
- **Payment Status**: Status pembayaran transaksi (lunas/belum lunas)

## Requirements

### Requirement 1

**User Story:** As a kasir (cashier), I want the system to check member's outstanding balance before processing credit transactions, so that members cannot exceed the credit limit.

#### Acceptance Criteria

1. WHEN a kasir initiates a credit transaction for a member THEN the POS System SHALL calculate the member's current outstanding balance
2. WHEN the outstanding balance is calculated THEN the POS System SHALL include all unpaid credit transactions from previous purchases
3. WHEN a member has no previous credit transactions THEN the POS System SHALL set the outstanding balance to zero
4. WHEN the calculation is complete THEN the POS System SHALL display the outstanding balance to the kasir

### Requirement 2

**User Story:** As a kasir, I want the system to validate if a new transaction would exceed the credit limit, so that I can inform members about their credit status.

#### Acceptance Criteria

1. WHEN a credit transaction is being processed THEN the POS System SHALL calculate the total exposure as outstanding balance plus new transaction amount
2. IF the total exposure exceeds Rp 2.000.000 THEN the POS System SHALL reject the transaction
3. WHEN a transaction is rejected THEN the POS System SHALL display a clear error message indicating the credit limit has been exceeded
4. WHEN a transaction is rejected THEN the POS System SHALL show the current outstanding balance and the attempted transaction amount
5. IF the total exposure is Rp 2.000.000 or less THEN the POS System SHALL allow the transaction to proceed

### Requirement 3

**User Story:** As a kasir, I want cash transactions to bypass credit limit checks, so that members can always purchase with cash regardless of their outstanding balance.

#### Acceptance Criteria

1. WHEN a transaction payment method is set to cash THEN the POS System SHALL skip the credit limit validation
2. WHEN a cash transaction is processed THEN the POS System SHALL complete the transaction without checking outstanding balance

### Requirement 4

**User Story:** As a member, I want my outstanding balance to decrease when I make payments, so that I can regain credit capacity for future purchases.

#### Acceptance Criteria

1. WHEN a member makes a payment on an outstanding credit transaction THEN the POS System SHALL reduce the outstanding balance by the payment amount
2. WHEN a credit transaction is fully paid THEN the POS System SHALL mark the transaction as paid and exclude it from outstanding balance calculations
3. WHEN the outstanding balance is updated THEN the POS System SHALL immediately reflect the new available credit for future transactions

### Requirement 5

**User Story:** As a manager, I want to view member credit information, so that I can monitor credit risk and member payment behavior.

#### Acceptance Criteria

1. WHEN viewing member details THEN the POS System SHALL display the current outstanding balance
2. WHEN viewing member details THEN the POS System SHALL display the available credit (Rp 2.000.000 minus outstanding balance)
3. WHEN viewing member details THEN the POS System SHALL list all unpaid credit transactions with dates and amounts
