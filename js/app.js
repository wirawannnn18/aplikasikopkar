// Global State
let currentUser = null;
let currentPage = 'dashboard';

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check if user is logged in
    const user = localStorage.getItem('currentUser');
    if (user) {
        currentUser = JSON.parse(user);
        showMainApp();
    } else {
        showLoginPage();
    }
    
    // Initialize default data if not exists
    initializeDefaultData();
}

function initializeDefaultData() {
    // Default users
    if (!localStorage.getItem('users')) {
        const defaultUsers = [
            { id: 1, username: 'superadmin', password: 'super123', name: 'Super Administrator', role: 'super_admin', active: true },
            { id: 2, username: 'admin', password: 'admin123', name: 'Administrator', role: 'administrator', active: true },
            { id: 3, username: 'keuangan', password: 'keuangan123', name: 'Admin Keuangan', role: 'keuangan', active: true },
            { id: 4, username: 'kasir', password: 'kasir123', name: 'Kasir', role: 'kasir', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    } else {
        // Upgrade existing data: add Super Admin if not exists
        ensureSuperAdminExists();
    }
    
    // Initialize other data structures
    if (!localStorage.getItem('koperasi')) {
        localStorage.setItem('koperasi', JSON.stringify({
            nama: '',
            alamat: '',
            telepon: '',
            modalAwal: 0
        }));
    }
    
    if (!localStorage.getItem('anggota')) localStorage.setItem('anggota', JSON.stringify([]));
    if (!localStorage.getItem('departemen')) localStorage.setItem('departemen', JSON.stringify([]));
    if (!localStorage.getItem('simpananPokok')) localStorage.setItem('simpananPokok', JSON.stringify([]));
    if (!localStorage.getItem('simpananWajib')) localStorage.setItem('simpananWajib', JSON.stringify([]));
    if (!localStorage.getItem('simpananSukarela')) localStorage.setItem('simpananSukarela', JSON.stringify([]));
    if (!localStorage.getItem('pinjaman')) localStorage.setItem('pinjaman', JSON.stringify([]));
    if (!localStorage.getItem('coa')) localStorage.setItem('coa', JSON.stringify(getDefaultCOA()));
    if (!localStorage.getItem('jurnal')) localStorage.setItem('jurnal', JSON.stringify([]));
    if (!localStorage.getItem('kategori')) localStorage.setItem('kategori', JSON.stringify([]));
    if (!localStorage.getItem('satuan')) localStorage.setItem('satuan', JSON.stringify([]));
    if (!localStorage.getItem('barang')) localStorage.setItem('barang', JSON.stringify([]));
    if (!localStorage.getItem('supplier')) localStorage.setItem('supplier', JSON.stringify([]));
    if (!localStorage.getItem('pembelian')) localStorage.setItem('pembelian', JSON.stringify([]));
    if (!localStorage.getItem('penjualan')) localStorage.setItem('penjualan', JSON.stringify([]));
    if (!localStorage.getItem('stokOpname')) localStorage.setItem('stokOpname', JSON.stringify([]));
    
    // Initialize Saldo Awal Periode keys
    if (!localStorage.getItem('saldoAwalPeriode')) localStorage.setItem('saldoAwalPeriode', 'null');
    if (!localStorage.getItem('periodeAktif')) localStorage.setItem('periodeAktif', 'false');
    if (!localStorage.getItem('piutangAwal')) localStorage.setItem('piutangAwal', JSON.stringify([]));
    if (!localStorage.getItem('hutangAwal')) localStorage.setItem('hutangAwal', JSON.stringify([]));
    
    // Initialize Pengajuan Modal Kasir
    if (typeof initializePengajuanModalData === 'function') {
        initializePengajuanModalData();
    }
}

function getDefaultCOA() {
    return [
        { kode: '1-1000', nama: 'Kas', tipe: 'Aset', saldo: 0 },
        { kode: '1-1100', nama: 'Bank', tipe: 'Aset', saldo: 0 },
        { kode: '1-1200', nama: 'Piutang Anggota', tipe: 'Aset', saldo: 0 },
        { kode: '1-1300', nama: 'Persediaan Barang', tipe: 'Aset', saldo: 0 },
        { kode: '2-1000', nama: 'Hutang Supplier', tipe: 'Kewajiban', saldo: 0 },
        { kode: '2-1100', nama: 'Simpanan Pokok', tipe: 'Kewajiban', saldo: 0 },
        { kode: '2-1200', nama: 'Simpanan Wajib', tipe: 'Kewajiban', saldo: 0 },
        { kode: '2-1300', nama: 'Simpanan Sukarela', tipe: 'Kewajiban', saldo: 0 },
        { kode: '3-1000', nama: 'Modal Koperasi', tipe: 'Modal', saldo: 0 },
        { kode: '3-2000', nama: 'Laba Ditahan', tipe: 'Modal', saldo: 0 },
        { kode: '4-1000', nama: 'Pendapatan Penjualan', tipe: 'Pendapatan', saldo: 0 },
        { kode: '4-2000', nama: 'Pendapatan Bunga Pinjaman', tipe: 'Pendapatan', saldo: 0 },
        { kode: '5-1000', nama: 'Harga Pokok Penjualan', tipe: 'Beban', saldo: 0 },
        { kode: '5-2000', nama: 'Beban Operasional', tipe: 'Beban', saldo: 0 }
    ];
}

function showLoginPage() {
    document.getElementById('loginPage').classList.remove('d-none');
    document.getElementById('mainApp').classList.add('d-none');
}

function showMainApp() {
    document.getElementById('loginPage').classList.add('d-none');
    document.getElementById('mainApp').classList.remove('d-none');
    
    document.getElementById('currentUser').textContent = currentUser.name;
    document.getElementById('currentRole').textContent = getRoleName(currentUser.role);
    
    // Update navbar with logo and name
    updateNavbarLogo();
    
    // Update mobile user display
    updateMobileUserDisplay();
    
    // Initialize sidebar toggle
    initializeSidebarToggle();
    
    // Initialize notification UI
    if (typeof initializeNotificationUI === 'function') {
        initializeNotificationUI();
    }
    
    // Start notification polling
    if (typeof startNotificationPolling === 'function') {
        startNotificationPolling();
    }
    
    renderMenu();
    navigateTo('dashboard');
}

function updateNavbarLogo() {
    const koperasi = JSON.parse(localStorage.getItem('koperasi'));
    const navbarLogo = document.getElementById('navbarLogo');
    const navbarName = document.getElementById('navbarKoperasiName');
    
    if (koperasi.logo) {
        navbarLogo.innerHTML = `<img src="${koperasi.logo}" alt="Logo" style="width: 40px; height: 40px; object-fit: contain; border-radius: 8px; background: white; padding: 2px;">`;
    }
    
    if (koperasi.nama) {
        navbarName.textContent = koperasi.nama;
    }
}

function getRoleName(role) {
    const roles = {
        'super_admin': 'Super Admin',
        'administrator': 'Administrator',
        'keuangan': 'Admin Keuangan',
        'kasir': 'Kasir'
    };
    return roles[role] || role;
}

function ensureSuperAdminExists() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const hasSuperAdmin = users.some(u => u.role === 'super_admin');
    
    if (!hasSuperAdmin) {
        const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        users.push({
            id: newId,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        });
        localStorage.setItem('users', JSON.stringify(users));
        console.log('Super Admin account created during upgrade');
    }
}

function logout() {
    // Clear session storage for jurnal filter
    if (typeof clearFilterFromSession === 'function') {
        clearFilterFromSession();
    }
    
    localStorage.removeItem('currentUser');
    currentUser = null;
    showLoginPage();
}

function navigateTo(page) {
    currentPage = page;
    renderPage(page);
    updateActiveMenu(page);
}

function updateActiveMenu(page) {
    document.querySelectorAll('#menuList .nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === page) {
            link.classList.add('active');
        }
    });
}

// Utility Functions
function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function showAlert(message, type = 'success') {
    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'danger': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    }[type] || 'alert-success';
    
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert.fixed-top');
    existingAlerts.forEach(alert => alert.remove());
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${alertClass} alert-dismissible fade show fixed-top`;
    alertDiv.style.zIndex = '9999';
    alertDiv.style.margin = '10px';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Try to find the best container
    const container = document.getElementById('mainContent') || 
                     document.getElementById('content') || 
                     document.body;
    
    if (container === document.body) {
        document.body.appendChild(alertDiv);
    } else {
        container.insertBefore(alertDiv, container.firstChild);
    }
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}


// Mobile Sidebar Toggle
function initializeSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (sidebarToggle && sidebar && sidebarOverlay) {
        // Toggle sidebar
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('show');
            sidebarOverlay.classList.toggle('show');
        });
        
        // Close sidebar when overlay clicked
        sidebarOverlay.addEventListener('click', function() {
            sidebar.classList.remove('show');
            sidebarOverlay.classList.remove('show');
        });
        
        // Close sidebar when menu item clicked (mobile only)
        const menuLinks = sidebar.querySelectorAll('.nav-link');
        menuLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth < 992) {
                    sidebar.classList.remove('show');
                    sidebarOverlay.classList.remove('show');
                }
            });
        });
    }
}

// Update currentUserMobile
function updateMobileUserDisplay() {
    const currentUserMobile = document.getElementById('currentUserMobile');
    if (currentUserMobile && currentUser) {
        // Show only first name on mobile
        const firstName = currentUser.name.split(' ')[0];
        currentUserMobile.textContent = firstName;
    }
}


// Generate Nomor Transaksi POS yang Fleksibel
function generateNoTransaksi(prefix = 'TRX') {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // 2 digit tahun
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    // Get counter untuk hari ini
    const dateKey = `${year}${month}${day}`;
    const counterKey = `counter_${prefix}_${dateKey}`;
    let counter = parseInt(localStorage.getItem(counterKey) || '0') + 1;
    
    // Reset counter jika lebih dari 9999
    if (counter > 9999) counter = 1;
    
    // Save counter
    localStorage.setItem(counterKey, counter.toString());
    
    // Format: PREFIX-YYMMDD-HHMMSS-NNNN
    // Contoh: TRX-241122-143025-0001
    const noTransaksi = `${prefix}-${year}${month}${day}-${hours}${minutes}${seconds}-${String(counter).padStart(4, '0')}`;
    
    return noTransaksi;
}

// Generate Nomor Transaksi dengan format pendek
function generateNoTransaksiShort(prefix = 'TRX') {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // Get counter untuk hari ini
    const dateKey = `${year}${month}${day}`;
    const counterKey = `counter_${prefix}_${dateKey}`;
    let counter = parseInt(localStorage.getItem(counterKey) || '0') + 1;
    
    // Reset counter jika lebih dari 9999
    if (counter > 9999) counter = 1;
    
    // Save counter
    localStorage.setItem(counterKey, counter.toString());
    
    // Format: PREFIX-YYMMDD-NNNN
    // Contoh: TRX-241122-0001
    const noTransaksi = `${prefix}-${year}${month}${day}-${String(counter).padStart(4, '0')}`;
    
    return noTransaksi;
}

// Generate Nomor untuk berbagai jenis transaksi
function generateNoByType(type) {
    const prefixMap = {
        'penjualan': 'TRX',
        'pembelian': 'PB',
        'simpanan': 'SMP',
        'pinjaman': 'PJM',
        'shift': 'SFT',
        'faktur': 'FKT'
    };
    
    const prefix = prefixMap[type] || 'DOC';
    return generateNoTransaksiShort(prefix);
}

// Reset counter (untuk testing atau awal bulan)
function resetCounter(prefix = 'TRX', date = null) {
    const now = date || new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateKey = `${year}${month}${day}`;
    const counterKey = `counter_${prefix}_${dateKey}`;
    
    localStorage.removeItem(counterKey);
    console.log(`Counter ${counterKey} has been reset`);
}

// Get counter saat ini
function getCurrentCounter(prefix = 'TRX') {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateKey = `${year}${month}${day}`;
    const counterKey = `counter_${prefix}_${dateKey}`;
    
    return parseInt(localStorage.getItem(counterKey) || '0');
}
