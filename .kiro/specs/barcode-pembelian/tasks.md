# Implementation Plan

- [ ] 1. Tambahkan UI barcode input field pada form pembelian
  - Modifikasi fungsi `renderPembelian()` untuk menambahkan barcode input field di bagian "Item Pembelian"
  - Tambahkan label dengan badge "Scanner Ready" sebagai visual indicator
  - Tambahkan separator "ATAU" antara barcode input dan dropdown existing
  - Pastikan layout responsive dan tidak merusak tampilan existing
  - _Requirements: 1.1, 4.5_

- [ ] 2. Implementasi core barcode lookup functions
  - [ ] 2.1 Buat fungsi `findBarangByBarcode(barcode)`
    - Fungsi mencari barang dari localStorage berdasarkan barcode
    - Return barang object jika ditemukan, null jika tidak
    - Trim whitespace dari input barcode
    - Preserve leading zeros dalam barcode
    - _Requirements: 1.2, 5.1, 5.2_

  - [ ]* 2.2 Write property test untuk barcode lookup
    - **Property 1: Barcode Search Invocation**
    - **Validates: Requirements 1.2, 2.2**

  - [ ] 2.3 Buat fungsi `processBarcodeInput(barcode)`
    - Panggil `findBarangByBarcode()` untuk mencari barang
    - Jika ditemukan: auto-fill selectBarang dan hargaBeli, focus ke qtyBarang
    - Jika tidak ditemukan: tampilkan error, clear input, keep focus
    - Panggil `showBarcodeSuccess()` untuk visual feedback
    - _Requirements: 1.3, 1.4_

  - [ ]* 2.4 Write property test untuk auto-fill behavior
    - **Property 2: Auto-fill on Valid Barcode**
    - **Validates: Requirements 1.3**

  - [ ]* 2.5 Write property test untuk error handling
    - **Property 3: Error Handling for Invalid Barcode**
    - **Validates: Requirements 1.4**

- [ ] 3. Implementasi event handlers untuk barcode input
  - [ ] 3.1 Buat fungsi `handleBarcodeInput(event)`
    - Detect Enter key press pada barcode input
    - Prevent default form submission
    - Ignore jika input kosong (silent)
    - Panggil `processBarcodeInput()` dengan barcode value
    - _Requirements: 1.2, 2.2, 2.3_

  - [ ]* 3.2 Write property test untuk input sanitization
    - **Property 12: Input Sanitization**
    - **Validates: Requirements 5.1, 5.2**

  - [ ] 3.3 Buat fungsi `showBarcodeSuccess(namaBarang)`
    - Update badge indicator menjadi "✓ {namaBarang}" dengan warna primary
    - Reset badge ke "Scanner Ready" setelah 2 detik
    - _Requirements: 4.2_

- [ ] 4. Enhance qty field untuk barcode workflow
  - [ ] 4.1 Buat fungsi `enhanceQtyFieldForBarcode()`
    - Tambahkan event listener untuk Enter key pada qty field
    - Jika Enter ditekan dan ada barang terpilih, panggil `addItemPembelian()`
    - Setelah item ditambahkan, focus kembali ke barcode input
    - _Requirements: 1.5, 4.2_

  - [ ]* 4.2 Write property test untuk complete workflow
    - **Property 4: Complete Workflow After Barcode Scan**
    - **Validates: Requirements 1.5**

  - [ ]* 4.3 Write property test untuk form reset
    - **Property 10: Form Reset After Item Addition**
    - **Validates: Requirements 4.2**

- [ ] 5. Modifikasi fungsi existing untuk integrasi barcode
  - [ ] 5.1 Update `showPembelianModal()`
    - Attach event listener `handleBarcodeInput` ke barcode input field
    - Panggil `enhanceQtyFieldForBarcode()` untuk setup qty field
    - Auto-focus ke barcode input setelah modal terbuka (500ms delay)
    - _Requirements: 1.1, 4.1_

  - [ ]* 5.2 Write property test untuk dropdown independence
    - **Property 5: Dropdown Independence**
    - **Validates: Requirements 2.1**

  - [ ] 5.3 Update `addItemPembelian()` untuk barcode workflow
    - Detect jika dipanggil dari barcode workflow (cek active element)
    - Jika dari barcode workflow, focus kembali ke barcode input setelah add
    - Maintain existing functionality untuk dropdown workflow
    - _Requirements: 1.5, 2.1_

  - [ ]* 5.4 Write property test untuk input method consistency
    - **Property 6: Input Method Consistency**
    - **Validates: Requirements 2.4**

- [ ] 6. Implementasi duplicate barcode handling
  - [ ] 6.1 Enhance `addItemPembelian()` untuk detect duplicate
    - Cek apakah barangId sudah ada di itemsPembelian array
    - Jika ada: increment qty, recalculate subtotal
    - Jika tidak ada: tambahkan item baru seperti biasa
    - Tampilkan notifikasi yang sesuai (item baru vs qty ditambahkan)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 6.2 Write property test untuk duplicate handling
    - **Property 7: Duplicate Barcode Handling**
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 6.3 Write property test untuk subtotal invariant
    - **Property 8: Subtotal Invariant**
    - **Validates: Requirements 3.3**

  - [ ]* 6.4 Write property test untuk duplicate notification
    - **Property 9: Duplicate Scan Notification**
    - **Validates: Requirements 3.4**

- [ ] 7. Implementasi keyboard navigation support
  - [ ] 7.1 Ensure proper tab order
    - Barcode input → Qty → Harga Beli → Tambah button → Dropdown
    - Test dengan Tab key untuk memastikan urutan logis
    - _Requirements: 4.4_

  - [ ]* 7.2 Write property test untuk keyboard navigation
    - **Property 11: Keyboard Navigation Support**
    - **Validates: Requirements 4.4**

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Testing dan validation
  - [ ]* 9.1 Write unit tests untuk findBarangByBarcode
    - Test dengan valid barcode
    - Test dengan invalid barcode
    - Test dengan empty string
    - Test dengan whitespace-padded barcode
    - Test dengan leading zeros

  - [ ]* 9.2 Write unit tests untuk processBarcodeInput
    - Test auto-fill behavior
    - Test error notification
    - Test input clearing
    - Test focus management

  - [ ]* 9.3 Write unit tests untuk handleBarcodeInput
    - Test Enter key triggers processing
    - Test other keys do not trigger
    - Test empty input on Enter

  - [ ]* 9.4 Write integration tests untuk complete workflows
    - Test complete barcode scan workflow
    - Test mixed input methods (barcode + dropdown)
    - Test duplicate barcode workflow
    - Test error recovery workflow
    - Test keyboard navigation

- [ ] 10. Create manual testing file
  - Buat file `test_barcode_pembelian.html` untuk manual testing
  - Include test scenarios untuk barcode scanner hardware
  - Include test data dengan berbagai format barcode
  - Dokumentasikan expected behavior untuk setiap test case
  - _Requirements: All_

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
