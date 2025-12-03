// Pinjaman Module

function renderPinjaman() {
    const content = document.getElementById('mainContent');
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const pinjaman = JSON.parse(localStorage.getItem('pinjaman') || '[]');
    
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 style="color: #2d6a4f; font-weight: 700;">
                <i class="bi bi-cash-coin me-2"></i>Pinjaman Anggota
            </h2>
        </div>
        
        <div class="row mb-3">
            <div class="col-md-4">
                <div class="card">
                    <div class="card-body text-center">
                        <h6 class="text-muted">Total Pinjaman Aktif</h6>
                        <h3 style="color: #2d6a4f;">${formatRupiah(pinjaman.filter(p => p.status === 'aktif').reduce((sum, p) => sum + p.sisaPinjaman, 0))}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-body text-center">
                        <h6 class="text-muted">Total Pinjaman Lunas</h6>
                        <h3 style="color: #52b788;">${pinjaman.filter(p => p.status === 'lunas').length}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-body text-center">
                        <h6 class="text-muted">Jumlah Peminjam</h6>
                        <h3 style="color: #40916c;">${new Set(pinjaman.map(p => p.anggotaId)).size}</h3>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <div class="d-flex justify-content-between align-items-center">
                    <span><i class="bi bi-list-ul me-2"></i>Daftar Pinjaman</span>
                    <button class="btn btn-primary btn-sm" onclick="showPinjamanModal()">
                        <i class="bi bi-plus-circle me-1"></i>Tambah Pinjaman
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>No. Pinjaman</th>
                                <th>Anggota</th>
                                <th>Jumlah Pinjaman</th>
                                <th>Bunga (%)</th>
                                <th>Total Bayar</th>
                                <th>Sisa Pinjaman</th>
                                <th>Tanggal</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pinjaman.map(p => {
                                const ang = anggota.find(a => a.id === p.anggotaId);
                                return `
                                    <tr>
                                        <td>${p.noPinjaman}</td>
                                        <td>${ang?.nama || '-'}</td>
                                        <td>${formatRupiah(p.jumlahPinjaman)}</td>
                                        <td>${p.bunga}%</td>
                                        <td>${formatRupiah(p.totalBayar)}</td>
                                        <td>${formatRupiah(p.sisaPinjaman)}</td>
                                        <td>${formatDate(p.tanggal)}</td>
                                        <td>
                                            <span class="badge ${p.status === 'lunas' ? 'bg-success' : 'bg-warning'}">
                                                ${p.status === 'lunas' ? 'Lunas' : 'Aktif'}
                                            </span>
                                        </td>
                                        <td>
                                            ${p.status === 'aktif' ? `
                                                <button class="btn btn-sm btn-success" onclick="showAngsuranModal('${p.id}')" title="Bayar Angsuran">
                                                    <i class="bi bi-cash"></i>
                                                </button>
                                            ` : ''}
                                            <button class="btn btn-sm btn-info" onclick="viewPinjaman('${p.id}')" title="Detail">
                                                <i class="bi bi-eye"></i>
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
        
        <!-- Modal Pinjaman -->
        <div class="modal fade" id="pinjamanModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Tambah Pinjaman Baru</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="pinjamanForm">
                            <div class="mb-3">
                                <label class="form-label">Pilih Anggota</label>
                                <select class="form-select" id="anggotaPinjaman" required>
                                    <option value="">-- Pilih Anggota --</option>
                                    ${anggota.map(a => `<option value="${a.id}">${a.nama} - ${a.nik}</option>`).join('')}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Jumlah Pinjaman</label>
                                <input type="number" class="form-control" id="jumlahPinjaman" required min="0" onchange="hitungTotalBayar()">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Bunga (%)</label>
                                <input type="number" class="form-control" id="bungaPinjaman" required min="0" max="100" step="0.1" onchange="hitungTotalBayar()">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Jangka Waktu (Bulan)</label>
                                <input type="number" class="form-control" id="jangkaWaktu" required min="1" onchange="hitungTotalBayar()">
                            </div>
                            <div class="alert alert-info" id="infoAngsuran" style="display:none;">
                                <strong>Total yang harus dibayar:</strong> <span id="totalBayarInfo">Rp 0</span><br>
                                <strong>Angsuran per bulan:</strong> <span id="angsuranInfo">Rp 0</span>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Tanggal Pinjaman</label>
                                <input type="date" class="form-control" id="tanggalPinjaman" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Keterangan</label>
                                <textarea class="form-control" id="keteranganPinjaman" rows="2"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="button" class="btn btn-primary" onclick="savePinjaman()">Simpan</button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Modal Angsuran -->
        <div class="modal fade" id="angsuranModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Bayar Angsuran</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div id="angsuranInfo"></div>
                        <form id="angsuranForm">
                            <input type="hidden" id="pinjamanId">
                            <div class="mb-3">
                                <label class="form-label">Jumlah Bayar</label>
                                <input type="number" class="form-control" id="jumlahBayar" required min="0">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Tanggal Bayar</label>
                                <input type="date" class="form-control" id="tanggalBayar" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Keterangan</label>
                                <textarea class="form-control" id="keteranganBayar" rows="2"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="button" class="btn btn-success" onclick="saveAngsuran()">Proses Pembayaran</button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Modal Detail Pinjaman -->
        <div class="modal fade" id="detailPinjamanModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Detail Pinjaman</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="detailPinjamanContent"></div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('tanggalPinjaman').value = new Date().toISOString().split('T')[0];
}

function showPinjamanModal() {
    document.getElementById('pinjamanForm').reset();
    document.getElementById('tanggalPinjaman').value = new Date().toISOString().split('T')[0];
    document.getElementById('infoAngsuran').style.display = 'none';
    new bootstrap.Modal(document.getElementById('pinjamanModal')).show();
}

function hitungTotalBayar() {
    const jumlah = parseFloat(document.getElementById('jumlahPinjaman').value) || 0;
    const bunga = parseFloat(document.getElementById('bungaPinjaman').value) || 0;
    const jangkaWaktu = parseInt(document.getElementById('jangkaWaktu').value) || 0;
    
    if (jumlah > 0 && jangkaWaktu > 0) {
        const totalBunga = jumlah * (bunga / 100);
        const totalBayar = jumlah + totalBunga;
        const angsuran = totalBayar / jangkaWaktu;
        
        document.getElementById('totalBayarInfo').textContent = formatRupiah(totalBayar);
        document.getElementById('angsuranInfo').textContent = formatRupiah(angsuran);
        document.getElementById('infoAngsuran').style.display = 'block';
    }
}

function savePinjaman() {
    const pinjaman = JSON.parse(localStorage.getItem('pinjaman') || '[]');
    
    const jumlah = parseFloat(document.getElementById('jumlahPinjaman').value);
    const bunga = parseFloat(document.getElementById('bungaPinjaman').value);
    const jangkaWaktu = parseInt(document.getElementById('jangkaWaktu').value);
    
    const totalBunga = jumlah * (bunga / 100);
    const totalBayar = jumlah + totalBunga;
    
    const noPinjaman = 'PJM' + Date.now();
    
    const data = {
        id: generateId(),
        noPinjaman: noPinjaman,
        anggotaId: document.getElementById('anggotaPinjaman').value,
        jumlahPinjaman: jumlah,
        bunga: bunga,
        totalBunga: totalBunga,
        totalBayar: totalBayar,
        sisaPinjaman: totalBayar,
        jangkaWaktu: jangkaWaktu,
        angsuranPerBulan: totalBayar / jangkaWaktu,
        tanggal: document.getElementById('tanggalPinjaman').value,
        keterangan: document.getElementById('keteranganPinjaman').value,
        status: 'aktif',
        riwayatBayar: []
    };
    
    pinjaman.push(data);
    localStorage.setItem('pinjaman', JSON.stringify(pinjaman));
    
    // Update jurnal
    addJurnal('Pinjaman Anggota', [
        { akun: '1-1200', debit: data.jumlahPinjaman, kredit: 0 },
        { akun: '1-1000', debit: 0, kredit: data.jumlahPinjaman }
    ]);
    
    bootstrap.Modal.getInstance(document.getElementById('pinjamanModal')).hide();
    showAlert('Pinjaman berhasil disimpan');
    renderPinjaman();
}

function showAngsuranModal(pinjamanId) {
    const pinjaman = JSON.parse(localStorage.getItem('pinjaman') || '[]');
    const item = pinjaman.find(p => p.id === pinjamanId);
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const ang = anggota.find(a => a.id === item.anggotaId);
    
    if (item) {
        document.getElementById('pinjamanId').value = item.id;
        document.getElementById('jumlahBayar').value = Math.ceil(item.angsuranPerBulan);
        document.getElementById('tanggalBayar').value = new Date().toISOString().split('T')[0];
        
        document.getElementById('angsuranInfo').innerHTML = `
            <div class="alert alert-info">
                <strong>Anggota:</strong> ${ang?.nama || '-'}<br>
                <strong>No. Pinjaman:</strong> ${item.noPinjaman}<br>
                <strong>Sisa Pinjaman:</strong> ${formatRupiah(item.sisaPinjaman)}<br>
                <strong>Angsuran per Bulan:</strong> ${formatRupiah(item.angsuranPerBulan)}
            </div>
        `;
        
        new bootstrap.Modal(document.getElementById('angsuranModal')).show();
    }
}

function saveAngsuran() {
    const pinjaman = JSON.parse(localStorage.getItem('pinjaman') || '[]');
    const pinjamanId = document.getElementById('pinjamanId').value;
    const jumlahBayar = parseFloat(document.getElementById('jumlahBayar').value);
    
    const index = pinjaman.findIndex(p => p.id === pinjamanId);
    if (index !== -1) {
        const item = pinjaman[index];
        
        if (jumlahBayar > item.sisaPinjaman) {
            showAlert('Jumlah bayar melebihi sisa pinjaman!', 'warning');
            return;
        }
        
        // Add to riwayat bayar
        item.riwayatBayar.push({
            tanggal: document.getElementById('tanggalBayar').value,
            jumlah: jumlahBayar,
            keterangan: document.getElementById('keteranganBayar').value
        });
        
        // Update sisa pinjaman
        item.sisaPinjaman -= jumlahBayar;
        
        // Check if lunas
        if (item.sisaPinjaman <= 0) {
            item.status = 'lunas';
            item.sisaPinjaman = 0;
        }
        
        pinjaman[index] = item;
        localStorage.setItem('pinjaman', JSON.stringify(pinjaman));
        
        // Update jurnal
        addJurnal('Pembayaran Angsuran', [
            { akun: '1-1000', debit: jumlahBayar, kredit: 0 },
            { akun: '1-1200', debit: 0, kredit: jumlahBayar }
        ]);
        
        bootstrap.Modal.getInstance(document.getElementById('angsuranModal')).hide();
        showAlert('Pembayaran angsuran berhasil diproses');
        renderPinjaman();
    }
}

function viewPinjaman(pinjamanId) {
    const pinjaman = JSON.parse(localStorage.getItem('pinjaman') || '[]');
    const item = pinjaman.find(p => p.id === pinjamanId);
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const ang = anggota.find(a => a.id === item.anggotaId);
    
    if (item) {
        const content = document.getElementById('detailPinjamanContent');
        content.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6>Informasi Pinjaman</h6>
                    <table class="table table-sm">
                        <tr><td><strong>No. Pinjaman</strong></td><td>${item.noPinjaman}</td></tr>
                        <tr><td><strong>Anggota</strong></td><td>${ang?.nama || '-'}</td></tr>
                        <tr><td><strong>Jumlah Pinjaman</strong></td><td>${formatRupiah(item.jumlahPinjaman)}</td></tr>
                        <tr><td><strong>Bunga</strong></td><td>${item.bunga}%</td></tr>
                        <tr><td><strong>Total Bunga</strong></td><td>${formatRupiah(item.totalBunga)}</td></tr>
                        <tr><td><strong>Total Bayar</strong></td><td>${formatRupiah(item.totalBayar)}</td></tr>
                        <tr><td><strong>Sisa Pinjaman</strong></td><td>${formatRupiah(item.sisaPinjaman)}</td></tr>
                        <tr><td><strong>Jangka Waktu</strong></td><td>${item.jangkaWaktu} Bulan</td></tr>
                        <tr><td><strong>Angsuran/Bulan</strong></td><td>${formatRupiah(item.angsuranPerBulan)}</td></tr>
                        <tr><td><strong>Status</strong></td><td><span class="badge ${item.status === 'lunas' ? 'bg-success' : 'bg-warning'}">${item.status === 'lunas' ? 'Lunas' : 'Aktif'}</span></td></tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6>Riwayat Pembayaran</h6>
                    <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                        <table class="table table-sm">
                            <thead>
                                <tr><th>Tanggal</th><th>Jumlah</th></tr>
                            </thead>
                            <tbody>
                                ${item.riwayatBayar.map(r => `
                                    <tr>
                                        <td>${formatDate(r.tanggal)}</td>
                                        <td>${formatRupiah(r.jumlah)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <th>Total Dibayar</th>
                                    <th>${formatRupiah(item.riwayatBayar.reduce((sum, r) => sum + r.jumlah, 0))}</th>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        new bootstrap.Modal(document.getElementById('detailPinjamanModal')).show();
    }
}
