# Audit Trail Format Documentation
## Fitur Hapus Transaksi Tutup Kasir

---

## Daftar Isi
1. [Overview](#overview)
2. [Audit Log Structure](#audit-log-structure)
3. [Field Specifications](#field-specifications)
4. [Data Types](#data-types)
5. [Storage Format](#storage-format)
6. [Query Examples](#query-examples)
7. [Export Format](#export-format)
8. [Retention Policy](#retention-policy)

---

## Overview

Audit trail untuk fitur hapus transaksi tutup kasir dirancang untuk menyediakan jejak lengkap dan immutable dari setiap operasi penghapusan. Setiap penghapusan dicatat dengan level **CRITICAL** dan mencakup informasi komprehensif untuk keperluan audit, investigasi, dan compliance.

### Key Characteristics
- **Immutable:** Audit log tidak dapat diubah setelah dibuat
- **Comprehensive:** Mencakup semua informasi relevan
- **Timestamped:** Semua event memiliki timestamp ISO 8601
- **Unique ID:** Setiap audit log memiliki ID unik
- **Structured:** Format JSON yang konsisten dan terstruktur

---

## Audit Log Structure

### Complete Audit Log Entry

```json
{
  "auditId": "AUDIT-CLOSED-20240115-0001",
  "level": "CRITICAL",
  "transactionId": "trans-abc123",
  "transactionNo": "POS-20240115-001",
  "transactionSnapshot": {
    "id": "trans-abc123",
    "noTransaksi": "POS-20240115-001",
    "tanggal": "2024-01-15T10:30:00.000Z",
    "kasir": "user1",
    "metode": "cash",
    "total": 150000,
    "items": [
      {
        "id": "item-001",
        "nama": "Beras 5kg",
        "qty": 2,
        "harga": 60000,
        "hpp": 50000,
        "subtotal": 120000
      },
      {
        "id": "item-002",
        "nama": "Minyak Goreng 2L",
        "qty": 1,
        "harga": 30000,
        "hpp": 25000,
        "subtotal": 30000
      }
    ]
  },
  "shiftId": "shift-20240115-001",
  "shiftSnapshot": {
    "before": {
      "id": "shift-20240115-001",
      "tanggalTutup": "2024-01-15T17:00:00.000Z",
      "kasir": "user1",
      "totalPenjualan": 5000000,
      "totalKas": 3000000,
      "totalPiutang": 2000000,
      "nomorLaporan": "TK-20240115-001"
    },
    "after": {
      "id": "shift-20240115-001",
      "tanggalTutup": "2024-01-15T17:00:00.000Z",
      "kasir": "user1",
      "totalPenjualan": 4850000,
      "totalKas": 2850000,
      "totalPiutang": 2000000,
      "nomorLaporan": "TK-20240115-001",
      "adjustments": [
        {
          "timestamp": "2024-01-16T09:15:00.000Z",
          "transactionId": "trans-abc123",
          "transactionNo": "POS-20240115-001",
          "amount": 150000,
          "type": "deletion",
          "reason": "Penghapusan transaksi tertutup",
          "adjustedBy": "admin1"
        }
      ]
    }
  },
  "category": "Kesalahan Input",
  "reason": "Transaksi ini salah input harga. Seharusnya Rp 50.000 tetapi tercatat Rp 150.000. Kesalahan baru ditemukan setelah tutup kasir karena pelanggan komplain dan menunjukkan bukti pembayaran yang berbeda.",
  "deletedBy": "admin1",
  "deletedAt": "2024-01-16T09:15:00.000Z",
  "passwordVerifiedAt": "2024-01-16T09:14:30.000Z",
  "systemInfo": {
    "timestamp": "2024-01-16T09:15:00.000Z",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "platform": "Win32",
    "language": "id-ID",
    "ipAddress": "N/A (client-side)"
  },
  "journalEntries": [
    {
      "id": "journal-rev-001",
      "tanggal": "2024-01-16T09:15:00.000Z",
      "deskripsi": "Reversal Transaksi Tertutup POS-20240115-001",
      "tag": "CLOSED_SHIFT_REVERSAL",
      "entries": [
        {
          "akun": "4-1000",
          "namaAkun": "Pendapatan Penjualan",
          "debit": 150000,
          "kredit": 0
        },
        {
          "akun": "1-1000",
          "namaAkun": "Kas",
          "debit": 0,
          "kredit": 150000
        }
      ]
    },
    {
      "id": "journal-hpp-001",
      "tanggal": "2024-01-16T09:15:00.000Z",
      "deskripsi": "Reversal HPP Transaksi Tertutup POS-20240115-001",
      "tag": "CLOSED_SHIFT_REVERSAL",
      "entries": [
        {
          "akun": "1-1300",
          "namaAkun": "Persediaan Barang",
          "debit": 125000,
          "kredit": 0
        },
        {
          "akun": "5-1000",
          "namaAkun": "Harga Pokok Penjualan",
          "debit": 0,
          "kredit": 125000
        }
      ]
    }
  ],
  "adjustmentData": {
    "shiftId": "shift-20240115-001",
    "snapshotBefore": {
      "totalPenjualan": 5000000,
      "totalKas": 3000000,
      "totalPiutang": 2000000
    },
    "snapshotAfter": {
      "totalPenjualan": 4850000,
      "totalKas": 2850000,
      "totalPiutang": 2000000
    },
    "adjustmentNote": {
      "timestamp": "2024-01-16T09:15:00.000Z",
      "transactionId": "trans-abc123",
      "transactionNo": "POS-20240115-001",
      "amount": 150000,
      "type": "deletion",
      "reason": "Penghapusan transaksi tertutup",
      "adjustedBy": "admin1"
    }
  },
  "validationResults": {
    "preDelete": {
      "valid": true,
      "errors": []
    },
    "postDelete": {
      "valid": true,
      "errors": []
    }
  },
  "stockRestored": true,
  "warnings": []
}
```

---

## Field Specifications

### Top-Level Fields

#### auditId
- **Type:** String
- **Format:** `AUDIT-CLOSED-YYYYMMDD-NNNN`
- **Required:** Yes
- **Unique:** Yes
- **Description:** Unique identifier untuk audit log
- **Example:** `AUDIT-CLOSED-20240115-0001`
- **Generation:** Auto-generated dengan sequential numbering per hari

#### level
- **Type:** String
- **Format:** Enum
- **Required:** Yes
- **Allowed Values:** `CRITICAL`
- **Description:** Level severity audit log
- **Note:** Selalu CRITICAL untuk penghapusan transaksi tertutup

#### transactionId
- **Type:** String
- **Required:** Yes
- **Description:** ID transaksi yang dihapus
- **Example:** `trans-abc123`

#### transactionNo
- **Type:** String
- **Required:** Yes
- **Description:** Nomor transaksi yang dihapus
- **Example:** `POS-20240115-001`

#### transactionSnapshot
- **Type:** Object
- **Required:** Yes
- **Description:** Snapshot lengkap transaksi sebelum dihapus
- **Fields:**
  - `id`: Transaction ID
  - `noTransaksi`: Transaction number
  - `tanggal`: Transaction date (ISO 8601)
  - `kasir`: Cashier username
  - `metode`: Payment method (cash/bon/kredit)
  - `total`: Total amount
  - `items`: Array of transaction items
    - `id`: Item ID
    - `nama`: Item name
    - `qty`: Quantity
    - `harga`: Price
    - `hpp`: Cost of goods sold
    - `subtotal`: Subtotal

#### shiftId
- **Type:** String
- **Required:** Yes (if shift found)
- **Description:** ID shift tutup kasir terkait
- **Example:** `shift-20240115-001`

#### shiftSnapshot
- **Type:** Object
- **Required:** Yes (if shift found)
- **Description:** Snapshot shift sebelum dan sesudah adjustment
- **Fields:**
  - `before`: Shift data sebelum adjustment
  - `after`: Shift data setelah adjustment
  - Both contain:
    - `id`: Shift ID
    - `tanggalTutup`: Close date (ISO 8601)
    - `kasir`: Cashier username
    - `totalPenjualan`: Total sales
    - `totalKas`: Total cash
    - `totalPiutang`: Total receivables
    - `nomorLaporan`: Report number
    - `adjustments`: Array of adjustments (only in 'after')

#### category
- **Type:** String
- **Format:** Enum
- **Required:** Yes
- **Allowed Values:**
  - `Kesalahan Input`
  - `Transaksi Duplikat`
  - `Fraud`
  - `Koreksi Akuntansi`
  - `Lainnya`
- **Description:** Kategori kesalahan yang menyebabkan penghapusan

#### reason
- **Type:** String
- **Required:** Yes
- **Min Length:** 20 characters
- **Max Length:** 1000 characters
- **Description:** Alasan detail penghapusan
- **Example:** "Transaksi ini salah input harga..."

#### deletedBy
- **Type:** String
- **Required:** Yes
- **Description:** Username user yang menghapus
- **Example:** `admin1`

#### deletedAt
- **Type:** String
- **Format:** ISO 8601 timestamp
- **Required:** Yes
- **Description:** Timestamp saat penghapusan dilakukan
- **Example:** `2024-01-16T09:15:00.000Z`

#### passwordVerifiedAt
- **Type:** String
- **Format:** ISO 8601 timestamp
- **Required:** Yes
- **Description:** Timestamp saat password diverifikasi
- **Example:** `2024-01-16T09:14:30.000Z`
- **Note:** Biasanya beberapa detik sebelum deletedAt

#### systemInfo
- **Type:** Object
- **Required:** Yes
- **Description:** Informasi sistem saat penghapusan
- **Fields:**
  - `timestamp`: ISO 8601 timestamp
  - `userAgent`: Browser user agent string
  - `platform`: Operating system platform
  - `language`: Browser language
  - `ipAddress`: IP address (N/A for client-side)

#### journalEntries
- **Type:** Array of Objects
- **Required:** Yes
- **Description:** Semua jurnal pembalik yang dibuat
- **Each Entry Contains:**
  - `id`: Journal ID
  - `tanggal`: Journal date (ISO 8601)
  - `deskripsi`: Journal description
  - `tag`: Always `CLOSED_SHIFT_REVERSAL`
  - `entries`: Array of journal entries
    - `akun`: Account code
    - `namaAkun`: Account name
    - `debit`: Debit amount
    - `kredit`: Credit amount

#### adjustmentData
- **Type:** Object
- **Required:** Yes
- **Description:** Data adjustment tutup kasir
- **Fields:**
  - `shiftId`: Shift ID
  - `snapshotBefore`: Snapshot sebelum adjustment
  - `snapshotAfter`: Snapshot setelah adjustment
  - `adjustmentNote`: Note yang ditambahkan ke shift

#### validationResults
- **Type:** Object
- **Required:** Yes
- **Description:** Hasil validasi pre dan post deletion
- **Fields:**
  - `preDelete`: Pre-deletion validation result
    - `valid`: Boolean
    - `errors`: Array of error messages
  - `postDelete`: Post-deletion validation result
    - `valid`: Boolean
    - `errors`: Array of error messages

#### stockRestored
- **Type:** Boolean
- **Required:** Yes
- **Description:** Status pengembalian stok
- **Values:** `true` (berhasil) atau `false` (gagal)

#### warnings
- **Type:** Array of Strings
- **Required:** Yes
- **Description:** Peringatan yang muncul selama proses
- **Example:** `["Peringatan: Anda telah menghapus 5 transaksi tertutup hari ini."]`
- **Note:** Empty array jika tidak ada warning

---

## Data Types

### Timestamp Format
**Format:** ISO 8601
**Pattern:** `YYYY-MM-DDTHH:mm:ss.sssZ`
**Example:** `2024-01-16T09:15:00.000Z`
**Timezone:** UTC (Z suffix)

### Currency Format
**Type:** Number
**Unit:** Indonesian Rupiah (IDR)
**Decimal:** No decimal places
**Example:** `150000` (represents Rp 150.000)

### Audit ID Format
**Pattern:** `AUDIT-CLOSED-YYYYMMDD-NNNN`
**Components:**
- `AUDIT-CLOSED`: Fixed prefix
- `YYYYMMDD`: Date (year, month, day)
- `NNNN`: Sequential number (4 digits, zero-padded)
**Example:** `AUDIT-CLOSED-20240115-0001`

---

## Storage Format

### localStorage Key
**Key:** `closedShiftDeletionLog`
**Type:** JSON Array
**Structure:**
```json
[
  {
    "auditId": "AUDIT-CLOSED-20240115-0001",
    ...
  },
  {
    "auditId": "AUDIT-CLOSED-20240115-0002",
    ...
  }
]
```

### Storage Considerations
- **Size Limit:** localStorage typically has 5-10MB limit
- **Cleanup:** Consider archiving logs older than 1 year
- **Backup:** Regular backup recommended
- **Integrity:** Use checksums for critical data

---

## Query Examples

### Get All Critical Logs
```javascript
const logs = JSON.parse(localStorage.getItem('closedShiftDeletionLog') || '[]');
console.log(`Total critical logs: ${logs.length}`);
```

### Get Logs by Date Range
```javascript
const logs = JSON.parse(localStorage.getItem('closedShiftDeletionLog') || '[]');
const startDate = new Date('2024-01-01');
const endDate = new Date('2024-01-31');

const filteredLogs = logs.filter(log => {
  const logDate = new Date(log.deletedAt);
  return logDate >= startDate && logDate <= endDate;
});

console.log(`Logs in date range: ${filteredLogs.length}`);
```

### Get Logs by User
```javascript
const logs = JSON.parse(localStorage.getItem('closedShiftDeletionLog') || '[]');
const username = 'admin1';

const userLogs = logs.filter(log => log.deletedBy === username);
console.log(`Logs by ${username}: ${userLogs.length}`);
```

### Get Logs by Category
```javascript
const logs = JSON.parse(localStorage.getItem('closedShiftDeletionLog') || '[]');
const category = 'Kesalahan Input';

const categoryLogs = logs.filter(log => log.category === category);
console.log(`Logs with category "${category}": ${categoryLogs.length}`);
```

### Get Log by Audit ID
```javascript
const logs = JSON.parse(localStorage.getItem('closedShiftDeletionLog') || '[]');
const auditId = 'AUDIT-CLOSED-20240115-0001';

const log = logs.find(l => l.auditId === auditId);
if (log) {
  console.log('Log found:', log);
} else {
  console.log('Log not found');
}
```

### Get Logs with Warnings
```javascript
const logs = JSON.parse(localStorage.getItem('closedShiftDeletionLog') || '[]');

const logsWithWarnings = logs.filter(log => 
  log.warnings && log.warnings.length > 0
);

console.log(`Logs with warnings: ${logsWithWarnings.length}`);
```

### Get Logs with Validation Errors
```javascript
const logs = JSON.parse(localStorage.getItem('closedShiftDeletionLog') || '[]');

const logsWithErrors = logs.filter(log => 
  !log.validationResults.preDelete.valid || 
  !log.validationResults.postDelete.valid
);

console.log(`Logs with validation errors: ${logsWithErrors.length}`);
```

---

## Export Format

### PDF Export Structure

```
┌─────────────────────────────────────────────────────────┐
│  AUDIT LOG - PENGHAPUSAN TRANSAKSI TERTUTUP            │
│  Audit ID: AUDIT-CLOSED-20240115-0001                  │
│  Level: CRITICAL                                        │
└─────────────────────────────────────────────────────────┘

INFORMASI TRANSAKSI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
No. Transaksi    : POS-20240115-001
Tanggal          : 15 Januari 2024, 10:30:00
Total            : Rp 150.000
Metode Pembayaran: Tunai
Kasir            : user1

Item Transaksi:
1. Beras 5kg
   Qty: 2 x Rp 60.000 = Rp 120.000
   HPP: Rp 50.000

2. Minyak Goreng 2L
   Qty: 1 x Rp 30.000 = Rp 30.000
   HPP: Rp 25.000

INFORMASI SHIFT TUTUP KASIR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Nomor Laporan    : TK-20240115-001
Tanggal Tutup    : 15 Januari 2024, 17:00:00
Kasir            : user1

Sebelum Adjustment:
- Total Penjualan: Rp 5.000.000
- Total Kas      : Rp 3.000.000
- Total Piutang  : Rp 2.000.000

Setelah Adjustment:
- Total Penjualan: Rp 4.850.000 (-Rp 150.000)
- Total Kas      : Rp 2.850.000 (-Rp 150.000)
- Total Piutang  : Rp 2.000.000 (tidak berubah)

INFORMASI PENGHAPUSAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Kategori         : Kesalahan Input
Alasan           : Transaksi ini salah input harga...
Dihapus Oleh     : admin1
Tanggal Hapus    : 16 Januari 2024, 09:15:00
Password Verified: 16 Januari 2024, 09:14:30

JURNAL PEMBALIK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Reversal Pendapatan
   Tag: CLOSED_SHIFT_REVERSAL
   Debit  : Pendapatan Penjualan (4-1000) Rp 150.000
   Kredit : Kas (1-1000)                  Rp 150.000

2. Reversal HPP
   Tag: CLOSED_SHIFT_REVERSAL
   Debit  : Persediaan Barang (1-1300)    Rp 125.000
   Kredit : HPP (5-1000)                  Rp 125.000

VALIDASI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Pre-Deletion : ✓ Valid
Post-Deletion: ✓ Valid
Stok Restored: ✓ Ya

INFORMASI SISTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)...
Platform  : Win32
Language  : id-ID
Timestamp : 16 Januari 2024, 09:15:00

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated: [Current Date and Time]
```

### CSV Export Format

```csv
Audit ID,Level,Transaction No,Transaction Date,Amount,Method,Category,Reason,Deleted By,Deleted At,Shift ID,Stock Restored,Warnings
AUDIT-CLOSED-20240115-0001,CRITICAL,POS-20240115-001,2024-01-15T10:30:00.000Z,150000,cash,Kesalahan Input,"Transaksi ini salah input...",admin1,2024-01-16T09:15:00.000Z,shift-20240115-001,true,""
```

---

## Retention Policy

### Short-Term Retention (0-90 days)
- **Storage:** localStorage
- **Access:** Immediate via UI
- **Purpose:** Active monitoring and quick reference

### Medium-Term Retention (91 days - 1 year)
- **Storage:** localStorage (if space permits) or archived
- **Access:** Via export or archive retrieval
- **Purpose:** Compliance and audit

### Long-Term Retention (1+ years)
- **Storage:** Archived (external storage recommended)
- **Access:** Via archive retrieval only
- **Purpose:** Legal compliance and historical reference

### Archival Process
1. **Monthly:** Export logs older than 90 days to CSV/PDF
2. **Quarterly:** Review and archive logs older than 1 year
3. **Annually:** Compress and store archived logs securely

### Deletion Policy
- **Never delete:** Audit logs should never be deleted
- **Archive only:** Move to long-term storage instead
- **Compliance:** Follow legal requirements for retention period

---

## Security Considerations

### Data Integrity
- **Immutability:** Audit logs cannot be modified after creation
- **Checksums:** Consider adding checksums for critical fields
- **Validation:** Validate structure on read

### Access Control
- **Read Access:** Only super admin can view audit logs
- **Write Access:** Only system can create audit logs
- **Export Access:** Only super admin can export

### Privacy
- **PII Protection:** Minimize personally identifiable information
- **Encryption:** Consider encrypting sensitive fields
- **Anonymization:** For long-term storage, consider anonymizing user data

---

## Appendix

### Related Documents
- Design Document: `.kiro/specs/hapus-transaksi-tutup-kasir/design.md`
- Requirements Document: `.kiro/specs/hapus-transaksi-tutup-kasir/requirements.md`
- User Guide: `PANDUAN_SUPER_ADMIN_HAPUS_TRANSAKSI_TERTUTUP.md`
- Security Checklist: `SECURITY_CHECKLIST_DEPLOYMENT.md`
- Rate Limiting Policy: `RATE_LIMITING_POLICY.md`

### Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2024 | Initial documentation | Development Team |

---

**Versi Dokumen:** 1.0.0  
**Terakhir Diperbarui:** 2024  
**Status:** Final
