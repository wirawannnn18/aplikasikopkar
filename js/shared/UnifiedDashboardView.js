/**
 * Unified Dashboard View
 * Requirements: 5.1, 5.2, 5.3 - Combined dashboard view with mode breakdown and trend analysis
 * 
 * Provides a unified dashboard that displays statistics and analytics for both manual 
 * and import payment transactions with mode differentiation and trend analysis.
 */

/**
 * Unified Dashboard View Class
 * Creates and manages the combined dashboard interface
 */
class UnifiedDashboardView {
    constructor(sharedServices) {
        this.sharedServices = sharedServices;
        this.containerId = null;
        this.refreshInterval = null;
        this.chartInstances = new Map();
        this.currentFilters = {
            dateRange: 'today',
            customDateFrom: null,
            customDateTo: null,
            mode: 'all',
            jenis: 'all'
        };
        
        // Chart colors for mode differentiation
        this.modeColors = {
            manual: '#0d6efd',    // Bootstrap primary blue
            import: '#198754',    // Bootstrap success green
            combined: '#6f42c1'   // Bootstrap purple
        };
        
        this.jenisColors = {
            hutang: '#dc3545',    // Bootstrap danger red
            piutang: '#fd7e14'    // Bootstrap warning orange
        };
    }

    /**
     * Render the unified dashboard
     * Requirements: 5.1, 5.2, 5.3
     * @param {string} containerId - Container element ID
     */
    render(containerId) {
        this.containerId = containerId;
        const container = document.getElementById(containerId);
        
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        container.innerHTML = `
            <style>
                .unified-dashboard {
                    background: #f8f9fa;
                    min-height: 100vh;
                    padding: 20px 0;
                }
                .dashboard-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px 0;
                    margin-bottom: 30px;
                    border-radius: 0 0 20px 20px;
                }
                .dashboard-title {
                    font-size: 2.5rem;
                    font-weight: 300;
                    margin-bottom: 10px;
                }
                .dashboard-subtitle {
                    font-size: 1.1rem;
                    opacity: 0.9;
                }
                .stats-card {
                    background: white;
                    border-radius: 15px;
                    padding: 25px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    border: none;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                    height: 100%;
                }
                .stats-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 15px rgba(0,0,0,0.15);
                }
                .stats-card-icon {
                    width: 60px;
                    height: 60px;
                    border-radius: 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    color: white;
                    margin-bottom: 20px;
                }
                .stats-card-title {
                    font-size: 0.9rem;
                    color: #6c757d;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 10px;
                    font-weight: 600;
                }
                .stats-card-value {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #2c3e50;
                    margin-bottom: 10px;
                }
                .stats-card-change {
                    font-size: 0.85rem;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .stats-card-change.positive {
                    color: #28a745;
                }
                .stats-card-change.negative {
                    color: #dc3545;
                }
                .stats-card-change.neutral {
                    color: #6c757d;
                }
                .chart-container {
                    background: white;
                    border-radius: 15px;
                    padding: 25px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    margin-bottom: 30px;
                }
                .chart-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #f8f9fa;
                }
                .chart-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #2c3e50;
                }
                .chart-canvas {
                    position: relative;
                    height: 300px;
                }
                .mode-breakdown {
                    display: flex;
                    gap: 15px;
                    margin-top: 15px;
                }
                .mode-item {
                    flex: 1;
                    text-align: center;
                    padding: 15px;
                    background: #f8f9fa;
                    border-radius: 10px;
                    border-left: 4px solid;
                }
                .mode-item.manual {
                    border-left-color: #0d6efd;
                }
                .mode-item.import {
                    border-left-color: #198754;
                }
                .mode-item-label {
                    font-size: 0.85rem;
                    color: #6c757d;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 5px;
                }
                .mode-item-value {
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #2c3e50;
                }
                .mode-item-count {
                    font-size: 0.9rem;
                    color: #6c757d;
                    margin-top: 5px;
                }
                .filter-controls {
                    background: white;
                    border-radius: 15px;
                    padding: 20px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    margin-bottom: 30px;
                }
                .filter-row {
                    display: flex;
                    gap: 15px;
                    align-items: end;
                    flex-wrap: wrap;
                }
                .filter-group {
                    flex: 1;
                    min-width: 200px;
                }
                .filter-label {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #495057;
                    margin-bottom: 8px;
                    display: block;
                }
                .filter-control {
                    width: 100%;
                    padding: 10px 15px;
                    border: 2px solid #e9ecef;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    transition: border-color 0.2s ease;
                }
                .filter-control:focus {
                    outline: none;
                    border-color: #0d6efd;
                    box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
                }
                .refresh-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border: none;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-weight: 600;
                    transition: transform 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .refresh-btn:hover {
                    transform: translateY(-1px);
                    color: white;
                }
                .loading-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255,255,255,0.9);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 15px;
                    z-index: 10;
                }
                .no-data-message {
                    text-align: center;
                    padding: 40px 20px;
                    color: #6c757d;
                }
                .no-data-icon {
                    font-size: 3rem;
                    margin-bottom: 15px;
                    opacity: 0.5;
                }
                @media (max-width: 768px) {
                    .dashboard-title {
                        font-size: 2rem;
                    }
                    .filter-row {
                        flex-direction: column;
                    }
                    .filter-group {
                        min-width: 100%;
                    }
                    .mode-breakdown {
                        flex-direction: column;
                    }
                    .stats-card-value {
                        font-size: 1.5rem;
                    }
                }
            </style>

            <div class="unified-dashboard">
                <!-- Dashboard Header -->
                <div class="dashboard-header">
                    <div class="container-fluid">
                        <div class="row">
                            <div class="col-12">
                                <h1 class="dashboard-title">
                                    <i class="bi bi-graph-up"></i> Dashboard Pembayaran Terintegrasi
                                </h1>
                                <p class="dashboard-subtitle">
                                    Analisis komprehensif pembayaran hutang dan piutang dengan breakdown mode manual dan import batch
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="container-fluid">
                    <!-- Filter Controls -->
                    <div class="filter-controls">
                        <div class="filter-row">
                            <div class="filter-group">
                                <label class="filter-label">Periode</label>
                                <select class="filter-control" id="dateRangeFilter">
                                    <option value="today">Hari Ini</option>
                                    <option value="yesterday">Kemarin</option>
                                    <option value="thisWeek">Minggu Ini</option>
                                    <option value="lastWeek">Minggu Lalu</option>
                                    <option value="thisMonth">Bulan Ini</option>
                                    <option value="lastMonth">Bulan Lalu</option>
                                    <option value="thisYear">Tahun Ini</option>
                                    <option value="custom">Kustom</option>
                                </select>
                            </div>
                            <div class="filter-group" id="customDateGroup" style="display: none;">
                                <label class="filter-label">Dari Tanggal</label>
                                <input type="date" class="filter-control" id="customDateFrom">
                            </div>
                            <div class="filter-group" id="customDateToGroup" style="display: none;">
                                <label class="filter-label">Sampai Tanggal</label>
                                <input type="date" class="filter-control" id="customDateTo">
                            </div>
                            <div class="filter-group">
                                <label class="filter-label">Mode Pembayaran</label>
                                <select class="filter-control" id="modeFilter">
                                    <option value="all">Semua Mode</option>
                                    <option value="manual">Manual</option>
                                    <option value="import">Import Batch</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label class="filter-label">Jenis</label>
                                <select class="filter-control" id="jenisFilter">
                                    <option value="all">Semua Jenis</option>
                                    <option value="hutang">Hutang</option>
                                    <option value="piutang">Piutang</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label class="filter-label">&nbsp;</label>
                                <button class="refresh-btn" id="refreshDashboard">
                                    <i class="bi bi-arrow-clockwise"></i>
                                    Refresh
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Statistics Cards -->
                    <div class="row mb-4" id="statsCardsContainer">
                        <!-- Stats cards will be rendered here -->
                    </div>

                    <!-- Charts Row -->
                    <div class="row">
                        <!-- Transaction Trend Chart -->
                        <div class="col-lg-8 mb-4">
                            <div class="chart-container">
                                <div class="chart-header">
                                    <h3 class="chart-title">
                                        <i class="bi bi-graph-up"></i> Trend Transaksi
                                    </h3>
                                    <div class="chart-legend" id="trendChartLegend"></div>
                                </div>
                                <div class="chart-canvas">
                                    <canvas id="trendChart"></canvas>
                                    <div class="loading-overlay d-none" id="trendChartLoading">
                                        <div class="spinner-border text-primary" role="status">
                                            <span class="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Mode Distribution Chart -->
                        <div class="col-lg-4 mb-4">
                            <div class="chart-container">
                                <div class="chart-header">
                                    <h3 class="chart-title">
                                        <i class="bi bi-pie-chart"></i> Distribusi Mode
                                    </h3>
                                </div>
                                <div class="chart-canvas">
                                    <canvas id="modeDistributionChart"></canvas>
                                    <div class="loading-overlay d-none" id="modeChartLoading">
                                        <div class="spinner-border text-primary" role="status">
                                            <span class="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Detailed Breakdown -->
                    <div class="row">
                        <!-- Payment Type Analysis -->
                        <div class="col-lg-6 mb-4">
                            <div class="chart-container">
                                <div class="chart-header">
                                    <h3 class="chart-title">
                                        <i class="bi bi-bar-chart"></i> Analisis Jenis Pembayaran
                                    </h3>
                                </div>
                                <div class="chart-canvas">
                                    <canvas id="jenisAnalysisChart"></canvas>
                                    <div class="loading-overlay d-none" id="jenisChartLoading">
                                        <div class="spinner-border text-primary" role="status">
                                            <span class="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Performance Metrics -->
                        <div class="col-lg-6 mb-4">
                            <div class="chart-container">
                                <div class="chart-header">
                                    <h3 class="chart-title">
                                        <i class="bi bi-speedometer2"></i> Metrik Performa
                                    </h3>
                                </div>
                                <div id="performanceMetrics">
                                    <!-- Performance metrics will be rendered here -->
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Mode Breakdown Summary -->
                    <div class="row">
                        <div class="col-12">
                            <div class="chart-container">
                                <div class="chart-header">
                                    <h3 class="chart-title">
                                        <i class="bi bi-list-check"></i> Ringkasan Breakdown Mode
                                    </h3>
                                </div>
                                <div class="mode-breakdown" id="modeBreakdownSummary">
                                    <!-- Mode breakdown will be rendered here -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Initialize event listeners
        this._setupEventListeners();

        // Load initial data
        this.refreshDashboard();

        // Set up auto-refresh
        this._setupAutoRefresh();
    }

    /**
     * Refresh dashboard data
     * Requirements: 5.1, 5.2, 5.3
     */
    async refreshDashboard() {
        try {
            this._showLoading(true);

            // Get filtered transaction data
            const filters = this._buildFilters();
            const transactions = this.sharedServices.getTransactionHistory(filters);
            const statistics = this.sharedServices.getTransactionStatistics(filters);

            // Render all components
            await Promise.all([
                this._renderStatsCards(statistics),
                this._renderTrendChart(transactions),
                this._renderModeDistributionChart(statistics),
                this._renderJenisAnalysisChart(statistics),
                this._renderPerformanceMetrics(statistics),
                this._renderModeBreakdownSummary(statistics)
            ]);

        } catch (error) {
            console.error('Error refreshing dashboard:', error);
            this._showError('Gagal memuat data dashboard');
        } finally {
            this._showLoading(false);
        }
    }

    /**
     * Render statistics cards
     * Requirements: 5.1, 5.2
     * @private
     */
    async _renderStatsCards(statistics) {
        const container = document.getElementById('statsCardsContainer');
        if (!container || !statistics) return;

        const cards = [
            {
                title: 'Total Transaksi',
                value: statistics.total.count.toLocaleString('id-ID'),
                icon: 'bi-receipt',
                color: '#667eea',
                change: this._calculateChange(statistics.total.count, 'count'),
                subtitle: `${statistics.manual.count} manual, ${statistics.import.count} import`
            },
            {
                title: 'Total Nilai',
                value: this._formatRupiah(statistics.total.amount),
                icon: 'bi-cash-stack',
                color: '#28a745',
                change: this._calculateChange(statistics.total.amount, 'amount'),
                subtitle: `Hutang: ${this._formatRupiah(statistics.total.hutang.amount)}, Piutang: ${this._formatRupiah(statistics.total.piutang.amount)}`
            },
            {
                title: 'Pembayaran Manual',
                value: statistics.manual.count.toLocaleString('id-ID'),
                icon: 'bi-person-check',
                color: '#0d6efd',
                change: this._calculateChange(statistics.manual.count, 'manual_count'),
                subtitle: this._formatRupiah(statistics.manual.amount)
            },
            {
                title: 'Import Batch',
                value: statistics.import.count.toLocaleString('id-ID'),
                icon: 'bi-upload',
                color: '#198754',
                change: this._calculateChange(statistics.import.count, 'import_count'),
                subtitle: this._formatRupiah(statistics.import.amount)
            }
        ];

        container.innerHTML = cards.map(card => `
            <div class="col-lg-3 col-md-6 mb-4">
                <div class="stats-card">
                    <div class="stats-card-icon" style="background: ${card.color}">
                        <i class="${card.icon}"></i>
                    </div>
                    <div class="stats-card-title">${card.title}</div>
                    <div class="stats-card-value">${card.value}</div>
                    <div class="stats-card-change ${card.change.type}">
                        <i class="bi ${card.change.icon}"></i>
                        ${card.change.text}
                    </div>
                    <div class="text-muted mt-2" style="font-size: 0.8rem;">
                        ${card.subtitle}
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render trend chart with mode differentiation
     * Requirements: 5.3
     * @private
     */
    async _renderTrendChart(transactions) {
        const canvas = document.getElementById('trendChart');
        if (!canvas || !transactions) return;

        // Destroy existing chart
        if (this.chartInstances.has('trend')) {
            this.chartInstances.get('trend').destroy();
        }

        // Prepare data by date and mode
        const trendData = this._prepareTrendData(transactions);

        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trendData.labels,
                datasets: [
                    {
                        label: 'Manual',
                        data: trendData.manual,
                        borderColor: this.modeColors.manual,
                        backgroundColor: this.modeColors.manual + '20',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Import Batch',
                        data: trendData.import,
                        borderColor: this.modeColors.import,
                        backgroundColor: this.modeColors.import + '20',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4
                    },
                    {
                        label: 'Total',
                        data: trendData.total,
                        borderColor: this.modeColors.combined,
                        backgroundColor: this.modeColors.combined + '20',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: ${this._formatRupiah(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Tanggal'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Nilai Transaksi'
                        },
                        ticks: {
                            callback: (value) => this._formatRupiah(value, true)
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });

        this.chartInstances.set('trend', chart);
    }

    /**
     * Render mode distribution chart
     * Requirements: 5.2
     * @private
     */
    async _renderModeDistributionChart(statistics) {
        const canvas = document.getElementById('modeDistributionChart');
        if (!canvas || !statistics) return;

        // Destroy existing chart
        if (this.chartInstances.has('modeDistribution')) {
            this.chartInstances.get('modeDistribution').destroy();
        }

        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Manual', 'Import Batch'],
                datasets: [{
                    data: [statistics.manual.amount, statistics.import.amount],
                    backgroundColor: [this.modeColors.manual, this.modeColors.import],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${this._formatRupiah(context.parsed)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        this.chartInstances.set('modeDistribution', chart);
    }

    /**
     * Render jenis analysis chart
     * Requirements: 5.2, 5.3
     * @private
     */
    async _renderJenisAnalysisChart(statistics) {
        const canvas = document.getElementById('jenisAnalysisChart');
        if (!canvas || !statistics) return;

        // Destroy existing chart
        if (this.chartInstances.has('jenisAnalysis')) {
            this.chartInstances.get('jenisAnalysis').destroy();
        }

        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Hutang', 'Piutang'],
                datasets: [
                    {
                        label: 'Manual',
                        data: [statistics.manual.hutang.amount, statistics.manual.piutang.amount],
                        backgroundColor: this.modeColors.manual,
                        borderRadius: 8
                    },
                    {
                        label: 'Import Batch',
                        data: [statistics.import.hutang.amount, statistics.import.piutang.amount],
                        backgroundColor: this.modeColors.import,
                        borderRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: ${this._formatRupiah(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Jenis Pembayaran'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Nilai Transaksi'
                        },
                        ticks: {
                            callback: (value) => this._formatRupiah(value, true)
                        }
                    }
                }
            }
        });

        this.chartInstances.set('jenisAnalysis', chart);
    }

    /**
     * Render performance metrics
     * Requirements: 5.1, 5.2, 5.3
     * @private
     */
    async _renderPerformanceMetrics(statistics) {
        const container = document.getElementById('performanceMetrics');
        if (!container || !statistics) return;

        // Calculate performance metrics
        const metrics = this._calculatePerformanceMetrics(statistics);

        container.innerHTML = `
            <div class="row">
                <div class="col-md-6 mb-3">
                    <div class="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                        <div>
                            <div class="text-muted small">Rata-rata per Transaksi</div>
                            <div class="h5 mb-0">${this._formatRupiah(metrics.averagePerTransaction)}</div>
                        </div>
                        <div class="text-primary">
                            <i class="bi bi-calculator fs-3"></i>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 mb-3">
                    <div class="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                        <div>
                            <div class="text-muted small">Efisiensi Import vs Manual</div>
                            <div class="h5 mb-0">${metrics.importEfficiency}%</div>
                        </div>
                        <div class="text-success">
                            <i class="bi bi-speedometer2 fs-3"></i>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 mb-3">
                    <div class="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                        <div>
                            <div class="text-muted small">Rasio Hutang vs Piutang</div>
                            <div class="h5 mb-0">${metrics.hutangPiutangRatio}</div>
                        </div>
                        <div class="text-info">
                            <i class="bi bi-pie-chart fs-3"></i>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 mb-3">
                    <div class="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                        <div>
                            <div class="text-muted small">Mode Dominan</div>
                            <div class="h5 mb-0">${metrics.dominantMode}</div>
                        </div>
                        <div class="text-warning">
                            <i class="bi bi-trophy fs-3"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render mode breakdown summary
     * Requirements: 5.2
     * @private
     */
    async _renderModeBreakdownSummary(statistics) {
        const container = document.getElementById('modeBreakdownSummary');
        if (!container || !statistics) return;

        container.innerHTML = `
            <div class="mode-item manual">
                <div class="mode-item-label">Pembayaran Manual</div>
                <div class="mode-item-value">${this._formatRupiah(statistics.manual.amount)}</div>
                <div class="mode-item-count">${statistics.manual.count} transaksi</div>
                <div class="mt-2 small">
                    <div>Hutang: ${this._formatRupiah(statistics.manual.hutang.amount)} (${statistics.manual.hutang.count})</div>
                    <div>Piutang: ${this._formatRupiah(statistics.manual.piutang.amount)} (${statistics.manual.piutang.count})</div>
                </div>
            </div>
            <div class="mode-item import">
                <div class="mode-item-label">Import Batch</div>
                <div class="mode-item-value">${this._formatRupiah(statistics.import.amount)}</div>
                <div class="mode-item-count">${statistics.import.count} transaksi</div>
                <div class="mt-2 small">
                    <div>Hutang: ${this._formatRupiah(statistics.import.hutang.amount)} (${statistics.import.hutang.count})</div>
                    <div>Piutang: ${this._formatRupiah(statistics.import.piutang.amount)} (${statistics.import.piutang.count})</div>
                </div>
            </div>
        `;
    }

    /**
     * Setup event listeners
     * @private
     */
    _setupEventListeners() {
        // Date range filter
        const dateRangeFilter = document.getElementById('dateRangeFilter');
        if (dateRangeFilter) {
            dateRangeFilter.addEventListener('change', (e) => {
                this._handleDateRangeChange(e.target.value);
            });
        }

        // Custom date inputs
        const customDateFrom = document.getElementById('customDateFrom');
        const customDateTo = document.getElementById('customDateTo');
        if (customDateFrom) {
            customDateFrom.addEventListener('change', () => {
                this.currentFilters.customDateFrom = customDateFrom.value;
                this.refreshDashboard();
            });
        }
        if (customDateTo) {
            customDateTo.addEventListener('change', () => {
                this.currentFilters.customDateTo = customDateTo.value;
                this.refreshDashboard();
            });
        }

        // Mode filter
        const modeFilter = document.getElementById('modeFilter');
        if (modeFilter) {
            modeFilter.addEventListener('change', (e) => {
                this.currentFilters.mode = e.target.value;
                this.refreshDashboard();
            });
        }

        // Jenis filter
        const jenisFilter = document.getElementById('jenisFilter');
        if (jenisFilter) {
            jenisFilter.addEventListener('change', (e) => {
                this.currentFilters.jenis = e.target.value;
                this.refreshDashboard();
            });
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshDashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshDashboard();
            });
        }
    }

    /**
     * Handle date range change
     * @private
     */
    _handleDateRangeChange(range) {
        this.currentFilters.dateRange = range;
        
        const customDateGroup = document.getElementById('customDateGroup');
        const customDateToGroup = document.getElementById('customDateToGroup');
        
        if (range === 'custom') {
            customDateGroup.style.display = 'block';
            customDateToGroup.style.display = 'block';
        } else {
            customDateGroup.style.display = 'none';
            customDateToGroup.style.display = 'none';
            this.currentFilters.customDateFrom = null;
            this.currentFilters.customDateTo = null;
        }
        
        this.refreshDashboard();
    }

    /**
     * Build filters for data queries
     * @private
     */
    _buildFilters() {
        const filters = {};
        
        // Date range filters
        const dateRange = this._getDateRange(this.currentFilters.dateRange);
        if (dateRange.from) filters.tanggalDari = dateRange.from;
        if (dateRange.to) filters.tanggalSampai = dateRange.to;
        
        // Custom date filters
        if (this.currentFilters.customDateFrom) {
            filters.tanggalDari = this.currentFilters.customDateFrom;
        }
        if (this.currentFilters.customDateTo) {
            filters.tanggalSampai = this.currentFilters.customDateTo;
        }
        
        // Mode filter
        if (this.currentFilters.mode !== 'all') {
            filters.mode = this.currentFilters.mode;
        }
        
        // Jenis filter
        if (this.currentFilters.jenis !== 'all') {
            filters.jenis = this.currentFilters.jenis;
        }
        
        return filters;
    }

    /**
     * Get date range based on selection
     * @private
     */
    _getDateRange(range) {
        const today = new Date();
        const result = {};
        
        switch (range) {
            case 'today':
                result.from = today.toISOString().split('T')[0];
                result.to = today.toISOString().split('T')[0];
                break;
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                result.from = yesterday.toISOString().split('T')[0];
                result.to = yesterday.toISOString().split('T')[0];
                break;
            case 'thisWeek':
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                result.from = startOfWeek.toISOString().split('T')[0];
                result.to = today.toISOString().split('T')[0];
                break;
            case 'lastWeek':
                const lastWeekStart = new Date(today);
                lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
                const lastWeekEnd = new Date(lastWeekStart);
                lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
                result.from = lastWeekStart.toISOString().split('T')[0];
                result.to = lastWeekEnd.toISOString().split('T')[0];
                break;
            case 'thisMonth':
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                result.from = startOfMonth.toISOString().split('T')[0];
                result.to = today.toISOString().split('T')[0];
                break;
            case 'lastMonth':
                const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                result.from = lastMonthStart.toISOString().split('T')[0];
                result.to = lastMonthEnd.toISOString().split('T')[0];
                break;
            case 'thisYear':
                const startOfYear = new Date(today.getFullYear(), 0, 1);
                result.from = startOfYear.toISOString().split('T')[0];
                result.to = today.toISOString().split('T')[0];
                break;
        }
        
        return result;
    }

    /**
     * Prepare trend data for chart
     * @private
     */
    _prepareTrendData(transactions) {
        const dateMap = new Map();
        
        transactions.forEach(transaction => {
            const date = transaction.tanggal;
            const amount = parseFloat(transaction.jumlah) || 0;
            const mode = transaction.mode || 'manual';
            
            if (!dateMap.has(date)) {
                dateMap.set(date, { manual: 0, import: 0, total: 0 });
            }
            
            const dayData = dateMap.get(date);
            dayData[mode] += amount;
            dayData.total += amount;
        });
        
        // Sort dates and prepare arrays
        const sortedDates = Array.from(dateMap.keys()).sort();
        
        return {
            labels: sortedDates,
            manual: sortedDates.map(date => dateMap.get(date).manual),
            import: sortedDates.map(date => dateMap.get(date).import),
            total: sortedDates.map(date => dateMap.get(date).total)
        };
    }

    /**
     * Calculate performance metrics
     * @private
     */
    _calculatePerformanceMetrics(statistics) {
        const totalTransactions = statistics.total.count;
        const totalAmount = statistics.total.amount;
        
        const averagePerTransaction = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
        
        // Import efficiency: ratio of import amount to total amount
        const importEfficiency = totalAmount > 0 ? 
            Math.round((statistics.import.amount / totalAmount) * 100) : 0;
        
        // Hutang vs Piutang ratio
        const hutangAmount = statistics.total.hutang.amount;
        const piutangAmount = statistics.total.piutang.amount;
        const hutangPiutangRatio = piutangAmount > 0 ? 
            `${Math.round(hutangAmount / piutangAmount * 100) / 100}:1` : 'N/A';
        
        // Dominant mode
        const dominantMode = statistics.manual.amount > statistics.import.amount ? 
            'Manual' : statistics.import.amount > statistics.manual.amount ? 
            'Import Batch' : 'Seimbang';
        
        return {
            averagePerTransaction,
            importEfficiency,
            hutangPiutangRatio,
            dominantMode
        };
    }

    /**
     * Calculate change percentage (placeholder for now)
     * @private
     */
    _calculateChange(currentValue, type) {
        // This would compare with previous period data
        // For now, return neutral change
        return {
            type: 'neutral',
            text: 'Tidak ada data pembanding',
            icon: 'bi-dash'
        };
    }

    /**
     * Format rupiah currency
     * @private
     */
    _formatRupiah(amount, short = false) {
        if (typeof window !== 'undefined' && typeof window.formatRupiah === 'function') {
            return window.formatRupiah(amount);
        }
        
        if (short && amount >= 1000000) {
            return `Rp ${(amount / 1000000).toFixed(1)}M`;
        } else if (short && amount >= 1000) {
            return `Rp ${(amount / 1000).toFixed(1)}K`;
        }
        
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    /**
     * Show loading state
     * @private
     */
    _showLoading(show) {
        const loadingElements = document.querySelectorAll('.loading-overlay');
        loadingElements.forEach(element => {
            if (show) {
                element.classList.remove('d-none');
            } else {
                element.classList.add('d-none');
            }
        });
    }

    /**
     * Show error message
     * @private
     */
    _showError(message) {
        console.error(message);
        // Use existing notification system if available
        if (typeof window.showAlert === 'function') {
            window.showAlert(message, 'danger');
        }
    }

    /**
     * Setup auto-refresh
     * @private
     */
    _setupAutoRefresh() {
        // Refresh every 5 minutes
        this.refreshInterval = setInterval(() => {
            this.refreshDashboard();
        }, 5 * 60 * 1000);
    }

    /**
     * Destroy the dashboard and cleanup
     */
    destroy() {
        // Clear refresh interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
        
        // Destroy all chart instances
        this.chartInstances.forEach(chart => {
            chart.destroy();
        });
        this.chartInstances.clear();
        
        // Clear container
        if (this.containerId) {
            const container = document.getElementById(this.containerId);
            if (container) {
                container.innerHTML = '';
            }
        }
    }
}

// Export for both browser and Node.js environments
if (typeof window !== 'undefined') {
    window.UnifiedDashboardView = UnifiedDashboardView;
}

// ES6 export for modern environments
export { UnifiedDashboardView };

// CommonJS export for compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UnifiedDashboardView };
}