/**
 * Basic test untuk AuditLogger tanpa Jest
 */

// Mock localStorage untuk Node.js
global.localStorage = {
    data: {},
    getItem: function(key) {
        return this.data[key] || null;
    },
    setItem: function(key, value) {
        this.data[key] = value;
    },
    clear: function() {
        this.data = {};
    }
};

// Import modules
import AuditLogger from './js/transformasi-barang/AuditLogger.js';
import { TransformationRecord, TransformationItem } from './js/transformasi-barang/DataModels.js';

async function runBasicTests() {
    console.log('Starting AuditLogger basic tests...');
    
    try {
        // Test 1: Initialize AuditLogger
        const auditLogger = new AuditLogger();
        auditLogger.initialize();
        console.log('✓ AuditLogger initialized successfully');
        
        // Test 2: Create sample transformation record
        const sourceItem = new TransformationItem({
            id: 'AQUA-DUS',
            name: 'Aqua 1L DUS',
            unit: 'dus',
            quantity: 1,
            stockBefore: 10,
            stockAfter: 9,
            baseProduct: 'AQUA-1L'
        });

        const targetItem = new TransformationItem({
            id: 'AQUA-PCS',
            name: 'Aqua 1L PCS',
            unit: 'pcs',
            quantity: 12,
            stockBefore: 50,
            stockAfter: 62,
            baseProduct: 'AQUA-1L'
        });

        const transformationRecord = new TransformationRecord({
            user: 'kasir01',
            sourceItem,
            targetItem,
            conversionRatio: 12,
            status: 'completed'
        });
        
        console.log('✓ TransformationRecord created successfully');
        
        // Test 3: Log transformation
        const logResult = await auditLogger.logTransformation(transformationRecord);
        console.log(`✓ Transformation logged: ${logResult}`);
        
        // Test 4: Get history
        const history = await auditLogger.getTransformationHistory();
        console.log(`✓ History retrieved: ${history.data.length} records`);
        
        // Test 5: Log event
        const eventResult = await auditLogger.logEvent('info', 'Test event message');
        console.log(`✓ Event logged: ${eventResult}`);
        
        // Test 6: Search logs
        const searchResults = await auditLogger.searchLogs('AQUA');
        console.log(`✓ Search completed: ${searchResults.length} results`);
        
        // Test 7: Export functionality
        const jsonExport = await auditLogger.exportTransformationHistory({}, 'json');
        console.log(`✓ JSON export completed: ${jsonExport.length} characters`);
        
        console.log('\n🎉 All basic tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run tests
runBasicTests();