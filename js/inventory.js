// Inventory Module

function renderBarang() {
    const content = document.getElementById('mainContent');
    const barang = JSON.parse(localStorage.getItem('barang') || '[]');
    const kategori = JSON.parse(localStorage.getItem('kategori') || '[]');
    const satuan = JSON.parse(localStorage.getItem('satuan') || '[]');
    
    content.innerHTML = `
        <h2>Master Barang</h2>
        <div class="mb-3">
            <button class="btn btn-primary" onclick="showBarangModal()">Tambah Barang</button>
            <button class="btn btn-secondary" onclick="showKategoriModal()">Kelola Kategori</button>
            <button class="btn btn-secondary" onclick="showSatuanModal()">Kelola Satuan</button>
        </div>
        <table class="table">
            <thead>
                <tr><th>Barcode</th><th>Nama</th><th>Kategori</th><th>Satuan</th><th>Stok</th><th>HPP</th><th>Harga Jual</th><th>Aksi</th></tr>
            </thead>
            <tbody>
                ${barang.map(b => {
                    const kat = kategori.find(k => k.id === b.kategoriId);
                    const sat = satuan.find(s => s.id === b.satuanId);
                    return `
                        <tr>
                            <td>${b.barcode}</td>
                            <td>${b.nama}</td>
                            <td>${kat?.nama || '-'}</td>
                            <td>${sat?.nama || '-'}</td>
                            <td>${b.stok}</td>
                            <td>${formatRupiah(b.hpp)}</td>
                            <td>${formatRupiah(b.hargaJual)}</td>
                            <td>
                                <button class="btn btn-sm btn-warning" onclick="editBarang('${b.id}')">Edit</button>
                                <button class="btn btn-sm btn-danger" onclick="deleteBarang('${b.id}')">Hapus</button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
        
        <!-- Modal Barang -->
        <div class="modal fade" id="barangModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Form Barang</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="barangForm">
                            <input type="hidden" id="barangId">
                            <div class="mb-3">
                                <label class="form-label">Barcode</label>
                                <input type="text" class="form-control" id="barcode" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Nama Barang</label>
                                <input type="text" class="form-control" id="namaBarang" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Kategori</label>
                                <select class="form-select" id="kategoriBarang">
                                    <option value="">Pilih Kategori</option>
                                    ${kategori.map(k => `<option value="${k.id}">${k.nama}</option>`).join('')}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Satuan</label>
                                <select class="form-select" id="satuanBarang">
                                    <option value="">Pilih Satuan</option>
                                    ${satuan.map(s => `<option value="${s.id}">${s.nama}</option>`).join('')}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Stok Awal</label>
                                <input type="number" class="form-control" id="stokBarang" value="0">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">HPP (Harga Pokok)</label>
                                <input type="number" class="form-control" id="hppBarang" value="0">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Harga Jual</label>
                                <input type="number" class="form-control" id="hargaJualBarang" value="0">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="button" class="btn btn-primary" onclick="saveBarang()">Simpan</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showBarangModal() {
    document.getElementById('barangForm').reset();
    document.getElementById('barangId').value = '';
    new bootstrap.Modal(document.getElementById('barangModal')).show();
}

function editBarang(id) {
    const barang = JSON.parse(localStorage.getItem('barang') || '[]');
    const item = barang.find(b => b.id === id);
    if (item) {
        document.getElementById('barangId').value = item.id;
        document.getElementById('barcode').value = item.barcode;
        document.getElementById('namaBarang').value = item.nama;
        document.getElementById('kategoriBarang').value = item.kategoriId;
        document.getElementById('satuanBarang').value = item.satuanId;
        document.getElementById('stokBarang').value = item.stok;
        document.getElementById('hppBarang').value = item.hpp;
        document.getElementById('hargaJualBarang').value = item.hargaJual;
        new bootstrap.Modal(document.getElementById('barangModal')).show();
    }
}

function saveBarang() {
    const barang = JSON.parse(localStorage.getItem('barang') || '[]');
    const id = document.getElementById('barangId').value;
    
    const data = {
        id: id || generateId(),
        barcode: document.getElementById('barcode').value,
        nama: document.getElementById('namaBarang').value,
        kategoriId: document.getElementById('kategoriBarang').value,
        satuanId: document.getElementById('satuanBarang').value,
        stok: parseFloat(document.getElementById('stokBarang').value) || 0,
        hpp: parseFloat(document.getElementById('hppBarang').value) || 0,
        hargaJual: parseFloat(document.getElementById('hargaJualBarang').value) || 0
    };
    
    if (id) {
        const index = barang.findIndex(b => b.id === id);
        barang[index] = data;
    } else {
        barang.push(data);
    }
    
    localStorage.setItem('barang', JSON.stringify(barang));
    bootstrap.Modal.getInstance(document.getElementById('barangModal')).hide();
    showAlert('Data barang berhasil disimpan');
    renderBarang();
}

function deleteBarang(id) {
    if (confirm('Yakin ingin menghapus barang ini?')) {
        let barang = JSON.parse(localStorage.getItem('barang') || '[]');
        barang = barang.filter(b => b.id !== id);
        localStorage.setItem('barang', JSON.stringify(barang));
        showAlert('Data barang berhasil dihapus', 'info');
        renderBarang();
    }
}

function renderSupplier() {
    const content = document.getElementById('mainContent');
    const supplier = JSON.parse(localStorage.getItem('supplier') || '[]');
    
    content.innerHTML = `
        <h2>Data Supplier</h2>
        <button class="btn btn-primary mb-3" onclick="showSupplierModal()">Tambah Supplier</button>
        <table class="table">
            <thead>
                <tr><th>Nama</th><th>Telepon</th><th>Alamat</th><th>Aksi</th></tr>
            </thead>
            <tbody>
                ${supplier.map(s => `
                    <tr>
                        <td>${s.nama}</td>
                        <td>${s.telepon}</td>
                        <td>${s.alamat}</td>
                        <td>
                            <button class="btn btn-sm btn-warning" onclick="editSupplier('${s.id}')">Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteSupplier('${s.id}')">Hapus</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div class="modal fade" id="supplierModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Form Supplier</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="supplierForm">
                            <input type="hidden" id="supplierId">
                            <div class="mb-3">
                                <label class="form-label">Nama Supplier</label>
                                <input type="text" class="form-control" id="namaSupplier" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Telepon</label>
                                <input type="text" class="form-control" id="teleponSupplier">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Alamat</label>
                                <textarea class="form-control" id="alamatSupplier" rows="3"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="button" class="btn btn-primary" onclick="saveSupplier()">Simpan</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showSupplierModal() {
    document.getElementById('supplierForm').reset();
    document.getElementById('supplierId').value = '';
    new bootstrap.Modal(document.getElementById('supplierModal')).show();
}

function saveSupplier() {
    const supplier = JSON.parse(localStorage.getItem('supplier') || '[]');
    const id = document.getElementById('supplierId').value;
    
    const data = {
        id: id || generateId(),
        nama: document.getElementById('namaSupplier').value,
        telepon: document.getElementById('teleponSupplier').value,
        alamat: document.getElementById('alamatSupplier').value
    };
    
    if (id) {
        const index = supplier.findIndex(s => s.id === id);
        supplier[index] = data;
    } else {
        supplier.push(data);
    }
    
    localStorage.setItem('supplier', JSON.stringify(supplier));
    bootstrap.Modal.getInstance(document.getElementById('supplierModal')).hide();
    showAlert('Data supplier berhasil disimpan');
    renderSupplier();
}

function renderPembelian() {
    const content = document.getElementById('mainContent');
    const pembelian = JSON.parse(localStorage.getItem('pembelian') || '[]');
    const supplier = JSON.parse(localStorage.getItem('supplier') || '[]');
    
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 style="color: #2d6a4f; font-weight: 700;">
                <i class="bi bi-bag-plus me-2"></i>Pembelian Barang
            </h2>
        </div>
        
        <div class="row mb-3">
            <div class="col-md-4">
                <div class="card">
                    <div class="card-body text-center">
                        <h6 class="text-muted">Total Pembelian</h6>
                        <h3 style="color: #2d6a4f;">${formatRupiah(pembelian.reduce((sum, p) => sum + p.total, 0))}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-body text-center">
                        <h6 class="text-muted">Jumlah Transaksi</h6>
                        <h3 style="color: #52b788;">${pembelian.length}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-body text-center">
                        <h6 class="text-muted">Supplier Aktif</h6>
                        <h3 style="color: #40916c;">${supplier.length}</h3>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <div class="d-flex justify-content-between align-items-center">
                    <span><i class="bi bi-list-ul me-2"></i>Daftar Pembelian</span>
                    <button class="btn btn-primary btn-sm" onclick="showPembelianModal()">
                        <i class="bi bi-plus-circle me-1"></i>Input Pembelian
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>No. Faktur</th>
                                <th>Tanggal</th>
                                <th>Supplier</th>
                                <th>Total Item</th>
                                <th>Total Harga</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pembelian.map(p => {
                                const sup = supplier.find(s => s.id === p.supplierId);
                                return `
                                    <tr>
                                        <td>${p.noFaktur}</td>
                                        <td>${formatDate(p.tanggal)}</td>
                                        <td>${sup?.nama || 'Langsung'}</td>
                                        <td>${p.items.length} item</td>
                                        <td>${formatRupiah(p.total)}</td>
                                        <td>
                                            <span class="badge ${p.status === 'selesai' ? 'bg-success' : 'bg-warning'}">
                                                ${p.status === 'selesai' ? 'Selesai' : 'Pending'}
                                            </span>
                                        </td>
                                        <td>
                                            <button class="btn btn-sm btn-warning" onclick="editPembelian('${p.id}')" title="Edit">
                                                <i class="bi bi-pencil"></i>
                                            </button>
                                            <button class="btn btn-sm btn-danger" onclick="deletePembelian('${p.id}')" title="Hapus">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                            <button class="btn btn-sm btn-info" onclick="viewPembelian('${p.id}')" title="Detail">
                                                <i class="bi bi-eye"></i>
                                            </button>
                                            <button class="btn btn-sm btn-success" onclick="printPembelian('${p.id}')" title="Print">
                                                <i class="bi bi-printer"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <!-- Modal Pembelian -->
        <div class="modal fade" id="pembelianModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Input Pembelian Barang</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="pembelianForm">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label">No. Faktur</label>
                                        <input type="text" class="form-control" id="noFaktur" required>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label">Tanggal</label>
                                        <input type="date" class="form-control" id="tanggalPembelian" required>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label">Supplier</label>
                                        <select class="form-select" id="supplierPembelian">
                                            <option value="">Pembelian Langsung</option>
                                            ${supplier.map(s => `<option value="${s.id}">${s.nama}</option>`).join('')}
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <hr>
                            <h6>Item Pembelian</h6>
                            
                            <!-- Barcode Scanner Input -->
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <label class="form-label">
                                        <i class="bi bi-upc-scan me-1"></i>Scan Barcode
                                        <span class="badge bg-success ms-2" id="barcodeBadge">
                                            <i class="bi bi-upc-scan"></i> Scanner Ready
                                        </span>
                                    </label>
                                    <input type="text" 
                                           class="form-control" 
                                           id="barcodeInput" 
                                           placeholder="Scan barcode atau ketik manual lalu tekan Enter..."
                                           autocomplete="off"
                                           tabindex="1">
                                    <small class="text-muted">Scan barcode atau tekan Enter untuk mencari barang</small>
                                </div>
                            </div>
                            
                            <!-- Separator -->
                            <div class="text-center mb-3">
                                <span class="badge bg-secondary">ATAU</span>
                            </div>
                            
                            <!-- Item Search Section -->
                            <div class="row mb-3">
                                <div class="col-md-6">
                                    <div id="itemSearchContainer">
                                        <!-- Search field will be rendered here -->
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div id="categoryFilterContainer">
                                        <!-- Category filter will be rendered here -->
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Manual Selection (Existing) -->
                            <div class="row mb-3">
                                <div class="col-md-4">
                                    <label class="form-label">Pilih Barang Manual</label>
                                    <select class="form-select" id="selectBarang" tabindex="5">
                                        <option value="">-- Pilih Barang --</option>
                                    </select>
                                </div>
                                <div class="col-md-2">
                                    <label class="form-label">Qty</label>
                                    <input type="number" class="form-control" id="qtyBarang" min="1" value="1" tabindex="2">
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label">Harga Beli</label>
                                    <input type="number" class="form-control" id="hargaBeli" min="0" tabindex="3">
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label">&nbsp;</label>
                                    <button type="button" class="btn btn-success w-100" onclick="addItemPembelian()" tabindex="4">
                                        <i class="bi bi-plus-circle me-1"></i>Tambah
                                    </button>
                                </div>
                            </div>
                            
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Barang</th>
                                            <th>Qty</th>
                                            <th>Harga</th>
                                            <th>Subtotal</th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody id="itemPembelianList"></tbody>
                                    <tfoot>
                                        <tr>
                                            <th colspan="3" class="text-end">Total:</th>
                                            <th id="totalPembelian">Rp 0</th>
                                            <th></th>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="button" class="btn btn-info" onclick="previewPembelian()">
                            <i class="bi bi-eye me-1"></i>Preview
                        </button>
                        <button type="button" class="btn btn-success" onclick="savePembelian(true)">
                            <i class="bi bi-printer me-1"></i>Simpan & Print
                        </button>
                        <button type="button" class="btn btn-primary" onclick="savePembelian(false)">
                            <i class="bi bi-save me-1"></i>Simpan
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Modal Detail Pembelian -->
        <div class="modal fade" id="detailPembelianModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Detail Pembelian</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="detailPembelianContent"></div>
                </div>
            </div>
        </div>
    `;
}

let itemsPembelian = [];
let isEditMode = false;
let editingTransactionId = null;

function showPembelianModal() {
    itemsPembelian = [];
    isEditMode = false;
    editingTransactionId = null;
    document.getElementById('pembelianForm').reset();
    document.getElementById('tanggalPembelian').value = new Date().toISOString().split('T')[0];
    document.getElementById('noFaktur').value = 'PB' + Date.now();
    
    // Load barang list
    const barang = JSON.parse(localStorage.getItem('barang') || '[]');
    const selectBarang = document.getElementById('selectBarang');
    selectBarang.innerHTML = '<option value="">-- Pilih Barang --</option>' + 
        barang.map(b => `<option value="${b.id}" data-nama="${b.nama}">${b.nama} - ${b.barcode}</option>`).join('');
    
    // Set harga when barang selected
    selectBarang.addEventListener('change', function() {
        const barangId = this.value;
        if (barangId) {
            const item = barang.find(b => b.id === barangId);
            if (item) {
                document.getElementById('hargaBeli').value = item.hpp || 0;
            }
        }
    });
    
    updateItemPembelianList();
    
    // Initialize search components
    initializeItemSearch();
    
    // Setup modal close event listener to reset form and flags
    const modalElement = document.getElementById('pembelianModal');
    const modal = new bootstrap.Modal(modalElement);
    
    // Add event listener for modal hidden event
    modalElement.addEventListener('hidden.bs.modal', function() {
        // Reset form dan flags (isEditMode, editingTransactionId)
        resetPembelianForm();
    }, { once: true }); // Use once: true to prevent multiple listeners
    
    // Setup barcode input event listener
    const barcodeInput = document.getElementById('barcodeInput');
    if (barcodeInput) {
        barcodeInput.addEventListener('keypress', handleBarcodeInput);
        
        // Auto-focus ke barcode input saat modal dibuka
        setTimeout(() => {
            barcodeInput.focus();
        }, 500);
    }
    
    // Enhance qty field untuk barcode workflow
    enhanceQtyFieldForBarcode();
    
    modal.show();
}

// Function to reset pembelian form and flags
function resetPembelianForm() {
    // Reset form
    document.getElementById('pembelianForm').reset();
    
    // Reset flags
    isEditMode = false;
    editingTransactionId = null;
    
    // Clear items array
    itemsPembelian = [];
    
    // Cleanup barcode input event listener
    const barcodeInput = document.getElementById('barcodeInput');
    if (barcodeInput) {
        barcodeInput.removeEventListener('keypress', handleBarcodeInput);
    }
    
    // Cleanup qty field event listener
    const qtyField = document.getElementById('qtyBarang');
    if (qtyField) {
        qtyField.removeEventListener('keypress', handleQtyFieldEnter);
    }
    
    // Update display
    updateItemPembelianList();
}

function editPembelian(id) {
    // Retrieve transaksi dari LocalStorage berdasarkan id
    const pembelian = JSON.parse(localStorage.getItem('pembelian') || '[]');
    const transaksi = pembelian.find(p => p.id === id);
    
    if (!transaksi) {
        showAlert('❌ Transaksi tidak ditemukan', 'danger');
        return;
    }
    
    // Set flag edit mode
    isEditMode = true;
    editingTransactionId = id;
    
    // Populate form fields
    document.getElementById('noFaktur').value = transaksi.noFaktur;
    document.getElementById('tanggalPembelian').value = transaksi.tanggal;
    document.getElementById('supplierPembelian').value = transaksi.supplierId || '';
    
    // Load items ke array itemsPembelian
    itemsPembelian = JSON.parse(JSON.stringify(transaksi.items)); // Deep copy
    
    // Load barang list
    const barang = JSON.parse(localStorage.getItem('barang') || '[]');
    const selectBarang = document.getElementById('selectBarang');
    selectBarang.innerHTML = '<option value="">-- Pilih Barang --</option>' + 
        barang.map(b => `<option value="${b.id}" data-nama="${b.nama}">${b.nama} - ${b.barcode}</option>`).join('');
    
    // Set harga when barang selected
    selectBarang.addEventListener('change', function() {
        const barangId = this.value;
        if (barangId) {
            const item = barang.find(b => b.id === barangId);
            if (item) {
                document.getElementById('hargaBeli').value = item.hpp || 0;
            }
        }
    });
    
    // Update item list display
    updateItemPembelianList();
    
    // Setup modal close event listener to reset form and flags
    const modalElement = document.getElementById('pembelianModal');
    const modal = new bootstrap.Modal(modalElement);
    
    // Add event listener for modal hidden event
    modalElement.addEventListener('hidden.bs.modal', function() {
        // Reset form dan flags (isEditMode, editingTransactionId) when modal closes
        resetPembelianForm();
    }, { once: true }); // Use once: true to prevent multiple listeners
    
    // Setup barcode input event listener
    const barcodeInput = document.getElementById('barcodeInput');
    if (barcodeInput) {
        barcodeInput.addEventListener('keypress', handleBarcodeInput);
        
        // Auto-focus ke barcode input saat modal dibuka
        setTimeout(() => {
            barcodeInput.focus();
        }, 500);
    }
    
    // Enhance qty field untuk barcode workflow
    enhanceQtyFieldForBarcode();
    
    // Show modal pembelian
    modal.show();
}

function addItemPembelian() {
    const selectBarang = document.getElementById('selectBarang');
    const barangId = selectBarang.value;
    const barangNama = selectBarang.options[selectBarang.selectedIndex].getAttribute('data-nama');
    const qty = parseInt(document.getElementById('qtyBarang').value);
    const harga = parseFloat(document.getElementById('hargaBeli').value);
    
    // Validate barang selected
    if (!barangId) {
        showAlert('Pilih barang terlebih dahulu!', 'warning');
        document.getElementById('selectBarang').focus();
        return;
    }
    
    // Validate qty
    if (!qty || qty <= 0) {
        showAlert('Qty harus lebih dari 0!', 'warning');
        document.getElementById('qtyBarang').focus();
        return;
    }
    
    // Validate harga
    if (harga === null || harga === undefined || isNaN(harga)) {
        showAlert('Harga beli harus diisi!', 'warning');
        document.getElementById('hargaBeli').focus();
        return;
    }
    
    if (harga < 0) {
        showAlert('Harga tidak boleh negatif!', 'warning');
        document.getElementById('hargaBeli').focus();
        return;
    }
    
    // Check if item already exists
    const existingIndex = itemsPembelian.findIndex(item => item.barangId === barangId);
    let isDuplicate = false;
    
    if (existingIndex !== -1) {
        // Item sudah ada, increment qty
        isDuplicate = true;
        const oldQty = itemsPembelian[existingIndex].qty;
        itemsPembelian[existingIndex].qty += qty;
        itemsPembelian[existingIndex].subtotal = itemsPembelian[existingIndex].qty * itemsPembelian[existingIndex].harga;
        
        // Show notification untuk duplicate
        showAlert(`✓ Qty untuk "${barangNama}" ditambahkan (${oldQty} → ${itemsPembelian[existingIndex].qty})`, 'info');
    } else {
        // Item baru
        itemsPembelian.push({
            barangId: barangId,
            nama: barangNama,
            qty: qty,
            harga: harga,
            subtotal: qty * harga
        });
        
        // Show notification untuk item baru
        showAlert(`✓ "${barangNama}" ditambahkan ke daftar`, 'success');
    }
    
    // Reset form
    document.getElementById('selectBarang').value = '';
    document.getElementById('qtyBarang').value = 1;
    document.getElementById('hargaBeli').value = '';
    
    // Clear barcode input if exists
    const barcodeInput = document.getElementById('barcodeInput');
    if (barcodeInput) {
        barcodeInput.value = '';
    }
    
    updateItemPembelianList();
    
    // Jika dipanggil dari barcode workflow, focus kembali ke barcode input
    // Detect barcode workflow: jika qty field yang aktif atau baru saja aktif
    if (barcodeInput && document.activeElement === document.getElementById('qtyBarang')) {
        setTimeout(() => {
            barcodeInput.focus();
        }, 100);
    }
}

function removeItemPembelian(index) {
    itemsPembelian.splice(index, 1);
    updateItemPembelianList();
}

function removeItemFromEdit(index) {
    // Remove item from array
    itemsPembelian.splice(index, 1);
    // Update total setelah item dihapus
    updateItemPembelianList();
}

function updateItemQty(index, newQty) {
    // Update qty saat berubah
    const qty = parseFloat(newQty);
    
    // Validate qty
    if (isNaN(qty) || qty <= 0) {
        showAlert(`Qty harus lebih dari 0!`, 'warning');
        // Reset to previous value
        updateItemPembelianList();
        return;
    }
    
    itemsPembelian[index].qty = qty;
    // Recalculate subtotal
    itemsPembelian[index].subtotal = itemsPembelian[index].qty * itemsPembelian[index].harga;
    // Update total pembelian
    updateItemPembelianList();
}

function updateItemHarga(index, newHarga) {
    // Update harga saat berubah
    const harga = parseFloat(newHarga);
    
    // Validate harga
    if (isNaN(harga) || harga < 0) {
        showAlert('Harga tidak boleh negatif!', 'warning');
        // Reset to previous value
        updateItemPembelianList();
        return;
    }
    
    itemsPembelian[index].harga = harga;
    // Recalculate subtotal
    itemsPembelian[index].subtotal = itemsPembelian[index].qty * itemsPembelian[index].harga;
    // Update total pembelian
    updateItemPembelianList();
}

function updateItemPembelianList() {
    const tbody = document.getElementById('itemPembelianList');
    const removeFunction = isEditMode ? 'removeItemFromEdit' : 'removeItemPembelian';
    
    tbody.innerHTML = itemsPembelian.map((item, index) => `
        <tr>
            <td>${item.nama}</td>
            <td>
                <input type="number" class="form-control form-control-sm" 
                       value="${item.qty}" min="1" 
                       onchange="updateItemQty(${index}, this.value)"
                       style="width: 80px;">
            </td>
            <td>
                <input type="number" class="form-control form-control-sm" 
                       value="${item.harga}" min="0" 
                       onchange="updateItemHarga(${index}, this.value)"
                       style="width: 120px;">
            </td>
            <td>${formatRupiah(item.subtotal)}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="${removeFunction}(${index})" title="Hapus item">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    const total = itemsPembelian.reduce((sum, item) => sum + item.subtotal, 0);
    document.getElementById('totalPembelian').textContent = formatRupiah(total);
}

function previewPembelian() {
    if (itemsPembelian.length === 0) {
        showAlert('Tambahkan minimal 1 item untuk preview!', 'warning');
        return;
    }
    
    const koperasi = JSON.parse(localStorage.getItem('koperasi'));
    const supplier = JSON.parse(localStorage.getItem('supplier') || '[]');
    const supplierId = document.getElementById('supplierPembelian').value;
    const sup = supplier.find(s => s.id === supplierId);
    const noFaktur = document.getElementById('noFaktur').value;
    const tanggal = document.getElementById('tanggalPembelian').value;
    const total = itemsPembelian.reduce((sum, item) => sum + item.subtotal, 0);
    
    const previewWindow = window.open('', '', 'width=800,height=600');
    previewWindow.document.write(`
        <html>
        <head>
            <title>Preview Faktur Pembelian - ${noFaktur}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2d6a4f; padding-bottom: 15px; }
                .logo { max-width: 100px; max-height: 100px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                th { background-color: #2d6a4f; color: white; }
                .total { font-weight: bold; font-size: 1.2em; background-color: #e9f5f0; }
                .info { margin: 20px 0; }
                .info-table { border: none; }
                .info-table td { border: none; padding: 5px; }
                .watermark { 
                    position: fixed; 
                    top: 50%; 
                    left: 50%; 
                    transform: translate(-50%, -50%) rotate(-45deg);
                    font-size: 100px;
                    color: rgba(45, 106, 79, 0.1);
                    z-index: -1;
                }
                .print-btn {
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    padding: 10px 20px;
                    background: #2d6a4f;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                }
                .print-btn:hover {
                    background: #1b4332;
                }
                @media print {
                    .print-btn { display: none; }
                    .watermark { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="watermark">PREVIEW</div>
            <button class="print-btn" onclick="window.print()">🖨️ Print</button>
            
            <div class="header">
                ${koperasi.logo ? `<img src="${koperasi.logo}" class="logo">` : ''}
                <h2 style="margin: 10px 0; color: #2d6a4f;">${koperasi.nama || 'Koperasi Karyawan'}</h2>
                <p style="margin: 5px 0;">${koperasi.alamat || ''}</p>
                ${koperasi.telepon ? `<p style="margin: 5px 0;">Telp: ${koperasi.telepon}</p>` : ''}
                <h3 style="margin-top: 15px; color: #2d6a4f;">FAKTUR PEMBELIAN</h3>
            </div>
            
            <div class="info">
                <table class="info-table">
                    <tr>
                        <td style="width: 150px;"><strong>No. Faktur:</strong></td>
                        <td>${noFaktur}</td>
                        <td style="width: 150px;"><strong>Tanggal:</strong></td>
                        <td>${new Date(tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                    </tr>
                    <tr>
                        <td><strong>Supplier:</strong></td>
                        <td colspan="3">${sup?.nama || 'Pembelian Langsung'}</td>
                    </tr>
                </table>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th style="width: 50px;">No</th>
                        <th>Nama Barang</th>
                        <th style="width: 100px;">Qty</th>
                        <th style="width: 150px;">Harga</th>
                        <th style="width: 150px;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsPembelian.map((item, idx) => `
                        <tr>
                            <td style="text-align: center;">${idx + 1}</td>
                            <td>${item.nama}</td>
                            <td style="text-align: center;">${item.qty}</td>
                            <td style="text-align: right;">${formatRupiah(item.harga)}</td>
                            <td style="text-align: right;">${formatRupiah(item.subtotal)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr class="total">
                        <td colspan="4" style="text-align: right; padding-right: 20px;">TOTAL:</td>
                        <td style="text-align: right;">${formatRupiah(total)}</td>
                    </tr>
                </tfoot>
            </table>
            
            <div style="margin-top: 60px;">
                <div style="float: left; width: 45%; text-align: center;">
                    <p style="margin-bottom: 80px;">Penerima,</p>
                    <p style="border-top: 1px solid #000; display: inline-block; padding-top: 5px; min-width: 200px;">
                        (________________)
                    </p>
                </div>
                <div style="float: right; width: 45%; text-align: center;">
                    <p style="margin-bottom: 80px;">Hormat Kami,</p>
                    <p style="border-top: 1px solid #000; display: inline-block; padding-top: 5px; min-width: 200px;">
                        (________________)
                    </p>
                </div>
                <div style="clear: both;"></div>
            </div>
            
            <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
                <p>Dokumen ini dicetak dari Sistem Koperasi Karyawan</p>
            </div>
        </body>
        </html>
    `);
    previewWindow.document.close();
}

function savePembelian(printAfterSave = false) {
    // Check if in edit mode
    if (isEditMode && editingTransactionId) {
        savePembelianEdit(editingTransactionId);
        return;
    }
    
    // Validate required fields (noFaktur, tanggal)
    const noFaktur = document.getElementById('noFaktur').value.trim();
    const tanggal = document.getElementById('tanggalPembelian').value;
    
    if (!noFaktur) {
        showAlert('No. Faktur harus diisi!', 'warning');
        document.getElementById('noFaktur').focus();
        return;
    }
    
    if (!tanggal) {
        showAlert('Tanggal pembelian harus diisi!', 'warning');
        document.getElementById('tanggalPembelian').focus();
        return;
    }
    
    // Validate empty items list dengan pesan "Tambahkan minimal 1 item pembelian"
    if (itemsPembelian.length === 0) {
        showAlert('Tambahkan minimal 1 item pembelian', 'warning');
        return;
    }
    
    // Validate negative qty/harga in items
    for (let i = 0; i < itemsPembelian.length; i++) {
        const item = itemsPembelian[i];
        
        if (item.qty <= 0) {
            showAlert(`Item "${item.nama}": Qty harus lebih dari 0!`, 'warning');
            return;
        }
        
        if (item.harga < 0) {
            showAlert(`Item "${item.nama}": Harga tidak boleh negatif!`, 'warning');
            return;
        }
    }
    
    const pembelian = JSON.parse(localStorage.getItem('pembelian') || '[]');
    const barang = JSON.parse(localStorage.getItem('barang') || '[]');
    
    const total = itemsPembelian.reduce((sum, item) => sum + item.subtotal, 0);
    
    const data = {
        id: generateId(),
        noFaktur: document.getElementById('noFaktur').value,
        tanggal: document.getElementById('tanggalPembelian').value,
        supplierId: document.getElementById('supplierPembelian').value || null,
        items: itemsPembelian,
        total: total,
        status: 'selesai'
    };
    
    // Update stok barang
    itemsPembelian.forEach(item => {
        const barangIndex = barang.findIndex(b => b.id === item.barangId);
        if (barangIndex !== -1) {
            barang[barangIndex].stok += item.qty;
            // Update HPP dengan average
            const totalNilai = (barang[barangIndex].hpp * (barang[barangIndex].stok - item.qty)) + (item.harga * item.qty);
            barang[barangIndex].hpp = totalNilai / barang[barangIndex].stok;
        }
    });
    
    pembelian.push(data);
    localStorage.setItem('pembelian', JSON.stringify(pembelian));
    localStorage.setItem('barang', JSON.stringify(barang));
    
    // Update jurnal akuntansi
    // Debit: Persediaan Barang (Aset bertambah)
    // Kredit: Kas (Aset berkurang karena keluar uang)
    addJurnal(`Pembelian Barang - ${data.noFaktur}`, [
        { akun: '1-1300', debit: total, kredit: 0 },  // Persediaan Barang (Debit)
        { akun: '1-1000', debit: 0, kredit: total }   // Kas (Kredit)
    ], data.tanggal);
    
    // Close modal setelah save
    const modalInstance = bootstrap.Modal.getInstance(document.getElementById('pembelianModal'));
    if (modalInstance) {
        modalInstance.hide();
    }
    
    // Reset form dan flags
    resetPembelianForm();
    
    showAlert('✓ Pembelian berhasil disimpan, stok dan kas telah diupdate', 'success');
    
    // Print if requested
    if (printAfterSave) {
        setTimeout(() => {
            printPembelian(data.id);
        }, 500);
    }
    
    // Re-render daftar pembelian dengan data terbaru
    renderPembelian();
}

function recalculateHPPOnEdit(barangId, oldQty, oldHarga, newQty, newHarga) {
    const barang = JSON.parse(localStorage.getItem('barang') || '[]');
    const barangIndex = barang.findIndex(b => b.id === barangId);
    
    if (barangIndex === -1) {
        console.warn(`Barang dengan id ${barangId} tidak ditemukan`);
        return;
    }
    
    const currentStok = barang[barangIndex].stok;
    const currentHPP = barang[barangIndex].hpp || 0;
    
    // Remove old purchase impact dari HPP
    // totalValue = (currentStok * currentHPP) - (oldQty * oldHarga)
    let totalValue = (currentStok * currentHPP) - (oldQty * oldHarga);
    let newStok = currentStok - oldQty;
    
    // Add new purchase impact
    totalValue += (newQty * newHarga);
    newStok += newQty;
    
    // Calculate weighted average: newHPP = totalValue / newStok
    if (newStok > 0) {
        barang[barangIndex].hpp = totalValue / newStok;
    } else {
        barang[barangIndex].hpp = 0;
    }
    
    // Update HPP barang di LocalStorage
    localStorage.setItem('barang', JSON.stringify(barang));
    
    return barang[barangIndex].hpp;
}

function adjustStockForEdit(oldItems, newItems) {
    const barang = JSON.parse(localStorage.getItem('barang') || '[]');
    const errors = [];
    
    // Create maps for easier comparison
    const oldItemsMap = {};
    oldItems.forEach(item => {
        oldItemsMap[item.barangId] = item;
    });
    
    const newItemsMap = {};
    newItems.forEach(item => {
        newItemsMap[item.barangId] = item;
    });
    
    // Get all unique barangIds from both old and new items
    const allBarangIds = new Set([...Object.keys(oldItemsMap), ...Object.keys(newItemsMap)]);
    
    allBarangIds.forEach(barangId => {
        const oldItem = oldItemsMap[barangId];
        const newItem = newItemsMap[barangId];
        const barangIndex = barang.findIndex(b => b.id === barangId);
        
        if (barangIndex === -1) {
            const itemName = oldItem?.nama || newItem?.nama || barangId;
            errors.push(`Barang "${itemName}" tidak ditemukan dalam sistem`);
            return;
        }
        
        let oldQty = oldItem ? oldItem.qty : 0;
        let oldHarga = oldItem ? oldItem.harga : 0;
        let newQty = newItem ? newItem.qty : 0;
        let newHarga = newItem ? newItem.harga : 0;
        
        // Calculate qty difference: newStok = currentStok - oldQty + newQty
        const qtyDifference = newQty - oldQty;
        barang[barangIndex].stok += qtyDifference;
        
        // Ensure stock doesn't go negative
        if (barang[barangIndex].stok < 0) {
            console.warn(`Stok barang ${barang[barangIndex].nama} menjadi negatif: ${barang[barangIndex].stok}`);
        }
        
        // Recalculate HPP if there's any change in qty or harga
        if (oldQty !== newQty || oldHarga !== newHarga) {
            recalculateHPPOnEdit(barangId, oldQty, oldHarga, newQty, newHarga);
        }
    });
    
    // Throw error if any items not found
    if (errors.length > 0) {
        throw new Error(errors.join(', '));
    }
    
    // Update barang array di LocalStorage (already updated by recalculateHPPOnEdit, but update stock changes)
    localStorage.setItem('barang', JSON.stringify(barang));
    
    return barang;
}

function savePembelianEdit(id) {
    // Validate required fields (noFaktur, tanggal)
    const noFaktur = document.getElementById('noFaktur').value.trim();
    const tanggal = document.getElementById('tanggalPembelian').value;
    
    if (!noFaktur) {
        showAlert('No. Faktur harus diisi!', 'warning');
        document.getElementById('noFaktur').focus();
        return;
    }
    
    if (!tanggal) {
        showAlert('Tanggal pembelian harus diisi!', 'warning');
        document.getElementById('tanggalPembelian').focus();
        return;
    }
    
    // Validate empty items list dengan pesan "Tambahkan minimal 1 item pembelian"
    if (itemsPembelian.length === 0) {
        showAlert('Tambahkan minimal 1 item pembelian', 'warning');
        return;
    }
    
    // Validate negative qty/harga in items
    for (let i = 0; i < itemsPembelian.length; i++) {
        const item = itemsPembelian[i];
        
        if (item.qty <= 0) {
            showAlert(`Item "${item.nama}": Qty harus lebih dari 0!`, 'warning');
            return;
        }
        
        if (item.harga < 0) {
            showAlert(`Item "${item.nama}": Harga tidak boleh negatif!`, 'warning');
            return;
        }
    }
    
    try {
        // Get data transaksi lama dari LocalStorage
        const pembelian = JSON.parse(localStorage.getItem('pembelian') || '[]');
        const transaksiIndex = pembelian.findIndex(p => p.id === id);
        
        if (transaksiIndex === -1) {
            showAlert('❌ Error: Transaksi tidak ditemukan dalam sistem', 'danger');
            return;
        }
        
        const oldTransaksi = pembelian[transaksiIndex];
        const oldItems = oldTransaksi.items;
        const oldTotal = oldTransaksi.total;
        
        // Calculate new total
        const newTotal = itemsPembelian.reduce((sum, item) => sum + item.subtotal, 0);
        
        // Get updated tanggal and noFaktur
        const tanggal = document.getElementById('tanggalPembelian').value;
        const noFaktur = document.getElementById('noFaktur').value;
        
        // Adjust stock for edit - Catch dan display error dari stock adjustment
        try {
            adjustStockForEdit(oldItems, itemsPembelian);
        } catch (stockError) {
            console.error('Stock adjustment error:', stockError);
            showAlert(`❌ Error saat menyesuaikan stok: ${stockError.message}`, 'danger');
            return;
        }
        
        // Call createJurnalKoreksi() jika ada perubahan total
        // Catch dan display error dari journal creation
        if (oldTotal !== newTotal) {
            try {
                const jurnalResult = createJurnalKoreksi(
                    oldTotal, 
                    newTotal, 
                    tanggal, 
                    `Koreksi Pembelian - ${noFaktur}`
                );
                
                // Handle error jika jurnal creation failed
                if (!jurnalResult.success) {
                    console.error('Jurnal koreksi gagal:', jurnalResult.message);
                    showAlert(`⚠️ Peringatan: Pembelian diupdate tetapi jurnal koreksi gagal dibuat: ${jurnalResult.message}`, 'warning');
                }
            } catch (jurnalError) {
                console.error('Journal creation error:', jurnalError);
                showAlert(`⚠️ Peringatan: Pembelian diupdate tetapi jurnal koreksi gagal dibuat: ${jurnalError.message}`, 'warning');
            }
        }
        
        // Update transaksi di LocalStorage - Catch dan display error dari LocalStorage operations
        try {
            pembelian[transaksiIndex] = {
                ...oldTransaksi,
                noFaktur: noFaktur,
                tanggal: tanggal,
                supplierId: document.getElementById('supplierPembelian').value || null,
                items: itemsPembelian,
                total: newTotal
            };
            
            localStorage.setItem('pembelian', JSON.stringify(pembelian));
        } catch (storageError) {
            console.error('LocalStorage error:', storageError);
            showAlert(`❌ Error saat menyimpan data: ${storageError.message}. Mungkin storage penuh atau tidak tersedia.`, 'danger');
            return;
        }
        
        // Close modal setelah save
        const modalInstance = bootstrap.Modal.getInstance(document.getElementById('pembelianModal'));
        if (modalInstance) {
            modalInstance.hide();
        }
        
        // Reset form dan flags (isEditMode, editingTransactionId)
        resetPembelianForm();
        
        // Show success notification setelah edit berhasil
        showAlert(`✓ Pembelian ${noFaktur} berhasil diupdate! Stok barang dan jurnal akuntansi telah disesuaikan.`, 'success');
        
        // Re-render daftar pembelian dengan data terbaru
        renderPembelian();
    } catch (error) {
        // Catch any unexpected errors
        console.error('Unexpected error in savePembelianEdit:', error);
        showAlert(`❌ Terjadi kesalahan tidak terduga: ${error.message}`, 'danger');
    }
}

function adjustStockForDelete(items) {
    const barang = JSON.parse(localStorage.getItem('barang') || '[]');
    const warnings = [];
    
    // For each item: newStok = currentStok - item.qty
    items.forEach(item => {
        const barangIndex = barang.findIndex(b => b.id === item.barangId);
        
        if (barangIndex === -1) {
            console.warn(`Barang dengan id ${item.barangId} tidak ditemukan`);
            return;
        }
        
        // Reduce stock
        barang[barangIndex].stok -= item.qty;
        
        // Show warning jika stok menjadi negatif
        if (barang[barangIndex].stok < 0) {
            warnings.push(`Stok barang ${barang[barangIndex].nama} menjadi negatif: ${barang[barangIndex].stok}`);
            console.warn(`Stok barang ${barang[barangIndex].nama} menjadi negatif: ${barang[barangIndex].stok}`);
        }
    });
    
    // Update barang array di LocalStorage
    localStorage.setItem('barang', JSON.stringify(barang));
    
    return { success: true, warnings: warnings };
}

function createJurnalKoreksi(oldTotal, newTotal, tanggal, description) {
    try {
        // Calculate selisih = newTotal - oldTotal
        const selisih = newTotal - oldTotal;
        
        // If no difference, no need to create journal
        if (selisih === 0) {
            return { success: true, message: 'Tidak ada perubahan total, jurnal tidak dibuat' };
        }
        
        const entries = [];
        
        if (selisih > 0) {
            // Pembelian bertambah
            // Debit: Persediaan Barang (1-1300) = selisih
            // Kredit: Kas (1-1000) = selisih
            entries.push({ akun: '1-1300', debit: selisih, kredit: 0 });
            entries.push({ akun: '1-1000', debit: 0, kredit: selisih });
        } else {
            // Pembelian berkurang (selisih < 0)
            // Debit: Kas (1-1000) = abs(selisih)
            // Kredit: Persediaan Barang (1-1300) = abs(selisih)
            const absSelisih = Math.abs(selisih);
            entries.push({ akun: '1-1000', debit: absSelisih, kredit: 0 });
            entries.push({ akun: '1-1300', debit: 0, kredit: absSelisih });
        }
        
        // Validate total debit = total kredit
        const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
        const totalKredit = entries.reduce((sum, e) => sum + e.kredit, 0);
        
        if (Math.abs(totalDebit - totalKredit) > 0.01) {
            throw new Error('Jurnal tidak balance: Debit=' + totalDebit + ', Kredit=' + totalKredit);
        }
        
        // Save jurnal ke LocalStorage using existing addJurnal function
        addJurnal(description, entries, tanggal);
        
        return { success: true, message: 'Jurnal koreksi berhasil dibuat' };
    } catch (error) {
        console.error('Error creating jurnal koreksi:', error);
        return { success: false, message: error.message };
    }
}

function createJurnalPembalik(total, tanggal, description) {
    try {
        // Create reversing entry: Debit Kas (1-1000), Kredit Persediaan (1-1300)
        const entries = [
            { akun: '1-1000', debit: total, kredit: 0 },      // Kas (Debit)
            { akun: '1-1300', debit: 0, kredit: total }       // Persediaan Barang (Kredit)
        ];
        
        // Validate total debit = total kredit
        const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
        const totalKredit = entries.reduce((sum, e) => sum + e.kredit, 0);
        
        if (Math.abs(totalDebit - totalKredit) > 0.01) {
            throw new Error('Jurnal tidak balance: Debit=' + totalDebit + ', Kredit=' + totalKredit);
        }
        
        // Save jurnal ke LocalStorage using existing addJurnal function
        addJurnal(description, entries, tanggal);
        
        return { success: true, message: 'Jurnal pembalik berhasil dibuat' };
    } catch (error) {
        console.error('Error creating jurnal pembalik:', error);
        return { success: false, message: error.message };
    }
}

function deletePembelian(id) {
    // Show confirmation dialog
    if (!confirm('Yakin ingin menghapus transaksi pembelian ini? Stok barang akan dikurangi sesuai dengan qty dalam transaksi.')) {
        // Jika cancelled, return tanpa action
        return;
    }
    
    try {
        // Jika confirmed, lanjut ke proses delete
        // Catch dan display error dari LocalStorage operations
        let pembelian;
        try {
            pembelian = JSON.parse(localStorage.getItem('pembelian') || '[]');
        } catch (storageError) {
            console.error('LocalStorage read error:', storageError);
            showAlert(`❌ Error saat membaca data: ${storageError.message}. Storage mungkin corrupt.`, 'danger');
            return;
        }
        
        const transaksi = pembelian.find(p => p.id === id);
        
        if (!transaksi) {
            showAlert('❌ Transaksi tidak ditemukan dalam sistem', 'danger');
            return;
        }
        
        // Catch dan display error dari stock adjustment
        let stockResult;
        try {
            stockResult = adjustStockForDelete(transaksi.items);
        } catch (stockError) {
            console.error('Stock adjustment error:', stockError);
            showAlert(`❌ Error saat menyesuaikan stok: ${stockError.message}`, 'danger');
            return;
        }
        
        // Show warnings if any
        if (stockResult.warnings.length > 0) {
            const warningMsg = '⚠️ Peringatan:\n' + stockResult.warnings.join('\n');
            alert(warningMsg);
        }
        
        // Catch dan display error dari journal creation
        try {
            const jurnalResult = createJurnalPembalik(
                transaksi.total,
                transaksi.tanggal,
                `Pembatalan Pembelian - ${transaksi.noFaktur}`
            );
            
            // Handle error jika jurnal creation failed
            if (!jurnalResult.success) {
                console.error('Jurnal pembalik gagal:', jurnalResult.message);
                showAlert(`⚠️ Peringatan: Transaksi dihapus tetapi jurnal pembalik gagal dibuat: ${jurnalResult.message}`, 'warning');
            }
        } catch (jurnalError) {
            console.error('Journal creation error:', jurnalError);
            showAlert(`⚠️ Peringatan: Transaksi dihapus tetapi jurnal pembalik gagal dibuat: ${jurnalError.message}`, 'warning');
        }
        
        // Remove transaksi dari array pembelian
        const updatedPembelian = pembelian.filter(p => p.id !== id);
        
        // Catch dan display error dari LocalStorage operations
        try {
            localStorage.setItem('pembelian', JSON.stringify(updatedPembelian));
        } catch (storageError) {
            console.error('LocalStorage write error:', storageError);
            showAlert(`❌ Error saat menyimpan data: ${storageError.message}. Mungkin storage penuh atau tidak tersedia.`, 'danger');
            return;
        }
        
        // Show success notification setelah delete berhasil
        showAlert(`✓ Transaksi pembelian ${transaksi.noFaktur} berhasil dihapus! Stok barang dan jurnal akuntansi telah disesuaikan.`, 'success');
        
        // Re-render daftar pembelian
        renderPembelian();
    } catch (error) {
        // Catch any unexpected errors
        console.error('Unexpected error in deletePembelian:', error);
        showAlert(`❌ Terjadi kesalahan tidak terduga saat menghapus transaksi: ${error.message}`, 'danger');
    }
}

function viewPembelian(id) {
    const pembelian = JSON.parse(localStorage.getItem('pembelian') || '[]');
    const item = pembelian.find(p => p.id === id);
    const supplier = JSON.parse(localStorage.getItem('supplier') || '[]');
    const sup = supplier.find(s => s.id === item.supplierId);
    
    if (item) {
        const content = document.getElementById('detailPembelianContent');
        content.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>No. Faktur:</strong> ${item.noFaktur}<br>
                    <strong>Tanggal:</strong> ${formatDate(item.tanggal)}<br>
                    <strong>Supplier:</strong> ${sup?.nama || 'Pembelian Langsung'}
                </div>
                <div class="col-md-6 text-end">
                    <strong>Status:</strong> 
                    <span class="badge ${item.status === 'selesai' ? 'bg-success' : 'bg-warning'}">
                        ${item.status === 'selesai' ? 'Selesai' : 'Pending'}
                    </span>
                </div>
            </div>
            
            <table class="table">
                <thead>
                    <tr>
                        <th>Barang</th>
                        <th>Qty</th>
                        <th>Harga</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${item.items.map(i => `
                        <tr>
                            <td>${i.nama}</td>
                            <td>${i.qty}</td>
                            <td>${formatRupiah(i.harga)}</td>
                            <td>${formatRupiah(i.subtotal)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <th colspan="3" class="text-end">Total:</th>
                        <th>${formatRupiah(item.total)}</th>
                    </tr>
                </tfoot>
            </table>
        `;
        
        new bootstrap.Modal(document.getElementById('detailPembelianModal')).show();
    }
}

function printPembelian(id) {
    const pembelian = JSON.parse(localStorage.getItem('pembelian') || '[]');
    const item = pembelian.find(p => p.id === id);
    const koperasi = JSON.parse(localStorage.getItem('koperasi'));
    const supplier = JSON.parse(localStorage.getItem('supplier') || '[]');
    const sup = supplier.find(s => s.id === item.supplierId);
    
    if (item) {
        const printWindow = window.open('', '', 'width=800,height=600');
        printWindow.document.write(`
            <html>
            <head>
                <title>Faktur Pembelian - ${item.noFaktur}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .logo { max-width: 100px; max-height: 100px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #2d6a4f; color: white; }
                    .total { font-weight: bold; font-size: 1.2em; }
                    .info { margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    ${koperasi.logo ? `<img src="${koperasi.logo}" class="logo">` : ''}
                    <h2>${koperasi.nama || 'Koperasi Karyawan'}</h2>
                    <p>${koperasi.alamat || ''}</p>
                    <h3>FAKTUR PEMBELIAN</h3>
                </div>
                
                <div class="info">
                    <table style="border: none;">
                        <tr style="border: none;">
                            <td style="border: none;"><strong>No. Faktur:</strong></td>
                            <td style="border: none;">${item.noFaktur}</td>
                            <td style="border: none;"><strong>Tanggal:</strong></td>
                            <td style="border: none;">${formatDate(item.tanggal)}</td>
                        </tr>
                        <tr style="border: none;">
                            <td style="border: none;"><strong>Supplier:</strong></td>
                            <td style="border: none;" colspan="3">${sup?.nama || 'Pembelian Langsung'}</td>
                        </tr>
                    </table>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Nama Barang</th>
                            <th>Qty</th>
                            <th>Harga</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${item.items.map((i, idx) => `
                            <tr>
                                <td>${idx + 1}</td>
                                <td>${i.nama}</td>
                                <td>${i.qty}</td>
                                <td>${formatRupiah(i.harga)}</td>
                                <td>${formatRupiah(i.subtotal)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="4" class="total" style="text-align: right;">TOTAL:</td>
                            <td class="total">${formatRupiah(item.total)}</td>
                        </tr>
                    </tfoot>
                </table>
                
                <div style="margin-top: 50px;">
                    <div style="float: left; width: 45%; text-align: center;">
                        <p>Penerima,</p>
                        <br><br><br>
                        <p>_________________</p>
                    </div>
                    <div style="float: right; width: 45%; text-align: center;">
                        <p>Hormat Kami,</p>
                        <br><br><br>
                        <p>_________________</p>
                    </div>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
}

function renderStokOpname() {
    const content = document.getElementById('mainContent');
    const barang = JSON.parse(localStorage.getItem('barang') || '[]');
    
    content.innerHTML = `
        <h2>Stok Opname</h2>
        <button class="btn btn-primary mb-3" onclick="prosesStokOpname()">Proses Stok Opname</button>
        <table class="table">
            <thead>
                <tr><th>Barcode</th><th>Nama Barang</th><th>Stok Sistem</th><th>Stok Fisik</th><th>Selisih</th></tr>
            </thead>
            <tbody>
                ${barang.map(b => `
                    <tr>
                        <td>${b.barcode}</td>
                        <td>${b.nama}</td>
                        <td>${b.stok}</td>
                        <td><input type="number" class="form-control form-control-sm" id="fisik_${b.id}" value="${b.stok}"></td>
                        <td id="selisih_${b.id}">0</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function prosesStokOpname() {
    const barang = JSON.parse(localStorage.getItem('barang') || '[]');
    barang.forEach(b => {
        const fisik = parseFloat(document.getElementById(`fisik_${b.id}`).value) || 0;
        b.stok = fisik;
    });
    localStorage.setItem('barang', JSON.stringify(barang));
    showAlert('Stok opname berhasil diproses');
    renderStokOpname();
}


// Kategori Functions
function showKategoriModal() {
    const kategori = JSON.parse(localStorage.getItem('kategori') || '[]');
    const content = document.getElementById('mainContent');
    
    const modalHTML = `
        <div class="modal fade" id="kategoriManageModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="bi bi-tags me-2"></i>Kelola Kategori Barang</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-5">
                                <h6>Tambah Kategori Baru</h6>
                                <form id="kategoriForm">
                                    <input type="hidden" id="kategoriId">
                                    <div class="mb-3">
                                        <label class="form-label">Nama Kategori</label>
                                        <input type="text" class="form-control" id="namaKategori" required>
                                    </div>
                                    <button type="button" class="btn btn-primary btn-sm" onclick="saveKategori()">
                                        <i class="bi bi-save me-1"></i>Simpan
                                    </button>
                                    <button type="button" class="btn btn-secondary btn-sm" onclick="resetKategoriForm()">
                                        <i class="bi bi-x me-1"></i>Reset
                                    </button>
                                </form>
                            </div>
                            <div class="col-md-7">
                                <h6>Daftar Kategori</h6>
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr><th>Nama Kategori</th><th>Aksi</th></tr>
                                        </thead>
                                        <tbody id="kategoriList">
                                            ${kategori.map(k => `
                                                <tr>
                                                    <td>${k.nama}</td>
                                                    <td>
                                                        <button class="btn btn-sm btn-warning" onclick="editKategori('${k.id}')">
                                                            <i class="bi bi-pencil"></i>
                                                        </button>
                                                        <button class="btn btn-sm btn-danger" onclick="deleteKategori('${k.id}')">
                                                            <i class="bi bi-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('kategoriManageModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    new bootstrap.Modal(document.getElementById('kategoriManageModal')).show();
}

function saveKategori() {
    const kategori = JSON.parse(localStorage.getItem('kategori') || '[]');
    const id = document.getElementById('kategoriId').value;
    const nama = document.getElementById('namaKategori').value;
    
    if (!nama) {
        showAlert('Nama kategori harus diisi!', 'warning');
        return;
    }
    
    if (id) {
        const index = kategori.findIndex(k => k.id === id);
        kategori[index].nama = nama;
    } else {
        kategori.push({ id: generateId(), nama: nama });
    }
    
    localStorage.setItem('kategori', JSON.stringify(kategori));
    showAlert('Kategori berhasil disimpan');
    resetKategoriForm();
    showKategoriModal();
}

function editKategori(id) {
    const kategori = JSON.parse(localStorage.getItem('kategori') || '[]');
    const item = kategori.find(k => k.id === id);
    if (item) {
        document.getElementById('kategoriId').value = item.id;
        document.getElementById('namaKategori').value = item.nama;
    }
}

function deleteKategori(id) {
    if (confirm('Yakin ingin menghapus kategori ini?')) {
        let kategori = JSON.parse(localStorage.getItem('kategori') || '[]');
        kategori = kategori.filter(k => k.id !== id);
        localStorage.setItem('kategori', JSON.stringify(kategori));
        showAlert('Kategori berhasil dihapus', 'info');
        showKategoriModal();
    }
}

function resetKategoriForm() {
    document.getElementById('kategoriForm').reset();
    document.getElementById('kategoriId').value = '';
}

// Satuan Functions
function showSatuanModal() {
    const satuan = JSON.parse(localStorage.getItem('satuan') || '[]');
    
    const modalHTML = `
        <div class="modal fade" id="satuanManageModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="bi bi-rulers me-2"></i>Kelola Satuan Barang</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-5">
                                <h6>Tambah Satuan Baru</h6>
                                <form id="satuanForm">
                                    <input type="hidden" id="satuanId">
                                    <div class="mb-3">
                                        <label class="form-label">Nama Satuan</label>
                                        <input type="text" class="form-control" id="namaSatuan" required placeholder="Contoh: Pcs, Kg, Liter">
                                    </div>
                                    <button type="button" class="btn btn-primary btn-sm" onclick="saveSatuan()">
                                        <i class="bi bi-save me-1"></i>Simpan
                                    </button>
                                    <button type="button" class="btn btn-secondary btn-sm" onclick="resetSatuanForm()">
                                        <i class="bi bi-x me-1"></i>Reset
                                    </button>
                                </form>
                            </div>
                            <div class="col-md-7">
                                <h6>Daftar Satuan</h6>
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead>
                                            <tr><th>Nama Satuan</th><th>Aksi</th></tr>
                                        </thead>
                                        <tbody id="satuanList">
                                            ${satuan.map(s => `
                                                <tr>
                                                    <td>${s.nama}</td>
                                                    <td>
                                                        <button class="btn btn-sm btn-warning" onclick="editSatuan('${s.id}')">
                                                            <i class="bi bi-pencil"></i>
                                                        </button>
                                                        <button class="btn btn-sm btn-danger" onclick="deleteSatuan('${s.id}')">
                                                            <i class="bi bi-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('satuanManageModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    new bootstrap.Modal(document.getElementById('satuanManageModal')).show();
}

function saveSatuan() {
    const satuan = JSON.parse(localStorage.getItem('satuan') || '[]');
    const id = document.getElementById('satuanId').value;
    const nama = document.getElementById('namaSatuan').value;
    
    if (!nama) {
        showAlert('Nama satuan harus diisi!', 'warning');
        return;
    }
    
    if (id) {
        const index = satuan.findIndex(s => s.id === id);
        satuan[index].nama = nama;
    } else {
        satuan.push({ id: generateId(), nama: nama });
    }
    
    localStorage.setItem('satuan', JSON.stringify(satuan));
    showAlert('Satuan berhasil disimpan');
    resetSatuanForm();
    showSatuanModal();
}

function editSatuan(id) {
    const satuan = JSON.parse(localStorage.getItem('satuan') || '[]');
    const item = satuan.find(s => s.id === id);
    if (item) {
        document.getElementById('satuanId').value = item.id;
        document.getElementById('namaSatuan').value = item.nama;
    }
}

function deleteSatuan(id) {
    if (confirm('Yakin ingin menghapus satuan ini?')) {
        let satuan = JSON.parse(localStorage.getItem('satuan') || '[]');
        satuan = satuan.filter(s => s.id !== id);
        localStorage.setItem('satuan', JSON.stringify(satuan));
        showAlert('Satuan berhasil dihapus', 'info');
        showSatuanModal();
    }
}

function resetSatuanForm() {
    document.getElementById('satuanForm').reset();
    document.getElementById('satuanId').value = '';
}

function editSupplier(id) {
    const supplier = JSON.parse(localStorage.getItem('supplier') || '[]');
    const item = supplier.find(s => s.id === id);
    if (item) {
        document.getElementById('supplierId').value = item.id;
        document.getElementById('namaSupplier').value = item.nama;
        document.getElementById('teleponSupplier').value = item.telepon;
        document.getElementById('alamatSupplier').value = item.alamat;
        new bootstrap.Modal(document.getElementById('supplierModal')).show();
    }
}

function deleteSupplier(id) {
    if (confirm('Yakin ingin menghapus supplier ini?')) {
        let supplier = JSON.parse(localStorage.getItem('supplier') || '[]');
        supplier = supplier.filter(s => s.id !== id);
        localStorage.setItem('supplier', JSON.stringify(supplier));
        showAlert('Supplier berhasil dihapus', 'info');
        renderSupplier();
    }
}



// ============================================
// BARCODE SCANNER FUNCTIONS
// ============================================

/**
 * Mencari barang berdasarkan barcode
 * @param {string} barcode - Barcode yang akan dicari
 * @returns {Object|null} - Objek barang jika ditemukan, null jika tidak
 */
function findBarangByBarcode(barcode) {
    const barang = JSON.parse(localStorage.getItem('barang') || '[]');
    const cleanBarcode = barcode.trim();
    
    if (!cleanBarcode) return null;
    
    return barang.find(b => b.barcode === cleanBarcode) || null;
}

/**
 * Memproses input barcode dan auto-fill form
 * @param {string} barcode - Barcode yang akan diproses
 */
function processBarcodeInput(barcode) {
    const item = findBarangByBarcode(barcode);
    
    if (item) {
        // Auto-fill dropdown
        document.getElementById('selectBarang').value = item.id;
        
        // Auto-fill harga beli dengan HPP
        document.getElementById('hargaBeli').value = item.hpp || 0;
        
        // Clear barcode input
        document.getElementById('barcodeInput').value = '';
        
        // Focus ke qty field
        document.getElementById('qtyBarang').focus();
        document.getElementById('qtyBarang').select();
        
        // Show success feedback
        showBarcodeSuccess(item.nama);
    } else {
        // Show error
        showAlert(`Barang dengan barcode "${barcode}" tidak ditemukan`, 'warning');
        
        // Clear barcode input
        document.getElementById('barcodeInput').value = '';
        
        // Keep focus on barcode input
        document.getElementById('barcodeInput').focus();
    }
}

/**
 * Menampilkan feedback visual ketika barcode berhasil di-scan
 * @param {string} namaBarang - Nama barang yang ditemukan
 */
function showBarcodeSuccess(namaBarang) {
    const badge = document.getElementById('barcodeBadge');
    if (badge) {
        badge.classList.remove('bg-success');
        badge.classList.add('bg-primary');
        badge.innerHTML = `<i class="bi bi-check-circle"></i> ${namaBarang}`;
        
        setTimeout(() => {
            badge.classList.remove('bg-primary');
            badge.classList.add('bg-success');
            badge.innerHTML = '<i class="bi bi-upc-scan"></i> Scanner Ready';
        }, 2000);
    }
}

/**
 * Handler untuk input barcode
 * Mendeteksi Enter key dan memproses barcode
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleBarcodeInput(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const barcode = event.target.value.trim();
        
        if (!barcode) {
            return; // Tidak melakukan apa-apa jika kosong
        }
        
        processBarcodeInput(barcode);
    }
}

/**
 * Handler untuk qty field Enter key
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleQtyFieldEnter(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        
        // Cek apakah ada barang yang dipilih
        const selectBarang = document.getElementById('selectBarang');
        if (selectBarang.value) {
            // Tambahkan item
            addItemPembelian();
            
            // Focus kembali ke barcode input
            const barcodeInput = document.getElementById('barcodeInput');
            if (barcodeInput) {
                setTimeout(() => {
                    barcodeInput.focus();
                }, 100);
            }
        }
    }
}

/**
 * Menambahkan event listener pada qty field untuk auto-add item
 * ketika Enter ditekan setelah barcode scan
 */
function enhanceQtyFieldForBarcode() {
    const qtyField = document.getElementById('qtyBarang');
    
    if (qtyField) {
        qtyField.addEventListener('keypress', handleQtyFieldEnter);
    }
}

/**
 * Initialize item search functionality in purchase modal
 */
function initializeItemSearch() {
    try {
        // Initialize search UI components
        if (window.searchUI) {
            // Render search field
            window.searchUI.renderSearchField('itemSearchContainer');
            
            // Render category filter
            window.searchUI.renderCategoryFilter('categoryFilterContainer');
            
            // Setup event listener for item selection
            document.addEventListener('itemAddedToPurchase', handleSearchItemSelection);
        } else {
            console.warn('Search UI not available');
        }
    } catch (error) {
        console.error('Error initializing item search:', error);
    }
}

/**
 * Handle item selection from search
 * @param {CustomEvent} event - Item selection event
 */
function handleSearchItemSelection(event) {
    try {
        const { item } = event.detail;
        
        // Add item to purchase list
        const purchaseItem = {
            barangId: item.id,
            nama: item.name,
            qty: 1,
            harga: item.unitPrice || 0,
            subtotal: item.unitPrice || 0
        };
        
        // Check if item already exists
        const existingIndex = itemsPembelian.findIndex(p => p.barangId === item.id);
        
        if (existingIndex >= 0) {
            // Increment quantity
            itemsPembelian[existingIndex].qty += 1;
            itemsPembelian[existingIndex].subtotal = itemsPembelian[existingIndex].qty * itemsPembelian[existingIndex].harga;
        } else {
            // Add new item
            itemsPembelian.push(purchaseItem);
        }
        
        // Update UI
        updateItemPembelianList();
        
        // Clear search field
        const searchInput = document.getElementById('itemSearchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Hide search dropdown
        if (window.searchUI) {
            window.searchUI.hideDropdown();
        }
        
    } catch (error) {
        console.error('Error handling search item selection:', error);
        showAlert('Gagal menambahkan barang dari pencarian', 'danger');
    }
}

/**
 * Update purchase table to integrate with existing system
 */
function updatePurchaseTable() {
    // This function is called by the search UI when items are added
    // We just need to update our existing purchase list
    updateItemPembelianList();
}