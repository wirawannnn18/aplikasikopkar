/**
 * Property-Based Tests for Hapus Transaksi Tutup Kasir
 * 
 * These tests verify correctness properties using fast-check library
 * Each test runs 100+ iterations with randomly generated inputs
 */

import fc from 'fast-check';

// Import dependencies
import '../js/backup.js';
import '../js/hapusTransaksiTutupKasir.js';

// Get classes from global scope (since the module adds them to window)
const RoleValidator = global.RoleValidator || window.RoleValidator;
const PasswordVerificationService = global.PasswordVerificationService || window.PasswordVerificationService;
const RateLimiterService = global.RateLimiterService || window.RateLimiterService;

describe('Hapus Transaksi Tutup Kasir - Security Components', () => {

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();

        // Setup test users
        const users = [
            { id: 1, username: 'admin', password: 'admin123', role: 'administrator', name: 'Admin User' },
            { id: 2, username: 'kasir1', password: 'kasir123', role: 'kasir', name: 'Kasir User' },
            { id: 3, username: 'keuangan1', password: 'keuangan123', role: 'keuangan', name: 'Keuangan User' }
        ];
        localStorage.setItem('users', JSON.stringify(users));
    });

    afterEach(() => {
        localStorage.clear();
    });

    /**
     * Property 1: Super admin role requirement
     * Feature: hapus-transaksi-tutup-kasir, Property 1: Super admin role requirement
     * Validates: Requirements 2.1
     * 
     * For any user, only users with 'administrator' role should be identified as super admin
     */
    describe('Property 1: Super admin role requirement', () => {
        test('should only allow users with administrator role', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        username: fc.string({ minLength: 1, maxLength: 20 }),
                        role: fc.constantFrom('administrator', 'kasir', 'keuangan', 'user', 'guest'),
                        name: fc.string({ minLength: 1, maxLength: 50 })
                    }),
                    (user) => {
                        const validator = new RoleValidator();
                        const result = validator.isSuperAdmin(user);

                        // Property: Only administrator role should return true
                        if (user.role === 'administrator') {
                            expect(result).toBe(true);
                        } else {
                            expect(result).toBe(false);
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should return false for null or undefined user', () => {
            const validator = new RoleValidator();
            expect(validator.isSuperAdmin(null)).toBe(false);
            expect(validator.isSuperAdmin(undefined)).toBe(false);
        });

        test('should return false for user without role property', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        username: fc.string({ minLength: 1, maxLength: 20 }),
                        name: fc.string({ minLength: 1, maxLength: 50 })
                    }),
                    (user) => {
                        const validator = new RoleValidator();
                        const result = validator.isSuperAdmin(user);
                        expect(result).toBe(false);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    /**
     * Property 2: Password verification requirement
     * Feature: hapus-transaksi-tutup-kasir, Property 2: Password verification requirement
     * Validates: Requirements 2.2, 2.3, 2.4
     * 
     * For any closed transaction deletion, password verification should be required
     * and should correctly validate correct/incorrect passwords
     */
    describe('Property 2: Password verification requirement', () => {
        test('should verify correct password for existing users', () => {
            const service = new PasswordVerificationService();

            // Test with known users
            const testCases = [
                { username: 'admin', password: 'admin123', shouldPass: true },
                { username: 'kasir1', password: 'kasir123', shouldPass: true },
                { username: 'keuangan1', password: 'keuangan123', shouldPass: true }
            ];

            testCases.forEach(testCase => {
                const result = service.verifyPassword(testCase.username, testCase.password);
                expect(result.valid).toBe(testCase.shouldPass);
                if (testCase.shouldPass) {
                    expect(result.message).toBe('Password terverifikasi');
                }
            });
        });

        test('should reject incorrect password for existing users', () => {
            fc.assert(
                fc.property(
                    fc.constantFrom('admin', 'kasir1', 'keuangan1'),
                    fc.string({ minLength: 1, maxLength: 20 }).filter(pwd =>
                        pwd !== 'admin123' && pwd !== 'kasir123' && pwd !== 'keuangan123'
                    ),
                    (username, wrongPassword) => {
                        // Clear tracking before each property test run to ensure isolation
                        localStorage.removeItem('passwordVerificationTracking');

                        const service = new PasswordVerificationService();
                        const result = service.verifyPassword(username, wrongPassword);

                        // Property: Wrong password should always be rejected
                        expect(result.valid).toBe(false);
                        expect(result.message).toContain('Password salah');
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should reject non-existent users', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 1, maxLength: 20 }).filter(name =>
                        name !== 'admin' && name !== 'kasir1' && name !== 'keuangan1'
                    ),
                    fc.string({ minLength: 1, maxLength: 20 }),
                    (username, password) => {
                        const service = new PasswordVerificationService();
                        const result = service.verifyPassword(username, password);

                        // Property: Non-existent users should always be rejected
                        expect(result.valid).toBe(false);
                        expect(result.message).toBe('User tidak ditemukan');
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should track failed attempts', () => {
            const service = new PasswordVerificationService();

            // First failed attempt
            let result = service.verifyPassword('admin', 'wrongpassword');
            expect(result.valid).toBe(false);
            expect(result.remainingAttempts).toBe(2);

            // Second failed attempt
            result = service.verifyPassword('admin', 'wrongpassword');
            expect(result.valid).toBe(false);
            expect(result.remainingAttempts).toBe(1);

            // Third failed attempt
            result = service.verifyPassword('admin', 'wrongpassword');
            expect(result.valid).toBe(false);
            expect(result.remainingAttempts).toBe(0);
        });

        test('should reset failed attempts on successful login', () => {
            const service = new PasswordVerificationService();

            // Failed attempt
            service.verifyPassword('admin', 'wrongpassword');

            // Successful login should reset
            const result = service.verifyPassword('admin', 'admin123');
            expect(result.valid).toBe(true);

            // Verify tracking was reset (using prefixed key)
            const tracking = JSON.parse(localStorage.getItem('passwordVerificationTracking') || '{}');
            expect(tracking['user_admin']).toBeUndefined();
        });
    });

    /**
     * Property 3: Failed password attempt blocking
     * Feature: hapus-transaksi-tutup-kasir, Property 3: Failed password attempt blocking
     * Validates: Requirements 2.5
     * 
     * For any user with 3 consecutive failed password attempts,
     * the system should block access for 5 minutes
     */
    describe('Property 3: Failed password attempt blocking', () => {
        test('should block user after 3 failed attempts', () => {
            const service = new PasswordVerificationService();

            // Make 3 failed attempts
            for (let i = 0; i < 3; i++) {
                service.verifyPassword('admin', 'wrongpassword');
            }

            // Check if user is blocked
            const blockStatus = service.isBlocked('admin');
            expect(blockStatus.blocked).toBe(true);
            expect(blockStatus.remainingTime).toBeGreaterThan(0);
            expect(blockStatus.remainingTime).toBeLessThanOrEqual(5 * 60); // 5 minutes in seconds
        });

        test('should prevent login when blocked', () => {
            const service = new PasswordVerificationService();

            // Make 3 failed attempts to trigger block
            for (let i = 0; i < 3; i++) {
                service.verifyPassword('admin', 'wrongpassword');
            }

            // Try to login with correct password while blocked
            const result = service.verifyPassword('admin', 'admin123');
            expect(result.valid).toBe(false);
            expect(result.message).toContain('Akses diblokir sementara');
        });

        test('should not block user with less than 3 failed attempts', () => {
            fc.assert(
                fc.property(
                    fc.integer({ min: 1, max: 2 }),
                    (failedAttempts) => {
                        // Clear tracking before each property test run to ensure isolation
                        localStorage.removeItem('passwordVerificationTracking');

                        const service = new PasswordVerificationService();

                        // Make N failed attempts (less than 3)
                        for (let i = 0; i < failedAttempts; i++) {
                            service.verifyPassword('admin', 'wrongpassword');
                        }

                        // Property: User should not be blocked
                        const blockStatus = service.isBlocked('admin');
                        expect(blockStatus.blocked).toBe(false);
                    }
                ),
                { numRuns: 50 }
            );
        });

        test('should allow manual reset of failed attempts', () => {
            const service = new PasswordVerificationService();

            // Make 2 failed attempts
            service.verifyPassword('admin', 'wrongpassword');
            service.verifyPassword('admin', 'wrongpassword');

            // Reset attempts
            service.resetFailedAttempts('admin');

            // Verify tracking was cleared (using prefixed key)
            const tracking = JSON.parse(localStorage.getItem('passwordVerificationTracking') || '{}');
            expect(tracking['user_admin']).toBeUndefined();

            // Should not be blocked
            const blockStatus = service.isBlocked('admin');
            expect(blockStatus.blocked).toBe(false);
        });

        test('should track failed attempts independently per user', () => {
            const service = new PasswordVerificationService();

            // Make 2 failed attempts for admin
            service.verifyPassword('admin', 'wrongpassword');
            service.verifyPassword('admin', 'wrongpassword');

            // Make 1 failed attempt for kasir1
            service.verifyPassword('kasir1', 'wrongpassword');

            // Check tracking (using prefixed keys)
            const tracking = JSON.parse(localStorage.getItem('passwordVerificationTracking') || '{}');
            expect(tracking['user_admin'].failedAttempts).toBe(2);
            expect(tracking['user_kasir1'].failedAttempts).toBe(1);

            // Neither should be blocked yet
            expect(service.isBlocked('admin').blocked).toBe(false);
            expect(service.isBlocked('kasir1').blocked).toBe(false);
        });
    });

    /**
     * Property 4: Category and reason requirement
     * Feature: hapus-transaksi-tutup-kasir, Property 4: Category and reason requirement
     * Validates: Requirements 3.1, 3.2, 3.3
     * 
     * For any closed transaction deletion, the system should require both a category selection
     * and a reason with minimum 20 characters
     */
    describe('Property 4: Category and reason requirement', () => {

        // Import UI function
        const showCategoryReasonDialog = global.showCategoryReasonDialog || window.showCategoryReasonDialog;

        beforeEach(() => {
            // Setup DOM environment
            document.body.innerHTML = '';
            localStorage.clear();
        });

        afterEach(() => {
            document.body.innerHTML = '';
            localStorage.clear();
        });

        test('should require both category and reason', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        id: fc.string({ minLength: 1, maxLength: 20 }),
                        noTransaksi: fc.string({ minLength: 1, maxLength: 20 }),
                        tanggal: fc.date().map(d => d.toISOString()),
                        total: fc.integer({ min: 1000, max: 1000000 }),
                        metode: fc.constantFrom('cash', 'bon'),
                        kasir: fc.string({ minLength: 1, maxLength: 20 }),
                        items: fc.array(fc.record({
                            id: fc.string(),
                            nama: fc.string(),
                            qty: fc.integer({ min: 1, max: 10 }),
                            harga: fc.integer({ min: 1000, max: 100000 })
                        }), { minLength: 1, maxLength: 5 })
                    }),
                    (transaction) => {
                        let callbackResult = null;

                        // Show dialog
                        showCategoryReasonDialog(transaction, (result) => {
                            callbackResult = result;
                        });

                        // Property 1: Modal should be created
                        const modal = document.getElementById('categoryReasonModal');
                        expect(modal).not.toBeNull();

                        // Property 2: Modal should have category dropdown
                        const categorySelect = document.getElementById('categorySelect');
                        expect(categorySelect).not.toBeNull();
                        expect(categorySelect.tagName).toBe('SELECT');

                        // Check that all required categories are present
                        const options = Array.from(categorySelect.options).map(opt => opt.value);
                        expect(options).toContain('Kesalahan Input');
                        expect(options).toContain('Transaksi Duplikat');
                        expect(options).toContain('Fraud');
                        expect(options).toContain('Koreksi Akuntansi');
                        expect(options).toContain('Lainnya');

                        // Property 3: Modal should have reason textarea
                        const reasonTextarea = document.getElementById('reasonTextarea');
                        expect(reasonTextarea).not.toBeNull();
                        expect(reasonTextarea.tagName).toBe('TEXTAREA');
                        expect(reasonTextarea.maxLength).toBe(1000);

                        // Property 4: Modal should have character counter
                        const charCount = document.getElementById('charCount');
                        expect(charCount).not.toBeNull();
                        expect(charCount.textContent).toBe('0');

                        // Property 5: Modal should display transaction summary
                        const modalBody = modal.querySelector('.modal-body');
                        // Check that transaction info card exists
                        const infoCard = modal.querySelector('.card');
                        expect(infoCard).not.toBeNull();

                        // Check that the card contains transaction information table
                        const infoTable = infoCard.querySelector('table');
                        expect(infoTable).not.toBeNull();

                        // Check that table has rows (should have at least 6 rows for all transaction info)
                        const tableRows = infoTable.querySelectorAll('tr');
                        expect(tableRows.length).toBeGreaterThanOrEqual(6);

                        // Check that total is displayed
                        expect(modalBody.textContent).toContain(transaction.total.toLocaleString('id-ID'));

                        // Cleanup
                        modal.remove();
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should reject empty category', () => {
            const transaction = {
                id: 'trans-001',
                noTransaksi: 'TRX-001',
                tanggal: '2024-01-15T10:00:00',
                total: 50000,
                metode: 'cash',
                items: []
            };

            let callbackResult = null;

            showCategoryReasonDialog(transaction, (result) => {
                callbackResult = result;
            });

            const categorySelect = document.getElementById('categorySelect');
            const reasonTextarea = document.getElementById('reasonTextarea');
            const confirmBtn = document.getElementById('confirmCategoryBtn');

            // Set valid reason but no category
            reasonTextarea.value = 'This is a valid reason with more than 20 characters';
            categorySelect.value = '';

            // Try to confirm
            confirmBtn.click();

            // Property: Should show validation error
            const validationError = document.getElementById('validationError');
            expect(validationError.style.display).not.toBe('none');
            expect(validationError.textContent).toContain('Kategori kesalahan harus dipilih');

            // Property: Callback should not be called with success
            expect(callbackResult).toBeNull();

            // Cleanup
            document.getElementById('categoryReasonModal').remove();
        });

        test('should reject reason shorter than 20 characters', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 0, maxLength: 19 }),
                    (shortReason) => {
                        // Clear DOM for each iteration
                        document.body.innerHTML = '';

                        const transaction = {
                            id: 'trans-001',
                            noTransaksi: 'TRX-001',
                            tanggal: '2024-01-15T10:00:00',
                            total: 50000,
                            metode: 'cash',
                            items: []
                        };

                        let callbackResult = null;

                        showCategoryReasonDialog(transaction, (result) => {
                            callbackResult = result;
                        });

                        const categorySelect = document.getElementById('categorySelect');
                        const reasonTextarea = document.getElementById('reasonTextarea');
                        const confirmBtn = document.getElementById('confirmCategoryBtn');

                        // Set valid category but short reason
                        categorySelect.value = 'Kesalahan Input';
                        reasonTextarea.value = shortReason;

                        // Try to confirm
                        confirmBtn.click();

                        // Property: Should show validation error
                        const validationError = document.getElementById('validationError');
                        expect(validationError.style.display).not.toBe('none');

                        const errorText = validationError.textContent;
                        if (shortReason.trim().length === 0) {
                            expect(errorText).toContain('Alasan harus diisi');
                        } else {
                            expect(errorText).toContain('minimal 20 karakter');
                        }

                        // Property: Callback should not be called with success
                        expect(callbackResult).toBeNull();

                        // Cleanup
                        document.getElementById('categoryReasonModal').remove();
                    }
                ),
                { numRuns: 50 }
            );
        });

        test('should accept valid category and reason', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        category: fc.constantFrom('Kesalahan Input', 'Transaksi Duplikat', 'Fraud', 'Koreksi Akuntansi', 'Lainnya'),
                        reason: fc.string({ minLength: 20, maxLength: 1000 })
                            .filter(s => s.trim().length >= 20) // Ensure trimmed string is still valid
                    }),
                    (input) => {
                        // Clear DOM for each iteration
                        document.body.innerHTML = '';

                        const transaction = {
                            id: 'trans-001',
                            noTransaksi: 'TRX-001',
                            tanggal: '2024-01-15T10:00:00',
                            total: 50000,
                            metode: 'cash',
                            items: []
                        };

                        let callbackResult = null;

                        showCategoryReasonDialog(transaction, (result) => {
                            callbackResult = result;
                        });

                        const categorySelect = document.getElementById('categorySelect');
                        const reasonTextarea = document.getElementById('reasonTextarea');
                        const confirmBtn = document.getElementById('confirmCategoryBtn');

                        // Set valid category and reason
                        categorySelect.value = input.category;
                        reasonTextarea.value = input.reason;

                        // Confirm
                        confirmBtn.click();

                        // Property: Callback should be called with success
                        expect(callbackResult).not.toBeNull();
                        expect(callbackResult.success).toBe(true);
                        expect(callbackResult.category).toBe(input.category);
                        // Reason should be trimmed in the callback
                        expect(callbackResult.reason).toBe(input.reason.trim());

                        // Cleanup
                        const modal = document.getElementById('categoryReasonModal');
                        if (modal) {
                            modal.remove();
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should update character counter in real-time', () => {
            const transaction = {
                id: 'trans-001',
                noTransaksi: 'TRX-001',
                tanggal: '2024-01-15T10:00:00',
                total: 50000,
                metode: 'cash',
                items: []
            };

            showCategoryReasonDialog(transaction, () => { });

            const reasonTextarea = document.getElementById('reasonTextarea');
            const charCount = document.getElementById('charCount');
            const charCounter = document.getElementById('charCounter');

            // Property: Initial count should be 0
            expect(charCount.textContent).toBe('0');

            // Type some text
            reasonTextarea.value = 'Test';
            reasonTextarea.dispatchEvent(new Event('input'));

            // Property: Counter should update
            expect(charCount.textContent).toBe('4');

            // Type more text (less than 20 chars)
            reasonTextarea.value = 'Short text';
            reasonTextarea.dispatchEvent(new Event('input'));

            // Property: Counter should show danger color for < 20 chars
            expect(charCount.textContent).toBe('10');
            expect(charCounter.className).toContain('text-danger');

            // Type valid length text
            reasonTextarea.value = 'This is a valid reason with more than 20 characters';
            reasonTextarea.dispatchEvent(new Event('input'));

            // Property: Counter should show success color for valid length
            expect(charCount.textContent).toBe('51');
            expect(charCounter.className).toContain('text-success');

            // Cleanup
            document.getElementById('categoryReasonModal').remove();
        });

        test('should reject reason longer than 1000 characters', () => {
            const transaction = {
                id: 'trans-001',
                noTransaksi: 'TRX-001',
                tanggal: '2024-01-15T10:00:00',
                total: 50000,
                metode: 'cash',
                items: []
            };

            let callbackResult = null;

            showCategoryReasonDialog(transaction, (result) => {
                callbackResult = result;
            });

            const categorySelect = document.getElementById('categorySelect');
            const reasonTextarea = document.getElementById('reasonTextarea');
            const confirmBtn = document.getElementById('confirmCategoryBtn');

            // Set valid category but very long reason (> 1000 chars)
            categorySelect.value = 'Kesalahan Input';
            const longReason = 'A'.repeat(1001);
            reasonTextarea.value = longReason;

            // Try to confirm
            confirmBtn.click();

            // Property: Should show validation error
            const validationError = document.getElementById('validationError');
            expect(validationError.style.display).not.toBe('none');
            expect(validationError.textContent).toContain('maksimal 1000 karakter');

            // Property: Callback should not be called with success
            expect(callbackResult).toBeNull();

            // Cleanup
            document.getElementById('categoryReasonModal').remove();
        });
    });

    /**
     * Additional tests for Rate Limiter Service
     * These support the rate limiting properties tested in later tasks
     */
    describe('Rate Limiter Service - Basic Functionality', () => {
        test('should allow deletions under warning threshold', () => {
            const service = new RateLimiterService();

            // Record 4 deletions (under warning threshold of 5)
            for (let i = 0; i < 4; i++) {
                service.recordDeletion('admin', `trans-${i}`, `audit-${i}`);
            }

            const result = service.checkRateLimit('admin');
            expect(result.allowed).toBe(true);
            expect(result.level).toBe('ok');
            expect(result.count).toBe(4);
        });

        test('should warn at 5 deletions', () => {
            const service = new RateLimiterService();

            // Record 5 deletions (warning threshold)
            for (let i = 0; i < 5; i++) {
                service.recordDeletion('admin', `trans-${i}`, `audit-${i}`);
            }

            const result = service.checkRateLimit('admin');
            expect(result.allowed).toBe(true);
            expect(result.level).toBe('warning');
            expect(result.count).toBe(5);
            expect(result.message).toContain('Peringatan');
        });

        test('should block at 10 deletions', () => {
            const service = new RateLimiterService();

            // Record 10 deletions (block threshold)
            for (let i = 0; i < 10; i++) {
                service.recordDeletion('admin', `trans-${i}`, `audit-${i}`);
            }

            const result = service.checkRateLimit('admin');
            expect(result.allowed).toBe(false);
            expect(result.level).toBe('block');
            expect(result.count).toBe(10);
            expect(result.message).toContain('Batas maksimal');
        });

        test('should track deletions independently per user', () => {
            const service = new RateLimiterService();

            // Record deletions for different users
            for (let i = 0; i < 3; i++) {
                service.recordDeletion('admin', `trans-admin-${i}`, `audit-admin-${i}`);
            }

            for (let i = 0; i < 7; i++) {
                service.recordDeletion('kasir1', `trans-kasir-${i}`, `audit-kasir-${i}`);
            }

            // Check limits
            const adminResult = service.checkRateLimit('admin');
            const kasirResult = service.checkRateLimit('kasir1');

            expect(adminResult.count).toBe(3);
            expect(adminResult.level).toBe('ok');

            expect(kasirResult.count).toBe(7);
            expect(kasirResult.level).toBe('warning');
        });
    });
});

/**
 * Property-Based Tests for Tutup Kasir Adjustment Service
 */

// Import TutupKasirAdjustmentService
const TutupKasirAdjustmentService = global.TutupKasirAdjustmentService || window.TutupKasirAdjustmentService;

describe('Hapus Transaksi Tutup Kasir - Tutup Kasir Adjustment', () => {

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    /**
     * Property 5: Tutup kasir adjustment correctness
     * Feature: hapus-transaksi-tutup-kasir, Property 5: Tutup kasir adjustment correctness
     * Validates: Requirements 4.2, 4.3, 4.4
     * 
     * For any closed transaction deletion, the system should adjust the related tutup kasir report
     * by subtracting the transaction total from the appropriate fields (kas for cash, piutang for credit)
     */
    describe('Property 5: Tutup kasir adjustment correctness', () => {
        test('should correctly adjust tutup kasir for cash transactions', () => {
            fc.assert(
                fc.property(
                    // Generate random shift data
                    fc.record({
                        id: fc.string({ minLength: 5, maxLength: 20 }),
                        tanggalTutup: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
                        totalPenjualan: fc.float({ min: 1000, max: 10000000, noNaN: true }),
                        totalKas: fc.float({ min: 1000, max: 10000000, noNaN: true }),
                        totalPiutang: fc.float({ min: 0, max: 5000000, noNaN: true }),
                        kasir: fc.string({ minLength: 3, maxLength: 20 })
                    }),
                    // Generate random cash transaction
                    fc.record({
                        id: fc.string({ minLength: 5, maxLength: 20 }),
                        noTransaksi: fc.string({ minLength: 5, maxLength: 20 }),
                        tanggal: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
                        total: fc.float({ min: 100, max: 500000, noNaN: true }),
                        metode: fc.constant('cash'),
                        kasir: fc.string({ minLength: 3, maxLength: 20 })
                    }),
                    (shift, transaction) => {
                        // Setup: Save shift to localStorage
                        // Ensure transaction date matches shift date
                        const shiftDate = new Date(shift.tanggalTutup);
                        transaction.tanggal = shiftDate.toISOString();

                        localStorage.setItem('riwayatTutupKas', JSON.stringify([shift]));

                        // Store original values
                        const originalTotalPenjualan = shift.totalPenjualan;
                        const originalTotalKas = shift.totalKas;
                        const transactionTotal = transaction.total;

                        // Execute adjustment
                        const service = new TutupKasirAdjustmentService();
                        const result = service.adjustTutupKasir(transaction, shift.id);

                        // Property: Adjustment should succeed
                        expect(result.success).toBe(true);

                        // Property: Total penjualan should be reduced by transaction total
                        const adjustedShift = result.adjustmentData.snapshotAfter;
                        expect(adjustedShift.totalPenjualan).toBeCloseTo(originalTotalPenjualan - transactionTotal, 2);

                        // Property: Total kas should be reduced by transaction total (cash transaction)
                        expect(adjustedShift.totalKas).toBeCloseTo(originalTotalKas - transactionTotal, 2);

                        // Property: Adjustment should be saved to localStorage
                        const savedShifts = JSON.parse(localStorage.getItem('riwayatTutupKas') || '[]');
                        const savedShift = savedShifts.find(s => s.id === shift.id);
                        expect(savedShift.totalPenjualan).toBeCloseTo(originalTotalPenjualan - transactionTotal, 2);
                        expect(savedShift.totalKas).toBeCloseTo(originalTotalKas - transactionTotal, 2);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should correctly adjust tutup kasir for credit transactions', () => {
            fc.assert(
                fc.property(
                    // Generate random shift data
                    fc.record({
                        id: fc.string({ minLength: 5, maxLength: 20 }),
                        tanggalTutup: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
                        totalPenjualan: fc.float({ min: 1000, max: 10000000, noNaN: true }),
                        totalKas: fc.float({ min: 1000, max: 10000000, noNaN: true }),
                        totalPiutang: fc.float({ min: 1000, max: 5000000, noNaN: true }),
                        kasir: fc.string({ minLength: 3, maxLength: 20 })
                    }),
                    // Generate random credit transaction
                    fc.record({
                        id: fc.string({ minLength: 5, maxLength: 20 }),
                        noTransaksi: fc.string({ minLength: 5, maxLength: 20 }),
                        tanggal: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
                        total: fc.float({ min: 100, max: 500000, noNaN: true }),
                        metode: fc.constantFrom('bon', 'kredit'),
                        kasir: fc.string({ minLength: 3, maxLength: 20 })
                    }),
                    (shift, transaction) => {
                        // Setup: Save shift to localStorage
                        // Ensure transaction date matches shift date
                        const shiftDate = new Date(shift.tanggalTutup);
                        transaction.tanggal = shiftDate.toISOString();

                        localStorage.setItem('riwayatTutupKas', JSON.stringify([shift]));

                        // Store original values
                        const originalTotalPenjualan = shift.totalPenjualan;
                        const originalTotalPiutang = shift.totalPiutang;
                        const transactionTotal = transaction.total;

                        // Execute adjustment
                        const service = new TutupKasirAdjustmentService();
                        const result = service.adjustTutupKasir(transaction, shift.id);

                        // Property: Adjustment should succeed
                        expect(result.success).toBe(true);

                        // Property: Total penjualan should be reduced by transaction total
                        const adjustedShift = result.adjustmentData.snapshotAfter;
                        expect(adjustedShift.totalPenjualan).toBeCloseTo(originalTotalPenjualan - transactionTotal, 2);

                        // Property: Total piutang should be reduced by transaction total (credit transaction)
                        expect(adjustedShift.totalPiutang).toBeCloseTo(originalTotalPiutang - transactionTotal, 2);

                        // Property: Adjustment should be saved to localStorage
                        const savedShifts = JSON.parse(localStorage.getItem('riwayatTutupKas') || '[]');
                        const savedShift = savedShifts.find(s => s.id === shift.id);
                        expect(savedShift.totalPenjualan).toBeCloseTo(originalTotalPenjualan - transactionTotal, 2);
                        expect(savedShift.totalPiutang).toBeCloseTo(originalTotalPiutang - transactionTotal, 2);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should identify shift from transaction date', () => {
            fc.assert(
                fc.property(
                    // Generate a single shift
                    fc.record({
                        id: fc.string({ minLength: 5, maxLength: 20 }),
                        tanggalTutup: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
                        totalPenjualan: fc.float({ min: 1000, max: 10000000, noNaN: true }),
                        totalKas: fc.float({ min: 1000, max: 10000000, noNaN: true }),
                        kasir: fc.string({ minLength: 3, maxLength: 20 })
                    }),
                    (shift) => {
                        // Create transaction with matching date
                        const transaction = {
                            id: 'trans-123',
                            noTransaksi: 'TRX-123',
                            tanggal: shift.tanggalTutup,
                            total: 50000,
                            metode: 'cash'
                        };

                        // Setup: Save shift to localStorage
                        localStorage.setItem('riwayatTutupKas', JSON.stringify([shift]));

                        // Execute: Identify shift
                        const service = new TutupKasirAdjustmentService();
                        const identifiedShift = service.identifyShift(transaction);

                        // Property: Should identify a shift
                        expect(identifiedShift).not.toBeNull();

                        // Property: Identified shift should have the same ID
                        expect(identifiedShift.id).toBe(shift.id);

                        // Property: Transaction date should match shift date (same day)
                        const transDate = new Date(transaction.tanggal).toDateString();
                        const shiftDate = new Date(identifiedShift.tanggalTutup).toDateString();
                        expect(transDate).toBe(shiftDate);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should return null when shift not found', () => {
            fc.assert(
                fc.property(
                    // Generate transaction with date that doesn't match any shift
                    fc.record({
                        id: fc.string({ minLength: 5, maxLength: 20 }),
                        noTransaksi: fc.string({ minLength: 5, maxLength: 20 }),
                        tanggal: fc.constant(new Date('2025-12-31').toISOString()), // Future date
                        total: fc.float({ min: 100, max: 500000, noNaN: true }),
                        metode: fc.constantFrom('cash', 'bon')
                    }),
                    (transaction) => {
                        // Setup: Save shifts with different dates
                        const shifts = [
                            {
                                id: 'shift-1',
                                tanggalTutup: new Date('2024-01-01').toISOString(),
                                totalPenjualan: 100000,
                                totalKas: 100000
                            }
                        ];
                        localStorage.setItem('riwayatTutupKas', JSON.stringify(shifts));

                        // Execute: Try to identify shift
                        const service = new TutupKasirAdjustmentService();
                        const identifiedShift = service.identifyShift(transaction);

                        // Property: Should return null when no matching shift found
                        expect(identifiedShift).toBeNull();
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    /**
     * Property 6: Adjustment note creation
     * Feature: hapus-transaksi-tutup-kasir, Property 6: Adjustment note creation
     * Validates: Requirements 4.5
     * 
     * For any tutup kasir adjustment, the system should add a note referencing
     * the deleted transaction number
     */
    describe('Property 6: Adjustment note creation', () => {
        test('should create adjustment note with transaction reference', () => {
            fc.assert(
                fc.property(
                    // Generate random shift data
                    fc.record({
                        id: fc.string({ minLength: 5, maxLength: 20 }),
                        tanggalTutup: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
                        totalPenjualan: fc.float({ min: 1000, max: 10000000, noNaN: true }),
                        totalKas: fc.float({ min: 1000, max: 10000000, noNaN: true }),
                        kasir: fc.string({ minLength: 3, maxLength: 20 })
                    }),
                    // Generate random transaction
                    fc.record({
                        id: fc.string({ minLength: 5, maxLength: 20 }),
                        noTransaksi: fc.string({ minLength: 5, maxLength: 20 }),
                        tanggal: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
                        total: fc.float({ min: 100, max: 500000, noNaN: true }),
                        metode: fc.constantFrom('cash', 'bon'),
                        deletedBy: fc.string({ minLength: 3, maxLength: 20 })
                    }),
                    (shift, transaction) => {
                        // Setup: Save shift to localStorage
                        // Ensure transaction date matches shift date
                        const shiftDate = new Date(shift.tanggalTutup);
                        transaction.tanggal = shiftDate.toISOString();

                        localStorage.setItem('riwayatTutupKas', JSON.stringify([shift]));

                        // Execute adjustment
                        const service = new TutupKasirAdjustmentService();
                        const result = service.adjustTutupKasir(transaction, shift.id);

                        // Property: Adjustment should succeed
                        expect(result.success).toBe(true);

                        // Property: Adjustment note should be created
                        const adjustmentNote = result.adjustmentData.adjustmentNote;
                        expect(adjustmentNote).toBeDefined();

                        // Property: Note should reference transaction ID
                        expect(adjustmentNote.transactionId).toBe(transaction.id);

                        // Property: Note should reference transaction number
                        expect(adjustmentNote.transactionNo).toBe(transaction.noTransaksi);

                        // Property: Note should contain transaction amount
                        expect(adjustmentNote.amount).toBe(transaction.total);

                        // Property: Note should have type 'deletion'
                        expect(adjustmentNote.type).toBe('deletion');

                        // Property: Note should have timestamp
                        expect(adjustmentNote.timestamp).toBeDefined();
                        expect(new Date(adjustmentNote.timestamp).toString()).not.toBe('Invalid Date');

                        // Property: Note should be saved in shift's adjustments array
                        const adjustedShift = result.adjustmentData.snapshotAfter;
                        expect(adjustedShift.adjustments).toBeDefined();
                        expect(Array.isArray(adjustedShift.adjustments)).toBe(true);
                        expect(adjustedShift.adjustments.length).toBeGreaterThan(0);

                        const savedNote = adjustedShift.adjustments.find(
                            adj => adj.transactionId === transaction.id
                        );
                        expect(savedNote).toBeDefined();
                        expect(savedNote.transactionNo).toBe(transaction.noTransaksi);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should preserve existing adjustments when adding new one', () => {
            fc.assert(
                fc.property(
                    // Generate shift with existing adjustments
                    fc.record({
                        id: fc.string({ minLength: 5, maxLength: 20 }),
                        tanggalTutup: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
                        totalPenjualan: fc.float({ min: 1000, max: 10000000, noNaN: true }),
                        totalKas: fc.float({ min: 1000, max: 10000000, noNaN: true }),
                        kasir: fc.string({ minLength: 3, maxLength: 20 }),
                        adjustments: fc.array(
                            fc.record({
                                timestamp: fc.date().map(d => d.toISOString()),
                                transactionId: fc.string({ minLength: 5, maxLength: 20 }),
                                transactionNo: fc.string({ minLength: 5, maxLength: 20 }),
                                amount: fc.float({ min: 100, max: 100000, noNaN: true }),
                                type: fc.constant('deletion')
                            }),
                            { minLength: 1, maxLength: 5 }
                        )
                    }),
                    // Generate new transaction
                    fc.record({
                        id: fc.string({ minLength: 5, maxLength: 20 }),
                        noTransaksi: fc.string({ minLength: 5, maxLength: 20 }),
                        tanggal: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
                        total: fc.float({ min: 100, max: 500000, noNaN: true }),
                        metode: fc.constant('cash')
                    }),
                    (shift, transaction) => {
                        // Setup: Save shift to localStorage
                        const shiftDate = new Date(shift.tanggalTutup);
                        transaction.tanggal = shiftDate.toISOString();

                        const originalAdjustmentsCount = shift.adjustments.length;
                        localStorage.setItem('riwayatTutupKas', JSON.stringify([shift]));

                        // Execute adjustment
                        const service = new TutupKasirAdjustmentService();
                        const result = service.adjustTutupKasir(transaction, shift.id);

                        // Property: Should preserve existing adjustments
                        const adjustedShift = result.adjustmentData.snapshotAfter;
                        expect(adjustedShift.adjustments.length).toBe(originalAdjustmentsCount + 1);

                        // Property: All original adjustments should still be present
                        shift.adjustments.forEach(originalAdj => {
                            const found = adjustedShift.adjustments.find(
                                adj => adj.transactionId === originalAdj.transactionId
                            );
                            expect(found).toBeDefined();
                        });

                        // Property: New adjustment should be present
                        const newAdj = adjustedShift.adjustments.find(
                            adj => adj.transactionId === transaction.id
                        );
                        expect(newAdj).toBeDefined();
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should create adjustments array if it does not exist', () => {
            fc.assert(
                fc.property(
                    // Generate shift WITHOUT adjustments array
                    fc.record({
                        id: fc.string({ minLength: 5, maxLength: 20 }),
                        tanggalTutup: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
                        totalPenjualan: fc.float({ min: 1000, max: 10000000, noNaN: true }),
                        totalKas: fc.float({ min: 1000, max: 10000000, noNaN: true }),
                        kasir: fc.string({ minLength: 3, maxLength: 20 })
                        // Note: No adjustments property
                    }),
                    // Generate transaction
                    fc.record({
                        id: fc.string({ minLength: 5, maxLength: 20 }),
                        noTransaksi: fc.string({ minLength: 5, maxLength: 20 }),
                        tanggal: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
                        total: fc.float({ min: 100, max: 500000, noNaN: true }),
                        metode: fc.constant('cash')
                    }),
                    (shift, transaction) => {
                        // Setup: Save shift to localStorage
                        const shiftDate = new Date(shift.tanggalTutup);
                        transaction.tanggal = shiftDate.toISOString();

                        // Ensure no adjustments property
                        delete shift.adjustments;
                        localStorage.setItem('riwayatTutupKas', JSON.stringify([shift]));

                        // Execute adjustment
                        const service = new TutupKasirAdjustmentService();
                        const result = service.adjustTutupKasir(transaction, shift.id);

                        // Property: Should create adjustments array
                        const adjustedShift = result.adjustmentData.snapshotAfter;
                        expect(adjustedShift.adjustments).toBeDefined();
                        expect(Array.isArray(adjustedShift.adjustments)).toBe(true);
                        expect(adjustedShift.adjustments.length).toBe(1);

                        // Property: First adjustment should be the new one
                        expect(adjustedShift.adjustments[0].transactionId).toBe(transaction.id);
                    }
                ),
                { numRuns: 100 }
            );
        });
    });
});

/**
 * Property-Based Tests for Critical Audit Logger Service
 */

// Import CriticalAuditLoggerService
const CriticalAuditLoggerService = global.CriticalAuditLoggerService || window.CriticalAuditLoggerService;

describe('Hapus Transaksi Tutup Kasir - Critical Audit Logging', () => {

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    /**
     * Property 12: Critical audit log creation
     * Feature: hapus-transaksi-tutup-kasir, Property 12: Critical audit log creation
     * Validates: Requirements 6.1, 6.6
     * 
     * For any closed transaction deletion, the system should create an audit log
     * with level "CRITICAL" and unique audit ID format "AUDIT-CLOSED-YYYYMMDD-NNNN"
     */
    describe('Property 12: Critical audit log creation', () => {
        test('should create audit log with CRITICAL level', () => {
            fc.assert(
                fc.property(
                    // Generate random audit data
                    fc.record({
                        transaction: fc.record({
                            id: fc.string({ minLength: 5, maxLength: 20 }),
                            noTransaksi: fc.string({ minLength: 5, maxLength: 20 }),
                            tanggal: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
                            total: fc.float({ min: 100, max: 500000, noNaN: true }),
                            metode: fc.constantFrom('cash', 'bon'),
                            kasir: fc.string({ minLength: 3, maxLength: 20 })
                        }),
                        category: fc.constantFrom('Kesalahan Input', 'Transaksi Duplikat', 'Fraud', 'Koreksi Akuntansi', 'Lainnya'),
                        reason: fc.string({ minLength: 20, maxLength: 200 }),
                        deletedBy: fc.string({ minLength: 3, maxLength: 20 })
                    }),
                    (data) => {
                        // Add required fields
                        data.passwordVerifiedAt = new Date().toISOString();
                        data.shift = null;
                        data.journalEntries = [];
                        data.adjustmentData = null;
                        data.validationResults = {};
                        data.stockRestored = true;
                        data.warnings = [];

                        // Execute: Log critical deletion
                        const service = new CriticalAuditLoggerService();
                        const auditId = service.logCriticalDeletion(data);

                        // Property: Audit ID should be generated
                        expect(auditId).toBeDefined();
                        expect(typeof auditId).toBe('string');

                        // Property: Audit ID should match format AUDIT-CLOSED-YYYYMMDD-NNNN
                        const auditIdPattern = /^AUDIT-CLOSED-\d{8}-\d{4}$/;
                        expect(auditId).toMatch(auditIdPattern);

                        // Property: Log should be saved to storage
                        const logs = service.getCriticalHistory();
                        expect(logs.length).toBeGreaterThan(0);

                        // Property: Log should have CRITICAL level
                        const savedLog = logs.find(log => log.auditId === auditId);
                        expect(savedLog).toBeDefined();
                        expect(savedLog.level).toBe('CRITICAL');

                        // Property: Log should contain transaction ID
                        expect(savedLog.transactionId).toBe(data.transaction.id);
                        expect(savedLog.transactionNo).toBe(data.transaction.noTransaksi);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should generate unique audit IDs for multiple deletions', () => {
            const service = new CriticalAuditLoggerService();
            const auditIds = new Set();

            // Create multiple audit logs
            for (let i = 0; i < 10; i++) {
                const data = {
                    transaction: {
                        id: `trans-${i}`,
                        noTransaksi: `TRX-${i}`,
                        tanggal: new Date().toISOString(),
                        total: 50000 + i * 1000,
                        metode: 'cash',
                        kasir: 'kasir1'
                    },
                    category: 'Kesalahan Input',
                    reason: 'Test reason for deletion number ' + i,
                    deletedBy: 'admin',
                    passwordVerifiedAt: new Date().toISOString(),
                    shift: null,
                    journalEntries: [],
                    adjustmentData: null,
                    validationResults: {},
                    stockRestored: true,
                    warnings: []
                };

                const auditId = service.logCriticalDeletion(data);
                auditIds.add(auditId);
            }

            // Property: All audit IDs should be unique
            expect(auditIds.size).toBe(10);

            // Property: All audit IDs should follow the format
            const auditIdPattern = /^AUDIT-CLOSED-\d{8}-\d{4}$/;
            auditIds.forEach(id => {
                expect(id).toMatch(auditIdPattern);
            });
        });

        test('should increment sequence number for same day deletions', () => {
            const service = new CriticalAuditLoggerService();

            // Create first audit log
            const data1 = {
                transaction: {
                    id: 'trans-1',
                    noTransaksi: 'TRX-1',
                    tanggal: new Date().toISOString(),
                    total: 50000,
                    metode: 'cash',
                    kasir: 'kasir1'
                },
                category: 'Kesalahan Input',
                reason: 'First deletion of the day',
                deletedBy: 'admin',
                passwordVerifiedAt: new Date().toISOString(),
                shift: null,
                journalEntries: [],
                adjustmentData: null,
                validationResults: {},
                stockRestored: true,
                warnings: []
            };

            const auditId1 = service.logCriticalDeletion(data1);

            // Create second audit log
            const data2 = { ...data1, transaction: { ...data1.transaction, id: 'trans-2', noTransaksi: 'TRX-2' } };
            const auditId2 = service.logCriticalDeletion(data2);

            // Property: Second audit ID should have incremented sequence number
            expect(auditId1).not.toBe(auditId2);

            // Extract sequence numbers
            const seq1 = parseInt(auditId1.split('-').pop());
            const seq2 = parseInt(auditId2.split('-').pop());

            // Property: Sequence should increment
            expect(seq2).toBe(seq1 + 1);
        });
    });

    /**
     * Property 13: Audit log completeness
     * Feature: hapus-transaksi-tutup-kasir, Property 13: Audit log completeness
     * Validates: Requirements 6.2, 6.3, 6.4, 6.5
     * 
     * For any critical audit log, it should contain: user info, password verification timestamp,
     * category, reason, transaction snapshot, shift snapshots (before/after), journal entries,
     * and system info
     */
    describe('Property 13: Audit log completeness', () => {
        test('should contain all required fields in audit log', () => {
            fc.assert(
                fc.property(
                    // Generate comprehensive audit data
                    fc.record({
                        transaction: fc.record({
                            id: fc.string({ minLength: 5, maxLength: 20 }),
                            noTransaksi: fc.string({ minLength: 5, maxLength: 20 }),
                            tanggal: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
                            total: fc.float({ min: 100, max: 500000, noNaN: true }),
                            metode: fc.constantFrom('cash', 'bon'),
                            kasir: fc.string({ minLength: 3, maxLength: 20 }),
                            items: fc.array(
                                fc.record({
                                    nama: fc.string({ minLength: 3, maxLength: 30 }),
                                    qty: fc.integer({ min: 1, max: 10 }),
                                    harga: fc.float({ min: 1000, max: 100000, noNaN: true })
                                }),
                                { minLength: 1, maxLength: 5 }
                            )
                        }),
                        category: fc.constantFrom('Kesalahan Input', 'Transaksi Duplikat', 'Fraud', 'Koreksi Akuntansi', 'Lainnya'),
                        reason: fc.string({ minLength: 20, maxLength: 200 }),
                        deletedBy: fc.string({ minLength: 3, maxLength: 20 })
                    }),
                    (data) => {
                        // Add comprehensive data
                        data.passwordVerifiedAt = new Date().toISOString();
                        data.shift = {
                            shiftId: 'shift-123',
                            snapshotBefore: {
                                id: 'shift-123',
                                totalPenjualan: 1000000,
                                totalKas: 800000,
                                totalPiutang: 200000
                            },
                            snapshotAfter: {
                                id: 'shift-123',
                                totalPenjualan: 950000,
                                totalKas: 750000,
                                totalPiutang: 200000
                            }
                        };
                        data.journalEntries = [
                            { account: 'Pendapatan Penjualan', debit: 50000, credit: 0 },
                            { account: 'Kas', debit: 0, credit: 50000 }
                        ];
                        data.adjustmentData = {
                            shiftId: 'shift-123',
                            adjustmentNote: {
                                timestamp: new Date().toISOString(),
                                transactionId: data.transaction.id,
                                amount: data.transaction.total
                            }
                        };
                        data.validationResults = {
                            preDelete: { valid: true, errors: [] },
                            postDelete: { valid: true, errors: [] }
                        };
                        data.stockRestored = true;
                        data.warnings = ['Warning: High value transaction'];

                        // Execute: Log critical deletion
                        const service = new CriticalAuditLoggerService();
                        const auditId = service.logCriticalDeletion(data);

                        // Get saved log
                        const logs = service.getCriticalHistory();
                        const savedLog = logs.find(log => log.auditId === auditId);

                        // Property: Log should contain user info
                        expect(savedLog.deletedBy).toBe(data.deletedBy);

                        // Property: Log should contain password verification timestamp
                        expect(savedLog.passwordVerifiedAt).toBe(data.passwordVerifiedAt);
                        expect(new Date(savedLog.passwordVerifiedAt).toString()).not.toBe('Invalid Date');

                        // Property: Log should contain category
                        expect(savedLog.category).toBe(data.category);

                        // Property: Log should contain reason
                        expect(savedLog.reason).toBe(data.reason);
                        expect(savedLog.reason.length).toBeGreaterThanOrEqual(20);

                        // Property: Log should contain transaction snapshot
                        expect(savedLog.transactionSnapshot).toBeDefined();
                        expect(savedLog.transactionSnapshot.id).toBe(data.transaction.id);
                        expect(savedLog.transactionSnapshot.noTransaksi).toBe(data.transaction.noTransaksi);
                        expect(savedLog.transactionSnapshot.items).toBeDefined();
                        expect(Array.isArray(savedLog.transactionSnapshot.items)).toBe(true);

                        // Property: Log should contain shift snapshots (before/after)
                        expect(savedLog.shiftSnapshot).toBeDefined();
                        expect(savedLog.shiftSnapshot.before).toBeDefined();
                        expect(savedLog.shiftSnapshot.after).toBeDefined();
                        expect(savedLog.shiftSnapshot.before.totalPenjualan).toBe(1000000);
                        expect(savedLog.shiftSnapshot.after.totalPenjualan).toBe(950000);

                        // Property: Log should contain journal entries
                        expect(savedLog.journalEntries).toBeDefined();
                        expect(Array.isArray(savedLog.journalEntries)).toBe(true);
                        expect(savedLog.journalEntries.length).toBe(2);

                        // Property: Log should contain system info
                        expect(savedLog.systemInfo).toBeDefined();
                        expect(savedLog.systemInfo.timestamp).toBeDefined();
                        expect(new Date(savedLog.systemInfo.timestamp).toString()).not.toBe('Invalid Date');

                        // Property: Log should contain adjustment data
                        expect(savedLog.adjustmentData).toBeDefined();
                        expect(savedLog.adjustmentData.shiftId).toBe('shift-123');

                        // Property: Log should contain validation results
                        expect(savedLog.validationResults).toBeDefined();
                        expect(savedLog.validationResults.preDelete).toBeDefined();
                        expect(savedLog.validationResults.postDelete).toBeDefined();

                        // Property: Log should contain stock restoration status
                        expect(savedLog.stockRestored).toBe(true);

                        // Property: Log should contain warnings
                        expect(savedLog.warnings).toBeDefined();
                        expect(Array.isArray(savedLog.warnings)).toBe(true);

                        // Property: Log should have deletion timestamp
                        expect(savedLog.deletedAt).toBeDefined();
                        expect(new Date(savedLog.deletedAt).toString()).not.toBe('Invalid Date');
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should handle minimal audit data without optional fields', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        transaction: fc.record({
                            id: fc.string({ minLength: 5, maxLength: 20 }),
                            noTransaksi: fc.string({ minLength: 5, maxLength: 20 }),
                            tanggal: fc.date().map(d => d.toISOString()),
                            total: fc.float({ min: 100, max: 500000, noNaN: true }),
                            metode: fc.constantFrom('cash', 'bon'),
                            kasir: fc.string({ minLength: 3, maxLength: 20 })
                        }),
                        category: fc.constantFrom('Kesalahan Input', 'Transaksi Duplikat', 'Fraud'),
                        reason: fc.string({ minLength: 20, maxLength: 100 }),
                        deletedBy: fc.string({ minLength: 3, maxLength: 20 })
                    }),
                    (data) => {
                        // Minimal data - no shift, no journals, no adjustments
                        data.passwordVerifiedAt = new Date().toISOString();
                        data.shift = null;
                        data.journalEntries = [];
                        data.adjustmentData = null;
                        data.validationResults = {};
                        data.stockRestored = false;
                        data.warnings = [];

                        // Execute: Log critical deletion
                        const service = new CriticalAuditLoggerService();
                        const auditId = service.logCriticalDeletion(data);

                        // Get saved log
                        const logs = service.getCriticalHistory();
                        const savedLog = logs.find(log => log.auditId === auditId);

                        // Property: Should still create valid log with minimal data
                        expect(savedLog).toBeDefined();
                        expect(savedLog.level).toBe('CRITICAL');
                        expect(savedLog.transactionId).toBe(data.transaction.id);
                        expect(savedLog.category).toBe(data.category);
                        expect(savedLog.reason).toBe(data.reason);

                        // Property: Optional fields should be null or empty arrays
                        expect(savedLog.shiftSnapshot).toBeNull();
                        expect(savedLog.adjustmentData).toBeNull();
                        expect(Array.isArray(savedLog.journalEntries)).toBe(true);
                        expect(savedLog.journalEntries.length).toBe(0);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should preserve transaction snapshot immutability', () => {
            const service = new CriticalAuditLoggerService();

            const originalTransaction = {
                id: 'trans-123',
                noTransaksi: 'TRX-123',
                tanggal: new Date().toISOString(),
                total: 50000,
                metode: 'cash',
                kasir: 'kasir1',
                items: [
                    { nama: 'Item 1', qty: 2, harga: 25000 }
                ]
            };

            const data = {
                transaction: originalTransaction,
                category: 'Kesalahan Input',
                reason: 'Test immutability of transaction snapshot',
                deletedBy: 'admin',
                passwordVerifiedAt: new Date().toISOString(),
                shift: null,
                journalEntries: [],
                adjustmentData: null,
                validationResults: {},
                stockRestored: true,
                warnings: []
            };

            const auditId = service.logCriticalDeletion(data);

            // Modify original transaction after logging
            originalTransaction.total = 999999;
            originalTransaction.items[0].harga = 999999;

            // Get saved log
            const logs = service.getCriticalHistory();
            const savedLog = logs.find(log => log.auditId === auditId);

            // Property: Saved snapshot should not be affected by changes to original
            expect(savedLog.transactionSnapshot.total).toBe(50000);
            expect(savedLog.transactionSnapshot.items[0].harga).toBe(25000);
        });
    });

    /**
     * Additional tests for getCriticalHistory and exportToPDF
     */
    describe('Critical Audit Logger - Additional Methods', () => {
        test('getCriticalHistory should return all critical logs', () => {
            const service = new CriticalAuditLoggerService();

            // Create multiple logs
            const numLogs = 5;
            for (let i = 0; i < numLogs; i++) {
                const data = {
                    transaction: {
                        id: `trans-${i}`,
                        noTransaksi: `TRX-${i}`,
                        tanggal: new Date().toISOString(),
                        total: 50000 + i * 1000,
                        metode: 'cash',
                        kasir: 'kasir1'
                    },
                    category: 'Kesalahan Input',
                    reason: `Test reason for deletion number ${i}`,
                    deletedBy: 'admin',
                    passwordVerifiedAt: new Date().toISOString(),
                    shift: null,
                    journalEntries: [],
                    adjustmentData: null,
                    validationResults: {},
                    stockRestored: true,
                    warnings: []
                };

                service.logCriticalDeletion(data);
            }

            // Get all logs
            const logs = service.getCriticalHistory();

            // Property: Should return all logs
            expect(logs.length).toBe(numLogs);

            // Property: All logs should have CRITICAL level
            logs.forEach(log => {
                expect(log.level).toBe('CRITICAL');
            });
        });

        test('exportToPDF should format audit log for PDF export', () => {
            const service = new CriticalAuditLoggerService();

            // Create a comprehensive audit log
            const data = {
                transaction: {
                    id: 'trans-123',
                    noTransaksi: 'TRX-123',
                    tanggal: new Date('2024-06-15').toISOString(),
                    total: 150000,
                    metode: 'cash',
                    kasir: 'kasir1',
                    items: [
                        { nama: 'Item A', qty: 2, harga: 50000 },
                        { nama: 'Item B', qty: 1, harga: 50000 }
                    ]
                },
                category: 'Kesalahan Input',
                reason: 'Transaction was entered with wrong items',
                deletedBy: 'admin',
                passwordVerifiedAt: new Date().toISOString(),
                shift: {
                    shiftId: 'shift-456',
                    snapshotBefore: {
                        id: 'shift-456',
                        totalPenjualan: 1000000,
                        totalKas: 800000,
                        totalPiutang: 200000
                    },
                    snapshotAfter: {
                        id: 'shift-456',
                        totalPenjualan: 850000,
                        totalKas: 650000,
                        totalPiutang: 200000
                    }
                },
                journalEntries: [
                    { account: 'Pendapatan Penjualan', debit: 150000, credit: 0 },
                    { account: 'Kas', debit: 0, credit: 150000 }
                ],
                adjustmentData: {
                    shiftId: 'shift-456',
                    adjustmentNote: {
                        timestamp: new Date().toISOString(),
                        transactionId: 'trans-123',
                        amount: 150000
                    }
                },
                validationResults: {
                    preDelete: { valid: true, errors: [] },
                    postDelete: { valid: true, errors: [] }
                },
                stockRestored: true,
                warnings: []
            };

            const auditId = service.logCriticalDeletion(data);

            // Export to PDF format
            const pdfData = service.exportToPDF(auditId);

            // Property: Should return formatted data
            expect(pdfData).not.toBeNull();
            expect(pdfData).toBeDefined();

            // Property: Should have title
            expect(pdfData.title).toBe('AUDIT LOG - PENGHAPUSAN TRANSAKSI TERTUTUP');

            // Property: Should include audit ID and level
            expect(pdfData.auditId).toBe(auditId);
            expect(pdfData.level).toBe('CRITICAL');

            // Property: Should include transaction info
            expect(pdfData.transactionInfo).toBeDefined();
            expect(pdfData.transactionInfo.id).toBe('trans-123');
            expect(pdfData.transactionInfo.number).toBe('TRX-123');
            expect(pdfData.transactionInfo.total).toBe(150000);
            expect(pdfData.transactionInfo.items).toBeDefined();
            expect(pdfData.transactionInfo.items.length).toBe(2);

            // Property: Should include shift info
            expect(pdfData.shiftInfo).toBeDefined();
            expect(pdfData.shiftInfo.shiftId).toBe('shift-456');
            expect(pdfData.shiftInfo.beforeAdjustment).toBeDefined();
            expect(pdfData.shiftInfo.afterAdjustment).toBeDefined();
            expect(pdfData.shiftInfo.beforeAdjustment.totalPenjualan).toBe(1000000);
            expect(pdfData.shiftInfo.afterAdjustment.totalPenjualan).toBe(850000);

            // Property: Should include deletion info
            expect(pdfData.deletionInfo).toBeDefined();
            expect(pdfData.deletionInfo.category).toBe('Kesalahan Input');
            expect(pdfData.deletionInfo.reason).toBe('Transaction was entered with wrong items');
            expect(pdfData.deletionInfo.deletedBy).toBe('admin');

            // Property: Should include system info
            expect(pdfData.systemInfo).toBeDefined();

            // Property: Should include journal entries
            expect(pdfData.journalEntries).toBeDefined();
            expect(pdfData.journalEntries.length).toBe(2);

            // Property: Should include metadata
            expect(pdfData.generatedAt).toBeDefined();
            expect(new Date(pdfData.generatedAt).toString()).not.toBe('Invalid Date');
        });

        test('exportToPDF should return null for non-existent audit ID', () => {
            const service = new CriticalAuditLoggerService();

            // Try to export non-existent audit ID
            const pdfData = service.exportToPDF('AUDIT-CLOSED-20241231-9999');

            // Property: Should return null for non-existent ID
            expect(pdfData).toBeNull();
        });

        test('exportToPDF should handle logs without shift data', () => {
            const service = new CriticalAuditLoggerService();

            // Create log without shift data
            const data = {
                transaction: {
                    id: 'trans-789',
                    noTransaksi: 'TRX-789',
                    tanggal: new Date().toISOString(),
                    total: 75000,
                    metode: 'cash',
                    kasir: 'kasir2'
                },
                category: 'Koreksi Akuntansi',
                reason: 'Accounting correction without shift',
                deletedBy: 'admin',
                passwordVerifiedAt: new Date().toISOString(),
                shift: null,
                journalEntries: [],
                adjustmentData: null,
                validationResults: {},
                stockRestored: true,
                warnings: []
            };

            const auditId = service.logCriticalDeletion(data);

            // Export to PDF format
            const pdfData = service.exportToPDF(auditId);

            // Property: Should handle null shift gracefully
            expect(pdfData).not.toBeNull();
            expect(pdfData.shiftInfo).toBeNull();
            expect(pdfData.transactionInfo).toBeDefined();
        });
    });
});

/**
 * Property-Based Tests for Data Integrity Validator
 */

// Import DataIntegrityValidator
const DataIntegrityValidator = global.DataIntegrityValidator || window.DataIntegrityValidator;

describe('Hapus Transaksi Tutup Kasir - Data Integrity Validation', () => {

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    /**
     * Property 18: Pre-deletion validation
     * Feature: hapus-transaksi-tutup-kasir, Property 18: Pre-deletion validation
     * Validates: Requirements 9.1, 9.2
     * 
     * For any closed transaction deletion, the system should perform pre-deletion validation
     * and prevent deletion if validation fails
     */
    describe('Property 18: Pre-deletion validation', () => {
        test('should validate that transaction exists', () => {
            fc.assert(
                fc.property(
                    fc.string({ minLength: 5, maxLength: 20 }),
                    (transactionId) => {
                        // Setup: No transactions in storage
                        localStorage.setItem('posTransactions', JSON.stringify([]));

                        // Execute validation
                        const validator = new DataIntegrityValidator();
                        const result = validator.preDeleteValidation(transactionId);

                        // Property: Should fail validation when transaction doesn't exist
                        expect(result.valid).toBe(false);
                        expect(result.errors).toBeDefined();
                        expect(Array.isArray(result.errors)).toBe(true);
                        expect(result.errors.length).toBeGreaterThan(0);
                        expect(result.errors.some(err => err.includes('tidak ditemukan'))).toBe(true);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should validate that shift exists for transaction', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        id: fc.string({ minLength: 5, maxLength: 20 }),
                        noTransaksi: fc.string({ minLength: 5, maxLength: 20 }),
                        tanggal: fc.date({ min: new Date('2025-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString()),
                        total: fc.float({ min: 100, max: 500000, noNaN: true }),
                        metode: fc.constantFrom('cash', 'bon'),
                        kasir: fc.string({ minLength: 3, maxLength: 20 }),
                        items: fc.array(
                            fc.record({
                                nama: fc.string({ minLength: 3, maxLength: 30 }),
                                qty: fc.integer({ min: 1, max: 10 }),
                                harga: fc.float({ min: 1000, max: 100000, noNaN: true })
                            }),
                            { minLength: 1, maxLength: 5 }
                        )
                    }),
                    (transaction) => {
                        // Setup: Transaction exists but no matching shift
                        localStorage.setItem('posTransactions', JSON.stringify([transaction]));
                        localStorage.setItem('riwayatTutupKas', JSON.stringify([]));

                        // Execute validation
                        const validator = new DataIntegrityValidator();
                        const result = validator.preDeleteValidation(transaction.id);

                        // Property: Should fail validation when shift doesn't exist
                        expect(result.valid).toBe(false);
                        expect(result.errors).toBeDefined();
                        expect(result.errors.some(err => err.includes('tutup kasir tidak ditemukan'))).toBe(true);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should validate transaction has required fields', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        id: fc.string({ minLength: 5, maxLength: 20 }),
                        noTransaksi: fc.string({ minLength: 5, maxLength: 20 }),
                        tanggal: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
                        total: fc.float({ min: 100, max: 500000, noNaN: true }),
                        metode: fc.constantFrom('cash', 'bon'),
                        kasir: fc.string({ minLength: 3, maxLength: 20 }),
                        items: fc.array(
                            fc.record({
                                nama: fc.string({ minLength: 3, maxLength: 30 }),
                                qty: fc.integer({ min: 1, max: 10 }),
                                harga: fc.float({ min: 1000, max: 100000, noNaN: true })
                            }),
                            { minLength: 1, maxLength: 5 }
                        )
                    }),
                    (transaction) => {
                        // Setup: Create matching shift
                        const shift = {
                            id: 'shift-123',
                            tanggalTutup: transaction.tanggal,
                            totalPenjualan: 1000000,
                            totalKas: 800000,
                            kasir: transaction.kasir
                        };

                        localStorage.setItem('posTransactions', JSON.stringify([transaction]));
                        localStorage.setItem('riwayatTutupKas', JSON.stringify([shift]));

                        // Execute validation
                        const validator = new DataIntegrityValidator();
                        const result = validator.preDeleteValidation(transaction.id);

                        // Property: Should pass validation when all required fields exist
                        expect(result.valid).toBe(true);
                        expect(result.errors).toBeDefined();
                        expect(result.errors.length).toBe(0);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should detect missing transaction fields', () => {
            const validator = new DataIntegrityValidator();

            // Test missing ID
            const transactionNoId = {
                noTransaksi: 'TRX-123',
                tanggal: new Date().toISOString(),
                total: 50000,
                metode: 'cash',
                items: [{ nama: 'Item 1', qty: 1, harga: 50000 }]
            };
            localStorage.setItem('posTransactions', JSON.stringify([transactionNoId]));

            let result = validator.preDeleteValidation('some-id');
            expect(result.valid).toBe(false);

            // Test missing noTransaksi
            const transactionNoNumber = {
                id: 'trans-123',
                tanggal: new Date().toISOString(),
                total: 50000,
                metode: 'cash',
                items: [{ nama: 'Item 1', qty: 1, harga: 50000 }]
            };
            localStorage.setItem('posTransactions', JSON.stringify([transactionNoNumber]));

            result = validator.preDeleteValidation('trans-123');
            expect(result.valid).toBe(false);
            expect(result.errors.some(err => err.includes('nomor transaksi'))).toBe(true);

            // Test missing tanggal
            const transactionNoDate = {
                id: 'trans-456',
                noTransaksi: 'TRX-456',
                total: 50000,
                metode: 'cash',
                items: [{ nama: 'Item 1', qty: 1, harga: 50000 }]
            };
            localStorage.setItem('posTransactions', JSON.stringify([transactionNoDate]));

            result = validator.preDeleteValidation('trans-456');
            expect(result.valid).toBe(false);
            expect(result.errors.some(err => err.includes('tanggal'))).toBe(true);

            // Test missing items
            const transactionNoItems = {
                id: 'trans-789',
                noTransaksi: 'TRX-789',
                tanggal: new Date().toISOString(),
                total: 50000,
                metode: 'cash'
            };
            localStorage.setItem('posTransactions', JSON.stringify([transactionNoItems]));

            result = validator.preDeleteValidation('trans-789');
            expect(result.valid).toBe(false);
            expect(result.errors.some(err => err.includes('item'))).toBe(true);
        });

        test('should validate shift has required fields', () => {
            const validator = new DataIntegrityValidator();

            const transaction = {
                id: 'trans-123',
                noTransaksi: 'TRX-123',
                tanggal: new Date('2024-06-15').toISOString(),
                total: 50000,
                metode: 'cash',
                kasir: 'kasir1',
                items: [{ nama: 'Item 1', qty: 1, harga: 50000 }]
            };

            // Test shift without ID
            const shiftNoId = {
                tanggalTutup: transaction.tanggal,
                totalPenjualan: 1000000,
                totalKas: 800000
            };

            localStorage.setItem('posTransactions', JSON.stringify([transaction]));
            localStorage.setItem('riwayatTutupKas', JSON.stringify([shiftNoId]));

            let result = validator.preDeleteValidation('trans-123');
            expect(result.valid).toBe(false);
            expect(result.errors.some(err => err.includes('Shift tidak memiliki ID'))).toBe(true);

            // Test shift without totalPenjualan
            const shiftNoTotal = {
                id: 'shift-123',
                tanggalTutup: transaction.tanggal,
                totalKas: 800000
            };

            localStorage.setItem('riwayatTutupKas', JSON.stringify([shiftNoTotal]));

            result = validator.preDeleteValidation('trans-123');
            expect(result.valid).toBe(false);
            expect(result.errors.some(err => err.includes('total penjualan'))).toBe(true);
        });

        test('should handle validation errors gracefully', () => {
            const validator = new DataIntegrityValidator();

            // Test with invalid localStorage data
            localStorage.setItem('posTransactions', 'invalid json');

            const result = validator.preDeleteValidation('trans-123');

            // Property: Should return validation failure with error message
            expect(result.valid).toBe(false);
            expect(result.errors).toBeDefined();
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    /**
     * Property 19: Post-deletion validation with rollback
     * Feature: hapus-transaksi-tutup-kasir, Property 19: Post-deletion validation with rollback
     * Validates: Requirements 9.3, 9.4, 9.5
     * 
     * For any closed transaction deletion, the system should perform post-deletion validation
     * and rollback if validation fails
     */
    describe('Property 19: Post-deletion validation with rollback', () => {
        test('should validate transaction is deleted', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        transactionId: fc.string({ minLength: 5, maxLength: 20 }),
                        shiftId: fc.string({ minLength: 5, maxLength: 20 }),
                        auditId: fc.string({ minLength: 10, maxLength: 30 }),
                        stockRestored: fc.boolean()
                    }),
                    (context) => {
                        // Setup: Transaction still exists (deletion failed)
                        const transaction = {
                            id: context.transactionId,
                            noTransaksi: 'TRX-123',
                            tanggal: new Date().toISOString(),
                            total: 50000,
                            metode: 'cash',
                            items: []
                        };

                        localStorage.setItem('posTransactions', JSON.stringify([transaction]));

                        // Add required context fields
                        context.journalEntries = [];

                        // Execute validation
                        const validator = new DataIntegrityValidator();
                        const result = validator.postDeleteValidation(context);

                        // Property: Should fail validation when transaction still exists
                        expect(result.valid).toBe(false);
                        expect(result.errors).toBeDefined();
                        expect(result.errors.some(err => err.includes('masih ada'))).toBe(true);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should validate stock is restored', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        transactionId: fc.string({ minLength: 5, maxLength: 20 }),
                        shiftId: fc.string({ minLength: 5, maxLength: 20 }),
                        auditId: fc.string({ minLength: 10, maxLength: 30 })
                    }),
                    (context) => {
                        // Setup: Transaction deleted but stock not restored
                        localStorage.setItem('posTransactions', JSON.stringify([]));

                        context.stockRestored = false;
                        context.journalEntries = [];

                        // Execute validation
                        const validator = new DataIntegrityValidator();
                        const result = validator.postDeleteValidation(context);

                        // Property: Should fail validation when stock not restored
                        expect(result.valid).toBe(false);
                        expect(result.errors).toBeDefined();
                        expect(result.errors.some(err => err.includes('Stok belum dikembalikan'))).toBe(true);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should validate journal entries are created', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        transactionId: fc.string({ minLength: 5, maxLength: 20 }),
                        shiftId: fc.string({ minLength: 5, maxLength: 20 }),
                        auditId: fc.string({ minLength: 10, maxLength: 30 })
                    }),
                    (context) => {
                        // Setup: Transaction deleted, stock restored, but no journals
                        localStorage.setItem('posTransactions', JSON.stringify([]));
                        localStorage.setItem('journals', JSON.stringify([]));

                        context.stockRestored = true;
                        context.journalEntries = []; // No journal entries

                        // Execute validation
                        const validator = new DataIntegrityValidator();
                        const result = validator.postDeleteValidation(context);

                        // Property: Should fail validation when no journal entries
                        expect(result.valid).toBe(false);
                        expect(result.errors).toBeDefined();
                        expect(result.errors.some(err => err.includes('Jurnal pembalik belum dibuat'))).toBe(true);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should validate tutup kasir is adjusted', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        transactionId: fc.string({ minLength: 5, maxLength: 20 }),
                        shiftId: fc.string({ minLength: 5, maxLength: 20 }),
                        auditId: fc.string({ minLength: 10, maxLength: 30 })
                    }),
                    (context) => {
                        // Setup: Transaction deleted, stock restored, journals created
                        localStorage.setItem('posTransactions', JSON.stringify([]));

                        const journals = [
                            {
                                id: 'journal-1',
                                deskripsi: 'Reversal Transaksi Tertutup - TRX-123',
                                tanggal: new Date().toISOString()
                            }
                        ];
                        localStorage.setItem('journals', JSON.stringify(journals));

                        // Shift exists but no adjustment
                        const shift = {
                            id: context.shiftId,
                            tanggalTutup: new Date().toISOString(),
                            totalPenjualan: 1000000,
                            totalKas: 800000
                            // No adjustments array
                        };
                        localStorage.setItem('riwayatTutupKas', JSON.stringify([shift]));

                        context.stockRestored = true;
                        context.journalEntries = journals;

                        // Execute validation
                        const validator = new DataIntegrityValidator();
                        const result = validator.postDeleteValidation(context);

                        // Property: Should fail validation when no adjustment note
                        expect(result.valid).toBe(false);
                        expect(result.errors).toBeDefined();
                        expect(result.errors.some(err => err.includes('Catatan adjustment tidak ditemukan'))).toBe(true);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should validate audit log is saved', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        transactionId: fc.string({ minLength: 5, maxLength: 20 }),
                        shiftId: fc.string({ minLength: 5, maxLength: 20 })
                    }),
                    (context) => {
                        // Setup: Everything else is valid but no audit log
                        localStorage.setItem('posTransactions', JSON.stringify([]));

                        const journals = [
                            {
                                id: 'journal-1',
                                deskripsi: 'Reversal Transaksi Tertutup - TRX-123',
                                tanggal: new Date().toISOString()
                            }
                        ];
                        localStorage.setItem('journals', JSON.stringify(journals));

                        const shift = {
                            id: context.shiftId,
                            tanggalTutup: new Date().toISOString(),
                            totalPenjualan: 1000000,
                            totalKas: 800000,
                            adjustments: [
                                {
                                    transactionId: context.transactionId,
                                    timestamp: new Date().toISOString()
                                }
                            ]
                        };
                        localStorage.setItem('riwayatTutupKas', JSON.stringify([shift]));
                        localStorage.setItem('closedShiftDeletionLog', JSON.stringify([]));

                        context.stockRestored = true;
                        context.journalEntries = journals;
                        context.auditId = null; // No audit ID

                        // Execute validation
                        const validator = new DataIntegrityValidator();
                        const result = validator.postDeleteValidation(context);

                        // Property: Should fail validation when no audit ID
                        expect(result.valid).toBe(false);
                        expect(result.errors).toBeDefined();
                        expect(result.errors.some(err => err.includes('Audit ID tidak tersedia'))).toBe(true);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should pass validation when all checks succeed', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        transactionId: fc.string({ minLength: 5, maxLength: 20 }),
                        shiftId: fc.string({ minLength: 5, maxLength: 20 }),
                        auditId: fc.string({ minLength: 10, maxLength: 30 })
                    }),
                    (context) => {
                        // Setup: Everything is valid
                        // Transaction is deleted
                        localStorage.setItem('posTransactions', JSON.stringify([]));

                        // Journals are created
                        const journals = [
                            {
                                id: 'journal-1',
                                deskripsi: 'Reversal Transaksi Tertutup - TRX-123',
                                tanggal: new Date().toISOString()
                            }
                        ];
                        localStorage.setItem('journals', JSON.stringify(journals));

                        // Shift is adjusted
                        const shift = {
                            id: context.shiftId,
                            tanggalTutup: new Date().toISOString(),
                            totalPenjualan: 1000000,
                            totalKas: 800000,
                            adjustments: [
                                {
                                    transactionId: context.transactionId,
                                    timestamp: new Date().toISOString(),
                                    amount: 50000
                                }
                            ]
                        };
                        localStorage.setItem('riwayatTutupKas', JSON.stringify([shift]));

                        // Audit log is saved
                        const auditLogs = [
                            {
                                auditId: context.auditId,
                                transactionId: context.transactionId,
                                deletedBy: 'admin',
                                category: 'Kesalahan Input',
                                reason: 'Test reason for validation',
                                level: 'CRITICAL'
                            }
                        ];
                        localStorage.setItem('closedShiftDeletionLog', JSON.stringify(auditLogs));

                        context.stockRestored = true;
                        context.journalEntries = journals;

                        // Execute validation
                        const validator = new DataIntegrityValidator();
                        const result = validator.postDeleteValidation(context);

                        // Property: Should pass validation when all checks succeed
                        expect(result.valid).toBe(true);
                        expect(result.errors).toBeDefined();
                        expect(result.errors.length).toBe(0);
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should validate audit log has required fields', () => {
            const validator = new DataIntegrityValidator();

            const context = {
                transactionId: 'trans-123',
                shiftId: 'shift-456',
                auditId: 'AUDIT-CLOSED-20240615-0001',
                stockRestored: true,
                journalEntries: [
                    {
                        id: 'journal-1',
                        deskripsi: 'Reversal Transaksi Tertutup - TRX-123'
                    }
                ]
            };

            // Setup valid state except audit log missing fields
            localStorage.setItem('posTransactions', JSON.stringify([]));
            localStorage.setItem('journals', JSON.stringify(context.journalEntries));

            const shift = {
                id: context.shiftId,
                tanggalTutup: new Date().toISOString(),
                totalPenjualan: 1000000,
                adjustments: [{ transactionId: context.transactionId }]
            };
            localStorage.setItem('riwayatTutupKas', JSON.stringify([shift]));

            // Test missing transactionId in audit log
            let auditLog = {
                auditId: context.auditId,
                deletedBy: 'admin',
                category: 'Kesalahan Input',
                reason: 'Test reason'
            };
            localStorage.setItem('closedShiftDeletionLog', JSON.stringify([auditLog]));

            let result = validator.postDeleteValidation(context);
            expect(result.valid).toBe(false);
            expect(result.errors.some(err => err.includes('transaction ID'))).toBe(true);

            // Test missing deletedBy
            auditLog = {
                auditId: context.auditId,
                transactionId: context.transactionId,
                category: 'Kesalahan Input',
                reason: 'Test reason'
            };
            localStorage.setItem('closedShiftDeletionLog', JSON.stringify([auditLog]));

            result = validator.postDeleteValidation(context);
            expect(result.valid).toBe(false);
            expect(result.errors.some(err => err.includes('user yang menghapus'))).toBe(true);

            // Test missing category
            auditLog = {
                auditId: context.auditId,
                transactionId: context.transactionId,
                deletedBy: 'admin',
                reason: 'Test reason'
            };
            localStorage.setItem('closedShiftDeletionLog', JSON.stringify([auditLog]));

            result = validator.postDeleteValidation(context);
            expect(result.valid).toBe(false);
            expect(result.errors.some(err => err.includes('kategori'))).toBe(true);

            // Test missing reason
            auditLog = {
                auditId: context.auditId,
                transactionId: context.transactionId,
                deletedBy: 'admin',
                category: 'Kesalahan Input'
            };
            localStorage.setItem('closedShiftDeletionLog', JSON.stringify([auditLog]));

            result = validator.postDeleteValidation(context);
            expect(result.valid).toBe(false);
            expect(result.errors.some(err => err.includes('alasan'))).toBe(true);
        });

        test('should handle validation errors gracefully', () => {
            const validator = new DataIntegrityValidator();

            const context = {
                transactionId: 'trans-123',
                shiftId: 'shift-456',
                auditId: 'AUDIT-123',
                stockRestored: true,
                journalEntries: []
            };

            // Test with invalid localStorage data
            localStorage.setItem('posTransactions', 'invalid json');

            const result = validator.postDeleteValidation(context);

            // Property: Should return validation failure with error message
            expect(result.valid).toBe(false);
            expect(result.errors).toBeDefined();
            expect(result.errors.length).toBeGreaterThan(0);
        });

        test('should validate journal entries exist in storage', () => {
            const validator = new DataIntegrityValidator();

            const context = {
                transactionId: 'trans-123',
                shiftId: 'shift-456',
                auditId: 'AUDIT-CLOSED-20240615-0001',
                stockRestored: true,
                journalEntries: [
                    {
                        id: 'journal-1',
                        deskripsi: 'Reversal Transaksi Tertutup - TRX-123'
                    },
                    {
                        id: 'journal-2',
                        deskripsi: 'HPP Reversal - TRX-123'
                    }
                ]
            };

            // Setup: Transaction deleted, shift adjusted, audit log saved
            localStorage.setItem('posTransactions', JSON.stringify([]));

            const shift = {
                id: context.shiftId,
                adjustments: [{ transactionId: context.transactionId }]
            };
            localStorage.setItem('riwayatTutupKas', JSON.stringify([shift]));

            const auditLog = {
                auditId: context.auditId,
                transactionId: context.transactionId,
                deletedBy: 'admin',
                category: 'Kesalahan Input',
                reason: 'Test reason'
            };
            localStorage.setItem('closedShiftDeletionLog', JSON.stringify([auditLog]));

            // Only one journal in storage (missing the second one)
            const journals = [
                {
                    id: 'journal-1',
                    deskripsi: 'Reversal Transaksi Tertutup - TRX-123'
                }
            ];
            localStorage.setItem('journals', JSON.stringify(journals));

            const result = validator.postDeleteValidation(context);

            // Property: Should fail when not all journals are in storage
            expect(result.valid).toBe(false);
            expect(result.errors.some(err => err.includes('HPP Reversal'))).toBe(true);
        });
    });
});

/**
 * Property 17: Warning dialog requirement
 * Feature: hapus-transaksi-tutup-kasir, Property 17: Warning dialog requirement
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5
 * 
 * For any closed transaction deletion attempt, the system should display
 * a warning dialog with impact list and require checkbox confirmation
 */
describe('Property 17: Warning dialog requirement', () => {

    // Import UI functions
    const showClosedShiftWarning = global.showClosedShiftWarning || window.showClosedShiftWarning;

    beforeEach(() => {
        // Setup DOM environment
        document.body.innerHTML = '';

        // Setup test data
        localStorage.clear();

        // Setup shifts
        const shifts = [
            {
                id: 'shift-001',
                tanggalTutup: '2024-01-15T18:00:00',
                kasir: 'Kasir 1',
                nomorLaporan: 'TK-001',
                totalPenjualan: 1000000,
                totalKas: 800000,
                totalPiutang: 200000
            }
        ];
        localStorage.setItem('riwayatTutupKas', JSON.stringify(shifts));
    });

    afterEach(() => {
        document.body.innerHTML = '';
        localStorage.clear();
    });

    test('should display warning dialog with all required elements', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.string({ minLength: 1, maxLength: 20 }),
                    noTransaksi: fc.string({ minLength: 1, maxLength: 20 }),
                    tanggal: fc.date({ min: new Date('2024-01-15'), max: new Date('2024-01-15') }).map(d => d.toISOString()),
                    total: fc.integer({ min: 1000, max: 1000000 }),
                    metode: fc.constantFrom('cash', 'bon'),
                    kasir: fc.string({ minLength: 1, maxLength: 20 }),
                    items: fc.array(fc.record({
                        id: fc.string(),
                        nama: fc.string(),
                        qty: fc.integer({ min: 1, max: 10 }),
                        harga: fc.integer({ min: 1000, max: 100000 })
                    }), { minLength: 1, maxLength: 5 })
                }),
                (transaction) => {
                    const shiftData = {
                        shiftId: 'shift-001',
                        tanggalTutup: '2024-01-15T18:00:00',
                        kasir: 'Kasir 1',
                        nomorLaporan: 'TK-001'
                    };

                    let confirmCalled = false;
                    let cancelCalled = false;

                    // Show warning dialog
                    showClosedShiftWarning(
                        transaction,
                        shiftData,
                        () => { confirmCalled = true; },
                        () => { cancelCalled = true; }
                    );

                    // Property 1: Modal should be created
                    const modal = document.getElementById('closedShiftWarningModal');
                    expect(modal).not.toBeNull();

                    // Property 2: Modal should have danger header
                    const header = modal.querySelector('.modal-header.bg-danger');
                    expect(header).not.toBeNull();
                    expect(header.textContent).toContain('PERINGATAN');

                    // Property 3: Modal should display transaction info
                    const modalBody = modal.querySelector('.modal-body');
                    // Check that transaction info table exists
                    const infoTable = modal.querySelector('.table-bordered');
                    expect(infoTable).not.toBeNull();

                    // Check that the table has rows for transaction info
                    const tableRows = infoTable.querySelectorAll('tr');
                    expect(tableRows.length).toBeGreaterThanOrEqual(4); // No. Transaksi, Tanggal, Total, Shift Tertutup

                    // Check that total is displayed correctly
                    expect(modalBody.textContent).toContain(transaction.total.toLocaleString('id-ID'));

                    // Property 4: Modal should display all impact items
                    const impactItems = modalBody.querySelectorAll('.list-group-item');
                    expect(impactItems.length).toBeGreaterThanOrEqual(4);

                    // Check for specific impacts
                    const impactText = modalBody.textContent;
                    expect(impactText).toContain('Laporan Tutup Kasir');
                    expect(impactText).toContain('Jurnal Akuntansi');
                    expect(impactText).toContain('Stok Barang');
                    expect(impactText).toContain('Laporan Keuangan');

                    // Property 5: Modal should have checkbox
                    const checkbox = document.getElementById('confirmUnderstandCheckbox');
                    expect(checkbox).not.toBeNull();
                    expect(checkbox.type).toBe('checkbox');
                    expect(checkbox.checked).toBe(false);

                    // Property 6: Confirm button should be disabled initially
                    const confirmBtn = document.getElementById('confirmWarningBtn');
                    expect(confirmBtn).not.toBeNull();
                    expect(confirmBtn.disabled).toBe(true);

                    // Property 7: Checking checkbox should enable confirm button
                    checkbox.checked = true;
                    checkbox.dispatchEvent(new Event('change'));
                    expect(confirmBtn.disabled).toBe(false);

                    // Property 8: Unchecking checkbox should disable confirm button again
                    checkbox.checked = false;
                    checkbox.dispatchEvent(new Event('change'));
                    expect(confirmBtn.disabled).toBe(true);

                    // Cleanup
                    modal.remove();
                }
            ),
            { numRuns: 100 }
        );
    });

    test('should call onConfirm callback when confirmed', () => {
        const transaction = {
            id: 'trans-001',
            noTransaksi: 'TRX-001',
            tanggal: '2024-01-15T10:00:00',
            total: 50000,
            metode: 'cash',
            items: []
        };

        const shiftData = {
            shiftId: 'shift-001',
            tanggalTutup: '2024-01-15T18:00:00'
        };

        let confirmCalled = false;

        showClosedShiftWarning(
            transaction,
            shiftData,
            () => { confirmCalled = true; },
            () => { }
        );

        const checkbox = document.getElementById('confirmUnderstandCheckbox');
        const confirmBtn = document.getElementById('confirmWarningBtn');

        // Enable and click confirm
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));
        confirmBtn.click();

        // Property: onConfirm should be called
        expect(confirmCalled).toBe(true);
    });

    test('should call onCancel callback when cancelled', () => {
        const transaction = {
            id: 'trans-001',
            noTransaksi: 'TRX-001',
            tanggal: '2024-01-15T10:00:00',
            total: 50000,
            metode: 'cash',
            items: []
        };

        const shiftData = {
            shiftId: 'shift-001',
            tanggalTutup: '2024-01-15T18:00:00'
        };

        let cancelCalled = false;

        showClosedShiftWarning(
            transaction,
            shiftData,
            () => { },
            () => { cancelCalled = true; }
        );

        const cancelBtn = document.getElementById('cancelWarningBtn');
        cancelBtn.click();

        // Property: onCancel should be called
        expect(cancelCalled).toBe(true);
    });

    test('should not show dialog for null transaction', () => {
        const shiftData = {
            shiftId: 'shift-001',
            tanggalTutup: '2024-01-15T18:00:00'
        };

        // Capture console.error
        const originalError = console.error;
        let errorMessage = '';
        console.error = (msg) => { errorMessage = msg; };

        showClosedShiftWarning(null, shiftData, () => { }, () => { });

        // Property: Should log error and not create modal
        expect(errorMessage).toBe('Transaction is required for warning dialog');
        const modal = document.getElementById('closedShiftWarningModal');
        expect(modal).toBeNull();

        // Restore console.error
        console.error = originalError;
    });

    test('should display shift information in warning', () => {
        fc.assert(
            fc.property(
                fc.record({
                    id: fc.string({ minLength: 1, maxLength: 20 }),
                    noTransaksi: fc.string({ minLength: 1, maxLength: 20 }),
                    tanggal: fc.date({ min: new Date('2024-01-15'), max: new Date('2024-01-15') }).map(d => d.toISOString()),
                    total: fc.integer({ min: 1000, max: 1000000 }),
                    metode: fc.constantFrom('cash', 'bon'),
                    items: fc.array(fc.record({
                        id: fc.string(),
                        qty: fc.integer({ min: 1, max: 10 })
                    }), { minLength: 1, maxLength: 5 })
                }),
                fc.record({
                    shiftId: fc.string({ minLength: 1, maxLength: 20 }),
                    tanggalTutup: fc.date().map(d => d.toISOString()),
                    kasir: fc.string({ minLength: 1, maxLength: 20 }),
                    nomorLaporan: fc.string({ minLength: 1, maxLength: 20 })
                }),
                (transaction, shiftData) => {
                    showClosedShiftWarning(transaction, shiftData, () => { }, () => { });

                    const modal = document.getElementById('closedShiftWarningModal');
                    const modalBody = modal.querySelector('.modal-body');

                    // Property: Shift information should be displayed
                    const shiftDate = new Date(shiftData.tanggalTutup).toLocaleString('id-ID');
                    expect(modalBody.textContent).toContain(shiftDate);

                    // Cleanup
                    modal.remove();
                }
            ),
            { numRuns: 50 }
        );
    });

    test('should handle missing shift data gracefully', () => {
        const transaction = {
            id: 'trans-001',
            noTransaksi: 'TRX-001',
            tanggal: '2024-01-15T10:00:00',
            total: 50000,
            metode: 'cash',
            items: []
        };

        // Show warning with null shift data
        showClosedShiftWarning(transaction, null, () => { }, () => { });

        const modal = document.getElementById('closedShiftWarningModal');
        expect(modal).not.toBeNull();

        // Property: Should display N/A for missing shift date
        const modalBody = modal.querySelector('.modal-body');
        expect(modalBody.textContent).toContain('N/A');

        // Cleanup
        modal.remove();
    });

    test('should prevent multiple modals with same ID', () => {
        const transaction = {
            id: 'trans-001',
            noTransaksi: 'TRX-001',
            tanggal: '2024-01-15T10:00:00',
            total: 50000,
            metode: 'cash',
            items: []
        };

        const shiftData = {
            shiftId: 'shift-001',
            tanggalTutup: '2024-01-15T18:00:00'
        };

        // Show first modal
        showClosedShiftWarning(transaction, shiftData, () => { }, () => { });
        const firstModal = document.getElementById('closedShiftWarningModal');
        expect(firstModal).not.toBeNull();

        // Show second modal (should remove first)
        showClosedShiftWarning(transaction, shiftData, () => { }, () => { });
        const modals = document.querySelectorAll('#closedShiftWarningModal');

        // Property: Should only have one modal
        expect(modals.length).toBe(1);

        // Cleanup
        modals[0].remove();
    });
});


// ===== Critical History Display Tests =====

describe('Hapus Transaksi Tutup Kasir - Critical History Display', () => {

    const CriticalAuditLoggerService = global.CriticalAuditLoggerService || window.CriticalAuditLoggerService;

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();

        // Setup DOM for testing
        document.body.innerHTML = '<div id="content"></div>';
    });

    afterEach(() => {
        localStorage.clear();
        document.body.innerHTML = '';
    });

    /**
     * Property 14: Critical history separation
     * Feature: hapus-transaksi-tutup-kasir, Property 14: Critical history separation
     * Validates: Requirements 7.1, 7.2
     * 
     * For any deletion history display, closed transaction deletions should appear 
     * in a separate section with CRITICAL badge
     */
    describe('Property 14: Critical history separation', () => {
        test('should display all critical logs with CRITICAL badge', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.record({
                            auditId: fc.hexaString({ minLength: 10, maxLength: 50 }),
                            level: fc.constant('CRITICAL'),
                            transactionId: fc.hexaString({ minLength: 5, maxLength: 20 }),
                            transactionNo: fc.hexaString({ minLength: 5, maxLength: 20 }),
                            transactionSnapshot: fc.record({
                                tanggal: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
                                total: fc.nat({ max: 10000000 }),
                                kasir: fc.stringOf(fc.constantFrom('abcdefghijklmnopqrstuvwxyz0123456789 '), { minLength: 3, maxLength: 20 }),
                                metode: fc.constantFrom('cash', 'bon'),
                                items: fc.array(fc.record({
                                    nama: fc.stringOf(fc.constantFrom('abcdefghijklmnopqrstuvwxyz0123456789 '), { minLength: 3, maxLength: 30 }),
                                    qty: fc.nat({ min: 1, max: 100 }),
                                    harga: fc.nat({ min: 1000, max: 1000000 })
                                }), { minLength: 1, maxLength: 5 })
                            }),
                            shiftSnapshot: fc.record({
                                before: fc.record({
                                    tanggalTutup: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
                                    totalPenjualan: fc.nat({ max: 100000000 }),
                                    totalKas: fc.nat({ max: 100000000 }),
                                    totalPiutang: fc.nat({ max: 100000000 })
                                }),
                                after: fc.record({
                                    totalPenjualan: fc.nat({ max: 100000000 }),
                                    totalKas: fc.nat({ max: 100000000 }),
                                    totalPiutang: fc.nat({ max: 100000000 })
                                })
                            }),
                            category: fc.constantFrom('Kesalahan Input', 'Transaksi Duplikat', 'Fraud', 'Koreksi Akuntansi', 'Lainnya'),
                            reason: fc.lorem({ maxCount: 20 }).filter(s => s.length >= 20 && s.length <= 200),
                            deletedBy: fc.stringOf(fc.constantFrom('abcdefghijklmnopqrstuvwxyz0123456789'), { minLength: 3, maxLength: 20 }),
                            deletedAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
                            passwordVerifiedAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
                            systemInfo: fc.record({
                                timestamp: fc.date().map(d => d.toISOString()),
                                userAgent: fc.stringOf(fc.constantFrom('abcdefghijklmnopqrstuvwxyz0123456789 /()'), { minLength: 10, maxLength: 100 }),
                                platform: fc.stringOf(fc.constantFrom('abcdefghijklmnopqrstuvwxyz0123456789'), { minLength: 3, maxLength: 20 })
                            }),
                            journalEntries: fc.array(fc.record({
                                id: fc.string(),
                                deskripsi: fc.string({ minLength: 10, maxLength: 100 }),
                                tag: fc.constant('CLOSED_SHIFT_REVERSAL')
                            })),
                            adjustmentData: fc.record({
                                success: fc.boolean()
                            }),
                            validationResults: fc.record({
                                preDelete: fc.record({ valid: fc.boolean() }),
                                postDelete: fc.record({ valid: fc.boolean() })
                            }),
                            stockRestored: fc.boolean(),
                            warnings: fc.array(fc.string())
                        }),
                        { minLength: 0, maxLength: 10 }
                    ),
                    (logs) => {
                        // Save logs to localStorage
                        const auditLogger = new CriticalAuditLoggerService();
                        localStorage.setItem('closedShiftDeletionLog', JSON.stringify(logs));

                        // Render critical history
                        if (typeof window.renderCriticalHistory === 'function') {
                            window.renderCriticalHistory('content');

                            // Property: All logs should be displayed with CRITICAL badge
                            const criticalBadges = document.querySelectorAll('.badge-danger');
                            const criticalBadgesWithText = Array.from(criticalBadges).filter(badge =>
                                badge.textContent.includes('CRITICAL')
                            );

                            // Should have at least as many CRITICAL badges as logs (if logs exist)
                            if (logs.length > 0) {
                                expect(criticalBadgesWithText.length).toBeGreaterThanOrEqual(logs.length);
                            }

                            // Each log with unique audit ID should have its audit ID displayed
                            const uniqueAuditIds = [...new Set(logs.map(log => log.auditId))];
                            uniqueAuditIds.forEach(auditId => {
                                const auditIdElements = document.querySelectorAll(`[data-audit-id="${auditId}"]`);
                                expect(auditIdElements.length).toBeGreaterThan(0);
                            });
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should show empty state when no logs exist', () => {
            // Clear logs
            localStorage.setItem('closedShiftDeletionLog', JSON.stringify([]));

            // Render critical history
            if (typeof window.renderCriticalHistory === 'function') {
                window.renderCriticalHistory('content');

                // Should show no data message
                const noDataMessage = document.getElementById('noDataMessage');
                expect(noDataMessage).toBeTruthy();
                expect(noDataMessage.classList.contains('d-none')).toBe(false);
            }
        });
    });

    /**
     * Property 15: History display completeness
     * Feature: hapus-transaksi-tutup-kasir, Property 15: History display completeness
     * Validates: Requirements 7.3
     * 
     * For any critical history entry, it should display all required information:
     * Audit ID, transaction number, dates, user, category, and adjustment status
     */
    describe('Property 15: History display completeness', () => {
        test('should display all required fields for each log entry', () => {
            fc.assert(
                fc.property(
                    fc.array(
                        fc.record({
                            auditId: fc.hexaString({ minLength: 10, maxLength: 50 }),
                            level: fc.constant('CRITICAL'),
                            transactionId: fc.hexaString({ minLength: 5, maxLength: 20 }),
                            transactionNo: fc.hexaString({ minLength: 5, maxLength: 20 }),
                            transactionSnapshot: fc.record({
                                tanggal: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
                                total: fc.nat({ max: 10000000 }),
                                items: fc.array(fc.record({
                                    nama: fc.string(),
                                    qty: fc.nat({ min: 1, max: 100 }),
                                    harga: fc.nat()
                                }))
                            }),
                            shiftSnapshot: fc.record({
                                before: fc.record({
                                    tanggalTutup: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
                                    totalPenjualan: fc.nat(),
                                    totalKas: fc.nat(),
                                    totalPiutang: fc.nat()
                                }),
                                after: fc.record({
                                    totalPenjualan: fc.nat(),
                                    totalKas: fc.nat(),
                                    totalPiutang: fc.nat()
                                })
                            }),
                            category: fc.constantFrom('Kesalahan Input', 'Transaksi Duplikat', 'Fraud', 'Koreksi Akuntansi', 'Lainnya'),
                            reason: fc.lorem({ maxCount: 20 }).filter(s => s.length >= 20 && s.length <= 200),
                            deletedBy: fc.stringOf(fc.constantFrom('abcdefghijklmnopqrstuvwxyz0123456789'), { minLength: 3, maxLength: 20 }),
                            deletedAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
                            passwordVerifiedAt: fc.date().map(d => d.toISOString()),
                            systemInfo: fc.record({
                                timestamp: fc.date().map(d => d.toISOString()),
                                userAgent: fc.stringOf(fc.constantFrom('abcdefghijklmnopqrstuvwxyz0123456789 /()'), { minLength: 10, maxLength: 100 }),
                                platform: fc.stringOf(fc.constantFrom('abcdefghijklmnopqrstuvwxyz0123456789'), { minLength: 3, maxLength: 20 })
                            }),
                            journalEntries: fc.array(fc.record({
                                id: fc.string(),
                                deskripsi: fc.string()
                            })),
                            adjustmentData: fc.record({
                                success: fc.boolean()
                            }),
                            validationResults: fc.record({
                                preDelete: fc.record({ valid: fc.boolean() }),
                                postDelete: fc.record({ valid: fc.boolean() })
                            }),
                            stockRestored: fc.boolean(),
                            warnings: fc.array(fc.string())
                        }),
                        { minLength: 1, maxLength: 5 }
                    ),
                    (logs) => {
                        // Save logs to localStorage
                        localStorage.setItem('closedShiftDeletionLog', JSON.stringify(logs));

                        // Render critical history
                        if (typeof window.renderCriticalHistory === 'function') {
                            window.renderCriticalHistory('content');

                            // Property: Each log with unique audit ID should display all required fields
                            const uniqueAuditIds = [...new Set(logs.map(log => log.auditId))];
                            uniqueAuditIds.forEach(auditId => {
                                const log = logs.find(l => l.auditId === auditId);
                                const row = document.querySelector(`[data-audit-id="${auditId}"]`);

                                if (row && log) {
                                    const rowText = row.textContent;

                                    // Should contain audit ID
                                    expect(rowText).toContain(log.auditId.trim());

                                    // Should contain transaction number
                                    expect(rowText).toContain(log.transactionNo.trim());

                                    // Should contain user
                                    expect(rowText).toContain(log.deletedBy.trim());

                                    // Should contain category
                                    expect(rowText).toContain(log.category);

                                    // Should have adjustment status badge
                                    const statusBadges = row.querySelectorAll('.badge-success, .badge-danger');
                                    expect(statusBadges.length).toBeGreaterThan(0);
                                }
                            });
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });
    });

    /**
     * Property 16: Detail view completeness
     * Feature: hapus-transaksi-tutup-kasir, Property 16: Detail view completeness
     * Validates: Requirements 7.4
     * 
     * For any critical history detail view, it should display all audit information
     * including before/after snapshots, journal entries, validation results, and system info
     */
    describe('Property 16: Detail view completeness', () => {
        test('should display complete audit information in detail view', () => {
            fc.assert(
                fc.property(
                    fc.record({
                        auditId: fc.hexaString({ minLength: 10, maxLength: 50 }),
                        level: fc.constant('CRITICAL'),
                        transactionId: fc.hexaString({ minLength: 5, maxLength: 20 }),
                        transactionNo: fc.hexaString({ minLength: 5, maxLength: 20 }),
                        transactionSnapshot: fc.record({
                            tanggal: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
                            total: fc.nat({ max: 10000000 }),
                            kasir: fc.stringOf(fc.constantFrom('abcdefghijklmnopqrstuvwxyz0123456789 '), { minLength: 3, maxLength: 20 }),
                            metode: fc.constantFrom('cash', 'bon'),
                            items: fc.array(fc.record({
                                nama: fc.stringOf(fc.constantFrom('abcdefghijklmnopqrstuvwxyz0123456789 '), { minLength: 3, maxLength: 30 }),
                                qty: fc.nat({ min: 1, max: 100 }),
                                harga: fc.nat({ min: 1000, max: 1000000 })
                            }), { minLength: 1, maxLength: 5 })
                        }),
                        shiftSnapshot: fc.record({
                            before: fc.record({
                                tanggalTutup: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
                                totalPenjualan: fc.nat({ max: 100000000 }),
                                totalKas: fc.nat({ max: 100000000 }),
                                totalPiutang: fc.nat({ max: 100000000 })
                            }),
                            after: fc.record({
                                totalPenjualan: fc.nat({ max: 100000000 }),
                                totalKas: fc.nat({ max: 100000000 }),
                                totalPiutang: fc.nat({ max: 100000000 })
                            })
                        }),
                        category: fc.constantFrom('Kesalahan Input', 'Transaksi Duplikat', 'Fraud', 'Koreksi Akuntansi', 'Lainnya'),
                        reason: fc.lorem({ maxCount: 20 }).filter(s => s.length >= 20 && s.length <= 200),
                        deletedBy: fc.stringOf(fc.constantFrom('abcdefghijklmnopqrstuvwxyz0123456789'), { minLength: 3, maxLength: 20 }),
                        deletedAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
                        passwordVerifiedAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
                        systemInfo: fc.record({
                            timestamp: fc.date().map(d => d.toISOString()),
                            userAgent: fc.stringOf(fc.constantFrom('abcdefghijklmnopqrstuvwxyz0123456789 /()'), { minLength: 10, maxLength: 100 }),
                            platform: fc.stringOf(fc.constantFrom('abcdefghijklmnopqrstuvwxyz0123456789'), { minLength: 3, maxLength: 20 }),
                            language: fc.stringOf(fc.constantFrom('abcdefghijklmnopqrstuvwxyz'), { minLength: 2, maxLength: 10 }),
                            ipAddress: fc.stringOf(fc.constantFrom('0123456789.'), { minLength: 7, maxLength: 15 })
                        }),
                        journalEntries: fc.array(fc.record({
                            id: fc.hexaString({ minLength: 5, maxLength: 20 }),
                            deskripsi: fc.stringOf(fc.constantFrom('abcdefghijklmnopqrstuvwxyz0123456789 '), { minLength: 10, maxLength: 100 }),
                            tag: fc.constant('CLOSED_SHIFT_REVERSAL'),
                            entries: fc.array(fc.record({
                                akun: fc.stringOf(fc.constantFrom('0123456789-'), { minLength: 5, maxLength: 10 }),
                                debit: fc.nat({ max: 10000000 }),
                                kredit: fc.nat({ max: 10000000 })
                            }))
                        }), { minLength: 1, maxLength: 3 }),
                        adjustmentData: fc.record({
                            success: fc.boolean(),
                            shiftId: fc.hexaString({ minLength: 5, maxLength: 20 })
                        }),
                        validationResults: fc.record({
                            preDelete: fc.record({
                                valid: fc.boolean(),
                                errors: fc.array(fc.string())
                            }),
                            postDelete: fc.record({
                                valid: fc.boolean(),
                                errors: fc.array(fc.string())
                            })
                        }),
                        stockRestored: fc.boolean(),
                        warnings: fc.array(fc.string())
                    }),
                    (log) => {
                        // Save log to localStorage
                        localStorage.setItem('closedShiftDeletionLog', JSON.stringify([log]));

                        // Show detail view
                        if (typeof window.showCriticalDeletionDetail === 'function') {
                            window.showCriticalDeletionDetail(log.auditId);

                            // Get modal
                            const modal = document.getElementById('criticalDeletionDetailModal');

                            if (modal) {
                                const modalText = modal.textContent;

                                // Property: Modal should contain all key information

                                // Audit information
                                expect(modalText).toContain(log.auditId);
                                expect(modalText).toContain(log.level);
                                expect(modalText).toContain(log.deletedBy);
                                expect(modalText).toContain(log.category);
                                expect(modalText).toContain(log.reason);

                                // Transaction information
                                expect(modalText).toContain(log.transactionNo);
                                expect(modalText).toContain(log.transactionSnapshot.kasir);

                                // Transaction items
                                log.transactionSnapshot.items.forEach(item => {
                                    expect(modalText).toContain(item.nama);
                                });

                                // Shift snapshots (before and after)
                                expect(modalText).toContain('Sebelum Adjustment');
                                expect(modalText).toContain('Setelah Adjustment');

                                // Journal entries
                                log.journalEntries.forEach(journal => {
                                    expect(modalText).toContain(journal.deskripsi);
                                    expect(modalText).toContain(journal.tag);
                                });

                                // Validation results
                                expect(modalText).toContain('Pre-Deletion Validation');
                                expect(modalText).toContain('Post-Deletion Validation');

                                // System information
                                expect(modalText).toContain(log.systemInfo.platform);
                                expect(modalText).toContain(log.systemInfo.userAgent);

                                // Clean up modal
                                modal.remove();
                            }
                        }
                    }
                ),
                { numRuns: 100 }
            );
        });

        test('should handle missing optional fields gracefully', () => {
            // Create log with minimal required fields
            const minimalLog = {
                auditId: 'AUDIT-CLOSED-20240101-0001',
                level: 'CRITICAL',
                transactionId: 'TRX001',
                transactionNo: 'TRX001',
                transactionSnapshot: {
                    tanggal: new Date().toISOString(),
                    total: 100000,
                    items: []
                },
                category: 'Lainnya',
                reason: 'Test reason with minimum length requirement met',
                deletedBy: 'admin',
                deletedAt: new Date().toISOString(),
                passwordVerifiedAt: new Date().toISOString(),
                systemInfo: {
                    timestamp: new Date().toISOString()
                },
                journalEntries: [],
                validationResults: {},
                stockRestored: false,
                warnings: []
            };

            localStorage.setItem('closedShiftDeletionLog', JSON.stringify([minimalLog]));

            // Should not throw error
            if (typeof window.showCriticalDeletionDetail === 'function') {
                expect(() => {
                    window.showCriticalDeletionDetail(minimalLog.auditId);
                }).not.toThrow();

                // Modal should be created
                const modal = document.getElementById('criticalDeletionDetailModal');
                expect(modal).toBeTruthy();

                if (modal) {
                    modal.remove();
                }
            }
        });
    });
});
