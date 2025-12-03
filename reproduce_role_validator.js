
// Mock localStorage
const store = {};
global.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { for (const key in store) delete store[key]; }
};

global.window = global;

(async () => {
    try {
        // Import backup.js to get RoleValidator
        const backupModule = await import('./js/backup.js');

        // In the real app, backup.js might set globals or be loaded via script tag.
        // In Node environment (tests), we need to handle exports.

        // Check if RoleValidator is exported
        const RoleValidator = backupModule.default?.RoleValidator || backupModule.RoleValidator;

        if (!RoleValidator) {
            console.error('RoleValidator not found in backup.js exports');
            // Check if it's in global
            if (global.RoleValidator) {
                console.log('RoleValidator found in global scope');
            } else {
                console.error('RoleValidator not found in global scope either');
            }
        } else {
            console.log('RoleValidator imported successfully');
            global.RoleValidator = RoleValidator;
        }

        // Now import the module under test
        await import('./js/hapusTransaksiTutupKasir.js');

        // Test RoleValidator
        if (typeof RoleValidator === 'function') {
            const validator = new RoleValidator();
            const adminUser = { role: 'administrator' };
            const isSuper = validator.isSuperAdmin(adminUser);
            console.log(`isSuperAdmin({role: 'administrator'}) = ${isSuper}`);

            if (isSuper !== true) {
                console.error('FAIL: Administrator should be super admin');
            } else {
                console.log('PASS: Administrator is super admin');
            }
        } else {
            console.error('FAIL: RoleValidator is not a constructor');
        }

    } catch (error) {
        console.error('Error running test:', error);
    }
})();
