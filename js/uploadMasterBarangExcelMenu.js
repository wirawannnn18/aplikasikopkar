/**
 * Upload Master Barang Excel Menu Integration
 * This script adds the upload master barang excel menu item to the existing menu structure
 */

// Function to add upload master barang excel menu to existing menus
function addUploadMasterBarangExcelMenu() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addUploadMasterBarangExcelMenu);
        return;
    }
    
    // Override the original renderMenu function to include our new menu item
    if (typeof renderMenu === 'function') {
        const originalRenderMenu = renderMenu;
        
        window.renderMenu = function() {
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
                    { icon: 'bi-file-excel', text: 'Upload Master Barang Excel', page: 'upload-master-barang-excel' },
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
                    { icon: 'bi-file-excel', text: 'Upload Master Barang Excel', page: 'upload-master-barang-excel' },
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
        };
    }
}

// Initialize the menu integration
addUploadMasterBarangExcelMenu();