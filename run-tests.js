#!/usr/bin/env node

/**
 * Custom Test Runner for ES Module Compatibility
 * Fixes Jest ES Module issues and runs all tests
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Starting Test Suite for Pembayaran Hutang Piutang...\n');

// Function to run Jest with proper ES Module flags
function runJest() {
    return new Promise((resolve, reject) => {
        const jestPath = join(__dirname, 'node_modules', '.bin', 'jest');
        const args = [
            '--experimental-vm-modules',
            '--no-cache',
            '--verbose',
            '--detectOpenHandles',
            '--forceExit'
        ];

        console.log('📋 Running Jest with ES Module support...');
        console.log(`Command: node ${args.join(' ')} ${jestPath}\n`);

        const child = spawn('node', [...args, jestPath], {
            stdio: 'inherit',
            shell: true,
            cwd: __dirname
        });

        child.on('close', (code) => {
            if (code === 0) {
                console.log('\n✅ Jest tests completed successfully!');
                resolve(code);
            } else {
                console.log(`\n❌ Jest tests failed with exit code: ${code}`);
                resolve(code); // Don't reject, continue with other tests
            }
        });

        child.on('error', (error) => {
            console.error('❌ Error running Jest:', error.message);
            resolve(1); // Don't reject, continue with other tests
        });
    });
}

// Function to run integration tests
function runIntegrationTests() {
    return new Promise((resolve) => {
        console.log('\n🔗 Running Integration Tests...');
        
        try {
            // Import and run integration test verification
            import('./verify_integration_tests_task15.js')
                .then(() => {
                    console.log('✅ Integration tests verification completed!');
                    resolve(0);
                })
                .catch((error) => {
                    console.error('❌ Integration tests failed:', error.message);
                    resolve(1);
                });
        } catch (error) {
            console.error('❌ Error running integration tests:', error.message);
            resolve(1);
        }
    });
}

// Function to run property tests verification
function runPropertyTests() {
    return new Promise((resolve) => {
        console.log('\n🎯 Running Property Tests Verification...');
        
        try {
            // Import and run property test verification
            import('./verify_property_tests.js')
                .then(() => {
                    console.log('✅ Property tests verification completed!');
                    resolve(0);
                })
                .catch((error) => {
                    console.error('❌ Property tests failed:', error.message);
                    resolve(1);
                });
        } catch (error) {
            console.error('❌ Error running property tests:', error.message);
            resolve(1);
        }
    });
}

// Main test execution
async function runAllTests() {
    console.log('🚀 Starting comprehensive test suite...\n');
    
    const results = {
        jest: 0,
        integration: 0,
        property: 0
    };

    // Run Jest tests
    results.jest = await runJest();
    
    // Run Integration tests
    results.integration = await runIntegrationTests();
    
    // Run Property tests
    results.property = await runPropertyTests();

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Jest Tests:        ${results.jest === 0 ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Integration Tests: ${results.integration === 0 ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Property Tests:    ${results.property === 0 ? '✅ PASSED' : '❌ FAILED'}`);
    console.log('='.repeat(60));

    const totalFailures = results.jest + results.integration + results.property;
    
    if (totalFailures === 0) {
        console.log('🎉 ALL TESTS PASSED! Task 17 completed successfully!');
        console.log('✅ Pembayaran Hutang Piutang module is ready for production.');
    } else {
        console.log(`⚠️  ${totalFailures} test suite(s) failed. Please review the errors above.`);
    }

    console.log('\n📝 For detailed test reports, check:');
    console.log('   - FINAL_TASK15_VERIFICATION.md');
    console.log('   - TASK15_INTEGRATION_TEST_EXECUTION_REPORT.md');
    console.log('   - integration_test_task15_summary.md');

    process.exit(totalFailures);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error.message);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run the tests
runAllTests().catch((error) => {
    console.error('❌ Fatal error running tests:', error.message);
    process.exit(1);
});