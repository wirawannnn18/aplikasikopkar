# Data Models - Anggota Keluar

Dokumentasi struktur data untuk fitur pengelolaan anggota keluar dari koperasi.

## 1. Anggota (Extended Model)

Model anggota yang sudah ada diperluas dengan field-field baru untuk mendukung fitur anggota keluar.

### Field Baru:

```javascript
{
  // ... existing fields (id, nik, nama, departemen, etc.)
  
  // Status keanggotaan
  statusKeanggotaan: "Aktif" | "Keluar",  // Default: "Aktif"
  
  // Data keluar (hanya diisi jika statusKeanggotaan = "Keluar")
  tanggalKeluar: "YYYY-MM-DD" | null,     // ISO date format
  alasanKeluar: string | null,             // Reason for exit
  
  // Status pengembalian
  pengembalianStatus: "Pending" | "Diproses" | "Selesai" | null,
  pengembalianId: string | null            // Reference to pengembalian record
}
```

### Contoh Data:

```javascript
{
  id: "ang-001",
  nik: "3201010101010001",
  nama: "Budi Santoso",
  noKartu: "KOP-001",
  departemen: "IT",
  tipeAnggota: "Anggota",
  status: "Aktif",
  telepon: "081234567890",
  email: "budi@example.com",
  alamat: "Jl. Merdeka No. 123",
  tanggalDaftar: "2020-01-15",
  
  // New fields for anggota keluar
  statusKeanggotaan: "Keluar",
  tanggalKeluar: "2024-12-01",
  alasanKeluar: "Pindah ke kota lain",
  pengembalianStatus: "Selesai",
  pengembalianId: "pgb-001"
}
```

### Backward Compatibility:

Anggota yang sudah ada (legacy data) akan memiliki nilai default:
- `statusKeanggotaan`: "Aktif"
- `tanggalKeluar`: null
- `alasanKeluar`: null
- `pengembalianStatus`: null
- `pengembalianId`: null

## 2. Pengembalian Simpanan

Model baru untuk mencatat transaksi pengembalian simpanan kepada anggota yang keluar.

### Structure:

```javascript
{
  // Identifikasi
  id: string,                              // Unique ID (generated)
  anggotaId: string,                       // Reference to anggota
  anggotaNama: string,                     // Nama anggota (denormalized)
  anggotaNIK: string,                      // NIK anggota (denormalized)
  
  // Rincian simpanan
  simpananPokok: number,                   // Total simpanan pokok
  simpananWajib: number,                   // Total simpanan wajib
  totalSimpanan: number,                   // simpananPokok + simpananWajib
  
  // Potongan (jika ada)
  kewajibanLain: number,                   // Kewajiban yang harus dipotong
  keterangan: string,                      // Keterangan potongan/catatan
  
  // Total pengembalian
  totalPengembalian: number,               // totalSimpanan - kewajibanLain
  
  // Detail pembayaran
  metodePembayaran: "Kas" | "Transfer Bank",
  tanggalPembayaran: string,               // ISO date (YYYY-MM-DD)
  nomorReferensi: string,                  // Reference number for tracking
  
  // Status dan audit
  status: "Pending" | "Diproses" | "Selesai",
  createdAt: string,                       // ISO datetime
  createdBy: string,                       // User ID who created
  processedAt: string | null,              // ISO datetime when processed
  processedBy: string | null,              // User ID who processed
  
  // Jurnal reference
  jurnalId: string | null                  // Reference to journal entry
}
```

### Contoh Data:

```javascript
{
  id: "pgb-001",
  anggotaId: "ang-001",
  anggotaNama: "Budi Santoso",
  anggotaNIK: "3201010101010001",
  
  simpananPokok: 1000000,
  simpananWajib: 2400000,
  totalSimpanan: 3400000,
  
  kewajibanLain: 0,
  keterangan: "Pengembalian penuh tanpa potongan",
  
  totalPengembalian: 3400000,
  
  metodePembayaran: "Transfer Bank",
  tanggalPembayaran: "2024-12-05",
  nomorReferensi: "TRF-20241205-001",
  
  status: "Selesai",
  createdAt: "2024-12-01T10:30:00.000Z",
  createdBy: "admin-001",
  processedAt: "2024-12-05T14:15:00.000Z",
  processedBy: "admin-001",
  
  jurnalId: "jrn-001"
}
```

### Status Flow:

```
Pending → Diproses → Selesai
```

- **Pending**: Pengembalian telah dicatat tapi belum diproses
- **Diproses**: Sedang dalam proses (validasi, perhitungan)
- **Selesai**: Pengembalian telah selesai, jurnal telah dibuat, saldo telah diupdate

## 3. Audit Log Entry

Model untuk tracking semua perubahan dan aksi terkait anggota keluar.

### Structure:

```javascript
{
  // Identifikasi
  id: string,                              // Unique ID (generated)
  timestamp: string,                       // ISO datetime
  
  // User information
  userId: string,                          // ID of user who performed action
  userName: string,                        // Name of user (denormalized)
  
  // Action details
  action: "MARK_KELUAR" | "PROSES_PENGEMBALIAN" | "CANCEL_KELUAR",
  
  // Anggota reference
  anggotaId: string,
  anggotaNama: string,                     // Denormalized for easy reading
  
  // Additional details (flexible object)
  details: {
    // For MARK_KELUAR:
    tanggalKeluar?: string,
    alasanKeluar?: string,
    
    // For PROSES_PENGEMBALIAN:
    pengembalianId?: string,
    totalPengembalian?: number,
    metodePembayaran?: string,
    
    // For CANCEL_KELUAR:
    reason?: string
  },
  
  // Optional
  ipAddress: string | null                 // IP address of user (if available)
}
```

### Contoh Data:

```javascript
// Example 1: Mark Keluar
{
  id: "log-001",
  timestamp: "2024-12-01T10:30:00.000Z",
  userId: "admin-001",
  userName: "Admin Koperasi",
  action: "MARK_KELUAR",
  anggotaId: "ang-001",
  anggotaNama: "Budi Santoso",
  details: {
    tanggalKeluar: "2024-12-01",
    alasanKeluar: "Pindah ke kota lain"
  },
  ipAddress: "192.168.1.100"
}

// Example 2: Proses Pengembalian
{
  id: "log-002",
  timestamp: "2024-12-05T14:15:00.000Z",
  userId: "admin-001",
  userName: "Admin Koperasi",
  action: "PROSES_PENGEMBALIAN",
  anggotaId: "ang-001",
  anggotaNama: "Budi Santoso",
  details: {
    pengembalianId: "pgb-001",
    totalPengembalian: 3400000,
    metodePembayaran: "Transfer Bank"
  },
  ipAddress: "192.168.1.100"
}

// Example 3: Cancel Keluar
{
  id: "log-003",
  timestamp: "2024-12-02T09:00:00.000Z",
  userId: "admin-001",
  userName: "Admin Koperasi",
  action: "CANCEL_KELUAR",
  anggotaId: "ang-002",
  anggotaNama: "Siti Aminah",
  details: {
    reason: "Anggota membatalkan keputusan keluar"
  },
  ipAddress: "192.168.1.100"
}
```

## 4. Journal Entry (Integration)

Pengembalian simpanan akan membuat jurnal entry otomatis. Format mengikuti struktur jurnal yang sudah ada.

### Jurnal untuk Pengembalian Simpanan Pokok:

```javascript
{
  id: "jrn-001",
  tanggal: "2024-12-05",
  keterangan: "Pengembalian Simpanan Pokok - Budi Santoso (3201010101010001)",
  entries: [
    {
      akun: "2-1100",           // Simpanan Pokok Anggota (Kewajiban)
      debit: 1000000,
      kredit: 0
    },
    {
      akun: "1-1000",           // Kas (Aset)
      debit: 0,
      kredit: 1000000
    }
  ]
}
```

### Jurnal untuk Pengembalian Simpanan Wajib:

```javascript
{
  id: "jrn-002",
  tanggal: "2024-12-05",
  keterangan: "Pengembalian Simpanan Wajib - Budi Santoso (3201010101010001)",
  entries: [
    {
      akun: "2-1200",           // Simpanan Wajib Anggota (Kewajiban)
      debit: 2400000,
      kredit: 0
    },
    {
      akun: "1-1000",           // Kas (Aset)
      debit: 0,
      kredit: 2400000
    }
  ]
}
```

## 5. LocalStorage Keys

Daftar key yang digunakan di localStorage:

- `anggota`: Array of anggota records (existing, extended with new fields)
- `pengembalian`: Array of pengembalian records (new)
- `auditLogsAnggotaKeluar`: Array of audit log entries (new)
- `simpananPokok`: Array of simpanan pokok transactions (existing, used for calculation)
- `simpananWajib`: Array of simpanan wajib transactions (existing, used for calculation)
- `pinjaman`: Array of pinjaman records (existing, used for validation)
- `jurnal`: Array of journal entries (existing, will be updated)
- `coa`: Array of chart of accounts (existing, used for journal entries)

## 6. Error Response Format

Semua fungsi yang bisa gagal akan mengembalikan format error yang konsisten:

```javascript
{
  success: false,
  error: {
    code: string,              // Error code (e.g., "ACTIVE_LOAN_EXISTS")
    message: string,           // User-friendly error message
    details: object,           // Additional context (optional)
    timestamp: string          // ISO datetime
  }
}
```

### Error Codes:

- `NOT_IMPLEMENTED`: Function not yet implemented
- `ANGGOTA_NOT_FOUND`: Anggota ID not found
- `ANGGOTA_ALREADY_KELUAR`: Anggota already has status "Keluar"
- `ACTIVE_LOAN_EXISTS`: Anggota has active pinjaman
- `INSUFFICIENT_BALANCE`: Kas/Bank balance insufficient for pengembalian
- `MISSING_PAYMENT_METHOD`: Payment method not specified
- `PENGEMBALIAN_ALREADY_PROCESSED`: Pengembalian already processed
- `CANNOT_CANCEL_PROCESSED`: Cannot cancel after pengembalian processed
- `VALIDATION_FAILED`: General validation failure
- `SYSTEM_ERROR`: Unexpected system error

## 7. Success Response Format

Fungsi yang berhasil akan mengembalikan format success yang konsisten:

```javascript
{
  success: true,
  data: object,              // Result data
  message: string            // Success message (optional)
}
```

## Migration Notes

Tidak ada migrasi data yang diperlukan. Field-field baru bersifat optional dan akan diisi saat anggota pertama kali ditandai keluar. Anggota existing akan tetap berfungsi normal dengan nilai default untuk field baru.
