// Point of Sales Module

let cart = [];
let modalKasir = 0;
let shiftKasir = null;
let tutupKasData = null;

function renderPOS() {
    const content = document.getElementById('mainContent');
    const barang = JSON.parse(localStorage.getItem('barang') || '[]');
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    
    // Check if kasir sudah buka kas
    const bukaKas = sessionStorage.getItem('bukaKas');
    if (!bukaKas) {
        showBukaKasModal();
        return;
    }
    
    content.innerHTML = `
        <h2>Point of Sales</h2>
        <div class="row">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-body">
                        <div class="mb-3">
                            <input type="text" class="form-control" id="searchBarang" 
                                placeholder="Scan barcode atau cari barang..." 
                                onkeyup="searchBarang(event)">
                        </div>
                        <div class="row" id="barangList">
                            ${barang.slice(0, 12).map(b => `
                                <div class="col-md-3 mb-3">
                                    <div class="card pos-item" onclick="addToCart('${b.id}')">
                                        <div class="card-body text-center">
                                            <h6>${b.nama}</h6>
                                            <p class="mb-0">${formatRupiah(b.hargaJual)}</p>
                                            <small>Stok: ${b.stok}</small>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-body">
                        <h5>Keranjang</h5>
                        <div class="mb-3">
                            <select class="form-select" id="anggotaSelect" onchange="updateCreditInfo()">
                                <option value="">Umum (Cash)</option>
                                ${anggota.map(a => `<option value="${a.id}">${a.nama} - ${a.nik}</option>`).join('')}
                            </select>
                        </div>
                        <!-- Credit Info Section -->
                        <div id="creditInfoSection" style="display: none;">
                            <div class="alert mb-3" id="creditInfoAlert">
                                <h6><i class="bi bi-credit-card me-2"></i>Info Kredit</h6>
                                <div class="row">
                                    <div class="col-6">
                                        <small><strong>Tagihan:</strong></small><br>
                                        <span id="outstandingBalance" style="font-weight: bold;">Rp 0</span>
                                    </div>
                                    <div class="col-6">
                                        <small><strong>Tersedia:</strong></small><br>
                                        <span id="availableCredit" style="font-weight: bold;">Rp 2.000.000</span>
                                    </div>
                                </div>
                                <div id="creditStatusIndicator" class="mt-2" style="font-size: 0.85rem;"></div>
                            </div>
                        </div>
                        <div id="cartItems" style="max-height: 300px; overflow-y: auto;"></div>
                        <hr>
                        <div class="d-flex justify-content-between mb-3">
                            <strong style="font-size: 1.2rem;">Total:</strong>
                            <span class="total-display" id="totalAmount" style="font-size: 1.2rem; font-weight: bold; color: #2d6a4f;">Rp 0</span>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Metode Pembayaran</label>
                            <select class="form-select" id="metodePembayaran" onchange="toggleBayarKembalian()">
                                <option value="cash">Cash</option>
                                <option value="bon">Bon (Kredit)</option>
                            </select>
                        </div>
                        <div id="bayarKembalianSection">
                            <div class="mb-3">
                                <label class="form-label">
                                    <i class="bi bi-cash me-1"></i>Uang Bayar
                                </label>
                                <input type="number" class="form-control" id="uangBayar" 
                                    placeholder="Masukkan jumlah uang bayar" 
                                    onkeyup="hitungKembalian()" 
                                    onchange="hitungKembalian()">
                                <div class="btn-group w-100 mt-2" role="group">
                                    <button type="button" class="btn btn-sm btn-outline-secondary" onclick="setUangPas()">Uang Pas</button>
                                    <button type="button" class="btn btn-sm btn-outline-secondary" onclick="setUangBayar(50000)">50K</button>
                                    <button type="button" class="btn btn-sm btn-outline-secondary" onclick="setUangBayar(100000)">100K</button>
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">
                                    <i class="bi bi-arrow-return-left me-1"></i>Kembalian
                                </label>
                                <div class="form-control" id="kembalian" style="background-color: #e9f5f0; font-weight: bold; font-size: 1.1rem; color: #2d6a4f;">
                                    Rp 0
                                </div>
                            </div>
                        </div>
                        <button class="btn btn-success w-100 mb-2" onclick="processPayment()">
                            <i class="bi bi-check-circle"></i> Bayar
                        </button>
                        <button class="btn btn-danger w-100 mb-2" onclick="clearCart()">
                            <i class="bi bi-x-circle"></i> Batal
                        </button>
                        <button class="btn btn-warning w-100" onclick="showTutupKasModal()">
                            <i class="bi bi-lock"></i> Tutup Kasir
                        </button>
                    </div>
                </div>
                
                <!-- Info Shift Kasir -->
                <div class="card mt-3">
                    <div class="card-body">
                        <h6><i class="bi bi-info-circle me-2"></i>Info Shift</h6>
                        <small>
                            <strong>Kasir:</strong> ${currentUser.name}<br>
                            <strong>Buka Kas:</strong> ${new Date(JSON.parse(bukaKas).waktuBuka).toLocaleString('id-ID')}<br>
                            <strong>Modal Awal:</strong> ${formatRupiah(JSON.parse(bukaKas).modalAwal)}
                        </small>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    updateCartDisplay();
    
    // Set default metode pembayaran dan tampilkan section bayar-kembalian
    setTimeout(() => {
        toggleBayarKembalian();
    }, 100);
}

function showBukaKasModal() {
    const content = document.getElementById('mainContent');
    
    // Check if pengajuan modal feature is enabled
    const pengajuanEnabled = isPengajuanModalEnabled();
    
    // Get approved pengajuan for current kasir
    let approvedPengajuan = null;
    let pendingPengajuan = null;
    let rejectedPengajuan = null;
    
    if (pengajuanEnabled && currentUser) {
        approvedPengajuan = getApprovedPengajuanForKasir(currentUser.id);
        pendingPengajuan = hasPendingPengajuan(currentUser.id);
        
        // Get latest rejected pengajuan
        const pengajuanList = getPengajuanByKasir(currentUser.id);
        rejectedPengajuan = pengajuanList.find(p => p.status === 'rejected');
    }
    
    // Determine modal input state
    const hasApproved = approvedPengajuan !== null;
    const hasPending = pendingPengajuan !== null;
    const modalValue = hasApproved ? approvedPengajuan.jumlahDiminta : '';
    const modalDisabled = hasApproved ? 'disabled' : '';
    const bukaKasDisabled = hasPending ? 'disabled' : '';
    
    content.innerHTML = `
        <div class="row justify-content-center mt-5">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-body">
                        <h3 class="text-center mb-4">Buka Kas</h3>
                        
                        ${pengajuanEnabled ? `
                            <!-- Status Pengajuan Modal -->
                            ${hasApproved ? `
                                <div class="alert alert-success">
                                    <h6><i class="bi bi-check-circle me-2"></i>Pengajuan Modal Disetujui</h6>
                                    <p class="mb-0">Modal Anda sebesar <strong>${formatRupiah(approvedPengajuan.jumlahDiminta)}</strong> telah disetujui oleh ${approvedPengajuan.adminName}.</p>
                                    <small class="text-muted">Modal akan otomatis terisi saat buka kas.</small>
                                </div>
                            ` : hasPending ? `
                                <div class="alert alert-warning">
                                    <h6><i class="bi bi-clock-history me-2"></i>Pengajuan Modal Menunggu Persetujuan</h6>
                                    <p class="mb-1">Pengajuan modal Anda sebesar <strong>${formatRupiah(pendingPengajuan.jumlahDiminta)}</strong> sedang menunggu persetujuan admin.</p>
                                    <small class="text-muted">Diajukan pada: ${new Date(pendingPengajuan.tanggalPengajuan).toLocaleString('id-ID')}</small>
                                    <p class="mb-0 mt-2"><small>Anda tidak dapat membuka kas atau mengajukan modal baru hingga pengajuan diproses.</small></p>
                                </div>
                            ` : rejectedPengajuan ? `
                                <div class="alert alert-danger">
                                    <h6><i class="bi bi-x-circle me-2"></i>Pengajuan Modal Ditolak</h6>
                                    <p class="mb-1">Pengajuan modal Anda sebesar <strong>${formatRupiah(rejectedPengajuan.jumlahDiminta)}</strong> ditolak.</p>
                                    <p class="mb-0"><strong>Alasan:</strong> ${rejectedPengajuan.alasanPenolakan}</p>
                                    <small class="text-muted">Anda dapat mengajukan modal baru atau buka kas dengan modal manual.</small>
                                </div>
                            ` : ''}
                        ` : ''}
                        
                        <form id="bukaKasForm">
                            <div class="mb-3">
                                <label class="form-label">Modal Awal Kasir</label>
                                <input type="number" class="form-control" id="modalKasir" 
                                    value="${modalValue}" ${modalDisabled} required>
                                <small class="text-muted">
                                    ${hasApproved ? 'Modal dari pengajuan yang disetujui' : 'Masukkan modal untuk uang kembalian'}
                                </small>
                            </div>
                            
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-primary" ${bukaKasDisabled}>
                                    <i class="bi bi-box-arrow-in-right me-2"></i>Buka Kas
                                </button>
                                
                                ${pengajuanEnabled && !hasApproved && !hasPending ? `
                                    <button type="button" class="btn btn-outline-secondary" onclick="showPengajuanModalForm()">
                                        <i class="bi bi-file-earmark-text me-2"></i>Ajukan Modal
                                    </button>
                                ` : ''}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('bukaKasForm').addEventListener('submit', function(e) {
        e.preventDefault();
        modalKasir = parseFloat(document.getElementById('modalKasir').value);
        
        const shiftData = {
            id: generateId(),
            kasir: currentUser.name,
            kasirId: currentUser.id,
            modalAwal: modalKasir,
            waktuBuka: new Date().toISOString(),
            status: 'buka'
        };
        
        // If using approved pengajuan, mark it as used
        if (approvedPengajuan) {
            const result = markPengajuanAsUsed(approvedPengajuan.id, shiftData.id);
            if (!result.success) {
                showAlert(result.message, 'error');
                return;
            }
            shiftData.pengajuanId = approvedPengajuan.id;
        }
        
        sessionStorage.setItem('bukaKas', JSON.stringify(shiftData));
        sessionStorage.setItem('shiftId', shiftData.id);
        
        showAlert('Kas berhasil dibuka');
        renderPOS();
    });
}

/**
 * Show form pengajuan modal
 */
function showPengajuanModalForm() {
    const content = document.getElementById('mainContent');
    const settings = getPengajuanModalSettings();
    
    content.innerHTML = `
        <div class="row justify-content-center mt-5">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h3 class="mb-0">Ajukan Modal Kasir</h3>
                            <button class="btn btn-sm btn-outline-secondary" onclick="showBukaKasModal()">
                                <i class="bi bi-arrow-left"></i> Kembali
                            </button>
                        </div>
                        
                        <div class="alert alert-info">
                            <small>
                                <i class="bi bi-info-circle me-2"></i>
                                Batas maksimum pengajuan: <strong>${formatRupiah(settings.batasMaximum)}</strong>
                            </small>
                        </div>
                        
                        <form id="pengajuanModalForm">
                            <div class="mb-3">
                                <label class="form-label">Jumlah Modal yang Diminta <span class="text-danger">*</span></label>
                                <input type="number" class="form-control" id="jumlahModal" 
                                    placeholder="Contoh: 2000000" required min="1" max="${settings.batasMaximum}">
                                <small class="text-muted">Masukkan jumlah dalam Rupiah</small>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Keterangan</label>
                                <textarea class="form-control" id="keteranganModal" rows="3" 
                                    placeholder="Contoh: Modal untuk shift pagi, estimasi transaksi tinggi"></textarea>
                                <small class="text-muted">Opsional - jelaskan kebutuhan modal Anda</small>
                            </div>
                            
                            <div class="d-grid gap-2">
                                <button type="submit" class="btn btn-primary">
                                    <i class="bi bi-send me-2"></i>Kirim Pengajuan
                                </button>
                                <button type="button" class="btn btn-outline-secondary" onclick="showBukaKasModal()">
                                    Batal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('pengajuanModalForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const jumlah = parseFloat(document.getElementById('jumlahModal').value);
        const keterangan = document.getElementById('keteranganModal').value;
        
        // Create pengajuan
        const result = createPengajuanModal(
            currentUser.id,
            currentUser.name,
            jumlah,
            keterangan
        );
        
        if (result.success) {
            showAlert('Pengajuan modal berhasil dikirim. Menunggu persetujuan admin.', 'success');
            showBukaKasModal();
        } else {
            showAlert(result.message, 'error');
        }
    });
}

function searchBarang(event) {
    const query = event.target.value.toLowerCase();
    const barang = JSON.parse(localStorage.getItem('barang') || '[]');
    
    if (event.key === 'Enter' && query) {
        // Cari berdasarkan barcode
        const item = barang.find(b => b.barcode.toLowerCase() === query);
        if (item) {
            addToCart(item.id);
            event.target.value = '';
        }
    } else {
        // Filter barang
        const filtered = barang.filter(b => 
            b.nama.toLowerCase().includes(query) || 
            b.barcode.toLowerCase().includes(query)
        );
        
        const barangList = document.getElementById('barangList');
        barangList.innerHTML = filtered.slice(0, 12).map(b => `
            <div class="col-md-3 mb-3">
                <div class="card pos-item" onclick="addToCart('${b.id}')">
                    <div class="card-body text-center">
                        <h6>${b.nama}</h6>
                        <p class="mb-0">${formatRupiah(b.hargaJual)}</p>
                        <small>Stok: ${b.stok}</small>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

function addToCart(barangId) {
    const barang = JSON.parse(localStorage.getItem('barang') || '[]');
    const item = barang.find(b => b.id === barangId);
    
    if (!item || item.stok <= 0) {
        showAlert('Stok barang tidak tersedia', 'warning');
        return;
    }
    
    const existingItem = cart.find(c => c.id === barangId);
    if (existingItem) {
        if (existingItem.qty < item.stok) {
            existingItem.qty++;
        } else {
            showAlert('Stok tidak mencukupi', 'warning');
        }
    } else {
        cart.push({
            id: item.id,
            nama: item.nama,
            harga: item.hargaJual,
            hpp: item.hpp,
            qty: 1,
            stok: item.stok
        });
    }
    
    updateCartDisplay();
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    if (!cartItems) return;
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${item.nama}</strong><br>
                    <small>${formatRupiah(item.harga)} x ${item.qty}</small>
                </div>
                <div>
                    <button class="btn btn-sm btn-outline-secondary" onclick="updateQty('${item.id}', -1)">-</button>
                    <span class="mx-2">${item.qty}</span>
                    <button class="btn btn-sm btn-outline-secondary" onclick="updateQty('${item.id}', 1)">+</button>
                    <button class="btn btn-sm btn-danger ms-2" onclick="removeFromCart('${item.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.harga * item.qty), 0);
    document.getElementById('totalAmount').textContent = formatRupiah(total);
    
    // Update kembalian jika ada input uang bayar
    const uangBayarElement = document.getElementById('uangBayar');
    if (uangBayarElement && uangBayarElement.value) {
        hitungKembalian();
    }
}

function updateCreditInfo() {
    const anggotaId = document.getElementById('anggotaSelect').value;
    const creditInfoSection = document.getElementById('creditInfoSection');
    
    if (!anggotaId) {
        // Hide credit info for "Umum (Cash)"
        creditInfoSection.style.display = 'none';
        return;
    }
    
    // Show credit info section
    creditInfoSection.style.display = 'block';
    
    // Calculate credit information
    const outstandingBalance = creditLimitValidator.calculateOutstandingBalance(anggotaId);
    const availableCredit = creditLimitValidator.getAvailableCredit(anggotaId);
    const creditStatus = creditLimitValidator.getCreditStatus(anggotaId);
    
    // Update display
    document.getElementById('outstandingBalance').textContent = formatRupiah(outstandingBalance);
    document.getElementById('availableCredit').textContent = formatRupiah(availableCredit);
    
    // Update alert styling based on status
    const creditInfoAlert = document.getElementById('creditInfoAlert');
    creditInfoAlert.style.backgroundColor = creditStatus.bgColor;
    creditInfoAlert.style.borderColor = creditStatus.color;
    creditInfoAlert.style.color = creditStatus.color;
    
    // Update status indicator
    const statusIndicator = document.getElementById('creditStatusIndicator');
    statusIndicator.innerHTML = `
        <i class="bi ${creditStatus.icon} me-1"></i>
        <strong>${creditStatus.message}</strong> (${creditStatus.percentage.toFixed(1)}% terpakai)
    `;
    statusIndicator.style.color = creditStatus.color;
}

function updateQty(itemId, change) {
    const item = cart.find(c => c.id === itemId);
    if (item) {
        const newQty = item.qty + change;
        if (newQty > 0 && newQty <= item.stok) {
            item.qty = newQty;
            updateCartDisplay();
        } else if (newQty <= 0) {
            removeFromCart(itemId);
        } else {
            showAlert('Stok tidak mencukupi!', 'warning');
        }
    }
}

function removeFromCart(itemId) {
    cart = cart.filter(c => c.id !== itemId);
    updateCartDisplay();
}

function clearCart() {
    cart = [];
    updateCartDisplay();
    resetBayarKembalian();
}

function toggleBayarKembalian() {
    const metode = document.getElementById('metodePembayaran').value;
    const section = document.getElementById('bayarKembalianSection');
    
    if (metode === 'cash') {
        section.style.display = 'block';
    } else {
        section.style.display = 'none';
        resetBayarKembalian();
    }
}

function hitungKembalian() {
    const total = cart.reduce((sum, item) => sum + (item.harga * item.qty), 0);
    const uangBayar = parseFloat(document.getElementById('uangBayar').value) || 0;
    const kembalian = uangBayar - total;
    
    const kembalianElement = document.getElementById('kembalian');
    if (kembalian < 0) {
        kembalianElement.textContent = 'Uang kurang!';
        kembalianElement.style.color = '#dc3545';
        kembalianElement.style.backgroundColor = '#f8d7da';
    } else {
        kembalianElement.textContent = formatRupiah(kembalian);
        kembalianElement.style.color = '#2d6a4f';
        kembalianElement.style.backgroundColor = '#e9f5f0';
    }
}

function setUangPas() {
    const total = cart.reduce((sum, item) => sum + (item.harga * item.qty), 0);
    document.getElementById('uangBayar').value = total;
    hitungKembalian();
}

function setUangBayar(amount) {
    const total = cart.reduce((sum, item) => sum + (item.harga * item.qty), 0);
    const currentBayar = parseFloat(document.getElementById('uangBayar').value) || 0;
    
    // Jika uang bayar masih 0 atau kurang dari total, set ke amount
    // Jika sudah ada, tambahkan amount
    if (currentBayar < total) {
        document.getElementById('uangBayar').value = total + amount;
    } else {
        document.getElementById('uangBayar').value = currentBayar + amount;
    }
    hitungKembalian();
}

function resetBayarKembalian() {
    document.getElementById('uangBayar').value = '';
    document.getElementById('kembalian').textContent = 'Rp 0';
    document.getElementById('kembalian').style.color = '#2d6a4f';
    document.getElementById('kembalian').style.backgroundColor = '#e9f5f0';
}

function processPayment() {
    if (cart.length === 0) {
        showAlert('Keranjang kosong', 'warning');
        return;
    }
    
    const anggotaId = document.getElementById('anggotaSelect').value;
    const metode = document.getElementById('metodePembayaran').value;
    const total = cart.reduce((sum, item) => sum + (item.harga * item.qty), 0);
    
    // Validasi uang bayar untuk metode cash
    if (metode === 'cash') {
        const uangBayar = parseFloat(document.getElementById('uangBayar').value) || 0;
        
        if (uangBayar === 0) {
            showAlert('Masukkan jumlah uang bayar!', 'warning');
            document.getElementById('uangBayar').focus();
            return;
        }
        
        if (uangBayar < total) {
            showAlert('Uang bayar kurang dari total belanja!', 'warning');
            document.getElementById('uangBayar').focus();
            return;
        }
    }
    
    // Validasi tipe anggota untuk metode bon
    if (metode === 'bon' && anggotaId) {
        const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
        const member = anggota.find(a => a.id === anggotaId);
        
        if (member && member.tipeAnggota === 'Umum') {
            showAlert('Anggota tipe Umum hanya bisa transaksi Cash!', 'warning');
            return;
        }
        
        if (member && member.status !== 'Aktif') {
            showAlert('Anggota dengan status ' + member.status + ' tidak bisa melakukan transaksi!', 'warning');
            return;
        }
        
        // Validate anggota is not keluar
        if (member && member.statusKeanggotaan === 'Keluar') {
            showAlert('Transaksi tidak dapat dilakukan. Anggota sudah keluar dari koperasi.', 'error');
            return;
        }
    }
    
    if (metode === 'bon' && !anggotaId) {
        showAlert('Pilih anggota untuk transaksi Bon!', 'warning');
        return;
    }
    
    // VALIDASI BATAS KREDIT untuk transaksi BON
    if (metode === 'bon' && anggotaId) {
        const validation = creditLimitValidator.validateCreditTransaction(anggotaId, total);
        
        if (!validation.valid) {
            showAlert(validation.message, 'error');
            return;
        }
    }
    
    // Get member info
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const member = anggotaId ? anggota.find(a => a.id === anggotaId) : null;
    
    // Ambil data bayar dan kembalian untuk cash
    const uangBayar = metode === 'cash' ? parseFloat(document.getElementById('uangBayar').value) || 0 : 0;
    const kembalian = metode === 'cash' ? uangBayar - total : 0;
    
    // Simpan transaksi
    const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
    const noTransaksi = generateNoByType('penjualan');
    
    const transaksi = {
        id: generateId(), // Keep for backward compatibility
        noTransaksi: noTransaksi, // New readable transaction number
        tanggal: new Date().toISOString(),
        kasir: currentUser.name,
        anggotaId: anggotaId || null,
        tipeAnggota: member ? member.tipeAnggota : 'Umum',
        metode: metode,
        items: cart,
        total: total,
        uangBayar: uangBayar,
        kembalian: kembalian,
        status: metode === 'bon' ? 'kredit' : 'lunas'
    };
    penjualan.push(transaksi);
    localStorage.setItem('penjualan', JSON.stringify(penjualan));
    
    // Update stok barang
    const barang = JSON.parse(localStorage.getItem('barang') || '[]');
    cart.forEach(cartItem => {
        const item = barang.find(b => b.id === cartItem.id);
        if (item) {
            item.stok -= cartItem.qty;
        }
    });
    localStorage.setItem('barang', JSON.stringify(barang));
    
    // Hitung HPP (Harga Pokok Penjualan)
    const totalHPP = cart.reduce((sum, item) => sum + (item.hpp * item.qty), 0);
    
    // Jurnal Penjualan
    // 1. Mencatat Pendapatan
    addJurnal(`Penjualan - ${transaksi.id}`, [
        { akun: metode === 'bon' ? '1-1200' : '1-1000', debit: total, kredit: 0 },  // Kas/Piutang (Debit)
        { akun: '4-1000', debit: 0, kredit: total }  // Pendapatan Penjualan (Kredit)
    ]);
    
    // 2. Mencatat HPP (Harga Pokok Penjualan)
    addJurnal(`HPP Penjualan - ${transaksi.id}`, [
        { akun: '5-1000', debit: totalHPP, kredit: 0 },  // Beban HPP (Debit)
        { akun: '1-1300', debit: 0, kredit: totalHPP }   // Persediaan Barang (Kredit)
    ]);
    
    showAlert('Transaksi berhasil');
    printStruk(transaksi);
    clearCart();
}

function printStruk(transaksi) {
    const koperasi = JSON.parse(localStorage.getItem('koperasi'));
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const member = anggota.find(a => a.id === transaksi.anggotaId);
    
    const strukWindow = window.open('', '', 'width=300,height=600');
    strukWindow.document.write(`
        <html>
        <head>
            <title>Struk Pembayaran</title>
            <style>
                body { font-family: monospace; font-size: 12px; padding: 10px; }
                .center { text-align: center; }
                .right { text-align: right; }
                hr { border: 1px dashed #000; }
                .logo { max-width: 80px; max-height: 80px; margin: 10px auto; }
            </style>
        </head>
        <body>
            <div class="center">
                ${koperasi.logo ? `<img src="${koperasi.logo}" alt="Logo" class="logo">` : ''}
                <h3 style="margin: 5px 0;">${koperasi.nama || 'Koperasi Karyawan'}</h3>
                <p style="margin: 5px 0;">${koperasi.alamat || ''}</p>
                ${koperasi.telepon ? `<p style="margin: 5px 0;">Telp: ${koperasi.telepon}</p>` : ''}
            </div>
            <hr>
            <p>No: ${transaksi.id}<br>
            Tanggal: ${formatDate(transaksi.tanggal)}<br>
            Kasir: ${transaksi.kasir}<br>
            ${member ? `Anggota: ${member.nama}` : 'Pembeli: Umum'}</p>
            <hr>
            ${transaksi.items.map(item => `
                <p style="margin: 5px 0;">${item.nama}<br>
                ${item.qty} x ${formatRupiah(item.harga)} = ${formatRupiah(item.qty * item.harga)}</p>
            `).join('')}
            <hr>
            <p class="right"><strong>Total: ${formatRupiah(transaksi.total)}</strong></p>
            ${transaksi.metode === 'cash' && transaksi.uangBayar ? `
                <p class="right">Bayar: ${formatRupiah(transaksi.uangBayar)}</p>
                <p class="right">Kembalian: ${formatRupiah(transaksi.kembalian)}</p>
            ` : ''}
            ${transaksi.metode === 'bon' ? `
                <p class="center" style="margin-top: 10px; font-weight: bold;">KREDIT / BON</p>
            ` : ''}
            <hr>
            <p class="center" style="margin-top: 15px;">Terima Kasih<br>Atas Kunjungan Anda</p>
        </body>
        </html>
    `);
    strukWindow.document.close();
    strukWindow.print();
}

function renderRiwayatTransaksi() {
    const content = document.getElementById('mainContent');
    const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
    
    content.innerHTML = `
        <h2>Riwayat Transaksi</h2>
        <table class="table">
            <thead>
                <tr><th>No</th><th>Tanggal</th><th>Kasir</th><th>Total</th><th>Metode</th><th>Status</th></tr>
            </thead>
            <tbody>
                ${penjualan.map(p => `
                    <tr>
                        <td>${p.id}</td>
                        <td>${formatDate(p.tanggal)}</td>
                        <td>${p.kasir}</td>
                        <td>${formatRupiah(p.total)}</td>
                        <td>${p.metode}</td>
                        <td>${p.status}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Tutup Kasir Functions

function showTutupKasModal() {
    const bukaKasStr = sessionStorage.getItem('bukaKas');
    if (!bukaKasStr) {
        showAlert('Tidak ada data buka kas!', 'warning');
        return;
    }
    
    let bukaKasData;
    try {
        bukaKasData = JSON.parse(bukaKasStr);
    } catch (e) {
        showAlert('Data buka kas tidak valid!', 'error');
        console.error('Error parsing bukaKas:', e);
        return;
    }
    
    // Hitung transaksi dalam shift ini
    const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
    const waktuBuka = new Date(bukaKasData.waktuBuka);
    const transaksiShift = penjualan.filter(p => new Date(p.tanggal) >= waktuBuka);
    
    // VALIDASI: Cek apakah ada penjualan
    if (transaksiShift.length === 0) {
        // Tampilkan konfirmasi pembatalan
        if (confirm('Tidak ada transaksi penjualan dalam shift ini.\n\nApakah Anda ingin MEMBATALKAN shift dan kembali ke menu utama?\n\n(Klik OK untuk batalkan shift, Cancel untuk tetap di POS)')) {
            // Batalkan shift - hapus data buka kas
            sessionStorage.removeItem('bukaKas');
            showAlert('Shift dibatalkan karena tidak ada transaksi', 'info');
            // Kembali ke menu utama atau refresh POS
            showMenu('dashboard');
            return;
        } else {
            // User memilih tetap di POS
            return;
        }
    }
    
    // Debug log
    console.log('Buka Kas Data:', bukaKasData);
    console.log('Transaksi Shift:', transaksiShift);
    
    // Hitung total dengan validasi
    const totalCash = transaksiShift
        .filter(t => t.metode === 'cash')
        .reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0);
    
    const totalBon = transaksiShift
        .filter(t => t.metode === 'bon')
        .reduce((sum, t) => sum + (parseFloat(t.total) || 0), 0);
    
    const totalPenjualan = totalCash + totalBon;
    const jumlahTransaksi = transaksiShift.length;
    
    // Validasi modalAwal
    const modalAwal = parseFloat(bukaKasData.modalAwal) || 0;
    const expectedCash = modalAwal + totalCash;
    
    // Debug log hasil perhitungan
    console.log('Modal Awal:', modalAwal);
    console.log('Total Cash:', totalCash);
    console.log('Total Bon:', totalBon);
    console.log('Total Penjualan:', totalPenjualan);
    console.log('Expected Cash:', expectedCash);
    
    // Simpan data untuk digunakan di fungsi lain
    tutupKasData = {
        bukaKasData: bukaKasData,
        transaksiShift: transaksiShift,
        modalAwal: modalAwal,
        totalCash: totalCash,
        totalBon: totalBon,
        totalPenjualan: totalPenjualan,
        jumlahTransaksi: jumlahTransaksi,
        expectedCash: expectedCash
    };
    
    const modalHTML = `
        <div class="modal fade" id="tutupKasModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-warning">
                        <h5 class="modal-title">
                            <i class="bi bi-lock me-2"></i>Tutup Kasir
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <strong><i class="bi bi-info-circle me-2"></i>Informasi Shift</strong><br>
                            <strong>Kasir:</strong> ${bukaKasData.kasir}<br>
                            <strong>Buka Kas:</strong> ${new Date(bukaKasData.waktuBuka).toLocaleString('id-ID')}<br>
                            <strong>Tutup Kas:</strong> ${new Date().toLocaleString('id-ID')}
                        </div>
                        
                        <h6 class="mb-3">Ringkasan Transaksi</h6>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-body text-center">
                                        <h6 class="text-muted">Jumlah Transaksi</h6>
                                        <h3 style="color: #2d6a4f;">${jumlahTransaksi}</h3>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-body text-center">
                                        <h6 class="text-muted">Total Penjualan</h6>
                                        <h3 style="color: #52b788;">${formatRupiah(totalPenjualan)}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <table class="table table-sm">
                            <tr>
                                <td><strong>Modal Awal Kasir:</strong></td>
                                <td class="text-end">${formatRupiah(modalAwal)}</td>
                            </tr>
                            <tr>
                                <td><strong>Penjualan Cash:</strong></td>
                                <td class="text-end">${formatRupiah(totalCash)}</td>
                            </tr>
                            <tr>
                                <td><strong>Penjualan Bon:</strong></td>
                                <td class="text-end">${formatRupiah(totalBon)}</td>
                            </tr>
                            <tr class="table-primary">
                                <td><strong>Kas yang Seharusnya:</strong></td>
                                <td class="text-end"><strong>${formatRupiah(expectedCash)}</strong></td>
                            </tr>
                        </table>
                        
                        <hr>
                        
                        <form id="tutupKasForm">
                            <div class="mb-3">
                                <label class="form-label"><strong>Kas Aktual (Hasil Hitung Fisik):</strong></label>
                                <input type="number" class="form-control" id="kasAktual" required 
                                    placeholder="Masukkan hasil hitung kas fisik">
                                <small class="text-muted">Hitung uang fisik di laci kasir</small>
                            </div>
                            
                            <div class="mb-3" id="selisihInfo" style="display: none;">
                                <div class="alert" id="selisihAlert">
                                    <strong>Selisih Kas:</strong> <span id="selisihAmount"></span>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Catatan (Opsional):</label>
                                <textarea class="form-control" id="catatanTutupKas" rows="3" 
                                    placeholder="Catatan tambahan untuk shift ini..."></textarea>
                            </div>
                        </form>
                        
                        <div class="alert alert-warning">
                            <strong><i class="bi bi-exclamation-triangle me-2"></i>Perhatian:</strong>
                            Setelah tutup kasir, Anda harus buka kas lagi untuk melakukan transaksi baru.
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="button" class="btn btn-info" onclick="hitungSelisih()">
                            <i class="bi bi-calculator me-1"></i>Hitung Selisih
                        </button>
                        <button type="button" class="btn btn-success" onclick="prosesTutupKas()">
                            <i class="bi bi-printer me-1"></i>Tutup & Print Laporan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('tutupKasModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modalElement = document.getElementById('tutupKasModal');
    if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    } else {
        console.error('Modal tutupKasModal tidak ditemukan!');
        showAlert('Gagal menampilkan modal tutup kasir', 'error');
    }
}

function hitungSelisih() {
    if (!tutupKasData) {
        showAlert('Data tutup kas tidak ditemukan!', 'error');
        return;
    }
    
    const kasAktual = parseFloat(document.getElementById('kasAktual').value);
    
    if (!kasAktual) {
        showAlert('Masukkan kas aktual terlebih dahulu!', 'warning');
        return;
    }
    
    const selisih = kasAktual - tutupKasData.expectedCash;
    const selisihInfo = document.getElementById('selisihInfo');
    const selisihAlert = document.getElementById('selisihAlert');
    const selisihAmount = document.getElementById('selisihAmount');
    
    selisihInfo.style.display = 'block';
    
    if (selisih === 0) {
        selisihAlert.className = 'alert alert-success';
        selisihAmount.textContent = formatRupiah(0) + ' (PAS)';
    } else if (selisih > 0) {
        selisihAlert.className = 'alert alert-warning';
        selisihAmount.textContent = formatRupiah(selisih) + ' (LEBIH)';
    } else {
        selisihAlert.className = 'alert alert-danger';
        selisihAmount.textContent = formatRupiah(Math.abs(selisih)) + ' (KURANG)';
    }
}

function prosesTutupKas() {
    if (!tutupKasData) {
        showAlert('Data tutup kas tidak ditemukan!', 'error');
        return;
    }
    
    const kasAktual = parseFloat(document.getElementById('kasAktual').value);
    
    if (!kasAktual) {
        showAlert('Masukkan kas aktual terlebih dahulu!', 'warning');
        return;
    }
    
    const selisih = kasAktual - tutupKasData.expectedCash;
    const catatan = document.getElementById('catatanTutupKas').value;
    
    // Simpan data tutup kas
    const dataTutupKas = {
        id: generateId(),
        shiftId: tutupKasData.bukaKasData.id,
        kasir: tutupKasData.bukaKasData.kasir,
        waktuBuka: tutupKasData.bukaKasData.waktuBuka,
        waktuTutup: new Date().toISOString(),
        modalAwal: tutupKasData.modalAwal,
        totalCash: tutupKasData.totalCash,
        totalBon: tutupKasData.totalBon,
        totalPenjualan: tutupKasData.totalPenjualan,
        jumlahTransaksi: tutupKasData.jumlahTransaksi,
        kasSeharusnya: tutupKasData.expectedCash,
        kasAktual: kasAktual,
        selisih: selisih,
        catatan: catatan
    };
    
    // Simpan ke localStorage
    const riwayatTutupKas = JSON.parse(localStorage.getItem('riwayatTutupKas') || '[]');
    riwayatTutupKas.push(dataTutupKas);
    localStorage.setItem('riwayatTutupKas', JSON.stringify(riwayatTutupKas));
    
    // Jika ada selisih, catat di jurnal
    if (selisih !== 0) {
        if (selisih > 0) {
            // Kas lebih (pendapatan lain-lain)
            addJurnal('Selisih Kas Lebih - Tutup Kasir', [
                { akun: '1-1000', debit: selisih, kredit: 0 },
                { akun: '4-1000', debit: 0, kredit: selisih }
            ]);
        } else {
            // Kas kurang (beban selisih)
            addJurnal('Selisih Kas Kurang - Tutup Kasir', [
                { akun: '5-2000', debit: Math.abs(selisih), kredit: 0 },
                { akun: '1-1000', debit: 0, kredit: Math.abs(selisih) }
            ]);
        }
    }
    
    // Print laporan
    printLaporanTutupKas(dataTutupKas);
    
    // Clear session
    sessionStorage.removeItem('bukaKas');
    sessionStorage.removeItem('shiftId');
    
    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('tutupKasModal')).hide();
    
    showAlert('Kasir berhasil ditutup. Silakan buka kas lagi untuk transaksi baru.', 'success');
    
    // Redirect to dashboard or show buka kas
    setTimeout(() => {
        renderPOS();
    }, 1000);
}

function printLaporanTutupKas(data) {
    const koperasi = JSON.parse(localStorage.getItem('koperasi'));
    const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
    const waktuBuka = new Date(data.waktuBuka);
    const waktuTutup = new Date(data.waktuTutup);
    const transaksiShift = penjualan.filter(p => {
        const waktuTransaksi = new Date(p.tanggal);
        return waktuTransaksi >= waktuBuka && waktuTransaksi <= waktuTutup;
    });
    
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
        <html>
        <head>
            <title>Laporan Tutup Kasir - ${data.id}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2d6a4f; padding-bottom: 15px; }
                .logo { max-width: 100px; max-height: 100px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                th { background-color: #2d6a4f; color: white; }
                .info-table { border: none; margin-bottom: 20px; }
                .info-table td { border: none; padding: 5px; }
                .total-row { font-weight: bold; background-color: #e9f5f0; }
                .selisih-plus { color: #52b788; font-weight: bold; }
                .selisih-minus { color: #dc3545; font-weight: bold; }
                .selisih-pas { color: #2d6a4f; font-weight: bold; }
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
                }
                @media print {
                    .print-btn { display: none; }
                }
            </style>
        </head>
        <body>
            <button class="print-btn" onclick="window.print()">🖨️ Print</button>
            
            <div class="header">
                ${koperasi.logo ? `<img src="${koperasi.logo}" class="logo">` : ''}
                <h2 style="margin: 10px 0; color: #2d6a4f;">${koperasi.nama || 'Koperasi Karyawan'}</h2>
                <p style="margin: 5px 0;">${koperasi.alamat || ''}</p>
                <h3 style="margin-top: 15px; color: #2d6a4f;">LAPORAN TUTUP KASIR</h3>
            </div>
            
            <table class="info-table">
                <tr>
                    <td style="width: 150px;"><strong>Kasir:</strong></td>
                    <td>${data.kasir}</td>
                    <td style="width: 150px;"><strong>No. Shift:</strong></td>
                    <td>${data.id}</td>
                </tr>
                <tr>
                    <td><strong>Buka Kas:</strong></td>
                    <td>${new Date(data.waktuBuka).toLocaleString('id-ID')}</td>
                    <td><strong>Tutup Kas:</strong></td>
                    <td>${new Date(data.waktuTutup).toLocaleString('id-ID')}</td>
                </tr>
            </table>
            
            <h4 style="color: #2d6a4f; margin-top: 30px;">Ringkasan Penjualan</h4>
            <table>
                <tr>
                    <td><strong>Modal Awal Kasir</strong></td>
                    <td style="text-align: right;">${formatRupiah(data.modalAwal)}</td>
                </tr>
                <tr>
                    <td><strong>Jumlah Transaksi</strong></td>
                    <td style="text-align: right;">${data.jumlahTransaksi} transaksi</td>
                </tr>
                <tr>
                    <td><strong>Penjualan Cash</strong></td>
                    <td style="text-align: right;">${formatRupiah(data.totalCash)}</td>
                </tr>
                <tr>
                    <td><strong>Penjualan Bon (Kredit)</strong></td>
                    <td style="text-align: right;">${formatRupiah(data.totalBon)}</td>
                </tr>
                <tr class="total-row">
                    <td><strong>Total Penjualan</strong></td>
                    <td style="text-align: right;"><strong>${formatRupiah(data.totalPenjualan)}</strong></td>
                </tr>
            </table>
            
            <h4 style="color: #2d6a4f; margin-top: 30px;">Rekonsiliasi Kas</h4>
            <table>
                <tr>
                    <td><strong>Modal Awal</strong></td>
                    <td style="text-align: right;">${formatRupiah(data.modalAwal)}</td>
                </tr>
                <tr>
                    <td><strong>Penjualan Cash</strong></td>
                    <td style="text-align: right;">${formatRupiah(data.totalCash)}</td>
                </tr>
                <tr class="total-row">
                    <td><strong>Kas yang Seharusnya</strong></td>
                    <td style="text-align: right;"><strong>${formatRupiah(data.kasSeharusnya)}</strong></td>
                </tr>
                <tr>
                    <td><strong>Kas Aktual (Fisik)</strong></td>
                    <td style="text-align: right;">${formatRupiah(data.kasAktual)}</td>
                </tr>
                <tr class="total-row">
                    <td><strong>Selisih Kas</strong></td>
                    <td style="text-align: right;" class="${data.selisih === 0 ? 'selisih-pas' : data.selisih > 0 ? 'selisih-plus' : 'selisih-minus'}">
                        <strong>${formatRupiah(Math.abs(data.selisih))} ${data.selisih === 0 ? '(PAS)' : data.selisih > 0 ? '(LEBIH)' : '(KURANG)'}</strong>
                    </td>
                </tr>
            </table>
            
            ${data.catatan ? `
                <h4 style="color: #2d6a4f; margin-top: 30px;">Catatan</h4>
                <p style="border: 1px solid #ddd; padding: 10px; background: #f8f9fa;">${data.catatan}</p>
            ` : ''}
            
            <h4 style="color: #2d6a4f; margin-top: 30px;">Detail Transaksi</h4>
            <table>
                <thead>
                    <tr>
                        <th>No</th>
                        <th>Waktu</th>
                        <th>Anggota</th>
                        <th>Total</th>
                        <th>Metode</th>
                    </tr>
                </thead>
                <tbody>
                    ${transaksiShift.map((t, idx) => {
                        const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
                        const member = anggota.find(a => a.id === t.anggotaId);
                        return `
                            <tr>
                                <td>${idx + 1}</td>
                                <td>${new Date(t.tanggal).toLocaleTimeString('id-ID')}</td>
                                <td>${member ? member.nama : 'Umum'}</td>
                                <td style="text-align: right;">${formatRupiah(t.total)}</td>
                                <td>${t.metode.toUpperCase()}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            
            <div style="margin-top: 60px;">
                <div style="float: left; width: 45%; text-align: center;">
                    <p style="margin-bottom: 80px;">Kasir,</p>
                    <p style="border-top: 1px solid #000; display: inline-block; padding-top: 5px; min-width: 200px;">
                        ${data.kasir}
                    </p>
                </div>
                <div style="float: right; width: 45%; text-align: center;">
                    <p style="margin-bottom: 80px;">Mengetahui,</p>
                    <p style="border-top: 1px solid #000; display: inline-block; padding-top: 5px; min-width: 200px;">
                        (________________)
                    </p>
                </div>
                <div style="clear: both;"></div>
            </div>
            
            <div style="margin-top: 40px; text-align: center; color: #666; font-size: 12px;">
                <p>Dokumen ini dicetak dari Sistem Koperasi Karyawan</p>
                <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function renderRiwayatTutupKas() {
    const content = document.getElementById('mainContent');
    const riwayat = JSON.parse(localStorage.getItem('riwayatTutupKas') || '[]');
    
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 style="color: #2d6a4f; font-weight: 700;">
                <i class="bi bi-clock-history me-2"></i>Riwayat Tutup Kasir
            </h2>
        </div>
        
        <div class="card">
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>No. Shift</th>
                                <th>Kasir</th>
                                <th>Waktu Buka</th>
                                <th>Waktu Tutup</th>
                                <th>Total Penjualan</th>
                                <th>Selisih</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${riwayat.reverse().map(r => `
                                <tr>
                                    <td>${r.id}</td>
                                    <td>${r.kasir}</td>
                                    <td>${new Date(r.waktuBuka).toLocaleString('id-ID')}</td>
                                    <td>${new Date(r.waktuTutup).toLocaleString('id-ID')}</td>
                                    <td>${formatRupiah(r.totalPenjualan)}</td>
                                    <td>
                                        <span class="${r.selisih === 0 ? 'text-success' : r.selisih > 0 ? 'text-warning' : 'text-danger'}">
                                            ${formatRupiah(Math.abs(r.selisih))} ${r.selisih === 0 ? '(PAS)' : r.selisih > 0 ? '(LEBIH)' : '(KURANG)'}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn btn-sm btn-info" onclick="viewDetailTutupKas('${r.id}')">
                                            <i class="bi bi-eye"></i> Detail
                                        </button>
                                        <button class="btn btn-sm btn-success" onclick="reprintLaporanTutupKas('${r.id}')">
                                            <i class="bi bi-printer"></i> Print
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function viewDetailTutupKas(id) {
    const riwayat = JSON.parse(localStorage.getItem('riwayatTutupKas') || '[]');
    const data = riwayat.find(r => r.id === id);
    
    if (!data) return;
    
    const modalHTML = `
        <div class="modal fade" id="detailTutupKasModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Detail Tutup Kasir - ${data.id}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <table class="table">
                            <tr><td><strong>Kasir:</strong></td><td>${data.kasir}</td></tr>
                            <tr><td><strong>Buka Kas:</strong></td><td>${new Date(data.waktuBuka).toLocaleString('id-ID')}</td></tr>
                            <tr><td><strong>Tutup Kas:</strong></td><td>${new Date(data.waktuTutup).toLocaleString('id-ID')}</td></tr>
                            <tr><td><strong>Modal Awal:</strong></td><td>${formatRupiah(data.modalAwal)}</td></tr>
                            <tr><td><strong>Jumlah Transaksi:</strong></td><td>${data.jumlahTransaksi}</td></tr>
                            <tr><td><strong>Penjualan Cash:</strong></td><td>${formatRupiah(data.totalCash)}</td></tr>
                            <tr><td><strong>Penjualan Bon:</strong></td><td>${formatRupiah(data.totalBon)}</td></tr>
                            <tr><td><strong>Total Penjualan:</strong></td><td>${formatRupiah(data.totalPenjualan)}</td></tr>
                            <tr><td><strong>Kas Seharusnya:</strong></td><td>${formatRupiah(data.kasSeharusnya)}</td></tr>
                            <tr><td><strong>Kas Aktual:</strong></td><td>${formatRupiah(data.kasAktual)}</td></tr>
                            <tr><td><strong>Selisih:</strong></td><td class="${data.selisih === 0 ? 'text-success' : data.selisih > 0 ? 'text-warning' : 'text-danger'}">${formatRupiah(Math.abs(data.selisih))} ${data.selisih === 0 ? '(PAS)' : data.selisih > 0 ? '(LEBIH)' : '(KURANG)'}</td></tr>
                            ${data.catatan ? `<tr><td><strong>Catatan:</strong></td><td>${data.catatan}</td></tr>` : ''}
                        </table>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                        <button type="button" class="btn btn-success" onclick="reprintLaporanTutupKas('${data.id}')">
                            <i class="bi bi-printer me-1"></i>Print Laporan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const existingModal = document.getElementById('detailTutupKasModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    new bootstrap.Modal(document.getElementById('detailTutupKasModal')).show();
}

function reprintLaporanTutupKas(id) {
    const riwayat = JSON.parse(localStorage.getItem('riwayatTutupKas') || '[]');
    const data = riwayat.find(r => r.id === id);
    
    if (data) {
        printLaporanTutupKas(data);
    }
}
