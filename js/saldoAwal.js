// Saldo Awal Periode Module

/**
 * Render halaman utama Saldo Awal Periode
 */
function renderSaldoAwal() {
    const content = document.getElementById('mainContent');
    const saldoAwalPeriode = JSON.parse(localStorage.getItem('saldoAwalPeriode') || 'null');
    const periodeAktif = localStorage.getItem('periodeAktif') === 'true';
    
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 style="color: #2d6a4f; font-weight: 700;">
                <i class="bi bi-calendar-check me-2"></i>Saldo Awal Periode Akuntansi
            </h2>
            ${saldoAwalPeriode ? `
                <span class="badge ${periodeAktif ? 'bg-success' : 'bg-secondary'}" style="font-size: 1rem;">
                    <i class="bi bi-${periodeAktif ? 'unlock' : 'lock'} me-1"></i>
                    ${periodeAktif ? 'Periode Aktif' : 'Periode Terkunci'}
                </span>
            ` : ''}
        </div>
        
        ${saldoAwalPeriode ? renderRingkasanSaldoAwal(saldoAwalPeriode) : renderEmptyState()}
    `;
}

/**
 * Render empty state ketika belum ada saldo awal
 */
function renderEmptyState() {
    return `
        <div class="card">
            <div class="card-body text-center py-5">
                <i class="bi bi-inbox" style="font-size: 5rem; color: #95d5b2;"></i>
                <h4 class="mt-3" style="color: #2d6a4f;">Belum Ada Saldo Awal Periode</h4>
                <p class="text-muted mb-4">
                    Mulai periode akuntansi baru dengan menginput saldo awal untuk semua akun.
                </p>
                <button class="btn btn-primary btn-lg me-2" onclick="showFormSaldoAwal()">
                    <i class="bi bi-plus-circle me-2"></i>Input Saldo Awal Periode
                </button>
                <button class="btn btn-success btn-lg" onclick="importSaldoAwal()">
                    <i class="bi bi-upload me-2"></i>Import dari CSV
                </button>
            </div>
        </div>
    `;
}

/**
 * Render ringkasan saldo awal yang sudah ada
 */
function renderRingkasanSaldoAwal(saldoAwal) {
    const coa = JSON.parse(localStorage.getItem('coa') || '[]');
    
    // Hitung total per kategori dari COA
    const totalAset = coa.filter(a => a.tipe === 'Aset').reduce((sum, a) => sum + (a.saldo || 0), 0);
    const totalKewajiban = coa.filter(a => a.tipe === 'Kewajiban').reduce((sum, a) => sum + (a.saldo || 0), 0);
    const totalModal = coa.filter(a => a.tipe === 'Modal').reduce((sum, a) => sum + (a.saldo || 0), 0);
    
    const isBalance = Math.abs(totalAset - (totalKewajiban + totalModal)) < 0.01;
    
    return `
        <div class="row mb-4">
            <div class="col-md-4">
                <div class="card" style="border-left: 4px solid #2d6a4f;">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">
                            <i class="bi bi-wallet2 me-1"></i>Total Aset
                        </h6>
                        <h3 style="color: #2d6a4f; font-weight: 700;">${formatRupiah(totalAset)}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card" style="border-left: 4px solid #e63946;">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">
                            <i class="bi bi-credit-card me-1"></i>Total Kewajiban
                        </h6>
                        <h3 style="color: #e63946; font-weight: 700;">${formatRupiah(totalKewajiban)}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card" style="border-left: 4px solid #457b9d;">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">
                            <i class="bi bi-bank me-1"></i>Total Modal
                        </h6>
                        <h3 style="color: #457b9d; font-weight: 700;">${formatRupiah(totalModal)}</h3>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card mb-3">
            <div class="card-header" style="background: ${isBalance ? '#d4edda' : '#f8d7da'}; color: ${isBalance ? '#155724' : '#721c24'};">
                <div class="d-flex justify-content-between align-items-center">
                    <span>
                        <i class="bi bi-${isBalance ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
                        Status Balance
                    </span>
                    <span class="badge ${isBalance ? 'bg-success' : 'bg-danger'}">
                        ${isBalance ? '✓ Balance' : '✗ Tidak Balance'}
                    </span>
                </div>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <p class="mb-1"><strong>Persamaan Akuntansi:</strong></p>
                        <p class="mb-0">Aset = Kewajiban + Modal</p>
                        <p class="mb-0">${formatRupiah(totalAset)} = ${formatRupiah(totalKewajiban)} + ${formatRupiah(totalModal)}</p>
                    </div>
                    <div class="col-md-6 text-end">
                        ${!isBalance ? `
                            <p class="text-danger mb-0">
                                <strong>Selisih: ${formatRupiah(Math.abs(totalAset - (totalKewajiban + totalModal)))}</strong>
                            </p>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <div class="d-flex justify-content-between align-items-center">
                    <span><i class="bi bi-list-ul me-2"></i>Informasi Periode</span>
                    <div>
                        <button class="btn btn-sm ${saldoAwal.locked ? 'btn-success' : 'btn-danger'}" onclick="togglePeriodeLock()">
                            <i class="bi bi-${saldoAwal.locked ? 'unlock' : 'lock'} me-1"></i>${saldoAwal.locked ? 'Buka Kunci' : 'Kunci Periode'}
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="editSaldoAwal()">
                            <i class="bi bi-pencil me-1"></i>Edit
                        </button>
                        <button class="btn btn-sm btn-success" onclick="importSaldoAwal()">
                            <i class="bi bi-upload me-1"></i>Import CSV
                        </button>
                        <button class="btn btn-sm btn-info" onclick="exportSaldoAwal()">
                            <i class="bi bi-download me-1"></i>Export CSV
                        </button>
                    </div>
                </div>
            </div>
            <div class="card-body">
                <table class="table table-borderless">
                    <tr>
                        <td width="30%"><strong>Tanggal Mulai Periode:</strong></td>
                        <td>${formatDate(saldoAwal.tanggalMulai)}</td>
                    </tr>
                    <tr>
                        <td><strong>Status:</strong></td>
                        <td>
                            <span class="badge ${saldoAwal.status === 'aktif' ? 'bg-success' : 'bg-secondary'}">
                                ${saldoAwal.status === 'aktif' ? 'Aktif' : 'Tutup'}
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td><strong>Status Kunci:</strong></td>
                        <td>
                            <span class="badge ${saldoAwal.locked ? 'bg-danger' : 'bg-success'}">
                                <i class="bi bi-${saldoAwal.locked ? 'lock-fill' : 'unlock-fill'} me-1"></i>
                                ${saldoAwal.locked ? 'Terkunci' : 'Tidak Terkunci'}
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td><strong>Dibuat Pada:</strong></td>
                        <td>${formatDate(saldoAwal.createdAt)}</td>
                    </tr>
                    ${saldoAwal.locked && saldoAwal.lockedAt ? `
                    <tr>
                        <td><strong>Dikunci Pada:</strong></td>
                        <td>${formatDate(saldoAwal.lockedAt)}</td>
                    </tr>
                    ` : ''}
                </table>
            </div>
        </div>
    `;
}

/**
 * State untuk wizard form
 */
let wizardState = {
    currentStep: 1,
    totalSteps: 7,
    isEditMode: false,
    oldSaldoAwal: null,
    data: {
        tanggalMulai: '',
        modalKoperasi: 0,
        kas: 0,
        bank: 0,
        persediaan: [],
        piutangAnggota: [],
        hutangSupplier: [],
        simpananAnggota: [],
        pinjamanAnggota: []
    }
};

/**
 * Menampilkan form input saldo awal dengan wizard multi-step
 */
function showFormSaldoAwal() {
    wizardState.currentStep = 1;
    wizardState.isEditMode = false;
    wizardState.oldSaldoAwal = null;
    wizardState.data = {
        tanggalMulai: '',
        modalKoperasi: 0,
        kas: 0,
        bank: 0,
        persediaan: [],
        piutangAnggota: [],
        hutangSupplier: [],
        simpananAnggota: [],
        pinjamanAnggota: []
    };
    
    renderWizardForm();
}

/**
 * Render wizard form
 */
function renderWizardForm() {
    const content = document.getElementById('mainContent');
    
    const isEditMode = wizardState.isEditMode === true;
    
    content.innerHTML = `
        <div class="card">
            <div class="card-header" style="background: linear-gradient(135deg, ${isEditMode ? '#e63946' : '#2d6a4f'} 0%, ${isEditMode ? '#f77f00' : '#40916c'} 100%); color: white;">
                <h4 class="mb-0">
                    <i class="bi bi-${isEditMode ? 'pencil-square' : 'calendar-plus'} me-2"></i>${isEditMode ? 'Edit' : 'Input'} Saldo Awal Periode
                </h4>
                ${isEditMode ? '<p class="mb-0 small"><i class="bi bi-exclamation-triangle me-1"></i>Mode Edit - Perubahan akan dicatat sebagai jurnal koreksi</p>' : ''}
            </div>
            <div class="card-body">
                <!-- Progress Steps -->
                <div class="mb-4">
                    ${renderProgressSteps()}
                </div>
                
                <!-- Form Content -->
                <div id="wizardContent">
                    ${renderStepContent()}
                </div>
                
                <!-- Navigation Buttons -->
                <div class="d-flex justify-content-between mt-4">
                    <button class="btn btn-secondary" onclick="wizardPrevious()" ${wizardState.currentStep === 1 ? 'disabled' : ''}>
                        <i class="bi bi-arrow-left me-2"></i>Sebelumnya
                    </button>
                    <button class="btn btn-primary" onclick="wizardNext()">
                        ${wizardState.currentStep === wizardState.totalSteps ? (isEditMode ? 'Update' : 'Simpan') : 'Selanjutnya'}
                        <i class="bi bi-arrow-right ms-2"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render progress steps indicator
 */
function renderProgressSteps() {
    const steps = [
        { num: 1, label: 'Tanggal & Modal' },
        { num: 2, label: 'Kas & Bank' },
        { num: 3, label: 'Piutang' },
        { num: 4, label: 'Hutang' },
        { num: 5, label: 'Persediaan' },
        { num: 6, label: 'Simpanan' },
        { num: 7, label: 'Pinjaman & Ringkasan' }
    ];
    
    let html = '<div class="row text-center">';
    
    steps.forEach(step => {
        const isActive = step.num === wizardState.currentStep;
        const isCompleted = step.num < wizardState.currentStep;
        
        html += `
            <div class="col">
                <div class="step-indicator ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}">
                    <div class="step-number">
                        ${isCompleted ? '<i class="bi bi-check-lg"></i>' : step.num}
                    </div>
                    <div class="step-label">${step.label}</div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    // Add CSS for step indicators
    html += `
        <style>
            .step-indicator {
                position: relative;
                padding: 10px;
            }
            .step-number {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: #e9ecef;
                color: #6c757d;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 8px;
                font-weight: bold;
                border: 2px solid #e9ecef;
            }
            .step-indicator.active .step-number {
                background: #2d6a4f;
                color: white;
                border-color: #2d6a4f;
            }
            .step-indicator.completed .step-number {
                background: #40916c;
                color: white;
                border-color: #40916c;
            }
            .step-label {
                font-size: 0.85rem;
                color: #6c757d;
            }
            .step-indicator.active .step-label {
                color: #2d6a4f;
                font-weight: bold;
            }
        </style>
    `;
    
    return html;
}

/**
 * Render content untuk step saat ini
 */
function renderStepContent() {
    switch(wizardState.currentStep) {
        case 1:
            return renderStep1TanggalModal();
        case 2:
            return renderStep2KasBank();
        case 3:
            return renderStep3Piutang();
        case 4:
            return renderStep4Hutang();
        case 5:
            return renderStep5Persediaan();
        case 6:
            return renderStep6Simpanan();
        case 7:
            return renderStep7PinjamanRingkasan();
        default:
            return '<p>Step tidak ditemukan</p>';
    }
}

/**
 * Step 1: Input Tanggal Periode dan Modal Awal
 */
function renderStep1TanggalModal() {
    return `
        <h5 class="mb-3" style="color: #2d6a4f;">
            <i class="bi bi-calendar-event me-2"></i>Tanggal Periode & Modal Awal
        </h5>
        <p class="text-muted mb-4">Tentukan tanggal mulai periode akuntansi dan modal awal koperasi.</p>
        
        <div class="row">
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">Tanggal Mulai Periode <span class="text-danger">*</span></label>
                    <input type="date" class="form-control" id="tanggalMulai" 
                           value="${wizardState.data.tanggalMulai}"
                           onchange="wizardState.data.tanggalMulai = this.value">
                    <small class="text-muted">Tanggal ini akan menjadi awal periode akuntansi</small>
                </div>
            </div>
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">Modal Awal Koperasi <span class="text-danger">*</span></label>
                    <input type="number" class="form-control" id="modalKoperasi" 
                           value="${wizardState.data.modalKoperasi}"
                           onchange="wizardState.data.modalKoperasi = parseFloat(this.value) || 0"
                           step="1000">
                    <small class="text-muted">Modal awal yang dimiliki koperasi (boleh 0 atau kosong)</small>
                </div>
            </div>
        </div>
        
        <div class="alert alert-info">
            <i class="bi bi-info-circle me-2"></i>
            <strong>Informasi:</strong> Modal awal akan dicatat sebagai jurnal pembuka dengan debit Kas dan kredit Modal Koperasi. Nilai 0 atau field kosong akan diperlakukan sebagai modal awal 0.
        </div>
    `;
}

/**
 * Step 2: Input Kas dan Bank
 */
function renderStep2KasBank() {
    return `
        <h5 class="mb-3" style="color: #2d6a4f;">
            <i class="bi bi-cash-stack me-2"></i>Saldo Kas & Bank
        </h5>
        <p class="text-muted mb-4">Input saldo kas dan bank yang dimiliki pada awal periode.</p>
        
        <div class="row">
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">Saldo Kas</label>
                    <input type="number" class="form-control" id="kas" 
                           value="${wizardState.data.kas}"
                           onchange="wizardState.data.kas = parseFloat(this.value) || 0"
                           min="0" step="1000">
                    <small class="text-muted">Uang tunai yang ada di kasir (Akun 1-1000)</small>
                </div>
            </div>
            <div class="col-md-6">
                <div class="mb-3">
                    <label class="form-label">Saldo Bank</label>
                    <input type="number" class="form-control" id="bank" 
                           value="${wizardState.data.bank}"
                           onchange="wizardState.data.bank = parseFloat(this.value) || 0"
                           min="0" step="1000">
                    <small class="text-muted">Saldo rekening bank koperasi (Akun 1-1100)</small>
                </div>
            </div>
        </div>
        
        <div class="card bg-light">
            <div class="card-body">
                <h6 class="mb-2">Total Aset Lancar:</h6>
                <h4 style="color: #2d6a4f;">${formatRupiah(wizardState.data.kas + wizardState.data.bank)}</h4>
            </div>
        </div>
    `;
}

/**
 * Step 3: Input Piutang Anggota
 */
function renderStep3Piutang() {
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    
    return `
        <h5 class="mb-3" style="color: #2d6a4f;">
            <i class="bi bi-person-lines-fill me-2"></i>Piutang Anggota
        </h5>
        <p class="text-muted mb-4">Input piutang yang belum tertagih dari anggota pada awal periode.</p>
        
        <button class="btn btn-sm btn-primary mb-3" onclick="addPiutangRow()">
            <i class="bi bi-plus-circle me-1"></i>Tambah Piutang
        </button>
        
        <div class="table-responsive">
            <table class="table table-bordered">
                <thead class="table-light">
                    <tr>
                        <th width="30%">Anggota</th>
                        <th width="25%">NIK</th>
                        <th width="30%">Jumlah Piutang</th>
                        <th width="15%">Aksi</th>
                    </tr>
                </thead>
                <tbody id="piutangTableBody">
                    ${renderPiutangRows()}
                </tbody>
            </table>
        </div>
        
        <div class="card bg-light">
            <div class="card-body">
                <h6 class="mb-2">Total Piutang Anggota:</h6>
                <h4 style="color: #2d6a4f;">${formatRupiah(calculateTotalPiutang())}</h4>
            </div>
        </div>
    `;
}

/**
 * Step 4: Input Hutang Supplier
 */
function renderStep4Hutang() {
    return `
        <h5 class="mb-3" style="color: #2d6a4f;">
            <i class="bi bi-truck me-2"></i>Hutang Supplier
        </h5>
        <p class="text-muted mb-4">Input hutang yang belum dibayar kepada supplier pada awal periode.</p>
        
        <button class="btn btn-sm btn-primary mb-3" onclick="addHutangRow()">
            <i class="bi bi-plus-circle me-1"></i>Tambah Hutang
        </button>
        
        <div class="table-responsive">
            <table class="table table-bordered">
                <thead class="table-light">
                    <tr>
                        <th width="40%">Nama Supplier</th>
                        <th width="40%">Jumlah Hutang</th>
                        <th width="20%">Aksi</th>
                    </tr>
                </thead>
                <tbody id="hutangTableBody">
                    ${renderHutangRows()}
                </tbody>
            </table>
        </div>
        
        <div class="card bg-light">
            <div class="card-body">
                <h6 class="mb-2">Total Hutang Supplier:</h6>
                <h4 style="color: #e63946;">${formatRupiah(calculateTotalHutang())}</h4>
            </div>
        </div>
    `;
}

/**
 * Step 5: Input Persediaan Barang
 */
function renderStep5Persediaan() {
    const barang = JSON.parse(localStorage.getItem('barang') || '[]');
    
    return `
        <h5 class="mb-3" style="color: #2d6a4f;">
            <i class="bi bi-box-seam me-2"></i>Persediaan Barang
        </h5>
        <p class="text-muted mb-4">Input stok awal barang yang tersedia pada awal periode.</p>
        
        ${barang.length === 0 ? `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Belum ada data barang. Silakan tambahkan barang terlebih dahulu di menu Inventory.
            </div>
        ` : `
            <div class="table-responsive">
                <table class="table table-bordered">
                    <thead class="table-light">
                        <tr>
                            <th width="30%">Nama Barang</th>
                            <th width="20%">HPP</th>
                            <th width="20%">Stok Awal</th>
                            <th width="30%">Total Nilai</th>
                        </tr>
                    </thead>
                    <tbody id="persediaanTableBody">
                        ${renderPersediaanRows(barang)}
                    </tbody>
                </table>
            </div>
            
            <div class="card bg-light">
                <div class="card-body">
                    <h6 class="mb-2">Total Nilai Persediaan:</h6>
                    <h4 style="color: #2d6a4f;">${formatRupiah(calculateTotalPersediaan())}</h4>
                </div>
            </div>
        `}
    `;
}

/**
 * Step 6: Input Simpanan Anggota
 */
function renderStep6Simpanan() {
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    
    return `
        <h5 class="mb-3" style="color: #2d6a4f;">
            <i class="bi bi-piggy-bank me-2"></i>Simpanan Anggota
        </h5>
        <p class="text-muted mb-4">Input saldo simpanan (pokok, wajib, sukarela) anggota pada awal periode.</p>
        
        ${anggota.length === 0 ? `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Belum ada data anggota. Silakan tambahkan anggota terlebih dahulu.
            </div>
        ` : `
            <div class="mb-3">
                <button class="btn btn-success me-2" onclick="showUploadSimpananDialog('pokok')">
                    <i class="bi bi-upload me-1"></i>Upload Simpanan Pokok CSV
                </button>
                <button class="btn btn-success" onclick="showUploadSimpananDialog('wajib')">
                    <i class="bi bi-upload me-1"></i>Upload Simpanan Wajib CSV
                </button>
            </div>
            
            <div class="table-responsive">
                <table class="table table-bordered">
                    <thead class="table-light">
                        <tr>
                            <th width="18%">NIK</th>
                            <th width="22%">Nama</th>
                            <th width="17%">Simpanan Pokok</th>
                            <th width="17%">Simpanan Wajib</th>
                            <th width="18%">Simpanan Sukarela</th>
                            <th width="8%">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="simpananTableBody">
                        ${renderSimpananRows(anggota)}
                    </tbody>
                </table>
            </div>
            
            <div class="row">
                <div class="col-md-4">
                    <div class="card bg-light">
                        <div class="card-body">
                            <h6 class="mb-2">Total Simpanan Pokok:</h6>
                            <h5 style="color: #2d6a4f;">${formatRupiah(calculateTotalSimpananPokok())}</h5>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-light">
                        <div class="card-body">
                            <h6 class="mb-2">Total Simpanan Wajib:</h6>
                            <h5 style="color: #2d6a4f;">${formatRupiah(calculateTotalSimpananWajib())}</h5>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-light">
                        <div class="card-body">
                            <h6 class="mb-2">Total Simpanan Sukarela:</h6>
                            <h5 style="color: #2d6a4f;">${formatRupiah(calculateTotalSimpananSukarela())}</h5>
                        </div>
                    </div>
                </div>
            </div>
        `}
    `;
}

/**
 * Step 7: Input Pinjaman dan Ringkasan
 */
function renderStep7PinjamanRingkasan() {
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    
    return `
        <h5 class="mb-3" style="color: #2d6a4f;">
            <i class="bi bi-cash-coin me-2"></i>Pinjaman Anggota & Ringkasan
        </h5>
        <p class="text-muted mb-4">Input pinjaman yang masih aktif dan lihat ringkasan saldo awal.</p>
        
        <h6 class="mb-3">Pinjaman Anggota</h6>
        <button class="btn btn-sm btn-primary mb-3" onclick="addPinjamanRow()">
            <i class="bi bi-plus-circle me-1"></i>Tambah Pinjaman
        </button>
        
        <div class="table-responsive mb-4">
            <table class="table table-bordered">
                <thead class="table-light">
                    <tr>
                        <th width="20%">Anggota</th>
                        <th width="15%">Jumlah Pokok</th>
                        <th width="10%">Bunga (%)</th>
                        <th width="10%">Tenor (bln)</th>
                        <th width="20%">Jatuh Tempo</th>
                        <th width="15%">Aksi</th>
                    </tr>
                </thead>
                <tbody id="pinjamanTableBody">
                    ${renderPinjamanRows()}
                </tbody>
            </table>
        </div>
        
        <hr class="my-4">
        
        <h6 class="mb-3">Ringkasan Saldo Awal</h6>
        ${renderRingkasanWizard()}
    `;
}

/**
 * Render ringkasan di wizard step 7
 */
function renderRingkasanWizard() {
    const totalAset = wizardState.data.kas + wizardState.data.bank + 
                      calculateTotalPiutang() + calculateTotalPersediaan() +
                      calculateTotalPinjaman();
    const totalKewajiban = calculateTotalHutang() + 
                           calculateTotalSimpananPokok() + 
                           calculateTotalSimpananWajib() + 
                           calculateTotalSimpananSukarela();
    const totalModal = wizardState.data.modalKoperasi;
    
    const isBalance = Math.abs(totalAset - (totalKewajiban + totalModal)) < 0.01;
    const selisih = totalAset - (totalKewajiban + totalModal);
    
    return `
        <div class="row mb-3">
            <div class="col-md-4">
                <div class="card" style="border-left: 4px solid #2d6a4f;">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Total Aset</h6>
                        <h4 style="color: #2d6a4f;">${formatRupiah(totalAset)}</h4>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card" style="border-left: 4px solid #e63946;">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Total Kewajiban</h6>
                        <h4 style="color: #e63946;">${formatRupiah(totalKewajiban)}</h4>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card" style="border-left: 4px solid #457b9d;">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">Total Modal</h6>
                        <h4 style="color: #457b9d;">${formatRupiah(totalModal)}</h4>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="alert ${isBalance ? 'alert-success' : 'alert-danger'}">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <i class="bi bi-${isBalance ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
                    <strong>Persamaan Akuntansi: Aset = Kewajiban + Modal</strong>
                    <br>
                    <span>${formatRupiah(totalAset)} = ${formatRupiah(totalKewajiban)} + ${formatRupiah(totalModal)}</span>
                </div>
                <div>
                    <span class="badge ${isBalance ? 'bg-success' : 'bg-danger'}" style="font-size: 1rem;">
                        ${isBalance ? '✓ Balance' : '✗ Tidak Balance'}
                    </span>
                </div>
            </div>
            ${!isBalance ? `
                <hr>
                <p class="mb-0"><strong>Selisih: ${formatRupiah(Math.abs(selisih))}</strong></p>
                <p class="mb-0 small">Pastikan semua data sudah diinput dengan benar agar neraca balance.</p>
            ` : ''}
        </div>
    `;
}

/**
 * Navigation: Previous Step
 */
function wizardPrevious() {
    if (wizardState.currentStep > 1) {
        wizardState.currentStep--;
        renderWizardForm();
    }
}

/**
 * Navigation: Next Step
 */
function wizardNext() {
    // Validasi step saat ini
    if (!validateCurrentStep()) {
        return;
    }
    
    // Jika step terakhir, simpan data
    if (wizardState.currentStep === wizardState.totalSteps) {
        saveSaldoAwal();
        return;
    }
    
    // Lanjut ke step berikutnya
    wizardState.currentStep++;
    renderWizardForm();
}

/**
 * Validasi step saat ini
 */
function validateCurrentStep() {
    const errors = [];
    
    if (wizardState.currentStep === 1) {
        // Validasi tanggal periode (skip jika edit mode)
        if (!wizardState.isEditMode) {
            const dateValidation = validateUniquePeriodDate(wizardState.data.tanggalMulai);
            if (!dateValidation.isValid) {
                errors.push(dateValidation.message);
            }
        }
        
        // Validasi modal koperasi - hanya tolak nilai negatif
        const modalValidation = validatePositiveValue(wizardState.data.modalKoperasi, 'Modal Koperasi');
        if (!modalValidation.isValid) {
            errors.push(modalValidation.message);
        } else if (wizardState.data.modalKoperasi < 0) {
            errors.push('Modal Koperasi tidak boleh negatif');
        }
    }
    
    if (wizardState.currentStep === 2) {
        // Validasi kas
        const kasValidation = validatePositiveValue(wizardState.data.kas, 'Saldo Kas');
        if (!kasValidation.isValid) {
            errors.push(kasValidation.message);
        }
        
        // Validasi bank
        const bankValidation = validatePositiveValue(wizardState.data.bank, 'Saldo Bank');
        if (!bankValidation.isValid) {
            errors.push(bankValidation.message);
        }
    }
    
    if (wizardState.currentStep === 3) {
        // Validasi piutang anggota
        wizardState.data.piutangAnggota.forEach((piutang, index) => {
            if (piutang.anggotaId && piutang.jumlah > 0) {
                const piutangValidation = validatePositiveValue(piutang.jumlah, `Piutang Anggota #${index + 1}`);
                if (!piutangValidation.isValid) {
                    errors.push(piutangValidation.message);
                }
            }
        });
    }
    
    if (wizardState.currentStep === 4) {
        // Validasi hutang supplier
        wizardState.data.hutangSupplier.forEach((hutang, index) => {
            if (hutang.namaSupplier && hutang.jumlah > 0) {
                const hutangValidation = validatePositiveValue(hutang.jumlah, `Hutang Supplier #${index + 1}`);
                if (!hutangValidation.isValid) {
                    errors.push(hutangValidation.message);
                }
            }
        });
    }
    
    if (wizardState.currentStep === 5) {
        // Validasi persediaan
        wizardState.data.persediaan.forEach((item, index) => {
            if (item.stok > 0) {
                const stokValidation = validatePositiveValue(item.stok, `Stok ${item.namaBarang}`);
                if (!stokValidation.isValid) {
                    errors.push(stokValidation.message);
                }
            }
        });
    }
    
    if (wizardState.currentStep === 6) {
        // Validasi simpanan anggota
        wizardState.data.simpananAnggota.forEach((simpanan, index) => {
            if (simpanan.simpananPokok > 0) {
                const pokokValidation = validatePositiveValue(simpanan.simpananPokok, `Simpanan Pokok ${simpanan.nama}`);
                if (!pokokValidation.isValid) {
                    errors.push(pokokValidation.message);
                }
            }
            
            if (simpanan.simpananWajib > 0) {
                const wajibValidation = validatePositiveValue(simpanan.simpananWajib, `Simpanan Wajib ${simpanan.nama}`);
                if (!wajibValidation.isValid) {
                    errors.push(wajibValidation.message);
                }
            }
            
            if (simpanan.simpananSukarela > 0) {
                const sukarelaValidation = validatePositiveValue(simpanan.simpananSukarela, `Simpanan Sukarela ${simpanan.nama}`);
                if (!sukarelaValidation.isValid) {
                    errors.push(sukarelaValidation.message);
                }
            }
        });
    }
    
    if (wizardState.currentStep === 7) {
        // Validasi pinjaman anggota
        wizardState.data.pinjamanAnggota.forEach((pinjaman, index) => {
            if (pinjaman.anggotaId && pinjaman.jumlahPokok > 0) {
                const pinjamanValidation = validatePositiveValue(pinjaman.jumlahPokok, `Pinjaman Anggota #${index + 1}`);
                if (!pinjamanValidation.isValid) {
                    errors.push(pinjamanValidation.message);
                }
            }
        });
    }
    
    if (errors.length > 0) {
        showAlert(errors.join('\n'), 'danger');
        return false;
    }
    
    return true;
}

/**
 * Validasi balance double-entry (Debit = Kredit)
 * @param {Array} entries - Array of journal entries dengan format {akun, debit, kredit}
 * @returns {Object} - {isValid: boolean, totalDebit: number, totalKredit: number, selisih: number, message: string}
 */
function validateBalance(entries) {
    if (!entries || !Array.isArray(entries)) {
        return {
            isValid: false,
            totalDebit: 0,
            totalKredit: 0,
            selisih: 0,
            message: 'Entries harus berupa array'
        };
    }
    
    const totalDebit = entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
    const totalKredit = entries.reduce((sum, entry) => sum + (entry.kredit || 0), 0);
    const selisih = totalDebit - totalKredit;
    
    // Toleransi untuk floating point (0.01)
    const isValid = Math.abs(selisih) < 0.01;
    
    return {
        isValid,
        totalDebit,
        totalKredit,
        selisih,
        message: isValid 
            ? 'Balance valid: Total Debit = Total Kredit' 
            : `Balance tidak valid. Selisih: ${formatRupiah(Math.abs(selisih))}`
    };
}

/**
 * Validasi tanggal periode unik (tidak duplikat)
 * @param {string} tanggalMulai - Tanggal mulai periode dalam format ISO
 * @returns {Object} - {isValid: boolean, message: string}
 */
function validateUniquePeriodDate(tanggalMulai) {
    if (!tanggalMulai) {
        return {
            isValid: false,
            message: 'Tanggal mulai periode harus diisi'
        };
    }
    
    const saldoAwalPeriode = JSON.parse(localStorage.getItem('saldoAwalPeriode') || 'null');
    
    // Jika belum ada periode sebelumnya, tanggal valid
    if (!saldoAwalPeriode) {
        return {
            isValid: true,
            message: 'Tanggal periode valid'
        };
    }
    
    // Cek apakah tanggal sudah digunakan
    if (saldoAwalPeriode.tanggalMulai === tanggalMulai) {
        return {
            isValid: false,
            message: 'Periode dengan tanggal ini sudah ada'
        };
    }
    
    return {
        isValid: true,
        message: 'Tanggal periode valid'
    };
}

/**
 * Validasi nilai positif untuk input saldo
 * @param {number} nilai - Nilai yang akan divalidasi
 * @param {string} namaField - Nama field untuk pesan error
 * @returns {Object} - {isValid: boolean, message: string}
 */
function validatePositiveValue(nilai, namaField = 'Nilai') {
    if (nilai === null || nilai === undefined) {
        return {
            isValid: false,
            message: `${namaField} harus diisi`
        };
    }
    
    const nilaiNum = parseFloat(nilai);
    
    if (isNaN(nilaiNum)) {
        return {
            isValid: false,
            message: `${namaField} harus berupa angka`
        };
    }
    
    if (nilaiNum < 0) {
        return {
            isValid: false,
            message: `${namaField} tidak boleh negatif`
        };
    }
    
    return {
        isValid: true,
        message: `${namaField} valid`
    };
}

/**
 * Validasi persamaan akuntansi (Aset = Kewajiban + Modal)
 * @param {Array} coa - Array Chart of Accounts
 * @returns {Object} - {isValid: boolean, totalAset: number, totalKewajiban: number, totalModal: number, selisih: number, message: string}
 */
function validateAccountingEquation(coa) {
    if (!coa || !Array.isArray(coa)) {
        return {
            isValid: false,
            totalAset: 0,
            totalKewajiban: 0,
            totalModal: 0,
            selisih: 0,
            message: 'COA harus berupa array'
        };
    }
    
    const totalAset = coa
        .filter(akun => akun.tipe === 'Aset')
        .reduce((sum, akun) => sum + (akun.saldo || 0), 0);
    
    const totalKewajiban = coa
        .filter(akun => akun.tipe === 'Kewajiban')
        .reduce((sum, akun) => sum + (akun.saldo || 0), 0);
    
    const totalModal = coa
        .filter(akun => akun.tipe === 'Modal')
        .reduce((sum, akun) => sum + (akun.saldo || 0), 0);
    
    const selisih = totalAset - (totalKewajiban + totalModal);
    
    // Toleransi untuk floating point (0.01)
    const isValid = Math.abs(selisih) < 0.01;
    
    return {
        isValid,
        totalAset,
        totalKewajiban,
        totalModal,
        selisih,
        message: isValid 
            ? 'Persamaan akuntansi terpenuhi: Aset = Kewajiban + Modal' 
            : `Persamaan akuntansi tidak terpenuhi. Selisih: ${formatRupiah(Math.abs(selisih))}`
    };
}

/**
 * Validasi semua input saldo awal sebelum disimpan
 * @param {Object} data - Data saldo awal dari wizardState
 * @returns {Object} - {isValid: boolean, errors: Array}
 */
function validateSaldoAwalData(data) {
    const errors = [];
    
    // Validasi tanggal periode (skip jika edit mode)
    if (!wizardState.isEditMode) {
        const dateValidation = validateUniquePeriodDate(data.tanggalMulai);
        if (!dateValidation.isValid) {
            errors.push(dateValidation.message);
        }
    }
    
    // Validasi modal koperasi - hanya tolak nilai negatif
    const modalValidation = validatePositiveValue(data.modalKoperasi, 'Modal Koperasi');
    if (!modalValidation.isValid) {
        errors.push(modalValidation.message);
    }
    
    // Validasi kas
    const kasValidation = validatePositiveValue(data.kas, 'Saldo Kas');
    if (!kasValidation.isValid) {
        errors.push(kasValidation.message);
    }
    
    // Validasi bank
    const bankValidation = validatePositiveValue(data.bank, 'Saldo Bank');
    if (!bankValidation.isValid) {
        errors.push(bankValidation.message);
    }
    
    // Validasi piutang anggota
    data.piutangAnggota.forEach((piutang, index) => {
        const piutangValidation = validatePositiveValue(piutang.jumlah, `Piutang Anggota #${index + 1}`);
        if (!piutangValidation.isValid) {
            errors.push(piutangValidation.message);
        }
    });
    
    // Validasi hutang supplier
    data.hutangSupplier.forEach((hutang, index) => {
        const hutangValidation = validatePositiveValue(hutang.jumlah, `Hutang Supplier #${index + 1}`);
        if (!hutangValidation.isValid) {
            errors.push(hutangValidation.message);
        }
    });
    
    // Validasi persediaan
    data.persediaan.forEach((item, index) => {
        const stokValidation = validatePositiveValue(item.stok, `Stok ${item.namaBarang}`);
        if (!stokValidation.isValid) {
            errors.push(stokValidation.message);
        }
    });
    
    // Validasi simpanan anggota
    data.simpananAnggota.forEach((simpanan, index) => {
        const pokokValidation = validatePositiveValue(simpanan.simpananPokok, `Simpanan Pokok ${simpanan.nama}`);
        if (!pokokValidation.isValid) {
            errors.push(pokokValidation.message);
        }
        
        const wajibValidation = validatePositiveValue(simpanan.simpananWajib, `Simpanan Wajib ${simpanan.nama}`);
        if (!wajibValidation.isValid) {
            errors.push(wajibValidation.message);
        }
        
        const sukarelaValidation = validatePositiveValue(simpanan.simpananSukarela, `Simpanan Sukarela ${simpanan.nama}`);
        if (!sukarelaValidation.isValid) {
            errors.push(sukarelaValidation.message);
        }
    });
    
    // Validasi pinjaman anggota
    data.pinjamanAnggota.forEach((pinjaman, index) => {
        const pinjamanValidation = validatePositiveValue(pinjaman.jumlahPokok, `Pinjaman Anggota #${index + 1}`);
        if (!pinjamanValidation.isValid) {
            errors.push(pinjamanValidation.message);
        }
    });
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Generate jurnal koreksi berdasarkan selisih antara saldo lama dan baru
 * @param {Object} oldSaldoAwal - Data saldo awal lama
 * @param {Object} newSaldoAwal - Data saldo awal baru
 * @returns {Array} - Array of journal entries untuk koreksi
 */
function generateJurnalKoreksi(oldSaldoAwal, newSaldoAwal) {
    const entries = [];
    
    // Helper function untuk menambahkan entry koreksi
    const addKoreksiEntry = (akun, oldValue, newValue) => {
        const selisih = newValue - oldValue;
        
        if (Math.abs(selisih) < 0.01) {
            return; // Tidak ada perubahan signifikan
        }
        
        // Untuk akun Aset: jika naik -> debit, jika turun -> kredit
        // Untuk akun Kewajiban/Modal: jika naik -> kredit, jika turun -> debit
        const coa = JSON.parse(localStorage.getItem('coa') || '[]');
        const akunData = coa.find(a => a.kode === akun);
        
        if (!akunData) return;
        
        if (akunData.tipe === 'Aset') {
            if (selisih > 0) {
                // Aset naik: Debit Aset, Kredit Modal
                entries.push({ akun: akun, debit: selisih, kredit: 0 });
                entries.push({ akun: '3-1000', debit: 0, kredit: selisih });
            } else {
                // Aset turun: Kredit Aset, Debit Modal
                entries.push({ akun: akun, debit: 0, kredit: Math.abs(selisih) });
                entries.push({ akun: '3-1000', debit: Math.abs(selisih), kredit: 0 });
            }
        } else if (akunData.tipe === 'Kewajiban' || akunData.tipe === 'Modal') {
            if (selisih > 0) {
                // Kewajiban/Modal naik: Debit Modal, Kredit Kewajiban/Modal
                entries.push({ akun: '3-1000', debit: selisih, kredit: 0 });
                entries.push({ akun: akun, debit: 0, kredit: selisih });
            } else {
                // Kewajiban/Modal turun: Kredit Modal, Debit Kewajiban/Modal
                entries.push({ akun: '3-1000', debit: 0, kredit: Math.abs(selisih) });
                entries.push({ akun: akun, debit: Math.abs(selisih), kredit: 0 });
            }
        }
    };
    
    // 1. Koreksi Kas
    addKoreksiEntry('1-1000', oldSaldoAwal.kas || 0, newSaldoAwal.kas || 0);
    
    // 2. Koreksi Bank
    addKoreksiEntry('1-1100', oldSaldoAwal.bank || 0, newSaldoAwal.bank || 0);
    
    // 3. Koreksi Piutang Anggota
    const oldTotalPiutang = (oldSaldoAwal.piutangAnggota || []).reduce((sum, p) => sum + (p.jumlah || 0), 0);
    const newTotalPiutang = (newSaldoAwal.piutangAnggota || []).reduce((sum, p) => sum + (p.jumlah || 0), 0);
    addKoreksiEntry('1-1200', oldTotalPiutang, newTotalPiutang);
    
    // 4. Koreksi Persediaan
    const oldTotalPersediaan = (oldSaldoAwal.persediaan || []).reduce((sum, p) => sum + (p.stok * p.hpp), 0);
    const newTotalPersediaan = (newSaldoAwal.persediaan || []).reduce((sum, p) => sum + (p.stok * p.hpp), 0);
    addKoreksiEntry('1-1300', oldTotalPersediaan, newTotalPersediaan);
    
    // 5. Koreksi Piutang Pinjaman
    const oldTotalPinjaman = (oldSaldoAwal.pinjamanAnggota || []).reduce((sum, p) => sum + (p.jumlahPokok || 0), 0);
    const newTotalPinjaman = (newSaldoAwal.pinjamanAnggota || []).reduce((sum, p) => sum + (p.jumlahPokok || 0), 0);
    addKoreksiEntry('1-1400', oldTotalPinjaman, newTotalPinjaman);
    
    // 6. Koreksi Hutang Supplier
    const oldTotalHutang = (oldSaldoAwal.hutangSupplier || []).reduce((sum, h) => sum + (h.jumlah || 0), 0);
    const newTotalHutang = (newSaldoAwal.hutangSupplier || []).reduce((sum, h) => sum + (h.jumlah || 0), 0);
    addKoreksiEntry('2-1000', oldTotalHutang, newTotalHutang);
    
    // 7. Koreksi Simpanan Pokok
    const oldTotalSimpananPokok = (oldSaldoAwal.simpananAnggota || []).reduce((sum, s) => sum + (s.simpananPokok || 0), 0);
    const newTotalSimpananPokok = (newSaldoAwal.simpananAnggota || []).reduce((sum, s) => sum + (s.simpananPokok || 0), 0);
    addKoreksiEntry('2-1100', oldTotalSimpananPokok, newTotalSimpananPokok);
    
    // 8. Koreksi Simpanan Wajib
    const oldTotalSimpananWajib = (oldSaldoAwal.simpananAnggota || []).reduce((sum, s) => sum + (s.simpananWajib || 0), 0);
    const newTotalSimpananWajib = (newSaldoAwal.simpananAnggota || []).reduce((sum, s) => sum + (s.simpananWajib || 0), 0);
    addKoreksiEntry('2-1200', oldTotalSimpananWajib, newTotalSimpananWajib);
    
    // 9. Koreksi Simpanan Sukarela
    const oldTotalSimpananSukarela = (oldSaldoAwal.simpananAnggota || []).reduce((sum, s) => sum + (s.simpananSukarela || 0), 0);
    const newTotalSimpananSukarela = (newSaldoAwal.simpananAnggota || []).reduce((sum, s) => sum + (s.simpananSukarela || 0), 0);
    addKoreksiEntry('2-1300', oldTotalSimpananSukarela, newTotalSimpananSukarela);
    
    // 10. Koreksi Modal Koperasi
    addKoreksiEntry('3-1000', oldSaldoAwal.modalKoperasi || 0, newSaldoAwal.modalKoperasi || 0);
    
    return entries;
}

/**
 * Generate jurnal pembuka dari data saldo awal
 * @param {Object} saldoAwalData - Data saldo awal dari wizardState
 * @returns {Array} - Array of journal entries dengan format {akun, debit, kredit}
 */
function generateJurnalPembuka(saldoAwalData) {
    const entries = [];
    
    // 1. Modal Koperasi: Debit Kas, Kredit Modal Koperasi
    // Catat jurnal bahkan jika nilai 0 untuk audit trail
    if (saldoAwalData.modalKoperasi >= 0) {
        entries.push({
            akun: '1-1000', // Kas
            debit: saldoAwalData.modalKoperasi,
            kredit: 0
        });
        entries.push({
            akun: '3-1000', // Modal Koperasi
            debit: 0,
            kredit: saldoAwalData.modalKoperasi
        });
    }
    
    // 2. Kas: Debit Kas, Kredit Modal (jika ada saldo kas tambahan selain modal)
    if (saldoAwalData.kas > 0 && saldoAwalData.kas !== saldoAwalData.modalKoperasi) {
        const selisihKas = saldoAwalData.kas - saldoAwalData.modalKoperasi;
        if (selisihKas > 0) {
            entries.push({
                akun: '1-1000', // Kas
                debit: selisihKas,
                kredit: 0
            });
            entries.push({
                akun: '3-1000', // Modal Koperasi
                debit: 0,
                kredit: selisihKas
            });
        }
    }
    
    // 3. Bank: Debit Bank, Kredit Modal
    if (saldoAwalData.bank > 0) {
        entries.push({
            akun: '1-1100', // Bank
            debit: saldoAwalData.bank,
            kredit: 0
        });
        entries.push({
            akun: '3-1000', // Modal Koperasi
            debit: 0,
            kredit: saldoAwalData.bank
        });
    }
    
    // 4. Piutang Anggota: Debit Piutang Anggota, Kredit Modal
    const totalPiutang = saldoAwalData.piutangAnggota.reduce((sum, p) => sum + (p.jumlah || 0), 0);
    if (totalPiutang > 0) {
        entries.push({
            akun: '1-1200', // Piutang Anggota
            debit: totalPiutang,
            kredit: 0
        });
        entries.push({
            akun: '3-1000', // Modal Koperasi
            debit: 0,
            kredit: totalPiutang
        });
    }
    
    // 5. Persediaan: Debit Persediaan Barang, Kredit Modal
    const totalPersediaan = saldoAwalData.persediaan.reduce((sum, p) => sum + (p.stok * p.hpp), 0);
    if (totalPersediaan > 0) {
        entries.push({
            akun: '1-1300', // Persediaan Barang
            debit: totalPersediaan,
            kredit: 0
        });
        entries.push({
            akun: '3-1000', // Modal Koperasi
            debit: 0,
            kredit: totalPersediaan
        });
    }
    
    // 6. Pinjaman Anggota: Debit Piutang Pinjaman, Kredit Modal
    const totalPinjaman = saldoAwalData.pinjamanAnggota.reduce((sum, p) => sum + (p.jumlahPokok || 0), 0);
    if (totalPinjaman > 0) {
        // Cek apakah akun Piutang Pinjaman sudah ada di COA
        const coa = JSON.parse(localStorage.getItem('coa') || '[]');
        let akunPiutangPinjaman = coa.find(a => a.kode === '1-1400');
        
        // Jika belum ada, buat akun baru
        if (!akunPiutangPinjaman) {
            coa.push({
                kode: '1-1400',
                nama: 'Piutang Pinjaman',
                tipe: 'Aset',
                saldo: 0
            });
            localStorage.setItem('coa', JSON.stringify(coa));
        }
        
        entries.push({
            akun: '1-1400', // Piutang Pinjaman
            debit: totalPinjaman,
            kredit: 0
        });
        entries.push({
            akun: '3-1000', // Modal Koperasi
            debit: 0,
            kredit: totalPinjaman
        });
    }
    
    // 7. Hutang Supplier: Debit Modal, Kredit Hutang Supplier
    const totalHutang = saldoAwalData.hutangSupplier.reduce((sum, h) => sum + (h.jumlah || 0), 0);
    if (totalHutang > 0) {
        entries.push({
            akun: '3-1000', // Modal Koperasi
            debit: totalHutang,
            kredit: 0
        });
        entries.push({
            akun: '2-1000', // Hutang Supplier
            debit: 0,
            kredit: totalHutang
        });
    }
    
    // 8. Simpanan Anggota: Debit Modal, Kredit Simpanan (Pokok, Wajib, Sukarela)
    const totalSimpananPokok = saldoAwalData.simpananAnggota.reduce((sum, s) => sum + (s.simpananPokok || 0), 0);
    const totalSimpananWajib = saldoAwalData.simpananAnggota.reduce((sum, s) => sum + (s.simpananWajib || 0), 0);
    const totalSimpananSukarela = saldoAwalData.simpananAnggota.reduce((sum, s) => sum + (s.simpananSukarela || 0), 0);
    
    if (totalSimpananPokok > 0) {
        entries.push({
            akun: '3-1000', // Modal Koperasi
            debit: totalSimpananPokok,
            kredit: 0
        });
        entries.push({
            akun: '2-1100', // Simpanan Pokok
            debit: 0,
            kredit: totalSimpananPokok
        });
    }
    
    if (totalSimpananWajib > 0) {
        entries.push({
            akun: '3-1000', // Modal Koperasi
            debit: totalSimpananWajib,
            kredit: 0
        });
        entries.push({
            akun: '2-1200', // Simpanan Wajib
            debit: 0,
            kredit: totalSimpananWajib
        });
    }
    
    if (totalSimpananSukarela > 0) {
        entries.push({
            akun: '3-1000', // Modal Koperasi
            debit: totalSimpananSukarela,
            kredit: 0
        });
        entries.push({
            akun: '2-1300', // Simpanan Sukarela
            debit: 0,
            kredit: totalSimpananSukarela
        });
    }
    
    return entries;
}

/**
 * Simpan saldo awal ke localStorage dan catat jurnal pembuka
 * Jika dalam mode edit, akan generate jurnal koreksi
 */
function saveSaldoAwal() {
    // Validasi data sebelum menyimpan
    const validation = validateSaldoAwalData(wizardState.data);
    
    if (!validation.isValid) {
        showAlert('Validasi gagal:\n' + validation.errors.join('\n'), 'danger');
        return;
    }
    
    // Cek apakah ini mode edit atau create baru
    const isEditMode = wizardState.isEditMode === true;
    
    if (isEditMode) {
        // Mode edit: Generate jurnal koreksi
        const alasanKoreksi = prompt('Masukkan alasan koreksi saldo awal:');
        
        if (!alasanKoreksi || alasanKoreksi.trim() === '') {
            showAlert('Alasan koreksi harus diisi', 'warning');
            return;
        }
        
        // Generate jurnal koreksi berdasarkan selisih
        const jurnalKoreksi = generateJurnalKoreksi(wizardState.oldSaldoAwal, wizardState.data);
        
        // Validasi balance jurnal koreksi
        const balanceValidation = validateBalance(jurnalKoreksi);
        if (!balanceValidation.isValid) {
            showAlert(balanceValidation.message, 'danger');
            return;
        }
        
        // Simpan jurnal koreksi menggunakan addJurnal()
        if (jurnalKoreksi.length > 0) {
            addJurnal(`Koreksi Saldo Awal - ${alasanKoreksi}`, jurnalKoreksi, new Date().toISOString());
        }
    } else {
        // Mode create: Generate jurnal pembuka
        const jurnalEntries = generateJurnalPembuka(wizardState.data);
        
        // Validasi balance jurnal
        const balanceValidation = validateBalance(jurnalEntries);
        if (!balanceValidation.isValid) {
            showAlert(balanceValidation.message, 'danger');
            return;
        }
        
        // Simpan jurnal pembuka menggunakan addJurnal()
        addJurnal('Saldo Awal Periode', jurnalEntries, wizardState.data.tanggalMulai);
    }
    
    // Update field saldo pada akun-akun di COA
    const coa = JSON.parse(localStorage.getItem('coa') || '[]');
    
    // Update saldo Kas
    const akunKas = coa.find(a => a.kode === '1-1000');
    if (akunKas) {
        akunKas.saldo = wizardState.data.kas;
    }
    
    // Update saldo Bank
    const akunBank = coa.find(a => a.kode === '1-1100');
    if (akunBank) {
        akunBank.saldo = wizardState.data.bank;
    }
    
    // Update saldo Piutang Anggota
    const totalPiutang = wizardState.data.piutangAnggota.reduce((sum, p) => sum + (p.jumlah || 0), 0);
    const akunPiutang = coa.find(a => a.kode === '1-1200');
    if (akunPiutang) {
        akunPiutang.saldo = totalPiutang;
    }
    
    // Update saldo Persediaan Barang
    const totalPersediaan = wizardState.data.persediaan.reduce((sum, p) => sum + (p.stok * p.hpp), 0);
    const akunPersediaan = coa.find(a => a.kode === '1-1300');
    if (akunPersediaan) {
        akunPersediaan.saldo = totalPersediaan;
    }
    
    // Update saldo Piutang Pinjaman
    const totalPinjaman = wizardState.data.pinjamanAnggota.reduce((sum, p) => sum + (p.jumlahPokok || 0), 0);
    const akunPiutangPinjaman = coa.find(a => a.kode === '1-1400');
    if (akunPiutangPinjaman) {
        akunPiutangPinjaman.saldo = totalPinjaman;
    }
    
    // Update saldo Hutang Supplier
    const totalHutang = wizardState.data.hutangSupplier.reduce((sum, h) => sum + (h.jumlah || 0), 0);
    const akunHutang = coa.find(a => a.kode === '2-1000');
    if (akunHutang) {
        akunHutang.saldo = totalHutang;
    }
    
    // Update saldo Simpanan
    const totalSimpananPokok = wizardState.data.simpananAnggota.reduce((sum, s) => sum + (s.simpananPokok || 0), 0);
    const totalSimpananWajib = wizardState.data.simpananAnggota.reduce((sum, s) => sum + (s.simpananWajib || 0), 0);
    const totalSimpananSukarela = wizardState.data.simpananAnggota.reduce((sum, s) => sum + (s.simpananSukarela || 0), 0);
    
    const akunSimpananPokok = coa.find(a => a.kode === '2-1100');
    if (akunSimpananPokok) {
        akunSimpananPokok.saldo = totalSimpananPokok;
    }
    
    const akunSimpananWajib = coa.find(a => a.kode === '2-1200');
    if (akunSimpananWajib) {
        akunSimpananWajib.saldo = totalSimpananWajib;
    }
    
    const akunSimpananSukarela = coa.find(a => a.kode === '2-1300');
    if (akunSimpananSukarela) {
        akunSimpananSukarela.saldo = totalSimpananSukarela;
    }
    
    // Update saldo Modal Koperasi
    const akunModal = coa.find(a => a.kode === '3-1000');
    if (akunModal) {
        akunModal.saldo = wizardState.data.modalKoperasi;
    }
    
    // Simpan COA yang sudah diupdate
    localStorage.setItem('coa', JSON.stringify(coa));
    
    // Update field stok pada array produk
    const barang = JSON.parse(localStorage.getItem('barang') || '[]');
    wizardState.data.persediaan.forEach(item => {
        const produk = barang.find(b => b.id === item.barangId);
        if (produk) {
            produk.stok = item.stok;
        }
    });
    localStorage.setItem('barang', JSON.stringify(barang));
    
    // Update field simpanan pada array anggota
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    wizardState.data.simpananAnggota.forEach(item => {
        const member = anggota.find(a => a.id === item.anggotaId);
        if (member) {
            member.simpananPokok = item.simpananPokok;
            member.simpananWajib = item.simpananWajib;
            member.simpananSukarela = item.simpananSukarela;
        }
    });
    localStorage.setItem('anggota', JSON.stringify(anggota));
    
    // Simpan detail piutang awal
    localStorage.setItem('piutangAwal', JSON.stringify(wizardState.data.piutangAnggota));
    
    // Simpan detail hutang awal
    localStorage.setItem('hutangAwal', JSON.stringify(wizardState.data.hutangSupplier));
    
    // Simpan pinjaman anggota ke array pinjaman
    const pinjaman = JSON.parse(localStorage.getItem('pinjaman') || '[]');
    wizardState.data.pinjamanAnggota.forEach(item => {
        if (item.anggotaId && item.jumlahPokok > 0) {
            const anggotaData = anggota.find(a => a.id === item.anggotaId);
            pinjaman.push({
                id: generateId(),
                anggotaId: item.anggotaId,
                nik: anggotaData ? anggotaData.nik : '',
                nama: anggotaData ? anggotaData.nama : '',
                jumlahPokok: item.jumlahPokok,
                bunga: item.bunga,
                tenor: item.tenor,
                tanggalPinjam: wizardState.data.tanggalMulai,
                tanggalJatuhTempo: item.tanggalJatuhTempo,
                status: 'Aktif',
                sisaPokok: item.jumlahPokok
            });
        }
    });
    localStorage.setItem('pinjaman', JSON.stringify(pinjaman));
    
    // Simpan objek saldo awal periode
    const saldoAwalPeriode = {
        id: generateId(),
        tanggalMulai: wizardState.data.tanggalMulai,
        tanggalSelesai: '',
        status: 'aktif',
        createdAt: new Date().toISOString(),
        createdBy: currentUser ? currentUser.id : 'system',
        locked: false,
        
        kas: wizardState.data.kas,
        bank: wizardState.data.bank,
        piutangAnggota: wizardState.data.piutangAnggota,
        hutangSupplier: wizardState.data.hutangSupplier,
        persediaan: wizardState.data.persediaan,
        simpananAnggota: wizardState.data.simpananAnggota,
        pinjamanAnggota: wizardState.data.pinjamanAnggota,
        modalKoperasi: wizardState.data.modalKoperasi,
        
        totalAset: wizardState.data.kas + wizardState.data.bank + totalPiutang + totalPersediaan + totalPinjaman,
        totalKewajiban: totalHutang + totalSimpananPokok + totalSimpananWajib + totalSimpananSukarela,
        totalModal: wizardState.data.modalKoperasi,
        balance: true
    };
    
    localStorage.setItem('saldoAwalPeriode', JSON.stringify(saldoAwalPeriode));
    localStorage.setItem('periodeAktif', 'true');
    
    // Update modal awal di objek koperasi
    const koperasi = JSON.parse(localStorage.getItem('koperasi') || '{}');
    koperasi.modalAwal = wizardState.data.modalKoperasi;
    localStorage.setItem('koperasi', JSON.stringify(koperasi));
    
    // Validasi persamaan akuntansi setelah penyimpanan
    const accountingValidation = validateAccountingEquation(coa);
    
    // Reset edit mode flags
    wizardState.isEditMode = false;
    wizardState.oldSaldoAwal = null;
    
    showAlert(isEditMode ? 'Saldo awal periode berhasil diupdate! Jurnal koreksi telah dicatat.' : 'Saldo awal periode berhasil disimpan!', 'success');
    
    // Kembali ke halaman utama
    renderSaldoAwal();
}

/**
 * Menampilkan ringkasan saldo awal periode
 * Fungsi ini menampilkan halaman ringkasan dengan:
 * - Tanggal periode dan status (aktif/tutup)
 * - Total aset, kewajiban, dan modal dari COA
 * - Rincian per kategori akun
 * - Indikator balance (✓ Balance / ✗ Tidak Balance)
 * - Tombol aksi (Simpan, Batal)
 */
function showRingkasanSaldoAwal() {
    const content = document.getElementById('mainContent');
    const saldoAwalPeriode = JSON.parse(localStorage.getItem('saldoAwalPeriode') || 'null');
    const coa = JSON.parse(localStorage.getItem('coa') || '[]');
    
    if (!saldoAwalPeriode) {
        showAlert('Belum ada data saldo awal periode', 'warning');
        renderSaldoAwal();
        return;
    }
    
    // Hitung total per kategori dari COA
    const totalAset = coa.filter(a => a.tipe === 'Aset').reduce((sum, a) => sum + (a.saldo || 0), 0);
    const totalKewajiban = coa.filter(a => a.tipe === 'Kewajiban').reduce((sum, a) => sum + (a.saldo || 0), 0);
    const totalModal = coa.filter(a => a.tipe === 'Modal').reduce((sum, a) => sum + (a.saldo || 0), 0);
    
    // Validasi persamaan akuntansi
    const accountingValidation = validateAccountingEquation(coa);
    const isBalance = accountingValidation.isValid;
    
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 style="color: #2d6a4f; font-weight: 700;">
                <i class="bi bi-file-earmark-text me-2"></i>Ringkasan Saldo Awal Periode
            </h2>
            <button class="btn btn-secondary" onclick="renderSaldoAwal()">
                <i class="bi bi-arrow-left me-2"></i>Kembali
            </button>
        </div>
        
        <!-- Informasi Periode -->
        <div class="card mb-4">
            <div class="card-header" style="background: linear-gradient(135deg, #2d6a4f 0%, #40916c 100%); color: white;">
                <h5 class="mb-0">
                    <i class="bi bi-info-circle me-2"></i>Informasi Periode
                </h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <table class="table table-borderless mb-0">
                            <tr>
                                <td width="40%"><strong>Tanggal Mulai:</strong></td>
                                <td>${formatDate(saldoAwalPeriode.tanggalMulai)}</td>
                            </tr>
                            <tr>
                                <td><strong>Status Periode:</strong></td>
                                <td>
                                    <span class="badge ${saldoAwalPeriode.status === 'aktif' ? 'bg-success' : 'bg-secondary'}">
                                        ${saldoAwalPeriode.status === 'aktif' ? 'Aktif' : 'Tutup'}
                                    </span>
                                </td>
                            </tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <table class="table table-borderless mb-0">
                            <tr>
                                <td width="40%"><strong>Dibuat Pada:</strong></td>
                                <td>${formatDate(saldoAwalPeriode.createdAt)}</td>
                            </tr>
                            <tr>
                                <td><strong>Terkunci:</strong></td>
                                <td>
                                    <span class="badge ${saldoAwalPeriode.locked ? 'bg-danger' : 'bg-success'}">
                                        ${saldoAwalPeriode.locked ? 'Ya' : 'Tidak'}
                                    </span>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Summary Cards -->
        <div class="row mb-4">
            <div class="col-md-4">
                <div class="card" style="border-left: 4px solid #2d6a4f;">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">
                            <i class="bi bi-wallet2 me-1"></i>Total Aset
                        </h6>
                        <h3 style="color: #2d6a4f; font-weight: 700;">${formatRupiah(totalAset)}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card" style="border-left: 4px solid #e63946;">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">
                            <i class="bi bi-credit-card me-1"></i>Total Kewajiban
                        </h6>
                        <h3 style="color: #e63946; font-weight: 700;">${formatRupiah(totalKewajiban)}</h3>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card" style="border-left: 4px solid #457b9d;">
                    <div class="card-body">
                        <h6 class="text-muted mb-2">
                            <i class="bi bi-bank me-1"></i>Total Modal
                        </h6>
                        <h3 style="color: #457b9d; font-weight: 700;">${formatRupiah(totalModal)}</h3>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Balance Indicator -->
        <div class="card mb-4">
            <div class="card-header" style="background: ${isBalance ? '#d4edda' : '#f8d7da'}; color: ${isBalance ? '#155724' : '#721c24'};">
                <div class="d-flex justify-content-between align-items-center">
                    <span>
                        <i class="bi bi-${isBalance ? 'check-circle' : 'exclamation-triangle'} me-2"></i>
                        <strong>Validasi Persamaan Akuntansi</strong>
                    </span>
                    <span class="badge ${isBalance ? 'bg-success' : 'bg-danger'}" style="font-size: 1rem;">
                        ${isBalance ? '✓ Balance' : '✗ Tidak Balance'}
                    </span>
                </div>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-8">
                        <p class="mb-1"><strong>Persamaan Akuntansi:</strong></p>
                        <p class="mb-0" style="font-size: 1.1rem;">
                            Aset = Kewajiban + Modal
                        </p>
                        <p class="mb-0" style="font-size: 1.1rem;">
                            ${formatRupiah(totalAset)} = ${formatRupiah(totalKewajiban)} + ${formatRupiah(totalModal)}
                        </p>
                        <p class="mb-0" style="font-size: 1.1rem;">
                            ${formatRupiah(totalAset)} = ${formatRupiah(totalKewajiban + totalModal)}
                        </p>
                    </div>
                    <div class="col-md-4 text-end">
                        ${!isBalance ? `
                            <p class="text-danger mb-0">
                                <strong>Selisih:</strong><br>
                                <span style="font-size: 1.2rem;">${formatRupiah(Math.abs(accountingValidation.selisih))}</span>
                            </p>
                            <small class="text-muted">Perlu dilakukan koreksi</small>
                        ` : `
                            <p class="text-success mb-0">
                                <i class="bi bi-check-circle" style="font-size: 3rem;"></i>
                            </p>
                        `}
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Rincian Per Kategori -->
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="mb-0">
                    <i class="bi bi-list-ul me-2"></i>Rincian Per Kategori Akun
                </h5>
            </div>
            <div class="card-body">
                <div class="row">
                    <!-- Aset -->
                    <div class="col-md-4 mb-3">
                        <h6 class="text-muted mb-3">
                            <i class="bi bi-wallet2 me-1"></i>Aset
                        </h6>
                        ${renderRincianAkun(coa, 'Aset')}
                    </div>
                    
                    <!-- Kewajiban -->
                    <div class="col-md-4 mb-3">
                        <h6 class="text-muted mb-3">
                            <i class="bi bi-credit-card me-1"></i>Kewajiban
                        </h6>
                        ${renderRincianAkun(coa, 'Kewajiban')}
                    </div>
                    
                    <!-- Modal -->
                    <div class="col-md-4 mb-3">
                        <h6 class="text-muted mb-3">
                            <i class="bi bi-bank me-1"></i>Modal
                        </h6>
                        ${renderRincianAkun(coa, 'Modal')}
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Tombol Aksi -->
        <div class="card">
            <div class="card-body">
                <div class="d-flex justify-content-between">
                    <button class="btn btn-secondary" onclick="renderSaldoAwal()">
                        <i class="bi bi-x-circle me-2"></i>Batal
                    </button>
                    <div>
                        <button class="btn btn-info me-2" onclick="exportSaldoAwal()">
                            <i class="bi bi-download me-2"></i>Export CSV
                        </button>
                        <button class="btn btn-warning me-2" onclick="editSaldoAwal()">
                            <i class="bi bi-pencil me-2"></i>Edit
                        </button>
                        ${isBalance ? `
                            <button class="btn btn-success" onclick="confirmSaldoAwal()">
                                <i class="bi bi-check-circle me-2"></i>Konfirmasi & Simpan
                            </button>
                        ` : `
                            <button class="btn btn-danger" disabled title="Neraca harus balance sebelum disimpan">
                                <i class="bi bi-exclamation-triangle me-2"></i>Tidak Dapat Disimpan
                            </button>
                        `}
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render rincian akun per kategori
 */
function renderRincianAkun(coa, tipe) {
    const akun = coa.filter(a => a.tipe === tipe && a.saldo > 0);
    
    if (akun.length === 0) {
        return `<p class="text-muted small">Tidak ada saldo</p>`;
    }
    
    let html = '<div class="list-group list-group-flush">';
    akun.forEach(a => {
        html += `
            <div class="list-group-item px-0 py-2">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <small class="text-muted">${a.kode}</small><br>
                        <span>${a.nama}</span>
                    </div>
                    <strong>${formatRupiah(a.saldo)}</strong>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    return html;
}

/**
 * Konfirmasi dan simpan saldo awal (untuk finalisasi)
 */
function confirmSaldoAwal() {
    if (confirm('Apakah Anda yakin ingin mengkonfirmasi saldo awal periode ini? Data akan dikunci dan tidak dapat diubah langsung.')) {
        const saldoAwalPeriode = JSON.parse(localStorage.getItem('saldoAwalPeriode') || 'null');
        if (saldoAwalPeriode) {
            saldoAwalPeriode.locked = true;
            localStorage.setItem('saldoAwalPeriode', JSON.stringify(saldoAwalPeriode));
            showAlert('Saldo awal periode berhasil dikonfirmasi dan dikunci!', 'success');
            renderSaldoAwal();
        }
    }
}

/**
 * Edit saldo awal periode
 * Implementasi fitur edit dan koreksi saldo awal dengan:
 * - Cek apakah periode sudah dikunci
 * - Warning dan konfirmasi untuk periode yang sudah dikunci
 * - Perhitungan selisih antara saldo lama dan baru
 * - Generate jurnal koreksi dengan keterangan "Koreksi Saldo Awal"
 * - Update saldo akun melalui mekanisme addJurnal()
 */
function editSaldoAwal() {
    const saldoAwalPeriode = JSON.parse(localStorage.getItem('saldoAwalPeriode') || 'null');
    const periodeAktif = localStorage.getItem('periodeAktif') === 'true';
    
    if (!saldoAwalPeriode) {
        showAlert('Belum ada data saldo awal periode untuk diedit', 'warning');
        return;
    }
    
    // Cek apakah periode sudah dikunci
    if (saldoAwalPeriode.locked) {
        const confirmUnlock = confirm(
            'PERINGATAN: Periode sudah dikunci!\n\n' +
            'Mengubah saldo awal periode yang sudah dikunci dapat mempengaruhi laporan keuangan yang sudah dibuat.\n\n' +
            'Perubahan akan dicatat sebagai jurnal koreksi untuk menjaga audit trail.\n\n' +
            'Apakah Anda yakin ingin melanjutkan?'
        );
        
        if (!confirmUnlock) {
            return;
        }
    }
    
    // Load data saldo awal ke wizard state untuk editing
    wizardState.currentStep = 1;
    wizardState.data = {
        tanggalMulai: saldoAwalPeriode.tanggalMulai,
        modalKoperasi: saldoAwalPeriode.modalKoperasi || 0,
        kas: saldoAwalPeriode.kas || 0,
        bank: saldoAwalPeriode.bank || 0,
        persediaan: saldoAwalPeriode.persediaan || [],
        piutangAnggota: saldoAwalPeriode.piutangAnggota || [],
        hutangSupplier: saldoAwalPeriode.hutangSupplier || [],
        simpananAnggota: saldoAwalPeriode.simpananAnggota || [],
        pinjamanAnggota: saldoAwalPeriode.pinjamanAnggota || []
    };
    
    // Set flag bahwa ini adalah mode edit
    wizardState.isEditMode = true;
    wizardState.oldSaldoAwal = JSON.parse(JSON.stringify(saldoAwalPeriode));
    
    renderWizardForm();
}

/**
 * Export saldo awal ke CSV
 * Format: kode akun, nama akun, tipe, saldo
 */
function exportSaldoAwal() {
    try {
        // Ambil data COA dari localStorage
        const coa = JSON.parse(localStorage.getItem('coa') || '[]');
        
        // Filter hanya akun yang memiliki saldo awal (saldo > 0)
        const akunDenganSaldo = coa.filter(akun => akun.saldo && akun.saldo > 0);
        
        if (akunDenganSaldo.length === 0) {
            showAlert('Tidak ada akun dengan saldo awal untuk diekspor', 'warning');
            return;
        }
        
        // Buat header CSV
        const csvHeader = 'Kode Akun,Nama Akun,Tipe,Saldo\n';
        
        // Buat rows CSV
        const csvRows = akunDenganSaldo.map(akun => {
            // Escape nilai yang mengandung koma dengan quotes
            const kode = akun.kode || '';
            const nama = akun.nama ? `"${akun.nama.replace(/"/g, '""')}"` : '';
            const tipe = akun.tipe || '';
            const saldo = akun.saldo || 0;
            
            return `${kode},${nama},${tipe},${saldo}`;
        }).join('\n');
        
        // Gabungkan header dan rows
        const csvContent = csvHeader + csvRows;
        
        // Buat Blob dari CSV content
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        
        // Buat link download
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        // Ambil tanggal periode untuk nama file
        const saldoAwalPeriode = JSON.parse(localStorage.getItem('saldoAwalPeriode') || 'null');
        const tanggal = saldoAwalPeriode && saldoAwalPeriode.tanggalMulai 
            ? new Date(saldoAwalPeriode.tanggalMulai).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];
        
        const fileName = `saldo_awal_periode_${tanggal}.csv`;
        
        // Set atribut link dan trigger download
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Cleanup URL object
        URL.revokeObjectURL(url);
        
        showAlert(`File CSV berhasil diekspor: ${fileName}`, 'success');
        
    } catch (error) {
        console.error('Error exporting CSV:', error);
        showAlert('Gagal mengekspor file CSV: ' + error.message, 'danger');
    }
}

/**
 * Import saldo awal dari CSV/Excel
 * Implementasi fitur import dengan:
 * - Upload file interface
 * - Validasi format file dan struktur kolom (kode akun, nama akun, tipe, saldo)
 * - Preview data sebelum import
 * - Proses setiap baris dan update saldo di COA
 * - Generate jurnal pembuka dari data import menggunakan addJurnal()
 * - Tampilkan ringkasan hasil import (berhasil/gagal)
 * - Tampilkan daftar error dengan detail (baris dan alasan)
 */
function importSaldoAwal() {
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 style="color: #2d6a4f; font-weight: 700;">
                <i class="bi bi-upload me-2"></i>Import Saldo Awal Periode
            </h2>
            <button class="btn btn-secondary" onclick="renderSaldoAwal()">
                <i class="bi bi-arrow-left me-2"></i>Kembali
            </button>
        </div>
        
        <div class="card mb-4">
            <div class="card-header" style="background: linear-gradient(135deg, #2d6a4f 0%, #40916c 100%); color: white;">
                <h5 class="mb-0">
                    <i class="bi bi-info-circle me-2"></i>Panduan Import
                </h5>
            </div>
            <div class="card-body">
                <h6>Format File CSV/Excel:</h6>
                <ul>
                    <li>File harus berformat CSV (Comma Separated Values) atau Excel (.xlsx)</li>
                    <li>Baris pertama harus berisi header: <code>Kode Akun,Nama Akun,Tipe,Saldo</code></li>
                    <li>Kolom <strong>Kode Akun</strong>: Kode akun yang ada di COA (contoh: 1-1000, 2-1100)</li>
                    <li>Kolom <strong>Nama Akun</strong>: Nama akun (opsional, untuk referensi)</li>
                    <li>Kolom <strong>Tipe</strong>: Tipe akun (Aset, Kewajiban, Modal)</li>
                    <li>Kolom <strong>Saldo</strong>: Nilai saldo awal (harus angka positif)</li>
                </ul>
                
                <h6 class="mt-3">Contoh Format:</h6>
                <pre class="bg-light p-3 rounded">Kode Akun,Nama Akun,Tipe,Saldo
1-1000,Kas,Aset,5000000
1-1100,Bank,Aset,10000000
2-1000,Hutang Supplier,Kewajiban,2000000
3-1000,Modal Koperasi,Modal,13000000</pre>
                
                <div class="alert alert-warning mt-3">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <strong>Perhatian:</strong> Import akan mengganti saldo awal yang sudah ada. Pastikan data sudah benar sebelum melakukan import.
                </div>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">
                    <i class="bi bi-file-earmark-arrow-up me-2"></i>Upload File
                </h5>
            </div>
            <div class="card-body">
                <div class="mb-3">
                    <label for="fileImport" class="form-label">Pilih File CSV/Excel</label>
                    <input type="file" class="form-control" id="fileImport" 
                           accept=".csv,.xlsx,.xls" 
                           onchange="handleFileSelect(event)">
                    <small class="text-muted">Format yang didukung: CSV, Excel (.xlsx, .xls)</small>
                </div>
                
                <div id="previewContainer" style="display: none;">
                    <h6 class="mb-3">Preview Data:</h6>
                    <div class="table-responsive mb-3">
                        <table class="table table-bordered" id="previewTable">
                            <thead class="table-light">
                                <tr>
                                    <th>Baris</th>
                                    <th>Kode Akun</th>
                                    <th>Nama Akun</th>
                                    <th>Tipe</th>
                                    <th>Saldo</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody id="previewTableBody">
                            </tbody>
                        </table>
                    </div>
                    
                    <div id="validationSummary" class="mb-3"></div>
                    
                    <div class="d-flex justify-content-between">
                        <button class="btn btn-secondary" onclick="cancelImport()">
                            <i class="bi bi-x-circle me-2"></i>Batal
                        </button>
                        <button class="btn btn-primary" id="btnConfirmImport" onclick="confirmImport()" disabled>
                            <i class="bi bi-check-circle me-2"></i>Konfirmasi Import
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * State untuk menyimpan data import sementara
 */
let importState = {
    rawData: [],
    validData: [],
    errors: [],
    fileName: ''
};

/**
 * Handle file select event
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    
    if (!file) {
        return;
    }
    
    importState.fileName = file.name;
    
    // Validasi tipe file
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (fileExtension === 'csv') {
        readCSVFile(file);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        showAlert('Import Excel belum didukung. Silakan convert ke CSV terlebih dahulu.', 'warning');
        event.target.value = '';
    } else {
        showAlert('Format file tidak didukung. Gunakan file CSV.', 'danger');
        event.target.value = '';
    }
}

/**
 * Read CSV file menggunakan FileReader API
 */
function readCSVFile(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const csvContent = e.target.result;
            parseCSVContent(csvContent);
        } catch (error) {
            console.error('Error reading CSV:', error);
            showAlert('Gagal membaca file CSV: ' + error.message, 'danger');
        }
    };
    
    reader.onerror = function() {
        showAlert('Gagal membaca file. Silakan coba lagi.', 'danger');
    };
    
    reader.readAsText(file);
}

/**
 * Parse CSV content dan validasi data
 */
function parseCSVContent(csvContent) {
    try {
        // Split by newline
        const lines = csvContent.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length < 2) {
            showAlert('File CSV kosong atau tidak memiliki data', 'danger');
            return;
        }
        
        // Parse header
        const header = parseCSVLine(lines[0]);
        
        // Validasi header
        const expectedHeaders = ['kode akun', 'nama akun', 'tipe', 'saldo'];
        const normalizedHeader = header.map(h => h.toLowerCase().trim());
        
        const hasValidHeader = expectedHeaders.every(expected => 
            normalizedHeader.some(h => h.includes(expected.replace(' ', '')))
        );
        
        if (!hasValidHeader) {
            showAlert(
                'Format header tidak valid. Header harus berisi: Kode Akun, Nama Akun, Tipe, Saldo',
                'danger'
            );
            return;
        }
        
        // Parse data rows
        importState.rawData = [];
        importState.validData = [];
        importState.errors = [];
        
        const coa = JSON.parse(localStorage.getItem('coa') || '[]');
        
        for (let i = 1; i < lines.length; i++) {
            const lineNumber = i + 1;
            const columns = parseCSVLine(lines[i]);
            
            if (columns.length < 4) {
                importState.errors.push({
                    line: lineNumber,
                    reason: 'Jumlah kolom tidak lengkap'
                });
                continue;
            }
            
            const kodeAkun = columns[0].trim();
            const namaAkun = columns[1].trim();
            const tipe = columns[2].trim();
            const saldoStr = columns[3].trim();
            
            // Validasi kode akun
            const akun = coa.find(a => a.kode === kodeAkun);
            if (!akun) {
                importState.errors.push({
                    line: lineNumber,
                    kodeAkun,
                    namaAkun,
                    tipe,
                    saldo: saldoStr,
                    reason: `Kode akun ${kodeAkun} tidak ditemukan di COA`
                });
                continue;
            }
            
            // Validasi saldo
            const saldo = parseFloat(saldoStr);
            if (isNaN(saldo)) {
                importState.errors.push({
                    line: lineNumber,
                    kodeAkun,
                    namaAkun,
                    tipe,
                    saldo: saldoStr,
                    reason: 'Saldo harus berupa angka'
                });
                continue;
            }
            
            if (saldo < 0) {
                importState.errors.push({
                    line: lineNumber,
                    kodeAkun,
                    namaAkun,
                    tipe,
                    saldo: saldoStr,
                    reason: 'Saldo tidak boleh negatif'
                });
                continue;
            }
            
            // Validasi tipe akun
            if (!['Aset', 'Kewajiban', 'Modal'].includes(tipe)) {
                importState.errors.push({
                    line: lineNumber,
                    kodeAkun,
                    namaAkun,
                    tipe,
                    saldo: saldoStr,
                    reason: 'Tipe akun harus Aset, Kewajiban, atau Modal'
                });
                continue;
            }
            
            // Data valid
            importState.validData.push({
                line: lineNumber,
                kodeAkun,
                namaAkun,
                tipe,
                saldo,
                akun
            });
        }
        
        // Tampilkan preview
        displayImportPreview();
        
    } catch (error) {
        console.error('Error parsing CSV:', error);
        showAlert('Gagal memproses file CSV: ' + error.message, 'danger');
    }
}

/**
 * Parse single CSV line (handle quoted values)
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Escaped quote
                current += '"';
                i++;
            } else {
                // Toggle quotes
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // End of field
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    // Add last field
    result.push(current);
    
    return result;
}

/**
 * Display import preview
 */
function displayImportPreview() {
    const previewContainer = document.getElementById('previewContainer');
    const previewTableBody = document.getElementById('previewTableBody');
    const validationSummary = document.getElementById('validationSummary');
    const btnConfirmImport = document.getElementById('btnConfirmImport');
    
    // Show preview container
    previewContainer.style.display = 'block';
    
    // Clear previous preview
    previewTableBody.innerHTML = '';
    
    // Display valid data
    importState.validData.forEach(data => {
        const row = document.createElement('tr');
        row.className = 'table-success';
        row.innerHTML = `
            <td>${data.line}</td>
            <td>${data.kodeAkun}</td>
            <td>${data.namaAkun}</td>
            <td>${data.tipe}</td>
            <td>${formatRupiah(data.saldo)}</td>
            <td><span class="badge bg-success">Valid</span></td>
        `;
        previewTableBody.appendChild(row);
    });
    
    // Display errors
    importState.errors.forEach(error => {
        const row = document.createElement('tr');
        row.className = 'table-danger';
        row.innerHTML = `
            <td>${error.line}</td>
            <td>${error.kodeAkun || '-'}</td>
            <td>${error.namaAkun || '-'}</td>
            <td>${error.tipe || '-'}</td>
            <td>${error.saldo || '-'}</td>
            <td><span class="badge bg-danger">Error: ${error.reason}</span></td>
        `;
        previewTableBody.appendChild(row);
    });
    
    // Display summary
    const totalRows = importState.validData.length + importState.errors.length;
    const validCount = importState.validData.length;
    const errorCount = importState.errors.length;
    
    validationSummary.innerHTML = `
        <div class="alert ${errorCount > 0 ? 'alert-warning' : 'alert-success'}">
            <h6 class="mb-2">Ringkasan Validasi:</h6>
            <ul class="mb-0">
                <li>Total baris data: ${totalRows}</li>
                <li>Data valid: ${validCount}</li>
                <li>Data error: ${errorCount}</li>
            </ul>
            ${errorCount > 0 ? `
                <hr>
                <p class="mb-0 small">
                    <i class="bi bi-exclamation-triangle me-1"></i>
                    Baris dengan error akan diabaikan saat import. Hanya data valid yang akan diproses.
                </p>
            ` : ''}
        </div>
    `;
    
    // Enable/disable confirm button
    if (validCount > 0) {
        btnConfirmImport.disabled = false;
    } else {
        btnConfirmImport.disabled = true;
        showAlert('Tidak ada data valid untuk diimport', 'warning');
    }
}

/**
 * Cancel import
 */
function cancelImport() {
    importState = {
        rawData: [],
        validData: [],
        errors: [],
        fileName: ''
    };
    
    renderSaldoAwal();
}

/**
 * Confirm and process import
 */
function confirmImport() {
    if (importState.validData.length === 0) {
        showAlert('Tidak ada data valid untuk diimport', 'warning');
        return;
    }
    
    try {
        // Get COA from localStorage
        const coa = JSON.parse(localStorage.getItem('coa') || '[]');
        
        // Update saldo for each valid data
        const jurnalEntries = [];
        let successCount = 0;
        
        importState.validData.forEach(data => {
            const akun = coa.find(a => a.kode === data.kodeAkun);
            
            if (akun) {
                // Update saldo in COA
                akun.saldo = data.saldo;
                successCount++;
                
                // Create journal entries based on account type
                if (data.tipe === 'Aset') {
                    // Debit Aset, Kredit Modal
                    jurnalEntries.push({
                        akun: data.kodeAkun,
                        debit: data.saldo,
                        kredit: 0
                    });
                    jurnalEntries.push({
                        akun: '3-1000', // Modal Koperasi
                        debit: 0,
                        kredit: data.saldo
                    });
                } else if (data.tipe === 'Kewajiban') {
                    // Debit Modal, Kredit Kewajiban
                    jurnalEntries.push({
                        akun: '3-1000', // Modal Koperasi
                        debit: data.saldo,
                        kredit: 0
                    });
                    jurnalEntries.push({
                        akun: data.kodeAkun,
                        debit: 0,
                        kredit: data.saldo
                    });
                } else if (data.tipe === 'Modal') {
                    // For Modal accounts, we don't create entries
                    // Just update the saldo
                }
            }
        });
        
        // Save updated COA
        localStorage.setItem('coa', JSON.stringify(coa));
        
        // Validate balance before creating journal
        const balanceValidation = validateBalance(jurnalEntries);
        
        if (!balanceValidation.isValid) {
            showAlert(
                'Import berhasil memperbarui COA, tetapi jurnal tidak balance. ' +
                'Silakan periksa data dan lakukan koreksi manual.\n' +
                balanceValidation.message,
                'warning'
            );
        } else {
            // Create journal entry using addJurnal()
            if (jurnalEntries.length > 0) {
                addJurnal('Saldo Awal Periode - Import dari ' + importState.fileName, jurnalEntries, new Date().toISOString());
            }
        }
        
        // Create or update saldo awal periode object
        const saldoAwalPeriode = {
            id: generateId(),
            tanggalMulai: new Date().toISOString().split('T')[0],
            tanggalSelesai: '',
            status: 'aktif',
            createdAt: new Date().toISOString(),
            createdBy: currentUser ? currentUser.id : 'system',
            locked: false,
            
            // Calculate totals from COA
            totalAset: coa.filter(a => a.tipe === 'Aset').reduce((sum, a) => sum + (a.saldo || 0), 0),
            totalKewajiban: coa.filter(a => a.tipe === 'Kewajiban').reduce((sum, a) => sum + (a.saldo || 0), 0),
            totalModal: coa.filter(a => a.tipe === 'Modal').reduce((sum, a) => sum + (a.saldo || 0), 0),
            balance: true
        };
        
        localStorage.setItem('saldoAwalPeriode', JSON.stringify(saldoAwalPeriode));
        localStorage.setItem('periodeAktif', 'true');
        
        // Show success message
        showAlert(
            `Import berhasil!\n` +
            `- Data berhasil diimport: ${successCount}\n` +
            `- Data error (diabaikan): ${importState.errors.length}\n` +
            `- Jurnal pembuka telah dicatat`,
            'success'
        );
        
        // Reset import state
        importState = {
            rawData: [],
            validData: [],
            errors: [],
            fileName: ''
        };
        
        // Return to main page
        renderSaldoAwal();
        
    } catch (error) {
        console.error('Error processing import:', error);
        showAlert('Gagal memproses import: ' + error.message, 'danger');
    }
}

// ============================================
// Helper Functions untuk Render Rows
// ============================================

/**
 * Render rows untuk piutang anggota
 */
function renderPiutangRows() {
    if (wizardState.data.piutangAnggota.length === 0) {
        return `
            <tr>
                <td colspan="4" class="text-center text-muted">
                    <i class="bi bi-inbox me-2"></i>Belum ada data piutang
                </td>
            </tr>
        `;
    }
    
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    
    return wizardState.data.piutangAnggota.map((piutang, index) => {
        const anggotaData = anggota.find(a => a.id === piutang.anggotaId);
        return `
            <tr>
                <td>
                    <select class="form-select form-select-sm" 
                            onchange="updatePiutangAnggota(${index}, 'anggotaId', this.value)">
                        <option value="">Pilih Anggota</option>
                        ${anggota.map(a => `
                            <option value="${a.id}" ${piutang.anggotaId === a.id ? 'selected' : ''}>
                                ${a.nama}
                            </option>
                        `).join('')}
                    </select>
                </td>
                <td>${anggotaData ? anggotaData.nik : '-'}</td>
                <td>
                    <input type="number" class="form-control form-control-sm" 
                           value="${piutang.jumlah}"
                           onchange="updatePiutangAnggota(${index}, 'jumlah', parseFloat(this.value) || 0)"
                           min="0" step="1000">
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="removePiutangRow(${index})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Render rows untuk hutang supplier
 */
function renderHutangRows() {
    if (wizardState.data.hutangSupplier.length === 0) {
        return `
            <tr>
                <td colspan="3" class="text-center text-muted">
                    <i class="bi bi-inbox me-2"></i>Belum ada data hutang
                </td>
            </tr>
        `;
    }
    
    return wizardState.data.hutangSupplier.map((hutang, index) => `
        <tr>
            <td>
                <input type="text" class="form-control form-control-sm" 
                       value="${hutang.namaSupplier}"
                       onchange="updateHutangSupplier(${index}, 'namaSupplier', this.value)"
                       placeholder="Nama Supplier">
            </td>
            <td>
                <input type="number" class="form-control form-control-sm" 
                       value="${hutang.jumlah}"
                       onchange="updateHutangSupplier(${index}, 'jumlah', parseFloat(this.value) || 0)"
                       min="0" step="1000">
            </td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="removeHutangRow(${index})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Render rows untuk persediaan barang
 */
function renderPersediaanRows(barang) {
    // Initialize persediaan data jika belum ada
    if (wizardState.data.persediaan.length === 0) {
        wizardState.data.persediaan = barang.map(b => ({
            barangId: b.id,
            namaBarang: b.nama,
            hpp: b.hargaBeli || 0,
            stok: 0,
            total: 0
        }));
    }
    
    return wizardState.data.persediaan.map((item, index) => {
        const total = item.stok * item.hpp;
        return `
            <tr>
                <td>${item.namaBarang}</td>
                <td>${formatRupiah(item.hpp)}</td>
                <td>
                    <input type="number" class="form-control form-control-sm" 
                           value="${item.stok}"
                           onchange="updatePersediaanStok(${index}, parseFloat(this.value) || 0)"
                           min="0" step="1">
                </td>
                <td><strong>${formatRupiah(total)}</strong></td>
            </tr>
        `;
    }).join('');
}

/**
 * Render rows untuk simpanan anggota
 */
function renderSimpananRows(anggota) {
    // Initialize simpanan data jika belum ada
    if (wizardState.data.simpananAnggota.length === 0) {
        wizardState.data.simpananAnggota = anggota.map(a => ({
            anggotaId: a.id,
            nama: a.nama,
            nik: a.nik,
            simpananPokok: 0,
            simpananWajib: 0,
            simpananSukarela: 0
        }));
    }
    
    return wizardState.data.simpananAnggota.map((item, index) => `
        <tr>
            <td>${item.nik}</td>
            <td>${item.nama}</td>
            <td>
                <input type="number" class="form-control form-control-sm" 
                       value="${item.simpananPokok}"
                       onchange="updateSimpananAnggota(${index}, 'simpananPokok', parseFloat(this.value) || 0)"
                       min="0" step="1000">
            </td>
            <td>
                <input type="number" class="form-control form-control-sm" 
                       value="${item.simpananWajib}"
                       onchange="updateSimpananAnggota(${index}, 'simpananWajib', parseFloat(this.value) || 0)"
                       min="0" step="1000">
            </td>
            <td>
                <input type="number" class="form-control form-control-sm" 
                       value="${item.simpananSukarela}"
                       onchange="updateSimpananAnggota(${index}, 'simpananSukarela', parseFloat(this.value) || 0)"
                       min="0" step="1000">
            </td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteSimpananRow('${item.anggotaId}')" title="Hapus">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Render rows untuk pinjaman anggota
 */
function renderPinjamanRows() {
    if (wizardState.data.pinjamanAnggota.length === 0) {
        return `
            <tr>
                <td colspan="6" class="text-center text-muted">
                    <i class="bi bi-inbox me-2"></i>Belum ada data pinjaman
                </td>
            </tr>
        `;
    }
    
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    
    return wizardState.data.pinjamanAnggota.map((pinjaman, index) => `
        <tr>
            <td>
                <select class="form-select form-select-sm" 
                        onchange="updatePinjamanAnggota(${index}, 'anggotaId', this.value)">
                    <option value="">Pilih Anggota</option>
                    ${anggota.map(a => `
                        <option value="${a.id}" ${pinjaman.anggotaId === a.id ? 'selected' : ''}>
                            ${a.nama}
                        </option>
                    `).join('')}
                </select>
            </td>
            <td>
                <input type="number" class="form-control form-control-sm" 
                       value="${pinjaman.jumlahPokok}"
                       onchange="updatePinjamanAnggota(${index}, 'jumlahPokok', parseFloat(this.value) || 0)"
                       min="0" step="1000">
            </td>
            <td>
                <input type="number" class="form-control form-control-sm" 
                       value="${pinjaman.bunga}"
                       onchange="updatePinjamanAnggota(${index}, 'bunga', parseFloat(this.value) || 0)"
                       min="0" max="100" step="0.1">
            </td>
            <td>
                <input type="number" class="form-control form-control-sm" 
                       value="${pinjaman.tenor}"
                       onchange="updatePinjamanAnggota(${index}, 'tenor', parseInt(this.value) || 0)"
                       min="1" max="120">
            </td>
            <td>
                <input type="date" class="form-control form-control-sm" 
                       value="${pinjaman.tanggalJatuhTempo}"
                       onchange="updatePinjamanAnggota(${index}, 'tanggalJatuhTempo', this.value)">
            </td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="removePinjamanRow(${index})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ============================================
// Helper Functions untuk Add/Remove/Update Rows
// ============================================

/**
 * Tambah row piutang
 */
function addPiutangRow() {
    wizardState.data.piutangAnggota.push({
        anggotaId: '',
        nama: '',
        nik: '',
        jumlah: 0
    });
    renderWizardForm();
}

/**
 * Remove row piutang
 */
function removePiutangRow(index) {
    wizardState.data.piutangAnggota.splice(index, 1);
    renderWizardForm();
}

/**
 * Update piutang anggota
 */
function updatePiutangAnggota(index, field, value) {
    wizardState.data.piutangAnggota[index][field] = value;
    
    // Update nama dan NIK jika anggotaId berubah
    if (field === 'anggotaId') {
        const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
        const anggotaData = anggota.find(a => a.id === value);
        if (anggotaData) {
            wizardState.data.piutangAnggota[index].nama = anggotaData.nama;
            wizardState.data.piutangAnggota[index].nik = anggotaData.nik;
        }
    }
    
    renderWizardForm();
}

/**
 * Tambah row hutang
 */
function addHutangRow() {
    wizardState.data.hutangSupplier.push({
        id: generateId(),
        namaSupplier: '',
        jumlah: 0
    });
    renderWizardForm();
}

/**
 * Remove row hutang
 */
function removeHutangRow(index) {
    wizardState.data.hutangSupplier.splice(index, 1);
    renderWizardForm();
}

/**
 * Update hutang supplier
 */
function updateHutangSupplier(index, field, value) {
    wizardState.data.hutangSupplier[index][field] = value;
    renderWizardForm();
}

/**
 * Update stok persediaan
 */
function updatePersediaanStok(index, stok) {
    wizardState.data.persediaan[index].stok = stok;
    wizardState.data.persediaan[index].total = stok * wizardState.data.persediaan[index].hpp;
    renderWizardForm();
}

/**
 * Update simpanan anggota
 */
function updateSimpananAnggota(index, field, value) {
    wizardState.data.simpananAnggota[index][field] = value;
    renderWizardForm();
}

/**
 * Delete simpanan row by anggotaId
 * Hapus data dari wizardState.data.simpananAnggota
 * Update COA
 * Re-render tabel
 * Update total
 * 
 * @param {string} anggotaId - ID anggota yang akan dihapus
 * @returns {void}
 */
function deleteSimpananRow(anggotaId) {
    if (!anggotaId) {
        showAlert('ID anggota tidak valid', 'error');
        return;
    }
    
    // Find index of anggota to delete
    const index = wizardState.data.simpananAnggota.findIndex(item => item.anggotaId === anggotaId);
    
    if (index === -1) {
        showAlert('Data anggota tidak ditemukan', 'error');
        return;
    }
    
    // Get anggota name for confirmation
    const anggotaName = wizardState.data.simpananAnggota[index].nama;
    
    // Confirm deletion
    if (!confirm(`Apakah Anda yakin ingin menghapus data simpanan untuk ${anggotaName}?`)) {
        return;
    }
    
    // Remove the item
    wizardState.data.simpananAnggota.splice(index, 1);
    
    // Update COA
    updateCOAFromSimpanan();
    
    // Re-render tabel
    renderWizardForm();
    
    // Show success message
    showAlert(`Data simpanan ${anggotaName} berhasil dihapus`, 'success');
}

/**
 * Tambah row pinjaman
 */
function addPinjamanRow() {
    wizardState.data.pinjamanAnggota.push({
        anggotaId: '',
        jumlahPokok: 0,
        bunga: 0,
        tenor: 12,
        tanggalJatuhTempo: ''
    });
    renderWizardForm();
}

/**
 * Remove row pinjaman
 */
function removePinjamanRow(index) {
    wizardState.data.pinjamanAnggota.splice(index, 1);
    renderWizardForm();
}

/**
 * Update pinjaman anggota
 */
function updatePinjamanAnggota(index, field, value) {
    wizardState.data.pinjamanAnggota[index][field] = value;
    renderWizardForm();
}

// ============================================
// Helper Functions untuk Kalkulasi Total
// ============================================

/**
 * Hitung total piutang
 */
function calculateTotalPiutang() {
    return wizardState.data.piutangAnggota.reduce((sum, item) => sum + (item.jumlah || 0), 0);
}

/**
 * Hitung total hutang
 */
function calculateTotalHutang() {
    return wizardState.data.hutangSupplier.reduce((sum, item) => sum + (item.jumlah || 0), 0);
}

/**
 * Hitung total persediaan
 */
function calculateTotalPersediaan() {
    return wizardState.data.persediaan.reduce((sum, item) => {
        return sum + (item.stok * item.hpp);
    }, 0);
}

/**
 * Hitung total simpanan pokok
 */
function calculateTotalSimpananPokok() {
    return wizardState.data.simpananAnggota.reduce((sum, item) => sum + (item.simpananPokok || 0), 0);
}

/**
 * Hitung total simpanan wajib
 */
function calculateTotalSimpananWajib() {
    return wizardState.data.simpananAnggota.reduce((sum, item) => sum + (item.simpananWajib || 0), 0);
}

/**
 * Hitung total simpanan sukarela
 */
function calculateTotalSimpananSukarela() {
    return wizardState.data.simpananAnggota.reduce((sum, item) => sum + (item.simpananSukarela || 0), 0);
}

/**
 * Hitung total pinjaman
 */
function calculateTotalPinjaman() {
    return wizardState.data.pinjamanAnggota.reduce((sum, item) => sum + (item.jumlahPokok || 0), 0);
}

/**
 * Update COA dari data simpanan di wizardState
 * Fungsi ini menghitung total simpanan pokok dan wajib dari wizardState.data.simpananAnggota
 * dan memperbarui saldo akun 2-1100 (Simpanan Pokok) dan 2-1200 (Simpanan Wajib) di COA
 * 
 * Fungsi ini dipanggil setiap kali data simpanan berubah untuk menjaga konsistensi
 * antara data simpanan anggota dan saldo akun kewajiban di COA
 * 
 * @returns {void}
 */
function updateCOAFromSimpanan() {
    // Ambil COA dari localStorage
    const coa = JSON.parse(localStorage.getItem('coa') || '[]');
    
    // Hitung total simpanan pokok dari wizardState.data.simpananAnggota
    const totalSimpananPokok = wizardState.data.simpananAnggota.reduce((sum, item) => {
        return sum + (item.simpananPokok || 0);
    }, 0);
    
    // Hitung total simpanan wajib dari wizardState.data.simpananAnggota
    const totalSimpananWajib = wizardState.data.simpananAnggota.reduce((sum, item) => {
        return sum + (item.simpananWajib || 0);
    }, 0);
    
    // Update akun 2-1100 (Simpanan Pokok) di COA
    const akunSimpananPokok = coa.find(a => a.kode === '2-1100');
    if (akunSimpananPokok) {
        akunSimpananPokok.saldo = totalSimpananPokok;
    }
    
    // Update akun 2-1200 (Simpanan Wajib) di COA
    const akunSimpananWajib = coa.find(a => a.kode === '2-1200');
    if (akunSimpananWajib) {
        akunSimpananWajib.saldo = totalSimpananWajib;
    }
    
    // Simpan COA yang sudah diupdate kembali ke localStorage
    localStorage.setItem('coa', JSON.stringify(coa));
}

// ============================================
// Period Locking Mechanism Functions
// ============================================

/**
 * Lock periode saldo awal
 * Mencegah perubahan langsung pada periode yang locked
 * Perubahan hanya bisa dilakukan melalui jurnal koreksi
 */
function lockPeriode() {
    const saldoAwalPeriode = JSON.parse(localStorage.getItem('saldoAwalPeriode') || 'null');
    
    if (!saldoAwalPeriode) {
        showAlert('Belum ada periode saldo awal untuk dikunci', 'warning');
        return;
    }
    
    if (saldoAwalPeriode.locked) {
        showAlert('Periode sudah dalam status terkunci', 'info');
        return;
    }
    
    // Validasi balance sebelum lock
    const coa = JSON.parse(localStorage.getItem('coa') || '[]');
    const accountingValidation = validateAccountingEquation(coa);
    
    if (!accountingValidation.isValid) {
        showAlert(
            'Periode tidak dapat dikunci karena neraca tidak balance.\n' +
            accountingValidation.message,
            'danger'
        );
        return;
    }
    
    const confirmLock = confirm(
        'Apakah Anda yakin ingin mengunci periode ini?\n\n' +
        'Setelah dikunci, perubahan saldo awal hanya dapat dilakukan melalui jurnal koreksi.\n\n' +
        'Klik OK untuk melanjutkan.'
    );
    
    if (!confirmLock) {
        return;
    }
    
    // Lock periode
    saldoAwalPeriode.locked = true;
    saldoAwalPeriode.lockedAt = new Date().toISOString();
    saldoAwalPeriode.lockedBy = currentUser ? currentUser.id : 'system';
    
    localStorage.setItem('saldoAwalPeriode', JSON.stringify(saldoAwalPeriode));
    localStorage.setItem('periodeAktif', 'true');
    
    showAlert('Periode berhasil dikunci! Perubahan hanya dapat dilakukan melalui jurnal koreksi.', 'success');
    renderSaldoAwal();
}

/**
 * Unlock periode saldo awal
 * Membuka kunci periode untuk memungkinkan perubahan langsung
 * Memerlukan konfirmasi dari user
 */
function unlockPeriode() {
    const saldoAwalPeriode = JSON.parse(localStorage.getItem('saldoAwalPeriode') || 'null');
    
    if (!saldoAwalPeriode) {
        showAlert('Belum ada periode saldo awal untuk dibuka kuncinya', 'warning');
        return;
    }
    
    if (!saldoAwalPeriode.locked) {
        showAlert('Periode tidak dalam status terkunci', 'info');
        return;
    }
    
    const confirmUnlock = confirm(
        'PERINGATAN: Membuka kunci periode!\n\n' +
        'Membuka kunci periode akan memungkinkan perubahan langsung pada saldo awal.\n' +
        'Ini dapat mempengaruhi integritas data dan audit trail.\n\n' +
        'Apakah Anda yakin ingin membuka kunci periode ini?\n\n' +
        'Klik OK untuk melanjutkan.'
    );
    
    if (!confirmUnlock) {
        return;
    }
    
    // Unlock periode
    saldoAwalPeriode.locked = false;
    saldoAwalPeriode.unlockedAt = new Date().toISOString();
    saldoAwalPeriode.unlockedBy = currentUser ? currentUser.id : 'system';
    
    localStorage.setItem('saldoAwalPeriode', JSON.stringify(saldoAwalPeriode));
    
    showAlert('Periode berhasil dibuka kuncinya! Anda dapat melakukan perubahan langsung.', 'success');
    renderSaldoAwal();
}

/**
 * Cek apakah periode saat ini terkunci
 * @returns {boolean} - true jika periode terkunci, false jika tidak
 */
function isPeriodeLocked() {
    const saldoAwalPeriode = JSON.parse(localStorage.getItem('saldoAwalPeriode') || 'null');
    
    if (!saldoAwalPeriode) {
        return false;
    }
    
    return saldoAwalPeriode.locked === true;
}

/**
 * Validasi apakah perubahan langsung diizinkan
 * Jika periode locked, hanya izinkan perubahan melalui jurnal koreksi
 * @returns {Object} - {allowed: boolean, message: string}
 */
function validateDirectChange() {
    const saldoAwalPeriode = JSON.parse(localStorage.getItem('saldoAwalPeriode') || 'null');
    
    if (!saldoAwalPeriode) {
        return {
            allowed: true,
            message: 'Belum ada periode, perubahan diizinkan'
        };
    }
    
    if (saldoAwalPeriode.locked) {
        return {
            allowed: false,
            message: 'Periode sudah dikunci. Perubahan hanya dapat dilakukan melalui jurnal koreksi.'
        };
    }
    
    return {
        allowed: true,
        message: 'Perubahan langsung diizinkan'
    };
}

/**
 * Toggle lock/unlock periode
 * Fungsi helper untuk toggle status lock periode
 */
function togglePeriodeLock() {
    const saldoAwalPeriode = JSON.parse(localStorage.getItem('saldoAwalPeriode') || 'null');
    
    if (!saldoAwalPeriode) {
        showAlert('Belum ada periode saldo awal', 'warning');
        return;
    }
    
    if (saldoAwalPeriode.locked) {
        unlockPeriode();
    } else {
        lockPeriode();
    }
}

/**
 * Parse CSV text untuk data simpanan
 * Support multiple delimiters (comma, semicolon, tab)
 * Handle BOM, different line endings, whitespace trimming, empty lines
 * 
 * @param {string} csvText - Text content dari CSV
 * @param {string} type - Tipe simpanan: 'pokok' atau 'wajib'
 * @returns {Object} - {success: boolean, data: Array, errors: Array}
 * 
 * **Feature: upload-simpanan-saldo-awal, Property 5: Validasi format CSV**
 * **Validates: Requirements 3.1, 8.1**
 * 
 * **Feature: upload-simpanan-saldo-awal, Property 24: Parser trim whitespace**
 * **Validates: Requirements 8.4**
 */
function parseCSVSimpanan(csvText, type) {
    const errors = [];
    const data = [];
    
    // Validasi input
    if (!csvText || typeof csvText !== 'string') {
        return {
            success: false,
            data: [],
            errors: ['CSV text harus berupa string yang valid']
        };
    }
    
    if (!type || (type !== 'pokok' && type !== 'wajib')) {
        return {
            success: false,
            data: [],
            errors: ['Type harus "pokok" atau "wajib"']
        };
    }
    
    try {
        // 1. Handle BOM (Byte Order Mark) - remove if present
        let cleanedText = csvText;
        if (cleanedText.charCodeAt(0) === 0xFEFF) {
            cleanedText = cleanedText.slice(1);
        }
        
        // 2. Normalize line endings (CRLF -> LF)
        cleanedText = cleanedText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        // 3. Detect delimiter
        // Count occurrences of each delimiter in first line
        const firstLine = cleanedText.split('\n')[0] || '';
        const commaCount = (firstLine.match(/,/g) || []).length;
        const semicolonCount = (firstLine.match(/;/g) || []).length;
        const tabCount = (firstLine.match(/\t/g) || []).length;
        
        // Choose delimiter with highest count
        let delimiter = ',';
        if (semicolonCount > commaCount && semicolonCount > tabCount) {
            delimiter = ';';
        } else if (tabCount > commaCount && tabCount > semicolonCount) {
            delimiter = '\t';
        }
        
        // 4. Split into lines and filter empty lines
        const lines = cleanedText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        if (lines.length === 0) {
            return {
                success: false,
                data: [],
                errors: ['File CSV kosong']
            };
        }
        
        // 5. Parse header
        const headerLine = lines[0];
        const headers = headerLine
            .split(delimiter)
            .map(h => h.trim());
        
        // 6. Validate header format based on type
        const expectedHeaders = type === 'pokok' 
            ? ['NIK', 'Nama', 'Jumlah', 'Tanggal']
            : ['NIK', 'Nama', 'Jumlah', 'Periode', 'Tanggal'];
        
        // Check if headers match (case-insensitive)
        const headersMatch = headers.length === expectedHeaders.length &&
            headers.every((h, i) => h.toLowerCase() === expectedHeaders[i].toLowerCase());
        
        if (!headersMatch) {
            errors.push(
                `Header CSV tidak sesuai format. ` +
                `Expected: ${expectedHeaders.join(', ')}. ` +
                `Found: ${headers.join(', ')}`
            );
        }
        
        // 7. Parse data rows
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const rowNumber = i + 1;
            
            // Split by delimiter and trim each field
            const fields = line
                .split(delimiter)
                .map(f => f.trim());
            
            // Skip if all fields are empty
            if (fields.every(f => f === '')) {
                continue;
            }
            
            // Parse based on type
            if (type === 'pokok') {
                // Format: NIK, Nama, Jumlah, Tanggal
                if (fields.length < 4) {
                    errors.push(`Baris ${rowNumber}: Jumlah kolom tidak sesuai (expected 4, got ${fields.length})`);
                    continue;
                }
                
                const [nik, nama, jumlahStr, tanggal] = fields;
                
                // Parse jumlah
                const jumlah = parseFloat(jumlahStr);
                
                data.push({
                    nik: nik,
                    nama: nama,
                    jumlah: jumlah,
                    tanggal: tanggal,
                    rowNumber: rowNumber
                });
                
            } else if (type === 'wajib') {
                // Format: NIK, Nama, Jumlah, Periode, Tanggal
                if (fields.length < 5) {
                    errors.push(`Baris ${rowNumber}: Jumlah kolom tidak sesuai (expected 5, got ${fields.length})`);
                    continue;
                }
                
                const [nik, nama, jumlahStr, periode, tanggal] = fields;
                
                // Parse jumlah
                const jumlah = parseFloat(jumlahStr);
                
                data.push({
                    nik: nik,
                    nama: nama,
                    jumlah: jumlah,
                    periode: periode,
                    tanggal: tanggal,
                    rowNumber: rowNumber
                });
            }
        }
        
        // 8. Return result
        return {
            success: errors.length === 0,
            data: data,
            errors: errors
        };
        
    } catch (error) {
        return {
            success: false,
            data: [],
            errors: [`Error parsing CSV: ${error.message}`]
        };
    }
}

/**
 * Validate simpanan data from CSV
 * @param {Array} data - Array of parsed simpanan objects
 * @param {string} type - Type of simpanan: 'pokok' or 'wajib'
 * @returns {Object} - {isValid: boolean, validData: Array, errors: Array}
 */
function validateSimpananData(data, type) {
    if (!data || !Array.isArray(data)) {
        return {
            isValid: false,
            validData: [],
            errors: ['Data harus berupa array']
        };
    }
    
    if (!type || (type !== 'pokok' && type !== 'wajib')) {
        return {
            isValid: false,
            validData: [],
            errors: ['Type harus "pokok" atau "wajib"']
        };
    }
    
    const validData = [];
    const errors = [];
    
    // Get anggota data for NIK validation
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const validNIKs = new Set(anggota.map(a => a.nik));
    
    // Validate each row
    data.forEach((row, index) => {
        const rowNumber = row.rowNumber || (index + 2); // +2 because row 1 is header
        const rowErrors = [];
        
        // Validate NIK (required field)
        if (!row.nik || row.nik.trim() === '') {
            rowErrors.push(`Baris ${rowNumber}, Kolom NIK: NIK tidak boleh kosong`);
        } else if (!validNIKs.has(row.nik)) {
            rowErrors.push(`Baris ${rowNumber}, Kolom NIK: NIK "${row.nik}" tidak ditemukan dalam data anggota`);
        }
        
        // Validate Nama (required field)
        if (!row.nama || row.nama.trim() === '') {
            rowErrors.push(`Baris ${rowNumber}, Kolom Nama: Nama tidak boleh kosong`);
        }
        
        // Validate Jumlah (required field, must be positive or zero)
        if (row.jumlah === undefined || row.jumlah === null || row.jumlah === '') {
            rowErrors.push(`Baris ${rowNumber}, Kolom Jumlah: Jumlah tidak boleh kosong`);
        } else {
            const jumlah = parseFloat(row.jumlah);
            if (isNaN(jumlah)) {
                rowErrors.push(`Baris ${rowNumber}, Kolom Jumlah: Jumlah harus berupa angka`);
            } else if (jumlah < 0) {
                rowErrors.push(`Baris ${rowNumber}, Kolom Jumlah: Jumlah tidak boleh negatif (nilai: ${jumlah})`);
            }
        }
        
        // Validate Tanggal (required field)
        if (!row.tanggal || row.tanggal.trim() === '') {
            rowErrors.push(`Baris ${rowNumber}, Kolom Tanggal: Tanggal tidak boleh kosong`);
        }
        
        // For wajib type, validate Periode (required field)
        if (type === 'wajib') {
            if (!row.periode || row.periode.trim() === '') {
                rowErrors.push(`Baris ${rowNumber}, Kolom Periode: Periode tidak boleh kosong`);
            }
        }
        
        // If no errors for this row, add to validData
        if (rowErrors.length === 0) {
            validData.push(row);
        } else {
            errors.push(...rowErrors);
        }
    });
    
    return {
        isValid: errors.length === 0,
        validData: validData,
        errors: errors
    };
}

/**
 * Merge simpanan data from upload with existing data
 * @param {Array} existingData - Existing simpanan data in wizardState
 * @param {Array} newData - New simpanan data from CSV upload
 * @param {string} mode - Merge mode: 'replace' or 'merge'
 * @returns {Array} - Merged simpanan data
 * 
 * **Feature: upload-simpanan-saldo-awal, Property 14: Merge data upload dengan manual**
 * **Validates: Requirements 5.1**
 * 
 * **Feature: upload-simpanan-saldo-awal, Property 15: Handling duplikasi NIK**
 * **Validates: Requirements 5.2**
 * 
 * **Feature: upload-simpanan-saldo-awal, Property 16: Update data tanpa menghapus data lain**
 * **Validates: Requirements 5.3**
 */
function mergeSimpananData(existingData, newData, mode) {
    // Validate inputs
    if (!Array.isArray(existingData)) {
        existingData = [];
    }
    
    if (!Array.isArray(newData)) {
        return existingData;
    }
    
    if (!mode || (mode !== 'replace' && mode !== 'merge')) {
        mode = 'merge'; // Default to merge mode
    }
    
    // If replace mode, return only new data
    if (mode === 'replace') {
        return newData;
    }
    
    // Merge mode: combine existing and new data
    // Create a map of existing data by NIK for efficient lookup
    const existingMap = new Map();
    existingData.forEach(item => {
        if (item.anggotaId || item.nik) {
            const key = item.anggotaId || item.nik;
            existingMap.set(key, item);
        }
    });
    
    // Process new data: update existing entries or add new ones
    newData.forEach(newItem => {
        const key = newItem.anggotaId || newItem.nik;
        
        if (existingMap.has(key)) {
            // Update existing entry - preserve structure, only update specific fields
            const existing = existingMap.get(key);
            
            // Don't use Object.assign as it overwrites the entire object
            // Instead, selectively update fields while preserving the structure
            // Keep the existing anggotaId, nik, nama, and simpanan fields
            // The actual simpanan values will be updated in importSimpananToWizard
            if (newItem.nama) existing.nama = newItem.nama;
            if (newItem.nik) existing.nik = newItem.nik;
            // Store the uploaded data temporarily for later processing
            existing._uploadedData = newItem;
        } else {
            // Add new entry with proper structure
            const newEntry = {
                anggotaId: key,
                nik: key,
                nama: newItem.nama || '',
                simpananPokok: 0,
                simpananWajib: 0,
                simpananSukarela: 0,
                _uploadedData: newItem
            };
            existingMap.set(key, newEntry);
        }
    });
    
    // Convert map back to array
    return Array.from(existingMap.values());
}

/**
 * Show upload simpanan dialog
 * Menampilkan modal dialog untuk upload simpanan dengan 2 tabs: Upload File dan Paste Data
 * 
 * @param {string} type - Tipe simpanan: 'pokok' atau 'wajib'
 * 
 * **Feature: upload-simpanan-saldo-awal, Property 1: Dialog upload muncul saat tombol diklik**
 * **Validates: Requirements 1.2, 2.2**
 */
function showUploadSimpananDialog(type) {
    // Validate type parameter
    if (type !== 'pokok' && type !== 'wajib') {
        showAlert('Tipe simpanan tidak valid. Gunakan "pokok" atau "wajib"', 'danger');
        return;
    }
    
    const typeLabel = type === 'pokok' ? 'Simpanan Pokok' : 'Simpanan Wajib';
    const templateName = type === 'pokok' ? 'template_simpanan_pokok.csv' : 'template_simpanan_wajib.csv';
    
    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="uploadSimpananModal" tabindex="-1" aria-labelledby="uploadSimpananModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header" style="background: linear-gradient(135deg, #2d6a4f 0%, #40916c 100%); color: white;">
                        <h5 class="modal-title" id="uploadSimpananModalLabel">
                            <i class="bi bi-upload me-2"></i>Upload ${typeLabel}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <!-- Tabs Navigation -->
                        <ul class="nav nav-tabs mb-3" id="uploadTabs" role="tablist">
                            <li class="nav-item" role="presentation">
                                <button class="nav-link active" id="upload-file-tab" data-bs-toggle="tab" data-bs-target="#upload-file" type="button" role="tab" aria-controls="upload-file" aria-selected="true">
                                    <i class="bi bi-file-earmark-arrow-up me-2"></i>Upload File
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="paste-data-tab" data-bs-toggle="tab" data-bs-target="#paste-data" type="button" role="tab" aria-controls="paste-data" aria-selected="false">
                                    <i class="bi bi-clipboard me-2"></i>Paste Data
                                </button>
                            </li>
                        </ul>
                        
                        <!-- Tabs Content -->
                        <div class="tab-content" id="uploadTabsContent">
                            <!-- Upload File Tab -->
                            <div class="tab-pane fade show active" id="upload-file" role="tabpanel" aria-labelledby="upload-file-tab">
                                <div class="mb-3">
                                    <label for="csvFileInput" class="form-label">Pilih File CSV</label>
                                    <input type="file" class="form-control" id="csvFileInput" accept=".csv" onchange="handleSimpananFileSelect(event, '${type}')">
                                    <small class="text-muted">Format yang didukung: CSV (.csv)</small>
                                </div>
                                
                                <div class="alert alert-info">
                                    <h6 class="mb-2"><i class="bi bi-info-circle me-2"></i>Format CSV ${typeLabel}:</h6>
                                    ${type === 'pokok' ? `
                                        <p class="mb-1"><strong>Header:</strong> NIK,Nama,Jumlah,Tanggal</p>
                                        <p class="mb-0"><strong>Contoh:</strong> 3201010101010001,Budi Santoso,1000000,2024-01-01</p>
                                    ` : `
                                        <p class="mb-1"><strong>Header:</strong> NIK,Nama,Jumlah,Periode,Tanggal</p>
                                        <p class="mb-0"><strong>Contoh:</strong> 3201010101010001,Budi Santoso,500000,2024-01,2024-01-15</p>
                                    `}
                                </div>
                                
                                <div class="mb-3">
                                    <button class="btn btn-sm btn-outline-primary" onclick="downloadTemplateSimpanan('${type}')">
                                        <i class="bi bi-download me-2"></i>Download Template CSV
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Paste Data Tab -->
                            <div class="tab-pane fade" id="paste-data" role="tabpanel" aria-labelledby="paste-data-tab">
                                <div class="mb-3">
                                    <label for="pasteDataTextarea" class="form-label">Paste Data dari Excel atau CSV</label>
                                    <textarea class="form-control" id="pasteDataTextarea" rows="10" placeholder="Paste data dari Excel atau CSV di sini..."></textarea>
                                    <small class="text-muted">Anda dapat copy-paste langsung dari Excel atau Google Sheets</small>
                                </div>
                                
                                <div class="alert alert-info">
                                    <h6 class="mb-2"><i class="bi bi-info-circle me-2"></i>Instruksi Paste Data:</h6>
                                    <ul class="mb-0">
                                        <li>Copy data dari Excel atau Google Sheets (termasuk header)</li>
                                        <li>Paste ke textarea di atas</li>
                                        <li>Sistem akan otomatis mendeteksi delimiter (tab, koma, semicolon)</li>
                                        <li>Klik tombol "Preview" untuk melihat hasil parsing</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Preview Container (hidden by default) -->
                        <div id="simpananPreviewContainer" style="display: none;">
                            <hr>
                            <h6 class="mb-3">Preview Data:</h6>
                            <div class="table-responsive mb-3" style="max-height: 400px; overflow-y: auto;">
                                <table class="table table-bordered table-sm" id="simpananPreviewTable">
                                    <thead class="table-light sticky-top">
                                        <tr>
                                            <th>Baris</th>
                                            <th>NIK</th>
                                            <th>Nama</th>
                                            <th>Jumlah</th>
                                            ${type === 'wajib' ? '<th>Periode</th>' : ''}
                                            <th>Tanggal</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody id="simpananPreviewTableBody">
                                    </tbody>
                                </table>
                            </div>
                            
                            <div id="simpananValidationSummary" class="mb-3"></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-2"></i>Cancel
                        </button>
                        <button type="button" class="btn btn-primary" id="btnPreviewSimpanan" onclick="previewSimpananData('${type}')">
                            <i class="bi bi-eye me-2"></i>Preview
                        </button>
                        <button type="button" class="btn btn-success" id="btnImportSimpanan" onclick="importSimpananData('${type}')" style="display: none;">
                            <i class="bi bi-check-circle me-2"></i>Import
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('uploadSimpananModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal using Bootstrap
    const modal = new bootstrap.Modal(document.getElementById('uploadSimpananModal'));
    modal.show();
    
    // Clean up modal on close
    document.getElementById('uploadSimpananModal').addEventListener('hidden.bs.modal', function () {
        this.remove();
    });
}

/**
 * Show preview of simpanan data before import
 * 
 * @param {Array} data - Parsed simpanan data
 * @param {Array} errors - Validation errors
 * @param {string} type - Tipe simpanan: 'pokok' atau 'wajib'
 * 
 * **Feature: upload-simpanan-saldo-awal, Property 2: CSV parsing menghasilkan preview**
 * **Validates: Requirements 1.3, 2.3, 6.1**
 * 
 * **Feature: upload-simpanan-saldo-awal, Property 19: Preview menampilkan jumlah record**
 * **Validates: Requirements 6.2**
 * 
 * **Feature: upload-simpanan-saldo-awal, Property 20: Preview menampilkan total nilai**
 * **Validates: Requirements 6.3**
 * 
 * **Feature: upload-simpanan-saldo-awal, Property 21: Cancel import tidak menyimpan data**
 * **Validates: Requirements 6.5**
 */
function showPreviewSimpanan(data, errors, type) {
    try {
        // Validate inputs
        if (!Array.isArray(data)) {
            showAlert('Data harus berupa array', 'danger');
            return;
        }
        
        if (!Array.isArray(errors)) {
            errors = [];
        }
        
        // Get preview container
        const previewContainer = document.getElementById('simpananPreviewContainer');
        const previewTableBody = document.getElementById('simpananPreviewTableBody');
        const validationSummary = document.getElementById('simpananValidationSummary');
        
        if (!previewContainer || !previewTableBody || !validationSummary) {
            showAlert('Preview container tidak ditemukan', 'danger');
            return;
        }
        
        // Clear previous preview
        previewTableBody.innerHTML = '';
        validationSummary.innerHTML = '';
        
        // Calculate statistics
        const totalRecords = data.length;
        const validRecords = data.filter(row => !row.error).length;
        const errorRecords = data.filter(row => row.error).length;
        const totalNilai = data
            .filter(row => !row.error)
            .reduce((sum, row) => sum + (parseFloat(row.jumlah) || 0), 0);
        
        // Render table rows
        data.forEach((row, index) => {
            const hasError = row.error || false;
            const rowClass = hasError ? 'table-danger' : '';
            
            const tr = document.createElement('tr');
            tr.className = rowClass;
            
            // Baris number
            const tdBaris = document.createElement('td');
            tdBaris.textContent = index + 1;
            tr.appendChild(tdBaris);
            
            // NIK
            const tdNIK = document.createElement('td');
            tdNIK.textContent = row.nik || '';
            tr.appendChild(tdNIK);
            
            // Nama
            const tdNama = document.createElement('td');
            tdNama.textContent = row.nama || '';
            tr.appendChild(tdNama);
            
            // Jumlah
            const tdJumlah = document.createElement('td');
            tdJumlah.textContent = formatRupiah(parseFloat(row.jumlah) || 0);
            tdJumlah.style.textAlign = 'right';
            tr.appendChild(tdJumlah);
            
            // Periode (only for wajib)
            if (type === 'wajib') {
                const tdPeriode = document.createElement('td');
                tdPeriode.textContent = row.periode || '';
                tr.appendChild(tdPeriode);
            }
            
            // Tanggal
            const tdTanggal = document.createElement('td');
            tdTanggal.textContent = row.tanggal || '';
            tr.appendChild(tdTanggal);
            
            // Status
            const tdStatus = document.createElement('td');
            if (hasError) {
                tdStatus.innerHTML = `<span class="badge bg-danger">Error</span><br><small class="text-danger">${row.errorMessage || 'Unknown error'}</small>`;
            } else {
                tdStatus.innerHTML = '<span class="badge bg-success">Valid</span>';
            }
            tr.appendChild(tdStatus);
            
            previewTableBody.appendChild(tr);
        });
        
        // Render validation summary
        let summaryHTML = '<div class="row">';
        
        // Total records
        summaryHTML += `
            <div class="col-md-3">
                <div class="card bg-light">
                    <div class="card-body text-center">
                        <h6 class="text-muted mb-2">Total Record</h6>
                        <h4 style="color: #2d6a4f;">${totalRecords}</h4>
                    </div>
                </div>
            </div>
        `;
        
        // Valid records
        summaryHTML += `
            <div class="col-md-3">
                <div class="card bg-light">
                    <div class="card-body text-center">
                        <h6 class="text-muted mb-2">Record Valid</h6>
                        <h4 style="color: #40916c;">${validRecords}</h4>
                    </div>
                </div>
            </div>
        `;
        
        // Error records
        summaryHTML += `
            <div class="col-md-3">
                <div class="card bg-light">
                    <div class="card-body text-center">
                        <h6 class="text-muted mb-2">Record Error</h6>
                        <h4 style="color: #e63946;">${errorRecords}</h4>
                    </div>
                </div>
            </div>
        `;
        
        // Total nilai
        summaryHTML += `
            <div class="col-md-3">
                <div class="card bg-light">
                    <div class="card-body text-center">
                        <h6 class="text-muted mb-2">Total Nilai</h6>
                        <h4 style="color: #2d6a4f;">${formatRupiah(totalNilai)}</h4>
                    </div>
                </div>
            </div>
        `;
        
        summaryHTML += '</div>';
        
        // Add error summary if there are errors
        if (errorRecords > 0) {
            summaryHTML += `
                <div class="alert alert-warning mt-3">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <strong>Perhatian:</strong> Terdapat ${errorRecords} record dengan error. 
                    Hanya record yang valid yang akan diimport.
                </div>
            `;
        } else {
            summaryHTML += `
                <div class="alert alert-success mt-3">
                    <i class="bi bi-check-circle me-2"></i>
                    <strong>Semua data valid!</strong> Klik tombol "Import" untuk melanjutkan.
                </div>
            `;
        }
        
        validationSummary.innerHTML = summaryHTML;
        
        // Show preview container
        previewContainer.style.display = 'block';
        
        // Show import button, hide preview button
        document.getElementById('btnPreviewSimpanan').style.display = 'none';
        document.getElementById('btnImportSimpanan').style.display = 'inline-block';
        
        // Store data for import
        window.tempSimpananPreviewData = data.filter(row => !row.error);
        window.tempSimpananType = type;
        
    } catch (error) {
        console.error('Error showing preview:', error);
        showAlert('Gagal menampilkan preview: ' + error.message, 'danger');
    }
}

/**
 * Download template CSV untuk simpanan
 * 
 * @param {string} type - Tipe simpanan: 'pokok' atau 'wajib'
 * 
 * **Feature: upload-simpanan-saldo-awal, Property 22: Template CSV dengan header yang benar**
 * **Validates: Requirements 7.2, 7.3**
 * 
 * **Feature: upload-simpanan-saldo-awal, Property 23: Template menyertakan contoh data**
 * **Validates: Requirements 7.4**
 */
function downloadTemplateSimpanan(type) {
    try {
        let csvContent = '';
        let fileName = '';
        
        if (type === 'pokok') {
            // Template untuk Simpanan Pokok
            csvContent = 'NIK,Nama,Jumlah,Tanggal\n';
            csvContent += '3201010101010001,Budi Santoso,1000000,2024-01-01\n';
            fileName = 'template_simpanan_pokok.csv';
        } else if (type === 'wajib') {
            // Template untuk Simpanan Wajib
            csvContent = 'NIK,Nama,Jumlah,Periode,Tanggal\n';
            csvContent += '3201010101010001,Budi Santoso,500000,2024-01,2024-01-15\n';
            fileName = 'template_simpanan_wajib.csv';
        } else {
            showAlert('Tipe simpanan tidak valid', 'danger');
            return;
        }
        
        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        showAlert(`Template CSV berhasil diunduh: ${fileName}`, 'success');
        
    } catch (error) {
        console.error('Error downloading template:', error);
        showAlert('Gagal mengunduh template CSV: ' + error.message, 'danger');
    }
}

/**
 * Handle file select for simpanan upload
 * @param {Event} event - File input change event
 * @param {string} type - Tipe simpanan: 'pokok' atau 'wajib'
 */
function handleSimpananFileSelect(event, type) {
    const file = event.target.files[0];
    
    if (!file) {
        return;
    }
    
    // Validate file type
    const fileExtension = file.name.split('.').pop().toLowerCase();
    
    if (fileExtension !== 'csv') {
        showAlert('Format file tidak didukung. Gunakan file CSV.', 'danger');
        event.target.value = '';
        return;
    }
    
    // Read file
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const csvContent = e.target.result;
            // Store in a temporary variable for preview
            window.tempSimpananCSV = csvContent;
            window.tempSimpananType = type;
            
            // Show preview button
            document.getElementById('btnPreviewSimpanan').style.display = 'inline-block';
            
        } catch (error) {
            console.error('Error reading CSV:', error);
            showAlert('Gagal membaca file CSV: ' + error.message, 'danger');
        }
    };
    
    reader.onerror = function() {
        showAlert('Gagal membaca file. Silakan coba lagi.', 'danger');
    };
    
    reader.readAsText(file);
}

/**
 * Preview simpanan data before import
 * @param {string} type - Tipe simpanan: 'pokok' atau 'wajib'
 */
function previewSimpananData(type) {
    // Get data from file or paste
    let csvContent = '';
    
    // Check if data is from file upload
    if (window.tempSimpananCSV) {
        csvContent = window.tempSimpananCSV;
    } else {
        // Get data from paste textarea
        csvContent = document.getElementById('pasteDataTextarea').value.trim();
    }
    
    if (!csvContent) {
        showAlert('Tidak ada data untuk di-preview. Silakan upload file atau paste data terlebih dahulu.', 'warning');
        return;
    }
    
    // Parse and validate CSV
    const parseResult = parseCSVSimpanan(csvContent, type);
    
    if (!parseResult.success) {
        showAlert('Gagal memparse CSV: ' + parseResult.errors.join(', '), 'danger');
        return;
    }
    
    // Validate data
    const validateResult = validateSimpananData(parseResult.data, type);
    
    // Display preview
    displaySimpananPreview(validateResult.validData, validateResult.errors, type);
    
    // Show import button if there's valid data
    if (validateResult.validData.length > 0) {
        document.getElementById('btnImportSimpanan').style.display = 'inline-block';
        
        // Store validated data for import
        window.tempValidatedSimpananData = validateResult.validData;
    } else {
        document.getElementById('btnImportSimpanan').style.display = 'none';
    }
}

/**
 * Display simpanan preview table
 * @param {Array} validData - Array of valid simpanan data
 * @param {Array} errors - Array of validation errors
 * @param {string} type - Tipe simpanan: 'pokok' atau 'wajib'
 */
function displaySimpananPreview(validData, errors, type) {
    const previewContainer = document.getElementById('simpananPreviewContainer');
    const previewTableBody = document.getElementById('simpananPreviewTableBody');
    const validationSummary = document.getElementById('simpananValidationSummary');
    
    // Show preview container
    previewContainer.style.display = 'block';
    
    // Clear previous preview
    previewTableBody.innerHTML = '';
    
    // Display valid data
    validData.forEach((data, index) => {
        const row = document.createElement('tr');
        row.className = 'table-success';
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${data.nik || data.anggotaId}</td>
            <td>${data.nama}</td>
            <td>${formatRupiah(data.jumlah)}</td>
            ${type === 'wajib' ? `<td>${data.periode || '-'}</td>` : ''}
            <td>${data.tanggal || '-'}</td>
            <td><span class="badge bg-success">Valid</span></td>
        `;
        previewTableBody.appendChild(row);
    });
    
    // Display errors
    errors.forEach(error => {
        const row = document.createElement('tr');
        row.className = 'table-danger';
        row.innerHTML = `
            <td>${error.line}</td>
            <td>${error.nik || '-'}</td>
            <td>${error.nama || '-'}</td>
            <td>${error.jumlah || '-'}</td>
            ${type === 'wajib' ? `<td>${error.periode || '-'}</td>` : ''}
            <td>${error.tanggal || '-'}</td>
            <td><span class="badge bg-danger">Error: ${error.reason}</span></td>
        `;
        previewTableBody.appendChild(row);
    });
    
    // Calculate totals
    const totalRows = validData.length + errors.length;
    const validCount = validData.length;
    const errorCount = errors.length;
    const totalNilai = validData.reduce((sum, data) => sum + (data.jumlah || 0), 0);
    
    // Display summary
    validationSummary.innerHTML = `
        <div class="alert ${errorCount > 0 ? 'alert-warning' : 'alert-success'}">
            <h6 class="mb-2">Ringkasan Validasi:</h6>
            <ul class="mb-0">
                <li>Total baris data: ${totalRows}</li>
                <li>Data valid: ${validCount}</li>
                <li>Data error: ${errorCount}</li>
                <li>Total nilai simpanan: ${formatRupiah(totalNilai)}</li>
            </ul>
            ${errorCount > 0 ? `
                <hr>
                <p class="mb-0 small">
                    <i class="bi bi-exclamation-triangle me-1"></i>
                    Baris dengan error akan diabaikan saat import. Hanya data valid yang akan diproses.
                </p>
            ` : ''}
        </div>
    `;
}

/**
 * Import simpanan data to wizardState
 * **Feature: upload-simpanan-saldo-awal, Property 3: Data tersimpan ke wizardState setelah konfirmasi**
 * **Validates: Requirements 1.4, 2.4**
 * 
 * @param {Array} data - Array of validated simpanan data
 * @param {string} type - Tipe simpanan: 'pokok' atau 'wajib'
 * @returns {Object} - {success: boolean, recordCount: number, totalNilai: number, message: string}
 */
function importSimpananToWizard(data, type) {
    try {
        // Validate inputs
        if (!data || !Array.isArray(data)) {
            return {
                success: false,
                recordCount: 0,
                totalNilai: 0,
                message: 'Data harus berupa array'
            };
        }
        
        if (type !== 'pokok' && type !== 'wajib') {
            return {
                success: false,
                recordCount: 0,
                totalNilai: 0,
                message: 'Tipe simpanan harus "pokok" atau "wajib"'
            };
        }
        
        if (data.length === 0) {
            return {
                success: false,
                recordCount: 0,
                totalNilai: 0,
                message: 'Tidak ada data untuk diimport'
            };
        }
        
        // Check if there's existing data
        const hasExistingData = wizardState.data.simpananAnggota && 
                                wizardState.data.simpananAnggota.length > 0 &&
                                wizardState.data.simpananAnggota.some(s => 
                                    type === 'pokok' ? (s.simpananPokok || 0) > 0 : (s.simpananWajib || 0) > 0
                                );
        
        let mode = 'merge'; // Default mode
        
        // Ask user for mode if there's existing data
        if (hasExistingData) {
            const userChoice = confirm(
                `Sudah ada data simpanan ${type} yang tersimpan.\n\n` +
                `Klik OK untuk MERGE (gabungkan dengan data existing)\n` +
                `Klik Cancel untuk REPLACE (ganti semua data existing)`
            );
            mode = userChoice ? 'merge' : 'replace';
        }
        
        // Merge data with existing data
        const existingData = wizardState.data.simpananAnggota || [];
        const mergedData = mergeSimpananData(existingData, data, mode);
        
        // Update field simpananPokok atau simpananWajib sesuai type
        mergedData.forEach(item => {
            // Check if this item has uploaded data (either from _uploadedData or find in data array)
            const uploadedItem = item._uploadedData || data.find(d => d.nik === (item.anggotaId || item.nik));
            if (uploadedItem) {
                if (type === 'pokok') {
                    item.simpananPokok = uploadedItem.jumlah || 0;
                } else if (type === 'wajib') {
                    item.simpananWajib = uploadedItem.jumlah || 0;
                }
                // Clean up temporary field
                delete item._uploadedData;
            }
        });
        
        // Update wizardState
        wizardState.data.simpananAnggota = mergedData;
        
        // Update COA
        updateCOAFromSimpanan();
        
        // Calculate totals for notification
        const recordCount = data.length;
        const totalNilai = data.reduce((sum, item) => sum + (item.jumlah || 0), 0);
        
        // Trigger re-render Step 6
        if (wizardState.currentStep === 6) {
            renderWizardForm();
        }
        
        // Return success result
        return {
            success: true,
            recordCount: recordCount,
            totalNilai: totalNilai,
            message: `Berhasil import ${recordCount} record dengan total nilai ${formatRupiah(totalNilai)}`
        };
        
    } catch (error) {
        console.error('Error in importSimpananToWizard:', error);
        return {
            success: false,
            recordCount: 0,
            totalNilai: 0,
            message: `Error: ${error.message}`
        };
    }
}

/**
 * Update COA from simpanan data in wizardState
 * **Feature: upload-simpanan-saldo-awal, Property 10: Integrasi dengan COA**
 * **Validates: Requirements 4.1, 4.2**
 */
function updateCOAFromSimpanan() {
    try {
        const coa = JSON.parse(localStorage.getItem('coa') || '[]');
        
        // Calculate totals
        const totalSimpananPokok = wizardState.data.simpananAnggota.reduce((sum, s) => sum + (s.simpananPokok || 0), 0);
        const totalSimpananWajib = wizardState.data.simpananAnggota.reduce((sum, s) => sum + (s.simpananWajib || 0), 0);
        
        // Update akun Simpanan Pokok (2-1100)
        const akunSimpananPokok = coa.find(a => a.kode === '2-1100');
        if (akunSimpananPokok) {
            akunSimpananPokok.saldo = totalSimpananPokok;
        }
        
        // Update akun Simpanan Wajib (2-1200)
        const akunSimpananWajib = coa.find(a => a.kode === '2-1200');
        if (akunSimpananWajib) {
            akunSimpananWajib.saldo = totalSimpananWajib;
        }
        
        // Save updated COA
        localStorage.setItem('coa', JSON.stringify(coa));
        
    } catch (error) {
        console.error('Error in updateCOAFromSimpanan:', error);
    }
}

/**
 * Import simpanan data to wizardState (wrapper function)
 * @param {string} type - Tipe simpanan: 'pokok' atau 'wajib'
 */
function importSimpananData(type) {
    if (!window.tempValidatedSimpananData || window.tempValidatedSimpananData.length === 0) {
        showAlert('Tidak ada data valid untuk diimport', 'warning');
        return;
    }
    
    // Call importSimpananToWizard
    const result = importSimpananToWizard(window.tempValidatedSimpananData, type);
    
    if (result.success) {
        // Show success notification
        showAlert(result.message, 'success');
        
        // Close dialog
        const modal = bootstrap.Modal.getInstance(document.getElementById('uploadSimpananModal'));
        if (modal) {
            modal.hide();
        }
        
        // Clear temp data
        window.tempValidatedSimpananData = null;
    } else {
        // Show error notification
        showAlert(result.message, 'danger');
    }
}

/**
 * Download template CSV untuk simpanan
 * @param {string} type - Tipe simpanan: 'pokok' atau 'wajib'
 * @returns {void}
 */
function downloadTemplateSimpanan(type) {
    try {
        // Validate type
        if (type !== 'pokok' && type !== 'wajib') {
            showAlert('Tipe simpanan harus "pokok" atau "wajib"', 'danger');
            return;
        }
        
        // Generate CSV content based on type
        let csvContent = '';
        let filename = '';
        
        if (type === 'pokok') {
            // Header untuk simpanan pokok: NIK,Nama,Jumlah,Tanggal
            csvContent = 'NIK,Nama,Jumlah,Tanggal\n';
            // Tambahkan 1 baris contoh data
            csvContent += '3201010101010001,Budi Santoso,1000000,2024-01-01\n';
            filename = 'template_simpanan_pokok.csv';
        } else if (type === 'wajib') {
            // Header untuk simpanan wajib: NIK,Nama,Jumlah,Periode,Tanggal
            csvContent = 'NIK,Nama,Jumlah,Periode,Tanggal\n';
            // Tambahkan 1 baris contoh data
            csvContent += '3201010101010001,Budi Santoso,500000,2024-01,2024-01-15\n';
            filename = 'template_simpanan_wajib.csv';
        }
        
        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (navigator.msSaveBlob) {
            // IE 10+
            navigator.msSaveBlob(blob, filename);
        } else {
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        // Show success message
        showAlert(`Template ${type === 'pokok' ? 'Simpanan Pokok' : 'Simpanan Wajib'} berhasil diunduh`, 'success');
        
    } catch (error) {
        console.error('Error in downloadTemplateSimpanan:', error);
        showAlert(`Error: ${error.message}`, 'danger');
    }
}
