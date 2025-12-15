/**
 * ReportManager - Mengelola reporting dan export functionality untuk transformasi barang
 * 
 * Kelas ini bertanggung jawab untuk menghasilkan laporan, export data, dan
 * menyediakan search/filtering functionality untuk transformation history.
 */

class ReportManager {
    constructor() {
        this.auditLogger = null; // Will be injected
        this.initialized = false;
        this.reportCache = new Map(); // Cache untuk performance
        this.exportFormats = ['csv', 'json', 'excel'];
    }

    /**
     * Initialize ReportManager dengan dependencies
     * @param {Object} dependencies - Object berisi dependencies
     * @param {AuditLogger} dependencies.auditLogger - AuditLogger instance
     */
    initialize(dependencies) {
        this.auditLogger = dependencies.auditLogger;
        this.initialized = true;
    }

    /**
     * Export transformation data ke format yang diminta
     * @param {Object} filters - Filter untuk data yang akan di-export
     * @param {string} format - Format export ('csv', 'json', 'excel')
     * @param {Object} options - Opsi tambahan untuk export
     * @returns {Promise<Object>} Object berisi data export dan metadata
     */
    async exportTransformationData(filters = {}, format = 'csv', options = {}) {
        this._ensureInitialized();
        
        try {
            // Validate format
            if (!this.exportFormats.includes(format)) {
                throw new Error(`Format export tidak didukung: ${format}. Format yang didukung: ${this.exportFormats.join(', ')}`);
            }

            // Get transformation history with filters
            const historyResult = await this.auditLogger.getTransformationHistory(filters);
            const transformations = historyResult.data;

            if (transformations.length === 0) {
                throw new Error('Tidak ada data transformasi yang ditemukan dengan filter yang diberikan');
            }

            let exportData;
            let mimeType;
            let fileExtension;

            switch (format) {
                case 'csv':
                    exportData = this._exportToCSV(transformations, options);
                    mimeType = 'text/csv';
                    fileExtension = 'csv';
                    break;
                case 'json':
                    exportData = this._exportToJSON(transformations, options);
                    mimeType = 'application/json';
                    fileExtension = 'json';
                    break;
                case 'excel':
                    exportData = this._exportToExcel(transformations, options);
                    mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                    fileExtension = 'xlsx';
                    break;
            }

            // Generate filename
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `transformasi_barang_${timestamp}.${fileExtension}`;

            return {
                data: exportData,
                metadata: {
                    filename,
                    mimeType,
                    format,
                    recordCount: transformations.length,
                    exportTimestamp: new Date().toISOString(),
                    filters: filters
                }
            };
        } catch (error) {
            console.error('Error exporting transformation data:', error);
            throw error;
        }
    }

    /**
     * Search dan filter transformation history dengan advanced options
     * @param {Object} searchCriteria - Kriteria pencarian
     * @param {string} [searchCriteria.searchTerm] - Term pencarian umum
     * @param {string} [searchCriteria.dateFrom] - Tanggal mulai
     * @param {string} [searchCriteria.dateTo] - Tanggal akhir
     * @param {string} [searchCriteria.product] - Filter berdasarkan produk
     * @param {string} [searchCriteria.user] - Filter berdasarkan user
     * @param {string} [searchCriteria.status] - Filter berdasarkan status
     * @param {string} [searchCriteria.transformationType] - Filter berdasarkan tipe transformasi
     * @param {string} [searchCriteria.sortBy] - Field untuk sorting
     * @param {string} [searchCriteria.sortOrder] - Order sorting ('asc' atau 'desc')
     * @param {number} [searchCriteria.limit] - Limit hasil
     * @param {number} [searchCriteria.offset] - Offset untuk pagination
     * @returns {Promise<Object>} Hasil pencarian dengan metadata
     */
    async searchTransformationHistory(searchCriteria = {}) {
        this._ensureInitialized();
        
        try {
            let results;

            // If there's a general search term, use search functionality
            if (searchCriteria.searchTerm) {
                results = await this.auditLogger.searchLogs(searchCriteria.searchTerm);
                // Filter only transformation logs
                results = results.filter(log => log.type === 'transformation');
            } else {
                // Use filtered history
                const historyResult = await this.auditLogger.getTransformationHistory(searchCriteria);
                results = historyResult.data;
            }

            // Apply additional filtering if needed
            if (searchCriteria.transformationType) {
                results = results.filter(log => 
                    log.metadata?.transformationType === searchCriteria.transformationType
                );
            }

            // Apply sorting
            if (searchCriteria.sortBy) {
                results = this._sortResults(results, searchCriteria.sortBy, searchCriteria.sortOrder || 'desc');
            }

            // Apply pagination
            const totalCount = results.length;
            const offset = searchCriteria.offset || 0;
            const limit = searchCriteria.limit || totalCount;
            const paginatedResults = results.slice(offset, offset + limit);

            // Enhance results with additional metadata
            const enhancedResults = paginatedResults.map(log => ({
                ...log,
                enhancedMetadata: {
                    transformationSummary: `${log.sourceItem.quantity} ${log.sourceItem.unit} → ${log.targetItem.quantity} ${log.targetItem.unit}`,
                    stockImpact: {
                        sourceStockChange: log.sourceItem.stockAfter - log.sourceItem.stockBefore,
                        targetStockChange: log.targetItem.stockAfter - log.targetItem.stockBefore
                    },
                    timeAgo: this._getTimeAgo(log.timestamp),
                    isRecent: this._isRecent(log.timestamp, 24) // Within 24 hours
                }
            }));

            return {
                data: enhancedResults,
                metadata: {
                    totalCount,
                    offset,
                    limit,
                    hasMore: offset + limit < totalCount,
                    searchCriteria,
                    searchTimestamp: new Date().toISOString()
                }
            };
        } catch (error) {
            console.error('Error searching transformation history:', error);
            throw error;
        }
    }

    /**
     * Generate comprehensive report dengan statistik dan analisis
     * @param {Object} reportOptions - Opsi untuk report
     * @param {string} [reportOptions.dateFrom] - Tanggal mulai
     * @param {string} [reportOptions.dateTo] - Tanggal akhir
     * @param {string} [reportOptions.groupBy] - Grouping ('daily', 'weekly', 'monthly', 'product', 'user')
     * @param {boolean} [reportOptions.includeCharts] - Include chart data
     * @returns {Promise<Object>} Comprehensive report
     */
    async generateComprehensiveReport(reportOptions = {}) {
        this._ensureInitialized();
        
        try {
            const cacheKey = JSON.stringify(reportOptions);
            
            // Check cache first
            if (this.reportCache.has(cacheKey)) {
                const cachedReport = this.reportCache.get(cacheKey);
                if (this._isCacheValid(cachedReport.timestamp)) {
                    return cachedReport.data;
                }
            }

            // Get transformation history
            const historyResult = await this.auditLogger.getTransformationHistory({
                dateFrom: reportOptions.dateFrom,
                dateTo: reportOptions.dateTo
            });
            const transformations = historyResult.data;

            // Generate basic statistics
            const basicStats = await this._generateBasicStatistics(transformations);
            
            // Generate grouped analysis
            const groupedAnalysis = await this._generateGroupedAnalysis(transformations, reportOptions.groupBy || 'daily');
            
            // Generate product analysis
            const productAnalysis = await this._generateProductAnalysis(transformations);
            
            // Generate user analysis
            const userAnalysis = await this._generateUserAnalysis(transformations);
            
            // Generate trend analysis
            const trendAnalysis = await this._generateTrendAnalysis(transformations);
            
            // Generate chart data if requested
            let chartData = null;
            if (reportOptions.includeCharts) {
                chartData = await this._generateChartData(transformations, reportOptions.groupBy || 'daily');
            }

            const report = {
                reportMetadata: {
                    generatedAt: new Date().toISOString(),
                    dateRange: {
                        from: reportOptions.dateFrom || (transformations.length > 0 ? transformations[transformations.length - 1].timestamp : null),
                        to: reportOptions.dateTo || (transformations.length > 0 ? transformations[0].timestamp : null)
                    },
                    totalRecords: transformations.length,
                    reportOptions
                },
                basicStatistics: basicStats,
                groupedAnalysis: groupedAnalysis,
                productAnalysis: productAnalysis,
                userAnalysis: userAnalysis,
                trendAnalysis: trendAnalysis,
                chartData: chartData
            };

            // Cache the report
            this.reportCache.set(cacheKey, {
                data: report,
                timestamp: new Date().toISOString()
            });

            return report;
        } catch (error) {
            console.error('Error generating comprehensive report:', error);
            throw error;
        }
    }

    /**
     * Generate summary report untuk dashboard
     * @param {number} days - Jumlah hari ke belakang
     * @returns {Promise<Object>} Summary report
     */
    async generateSummaryReport(days = 7) {
        this._ensureInitialized();
        
        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const historyResult = await this.auditLogger.getTransformationHistory({
                dateFrom: startDate.toISOString(),
                dateTo: endDate.toISOString()
            });
            const transformations = historyResult.data;

            const summary = {
                period: {
                    days,
                    from: startDate.toISOString(),
                    to: endDate.toISOString()
                },
                totals: {
                    transformations: transformations.length,
                    successful: transformations.filter(t => t.status === 'completed').length,
                    failed: transformations.filter(t => t.status === 'failed').length,
                    uniqueProducts: [...new Set(transformations.map(t => t.metadata?.baseProduct))].length,
                    uniqueUsers: [...new Set(transformations.map(t => t.user))].length
                },
                trends: {
                    dailyAverage: transformations.length / days,
                    successRate: transformations.length > 0 ? 
                        (transformations.filter(t => t.status === 'completed').length / transformations.length * 100).toFixed(2) : 0
                },
                topProducts: await this._getTopProducts(transformations, 5),
                topUsers: await this._getTopUsers(transformations, 5),
                recentActivity: transformations.slice(0, 10).map(t => ({
                    id: t.id,
                    timestamp: t.timestamp,
                    user: t.user,
                    summary: `${t.sourceItem.quantity} ${t.sourceItem.unit} → ${t.targetItem.quantity} ${t.targetItem.unit}`,
                    product: t.metadata?.baseProduct,
                    status: t.status
                }))
            };

            return summary;
        } catch (error) {
            console.error('Error generating summary report:', error);
            throw error;
        }
    }

    /**
     * Export ke format CSV dengan customization
     * @param {Object[]} transformations - Array transformasi
     * @param {Object} options - Opsi export
     * @returns {string} Data CSV
     * @private
     */
    _exportToCSV(transformations, options = {}) {
        const includeMetadata = options.includeMetadata !== false;
        const customFields = options.customFields || [];
        
        // Define standard headers
        const standardHeaders = [
            'ID Transformasi',
            'Timestamp',
            'User',
            'Status',
            'Produk Asal',
            'Unit Asal',
            'Jumlah Asal',
            'Stok Asal Sebelum',
            'Stok Asal Sesudah',
            'Produk Target',
            'Unit Target',
            'Jumlah Target',
            'Stok Target Sebelum',
            'Stok Target Sesudah',
            'Rasio Konversi',
            'Base Product'
        ];

        // Add metadata headers if requested
        const metadataHeaders = includeMetadata ? [
            'Tipe Transformasi',
            'Perubahan Stok Asal',
            'Perubahan Stok Target'
        ] : [];

        // Combine all headers
        const headers = [...standardHeaders, ...metadataHeaders, ...customFields];
        
        const csvRows = [headers.join(',')];
        
        transformations.forEach(log => {
            const standardRow = [
                log.transformationId || log.id,
                log.timestamp,
                log.user,
                log.status,
                `"${log.sourceItem.name}"`,
                log.sourceItem.unit,
                log.sourceItem.quantity,
                log.sourceItem.stockBefore,
                log.sourceItem.stockAfter,
                `"${log.targetItem.name}"`,
                log.targetItem.unit,
                log.targetItem.quantity,
                log.targetItem.stockBefore,
                log.targetItem.stockAfter,
                log.conversionRatio,
                log.metadata?.baseProduct || ''
            ];

            const metadataRow = includeMetadata ? [
                log.metadata?.transformationType || '',
                log.sourceItem.stockAfter - log.sourceItem.stockBefore,
                log.targetItem.stockAfter - log.targetItem.stockBefore
            ] : [];

            // Add custom fields (empty for now, can be extended)
            const customRow = customFields.map(() => '');

            const fullRow = [...standardRow, ...metadataRow, ...customRow];
            csvRows.push(fullRow.join(','));
        });
        
        return csvRows.join('\n');
    }

    /**
     * Export ke format JSON dengan enhancement
     * @param {Object[]} transformations - Array transformasi
     * @param {Object} options - Opsi export
     * @returns {string} Data JSON
     * @private
     */
    _exportToJSON(transformations, options = {}) {
        const includeMetadata = options.includeMetadata !== false;
        const prettify = options.prettify !== false;
        
        const exportData = {
            exportInfo: {
                timestamp: new Date().toISOString(),
                totalRecords: transformations.length,
                format: 'json',
                version: '1.0'
            },
            transformations: transformations.map(log => {
                const baseData = {
                    id: log.transformationId || log.id,
                    timestamp: log.timestamp,
                    user: log.user,
                    status: log.status,
                    sourceItem: log.sourceItem,
                    targetItem: log.targetItem,
                    conversionRatio: log.conversionRatio
                };

                if (includeMetadata) {
                    baseData.metadata = log.metadata;
                    baseData.enhancedInfo = {
                        transformationSummary: `${log.sourceItem.quantity} ${log.sourceItem.unit} → ${log.targetItem.quantity} ${log.targetItem.unit}`,
                        stockImpact: {
                            sourceChange: log.sourceItem.stockAfter - log.sourceItem.stockBefore,
                            targetChange: log.targetItem.stockAfter - log.targetItem.stockBefore
                        }
                    };
                }

                return baseData;
            })
        };
        
        return JSON.stringify(exportData, null, prettify ? 2 : 0);
    }

    /**
     * Export ke format Excel (simplified HTML table format)
     * @param {Object[]} transformations - Array transformasi
     * @param {Object} options - Opsi export
     * @returns {string} Data Excel HTML
     * @private
     */
    _exportToExcel(transformations, options = {}) {
        const includeMetadata = options.includeMetadata !== false;
        
        let html = `
        <html>
        <head>
            <meta charset="utf-8">
            <title>Laporan Transformasi Barang</title>
            <style>
                table { border-collapse: collapse; width: 100%; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                .number { text-align: right; }
            </style>
        </head>
        <body>
            <h1>Laporan Transformasi Barang</h1>
            <p>Digenerate pada: ${new Date().toLocaleString('id-ID')}</p>
            <p>Total Records: ${transformations.length}</p>
            
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Timestamp</th>
                        <th>User</th>
                        <th>Status</th>
                        <th>Produk Asal</th>
                        <th>Unit Asal</th>
                        <th>Jumlah</th>
                        <th>Stok Sebelum</th>
                        <th>Stok Sesudah</th>
                        <th>Produk Target</th>
                        <th>Unit Target</th>
                        <th>Jumlah</th>
                        <th>Stok Sebelum</th>
                        <th>Stok Sesudah</th>
                        <th>Rasio</th>`;
        
        if (includeMetadata) {
            html += `
                        <th>Base Product</th>
                        <th>Tipe Transformasi</th>`;
        }
        
        html += `
                    </tr>
                </thead>
                <tbody>`;
        
        transformations.forEach(log => {
            html += `
                    <tr>
                        <td>${log.transformationId || log.id}</td>
                        <td>${new Date(log.timestamp).toLocaleString('id-ID')}</td>
                        <td>${log.user}</td>
                        <td>${log.status}</td>
                        <td>${log.sourceItem.name}</td>
                        <td>${log.sourceItem.unit}</td>
                        <td class="number">${log.sourceItem.quantity}</td>
                        <td class="number">${log.sourceItem.stockBefore}</td>
                        <td class="number">${log.sourceItem.stockAfter}</td>
                        <td>${log.targetItem.name}</td>
                        <td>${log.targetItem.unit}</td>
                        <td class="number">${log.targetItem.quantity}</td>
                        <td class="number">${log.targetItem.stockBefore}</td>
                        <td class="number">${log.targetItem.stockAfter}</td>
                        <td class="number">${log.conversionRatio}</td>`;
            
            if (includeMetadata) {
                html += `
                        <td>${log.metadata?.baseProduct || ''}</td>
                        <td>${log.metadata?.transformationType || ''}</td>`;
            }
            
            html += `
                    </tr>`;
        });
        
        html += `
                </tbody>
            </table>
        </body>
        </html>`;
        
        return html;
    }

    /**
     * Generate basic statistics dari transformations
     * @param {Object[]} transformations - Array transformasi
     * @returns {Promise<Object>} Basic statistics
     * @private
     */
    async _generateBasicStatistics(transformations) {
        const stats = {
            total: transformations.length,
            successful: transformations.filter(t => t.status === 'completed').length,
            failed: transformations.filter(t => t.status === 'failed').length,
            pending: transformations.filter(t => t.status === 'pending').length,
            uniqueProducts: [...new Set(transformations.map(t => t.metadata?.baseProduct))].filter(Boolean).length,
            uniqueUsers: [...new Set(transformations.map(t => t.user))].filter(Boolean).length,
            dateRange: {
                earliest: transformations.length > 0 ? transformations[transformations.length - 1].timestamp : null,
                latest: transformations.length > 0 ? transformations[0].timestamp : null
            }
        };

        stats.successRate = stats.total > 0 ? (stats.successful / stats.total * 100).toFixed(2) : 0;
        stats.failureRate = stats.total > 0 ? (stats.failed / stats.total * 100).toFixed(2) : 0;

        return stats;
    }

    /**
     * Generate grouped analysis
     * @param {Object[]} transformations - Array transformasi
     * @param {string} groupBy - Grouping method
     * @returns {Promise<Object>} Grouped analysis
     * @private
     */
    async _generateGroupedAnalysis(transformations, groupBy) {
        const groups = {};

        transformations.forEach(t => {
            let groupKey;
            const date = new Date(t.timestamp);

            switch (groupBy) {
                case 'daily':
                    groupKey = date.toISOString().split('T')[0];
                    break;
                case 'weekly':
                    const weekStart = new Date(date);
                    weekStart.setDate(date.getDate() - date.getDay());
                    groupKey = weekStart.toISOString().split('T')[0];
                    break;
                case 'monthly':
                    groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    break;
                case 'product':
                    groupKey = t.metadata?.baseProduct || 'Unknown';
                    break;
                case 'user':
                    groupKey = t.user || 'Unknown';
                    break;
                default:
                    groupKey = 'all';
            }

            if (!groups[groupKey]) {
                groups[groupKey] = {
                    key: groupKey,
                    total: 0,
                    successful: 0,
                    failed: 0,
                    transformations: []
                };
            }

            groups[groupKey].total++;
            if (t.status === 'completed') groups[groupKey].successful++;
            if (t.status === 'failed') groups[groupKey].failed++;
            groups[groupKey].transformations.push(t);
        });

        // Calculate success rates
        Object.values(groups).forEach(group => {
            group.successRate = group.total > 0 ? (group.successful / group.total * 100).toFixed(2) : 0;
        });

        return {
            groupBy,
            groups: Object.values(groups).sort((a, b) => b.total - a.total)
        };
    }

    /**
     * Generate product analysis
     * @param {Object[]} transformations - Array transformasi
     * @returns {Promise<Object>} Product analysis
     * @private
     */
    async _generateProductAnalysis(transformations) {
        const productStats = {};

        transformations.forEach(t => {
            const product = t.metadata?.baseProduct || 'Unknown';
            
            if (!productStats[product]) {
                productStats[product] = {
                    product,
                    totalTransformations: 0,
                    successfulTransformations: 0,
                    failedTransformations: 0,
                    transformationTypes: {},
                    users: new Set()
                };
            }

            const stats = productStats[product];
            stats.totalTransformations++;
            
            if (t.status === 'completed') stats.successfulTransformations++;
            if (t.status === 'failed') stats.failedTransformations++;
            
            const transformationType = t.metadata?.transformationType || 'unknown';
            stats.transformationTypes[transformationType] = (stats.transformationTypes[transformationType] || 0) + 1;
            
            stats.users.add(t.user);
        });

        // Convert sets to counts and calculate rates
        const productAnalysis = Object.values(productStats).map(stats => ({
            ...stats,
            uniqueUsers: stats.users.size,
            successRate: stats.totalTransformations > 0 ? 
                (stats.successfulTransformations / stats.totalTransformations * 100).toFixed(2) : 0,
            users: undefined // Remove the Set object
        })).sort((a, b) => b.totalTransformations - a.totalTransformations);

        return {
            totalProducts: productAnalysis.length,
            products: productAnalysis
        };
    }

    /**
     * Generate user analysis
     * @param {Object[]} transformations - Array transformasi
     * @returns {Promise<Object>} User analysis
     * @private
     */
    async _generateUserAnalysis(transformations) {
        const userStats = {};

        transformations.forEach(t => {
            const user = t.user || 'Unknown';
            
            if (!userStats[user]) {
                userStats[user] = {
                    user,
                    totalTransformations: 0,
                    successfulTransformations: 0,
                    failedTransformations: 0,
                    products: new Set(),
                    transformationTypes: {}
                };
            }

            const stats = userStats[user];
            stats.totalTransformations++;
            
            if (t.status === 'completed') stats.successfulTransformations++;
            if (t.status === 'failed') stats.failedTransformations++;
            
            stats.products.add(t.metadata?.baseProduct || 'Unknown');
            
            const transformationType = t.metadata?.transformationType || 'unknown';
            stats.transformationTypes[transformationType] = (stats.transformationTypes[transformationType] || 0) + 1;
        });

        // Convert sets to counts and calculate rates
        const userAnalysis = Object.values(userStats).map(stats => ({
            ...stats,
            uniqueProducts: stats.products.size,
            successRate: stats.totalTransformations > 0 ? 
                (stats.successfulTransformations / stats.totalTransformations * 100).toFixed(2) : 0,
            products: undefined // Remove the Set object
        })).sort((a, b) => b.totalTransformations - a.totalTransformations);

        return {
            totalUsers: userAnalysis.length,
            users: userAnalysis
        };
    }

    /**
     * Generate trend analysis
     * @param {Object[]} transformations - Array transformasi
     * @returns {Promise<Object>} Trend analysis
     * @private
     */
    async _generateTrendAnalysis(transformations) {
        if (transformations.length === 0) {
            return { trend: 'no-data', analysis: 'Tidak ada data untuk analisis trend' };
        }

        // Group by day for trend analysis
        const dailyStats = {};
        transformations.forEach(t => {
            const date = new Date(t.timestamp).toISOString().split('T')[0];
            dailyStats[date] = (dailyStats[date] || 0) + 1;
        });

        const dates = Object.keys(dailyStats).sort();
        const values = dates.map(date => dailyStats[date]);

        if (values.length < 2) {
            return { trend: 'insufficient-data', analysis: 'Data tidak cukup untuk analisis trend' };
        }

        // Simple trend calculation
        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        
        const trendPercentage = ((secondAvg - firstAvg) / firstAvg * 100).toFixed(2);
        
        let trend, analysis;
        if (trendPercentage > 10) {
            trend = 'increasing';
            analysis = `Trend meningkat ${trendPercentage}% dari periode awal ke periode akhir`;
        } else if (trendPercentage < -10) {
            trend = 'decreasing';
            analysis = `Trend menurun ${Math.abs(trendPercentage)}% dari periode awal ke periode akhir`;
        } else {
            trend = 'stable';
            analysis = `Trend relatif stabil dengan perubahan ${trendPercentage}%`;
        }

        return {
            trend,
            analysis,
            trendPercentage: parseFloat(trendPercentage),
            dailyData: dates.map(date => ({
                date,
                count: dailyStats[date]
            }))
        };
    }

    /**
     * Generate chart data untuk visualization
     * @param {Object[]} transformations - Array transformasi
     * @param {string} groupBy - Grouping method
     * @returns {Promise<Object>} Chart data
     * @private
     */
    async _generateChartData(transformations, groupBy) {
        const groupedAnalysis = await this._generateGroupedAnalysis(transformations, groupBy);
        
        return {
            labels: groupedAnalysis.groups.map(g => g.key),
            datasets: [
                {
                    label: 'Total Transformations',
                    data: groupedAnalysis.groups.map(g => g.total),
                    type: 'bar'
                },
                {
                    label: 'Successful Transformations',
                    data: groupedAnalysis.groups.map(g => g.successful),
                    type: 'bar'
                },
                {
                    label: 'Success Rate (%)',
                    data: groupedAnalysis.groups.map(g => parseFloat(g.successRate)),
                    type: 'line'
                }
            ]
        };
    }

    /**
     * Get top products by transformation count
     * @param {Object[]} transformations - Array transformasi
     * @param {number} limit - Limit hasil
     * @returns {Promise<Object[]>} Top products
     * @private
     */
    async _getTopProducts(transformations, limit = 5) {
        const productCounts = {};
        
        transformations.forEach(t => {
            const product = t.metadata?.baseProduct || 'Unknown';
            productCounts[product] = (productCounts[product] || 0) + 1;
        });

        return Object.entries(productCounts)
            .map(([product, count]) => ({ product, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    /**
     * Get top users by transformation count
     * @param {Object[]} transformations - Array transformasi
     * @param {number} limit - Limit hasil
     * @returns {Promise<Object[]>} Top users
     * @private
     */
    async _getTopUsers(transformations, limit = 5) {
        const userCounts = {};
        
        transformations.forEach(t => {
            const user = t.user || 'Unknown';
            userCounts[user] = (userCounts[user] || 0) + 1;
        });

        return Object.entries(userCounts)
            .map(([user, count]) => ({ user, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    /**
     * Sort results berdasarkan field dan order
     * @param {Object[]} results - Array hasil
     * @param {string} sortBy - Field untuk sorting
     * @param {string} sortOrder - Order ('asc' atau 'desc')
     * @returns {Object[]} Sorted results
     * @private
     */
    _sortResults(results, sortBy, sortOrder) {
        return results.sort((a, b) => {
            let aValue = this._getNestedValue(a, sortBy);
            let bValue = this._getNestedValue(b, sortBy);

            // Handle different data types
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    }

    /**
     * Get nested value dari object menggunakan dot notation
     * @param {Object} obj - Object
     * @param {string} path - Path dengan dot notation
     * @returns {*} Value
     * @private
     */
    _getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }

    /**
     * Check if timestamp is recent (within specified hours)
     * @param {string} timestamp - ISO timestamp
     * @param {number} hours - Hours threshold
     * @returns {boolean} True if recent
     * @private
     */
    _isRecent(timestamp, hours) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffHours = (now - time) / (1000 * 60 * 60);
        return diffHours <= hours;
    }

    /**
     * Get human-readable time ago string
     * @param {string} timestamp - ISO timestamp
     * @returns {string} Time ago string
     * @private
     */
    _getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Baru saja';
        if (diffMins < 60) return `${diffMins} menit yang lalu`;
        if (diffHours < 24) return `${diffHours} jam yang lalu`;
        if (diffDays < 30) return `${diffDays} hari yang lalu`;
        return time.toLocaleDateString('id-ID');
    }

    /**
     * Check if cached report is still valid
     * @param {string} cacheTimestamp - Cache timestamp
     * @returns {boolean} True if valid
     * @private
     */
    _isCacheValid(cacheTimestamp) {
        const now = new Date();
        const cacheTime = new Date(cacheTimestamp);
        const diffMinutes = (now - cacheTime) / (1000 * 60);
        return diffMinutes < 15; // Cache valid for 15 minutes
    }

    /**
     * Clear report cache
     */
    clearCache() {
        this.reportCache.clear();
    }

    /**
     * Memastikan ReportManager sudah diinisialisasi
     * @private
     */
    _ensureInitialized() {
        if (!this.initialized) {
            throw new Error('ReportManager belum diinisialisasi. Panggil initialize() terlebih dahulu.');
        }
    }
}

// Export untuk browser dan Node.js
if (typeof window !== 'undefined') {
    window.ReportManager = ReportManager;
}

// ES6 module export (commented out for browser compatibility)
// export default ReportManager;