// Keuangan Module

function renderCOA() {
    const content = document.getElementById('mainContent');
    const coa = JSON.parse(localStorage.getItem('coa') || '[]');
    
    content.innerHTML = `
        <h2>Chart of Account (COA)</h2>
        <button class="btn btn-primary mb-3" onclick="showCOAModal()">Tambah Akun</button>
        <table class="table">
            <thead>
                <tr><th>Kode</th><th>Nama Akun</th><th>Tipe</th><th>Saldo</th><th>Aksi</th></tr>
            </thead>
            <tbody>
                ${coa.map(c => `
                    <tr>
                        <td>${c.kode}</td>
                        <td>${c.nama}</td>
                        <td>${c.tipe}</td>
                        <td>${formatRupiah(c.saldo)}</td>
                        <td>
                            <button class="btn btn-sm btn-warning" onclick="editCOA('${c.kode}')">Edit</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteCOA('${c.kode}')">Hapus</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div class="modal fade" id="coaModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Form COA</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="coaForm">
                            <input type="hidden" id="oldKode">
                            <div class="mb-3">
                                <label class="form-label">Kode Akun</label>
                                <input type="text" class="form-control" id="kodeAkun" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Nama Akun</label>
                                <input type="text" class="form-control" id="namaAkun" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Tipe</label>
                                <select class="form-select" id="tipeAkun" required>
                                    <option value="Aset">Aset</option>
                                    <option value="Kewajiban">Kewajiban</option>
                                    <option value="Modal">Modal</option>
                                    <option value="Pendapatan">Pendapatan</option>
                                    <option value="Beban">Beban</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Saldo Awal</label>
                                <input type="number" class="form-control" id="saldoAkun" value="0">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="button" class="btn btn-primary" onclick="saveCOA()">Simpan</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showCOAModal() {
    document.getElementById('coaForm').reset();
    document.getElementById('oldKode').value = '';
    new bootstrap.Modal(document.getElementById('coaModal')).show();
}

function editCOA(kode) {
    const coa = JSON.parse(localStorage.getItem('coa') || '[]');
    const item = coa.find(c => c.kode === kode);
    if (item) {
        document.getElementById('oldKode').value = item.kode;
        document.getElementById('kodeAkun').value = item.kode;
        document.getElementById('namaAkun').value = item.nama;
        document.getElementById('tipeAkun').value = item.tipe;
        document.getElementById('saldoAkun').value = item.saldo;
        new bootstrap.Modal(document.getElementById('coaModal')).show();
    }
}

function saveCOA() {
    const coa = JSON.parse(localStorage.getItem('coa') || '[]');
    const oldKode = document.getElementById('oldKode').value;
    
    const data = {
        kode: document.getElementById('kodeAkun').value,
        nama: document.getElementById('namaAkun').value,
        tipe: document.getElementById('tipeAkun').value,
        saldo: parseFloat(document.getElementById('saldoAkun').value) || 0
    };
    
    if (oldKode) {
        const index = coa.findIndex(c => c.kode === oldKode);
        coa[index] = data;
    } else {
        coa.push(data);
    }
    
    localStorage.setItem('coa', JSON.stringify(coa));
    bootstrap.Modal.getInstance(document.getElementById('coaModal')).hide();
    showAlert('Data COA berhasil disimpan');
    renderCOA();
}

function deleteCOA(kode) {
    if (confirm('Yakin ingin menghapus akun ini?')) {
        let coa = JSON.parse(localStorage.getItem('coa') || '[]');
        coa = coa.filter(c => c.kode !== kode);
        localStorage.setItem('coa', JSON.stringify(coa));
        showAlert('Data COA berhasil dihapus', 'info');
        renderCOA();
    }
}

function renderJurnal() {
    const content = document.getElementById('mainContent');
    let jurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
    const coa = JSON.parse(localStorage.getItem('coa') || '[]');
    
    // Load filter from session if exists
    let filteredJurnal = jurnal;
    let filterActive = false;
    let filterInfo = '';
    
    if (typeof loadFilterFromSession === 'function') {
        const savedFilter = loadFilterFromSession();
        if (savedFilter && savedFilter.startDate && savedFilter.endDate) {
            if (typeof applyDateFilter === 'function') {
                filteredJurnal = applyDateFilter(jurnal, savedFilter.startDate, savedFilter.endDate);
                filterActive = true;
                filterInfo = `Filter aktif: ${formatDate(savedFilter.startDate)} - ${formatDate(savedFilter.endDate)}`;
            }
        }
    }
    
    // Get filter UI HTML
    let filterUI = '';
    if (typeof renderJurnalDateFilter === 'function') {
        filterUI = renderJurnalDateFilter();
    }
    
    content.innerHTML = `
        <h2>Jurnal Harian</h2>
        <button class="btn btn-primary mb-3" onclick="showJurnalModal()">Tambah Jurnal</button>
        
        ${filterUI}
        
        <div class="card">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0">Daftar Jurnal</h6>
                    <span class="badge bg-primary">${filteredJurnal.length} entri${filterActive ? ' (terfilter)' : ''}</span>
                </div>
                ${filterActive ? `<div class="alert alert-info mb-3"><i class="bi bi-info-circle me-2"></i>${filterInfo}</div>` : ''}
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr><th>Tanggal</th><th>Keterangan</th><th>Akun</th><th>Debit</th><th>Kredit</th><th>Aksi</th></tr>
                        </thead>
                        <tbody>
                            ${filteredJurnal.length > 0 ? filteredJurnal.map(j => {
                                // Check if user has permission to see delete button
                                const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
                                const canShowDelete = user.role === 'super_admin' || user.role === 'administrator' || user.role === 'keuangan';
                                
                                return `
                                <tr>
                                    <td>${formatDate(j.tanggal)}</td>
                                    <td>${j.keterangan}</td>
                                    <td>${j.entries.map(e => {
                                        const akun = coa.find(c => c.kode === e.akun);
                                        return akun ? akun.nama : e.akun;
                                    }).join('<br>')}</td>
                                    <td>${j.entries.map(e => formatRupiah(e.debit)).join('<br>')}</td>
                                    <td>${j.entries.map(e => formatRupiah(e.kredit)).join('<br>')}</td>
                                    <td>
                                        ${canShowDelete ? `
                                            <button class="btn btn-sm btn-danger" onclick="showDeleteJurnalConfirmation('${j.id}')" title="Hapus Jurnal">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        ` : '<span class="text-muted">-</span>'}
                                    </td>
                                </tr>
                            `;
                            }).join('') : '<tr><td colspan="6" class="text-center text-muted">Tidak ada data jurnal</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <div class="modal fade" id="jurnalModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Form Jurnal</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="jurnalForm">
                            <div class="mb-3">
                                <label class="form-label">Tanggal</label>
                                <input type="date" class="form-control" id="tanggalJurnal" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Keterangan</label>
                                <input type="text" class="form-control" id="keteranganJurnal" required>
                            </div>
                            <div id="jurnalEntries">
                                <div class="row mb-2">
                                    <div class="col-md-6">
                                        <select class="form-select" name="akun[]" required>
                                            <option value="">Pilih Akun</option>
                                            ${coa.map(c => `<option value="${c.kode}">${c.kode} - ${c.nama}</option>`).join('')}
                                        </select>
                                    </div>
                                    <div class="col-md-3">
                                        <input type="number" class="form-control" name="debit[]" placeholder="Debit">
                                    </div>
                                    <div class="col-md-3">
                                        <input type="number" class="form-control" name="kredit[]" placeholder="Kredit">
                                    </div>
                                </div>
                            </div>
                            <button type="button" class="btn btn-sm btn-secondary" onclick="addJurnalEntry()">+ Tambah Baris</button>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="button" class="btn btn-primary" onclick="saveJurnal()">Simpan</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showJurnalModal() {
    document.getElementById('jurnalForm').reset();
    document.getElementById('tanggalJurnal').value = new Date().toISOString().split('T')[0];
    new bootstrap.Modal(document.getElementById('jurnalModal')).show();
}

function addJurnalEntry() {
    const coa = JSON.parse(localStorage.getItem('coa') || '[]');
    const container = document.getElementById('jurnalEntries');
    const newEntry = document.createElement('div');
    newEntry.className = 'row mb-2';
    newEntry.innerHTML = `
        <div class="col-md-6">
            <select class="form-select" name="akun[]" required>
                <option value="">Pilih Akun</option>
                ${coa.map(c => `<option value="${c.kode}">${c.kode} - ${c.nama}</option>`).join('')}
            </select>
        </div>
        <div class="col-md-3">
            <input type="number" class="form-control" name="debit[]" placeholder="Debit">
        </div>
        <div class="col-md-3">
            <input type="number" class="form-control" name="kredit[]" placeholder="Kredit">
        </div>
    `;
    container.appendChild(newEntry);
}

function saveJurnal() {
    const form = document.getElementById('jurnalForm');
    const akuns = form.querySelectorAll('[name="akun[]"]');
    const debits = form.querySelectorAll('[name="debit[]"]');
    const kredits = form.querySelectorAll('[name="kredit[]"]');
    
    const entries = [];
    for (let i = 0; i < akuns.length; i++) {
        if (akuns[i].value) {
            entries.push({
                akun: akuns[i].value,
                debit: parseFloat(debits[i].value) || 0,
                kredit: parseFloat(kredits[i].value) || 0
            });
        }
    }
    
    const data = {
        id: generateId(),
        tanggal: document.getElementById('tanggalJurnal').value,
        keterangan: document.getElementById('keteranganJurnal').value,
        entries: entries
    };
    
    addJurnal(data.keterangan, data.entries, data.tanggal);
    bootstrap.Modal.getInstance(document.getElementById('jurnalModal')).hide();
    showAlert('Jurnal berhasil disimpan');
    renderJurnal();
}

function addJurnal(keterangan, entries, tanggal = null) {
    const jurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
    const coa = JSON.parse(localStorage.getItem('coa') || '[]');
    
    const data = {
        id: generateId(),
        tanggal: tanggal || new Date().toISOString(),
        keterangan: keterangan,
        entries: entries
    };
    
    jurnal.push(data);
    localStorage.setItem('jurnal', JSON.stringify(jurnal));
    
    // Update saldo COA
    entries.forEach(entry => {
        const akun = coa.find(c => c.kode === entry.akun);
        if (akun) {
            if (akun.tipe === 'Aset' || akun.tipe === 'Beban') {
                akun.saldo += entry.debit - entry.kredit;
            } else {
                akun.saldo += entry.kredit - entry.debit;
            }
        }
    });
    localStorage.setItem('coa', JSON.stringify(coa));
}

function renderSHU() {
    const content = document.getElementById('mainContent');
    const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
    const pembelian = JSON.parse(localStorage.getItem('pembelian') || '[]');
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const koperasi = JSON.parse(localStorage.getItem('koperasi'));
    
    const modalAwal = koperasi ? (koperasi.modalAwal || 0) : 0;
    const totalPendapatan = penjualan.reduce((sum, p) => sum + p.total, 0);
    const totalBeban = pembelian.reduce((sum, p) => sum + p.total, 0);
    const labaKotor = totalPendapatan - totalBeban;
    
    // Hanya anggota koperasi yang dapat SHU
    const anggotaKoperasi = anggota.filter(a => a.tipeAnggota === 'Anggota');
    const totalBelanjaAnggota = penjualan
        .filter(p => {
            const member = anggota.find(a => a.id === p.anggotaId);
            return member && member.tipeAnggota === 'Anggota';
        })
        .reduce((sum, p) => sum + p.total, 0);
    
    // Perhitungan SHU per anggota berdasarkan partisipasi
    const shuPerAnggota = anggotaKoperasi.map(a => {
        const belanjaAnggota = penjualan
            .filter(p => p.anggotaId === a.id)
            .reduce((sum, p) => sum + p.total, 0);
        
        const persentasePartisipasi = totalBelanjaAnggota > 0 ? (belanjaAnggota / totalBelanjaAnggota) * 100 : 0;
        const shu = totalBelanjaAnggota > 0 ? (belanjaAnggota / totalBelanjaAnggota) * labaKotor : 0;
        
        return {
            ...a,
            belanja: belanjaAnggota,
            persentase: persentasePartisipasi,
            shu: shu
        };
    });
    
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 style="color: #2d6a4f; font-weight: 700;">
                <i class="bi bi-calculator me-2"></i>Sisa Hasil Usaha (SHU)
            </h2>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body text-center">
                        <h6 class="text-muted">Modal Awal</h6>
                        <h4 style="color: #0077b6;">${formatRupiah(modalAwal)}</h4>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body text-center">
                        <h6 class="text-muted">Total Pendapatan</h6>
                        <h4 style="color: #2d6a4f;">${formatRupiah(totalPendapatan)}</h4>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body text-center">
                        <h6 class="text-muted">Total Beban</h6>
                        <h4 style="color: #dc3545;">${formatRupiah(totalBeban)}</h4>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card">
                    <div class="card-body text-center">
                        <h6 class="text-muted">Laba Kotor</h6>
                        <h4 style="color: ${labaKotor >= 0 ? '#52b788' : '#dc3545'};">${formatRupiah(labaKotor)}</h4>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-12">
                <div class="card">
                    <div class="card-body">
                        <h6 class="text-muted mb-3">Ringkasan Keuangan</h6>
                        <div class="row">
                            <div class="col-md-4">
                                <p class="mb-1"><strong>Modal Awal Koperasi:</strong></p>
                                <h5 style="color: #0077b6;">${formatRupiah(modalAwal)}</h5>
                            </div>
                            <div class="col-md-4">
                                <p class="mb-1"><strong>Total Modal + Laba:</strong></p>
                                <h5 style="color: #2d6a4f;">${formatRupiah(modalAwal + labaKotor)}</h5>
                            </div>
                            <div class="col-md-4">
                                <p class="mb-1"><strong>Anggota Koperasi:</strong></p>
                                <h5 style="color: #40916c;">${anggotaKoperasi.length} Orang</h5>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <i class="bi bi-people me-2"></i>Pembagian SHU per Anggota Koperasi
            </div>
            <div class="card-body">
                <div class="alert alert-info">
                    <strong><i class="bi bi-info-circle me-2"></i>Catatan:</strong>
                    Hanya <strong>Anggota Koperasi</strong> yang berhak mendapat SHU. 
                    Pembagian berdasarkan persentase partisipasi belanja di koperasi.
                </div>
                
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>NIK</th>
                                <th>Nama</th>
                                <th>Departemen</th>
                                <th>Total Belanja</th>
                                <th>Partisipasi (%)</th>
                                <th>SHU yang Diterima</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${shuPerAnggota.map(a => `
                                <tr>
                                    <td>${a.nik}</td>
                                    <td>${a.nama} <i class="bi bi-star-fill text-warning"></i></td>
                                    <td>${a.departemen || '-'}</td>
                                    <td>${formatRupiah(a.belanja)}</td>
                                    <td>${a.persentase.toFixed(2)}%</td>
                                    <td><strong>${formatRupiah(a.shu)}</strong></td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr>
                                <th colspan="3">Total</th>
                                <th>${formatRupiah(totalBelanjaAnggota)}</th>
                                <th>100%</th>
                                <th><strong>${formatRupiah(shuPerAnggota.reduce((sum, a) => sum + a.shu, 0))}</strong></th>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                
                <div class="mt-3">
                    <button class="btn btn-success" onclick="downloadSHU()">
                        <i class="bi bi-file-earmark-arrow-down me-1"></i>Download Laporan SHU
                    </button>
                    <button class="btn btn-primary" onclick="prosesPembagianSHU()">
                        <i class="bi bi-cash-stack me-1"></i>Proses Pembagian SHU
                    </button>
                </div>
            </div>
        </div>
    `;
}

function downloadSHU() {
    const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
    const pembelian = JSON.parse(localStorage.getItem('pembelian') || '[]');
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    
    const totalPendapatan = penjualan.reduce((sum, p) => sum + p.total, 0);
    const totalBeban = pembelian.reduce((sum, p) => sum + p.total, 0);
    const labaKotor = totalPendapatan - totalBeban;
    
    const anggotaKoperasi = anggota.filter(a => a.tipeAnggota === 'Anggota');
    const totalBelanjaAnggota = penjualan
        .filter(p => {
            const member = anggota.find(a => a.id === p.anggotaId);
            return member && member.tipeAnggota === 'Anggota';
        })
        .reduce((sum, p) => sum + p.total, 0);
    
    let csv = 'NIK,Nama,Departemen,Total Belanja,Partisipasi (%),SHU yang Diterima\n';
    
    anggotaKoperasi.forEach(a => {
        const belanjaAnggota = penjualan
            .filter(p => p.anggotaId === a.id)
            .reduce((sum, p) => sum + p.total, 0);
        
        const persentasePartisipasi = totalBelanjaAnggota > 0 ? (belanjaAnggota / totalBelanjaAnggota) * 100 : 0;
        const shu = totalBelanjaAnggota > 0 ? (belanjaAnggota / totalBelanjaAnggota) * labaKotor : 0;
        
        csv += `${a.nik},"${a.nama}",${a.departemen || ''},${belanjaAnggota},${persentasePartisipasi.toFixed(2)},${shu}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `laporan_shu_${today}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showAlert('Laporan SHU berhasil didownload!', 'success');
}

function prosesPembagianSHU() {
    showAlert('Fitur pembagian SHU otomatis dalam pengembangan. Gunakan laporan untuk proses manual.', 'info');
}
