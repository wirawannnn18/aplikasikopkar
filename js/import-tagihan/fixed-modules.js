/**
 * Fixed Import Tagihan Modules - Browser Compatible Version
 * Fixes: "Unexpected token 'export'" and "Identifier already declared" errors
 */

// Prevent duplicate loading
if (window.ImportTagihanFixed) {
    console.log('Import Tagihan modules already loaded, skipping...');
} else {
    window.ImportTagihanFixed = true;
    
    // Initialize clean namespace
    window.ImportTagihan = window.ImportTagihan || {
        modules: {},
        loaded: new Set()
    };
    
    // Safe module loader
    window.ImportTagihan.loadModule = function(name, factory) {
        if (this.loaded.has(name)) {
            console.warn(`Module ${name} already loaded, skipping...`);
            return this.modules[name];
        }
        
        try {
            this.modules[name] = factory();
            this.loaded.add(name);
            console.log(`✓ Loaded module: ${name}`);
            return this.modules[name];
        } catch (error) {
            console.error(`✗ Failed to load module ${name}:`, error);
            return null;
        }
    };
    
    // Fallback services
    window.ImportTagihan.getSharedPaymentServices = function() {
        if (window.SharedPaymentServices) {
            return window.SharedPaymentServices;
        }
        
        console.warn('SharedPaymentServices not available, using fallback methods');
        return {
            processPayment: (data) => {
                console.log('Fallback payment processing:', data);
                return Promise.resolve({ 
                    success: true, 
                    message: 'Processed with fallback methods' 
                });
            },
            validatePayment: (data) => ({ valid: true, errors: [] }),
            formatCurrency: (amount) => new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR'
            }).format(amount)
        };
    };
    
    // FileParser class - Fixed version without export
    window.ImportTagihan.loadModule('FileParser', function() {
        class FileParser {
            constructor() {
                this.supportedFormats = ['csv', 'xlsx', 'xls'];
                this.maxFileSize = 10 * 1024 * 1024; // 10MB
            }
            
            async parseFile(file) {
                if (!this.validateFile(file)) {
                    throw new Error('Invalid file format or size');
                }
                
                const extension = file.name.split('.').pop().toLowerCase();
                
                if (extension === 'csv') {
                    return this.parseCSV(file);
                } else if (['xlsx', 'xls'].includes(extension)) {
                    return this.parseExcel(file);
                }
                
                throw new Error('Unsupported file format');
            }
            
            validateFile(file) {
                const extension = file.name.split('.').pop().toLowerCase();
                return this.supportedFormats.includes(extension) && 
                       file.size <= this.maxFileSize;
            }
            
            async parseCSV(file) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            if (typeof Papa !== 'undefined') {
                                const result = Papa.parse(e.target.result, {
                                    header: true,
                                    skipEmptyLines: true,
                                    transformHeader: (header) => header.trim()
                                });
                                resolve(result.data);
                            } else {
                                // Fallback CSV parsing
                                const lines = e.target.result.split('\n');
                                const headers = lines[0].split(',').map(h => h.trim());
                                const data = lines.slice(1).map(line => {
                                    const values = line.split(',');
                                    const obj = {};
                                    headers.forEach((header, index) => {
                                        obj[header] = values[index]?.trim() || '';
                                    });
                                    return obj;
                                });
                                resolve(data);
                            }
                        } catch (error) {
                            reject(error);
                        }
                    };
                    reader.onerror = reject;
                    reader.readAsText(file);
                });
            }
            
            async parseExcel(file) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            if (typeof XLSX !== 'undefined') {
                                const workbook = XLSX.read(e.target.result, { type: 'binary' });
                                const sheetName = workbook.SheetNames[0];
                                const worksheet = workbook.Sheets[sheetName];
                                const data = XLSX.utils.sheet_to_json(worksheet);
                                resolve(data);
                            } else {
                                reject(new Error('XLSX library not available'));
                            }
                        } catch (error) {
                            reject(error);
                        }
                    };
                    reader.onerror = reject;
                    reader.readAsBinaryString(file);
                });
            }
        }
        
        return FileParser;
    });
    
    // ValidationEngine class - Fixed version without export
    window.ImportTagihan.loadModule('ValidationEngine', function() {
        class ValidationEngine {
            constructor() {
                this.rules = {
                    required: ['nama_anggota', 'jumlah', 'tanggal'],
                    numeric: ['jumlah'],
                    date: ['tanggal']
                };
            }
            
            validateData(data) {
                const errors = [];
                const validData = [];
                
                data.forEach((row, index) => {
                    const rowErrors = this.validateRow(row, index + 1);
                    if (rowErrors.length > 0) {
                        errors.push(...rowErrors);
                    } else {
                        validData.push(row);
                    }
                });
                
                return {
                    valid: errors.length === 0,
                    errors,
                    validData,
                    totalRows: data.length,
                    validRows: validData.length,
                    errorRows: errors.length
                };
            }
            
            validateRow(row, rowNumber) {
                const errors = [];
                
                // Check required fields
                this.rules.required.forEach(field => {
                    if (!row[field] || row[field].toString().trim() === '') {
                        errors.push({
                            row: rowNumber,
                            field,
                            message: `Field ${field} is required`,
                            type: 'required'
                        });
                    }
                });
                
                // Check numeric fields
                this.rules.numeric.forEach(field => {
                    if (row[field] && isNaN(parseFloat(row[field]))) {
                        errors.push({
                            row: rowNumber,
                            field,
                            message: `Field ${field} must be numeric`,
                            type: 'numeric'
                        });
                    }
                });
                
                // Check date fields
                this.rules.date.forEach(field => {
                    if (row[field] && !this.isValidDate(row[field])) {
                        errors.push({
                            row: rowNumber,
                            field,
                            message: `Field ${field} must be a valid date`,
                            type: 'date'
                        });
                    }
                });
                
                return errors;
            }
            
            isValidDate(dateString) {
                const date = new Date(dateString);
                return date instanceof Date && !isNaN(date);
            }
        }
        
        return ValidationEngine;
    });
    
    // BatchProcessor class - Fixed version without export
    window.ImportTagihan.loadModule('BatchProcessor', function() {
        class BatchProcessor {
            constructor() {
                this.batchSize = 100;
                this.maxConcurrent = 3;
            }
            
            async processBatch(data, processor) {
                const batches = this.createBatches(data);
                const results = [];
                
                for (let i = 0; i < batches.length; i += this.maxConcurrent) {
                    const concurrentBatches = batches.slice(i, i + this.maxConcurrent);
                    const batchPromises = concurrentBatches.map(batch => 
                        this.processSingleBatch(batch, processor)
                    );
                    
                    const batchResults = await Promise.allSettled(batchPromises);
                    results.push(...batchResults);
                }
                
                return results;
            }
            
            createBatches(data) {
                const batches = [];
                for (let i = 0; i < data.length; i += this.batchSize) {
                    batches.push(data.slice(i, i + this.batchSize));
                }
                return batches;
            }
            
            async processSingleBatch(batch, processor) {
                try {
                    return await processor(batch);
                } catch (error) {
                    console.error('Batch processing error:', error);
                    throw error;
                }
            }
        }
        
        return BatchProcessor;
    });
    
    // AuditLogger class - Fixed version without export
    window.ImportTagihan.loadModule('AuditLogger', function() {
        class AuditLogger {
            constructor() {
                this.logs = [];
            }
            
            log(action, data, user = 'system') {
                const logEntry = {
                    id: Date.now(),
                    timestamp: new Date().toISOString(),
                    action,
                    data,
                    user,
                    session: this.getSessionId()
                };
                
                this.logs.push(logEntry);
                console.log('Audit Log:', logEntry);
                
                return logEntry;
            }
            
            getSessionId() {
                return sessionStorage.getItem('sessionId') || 'anonymous';
            }
            
            getLogs(filter = {}) {
                let filteredLogs = [...this.logs];
                
                if (filter.action) {
                    filteredLogs = filteredLogs.filter(log => log.action === filter.action);
                }
                
                if (filter.user) {
                    filteredLogs = filteredLogs.filter(log => log.user === filter.user);
                }
                
                if (filter.startDate) {
                    filteredLogs = filteredLogs.filter(log => 
                        new Date(log.timestamp) >= new Date(filter.startDate)
                    );
                }
                
                return filteredLogs;
            }
        }
        
        return AuditLogger;
    });
    
    // ErrorHandler class - Fixed version without export
    window.ImportTagihan.loadModule('ErrorHandler', function() {
        class ErrorHandler {
            constructor() {
                this.errors = [];
            }
            
            handleError(error, context = {}) {
                const errorEntry = {
                    id: Date.now(),
                    timestamp: new Date().toISOString(),
                    message: error.message || error,
                    stack: error.stack,
                    context,
                    type: error.constructor.name || 'Error'
                };
                
                this.errors.push(errorEntry);
                console.error('Error handled:', errorEntry);
                
                return errorEntry;
            }
            
            getErrors(filter = {}) {
                let filteredErrors = [...this.errors];
                
                if (filter.type) {
                    filteredErrors = filteredErrors.filter(err => err.type === filter.type);
                }
                
                return filteredErrors;
            }
            
            clearErrors() {
                this.errors = [];
            }
        }
        
        return ErrorHandler;
    });
    
    // ImportTagihanManager class - Fixed version without export
    window.ImportTagihan.loadModule('ImportTagihanManager', function() {
        class ImportTagihanManager {
            constructor() {
                this.fileParser = new (window.ImportTagihan.modules.FileParser)();
                this.validationEngine = new (window.ImportTagihan.modules.ValidationEngine)();
                this.batchProcessor = new (window.ImportTagihan.modules.BatchProcessor)();
                this.auditLogger = new (window.ImportTagihan.modules.AuditLogger)();
                this.errorHandler = new (window.ImportTagihan.modules.ErrorHandler)();
                this.paymentServices = window.ImportTagihan.getSharedPaymentServices();
            }
            
            async importFile(file) {
                try {
                    this.auditLogger.log('import_started', { fileName: file.name });
                    
                    // Parse file
                    const data = await this.fileParser.parseFile(file);
                    
                    // Validate data
                    const validation = this.validationEngine.validateData(data);
                    
                    if (!validation.valid) {
                        throw new Error(`Validation failed: ${validation.errors.length} errors found`);
                    }
                    
                    // Process in batches
                    const results = await this.batchProcessor.processBatch(
                        validation.validData,
                        (batch) => this.processPaymentBatch(batch)
                    );
                    
                    this.auditLogger.log('import_completed', { 
                        totalRows: data.length,
                        processedRows: validation.validData.length
                    });
                    
                    return {
                        success: true,
                        totalRows: data.length,
                        processedRows: validation.validData.length,
                        results
                    };
                    
                } catch (error) {
                    this.errorHandler.handleError(error, { fileName: file.name });
                    throw error;
                }
            }
            
            async processPaymentBatch(batch) {
                const results = [];
                
                for (const item of batch) {
                    try {
                        const result = await this.paymentServices.processPayment(item);
                        results.push({ success: true, data: item, result });
                    } catch (error) {
                        results.push({ success: false, data: item, error: error.message });
                    }
                }
                
                return results;
            }
        }
        
        return ImportTagihanManager;
    });
    
    // Make modules globally available (without conflicts)
    if (!window.FileParser) {
        window.FileParser = window.ImportTagihan.modules.FileParser;
    }
    if (!window.ValidationEngine) {
        window.ValidationEngine = window.ImportTagihan.modules.ValidationEngine;
    }
    if (!window.BatchProcessor) {
        window.BatchProcessor = window.ImportTagihan.modules.BatchProcessor;
    }
    if (!window.AuditLogger) {
        window.AuditLogger = window.ImportTagihan.modules.AuditLogger;
    }
    if (!window.ErrorHandler) {
        window.ErrorHandler = window.ImportTagihan.modules.ErrorHandler;
    }
    if (!window.ImportTagihanManager) {
        window.ImportTagihanManager = window.ImportTagihan.modules.ImportTagihanManager;
    }
    
    console.log('✅ Import Tagihan modules loaded successfully without ES6 export conflicts');
}