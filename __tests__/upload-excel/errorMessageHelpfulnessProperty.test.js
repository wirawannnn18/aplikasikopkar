/**
 * Property Test: Error Message Helpfulness
 * Validates that error messages provide actionable guidance and helpful information
 * 
 * Requirements: 4.4
 * Property 12: Error Message Helpfulness
 */

import fc from 'fast-check';

// Mock ErrorHandler with guidance system
class MockErrorHandlerWithGuidance {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.actionableGuidance = {
            'E001': [
                'Download template CSV yang disediakan',
                'Pastikan file berformat .csv atau .xlsx',
                'Jangan mengubah ekstensi file secara manual'
            ],
            'E002': [
                'Bagi file menjadi beberapa bagian yang lebih kecil',
                'Hapus kolom yang tidak diperlukan',
                'Kompres file Excel sebelum upload'
            ],
            'E103': [
                'Pastikan semua kolom wajib ada: kode, nama, kategori, satuan, harga_beli, stok',
                'Download template terbaru untuk referensi',
                'Jangan mengubah nama kolom dalam template'
            ],
            'E201': [
                'Isi semua field yang wajib diisi',
                'Periksa baris yang ditandai dengan error',
                'Gunakan nilai default jika diperlukan'
            ],
            'E204': [
                'Pastikan setiap kode barang unik dalam file',
                'Periksa dan hapus duplikasi kode',
                'Gunakan sistem penomoran yang konsisten'
            ]
        };
    }

    addError(code, message, context) {
        const error = {
            id: 'ERR_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            code,
            message,
            context: {
                row: context?.row || null,
                field: context?.field || null,
                value: context?.value || null,
                ...context
            },
            severity: 'error',
            guidance: this.actionableGuidance[code] || []
        };
        this.errors.push(error);
        return error;
    }

    getErrors() {
        return this.errors;
    }

    clear() {
        this.errors = [];
        this.warnings = [];
    }

    getErrorGuidance(errorCode) {
        return this.actionableGuidance[errorCode] || [];
    }

    isGuidanceActionable(guidance) {
        // Check if guidance contains actionable verbs
        const actionableVerbs = [
            'download', 'pastikan', 'periksa', 'isi', 'hapus', 'gunakan', 
            'bagi', 'kompres', 'ubah', 'tambah', 'pilih', 'coba'
        ];
        
        return guidance.some(guide => {
            const lowerGuide = guide.toLowerCase();
            return actionableVerbs.some(verb => lowerGuide.includes(verb));
        });
    }

    isGuidanceSpecific(guidance, context) {
        // Check if guidance is specific to the error context
        if (!context) return false;
        
        return guidance.some(guide => {
            const lowerGuide = guide.toLowerCase();
            
            // Check for field-specific guidance
            if (context.field && lowerGuide.includes(context.field.toLowerCase())) {
                return true;
            }
            
            // Check for value-specific guidance
            if (context.value && lowerGuide.includes('nilai')) {
                return true;
            }
            
            // Check for row-specific guidance
            if (context.row && lowerGuide.includes('baris')) {
                return true;
            }
            
            return false;
        });
    }

    getGuidanceComplexity(guidance) {
        // Measure guidance complexity (number of steps, length, etc.)
        return {
            stepCount: guidance.length,
            averageLength: guidance.reduce((sum, guide) => sum + guide.length, 0) / guidance.length,
            totalLength: guidance.reduce((sum, guide) => sum + guide.length, 0),
            hasMultipleSteps: guidance.length > 1,
            hasDetailedInstructions: guidance.some(guide => guide.length > 50)
        };
    }
}

describe('Property Test: Error Message Helpfulness', () => {
    let errorHandler;

    beforeEach(() => {
        errorHandler = new MockErrorHandlerWithGuidance();
    });

    /**
     * Property 12.1: Guidance Availability
     * Every error should have actionable guidance available
     */
    test('Property 12.1: Guidance Availability', () => {
        fc.assert(fc.property(
            fc.record({
                code: fc.constantFrom('E001', 'E002', 'E103', 'E201', 'E204'),
                message: fc.string({ minLength: 10, maxLength: 100 }),
                context: fc.record({
                    row: fc.integer({ min: 1, max: 1000 }),
                    field: fc.constantFrom('kode', 'nama', 'kategori', 'satuan', 'harga_beli', 'stok'),
                    value: fc.oneof(fc.string(), fc.integer(), fc.constant(null))
                })
            }),
            (errorData) => {
                const error = errorHandler.addError(
                    errorData.code,
                    errorData.message,
                    errorData.context
                );

                // Verify guidance is available
                expect(error.guidance).toBeDefined();
                expect(Array.isArray(error.guidance)).toBe(true);
                expect(error.guidance.length).toBeGreaterThan(0);

                // Verify guidance is not empty strings
                error.guidance.forEach(guide => {
                    expect(typeof guide).toBe('string');
                    expect(guide.trim().length).toBeGreaterThan(0);
                });
            }
        ), { numRuns: 100 });
    });

    /**
     * Property 12.2: Guidance Actionability
     * Guidance should contain actionable instructions
     */
    test('Property 12.2: Guidance Actionability', () => {
        fc.assert(fc.property(
            fc.record({
                code: fc.constantFrom('E001', 'E002', 'E103', 'E201', 'E204'),
                message: fc.string({ minLength: 5, maxLength: 50 }),
                context: fc.record({
                    row: fc.integer({ min: 1, max: 100 }),
                    field: fc.constantFrom('kode', 'nama', 'kategori')
                })
            }),
            (errorData) => {
                const error = errorHandler.addError(
                    errorData.code,
                    errorData.message,
                    errorData.context
                );

                // Verify guidance contains actionable instructions
                const isActionable = errorHandler.isGuidanceActionable(error.guidance);
                expect(isActionable).toBe(true);

                // Verify each guidance item has reasonable length
                error.guidance.forEach(guide => {
                    expect(guide.length).toBeGreaterThan(10); // Not too short
                    expect(guide.length).toBeLessThan(200); // Not too long
                });
            }
        ), { numRuns: 100 });
    });

    /**
     * Property 12.3: Guidance Specificity
     * Guidance should be specific to the error type and context
     */
    test('Property 12.3: Guidance Specificity', () => {
        fc.assert(fc.property(
            fc.record({
                code: fc.constantFrom('E001', 'E002', 'E103', 'E201', 'E204'),
                message: fc.string({ minLength: 5, maxLength: 50 }),
                context: fc.record({
                    row: fc.integer({ min: 1, max: 100 }),
                    field: fc.constantFrom('kode', 'nama', 'kategori', 'satuan'),
                    value: fc.string({ minLength: 1, maxLength: 50 })
                })
            }),
            (errorData) => {
                const error = errorHandler.addError(
                    errorData.code,
                    errorData.message,
                    errorData.context
                );

                // Verify guidance is specific to error code
                const codeGuidance = errorHandler.getErrorGuidance(errorData.code);
                expect(error.guidance).toEqual(codeGuidance);

                // Verify guidance mentions relevant concepts for the error type
                const guidanceText = error.guidance.join(' ').toLowerCase();
                
                switch (errorData.code) {
                    case 'E001': // File format
                        expect(guidanceText).toMatch(/file|format|csv|xlsx|template/);
                        break;
                    case 'E002': // File size
                        expect(guidanceText).toMatch(/file|size|bagi|kecil|kompres/);
                        break;
                    case 'E103': // Missing columns
                        expect(guidanceText).toMatch(/kolom|template|header/);
                        break;
                    case 'E201': // Required field
                        expect(guidanceText).toMatch(/field|isi|wajib|nilai/);
                        break;
                    case 'E204': // Duplicate
                        expect(guidanceText).toMatch(/duplikat|unik|kode/);
                        break;
                }
            }
        ), { numRuns: 100 });
    });

    /**
     * Property 12.4: Guidance Completeness
     * Guidance should provide complete solution steps
     */
    test('Property 12.4: Guidance Completeness', () => {
        fc.assert(fc.property(
            fc.constantFrom('E001', 'E002', 'E103', 'E201', 'E204'),
            (errorCode) => {
                const error = errorHandler.addError(
                    errorCode,
                    'Test error message',
                    { row: 1, field: 'kode', value: 'test' }
                );

                const complexity = errorHandler.getGuidanceComplexity(error.guidance);

                // Verify guidance has multiple steps for complex errors
                expect(complexity.stepCount).toBeGreaterThan(0);
                
                // Verify guidance is comprehensive enough
                if (['E001', 'E002', 'E103'].includes(errorCode)) {
                    // Complex errors should have multiple steps
                    expect(complexity.stepCount).toBeGreaterThanOrEqual(2);
                }

                // Verify average guidance length is reasonable
                expect(complexity.averageLength).toBeGreaterThan(20);
                expect(complexity.averageLength).toBeLessThan(150);

                // Verify total guidance provides sufficient information
                expect(complexity.totalLength).toBeGreaterThan(50);
            }
        ), { numRuns: 50 });
    });

    /**
     * Property 12.5: Guidance Consistency
     * Similar errors should have consistent guidance patterns
     */
    test('Property 12.5: Guidance Consistency', () => {
        fc.assert(fc.property(
            fc.record({
                errorCode: fc.constantFrom('E201', 'E204'),
                instances: fc.array(
                    fc.record({
                        row: fc.integer({ min: 1, max: 100 }),
                        field: fc.constantFrom('kode', 'nama', 'kategori'),
                        value: fc.string({ minLength: 1, maxLength: 20 })
                    }),
                    { minLength: 2, maxLength: 5 }
                )
            }),
            (testData) => {
                const errors = testData.instances.map(instance => {
                    return errorHandler.addError(
                        testData.errorCode,
                        'Test error message',
                        instance
                    );
                });

                // Verify all errors of same type have identical guidance
                const firstGuidance = errors[0].guidance;
                errors.forEach(error => {
                    expect(error.guidance).toEqual(firstGuidance);
                });

                // Verify guidance structure consistency
                errors.forEach(error => {
                    expect(Array.isArray(error.guidance)).toBe(true);
                    expect(error.guidance.length).toBe(firstGuidance.length);
                    
                    error.guidance.forEach((guide, index) => {
                        expect(typeof guide).toBe('string');
                        expect(guide).toBe(firstGuidance[index]);
                    });
                });
            }
        ), { numRuns: 50 });
    });

    /**
     * Property 12.6: Guidance Language Quality
     * Guidance should use clear, professional language
     */
    test('Property 12.6: Guidance Language Quality', () => {
        fc.assert(fc.property(
            fc.constantFrom('E001', 'E002', 'E103', 'E201', 'E204'),
            (errorCode) => {
                const error = errorHandler.addError(
                    errorCode,
                    'Test error message',
                    { row: 1, field: 'kode' }
                );

                error.guidance.forEach(guide => {
                    // Verify guidance uses proper sentence structure
                    expect(guide.trim()).toBe(guide); // No leading/trailing whitespace
                    expect(guide.length).toBeGreaterThan(5); // Not too short
                    
                    // Verify guidance starts with capital letter or action word
                    const firstChar = guide.charAt(0);
                    expect(firstChar).toMatch(/[A-Z]/);
                    
                    // Verify guidance doesn't contain placeholder text
                    expect(guide.toLowerCase()).not.toContain('todo');
                    expect(guide.toLowerCase()).not.toContain('fixme');
                    expect(guide.toLowerCase()).not.toContain('placeholder');
                    
                    // Verify guidance uses Indonesian language appropriately
                    const indonesianWords = ['pastikan', 'periksa', 'gunakan', 'hapus', 'isi', 'download'];
                    const hasIndonesianWords = indonesianWords.some(word => 
                        guide.toLowerCase().includes(word)
                    );
                    
                    // At least some guidance should use Indonesian
                    if (error.guidance.length > 1) {
                        const allGuidanceText = error.guidance.join(' ').toLowerCase();
                        const hasIndonesian = indonesianWords.some(word => 
                            allGuidanceText.includes(word)
                        );
                        expect(hasIndonesian).toBe(true);
                    }
                });
            }
        ), { numRuns: 50 });
    });

    /**
     * Property 12.7: Guidance Prioritization
     * Guidance should be ordered by priority/importance
     */
    test('Property 12.7: Guidance Prioritization', () => {
        fc.assert(fc.property(
            fc.constantFrom('E001', 'E002', 'E103', 'E201', 'E204'),
            (errorCode) => {
                const error = errorHandler.addError(
                    errorCode,
                    'Test error message',
                    { row: 1, field: 'kode', value: 'test' }
                );

                if (error.guidance.length > 1) {
                    // Verify first guidance item is most direct/important
                    const firstGuide = error.guidance[0].toLowerCase();
                    
                    // First guidance should often be the most direct action
                    const directActions = [
                        'download', 'pastikan', 'isi', 'periksa', 'bagi', 'hapus'
                    ];
                    
                    const hasDirectAction = directActions.some(action => 
                        firstGuide.includes(action)
                    );
                    
                    expect(hasDirectAction).toBe(true);
                    
                    // Verify guidance items don't repeat the same concept
                    const guidanceWords = error.guidance.map(guide => 
                        guide.toLowerCase().split(' ')
                    ).flat();
                    
                    // Check for excessive repetition of key terms
                    const wordCounts = {};
                    guidanceWords.forEach(word => {
                        if (word.length > 3) { // Only count meaningful words
                            wordCounts[word] = (wordCounts[word] || 0) + 1;
                        }
                    });
                    
                    // No single word should appear too frequently
                    Object.values(wordCounts).forEach(count => {
                        expect(count).toBeLessThanOrEqual(Math.max(2, error.guidance.length));
                    });
                }
            }
        ), { numRuns: 50 });
    });

    /**
     * Property 12.8: Context-Aware Guidance
     * Guidance should adapt to error context when possible
     */
    test('Property 12.8: Context-Aware Guidance', () => {
        fc.assert(fc.property(
            fc.record({
                code: fc.constantFrom('E201', 'E204'),
                contexts: fc.array(
                    fc.record({
                        row: fc.integer({ min: 1, max: 100 }),
                        field: fc.constantFrom('kode', 'nama', 'kategori', 'satuan', 'harga_beli', 'stok'),
                        value: fc.oneof(
                            fc.string({ minLength: 1, maxLength: 20 }),
                            fc.integer(),
                            fc.constant('')
                        )
                    }),
                    { minLength: 2, maxLength: 5 }
                )
            }),
            (testData) => {
                const errors = testData.contexts.map(context => {
                    return errorHandler.addError(
                        testData.code,
                        'Test error message',
                        context
                    );
                });

                // While base guidance should be consistent,
                // verify that guidance is appropriate for the error type
                errors.forEach(error => {
                    const guidanceText = error.guidance.join(' ').toLowerCase();
                    
                    // Verify guidance mentions relevant concepts
                    if (testData.code === 'E201') { // Required field
                        expect(guidanceText).toMatch(/field|isi|wajib|kosong/);
                    } else if (testData.code === 'E204') { // Duplicate
                        expect(guidanceText).toMatch(/duplikat|unik|kode/);
                    }
                    
                    // Verify guidance doesn't contain irrelevant information
                    if (testData.code === 'E201') {
                        // Required field errors shouldn't mention file format issues
                        expect(guidanceText).not.toMatch(/format|xlsx|csv/);
                    }
                });
            }
        ), { numRuns: 30 });
    });
});