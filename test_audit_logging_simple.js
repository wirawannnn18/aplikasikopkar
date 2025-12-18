// Simple test runner for audit logging properties
// Run with: node test_audit_logging_simple.js

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        clear: () => { store = {}; },
        removeItem: (key) => { delete store[key]; }
    };
})();

global.localStorage = localStorageMock;

// Mock functions
global.formatRupiah = (amount) => `Rp ${amount.toLocaleString('id-ID')}`;
global.showAlert = (message, type) => console.log(`[${type}] ${message}`);
global.generateId = () => 'TEST-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
global.addJurnal = (keterangan, entries, tanggal) => console.log('Journal added:', keterangan);
global.filterTransactableAnggota = () => [];
global.validateAnggotaForHutangPiutang = () => ({ valid: true });

// Import the saveAuditLog function
import { saveAuditLog } from './js/pembayaranHutangPiutang.js';

// Test utilities
function randomString(minLen, maxLen) {
    const len = Math.floor(Math.random() * (maxLen - minLen + 1)) + minLen;
    return Math.random().toString(36).substring(2, 2 + len);
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Test Property 14: Audit log creation
function testProperty14() {
    console.log('\n🧪 Testing Property 14: Audit log creation');
    let passed = 0;
    let failed = 0;

    for (let i = 0; i < 10; i++) {
        try {
            // Setup
            localStorage.clear();
            localStorage.setItem('currentUser', JSON.stringify({ 
                id: 'U001', 
                nama: 'Test Kasir' 
            }));
            localStorage.setItem('auditLog', JSON.stringify([]));

            const paymentData = {
                anggotaId: generateUUID(),
                anggotaNama: randomString(5, 30),
                anggotaNIK: randomString(5, 15),
                jenis: randomChoice(['hutang', 'piutang']),
                jumlah: randomInt(10000, 1000000),
                keterangan: randomString(0, 50)
            };

            // Get initial count
            const auditLogsBefore = JSON.parse(localStorage.getItem('auditLog') || '[]');
            const countBefore = auditLogsBefore.length;

            // Action: Save audit log
            const action = 'PEMBAYARAN_' + paymentData.jenis.toUpperCase();
            saveAuditLog(action, paymentData);

            // Get audit logs after
            const auditLogsAfter = JSON.parse(localStorage.getItem('auditLog') || '[]');
            const countAfter = auditLogsAfter.length;

            // Find the created log
            const createdLog = auditLogsAfter.find(log => 
                log.action === action && 
                log.details.anggotaId === paymentData.anggotaId
            );

            const testPassed = countAfter === countBefore + 1 && 
                               createdLog !== undefined &&
                               createdLog.userId === 'U001' &&
                               createdLog.userName === 'Test Kasir' &&
                               createdLog.module === 'pembayaran-hutang-piutang';

            if (testPassed) {
                passed++;
            } else {
                failed++;
                console.error(`  ❌ Iteration ${i + 1} failed:`, {
                    countBefore,
                    countAfter,
                    createdLog: createdLog ? 'found' : 'not found'
                });
            }
        } catch (error) {
            failed++;
            console.error(`  ❌ Iteration ${i + 1} error:`, error.message);
        }
    }

    console.log(`  ✅ Property 14 Results: ${passed}/10 passed, ${failed}/10 failed`);
    return failed === 0;
}

// Test Property 15: Audit log completeness
function testProperty15() {
    console.log('\n🧪 Testing Property 15: Audit log completeness');
    let passed = 0;
    let failed = 0;

    for (let i = 0; i < 10; i++) {
        try {
            // Setup
            localStorage.clear();
            localStorage.setItem('currentUser', JSON.stringify({ 
                id: 'U001', 
                nama: 'Test Kasir' 
            }));
            localStorage.setItem('auditLog', JSON.stringify([]));

            const transactionData = {
                anggotaId: generateUUID(),
                anggotaNama: randomString(5, 30),
                anggotaNIK: randomString(5, 15),
                jenis: randomChoice(['hutang', 'piutang']),
                jumlah: randomInt(10000, 1000000),
                saldoSebelum: randomInt(50000, 2000000),
                saldoSesudah: randomInt(0, 1500000)
            };

            // Action: Save audit log
            const action = 'PEMBAYARAN_' + transactionData.jenis.toUpperCase();
            saveAuditLog(action, transactionData);

            // Get audit logs
            const auditLogs = JSON.parse(localStorage.getItem('auditLog') || '[]');
            const createdLog = auditLogs.find(log => 
                log.action === action && 
                log.details.anggotaId === transactionData.anggotaId
            );

            const testPassed = createdLog &&
                               createdLog.details.anggotaId === transactionData.anggotaId &&
                               createdLog.details.anggotaNama === transactionData.anggotaNama &&
                               createdLog.details.anggotaNIK === transactionData.anggotaNIK &&
                               createdLog.details.jenis === transactionData.jenis &&
                               createdLog.details.jumlah === transactionData.jumlah &&
                               createdLog.details.saldoSebelum === transactionData.saldoSebelum &&
                               createdLog.details.saldoSesudah === transactionData.saldoSesudah;

            if (testPassed) {
                passed++;
            } else {
                failed++;
                console.error(`  ❌ Iteration ${i + 1} failed: Missing required fields`);
            }
        } catch (error) {
            failed++;
            console.error(`  ❌ Iteration ${i + 1} error:`, error.message);
        }
    }

    console.log(`  ✅ Property 15 Results: ${passed}/10 passed, ${failed}/10 failed`);
    return failed === 0;
}

// Test Property 16: Error logging
function testProperty16() {
    console.log('\n🧪 Testing Property 16: Error logging');
    let passed = 0;
    let failed = 0;

    for (let i = 0; i < 10; i++) {
        try {
            // Setup
            localStorage.clear();
            localStorage.setItem('currentUser', JSON.stringify({ 
                id: 'U001', 
                nama: 'Test Kasir' 
            }));
            localStorage.setItem('auditLog', JSON.stringify([]));

            const errorData = {
                errorType: randomChoice(['VALIDATION_ERROR', 'JOURNAL_ERROR', 'SYSTEM_ERROR']),
                errorMessage: randomString(10, 50),
                transactionData: {
                    anggotaId: generateUUID(),
                    jenis: randomChoice(['hutang', 'piutang']),
                    jumlah: randomInt(1, 1000000)
                }
            };

            // Get initial count
            const auditLogsBefore = JSON.parse(localStorage.getItem('auditLog') || '[]');
            const countBefore = auditLogsBefore.length;

            // Action: Save error log
            const errorDetails = {
                error: errorData.errorMessage,
                errorType: errorData.errorType,
                transactionData: errorData.transactionData
            };
            saveAuditLog('ERROR_PEMBAYARAN', errorDetails);

            // Get audit logs after
            const auditLogsAfter = JSON.parse(localStorage.getItem('auditLog') || '[]');
            const countAfter = auditLogsAfter.length;

            // Find the error log
            const errorLog = auditLogsAfter.find(log => 
                log.action === 'ERROR_PEMBAYARAN' && 
                log.details.errorType === errorData.errorType
            );

            const testPassed = countAfter === countBefore + 1 && 
                               errorLog !== undefined &&
                               errorLog.details.error === errorData.errorMessage &&
                               errorLog.details.transactionData.anggotaId === errorData.transactionData.anggotaId;

            if (testPassed) {
                passed++;
            } else {
                failed++;
                console.error(`  ❌ Iteration ${i + 1} failed: Error log not created properly`);
            }
        } catch (error) {
            failed++;
            console.error(`  ❌ Iteration ${i + 1} error:`, error.message);
        }
    }

    console.log(`  ✅ Property 16 Results: ${passed}/10 passed, ${failed}/10 failed`);
    return failed === 0;
}

// Test Property 17: Audit log persistence
function testProperty17() {
    console.log('\n🧪 Testing Property 17: Audit log persistence');
    let passed = 0;
    let failed = 0;

    for (let i = 0; i < 10; i++) {
        try {
            // Setup
            localStorage.clear();
            localStorage.setItem('currentUser', JSON.stringify({ 
                id: 'U001', 
                nama: 'Test Kasir' 
            }));
            localStorage.setItem('auditLog', JSON.stringify([]));

            const logData = {
                action: randomChoice(['PEMBAYARAN_HUTANG', 'PEMBAYARAN_PIUTANG', 'CETAK_BUKTI_PEMBAYARAN']),
                details: {
                    anggotaId: generateUUID(),
                    anggotaNama: randomString(5, 30),
                    jumlah: randomInt(10000, 1000000)
                }
            };

            // Action: Save audit log
            saveAuditLog(logData.action, logData.details);

            // Simulate page reload by re-reading from localStorage
            const persistedLogs = JSON.parse(localStorage.getItem('auditLog') || '[]');

            // Find the saved log
            const savedLog = persistedLogs.find(log => 
                log.action === logData.action && 
                log.details.anggotaId === logData.details.anggotaId
            );

            const testPassed = savedLog !== undefined &&
                               savedLog.details.anggotaNama === logData.details.anggotaNama &&
                               savedLog.details.jumlah === logData.details.jumlah &&
                               savedLog.id !== undefined &&
                               savedLog.timestamp !== undefined;

            if (testPassed) {
                passed++;
            } else {
                failed++;
                console.error(`  ❌ Iteration ${i + 1} failed: Log not persisted properly`);
            }
        } catch (error) {
            failed++;
            console.error(`  ❌ Iteration ${i + 1} error:`, error.message);
        }
    }

    console.log(`  ✅ Property 17 Results: ${passed}/10 passed, ${failed}/10 failed`);
    return failed === 0;
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting Audit Logging Property Tests');
    console.log('==========================================');

    const results = [];
    results.push(testProperty14());
    results.push(testProperty15());
    results.push(testProperty16());
    results.push(testProperty17());

    const totalPassed = results.filter(r => r).length;
    const totalFailed = results.filter(r => !r).length;

    console.log('\n📊 FINAL RESULTS');
    console.log('==========================================');
    console.log(`✅ Properties Passed: ${totalPassed}/4`);
    console.log(`❌ Properties Failed: ${totalFailed}/4`);
    
    if (totalFailed === 0) {
        console.log('🎉 All audit logging properties PASSED!');
    } else {
        console.log('⚠️  Some audit logging properties FAILED!');
    }
}

runAllTests().catch(console.error);