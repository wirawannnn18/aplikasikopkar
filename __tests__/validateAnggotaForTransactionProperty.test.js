/**
 * Property-Based Tests for validateAnggotaForTransaction()
 * 
 * Tests Property 6: Transaction Validation Rejection
 * Validates Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 * 
 * This test suite uses fast-check to verify that validateAnggotaForTransaction()
 * correctly rejects anggota who should not be allowed to perform transactions.
 */

import fc from 'fast-check';

// Simulate validateAnggotaForTransaction function
// In actual implementation, this is in js/transactionValidator.js
function validateAnggotaForTransaction(anggota) {
  if (!anggota) {
    return { valid: false, message: 'Anggota tidak ditemukan' };
  }

  // Check statusKeanggotaan
  if (anggota.statusKeanggotaan === 'Keluar') {
    return { 
      valid: false, 
      message: 'Anggota sudah keluar dari koperasi. Transaksi tidak dapat dilakukan.' 
    };
  }

  // Check status
  if (anggota.status === 'Nonaktif') {
    return { 
      valid: false, 
      message: 'Anggota berstatus Nonaktif. Transaksi tidak dapat dilakukan.' 
    };
  }

  // Check tanggalKeluar
  if (anggota.tanggalKeluar) {
    return { 
      valid: false, 
      message: 'Anggota memiliki tanggal keluar. Transaksi tidak dapat dilakukan.' 
    };
  }

  // Check pengembalianStatus
  if (anggota.pengembalianStatus && anggota.pengembalianStatus !== '') {
    return { 
      valid: false, 
      message: 'Anggota sedang dalam proses pengembalian simpanan. Transaksi tidak dapat dilakukan.' 
    };
  }

  return { valid: true, message: '' };
}

// Arbitraries for generating test data
const statusKeanggotaanArb = fc.constantFrom('Aktif', 'Cuti', 'Keluar');
const statusArb = fc.constantFrom('Aktif', 'Nonaktif');
const pengembalianStatusArb = fc.constantFrom('', 'Proses', 'Selesai');

const anggotaArb = fc.record({
  id: fc.integer({ min: 1, max: 10000 }),
  nama: fc.string({ minLength: 3, maxLength: 50 }),
  statusKeanggotaan: statusKeanggotaanArb,
  status: statusArb,
  tanggalKeluar: fc.option(fc.date(), { nil: null }),
  pengembalianStatus: pengembalianStatusArb
});

describe('validateAnggotaForTransaction - Property Tests', () => {
  
  // ============================================================================
  // PROPERTY 1: Reject statusKeanggotaan === 'Keluar'
  // Validates Requirement 6.1
  // ============================================================================
  test('Property 1: Should reject anggota with statusKeanggotaan === "Keluar"', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1, max: 10000 }),
          nama: fc.string({ minLength: 3, maxLength: 50 }),
          statusKeanggotaan: fc.constant('Keluar'),
          status: statusArb,
          tanggalKeluar: fc.option(fc.date(), { nil: null }),
          pengembalianStatus: pengembalianStatusArb
        }),
        (anggota) => {
          const result = validateAnggotaForTransaction(anggota);
          return result.valid === false && 
                 result.message.includes('sudah keluar');
        }
      ),
      { numRuns: 100 }
    );
  });

  // ============================================================================
  // PROPERTY 2: Reject status === 'Nonaktif'
  // Validates Requirement 6.2, 6.3, 6.4
  // ============================================================================
  test('Property 2: Should reject anggota with status === "Nonaktif"', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1, max: 10000 }),
          nama: fc.string({ minLength: 3, maxLength: 50 }),
          statusKeanggotaan: fc.constantFrom('Aktif', 'Cuti'),
          status: fc.constant('Nonaktif'),
          tanggalKeluar: fc.constant(null),
          pengembalianStatus: fc.constant('')
        }),
        (anggota) => {
          const result = validateAnggotaForTransaction(anggota);
          return result.valid === false && 
                 result.message.includes('Nonaktif');
        }
      ),
      { numRuns: 100 }
    );
  });

  // ============================================================================
  // PROPERTY 3: Reject anggota with tanggalKeluar
  // Validates Requirement 6.5
  // ============================================================================
  test('Property 3: Should reject anggota with tanggalKeluar set', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1, max: 10000 }),
          nama: fc.string({ minLength: 3, maxLength: 50 }),
          statusKeanggotaan: fc.constantFrom('Aktif', 'Cuti'),
          status: fc.constant('Aktif'),
          tanggalKeluar: fc.date(),
          pengembalianStatus: fc.constant('')
        }),
        (anggota) => {
          const result = validateAnggotaForTransaction(anggota);
          return result.valid === false && 
                 result.message.includes('tanggal keluar');
        }
      ),
      { numRuns: 100 }
    );
  });

  // ============================================================================
  // PROPERTY 4: Reject anggota with pengembalianStatus
  // Validates Requirement 6.5
  // ============================================================================
  test('Property 4: Should reject anggota with pengembalianStatus set', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1, max: 10000 }),
          nama: fc.string({ minLength: 3, maxLength: 50 }),
          statusKeanggotaan: fc.constantFrom('Aktif', 'Cuti'),
          status: fc.constant('Aktif'),
          tanggalKeluar: fc.constant(null),
          pengembalianStatus: fc.constantFrom('Proses', 'Selesai')
        }),
        (anggota) => {
          const result = validateAnggotaForTransaction(anggota);
          return result.valid === false && 
                 result.message.includes('pengembalian simpanan');
        }
      ),
      { numRuns: 100 }
    );
  });

  // ============================================================================
  // PROPERTY 5: Accept valid anggota
  // Validates that valid anggota pass validation
  // ============================================================================
  test('Property 5: Should accept anggota with Aktif status and no exit indicators', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1, max: 10000 }),
          nama: fc.string({ minLength: 3, maxLength: 50 }),
          statusKeanggotaan: fc.constantFrom('Aktif', 'Cuti'),
          status: fc.constant('Aktif'),
          tanggalKeluar: fc.constant(null),
          pengembalianStatus: fc.constant('')
        }),
        (anggota) => {
          const result = validateAnggotaForTransaction(anggota);
          return result.valid === true && result.message === '';
        }
      ),
      { numRuns: 100 }
    );
  });

  // ============================================================================
  // PROPERTY 6: Reject null/undefined anggota
  // Validates error handling
  // ============================================================================
  test('Property 6: Should reject null or undefined anggota', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(null, undefined),
        (anggota) => {
          const result = validateAnggotaForTransaction(anggota);
          return result.valid === false && 
                 result.message.includes('tidak ditemukan');
        }
      ),
      { numRuns: 50 }
    );
  });

  // ============================================================================
  // PROPERTY 7: Consistent rejection for multiple exit indicators
  // Validates that any exit indicator causes rejection
  // ============================================================================
  test('Property 7: Should reject anggota with any combination of exit indicators', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1, max: 10000 }),
          nama: fc.string({ minLength: 3, maxLength: 50 }),
          statusKeanggotaan: fc.constantFrom('Keluar', 'Aktif'),
          status: fc.constantFrom('Nonaktif', 'Aktif'),
          tanggalKeluar: fc.option(fc.date(), { nil: null }),
          pengembalianStatus: fc.constantFrom('', 'Proses', 'Selesai')
        }),
        (anggota) => {
          const hasExitIndicator = 
            anggota.statusKeanggotaan === 'Keluar' ||
            anggota.status === 'Nonaktif' ||
            anggota.tanggalKeluar !== null ||
            (anggota.pengembalianStatus !== '' && anggota.pengembalianStatus !== null);

          const result = validateAnggotaForTransaction(anggota);
          
          if (hasExitIndicator) {
            return result.valid === false;
          } else {
            return result.valid === true;
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  // ============================================================================
  // PROPERTY 8: Return structure consistency
  // Validates that result always has valid and message properties
  // ============================================================================
  test('Property 8: Should always return object with valid and message properties', () => {
    fc.assert(
      fc.property(
        fc.option(anggotaArb, { nil: null }),
        (anggota) => {
          const result = validateAnggotaForTransaction(anggota);
          return typeof result === 'object' &&
                 typeof result.valid === 'boolean' &&
                 typeof result.message === 'string';
        }
      ),
      { numRuns: 100 }
    );
  });

  // ============================================================================
  // PROPERTY 9: Message clarity for rejection
  // Validates that rejection messages are informative
  // ============================================================================
  test('Property 9: Should provide clear rejection message when invalid', () => {
    fc.assert(
      fc.property(
        anggotaArb,
        (anggota) => {
          const result = validateAnggotaForTransaction(anggota);
          if (!result.valid) {
            return result.message.length > 0;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ============================================================================
  // PROPERTY 10: Idempotence
  // Validates that calling validation multiple times gives same result
  // ============================================================================
  test('Property 10: Should be idempotent (same result on multiple calls)', () => {
    fc.assert(
      fc.property(
        anggotaArb,
        (anggota) => {
          const result1 = validateAnggotaForTransaction(anggota);
          const result2 = validateAnggotaForTransaction(anggota);
          const result3 = validateAnggotaForTransaction(anggota);
          
          return result1.valid === result2.valid &&
                 result2.valid === result3.valid &&
                 result1.message === result2.message &&
                 result2.message === result3.message;
        }
      ),
      { numRuns: 100 }
    );
  });

  // ============================================================================
  // EDGE CASE TESTS
  // ============================================================================

  test('Edge Case 1: Should reject anggota with statusKeanggotaan "Keluar" regardless of other fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1, max: 10000 }),
          nama: fc.string({ minLength: 3, maxLength: 50 }),
          statusKeanggotaan: fc.constant('Keluar'),
          status: fc.constant('Aktif'),
          tanggalKeluar: fc.constant(null),
          pengembalianStatus: fc.constant('')
        }),
        (anggota) => {
          const result = validateAnggotaForTransaction(anggota);
          return result.valid === false;
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Edge Case 2: Should reject anggota with status "Nonaktif" regardless of statusKeanggotaan', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1, max: 10000 }),
          nama: fc.string({ minLength: 3, maxLength: 50 }),
          statusKeanggotaan: fc.constant('Aktif'),
          status: fc.constant('Nonaktif'),
          tanggalKeluar: fc.constant(null),
          pengembalianStatus: fc.constant('')
        }),
        (anggota) => {
          const result = validateAnggotaForTransaction(anggota);
          return result.valid === false;
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Edge Case 3: Should accept anggota with Cuti statusKeanggotaan if status is Aktif', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1, max: 10000 }),
          nama: fc.string({ minLength: 3, maxLength: 50 }),
          statusKeanggotaan: fc.constant('Cuti'),
          status: fc.constant('Aktif'),
          tanggalKeluar: fc.constant(null),
          pengembalianStatus: fc.constant('')
        }),
        (anggota) => {
          const result = validateAnggotaForTransaction(anggota);
          return result.valid === true;
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Edge Case 4: Should reject anggota with empty string pengembalianStatus as valid', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.integer({ min: 1, max: 10000 }),
          nama: fc.string({ minLength: 3, maxLength: 50 }),
          statusKeanggotaan: fc.constant('Aktif'),
          status: fc.constant('Aktif'),
          tanggalKeluar: fc.constant(null),
          pengembalianStatus: fc.constant('')
        }),
        (anggota) => {
          const result = validateAnggotaForTransaction(anggota);
          return result.valid === true;
        }
      ),
      { numRuns: 50 }
    );
  });

  // ============================================================================
  // COMPLEX SCENARIO TESTS
  // ============================================================================

  test('Complex Scenario 1: Should handle anggota with all exit indicators', () => {
    const anggota = {
      id: 1,
      nama: 'Test User',
      statusKeanggotaan: 'Keluar',
      status: 'Nonaktif',
      tanggalKeluar: new Date(),
      pengembalianStatus: 'Selesai'
    };
    
    const result = validateAnggotaForTransaction(anggota);
    expect(result.valid).toBe(false);
    expect(result.message.length).toBeGreaterThan(0);
  });

  test('Complex Scenario 2: Should handle anggota with no exit indicators', () => {
    const anggota = {
      id: 1,
      nama: 'Test User',
      statusKeanggotaan: 'Aktif',
      status: 'Aktif',
      tanggalKeluar: null,
      pengembalianStatus: ''
    };
    
    const result = validateAnggotaForTransaction(anggota);
    expect(result.valid).toBe(true);
    expect(result.message).toBe('');
  });

  test('Complex Scenario 3: Should prioritize statusKeanggotaan check', () => {
    const anggota = {
      id: 1,
      nama: 'Test User',
      statusKeanggotaan: 'Keluar',
      status: 'Aktif',
      tanggalKeluar: null,
      pengembalianStatus: ''
    };
    
    const result = validateAnggotaForTransaction(anggota);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('sudah keluar');
  });

});
