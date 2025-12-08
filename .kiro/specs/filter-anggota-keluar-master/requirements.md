# Requirements Document: Filter Anggota Keluar dari Master Anggota

## Introduction

Sistem koperasi saat ini menampilkan semua anggota di Master Anggota, termasuk anggota yang sudah keluar (statusKeanggotaan = 'Keluar'). Hal ini menyebabkan kebingungan karena anggota keluar seharusnya tidak ditampilkan di Master Anggota, melainkan hanya di menu "Anggota Keluar" khusus. Fitur ini akan memastikan anggota keluar difilter dari tampilan Master Anggota namun tetap tersimpan di localStorage untuk keperluan audit dan laporan historis.

## Glossary

- **Master Anggota**: Halaman utama yang menampilkan daftar anggota aktif koperasi
- **Anggota Keluar**: Anggota dengan field `statusKeanggotaan === 'Keluar'`
- **Filter**: Proses menyembunyikan data dari tampilan tanpa menghapus dari storage
- **Dropdown Anggota**: Komponen select/dropdown untuk memilih anggota dalam transaksi
- **localStorage**: Penyimpanan data browser untuk persistensi data aplikasi

## Requirements

### Requirement 1

**User Story:** As a koperasi administrator, I want anggota keluar to be hidden from Master Anggota, so that I only see active members in the main member list.

#### Acceptance Criteria

1. WHEN the system renders Master Anggota table THEN the system SHALL exclude all anggota with statusKeanggotaan equal to 'Keluar'
2. WHEN the system counts total anggota in Master Anggota THEN the system SHALL exclude anggota with statusKeanggotaan equal to 'Keluar' from the count
3. WHEN the system displays the member count badge THEN the system SHALL show only the count of non-keluar members
4. WHEN anggota data is stored in localStorage THEN the system SHALL preserve all anggota records including those with statusKeanggotaan equal to 'Keluar'
5. WHEN the system filters anggota by search term THEN the system SHALL exclude anggota with statusKeanggotaan equal to 'Keluar' from search results

### Requirement 2

**User Story:** As a kasir, I want dropdown anggota selections to exclude anggota keluar, so that I cannot accidentally create transactions for members who have left.

#### Acceptance Criteria

1. WHEN the system renders dropdown for simpanan pokok THEN the system SHALL exclude anggota with statusKeanggotaan equal to 'Keluar'
2. WHEN the system renders dropdown for simpanan wajib THEN the system SHALL exclude anggota with statusKeanggotaan equal to 'Keluar'
3. WHEN the system renders dropdown for simpanan sukarela THEN the system SHALL exclude anggota with statusKeanggotaan equal to 'Keluar'
4. WHEN the system renders dropdown for POS transactions THEN the system SHALL exclude anggota with statusKeanggotaan equal to 'Keluar'
5. WHEN the system renders dropdown for pinjaman THEN the system SHALL exclude anggota with statusKeanggotaan equal to 'Keluar'

### Requirement 3

**User Story:** As a koperasi administrator, I want filter controls in Master Anggota to work correctly with anggota keluar exclusion, so that filtering by departemen, tipe, or status only shows active members.

#### Acceptance Criteria

1. WHEN the system filters anggota by departemen THEN the system SHALL exclude anggota with statusKeanggotaan equal to 'Keluar' from filtered results
2. WHEN the system filters anggota by tipe keanggotaan THEN the system SHALL exclude anggota with statusKeanggotaan equal to 'Keluar' from filtered results
3. WHEN the system filters anggota by status THEN the system SHALL exclude anggota with statusKeanggotaan equal to 'Keluar' from filtered results
4. WHEN the system filters anggota by tanggal pendaftaran range THEN the system SHALL exclude anggota with statusKeanggotaan equal to 'Keluar' from filtered results
5. WHEN the system displays filtered count THEN the system SHALL show count excluding anggota with statusKeanggotaan equal to 'Keluar'

### Requirement 4

**User Story:** As a koperasi administrator, I want anggota keluar to be visible only in the dedicated "Anggota Keluar" menu, so that I can still access their data for historical purposes.

#### Acceptance Criteria

1. WHEN the system renders Anggota Keluar page THEN the system SHALL display only anggota with statusKeanggotaan equal to 'Keluar'
2. WHEN the system renders Anggota Keluar table THEN the system SHALL show pengembalian status for each anggota keluar
3. WHEN the system filters Anggota Keluar by search THEN the system SHALL search only within anggota with statusKeanggotaan equal to 'Keluar'
4. WHEN the system counts anggota keluar THEN the system SHALL count only anggota with statusKeanggotaan equal to 'Keluar'
5. WHEN the system displays anggota keluar details THEN the system SHALL show tanggal keluar and pengembalian information

### Requirement 5

**User Story:** As a developer, I want consistent filtering logic across all modules, so that anggota keluar exclusion is applied uniformly throughout the application.

#### Acceptance Criteria

1. WHEN any module retrieves anggota list for display THEN the system SHALL apply statusKeanggotaan not equal to 'Keluar' filter
2. WHEN any module retrieves anggota list for dropdown THEN the system SHALL apply statusKeanggotaan not equal to 'Keluar' filter
3. WHEN any module retrieves anggota list for transaction validation THEN the system SHALL apply statusKeanggotaan not equal to 'Keluar' filter
4. WHEN the system exports anggota data THEN the system SHALL exclude anggota with statusKeanggotaan equal to 'Keluar' unless explicitly requested
5. WHEN the system generates reports THEN the system SHALL exclude anggota with statusKeanggotaan equal to 'Keluar' from active member reports

### Requirement 6

**User Story:** As a koperasi administrator, I want sorting functionality to work correctly with filtered data, so that I can sort active members by tanggal pendaftaran.

#### Acceptance Criteria

1. WHEN the system sorts anggota by tanggal pendaftaran THEN the system SHALL sort only anggota with statusKeanggotaan not equal to 'Keluar'
2. WHEN the system applies ascending sort THEN the system SHALL maintain anggota keluar exclusion
3. WHEN the system applies descending sort THEN the system SHALL maintain anggota keluar exclusion
4. WHEN the system resets sort order THEN the system SHALL maintain anggota keluar exclusion
5. WHEN the system displays sorted results THEN the system SHALL show count excluding anggota with statusKeanggotaan equal to 'Keluar'
