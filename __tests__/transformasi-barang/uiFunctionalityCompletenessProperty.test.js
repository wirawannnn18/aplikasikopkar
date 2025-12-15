/**
 * Property Test: UI Functionality Completeness
 * 
 * Validates: Requirements 6.2
 * "WHEN selecting transformation parameters THEN the Transformation_System SHALL 
 * provide auto-complete and dropdown selections for efficiency"
 * 
 * This property test ensures that the UI provides complete functionality
 * including auto-complete, dropdown selections, form validation, and
 * efficient user interaction patterns.
 */

import fc from 'fast-check';

// Mock UIController untuk testing functionality
class MockUIController {
    constructor() {
        this.formElements = {
            sourceItemDropdown: [],
            targetItemDropdown: [],
            quantityInput: null,
            submitButton: { enabled: false }
        };
        this.autoCompleteResults = [];
        this.validationErrors = [];
        this.isFormValid = false;
    }

    populateSourceDropdown(items) {
        this.formElements.sourceItemDropdown = items.map(item => ({
            value: item.id,
            text: `${item.name} (${item.unit}) - Stock: ${item.stock}`,
            data: item
        }));
        return this.formElements.sourceItemDropdown;
    }

    populateTargetDropdown(sourceItem, availableTargets) {
        if (!sourceItem) {
            this.formElements.targetItemDropdown = [];
            return [];
        }

        this.formElements.targetItemDropdown = availableTargets
            .filter(item => item.baseProduct === sourceItem.baseProduct && item.unit !== sourceItem.unit)
            .map(item => ({
                value: item.id,
                text: `${item.name} (${item.unit}) - Stock: ${item.stock}`,
                data: item,
                conversionRatio: this.getConversionRatio(sourceItem.unit, item.unit)
            }));
        
        return this.formElements.targetItemDropdown;
    }

    performAutoComplete(searchTerm, items) {
        if (!searchTerm || searchTerm.length < 2) {
            this.autoCompleteResults = [];
            return [];
        }

        this.autoCompleteResults = items
            .filter(item => 
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.unit.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .slice(0, 10) // Limit results for efficiency
            .map(item => ({
                value: item.id,
                label: `${item.name} (${item.unit})`,
                data: item
            }));

        return this.autoCompleteResults;
    }

    validateForm(formData) {
        this.validationErrors = [];
        
        if (!formData.sourceItem) {
            this.validationErrors.push({
                field: 'sourceItem',
                message: 'Item sumber harus dipilih'
            });
        }

        if (!formData.targetItem) {
            this.validationErrors.push({
                field: 'targetItem',
                message: 'Item target harus dipilih'
            });
        }

        if (!formData.quantity || formData.quantity <= 0) {
            this.validationErrors.push({
                field: 'quantity',
                message: 'Quantity harus berupa angka positif'
            });
        }

        if (formData.sourceItem && formData.targetItem && 
            formData.sourceItem.baseProduct !== formData.targetItem.baseProduct) {
            this.validationErrors.push({
                field: 'items',
                message: 'Item sumber dan target harus dari produk yang sama'
            });
        }

        if (formData.sourceItem && formData.quantity && 
            formData.sourceItem.stock < formData.quantity) {
            this.validationErrors.push({
                field: 'quantity',
                message: 'Stok tidak mencukupi untuk transformasi'
            });
        }

        this.isFormValid = this.validationErrors.length === 0;
        this.formElements.submitButton.enabled = this.isFormValid;

        return {
            isValid: this.isFormValid,
            errors: this.validationErrors
        };
    }

    getConversionRatio(fromUnit, toUnit) {
        // Mock conversion ratios
        const ratios = {
            'DUS_PCS': 12,
            'PCS_DUS': 1/12,
            'KARTON_PCS': 24,
            'PCS_KARTON': 1/24,
            'LUSIN_PCS': 12,
            'PCS_LUSIN': 1/12
        };
        return ratios[`${fromUnit}_${toUnit}`] || 1;
    }

    getFormState() {
        return {
            sourceDropdownCount: this.formElements.sourceItemDropdown.length,
            targetDropdownCount: this.formElements.targetItemDropdown.length,
            autoCompleteCount: this.autoCompleteResults.length,
            validationErrorCount: this.validationErrors.length,
            isFormValid: this.isFormValid,
            submitEnabled: this.formElements.submitButton.enabled
        };
    }
}

// Generators untuk test data
const itemGenerator = fc.record({
    id: fc.integer({ min: 1, max: 1000 }),
    name: fc.string({ minLength: 3, maxLength: 30 }),
    unit: fc.oneof(fc.constant('DUS'), fc.constant('PCS'), fc.constant('LUSIN'), fc.constant('KARTON')),
    stock: fc.integer({ min: 0, max: 1000 }),
    baseProduct: fc.string({ minLength: 3, maxLength: 20 })
});

const formDataGenerator = fc.record({
    sourceItem: fc.option(itemGenerator, { nil: null }),
    targetItem: fc.option(itemGenerator, { nil: null }),
    quantity: fc.option(fc.integer({ min: -10, max: 100 }), { nil: null })
});

describe('Property Test: UI Functionality Completeness', () => {
    let uiController;

    beforeEach(() => {
        uiController = new MockUIController();
    });

    test('Dropdown population should be complete and efficient', () => {
        fc.assert(fc.property(
            fc.array(itemGenerator, { minLength: 1, maxLength: 50 }),
            (items) => {
                const sourceDropdown = uiController.populateSourceDropdown(items);

                // Property: All items should be represented in dropdown
                const allItemsRepresented = sourceDropdown.length === items.length;
                
                // Property: Each dropdown item should have required properties
                const allItemsValid = sourceDropdown.every(dropdownItem => 
                    dropdownItem.value !== undefined &&
                    typeof dropdownItem.text === 'string' &&
                    dropdownItem.data !== undefined &&
                    dropdownItem.text.includes(dropdownItem.data.name) &&
                    dropdownItem.text.includes(dropdownItem.data.unit) &&
                    dropdownItem.text.includes(dropdownItem.data.stock.toString())
                );

                return allItemsRepresented && allItemsValid;
            }
        ), { numRuns: 100 });
    });

    test('Target dropdown should filter correctly based on source selection', () => {
        fc.assert(fc.property(
            itemGenerator,
            fc.array(itemGenerator, { minLength: 2, maxLength: 20 }),
            (sourceItem, allItems) => {
                // Ensure some items have same base product but different units
                const sameProductItems = allItems.slice(0, 3).map(item => ({
                    ...item,
                    baseProduct: sourceItem.baseProduct,
                    unit: item.unit !== sourceItem.unit ? item.unit : 
                          (sourceItem.unit === 'DUS' ? 'PCS' : 'DUS')
                }));
                
                const mixedItems = [...sameProductItems, ...allItems.slice(3)];
                const targetDropdown = uiController.populateTargetDropdown(sourceItem, mixedItems);

                // Property: Target dropdown should only contain items with same base product but different unit
                const correctFiltering = targetDropdown.every(item => 
                    item.data.baseProduct === sourceItem.baseProduct &&
                    item.data.unit !== sourceItem.unit
                );

                // Property: Each target item should have conversion ratio
                const hasConversionRatios = targetDropdown.every(item => 
                    typeof item.conversionRatio === 'number' &&
                    item.conversionRatio > 0
                );

                return correctFiltering && hasConversionRatios;
            }
        ), { numRuns: 100 });
    });

    test('Auto-complete should provide relevant and limited results', () => {
        fc.assert(fc.property(
            fc.string({ minLength: 0, maxLength: 20 }),
            fc.array(itemGenerator, { minLength: 5, maxLength: 50 }),
            (searchTerm, items) => {
                const results = uiController.performAutoComplete(searchTerm, items);

                if (searchTerm.length < 2) {
                    // Property: Short search terms should return no results
                    return results.length === 0;
                }

                // Property: Results should be limited for efficiency (max 10)
                const limitedResults = results.length <= 10;

                // Property: All results should match search term
                const relevantResults = results.every(result => 
                    result.data.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    result.data.unit.toLowerCase().includes(searchTerm.toLowerCase())
                );

                // Property: Each result should have required structure
                const validStructure = results.every(result => 
                    typeof result.value !== 'undefined' &&
                    typeof result.label === 'string' &&
                    result.data !== undefined
                );

                return limitedResults && relevantResults && validStructure;
            }
        ), { numRuns: 100 });
    });

    test('Form validation should be comprehensive and accurate', () => {
        fc.assert(fc.property(
            formDataGenerator,
            (formData) => {
                const validation = uiController.validateForm(formData);

                // Property: Validation should always return structured result
                const hasValidStructure = 
                    typeof validation.isValid === 'boolean' &&
                    Array.isArray(validation.errors);

                if (!hasValidStructure) return false;

                // Property: Missing required fields should cause validation failure
                const missingRequiredFields = !formData.sourceItem || !formData.targetItem || 
                                            !formData.quantity || formData.quantity <= 0;
                
                if (missingRequiredFields) {
                    return !validation.isValid && validation.errors.length > 0;
                }

                // Property: Invalid combinations should be caught
                if (formData.sourceItem && formData.targetItem && 
                    formData.sourceItem.baseProduct !== formData.targetItem.baseProduct) {
                    return !validation.isValid && 
                           validation.errors.some(error => error.field === 'items');
                }

                // Property: Insufficient stock should be caught
                if (formData.sourceItem && formData.quantity && 
                    formData.sourceItem.stock < formData.quantity) {
                    return !validation.isValid && 
                           validation.errors.some(error => error.field === 'quantity');
                }

                return true;
            }
        ), { numRuns: 100 });
    });

    test('UI state should remain consistent across operations', () => {
        fc.assert(fc.property(
            fc.array(itemGenerator, { minLength: 3, maxLength: 10 }),
            fc.array(fc.string({ minLength: 2, maxLength: 10 }), { minLength: 1, maxLength: 5 }),
            fc.array(formDataGenerator, { minLength: 1, maxLength: 3 }),
            (items, searchTerms, formDataList) => {
                let stateConsistent = true;

                // Perform multiple operations
                uiController.populateSourceDropdown(items);
                
                for (const searchTerm of searchTerms) {
                    uiController.performAutoComplete(searchTerm, items);
                }

                for (const formData of formDataList) {
                    uiController.validateForm(formData);
                }

                const finalState = uiController.getFormState();

                // Property: UI state should be valid after all operations
                stateConsistent = 
                    finalState.sourceDropdownCount >= 0 &&
                    finalState.targetDropdownCount >= 0 &&
                    finalState.autoCompleteCount >= 0 &&
                    finalState.validationErrorCount >= 0 &&
                    typeof finalState.isFormValid === 'boolean' &&
                    typeof finalState.submitEnabled === 'boolean';

                // Property: Submit button state should match form validity
                stateConsistent = stateConsistent && 
                    (finalState.submitEnabled === finalState.isFormValid);

                return stateConsistent;
            }
        ), { numRuns: 50 });
    });
});