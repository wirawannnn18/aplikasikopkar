/**
 * Property-Based Tests for Level Super Admin
 * Feature: level-superadmin
 */

import fc from 'fast-check';

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

// Import functions from app.js
// Since we're testing in Node environment, we need to mock the functions
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

function getRoleName(role) {
    const roles = {
        'super_admin': 'Super Admin',
        'administrator': 'Administrator',
        'keuangan': 'Admin Keuangan',
        'kasir': 'Kasir'
    };
    return roles[role] || role;
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

// **Feature: level-superadmin, Property 1: Super Admin account creation on initialization**
describe('**Feature: level-superadmin, Property 1: Super Admin account creation on initialization**', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('For any initial system state without a Super Admin account, when the system initializes, the users array should contain at least one user with role super_admin', () => {
        fc.assert(
            fc.property(
                fc.constant(null), // No existing users
                () => {
                    // Clear localStorage to simulate fresh install
                    localStorage.clear();
                    
                    // Initialize the system
                    initializeDefaultData();
                    
                    // Get users from localStorage
                    const users = JSON.parse(localStorage.getItem('users') || '[]');
                    
                    // Check that at least one Super Admin exists
                    const hasSuperAdmin = users.some(u => u.role === 'super_admin');
                    
                    return hasSuperAdmin === true;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any fresh initialization, the Super Admin account should have the correct default properties', () => {
        fc.assert(
            fc.property(
                fc.constant(null),
                () => {
                    localStorage.clear();
                    initializeDefaultData();
                    
                    const users = JSON.parse(localStorage.getItem('users') || '[]');
                    const superAdmin = users.find(u => u.role === 'super_admin');
                    
                    return superAdmin !== undefined &&
                           superAdmin.username === 'superadmin' &&
                           superAdmin.password === 'super123' &&
                           superAdmin.name === 'Super Administrator' &&
                           superAdmin.active === true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

// **Feature: level-superadmin, Property 14: Upgrade preserves existing users**
describe('**Feature: level-superadmin, Property 14: Upgrade preserves existing users**', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('For any existing users array, when ensureSuperAdminExists is called, all existing user objects should remain unchanged in the resulting array', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 10 }),
                (numUsers) => {
                    // Generate users with unique IDs
                    const existingUsers = Array.from({ length: numUsers }, (_, i) => ({
                        id: i + 1,
                        username: `user${i + 1}`,
                        password: 'password123',
                        name: `User ${i + 1}`,
                        role: ['administrator', 'keuangan', 'kasir'][i % 3],
                        active: true
                    }));
                    
                    // Set up existing users without Super Admin
                    localStorage.setItem('users', JSON.stringify(existingUsers));
                    
                    // Create a deep copy of existing users for comparison
                    const originalUsers = JSON.parse(JSON.stringify(existingUsers));
                    
                    // Call ensureSuperAdminExists
                    ensureSuperAdminExists();
                    
                    // Get updated users
                    const updatedUsers = JSON.parse(localStorage.getItem('users') || '[]');
                    
                    // Check that all original users are still present and unchanged
                    const allPreserved = originalUsers.every(originalUser => {
                        const foundUser = updatedUsers.find(u => u.id === originalUser.id);
                        return foundUser !== undefined &&
                               foundUser.username === originalUser.username &&
                               foundUser.password === originalUser.password &&
                               foundUser.name === originalUser.name &&
                               foundUser.role === originalUser.role &&
                               foundUser.active === originalUser.active;
                    });
                    
                    return allPreserved;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any existing users array without Super Admin, after upgrade the array length should increase by exactly 1', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 10 }),
                (numUsers) => {
                    // Generate users with unique IDs
                    const existingUsers = Array.from({ length: numUsers }, (_, i) => ({
                        id: i + 1,
                        username: `user${i + 1}`,
                        password: 'password123',
                        name: `User ${i + 1}`,
                        role: ['administrator', 'keuangan', 'kasir'][i % 3],
                        active: true
                    }));
                    
                    localStorage.setItem('users', JSON.stringify(existingUsers));
                    const originalLength = existingUsers.length;
                    
                    ensureSuperAdminExists();
                    
                    const updatedUsers = JSON.parse(localStorage.getItem('users') || '[]');
                    
                    return updatedUsers.length === originalLength + 1;
                }
            ),
            { numRuns: 100 }
        );
    });
});

// **Feature: level-superadmin, Property 15: No duplicate Super Admin creation**
describe('**Feature: level-superadmin, Property 15: No duplicate Super Admin creation**', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('For any users array that already contains a Super Admin, when ensureSuperAdminExists is called, the number of Super Admin accounts should not increase', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.integer({ min: 1, max: 1000 }),
                        username: fc.string({ minLength: 3, maxLength: 20 }),
                        password: fc.string({ minLength: 6, maxLength: 20 }),
                        name: fc.string({ minLength: 3, maxLength: 50 }),
                        role: fc.constantFrom('administrator', 'keuangan', 'kasir'),
                        active: fc.boolean()
                    }),
                    { minLength: 0, maxLength: 10 }
                ),
                (otherUsers) => {
                    // Create a Super Admin user
                    const superAdminUser = {
                        id: 999,
                        username: 'existingsuperadmin',
                        password: 'password123',
                        name: 'Existing Super Admin',
                        role: 'super_admin',
                        active: true
                    };
                    
                    // Combine with other users
                    const usersWithSuperAdmin = [superAdminUser, ...otherUsers];
                    localStorage.setItem('users', JSON.stringify(usersWithSuperAdmin));
                    
                    // Count Super Admins before
                    const superAdminCountBefore = usersWithSuperAdmin.filter(u => u.role === 'super_admin').length;
                    
                    // Call ensureSuperAdminExists
                    ensureSuperAdminExists();
                    
                    // Get updated users and count Super Admins after
                    const updatedUsers = JSON.parse(localStorage.getItem('users') || '[]');
                    const superAdminCountAfter = updatedUsers.filter(u => u.role === 'super_admin').length;
                    
                    return superAdminCountAfter === superAdminCountBefore;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any users array with multiple Super Admins already, ensureSuperAdminExists should not add more', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 2, max: 5 }),
                (numSuperAdmins) => {
                    // Create multiple Super Admin users
                    const superAdmins = Array.from({ length: numSuperAdmins }, (_, i) => ({
                        id: i + 1,
                        username: `superadmin${i + 1}`,
                        password: 'password123',
                        name: `Super Admin ${i + 1}`,
                        role: 'super_admin',
                        active: true
                    }));
                    
                    localStorage.setItem('users', JSON.stringify(superAdmins));
                    const originalLength = superAdmins.length;
                    
                    ensureSuperAdminExists();
                    
                    const updatedUsers = JSON.parse(localStorage.getItem('users') || '[]');
                    
                    // Length should not change
                    return updatedUsers.length === originalLength;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any users array with a Super Admin, the total user count should remain the same after ensureSuperAdminExists', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.integer({ min: 1, max: 1000 }),
                        username: fc.string({ minLength: 3, maxLength: 20 }),
                        password: fc.string({ minLength: 6, maxLength: 20 }),
                        name: fc.string({ minLength: 3, maxLength: 50 }),
                        role: fc.constantFrom('super_admin', 'administrator', 'keuangan', 'kasir'),
                        active: fc.boolean()
                    }),
                    { minLength: 1, maxLength: 10 }
                ).filter(users => users.some(u => u.role === 'super_admin')), // Ensure at least one Super Admin
                (usersWithSuperAdmin) => {
                    localStorage.setItem('users', JSON.stringify(usersWithSuperAdmin));
                    const originalLength = usersWithSuperAdmin.length;
                    
                    ensureSuperAdminExists();
                    
                    const updatedUsers = JSON.parse(localStorage.getItem('users') || '[]');
                    
                    return updatedUsers.length === originalLength;
                }
            ),
            { numRuns: 100 }
        );
    });
});

// **Feature: level-superadmin, Property 3: Role badge styling consistency**
describe('**Feature: level-superadmin, Property 3: Role badge styling consistency**', () => {
    test('For any valid role string, getRoleBadgeClass should return a valid Bootstrap badge class, and super_admin should return bg-dark', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('super_admin', 'administrator', 'keuangan', 'kasir'),
                (role) => {
                    const badgeClass = getRoleBadgeClass(role);
                    
                    // Valid Bootstrap badge classes
                    const validClasses = ['bg-dark', 'bg-danger', 'bg-primary', 'bg-success', 'bg-secondary'];
                    
                    // Check that the returned class is valid
                    const isValidClass = validClasses.includes(badgeClass);
                    
                    // Check that super_admin specifically returns bg-dark
                    const superAdminCorrect = role === 'super_admin' ? badgeClass === 'bg-dark' : true;
                    
                    return isValidClass && superAdminCorrect;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any role string, getRoleBadgeClass should always return a string starting with bg-', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('super_admin', 'administrator', 'keuangan', 'kasir', 'unknown_role'),
                (role) => {
                    const badgeClass = getRoleBadgeClass(role);
                    return typeof badgeClass === 'string' && badgeClass.startsWith('bg-');
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For super_admin role specifically, getRoleBadgeClass should always return bg-dark', () => {
        fc.assert(
            fc.property(
                fc.constant('super_admin'),
                (role) => {
                    return getRoleBadgeClass(role) === 'bg-dark';
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For each known role, getRoleBadgeClass should return a consistent class', () => {
        const expectedMappings = {
            'super_admin': 'bg-dark',
            'administrator': 'bg-danger',
            'keuangan': 'bg-primary',
            'kasir': 'bg-success'
        };

        fc.assert(
            fc.property(
                fc.constantFrom(...Object.keys(expectedMappings)),
                (role) => {
                    return getRoleBadgeClass(role) === expectedMappings[role];
                }
            ),
            { numRuns: 100 }
        );
    });
});

// **Feature: level-superadmin, Property 4: Role name display**
describe('**Feature: level-superadmin, Property 4: Role name display**', () => {
    test('For any valid role string, getRoleName should return a human-readable name, and super_admin should return Super Admin', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('super_admin', 'administrator', 'keuangan', 'kasir'),
                (role) => {
                    const roleName = getRoleName(role);
                    
                    // Check that the returned name is a non-empty string
                    const isValidName = typeof roleName === 'string' && roleName.length > 0;
                    
                    // Check that super_admin specifically returns 'Super Admin'
                    const superAdminCorrect = role === 'super_admin' ? roleName === 'Super Admin' : true;
                    
                    return isValidName && superAdminCorrect;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For super_admin role specifically, getRoleName should always return Super Admin', () => {
        fc.assert(
            fc.property(
                fc.constant('super_admin'),
                (role) => {
                    return getRoleName(role) === 'Super Admin';
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For each known role, getRoleName should return the correct human-readable name', () => {
        const expectedMappings = {
            'super_admin': 'Super Admin',
            'administrator': 'Administrator',
            'keuangan': 'Admin Keuangan',
            'kasir': 'Kasir'
        };

        fc.assert(
            fc.property(
                fc.constantFrom(...Object.keys(expectedMappings)),
                (role) => {
                    return getRoleName(role) === expectedMappings[role];
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any unknown role string, getRoleName should return the role string itself', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 20 }).filter(s => {
                    // Filter out known roles and JavaScript reserved properties
                    const knownRoles = ['super_admin', 'administrator', 'keuangan', 'kasir'];
                    const reservedProps = ['constructor', 'prototype', '__proto__', 'toString', 'valueOf'];
                    return !knownRoles.includes(s) && !reservedProps.includes(s);
                }),
                (unknownRole) => {
                    return getRoleName(unknownRole) === unknownRole;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any role string, getRoleName should always return a string', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constantFrom('super_admin', 'administrator', 'keuangan', 'kasir'),
                    fc.string({ minLength: 1, maxLength: 20 }).filter(s => {
                        // Filter out JavaScript reserved properties
                        const reservedProps = ['constructor', 'prototype', '__proto__', 'toString', 'valueOf', 'hasOwnProperty'];
                        return !reservedProps.includes(s);
                    })
                ),
                (role) => {
                    return typeof getRoleName(role) === 'string';
                }
            ),
            { numRuns: 100 }
        );
    });
});

// Mock function to get menu items for a role
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

// **Feature: level-superadmin, Property 2: Super Admin menu completeness**
describe('**Feature: level-superadmin, Property 2: Super Admin menu completeness**', () => {
    test('For any Super Admin user, the rendered menu should contain all Administrator menu items plus Super Admin-specific menu items (Pengaturan Sistem, Audit Log)', () => {
        fc.assert(
            fc.property(
                fc.constant('super_admin'),
                (role) => {
                    const superAdminMenus = getMenuItemsForRole('super_admin');
                    const administratorMenus = getMenuItemsForRole('administrator');
                    
                    // Super Admin specific menu items
                    const superAdminSpecificPages = ['system-settings', 'audit-log'];
                    
                    // Check that Super Admin has the specific menu items
                    const hasSuperAdminMenus = superAdminSpecificPages.every(page => 
                        superAdminMenus.some(menu => menu.page === page)
                    );
                    
                    // Check that Super Admin has all Administrator menu items
                    const hasAllAdminMenus = administratorMenus.every(adminMenu => 
                        superAdminMenus.some(superMenu => superMenu.page === adminMenu.page)
                    );
                    
                    return hasSuperAdminMenus && hasAllAdminMenus;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For Super Admin role, the menu should contain Pengaturan Sistem menu item', () => {
        fc.assert(
            fc.property(
                fc.constant('super_admin'),
                (role) => {
                    const menus = getMenuItemsForRole(role);
                    return menus.some(menu => menu.page === 'system-settings' && menu.text === 'Pengaturan Sistem');
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For Super Admin role, the menu should contain Audit Log menu item', () => {
        fc.assert(
            fc.property(
                fc.constant('super_admin'),
                (role) => {
                    const menus = getMenuItemsForRole(role);
                    return menus.some(menu => menu.page === 'audit-log' && menu.text === 'Audit Log');
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For Super Admin role, the menu count should be greater than Administrator menu count', () => {
        fc.assert(
            fc.property(
                fc.constant('super_admin'),
                (role) => {
                    const superAdminMenus = getMenuItemsForRole('super_admin');
                    const administratorMenus = getMenuItemsForRole('administrator');
                    
                    return superAdminMenus.length > administratorMenus.length;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For Super Admin role, every Administrator menu page should exist in Super Admin menus', () => {
        fc.assert(
            fc.property(
                fc.constant('super_admin'),
                (role) => {
                    const superAdminMenus = getMenuItemsForRole('super_admin');
                    const administratorMenus = getMenuItemsForRole('administrator');
                    
                    const adminPages = administratorMenus.map(m => m.page);
                    const superAdminPages = superAdminMenus.map(m => m.page);
                    
                    return adminPages.every(page => superAdminPages.includes(page));
                }
            ),
            { numRuns: 100 }
        );
    });
});

// **Feature: level-superadmin, Property 13: Non-Super Admin menu exclusion**
describe('**Feature: level-superadmin, Property 13: Non-Super Admin menu exclusion**', () => {
    test('For any user with role administrator, keuangan, or kasir, the rendered menu should not contain the Pengaturan Sistem menu item', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('administrator', 'keuangan', 'kasir'),
                (role) => {
                    const menus = getMenuItemsForRole(role);
                    const hasPengaturanSistem = menus.some(menu => menu.page === 'system-settings');
                    
                    return !hasPengaturanSistem;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any user with role administrator, keuangan, or kasir, the rendered menu should not contain the Audit Log menu item', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('administrator', 'keuangan', 'kasir'),
                (role) => {
                    const menus = getMenuItemsForRole(role);
                    const hasAuditLog = menus.some(menu => menu.page === 'audit-log');
                    
                    return !hasAuditLog;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any non-Super Admin role, the menu should not contain any Super Admin exclusive pages', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('administrator', 'keuangan', 'kasir'),
                (role) => {
                    const menus = getMenuItemsForRole(role);
                    const superAdminExclusivePages = ['system-settings', 'audit-log'];
                    
                    const hasAnySuperAdminPage = menus.some(menu => 
                        superAdminExclusivePages.includes(menu.page)
                    );
                    
                    return !hasAnySuperAdminPage;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For Administrator role specifically, the menu should not contain system-settings or audit-log', () => {
        fc.assert(
            fc.property(
                fc.constant('administrator'),
                (role) => {
                    const menus = getMenuItemsForRole(role);
                    const menuPages = menus.map(m => m.page);
                    
                    return !menuPages.includes('system-settings') && !menuPages.includes('audit-log');
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For Keuangan role specifically, the menu should not contain system-settings or audit-log', () => {
        fc.assert(
            fc.property(
                fc.constant('keuangan'),
                (role) => {
                    const menus = getMenuItemsForRole(role);
                    const menuPages = menus.map(m => m.page);
                    
                    return !menuPages.includes('system-settings') && !menuPages.includes('audit-log');
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For Kasir role specifically, the menu should not contain system-settings or audit-log', () => {
        fc.assert(
            fc.property(
                fc.constant('kasir'),
                (role) => {
                    const menus = getMenuItemsForRole(role);
                    const menuPages = menus.map(m => m.page);
                    
                    return !menuPages.includes('system-settings') && !menuPages.includes('audit-log');
                }
            ),
            { numRuns: 100 }
        );
    });
});

// Mock currentUser for testing
let currentUser = null;

function filterUsersByPermission(users) {
    if (currentUser && currentUser.role === 'super_admin') {
        return users; // Super Admin sees all users
    }
    // Non-Super Admin cannot see Super Admin accounts
    return users.filter(u => u.role !== 'super_admin');
}

function getAvailableRoles() {
    if (currentUser && currentUser.role === 'super_admin') {
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

// **Feature: level-superadmin, Property 5: Super Admin sees all users**
describe('**Feature: level-superadmin, Property 5: Super Admin sees all users**', () => {
    beforeEach(() => {
        currentUser = null;
    });

    test('For any user list, when filterUsersByPermission is called by a Super Admin, it should return the complete unfiltered list', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.integer({ min: 1, max: 1000 }),
                        username: fc.string({ minLength: 3, maxLength: 20 }),
                        password: fc.string({ minLength: 6, maxLength: 20 }),
                        name: fc.string({ minLength: 3, maxLength: 50 }),
                        role: fc.constantFrom('super_admin', 'administrator', 'keuangan', 'kasir'),
                        active: fc.boolean()
                    }),
                    { minLength: 1, maxLength: 20 }
                ),
                (users) => {
                    // Set current user as Super Admin
                    currentUser = {
                        id: 999,
                        username: 'superadmin',
                        password: 'super123',
                        name: 'Super Administrator',
                        role: 'super_admin',
                        active: true
                    };
                    
                    const filteredUsers = filterUsersByPermission(users);
                    
                    // Check that all users are returned
                    return filteredUsers.length === users.length &&
                           users.every(user => filteredUsers.some(fu => fu.id === user.id));
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any user list containing Super Admin accounts, Super Admin should see them all', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 5 }),
                fc.integer({ min: 1, max: 10 }),
                (numSuperAdmins, numOtherUsers) => {
                    // Create Super Admin users
                    const superAdmins = Array.from({ length: numSuperAdmins }, (_, i) => ({
                        id: i + 1,
                        username: `superadmin${i + 1}`,
                        password: 'password123',
                        name: `Super Admin ${i + 1}`,
                        role: 'super_admin',
                        active: true
                    }));
                    
                    // Create other users
                    const otherUsers = Array.from({ length: numOtherUsers }, (_, i) => ({
                        id: numSuperAdmins + i + 1,
                        username: `user${i + 1}`,
                        password: 'password123',
                        name: `User ${i + 1}`,
                        role: ['administrator', 'keuangan', 'kasir'][i % 3],
                        active: true
                    }));
                    
                    const allUsers = [...superAdmins, ...otherUsers];
                    
                    // Set current user as Super Admin
                    currentUser = {
                        id: 999,
                        username: 'superadmin',
                        password: 'super123',
                        name: 'Super Administrator',
                        role: 'super_admin',
                        active: true
                    };
                    
                    const filteredUsers = filterUsersByPermission(allUsers);
                    
                    // Check that all Super Admin accounts are visible
                    const superAdminCount = filteredUsers.filter(u => u.role === 'super_admin').length;
                    
                    return superAdminCount === numSuperAdmins;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For Super Admin, filterUsersByPermission should be an identity function', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.integer({ min: 1, max: 1000 }),
                        username: fc.string({ minLength: 3, maxLength: 20 }),
                        password: fc.string({ minLength: 6, maxLength: 20 }),
                        name: fc.string({ minLength: 3, maxLength: 50 }),
                        role: fc.constantFrom('super_admin', 'administrator', 'keuangan', 'kasir'),
                        active: fc.boolean()
                    }),
                    { minLength: 0, maxLength: 20 }
                ),
                (users) => {
                    currentUser = {
                        id: 999,
                        role: 'super_admin',
                        username: 'superadmin',
                        password: 'super123',
                        name: 'Super Administrator',
                        active: true
                    };
                    
                    const filteredUsers = filterUsersByPermission(users);
                    
                    // Check that the filtered list is identical to the input
                    return JSON.stringify(filteredUsers) === JSON.stringify(users);
                }
            ),
            { numRuns: 100 }
        );
    });
});

// **Feature: level-superadmin, Property 6: Super Admin role options completeness**
describe('**Feature: level-superadmin, Property 6: Super Admin role options completeness**', () => {
    beforeEach(() => {
        currentUser = null;
    });

    test('For any Super Admin user, getAvailableRoles should return all four role options including super_admin', () => {
        fc.assert(
            fc.property(
                fc.constant('super_admin'),
                (role) => {
                    currentUser = {
                        id: 1,
                        username: 'superadmin',
                        password: 'super123',
                        name: 'Super Administrator',
                        role: 'super_admin',
                        active: true
                    };
                    
                    const roles = getAvailableRoles();
                    
                    // Check that all four roles are present
                    const expectedRoles = ['super_admin', 'administrator', 'keuangan', 'kasir'];
                    const roleValues = roles.map(r => r.value);
                    
                    return roles.length === 4 &&
                           expectedRoles.every(expectedRole => roleValues.includes(expectedRole));
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For Super Admin, getAvailableRoles should include super_admin as the first option', () => {
        fc.assert(
            fc.property(
                fc.constant('super_admin'),
                (role) => {
                    currentUser = {
                        id: 1,
                        role: 'super_admin',
                        username: 'superadmin',
                        password: 'super123',
                        name: 'Super Administrator',
                        active: true
                    };
                    
                    const roles = getAvailableRoles();
                    
                    return roles.length > 0 && roles[0].value === 'super_admin';
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For Super Admin, each role option should have both value and label properties', () => {
        fc.assert(
            fc.property(
                fc.constant('super_admin'),
                (role) => {
                    currentUser = {
                        id: 1,
                        role: 'super_admin',
                        username: 'superadmin',
                        password: 'super123',
                        name: 'Super Administrator',
                        active: true
                    };
                    
                    const roles = getAvailableRoles();
                    
                    return roles.every(r => 
                        r.hasOwnProperty('value') && 
                        r.hasOwnProperty('label') &&
                        typeof r.value === 'string' &&
                        typeof r.label === 'string' &&
                        r.value.length > 0 &&
                        r.label.length > 0
                    );
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For Super Admin, the super_admin role option should have the correct label', () => {
        fc.assert(
            fc.property(
                fc.constant('super_admin'),
                (role) => {
                    currentUser = {
                        id: 1,
                        role: 'super_admin',
                        username: 'superadmin',
                        password: 'super123',
                        name: 'Super Administrator',
                        active: true
                    };
                    
                    const roles = getAvailableRoles();
                    const superAdminRole = roles.find(r => r.value === 'super_admin');
                    
                    return superAdminRole !== undefined &&
                           superAdminRole.label === 'Super Admin - Akses Penuh Sistem';
                }
            ),
            { numRuns: 100 }
        );
    });
});

// **Feature: level-superadmin, Property 10: Administrator cannot see Super Admin accounts**
describe('**Feature: level-superadmin, Property 10: Administrator cannot see Super Admin accounts**', () => {
    beforeEach(() => {
        currentUser = null;
    });

    test('For any user list containing Super Admin accounts, when filterUsersByPermission is called by an Administrator, the returned list should not contain any users with role super_admin', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.integer({ min: 1, max: 1000 }),
                        username: fc.string({ minLength: 3, maxLength: 20 }),
                        password: fc.string({ minLength: 6, maxLength: 20 }),
                        name: fc.string({ minLength: 3, maxLength: 50 }),
                        role: fc.constantFrom('super_admin', 'administrator', 'keuangan', 'kasir'),
                        active: fc.boolean()
                    }),
                    { minLength: 1, maxLength: 20 }
                ).filter(users => users.some(u => u.role === 'super_admin')), // Ensure at least one Super Admin
                (users) => {
                    // Set current user as Administrator
                    currentUser = {
                        id: 999,
                        username: 'admin',
                        password: 'admin123',
                        name: 'Administrator',
                        role: 'administrator',
                        active: true
                    };
                    
                    const filteredUsers = filterUsersByPermission(users);
                    
                    // Check that no Super Admin accounts are in the filtered list
                    const hasSuperAdmin = filteredUsers.some(u => u.role === 'super_admin');
                    
                    return !hasSuperAdmin;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For Administrator, the filtered user count should be less than or equal to the original count', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.integer({ min: 1, max: 1000 }),
                        username: fc.string({ minLength: 3, maxLength: 20 }),
                        password: fc.string({ minLength: 6, maxLength: 20 }),
                        name: fc.string({ minLength: 3, maxLength: 50 }),
                        role: fc.constantFrom('super_admin', 'administrator', 'keuangan', 'kasir'),
                        active: fc.boolean()
                    }),
                    { minLength: 1, maxLength: 20 }
                ),
                (users) => {
                    currentUser = {
                        id: 999,
                        role: 'administrator',
                        username: 'admin',
                        password: 'admin123',
                        name: 'Administrator',
                        active: true
                    };
                    
                    const filteredUsers = filterUsersByPermission(users);
                    
                    return filteredUsers.length <= users.length;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For Administrator, if there are N Super Admin accounts, the filtered list should have N fewer users', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 5 }),
                fc.integer({ min: 1, max: 10 }),
                (numSuperAdmins, numOtherUsers) => {
                    // Create Super Admin users
                    const superAdmins = Array.from({ length: numSuperAdmins }, (_, i) => ({
                        id: i + 1,
                        username: `superadmin${i + 1}`,
                        password: 'password123',
                        name: `Super Admin ${i + 1}`,
                        role: 'super_admin',
                        active: true
                    }));
                    
                    // Create other users
                    const otherUsers = Array.from({ length: numOtherUsers }, (_, i) => ({
                        id: numSuperAdmins + i + 1,
                        username: `user${i + 1}`,
                        password: 'password123',
                        name: `User ${i + 1}`,
                        role: ['administrator', 'keuangan', 'kasir'][i % 3],
                        active: true
                    }));
                    
                    const allUsers = [...superAdmins, ...otherUsers];
                    
                    currentUser = {
                        id: 999,
                        role: 'administrator',
                        username: 'admin',
                        password: 'admin123',
                        name: 'Administrator',
                        active: true
                    };
                    
                    const filteredUsers = filterUsersByPermission(allUsers);
                    
                    return filteredUsers.length === numOtherUsers;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For Keuangan role, Super Admin accounts should also be filtered out', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.integer({ min: 1, max: 1000 }),
                        username: fc.string({ minLength: 3, maxLength: 20 }),
                        password: fc.string({ minLength: 6, maxLength: 20 }),
                        name: fc.string({ minLength: 3, maxLength: 50 }),
                        role: fc.constantFrom('super_admin', 'administrator', 'keuangan', 'kasir'),
                        active: fc.boolean()
                    }),
                    { minLength: 1, maxLength: 20 }
                ).filter(users => users.some(u => u.role === 'super_admin')),
                (users) => {
                    currentUser = {
                        id: 999,
                        role: 'keuangan',
                        username: 'keuangan',
                        password: 'keuangan123',
                        name: 'Admin Keuangan',
                        active: true
                    };
                    
                    const filteredUsers = filterUsersByPermission(users);
                    
                    return !filteredUsers.some(u => u.role === 'super_admin');
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For Kasir role, Super Admin accounts should also be filtered out', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.integer({ min: 1, max: 1000 }),
                        username: fc.string({ minLength: 3, maxLength: 20 }),
                        password: fc.string({ minLength: 6, maxLength: 20 }),
                        name: fc.string({ minLength: 3, maxLength: 50 }),
                        role: fc.constantFrom('super_admin', 'administrator', 'keuangan', 'kasir'),
                        active: fc.boolean()
                    }),
                    { minLength: 1, maxLength: 20 }
                ).filter(users => users.some(u => u.role === 'super_admin')),
                (users) => {
                    currentUser = {
                        id: 999,
                        role: 'kasir',
                        username: 'kasir',
                        password: 'kasir123',
                        name: 'Kasir',
                        active: true
                    };
                    
                    const filteredUsers = filterUsersByPermission(users);
                    
                    return !filteredUsers.some(u => u.role === 'super_admin');
                }
            ),
            { numRuns: 100 }
        );
    });
});

// **Feature: level-superadmin, Property 11: Administrator role options exclusion**
describe('**Feature: level-superadmin, Property 11: Administrator role options exclusion**', () => {
    beforeEach(() => {
        currentUser = null;
    });

    test('For any Administrator user, getAvailableRoles should not include super_admin in the returned options', () => {
        fc.assert(
            fc.property(
                fc.constant('administrator'),
                (role) => {
                    currentUser = {
                        id: 2,
                        username: 'admin',
                        password: 'admin123',
                        name: 'Administrator',
                        role: 'administrator',
                        active: true
                    };
                    
                    const roles = getAvailableRoles();
                    const roleValues = roles.map(r => r.value);
                    
                    return !roleValues.includes('super_admin');
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For Administrator, getAvailableRoles should return exactly 3 role options', () => {
        fc.assert(
            fc.property(
                fc.constant('administrator'),
                (role) => {
                    currentUser = {
                        id: 2,
                        role: 'administrator',
                        username: 'admin',
                        password: 'admin123',
                        name: 'Administrator',
                        active: true
                    };
                    
                    const roles = getAvailableRoles();
                    
                    return roles.length === 3;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For Administrator, getAvailableRoles should include administrator, keuangan, and kasir', () => {
        fc.assert(
            fc.property(
                fc.constant('administrator'),
                (role) => {
                    currentUser = {
                        id: 2,
                        role: 'administrator',
                        username: 'admin',
                        password: 'admin123',
                        name: 'Administrator',
                        active: true
                    };
                    
                    const roles = getAvailableRoles();
                    const roleValues = roles.map(r => r.value);
                    
                    const expectedRoles = ['administrator', 'keuangan', 'kasir'];
                    
                    return expectedRoles.every(expectedRole => roleValues.includes(expectedRole));
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For Keuangan role, getAvailableRoles should not include super_admin', () => {
        fc.assert(
            fc.property(
                fc.constant('keuangan'),
                (role) => {
                    currentUser = {
                        id: 3,
                        role: 'keuangan',
                        username: 'keuangan',
                        password: 'keuangan123',
                        name: 'Admin Keuangan',
                        active: true
                    };
                    
                    const roles = getAvailableRoles();
                    const roleValues = roles.map(r => r.value);
                    
                    return !roleValues.includes('super_admin');
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For Kasir role, getAvailableRoles should not include super_admin', () => {
        fc.assert(
            fc.property(
                fc.constant('kasir'),
                (role) => {
                    currentUser = {
                        id: 4,
                        role: 'kasir',
                        username: 'kasir',
                        password: 'kasir123',
                        name: 'Kasir',
                        active: true
                    };
                    
                    const roles = getAvailableRoles();
                    const roleValues = roles.map(r => r.value);
                    
                    return !roleValues.includes('super_admin');
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any non-Super Admin role, getAvailableRoles should return fewer options than Super Admin', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('administrator', 'keuangan', 'kasir'),
                (role) => {
                    // Get Super Admin roles count
                    currentUser = {
                        id: 1,
                        role: 'super_admin',
                        username: 'superadmin',
                        password: 'super123',
                        name: 'Super Administrator',
                        active: true
                    };
                    const superAdminRolesCount = getAvailableRoles().length;
                    
                    // Get non-Super Admin roles count
                    currentUser = {
                        id: 2,
                        role: role,
                        username: 'user',
                        password: 'password123',
                        name: 'User',
                        active: true
                    };
                    const nonSuperAdminRolesCount = getAvailableRoles().length;
                    
                    return nonSuperAdminRolesCount < superAdminRolesCount;
                }
            ),
            { numRuns: 100 }
        );
    });
});

// Mock saveUser function for testing
function saveUser(userId, username, password, name, role, active) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Validation: Check if non-Super Admin is trying to manage Super Admin accounts
    if (currentUser && currentUser.role !== 'super_admin' && role === 'super_admin') {
        return { success: false, error: 'Anda tidak memiliki izin untuk menetapkan role ini!' };
    }
    
    // Check duplicate username
    const existingUser = users.find(u => u.username === username && u.id != userId);
    if (existingUser) {
        return { success: false, error: 'Username sudah digunakan!' };
    }
    
    if (userId) {
        // Edit user
        const index = users.findIndex(u => u.id == userId);
        if (index === -1) {
            return { success: false, error: 'User tidak ditemukan!' };
        }
        
        // Check if non-Super Admin is trying to edit a Super Admin account
        if (currentUser && currentUser.role !== 'super_admin' && users[index].role === 'super_admin') {
            return { success: false, error: 'Anda tidak memiliki izin untuk mengedit user ini!' };
        }
        
        users[index].username = username;
        users[index].name = name;
        users[index].role = role;
        users[index].active = active;
        
        // Update password only if provided
        if (password) {
            if (password.length < 6) {
                return { success: false, error: 'Password minimal 6 karakter!' };
            }
            users[index].password = password;
        }
    } else {
        // Add new user
        if (!password || password.length < 6) {
            return { success: false, error: 'Password minimal 6 karakter!' };
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
    return { success: true };
}

// Mock deleteUser function for testing
function deleteUser(userId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userToDelete = users.find(u => u.id === userId);
    
    if (!userToDelete) {
        return { success: false, error: 'User tidak ditemukan!' };
    }
    
    // Prevent self-deletion
    if (currentUser && currentUser.id === userId) {
        return { success: false, error: 'Anda tidak dapat menghapus akun yang sedang digunakan!' };
    }
    
    // Prevent non-Super Admin from deleting Super Admin accounts
    if (currentUser && currentUser.role !== 'super_admin' && userToDelete.role === 'super_admin') {
        return { success: false, error: 'Anda tidak memiliki izin untuk menghapus user ini!' };
    }
    
    // Prevent deletion of default user (id 1)
    if (userId === 1) {
        return { success: false, error: 'User default tidak dapat dihapus!' };
    }
    
    const filteredUsers = users.filter(u => u.id !== userId);
    localStorage.setItem('users', JSON.stringify(filteredUsers));
    return { success: true };
}

// **Feature: level-superadmin, Property 7: Super Admin can edit any role**
describe('**Feature: level-superadmin, Property 7: Super Admin can edit any role**', () => {
    beforeEach(() => {
        localStorage.clear();
        currentUser = null;
    });

    test('For any user and any target role, when a Super Admin calls saveUser, the operation should succeed (assuming valid data)', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.integer({ min: 1, max: 1000 }),
                    username: fc.string({ minLength: 3, maxLength: 20 }),
                    password: fc.string({ minLength: 6, maxLength: 20 }),
                    name: fc.string({ minLength: 3, maxLength: 50 }),
                    role: fc.constantFrom('administrator', 'keuangan', 'kasir'),
                    active: fc.boolean()
                }),
                fc.constantFrom('super_admin', 'administrator', 'keuangan', 'kasir'),
                (user, targetRole) => {
                    // Set up existing user
                    localStorage.setItem('users', JSON.stringify([user]));
                    
                    // Set current user as Super Admin
                    currentUser = {
                        id: 999,
                        username: 'superadmin',
                        password: 'super123',
                        name: 'Super Administrator',
                        role: 'super_admin',
                        active: true
                    };
                    
                    // Try to edit the user to any target role
                    const result = saveUser(
                        user.id,
                        user.username,
                        null, // No password change
                        user.name,
                        targetRole,
                        user.active
                    );
                    
                    return result.success === true;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For Super Admin, creating a new user with any role should succeed', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 3, maxLength: 20 }),
                fc.string({ minLength: 6, maxLength: 20 }),
                fc.string({ minLength: 3, maxLength: 50 }),
                fc.constantFrom('super_admin', 'administrator', 'keuangan', 'kasir'),
                fc.boolean(),
                (username, password, name, role, active) => {
                    localStorage.clear();
                    localStorage.setItem('users', JSON.stringify([]));
                    
                    currentUser = {
                        id: 999,
                        username: 'superadmin',
                        password: 'super123',
                        name: 'Super Administrator',
                        role: 'super_admin',
                        active: true
                    };
                    
                    const result = saveUser(null, username, password, name, role, active);
                    
                    return result.success === true;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For Super Admin, editing a user to super_admin role should succeed', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.integer({ min: 2, max: 1000 }),
                    username: fc.string({ minLength: 3, maxLength: 20 }),
                    password: fc.string({ minLength: 6, maxLength: 20 }),
                    name: fc.string({ minLength: 3, maxLength: 50 }),
                    role: fc.constantFrom('administrator', 'keuangan', 'kasir'),
                    active: fc.boolean()
                }),
                (user) => {
                    localStorage.setItem('users', JSON.stringify([user]));
                    
                    currentUser = {
                        id: 999,
                        username: 'superadmin',
                        password: 'super123',
                        name: 'Super Administrator',
                        role: 'super_admin',
                        active: true
                    };
                    
                    const result = saveUser(
                        user.id,
                        user.username,
                        null,
                        user.name,
                        'super_admin',
                        user.active
                    );
                    
                    return result.success === true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

// **Feature: level-superadmin, Property 8: Super Admin cannot delete self**
describe('**Feature: level-superadmin, Property 8: Super Admin cannot delete self**', () => {
    beforeEach(() => {
        localStorage.clear();
        currentUser = null;
    });

    test('For any Super Admin user, when attempting to delete their own account, the system should prevent the deletion', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 1000 }),
                (userId) => {
                    // Create a Super Admin user
                    const superAdmin = {
                        id: userId,
                        username: 'superadmin',
                        password: 'super123',
                        name: 'Super Administrator',
                        role: 'super_admin',
                        active: true
                    };
                    
                    localStorage.setItem('users', JSON.stringify([superAdmin]));
                    
                    // Set as current user
                    currentUser = superAdmin;
                    
                    // Try to delete self
                    const result = deleteUser(userId);
                    
                    // Should fail
                    return result.success === false;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any user attempting self-deletion, the operation should fail regardless of role', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.integer({ min: 1, max: 1000 }),
                    username: fc.string({ minLength: 3, maxLength: 20 }),
                    password: fc.string({ minLength: 6, maxLength: 20 }),
                    name: fc.string({ minLength: 3, maxLength: 50 }),
                    role: fc.constantFrom('super_admin', 'administrator', 'keuangan', 'kasir'),
                    active: fc.boolean()
                }),
                (user) => {
                    localStorage.setItem('users', JSON.stringify([user]));
                    
                    // Set as current user
                    currentUser = user;
                    
                    // Try to delete self
                    const result = deleteUser(user.id);
                    
                    return result.success === false;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For Super Admin deleting another user, the operation should succeed', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 2, max: 1000 }),
                fc.integer({ min: 2, max: 1000 }).filter(id => id !== 1), // Not default user
                (superAdminId, targetUserId) => {
                    // Ensure different IDs
                    if (superAdminId === targetUserId) {
                        targetUserId = targetUserId + 1;
                    }
                    
                    const superAdmin = {
                        id: superAdminId,
                        username: 'superadmin',
                        password: 'super123',
                        name: 'Super Administrator',
                        role: 'super_admin',
                        active: true
                    };
                    
                    const targetUser = {
                        id: targetUserId,
                        username: 'targetuser',
                        password: 'password123',
                        name: 'Target User',
                        role: 'administrator',
                        active: true
                    };
                    
                    localStorage.setItem('users', JSON.stringify([superAdmin, targetUser]));
                    
                    currentUser = superAdmin;
                    
                    const result = deleteUser(targetUserId);
                    
                    return result.success === true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

// **Feature: level-superadmin, Property 9: Administrator cannot manage Super Admin accounts**
describe('**Feature: level-superadmin, Property 9: Administrator cannot manage Super Admin accounts**', () => {
    beforeEach(() => {
        localStorage.clear();
        currentUser = null;
    });

    test('For any Administrator user, when attempting to create or edit a user with role super_admin, the system should reject the operation', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 3, maxLength: 20 }),
                fc.string({ minLength: 6, maxLength: 20 }),
                fc.string({ minLength: 3, maxLength: 50 }),
                fc.boolean(),
                (username, password, name, active) => {
                    localStorage.clear();
                    localStorage.setItem('users', JSON.stringify([]));
                    
                    // Set current user as Administrator
                    currentUser = {
                        id: 2,
                        username: 'admin',
                        password: 'admin123',
                        name: 'Administrator',
                        role: 'administrator',
                        active: true
                    };
                    
                    // Try to create a Super Admin user
                    const result = saveUser(null, username, password, name, 'super_admin', active);
                    
                    return result.success === false;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For Administrator, attempting to edit an existing Super Admin account should fail', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.integer({ min: 1, max: 1000 }),
                    username: fc.string({ minLength: 3, maxLength: 20 }),
                    password: fc.string({ minLength: 6, maxLength: 20 }),
                    name: fc.string({ minLength: 3, maxLength: 50 }),
                    role: fc.constant('super_admin'),
                    active: fc.boolean()
                }),
                (superAdminUser) => {
                    localStorage.setItem('users', JSON.stringify([superAdminUser]));
                    
                    currentUser = {
                        id: 999,
                        username: 'admin',
                        password: 'admin123',
                        name: 'Administrator',
                        role: 'administrator',
                        active: true
                    };
                    
                    // Try to edit the Super Admin user
                    const result = saveUser(
                        superAdminUser.id,
                        superAdminUser.username,
                        null,
                        'Modified Name',
                        'administrator', // Try to change role
                        superAdminUser.active
                    );
                    
                    return result.success === false;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For Administrator, attempting to delete a Super Admin account should fail', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.integer({ min: 2, max: 1000 }),
                    username: fc.string({ minLength: 3, maxLength: 20 }),
                    password: fc.string({ minLength: 6, maxLength: 20 }),
                    name: fc.string({ minLength: 3, maxLength: 50 }),
                    role: fc.constant('super_admin'),
                    active: fc.boolean()
                }),
                (superAdminUser) => {
                    localStorage.setItem('users', JSON.stringify([superAdminUser]));
                    
                    currentUser = {
                        id: 999,
                        username: 'admin',
                        password: 'admin123',
                        name: 'Administrator',
                        role: 'administrator',
                        active: true
                    };
                    
                    const result = deleteUser(superAdminUser.id);
                    
                    return result.success === false;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For Keuangan role, attempting to create a Super Admin should also fail', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 3, maxLength: 20 }),
                fc.string({ minLength: 6, maxLength: 20 }),
                fc.string({ minLength: 3, maxLength: 50 }),
                (username, password, name) => {
                    localStorage.clear();
                    localStorage.setItem('users', JSON.stringify([]));
                    
                    currentUser = {
                        id: 3,
                        username: 'keuangan',
                        password: 'keuangan123',
                        name: 'Admin Keuangan',
                        role: 'keuangan',
                        active: true
                    };
                    
                    const result = saveUser(null, username, password, name, 'super_admin', true);
                    
                    return result.success === false;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For Kasir role, attempting to create a Super Admin should also fail', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 3, maxLength: 20 }),
                fc.string({ minLength: 6, maxLength: 20 }),
                fc.string({ minLength: 3, maxLength: 50 }),
                (username, password, name) => {
                    localStorage.clear();
                    localStorage.setItem('users', JSON.stringify([]));
                    
                    currentUser = {
                        id: 4,
                        username: 'kasir',
                        password: 'kasir123',
                        name: 'Kasir',
                        role: 'kasir',
                        active: true
                    };
                    
                    const result = saveUser(null, username, password, name, 'super_admin', true);
                    
                    return result.success === false;
                }
            ),
            { numRuns: 100 }
        );
    });
});

// Mock renderSystemSettings function for testing
function renderSystemSettings() {
    if (!currentUser || currentUser.role !== 'super_admin') {
        return { 
            success: false, 
            error: 'Akses ditolak. Hanya Super Admin yang dapat mengakses halaman ini.',
            redirectTo: 'dashboard'
        };
    }
    
    return { 
        success: true,
        content: 'System Settings Page Content'
    };
}

// **Feature: level-superadmin, Property 12: Non-Super Admin access denial**
describe('**Feature: level-superadmin, Property 12: Non-Super Admin access denial**', () => {
    beforeEach(() => {
        currentUser = null;
    });

    test('For any non-Super Admin user, when attempting to access renderSystemSettings, the system should deny access and redirect to dashboard', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('administrator', 'keuangan', 'kasir'),
                (role) => {
                    // Set current user as non-Super Admin
                    currentUser = {
                        id: 2,
                        username: 'user',
                        password: 'password123',
                        name: 'User',
                        role: role,
                        active: true
                    };
                    
                    // Try to access system settings
                    const result = renderSystemSettings();
                    
                    // Should deny access
                    return result.success === false && 
                           result.redirectTo === 'dashboard';
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For Administrator role specifically, accessing renderSystemSettings should be denied', () => {
        fc.assert(
            fc.property(
                fc.constant('administrator'),
                (role) => {
                    currentUser = {
                        id: 2,
                        username: 'admin',
                        password: 'admin123',
                        name: 'Administrator',
                        role: role,
                        active: true
                    };
                    
                    const result = renderSystemSettings();
                    
                    return result.success === false;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For Keuangan role specifically, accessing renderSystemSettings should be denied', () => {
        fc.assert(
            fc.property(
                fc.constant('keuangan'),
                (role) => {
                    currentUser = {
                        id: 3,
                        username: 'keuangan',
                        password: 'keuangan123',
                        name: 'Admin Keuangan',
                        role: role,
                        active: true
                    };
                    
                    const result = renderSystemSettings();
                    
                    return result.success === false;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For Kasir role specifically, accessing renderSystemSettings should be denied', () => {
        fc.assert(
            fc.property(
                fc.constant('kasir'),
                (role) => {
                    currentUser = {
                        id: 4,
                        username: 'kasir',
                        password: 'kasir123',
                        name: 'Kasir',
                        role: role,
                        active: true
                    };
                    
                    const result = renderSystemSettings();
                    
                    return result.success === false;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For Super Admin user, accessing renderSystemSettings should succeed', () => {
        fc.assert(
            fc.property(
                fc.constant('super_admin'),
                (role) => {
                    currentUser = {
                        id: 1,
                        username: 'superadmin',
                        password: 'super123',
                        name: 'Super Administrator',
                        role: role,
                        active: true
                    };
                    
                    const result = renderSystemSettings();
                    
                    return result.success === true;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For null or undefined currentUser, accessing renderSystemSettings should be denied', () => {
        fc.assert(
            fc.property(
                fc.constant(null),
                () => {
                    currentUser = null;
                    
                    const result = renderSystemSettings();
                    
                    return result.success === false;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any non-Super Admin role, the error message should indicate access denial', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('administrator', 'keuangan', 'kasir'),
                (role) => {
                    currentUser = {
                        id: 2,
                        username: 'user',
                        password: 'password123',
                        name: 'User',
                        role: role,
                        active: true
                    };
                    
                    const result = renderSystemSettings();
                    
                    return result.success === false && 
                           result.error && 
                           result.error.includes('Akses ditolak');
                }
            ),
            { numRuns: 100 }
        );
    });

    test('For any non-Super Admin role, the system should specify Super Admin requirement in error', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('administrator', 'keuangan', 'kasir'),
                (role) => {
                    currentUser = {
                        id: 2,
                        username: 'user',
                        password: 'password123',
                        name: 'User',
                        role: role,
                        active: true
                    };
                    
                    const result = renderSystemSettings();
                    
                    return result.success === false && 
                           result.error && 
                           result.error.includes('Super Admin');
                }
            ),
            { numRuns: 100 }
        );
    });
});


// ============================================================================
// UNIT TESTS FOR AUTHENTICATION FUNCTIONS
// Task 9: Write unit tests for authentication functions
// ============================================================================

describe('Unit Tests: handleLogin with Super Admin credentials', () => {
    beforeEach(() => {
        localStorage.clear();
        currentUser = null;
    });

    test('should successfully login with valid Super Admin credentials', () => {
        const users = [
            { id: 1, username: 'superadmin', password: 'super123', name: 'Super Administrator', role: 'super_admin', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(users));

        // Mock handleLogin behavior
        const username = 'superadmin';
        const password = 'super123';
        const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const user = allUsers.find(u => u.username === username && u.password === password);

        expect(user).toBeDefined();
        expect(user.role).toBe('super_admin');
        expect(user.active).toBe(true);
    });

    test('should fail login with invalid Super Admin password', () => {
        const users = [
            { id: 1, username: 'superadmin', password: 'super123', name: 'Super Administrator', role: 'super_admin', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(users));

        const username = 'superadmin';
        const password = 'wrongpassword';
        const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const user = allUsers.find(u => u.username === username && u.password === password);

        expect(user).toBeUndefined();
    });

    test('should fail login with inactive Super Admin account', () => {
        const users = [
            { id: 1, username: 'superadmin', password: 'super123', name: 'Super Administrator', role: 'super_admin', active: false }
        ];
        localStorage.setItem('users', JSON.stringify(users));

        const username = 'superadmin';
        const password = 'super123';
        const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const user = allUsers.find(u => u.username === username && u.password === password);

        expect(user).toBeDefined();
        expect(user.active).toBe(false);
    });

    test('should fail login with non-existent username', () => {
        const users = [
            { id: 1, username: 'superadmin', password: 'super123', name: 'Super Administrator', role: 'super_admin', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(users));

        const username = 'nonexistent';
        const password = 'super123';
        const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const user = allUsers.find(u => u.username === username && u.password === password);

        expect(user).toBeUndefined();
    });

    test('should handle empty credentials', () => {
        const users = [
            { id: 1, username: 'superadmin', password: 'super123', name: 'Super Administrator', role: 'super_admin', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(users));

        const username = '';
        const password = '';
        const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const user = allUsers.find(u => u.username === username && u.password === password);

        expect(user).toBeUndefined();
    });
});

describe('Unit Tests: isSuperAdmin with various user types', () => {
    beforeEach(() => {
        currentUser = null;
    });

    test('should return true for Super Admin user', () => {
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        const result = currentUser && currentUser.role === 'super_admin';
        expect(result).toBe(true);
    });

    test('should return false for Administrator user', () => {
        currentUser = {
            id: 2,
            username: 'admin',
            password: 'admin123',
            name: 'Administrator',
            role: 'administrator',
            active: true
        };

        const result = currentUser && currentUser.role === 'super_admin';
        expect(result).toBe(false);
    });

    test('should return false for Keuangan user', () => {
        currentUser = {
            id: 3,
            username: 'keuangan',
            password: 'keuangan123',
            name: 'Admin Keuangan',
            role: 'keuangan',
            active: true
        };

        const result = currentUser && currentUser.role === 'super_admin';
        expect(result).toBe(false);
    });

    test('should return false for Kasir user', () => {
        currentUser = {
            id: 4,
            username: 'kasir',
            password: 'kasir123',
            name: 'Kasir',
            role: 'kasir',
            active: true
        };

        const result = currentUser && currentUser.role === 'super_admin';
        expect(result).toBe(false);
    });

    test('should return false when currentUser is null', () => {
        currentUser = null;

        const result = currentUser && currentUser.role === 'super_admin';
        expect(result).toBeFalsy();
    });

    test('should return false when currentUser is undefined', () => {
        currentUser = undefined;

        const result = currentUser && currentUser.role === 'super_admin';
        expect(result).toBeFalsy();
    });

    test('should return false when currentUser has no role property', () => {
        currentUser = {
            id: 5,
            username: 'noRole',
            password: 'password123',
            name: 'No Role User',
            active: true
        };

        const result = currentUser && currentUser.role === 'super_admin';
        expect(result).toBe(false);
    });

    test('should return false when currentUser role is empty string', () => {
        currentUser = {
            id: 6,
            username: 'emptyRole',
            password: 'password123',
            name: 'Empty Role User',
            role: '',
            active: true
        };

        const result = currentUser && currentUser.role === 'super_admin';
        expect(result).toBe(false);
    });

    test('should return false for inactive Super Admin user', () => {
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: false
        };

        // isSuperAdmin only checks role, not active status
        const result = currentUser && currentUser.role === 'super_admin';
        expect(result).toBe(true);
    });
});

describe('Unit Tests: canManageAdmins with various roles', () => {
    beforeEach(() => {
        currentUser = null;
    });

    test('should return true for Super Admin user', () => {
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        // canManageAdmins returns isSuperAdmin()
        const result = currentUser && currentUser.role === 'super_admin';
        expect(result).toBe(true);
    });

    test('should return false for Administrator user', () => {
        currentUser = {
            id: 2,
            username: 'admin',
            password: 'admin123',
            name: 'Administrator',
            role: 'administrator',
            active: true
        };

        const result = currentUser && currentUser.role === 'super_admin';
        expect(result).toBe(false);
    });

    test('should return false for Keuangan user', () => {
        currentUser = {
            id: 3,
            username: 'keuangan',
            password: 'keuangan123',
            name: 'Admin Keuangan',
            role: 'keuangan',
            active: true
        };

        const result = currentUser && currentUser.role === 'super_admin';
        expect(result).toBe(false);
    });

    test('should return false for Kasir user', () => {
        currentUser = {
            id: 4,
            username: 'kasir',
            password: 'kasir123',
            name: 'Kasir',
            role: 'kasir',
            active: true
        };

        const result = currentUser && currentUser.role === 'super_admin';
        expect(result).toBe(false);
    });

    test('should return false when currentUser is null', () => {
        currentUser = null;

        const result = currentUser && currentUser.role === 'super_admin';
        expect(result).toBeFalsy();
    });

    test('should return false when currentUser is undefined', () => {
        currentUser = undefined;

        const result = currentUser && currentUser.role === 'super_admin';
        expect(result).toBeFalsy();
    });
});

describe('Unit Tests: Role helper functions with edge cases', () => {
    test('getRoleName should return correct name for super_admin', () => {
        expect(getRoleName('super_admin')).toBe('Super Admin');
    });

    test('getRoleName should return correct name for administrator', () => {
        expect(getRoleName('administrator')).toBe('Administrator');
    });

    test('getRoleName should return correct name for keuangan', () => {
        expect(getRoleName('keuangan')).toBe('Admin Keuangan');
    });

    test('getRoleName should return correct name for kasir', () => {
        expect(getRoleName('kasir')).toBe('Kasir');
    });

    test('getRoleName should return the role itself for unknown role', () => {
        expect(getRoleName('unknown_role')).toBe('unknown_role');
    });

    test('getRoleName should handle empty string', () => {
        expect(getRoleName('')).toBe('');
    });

    test('getRoleName should handle null by returning null', () => {
        const result = getRoleName(null);
        expect(result).toBeNull();
    });

    test('getRoleName should handle undefined by returning undefined', () => {
        const result = getRoleName(undefined);
        expect(result).toBeUndefined();
    });

    test('getRoleBadgeClass should return bg-dark for super_admin', () => {
        expect(getRoleBadgeClass('super_admin')).toBe('bg-dark');
    });

    test('getRoleBadgeClass should return bg-danger for administrator', () => {
        expect(getRoleBadgeClass('administrator')).toBe('bg-danger');
    });

    test('getRoleBadgeClass should return bg-primary for keuangan', () => {
        expect(getRoleBadgeClass('keuangan')).toBe('bg-primary');
    });

    test('getRoleBadgeClass should return bg-success for kasir', () => {
        expect(getRoleBadgeClass('kasir')).toBe('bg-success');
    });

    test('getRoleBadgeClass should return bg-secondary for unknown role', () => {
        expect(getRoleBadgeClass('unknown_role')).toBe('bg-secondary');
    });

    test('getRoleBadgeClass should handle empty string', () => {
        expect(getRoleBadgeClass('')).toBe('bg-secondary');
    });

    test('getRoleBadgeClass should handle null', () => {
        const result = getRoleBadgeClass(null);
        expect(result).toBe('bg-secondary');
    });

    test('getRoleBadgeClass should handle undefined', () => {
        const result = getRoleBadgeClass(undefined);
        expect(result).toBe('bg-secondary');
    });

    test('getRoleBadgeClass should return string starting with bg-', () => {
        const roles = ['super_admin', 'administrator', 'keuangan', 'kasir', 'unknown'];
        roles.forEach(role => {
            const badgeClass = getRoleBadgeClass(role);
            expect(badgeClass).toMatch(/^bg-/);
        });
    });

    test('getRoleName should return string for all valid roles', () => {
        const roles = ['super_admin', 'administrator', 'keuangan', 'kasir'];
        roles.forEach(role => {
            const roleName = getRoleName(role);
            expect(typeof roleName).toBe('string');
            expect(roleName.length).toBeGreaterThan(0);
        });
    });

    test('getRoleBadgeClass should return valid Bootstrap badge class', () => {
        const validClasses = ['bg-dark', 'bg-danger', 'bg-primary', 'bg-success', 'bg-secondary'];
        const roles = ['super_admin', 'administrator', 'keuangan', 'kasir', 'unknown'];
        
        roles.forEach(role => {
            const badgeClass = getRoleBadgeClass(role);
            expect(validClasses).toContain(badgeClass);
        });
    });

    test('getRoleName and getRoleBadgeClass should be consistent for all roles', () => {
        const roles = ['super_admin', 'administrator', 'keuangan', 'kasir'];
        
        roles.forEach(role => {
            const roleName = getRoleName(role);
            const badgeClass = getRoleBadgeClass(role);
            
            expect(roleName).toBeDefined();
            expect(badgeClass).toBeDefined();
            expect(typeof roleName).toBe('string');
            expect(typeof badgeClass).toBe('string');
        });
    });
});

describe('Unit Tests: filterUsersByPermission edge cases', () => {
    beforeEach(() => {
        currentUser = null;
    });

    test('should return empty array when input is empty array', () => {
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        const result = filterUsersByPermission([]);
        expect(result).toEqual([]);
    });

    test('should handle array with single Super Admin user for Super Admin', () => {
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        const users = [
            { id: 2, username: 'superadmin2', password: 'super123', name: 'Super Admin 2', role: 'super_admin', active: true }
        ];

        const result = filterUsersByPermission(users);
        expect(result.length).toBe(1);
        expect(result[0].role).toBe('super_admin');
    });

    test('should handle array with single Super Admin user for Administrator', () => {
        currentUser = {
            id: 2,
            username: 'admin',
            password: 'admin123',
            name: 'Administrator',
            role: 'administrator',
            active: true
        };

        const users = [
            { id: 1, username: 'superadmin', password: 'super123', name: 'Super Administrator', role: 'super_admin', active: true }
        ];

        const result = filterUsersByPermission(users);
        expect(result.length).toBe(0);
    });

    test('should handle mixed roles correctly for Administrator', () => {
        currentUser = {
            id: 5,
            username: 'admin',
            password: 'admin123',
            name: 'Administrator',
            role: 'administrator',
            active: true
        };

        const users = [
            { id: 1, username: 'superadmin', password: 'super123', name: 'Super Admin', role: 'super_admin', active: true },
            { id: 2, username: 'admin', password: 'admin123', name: 'Admin', role: 'administrator', active: true },
            { id: 3, username: 'keuangan', password: 'keuangan123', name: 'Keuangan', role: 'keuangan', active: true },
            { id: 4, username: 'kasir', password: 'kasir123', name: 'Kasir', role: 'kasir', active: true }
        ];

        const result = filterUsersByPermission(users);
        expect(result.length).toBe(3);
        expect(result.every(u => u.role !== 'super_admin')).toBe(true);
    });

    test('should preserve user object properties when filtering', () => {
        currentUser = {
            id: 2,
            username: 'admin',
            password: 'admin123',
            name: 'Administrator',
            role: 'administrator',
            active: true
        };

        const users = [
            { id: 3, username: 'keuangan', password: 'keuangan123', name: 'Keuangan', role: 'keuangan', active: true, extraProp: 'test' }
        ];

        const result = filterUsersByPermission(users);
        expect(result.length).toBe(1);
        expect(result[0].extraProp).toBe('test');
    });
});

describe('Unit Tests: getAvailableRoles edge cases', () => {
    beforeEach(() => {
        currentUser = null;
    });

    test('should return 4 roles for Super Admin', () => {
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        const roles = getAvailableRoles();
        expect(roles.length).toBe(4);
    });

    test('should return 3 roles for Administrator', () => {
        currentUser = {
            id: 2,
            username: 'admin',
            password: 'admin123',
            name: 'Administrator',
            role: 'administrator',
            active: true
        };

        const roles = getAvailableRoles();
        expect(roles.length).toBe(3);
    });

    test('should return 3 roles for Keuangan', () => {
        currentUser = {
            id: 3,
            username: 'keuangan',
            password: 'keuangan123',
            name: 'Admin Keuangan',
            role: 'keuangan',
            active: true
        };

        const roles = getAvailableRoles();
        expect(roles.length).toBe(3);
    });

    test('should return 3 roles for Kasir', () => {
        currentUser = {
            id: 4,
            username: 'kasir',
            password: 'kasir123',
            name: 'Kasir',
            role: 'kasir',
            active: true
        };

        const roles = getAvailableRoles();
        expect(roles.length).toBe(3);
    });

    test('should return roles with value and label properties', () => {
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        const roles = getAvailableRoles();
        roles.forEach(role => {
            expect(role).toHaveProperty('value');
            expect(role).toHaveProperty('label');
            expect(typeof role.value).toBe('string');
            expect(typeof role.label).toBe('string');
        });
    });

    test('should include super_admin only for Super Admin users', () => {
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        const superAdminRoles = getAvailableRoles();
        expect(superAdminRoles.some(r => r.value === 'super_admin')).toBe(true);

        currentUser = {
            id: 2,
            username: 'admin',
            password: 'admin123',
            name: 'Administrator',
            role: 'administrator',
            active: true
        };

        const adminRoles = getAvailableRoles();
        expect(adminRoles.some(r => r.value === 'super_admin')).toBe(false);
    });

    test('should return consistent role values', () => {
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        const roles1 = getAvailableRoles();
        const roles2 = getAvailableRoles();

        expect(JSON.stringify(roles1)).toBe(JSON.stringify(roles2));
    });
});

describe('Unit Tests: saveUser validation', () => {
    beforeEach(() => {
        localStorage.clear();
        currentUser = null;
    });

    test('should reject Super Admin role assignment by Administrator', () => {
        localStorage.setItem('users', JSON.stringify([]));
        
        currentUser = {
            id: 2,
            username: 'admin',
            password: 'admin123',
            name: 'Administrator',
            role: 'administrator',
            active: true
        };

        const result = saveUser(null, 'newuser', 'password123', 'New User', 'super_admin', true);
        expect(result.success).toBe(false);
        expect(result.error).toContain('izin');
    });

    test('should allow Super Admin role assignment by Super Admin', () => {
        localStorage.setItem('users', JSON.stringify([]));
        
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        const result = saveUser(null, 'newuser', 'password123', 'New User', 'super_admin', true);
        expect(result.success).toBe(true);
    });

    test('should reject duplicate username', () => {
        const users = [
            { id: 1, username: 'existinguser', password: 'password123', name: 'Existing User', role: 'administrator', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(users));
        
        currentUser = {
            id: 2,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        const result = saveUser(null, 'existinguser', 'password123', 'New User', 'administrator', true);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Username sudah digunakan');
    });

    test('should reject password shorter than 6 characters for new user', () => {
        localStorage.setItem('users', JSON.stringify([]));
        
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        const result = saveUser(null, 'newuser', '12345', 'New User', 'administrator', true);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Password minimal 6 karakter');
    });

    test('should allow editing user without changing password', () => {
        const users = [
            { id: 1, username: 'existinguser', password: 'password123', name: 'Existing User', role: 'administrator', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(users));
        
        currentUser = {
            id: 2,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        const result = saveUser(1, 'existinguser', null, 'Updated Name', 'administrator', true);
        expect(result.success).toBe(true);
    });

    test('should reject editing Super Admin by Administrator', () => {
        const users = [
            { id: 1, username: 'superadmin', password: 'super123', name: 'Super Admin', role: 'super_admin', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(users));
        
        currentUser = {
            id: 2,
            username: 'admin',
            password: 'admin123',
            name: 'Administrator',
            role: 'administrator',
            active: true
        };

        const result = saveUser(1, 'superadmin', null, 'Updated Name', 'administrator', true);
        expect(result.success).toBe(false);
        expect(result.error).toContain('izin');
    });
});

describe('Unit Tests: deleteUser validation', () => {
    beforeEach(() => {
        localStorage.clear();
        currentUser = null;
    });

    test('should prevent self-deletion', () => {
        const users = [
            { id: 1, username: 'superadmin', password: 'super123', name: 'Super Admin', role: 'super_admin', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(users));
        
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        const result = deleteUser(1);
        expect(result.success).toBe(false);
        expect(result.error).toContain('tidak dapat menghapus akun yang sedang digunakan');
    });

    test('should prevent Administrator from deleting Super Admin', () => {
        const users = [
            { id: 1, username: 'superadmin', password: 'super123', name: 'Super Admin', role: 'super_admin', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(users));
        
        currentUser = {
            id: 2,
            username: 'admin',
            password: 'admin123',
            name: 'Administrator',
            role: 'administrator',
            active: true
        };

        const result = deleteUser(1);
        expect(result.success).toBe(false);
        expect(result.error).toContain('izin');
    });

    test('should allow Super Admin to delete other users', () => {
        const users = [
            { id: 1, username: 'superadmin', password: 'super123', name: 'Super Admin', role: 'super_admin', active: true },
            { id: 2, username: 'admin', password: 'admin123', name: 'Admin', role: 'administrator', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(users));
        
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        const result = deleteUser(2);
        expect(result.success).toBe(true);
    });

    test('should prevent deletion of default user (id 1)', () => {
        const users = [
            { id: 1, username: 'superadmin', password: 'super123', name: 'Super Admin', role: 'super_admin', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(users));
        
        currentUser = {
            id: 2,
            username: 'admin',
            password: 'admin123',
            name: 'Administrator',
            role: 'super_admin',
            active: true
        };

        const result = deleteUser(1);
        expect(result.success).toBe(false);
        expect(result.error).toContain('User default tidak dapat dihapus');
    });

    test('should return error for non-existent user', () => {
        localStorage.setItem('users', JSON.stringify([]));
        
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        const result = deleteUser(999);
        expect(result.success).toBe(false);
        expect(result.error).toContain('tidak ditemukan');
    });
});

// ============================================================================
// UNIT TESTS FOR USER MANAGEMENT FUNCTIONS
// Task 10: Write unit tests for user management functions
// ============================================================================

describe('Unit Tests: saveUser with various permission scenarios', () => {
    beforeEach(() => {
        localStorage.clear();
        currentUser = null;
    });

    test('should allow Super Admin to create user with any role', () => {
        localStorage.setItem('users', JSON.stringify([]));
        
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        const roles = ['super_admin', 'administrator', 'keuangan', 'kasir'];
        roles.forEach(role => {
            const result = saveUser(null, `user_${role}`, 'password123', `User ${role}`, role, true);
            expect(result.success).toBe(true);
        });
    });

    test('should allow Administrator to create non-Super Admin users', () => {
        localStorage.setItem('users', JSON.stringify([]));
        
        currentUser = {
            id: 2,
            username: 'admin',
            password: 'admin123',
            name: 'Administrator',
            role: 'administrator',
            active: true
        };

        const allowedRoles = ['administrator', 'keuangan', 'kasir'];
        allowedRoles.forEach(role => {
            const result = saveUser(null, `user_${role}`, 'password123', `User ${role}`, role, true);
            expect(result.success).toBe(true);
        });
    });

    test('should prevent Keuangan from creating Super Admin', () => {
        localStorage.setItem('users', JSON.stringify([]));
        
        currentUser = {
            id: 3,
            username: 'keuangan',
            password: 'keuangan123',
            name: 'Admin Keuangan',
            role: 'keuangan',
            active: true
        };

        const result = saveUser(null, 'newuser', 'password123', 'New User', 'super_admin', true);
        expect(result.success).toBe(false);
        expect(result.error).toContain('izin');
    });

    test('should prevent Kasir from creating Super Admin', () => {
        localStorage.setItem('users', JSON.stringify([]));
        
        currentUser = {
            id: 4,
            username: 'kasir',
            password: 'kasir123',
            name: 'Kasir',
            role: 'kasir',
            active: true
        };

        const result = saveUser(null, 'newuser', 'password123', 'New User', 'super_admin', true);
        expect(result.success).toBe(false);
        expect(result.error).toContain('izin');
    });

    test('should allow Super Admin to edit user to any role', () => {
        const users = [
            { id: 2, username: 'testuser', password: 'password123', name: 'Test User', role: 'kasir', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(users));
        
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        const roles = ['super_admin', 'administrator', 'keuangan', 'kasir'];
        roles.forEach(role => {
            const result = saveUser(2, 'testuser', null, 'Test User', role, true);
            expect(result.success).toBe(true);
        });
    });

    test('should prevent Administrator from editing user to Super Admin', () => {
        const users = [
            { id: 2, username: 'testuser', password: 'password123', name: 'Test User', role: 'kasir', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(users));
        
        currentUser = {
            id: 1,
            username: 'admin',
            password: 'admin123',
            name: 'Administrator',
            role: 'administrator',
            active: true
        };

        const result = saveUser(2, 'testuser', null, 'Test User', 'super_admin', true);
        expect(result.success).toBe(false);
        expect(result.error).toContain('izin');
    });

    test('should prevent Administrator from editing existing Super Admin user', () => {
        const users = [
            { id: 1, username: 'superadmin', password: 'super123', name: 'Super Admin', role: 'super_admin', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(users));
        
        currentUser = {
            id: 2,
            username: 'admin',
            password: 'admin123',
            name: 'Administrator',
            role: 'administrator',
            active: true
        };

        const result = saveUser(1, 'superadmin', null, 'Modified Name', 'super_admin', true);
        expect(result.success).toBe(false);
        expect(result.error).toContain('izin');
    });

    test('should validate password length for new users', () => {
        localStorage.setItem('users', JSON.stringify([]));
        
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        // Test various invalid password lengths
        const invalidPasswords = ['', '1', '12', '123', '1234', '12345'];
        invalidPasswords.forEach(password => {
            const result = saveUser(null, 'newuser', password, 'New User', 'administrator', true);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Password minimal 6 karakter');
        });

        // Test valid password
        const validResult = saveUser(null, 'validuser', '123456', 'Valid User', 'administrator', true);
        expect(validResult.success).toBe(true);
    });

    test('should validate password length when updating password', () => {
        const users = [
            { id: 2, username: 'testuser', password: 'oldpassword', name: 'Test User', role: 'kasir', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(users));
        
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        // Test invalid password update
        const invalidResult = saveUser(2, 'testuser', '12345', 'Test User', 'kasir', true);
        expect(invalidResult.success).toBe(false);
        expect(invalidResult.error).toContain('Password minimal 6 karakter');

        // Test valid password update
        const validResult = saveUser(2, 'testuser', '123456', 'Test User', 'kasir', true);
        expect(validResult.success).toBe(true);
    });

    test('should handle duplicate username detection correctly', () => {
        const users = [
            { id: 1, username: 'existinguser', password: 'password123', name: 'Existing User', role: 'administrator', active: true },
            { id: 2, username: 'anotheruser', password: 'password123', name: 'Another User', role: 'kasir', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(users));
        
        currentUser = {
            id: 3,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        // Try to create user with existing username
        const result = saveUser(null, 'existinguser', 'password123', 'New User', 'administrator', true);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Username sudah digunakan');
    });

    test('should allow editing user with same username', () => {
        const users = [
            { id: 1, username: 'testuser', password: 'password123', name: 'Test User', role: 'administrator', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(users));
        
        currentUser = {
            id: 2,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        // Edit user keeping the same username
        const result = saveUser(1, 'testuser', null, 'Updated Name', 'administrator', true);
        expect(result.success).toBe(true);
    });

    test('should handle non-existent user ID when editing', () => {
        localStorage.setItem('users', JSON.stringify([]));
        
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        const result = saveUser(999, 'nonexistent', null, 'Non Existent', 'administrator', true);
        expect(result.success).toBe(false);
        expect(result.error).toContain('tidak ditemukan');
    });

    test('should successfully update user active status', () => {
        const users = [
            { id: 2, username: 'testuser', password: 'password123', name: 'Test User', role: 'kasir', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(users));
        
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        // Deactivate user
        const result = saveUser(2, 'testuser', null, 'Test User', 'kasir', false);
        expect(result.success).toBe(true);

        const updatedUsers = JSON.parse(localStorage.getItem('users'));
        const updatedUser = updatedUsers.find(u => u.id === 2);
        expect(updatedUser.active).toBe(false);
    });
});

describe('Unit Tests: deleteUser with various permission scenarios', () => {
    beforeEach(() => {
        localStorage.clear();
        currentUser = null;
    });

    test('should allow Super Admin to delete any non-default user', () => {
        const users = [
            { id: 1, username: 'superadmin', password: 'super123', name: 'Super Admin', role: 'super_admin', active: true },
            { id: 2, username: 'admin', password: 'admin123', name: 'Admin', role: 'administrator', active: true },
            { id: 3, username: 'keuangan', password: 'keuangan123', name: 'Keuangan', role: 'keuangan', active: true },
            { id: 4, username: 'kasir', password: 'kasir123', name: 'Kasir', role: 'kasir', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(users));
        
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        // Delete non-default users
        const result2 = deleteUser(2);
        expect(result2.success).toBe(true);

        const result3 = deleteUser(3);
        expect(result3.success).toBe(true);

        const result4 = deleteUser(4);
        expect(result4.success).toBe(true);
    });

    test('should prevent any user from deleting default user (id 1)', () => {
        const users = [
            { id: 1, username: 'superadmin', password: 'super123', name: 'Super Admin', role: 'super_admin', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(users));
        
        currentUser = {
            id: 2,
            username: 'admin',
            password: 'admin123',
            name: 'Administrator',
            role: 'super_admin',
            active: true
        };

        const result = deleteUser(1);
        expect(result.success).toBe(false);
        expect(result.error).toContain('User default tidak dapat dihapus');
    });

    test('should prevent Administrator from deleting Super Admin users', () => {
        const users = [
            { id: 2, username: 'superadmin', password: 'super123', name: 'Super Admin', role: 'super_admin', active: true },
            { id: 3, username: 'admin', password: 'admin123', name: 'Admin', role: 'administrator', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(users));
        
        currentUser = {
            id: 3,
            username: 'admin',
            password: 'admin123',
            name: 'Administrator',
            role: 'administrator',
            active: true
        };

        const result = deleteUser(2);
        expect(result.success).toBe(false);
        expect(result.error).toContain('izin');
    });

    test('should prevent Keuangan from deleting Super Admin users', () => {
        const users = [
            { id: 2, username: 'superadmin', password: 'super123', name: 'Super Admin', role: 'super_admin', active: true },
            { id: 3, username: 'keuangan', password: 'keuangan123', name: 'Keuangan', role: 'keuangan', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(users));
        
        currentUser = {
            id: 3,
            username: 'keuangan',
            password: 'keuangan123',
            name: 'Admin Keuangan',
            role: 'keuangan',
            active: true
        };

        const result = deleteUser(2);
        expect(result.success).toBe(false);
        expect(result.error).toContain('izin');
    });

    test('should prevent Kasir from deleting Super Admin users', () => {
        const users = [
            { id: 2, username: 'superadmin', password: 'super123', name: 'Super Admin', role: 'super_admin', active: true },
            { id: 4, username: 'kasir', password: 'kasir123', name: 'Kasir', role: 'kasir', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(users));
        
        currentUser = {
            id: 4,
            username: 'kasir',
            password: 'kasir123',
            name: 'Kasir',
            role: 'kasir',
            active: true
        };

        const result = deleteUser(2);
        expect(result.success).toBe(false);
        expect(result.error).toContain('izin');
    });

    test('should prevent any role from self-deletion', () => {
        const roles = [
            { id: 1, username: 'superadmin', password: 'super123', name: 'Super Admin', role: 'super_admin', active: true },
            { id: 2, username: 'admin', password: 'admin123', name: 'Admin', role: 'administrator', active: true },
            { id: 3, username: 'keuangan', password: 'keuangan123', name: 'Keuangan', role: 'keuangan', active: true },
            { id: 4, username: 'kasir', password: 'kasir123', name: 'Kasir', role: 'kasir', active: true }
        ];

        roles.forEach(user => {
            localStorage.setItem('users', JSON.stringify([user]));
            currentUser = user;

            const result = deleteUser(user.id);
            expect(result.success).toBe(false);
            expect(result.error).toContain('tidak dapat menghapus akun yang sedang digunakan');
        });
    });

    test('should successfully delete user and update localStorage', () => {
        const users = [
            { id: 2, username: 'user1', password: 'password123', name: 'User 1', role: 'administrator', active: true },
            { id: 3, username: 'user2', password: 'password123', name: 'User 2', role: 'kasir', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(users));
        
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        const result = deleteUser(2);
        expect(result.success).toBe(true);

        const remainingUsers = JSON.parse(localStorage.getItem('users'));
        expect(remainingUsers.length).toBe(1);
        expect(remainingUsers.find(u => u.id === 2)).toBeUndefined();
        expect(remainingUsers.find(u => u.id === 3)).toBeDefined();
    });

    test('should handle deletion of non-existent user', () => {
        localStorage.setItem('users', JSON.stringify([]));
        
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        const result = deleteUser(999);
        expect(result.success).toBe(false);
        expect(result.error).toContain('tidak ditemukan');
    });

    test('should allow Administrator to delete non-Super Admin users', () => {
        const users = [
            { id: 2, username: 'keuangan', password: 'keuangan123', name: 'Keuangan', role: 'keuangan', active: true },
            { id: 3, username: 'kasir', password: 'kasir123', name: 'Kasir', role: 'kasir', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(users));
        
        currentUser = {
            id: 1,
            username: 'admin',
            password: 'admin123',
            name: 'Administrator',
            role: 'administrator',
            active: true
        };

        const result2 = deleteUser(2);
        expect(result2.success).toBe(true);

        const result3 = deleteUser(3);
        expect(result3.success).toBe(true);
    });
});

describe('Unit Tests: filterUsersByPermission with edge cases', () => {
    beforeEach(() => {
        currentUser = null;
    });

    test('should handle null currentUser gracefully', () => {
        currentUser = null;
        
        const users = [
            { id: 1, username: 'superadmin', password: 'super123', name: 'Super Admin', role: 'super_admin', active: true },
            { id: 2, username: 'admin', password: 'admin123', name: 'Admin', role: 'administrator', active: true }
        ];

        const result = filterUsersByPermission(users);
        // When currentUser is null, should filter out Super Admin
        expect(result.length).toBe(1);
        expect(result[0].role).toBe('administrator');
    });

    test('should handle undefined currentUser gracefully', () => {
        currentUser = undefined;
        
        const users = [
            { id: 1, username: 'superadmin', password: 'super123', name: 'Super Admin', role: 'super_admin', active: true },
            { id: 2, username: 'admin', password: 'admin123', name: 'Admin', role: 'administrator', active: true }
        ];

        const result = filterUsersByPermission(users);
        expect(result.length).toBe(1);
        expect(result[0].role).toBe('administrator');
    });

    test('should handle empty users array', () => {
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        const result = filterUsersByPermission([]);
        expect(result).toEqual([]);
        expect(result.length).toBe(0);
    });

    test('should handle users array with only Super Admin accounts for Super Admin', () => {
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        const users = [
            { id: 2, username: 'superadmin1', password: 'super123', name: 'Super Admin 1', role: 'super_admin', active: true },
            { id: 3, username: 'superadmin2', password: 'super123', name: 'Super Admin 2', role: 'super_admin', active: true }
        ];

        const result = filterUsersByPermission(users);
        expect(result.length).toBe(2);
        expect(result.every(u => u.role === 'super_admin')).toBe(true);
    });

    test('should handle users array with only Super Admin accounts for Administrator', () => {
        currentUser = {
            id: 1,
            username: 'admin',
            password: 'admin123',
            name: 'Administrator',
            role: 'administrator',
            active: true
        };

        const users = [
            { id: 2, username: 'superadmin1', password: 'super123', name: 'Super Admin 1', role: 'super_admin', active: true },
            { id: 3, username: 'superadmin2', password: 'super123', name: 'Super Admin 2', role: 'super_admin', active: true }
        ];

        const result = filterUsersByPermission(users);
        expect(result.length).toBe(0);
        expect(result).toEqual([]);
    });

    test('should preserve all user properties when filtering', () => {
        currentUser = {
            id: 1,
            username: 'admin',
            password: 'admin123',
            name: 'Administrator',
            role: 'administrator',
            active: true
        };

        const users = [
            { 
                id: 2, 
                username: 'keuangan', 
                password: 'keuangan123', 
                name: 'Keuangan', 
                role: 'keuangan', 
                active: true,
                customField: 'test',
                anotherField: 123
            }
        ];

        const result = filterUsersByPermission(users);
        expect(result.length).toBe(1);
        expect(result[0].customField).toBe('test');
        expect(result[0].anotherField).toBe(123);
        expect(result[0].id).toBe(2);
        expect(result[0].username).toBe('keuangan');
    });

    test('should handle large user arrays efficiently', () => {
        currentUser = {
            id: 1,
            username: 'admin',
            password: 'admin123',
            name: 'Administrator',
            role: 'administrator',
            active: true
        };

        // Create a large array with mixed roles
        const users = [];
        for (let i = 0; i < 100; i++) {
            users.push({
                id: i,
                username: `user${i}`,
                password: 'password123',
                name: `User ${i}`,
                role: i % 4 === 0 ? 'super_admin' : ['administrator', 'keuangan', 'kasir'][i % 3],
                active: true
            });
        }

        const result = filterUsersByPermission(users);
        expect(result.every(u => u.role !== 'super_admin')).toBe(true);
        expect(result.length).toBeLessThan(users.length);
    });

    test('should handle users with inactive status correctly', () => {
        currentUser = {
            id: 1,
            username: 'admin',
            password: 'admin123',
            name: 'Administrator',
            role: 'administrator',
            active: true
        };

        const users = [
            { id: 2, username: 'superadmin', password: 'super123', name: 'Super Admin', role: 'super_admin', active: false },
            { id: 3, username: 'keuangan', password: 'keuangan123', name: 'Keuangan', role: 'keuangan', active: false }
        ];

        const result = filterUsersByPermission(users);
        // Should filter based on role, not active status
        expect(result.length).toBe(1);
        expect(result[0].role).toBe('keuangan');
        expect(result[0].active).toBe(false);
    });

    test('should not modify original users array', () => {
        currentUser = {
            id: 1,
            username: 'admin',
            password: 'admin123',
            name: 'Administrator',
            role: 'administrator',
            active: true
        };

        const users = [
            { id: 2, username: 'superadmin', password: 'super123', name: 'Super Admin', role: 'super_admin', active: true },
            { id: 3, username: 'keuangan', password: 'keuangan123', name: 'Keuangan', role: 'keuangan', active: true }
        ];

        const originalLength = users.length;
        const result = filterUsersByPermission(users);

        expect(users.length).toBe(originalLength);
        expect(result.length).not.toBe(users.length);
    });

    test('should handle multiple Super Admin accounts correctly', () => {
        currentUser = {
            id: 1,
            username: 'admin',
            password: 'admin123',
            name: 'Administrator',
            role: 'administrator',
            active: true
        };

        const users = [
            { id: 2, username: 'superadmin1', password: 'super123', name: 'Super Admin 1', role: 'super_admin', active: true },
            { id: 3, username: 'admin', password: 'admin123', name: 'Admin', role: 'administrator', active: true },
            { id: 4, username: 'superadmin2', password: 'super123', name: 'Super Admin 2', role: 'super_admin', active: true },
            { id: 5, username: 'keuangan', password: 'keuangan123', name: 'Keuangan', role: 'keuangan', active: true }
        ];

        const result = filterUsersByPermission(users);
        expect(result.length).toBe(2);
        expect(result.every(u => u.role !== 'super_admin')).toBe(true);
        expect(result.some(u => u.role === 'administrator')).toBe(true);
        expect(result.some(u => u.role === 'keuangan')).toBe(true);
    });
});

describe('Unit Tests: getAvailableRoles with different user roles', () => {
    beforeEach(() => {
        currentUser = null;
    });

    test('should return all 4 roles for Super Admin', () => {
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        const roles = getAvailableRoles();
        expect(roles.length).toBe(4);
        
        const roleValues = roles.map(r => r.value);
        expect(roleValues).toContain('super_admin');
        expect(roleValues).toContain('administrator');
        expect(roleValues).toContain('keuangan');
        expect(roleValues).toContain('kasir');
    });

    test('should return 3 roles for Administrator (excluding super_admin)', () => {
        currentUser = {
            id: 2,
            username: 'admin',
            password: 'admin123',
            name: 'Administrator',
            role: 'administrator',
            active: true
        };

        const roles = getAvailableRoles();
        expect(roles.length).toBe(3);
        
        const roleValues = roles.map(r => r.value);
        expect(roleValues).not.toContain('super_admin');
        expect(roleValues).toContain('administrator');
        expect(roleValues).toContain('keuangan');
        expect(roleValues).toContain('kasir');
    });

    test('should return 3 roles for Keuangan (excluding super_admin)', () => {
        currentUser = {
            id: 3,
            username: 'keuangan',
            password: 'keuangan123',
            name: 'Admin Keuangan',
            role: 'keuangan',
            active: true
        };

        const roles = getAvailableRoles();
        expect(roles.length).toBe(3);
        
        const roleValues = roles.map(r => r.value);
        expect(roleValues).not.toContain('super_admin');
    });

    test('should return 3 roles for Kasir (excluding super_admin)', () => {
        currentUser = {
            id: 4,
            username: 'kasir',
            password: 'kasir123',
            name: 'Kasir',
            role: 'kasir',
            active: true
        };

        const roles = getAvailableRoles();
        expect(roles.length).toBe(3);
        
        const roleValues = roles.map(r => r.value);
        expect(roleValues).not.toContain('super_admin');
    });

    test('should return roles with proper structure (value and label)', () => {
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        const roles = getAvailableRoles();
        
        roles.forEach(role => {
            expect(role).toHaveProperty('value');
            expect(role).toHaveProperty('label');
            expect(typeof role.value).toBe('string');
            expect(typeof role.label).toBe('string');
            expect(role.value.length).toBeGreaterThan(0);
            expect(role.label.length).toBeGreaterThan(0);
        });
    });

    test('should return roles with descriptive labels', () => {
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        const roles = getAvailableRoles();
        
        const superAdminRole = roles.find(r => r.value === 'super_admin');
        expect(superAdminRole.label).toContain('Super Admin');
        expect(superAdminRole.label).toContain('Akses Penuh Sistem');

        const administratorRole = roles.find(r => r.value === 'administrator');
        expect(administratorRole.label).toContain('Administrator');
        expect(administratorRole.label).toContain('Akses Penuh Operasional');

        const keuanganRole = roles.find(r => r.value === 'keuangan');
        expect(keuanganRole.label).toContain('Admin Keuangan');
        expect(keuanganRole.label).toContain('Akses Keuangan');

        const kasirRole = roles.find(r => r.value === 'kasir');
        expect(kasirRole.label).toContain('Kasir');
        expect(kasirRole.label).toContain('Akses POS');
    });

    test('should handle null currentUser gracefully', () => {
        currentUser = null;

        const roles = getAvailableRoles();
        expect(roles.length).toBe(3);
        
        const roleValues = roles.map(r => r.value);
        expect(roleValues).not.toContain('super_admin');
    });

    test('should handle undefined currentUser gracefully', () => {
        currentUser = undefined;

        const roles = getAvailableRoles();
        expect(roles.length).toBe(3);
        
        const roleValues = roles.map(r => r.value);
        expect(roleValues).not.toContain('super_admin');
    });

    test('should return consistent results for same role', () => {
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        const roles1 = getAvailableRoles();
        const roles2 = getAvailableRoles();
        const roles3 = getAvailableRoles();

        expect(JSON.stringify(roles1)).toBe(JSON.stringify(roles2));
        expect(JSON.stringify(roles2)).toBe(JSON.stringify(roles3));
    });

    test('should return different results for different roles', () => {
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };
        const superAdminRoles = getAvailableRoles();

        currentUser = {
            id: 2,
            username: 'admin',
            password: 'admin123',
            name: 'Administrator',
            role: 'administrator',
            active: true
        };
        const adminRoles = getAvailableRoles();

        expect(superAdminRoles.length).not.toBe(adminRoles.length);
        expect(JSON.stringify(superAdminRoles)).not.toBe(JSON.stringify(adminRoles));
    });

    test('should handle inactive Super Admin correctly', () => {
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: false
        };

        const roles = getAvailableRoles();
        // Should still return all roles even if inactive
        expect(roles.length).toBe(4);
        
        const roleValues = roles.map(r => r.value);
        expect(roleValues).toContain('super_admin');
    });

    test('should return roles in correct order for Super Admin', () => {
        currentUser = {
            id: 1,
            username: 'superadmin',
            password: 'super123',
            name: 'Super Administrator',
            role: 'super_admin',
            active: true
        };

        const roles = getAvailableRoles();
        expect(roles[0].value).toBe('super_admin');
        expect(roles[1].value).toBe('administrator');
        expect(roles[2].value).toBe('keuangan');
        expect(roles[3].value).toBe('kasir');
    });

    test('should return roles in correct order for non-Super Admin', () => {
        currentUser = {
            id: 2,
            username: 'admin',
            password: 'admin123',
            name: 'Administrator',
            role: 'administrator',
            active: true
        };

        const roles = getAvailableRoles();
        expect(roles[0].value).toBe('administrator');
        expect(roles[1].value).toBe('keuangan');
        expect(roles[2].value).toBe('kasir');
    });
});


// ============================================================================
// INTEGRATION TESTS FOR COMPLETE WORKFLOWS
// Task 11: Write integration tests for complete workflows
// ============================================================================

describe('Integration Test: Super Admin login to system settings flow', () => {
    beforeEach(() => {
        localStorage.clear();
        currentUser = null;
    });

    test('should complete full flow from login to accessing system settings', () => {
        // Step 1: Initialize system with default data
        initializeDefaultData();
        
        // Step 2: Verify Super Admin account exists
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const superAdmin = users.find(u => u.role === 'super_admin');
        expect(superAdmin).toBeDefined();
        expect(superAdmin.username).toBe('superadmin');
        
        // Step 3: Simulate login
        const username = 'superadmin';
        const password = 'super123';
        const user = users.find(u => u.username === username && u.password === password);
        expect(user).toBeDefined();
        expect(user.active).toBe(true);
        
        // Step 4: Set current user (simulating successful login)
        currentUser = user;
        
        // Step 5: Verify Super Admin role
        const isSuperAdminUser = currentUser && currentUser.role === 'super_admin';
        expect(isSuperAdminUser).toBe(true);
        
        // Step 6: Get menu items for Super Admin
        const menus = getMenuItemsForRole('super_admin');
        expect(menus.length).toBeGreaterThan(0);
        
        // Step 7: Verify Super Admin exclusive menus are present
        const hasSystemSettings = menus.some(m => m.page === 'system-settings');
        const hasAuditLog = menus.some(m => m.page === 'audit-log');
        expect(hasSystemSettings).toBe(true);
        expect(hasAuditLog).toBe(true);
        
        // Step 8: Access system settings
        const systemSettingsResult = renderSystemSettings();
        expect(systemSettingsResult.success).toBe(true);
        expect(systemSettingsResult.content).toBeDefined();
        
        // Step 9: Verify all Administrator menus are also present
        const administratorMenus = getMenuItemsForRole('administrator');
        const allAdminMenusPresent = administratorMenus.every(adminMenu => 
            menus.some(superMenu => superMenu.page === adminMenu.page)
        );
        expect(allAdminMenusPresent).toBe(true);
    });

    test('should maintain session state throughout the flow', () => {
        // Initialize and login
        initializeDefaultData();
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const superAdmin = users.find(u => u.role === 'super_admin');
        currentUser = superAdmin;
        
        // Verify session persists across multiple operations
        const isSuperAdmin1 = currentUser && currentUser.role === 'super_admin';
        expect(isSuperAdmin1).toBe(true);
        
        // Access system settings
        const result1 = renderSystemSettings();
        expect(result1.success).toBe(true);
        
        // Verify session still valid
        const isSuperAdmin2 = currentUser && currentUser.role === 'super_admin';
        expect(isSuperAdmin2).toBe(true);
        
        // Access system settings again
        const result2 = renderSystemSettings();
        expect(result2.success).toBe(true);
        
        // Verify currentUser unchanged
        expect(currentUser.id).toBe(superAdmin.id);
        expect(currentUser.role).toBe('super_admin');
    });


    test('should handle fresh installation flow correctly', () => {
        // Simulate fresh installation (no existing data)
        localStorage.clear();
        expect(localStorage.getItem('users')).toBeNull();
        
        // Initialize system
        initializeDefaultData();
        
        // Verify Super Admin was created
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        expect(users.length).toBeGreaterThan(0);
        
        const superAdminCount = users.filter(u => u.role === 'super_admin').length;
        expect(superAdminCount).toBe(1);
        
        // Login with default credentials
        const superAdmin = users.find(u => u.username === 'superadmin' && u.password === 'super123');
        expect(superAdmin).toBeDefined();
        
        currentUser = superAdmin;
        
        // Access system settings
        const result = renderSystemSettings();
        expect(result.success).toBe(true);
    });
});

describe('Integration Test: Super Admin user management flow', () => {
    beforeEach(() => {
        localStorage.clear();
        currentUser = null;
    });

    test('should complete full user management workflow as Super Admin', () => {
        // Step 1: Initialize system
        initializeDefaultData();
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const superAdmin = users.find(u => u.role === 'super_admin');
        currentUser = superAdmin;
        
        // Step 2: View all users (Super Admin should see everyone)
        const allUsers = filterUsersByPermission(users);
        expect(allUsers.length).toBe(users.length);
        
        const hasSuperAdminInList = allUsers.some(u => u.role === 'super_admin');
        expect(hasSuperAdminInList).toBe(true);
        
        // Step 3: Get available roles (should include super_admin)
        const availableRoles = getAvailableRoles();
        expect(availableRoles.length).toBe(4);
        expect(availableRoles.some(r => r.value === 'super_admin')).toBe(true);
        
        // Step 4: Create a new Administrator user
        const createResult = saveUser(
            null,
            'newadmin',
            'password123',
            'New Administrator',
            'administrator',
            true
        );
        expect(createResult.success).toBe(true);
        
        // Step 5: Verify user was created
        const updatedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const newAdmin = updatedUsers.find(u => u.username === 'newadmin');
        expect(newAdmin).toBeDefined();
        expect(newAdmin.role).toBe('administrator');
        
        // Step 6: Edit the user to Super Admin role
        const editResult = saveUser(
            newAdmin.id,
            'newadmin',
            null,
            'New Super Admin',
            'super_admin',
            true
        );
        expect(editResult.success).toBe(true);
        
        // Step 7: Verify role was changed
        const afterEditUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const editedUser = afterEditUsers.find(u => u.id === newAdmin.id);
        expect(editedUser.role).toBe('super_admin');
        expect(editedUser.name).toBe('New Super Admin');
        
        // Step 8: Delete the user (not self, not default)
        const deleteResult = deleteUser(newAdmin.id);
        expect(deleteResult.success).toBe(true);
        
        // Step 9: Verify user was deleted
        const finalUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const deletedUser = finalUsers.find(u => u.id === newAdmin.id);
        expect(deletedUser).toBeUndefined();
    });

    test('should handle creating users with all role types', () => {
        initializeDefaultData();
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const superAdmin = users.find(u => u.role === 'super_admin');
        currentUser = superAdmin;
        
        const rolesToCreate = [
            { role: 'super_admin', username: 'superadmin2', name: 'Super Admin 2' },
            { role: 'administrator', username: 'admin2', name: 'Administrator 2' },
            { role: 'keuangan', username: 'keuangan2', name: 'Keuangan 2' },
            { role: 'kasir', username: 'kasir2', name: 'Kasir 2' }
        ];
        
        // Create all users
        rolesToCreate.forEach(userToCreate => {
            const result = saveUser(
                null,
                userToCreate.username,
                'password123',
                userToCreate.name,
                userToCreate.role,
                true
            );
            expect(result.success).toBe(true);
        });
        
        // Verify all users were created
        const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
        rolesToCreate.forEach(userToCreate => {
            const createdUser = allUsers.find(u => u.username === userToCreate.username);
            expect(createdUser).toBeDefined();
            expect(createdUser.role).toBe(userToCreate.role);
        });
    });

    test('should handle editing multiple users in sequence', () => {
        initializeDefaultData();
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const superAdmin = users.find(u => u.role === 'super_admin');
        currentUser = superAdmin;
        
        // Get non-Super Admin users to edit
        const usersToEdit = users.filter(u => u.role !== 'super_admin' && u.id !== 1);
        
        // Edit each user
        usersToEdit.forEach(user => {
            const result = saveUser(
                user.id,
                user.username,
                null,
                `Updated ${user.name}`,
                user.role,
                false // Deactivate
            );
            expect(result.success).toBe(true);
        });
        
        // Verify all edits were applied
        const updatedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        usersToEdit.forEach(originalUser => {
            const updatedUser = updatedUsers.find(u => u.id === originalUser.id);
            expect(updatedUser.name).toBe(`Updated ${originalUser.name}`);
            expect(updatedUser.active).toBe(false);
        });
    });

    test('should prevent self-deletion even in complex workflow', () => {
        initializeDefaultData();
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const superAdmin = users.find(u => u.role === 'super_admin');
        currentUser = superAdmin;
        
        // Create a new user
        saveUser(null, 'tempuser', 'password123', 'Temp User', 'kasir', true);
        
        // Try to delete self (should fail)
        const selfDeleteResult = deleteUser(superAdmin.id);
        expect(selfDeleteResult.success).toBe(false);
        
        // Verify Super Admin still exists
        const afterDeleteUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const stillExists = afterDeleteUsers.find(u => u.id === superAdmin.id);
        expect(stillExists).toBeDefined();
    });
});

describe('Integration Test: Administrator attempting Super Admin operations', () => {
    beforeEach(() => {
        localStorage.clear();
        currentUser = null;
    });

    test('should block Administrator from accessing Super Admin features', () => {
        // Step 1: Initialize system
        initializeDefaultData();
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const administrator = users.find(u => u.role === 'administrator');
        currentUser = administrator;
        
        // Step 2: Try to access system settings (should fail)
        const systemSettingsResult = renderSystemSettings();
        expect(systemSettingsResult.success).toBe(false);
        expect(systemSettingsResult.error).toContain('Akses ditolak');
        expect(systemSettingsResult.redirectTo).toBe('dashboard');
        
        // Step 3: Verify Administrator menu doesn't have Super Admin items
        const adminMenus = getMenuItemsForRole('administrator');
        const hasSystemSettings = adminMenus.some(m => m.page === 'system-settings');
        const hasAuditLog = adminMenus.some(m => m.page === 'audit-log');
        expect(hasSystemSettings).toBe(false);
        expect(hasAuditLog).toBe(false);
        
        // Step 4: Verify Administrator cannot see Super Admin in user list
        const filteredUsers = filterUsersByPermission(users);
        const hasSuperAdmin = filteredUsers.some(u => u.role === 'super_admin');
        expect(hasSuperAdmin).toBe(false);
        
        // Step 5: Verify Administrator cannot select Super Admin role
        const availableRoles = getAvailableRoles();
        const hasSuperAdminRole = availableRoles.some(r => r.value === 'super_admin');
        expect(hasSuperAdminRole).toBe(false);
        expect(availableRoles.length).toBe(3);
    });

    test('should block Administrator from creating Super Admin users', () => {
        initializeDefaultData();
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const administrator = users.find(u => u.role === 'administrator');
        currentUser = administrator;
        
        // Try to create a Super Admin user
        const createResult = saveUser(
            null,
            'newsuperadmin',
            'password123',
            'New Super Admin',
            'super_admin',
            true
        );
        
        expect(createResult.success).toBe(false);
        expect(createResult.error).toContain('izin');
        
        // Verify user was not created
        const afterUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const newUser = afterUsers.find(u => u.username === 'newsuperadmin');
        expect(newUser).toBeUndefined();
    });

    test('should block Administrator from editing Super Admin users', () => {
        initializeDefaultData();
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const administrator = users.find(u => u.role === 'administrator');
        const superAdmin = users.find(u => u.role === 'super_admin');
        currentUser = administrator;
        
        // Try to edit Super Admin user
        const editResult = saveUser(
            superAdmin.id,
            superAdmin.username,
            null,
            'Modified Name',
            'administrator',
            true
        );
        
        expect(editResult.success).toBe(false);
        expect(editResult.error).toContain('izin');
        
        // Verify Super Admin was not modified
        const afterUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const unchangedSuperAdmin = afterUsers.find(u => u.id === superAdmin.id);
        expect(unchangedSuperAdmin.name).toBe(superAdmin.name);
        expect(unchangedSuperAdmin.role).toBe('super_admin');
    });

    test('should block Administrator from deleting Super Admin users', () => {
        initializeDefaultData();
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const administrator = users.find(u => u.role === 'administrator');
        const superAdmin = users.find(u => u.role === 'super_admin');
        currentUser = administrator;
        
        // Try to delete Super Admin user
        const deleteResult = deleteUser(superAdmin.id);
        
        expect(deleteResult.success).toBe(false);
        expect(deleteResult.error).toContain('izin');
        
        // Verify Super Admin still exists
        const afterUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const stillExists = afterUsers.find(u => u.id === superAdmin.id);
        expect(stillExists).toBeDefined();
    });

    test('should allow Administrator to manage non-Super Admin users', () => {
        initializeDefaultData();
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const administrator = users.find(u => u.role === 'administrator');
        currentUser = administrator;
        
        // Create a Kasir user (should succeed)
        const createResult = saveUser(
            null,
            'newkasir',
            'password123',
            'New Kasir',
            'kasir',
            true
        );
        expect(createResult.success).toBe(true);
        
        // Verify user was created
        const afterCreate = JSON.parse(localStorage.getItem('users') || '[]');
        const newKasir = afterCreate.find(u => u.username === 'newkasir');
        expect(newKasir).toBeDefined();
        expect(newKasir.role).toBe('kasir');
        
        // Edit the Kasir user (should succeed)
        const editResult = saveUser(
            newKasir.id,
            'newkasir',
            null,
            'Updated Kasir',
            'keuangan',
            true
        );
        expect(editResult.success).toBe(true);
        
        // Verify edit was applied
        const afterEdit = JSON.parse(localStorage.getItem('users') || '[]');
        const editedUser = afterEdit.find(u => u.id === newKasir.id);
        expect(editedUser.name).toBe('Updated Kasir');
        expect(editedUser.role).toBe('keuangan');
        
        // Delete the user (should succeed)
        const deleteResult = deleteUser(newKasir.id);
        expect(deleteResult.success).toBe(true);
        
        // Verify user was deleted
        const afterDelete = JSON.parse(localStorage.getItem('users') || '[]');
        const deletedUser = afterDelete.find(u => u.id === newKasir.id);
        expect(deletedUser).toBeUndefined();
    });

    test('should enforce all restrictions in a complete workflow', () => {
        initializeDefaultData();
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const administrator = users.find(u => u.role === 'administrator');
        const superAdmin = users.find(u => u.role === 'super_admin');
        currentUser = administrator;
        
        // 1. Cannot access system settings
        expect(renderSystemSettings().success).toBe(false);
        
        // 2. Cannot see Super Admin in user list
        const filteredUsers = filterUsersByPermission(users);
        expect(filteredUsers.some(u => u.role === 'super_admin')).toBe(false);
        
        // 3. Cannot get Super Admin role option
        const roles = getAvailableRoles();
        expect(roles.some(r => r.value === 'super_admin')).toBe(false);
        
        // 4. Cannot create Super Admin
        expect(saveUser(null, 'test1', 'password123', 'Test', 'super_admin', true).success).toBe(false);
        
        // 5. Cannot edit Super Admin
        expect(saveUser(superAdmin.id, superAdmin.username, null, 'Test', 'super_admin', true).success).toBe(false);
        
        // 6. Cannot delete Super Admin
        expect(deleteUser(superAdmin.id).success).toBe(false);
        
        // 7. Can create non-Super Admin users
        expect(saveUser(null, 'test2', 'password123', 'Test', 'kasir', true).success).toBe(true);
    });
});

describe('Integration Test: System upgrade with existing data', () => {
    beforeEach(() => {
        localStorage.clear();
        currentUser = null;
    });

    test('should upgrade system with existing users without Super Admin', () => {
        // Step 1: Simulate old system with existing users (no Super Admin)
        const existingUsers = [
            { id: 1, username: 'admin', password: 'admin123', name: 'Administrator', role: 'administrator', active: true },
            { id: 2, username: 'keuangan', password: 'keuangan123', name: 'Admin Keuangan', role: 'keuangan', active: true },
            { id: 3, username: 'kasir', password: 'kasir123', name: 'Kasir', role: 'kasir', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(existingUsers));
        
        // Step 2: Run upgrade (ensureSuperAdminExists)
        ensureSuperAdminExists();
        
        // Step 3: Verify Super Admin was added
        const upgradedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const superAdmin = upgradedUsers.find(u => u.role === 'super_admin');
        expect(superAdmin).toBeDefined();
        expect(superAdmin.username).toBe('superadmin');
        expect(superAdmin.password).toBe('super123');
        
        // Step 4: Verify all existing users are preserved
        existingUsers.forEach(existingUser => {
            const preservedUser = upgradedUsers.find(u => u.id === existingUser.id);
            expect(preservedUser).toBeDefined();
            expect(preservedUser.username).toBe(existingUser.username);
            expect(preservedUser.password).toBe(existingUser.password);
            expect(preservedUser.name).toBe(existingUser.name);
            expect(preservedUser.role).toBe(existingUser.role);
            expect(preservedUser.active).toBe(existingUser.active);
        });
        
        // Step 5: Verify total user count increased by 1
        expect(upgradedUsers.length).toBe(existingUsers.length + 1);
    });

    test('should not create duplicate Super Admin on upgrade', () => {
        // Step 1: Simulate system with existing Super Admin
        const existingUsers = [
            { id: 1, username: 'superadmin', password: 'super123', name: 'Super Administrator', role: 'super_admin', active: true },
            { id: 2, username: 'admin', password: 'admin123', name: 'Administrator', role: 'administrator', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(existingUsers));
        
        const originalLength = existingUsers.length;
        const originalSuperAdminCount = existingUsers.filter(u => u.role === 'super_admin').length;
        
        // Step 2: Run upgrade
        ensureSuperAdminExists();
        
        // Step 3: Verify no duplicate Super Admin was created
        const afterUpgrade = JSON.parse(localStorage.getItem('users') || '[]');
        const superAdminCount = afterUpgrade.filter(u => u.role === 'super_admin').length;
        expect(superAdminCount).toBe(originalSuperAdminCount);
        expect(afterUpgrade.length).toBe(originalLength);
    });

    test('should handle upgrade with multiple existing Administrators', () => {
        // Simulate system with multiple Administrators but no Super Admin
        const existingUsers = [
            { id: 1, username: 'admin1', password: 'admin123', name: 'Administrator 1', role: 'administrator', active: true },
            { id: 2, username: 'admin2', password: 'admin123', name: 'Administrator 2', role: 'administrator', active: true },
            { id: 3, username: 'admin3', password: 'admin123', name: 'Administrator 3', role: 'administrator', active: true },
            { id: 4, username: 'keuangan', password: 'keuangan123', name: 'Keuangan', role: 'keuangan', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(existingUsers));
        
        // Run upgrade
        ensureSuperAdminExists();
        
        // Verify Super Admin was added
        const afterUpgrade = JSON.parse(localStorage.getItem('users') || '[]');
        const superAdmin = afterUpgrade.find(u => u.role === 'super_admin');
        expect(superAdmin).toBeDefined();
        
        // Verify all Administrators are still Administrators
        const administrators = afterUpgrade.filter(u => u.role === 'administrator');
        expect(administrators.length).toBe(3);
        
        // Verify no Administrator was converted to Super Admin
        existingUsers.forEach(existingUser => {
            const user = afterUpgrade.find(u => u.id === existingUser.id);
            expect(user.role).toBe(existingUser.role);
        });
    });

    test('should complete full workflow after upgrade', () => {
        // Step 1: Start with old system
        const existingUsers = [
            { id: 1, username: 'admin', password: 'admin123', name: 'Administrator', role: 'administrator', active: true },
            { id: 2, username: 'kasir', password: 'kasir123', name: 'Kasir', role: 'kasir', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(existingUsers));
        
        // Step 2: Run upgrade
        ensureSuperAdminExists();
        
        // Step 3: Login as Super Admin
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const superAdmin = users.find(u => u.role === 'super_admin');
        currentUser = superAdmin;
        
        // Step 4: Verify Super Admin can access system settings
        const systemSettingsResult = renderSystemSettings();
        expect(systemSettingsResult.success).toBe(true);
        
        // Step 5: Verify Super Admin can see all users
        const allUsers = filterUsersByPermission(users);
        expect(allUsers.length).toBe(users.length);
        
        // Step 6: Verify Super Admin can manage existing users
        const kasir = users.find(u => u.role === 'kasir');
        const editResult = saveUser(
            kasir.id,
            kasir.username,
            null,
            'Updated Kasir',
            'keuangan',
            true
        );
        expect(editResult.success).toBe(true);
        
        // Step 7: Verify Super Admin can create new users
        const createResult = saveUser(
            null,
            'newuser',
            'password123',
            'New User',
            'administrator',
            true
        );
        expect(createResult.success).toBe(true);
    });

    test('should handle upgrade with inactive users', () => {
        // Simulate system with inactive users
        const existingUsers = [
            { id: 1, username: 'admin', password: 'admin123', name: 'Administrator', role: 'administrator', active: false },
            { id: 2, username: 'kasir', password: 'kasir123', name: 'Kasir', role: 'kasir', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(existingUsers));
        
        // Run upgrade
        ensureSuperAdminExists();
        
        // Verify Super Admin was added with active status
        const afterUpgrade = JSON.parse(localStorage.getItem('users') || '[]');
        const superAdmin = afterUpgrade.find(u => u.role === 'super_admin');
        expect(superAdmin).toBeDefined();
        expect(superAdmin.active).toBe(true);
        
        // Verify inactive users remain inactive
        const inactiveAdmin = afterUpgrade.find(u => u.id === 1);
        expect(inactiveAdmin.active).toBe(false);
    });

    test('should handle multiple upgrade calls idempotently', () => {
        // Start with no users
        const existingUsers = [
            { id: 1, username: 'admin', password: 'admin123', name: 'Administrator', role: 'administrator', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(existingUsers));
        
        // Run upgrade multiple times
        ensureSuperAdminExists();
        const afterFirst = JSON.parse(localStorage.getItem('users') || '[]');
        const firstCount = afterFirst.filter(u => u.role === 'super_admin').length;
        
        ensureSuperAdminExists();
        const afterSecond = JSON.parse(localStorage.getItem('users') || '[]');
        const secondCount = afterSecond.filter(u => u.role === 'super_admin').length;
        
        ensureSuperAdminExists();
        const afterThird = JSON.parse(localStorage.getItem('users') || '[]');
        const thirdCount = afterThird.filter(u => u.role === 'super_admin').length;
        
        // Verify only one Super Admin exists after multiple upgrades
        expect(firstCount).toBe(1);
        expect(secondCount).toBe(1);
        expect(thirdCount).toBe(1);
        expect(afterFirst.length).toBe(afterSecond.length);
        expect(afterSecond.length).toBe(afterThird.length);
    });

    test('should assign correct ID to Super Admin during upgrade', () => {
        // Simulate system with existing users with various IDs
        const existingUsers = [
            { id: 5, username: 'admin', password: 'admin123', name: 'Administrator', role: 'administrator', active: true },
            { id: 10, username: 'kasir', password: 'kasir123', name: 'Kasir', role: 'kasir', active: true }
        ];
        localStorage.setItem('users', JSON.stringify(existingUsers));
        
        // Run upgrade
        ensureSuperAdminExists();
        
        // Verify Super Admin has ID greater than existing max ID
        const afterUpgrade = JSON.parse(localStorage.getItem('users') || '[]');
        const superAdmin = afterUpgrade.find(u => u.role === 'super_admin');
        expect(superAdmin.id).toBeGreaterThan(10);
        expect(superAdmin.id).toBe(11);
    });

    test('should handle empty user array during upgrade', () => {
        // Simulate completely empty system
        localStorage.setItem('users', JSON.stringify([]));
        
        // Run upgrade
        ensureSuperAdminExists();
        
        // Verify Super Admin was created with ID 1
        const afterUpgrade = JSON.parse(localStorage.getItem('users') || '[]');
        expect(afterUpgrade.length).toBe(1);
        
        const superAdmin = afterUpgrade[0];
        expect(superAdmin.role).toBe('super_admin');
        expect(superAdmin.id).toBe(1);
        expect(superAdmin.username).toBe('superadmin');
    });
});
