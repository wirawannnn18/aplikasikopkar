# Requirements Document

## Introduction

Fitur ini menambahkan kemampuan filtering berdasarkan tanggal dan aksi hapus jurnal pada menu jurnal. Pengguna dapat memfilter data jurnal berdasarkan rentang tanggal untuk mempermudah pencarian, dan dapat menghapus entri jurnal tertentu dengan aman termasuk reversal transaksi terkait.

## Glossary

- **Jurnal System**: Sistem pencatatan transaksi akuntansi yang mencatat semua aktivitas keuangan
- **Filter Tanggal**: Mekanisme untuk menampilkan data jurnal berdasarkan rentang tanggal tertentu
- **Hapus Jurnal**: Proses menghapus entri jurnal dari sistem dengan reversal yang tepat
- **Reversal**: Proses membatalkan efek transaksi dengan membuat entri kebalikan
- **User**: Pengguna sistem yang memiliki akses ke menu jurnal
- **Admin/SuperAdmin**: Pengguna dengan hak akses tinggi untuk mengelola data jurnal

## Requirements

### Requirement 1

**User Story:** Sebagai user, saya ingin memfilter data jurnal berdasarkan tanggal, sehingga saya dapat melihat transaksi pada periode tertentu dengan mudah.

#### Acceptance Criteria

1. WHEN a user accesses the jurnal menu THEN the Jurnal System SHALL display date filter controls with start date and end date inputs
2. WHEN a user selects a start date and end date THEN the Jurnal System SHALL display only journal entries within that date range
3. WHEN a user clears the date filter THEN the Jurnal System SHALL display all journal entries
4. WHEN a user enters an invalid date range (end date before start date) THEN the Jurnal System SHALL display a validation error message
5. WHEN filtered results are displayed THEN the Jurnal System SHALL show the total count of filtered entries

### Requirement 2

**User Story:** Sebagai admin, saya ingin menghapus entri jurnal yang salah atau tidak valid, sehingga data akuntansi tetap akurat.

#### Acceptance Criteria

1. WHEN an admin views a journal entry THEN the Jurnal System SHALL display a delete button for each entry
2. WHEN an admin clicks the delete button THEN the Jurnal System SHALL display a confirmation dialog with entry details
3. WHEN an admin confirms deletion THEN the Jurnal System SHALL remove the journal entry from the database
4. WHEN a journal entry is deleted THEN the Jurnal System SHALL create reversal entries to maintain accounting balance
5. WHEN deletion is successful THEN the Jurnal System SHALL display a success notification and refresh the journal list

### Requirement 3

**User Story:** Sebagai admin, saya ingin melihat detail jurnal sebelum menghapus, sehingga saya dapat memastikan jurnal yang tepat akan dihapus.

#### Acceptance Criteria

1. WHEN an admin clicks delete on a journal entry THEN the Jurnal System SHALL display entry details including date, account, debit, credit, and description
2. WHEN the confirmation dialog is shown THEN the Jurnal System SHALL display the impact of deletion on account balances
3. WHEN an admin cancels the deletion THEN the Jurnal System SHALL close the dialog and maintain the current state

### Requirement 4

**User Story:** Sebagai user, saya ingin filter tanggal tersimpan selama sesi, sehingga saya tidak perlu memasukkan ulang filter saat berpindah halaman.

#### Acceptance Criteria

1. WHEN a user applies a date filter THEN the Jurnal System SHALL store the filter criteria in session storage
2. WHEN a user navigates away and returns to the jurnal menu THEN the Jurnal System SHALL restore the previous filter settings
3. WHEN a user logs out THEN the Jurnal System SHALL clear all stored filter settings

### Requirement 5

**User Story:** Sebagai sistem, saya ingin mencatat semua aktivitas hapus jurnal, sehingga ada audit trail yang jelas.

#### Acceptance Criteria

1. WHEN a journal entry is deleted THEN the Jurnal System SHALL create an audit log entry with timestamp, user, and deleted entry details
2. WHEN reversal entries are created THEN the Jurnal System SHALL link them to the original deleted entry in the audit log
3. WHEN an audit log is created THEN the Jurnal System SHALL include the reason for deletion if provided by the user

### Requirement 6

**User Story:** Sebagai admin, saya ingin sistem mencegah penghapusan jurnal yang sudah direkonsiliasi, sehingga integritas data terjaga.

#### Acceptance Criteria

1. WHEN an admin attempts to delete a reconciled journal entry THEN the Jurnal System SHALL prevent the deletion and display an error message
2. WHEN an admin attempts to delete a journal entry from a closed period THEN the Jurnal System SHALL prevent the deletion unless the user is a SuperAdmin
3. WHEN a SuperAdmin deletes a closed period entry THEN the Jurnal System SHALL require additional confirmation and log the action with high priority

### Requirement 7

**User Story:** Sebagai user, saya ingin filter tanggal memiliki preset periode umum, sehingga saya dapat dengan cepat memfilter data tanpa input manual.

#### Acceptance Criteria

1. WHEN a user accesses the date filter THEN the Jurnal System SHALL display preset options including "Hari Ini", "Minggu Ini", "Bulan Ini", "Bulan Lalu"
2. WHEN a user selects a preset option THEN the Jurnal System SHALL automatically populate the start and end date fields
3. WHEN a user manually changes dates after selecting a preset THEN the Jurnal System SHALL clear the preset selection
