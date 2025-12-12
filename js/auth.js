// Authentication Module

document.getElementById('loginForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    handleLogin();
});

function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        // Check if user is active
        if (user.active === false) {
            const errorDiv = document.getElementById('loginError');
            errorDiv.textContent = 'Akun Anda telah dinonaktifkan. Hubungi administrator!';
            errorDiv.classList.remove('d-none');
            return;
        }
        
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        showMainApp();
    } else {
        const errorDiv = document.getElementById('loginError');
        errorDiv.textContent = 'Username atau password salah!';
        errorDiv.classList.remove('d-none');
    }
}

function renderMenu() {
    const menuList = document.getElementById('menuList');
    const role = currentUser.role;
    
    const menus = {
        super_admin: [
            { icon: 'bi-speedometer2', text: 'Dashboard', page: 'dashboard' },
            { icon: 'bi-gear-fill', text: 'Pengaturan Sistem', page: 'system-settings' },
            { icon: 'bi-shield-lock', text: 'Audit Log', page: 'audit-log' },
            { icon: 'bi-building', text: 'Data Koperasi', page: 'koperasi' },
            { icon: 'bi-people', text: 'Master Anggota', page: 'anggota' },
            { icon: 'bi-diagram-3', text: 'Master Departemen', page: 'departemen' },
            { icon: 'bi-credit-card-2-front', text: 'Aktivasi Kartu', page: 'aktivasi-kartu' },
            { icon: 'bi-wallet2', text: 'Simpanan', page: 'simpanan' },
            { icon: 'bi-cash-coin', text: 'Pinjaman', page: 'pinjaman' },
            { icon: 'bi-box-arrow-right', text: 'Anggota Keluar', page: 'anggota-keluar' },
            { icon: 'bi-calendar-check', text: 'Saldo Awal Periode', page: 'saldo-awal' },
            { icon: 'bi-journal-text', text: 'Chart of Account', page: 'coa' },
            { icon: 'bi-book', text: 'Jurnal', page: 'jurnal' },
            { icon: 'bi-calculator', text: 'SHU', page: 'shu' },
            { icon: 'bi-currency-exchange', text: 'Pembayaran Hutang/Piutang', page: 'pembayaran-hutang-piutang' },
            { icon: 'bi-cart', text: 'Point of Sales', page: 'pos' },
            { icon: 'bi-clipboard-check', text: 'Kelola Pengajuan Modal', page: 'kelola-pengajuan-modal' },
            { icon: 'bi-clock-history', text: 'Riwayat Pengajuan Modal', page: 'riwayat-pengajuan-admin' },
            { icon: 'bi-box-seam', text: 'Master Barang', page: 'barang' },
            { icon: 'bi-truck', text: 'Supplier', page: 'supplier' },
            { icon: 'bi-bag-plus', text: 'Pembelian', page: 'pembelian' },
            { icon: 'bi-clipboard-data', text: 'Stok Opname', page: 'stokopname' },
            { icon: 'bi-trash', text: 'Hapus Transaksi', page: 'hapus-transaksi' },
            { icon: 'bi-clock-history', text: 'Riwayat Hapus Transaksi', page: 'riwayat-hapus-transaksi' },
            { icon: 'bi-clock-history', text: 'Riwayat Tutup Kasir', page: 'riwayat-tutup-kas' },
            { icon: 'bi-database', text: 'Backup & Restore', page: 'backup-restore' },
            { icon: 'bi-file-earmark-text', text: 'Laporan', page: 'laporan' },
            { icon: 'bi-file-earmark-bar-graph', text: 'Laporan Transaksi & Simpanan', page: 'laporan-transaksi-simpanan' },
            { icon: 'bi-person-gear', text: 'Manajemen User', page: 'users' },
            { icon: 'bi-info-circle', text: 'Tentang Aplikasi', page: 'tentang' }
        ],
        administrator: [
            { icon: 'bi-speedometer2', text: 'Dashboard', page: 'dashboard' },
            { icon: 'bi-building', text: 'Data Koperasi', page: 'koperasi' },
            { icon: 'bi-people', text: 'Master Anggota', page: 'anggota' },
            { icon: 'bi-diagram-3', text: 'Master Departemen', page: 'departemen' },
            { icon: 'bi-credit-card-2-front', text: 'Aktivasi Kartu', page: 'aktivasi-kartu' },
            { icon: 'bi-wallet2', text: 'Simpanan', page: 'simpanan' },
            { icon: 'bi-cash-coin', text: 'Pinjaman', page: 'pinjaman' },
            { icon: 'bi-box-arrow-right', text: 'Anggota Keluar', page: 'anggota-keluar' },
            { icon: 'bi-calendar-check', text: 'Saldo Awal Periode', page: 'saldo-awal' },
            { icon: 'bi-journal-text', text: 'Chart of Account', page: 'coa' },
            { icon: 'bi-book', text: 'Jurnal', page: 'jurnal' },
            { icon: 'bi-calculator', text: 'SHU', page: 'shu' },
            { icon: 'bi-currency-exchange', text: 'Pembayaran Hutang/Piutang', page: 'pembayaran-hutang-piutang' },
            { icon: 'bi-cart', text: 'Point of Sales', page: 'pos' },
            { icon: 'bi-clipboard-check', text: 'Kelola Pengajuan Modal', page: 'kelola-pengajuan-modal' },
            { icon: 'bi-clock-history', text: 'Riwayat Pengajuan Modal', page: 'riwayat-pengajuan-admin' },
            { icon: 'bi-box-seam', text: 'Master Barang', page: 'barang' },
            { icon: 'bi-truck', text: 'Supplier', page: 'supplier' },
            { icon: 'bi-bag-plus', text: 'Pembelian', page: 'pembelian' },
            { icon: 'bi-clipboard-data', text: 'Stok Opname', page: 'stokopname' },
            { icon: 'bi-trash', text: 'Hapus Transaksi', page: 'hapus-transaksi' },
            { icon: 'bi-clock-history', text: 'Riwayat Hapus Transaksi', page: 'riwayat-hapus-transaksi' },
            { icon: 'bi-clock-history', text: 'Riwayat Tutup Kasir', page: 'riwayat-tutup-kas' },
            { icon: 'bi-database', text: 'Backup & Restore', page: 'backup-restore' },
            { icon: 'bi-file-earmark-text', text: 'Laporan', page: 'laporan' },
            { icon: 'bi-file-earmark-bar-graph', text: 'Laporan Transaksi & Simpanan', page: 'laporan-transaksi-simpanan' },
            { icon: 'bi-person-gear', text: 'Manajemen User', page: 'users' },
            { icon: 'bi-info-circle', text: 'Tentang Aplikasi', page: 'tentang' }
        ],
        keuangan: [
            { icon: 'bi-speedometer2', text: 'Dashboard', page: 'dashboard' },
            { icon: 'bi-people', text: 'Master Anggota', page: 'anggota' },
            { icon: 'bi-wallet2', text: 'Simpanan', page: 'simpanan' },
            { icon: 'bi-cash-coin', text: 'Pinjaman', page: 'pinjaman' },
            { icon: 'bi-calendar-check', text: 'Saldo Awal Periode', page: 'saldo-awal' },
            { icon: 'bi-journal-text', text: 'Chart of Account', page: 'coa' },
            { icon: 'bi-book', text: 'Jurnal', page: 'jurnal' },
            { icon: 'bi-calculator', text: 'SHU', page: 'shu' },
            { icon: 'bi-file-earmark-text', text: 'Laporan Keuangan', page: 'laporan' },
            { icon: 'bi-info-circle', text: 'Tentang Aplikasi', page: 'tentang' }
        ],
        kasir: [
            { icon: 'bi-cart', text: 'Point of Sales', page: 'pos' },
            { icon: 'bi-currency-exchange', text: 'Pembayaran Hutang/Piutang', page: 'pembayaran-hutang-piutang' },
            { icon: 'bi-receipt', text: 'Riwayat Transaksi', page: 'riwayat' },
            { icon: 'bi-file-earmark-text', text: 'Riwayat Pengajuan Modal', page: 'riwayat-pengajuan-kasir' },
            { icon: 'bi-trash', text: 'Hapus Transaksi', page: 'hapus-transaksi' },
            { icon: 'bi-clock-history', text: 'Riwayat Hapus Transaksi', page: 'riwayat-hapus-transaksi' },
            { icon: 'bi-clock-history', text: 'Riwayat Tutup Kasir', page: 'riwayat-tutup-kas' },
            { icon: 'bi-file-earmark-bar-graph', text: 'Laporan Transaksi & Simpanan', page: 'laporan-transaksi-simpanan' },
            { icon: 'bi-info-circle', text: 'Tentang Aplikasi', page: 'tentang' }
        ],
        anggota: [
            { icon: 'bi-speedometer2', text: 'Dashboard', page: 'dashboard' },
            { icon: 'bi-file-earmark-bar-graph', text: 'Laporan Transaksi & Simpanan', page: 'laporan-transaksi-simpanan' },
            { icon: 'bi-info-circle', text: 'Tentang Aplikasi', page: 'tentang' }
        ]
    };
    
    const userMenus = menus[role] || [];
    menuList.innerHTML = userMenus.map(menu => `
        <li class="nav-item">
            <a class="nav-link" href="#" data-page="${menu.page}" onclick="navigateTo('${menu.page}'); return false;">
                <i class="${menu.icon}"></i> ${menu.text}
            </a>
        </li>
    `).join('');
}

function renderPage(page) {
    const content = document.getElementById('mainContent');
    
    switch(page) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'system-settings':
            renderSystemSettings();
            break;
        case 'audit-log':
            renderAuditLog();
            break;
        case 'koperasi':
            renderKoperasi();
            break;
        case 'anggota':
            renderAnggota();
            break;
        case 'aktivasi-kartu':
            renderAktivasiKartu();
            break;
        case 'simpanan':
            renderSimpanan();
            break;
        case 'pinjaman':
            renderPinjaman();
            break;
        case 'coa':
            renderCOA();
            break;
        case 'jurnal':
            renderJurnal();
            break;
        case 'shu':
            renderSHU();
            break;
        case 'pembayaran-hutang-piutang':
            renderPembayaranHutangPiutang();
            break;
        case 'pos':
            renderPOS();
            break;
        case 'barang':
            renderBarang();
            break;
        case 'upload-master-barang-excel':
            renderUploadMasterBarangExcel();
            break;
        case 'supplier':
            renderSupplier();
            break;
        case 'pembelian':
            renderPembelian();
            break;
        case 'stokopname':
            renderStokOpname();
            break;
        case 'laporan':
            renderLaporan();
            break;
        case 'riwayat':
            renderRiwayatTransaksi();
            break;
        case 'riwayat-tutup-kas':
            renderRiwayatTutupKas();
            break;
        case 'users':
            renderManajemenUser();
            break;
        case 'departemen':
            renderDepartemen();
            break;
        case 'saldo-awal':
            renderSaldoAwal();
            break;
        case 'hapus-transaksi':
            renderHapusTransaksi();
            break;
        case 'riwayat-hapus-transaksi':
            renderRiwayatHapusTransaksi();
            break;
        case 'riwayat-pengajuan-kasir':
            renderRiwayatPengajuanKasir();
            break;
        case 'kelola-pengajuan-modal':
            renderKelolaPengajuanModal();
            break;
        case 'riwayat-pengajuan-admin':
            renderRiwayatPengajuanAdmin();
            break;
        case 'tentang':
            renderTentangAplikasi();
            break;
        case 'backup-restore':
            renderBackupRestore();
            break;
        case 'reset-data':
            if (typeof renderResetDataPage === 'function') {
                renderResetDataPage();
            } else {
                content.innerHTML = '<div class="alert alert-danger">Fitur Reset Data belum tersedia. Pastikan file js/resetDataUI.js sudah dimuat.</div>';
            }
            break;
        case 'anggota-keluar':
            if (typeof renderAnggotaKeluarPage === 'function') {
                renderAnggotaKeluarPage();
            } else {
                content.innerHTML = '<div class="alert alert-danger">Fitur Anggota Keluar belum tersedia. Pastikan file js/anggotaKeluarUI.js sudah dimuat.</div>';
            }
            break;
        case 'laporan-transaksi-simpanan':
            if (typeof renderLaporanTransaksiSimpananAnggota === 'function') {
                renderLaporanTransaksiSimpananAnggota();
            } else {
                content.innerHTML = '<div class="alert alert-danger">Fitur Laporan Transaksi & Simpanan belum tersedia. Pastikan file js/laporanTransaksiSimpananAnggota.js sudah dimuat.</div>';
            }
            break;
        default:
            content.innerHTML = '<h2>Halaman tidak ditemukan</h2>';
    }
}

function renderDashboard() {
    const content = document.getElementById('mainContent');
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    const penjualan = JSON.parse(localStorage.getItem('penjualan') || '[]');
    const barang = JSON.parse(localStorage.getItem('barang') || '[]');
    
    const totalPenjualanHariIni = penjualan
        .filter(p => new Date(p.tanggal).toDateString() === new Date().toDateString())
        .reduce((sum, p) => sum + p.total, 0);
    
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 style="color: #2d6a4f; font-weight: 700;">
                <i class="bi bi-speedometer2 me-2"></i>Dashboard
            </h2>
            <span class="badge" style="background: linear-gradient(135deg, #2d6a4f 0%, #52b788 100%); font-size: 1rem;">
                <i class="bi bi-calendar-check me-1"></i>${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
        </div>
        <div class="row mt-4">
            <div class="col-md-3 mb-4">
                <div class="dashboard-card">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-2" style="opacity: 0.9;">Total Anggota</h6>
                            <h2 class="mb-0" style="font-weight: 700;">${anggota.length}</h2>
                        </div>
                        <i class="bi bi-people-fill" style="font-size: 3rem; opacity: 0.3;"></i>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-4">
                <div class="dashboard-card success">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-2" style="opacity: 0.9;">Penjualan Hari Ini</h6>
                            <h2 class="mb-0" style="font-weight: 700; font-size: 1.5rem;">${formatRupiah(totalPenjualanHariIni)}</h2>
                        </div>
                        <i class="bi bi-cash-coin" style="font-size: 3rem; opacity: 0.3;"></i>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-4">
                <div class="dashboard-card info">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-2" style="opacity: 0.9;">Total Barang</h6>
                            <h2 class="mb-0" style="font-weight: 700;">${barang.length}</h2>
                        </div>
                        <i class="bi bi-box-seam-fill" style="font-size: 3rem; opacity: 0.3;"></i>
                    </div>
                </div>
            </div>
            <div class="col-md-3 mb-4">
                <div class="dashboard-card warning">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <h6 class="mb-2" style="opacity: 0.9;">Transaksi Hari Ini</h6>
                            <h2 class="mb-0" style="font-weight: 700;">${penjualan.filter(p => new Date(p.tanggal).toDateString() === new Date().toDateString()).length}</h2>
                        </div>
                        <i class="bi bi-cart-check-fill" style="font-size: 3rem; opacity: 0.3;"></i>
                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header">
                        <i class="bi bi-graph-up me-2"></i>Selamat Datang di Sistem Koperasi
                    </div>
                    <div class="card-body">
                        <p class="mb-0" style="color: #2d6a4f;">
                            <i class="bi bi-check-circle-fill me-2" style="color: #52b788;"></i>
                            Sistem manajemen koperasi terintegrasi dengan Point of Sales dan sistem keuangan.
                        </p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                ${getDashboardDepartemenWidget()}
            </div>
        </div>
    `;
}


// Manajemen User Functions
function renderManajemenUser() {
    const content = document.getElementById('mainContent');
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const users = filterUsersByPermission(allUsers);
    
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 style="color: #2d6a4f; font-weight: 700;">
                <i class="bi bi-person-gear me-2"></i>Manajemen User
            </h2>
        </div>
        
        <div class="card">
            <div class="card-header">
                <div class="d-flex justify-content-between align-items-center">
                    <span><i class="bi bi-people me-2"></i>Daftar User</span>
                    <button class="btn btn-primary btn-sm" onclick="showUserModal()">
                        <i class="bi bi-plus-circle me-1"></i>Tambah User
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Username</th>
                                <th>Nama Lengkap</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(u => `
                                <tr>
                                    <td>${u.id}</td>
                                    <td><i class="bi bi-person-circle me-1"></i>${u.username}</td>
                                    <td>${u.name}</td>
                                    <td>
                                        <span class="badge ${getRoleBadgeClass(u.role)}">
                                            ${getRoleName(u.role)}
                                        </span>
                                    </td>
                                    <td>
                                        <span class="badge ${u.active !== false ? 'bg-success' : 'bg-secondary'}">
                                            ${u.active !== false ? 'Aktif' : 'Nonaktif'}
                                        </span>
                                    </td>
                                    <td>
                                        <button class="btn btn-sm btn-info" onclick="viewUser(${u.id})" title="Lihat Detail">
                                            <i class="bi bi-eye"></i>
                                        </button>
                                        <button class="btn btn-sm btn-warning" onclick="editUser(${u.id})" title="Edit">
                                            <i class="bi bi-pencil"></i>
                                        </button>
                                        ${u.id !== 1 ? `
                                            <button class="btn btn-sm btn-danger" onclick="deleteUser(${u.id})" title="Hapus">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        ` : '<button class="btn btn-sm btn-secondary" disabled title="User default tidak bisa dihapus"><i class="bi bi-shield-lock"></i></button>'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <!-- Modal User -->
        <div class="modal fade" id="userModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-person-plus me-2"></i><span id="userModalTitle">Tambah User</span>
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="userForm">
                            <input type="hidden" id="userId">
                            <div class="mb-3">
                                <label class="form-label">
                                    <i class="bi bi-person me-1"></i>Username
                                </label>
                                <input type="text" class="form-control" id="userUsername" required>
                                <small class="text-muted">Username untuk login</small>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">
                                    <i class="bi bi-lock me-1"></i>Password
                                </label>
                                <input type="password" class="form-control" id="userPassword">
                                <small class="text-muted" id="passwordHint">Minimal 6 karakter</small>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">
                                    <i class="bi bi-person-badge me-1"></i>Nama Lengkap
                                </label>
                                <input type="text" class="form-control" id="userName" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">
                                    <i class="bi bi-shield-check me-1"></i>Role / Hak Akses
                                </label>
                                <select class="form-select" id="userRole" required>
                                    <option value="">Pilih Role</option>
                                    <option value="administrator">Administrator - Akses Penuh</option>
                                    <option value="keuangan">Admin Keuangan - Akses Keuangan</option>
                                    <option value="kasir">Kasir - Akses POS</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">
                                    <i class="bi bi-toggle-on me-1"></i>Status
                                </label>
                                <select class="form-select" id="userActive">
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
                        <button type="button" class="btn btn-primary" onclick="saveUser()">
                            <i class="bi bi-save me-1"></i>Simpan
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Modal View User -->
        <div class="modal fade" id="viewUserModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-person-circle me-2"></i>Detail User
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" id="viewUserContent">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getRoleBadgeClass(role) {
    const classes = {
        'super_admin': 'bg-dark',
        'administrator': 'bg-danger',
        'keuangan': 'bg-primary',
        'kasir': 'bg-success'
    };
    return classes[role] || 'bg-secondary';
}

function getRoleName(role) {
    const names = {
        'super_admin': 'Super Admin',
        'administrator': 'Administrator',
        'keuangan': 'Admin Keuangan',
        'kasir': 'Kasir'
    };
    return names[role] || role;
}

function isSuperAdmin() {
    return currentUser && currentUser.role === 'super_admin';
}

function canManageAdmins() {
    return isSuperAdmin();
}

function filterUsersByPermission(users) {
    if (isSuperAdmin()) {
        return users; // Super Admin sees all users
    }
    // Non-Super Admin cannot see Super Admin accounts
    return users.filter(u => u.role !== 'super_admin');
}

function getAvailableRoles() {
    if (isSuperAdmin()) {
        return [
            { value: 'super_admin', label: 'Super Admin - Akses Penuh Sistem' },
            { value: 'administrator', label: 'Administrator - Akses Penuh Operasional' },
            { value: 'keuangan', label: 'Admin Keuangan - Akses Keuangan' },
            { value: 'kasir', label: 'Kasir - Akses POS' }
        ];
    }
    return [
        { value: 'administrator', label: 'Administrator - Akses Penuh Operasional' },
        { value: 'keuangan', label: 'Admin Keuangan - Akses Keuangan' },
        { value: 'kasir', label: 'Kasir - Akses POS' }
    ];
}

function showUserModal() {
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('userModalTitle').textContent = 'Tambah User';
    document.getElementById('userPassword').required = true;
    document.getElementById('passwordHint').textContent = 'Minimal 6 karakter';
    
    // Populate role dropdown based on user permissions
    const roleSelect = document.getElementById('userRole');
    const availableRoles = getAvailableRoles();
    
    roleSelect.innerHTML = '<option value="">Pilih Role</option>' + 
        availableRoles.map(role => `<option value="${role.value}">${role.label}</option>`).join('');
    
    new bootstrap.Modal(document.getElementById('userModal')).show();
}

function viewUser(id) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.id === id);
    
    if (user) {
        const content = document.getElementById('viewUserContent');
        content.innerHTML = `
            <div class="row">
                <div class="col-12 text-center mb-3">
                    <i class="bi bi-person-circle" style="font-size: 5rem; color: #2d6a4f;"></i>
                </div>
                <div class="col-md-6">
                    <strong><i class="bi bi-hash me-1"></i>ID:</strong>
                </div>
                <div class="col-md-6">
                    ${user.id}
                </div>
                <div class="col-md-6 mt-2">
                    <strong><i class="bi bi-person me-1"></i>Username:</strong>
                </div>
                <div class="col-md-6 mt-2">
                    ${user.username}
                </div>
                <div class="col-md-6 mt-2">
                    <strong><i class="bi bi-person-badge me-1"></i>Nama Lengkap:</strong>
                </div>
                <div class="col-md-6 mt-2">
                    ${user.name}
                </div>
                <div class="col-md-6 mt-2">
                    <strong><i class="bi bi-shield-check me-1"></i>Role:</strong>
                </div>
                <div class="col-md-6 mt-2">
                    <span class="badge ${getRoleBadgeClass(user.role)}">${getRoleName(user.role)}</span>
                </div>
                <div class="col-md-6 mt-2">
                    <strong><i class="bi bi-toggle-on me-1"></i>Status:</strong>
                </div>
                <div class="col-md-6 mt-2">
                    <span class="badge ${user.active !== false ? 'bg-success' : 'bg-secondary'}">
                        ${user.active !== false ? 'Aktif' : 'Nonaktif'}
                    </span>
                </div>
            </div>
        `;
        new bootstrap.Modal(document.getElementById('viewUserModal')).show();
    }
}

function editUser(id) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.id === id);
    
    if (user) {
        document.getElementById('userId').value = user.id;
        document.getElementById('userUsername').value = user.username;
        document.getElementById('userPassword').value = '';
        document.getElementById('userPassword').required = false;
        document.getElementById('passwordHint').textContent = 'Kosongkan jika tidak ingin mengubah password';
        document.getElementById('userName').value = user.name;
        document.getElementById('userActive').value = user.active !== false ? 'true' : 'false';
        document.getElementById('userModalTitle').textContent = 'Edit User';
        
        // Populate role dropdown based on user permissions
        const roleSelect = document.getElementById('userRole');
        const availableRoles = getAvailableRoles();
        
        roleSelect.innerHTML = '<option value="">Pilih Role</option>' + 
            availableRoles.map(role => `<option value="${role.value}">${role.label}</option>`).join('');
        
        // Set the current role value
        document.getElementById('userRole').value = user.role;
        
        new bootstrap.Modal(document.getElementById('userModal')).show();
    }
}

function saveUser() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const id = document.getElementById('userId').value;
    const username = document.getElementById('userUsername').value;
    const password = document.getElementById('userPassword').value;
    const name = document.getElementById('userName').value;
    const role = document.getElementById('userRole').value;
    const active = document.getElementById('userActive').value === 'true';
    
    // Validasi
    if (!username || !name || !role) {
        showAlert('Semua field harus diisi!', 'warning');
        return;
    }
    
    // Permission validation: Check if non-Super Admin is trying to manage Super Admin accounts
    if (!isSuperAdmin() && role === 'super_admin') {
        showAlert('Anda tidak memiliki izin untuk menetapkan role ini!', 'danger');
        return;
    }
    
    // Check duplicate username
    const existingUser = users.find(u => u.username === username && u.id != id);
    if (existingUser) {
        showAlert('Username sudah digunakan!', 'warning');
        return;
    }
    
    if (id) {
        // Edit user
        const index = users.findIndex(u => u.id == id);
        
        if (index === -1) {
            showAlert('User tidak ditemukan!', 'danger');
            return;
        }
        
        // Permission validation: Check if non-Super Admin is trying to edit a Super Admin account
        if (!isSuperAdmin() && users[index].role === 'super_admin') {
            showAlert('Anda tidak memiliki izin untuk mengedit user ini!', 'danger');
            return;
        }
        
        users[index].username = username;
        users[index].name = name;
        users[index].role = role;
        users[index].active = active;
        
        // Update password only if provided
        if (password) {
            if (password.length < 6) {
                showAlert('Password minimal 6 karakter!', 'warning');
                return;
            }
            users[index].password = password;
        }
    } else {
        // Add new user
        if (!password || password.length < 6) {
            showAlert('Password minimal 6 karakter!', 'warning');
            return;
        }
        
        const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        users.push({
            id: newId,
            username: username,
            password: password,
            name: name,
            role: role,
            active: active
        });
    }
    
    localStorage.setItem('users', JSON.stringify(users));
    bootstrap.Modal.getInstance(document.getElementById('userModal')).hide();
    showAlert('User berhasil disimpan', 'success');wAlert('User berhasil disimpan', 'success');
    renderManajemenUser();
}

function deleteUser(id) {
    if (id === 1) {
        showAlert('User default tidak dapat dihapus!', 'warning');
        return;
    }
    
    // Prevent self-deletion
    if (currentUser.id === id) {
        showAlert('Anda tidak dapat menghapus akun yang sedang digunakan!', 'warning');
        return;
    }
    
    // Permission validation: Prevent non-Super Admin from deleting Super Admin accounts
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userToDelete = users.find(u => u.id === id);
    
    if (userToDelete && !isSuperAdmin() && userToDelete.role === 'super_admin') {
        showAlert('Anda tidak memiliki izin untuk menghapus user ini!', 'danger');
        return;
    }
    
    if (confirm('Yakin ingin menghapus user ini?')) {
        const filteredUsers = users.filter(u => u.id !== id);
        localStorage.setItem('users', JSON.stringify(filteredUsers));
        showAlert('User berhasil dihapus', 'info');
        renderManajemenUser();
    }
}


// Widget Departemen untuk Dashboard
function getDashboardDepartemenWidget() {
    const departemen = JSON.parse(localStorage.getItem('departemen') || '[]');
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    
    if (departemen.length === 0) {
        return `
            <div class="card">
                <div class="card-header">
                    <i class="bi bi-diagram-3 me-2"></i>Departemen
                </div>
                <div class="card-body text-center">
                    <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc;"></i>
                    <p class="text-muted mt-2 mb-2">Belum ada departemen</p>
                    <button class="btn btn-sm btn-primary" onclick="navigateTo('departemen')">
                        <i class="bi bi-plus-circle me-1"></i>Tambah Departemen
                    </button>
                </div>
            </div>
        `;
    }
    
    // Hitung anggota per departemen
    const deptStats = departemen.map(d => {
        const jumlah = anggota.filter(a => a.departemen === d.nama).length;
        return { ...d, jumlahAnggota: jumlah };
    }).sort((a, b) => b.jumlahAnggota - a.jumlahAnggota);
    
    const topDept = deptStats.slice(0, 5);
    
    return `
        <div class="card">
            <div class="card-header">
                <div class="d-flex justify-content-between align-items-center">
                    <span><i class="bi bi-diagram-3 me-2"></i>Departemen</span>
                    <span class="badge bg-primary">${departemen.length}</span>
                </div>
            </div>
            <div class="card-body" style="max-height: 300px; overflow-y: auto;">
                ${topDept.map(d => `
                    <div class="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                        <div>
                            <strong style="color: #2d6a4f;">${d.nama}</strong>
                            <br>
                            <small class="text-muted">${d.kode}</small>
                        </div>
                        <div class="text-end">
                            <span class="badge bg-info">${d.jumlahAnggota}</span>
                            <br>
                            <small class="text-muted">anggota</small>
                        </div>
                    </div>
                `).join('')}
                ${departemen.length > 5 ? `
                    <div class="text-center mt-2">
                        <small class="text-muted">dan ${departemen.length - 5} departemen lainnya</small>
                    </div>
                ` : ''}
            </div>
            <div class="card-footer text-center">
                <a href="#" onclick="navigateTo('departemen'); return false;" class="text-decoration-none">
                    <i class="bi bi-arrow-right-circle me-1"></i>Lihat Semua Departemen
                </a>
            </div>
        </div>
    `;
}


// Render Tentang Aplikasi
function renderTentangAplikasi() {
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 style="color: #2d6a4f; font-weight: 700;">
                <i class="bi bi-info-circle me-2"></i>Tentang Aplikasi
            </h2>
        </div>
        
        <div class="row">
            <div class="col-md-8">
                <div class="card mb-4">
                    <div class="card-header" style="background: linear-gradient(135deg, #2d6a4f 0%, #52b788 100%); color: white;">
                        <i class="bi bi-app-indicator me-2"></i>Informasi Aplikasi
                    </div>
                    <div class="card-body">
                        <div class="text-center mb-4">
                            <i class="bi bi-shop-window" style="font-size: 5rem; color: #2d6a4f;"></i>
                            <h3 class="mt-3" style="color: #2d6a4f; font-weight: 700;">Aplikasi Koperasi Karyawan</h3>
                            <p class="text-muted">Sistem Manajemen Terintegrasi</p>
                            <span class="badge bg-success" style="font-size: 1rem;">Versi 1.0.0</span>
                        </div>
                        
                        <hr>
                        
                        <h5 style="color: #2d6a4f;" class="mb-3">
                            <i class="bi bi-star-fill me-2"></i>Fitur Utama
                        </h5>
                        <div class="row">
                            <div class="col-md-6">
                                <ul class="list-unstyled">
                                    <li class="mb-2">
                                        <i class="bi bi-check-circle-fill text-success me-2"></i>
                                        Manajemen Anggota & Departemen
                                    </li>
                                    <li class="mb-2">
                                        <i class="bi bi-check-circle-fill text-success me-2"></i>
                                        Simpanan (Pokok, Wajib, Sukarela)
                                    </li>
                                    <li class="mb-2">
                                        <i class="bi bi-check-circle-fill text-success me-2"></i>
                                        Pinjaman & Angsuran
                                    </li>
                                    <li class="mb-2">
                                        <i class="bi bi-check-circle-fill text-success me-2"></i>
                                        Point of Sales (POS)
                                    </li>
                                    <li class="mb-2">
                                        <i class="bi bi-check-circle-fill text-success me-2"></i>
                                        Manajemen Inventory
                                    </li>
                                </ul>
                            </div>
                            <div class="col-md-6">
                                <ul class="list-unstyled">
                                    <li class="mb-2">
                                        <i class="bi bi-check-circle-fill text-success me-2"></i>
                                        Akuntansi Double Entry
                                    </li>
                                    <li class="mb-2">
                                        <i class="bi bi-check-circle-fill text-success me-2"></i>
                                        Laporan Keuangan Lengkap
                                    </li>
                                    <li class="mb-2">
                                        <i class="bi bi-check-circle-fill text-success me-2"></i>
                                        Perhitungan SHU Otomatis
                                    </li>
                                    <li class="mb-2">
                                        <i class="bi bi-check-circle-fill text-success me-2"></i>
                                        Aktivasi & Cetak Kartu Anggota
                                    </li>
                                    <li class="mb-2">
                                        <i class="bi bi-check-circle-fill text-success me-2"></i>
                                        Multi-User & Role Management
                                    </li>
                                </ul>
                            </div>
                        </div>
                        
                        <hr>
                        
                        <div class="alert alert-info">
                            <i class="bi bi-lightbulb-fill me-2"></i>
                            <strong>Teknologi:</strong> HTML5, CSS3, JavaScript (Vanilla), Bootstrap 5, LocalStorage
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="card mb-4" style="border: 2px solid #2d6a4f;">
                    <div class="card-header text-white" style="background: linear-gradient(135deg, #2d6a4f 0%, #52b788 100%);">
                        <i class="bi bi-headset me-2"></i>Team Support
                    </div>
                    <div class="card-body">
                        <div class="text-center mb-3">
                            <i class="bi bi-person-circle" style="font-size: 4rem; color: #2d6a4f;"></i>
                            <h5 class="mt-2" style="color: #2d6a4f;">Tim Pengembang</h5>
                        </div>
                        
                        <div class="mb-3">
                            <strong style="color: #2d6a4f;">
                                <i class="bi bi-building me-2"></i>Perusahaan:
                            </strong>
                            <p class="mb-0">CV Bangun Bina Pratama</p>
                        </div>
                        
                        <div class="mb-3">
                            <strong style="color: #2d6a4f;">
                                <i class="bi bi-person-badge me-2"></i>Contact Person:
                            </strong>
                            <p class="mb-0">Arya Wirawan</p>
                            <small class="text-muted">Lead Developer</small>
                        </div>
                        
                        <hr>
                        
                        <div class="mb-2">
                            <i class="bi bi-telephone-fill text-success me-2"></i>
                            <a href="tel:+62081522600227" class="text-decoration-none">0815-2260-0227</a>
                        </div>
                        
                        <div class="mb-2">
                            <i class="bi bi-whatsapp text-success me-2"></i>
                            <a href="https://wa.me/62815226002227" target="_blank" class="text-decoration-none">
                                0815-2260-0227
                            </a>
                        </div>
                        
                        <div class="mb-2">
                            <i class="bi bi-envelope-fill text-primary me-2"></i>
                            <a href="mailto:support@koperasi-app.com" class="text-decoration-none">
                                support@koperasi-app.com
                            </a>
                        </div>
                        
                        <div class="mb-2">
                            <i class="bi bi-globe text-info me-2"></i>
                            <a href="https://www.koperasi-app.com" target="_blank" class="text-decoration-none">
                                www.koperasi-app.com
                            </a>
                        </div>
                        
                        <hr>
                        
                        <div class="alert alert-success mb-0">
                            <small>
                                <i class="bi bi-clock-fill me-1"></i>
                                <strong>Jam Operasional:</strong><br>
                                Senin - Jumat: 08:00 - 17:00 WIB<br>
                                Sabtu: 08:00 - 12:00 WIB
                            </small>
                        </div>
                    </div>
                </div>
                
                <div class="card" style="border: 2px solid #ffd60a;">
                    <div class="card-header text-white" style="background: linear-gradient(135deg, #ffd60a 0%, #ffc300 100%); color: #1b4332 !important;">
                        <i class="bi bi-question-circle me-2"></i>Butuh Bantuan?
                    </div>
                    <div class="card-body">
                        <p class="mb-3">
                            <small>
                                Jika Anda mengalami kendala atau membutuhkan bantuan, jangan ragu untuk menghubungi tim support kami.
                            </small>
                        </p>
                        <button class="btn btn-success w-100 mb-2" onclick="window.open('https://wa.me/62815226002227?text=Halo,%20saya%20butuh%20bantuan%20dengan%20Aplikasi%20Koperasi', '_blank')">
                            <i class="bi bi-whatsapp me-2"></i>Chat WhatsApp
                        </button>
                        <button class="btn btn-primary w-100" onclick="window.location.href='mailto:support@koperasi-app.com?subject=Bantuan%20Aplikasi%20Koperasi'">
                            <i class="bi bi-envelope me-2"></i>Kirim Email
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mt-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-body text-center">
                        <p class="mb-0 text-muted">
                            <i class="bi bi-shield-check me-2"></i>
                            © 2024 Aplikasi Koperasi Karyawan. Dikembangkan dengan <i class="bi bi-heart-fill text-danger"></i> oleh CV Bangun Bina Pratama
                        </p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Render System Settings (Super Admin only)
function renderSystemSettings() {
    if (!isSuperAdmin()) {
        showAlert('Akses ditolak. Hanya Super Admin yang dapat mengakses halaman ini.', 'danger');
        navigateTo('dashboard');
        return;
    }
    
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 style="color: #2d6a4f; font-weight: 700;">
                <i class="bi bi-gear-fill me-2"></i>Pengaturan Sistem
            </h2>
            <span class="badge bg-dark" style="font-size: 1rem;">
                <i class="bi bi-shield-lock me-1"></i>Super Admin Only
            </span>
        </div>
        
        <div class="row">
            <div class="col-md-12">
                <div class="card mb-4">
                    <div class="card-header" style="background: linear-gradient(135deg, #2d6a4f 0%, #52b788 100%); color: white;">
                        <i class="bi bi-sliders me-2"></i>Konfigurasi Sistem
                    </div>
                    <div class="card-body">
                        <div class="alert alert-info">
                            <i class="bi bi-info-circle-fill me-2"></i>
                            <strong>Informasi:</strong> Halaman pengaturan sistem untuk konfigurasi tingkat lanjut.
                            Fitur ini akan dikembangkan lebih lanjut sesuai kebutuhan.
                        </div>
                        
                        <h5 style="color: #2d6a4f;" class="mb-3">
                            <i class="bi bi-gear me-2"></i>Pengaturan Umum
                        </h5>
                        
                        <div class="mb-3">
                            <label class="form-label"><strong>Nama Aplikasi</strong></label>
                            <input type="text" class="form-control" value="Aplikasi Koperasi Karyawan" readonly>
                            <small class="text-muted">Nama aplikasi yang ditampilkan di sistem</small>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label"><strong>Versi Aplikasi</strong></label>
                            <input type="text" class="form-control" value="1.0.0" readonly>
                            <small class="text-muted">Versi aplikasi saat ini</small>
                        </div>
                        
                        <hr>
                        
                        <h5 style="color: #2d6a4f;" class="mb-3">
                            <i class="bi bi-database me-2"></i>Manajemen Data
                        </h5>
                        
                        <div class="d-grid gap-2">
                            <button class="btn btn-primary" id="btnOpenBackupRestore" style="padding: 12px; font-size: 1.1rem;">
                                <i class="bi bi-database me-2"></i>Buka Backup & Restore
                            </button>
                            <small class="text-muted mt-2">
                                <i class="bi bi-info-circle me-1"></i>
                                Klik tombol di atas untuk mengakses fitur backup dan restore database
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Attach event listener for backup button
    setTimeout(() => {
        const btnBackup = document.getElementById('btnOpenBackupRestore');
        if (btnBackup) {
            btnBackup.addEventListener('click', function() {
                navigateTo('backup-restore');
            });
        }
    }, 100);
}

// Render Audit Log (Super Admin only - placeholder)
function renderAuditLog() {
    if (!isSuperAdmin()) {
        showAlert('Akses ditolak. Hanya Super Admin yang dapat mengakses halaman ini.', 'danger');
        navigateTo('dashboard');
        return;
    }
    
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 style="color: #2d6a4f; font-weight: 700;">
                <i class="bi bi-shield-lock me-2"></i>Audit Log
            </h2>
            <span class="badge bg-dark" style="font-size: 1rem;">
                <i class="bi bi-shield-lock me-1"></i>Super Admin Only
            </span>
        </div>
        
        <div class="card">
            <div class="card-header" style="background: linear-gradient(135deg, #2d6a4f 0%, #52b788 100%); color: white;">
                <i class="bi bi-clock-history me-2"></i>Riwayat Aktivitas Sistem
            </div>
            <div class="card-body">
                <div class="alert alert-info">
                    <i class="bi bi-info-circle-fill me-2"></i>
                    <strong>Informasi:</strong> Halaman audit log untuk memantau semua aktivitas sistem.
                    Fitur ini akan dikembangkan lebih lanjut untuk mencatat semua operasi penting.
                </div>
                
                <div class="text-center py-5">
                    <i class="bi bi-journal-text" style="font-size: 5rem; color: #ccc;"></i>
                    <h5 class="mt-3 text-muted">Audit Log</h5>
                    <p class="text-muted">Fitur audit log akan segera tersedia</p>
                    <small class="text-muted">
                        Akan mencatat: Login/Logout, Perubahan User, Transaksi Keuangan, 
                        Hapus Data, dan aktivitas kritis lainnya
                    </small>
                </div>
            </div>
        </div>
    `;
}

// Show Support Info Modal (untuk dipanggil dari login page)
function showSupportInfo() {
    const modalHTML = `
        <div class="modal fade" id="supportModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header" style="background: linear-gradient(135deg, #2d6a4f 0%, #52b788 100%); color: white;">
                        <h5 class="modal-title">
                            <i class="bi bi-headset me-2"></i>Team Support
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="text-center mb-4">
                            <i class="bi bi-person-circle" style="font-size: 4rem; color: #2d6a4f;"></i>
                            <h5 class="mt-2" style="color: #2d6a4f;">Hubungi Kami</h5>
                        </div>
                        
                        <div class="mb-3">
                            <strong style="color: #2d6a4f;">
                                <i class="bi bi-building me-2"></i>Perusahaan:
                            </strong>
                            <p class="mb-0">CV Bangun Bina Pratama</p>
                        </div>
                        
                        <div class="mb-3">
                            <strong style="color: #2d6a4f;">
                                <i class="bi bi-person-badge me-2"></i>Contact Person:
                            </strong>
                            <p class="mb-0">Arya Wirawan - Lead Developer</p>
                        </div>
                        
                        <hr>
                        
                        <div class="list-group">
                            <a href="tel:+62081522600227" class="list-group-item list-group-item-action">
                                <i class="bi bi-telephone-fill text-success me-2"></i>
                                0815-2260-0227
                            </a>
                            <a href="https://wa.me/62815226002227?text=Halo,%20saya%20butuh%20bantuan%20dengan%20Aplikasi%20Koperasi" target="_blank" class="list-group-item list-group-item-action">
                                <i class="bi bi-whatsapp text-success me-2"></i>
                                WhatsApp: 0815-2260-0227
                            </a>
                            <a href="mailto:support@koperasi-app.com" class="list-group-item list-group-item-action">
                                <i class="bi bi-envelope-fill text-primary me-2"></i>
                                support@koperasi-app.com
                            </a>
                            <a href="https://www.koperasi-app.com" target="_blank" class="list-group-item list-group-item-action">
                                <i class="bi bi-globe text-info me-2"></i>
                                www.koperasi-app.com
                            </a>
                        </div>
                        
                        <div class="alert alert-info mt-3 mb-0">
                            <small>
                                <i class="bi bi-clock-fill me-1"></i>
                                <strong>Jam Operasional:</strong><br>
                                Senin - Jumat: 08:00 - 17:00 WIB<br>
                                Sabtu: 08:00 - 12:00 WIB
                            </small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                        <button type="button" class="btn btn-success" onclick="window.open('https://wa.me/62815226002227?text=Halo,%20saya%20butuh%20bantuan%20dengan%20Aplikasi%20Koperasi', '_blank')">
                            <i class="bi bi-whatsapp me-1"></i>Chat WhatsApp
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('supportModal');
    if (existingModal) existingModal.remove();
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('supportModal'));
    modal.show();
}

// Render Upload Master Barang Excel
function renderUploadMasterBarangExcel() {
    const content = document.getElementById('mainContent');
    
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 style="color: #2d6a4f; font-weight: 700;">
                <i class="bi bi-file-excel me-2"></i>Upload Master Barang Excel
            </h2>
            <div>
                <button class="btn btn-outline-primary" onclick="window.open('upload_master_barang_excel.html', '_blank')">
                    <i class="bi bi-box-arrow-up-right me-2"></i>Buka di Tab Baru
                </button>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header" style="background: linear-gradient(135deg, #2d6a4f 0%, #52b788 100%); color: white;">
                <i class="bi bi-upload me-2"></i>Upload Data Barang Massal
            </div>
            <div class="card-body">
                <div class="alert alert-info">
                    <i class="bi bi-info-circle-fill me-2"></i>
                    <strong>Informasi:</strong> Fitur ini memungkinkan Anda mengupload data barang secara massal menggunakan file Excel atau CSV.
                </div>
                
                <div class="row">
                    <div class="col-md-8">
                        <h5 style="color: #2d6a4f;" class="mb-3">
                            <i class="bi bi-list-check me-2"></i>Fitur Utama
                        </h5>
                        <ul class="list-unstyled">
                            <li class="mb-2">
                                <i class="bi bi-check-circle-fill text-success me-2"></i>
                                Upload file Excel (.xlsx) atau CSV (.csv)
                            </li>
                            <li class="mb-2">
                                <i class="bi bi-check-circle-fill text-success me-2"></i>
                                Drag & drop interface yang mudah digunakan
                            </li>
                            <li class="mb-2">
                                <i class="bi bi-check-circle-fill text-success me-2"></i>
                                Validasi data otomatis dan real-time
                            </li>
                            <li class="mb-2">
                                <i class="bi bi-check-circle-fill text-success me-2"></i>
                                Preview data sebelum import
                            </li>
                            <li class="mb-2">
                                <i class="bi bi-check-circle-fill text-success me-2"></i>
                                Auto-create kategori dan satuan baru
                            </li>
                            <li class="mb-2">
                                <i class="bi bi-check-circle-fill text-success me-2"></i>
                                Progress tracking dan error handling
                            </li>
                            <li class="mb-2">
                                <i class="bi bi-check-circle-fill text-success me-2"></i>
                                Audit log lengkap untuk compliance
                            </li>
                        </ul>
                    </div>
                    <div class="col-md-4">
                        <div class="card border-success">
                            <div class="card-header bg-success text-white">
                                <i class="bi bi-download me-2"></i>Template & Panduan
                            </div>
                            <div class="card-body">
                                <p class="mb-3">
                                    <small>
                                        Download template CSV untuk mempersiapkan data dengan format yang benar.
                                    </small>
                                </p>
                                <div class="d-grid gap-2">
                                    <button class="btn btn-success" onclick="downloadTemplate()">
                                        <i class="bi bi-download me-2"></i>Download Template
                                    </button>
                                    <button class="btn btn-outline-info" onclick="showFormatGuide()">
                                        <i class="bi bi-question-circle me-2"></i>Panduan Format
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <hr>
                
                <div class="text-center">
                    <button class="btn btn-primary btn-lg" onclick="window.open('upload_master_barang_excel.html', '_blank')" style="padding: 15px 30px; font-size: 1.2rem;">
                        <i class="bi bi-upload me-2"></i>Mulai Upload Data Barang
                    </button>
                    <p class="text-muted mt-2">
                        <small>Klik tombol di atas untuk membuka halaman upload dalam tab baru</small>
                    </p>
                </div>
            </div>
        </div>
        
        <!-- Modal Format Guide -->
        <div class="modal fade" id="formatGuideModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-question-circle me-2"></i>Panduan Format File
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <h6 class="text-primary">Format Kolom yang Diperlukan:</h6>
                        <div class="table-responsive">
                            <table class="table table-bordered">
                                <thead class="table-dark">
                                    <tr>
                                        <th>Kolom</th>
                                        <th>Wajib</th>
                                        <th>Format</th>
                                        <th>Contoh</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><strong>kode</strong></td>
                                        <td><span class="badge bg-danger">Ya</span></td>
                                        <td>Teks, maksimal 20 karakter, unik</td>
                                        <td>BRG001</td>
                                    </tr>
                                    <tr>
                                        <td><strong>nama</strong></td>
                                        <td><span class="badge bg-danger">Ya</span></td>
                                        <td>Teks, maksimal 100 karakter</td>
                                        <td>Beras Premium 5kg</td>
                                    </tr>
                                    <tr>
                                        <td><strong>kategori</strong></td>
                                        <td><span class="badge bg-danger">Ya</span></td>
                                        <td>Teks, akan dibuat otomatis jika belum ada</td>
                                        <td>makanan</td>
                                    </tr>
                                    <tr>
                                        <td><strong>satuan</strong></td>
                                        <td><span class="badge bg-danger">Ya</span></td>
                                        <td>Teks, akan dibuat otomatis jika belum ada</td>
                                        <td>kg</td>
                                    </tr>
                                    <tr>
                                        <td><strong>harga_beli</strong></td>
                                        <td><span class="badge bg-danger">Ya</span></td>
                                        <td>Angka, harus positif</td>
                                        <td>65000</td>
                                    </tr>
                                    <tr>
                                        <td><strong>stok</strong></td>
                                        <td><span class="badge bg-danger">Ya</span></td>
                                        <td>Angka, tidak boleh negatif</td>
                                        <td>50</td>
                                    </tr>
                                    <tr>
                                        <td><strong>supplier</strong></td>
                                        <td><span class="badge bg-secondary">Tidak</span></td>
                                        <td>Teks, maksimal 100 karakter</td>
                                        <td>PT Beras Sejahtera</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="alert alert-warning">
                            <i class="bi bi-exclamation-triangle-fill me-2"></i>
                            <strong>Penting:</strong>
                            <ul class="mb-0 mt-2">
                                <li>File maksimal 5MB</li>
                                <li>Format yang didukung: .xlsx, .csv</li>
                                <li>Baris pertama harus berisi header kolom</li>
                                <li>Kode barang harus unik (tidak boleh duplikat)</li>
                                <li>Harga beli dan stok harus berupa angka</li>
                            </ul>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                        <button type="button" class="btn btn-success" onclick="downloadTemplate()">
                            <i class="bi bi-download me-1"></i>Download Template
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Function to download template
function downloadTemplate() {
    const template = \`kode,nama,kategori,satuan,harga_beli,stok,supplier
BRG001,Beras Premium 5kg,makanan,kg,65000,50,PT Beras Sejahtera
BRG002,Minyak Goreng 1L,makanan,botol,15000,30,CV Minyak Murni
BRG003,Pulpen Pilot Hitam,alat-tulis,pcs,3000,100,Toko ATK Lengkap
BRG004,Air Mineral 600ml,minuman,botol,2500,200,PT Air Bersih\`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_master_barang_excel.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showAlert('Template berhasil didownload!', 'success');
}

// Function to show format guide
function showFormatGuide() {
    const modal = new bootstrap.Modal(document.getElementById('formatGuideModal'));
    modal.show();
}