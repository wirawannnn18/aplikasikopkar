// Departemen Module

function renderDepartemen() {
    const content = document.getElementById('mainContent');
    const departemen = JSON.parse(localStorage.getItem('departemen') || '[]');
    
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 style="color: #2d6a4f; font-weight: 700;">
                <i class="bi bi-diagram-3 me-2"></i>Master Departemen
            </h2>
        </div>
        
        <div class="card">
            <div class="card-header">
                <div class="d-flex justify-content-between align-items-center">
                    <span><i class="bi bi-building me-2"></i>Daftar Departemen</span>
                    <button class="btn btn-primary btn-sm" onclick="showDepartemenModal()">
                        <i class="bi bi-plus-circle me-1"></i>Tambah Departemen
                    </button>
                </div>
            </div>
            <div class="card-body">
                ${departemen.length === 0 ? `
                    <div class="text-center py-5">
                        <i class="bi bi-inbox" style="font-size: 4rem; color: #ccc;"></i>
                        <p class="text-muted mt-3">Belum ada data departemen</p>
                        <button class="btn btn-primary" onclick="showDepartemenModal()">
                            <i class="bi bi-plus-circle me-1"></i>Tambah Departemen Pertama
                        </button>
                    </div>
                ` : `
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th width="10%">Kode</th>
                                    <th width="30%">Nama Departemen</th>
                                    <th width="35%">Keterangan</th>
                                    <th width="10%">Status</th>
                                    <th width="15%">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${departemen.map(d => {
                                    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
                                    const jumlahAnggota = anggota.filter(a => a.departemen === d.nama).length;
                                    return `
                                    <tr>
                                        <td><strong>${d.kode}</strong></td>
                                        <td>
                                            <i class="bi bi-diagram-3 me-2" style="color: #2d6a4f;"></i>
                                            ${d.nama}
                                            ${jumlahAnggota > 0 ? `<br><small class="text-muted"><i class="bi bi-people me-1"></i>${jumlahAnggota} anggota</small>` : ''}
                                        </td>
                                        <td>${d.keterangan || '-'}</td>
                                        <td>
                                            <span class="badge ${d.aktif ? 'bg-success' : 'bg-secondary'}">
                                                ${d.aktif ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td>
                                            ${jumlahAnggota > 0 ? `
                                                <button class="btn btn-sm btn-primary" onclick="lihatAnggotaDepartemen('${d.nama}')" title="Lihat Anggota">
                                                    <i class="bi bi-people"></i>
                                                </button>
                                            ` : ''}
                                            <button class="btn btn-sm btn-info" onclick="viewDepartemen('${d.id}')" title="Lihat Detail">
                                                <i class="bi bi-eye"></i>
                                            </button>
                                            <button class="btn btn-sm btn-warning" onclick="editDepartemen('${d.id}')" title="Edit">
                                                <i class="bi bi-pencil"></i>
                                            </button>
                                            <button class="btn btn-sm btn-danger" onclick="deleteDepartemen('${d.id}')" title="Hapus">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        </div>
        
        <!-- Modal Departemen -->
        <div class="modal fade" id="departemenModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-diagram-3 me-2"></i><span id="departemenModalTitle">Tambah Departemen</span>
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="departemenForm">
                            <input type="hidden" id="departemenId">
                            <div class="mb-3">
                                <label class="form-label">
                                    <i class="bi bi-hash me-1"></i>Kode Departemen <span class="text-danger">*</span>
                                </label>
                                <input type="text" class="form-control" id="departemenKode" required placeholder="Contoh: IT, HR, FIN">
                                <small class="text-muted">Kode unik untuk departemen (huruf kapital)</small>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">
                                    <i class="bi bi-building me-1"></i>Nama Departemen <span class="text-danger">*</span>
                                </label>
                                <input type="text" class="form-control" id="departemenNama" required placeholder="Contoh: Information Technology">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">
                                    <i class="bi bi-card-text me-1"></i>Keterangan
                                </label>
                                <textarea class="form-control" id="departemenKeterangan" rows="3" placeholder="Deskripsi atau keterangan departemen"></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">
                                    <i class="bi bi-toggle-on me-1"></i>Status
                                </label>
                                <select class="form-select" id="departemenAktif">
                                    <option value="true">Aktif</option>
                                    <option value="false">Nonaktif</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-1"></i>Batal
                        </button>
                        <button type="button" class="btn btn-primary" onclick="saveDepartemen()">
                            <i class="bi bi-save me-1"></i>Simpan
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Modal View Departemen -->
        <div class="modal fade" id="viewDepartemenModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-diagram-3 me-2"></i>Detail Departemen
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="viewDepartemenContent">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showDepartemenModal() {
    document.getElementById('departemenForm').reset();
    document.getElementById('departemenId').value = '';
    document.getElementById('departemenModalTitle').textContent = 'Tambah Departemen';
    document.getElementById('departemenAktif').value = 'true';
    new bootstrap.Modal(document.getElementById('departemenModal')).show();
}

function viewDepartemen(id) {
    const departemen = JSON.parse(localStorage.getItem('departemen') || '[]');
    const dept = departemen.find(d => d.id === id);
    
    if (dept) {
        // Hitung jumlah anggota di departemen ini
        const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
        const jumlahAnggota = anggota.filter(a => a.departemen === dept.nama).length;
        
        const content = document.getElementById('viewDepartemenContent');
        content.innerHTML = `
            <div class="row">
                <div class="col-12 text-center mb-3">
                    <i class="bi bi-diagram-3" style="font-size: 5rem; color: #2d6a4f;"></i>
                </div>
                <div class="col-md-5">
                    <strong><i class="bi bi-hash me-1"></i>Kode:</strong>
                </div>
                <div class="col-md-7">
                    <span class="badge bg-primary">${dept.kode}</span>
                </div>
                <div class="col-md-5 mt-2">
                    <strong><i class="bi bi-building me-1"></i>Nama Departemen:</strong>
                </div>
                <div class="col-md-7 mt-2">
                    ${dept.nama}
                </div>
                <div class="col-md-5 mt-2">
                    <strong><i class="bi bi-card-text me-1"></i>Keterangan:</strong>
                </div>
                <div class="col-md-7 mt-2">
                    ${dept.keterangan || '-'}
                </div>
                <div class="col-md-5 mt-2">
                    <strong><i class="bi bi-toggle-on me-1"></i>Status:</strong>
                </div>
                <div class="col-md-7 mt-2">
                    <span class="badge ${dept.aktif ? 'bg-success' : 'bg-secondary'}">
                        ${dept.aktif ? 'Aktif' : 'Nonaktif'}
                    </span>
                </div>
                <div class="col-md-5 mt-2">
                    <strong><i class="bi bi-people me-1"></i>Jumlah Anggota:</strong>
                </div>
                <div class="col-md-7 mt-2">
                    <span class="badge bg-info">${jumlahAnggota} orang</span>
                    ${jumlahAnggota > 0 ? `
                        <a href="#" onclick="lihatAnggotaDepartemen('${dept.nama}'); return false;" class="ms-2" title="Lihat Daftar Anggota">
                            <i class="bi bi-box-arrow-up-right"></i> Lihat
                        </a>
                    ` : ''}
                </div>
                ${dept.createdAt ? `
                    <div class="col-md-5 mt-2">
                        <strong><i class="bi bi-calendar-plus me-1"></i>Dibuat:</strong>
                    </div>
                    <div class="col-md-7 mt-2">
                        <small class="text-muted">${formatDate(dept.createdAt)}</small>
                    </div>
                ` : ''}
                ${dept.updatedAt ? `
                    <div class="col-md-5 mt-2">
                        <strong><i class="bi bi-calendar-check me-1"></i>Diupdate:</strong>
                    </div>
                    <div class="col-md-7 mt-2">
                        <small class="text-muted">${formatDate(dept.updatedAt)}</small>
                    </div>
                ` : ''}
            </div>
        `;
        new bootstrap.Modal(document.getElementById('viewDepartemenModal')).show();
    }
}

function editDepartemen(id) {
    const departemen = JSON.parse(localStorage.getItem('departemen') || '[]');
    const dept = departemen.find(d => d.id === id);
    
    if (dept) {
        document.getElementById('departemenId').value = dept.id;
        document.getElementById('departemenKode').value = dept.kode;
        document.getElementById('departemenNama').value = dept.nama;
        document.getElementById('departemenKeterangan').value = dept.keterangan || '';
        document.getElementById('departemenAktif').value = dept.aktif ? 'true' : 'false';
        document.getElementById('departemenModalTitle').textContent = 'Edit Departemen';
        new bootstrap.Modal(document.getElementById('departemenModal')).show();
    }
}

function saveDepartemen() {
    const departemen = JSON.parse(localStorage.getItem('departemen') || '[]');
    const id = document.getElementById('departemenId').value;
    const kode = document.getElementById('departemenKode').value.trim().toUpperCase();
    const nama = document.getElementById('departemenNama').value.trim();
    const keterangan = document.getElementById('departemenKeterangan').value.trim();
    const aktif = document.getElementById('departemenAktif').value === 'true';
    
    // Validasi
    if (!kode || !nama) {
        showAlert('Kode dan Nama Departemen harus diisi!', 'warning');
        return;
    }
    
    // Check duplicate kode
    const existingDept = departemen.find(d => d.kode === kode && d.id !== id);
    if (existingDept) {
        showAlert('Kode departemen sudah digunakan!', 'warning');
        return;
    }
    
    if (id) {
        // Edit departemen
        const index = departemen.findIndex(d => d.id === id);
        const oldNama = departemen[index].nama;
        
        departemen[index].kode = kode;
        departemen[index].nama = nama;
        departemen[index].keterangan = keterangan;
        departemen[index].aktif = aktif;
        departemen[index].updatedAt = new Date().toISOString();
        
        // Update nama departemen di data anggota jika berubah
        if (oldNama !== nama) {
            updateDepartemenAnggota(oldNama, nama);
        }
        
        showAlert('Departemen berhasil diupdate', 'success');
    } else {
        // Add new departemen
        const newDept = {
            id: generateId(),
            kode: kode,
            nama: nama,
            keterangan: keterangan,
            aktif: aktif,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        departemen.push(newDept);
        showAlert('Departemen berhasil ditambahkan', 'success');
    }
    
    localStorage.setItem('departemen', JSON.stringify(departemen));
    bootstrap.Modal.getInstance(document.getElementById('departemenModal')).hide();
    renderDepartemen();
}

function deleteDepartemen(id) {
    const departemen = JSON.parse(localStorage.getItem('departemen') || '[]');
    const dept = departemen.find(d => d.id === id);
    
    if (!dept) return;
    
    // Check apakah ada anggota yang menggunakan departemen ini
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const jumlahAnggota = anggota.filter(a => a.departemen === dept.nama).length;
    
    if (jumlahAnggota > 0) {
        showAlert(`Tidak dapat menghapus departemen ${dept.nama} karena masih ada ${jumlahAnggota} anggota yang terdaftar!`, 'warning');
        return;
    }
    
    if (confirm(`Yakin ingin menghapus departemen "${dept.nama}"?`)) {
        const filtered = departemen.filter(d => d.id !== id);
        localStorage.setItem('departemen', JSON.stringify(filtered));
        showAlert('Departemen berhasil dihapus', 'info');
        renderDepartemen();
    }
}

// Helper function untuk update departemen di data anggota
function updateDepartemenAnggota(oldNama, newNama) {
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    let updated = false;
    
    anggota.forEach(a => {
        if (a.departemen === oldNama) {
            a.departemen = newNama;
            updated = true;
        }
    });
    
    if (updated) {
        localStorage.setItem('anggota', JSON.stringify(anggota));
        console.log(`Updated departemen dari "${oldNama}" ke "${newNama}" untuk ${anggota.filter(a => a.departemen === newNama).length} anggota`);
    }
}


// Fungsi untuk melihat anggota berdasarkan departemen
function lihatAnggotaDepartemen(namaDepartemen) {
    // Pindah ke halaman anggota
    navigateTo('anggota');
    
    // Tunggu sebentar agar halaman anggota ter-render
    setTimeout(() => {
        // Set filter departemen
        const filterDept = document.getElementById('filterDepartemen');
        if (filterDept) {
            filterDept.value = namaDepartemen;
            filterAnggota();
            
            // Scroll ke tabel
            document.getElementById('tableAnggota')?.scrollIntoView({ behavior: 'smooth' });
            
            // Highlight filter
            filterDept.classList.add('border-primary', 'border-3');
            setTimeout(() => {
                filterDept.classList.remove('border-primary', 'border-3');
            }, 2000);
        }
    }, 100);
}
