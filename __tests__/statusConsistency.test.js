/**
 * Property-Based Test: Status Consistency for Exited Members
 * Feature: fix-status-anggota-keluar, Property 1: Status consistency for exited members
 * Validates: Requirements 1.2, 2.1
 * 
 * Property: For any anggota with tanggalKeluar field populated, the status field should always be "Nonaktif"
 */

import fc from 'fast-check';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock localStorage
const localStorageMock = (() => {
	let store = {};
	return {
		getItem: (key) => store[key] || null,
		setItem: (key, value) => {
			store[key] = value.toString();
		},
		removeItem: (key) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		},
	};
})();

global.localStorage = localStorageMock;

// Mock console.log to reduce noise during tests
const originalConsoleLog = console.log;
beforeAll(() => {
	console.log = () => {}; // Silent mock
});

afterAll(() => {
	console.log = originalConsoleLog;
});

// Import the migration function
const migrationCode = fs.readFileSync(
	path.join(__dirname, '../js/dataMigration.js'),
	'utf8'
);

// Create a function wrapper to execute the migration code
const createMigrationFunction = () => {
	const func = new Function(
		migrationCode + '\nreturn migrateAnggotaKeluarStatus;'
	);
	return func();
};

const migrateAnggotaKeluarStatus = createMigrationFunction();

describe('Property 1: Status Consistency for Exited Members', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	test('For any anggota with tanggalKeluar, status should be Nonaktif after migration', () => {
		fc.assert(
			fc.property(
				// Generate array of anggota with tanggalKeluar
				fc.array(
					fc.record({
						id: fc.uuid(),
						nik: fc
							.stringOf(fc.integer(0, 9).map((n) => n.toString()), {
								minLength: 16,
								maxLength: 16,
							}),
						nama: fc
							.string({ minLength: 5, maxLength: 50 })
							.filter((s) => s.trim().length > 0),
						status: fc.constantFrom('Aktif', 'Nonaktif', 'Cuti'), // Any status initially
						tanggalKeluar: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString().split('T')[0]), // Always has tanggalKeluar
						alasanKeluar: fc.option(
							fc.string({ minLength: 5, maxLength: 100 }),
							{ nil: null }
						),
						departemen: fc.constantFrom('IT', 'Finance', 'HR', 'Operations'),
						tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota', 'Umum'),
					}),
					{ minLength: 1, maxLength: 20 }
				),
				(anggotaList) => {
					// Setup: Store initial data
					localStorage.setItem('anggota', JSON.stringify(anggotaList));

					// Execute: Run migration
					const result = migrateAnggotaKeluarStatus();

					// Get data after migration
					const anggotaAfter = JSON.parse(localStorage.getItem('anggota'));

					// Assertion 1: Migration should succeed
					const migrationSucceeded = result.success;

					// Assertion 2: All anggota with tanggalKeluar should have status 'Nonaktif'
					const allNonaktif = anggotaAfter.every(
						(a) => a.tanggalKeluar && a.status === 'Nonaktif'
					);

					// Assertion 3: Count of fixed records should match anggota with wrong status
					const wrongStatusCount = anggotaList.filter(
						(a) => a.tanggalKeluar && a.status !== 'Nonaktif'
					).length;
					const fixedCountMatches = result.fixed === wrongStatusCount;

					return migrationSucceeded && allNonaktif && fixedCountMatches;
				}
			),
			{ numRuns: 100 }
		);
	});

	test('For any anggota with pengembalianStatus, status should be Nonaktif after migration', () => {
		fc.assert(
			fc.property(
				fc.array(
					fc.record({
						id: fc.uuid(),
						nik: fc
							.stringOf(fc.integer(0, 9).map((n) => n.toString()), {
								minLength: 16,
								maxLength: 16,
							}),
						nama: fc
							.string({ minLength: 5, maxLength: 50 })
							.filter((s) => s.trim().length > 0),
						status: fc.constantFrom('Aktif', 'Nonaktif', 'Cuti'),
						pengembalianStatus: fc.constantFrom('Pending', 'Selesai'), // Always has pengembalianStatus
						tanggalKeluar: fc.option(
							fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString().split('T')[0]),
							{ nil: null }
						),
						departemen: fc.constantFrom('IT', 'Finance', 'HR', 'Operations'),
						tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota', 'Umum'),
					}),
					{ minLength: 1, maxLength: 20 }
				),
				(anggotaList) => {
					// Setup
					localStorage.setItem('anggota', JSON.stringify(anggotaList));

					// Execute
					const result = migrateAnggotaKeluarStatus();
					const anggotaAfter = JSON.parse(localStorage.getItem('anggota'));

					// All anggota with pengembalianStatus should have status 'Nonaktif'
					const allNonaktif = anggotaAfter.every(
						(a) => a.pengembalianStatus && a.status === 'Nonaktif'
					);

					return result.success && allNonaktif;
				}
			),
			{ numRuns: 100 }
		);
	});

	test('For any anggota with legacy statusKeanggotaan=Keluar, status should be Nonaktif after migration', () => {
		fc.assert(
			fc.property(
				fc.array(
					fc.record({
						id: fc.uuid(),
						nik: fc
							.stringOf(fc.integer(0, 9).map((n) => n.toString()), {
								minLength: 16,
								maxLength: 16,
							}),
						nama: fc
							.string({ minLength: 5, maxLength: 50 })
							.filter((s) => s.trim().length > 0),
						status: fc.constantFrom('Aktif', 'Nonaktif', 'Cuti'),
						statusKeanggotaan: fc.constant('Keluar'), // Always has legacy field
						departemen: fc.constantFrom('IT', 'Finance', 'HR', 'Operations'),
						tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota', 'Umum'),
					}),
					{ minLength: 1, maxLength: 20 }
				),
				(anggotaList) => {
					// Setup
					localStorage.setItem('anggota', JSON.stringify(anggotaList));

					// Execute
					const result = migrateAnggotaKeluarStatus();
					const anggotaAfter = JSON.parse(localStorage.getItem('anggota'));

					// All should have status 'Nonaktif' and no statusKeanggotaan field
					const allCorrect = anggotaAfter.every(
						(a) =>
							a.status === 'Nonaktif' &&
							!a.hasOwnProperty('statusKeanggotaan')
					);

					return result.success && allCorrect;
				}
			),
			{ numRuns: 100 }
		);
	});

	test('For any anggota without exit indicators, status should remain unchanged', () => {
		fc.assert(
			fc.property(
				fc.array(
					fc.record({
						id: fc.uuid(),
						nik: fc
							.stringOf(fc.integer(0, 9).map((n) => n.toString()), {
								minLength: 16,
								maxLength: 16,
							}),
						nama: fc
							.string({ minLength: 5, maxLength: 50 })
							.filter((s) => s.trim().length > 0),
						status: fc.constantFrom('Aktif', 'Nonaktif', 'Cuti'),
						// No tanggalKeluar, no pengembalianStatus, no statusKeanggotaan
						departemen: fc.constantFrom('IT', 'Finance', 'HR', 'Operations'),
						tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota', 'Umum'),
					}),
					{ minLength: 1, maxLength: 20 }
				),
				(anggotaList) => {
					// Setup
					const originalStatuses = anggotaList.map((a) => ({
						id: a.id,
						status: a.status,
					}));
					localStorage.setItem('anggota', JSON.stringify(anggotaList));

					// Execute
					const result = migrateAnggotaKeluarStatus();
					const anggotaAfter = JSON.parse(localStorage.getItem('anggota'));

					// Status should remain unchanged for all
					const statusesUnchanged = anggotaAfter.every((a) => {
						const original = originalStatuses.find((o) => o.id === a.id);
						return original && a.status === original.status;
					});

					// Should fix nothing
					const fixedNothing = result.fixed === 0;

					return result.success && statusesUnchanged && fixedNothing;
				}
			),
			{ numRuns: 100 }
		);
	});

	test('For any mixed anggota list, only those with exit indicators should become Nonaktif', () => {
		fc.assert(
			fc.property(
				fc.array(
					fc.record({
						id: fc.uuid(),
						nik: fc
							.stringOf(fc.integer(0, 9).map((n) => n.toString()), {
								minLength: 16,
								maxLength: 16,
							}),
						nama: fc
							.string({ minLength: 5, maxLength: 50 })
							.filter((s) => s.trim().length > 0),
						status: fc.constantFrom('Aktif', 'Nonaktif', 'Cuti'),
						// Random exit indicators
						tanggalKeluar: fc.option(
							fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString().split('T')[0]),
							{ nil: null }
						),
						pengembalianStatus: fc.option(
							fc.constantFrom('Pending', 'Selesai'),
							{ nil: null }
						),
						statusKeanggotaan: fc.option(fc.constant('Keluar'), { nil: null }),
						departemen: fc.constantFrom('IT', 'Finance', 'HR', 'Operations'),
						tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota', 'Umum'),
					}),
					{ minLength: 5, maxLength: 30 }
				),
				(anggotaList) => {
					// Setup
					localStorage.setItem('anggota', JSON.stringify(anggotaList));

					// Identify which anggota should be Nonaktif
					const shouldBeNonaktif = anggotaList.map((a) => ({
						id: a.id,
						shouldBeNonaktif:
							!!a.tanggalKeluar ||
							!!a.pengembalianStatus ||
							a.statusKeanggotaan === 'Keluar',
					}));

					// Execute
					const result = migrateAnggotaKeluarStatus();
					const anggotaAfter = JSON.parse(localStorage.getItem('anggota'));

					// Check each anggota
					const allCorrect = anggotaAfter.every((a) => {
						const expected = shouldBeNonaktif.find((s) => s.id === a.id);
						if (!expected) return false;

						if (expected.shouldBeNonaktif) {
							// Should be Nonaktif
							return a.status === 'Nonaktif';
						} else {
							// Status should be unchanged (could be any valid status)
							return ['Aktif', 'Nonaktif', 'Cuti'].includes(a.status);
						}
					});

					return result.success && allCorrect;
				}
			),
			{ numRuns: 100 }
		);
	});

	test('Status consistency should be maintained across different date formats', () => {
		fc.assert(
			fc.property(
				fc.array(
					fc.record({
						id: fc.uuid(),
						nik: fc
							.stringOf(fc.integer(0, 9).map((n) => n.toString()), {
								minLength: 16,
								maxLength: 16,
							}),
						nama: fc
							.string({ minLength: 5, maxLength: 50 })
							.filter((s) => s.trim().length > 0),
						status: fc.constantFrom('Aktif', 'Cuti'), // Not Nonaktif initially
						// Various date formats (all should trigger migration)
						tanggalKeluar: fc.constantFrom(
							'2024-01-15',
							'2024-12-01',
							'2023-06-30',
							'2024-11-20'
						),
						departemen: fc.constantFrom('IT', 'Finance', 'HR', 'Operations'),
						tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota', 'Umum'),
					}),
					{ minLength: 1, maxLength: 15 }
				),
				(anggotaList) => {
					// Setup
					localStorage.setItem('anggota', JSON.stringify(anggotaList));

					// Execute
					const result = migrateAnggotaKeluarStatus();
					const anggotaAfter = JSON.parse(localStorage.getItem('anggota'));

					// All should be Nonaktif regardless of date format
					const allNonaktif = anggotaAfter.every(
						(a) => a.status === 'Nonaktif'
					);

					// All should have been fixed (none were Nonaktif initially)
					const allFixed = result.fixed === anggotaList.length;

					return result.success && allNonaktif && allFixed;
				}
			),
			{ numRuns: 100 }
		);
	});

	test('Status consistency with multiple exit indicators should still result in Nonaktif', () => {
		fc.assert(
			fc.property(
				fc.array(
					fc.record({
						id: fc.uuid(),
						nik: fc
							.stringOf(fc.integer(0, 9).map((n) => n.toString()), {
								minLength: 16,
								maxLength: 16,
							}),
						nama: fc
							.string({ minLength: 5, maxLength: 50 })
							.filter((s) => s.trim().length > 0),
						status: fc.constantFrom('Aktif', 'Cuti'), // Wrong status
						// Multiple exit indicators
						tanggalKeluar: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString().split('T')[0]),
						pengembalianStatus: fc.constantFrom('Pending', 'Selesai'),
						statusKeanggotaan: fc.constant('Keluar'),
						alasanKeluar: fc.string({ minLength: 10, maxLength: 100 }),
						departemen: fc.constantFrom('IT', 'Finance', 'HR', 'Operations'),
						tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota', 'Umum'),
					}),
					{ minLength: 1, maxLength: 10 }
				),
				(anggotaList) => {
					// Setup
					localStorage.setItem('anggota', JSON.stringify(anggotaList));

					// Execute
					const result = migrateAnggotaKeluarStatus();
					const anggotaAfter = JSON.parse(localStorage.getItem('anggota'));

					// All should be Nonaktif
					const allNonaktif = anggotaAfter.every(
						(a) => a.status === 'Nonaktif'
					);

					// All should have no statusKeanggotaan field
					const noLegacyField = anggotaAfter.every(
						(a) => !a.hasOwnProperty('statusKeanggotaan')
					);

					// All should have been fixed
					const allFixed = result.fixed === anggotaList.length;

					return result.success && allNonaktif && noLegacyField && allFixed;
				}
			),
			{ numRuns: 100 }
		);
	});
});
