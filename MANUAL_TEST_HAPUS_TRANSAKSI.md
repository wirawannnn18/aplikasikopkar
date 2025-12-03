# Manual Testing Guide - Hapus Transaksi POS

## Test Setup

Before testing, ensure you have test data in localStorage:
- Transactions (penjualan)
- Items (barang)
- Chart of Accounts (coa)
- Journal entries (jurnal)
- Closed shifts (riwayatTutupKas) - optional

## Test Scenarios

### 1. Test Filter dan Pencarian

#### 1.1 Search by Transaction Number
**Steps:**
1. Navigate to "Hapus Transaksi" page
2. Enter a transaction number in search field
3. Verify only matching transactions appear

**Expected:** Transactions with matching number are displayed

#### 1.2 Search by Cashier Name
**Steps:**
1. Enter a cashier name in search field
2. Verify only transactions from that cashier appear

**Expected:** Transactions with matching cashier are displayed

#### 1.3 Filter by Payment Method - Cash
**Steps:**
1. Select "Cash" from payment method dropdown
2. Verify only cash transactions appear

**Expected:** Only cash transactions are displayed

#### 1.4 Filter by Payment Method - Credit
**Steps:**
1. Select "Kredit/Bon" from payment method dropdown
2. Verify only credit transactions appear

**Expected:** Only credit transactions are displayed

#### 1.5 Filter by Date Range
**Steps:**
1. Select start date and end date
2. Verify only transactions within date range appear

**Expected:** Only transactions within the date range are displayed

#### 1.6 Combined Filters
**Steps:**
1. Apply multiple filters (search + payment method + date range)
2. Verify all filters work together correctly

**Expected:** Transactions matching ALL filter criteria are displayed

#### 1.7 Reset Filters
**Steps:**
1. Apply some filters
2. Click "Reset" button
3. Verify all filters are cleared and all transactions appear

**Expected:** All filters cleared, all transactions displayed

### 2. Test Transaction Deletion - Cash Transaction

#### 2.1 Delete Cash Transaction with Member
**Steps:**
1. Find a cash transaction with member (tipeAnggota: "Anggota")
2. Click "Hapus" button
3. Verify confirmation dialog shows all transaction details
4. Enter deletion reason (e.g., "Kesalahan input harga")
5. Click "Konfirmasi Hapus"

**Expected:**
- Success notification appears
- Transaction removed from list
- Stock restored for all items
- Journal reversal created (Debit: Pendapatan, Credit: Kas)
- HPP reversal created (Debit: Persediaan, Credit: HPP)
- Deletion log created

**Verification:**
- Check localStorage 'penjualan' - transaction should be removed
- Check localStorage 'barang' - stock should be increased
- Check localStorage 'jurnal' - reversal journals should be added
- Check localStorage 'deletionLog' - log entry should exist

#### 2.2 Delete Cash Transaction without Member
**Steps:**
1. Find a cash transaction with general customer (tipeAnggota: "Umum")
2. Click "Hapus" button
3. Enter deletion reason
4. Click "Konfirmasi Hapus"

**Expected:** Same as 2.1 but for general customer transaction

### 3. Test Transaction Deletion - Credit Transaction

#### 3.1 Delete Credit Transaction with Member
**Steps:**
1. Find a credit transaction (metode: "bon")
2. Click "Hapus" button
3. Enter deletion reason (e.g., "Transaksi dibatalkan anggota")
4. Click "Konfirmasi Hapus"

**Expected:**
- Success notification appears
- Transaction removed from list
- Stock restored for all items
- Journal reversal created (Debit: Pendapatan, Credit: Piutang Anggota)
- HPP reversal created
- Deletion log created

**Verification:**
- Check localStorage 'jurnal' - should have reversal with account 1-1200 (Piutang)

#### 3.2 Delete Credit Transaction without Member
**Steps:**
1. Find a credit transaction with general customer
2. Delete with reason
3. Verify same behavior as 3.1

### 4. Test Validation Errors

#### 4.1 Empty Reason Validation
**Steps:**
1. Click "Hapus" on any transaction
2. Leave reason field empty
3. Click "Konfirmasi Hapus"

**Expected:**
- Warning message: "Alasan penghapusan harus diisi"
- Transaction NOT deleted
- Dialog remains open

#### 4.2 Reason Too Long Validation
**Steps:**
1. Click "Hapus" on any transaction
2. Enter more than 500 characters in reason field
3. Click "Konfirmasi Hapus"

**Expected:**
- Warning message: "Alasan maksimal 500 karakter"
- Transaction NOT deleted
- Character counter shows red when >= 500

#### 4.3 Closed Shift Validation
**Steps:**
1. Create a closed shift in localStorage 'riwayatTutupKas'
2. Try to delete a transaction within that shift's time range
3. Click "Hapus" button

**Expected:**
- Error message: "Transaksi sudah masuk dalam laporan tutup kasir yang sudah ditutup dan tidak dapat dihapus"
- Confirmation dialog NOT shown
- Transaction NOT deleted

**Test Data Setup:**
```javascript
// Add to localStorage 'riwayatTutupKas'
const closedShift = {
    waktuBuka: "2024-01-15T08:00:00.000Z",
    waktuTutup: "2024-01-15T17:00:00.000Z",
    kasir: "Test Kasir"
};
```

### 5. Test Stock Restoration

#### 5.1 Stock Restoration - Items Exist
**Steps:**
1. Note current stock levels for items in a transaction
2. Delete the transaction
3. Check stock levels after deletion

**Expected:**
- Stock increased by quantity sold in transaction
- No warnings displayed

**Verification:**
```javascript
// Before deletion
const item = JSON.parse(localStorage.getItem('barang')).find(i => i.id === 'item-id');
console.log('Stock before:', item.stok);

// After deletion - stock should be: before + qty
```

#### 5.2 Stock Restoration - Item Not Found
**Steps:**
1. Create a transaction with an item that doesn't exist in 'barang'
2. Delete the transaction
3. Check for warnings

**Expected:**
- Success notification appears
- Warning message: "Barang [nama] tidak ditemukan, stok tidak dapat dikembalikan"
- Transaction still deleted successfully
- Other items' stock restored normally

**Test Data Setup:**
```javascript
// Create transaction with non-existent item
const testTransaction = {
    id: 'test-missing-item',
    noTransaksi: 'TRX-TEST-001',
    tanggal: new Date().toISOString(),
    kasir: 'Test Kasir',
    metode: 'cash',
    items: [
        { id: 'non-existent-id', nama: 'Barang Tidak Ada', qty: 5, harga: 10000, hpp: 5000 }
    ],
    total: 50000,
    status: 'lunas'
};
```

### 6. Test Journal Reversal

#### 6.1 Cash Transaction Journal Reversal
**Steps:**
1. Note current journal count
2. Delete a cash transaction
3. Check new journal entries

**Expected:**
- 2 new journal entries created
- Revenue reversal: Debit 4-1000 (Pendapatan), Credit 1-1000 (Kas)
- HPP reversal: Debit 1-1300 (Persediaan), Credit 5-1000 (HPP)
- Journal date = deletion date (current date)
- Description includes "Reversal" and transaction number

**Verification:**
```javascript
const journals = JSON.parse(localStorage.getItem('jurnal'));
const recentJournals = journals.slice(-2);
console.log('Recent journals:', recentJournals);
```

#### 6.2 Credit Transaction Journal Reversal
**Steps:**
1. Delete a credit transaction
2. Check new journal entries

**Expected:**
- 2 new journal entries created
- Revenue reversal: Debit 4-1000 (Pendapatan), Credit 1-1200 (Piutang Anggota)
- HPP reversal: Debit 1-1300 (Persediaan), Credit 5-1000 (HPP)
- Journal date = deletion date
- Description includes "Reversal" and transaction number

#### 6.3 COA Saldo Update
**Steps:**
1. Note current COA saldo for affected accounts
2. Delete a transaction
3. Check COA saldo after deletion

**Expected:**
- Kas/Piutang decreased by transaction total
- Pendapatan decreased by transaction total
- Persediaan increased by total HPP
- HPP decreased by total HPP

**Verification:**
```javascript
const coa = JSON.parse(localStorage.getItem('coa'));
const kas = coa.find(c => c.kode === '1-1000');
const pendapatan = coa.find(c => c.kode === '4-1000');
console.log('Kas saldo:', kas.saldo);
console.log('Pendapatan saldo:', pendapatan.saldo);
```

### 7. Test Cancellation

#### 7.1 Cancel Deletion
**Steps:**
1. Click "Hapus" on any transaction
2. Enter or don't enter a reason
3. Click "Batal" button

**Expected:**
- Dialog closes
- No changes to transaction data
- Transaction still exists in list
- No journal entries created
- No stock changes
- No deletion log created

#### 7.2 Close Dialog with X Button
**Steps:**
1. Click "Hapus" on any transaction
2. Click X button on dialog
3. Verify no changes made

**Expected:** Same as 7.1

### 8. Test Deletion History

#### 8.1 View Deletion History
**Steps:**
1. Navigate to "Riwayat Hapus Transaksi" page
2. Verify all deleted transactions are listed

**Expected:**
- Table shows: No Transaksi, Tanggal Transaksi, Tanggal Penghapusan, User, Alasan
- Sorted by deletion date (newest first)
- All previously deleted transactions appear

#### 8.2 View Deletion Detail
**Steps:**
1. In deletion history, click "Detail" button on any log
2. Verify detail modal shows complete information

**Expected:**
- Deletion information: User, timestamp, reason
- Stock restored status
- Journal reversed status
- Complete transaction data (items, totals, etc.)
- Warnings if any

#### 8.3 Empty Deletion History
**Steps:**
1. Clear localStorage 'deletionLog'
2. Navigate to "Riwayat Hapus Transaksi"

**Expected:**
- Empty state message: "Belum ada riwayat penghapusan transaksi"
- No table displayed

### 9. Test Edge Cases

#### 9.1 Transaction with No Items
**Steps:**
1. Create transaction with empty items array
2. Delete the transaction

**Expected:**
- Transaction deleted successfully
- No stock restoration (no items)
- Revenue reversal created
- No HPP reversal (total HPP = 0)

#### 9.2 Transaction with Zero HPP
**Steps:**
1. Create transaction where items have hpp = 0
2. Delete the transaction

**Expected:**
- Transaction deleted successfully
- Stock restored
- Revenue reversal created
- No HPP reversal (total HPP = 0)

#### 9.3 Multiple Rapid Deletions
**Steps:**
1. Delete multiple transactions quickly one after another
2. Verify each deletion completes properly

**Expected:**
- All deletions succeed
- No race conditions
- All logs created correctly

#### 9.4 Transaction Not Found
**Steps:**
1. Manually call handleDeleteTransaction with non-existent ID
2. Check error handling

**Expected:**
- Error message: "Transaksi tidak ditemukan"
- No dialog shown

### 10. Test UI/UX

#### 10.1 Character Counter
**Steps:**
1. Open deletion dialog
2. Type in reason field
3. Watch character counter

**Expected:**
- Counter updates in real-time
- Shows format: "X/500 karakter"
- Turns red when >= 500 characters

#### 10.2 Empty Transaction List
**Steps:**
1. Apply filters that return no results
2. Check empty state

**Expected:**
- Empty state icon and message displayed
- Message: "Tidak ada transaksi"

#### 10.3 Transaction Details Display
**Steps:**
1. Open deletion dialog for various transactions
2. Verify all details displayed correctly

**Expected:**
- All transaction fields shown
- Items table with all columns
- Proper formatting (dates, currency)
- Badges for payment method and status

## Test Data Setup Scripts

### Create Test Transactions

```javascript
// Run in browser console to create test data

// 1. Create test items
const testItems = [
    { id: 'item-1', nama: 'Kopi Susu', stok: 100, harga: 15000, hpp: 8000 },
    { id: 'item-2', nama: 'Teh Manis', stok: 80, harga: 10000, hpp: 5000 },
    { id: 'item-3', nama: 'Roti Bakar', stok: 50, harga: 20000, hpp: 12000 }
];
localStorage.setItem('barang', JSON.stringify(testItems));

// 2. Create test COA
const testCOA = [
    { kode: '1-1000', nama: 'Kas', tipe: 'Aset', saldo: 1000000 },
    { kode: '1-1200', nama: 'Piutang Anggota', tipe: 'Aset', saldo: 500000 },
    { kode: '1-1300', nama: 'Persediaan Barang', tipe: 'Aset', saldo: 2000000 },
    { kode: '4-1000', nama: 'Pendapatan Penjualan', tipe: 'Pendapatan', saldo: 5000000 },
    { kode: '5-1000', nama: 'Harga Pokok Penjualan', tipe: 'Beban', saldo: 2000000 }
];
localStorage.setItem('coa', JSON.stringify(testCOA));

// 3. Create test cash transaction
const cashTransaction = {
    id: 'trx-cash-001',
    noTransaksi: 'TRX-241115-001',
    tanggal: new Date('2024-11-15T10:30:00').toISOString(),
    kasir: 'Budi Santoso',
    anggotaId: 'member-001',
    tipeAnggota: 'Anggota',
    metode: 'cash',
    items: [
        { id: 'item-1', nama: 'Kopi Susu', qty: 2, harga: 15000, hpp: 8000 },
        { id: 'item-2', nama: 'Teh Manis', qty: 1, harga: 10000, hpp: 5000 }
    ],
    total: 40000,
    uangBayar: 50000,
    kembalian: 10000,
    status: 'lunas'
};

// 4. Create test credit transaction
const creditTransaction = {
    id: 'trx-credit-001',
    noTransaksi: 'TRX-241115-002',
    tanggal: new Date('2024-11-15T11:00:00').toISOString(),
    kasir: 'Siti Aminah',
    anggotaId: 'member-002',
    tipeAnggota: 'Anggota',
    metode: 'bon',
    items: [
        { id: 'item-3', nama: 'Roti Bakar', qty: 3, harga: 20000, hpp: 12000 }
    ],
    total: 60000,
    status: 'kredit'
};

// 5. Create test general customer transaction
const generalTransaction = {
    id: 'trx-general-001',
    noTransaksi: 'TRX-241115-003',
    tanggal: new Date('2024-11-15T12:00:00').toISOString(),
    kasir: 'Budi Santoso',
    anggotaId: null,
    tipeAnggota: 'Umum',
    metode: 'cash',
    items: [
        { id: 'item-1', nama: 'Kopi Susu', qty: 1, harga: 15000, hpp: 8000 }
    ],
    total: 15000,
    uangBayar: 20000,
    kembalian: 5000,
    status: 'lunas'
};

// Save transactions
const transactions = [cashTransaction, creditTransaction, generalTransaction];
localStorage.setItem('penjualan', JSON.stringify(transactions));

console.log('Test data created successfully!');
```

### Create Closed Shift for Testing

```javascript
// Create a closed shift to test validation
const closedShift = {
    id: 'shift-001',
    kasir: 'Budi Santoso',
    waktuBuka: new Date('2024-11-15T08:00:00').toISOString(),
    waktuTutup: new Date('2024-11-15T17:00:00').toISOString(),
    totalPenjualan: 100000,
    status: 'closed'
};

const riwayatTutupKas = [closedShift];
localStorage.setItem('riwayatTutupKas', JSON.stringify(riwayatTutupKas));

console.log('Closed shift created!');
```

### Create Transaction with Missing Item

```javascript
// Create transaction with item that doesn't exist in barang
const missingItemTransaction = {
    id: 'trx-missing-001',
    noTransaksi: 'TRX-241116-001',
    tanggal: new Date().toISOString(),
    kasir: 'Test Kasir',
    metode: 'cash',
    items: [
        { id: 'missing-item-id', nama: 'Barang Tidak Ada', qty: 5, harga: 10000, hpp: 5000 },
        { id: 'item-1', nama: 'Kopi Susu', qty: 1, harga: 15000, hpp: 8000 }
    ],
    total: 65000,
    uangBayar: 70000,
    kembalian: 5000,
    status: 'lunas'
};

const currentTransactions = JSON.parse(localStorage.getItem('penjualan') || '[]');
currentTransactions.push(missingItemTransaction);
localStorage.setItem('penjualan', JSON.stringify(currentTransactions));

console.log('Transaction with missing item created!');
```

## Bug Tracking

### Bugs Found During Testing

| # | Description | Severity | Status | Fix |
|---|-------------|----------|--------|-----|
| 1 | | | | |
| 2 | | | | |

## Test Results Summary

### Test Execution Date: ___________

| Test Category | Total Tests | Passed | Failed | Notes |
|---------------|-------------|--------|--------|-------|
| Filter & Search | 7 | | | |
| Cash Transactions | 2 | | | |
| Credit Transactions | 2 | | | |
| Validation Errors | 3 | | | |
| Stock Restoration | 2 | | | |
| Journal Reversal | 3 | | | |
| Cancellation | 2 | | | |
| Deletion History | 3 | | | |
| Edge Cases | 4 | | | |
| UI/UX | 3 | | | |
| **TOTAL** | **31** | | | |

## Sign-off

Tested by: ___________________
Date: ___________________
Approved by: ___________________
