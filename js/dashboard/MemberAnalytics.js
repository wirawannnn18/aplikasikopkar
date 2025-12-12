/**
 * Member Analytics Module
 * Handles member activity analysis, segmentation, and engagement metrics
 * 
 * **Feature: dashboard-analytics-kpi, Property 8: Member Segmentation Consistency**
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.5**
 */

class MemberAnalytics {
    constructor(dataSource) {
        this.dataSource = dataSource;
        this.segmentationThresholds = {
            highActivity: { minTransactions: 10, minValue: 1000000 }, // 10 transactions, 1M IDR
            mediumActivity: { minTransactions: 5, minValue: 500000 },  // 5 transactions, 500K IDR
            lowActivity: { minTransactions: 1, minValue: 100000 },     // 1 transaction, 100K IDR
            dormantDays: 90 // Days without activity to be considered dormant
        };
    }

    /**
     * Generate member activity heatmap data
     * @param {Date} startDate - Start date for analysis
     * @param {Date} endDate - End date for analysis
     * @returns {Promise<Object>} Heatmap data with member activity patterns
     */
    async generateActivityHeatmap(startDate, endDate) {
        try {
            const transactions = await this.dataSource.getTransactionsByDateRange(startDate, endDate);
            const members = await this.dataSource.getAllActiveMembers();
            
            // Create activity matrix: member x day
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
        } catch (error) {
            console.error('Error generating activity heatmap:', error);
            throw new Error('Failed to generate member activity heatmap');
        }
    }

    /**
     * Segment members by transaction volume and frequency
     * @param {Date} startDate - Start date for analysis period
     * @param {Date} endDate - End date for analysis period
     * @returns {Promise<Object>} Member segmentation results
     */
    async segmentMembersByActivity(startDate, endDate) {
        try {
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
            
            // Group by segments
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
        } catch (error) {
            console.error('Error segmenting members:', error);
            throw new Error('Failed to segment members by activity');
        }
    }

    /**
     * Identify dormant members at risk of becoming inactive
     * @param {number} dormantThresholdDays - Days without activity to consider dormant
     * @returns {Promise<Object>} Dormant member identification results
     */
    async identifyDormantMembers(dormantThresholdDays = this.segmentationThresholds.dormantDays) {
        try {
            const members = await this.dataSource.getAllActiveMembers();
            const currentDate = new Date();
            const thresholdDate = new Date(currentDate.getTime() - (dormantThresholdDays * 24 * 60 * 60 * 1000));
            
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
        } catch (error) {
            console.error('Error identifying dormant members:', error);
            throw new Error('Failed to identify dormant members');
        }
    }

    /**
     * Get top active members by various criteria
     * @param {Date} startDate - Start date for analysis
     * @param {Date} endDate - End date for analysis
     * @param {number} limit - Number of top members to return
     * @returns {Promise<Object>} Top active members analysis
     */
    async getTopActiveMembers(startDate, endDate, limit = 10) {
        try {
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
        } catch (error) {
            console.error('Error getting top active members:', error);
            throw new Error('Failed to get top active members');
        }
    }

    // Private helper methods
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
        
        // Normalize intensity based on both count and value
        const countScore = Math.min(count / 5, 1); // Max 5 transactions per day = 1.0
        const valueScore = Math.min(totalValue / 5000000, 1); // Max 5M IDR per day = 1.0
        
        return Math.round((countScore + valueScore) / 2 * 100); // 0-100 scale
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
    /**
     * Calculate comprehensive engagement metrics for members
     * @param {Date} startDate - Start date for analysis period
     * @param {Date} endDate - End date for analysis period
     * @returns {Promise<Object>} Comprehensive engagement metrics
     */
    async calculateEngagementMetrics(startDate, endDate) {
        try {
            const transactions = await this.dataSource.getTransactionsByDateRange(startDate, endDate);
            const members = await this.dataSource.getAllActiveMembers();
            
            const memberEngagementData = [];
            let totalTransactionValue = 0;
            let totalTransactionCount = 0;
            
            // Calculate individual member engagement metrics
            for (const member of members) {
                const memberTransactions = transactions.filter(t => t.member_id === member.id);
                const totalValue = memberTransactions.reduce((sum, t) => sum + (t.jumlah || 0), 0);
                const transactionCount = memberTransactions.length;
                const avgTransactionValue = transactionCount > 0 ? totalValue / transactionCount : 0;
                
                // Calculate engagement trends
                const engagementTrend = await this._calculateMemberEngagementTrend(member.id, startDate, endDate);
                
                // Calculate risk assessment
                const riskAssessment = await this._assessMemberInactivityRisk(member.id);
                
                const memberEngagement = {
                    ...member,
                    transactionCount,
                    totalValue,
                    avgTransactionValue,
                    engagementScore: this._calculateEngagementScore(transactionCount, totalValue, engagementTrend),
                    trend: engagementTrend,
                    riskLevel: riskAssessment.riskLevel,
                    daysSinceLastActivity: riskAssessment.daysSinceLastActivity,
                    engagementCategory: this._categorizeEngagement(transactionCount, totalValue, engagementTrend)
                };
                
                memberEngagementData.push(memberEngagement);
                totalTransactionValue += totalValue;
                totalTransactionCount += transactionCount;
            }
            
            // Calculate overall engagement statistics
            const overallMetrics = {
                totalMembers: members.length,
                activeMembers: memberEngagementData.filter(m => m.transactionCount > 0).length,
                avgTransactionValuePerMember: members.length > 0 ? totalTransactionValue / members.length : 0,
                avgTransactionValueOverall: totalTransactionCount > 0 ? totalTransactionValue / totalTransactionCount : 0,
                totalTransactionValue,
                totalTransactionCount,
                engagementDistribution: this._calculateEngagementDistribution(memberEngagementData)
            };
            
            return {
                memberEngagementData: memberEngagementData.sort((a, b) => b.engagementScore - a.engagementScore),
                overallMetrics,
                trendAnalysis: this._analyzeTrends(memberEngagementData),
                riskAnalysis: this._analyzeRisks(memberEngagementData),
                analysisDate: new Date().toISOString(),
                period: {
                    start: startDate.toISOString().split('T')[0],
                    end: endDate.toISOString().split('T')[0]
                }
            };
        } catch (error) {
            console.error('Error calculating engagement metrics:', error);
            throw new Error('Failed to calculate engagement metrics');
        }
    }

    /**
     * Calculate member engagement trend analysis
     * @param {Date} startDate - Start date for trend analysis
     * @param {Date} endDate - End date for trend analysis
     * @returns {Promise<Object>} Engagement trend analysis
     */
    async calculateEngagementTrends(startDate, endDate) {
        try {
            const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
            const periodLength = Math.floor(totalDays / 4); // Divide into 4 periods for trend analysis
            
            const periods = [];
            for (let i = 0; i < 4; i++) {
                const periodStart = new Date(startDate.getTime() + (i * periodLength * 24 * 60 * 60 * 1000));
                const periodEnd = new Date(startDate.getTime() + ((i + 1) * periodLength * 24 * 60 * 60 * 1000));
                periods.push({ start: periodStart, end: periodEnd, index: i + 1 });
            }
            
            const trendData = [];
            
            for (const period of periods) {
                const periodMetrics = await this.calculateEngagementMetrics(period.start, period.end);
                
                trendData.push({
                    period: period.index,
                    startDate: period.start.toISOString().split('T')[0],
                    endDate: period.end.toISOString().split('T')[0],
                    activeMembers: periodMetrics.overallMetrics.activeMembers,
                    avgTransactionValue: periodMetrics.overallMetrics.avgTransactionValuePerMember,
                    totalTransactionValue: periodMetrics.overallMetrics.totalTransactionValue,
                    totalTransactionCount: periodMetrics.overallMetrics.totalTransactionCount,
                    engagementScore: this._calculatePeriodEngagementScore(periodMetrics.overallMetrics)
                });
            }
            
            // Calculate trend direction and growth rates
            const trendAnalysis = {
                periods: trendData,
                trends: {
                    activeMembersTrend: this._calculateTrendDirection(trendData.map(p => p.activeMembers)),
                    avgTransactionValueTrend: this._calculateTrendDirection(trendData.map(p => p.avgTransactionValue)),
                    totalValueTrend: this._calculateTrendDirection(trendData.map(p => p.totalTransactionValue)),
                    engagementScoreTrend: this._calculateTrendDirection(trendData.map(p => p.engagementScore))
                },
                growthRates: {
                    activeMembersGrowth: this._calculateGrowthRate(trendData[0].activeMembers, trendData[trendData.length - 1].activeMembers),
                    avgTransactionValueGrowth: this._calculateGrowthRate(trendData[0].avgTransactionValue, trendData[trendData.length - 1].avgTransactionValue),
                    totalValueGrowth: this._calculateGrowthRate(trendData[0].totalTransactionValue, trendData[trendData.length - 1].totalTransactionValue)
                }
            };
            
            return {
                trendAnalysis,
                summary: this._generateTrendSummary(trendAnalysis),
                analysisDate: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error calculating engagement trends:', error);
            throw new Error('Failed to calculate engagement trends');
        }
    }

    /**
     * Assess member inactivity risk for all members
     * @returns {Promise<Object>} Risk assessment results
     */
    async assessMemberInactivityRisk() {
        try {
            const members = await this.dataSource.getAllActiveMembers();
            const currentDate = new Date();
            
            const riskAssessments = [];
            
            for (const member of members) {
                const riskData = await this._assessMemberInactivityRisk(member.id);
                const engagementHistory = await this._getMemberEngagementHistory(member.id);
                
                riskAssessments.push({
                    ...member,
                    ...riskData,
                    engagementHistory,
                    riskFactors: this._identifyRiskFactors(riskData, engagementHistory),
                    recommendedActions: this._generateRiskRecommendations(riskData, engagementHistory)
                });
            }
            
            // Group by risk levels
            const riskGroups = {
                critical: riskAssessments.filter(m => m.riskLevel === 'critical'),
                high: riskAssessments.filter(m => m.riskLevel === 'high'),
                medium: riskAssessments.filter(m => m.riskLevel === 'medium'),
                low: riskAssessments.filter(m => m.riskLevel === 'low')
            };
            
            return {
                riskGroups,
                summary: {
                    totalMembers: members.length,
                    criticalRisk: riskGroups.critical.length,
                    highRisk: riskGroups.high.length,
                    mediumRisk: riskGroups.medium.length,
                    lowRisk: riskGroups.low.length,
                    riskDistribution: {
                        critical: (riskGroups.critical.length / members.length * 100).toFixed(1),
                        high: (riskGroups.high.length / members.length * 100).toFixed(1),
                        medium: (riskGroups.medium.length / members.length * 100).toFixed(1),
                        low: (riskGroups.low.length / members.length * 100).toFixed(1)
                    }
                },
                analysisDate: currentDate.toISOString()
            };
        } catch (error) {
            console.error('Error assessing member inactivity risk:', error);
            throw new Error('Failed to assess member inactivity risk');
        }
    }

    // Private helper methods for engagement metrics

    async _calculateMemberEngagementTrend(memberId, startDate, endDate) {
        const memberTransactions = await this.dataSource.getTransactionsByDateRange(startDate, endDate);
        const transactions = memberTransactions.filter(t => t.member_id === memberId);
        
        if (transactions.length === 0) {
            return { direction: 'stable', strength: 0, confidence: 0 };
        }
        
        // Divide period into segments to analyze trend
        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        const segmentDays = Math.max(7, Math.floor(totalDays / 4)); // At least 7 days per segment
        
        const segments = [];
        for (let i = 0; i < totalDays; i += segmentDays) {
            const segmentStart = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
            const segmentEnd = new Date(Math.min(segmentStart.getTime() + (segmentDays * 24 * 60 * 60 * 1000), endDate.getTime()));
            
            const segmentTransactions = transactions.filter(t => {
                const txDate = new Date(t.tanggal);
                return txDate >= segmentStart && txDate <= segmentEnd;
            });
            
            segments.push({
                start: segmentStart,
                end: segmentEnd,
                transactionCount: segmentTransactions.length,
                totalValue: segmentTransactions.reduce((sum, t) => sum + (t.jumlah || 0), 0)
            });
        }
        
        // Calculate trend using linear regression
        const values = segments.map(s => s.totalValue);
        const trend = this._calculateLinearTrend(values);
        
        return {
            direction: trend.slope > 0.1 ? 'increasing' : trend.slope < -0.1 ? 'decreasing' : 'stable',
            strength: Math.abs(trend.slope),
            confidence: trend.rSquared,
            segments
        };
    }

    async _assessMemberInactivityRisk(memberId) {
        const lastTransaction = await this.dataSource.getLastTransactionByMember(memberId);
        const currentDate = new Date();
        
        if (!lastTransaction) {
            return {
                riskLevel: 'critical',
                daysSinceLastActivity: Infinity,
                riskScore: 100,
                factors: ['no_transactions']
            };
        }
        
        const daysSinceLastActivity = Math.floor((currentDate - new Date(lastTransaction.tanggal)) / (1000 * 60 * 60 * 24));
        
        // Calculate risk score based on multiple factors
        let riskScore = 0;
        const factors = [];
        
        // Days since last activity (0-40 points)
        if (daysSinceLastActivity >= 90) {
            riskScore += 40;
            factors.push('long_inactivity');
        } else if (daysSinceLastActivity >= 60) {
            riskScore += 30;
            factors.push('moderate_inactivity');
        } else if (daysSinceLastActivity >= 30) {
            riskScore += 20;
            factors.push('recent_inactivity');
        }
        
        // Transaction frequency in last 90 days (0-30 points)
        const last90Days = new Date(currentDate.getTime() - (90 * 24 * 60 * 60 * 1000));
        const recentTransactions = await this.dataSource.getTransactionsByDateRange(last90Days, currentDate);
        const memberRecentTransactions = recentTransactions.filter(t => t.member_id === memberId);
        
        if (memberRecentTransactions.length === 0) {
            riskScore += 30;
            factors.push('no_recent_activity');
        } else if (memberRecentTransactions.length <= 2) {
            riskScore += 20;
            factors.push('low_recent_activity');
        } else if (memberRecentTransactions.length <= 5) {
            riskScore += 10;
            factors.push('moderate_recent_activity');
        }
        
        // Transaction value trend (0-30 points)
        if (memberRecentTransactions.length > 1) {
            const values = memberRecentTransactions.map(t => t.jumlah || 0);
            const trend = this._calculateLinearTrend(values);
            
            if (trend.slope < -0.2) {
                riskScore += 30;
                factors.push('declining_value_trend');
            } else if (trend.slope < -0.1) {
                riskScore += 15;
                factors.push('slight_decline_trend');
            }
        }
        
        // Determine risk level
        let riskLevel;
        if (riskScore >= 80) {
            riskLevel = 'critical';
        } else if (riskScore >= 60) {
            riskLevel = 'high';
        } else if (riskScore >= 40) {
            riskLevel = 'medium';
        } else {
            riskLevel = 'low';
        }
        
        return {
            riskLevel,
            riskScore,
            daysSinceLastActivity,
            factors,
            lastTransactionDate: lastTransaction.tanggal,
            recentTransactionCount: memberRecentTransactions.length
        };
    }

    async _getMemberEngagementHistory(memberId) {
        const last6Months = new Date();
        last6Months.setMonth(last6Months.getMonth() - 6);
        
        const transactions = await this.dataSource.getTransactionsByDateRange(last6Months, new Date());
        const memberTransactions = transactions.filter(t => t.member_id === memberId);
        
        // Group by month
        const monthlyData = {};
        memberTransactions.forEach(t => {
            const date = new Date(t.tanggal);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { count: 0, value: 0 };
            }
            
            monthlyData[monthKey].count++;
            monthlyData[monthKey].value += t.jumlah || 0;
        });
        
        return {
            monthlyData,
            totalTransactions: memberTransactions.length,
            totalValue: memberTransactions.reduce((sum, t) => sum + (t.jumlah || 0), 0),
            avgMonthlyTransactions: Object.keys(monthlyData).length > 0 ? memberTransactions.length / Object.keys(monthlyData).length : 0
        };
    }

    _calculateEngagementScore(transactionCount, totalValue, trend) {
        let score = 0;
        
        // Transaction count component (0-40 points)
        score += Math.min(transactionCount * 2, 40);
        
        // Transaction value component (0-40 points)
        score += Math.min(totalValue / 100000, 40); // 100K IDR = 1 point
        
        // Trend component (0-20 points)
        if (trend.direction === 'increasing') {
            score += 20 * trend.confidence;
        } else if (trend.direction === 'decreasing') {
            score -= 10 * trend.confidence;
        }
        
        return Math.max(0, Math.min(100, score));
    }

    _categorizeEngagement(transactionCount, totalValue, trend) {
        const score = this._calculateEngagementScore(transactionCount, totalValue, trend);
        
        if (score >= 80) return 'highly_engaged';
        if (score >= 60) return 'engaged';
        if (score >= 40) return 'moderately_engaged';
        if (score >= 20) return 'low_engagement';
        return 'disengaged';
    }

    _calculateEngagementDistribution(memberData) {
        const distribution = {
            highly_engaged: 0,
            engaged: 0,
            moderately_engaged: 0,
            low_engagement: 0,
            disengaged: 0
        };
        
        memberData.forEach(member => {
            distribution[member.engagementCategory]++;
        });
        
        const total = memberData.length;
        return {
            counts: distribution,
            percentages: {
                highly_engaged: (distribution.highly_engaged / total * 100).toFixed(1),
                engaged: (distribution.engaged / total * 100).toFixed(1),
                moderately_engaged: (distribution.moderately_engaged / total * 100).toFixed(1),
                low_engagement: (distribution.low_engagement / total * 100).toFixed(1),
                disengaged: (distribution.disengaged / total * 100).toFixed(1)
            }
        };
    }

    _analyzeTrends(memberData) {
        const trends = {
            increasing: memberData.filter(m => m.trend.direction === 'increasing').length,
            decreasing: memberData.filter(m => m.trend.direction === 'decreasing').length,
            stable: memberData.filter(m => m.trend.direction === 'stable').length
        };
        
        const total = memberData.length;
        return {
            counts: trends,
            percentages: {
                increasing: (trends.increasing / total * 100).toFixed(1),
                decreasing: (trends.decreasing / total * 100).toFixed(1),
                stable: (trends.stable / total * 100).toFixed(1)
            }
        };
    }

    _analyzeRisks(memberData) {
        const risks = {
            critical: memberData.filter(m => m.riskLevel === 'critical').length,
            high: memberData.filter(m => m.riskLevel === 'high').length,
            medium: memberData.filter(m => m.riskLevel === 'medium').length,
            low: memberData.filter(m => m.riskLevel === 'low').length
        };
        
        const total = memberData.length;
        return {
            counts: risks,
            percentages: {
                critical: (risks.critical / total * 100).toFixed(1),
                high: (risks.high / total * 100).toFixed(1),
                medium: (risks.medium / total * 100).toFixed(1),
                low: (risks.low / total * 100).toFixed(1)
            }
        };
    }

    _calculateLinearTrend(values) {
        if (values.length < 2) return { slope: 0, rSquared: 0 };
        
        const n = values.length;
        const x = Array.from({ length: n }, (_, i) => i);
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = values.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Calculate R-squared
        const yMean = sumY / n;
        const ssRes = values.reduce((sum, yi, i) => {
            const predicted = slope * x[i] + intercept;
            return sum + Math.pow(yi - predicted, 2);
        }, 0);
        const ssTot = values.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
        const rSquared = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);
        
        return { slope, intercept, rSquared: Math.max(0, rSquared) };
    }

    _calculateTrendDirection(values) {
        const trend = this._calculateLinearTrend(values);
        return {
            direction: trend.slope > 0.1 ? 'increasing' : trend.slope < -0.1 ? 'decreasing' : 'stable',
            strength: Math.abs(trend.slope),
            confidence: trend.rSquared
        };
    }

    _calculateGrowthRate(startValue, endValue) {
        if (startValue === 0) return endValue > 0 ? 100 : 0;
        return ((endValue - startValue) / startValue * 100).toFixed(2);
    }

    _calculatePeriodEngagementScore(metrics) {
        // Normalize metrics to calculate overall engagement score for a period
        const activeRate = metrics.totalMembers > 0 ? metrics.activeMembers / metrics.totalMembers : 0;
        const avgValueNormalized = Math.min(metrics.avgTransactionValuePerMember / 1000000, 1); // Normalize to 1M IDR
        const transactionRate = metrics.totalMembers > 0 ? metrics.totalTransactionCount / metrics.totalMembers : 0;
        
        return (activeRate * 40 + avgValueNormalized * 30 + Math.min(transactionRate / 10, 1) * 30).toFixed(1);
    }

    _generateTrendSummary(trendAnalysis) {
        const trends = trendAnalysis.trends;
        const growth = trendAnalysis.growthRates;
        
        let summary = 'Engagement Trend Summary:\n';
        
        // Active members trend
        if (trends.activeMembersTrend.direction === 'increasing') {
            summary += `✅ Active members are increasing (${growth.activeMembersGrowth}% growth)\n`;
        } else if (trends.activeMembersTrend.direction === 'decreasing') {
            summary += `⚠️ Active members are decreasing (${growth.activeMembersGrowth}% decline)\n`;
        } else {
            summary += `➡️ Active members remain stable\n`;
        }
        
        // Transaction value trend
        if (trends.avgTransactionValueTrend.direction === 'increasing') {
            summary += `✅ Average transaction value is increasing (${growth.avgTransactionValueGrowth}% growth)\n`;
        } else if (trends.avgTransactionValueTrend.direction === 'decreasing') {
            summary += `⚠️ Average transaction value is decreasing (${growth.avgTransactionValueGrowth}% decline)\n`;
        } else {
            summary += `➡️ Average transaction value remains stable\n`;
        }
        
        // Overall engagement trend
        if (trends.engagementScoreTrend.direction === 'increasing') {
            summary += `✅ Overall engagement is improving\n`;
        } else if (trends.engagementScoreTrend.direction === 'decreasing') {
            summary += `⚠️ Overall engagement is declining\n`;
        } else {
            summary += `➡️ Overall engagement remains stable\n`;
        }
        
        return summary;
    }

    _identifyRiskFactors(riskData, engagementHistory) {
        const factors = [...riskData.factors];
        
        // Add additional risk factors based on engagement history
        if (engagementHistory.avgMonthlyTransactions < 1) {
            factors.push('low_historical_activity');
        }
        
        if (engagementHistory.totalValue < 500000) { // Less than 500K IDR in 6 months
            factors.push('low_transaction_value');
        }
        
        const monthsWithActivity = Object.keys(engagementHistory.monthlyData).length;
        if (monthsWithActivity < 3) { // Active in less than 3 of last 6 months
            factors.push('inconsistent_activity');
        }
        
        return factors;
    }

    _generateRiskRecommendations(riskData, engagementHistory) {
        const recommendations = [];
        
        if (riskData.riskLevel === 'critical') {
            recommendations.push('Immediate personal outreach required');
            recommendations.push('Offer special incentives or promotions');
            recommendations.push('Schedule one-on-one consultation');
        } else if (riskData.riskLevel === 'high') {
            recommendations.push('Send personalized engagement message');
            recommendations.push('Offer targeted financial products');
            recommendations.push('Invite to member events');
        } else if (riskData.riskLevel === 'medium') {
            recommendations.push('Include in regular newsletter');
            recommendations.push('Send reminder about available services');
        }
        
        // Specific recommendations based on risk factors
        if (riskData.factors.includes('declining_value_trend')) {
            recommendations.push('Investigate reasons for declining transaction values');
        }
        
        if (riskData.factors.includes('no_recent_activity')) {
            recommendations.push('Check member contact information and preferences');
        }
        
        return recommendations;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MemberAnalytics;
}