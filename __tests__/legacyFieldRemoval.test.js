/**
 * Property-Based Test: Legacy Field Removal
 * Feature: fix-status-anggota-keluar, Property 2: Legacy field removal
 * Validates: Requirements 2.2, 2.3
 * 
 * Property: For any anggota after migration, the statusKeanggotaan field should not exist
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

describe('Property 2: Legacy Field Removal', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	test('For any anggota with statusKeanggotaan field, it should be removed after migration', () => {
		fc.assert(
			fc.property(
				// Generate array of anggota with statusKeanggotaan field
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
						statusKeanggotaan: fc.constantFrom('Aktif', 'Keluar', 'Cuti'), // Legacy field with various values
						departemen: fc.constantFrom('IT', 'Finance', 'HR', 'Operations'),
						tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota', 'Umum'),
					}),
					{ minLength: 1, maxLength: 20 }
				),
				(anggotaList) => {
					// Setup: All anggota have statusKeanggotaan field
					localStorage.setItem('anggota', JSON.stringify(anggotaList));

					// Execute: Run migration
					const result = migrateAnggotaKeluarStatus();

					// Get data after migration
					const anggotaAfter = JSON.parse(localStorage.getItem('anggota'));

					// Assertion 1: Migration should succeed
					const migrationSucceeded = result.success;

					// Assertion 2: No anggota should have statusKeanggotaan field
					const noLegacyField = anggotaAfter.every(
						(a) => !a.hasOwnProperty('statusKeanggotaan')
					);

					// Assertion 3: All anggota should still have required fields
					const allHaveRequiredFields = anggotaAfter.every(
						(a) => a.id && a.nik && a.nama && a.status
					);

					return migrationSucceeded && noLegacyField && allHaveRequiredFields;
				}
			),
			{ numRuns: 100 }
		);
	});

	test('For any anggota without statusKeanggotaan field, migration should not add it', () => {
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
						// No statusKeanggotaan field
						departemen: fc.constantFrom('IT', 'Finance', 'HR', 'Operations'),
						tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota', 'Umum'),
					}),
					{ minLength: 1, maxLength: 20 }
				),
				(anggotaList) => {
					// Setup: No anggota has statusKeanggotaan field
					localStorage.setItem('anggota', JSON.stringify(anggotaList));

					// Execute
					const result = migrateAnggotaKeluarStatus();
					const anggotaAfter = JSON.parse(localStorage.getItem('anggota'));

					// No anggota should have statusKeanggotaan field
					const noLegacyField = anggotaAfter.every(
						(a) => !a.hasOwnProperty('statusKeanggotaan')
					);

					// Should fix nothing (no legacy field to remove)
					const fixedNothing = result.fixed === 0;

					return result.success && noLegacyField && fixedNothing;
				}
			),
			{ numRuns: 100 }
		);
	});

	test('For mixed anggota list (some with, some without statusKeanggotaan), all should have it removed', () => {
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
						// Random: some have statusKeanggotaan, some don't
						statusKeanggotaan: fc.option(
							fc.constantFrom('Aktif', 'Keluar', 'Cuti'),
							{ nil: null }
						),
						departemen: fc.constantFrom('IT', 'Finance', 'HR', 'Operations'),
						tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota', 'Umum'),
					}),
					{ minLength: 5, maxLength: 30 }
				),
				(anggotaList) => {
					// Setup
					localStorage.setItem('anggota', JSON.stringify(anggotaList));

					// Count how many have statusKeanggotaan
					const countWithLegacy = anggotaList.filter(
						(a) => a.statusKeanggotaan !== null
					).length;

					// Execute
					const result = migrateAnggotaKeluarStatus();
					const anggotaAfter = JSON.parse(localStorage.getItem('anggota'));

					// No anggota should have statusKeanggotaan field
					const noLegacyField = anggotaAfter.every(
						(a) => !a.hasOwnProperty('statusKeanggotaan')
					);

					// Fixed count should be at least the count with legacy field
					// (might be more if they also have wrong status)
					const fixedCountReasonable = result.fixed >= countWithLegacy;

					return result.success && noLegacyField && fixedCountReasonable;
				}
			),
			{ numRuns: 100 }
		);
	});

	test('Legacy field removal should not affect other fields', () => {
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
						statusKeanggotaan: fc.constantFrom('Aktif', 'Keluar'),
						departemen: fc.constantFrom('IT', 'Finance', 'HR', 'Operations'),
						tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota', 'Umum'),
						telepon: fc.option(
							fc.string({ minLength: 10, maxLength: 15 }),
							{ nil: null }
						),
						email: fc.option(fc.emailAddress(), { nil: null }),
						alamat: fc.option(
							fc.string({ minLength: 10, maxLength: 100 }),
							{ nil: null }
						),
					}),
					{ minLength: 1, maxLength: 15 }
				),
				(anggotaList) => {
					// Setup: Store original data (except statusKeanggotaan)
					const originalData = anggotaList.map((a) => ({
						id: a.id,
						nik: a.nik,
						nama: a.nama,
						departemen: a.departemen,
						tipeAnggota: a.tipeAnggota,
						telepon: a.telepon,
						email: a.email,
						alamat: a.alamat,
					}));

					localStorage.setItem('anggota', JSON.stringify(anggotaList));

					// Execute
					migrateAnggotaKeluarStatus();
					const anggotaAfter = JSON.parse(localStorage.getItem('anggota'));

					// Check that other fields are preserved
					const fieldsPreserved = anggotaAfter.every((a) => {
						const original = originalData.find((o) => o.id === a.id);
						if (!original) return false;

						return (
							a.nik === original.nik &&
							a.nama === original.nama &&
							a.departemen === original.departemen &&
							a.tipeAnggota === original.tipeAnggota &&
							a.telepon === original.telepon &&
							a.email === original.email &&
							a.alamat === original.alamat
						);
					});

					// statusKeanggotaan should be removed
					const legacyFieldRemoved = anggotaAfter.every(
						(a) => !a.hasOwnProperty('statusKeanggotaan')
					);

					return fieldsPreserved && legacyFieldRemoved;
				}
			),
			{ numRuns: 100 }
		);
	});

	test('Legacy field removal should work with various statusKeanggotaan values', () => {
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
						// Various possible values for legacy field
						statusKeanggotaan: fc.constantFrom(
							'Aktif',
							'Keluar',
							'Cuti',
							'Nonaktif',
							'Pending',
							'Unknown'
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

					// All statusKeanggotaan values should be removed, regardless of value
					const allRemoved = anggotaAfter.every(
						(a) => !a.hasOwnProperty('statusKeanggotaan')
					);

					return result.success && allRemoved;
				}
			),
			{ numRuns: 100 }
		);
	});

	test('Legacy field removal should work even with null or undefined values', () => {
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
						// statusKeanggotaan with null/undefined/actual values
						statusKeanggotaan: fc.option(
							fc.constantFrom('Aktif', 'Keluar'),
							{ nil: null }
						),
						departemen: fc.constantFrom('IT', 'Finance', 'HR', 'Operations'),
						tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota', 'Umum'),
					}),
					{ minLength: 1, maxLength: 20 }
				),
				(anggotaList) => {
					// Setup: Manually add some with undefined
					const modifiedList = anggotaList.map((a, i) => {
						if (i % 3 === 0 && a.statusKeanggotaan === null) {
							// Add statusKeanggotaan as undefined for some
							return { ...a, statusKeanggotaan: undefined };
						}
						return a;
					});

					localStorage.setItem('anggota', JSON.stringify(modifiedList));

					// Execute
					const result = migrateAnggotaKeluarStatus();
					const anggotaAfter = JSON.parse(localStorage.getItem('anggota'));

					// No anggota should have statusKeanggotaan property
					const noLegacyField = anggotaAfter.every(
						(a) => !a.hasOwnProperty('statusKeanggotaan')
					);

					return result.success && noLegacyField;
				}
			),
			{ numRuns: 100 }
		);
	});

	test('After legacy field removal, object should be clean (no undefined properties)', () => {
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
						statusKeanggotaan: fc.constantFrom('Aktif', 'Keluar', 'Cuti'),
						departemen: fc.constantFrom('IT', 'Finance', 'HR', 'Operations'),
						tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota', 'Umum'),
					}),
					{ minLength: 1, maxLength: 15 }
				),
				(anggotaList) => {
					// Setup
					localStorage.setItem('anggota', JSON.stringify(anggotaList));

					// Execute
					migrateAnggotaKeluarStatus();
					const anggotaAfter = JSON.parse(localStorage.getItem('anggota'));

					// Check that no anggota has statusKeanggotaan in any form
					const allClean = anggotaAfter.every((a) => {
						// Check using hasOwnProperty
						const noProperty = !a.hasOwnProperty('statusKeanggotaan');

						// Check using Object.keys
						const notInKeys = !Object.keys(a).includes('statusKeanggotaan');

						// Check direct access
						const isUndefined = a.statusKeanggotaan === undefined;

						return noProperty && notInKeys && isUndefined;
					});

					return allClean;
				}
			),
			{ numRuns: 100 }
		);
	});

	test('Legacy field removal should be consistent across serialization', () => {
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
						statusKeanggotaan: fc.constantFrom('Aktif', 'Keluar'),
						departemen: fc.constantFrom('IT', 'Finance', 'HR', 'Operations'),
						tipeAnggota: fc.constantFrom('Anggota', 'Non-Anggota', 'Umum'),
					}),
					{ minLength: 1, maxLength: 10 }
				),
				(anggotaList) => {
					// Setup
					localStorage.setItem('anggota', JSON.stringify(anggotaList));

					// Execute
					migrateAnggotaKeluarStatus();

					// Get data and re-serialize
					const anggotaAfter = JSON.parse(localStorage.getItem('anggota'));
					const serialized = JSON.stringify(anggotaAfter);

					// Parse again
					const reParsed = JSON.parse(serialized);

					// Check that statusKeanggotaan is not in serialized string
					const notInSerialized = !serialized.includes('statusKeanggotaan');

					// Check that re-parsed data also doesn't have the field
					const notInReParsed = reParsed.every(
						(a) => !a.hasOwnProperty('statusKeanggotaan')
					);

					return notInSerialized && notInReParsed;
				}
			),
			{ numRuns: 100 }
		);
	});
});
