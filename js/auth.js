/**
 * Authentication Module
 * Handles user authentication, role-based access control, and session management
 * Last updated: 2024-12-15 - Removed Upload Master Barang Excel menu
 * @version 1.0.1
 */

// Global variables
// Note: currentUser is declared in js/app.js
let loginAttempts = new Map(); // Track login attempts for rate limiting

// Password security configuration - Enhanced for Task 2.1
const PASSWORD_CONFIG = {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    historyLimit: 5, // Remember last 5 passwords
    maxHistory: 5, // Alias for backward compatibility
    saltRounds: 12,
    
    // Enhanced security settings
    minScore: 70, // Minimum password strength score required
    lockoutAttempts: 5, // Max failed attempts before lockout
    lockoutDuration: 5 * 60 * 1000, // 5 minutes in milliseconds
    passwordExpiry: 90 * 24 * 60 * 60 * 1000, // 90 days in milliseconds
    
    // Common weak patterns to detect
    weakPatterns: [
        /(.)\1{2,}/g, // Repeated characters (aaa, 111)
        /123|abc|qwe|password|admin|user|login|guest/i, // Common sequences
        /^[a-z]+$/i, // Only letters
        /^\d+$/, // Only numbers
        /^[!@#$%^&*()_+-=\[\]{}|;:,.<>?]+$/ // Only special chars
    ],
    
    strengthLevels: {
        VERY_WEAK: 1,
        WEAK: 2,
        FAIR: 3,
        GOOD: 4,
        STRONG: 5,
        VERY_STRONG: 6
    },
    
    // Password strength scoring weights
    scoring: {
        length: 25,      // 25 points for meeting length requirement
        uppercase: 15,   // 15 points for uppercase letters
        lowercase: 15,   // 15 points for lowercase letters
        numbers: 15,     // 15 points for numbers
        special: 15,     // 15 points for special characters
        complexity: 15   // 15 points for additional complexity
    }
};

/**
 * Initialize authentication module
 */
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin();
        });
    }
    
    // Load current user from localStorage if exists
    loadCurrentUser();
});

/**
 * Load current user from localStorage
 */
function loadCurrentUser() {
    try {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            currentUser = JSON.parse(userData);
        }
    } catch (error) {
        console.error('Error loading current user:', error);
        localStorage.removeItem('currentUser');
    }
}

/**
 * Handle user login with enhanced security and validation
 */
function handleLogin() {
    try {
        // Get form elements
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        const errorDiv = document.getElementById('loginError');
        
        if (!usernameInput || !passwordInput || !errorDiv) {
            console.error('Required form elements not found');
            return;
        }
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        // Clear previous errors
        errorDiv.classList.add('d-none');
        
        // Input validation
        if (!username || !password) {
            showLoginError('Username dan password harus diisi!');
            return;
        }
        
        // Check rate limiting
        if (isRateLimited(username)) {
            showLoginError('Terlalu banyak percobaan login. Coba lagi dalam 5 menit.');
            return;
        }
        
        // Authenticate user
        const users = getUsersFromStorage();
        const user = users.find(u => {
            if (u.username !== username) return false;
            
            // Handle both old plain text passwords and new hashed passwords
            if (u.password.includes(':')) {
                // New hashed password format
                return verifyPassword(password, u.password);
            } else {
                // Legacy plain text password - migrate to hashed
                if (u.password === password) {
                    // Migrate to hashed password
                    const hashedPassword = hashPassword(password);
                    const userIndex = users.findIndex(user => user.id === u.id);
                    if (userIndex !== -1) {
                        users[userIndex].password = hashedPassword;
                        users[userIndex].passwordChangedAt = new Date().toISOString();
                        users[userIndex].passwordHistory = users[userIndex].passwordHistory || [];
                        localStorage.setItem('users', JSON.stringify(users));
                    }
                    return true;
                }
                return false;
            }
        });
        
        if (user) {
            // Check if user is active
            if (user.active === false) {
                showLoginError('Akun Anda telah dinonaktifkan. Hubungi administrator!');
                recordLoginAttempt(username, false);
                return;
            }
            
            // Successful login
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            clearLoginAttempts(username);
            
            // Update last login time
            updateLastLogin(user.id);
            
            // Show main app with error handling
            try {
                console.log('Login successful, attempting to show main app...');
                if (typeof showMainApp === 'function') {
                    console.log('showMainApp function found, calling it...');
                    showMainApp();
                    console.log('showMainApp called successfully');
                } else {
                    console.error('showMainApp function not found, trying alternative approach');
                    // Try alternative navigation without page reload
                    if (typeof navigateTo === 'function' && typeof renderMenu === 'function') {
                        console.log('Using alternative navigation approach...');
                        document.getElementById('loginPage').classList.add('d-none');
                        document.getElementById('mainApp').classList.remove('d-none');
                        
                        // Update user display
                        const currentUserEl = document.getElementById('currentUser');
                        const currentRoleEl = document.getElementById('currentRole');
                        if (currentUserEl) currentUserEl.textContent = currentUser.name;
                        if (currentRoleEl) currentRoleEl.textContent = getRoleName(currentUser.role);
                        
                        renderMenu();
                        navigateTo('dashboard');
                    } else {
                        console.error('Required functions not available, showing error');
                        showLoginError('Terjadi kesalahan sistem. Silakan refresh halaman.');
                    }
                }
            } catch (error) {
                console.error('Error showing main app:', error);
                // Try alternative navigation without page reload
                try {
                    if (typeof navigateTo === 'function' && typeof renderMenu === 'function') {
                        console.log('Trying fallback navigation to dashboard...');
                        document.getElementById('loginPage').classList.add('d-none');
                        document.getElementById('mainApp').classList.remove('d-none');
                        
                        // Update user display
                        const currentUserEl = document.getElementById('currentUser');
                        const currentRoleEl = document.getElementById('currentRole');
                        if (currentUserEl) currentUserEl.textContent = currentUser.name;
                        if (currentRoleEl) currentRoleEl.textContent = getRoleName(currentUser.role);
                        
                        renderMenu();
                        navigateTo('dashboard');
                    } else {
                        console.error('Fallback navigation also failed');
                        showLoginError('Terjadi kesalahan sistem. Silakan refresh halaman dan coba lagi.');
                    }
                } catch (fallbackError) {
                    console.error('Fallback navigation error:', fallbackError);
                    showLoginError('Terjadi kesalahan sistem. Silakan refresh halaman dan coba lagi.');
                }
            }
        } else {
            showLoginError('Username atau password salah!');
            recordLoginAttempt(username, false);
        }
    } catch (error) {
        console.error('Login error:', error);
        showLoginError('Terjadi kesalahan sistem. Silakan coba lagi.');
    }
}

/**
 * Display login error message
 * @param {string} message - Error message to display
 */
function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('d-none');
    }
}

/**
 * Get users from localStorage with error handling
 * @returns {Array} Array of users
 */
function getUsersFromStorage() {
    try {
        return JSON.parse(localStorage.getItem('users') || '[]');
    } catch (error) {
        console.error('Error parsing users from localStorage:', error);
        return [];
    }
}

/**
 * Check if user is rate limited
 * @param {string} username - Username to check
 * @returns {boolean} True if rate limited
 */
function isRateLimited(username) {
    const attempts = loginAttempts.get(username);
    if (!attempts) return false;
    
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    // Clean old attempts
    const recentAttempts = attempts.filter(time => now - time < fiveMinutes);
    loginAttempts.set(username, recentAttempts);
    
    return recentAttempts.length >= 5;
}

/**
 * Record login attempt
 * @param {string} username - Username
 * @param {boolean} success - Whether login was successful
 */
function recordLoginAttempt(username, success) {
    if (success) {
        loginAttempts.delete(username);
        return;
    }
    
    const attempts = loginAttempts.get(username) || [];
    attempts.push(Date.now());
    loginAttempts.set(username, attempts);
}

/**
 * Clear login attempts for user
 * @param {string} username - Username
 */
function clearLoginAttempts(username) {
    loginAttempts.delete(username);
}

/**
 * Update user's last login time
 * @param {number} userId - User ID
 */
function updateLastLogin(userId) {
    try {
        const users = getUsersFromStorage();
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex !== -1) {
            users[userIndex].lastLogin = new Date().toISOString();
            localStorage.setItem('users', JSON.stringify(users));
        }
    } catch (error) {
        console.error('Error updating last login:', error);
    }
}

/**
 * Generate a random salt for password hashing
 * @returns {string} Random salt
 */
function generateSalt() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let salt = '';
    for (let i = 0; i < 16; i++) {
        salt += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return salt;
}

/**
 * Simple hash function for password hashing
 * @param {string} text - Text to hash
 * @returns {string} Hashed text
 */
function simpleHash(text) {
    let hash = 0;
    if (text.length === 0) return hash.toString();
    
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
}

/**
 * Hash password with salt
 * @param {string} password - Plain text password
 * @returns {string} Hashed password with salt (format: salt:hash)
 */
function hashPassword(password) {
    const salt = generateSalt();
    const hash = simpleHash(salt + password + salt);
    return `${salt}:${hash}`;
}

/**
 * Verify password against hash
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password (format: salt:hash)
 * @returns {boolean} True if password matches
 */
function verifyPassword(password, hashedPassword) {
    try {
        const [salt, hash] = hashedPassword.split(':');
        if (!salt || !hash) return false;
        
        const computedHash = simpleHash(salt + password + salt);
        return computedHash === hash;
    } catch (error) {
        console.error('Error verifying password:', error);
        return false;
    }
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with strength and requirements
 */
function validatePasswordStrength(password) {
    const result = {
        isValid: false,
        strength: 'weak',
        strengthText: 'Lemah',
        score: 0,
        requirements: {
            minLength: password.length >= PASSWORD_CONFIG.minLength,
            hasUppercase: /[A-Z]/.test(password),
            hasLowercase: /[a-z]/.test(password),
            hasNumbers: /\d/.test(password),
            hasSpecialChars: new RegExp('[' + PASSWORD_CONFIG.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ']').test(password)
        },
        feedback: []
    };
    
    if (!password) {
        result.feedback.push('Password is required');
        return result;
    }
    
    // Length check
    if (password.length < PASSWORD_CONFIG.minLength) {
        result.feedback.push(`Password must be at least ${PASSWORD_CONFIG.minLength} characters long`);
    } else if (password.length >= PASSWORD_CONFIG.minLength) {
        result.score += 20;
    }
    
    if (PASSWORD_CONFIG.maxLength && password.length > PASSWORD_CONFIG.maxLength) {
        result.feedback.push(`Password must not exceed ${PASSWORD_CONFIG.maxLength} characters`);
        return result;
    }
    
    // Uppercase check
    if (PASSWORD_CONFIG.requireUppercase) {
        if (/[A-Z]/.test(password)) {
            result.score += 20;
        } else {
            result.feedback.push('Password must contain at least one uppercase letter');
        }
    }
    
    // Lowercase check
    if (PASSWORD_CONFIG.requireLowercase) {
        if (/[a-z]/.test(password)) {
            result.score += 20;
        } else {
            result.feedback.push('Password must contain at least one lowercase letter');
        }
    }
    
    // Numbers check
    if (PASSWORD_CONFIG.requireNumbers) {
        if (/\d/.test(password)) {
            result.score += 20;
        } else {
            result.feedback.push('Password must contain at least one number');
        }
    }
    
    // Special characters check
    if (PASSWORD_CONFIG.requireSpecialChars) {
        const specialCharsRegex = new RegExp('[' + PASSWORD_CONFIG.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ']');
        if (specialCharsRegex.test(password)) {
            result.score += 20;
        } else {
            result.feedback.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
        }
    }
    
    // Additional complexity bonuses
    if (password.length >= 12) {
        result.score += 5;
    }
    if (password.length >= 16) {
        result.score += 5;
    }
    
    // Check for common patterns (reduce score)
    if (/(.)\1{2,}/.test(password)) { // Repeated characters
        result.score -= 10;
        result.feedback.push('Avoid repeating characters');
    }
    
    if (/123|abc|qwe|password|admin/i.test(password)) { // Common patterns
        result.score -= 15;
        result.feedback.push('Avoid common patterns and dictionary words');
    }
    
    // Determine strength level
    if (result.score >= 90) {
        result.strength = 'very-strong';
        result.strengthText = 'Sangat Kuat';
    } else if (result.score >= 70) {
        result.strength = 'strong';
        result.strengthText = 'Kuat';
    } else if (result.score >= 50) {
        result.strength = 'medium';
        result.strengthText = 'Baik';
    } else if (result.score >= 30) {
        result.strength = 'weak';
        result.strengthText = 'Cukup';
    } else {
        result.strength = 'very-weak';
        result.strengthText = 'Lemah';
    }
    
    result.isValid = result.score >= 70 && result.feedback.length === 0;
    
    return result;
}

/**
 * Check if password was used recently
 * @param {string} password - New password
 * @param {Array} passwordHistory - Array of previous hashed passwords
 * @returns {boolean} True if password was used recently
 */
function isPasswordReused(password, passwordHistory = []) {
    if (!Array.isArray(passwordHistory)) return false;
    
    return passwordHistory.some(oldHash => {
        try {
            return verifyPassword(password, oldHash);
        } catch (error) {
            return false;
        }
    });
}

/**
 * Add password to history
 * @param {Array} passwordHistory - Current password history
 * @param {string} hashedPassword - New hashed password to add
 * @returns {Array} Updated password history
 */
function addToPasswordHistory(passwordHistory = [], hashedPassword) {
    const history = [...passwordHistory];
    history.unshift(hashedPassword);
    
    // Keep only the last N passwords
    return history.slice(0, PASSWORD_CONFIG.maxHistory);
}

// ============================================================================
// PASSWORD SECURITY IMPROVEMENTS (Task 2.1)
// ============================================================================



/**
 * Check if password was used recently (password history)
 * @param {number} userId - User ID
 * @param {string} newPassword - New password to check
 * @returns {boolean} True if password was used recently
 */
function isPasswordInHistory(userId, newPassword) {
    try {
        const users = getUsersFromStorage();
        const user = users.find(u => u.id === userId);
        
        if (!user || !user.passwordHistory) {
            return false;
        }
        
        return user.passwordHistory.some(oldHash => verifyPassword(newPassword, oldHash));
    } catch (error) {
        console.error('Error checking password history:', error);
        return false;
    }
}

/**
 * Add password to user's history
 * @param {number} userId - User ID
 * @param {string} hashedPassword - Hashed password to add to history
 */
function addPasswordToHistory(userId, hashedPassword) {
    try {
        const users = getUsersFromStorage();
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex !== -1) {
            if (!users[userIndex].passwordHistory) {
                users[userIndex].passwordHistory = [];
            }
            
            users[userIndex].passwordHistory.unshift(hashedPassword);
            
            // Keep only the last N passwords
            const historyLimit = PASSWORD_CONFIG.historyLimit || PASSWORD_CONFIG.maxHistory;
            if (users[userIndex].passwordHistory.length > historyLimit) {
                users[userIndex].passwordHistory = users[userIndex].passwordHistory.slice(0, historyLimit);
            }
            
            users[userIndex].passwordChangedAt = new Date().toISOString();
            localStorage.setItem('users', JSON.stringify(users));
        }
    } catch (error) {
        console.error('Error adding password to history:', error);
    }
}

/**
 * Change user password with security validation
 * @param {number} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Object} Result of password change operation
 */
function changePassword(userId, currentPassword, newPassword) {
    try {
        const users = getUsersFromStorage();
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            return { success: false, message: 'User not found' };
        }
        
        // Verify current password
        if (!verifyPassword(currentPassword, user.password)) {
            return { success: false, message: 'Current password is incorrect' };
        }
        
        // Validate new password strength
        const validation = validatePasswordStrength(newPassword);
        if (!validation.isValid) {
            return { 
                success: false, 
                message: 'Password does not meet security requirements',
                feedback: validation.feedback
            };
        }
        
        // Check password history
        if (isPasswordInHistory(userId, newPassword)) {
            const historyLimit = PASSWORD_CONFIG.historyLimit || PASSWORD_CONFIG.maxHistory;
            return { 
                success: false, 
                message: `Password was used recently. Please choose a different password. Last ${historyLimit} passwords cannot be reused.`
            };
        }
        
        // Hash new password
        const hashedPassword = hashPassword(newPassword);
        
        // Update user password
        const userIndex = users.findIndex(u => u.id === userId);
        users[userIndex].password = hashedPassword;
        
        // Add old password to history
        addPasswordToHistory(userId, user.password);
        
        localStorage.setItem('users', JSON.stringify(users));
        
        return { success: true, message: 'Password changed successfully' };
        
    } catch (error) {
        console.error('Error changing password:', error);
        return { success: false, message: 'An error occurred while changing password' };
    }
}

/**
 * Render navigation menu based on user role
 * @throws {Error} If currentUser is not set or menuList element not found
 */
function renderMenu() {
    if (!currentUser) {
        console.error('Cannot render menu: currentUser is not set');
        return;
    }
    
    const menuList = document.getElementById('menuList');
    if (!menuList) {
        console.error('Menu list element not found');
        return;
    }
    
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
            { icon: 'bi-arrow-left-right', text: 'Transformasi Barang', page: 'transformasi-barang' },
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
            { icon: 'bi-arrow-left-right', text: 'Transformasi Barang', page: 'transformasi-barang' },
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

/**
 * Render page content based on page identifier
 * @param {string} page - Page identifier
 */
function renderPage(page) {
    const content = document.getElementById('mainContent');
    
    if (!content) {
        console.error('Main content element not found');
        return;
    }
    
    if (!page) {
        console.error('Page parameter is required');
        content.innerHTML = '<div class="alert alert-danger">Error: Halaman tidak valid</div>';
        return;
    }
    
    try {
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

        case 'transformasi-barang':
            renderTransformasiBarang();
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
    } catch (error) {
        console.error('Error rendering page:', error);
        content.innerHTML = '<div class="alert alert-danger">Terjadi kesalahan saat memuat halaman. Silakan refresh browser.</div>';
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
                                        <button class="btn btn-sm btn-info" onclick="showChangePasswordModal(${u.id})" title="Change Password">
                                            <i class="bi bi-key"></i>
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
                                <div id="userPasswordStrength" class="mt-2"></div>
                                <small class="text-muted" id="passwordHint">Minimum 8 characters with complexity requirements</small>
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

/**
 * Check if current user is a Super Admin
 * @returns {boolean} True if current user is Super Admin
 */
function isSuperAdmin() {
    return currentUser && currentUser.role === 'super_admin';
}

/**
 * Check if current user can manage admin accounts
 * @returns {boolean} True if user can manage admins
 */
function canManageAdmins() {
    return isSuperAdmin();
}

/**
 * Filter users based on current user's permissions
 * @param {Array} users - Array of user objects
 * @returns {Array} Filtered array of users
 */
function filterUsersByPermission(users) {
    if (!Array.isArray(users)) {
        console.error('filterUsersByPermission: users parameter must be an array');
        return [];
    }
    
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
    document.getElementById('passwordHint').textContent = 'Minimum 8 characters with complexity requirements';
    
    // Populate role dropdown based on user permissions
    const roleSelect = document.getElementById('userRole');
    const availableRoles = getAvailableRoles();
    
    roleSelect.innerHTML = '<option value="">Pilih Role</option>' + 
        availableRoles.map(role => `<option value="${role.value}">${role.label}</option>`).join('');
    
    const modal = new bootstrap.Modal(document.getElementById('userModal'));
    modal.show();
    
    // Initialize password strength indicator after modal is shown
    setTimeout(() => {
        initializePasswordStrengthIndicator('userPassword', 'userPasswordStrength');
    }, 100);
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
        document.getElementById('passwordHint').textContent = 'Leave blank to keep current password. New passwords must meet security requirements.';
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

/**
 * Get user form data with validation
 * @returns {Object|null} Form data object or null if validation fails
 */
function getUserFormData() {
    const elements = {
        id: document.getElementById('userId'),
        username: document.getElementById('userUsername'),
        password: document.getElementById('userPassword'),
        name: document.getElementById('userName'),
        role: document.getElementById('userRole'),
        active: document.getElementById('userActive')
    };
    
    // Check if all elements exist
    for (const [key, element] of Object.entries(elements)) {
        if (!element) {
            console.error(`Form element ${key} not found`);
            showAlert('Error: Form tidak lengkap', 'danger');
            return null;
        }
    }
    
    return {
        id: elements.id.value,
        username: elements.username.value.trim(),
        password: elements.password.value,
        name: elements.name.value.trim(),
        role: elements.role.value,
        active: elements.active.value === 'true'
    };
}

/**
 * Show password strength indicator
 * @param {string} password - Password to analyze
 * @param {string} containerId - ID of container element
 */
function showPasswordStrength(password, containerId = 'passwordStrength') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    if (!password) {
        container.innerHTML = '';
        return;
    }
    
    const validation = validatePasswordStrength(password);
    
    // Create strength bar
    const strengthColors = {
        1: '#dc3545', // Red - Weak
        2: '#fd7e14', // Orange - Fair  
        3: '#ffc107', // Yellow - Good
        4: '#28a745', // Green - Strong
        5: '#20c997'  // Teal - Very Strong
    };
    
    const strengthWidth = (validation.strength / 5) * 100;
    const strengthColor = strengthColors[validation.strength];
    
    let html = `
        <div class="password-strength-container mt-2">
            <div class="d-flex justify-content-between align-items-center mb-1">
                <small class="text-muted">Kekuatan Password:</small>
                <small class="fw-bold" style="color: ${strengthColor}">${validation.strengthText}</small>
            </div>
            <div class="progress" style="height: 6px;">
                <div class="progress-bar" 
                     style="width: ${strengthWidth}%; background-color: ${strengthColor};"
                     role="progressbar"></div>
            </div>
    `;
    
    // Show requirements
    if (validation.feedback.length > 0) {
        html += `
            <div class="password-requirements mt-2">
                <small class="text-muted d-block mb-1">Persyaratan:</small>
                <ul class="list-unstyled mb-0" style="font-size: 0.75rem;">
        `;
        
        validation.feedback.forEach(feedback => {
            html += `<li class="text-danger"><i class="bi bi-x-circle me-1"></i>${feedback}</li>`;
        });
        
        html += `</ul></div>`;
    } else {
        html += `<small class="text-success mt-1 d-block"><i class="bi bi-check-circle me-1"></i>Semua persyaratan terpenuhi</small>`;
    }
    
    html += `</div>`;
    
    container.innerHTML = html;
}

/**
 * Setup password strength indicator for input field
 * @param {string} inputId - ID of password input field
 * @param {string} containerId - ID of container for strength indicator
 */
function setupPasswordStrengthIndicator(inputId, containerId) {
    const passwordInput = document.getElementById(inputId);
    if (!passwordInput) return;
    
    // Create container if it doesn't exist
    let container = document.getElementById(containerId);
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        passwordInput.parentNode.insertBefore(container, passwordInput.nextSibling);
    }
    
    // Add event listener
    passwordInput.addEventListener('input', function() {
        showPasswordStrength(this.value, containerId);
    });
    
    // Show initial state
    showPasswordStrength(passwordInput.value, containerId);
}

/**
 * Initialize password strength indicator (alias for setupPasswordStrengthIndicator)
 * @param {string} inputId - ID of password input field
 * @param {string} containerId - ID of container for strength indicator
 */
function initializePasswordStrengthIndicator(inputId, containerId) {
    setupPasswordStrengthIndicator(inputId, containerId);
}

/**
 * Save user data (create or update)
 * @returns {void}
 */
function saveUser() {
    try {
        const users = getUsersFromStorage();
        
        // Get form values with validation
        const formData = getUserFormData();
        if (!formData) {
            return; // Error already shown in getUserFormData
        }
        
        const { id, username, password, name, role, active } = formData;
        
        // Basic validation
        if (!username.trim() || !name.trim() || !role) {
            showAlert('Semua field wajib harus diisi!', 'warning');
            return;
        }
        
        // Username validation
        if (username.length < 3) {
            showAlert('Username minimal 3 karakter!', 'warning');
            return;
        }
        
        // Password validation for new users or password changes
        if (password && password.trim()) {
            const passwordValidation = validatePasswordStrength(password);
            
            if (!passwordValidation.isValid) {
                const feedbackText = passwordValidation.feedback.join(', ');
                showAlert(`Password tidak memenuhi persyaratan: ${feedbackText}`, 'warning');
                return;
            }
            
            // Check password reuse for existing users
            if (id) {
                const existingUser = users.find(u => u.id == id);
                if (existingUser && existingUser.passwordHistory) {
                    if (isPasswordReused(password, existingUser.passwordHistory)) {
                        showAlert('Password ini sudah pernah digunakan sebelumnya. Silakan gunakan password yang berbeda.', 'warning');
                        return;
                    }
                }
            }
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
            if (password && password.trim()) {
                // Add old password to history before updating
                if (users[index].password) {
                    addPasswordToHistory(users[index].id, users[index].password);
                }
                
                users[index].password = hashPassword(password);
                users[index].passwordChangedAt = new Date().toISOString();
            }
        } else {
            // Add new user
            if (!password) {
                showAlert('Password is required for new users!', 'warning');
                return;
            }
            
            // Validate password strength for new users
            const passwordValidation = validatePasswordStrength(password);
            if (!passwordValidation.isValid) {
                showAlert('Password does not meet security requirements: ' + passwordValidation.feedback.join(', '), 'warning');
                return;
            }
            
            const hashedPassword = hashPassword(password);
            const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
            
            users.push({
                id: newId,
                username: username,
                password: hashedPassword,
                name: name,
                role: role,
                active: active,
                createdAt: new Date().toISOString(),
                passwordChangedAt: new Date().toISOString(),
                passwordHistory: []
            });
        }
        
        localStorage.setItem('users', JSON.stringify(users));
        bootstrap.Modal.getInstance(document.getElementById('userModal')).hide();
        showAlert('User berhasil disimpan', 'success');
        renderManajemenUser();
    } catch (error) {
        console.error('Error saving user:', error);
        showAlert('Gagal menyimpan user. Silakan coba lagi.', 'danger');
    }
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



// ============================================================================
// PASSWORD UI ENHANCEMENTS (Task 2.1)
// ============================================================================



/**
 * Update password strength UI indicator
 * @param {HTMLElement} indicatorElement - Strength indicator element
 * @param {Object} validation - Password validation result
 */
function updatePasswordStrengthUI(indicatorElement, validation) {
    if (!indicatorElement) return;
    
    const strengthColors = {
        'very-weak': '#dc3545',
        'weak': '#fd7e14',
        'medium': '#ffc107',
        'strong': '#20c997',
        'very-strong': '#198754'
    };
    
    const strengthLabels = {
        'very-weak': 'Very Weak',
        'weak': 'Weak',
        'medium': 'Medium',
        'strong': 'Strong',
        'very-strong': 'Very Strong'
    };
    
    const color = strengthColors[validation.strength] || '#6c757d';
    const label = strengthLabels[validation.strength] || 'Unknown';
    
    indicatorElement.innerHTML = `
        <div class="password-strength-bar mb-2">
            <div class="progress" style="height: 8px;">
                <div class="progress-bar" 
                     style="width: ${validation.score}%; background-color: ${color};"
                     role="progressbar" 
                     aria-valuenow="${validation.score}" 
                     aria-valuemin="0" 
                     aria-valuemax="100">
                </div>
            </div>
            <small class="text-muted">
                Strength: <span style="color: ${color}; font-weight: bold;">${label}</span> 
                (${validation.score}/100)
            </small>
        </div>
        ${validation.feedback.length > 0 ? `
            <div class="password-feedback">
                <small class="text-danger">
                    <ul class="mb-0 ps-3">
                        ${validation.feedback.map(msg => `<li>${msg}</li>`).join('')}
                    </ul>
                </small>
            </div>
        ` : ''}
    `;
}

/**
 * Show change password modal
 * @param {number} userId - User ID (optional, defaults to current user)
 */
function showChangePasswordModal(userId = null) {
    const targetUserId = userId || (currentUser ? currentUser.id : null);
    
    if (!targetUserId) {
        showAlert('User not found', 'danger');
        return;
    }
    
    const modalHTML = `
        <div class="modal fade" id="changePasswordModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-key me-2"></i>Change Password
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="changePasswordForm">
                            <input type="hidden" id="changePasswordUserId" value="${targetUserId}">
                            
                            <div class="mb-3">
                                <label class="form-label">
                                    <i class="bi bi-lock me-1"></i>Current Password
                                </label>
                                <input type="password" class="form-control" id="currentPassword" required>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">
                                    <i class="bi bi-shield-lock me-1"></i>New Password
                                </label>
                                <input type="password" class="form-control" id="newPassword" required>
                                <div id="newPasswordStrength" class="mt-2"></div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">
                                    <i class="bi bi-shield-check me-1"></i>Confirm New Password
                                </label>
                                <input type="password" class="form-control" id="confirmPassword" required>
                                <div class="invalid-feedback" id="confirmPasswordFeedback"></div>
                            </div>
                            
                            <div class="alert alert-info">
                                <h6><i class="bi bi-info-circle me-2"></i>Password Requirements:</h6>
                                <ul class="mb-0">
                                    <li>At least 8 characters long</li>
                                    <li>Contains uppercase and lowercase letters</li>
                                    <li>Contains at least one number</li>
                                    <li>Contains at least one special character</li>
                                    <li>Cannot be one of your last ${PASSWORD_CONFIG.historyLimit || PASSWORD_CONFIG.maxHistory} passwords</li>
                                </ul>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            <i class="bi bi-x-circle me-1"></i>Cancel
                        </button>
                        <button type="button" class="btn btn-primary" onclick="processPasswordChange()">
                            <i class="bi bi-check-circle me-1"></i>Change Password
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('changePasswordModal');
    if (existingModal) existingModal.remove();
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Initialize password strength indicator
    setTimeout(() => {
        initializePasswordStrengthIndicator('newPassword', 'newPasswordStrength');
        
        // Add confirm password validation
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const newPasswordInput = document.getElementById('newPassword');
        
        if (confirmPasswordInput && newPasswordInput) {
            confirmPasswordInput.addEventListener('input', function() {
                const feedback = document.getElementById('confirmPasswordFeedback');
                if (this.value && this.value !== newPasswordInput.value) {
                    this.classList.add('is-invalid');
                    feedback.textContent = 'Passwords do not match';
                } else {
                    this.classList.remove('is-invalid');
                    feedback.textContent = '';
                }
            });
        }
    }, 100);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
    modal.show();
}

/**
 * Process password change from modal
 */
function processPasswordChange() {
    try {
        const userId = parseInt(document.getElementById('changePasswordUserId').value);
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validate inputs
        if (!currentPassword || !newPassword || !confirmPassword) {
            showAlert('All fields are required', 'warning');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showAlert('New passwords do not match', 'warning');
            return;
        }
        
        // Change password
        const result = changePassword(userId, currentPassword, newPassword);
        
        if (result.success) {
            bootstrap.Modal.getInstance(document.getElementById('changePasswordModal')).hide();
            showAlert(result.message, 'success');
        } else {
            showAlert(result.message, 'danger');
            if (result.feedback) {
                console.log('Password feedback:', result.feedback);
            }
        }
        
    } catch (error) {
        console.error('Error processing password change:', error);
        showAlert('An error occurred while changing password', 'danger');
    }
}

/**
 * Render Transformasi Barang page
 */
function renderTransformasiBarang() {
    const content = document.getElementById('mainContent');
    
    if (!content) {
        console.error('Main content element not found');
        return;
    }
    
    // Check if transformasi barang functions are available
    if (typeof window.TransformationManager === 'undefined') {
        content.innerHTML = `
            <div class="alert alert-warning">
                <h4><i class="bi bi-exclamation-triangle me-2"></i>Fitur Transformasi Barang</h4>
                <p>Sistem transformasi barang sedang dimuat. Pastikan semua file JavaScript transformasi barang sudah dimuat dengan benar.</p>
                <p>File yang diperlukan:</p>
                <ul>
                    <li>js/transformasi-barang/TransformationManager.js</li>
                    <li>js/transformasi-barang/UIController.js</li>
                    <li>js/transformasi-barang/ValidationEngine.js</li>
                    <li>js/transformasi-barang/StockManager.js</li>
                </ul>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="bi bi-arrow-clockwise me-1"></i>Refresh Halaman
                </button>
            </div>
        `;
        return;
    }
    
    content.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 style="color: #2d6a4f; font-weight: 700;">
                <i class="bi bi-arrow-left-right me-2"></i>Transformasi Barang
            </h2>
            <div class="d-flex gap-2">
                <button class="btn btn-info btn-sm" onclick="showTransformationHistory()">
                    <i class="bi bi-clock-history me-1"></i>Riwayat
                </button>
                <button class="btn btn-secondary btn-sm" onclick="showTransformationHelp()">
                    <i class="bi bi-question-circle me-1"></i>Bantuan
                </button>
            </div>
        </div>
        
        <div class="row">
            <div class="col-md-8">
                <div class="card transformation-card">
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="bi bi-gear me-2"></i>Form Transformasi Barang
                        </h5>
                    </div>
                    <div class="card-body">
                        <form id="transformationForm">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">
                                            <i class="bi bi-box me-1"></i>Barang Asal
                                        </label>
                                        <select class="form-select" id="sourceProduct" required>
                                            <option value="">Pilih barang asal...</option>
                                        </select>
                                        <div class="stock-info mt-2" id="sourceStockInfo" style="display: none;">
                                            <small class="text-muted">
                                                <i class="bi bi-info-circle me-1"></i>
                                                Stok tersedia: <span id="sourceStock">0</span> <span id="sourceUnit"></span>
                                            </small>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">
                                            <i class="bi bi-box-seam me-1"></i>Barang Tujuan
                                        </label>
                                        <select class="form-select" id="targetProduct" required>
                                            <option value="">Pilih barang tujuan...</option>
                                        </select>
                                        <div class="stock-info mt-2" id="targetStockInfo" style="display: none;">
                                            <small class="text-muted">
                                                <i class="bi bi-info-circle me-1"></i>
                                                Stok saat ini: <span id="targetStock">0</span> <span id="targetUnit"></span>
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">
                                            <i class="bi bi-123 me-1"></i>Jumlah Transformasi
                                        </label>
                                        <input type="number" class="form-control" id="transformationQuantity" 
                                               min="1" step="1" required placeholder="Masukkan jumlah...">
                                        <small class="text-muted">Jumlah barang asal yang akan ditransformasi</small>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label class="form-label">
                                            <i class="bi bi-percent me-1"></i>Rasio Konversi
                                        </label>
                                        <input type="number" class="form-control" id="conversionRatio" 
                                               min="0.01" step="0.01" required placeholder="Contoh: 1.5">
                                        <small class="text-muted">Rasio konversi (1 unit asal = X unit tujuan)</small>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">
                                    <i class="bi bi-chat-text me-1"></i>Keterangan
                                </label>
                                <textarea class="form-control" id="transformationNotes" rows="3" 
                                          placeholder="Keterangan transformasi (opsional)..."></textarea>
                            </div>
                            
                            <div class="preview-section" id="transformationPreview" style="display: none;">
                                <h6><i class="bi bi-eye me-2"></i>Preview Transformasi</h6>
                                <div class="row">
                                    <div class="col-md-5">
                                        <div class="text-center">
                                            <h6 class="text-danger">Barang Asal</h6>
                                            <div id="previewSource"></div>
                                        </div>
                                    </div>
                                    <div class="col-md-2">
                                        <div class="conversion-arrow">
                                            <i class="bi bi-arrow-right"></i>
                                        </div>
                                    </div>
                                    <div class="col-md-5">
                                        <div class="text-center">
                                            <h6 class="text-success">Barang Tujuan</h6>
                                            <div id="previewTarget"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="d-flex gap-2 mt-4">
                                <button type="button" class="btn btn-transform" onclick="processTransformation()">
                                    <i class="bi bi-gear me-1"></i>Proses Transformasi
                                </button>
                                <button type="reset" class="btn btn-outline-secondary">
                                    <i class="bi bi-arrow-clockwise me-1"></i>Reset Form
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="bi bi-info-circle me-2"></i>Informasi Transformasi
                        </h6>
                    </div>
                    <div class="card-body">
                        <div class="alert alert-info">
                            <h6><i class="bi bi-lightbulb me-1"></i>Cara Kerja:</h6>
                            <ol class="mb-0" style="font-size: 0.9rem;">
                                <li>Pilih barang asal dan tujuan</li>
                                <li>Masukkan jumlah dan rasio konversi</li>
                                <li>Review preview transformasi</li>
                                <li>Klik "Proses Transformasi"</li>
                            </ol>
                        </div>
                        
                        <div class="alert alert-warning">
                            <h6><i class="bi bi-exclamation-triangle me-1"></i>Perhatian:</h6>
                            <ul class="mb-0" style="font-size: 0.9rem;">
                                <li>Pastikan stok barang asal mencukupi</li>
                                <li>Transformasi tidak dapat dibatalkan</li>
                                <li>Semua transaksi akan tercatat dalam audit log</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div class="card mt-3">
                    <div class="card-header">
                        <h6 class="mb-0">
                            <i class="bi bi-clock me-2"></i>Transformasi Terbaru
                        </h6>
                    </div>
                    <div class="card-body">
                        <div id="recentTransformations">
                            <div class="text-center text-muted">
                                <i class="bi bi-inbox"></i>
                                <p class="mb-0">Belum ada transformasi</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Modal Riwayat Transformasi -->
        <div class="modal fade" id="historyModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-clock-history me-2"></i>Riwayat Transformasi Barang
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="table-responsive">
                            <table class="table table-hover history-table">
                                <thead>
                                    <tr>
                                        <th>Tanggal</th>
                                        <th>Barang Asal</th>
                                        <th>Barang Tujuan</th>
                                        <th>Jumlah</th>
                                        <th>Rasio</th>
                                        <th>User</th>
                                    </tr>
                                </thead>
                                <tbody id="historyTableBody">
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Initialize transformasi barang functionality
    try {
        if (typeof initializeTransformasiBarang === 'function') {
            initializeTransformasiBarang();
        } else {
            console.warn('initializeTransformasiBarang function not found');
        }
    } catch (error) {
        console.error('Error initializing transformasi barang:', error);
    }
}

/**
 * Show transformation history modal
 */
function showTransformationHistory() {
    const modal = new bootstrap.Modal(document.getElementById('historyModal'));
    modal.show();
    
    // Load history data
    if (typeof loadTransformationHistory === 'function') {
        loadTransformationHistory();
    }
}

/**
 * Show transformation help
 */
function showTransformationHelp() {
    showAlert(`
        <h6>Panduan Transformasi Barang:</h6>
        <ul>
            <li><strong>Barang Asal:</strong> Barang yang akan diubah/dikurangi stoknya</li>
            <li><strong>Barang Tujuan:</strong> Barang yang akan bertambah stoknya</li>
            <li><strong>Rasio Konversi:</strong> Perbandingan konversi (misal: 1 kg = 10 ons, maka rasio = 10)</li>
            <li><strong>Audit Trail:</strong> Semua transformasi tercatat dalam sistem audit</li>
        </ul>
    `, 'info', 10000);
}

// ============================================================================
// ENHANCED PASSWORD SECURITY IMPROVEMENTS - TASK 2.1
// ============================================================================

/**
 * Enhanced password strength validation - Task 2.1 Implementation
 * @param {string} password - Password to validate
 * @returns {Object} Enhanced validation result with detailed scoring
 */
function validatePasswordStrengthEnhanced(password) {
    const result = {
        isValid: false,
        strength: 'very-weak',
        strengthText: 'Sangat Lemah',
        score: 0,
        requirements: {
            minLength: false,
            hasUppercase: false,
            hasLowercase: false,
            hasNumbers: false,
            hasSpecialChars: false,
            noWeakPatterns: true,
            noCommonWords: true
        },
        feedback: [],
        details: {
            lengthScore: 0,
            complexityScore: 0,
            patternPenalty: 0,
            bonusScore: 0
        }
    };
    
    if (!password) {
        result.feedback.push('Password is required');
        return result;
    }
    
    // Length validation and scoring
    if (password.length < PASSWORD_CONFIG.minLength) {
        result.feedback.push(`Password must be at least ${PASSWORD_CONFIG.minLength} characters long`);
    } else {
        result.requirements.minLength = true;
        result.details.lengthScore = PASSWORD_CONFIG.scoring.length;
        result.score += PASSWORD_CONFIG.scoring.length;
        
        // Bonus for longer passwords
        if (password.length >= 12) {
            result.details.bonusScore += 5;
            result.score += 5;
        }
        if (password.length >= 16) {
            result.details.bonusScore += 5;
            result.score += 5;
        }
        if (password.length >= 20) {
            result.details.bonusScore += 5;
            result.score += 5;
        }
    }
    
    // Maximum length check
    if (PASSWORD_CONFIG.maxLength && password.length > PASSWORD_CONFIG.maxLength) {
        result.feedback.push(`Password must not exceed ${PASSWORD_CONFIG.maxLength} characters`);
        return result;
    }
    
    // Character type requirements
    if (PASSWORD_CONFIG.requireUppercase) {
        if (/[A-Z]/.test(password)) {
            result.requirements.hasUppercase = true;
            result.details.complexityScore += PASSWORD_CONFIG.scoring.uppercase;
            result.score += PASSWORD_CONFIG.scoring.uppercase;
        } else {
            result.feedback.push('Password must contain at least one uppercase letter (A-Z)');
        }
    }
    
    if (PASSWORD_CONFIG.requireLowercase) {
        if (/[a-z]/.test(password)) {
            result.requirements.hasLowercase = true;
            result.details.complexityScore += PASSWORD_CONFIG.scoring.lowercase;
            result.score += PASSWORD_CONFIG.scoring.lowercase;
        } else {
            result.feedback.push('Password must contain at least one lowercase letter (a-z)');
        }
    }
    
    if (PASSWORD_CONFIG.requireNumbers) {
        if (/\d/.test(password)) {
            result.requirements.hasNumbers = true;
            result.details.complexityScore += PASSWORD_CONFIG.scoring.numbers;
            result.score += PASSWORD_CONFIG.scoring.numbers;
        } else {
            result.feedback.push('Password must contain at least one number (0-9)');
        }
    }
    
    if (PASSWORD_CONFIG.requireSpecialChars) {
        const specialCharsRegex = new RegExp('[' + PASSWORD_CONFIG.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ']');
        if (specialCharsRegex.test(password)) {
            result.requirements.hasSpecialChars = true;
            result.details.complexityScore += PASSWORD_CONFIG.scoring.special;
            result.score += PASSWORD_CONFIG.scoring.special;
        } else {
            result.feedback.push(`Password must contain at least one special character (${PASSWORD_CONFIG.specialChars})`);
        }
    }
    
    // Advanced pattern detection
    let patternPenalty = 0;
    
    // Check for repeated characters (aaa, 111, etc.)
    if (/(.)\1{2,}/.test(password)) {
        result.requirements.noWeakPatterns = false;
        result.feedback.push('Avoid repeating the same character 3 or more times');
        patternPenalty += 15;
    }
    
    // Check for sequential patterns (123, abc, qwe)
    if (/123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|qwe|wer|ert|rty|tyu|yui|uio|iop|asd|sdf|dfg|fgh|ghj|hjk|jkl|zxc|xcv|cvb|vbn|bnm/i.test(password)) {
        result.requirements.noWeakPatterns = false;
        result.feedback.push('Avoid sequential characters (123, abc, qwe, etc.)');
        patternPenalty += 10;
    }
    
    // Check for common weak passwords and patterns
    const commonWords = ['password', 'admin', 'user', 'login', 'guest', 'root', 'test', 'demo', 'welcome', 'master', 'super'];
    const lowerPassword = password.toLowerCase();
    
    for (const word of commonWords) {
        if (lowerPassword.includes(word)) {
            result.requirements.noCommonWords = false;
            result.feedback.push(`Avoid using common words like "${word}"`);
            patternPenalty += 20;
            break;
        }
    }
    
    // Check for keyboard patterns
    const keyboardPatterns = ['qwerty', 'asdfgh', 'zxcvbn', '1qaz2wsx', 'qazwsx'];
    for (const pattern of keyboardPatterns) {
        if (lowerPassword.includes(pattern)) {
            result.requirements.noWeakPatterns = false;
            result.feedback.push('Avoid keyboard patterns');
            patternPenalty += 15;
            break;
        }
    }
    
    // Apply pattern penalties
    result.details.patternPenalty = patternPenalty;
    result.score = Math.max(0, result.score - patternPenalty);
    
    // Complexity bonus for character diversity
    const charTypes = [
        /[a-z]/.test(password), // lowercase
        /[A-Z]/.test(password), // uppercase  
        /\d/.test(password),    // numbers
        /[^a-zA-Z\d]/.test(password) // special chars
    ].filter(Boolean).length;
    
    if (charTypes >= 4) {
        result.details.complexityScore += PASSWORD_CONFIG.scoring.complexity;
        result.score += PASSWORD_CONFIG.scoring.complexity;
    }
    
    // Determine strength level based on enhanced scoring
    if (result.score >= 95) {
        result.strength = 'very-strong';
        result.strengthText = 'Sangat Kuat';
    } else if (result.score >= 80) {
        result.strength = 'strong';
        result.strengthText = 'Kuat';
    } else if (result.score >= 65) {
        result.strength = 'good';
        result.strengthText = 'Baik';
    } else if (result.score >= 45) {
        result.strength = 'fair';
        result.strengthText = 'Cukup';
    } else if (result.score >= 25) {
        result.strength = 'weak';
        result.strengthText = 'Lemah';
    } else {
        result.strength = 'very-weak';
        result.strengthText = 'Sangat Lemah';
    }
    
    // Password is valid if it meets minimum score and has no critical issues
    result.isValid = result.score >= PASSWORD_CONFIG.minScore && 
                     result.requirements.minLength && 
                     result.requirements.hasUppercase && 
                     result.requirements.hasLowercase && 
                     result.requirements.hasNumbers && 
                     result.requirements.hasSpecialChars;
    
    return result;
}

/**
 * Enhanced account lockout mechanism - Task 2.1
 * @param {string} username - Username to check
 * @returns {Object} Lockout status with details
 */
function getAccountLockoutStatus(username) {
    const attempts = loginAttempts.get(username);
    if (!attempts || attempts.length === 0) {
        return {
            isLocked: false,
            attemptsRemaining: PASSWORD_CONFIG.lockoutAttempts,
            lockoutTimeRemaining: 0,
            nextAttemptAllowed: null
        };
    }
    
    const now = Date.now();
    const lockoutDuration = PASSWORD_CONFIG.lockoutDuration;
    
    // Clean old attempts outside lockout window
    const recentAttempts = attempts.filter(time => now - time < lockoutDuration);
    loginAttempts.set(username, recentAttempts);
    
    const isLocked = recentAttempts.length >= PASSWORD_CONFIG.lockoutAttempts;
    const attemptsRemaining = Math.max(0, PASSWORD_CONFIG.lockoutAttempts - recentAttempts.length);
    
    let lockoutTimeRemaining = 0;
    let nextAttemptAllowed = null;
    
    if (isLocked && recentAttempts.length > 0) {
        const oldestAttempt = Math.min(...recentAttempts);
        const unlockTime = oldestAttempt + lockoutDuration;
        lockoutTimeRemaining = Math.max(0, unlockTime - now);
        nextAttemptAllowed = new Date(unlockTime);
    }
    
    return {
        isLocked,
        attemptsRemaining,
        lockoutTimeRemaining,
        nextAttemptAllowed,
        totalAttempts: recentAttempts.length
    };
}

/**
 * Enhanced password expiry check - Task 2.1
 * @param {Object} user - User object
 * @returns {Object} Password expiry status
 */
function checkPasswordExpiry(user) {
    if (!user || !user.passwordChangedAt) {
        return {
            isExpired: false,
            daysUntilExpiry: null,
            shouldWarn: false,
            message: null
        };
    }
    
    const passwordChangedDate = new Date(user.passwordChangedAt);
    const now = new Date();
    const daysSinceChange = Math.floor((now - passwordChangedDate) / (24 * 60 * 60 * 1000));
    const maxDays = Math.floor(PASSWORD_CONFIG.passwordExpiry / (24 * 60 * 60 * 1000));
    const daysUntilExpiry = maxDays - daysSinceChange;
    
    const isExpired = daysUntilExpiry <= 0;
    const shouldWarn = daysUntilExpiry <= 7 && daysUntilExpiry > 0; // Warn 7 days before expiry
    
    let message = null;
    if (isExpired) {
        message = `Your password expired ${Math.abs(daysUntilExpiry)} days ago. Please change it immediately.`;
    } else if (shouldWarn) {
        message = `Your password will expire in ${daysUntilExpiry} days. Please consider changing it soon.`;
    }
    
    return {
        isExpired,
        daysUntilExpiry,
        shouldWarn,
        message,
        daysSinceChange,
        maxDays
    };
}

/**
 * Enhanced password change with comprehensive validation - Task 2.1
 * @param {number} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Object} Enhanced result with detailed feedback
 */
function changePasswordEnhanced(userId, currentPassword, newPassword) {
    try {
        const users = getUsersFromStorage();
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            return { 
                success: false, 
                message: 'User not found',
                code: 'USER_NOT_FOUND'
            };
        }
        
        // Verify current password
        if (!verifyPassword(currentPassword, user.password)) {
            // Record failed attempt for audit
            recordLoginAttempt(user.username, false);
            return { 
                success: false, 
                message: 'Current password is incorrect',
                code: 'INVALID_CURRENT_PASSWORD'
            };
        }
        
        // Enhanced password validation
        const validation = validatePasswordStrengthEnhanced(newPassword);
        if (!validation.isValid) {
            return { 
                success: false, 
                message: 'New password does not meet security requirements',
                feedback: validation.feedback,
                details: validation.details,
                code: 'WEAK_PASSWORD'
            };
        }
        
        // Check password history
        if (isPasswordInHistory(userId, newPassword)) {
            const historyLimit = PASSWORD_CONFIG.historyLimit || PASSWORD_CONFIG.maxHistory;
            return { 
                success: false, 
                message: `Password was used recently. Please choose a different password. Last ${historyLimit} passwords cannot be reused.`,
                code: 'PASSWORD_REUSED'
            };
        }
        
        // Check if new password is same as current
        if (verifyPassword(newPassword, user.password)) {
            return {
                success: false,
                message: 'New password must be different from current password',
                code: 'SAME_PASSWORD'
            };
        }
        
        // Hash new password
        const hashedPassword = hashPassword(newPassword);
        
        // Update user password
        const userIndex = users.findIndex(u => u.id === userId);
        
        // Add old password to history before updating
        if (user.password) {
            addPasswordToHistory(userId, user.password);
        }
        
        users[userIndex].password = hashedPassword;
        users[userIndex].passwordChangedAt = new Date().toISOString();
        users[userIndex].lastPasswordChange = new Date().toISOString(); // For compatibility
        
        localStorage.setItem('users', JSON.stringify(users));
        
        // Clear any login attempts for this user
        clearLoginAttempts(user.username);
        
        return { 
            success: true, 
            message: 'Password changed successfully',
            code: 'SUCCESS',
            passwordStrength: validation.strengthText,
            score: validation.score
        };
        
    } catch (error) {
        console.error('Error changing password:', error);
        return { 
            success: false, 
            message: 'An error occurred while changing password',
            code: 'SYSTEM_ERROR',
            error: error.message
        };
    }
}

/**
 * Enhanced login with improved security checks - Task 2.1
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Object} Enhanced login result
 */
function authenticateUserEnhanced(username, password) {
    try {
        // Input validation
        if (!username || !password) {
            return {
                success: false,
                message: 'Username and password are required',
                code: 'MISSING_CREDENTIALS'
            };
        }
        
        // Check account lockout
        const lockoutStatus = getAccountLockoutStatus(username);
        if (lockoutStatus.isLocked) {
            const minutes = Math.ceil(lockoutStatus.lockoutTimeRemaining / (60 * 1000));
            return {
                success: false,
                message: `Account is locked. Try again in ${minutes} minutes.`,
                code: 'ACCOUNT_LOCKED',
                lockoutStatus
            };
        }
        
        // Find user
        const users = getUsersFromStorage();
        const user = users.find(u => u.username === username);
        
        if (!user) {
            recordLoginAttempt(username, false);
            return {
                success: false,
                message: 'Invalid username or password',
                code: 'INVALID_CREDENTIALS'
            };
        }
        
        // Check if user is active
        if (user.active === false) {
            recordLoginAttempt(username, false);
            return {
                success: false,
                message: 'Account is disabled. Contact administrator.',
                code: 'ACCOUNT_DISABLED'
            };
        }
        
        // Verify password
        let passwordValid = false;
        
        if (user.password.includes(':')) {
            // New hashed password format
            passwordValid = verifyPassword(password, user.password);
        } else {
            // Legacy plain text password - migrate to hashed
            if (user.password === password) {
                passwordValid = true;
                // Migrate to hashed password
                const hashedPassword = hashPassword(password);
                const userIndex = users.findIndex(u => u.id === user.id);
                if (userIndex !== -1) {
                    users[userIndex].password = hashedPassword;
                    users[userIndex].passwordChangedAt = new Date().toISOString();
                    users[userIndex].passwordHistory = users[userIndex].passwordHistory || [];
                    localStorage.setItem('users', JSON.stringify(users));
                }
            }
        }
        
        if (!passwordValid) {
            recordLoginAttempt(username, false);
            return {
                success: false,
                message: 'Invalid username or password',
                code: 'INVALID_CREDENTIALS'
            };
        }
        
        // Check password expiry
        const expiryStatus = checkPasswordExpiry(user);
        
        // Successful login
        clearLoginAttempts(username);
        updateLastLogin(user.id);
        
        return {
            success: true,
            message: 'Login successful',
            code: 'SUCCESS',
            user: user,
            passwordExpiry: expiryStatus
        };
        
    } catch (error) {
        console.error('Authentication error:', error);
        return {
            success: false,
            message: 'System error during authentication',
            code: 'SYSTEM_ERROR',
            error: error.message
        };
    }
}

/**
 * Generate secure password suggestion - Task 2.1
 * @param {number} length - Desired password length (default: 12)
 * @returns {string} Generated secure password
 */
function generateSecurePassword(length = 12) {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    // Ensure minimum requirements
    let password = '';
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    // Fill remaining length
    const allChars = lowercase + uppercase + numbers + special;
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Override the original validatePasswordStrength function with enhanced version
// This ensures backward compatibility while providing enhanced features
const originalValidatePasswordStrength = validatePasswordStrength;
validatePasswordStrength = validatePasswordStrengthEnhanced;

// Enhanced rate limiting check
const originalIsRateLimited = isRateLimited;
isRateLimited = function(username) {
    const lockoutStatus = getAccountLockoutStatus(username);
    return lockoutStatus.isLocked;
};

console.log('✅ Task 2.1: Enhanced Password Security Features Loaded');
console.log('📋 Features: Enhanced validation, account lockout, password expiry, secure generation');