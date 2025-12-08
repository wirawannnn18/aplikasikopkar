// Simpanan Module - Lengkap dengan Simpanan Pokok, Wajib, dan Sukarela

function renderSimpananPokok() {
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const simpanan = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
    
    return `
        <button class="btn btn-primary mb-3" onclick="showSimpananPokokModal()">
            <i class="bi bi-plus-circle me-1"></i>Tambah Simpanan Pokok
        </button>
        <button class="btn btn-success mb-3 ms-2" onclick="showUploadSimpananPokokModal()">
            <i class="bi bi-upload me-1"></i>Upload Data CSV/Excel
        </button>
        <button class="btn btn-info mb-3 ms-2" onclick="downloadTemplateSimpananPokok()">
            <i class="bi bi-download me-1"></i>Download Template
        </button>
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Anggota</th>
                        <th>NIK</th>
                        <th>Jumlah</th>
                        <th>Tanggal</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${simpanan.filter(s => s.jumlah > 0).map(s => {
                        const ang = anggota.find(a => a.id === s.anggotaId);
                        return `
                            <tr>
                                <td>${ang?.nama || '-'}</td>
                                <td>${ang?.nik || '-'}</td>
                                <td>${formatRupiah(s.jumlah)}</td>
                                <td>${formatDate(s.tanggal)}</td>
                                <td>
                                    <button class="btn btn-sm btn-danger" onclick="deleteSimpananPokok('${s.id}')">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <th colspan="2">Total Simpanan Pokok</th>
                        <th>${formatRupiah(simpanan.filter(s => s.jumlah > 0).reduce((sum, s) => sum + s.jumlah, 0))}</th>
                        <th colspan="2"></th>
                    </tr>
                </tfoot>
            </table>
        </div>
        
        <!-- Modal Simpanan Pokok -->
        <div class="modal fade" id="simpananPokokModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Tambah Simpanan Pokok</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="simpananPokokForm">
                            <div class="mb-3">
                                <label class="form-label">Pilih Anggota</label>
                                <select class="form-select" id="anggotaPokok" required>
                                    <option value="">-- Pilih Anggota --</option>
                                    ${anggota.map(a => `<option value="${a.id}">${a.nama} - ${a.nik}</option>`).join('')}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Jumlah Simpanan</label>
                                <input type="number" class="form-control" id="jumlahPokok" required min="0">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Tanggal</label>
                                <input type="date" class="form-control" id="tanggalPokok" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="button" class="btn btn-primary" onclick="saveSimpananPokok()">Simpan</button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Modal Upload Simpanan Pokok -->
        <div class="modal fade" id="uploadSimpananPokokModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">Upload Data Simpanan Pokok</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <i class="bi bi-info-circle me-2"></i>
                            <strong>Format Data:</strong> CSV dengan kolom: NIK, Nama, Jumlah, Tanggal (YYYY-MM-DD)
                        </div>
                        
                        <!-- Tab Navigation -->
                        <ul class="nav nav-tabs mb-3" role="tablist">
                            <li class="nav-item" role="presentation">
                                <button class="nav-link active" id="upload-file-tab" data-bs-toggle="tab" data-bs-target="#upload-file-pane" type="button" role="tab">
                                    <i class="bi bi-upload me-1"></i>Upload File
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="paste-data-tab" data-bs-toggle="tab" data-bs-target="#paste-data-pane" type="button" role="tab">
                                    <i class="bi bi-clipboard me-1"></i>Paste Data
                                </button>
                            </li>
                        </ul>
                        
                        <!-- Tab Content -->
                        <div class="tab-content">
                            <!-- Upload File Tab -->
                            <div class="tab-pane fade show active" id="upload-file-pane" role="tabpanel">
                                <div class="mb-3">
                                    <label class="form-label">Pilih File CSV/Excel</label>
                                    <input type="file" class="form-control" id="fileUploadSimpananPokok" accept=".csv,.xlsx,.xls" onchange="previewUploadSimpananPokok()">
                                </div>
                            </div>
                            
                            <!-- Paste Data Tab -->
                            <div class="tab-pane fade" id="paste-data-pane" role="tabpanel">
                                <div class="mb-3">
                                    <label class="form-label">Paste Data CSV dari Excel/Spreadsheet</label>
                                    <textarea class="form-control font-monospace" id="pasteDataSimpananPokok" rows="8" placeholder="Paste data CSV di sini...&#10;Contoh:&#10;NIK,Nama,Jumlah,Tanggal&#10;3201010101010001,Budi Santoso,1000000,2024-01-15&#10;3201010101010002,Siti Aminah,1000000,2024-01-15"></textarea>
                                    <small class="text-muted">
                                        <i class="bi bi-lightbulb me-1"></i>
                                        Tip: Copy data dari Excel (Ctrl+C) lalu paste di sini (Ctrl+V)
                                    </small>
                                </div>
                                <button type="button" class="btn btn-primary" onclick="previewPastedData()">
                                    <i class="bi bi-eye me-1"></i>Preview Data
                                </button>
                            </div>
                        </div>
                        
                        <div id="previewUploadContainer" style="display:none;">
                            <h6 class="mt-3">Preview Data:</h6>
                            <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                                <table class="table table-sm table-bordered">
                                    <thead class="table-light sticky-top">
                                        <tr>
                                            <th>No</th>
                                            <th>NIK</th>
                                            <th>Nama</th>
                                            <th>Jumlah</th>
                                            <th>Tanggal</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody id="previewUploadBody">
                                    </tbody>
                                </table>
                            </div>
                            
                            <div id="uploadSummary" class="mt-3">
                                <div class="row">
                                    <div class="col-md-4">
                                        <div class="card bg-light">
                                            <div class="card-body text-center">
                                                <h6>Total Data</h6>
                                                <h4 id="totalUploadData">0</h4>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="card bg-success text-white">
                                            <div class="card-body text-center">
                                                <h6>Valid</h6>
                                                <h4 id="validUploadData">0</h4>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="card bg-danger text-white">
                                            <div class="card-body text-center">
                                                <h6>Error</h6>
                                                <h4 id="errorUploadData">0</h4>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="button" class="btn btn-success" id="btnProcessUpload" onclick="processUploadSimpananPokok()" disabled>
                            <i class="bi bi-check-circle me-1"></i>Proses Upload
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showSimpananPokokModal() {
    document.getElementById('simpananPokokForm').reset();
    document.getElementById('tanggalPokok').value = new Date().toISOString().split('T')[0];
    new bootstrap.Modal(document.getElementById('simpananPokokModal')).show();
}

function saveSimpananPokok() {
    const simpanan = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
    
    const anggotaId = document.getElementById('anggotaPokok').value;
    
    // NEW: Use transaction validator module
    const validation = validateAnggotaForSimpanan(anggotaId);
    if (!validation.valid) {
        showAlert(validation.error, 'error');
        return;
    }
    
    const data = {
        id: generateId(),
        anggotaId: anggotaId,
        jumlah: parseFloat(document.getElementById('jumlahPokok').value),
        tanggal: document.getElementById('tanggalPokok').value,
        // Initialize pengembalian tracking fields
        statusPengembalian: 'Aktif',
        saldoSebelumPengembalian: null,
        pengembalianId: null,
        tanggalPengembalian: null
    };
    
    simpanan.push(data);
    localStorage.setItem('simpananPokok', JSON.stringify(simpanan));
    
    // Update jurnal
    addJurnal('Simpanan Pokok', [
        { akun: '1-1000', debit: data.jumlah, kredit: 0 },
        { akun: '2-1100', debit: 0, kredit: data.jumlah }
    ]);
    
    bootstrap.Modal.getInstance(document.getElementById('simpananPokokModal')).hide();
    showAlert('Simpanan pokok berhasil disimpan');
    renderSimpanan();
}

function deleteSimpananPokok(id) {
    // Requirement 1.1: Konfirmasi dialog sebelum penghapusan
    const confirmed = confirm('Yakin ingin menghapus simpanan ini? Data yang dihapus tidak dapat dikembalikan.');
    
    // Requirement 1.5: Pembatalan mempertahankan data
    if (!confirmed) {
        return; // Data tetap utuh jika dibatalkan
    }
    
    try {
        // Requirement 1.2: Hapus data dari localStorage
        let simpanan = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
        const originalLength = simpanan.length;
        
        simpanan = simpanan.filter(s => s.id !== id);
        
        // Pastikan data benar-benar terhapus
        if (simpanan.length === originalLength) {
            showAlert('Data tidak ditemukan', 'warning');
            return;
        }
        
        localStorage.setItem('simpananPokok', JSON.stringify(simpanan));
        
        // Requirement 1.4: Tampilkan notifikasi sukses
        showAlert('Simpanan pokok berhasil dihapus', 'success');
        
        // Requirement 1.3: Update UI setelah penghapusan
        renderSimpanan();
    } catch (error) {
        showAlert('Terjadi kesalahan saat menghapus data: ' + error.message, 'danger');
    }
}

// Upload Simpanan Pokok Functions
let uploadDataSimpananPokok = [];

function showUploadSimpananPokokModal() {
    document.getElementById('fileUploadSimpananPokok').value = '';
    document.getElementById('pasteDataSimpananPokok').value = '';
    document.getElementById('previewUploadContainer').style.display = 'none';
    document.getElementById('btnProcessUpload').disabled = true;
    uploadDataSimpananPokok = [];
    
    // Reset to first tab
    const uploadTab = document.getElementById('upload-file-tab');
    const uploadPane = document.getElementById('upload-file-pane');
    const pastePane = document.getElementById('paste-data-pane');
    uploadTab.classList.add('active');
    uploadPane.classList.add('show', 'active');
    pastePane.classList.remove('show', 'active');
    
    new bootstrap.Modal(document.getElementById('uploadSimpananPokokModal')).show();
}

function downloadTemplateSimpananPokok() {
    const template = 'NIK,Nama,Jumlah,Tanggal\n3201010101010001,Budi Santoso,1000000,2024-01-15\n3201010101010002,Siti Aminah,1000000,2024-01-15\n';
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_simpanan_pokok.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert('Template berhasil didownload', 'success');
}

function previewUploadSimpananPokok() {
    const fileInput = document.getElementById('fileUploadSimpananPokok');
    const file = fileInput.files[0];
    
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        parseUploadFile(content, file.name);
    };
    reader.readAsText(file);
}

function previewPastedData() {
    const pastedData = document.getElementById('pasteDataSimpananPokok').value.trim();
    
    if (!pastedData) {
        showAlert('Tidak ada data yang di-paste', 'warning');
        return;
    }
    
    parseUploadFile(pastedData, 'pasted-data');
}

function parseUploadFile(content, filename) {
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
        showAlert('File kosong atau format tidak valid', 'warning');
        return;
    }
    
    // Deteksi delimiter (comma atau tab)
    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : ',';
    
    // Skip header (baris pertama)
    const dataLines = lines.slice(1);
    
    uploadDataSimpananPokok = [];
    let validCount = 0;
    let errorCount = 0;
    
    const previewBody = document.getElementById('previewUploadBody');
    previewBody.innerHTML = '';
    
    dataLines.forEach((line, index) => {
        // Split by delimiter dan trim
        const columns = line.split(delimiter).map(col => col.trim());
        
        if (columns.length < 4) {
            errorCount++;
            const row = document.createElement('tr');
            row.className = 'table-danger';
            row.innerHTML = `
                <td>${index + 1}</td>
                <td colspan="4">${line.substring(0, 50)}...</td>
                <td><span class="badge bg-danger">Format tidak lengkap</span></td>
            `;
            previewBody.appendChild(row);
            return;
        }
        
        const [nik, nama, jumlahStr, tanggalInput] = columns;
        const jumlah = parseFloat(jumlahStr.replace(/[^\d.-]/g, '')); // Remove non-numeric chars
        
        // Konversi tanggal ke format ISO
        const tanggal = convertToISODate(tanggalInput);
        
        // Validasi
        let status = 'valid';
        let errorMsg = '';
        
        // Cari anggota berdasarkan NIK
        const anggotaData = anggota.find(a => a.nik === nik);
        
        if (!anggotaData) {
            status = 'error';
            errorMsg = 'NIK tidak ditemukan';
        } else if (isNaN(jumlah) || jumlah <= 0) {
            status = 'error';
            errorMsg = 'Jumlah tidak valid';
        } else if (!tanggal || !isValidDate(tanggalInput)) {
            status = 'error';
            errorMsg = `Format tanggal tidak valid: ${tanggalInput}`;
        }
        
        if (status === 'valid') {
            validCount++;
            uploadDataSimpananPokok.push({
                anggotaId: anggotaData.id,
                nik: nik,
                nama: nama,
                jumlah: jumlah,
                tanggal: tanggal  // Gunakan tanggal yang sudah dikonversi
            });
        } else {
            errorCount++;
        }
        
        // Tampilkan preview
        const row = document.createElement('tr');
        row.className = status === 'valid' ? 'table-success' : 'table-danger';
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${nik}</td>
            <td>${nama}</td>
            <td>${formatRupiah(jumlah || 0)}</td>
            <td>${status === 'valid' ? tanggal : tanggalInput} ${status === 'valid' && tanggal !== tanggalInput ? '<small class="text-muted">(dikonversi)</small>' : ''}</td>
            <td>
                ${status === 'valid' 
                    ? '<span class="badge bg-success">Valid</span>' 
                    : `<span class="badge bg-danger">${errorMsg}</span>`
                }
            </td>
        `;
        previewBody.appendChild(row);
    });
    
    // Update summary
    document.getElementById('totalUploadData').textContent = dataLines.length;
    document.getElementById('validUploadData').textContent = validCount;
    document.getElementById('errorUploadData').textContent = errorCount;
    
    // Show preview
    document.getElementById('previewUploadContainer').style.display = 'block';
    document.getElementById('btnProcessUpload').disabled = validCount === 0;
    
    // Show success message
    if (validCount > 0) {
        showAlert(`Preview berhasil! ${validCount} data valid dari ${dataLines.length} baris`, 'success');
    }
}

function convertToISODate(dateString) {
    // Jika sudah format YYYY-MM-DD, return langsung
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
    }
    
    // Format MM/DD/YYYY atau M/D/YYYY (Excel US format)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
        const [month, day, year] = dateString.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Format DD/MM/YYYY atau D/M/YYYY (Excel ID format)
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
        const parts = dateString.split('/');
        // Coba deteksi: jika bulan > 12, berarti format DD/MM/YYYY
        if (parseInt(parts[0]) > 12) {
            const [day, month, year] = parts;
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        // Jika tidak, asumsikan MM/DD/YYYY
        const [month, day, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Format DD-MM-YYYY atau D-M-YYYY
    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(dateString)) {
        const [day, month, year] = dateString.split('-');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Format YYYY/MM/DD
    if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    return null;
}

function isValidDate(dateString) {
    // Coba konversi ke format ISO
    const isoDate = convertToISODate(dateString);
    if (!isoDate) return false;
    
    // Validasi apakah tanggal valid
    const date = new Date(isoDate);
    return date instanceof Date && !isNaN(date);
}

function processUploadSimpananPokok() {
    if (uploadDataSimpananPokok.length === 0) {
        showAlert('Tidak ada data valid untuk diproses', 'warning');
        return;
    }
    
    if (!confirm(`Proses ${uploadDataSimpananPokok.length} data simpanan pokok?`)) {
        return;
    }
    
    const simpanan = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
    let successCount = 0;
    
    uploadDataSimpananPokok.forEach(data => {
        const newSimpanan = {
            id: generateId(),
            anggotaId: data.anggotaId,
            jumlah: data.jumlah,
            tanggal: data.tanggal
        };
        
        simpanan.push(newSimpanan);
        
        // Update jurnal untuk setiap transaksi
        addJurnal(`Simpanan Pokok - ${data.nama}`, [
            { akun: '1-1000', debit: data.jumlah, kredit: 0 },
            { akun: '2-1100', debit: 0, kredit: data.jumlah }
        ]);
        
        successCount++;
    });
    
    localStorage.setItem('simpananPokok', JSON.stringify(simpanan));
    
    bootstrap.Modal.getInstance(document.getElementById('uploadSimpananPokokModal')).hide();
    showAlert(`Berhasil memproses ${successCount} data simpanan pokok`, 'success');
    renderSimpanan();
}

function renderSimpananWajib() {
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const simpanan = JSON.parse(localStorage.getItem('simpananWajib') || '[]');
    
    return `
        <button class="btn btn-primary mb-3" onclick="showSimpananWajibModal()">
            <i class="bi bi-plus-circle me-1"></i>Setor Simpanan Wajib
        </button>
        <button class="btn btn-success mb-3 ms-2" onclick="showUploadSimpananWajibModal()">
            <i class="bi bi-upload me-1"></i>Upload Data CSV/Excel
        </button>
        <button class="btn btn-info mb-3 ms-2" onclick="downloadTemplateSimpananWajib()">
            <i class="bi bi-download me-1"></i>Download Template
        </button>
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Anggota</th>
                        <th>NIK</th>
                        <th>Jumlah</th>
                        <th>Periode</th>
                        <th>Tanggal</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${simpanan.filter(s => s.jumlah > 0).map(s => {
                        const ang = anggota.find(a => a.id === s.anggotaId);
                        return `
                            <tr>
                                <td>${ang?.nama || '-'}</td>
                                <td>${ang?.nik || '-'}</td>
                                <td>${formatRupiah(s.jumlah)}</td>
                                <td>${s.periode}</td>
                                <td>${formatDate(s.tanggal)}</td>
                                <td>
                                    <button class="btn btn-sm btn-danger" onclick="deleteSimpananWajib('${s.id}')">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <th colspan="2">Total Simpanan Wajib</th>
                        <th>${formatRupiah(simpanan.filter(s => s.jumlah > 0).reduce((sum, s) => sum + s.jumlah, 0))}</th>
                        <th colspan="3"></th>
                    </tr>
                </tfoot>
            </table>
        </div>
        
        <!-- Modal Simpanan Wajib -->
        <div class="modal fade" id="simpananWajibModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Setor Simpanan Wajib</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="simpananWajibForm">
                            <div class="mb-3">
                                <label class="form-label">Pilih Anggota</label>
                                <select class="form-select" id="anggotaWajib" required>
                                    <option value="">-- Pilih Anggota --</option>
                                    ${anggota.map(a => `<option value="${a.id}">${a.nama} - ${a.nik}</option>`).join('')}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Jumlah Simpanan</label>
                                <input type="number" class="form-control" id="jumlahWajib" required min="0">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Periode (Bulan/Tahun)</label>
                                <input type="month" class="form-control" id="periodeWajib" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Tanggal Setor</label>
                                <input type="date" class="form-control" id="tanggalWajib" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="button" class="btn btn-primary" onclick="saveSimpananWajib()">Simpan</button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Modal Upload Simpanan Wajib -->
        <div class="modal fade" id="uploadSimpananWajibModal" tabindex="-1">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">Upload Data Simpanan Wajib</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-info">
                            <i class="bi bi-info-circle me-2"></i>
                            <strong>Format Data:</strong> CSV dengan kolom: NIK, Nama, Jumlah, Periode (YYYY-MM), Tanggal
                        </div>
                        
                        <!-- Tab Navigation -->
                        <ul class="nav nav-tabs mb-3" role="tablist">
                            <li class="nav-item" role="presentation">
                                <button class="nav-link active" id="upload-file-wajib-tab" data-bs-toggle="tab" data-bs-target="#upload-file-wajib-pane" type="button" role="tab">
                                    <i class="bi bi-upload me-1"></i>Upload File
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="paste-data-wajib-tab" data-bs-toggle="tab" data-bs-target="#paste-data-wajib-pane" type="button" role="tab">
                                    <i class="bi bi-clipboard me-1"></i>Paste Data
                                </button>
                            </li>
                        </ul>
                        
                        <!-- Tab Content -->
                        <div class="tab-content">
                            <!-- Upload File Tab -->
                            <div class="tab-pane fade show active" id="upload-file-wajib-pane" role="tabpanel">
                                <div class="mb-3">
                                    <label class="form-label">Pilih File CSV/Excel</label>
                                    <input type="file" class="form-control" id="fileUploadSimpananWajib" accept=".csv,.xlsx,.xls" onchange="previewUploadSimpananWajib()">
                                </div>
                            </div>
                            
                            <!-- Paste Data Tab -->
                            <div class="tab-pane fade" id="paste-data-wajib-pane" role="tabpanel">
                                <div class="mb-3">
                                    <label class="form-label">Paste Data CSV dari Excel/Spreadsheet</label>
                                    <textarea class="form-control font-monospace" id="pasteDataSimpananWajib" rows="8" placeholder="Paste data CSV di sini...&#10;Contoh:&#10;NIK,Nama,Jumlah,Periode,Tanggal&#10;3201010101010001,Budi Santoso,100000,2024-10,2024-10-18&#10;3201010101010002,Siti Aminah,100000,2024-10,2024-10-18"></textarea>
                                    <small class="text-muted">
                                        <i class="bi bi-lightbulb me-1"></i>
                                        Tip: Copy data dari Excel (Ctrl+C) lalu paste di sini (Ctrl+V)
                                    </small>
                                </div>
                                <button type="button" class="btn btn-primary" onclick="previewPastedDataWajib()">
                                    <i class="bi bi-eye me-1"></i>Preview Data
                                </button>
                            </div>
                        </div>
                        
                        <div id="previewUploadWajibContainer" style="display:none;">
                            <h6 class="mt-3">Preview Data:</h6>
                            <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                                <table class="table table-sm table-bordered">
                                    <thead class="table-light sticky-top">
                                        <tr>
                                            <th>No</th>
                                            <th>NIK</th>
                                            <th>Nama</th>
                                            <th>Jumlah</th>
                                            <th>Periode</th>
                                            <th>Tanggal</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody id="previewUploadWajibBody">
                                    </tbody>
                                </table>
                            </div>
                            
                            <div id="uploadWajibSummary" class="mt-3">
                                <div class="row">
                                    <div class="col-md-4">
                                        <div class="card bg-light">
                                            <div class="card-body text-center">
                                                <h6>Total Data</h6>
                                                <h4 id="totalUploadWajibData">0</h4>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="card bg-success text-white">
                                            <div class="card-body text-center">
                                                <h6>Valid</h6>
                                                <h4 id="validUploadWajibData">0</h4>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="card bg-danger text-white">
                                            <div class="card-body text-center">
                                                <h6>Error</h6>
                                                <h4 id="errorUploadWajibData">0</h4>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="button" class="btn btn-success" id="btnProcessUploadWajib" onclick="processUploadSimpananWajib()" disabled>
                            <i class="bi bi-check-circle me-1"></i>Proses Upload
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showSimpananWajibModal() {
    document.getElementById('simpananWajibForm').reset();
    document.getElementById('tanggalWajib').value = new Date().toISOString().split('T')[0];
    const today = new Date();
    document.getElementById('periodeWajib').value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    new bootstrap.Modal(document.getElementById('simpananWajibModal')).show();
}

function saveSimpananWajib() {
    const simpanan = JSON.parse(localStorage.getItem('simpananWajib') || '[]');
    
    const anggotaId = document.getElementById('anggotaWajib').value;
    
    // NEW: Use transaction validator module
    const validation = validateAnggotaForSimpanan(anggotaId);
    if (!validation.valid) {
        showAlert(validation.error, 'error');
        return;
    }
    
    const data = {
        id: generateId(),
        anggotaId: anggotaId,
        jumlah: parseFloat(document.getElementById('jumlahWajib').value),
        periode: document.getElementById('periodeWajib').value,
        tanggal: document.getElementById('tanggalWajib').value,
        // Initialize pengembalian tracking fields
        statusPengembalian: 'Aktif',
        saldoSebelumPengembalian: null,
        pengembalianId: null,
        tanggalPengembalian: null
    };
    
    simpanan.push(data);
    localStorage.setItem('simpananWajib', JSON.stringify(simpanan));
    
    // Update jurnal
    addJurnal('Simpanan Wajib', [
        { akun: '1-1000', debit: data.jumlah, kredit: 0 },
        { akun: '2-1200', debit: 0, kredit: data.jumlah }
    ]);
    
    bootstrap.Modal.getInstance(document.getElementById('simpananWajibModal')).hide();
    showAlert('Simpanan wajib berhasil disimpan');
    renderSimpanan();
}

function deleteSimpananWajib(id) {
    if (confirm('Yakin ingin menghapus simpanan ini?')) {
        let simpanan = JSON.parse(localStorage.getItem('simpananWajib') || '[]');
        simpanan = simpanan.filter(s => s.id !== id);
        localStorage.setItem('simpananWajib', JSON.stringify(simpanan));
        showAlert('Simpanan wajib berhasil dihapus', 'info');
        renderSimpanan();
    }
}

// Upload Simpanan Wajib Functions
let uploadDataSimpananWajib = [];

function showUploadSimpananWajibModal() {
    document.getElementById('fileUploadSimpananWajib').value = '';
    document.getElementById('pasteDataSimpananWajib').value = '';
    document.getElementById('previewUploadWajibContainer').style.display = 'none';
    document.getElementById('btnProcessUploadWajib').disabled = true;
    uploadDataSimpananWajib = [];
    
    // Reset to first tab
    const uploadTab = document.getElementById('upload-file-wajib-tab');
    const uploadPane = document.getElementById('upload-file-wajib-pane');
    const pastePane = document.getElementById('paste-data-wajib-pane');
    uploadTab.classList.add('active');
    uploadPane.classList.add('show', 'active');
    pastePane.classList.remove('show', 'active');
    
    new bootstrap.Modal(document.getElementById('uploadSimpananWajibModal')).show();
}

function downloadTemplateSimpananWajib() {
    const today = new Date();
    const periode = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const tanggal = today.toISOString().split('T')[0];
    const template = `NIK,Nama,Jumlah,Periode,Tanggal\n3201010101010001,Budi Santoso,100000,${periode},${tanggal}\n3201010101010002,Siti Aminah,100000,${periode},${tanggal}\n`;
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_simpanan_wajib.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert('Template berhasil didownload', 'success');
}

function previewUploadSimpananWajib() {
    const fileInput = document.getElementById('fileUploadSimpananWajib');
    const file = fileInput.files[0];
    
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        parseUploadFileWajib(content, file.name);
    };
    reader.readAsText(file);
}

function previewPastedDataWajib() {
    const pastedData = document.getElementById('pasteDataSimpananWajib').value.trim();
    
    if (!pastedData) {
        showAlert('Tidak ada data yang di-paste', 'warning');
        return;
    }
    
    parseUploadFileWajib(pastedData, 'pasted-data');
}

function parseUploadFileWajib(content, filename) {
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
        showAlert('File kosong atau format tidak valid', 'warning');
        return;
    }
    
    // Deteksi delimiter (comma atau tab)
    const firstLine = lines[0];
    const delimiter = firstLine.includes('\t') ? '\t' : ',';
    
    // Skip header (baris pertama)
    const dataLines = lines.slice(1);
    
    uploadDataSimpananWajib = [];
    let validCount = 0;
    let errorCount = 0;
    
    const previewBody = document.getElementById('previewUploadWajibBody');
    previewBody.innerHTML = '';
    
    dataLines.forEach((line, index) => {
        // Split by delimiter dan trim
        const columns = line.split(delimiter).map(col => col.trim());
        
        if (columns.length < 5) {
            errorCount++;
            const row = document.createElement('tr');
            row.className = 'table-danger';
            row.innerHTML = `
                <td>${index + 1}</td>
                <td colspan="5">${line.substring(0, 50)}...</td>
                <td><span class="badge bg-danger">Format tidak lengkap</span></td>
            `;
            previewBody.appendChild(row);
            return;
        }
        
        const [nik, nama, jumlahStr, periode, tanggalInput] = columns;
        const jumlah = parseFloat(jumlahStr.replace(/[^\d.-]/g, ''));
        
        // Konversi tanggal ke format ISO
        const tanggal = convertToISODate(tanggalInput);
        
        // Validasi
        let status = 'valid';
        let errorMsg = '';
        
        // Cari anggota berdasarkan NIK
        const anggotaData = anggota.find(a => a.nik === nik);
        
        if (!anggotaData) {
            status = 'error';
            errorMsg = 'NIK tidak ditemukan';
        } else if (isNaN(jumlah) || jumlah <= 0) {
            status = 'error';
            errorMsg = 'Jumlah tidak valid';
        } else if (!periode || !/^\d{4}-\d{2}$/.test(periode)) {
            status = 'error';
            errorMsg = 'Format periode tidak valid (harus YYYY-MM)';
        } else if (!tanggal || !isValidDate(tanggalInput)) {
            status = 'error';
            errorMsg = `Format tanggal tidak valid: ${tanggalInput}`;
        }
        
        if (status === 'valid') {
            validCount++;
            uploadDataSimpananWajib.push({
                anggotaId: anggotaData.id,
                nik: nik,
                nama: nama,
                jumlah: jumlah,
                periode: periode,
                tanggal: tanggal
            });
        } else {
            errorCount++;
        }
        
        // Tampilkan preview
        const row = document.createElement('tr');
        row.className = status === 'valid' ? 'table-success' : 'table-danger';
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${nik}</td>
            <td>${nama}</td>
            <td>${formatRupiah(jumlah || 0)}</td>
            <td>${periode}</td>
            <td>${status === 'valid' ? tanggal : tanggalInput} ${status === 'valid' && tanggal !== tanggalInput ? '<small class="text-muted">(dikonversi)</small>' : ''}</td>
            <td>
                ${status === 'valid' 
                    ? '<span class="badge bg-success">Valid</span>' 
                    : `<span class="badge bg-danger">${errorMsg}</span>`
                }
            </td>
        `;
        previewBody.appendChild(row);
    });
    
    // Update summary
    document.getElementById('totalUploadWajibData').textContent = dataLines.length;
    document.getElementById('validUploadWajibData').textContent = validCount;
    document.getElementById('errorUploadWajibData').textContent = errorCount;
    
    // Show preview
    document.getElementById('previewUploadWajibContainer').style.display = 'block';
    document.getElementById('btnProcessUploadWajib').disabled = validCount === 0;
    
    // Show success message
    if (validCount > 0) {
        showAlert(`Preview berhasil! ${validCount} data valid dari ${dataLines.length} baris`, 'success');
    }
}

function processUploadSimpananWajib() {
    if (uploadDataSimpananWajib.length === 0) {
        showAlert('Tidak ada data valid untuk diproses', 'warning');
        return;
    }
    
    if (!confirm(`Proses ${uploadDataSimpananWajib.length} data simpanan wajib?`)) {
        return;
    }
    
    const simpanan = JSON.parse(localStorage.getItem('simpananWajib') || '[]');
    let successCount = 0;
    
    uploadDataSimpananWajib.forEach(data => {
        const newSimpanan = {
            id: generateId(),
            anggotaId: data.anggotaId,
            jumlah: data.jumlah,
            periode: data.periode,
            tanggal: data.tanggal
        };
        
        simpanan.push(newSimpanan);
        
        // Update jurnal untuk setiap transaksi
        addJurnal(`Simpanan Wajib - ${data.nama}`, [
            { akun: '1-1000', debit: data.jumlah, kredit: 0 },
            { akun: '2-1200', debit: 0, kredit: data.jumlah }
        ]);
        
        successCount++;
    });
    
    localStorage.setItem('simpananWajib', JSON.stringify(simpanan));
    
    bootstrap.Modal.getInstance(document.getElementById('uploadSimpananWajibModal')).hide();
    showAlert(`Berhasil memproses ${successCount} data simpanan wajib`, 'success');
    renderSimpanan();
}

function renderSimpananSukarela() {
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const simpanan = JSON.parse(localStorage.getItem('simpananSukarela') || '[]');
    
    return `
        <button class="btn btn-primary mb-3" onclick="showSimpananSukarelaModal()">
            <i class="bi bi-plus-circle me-1"></i>Tambah Simpanan Sukarela
        </button>
        <button class="btn btn-warning mb-3 ms-2" onclick="showTarikSukarelaModal()">
            <i class="bi bi-arrow-down-circle me-1"></i>Tarik Simpanan
        </button>
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Anggota</th>
                        <th>NIK</th>
                        <th>Jumlah</th>
                        <th>Tipe</th>
                        <th>Tanggal</th>
                        <th>Keterangan</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    ${simpanan.filter(s => s.jumlah > 0).map(s => {
                        const ang = anggota.find(a => a.id === s.anggotaId);
                        return `
                            <tr>
                                <td>${ang?.nama || '-'}</td>
                                <td>${ang?.nik || '-'}</td>
                                <td class="${s.tipe === 'tarik' ? 'text-danger' : 'text-success'}">
                                    ${s.tipe === 'tarik' ? '-' : '+'} ${formatRupiah(s.jumlah)}
                                </td>
                                <td>
                                    <span class="badge ${s.tipe === 'tarik' ? 'bg-danger' : 'bg-success'}">
                                        ${s.tipe === 'tarik' ? 'Penarikan' : 'Setoran'}
                                    </span>
                                </td>
                                <td>${formatDate(s.tanggal)}</td>
                                <td>${s.keterangan || '-'}</td>
                                <td>
                                    <button class="btn btn-sm btn-danger" onclick="deleteSimpananSukarela('${s.id}')">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <th colspan="2">Saldo Simpanan Sukarela</th>
                        <th>${formatRupiah(simpanan.filter(s => s.jumlah > 0).reduce((sum, s) => sum + (s.tipe === 'tarik' ? -s.jumlah : s.jumlah), 0))}</th>
                        <th colspan="4"></th>
                    </tr>
                </tfoot>
            </table>
        </div>
        
        <!-- Modal Simpanan Sukarela -->
        <div class="modal fade" id="simpananSukarelaModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Tambah Simpanan Sukarela</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="simpananSukarelaForm">
                            <div class="mb-3">
                                <label class="form-label">Pilih Anggota</label>
                                <select class="form-select" id="anggotaSukarela" required>
                                    <option value="">-- Pilih Anggota --</option>
                                    ${anggota.map(a => `<option value="${a.id}">${a.nama} - ${a.nik}</option>`).join('')}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Jumlah Simpanan</label>
                                <input type="number" class="form-control" id="jumlahSukarela" required min="0">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Keterangan</label>
                                <textarea class="form-control" id="keteranganSukarela" rows="2"></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Tanggal</label>
                                <input type="date" class="form-control" id="tanggalSukarela" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="button" class="btn btn-primary" onclick="saveSimpananSukarela()">Simpan</button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Modal Tarik Sukarela -->
        <div class="modal fade" id="tarikSukarelaModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-warning">
                        <h5 class="modal-title">Tarik Simpanan Sukarela</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="tarikSukarelaForm">
                            <div class="mb-3">
                                <label class="form-label">Pilih Anggota</label>
                                <select class="form-select" id="anggotaTarik" required onchange="checkSaldoSukarela()">
                                    <option value="">-- Pilih Anggota --</option>
                                    ${anggota.map(a => `<option value="${a.id}">${a.nama} - ${a.nik}</option>`).join('')}
                                </select>
                            </div>
                            <div class="alert alert-info" id="saldoInfo" style="display:none;">
                                <strong>Saldo Tersedia:</strong> <span id="saldoTersedia">Rp 0</span>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Jumlah Penarikan</label>
                                <input type="number" class="form-control" id="jumlahTarik" required min="0">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Keterangan</label>
                                <textarea class="form-control" id="keteranganTarik" rows="2"></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Tanggal</label>
                                <input type="date" class="form-control" id="tanggalTarik" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
                        <button type="button" class="btn btn-warning" onclick="saveTarikSukarela()">Proses Penarikan</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showSimpananSukarelaModal() {
    document.getElementById('simpananSukarelaForm').reset();
    document.getElementById('tanggalSukarela').value = new Date().toISOString().split('T')[0];
    new bootstrap.Modal(document.getElementById('simpananSukarelaModal')).show();
}

function saveSimpananSukarela() {
    const simpanan = JSON.parse(localStorage.getItem('simpananSukarela') || '[]');
    
    const anggotaId = document.getElementById('anggotaSukarela').value;
    
    // NEW: Use transaction validator module
    const validation = validateAnggotaForSimpanan(anggotaId);
    if (!validation.valid) {
        showAlert(validation.error, 'error');
        return;
    }
    
    const data = {
        id: generateId(),
        anggotaId: anggotaId,
        jumlah: parseFloat(document.getElementById('jumlahSukarela').value),
        tipe: 'setor',
        keterangan: document.getElementById('keteranganSukarela').value,
        tanggal: document.getElementById('tanggalSukarela').value,
        // Initialize pengembalian tracking fields
        statusPengembalian: 'Aktif',
        saldoSebelumPengembalian: null,
        pengembalianId: null,
        tanggalPengembalian: null
    };
    
    simpanan.push(data);
    localStorage.setItem('simpananSukarela', JSON.stringify(simpanan));
    
    // Update jurnal
    addJurnal('Simpanan Sukarela - Setoran', [
        { akun: '1-1000', debit: data.jumlah, kredit: 0 },
        { akun: '2-1300', debit: 0, kredit: data.jumlah }
    ]);
    
    bootstrap.Modal.getInstance(document.getElementById('simpananSukarelaModal')).hide();
    showAlert('Simpanan sukarela berhasil disimpan');
    renderSimpanan();
}

function showTarikSukarelaModal() {
    document.getElementById('tarikSukarelaForm').reset();
    document.getElementById('tanggalTarik').value = new Date().toISOString().split('T')[0];
    document.getElementById('saldoInfo').style.display = 'none';
    new bootstrap.Modal(document.getElementById('tarikSukarelaModal')).show();
}

function checkSaldoSukarela() {
    const anggotaId = document.getElementById('anggotaTarik').value;
    if (!anggotaId) return;
    
    const simpanan = JSON.parse(localStorage.getItem('simpananSukarela') || '[]');
    const saldo = simpanan
        .filter(s => s.anggotaId === anggotaId)
        .reduce((sum, s) => sum + (s.tipe === 'tarik' ? -s.jumlah : s.jumlah), 0);
    
    document.getElementById('saldoTersedia').textContent = formatRupiah(saldo);
    document.getElementById('saldoInfo').style.display = 'block';
}

function saveTarikSukarela() {
    const anggotaId = document.getElementById('anggotaTarik').value;
    const jumlah = parseFloat(document.getElementById('jumlahTarik').value);
    
    // Check saldo
    const simpanan = JSON.parse(localStorage.getItem('simpananSukarela') || '[]');
    const saldo = simpanan
        .filter(s => s.anggotaId === anggotaId)
        .reduce((sum, s) => sum + (s.tipe === 'tarik' ? -s.jumlah : s.jumlah), 0);
    
    if (jumlah > saldo) {
        showAlert('Saldo tidak mencukupi!', 'warning');
        return;
    }
    
    const data = {
        id: generateId(),
        anggotaId: anggotaId,
        jumlah: jumlah,
        tipe: 'tarik',
        keterangan: document.getElementById('keteranganTarik').value,
        tanggal: document.getElementById('tanggalTarik').value
    };
    
    simpanan.push(data);
    localStorage.setItem('simpananSukarela', JSON.stringify(simpanan));
    
    // Update jurnal
    addJurnal('Simpanan Sukarela - Penarikan', [
        { akun: '2-1300', debit: data.jumlah, kredit: 0 },
        { akun: '1-1000', debit: 0, kredit: data.jumlah }
    ]);
    
    bootstrap.Modal.getInstance(document.getElementById('tarikSukarelaModal')).hide();
    showAlert('Penarikan simpanan sukarela berhasil diproses');
    renderSimpanan();
}

function deleteSimpananSukarela(id) {
    if (confirm('Yakin ingin menghapus transaksi ini?')) {
        let simpanan = JSON.parse(localStorage.getItem('simpananSukarela') || '[]');
        simpanan = simpanan.filter(s => s.id !== id);
        localStorage.setItem('simpananSukarela', JSON.stringify(simpanan));
        showAlert('Transaksi berhasil dihapus', 'info');
        renderSimpanan();
    }
}
