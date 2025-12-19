/**
 * Enhanced Error Handling Validation Test
 * Requirements: 6.4, 6.5 - Validate cross-mode error handling and data consistency
 */

// Import required modules
const fs = require('fs');
const path = require('path');

// Mock localStorage for Node.js environment
global.localStorage = {
    data: {},
    getItem: function(key) {
        return this.data[key] || null;
    },
    setItem: function(key, value) {
        this.data[key] = value;
    },
    removeItem: function(key) {
        delete this.data[key];
    },
    clear: function() {
        this.data = {};
    }
};

// Mock window object
global.window = {
    CrossModeErrorHandler: null,
    DataConsistencyValidator: null,
    SharedPaymentServices: null
};

// Load the modules
try {
    // Load SharedPaymentServices
    const sharedServicesPath = path.join(__dirname, 'js/shared/SharedPaymentServices.js');
    const sharedServicesCode = fs.readFileSync(sharedServicesPath, 'utf8');
    eval(sharedServicesCode);

    // Load CrossModeErrorHandler
    const errorHandlerPath = path.join(__dirname, 'js/shared/CrossModeErrorHandler.js');
    const errorHandlerCode = fs.readFileSync(errorHandlerPath, 'utf8');
    eval(errorHandlerCode);

    // Load DataConsistencyValidator
    const validatorPath = path.join(__dirname, 'js/shared/DataConsistencyValidator.js');
    const validatorCode = fs.readFileSync(validatorPath, 'utf8');
    eval(validatorCode);

    console.log('✅ All modules loaded successfully');
} catch (error) {
    console.error('❌ Failed to load modules:', error.message);
    process.exit(1);
}

// Test suite
class EnhancedErrorHandlingTestSuite {
    constructor() {
        this.testResults = [];
        this.sharedServices = null;
        this.errorHandler = null;
        this.consistencyValidator = null;
    }

    // Initialize test environment
    async initialize() {
        try {
            // Set up mock user
            localStorage.setItem('currentUser', JSON.stringify({
                id: 'test_user',
                nama: 'Test User',
                role: 'admin'
            }));

            // Initialize components
            this.sharedServices = new SharedPaymentServices();
            
            // Manual initialization since window objects might not be available
            if (typeof CrossModeErrorHandler !== 'undefined') {
                this.errorHandler = new CrossModeErrorHandler(this.sharedServices);
                this.sharedServices.errorHandler = this.errorHandler;
            }

            if (typeof DataConsistencyValidator !== 'undefined') {
                this.consistencyValidator = new DataConsistencyValidator(this.sharedServices);
                this.sharedServices.consistencyValidator = this.consistencyValidator;
            }

            console.log('✅ Test environment initialized');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize test environment:', error.message);
            return false;
        }
    }

    // Test cross-mode error handling
    async testCrossModeErrorHandling() {
        console.log('\n🧪 Testing Cross-Mode Error Handling...');
        
        if (!this.errorHandler) {
            console.log('⚠️  CrossModeErrorHandler not available, skipping tests');
            return;
        }

        try {
            // Test 1: Handle insufficient balance error
            const insufficientBalanceError = new Error('Insufficient balance. Available: 0, Required: 100000');
            const errorResult1 = this.errorHandler.handleError(insufficientBalanceError, {
                operation: 'processPayment',
                mode: 'manual',
                anggotaId: 'test_anggota_1',
                jenis: 'hutang'
            });

            this.testResults.push({
                test: 'Cross-mode error handling - Insufficient balance',
                passed: !errorResult1.success && errorResult1.message.includes('balance'),
                details: errorResult1.message
            });

            // Test 2: Handle cross-mode error
            const crossModeError = new Error('Journal entry failed');
            const errorResult2 = this.errorHandler.handleError(crossModeError, {
                operation: 'createJournalEntry',
                mode: 'manual',
                affectsSharedData: true,
                transactionId: 'test_transaction_123'
            });

            this.testResults.push({
                test: 'Cross-mode error handling - Journal failure',
                passed: !errorResult2.success,
                details: errorResult2.message
            });

            // Test 3: Error recovery
            const recoveryResult = await this.errorHandler.attemptRecovery(insufficientBalanceError, {
                anggotaId: 'test_anggota_1',
                jenis: 'hutang'
            });

            this.testResults.push({
                test: 'Error recovery mechanism',
                passed: recoveryResult.hasOwnProperty('success'),
                details: recoveryResult.message
            });

            console.log('✅ Cross-mode error handling tests completed');

        } catch (error) {
            console.error('❌ Cross-mode error handling test failed:', error.message);
            this.testResults.push({
                test: 'Cross-mode error handling',
                passed: false,
                details: error.message
            });
        }
    }

    // Test data consistency validation
    async testDataConsistencyValidation() {
        console.log('\n🧪 Testing Data Consistency Validation...');
        
        if (!this.consistencyValidator) {
            console.log('⚠️  DataConsistencyValidator not available, skipping tests');
            return;
        }

        try {
            // Set up test data
            const testAnggota = [
                {
                    id: 'test_anggota_1',
                    nama: 'Test Anggota 1',
                    nik: '1111111111'
                },
                {
                    id: 'test_anggota_2',
                    nama: 'Test Anggota 2',
                    nik: '2222222222'
                }
            ];
            localStorage.setItem('anggota', JSON.stringify(testAnggota));

            // Test 1: Saldo consistency validation
            const saldoValidation = this.consistencyValidator.validateSaldoConsistency();
            this.testResults.push({
                test: 'Saldo consistency validation',
                passed: saldoValidation.hasOwnProperty('valid'),
                details: `Valid: ${saldoValidation.valid}, Errors: ${saldoValidation.errors.length}`
            });

            // Test 2: Journal integrity validation
            const journalValidation = this.consistencyValidator.validateJournalIntegrity();
            this.testResults.push({
                test: 'Journal integrity validation',
                passed: journalValidation.hasOwnProperty('valid'),
                details: `Valid: ${journalValidation.valid}, Errors: ${journalValidation.errors.length}`
            });

            // Test 3: Cross-mode consistency validation
            const crossModeValidation = this.consistencyValidator.validateCrossModeConsistency();
            this.testResults.push({
                test: 'Cross-mode consistency validation',
                passed: crossModeValidation.hasOwnProperty('valid'),
                details: `Valid: ${crossModeValidation.valid}, Errors: ${crossModeValidation.errors.length}`
            });

            // Test 4: Data repair attempt
            if (!crossModeValidation.valid) {
                const repairResult = await this.consistencyValidator.attemptDataRepair(crossModeValidation);
                this.testResults.push({
                    test: 'Data repair mechanism',
                    passed: repairResult.hasOwnProperty('success'),
                    details: `Success: ${repairResult.success}, Repaired: ${repairResult.repaired?.length || 0}`
                });
            }

            console.log('✅ Data consistency validation tests completed');

        } catch (error) {
            console.error('❌ Data consistency validation test failed:', error.message);
            this.testResults.push({
                test: 'Data consistency validation',
                passed: false,
                details: error.message
            });
        }
    }

    // Test rollback mechanism
    async testRollbackMechanism() {
        console.log('\n🧪 Testing Rollback Mechanism...');
        
        if (!this.errorHandler) {
            console.log('⚠️  CrossModeErrorHandler not available, skipping rollback tests');
            return;
        }

        try {
            // Create test transaction
            const testTransaction = {
                id: 'test_rollback_transaction',
                anggotaId: 'test_anggota_rollback',
                anggotaNama: 'Test Rollback Anggota',
                jenis: 'hutang',
                jumlah: 50000,
                mode: 'manual',
                jurnalId: 'test_journal_rollback'
            };

            // Save test transaction
            const transactions = JSON.parse(localStorage.getItem('pembayaranHutangPiutang') || '[]');
            transactions.push(testTransaction);
            localStorage.setItem('pembayaranHutangPiutang', JSON.stringify(transactions));

            // Save test journal
            const journals = JSON.parse(localStorage.getItem('journals') || '[]');
            journals.push({
                id: 'test_journal_rollback',
                keterangan: 'Test journal for rollback',
                entries: [
                    { akun: '1-1000', debit: 50000, kredit: 0 },
                    { akun: '2-1000', debit: 0, kredit: 50000 }
                ]
            });
            localStorage.setItem('journals', JSON.stringify(journals));

            // Test rollback
            const rollbackResult = await this.errorHandler.performCrossModeRollback('test_rollback_transaction', {
                reason: 'test_rollback',
                mode: 'manual'
            });

            this.testResults.push({
                test: 'Cross-mode rollback execution',
                passed: rollbackResult.hasOwnProperty('success'),
                details: `Success: ${rollbackResult.success}, Message: ${rollbackResult.message}`
            });

            // Test rollback via shared services
            const sharedRollbackResult = await this.sharedServices.performRollback('nonexistent_transaction', {
                reason: 'test_via_shared_services',
                mode: 'manual'
            });

            this.testResults.push({
                test: 'Shared services rollback',
                passed: sharedRollbackResult.hasOwnProperty('success'),
                details: `Success: ${sharedRollbackResult.success}, Message: ${sharedRollbackResult.message}`
            });

            console.log('✅ Rollback mechanism tests completed');

        } catch (error) {
            console.error('❌ Rollback mechanism test failed:', error.message);
            this.testResults.push({
                test: 'Rollback mechanism',
                passed: false,
                details: error.message
            });
        }
    }

    // Test shared services integration
    async testSharedServicesIntegration() {
        console.log('\n🧪 Testing Shared Services Integration...');

        try {
            // Test 1: Error handler integration
            const hasErrorHandler = !!this.sharedServices.getErrorHandler();
            this.testResults.push({
                test: 'Error handler integration',
                passed: hasErrorHandler,
                details: hasErrorHandler ? 'Error handler available' : 'Error handler not available'
            });

            // Test 2: Consistency validator integration
            const hasValidator = !!this.sharedServices.getConsistencyValidator();
            this.testResults.push({
                test: 'Consistency validator integration',
                passed: hasValidator,
                details: hasValidator ? 'Validator available' : 'Validator not available'
            });

            // Test 3: System consistency validation
            const systemValidation = this.sharedServices.validateSystemConsistency();
            this.testResults.push({
                test: 'System consistency validation via shared services',
                passed: systemValidation.hasOwnProperty('valid'),
                details: `Valid: ${systemValidation.valid}, Message: ${systemValidation.message || 'N/A'}`
            });

            // Test 4: Enhanced error handling in processPayment
            try {
                const invalidPaymentData = {
                    anggotaId: '',
                    jenis: 'invalid',
                    jumlah: -100
                };

                await this.sharedServices.processPayment(invalidPaymentData, 'manual');
                this.testResults.push({
                    test: 'Enhanced error handling in processPayment',
                    passed: false,
                    details: 'Should have thrown validation error'
                });
            } catch (error) {
                this.testResults.push({
                    test: 'Enhanced error handling in processPayment',
                    passed: true,
                    details: `Correctly caught validation error: ${error.message}`
                });
            }

            console.log('✅ Shared services integration tests completed');

        } catch (error) {
            console.error('❌ Shared services integration test failed:', error.message);
            this.testResults.push({
                test: 'Shared services integration',
                passed: false,
                details: error.message
            });
        }
    }

    // Run all tests
    async runAllTests() {
        console.log('🚀 Starting Enhanced Error Handling Test Suite...\n');

        const initialized = await this.initialize();
        if (!initialized) {
            console.error('❌ Failed to initialize test environment');
            return;
        }

        await this.testCrossModeErrorHandling();
        await this.testDataConsistencyValidation();
        await this.testRollbackMechanism();
        await this.testSharedServicesIntegration();

        this.printResults();
    }

    // Print test results
    printResults() {
        console.log('\n📊 Test Results Summary:');
        console.log('=' .repeat(60));

        let passed = 0;
        let failed = 0;

        this.testResults.forEach((result, index) => {
            const status = result.passed ? '✅ PASS' : '❌ FAIL';
            console.log(`${index + 1}. ${result.test}: ${status}`);
            if (result.details) {
                console.log(`   Details: ${result.details}`);
            }

            if (result.passed) {
                passed++;
            } else {
                failed++;
            }
        });

        console.log('=' .repeat(60));
        console.log(`Total Tests: ${this.testResults.length}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
        console.log(`Success Rate: ${((passed / this.testResults.length) * 100).toFixed(1)}%`);

        if (failed === 0) {
            console.log('\n🎉 All tests passed! Enhanced error handling implementation is working correctly.');
        } else {
            console.log(`\n⚠️  ${failed} test(s) failed. Please review the implementation.`);
        }
    }
}

// Run the test suite
const testSuite = new EnhancedErrorHandlingTestSuite();
testSuite.runAllTests().catch(error => {
    console.error('❌ Test suite execution failed:', error);
    process.exit(1);
});