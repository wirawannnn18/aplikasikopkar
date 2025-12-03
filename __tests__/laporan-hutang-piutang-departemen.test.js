/**
 * Property-Based Tests for Laporan Hutang Piutang dengan Departemen
 * 
 * Feature: laporan-hutang-piutang-departemen
 * 
 * These tests validate the correctness properties defined in the design document.
 */

// Mock localStorage for testing
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();

global.localStorage = localStorageMock;

// Mock formatRupiah function
global.formatRupiah = (amount) => {
    return 'Rp ' + amount.toLocaleString('id-ID');
};

// Helper function to generate random ID
function generateId() {
    return 'id-' + Math.random().toString(36).substr(2, 9);
}

// Generator: Random department
function generateDepartment() {
    const names = ['IT', 'Finance', 'Marketing', 'HR', 'Operations', 'Sales', 'Legal', 'Admin'];
    const name = names[Math.floor(Math.random() * names.length)];
    return {
        id: generateId(),
        nama: name,
        kode: name.substring(0, 3).toUpperCase()
    };
}

// Generator: Random member with department
function generateMember(departemenId = null) {
    const names = ['Ahmad', 'Budi', 'Citra', 'Dedi', 'Eka', 'Fitri', 'Gani', 'Hani'];
    const name = names[Math.floor(Math.random() * names.length)] + ' ' + generateId().substring(0, 5);
    return {
        id: generateId(),
        nik: String(Math.floor(Math.random() * 10000)).padStart(4, '0'),
        nama: name,
        departemen: departemenId,
        noKartu: 'K' + String(Math.floor(Math.random() * 10000)).padStart(4, '0'),
        status: 'Aktif'
    };
}

// Generator: Random penjualan (kredit)
function generatePenjualan(anggotaId) {
    return {
        id: generateId(),
        anggotaId: anggotaId,
        total: Math.floor(Math.random() * 2000000) + 100000,
        status: Math.random() > 0.3 ? 'kredit' : 'lunas',
        tanggal: '2024-01-' + String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')
    };
}

// Function to extract department join logic (extracted from laporanHutangPiutang)
function joinMemberWithDepartment(member, departemenList) {
    let departemenNama = '-';
    if (member.departemen) {
        const dept = departemenList.find(d => d.id === member.departemen || d.nama === member.departemen);
        if (dept) {
            departemenNama = dept.nama;
        } else {
            departemenNama = member.departemen;
        }
    }
    return departemenNama;
}

// Function to calculate total hutang
function calculateTotalHutang(anggotaId, penjualanList) {
    return penjualanList
        .filter(p => p.anggotaId === anggotaId && p.status === 'kredit')
        .reduce((sum, p) => sum + p.total, 0);
}

/**
 * Property 2: Department Data Join Correctness
 * 
 * For any set of members with assigned departments, retrieving and joining 
 * department information should result in each member having the correct 
 * department name from the departemen master data.
 * 
 * Validates: Requirements 1.3
 */
describe('Property 2: Department Data Join Correctness', () => {
    const NUM_ITERATIONS = 100; // Run 100 random test cases

    test('should correctly join member with department data for all valid department IDs', () => {
        let passedIterations = 0;
        const failures = [];

        for (let i = 0; i < NUM_ITERATIONS; i++) {
            // Generate random test data
            const numDepartments = Math.floor(Math.random() * 5) + 2; // 2-6 departments
            const departments = Array.from({ length: numDepartments }, () => generateDepartment());
            
            const numMembers = Math.floor(Math.random() * 10) + 1; // 1-10 members
            const members = Array.from({ length: numMembers }, () => {
                // 80% chance of having a valid department
                const hasDepartment = Math.random() > 0.2;
                const departemenId = hasDepartment 
                    ? departments[Math.floor(Math.random() * departments.length)].id 
                    : null;
                return generateMember(departemenId);
            });

            // Test the join logic
            let iterationPassed = true;
            for (const member of members) {
                const resultDepartemen = joinMemberWithDepartment(member, departments);
                
                if (member.departemen) {
                    // Member has department assigned
                    const expectedDept = departments.find(d => d.id === member.departemen);
                    if (expectedDept) {
                        // Should match the department name
                        if (resultDepartemen !== expectedDept.nama) {
                            iterationPassed = false;
                            failures.push({
                                iteration: i,
                                member: member.nama,
                                memberId: member.id,
                                departemenId: member.departemen,
                                expected: expectedDept.nama,
                                actual: resultDepartemen
                            });
                        }
                    }
                } else {
                    // Member has no department, should show "-"
                    if (resultDepartemen !== '-') {
                        iterationPassed = false;
                        failures.push({
                            iteration: i,
                            member: member.nama,
                            memberId: member.id,
                            departemenId: null,
                            expected: '-',
                            actual: resultDepartemen
                        });
                    }
                }
            }

            if (iterationPassed) {
                passedIterations++;
            }
        }

        // Report results
        console.log(`Property 2 Test Results: ${passedIterations}/${NUM_ITERATIONS} iterations passed`);
        if (failures.length > 0) {
            console.log('Failures:', failures.slice(0, 5)); // Show first 5 failures
        }

        expect(passedIterations).toBe(NUM_ITERATIONS);
    });

    test('should handle members with non-existent department IDs gracefully', () => {
        let passedIterations = 0;

        for (let i = 0; i < NUM_ITERATIONS; i++) {
            const departments = Array.from({ length: 3 }, () => generateDepartment());
            
            // Create member with non-existent department ID
            const member = generateMember('non-existent-dept-id');
            
            const resultDepartemen = joinMemberWithDepartment(member, departments);
            
            // Should fallback to the departemen value from member
            if (resultDepartemen === member.departemen) {
                passedIterations++;
            }
        }

        console.log(`Non-existent dept test: ${passedIterations}/${NUM_ITERATIONS} iterations passed`);
        expect(passedIterations).toBe(NUM_ITERATIONS);
    });

    test('should handle empty department list gracefully', () => {
        let passedIterations = 0;

        for (let i = 0; i < NUM_ITERATIONS; i++) {
            const departments = []; // Empty department list
            const member = generateMember('some-dept-id');
            
            const resultDepartemen = joinMemberWithDepartment(member, departments);
            
            // Should fallback to member's departemen value
            if (resultDepartemen === member.departemen) {
                passedIterations++;
            }
        }

        console.log(`Empty dept list test: ${passedIterations}/${NUM_ITERATIONS} iterations passed`);
        expect(passedIterations).toBe(NUM_ITERATIONS);
    });

    test('should handle department matching by name as well as ID', () => {
        let passedIterations = 0;

        for (let i = 0; i < NUM_ITERATIONS; i++) {
            const dept = generateDepartment();
            const departments = [dept];
            
            // Create member with department name instead of ID
            const member = generateMember(dept.nama);
            
            const resultDepartemen = joinMemberWithDepartment(member, departments);
            
            // Should match by name
            if (resultDepartemen === dept.nama) {
                passedIterations++;
            }
        }

        console.log(`Match by name test: ${passedIterations}/${NUM_ITERATIONS} iterations passed`);
        expect(passedIterations).toBe(NUM_ITERATIONS);
    });
});

/**
 * Property 1: Department Column Completeness
 * 
 * For any member displayed in the hutang piutang report, the rendered row 
 * should contain a department value that either matches the member's department 
 * from master anggota data or displays "-" for members without departments.
 * 
 * Validates: Requirements 1.1, 1.3
 */
describe('Property 1: Department Column Completeness', () => {
    const NUM_ITERATIONS = 100;

    test('should ensure every member has a department value (never null/undefined)', () => {
        let passedIterations = 0;

        for (let i = 0; i < NUM_ITERATIONS; i++) {
            const numDepartments = Math.floor(Math.random() * 5) + 2;
            const departments = Array.from({ length: numDepartments }, () => generateDepartment());
            
            const numMembers = Math.floor(Math.random() * 20) + 1;
            const members = Array.from({ length: numMembers }, () => {
                const hasDepartment = Math.random() > 0.3;
                const departemenId = hasDepartment 
                    ? departments[Math.floor(Math.random() * departments.length)].id 
                    : null;
                return generateMember(departemenId);
            });

            // Check all members have department value
            let allHaveValue = true;
            for (const member of members) {
                const deptValue = joinMemberWithDepartment(member, departments);
                if (deptValue === null || deptValue === undefined || deptValue === '') {
                    allHaveValue = false;
                    break;
                }
            }

            if (allHaveValue) {
                passedIterations++;
            }
        }

        console.log(`Department completeness test: ${passedIterations}/${NUM_ITERATIONS} iterations passed`);
        expect(passedIterations).toBe(NUM_ITERATIONS);
    });
});

/**
 * Additional Unit Tests for Edge Cases
 */
describe('Edge Cases for Department Join', () => {
    test('should return "-" for member with null department', () => {
        const departments = [generateDepartment()];
        const member = generateMember(null);
        
        const result = joinMemberWithDepartment(member, departments);
        expect(result).toBe('-');
    });

    test('should return "-" for member with undefined department', () => {
        const departments = [generateDepartment()];
        const member = generateMember();
        member.departemen = undefined;
        
        const result = joinMemberWithDepartment(member, departments);
        expect(result).toBe('-');
    });

    test('should return "-" for member with empty string department', () => {
        const departments = [generateDepartment()];
        const member = generateMember('');
        
        const result = joinMemberWithDepartment(member, departments);
        expect(result).toBe('-');
    });

    test('should correctly match department by ID', () => {
        const dept = { id: 'dept-123', nama: 'IT Department', kode: 'IT' };
        const departments = [dept];
        const member = generateMember('dept-123');
        
        const result = joinMemberWithDepartment(member, departments);
        expect(result).toBe('IT Department');
    });

    test('should correctly match department by name', () => {
        const dept = { id: 'dept-123', nama: 'IT Department', kode: 'IT' };
        const departments = [dept];
        const member = generateMember('IT Department');
        
        const result = joinMemberWithDepartment(member, departments);
        expect(result).toBe('IT Department');
    });

    test('should fallback to member departemen value if not found in master', () => {
        const departments = [{ id: 'dept-1', nama: 'Finance', kode: 'FIN' }];
        const member = generateMember('Unknown Department');
        
        const result = joinMemberWithDepartment(member, departments);
        expect(result).toBe('Unknown Department');
    });
});

// Helper function to extract unique departments from report data
// Moved to global scope for reuse across test suites
function getUniqueDepartments(reportData) {
    return [...new Set(reportData.map(d => d.departemen))].filter(d => d !== '-');
}

// Helper function to simulate filter by department
function filterByDepartment(reportData, departmentName) {
    if (departmentName === '') {
        return reportData; // Show all
    }
    return reportData.filter(data => data.departemen === departmentName);
}

// Helper function to create report data structure (mimics laporanHutangPiutang logic)
// Moved to global scope for reuse across test suites
function createReportData(member, departemenList, penjualanList) {
    let departemenNama = '-';
    if (member.departemen) {
        const dept = departemenList.find(d => d.id === member.departemen || d.nama === member.departemen);
        if (dept) {
            departemenNama = dept.nama;
        } else {
            departemenNama = member.departemen;
        }
    }
    
    const totalHutang = calculateTotalHutang(member.id, penjualanList);
    
    return {
        anggotaId: member.id,
        nik: member.nik || '-',
        nama: member.nama,
        departemen: departemenNama,
        departemenId: member.departemen || '',
        totalHutang: totalHutang,
        status: totalHutang > 0 ? 'Belum Lunas' : 'Lunas'
    };
}

/**
 * Property 3: Row Structure Completeness
 * 
 * For any member with outstanding debt, the rendered table row should contain 
 * all required fields: NIK, member name, department, total debt amount, and payment status.
 * 
 * Validates: Requirements 1.4
 */
describe('Property 3: Row Structure Completeness', () => {
    const NUM_ITERATIONS = 100;

    test('should include all required fields for any member with debt', () => {
        let passedIterations = 0;
        const failures = [];

        for (let i = 0; i < NUM_ITERATIONS; i++) {
            // Generate random test data
            const numDepartments = Math.floor(Math.random() * 5) + 2;
            const departments = Array.from({ length: numDepartments }, () => generateDepartment());
            
            const numMembers = Math.floor(Math.random() * 10) + 1;
            const members = Array.from({ length: numMembers }, () => {
                const hasDepartment = Math.random() > 0.2;
                const departemenId = hasDepartment 
                    ? departments[Math.floor(Math.random() * departments.length)].id 
                    : null;
                return generateMember(departemenId);
            });

            // Generate penjualan for each member (some with debt)
            const penjualan = [];
            members.forEach(member => {
                const numTransactions = Math.floor(Math.random() * 3);
                for (let j = 0; j < numTransactions; j++) {
                    penjualan.push(generatePenjualan(member.id));
                }
            });

            // Test each member's report data structure
            let iterationPassed = true;
            for (const member of members) {
                const reportData = createReportData(member, departments, penjualan);
                
                // Check all required fields exist
                const hasNIK = reportData.nik !== null && reportData.nik !== undefined;
                const hasNama = reportData.nama !== null && reportData.nama !== undefined && reportData.nama !== '';
                const hasDepartemen = reportData.departemen !== null && reportData.departemen !== undefined && reportData.departemen !== '';
                const hasTotalHutang = reportData.totalHutang !== null && reportData.totalHutang !== undefined && typeof reportData.totalHutang === 'number';
                const hasStatus = reportData.status !== null && reportData.status !== undefined && reportData.status !== '';
                
                if (!hasNIK || !hasNama || !hasDepartemen || !hasTotalHutang || !hasStatus) {
                    iterationPassed = false;
                    failures.push({
                        iteration: i,
                        member: member.nama,
                        missing: {
                            nik: !hasNIK,
                            nama: !hasNama,
                            departemen: !hasDepartemen,
                            totalHutang: !hasTotalHutang,
                            status: !hasStatus
                        },
                        reportData: reportData
                    });
                }
            }

            if (iterationPassed) {
                passedIterations++;
            }
        }

        console.log(`Row structure completeness test: ${passedIterations}/${NUM_ITERATIONS} iterations passed`);
        if (failures.length > 0) {
            console.log('Failures:', failures.slice(0, 3));
        }

        expect(passedIterations).toBe(NUM_ITERATIONS);
    });

    test('should ensure NIK field is never empty (shows "-" if missing)', () => {
        let passedIterations = 0;

        for (let i = 0; i < NUM_ITERATIONS; i++) {
            const departments = [generateDepartment()];
            const member = generateMember(departments[0].id);
            
            // Test with NIK
            member.nik = '12345';
            let reportData = createReportData(member, departments, []);
            let hasValidNIK = reportData.nik === '12345';
            
            // Test without NIK
            member.nik = null;
            reportData = createReportData(member, departments, []);
            hasValidNIK = hasValidNIK && reportData.nik === '-';
            
            // Test with empty NIK
            member.nik = '';
            reportData = createReportData(member, departments, []);
            hasValidNIK = hasValidNIK && reportData.nik === '-';
            
            if (hasValidNIK) {
                passedIterations++;
            }
        }

        console.log(`NIK field handling test: ${passedIterations}/${NUM_ITERATIONS} iterations passed`);
        expect(passedIterations).toBe(NUM_ITERATIONS);
    });

    test('should ensure status field correctly reflects debt state', () => {
        let passedIterations = 0;

        for (let i = 0; i < NUM_ITERATIONS; i++) {
            const departments = [generateDepartment()];
            const member = generateMember(departments[0].id);
            
            // Test with debt
            const penjualanWithDebt = [
                { id: 'p1', anggotaId: member.id, total: 500000, status: 'kredit' }
            ];
            let reportData = createReportData(member, departments, penjualanWithDebt);
            let statusCorrect = reportData.status === 'Belum Lunas' && reportData.totalHutang > 0;
            
            // Test without debt
            const penjualanWithoutDebt = [
                { id: 'p2', anggotaId: member.id, total: 500000, status: 'lunas' }
            ];
            reportData = createReportData(member, departments, penjualanWithoutDebt);
            statusCorrect = statusCorrect && reportData.status === 'Lunas' && reportData.totalHutang === 0;
            
            if (statusCorrect) {
                passedIterations++;
            }
        }

        console.log(`Status field correctness test: ${passedIterations}/${NUM_ITERATIONS} iterations passed`);
        expect(passedIterations).toBe(NUM_ITERATIONS);
    });

    test('should ensure all fields have correct data types', () => {
        let passedIterations = 0;

        for (let i = 0; i < NUM_ITERATIONS; i++) {
            const departments = [generateDepartment()];
            const member = generateMember(departments[0].id);
            const penjualan = [generatePenjualan(member.id)];
            
            const reportData = createReportData(member, departments, penjualan);
            
            const typesCorrect = 
                typeof reportData.anggotaId === 'string' &&
                typeof reportData.nik === 'string' &&
                typeof reportData.nama === 'string' &&
                typeof reportData.departemen === 'string' &&
                typeof reportData.departemenId === 'string' &&
                typeof reportData.totalHutang === 'number' &&
                typeof reportData.status === 'string';
            
            if (typesCorrect) {
                passedIterations++;
            }
        }

        console.log(`Data types correctness test: ${passedIterations}/${NUM_ITERATIONS} iterations passed`);
        expect(passedIterations).toBe(NUM_ITERATIONS);
    });
});

/**
 * Property 4: Department Formatting Consistency
 * 
 * For any report containing multiple members, all department values should follow 
 * consistent formatting rules where missing departments are represented uniformly 
 * (either all use "-" or all use "Tidak Ada Departemen").
 * 
 * Validates: Requirements 1.5
 */
describe('Property 4: Department Formatting Consistency', () => {
    const NUM_ITERATIONS = 100;

    test('should use consistent format for all missing departments', () => {
        let passedIterations = 0;
        const failures = [];

        for (let i = 0; i < NUM_ITERATIONS; i++) {
            // Generate random test data with mix of members with and without departments
            const numDepartments = Math.floor(Math.random() * 5) + 2;
            const departments = Array.from({ length: numDepartments }, () => generateDepartment());
            
            const numMembers = Math.floor(Math.random() * 20) + 5; // 5-24 members
            const members = Array.from({ length: numMembers }, () => {
                // 50% chance of having department to ensure we have both cases
                const hasDepartment = Math.random() > 0.5;
                const departemenId = hasDepartment 
                    ? departments[Math.floor(Math.random() * departments.length)].id 
                    : null;
                return generateMember(departemenId);
            });

            // Create report data for all members
            const reportDataList = members.map(member => {
                const penjualan = [generatePenjualan(member.id)];
                return createReportData(member, departments, penjualan);
            });

            // Check consistency of missing department formatting
            const missingDeptValues = reportDataList
                .filter(data => !data.departemenId || data.departemenId === '')
                .map(data => data.departemen);

            if (missingDeptValues.length > 0) {
                // All missing departments should use the same format
                const firstFormat = missingDeptValues[0];
                const allSameFormat = missingDeptValues.every(val => val === firstFormat);
                
                // Should be "-" (our standard)
                const usesStandardFormat = firstFormat === '-';
                
                if (allSameFormat && usesStandardFormat) {
                    passedIterations++;
                } else {
                    failures.push({
                        iteration: i,
                        missingDeptValues: missingDeptValues,
                        allSameFormat: allSameFormat,
                        usesStandardFormat: usesStandardFormat
                    });
                }
            } else {
                // No missing departments, test passes
                passedIterations++;
            }
        }

        console.log(`Department formatting consistency test: ${passedIterations}/${NUM_ITERATIONS} iterations passed`);
        if (failures.length > 0) {
            console.log('Failures:', failures.slice(0, 3));
        }

        expect(passedIterations).toBe(NUM_ITERATIONS);
    });

    test('should never use null or undefined for department values', () => {
        let passedIterations = 0;

        for (let i = 0; i < NUM_ITERATIONS; i++) {
            const numDepartments = Math.floor(Math.random() * 5) + 2;
            const departments = Array.from({ length: numDepartments }, () => generateDepartment());
            
            const numMembers = Math.floor(Math.random() * 20) + 5;
            const members = Array.from({ length: numMembers }, () => {
                const hasDepartment = Math.random() > 0.5;
                const departemenId = hasDepartment 
                    ? departments[Math.floor(Math.random() * departments.length)].id 
                    : null;
                return generateMember(departemenId);
            });

            const reportDataList = members.map(member => {
                const penjualan = [generatePenjualan(member.id)];
                return createReportData(member, departments, penjualan);
            });

            // Check that no department value is null or undefined
            const hasNullOrUndefined = reportDataList.some(data => 
                data.departemen === null || data.departemen === undefined
            );

            if (!hasNullOrUndefined) {
                passedIterations++;
            }
        }

        console.log(`No null/undefined departments test: ${passedIterations}/${NUM_ITERATIONS} iterations passed`);
        expect(passedIterations).toBe(NUM_ITERATIONS);
    });

    test('should never use empty string for department values', () => {
        let passedIterations = 0;

        for (let i = 0; i < NUM_ITERATIONS; i++) {
            const numDepartments = Math.floor(Math.random() * 5) + 2;
            const departments = Array.from({ length: numDepartments }, () => generateDepartment());
            
            const numMembers = Math.floor(Math.random() * 20) + 5;
            const members = Array.from({ length: numMembers }, () => {
                const hasDepartment = Math.random() > 0.5;
                const departemenId = hasDepartment 
                    ? departments[Math.floor(Math.random() * departments.length)].id 
                    : null;
                return generateMember(departemenId);
            });

            const reportDataList = members.map(member => {
                const penjualan = [generatePenjualan(member.id)];
                return createReportData(member, departments, penjualan);
            });

            // Check that no department value is empty string
            const hasEmptyString = reportDataList.some(data => 
                data.departemen === ''
            );

            if (!hasEmptyString) {
                passedIterations++;
            }
        }

        console.log(`No empty string departments test: ${passedIterations}/${NUM_ITERATIONS} iterations passed`);
        expect(passedIterations).toBe(NUM_ITERATIONS);
    });

    test('should maintain consistent format across large datasets', () => {
        let passedIterations = 0;

        for (let i = 0; i < NUM_ITERATIONS; i++) {
            // Generate larger dataset (50-100 members)
            const numDepartments = Math.floor(Math.random() * 10) + 5;
            const departments = Array.from({ length: numDepartments }, () => generateDepartment());
            
            const numMembers = Math.floor(Math.random() * 50) + 50; // 50-99 members
            const members = Array.from({ length: numMembers }, () => {
                const hasDepartment = Math.random() > 0.3; // 70% have departments
                const departemenId = hasDepartment 
                    ? departments[Math.floor(Math.random() * departments.length)].id 
                    : null;
                return generateMember(departemenId);
            });

            const reportDataList = members.map(member => {
                const penjualan = [generatePenjualan(member.id)];
                return createReportData(member, departments, penjualan);
            });

            // Collect all department values
            const allDeptValues = reportDataList.map(data => data.departemen);
            
            // Check consistency rules
            const noNullOrUndefined = allDeptValues.every(val => val !== null && val !== undefined);
            const noEmptyString = allDeptValues.every(val => val !== '');
            
            // Check that missing departments all use "-"
            const missingDepts = reportDataList
                .filter(data => !data.departemenId || data.departemenId === '')
                .map(data => data.departemen);
            const allMissingUseDash = missingDepts.every(val => val === '-');

            if (noNullOrUndefined && noEmptyString && (missingDepts.length === 0 || allMissingUseDash)) {
                passedIterations++;
            }
        }

        console.log(`Large dataset consistency test: ${passedIterations}/${NUM_ITERATIONS} iterations passed`);
        expect(passedIterations).toBe(NUM_ITERATIONS);
    });

    test('should format valid departments consistently (no extra spaces or special chars)', () => {
        let passedIterations = 0;

        for (let i = 0; i < NUM_ITERATIONS; i++) {
            const numDepartments = Math.floor(Math.random() * 5) + 2;
            const departments = Array.from({ length: numDepartments }, () => generateDepartment());
            
            const numMembers = Math.floor(Math.random() * 10) + 5;
            const members = Array.from({ length: numMembers }, () => {
                // All members have departments for this test
                const departemenId = departments[Math.floor(Math.random() * departments.length)].id;
                return generateMember(departemenId);
            });

            const reportDataList = members.map(member => {
                const penjualan = [generatePenjualan(member.id)];
                return createReportData(member, departments, penjualan);
            });

            // Check that valid departments don't have extra spaces or weird formatting
            const validDepts = reportDataList
                .filter(data => data.departemen !== '-')
                .map(data => data.departemen);
            
            const allProperlyFormatted = validDepts.every(dept => {
                // Should not have leading/trailing spaces
                const noExtraSpaces = dept === dept.trim();
                // Should not be empty after trim
                const notEmpty = dept.trim().length > 0;
                // Should match one of the department names
                const matchesDepartment = departments.some(d => d.nama === dept);
                
                return noExtraSpaces && notEmpty && matchesDepartment;
            });

            if (allProperlyFormatted) {
                passedIterations++;
            }
        }

        console.log(`Valid department formatting test: ${passedIterations}/${NUM_ITERATIONS} iterations passed`);
        expect(passedIterations).toBe(NUM_ITERATIONS);
    });
});

/**
 * Property 5: Filter Dropdown Population
 * 
 * For any set of members in master anggota data, the department filter dropdown 
 * should contain exactly the unique set of departments present in that data, 
 * plus an "All Departments" option.
 * 
 * Validates: Requirements 2.2
 */
describe('Property 5: Filter Dropdown Population', () => {
    const NUM_ITERATIONS = 100;

    test('should contain all unique departments from report data', () => {
        let passedIterations = 0;

        for (let i = 0; i < NUM_ITERATIONS; i++) {
            const numDepartments = Math.floor(Math.random() * 8) + 2; // 2-9 departments
            const departments = Array.from({ length: numDepartments }, () => generateDepartment());
            
            const numMembers = Math.floor(Math.random() * 30) + 10; // 10-39 members
            const members = Array.from({ length: numMembers }, () => {
                const hasDepartment = Math.random() > 0.2; // 80% have departments
                const departemenId = hasDepartment 
                    ? departments[Math.floor(Math.random() * departments.length)].id 
                    : null;
                return generateMember(departemenId);
            });

            const reportData = members.map(member => {
                const penjualan = [generatePenjualan(member.id)];
                return createReportData(member, departments, penjualan);
            });

            // Get unique departments
            const uniqueDepts = getUniqueDepartments(reportData);
            
            // Check that all departments from report data are in unique list
            const allDeptsIncluded = reportData.every(data => {
                if (data.departemen === '-') return true; // Skip missing departments
                return uniqueDepts.includes(data.departemen);
            });
            
            // Check no duplicates
            const noDuplicates = uniqueDepts.length === new Set(uniqueDepts).size;
            
            if (allDeptsIncluded && noDuplicates) {
                passedIterations++;
            }
        }

        console.log(`Filter dropdown population test: ${passedIterations}/${NUM_ITERATIONS} iterations passed`);
        expect(passedIterations).toBe(NUM_ITERATIONS);
    });

    test('should exclude "-" from dropdown options', () => {
        let passedIterations = 0;

        for (let i = 0; i < NUM_ITERATIONS; i++) {
            const numDepartments = Math.floor(Math.random() * 5) + 2;
            const departments = Array.from({ length: numDepartments }, () => generateDepartment());
            
            const numMembers = Math.floor(Math.random() * 20) + 10;
            const members = Array.from({ length: numMembers }, () => {
                // Mix of members with and without departments
                const hasDepartment = Math.random() > 0.3;
                const departemenId = hasDepartment 
                    ? departments[Math.floor(Math.random() * departments.length)].id 
                    : null;
                return generateMember(departemenId);
            });

            const reportData = members.map(member => {
                const penjualan = [generatePenjualan(member.id)];
                return createReportData(member, departments, penjualan);
            });

            const uniqueDepts = getUniqueDepartments(reportData);
            
            // Should not include "-"
            if (!uniqueDepts.includes('-')) {
                passedIterations++;
            }
        }

        console.log(`Exclude "-" from dropdown test: ${passedIterations}/${NUM_ITERATIONS} iterations passed`);
        expect(passedIterations).toBe(NUM_ITERATIONS);
    });
});

/**
 * Property 6: Department Filter Correctness
 * 
 * For any selected department from the filter, all members displayed in the 
 * filtered report should belong to that specific department.
 * 
 * Validates: Requirements 2.3
 */
describe('Property 6: Department Filter Correctness', () => {
    const NUM_ITERATIONS = 100;

    test('should display only members from selected department', () => {
        let passedIterations = 0;

        for (let i = 0; i < NUM_ITERATIONS; i++) {
            const numDepartments = Math.floor(Math.random() * 5) + 3;
            const departments = Array.from({ length: numDepartments }, () => generateDepartment());
            
            const numMembers = Math.floor(Math.random() * 30) + 10;
            const members = Array.from({ length: numMembers }, () => {
                const departemenId = departments[Math.floor(Math.random() * departments.length)].id;
                return generateMember(departemenId);
            });

            const reportData = members.map(member => {
                const penjualan = [generatePenjualan(member.id)];
                return createReportData(member, departments, penjualan);
            });

            // Pick a random department to filter by
            const uniqueDepts = getUniqueDepartments(reportData);
            if (uniqueDepts.length > 0) {
                const selectedDept = uniqueDepts[Math.floor(Math.random() * uniqueDepts.length)];
                
                // Apply filter
                const filteredData = filterByDepartment(reportData, selectedDept);
                
                // Check all filtered data belongs to selected department
                const allMatch = filteredData.every(data => data.departemen === selectedDept);
                
                if (allMatch && filteredData.length > 0) {
                    passedIterations++;
                }
            } else {
                passedIterations++; // No departments to filter, test passes
            }
        }

        console.log(`Filter correctness test: ${passedIterations}/${NUM_ITERATIONS} iterations passed`);
        expect(passedIterations).toBe(NUM_ITERATIONS);
    });

    test('should return empty array when filtering by non-existent department', () => {
        let passedIterations = 0;

        for (let i = 0; i < NUM_ITERATIONS; i++) {
            const numDepartments = Math.floor(Math.random() * 5) + 2;
            const departments = Array.from({ length: numDepartments }, () => generateDepartment());
            
            const numMembers = Math.floor(Math.random() * 20) + 5;
            const members = Array.from({ length: numMembers }, () => {
                const departemenId = departments[Math.floor(Math.random() * departments.length)].id;
                return generateMember(departemenId);
            });

            const reportData = members.map(member => {
                const penjualan = [generatePenjualan(member.id)];
                return createReportData(member, departments, penjualan);
            });

            // Filter by non-existent department
            const filteredData = filterByDepartment(reportData, 'NonExistentDepartment');
            
            if (filteredData.length === 0) {
                passedIterations++;
            }
        }

        console.log(`Non-existent department filter test: ${passedIterations}/${NUM_ITERATIONS} iterations passed`);
        expect(passedIterations).toBe(NUM_ITERATIONS);
    });
});

/**
 * Property 7: Show All Filter Completeness
 * 
 * For any dataset of members, selecting "Semua Departemen" in the filter 
 * should display the complete set of members without exclusions.
 * 
 * Validates: Requirements 2.4
 */
describe('Property 7: Show All Filter Completeness', () => {
    const NUM_ITERATIONS = 100;

    test('should display all members when filter is empty string', () => {
        let passedIterations = 0;

        for (let i = 0; i < NUM_ITERATIONS; i++) {
            const numDepartments = Math.floor(Math.random() * 5) + 2;
            const departments = Array.from({ length: numDepartments }, () => generateDepartment());
            
            const numMembers = Math.floor(Math.random() * 30) + 10;
            const members = Array.from({ length: numMembers }, () => {
                const hasDepartment = Math.random() > 0.2;
                const departemenId = hasDepartment 
                    ? departments[Math.floor(Math.random() * departments.length)].id 
                    : null;
                return generateMember(departemenId);
            });

            const reportData = members.map(member => {
                const penjualan = [generatePenjualan(member.id)];
                return createReportData(member, departments, penjualan);
            });

            // Filter with empty string (show all)
            const filteredData = filterByDepartment(reportData, '');
            
            // Should return all data
            if (filteredData.length === reportData.length) {
                passedIterations++;
            }
        }

        console.log(`Show all filter test: ${passedIterations}/${NUM_ITERATIONS} iterations passed`);
        expect(passedIterations).toBe(NUM_ITERATIONS);
    });

    test('should preserve all data properties when showing all', () => {
        let passedIterations = 0;

        for (let i = 0; i < NUM_ITERATIONS; i++) {
            const numDepartments = Math.floor(Math.random() * 5) + 2;
            const departments = Array.from({ length: numDepartments }, () => generateDepartment());
            
            const numMembers = Math.floor(Math.random() * 20) + 5;
            const members = Array.from({ length: numMembers }, () => {
                const hasDepartment = Math.random() > 0.3;
                const departemenId = hasDepartment 
                    ? departments[Math.floor(Math.random() * departments.length)].id 
                    : null;
                return generateMember(departemenId);
            });

            const reportData = members.map(member => {
                const penjualan = [generatePenjualan(member.id)];
                return createReportData(member, departments, penjualan);
            });

            // Filter with empty string
            const filteredData = filterByDepartment(reportData, '');
            
            // Check all original data is present with same properties
            const allDataPreserved = reportData.every((original, index) => {
                const filtered = filteredData[index];
                return filtered && 
                       filtered.anggotaId === original.anggotaId &&
                       filtered.nama === original.nama &&
                       filtered.departemen === original.departemen;
            });
            
            if (allDataPreserved) {
                passedIterations++;
            }
        }

        console.log(`Data preservation test: ${passedIterations}/${NUM_ITERATIONS} iterations passed`);
        expect(passedIterations).toBe(NUM_ITERATIONS);
    });
});

/**
 * Tests for Total Hutang Calculation
 */
describe('Total Hutang Calculation', () => {
    test('should correctly sum kredit sales for a member', () => {
        const anggotaId = 'ang-1';
        const penjualan = [
            { id: 'p1', anggotaId: 'ang-1', total: 500000, status: 'kredit' },
            { id: 'p2', anggotaId: 'ang-1', total: 300000, status: 'kredit' },
            { id: 'p3', anggotaId: 'ang-1', total: 200000, status: 'lunas' }, // Should not count
            { id: 'p4', anggotaId: 'ang-2', total: 400000, status: 'kredit' } // Different member
        ];

        const result = calculateTotalHutang(anggotaId, penjualan);
        expect(result).toBe(800000);
    });

    test('should return 0 for member with no kredit sales', () => {
        const anggotaId = 'ang-1';
        const penjualan = [
            { id: 'p1', anggotaId: 'ang-1', total: 500000, status: 'lunas' },
            { id: 'p2', anggotaId: 'ang-2', total: 300000, status: 'kredit' }
        ];

        const result = calculateTotalHutang(anggotaId, penjualan);
        expect(result).toBe(0);
    });

    test('should return 0 for member with no sales at all', () => {
        const anggotaId = 'ang-1';
        const penjualan = [];

        const result = calculateTotalHutang(anggotaId, penjualan);
        expect(result).toBe(0);
    });
});

// Run all tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        joinMemberWithDepartment,
        calculateTotalHutang,
        generateDepartment,
        generateMember,
        generatePenjualan
    };
}
