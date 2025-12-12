/**
 * Data Aggregator Module
 * Handles efficient data processing, aggregation, and transformation for dashboard analytics
 * 
 * **Feature: dashboard-analytics-kpi, Property 10: Data Aggregation Consistency**
 * **Validates: Requirements 2.1, 2.3, 4.3, 8.1, 8.3**
 */

class DataAggregator {
    constructor(dataSource) {
        this.dataSource = dataSource;
        this.aggregationCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        
        // Aggregation configurations
        this.timeIntervals = {
            daily: { unit: 'day', format: 'YYYY-MM-DD' },
            weekly: { unit: 'week', format: 'YYYY-[W]WW' },
            monthly: { unit: 'month', format: 'YYYY-MM' },
            quarterly: { unit: 'quarter', format: 'YYYY-[Q]Q' },
            yearly: { unit: 'year', format: 'YYYY' }
        };
        
        this.savingsCategories = ['pokok', 'wajib', 'sukarela'];
        this.loanCategories = ['produktif', 'konsumtif', 'darurat'];
    }

    /**
     * Aggregate data by time intervals (daily, monthly, yearly)
     * @param {Array} data - Raw data array
     * @param {string} timeInterval - Time interval (daily, weekly, monthly, quarterly, yearly)
     * @param {string} dateField - Field name containing date
     * @param {string} valueField - Field name containing value to aggregate
     * @param {string} aggregationType - Type of aggregation (sum, avg, count, min, max)
     * @returns {Promise<Object>} Aggregated data by time intervals
     */
    async aggregateByTime(data, timeInterval, dateField, valueField, aggregationType = 'sum') {
        try {
            const cacheKey = `time_${timeInterval}_${dateField}_${valueField}_${aggregationType}_${data.length}`;
            
            // Check cache first
            if (this.aggregationCache.has(cacheKey)) {
                const cached = this.aggregationCache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    return cached.data;
                }
            }

            const interval = this.timeIntervals[timeInterval];
            if (!interval) {
                throw new Error(`Unsupported time interval: ${timeInterval}`);
            }

            const aggregated = {};
            const summary = {
                totalRecords: data.length,
                totalValue: 0,
                averageValue: 0,
                minValue: Infinity,
                maxValue: -Infinity,
                periods: 0
            };

            // Group data by time interval
            data.forEach(record => {
                if (!record[dateField] || record[valueField] === undefined) return;

                const date = new Date(record[dateField]);
                const periodKey = this._formatDateByInterval(date, interval);
                const value = parseFloat(record[valueField]) || 0;

                if (!aggregated[periodKey]) {
                    aggregated[periodKey] = {
                        period: periodKey,
                        date: date,
                        values: [],
                        count: 0,
                        sum: 0,
                        avg: 0,
                        min: Infinity,
                        max: -Infinity
                    };
                }

                aggregated[periodKey].values.push(value);
                aggregated[periodKey].count++;
                aggregated[periodKey].sum += value;
                aggregated[periodKey].min = Math.min(aggregated[periodKey].min, value);
                aggregated[periodKey].max = Math.max(aggregated[periodKey].max, value);
            });

            // Calculate final aggregations and summary
            const result = [];
            Object.keys(aggregated).sort().forEach(periodKey => {
                const period = aggregated[periodKey];
                
                // Calculate average
                period.avg = period.count > 0 ? period.sum / period.count : 0;
                
                // Apply aggregation type
                let finalValue;
                switch (aggregationType) {
                    case 'sum':
                        finalValue = period.sum;
                        break;
                    case 'avg':
                        finalValue = period.avg;
                        break;
                    case 'count':
                        finalValue = period.count;
                        break;
                    case 'min':
                        finalValue = period.min === Infinity ? 0 : period.min;
                        break;
                    case 'max':
                        finalValue = period.max === -Infinity ? 0 : period.max;
                        break;
                    default:
                        finalValue = period.sum;
                }

                const periodResult = {
                    period: periodKey,
                    date: period.date.toISOString(),
                    value: finalValue,
                    count: period.count,
                    sum: period.sum,
                    avg: period.avg,
                    min: period.min === Infinity ? 0 : period.min,
                    max: period.max === -Infinity ? 0 : period.max
                };

                result.push(periodResult);

                // Update summary
                summary.totalValue += period.sum;
                summary.minValue = Math.min(summary.minValue, finalValue);
                summary.maxValue = Math.max(summary.maxValue, finalValue);
            });

            summary.periods = result.length;
            summary.averageValue = summary.periods > 0 ? summary.totalValue / summary.periods : 0;
            summary.minValue = summary.minValue === Infinity ? 0 : summary.minValue;
            summary.maxValue = summary.maxValue === -Infinity ? 0 : summary.maxValue;

            const finalResult = {
                data: result,
                summary,
                aggregationType,
                timeInterval,
                generatedAt: new Date().toISOString()
            };

            // Cache the result
            this.aggregationCache.set(cacheKey, {
                data: finalResult,
                timestamp: Date.now()
            });

            return finalResult;
        } catch (error) {
            console.error('Error in time aggregation:', error);
            throw new Error('Failed to aggregate data by time');
        }
    }

    /**
     * Aggregate savings data by category (pokok, wajib, sukarela)
     * @param {Date} startDate - Start date for aggregation
     * @param {Date} endDate - End date for aggregation
     * @returns {Promise<Object>} Savings aggregated by category
     */
    async aggregateSavingsByCategory(startDate, endDate) {
        try {
            const cacheKey = `savings_category_${startDate.getTime()}_${endDate.getTime()}`;
            
            // Check cache
            if (this.aggregationCache.has(cacheKey)) {
                const cached = this.aggregationCache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    return cached.data;
                }
            }

            const savingsData = await this.dataSource.getSavingsByDateRange(startDate, endDate);
            
            const categoryAggregation = {};
            let totalSavings = 0;

            // Initialize categories
            this.savingsCategories.forEach(category => {
                categoryAggregation[category] = {
                    category,
                    totalAmount: 0,
                    transactionCount: 0,
                    memberCount: new Set(),
                    averagePerTransaction: 0,
                    averagePerMember: 0,
                    growth: 0,
                    percentage: 0
                };
            });

            // Aggregate by category
            savingsData.forEach(saving => {
                const category = saving.jenis_simpanan || 'sukarela';
                const amount = parseFloat(saving.jumlah) || 0;
                
                if (categoryAggregation[category]) {
                    categoryAggregation[category].totalAmount += amount;
                    categoryAggregation[category].transactionCount++;
                    categoryAggregation[category].memberCount.add(saving.anggota_id);
                    totalSavings += amount;
                }
            });

            // Calculate derived metrics
            Object.keys(categoryAggregation).forEach(category => {
                const cat = categoryAggregation[category];
                cat.memberCount = cat.memberCount.size;
                cat.averagePerTransaction = cat.transactionCount > 0 ? cat.totalAmount / cat.transactionCount : 0;
                cat.averagePerMember = cat.memberCount > 0 ? cat.totalAmount / cat.memberCount : 0;
                cat.percentage = totalSavings > 0 ? (cat.totalAmount / totalSavings * 100) : 0;
            });

            // Calculate growth rates (compare with previous period)
            const previousPeriodStart = new Date(startDate);
            const previousPeriodEnd = new Date(endDate);
            const periodDuration = endDate.getTime() - startDate.getTime();
            
            previousPeriodStart.setTime(startDate.getTime() - periodDuration);
            previousPeriodEnd.setTime(endDate.getTime() - periodDuration);

            const previousSavings = await this.aggregateSavingsByCategory(previousPeriodStart, previousPeriodEnd);
            
            Object.keys(categoryAggregation).forEach(category => {
                const current = categoryAggregation[category].totalAmount;
                const previous = previousSavings.categories[category]?.totalAmount || 0;
                
                if (previous > 0) {
                    categoryAggregation[category].growth = ((current - previous) / previous * 100);
                } else {
                    categoryAggregation[category].growth = current > 0 ? 100 : 0;
                }
            });

            const result = {
                categories: categoryAggregation,
                summary: {
                    totalAmount: totalSavings,
                    totalTransactions: savingsData.length,
                    totalMembers: new Set(savingsData.map(s => s.anggota_id)).size,
                    averagePerTransaction: savingsData.length > 0 ? totalSavings / savingsData.length : 0,
                    period: {
                        start: startDate.toISOString(),
                        end: endDate.toISOString()
                    }
                },
                generatedAt: new Date().toISOString()
            };

            // Cache result
            this.aggregationCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            return result;
        } catch (error) {
            console.error('Error aggregating savings by category:', error);
            throw new Error('Failed to aggregate savings by category');
        }
    }

    /**
     * Aggregate loans data by category and status
     * @param {Date} startDate - Start date for aggregation
     * @param {Date} endDate - End date for aggregation
     * @returns {Promise<Object>} Loans aggregated by category and status
     */
    async aggregateLoansByCategory(startDate, endDate) {
        try {
            const cacheKey = `loans_category_${startDate.getTime()}_${endDate.getTime()}`;
            
            // Check cache
            if (this.aggregationCache.has(cacheKey)) {
                const cached = this.aggregationCache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    return cached.data;
                }
            }

            const loansData = await this.dataSource.getLoansByDateRange(startDate, endDate);
            
            const categoryAggregation = {};
            const statusAggregation = {
                active: { count: 0, amount: 0 },
                completed: { count: 0, amount: 0 },
                overdue: { count: 0, amount: 0 },
                defaulted: { count: 0, amount: 0 }
            };

            let totalLoans = 0;

            // Initialize loan categories
            this.loanCategories.forEach(category => {
                categoryAggregation[category] = {
                    category,
                    totalAmount: 0,
                    loanCount: 0,
                    memberCount: new Set(),
                    averageAmount: 0,
                    activeLoans: 0,
                    completedLoans: 0,
                    overdueLoans: 0,
                    percentage: 0
                };
            });

            // Aggregate by category and status
            loansData.forEach(loan => {
                const category = loan.jenis_pinjaman || 'konsumtif';
                const amount = parseFloat(loan.jumlah_pinjaman) || 0;
                const status = loan.status_pinjaman || 'active';
                
                if (categoryAggregation[category]) {
                    categoryAggregation[category].totalAmount += amount;
                    categoryAggregation[category].loanCount++;
                    categoryAggregation[category].memberCount.add(loan.anggota_id);
                    
                    // Count by status
                    if (status === 'active') categoryAggregation[category].activeLoans++;
                    else if (status === 'completed') categoryAggregation[category].completedLoans++;
                    else if (status === 'overdue') categoryAggregation[category].overdueLoans++;
                    
                    totalLoans += amount;
                }

                // Aggregate by status
                if (statusAggregation[status]) {
                    statusAggregation[status].count++;
                    statusAggregation[status].amount += amount;
                }
            });

            // Calculate derived metrics
            Object.keys(categoryAggregation).forEach(category => {
                const cat = categoryAggregation[category];
                cat.memberCount = cat.memberCount.size;
                cat.averageAmount = cat.loanCount > 0 ? cat.totalAmount / cat.loanCount : 0;
                cat.percentage = totalLoans > 0 ? (cat.totalAmount / totalLoans * 100) : 0;
            });

            const result = {
                categories: categoryAggregation,
                statuses: statusAggregation,
                summary: {
                    totalAmount: totalLoans,
                    totalLoans: loansData.length,
                    totalMembers: new Set(loansData.map(l => l.anggota_id)).size,
                    averageAmount: loansData.length > 0 ? totalLoans / loansData.length : 0,
                    period: {
                        start: startDate.toISOString(),
                        end: endDate.toISOString()
                    }
                },
                generatedAt: new Date().toISOString()
            };

            // Cache result
            this.aggregationCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            return result;
        } catch (error) {
            console.error('Error aggregating loans by category:', error);
            throw new Error('Failed to aggregate loans by category');
        }
    }

    /**
     * Filter and sort data efficiently
     * @param {Array} data - Data array to filter and sort
     * @param {Object} filters - Filter criteria
     * @param {Object} sortOptions - Sort options
     * @returns {Array} Filtered and sorted data
     */
    filterAndSort(data, filters = {}, sortOptions = {}) {
        try {
            let filteredData = [...data];

            // Apply filters
            Object.keys(filters).forEach(field => {
                const filterValue = filters[field];
                
                if (filterValue !== undefined && filterValue !== null && filterValue !== '') {
                    filteredData = filteredData.filter(record => {
                        const recordValue = record[field];
                        
                        if (typeof filterValue === 'object' && filterValue.operator) {
                            // Advanced filtering with operators
                            switch (filterValue.operator) {
                                case 'equals':
                                    return recordValue === filterValue.value;
                                case 'contains':
                                    return String(recordValue).toLowerCase().includes(String(filterValue.value).toLowerCase());
                                case 'startsWith':
                                    return String(recordValue).toLowerCase().startsWith(String(filterValue.value).toLowerCase());
                                case 'greaterThan':
                                    return parseFloat(recordValue) > parseFloat(filterValue.value);
                                case 'lessThan':
                                    return parseFloat(recordValue) < parseFloat(filterValue.value);
                                case 'between':
                                    const numValue = parseFloat(recordValue);
                                    return numValue >= parseFloat(filterValue.min) && numValue <= parseFloat(filterValue.max);
                                case 'dateRange':
                                    const recordDate = new Date(recordValue);
                                    const startDate = new Date(filterValue.start);
                                    const endDate = new Date(filterValue.end);
                                    return recordDate >= startDate && recordDate <= endDate;
                                default:
                                    return recordValue === filterValue.value;
                            }
                        } else {
                            // Simple equality filter
                            return recordValue === filterValue;
                        }
                    });
                }
            });

            // Apply sorting
            if (sortOptions.field) {
                filteredData.sort((a, b) => {
                    const aValue = a[sortOptions.field];
                    const bValue = b[sortOptions.field];
                    
                    let comparison = 0;
                    
                    if (typeof aValue === 'number' && typeof bValue === 'number') {
                        comparison = aValue - bValue;
                    } else if (aValue instanceof Date && bValue instanceof Date) {
                        comparison = aValue.getTime() - bValue.getTime();
                    } else {
                        comparison = String(aValue).localeCompare(String(bValue));
                    }
                    
                    return sortOptions.direction === 'desc' ? -comparison : comparison;
                });
            }

            return filteredData;
        } catch (error) {
            console.error('Error in filtering and sorting:', error);
            return data; // Return original data if filtering fails
        }
    }

    /**
     * Create data pivot table
     * @param {Array} data - Source data
     * @param {string} rowField - Field for rows
     * @param {string} columnField - Field for columns
     * @param {string} valueField - Field for values
     * @param {string} aggregationType - Aggregation type (sum, avg, count)
     * @returns {Object} Pivot table data
     */
    createPivotTable(data, rowField, columnField, valueField, aggregationType = 'sum') {
        try {
            const pivot = {};
            const rowTotals = {};
            const columnTotals = {};
            let grandTotal = 0;

            // Build pivot structure
            data.forEach(record => {
                const rowKey = record[rowField] || 'Unknown';
                const colKey = record[columnField] || 'Unknown';
                const value = parseFloat(record[valueField]) || 0;

                if (!pivot[rowKey]) {
                    pivot[rowKey] = {};
                    rowTotals[rowKey] = { sum: 0, count: 0, values: [] };
                }

                if (!pivot[rowKey][colKey]) {
                    pivot[rowKey][colKey] = { sum: 0, count: 0, values: [] };
                }

                if (!columnTotals[colKey]) {
                    columnTotals[colKey] = { sum: 0, count: 0, values: [] };
                }

                // Add value
                pivot[rowKey][colKey].sum += value;
                pivot[rowKey][colKey].count++;
                pivot[rowKey][colKey].values.push(value);

                rowTotals[rowKey].sum += value;
                rowTotals[rowKey].count++;
                rowTotals[rowKey].values.push(value);

                columnTotals[colKey].sum += value;
                columnTotals[colKey].count++;
                columnTotals[colKey].values.push(value);

                grandTotal += value;
            });

            // Apply aggregation type
            const applyAggregation = (cell) => {
                switch (aggregationType) {
                    case 'sum':
                        return cell.sum;
                    case 'avg':
                        return cell.count > 0 ? cell.sum / cell.count : 0;
                    case 'count':
                        return cell.count;
                    case 'min':
                        return cell.values.length > 0 ? Math.min(...cell.values) : 0;
                    case 'max':
                        return cell.values.length > 0 ? Math.max(...cell.values) : 0;
                    default:
                        return cell.sum;
                }
            };

            // Process pivot data
            const processedPivot = {};
            Object.keys(pivot).forEach(rowKey => {
                processedPivot[rowKey] = {};
                Object.keys(pivot[rowKey]).forEach(colKey => {
                    processedPivot[rowKey][colKey] = applyAggregation(pivot[rowKey][colKey]);
                });
            });

            // Process totals
            const processedRowTotals = {};
            Object.keys(rowTotals).forEach(rowKey => {
                processedRowTotals[rowKey] = applyAggregation(rowTotals[rowKey]);
            });

            const processedColumnTotals = {};
            Object.keys(columnTotals).forEach(colKey => {
                processedColumnTotals[colKey] = applyAggregation(columnTotals[colKey]);
            });

            return {
                pivot: processedPivot,
                rowTotals: processedRowTotals,
                columnTotals: processedColumnTotals,
                grandTotal: aggregationType === 'count' ? data.length : grandTotal,
                aggregationType,
                metadata: {
                    rowField,
                    columnField,
                    valueField,
                    totalRows: Object.keys(processedPivot).length,
                    totalColumns: Object.keys(processedColumnTotals).length,
                    totalRecords: data.length
                }
            };
        } catch (error) {
            console.error('Error creating pivot table:', error);
            throw new Error('Failed to create pivot table');
        }
    }

    /**
     * Clear aggregation cache
     * @param {string} pattern - Optional pattern to match cache keys
     */
    clearCache(pattern = null) {
        if (pattern) {
            const keysToDelete = [];
            for (const key of this.aggregationCache.keys()) {
                if (key.includes(pattern)) {
                    keysToDelete.push(key);
                }
            }
            keysToDelete.forEach(key => this.aggregationCache.delete(key));
        } else {
            this.aggregationCache.clear();
        }
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        const now = Date.now();
        let validEntries = 0;
        let expiredEntries = 0;

        for (const [key, value] of this.aggregationCache.entries()) {
            if (now - value.timestamp < this.cacheTimeout) {
                validEntries++;
            } else {
                expiredEntries++;
            }
        }

        return {
            totalEntries: this.aggregationCache.size,
            validEntries,
            expiredEntries,
            cacheTimeout: this.cacheTimeout,
            memoryUsage: this._estimateCacheSize()
        };
    }

    // Private helper methods
    _formatDateByInterval(date, interval) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        switch (interval.unit) {
            case 'day':
                return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            case 'week':
                const weekNumber = this._getWeekNumber(date);
                return `${year}-W${String(weekNumber).padStart(2, '0')}`;
            case 'month':
                return `${year}-${String(month).padStart(2, '0')}`;
            case 'quarter':
                const quarter = Math.ceil(month / 3);
                return `${year}-Q${quarter}`;
            case 'year':
                return `${year}`;
            default:
                return date.toISOString().split('T')[0];
        }
    }

    _getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    _estimateCacheSize() {
        let size = 0;
        for (const [key, value] of this.aggregationCache.entries()) {
            size += key.length * 2; // Approximate string size
            size += JSON.stringify(value).length * 2; // Approximate object size
        }
        return size;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataAggregator;
}