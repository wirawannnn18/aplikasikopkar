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
                    ${simpanan.filter(s => {
                        // Filter: hanya tampilkan simpanan dengan saldo > 0 DAN anggota bukan keluar
                        const ang = anggota.find(a => a.id === s.anggotaId);
                        return s.jumlah > 0 && ang && ang.statusKeanggotaan !== 'Keluar';
                    }).map(s => {
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
                        <th>${formatRupiah(simpanan.filter(s => {
                            const ang = anggota.find(a => a.id === s.anggotaId);
                            return s.jumlah > 0 && ang && ang.statusKeanggotaan !== 'Keluar';
                        }).reduce((sum, s) => sum + s.jumlah, 0))}</th>
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
                                    ${filterTransactableAnggota(anggota).map(a => `<option value="${a.id}">${a.nama} - ${a.nik}</option>`).join('')}
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
    try {
        // Get form data with validation
        const anggotaId = document.getElementById('anggotaPokok').value;
        const jumlahInput = document.getElementById('jumlahPokok').value;
        const tanggalInput = document.getElementById('tanggalPokok').value;
        
        // Enhanced input validation
        if (!anggotaId) {
            if (typeof showUserError === 'function') {
                showUserError('required_field_empty', 'saveSimpananPokok');
            } else {
                showAlert('Pilih anggota terlebih dahulu', 'error');
            }
            return;
        }
        
        // Validate amount
        if (typeof validateAmount === 'function') {
            const amountValidation = validateAmount(jumlahInput);
            if (!amountValidation.valid) {
                if (typeof showUserError === 'function') {
                    showUserError(amountValidation.error, 'saveSimpananPokok');
                } else {
                    showAlert(amountValidation.message, 'error');
                }
                return;
            }
        }
        
        const jumlah = parseFloat(jumlahInput);
        if (isNaN(jumlah) || jumlah <= 0) {
            showAlert('Jumlah harus berupa angka yang valid dan lebih dari 0', 'error');
            return;
        }
        
        // Validate date
        if (!tanggalInput) {
            showAlert('Tanggal harus diisi', 'error');
            return;
        }
        
        // Get simpanan data safely
        let simpanan;
        if (typeof safeGetLocalStorage === 'function') {
            simpanan = safeGetLocalStorage('simpananPokok', []);
        } else {
            simpanan = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
        }
        
        if (!Array.isArray(simpanan)) {
            if (typeof logError === 'function') {
                logError('saveSimpananPokok', 'Invalid simpanan data structure', { 
                    dataType: typeof simpanan 
                });
            }
            showAlert('Data simpanan rusak. Silakan refresh halaman.', 'error');
            return;
        }
        
        // Use transaction validator module
        let validation;
        if (typeof validateAnggotaForSimpanan === 'function') {
            validation = validateAnggotaForSimpanan(anggotaId);
        } else if (typeof validateAnggotaForTransaction === 'function') {
            validation = validateAnggotaForTransaction(anggotaId);
        } else {
            // Fallback validation
            const anggotaList = JSON.parse(localStorage.getItem('anggota') || '[]');
            const anggota = anggotaList.find(a => a.id === anggotaId);
            if (!anggota) {
                showAlert('Anggota tidak ditemukan', 'error');
                return;
            }
            validation = { valid: true, anggota: anggota };
        }
        
        if (!validation.valid) {
            showAlert(validation.error, 'error');
            return;
        }
        
        // Create transaction data
        const data = {
            id: generateId(),
            anggotaId: anggotaId,
            jumlah: jumlah,
            tanggal: tanggalInput,
            // Initialize pengembalian tracking fields
            statusPengembalian: 'Aktif',
            saldoSebelumPengembalian: null,
            pengembalianId: null,
            tanggalPengembalian: null,
            createdAt: new Date().toISOString()
        };
        
        // Add to simpanan array
        simpanan.push(data);
        
        // Save data safely
        let saveSuccess;
        if (typeof safeSetLocalStorage === 'function') {
            saveSuccess = safeSetLocalStorage('simpananPokok', simpanan);
        } else {
            try {
                localStorage.setItem('simpananPokok', JSON.stringify(simpanan));
                saveSuccess = true;
            } catch (error) {
                if (typeof logError === 'function') {
                    logError('saveSimpananPokok', error, { dataLength: simpanan.length });
                }
                saveSuccess = false;
            }
        }
        
        if (!saveSuccess) {
            showAlert('Gagal menyimpan data simpanan. Silakan coba lagi.', 'error');
            return;
        }
        
        // Update jurnal with error handling
        try {
            if (typeof addJurnal === 'function') {
                addJurnal('Simpanan Pokok', [
                    { akun: '1-1000', debit: data.jumlah, kredit: 0 },
                    { akun: '2-1100', debit: 0, kredit: data.jumlah }
                ]);
            }
        } catch (jurnalError) {
            if (typeof logError === 'function') {
                logError('saveSimpananPokok', jurnalError, { 
                    anggotaId: anggotaId,
                    jumlah: jumlah 
                });
            }
            console.warn('Failed to create journal entry:', jurnalError);
            // Don't fail the transaction if journal fails
        }
        
        // Close modal and show success
        try {
            const modal = bootstrap.Modal.getInstance(document.getElementById('simpananPokokModal'));
            if (modal) {
                modal.hide();
            }
        } catch (modalError) {
            console.warn('Failed to close modal:', modalError);
        }
        
        showAlert('Simpanan pokok berhasil disimpan');
        
        // Refresh display
        if (typeof renderSimpanan === 'function') {
            renderSimpanan();
        }
        
    } catch (error) {
        if (typeof logError === 'function') {
            logError('saveSimpananPokok', error, {
                anggotaId: document.getElementById('anggotaPokok')?.value,
                jumlah: document.getElementById('jumlahPokok')?.value
            });
        }
        console.error('Error saving simpanan pokok:', error);
        showAlert('Terjadi kesalahan saat menyimpan simpanan pokok. Silakan coba lagi.', 'error');
    }
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
                    ${simpanan.filter(s => {
                        // Filter: hanya tampilkan simpanan dengan saldo > 0 DAN anggota bukan keluar
                        const ang = anggota.find(a => a.id === s.anggotaId);
                        return s.jumlah > 0 && ang && ang.statusKeanggotaan !== 'Keluar';
                    }).map(s => {
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
                        <th>${formatRupiah(simpanan.filter(s => {
                            const ang = anggota.find(a => a.id === s.anggotaId);
                            return s.jumlah > 0 && ang && ang.statusKeanggotaan !== 'Keluar';
                        }).reduce((sum, s) => sum + s.jumlah, 0))}</th>
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
                                    ${filterTransactableAnggota(anggota).map(a => `<option value="${a.id}">${a.nama} - ${a.nik}</option>`).join('')}
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
                    ${simpanan.filter(s => {
                        // Filter: hanya tampilkan simpanan dengan saldo > 0 DAN anggota bukan keluar
                        const ang = anggota.find(a => a.id === s.anggotaId);
                        return s.jumlah > 0 && ang && ang.statusKeanggotaan !== 'Keluar';
                    }).map(s => {
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
                        <th>${formatRupiah(simpanan.filter(s => {
                            const ang = anggota.find(a => a.id === s.anggotaId);
                            return s.jumlah > 0 && ang && ang.statusKeanggotaan !== 'Keluar';
                        }).reduce((sum, s) => sum + (s.tipe === 'tarik' ? -s.jumlah : s.jumlah), 0))}</th>
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
                                    ${filterTransactableAnggota(anggota).map(a => `<option value="${a.id}">${a.nama} - ${a.nik}</option>`).join('')}
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
                                    ${filterTransactableAnggota(anggota).map(a => `<option value="${a.id}">${a.nama} - ${a.nik}</option>`).join('')}
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


// ===== Simpanan Balance Zeroing Functions =====
//
// These functions implement the balance zeroing logic for anggota keluar after pencairan.
// They are critical for maintaining accurate accounting records and ensuring that
// exited members have zero balances in all simpanan types.
//
// BUSINESS LOGIC:
// 1. Simpanan Pokok - Direct balance zeroing (jumlah = 0)
// 2. Simpanan Wajib - Direct balance zeroing (jumlah = 0)  
// 3. Simpanan Sukarela - Create withdrawal transaction to zero balance
//
// ACCOUNTING IMPACT:
// - Each zeroing operation should be preceded by journal entry creation
// - Journal entries follow double-entry bookkeeping (Debit Simpanan, Credit Kas)
// - Kas balance is reduced by the total pencairan amount
//
// ERROR HANDLING:
// - Comprehensive input validation for all parameters
// - Safe localStorage access with corruption recovery
// - Detailed error logging with context for debugging
// - User-friendly error messages for all failure scenarios
//
// INTEGRATION:
// - Called by processPencairanSimpanan() during anggota keluar process
// - Integrated with createPencairanJournal() for accounting accuracy
// - Used by wizard anggota keluar for automated pencairan
//

/**
 * Zero out simpanan pokok balance for anggota keluar
 * This function sets the simpanan pokok balance to zero after pencairan
 * 
 * @param {string} anggotaId - ID of the anggota
 * @returns {object} Result object with success status and details
 * 
 * @example
 * const result = zeroSimpananPokok('anggota-123');
 * if (result.success) {
 *     console.log(`Zeroed ${result.amount} from simpanan pokok`);
 * }
 */
function zeroSimpananPokok(anggotaId) {
    try {
        // Enhanced input validation with comprehensive error handling
        // VALIDATION REQUIREMENTS FOR ANGGOTA ID:
        // 1. Must be a non-empty string
        // 2. Must not contain only whitespace characters
        // 3. Must be a valid identifier format
        // 4. Use validateAnggotaId() helper if available for consistency
        if (typeof validateAnggotaId === 'function') {
            const validation = validateAnggotaId(anggotaId);
            if (!validation.valid) {
                if (typeof logError === 'function') {
                    logError('zeroSimpananPokok', validation.error, { anggotaId });
                }
                return {
                    success: false,
                    amount: 0,
                    error: validation.message || 'ID anggota tidak valid'
                };
            }
        } else {
            // Fallback validation
            if (!anggotaId || typeof anggotaId !== 'string' || anggotaId.trim().length === 0) {
                if (typeof logError === 'function') {
                    logError('zeroSimpananPokok', 'Invalid anggotaId', { anggotaId });
                }
                return {
                    success: false,
                    amount: 0,
                    error: 'ID anggota tidak boleh kosong'
                };
            }
        }

        // Get simpanan data with safe access
        let simpananPokok;
        try {
            if (typeof safeGetLocalStorage === 'function') {
                simpananPokok = safeGetLocalStorage('simpananPokok', []);
            } else {
                simpananPokok = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
            }
        } catch (parseError) {
            if (typeof logError === 'function') {
                logError('zeroSimpananPokok', 'Failed to parse simpanan data', { 
                    anggotaId,
                    parseError: parseError.message
                });
            }
            
            if (typeof showUserError === 'function') {
                showUserError('data_corrupted', 'zeroSimpananPokok');
            }
            
            return {
                success: false,
                amount: 0,
                error: getUserFriendlyMessage('data_corrupted', 'Data simpanan rusak')
            };
        }
        
        // Validate data structure
        if (!Array.isArray(simpananPokok)) {
            if (typeof logError === 'function') {
                logError('zeroSimpananPokok', 'Invalid simpanan data structure', { 
                    anggotaId,
                    dataType: typeof simpananPokok
                });
            }
            
            if (typeof showUserError === 'function') {
                showUserError('data_corrupted', 'zeroSimpananPokok');
            }
            
            return {
                success: false,
                amount: 0,
                error: getUserFriendlyMessage('data_corrupted', 'Data simpanan tidak valid')
            };
        }
        
        let totalZeroed = 0;
        let processedCount = 0;
        
        // Find simpanan for this anggota and zero it out
        const updated = simpananPokok.map(s => {
            try {
                // Validate individual simpanan entry
                if (!s || typeof s !== 'object') {
                    if (typeof logError === 'function') {
                        logError('zeroSimpananPokok', 'Invalid simpanan entry', { 
                            anggotaId,
                            entry: s
                        });
                    }
                    return s; // Keep invalid entries as-is
                }
                
                if (s.anggotaId === anggotaId && s.jumlah > 0) {
                    totalZeroed += s.jumlah;
                    processedCount++;
                    return { ...s, jumlah: 0 };
                }
                return s;
            } catch (mapError) {
                if (typeof logError === 'function') {
                    logError('zeroSimpananPokok', 'Error processing simpanan entry', { 
                        anggotaId,
                        entry: s,
                        mapError: mapError.message
                    });
                }
                return s; // Keep problematic entries as-is
            }
        });
        
        // Save updated data with error handling
        try {
            if (typeof safeSetLocalStorage === 'function') {
                const saveSuccess = safeSetLocalStorage('simpananPokok', updated);
                if (!saveSuccess) {
                    throw new Error('Failed to save to localStorage');
                }
            } else {
                localStorage.setItem('simpananPokok', JSON.stringify(updated));
            }
        } catch (saveError) {
            if (typeof logError === 'function') {
                logError('zeroSimpananPokok', 'Failed to save updated data', { 
                    anggotaId,
                    totalZeroed,
                    saveError: saveError.message
                });
            }
            
            if (typeof showUserError === 'function') {
                showUserError('system_error', 'zeroSimpananPokok');
            }
            
            return {
                success: false,
                amount: 0,
                error: 'Gagal menyimpan perubahan data'
            };
        }
        
        // Log successful operation
        if (typeof logError === 'function' && totalZeroed > 0) {
            logError('zeroSimpananPokok', 'Simpanan successfully zeroed', { 
                anggotaId,
                totalZeroed,
                processedCount,
                level: 'info'
            });
        }
        
        return {
            success: true,
            amount: totalZeroed,
            processedCount: processedCount,
            message: `Simpanan pokok berhasil di-zero-kan: ${formatRupiah(totalZeroed)}`
        };
    } catch (error) {
        if (typeof logError === 'function') {
            logError('zeroSimpananPokok', error, { 
                anggotaId,
                stackTrace: error.stack
            });
        }
        
        if (typeof showUserError === 'function') {
            showUserError('system_error', 'zeroSimpananPokok');
        }
        
        console.error('Critical error in zeroSimpananPokok:', error);
        
        return {
            success: false,
            amount: 0,
            error: getUserFriendlyMessage('system_error', 'Terjadi kesalahan sistem')
        };
    }
}

/**
 * Zero out simpanan wajib balance for anggota keluar
 * This function sets the simpanan wajib balance to zero after pencairan
 * 
 * @param {string} anggotaId - ID of the anggota
 * @returns {object} Result object with success status and details
 * 
 * @example
 * const result = zeroSimpananWajib('anggota-123');
 * if (result.success) {
 *     console.log(`Zeroed ${result.amount} from simpanan wajib`);
 * }
 */
function zeroSimpananWajib(anggotaId) {
    try {
        const simpananWajib = JSON.parse(localStorage.getItem('simpananWajib') || '[]');
        let totalZeroed = 0;
        
        // Find simpanan for this anggota and zero it out
        const updated = simpananWajib.map(s => {
            if (s.anggotaId === anggotaId && s.jumlah > 0) {
                totalZeroed += s.jumlah;
                return { ...s, jumlah: 0 };
            }
            return s;
        });
        
        localStorage.setItem('simpananWajib', JSON.stringify(updated));
        
        return {
            success: true,
            amount: totalZeroed,
            message: `Simpanan wajib berhasil di-zero-kan: ${formatRupiah(totalZeroed)}`
        };
    } catch (error) {
        console.error('Error zeroing simpanan wajib:', error);
        return {
            success: false,
            amount: 0,
            error: error.message
        };
    }
}

/**
 * Zero out simpanan sukarela balance for anggota keluar
 * This function sets the simpanan sukarela balance to zero after pencairan
 * 
 * @param {string} anggotaId - ID of the anggota
 * @returns {object} Result object with success status and details
 * 
 * @example
 * const result = zeroSimpananSukarela('anggota-123');
 * if (result.success) {
 *     console.log(`Zeroed ${result.amount} from simpanan sukarela`);
 * }
 */
function zeroSimpananSukarela(anggotaId) {
    try {
        const simpananSukarela = JSON.parse(localStorage.getItem('simpananSukarela') || '[]');
        let totalZeroed = 0;
        
        // Calculate current balance (setor - tarik)
        const anggotaSimpanan = simpananSukarela.filter(s => s.anggotaId === anggotaId);
        const currentBalance = anggotaSimpanan.reduce((sum, s) => {
            return sum + (s.tipe === 'tarik' ? -s.jumlah : s.jumlah);
        }, 0);
        
        if (currentBalance > 0) {
            // Add a withdrawal transaction to zero out the balance
            const zeroingTransaction = {
                id: generateId(),
                anggotaId: anggotaId,
                jumlah: currentBalance,
                tipe: 'tarik',
                tanggal: new Date().toISOString(),
                keterangan: 'Pencairan simpanan sukarela - Anggota keluar',
                createdAt: new Date().toISOString()
            };
            
            simpananSukarela.push(zeroingTransaction);
            localStorage.setItem('simpananSukarela', JSON.stringify(simpananSukarela));
            
            totalZeroed = currentBalance;
        }
        
        return {
            success: true,
            amount: totalZeroed,
            message: `Simpanan sukarela berhasil di-zero-kan: ${formatRupiah(totalZeroed)}`
        };
    } catch (error) {
        console.error('Error zeroing simpanan sukarela:', error);
        return {
            success: false,
            amount: 0,
            error: error.message
        };
    }
}

/**
 * Get total simpanan balance for an anggota across all types
 * 
 * @param {string} anggotaId - ID of the anggota
 * @returns {object} Object with balances for each simpanan type
 * 
 * @example
 * const balances = getTotalSimpananBalance('anggota-123');
 * console.log(`Total: ${balances.total}`);
 */
function getTotalSimpananBalance(anggotaId) {
    try {
        const simpananPokok = JSON.parse(localStorage.getItem('simpananPokok') || '[]');
        const simpananWajib = JSON.parse(localStorage.getItem('simpananWajib') || '[]');
        const simpananSukarela = JSON.parse(localStorage.getItem('simpananSukarela') || '[]');
        
        const pokokBalance = simpananPokok
            .filter(s => s.anggotaId === anggotaId)
            .reduce((sum, s) => sum + s.jumlah, 0);
        
        const wajibBalance = simpananWajib
            .filter(s => s.anggotaId === anggotaId)
            .reduce((sum, s) => sum + s.jumlah, 0);
        
        const sukarelaBalance = simpananSukarela
            .filter(s => s.anggotaId === anggotaId)
            .reduce((sum, s) => sum + (s.tipe === 'tarik' ? -s.jumlah : s.jumlah), 0);
        
        return {
            pokok: pokokBalance,
            wajib: wajibBalance,
            sukarela: sukarelaBalance,
            total: pokokBalance + wajibBalance + sukarelaBalance
        };
    } catch (error) {
        console.error('Error getting total simpanan balance:', error);
        return {
            pokok: 0,
            wajib: 0,
            sukarela: 0,
            total: 0,
            error: error.message
        };
    }
}

// ===== End Simpanan Balance Zeroing Functions =====

// ===== Pencairan Journal Functions =====

/**
 * Create accounting journal entry for pencairan simpanan
 * Creates two journal entries:
 * 1. Debit: Simpanan account (reduces liability)
 * 2. Credit: Kas account (reduces asset)
 * 
 * @param {string} anggotaId - ID of the anggota
 * @param {string} jenisSimpanan - Type of simpanan ('Simpanan Pokok', 'Simpanan Wajib', 'Simpanan Sukarela')
 * @param {number} jumlah - Amount to return
 * @returns {object} Result object with success status and details
 * 
 * @example
 * const result = createPencairanJournal('anggota-123', 'Simpanan Pokok', 1000000);
 * if (result.success) {
 *     console.log('Journal entries created');
 * }
 */
function createPencairanJournal(anggotaId, jenisSimpanan, jumlah) {
    try {
        // Enhanced input validation
        if (typeof validateAnggotaId === 'function') {
            const validation = validateAnggotaId(anggotaId);
            if (!validation.valid) {
                if (typeof logError === 'function') {
                    logError('createPencairanJournal', validation.error, { anggotaId, jenisSimpanan, jumlah });
                }
                return {
                    success: false,
                    error: validation.message || 'ID anggota tidak valid'
                };
            }
        } else {
            // Fallback validation
            if (!anggotaId || typeof anggotaId !== 'string' || anggotaId.trim().length === 0) {
                if (typeof logError === 'function') {
                    logError('createPencairanJournal', 'Invalid anggotaId', { anggotaId, jenisSimpanan, jumlah });
                }
                return {
                    success: false,
                    error: 'ID anggota tidak boleh kosong'
                };
            }
        }

        // Validate amount
        if (typeof validateAmount === 'function') {
            const amountValidation = validateAmount(jumlah);
            if (!amountValidation.valid) {
                if (typeof logError === 'function') {
                    logError('createPencairanJournal', amountValidation.error, { anggotaId, jenisSimpanan, jumlah });
                }
                return {
                    success: false,
                    error: amountValidation.message || 'Jumlah tidak valid'
                };
            }
        } else {
            // Fallback amount validation
            const numJumlah = parseFloat(jumlah);
            if (isNaN(numJumlah) || numJumlah <= 0) {
                if (typeof logError === 'function') {
                    logError('createPencairanJournal', 'Invalid amount', { anggotaId, jenisSimpanan, jumlah });
                }
                return {
                    success: false,
                    error: 'Jumlah harus berupa angka yang valid dan lebih dari 0'
                };
            }
        }

        // Validate jenis simpanan
        const validJenisSimpanan = ['Simpanan Pokok', 'Simpanan Wajib', 'Simpanan Sukarela'];
        if (!jenisSimpanan || !validJenisSimpanan.includes(jenisSimpanan)) {
            if (typeof logError === 'function') {
                logError('createPencairanJournal', 'Invalid jenis simpanan', { 
                    anggotaId, 
                    jenisSimpanan, 
                    jumlah,
                    validTypes: validJenisSimpanan
                });
            }
            return {
                success: false,
                error: 'Jenis simpanan tidak valid'
            };
        }

        // Get anggota data with safe access
        let anggotaList;
        try {
            if (typeof safeGetLocalStorage === 'function') {
                anggotaList = safeGetLocalStorage('anggota', []);
            } else {
                anggotaList = JSON.parse(localStorage.getItem('anggota') || '[]');
            }
        } catch (parseError) {
            if (typeof logError === 'function') {
                logError('createPencairanJournal', 'Failed to parse anggota data', { 
                    anggotaId,
                    jenisSimpanan,
                    jumlah,
                    parseError: parseError.message
                });
            }
            
            if (typeof showUserError === 'function') {
                showUserError('data_corrupted', 'createPencairanJournal');
            }
            
            return {
                success: false,
                error: getUserFriendlyMessage('data_corrupted', 'Data anggota rusak')
            };
        }

        const anggota = anggotaList.find(a => a && a.id === anggotaId);
        
        if (!anggota) {
            if (typeof logError === 'function') {
                logError('createPencairanJournal', 'Anggota not found', { 
                    anggotaId,
                    jenisSimpanan,
                    jumlah,
                    totalAnggota: anggotaList.length
                });
            }
            
            if (typeof showUserError === 'function') {
                showUserError('anggota_not_found', 'createPencairanJournal');
            }
            
            return {
                success: false,
                error: getUserFriendlyMessage('anggota_not_found')
            };
        }
        
        // Validate anggota has required fields
        if (!anggota.nama) {
            if (typeof logError === 'function') {
                logError('createPencairanJournal', 'Anggota missing nama field', { 
                    anggotaId,
                    anggota
                });
            }
            return {
                success: false,
                error: 'Data anggota tidak lengkap (nama tidak ada)'
            };
        }
        
        // Map jenis simpanan to COA with validation
        const coaMap = {
            'Simpanan Pokok': 'Simpanan Pokok',
            'Simpanan Wajib': 'Simpanan Wajib',
            'Simpanan Sukarela': 'Simpanan Sukarela'
        };
        
        const coaSimpanan = coaMap[jenisSimpanan];
        if (!coaSimpanan) {
            if (typeof logError === 'function') {
                logError('createPencairanJournal', 'COA mapping failed', { 
                    anggotaId,
                    jenisSimpanan,
                    availableCOAs: Object.keys(coaMap)
                });
            }
            return {
                success: false,
                error: 'Jenis simpanan tidak valid untuk jurnal'
            };
        }
        
        // Get journal data with safe access
        let jurnal;
        try {
            if (typeof safeGetLocalStorage === 'function') {
                jurnal = safeGetLocalStorage('jurnal', []);
            } else {
                jurnal = JSON.parse(localStorage.getItem('jurnal') || '[]');
            }
        } catch (parseError) {
            if (typeof logError === 'function') {
                logError('createPencairanJournal', 'Failed to parse jurnal data', { 
                    anggotaId,
                    parseError: parseError.message
                });
            }
            
            if (typeof showUserError === 'function') {
                showUserError('data_corrupted', 'createPencairanJournal');
            }
            
            return {
                success: false,
                error: getUserFriendlyMessage('data_corrupted', 'Data jurnal rusak')
            };
        }
        
        if (!Array.isArray(jurnal)) {
            if (typeof logError === 'function') {
                logError('createPencairanJournal', 'Invalid jurnal data structure', { 
                    anggotaId,
                    dataType: typeof jurnal
                });
            }
            jurnal = []; // Initialize as empty array
        }
        
        const tanggal = new Date().toISOString();
        const referensi = `PENCAIRAN-${anggotaId}-${Date.now()}`;
        const keterangan = `Pencairan ${jenisSimpanan} - ${anggota.nama}`;
        
        // Create journal entries using addJurnal function to ensure COA is updated
        try {
            // Use addJurnal function to create entries and update COA automatically
            if (typeof addJurnal === 'function') {
                // Create entries array for addJurnal function
                const jurnalEntries = [
                    {
                        akun: coaSimpanan === 'Simpanan Pokok' ? '2-1100' : 
                              coaSimpanan === 'Simpanan Wajib' ? '2-1200' : 
                              coaSimpanan === 'Simpanan Sukarela' ? '2-1300' : '2-1100',
                        debit: parseFloat(jumlah),
                        kredit: 0
                    },
                    {
                        akun: '1-1000', // Kas account code
                        debit: 0,
                        kredit: parseFloat(jumlah)
                    }
                ];
                
                // Use addJurnal to create entries and update COA saldo
                addJurnal(keterangan, jurnalEntries, tanggal);
                
                // Log successful operation
                if (typeof logError === 'function') {
                    logError('createPencairanJournal', 'Journal entries created successfully with COA update', { 
                        anggotaId,
                        jenisSimpanan,
                        jumlah,
                        referensi,
                        level: 'info'
                    });
                }
                
                return {
                    success: true,
                    message: `Journal entries created for ${jenisSimpanan}: ${formatRupiah(jumlah)}`,
                    referensi: referensi,
                    entries: jurnalEntries.length,
                    coaUpdated: true
                };
            } else {
                // Fallback: Create entries manually (without COA update)
                const newEntries = [];
                
                // Entry 1: Debit Simpanan (mengurangi kewajiban)
                const debitEntry = {
                    id: typeof generateId === 'function' ? generateId() : `JRN-${Date.now()}-1`,
                    tanggal: tanggal,
                    keterangan: keterangan,
                    coa: coaSimpanan,
                    debit: parseFloat(jumlah),
                    kredit: 0,
                    referensi: referensi,
                    createdAt: tanggal
                };
                
                // Entry 2: Kredit Kas (mengurangi aset)
                const kreditEntry = {
                    id: typeof generateId === 'function' ? generateId() : `JRN-${Date.now()}-2`,
                    tanggal: tanggal,
                    keterangan: keterangan,
                    coa: 'Kas',
                    debit: 0,
                    kredit: parseFloat(jumlah),
                    referensi: referensi,
                    createdAt: tanggal
                };
                
                newEntries.push(debitEntry, kreditEntry);
                jurnal.push(...newEntries);
                
                // Save updated journal
                if (typeof safeSetLocalStorage === 'function') {
                    const saveSuccess = safeSetLocalStorage('jurnal', jurnal);
                    if (!saveSuccess) {
                        throw new Error('Failed to save to localStorage');
                    }
                } else {
                    localStorage.setItem('jurnal', JSON.stringify(jurnal));
                }
                
                // WARNING: COA not updated in fallback mode
                console.warn('createPencairanJournal: addJurnal function not available, COA saldo not updated');
                
                return {
                    success: true,
                    message: `Journal entries created for ${jenisSimpanan}: ${formatRupiah(jumlah)} (COA not updated)`,
                    referensi: referensi,
                    entries: newEntries.length,
                    coaUpdated: false,
                    warning: 'COA saldo not updated - addJurnal function not available'
                };
            }
            
        } catch (entryError) {
            if (typeof logError === 'function') {
                logError('createPencairanJournal', 'Error creating journal entries', { 
                    anggotaId,
                    entryError: entryError.message
                });
            }
            return {
                success: false,
                error: 'Gagal membuat entri jurnal: ' + entryError.message
            };
        }
        
        // Log successful operation
        if (typeof logError === 'function') {
            logError('createPencairanJournal', 'Journal entries created successfully', { 
                anggotaId,
                jenisSimpanan,
                jumlah,
                referensi,
                entriesCreated: newEntries.length,
                level: 'info'
            });
        }
        
        return {
            success: true,
            message: `Journal entries created for ${jenisSimpanan}: ${formatRupiah(jumlah)}`,
            referensi: referensi,
            entries: newEntries.length,
            debitEntry: newEntries[0],
            kreditEntry: newEntries[1]
        };
    } catch (error) {
        if (typeof logError === 'function') {
            logError('createPencairanJournal', error, { 
                anggotaId,
                jenisSimpanan,
                jumlah,
                stackTrace: error.stack
            });
        }
        
        if (typeof showUserError === 'function') {
            showUserError('system_error', 'createPencairanJournal');
        }
        
        console.error('Critical error in createPencairanJournal:', error);
        
        return {
            success: false,
            error: getUserFriendlyMessage('system_error', 'Terjadi kesalahan sistem saat membuat jurnal')
        };
    }
}

/**
 * Process complete pencairan simpanan for anggota keluar
 * This is the main function that orchestrates the entire pencairan process:
 * 1. Get current balances for all simpanan types
 * 2. Create journal entries for non-zero balances
 * 3. Zero out all simpanan balances
 * 4. Update anggota pengembalianStatus to 'Selesai'
 * 
 * @param {string} anggotaId - ID of the anggota keluar
 * @returns {object} Result object with success status and details
 * 
 * @example
 * const result = processPencairanSimpanan('anggota-123');
 * if (result.success) {
 *     console.log(`Total pencairan: ${result.totalAmount}`);
 * }
 */
function processPencairanSimpanan(anggotaId) {
    try {
        // Validate anggota exists
        const anggota = JSON.parse(localStorage.getItem('anggota') || '[]')
            .find(a => a.id === anggotaId);
        
        if (!anggota) {
            return {
                success: false,
                error: 'Anggota tidak ditemukan'
            };
        }
        
        // Check if already processed
        if (anggota.pengembalianStatus === 'Selesai') {
            return {
                success: false,
                error: 'Pencairan sudah diproses sebelumnya'
            };
        }
        
        // Get current balances
        const balances = getTotalSimpananBalance(anggotaId);
        
        if (balances.error) {
            return {
                success: false,
                error: `Error getting balances: ${balances.error}`
            };
        }
        
        let totalAmount = 0;
        const results = {
            pokok: null,
            wajib: null,
            sukarela: null
        };
        
        // Process Simpanan Pokok
        if (balances.pokok > 0) {
            const journalResult = createPencairanJournal(anggotaId, 'Simpanan Pokok', balances.pokok);
            if (!journalResult.success) {
                return {
                    success: false,
                    error: `Error creating journal for Simpanan Pokok: ${journalResult.error}`
                };
            }
            
            const zeroResult = zeroSimpananPokok(anggotaId);
            if (!zeroResult.success) {
                return {
                    success: false,
                    error: `Error zeroing Simpanan Pokok: ${zeroResult.error}`
                };
            }
            
            totalAmount += balances.pokok;
            results.pokok = {
                amount: balances.pokok,
                journal: journalResult.referensi
            };
        }
        
        // Process Simpanan Wajib
        if (balances.wajib > 0) {
            const journalResult = createPencairanJournal(anggotaId, 'Simpanan Wajib', balances.wajib);
            if (!journalResult.success) {
                return {
                    success: false,
                    error: `Error creating journal for Simpanan Wajib: ${journalResult.error}`
                };
            }
            
            const zeroResult = zeroSimpananWajib(anggotaId);
            if (!zeroResult.success) {
                return {
                    success: false,
                    error: `Error zeroing Simpanan Wajib: ${zeroResult.error}`
                };
            }
            
            totalAmount += balances.wajib;
            results.wajib = {
                amount: balances.wajib,
                journal: journalResult.referensi
            };
        }
        
        // Process Simpanan Sukarela
        if (balances.sukarela > 0) {
            const journalResult = createPencairanJournal(anggotaId, 'Simpanan Sukarela', balances.sukarela);
            if (!journalResult.success) {
                return {
                    success: false,
                    error: `Error creating journal for Simpanan Sukarela: ${journalResult.error}`
                };
            }
            
            const zeroResult = zeroSimpananSukarela(anggotaId);
            if (!zeroResult.success) {
                return {
                    success: false,
                    error: `Error zeroing Simpanan Sukarela: ${zeroResult.error}`
                };
            }
            
            totalAmount += balances.sukarela;
            results.sukarela = {
                amount: balances.sukarela,
                journal: journalResult.referensi
            };
        }
        
        // Update anggota pengembalianStatus
        const allAnggota = JSON.parse(localStorage.getItem('anggota') || '[]');
        const updated = allAnggota.map(a => {
            if (a.id === anggotaId) {
                return { 
                    ...a, 
                    pengembalianStatus: 'Selesai',
                    tanggalPencairan: new Date().toISOString()
                };
            }
            return a;
        });
        localStorage.setItem('anggota', JSON.stringify(updated));
        
        return {
            success: true,
            message: `Pencairan simpanan berhasil diproses untuk ${anggota.nama}`,
            totalAmount: totalAmount,
            details: results,
            anggotaId: anggotaId,
            anggotaNama: anggota.nama
        };
    } catch (error) {
        console.error('Error processing pencairan simpanan:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ===== End Pencairan Journal Functions =====
