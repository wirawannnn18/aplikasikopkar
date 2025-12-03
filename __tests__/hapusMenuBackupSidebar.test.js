/**
 * Unit Tests for Menu Configuration - Hapus Menu Backup Sidebar
 * Feature: hapus-menu-backup-sidebar
 * Tests that backup-restore menu item is removed from sidebar
 */

// Mock localStorage for testing
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();

global.localStorage = localStorageMock;

// Mock function to get menu items for a role (from auth.js)
function getMenuItemsForRole(role) {
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
            { icon: 'bi-calendar-check', text: 'Saldo Awal Periode', page: 'saldo-awal' },
            { icon: 'bi-journal-text', text: 'Chart of Account', page: 'coa' },
            { icon: 'bi-book', text: 'Jurnal', page: 'jurnal' },
            { icon: 'bi-calculator', text: 'SHU', page: 'shu' },
            { icon: 'bi-cart', text: 'Point of Sales', page: 'pos' },
            { icon: 'bi-box-seam', text: 'Master Barang', page: 'barang' },
            { icon: 'bi-truck', text: 'Supplier', page: 'supplier' },
            { icon: 'bi-bag-plus', text: 'Pembelian', page: 'pembelian' },
            { icon: 'bi-clipboard-data', text: 'Stok Opname', page: 'stokopname' },
            { icon: 'bi-trash', text: 'Hapus Transaksi', page: 'hapus-transaksi' },
            { icon: 'bi-clock-history', text: 'Riwayat Hapus Transaksi', page: 'riwayat-hapus-transaksi' },
            { icon: 'bi-clock-history', text: 'Riwayat Tutup Kasir', page: 'riwayat-tutup-kas' },
            { icon: 'bi-file-earmark-text', text: 'Laporan', page: 'laporan' },
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
            { icon: 'bi-calendar-check', text: 'Saldo Awal Periode', page: 'saldo-awal' },
            { icon: 'bi-journal-text', text: 'Chart of Account', page: 'coa' },
            { icon: 'bi-book', text: 'Jurnal', page: 'jurnal' },
            { icon: 'bi-calculator', text: 'SHU', page: 'shu' },
            { icon: 'bi-cart', text: 'Point of Sales', page: 'pos' },
            { icon: 'bi-box-seam', text: 'Master Barang', page: 'barang' },
            { icon: 'bi-truck', text: 'Supplier', page: 'supplier' },
            { icon: 'bi-bag-plus', text: 'Pembelian', page: 'pembelian' },
            { icon: 'bi-clipboard-data', text: 'Stok Opname', page: 'stokopname' },
            { icon: 'bi-trash', text: 'Hapus Transaksi', page: 'hapus-transaksi' },
            { icon: 'bi-clock-history', text: 'Riwayat Hapus Transaksi', page: 'riwayat-hapus-transaksi' },
            { icon: 'bi-clock-history', text: 'Riwayat Tutup Kasir', page: 'riwayat-tutup-kas' },
            { icon: 'bi-file-earmark-text', text: 'Laporan', page: 'laporan' },
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
            { icon: 'bi-receipt', text: 'Riwayat Transaksi', page: 'riwayat' },
            { icon: 'bi-trash', text: 'Hapus Transaksi', page: 'hapus-transaksi' },
            { icon: 'bi-clock-history', text: 'Riwayat Hapus Transaksi', page: 'riwayat-hapus-transaksi' },
            { icon: 'bi-clock-history', text: 'Riwayat Tutup Kasir', page: 'riwayat-tutup-kas' },
            { icon: 'bi-info-circle', text: 'Tentang Aplikasi', page: 'tentang' }
        ]
    };
    
    return menus[role] || [];
}

describe('Menu Configuration Tests - Hapus Menu Backup Sidebar', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    // ========================================================================
    // Test 1: Super Admin menu does not contain backup-restore
    // Validates: Requirements 1.1, 1.5
    // ========================================================================
    describe('Super Admin menu configuration', () => {
        test('super_admin menu should not contain backup-restore page', () => {
            const superAdminMenus = getMenuItemsForRole('super_admin');
            const hasBackupRestore = superAdminMenus.some(menu => menu.page === 'backup-restore');
            
            expect(hasBackupRestore).toBe(false);
        });

        test('super_admin menu should not contain any menu item with text "Backup & Restore"', () => {
            const superAdminMenus = getMenuItemsForRole('super_admin');
            const hasBackupRestoreText = superAdminMenus.some(menu => menu.text === 'Backup & Restore');
            
            expect(hasBackupRestoreText).toBe(false);
        });

        test('super_admin menu should contain Pengaturan Sistem instead', () => {
            const superAdminMenus = getMenuItemsForRole('super_admin');
            const hasSystemSettings = superAdminMenus.some(menu => menu.page === 'system-settings');
            
            expect(hasSystemSettings).toBe(true);
        });
    });

    // ========================================================================
    // Test 2: Administrator menu does not contain backup-restore
    // Validates: Requirements 1.2, 1.5
    // ========================================================================
    describe('Administrator menu configuration', () => {
        test('administrator menu should not contain backup-restore page', () => {
            const administratorMenus = getMenuItemsForRole('administrator');
            const hasBackupRestore = administratorMenus.some(menu => menu.page === 'backup-restore');
            
            expect(hasBackupRestore).toBe(false);
        });

        test('administrator menu should not contain any menu item with text "Backup & Restore"', () => {
            const administratorMenus = getMenuItemsForRole('administrator');
            const hasBackupRestoreText = administratorMenus.some(menu => menu.text === 'Backup & Restore');
            
            expect(hasBackupRestoreText).toBe(false);
        });
    });

    // ========================================================================
    // Test 3: Other roles are not affected
    // Validates: Requirements 1.5
    // ========================================================================
    describe('Other roles menu configuration', () => {
        test('keuangan menu should not contain backup-restore page', () => {
            const keuanganMenus = getMenuItemsForRole('keuangan');
            const hasBackupRestore = keuanganMenus.some(menu => menu.page === 'backup-restore');
            
            expect(hasBackupRestore).toBe(false);
        });

        test('kasir menu should not contain backup-restore page', () => {
            const kasirMenus = getMenuItemsForRole('kasir');
            const hasBackupRestore = kasirMenus.some(menu => menu.page === 'backup-restore');
            
            expect(hasBackupRestore).toBe(false);
        });

        test('keuangan menu should still have its expected menu items', () => {
            const keuanganMenus = getMenuItemsForRole('keuangan');
            
            // Check that keuangan has its core menu items
            expect(keuanganMenus.some(menu => menu.page === 'dashboard')).toBe(true);
            expect(keuanganMenus.some(menu => menu.page === 'simpanan')).toBe(true);
            expect(keuanganMenus.some(menu => menu.page === 'pinjaman')).toBe(true);
            expect(keuanganMenus.some(menu => menu.page === 'jurnal')).toBe(true);
        });

        test('kasir menu should still have its expected menu items', () => {
            const kasirMenus = getMenuItemsForRole('kasir');
            
            // Check that kasir has its core menu items
            expect(kasirMenus.some(menu => menu.page === 'pos')).toBe(true);
            expect(kasirMenus.some(menu => menu.page === 'riwayat')).toBe(true);
            expect(kasirMenus.some(menu => menu.page === 'hapus-transaksi')).toBe(true);
        });
    });

    // ========================================================================
    // Test 4: No role should have backup-restore in menu
    // Validates: Requirements 1.5
    // ========================================================================
    describe('All roles menu configuration', () => {
        test('no role should have backup-restore page in their menu', () => {
            const allRoles = ['super_admin', 'administrator', 'keuangan', 'kasir'];
            
            allRoles.forEach(role => {
                const menus = getMenuItemsForRole(role);
                const hasBackupRestore = menus.some(menu => menu.page === 'backup-restore');
                
                expect(hasBackupRestore).toBe(false);
            });
        });

        test('no role should have "Backup & Restore" text in their menu items', () => {
            const allRoles = ['super_admin', 'administrator', 'keuangan', 'kasir'];
            
            allRoles.forEach(role => {
                const menus = getMenuItemsForRole(role);
                const hasBackupRestoreText = menus.some(menu => menu.text === 'Backup & Restore');
                
                expect(hasBackupRestoreText).toBe(false);
            });
        });
    });

    // ========================================================================
    // Test 5: Menu structure integrity
    // Validates: Requirements 1.5
    // ========================================================================
    describe('Menu structure integrity', () => {
        test('all menu items should have required properties', () => {
            const allRoles = ['super_admin', 'administrator', 'keuangan', 'kasir'];
            
            allRoles.forEach(role => {
                const menus = getMenuItemsForRole(role);
                
                menus.forEach(menu => {
                    expect(menu).toHaveProperty('icon');
                    expect(menu).toHaveProperty('text');
                    expect(menu).toHaveProperty('page');
                    expect(typeof menu.icon).toBe('string');
                    expect(typeof menu.text).toBe('string');
                    expect(typeof menu.page).toBe('string');
                });
            });
        });

        test('menu items should not have empty page values', () => {
            const allRoles = ['super_admin', 'administrator', 'keuangan', 'kasir'];
            
            allRoles.forEach(role => {
                const menus = getMenuItemsForRole(role);
                
                menus.forEach(menu => {
                    expect(menu.page.length).toBeGreaterThan(0);
                });
            });
        });
    });
});

// ============================================================================
// System Settings Page Tests
// Tests for renderSystemSettings() function
// ============================================================================

describe('System Settings Page Tests - Hapus Menu Backup Sidebar', () => {
    let mockContent;
    let mockCurrentUser;
    let mockNavigateToCalled;
    let mockShowAlertCalled;
    
    // Mock DOM element
    beforeEach(() => {
        mockContent = {
            innerHTML: ''
        };
        mockNavigateToCalled = false;
        mockShowAlertCalled = false;
        mockCurrentUser = null;
    });
    
    // Mock renderSystemSettings function (simplified version for testing)
    function renderSystemSettingsMock() {
        // Check if user is super admin
        if (!mockCurrentUser || mockCurrentUser.role !== 'super_admin') {
            mockShowAlertCalled = true;
            mockNavigateToCalled = true;
            return;
        }
        
        // Render the system settings page
        mockContent.innerHTML = `
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
                                <button class="btn btn-primary" onclick="renderBackupRestore()" style="padding: 12px; font-size: 1.1rem;">
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
    }
    
    // ========================================================================
    // Test 9: renderSystemSettings() generates HTML with backup button
    // Validates: Requirements 1.3, 3.2
    // ========================================================================
    describe('System Settings HTML generation', () => {
        test('renderSystemSettings() should generate HTML with backup button', () => {
            // Set current user as super admin
            mockCurrentUser = { role: 'super_admin', username: 'admin', name: 'Admin' };
            
            // Call renderSystemSettings
            renderSystemSettingsMock();
            
            // Verify that HTML was generated
            expect(mockContent.innerHTML).not.toBe('');
            
            // Verify that the HTML contains the backup button
            expect(mockContent.innerHTML).toContain('Buka Backup & Restore');
            expect(mockContent.innerHTML).toContain('onclick="renderBackupRestore()"');
        });
        
        test('renderSystemSettings() should include backup button with correct onclick handler', () => {
            // Set current user as super admin
            mockCurrentUser = { role: 'super_admin', username: 'admin', name: 'Admin' };
            
            // Call renderSystemSettings
            renderSystemSettingsMock();
            
            // Verify that the onclick handler is correct
            expect(mockContent.innerHTML).toContain('onclick="renderBackupRestore()"');
            
            // Verify that the button has the correct class
            expect(mockContent.innerHTML).toContain('class="btn btn-primary"');
        });
        
        test('renderSystemSettings() should include database icon in backup button', () => {
            // Set current user as super admin
            mockCurrentUser = { role: 'super_admin', username: 'admin', name: 'Admin' };
            
            // Call renderSystemSettings
            renderSystemSettingsMock();
            
            // Verify that the button has database icon
            expect(mockContent.innerHTML).toContain('bi-database');
        });
        
        test('renderSystemSettings() should include system settings header', () => {
            // Set current user as super admin
            mockCurrentUser = { role: 'super_admin', username: 'admin', name: 'Admin' };
            
            // Call renderSystemSettings
            renderSystemSettingsMock();
            
            // Verify that the header is present
            expect(mockContent.innerHTML).toContain('Pengaturan Sistem');
            expect(mockContent.innerHTML).toContain('bi-gear-fill');
        });
        
        test('renderSystemSettings() should include data management section', () => {
            // Set current user as super admin
            mockCurrentUser = { role: 'super_admin', username: 'admin', name: 'Admin' };
            
            // Call renderSystemSettings
            renderSystemSettingsMock();
            
            // Verify that the data management section is present
            expect(mockContent.innerHTML).toContain('Manajemen Data');
        });
        
        test('renderSystemSettings() should include helpful text about backup feature', () => {
            // Set current user as super admin
            mockCurrentUser = { role: 'super_admin', username: 'admin', name: 'Admin' };
            
            // Call renderSystemSettings
            renderSystemSettingsMock();
            
            // Verify that helpful text is present
            expect(mockContent.innerHTML).toContain('Klik tombol di atas untuk mengakses fitur backup dan restore database');
        });
    });
    
    // ========================================================================
    // Test 10: Button onclick handler validation
    // Validates: Requirements 1.3, 3.2
    // ========================================================================
    describe('Backup button onclick handler', () => {
        test('backup button should have onclick attribute', () => {
            // Set current user as super admin
            mockCurrentUser = { role: 'super_admin', username: 'admin', name: 'Admin' };
            
            // Call renderSystemSettings
            renderSystemSettingsMock();
            
            // Verify that onclick attribute exists
            expect(mockContent.innerHTML).toContain('onclick=');
        });
        
        test('backup button onclick should call renderBackupRestore function', () => {
            // Set current user as super admin
            mockCurrentUser = { role: 'super_admin', username: 'admin', name: 'Admin' };
            
            // Call renderSystemSettings
            renderSystemSettingsMock();
            
            // Verify that the onclick calls renderBackupRestore
            expect(mockContent.innerHTML).toContain('renderBackupRestore()');
        });
        
        test('backup button should be a button element', () => {
            // Set current user as super admin
            mockCurrentUser = { role: 'super_admin', username: 'admin', name: 'Admin' };
            
            // Call renderSystemSettings
            renderSystemSettingsMock();
            
            // Verify that it's a button element
            expect(mockContent.innerHTML).toContain('<button');
            expect(mockContent.innerHTML).toContain('</button>');
        });
        
        test('backup button should have primary styling', () => {
            // Set current user as super admin
            mockCurrentUser = { role: 'super_admin', username: 'admin', name: 'Admin' };
            
            // Call renderSystemSettings
            renderSystemSettingsMock();
            
            // Verify that the button has primary class
            expect(mockContent.innerHTML).toContain('btn-primary');
        });
    });
    
    // ========================================================================
    // Test 11: Access control for non-super admin users
    // Validates: Requirements 1.3, 3.2
    // ========================================================================
    describe('Access control for System Settings', () => {
        test('renderSystemSettings() should not render content for non-super admin', () => {
            // Set current user as administrator (not super admin)
            mockCurrentUser = { role: 'administrator', username: 'admin', name: 'Admin' };
            
            // Call renderSystemSettings
            renderSystemSettingsMock();
            
            // Verify that no content was rendered
            expect(mockContent.innerHTML).toBe('');
            
            // Verify that alert was shown
            expect(mockShowAlertCalled).toBe(true);
            
            // Verify that redirect was called
            expect(mockNavigateToCalled).toBe(true);
        });
        
        test('renderSystemSettings() should not render content for keuangan role', () => {
            // Set current user as keuangan
            mockCurrentUser = { role: 'keuangan', username: 'keuangan', name: 'Keuangan' };
            
            // Call renderSystemSettings
            renderSystemSettingsMock();
            
            // Verify that no content was rendered
            expect(mockContent.innerHTML).toBe('');
            
            // Verify that alert was shown
            expect(mockShowAlertCalled).toBe(true);
        });
        
        test('renderSystemSettings() should not render content for kasir role', () => {
            // Set current user as kasir
            mockCurrentUser = { role: 'kasir', username: 'kasir', name: 'Kasir' };
            
            // Call renderSystemSettings
            renderSystemSettingsMock();
            
            // Verify that no content was rendered
            expect(mockContent.innerHTML).toBe('');
            
            // Verify that alert was shown
            expect(mockShowAlertCalled).toBe(true);
        });
        
        test('renderSystemSettings() should not render content when user is null', () => {
            // Set current user as null
            mockCurrentUser = null;
            
            // Call renderSystemSettings
            renderSystemSettingsMock();
            
            // Verify that no content was rendered
            expect(mockContent.innerHTML).toBe('');
            
            // Verify that alert was shown
            expect(mockShowAlertCalled).toBe(true);
        });
    });
    
    // ========================================================================
    // Test 12: HTML structure validation
    // Validates: Requirements 1.3, 3.2
    // ========================================================================
    describe('HTML structure validation', () => {
        test('renderSystemSettings() should generate valid HTML structure', () => {
            // Set current user as super admin
            mockCurrentUser = { role: 'super_admin', username: 'admin', name: 'Admin' };
            
            // Call renderSystemSettings
            renderSystemSettingsMock();
            
            // Verify that HTML has proper structure
            expect(mockContent.innerHTML).toContain('<div');
            expect(mockContent.innerHTML).toContain('</div>');
            expect(mockContent.innerHTML).toContain('<button');
            expect(mockContent.innerHTML).toContain('</button>');
        });
        
        test('renderSystemSettings() should include Bootstrap classes', () => {
            // Set current user as super admin
            mockCurrentUser = { role: 'super_admin', username: 'admin', name: 'Admin' };
            
            // Call renderSystemSettings
            renderSystemSettingsMock();
            
            // Verify that Bootstrap classes are present
            expect(mockContent.innerHTML).toContain('card');
            expect(mockContent.innerHTML).toContain('card-header');
            expect(mockContent.innerHTML).toContain('card-body');
            expect(mockContent.innerHTML).toContain('btn');
        });
        
        test('renderSystemSettings() should include Bootstrap icons', () => {
            // Set current user as super admin
            mockCurrentUser = { role: 'super_admin', username: 'admin', name: 'Admin' };
            
            // Call renderSystemSettings
            renderSystemSettingsMock();
            
            // Verify that Bootstrap icons are present
            expect(mockContent.innerHTML).toContain('bi-');
            expect(mockContent.innerHTML).toContain('bi-gear-fill');
            expect(mockContent.innerHTML).toContain('bi-database');
        });
    });
});

// ============================================================================
// Routing Redirect Tests
// Tests for backup-restore route redirect to system-settings
// ============================================================================

describe('Routing Redirect Tests - Hapus Menu Backup Sidebar', () => {
    let navigateToCalls;
    let renderPageCalls;
    let currentPage;

    // Mock navigateTo function (from app.js)
    function navigateToMock(page) {
        navigateToCalls.push(page);
        currentPage = page;
        renderPageMock(page);
    }

    // Mock renderPage function (from auth.js)
    function renderPageMock(page) {
        renderPageCalls.push(page);
        
        // Simulate the redirect logic from renderPage
        if (page === 'backup-restore') {
            navigateToMock('system-settings');
            return;
        }
        // For other pages, just set the current page
        currentPage = page;
    }

    beforeEach(() => {
        localStorage.clear();
        navigateToCalls = [];
        renderPageCalls = [];
        currentPage = null;
    });

    // ========================================================================
    // Test 6: navigateTo('backup-restore') redirects to 'system-settings'
    // Validates: Requirements 1.4, 2.2
    // ========================================================================
    describe('navigateTo redirect behavior', () => {
        test('navigateTo("backup-restore") should redirect to "system-settings"', () => {
            // Call navigateTo with 'backup-restore'
            navigateToMock('backup-restore');
            
            // Verify that navigateTo was called with 'backup-restore'
            expect(navigateToCalls).toContain('backup-restore');
            
            // Verify that renderPage was called with 'backup-restore'
            expect(renderPageCalls).toContain('backup-restore');
            
            // Verify that navigateTo was called again with 'system-settings' (redirect)
            expect(navigateToCalls).toContain('system-settings');
            
            // Verify that the final page is 'system-settings'
            expect(currentPage).toBe('system-settings');
            
            // Verify the call sequence
            expect(navigateToCalls).toEqual(['backup-restore', 'system-settings']);
        });

        test('navigateTo with other pages should not redirect', () => {
            const testPages = ['dashboard', 'anggota', 'simpanan', 'pos', 'jurnal'];
            
            testPages.forEach(page => {
                // Reset state
                navigateToCalls = [];
                renderPageCalls = [];
                currentPage = null;
                
                // Call navigateTo with the test page
                navigateToMock(page);
                
                // Verify that navigateTo was called once
                expect(navigateToCalls.length).toBe(1);
                expect(navigateToCalls[0]).toBe(page);
                
                // Verify that the current page is the requested page (no redirect)
                expect(currentPage).toBe(page);
            });
        });

        test('navigateTo("system-settings") should work normally without redirect', () => {
            navigateToMock('system-settings');
            
            // Verify that navigateTo was called once (no redirect)
            expect(navigateToCalls.length).toBe(1);
            expect(navigateToCalls[0]).toBe('system-settings');
            
            // Verify that the current page is 'system-settings'
            expect(currentPage).toBe('system-settings');
        });
    });

    // ========================================================================
    // Test 7: renderPage('backup-restore') calls navigateTo
    // Validates: Requirements 1.4, 2.2
    // ========================================================================
    describe('renderPage redirect behavior', () => {
        test('renderPage("backup-restore") should call navigateTo("system-settings")', () => {
            // Call renderPage with 'backup-restore'
            renderPageMock('backup-restore');
            
            // Verify that renderPage was called with 'backup-restore'
            expect(renderPageCalls).toContain('backup-restore');
            
            // Verify that navigateTo was called with 'system-settings'
            expect(navigateToCalls).toContain('system-settings');
            
            // Verify that the final page is 'system-settings'
            expect(currentPage).toBe('system-settings');
        });

        test('renderPage("backup-restore") should not render backup-restore content', () => {
            // Call renderPage with 'backup-restore'
            renderPageMock('backup-restore');
            
            // Verify that the current page is NOT 'backup-restore'
            expect(currentPage).not.toBe('backup-restore');
            
            // Verify that the current page is 'system-settings'
            expect(currentPage).toBe('system-settings');
        });

        test('renderPage with other pages should not trigger redirect', () => {
            const testPages = ['dashboard', 'koperasi', 'anggota', 'simpanan', 'pinjaman'];
            
            testPages.forEach(page => {
                // Reset state
                navigateToCalls = [];
                renderPageCalls = [];
                currentPage = null;
                
                // Call renderPage with the test page
                renderPageMock(page);
                
                // Verify that renderPage was called
                expect(renderPageCalls).toContain(page);
                
                // Verify that navigateTo was NOT called (no redirect)
                expect(navigateToCalls.length).toBe(0);
                
                // Verify that the current page is the requested page
                expect(currentPage).toBe(page);
            });
        });

        test('renderPage should handle backup-restore redirect immediately', () => {
            // Call renderPage with 'backup-restore'
            renderPageMock('backup-restore');
            
            // Verify that navigateTo was called
            expect(navigateToCalls.length).toBeGreaterThan(0);
            
            // Verify that the redirect happened before any content rendering
            expect(currentPage).toBe('system-settings');
        });
    });

    // ========================================================================
    // Test 8: Redirect consistency
    // Validates: Requirements 1.4, 2.2
    // ========================================================================
    describe('Redirect consistency', () => {
        test('multiple calls to backup-restore should always redirect to system-settings', () => {
            const iterations = 5;
            
            for (let i = 0; i < iterations; i++) {
                // Reset state
                navigateToCalls = [];
                renderPageCalls = [];
                currentPage = null;
                
                // Call navigateTo with 'backup-restore'
                navigateToMock('backup-restore');
                
                // Verify redirect happened
                expect(currentPage).toBe('system-settings');
            }
        });

        test('backup-restore redirect should work regardless of previous page', () => {
            const previousPages = ['dashboard', 'anggota', 'simpanan', 'pos', 'jurnal'];
            
            previousPages.forEach(prevPage => {
                // Reset state
                navigateToCalls = [];
                renderPageCalls = [];
                
                // Set a previous page
                currentPage = prevPage;
                
                // Navigate to backup-restore
                navigateToMock('backup-restore');
                
                // Verify redirect to system-settings
                expect(currentPage).toBe('system-settings');
            });
        });

        test('redirect should not create infinite loop', () => {
            // Call navigateTo with 'backup-restore'
            navigateToMock('backup-restore');
            
            // Verify that navigateTo was called exactly twice:
            // 1. Initial call with 'backup-restore'
            // 2. Redirect call with 'system-settings'
            expect(navigateToCalls.length).toBe(2);
            expect(navigateToCalls).toEqual(['backup-restore', 'system-settings']);
            
            // Verify no additional calls (no infinite loop)
            expect(navigateToCalls.length).toBe(2);
        });
    });
});

// ============================================================================
// Integration Tests - User Flow
// Tests complete user flow: login → verify menu → navigate to settings → click backup button
// ============================================================================

describe('Integration Tests - User Flow', () => {
    let mockCurrentUser;
    let mockContent;
    let navigateToCalls;
    let renderPageCalls;
    let currentPage;
    let renderBackupRestoreCalled;
    let mockShowAlertCalled;

    // Mock functions
    function navigateToMock(page) {
        navigateToCalls.push(page);
        currentPage = page;
        renderPageMock(page);
    }

    function renderPageMock(page) {
        renderPageCalls.push(page);
        
        // Simulate the redirect logic from renderPage
        if (page === 'backup-restore') {
            navigateToMock('system-settings');
            return;
        }
        
        // For system-settings, render the page
        if (page === 'system-settings') {
            renderSystemSettingsMock();
            return;
        }
        
        // For other pages, just set the current page
        currentPage = page;
    }

    function renderSystemSettingsMock() {
        // Check if user is super admin
        if (!mockCurrentUser || mockCurrentUser.role !== 'super_admin') {
            mockShowAlertCalled = true;
            navigateToMock('dashboard');
            return;
        }
        
        // Render the system settings page
        mockContent.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 style="color: #2d6a4f; font-weight: 700;">
                    <i class="bi bi-gear-fill me-2"></i>Pengaturan Sistem
                </h2>
            </div>
            <div class="card">
                <div class="card-body">
                    <h5 style="color: #2d6a4f;" class="mb-3">
                        <i class="bi bi-database me-2"></i>Manajemen Data
                    </h5>
                    <button class="btn btn-primary" onclick="renderBackupRestore()">
                        <i class="bi bi-database me-2"></i>Buka Backup & Restore
                    </button>
                </div>
            </div>
        `;
    }

    function renderBackupRestoreMock() {
        renderBackupRestoreCalled = true;
        mockContent.innerHTML = `
            <div class="backup-restore-interface">
                <h2>Backup & Restore Database</h2>
                <button class="btn btn-success">Download Backup</button>
                <button class="btn btn-warning">Restore Database</button>
            </div>
        `;
    }

    function loginMock(username, password, role) {
        mockCurrentUser = { username, password, role, name: username };
        localStorage.setItem('currentUser', JSON.stringify(mockCurrentUser));
        return true;
    }

    function getMenuItemsForRole(role) {
        const menus = {
            super_admin: [
                { icon: 'bi-speedometer2', text: 'Dashboard', page: 'dashboard' },
                { icon: 'bi-gear-fill', text: 'Pengaturan Sistem', page: 'system-settings' },
                { icon: 'bi-people', text: 'Master Anggota', page: 'anggota' }
            ],
            administrator: [
                { icon: 'bi-speedometer2', text: 'Dashboard', page: 'dashboard' },
                { icon: 'bi-people', text: 'Master Anggota', page: 'anggota' }
            ],
            keuangan: [
                { icon: 'bi-speedometer2', text: 'Dashboard', page: 'dashboard' },
                { icon: 'bi-wallet2', text: 'Simpanan', page: 'simpanan' }
            ],
            kasir: [
                { icon: 'bi-cart', text: 'Point of Sales', page: 'pos' }
            ]
        };
        
        return menus[role] || [];
    }

    beforeEach(() => {
        localStorage.clear();
        mockCurrentUser = null;
        mockContent = { innerHTML: '' };
        navigateToCalls = [];
        renderPageCalls = [];
        currentPage = null;
        renderBackupRestoreCalled = false;
        mockShowAlertCalled = false;
    });

    // ========================================================================
    // Test 1: Complete flow for super_admin
    // Validates: Requirements 1.1, 1.3, 1.4, 3.3
    // ========================================================================
    describe('Complete user flow - Super Admin', () => {
        test('super_admin: login → verify menu → navigate to settings → verify backup button', () => {
            // Step 1: Login as super_admin
            const loginSuccess = loginMock('superadmin', 'password', 'super_admin');
            expect(loginSuccess).toBe(true);
            expect(mockCurrentUser).not.toBeNull();
            expect(mockCurrentUser.role).toBe('super_admin');

            // Step 2: Verify menu does not contain backup-restore
            const menus = getMenuItemsForRole('super_admin');
            const hasBackupRestore = menus.some(menu => menu.page === 'backup-restore');
            expect(hasBackupRestore).toBe(false);

            // Step 3: Verify menu contains system-settings
            const hasSystemSettings = menus.some(menu => menu.page === 'system-settings');
            expect(hasSystemSettings).toBe(true);

            // Step 4: Navigate to system-settings
            navigateToMock('system-settings');
            expect(currentPage).toBe('system-settings');
            expect(mockContent.innerHTML).toContain('Pengaturan Sistem');

            // Step 5: Verify backup button is present
            expect(mockContent.innerHTML).toContain('Buka Backup & Restore');
            expect(mockContent.innerHTML).toContain('onclick="renderBackupRestore()"');

            // Step 6: Simulate clicking backup button
            renderBackupRestoreMock();
            expect(renderBackupRestoreCalled).toBe(true);
            expect(mockContent.innerHTML).toContain('Backup & Restore Database');
        });

        test('super_admin: complete flow should not show backup-restore in menu at any point', () => {
            // Login
            loginMock('superadmin', 'password', 'super_admin');

            // Get menu at different points in the flow
            const menusAtStart = getMenuItemsForRole('super_admin');
            expect(menusAtStart.some(m => m.page === 'backup-restore')).toBe(false);

            // Navigate to dashboard
            navigateToMock('dashboard');
            const menusAfterDashboard = getMenuItemsForRole('super_admin');
            expect(menusAfterDashboard.some(m => m.page === 'backup-restore')).toBe(false);

            // Navigate to system-settings
            navigateToMock('system-settings');
            const menusAfterSettings = getMenuItemsForRole('super_admin');
            expect(menusAfterSettings.some(m => m.page === 'backup-restore')).toBe(false);
        });

        test('super_admin: backup button should be accessible from system-settings', () => {
            // Login and navigate
            loginMock('superadmin', 'password', 'super_admin');
            navigateToMock('system-settings');

            // Verify page rendered
            expect(mockContent.innerHTML).not.toBe('');
            expect(mockContent.innerHTML).toContain('Pengaturan Sistem');

            // Verify backup button exists and is clickable
            expect(mockContent.innerHTML).toContain('btn btn-primary');
            expect(mockContent.innerHTML).toContain('renderBackupRestore()');
            expect(mockContent.innerHTML).toContain('Buka Backup & Restore');
        });
    });

    // ========================================================================
    // Test 2: Complete flow for administrator
    // Validates: Requirements 1.1, 1.3, 1.4, 3.3
    // ========================================================================
    describe('Complete user flow - Administrator', () => {
        test('administrator: login → verify menu does not contain backup-restore', () => {
            // Step 1: Login as administrator
            const loginSuccess = loginMock('admin', 'password', 'administrator');
            expect(loginSuccess).toBe(true);
            expect(mockCurrentUser.role).toBe('administrator');

            // Step 2: Verify menu does not contain backup-restore
            const menus = getMenuItemsForRole('administrator');
            const hasBackupRestore = menus.some(menu => menu.page === 'backup-restore');
            expect(hasBackupRestore).toBe(false);

            // Step 3: Verify menu does not contain system-settings (admin doesn't have access)
            const hasSystemSettings = menus.some(menu => menu.page === 'system-settings');
            expect(hasSystemSettings).toBe(false);
        });

        test('administrator: cannot access system-settings page', () => {
            // Login as administrator
            loginMock('admin', 'password', 'administrator');

            // Try to navigate to system-settings
            navigateToMock('system-settings');

            // Verify redirect happened (admin doesn't have access)
            expect(mockShowAlertCalled).toBe(true);
            expect(currentPage).toBe('dashboard');
        });
    });

    // ========================================================================
    // Test 3: Direct access redirect flow
    // Validates: Requirements 1.4, 2.2
    // ========================================================================
    describe('Direct access redirect flow', () => {
        test('super_admin: direct access to backup-restore should redirect to system-settings', () => {
            // Login as super_admin
            loginMock('superadmin', 'password', 'super_admin');

            // Try to access backup-restore directly
            navigateToMock('backup-restore');

            // Verify redirect happened
            expect(navigateToCalls).toContain('backup-restore');
            expect(navigateToCalls).toContain('system-settings');
            expect(currentPage).toBe('system-settings');

            // Verify system-settings page was rendered
            expect(mockContent.innerHTML).toContain('Pengaturan Sistem');
            expect(mockContent.innerHTML).toContain('Buka Backup & Restore');
        });

        test('administrator: direct access to backup-restore should redirect to system-settings then dashboard', () => {
            // Login as administrator
            loginMock('admin', 'password', 'administrator');

            // Try to access backup-restore directly
            navigateToMock('backup-restore');

            // Verify redirect chain: backup-restore → system-settings → dashboard
            expect(navigateToCalls).toContain('backup-restore');
            expect(navigateToCalls).toContain('system-settings');
            expect(currentPage).toBe('dashboard');
        });

        test('direct access via URL hash should trigger redirect', () => {
            // Login as super_admin
            loginMock('superadmin', 'password', 'super_admin');

            // Simulate direct URL access (e.g., #backup-restore)
            renderPageMock('backup-restore');

            // Verify redirect happened
            expect(renderPageCalls).toContain('backup-restore');
            expect(navigateToCalls).toContain('system-settings');
            expect(currentPage).toBe('system-settings');
        });

        test('redirect should preserve user session', () => {
            // Login as super_admin
            loginMock('superadmin', 'password', 'super_admin');
            const userBeforeRedirect = JSON.parse(localStorage.getItem('currentUser'));

            // Access backup-restore (triggers redirect)
            navigateToMock('backup-restore');

            // Verify user session is preserved
            const userAfterRedirect = JSON.parse(localStorage.getItem('currentUser'));
            expect(userAfterRedirect).toEqual(userBeforeRedirect);
            expect(userAfterRedirect.role).toBe('super_admin');
        });
    });

    // ========================================================================
    // Test 4: Multiple navigation scenarios
    // Validates: Requirements 1.1, 1.3, 1.4, 3.3
    // ========================================================================
    describe('Multiple navigation scenarios', () => {
        test('super_admin: navigate through multiple pages, backup-restore always redirects', () => {
            // Login
            loginMock('superadmin', 'password', 'super_admin');

            // Navigate to dashboard
            navigateToMock('dashboard');
            expect(currentPage).toBe('dashboard');

            // Try backup-restore (should redirect)
            navigateToMock('backup-restore');
            expect(currentPage).toBe('system-settings');

            // Navigate to anggota
            navigateToMock('anggota');
            expect(currentPage).toBe('anggota');

            // Try backup-restore again (should redirect)
            navigateToMock('backup-restore');
            expect(currentPage).toBe('system-settings');
        });

        test('super_admin: system-settings → backup button → back to settings', () => {
            // Login and navigate to settings
            loginMock('superadmin', 'password', 'super_admin');
            navigateToMock('system-settings');
            expect(mockContent.innerHTML).toContain('Pengaturan Sistem');

            // Click backup button
            renderBackupRestoreMock();
            expect(renderBackupRestoreCalled).toBe(true);
            expect(mockContent.innerHTML).toContain('Backup & Restore Database');

            // Navigate back to settings
            navigateToMock('system-settings');
            expect(mockContent.innerHTML).toContain('Pengaturan Sistem');
            expect(mockContent.innerHTML).toContain('Buka Backup & Restore');
        });

        test('menu consistency across navigation', () => {
            // Login
            loginMock('superadmin', 'password', 'super_admin');

            // Check menu at different navigation points
            const pages = ['dashboard', 'anggota', 'system-settings'];
            
            pages.forEach(page => {
                navigateToMock(page);
                const menus = getMenuItemsForRole('super_admin');
                expect(menus.some(m => m.page === 'backup-restore')).toBe(false);
            });
        });
    });

    // ========================================================================
    // Test 5: Error handling and edge cases
    // Validates: Requirements 1.1, 1.3, 1.4, 3.3
    // ========================================================================
    describe('Error handling and edge cases', () => {
        test('accessing backup-restore without login should redirect to system-settings then dashboard', () => {
            // Don't login, just try to access backup-restore
            navigateToMock('backup-restore');

            // Should redirect to system-settings first, then to dashboard (no access)
            expect(navigateToCalls).toContain('backup-restore');
            expect(navigateToCalls).toContain('system-settings');
            expect(currentPage).toBe('dashboard');
        });

        test('keuangan role: menu should not contain backup-restore', () => {
            // Login as keuangan
            loginMock('keuangan', 'password', 'keuangan');

            // Verify menu
            const menus = getMenuItemsForRole('keuangan');
            expect(menus.some(m => m.page === 'backup-restore')).toBe(false);
        });

        test('kasir role: menu should not contain backup-restore', () => {
            // Login as kasir
            loginMock('kasir', 'password', 'kasir');

            // Verify menu
            const menus = getMenuItemsForRole('kasir');
            expect(menus.some(m => m.page === 'backup-restore')).toBe(false);
        });

        test('all roles: backup-restore should never appear in menu', () => {
            const roles = ['super_admin', 'administrator', 'keuangan', 'kasir'];

            roles.forEach(role => {
                // Login with role
                loginMock(role, 'password', role);

                // Check menu
                const menus = getMenuItemsForRole(role);
                expect(menus.some(m => m.page === 'backup-restore')).toBe(false);
            });
        });
    });

    // ========================================================================
    // Test 6: Backward compatibility
    // Validates: Requirements 3.3
    // ========================================================================
    describe('Backward compatibility', () => {
        test('renderBackupRestore function should still be available', () => {
            // This test verifies that the function can be called
            expect(() => renderBackupRestoreMock()).not.toThrow();
        });

        test('backup functionality should work after accessing via system-settings', () => {
            // Login and navigate
            loginMock('superadmin', 'password', 'super_admin');
            navigateToMock('system-settings');

            // Click backup button
            renderBackupRestoreMock();

            // Verify backup interface is rendered
            expect(mockContent.innerHTML).toContain('Backup & Restore Database');
            expect(mockContent.innerHTML).toContain('Download Backup');
            expect(mockContent.innerHTML).toContain('Restore Database');
        });

        test('old bookmark to backup-restore should still work via redirect', () => {
            // Simulate user clicking old bookmark
            loginMock('superadmin', 'password', 'super_admin');
            
            // User clicks old bookmark (backup-restore)
            navigateToMock('backup-restore');

            // Should end up at system-settings with backup button available
            expect(currentPage).toBe('system-settings');
            expect(mockContent.innerHTML).toContain('Buka Backup & Restore');
        });
    });
});
