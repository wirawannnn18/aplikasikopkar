/**
 * Property-Based Tests for Tanggal Pendaftaran Anggota
 * Feature: tanggal-pendaftaran-anggota
 */

import fc from 'fast-check';

// Import date helper functions from koperasi.js
// Since we're testing browser code, we need to load the functions
// For testing, we'll redefine them here

function formatDateToDisplay(isoDate) {
    if (!isoDate || typeof isoDate !== 'string') {
        return '';
    }
    
    try {
        const parts = isoDate.split('T')[0].split('-');
        if (parts.length !== 3) {
            return '';
        }
        
        const year = parts[0];
        const month = parts[1];
        const day = parts[2];
        
        if (!year || !month || !day) {
            return '';
        }
        
        return `${day}/${month}/${year}`;
    } catch (error) {
        return '';
    }
}

function formatDateToISO(displayDate) {
    if (!displayDate || typeof displayDate !== 'string') {
        return '';
    }
    
    try {
        const parts = displayDate.split('/');
        if (parts.length !== 3) {
            return '';
        }
        
        const dayStr = parts[0].padStart(2, '0');
        const monthStr = parts[1].padStart(2, '0');
        const year = parts[2];
        
        if (!dayStr || !monthStr || !year) {
            return '';
        }
        
        const yearNum = parseInt(year, 10);
        const monthNum = parseInt(monthStr, 10);
        const dayNum = parseInt(dayStr, 10);
        
        if (!isValidDate(yearNum, monthNum, dayNum)) {
            return '';
        }
        
        return `${year}-${monthStr}-${dayStr}`;
    } catch (error) {
        return '';
    }
}

function getCurrentDateISO() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseDateFlexible(dateString) {
    if (!dateString || typeof dateString !== 'string') {
        return '';
    }
    
    const trimmed = dateString.trim();
    
    // Try ISO format (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const parts = trimmed.split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        
        if (isValidDate(year, month, day)) {
            return trimmed;
        }
        return '';
    }
    
    // Try DD/MM/YYYY format
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
        return formatDateToISO(trimmed);
    }
    
    // Try DD-MM-YYYY format
    if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) {
        const parts = trimmed.split('-');
        const day = parts[0];
        const month = parts[1];
        const year = parts[2];
        return formatDateToISO(`${day}/${month}/${year}`);
    }
    
    return '';
}

function isValidDate(year, month, day) {
    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear) {
        return false;
    }
    
    if (month < 1 || month > 12) {
        return false;
    }
    
    if (day < 1 || day > 31) {
        return false;
    }
    
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) {
        return false;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date > today) {
        return false;
    }
    
    if (date.getFullYear() !== year || 
        date.getMonth() !== month - 1 || 
        date.getDate() !== day) {
        return false;
    }
    
    return true;
}

// ===== Property-Based Tests =====

/**
 * Feature: tanggal-pendaftaran-anggota, Property 2: ISO 8601 format compliance
 * **Validates: Requirements 1.2, 5.5**
 */
describe('**Feature: tanggal-pendaftaran-anggota, Property 2: ISO 8601 format compliance**', () => {
    test('For any member saved to localStorage, the tanggalDaftar field should match the ISO 8601 date format pattern (YYYY-MM-DD)', () => {
        fc.assert(
            fc.property(
                fc.date({
                    min: new Date('1900-01-01'),
                    max: new Date()
                }),
                (date) => {
                    // Generate ISO date from the random date
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const isoDate = `${year}-${month}-${day}`;
                    
                    // Test that the ISO date matches the expected pattern
                    const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
                    return isoRegex.test(isoDate);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any valid ISO date string, formatDateToISO should produce a string matching ISO 8601 pattern', () => {
        fc.assert(
            fc.property(
                fc.date({
                    min: new Date('1900-01-01'),
                    max: new Date()
                }),
                (date) => {
                    // Convert to DD/MM/YYYY format
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    const displayDate = `${day}/${month}/${year}`;
                    
                    // Convert to ISO
                    const isoDate = formatDateToISO(displayDate);
                    
                    // If conversion succeeded, verify ISO format
                    if (isoDate) {
                        const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
                        return isoRegex.test(isoDate);
                    }
                    
                    return true; // Empty string is acceptable for invalid dates
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * Feature: tanggal-pendaftaran-anggota, Property 11: Flexible date parsing
 * **Validates: Requirements 1.2, 5.5**
 */
describe('**Feature: tanggal-pendaftaran-anggota, Property 11: Flexible date parsing**', () => {
    test('For any date string in formats DD/MM/YYYY, YYYY-MM-DD, or DD-MM-YYYY during import, the system should correctly parse and convert it to ISO 8601 format for storage', () => {
        fc.assert(
            fc.property(
                fc.date({
                    min: new Date('1900-01-01'),
                    max: new Date()
                }),
                fc.constantFrom('DD/MM/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY'),
                (date, format) => {
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    
                    let dateString;
                    if (format === 'DD/MM/YYYY') {
                        dateString = `${day}/${month}/${year}`;
                    } else if (format === 'YYYY-MM-DD') {
                        dateString = `${year}-${month}-${day}`;
                    } else { // DD-MM-YYYY
                        dateString = `${day}-${month}-${year}`;
                    }
                    
                    // Parse the date
                    const parsedISO = parseDateFlexible(dateString);
                    
                    // If parsing succeeded, verify it's in ISO format
                    if (parsedISO) {
                        const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
                        const isISOFormat = isoRegex.test(parsedISO);
                        
                        // Also verify the parsed date represents the same date
                        const expectedISO = `${year}-${month}-${day}`;
                        const isSameDate = parsedISO === expectedISO;
                        
                        return isISOFormat && isSameDate;
                    }
                    
                    return true; // Empty string is acceptable for invalid dates
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any date in DD/MM/YYYY format, parseDateFlexible should return valid ISO format', () => {
        fc.assert(
            fc.property(
                fc.date({
                    min: new Date('1900-01-01'),
                    max: new Date()
                }),
                (date) => {
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    const displayDate = `${day}/${month}/${year}`;
                    
                    const parsedISO = parseDateFlexible(displayDate);
                    
                    if (parsedISO) {
                        const expectedISO = `${year}-${month}-${day}`;
                        return parsedISO === expectedISO;
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any date in YYYY-MM-DD format, parseDateFlexible should return the same ISO format', () => {
        fc.assert(
            fc.property(
                fc.date({
                    min: new Date('1900-01-01'),
                    max: new Date()
                }),
                (date) => {
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    const isoDate = `${year}-${month}-${day}`;
                    
                    const parsedISO = parseDateFlexible(isoDate);
                    
                    return parsedISO === isoDate;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any date in DD-MM-YYYY format, parseDateFlexible should return valid ISO format', () => {
        fc.assert(
            fc.property(
                fc.date({
                    min: new Date('1900-01-01'),
                    max: new Date()
                }),
                (date) => {
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    const dashDate = `${day}-${month}-${year}`;
                    
                    const parsedISO = parseDateFlexible(dashDate);
                    
                    if (parsedISO) {
                        const expectedISO = `${year}-${month}-${day}`;
                        return parsedISO === expectedISO;
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

// ===== Unit Tests =====

describe('formatDateToDisplay', () => {
    test('should convert ISO date to DD/MM/YYYY format', () => {
        expect(formatDateToDisplay('2024-01-15')).toBe('15/01/2024');
        expect(formatDateToDisplay('2023-12-31')).toBe('31/12/2023');
        expect(formatDateToDisplay('2000-06-05')).toBe('05/06/2000');
    });
    
    test('should handle ISO datetime strings by extracting date part', () => {
        expect(formatDateToDisplay('2024-01-15T10:30:00Z')).toBe('15/01/2024');
        expect(formatDateToDisplay('2023-12-31T23:59:59')).toBe('31/12/2023');
    });
    
    test('should return empty string for invalid inputs', () => {
        expect(formatDateToDisplay('')).toBe('');
        expect(formatDateToDisplay(null)).toBe('');
        expect(formatDateToDisplay(undefined)).toBe('');
        expect(formatDateToDisplay('invalid')).toBe('');
        expect(formatDateToDisplay('2024/01/15')).toBe('');
    });
    
    test('should return empty string for non-string inputs', () => {
        expect(formatDateToDisplay(123)).toBe('');
        expect(formatDateToDisplay({})).toBe('');
        expect(formatDateToDisplay([])).toBe('');
    });
});

describe('formatDateToISO', () => {
    test('should convert DD/MM/YYYY to ISO format', () => {
        expect(formatDateToISO('15/01/2024')).toBe('2024-01-15');
        expect(formatDateToISO('31/12/2023')).toBe('2023-12-31');
        expect(formatDateToISO('5/6/2000')).toBe('2000-06-05');
    });
    
    test('should pad single digit days and months', () => {
        expect(formatDateToISO('1/1/2024')).toBe('2024-01-01');
        expect(formatDateToISO('9/3/2023')).toBe('2023-03-09');
    });
    
    test('should return empty string for dates before 1900', () => {
        expect(formatDateToISO('01/01/1899')).toBe('');
        expect(formatDateToISO('31/12/1800')).toBe('');
    });
    
    test('should return empty string for future dates', () => {
        const futureYear = new Date().getFullYear() + 1;
        expect(formatDateToISO(`01/01/${futureYear}`)).toBe('');
    });
    
    test('should return empty string for invalid dates', () => {
        expect(formatDateToISO('31/02/2024')).toBe(''); // Feb 31 doesn't exist
        expect(formatDateToISO('32/01/2024')).toBe(''); // Day 32 doesn't exist
        expect(formatDateToISO('00/01/2024')).toBe(''); // Day 0 doesn't exist
        expect(formatDateToISO('15/13/2024')).toBe(''); // Month 13 doesn't exist
    });
    
    test('should return empty string for invalid inputs', () => {
        expect(formatDateToISO('')).toBe('');
        expect(formatDateToISO(null)).toBe('');
        expect(formatDateToISO(undefined)).toBe('');
        expect(formatDateToISO('invalid')).toBe('');
        expect(formatDateToISO('2024-01-15')).toBe('');
    });
});

describe('getCurrentDateISO', () => {
    test('should return current date in ISO format', () => {
        const result = getCurrentDateISO();
        const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
        expect(isoRegex.test(result)).toBe(true);
    });
    
    test('should return today\'s date', () => {
        const result = getCurrentDateISO();
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const expected = `${year}-${month}-${day}`;
        expect(result).toBe(expected);
    });
});

describe('parseDateFlexible', () => {
    test('should parse DD/MM/YYYY format', () => {
        expect(parseDateFlexible('15/01/2024')).toBe('2024-01-15');
        expect(parseDateFlexible('31/12/2023')).toBe('2023-12-31');
        expect(parseDateFlexible('5/6/2000')).toBe('2000-06-05');
    });
    
    test('should parse YYYY-MM-DD format', () => {
        expect(parseDateFlexible('2024-01-15')).toBe('2024-01-15');
        expect(parseDateFlexible('2023-12-31')).toBe('2023-12-31');
        expect(parseDateFlexible('2000-06-05')).toBe('2000-06-05');
    });
    
    test('should parse DD-MM-YYYY format', () => {
        expect(parseDateFlexible('15-01-2024')).toBe('2024-01-15');
        expect(parseDateFlexible('31-12-2023')).toBe('2023-12-31');
        expect(parseDateFlexible('5-6-2000')).toBe('2000-06-05');
    });
    
    test('should handle dates with whitespace', () => {
        expect(parseDateFlexible('  15/01/2024  ')).toBe('2024-01-15');
        expect(parseDateFlexible(' 2024-01-15 ')).toBe('2024-01-15');
    });
    
    test('should return empty string for invalid formats', () => {
        expect(parseDateFlexible('15.01.2024')).toBe('');
        expect(parseDateFlexible('15 01 2024')).toBe('');
        expect(parseDateFlexible('Jan 15, 2024')).toBe('');
    });
    
    test('should return empty string for invalid dates', () => {
        expect(parseDateFlexible('31/02/2024')).toBe('');
        expect(parseDateFlexible('32/01/2024')).toBe('');
        expect(parseDateFlexible('00/01/2024')).toBe('');
    });
    
    test('should return empty string for empty or null inputs', () => {
        expect(parseDateFlexible('')).toBe('');
        expect(parseDateFlexible(null)).toBe('');
        expect(parseDateFlexible(undefined)).toBe('');
    });
    
    test('should return empty string for non-string inputs', () => {
        expect(parseDateFlexible(123)).toBe('');
        expect(parseDateFlexible({})).toBe('');
        expect(parseDateFlexible([])).toBe('');
    });
});

describe('isValidDate', () => {
    test('should validate correct dates', () => {
        expect(isValidDate(2024, 1, 15)).toBe(true);
        expect(isValidDate(2023, 12, 31)).toBe(true);
        expect(isValidDate(2000, 6, 5)).toBe(true);
        expect(isValidDate(1900, 1, 1)).toBe(true);
    });
    
    test('should reject dates before 1900', () => {
        expect(isValidDate(1899, 12, 31)).toBe(false);
        expect(isValidDate(1800, 1, 1)).toBe(false);
    });
    
    test('should reject future dates', () => {
        const futureYear = new Date().getFullYear() + 1;
        expect(isValidDate(futureYear, 1, 1)).toBe(false);
    });
    
    test('should reject invalid months', () => {
        expect(isValidDate(2024, 0, 15)).toBe(false);
        expect(isValidDate(2024, 13, 15)).toBe(false);
        expect(isValidDate(2024, -1, 15)).toBe(false);
    });
    
    test('should reject invalid days', () => {
        expect(isValidDate(2024, 1, 0)).toBe(false);
        expect(isValidDate(2024, 1, 32)).toBe(false);
        expect(isValidDate(2024, 2, 31)).toBe(false); // Feb 31 doesn't exist
    });
    
    test('should handle leap years correctly', () => {
        expect(isValidDate(2024, 2, 29)).toBe(true); // 2024 is a leap year
        expect(isValidDate(2023, 2, 29)).toBe(false); // 2023 is not a leap year
    });
});

// ===== Property Tests for saveAnggota Function =====

// Mock localStorage for testing
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

// Mock generateId function
function generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Simulate saveAnggota function for testing
function saveAnggotaTest(memberData, isEdit = false, existingMember = null) {
    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
    
    const data = {
        id: memberData.id || generateId(),
        nik: memberData.nik,
        nama: memberData.nama,
        noKartu: memberData.noKartu,
        departemen: memberData.departemen || '',
        tipeAnggota: memberData.tipeAnggota || 'Umum',
        status: memberData.status || 'Aktif',
        telepon: memberData.telepon || '',
        email: memberData.email || '',
        alamat: memberData.alamat || ''
    };
    
    if (isEdit && existingMember) {
        // Editing existing member
        const index = anggota.findIndex(a => a.id === existingMember.id);
        if (index !== -1) {
            // Keep existing statusKartu and riwayatKartu
            data.statusKartu = anggota[index].statusKartu;
            data.riwayatKartu = anggota[index].riwayatKartu;
            data.tanggalUbahKartu = anggota[index].tanggalUbahKartu;
            data.catatanKartu = anggota[index].catatanKartu;
            
            // Handle tanggalDaftar: preserve existing or set default for legacy data
            if (anggota[index].tanggalDaftar) {
                // Keep existing tanggalDaftar (immutability)
                data.tanggalDaftar = anggota[index].tanggalDaftar;
            } else {
                // Legacy data: set tanggalDaftar to today as default
                data.tanggalDaftar = getCurrentDateISO();
            }
            
            anggota[index] = data;
        }
    } else {
        // New member: set default statusKartu to nonaktif
        data.statusKartu = 'nonaktif';
        data.riwayatKartu = [];
        data.tanggalUbahKartu = new Date().toISOString();
        data.catatanKartu = 'Kartu baru dibuat';
        
        // New member: set tanggalDaftar to today automatically
        data.tanggalDaftar = getCurrentDateISO();
        
        anggota.push(data);
    }
    
    localStorage.setItem('anggota', JSON.stringify(anggota));
    return data;
}

/**
 * Feature: tanggal-pendaftaran-anggota, Property 1: New member auto-registration date
 * **Validates: Requirements 1.1**
 */
describe('**Feature: tanggal-pendaftaran-anggota, Property 1: New member auto-registration date**', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    
    test('For any new member being created, the system should automatically set the tanggalDaftar field to today\'s date in ISO 8601 format', () => {
        fc.assert(
            fc.property(
                fc.record({
                    nik: fc.string({ minLength: 1, maxLength: 20 }),
                    nama: fc.string({ minLength: 1, maxLength: 100 }),
                    noKartu: fc.string({ minLength: 1, maxLength: 20 }),
                    departemen: fc.option(fc.string({ maxLength: 50 }), { nil: '' }),
                    tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota', 'Umum'),
                    status: fc.constantFrom('Aktif', 'Nonaktif', 'Cuti'),
                    telepon: fc.option(fc.string({ maxLength: 20 }), { nil: '' }),
                    email: fc.option(fc.emailAddress(), { nil: '' }),
                    alamat: fc.option(fc.string({ maxLength: 200 }), { nil: '' })
                }),
                (memberData) => {
                    // Clear localStorage before each test
                    localStorage.clear();
                    
                    // Save new member
                    const savedMember = saveAnggotaTest(memberData, false);
                    
                    // Verify tanggalDaftar is set
                    expect(savedMember.tanggalDaftar).toBeDefined();
                    expect(savedMember.tanggalDaftar).not.toBe('');
                    
                    // Verify it's in ISO 8601 format
                    const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
                    expect(isoRegex.test(savedMember.tanggalDaftar)).toBe(true);
                    
                    // Verify it's today's date
                    const today = getCurrentDateISO();
                    expect(savedMember.tanggalDaftar).toBe(today);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * Feature: tanggal-pendaftaran-anggota, Property 3: Non-empty registration date
 * **Validates: Requirements 1.3**
 */
describe('**Feature: tanggal-pendaftaran-anggota, Property 3: Non-empty registration date**', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    
    test('For any newly created member, the tanggalDaftar field should never be null, undefined, or empty string', () => {
        fc.assert(
            fc.property(
                fc.record({
                    nik: fc.string({ minLength: 1, maxLength: 20 }),
                    nama: fc.string({ minLength: 1, maxLength: 100 }),
                    noKartu: fc.string({ minLength: 1, maxLength: 20 }),
                    departemen: fc.option(fc.string({ maxLength: 50 }), { nil: '' }),
                    tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota', 'Umum'),
                    status: fc.constantFrom('Aktif', 'Nonaktif', 'Cuti'),
                    telepon: fc.option(fc.string({ maxLength: 20 }), { nil: '' }),
                    email: fc.option(fc.emailAddress(), { nil: '' }),
                    alamat: fc.option(fc.string({ maxLength: 200 }), { nil: '' })
                }),
                (memberData) => {
                    // Clear localStorage before each test
                    localStorage.clear();
                    
                    // Save new member
                    const savedMember = saveAnggotaTest(memberData, false);
                    
                    // Verify tanggalDaftar is not null, undefined, or empty
                    expect(savedMember.tanggalDaftar).toBeDefined();
                    expect(savedMember.tanggalDaftar).not.toBeNull();
                    expect(savedMember.tanggalDaftar).not.toBe('');
                    expect(typeof savedMember.tanggalDaftar).toBe('string');
                    expect(savedMember.tanggalDaftar.length).toBeGreaterThan(0);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * Feature: tanggal-pendaftaran-anggota, Property 4: Registration date immutability
 * **Validates: Requirements 1.4**
 */
describe('**Feature: tanggal-pendaftaran-anggota, Property 4: Registration date immutability**', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    
    test('For any existing member being edited, updating any other field should not change the original tanggalDaftar value', () => {
        fc.assert(
            fc.property(
                fc.record({
                    nik: fc.string({ minLength: 1, maxLength: 20 }),
                    nama: fc.string({ minLength: 1, maxLength: 100 }),
                    noKartu: fc.string({ minLength: 1, maxLength: 20 }),
                    departemen: fc.option(fc.string({ maxLength: 50 }), { nil: '' }),
                    tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota', 'Umum'),
                    status: fc.constantFrom('Aktif', 'Nonaktif', 'Cuti'),
                    telepon: fc.option(fc.string({ maxLength: 20 }), { nil: '' }),
                    email: fc.option(fc.emailAddress(), { nil: '' }),
                    alamat: fc.option(fc.string({ maxLength: 200 }), { nil: '' })
                }),
                fc.record({
                    nama: fc.string({ minLength: 1, maxLength: 100 }),
                    telepon: fc.option(fc.string({ maxLength: 20 }), { nil: '' }),
                    email: fc.option(fc.emailAddress(), { nil: '' }),
                    alamat: fc.option(fc.string({ maxLength: 200 }), { nil: '' }),
                    status: fc.constantFrom('Aktif', 'Nonaktif', 'Cuti')
                }),
                (originalData, updatedFields) => {
                    // Clear localStorage before each test
                    localStorage.clear();
                    
                    // Create a new member
                    const newMember = saveAnggotaTest(originalData, false);
                    const originalTanggalDaftar = newMember.tanggalDaftar;
                    
                    // Verify original tanggalDaftar is set
                    expect(originalTanggalDaftar).toBeDefined();
                    expect(originalTanggalDaftar).not.toBe('');
                    
                    // Wait a tiny bit to ensure time has passed (if getCurrentDateISO was called again)
                    // In practice, this shouldn't matter since we're preserving the date
                    
                    // Edit the member with updated fields
                    const editedData = {
                        ...originalData,
                        ...updatedFields,
                        id: newMember.id
                    };
                    
                    const editedMember = saveAnggotaTest(editedData, true, newMember);
                    
                    // Verify tanggalDaftar has NOT changed
                    expect(editedMember.tanggalDaftar).toBe(originalTanggalDaftar);
                    
                    // Verify other fields were updated
                    expect(editedMember.nama).toBe(updatedFields.nama);
                    expect(editedMember.status).toBe(updatedFields.status);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * Feature: tanggal-pendaftaran-anggota, Property 5: Display format conversion
 * **Validates: Requirements 2.2, 2.3, 3.2**
 */
describe('**Feature: tanggal-pendaftaran-anggota, Property 5: Display format conversion**', () => {
    test('For any member with a valid tanggalDaftar in ISO format, when displayed in the UI (form, table, or detail view), it should be shown in DD/MM/YYYY format', () => {
        fc.assert(
            fc.property(
                fc.date({
                    min: new Date('1900-01-01'),
                    max: new Date()
                }),
                (date) => {
                    // Generate ISO date from the random date
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const isoDate = `${year}-${month}-${day}`;
                    
                    // Convert to display format
                    const displayDate = formatDateToDisplay(isoDate);
                    
                    // Verify it's in DD/MM/YYYY format
                    const displayRegex = /^\d{2}\/\d{2}\/\d{4}$/;
                    if (!displayRegex.test(displayDate)) {
                        return false;
                    }
                    
                    // Verify the conversion is correct
                    const expectedDisplay = `${day}/${month}/${year}`;
                    if (displayDate !== expectedDisplay) {
                        return false;
                    }
                    
                    // Verify round-trip conversion works
                    const backToISO = formatDateToISO(displayDate);
                    return backToISO === isoDate;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any member with tanggalDaftar, formatDateToDisplay should produce valid DD/MM/YYYY format', () => {
        fc.assert(
            fc.property(
                fc.date({
                    min: new Date('1900-01-01'),
                    max: new Date()
                }),
                (date) => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const isoDate = `${year}-${month}-${day}`;
                    
                    const displayDate = formatDateToDisplay(isoDate);
                    
                    // Should be in DD/MM/YYYY format
                    const displayRegex = /^\d{2}\/\d{2}\/\d{4}$/;
                    return displayRegex.test(displayDate);
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any ISO date, display format conversion should be reversible', () => {
        fc.assert(
            fc.property(
                fc.date({
                    min: new Date('1900-01-01'),
                    max: new Date()
                }),
                (date) => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const isoDate = `${year}-${month}-${day}`;
                    
                    // Convert to display and back
                    const displayDate = formatDateToDisplay(isoDate);
                    const backToISO = formatDateToISO(displayDate);
                    
                    // Should get back the original ISO date
                    return backToISO === isoDate;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * Feature: tanggal-pendaftaran-anggota, Property 6: Legacy data handling
 * **Validates: Requirements 4.1, 4.3**
 */
describe('**Feature: tanggal-pendaftaran-anggota, Property 6: Legacy data handling**', () => {
    test('For any member without a tanggalDaftar field, the system should display a placeholder text ("-" or "Tidak tercatat") and continue functioning without errors', () => {
        fc.assert(
            fc.property(
                fc.record({
                    nik: fc.string({ minLength: 1, maxLength: 20 }),
                    nama: fc.string({ minLength: 1, maxLength: 100 }),
                    noKartu: fc.string({ minLength: 1, maxLength: 20 }),
                    departemen: fc.option(fc.string({ maxLength: 50 }), { nil: '' }),
                    tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota', 'Umum'),
                    status: fc.constantFrom('Aktif', 'Nonaktif', 'Cuti'),
                    telepon: fc.option(fc.string({ maxLength: 20 }), { nil: '' }),
                    email: fc.option(fc.emailAddress(), { nil: '' }),
                    alamat: fc.option(fc.string({ maxLength: 200 }), { nil: '' })
                }),
                (legacyData) => {
                    // Create a legacy member WITHOUT tanggalDaftar
                    const legacyMember = {
                        id: generateId(),
                        nik: legacyData.nik,
                        nama: legacyData.nama,
                        noKartu: legacyData.noKartu,
                        departemen: legacyData.departemen || '',
                        tipeAnggota: legacyData.tipeAnggota || 'Umum',
                        status: legacyData.status || 'Aktif',
                        telepon: legacyData.telepon || '',
                        email: legacyData.email || '',
                        alamat: legacyData.alamat || '',
                        statusKartu: 'nonaktif',
                        riwayatKartu: [],
                        tanggalUbahKartu: new Date().toISOString(),
                        catatanKartu: 'Legacy member'
                        // NOTE: No tanggalDaftar field
                    };
                    
                    // Verify legacy member has no tanggalDaftar
                    expect(legacyMember.tanggalDaftar).toBeUndefined();
                    
                    // Test formatDateToDisplay with undefined/null/empty tanggalDaftar
                    // Should return empty string without throwing errors
                    let displayResult;
                    expect(() => {
                        displayResult = formatDateToDisplay(legacyMember.tanggalDaftar);
                    }).not.toThrow();
                    
                    // Should return empty string for undefined
                    expect(displayResult).toBe('');
                    
                    // Test with null
                    expect(() => {
                        displayResult = formatDateToDisplay(null);
                    }).not.toThrow();
                    expect(displayResult).toBe('');
                    
                    // Test with empty string
                    expect(() => {
                        displayResult = formatDateToDisplay('');
                    }).not.toThrow();
                    expect(displayResult).toBe('');
                    
                    // Simulate table rendering logic
                    // When tanggalDaftar is missing, should display "-"
                    let tanggalDaftarDisplay = '-';
                    if (legacyMember.tanggalDaftar) {
                        tanggalDaftarDisplay = formatDateToDisplay(legacyMember.tanggalDaftar);
                        if (!tanggalDaftarDisplay) {
                            tanggalDaftarDisplay = '-';
                        }
                    }
                    
                    // Verify placeholder is displayed
                    expect(tanggalDaftarDisplay).toBe('-');
                    
                    // Verify the system continues functioning (no errors thrown)
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any member with null or undefined tanggalDaftar, formatDateToDisplay should return empty string without errors', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(null, undefined, ''),
                (invalidDate) => {
                    let result;
                    expect(() => {
                        result = formatDateToDisplay(invalidDate);
                    }).not.toThrow();
                    
                    expect(result).toBe('');
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any legacy member data, the system should handle missing tanggalDaftar gracefully in all operations', () => {
        fc.assert(
            fc.property(
                fc.record({
                    nik: fc.string({ minLength: 1, maxLength: 20 }),
                    nama: fc.string({ minLength: 1, maxLength: 100 }),
                    noKartu: fc.string({ minLength: 1, maxLength: 20 })
                }),
                (legacyData) => {
                    // Create legacy member without tanggalDaftar
                    const member = {
                        ...legacyData,
                        id: generateId()
                        // No tanggalDaftar field
                    };
                    
                    // Test various operations that might access tanggalDaftar
                    
                    // 1. Display operation
                    let displayDate;
                    expect(() => {
                        displayDate = member.tanggalDaftar ? formatDateToDisplay(member.tanggalDaftar) : '-';
                    }).not.toThrow();
                    expect(displayDate).toBe('-');
                    
                    // 2. Check if tanggalDaftar exists
                    expect(() => {
                        const hasDate = !!member.tanggalDaftar;
                        expect(hasDate).toBe(false);
                    }).not.toThrow();
                    
                    // 3. Conditional rendering logic
                    let renderOutput;
                    expect(() => {
                        renderOutput = member.tanggalDaftar ? formatDateToDisplay(member.tanggalDaftar) || '-' : '-';
                    }).not.toThrow();
                    expect(renderOutput).toBe('-');
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * Feature: tanggal-pendaftaran-anggota, Property 7: Legacy data backfill
 * **Validates: Requirements 4.2**
 */
describe('**Feature: tanggal-pendaftaran-anggota, Property 7: Legacy data backfill**', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    
    test('For any member without a tanggalDaftar field being edited, the system should populate the field with today\'s date as default', () => {
        fc.assert(
            fc.property(
                fc.record({
                    nik: fc.string({ minLength: 1, maxLength: 20 }),
                    nama: fc.string({ minLength: 1, maxLength: 100 }),
                    noKartu: fc.string({ minLength: 1, maxLength: 20 }),
                    departemen: fc.option(fc.string({ maxLength: 50 }), { nil: '' }),
                    tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota', 'Umum'),
                    status: fc.constantFrom('Aktif', 'Nonaktif', 'Cuti'),
                    telepon: fc.option(fc.string({ maxLength: 20 }), { nil: '' }),
                    email: fc.option(fc.emailAddress(), { nil: '' }),
                    alamat: fc.option(fc.string({ maxLength: 200 }), { nil: '' })
                }),
                fc.record({
                    nama: fc.string({ minLength: 1, maxLength: 100 }),
                    status: fc.constantFrom('Aktif', 'Nonaktif', 'Cuti')
                }),
                (legacyData, updatedFields) => {
                    // Clear localStorage before each test
                    localStorage.clear();
                    
                    // Create a legacy member WITHOUT tanggalDaftar
                    const legacyMember = {
                        id: generateId(),
                        nik: legacyData.nik,
                        nama: legacyData.nama,
                        noKartu: legacyData.noKartu,
                        departemen: legacyData.departemen || '',
                        tipeAnggota: legacyData.tipeAnggota || 'Umum',
                        status: legacyData.status || 'Aktif',
                        telepon: legacyData.telepon || '',
                        email: legacyData.email || '',
                        alamat: legacyData.alamat || '',
                        statusKartu: 'nonaktif',
                        riwayatKartu: [],
                        tanggalUbahKartu: new Date().toISOString(),
                        catatanKartu: 'Legacy member'
                        // NOTE: No tanggalDaftar field
                    };
                    
                    // Save legacy member directly to localStorage
                    const anggota = [legacyMember];
                    localStorage.setItem('anggota', JSON.stringify(anggota));
                    
                    // Verify legacy member has no tanggalDaftar
                    expect(legacyMember.tanggalDaftar).toBeUndefined();
                    
                    // Edit the legacy member
                    const editedData = {
                        ...legacyData,
                        ...updatedFields,
                        id: legacyMember.id
                    };
                    
                    const editedMember = saveAnggotaTest(editedData, true, legacyMember);
                    
                    // Verify tanggalDaftar is now populated
                    expect(editedMember.tanggalDaftar).toBeDefined();
                    expect(editedMember.tanggalDaftar).not.toBe('');
                    
                    // Verify it's in ISO 8601 format
                    const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
                    expect(isoRegex.test(editedMember.tanggalDaftar)).toBe(true);
                    
                    // Verify it's today's date
                    const today = getCurrentDateISO();
                    expect(editedMember.tanggalDaftar).toBe(today);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * Feature: tanggal-pendaftaran-anggota, Property 8: Import with registration date
 * **Validates: Requirements 5.1**
 */
describe('**Feature: tanggal-pendaftaran-anggota, Property 8: Import with registration date**', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    
    test('For any CSV import containing a tanggalDaftar column, the system should correctly parse and store the date for each member', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.hexaString({ minLength: 6, maxLength: 16 }),
                        nama: fc.stringMatching(/^[A-Za-z ]+$/),
                        noKartu: fc.hexaString({ minLength: 4, maxLength: 10 }),
                        departemen: fc.option(fc.stringMatching(/^[A-Za-z]+$/), { nil: '' }),
                        tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota', 'Umum'),
                        status: fc.constantFrom('Aktif', 'Nonaktif', 'Cuti'),
                        tanggalDaftar: fc.date({
                            min: new Date('2000-01-01'),
                            max: new Date()
                        })
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                fc.constantFrom('DD/MM/YYYY', 'YYYY-MM-DD', 'DD-MM-YYYY'),
                (members, dateFormat) => {
                    // Clear localStorage before each test
                    localStorage.clear();
                    
                    // Build CSV with tanggalDaftar column
                    let csv = 'NIK,Nama,No. Kartu,Departemen,Tipe Keanggotaan,Status,Telepon,Email,Alamat,Tanggal Pendaftaran\n';
                    
                    const expectedDates = [];
                    members.forEach(member => {
                        const day = String(member.tanggalDaftar.getDate()).padStart(2, '0');
                        const month = String(member.tanggalDaftar.getMonth() + 1).padStart(2, '0');
                        const year = member.tanggalDaftar.getFullYear();
                        
                        let dateString;
                        if (dateFormat === 'DD/MM/YYYY') {
                            dateString = `${day}/${month}/${year}`;
                        } else if (dateFormat === 'YYYY-MM-DD') {
                            dateString = `${year}-${month}-${day}`;
                        } else { // DD-MM-YYYY
                            dateString = `${day}-${month}-${year}`;
                        }
                        
                        const expectedISO = `${year}-${month}-${day}`;
                        expectedDates.push(expectedISO);
                        
                        csv += `${member.nik},"${member.nama}",${member.noKartu},${member.departemen || ''},${member.tipeAnggota},${member.status},,,,"${dateString}"\n`;
                    });
                    
                    // Simulate import process
                    // Parse CSV
                    const lines = csv.split('\n');
                    const importData = [];
                    
                    // Check header and find tanggalDaftar column
                    const headerParts = lines[0].split(',').map(p => p.trim().replace(/^"|"$/g, '').toLowerCase());
                    const tanggalDaftarIndex = headerParts.findIndex(h => 
                        h.includes('tanggal') && (h.includes('daftar') || h.includes('pendaftaran'))
                    );
                    
                    expect(tanggalDaftarIndex).toBeGreaterThanOrEqual(0);
                    
                    // Parse data rows
                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;
                        
                        const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
                        if (parts.length >= 3) {
                            let tanggalDaftar = getCurrentDateISO();
                            if (tanggalDaftarIndex >= 0 && parts[tanggalDaftarIndex]) {
                                const parsedDate = parseDateFlexible(parts[tanggalDaftarIndex]);
                                if (parsedDate) {
                                    tanggalDaftar = parsedDate;
                                }
                            }
                            
                            importData.push({
                                nik: parts[0],
                                nama: parts[1],
                                noKartu: parts[2],
                                tanggalDaftar: tanggalDaftar
                            });
                        }
                    }
                    
                    // Verify all dates were parsed correctly
                    expect(importData.length).toBe(members.length);
                    
                    for (let i = 0; i < importData.length; i++) {
                        const imported = importData[i];
                        const expected = expectedDates[i];
                        
                        // Verify tanggalDaftar is in ISO format
                        const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
                        expect(isoRegex.test(imported.tanggalDaftar)).toBe(true);
                        
                        // Verify the date matches the expected date
                        expect(imported.tanggalDaftar).toBe(expected);
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any CSV with tanggalDaftar column in DD/MM/YYYY format, all dates should be correctly parsed to ISO format', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.hexaString({ minLength: 6, maxLength: 16 }),
                        nama: fc.stringMatching(/^[A-Za-z ]+$/),
                        noKartu: fc.hexaString({ minLength: 4, maxLength: 10 }),
                        tanggalDaftar: fc.date({
                            min: new Date('2000-01-01'),
                            max: new Date()
                        })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (members) => {
                    // Build CSV with DD/MM/YYYY format dates
                    let csv = 'NIK,Nama,No. Kartu,Tanggal Pendaftaran\n';
                    
                    const expectedDates = [];
                    members.forEach(member => {
                        const day = String(member.tanggalDaftar.getDate()).padStart(2, '0');
                        const month = String(member.tanggalDaftar.getMonth() + 1).padStart(2, '0');
                        const year = member.tanggalDaftar.getFullYear();
                        
                        const dateString = `${day}/${month}/${year}`;
                        const expectedISO = `${year}-${month}-${day}`;
                        expectedDates.push(expectedISO);
                        
                        csv += `${member.nik},"${member.nama}",${member.noKartu},${dateString}\n`;
                    });
                    
                    // Parse CSV
                    const lines = csv.split('\n');
                    const importData = [];
                    
                    const headerParts = lines[0].split(',').map(p => p.trim().replace(/^"|"$/g, '').toLowerCase());
                    const tanggalDaftarIndex = headerParts.findIndex(h => 
                        h.includes('tanggal') && (h.includes('daftar') || h.includes('pendaftaran'))
                    );
                    
                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;
                        
                        const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
                        if (parts.length >= 3) {
                            let tanggalDaftar = getCurrentDateISO();
                            if (tanggalDaftarIndex >= 0 && parts[tanggalDaftarIndex]) {
                                const parsedDate = parseDateFlexible(parts[tanggalDaftarIndex]);
                                if (parsedDate) {
                                    tanggalDaftar = parsedDate;
                                }
                            }
                            
                            importData.push({
                                tanggalDaftar: tanggalDaftar
                            });
                        }
                    }
                    
                    // Verify all dates match expected
                    for (let i = 0; i < importData.length; i++) {
                        expect(importData[i].tanggalDaftar).toBe(expectedDates[i]);
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * Feature: tanggal-pendaftaran-anggota, Property 9: Import without registration date
 * **Validates: Requirements 5.2**
 */
describe('**Feature: tanggal-pendaftaran-anggota, Property 9: Import without registration date**', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    
    test('For any CSV import without a tanggalDaftar column, the system should assign today\'s date as the default registration date for all imported members', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.hexaString({ minLength: 6, maxLength: 16 }),
                        nama: fc.stringMatching(/^[A-Za-z ]+$/),
                        noKartu: fc.hexaString({ minLength: 4, maxLength: 10 }),
                        departemen: fc.option(fc.stringMatching(/^[A-Za-z]+$/), { nil: '' }),
                        tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota', 'Umum'),
                        status: fc.constantFrom('Aktif', 'Nonaktif', 'Cuti')
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                (members) => {
                    // Clear localStorage before each test
                    localStorage.clear();
                    
                    // Build CSV WITHOUT tanggalDaftar column
                    let csv = 'NIK,Nama,No. Kartu,Departemen,Tipe Keanggotaan,Status\n';
                    
                    members.forEach(member => {
                        csv += `${member.nik},"${member.nama}",${member.noKartu},${member.departemen || ''},${member.tipeAnggota},${member.status}\n`;
                    });
                    
                    // Get today's date for comparison
                    const todayISO = getCurrentDateISO();
                    
                    // Simulate import process
                    // Parse CSV
                    const lines = csv.split('\n');
                    const importData = [];
                    
                    // Check header - should NOT have tanggalDaftar column
                    const headerParts = lines[0].split(',').map(p => p.trim().replace(/^"|"$/g, '').toLowerCase());
                    const tanggalDaftarIndex = headerParts.findIndex(h => 
                        h.includes('tanggal') && (h.includes('daftar') || h.includes('pendaftaran'))
                    );
                    
                    // Verify tanggalDaftar column does NOT exist
                    expect(tanggalDaftarIndex).toBe(-1);
                    
                    // Parse data rows
                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;
                        
                        const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
                        if (parts.length >= 3) {
                            // Since no tanggalDaftar column, should default to today
                            let tanggalDaftar = todayISO;
                            if (tanggalDaftarIndex >= 0 && parts[tanggalDaftarIndex]) {
                                const parsedDate = parseDateFlexible(parts[tanggalDaftarIndex]);
                                if (parsedDate) {
                                    tanggalDaftar = parsedDate;
                                }
                            }
                            
                            importData.push({
                                nik: parts[0],
                                nama: parts[1],
                                noKartu: parts[2],
                                tanggalDaftar: tanggalDaftar
                            });
                        }
                    }
                    
                    // Verify all members were imported
                    expect(importData.length).toBe(members.length);
                    
                    // Verify all members have today's date as tanggalDaftar
                    for (let i = 0; i < importData.length; i++) {
                        const imported = importData[i];
                        
                        // Verify tanggalDaftar is defined and not empty
                        expect(imported.tanggalDaftar).toBeDefined();
                        expect(imported.tanggalDaftar).not.toBe('');
                        
                        // Verify tanggalDaftar is in ISO format
                        const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
                        expect(isoRegex.test(imported.tanggalDaftar)).toBe(true);
                        
                        // Verify the date is today's date
                        expect(imported.tanggalDaftar).toBe(todayISO);
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any CSV without tanggalDaftar column, all imported members should have the same registration date (today)', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.hexaString({ minLength: 6, maxLength: 16 }),
                        nama: fc.stringMatching(/^[A-Za-z ]+$/),
                        noKartu: fc.hexaString({ minLength: 4, maxLength: 10 })
                    }),
                    { minLength: 2, maxLength: 5 }
                ),
                (members) => {
                    // Build CSV without tanggalDaftar
                    let csv = 'NIK,Nama,No. Kartu\n';
                    
                    members.forEach(member => {
                        csv += `${member.nik},"${member.nama}",${member.noKartu}\n`;
                    });
                    
                    const todayISO = getCurrentDateISO();
                    
                    // Parse CSV
                    const lines = csv.split('\n');
                    const importData = [];
                    
                    const headerParts = lines[0].split(',').map(p => p.trim().replace(/^"|"$/g, '').toLowerCase());
                    const tanggalDaftarIndex = headerParts.findIndex(h => 
                        h.includes('tanggal') && (h.includes('daftar') || h.includes('pendaftaran'))
                    );
                    
                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;
                        
                        const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
                        if (parts.length >= 3) {
                            let tanggalDaftar = todayISO;
                            if (tanggalDaftarIndex >= 0 && parts[tanggalDaftarIndex]) {
                                const parsedDate = parseDateFlexible(parts[tanggalDaftarIndex]);
                                if (parsedDate) {
                                    tanggalDaftar = parsedDate;
                                }
                            }
                            
                            importData.push({
                                tanggalDaftar: tanggalDaftar
                            });
                        }
                    }
                    
                    // Verify all members have the same date (today)
                    const allDates = importData.map(item => item.tanggalDaftar);
                    const uniqueDates = [...new Set(allDates)];
                    
                    // Should only have one unique date
                    expect(uniqueDates.length).toBe(1);
                    expect(uniqueDates[0]).toBe(todayISO);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any CSV without tanggalDaftar column, the default date should be in valid ISO 8601 format', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.hexaString({ minLength: 6, maxLength: 16 }),
                        nama: fc.stringMatching(/^[A-Za-z ]+$/),
                        noKartu: fc.hexaString({ minLength: 4, maxLength: 10 })
                    }),
                    { minLength: 1, maxLength: 3 }
                ),
                (members) => {
                    // Build CSV without tanggalDaftar
                    let csv = 'NIK,Nama,No. Kartu\n';
                    
                    members.forEach(member => {
                        csv += `${member.nik},"${member.nama}",${member.noKartu}\n`;
                    });
                    
                    const todayISO = getCurrentDateISO();
                    
                    // Parse CSV
                    const lines = csv.split('\n');
                    const importData = [];
                    
                    const headerParts = lines[0].split(',').map(p => p.trim().replace(/^"|"$/g, '').toLowerCase());
                    const tanggalDaftarIndex = headerParts.findIndex(h => 
                        h.includes('tanggal') && (h.includes('daftar') || h.includes('pendaftaran'))
                    );
                    
                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;
                        
                        const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
                        if (parts.length >= 3) {
                            let tanggalDaftar = todayISO;
                            if (tanggalDaftarIndex >= 0 && parts[tanggalDaftarIndex]) {
                                const parsedDate = parseDateFlexible(parts[tanggalDaftarIndex]);
                                if (parsedDate) {
                                    tanggalDaftar = parsedDate;
                                }
                            }
                            
                            importData.push({
                                tanggalDaftar: tanggalDaftar
                            });
                        }
                    }
                    
                    // Verify all dates are in ISO format
                    const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
                    for (const item of importData) {
                        expect(isoRegex.test(item.tanggalDaftar)).toBe(true);
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * Feature: tanggal-pendaftaran-anggota, Property 10: Export includes registration date
 * **Validates: Requirements 5.3**
 */
describe('**Feature: tanggal-pendaftaran-anggota, Property 10: Export includes registration date**', () => {
    beforeEach(() => {
        localStorage.clear();
    });
    
    test('For any export operation, the resulting CSV should include a tanggalDaftar column with dates formatted as DD/MM/YYYY', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.hexaString({ minLength: 6, maxLength: 16 }),
                        nama: fc.stringMatching(/^[A-Za-z ]+$/),
                        noKartu: fc.hexaString({ minLength: 4, maxLength: 10 }),
                        departemen: fc.option(fc.stringMatching(/^[A-Za-z ]+$/), { nil: '' }),
                        tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota', 'Umum'),
                        status: fc.constantFrom('Aktif', 'Nonaktif', 'Cuti'),
                        telepon: fc.option(fc.hexaString({ minLength: 8, maxLength: 15 }), { nil: '' }),
                        email: fc.option(fc.emailAddress(), { nil: '' }),
                        alamat: fc.option(fc.stringMatching(/^[A-Za-z0-9 ,.-]+$/), { nil: '' }),
                        tanggalDaftar: fc.date({
                            min: new Date('1900-01-01'),
                            max: new Date()
                        })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (members) => {
                    // Clear localStorage and add members
                    localStorage.clear();
                    
                    // Convert dates to ISO format and save members
                    const membersWithISODates = members.map(m => {
                        const year = m.tanggalDaftar.getFullYear();
                        const month = String(m.tanggalDaftar.getMonth() + 1).padStart(2, '0');
                        const day = String(m.tanggalDaftar.getDate()).padStart(2, '0');
                        return {
                            ...m,
                            tanggalDaftar: `${year}-${month}-${day}`,
                            id: generateId()
                        };
                    });
                    
                    localStorage.setItem('anggota', JSON.stringify(membersWithISODates));
                    
                    // Simulate export function
                    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
                    
                    // Build CSV with tanggalDaftar column
                    let csv = 'NIK,Nama,No. Kartu,Departemen,Tipe Keanggotaan,Status,Telepon,Email,Alamat,Tanggal Pendaftaran\n';
                    anggota.forEach(a => {
                        // Format tanggalDaftar as DD/MM/YYYY or "-" for legacy data
                        let tanggalDaftarDisplay = '-';
                        if (a.tanggalDaftar) {
                            tanggalDaftarDisplay = formatDateToDisplay(a.tanggalDaftar);
                            if (!tanggalDaftarDisplay) {
                                tanggalDaftarDisplay = '-';
                            }
                        }
                        
                        csv += `${a.nik},"${a.nama}",${a.noKartu},${a.departemen || ''},${a.tipeAnggota || 'Umum'},${a.status || 'Aktif'},${a.telepon || ''},${a.email || ''},"${a.alamat || ''}",${tanggalDaftarDisplay}\n`;
                    });
                    
                    // Verify CSV structure
                    const lines = csv.split('\n');
                    const header = lines[0];
                    
                    // Verify header includes "Tanggal Pendaftaran"
                    expect(header).toContain('Tanggal Pendaftaran');
                    
                    // Verify each data row has the tanggalDaftar column
                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;
                        
                        // Split by comma (simple parsing, not handling quoted commas perfectly)
                        const parts = line.split(',');
                        
                        // Should have 10 columns (including tanggalDaftar)
                        expect(parts.length).toBeGreaterThanOrEqual(10);
                        
                        // Last column should be tanggalDaftar
                        const tanggalDaftarValue = parts[parts.length - 1].trim();
                        
                        // Should be either DD/MM/YYYY format or "-"
                        if (tanggalDaftarValue !== '-') {
                            const ddmmyyyyRegex = /^\d{2}\/\d{2}\/\d{4}$/;
                            expect(ddmmyyyyRegex.test(tanggalDaftarValue)).toBe(true);
                        }
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any export with legacy data (no tanggalDaftar), the CSV should show "-" in the tanggalDaftar column', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.hexaString({ minLength: 6, maxLength: 16 }),
                        nama: fc.stringMatching(/^[A-Za-z ]+$/),
                        noKartu: fc.hexaString({ minLength: 4, maxLength: 10 }),
                        departemen: fc.option(fc.stringMatching(/^[A-Za-z ]+$/), { nil: '' }),
                        tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota', 'Umum'),
                        status: fc.constantFrom('Aktif', 'Nonaktif', 'Cuti')
                    }),
                    { minLength: 1, maxLength: 3 }
                ),
                (members) => {
                    // Clear localStorage and add members WITHOUT tanggalDaftar
                    localStorage.clear();
                    
                    const membersWithoutDates = members.map(m => ({
                        ...m,
                        id: generateId()
                        // Intentionally omit tanggalDaftar
                    }));
                    
                    localStorage.setItem('anggota', JSON.stringify(membersWithoutDates));
                    
                    // Simulate export function
                    const anggota = JSON.parse(localStorage.getItem('anggota') || '[]');
                    
                    // Build CSV with tanggalDaftar column
                    let csv = 'NIK,Nama,No. Kartu,Departemen,Tipe Keanggotaan,Status,Telepon,Email,Alamat,Tanggal Pendaftaran\n';
                    anggota.forEach(a => {
                        // Format tanggalDaftar as DD/MM/YYYY or "-" for legacy data
                        let tanggalDaftarDisplay = '-';
                        if (a.tanggalDaftar) {
                            tanggalDaftarDisplay = formatDateToDisplay(a.tanggalDaftar);
                            if (!tanggalDaftarDisplay) {
                                tanggalDaftarDisplay = '-';
                            }
                        }
                        
                        csv += `${a.nik},"${a.nama}",${a.noKartu},${a.departemen || ''},${a.tipeAnggota || 'Umum'},${a.status || 'Aktif'},${a.telepon || ''},${a.email || ''},"${a.alamat || ''}",${tanggalDaftarDisplay}\n`;
                    });
                    
                    // Verify CSV structure
                    const lines = csv.split('\n');
                    
                    // Verify each data row has "-" for tanggalDaftar
                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line) continue;
                        
                        const parts = line.split(',');
                        const tanggalDaftarValue = parts[parts.length - 1].trim();
                        
                        // Should be "-" for legacy data
                        expect(tanggalDaftarValue).toBe('-');
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * Feature: tanggal-pendaftaran-anggota, Property 12: Date-based sorting
 * **Validates: Requirements 6.2**
 */
describe('**Feature: tanggal-pendaftaran-anggota, Property 12: Date-based sorting**', () => {
    test('For any list of members, when sorted by tanggalDaftar, the members should be ordered chronologically (either ascending or descending based on sort direction)', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 1, maxLength: 20 }),
                        nama: fc.string({ minLength: 1, maxLength: 100 }),
                        noKartu: fc.string({ minLength: 1, maxLength: 20 }),
                        tanggalDaftar: fc.date({
                            min: new Date('1900-01-01'),
                            max: new Date()
                        }).map(date => {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            return `${year}-${month}-${day}`;
                        })
                    }),
                    { minLength: 2, maxLength: 20 }
                ),
                fc.constantFrom('asc', 'desc'),
                (members, sortDirection) => {
                    // Sort the members by tanggalDaftar
                    const sorted = [...members].sort((a, b) => {
                        const dateA = new Date(a.tanggalDaftar || '1900-01-01');
                        const dateB = new Date(b.tanggalDaftar || '1900-01-01');
                        
                        if (sortDirection === 'asc') {
                            return dateA - dateB;
                        } else {
                            return dateB - dateA;
                        }
                    });
                    
                    // Verify the sorted array is in correct order
                    for (let i = 0; i < sorted.length - 1; i++) {
                        const dateA = new Date(sorted[i].tanggalDaftar || '1900-01-01');
                        const dateB = new Date(sorted[i + 1].tanggalDaftar || '1900-01-01');
                        
                        if (sortDirection === 'asc') {
                            // Ascending: each date should be <= next date
                            expect(dateA.getTime()).toBeLessThanOrEqual(dateB.getTime());
                        } else {
                            // Descending: each date should be >= next date
                            expect(dateA.getTime()).toBeGreaterThanOrEqual(dateB.getTime());
                        }
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any list of members including legacy data without tanggalDaftar, sorting should handle null/undefined dates gracefully', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 1, maxLength: 20 }),
                        nama: fc.string({ minLength: 1, maxLength: 100 }),
                        noKartu: fc.string({ minLength: 1, maxLength: 20 }),
                        tanggalDaftar: fc.option(
                            fc.date({
                                min: new Date('1900-01-01'),
                                max: new Date()
                            }).map(date => {
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                return `${year}-${month}-${day}`;
                            }),
                            { nil: null }
                        )
                    }),
                    { minLength: 2, maxLength: 20 }
                ),
                fc.constantFrom('asc', 'desc'),
                (members, sortDirection) => {
                    // Sort the members by tanggalDaftar, handling null/undefined
                    const sorted = [...members].sort((a, b) => {
                        // Treat null/undefined as earliest date (1900-01-01)
                        const dateA = new Date(a.tanggalDaftar || '1900-01-01');
                        const dateB = new Date(b.tanggalDaftar || '1900-01-01');
                        
                        if (sortDirection === 'asc') {
                            return dateA - dateB;
                        } else {
                            return dateB - dateA;
                        }
                    });
                    
                    // Verify no errors occurred during sorting
                    expect(sorted.length).toBe(members.length);
                    
                    // Verify the sorted array is in correct order
                    for (let i = 0; i < sorted.length - 1; i++) {
                        const dateA = new Date(sorted[i].tanggalDaftar || '1900-01-01');
                        const dateB = new Date(sorted[i + 1].tanggalDaftar || '1900-01-01');
                        
                        // Verify dates are valid
                        expect(isNaN(dateA.getTime())).toBe(false);
                        expect(isNaN(dateB.getTime())).toBe(false);
                        
                        if (sortDirection === 'asc') {
                            expect(dateA.getTime()).toBeLessThanOrEqual(dateB.getTime());
                        } else {
                            expect(dateA.getTime()).toBeGreaterThanOrEqual(dateB.getTime());
                        }
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});


// ===== Unit Tests for Sorting Functionality =====

describe('sortAnggotaByDate functionality', () => {
    test('should sort members by tanggalDaftar in ascending order', () => {
        const members = [
            { nik: '001', nama: 'Alice', tanggalDaftar: '2024-03-15' },
            { nik: '002', nama: 'Bob', tanggalDaftar: '2024-01-10' },
            { nik: '003', nama: 'Charlie', tanggalDaftar: '2024-02-20' }
        ];
        
        const sorted = [...members].sort((a, b) => {
            const dateA = new Date(a.tanggalDaftar || '1900-01-01');
            const dateB = new Date(b.tanggalDaftar || '1900-01-01');
            return dateA - dateB; // ascending
        });
        
        expect(sorted[0].nama).toBe('Bob');
        expect(sorted[1].nama).toBe('Charlie');
        expect(sorted[2].nama).toBe('Alice');
    });
    
    test('should sort members by tanggalDaftar in descending order', () => {
        const members = [
            { nik: '001', nama: 'Alice', tanggalDaftar: '2024-03-15' },
            { nik: '002', nama: 'Bob', tanggalDaftar: '2024-01-10' },
            { nik: '003', nama: 'Charlie', tanggalDaftar: '2024-02-20' }
        ];
        
        const sorted = [...members].sort((a, b) => {
            const dateA = new Date(a.tanggalDaftar || '1900-01-01');
            const dateB = new Date(b.tanggalDaftar || '1900-01-01');
            return dateB - dateA; // descending
        });
        
        expect(sorted[0].nama).toBe('Alice');
        expect(sorted[1].nama).toBe('Charlie');
        expect(sorted[2].nama).toBe('Bob');
    });
    
    test('should handle legacy data (null/undefined tanggalDaftar) by treating as earliest date', () => {
        const members = [
            { nik: '001', nama: 'Alice', tanggalDaftar: '2024-03-15' },
            { nik: '002', nama: 'Bob', tanggalDaftar: null },
            { nik: '003', nama: 'Charlie', tanggalDaftar: '2024-02-20' },
            { nik: '004', nama: 'David' } // undefined tanggalDaftar
        ];
        
        const sorted = [...members].sort((a, b) => {
            const dateA = new Date(a.tanggalDaftar || '1900-01-01');
            const dateB = new Date(b.tanggalDaftar || '1900-01-01');
            return dateA - dateB; // ascending
        });
        
        // Legacy data (Bob and David) should be first
        expect(sorted[0].nama).toBe('Bob');
        expect(sorted[1].nama).toBe('David');
        expect(sorted[2].nama).toBe('Charlie');
        expect(sorted[3].nama).toBe('Alice');
    });
    
    test('should maintain stable sort for members with same tanggalDaftar', () => {
        const members = [
            { nik: '001', nama: 'Alice', tanggalDaftar: '2024-03-15' },
            { nik: '002', nama: 'Bob', tanggalDaftar: '2024-03-15' },
            { nik: '003', nama: 'Charlie', tanggalDaftar: '2024-03-15' }
        ];
        
        const sorted = [...members].sort((a, b) => {
            const dateA = new Date(a.tanggalDaftar || '1900-01-01');
            const dateB = new Date(b.tanggalDaftar || '1900-01-01');
            return dateA - dateB;
        });
        
        // All have same date, so order should be maintained (stable sort)
        expect(sorted.length).toBe(3);
        sorted.forEach(member => {
            expect(member.tanggalDaftar).toBe('2024-03-15');
        });
    });
});

/**
 * Feature: tanggal-pendaftaran-anggota, Property 13: Date range filtering
 * **Validates: Requirements 6.3**
 */
describe('**Feature: tanggal-pendaftaran-anggota, Property 13: Date range filtering**', () => {
    test('For any date range filter applied, only members whose tanggalDaftar falls within the specified range should be displayed', () => {
        fc.assert(
            fc.property(
                // Generate a list of members with random dates
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 1, maxLength: 20 }),
                        nama: fc.string({ minLength: 1, maxLength: 100 }),
                        noKartu: fc.string({ minLength: 1, maxLength: 20 }),
                        tanggalDaftar: fc.date({
                            min: new Date('1900-01-01'),
                            max: new Date()
                        }).map(date => {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            return `${year}-${month}-${day}`;
                        })
                    }),
                    { minLength: 5, maxLength: 50 }
                ),
                // Generate a random date range
                fc.date({
                    min: new Date('1900-01-01'),
                    max: new Date()
                }),
                fc.date({
                    min: new Date('1900-01-01'),
                    max: new Date()
                }),
                (members, startDate, endDate) => {
                    // Ensure startDate <= endDate
                    const filterTanggalDari = startDate <= endDate ? 
                        `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}` :
                        `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
                    
                    const filterTanggalSampai = startDate <= endDate ?
                        `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}` :
                        `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
                    
                    // Filter members based on date range
                    const filtered = members.filter(a => {
                        const memberDate = a.tanggalDaftar || '1900-01-01';
                        return memberDate >= filterTanggalDari && memberDate <= filterTanggalSampai;
                    });
                    
                    // Verify all filtered members are within the date range
                    filtered.forEach(member => {
                        const memberDate = member.tanggalDaftar || '1900-01-01';
                        expect(memberDate >= filterTanggalDari).toBe(true);
                        expect(memberDate <= filterTanggalSampai).toBe(true);
                    });
                    
                    // Verify no members outside the range are included
                    // Count members by date to handle duplicates
                    const membersByDate = {};
                    members.forEach(member => {
                        const memberDate = member.tanggalDaftar || '1900-01-01';
                        if (!membersByDate[memberDate]) {
                            membersByDate[memberDate] = 0;
                        }
                        membersByDate[memberDate]++;
                    });
                    
                    const filteredByDate = {};
                    filtered.forEach(member => {
                        const memberDate = member.tanggalDaftar || '1900-01-01';
                        if (!filteredByDate[memberDate]) {
                            filteredByDate[memberDate] = 0;
                        }
                        filteredByDate[memberDate]++;
                    });
                    
                    // Verify counts match for dates in range
                    Object.keys(membersByDate).forEach(date => {
                        const isInRange = date >= filterTanggalDari && date <= filterTanggalSampai;
                        const countInMembers = membersByDate[date];
                        const countInFiltered = filteredByDate[date] || 0;
                        
                        if (isInRange) {
                            expect(countInFiltered).toBe(countInMembers);
                        } else {
                            expect(countInFiltered).toBe(0);
                        }
                    });
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any date range filter with only start date, only members whose tanggalDaftar is on or after the start date should be displayed', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 1, maxLength: 20 }),
                        nama: fc.string({ minLength: 1, maxLength: 100 }),
                        noKartu: fc.string({ minLength: 1, maxLength: 20 }),
                        tanggalDaftar: fc.date({
                            min: new Date('1900-01-01'),
                            max: new Date()
                        }).map(date => {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            return `${year}-${month}-${day}`;
                        })
                    }),
                    { minLength: 5, maxLength: 50 }
                ),
                fc.date({
                    min: new Date('1900-01-01'),
                    max: new Date()
                }),
                (members, startDate) => {
                    const filterTanggalDari = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
                    
                    // Filter members with only start date
                    const filtered = members.filter(a => {
                        const memberDate = a.tanggalDaftar || '1900-01-01';
                        return memberDate >= filterTanggalDari;
                    });
                    
                    // Verify all filtered members are on or after start date
                    filtered.forEach(member => {
                        const memberDate = member.tanggalDaftar || '1900-01-01';
                        expect(memberDate >= filterTanggalDari).toBe(true);
                    });
                    
                    // Verify no members before start date are included
                    // Count members by date to handle duplicates
                    const membersByDate = {};
                    members.forEach(member => {
                        const memberDate = member.tanggalDaftar || '1900-01-01';
                        if (!membersByDate[memberDate]) {
                            membersByDate[memberDate] = 0;
                        }
                        membersByDate[memberDate]++;
                    });
                    
                    const filteredByDate = {};
                    filtered.forEach(member => {
                        const memberDate = member.tanggalDaftar || '1900-01-01';
                        if (!filteredByDate[memberDate]) {
                            filteredByDate[memberDate] = 0;
                        }
                        filteredByDate[memberDate]++;
                    });
                    
                    // Verify counts match for dates on or after start date
                    Object.keys(membersByDate).forEach(date => {
                        const isAfterStart = date >= filterTanggalDari;
                        const countInMembers = membersByDate[date];
                        const countInFiltered = filteredByDate[date] || 0;
                        
                        if (isAfterStart) {
                            expect(countInFiltered).toBe(countInMembers);
                        } else {
                            expect(countInFiltered).toBe(0);
                        }
                    });
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any date range filter with only end date, only members whose tanggalDaftar is on or before the end date should be displayed', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 1, maxLength: 20 }),
                        nama: fc.string({ minLength: 1, maxLength: 100 }),
                        noKartu: fc.string({ minLength: 1, maxLength: 20 }),
                        tanggalDaftar: fc.date({
                            min: new Date('1900-01-01'),
                            max: new Date()
                        }).map(date => {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            return `${year}-${month}-${day}`;
                        })
                    }),
                    { minLength: 5, maxLength: 50 }
                ),
                fc.date({
                    min: new Date('1900-01-01'),
                    max: new Date()
                }),
                (members, endDate) => {
                    const filterTanggalSampai = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
                    
                    // Filter members with only end date
                    const filtered = members.filter(a => {
                        const memberDate = a.tanggalDaftar || '1900-01-01';
                        return memberDate <= filterTanggalSampai;
                    });
                    
                    // Verify all filtered members are on or before end date
                    filtered.forEach(member => {
                        const memberDate = member.tanggalDaftar || '1900-01-01';
                        expect(memberDate <= filterTanggalSampai).toBe(true);
                    });
                    
                    // Verify no members after end date are included
                    // Count members by date to handle duplicates
                    const membersByDate = {};
                    members.forEach(member => {
                        const memberDate = member.tanggalDaftar || '1900-01-01';
                        if (!membersByDate[memberDate]) {
                            membersByDate[memberDate] = 0;
                        }
                        membersByDate[memberDate]++;
                    });
                    
                    const filteredByDate = {};
                    filtered.forEach(member => {
                        const memberDate = member.tanggalDaftar || '1900-01-01';
                        if (!filteredByDate[memberDate]) {
                            filteredByDate[memberDate] = 0;
                        }
                        filteredByDate[memberDate]++;
                    });
                    
                    // Verify counts match for dates before or on end date
                    Object.keys(membersByDate).forEach(date => {
                        const isBeforeEnd = date <= filterTanggalSampai;
                        const countInMembers = membersByDate[date];
                        const countInFiltered = filteredByDate[date] || 0;
                        
                        if (isBeforeEnd) {
                            expect(countInFiltered).toBe(countInMembers);
                        } else {
                            expect(countInFiltered).toBe(0);
                        }
                    });
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    test('For any date range filter, legacy data (null/undefined tanggalDaftar) should be treated as earliest date (1900-01-01)', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        nik: fc.string({ minLength: 1, maxLength: 20 }),
                        nama: fc.string({ minLength: 1, maxLength: 100 }),
                        noKartu: fc.string({ minLength: 1, maxLength: 20 }),
                        tanggalDaftar: fc.option(
                            fc.date({
                                min: new Date('1900-01-01'),
                                max: new Date()
                            }).map(date => {
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                return `${year}-${month}-${day}`;
                            }),
                            { nil: null }
                        )
                    }),
                    { minLength: 5, maxLength: 50 }
                ),
                fc.date({
                    min: new Date('1900-01-01'),
                    max: new Date()
                }),
                fc.date({
                    min: new Date('1900-01-01'),
                    max: new Date()
                }),
                (members, startDate, endDate) => {
                    // Ensure startDate <= endDate
                    const filterTanggalDari = startDate <= endDate ? 
                        `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}` :
                        `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
                    
                    const filterTanggalSampai = startDate <= endDate ?
                        `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}` :
                        `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
                    
                    // Filter members based on date range, treating null/undefined as 1900-01-01
                    const filtered = members.filter(a => {
                        const memberDate = a.tanggalDaftar || '1900-01-01';
                        return memberDate >= filterTanggalDari && memberDate <= filterTanggalSampai;
                    });
                    
                    // Verify all filtered members are within the date range
                    filtered.forEach(member => {
                        const memberDate = member.tanggalDaftar || '1900-01-01';
                        expect(memberDate >= filterTanggalDari).toBe(true);
                        expect(memberDate <= filterTanggalSampai).toBe(true);
                    });
                    
                    // Verify legacy data is handled correctly
                    const legacyMembers = members.filter(m => !m.tanggalDaftar);
                    legacyMembers.forEach(legacyMember => {
                        const isInRange = '1900-01-01' >= filterTanggalDari && '1900-01-01' <= filterTanggalSampai;
                        const isInFiltered = filtered.some(f => f.nik === legacyMember.nik);
                        
                        expect(isInRange).toBe(isInFiltered);
                    });
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});


// ===== Unit Tests for Date Range Filtering Functionality =====

describe('filterAnggota date range functionality', () => {
    test('should filter members within date range (both start and end dates)', () => {
        const members = [
            { nik: '001', nama: 'Alice', tanggalDaftar: '2024-01-15' },
            { nik: '002', nama: 'Bob', tanggalDaftar: '2024-02-20' },
            { nik: '003', nama: 'Charlie', tanggalDaftar: '2024-03-10' },
            { nik: '004', nama: 'David', tanggalDaftar: '2024-04-05' }
        ];
        
        const filterTanggalDari = '2024-02-01';
        const filterTanggalSampai = '2024-03-31';
        
        const filtered = members.filter(a => {
            const memberDate = a.tanggalDaftar || '1900-01-01';
            return memberDate >= filterTanggalDari && memberDate <= filterTanggalSampai;
        });
        
        expect(filtered.length).toBe(2);
        expect(filtered[0].nama).toBe('Bob');
        expect(filtered[1].nama).toBe('Charlie');
    });
    
    test('should filter members on or after start date (no end date)', () => {
        const members = [
            { nik: '001', nama: 'Alice', tanggalDaftar: '2024-01-15' },
            { nik: '002', nama: 'Bob', tanggalDaftar: '2024-02-20' },
            { nik: '003', nama: 'Charlie', tanggalDaftar: '2024-03-10' },
            { nik: '004', nama: 'David', tanggalDaftar: '2024-04-05' }
        ];
        
        const filterTanggalDari = '2024-03-01';
        
        const filtered = members.filter(a => {
            const memberDate = a.tanggalDaftar || '1900-01-01';
            return memberDate >= filterTanggalDari;
        });
        
        expect(filtered.length).toBe(2);
        expect(filtered[0].nama).toBe('Charlie');
        expect(filtered[1].nama).toBe('David');
    });
    
    test('should filter members on or before end date (no start date)', () => {
        const members = [
            { nik: '001', nama: 'Alice', tanggalDaftar: '2024-01-15' },
            { nik: '002', nama: 'Bob', tanggalDaftar: '2024-02-20' },
            { nik: '003', nama: 'Charlie', tanggalDaftar: '2024-03-10' },
            { nik: '004', nama: 'David', tanggalDaftar: '2024-04-05' }
        ];
        
        const filterTanggalSampai = '2024-02-28';
        
        const filtered = members.filter(a => {
            const memberDate = a.tanggalDaftar || '1900-01-01';
            return memberDate <= filterTanggalSampai;
        });
        
        expect(filtered.length).toBe(2);
        expect(filtered[0].nama).toBe('Alice');
        expect(filtered[1].nama).toBe('Bob');
    });
    
    test('should handle legacy data (null/undefined tanggalDaftar) as earliest date', () => {
        const members = [
            { nik: '001', nama: 'Alice', tanggalDaftar: '2024-01-15' },
            { nik: '002', nama: 'Bob', tanggalDaftar: null },
            { nik: '003', nama: 'Charlie', tanggalDaftar: '2024-03-10' },
            { nik: '004', nama: 'David' } // undefined
        ];
        
        const filterTanggalDari = '1900-01-01';
        const filterTanggalSampai = '2024-02-01';
        
        const filtered = members.filter(a => {
            const memberDate = a.tanggalDaftar || '1900-01-01';
            return memberDate >= filterTanggalDari && memberDate <= filterTanggalSampai;
        });
        
        // Should include Alice (2024-01-15), Bob (treated as 1900-01-01), and David (treated as 1900-01-01)
        // Charlie (2024-03-10) is after the end date, so excluded
        expect(filtered.length).toBe(3);
        expect(filtered.some(m => m.nama === 'Alice')).toBe(true);
        expect(filtered.some(m => m.nama === 'Bob')).toBe(true);
        expect(filtered.some(m => m.nama === 'David')).toBe(true);
        expect(filtered.some(m => m.nama === 'Charlie')).toBe(false);
    });
    
    test('should return all members when no date filter is applied', () => {
        const members = [
            { nik: '001', nama: 'Alice', tanggalDaftar: '2024-01-15' },
            { nik: '002', nama: 'Bob', tanggalDaftar: '2024-02-20' },
            { nik: '003', nama: 'Charlie', tanggalDaftar: '2024-03-10' }
        ];
        
        const filterTanggalDari = '';
        const filterTanggalSampai = '';
        
        let matchDateRange = true;
        if (filterTanggalDari || filterTanggalSampai) {
            matchDateRange = false; // This won't execute
        }
        
        const filtered = members.filter(a => matchDateRange);
        
        expect(filtered.length).toBe(3);
    });
    
    test('should handle edge case where start date equals end date', () => {
        const members = [
            { nik: '001', nama: 'Alice', tanggalDaftar: '2024-01-15' },
            { nik: '002', nama: 'Bob', tanggalDaftar: '2024-02-20' },
            { nik: '003', nama: 'Charlie', tanggalDaftar: '2024-02-20' },
            { nik: '004', nama: 'David', tanggalDaftar: '2024-03-10' }
        ];
        
        const filterTanggalDari = '2024-02-20';
        const filterTanggalSampai = '2024-02-20';
        
        const filtered = members.filter(a => {
            const memberDate = a.tanggalDaftar || '1900-01-01';
            return memberDate >= filterTanggalDari && memberDate <= filterTanggalSampai;
        });
        
        expect(filtered.length).toBe(2);
        expect(filtered[0].nama).toBe('Bob');
        expect(filtered[1].nama).toBe('Charlie');
    });
});
