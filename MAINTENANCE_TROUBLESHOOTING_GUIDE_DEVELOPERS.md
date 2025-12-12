# Maintenance and Troubleshooting Guide for Developers

## Table of Contents
1. [System Architecture Overview](#system-architecture-overview)
2. [Common Issues and Solutions](#common-issues-and-solutions)
3. [Debugging Techniques](#debugging-techniques)
4. [Performance Optimization](#performance-optimization)
5. [Code Maintenance](#code-maintenance)
6. [Testing and Quality Assurance](#testing-and-quality-assurance)
7. [Monitoring and Alerting](#monitoring-and-alerting)
8. [Emergency Procedures](#emergency-procedures)

## System Architecture Overview

### Component Interaction Flow
```
User Upload → ExcelUploadManager → DataProcessor → ValidationEngine
                     ↓                    ↓              ↓
              UIManager ← ProgressTracker ← CategoryUnitManager
                     ↓                    ↓              ↓
              AuditLogger ← ErrorHandler ← BatchProcessor
                     ↓
              localStorage/IndexedDB
```

### Key Components and Responsibilities

#### ExcelUploadManager (Main Controller)
- **Purpose**: Orchestrates the entire upload workflow
- **Key Methods**: `uploadFile()`, `validateData()`, `importData()`
- **Common Issues**: Memory leaks, state management
- **Debug Points**: Session creation, progress tracking

#### ValidationEngine (Data Validation)
- **Purpose**: Multi-layer data validation
- **Key Methods**: `validateRecord()`, `validateBatch()`
- **Common Issues**: Performance with large datasets, rule conflicts
- **Debug Points**: Validation rule execution, error aggregation

#### DataProcessor (File Processing)
- **Purpose**: Parse and transform uploaded files
- **Key Methods**: `parseCSV()`, `parseExcel()`, `transformData()`
- **Common Issues**: Encoding problems, memory usage
- **Debug Points**: File parsing, data transformation

## Common Issues and Solutions

### File Upload Issues

#### Issue: Large Files Cause Browser to Freeze
```javascript
// Problem: Synchronous processing blocks UI thread
// Bad approach:
function processLargeFile(data) {
    for (let i = 0; i < data.length; i++) {
        processRecord(data[i]); // Blocks UI
    }
}

// Solution: Use chunked processing with setTimeout
function processLargeFileAsync(data, chunkSize = 100) {
    let index = 0;
    
    function processChunk() {
        const chunk = data.slice(index, index + chunkSize);
        
        chunk.forEach(record => processRecord(record));
        
        index += chunkSize;
        
        if (index < data.length) {
            // Use setTimeout to yield control back to browser
            setTimeout(processChunk, 0);
        } else {
            onProcessingComplete();
        }
    }
    
    processChunk();
}
```

#### Issue: Memory Leaks with Large Files
```javascript
// Problem: References not cleaned up
class DataProcessor {
    constructor() {
        this.cache = new Map(); // Never cleared
        this.listeners = []; // Event listeners not removed
    }
    
    // Solution: Implement proper cleanup
    cleanup() {
        // Clear caches
        this.cache.clear();
        
        // Remove event listeners
        this.listeners.forEach(listener => {
            listener.element.removeEventListener(listener.event, listener.handler);
        });
        this.listeners = [];
        
        // Clear large objects
        this.processedData = null;
        this.validationResults = null;
    }
}
```

### Validation Issues

#### Issue: Validation Performance Degradation
```javascript
// Problem: O(n²) complexity for duplicate checking
function checkDuplicates(data) {
    const duplicates = [];
    for (let i = 0; i < data.length; i++) {
        for (let j = i + 1; j < data.length; j++) {
            if (data[i].kode === data[j].kode) {
                duplicates.push({ row1: i, row2: j, kode: data[i].kode });
            }
        }
    }
    return duplicates;
}

// Solution: Use Set for O(n) complexity
function checkDuplicatesOptimized(data) {
    const seen = new Set();
    const duplicates = [];
    
    data.forEach((record, index) => {
        if (seen.has(record.kode)) {
            duplicates.push({ row: index, kode: record.kode });
        } else {
            seen.add(record.kode);
        }
    });
    
    return duplicates;
}
```

#### Issue: Inconsistent Validation Rules
```javascript
// Problem: Validation rules scattered across codebase
// Solution: Centralized validation schema
const ValidationSchema = {
    kode: {
        required: true,
        type: 'string',
        maxLength: 20,
        pattern: /^[A-Za-z0-9_-]+$/,
        unique: true,
        errorMessages: {
            required: 'Kode barang wajib diisi',
            maxLength: 'Kode maksimal 20 karakter',
            pattern: 'Kode hanya boleh huruf, angka, dash, underscore',
            unique: 'Kode barang harus unik'
        }
    },
    harga_beli: {
        required: true,
        type: 'number',
        min: 0.01,
        errorMessages: {
            required: 'Harga beli wajib diisi',
            type: 'Harga beli harus berupa angka',
            min: 'Harga beli harus positif'
        }
    }
};

class ValidationEngine {
    validateField(fieldName, value, allData = []) {
        const rules = ValidationSchema[fieldName];
        if (!rules) return { isValid: true };
        
        const errors = [];
        
        // Required check
        if (rules.required && (value === null || value === undefined || value === '')) {
            errors.push(rules.errorMessages.required);
        }
        
        // Type check
        if (value !== null && value !== undefined && value !== '') {
            if (rules.type === 'number' && isNaN(Number(value))) {
                errors.push(rules.errorMessages.type);
            }
            
            // Additional validations...
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
```

### Storage Issues

#### Issue: localStorage Quota Exceeded
```javascript
// Problem: localStorage has size limits (5-10MB)
// Solution: Implement storage management
class StorageManager {
    static getStorageUsage() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        return total;
    }
    
    static isStorageAvailable(sizeNeeded) {
        const maxSize = 5 * 1024 * 1024; // 5MB typical limit
        const currentUsage = this.getStorageUsage();
        return (currentUsage + sizeNeeded) < maxSize * 0.9; // 90% threshold
    }
    
    static cleanupOldData() {
        const keys = Object.keys(localStorage);
        const uploadSessions = keys.filter(key => key.startsWith('upload_session_'));
        
        // Sort by timestamp and remove oldest
        uploadSessions.sort((a, b) => {
            const sessionA = JSON.parse(localStorage.getItem(a));
            const sessionB = JSON.parse(localStorage.getItem(b));
            return new Date(sessionA.timestamp) - new Date(sessionB.timestamp);
        });
        
        // Remove oldest 50% if storage is full
        const toRemove = uploadSessions.slice(0, Math.floor(uploadSessions.length / 2));
        toRemove.forEach(key => localStorage.removeItem(key));
    }
}
```

## Debugging Techniques

### Debug Logging System
```javascript
class DebugLogger {
    constructor(level = 'info') {
        this.level = level;
        this.levels = { debug: 0, info: 1, warn: 2, error: 3 };
        this.logs = [];
        this.maxLogs = 1000;
    }
    
    log(level, message, data = null) {
        if (this.levels[level] >= this.levels[this.level]) {
            const logEntry = {
                timestamp: new Date().toISOString(),
                level,
                message,
                data,
                stack: new Error().stack
            };
            
            this.logs.push(logEntry);
            
            // Keep only recent logs
            if (this.logs.length > this.maxLogs) {
                this.logs = this.logs.slice(-this.maxLogs);
            }
            
            // Console output
            console[level](
                `[${logEntry.timestamp}] ${level.toUpperCase()}: ${message}`,
                data
            );
        }
    }
    
    debug(message, data) { this.log('debug', message, data); }
    info(message, data) { this.log('info', message, data); }
    warn(message, data) { this.log('warn', message, data); }
    error(message, data) { this.log('error', message, data); }
    
    exportLogs() {
        return JSON.stringify(this.logs, null, 2);
    }
    
    clearLogs() {
        this.logs = [];
    }
}

// Global debug logger
window.debugLogger = new DebugLogger(
    window.UploadConfig?.environment === 'development' ? 'debug' : 'warn'
);
```

### Performance Profiling
```javascript
class PerformanceProfiler {
    constructor() {
        this.timers = new Map();
        this.profiles = [];
    }
    
    start(label) {
        this.timers.set(label, {
            startTime: performance.now(),
            startMemory: this.getMemoryUsage()
        });
    }
    
    end(label) {
        const timer = this.timers.get(label);
        if (!timer) {
            console.warn(`Timer '${label}' not found`);
            return;
        }
        
        const endTime = performance.now();
        const endMemory = this.getMemoryUsage();
        
        const profile = {
            label,
            duration: endTime - timer.startTime,
            memoryDelta: endMemory - timer.startMemory,
            timestamp: new Date().toISOString()
        };
        
        this.profiles.push(profile);
        this.timers.delete(label);
        
        console.log(`Performance: ${label} took ${profile.duration.toFixed(2)}ms`);
        
        return profile;
    }
    
    getMemoryUsage() {
        if (performance.memory) {
            return performance.memory.usedJSHeapSize;
        }
        return 0;
    }
    
    getReport() {
        return {
            profiles: this.profiles,
            summary: {
                totalOperations: this.profiles.length,
                averageDuration: this.profiles.reduce((sum, p) => sum + p.duration, 0) / this.profiles.length,
                slowestOperation: this.profiles.reduce((max, p) => p.duration > max.duration ? p : max, { duration: 0 })
            }
        };
    }
}

// Usage example
const profiler = new PerformanceProfiler();

async function uploadFile(file) {
    profiler.start('file_upload');
    
    try {
        profiler.start('file_parsing');
        const data = await parseFile(file);
        profiler.end('file_parsing');
        
        profiler.start('validation');
        const validationResult = await validateData(data);
        profiler.end('validation');
        
        profiler.start('import');
        const importResult = await importData(data);
        profiler.end('import');
        
        return importResult;
    } finally {
        profiler.end('file_upload');
        console.log('Performance Report:', profiler.getReport());
    }
}
```
### Error Tracking and Analysis
```javascript
class ErrorAnalyzer {
    constructor() {
        this.errors = [];
        this.patterns = new Map();
    }
    
    captureError(error, context = {}) {
        const errorEntry = {
            id: this.generateId(),
            timestamp: Date.now(),
            message: error.message,
            stack: error.stack,
            type: error.constructor.name,
            context,
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        this.errors.push(errorEntry);
        this.analyzePattern(errorEntry);
        
        return errorEntry.id;
    }
    
    analyzePattern(error) {
        const key = `${error.type}:${error.message}`;
        const count = this.patterns.get(key) || 0;
        this.patterns.set(key, count + 1);
        
        // Alert if error pattern is frequent
        if (count > 5) {
            console.warn(`Frequent error pattern detected: ${key} (${count + 1} times)`);
        }
    }
    
    getErrorReport(timeRange = 3600000) { // 1 hour default
        const cutoff = Date.now() - timeRange;
        const recentErrors = this.errors.filter(e => e.timestamp > cutoff);
        
        return {
            totalErrors: recentErrors.length,
            errorsByType: this.groupBy(recentErrors, 'type'),
            topErrors: Array.from(this.patterns.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10),
            timeline: this.createTimeline(recentErrors)
        };
    }
    
    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key];
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    }
    
    createTimeline(errors) {
        const buckets = {};
        const bucketSize = 300000; // 5 minutes
        
        errors.forEach(error => {
            const bucket = Math.floor(error.timestamp / bucketSize) * bucketSize;
            buckets[bucket] = (buckets[bucket] || 0) + 1;
        });
        
        return buckets;
    }
}

// Global error analyzer
window.errorAnalyzer = new ErrorAnalyzer();

// Integrate with existing error handling
window.addEventListener('error', (event) => {
    window.errorAnalyzer.captureError(event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
});
```

## Performance Optimization

### Memory Management
```javascript
class MemoryManager {
    constructor() {
        this.memoryThreshold = 100 * 1024 * 1024; // 100MB
        this.checkInterval = 30000; // 30 seconds
        this.startMonitoring();
    }
    
    startMonitoring() {
        setInterval(() => {
            this.checkMemoryUsage();
        }, this.checkInterval);
    }
    
    checkMemoryUsage() {
        if (!performance.memory) return;
        
        const usage = performance.memory.usedJSHeapSize;
        const limit = performance.memory.jsHeapSizeLimit;
        const percentage = (usage / limit) * 100;
        
        if (usage > this.memoryThreshold) {
            console.warn(`High memory usage: ${this.formatBytes(usage)} (${percentage.toFixed(1)}%)`);
            this.triggerCleanup();
        }
    }
    
    triggerCleanup() {
        // Clear caches
        if (window.uploadManager) {
            window.uploadManager.clearCache();
        }
        
        // Clear old audit logs
        if (window.auditLogger) {
            window.auditLogger.cleanup();
        }
        
        // Force garbage collection (if available)
        if (window.gc) {
            window.gc();
        }
        
        console.log('Memory cleanup triggered');
    }
    
    formatBytes(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
}

// Initialize memory manager
window.memoryManager = new MemoryManager();
```

### Batch Processing Optimization
```javascript
class OptimizedBatchProcessor {
    constructor(options = {}) {
        this.chunkSize = options.chunkSize || 100;
        this.maxConcurrent = options.maxConcurrent || 3;
        this.delayBetweenChunks = options.delayBetweenChunks || 10;
        this.activeProcesses = 0;
    }
    
    async processBatch(data, processor) {
        const chunks = this.createChunks(data, this.chunkSize);
        const results = [];
        
        // Process chunks with concurrency control
        for (let i = 0; i < chunks.length; i += this.maxConcurrent) {
            const batch = chunks.slice(i, i + this.maxConcurrent);
            const batchPromises = batch.map(chunk => this.processChunk(chunk, processor));
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            
            // Yield control to browser
            if (i + this.maxConcurrent < chunks.length) {
                await this.delay(this.delayBetweenChunks);
            }
        }
        
        return results.flat();
    }
    
    async processChunk(chunk, processor) {
        this.activeProcesses++;
        
        try {
            const result = await processor(chunk);
            return result;
        } finally {
            this.activeProcesses--;
        }
    }
    
    createChunks(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    getStatus() {
        return {
            activeProcesses: this.activeProcesses,
            chunkSize: this.chunkSize,
            maxConcurrent: this.maxConcurrent
        };
    }
}
```

## Code Maintenance

### Code Quality Checks
```javascript
// eslint configuration for code quality
module.exports = {
    env: {
        browser: true,
        es2021: true
    },
    extends: [
        'eslint:recommended'
    ],
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module'
    },
    rules: {
        // Performance rules
        'no-console': 'warn',
        'no-debugger': 'error',
        'no-unused-vars': 'error',
        
        // Memory leak prevention
        'no-global-assign': 'error',
        'no-implicit-globals': 'error',
        
        // Code quality
        'complexity': ['warn', 10],
        'max-depth': ['warn', 4],
        'max-lines-per-function': ['warn', 50],
        'max-params': ['warn', 4]
    }
};
```

### Automated Testing Setup
```javascript
// jest.config.js
module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    collectCoverageFrom: [
        'js/upload-excel/**/*.js',
        '!js/upload-excel/**/*.test.js'
    ],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        }
    },
    testMatch: [
        '**/__tests__/**/*.test.js'
    ]
};

// Automated test runner
const { execSync } = require('child_process');

function runQualityChecks() {
    console.log('Running code quality checks...');
    
    try {
        // ESLint
        execSync('npx eslint js/upload-excel/**/*.js', { stdio: 'inherit' });
        
        // Tests
        execSync('npm test', { stdio: 'inherit' });
        
        // Coverage check
        execSync('npm run test:coverage', { stdio: 'inherit' });
        
        console.log('✅ All quality checks passed');
    } catch (error) {
        console.error('❌ Quality checks failed');
        process.exit(1);
    }
}

// Run before deployment
if (require.main === module) {
    runQualityChecks();
}
```

### Dependency Management
```javascript
// package.json security audit
{
  "scripts": {
    "audit": "npm audit --audit-level moderate",
    "audit:fix": "npm audit fix",
    "outdated": "npm outdated",
    "update:check": "npm-check-updates",
    "update:apply": "npm-check-updates -u && npm install"
  },
  "devDependencies": {
    "npm-check-updates": "^16.0.0"
  }
}

// Automated dependency checking
function checkDependencies() {
    const { execSync } = require('child_process');
    
    console.log('Checking for security vulnerabilities...');
    try {
        execSync('npm audit --audit-level moderate', { stdio: 'inherit' });
    } catch (error) {
        console.error('Security vulnerabilities found!');
        return false;
    }
    
    console.log('Checking for outdated packages...');
    try {
        const outdated = execSync('npm outdated --json', { encoding: 'utf8' });
        const packages = JSON.parse(outdated || '{}');
        
        if (Object.keys(packages).length > 0) {
            console.warn('Outdated packages found:', Object.keys(packages));
        }
    } catch (error) {
        // npm outdated returns exit code 1 when packages are outdated
    }
    
    return true;
}
```

## Testing and Quality Assurance

### Property-Based Testing Maintenance
```javascript
// Maintain property tests for correctness
const fc = require('fast-check');

// Generator for valid barang data
const validBarangArbitrary = fc.record({
    kode: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[A-Za-z0-9_-]+$/.test(s)),
    nama: fc.string({ minLength: 1, maxLength: 100 }),
    kategori: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.toLowerCase()),
    satuan: fc.string({ minLength: 1, maxLength: 20 }).map(s => s.toLowerCase()),
    harga_beli: fc.float({ min: 0.01, max: 1000000 }),
    stok: fc.float({ min: 0, max: 100000 }),
    supplier: fc.option(fc.string({ maxLength: 100 }))
});

// Property test for validation consistency
describe('Validation Properties', () => {
    test('Valid data should always pass validation', () => {
        fc.assert(fc.property(validBarangArbitrary, (barang) => {
            const validator = new ValidationEngine();
            const result = validator.validateRecord(barang, 0);
            expect(result.isValid).toBe(true);
        }));
    });
    
    test('Duplicate codes should always be detected', () => {
        fc.assert(fc.property(
            fc.array(validBarangArbitrary, { minLength: 2, maxLength: 10 }),
            (barangList) => {
                // Force duplicate
                barangList[1].kode = barangList[0].kode;
                
                const validator = new ValidationEngine();
                const result = validator.validateBatch(barangList);
                
                expect(result.errors.some(e => e.type === 'duplicate')).toBe(true);
            }
        ));
    });
});
```

### Integration Test Maintenance
```javascript
// Integration test for complete workflow
describe('Upload Workflow Integration', () => {
    let uploadManager;
    
    beforeEach(() => {
        uploadManager = new ExcelUploadManager();
        // Clear localStorage
        localStorage.clear();
    });
    
    afterEach(() => {
        // Cleanup
        uploadManager.cleanup();
    });
    
    test('Complete upload workflow with valid data', async () => {
        // Create test file
        const csvContent = 'kode,nama,kategori,satuan,harga_beli,stok\nTEST001,Test Product,test,pcs,1000,10';
        const file = new File([csvContent], 'test.csv', { type: 'text/csv' });
        
        // Upload
        const uploadResult = await uploadManager.uploadFile(file);
        expect(uploadResult.success).toBe(true);
        
        // Validate
        const validationResult = await uploadManager.validateData(uploadResult.data);
        expect(validationResult.isValid).toBe(true);
        
        // Import
        const importResult = await uploadManager.importData(uploadResult.data);
        expect(importResult.success).toBe(true);
        expect(importResult.created).toBe(1);
        
        // Verify data in storage
        const storedData = JSON.parse(localStorage.getItem('koperasi_master_barang'));
        expect(storedData.data['TEST001']).toBeDefined();
    });
});
```

## Monitoring and Alerting

### Custom Metrics Collection
```javascript
class MetricsCollector {
    constructor() {
        this.metrics = new Map();
        this.startTime = Date.now();
    }
    
    increment(metric, value = 1, tags = {}) {
        const key = this.createKey(metric, tags);
        const current = this.metrics.get(key) || { count: 0, sum: 0, tags };
        
        current.count += 1;
        current.sum += value;
        current.lastUpdated = Date.now();
        
        this.metrics.set(key, current);
    }
    
    gauge(metric, value, tags = {}) {
        const key = this.createKey(metric, tags);
        this.metrics.set(key, {
            value,
            type: 'gauge',
            tags,
            lastUpdated: Date.now()
        });
    }
    
    timing(metric, duration, tags = {}) {
        const key = this.createKey(metric, tags);
        const current = this.metrics.get(key) || { 
            count: 0, 
            sum: 0, 
            min: Infinity, 
            max: -Infinity, 
            tags 
        };
        
        current.count += 1;
        current.sum += duration;
        current.min = Math.min(current.min, duration);
        current.max = Math.max(current.max, duration);
        current.avg = current.sum / current.count;
        current.lastUpdated = Date.now();
        
        this.metrics.set(key, current);
    }
    
    createKey(metric, tags) {
        const tagString = Object.entries(tags)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}:${v}`)
            .join(',');
        
        return tagString ? `${metric}|${tagString}` : metric;
    }
    
    getMetrics() {
        const result = {};
        
        for (const [key, value] of this.metrics) {
            const [metric, tagString] = key.split('|');
            
            if (!result[metric]) {
                result[metric] = [];
            }
            
            result[metric].push({
                ...value,
                metric,
                tags: tagString ? this.parseTags(tagString) : {}
            });
        }
        
        return result;
    }
    
    parseTags(tagString) {
        const tags = {};
        tagString.split(',').forEach(tag => {
            const [key, value] = tag.split(':');
            tags[key] = value;
        });
        return tags;
    }
    
    reset() {
        this.metrics.clear();
        this.startTime = Date.now();
    }
}

// Global metrics collector
window.metricsCollector = new MetricsCollector();

// Usage examples
window.metricsCollector.increment('upload.started');
window.metricsCollector.timing('upload.duration', 1500);
window.metricsCollector.gauge('memory.usage', performance.memory?.usedJSHeapSize || 0);
```

## Emergency Procedures

### System Recovery Procedures
```javascript
class EmergencyRecovery {
    static async performSystemRecovery() {
        console.log('🚨 Starting emergency system recovery...');
        
        try {
            // Step 1: Clear corrupted data
            await this.clearCorruptedData();
            
            // Step 2: Reset to safe state
            await this.resetToSafeState();
            
            // Step 3: Verify system health
            const healthCheck = await this.performHealthCheck();
            
            if (healthCheck.isHealthy) {
                console.log('✅ System recovery completed successfully');
                return { success: true, message: 'System recovered' };
            } else {
                throw new Error('Health check failed after recovery');
            }
        } catch (error) {
            console.error('❌ System recovery failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    static async clearCorruptedData() {
        const corruptedKeys = [];
        
        // Check each localStorage key for corruption
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            try {
                JSON.parse(localStorage.getItem(key));
            } catch (error) {
                corruptedKeys.push(key);
            }
        }
        
        // Remove corrupted data
        corruptedKeys.forEach(key => {
            console.warn(`Removing corrupted data: ${key}`);
            localStorage.removeItem(key);
        });
        
        console.log(`Cleared ${corruptedKeys.length} corrupted entries`);
    }
    
    static async resetToSafeState() {
        // Reset application state
        if (window.uploadManager) {
            window.uploadManager.reset();
        }
        
        // Clear caches
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(name => caches.delete(name))
            );
        }
        
        // Reset UI state
        const uploadContainer = document.getElementById('upload-container');
        if (uploadContainer) {
            uploadContainer.innerHTML = '';
            // Reinitialize UI
            window.location.reload();
        }
    }
    
    static async performHealthCheck() {
        const checks = {
            localStorage: this.checkLocalStorage(),
            fileAPI: this.checkFileAPI(),
            dependencies: this.checkDependencies(),
            memory: this.checkMemoryUsage()
        };
        
        const results = {};
        for (const [name, check] of Object.entries(checks)) {
            try {
                results[name] = await check;
            } catch (error) {
                results[name] = { status: 'error', error: error.message };
            }
        }
        
        const isHealthy = Object.values(results).every(r => r.status === 'ok');
        
        return { isHealthy, checks: results };
    }
    
    static checkLocalStorage() {
        try {
            const testKey = 'health_check_test';
            localStorage.setItem(testKey, 'test');
            const value = localStorage.getItem(testKey);
            localStorage.removeItem(testKey);
            
            return { status: value === 'test' ? 'ok' : 'error' };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }
    
    static checkFileAPI() {
        const hasFileAPI = typeof File !== 'undefined' && 
                          typeof FileReader !== 'undefined' && 
                          typeof FileList !== 'undefined';
        
        return { status: hasFileAPI ? 'ok' : 'error' };
    }
    
    static checkDependencies() {
        const required = ['Papa', 'XLSX', 'bootstrap'];
        const missing = required.filter(dep => typeof window[dep] === 'undefined');
        
        return { 
            status: missing.length === 0 ? 'ok' : 'error',
            missing 
        };
    }
    
    static checkMemoryUsage() {
        if (!performance.memory) {
            return { status: 'unknown' };
        }
        
        const usage = performance.memory.usedJSHeapSize;
        const limit = performance.memory.jsHeapSizeLimit;
        const percentage = (usage / limit) * 100;
        
        return {
            status: percentage < 90 ? 'ok' : 'warning',
            usage: percentage
        };
    }
}

// Emergency recovery button (for admin use)
function addEmergencyRecoveryButton() {
    if (window.UploadConfig?.environment !== 'development') return;
    
    const button = document.createElement('button');
    button.textContent = '🚨 Emergency Recovery';
    button.className = 'btn btn-danger btn-sm';
    button.style.position = 'fixed';
    button.style.top = '10px';
    button.style.right = '10px';
    button.style.zIndex = '9999';
    
    button.onclick = async () => {
        if (confirm('This will reset the system to a safe state. Continue?')) {
            const result = await EmergencyRecovery.performSystemRecovery();
            alert(result.success ? 'Recovery completed' : `Recovery failed: ${result.error}`);
        }
    };
    
    document.body.appendChild(button);
}

// Add recovery button in development
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addEmergencyRecoveryButton);
} else {
    addEmergencyRecoveryButton();
}
```

---

## Quick Reference Commands

### Development Commands
```bash
# Start development server
npm run dev

# Run tests
npm test
npm run test:watch
npm run test:coverage

# Code quality
npm run lint
npm run lint:fix
npm audit

# Build for production
npm run build
npm run build:analyze
```

### Debugging Commands
```javascript
// Browser console debugging
window.debugLogger.exportLogs()
window.performanceMonitor.getReport()
window.errorAnalyzer.getErrorReport()
window.metricsCollector.getMetrics()

// Emergency recovery
EmergencyRecovery.performSystemRecovery()
```

### Monitoring Queries
```javascript
// Check system health
HealthCheck.runChecks().then(console.log)

// Memory usage
console.log('Memory:', window.memoryManager.formatBytes(performance.memory?.usedJSHeapSize || 0))

// Active processes
console.log('Active uploads:', window.uploadManager?.getActiveUploads() || 0)
```

---

*This guide should be updated regularly as new issues are discovered and resolved. Keep it as a living document for the development team.*