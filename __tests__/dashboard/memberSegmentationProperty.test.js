/**
 * Property-based tests for Member Analytics segmentation consistency
 * **Feature: dashboard-analytics-kpi, Property 8: Member Segmentation Consistency**
 * **Validates: Requirements 3.3**
 */

import fc from 'fast-check';

// Import MemberAnalytics class for testing
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

    async generateActivityHeatmap(startDate, endDate) {
        const transactions = await this.dataSource.getTransactionsByDateRange(startDate, endDate);
        const members = await this.dataSource.getAllActiveMembers();
        
        const heatmapData = [];
        const dateRange = this._generateDateRange(startDate, endDate);
        
        members.forEach(member => {
            const memberTransactions = transactions.filter(t => t.member_id === member.id);
            const activityRow = {
                memberId: member.id,
                memberName: member.nama,
                dailyActivity: []
            };
            
            dateRange.forEach(date => {
                const dayTransactions = memberTransactions.filter(t => 
                    this._isSameDay(new Date(t.tanggal), date)
                );
                
                activityRow.dailyActivity.push({
                    date: date.toISOString().split('T')[0],
                    transactionCount: dayTransactions.length,
                    totalValue: dayTransactions.reduce((sum, t) => sum + (t.jumlah || 0), 0),
                    intensity: this._calculateActivityIntensity(dayTransactions)
                });
            });
            
            heatmapData.push(activityRow);
        });
        
        return {
            data: heatmapData,
            summary: this._generateHeatmapSummary(heatmapData),
            dateRange: {
                start: startDate.toISOString().split('T')[0],
                end: endDate.toISOString().split('T')[0]
            }
        };
    }

    async identifyDormantMembers(dormantThresholdDays = this.segmentationThresholds.dormantDays) {
        const members = await this.dataSource.getAllActiveMembers();
        const currentDate = new Date();
        
        const dormantMembers = [];
        const atRiskMembers = [];
        const activeMembers = [];
        
        for (const member of members) {
            const lastTransaction = await this.dataSource.getLastTransactionByMember(member.id);
            const daysSinceLastActivity = lastTransaction ? 
                Math.floor((currentDate - new Date(lastTransaction.tanggal)) / (1000 * 60 * 60 * 24)) : 
                Infinity;
            
            const memberWithActivity = {
                ...member,
                lastTransactionDate: lastTransaction ? lastTransaction.tanggal : null,
                daysSinceLastActivity,
                riskLevel: this._calculateRiskLevel(daysSinceLastActivity, dormantThresholdDays)
            };
            
            if (daysSinceLastActivity >= dormantThresholdDays) {
                dormantMembers.push(memberWithActivity);
            } else if (daysSinceLastActivity >= dormantThresholdDays * 0.7) {
                atRiskMembers.push(memberWithActivity);
            } else {
                activeMembers.push(memberWithActivity);
            }
        }
        
        return {
            dormantMembers: dormantMembers.sort((a, b) => b.daysSinceLastActivity - a.daysSinceLastActivity),
            atRiskMembers: atRiskMembers.sort((a, b) => b.daysSinceLastActivity - a.daysSinceLastActivity),
            activeMembers: activeMembers.sort((a, b) => a.daysSinceLastActivity - b.daysSinceLastActivity),
            summary: {
                totalMembers: members.length,
                dormantCount: dormantMembers.length,
                atRiskCount: atRiskMembers.length,
                activeCount: activeMembers.length,
                dormantPercentage: (dormantMembers.length / members.length * 100).toFixed(1),
                atRiskPercentage: (atRiskMembers.length / members.length * 100).toFixed(1)
            },
            thresholdDays: dormantThresholdDays,
            analysisDate: currentDate.toISOString()
        };
    }

    async getTopActiveMembers(startDate, endDate, limit = 10) {
        const segmentation = await this.segmentMembersByActivity(startDate, endDate);
        const allMembers = [
            ...segmentation.segments.highActivity,
            ...segmentation.segments.mediumActivity,
            ...segmentation.segments.lowActivity
        ];
        
        return {
            byTransactionCount: allMembers
                .sort((a, b) => b.transactionCount - a.transactionCount)
                .slice(0, limit),
            byTotalValue: allMembers
                .sort((a, b) => b.totalValue - a.totalValue)
                .slice(0, limit),
            byAvgTransactionValue: allMembers
                .sort((a, b) => b.avgTransactionValue - a.avgTransactionValue)
                .slice(0, limit),
            analysisDate: new Date().toISOString(),
            period: {
                start: startDate.toISOString().split('T')[0],
                end: endDate.toISOString().split('T')[0]
            }
        };
    }

    // Helper methods
    _generateDateRange(startDate, endDate) {
        const dates = [];
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return dates;
    }

    _isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    _calculateActivityIntensity(transactions) {
        if (transactions.length === 0) return 0;
        
        const totalValue = transactions.reduce((sum, t) => sum + (t.jumlah || 0), 0);
        const count = transactions.length;
        
        const countScore = Math.min(count / 5, 1);
        const valueScore = Math.min(totalValue / 5000000, 1);
        
        return Math.round((countScore + valueScore) / 2 * 100);
    }

    _generateHeatmapSummary(heatmapData) {
        const totalDays = heatmapData.length > 0 ? heatmapData[0].dailyActivity.length : 0;
        const totalMembers = heatmapData.length;
        
        let totalTransactions = 0;
        let totalValue = 0;
        let activeDays = 0;
        
        heatmapData.forEach(member => {
            member.dailyActivity.forEach(day => {
                totalTransactions += day.transactionCount;
                totalValue += day.totalValue;
                if (day.transactionCount > 0) activeDays++;
            });
        });
        
        return {
            totalMembers,
            totalDays,
            totalTransactions,
            totalValue,
            avgTransactionsPerDay: totalDays > 0 ? (totalTransactions / totalDays).toFixed(2) : 0,
            avgValuePerDay: totalDays > 0 ? (totalValue / totalDays).toFixed(0) : 0,
            activityRate: totalDays > 0 ? (activeDays / (totalMembers * totalDays) * 100).toFixed(1) : 0
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

    _calculateRiskLevel(daysSinceLastActivity, dormantThreshold) {
        if (daysSinceLastActivity >= dormantThreshold) {
            return 'dormant';
        } else if (daysSinceLastActivity >= dormantThreshold * 0.7) {
            return 'high';
        } else if (daysSinceLastActivity >= dormantThreshold * 0.4) {
            return 'medium';
        } else {
            return 'low';
        }
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

    async getLastTransactionByMember(memberId) {
        const memberTransactions = this.transactions
            .filter(t => t.member_id === memberId)
            .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        
        return memberTransactions.length > 0 ? memberTransactions[0] : null;
    }
}

// Generators for test data
const memberGenerator = fc.record({
    id: fc.integer({ min: 1, max: 10000 }),
    nama: fc.string({ minLength: 3, maxLength: 50 }),
    status: fc.constantFrom('aktif', 'keluar', 'non-aktif')
});

const transactionGenerator = fc.record({
    id: fc.integer({ min: 1, max: 100000 }),
    member_id: fc.integer({ min: 1, max: 10000 }),
    tanggal: fc.date({ min: new Date('2023-01-01'), max: new Date('2024-12-31') }).map(d => d.toISOString()),
    jumlah: fc.integer({ min: 10000, max: 10000000 }), // 10K to 10M IDR
    jenis: fc.constantFrom('simpanan', 'pinjaman', 'pos')
});

describe('Member Analytics - Property-Based Tests', () => {
    describe('Property 8: Member Segmentation Consistency', () => {
        test('segmentation should be consistent and complete', async () => {
            await fc.assert(fc.asyncProperty(
                fc.array(memberGenerator, { minLength: 1, maxLength: 100 }),
                fc.array(transactionGenerator, { minLength: 0, maxLength: 1000 }),
                async (members, transactions) => {
                    // Ensure we have active members for testing
                    const activeMembers = members.map(m => ({ ...m, status: 'aktif' }));
                    
                    // Ensure transactions reference existing members
                    const validTransactions = transactions.map(t => ({
                        ...t,
                        member_id: activeMembers[Math.floor(Math.random() * activeMembers.length)]?.id || 1
                    }));

                    const dataSource = new MockDataSource(activeMembers, validTransactions);
                    const analytics = new MemberAnalytics(dataSource);
                    
                    const startDate = new Date('2024-01-01');
                    const endDate = new Date('2024-12-31');
                    
                    const result = await analytics.segmentMembersByActivity(startDate, endDate);
                    
                    // Property 1: All members should be categorized
                    const totalCategorized = result.segments.highActivity.length + 
                                           result.segments.mediumActivity.length + 
                                           result.segments.lowActivity.length + 
                                           result.segments.inactive.length;
                    
                    expect(totalCategorized).toBe(activeMembers.length);
                    
                    // Property 2: Segments should be mutually exclusive
                    const allSegmentedMembers = [
                        ...result.segments.highActivity,
                        ...result.segments.mediumActivity,
                        ...result.segments.lowActivity,
                        ...result.segments.inactive
                    ];
                    
                    const uniqueMembers = new Set(allSegmentedMembers.map(m => m.id));
                    expect(uniqueMembers.size).toBe(allSegmentedMembers.length);
                    
                    // Property 3: Segment ordering should be consistent
                    // High activity members should have >= transactions and value than medium
                    result.segments.highActivity.forEach(highMember => {
                        result.segments.mediumActivity.forEach(mediumMember => {
                            expect(
                                highMember.transactionCount >= mediumMember.transactionCount ||
                                highMember.totalValue >= mediumMember.totalValue
                            ).toBe(true);
                        });
                    });
                    
                    // Property 4: Summary percentages should sum to 100%
                    const totalPercentage = parseFloat(result.summary.distributionPercentage.high) +
                                          parseFloat(result.summary.distributionPercentage.medium) +
                                          parseFloat(result.summary.distributionPercentage.low) +
                                          parseFloat(result.summary.distributionPercentage.inactive);
                    
                    expect(Math.abs(totalPercentage - 100)).toBeLessThan(0.1); // Allow for rounding
                    
                    // Property 5: All members should have non-negative transaction counts and values
                    allSegmentedMembers.forEach(member => {
                        expect(member.transactionCount).toBeGreaterThanOrEqual(0);
                        expect(member.totalValue).toBeGreaterThanOrEqual(0);
                        expect(member.avgTransactionValue).toBeGreaterThanOrEqual(0);
                    });
                }
            ), { numRuns: 50 });
        });

        test('activity heatmap should maintain data integrity', async () => {
            await fc.assert(fc.asyncProperty(
                fc.array(memberGenerator, { minLength: 1, maxLength: 50 }),
                fc.array(transactionGenerator, { minLength: 0, maxLength: 500 }),
                async (members, transactions) => {
                    const activeMembers = members.map(m => ({ ...m, status: 'aktif' }));
                    const validTransactions = transactions.map(t => ({
                        ...t,
                        member_id: activeMembers[Math.floor(Math.random() * activeMembers.length)]?.id || 1
                    }));

                    const dataSource = new MockDataSource(activeMembers, validTransactions);
                    const analytics = new MemberAnalytics(dataSource);
                    
                    const startDate = new Date('2024-01-01');
                    const endDate = new Date('2024-01-31'); // One month for manageable test size
                    
                    const heatmap = await analytics.generateActivityHeatmap(startDate, endDate);
                    
                    // Property 1: Each member should have data for each day in range
                    const expectedDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
                    heatmap.data.forEach(memberData => {
                        expect(memberData.dailyActivity.length).toBe(expectedDays);
                    });
                    
                    // Property 2: Activity intensity should be between 0-100
                    heatmap.data.forEach(memberData => {
                        memberData.dailyActivity.forEach(dayData => {
                            expect(dayData.intensity).toBeGreaterThanOrEqual(0);
                            expect(dayData.intensity).toBeLessThanOrEqual(100);
                        });
                    });
                    
                    // Property 3: Transaction counts should be non-negative
                    heatmap.data.forEach(memberData => {
                        memberData.dailyActivity.forEach(dayData => {
                            expect(dayData.transactionCount).toBeGreaterThanOrEqual(0);
                            expect(dayData.totalValue).toBeGreaterThanOrEqual(0);
                        });
                    });
                    
                    // Property 4: Summary should accurately reflect the data
                    const totalTransactionsFromData = heatmap.data.reduce((sum, member) => 
                        sum + member.dailyActivity.reduce((daySum, day) => daySum + day.transactionCount, 0), 0
                    );
                    
                    expect(parseInt(heatmap.summary.totalTransactions)).toBe(totalTransactionsFromData);
                }
            ), { numRuns: 30 });
        });

        test('dormant member identification should be consistent', async () => {
            await fc.assert(fc.asyncProperty(
                fc.array(memberGenerator, { minLength: 1, maxLength: 50 }),
                fc.array(transactionGenerator, { minLength: 0, maxLength: 200 }),
                fc.integer({ min: 30, max: 180 }), // dormant threshold days
                async (members, transactions, dormantThreshold) => {
                    const activeMembers = members.map(m => ({ ...m, status: 'aktif' }));
                    const validTransactions = transactions.map(t => ({
                        ...t,
                        member_id: activeMembers[Math.floor(Math.random() * activeMembers.length)]?.id || 1
                    }));

                    const dataSource = new MockDataSource(activeMembers, validTransactions);
                    const analytics = new MemberAnalytics(dataSource);
                    
                    const result = await analytics.identifyDormantMembers(dormantThreshold);
                    
                    // Property 1: All members should be categorized
                    const totalCategorized = result.dormantMembers.length + 
                                           result.atRiskMembers.length + 
                                           result.activeMembers.length;
                    
                    expect(totalCategorized).toBe(activeMembers.length);
                    
                    // Property 2: Dormant members should have days >= threshold
                    result.dormantMembers.forEach(member => {
                        expect(member.daysSinceLastActivity).toBeGreaterThanOrEqual(dormantThreshold);
                    });
                    
                    // Property 3: At-risk members should be in the warning range
                    result.atRiskMembers.forEach(member => {
                        expect(member.daysSinceLastActivity).toBeGreaterThanOrEqual(dormantThreshold * 0.7);
                        expect(member.daysSinceLastActivity).toBeLessThan(dormantThreshold);
                    });
                    
                    // Property 4: Active members should be below at-risk threshold
                    result.activeMembers.forEach(member => {
                        expect(member.daysSinceLastActivity).toBeLessThan(dormantThreshold * 0.7);
                    });
                    
                    // Property 5: Risk levels should be consistent with days since activity
                    [...result.dormantMembers, ...result.atRiskMembers, ...result.activeMembers].forEach(member => {
                        if (member.daysSinceLastActivity >= dormantThreshold) {
                            expect(member.riskLevel).toBe('dormant');
                        } else if (member.daysSinceLastActivity >= dormantThreshold * 0.7) {
                            expect(member.riskLevel).toBe('high');
                        } else if (member.daysSinceLastActivity >= dormantThreshold * 0.4) {
                            expect(member.riskLevel).toBe('medium');
                        } else {
                            expect(member.riskLevel).toBe('low');
                        }
                    });
                }
            ), { numRuns: 30 });
        });

        test('top active members should maintain ranking consistency', async () => {
            await fc.assert(fc.asyncProperty(
                fc.array(memberGenerator, { minLength: 5, maxLength: 100 }),
                fc.array(transactionGenerator, { minLength: 10, maxLength: 1000 }),
                fc.integer({ min: 3, max: 20 }), // limit for top members
                async (members, transactions, limit) => {
                    const activeMembers = members.map(m => ({ ...m, status: 'aktif' }));
                    const validTransactions = transactions.map(t => ({
                        ...t,
                        member_id: activeMembers[Math.floor(Math.random() * activeMembers.length)]?.id || 1
                    }));

                    const dataSource = new MockDataSource(activeMembers, validTransactions);
                    const analytics = new MemberAnalytics(dataSource);
                    
                    const startDate = new Date('2024-01-01');
                    const endDate = new Date('2024-12-31');
                    
                    const topMembers = await analytics.getTopActiveMembers(startDate, endDate, limit);
                    
                    // Property 1: Rankings should be in descending order
                    // By transaction count
                    for (let i = 0; i < topMembers.byTransactionCount.length - 1; i++) {
                        expect(topMembers.byTransactionCount[i].transactionCount)
                            .toBeGreaterThanOrEqual(topMembers.byTransactionCount[i + 1].transactionCount);
                    }
                    
                    // By total value
                    for (let i = 0; i < topMembers.byTotalValue.length - 1; i++) {
                        expect(topMembers.byTotalValue[i].totalValue)
                            .toBeGreaterThanOrEqual(topMembers.byTotalValue[i + 1].totalValue);
                    }
                    
                    // By average transaction value
                    for (let i = 0; i < topMembers.byAvgTransactionValue.length - 1; i++) {
                        expect(topMembers.byAvgTransactionValue[i].avgTransactionValue)
                            .toBeGreaterThanOrEqual(topMembers.byAvgTransactionValue[i + 1].avgTransactionValue);
                    }
                    
                    // Property 2: Result arrays should not exceed the limit
                    expect(topMembers.byTransactionCount.length).toBeLessThanOrEqual(limit);
                    expect(topMembers.byTotalValue.length).toBeLessThanOrEqual(limit);
                    expect(topMembers.byAvgTransactionValue.length).toBeLessThanOrEqual(limit);
                    
                    // Property 3: All returned members should have positive metrics
                    [...topMembers.byTransactionCount, ...topMembers.byTotalValue, ...topMembers.byAvgTransactionValue]
                        .forEach(member => {
                            expect(member.transactionCount).toBeGreaterThan(0);
                            expect(member.totalValue).toBeGreaterThan(0);
                            expect(member.avgTransactionValue).toBeGreaterThan(0);
                        });
                }
            ), { numRuns: 30 });
        });
    });
});