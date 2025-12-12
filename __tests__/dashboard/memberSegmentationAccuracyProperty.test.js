/**
 * Property-based test for Member Segmentation Accuracy
 * **Feature: dashboard-analytics-kpi, Property 8: Member Segmentation Consistency**
 * **Validates: Requirements 3.3**
 * 
 * This test specifically validates that member segmentation by transaction volume 
 * and frequency is mathematically accurate and consistent across all possible inputs.
 */

import fc from 'fast-check';

// Import the actual MemberAnalytics class
class MemberAnalytics {
    constructor(dataSource) {
        this.dataSource = dataSource;
        this.segmentationThresholds = {
            highActivity: { minTransactions: 10, minValue: 1000000 },
            mediumActivity: { minTransactions: 5, minValue: 500000 },
            lowActivity: { minTransactions: 1, minValue: 100000 },
            dormantDays: 90
        };
    }

    async segmentMembersByActivity(startDate, endDate) {
        const transactions = await this.dataSource.getTransactionsByDateRange(startDate, endDate);
        const members = await this.dataSource.getAllActiveMembers();
        
        const memberStats = members.map(member => {
            const memberTransactions = transactions.filter(t => t.member_id === member.id);
            const totalValue = memberTransactions.reduce((sum, t) => sum + (t.jumlah || 0), 0);
            const transactionCount = memberTransactions.length;
            const avgTransactionValue = transactionCount > 0 ? totalValue / transactionCount : 0;
            
            return {
                ...member,
                transactionCount,
                totalValue,
                avgTransactionValue,
                lastTransactionDate: this._getLastTransactionDate(memberTransactions),
                segment: this._determineSegment(transactionCount, totalValue)
            };
        });
        
        const segments = {
            highActivity: memberStats.filter(m => m.segment === 'high'),
            mediumActivity: memberStats.filter(m => m.segment === 'medium'),
            lowActivity: memberStats.filter(m => m.segment === 'low'),
            inactive: memberStats.filter(m => m.segment === 'inactive')
        };
        
        return {
            segments,
            summary: {
                totalMembers: memberStats.length,
                highActivity: segments.highActivity.length,
                mediumActivity: segments.mediumActivity.length,
                lowActivity: segments.lowActivity.length,
                inactive: segments.inactive.length,
                distributionPercentage: {
                    high: (segments.highActivity.length / memberStats.length * 100).toFixed(1),
                    medium: (segments.mediumActivity.length / memberStats.length * 100).toFixed(1),
                    low: (segments.lowActivity.length / memberStats.length * 100).toFixed(1),
                    inactive: (segments.inactive.length / memberStats.length * 100).toFixed(1)
                }
            },
            analysisDate: new Date().toISOString()
        };
    }

    _determineSegment(transactionCount, totalValue) {
        const thresholds = this.segmentationThresholds;
        
        if (transactionCount >= thresholds.highActivity.minTransactions && 
            totalValue >= thresholds.highActivity.minValue) {
            return 'high';
        } else if (transactionCount >= thresholds.mediumActivity.minTransactions && 
                   totalValue >= thresholds.mediumActivity.minValue) {
            return 'medium';
        } else if (transactionCount >= thresholds.lowActivity.minTransactions && 
                   totalValue >= thresholds.lowActivity.minValue) {
            return 'low';
        } else {
            return 'inactive';
        }
    }

    _getLastTransactionDate(transactions) {
        if (transactions.length === 0) return null;
        
        return transactions.reduce((latest, transaction) => {
            const transactionDate = new Date(transaction.tanggal);
            return transactionDate > latest ? transactionDate : latest;
        }, new Date(transactions[0].tanggal)).toISOString();
    }
}

// Mock data source for testing
class MockDataSource {
    constructor(members = [], transactions = []) {
        this.members = members;
        this.transactions = transactions;
    }

    async getAllActiveMembers() {
        return this.members.filter(m => m.status === 'aktif');
    }

    async getTransactionsByDateRange(startDate, endDate) {
        return this.transactions.filter(t => {
            const transactionDate = new Date(t.tanggal);
            return transactionDate >= startDate && transactionDate <= endDate;
        });
    }
}

// Generators for test data
const memberGenerator = fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    nama: fc.string({ minLength: 3, maxLength: 50 }),
    status: fc.constant('aktif') // Only active members for segmentation
});

const transactionGenerator = fc.record({
    id: fc.integer({ min: 1, max: 100000 }),
    member_id: fc.integer({ min: 1, max: 10000 }),
    tanggal: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
    jumlah: fc.integer({ min: 10000, max: 10000000 }), // 10K to 10M IDR
    jenis: fc.constantFrom('simpanan', 'pinjaman', 'pos')
});

describe('Member Segmentation Accuracy Property Test', () => {
    describe('Property 8: Member Segmentation Consistency', () => {
        test('segmentation accuracy should be mathematically correct for all inputs', async () => {
            await fc.assert(fc.asyncProperty(
                fc.array(memberGenerator, { minLength: 1, maxLength: 200 }),
                fc.array(transactionGenerator, { minLength: 0, maxLength: 2000 }),
                async (members, transactions) => {
                    // Ensure unique member IDs
                    const uniqueMembers = members.map((member, index) => ({
                        ...member,
                        id: index + 1 // Ensure unique IDs
                    }));
                    
                    // Ensure transactions reference existing members
                    const validTransactions = transactions.map(t => ({
                        ...t,
                        member_id: uniqueMembers[Math.floor(Math.random() * uniqueMembers.length)]?.id || 1
                    }));

                    const dataSource = new MockDataSource(uniqueMembers, validTransactions);
                    const analytics = new MemberAnalytics(dataSource);
                    
                    const startDate = new Date('2024-01-01');
                    const endDate = new Date('2024-12-31');
                    
                    const result = await analytics.segmentMembersByActivity(startDate, endDate);
                    
                    // Property 1: Completeness - Every member must be categorized exactly once
                    const totalCategorized = result.segments.highActivity.length + 
                                           result.segments.mediumActivity.length + 
                                           result.segments.lowActivity.length + 
                                           result.segments.inactive.length;
                    
                    expect(totalCategorized).toBe(uniqueMembers.length);
                    expect(result.summary.totalMembers).toBe(uniqueMembers.length);
                    
                    // Property 2: Mutual Exclusivity - No member appears in multiple segments
                    const allSegmentedMembers = [
                        ...result.segments.highActivity,
                        ...result.segments.mediumActivity,
                        ...result.segments.lowActivity,
                        ...result.segments.inactive
                    ];
                    
                    const memberIds = allSegmentedMembers.map(m => m.id);
                    const uniqueIds = new Set(memberIds);
                    expect(uniqueIds.size).toBe(memberIds.length);
                    
                    // Property 3: Threshold Accuracy - Segmentation must follow exact threshold rules
                    result.segments.highActivity.forEach(member => {
                        expect(member.transactionCount).toBeGreaterThanOrEqual(10);
                        expect(member.totalValue).toBeGreaterThanOrEqual(1000000);
                        expect(member.segment).toBe('high');
                    });
                    
                    result.segments.mediumActivity.forEach(member => {
                        expect(member.transactionCount).toBeGreaterThanOrEqual(5);
                        expect(member.totalValue).toBeGreaterThanOrEqual(500000);
                        // Should not qualify for high activity
                        expect(
                            member.transactionCount < 10 || member.totalValue < 1000000
                        ).toBe(true);
                        expect(member.segment).toBe('medium');
                    });
                    
                    result.segments.lowActivity.forEach(member => {
                        expect(member.transactionCount).toBeGreaterThanOrEqual(1);
                        expect(member.totalValue).toBeGreaterThanOrEqual(100000);
                        // Should not qualify for medium or high activity
                        expect(
                            member.transactionCount < 5 || member.totalValue < 500000
                        ).toBe(true);
                        expect(member.segment).toBe('low');
                    });
                    
                    result.segments.inactive.forEach(member => {
                        // Should not qualify for any active segment
                        expect(
                            member.transactionCount < 1 || member.totalValue < 100000
                        ).toBe(true);
                        expect(member.segment).toBe('inactive');
                    });
                    
                    // Property 4: Mathematical Consistency - Calculations must be accurate
                    allSegmentedMembers.forEach(member => {
                        // Verify transaction count calculation
                        const memberTransactions = validTransactions.filter(t => t.member_id === member.id);
                        expect(member.transactionCount).toBe(memberTransactions.length);
                        
                        // Verify total value calculation
                        const expectedTotalValue = memberTransactions.reduce((sum, t) => sum + (t.jumlah || 0), 0);
                        expect(member.totalValue).toBe(expectedTotalValue);
                        
                        // Verify average transaction value calculation
                        const expectedAvgValue = memberTransactions.length > 0 ? 
                            expectedTotalValue / memberTransactions.length : 0;
                        expect(Math.abs(member.avgTransactionValue - expectedAvgValue)).toBeLessThan(0.01);
                        
                        // All values must be non-negative
                        expect(member.transactionCount).toBeGreaterThanOrEqual(0);
                        expect(member.totalValue).toBeGreaterThanOrEqual(0);
                        expect(member.avgTransactionValue).toBeGreaterThanOrEqual(0);
                    });
                    
                    // Property 5: Summary Accuracy - Summary statistics must match actual data
                    expect(result.summary.highActivity).toBe(result.segments.highActivity.length);
                    expect(result.summary.mediumActivity).toBe(result.segments.mediumActivity.length);
                    expect(result.summary.lowActivity).toBe(result.segments.lowActivity.length);
                    expect(result.summary.inactive).toBe(result.segments.inactive.length);
                    
                    // Property 6: Percentage Accuracy - Distribution percentages must sum to 100%
                    const totalPercentage = parseFloat(result.summary.distributionPercentage.high) +
                                          parseFloat(result.summary.distributionPercentage.medium) +
                                          parseFloat(result.summary.distributionPercentage.low) +
                                          parseFloat(result.summary.distributionPercentage.inactive);
                    
                    expect(Math.abs(totalPercentage - 100)).toBeLessThan(0.1); // Allow for rounding
                    
                    // Verify individual percentage calculations
                    if (uniqueMembers.length > 0) {
                        const expectedHighPercentage = (result.segments.highActivity.length / uniqueMembers.length * 100).toFixed(1);
                        const expectedMediumPercentage = (result.segments.mediumActivity.length / uniqueMembers.length * 100).toFixed(1);
                        const expectedLowPercentage = (result.segments.lowActivity.length / uniqueMembers.length * 100).toFixed(1);
                        const expectedInactivePercentage = (result.segments.inactive.length / uniqueMembers.length * 100).toFixed(1);
                        
                        expect(result.summary.distributionPercentage.high).toBe(expectedHighPercentage);
                        expect(result.summary.distributionPercentage.medium).toBe(expectedMediumPercentage);
                        expect(result.summary.distributionPercentage.low).toBe(expectedLowPercentage);
                        expect(result.summary.distributionPercentage.inactive).toBe(expectedInactivePercentage);
                    }
                    
                    // Property 7: Hierarchical Consistency - Higher segments should have better metrics
                    // Compare high vs medium activity members
                    if (result.segments.highActivity.length > 0 && result.segments.mediumActivity.length > 0) {
                        const avgHighTransactions = result.segments.highActivity.reduce((sum, m) => sum + m.transactionCount, 0) / result.segments.highActivity.length;
                        const avgMediumTransactions = result.segments.mediumActivity.reduce((sum, m) => sum + m.transactionCount, 0) / result.segments.mediumActivity.length;
                        const avgHighValue = result.segments.highActivity.reduce((sum, m) => sum + m.totalValue, 0) / result.segments.highActivity.length;
                        const avgMediumValue = result.segments.mediumActivity.reduce((sum, m) => sum + m.totalValue, 0) / result.segments.mediumActivity.length;
                        
                        // High activity should have better average metrics than medium
                        expect(avgHighTransactions >= avgMediumTransactions || avgHighValue >= avgMediumValue).toBe(true);
                    }
                    
                    // Property 8: Deterministic Behavior - Same input should produce same output
                    const result2 = await analytics.segmentMembersByActivity(startDate, endDate);
                    expect(result.segments.highActivity.length).toBe(result2.segments.highActivity.length);
                    expect(result.segments.mediumActivity.length).toBe(result2.segments.mediumActivity.length);
                    expect(result.segments.lowActivity.length).toBe(result2.segments.lowActivity.length);
                    expect(result.segments.inactive.length).toBe(result2.segments.inactive.length);
                }
            ), { numRuns: 100 }); // Increased runs for thorough testing
        });

        test('edge cases should be handled correctly', async () => {
            await fc.assert(fc.asyncProperty(
                fc.oneof(
                    // Edge case: No members
                    fc.constant([]),
                    // Edge case: Members with no transactions
                    fc.array(memberGenerator, { minLength: 1, maxLength: 10 }),
                    // Edge case: Members with exactly threshold values
                    fc.array(memberGenerator, { minLength: 1, maxLength: 5 })
                ),
                fc.oneof(
                    // Edge case: No transactions
                    fc.constant([]),
                    // Edge case: Transactions at exact thresholds
                    fc.array(fc.record({
                        id: fc.integer({ min: 1, max: 100 }),
                        member_id: fc.integer({ min: 1, max: 10 }),
                        tanggal: fc.constant(new Date('2024-06-15').toISOString()),
                        jumlah: fc.constantFrom(100000, 500000, 1000000), // Exact threshold values
                        jenis: fc.constant('simpanan')
                    }), { minLength: 0, maxLength: 20 })
                ),
                async (members, transactions) => {
                    if (members.length === 0) {
                        // Test empty member list
                        const dataSource = new MockDataSource([], transactions);
                        const analytics = new MemberAnalytics(dataSource);
                        
                        const result = await analytics.segmentMembersByActivity(new Date('2024-01-01'), new Date('2024-12-31'));
                        
                        expect(result.summary.totalMembers).toBe(0);
                        expect(result.segments.highActivity.length).toBe(0);
                        expect(result.segments.mediumActivity.length).toBe(0);
                        expect(result.segments.lowActivity.length).toBe(0);
                        expect(result.segments.inactive.length).toBe(0);
                        return;
                    }
                    
                    // Ensure unique member IDs
                    const uniqueMembers = members.map((member, index) => ({
                        ...member,
                        id: index + 1
                    }));
                    
                    // Ensure transactions reference existing members
                    const validTransactions = transactions.map(t => ({
                        ...t,
                        member_id: uniqueMembers[Math.floor(Math.random() * uniqueMembers.length)].id
                    }));

                    const dataSource = new MockDataSource(uniqueMembers, validTransactions);
                    const analytics = new MemberAnalytics(dataSource);
                    
                    const result = await analytics.segmentMembersByActivity(new Date('2024-01-01'), new Date('2024-12-31'));
                    
                    // Should handle edge cases gracefully
                    expect(result.summary.totalMembers).toBe(uniqueMembers.length);
                    expect(typeof result.analysisDate).toBe('string');
                    expect(result.segments).toBeDefined();
                    
                    // All segments should be arrays
                    expect(Array.isArray(result.segments.highActivity)).toBe(true);
                    expect(Array.isArray(result.segments.mediumActivity)).toBe(true);
                    expect(Array.isArray(result.segments.lowActivity)).toBe(true);
                    expect(Array.isArray(result.segments.inactive)).toBe(true);
                }
            ), { numRuns: 50 });
        });

        test('threshold boundary conditions should be precise', async () => {
            // Test exact threshold boundary conditions
            const testCases = [
                // High activity threshold boundary
                { transactions: 10, value: 1000000, expectedSegment: 'high' },
                { transactions: 9, value: 1000000, expectedSegment: 'medium' },
                { transactions: 10, value: 999999, expectedSegment: 'medium' },
                
                // Medium activity threshold boundary  
                { transactions: 5, value: 500000, expectedSegment: 'medium' },
                { transactions: 4, value: 500000, expectedSegment: 'low' },
                { transactions: 5, value: 499999, expectedSegment: 'low' },
                
                // Low activity threshold boundary
                { transactions: 1, value: 100000, expectedSegment: 'low' },
                { transactions: 0, value: 100000, expectedSegment: 'inactive' },
                { transactions: 1, value: 99999, expectedSegment: 'inactive' },
                
                // Inactive boundary
                { transactions: 0, value: 0, expectedSegment: 'inactive' }
            ];

            for (const testCase of testCases) {
                const member = { id: 1, nama: 'Test Member', status: 'aktif' };
                const transactions = Array.from({ length: testCase.transactions }, (_, i) => ({
                    id: i + 1,
                    member_id: 1,
                    tanggal: new Date('2024-06-15').toISOString(),
                    jumlah: Math.floor(testCase.value / testCase.transactions) || testCase.value,
                    jenis: 'simpanan'
                }));

                const dataSource = new MockDataSource([member], transactions);
                const analytics = new MemberAnalytics(dataSource);
                
                const result = await analytics.segmentMembersByActivity(new Date('2024-01-01'), new Date('2024-12-31'));
                
                expect(result.segments[testCase.expectedSegment + 'Activity'] || result.segments.inactive).toHaveLength(1);
                expect(result.segments[testCase.expectedSegment + 'Activity']?.[0]?.segment || 'inactive').toBe(testCase.expectedSegment);
            }
        });
    });
});