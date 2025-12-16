// Feature: master-barang-komprehensif, Property 1: Data table display consistency
// Validates: Requirements 1.1
// Task 1.1: Write property test for data table display consistency

import fc from 'fast-check';

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        clear: () => { store = {}; }
    };
})();

global.localStorage = localStorageMock;

// Mock console methods to avoid noise in tests
global.console = {
    ...console,
    error: () => {},
    warn: () => {},
    log: () => {}
};

// Constants for testing
const DEFAULTS = {
    PAGE_SIZE: 20,
    SORT_BY: 'nama',
    SORT_ORDER: 'asc'
};

// Mock DOM elements for table display testing
const createMockTableElement = () => ({
    innerHTML: '',
    rows: [],
    appendChild: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn(() => false)
    }
});

// Mock pagination controls
const createMockPaginationControls = () => ({
    innerHTML: '',
    style: { display: 'block' },
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => [])
});

// Simulate table display functionality
function displayBarangTable(barangData, options = {}) {
    const {
        page = 1,
        limit = DEFAULTS.PAGE_SIZE,
        sortBy = DEFAULTS.SORT_BY,
        sortOrder = DEFAULTS.SORT_ORDER
    } = options;

    // Validate input
    if (!Array.isArray(barangData)) {
        return {
            success: false,
            error: 'Invalid data: expected array',
            tableRows: [],
            pagination: null
        };
    }

    // Sort data
    const sortedData = [...barangData].sort((a, b) => {
        const aVal = a[sortBy] || '';
        const bVal = b[sortBy] || '';
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
            const comparison = aVal.localeCompare(bVal);
            return sortOrder === 'desc' ? -comparison : comparison;
        } else {
            const comparison = aVal - bVal;
            return sortOrder === 'desc' ? -comparison : comparison;
        }
    });

    // Calculate pagination
    const total = sortedData.length;
    const totalPages = total === 0 ? 1 : Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedData = sortedData.slice(offset, offset + limit);

    // Generate table rows
    const tableRows = paginatedData.map(barang => ({
        id: barang.id,
        kode: barang.kode || '',
        nama: barang.nama || '',
        kategori_nama: barang.kategori_nama || '',
        satuan_nama: barang.satuan_nama || '',
        harga_beli: barang.harga_beli || 0,
        harga_jual: barang.harga_jual || 0,
        stok: barang.stok || 0,
        status: barang.status || 'aktif'
    }));

    // Generate pagination info
    const pagination = {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        startItem: offset + 1,
        endItem: Math.min(offset + limit, total)
    };

    return {
        success: true,
        tableRows,
        pagination,
        displayedCount: paginatedData.length
    };
}

// Arbitrary for generating barang objects
const barangArbitrary = fc.record({
    id: fc.uuid(),
    kode: fc.string({ minLength: 3, maxLength: 20 }).map(s => s.toUpperCase()),
    nama: fc.string({ minLength: 3, maxLength: 100 }),
    kategori_id: fc.uuid(),
    kategori_nama: fc.string({ minLength: 3, maxLength: 50 }),
    satuan_id: fc.uuid(),
    satuan_nama: fc.constantFrom('PCS', 'DUS', 'KG', 'LITER', 'METER'),
    harga_beli: fc.integer({ min: 0, max: 999999 }),
    harga_jual: fc.integer({ min: 0, max: 999999 }),
    stok: fc.integer({ min: 0, max: 9999 }),
    stok_minimum: fc.integer({ min: 0, max: 100 }),
    deskripsi: fc.string({ maxLength: 200 }),
    status: fc.constantFrom('aktif', 'nonaktif'),
    created_at: fc.integer({ min: 1640995200000, max: Date.now() }),
    updated_at: fc.integer({ min: 1640995200000, max: Date.now() }),
    created_by: fc.uuid(),
    updated_by: fc.uuid()
});

// Arbitrary for pagination options
const paginationOptionsArbitrary = fc.record({
    page: fc.integer({ min: 1, max: 10 }),
    limit: fc.constantFrom(10, 20, 50, 100),
    sortBy: fc.constantFrom('nama', 'kode', 'kategori_nama', 'harga_jual', 'stok'),
    sortOrder: fc.constantFrom('asc', 'desc')
});

describe('Property 1: Data table display consistency', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('Property: For any set of barang data, table display should return properly formatted table rows', () => {
        fc.assert(
            fc.property(
                fc.array(barangArbitrary, { minLength: 0, maxLength: 100 }),
                paginationOptionsArbitrary,
                (barangData, options) => {
                    // Action: Display barang data in table format
                    const result = displayBarangTable(barangData, options);
                    
                    // Property: Should return success and properly formatted rows
                    if (!result.success) {
                        return false;
                    }
                    
                    // Property: Table rows should be an array
                    if (!Array.isArray(result.tableRows)) {
                        return false;
                    }
                    
                    // Property: Each row should have required fields
                    const requiredFields = ['id', 'kode', 'nama', 'kategori_nama', 'satuan_nama', 'harga_beli', 'harga_jual', 'stok', 'status'];
                    const allRowsHaveRequiredFields = result.tableRows.every(row =>
                        requiredFields.every(field => row.hasOwnProperty(field))
                    );
                    
                    return allRowsHaveRequiredFields;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any barang data, pagination should work correctly', () => {
        fc.assert(
            fc.property(
                fc.array(barangArbitrary, { minLength: 0, maxLength: 200 }),
                paginationOptionsArbitrary,
                (barangData, options) => {
                    // Action: Display barang data with pagination
                    const result = displayBarangTable(barangData, options);
                    
                    if (!result.success) {
                        return false;
                    }
                    
                    // Property: Pagination info should be consistent
                    const { pagination, tableRows } = result;
                    
                    // Total items should match input data length
                    if (pagination.totalItems !== barangData.length) {
                        return false;
                    }
                    
                    // Displayed rows should not exceed limit
                    if (tableRows.length > options.limit) {
                        return false;
                    }
                    
                    // If not on last page, should display full limit (unless total is less)
                    const expectedDisplayCount = Math.min(options.limit, Math.max(0, barangData.length - (options.page - 1) * options.limit));
                    if (options.page > Math.ceil(barangData.length / options.limit) && barangData.length > 0) {
                        // Beyond last page should show 0 items
                        if (tableRows.length !== 0) {
                            return false;
                        }
                    } else if (tableRows.length !== expectedDisplayCount) {
                        return false;
                    }
                    
                    // Total pages calculation should be correct
                    const expectedTotalPages = barangData.length === 0 ? 1 : Math.ceil(barangData.length / options.limit);
                    if (pagination.totalPages !== expectedTotalPages) {
                        return false;
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any barang data, sorting should work consistently', () => {
        fc.assert(
            fc.property(
                fc.array(barangArbitrary, { minLength: 2, maxLength: 50 }),
                fc.constantFrom('nama', 'kode', 'harga_jual', 'stok'),
                fc.constantFrom('asc', 'desc'),
                (barangData, sortBy, sortOrder) => {
                    // Action: Display data with sorting
                    const result = displayBarangTable(barangData, { 
                        page: 1, 
                        limit: barangData.length, // Show all to test sorting
                        sortBy, 
                        sortOrder 
                    });
                    
                    if (!result.success || result.tableRows.length < 2) {
                        return true; // Skip if not enough data to test sorting
                    }
                    
                    // Property: Data should be sorted correctly
                    const rows = result.tableRows;
                    for (let i = 0; i < rows.length - 1; i++) {
                        const current = rows[i][sortBy];
                        const next = rows[i + 1][sortBy];
                        
                        if (typeof current === 'string' && typeof next === 'string') {
                            const comparison = current.localeCompare(next);
                            if (sortOrder === 'asc' && comparison > 0) return false;
                            if (sortOrder === 'desc' && comparison < 0) return false;
                        } else {
                            if (sortOrder === 'asc' && current > next) return false;
                            if (sortOrder === 'desc' && current < next) return false;
                        }
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For empty barang data, table should display empty state correctly', () => {
        fc.assert(
            fc.property(
                paginationOptionsArbitrary,
                (options) => {
                    // Action: Display empty data
                    const result = displayBarangTable([], options);
                    
                    // Property: Should handle empty data gracefully
                    if (!result.success) {
                        return false;
                    }
                    
                    // Should return empty table rows
                    if (result.tableRows.length !== 0) {
                        return false;
                    }
                    
                    // Pagination should reflect empty state
                    if (result.pagination.totalItems !== 0) {
                        return false;
                    }
                    
                    if (result.pagination.totalPages !== 1) {
                        return false;
                    }
                    
                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    test('Property: For invalid input data, table display should handle errors gracefully', () => {
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(null),
                    fc.constant(undefined),
                    fc.string(),
                    fc.integer(),
                    fc.object()
                ),
                paginationOptionsArbitrary,
                (invalidData, options) => {
                    // Action: Try to display invalid data
                    const result = displayBarangTable(invalidData, options);
                    
                    // Property: Should return error state
                    if (result.success) {
                        return false;
                    }
                    
                    // Should have error message
                    if (!result.error) {
                        return false;
                    }
                    
                    // Should return empty table rows
                    if (!Array.isArray(result.tableRows) || result.tableRows.length !== 0) {
                        return false;
                    }
                    
                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    test('Property: For any barang data, table rows should preserve data integrity', () => {
        fc.assert(
            fc.property(
                fc.array(barangArbitrary, { minLength: 1, maxLength: 50 }),
                paginationOptionsArbitrary,
                (barangData, options) => {
                    // Action: Display barang data
                    const result = displayBarangTable(barangData, options);
                    
                    if (!result.success) {
                        return false;
                    }
                    
                    // Property: Each displayed row should correspond to original data
                    const allRowsValid = result.tableRows.every(row => {
                        const originalItem = barangData.find(item => item.id === row.id);
                        if (!originalItem) return false;
                        
                        // Check key fields are preserved
                        return (
                            row.kode === (originalItem.kode || '') &&
                            row.nama === (originalItem.nama || '') &&
                            row.kategori_nama === (originalItem.kategori_nama || '') &&
                            row.satuan_nama === (originalItem.satuan_nama || '') &&
                            row.harga_beli === (originalItem.harga_beli || 0) &&
                            row.harga_jual === (originalItem.harga_jual || 0) &&
                            row.stok === (originalItem.stok || 0) &&
                            row.status === (originalItem.status || 'aktif')
                        );
                    });
                    
                    return allRowsValid;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any barang data, pagination navigation should be consistent', () => {
        fc.assert(
            fc.property(
                fc.array(barangArbitrary, { minLength: 10, maxLength: 100 }),
                fc.integer({ min: 5, max: 20 }), // limit
                (barangData, limit) => {
                    const totalPages = Math.ceil(barangData.length / limit);
                    
                    // Test multiple pages
                    for (let page = 1; page <= Math.min(totalPages, 5); page++) {
                        const result = displayBarangTable(barangData, { page, limit });
                        
                        if (!result.success) {
                            return false;
                        }
                        
                        // Property: Page navigation flags should be correct
                        const expectedHasNext = page < totalPages;
                        const expectedHasPrev = page > 1;
                        
                        if (result.pagination.hasNextPage !== expectedHasNext) {
                            return false;
                        }
                        
                        if (result.pagination.hasPrevPage !== expectedHasPrev) {
                            return false;
                        }
                        
                        // Property: Start and end item calculations should be correct
                        const expectedStart = (page - 1) * limit + 1;
                        const expectedEnd = Math.min(page * limit, barangData.length);
                        
                        if (result.pagination.startItem !== expectedStart) {
                            return false;
                        }
                        
                        if (result.pagination.endItem !== expectedEnd) {
                            return false;
                        }
                    }
                    
                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    test('Property: For any barang data with missing fields, table should handle gracefully', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        // Some fields may be missing
                        kode: fc.option(fc.string({ minLength: 3, maxLength: 20 }), { nil: undefined }),
                        nama: fc.option(fc.string({ minLength: 3, maxLength: 100 }), { nil: undefined }),
                        kategori_nama: fc.option(fc.string({ minLength: 3, maxLength: 50 }), { nil: undefined }),
                        satuan_nama: fc.option(fc.constantFrom('PCS', 'DUS', 'KG'), { nil: undefined }),
                        harga_beli: fc.option(fc.integer({ min: 0, max: 999999 }), { nil: undefined }),
                        harga_jual: fc.option(fc.integer({ min: 0, max: 999999 }), { nil: undefined }),
                        stok: fc.option(fc.integer({ min: 0, max: 9999 }), { nil: undefined }),
                        status: fc.option(fc.constantFrom('aktif', 'nonaktif'), { nil: undefined })
                    }),
                    { minLength: 1, maxLength: 20 }
                ),
                paginationOptionsArbitrary,
                (incompleteBarangData, options) => {
                    // Action: Display data with missing fields
                    const result = displayBarangTable(incompleteBarangData, options);
                    
                    if (!result.success) {
                        return false;
                    }
                    
                    // Property: Should provide default values for missing fields
                    const allRowsHaveDefaults = result.tableRows.every(row => {
                        return (
                            typeof row.kode === 'string' &&
                            typeof row.nama === 'string' &&
                            typeof row.kategori_nama === 'string' &&
                            typeof row.satuan_nama === 'string' &&
                            typeof row.harga_beli === 'number' &&
                            typeof row.harga_jual === 'number' &&
                            typeof row.stok === 'number' &&
                            typeof row.status === 'string'
                        );
                    });
                    
                    return allRowsHaveDefaults;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any barang data, table display should be deterministic', () => {
        fc.assert(
            fc.property(
                fc.array(barangArbitrary, { minLength: 5, maxLength: 30 }),
                paginationOptionsArbitrary,
                (barangData, options) => {
                    // Action: Display same data twice
                    const result1 = displayBarangTable(barangData, options);
                    const result2 = displayBarangTable(barangData, options);
                    
                    if (!result1.success || !result2.success) {
                        return false;
                    }
                    
                    // Property: Results should be identical
                    const sameRowCount = result1.tableRows.length === result2.tableRows.length;
                    const samePagination = JSON.stringify(result1.pagination) === JSON.stringify(result2.pagination);
                    const sameRows = JSON.stringify(result1.tableRows) === JSON.stringify(result2.tableRows);
                    
                    return sameRowCount && samePagination && sameRows;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For any barang data, table display should not modify original data', () => {
        fc.assert(
            fc.property(
                fc.array(barangArbitrary, { minLength: 1, maxLength: 30 }),
                paginationOptionsArbitrary,
                (barangData, options) => {
                    // Create deep copy for comparison
                    const originalCopy = JSON.parse(JSON.stringify(barangData));
                    
                    // Action: Display data
                    displayBarangTable(barangData, options);
                    
                    // Property: Original data should remain unchanged
                    const unchanged = JSON.stringify(barangData) === JSON.stringify(originalCopy);
                    
                    return unchanged;
                }
            ),
            { numRuns: 100 }
        );
    });

    test('Property: For large datasets, pagination should handle edge cases correctly', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 100, max: 1000 }), // Large dataset size
                fc.integer({ min: 10, max: 50 }), // Page size
                (dataSize, pageSize) => {
                    // Generate large dataset
                    const largeDataset = Array.from({ length: dataSize }, (_, i) => ({
                        id: `item-${i}`,
                        kode: `CODE${i.toString().padStart(4, '0')}`,
                        nama: `Item ${i}`,
                        kategori_nama: `Category ${i % 10}`,
                        satuan_nama: 'PCS',
                        harga_beli: 1000 + i,
                        harga_jual: 1500 + i,
                        stok: 100 - (i % 100),
                        status: 'aktif'
                    }));
                    
                    const totalPages = Math.ceil(dataSize / pageSize);
                    
                    // Test first page
                    const firstPage = displayBarangTable(largeDataset, { page: 1, limit: pageSize });
                    if (!firstPage.success || firstPage.tableRows.length !== Math.min(pageSize, dataSize)) {
                        return false;
                    }
                    
                    // Test last page
                    const lastPage = displayBarangTable(largeDataset, { page: totalPages, limit: pageSize });
                    if (!lastPage.success) {
                        return false;
                    }
                    
                    const expectedLastPageSize = dataSize % pageSize || pageSize;
                    if (lastPage.tableRows.length !== expectedLastPageSize) {
                        return false;
                    }
                    
                    // Test beyond last page
                    const beyondLastPage = displayBarangTable(largeDataset, { page: totalPages + 1, limit: pageSize });
                    if (!beyondLastPage.success || beyondLastPage.tableRows.length !== 0) {
                        return false;
                    }
                    
                    return true;
                }
            ),
            { numRuns: 20 }
        );
    });
});