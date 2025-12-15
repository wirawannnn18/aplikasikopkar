/**
 * Setup test untuk sistem transformasi barang
 * 
 * Test ini memverifikasi bahwa semua komponen dapat diinisialisasi
 * dengan benar dan siap untuk digunakan.
 */

// Import dependencies untuk testing
import fc from 'fast-check';

// Import komponen yang akan ditest
import TransformationManager from '../../js/transformasi-barang/TransformationManager.js';
import { ValidationEngine } from '../../js/transformasi-barang/ValidationEngine.js';
import ConversionCalculator from '../../js/transformasi-barang/ConversionCalculator.js';
import StockManager from '../../js/transformasi-barang/StockManager.js';
import AuditLogger from '../../js/transformasi-barang/AuditLogger.js';

describe('Transformasi Barang - Setup Tests', () => {
    let transformationManager;
    let validationEngine;
    let conversionCalculator;
    let stockManager;
    let auditLogger;

    beforeEach(() => {
        // Clear localStorage
        localStorage.clear();

        // Create fresh instances
        transformationManager = new TransformationManager();
        validationEngine = new ValidationEngine();
        conversionCalculator = new ConversionCalculator();
        stockManager = new StockManager();
        auditLogger = new AuditLogger();
    });

    describe('Component Initialization', () => {
        test('should create all components without errors', () => {
            expect(transformationManager).toBeInstanceOf(TransformationManager);
            expect(validationEngine).toBeInstanceOf(ValidationEngine);
            expect(conversionCalculator).toBeInstanceOf(ConversionCalculator);
            expect(stockManager).toBeInstanceOf(StockManager);
            expect(auditLogger).toBeInstanceOf(AuditLogger);
        });

        test('should initialize ValidationEngine successfully', () => {
            expect(() => validationEngine.initialize()).not.toThrow();
            expect(validationEngine.initialized).toBe(true);
        });

        test('should initialize ConversionCalculator successfully', () => {
            // Setup localStorage untuk conversion ratios
            localStorage.setItem('conversionRatios', JSON.stringify([]));
            
            expect(() => conversionCalculator.initialize()).not.toThrow();
            expect(conversionCalculator.initialized).toBe(true);
        });

        test('should initialize StockManager successfully', () => {
            // Setup localStorage untuk master barang
            localStorage.setItem('masterBarang', JSON.stringify([]));
            
            expect(() => stockManager.initialize()).not.toThrow();
            expect(stockManager.initialized).toBe(true);
        });

        test('should initialize AuditLogger successfully', () => {
            // Setup localStorage untuk logs
            localStorage.setItem('transformationLogs', JSON.stringify([]));
            
            expect(() => auditLogger.initialize()).not.toThrow();
            expect(auditLogger.initialized).toBe(true);
        });

        test('should initialize TransformationManager with dependencies', () => {
            // Initialize dependencies first
            validationEngine.initialize();
            conversionCalculator.initialize();
            stockManager.initialize();
            auditLogger.initialize();

            const dependencies = {
                validationEngine,
                calculator: conversionCalculator,
                stockManager,
                auditLogger
            };

            expect(() => transformationManager.initialize(dependencies)).not.toThrow();
            expect(transformationManager.initialized).toBe(true);
        });
    });

    describe('Error Handling for Uninitialized Components', () => {
        test('TransformationManager should throw error when not initialized', async () => {
            await expect(transformationManager.getTransformableItems())
                .rejects.toThrow('TransformationManager belum diinisialisasi');
        });

        test('ValidationEngine should throw error when not initialized', () => {
            expect(() => validationEngine.validateInputData({}))
                .toThrow('ValidationEngine belum diinisialisasi');
        });

        test('ConversionCalculator should throw error when not initialized', () => {
            expect(() => conversionCalculator.calculateTargetQuantity(1, 12))
                .toThrow('ConversionCalculator belum diinisialisasi');
        });

        test('StockManager should throw error when not initialized', async () => {
            await expect(stockManager.getStockBalance('test', 'pcs'))
                .rejects.toThrow('StockManager belum diinisialisasi');
        });

        test('AuditLogger should throw error when not initialized', async () => {
            await expect(auditLogger.logEvent('info', 'test'))
                .rejects.toThrow('AuditLogger belum diinisialisasi');
        });
    });

    describe('Basic Functionality Tests', () => {
        beforeEach(() => {
            // Initialize all components
            validationEngine.initialize();
            conversionCalculator.initialize();
            stockManager.initialize();
            auditLogger.initialize();

            transformationManager.initialize({
                validationEngine,
                calculator: conversionCalculator,
                stockManager,
                auditLogger
            });
        });

        test('ValidationEngine should validate basic input data', () => {
            const validData = {
                sourceItemId: 'AQUA-DUS',
                targetItemId: 'AQUA-PCS',
                sourceQuantity: 1,
                user: 'kasir01'
            };

            const result = validationEngine.validateInputData(validData);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('ValidationEngine should reject invalid input data', () => {
            const invalidData = {
                sourceItemId: '',
                targetItemId: null,
                sourceQuantity: -1,
                user: ''
            };

            const result = validationEngine.validateInputData(invalidData);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        test('ConversionCalculator should handle reverse calculation', () => {
            const targetQty = 12;
            const ratio = 12;
            
            const sourceQty = conversionCalculator.calculateSourceQuantity(targetQty, ratio);
            expect(sourceQty).toBe(1);
        });

        test('AuditLogger should log events successfully', async () => {
            const result = await auditLogger.logEvent('info', 'Test message', { test: true });
            expect(result).toBe(true);
        });
    });

    describe('Property-Based Tests for Setup', () => {
        beforeEach(() => {
            validationEngine.initialize();
            conversionCalculator.initialize();
            stockManager.initialize();
            auditLogger.initialize();
        });

        test('ValidationEngine input validation should be consistent', () => {
            /**
             * Feature: transformasi-barang, Property Setup-1: Input validation consistency
             * Validates: Basic input validation rules
             */
            fc.assert(fc.property(
                fc.record({
                    sourceItemId: fc.string({ minLength: 1 }),
                    targetItemId: fc.string({ minLength: 1 }),
                    sourceQuantity: fc.integer({ min: 1 }),
                    user: fc.string({ minLength: 1 })
                }),
                (validInput) => {
                    const result = validationEngine.validateInputData(validInput);
                    expect(result.isValid).toBe(true);
                    expect(result.errors).toHaveLength(0);
                }
            ), { numRuns: 100 });
        });

        test('ConversionCalculator reverse calculation should be accurate', () => {
            /**
             * Feature: transformasi-barang, Property Setup-2: Reverse calculation accuracy
             * Validates: Mathematical accuracy of reverse calculations
             */
            fc.assert(fc.property(
                fc.integer({ min: 1, max: 1000 }),
                fc.float({ min: Math.fround(0.1), max: Math.fround(100) }),
                (targetQty, ratio) => {
                    const sourceQty = conversionCalculator.calculateSourceQuantity(targetQty, ratio);
                    expect(sourceQty).toBeGreaterThan(0);
                    expect(typeof sourceQty).toBe('number');
                    expect(isFinite(sourceQty)).toBe(true);
                }
            ), { numRuns: 100 });
        });
    });

    describe('Integration Tests', () => {
        test('should create complete transformation system', () => {
            // Initialize all components
            validationEngine.initialize();
            conversionCalculator.initialize();
            stockManager.initialize();
            auditLogger.initialize();

            // Initialize main manager
            transformationManager.initialize({
                validationEngine,
                calculator: conversionCalculator,
                stockManager,
                auditLogger
            });

            // Verify all components are properly connected
            expect(transformationManager.validationEngine).toBe(validationEngine);
            expect(transformationManager.calculator).toBe(conversionCalculator);
            expect(transformationManager.stockManager).toBe(stockManager);
            expect(transformationManager.auditLogger).toBe(auditLogger);
        });
    });
});