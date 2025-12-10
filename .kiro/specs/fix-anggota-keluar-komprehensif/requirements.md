# Requirements Document: Perbaikan Komprehensif Anggota Keluar

## Introduction

Sistem koperasi saat ini memiliki beberapa masalah terkait anggota yang sudah keluar (statusKeanggotaan = 'Keluar'):
1. Anggota keluar masih muncul di Master Anggota
2. Simpanan anggota keluar masih tercatat di accounting setelah pencairan
3. Anggota non-aktif masih muncul di pencarian dan dapat digunakan untuk transaksi

Fitur ini akan memastikan anggota keluar benar-benar tidak muncul di Master Anggota, simpanan mereka di-zero-kan setelah pencairan, dan mereka tidak dapat digunakan untuk transaksi baru.

## Glossary

- **Master Anggota**: Halaman utama yang menampilkan daftar anggota aktif koperasi
- **Anggota Keluar**: Anggota dengan field `statusKeanggotaan === 'Keluar'`
- **Anggota Non-Aktif**: Anggota dengan field `status === 'Nonaktif'`
- **Pencairan Simpanan**: Proses pengembalian simpanan pokok, wajib, dan sukarela kepada anggota keluar
- **Zero-kan Saldo**: Mengubah saldo simpanan menjadi 0 setelah pencairan
- **Jurnal Akuntansi**: Catatan debit-kredit untuk setiap transaksi keuangan
- **COA (Chart of Accounts)**: Daftar akun akuntansi (Kas, Simpanan Pokok, Simpanan Wajib, dll)
- **localStorage**: Penyimpanan data browser untuk persistensi data aplikasi

## Requirements

### Requirement 1

**User Story:** As a koperasi administrator, I want anggota keluar to be completely hidden from Master Anggota, so that I only see active members in the main member list.

#### Acceptance Criteria

1. WHEN the system renders Master Anggota table THEN the system SHALL exclude all anggota with statusKeanggotaan equal to 'Keluar'
2. WHEN the system counts total anggota in Master Anggota THEN the system SHALL exclude anggota with statusKeanggotaan equal to 'Keluar' from the count
3. WHEN the system displays the member count badge THEN the system SHALL show only the count of non-keluar members
4. WHEN the system searches anggota in Master Anggota THEN the system SHALL exclude anggota with statusKeanggotaan equal to 'Keluar' from search results
5. WHEN the system exports anggota data THEN the system SHALL exclude anggota with statusKeanggotaan equal to 'Keluar' from export

### Requirement 2

**User Story:** As a koperasi accountant, I want simpanan balances to be zeroed after pencairan, so that accounting reports accurately reflect that anggota keluar have no remaining deposits.

#### Acceptance Criteria

1. WHEN the system processes pencairan simpanan pokok THEN the system SHALL set simpanan pokok balance to zero for that anggota
2. WHEN the system processes pencairan simpanan wajib THEN the system SHALL set simpanan wajib balance to zero for that anggota
3. WHEN the system processes pencairan simpanan sukarela THEN the system SHALL set simpanan sukarela balance to zero for that anggota
4. WHEN the system displays laporan simpanan THEN the system SHALL exclude anggota with zero balances from the report
5. WHEN the system calculates total simpanan THEN the system SHALL exclude anggota keluar from the calculation

### Requirement 3

**User Story:** As a koperasi accountant, I want accounting journals to correctly reflect pencairan simpanan, so that the cash account (Kas) decreases when deposits are returned.

#### Acceptance Criteria

1. WHEN the system processes pencairan simpanan pokok THEN the system SHALL create journal entry debiting Simpanan Pokok and crediting Kas
2. WHEN the system processes pencairan simpanan wajib THEN the system SHALL create journal entry debiting Simpanan Wajib and crediting Kas
3. WHEN the system processes pencairan simpanan sukarela THEN the system SHALL create journal entry debiting Simpanan Sukarela and crediting Kas
4. WHEN the system displays saldo Kas THEN the system SHALL reflect the reduction from pencairan
5. WHEN the system displays laporan keuangan THEN the system SHALL show accurate Kas balance after pencairan

### Requirement 4

**User Story:** As a kasir, I want anggota keluar to be excluded from all transaction dropdowns, so that I cannot accidentally create transactions for members who have left.

#### Acceptance Criteria

1. WHEN the system renders dropdown for simpanan transactions THEN the system SHALL exclude anggota with statusKeanggotaan equal to 'Keluar'
2. WHEN the system renders dropdown for pinjaman transactions THEN the system SHALL exclude anggota with statusKeanggotaan equal to 'Keluar'
3. WHEN the system renders dropdown for POS transactions THEN the system SHALL exclude anggota with statusKeanggotaan equal to 'Keluar'
4. WHEN the system renders dropdown for hutang piutang THEN the system SHALL exclude anggota with statusKeanggotaan equal to 'Keluar'
5. WHEN the system validates transaction input THEN the system SHALL reject transactions for anggota with statusKeanggotaan equal to 'Keluar'

### Requirement 5

**User Story:** As a kasir, I want anggota non-aktif to be excluded from transaction searches, so that I cannot create transactions for inactive members.

#### Acceptance Criteria

1. WHEN the system searches anggota for simpanan transaction THEN the system SHALL exclude anggota with status equal to 'Nonaktif'
2. WHEN the system searches anggota for pinjaman transaction THEN the system SHALL exclude anggota with status equal to 'Nonaktif'
3. WHEN the system searches anggota for POS transaction THEN the system SHALL exclude anggota with status equal to 'Nonaktif'
4. WHEN the system searches anggota by NIK THEN the system SHALL exclude anggota with status equal to 'Nonaktif'
5. WHEN the system searches anggota by name THEN the system SHALL exclude anggota with status equal to 'Nonaktif'

### Requirement 6

**User Story:** As a koperasi administrator, I want the system to prevent any new transactions for anggota keluar, so that no financial activity can occur for members who have left.

#### Acceptance Criteria

1. WHEN a user attempts to create simpanan transaction for anggota keluar THEN the system SHALL reject the transaction with error message
2. WHEN a user attempts to create pinjaman transaction for anggota keluar THEN the system SHALL reject the transaction with error message
3. WHEN a user attempts to create POS transaction for anggota keluar THEN the system SHALL reject the transaction with error message
4. WHEN a user attempts to create hutang piutang transaction for anggota keluar THEN the system SHALL reject the transaction with error message
5. WHEN the system validates transaction THEN the system SHALL check statusKeanggotaan before processing

### Requirement 7

**User Story:** As a koperasi administrator, I want anggota keluar to be visible only in the dedicated "Anggota Keluar" menu, so that I can still access their data for historical and audit purposes.

#### Acceptance Criteria

1. WHEN the system renders Anggota Keluar page THEN the system SHALL display only anggota with statusKeanggotaan equal to 'Keluar'
2. WHEN the system displays anggota keluar details THEN the system SHALL show tanggal keluar and pengembalian status
3. WHEN the system displays anggota keluar simpanan THEN the system SHALL show zero balances after pencairan
4. WHEN the system searches in Anggota Keluar page THEN the system SHALL search only within anggota with statusKeanggotaan equal to 'Keluar'
5. WHEN the system counts anggota keluar THEN the system SHALL count only anggota with statusKeanggotaan equal to 'Keluar'

### Requirement 8

**User Story:** As a developer, I want consistent filtering logic across all modules, so that anggota keluar and non-aktif exclusion is applied uniformly throughout the application.

#### Acceptance Criteria

1. WHEN any module retrieves anggota list for display THEN the system SHALL apply statusKeanggotaan not equal to 'Keluar' filter
2. WHEN any module retrieves anggota list for transaction THEN the system SHALL apply status equal to 'Aktif' AND statusKeanggotaan not equal to 'Keluar' filter
3. WHEN any module validates transaction input THEN the system SHALL check both status and statusKeanggotaan fields
4. WHEN any module generates reports THEN the system SHALL exclude anggota keluar unless explicitly requested for historical reports
5. WHEN any module calculates totals THEN the system SHALL exclude anggota keluar from calculations

### Requirement 9

**User Story:** As a koperasi accountant, I want laporan simpanan to exclude anggota with zero balances, so that reports only show members with active deposits.

#### Acceptance Criteria

1. WHEN the system generates laporan simpanan pokok THEN the system SHALL exclude anggota with simpanan pokok balance equal to zero
2. WHEN the system generates laporan simpanan wajib THEN the system SHALL exclude anggota with simpanan wajib balance equal to zero
3. WHEN the system generates laporan simpanan sukarela THEN the system SHALL exclude anggota with simpanan sukarela balance equal to zero
4. WHEN the system displays total simpanan THEN the system SHALL sum only non-zero balances
5. WHEN the system exports laporan simpanan THEN the system SHALL exclude anggota with zero balances

### Requirement 10

**User Story:** As a koperasi administrator, I want data integrity to be maintained, so that anggota keluar data is preserved in localStorage for audit purposes even though they are hidden from active views.

#### Acceptance Criteria

1. WHEN the system filters anggota keluar from display THEN the system SHALL preserve anggota keluar data in localStorage
2. WHEN the system zeros simpanan balances THEN the system SHALL preserve transaction history in localStorage
3. WHEN the system creates pencairan journals THEN the system SHALL preserve journal entries in localStorage
4. WHEN the system exports data for audit THEN the system SHALL include anggota keluar in audit export
5. WHEN the system performs backup THEN the system SHALL include all anggota data including keluar
